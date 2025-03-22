#!/bin/sh

# Create runtime environment config file directly in index.html
# Using sed to inject the environment variables directly into index.html
# This avoids the need for a separate env-config.js file

sed -i "s|<script src=\"/env-config.js\"></script>|<script>window.ENV = { VITE_API_URL: \"$VITE_API_URL\", VITE_LOOKER_HOST: \"$VITE_LOOKER_HOST\", VITE_USE_MOCK_LOOKER: \"$VITE_USE_MOCK_LOOKER\" };</script>|g" /usr/share/nginx/html/index.html

# Start nginx
exec nginx -g "daemon off;"