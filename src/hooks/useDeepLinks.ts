import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App, URLOpenListenerEvent } from "@capacitor/app";

export const useDeepLinks = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle deep links when app is opened from a URL
    const handleDeepLink = (event: URLOpenListenerEvent) => {
      const url = new URL(event.url);
      const path = url.pathname;
      const params = url.searchParams;

      console.log("Deep link received:", event.url);

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
    };

    // Only set up listeners on native platforms
    if (Capacitor.isNativePlatform()) {
      // Listen for app URL open events
      App.addListener("appUrlOpen", handleDeepLink);

      // Check if app was opened with a URL (cold start)
      App.getLaunchUrl().then((result) => {
        if (result?.url) {
          handleDeepLink({ url: result.url });
        }
      });
    }

    // Handle web deep links (query params)
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get("invite") || urlParams.get("code");
    if (inviteCode && location.pathname !== "/couples") {
      localStorage.setItem("pending_invite_code", inviteCode);
      navigate("/couples", { state: { inviteCode } });
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        App.removeAllListeners();
      }
    };
  }, [navigate, location.pathname]);
};

export default useDeepLinks;
