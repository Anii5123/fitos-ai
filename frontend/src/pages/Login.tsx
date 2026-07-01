import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useToast } from '../contexts/ToastContext.js';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, googleLoginUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      showToast('Logged in successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Login failed. Please verify credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMockLogin = async () => {
    setLoading(true);
    try {
      // Mock sync call containing a random Google credentials packet
      await googleLoginUser({
        googleId: `g_${Math.random().toString(36).substring(2, 9)}`,
        email: email || `google_user_${Math.random().toString(36).substring(2, 6)}@gmail.com`,
        name: 'Google Athlete',
      });
      showToast('Logged in using Google account!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast('Google authentication sync failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card rounded-3xl p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-brand-emerald to-brand-indigo bg-clip-text text-transparent">Welcome back to FitTrack AI</h2>
          <p className="text-xs text-slate-400">Log in to check today\'s active calorie goals.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="e.g. you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-900 border border-slate-250/10 outline-none text-sm focus:border-brand-emerald/50"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              <Link to="/forgot-password" className="text-[10px] font-semibold text-brand-indigo hover:underline">Forgot Password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-900 border border-slate-250/10 outline-none text-sm focus:border-brand-emerald/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200/50 dark:border-slate-800/50" /></div>
          <span className="relative bg-white dark:bg-slate-900/95 px-3 text-[10px] text-slate-400 uppercase font-semibold">Or continue with</span>
        </div>

        {/* Google OAuth mockup trigger */}
        <button
          onClick={handleGoogleMockLogin}
          disabled={loading}
          className="w-full py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.76 14.93 1 12 1 7.37 1 3.4 3.73 1.57 7.72l3.67 2.85C6.12 7.55 8.84 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.75-4.87 3.75-8.5z" />
            <path fill="#FBBC05" d="M5.24 10.57c-.24-.72-.37-1.49-.37-2.29s.13-1.57.37-2.29L1.57 5.14C.57 7.11 0 9.3 0 11.6c0 2.3.57 4.49 1.57 6.46l3.67-2.85c-.24-.72-.37-1.49-.37-2.29L5.24 10.57z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.16 0-5.88-2.51-6.76-5.53L1.57 15.75C3.4 19.74 7.37 23 12 23z" />
          </svg>
          Google Login
        </button>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          New to FitTrack AI?{' '}
          <Link to="/register" className="text-brand-indigo hover:underline font-bold inline-flex items-center gap-0.5">
            Create account <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
