resource "aws_amplify_app" "frontend" {
  name         = "pokerbots-frontend"
  repository   = var.github_repository
  access_token = var.github_access_token
  platform     = "WEB_COMPUTE"

  enable_auto_branch_creation = true

  auto_branch_creation_patterns = [
    "*",
    "*/**",
  ]

  enable_basic_auth = false

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci --cache .npm --prefer-offline
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - .next/cache/**/*
          - .npm/**/*
  EOT

  environment_variables = {
    NEXT_PUBLIC_API_ENDPOINT = var.api_endpoint
  }

  tags = var.tags
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = var.github_branch

  framework = "Next.js - SSR"
  stage     = "PRODUCTION"

  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = "/"
  }
}

resource "aws_amplify_domain_association" "frontend" {
  app_id      = aws_amplify_app.frontend.id
  domain_name = "cmudsc.com"

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "pokerai"
  }
}
