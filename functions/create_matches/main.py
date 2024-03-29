import datetime
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

# Generates STRESS_TEST_COUNT teams, named STRESS_TEST_TEAMNAME{0-STRESS_TEST_COUNT},
# that use the bot of STRESS_TEST_TEAMNAME. Plays these teams against each other
STRESS_TEST = True
STRESS_TEST_COUNT = 100
STRESS_TEST_TEAMNAME = "jespiron"


# Create matches for regular scrimmage
# Pairs teams with close win rates
@functions_framework.http
def create_matches(request):
    create_matches_internal(get_team_pairs_scrimmage, "scrim")


# Create matches for stage 1 of final tournament
# Round robin between all teams (or top K > 8 teams from scrimmage, prioritized by win rate over past 6 games)
# Matches will be tagged with prefix `final1-` in their matchId, so that our calculate_final_pnl script can
# identify them.
@functions_framework.http
def create_matches_final_stage1(request):
    create_matches_internal(get_team_pairs_round_robin, "final1")


# Create matches for stage 2 of final tournament
# Round robin between top 8 teams from stage 1
# TODO: In calculate_final_pnl.py, need some way of marking the top 8 teams from stage 1, so that
#       we are able to pull them here.
@functions_framework.http
def create_matches_final_stage_2(request):
    create_matches_internal(get_team_pairs_round_robin, "final2")


# Shared logic for create_matches and create_matches_final
# @param get_team_pairs: Function that pairs teams (scrimmage, round_robin, etc)
# @param stage: Prefix that gets prepended to the matchIds, to identify which
#               stage of the game out of {"scrim", "final1", "final2"}.
def create_matches_internal(get_team_pairs, stage):
    # Use the Application Default Credentials (ADC)
    credentials = compute_engine.Credentials()

    # Configure the Kubernetes client to use the ADC
    configuration = client.Configuration()
    configuration.host = "https://35.186.176.96"  # Use your GKE cluster endpoint
    configuration.verify_ssl = False  # Consider the security implications in production
    credentials.refresh(Request())
    configuration.api_key = {"authorization": "Bearer " + credentials.token}

    # Set the default configuration
    client.Configuration.set_default(configuration)

    # Create the Kubernetes API clients
    api_client = client.ApiClient()
    apps_v1 = client.AppsV1Api(api_client)
    core_v1 = client.CoreV1Api(api_client)
    batch_v1 = client.BatchV1Api(api_client)

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

    if STRESS_TEST:
        for i in range(STRESS_TEST_COUNT):
            if(len(teams_with_images) == STRESS_TEST_COUNT):
                break
            print(f"{STRESS_TEST_TEAMNAME}{i}")
            teams_with_images.append((f"{STRESS_TEST_TEAMNAME}{i}", None))

    # Prepare for matchmaking
    team_pairs = get_team_pairs(teams_with_images)

    # Create all resources for each match
    match_resources = []
    for team1, team2 in team_pairs:
        match_id = f"{stage}-{team1}-{team2}-{int(time.time())}"
        bot1_deployment, bot1_service, bot1_uuid = create_bot_resources(team1)
        bot2_deployment, bot2_service, bot2_uuid = create_bot_resources(team2)
        game_engine_job = create_game_engine_job(
            team1, team2, match_id, bot1_uuid, bot2_uuid
        )

        apps_v1.create_namespaced_deployment(namespace="default", body=bot1_deployment)
        apps_v1.create_namespaced_deployment(namespace="default", body=bot2_deployment)
        core_v1.create_namespaced_service(namespace="default", body=bot1_service)
        core_v1.create_namespaced_service(namespace="default", body=bot2_service)
        batch_v1.create_namespaced_job(namespace="default", body=game_engine_job)

        match_resources.append((team1, team2, bot1_uuid, bot2_uuid, match_id))

    # Create a ThreadPoolExecutor to monitor matches concurrently
    with ThreadPoolExecutor() as executor:
        # Submit monitoring tasks to the executor
        monitoring_futures = [
            executor.submit(
                monitor_match,
                apps_v1,
                core_v1,
                batch_v1,
                team1,
                team2,
                bot1_uuid,
                bot2_uuid,
                match_id,
            )
            for team1, team2, bot1_uuid, bot2_uuid, match_id in match_resources
        ]

    # Wait for all monitoring futures to complete
    for future in monitoring_futures:
        future.result()

    return {"message": "Matches created successfully"}    

