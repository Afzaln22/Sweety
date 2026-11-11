import { pool } from '../config/db.js';

/**
 * Computes statistical metrics (Highest, Lowest, Average rounded to 1 decimal, Count)
 * for an array of reading records.
 */
function computeReportStats(readings) {
  if (!readings || readings.length === 0) {
    return {
      highest: null,
      highestSlot: null,
      highestDate: null,
      lowest: null,
      lowestSlot: null,
      lowestDate: null,
      average: null,
      count: 0
    };
  }

  let highest = readings[0].glucose_value;
  let highestSlot = readings[0].slot;
  let highestDate = readings[0].reading_date;

  let lowest = readings[0].glucose_value;
  let lowestSlot = readings[0].slot;
  let lowestDate = readings[0].reading_date;

  let sum = 0;

  for (const r of readings) {
    sum += r.glucose_value;
    if (r.glucose_value > highest) {
      highest = r.glucose_value;
      highestSlot = r.slot;
      highestDate = r.reading_date;
    }
    if (r.glucose_value < lowest) {
      lowest = r.glucose_value;
      lowestSlot = r.slot;
      lowestDate = r.reading_date;
    }
  }

  const rawAvg = sum / readings.length;
  // Round to exactly 1 decimal place as required
  const average = Math.round(rawAvg * 10) / 10;

  return {
    highest,
    highestSlot,
    highestDate,
    lowest,
    lowestSlot,
    lowestDate,
    average,
    count: readings.length
  };
}

/**
 * Parses a YYYY-MM-DD date string safely without timezone drift
 */
function parseDateParts(dateStr) {
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10), // 1-12
    day: parseInt(parts[2], 10)
  };
}

/**
 * Formats a date object or components into YYYY-MM-DD
 */
function formatDateStr(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export async function getReports(req, res) {
  try {
    const userId = req.user.id;
    // Target date defaults to today if omitted
    const todayStr = new Date().toISOString().slice(0, 10);
    const selectedDate = req.query.date || todayStr;

    const { year, month, day } = parseDateParts(selectedDate);

    // 1. Daily Report Range: Exactly the selected date
    const dailyStart = selectedDate;
    const dailyEnd = selectedDate;

    // 2. Month-to-date Range: 1st of month to selected date
    const mtdStart = formatDateStr(year, month, 1);
    const mtdEnd = selectedDate;

    // 3. Monthly (Whole previous month) Range:
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevMonthStart = formatDateStr(prevYear, prevMonth, 1);
    // Last day of previous month:
    const lastDayOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
    const prevMonthEnd = formatDateStr(prevYear, prevMonth, lastDayOfPrevMonth);

    // Fetch Daily readings
    const dailyRes = await pool.query(
      `SELECT id, reading_date, slot, glucose_value, recorded_at, created_at
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY 
         CASE slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC;`,
      [userId, selectedDate]
    );

    // Fetch MTD readings
    const mtdRes = await pool.query(
      `SELECT id, reading_date, slot, glucose_value, recorded_at, created_at
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date DESC, created_at DESC;`,
      [userId, mtdStart, mtdEnd]
    );

    // Fetch Previous Month readings
    const prevMonthRes = await pool.query(
      `SELECT id, reading_date, slot, glucose_value, recorded_at, created_at
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date DESC, created_at DESC;`,
      [userId, prevMonthStart, prevMonthEnd]
    );

    const dailyStats = computeReportStats(dailyRes.rows);
    const mtdStats = computeReportStats(mtdRes.rows);
    const prevMonthStats = computeReportStats(prevMonthRes.rows);

    return res.status(200).json({
      success: true,
      data: {
        selectedDate,
        daily: {
          range: { start: dailyStart, end: dailyEnd },
          stats: dailyStats,
          readings: dailyRes.rows
        },
        monthToDate: {
          range: { start: mtdStart, end: mtdEnd },
          stats: mtdStats,
          readings: mtdRes.rows.slice(0, 10) // recent readings in period
        },
        previousMonth: {
          range: { start: prevMonthStart, end: prevMonthEnd },
          stats: prevMonthStats,
          readings: prevMonthRes.rows.slice(0, 10) // recent readings in period
        }
      }
    });
  } catch (error) {
    console.error('getReports error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate reports.'
    });
  }
}

/**
 * Returns 7-day trend data ending at selectedDate for the dashboard chart
 */
export async function getTrend(req, res) {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().slice(0, 10);
    const selectedDate = req.query.date || todayStr;

    // 7 days ending at selectedDate
    const endDate = new Date(selectedDate);
    const startDate = new Date(selectedDate);
    startDate.setDate(endDate.getDate() - 6);

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    const result = await pool.query(
      `SELECT reading_date, AVG(glucose_value) as avg_value, MAX(glucose_value) as max_value, COUNT(*) as count
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       GROUP BY reading_date
       ORDER BY reading_date ASC;`,
      [userId, startStr, endStr]
    );

    // Map all 7 days so no day is missing
    const daysMap = {};
    result.rows.forEach(row => {
      const d = row.reading_date.toISOString ? row.reading_date.toISOString().slice(0, 10) : String(row.reading_date).slice(0, 10);
      daysMap[d] = {
        avg: Math.round(parseFloat(row.avg_value) * 10) / 10,
        max: parseInt(row.max_value, 10),
        count: parseInt(row.count, 10)
      };
    });

    const trend = [];
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const dStr = curr.toISOString().slice(0, 10);
      const dayData = daysMap[dStr] || { avg: null, max: null, count: 0 };
      const label = curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trend.push({
        date: dStr,
        label,
        avg: dayData.avg,
        max: dayData.max,
        count: dayData.count,
        isToday: dStr === selectedDate
      });
      curr.setDate(curr.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('getTrend error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve trend data.'
    });
  }
}
