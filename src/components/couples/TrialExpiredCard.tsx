import { Clock, Heart, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface TrialExpiredCardProps {
  featuresUsed?: string[];
}

export const TrialExpiredCard = ({ featuresUsed = [] }: TrialExpiredCardProps) => {
  return (
    <Card className="overflow-hidden border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5">
      <CardContent className="p-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4"
          >
            <Clock className="w-8 h-8 text-orange-500" />
          </motion.div>

          <h3 className="text-xl font-bold">Your Trial Has Ended</h3>
          <p className="text-sm text-muted-foreground mt-2">
            We hope you enjoyed exploring couples features!
          </p>

          {featuresUsed.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">
                You tried {featuresUsed.length} feature{featuresUsed.length !== 1 ? "s" : ""}:
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {featuresUsed.slice(0, 5).map((feature) => (
                  <span
                    key={feature}
                    className="px-2 py-0.5 text-[10px] rounded-full bg-pink-500/10 text-pink-500"
                  >
                    {feature}
                  </span>
                ))}
                {featuresUsed.length > 5 && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-muted">
                    +{featuresUsed.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Link to="/subscription">
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                <Heart className="w-4 h-4 mr-2" />
                Upgrade to Couples Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-pink-500" />
              <span>Upgrade now and continue your journey together</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
