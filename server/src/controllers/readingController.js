import { pool } from '../config/db.js';

function formatCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export async function createReading(req, res) {
  try {
    const { reading_date, slot, glucose_value, recorded_at } = req.body;
    const userId = req.user.id;

    const timeToStore = recorded_at || formatCurrentTime();

    const result = await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, glucose_value, recorded_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, reading_date, slot, glucose_value, recorded_at, created_at, updated_at;`,
      [userId, reading_date, slot, glucose_value, timeToStore]
    );

    return res.status(201).json({
      success: true,
      message: 'Reading recorded successfully.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('createReading error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record reading.'
    });
  }
}

export async function getReadings(req, res) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const { slot, date_from, date_to, search } = req.query;

    let filterClauses = ['user_id = $1'];
    let filterParams = [userId];
    let paramIndex = 2;

    if (slot && slot !== 'All time slots') {
      filterClauses.push(`slot = $${paramIndex}`);
      filterParams.push(slot);
      paramIndex++;
    }

    if (date_from) {
      filterClauses.push(`reading_date >= $${paramIndex}`);
      filterParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      filterClauses.push(`reading_date <= $${paramIndex}`);
      filterParams.push(date_to);
      paramIndex++;
    }

    if (search && search.trim() !== '') {
      filterClauses.push(`(slot ILIKE $${paramIndex} OR CAST(glucose_value AS TEXT) ILIKE $${paramIndex})`);
      filterParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = filterClauses.join(' AND ');

    // Count total matching readings
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM readings WHERE ${whereClause};`,
      filterParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Fetch page of readings
    const dataQuery = `
      SELECT id, user_id, reading_date, slot, glucose_value, recorded_at, created_at, updated_at
      FROM readings
      WHERE ${whereClause}
      ORDER BY reading_date DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    const dataParams = [...filterParams, limit, offset];
    const dataResult = await pool.query(dataQuery, dataParams);

    return res.status(200).json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('getReadings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve readings.'
    });
  }
}

export async function getReadingById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, user_id, reading_date, slot, glucose_value, recorded_at, created_at, updated_at
       FROM readings
       WHERE id = $1 AND user_id = $2;`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reading not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('getReadingById error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve reading.'
    });
  }
}

export async function updateReading(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reading_date, slot, glucose_value, recorded_at } = req.body;

    // Check reading exists and belongs to user
    const existing = await pool.query(
      `SELECT id, recorded_at FROM readings WHERE id = $1 AND user_id = $2;`,
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reading not found.'
      });
    }

    const timeToStore = recorded_at || existing.rows[0].recorded_at || formatCurrentTime();

    const result = await pool.query(
      `UPDATE readings
       SET reading_date = $1, slot = $2, glucose_value = $3, recorded_at = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING id, user_id, reading_date, slot, glucose_value, recorded_at, created_at, updated_at;`,
      [reading_date, slot, glucose_value, timeToStore, id, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Reading updated successfully.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('updateReading error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update reading.'
    });
  }
}

export async function deleteReading(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reading not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reading deleted successfully.'
    });
  } catch (error) {
    console.error('deleteReading error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete reading.'
    });
  }
}
