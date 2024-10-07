variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
}

variable "availability_zones" {
  description = "A list of availability zones in the region"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "db_username" {
  description = "Username for the master DB user"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the master DB user"
  type        = string
  sensitive   = true
}

variable "backup_retention_period" {
  description = "The days to retain backups for"
  type        = number
  default     = 5
}

variable "preferred_backup_window" {
  description = "The daily time range during which automated backups are created"
  type        = string
  default     = "03:00-05:00"
}

variable "db_subnet_group_name" {
  description = "Name of DB subnet group"
  type        = string
}

variable "vpc_security_group_ids" {
  description = "List of VPC security groups to associate"
  type        = list(string)
}

variable "db_max_capacity" {
  description = "The maximum capacity (ACUs) for Serverless v2 scaling"
  type        = number
  default     = 16
}

variable "db_min_capacity" {
  description = "The minimum capacity (ACUs) for Serverless v2 scaling"
  type        = number
  default     = 0.5
}

variable "db_port" {
  description = "The port on which the DB accepts connections"
  type        = number
  default     = 5432
}
