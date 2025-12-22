import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, MessageSquare, Heart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { formatDistanceToNow } from "date-fns";

export const ConversationInsights = () => {
  const { user } = useAuth();
  const { partnerLink } = useCouplesAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch latest insights
  const { data: insights, isLoading } = useQuery({
    queryKey: ['couples-luna-insights', partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink?.id) return [];
      
      const { data, error } = await supabase
        .from('couples_luna_insights')
        .select('*')
        .eq('partner_link_id', partnerLink.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!partnerLink?.id
  });

  // Generate new insight
  const generateInsight = useMutation({
    mutationFn: async () => {
      if (!partnerLink?.id || !user) throw new Error("Not linked");

      // Get recent messages
      const { data: messages, error: msgError } = await supabase
        .from('couples_luna_messages')
        .select('*')
        .eq('partner_link_id', partnerLink.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (msgError) throw msgError;
      if (!messages || messages.length < 5) {
        throw new Error("Not enough messages for insights");
      }

      // Call edge function to generate insight
      const { data, error } = await supabase.functions.invoke('couples-luna-insights', {
        body: { 
          partnerLinkId: partnerLink.id,
          messages: messages.reverse() // Chronological order
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couples-luna-insights'] });
      toast({
        title: "Insights Generated",
        description: "New conversation insights are ready!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't Generate Insights",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getSentimentEmoji = (sentiment: string | null) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return "💚";
      case 'loving': return "💕";
      case 'playful': return "😊";
      case 'supportive': return "🤗";
      case 'neutral': return "😌";
      case 'challenging': return "💪";
      default: return "💬";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Conversation Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const latestInsight = insights?.[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Conversation Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateInsight.mutate()}
            disabled={generateInsight.isPending}
          >
            {generateInsight.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!latestInsight ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chat more with Luna to get insights</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => generateInsight.mutate()}
              disabled={generateInsight.isPending}
            >
              Generate Insights
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Latest Insight */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getSentimentEmoji(latestInsight.sentiment)}</span>
                  <Badge variant="secondary" className="capitalize">
                    {latestInsight.sentiment || 'Insightful'}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(latestInsight.created_at), { addSuffix: true })}
                </span>
              </div>
              
              <p className="text-sm leading-relaxed">
                {latestInsight.content}
              </p>

              {latestInsight.key_topics && latestInsight.key_topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {latestInsight.key_topics.map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}

              {latestInsight.message_count && (
                <p className="text-xs text-muted-foreground mt-2">
                  Based on {latestInsight.message_count} messages
                </p>
              )}
            </div>

            {/* Previous insights preview */}
            {insights && insights.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Previous insights</p>
                {insights.slice(1, 3).map((insight) => (
                  <div 
                    key={insight.id}
                    className="p-2 rounded bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getSentimentEmoji(insight.sentiment)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2">{insight.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
