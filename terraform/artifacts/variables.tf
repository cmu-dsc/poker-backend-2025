variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
}

variable "github_repositories" {
  description = "List of GitHub repositories allowed to assume the role"
  type        = list(string)
  default     = ["cmu-dsc/poker-backend-2025", "cmu-dsc/poker-engine-2025"]
}

variable "lambda_function_arns" {
  description = "ARNs of the Lambda functions to update"
  type        = list(string)
}

variable "github_access_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
}

variable "match_repo_arn" {
  description = "The ARN of the match repository"
  type        = string
}
