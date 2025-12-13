import { motion } from "framer-motion";
import { Smartphone, QrCode, Heart } from "lucide-react";
import LunaAvatar from "./LunaAvatar";
import { Button } from "./ui/button";

const DesktopBlocker = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        className="max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Luna Avatar with glow effect */}
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <LunaAvatar size="xl" showGlow />
            <motion.div
              className="absolute -inset-4 rounded-full bg-accent/10 blur-xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="font-heading text-3xl font-bold text-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Luna is a Mobile Experience
        </motion.h1>

        <motion.p
          className="text-muted-foreground mb-8 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          For the best experience, please visit Luna on your mobile device. 
          It's designed to feel like an app in your pocket — always there when you need it.
        </motion.p>

        {/* Phone illustration */}
        <motion.div
          className="relative mx-auto w-48 h-80 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Phone frame */}
          <div className="absolute inset-0 bg-card rounded-[2.5rem] border-4 border-border shadow-2xl overflow-hidden">
            {/* Screen content preview */}
            <div className="absolute inset-2 bg-background rounded-[2rem] overflow-hidden">
              {/* Status bar */}
              <div className="h-6 bg-card/50 flex items-center justify-center">
                <div className="w-16 h-1 bg-foreground/20 rounded-full" />
              </div>
              
              {/* App preview */}
              <div className="p-4 flex flex-col items-center gap-3">
                <LunaAvatar size="sm" />
                <div className="text-xs font-medium text-foreground">Luna</div>
                
                {/* Chat bubbles preview */}
                <div className="w-full space-y-2">
                  <div className="bg-primary/20 rounded-lg px-3 py-2 ml-4">
                    <div className="h-2 w-20 bg-primary/40 rounded" />
                  </div>
                  <div className="bg-accent/20 rounded-lg px-3 py-2 mr-4">
                    <div className="h-2 w-16 bg-accent/40 rounded" />
                  </div>
                  <div className="bg-primary/20 rounded-lg px-3 py-2 ml-4">
                    <div className="h-2 w-24 bg-primary/40 rounded" />
                  </div>
                </div>
              </div>
              
              {/* Bottom nav preview */}
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-card/80 border-t border-border flex items-center justify-around px-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full ${i === 0 ? 'bg-accent' : 'bg-muted'}`} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Floating hearts */}
          <motion.div
            className="absolute -right-4 top-8"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart className="w-6 h-6 text-accent fill-accent/30" />
          </motion.div>
          <motion.div
            className="absolute -left-4 bottom-20"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            <Heart className="w-4 h-4 text-primary fill-primary/30" />
          </motion.div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Smartphone className="w-5 h-5" />
            <span>Open this URL on your phone</span>
          </div>

          {/* URL display */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm font-mono text-accent break-all">
              talkswithluna.com
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Or scan the QR code below with your phone's camera
          </p>

          {/* QR Code placeholder */}
          <div className="inline-flex items-center justify-center w-32 h-32 bg-card rounded-xl border border-border mx-auto">
            <QrCode className="w-16 h-16 text-muted-foreground" />
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="mt-8 text-sm text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Luna — Your pocket companion for emotional wellness 💜
        </motion.p>
      </motion.div>
    </div>
  );
};

export default DesktopBlocker;
