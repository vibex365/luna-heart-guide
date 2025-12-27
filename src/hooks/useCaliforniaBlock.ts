import { useState, useEffect } from 'react';

interface CaliforniaBlockState {
  isBlocked: boolean;
  isChecking: boolean;
  message: string | null;
}

export const useCaliforniaBlock = () => {
  const [state, setState] = useState<CaliforniaBlockState>({
    isBlocked: false,
    isChecking: true,
    message: null,
  });

  useEffect(() => {
    // Check session storage for blocked status (set by useVisitorTracking)
    const checkBlock = () => {
      const blocked = sessionStorage.getItem('visitor_blocked') === 'true';
      const reason = sessionStorage.getItem('visitor_blocked_reason');
      
      if (blocked) {
        setState({
          isBlocked: true,
          isChecking: false,
          message: reason === 'california_restriction' 
            ? 'Access restricted in your region due to local AI regulations.'
            : 'Access restricted in your region.',
        });
      } else {
        setState({
          isBlocked: false,
          isChecking: false,
          message: null,
        });
      }
    };

    // Check immediately
    checkBlock();
    
    // Also listen for storage changes
    const handleStorage = () => checkBlock();
    window.addEventListener('storage', handleStorage);
    
    // Recheck after a short delay to allow visitor tracking to complete
    const timer = setTimeout(checkBlock, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearTimeout(timer);
    };
  }, []);

  return state;
};
