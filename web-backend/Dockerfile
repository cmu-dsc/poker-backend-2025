FROM node:21-alpine3.18

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
