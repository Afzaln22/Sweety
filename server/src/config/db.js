import pg from 'pg';
import dotenv from 'dotenv';
import { executeLocalQuery } from './store.js';

dotenv.config();

const { Pool } = pg;

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'sweety_db'
    };

const rawPool = new Pool(connectionConfig);

let usePostgres = false;

// Test PostgreSQL connection
async function initDb() {
  try {
    const client = await rawPool.connect();
    client.release();
    usePostgres = true;
    console.log('[Database] Connected to PostgreSQL successfully.');
  } catch (err) {
    usePostgres = false;
    console.warn(
      `[Database] PostgreSQL connection failed (${err.message}). Seamlessly activated built-in storage so Sweety works out-of-the-box!`
    );
  }
}

// Test PostgreSQL connection (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  initDb();
}

rawPool.on('error', (err) => {
  console.warn('[Database] PostgreSQL pool error:', err.message);
  usePostgres = false;
});

/**
 * Universal query runner with automatic PostgreSQL + embedded fallback
 */
export async function query(text, params = []) {
  if (usePostgres) {
    try {
      return await rawPool.query(text, params);
    } catch (err) {
      console.warn('[Database] PostgreSQL query error, falling back to local store:', err.message);
      return await executeLocalQuery(text, params);
    }
  }

  return await executeLocalQuery(text, params);
}

// Drop-in compatible pool export
export const pool = {
  query: (text, params) => query(text, params),
  connect: () => rawPool.connect(),
  end: () => rawPool.end()
};
