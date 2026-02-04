'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ApiCall {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  endpoint: string;
  requestHeaders: Record<string, string>;
  requestBody: any;
  responseStatus: number | null;
  responseHeaders: Record<string, string>;
  responseBody: any;
  error: any;
  duration: number;
}

interface ApiCallContextType {
  apiCalls: ApiCall[];
  addApiCall: (call: Omit<ApiCall, 'id' | 'timestamp'>) => void;
  clearApiCalls: () => void;
}

const ApiCallContext = createContext<ApiCallContextType | undefined>(undefined);

export function ApiCallProvider({ children }: { children: ReactNode }) {
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

  const addApiCall = useCallback((call: Omit<ApiCall, 'id' | 'timestamp'>) => {
    const newCall: ApiCall = {
      ...call,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setApiCalls((prev) => [newCall, ...prev]);
  }, []);

  const clearApiCalls = useCallback(() => {
    setApiCalls([]);
  }, []);

  return (
    <ApiCallContext.Provider value={{ apiCalls, addApiCall, clearApiCalls }}>
      {children}
    </ApiCallContext.Provider>
  );
}

export function useApiCallContext() {
  const context = useContext(ApiCallContext);
  if (context === undefined) {
    throw new Error('useApiCallContext must be used within an ApiCallProvider');
  }
  return context;
}
