variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
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