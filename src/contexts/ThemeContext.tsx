import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  Theme,
  applyTheme,
  getStoredTheme,
  setStoredTheme,
} from '../utils/themeManager';

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  /** Currently selected theme preference (light | dark | auto). */
  theme: Theme;
  /**
   * Change and persist the theme preference.
   * Triggers immediate DOM update via `applyTheme`.
   */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  // Apply theme to the DOM whenever the preference changes.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Re-apply when the OS colour scheme changes while the preference is 'auto'.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (getStoredTheme() === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setStoredTheme(newTheme);
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the current theme and a setter from any component in the tree.
 * Must be called inside a `<ThemeProvider>`.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
