resource "aws_db_subnet_group" "aurora" {
  name       = "pokerbots-db-subnet-group"
  subnet_ids = var.subnet_ids
  tags       = var.tags
}

data "aws_db_cluster_snapshot" "latest_snapshot" {
  db_cluster_identifier = "pokerbots-aurora-cluster"
  most_recent           = true
  include_shared        = false
  include_public        = false
}

resource "aws_rds_cluster" "aurora_cluster" {
  cluster_identifier        = "pokerbots-aurora-cluster"
  engine                    = "aurora-postgresql"
  engine_version            = "16.1"
  engine_mode               = "provisioned"
  database_name             = "pokerbotsdb"
  master_username           = var.db_username
  master_password           = var.db_password
  backup_retention_period   = var.backup_retention_period
  preferred_backup_window   = var.preferred_backup_window
  db_subnet_group_name      = aws_db_subnet_group.aurora.name
  vpc_security_group_ids    = var.vpc_security_group_ids
  port                      = var.db_port
  skip_final_snapshot       = false
  final_snapshot_identifier = "pokerbots-aurora-cluster-final-snapshot-${formatdate("YYYYMMDDHHmmss", timestamp())}"

  snapshot_identifier = data.aws_db_cluster_snapshot.latest_snapshot.id

  deletion_protection = false

  serverlessv2_scaling_configuration {
    max_capacity = var.db_max_capacity
    min_capacity = var.db_min_capacity
  }

  tags = var.tags

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [snapshot_identifier]
  }
}
