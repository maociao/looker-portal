# Use Node.js 18 as the base image
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the application code
COPY . .

# Copy environment files (will be overridden by Cloud Run env vars)
COPY .env.cloud .env

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD [ "node", "src/server.js" ]