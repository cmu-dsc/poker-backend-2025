# RDS Outputs
output "db_cluster_endpoint" {
  description = "The cluster endpoint"
  value       = module.rds.cluster_endpoint
}

output "db_reader_endpoint" {
  description = "A read-only endpoint for the Aurora cluster"
  value       = module.rds.reader_endpoint
}

output "github_actions_role_arn" {
  description = "The ARN of the IAM role for GitHub Actions"
  value       = module.gha.github_actions_role_arn
}
