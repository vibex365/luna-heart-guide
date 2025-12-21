import { motion } from "framer-motion";
import { DigitalGift } from "@/hooks/useGiftStore";

interface GiftCardProps {
  gift: DigitalGift;
  onSelect: () => void;
}

export const GiftCard = ({ gift, onSelect }: GiftCardProps) => {
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'romantic':
        return 'from-rose-500/20 to-pink-500/20';
      case 'sweet':
        return 'from-amber-500/20 to-orange-500/20';
      case 'magical':
        return 'from-indigo-500/20 to-purple-500/20';
      case 'luxury':
        return 'from-cyan-500/20 to-blue-500/20';
      case 'celebration':
        return 'from-yellow-500/20 to-red-500/20';
      default:
        return 'from-gray-500/20 to-gray-400/20';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        relative p-4 rounded-xl border border-border
        bg-gradient-to-br ${getCategoryGradient(gift.category)}
        hover:border-rose-500/50 transition-all duration-200
        flex flex-col items-center gap-2 text-center
        group overflow-hidden
      `}
    >
      {/* Sparkle effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-pulse" />
        <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-100" />
        <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-200" />
      </div>

      {/* Gift Icon */}
      <motion.span 
        className="text-4xl"
        animate={{ 
          y: [0, -2, 0],
          rotate: [-2, 2, -2]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {gift.icon}
      </motion.span>

      {/* Gift Name */}
      <h4 className="font-medium text-sm text-foreground line-clamp-1">
        {gift.name}
      </h4>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2">
        {gift.description}
      </p>

      {/* Price Badge */}
      <div className="mt-auto pt-2">
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
          {formatPrice(gift.price_cents)}
        </span>
      </div>
    </motion.button>
  );
};
