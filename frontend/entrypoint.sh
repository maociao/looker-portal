#!/bin/sh

# Debug
echo "VITE_API_URL = ${VITE_API_URL}"
echo "VITE_LOOKER_HOST = ${VITE_LOOKER_HOST}"
echo "VITE_USE_MOCK_LOOKER = ${VITE_USE_MOCK_LOOKER}"

# Generate env-config.js file
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_LOOKER_HOST: "${VITE_LOOKER_HOST}",
  VITE_USE_MOCK_LOOKER: "${VITE_USE_MOCK_LOOKER}"
};
EOF


# Generate a test HTML file to verify dynamic content
cat > /usr/share/nginx/html/test-env.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Environment Test</title>
</head>
<body>
    <h1>Environment Variables</h1>
    <p>API URL: ${VITE_API_URL}</p>
    <p>Looker Host: ${VITE_LOOKER_HOST}</p>
    <p>Use Mock Looker: ${VITE_USE_MOCK_LOOKER}</p>
</body>
</html>
EOF

# Process nginx configuration template
envsubst '$VITE_API_URL $VITE_LOOKER_HOST' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# DEBUG: Print the processed config to verify it's correct
echo "--- Generated nginx config ---"
cat /etc/nginx/conf.d/default.conf
echo "----------------------------"

# Start nginx
exec nginx -g "daemon off;"