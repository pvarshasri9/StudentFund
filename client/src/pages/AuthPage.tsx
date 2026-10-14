import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotification } from '../context/NotificationContext.js';
import { Compass, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, loginAsDemo, isLoading } = useAuth();
  const { showToast } = useNotification();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('Indian Institute of Technology (IIT) Delhi');
  const [course, setCourse] = useState('B.Tech Computer Science');
  const [monthlyAllowance, setMonthlyAllowance] = useState('15000');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        showToast('Welcome back to StudentFund!', 'success');
      } else {
        await register({
          email,
          password,
          name,
          college,
          course,
          monthlyAllowance: parseFloat(monthlyAllowance) || 0
        });
        showToast('Your StudentFund account has been created!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication failed. Please check credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async () => {
    setSubmitting(true);
    try {
      await loginAsDemo();
      showToast('Loaded interactive Demo Student account (Ananya Sharma)', 'success', 'Demo Mode Active');
    } catch (err: any) {
      showToast(err.message || 'Failed to load demo profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 text-white shadow-xl shadow-indigo-600/30 mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-heading">
          StudentFund
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Smart Student Budget & Money Runway Planner
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          YUKTI Innovation Challenge Ready
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Quick Demo Access Button */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-emerald-950/40 border border-indigo-500/30 shadow-inner">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Instant Evaluator Access
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Explore full dataset with semester fee dues, runway forecast & savings goals.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoClick}
              disabled={submitting || isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>Explore Demo Account (Ananya Sharma)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab selector */}
          <div className="flex rounded-xl bg-slate-950/80 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Student Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rohan Verma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      College / University
                    </label>
                    <input
                      type="text"
                      value={college}
                      onChange={e => setCollege(e.target.value)}
                      placeholder="e.g. IIT Delhi"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Monthly Allowance (₹)
                    </label>
                    <input
                      type="number"
                      value={monthlyAllowance}
                      onChange={e => setMonthlyAllowance(e.target.value)}
                      placeholder="12000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                College or Personal Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@college.ac.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : mode === 'login' ? 'Sign In to StudentFund' : 'Create Student Account'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict per-user database isolation with encrypted passwords</span>
          </div>
        </div>
      </div>
    </div>
  );
};
