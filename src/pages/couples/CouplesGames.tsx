import { motion } from "framer-motion";
import { ArrowLeft, Gamepad2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";
import { useGameVisibility } from "@/hooks/useGameVisibility";

// Game components
import { WouldYouRather } from "@/components/couples/WouldYouRather";
import { TruthOrDare } from "@/components/couples/TruthOrDare";
import { CouplesQuizGame } from "@/components/couples/CouplesQuizGame";
import { NeverHaveIEver } from "@/components/couples/NeverHaveIEver";
import { ConversationStarters } from "@/components/couples/ConversationStarters";
import { FinishMySentence } from "@/components/couples/FinishMySentence";
import { RateTheFantasy } from "@/components/couples/RateTheFantasy";
import { TonightsPlans } from "@/components/couples/TonightsPlans";
import { ThisOrThat } from "@/components/couples/ThisOrThat";
import { LoveLetterGenerator } from "@/components/couples/LoveLetterGenerator";
import { DrinkingGame } from "@/components/couples/DrinkingGame";
import { HotColdGame } from "@/components/couples/HotColdGame";
import { FantasyCards } from "@/components/couples/FantasyCards";
import TwoTruthsOneLie from "@/components/couples/TwoTruthsOneLie";
import MostLikelyTo from "@/components/couples/MostLikelyTo";
import NewlywedGame from "@/components/couples/NewlywedGame";
import ThirtySixQuestions from "@/components/couples/ThirtySixQuestions";
import SpinTheWheel from "@/components/couples/SpinTheWheel";
import { GameStatsCard } from "@/components/couples/GameStatsCard";
import { LoveLanguageQuiz } from "@/components/couples/LoveLanguageQuiz";
// New card games
import { DealBreakers } from "@/components/couples/DealBreakers";
import { LoveTriviaChallenge } from "@/components/couples/LoveTriviaChallenge";
import { DateNightRoulette } from "@/components/couples/DateNightRoulette";
import { ComplimentCards } from "@/components/couples/ComplimentCards";
import { PredictionsGame } from "@/components/couples/PredictionsGame";

const CouplesGames = () => {
  const navigate = useNavigate();
  const { isLinked, partnerLink } = useCouplesAccount();
  const { hasCouplesAccess } = useCouplesTrial();
  const { isGameVisible, isLoading: loadingGames } = useGameVisibility();

  if (!hasCouplesAccess) {
    navigate("/couples");
    return null;
  }

  // Helper to conditionally render games based on visibility
  const renderGame = (gameKey: string, component: React.ReactNode, delay: number) => {
    if (!isGameVisible(gameKey)) return null;
    return (
      <motion.div 
        key={gameKey}
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay }}
      >
        {component}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/couples")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-500" />
            Games & Activities
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loadingGames ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isLinked ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <GameStatsCard partnerLinkId={partnerLink?.id} />
            </motion.div>

            {renderGame('spin_the_wheel', <SpinTheWheel partnerLinkId={partnerLink?.id} />, 0.1)}
            {renderGame('deal_breakers', <DealBreakers partnerLinkId={partnerLink?.id} />, 0.12)}
            {renderGame('love_trivia', <LoveTriviaChallenge partnerLinkId={partnerLink?.id} />, 0.13)}
            {renderGame('date_night_roulette', <DateNightRoulette partnerLinkId={partnerLink?.id} />, 0.14)}
            {renderGame('compliment_cards', <ComplimentCards partnerLinkId={partnerLink?.id} />, 0.145)}
            {renderGame('predictions_game', <PredictionsGame partnerLinkId={partnerLink?.id} />, 0.148)}
            {renderGame('would_you_rather', <WouldYouRather partnerLinkId={partnerLink?.id} />, 0.15)}
            {renderGame('truth_or_dare', <TruthOrDare partnerLinkId={partnerLink?.id} />, 0.2)}
            {renderGame('couples_quiz', <CouplesQuizGame partnerLinkId={partnerLink?.id} />, 0.25)}
            {renderGame('never_have_i_ever', <NeverHaveIEver partnerLinkId={partnerLink?.id} />, 0.3)}
            {renderGame('this_or_that', <ThisOrThat partnerLinkId={partnerLink?.id} />, 0.35)}
            {renderGame('two_truths_one_lie', <TwoTruthsOneLie partnerLinkId={partnerLink?.id} />, 0.4)}
            {renderGame('most_likely_to', <MostLikelyTo partnerLinkId={partnerLink?.id} />, 0.45)}
            {renderGame('newlywed_game', <NewlywedGame partnerLinkId={partnerLink?.id} />, 0.5)}
            {renderGame('36_questions', <ThirtySixQuestions partnerLinkId={partnerLink?.id} />, 0.55)}
            
            {/* These don't have visibility toggles - always show */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <ConversationStarters />
            </motion.div>

            {renderGame('finish_my_sentence', <FinishMySentence partnerLinkId={partnerLink?.id} />, 0.65)}
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <LoveLanguageQuiz />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
              <LoveLetterGenerator />
            </motion.div>

            {renderGame('drinking_game', <DrinkingGame partnerLinkId={partnerLink?.id} />, 0.8)}
            {renderGame('rate_the_fantasy', <RateTheFantasy partnerLinkId={partnerLink?.id} />, 0.85)}
            {renderGame('tonights_plans', <TonightsPlans partnerLinkId={partnerLink?.id} />, 0.9)}
            {renderGame('hot_cold_game', <HotColdGame partnerLinkId={partnerLink?.id} />, 0.95)}
            {renderGame('fantasy_cards', <FantasyCards partnerLinkId={partnerLink?.id} />, 1.0)}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Link with your partner to play games together!</p>
            <Button onClick={() => navigate("/couples")} className="mt-4">
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouplesGames;
