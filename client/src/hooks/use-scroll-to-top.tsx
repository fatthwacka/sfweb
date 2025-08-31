import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);
  
  useEffect(() => {
    // Only scroll to top on actual page navigation, not on same-page scrolling
    // Immediate scroll to top only
    window.scrollTo(0, 0);
  }, [location]);
}