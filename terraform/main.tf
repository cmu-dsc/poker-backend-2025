provider "aws" {
  region = var.aws_region
}

module "rds" {
  source                 = "./rds"
  tags                   = var.tags
  db_subnet_group_name   = var.db_subnet_group_name
  db_username            = var.db_username
  db_password            = var.db_password
  vpc_security_group_ids = var.vpc_security_group_ids
}

module "s3" {
  source = "./s3"
  tags   = var.tags
}

module "elo" {
  source      = "./elo"
  tags        = var.tags
  db_host     = module.rds.cluster_endpoint
  db_username = var.db_username
  db_password = var.db_password
}