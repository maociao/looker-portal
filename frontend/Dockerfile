# Build stage
FROM node:18-slim as build

WORKDIR /app

# Install dependencies using package-lock.json for deterministic builds
COPY package*.json ./
# Install ALL dependencies, including dev dependencies
RUN npm install

# Copy TypeScript configs
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Copy source code
COPY public ./public
COPY src ./src
COPY index.html ./

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a script to import environment variables at runtime
RUN echo '#!/bin/sh\n\
envsubst < /usr/share/nginx/html/env-template.js > /usr/share/nginx/html/env-config.js\n\
nginx -g "daemon off;"' > /docker-entrypoint.sh

# Make the script executable
RUN chmod +x /docker-entrypoint.sh

# Create env template
RUN echo 'window.ENV = { \
VITE_API_URL: "${VITE_API_URL}", \
VITE_LOOKER_HOST: "${VITE_LOOKER_HOST}", \
VITE_USE_MOCK_LOOKER: "${VITE_USE_MOCK_LOOKER}" \
};' > /usr/share/nginx/html/env-template.js

EXPOSE 8080

# Start NGINX with our custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]