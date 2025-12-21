import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const useDeepLinks = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleDeepLink = useCallback((url: string) => {
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      const params = parsedUrl.searchParams;

      console.log("Deep link received:", url);

      // Handle partner invite codes
      // e.g., luna://invite?code=ABC123 or https://lunaapp.com/invite?code=ABC123
      if (path.includes("invite") || params.has("invite")) {
        const inviteCode = params.get("code") || params.get("invite");
        if (inviteCode) {
          // Store invite code and navigate to couples page
          localStorage.setItem("pending_invite_code", inviteCode);
          navigate("/couples", { state: { inviteCode } });
          return;
        }
      }

      // Handle couples path directly
      if (path === "/couples" || path.includes("/couples")) {
        navigate("/couples");
        return;
      }

      // Handle other paths
      if (path && path !== "/") {
        navigate(path);
      }
    } catch (error) {
      console.error("Error handling deep link:", error);
    }
  }, [navigate]);

  useEffect(() => {
    // Dynamically import Capacitor to avoid issues during SSR/initial load
    const setupCapacitorListeners = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        
        if (Capacitor.isNativePlatform()) {
          const { App } = await import("@capacitor/app");
          
          // Listen for app URL open events
          App.addListener("appUrlOpen", (event) => {
            handleDeepLink(event.url);
          });

          // Check if app was opened with a URL (cold start)
          const result = await App.getLaunchUrl();
          if (result?.url) {
            handleDeepLink(result.url);
          }
        }
      } catch (error) {
        // Capacitor not available (web environment without native)
        console.log("Capacitor not available for deep links");
      }
    };

    setupCapacitorListeners();

    // Handle web deep links (query params)
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get("invite") || urlParams.get("code");
    if (inviteCode && location.pathname !== "/couples") {
      localStorage.setItem("pending_invite_code", inviteCode);
      navigate("/couples", { state: { inviteCode } });
    }

    return () => {
      // Cleanup listeners
      import("@capacitor/core").then(({ Capacitor }) => {
        if (Capacitor.isNativePlatform()) {
          import("@capacitor/app").then(({ App }) => {
            App.removeAllListeners();
          });
        }
      }).catch(() => {
        // Ignore cleanup errors
      });
    };
  }, [navigate, location.pathname, handleDeepLink]);
};

export default useDeepLinks;
