import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageCircle, 
  Heart, 
  TrendingUp, 
  Brain, 
  Activity,
  UserCheck,
  BarChart3
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const GENDER_COLORS = {
  male: "hsl(var(--chart-1))",
  female: "hsl(var(--chart-2))",
  "non-binary": "hsl(var(--chart-3))",
  "prefer-not-to-say": "hsl(var(--chart-4))",
  unknown: "hsl(var(--muted))",
};

const ORIENTATION_COLORS = {
  straight: "hsl(var(--chart-1))",
  gay: "hsl(var(--chart-2))",
  lesbian: "hsl(var(--chart-3))",
  bisexual: "hsl(var(--chart-4))",
  pansexual: "hsl(var(--chart-5))",
  asexual: "hsl(var(--accent))",
  "prefer-not-to-say": "hsl(var(--muted))",
  unknown: "hsl(var(--muted-foreground))",
};

const MODULE_LABELS: Record<string, string> = {
  communication_coaching: "Communication",
  conflict_deescalation: "Conflict Resolution",
  emotional_mirror: "Emotional Processing",
  pattern_spotting: "Pattern Recognition",
  boundary_building: "Boundary Setting",
  breakup_healing: "Healing & Recovery",
  self_worth: "Self-Worth",
  general_support: "General Support",
};

