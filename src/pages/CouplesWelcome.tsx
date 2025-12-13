import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, UserPlus, Sparkles, Copy, Check, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCouplesAccount } from '@/hooks/useCouplesAccount';
import { useToast } from '@/hooks/use-toast';

const CouplesWelcome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const {
    partnerLink,
    isLinked,
    pendingInvites,
    createInvite,
    acceptInvite,
    isCreatingInvite,
    isAcceptingInvite,
  } = useCouplesAccount();

  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  const latestInvite = pendingInvites[0];

  // Auto-create invite for authenticated users who don't have one
  useEffect(() => {
    if (user && !isLinked && pendingInvites.length === 0 && !isCreatingInvite) {
      createInvite(undefined);
    }
  }, [user, isLinked, pendingInvites.length, isCreatingInvite]);

  const handleCopyCode = async () => {
    if (latestInvite) {
      await navigator.clipboard.writeText(latestInvite.invite_code);
      setCopied(true);
      toast({ title: "Copied!", description: "Share this code with your partner" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (latestInvite && navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Luna Couples',
          text: `Use my invite code to join Luna Couples: ${latestInvite.invite_code}`,
          url: `${window.location.origin}/couples-welcome?code=${latestInvite.invite_code}`,
        });
      } catch (e) {
        // User cancelled or share failed, fall back to copy
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handleAcceptInvite = () => {
    if (inviteCode.trim()) {
      acceptInvite(inviteCode.trim());
      setInviteCode('');
    }
  };

  // Check for invite code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setInviteCode(code.toUpperCase());
      setShowJoinForm(true);
    }
  }, []);

  // If partner is already linked, show success and redirect
  if (isLinked) {
    return (
      <div className="min-h-screen bg-couples-gradient text-white flex flex-col items-center justify-center px-6 py-16">
        <div className="couples-glow absolute inset-0 pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border border-green-500/30">
              <Check className="w-12 h-12 text-green-400" />
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold mb-4 text-white">You're Connected! 💕</h1>
          <p className="text-lg text-white/70 mb-8">
            You and your partner are now linked. Start exploring together!
          </p>

          <Button
            onClick={() => navigate('/couples')}
            size="lg"
            className="bg-couples-accent hover:bg-couples-accent/90 text-background font-semibold px-8 py-6 text-lg rounded-full w-full"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Exploring Together
          </Button>
        </motion.div>
      </div>
    );
  }

  // Not logged in - show auth prompt
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-couples-gradient text-white flex flex-col items-center justify-center px-6 py-16">
        <div className="couples-glow absolute inset-0 pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-couples-accent/20 border border-couples-accent/30">
              <Heart className="w-12 h-12 text-couples-accent" fill="currentColor" />
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold mb-4 text-white">Welcome to Luna Couples 💕</h1>
          <p className="text-lg text-white/70 mb-8">
            Create an account to start your journey together.
          </p>

          <div className="space-y-4">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-couples-accent hover:bg-couples-accent/90 text-background font-semibold px-8 py-6 text-lg rounded-full w-full"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Create Account
            </Button>

            {showJoinForm && inviteCode && (
              <div className="mt-6 p-4 bg-white/10 rounded-xl">
                <p className="text-sm text-white/70 mb-2">You have an invite code:</p>
                <p className="font-mono text-xl tracking-widest text-couples-accent mb-3">{inviteCode}</p>
                <p className="text-xs text-white/50">Create an account to accept this invite</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Logged in - show invite flow
  return (
    <div className="min-h-screen bg-couples-gradient text-white flex flex-col items-center justify-center px-6 py-16">
      <div className="couples-glow absolute inset-0 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center z-10 max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-couples-accent/20 border border-couples-accent/30">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="w-10 h-10 text-couples-accent" fill="currentColor" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl font-bold mb-2 text-white"
        >
          Your journey together starts now 💕
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/70 mb-8"
        >
          Invite your partner to join your couples account
        </motion.p>

        {/* Invite Code Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6"
        >
          <h3 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-3">
            Your Partner's Invite Code
          </h3>
          
          {isCreatingInvite ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-couples-accent" />
            </div>
          ) : latestInvite ? (
            <>
              <div className="bg-white/10 rounded-xl px-6 py-4 mb-4">
                <p className="font-mono text-3xl tracking-[0.3em] text-white font-bold">
                  {latestInvite.invite_code}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
                
                <Button
                  onClick={handleShare}
                  className="flex-1 bg-couples-accent hover:bg-couples-accent/90 text-background"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
              
              <p className="text-xs text-white/50 mt-4">
                Your partner enters this code after creating their account
              </p>
            </>
          ) : (
            <Button
              onClick={() => createInvite(undefined)}
              className="w-full bg-couples-accent hover:bg-couples-accent/90 text-background"
            >
              Generate Invite Code
            </Button>
          )}
        </motion.div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-4 text-white/40">or join your partner</span>
          </div>
        </div>

        {/* Accept Invite Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6"
        >
          <h3 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-3">
            Have a code from your partner?
          </h3>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider text-center bg-white/10 border-white/20 text-white placeholder:text-white/40"
              maxLength={8}
            />
            <Button
              onClick={handleAcceptInvite}
              disabled={!inviteCode.trim() || isAcceptingInvite}
              className="bg-couples-accent hover:bg-couples-accent/90 text-background px-6"
            >
              {isAcceptingInvite ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Join'
              )}
            </Button>
          </div>
        </motion.div>

        {/* Skip to explore */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Button
            onClick={() => navigate('/couples')}
            variant="ghost"
            className="text-white/50 hover:text-white hover:bg-white/10"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Skip for now & explore features
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CouplesWelcome;
