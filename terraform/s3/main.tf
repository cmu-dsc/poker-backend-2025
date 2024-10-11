resource "aws_s3_bucket" "poker_agents" {
  bucket = "cmu-poker-agents"
  tags   = var.tags
}

resource "aws_s3_bucket" "poker_logs" {
  bucket = "cmu-poker-logs"
  tags   = var.tags
}

resource "aws_s3_bucket" "poker_lambdas" {
  bucket = "cmu-poker-lambdas"
  tags   = var.tags
}

resource "aws_s3_bucket_public_access_block" "poker_agents" {
  bucket = aws_s3_bucket.poker_agents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "poker_logs" {
  bucket = aws_s3_bucket.poker_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "poker_lambdas" {
  bucket = aws_s3_bucket.poker_lambdas.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
