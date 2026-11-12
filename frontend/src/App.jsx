import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReadingsPage from './pages/ReadingsPage';
import ReportsPage from './pages/ReportsPage';
import AddReadingPage from './pages/AddReadingPage';
import EditReadingPage from './pages/EditReadingPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'readings' | 'reports' | 'settings'
  const [currentView, setCurrentView] = useState('main'); // 'main' | 'add' | 'edit'
  const [editingReading, setEditingReading] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-brand-500 animate-pulse flex items-center justify-center text-white font-bold text-lg">
          S
        </div>
      </div>
    );
  }

  // Unauthenticated screen
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Full-page Add Reading View (matches Figma Screen 04)
  if (currentView === 'add') {
    return (
      <AddReadingPage
        onBack={() => setCurrentView('main')}
        onSuccess={() => {
          setCurrentView('main');
          setActiveTab('readings');
        }}
      />
    );
  }

  // Full-page Edit Reading View (matches Figma Screen 10)
  if (currentView === 'edit' && editingReading) {
    return (
      <EditReadingPage
        reading={editingReading}
        onBack={() => {
          setEditingReading(null);
          setCurrentView('main');
        }}
        onSuccess={() => {
          setEditingReading(null);
          setCurrentView('main');
          setActiveTab('readings');
        }}
      />
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'readings', label: 'Readings', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Main Workspace with Responsive Sidebar & Header
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar: Fixed on desktop, slide-over drawer on mobile */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          breadcrumbPath={activeTab}
          onOpenSidebar={() => setMobileMenuOpen(true)}
        />

        {/* Content area: full 100% width on mobile, with bottom padding for mobile nav */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {activeTab === 'overview' && (
            <DashboardPage
              onAddReading={() => setCurrentView('add')}
              onViewAllReadings={() => setActiveTab('readings')}
            />
          )}

          {activeTab === 'readings' && (
            <ReadingsPage
              onAddReading={() => setCurrentView('add')}
              onEditReading={(reading) => {
                setEditingReading(reading);
                setCurrentView('edit');
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage onAddReading={() => setCurrentView('add')} />
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8ECF2] shadow-sm max-w-2xl">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Account &amp; Preferences</h2>
              <p className="text-xs text-slate-500 mb-6">Manage your profile and clinical parameters.</p>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Name</span>
                  <div className="font-semibold text-slate-800 text-sm">{user?.name}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</span>
                  <div className="font-semibold text-slate-800 text-sm break-all">{user?.email}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Range</span>
                  <div className="font-semibold text-emerald-600">70 – 140 mg/dL (Normal Fasting &amp; Post-meal)</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar: Quick 1-tap tab switching */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-3 flex items-center justify-around z-30 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
