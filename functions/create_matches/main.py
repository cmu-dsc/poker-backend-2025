import time
import functions_framework
from kubernetes import client, watch
from google.auth import compute_engine
from google.auth.transport.requests import Request
from google.cloud import artifactregistry_v1
from google.cloud.sql.connector import Connector
from concurrent.futures import ThreadPoolExecutor
import sqlalchemy
import uuid
import yaml


@functions_framework.http
def create_matches(request):
    # Use the Application Default Credentials (ADC)
    credentials = compute_engine.Credentials()

    # Configure the Kubernetes client to use the ADC
    configuration = client.Configuration()
    configuration.host = "https://34.85.198.243"  # Use your GKE cluster endpoint
    configuration.verify_ssl = False  # Consider the security implications in production
    credentials.refresh(Request())
    configuration.api_key = {"authorization": "Bearer " + credentials.token}

    # Set the default configuration
    client.Configuration.set_default(configuration)

    # Create the Kubernetes API clients
    api_client = client.ApiClient()
    apps_v1 = client.AppsV1Api(api_client)
    core_v1 = client.CoreV1Api(api_client)

    # Set up the Cloud SQL Connector
    instance_connection_name = "pokerai-417521:us-east4:pokerai-sql"
    db_user = "root"
    db_pass = ".YFHUMhVJry#'SDt"
    db_name = "pokerai-db"

    with Connector() as connector:

        def getconn() -> sqlalchemy.engine.base.Connection:
            conn = connector.connect(
                instance_connection_name,
                "pymysql",
                user=db_user,
                password=db_pass,
                db=db_name,
            )
            return conn

        pool = sqlalchemy.create_engine(
            "mysql+pymysql://",
            creator=getconn,
        )

        with pool.connect() as db_conn:
            # Query the TeamDao table to get all teams and their rolling winrate
            query = sqlalchemy.text("""
                SELECT t.githubUsername, 
                    COALESCE(SUM(CASE WHEN tm.teamId = t.githubUsername AND tm.bankroll > (
                                        SELECT tm2.bankroll
                                        FROM TeamMatchDao tm2
                                        WHERE tm2.matchId = tm.matchId AND tm2.teamId <> t.githubUsername
                                    ) THEN 1 ELSE 0 END) / 
                            NULLIF(COUNT(tm.id), 0), 0) AS rolling_winrate
                FROM TeamDao t
                LEFT JOIN (
                    SELECT tm.*
                    FROM TeamMatchDao tm
                    JOIN (
                        SELECT matchId
                        FROM MatchDao
                        ORDER BY timestamp DESC
                        LIMIT 5
                    ) m ON tm.matchId = m.matchId
                ) tm ON t.githubUsername = tm.teamId
                GROUP BY t.githubUsername
                ORDER BY rolling_winrate DESC
            """)
            teams = db_conn.execute(query).fetchall()

    # Filter out teams without valid images
    teams_with_images = [team for team in teams if team_has_image(team[0])]

    # Prepare for matchmaking
    team_pairs = []

    # Pair teams with the closest rolling winrate
    for i in range(0, len(teams_with_images) - 1, 2):
        team1 = teams_with_images[i][0]
        team2 = teams_with_images[i + 1][0]
        team_pairs.append((team1, team2))

    # If there is an odd number of teams, pair the last team with the second to last team
    if len(teams_with_images) % 2 != 0:
        team1 = teams_with_images[-1][0]
        team2 = teams_with_images[-2][0]
        team_pairs.append((team1, team2))

    # Create a ThreadPoolExecutor to run matches concurrently
    with ThreadPoolExecutor() as executor:
        # Submit match tasks to the executor
        match_futures = [
            executor.submit(
                create_match,
                team1,
                team2,
                apps_v1,
                core_v1,
                api_client,
            )
            for team1, team2 in team_pairs
        ]

    # Wait for all match futures to complete
    for future in match_futures:
        future.result()

    return {"message": "Matches created successfully"}


