import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Root route handler - simple auth-based routing
 * 
 * Not logged in → Landing page
 * Logged in (new user) → Onboarding
 * Logged in (returning) → Chat
 */
export const AuthRedirect = () => {
  const { user, loading } = useAuth();
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
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error checking onboarding:", error);
          setOnboardingCompleted(false);
          return;
        }
        
        // If no profile exists, the trigger should have created one
        // But if it didn't, treat as not onboarded
        if (!profile) {
          setOnboardingCompleted(false);
          return;
        }
        
        setOnboardingCompleted(profile.onboarding_completed ?? false);
      } catch (err) {
        console.error("Error checking onboarding:", err);
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

  // Not logged in → show landing page
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  // Logged in but hasn't completed onboarding → go to onboarding
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Logged in and onboarding completed → go to chat
  return <Navigate to="/chat" replace />;
};
