// Google Analytics 4 - Standard Implementation
// gtag.js is loaded directly from Google in index.html

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// GA4 Measurement ID (must match index.html)
const GA_MEASUREMENT_ID = 'G-3W8SJ9EPEF';

// Initialize Google Analytics (called once on app start)
// Note: gtag.js is already loaded in index.html, this just verifies it's ready
export const initGA = () => {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    console.log('Google Analytics ready');
  } else {
    console.warn('Google Analytics not loaded (may be blocked by ad blocker)');
  }
};

// Track page views - essential for Single Page Applications
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category?: string,
  label?: string,
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
