import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { runMigration } from './migrate.js';

export async function seedDatabase() {
  await runMigration();

  console.log('Seeding initial data...');

  // 1. Clean existing data for clean seed
  await pool.query('DELETE FROM readings;');
  await pool.query('DELETE FROM users WHERE email = $1;', ['alex.morgan@example.com']);

  // 2. Insert Alex Morgan
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const userRes = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id;`,
    ['Alex Morgan', 'alex.morgan@example.com', passwordHash]
  );

  const userId = userRes.rows[0].id;
  console.log(`Created user Alex Morgan with ID: ${userId}`);

  // 3. Seed readings matching the design screens
  // 15 Oct 2026: 3 readings (98, 142, 162)
  const todayReadings = [
    { date: '2026-10-15', slot: 'Morning (fasting)', value: 98, time: '7:30 AM' },
    { date: '2026-10-15', slot: 'After breakfast', value: 142, time: '9:15 AM' },
    { date: '2026-10-15', slot: 'After lunch', value: 162, time: '1:10 PM' }
  ];

  // Readings for earlier in October 2026 (Oct 1 to Oct 14)
  const octReadings = [
    { date: '2026-10-14', slot: 'Morning (fasting)', value: 104, time: '7:45 AM' },
    { date: '2026-10-14', slot: 'After breakfast', value: 138, time: '9:20 AM' },
    { date: '2026-10-13', slot: 'Morning (fasting)', value: 96, time: '7:35 AM' },
    { date: '2026-10-13', slot: 'After lunch', value: 151, time: '1:05 PM' },
    { date: '2026-10-12', slot: 'After dinner', value: 126, time: '8:45 PM' },
    { date: '2026-10-11', slot: 'Morning (fasting)', value: 100, time: '7:30 AM' },
    { date: '2026-10-11', slot: 'After lunch', value: 145, time: '1:15 PM' },
    { date: '2026-10-10', slot: 'Morning (fasting)', value: 95, time: '7:20 AM' },
    { date: '2026-10-10', slot: 'After dinner', value: 130, time: '8:30 PM' },
    { date: '2026-10-09', slot: 'Morning (fasting)', value: 92, time: '7:15 AM' },
    { date: '2026-10-09', slot: 'After breakfast', value: 135, time: '9:00 AM' },
    { date: '2026-10-07', slot: 'After lunch', value: 178, time: '1:25 PM' }, // Matches Highest in MTD screen
    { date: '2026-10-03', slot: 'Morning (fasting)', value: 92, time: '7:10 AM' }  // Matches Lowest in MTD screen
  ];

  // Readings for September 2026 (Previous month)
  const septReadings = [
    { date: '2026-09-30', slot: 'Morning (fasting)', value: 95, time: '7:30 AM' },
    { date: '2026-09-30', slot: 'After lunch', value: 140, time: '1:15 PM' },
    { date: '2026-09-29', slot: 'After dinner', value: 125, time: '8:40 PM' },
    { date: '2026-09-18', slot: 'After lunch', value: 184, time: '1:30 PM' }, // Matches Highest in Previous month screen
    { date: '2026-09-04', slot: 'Morning (fasting)', value: 88, time: '7:20 AM' }  // Matches Lowest in Previous month screen
  ];

  const allReadings = [...todayReadings, ...octReadings, ...septReadings];

  for (const r of allReadings) {
    await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, glucose_value, recorded_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, reading_date, slot) DO NOTHING;`,
      [userId, r.date, r.slot, r.value, r.time]
    );
  }

  console.log(`Successfully seeded ${allReadings.length} readings.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
