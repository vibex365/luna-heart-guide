import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, History, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCouplesAccount } from '@/hooks/useCouplesAccount';
import { useCouplesTrial } from '@/hooks/useCouplesTrial';
import { ArgumentAnalyzer } from '@/components/couples/ArgumentAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const ArgumentAnalysis = () => {
  const navigate = useNavigate();
  const { partnerLink } = useCouplesAccount();
  const { hasCouplesAccess } = useCouplesTrial();
  const [activeTab, setActiveTab] = useState('new');

  // Fetch past analyses
  const { data: pastAnalyses } = useQuery({
    queryKey: ['argument-analyses', partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink?.id) return [];
      const { data, error } = await supabase
        .from('argument_analyses')
        .select('*')
        .eq('partner_link_id', partnerLink.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!partnerLink?.id,
  });

  if (!hasCouplesAccess) {
    navigate('/couples');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-500" />
            Argument Analyzer
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="new">New Analysis</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            {partnerLink?.id && (
              <ArgumentAnalyzer 
                partnerLinkId={partnerLink.id}
                onAnalysisComplete={() => {
                  // Optionally switch to history tab
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {pastAnalyses && pastAnalyses.length > 0 ? (
                pastAnalyses.map((analysis: any, i: number) => {
                  const score = analysis.analysis?.overall_score || 0;
                  return (
                    <motion.div
                      key={analysis.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h3 className="font-medium">
                                {analysis.title || 'Conversation Analysis'}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(analysis.created_at), 'MMM d, yyyy · h:mm a')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`text-2xl font-bold ${
                                score >= 7 ? 'text-green-500' :
                                score >= 5 ? 'text-amber-500' :
                                'text-red-500'
                              }`}>
                                {score.toFixed(1)}
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                          {analysis.analysis?.summary && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {analysis.analysis.summary}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center space-y-3">
                    <History className="w-12 h-12 mx-auto text-muted-foreground/50" />
                    <div>
                      <h3 className="font-medium">No analyses yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Your conversation analyses will appear here
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('new')}
                    >
                      Start Your First Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArgumentAnalysis;
