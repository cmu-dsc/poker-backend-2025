# RDS Outputs
output "db_cluster_endpoint" {
  description = "The cluster endpoint"
  value       = module.rds.cluster_endpoint
}

output "db_reader_endpoint" {
  description = "A read-only endpoint for the Aurora cluster"
  value       = module.rds.reader_endpoint
}

output "backend_alb_dns_name" {
  description = "The DNS name of the ALB for the backend"
  value       = module.backend.alb_dns_name
}

output "appsync_api_url" {
  description = "The URL of the AppSync GraphQL API"
  value       = module.match.appsync_api_url
}

output "appsync_api_key" {
  description = "The API key for the AppSync GraphQL API"
  value       = module.match.appsync_api_key
  sensitive   = true
}
