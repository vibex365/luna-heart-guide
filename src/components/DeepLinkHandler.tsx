import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const DeepLinkHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const handleDeepLink = (url: string) => {
      try {
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname;
        const params = parsedUrl.searchParams;

        console.log("Deep link received:", url);

        // Handle partner invite codes
        if (path.includes("invite") || params.has("invite")) {
          const inviteCode = params.get("code") || params.get("invite");
          if (inviteCode) {
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
    };

    // Dynamically import Capacitor
    const setupCapacitorListeners = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        
        if (Capacitor.isNativePlatform()) {
          const { App } = await import("@capacitor/app");
          
          App.addListener("appUrlOpen", (event) => {
            handleDeepLink(event.url);
          });

          const result = await App.getLaunchUrl();
          if (result?.url) {
            handleDeepLink(result.url);
          }
        }
      } catch (error) {
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
      import("@capacitor/core").then(({ Capacitor }) => {
        if (Capacitor.isNativePlatform()) {
          import("@capacitor/app").then(({ App }) => {
            App.removeAllListeners();
          });
        }
      }).catch(() => {});
    };
  }, [navigate, location.pathname, isInitialized]);

  return null;
};
