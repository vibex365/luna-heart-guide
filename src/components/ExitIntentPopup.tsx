import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const COOLDOWN_KEY = 'exit_intent_popup_shown';
const COOLDOWN_HOURS = 24;

export const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const shouldShowPopup = useCallback((): boolean => {
    // Don't show on admin pages
    if (window.location.pathname.startsWith('/admin')) {
      return false;
    }

    // Check cooldown
    const lastShown = localStorage.getItem(COOLDOWN_KEY);
    if (lastShown) {
      const lastShownTime = parseInt(lastShown, 10);
      const hoursSinceShown = (Date.now() - lastShownTime) / (1000 * 60 * 60);
      if (hoursSinceShown < COOLDOWN_HOURS) {
        return false;
      }
    }

    return true;
  }, []);

  const handleExitIntent = useCallback((e: MouseEvent) => {
    // Only trigger when mouse moves toward top of browser
    if (e.clientY <= 5 && shouldShowPopup()) {
      setIsVisible(true);
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    }
  }, [shouldShowPopup]);

  useEffect(() => {
    document.addEventListener('mouseleave', handleExitIntent);
    
    return () => {
      document.removeEventListener('mouseleave', handleExitIntent);
    };
  }, [handleExitIntent]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCTA = () => {
    setIsVisible(false);
    navigate('/subscription');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md mx-4 relative overflow-hidden border-primary/20 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        
        <CardHeader className="text-center relative z-10 pb-2">
          <div className="text-4xl mb-2">💫</div>
          <CardTitle className="text-2xl font-bold">Wait! Before You Go...</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4 relative z-10">
          <p className="text-muted-foreground">
            You're just one step away from having your personal AI companion for mental wellness and relationship support.
          </p>
          
          <div className="bg-primary/10 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-primary">Special Offer Just For You!</p>
            <p className="text-sm text-muted-foreground">
              Get 7 days free when you sign up today. No credit card required.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleCTA} size="lg" className="w-full">
              Start Free Trial
            </Button>
            <Button onClick={handleClose} variant="ghost" size="sm">
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
