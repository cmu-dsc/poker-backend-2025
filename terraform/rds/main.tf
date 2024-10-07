resource "aws_rds_cluster" "aurora_cluster" {
  cluster_identifier       = "pokerbots-aurora-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "16.1"
  engine_mode             = "provisioned"
  availability_zones      = var.availability_zones
  database_name           = "pokerbotsdb"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = var.preferred_backup_window
  db_subnet_group_name    = var.db_subnet_group_name
  vpc_security_group_ids  = var.vpc_security_group_ids
  port                    = var.db_port
  skip_final_snapshot      = true

  serverlessv2_scaling_configuration {
    max_capacity = var.db_max_capacity
    min_capacity = var.db_min_capacity
  }

  tags = var.tags
}