def team_has_image(team_name):
    client = artifactregistry_v1.ArtifactRegistryClient()
    repository = f"projects/pokerai-417521/locations/us-east4/repositories/{team_name}"
    image_name = "pokerbot"
    tag = "latest"

    try:
        client.get_tag(
            request={"name": f"{repository}/packages/{image_name}/tags/{tag}"}
        )
        return True
    except Exception as e:
        print(f"Team {team_name} does not have a valid image: {str(e)}")
        return False


def create_match(team1, team2, apps_v1, core_v1, api_client):
    # Generate a unique match_id using a combination of team names and current timestamp
    match_id = f"{team1}-{team2}-{int(time.time())}"

    # Create the bot Deployments and Services
    bot1_deployment, bot1_service, bot1_uuid = create_bot_resources(team1)
    bot2_deployment, bot2_service, bot2_uuid = create_bot_resources(team2)
    apps_v1.create_namespaced_deployment(namespace="default", body=bot1_deployment)
    apps_v1.create_namespaced_deployment(namespace="default", body=bot2_deployment)
    core_v1.create_namespaced_service(namespace="default", body=bot1_service)
    core_v1.create_namespaced_service(namespace="default", body=bot2_service)

    # Create the game engine Job
    game_engine_job = create_game_engine_job(
        team1, team2, match_id, bot1_uuid, bot2_uuid
    )
    batch_v1 = client.BatchV1Api(api_client)
    batch_v1.create_namespaced_job(namespace="default", body=game_engine_job)

    print("CREATED job")

    # Watch for the game engine job status
    w = watch.Watch()
    for event in w.stream(
        batch_v1.list_namespaced_job,
        namespace="default",
        field_selector=f"metadata.name=engine-{match_id}",
    ):
        job = event["object"]
        if job.status.succeeded or job.status.failed:
            w.stop()
            break

    # Delete the bot Deployments and Services
    apps_v1.delete_namespaced_deployment(
        name=f"{team1}-bot-{bot1_uuid}", namespace="default"
    )
    apps_v1.delete_namespaced_deployment(
        name=f"{team2}-bot-{bot2_uuid}", namespace="default"
    )
    core_v1.delete_namespaced_service(
        name=f"{team1}-bot-service-{bot1_uuid}", namespace="default"
    )
    core_v1.delete_namespaced_service(
        name=f"{team2}-bot-service-{bot2_uuid}", namespace="default"
    )
    batch_v1.delete_namespaced_job(name=f"engine-{match_id}", namespace="default")

    # List the Pods associated with the Job
    pod_list = core_v1.list_namespaced_pod(
        namespace="default", label_selector=f"job-name=engine-{match_id}"
    )

    # Delete each Pod individually
    for pod in pod_list.items:
        core_v1.delete_namespaced_pod(name=pod.metadata.name, namespace="default")


def create_bot_resources(team_name):
    # Generate a unique UUID for the bot resources
    bot_uuid = uuid.uuid4().hex[:8]

    with open("bot_deployment.yaml") as f:
        deployment_yaml = f.read()
    deployment_yaml = deployment_yaml.replace("{{TEAM_NAME}}", team_name).replace(
        "{{BOT_UUID}}", bot_uuid
    )
    deployment = yaml.safe_load(deployment_yaml)

    with open("bot_service.yaml") as f:
        service_yaml = f.read()
    service_yaml = service_yaml.replace("{{TEAM_NAME}}", team_name).replace(
        "{{BOT_UUID}}", bot_uuid
    )
    service = yaml.safe_load(service_yaml)

    return deployment, service, bot_uuid


def create_game_engine_job(team1, team2, match_id, bot1_uuid, bot2_uuid):
    with open("engine_job.yaml") as f:
        job_yaml = f.read()
    job_yaml = (
        job_yaml.replace("{{TEAM1}}", team1)
        .replace("{{TEAM2}}", team2)
        .replace("{{MATCH_ID}}", match_id)
    )
    job_yaml = job_yaml.replace("{{BOT1_UUID}}", bot1_uuid).replace(
        "{{BOT2_UUID}}", bot2_uuid
    )
    job = yaml.safe_load(job_yaml)
    return job
