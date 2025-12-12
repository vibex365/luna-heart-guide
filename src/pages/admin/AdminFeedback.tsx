import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  TrendingUp,
  BarChart3
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";

interface Feedback {
  id: string;
  message_id: string;
  rating: number;
  feedback_type: string | null;
  feedback_text: string | null;
  created_at: string;
}

export default function AdminFeedback() {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Feedback[];
    },
  });

  // Process rating distribution
  const ratingDistribution = () => {
    if (!feedback) return [];
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach((f) => {
      dist[f.rating] = (dist[f.rating] || 0) + 1;
    });
    return Object.entries(dist).map(([rating, count]) => ({
      rating: `${rating} Star${rating !== "1" ? "s" : ""}`,
      count,
    }));
  };

  // Process feedback types
  const feedbackTypeDistribution = () => {
    if (!feedback) return [];
    const types: Record<string, number> = {};
    feedback.forEach((f) => {
      const type = f.feedback_type || "no_type";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));
  };

  const avgRating = feedback && feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : "N/A";

  const positiveCount = feedback?.filter((f) => f.rating >= 4).length || 0;
  const negativeCount = feedback?.filter((f) => f.rating <= 2).length || 0;

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold">User Feedback</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold">User Feedback</h1>
            <p className="text-sm text-muted-foreground">
              Review ratings and feedback from Luna conversations
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                  <p className="text-2xl font-bold">{feedback?.length || 0}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {avgRating}
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Positive (4-5★)</p>
                  <p className="text-2xl font-bold text-green-500">{positiveCount}</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Negative (1-2★)</p>
                  <p className="text-2xl font-bold text-destructive">{negativeCount}</p>
                </div>
                <ThumbsDown className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Rating Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of ratings across all feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ratingDistribution().length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ratingDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No feedback data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Feedback Types
              </CardTitle>
              <CardDescription>
                Categories of feedback received
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackTypeDistribution().length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={feedbackTypeDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {feedbackTypeDistribution().map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No feedback type data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>
              Latest feedback with comments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedback && feedback.filter((f) => f.feedback_text).length > 0 ? (
              <div className="space-y-4">
                {feedback
                  .filter((f) => f.feedback_text)
                  .slice(0, 10)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="flex gap-4 p-4 rounded-lg border border-border"
                    >
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= f.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {f.feedback_type && (
                            <Badge variant="secondary" className="text-xs">
                              {f.feedback_type.replace(/_/g, " ")}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(f.created_at), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm">{f.feedback_text}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No feedback with comments yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
