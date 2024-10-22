FROM ghcr.io/astral-sh/uv:python3.13-alpine

WORKDIR /app

COPY requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

COPY poker-engine-2025/requirements.txt ./poker-engine-2025/
RUN uv pip install --system --no-cache-dir -r poker-engine-2025/requirements.txt

COPY . .

CMD ["python", "main.py"]
