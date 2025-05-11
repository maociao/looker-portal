require('dotenv').config();

const { Looker40SDK } = require('@looker/sdk');
const { DefaultSettings } = require('@looker/sdk-rtl');
const { NodeSession } = require('@looker/sdk-node');

class LookerService {
  constructor() {
    this.sdk = null;
    this.session = null;
    this.token = null;
    this.lookerSession = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this.sdk;

    try {
      // Get credentials from environment variables
      this.session = await this.getLookerSession()
      this.token = await this.session.getToken()
      console.log('Looker token:', this.token);
      this.sdk = new Looker40SDK(this.session)     
      this.initialized = true;

      // Test the connection
      const me = await this.sdk.ok(this.sdk.me());
      console.log(`Connected to Looker as ${me.display_name}`);

      return this.sdk;
    } catch (error) {
      console.error('Failed to initialize Looker SDK:', error);
      throw new Error('Failed to initialize Looker SDK');
    }
  }

  async getLookerSession() {
    if (!this.lookerSession || !this.lookerSession.activeToken.isActive()) {
      try {
        const lookerSettings = DefaultSettings()
        const api_url = `https://${process.env.LOOKER_HOST}`;
        console.log('API URL:', api_url);
        const client_id = process.env.LOOKER_CLIENT_ID;
        const client_secret = process.env.LOOKER_CLIENT_SECRET;
        lookerSettings.readConfig = () => {
          return { client_id, client_secret }
        }
        lookerSettings.base_url = api_url
        lookerSettings.verify_ssl = 'true'
        console.log('Looker Settings:', lookerSettings)
        this.lookerSession = new NodeSession(lookerSettings)
        await this.lookerSession.login()
      } catch (error) {
        console.error('Looker Login failed', { error })
        throw error
      }
    }
    return this.lookerSession
  }

  async getDashboards() {
    if (!this.initialized) await this.initialize();
    return await this.sdk.ok(this.sdk.all_dashboards());
  }

  async getDashboard(dashboardId) {
    if (!this.initialized) await this.initialize();
    return await this.sdk.ok(this.sdk.dashboard(dashboardId));
  }

  // Add more methods as needed for your application
}

module.exports = new LookerService();