import { motion } from "framer-motion";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useCouplesTrial } from "@/hooks/useCouplesTrial";

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

  if (!hasCouplesAccess) {
    navigate("/couples");
    return null;
  }

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
        {isLinked ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <GameStatsCard partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SpinTheWheel partnerLinkId={partnerLink?.id} />
            </motion.div>

            {/* New Card Games */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <DealBreakers partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
              <LoveTriviaChallenge partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <DateNightRoulette partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.145 }}>
              <ComplimentCards partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.148 }}>
              <PredictionsGame partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <WouldYouRather partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <TruthOrDare partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <CouplesQuizGame partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <NeverHaveIEver partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <ThisOrThat partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <TwoTruthsOneLie partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <MostLikelyTo partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <NewlywedGame partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <ThirtySixQuestions partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <ConversationStarters />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <FinishMySentence partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <LoveLanguageQuiz />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
              <LoveLetterGenerator />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <DrinkingGame partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
              <RateTheFantasy partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <TonightsPlans partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }}>
              <HotColdGame partnerLinkId={partnerLink?.id} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
              <FantasyCards partnerLinkId={partnerLink?.id} />
            </motion.div>
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
