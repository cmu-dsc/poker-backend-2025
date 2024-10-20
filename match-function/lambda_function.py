import importlib.util
import json
import logging
import multiprocessing
import os
import sys
import zipfile
from decimal import Decimal
from logging.handlers import RotatingFileHandler

import boto3
import requests

current_dir = os.path.dirname(os.path.abspath(__file__))
poker_engine_dir = os.path.join(current_dir, "poker-engine-2025")
sys.path.append(poker_engine_dir)

from run import run_api_bot, run_api_match

s3 = boto3.client("s3")
sqs = boto3.client("sqs")

AGENT_BUCKET = os.environ["POKER_AGENTS_BUCKET"]
LOG_BUCKET = os.environ["POKER_LOGS_BUCKET"]
SQS_QUEUE_URL = os.environ["SQS_QUEUE_URL"]
APPSYNC_API_ENDPOINT = os.environ["APPSYNC_API_ENDPOINT"]
APPSYNC_API_KEY = os.environ["APPSYNC_API_KEY"]


def call_appsync_mutation(match_id, timestamp, message, level):
    mutation = """
    mutation AddLog($match_id: ID!, $timestamp: AWSTimestamp!, $message: String!, $level: String!) {
        addLog(match_id: $match_id, timestamp: $timestamp, message: $message, level: $level) {
            match_id
            timestamp
            message
            level
        }
    }
    """
    variables = {"match_id": match_id, "timestamp": int(timestamp), "message": message, "level": level}
    payload = {"query": mutation, "variables": variables}
    headers = {"Content-Type": "application/json", "x-api-key": APPSYNC_API_KEY}
    response = requests.post(APPSYNC_API_ENDPOINT, json=payload, headers=headers)
    if response.status_code != 200:
        raise Exception(f"GraphQL mutation failed: {response.text}")
    return response.json()


class AppSyncHandler(logging.Handler):
    def __init__(self, match_id):
        super().__init__()
        self.match_id = match_id

    def emit(self, record):
        try:
            message = self.format(record)
            timestamp = Decimal(str(record.created))
            call_appsync_mutation(self.match_id, timestamp, message, record.levelname)
        except Exception:
            self.handleError(record)


def setup_match_logger(match_id):
    logger = logging.getLogger(f"match_{match_id}")
    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    file_handler = RotatingFileHandler(f"/tmp/match_{match_id}.log", maxBytes=1024 * 1024, backupCount=5)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    appsync_handler = AppSyncHandler(match_id)
    appsync_handler.setLevel(logging.DEBUG)
    appsync_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    logger.addHandler(appsync_handler)

    return logger


def setup_player_logger(match_id, player_id):
    logger = logging.getLogger(f"player_{player_id}")
    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    file_handler = RotatingFileHandler(f"/tmp/match_{match_id}_{player_id}.log", maxBytes=1024 * 1024, backupCount=5)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger


def download_and_extract_agent(s3_key, player_dir):
    zip_path = f"/tmp/{s3_key.split('/')[-1]}"
    s3.download_file(AGENT_BUCKET, s3_key, zip_path)
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(player_dir)
    os.remove(zip_path)


def run_agent(player_dir, port, logger, player_id):
    sys.path.append(player_dir)
    module_name = f"player_{player_id}"
    spec = importlib.util.spec_from_file_location(module_name, os.path.join(player_dir, "player.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    PlayerAgent = getattr(module, "PlayerAgent")
    run_api_bot(PlayerAgent, port, logger)


def lambda_handler(event, context):
    player1_key = event.get("player1_key")
    player2_key = event.get("player2_key")
    player1_id = event.get("player1_id")
    player2_id = event.get("player2_id")
    match_id = event.get("match_id")

    if not all([player1_key, player2_key, player1_id, player2_id, match_id]):
        return {
            "statusCode": 400,
            "body": json.dumps("Error: s3 keys, player IDs, and match_id must be provided in the event."),
        }

    match_logger = setup_match_logger(match_id)
    player1_logger = setup_player_logger(match_id, player1_id)
    player2_logger = setup_player_logger(match_id, player2_id)

    match_log_path = f"/tmp/match_{match_id}.log"
    player1_log_path = f"/tmp/match_{match_id}_{player1_id}.log"
    player2_log_path = f"/tmp/match_{match_id}_{player2_id}.log"

    player1_dir = "./player1"
    player2_dir = "./player2"

    try:
        # download_and_extract_agent(player1_key, player1_dir)
        # download_and_extract_agent(player2_key, player2_dir)

        match_logger.info("Starting agents")
        processes = []
        for i, (player_dir, player_logger, player_id) in enumerate(
            [(player1_dir, player1_logger, player1_id), (player2_dir, player2_logger, player2_id)]
        ):
            process = multiprocessing.Process(target=run_agent, args=(player_dir, 8000 + i, player_logger, player_id))
            process.start()
            processes.append(process)

        match_logger.info("Starting match")
        result = run_api_match("http://127.0.0.1:8000", "http://127.0.0.1:8001", logger=match_logger)

        match_logger.info("Terminating agents")
        for process in processes:
            process.terminate()

        match_log_key = f"match_logs/match_{match_id}.log"
        player1_log_key = f"match_logs/match_{match_id}_{player1_id}.log"
        player2_log_key = f"match_logs/match_{match_id}_{player2_id}.log"

        s3.upload_file(match_log_path, LOG_BUCKET, match_log_key)
        s3.upload_file(player1_log_path, LOG_BUCKET, player1_log_key)
        s3.upload_file(player2_log_path, LOG_BUCKET, player2_log_key)

        message = {
            "result": result["outcome"],
            "player1_id": player1_id,
            "player2_id": player2_id,
            "match_id": match_id,
        }
        sqs.send_message(QueueUrl=SQS_QUEUE_URL, MessageBody=json.dumps(message))

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Match completed successfully", "result": result}),
        }
    except Exception as e:
        match_logger.exception(f"An error occurred: {str(e)}")
        return {"statusCode": 500, "body": json.dumps(f"An error occurred: {str(e)}")}


if __name__ == "__main__":
    test_event = {
        "player1_key": "test_player1.py",
        "player2_key": "test_player2.py",
        "player1_id": "test_player1",
        "player2_id": "test_player2",
        "match_id": "test_match_001",
    }
    print(lambda_handler(test_event, None))
