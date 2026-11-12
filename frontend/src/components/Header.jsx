import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';

export default function Header({ breadcrumbPath, onOpenSidebar }) {
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'AM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="flex items-center justify-between py-4 sm:py-6 px-4 sm:px-6 lg:px-8 bg-transparent">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-sm transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Mini Logo */}
        <div className="md:hidden flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            S
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">sweety</span>
        </div>

        {/* Desktop Breadcrumbs matching Figma */}
        <div className="hidden md:block text-xs text-slate-400 font-medium">
          Workspace <span className="mx-1 text-slate-300">/</span>{' '}
          <span className="text-slate-600 capitalize">{breadcrumbPath}</span>
        </div>
      </div>

      {/* Right: User Profile Badge */}
      <div className="flex items-center space-x-2 sm:space-x-3 bg-white px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0">
          {getInitials(user?.name)}
        </div>
        <div className="text-left pr-1 sm:pr-2">
          <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px] sm:max-w-none">
            {user?.name || 'Alex Morgan'}
          </div>
          <div className="hidden sm:block text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
            Personal Account
          </div>
        </div>
      </div>
    </header>
  );
}
