import { useVisitorTracking } from '@/hooks/useVisitorTracking';
import { useCaliforniaBlock } from '@/hooks/useCaliforniaBlock';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';
import { RetargetingPopup } from '@/components/RetargetingPopup';
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
import { AutoEventTracker } from '@/components/AutoEventTracker';

export const VisitorTracker = () => {
  // Initialize visitor tracking - will auto-track on mount
  useVisitorTracking();
  
  // Initialize California blocking
  useCaliforniaBlock();
  
  return (
    <>
      <AutoEventTracker />
      <ExitIntentPopup />
      <RetargetingPopup />
      <PushNotificationPrompt />
    </>
  );
};
