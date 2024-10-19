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

output "lambda_function_arns" {
  description = "ARNs of the Lambda functions"
  value       = [module.elo.lambda_function_arn, module.match.match_function_arn]
}

output "stream_api_endpoint" {
  description = "The endpoint URL for the Stream API"
  value       = module.match.stream_api_endpoint
}
