output "poker_lambdas_bucket_id" {
  description = "The ID of the poker-lambdas S3 bucket"
  value       = aws_s3_bucket.poker_lambdas.id
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.poker_ecr.repository_url
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions"
  value       = aws_iam_role.github_actions.arn
}
