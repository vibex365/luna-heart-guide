import { useCallback } from "react";

type HapticType = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

export function useHapticFeedback() {
  const trigger = useCallback((type: HapticType = "light") => {
    // Check if the Vibration API is supported
    if (!("vibrate" in navigator)) {
      return;
    }

    // Different vibration patterns for different feedback types
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      selection: 5,
      success: [10, 50, 10],
      warning: [20, 50, 20],
      error: [30, 50, 30, 50, 30],
    };

    try {
      navigator.vibrate(patterns[type]);
    } catch {
      // Silently fail if vibration is not supported
    }
  }, []);

  return { trigger };
}
