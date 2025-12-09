import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

// Generate or retrieve session ID
const getSessionId = (): string => {
  const storageKey = 'sf_visitor_session';
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    // Generate a unique session ID
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
};

// Track page visit
const trackPageVisit = async (currentPage: string) => {
  try {
    const sessionId = getSessionId();

    await fetch('/api/visitors/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        currentPage,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience for analytics
    console.debug('Visitor tracking failed:', error);
  }
};

/**
 * Hook to track visitor activity across the site.
 * Automatically tracks page views on navigation.
 * Also sends heartbeat pings to keep session alive.
 */
export function useVisitorTracking() {
  const [location] = useLocation();
  const lastTrackedPage = useRef<string>('');
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Track initial page load and navigation changes
    if (location !== lastTrackedPage.current) {
      lastTrackedPage.current = location;
      trackPageVisit(location);
    }

    // Set up heartbeat to keep session alive (every 2 minutes)
    if (!heartbeatInterval.current) {
      heartbeatInterval.current = setInterval(() => {
        trackPageVisit(location);
      }, 2 * 60 * 1000); // 2 minutes
    }

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    };
  }, [location]);
}

// Types for visitor analytics
export interface VisitorStats {
  // Live stats (5 minute window)
  totalActive: number;
  loggedInUsers: number;
  anonymousVisitors: number;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  currentPages: Record<string, number>;

  // Extended analytics
  timeWindows: {
    '5m': { visitors: number; pageViews: number };
    '30m': { visitors: number; pageViews: number };
    '1h': { visitors: number; pageViews: number };
    '24h': { visitors: number; pageViews: number };
    '7d': { visitors: number; pageViews: number };
  };

  popularPages: {
    '1h': Array<{ page: string; count: number }>;
    '24h': Array<{ page: string; count: number }>;
    '7d': Array<{ page: string; count: number }>;
  };

  deviceBreakdown24h: { desktop: number; mobile: number; tablet: number };
  trafficSources: Array<{ source: string; count: number }>;
  avgSessionDuration: number; // in minutes
  uniqueSessions: {
    '24h': number;
    '7d': number;
  };
}

/**
 * Hook to fetch visitor stats for admin dashboard.
 * Returns live visitor count, time-windowed analytics, and detailed breakdowns.
 */
export function useVisitorStats(enabled: boolean = true, refreshInterval: number = 30000) {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/visitors/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchStats();

    // Set up polling
    const interval = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, refreshInterval]);

  return { stats, isLoading, error };
}

// Types for historical visitor data
export interface DailyStats {
  date: string;
  unique_visitors: number;
  total_page_views: number;
  desktop_visitors: number;
  mobile_visitors: number;
  tablet_visitors: number;
  avg_session_minutes: number;
  top_pages: Array<{ page: string; count: number }>;
  top_referrers: Array<{ source: string; count: number }>;
}

export interface VisitorHistory {
  days: number;
  dailyStats: DailyStats[];
  summary: {
    totalVisitors: number;
    totalPageViews: number;
    avgDailyVisitors: number;
    deviceTotals: { desktop: number; mobile: number; tablet: number };
    daysWithData: number;
  };
}

/**
 * Hook to fetch historical visitor stats for charts.
 * Returns daily aggregated stats and summary totals.
 */
export function useVisitorHistory(days: number = 30, enabled: boolean = true) {
  const [history, setHistory] = useState<VisitorHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/visitors/history?days=${days}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        setHistory(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [days, enabled]);

  return { history, isLoading, error };
}
