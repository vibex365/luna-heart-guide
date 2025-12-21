import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Inbox, Gift, Heart, Sparkles, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useTimeCapsule } from '@/hooks/useTimeCapsule';
import { format, formatDistanceToNow } from 'date-fns';
import confetti from 'canvas-confetti';

interface TimeCapsuleInboxProps {
  partnerName: string;
}

export const TimeCapsuleInbox = ({ partnerName }: TimeCapsuleInboxProps) => {
  const {
    receivedCapsules,
    pendingCapsules,
    deliveredSentCapsules,
    unopenedCount,
    openCapsule,
    deleteCapsule,
    subscribeToDeliveries,
  } = useTimeCapsule();

  const [selectedCapsule, setSelectedCapsule] = useState<any>(null);
  const [isOpening, setIsOpening] = useState(false);

  // Subscribe to new deliveries
  useEffect(() => {
    const unsubscribe = subscribeToDeliveries((capsule) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#a855f7', '#f472b6'],
      });
    });

    return unsubscribe;
  }, [subscribeToDeliveries]);

  const handleOpenCapsule = async (capsule: any) => {
    setSelectedCapsule(capsule);
    setIsOpening(true);

    if (!capsule.is_opened) {
      // Dramatic opening animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      await openCapsule(capsule.id);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#a855f7', '#f472b6', '#fbbf24'],
      });
    }

    setIsOpening(false);
  };

  const handleDeletePending = async (capsuleId: string) => {
    if (confirm('Are you sure you want to delete this scheduled message?')) {
      await deleteCapsule(capsuleId);
    }
  };

  if (receivedCapsules.length === 0 && pendingCapsules.length === 0 && deliveredSentCapsules.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-purple-500" />
              Time Capsules
            </div>
            {unopenedCount > 0 && (
              <Badge className="bg-pink-500 text-white animate-pulse">
                {unopenedCount} new
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="received">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="received" className="text-xs">
                Received {receivedCapsules.length > 0 && `(${receivedCapsules.length})`}
              </TabsTrigger>
              <TabsTrigger value="sent" className="text-xs">
                Sent {pendingCapsules.length > 0 && `(${pendingCapsules.length} pending)`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received">
              {receivedCapsules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No time capsules received yet. {partnerName} might be planning something special! 💝
                </p>
              ) : (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {receivedCapsules.map((capsule) => (
                      <motion.button
                        key={capsule.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpenCapsule(capsule)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          capsule.is_opened
                            ? 'border-border bg-card/50'
                            : 'border-pink-400 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-950/40 dark:to-purple-950/40 animate-pulse'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            capsule.is_opened
                              ? 'bg-muted'
                              : 'bg-gradient-to-br from-pink-500 to-purple-500'
                          }`}>
                            {capsule.is_opened ? (
                              <Heart className="w-5 h-5 text-pink-500" />
                            ) : (
                              <Gift className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {capsule.is_opened ? 'Love letter' : '✨ Unopened Time Capsule!'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Sent {formatDistanceToNow(new Date(capsule.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {!capsule.is_opened && (
                            <Sparkles className="w-4 h-4 text-yellow-500 animate-bounce" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="sent">
              {pendingCapsules.length === 0 && deliveredSentCapsules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No time capsules sent yet. Create one to surprise {partnerName}! 💌
                </p>
              ) : (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {pendingCapsules.map((capsule) => (
                      <div
                        key={capsule.id}
                        className="p-3 rounded-xl border bg-card"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Scheduled</p>
                              <p className="text-[10px] text-muted-foreground">
                                Delivers {format(new Date(capsule.deliver_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePending(capsule.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          "{capsule.message.slice(0, 100)}..."
                        </p>
                      </div>
                    ))}
                    {deliveredSentCapsules.map((capsule) => (
                      <div
                        key={capsule.id}
                        className="p-3 rounded-xl border bg-green-50/50 dark:bg-green-950/20 border-green-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Send className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm flex items-center gap-1">
                              Delivered
                              {capsule.is_opened && (
                                <Badge variant="outline" className="text-[10px] ml-1">Opened</Badge>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(capsule.delivered_at!), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Opening Dialog */}
      <Dialog open={!!selectedCapsule} onOpenChange={() => setSelectedCapsule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              Love Letter from {partnerName}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {isOpening ? (
              <motion.div
                key="opening"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center gap-4"
              >
                <motion.div
                  animate={{ 
                    rotateY: [0, 180, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 1.5 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center"
                >
                  <Gift className="w-10 h-10 text-white" />
                </motion.div>
                <p className="text-muted-foreground animate-pulse">Opening your time capsule...</p>
              </motion.div>
            ) : selectedCapsule && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
                  <p className="text-xs text-muted-foreground mb-2">
                    Written {formatDistanceToNow(new Date(selectedCapsule.created_at), { addSuffix: true })}
                  </p>
                  <p className="whitespace-pre-wrap">{selectedCapsule.message}</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    Waited {formatDistanceToNow(new Date(selectedCapsule.created_at))} to reach you
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};
