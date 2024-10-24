resource "aws_dynamodb_table" "match_logs" {
  name         = "MatchLogs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "match_id"
  range_key    = "timestamp"

  attribute {
    name = "match_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  tags = var.tags
}