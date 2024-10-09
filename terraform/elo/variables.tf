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

variable "batch_size" {
  description = "Number of matches to process elo at a time"
  type        = number
  default     = 25
}

variable "maximum_batching_window_in_seconds" {
  description = "The maximum amount of time to gather records before invoking the function, in seconds"
  type        = number
  default     = 60
}
