import { Card, CardContent } from '@/components/ui/card';
import { useDailyQuestion } from '@/hooks/useDailyQuestion';
import { useDailyTip } from '@/hooks/useDailyTip';
import { useVirtualCurrency } from '@/hooks/useVirtualCurrency';
import { motion } from 'framer-motion';
import { 
  MessageCircleHeart, 
  Flame, 
  Coins, 
  CheckCircle2, 
  Circle,
  Target,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface QuickDailyHubProps {
  currentStreak?: number;
  hasDoneChallenge?: boolean;
}

export const QuickDailyHub = ({ currentStreak = 0, hasDoneChallenge = false }: QuickDailyHubProps) => {
  const { hasAnswered, bothAnswered } = useDailyQuestion();
  const { todaysTip } = useDailyTip();
  const { balance } = useVirtualCurrency();

  // Calculate daily progress
  const dailyTasks = [
    { id: 'question', label: 'Daily Question', done: hasAnswered, icon: MessageCircleHeart },
    { id: 'challenge', label: 'Challenge', done: hasDoneChallenge, icon: Target },
    { id: 'tip', label: 'Read Tip', done: true, icon: Lightbulb }, // Always available
  ];

  const completedCount = dailyTasks.filter((t) => t.done).length;
  const progressPercent = (completedCount / dailyTasks.length) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 overflow-hidden">
      <CardContent className="p-4">
        {/* Header with streak and coins */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <Flame className="h-4 w-4" />
              <span className="font-bold">{currentStreak}</span>
              <span className="text-xs">day streak</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Coins className="h-4 w-4" />
              <span className="font-bold">{balance}</span>
              <span className="text-xs">coins</span>
            </motion.div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{completedCount}/{dailyTasks.length}</span>
            <p className="text-xs text-muted-foreground">Today's progress</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <Progress value={progressPercent} className="h-2" />
          {completedCount === dailyTasks.length && (
            <motion.p
              className="text-xs text-center mt-2 text-primary font-medium flex items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles className="h-3 w-3" />
              All daily activities complete! Amazing!
            </motion.p>
          )}
        </div>

        {/* Task checklist */}
        <div className="grid grid-cols-3 gap-2">
          {dailyTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                task.done 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              <div className="relative">
                <task.icon className="h-5 w-5" />
                {task.done ? (
                  <CheckCircle2 className="h-3 w-3 absolute -bottom-1 -right-1 text-green-500 bg-background rounded-full" />
                ) : (
                  <Circle className="h-3 w-3 absolute -bottom-1 -right-1 text-muted-foreground bg-background rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{task.label}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
