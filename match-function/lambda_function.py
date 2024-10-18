import json
import os
import resource
import signal
import subprocess
import sys
import logging
from logging.handlers import RotatingFileHandler

import boto3

current_dir = os.path.dirname(os.path.abspath(__file__))
poker_engine_dir = os.path.join(current_dir, "poker-engine-2025")
sys.path.append(poker_engine_dir)

from run import run_api_match

s3 = boto3.client("s3")
sqs = boto3.client("sqs")

AGENT_BUCKET = os.environ["POKER_AGENTS_BUCKET"]
LOG_BUCKET = os.environ["POKER_LOGS_BUCKET"]
SQS_QUEUE_URL = os.environ["SQS_QUEUE_URL"]

# Add logger configuration
def setup_match_logger(match_id):
    logger = logging.getLogger(f'match_{match_id}')
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    file_handler = RotatingFileHandler(f'/tmp/match_{match_id}.log', maxBytes=1024*1024, backupCount=5)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

def setup_player_logger(match_id, player_id):
    logger = logging.getLogger(f'player_{player_id}')
    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    file_handler = RotatingFileHandler(f'/tmp/match_{match_id}_{player_id}.log', maxBytes=1024*1024, backupCount=5)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

    return logger

def set_memory_limit():
    memory_limit = 2 * 1024 * 1024 * 1024  # 2GB in bytes
    resource.setrlimit(resource.RLIMIT_AS, (memory_limit, memory_limit))


def lambda_handler(event, context):
    player1_key = event.get("player1_key")
    player2_key = event.get("player2_key")
    player1_id = event.get("player1_id")
    player2_id = event.get("player2_id")
    match_id = event.get("match_id")

    if not all([player1_key, player2_key, player1_id, player2_id, match_id]):
        return {"statusCode": 400, "body": json.dumps("Error: s3 keys, player IDs, and match_id must be provided in the event.")}

    match_logger = setup_match_logger(match_id)
    player1_logger = setup_player_logger(match_id, player1_id)
    player2_logger = setup_player_logger(match_id, player2_id)

    match_log_path = f'/tmp/match_{match_id}.log'
    player1_log_path = f'/tmp/match_{match_id}_{player1_id}.log'
    player2_log_path = f'/tmp/match_{match_id}_{player2_id}.log'

    player1_path = "/tmp/player1.py"
    player2_path = "/tmp/player2.py"

    try:
        s3.download_file(AGENT_BUCKET, player1_key, player1_path)
        s3.download_file(AGENT_BUCKET, player2_key, player2_path)

        match_logger.info("Starting agents")
        processes = []
        for i, (player_file, player_logger) in enumerate([
            ("player1", player1_logger),
            ("player2", player2_logger)
        ]):
            process = subprocess.Popen(
                [
                    sys.executable,
                    "-c",
                    f"from run import run_api_bot; from {player_file} import PlayerAgent; run_api_bot(PlayerAgent, {8000 + i}, logger=player_logger)",
                ],
                preexec_fn=lambda: (os.setsid(), set_memory_limit()),
            )
            processes.append(process)

        match_logger.info("Starting match")
        result = run_api_match("http://127.0.0.1:8000", "http://127.0.0.1:8001", logger=match_logger)

        match_logger.info("Terminating agents")
        for process in processes:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)

        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)

        # Upload log files to S3
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
            "match_id": match_id
        }
        sqs.send_message(QueueUrl=SQS_QUEUE_URL, MessageBody=json.dumps(message))

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Match completed successfully",
                "result": result
            }),
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
        "match_id": "test_match_001"
    }
    print(lambda_handler(test_event, None))
