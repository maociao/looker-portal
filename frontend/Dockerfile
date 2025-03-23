# Build stage
FROM node:18-slim as build

WORKDIR /app

# Define build arguments
ARG VITE_API_URL
ARG VITE_LOOKER_HOST
ARG VITE_USE_MOCK_LOOKER
ARG VITE_APP_NAME="Looker Portal"
ARG VITE_DEPLOY_REGION="us-central1"

# Set environment variables for the build process
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_LOOKER_HOST=${VITE_LOOKER_HOST}
ENV VITE_USE_MOCK_LOOKER=${VITE_USE_MOCK_LOOKER}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_DEPLOY_REGION=${VITE_DEPLOY_REGION}

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app (environment variables will be baked in at build time)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]