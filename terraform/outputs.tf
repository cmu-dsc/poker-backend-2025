# RDS Outputs
output "db_cluster_endpoint" {
  description = "The cluster endpoint"
  value       = module.rds.cluster_endpoint
}

output "db_reader_endpoint" {
  description = "A read-only endpoint for the Aurora cluster"
  value       = module.rds.reader_endpoint
}

# S3 Outputs
output "poker_agents_bucket_id" {
  description = "The ID of the poker-agents S3 bucket"
  value       = module.s3.poker_agents_bucket_id
}

output "poker_logs_bucket_id" {
  description = "The ID of the poker-logs S3 bucket"
  value       = module.s3.poker_logs_bucket_id
}

# Lambda Outputs
