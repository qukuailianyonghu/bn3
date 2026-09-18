import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'youth' | 'senior';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'app-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'senior' ? 'senior' : 'youth';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'senior') {
      root.classList.add('theme-senior');
      root.classList.remove('theme-youth');
    } else {
      root.classList.add('theme-youth');
      root.classList.remove('theme-senior');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (t: ThemeMode) => setThemeState(t);
  const toggleTheme = () => setThemeState(prev => (prev === 'senior' ? 'youth' : 'senior'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
