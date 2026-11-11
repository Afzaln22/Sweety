import React from 'react';
import { Plus } from 'lucide-react';

export default function EmptyState({ onAddClick, title, subtitle }) {
  return (
    <div className="flex items-center justify-center p-8 min-h-[450px]">
      <div className="bg-white border border-[#E8ECF2] rounded-3xl p-12 max-w-md w-full text-center shadow-sm">
        {/* S Icon circle matching Figma */}
        <div className="w-16 h-16 mx-auto rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-2xl mb-6 shadow-inner">
          S
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {title || 'Your story starts here'}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          {subtitle || 'No glucose readings yet. Add your first reading to start building a clear picture of your daily patterns.'}
        </p>

        {onAddClick && (
          <button
            onClick={onAddClick}
            className="inline-flex items-center justify-center space-x-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm px-6 py-3 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add your first reading</span>
          </button>
        )}

        <div className="mt-8 text-xs text-slate-400">
          You can add up to four readings each day.
        </div>
      </div>
    </div>
  );
}
