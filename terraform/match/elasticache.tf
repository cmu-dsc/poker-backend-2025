resource "aws_elasticache_serverless_cache" "match_logs" {
  engine              = "valkey"
  name                = "match-logs"
  description         = "Match logs cache using serverless"
  security_group_ids  = [var.security_group_id]
  subnet_ids          = slice(var.subnet_ids, 0, 2)
  daily_snapshot_time = "04:00"

  cache_usage_limits {
    data_storage {
      maximum = 10
      unit    = "GB"
    }

    ecpu_per_second {
      maximum = 5000
    }
  }

  tags = var.tags
}
