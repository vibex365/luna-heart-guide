import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDailyTip } from '@/hooks/useDailyTip';
import { motion } from 'framer-motion';
import { Lightbulb, Quote, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const DailyTip = () => {
  const { todaysTip, isLoading } = useDailyTip();

  if (isLoading) {
    return (
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!todaysTip) {
    return null;
  }

  const categoryColors: Record<string, string> = {
    communication: 'from-blue-500 to-cyan-500',
    positivity: 'from-yellow-500 to-orange-500',
    connection: 'from-pink-500 to-rose-500',
    intimacy: 'from-purple-500 to-pink-500',
    'quality-time': 'from-green-500 to-teal-500',
    conflict: 'from-red-500 to-orange-500',
    appreciation: 'from-amber-500 to-yellow-500',
    general: 'from-amber-500 to-orange-500',
  };

  const gradient = categoryColors[todaysTip.category] || categoryColors.general;

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Expert Tip of the Day
          </CardTitle>
          <div className={`px-2 py-1 rounded-full text-xs text-white bg-gradient-to-r ${gradient}`}>
            {todaysTip.category}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-semibold text-foreground mb-2">{todaysTip.title}</h3>
          <div className="relative">
            <Quote className="h-4 w-4 text-amber-500/30 absolute -left-1 -top-1" />
            <p className="text-sm text-muted-foreground pl-4 italic">
              {todaysTip.content}
            </p>
          </div>
        </motion.div>

        {todaysTip.author && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 pt-2 border-t border-amber-500/10"
          >
            <User className="h-3 w-3 text-amber-500" />
            <span className="text-xs text-muted-foreground">— {todaysTip.author}</span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
