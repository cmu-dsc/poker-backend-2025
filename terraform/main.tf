provider "aws" {
  region = var.aws_region
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_security_group" "pokerbots_sg" {
  name        = "pokerbots-sg"
  description = "Security group for Pokerbots project"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    self        = true
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

module "backend" {
  source              = "./backend"
  aws_region          = var.aws_region
  tags                = var.tags
  vpc_id              = data.aws_vpc.default.id
  subnet_ids          = data.aws_subnets.default.ids
  db_host             = module.rds.cluster_endpoint
  db_reader_endpoint  = module.rds.reader_endpoint
  db_name             = "pokerbotsdb"
  db_username         = var.db_username
  db_password         = var.db_password
  security_group_id   = aws_security_group.pokerbots_sg.id
}

module "rds" {
  source                 = "./rds"
  tags                   = var.tags
  subnet_ids             = data.aws_subnets.default.ids
  db_username            = var.db_username
  db_password            = var.db_password
  vpc_security_group_ids = [aws_security_group.pokerbots_sg.id]
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
