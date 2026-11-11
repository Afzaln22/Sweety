import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Search, Filter, RotateCcw, Edit2, Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function ReadingsPage({ onAddReading, onEditReading }) {
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [slotFilter, setSlotFilter] = useState('All time slots');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReadings = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getReadings({
        page,
        limit: 8,
        slot: slotFilter,
        search: searchQuery,
        date_from: dateFrom,
        date_to: dateTo
      });
      setReadings(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Error fetching readings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings(1);
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchReadings(1);
  };

  const handleResetFilters = () => {
    setSlotFilter('All time slots');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    // Re-fetch default
    setTimeout(() => {
      fetchReadings(1);
    }, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reading?')) {
      try {
        await api.deleteReading(id);
        fetchReadings(pagination.page);
      } catch (err) {
        alert(err.message || 'Failed to delete reading.');
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header matching Screen 02 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your readings</h1>
          <p className="text-xs text-slate-500">
            A complete history of your blood glucose entries.
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

      {/* Filter Bar matching Screen 02 */}
      <form onSubmit={handleApplyFilters} className="bg-white rounded-2xl p-4 border border-[#E8ECF2] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Slot dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Time Slot
            </label>
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="All time slots">All time slots</option>
              <option value="Morning (fasting)">Morning (fasting)</option>
              <option value="After breakfast">After breakfast</option>
              <option value="After lunch">After lunch</option>
              <option value="After dinner">After dinner</option>
            </select>
          </div>

          {/* Search bar */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search readings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Date from / to */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Filter by Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-xl transition-all shadow-sm"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs rounded-xl transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* Reading history Table Card matching Screen 02 */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8ECF2] shadow-sm">
        <div className="text-xs font-semibold text-slate-400 mb-4">
          Showing {readings.length} readings
        </div>

        {readings.length === 0 ? (
          <EmptyState
            title="No readings found"
            subtitle="Try adjusting your filters or record a new reading to get started."
            onAddClick={onAddReading}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  <th className="pb-3 font-bold">Date</th>
                  <th className="pb-3 font-bold">Time Slot</th>
                  <th className="pb-3 font-bold">Value</th>
                  <th className="pb-3 font-bold">Recorded At</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-semibold text-slate-900">
                      {formatDate(r.reading_date)}
                    </td>
                    <td className="py-4 text-slate-600">{r.slot}</td>
                    <td className="py-4 font-bold text-slate-900">{r.glucose_value} mg/dL</td>
                    <td className="py-4 text-slate-400">{r.recorded_at || '—'}</td>
                    <td className="py-4 text-right space-x-2">
                      <button
                        onClick={() => onEditReading(r)}
                        className="text-brand-600 hover:text-brand-700 font-semibold"
                      >
                        Edit
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-rose-500 hover:text-rose-700 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls matching Screen 02 */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="text-slate-400">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {readings.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-semibold text-slate-700">{pagination.total}</span> results
              </div>

              <div className="flex items-center space-x-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchReadings(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Previous
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchReadings(p)}
                    className={`w-8 h-8 rounded-lg font-semibold transition-all ${
                      pagination.page === p
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchReadings(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
