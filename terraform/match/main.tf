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

resource "aws_iam_role" "match_lambda_role" {
  name = "match_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
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
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = [
          var.poker_agents_bucket_arn,
          "${var.poker_agents_bucket_arn}/*",
          var.poker_logs_bucket_arn,
          "${var.poker_logs_bucket_arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
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
          "appsync:GraphQL"
        ]
        Resource = [
          "${aws_appsync_graphql_api.match_logs_api.arn}/types/Mutation/fields/addLog"
        ]
      }
    ]
  })
}

resource "aws_dynamodb_table" "match_logs" {
  name         = "MatchLogs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "match_id"
  range_key    = "timestamp"

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

resource "aws_appsync_graphql_api" "match_logs_api" {
  name   = "match-logs-api"
  schema = file("${path.module}/schema.graphql")

  authentication_type = "AMAZON_COGNITO_USER_POOLS"

  user_pool_config {
    aws_region     = var.aws_region
    default_action = "ALLOW"
    user_pool_id   = var.cognito_user_pool_id
  }

  additional_authentication_provider {
    authentication_type = "AWS_IAM"
  }

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs_role.arn
    field_log_level          = "ALL"
  }

  xray_enabled = true
  tags         = var.tags
}

resource "aws_iam_role" "appsync_logs_role" {
  name = "appsync-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "appsync.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "appsync_logs_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
  role       = aws_iam_role.appsync_logs_role.name
}

resource "aws_appsync_api_key" "match_logs_api_key" {
  api_id  = aws_appsync_graphql_api.match_logs_api.id
  expires = timeadd(timestamp(), "8760h")
}

resource "aws_appsync_datasource" "match_logs_datasource" {
  api_id           = aws_appsync_graphql_api.match_logs_api.id
  name             = "match_logs_table"
  service_role_arn = aws_iam_role.appsync_dynamodb_role.arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.match_logs.name
  }
}

resource "aws_iam_role" "appsync_dynamodb_role" {
  name = "appsync-dynamodb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "appsync.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "appsync_dynamodb_policy" {
  name = "appsync-dynamodb-policy"
  role = aws_iam_role.appsync_dynamodb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ]
      Resource = aws_dynamodb_table.match_logs.arn
    }]
  })
}

resource "aws_appsync_resolver" "get_logs_resolver" {
  api_id      = aws_appsync_graphql_api.match_logs_api.id
  type        = "Query"
  field       = "getLogs"
  data_source = aws_appsync_datasource.match_logs_datasource.name

  request_template  = file("${path.module}/resolvers/getLogs.request.vtl")
  response_template = file("${path.module}/resolvers/getLogs.response.vtl")
}

resource "aws_appsync_resolver" "on_new_log_resolver" {
  api_id      = aws_appsync_graphql_api.match_logs_api.id
  type        = "Subscription"
  field       = "onNewLog"
  data_source = aws_appsync_datasource.match_logs_datasource.name

  request_template  = file("${path.module}/resolvers/onNewLog.request.vtl")
  response_template = file("${path.module}/resolvers/onNewLog.response.vtl")
}

resource "aws_appsync_resolver" "add_log_resolver" {
  api_id      = aws_appsync_graphql_api.match_logs_api.id
  type        = "Mutation"
  field       = "addLog"
  data_source = aws_appsync_datasource.match_logs_datasource.name

  request_template  = file("${path.module}/resolvers/addLog.request.vtl")
  response_template = file("${path.module}/resolvers/addLog.response.vtl")
}
