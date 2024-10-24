resource "aws_lambda_function" "valkey_handler" {
  filename      = data.archive_file.valkey_handler.output_path
  function_name = "valkey-handler"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      VALKEY_ENDPOINT = aws_elasticache_serverless_cache.match_logs.endpoint[0].address
    }
  }

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [var.security_group_id]
  }

  tags = var.tags
}

data "archive_file" "valkey_handler" {
  type        = "zip"
  source_dir  = "${path.module}/../../valkey-handler"
  output_path = "${path.module}/valkey-handler.zip"

  depends_on = [
    null_resource.npm_install
  ]
}

resource "null_resource" "npm_install" {
  triggers = {
    package_json = filemd5("${path.module}/../../valkey-handler/package.json")
    index_mjs    = filemd5("${path.module}/../../valkey-handler/index.mjs")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../../valkey-handler && npm install"
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "valkey-handler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.lambda_role.name
}
