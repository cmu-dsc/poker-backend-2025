data "archive_file" "elo_function_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../elo-function"
  output_path = "${path.module}/elo_function.zip"
  excludes    = [".venv", "__pycache__", "*.pyc", "*.pyo", "*.pyd"]
}

# SQS Queue
resource "aws_sqs_queue" "match_results_queue" {
  name                        = "match-results-queue.fifo"
  fifo_queue                   = true
  content_based_deduplication = true
  deduplication_scope         = "messageGroup"
  fifo_throughput_limit        = "perMessageGroupId"

  tags = var.tags
}

# Lambda Function
resource "aws_lambda_function" "elo_update_function" {
  filename          = data.archive_file.elo_function_zip.output_path
  function_name    = "elo-update-function"
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.elo_function_zip.output_base64sha256
  runtime          = "python3.12"

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
      }
    ]
  })
}

# Lambda Event Source Mapping
resource "aws_lambda_event_source_mapping" "sqs_lambda_trigger" {
  event_source_arn = aws_sqs_queue.match_results_queue.arn
  function_name    = aws_lambda_function.elo_update_function.arn
  batch_size       = var.batch_size
}