import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VisitorData {
  blocked: boolean;
  reason?: string;
  message?: string;
  visitor_id?: string;
  location?: {
    city: string;
    region: string;
    country: string;
    country_code: string;
  };
}

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `vs_${crypto.randomUUID()}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

export const useVisitorTracking = () => {
  const { user } = useAuth();
  const trackedRef = useRef(false);
  const blockedRef = useRef(false);

  const trackVisitor = useCallback(async (): Promise<VisitorData | null> => {
    if (trackedRef.current) return null;
    
    try {
      const sessionId = getOrCreateSessionId();
      
      const { data, error } = await supabase.functions.invoke('track-visitor', {
        body: {
          session_id: sessionId,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          page_path: window.location.pathname,
          user_id: user?.id || null,
        },
      });

      if (error) {
        console.error('[VisitorTracking] Error:', error);
        return null;
      }

      trackedRef.current = true;

      // Check if visitor is blocked (California)
      if (data?.blocked) {
        blockedRef.current = true;
        sessionStorage.setItem('visitor_blocked', 'true');
        sessionStorage.setItem('visitor_blocked_reason', data.reason || 'unknown');
        return data as VisitorData;
      }

      // Store location data for later use
      if (data?.location) {
        sessionStorage.setItem('visitor_location', JSON.stringify(data.location));
      }

      return data as VisitorData;
    } catch (error) {
      console.error('[VisitorTracking] Exception:', error);
      return null;
    }
  }, [user?.id]);

  const isBlocked = useCallback((): boolean => {
    return blockedRef.current || sessionStorage.getItem('visitor_blocked') === 'true';
  }, []);

  const getBlockedReason = useCallback((): string | null => {
    return sessionStorage.getItem('visitor_blocked_reason');
  }, []);

  const getSessionId = useCallback((): string => {
    return getOrCreateSessionId();
  }, []);

  const getStoredLocation = useCallback(() => {
    const locationStr = sessionStorage.getItem('visitor_location');
    if (locationStr) {
      try {
        return JSON.parse(locationStr);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  // Auto-track on mount
  useEffect(() => {
    // Skip tracking on admin pages
    if (window.location.pathname.startsWith('/admin')) {
      return;
    }

    trackVisitor();
  }, [trackVisitor]);

  return {
    trackVisitor,
    isBlocked,
    getBlockedReason,
    getSessionId,
    getStoredLocation,
  };
};

export const getVisitorSessionId = getOrCreateSessionId;
