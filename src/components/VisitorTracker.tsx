import { useVisitorTracking } from '@/hooks/useVisitorTracking';
import { useCaliforniaBlock } from '@/hooks/useCaliforniaBlock';

export const VisitorTracker = () => {
  // Initialize visitor tracking - will auto-track on mount
  useVisitorTracking();
  
  // Initialize California blocking
  useCaliforniaBlock();
  
  return null;
};
