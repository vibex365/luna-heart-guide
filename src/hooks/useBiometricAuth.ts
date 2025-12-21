import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

// Interface for native biometric plugin (would need to be installed separately)
interface BiometricResult {
  isAvailable: boolean;
  biometryType: "fingerprint" | "face" | "iris" | "none";
}

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string>("none");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Check if biometric auth is available
  useEffect(() => {
    const checkAvailability = async () => {
      if (Capacitor.isNativePlatform()) {
        // In a real implementation, you would check native biometric availability
        // For now, we'll simulate it being available on native platforms
        setIsAvailable(true);
        setBiometryType(Capacitor.getPlatform() === "ios" ? "face" : "fingerprint");
      }

      // Check if user has enabled biometric lock
      const enabled = localStorage.getItem("biometric_lock_enabled") === "true";
      setIsEnabled(enabled);
      
      // If enabled and app was backgrounded, show lock
      if (enabled) {
        const lastActive = localStorage.getItem("last_active_time");
        if (lastActive) {
          const timeDiff = Date.now() - parseInt(lastActive);
          // Lock if more than 1 minute has passed
          if (timeDiff > 60000) {
            setIsLocked(true);
          }
        }
      }
    };

    checkAvailability();
  }, []);

  // Track app activity
  useEffect(() => {
    const updateLastActive = () => {
      localStorage.setItem("last_active_time", Date.now().toString());
    };

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateLastActive();
      } else if (isEnabled) {
        const lastActive = localStorage.getItem("last_active_time");
        if (lastActive) {
          const timeDiff = Date.now() - parseInt(lastActive);
          if (timeDiff > 60000) {
            setIsLocked(true);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isEnabled]);

  const enableBiometricLock = useCallback(() => {
    localStorage.setItem("biometric_lock_enabled", "true");
    setIsEnabled(true);
  }, []);

  const disableBiometricLock = useCallback(() => {
    localStorage.setItem("biometric_lock_enabled", "false");
    setIsEnabled(false);
    setIsLocked(false);
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      // On web, just unlock (no biometric available)
      setIsLocked(false);
      return true;
    }

    try {
      // In a real implementation, this would call the native biometric plugin
      // For now, we'll simulate a successful authentication
      // You would use @capacitor-community/biometric-auth or similar
      
      // Simulated delay for "scanning"
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsLocked(false);
      localStorage.setItem("last_active_time", Date.now().toString());
      return true;
    } catch (error) {
      console.error("Biometric authentication failed:", error);
      return false;
    }
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    localStorage.setItem("last_active_time", Date.now().toString());
  }, []);

  return {
    isAvailable,
    biometryType,
    isEnabled,
    isLocked,
    enableBiometricLock,
    disableBiometricLock,
    authenticate,
    unlock,
  };
};
