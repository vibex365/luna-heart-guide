import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Headphones, Info, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { VoiceSessionButton } from "@/components/voice/VoiceSessionButton";
import { MinutesWalletCard } from "@/components/voice/MinutesWalletCard";
import { MinutesPurchaseModal } from "@/components/voice/MinutesPurchaseModal";
import { VoiceSessionHistory } from "@/components/voice/VoiceSessionHistory";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { useMinutesWallet } from "@/hooks/useMinutesWallet";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";

const LunaVoice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const { hasMinutes, refreshMinutes } = useMinutesWallet();

  const {
    status,
    durationSeconds,
    isLunaSpeaking,
    transcript,
    lunaResponse,
    startSession,
    endSession,
    isConnecting,
    isActive,
    isEnding
  } = useVoiceSession();

  // Handle purchase success from URL params
  useEffect(() => {
    const purchaseStatus = searchParams.get('purchase');
    if (purchaseStatus === 'success') {
      toast({
        title: "Minutes Added!",
        description: "Your Luna Voice minutes have been added to your account."
      });
      refreshMinutes();
      // Clean up URL
      navigate('/luna-voice', { replace: true });
    } else if (purchaseStatus === 'cancelled') {
      toast({
        title: "Purchase Cancelled",
        description: "No changes were made to your account."
      });
      navigate('/luna-voice', { replace: true });
    }
  }, [searchParams, toast, refreshMinutes, navigate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/luna-voice');
    }
  }, [user, loading, navigate]);

  const handleStartSession = async () => {
    const result = await startSession('solo');
    if (result?.needsMinutes) {
      setShowPurchaseModal(true);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <MobileOnlyLayout hideTabBar>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      </MobileOnlyLayout>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!user) {
    return (
      <MobileOnlyLayout hideTabBar>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
          <div className="animate-pulse text-primary">Redirecting to login...</div>
        </div>
      </MobileOnlyLayout>
    );
  }

  return (
    <MobileOnlyLayout hideTabBar>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" />
              Luna Voice
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Minutes Wallet */}
          <MinutesWalletCard onPurchase={() => setShowPurchaseModal(true)} />

          {/* Voice Session Area */}
          <Card className="border-2 border-primary/20">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                <VoiceSessionButton
                  isConnecting={isConnecting}
                  isActive={isActive}
                  isEnding={isEnding}
                  isLunaSpeaking={isLunaSpeaking}
                  durationSeconds={durationSeconds}
                  onStart={handleStartSession}
                  onEnd={endSession}
                  disabled={!hasMinutes && status === 'idle'}
                  size="large"
                />

                {/* Transcript Display */}
                <AnimatePresence>
                  {isActive && (lunaResponse || transcript) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="mt-8 w-full max-w-md"
                    >
                      {lunaResponse && (
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Luna</span>
                          </div>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                            {lunaResponse.slice(-500)}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          {status === 'idle' && (
            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Voice Session Tips</h3>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      <li>• Speak naturally - Luna will respond when you pause</li>
                      <li>• Sessions are billed per minute ($0.25/min)</li>
                      <li>• Use a quiet environment for best results</li>
                      <li>• Tap the red button to end your session</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session History */}
          <VoiceSessionHistory />
        </main>

        {/* Purchase Modal */}
        <MinutesPurchaseModal 
          open={showPurchaseModal} 
          onOpenChange={setShowPurchaseModal} 
        />
      </div>
    </MobileOnlyLayout>
  );
};

export default LunaVoice;
