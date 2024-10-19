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
      LOG_TABLE_NAME      = aws_dynamodb_table.match_logs.name
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
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.match_logs.arn
      }
    ]
  })
}

resource "aws_dynamodb_table" "match_logs" {
  name           = "MatchLogs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "match_id"
  range_key      = "timestamp"

  attribute {
    name = "match_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  tags = var.tags
}

resource "aws_apigatewayv2_api" "stream_api" {
  name          = "match-logs-stream-api"
  protocol_type = "HTTP"
  tags          = var.tags

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "stream_stage" {
  api_id      = aws_apigatewayv2_api.stream_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "stream_integration" {
  api_id             = aws_apigatewayv2_api.stream_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.stream_function.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "stream_route" {
  api_id    = aws_apigatewayv2_api.stream_api.id
  route_key = "GET /logs"
  target    = "integrations/${aws_apigatewayv2_integration.stream_integration.id}"
}

resource "aws_apigatewayv2_route" "options_route" {
  api_id    = aws_apigatewayv2_api.stream_api.id
  route_key = "OPTIONS /logs"
  target    = "integrations/${aws_apigatewayv2_integration.stream_integration.id}"
}

resource "aws_lambda_permission" "api_gateway_stream" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stream_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.stream_api.execution_arn}/*/*"
}

resource "aws_lambda_function" "stream_function" {
  function_name = "match-logs-stream-function"
  role          = aws_iam_role.stream_lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"

  s3_bucket = var.lambda_code_bucket
  s3_key    = var.stream_lambda_code_key

  environment {
    variables = {
      LOG_TABLE_NAME = aws_dynamodb_table.match_logs.name
    }
  }

  tags = var.tags
}

resource "aws_iam_role" "stream_lambda_role" {
  name = "match-logs-stream-lambda-role"

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

  tags = var.tags
}

resource "aws_iam_role_policy" "stream_lambda_policy" {
  name = "match-logs-stream-lambda-policy"
  role = aws_iam_role.stream_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.match_logs.arn
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

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.stream_api.name}"
  retention_in_days = 7
}
