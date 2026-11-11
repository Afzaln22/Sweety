import React from 'react';
import { LayoutDashboard, FileText, BarChart3, Settings, LogOut, ArrowRight, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'readings', label: 'Readings', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E8ECF2] flex flex-col justify-between p-6 shrink-0 min-h-screen">
      <div>
        {/* Brand Logo matching Figma */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            S
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-lg leading-tight">sweety</div>
            <div className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">Glucose Care</div>
          </div>
        </div>

        {/* Workspace Nav */}
        <div className="mb-6">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Preferences */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Preferences
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'settings'
                  ? 'bg-brand-50 text-brand-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Help Box & Logout */}
      <div className="space-y-4">
        <div className="bg-brand-50/70 border border-brand-100 rounded-2xl p-4 text-left">
          <div className="font-semibold text-slate-900 text-sm mb-1">Need a hand?</div>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Your health journey, one step at a time.
          </p>
          <a
            href="#help"
            onClick={(e) => {
              e.preventDefault();
              alert('Sweety Support: Record your glucose up to 4 times a day across meals. Contact your endocrinologist for clinical advice.');
            }}
            className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>Visit help centre</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </a>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-start space-x-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

