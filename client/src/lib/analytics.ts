// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// GA4 Measurement ID - hardcoded for reliability (also in index.html)
const GA_MEASUREMENT_ID = 'G-3W8SJ9EPEF';

// Generate a simple client ID for GA4
const getClientId = (): string => {
  let clientId = localStorage.getItem('_ga_cid');
  if (!clientId) {
    clientId = Math.random().toString(36).substring(2) + '.' + Date.now();
    localStorage.setItem('_ga_cid', clientId);
  }
  return clientId;
};

// Send tracking data directly to our proxy (bypasses ad blockers completely)
const sendToProxy = async (eventName: string, params: Record<string, any> = {}) => {
  try {
    const measurementId = GA_MEASUREMENT_ID;
    const clientId = getClientId();

    const payload = new URLSearchParams({
      v: '2',
      tid: measurementId,
      cid: clientId,
      en: eventName,
      dl: window.location.href,
      dt: document.title,
      dr: document.referrer || '',
      ul: navigator.language,
      sr: `${screen.width}x${screen.height}`,
      ...params
    });

    // Use sendBeacon for reliability, fallback to fetch
    const url = `${window.location.origin}/api/sf/r?${payload.toString()}`;

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    }
  } catch (error) {
    // Silently fail - analytics should never break the site
  }
};

// Initialize Google Analytics
export const initGA = () => {
  try {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || GA_MEASUREMENT_ID;

    if (!measurementId) {
      console.warn('Missing required Google Analytics key');
      return;
    }

    // Check if already initialized to prevent duplicate scripts
    if (window.gtag) {
      console.log('Google Analytics already initialized');
      return;
    }

    // Add Google Analytics script to the head (proxied)
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `/api/sf/v.js?id=${measurementId}`;
    script1.onerror = (e) => console.warn('GA script failed to load:', e);
    document.head.appendChild(script1);

    // Initialize gtag
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        transport_url: window.location.origin + '/api/sf',
        first_party_collection: true
      });
    `;
    document.head.appendChild(script2);

    console.log('Google Analytics initialized successfully');
  } catch (error) {
    console.warn('Error initializing Google Analytics:', error);
  }
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  // Method 1: Try gtag if available (may be blocked)
  if (typeof window !== 'undefined' && window.gtag) {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || GA_MEASUREMENT_ID;
    window.gtag('config', measurementId, {
      page_path: url,
      transport_url: window.location.origin + '/api/sf',
      first_party_collection: true
    });
  }

  // Method 2: Direct proxy call (bypasses all ad blockers)
  sendToProxy('page_view', { 'ep.page_path': url });
};

// Track events
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