import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventTracking } from '@/hooks/useEventTracking';

export const AutoEventTracker = () => {
  const location = useLocation();
  const { trackPageView, trackButtonClick, trackLinkClick, trackCustomEvent } = useEventTracking();

  // Track page views on route change
  useEffect(() => {
    // Skip admin pages
    if (location.pathname.startsWith('/admin')) return;
    
    trackPageView(location.pathname, {
      eventData: {
        search: location.search,
        hash: location.hash,
        title: document.title,
      },
    });
  }, [location.pathname, trackPageView]);

  // Identify key conversion buttons
  const getButtonCategory = (text: string, id?: string): string => {
    const lowerText = text.toLowerCase();
    const lowerId = (id || '').toLowerCase();
    
    // Sign up / Get started buttons
    if (lowerText.includes('get started') || lowerText.includes('sign up') || lowerText.includes('start healing')) {
      return 'conversion_signup';
    }
    // Sign in buttons
    if (lowerText.includes('sign in') || lowerText.includes('login')) {
      return 'conversion_signin';
    }
    // Pricing / Subscribe buttons
    if (lowerText.includes('subscribe') || lowerText.includes('upgrade') || lowerText.includes('pro') || lowerText.includes('couples')) {
      return 'conversion_pricing';
    }
    // CTA buttons
    if (lowerText.includes('try') || lowerText.includes('start') || lowerText.includes('begin') || lowerText.includes('chat with luna')) {
      return 'cta_engagement';
    }
    // Navigation
    if (lowerId.includes('nav') || lowerText.includes('features') || lowerText.includes('pricing') || lowerText.includes('faq')) {
      return 'navigation';
    }
    return 'general_interaction';
  };

  // Set up global click listener for buttons and links
  const handleGlobalClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Skip admin pages
    if (window.location.pathname.startsWith('/admin')) return;
    
    // Find the closest button or link
    const button = target.closest('button');
    const link = target.closest('a');
    
    if (button) {
      const buttonText = button.textContent?.trim().slice(0, 50) || 'Unknown Button';
      const buttonId = button.id || button.getAttribute('data-track') || undefined;
      const buttonCategory = getButtonCategory(buttonText, buttonId);
      
      // Skip tracking for certain buttons
      if (button.closest('[data-no-track]')) return;
      
      trackButtonClick(buttonText, {
        elementId: buttonId,
        elementText: buttonText,
        eventData: {
          category: buttonCategory,
          page: window.location.pathname,
          variant: button.getAttribute('data-variant') || undefined,
        },
      });
      
      // Track high-value conversion events separately
      if (buttonCategory.startsWith('conversion_')) {
        trackCustomEvent(`${buttonCategory}_clicked`, {
          button_text: buttonText,
          page: window.location.pathname,
          referrer: document.referrer,
        });
      }
    } else if (link) {
      const linkText = link.textContent?.trim().slice(0, 50) || 'Unknown Link';
      const linkHref = link.getAttribute('href') || '';
      
      // Skip tracking for internal navigation handled by React Router (unless explicitly tracked)
      if (link.closest('[data-no-track]')) return;
      
      // Track all links now for better insights
      const isExternal = linkHref.startsWith('http') && !linkHref.includes(window.location.host);
      const isAnchor = linkHref.startsWith('#');
      
      trackLinkClick(linkText, linkHref, {
        elementId: link.id || undefined,
        elementText: linkText,
        eventData: {
          type: isExternal ? 'external' : isAnchor ? 'anchor' : 'internal',
          page: window.location.pathname,
        },
      });
    }
  }, [trackButtonClick, trackLinkClick, trackCustomEvent]);

  // Track scroll depth
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) return;
    
    let maxScroll = 0;
    const scrollThresholds = [25, 50, 75, 100];
    const trackedThresholds = new Set<number>();
    
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        for (const threshold of scrollThresholds) {
          if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
            trackedThresholds.add(threshold);
            trackCustomEvent('scroll_depth', {
              depth: threshold,
              page: window.location.pathname,
            });
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, trackCustomEvent]);

  useEffect(() => {
    document.addEventListener('click', handleGlobalClick, { passive: true });
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [handleGlobalClick]);

  return null;
};
