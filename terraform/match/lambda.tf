resource "aws_lambda_function" "match_function" {
  function_name = "match-function"
  role          = aws_iam_role.match_lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"

  s3_bucket = var.lambda_code_bucket
  s3_key    = var.lambda_code_key

  environment {
    variables = {
      POKER_AGENTS_BUCKET  = var.poker_agents_bucket_id
      POKER_LOGS_BUCKET    = var.poker_logs_bucket_id
      SQS_QUEUE_URL        = var.sqs_queue_url
      APPSYNC_API_ENDPOINT = aws_appsync_graphql_api.match_logs_api.uris["GRAPHQL"]
      APPSYNC_API_KEY      = aws_appsync_api_key.match_logs_api_key.key
    }
  }

  tags = var.tags
}
