import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Download, Calendar, Activity, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
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

  const daily = reportData?.daily || { stats: {}, readings: [] };
  const mtd = reportData?.monthToDate || { stats: {}, readings: [] };
  const prevMonth = reportData?.previousMonth || { stats: {}, readings: [] };

  // Current active report config
  let currentReport;
  let rangeLabel = '';
  let snapshotTitle = '';
  let snapshotSubtitle = '';
  let snapshotAdvice = '';

  if (activeReportTab === 'daily') {
    currentReport = daily;
    rangeLabel = new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs matching Screens 03, 08, 09 */}
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

      {/* Check Empty State */}
      {stats.count === 0 ? (
        <EmptyState
          title="No readings in this period"
          subtitle="There are no blood glucose records found for this date range. Record a check-in to generate insights."
          onAddClick={onAddReading}
        />
      ) : (
        <>
          {/* 4 Stat Cards matching Screens 03, 08, 09 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Highest */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
              <div className="text-xs text-slate-500 font-medium mb-1">Highest</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {stats.highest} <span className="text-sm font-normal text-slate-500">mg/dL</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {stats.highestSlot || '—'}
              </div>
            </div>

            {/* Lowest */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
              <div className="text-xs text-slate-500 font-medium mb-1">Lowest</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {stats.lowest} <span className="text-sm font-normal text-slate-500">mg/dL</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {stats.lowestSlot || '—'}
              </div>
            </div>

            {/* Average (Rounded to 1 decimal place!) */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
              <div className="text-xs text-slate-500 font-medium mb-1">Average</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {stats.average} <span className="text-sm font-normal text-slate-500">mg/dL</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Across {stats.count} readings
              </div>
            </div>

            {/* Total Readings */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
              <div className="text-xs text-slate-500 font-medium mb-1">Total readings</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {stats.count}
              </div>
              <div className="text-[11px] text-slate-400">
                {activeReportTab === 'daily' ? 'Out of 4 daily slots' : `From ${rangeLabel}`}
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

                      <div className="text-sm font-bold text-slate-900">
                        {r.glucose_value} mg/dL
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Snapshot Card matching Figma Screens 03, 08, 09 */}
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
                    {activeReportTab === 'daily' ? `${4 - stats.count} remaining time slots` : 'For the selected period'}
                  </div>
                </div>

                {/* Helpful Reminder / Period Overview text */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {activeReportTab === 'daily' ? 'A helpful reminder' : 'Period overview'}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {snapshotAdvice}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

