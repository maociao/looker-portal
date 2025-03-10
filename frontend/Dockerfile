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
  VITE_API_URL: '${VITE_API_URL:-/api}', \
  VITE_LOOKER_HOST: '${VITE_LOOKER_HOST:-mock.looker.com}', \
  VITE_USE_MOCK_LOOKER: '${VITE_USE_MOCK_LOOKER:-true}' \
};" > dist/env-config.js

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]