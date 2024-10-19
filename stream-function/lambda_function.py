import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
log_table = dynamodb.Table(os.environ["LOG_TABLE_NAME"])


def lambda_handler(event, context):
    match_id = event["queryStringParameters"]["match_id"]
    last_timestamp = Decimal(event["queryStringParameters"].get("last_timestamp", "0"))

    logs = get_logs(match_id, last_timestamp)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive"},
        "body": format_sse(logs),
    }


def get_logs(match_id, last_timestamp):
    response = log_table.query(
        KeyConditionExpression=Key("match_id").eq(match_id) & Key("timestamp").gt(last_timestamp), ScanIndexForward=True
    )
    return response["Items"]


def format_sse(logs):
    return "".join([f"data: {json.dumps(log, default=decimal_default)}\n\n" for log in logs])


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError
