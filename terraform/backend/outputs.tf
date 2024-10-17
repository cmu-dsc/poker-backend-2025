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
