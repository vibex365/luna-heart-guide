import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Copy, Check, UserPlus, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { useToast } from "@/hooks/use-toast";

export const PartnerInviteCard = () => {
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const {
    pendingInvites,
    createInvite,
    acceptInvite,
    isCreatingInvite,
    isAcceptingInvite,
  } = useCouplesAccount();

  const latestInvite = pendingInvites[0];

  const handleCopyCode = async () => {
    if (latestInvite) {
      await navigator.clipboard.writeText(latestInvite.invite_code);
      setCopied(true);
      toast({ title: "Copied!", description: "Invite code copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAcceptInvite = () => {
    if (inviteCode.trim()) {
      acceptInvite(inviteCode.trim());
      setInviteCode("");
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Connect with Partner</CardTitle>
            <CardDescription>Link your accounts for shared features</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Invite Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Send an Invite</h4>
          {latestInvite ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-center">
                  {latestInvite.invite_code}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                onClick={() => createInvite(undefined)}
                disabled={isCreatingInvite}
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
              >
                {isCreatingInvite ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Generate New Code
              </Button>
            </motion.div>
          ) : (
            <Button
              onClick={() => createInvite(undefined)}
              disabled={isCreatingInvite}
              className="w-full"
              variant="outline"
            >
              {isCreatingInvite ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Generate Invite Code
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Share this code with your partner to connect your accounts
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Accept Invite Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Have an Invite Code?</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code (e.g., ABC12345)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider"
              maxLength={8}
            />
            <Button
              onClick={handleAcceptInvite}
              disabled={!inviteCode.trim() || isAcceptingInvite}
            >
              {isAcceptingInvite ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
