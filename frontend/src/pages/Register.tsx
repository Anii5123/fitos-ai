import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useToast } from '../contexts/ToastContext.js';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const { registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill out all registration fields.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({ name, email, password });
      showToast(data.message || 'Registration successful! Verification email sent.', 'success');
      navigate('/verify-email');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Registration failed. Try again.', 'error');
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
            <UserPlus className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-brand-emerald to-brand-indigo bg-clip-text text-transparent">Start Your Journey</h2>
          <p className="text-xs text-slate-400">Join FitTrack AI to calculate daily deficits and reach goals.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-900 border border-slate-250/10 outline-none text-sm focus:border-brand-emerald/50"
              />
            </div>
          </div>

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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
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
            <LogInIcon className="w-4 h-4" />
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-indigo hover:underline font-bold inline-flex items-center gap-0.5">
            Log in <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

// Lightweight custom icon since Lucide imports are clean
const LogInIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);
