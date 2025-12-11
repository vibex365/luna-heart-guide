import { motion } from "framer-motion";

interface LunaAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  showGlow?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

const LunaAvatar = ({ size = "md", showGlow = true, className = "" }: LunaAvatarProps) => {
  return (
    <div className={`relative ${className}`}>
      {showGlow && (
        <motion.div
          className={`absolute inset-0 rounded-full bg-luna-glow/40 blur-xl ${sizeClasses[size]}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-full gradient-luna flex items-center justify-center shadow-luna`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-secondary/80 to-primary/60 flex items-center justify-center">
          <span className="text-accent font-heading font-bold" style={{ fontSize: size === "xl" ? "2rem" : size === "lg" ? "1.25rem" : "0.875rem" }}>
            L
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default LunaAvatar;
