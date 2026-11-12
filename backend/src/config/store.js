import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'sweety_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return initDefaultData();
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading data file, re-initializing default data:', err.message);
    return initDefaultData();
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving data file:', err);
  }
}

function initDefaultData() {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Password123!', salt);
  const alexId = crypto.randomUUID();

  const defaultUsers = [
    {
      id: alexId,
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    }
  ];

  const defaultReadings = [
    // Today 15 Oct 2026 (matching Figma screens: 98, 142, 162)
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-15', slot: 'Morning (fasting)', glucose_value: 98, recorded_at: '7:30 AM', created_at: '2026-10-15T07:30:00Z', updated_at: '2026-10-15T07:30:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-15', slot: 'After breakfast', glucose_value: 142, recorded_at: '9:15 AM', created_at: '2026-10-15T09:15:00Z', updated_at: '2026-10-15T09:15:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-15', slot: 'After lunch', glucose_value: 162, recorded_at: '1:10 PM', created_at: '2026-10-15T13:10:00Z', updated_at: '2026-10-15T13:10:00Z' },

    // Earlier October 2026
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-14', slot: 'Morning (fasting)', glucose_value: 104, recorded_at: '7:45 AM', created_at: '2026-10-14T07:45:00Z', updated_at: '2026-10-14T07:45:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-14', slot: 'After breakfast', glucose_value: 138, recorded_at: '9:20 AM', created_at: '2026-10-14T09:20:00Z', updated_at: '2026-10-14T09:20:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-13', slot: 'Morning (fasting)', glucose_value: 96, recorded_at: '7:35 AM', created_at: '2026-10-13T07:35:00Z', updated_at: '2026-10-13T07:35:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-13', slot: 'After lunch', glucose_value: 151, recorded_at: '1:05 PM', created_at: '2026-10-13T13:05:00Z', updated_at: '2026-10-13T13:05:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-12', slot: 'After dinner', glucose_value: 126, recorded_at: '8:45 PM', created_at: '2026-10-12T20:45:00Z', updated_at: '2026-10-12T20:45:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-11', slot: 'Morning (fasting)', glucose_value: 100, recorded_at: '7:30 AM', created_at: '2026-10-11T07:30:00Z', updated_at: '2026-10-11T07:30:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-11', slot: 'After lunch', glucose_value: 145, recorded_at: '1:15 PM', created_at: '2026-10-11T13:15:00Z', updated_at: '2026-10-11T13:15:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-10', slot: 'Morning (fasting)', glucose_value: 95, recorded_at: '7:20 AM', created_at: '2026-10-10T07:20:00Z', updated_at: '2026-10-10T07:20:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-10', slot: 'After dinner', glucose_value: 130, recorded_at: '8:30 PM', created_at: '2026-10-10T20:30:00Z', updated_at: '2026-10-10T20:30:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-09', slot: 'Morning (fasting)', glucose_value: 92, recorded_at: '7:15 AM', created_at: '2026-10-09T07:15:00Z', updated_at: '2026-10-09T07:15:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-09', slot: 'After breakfast', glucose_value: 135, recorded_at: '9:00 AM', created_at: '2026-10-09T09:00:00Z', updated_at: '2026-10-09T09:00:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-07', slot: 'After lunch', glucose_value: 178, recorded_at: '1:25 PM', created_at: '2026-10-07T13:25:00Z', updated_at: '2026-10-07T13:25:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-10-03', slot: 'Morning (fasting)', glucose_value: 92, recorded_at: '7:10 AM', created_at: '2026-10-03T07:10:00Z', updated_at: '2026-10-03T07:10:00Z' },

    // September 2026 (Previous month)
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-09-30', slot: 'Morning (fasting)', glucose_value: 95, recorded_at: '7:30 AM', created_at: '2026-09-30T07:30:00Z', updated_at: '2026-09-30T07:30:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-09-30', slot: 'After lunch', glucose_value: 140, recorded_at: '1:15 PM', created_at: '2026-09-30T13:15:00Z', updated_at: '2026-09-30T13:15:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-09-29', slot: 'After dinner', glucose_value: 125, recorded_at: '8:40 PM', created_at: '2026-09-29T20:40:00Z', updated_at: '2026-09-29T20:40:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-09-18', slot: 'After lunch', glucose_value: 184, recorded_at: '1:30 PM', created_at: '2026-09-18T13:30:00Z', updated_at: '2026-09-18T13:30:00Z' },
    { id: crypto.randomUUID(), user_id: alexId, reading_date: '2026-09-04', slot: 'Morning (fasting)', glucose_value: 88, recorded_at: '7:20 AM', created_at: '2026-09-04T07:20:00Z', updated_at: '2026-09-04T07:20:00Z' }
  ];

  const data = { users: defaultUsers, readings: defaultReadings };
  saveData(data);
  return data;
}

