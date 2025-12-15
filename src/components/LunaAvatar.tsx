import { motion } from "framer-motion";

interface LunaAvatarProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showGlow?: boolean;
  isTyping?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

const LunaAvatar = ({ size = "md", showGlow = true, isTyping = false, className = "" }: LunaAvatarProps) => {
  return (
    <div className={`relative ${className}`}>
      {(showGlow || isTyping) && (
        <motion.div
          className={`absolute inset-0 rounded-full bg-luna-glow/40 blur-xl ${sizeClasses[size]}`}
          animate={isTyping ? {
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          } : {
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: isTyping ? 1.5 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-full gradient-luna flex items-center justify-center shadow-luna`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={isTyping ? { 
          scale: [1, 1.05, 1],
          opacity: 1 
        } : { 
          scale: 1, 
          opacity: 1 
        }}
        transition={isTyping ? {
          scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.5, ease: "easeOut" }
        } : { 
          duration: 0.5, 
          ease: "easeOut" 
        }}
      >
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-secondary/80 to-primary/60 flex items-center justify-center overflow-hidden">
          {isTyping ? (
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 bg-accent rounded-full"
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          ) : (
            <span className="text-accent font-heading font-bold" style={{ fontSize: size === "xl" ? "2rem" : size === "lg" ? "1.25rem" : size === "xs" ? "0.5rem" : "0.875rem" }}>
              L
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LunaAvatar;
