import { useVisitorTracking } from '@/hooks/useVisitorTracking';
import { useCaliforniaBlock } from '@/hooks/useCaliforniaBlock';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';
import { RetargetingPopup } from '@/components/RetargetingPopup';

export const VisitorTracker = () => {
  // Initialize visitor tracking - will auto-track on mount
  useVisitorTracking();
  
  // Initialize California blocking
  useCaliforniaBlock();
  
  return (
    <>
      <ExitIntentPopup />
      <RetargetingPopup />
    </>
  );
};
