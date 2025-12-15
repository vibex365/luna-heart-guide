import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Heart, Shuffle, ChevronRight, Users, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCouplesGame } from "@/hooks/useCouplesGame";
import { useAuth } from "@/contexts/AuthContext";

interface Question {
  text: string;
  category: "deep" | "fun" | "dreams" | "memories" | "growth";
  depth: 1 | 2 | 3; // 1 = light, 3 = very deep
}

const questions: Question[] = [
  // Deep questions
  { text: "What's something you've never told anyone before?", category: "deep", depth: 3 },
  { text: "What's your biggest fear about our future together?", category: "deep", depth: 3 },
  { text: "When do you feel most loved by me?", category: "deep", depth: 2 },
  { text: "What's something you wish you could change about yourself?", category: "deep", depth: 3 },
  { text: "What does 'home' mean to you?", category: "deep", depth: 2 },
  { text: "What's the most important lesson life has taught you?", category: "deep", depth: 2 },
  { text: "What makes you feel truly understood?", category: "deep", depth: 2 },
  { text: "What's your love language and why do you think that is?", category: "deep", depth: 2 },
  
  // Fun questions
  { text: "If we could teleport anywhere right now, where would you go?", category: "fun", depth: 1 },
  { text: "What's the most embarrassing thing you've ever done for love?", category: "fun", depth: 1 },
  { text: "If we were in a movie, what genre would it be?", category: "fun", depth: 1 },
  { text: "What's your guilty pleasure that I don't know about?", category: "fun", depth: 1 },
  { text: "If you could have any superpower in our relationship, what would it be?", category: "fun", depth: 1 },
  { text: "What's the weirdest thing you find attractive about me?", category: "fun", depth: 1 },
  
  // Dreams questions
  { text: "Where do you see us in 10 years?", category: "dreams", depth: 2 },
  { text: "What's on your bucket list that you want us to do together?", category: "dreams", depth: 2 },
  { text: "What does your ideal day with me look like?", category: "dreams", depth: 1 },
  { text: "What kind of life do you dream of building together?", category: "dreams", depth: 3 },
  { text: "If money wasn't an issue, how would our life be different?", category: "dreams", depth: 2 },
  { text: "What adventure do you want to go on together?", category: "dreams", depth: 1 },
  
  // Memories questions
  { text: "What's your favorite memory of us together?", category: "memories", depth: 1 },
  { text: "When did you first realize you loved me?", category: "memories", depth: 2 },
  { text: "What's a moment when I made you really proud?", category: "memories", depth: 2 },
  { text: "What's something small I did that meant a lot to you?", category: "memories", depth: 2 },
  { text: "What's your favorite date we've ever been on?", category: "memories", depth: 1 },
  { text: "What was your first impression of me?", category: "memories", depth: 1 },
  
  // Growth questions
  { text: "How have I helped you become a better person?", category: "growth", depth: 2 },
  { text: "What's something you want us to work on together?", category: "growth", depth: 2 },
  { text: "How can I support you better?", category: "growth", depth: 2 },
  { text: "What's a relationship goal you have for us?", category: "growth", depth: 2 },
  { text: "What have you learned about love from our relationship?", category: "growth", depth: 3 },
  { text: "How has our relationship changed you?", category: "growth", depth: 3 },
];

