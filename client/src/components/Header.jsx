import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ breadcrumbPath }) {
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'AM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="flex items-center justify-between py-6 px-8 bg-transparent">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-400 font-medium">
        Workspace <span className="mx-1 text-slate-300">/</span>{' '}
        <span className="text-slate-600 capitalize">{breadcrumbPath}</span>
      </div>

      {/* User profile pill matching Figma */}
      <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
          {getInitials(user?.name)}
        </div>
        <div className="text-left pr-2">
          <div className="text-xs font-bold text-slate-900 leading-tight">
            {user?.name || 'Alex Morgan'}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            Personal Account
          </div>
        </div>
      </div>
    </header>
  );
}
