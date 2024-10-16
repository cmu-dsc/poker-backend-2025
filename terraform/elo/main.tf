# SQS Queue
resource "aws_sqs_queue" "match_results_queue" {
  name = "match-results-queue"
  tags = var.tags
}

# Lambda Function
resource "aws_lambda_function" "elo_update_function" {
  function_name = "elo-update-function"
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"

  s3_bucket = var.lambda_code_bucket
  s3_key    = var.lambda_code_key

  environment {
    variables = {
      DB_HOST       = var.db_host
      DB_NAME       = "pokerbotsdb"
      DB_USER       = var.db_username
      DB_PASSWORD   = var.db_password
      SQS_QUEUE_URL = aws_sqs_queue.match_results_queue.url
    }
  }

  tags = var.tags
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "elo_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "elo_lambda_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.match_results_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement"
        ]
        Resource = var.db_host_arn
      }
    ]
  })
}

# Lambda Event Source Mapping
resource "aws_lambda_event_source_mapping" "sqs_lambda_trigger" {
  event_source_arn                   = aws_sqs_queue.match_results_queue.arn
  function_name                      = aws_lambda_function.elo_update_function.arn
  batch_size                         = var.batch_size
  maximum_batching_window_in_seconds = var.maximum_batching_window_in_seconds
  enabled                            = true
}
