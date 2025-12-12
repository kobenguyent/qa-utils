/**
 * Theme Manager - Handles theme switching and persistence
 */

export type Theme = 'light' | 'dark' | 'auto';

const THEME_KEY = 'qa-utils-theme';

export const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_KEY);
  return (stored as Theme) || 'auto';
};

export const setStoredTheme = (theme: Theme): void => {
  localStorage.setItem(THEME_KEY, theme);
};

export const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export const applyTheme = (theme: Theme): void => {
  const effectiveTheme = getEffectiveTheme(theme);
  document.documentElement.setAttribute('data-theme', effectiveTheme);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1e293b' : '#ffffff');
  }
};

export const initializeTheme = (): Theme => {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
};
