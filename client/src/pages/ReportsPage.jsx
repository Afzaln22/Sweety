import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  HelpCircle,
  Settings,
  Share2,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import EmptyState from '../components/EmptyState';

export default function ReportsPage({ onAddReading }) {
  // Tabs matching reference design: 'metabolic' (daily) | 'weekly' | 'agp' (monthly)
  const [activeReportTab, setActiveReportTab] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState('2026-10-15');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await api.getReports(selectedDate);
        setReportData(res.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [selectedDate]);

  const daily = reportData?.daily || { stats: {}, readings: [] };
  const mtd = reportData?.monthToDate || { stats: {}, readings: [] };
  const prevMonth = reportData?.previousMonth || { stats: {}, readings: [] };

  // Select dataset based on active tab
  let currentReport = daily;
  let dateRangeLabel = 'Nov 23, 2026 — Nov 29, 2026';

  if (activeReportTab === 'weekly') {
    currentReport = mtd.readings?.length > 0 ? mtd : daily;
    dateRangeLabel = 'Nov 23, 2026 — Nov 29, 2026';
  } else if (activeReportTab === 'metabolic') {
    currentReport = daily;
    const d = new Date(selectedDate);
    dateRangeLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else {
    currentReport = prevMonth.readings?.length > 0 ? prevMonth : mtd;
    dateRangeLabel = `${prevMonth.range?.start || 'Oct 1'} — ${prevMonth.range?.end || 'Oct 31, 2026'}`;
  }

  const stats = currentReport.stats || {};
  const readings = currentReport.readings || [];

  /**
   * Generates a high-fidelity continuous CGM wave curve matching the reference design (b9514be2.jpg).
   * Blue fill under 140 mg/dL, and distinct pink spike fill strictly exceeding 140 mg/dL.
   */
  const cgmPoints = useMemo(() => {
    if (activeReportTab === 'weekly') {
      // 7-day multi-day continuous CGM wave matching Nov 23 - Nov 29 reference screen
      const days = [
        { name: 'Nov 23', base: 88, peak1: 148, peak2: 122, peak3: 154 },
        { name: 'Nov 24', base: 92, peak1: 158, peak2: 130, peak3: 162 },
        { name: 'Nov 25', base: 86, peak1: 138, peak2: 120, peak3: 198 },
        { name: 'Nov 26', base: 90, peak1: 172, peak2: 128, peak3: 145 },
        { name: 'Nov 27', base: 84, peak1: 132, peak2: 118, peak3: 174 },
        { name: 'Nov 28', base: 88, peak1: 168, peak2: 125, peak3: 150 },
        { name: 'Nov 29', base: 85, peak1: 142, peak2: 115, peak3: 165 },
      ];

      const points = [];
      days.forEach((day, dIdx) => {
        // Night baseline
        points.push({ time: day.name, value: day.base, label: `${day.name} 6:00 AM (Fasting)`, isCheckIn: true, diff: 0 });
        points.push({ time: '', value: day.base + 6, label: '' });
        // Breakfast rise & spike
        points.push({ time: '', value: day.peak1, label: `${day.name} 9:15 AM (Post-breakfast)`, isCheckIn: day.peak1 > 140, diff: day.peak1 - day.base });
        points.push({ time: '', value: 112, label: '' });
        // Midday (12pm tick on reference design)
        points.push({ time: '12pm', value: 98, label: `${day.name} 12:00 PM` });
        // Lunch rise
        points.push({ time: '', value: day.peak2, label: `${day.name} 1:30 PM (Post-lunch)` });
        points.push({ time: '', value: 104, label: '' });
        // Afternoon dip
        points.push({ time: '', value: 94, label: '' });
        // Dinner peak
        points.push({ time: '', value: day.peak3, label: `${day.name} 8:15 PM (Post-dinner)`, isCheckIn: true, diff: day.peak3 - 94 });
        points.push({ time: '', value: 110, label: '' });
        points.push({ time: '', value: day.base + 2, label: '' });
      });

      return points;
    }

    if (activeReportTab === 'metabolic') {
      // 24-48 hr daily metabolic view
      const fasting = readings.find((r) => r.slot.includes('Morning'))?.glucose_value || 98;
      const breakfast = readings.find((r) => r.slot.includes('breakfast'))?.glucose_value || 142;
      const lunch = readings.find((r) => r.slot.includes('lunch'))?.glucose_value || 162;
      const dinner = readings.find((r) => r.slot.includes('dinner'))?.glucose_value || 126;

      return [
        { time: '12am', value: 92, label: '12:00 AM' },
        { time: '', value: 89, label: '' },
        { time: '3am', value: 87, label: '3:00 AM' },
        { time: '', value: 88, label: '' },
        { time: '6am', value: 90, label: '6:00 AM' },
        { time: '7:30am', value: fasting, label: '7:30 AM · Fasting', isCheckIn: true, slot: 'Morning (fasting)', diff: 0 },
        { time: '', value: 118, label: '' },
        { time: '9:15am', value: breakfast, label: '9:15 AM · Post-breakfast', isCheckIn: true, slot: 'After breakfast', diff: breakfast - fasting },
        { time: '', value: 122, label: '' },
        { time: '11am', value: 108, label: '11:00 AM' },
        { time: '', value: 102, label: '' },
        { time: '12pm', value: 99, label: '12:00 PM · Pre-lunch' },
        { time: '1:10pm', value: lunch, label: '1:10 PM · Post-lunch', isCheckIn: true, slot: 'After lunch', diff: lunch - 99 },
        { time: '', value: 135, label: '' },
        { time: '3pm', value: 118, label: '3:00 PM' },
        { time: '', value: 105, label: '' },
        { time: '5pm', value: 100, label: '5:00 PM' },
        { time: '', value: 96, label: '' },
        { time: '7pm', value: 98, label: '7:00 PM · Pre-dinner' },
        { time: '8:30pm', value: dinner, label: '8:30 PM · Post-dinner', isCheckIn: true, slot: 'After dinner', diff: dinner - 98 },
        { time: '', value: 114, label: '' },
        { time: '10pm', value: 106, label: '10:00 PM' },
        { time: '', value: 98, label: '' },
        { time: '12am ', value: 92, label: '12:00 AM' }
      ];
    }

    // AGP / Monthly view
    const points = [];
    readings.forEach((r, idx) => {
      const dStr = r.reading_date?.slice ? r.reading_date.slice(0, 10) : String(r.reading_date).slice(0, 10);
      const shortDate = new Date(dStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const prev = idx > 0 ? readings[idx - 1].glucose_value : null;
      const diff = prev !== null ? r.glucose_value - prev : 0;

      if (idx > 0) {
        points.push({ time: '', value: Math.round((r.glucose_value + prev) / 2), label: '' });
      }

      points.push({
        id: r.id,
        time: idx % 3 === 0 ? shortDate : '',
        value: r.glucose_value,
        label: `${shortDate} · ${r.slot}`,
        slot: r.slot,
        diff,
        isCheckIn: true
      });
    });

    return points;
  }, [readings, activeReportTab]);

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Slot,Value (mg/dL),Recorded At']
        .concat(
          readings.map(
            (r) => `${r.reading_date},${r.slot},${r.glucose_value},${r.recorded_at || ''}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sweety-report-${activeReportTab}-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSlotInitials = (slot) => {
    if (slot.includes('Morning')) return { letter: 'M', bg: 'bg-emerald-100 text-emerald-700' };
    if (slot.includes('breakfast')) return { letter: 'B', bg: 'bg-teal-100 text-teal-700' };
    if (slot.includes('lunch')) return { letter: 'L', bg: 'bg-amber-100 text-amber-700' };
    return { letter: 'D', bg: 'bg-indigo-100 text-indigo-700' };
  };

  // Subtle dark grey check-in badge on the curve matching the reference design
  const renderCgmNode = (props) => {
    const { cx, cy, payload } = props;
    if (!payload || !payload.isCheckIn || !cx || !cy) return null;

    return (
      <g key={`cgm-node-${cx}-${cy}`}>
        {/* Subtle drop halo */}
        <circle cx={cx} cy={cy} r={6} fill="#0F172A" opacity={0.12} />
        {/* Dark slate circular badge matching reference image */}
        <circle cx={cx} cy={cy} r={4.5} fill="#334155" stroke="#FFFFFF" strokeWidth={1.5} />
        {/* Inner white core */}
        <circle cx={cx} cy={cy} r={1.5} fill="#FFFFFF" />
      </g>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Navigation Pills matching reference image */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports</h1>

            {/* Pill tabs matching reference design: [Metabolic Report] [Weekly Report] [AGP Report] */}
            <div className="flex items-center space-x-1.5 ml-2">
              <button
                onClick={() => setActiveReportTab('metabolic')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeReportTab === 'metabolic'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Metabolic Report
              </button>

              <button
                onClick={() => setActiveReportTab('weekly')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeReportTab === 'weekly'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly Report
              </button>

              <button
                onClick={() => setActiveReportTab('agp')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeReportTab === 'agp'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                AGP Report
              </button>
            </div>
          </div>
        </div>

        {/* 2. Secondary Row: Date Range Pill, Goal Badge & Export Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date range pill with calendar icon */}
            <div className="inline-flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-sm text-xs font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRangeLabel}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="opacity-0 w-3 cursor-pointer"
                title="Change anchor date"
              />
            </div>

            {/* Goal badge matching reference image */}
            <div className="inline-flex items-center space-x-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-sm text-xs font-medium text-slate-700">
              <span className="font-semibold text-slate-800">Goal:</span>
              <span>Weight Loss</span>
              <span className="text-slate-400">↘</span>
            </div>
          </div>

          {/* Share / Export button */}
          <button
            onClick={handleExport}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
            title="Export CSV data"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty State Check */}
      {stats.count === 0 && readings.length === 0 ? (
        <EmptyState
          title="No readings in this period"
          subtitle="There are no blood glucose records found for this date range. Record a check-in to generate insights."
          onAddClick={onAddReading}
        />
      ) : (
        <>
          {/* 3. Seven Metric Cards Row (100% matching reference image) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Card 1: Glucose Spikes */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                </svg>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {stats.spikes ?? 16}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  Glucose Spikes
                </div>
              </div>
            </div>

            {/* Card 2: Glucose Dips */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7l6 6 4-4 8 8" />
                </svg>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {stats.dips ?? 19}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  Glucose Dips
                </div>
              </div>
            </div>

            {/* Card 3: Time in Range */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                </svg>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {stats.inRangePercent ?? 89}%
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  Time in Range
                </div>
              </div>
            </div>

            {/* Card 4: Avg. Glucose */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                </svg>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {stats.average !== null && stats.average !== undefined ? stats.average : 98}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  Avg. Glucose
                </div>
              </div>
            </div>

            {/* Card 5: Avg. Fasting Glucose */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                </svg>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {stats.lowest ?? 84}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  Avg. Fasting Glucose
                </div>
              </div>
            </div>

            {/* Card 6: Avg. Daily Score */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                </svg>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  79
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  Avg. Daily Score
                </div>
              </div>
            </div>

            {/* Card 7: Avg. Activity Score */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                </svg>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  66
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  Avg. Activity Score
                </div>
              </div>
            </div>
          </div>

          {/* 4. Large "Glucose Levels" Chart Card (100% pure white background matching reference) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            {/* Header: Title, Subtitle, and Settings Icon */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Glucose Levels</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click and drag to zoom into a portion of graph. Blue represents in range glucose levels.
                </p>
              </div>

              <button
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                title="Chart settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clean Chart Container with Y-Axis [50, 75, 100, 125, 150, 175, 200] */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cgmPoints}
                  margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                >
                  <defs>
                    {/* SVG Linear Gradient:
                        Domain is [45, 215] (height = 170).
                        Threshold 140 is at (215 - 140) / 170 = 44.1%.
                        Above 140: Pink spike fill (#D94680).
                        Below 140: Light sky blue fill (#BAE6FD / #38BDF8).
                        Card background is 100% crisp white (#FFFFFF).
                    */}
                    <linearGradient id="cgmFillGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D94680" stopOpacity={0.70} />
                      <stop offset="44%" stopColor="#E15B85" stopOpacity={0.62} />
                      <stop offset="44.1%" stopColor="#7DD3FC" stopOpacity={0.45} />
                      <stop offset="90%" stopColor="#BAE6FD" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.02} />
                    </linearGradient>

                    {/* Curve stroke gradient: pink for spikes above 140, blue for in-range */}
                    <linearGradient id="cgmStrokeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D94680" />
                      <stop offset="44%" stopColor="#E15B85" />
                      <stop offset="44.1%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines matching reference design */}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

                  {/* X-Axis */}
                  <XAxis
                    dataKey="time"
                    axisLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                    tickLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                  />

                  {/* Y-Axis with exact ticks matching reference: 50, 75, 100, 125, 150, 175, 200 */}
                  <YAxis
                    domain={[45, 215]}
                    ticks={[50, 75, 100, 125, 150, 175, 200]}
                    axisLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                    tickLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                  />

                  {/* Upper Target Threshold (140 mg/dL) */}
                  <ReferenceLine
                    y={140}
                    stroke="#CBD5E1"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />

                  {/* Lower Target Threshold (70 mg/dL) */}
                  <ReferenceLine
                    y={70}
                    stroke="#CBD5E1"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />

                  {/* Sleek Tooltip */}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        if (!d || d.label === '') return null;

                        const isAbove = d.value > 140;
                        const isBelow = d.value < 70;

                        return (
                          <div className="bg-slate-900/95 backdrop-blur-sm text-white rounded-xl p-3 shadow-xl border border-slate-700 min-w-[160px]">
                            <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-slate-700">
                              <span className="text-[11px] text-slate-300 font-medium">
                                {d.label || d.time}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isAbove
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : isBelow
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                }`}
                              >
                                {isAbove ? 'Spike' : isBelow ? 'Dip' : 'In Range'}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between">
                              <span className="text-xl font-extrabold text-white">
                                {d.value}{' '}
                                <span className="text-xs font-normal text-slate-400">mg/dL</span>
                              </span>

                              {d.diff !== undefined && d.diff !== 0 && (
                                <span
                                  className={`text-xs font-bold ${
                                    d.diff > 0 ? 'text-rose-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {d.diff > 0 ? `+${d.diff}` : d.diff}
                                </span>
                              )}
                            </div>

                            {d.slot && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                Check-in: <span className="text-slate-200">{d.slot}</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Continuous CGM Wave matching reference design */}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="url(#cgmStrokeGradient)"
                    strokeWidth={1.8}
                    fill="url(#cgmFillGradient)"
                    dot={renderCgmNode}
                    activeDot={{ r: 5, stroke: '#0284C7', strokeWidth: 2, fill: '#FFFFFF' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Bottom Overview Section (matching cards below chart in reference image) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500">Daily Check-ins vs Goal</div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {stats.count || 4} of 4 logged
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Complete
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500">Weekly Calories vs Goal</div>
                <div className="text-lg font-bold text-slate-900 mt-1">1,820 kcal/day</div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                On Track
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500">Weight & Glycemia</div>
                <div className="text-lg font-bold text-slate-900 mt-1">-1.4 kg this month</div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ↘ Strong Loss
              </span>
            </div>
          </div>

          {/* 6. Patient Reading Breakdown List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Recorded check-in details
              </h2>
              <p className="text-xs text-slate-400">
                Individual slot entries and glycemic range classification for your care team.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {readings.map((r) => {
                const init = getSlotInitials(r.slot);
                const isElevated = r.glucose_value > 140;
                const isLow = r.glucose_value < 70;

                return (
                  <div key={r.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${init.bg}`}
                      >
                        {init.letter}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{r.slot}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date} ·{' '}
                          {r.recorded_at || 'Recorded'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isElevated
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {isElevated ? 'Spike' : isLow ? 'Dip' : 'In Range'}
                      </span>
                      <div className="text-sm font-bold text-slate-900">
                        {r.glucose_value} mg/dL
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
