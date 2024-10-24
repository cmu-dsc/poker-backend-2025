output "appsync_api_url" {
  description = "The URL of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.match_logs_api.uris["GRAPHQL"]
}

output "appsync_api_key" {
  description = "The API key for the AppSync GraphQL API"
  value       = aws_appsync_api_key.match_logs_api_key.key
  sensitive   = true
}

output "match_repo_arn" {
  description = "The ARN of the match repository"
  value = aws_ecr_repository.match_repository.arn
}