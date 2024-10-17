resource "aws_lambda_function" "match_function" {
  function_name = "match-function"
  role          = aws_iam_role.match_lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"

  s3_bucket = var.lambda_code_bucket
  s3_key    = var.lambda_code_key

  environment {
    variables = {
      POKER_AGENTS_BUCKET = var.poker_agents_bucket_id
      POKER_LOGS_BUCKET   = var.poker_logs_bucket_id
      SQS_QUEUE_URL       = var.sqs_queue_url
    }
  }

  tags = var.tags
}

resource "aws_iam_role" "match_lambda_role" {
  name = "match_lambda_role"

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

resource "aws_iam_role_policy" "match_lambda_policy" {
  name = "match_lambda_policy"
  role = aws_iam_role.match_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${var.poker_agents_bucket_arn}",
          "${var.poker_agents_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          "${var.poker_logs_bucket_arn}",
          "${var.poker_logs_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = var.sqs_queue_arn
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
