output "match_logs_table_name" {
  description = "The name of the DynamoDB table for match logs"
  value       = aws_dynamodb_table.match_logs.name
}

output "appsync_api_url" {
  description = "The URL of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.match_logs_api.uris["GRAPHQL"]
}
