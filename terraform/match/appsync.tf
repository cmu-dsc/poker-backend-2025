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

  additional_authentication_provider {
    authentication_type = "API_KEY"
  }

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs_role.arn
    field_log_level          = "ALL"
  }

  xray_enabled = true
  tags         = var.tags
}

resource "aws_appsync_api_key" "match_logs_api_key" {
  api_id  = aws_appsync_graphql_api.match_logs_api.id
  expires = timeadd(timestamp(), "8760h")
}

resource "aws_appsync_datasource" "valkey_lambda" {
  api_id           = aws_appsync_graphql_api.match_logs_api.id
  name             = "ValkeyLambda"
  service_role_arn = aws_iam_role.appsync_lambda_role.arn
  type             = "AWS_LAMBDA"

  lambda_config {
    function_arn = aws_lambda_function.valkey_handler.arn
  }
}

resource "aws_appsync_resolver" "get_logs_resolver" {
  api_id      = aws_appsync_graphql_api.match_logs_api.id
  type        = "Query"
  field       = "getLogs"
  data_source = aws_appsync_datasource.valkey_lambda.name

  request_template  = file("${path.module}/resolvers/getLogs.request.vtl")
  response_template = file("${path.module}/resolvers/getLogs.response.vtl")
}

resource "aws_appsync_datasource" "none" {
  api_id = aws_appsync_graphql_api.match_logs_api.id
  name   = "NONE"
  type   = "NONE"
}

resource "aws_appsync_resolver" "on_new_log_resolver" {
  api_id      = aws_appsync_graphql_api.match_logs_api.id
  type        = "Subscription"
  field       = "onNewLog"
  data_source = aws_appsync_datasource.none.name

  request_template  = file("${path.module}/resolvers/onNewLog.request.vtl")
  response_template = file("${path.module}/resolvers/onNewLog.response.vtl")
}
resource "aws_appsync_resolver" "add_log_resolver" {
  api_id      = aws_appsync_graphql_api.match_logs_api.id
  type        = "Mutation"
  field       = "addLog"
  data_source = aws_appsync_datasource.valkey_lambda.name

  request_template  = file("${path.module}/resolvers/addLog.request.vtl")
  response_template = file("${path.module}/resolvers/addLog.response.vtl")
}
