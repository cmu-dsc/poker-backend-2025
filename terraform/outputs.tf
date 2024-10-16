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

output "backend_ecr_repository_url" {
  description = "The URL of the ECR repository for the backend"
  value       = module.backend.ecr_repository_url
}

output "backend_alb_dns_name" {
  description = "The DNS name of the ALB for the backend"
  value       = module.backend.alb_dns_name
}

output "backend_ecs_cluster_name" {
  description = "The name of the ECS cluster for the backend"
  value       = module.backend.ecs_cluster_name
}

output "backend_ecs_service_name" {
  description = "The name of the ECS service for the backend"
  value       = module.backend.ecs_service_name
}
