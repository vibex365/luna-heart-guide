import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Trophy, RefreshCw, Send, CheckCircle, XCircle } from "lucide-react";
import { twoTruthsCategories } from "@/data/couplesGamesContent";

interface TwoTruthsOneLieProps {
  partnerLinkId: string;
}

interface GameSession {
  id: string;
  statements: string[];
  lieIndex: number;
  creatorId: string;
  guesserId?: string;
  guess?: number;
  revealed: boolean;
}

const TwoTruthsOneLie: React.FC<TwoTruthsOneLieProps> = ({ partnerLinkId }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<"menu" | "create" | "guess" | "reveal" | "waiting">("menu");
  const [statements, setStatements] = useState(["", "", ""]);
  const [lieIndex, setLieIndex] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, fooled: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkForPendingGame();
    loadScore();
  }, [partnerLinkId]);

  const checkForPendingGame = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("couples_game_sessions")
      .select("*")
      .eq("partner_link_id", partnerLinkId)
      .eq("game_type", "two_truths")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const gameState = data.game_state as any;
      if (!gameState.revealed) {
        setCurrentSession({
          id: data.id,
          statements: gameState.statements || [],
          lieIndex: gameState.lieIndex,
          creatorId: data.started_by,
          guess: gameState.guess,
          revealed: gameState.revealed || false,
        });
        
        if (data.started_by === user.id && !gameState.guess) {
          setGameState("waiting");
        } else if (data.started_by !== user.id && !gameState.guess) {
          setGameState("guess");
        } else if (gameState.guess !== undefined && !gameState.revealed) {
          setGameState("reveal");
        }
      }
    }
  };

  const loadScore = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("couples_game_history")
      .select("*")
      .eq("partner_link_id", partnerLinkId)
      .eq("game_type", "two_truths")
      .eq("played_by", user.id);

    if (data) {
      const correct = data.filter(g => (g.details as any)?.guessedCorrectly).length;
      const fooled = data.filter(g => (g.details as any)?.fooledPartner).length;
      setScore({ correct, fooled });
    }
  };

  const startNewGame = () => {
    setStatements(["", "", ""]);
    setLieIndex(null);
    setGameState("create");
  };

  const submitStatements = async () => {
    if (!user || statements.some(s => !s.trim()) || lieIndex === null) {
      toast.error("Please fill all statements and mark the lie");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("couples_game_sessions")
        .insert({
          partner_link_id: partnerLinkId,
          game_type: "two_truths",
          started_by: user.id,
          game_state: {
            statements,
            lieIndex,
            revealed: false,
          },
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession({
        id: data.id,
        statements,
        lieIndex,
        creatorId: user.id,
        revealed: false,
      });
      setGameState("waiting");
      toast.success("Statements submitted! Waiting for partner to guess.");
    } catch (error) {
      toast.error("Failed to submit statements");
    } finally {
      setLoading(false);
    }
  };

  const submitGuess = async () => {
    if (!user || !currentSession || selectedGuess === null) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("couples_game_sessions")
        .update({
          game_state: {
            statements: currentSession.statements,
            lieIndex: currentSession.lieIndex,
            guess: selectedGuess,
            revealed: false,
          },
        })
        .eq("id", currentSession.id);

      if (error) throw error;

      setCurrentSession({ ...currentSession, guess: selectedGuess });
      setGameState("reveal");
    } catch (error) {
      toast.error("Failed to submit guess");
    } finally {
      setLoading(false);
    }
  };

  const revealResult = async () => {
    if (!currentSession) return;

    const isCorrect = currentSession.guess === currentSession.lieIndex;
    
    setLoading(true);
    try {
      // Save to history
      await supabase.from("couples_game_history").insert({
        partner_link_id: partnerLinkId,
        game_type: "two_truths",
        played_by: user?.id || "",
        details: {
          guessedCorrectly: currentSession.creatorId !== user?.id && isCorrect,
          fooledPartner: currentSession.creatorId === user?.id && !isCorrect,
        },
      });

      // Mark session as revealed
      await supabase
        .from("couples_game_sessions")
        .update({
          game_state: {
            ...currentSession,
            revealed: true,
          },
        })
        .eq("id", currentSession.id);

      setCurrentSession({ ...currentSession, revealed: true });
      loadScore();
      
      if (isCorrect) {
        toast.success("Correct guess! 🎉");
      } else {
        toast.info("Wrong guess! They fooled you! 😄");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setGameState("menu");
    setCurrentSession(null);
    setStatements(["", "", ""]);
    setLieIndex(null);
    setSelectedGuess(null);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-primary" />
          Two Truths & a Lie
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary">
            <Trophy className="h-3 w-3 mr-1" />
            Guessed: {score.correct}
          </Badge>
          <Badge variant="outline">
            <EyeOff className="h-3 w-3 mr-1" />
            Fooled: {score.fooled}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {gameState === "menu" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Write two truths and one lie. Your partner will try to guess which one is the lie!
              </p>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Inspiration categories:</p>
                <div className="flex flex-wrap gap-1">
                  {twoTruthsCategories.map(cat => (
                    <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={startNewGame} className="w-full">
                Start New Round
              </Button>
            </motion.div>
          )}

          {gameState === "create" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Write your statements and tap the one that's the lie:
              </p>
              {statements.map((statement, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={statement}
                    onChange={(e) => {
                      const newStatements = [...statements];
                      newStatements[index] = e.target.value;
                      setStatements(newStatements);
                    }}
                    placeholder={`Statement ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant={lieIndex === index ? "destructive" : "outline"}
                    size="icon"
                    onClick={() => setLieIndex(index)}
                    title="Mark as lie"
                  >
                    {lieIndex === index ? <XCircle className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetGame} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={submitStatements} 
                  disabled={loading || statements.some(s => !s.trim()) || lieIndex === null}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </div>
            </motion.div>
          )}

          {gameState === "waiting" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center space-y-4"
            >
              <div className="animate-pulse">
                <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin" />
              </div>
              <p className="text-muted-foreground">
                Waiting for your partner to guess...
              </p>
              <Button variant="outline" onClick={checkForPendingGame}>
                Refresh
              </Button>
            </motion.div>
          )}

          {gameState === "guess" && currentSession && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Which one is the lie? Tap to select:
              </p>
              {currentSession.statements.map((statement, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedGuess(index)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedGuess === index
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {statement}
                </motion.button>
              ))}
              <Button 
                onClick={submitGuess} 
                disabled={loading || selectedGuess === null}
                className="w-full"
              >
                Lock In Guess
              </Button>
            </motion.div>
          )}

          {gameState === "reveal" && currentSession && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {!currentSession.revealed ? (
                <>
                  <p className="text-center text-muted-foreground">
                    Ready to see the answer?
                  </p>
                  <Button onClick={revealResult} className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Reveal Answer
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {currentSession.statements.map((statement, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg flex items-center gap-2 ${
                          index === currentSession.lieIndex
                            ? "bg-destructive/20 border border-destructive"
                            : "bg-green-500/20 border border-green-500"
                        }`}
                      >
                        {index === currentSession.lieIndex ? (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                        <span className="text-sm">{statement}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    {currentSession.guess === currentSession.lieIndex ? (
                      <Badge className="bg-green-500">Correct Guess! 🎉</Badge>
                    ) : (
                      <Badge variant="destructive">Fooled! 😄</Badge>
                    )}
                  </div>
                  <Button onClick={resetGame} className="w-full">
                    Play Again
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default TwoTruthsOneLie;
