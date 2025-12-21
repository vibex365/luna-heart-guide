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
  xl: "w-32 h-32"
};
const LunaAvatar = ({
  size = "md",
  showGlow = true,
  isTyping = false,
  className = ""
}: LunaAvatarProps) => {
  return <div className={`relative ${className}`}>
      {(showGlow || isTyping) && <motion.div className={`absolute inset-0 rounded-full bg-luna-glow/40 blur-xl ${sizeClasses[size]}`} animate={isTyping ? {
      scale: [1, 1.3, 1],
      opacity: [0.5, 0.8, 0.5]
    } : {
      scale: [1, 1.2, 1],
      opacity: [0.4, 0.6, 0.4]
    }} transition={{
      duration: isTyping ? 1.5 : 3,
      repeat: Infinity,
      ease: "easeInOut"
    }} />}
      
    </div>;
};
export default LunaAvatar;