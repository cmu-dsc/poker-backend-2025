output "match_function_arn" {
  description = "The ARN of the match Lambda function"
  value       = aws_lambda_function.match_function.arn
}

output "match_function_name" {
  description = "The name of the match Lambda function"
  value       = aws_lambda_function.match_function.function_name
}