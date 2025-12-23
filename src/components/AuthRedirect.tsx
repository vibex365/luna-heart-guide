import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCapacitor } from "@/hooks/useCapacitor";
import Landing from "@/pages/Landing";

/**
 * Root route handler - platform-aware routing
 * 
 * Desktop Web → Landing page (marketing site)
 * Mobile Web/PWA → Auth → App experience
 * Native App → Auth → App experience
 */
export const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const { isNative } = useCapacitor();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Desktop web users see the landing/marketing page
  if (!isMobile && !isNative) {
    return <Landing />;
  }

  // Mobile web, PWA, or native app users get app flow
  // Not logged in → go to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in → go to chat (main app screen)
  return <Navigate to="/chat" replace />;
};
