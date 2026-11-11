import dotenv from 'dotenv';
import app from './app.js';
import { runMigration } from './db/migrate.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Attempt auto-migration on boot
    await runMigration().catch((err) => {
      console.warn('Auto-migration notice (check database credentials if offline):', err.message);
    });

    app.listen(PORT, () => {
      console.log(`Sweety API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
