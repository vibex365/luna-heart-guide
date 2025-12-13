import { motion } from "framer-motion";
import { Heart, MessageCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LunaAvatar from "@/components/LunaAvatar";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-funnel-gradient text-white flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="funnel-glow absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-sm mx-auto"
      >
        {/* Avatar with animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <LunaAvatar size="lg" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-funnel-accent rounded-full flex items-center justify-center"
            >
              <Heart className="w-4 h-4 text-black fill-black" />
            </motion.div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold mb-4"
        >
          You're not alone anymore 🤍
        </motion.h1>

        {/* Copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/70 text-lg mb-12"
        >
          Welcome to Luna.<br />
          Your space to talk, process, and heal starts now.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <Button
            onClick={() => navigate("/chat")}
            className="w-full h-14 text-lg font-semibold bg-funnel-accent hover:bg-funnel-accent/90 text-black rounded-full shadow-lg shadow-funnel-accent/30"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Start chatting with Luna
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open("https://instagram.com/luna", "_blank")}
            className="w-full h-12 font-medium bg-transparent border-white/20 text-white hover:bg-white/10 rounded-full"
          >
            <Instagram className="w-4 h-4 mr-2" />
            Follow us for daily healing reminders
          </Button>
        </motion.div>

        {/* Subtle footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/40 text-xs mt-12"
        >
          Your journey to clarity begins here
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Welcome;
