variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
}

variable "db_host" {
  description = "The host of the RDS cluster"
  type        = string
}

variable "db_username" {
  description = "Username for the database"
  type        = string
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
}

variable "db_host_arn" {
  description = "The ARN of the RDS cluster"
  type        = string
}

variable "lambda_code_bucket" {
  description = "The name of the S3 bucket containing Lambda code"
  type        = string
}

variable "lambda_code_key" {
  description = "The S3 key of the Lambda function code"
  type        = string
  default     = "elo_function.zip"
}
