import { pool } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '../../data/sweety_db.json');

export async function clearAllData() {
  console.log('Clearing all old readings...');

  // 1. Clear PostgreSQL database if connected
  try {
    await pool.query('DELETE FROM readings;');
    console.log('Cleared readings from database.');
  } catch (err) {
    console.warn('Note on DB connection:', err.message);
  }

  // 2. Clear local persistent JSON store
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      data.readings = [];
      // Clean up temporary dummy users if any, preserving the signed-in user and Alex Morgan
      if (data.users && Array.isArray(data.users)) {
        data.users = data.users.filter(
          (u) =>
            u.email === 'alex.morgan@example.com' ||
            u.email === 'afzaln2003@gmail.com'
        );
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log('Successfully cleared all readings from sweety_db.json.');
    } catch (err) {
      console.error('Failed to update sweety_db.json:', err);
    }
  }

  console.log('Reset complete. Fresh, clean slate ready!');
}

clearAllData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

