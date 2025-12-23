import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCapacitor } from "@/hooks/useCapacitor";
import { supabase } from "@/integrations/supabase/client";

/**
 * Root route handler - platform-aware routing
 * 
 * Desktop Web → Landing page (marketing site)
 * Mobile Web/PWA → Auth → Onboarding (new users) → App
 * Native App → Auth → Onboarding (new users) → App
 */
export const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const { isNative } = useCapacitor();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setOnboardingCompleted(null);
        return;
      }
      
      setCheckingOnboarding(true);
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single();
        
        setOnboardingCompleted(profile?.onboarding_completed ?? false);
      } catch {
        // If no profile exists, onboarding is not completed
        setOnboardingCompleted(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user]);

  // Show loading state
  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Desktop web users see the landing/marketing page
  if (!isMobile && !isNative) {
    return <Navigate to="/landing" replace />;
  }

  // Mobile web, PWA, or native app users get app flow
  // Not logged in → go to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but hasn't completed onboarding → go to onboarding
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Logged in and onboarding completed → go to chat (main app screen)
  return <Navigate to="/chat" replace />;
};
