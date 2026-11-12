import { pool } from '../config/db.js';

/**
 * Computes statistical metrics (Highest, Lowest, Average rounded to 1 decimal, Count, Spikes, Dips, Time in range)
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
      count: 0,
      spikes: 0,
      dips: 0,
      inRangePercent: 0
    };
  }

  let highest = readings[0].glucose_value;
  let highestSlot = readings[0].slot;
  let highestDate = readings[0].reading_date;

  let lowest = readings[0].glucose_value;
  let lowestSlot = readings[0].slot;
  let lowestDate = readings[0].reading_date;

  let sum = 0;
  let spikes = 0;
  let dips = 0;
  let inRange = 0;

  for (const r of readings) {
    sum += r.glucose_value;

    if (r.glucose_value > 140) {
      spikes++;
    } else if (r.glucose_value < 70) {
      dips++;
    } else {
      inRange++;
    }

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
  const inRangePercent = Math.round((inRange / readings.length) * 100);

  return {
    highest,
    highestSlot,
    highestDate,
    lowest,
    lowestSlot,
    lowestDate,
    average,
    count: readings.length,
    spikes,
    dips,
    inRangePercent
  };
}

/**
 * Builds chronological chart points with increase/decrease delta and status classification
 */
function buildChronologicalChartData(readings) {
  if (!readings || readings.length === 0) return [];

  const slotOrder = {
    'Morning (fasting)': 1,
    'After breakfast': 2,
    'After lunch': 3,
    'After dinner': 4
  };

  const sorted = [...readings].sort((a, b) => {
    const dateA = a.reading_date?.slice ? a.reading_date.slice(0, 10) : String(a.reading_date).slice(0, 10);
    const dateB = b.reading_date?.slice ? b.reading_date.slice(0, 10) : String(b.reading_date).slice(0, 10);
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (slotOrder[a.slot] || 5) - (slotOrder[b.slot] || 5);
  });

  return sorted.map((r, i) => {
    const prev = i > 0 ? sorted[i - 1].glucose_value : null;
    const diff = prev !== null ? r.glucose_value - prev : 0;
    const dateStr = r.reading_date?.slice ? r.reading_date.slice(0, 10) : String(r.reading_date).slice(0, 10);
    const shortDate = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let status = 'in_range';
    if (r.glucose_value > 140) status = 'spike';
    else if (r.glucose_value < 70) status = 'dip';

    return {
      id: r.id,
      date: dateStr,
      label: `${shortDate} · ${r.slot.replace('After ', '')}`,
      shortDate,
      slot: r.slot,
      time: r.recorded_at || '',
      value: r.glucose_value,
      diff,
      diffLabel: diff > 0 ? `+${diff}` : String(diff),
      status
    };
  });
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

    const { year, month } = parseDateParts(selectedDate);

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
          readings: dailyRes.rows,
          chartData: buildChronologicalChartData(dailyRes.rows)
        },
        monthToDate: {
          range: { start: mtdStart, end: mtdEnd },
          stats: mtdStats,
          readings: mtdRes.rows.slice(0, 10), // recent readings in period
          chartData: buildChronologicalChartData(mtdRes.rows)
        },
        previousMonth: {
          range: { start: prevMonthStart, end: prevMonthEnd },
          stats: prevMonthStats,
          readings: prevMonthRes.rows.slice(0, 10), // recent readings in period
          chartData: buildChronologicalChartData(prevMonthRes.rows)
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

    const daysMap = {};
    result.rows.forEach((row) => {
      const d = row.reading_date.toISOString
        ? row.reading_date.toISOString().slice(0, 10)
        : String(row.reading_date).slice(0, 10);
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
