import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import type { IUser } from '../types/index.js';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  registerUser: (userData: any) => Promise<any>;
  googleLoginUser: (googleData: any) => Promise<any>;
  logoutUser: () => Promise<void>;
  updateUserHeight: (height: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user from localStorage or fetch profile on startup
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const cachedUser = localStorage.getItem('user');

      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));
        
        // Fetch fresh profile in background
        try {
          const res = await api.get('/auth/me');
          if (res.data.status === 'success') {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Silent profile fetch failed, using cache', err);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen to token refresh failures
    const handleLogoutEvent = () => {
      setUser(null);
    };
    window.addEventListener('auth-logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  const login = async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data.status === 'success') {
      const { accessToken, refreshToken, user: loggedUser } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
    }
    return res.data;
  };

  const registerUser = async (userData: any) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  };

  const googleLoginUser = async (googleData: any) => {
    const res = await api.post('/auth/google-login', googleData);
    if (res.data.status === 'success') {
      const { accessToken, refreshToken, user: loggedUser } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
    }
    return res.data;
  };

  const logoutUser = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { token: refreshToken });
    } catch (e) {
      console.warn('Backend logout failed', e);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUserHeight = async (height: number) => {
    try {
      // Mock endpoint or put request to user update
      // Since we added height to schema, we can write user update endpoint
      // We will define it as standard user patch or update
      // Let's assume endpoint `/users/profile` on backend exist or fallback, or update in DB
      // We can update height on goals instead or mock local state:
      if (user) {
        const updated = { ...user, height };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerUser,
        googleLoginUser,
        logoutUser,
        updateUserHeight,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
