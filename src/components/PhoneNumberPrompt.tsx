import { useState } from "react";
import { Phone, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhoneVerification } from "./PhoneVerification";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PhoneNumberPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PhoneNumberPrompt = ({ open, onOpenChange }: PhoneNumberPromptProps) => {
  const { user } = useAuth();
  const [showVerification, setShowVerification] = useState(false);

  const handleVerificationComplete = () => {
    setShowVerification(false);
    onOpenChange(false);
  };

  if (showVerification && user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Verify Your Phone
            </DialogTitle>
          </DialogHeader>
          <PhoneVerification 
            userId={user.id} 
            onVerified={handleVerificationComplete}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Stay Connected with Your Partner
          </DialogTitle>
          <DialogDescription>
            Add your phone number to receive SMS notifications when your partner:
          </DialogDescription>
        </DialogHeader>
        
        <ul className="space-y-2 text-sm text-muted-foreground py-2">
          <li className="flex items-center gap-2">
            <span className="text-primary">💕</span> Logs their mood
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">🎮</span> Starts a game
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✅</span> Completes a challenge
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">🎯</span> Achieves a goal
          </li>
        </ul>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
          <Button
            className="flex-1"
            onClick={() => setShowVerification(true)}
          >
            Add Phone Number
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Re-export from dedicated hook file for backwards compatibility
export { usePhonePrompt } from "@/hooks/usePhonePrompt";
