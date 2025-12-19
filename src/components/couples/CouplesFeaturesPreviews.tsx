import { Heart, MessageCircle, Trophy, Users, Flame, Calendar, Target, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { LockedFeaturePreview } from "./LockedFeaturePreview";

interface CouplesFeaturePreviewsProps {
  onStartTrial: () => void;
  onUpgrade: () => void;
  canStartTrial: boolean;
  isStartingTrial: boolean;
}

const features = [
  {
    id: "would-you-rather",
    title: "Would You Rather",
    description: "Fun questions to learn more about each other's preferences",
    icon: <Flame className="w-5 h-5 text-pink-500" />,
  },
  {
    id: "shared-mood",
    title: "Shared Mood Tracking",
    description: "See how you and your partner are feeling each day",
    icon: <Heart className="w-5 h-5 text-pink-500" />,
  },
  {
    id: "private-chat",
    title: "Private Chat",
    description: "Send text, voice, and video messages to your partner",
    icon: <MessageCircle className="w-5 h-5 text-pink-500" />,
  },
  {
    id: "couples-games",
    title: "Couples Games",
    description: "Truth or Dare, Quiz Game, and more fun activities",
    icon: <Trophy className="w-5 h-5 text-pink-500" />,
  },
  {
    id: "relationship-health",
    title: "Relationship Health Score",
    description: "Track and improve your relationship with assessments",
    icon: <Users className="w-5 h-5 text-pink-500" />,
  },
  {
    id: "date-nights",
    title: "Date Night Generator",
    description: "AI-powered date ideas customized for you both",
    icon: <Calendar className="w-5 h-5 text-pink-500" />,
  },
  {
    id: "couple-goals",
    title: "Shared Goals",
    description: "Set and track goals together as a couple",
    icon: <Target className="w-5 h-5 text-pink-500" />,
  },
  {
    id: "love-language",
    title: "Love Language Quiz",
    description: "Discover how you and your partner express love",
    icon: <Sparkles className="w-5 h-5 text-pink-500" />,
  },
];

export const CouplesFeaturePreviews = ({
  onStartTrial,
  onUpgrade,
  canStartTrial,
  isStartingTrial,
}: CouplesFeaturePreviewsProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold">Explore Couples Features</h2>
        <p className="text-sm text-muted-foreground">
          {canStartTrial 
            ? "Try all features free for 3 days" 
            : "Upgrade to unlock all couples features"
          }
        </p>
      </div>

      <div className="grid gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <LockedFeaturePreview
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              onStartTrial={onStartTrial}
              onUpgrade={onUpgrade}
              canStartTrial={canStartTrial}
              isStartingTrial={isStartingTrial}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
