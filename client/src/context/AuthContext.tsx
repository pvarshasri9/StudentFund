import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/index.js';
import { apiRequest } from '../utils/api.js';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('studentfund_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await apiRequest<{ user: UserProfile }>('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('studentfund_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('studentfund_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: UserProfile }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      localStorage.setItem('studentfund_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: UserProfile }>('/auth/demo-login', {
        method: 'POST'
      });
      localStorage.setItem('studentfund_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const resetDemoData = async () => {
    setIsLoading(true);
    try {
      await apiRequest('/auth/demo-reset', { method: 'POST' });
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('studentfund_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginAsDemo,
        resetDemoData,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
