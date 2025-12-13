import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import LunaAvatar from "@/components/LunaAvatar";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <MobileOnlyLayout hideTabBar>
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-6 safe-area-top">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <LunaAvatar size="lg" className="mx-auto mb-6" />
          <h1 className="font-heading text-6xl font-bold text-foreground mb-2">404</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Oops! This page doesn't exist.
          </p>
          <Button variant="peach" size="lg" onClick={() => navigate("/")}>
            Return Home
          </Button>
        </motion.div>
      </div>
    </MobileOnlyLayout>
  );
};

export default NotFound;
