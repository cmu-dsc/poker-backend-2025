output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = aws_lb.backend.dns_name
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.backend.name
}

output "ecs_service_name" {
  description = "The name of the ECS service"
  value       = aws_ecs_service.backend.name
}

output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_app_client_id" {
  description = "The ID of the Cognito App Client"
  value       = aws_cognito_user_pool_client.main.id
}
