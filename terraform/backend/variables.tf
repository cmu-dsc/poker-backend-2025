variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
}

variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "db_host" {
  description = "The host of the RDS cluster"
  type        = string
}

variable "db_reader_endpoint" {
  description = "The reader endpoint of the RDS cluster"
  type        = string
}

variable "db_name" {
  description = "The name of the database"
  type        = string
  default     = "pokerbotsdb"
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

variable "app_port" {
  description = "Port on which the app runs"
  type        = number
  default     = 80
}

variable "desired_count" {
  description = "Desired number of containers to run"
  type        = number
  default     = 2
}

variable "cpu" {
  description = "CPU units for the container"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory for the container in MiB"
  type        = number
  default     = 512
}

variable "security_group_id" {
  description = "The ID of the shared security group"
  type        = string
}
