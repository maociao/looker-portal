# Build stage
FROM node:18-slim as build

WORKDIR /app

# Define build arguments
ARG VITE_API_URL
ARG VITE_LOOKER_HOST
ARG VITE_USE_MOCK_LOOKER

# Set environment variables for the build process
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_LOOKER_HOST=${VITE_LOOKER_HOST}
ENV VITE_USE_MOCK_LOOKER=${VITE_USE_MOCK_LOOKER}

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

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the entrypoint script
COPY debug-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

# Use the entrypoint script
CMD ["/docker-entrypoint.sh"]