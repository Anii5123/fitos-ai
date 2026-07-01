import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.js';
import { AppLayout } from './layouts/AppLayout.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { VerifyEmail } from './pages/VerifyEmail.js';
import { ForgotPassword } from './pages/ForgotPassword.js';
import { ResetPassword } from './pages/ResetPassword.js';
import { Dashboard } from './pages/Dashboard.js';
import { MealLogger } from './pages/MealLogger.js';
import { ActivityLogger } from './pages/ActivityLogger.js';
import { WeightTracker } from './pages/WeightTracker.js';
import { AICoach } from './pages/AICoach.js';
import { Goals } from './pages/Goals.js';
import { AdminPanel } from './pages/AdminPanel.js';

// Protected Route Guard Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-emerald animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Dashboard routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="meals" element={<MealLogger />} />
          <Route path="activity" element={<ActivityLogger />} />
          <Route path="weight" element={<WeightTracker />} />
          <Route path="coach" element={<AICoach />} />
          <Route path="goals" element={<Goals />} />
          
          <Route
            path="admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
};
