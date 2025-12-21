import { useState, useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

interface RateAppState {
  gamesCompleted: number;
  positiveMoodsLogged: number;
  streakDays: number;
  hasRated: boolean;
  lastPromptDate: string | null;
  dismissCount: number;
}

const STORAGE_KEY = "luna_rate_app_state";
const MIN_GAMES_FOR_PROMPT = 3;
const MIN_POSITIVE_MOODS = 5;
const MIN_STREAK_DAYS = 7;
const DAYS_BETWEEN_PROMPTS = 14;

const getInitialState = (): RateAppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid JSON, return default
    }
  }
  return {
    gamesCompleted: 0,
    positiveMoodsLogged: 0,
    streakDays: 0,
    hasRated: false,
    lastPromptDate: null,
    dismissCount: 0,
  };
};

export const useRateApp = () => {
  const [state, setState] = useState<RateAppState>(getInitialState);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check if we should show the prompt
  const checkShouldPrompt = useCallback(() => {
    if (state.hasRated) return false;
    if (state.dismissCount >= 3) return false; // Don't annoy users who dismissed 3 times

    // Check if enough time has passed since last prompt
    if (state.lastPromptDate) {
      const daysSinceLastPrompt = Math.floor(
        (Date.now() - new Date(state.lastPromptDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPrompt < DAYS_BETWEEN_PROMPTS) return false;
    }

    // Check if user has completed enough positive activities
    return (
      state.gamesCompleted >= MIN_GAMES_FOR_PROMPT ||
      state.positiveMoodsLogged >= MIN_POSITIVE_MOODS ||
      state.streakDays >= MIN_STREAK_DAYS
    );
  }, [state]);

  // Track game completion
  const trackGameComplete = useCallback(() => {
    setState((prev) => {
      const newState = { ...prev, gamesCompleted: prev.gamesCompleted + 1 };
      return newState;
    });
    
    // Check if we should show prompt after state update
    setTimeout(() => {
      if (checkShouldPrompt()) {
        setShouldShowPrompt(true);
      }
    }, 1000);
  }, [checkShouldPrompt]);

  // Track positive mood (mood level >= 4)
  const trackPositiveMood = useCallback(() => {
    setState((prev) => {
      const newState = { ...prev, positiveMoodsLogged: prev.positiveMoodsLogged + 1 };
      return newState;
    });

    setTimeout(() => {
      if (checkShouldPrompt()) {
        setShouldShowPrompt(true);
      }
    }, 1500);
  }, [checkShouldPrompt]);

  // Track streak milestone
  const trackStreakMilestone = useCallback((days: number) => {
    if (days >= MIN_STREAK_DAYS && days > state.streakDays) {
      setState((prev) => ({ ...prev, streakDays: days }));
      
      setTimeout(() => {
        if (checkShouldPrompt()) {
          setShouldShowPrompt(true);
        }
      }, 2000);
    }
  }, [state.streakDays, checkShouldPrompt]);

  // User rated the app
  const markAsRated = useCallback(() => {
    setState((prev) => ({ ...prev, hasRated: true }));
    setShouldShowPrompt(false);

    // Open app store based on platform
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      if (platform === "ios") {
        // Replace with your actual App Store ID
        window.open("https://apps.apple.com/app/idYOUR_APP_ID", "_blank");
      } else if (platform === "android") {
        // Replace with your actual package name
        window.open("https://play.google.com/store/apps/details?id=app.lovable.7bc1f449d14945db9d96d4adb7d018b3", "_blank");
      }
    }
  }, []);

  // User dismissed the prompt
  const dismissPrompt = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastPromptDate: new Date().toISOString(),
      dismissCount: prev.dismissCount + 1,
    }));
    setShouldShowPrompt(false);
  }, []);

  // User selected "Ask later"
  const askLater = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastPromptDate: new Date().toISOString(),
    }));
    setShouldShowPrompt(false);
  }, []);

  return {
    shouldShowPrompt,
    trackGameComplete,
    trackPositiveMood,
    trackStreakMilestone,
    markAsRated,
    dismissPrompt,
    askLater,
    state,
  };
};
