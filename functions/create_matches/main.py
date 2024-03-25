import time
import functions_framework
import random
from google.cloud import bigquery
from kubernetes import client, watch
from google.auth import compute_engine
from google.auth.transport.requests import Request
from concurrent.futures import ThreadPoolExecutor
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

    # Set up the BigQuery client
    bigquery_client = bigquery.Client(project="pokerai-417521")

    # Query the teams table to get all teams
    query = "SELECT githubUsername, elo FROM pokerai-417521.poker_dataset.teams"
    query_job = bigquery_client.query(query)
    teams = list(query_job.result())

    # Sort teams by MMR
    teams.sort(key=lambda x: x["elo"])

    # Prepare for matchmaking
    matched_teams = set()
    team_pairs = []

    for i, team in enumerate(teams):
        if team["githubUsername"] not in matched_teams:
            # Find up to the next three teams in the list that haven't been matched yet
            potential_opponents = [
                teams[j]
                for j in range(i + 1, min(i + 4, len(teams)))
                if teams[j]["githubUsername"] not in matched_teams
            ]
            if potential_opponents:
                # Randomly select an opponent from the potential matches
                opponent = random.choice(potential_opponents)
                team_pairs.append((team["githubUsername"], opponent["githubUsername"]))
                # Mark both teams as matched
                matched_teams.update(
                    [team["githubUsername"], opponent["githubUsername"]]
                )
            else:
                # If no potential opponents are available (likely at the end of the list), match with any unmatched team
                remaining_teams = [
                    t for t in teams if t["githubUsername"] not in matched_teams
                ]
                if remaining_teams:
                    opponentName = random.choice(list(matched_teams))
                    team_pairs.append((team["githubUsername"], opponentName))
                    matched_teams.update([team["githubUsername"]])

    # Create a ThreadPoolExecutor to run matches concurrently
    with ThreadPoolExecutor() as executor:
        # Submit match tasks to the executor
        match_futures = [
            executor.submit(
                create_match, team1, team2, apps_v1, core_v1, bigquery_client
            )
            for team1, team2 in team_pairs
        ]

    # Wait for all match futures to complete
    for future in match_futures:
        future.result()

    return {"message": "Matches created successfully"}


def create_match(team1, team2, apps_v1, core_v1, bigquery_client):
    # Generate a unique match_id using a combination of team names and current timestamp
    match_id = f"{team1}-{team2}-{int(time.time())}"

    # Create the bot Deployments and Services
    bot1_deployment, bot1_service, bot1_uuid = create_bot_resources(team1)
    bot2_deployment, bot2_service, bot2_uuid = create_bot_resources(team2)
    apps_v1.create_namespaced_deployment(namespace="default", body=bot1_deployment)
    apps_v1.create_namespaced_deployment(namespace="default", body=bot2_deployment)
    core_v1.create_namespaced_service(namespace="default", body=bot1_service)
    core_v1.create_namespaced_service(namespace="default", body=bot2_service)

    # Create the game engine Pod
    game_engine_pod = create_game_engine_pod(
        team1, team2, match_id, bot1_uuid, bot2_uuid
    )
    core_v1.create_namespaced_pod(namespace="default", body=game_engine_pod)

    print("CREATED pod")

    # Watch for the game engine pod status
    w = watch.Watch()
    for event in w.stream(
        core_v1.list_namespaced_pod,
        namespace="default",
        field_selector=f"metadata.name=engine-{match_id}",
    ):
        pod = event["object"]
        if pod.status.phase == "Succeeded" or pod.status.phase == "Failed":
            w.stop()
            break

    # Retrieve the match result from BigQuery
    match_result_query = f"SELECT team1Bankroll, team2Bankroll FROM pokerai-417521.poker_dataset.matches WHERE matchId = '{match_id}'"
    match_result_job = bigquery_client.query(match_result_query)
    match_result = list(match_result_job.result())

    # Determine the winner based on the bankroll
    team1_bankroll = match_result[0]["team1Bankroll"]
    team2_bankroll = match_result[0]["team2Bankroll"]
    if team1_bankroll > team2_bankroll:
        winner = team1
    else:
        winner = team2

    # Update the MMR of the teams based on the match result
    update_mmr(team1, team2, winner, bigquery_client)

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
    apps_v1.delete_namespaced_pod(name=f"engine-{match_id}", namespace="default")


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


def create_game_engine_pod(team1, team2, match_id, bot1_uuid, bot2_uuid):
    with open("engine_pod.yaml") as f:
        pod_yaml = f.read()
    pod_yaml = (
        pod_yaml.replace("{{TEAM1}}", team1)
        .replace("{{TEAM2}}", team2)
        .replace("{{MATCH_ID}}", match_id)
    )
    pod_yaml = pod_yaml.replace("{{BOT1_UUID}}", bot1_uuid).replace(
        "{{BOT2_UUID}}", bot2_uuid
    )
    pod = yaml.safe_load(pod_yaml)
    return pod


def update_mmr(team1, team2, winner, bigquery_client):
    # Retrieve the current MMR of the teams
    mmr_query = f"SELECT githubUsername, elo FROM pokerai-417521.poker_dataset.teams WHERE githubUsername IN ('{team1}', '{team2}')"
    mmr_job = bigquery_client.query(mmr_query)
    mmr_results = list(mmr_job.result())

    team1_mmr = [r["elo"] for r in mmr_results if r["githubUsername"] == team1][0]
    team2_mmr = [r["elo"] for r in mmr_results if r["githubUsername"] == team2][0]

    # Calculate the expected scores using the Elo rating formula
    team1_expected = 1 / (1 + 10 ** ((team2_mmr - team1_mmr) / 400))
    team2_expected = 1 / (1 + 10 ** ((team1_mmr - team2_mmr) / 400))

    # Determine the actual scores based on the match result
    if winner == team1:
        team1_actual = 1
        team2_actual = 0
    else:
        team1_actual = 0
        team2_actual = 1

    # Calculate the updated MMR using the Elo rating formula
    k_factor = 32  # Adjust the K-factor as needed
    team1_updated_mmr = int(team1_mmr + k_factor * (team1_actual - team1_expected))
    team2_updated_mmr = int(team2_mmr + k_factor * (team2_actual - team2_expected))

    # Update the MMR in the BigQuery table
    update_query = f"""
        UPDATE pokerai-417521.poker_dataset.teams
        SET elo = CASE
            WHEN githubUsername = '{team1}' THEN {team1_updated_mmr}
            WHEN githubUsername = '{team2}' THEN {team2_updated_mmr}
        END
        WHERE githubUsername IN ('{team1}', '{team2}')
    """
    bigquery_client.query(update_query).result()
