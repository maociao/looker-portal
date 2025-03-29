#!/bin/sh

# Debug
echo "VITE_API_URL = ${VITE_API_URL}"
echo "VITE_LOOKER_HOST = ${VITE_LOOKER_HOST}"
echo "VITE_USE_MOCK_LOOKER = ${VITE_USE_MOCK_LOOKER}"
echo "VITE_APP_NAME = ${VITE_APP_NAME}"
echo "VITE_DEPLOY_REGION = ${VITE_DEPLOY_REGION}"

# Ensure default values if environment variables are not set
: "${VITE_APP_NAME:=Looker Portal}"
: "${VITE_API_URL:=http://localhost:8080}"
: "${VITE_LOOKER_HOST:=mock.looker.com}"
: "${VITE_USE_MOCK_LOOKER:=true}"
: "${VITE_DEPLOY_REGION:=us-central1}"

# Generate env-config.js file with default values if needed
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_LOOKER_HOST: "${VITE_LOOKER_HOST}",
  VITE_USE_MOCK_LOOKER: "${VITE_USE_MOCK_LOOKER}",
  VITE_APP_NAME: "${VITE_APP_NAME}",
  VITE_DEPLOY_REGION: "${VITE_DEPLOY_REGION}"
};
EOF

# Process nginx configuration template with added CORS headers
envsubst '$VITE_API_URL $VITE_LOOKER_HOST' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# DEBUG: Print the processed config to verify it's correct
echo "--- Generated nginx config ---"
cat /etc/nginx/conf.d/default.conf
echo "----------------------------"

# Start nginx
exec nginx -g "daemon off;"