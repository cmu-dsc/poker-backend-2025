output "sqs_queue_url" {
  description = "The URL of the SQS queue"
  value       = aws_sqs_queue.match_results_queue.url
}

output "sqs_queue_arn" {
  description = "The ARN of the SQS queue"
  value       = aws_sqs_queue.match_results_queue.arn
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.elo_update_function.arn
}