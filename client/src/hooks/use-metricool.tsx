import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

// Declare the beTracker global from Metricool
declare global {
  interface Window {
    beTracker?: {
      t: (config: { hash: string }) => void;
    };
  }
}

const METRICOOL_HASH = 'a3e8654831a8c3870479528bc528b9fc';

/**
 * Hook to track page views with Metricool on SPA route changes.
 * The Metricool script is loaded in index.html, this hook triggers
 * tracking on each route change.
 */
export const useMetricool = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Skip tracking on initial load (index.html script handles that)
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      prevLocationRef.current = location;
      return;
    }

    // Only track when location actually changes
    if (location !== prevLocationRef.current) {
      if (window.beTracker) {
        try {
          window.beTracker.t({ hash: METRICOOL_HASH });
        } catch (error) {
          console.warn('Metricool tracking error:', error);
        }
      }
      prevLocationRef.current = location;
    }
  }, [location]);
};
