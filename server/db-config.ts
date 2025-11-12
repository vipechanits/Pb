/**
 * Database Configuration
 * 
 * Supports separate development and production databases.
 * 
 * Environment Detection:
 * - Development: Uses DEV_DATABASE_URL if set, otherwise falls back to DATABASE_URL
 * - Production: Always uses DATABASE_URL
 * 
 * Usage in Replit:
 * 1. Development workspace: Set DEV_DATABASE_URL in Secrets
 * 2. Production deployment: Uses DATABASE_URL automatically
 */

const isProduction = process.env.REPL_DEPLOYMENT === '1';
const isDevelopment = !isProduction;

export const dbConfig = {
  /**
   * Current environment
   */
  environment: isProduction ? 'production' : 'development',

  /**
   * Is this a production deployment?
   */
  isProduction,

  /**
   * Is this a development workspace?
   */
  isDevelopment,

  /**
   * Get the appropriate database URL for current environment
   */
  getDatabaseUrl(): string {
    if (isProduction) {
      // Production always uses DATABASE_URL
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required in production');
      }
      return process.env.DATABASE_URL;
    } else {
      // Development: prefer DEV_DATABASE_URL, fallback to DATABASE_URL
      const devUrl = process.env.DEV_DATABASE_URL;
      const prodUrl = process.env.DATABASE_URL;

      if (devUrl) {
        console.log('📊 Using development database (DEV_DATABASE_URL)');
        return devUrl;
      } else if (prodUrl) {
        console.log('⚠️  DEV_DATABASE_URL not set, using DATABASE_URL for development');
        console.log('💡 To use separate dev database, set DEV_DATABASE_URL in Secrets');
        return prodUrl;
      } else {
        throw new Error('Either DEV_DATABASE_URL or DATABASE_URL must be set');
      }
    }
  },

  /**
   * Get connection info for logging
   */
  getConnectionInfo(): { environment: string; usingDevDb: boolean } {
    return {
      environment: isProduction ? 'production' : 'development',
      usingDevDb: isDevelopment && !!process.env.DEV_DATABASE_URL,
    };
  },
};

// Log database configuration on module load
const connInfo = dbConfig.getConnectionInfo();
console.log(`🗄️  Database Environment: ${connInfo.environment.toUpperCase()}`);
if (connInfo.environment === 'development') {
  console.log(`🗄️  Using ${connInfo.usingDevDb ? 'Development' : 'Production'} Database`);
}
