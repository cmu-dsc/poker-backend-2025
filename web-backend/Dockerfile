FROM node:21-alpine3.18

# Install gcloud CLI
RUN apk add --no-cache curl python3 py3-pip && \
    curl -sSL https://sdk.cloud.google.com | bash && \
    ln -s /root/google-cloud-sdk/bin/gcloud /usr/local/bin/gcloud

# Set the PATH to include gcloud CLI
ENV PATH $PATH:/root/google-cloud-sdk/bin

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json /app
RUN yarn install

# Bundle app source
COPY . /app

# Build app
RUN yarn run build

# Expose the port the app runs on
EXPOSE 8080

# Run the app
CMD ["node", "-r", "tsconfig-paths/register", "dist/src/server.js"]
