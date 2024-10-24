variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
}

variable "github_repository" {
  description = "The GitHub repository URL"
  type        = string
  default     = "https://github.com/cmu-dsc/poker-frontend-2025"
}

variable "github_access_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
}

variable "api_endpoint" {
  description = "The API endpoint URL"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for cmudsc.com"
  type        = string
}
