// generate-embed-url.js
require('dotenv').config(); // Load environment variables
const crypto = require('crypto');

// Configuration - Replace these with your actual values
const LOOKER_HOST = process.env.LOOKER_HOST || 'sappiinternalbi.cloud.looker.com';
const LOOKER_EMBED_SECRET = process.env.LOOKER_EMBED_SECRET || 'your-embed-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://looker-portal-frontend.sappi.com';
const DASHBOARD_ID = process.argv[2] || '3518'; // Default to dashboard ID 3518 or take from command line

// Helper function to force Unicode encoding
function forceUnicodeEncoding(string) {
  return decodeURIComponent(encodeURIComponent(string));
}

// Helper function to generate a nonce
function nonce(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return text;
}

// Main function to generate the embed URL
function createEmbedUrl() {
  // Build option parameters
  const host = LOOKER_HOST;
  const embed_path = `/embed/dashboards/${DASHBOARD_ID}?embed_domain=${FRONTEND_URL}`;
  
  // User information - match what was in the working URL
  const external_user_id = "AoJ2Hlh6kXo8HntceKIk"; // Use a stable ID for testing
  const first_name = "matt";
  const last_name = "oberpriller";
  
  // These should match your working URL exactly
  const permissions = ["access_data", "see_looks", "see_user_dashboards", "see_lookml_dashboards"];
  const models = ["maastricht"]; // Make sure this matches your Looker model
  const session_length = 600;

  // Create JSON strings for each parameter - EXACTLY as in the sample code
  const json_external_user_id = JSON.stringify(external_user_id);
  const json_first_name = JSON.stringify(first_name);
  const json_last_name = JSON.stringify(last_name);
  const json_permissions = JSON.stringify(permissions);
  const json_models = JSON.stringify(models);
  const json_group_ids = JSON.stringify([]);
  const json_external_group_id = JSON.stringify("");
  const json_user_attributes = JSON.stringify({});
  const json_access_filters = JSON.stringify({});
  const json_session_length = JSON.stringify(session_length);
  const json_force_logout_login = JSON.stringify(true);
  
  // Compute time and nonce
  const json_time = JSON.stringify(Math.floor(Date.now() / 1000));
  const json_nonce = JSON.stringify(nonce(16));
  
  // URL encode the embed path for the string to sign
  const encoded_embed_path = '/login/embed/' + encodeURIComponent(embed_path);
  
  // Build the string to sign - ORDER IS IMPORTANT
  let string_to_sign = "";
  string_to_sign += host + "\n";
  string_to_sign += encoded_embed_path + "\n";
  string_to_sign += json_nonce + "\n";
  string_to_sign += json_time + "\n";
  string_to_sign += json_session_length + "\n";
  string_to_sign += json_external_user_id + "\n";
  string_to_sign += json_permissions + "\n";
  string_to_sign += json_models + "\n";
  string_to_sign += json_group_ids + "\n";
  string_to_sign += json_external_group_id + "\n";
  string_to_sign += json_user_attributes + "\n";
  string_to_sign += json_access_filters;
  
  console.log("String to sign:\n", string_to_sign);

  // Create the signature
  var signature = crypto
    .createHmac('sha1', LOOKER_EMBED_SECRET)
    .update(forceUnicodeEncoding(string_to_sign))
    .digest('base64')
    .trim();
  
  console.log("Signature:", signature);
  
  // Build the query parameters - maintaining exact order
  const query_params = [
    `nonce=${encodeURIComponent(json_nonce)}`,
    `time=${encodeURIComponent(json_time)}`,
    `session_length=${encodeURIComponent(json_session_length)}`,
    `external_user_id=${encodeURIComponent(json_external_user_id)}`,
    `permissions=${encodeURIComponent(json_permissions)}`,
    `models=${encodeURIComponent(json_models)}`,
    `group_ids=${encodeURIComponent(json_group_ids)}`,
    `external_group_id=${encodeURIComponent(json_external_group_id)}`,
    `user_attributes=${encodeURIComponent(json_user_attributes)}`,
    `access_filters=${encodeURIComponent(json_access_filters)}`,
    `first_name=${encodeURIComponent(json_first_name)}`,
    `last_name=${encodeURIComponent(json_last_name)}`,
    `force_logout_login=${encodeURIComponent(json_force_logout_login)}`,
    `signature=${encodeURIComponent(signature)}`
  ].join('&');
  
  // Create the final URL
  const embeddedUrl = `https://${host}/login/embed/${encodeURIComponent(embed_path)}?${query_params}`;
  
  return embeddedUrl;
}

// Generate and output the URL
const url = createEmbedUrl();
console.log("\n=== GENERATED EMBED URL ===\n");
console.log(url);
console.log("\n=== END URL ===\n");

// Also output the individual components
console.log("- LOOKER_HOST:", LOOKER_HOST);
console.log("- DASHBOARD_ID:", DASHBOARD_ID);
console.log("- FRONTEND_URL:", FRONTEND_URL);