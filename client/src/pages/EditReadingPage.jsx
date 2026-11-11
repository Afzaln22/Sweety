import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

export default function EditReadingPage({ reading, onBack, onSuccess }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reading) {
      const d = reading.reading_date?.slice ? reading.reading_date.slice(0, 10) : reading.reading_date;
      setDate(d);
      setSlot(reading.slot);
      setValue(reading.glucose_value);
    }
  }, [reading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (value === undefined || value === null || String(value).trim() === '') {
      setError('Please enter a glucose value.');
      return;
    }

    const num = Number(value);
    if (!Number.isInteger(num) || isNaN(num) || num < 40 || num > 600) {
      setError('Value must be between 40 and 600 mg/dl.');
      return;
    }

    if (date > todayStr) {
      setError('Date cannot be in the future.');
      return;
    }

    setLoading(true);
    try {
      await api.updateReading(reading.id, {
        reading_date: date,
        slot,
        glucose_value: num
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update reading.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Navy Panel matching Figma Screen 10 */}
      <div className="hidden lg:flex lg:w-4/12 bg-navy-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white text-lg">
              S
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight">sweety</div>
              <div className="text-[9px] tracking-widest text-slate-400 font-semibold uppercase">A little care, every day</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white mb-4 leading-snug">
            Small steps.<br />Better awareness.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-12">
            Keep your glucose readings in one calm, private place. Track your routine and notice patterns over time.
          </p>

          <div className="bg-navy-card/80 border border-slate-700/50 rounded-2xl p-6 max-w-sm shadow-sm">
            <p className="text-slate-200 text-sm font-medium leading-relaxed mb-4">
              “Consistency makes your health history more useful.”
            </p>
            <div className="text-[10px] tracking-wider text-slate-400 font-semibold uppercase">
              Your Daily Health Companion
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to dashboard</span>
        </button>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-14 bg-[#F8FAFC] overflow-y-auto">
        <div className="w-full max-w-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Readings / Edit Entry
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Edit glucose reading</h1>
          <p className="text-sm text-slate-500 mb-8">Update the details of this recorded check-in.</p>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="date"
                  max={todayStr}
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Time Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SLOTS.map((s) => {
                    const isSelected = slot === s;
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSlot(s)}
                        className={`flex items-center justify-between p-4 rounded-xl text-left text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-2 border-brand-500 bg-brand-50/40 text-brand-900'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{s}</span>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-brand-500' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Glucose Value
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="40"
                    max="600"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter value"
                    className="w-full pl-4 pr-16 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    mg/dL
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  You can update this reading. Keep the value between 40 and 600 mg/dL.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center space-x-3">
                <Info className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>You can record up to 4 readings per day, one per time slot.</span>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Your readings are private and only visible to your account.
          </div>
        </div>
      </div>
    </div>
  );
}

