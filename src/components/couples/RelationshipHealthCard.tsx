import { motion } from "framer-motion";
import { Heart, MessageCircle, Shield, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";

const scoreCategories = [
  { key: "communication_score", label: "Communication", icon: MessageCircle, color: "text-blue-500" },
  { key: "trust_score", label: "Trust", icon: Shield, color: "text-green-500" },
  { key: "intimacy_score", label: "Intimacy", icon: Heart, color: "text-pink-500" },
  { key: "conflict_resolution_score", label: "Conflict Resolution", icon: Sparkles, color: "text-purple-500" },
];

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Needs Work";
  return "Critical";
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
};

export const RelationshipHealthCard = () => {
  const { healthScore, isLoadingHealth } = useCouplesAccount();

  if (isLoadingHealth) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 mx-auto rounded-full bg-muted" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthScore) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Complete activities together to build your relationship health score
          </p>
        </CardContent>
      </Card>
    );
  }

  const overallScore = healthScore.overall_score;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Relationship Health
        </CardTitle>
        <CardDescription>Based on your shared activities and check-ins</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center py-4"
        >
          <div className={`w-24 h-24 rounded-full ${getScoreColor(overallScore)} bg-opacity-20 flex items-center justify-center border-4 ${getScoreColor(overallScore).replace('bg-', 'border-')}`}>
            <span className="text-3xl font-bold">{overallScore}</span>
          </div>
          <span className="mt-2 text-sm font-medium text-muted-foreground">
            {getScoreLabel(overallScore)}
          </span>
        </motion.div>

        {/* Category Scores */}
        <div className="space-y-4">
          {scoreCategories.map((category, index) => {
            const score = healthScore[category.key as keyof typeof healthScore] as number;
            const Icon = category.icon;
            
            return (
              <motion.div
                key={category.key}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${category.color}`} />
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{score}%</span>
                </div>
                <Progress value={score} className="h-2" />
              </motion.div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(healthScore.last_assessment_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
};
