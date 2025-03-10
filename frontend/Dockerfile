# Build stage
FROM node:18-slim as build

WORKDIR /app

# Install dependencies using package-lock.json for deterministic builds
COPY . .

# Install ALL dependencies, including dev dependencies
RUN npm install

# Build the app
RUN npm run build

# Create env.js directly in the build
RUN echo "window.ENV = { \
  VITE_API_URL: '${VITE_API_URL}', \
  VITE_LOOKER_HOST: '${VITE_LOOKER_HOST:-mock.looker.com}', \
  VITE_USE_MOCK_LOOKER: '${VITE_USE_MOCK_LOOKER:-true}' \
};" > dist/env-config.js

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Configure NGINX to use port 8080 (Cloud Run requirement)
RUN echo 'server { \
  listen 8080; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 8080 for Cloud Run
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]