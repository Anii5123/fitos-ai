import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Render Node */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => {
            let bgColor = 'bg-white text-slate-800 border-slate-200';
            let Icon = Info;
            let iconColor = 'text-blue-500';

            if (toast.type === 'success') {
              bgColor = 'bg-emerald-50 text-emerald-950 border-emerald-250 dark:bg-emerald-950/90 dark:text-emerald-50 dark:border-emerald-900/50';
              Icon = CheckCircle;
              iconColor = 'text-emerald-500';
            } else if (toast.type === 'error') {
              bgColor = 'bg-rose-50 text-rose-950 border-rose-250 dark:bg-rose-950/90 dark:text-rose-50 dark:border-rose-900/50';
              Icon = AlertCircle;
              iconColor = 'text-rose-500';
            } else if (toast.type === 'warning') {
              bgColor = 'bg-amber-50 text-amber-950 border-amber-250 dark:bg-amber-950/90 dark:text-amber-50 dark:border-amber-900/50';
              Icon = AlertCircle;
              iconColor = 'text-amber-500';
            } else if (toast.type === 'info') {
              bgColor = 'bg-indigo-50 text-indigo-950 border-indigo-250 dark:bg-indigo-950/90 dark:text-indigo-50 dark:border-indigo-900/50';
              Icon = Info;
              iconColor = 'text-indigo-500';
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
                className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md pointer-events-auto ${bgColor}`}
              >
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
                <div className="flex-1 text-sm font-medium pr-2 leading-relaxed">
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
