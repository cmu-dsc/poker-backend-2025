#!/bin/bash
set -e

REPOSITORY_URL=$1
AWS_REGION=$2

# Navigate to the web-backend directory
cd ../web-backend

# Build the Docker image
docker build -t backend:latest .

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REPOSITORY_URL

# Tag the image
docker tag backend:latest $REPOSITORY_URL:latest

# Push the image to ECR
docker push $REPOSITORY_URL:latest

echo "Successfully built and pushed the image to $REPOSITORY_URL"