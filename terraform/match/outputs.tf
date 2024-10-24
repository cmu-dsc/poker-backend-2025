output "match_function_arn" {
  description = "The ARN of the match Lambda function"
  value       = aws_lambda_function.match_function.arn
}

output "match_logs_table_name" {
  description = "The name of the DynamoDB table for match logs"
  value       = aws_dynamodb_table.match_logs.name
}

output "appsync_api_url" {
  description = "The URL of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.match_logs_api.uris["GRAPHQL"]
}

output "appsync_api_key" {
  description = "The API key for the AppSync GraphQL API"
  value       = aws_appsync_api_key.match_logs_api_key.key
  sensitive   = true
}
