import { useState } from "react";
import { motion } from "framer-motion";
import { User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LunaAvatar from "@/components/LunaAvatar";

interface NameInputStepProps {
  onComplete: (name: string) => void;
  onSkip: () => void;
}

const NameInputStep = ({ onComplete, onSkip }: NameInputStepProps) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col safe-area-top">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="flex items-center gap-3">
          <LunaAvatar size="sm" showGlow={false} />
          <span className="font-heading font-bold text-xl text-foreground">LUNA</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 flex flex-col items-center justify-center pb-10">
        <motion.div
          className="w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl gradient-luna flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
          >
            <User className="w-8 h-8 text-accent" />
          </motion.div>

          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            What should I call you?
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            This helps me personalize our conversations.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="text-center text-lg py-6 bg-card border-border focus:border-accent"
              maxLength={50}
              autoFocus
            />
          </motion.div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          className="mt-8 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="peach"
            size="lg"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full"
          >
            Continue
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>

        {/* Skip */}
        <motion.button
          className="mt-4 text-muted-foreground hover:text-accent text-sm transition-colors"
          onClick={onSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Skip for now
        </motion.button>
      </main>
    </div>
  );
};

export default NameInputStep;