const categoryConfig = {
  deep: { label: "Deep", color: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
  fun: { label: "Fun", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
  dreams: { label: "Dreams", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  memories: { label: "Memories", color: "bg-pink-500/10 text-pink-500 border-pink-500/30" },
  growth: { label: "Growth", color: "bg-green-500/10 text-green-500 border-green-500/30" },
};

interface ConversationStartersProps {
  partnerLinkId?: string;
}

export const ConversationStarters = ({ partnerLinkId }: ConversationStartersProps) => {
  const { user } = useAuth();
  const { 
    gameSession, 
    localGameState, 
    startGame, 
    updateGameState, 
    updateCardIndex,
    saveGameResult,
    stats 
  } = useCouplesGame(partnerLinkId, "conversation_starters");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [discussed, setDiscussed] = useState<number[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  const filteredQuestions = filter 
    ? questions.filter(q => q.category === filter)
    : questions;

  // Sync with game session
  useEffect(() => {
    if (gameSession) {
      setCurrentIndex(gameSession.current_card_index);
    }
  }, [gameSession]);

  useEffect(() => {
    if (localGameState.discussed) {
      setDiscussed(localGameState.discussed as number[]);
    }
  }, [localGameState]);

  const handleStartGame = () => {
    startGame({ discussed: [] });
  };

  const handleMarkDiscussed = () => {
    const newDiscussed = [...discussed, currentIndex];
    setDiscussed(newDiscussed);
    updateGameState({ 
      discussed: newDiscussed,
      [`discussed_by_${user?.id}`]: true,
    });

    // Save progress
    if (newDiscussed.length % 5 === 0) {
      saveGameResult({
        total_questions: newDiscussed.length,
        details: { discussed: newDiscussed },
      });
    }
  };

  const handleNext = () => {
    const availableIndices = filteredQuestions
      .map((_, i) => i)
      .filter(i => !discussed.includes(i));
    
    if (availableIndices.length === 0) {
      // All questions discussed!
      saveGameResult({
        total_questions: discussed.length,
        details: { discussed },
      });
      setDiscussed([]);
      setCurrentIndex(0);
      updateCardIndex(0);
      return;
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    setCurrentIndex(randomIndex);
    updateCardIndex(randomIndex);
  };

  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    setCurrentIndex(randomIndex);
    updateCardIndex(randomIndex);
  };

  const currentQuestion = filteredQuestions[currentIndex] || questions[0];
  const partnerDiscussed = localGameState[`discussed_by_${user?.id}`];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-rose-500/10 to-amber-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-rose-500" />
            Conversation Starters
          </CardTitle>
          {stats.totalGamesPlayed > 0 && (
            <Badge variant="outline" className="text-xs">
              {discussed.length} discussed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter(null)}
            className={cn(
              "text-xs",
              !filter && "bg-primary/10 border-primary"
            )}
          >
            All
          </Button>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => setFilter(key)}
              className={cn(
                "text-xs",
                filter === key && config.color
              )}
            >
              {config.label}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!gameSession ? (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4 py-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 flex items-center justify-center">
                <Heart className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Deep conversations strengthen your bond. Start exploring meaningful questions together!
              </p>
              <Button onClick={handleStartGame} className="w-full">
                Start Conversation
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={`question-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Question card */}
              <div className="relative">
                <div className={cn(
                  "p-6 rounded-xl border-2 min-h-[140px] flex flex-col items-center justify-center text-center",
                  categoryConfig[currentQuestion.category].color
                )}>
                  <Badge variant="outline" className="mb-3 text-xs">
                    {categoryConfig[currentQuestion.category].label}
                    {" • "}
                    {"❤️".repeat(currentQuestion.depth)}
                  </Badge>
                  <p className="text-lg font-medium">{currentQuestion.text}</p>
                </div>
                
                {/* Shuffle button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShuffle}
                  className="absolute top-2 right-2"
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>

              {/* Partner sync status */}
              {gameSession && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {Object.keys(localGameState).filter(k => k.startsWith("discussed_by_")).length === 2
                      ? "Both of you marked this as discussed! 💕"
                      : "Mark when you've discussed this question"}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleMarkDiscussed}
                  variant="outline"
                  className={cn(
                    "flex-1 gap-2",
                    discussed.includes(currentIndex) && "bg-green-500/10 border-green-500"
                  )}
                  disabled={discussed.includes(currentIndex)}
                >
                  <Check className="w-4 h-4" />
                  {discussed.includes(currentIndex) ? "Discussed" : "We Discussed This"}
                </Button>
                <Button onClick={handleNext} className="flex-1 gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Next Question
                </Button>
              </div>

              {/* Progress */}
              <div className="text-center text-xs text-muted-foreground">
                {discussed.length} of {filteredQuestions.length} questions discussed
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
