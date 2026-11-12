import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export default function RegisterPage({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Navy Panel matching Figma Screen 05 */}
      <div className="hidden lg:flex lg:w-5/12 bg-navy-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white text-lg">
              S
            </div>
            <div className="font-bold text-xl tracking-tight">sweety</div>
          </div>

          {/* Decorative overlapping circles */}
          <div className="relative w-48 h-48 my-8 flex items-center justify-center">
            <div className="w-44 h-44 rounded-full bg-slate-700/40 absolute"></div>
            <div className="w-24 h-24 rounded-full bg-brand-500 absolute transform translate-y-3"></div>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white mb-4 leading-snug">
            A clearer picture<br />of your glucose.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            A simple, thoughtful way to record your daily readings and understand your trends.
          </p>
        </div>

        <div className="text-[10px] tracking-widest text-slate-500 font-semibold uppercase">
          Your health journey, one day at a time
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          <div className="text-[11px] font-bold text-brand-500 uppercase tracking-wider mb-2">
            Welcome to Sweety
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-sm text-slate-500 mb-8">Start keeping your readings organised.</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-4 text-center text-[11px] text-slate-400">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-brand-600 font-semibold hover:underline"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

