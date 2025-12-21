import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  BookOpen, 
  Wind, 
  Heart, 
  TrendingUp,
  Flame,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  CloudSun
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LunaAvatar from "@/components/LunaAvatar";
import DesktopAppLayout from "@/components/desktop/DesktopAppLayout";

const DesktopDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Sun };
    if (hour < 17) return { text: "Good afternoon", icon: CloudSun };
    return { text: "Good evening", icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const displayName = user?.email?.split("@")[0] || "there";

  // Fetch streak data
  const { data: streakData } = useQuery({
    queryKey: ["user-streak", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("mood_entries")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      
      // Calculate streak
      let streak = 0;
      if (data && data.length > 0) {
        const today = new Date().toDateString();
        const lastEntry = new Date(data[0].created_at).toDateString();
        if (lastEntry === today) {
          streak = 1;
          for (let i = 1; i < data.length; i++) {
            const prevDate = new Date(data[i - 1].created_at);
            const currDate = new Date(data[i].created_at);
            const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }
        }
      }
      return { streak };
    },
    enabled: !!user,
  });

  // Fetch recent mood
  const { data: recentMood } = useQuery({
    queryKey: ["recent-mood", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("mood_entries")
        .select("mood_label, mood_level, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const quickActions = [
    { 
      icon: MessageCircle, 
      label: "Chat with Luna", 
      description: "Start a conversation",
      to: "/chat",
      gradient: "from-accent/20 to-primary/10",
      iconColor: "text-accent"
    },
    { 
      icon: TrendingUp, 
      label: "Log Mood", 
      description: "Track how you feel",
      to: "/mood",
      gradient: "from-primary/20 to-secondary/10",
      iconColor: "text-primary-foreground"
    },
    { 
      icon: BookOpen, 
      label: "Journal", 
      description: "Write your thoughts",
      to: "/journal",
      gradient: "from-secondary/20 to-muted/20",
      iconColor: "text-secondary-foreground"
    },
    { 
      icon: Wind, 
      label: "Breathe", 
      description: "Relax and unwind",
      to: "/breathe",
      gradient: "from-peach/20 to-accent/10",
      iconColor: "text-peach-foreground"
    },
    { 
      icon: Heart, 
      label: "Couples", 
      description: "Connect together",
      to: "/couples",
      gradient: "from-accent/20 to-peach/10",
      iconColor: "text-accent"
    },
  ];

  return (
    <DesktopAppLayout showContextPanel>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Hero Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/15 via-primary/10 to-peach/15 p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <GreetingIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{greeting.text}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
                Welcome back, {displayName}!
              </h1>
              <p className="text-muted-foreground max-w-lg">
                How are you feeling today? Luna is here to support your wellness journey.
              </p>
              
              <div className="flex flex-wrap gap-3 mt-6">
                {streakData?.streak && streakData.streak > 0 && (
                  <Badge className="bg-accent/20 text-accent border-0 py-1.5 px-3">
                    <Flame className="w-4 h-4 mr-1" />
                    {streakData.streak} day streak
                  </Badge>
                )}
                {recentMood && (
                  <Badge variant="secondary" className="py-1.5 px-3">
                    Last mood: {recentMood.mood_label}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="hidden md:block">
              <LunaAvatar size="lg" />
            </div>
          </div>
        </motion.div>

        {/* Daily Affirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/20">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Today's Affirmation
                  </p>
                  <p className="text-lg font-medium text-foreground leading-relaxed">
                    "You are capable of creating positive change in your life. Every small step forward is progress worth celebrating."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.to}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                >
                  <Card 
                    className={`group cursor-pointer hover:shadow-romantic transition-all duration-300 bg-gradient-to-br ${action.gradient} border-0`}
                    onClick={() => navigate(action.to)}
                  >
                    <CardContent className="p-5 text-center">
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-background/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon className={`w-6 h-6 ${action.iconColor}`} />
                      </div>
                      <h3 className="font-medium text-sm mb-1">{action.label}</h3>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Continue Where You Left Off */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading">Continue with Luna</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto hover:bg-accent/10 rounded-xl"
                onClick={() => navigate("/chat")}
              >
                <div className="flex items-center gap-4">
                  <LunaAvatar size="sm" />
                  <div className="text-left">
                    <p className="font-medium">Start a new conversation</p>
                    <p className="text-sm text-muted-foreground">Luna is ready to listen</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DesktopAppLayout>
  );
};

export default DesktopDashboard;
