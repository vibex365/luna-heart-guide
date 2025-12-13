import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";
import { BreatheSkeleton } from "@/components/skeletons/PageSkeletons";

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";

interface Exercise {
  id: string;
  name: string;
  description: string;
  phases: { phase: BreathPhase; duration: number }[];
  cycles: number;
}

const exercises: Exercise[] = [
  {
    id: "box",
    name: "Box Breathing",
    description: "A calming technique used by Navy SEALs to reduce stress",
    phases: [
      { phase: "inhale", duration: 4 },
      { phase: "hold", duration: 4 },
      { phase: "exhale", duration: 4 },
      { phase: "rest", duration: 4 },
    ],
    cycles: 4,
  },
  {
    id: "relaxing",
    name: "4-7-8 Relaxing Breath",
    description: "Perfect for anxiety relief and falling asleep",
    phases: [
      { phase: "inhale", duration: 4 },
      { phase: "hold", duration: 7 },
      { phase: "exhale", duration: 8 },
    ],
    cycles: 4,
  },
  {
    id: "energizing",
    name: "Energizing Breath",
    description: "Quick breathing to boost energy and alertness",
    phases: [
      { phase: "inhale", duration: 2 },
      { phase: "exhale", duration: 2 },
    ],
    cycles: 10,
  },
];

const phaseInstructions: Record<BreathPhase, string> = {
  inhale: "Breathe in",
  hold: "Hold",
  exhale: "Breathe out",
  rest: "Rest",
};

const phaseColors: Record<BreathPhase, string> = {
  inhale: "from-secondary to-primary",
  hold: "from-primary to-accent/30",
  exhale: "from-accent/30 to-peach",
  rest: "from-peach to-secondary",
};

const Breathe = () => {
  const navigate = useNavigate();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentPhase = selectedExercise?.phases[currentPhaseIndex];

  useEffect(() => {
    if (!isActive || !selectedExercise || !currentPhase) return;

    setCountdown(currentPhase.duration);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Move to next phase
          const nextPhaseIndex = currentPhaseIndex + 1;
          if (nextPhaseIndex >= selectedExercise.phases.length) {
            // Completed a cycle
            if (currentCycle >= selectedExercise.cycles) {
              // All cycles complete
              setIsActive(false);
              setIsComplete(true);
              return 0;
            }
            setCurrentCycle((c) => c + 1);
            setCurrentPhaseIndex(0);
            return selectedExercise.phases[0].duration;
          }
          setCurrentPhaseIndex(nextPhaseIndex);
          return selectedExercise.phases[nextPhaseIndex].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, selectedExercise, currentPhaseIndex, currentCycle, currentPhase]);

  const startExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentPhaseIndex(0);
    setCurrentCycle(1);
    setCountdown(exercise.phases[0].duration);
    setIsComplete(false);
    setIsActive(true);
  };

  const togglePause = () => {
    setIsActive((prev) => !prev);
  };

  const resetExercise = () => {
    setIsActive(false);
    setCurrentPhaseIndex(0);
    setCurrentCycle(1);
    setIsComplete(false);
    if (selectedExercise) {
      setCountdown(selectedExercise.phases[0].duration);
    }
  };

  const goBack = () => {
    setSelectedExercise(null);
    setIsActive(false);
    setIsComplete(false);
  };

  // Calculate circle scale based on phase
  const getCircleScale = () => {
    if (!currentPhase) return 1;
    if (currentPhase.phase === "inhale") return 1.3;
    if (currentPhase.phase === "exhale") return 0.8;
    return 1;
  };

  return (
    <MobileOnlyLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            {selectedExercise && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">Breathe</h1>
              <p className="text-sm text-muted-foreground">Find your calm</p>
            </div>
          </div>
        </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!selectedExercise ? (
            // Exercise selection
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <p className="text-center text-muted-foreground mb-6">
                Choose a breathing exercise to begin
              </p>
              {exercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="shadow-soft border-border/50 cursor-pointer hover:shadow-luna transition-all"
                    onClick={() => startExercise(exercise)}
                  >
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {exercise.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {exercise.description}
                      </p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 bg-primary/50 rounded-full">
                          {exercise.cycles} cycles
                        </span>
                        <span className="px-2 py-1 bg-secondary/50 rounded-full">
                          {exercise.phases.reduce((sum, p) => sum + p.duration, 0) * exercise.cycles}s total
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Active exercise
            <motion.div
              key="exercise"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              {isComplete ? (
                // Completion screen
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-6">🧘</div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Well done!
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    You completed {selectedExercise.name}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={goBack}>
                      Choose Another
                    </Button>
                    <Button
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      onClick={resetExercise}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Repeat
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Breathing circle */}
                  <div className="relative w-64 h-64 mb-8">
                    <motion.div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${
                        currentPhase ? phaseColors[currentPhase.phase] : "from-secondary to-primary"
                      } opacity-30`}
                      animate={{
                        scale: getCircleScale(),
                      }}
                      transition={{
                        duration: currentPhase?.duration || 4,
                        ease: "easeInOut",
                      }}
                    />
                    <motion.div
                      className={`absolute inset-4 rounded-full bg-gradient-to-br ${
                        currentPhase ? phaseColors[currentPhase.phase] : "from-secondary to-primary"
                      } opacity-50`}
                      animate={{
                        scale: getCircleScale(),
                      }}
                      transition={{
                        duration: currentPhase?.duration || 4,
                        ease: "easeInOut",
                        delay: 0.1,
                      }}
                    />
                    <motion.div
                      className={`absolute inset-8 rounded-full bg-gradient-to-br ${
                        currentPhase ? phaseColors[currentPhase.phase] : "from-secondary to-primary"
                      } flex items-center justify-center`}
                      animate={{
                        scale: getCircleScale(),
                      }}
                      transition={{
                        duration: currentPhase?.duration || 4,
                        ease: "easeInOut",
                        delay: 0.2,
                      }}
                    >
                      <span className="text-5xl font-light text-foreground">
                        {countdown}
                      </span>
                    </motion.div>
                  </div>

                  {/* Phase instruction */}
                  <motion.h2
                    key={currentPhase?.phase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-semibold text-foreground mb-2"
                  >
                    {currentPhase ? phaseInstructions[currentPhase.phase] : ""}
                  </motion.h2>

                  {/* Progress */}
                  <p className="text-muted-foreground mb-8">
                    Cycle {currentCycle} of {selectedExercise.cycles}
                  </p>

                  {/* Controls */}
                  <div className="flex gap-3 mb-8">
                    <Button variant="outline" size="icon" onClick={resetExercise}>
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                    <Button
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
                      onClick={togglePause}
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>
    </MobileOnlyLayout>
  );
};

export default Breathe;
