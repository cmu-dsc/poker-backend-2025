resource "aws_ecs_cluster" "match_cluster" {
  name = "match-cluster"
  tags = var.tags
}

resource "aws_ecs_task_definition" "match_task" {
  family                   = "match-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "1024"
  memory                   = "4096"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name  = "match-container"
      image = "${aws_ecr_repository.match_repository.repository_url}:latest"
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
        }
      ]
      environment = [
        { name = "POKER_AGENTS_BUCKET", value = var.poker_agents_bucket_id },
        { name = "POKER_LOGS_BUCKET", value = var.poker_logs_bucket_id },
        { name = "SQS_QUEUE_URL", value = var.sqs_queue_url },
        { name = "APPSYNC_API_ENDPOINT", value = aws_appsync_graphql_api.match_logs_api.uris["GRAPHQL"] },
        { name = "PLAYER1_KEY", value = "#{PLAYER1_KEY}" },
        { name = "PLAYER2_KEY", value = "#{PLAYER2_KEY}" },
        { name = "PLAYER1_ID", value = "#{PLAYER1_ID}" },
        { name = "PLAYER2_ID", value = "#{PLAYER2_ID}" },
        { name = "MATCH_ID", value = "#{MATCH_ID}" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.match_logs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "match"
        }
      }
    }
  ])

  tags = var.tags
}

resource "aws_ecr_repository" "match_repository" {
  name = "match-repository"
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "match_logs" {
  name              = "/ecs/match-task"
  retention_in_days = 30
  tags              = var.tags
}

resource "aws_ecs_cluster_capacity_providers" "match_cluster_capacity_providers" {
  cluster_name = aws_ecs_cluster.match_cluster.name

  capacity_providers = ["FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE_SPOT"
  }
}
