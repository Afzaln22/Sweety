import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Clock, ArrowUpRight, ArrowDownRight, Activity, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DashboardPage({ onAddReading, onViewAllReadings }) {
  const { user } = useAuth();
  const [reports, setReports] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic date state
  const realToday = getTodayDateString();
  const [activeDate, setActiveDate] = useState(realToday);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        let targetDate = realToday;
        let repRes = await api.getReports(targetDate);

        // If today has 0 readings, check if user has readings on an earlier date (e.g. prototype demo data)
        const todayReadings = repRes.data?.daily?.readings || [];
        if (todayReadings.length === 0) {
          const recentRes = await api.getReadings({ limit: 1 });
          if (recentRes.data && recentRes.data.length > 0) {
            const latestDate = recentRes.data[0].reading_date?.slice
              ? recentRes.data[0].reading_date.slice(0, 10)
              : String(recentRes.data[0].reading_date).slice(0, 10);

            if (latestDate) {
              const latestRepRes = await api.getReports(latestDate);
              if (latestRepRes.data?.daily?.readings?.length > 0) {
                targetDate = latestDate;
                repRes = latestRepRes;
              }
            }
          }
        }

        setActiveDate(targetDate);
        setReports(repRes.data);

        const trendRes = await api.getTrend(targetDate);
        setTrendData(trendRes.data || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [realToday]);

  const daily = reports?.daily || {};
  const stats = daily?.stats || {};
  const readings = daily?.readings || [];

  // Determine which of the 4 slots are logged
  const slotsConfig = [
    { name: 'Morning (fasting)' },
    { name: 'After breakfast' },
    { name: 'After lunch' },
    { name: 'After dinner' }
  ];

  const slotsStatus = slotsConfig.map((s) => {
    const found = readings.find((r) => r.slot === s.name);
    return {
      slot: s.name,
      done: !!found,
      value: found ? found.glucose_value : null,
      time: found ? found.recorded_at : null
    };
  });

  const completedCount = slotsStatus.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  // Status helper for glucose category badge
  const getStatusBadge = (val) => {
    if (val < 70) {
      return { label: 'Low', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (val <= 140) {
      return { label: 'Within range', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (val <= 180) {
      return { label: 'Review trend', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'High', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  // Formatted date string for greeting
  const formattedDateStr = useMemo(() => {
    try {
      const parts = activeDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return activeDate;
    }
  }, [activeDate]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Greeting matching Screen 01 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Good morning, {user?.name?.split(' ')[0] || 'Alex'}
            </h1>
            <span className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
              {activeDate === realToday ? 'Today' : 'Latest'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Here's your glucose overview for {formattedDateStr}.
          </p>
        </div>

        <button
          onClick={onAddReading}
          className="inline-flex items-center justify-center space-x-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add reading</span>
        </button>
      </div>

      {/* 4 Stat Cards matching Screen 01 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's readings */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-500 font-medium mb-1">Today's readings</div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {completedCount} of 4
          </div>
          <div className="text-[11px] text-slate-400">
            {progressPercent}% of daily slots filled
          </div>
        </div>

        {/* Card 2: Average glucose */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-500 font-medium mb-1">Average glucose</div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {stats.average !== null && stats.average !== undefined ? stats.average : '—'}{' '}
            <span className="text-sm font-normal text-slate-500">mg/dL</span>
          </div>
          <div className="text-[11px] text-slate-400">
            today
          </div>
        </div>

        {/* Card 3: Highest reading */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-500 font-medium mb-1">Highest reading</div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {stats.highest !== null && stats.highest !== undefined ? stats.highest : '—'}{' '}
            <span className="text-sm font-normal text-slate-500">mg/dL</span>
          </div>
          <div className="text-[11px] text-slate-400">
            today
          </div>
        </div>

        {/* Card 4: Lowest reading */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-500 font-medium mb-1">Lowest reading</div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {stats.lowest !== null && stats.lowest !== undefined ? stats.lowest : '—'}{' '}
            <span className="text-sm font-normal text-slate-500">mg/dL</span>
          </div>
          <div className="text-[11px] text-slate-400">
            today
          </div>
        </div>
      </div>

      {/* Middle Two Columns: Trend Chart (Left) & Daily Check-in (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: 7-day Glucose Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Glucose trend</h2>
              <p className="text-xs text-slate-400">Your readings over the last 7 days</p>
            </div>
            <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              Last 7 days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                />
                <YAxis
                  domain={[0, 200]}
                  ticks={[40, 80, 120, 160, 200]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-700 min-w-[130px]">
                          <div className="text-[11px] text-slate-300 font-medium">{d.label}</div>
                          <div className="text-lg font-bold text-white mt-0.5">
                            {d.avg ? `${d.avg} mg/dL` : 'No reading'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {d.count > 0 ? `${d.count} reading(s)` : 'Not logged'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="avg"
                  radius={[8, 8, 8, 8]}
                  fill="#E0E7FF"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Daily Check-in Widget */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Daily check-in</h2>
              <p className="text-xs text-slate-400">Keep your routine consistent</p>
            </div>

            {/* Progress bar matching Screen 01 */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-brand-600 mb-2">
                <span>{completedCount} of 4 completed</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Slot Checklist */}
            <div className="space-y-4">
              {slotsStatus.map((item) => (
                <div key={item.slot} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.done ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-slate-800">{item.slot}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.done ? `${item.value} mg/dL` : 'Not recorded'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-semibold ${
                      item.done ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {item.done ? 'Done' : 'Upcoming'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Readings Table matching Screen 01 */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent readings</h2>
            <p className="text-xs text-slate-400">Your latest logged glucose values</p>
          </div>
          <button
            onClick={onViewAllReadings}
            className="inline-flex items-center space-x-1 text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            <span>View all readings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {readings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No readings recorded for today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  <th className="pb-3 font-bold">Time Slot</th>
                  <th className="pb-3 font-bold">Date &amp; Time</th>
                  <th className="pb-3 font-bold">Glucose Value</th>
                  <th className="pb-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {readings.map((r) => {
                  const badge = getStatusBadge(r.glucose_value);
                  const dateStr = r.reading_date?.slice ? r.reading_date.slice(0, 10) : r.reading_date;
                  const displayTime = r.recorded_at ? `${dateStr} · ${r.recorded_at}` : dateStr;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-800">{r.slot}</td>
                      <td className="py-3.5 text-slate-500">{displayTime}</td>
                      <td className="py-3.5 font-bold text-slate-900">
                        {r.glucose_value} mg/dL
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
