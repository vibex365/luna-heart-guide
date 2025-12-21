import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, MessageCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useVirtualCurrency } from "@/hooks/useVirtualCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";
import { PartnerInviteCard } from "@/components/couples/PartnerInviteCard";
import { CouplesLinkedStatus } from "@/components/couples/CouplesLinkedStatus";
import { RelationshipHealthCard } from "@/components/couples/RelationshipHealthCard";
import { RelationshipAssessment } from "@/components/couples/RelationshipAssessment";
import { RelationshipTrendsChart } from "@/components/couples/RelationshipTrendsChart";
import { SharedMoodTracker } from "@/components/couples/SharedMoodTracker";
import { SharedActivities } from "@/components/couples/SharedActivities";
import { ConflictResolutionTools } from "@/components/couples/ConflictResolutionTools";
import { CoupleGoals } from "@/components/couples/CoupleGoals";
import { LoveLanguageQuiz } from "@/components/couples/LoveLanguageQuiz";
import { WouldYouRather } from "@/components/couples/WouldYouRather";
import { DailyChallenges } from "@/components/couples/DailyChallenges";
import { CouplesStreakTracker } from "@/components/couples/CouplesStreakTracker";
import { DateNightGenerator } from "@/components/couples/DateNightGenerator";
import { MilestoneTracker } from "@/components/couples/MilestoneTracker";
import { AppreciationPrompts } from "@/components/couples/AppreciationPrompts";
import { TruthOrDare } from "@/components/couples/TruthOrDare";
import { CouplesQuizGame } from "@/components/couples/CouplesQuizGame";
import { NeverHaveIEver } from "@/components/couples/NeverHaveIEver";
import { ConversationStarters } from "@/components/couples/ConversationStarters";
import { GameStatsCard } from "@/components/couples/GameStatsCard";
import { FinishMySentence } from "@/components/couples/FinishMySentence";
import { RateTheFantasy } from "@/components/couples/RateTheFantasy";
import { TonightsPlans } from "@/components/couples/TonightsPlans";
import { ThisOrThat } from "@/components/couples/ThisOrThat";
import { LoveLetterGenerator } from "@/components/couples/LoveLetterGenerator";
import { DrinkingGame } from "@/components/couples/DrinkingGame";
import { HotColdGame } from "@/components/couples/HotColdGame";
import { FantasyCards } from "@/components/couples/FantasyCards";
import { CouplesChat } from "@/components/couples/CouplesChat";
import { CouplesTrialBanner } from "@/components/couples/CouplesTrialBanner";
import { CouplesFeaturePreviews } from "@/components/couples/CouplesFeaturesPreviews";
import { TrialExpiredCard } from "@/components/couples/TrialExpiredCard";
import { PhoneNumberPrompt } from "@/components/PhoneNumberPrompt";
import { usePhonePrompt } from "@/hooks/usePhonePrompt";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerNotifications } from "@/hooks/usePartnerNotifications";
import { Badge } from "@/components/ui/badge";
import TwoTruthsOneLie from "@/components/couples/TwoTruthsOneLie";
import MostLikelyTo from "@/components/couples/MostLikelyTo";
import NewlywedGame from "@/components/couples/NewlywedGame";
import ThirtySixQuestions from "@/components/couples/ThirtySixQuestions";
import SpinTheWheel from "@/components/couples/SpinTheWheel";
import { GiftButton } from "@/components/couples/GiftButton";
import { GiftCollection } from "@/components/couples/GiftCollection";
import { DailyQuestionCard } from "@/components/couples/DailyQuestionCard";
import { QuickDailyHub } from "@/components/couples/QuickDailyHub";
import { DailyTip } from "@/components/couples/DailyTip";
import { CoinBalance } from "@/components/couples/CoinBalance";
import { DailyJournalCard } from "@/components/couples/DailyJournalCard";
const Couples = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isLinked, isLoading, partnerLink, partnerId } = useCouplesAccount();
  const { shouldPrompt, dismiss } = usePhonePrompt();
  const { earnCoins } = useVirtualCurrency();
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Trial hook
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

  // Enable real-time partner notifications
  usePartnerNotifications();

  // Handle coin purchase success from URL params
  useEffect(() => {
    const coinsPurchased = searchParams.get('coins_purchased');
    if (coinsPurchased && user?.id) {
      const coins = parseInt(coinsPurchased, 10);
      // Process the coin purchase
      supabase.functions.invoke('process-coin-purchase', {
        body: { userId: user.id, coins },
      }).then(() => {
        toast.success(`🎉 ${coins} coins added to your balance!`);
        queryClient.invalidateQueries({ queryKey: ['user-coins'] });
        queryClient.invalidateQueries({ queryKey: ['coin-transactions'] });
      });
      // Clear the URL param
      setSearchParams({});
    }
  }, [searchParams, user?.id]);

  // Show phone prompt after a short delay when user is linked but has no phone
  useEffect(() => {
    if (isLinked && shouldPrompt && hasCouplesAccess) {
      const timer = setTimeout(() => setShowPhonePrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLinked, shouldPrompt, hasCouplesAccess]);

  // Get partner's display name
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

  // Get current user's display name
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

  // Get unread message count
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

  // If user doesn't have access (no subscription and no active trial)
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
          {/* Show trial expired card if applicable */}
          {isTrialExpired && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TrialExpiredCard featuresUsed={trial?.features_used || []} />
            </motion.div>
          )}

          {/* Show feature previews */}
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

  // User has access (via subscription or active trial)
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
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
            {/* Coin Balance */}
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
        {/* Trial Banner - only show if on trial (not subscription) */}
        {isTrialActive && !hasCouplesSubscription && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CouplesTrialBanner
              daysLeft={trialDaysLeft}
              hoursLeft={trialHoursLeft}
            />
          </motion.div>
        )}

        {/* Quick Daily Hub - 5 Minutes a Day Dashboard */}
        {isLinked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <QuickDailyHub currentStreak={0} hasDoneChallenge={false} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Connection Status */}
          {isLinked ? (
            <CouplesLinkedStatus />
          ) : (
            <PartnerInviteCard />
          )}
        </motion.div>

        {isLinked && (
          <>
            {/* Chat CTA Card */}
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

            {/* Daily Question Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
            >
              <DailyQuestionCard partnerLinkId={partnerLink?.id} />
            </motion.div>

            {/* Daily Journal Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.075 }}
            >
              <DailyJournalCard partnerName={partnerName} />
            </motion.div>

            {/* Expert Daily Tip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <DailyTip />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CouplesStreakTracker partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <MilestoneTracker partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
            >
              <AppreciationPrompts partnerLinkId={partnerLink?.id} />
            </motion.div>

            {/* Gift Store Section */}
            {partnerLink?.id && partnerId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-4"
              >
                <GiftButton
                  partnerLinkId={partnerLink.id}
                  partnerId={partnerId}
                  partnerName={partnerProfile?.display_name || "your partner"}
                />
                <GiftCollection
                  partnerLinkId={partnerLink.id}
                  partnerId={partnerId}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              <RelationshipAssessment />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <RelationshipHealthCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <RelationshipTrendsChart />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SharedMoodTracker />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <CoupleGoals />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <DateNightGenerator partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <SharedActivities />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <LoveLanguageQuiz />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <WouldYouRather partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
            >
              <TruthOrDare partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44 }}
            >
              <CouplesQuizGame partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46 }}
            >
              <NeverHaveIEver partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48 }}
            >
              <FinishMySentence partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.50 }}
            >
              <RateTheFantasy partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.51 }}
            >
              <TonightsPlans partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
            >
              <ThisOrThat partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.53 }}
            >
              <LoveLetterGenerator partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54 }}
            >
              <ConversationStarters partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <DrinkingGame partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.56 }}
            >
              <HotColdGame partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.57 }}
            >
              <FantasyCards partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58 }}
            >
              <GameStatsCard partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.59 }}
            >
              <TwoTruthsOneLie partnerLinkId={partnerLink?.id || ""} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.60 }}
            >
              <MostLikelyTo partnerLinkId={partnerLink?.id || ""} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.61 }}
            >
              <NewlywedGame partnerLinkId={partnerLink?.id || ""} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
            >
              <ThirtySixQuestions partnerLinkId={partnerLink?.id || ""} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.63 }}
            >
              <SpinTheWheel partnerLinkId={partnerLink?.id || ""} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
            >
              <DailyChallenges />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54 }}
            >
              <ConflictResolutionTools />
            </motion.div>
          </>
        )}

        {!isLinked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center py-8"
          >
            <p className="text-muted-foreground">
              Connect with your partner to unlock shared mood tracking, 
              relationship health scores, and couples activities.
            </p>
          </motion.div>
        )}
      </div>

      {/* Phone Number Prompt */}
      <PhoneNumberPrompt
        open={showPhonePrompt}
        onOpenChange={(open) => {
          setShowPhonePrompt(open);
          if (!open) dismiss();
        }}
      />

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && partnerLink?.id && partnerId && (
          <CouplesChat
            partnerLinkId={partnerLink.id}
            partnerName={partnerName}
            partnerId={partnerId}
            senderName={myProfile?.display_name || "Your partner"}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Couples;
