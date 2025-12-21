import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, MessageCircle, Gamepad2, Gift, Calendar, Activity, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVirtualCurrency } from "@/hooks/useVirtualCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";
import { PartnerInviteCard } from "@/components/couples/PartnerInviteCard";
import { CouplesLinkedStatus } from "@/components/couples/CouplesLinkedStatus";
import { CouplesTrialBanner } from "@/components/couples/CouplesTrialBanner";
import { CouplesFeaturePreviews } from "@/components/couples/CouplesFeaturesPreviews";
import { TrialExpiredCard } from "@/components/couples/TrialExpiredCard";
import { CouplesChat } from "@/components/couples/CouplesChat";
import { PhoneNumberPrompt } from "@/components/PhoneNumberPrompt";
import { usePhonePrompt } from "@/hooks/usePhonePrompt";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerNotifications } from "@/hooks/usePartnerNotifications";
import { CoinBalance } from "@/components/couples/CoinBalance";
import { PartnerSuggestionCard } from "@/components/couples/PartnerSuggestionCard";
import { usePartnerSuggestions } from "@/hooks/usePartnerSuggestions";
const Couples = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isLinked, isLoading, partnerLink, partnerId } = useCouplesAccount();
  const { shouldPrompt, dismiss } = usePhonePrompt();
  const { earnCoins } = useVirtualCurrency();
  const { suggestions, dismissSuggestion, actOnSuggestion } = usePartnerSuggestions();
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const {
    hasCouplesAccess,
    hasCouplesSubscription,
    isTrialActive,
    isTrialExpired,
    canStartTrial,
    trialDaysLeft,
    trialHoursLeft,
    startTrial,
    isStartingTrial,
    trial,
  } = useCouplesTrial();

  usePartnerNotifications();

  // Handle coin purchase success from URL params
  useEffect(() => {
    const coinsPurchased = searchParams.get('coins_purchased');
    if (coinsPurchased && user?.id) {
      const coins = parseInt(coinsPurchased, 10);
      supabase.functions.invoke('process-coin-purchase', {
        body: { userId: user.id, coins },
      }).then(() => {
        toast.success(`🎉 ${coins} coins added to your balance!`);
        queryClient.invalidateQueries({ queryKey: ['user-coins'] });
        queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
      });
      setSearchParams({});
    }
  }, [searchParams, user?.id]);

  useEffect(() => {
    if (isLinked && shouldPrompt && hasCouplesAccess) {
      const timer = setTimeout(() => setShowPhonePrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLinked, shouldPrompt, hasCouplesAccess]);

  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", partnerId)
        .single();
      return data;
    },
    enabled: !!partnerId,
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-messages", partnerLink?.id],
    queryFn: async () => {
      if (!partnerLink?.id || !user) return 0;
      const { count } = await supabase
        .from("couples_messages")
        .select("*", { count: "exact", head: true })
        .eq("partner_link_id", partnerLink.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      return count || 0;
    },
    enabled: !!partnerLink?.id && !!user && hasCouplesAccess,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-12 h-12 text-primary animate-bounce" />
        </div>
      </div>
    );
  }

  const partnerName = partnerProfile?.display_name || "Your Partner";

  // Category cards for the hub
  const categoryCards = [
    {
      title: "Daily Activities",
      description: "Questions, journal, challenges & streaks",
      icon: Calendar,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-500/10",
      route: "/couples/daily",
      badge: null,
    },
    {
      title: "Games & Fun",
      description: "Play together: Truth or Dare, Quizzes & more",
      icon: Gamepad2,
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-500/10",
      route: "/couples/games",
      badge: "18+ games",
    },
    {
      title: "Gifts & Time Capsules",
      description: "Send love notes & surprises to your partner",
      icon: Gift,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-500/10",
      route: "/couples/gifts",
      badge: null,
    },
    {
      title: "Relationship Health",
      description: "Track progress, set goals & grow together",
      icon: Activity,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-500/10",
      route: "/couples/health",
      badge: null,
    },
  ];

  // If user doesn't have access
  if (!hasCouplesAccess) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              Couples
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="p-4 space-y-4">
          {isTrialExpired && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <TrialExpiredCard featuresUsed={trial?.features_used || []} />
            </motion.div>
          )}
          <CouplesFeaturePreviews
            onStartTrial={startTrial}
            onUpgrade={() => navigate("/subscription")}
            canStartTrial={canStartTrial}
            isStartingTrial={isStartingTrial}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            Couples
          </h1>
          <div className="flex items-center gap-2">
            <CoinBalance />
            {isLinked && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(true)}
                className="relative"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px]"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Trial Banner */}
        {isTrialActive && !hasCouplesSubscription && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <CouplesTrialBanner daysLeft={trialDaysLeft} hoursLeft={trialHoursLeft} />
          </motion.div>
        )}

        {/* Connection Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {isLinked ? <CouplesLinkedStatus /> : <PartnerInviteCard />}
        </motion.div>

        {isLinked && (
          <>
            {/* Partner Suggestions */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.05 }}
                  className="space-y-3"
                >
                  {suggestions.map((suggestion) => (
                    <PartnerSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onDismiss={dismissSuggestion}
                      onActed={actOnSuggestion}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <button
                onClick={() => setShowChat(true)}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold flex items-center gap-2">
                      Private Chat
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5">
                          {unreadCount} new
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Send text, voice & video messages
                    </p>
                  </div>
                </div>
              </button>
            </motion.div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              {categoryCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card 
                    className={`cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/30 ${card.bgColor} relative overflow-hidden`}
                    onClick={() => navigate(card.route)}
                  >
                    <CardContent className="p-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{card.title}</h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {card.description}
                      </p>
                      {card.badge && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5">
                          {card.badge}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-medium">Grow Together</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Explore games, send surprises, and build your relationship one day at a time. 
                    Your connection gets stronger with every activity you complete together!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && partnerLink?.id && (
          <CouplesChat
            partnerLinkId={partnerLink.id}
            partnerId={partnerId || ""}
            partnerName={partnerName}
            senderName={myProfile?.display_name || "You"}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>

      {/* Phone Prompt */}
      <PhoneNumberPrompt
        open={showPhonePrompt}
        onOpenChange={(open) => {
          setShowPhonePrompt(open);
          if (!open) dismiss();
        }}
      />
    </div>
  );
};

export default Couples;
