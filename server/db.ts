import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import ws from 'ws';
import { dbConfig } from './db-config';

// Configure WebSocket for Neon serverless in Node.js environment
neonConfig.webSocketConstructor = ws;

// Get the appropriate database URL based on environment (dev or production)
const connectionString = dbConfig.getDatabaseUrl();

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

// Export database configuration for use in other files
export { dbConfig };
