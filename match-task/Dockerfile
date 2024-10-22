FROM ghcr.io/astral-sh/uv:python3.13-alpine

WORKDIR /app

COPY requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

COPY poker-engine-2025/requirements.txt ./poker-engine-2025/
RUN uv pip install --system --no-cache-dir -r poker-engine-2025/requirements.txt

COPY . .

ENV POKER_AGENTS_BUCKET="cmu-poker-agents"
ENV POKER_LOGS_BUCKET="cmu-poker-logs"
ENV SQS_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/767397676741/match-results-queue"
ENV APPSYNC_API_ENDPOINT="https://iuxx3hklurhovcgwiznbl6xclq.appsync-api.us-east-1.amazonaws.com/graphql"
ENV APPSYNC_API_KEY="da2-jldlxpvbdrfjdhw4ys7spep4k4"

CMD ["python", "main.py"]
