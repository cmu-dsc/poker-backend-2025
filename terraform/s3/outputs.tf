output "poker_agents_bucket_id" {
  description = "The ID of the poker-agents S3 bucket"
  value       = aws_s3_bucket.poker_agents.id
}

output "poker_agents_bucket_arn" {
  description = "The ARN of the poker-agents S3 bucket"
  value       = aws_s3_bucket.poker_agents.arn
}

output "poker_logs_bucket_id" {
  description = "The ID of the poker-logs S3 bucket"
  value       = aws_s3_bucket.poker_logs.id
}

output "poker_logs_bucket_arn" {
  description = "The ARN of the poker-logs S3 bucket"
  value       = aws_s3_bucket.poker_logs.arn
}