export const GenderAnalyticsDashboard = () => {
  // Fetch user demographics
  const { data: demographics, isLoading: demographicsLoading } = useQuery({
    queryKey: ["gender-demographics"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("gender, sexual_orientation, user_id");
      
      if (error) throw error;

      const genderCounts: Record<string, number> = {};
      const orientationCounts: Record<string, number> = {};
      
      profiles?.forEach((p) => {
        const gender = p.gender || "unknown";
        const orientation = p.sexual_orientation || "unknown";
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        orientationCounts[orientation] = (orientationCounts[orientation] || 0) + 1;
      });

      return {
        total: profiles?.length || 0,
        genderCounts,
        orientationCounts,
        genderData: Object.entries(genderCounts).map(([name, value]) => ({ 
          name: name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
          value,
          fill: GENDER_COLORS[name as keyof typeof GENDER_COLORS] || GENDER_COLORS.unknown
        })),
        orientationData: Object.entries(orientationCounts).map(([name, value]) => ({
          name: name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          value,
          fill: ORIENTATION_COLORS[name as keyof typeof ORIENTATION_COLORS] || ORIENTATION_COLORS.unknown
        })),
      };
    },
  });

  // Fetch module usage by gender
  const { data: moduleUsage, isLoading: moduleLoading } = useQuery({
    queryKey: ["module-usage-by-gender"],
    queryFn: async () => {
      // Get analytics with user IDs
      const { data: analytics, error: analyticsError } = await supabase
        .from("conversation_analytics")
        .select("module_activated, user_id");
      
      if (analyticsError) throw analyticsError;

      // Get profiles with gender
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, gender");
      
      if (profilesError) throw profilesError;

      // Create user -> gender map
      const userGenderMap = new Map<string, string>();
      profiles?.forEach((p) => {
        userGenderMap.set(p.user_id, p.gender || "unknown");
      });

      // Aggregate by module and gender
      const moduleGenderStats: Record<string, Record<string, number>> = {};
      
      analytics?.forEach((a) => {
        const module = a.module_activated;
        const gender = userGenderMap.get(a.user_id) || "unknown";
        
        if (!moduleGenderStats[module]) {
          moduleGenderStats[module] = {};
        }
        moduleGenderStats[module][gender] = (moduleGenderStats[module][gender] || 0) + 1;
      });

      // Format for chart
      return Object.entries(moduleGenderStats).map(([module, genderCounts]) => ({
        module: MODULE_LABELS[module] || module,
        male: genderCounts.male || 0,
        female: genderCounts.female || 0,
        "non-binary": genderCounts["non-binary"] || 0,
        "prefer-not-to-say": genderCounts["prefer-not-to-say"] || 0,
        unknown: genderCounts.unknown || 0,
      }));
    },
  });

  // Fetch mood patterns by gender
  const { data: moodPatterns, isLoading: moodLoading } = useQuery({
    queryKey: ["mood-patterns-by-gender"],
    queryFn: async () => {
      const { data: moods, error: moodsError } = await supabase
        .from("mood_entries")
        .select("mood_level, mood_label, user_id");
      
      if (moodsError) throw moodsError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, gender");
      
      if (profilesError) throw profilesError;

      const userGenderMap = new Map<string, string>();
      profiles?.forEach((p) => {
        userGenderMap.set(p.user_id, p.gender || "unknown");
      });

      const genderMoodStats: Record<string, { total: number; sum: number; labels: Record<string, number> }> = {};

      moods?.forEach((m) => {
        const gender = userGenderMap.get(m.user_id) || "unknown";
        if (!genderMoodStats[gender]) {
          genderMoodStats[gender] = { total: 0, sum: 0, labels: {} };
        }
        genderMoodStats[gender].total += 1;
        genderMoodStats[gender].sum += m.mood_level;
        genderMoodStats[gender].labels[m.mood_label] = (genderMoodStats[gender].labels[m.mood_label] || 0) + 1;
      });

      return Object.entries(genderMoodStats).map(([gender, stats]) => ({
        gender: gender.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        avgMood: stats.total > 0 ? (stats.sum / stats.total).toFixed(1) : 0,
        entries: stats.total,
        topMoods: Object.entries(stats.labels)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([label]) => label),
      }));
    },
  });

  // Training insights
  const { data: trainingInsights } = useQuery({
    queryKey: ["training-insights"],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("content, role, conversation_id")
        .eq("role", "user")
        .limit(1000);
      
      if (error) throw error;

      const { data: conversations } = await supabase
        .from("conversations")
        .select("id, user_id");

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, gender");

      const userGenderMap = new Map<string, string>();
      profiles?.forEach((p) => {
        userGenderMap.set(p.user_id, p.gender || "unknown");
      });

      const conversationUserMap = new Map<string, string>();
      conversations?.forEach((c) => {
        conversationUserMap.set(c.id, c.user_id);
      });

      const genderMessagePatterns: Record<string, { avgLength: number; count: number; totalLength: number }> = {};

      messages?.forEach((m) => {
        const userId = conversationUserMap.get(m.conversation_id);
        const gender = userId ? userGenderMap.get(userId) || "unknown" : "unknown";
        
        if (!genderMessagePatterns[gender]) {
          genderMessagePatterns[gender] = { avgLength: 0, count: 0, totalLength: 0 };
        }
        genderMessagePatterns[gender].count += 1;
        genderMessagePatterns[gender].totalLength += m.content.length;
      });

      return Object.entries(genderMessagePatterns).map(([gender, stats]) => ({
        gender: gender.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        avgMessageLength: stats.count > 0 ? Math.round(stats.totalLength / stats.count) : 0,
        totalMessages: stats.count,
      }));
    },
  });

  const isLoading = demographicsLoading || moduleLoading || moodLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Gender & Demographics Analytics
          </h2>
          <p className="text-muted-foreground">
            Insights for Luna AI training based on user demographics
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {demographics?.total || 0} Total Users
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">With Gender</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {demographics ? demographics.total - (demographics.genderCounts.unknown || 0) : 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">With Orientation</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {demographics ? demographics.total - (demographics.orientationCounts.unknown || 0) : 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Modules Tracked</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {moduleUsage?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Training Ready</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-500">Active</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="modules">Module Usage</TabsTrigger>
          <TabsTrigger value="moods">Mood Patterns</TabsTrigger>
          <TabsTrigger value="training">Training Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Gender Distribution
                </CardTitle>
                <CardDescription>Breakdown of user genders</CardDescription>
              </CardHeader>
              <CardContent>
                {demographics?.genderData && demographics.genderData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographics.genderData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {demographics.genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No gender data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Sexual Orientation Distribution
                </CardTitle>
                <CardDescription>Breakdown of user orientations</CardDescription>
              </CardHeader>
              <CardContent>
                {demographics?.orientationData && demographics.orientationData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographics.orientationData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {demographics.orientationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No orientation data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Module Usage by Gender
              </CardTitle>
              <CardDescription>Which modules each gender uses most</CardDescription>
            </CardHeader>
            <CardContent>
              {moduleUsage && moduleUsage.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="module" type="category" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="male" stackId="a" fill={GENDER_COLORS.male} name="Male" />
                      <Bar dataKey="female" stackId="a" fill={GENDER_COLORS.female} name="Female" />
                      <Bar dataKey="non-binary" stackId="a" fill={GENDER_COLORS["non-binary"]} name="Non-binary" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No module usage data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Mood Patterns by Gender
              </CardTitle>
              <CardDescription>Average mood levels and common mood labels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moodPatterns?.map((pattern) => (
                  <div key={pattern.gender} className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{pattern.gender}</span>
                      <Badge variant="outline">{pattern.entries} entries</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Avg Mood:</span>
                        <span className="ml-2 text-lg font-bold">{pattern.avgMood}/10</span>
                      </div>
                      <Progress value={Number(pattern.avgMood) * 10} className="flex-1" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      {pattern.topMoods.map((mood) => (
                        <Badge key={mood} variant="secondary" className="text-xs">
                          {mood}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {(!moodPatterns || moodPatterns.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No mood data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Communication Patterns for Luna Training
              </CardTitle>
              <CardDescription>Message patterns by gender for AI training insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {trainingInsights?.map((insight) => (
                  <div key={insight.gender} className="p-4 rounded-lg bg-muted/50 border">
                    <h4 className="font-medium mb-2">{insight.gender}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Messages:</span>
                        <span className="font-medium">{insight.totalMessages.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Message Length:</span>
                        <span className="font-medium">{insight.avgMessageLength} chars</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(!trainingInsights || trainingInsights.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No training data available</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="text-base">Luna Training Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use gender-specific communication styles based on observed patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Adjust module recommendations based on gender preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Consider orientation for relationship-specific advice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Match response length to user gender patterns</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
