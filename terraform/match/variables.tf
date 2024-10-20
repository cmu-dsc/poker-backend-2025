variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
}

variable "lambda_code_bucket" {
  description = "The name of the S3 bucket containing Lambda code"
  type        = string
}

variable "lambda_code_key" {
  description = "The S3 key of the Lambda function code"
  type        = string
  default     = "match_function.zip"
}

variable "poker_agents_bucket_id" {
  description = "The ID of the poker-agents S3 bucket"
  type        = string
}

variable "poker_agents_bucket_arn" {
  description = "The ARN of the poker-agents S3 bucket"
  type        = string
}

variable "poker_logs_bucket_id" {
  description = "The ID of the poker-logs S3 bucket"
  type        = string
}

variable "poker_logs_bucket_arn" {
  description = "The ARN of the poker-logs S3 bucket"
  type        = string
}

variable "sqs_queue_url" {
  description = "The URL of the SQS queue"
  type        = string
}

variable "sqs_queue_arn" {
  description = "The ARN of the SQS queue"
  type        = string
}
