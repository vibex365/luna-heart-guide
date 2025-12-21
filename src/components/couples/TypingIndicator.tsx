import { motion } from "framer-motion";

interface TypingIndicatorProps {
  partnerName: string;
}

export const TypingIndicator = ({ partnerName }: TypingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-3 py-2"
    >
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-muted">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-muted-foreground/50"
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
      <span className="text-xs text-muted-foreground">
        {partnerName} is typing...
      </span>
    </motion.div>
  );
};
