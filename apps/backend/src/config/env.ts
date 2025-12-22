import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Azure AD B2C
  azureAdB2C: {
    tenantName: process.env.AZURE_AD_B2C_TENANT_NAME || '',
    clientId: process.env.AZURE_AD_B2C_CLIENT_ID || '',
    clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET || '',
    policyName: process.env.AZURE_AD_B2C_POLICY_NAME || '',
  },

  // Azure Notification Hubs
  azureNotificationHub: {
    name: process.env.AZURE_NOTIFICATION_HUB_NAME || '',
    connectionString: process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING || '',
  },

  // Azure Communication Services
  azureCommunication: {
    connectionString: process.env.AZURE_COMMUNICATION_CONNECTION_STRING || '',
  },

  // Azure Storage
  azureStorage: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
  },

  // Application Insights
  appInsights: {
    instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATION_KEY || '',
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
  },

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
