import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Heart, MessageCircle, Shield, Repeat, Sparkles, Brain, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ModuleStats {
  module: string;
  count: number;
  percentage: number;
}

const moduleInfo: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  communication_coaching: { label: "Communication Coaching", icon: MessageCircle, color: "bg-blue-500" },
  conflict_deescalation: { label: "Conflict Deescalation", icon: Shield, color: "bg-orange-500" },
  breakup_healing: { label: "Breakup & Healing", icon: Heart, color: "bg-pink-500" },
  boundary_building: { label: "Boundary Building", icon: Shield, color: "bg-purple-500" },
  pattern_spotting: { label: "Pattern Spotting", icon: Repeat, color: "bg-yellow-500" },
  self_worth: { label: "Self-Worth", icon: Sparkles, color: "bg-emerald-500" },
  emotional_mirror: { label: "Emotional Mirror", icon: Brain, color: "bg-cyan-500" },
  general_support: { label: "General Support", icon: HelpCircle, color: "bg-muted-foreground" },
};

const ConversationAnalytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ModuleStats[]>([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("conversation_analytics")
        .select("module_activated")
        .eq("user_id", user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setTotalConversations(data.length);

        // Count modules
        const moduleCounts: Record<string, number> = {};
        data.forEach((row) => {
          const module = row.module_activated;
          moduleCounts[module] = (moduleCounts[module] || 0) + 1;
        });

        // Convert to array and calculate percentages
        const statsArray: ModuleStats[] = Object.entries(moduleCounts)
          .map(([module, count]) => ({
            module,
            count,
            percentage: Math.round((count / data.length) * 100),
          }))
          .sort((a, b) => b.count - a.count);

        setStats(statsArray);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="text-center p-6">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          Start chatting with Luna to see your conversation insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          Conversation Insights
        </h3>
        <span className="text-xs text-muted-foreground">
          {totalConversations} messages analyzed
        </span>
      </div>

      <div className="space-y-3">
        {stats.slice(0, 5).map((stat, index) => {
          const info = moduleInfo[stat.module] || moduleInfo.general_support;
          const Icon = info.icon;

          return (
            <motion.div
              key={stat.module}
              className="space-y-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{info.label}</span>
                </div>
                <span className="text-muted-foreground">{stat.count}x</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${info.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {stats.length > 0 && (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          Your top focus: <span className="text-accent font-medium">{moduleInfo[stats[0].module]?.label || "General Support"}</span>
        </p>
      )}
    </div>
  );
};

export default ConversationAnalytics;
