import React, { createContext, useContext, useState, useEffect } from 'react';

type DateRange = '24h' | '7d' | 'all';

interface AppContextType {
  apps: string[];
  selectedApp: string;
  setSelectedApp: (appId: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<string[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metrics/apps')
      .then((res) => res.json())
      .then((data) => {
        setApps(data || []);
        if (data && data.length > 0 && selectedApp === 'all') {
          setSelectedApp(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppContext.Provider
      value={{
        apps,
        selectedApp,
        setSelectedApp,
        dateRange,
        setDateRange,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
