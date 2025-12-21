import { createContext, useContext, ReactNode } from "react";
import { useRateApp } from "@/hooks/useRateApp";

interface RateAppContextType {
  trackGameComplete: () => void;
  trackPositiveMood: () => void;
  trackStreakMilestone: (days: number) => void;
}

const RateAppContext = createContext<RateAppContextType | null>(null);

export const RateAppProvider = ({ children }: { children: ReactNode }) => {
  const { trackGameComplete, trackPositiveMood, trackStreakMilestone } = useRateApp();

  return (
    <RateAppContext.Provider
      value={{ trackGameComplete, trackPositiveMood, trackStreakMilestone }}
    >
      {children}
    </RateAppContext.Provider>
  );
};

export const useRateAppTracking = () => {
  const context = useContext(RateAppContext);
  if (!context) {
    // Return no-op functions if not wrapped in provider
    return {
      trackGameComplete: () => {},
      trackPositiveMood: () => {},
      trackStreakMilestone: () => {},
    };
  }
  return context;
};
