import json
import os
import resource
import signal
import subprocess
import sys

import boto3

s3 = boto3.client("s3")

BUCKET_NAME = "poker-agents-2025"

current_dir = os.path.dirname(os.path.abspath(__file__))
poker_engine_dir = os.path.join(current_dir, "poker-engine-2025")
sys.path.append(poker_engine_dir)

from run import run_api_match


def set_memory_limit():
    memory_limit = 2 * 1024 * 1024 * 1024  # 2GB in bytes
    resource.setrlimit(resource.RLIMIT_AS, (memory_limit, memory_limit))


def lambda_handler(event, context):
    player1_key = event.get("player1_key")
    player2_key = event.get("player2_key")

    if not (player1_key and player2_key):
        return {"statusCode": 400, "body": json.dumps("Error: s3 keys for both players must be provided in the event.")}

    player1_path = "/tmp/player1.py"
    player2_path = "/tmp/player2.py"

    try:
        s3.download_file(BUCKET_NAME, player1_key, player1_path)
        s3.download_file(BUCKET_NAME, player2_key, player2_path)

        print("Starting agents")
        processes = []
        for i, player_file in enumerate(["player1", "player2"]):
            process = subprocess.Popen(
                [
                    sys.executable,
                    "-c",
                    f"from run import run_api_bot; from {player_file} import PlayerAgent; run_api_bot(PlayerAgent, {8000 + i})",
                ],
                preexec_fn=lambda: (os.setsid(), set_memory_limit()),
            )
            processes.append(process)

        print("Starting match")
        result = run_api_match("http://127.0.0.1:8000", "http://127.0.0.1:8001")

        print("Terminating agents")
        for process in processes:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)

        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)

        return {"statusCode": 200, "body": json.dumps({"message": "Match completed successfully", "result": result})}
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return {"statusCode": 500, "body": json.dumps(f"An error occurred: {str(e)}")}


if __name__ == "__main__":
    test_event = {"player1_key": "test_player1.py", "player2_key": "test_player2.py"}
    print(lambda_handler(test_event, None))
