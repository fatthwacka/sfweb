import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';

// Declare the beTracker global from Metricool
declare global {
  interface Window {
    beTracker?: {
      t: (config: { hash: string }) => void;
    };
    metricoolReady?: boolean;
  }
}

const METRICOOL_HASH = 'a3e8654831a8c3870479528bc528b9fc';
const MAX_WAIT_ATTEMPTS = 50; // 5 seconds max wait (50 * 100ms)

/**
 * Hook to track page views with Metricool on SPA route changes.
 * The Metricool script is loaded in index.html, this hook triggers
 * tracking on each route change.
 *
 * Features:
 * - Waits for beTracker to be available before tracking
 * - Tracks initial page view if index.html tracking failed
 * - Reliable SPA navigation tracking
 */
export const useMetricool = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  const initialLoadRef = useRef(true);
  const initialTrackedRef = useRef(false);

  // Helper to track with retry if beTracker isn't ready yet
  const trackWithRetry = useCallback((isInitial = false) => {
    let attempts = 0;

    const tryTrack = () => {
      if (window.beTracker) {
        try {
          window.beTracker.t({ hash: METRICOOL_HASH });
          if (isInitial) {
            initialTrackedRef.current = true;
          }
        } catch (error) {
          console.warn('[Metricool] Tracking error:', error);
        }
      } else if (attempts < MAX_WAIT_ATTEMPTS) {
        attempts++;
        setTimeout(tryTrack, 100);
      } else {
        console.warn('[Metricool] beTracker not available for SPA tracking');
      }
    };

    tryTrack();
  }, []);

  // Track initial page view if not already tracked by index.html
  useEffect(() => {
    // Wait a bit then check if initial tracking happened
    const checkInitialTracking = setTimeout(() => {
      if (!window.metricoolReady && !initialTrackedRef.current) {
        // index.html tracking may have failed, track now
        trackWithRetry(true);
      }
    }, 2000);

    return () => clearTimeout(checkInitialTracking);
  }, [trackWithRetry]);

  // Track SPA route changes
  useEffect(() => {
    // Skip tracking on initial load (handled above)
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      prevLocationRef.current = location;
      return;
    }

    // Only track when location actually changes
    if (location !== prevLocationRef.current) {
      trackWithRetry(false);
      prevLocationRef.current = location;
    }
  }, [location, trackWithRetry]);
};
