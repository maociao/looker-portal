#!/bin/sh

# Create runtime environment config file
echo "window.ENV = {
  VITE_API_URL: \"$VITE_API_URL\",
  VITE_LOOKER_HOST: \"$VITE_LOOKER_HOST\",
  VITE_USE_MOCK_LOOKER: \"$VITE_USE_MOCK_LOOKER\"
};" > /usr/share/nginx/html/env-config.js

# Start nginx
exec nginx -g "daemon off;"