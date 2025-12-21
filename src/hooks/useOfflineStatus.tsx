import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline) {
        toast.success("You're back online!", {
          description: "Your data will sync automatically.",
        });
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      toast.warning("You're offline", {
        description: "Some features may be limited.",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  return { isOffline, wasOffline };
};
