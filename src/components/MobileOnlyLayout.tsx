import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomTabBar } from "./BottomTabBar";
import DesktopLayout from "./DesktopLayout";
import SwipeableTabView from "./SwipeableTabView";
import OfflineIndicator from "./OfflineIndicator";

interface MobileOnlyLayoutProps {
  children: ReactNode;
  hideTabBar?: boolean;
}

const MobileOnlyLayout = ({ children, hideTabBar = false }: MobileOnlyLayoutProps) => {
  const isMobile = useIsMobile();

  // Loading state
  if (isMobile === undefined) {
    return null;
  }

  // Desktop users get the desktop layout with banner
  if (!isMobile) {
    return <DesktopLayout>{children}</DesktopLayout>;
  }

  // Mobile users get the original mobile-first experience
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineIndicator />
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
