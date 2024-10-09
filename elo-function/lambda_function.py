import boto3
import psycopg2
import os
import json
from psycopg2 import sql

sqs = boto3.client("sqs")

# Environment variables
DB_HOST = os.environ["DB_HOST"]
DB_NAME = os.environ["DB_NAME"]
DB_USER = os.environ["DB_USER"]
DB_PASSWORD = os.environ["DB_PASSWORD"]
SQS_QUEUE_URL = os.environ["SQS_QUEUE_URL"]


def connect_to_db():
    """Establish a connection to the PostgreSQL database."""
    return psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)


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


def update_elo_in_db(conn, player_id, new_elo):
    """
    Update the Elo rating for a player in the database.

    Args:
        conn (psycopg2.connection): Database connection
        player_id (int): ID of the player
        new_elo (int): New Elo rating to be set
    """
    with conn.cursor() as cur:
        update_query = sql.SQL("UPDATE players SET elo_rating = %s WHERE player_id = %s")
        cur.execute(update_query, (new_elo, player_id))
    conn.commit()


def lambda_handler(event, context):
    """
    AWS Lambda handler function to process match results and update Elo ratings.

    Args:
        event (dict): AWS Lambda event object
        context (object): AWS Lambda context object

    Returns:
        dict: Response object with status code and message
    """
    conn = connect_to_db()

    try:
        with conn.cursor() as cur:
            for record in event["Records"]:
                message = record["body"]
                match_result = json.loads(message)

                player1_id = match_result["player1_id"]
                player2_id = match_result["player2_id"]
                result = match_result["result"]

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

                # Update Elo ratings in a single transaction
                cur.execute(
                    "UPDATE players SET elo_rating = CASE "
                    "WHEN player_id = %s THEN %s "
                    "WHEN player_id = %s THEN %s "
                    "END WHERE player_id IN (%s, %s)",
                    (player1_id, player1_new_elo, player2_id, player2_new_elo, player1_id, player2_id),
                )

            conn.commit()

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        conn.close()

    return {"statusCode": 200, "body": "Elo ratings updated successfully"}
