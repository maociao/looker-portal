// backend/test-looker.js
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');

async function testLookerSDK() {
  try {
    console.log('Testing Looker SDK initialization...');
    
    // Import the SDK
    const { Looker40SDK } = require('@looker/sdk');
    const { NodeSettingsIniFile, NodeSession } = require('@looker/sdk-node');
    
    console.log('SDK modules imported successfully.');
    
    // Path to ini file
    const iniPath = path.join(__dirname, 'looker.ini');
    console.log(`Looking for ini file at: ${iniPath}`);
    
    // Create settings and session
    const settings = new NodeSettingsIniFile(iniPath);
    const session = new NodeSession(settings);
    const sdk = new Looker40SDK(session);
    
    console.log('SDK initialized!');
    
    // Test a simple API call
    const me = await sdk.ok(sdk.me());
    console.log(`Connected as: ${me.display_name}`);
    
  } catch (error) {
    console.error('Error in Looker SDK test:');
    console.error(error);
  }
}

testLookerSDK();