import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ChevronRight, Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PhoneVerificationProps {
  userId: string;
  onVerified: (phoneNumber: string) => void;
  onSkip?: () => void;
  initialPhone?: string;
  showSkip?: boolean;
}

export const PhoneVerification = ({
  userId,
  onVerified,
  onSkip,
  initialPhone = "",
  showSkip = false,
}: PhoneVerificationProps) => {
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Format phone number for display
  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(value);
  };

  const sendVerificationCode = async () => {
    if (phoneNumber.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Format as E.164 (assuming US numbers for now)
      const formattedPhone = `+1${phoneNumber}`;

      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          action: "send-verification",
          userId,
          phoneNumber: formattedPhone,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStep("verify");
      toast({
        title: "Code sent! 📱",
        description: "Check your phone for the verification code.",
      });

      // Start cooldown for resend
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Failed to send code",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = `+1${phoneNumber}`;

      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: {
          action: "verify-code",
          userId,
          phoneNumber: formattedPhone,
          code: verificationCode,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Phone verified! 🎉",
        description: "You'll now receive SMS notifications.",
      });

      onVerified(formattedPhone);
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0) return;
    await sendVerificationCode();
  };

  return (
    <div className="w-full space-y-6">
      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl gradient-luna flex items-center justify-center mx-auto">
                <Phone className="w-7 h-7 text-accent" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                Add Your Phone Number
              </h2>
              <p className="text-muted-foreground text-sm">
                Get SMS notifications when your partner completes activities.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  +1
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formatPhoneDisplay(phoneNumber)}
                  onChange={handlePhoneChange}
                  className="h-12 pl-10 text-lg"
                  maxLength={14}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll send you a verification code
              </p>
            </div>

            <Button
              variant="peach"
              size="lg"
              onClick={sendVerificationCode}
              disabled={phoneNumber.length < 10 || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send Code
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>

            {showSkip && onSkip && (
              <button
                onClick={onSkip}
                className="w-full text-muted-foreground hover:text-accent text-sm transition-colors py-2"
              >
                Skip for now
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-green-500" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                Verify Your Phone
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter the 6-digit code sent to +1 {formatPhoneDisplay(phoneNumber)}
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              variant="peach"
              size="lg"
              onClick={verifyCode}
              disabled={verificationCode.length !== 6 || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify
                  <Check className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={resendCode}
                disabled={cooldown > 0 || isLoading}
                className="text-sm text-muted-foreground hover:text-accent transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>

            <button
              onClick={() => {
                setStep("phone");
                setVerificationCode("");
              }}
              className="w-full text-muted-foreground hover:text-accent text-sm transition-colors py-2"
            >
              Change phone number
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
