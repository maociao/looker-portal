# Build stage
FROM node:18-slim as build

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Build the app
RUN npm run build

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