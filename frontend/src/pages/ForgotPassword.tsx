import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext.js';
import api from '../services/api.js';
import { motion } from 'framer-motion';
import { Mail, HelpCircle, ArrowLeft, Send } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      showToast(res.data.message || 'Password reset request dispatched.', 'success');
      setSubmitted(true);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Request failed.', 'error');
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
            <HelpCircle className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-brand-emerald to-brand-indigo bg-clip-text text-transparent">Recover Password</h2>
          <p className="text-xs text-slate-400">
            {submitted
              ? 'Check your inbox for a link to reset your secure credentials.'
              : 'Enter your email address and we will dispatch a verification link.'}
          </p>
        </div>

        {!submitted ? (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 text-xs font-medium text-slate-500">
            Link sent! If you do not see it within 5 minutes, please double-check your spam folder.
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          <Link to="/login" className="text-brand-indigo hover:underline font-bold inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
