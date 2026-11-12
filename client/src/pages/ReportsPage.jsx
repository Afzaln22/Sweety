import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Download,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Info
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
  const [activeReportTab, setActiveReportTab] = useState('daily'); // 'daily' | 'mtd' | 'prev'
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

  const daily = reportData?.daily || { stats: {}, readings: [], chartData: [] };
  const mtd = reportData?.monthToDate || { stats: {}, readings: [], chartData: [] };
  const prevMonth = reportData?.previousMonth || { stats: {}, readings: [], chartData: [] };

  // Current active report config
  let currentReport;
  let rangeLabel = '';
  let snapshotTitle = '';
  let snapshotSubtitle = '';
  let snapshotAdvice = '';

  if (activeReportTab === 'daily') {
    currentReport = daily;
    rangeLabel = new Date(selectedDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    snapshotTitle = 'Your daily snapshot';
    snapshotSubtitle = `${currentReport.stats?.count || 0} readings logged today`;
    snapshotAdvice =
      "You've logged check-ins today. Keep recording consistently to build a more useful history for conversations with your care team.";
  } else if (activeReportTab === 'mtd') {
    currentReport = mtd;
    rangeLabel = `${mtd.range?.start} – ${mtd.range?.end}`;
    snapshotTitle = 'Month-to-date snapshot';
    snapshotSubtitle = `From ${mtd.range?.start} to ${mtd.range?.end}`;
    snapshotAdvice =
      'You have logged progress so far this month. Use this view to understand your progress from the first day of the month through your selected date.';
  } else {
    currentReport = prevMonth;
    rangeLabel = `${prevMonth.range?.start} – ${prevMonth.range?.end}`;
    snapshotTitle = 'Previous month snapshot';
    snapshotSubtitle = `From ${prevMonth.range?.start} to ${prevMonth.range?.end}`;
    snapshotAdvice =
      'Compare your monthly average and range with your current month-to-date report to discuss patterns with your care team.';
  }

  const stats = currentReport.stats || {};
  const readings = currentReport.readings || [];
  const chartData = currentReport.chartData || [];

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

  // Custom Dot component with clinical color indicators
  const renderCustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    let strokeColor = '#3B82F6';
    let fillColor = '#EFF6FF';

    if (payload.value > 140) {
      strokeColor = '#F43F5E'; // Rose/Pink for spike
      fillColor = '#FFE4E6';
    } else if (payload.value < 70) {
      strokeColor = '#F59E0B'; // Amber for dip
      fillColor = '#FEF3C7';
    }

    return (
      <g key={`dot-${payload.id || cx}`}>
        <circle cx={cx} cy={cy} r={6} fill={fillColor} stroke={strokeColor} strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={2} fill={strokeColor} />
      </g>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & insights</h1>
          <p className="text-xs text-slate-500">Understand your glucose patterns over time.</p>
        </div>

        {/* Tab switcher & Date picker bar */}
        <div className="bg-white rounded-2xl p-3 border border-[#E8ECF2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* 3 Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveReportTab('daily')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeReportTab === 'daily'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily report
            </button>
            <button
              onClick={() => setActiveReportTab('mtd')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeReportTab === 'mtd'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month to date
            </button>
            <button
              onClick={() => setActiveReportTab('prev')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeReportTab === 'prev'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Previous month
            </button>
          </div>

          {/* Right Date Selector & Export Button */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {activeReportTab === 'daily' ? 'Selected Date' : 'Reference Date'}:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
              />
            </div>

            <button
              onClick={handleExport}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State Check */}
      {stats.count === 0 ? (
        <EmptyState
          title="No readings in this period"
          subtitle="There are no blood glucose records found for this date range. Record a check-in to generate insights."
          onAddClick={onAddReading}
        />
      ) : (
        <>
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Highest */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">Highest</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  Peak
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {stats.highest} <span className="text-sm font-normal text-slate-500">mg/dL</span>
              </div>
              <div className="text-[11px] text-slate-400">{stats.highestSlot || '—'}</div>
            </div>

            {/* Lowest */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">Lowest</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Min
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {stats.lowest} <span className="text-sm font-normal text-slate-500">mg/dL</span>
              </div>
              <div className="text-[11px] text-slate-400">{stats.lowestSlot || '—'}</div>
            </div>

            {/* Average (Rounded to 1 decimal place) */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">Average</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
                  Mean
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {stats.average} <span className="text-sm font-normal text-slate-500">mg/dL</span>
              </div>
              <div className="text-[11px] text-slate-400">Across {stats.count} readings</div>
            </div>

            {/* Total Readings */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">Total readings</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Logs
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {stats.count}
              </div>
              <div className="text-[11px] text-slate-400">
                {activeReportTab === 'daily' ? 'Out of 4 daily slots' : `From ${rangeLabel}`}
              </div>
            </div>
          </div>

          {/* Clinical Glucose Levels Trend Chart Card matching Reference Image */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
            {/* Header + Clinical Pills */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900">Glucose Levels</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
                    Range Trend
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual trends across time. Colors represent{' '}
                  <span className="text-sky-600 font-medium">in-range (blue)</span>,{' '}
                  <span className="text-rose-600 font-medium">spikes (pink)</span>, and{' '}
                  <span className="text-amber-600 font-medium">dips (amber)</span>.
                </p>
              </div>

              {/* Clinical Quick Metric Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{stats.inRangePercent ?? 85}% Time in Range</span>
                </div>

                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                  <span>{stats.spikes ?? 0} Spikes (&gt;140)</span>
                </div>

                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                  <span>{stats.dips ?? 0} Dips (&lt;70)</span>
                </div>
              </div>
            </div>

            {/* Interactive Area Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    {/* Multi-stop gradient showing Pink Spikes at top, Blue in-range in middle, Amber dips at bottom */}
                    <linearGradient id="clinicalGlucoseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.65} />
                      <stop offset="35%" stopColor="#FB7185" stopOpacity={0.4} />
                      <stop offset="45%" stopColor="#38BDF8" stopOpacity={0.35} />
                      <stop offset="75%" stopColor="#38BDF8" stopOpacity={0.15} />
                      <stop offset="90%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />

                  <YAxis
                    domain={[40, 220]}
                    ticks={[50, 70, 100, 140, 180, 200]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />

                  {/* Target High Threshold Line (140 mg/dL) */}
                  <ReferenceLine
                    y={140}
                    stroke="#FB7185"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Target High: 140 mg/dL',
                      position: 'insideTopRight',
                      fill: '#E11D48',
                      fontSize: 10,
                      fontWeight: 600
                    }}
                  />

                  {/* Target Low Threshold Line (70 mg/dL) */}
                  <ReferenceLine
                    y={70}
                    stroke="#38BDF8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Target Low: 70 mg/dL',
                      position: 'insideBottomRight',
                      fill: '#0284C7',
                      fontSize: 10,
                      fontWeight: 600
                    }}
                  />

                  {/* Enhanced Tooltip with Increase / Decrease Delta */}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        const isIncrease = d.diff > 0;
                        const isDecrease = d.diff < 0;

                        return (
                          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-700 min-w-[200px]">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700">
                              <span className="text-xs text-slate-300 font-medium">
                                {d.date} · {d.time || 'Logged'}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  d.status === 'spike'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : d.status === 'dip'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {d.status === 'spike'
                                  ? 'Spike (>140)'
                                  : d.status === 'dip'
                                  ? 'Dip (<70)'
                                  : 'Within Range'}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between mb-2">
                              <span className="text-2xl font-extrabold text-white">
                                {d.value}{' '}
                                <span className="text-xs font-normal text-slate-400">mg/dL</span>
                              </span>

                              {/* Increase / Decrease badge */}
                              {d.diff !== 0 && (
                                <span
                                  className={`inline-flex items-center text-xs font-bold ${
                                    isIncrease ? 'text-rose-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {isIncrease ? (
                                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                                  ) : (
                                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                                  )}
                                  {d.diffLabel} mg/dL
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-400 font-medium">
                              Slot: <span className="text-slate-200">{d.slot}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Shaded Range Curve with Gradient */}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fill="url(#clinicalGlucoseGradient)"
                    dot={renderCustomDot}
                    activeDot={{ r: 8, stroke: '#2563EB', strokeWidth: 2, fill: '#FFFFFF' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
                  <span>Spike (&gt;140 mg/dL)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                  <span>In-Range (70–140 mg/dL)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span>Dip (&lt;70 mg/dL)</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Hover or tap any node to see exact value &amp; delta change
              </div>
            </div>
          </div>

          {/* Bottom Two Columns: Breakdown (Left) & Snapshot (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Breakdown List */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
              <div className="mb-6">
                <h2 className="text-base font-bold text-slate-900">
                  {activeReportTab === 'daily'
                    ? 'Daily reading breakdown'
                    : `Recent readings in ${activeReportTab === 'mtd' ? 'this period' : 'previous month'}`}
                </h2>
                <p className="text-xs text-slate-400">{rangeLabel}</p>
              </div>

              <div className="divide-y divide-slate-100">
                {readings.map((r) => {
                  const init = getSlotInitials(r.slot);
                  const isElevated = r.glucose_value > 140;
                  const isLow = r.glucose_value < 70;

                  return (
                    <div key={r.id} className="py-4 flex items-center justify-between">
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
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isElevated ? 'Spike' : isLow ? 'Dip' : 'Normal'}
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

            {/* Right Snapshot Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-4">{snapshotTitle}</h2>

                {/* Big Number Card */}
                <div className="bg-brand-50/70 border border-brand-100 rounded-2xl p-6 mb-6">
                  <div className="text-4xl font-extrabold text-brand-600 mb-1">
                    {stats.count}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mb-1">
                    {snapshotSubtitle}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {activeReportTab === 'daily'
                      ? `${4 - stats.count} remaining time slots`
                      : 'For the selected period'}
                  </div>
                </div>

                {/* Helpful Reminder / Period Overview text */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {activeReportTab === 'daily' ? 'A helpful reminder' : 'Period overview'}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{snapshotAdvice}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
