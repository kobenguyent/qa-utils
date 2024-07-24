export const trackPageView = (url: string) => {
  // @ts-ignore
  if (window.umami && typeof window.umami.trackView === 'function') {
    // @ts-ignore
    window.umami.trackView(url);
  } else {
    console.warn('Umami tracking script not loaded or trackView function not available.');
  }
};
