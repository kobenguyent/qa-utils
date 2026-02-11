// Declare global constants injected by Vite
declare const __APP_VERSION__: string
declare const __PACKAGE_VERSION__: string

/**
 * Check if the app is running in Electron
 */
const isElectron = (): boolean => {
  // @ts-ignore
  return typeof window !== 'undefined' && window.electron !== undefined;
};

/**
 * Get platform information for desktop app tracking
 */
const getPlatformInfo = (): Record<string, string> => {
  if (!isElectron()) {
    return { environment: 'web' };
  }

  // @ts-ignore
  const platform = window.electron?.platform || 'unknown';
  
  return {
    environment: 'electron',
    platform: platform,
    app_version: __APP_VERSION__, // Dynamic version: package.json version + commit hash for Electron
  };
};

/**
 * Track page view with platform-specific data
 */
export const trackPageView = (url: string) => {
  // @ts-ignore
  if (window.umami && typeof window.umami.track === 'function') {
    const platformInfo = getPlatformInfo();
    
    // For Electron apps, prefix the URL to distinguish from web traffic
    const trackingUrl = isElectron() ? `electron:${url}` : url;
    
    // Track event with custom properties
    // @ts-ignore
    window.umami.track(trackingUrl, platformInfo);
  } else {
    console.warn('Umami tracking script not loaded or track function not available.');
  }
};

/**
 * Track custom events specific to desktop app usage
 */
export const trackEvent = (eventName: string, eventData?: Record<string, string | number>) => {
  // @ts-ignore
  if (window.umami && typeof window.umami.track === 'function') {
    const platformInfo = getPlatformInfo();
    const data = { ...platformInfo, ...eventData };
    
    // @ts-ignore
    window.umami.track(eventName, data);
  } else {
    console.warn('Umami tracking script not loaded or track function not available.');
  }
};