def monitor_match(
    apps_v1, core_v1, batch_v1, team1, team2, bot1_uuid, bot2_uuid, match_id
):
    bot_deployments = {team1: False, team2: False}
    failed_deployments = []
    deployment_ages = {}

    # Watch for bot deployment status
    w_deployments = watch.Watch()
    for event in w_deployments.stream(
        apps_v1.list_namespaced_deployment,
        namespace="default",
        field_selector=f"metadata.name={team1}-bot-{bot1_uuid},metadata.name={team2}-bot-{bot2_uuid}",
    ):
        deployment = event["object"]
        team_name = deployment.metadata.name.split("-bot-")[0]

        # Calculate the age of the deployment
        creation_timestamp = deployment.metadata.creation_timestamp
        age = (
            datetime.datetime.now(datetime.timezone.utc) - creation_timestamp
        ).total_seconds()
        deployment_ages[team_name] = age

        if deployment.status.conditions:
            for condition in deployment.status.conditions:
                if (
                    condition.type == "ReplicaFailure"
                    and condition.reason == "CrashLoopBackOff"
                    and age > 120  # Adjust the age threshold as needed
                ):
                    print(
                        f"Bot deployment {deployment.metadata.name} failed due to CrashLoopBackOff"
                    )
                    failed_deployments.append(team_name)
                    delete_bot_resources(
                        apps_v1,
                        core_v1,
                        team_name,
                        bot1_uuid if team_name == team1 else bot2_uuid,
                    )
                    break

        if deployment.status.available_replicas == 1:
            bot_deployments[team_name] = True

        if all(bot_deployments.values()) or len(failed_deployments) > 0:
            w_deployments.stop()
            break

    # If all bot deployments failed, delete the game engine job and return
    if len(failed_deployments) >= 2:
        delete_game_engine_job(batch_v1, core_v1, match_id)
        return "failed"

    # Watch for game engine job status
    w_job = watch.Watch()
    for event in w_job.stream(
        batch_v1.list_namespaced_job,
        namespace="default",
        field_selector=f"metadata.name=engine-{match_id}",
    ):
        job = event["object"]
        if job.status.succeeded:
            print(f"Match {match_id} succeeded")
            break
        if job.status.failed:
            print(f"Match {match_id} failed")
            break

        # Delete bot resources for successful deployments
    for team_name in bot_deployments.keys():
        if team_name not in failed_deployments:
            delete_bot_resources(
                apps_v1,
                core_v1,
                team_name,
                bot1_uuid if team_name == team1 else bot2_uuid,
            )

    delete_game_engine_job(batch_v1, core_v1, match_id)


def get_team_pairs_scrimmage(teams):
    team_pairs = []
    # Pair teams with the closest rolling winrate
    for i in range(0, len(teams) - 1, 2):
        team1 = teams[i][0]
        team2 = teams[i + 1][0]
        team_pairs.append((team1, team2))

    # If there is an odd number of teams, pair the last team with the second to last team
    if len(teams) % 2 != 0:
        team1 = teams[-1][0]
        team2 = teams[-2][0]
        team_pairs.append((team1, team2))
    return team_pairs


# Every contestant plays every other contestant
def get_team_pairs_round_robin(teams):
    team_pairs = []
    for i in range(len(teams)):
        for j in range(i + 1, len(teams)):
            team1 = teams[i][0]
            team2 = teams[j][0]
            team_pairs.append((team1, team2))
    return team_pairs


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


def delete_bot_resources(apps_v1, core_v1, team_name, bot_uuid):
    apps_v1.delete_namespaced_deployment(
        name=f"{team_name}-bot-{bot_uuid}", namespace="default"
    )
    core_v1.delete_namespaced_service(
        name=f"{team_name}-bot-service-{bot_uuid}", namespace="default"
    )


def delete_game_engine_job(batch_v1, core_v1, match_id):
    batch_v1.delete_namespaced_job(name=f"engine-{match_id}", namespace="default")
    pod_list = core_v1.list_namespaced_pod(
        namespace="default", label_selector=f"job-name=engine-{match_id}"
    )
    for pod in pod_list.items:
        core_v1.delete_namespaced_pod(name=pod.metadata.name, namespace="default")


def create_bot_resources(team_name):
    # Generate a unique UUID for the bot resources
    bot_uuid = uuid.uuid4().hex[:8]

    if STRESS_TEST:
        team_name = STRESS_TEST_TEAMNAME

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
