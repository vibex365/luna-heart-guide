import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getVisitorSessionId } from './useVisitorTracking';

interface EventData {
  [key: string]: unknown;
}

export const useEventTracking = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async (
    eventType: 'button_click' | 'link_click' | 'form_submit' | 'page_view' | 'custom',
    eventName: string,
    options?: {
      elementId?: string;
      elementText?: string;
      eventData?: EventData;
      pagePath?: string;
    }
  ) => {
    try {
      const sessionId = getVisitorSessionId();
      
      const { error } = await supabase.functions.invoke('track-event', {
        body: {
          session_id: sessionId,
          event_type: eventType,
          event_name: eventName,
          page_path: options?.pagePath || window.location.pathname,
          element_id: options?.elementId || null,
          element_text: options?.elementText || null,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          event_data: options?.eventData || {},
          user_id: user?.id || null,
        },
      });

      if (error) {
        console.error('[EventTracking] Error:', error);
      }
    } catch (error) {
      console.error('[EventTracking] Exception:', error);
    }
  }, [user?.id]);

  const trackButtonClick = useCallback((
    buttonName: string,
    options?: { elementId?: string; elementText?: string; eventData?: EventData }
  ) => {
    return trackEvent('button_click', buttonName, options);
  }, [trackEvent]);

  const trackLinkClick = useCallback((
    linkName: string,
    url: string,
    options?: { elementId?: string; elementText?: string; eventData?: EventData }
  ) => {
    return trackEvent('link_click', linkName, {
      ...options,
      eventData: { url, ...options?.eventData },
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((
    formName: string,
    options?: { elementId?: string; eventData?: EventData }
  ) => {
    return trackEvent('form_submit', formName, options);
  }, [trackEvent]);

  const trackPageView = useCallback((
    pageName: string,
    options?: { eventData?: EventData }
  ) => {
    return trackEvent('page_view', pageName, options);
  }, [trackEvent]);

  const trackCustomEvent = useCallback((
    eventName: string,
    data?: EventData
  ) => {
    return trackEvent('custom', eventName, { eventData: data });
  }, [trackEvent]);

  return {
    trackEvent,
    trackButtonClick,
    trackLinkClick,
    trackFormSubmit,
    trackPageView,
    trackCustomEvent,
  };
};
