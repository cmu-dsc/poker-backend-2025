FROM oven/bun:latest

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json bun.lockb prisma /app/
RUN bun install --frozen-lockfile

# Bundle app source
COPY . /app

# Build app
RUN bun run build

# Expose the port the app runs on
EXPOSE 80

# Run the app
CMD ["bun", "run", "start"]
