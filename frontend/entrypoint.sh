#!/bin/sh

# Generate env-config.js file
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_LOOKER_HOST: "${VITE_LOOKER_HOST}",
  VITE_USE_MOCK_LOOKER: "${VITE_USE_MOCK_LOOKER}"
};
EOF

# Process nginx configuration template
envsubst '$VITE_API_URL $VITE_LOOKER_HOST' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"