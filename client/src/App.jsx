import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
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

  // Main Workspace with Sidebar & Header
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header breadcrumbPath={activeTab} />

        <main className="flex-1 px-8 max-w-7xl w-full mx-auto">
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
            <div className="bg-white rounded-3xl p-8 border border-[#E8ECF2] shadow-sm max-w-2xl">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Account & Preferences</h2>
              <p className="text-xs text-slate-500 mb-6">Manage your profile and clinical parameters.</p>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Name</span>
                  <div className="font-semibold text-slate-800">{user?.name}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</span>
                  <div className="font-semibold text-slate-800">{user?.email}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Range</span>
                  <div className="font-semibold text-emerald-600">70 – 140 mg/dL (Normal Fasting & Post-meal)</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