/**
 * Universal Query Engine for Sweety
 * Faithfully executes SQL queries against the local store with PostgreSQL result structure
 */
export async function executeLocalQuery(text, params = []) {
  const data = loadData();
  const trimmed = text.trim();

  // Normalize query for simple pattern matching
  const sql = trimmed.replace(/\s+/g, ' ');

  // 1. SELECT users by email
  if (/^SELECT .+ FROM users WHERE email =/i.test(sql)) {
    const email = params[0]?.toLowerCase();
    const rows = data.users.filter((u) => u.email.toLowerCase() === email);
    return { rows, rowCount: rows.length };
  }

  // 1b. SELECT all users
  if (/^SELECT .+ FROM users/i.test(sql) && !sql.includes('WHERE')) {
    return { rows: data.users, rowCount: data.users.length };
  }

  // 2. INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at
  if (/^INSERT INTO users/i.test(sql)) {
    const [name, email, password_hash] = params;
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      password_hash,
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    saveData(data);
    return {
      rows: [{ id: newUser.id, name: newUser.name, email: newUser.email, created_at: newUser.created_at }],
      rowCount: 1
    };
  }

  // 3. SELECT id, name, email, password_hash FROM users WHERE email = $1
  if (/^SELECT id, name, email, password_hash FROM users WHERE email =/i.test(sql)) {
    const email = params[0]?.toLowerCase();
    const rows = data.users
      .filter((u) => u.email.toLowerCase() === email)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, password_hash: u.password_hash }));
    return { rows, rowCount: rows.length };
  }

  // 4. SELECT id, name, email, created_at FROM users WHERE id = $1
  if (/^SELECT id, name, email, created_at FROM users WHERE id =/i.test(sql)) {
    const id = params[0];
    const rows = data.users
      .filter((u) => u.id === id)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, created_at: u.created_at }));
    return { rows, rowCount: rows.length };
  }

  // 5. INSERT INTO readings
  if (/^INSERT INTO readings/i.test(sql)) {
    const [user_id, reading_date, slot, glucose_value, recorded_at] = params;
    const dateStr = reading_date?.slice ? reading_date.slice(0, 10) : reading_date;
    const newReading = {
      id: crypto.randomUUID(),
      user_id,
      reading_date: dateStr,
      slot,
      glucose_value: Number(glucose_value),
      recorded_at: recorded_at || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.readings.push(newReading);
    saveData(data);
    return { rows: [newReading], rowCount: 1 };
  }

  // General count for readings
  if (/^SELECT COUNT\(\*\) FROM readings;?$/i.test(sql.trim())) {
    return { rows: [{ count: String(data.readings.length) }], rowCount: 1 };
  }

  // 6. SELECT COUNT(*) FROM readings WHERE user_id = $1 AND reading_date = $2
  if (/^SELECT COUNT\(\*\) FROM readings WHERE user_id = \$1 AND reading_date = \$2/i.test(sql)) {
    const [userId, readingDate] = params;
    const dateStr = readingDate?.slice ? readingDate.slice(0, 10) : readingDate;
    const count = data.readings.filter(
      (r) => r.user_id === userId && (r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date) === dateStr
    ).length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  // 7. Duplicate slot check: SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3
  if (/^SELECT id FROM readings WHERE user_id = \$1 AND reading_date = \$2 AND slot = \$3/i.test(sql)) {
    const [userId, readingDate, slot, readingId] = params;
    const dateStr = readingDate?.slice ? readingDate.slice(0, 10) : readingDate;
    const rows = data.readings.filter((r) => {
      const match =
        r.user_id === userId &&
        (r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date) === dateStr &&
        r.slot === slot;
      return readingId ? match && r.id !== readingId : match;
    });
    return { rows: rows.map((r) => ({ id: r.id })), rowCount: rows.length };
  }

  // 8. SELECT reading_date FROM readings WHERE id = $1 AND user_id = $2
  if (/^SELECT reading_date FROM readings WHERE id = \$1 AND user_id = \$2/i.test(sql)) {
    const [id, userId] = params;
    const found = data.readings.find((r) => r.id === id && r.user_id === userId);
    return { rows: found ? [{ reading_date: new Date(found.reading_date) }] : [], rowCount: found ? 1 : 0 };
  }

  // 9. Single reading by id: SELECT ... FROM readings WHERE id = $1 AND user_id = $2
  if (/^SELECT .+ FROM readings WHERE id = \$1 AND user_id = \$2/i.test(sql)) {
    const [id, userId] = params;
    const found = data.readings.find((r) => r.id === id && r.user_id === userId);
    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
  }

  // 10. Readings list / filter / pagination
  if (/^SELECT COUNT\(\*\) FROM readings WHERE/i.test(sql)) {
    const userId = params[0];
    let filtered = data.readings.filter((r) => r.user_id === userId);

    let idx = 1;
    if (sql.includes('slot =')) {
      const s = params[idx++];
      filtered = filtered.filter((r) => r.slot === s);
    }
    if (sql.includes('reading_date >=')) {
      const dFrom = params[idx++];
      filtered = filtered.filter((r) => (r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date) >= dFrom);
    }
    if (sql.includes('reading_date <=')) {
      const dTo = params[idx++];
      filtered = filtered.filter((r) => (r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date) <= dTo);
    }
    if (sql.includes('ILIKE')) {
      const q = String(params[idx++]).replace(/%/g, '').toLowerCase();
      filtered = filtered.filter((r) => r.slot.toLowerCase().includes(q) || String(r.glucose_value).includes(q));
    }

    return { rows: [{ count: String(filtered.length) }], rowCount: 1 };
  }

  // 11. Fetch paginated readings
  if (/^SELECT .+ FROM readings WHERE user_id = \$1/i.test(sql) && sql.includes('LIMIT')) {
    const userId = params[0];
    let filtered = data.readings.filter((r) => r.user_id === userId);

    let idx = 1;
    if (sql.includes('slot =')) {
      const s = params[idx++];
      filtered = filtered.filter((r) => r.slot === s);
    }
    if (sql.includes('reading_date >=')) {
      const dFrom = params[idx++];
      filtered = filtered.filter((r) => (r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date) >= dFrom);
    }
    if (sql.includes('reading_date <=')) {
      const dTo = params[idx++];
      filtered = filtered.filter((r) => (r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date) <= dTo);
    }
    if (sql.includes('ILIKE')) {
      const q = String(params[idx++]).replace(/%/g, '').toLowerCase();
      filtered = filtered.filter((r) => r.slot.toLowerCase().includes(q) || String(r.glucose_value).includes(q));
    }

    // Sort by date DESC, created_at DESC
    filtered.sort((a, b) => {
      const dateA = a.reading_date?.slice ? a.reading_date.slice(0, 10) : a.reading_date;
      const dateB = b.reading_date?.slice ? b.reading_date.slice(0, 10) : b.reading_date;
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    const limit = params[idx++];
    const offset = params[idx++];
    const pageRows = filtered.slice(offset, offset + limit);
    return { rows: pageRows, rowCount: pageRows.length };
  }

  // 12. Daily report: WHERE user_id = $1 AND reading_date = $2
  if (/WHERE user_id = \$1 AND reading_date = \$2/i.test(sql)) {
    const [userId, readingDate] = params;
    const dateStr = readingDate?.slice ? readingDate.slice(0, 10) : readingDate;
    const slotOrder = {
      'Morning (fasting)': 1,
      'After breakfast': 2,
      'After lunch': 3,
      'After dinner': 4
    };
    const rows = data.readings
      .filter((r) => r.user_id === userId && (r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date) === dateStr)
      .sort((a, b) => (slotOrder[a.slot] || 5) - (slotOrder[b.slot] || 5));
    return { rows, rowCount: rows.length };
  }

  // 13. Range report (MTD / Previous month): WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
  if (/WHERE user_id = \$1 AND reading_date >= \$2 AND reading_date <= \$3/i.test(sql) && !sql.includes('GROUP BY')) {
    const [userId, start, end] = params;
    const rows = data.readings
      .filter((r) => {
        const d = r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date;
        return r.user_id === userId && d >= start && d <= end;
      })
      .sort((a, b) => {
        const dateA = a.reading_date?.slice ? a.reading_date.slice(0, 10) : a.reading_date;
        const dateB = b.reading_date?.slice ? b.reading_date.slice(0, 10) : b.reading_date;
        return dateB.localeCompare(dateA);
      });
    return { rows, rowCount: rows.length };
  }

  // 14. Trend query (with GROUP BY)
  if (sql.includes('GROUP BY reading_date')) {
    const [userId, start, end] = params;
    const inRange = data.readings.filter((r) => {
      const d = r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date;
      return r.user_id === userId && d >= start && d <= end;
    });

    const groups = {};
    for (const r of inRange) {
      const d = r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(r.glucose_value);
    }

    const rows = Object.keys(groups)
      .sort()
      .map((d) => {
        const vals = groups[d];
        const sum = vals.reduce((a, b) => a + b, 0);
        const max = Math.max(...vals);
        return {
          reading_date: d,
          avg_value: sum / vals.length,
          max_value: max,
          count: vals.length
        };
      });

    return { rows, rowCount: rows.length };
  }

  // 15. UPDATE readings
  if (/^UPDATE readings/i.test(sql)) {
    const [reading_date, slot, glucose_value, recorded_at, id, userId] = params;
    const dateStr = reading_date?.slice ? reading_date.slice(0, 10) : reading_date;
    const item = data.readings.find((r) => r.id === id && r.user_id === userId);
    if (!item) return { rows: [], rowCount: 0 };

    item.reading_date = dateStr;
    item.slot = slot;
    item.glucose_value = Number(glucose_value);
    item.recorded_at = recorded_at || item.recorded_at;
    item.updated_at = new Date().toISOString();
    saveData(data);
    return { rows: [item], rowCount: 1 };
  }

  // 16. DELETE FROM readings
  if (/^DELETE FROM readings/i.test(sql)) {
    if (params.length === 0) {
      const count = data.readings.length;
      data.readings = [];
      saveData(data);
      return { rows: [], rowCount: count };
    }
    const [id, userId] = params;
    const index = data.readings.findIndex((r) => r.id === id && r.user_id === userId);
    if (index === -1) return { rows: [], rowCount: 0 };

    data.readings.splice(index, 1);
    saveData(data);
    return { rows: [{ id }], rowCount: 1 };
  }

  // 17. DELETE FROM users WHERE email = $1
  if (/^DELETE FROM users WHERE email =/i.test(sql)) {
    const email = params[0]?.toLowerCase();
    data.users = data.users.filter((u) => u.email.toLowerCase() !== email);
    saveData(data);
    return { rows: [], rowCount: 1 };
  }

  // 18. Gracefully ignore DDL migrations in local JSON store
  if (/^CREATE TABLE|^CREATE INDEX|^ALTER TABLE/i.test(sql) || sql.includes('CREATE TABLE IF NOT EXISTS')) {
    return { rows: [], rowCount: 0 };
  }

  console.warn('Unhandled SQL query in local store:', sql);
  return { rows: [], rowCount: 0 };
}
