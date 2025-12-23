import { useState } from "react";
import { ArrowLeft, Check, X, Lightbulb, PenLine, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

interface GameData {
  questions?: QuizQuestion[];
  prompt?: string;
  minWords?: number;
  title?: string;
  instructions?: string;
  tracking?: boolean;
}

interface ChapterGameProps {
  gameType: string;
  gameData: GameData;
  onComplete: () => void;
  onBack: () => void;
}

export const ChapterGame = ({ gameType, gameData, onComplete, onBack }: ChapterGameProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [reflectionText, setReflectionText] = useState("");
  const [completed, setCompleted] = useState(false);

  if (gameType === 'quiz' && gameData.questions) {
    const questions = gameData.questions;
    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;

    const handleAnswer = (index: number) => {
      setSelectedAnswer(index);
      setShowResult(true);
      if (index === question.correct) {
        setScore(s => s + 1);
      }
    };

    const nextQuestion = () => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(c => c + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setCompleted(true);
      }
    };

    if (completed) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Quiz Complete!</h3>
            <p className="text-muted-foreground mb-4">
              You scored {score} out of {questions.length}
            </p>
            <Button onClick={onComplete}>Continue to Next Chapter</Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Chapter
          </Button>
          <div className="text-sm text-muted-foreground mb-2">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <h3 className="text-lg font-semibold mb-4">{question.q}</h3>
          <div className="space-y-2">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => !showResult && handleAnswer(i)}
                disabled={showResult}
                className={cn(
                  "w-full p-3 text-left rounded-lg border transition-colors",
                  showResult && i === question.correct && "bg-green-500/20 border-green-500",
                  showResult && selectedAnswer === i && i !== question.correct && "bg-red-500/20 border-red-500",
                  !showResult && "hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  {showResult && i === question.correct && <Check className="w-4 h-4 text-green-600" />}
                  {showResult && selectedAnswer === i && i !== question.correct && <X className="w-4 h-4 text-red-600" />}
                  {option}
                </div>
              </button>
            ))}
          </div>
          {showResult && (
            <Button className="w-full mt-4" onClick={nextQuestion}>
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (gameType === 'reflection' || gameType === 'exercise') {
    const minWords = gameData.minWords || 30;
    const wordCount = reflectionText.trim().split(/\s+/).filter(w => w).length;
    const isValid = wordCount >= minWords;

    if (completed) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Great Reflection!</h3>
            <p className="text-muted-foreground mb-4">
              Your thoughts have been saved with your notes.
            </p>
            <Button onClick={onComplete}>Continue to Next Chapter</Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Chapter
          </Button>
          <div className="flex items-center gap-2 mb-4">
            {gameType === 'reflection' ? (
              <Lightbulb className="w-5 h-5 text-amber-500" />
            ) : (
              <PenLine className="w-5 h-5 text-blue-500" />
            )}
            <span className="font-semibold">
              {gameType === 'reflection' ? 'Reflection' : gameData.title || 'Exercise'}
            </span>
          </div>
          <p className="text-muted-foreground mb-4">
            {gameData.prompt || gameData.instructions}
          </p>
          <Textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Write your response here..."
            rows={6}
            className="mb-2"
          />
          <div className="flex justify-between items-center">
            <span className={cn("text-sm", isValid ? "text-green-600" : "text-muted-foreground")}>
              {wordCount} / {minWords} words minimum
            </span>
            <Button onClick={() => setCompleted(true)} disabled={!isValid}>
              Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
