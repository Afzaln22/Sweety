describe('Reports Calculation Tests', () => {
  function computeReportStats(readings) {
    if (!readings || readings.length === 0) {
      return {
        highest: null,
        lowest: null,
        average: null,
        count: 0
      };
    }

    let highest = readings[0].glucose_value;
    let lowest = readings[0].glucose_value;
    let sum = 0;

    for (const r of readings) {
      sum += r.glucose_value;
      if (r.glucose_value > highest) highest = r.glucose_value;
      if (r.glucose_value < lowest) lowest = r.glucose_value;
    }

    const rawAvg = sum / readings.length;
    const average = Math.round(rawAvg * 10) / 10;

    return {
      highest,
      lowest,
      average,
      count: readings.length
    };
  }

  test('Computes stats correctly for daily readings matching Figma design (98, 142, 162)', () => {
    const readings = [
      { slot: 'Morning (fasting)', glucose_value: 98 },
      { slot: 'After breakfast', glucose_value: 142 },
      { slot: 'After lunch', glucose_value: 162 }
    ];

    const stats = computeReportStats(readings);
    expect(stats.highest).toBe(162);
    expect(stats.lowest).toBe(98);
    // (98 + 142 + 162) / 3 = 402 / 3 = 134.0
    expect(stats.average).toBe(134.0);
    expect(stats.count).toBe(3);
  });

  test('Rounds average strictly to 1 decimal place', () => {
    // 100 + 105 + 110 = 315 / 3 = 105
    // Test a non-terminating decimal: 100 + 101 = 201 / 2 = 100.5
    // 100 + 100 + 101 = 301 / 3 = 100.3333... -> 100.3
    const readings = [
      { glucose_value: 100 },
      { glucose_value: 100 },
      { glucose_value: 101 }
    ];
    const stats = computeReportStats(readings);
    expect(stats.average).toBe(100.3);
  });

  test('Handles empty state gracefully', () => {
    const stats = computeReportStats([]);
    expect(stats.highest).toBeNull();
    expect(stats.lowest).toBeNull();
    expect(stats.average).toBeNull();
    expect(stats.count).toBe(0);
  });

  test('Computes date ranges correctly for Daily, MTD, and Monthly reports', () => {
    const selectedDate = '2026-10-15';
    const parts = selectedDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);

    // 1. Daily: 15 Oct 2026
    const dailyStart = selectedDate;
    const dailyEnd = selectedDate;
    expect(dailyStart).toBe('2026-10-15');
    expect(dailyEnd).toBe('2026-10-15');

    // 2. Month-to-date: 1 Oct 2026 - 15 Oct 2026
    const mtdStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const mtdEnd = selectedDate;
    expect(mtdStart).toBe('2026-10-01');
    expect(mtdEnd).toBe('2026-10-15');

    // 3. Monthly (Whole previous month): 1 Sep 2026 - 30 Sep 2026
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const lastDayOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
    const prevMonthEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;
    expect(prevMonthStart).toBe('2026-09-01');
    expect(prevMonthEnd).toBe('2026-09-30');
  });
});
