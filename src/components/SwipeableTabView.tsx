import { ReactNode, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

interface SwipeableTabViewProps {
  children: ReactNode;
}

const TAB_ROUTES = ["/chat", "/mood", "/journal", "/breathe", "/profile"];

const SwipeableTabView = ({ children }: SwipeableTabViewProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [direction, setDirection] = useState(0);

  const currentIndex = TAB_ROUTES.indexOf(location.pathname);
  
  // If not on a tab route, don't enable swiping
  if (currentIndex === -1) {
    return <>{children}</>;
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset > threshold || velocity > 500) {
      // Swipe right - go to previous tab
      if (currentIndex > 0) {
        setDirection(-1);
        navigate(TAB_ROUTES[currentIndex - 1]);
      }
    } else if (offset < -threshold || velocity < -500) {
      // Swipe left - go to next tab
      if (currentIndex < TAB_ROUTES.length - 1) {
        setDirection(1);
        navigate(TAB_ROUTES[currentIndex + 1]);
      }
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <motion.div
      className="flex-1 overflow-hidden"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default SwipeableTabView;
