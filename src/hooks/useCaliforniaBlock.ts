import { useState, useEffect, useCallback } from 'react';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

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
  
  const { trackVisitor, isBlocked, getBlockedReason } = useVisitorTracking();

  const checkBlock = useCallback(async () => {
    // Check if already blocked from session
    if (isBlocked()) {
      setState({
        isBlocked: true,
        isChecking: false,
        message: 'Access restricted in your region due to local AI regulations.',
      });
      return;
    }

    // Track visitor and check response
    const result = await trackVisitor();
    
    if (result?.blocked) {
      setState({
        isBlocked: true,
        isChecking: false,
        message: result.message || 'Access restricted in your region due to local AI regulations.',
      });
    } else {
      setState({
        isBlocked: false,
        isChecking: false,
        message: null,
      });
    }
  }, [trackVisitor, isBlocked]);

  useEffect(() => {
    checkBlock();
  }, [checkBlock]);

  return state;
};
