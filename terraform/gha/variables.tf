variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
}

variable "github_repositories" {
  description = "List of GitHub repositories allowed to assume the role"
  type        = list(string)
  default     = ["cmu-dsc/poker-backend-2025", "cmu-dsc/poker-engine-2025"]
}

variable "lambda_function_arn" {
  description = "ARN of the Lambda function to update"
  type        = string
}

variable "lambda_code_bucket_arn" {
  description = "ARN of the S3 bucket containing Lambda code"
  type        = string
}
