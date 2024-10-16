import boto3
import psycopg
import os
import json

sqs = boto3.client("sqs")

# Environment variables
DB_HOST = os.environ["DB_HOST"]
DB_NAME = os.environ["DB_NAME"]
DB_USER = os.environ["DB_USER"]
DB_PASSWORD = os.environ["DB_PASSWORD"]
SQS_QUEUE_URL = os.environ["SQS_QUEUE_URL"]


def connect_to_db():
    """Establish a connection to the PostgreSQL database."""
    return psycopg.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)


def calculate_new_elo(player_elo, opponent_elo, result):
    """
    Calculate the new Elo rating for a player.

    Args:
        player_elo (int): Current Elo rating of the player
        opponent_elo (int): Current Elo rating of the opponent
        result (str): 'win' or 'loss'

    Returns:
        int: New Elo rating for the player
    """
    k_factor = 32
    expected = 1 / (1 + 10 ** ((opponent_elo - player_elo) / 400))
    score = 1 if result == "win" else 0
    new_elo = player_elo + k_factor * (score - expected)
    return round(new_elo)


def lambda_handler(event, context):
    conn = connect_to_db()

    try:
        with conn.cursor() as cur:
            for record in event["Records"]:
                message = json.loads(record["body"])
                match_id = message["match_id"]
                player1_id = message["player1_id"]
                player2_id = message["player2_id"]
                result = message["result"]

                # Check if this match has already been processed
                cur.execute("SELECT processed FROM matches WHERE match_id = %s", (match_id,))
                match_processed = cur.fetchone()

                if match_processed and match_processed[0]:
                    print(f"Match {match_id} already processed, skipping.")
                    continue

                # Fetch Elo ratings for both players in a single query
                cur.execute(
                    "SELECT player_id, elo_rating FROM players WHERE player_id IN (%s, %s)", (player1_id, player2_id)
                )
                player_ratings = dict(cur.fetchall())

                player1_elo = player_ratings[player1_id]
                player2_elo = player_ratings[player2_id]

                # Calculate new Elo ratings
                player1_new_elo = calculate_new_elo(player1_elo, player2_elo, result)
                player2_new_elo = calculate_new_elo(player2_elo, player1_elo, "loss" if result == "win" else "win")

                # Update Elo ratings and mark match as processed in a single transaction
                cur.execute(
                    """
                    BEGIN;
                    UPDATE players SET elo_rating = CASE 
                        WHEN player_id = %s THEN %s 
                        WHEN player_id = %s THEN %s 
                    END WHERE player_id IN (%s, %s);
                    INSERT INTO matches (match_id, processed) VALUES (%s, TRUE)
                    ON CONFLICT (match_id) DO UPDATE SET processed = TRUE;
                    COMMIT;
                    """,
                    (player1_id, player1_new_elo, player2_id, player2_new_elo, player1_id, player2_id, match_id),
                )

            conn.commit()

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        conn.close()

    return {"statusCode": 200, "body": "Elo ratings updated successfully"}
