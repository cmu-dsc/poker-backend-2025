output "appsync_api_url" {
  description = "The URL of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.match_logs_api.uris["GRAPHQL"]
}
