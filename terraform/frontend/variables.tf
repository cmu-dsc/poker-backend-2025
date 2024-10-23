variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
}

variable "github_repository" {
  description = "The GitHub repository URL"
  type        = string
}

variable "github_branch" {
  description = "The GitHub branch to use"
  type        = string
  default     = "main"
}

variable "github_access_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
}

variable "api_endpoint" {
  description = "The API endpoint URL"
  type        = string
}
