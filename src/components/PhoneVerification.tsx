import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ChevronRight, Check, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Common country codes
const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
  { code: "+1", country: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+34", country: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "+39", country: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "+31", country: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "+46", country: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", country: "NO", flag: "🇳🇴", name: "Norway" },
  { code: "+45", country: "DK", flag: "🇩🇰", name: "Denmark" },
  { code: "+41", country: "CH", flag: "🇨🇭", name: "Switzerland" },
  { code: "+43", country: "AT", flag: "🇦🇹", name: "Austria" },
  { code: "+32", country: "BE", flag: "🇧🇪", name: "Belgium" },
  { code: "+353", country: "IE", flag: "🇮🇪", name: "Ireland" },
  { code: "+64", country: "NZ", flag: "🇳🇿", name: "New Zealand" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+82", country: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+27", country: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "UAE" },
  { code: "+65", country: "SG", flag: "🇸🇬", name: "Singapore" },
  { code: "+852", country: "HK", flag: "🇭🇰", name: "Hong Kong" },
  { code: "+972", country: "IL", flag: "🇮🇱", name: "Israel" },
  { code: "+48", country: "PL", flag: "🇵🇱", name: "Poland" },
  { code: "+420", country: "CZ", flag: "🇨🇿", name: "Czech Republic" },
];

interface PhoneVerificationProps {
  userId: string;
  onVerified: (phoneNumber: string) => void;
  onSkip?: () => void;
  initialPhone?: string;
  initialCountryCode?: string;
  showSkip?: boolean;
}

export const PhoneVerification = ({
  userId,
  onVerified,
  onSkip,
  initialPhone = "",
  initialCountryCode = "+1",
  showSkip = false,
}: PhoneVerificationProps) => {
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [countryCode, setCountryCode] = useState(
    countryCodes.find(c => c.code === initialCountryCode) || countryCodes[0]
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Format phone number for display based on length
  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    // US/Canada format
    if (countryCode.code === "+1") {
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    // Generic international format - just add spaces
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow different lengths for different countries
    const maxLength = countryCode.code === "+1" ? 10 : 12;
    const value = e.target.value.replace(/\D/g, "").slice(0, maxLength);
    setPhoneNumber(value);
  };

  const getMinPhoneLength = () => {
    // US/Canada requires 10 digits, others are more flexible
    return countryCode.code === "+1" ? 10 : 7;
  };

  const sendVerificationCode = async () => {
    if (phoneNumber.length < getMinPhoneLength()) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = `${countryCode.code}${phoneNumber}`;

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
      const formattedPhone = `${countryCode.code}${phoneNumber}`;

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
              <div className="flex gap-2">
                {/* Country Code Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 px-3 flex items-center gap-1 min-w-[100px]"
                    >
                      <span className="text-lg">{countryCode.flag}</span>
                      <span className="text-sm">{countryCode.code}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
                    {countryCodes.map((cc) => (
                      <DropdownMenuItem
                        key={`${cc.country}-${cc.code}`}
                        onClick={() => setCountryCode(cc)}
                        className="flex items-center gap-2"
                      >
                        <span className="text-lg">{cc.flag}</span>
                        <span className="flex-1">{cc.name}</span>
                        <span className="text-muted-foreground">{cc.code}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Phone Number Input */}
                <Input
                  id="phone"
                  type="tel"
                  placeholder={countryCode.code === "+1" ? "(555) 123-4567" : "1234 567 890"}
                  value={formatPhoneDisplay(phoneNumber)}
                  onChange={handlePhoneChange}
                  className="h-12 text-lg flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll send you a verification code via SMS
              </p>
            </div>

            <Button
              variant="peach"
              size="lg"
              onClick={sendVerificationCode}
              disabled={phoneNumber.length < getMinPhoneLength() || isLoading}
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
                Enter the 6-digit code sent to {countryCode.code} {formatPhoneDisplay(phoneNumber)}
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
