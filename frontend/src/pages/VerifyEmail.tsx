import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext.js';
import api from '../services/api.js';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-verify if token is present in the URL query string
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      handleVerification(urlToken);
    }
  }, [searchParams]);

  const handleVerification = async (tokenString: string) => {
    if (!tokenString.trim()) return;

    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-email', { token: tokenString });
      showToast(res.data.message || 'Email verified successfully!', 'success');
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Verification failed. Token may be invalid or expired.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('Please enter the verification token.', 'warning');
      return;
    }
    handleVerification(token);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card rounded-3xl p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl text-center"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
            {success ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6 animate-pulse" />}
          </div>
          
          <h2 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-brand-emerald to-brand-indigo bg-clip-text text-transparent">
            {success ? 'Account Verified!' : 'Verify Your Email'}
          </h2>
          <p className="text-xs text-slate-400">
            {success
              ? 'Thank you! Redirecting you to login in a few seconds...'
              : 'Enter the verification token sent to your email inbox to activate your account.'}
          </p>
        </div>

        {!success && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-left">Verification Token</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Paste token or enter here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={verifying}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-900 border border-slate-250/10 outline-none text-sm focus:border-brand-emerald/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying || !token}
              className="w-full mt-2 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-brand-emerald dark:hover:bg-brand-emerald-dark font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>
        )}

        <p className="text-xs text-slate-450 mt-6 font-medium">
          Didn\'t receive the email? Check spam, or return to{' '}
          <Link to="/login" className="text-brand-indigo hover:underline font-bold inline-flex items-center gap-0.5">
            Log in <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
