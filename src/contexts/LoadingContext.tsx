import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  isLoading: boolean;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  withLoading: <T extends any[], R>(
    key: string,
    fn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const startLoading = useCallback((key: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: true,
    }));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const isLoading = Object.keys(loadingStates).length > 0;

  const withLoading = useCallback(
    <T extends any[], R>(
      key: string,
      fn: (...args: T) => Promise<R>
    ) => {
      return async (...args: T): Promise<R> => {
        startLoading(key);
        try {
          const result = await fn(...args);
          return result;
        } finally {
          stopLoading(key);
        }
      };
    },
    [startLoading, stopLoading]
  );

  const value: LoadingContextType = {
    loadingStates,
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}; 