import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UTMData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  session_id: string;
}

export const useFunnelTracking = (funnelType: 'dm' | 'couples') => {
  // Generate or retrieve session ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('funnel_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('funnel_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Parse and store UTM parameters
  const getUTMData = useCallback((): UTMData => {
    const params = new URLSearchParams(window.location.search);
    const storedData = sessionStorage.getItem(`utm_data_${funnelType}`);
    
    if (storedData) {
      return JSON.parse(storedData);
    }
    
    const utmData: UTMData = {
      utm_source: params.get('utm_source') || 'direct',
      utm_medium: params.get('utm_medium') || 'none',
      utm_campaign: params.get('utm_campaign') || funnelType,
      utm_content: params.get('utm_content') || 'none',
      session_id: getSessionId()
    };
    
    sessionStorage.setItem(`utm_data_${funnelType}`, JSON.stringify(utmData));
    return utmData;
  }, [funnelType, getSessionId]);

  // Track an event
  const trackEvent = useCallback(async (eventType: 'page_view' | 'checkout_start' | 'checkout_complete') => {
    try {
      const utmData = getUTMData();
      const segment = sessionStorage.getItem(`${funnelType}_segment`) || 
                     new URLSearchParams(window.location.search).get('segment') || 
                     null;
      
      const { error } = await supabase.from('funnel_events').insert({
        event_type: eventType,
        funnel_type: funnelType,
        utm_source: utmData.utm_source,
        utm_medium: utmData.utm_medium,
        utm_campaign: utmData.utm_campaign,
        utm_content: utmData.utm_content,
        session_id: utmData.session_id,
        segment: segment,
      });

      if (error) {
        console.error(`[FunnelTracking] Error tracking ${eventType}:`, error);
      } else {
        console.log(`[FunnelTracking] Tracked ${eventType} for ${funnelType} funnel`, { ...utmData, segment });
      }
    } catch (err) {
      console.error(`[FunnelTracking] Exception tracking ${eventType}:`, err);
    }
  }, [funnelType, getUTMData]);

  // Track page view on mount
  useEffect(() => {
    trackEvent('page_view');
  }, [trackEvent]);

  return { trackEvent, getUTMData };
};
