import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigration() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running database migrations...');
  try {
    await pool.query(schemaSql);
    console.log('Database tables and indexes created successfully.');
  } catch (error) {
    console.warn('PostgreSQL migration notice (using built-in storage if offline):', error.message);
  }
}

// Run directly if invoked from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => pool.end())
    .catch((err) => {
      console.warn(err.message);
      process.exit(0);
    });
}
