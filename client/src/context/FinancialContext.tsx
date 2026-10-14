import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthoritativeFinancialSummary } from '../types/index.js';
import { apiRequest } from '../utils/api.js';
import { useAuth } from './AuthContext.js';

interface FinancialContextType {
  summary: AuthoritativeFinancialSummary | null;
  isLoading: boolean;
  refreshFinancials: () => Promise<void>;
  lastUpdated: number;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AuthoritativeFinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const refreshFinancials = useCallback(async () => {
    if (!user) {
      setSummary(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await apiRequest<any>('/financials/summary');
      setSummary(data?.summary || data);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Failed to fetch authoritative financial summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshFinancials();
    } else {
      setSummary(null);
    }
  }, [user, refreshFinancials]);

  // Window focus listener for cross-tab or return synchronization
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        refreshFinancials();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refreshFinancials]);

  return (
    <FinancialContext.Provider
      value={{
        summary,
        isLoading,
        refreshFinancials,
        lastUpdated
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
};
