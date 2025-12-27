import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventTracking } from '@/hooks/useEventTracking';

export const AutoEventTracker = () => {
  const location = useLocation();
  const { trackPageView, trackButtonClick, trackLinkClick } = useEventTracking();

  // Track page views on route change
  useEffect(() => {
    // Skip admin pages
    if (location.pathname.startsWith('/admin')) return;
    
    trackPageView(location.pathname, {
      eventData: {
        search: location.search,
        hash: location.hash,
      },
    });
  }, [location.pathname, trackPageView]);

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
      
      // Skip tracking for certain buttons
      if (button.closest('[data-no-track]')) return;
      
      trackButtonClick(buttonText, {
        elementId: buttonId,
        elementText: buttonText,
      });
    } else if (link) {
      const linkText = link.textContent?.trim().slice(0, 50) || 'Unknown Link';
      const linkHref = link.getAttribute('href') || '';
      
      // Skip tracking for internal navigation handled by React Router
      if (link.closest('[data-no-track]')) return;
      
      // Only track external links or specific tracked links
      if (linkHref.startsWith('http') || link.hasAttribute('data-track')) {
        trackLinkClick(linkText, linkHref, {
          elementId: link.id || undefined,
          elementText: linkText,
        });
      }
    }
  }, [trackButtonClick, trackLinkClick]);

  useEffect(() => {
    document.addEventListener('click', handleGlobalClick, { passive: true });
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [handleGlobalClick]);

  return null;
};
