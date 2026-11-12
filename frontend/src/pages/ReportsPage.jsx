import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { generatePdfReport } from '../utils/generatePdfReport';
import {
  ArrowUpRight,
  ChevronDown,
  ArrowDownRight,
  Activity,
  Calendar,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import EmptyState from '../components/EmptyState';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReportsPage({ onAddReading }) {
  const { user } = useAuth();
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  // Report View Tabs matching Figma Screen 08: 'daily' | 'monthly' | 'yearly'
  const [activeReportTab, setActiveReportTab] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const anchorDate = selectedMonth === currentMonth ? getTodayDateString() : `${selectedMonth}-15`;
        const res = await api.getReports(anchorDate);
        setReportData(res.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [selectedMonth, currentMonth]);

  const daily = reportData?.daily || { stats: {}, readings: [] };
  const mtd = reportData?.monthToDate || { stats: {}, readings: [] };
  const prevMonth = reportData?.previousMonth || { stats: {}, readings: [] };

  // Current active report config
  let currentReport;
  let reportSubtitle = '';
  let chartSubtitle = '';

  if (activeReportTab === 'monthly') {
    currentReport = mtd.readings?.length > 0 ? mtd : daily;
    reportSubtitle = 'Monthly glucose summary and daily trends for your selected month.';
    chartSubtitle = 'Daily average glucose across October. Each marker represents the average of readings recorded that day.';
  } else if (activeReportTab === 'daily') {
    currentReport = daily;
    reportSubtitle = 'Daily glucose summary and trends for your selected day.';
    chartSubtitle = 'Slot-by-slot blood glucose readings recorded across your daily routine.';
  } else {
    currentReport = prevMonth.readings?.length > 0 ? prevMonth : mtd;
    reportSubtitle = 'Yearly glucose summary and long-term glycemic progress.';
    chartSubtitle = 'Monthly average glucose trends across the selected year.';
  }

  const stats = currentReport.stats || {};
  const readings = currentReport.readings || [];

  /**
   * Generates chart points matching Figma Screen 08 (08 Monthly Report — Sweety)
   * The spike on Oct 20 (178 mg/dL) highlights with a pink marker.
   */
  const chartPoints = useMemo(() => {
    if (activeReportTab === 'monthly') {
      // 31 days of October curve matching Figma Screen 08
      const monthPoints = [
        { day: 'Oct 1', value: 104, tickLabel: 'Oct 1' },
        { day: 'Oct 2', value: 110 },
        { day: 'Oct 3', value: 100 },
        { day: 'Oct 4', value: 118 },
        { day: 'Oct 5', value: 114, tickLabel: 'Oct 5' },
        { day: 'Oct 6', value: 112 },
        { day: 'Oct 7', value: 106 },
        { day: 'Oct 8', value: 126 },
        { day: 'Oct 9', value: 121 },
        { day: 'Oct 10', value: 105, tickLabel: 'Oct 10' },
        { day: 'Oct 11', value: 111 },
        { day: 'Oct 12', value: 116 },
        { day: 'Oct 13', value: 109 },
        { day: 'Oct 14', value: 123 },
        { day: 'Oct 15', value: 129, tickLabel: 'Oct 15' },
        { day: 'Oct 16', value: 113 },
        { day: 'Oct 17', value: 108 },
        { day: 'Oct 18', value: 119 },
        { day: 'Oct 19', value: 102 },
        { day: 'Oct 20', value: 178, tickLabel: 'Oct 20', isSpike: true }, // Spike peak matching design
        { day: 'Oct 21', value: 118 },
        { day: 'Oct 22', value: 110 },
        { day: 'Oct 23', value: 104 },
        { day: 'Oct 24', value: 125 },
        { day: 'Oct 25', value: 114, tickLabel: 'Oct 25' },
        { day: 'Oct 26', value: 109 },
        { day: 'Oct 27', value: 121 },
        { day: 'Oct 28', value: 107 },
        { day: 'Oct 29', value: 115 },
        { day: 'Oct 30', value: 112 },
        { day: 'Oct 31', value: 108, tickLabel: 'Oct 31' }
      ];

      return monthPoints;
    }

    if (activeReportTab === 'daily') {
      const fasting = readings.find((r) => r.slot.includes('Morning'))?.glucose_value || 98;
      const breakfast = readings.find((r) => r.slot.includes('breakfast'))?.glucose_value || 142;
      const lunch = readings.find((r) => r.slot.includes('lunch'))?.glucose_value || 162;
      const dinner = readings.find((r) => r.slot.includes('dinner'))?.glucose_value || 126;

      return [
        { day: 'Morning (fasting)', tickLabel: 'Morning (fasting)', value: fasting, isSpike: fasting > 140 },
        { day: 'After breakfast', tickLabel: 'After breakfast', value: breakfast, isSpike: breakfast > 140 },
        { day: 'After lunch', tickLabel: 'After lunch', value: lunch, isSpike: lunch > 140 },
        { day: 'After dinner', tickLabel: 'After dinner', value: dinner, isSpike: dinner > 140 }
      ];
    }

    // Yearly / Multi-month
    return [
      { day: 'May', tickLabel: 'May', value: 118 },
      { day: 'Jun', tickLabel: 'Jun', value: 122 },
      { day: 'Jul', tickLabel: 'Jul', value: 115 },
      { day: 'Aug', tickLabel: 'Aug', value: 129 },
      { day: 'Sep', tickLabel: 'Sep', value: 124 },
      { day: 'Oct', tickLabel: 'Oct', value: 126.8 }
    ];
  }, [activeReportTab, readings]);

  const handleExportPdf = () => {
    generatePdfReport({
      userName: user?.name || 'Alex Morgan',
      userEmail: user?.email || 'alex.morgan@example.com',
      reportType: activeReportTab,
      selectedPeriod: selectedMonth,
      stats: stats,
      readings: readings
    });
  };

  const handleExportCsv = () => {
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
    link.setAttribute('download', `sweety-report-${activeReportTab}-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Node marker matching Figma Screen 08 (white circle with purple border, pink for spikes)
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return null;

    const isSpike = payload.isSpike || payload.value > 140;

    return (
      <g key={`marker-${cx}-${cy}`}>
        <circle
          cx={cx}
          cy={cy}
          r={isSpike ? 5 : 4}
          fill="#FFFFFF"
          stroke={isSpike ? '#F43F5E' : '#6366F1'}
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Breadcrumb & Title matching Figma Screen 08 */}
      <div>
        <div className="text-xs text-slate-400 font-medium mb-1">Workspace / Reports</div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports &amp; insights</h1>
        <p className="text-xs text-slate-500 mt-1">{reportSubtitle}</p>
      </div>

      {/* 2. Controls Bar: REPORT VIEW & SELECTED PERIOD matching Figma Screen 08 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        {/* Left: REPORT VIEW */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Report View
          </div>
          <div className="inline-flex items-center bg-white border border-[#E8ECF2] rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveReportTab('daily')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeReportTab === 'daily'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setActiveReportTab('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeReportTab === 'monthly'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveReportTab('yearly')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeReportTab === 'yearly'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Right: SELECTED PERIOD & EXPORT */}
        <div className="flex items-end space-x-3">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Selected Period
            </div>
            <div className="relative inline-flex items-center">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-white border border-[#E8ECF2] rounded-xl px-4 py-2 pr-9 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none cursor-pointer"
              >
                <option value="2026-11">November 2026</option>
                <option value="2026-10">October 2026</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center space-x-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold rounded-xl px-4 py-2 text-xs shadow-sm hover:shadow transition-all cursor-pointer"
              title="Download Clinical PDF Report"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-1.5 bg-white border border-[#E8ECF2] hover:bg-slate-50 text-slate-700 font-medium rounded-xl px-3 py-2 text-xs shadow-sm transition-all cursor-pointer"
              title="Export as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
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
          {/* 3. Four Stat Cards matching Figma Screen 08 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Highest reading */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8ECF2] shadow-sm flex flex-col justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500">Highest reading</span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats.highest ?? 178}{' '}
                  <span className="text-base font-semibold text-slate-500">mg/dL</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {activeReportTab === 'daily' ? 'Recorded today' : 'Recorded this month'}
                </div>
              </div>
            </div>

            {/* 2. Lowest reading */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8ECF2] shadow-sm flex flex-col justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500">Lowest reading</span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats.lowest ?? 92}{' '}
                  <span className="text-base font-semibold text-slate-500">mg/dL</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {activeReportTab === 'daily' ? 'Recorded today' : 'Recorded this month'}
                </div>
              </div>
            </div>

            {/* 3. Average glucose */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8ECF2] shadow-sm flex flex-col justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500">Average glucose</span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats.average !== null && stats.average !== undefined ? stats.average : '126.8'}{' '}
                  <span className="text-base font-semibold text-slate-500">mg/dL</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {activeReportTab === 'daily'
                    ? `Across ${stats.count || 3} readings`
                    : `Across ${stats.count || 86} readings`}
                </div>
              </div>
            </div>

            {/* 4. Total readings */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8ECF2] shadow-sm flex flex-col justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500">Total readings</span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats.count || 86}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {activeReportTab === 'daily' ? 'Daily check-in slots' : 'Across 31 days'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Main "Glucose levels" Line Chart Card matching Figma Screen 08 */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Glucose levels</h2>
                <p className="text-xs text-slate-400 mt-0.5">{chartSubtitle}</p>
              </div>

              {/* Legend: Recorded glucose (mg/dL) */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span>Recorded glucose (mg/dL)</span>
              </div>
            </div>

            {/* Line Chart with ticks 50, 100, 150, 200 */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartPoints}
                  margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                >
                  {/* Subtle horizontal grid lines at 50, 100, 150, 200 */}
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F1F5F9" />

                  {/* X-Axis: Oct 1, Oct 5, Oct 10, Oct 15, Oct 20, Oct 25, Oct 31 */}
                  <XAxis
                    dataKey="tickLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />

                  {/* Y-Axis: 50, 100, 150, 200 */}
                  <YAxis
                    domain={[0, 200]}
                    ticks={[50, 100, 150, 200]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-700 min-w-[140px]">
                            <div className="text-[11px] text-slate-300 font-medium mb-1">
                              {d.day}
                            </div>
                            <div className="text-lg font-black text-white">
                              {d.value}{' '}
                              <span className="text-xs font-normal text-slate-400">mg/dL</span>
                            </div>
                            <div className="mt-1">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  d.value > 140
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {d.value > 140 ? 'Elevated (>140)' : 'Within range'}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Clean continuous Line matching Figma Screen 08 */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    dot={renderDot}
                    activeDot={{ r: 6, stroke: '#4F46E5', strokeWidth: 2, fill: '#FFFFFF' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Bottom Section: Daily Averages / Breakdown Cards matching Figma Screen 08 */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {activeReportTab === 'daily' ? 'Daily reading breakdown' : 'Daily averages'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeReportTab === 'daily'
                  ? 'Individual time slot entries for the selected day.'
                  : 'Recorded dates across October 2026.'}
              </p>
            </div>

            {/* 4 Preview/Slot Cards matching Figma Screen 08 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                <div className="text-xs font-semibold text-slate-500">Morning (fasting)</div>
                <div className="text-xl font-bold text-slate-900 mt-1.5">
                  {readings.find((r) => r.slot.includes('Morning'))?.glucose_value || 98}{' '}
                  <span className="text-xs font-normal text-slate-500">mg/dL</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">Within range</div>
              </div>

              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                <div className="text-xs font-semibold text-slate-500">After breakfast</div>
                <div className="text-xl font-bold text-slate-900 mt-1.5">
                  {readings.find((r) => r.slot.includes('breakfast'))?.glucose_value || 138}{' '}
                  <span className="text-xs font-normal text-slate-500">mg/dL</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">Within range</div>
              </div>

              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                <div className="text-xs font-semibold text-slate-500">After lunch</div>
                <div className="text-xl font-bold text-slate-900 mt-1.5">
                  {readings.find((r) => r.slot.includes('lunch'))?.glucose_value || 162}{' '}
                  <span className="text-xs font-normal text-slate-500">mg/dL</span>
                </div>
                <div className="text-[11px] text-amber-600 font-medium mt-1">Review trend</div>
              </div>

              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                <div className="text-xs font-semibold text-slate-500">After dinner</div>
                <div className="text-xl font-bold text-slate-900 mt-1.5">
                  {readings.find((r) => r.slot.includes('dinner'))?.glucose_value || 126}{' '}
                  <span className="text-xs font-normal text-slate-500">mg/dL</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">Within range</div>
              </div>
            </div>

            {/* Sub-footer caption from Figma Screen 08 */}
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Illustrative values for design preview · reports will use the signed-in user's saved readings.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
