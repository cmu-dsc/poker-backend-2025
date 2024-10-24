import asyncio
import importlib.util
import json
import logging
import multiprocessing
import os
import sys
import zipfile
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from logging.handlers import RotatingFileHandler

import aiohttp
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
APPSYNC_API_ENDPOINT = os.environ["APPSYNC_API_ENDPOINT"]
APPSYNC_API_KEY = os.environ["APPSYNC_API_KEY"]


async def call_appsync_mutation(match_id, timestamp, message, level):
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

    async with aiohttp.ClientSession() as session:
        async with session.post(APPSYNC_API_ENDPOINT, json=payload, headers=headers) as response:
            if response.status != 200:
                raise Exception(f"GraphQL mutation failed: {await response.text()}")
            return await response.json()


class AppSyncHandler(logging.Handler):
    def __init__(self, match_id):
        super().__init__()
        self.match_id = match_id
        self.queue = asyncio.Queue()
        self.executor = ThreadPoolExecutor(max_workers=1)
        self.running = True
        self.background_task = self.executor.submit(self.background_worker)

    def emit(self, record):
        try:
            message = self.format(record)
            timestamp = Decimal(str(record.created))
            self.queue.put_nowait((self.match_id, timestamp, message, record.levelname))
        except Exception:
            self.handleError(record)

    def background_worker(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        async def process_queue():
            while self.running or not self.queue.empty():
                try:
                    match_id, timestamp, message, level = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                    try:
                        await call_appsync_mutation(match_id, timestamp, message, level)
                    except Exception:
                        self.handleError(None)
                    finally:
                        self.queue.task_done()
                except asyncio.TimeoutError:
                    continue

        loop.run_until_complete(process_queue())

    def close(self):
        self.running = False
        self.background_task.result()
        self.executor.shutdown(wait=True)
        super().close()


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

    return logger, appsync_handler


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
    PlayerAgent.run(port, logger)


def upload_logs(match_id, player1_id, player2_id):
    match_log_key = f"match_logs/match_{match_id}.log"
    player1_log_key = f"match_logs/match_{match_id}_{player1_id}.log"
    player2_log_key = f"match_logs/match_{match_id}_{player2_id}.log"

    s3.upload_file(f"/tmp/match_{match_id}.log", LOG_BUCKET, match_log_key)
    s3.upload_file(f"/tmp/match_{match_id}_{player1_id}.log", LOG_BUCKET, player1_log_key)
    s3.upload_file(f"/tmp/match_{match_id}_{player2_id}.log", LOG_BUCKET, player2_log_key)


def send_result_to_sqs(result, player1_id, player2_id, match_id):
    message = {
        "result": result["outcome"],
        "player1_id": player1_id,
        "player2_id": player2_id,
        "match_id": match_id,
    }
    sqs.send_message(QueueUrl=SQS_QUEUE_URL, MessageBody=json.dumps(message))


def run_match(player1_key, player2_key, player1_id, player2_id, match_id):
    match_logger, appsync_handler = setup_match_logger(match_id)
    player1_logger = setup_player_logger(match_id, player1_id)
    player2_logger = setup_player_logger(match_id, player2_id)

    player1_dir = "/tmp/player1"
    player2_dir = "/tmp/player2"

    try:
        download_and_extract_agent(player1_key, player1_dir)
        download_and_extract_agent(player2_key, player2_dir)

        match_logger.info("Starting agents")
        process1 = multiprocessing.Process(target=run_agent, args=(player1_dir, 8000, player1_logger, player1_id))
        process2 = multiprocessing.Process(target=run_agent, args=(player2_dir, 8001, player2_logger, player2_id))
        process1.start()
        process2.start()

        match_logger.info("Starting match")
        result = run_api_match("http://127.0.0.1:8000", "http://127.0.0.1:8001", match_logger)

        match_logger.info("Terminating agents")
        process1.terminate()
        process2.terminate()

        upload_logs(match_id, player1_id, player2_id)
        send_result_to_sqs(result, player1_id, player2_id, match_id)

        return {"message": "Match completed successfully", "result": result}
    except Exception as e:
        match_logger.exception(f"An error occurred: {str(e)}")
        return {"error": f"An error occurred: {str(e)}"}
    finally:
        if appsync_handler:
            appsync_handler.close()


if __name__ == "__main__":
    player1_key = os.getenv("PLAYER1_KEY", "test_player1")
    player2_key = os.getenv("PLAYER2_KEY", "test_player2")
    player1_id = os.getenv("PLAYER1_ID", "test_player1")
    player2_id = os.getenv("PLAYER2_ID", "test_player2")
    match_id = os.getenv("MATCH_ID", "test_match_001")

    result = run_match(player1_key, player2_key, player1_id, player2_id, match_id)
    print(json.dumps(result))
