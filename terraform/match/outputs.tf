output "match_function_arn" {
  description = "The ARN of the match Lambda function"
  value       = aws_lambda_function.match_function.arn
}

output "sse_api_endpoint" {
  description = "The endpoint URL for the SSE API"
  value       = aws_apigatewayv2_stage.stream_stage.invoke_url
}

output "match_logs_table_name" {
  description = "The name of the DynamoDB table for match logs"
  value       = aws_dynamodb_table.match_logs.name
}

output "sse_function_arn" {
  description = "The ARN of the SSE Lambda function"
  value       = aws_lambda_function.stream_function.arn
}
