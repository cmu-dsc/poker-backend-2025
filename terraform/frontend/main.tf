terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

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
    NEXT_PUBLIC_API_ENDPOINT = "http://${var.api_endpoint}"
  }

  tags = var.tags
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = "main"

  framework = "Next.js - SSR"
  stage     = "PRODUCTION"

  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = "/"
  }
}

resource "aws_amplify_domain_association" "frontend" {
  app_id                = aws_amplify_app.frontend.id
  domain_name           = "cmudsc.com"
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "pokerai"
  }
}

resource "cloudflare_record" "certificate_verification" {
  zone_id = var.cloudflare_zone_id
  name    = split(" ", aws_amplify_domain_association.frontend.certificate_verification_dns_record)[0]
  content = split(" ", aws_amplify_domain_association.frontend.certificate_verification_dns_record)[2]
  type    = "CNAME"
  proxied = false
}

resource "cloudflare_record" "amplify_domain" {
  zone_id = var.cloudflare_zone_id
  name    = "pokerai"
  content = trim(split(" ", [
    for s in aws_amplify_domain_association.frontend.sub_domain : s.dns_record
    if s.prefix == "pokerai"
  ][0])[2], " ")
  type    = "CNAME"
  proxied = false
}
