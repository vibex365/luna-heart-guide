import { useState, useEffect, useCallback } from 'react';
import { X, Heart, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const COOLDOWN_KEY = 'retarget_popup_shown';
const COOLDOWN_HOURS = 24;
const RETURNING_VISITOR_KEY = 'luna_returning_visitor';
const FIRST_VISIT_KEY = 'luna_first_visit';

type PopupType = 'returning' | 'engaged' | 'welcome' | null;

export const RetargetingPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [popupType, setPopupType] = useState<PopupType>(null);
  const [buttonClicks, setButtonClicks] = useState(0);
  const navigate = useNavigate();

  const checkCooldown = useCallback((): boolean => {
    const lastShown = localStorage.getItem(COOLDOWN_KEY);
    if (lastShown) {
      const lastShownTime = parseInt(lastShown, 10);
      const hoursSinceShown = (Date.now() - lastShownTime) / (1000 * 60 * 60);
      return hoursSinceShown >= COOLDOWN_HOURS;
    }
    return true;
  }, []);

  const fetchUserActivity = useCallback(async () => {
    // Don't show on admin pages
    if (window.location.pathname.startsWith('/admin')) {
      return;
    }

    if (!checkCooldown()) {
      return;
    }

    const sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) return;

    try {
      // Check for past activity
      const { data: events } = await supabase
        .from('tracking_events' as any)
        .select('event_type, event_name')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);

      const clickCount = (events as any[])?.filter(e => e.event_type === 'button_click').length || 0;
      setButtonClicks(clickCount);

      // Check if returning visitor
      const isReturning = localStorage.getItem(RETURNING_VISITOR_KEY) === 'true';
      const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);

      // Determine popup type
      if (clickCount >= 3) {
        // Engaged visitor
        setPopupType('engaged');
        setTimeout(() => {
          setIsVisible(true);
          localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
        }, 5000); // Show after 5 seconds
      } else if (isReturning) {
        // Returning visitor
        setPopupType('returning');
        setTimeout(() => {
          setIsVisible(true);
          localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
        }, 3000); // Show after 3 seconds
      } else if (!firstVisit) {
        // First-time visitor
        localStorage.setItem(FIRST_VISIT_KEY, Date.now().toString());
        setPopupType('welcome');
        setTimeout(() => {
          setIsVisible(true);
          localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
        }, 15000); // Show after 15 seconds
      }

      // Mark as returning for next visit
      localStorage.setItem(RETURNING_VISITOR_KEY, 'true');
    } catch (error) {
      console.error('[RetargetingPopup] Error fetching activity:', error);
    }
  }, [checkCooldown]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUserActivity();
    }, 2000); // Wait 2 seconds before checking

    return () => clearTimeout(timer);
  }, [fetchUserActivity]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCTA = () => {
    setIsVisible(false);
    if (popupType === 'engaged') {
      navigate('/subscription');
    } else {
      navigate('/chat');
    }
  };

  if (!isVisible || !popupType) return null;

  const popupContent = {
    returning: {
      icon: <Heart className="h-8 w-8 text-pink-500" />,
      emoji: '👋',
      title: 'Welcome Back!',
      message: "We're glad to see you again. Luna has been thinking about you.",
      cta: 'Continue Your Journey',
      subtext: 'Pick up where you left off'
    },
    engaged: {
      icon: <Sparkles className="h-8 w-8 text-amber-500" />,
      emoji: '✨',
      title: 'You\'re Really Getting Into This!',
      message: 'We love your enthusiasm! Ready to unlock the full Luna experience?',
      cta: 'Explore Premium',
      subtext: 'Get unlimited access to all features'
    },
    welcome: {
      icon: <Clock className="h-8 w-8 text-blue-500" />,
      emoji: '🌙',
      title: 'Welcome to Luna',
      message: 'Your personal AI companion for mental wellness and relationship support is here.',
      cta: 'Start Chatting',
      subtext: 'Free to get started'
    }
  };

  const content = popupContent[popupType];

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
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              {content.icon}
            </div>
          </div>
          <div className="text-3xl mb-1">{content.emoji}</div>
          <CardTitle className="text-2xl font-bold">{content.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4 relative z-10">
          <p className="text-muted-foreground">
            {content.message}
          </p>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleCTA} size="lg" className="w-full">
              {content.cta}
            </Button>
            <p className="text-xs text-muted-foreground">{content.subtext}</p>
            <Button onClick={handleClose} variant="ghost" size="sm">
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
