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

module "match" {
  source                  = "./match"
  tags                    = var.tags
  poker_agents_bucket_id  = module.s3.poker_agents_bucket_id
  poker_agents_bucket_arn = module.s3.poker_agents_bucket_arn
  poker_logs_bucket_id    = module.s3.poker_logs_bucket_id
  poker_logs_bucket_arn   = module.s3.poker_logs_bucket_arn
  sqs_queue_url           = module.elo.sqs_queue_url
  sqs_queue_arn           = module.elo.sqs_queue_arn
}

module "elo" {
  source             = "./elo"
  tags               = var.tags
  db_host            = module.rds.cluster_endpoint
  db_host_arn        = module.rds.arn
  db_username        = var.db_username
  db_password        = var.db_password
  lambda_code_bucket = module.s3.poker_lambdas_bucket_id
  lambda_code_key    = "elo_function.zip"
}

module "gha" {
  source                 = "./gha"
  tags                   = var.tags
  lambda_function_arn    = module.elo.lambda_function_arn
  lambda_code_bucket_arn = module.s3.poker_lambdas_bucket_arn
}
