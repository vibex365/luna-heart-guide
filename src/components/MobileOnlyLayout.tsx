import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomTabBar } from "./BottomTabBar";
import DesktopBlocker from "./DesktopBlocker";
import SwipeableTabView from "./SwipeableTabView";
import PWAInstallBanner from "./PWAInstallBanner";

interface MobileOnlyLayoutProps {
  children: ReactNode;
  hideTabBar?: boolean;
}

const MobileOnlyLayout = ({ children, hideTabBar = false }: MobileOnlyLayoutProps) => {
  const isMobile = useIsMobile();

  // Show desktop blocker on non-mobile devices
  if (isMobile === undefined) {
    return null; // Loading state
  }

  if (!isMobile) {
    return <DesktopBlocker />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PWAInstallBanner />
      {!hideTabBar ? (
        <>
          <SwipeableTabView>
            <main className="flex-1 pb-20">
              {children}
            </main>
          </SwipeableTabView>
          <BottomTabBar />
        </>
      ) : (
        <main className="flex-1">
          {children}
        </main>
      )}
    </div>
  );
};

export default MobileOnlyLayout;
