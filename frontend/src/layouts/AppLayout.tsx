import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useToast } from '../contexts/ToastContext.js';
import api from '../services/api.js';
import type { INotification } from '../types/index.js';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  LayoutDashboard,
  Utensils,
  Activity,
  TrendingDown,
  Sparkles,
  Target,
  Shield,
  LogOut,
  Sun,
  Moon,
  Bell,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        await api.get('/ai/insights');
        return [] as INotification[];
      } catch (e) {
        console.warn('Notifications fetch failed', e);
        return [] as INotification[];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const notifications = notifData || [
    {
      _id: '1',
      title: 'Daily Check-in! ☀️',
      message: 'Don\'t forget to log your breakfast and record your steps.',
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      _id: '2',
      title: 'Hydration Target Reached! 💧',
      message: 'Good job! You have logged 2,500ml of water today.',
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString(),
    }
  ] as INotification[];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast('Logged out successfully.', 'success');
      navigate('/login');
    } catch (error) {
      showToast('Teardown authentication failed.', 'error');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Meal Logger', path: '/meals', icon: Utensils },
    { name: 'Activity Logger', path: '/activity', icon: Activity },
    { name: 'Weight Tracker', path: '/weight', icon: TrendingDown },
    { name: 'AI Coach Hub', path: '/coach', icon: Sparkles },
    { name: 'Goal Settings', path: '/goals', icon: Target },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ name: 'Admin Panel', path: '/admin', icon: Shield });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      {/* Mobile Top Header */}
      <header className="md:hidden glass-nav fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-emerald" />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-brand-emerald to-brand-indigo bg-clip-text text-transparent">FitTrack AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 text-slate-500 hover:text-brand-emerald dark:text-slate-400 dark:hover:text-brand-emerald relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-500 hover:text-brand-emerald dark:text-slate-400 dark:hover:text-brand-emerald"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Navigation Sidebar (Desktop + Mobile overlay) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 glass-card border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-emerald animate-pulse" />
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-brand-emerald to-brand-indigo bg-clip-text text-transparent">FitTrack AI</span>
            </div>
            <button className="md:hidden p-1" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Summary */}
          <div className="p-4 mx-4 my-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/20 dark:border-slate-700/20">
            <p className="text-xs text-slate-400 font-medium">Logged in as</p>
            <p className="font-semibold text-sm truncate">{user?.name || 'Healthy User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    active
                      ? 'bg-brand-emerald text-white shadow-lg shadow-brand-emerald/20'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-2">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 w-full text-left"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-brand-indigo" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 w-full text-left"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        
        {/* Desktop Top Nav */}
        <header className="hidden md:flex h-16 px-8 items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 glass-nav z-30">
          <div>
            <h1 className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
              {location.pathname.substring(1).replace('-', ' ') || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Indicator Bell */}
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-brand-emerald dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-brand-emerald transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/30">
          <Outlet />
        </main>
      </div>

      {/* Slide-out Notification Drawer */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setNotifOpen(false)} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="w-80 h-full glass-card border-l border-slate-200/50 dark:border-slate-800/50 shadow-2xl z-10 flex flex-col justify-between"
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brand-emerald" />
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notification Alerts List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    let typeClass = 'border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900/30';
                    if (notif.type === 'success') {
                      typeClass = 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/30';
                    } else if (notif.type === 'warning') {
                      typeClass = 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/30';
                    }
                    
                    return (
                      <div
                        key={notif._id}
                        className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${typeClass}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-xs text-slate-800 dark:text-slate-200 leading-snug">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-1">
                          {notif.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
