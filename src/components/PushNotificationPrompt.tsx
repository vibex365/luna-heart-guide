import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PROMPT_DELAY = 10000; // 10 seconds delay
const COOLDOWN_KEY = 'push_prompt_cooldown';
const COOLDOWN_DAYS = 7;

export const PushNotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { user } = useAuth();
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();

  useEffect(() => {
    // Don't show if not supported, already subscribed, or not logged in
    if (!isSupported || isSubscribed || !user) return;

    // Check cooldown
    const lastPrompt = localStorage.getItem(COOLDOWN_KEY);
    if (lastPrompt) {
      const daysSincePrompt = (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24);
      if (daysSincePrompt < COOLDOWN_DAYS) return;
    }

    // Show after delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, PROMPT_DELAY);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, user]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Push notifications enabled!');
    } else {
      toast.error('Failed to enable notifications. Please check browser settings.');
    }
    handleClose();
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Stay Connected with Luna
          </DialogTitle>
          <DialogDescription>
            Get personalized reminders, daily affirmations, and important updates delivered right to your device.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✨ Daily wellness check-in reminders</p>
            <p>💝 Couple activity suggestions</p>
            <p>🔔 Important updates when you're away</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleEnable} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
