import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, CheckCircle2, Clock, Flag, Lock, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface GrowthPlan {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_days: number;
  icon: string;
  outcomes: { text: string }[];
  is_premium: boolean;
}

interface UserGrowthPlan {
  id: string;
  plan_id: string;
  current_day: number;
  status: string;
  completed_days: number[];
  started_at: string;
}

interface GrowthPlansCardProps {
  partnerLinkId: string;
}

export const GrowthPlansCard = ({ partnerLinkId }: GrowthPlansCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<GrowthPlan | null>(null);

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['growth-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as unknown as GrowthPlan[];
    },
  });

  // Fetch user's active/completed plans
  const { data: userPlans } = useQuery({
    queryKey: ['user-growth-plans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_growth_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserGrowthPlan[];
    },
    enabled: !!user,
  });

  // Start a plan
  const startPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_growth_plans')
        .insert({
          user_id: user.id,
          partner_link_id: partnerLinkId,
          plan_id: planId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Plan started! Good luck on your journey.");
      queryClient.invalidateQueries({ queryKey: ['user-growth-plans'] });
      setSelectedPlan(null);
    },
    onError: () => {
      toast.error("Failed to start plan");
    },
  });

  // Complete a day
  const completeDayMutation = useMutation({
    mutationFn: async ({ userPlanId, dayNumber }: { userPlanId: string; dayNumber: number }) => {
      const userPlan = userPlans?.find(p => p.id === userPlanId);
      if (!userPlan) throw new Error('Plan not found');

      const completedDays = [...(userPlan.completed_days || []), dayNumber];
      const plan = plans?.find(p => p.id === userPlan.plan_id);
      const isComplete = completedDays.length >= (plan?.duration_days || 7);

      const { error } = await supabase
        .from('user_growth_plans')
        .update({
          completed_days: completedDays,
          current_day: dayNumber + 1,
          status: isComplete ? 'completed' : 'active',
          completed_at: isComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userPlanId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Day completed! Keep going!");
      queryClient.invalidateQueries({ queryKey: ['user-growth-plans'] });
    },
  });

  const getActivePlan = () => {
    if (!userPlans || !plans) return null;
    const activeUserPlan = userPlans.find(up => up.status === 'active');
    if (!activeUserPlan) return null;
    const plan = plans.find(p => p.id === activeUserPlan.plan_id);
    return plan ? { ...plan, userPlan: activeUserPlan } : null;
  };

  const activePlan = getActivePlan();

  const categoryColors: Record<string, string> = {
    communication: 'from-blue-500 to-cyan-500',
    connection: 'from-pink-500 to-rose-500',
    intimacy: 'from-red-500 to-orange-500',
    general: 'from-purple-500 to-indigo-500',
  };

  if (plansLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show active plan progress
  if (activePlan) {
    const userPlan = activePlan.userPlan as UserGrowthPlan;
    const progress = ((userPlan.completed_days?.length || 0) / activePlan.duration_days) * 100;
    const currentDay = userPlan.current_day || 1;
    const isDayCompleted = userPlan.completed_days?.includes(currentDay);

    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 overflow-hidden">
        <div className={`h-1 bg-gradient-to-r ${categoryColors[activePlan.category] || categoryColors.general}`} />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">{activePlan.icon}</span>
              {activePlan.title}
            </CardTitle>
            <Badge variant="secondary">
              Day {currentDay}/{activePlan.duration_days}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{userPlan.completed_days?.length || 0} days completed</span>
            <span>{activePlan.duration_days - (userPlan.completed_days?.length || 0)} days remaining</span>
          </div>

          <Button
            onClick={() => {
              if (!isDayCompleted) {
                completeDayMutation.mutate({ userPlanId: userPlan.id, dayNumber: currentDay });
              }
            }}
            disabled={isDayCompleted || completeDayMutation.isPending}
            className={`w-full ${isDayCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-purple-500'}`}
          >
            {isDayCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Day {currentDay} Complete
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 mr-2" />
                Complete Today's Challenge
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show plan selection
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Growth Plans
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Multi-day challenges to strengthen your relationship
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans?.slice(0, 3).map((plan, i) => (
          <Sheet key={plan.id}>
            <SheetTrigger asChild>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedPlan(plan)}
                className="w-full p-4 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/30 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[plan.category] || categoryColors.general} flex items-center justify-center text-2xl`}>
                    {plan.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{plan.title}</h3>
                      {plan.is_premium && <Lock className="w-3 h-3 text-amber-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{plan.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{plan.duration_days} days</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryColors[plan.category] || categoryColors.general} flex items-center justify-center text-3xl`}>
                    {plan.icon}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{plan.title}</SheetTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {plan.duration_days} day plan
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~10 min/day
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 pb-24">
                <p className="text-muted-foreground">{plan.description}</p>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-primary" />
                    Plan Outcomes
                  </h4>
                  <div className="space-y-2">
                    {plan.outcomes?.map((outcome, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{outcome.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => startPlanMutation.mutate(plan.id)}
                  disabled={startPlanMutation.isPending}
                  className="w-full h-14 text-lg bg-gradient-to-r from-primary to-purple-500"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start {plan.duration_days}-Day Plan
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ))}
      </CardContent>
    </Card>
  );
};
