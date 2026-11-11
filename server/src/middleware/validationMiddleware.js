import { pool } from '../config/db.js';

export const VALID_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

/**
 * Validates reading creation or update payload according to specification
 */
export async function validateReading(req, res, next) {
  const { reading_date, slot, glucose_value } = req.body;
  const readingId = req.params.id; // defined on PUT /api/readings/:id
  const userId = req.user.id;

  // 1. Value is required
  if (glucose_value === undefined || glucose_value === null || String(glucose_value).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Please enter a glucose value.'
    });
  }

  // 2. Value must be a whole number between 40 and 600
  const numValue = Number(glucose_value);
  if (
    !Number.isInteger(numValue) ||
    isNaN(numValue) ||
    numValue < 40 ||
    numValue > 600
  ) {
    return res.status(400).json({
      success: false,
      error: 'Value must be between 40 and 600 mg/dl.'
    });
  }

  // Date is required
  if (!reading_date) {
    return res.status(400).json({
      success: false,
      error: 'Reading date is required.'
    });
  }

  // 5. Date cannot be in the future
  // Format check: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(reading_date)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date format. Expected YYYY-MM-DD.'
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (reading_date > todayStr) {
    return res.status(400).json({
      success: false,
      error: 'Date cannot be in the future.'
    });
  }

  // Slot validity check
  if (!slot || !VALID_SLOTS.includes(slot)) {
    return res.status(400).json({
      success: false,
      error: `Slot must be one of: ${VALID_SLOTS.join(', ')}`
    });
  }

  try {
    // 3. Only one reading per slot per day
    const duplicateQuery = readingId
      ? `SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3 AND id != $4;`
      : `SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3;`;
    const duplicateParams = readingId
      ? [userId, reading_date, slot, readingId]
      : [userId, reading_date, slot];

    const duplicateRes = await pool.query(duplicateQuery, duplicateParams);
    if (duplicateRes.rows.length > 0) {
      const article = /^[aeiou]/i.test(slot) ? 'an' : 'a';
      return res.status(400).json({
        success: false,
        error: `You already have ${article} ${slot} reading for this date.`
      });
    }

    // 4. Maximum 4 readings per day
    // If creating a new reading, check if already 4 exist for that date
    if (!readingId) {
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM readings WHERE user_id = $1 AND reading_date = $2;`,
        [userId, reading_date]
      );
      const totalForDay = parseInt(countRes.rows[0].count, 10);
      if (totalForDay >= 4) {
        return res.status(400).json({
          success: false,
          error: 'You can add only 4 readings per day.'
        });
      }
    } else {
      // If updating, verify if date is being changed to another date that already has 4
      const currentReading = await pool.query(
        `SELECT reading_date FROM readings WHERE id = $1 AND user_id = $2;`,
        [readingId, userId]
      );
      if (currentReading.rows.length > 0) {
        const oldDate = currentReading.rows[0].reading_date.toISOString().slice(0, 10);
        if (oldDate !== reading_date) {
          const countRes = await pool.query(
            `SELECT COUNT(*) FROM readings WHERE user_id = $1 AND reading_date = $2;`,
            [userId, reading_date]
          );
          const totalForDay = parseInt(countRes.rows[0].count, 10);
          if (totalForDay >= 4) {
            return res.status(400).json({
              success: false,
              error: 'You can add only 4 readings per day.'
            });
          }
        }
      }
    }

    next();
  } catch (err) {
    console.error('Validation error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error during validation.'
    });
  }
}

