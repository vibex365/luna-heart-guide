import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LunaAvatar from "@/components/LunaAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";
import { PhoneInput, CountryCode } from "@/components/ui/phone-input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/, "Please enter a valid phone number");

type SignupStep = "credentials" | "phone" | "verify";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string }>({});
  
  // Signup with phone verification state
  const [signupStep, setSignupStep] = useState<SignupStep>("credentials");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rawPhoneNumber, setRawPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/chat");
    return null;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; phone?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePhone = () => {
    try {
      phoneSchema.parse(phoneNumber);
      setErrors({});
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors({ phone: e.errors[0].message });
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back! 💜",
            description: "Luna is ready to talk.",
          });
          navigate("/chat");
        }
      } else {
        // For signup, move to phone step
        setSignupStep("phone");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (fullNumber: string, rawNumber: string, countryCode: CountryCode) => {
    setPhoneNumber(fullNumber);
    setRawPhoneNumber(rawNumber);
  };

  const handleSendVerification = async () => {
    if (!validatePhone()) return;

    setSendingCode(true);
    try {
      // First create the account
      const { data, error } = await signUp(email, password);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Try logging in instead.",
            variant: "destructive",
          });
          setSignupStep("credentials");
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (!data?.user?.id) {
        toast({
          title: "Error",
          description: "Failed to create account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPendingUserId(data.user.id);

      // Send verification code
      const { error: smsError } = await supabase.functions.invoke("send-sms", {
        body: {
          action: "send-verification",
          userId: data.user.id,
          phoneNumber: phoneNumber,
        },
      });

      if (smsError) {
        toast({
          title: "Failed to send code",
          description: "Please check your phone number and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Code sent! 📱",
        description: "Check your phone for the verification code.",
      });
      
      setSignupStep("verify");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6 || !pendingUserId) return;

    setVerifying(true);
    try {
      // Verify the code
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("send-sms", {
        body: {
          action: "verify-code",
          userId: pendingUserId,
          phoneNumber: phoneNumber,
          code: verificationCode,
        },
      });

      if (verifyError || !verifyData?.success) {
        toast({
          title: "Invalid code",
          description: "Please check the code and try again.",
          variant: "destructive",
        });
        return;
      }

      // Send welcome SMS with credentials
      await supabase.functions.invoke("send-sms", {
        body: {
          action: "send-welcome",
          phoneNumber: phoneNumber,
          email: email,
          password: password,
        },
      });

      toast({
        title: "Account created! 💜",
        description: "Welcome SMS sent with your login details.",
      });
      
      navigate("/onboarding");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingUserId) return;
    
    setSendingCode(true);
    try {
      const { error } = await supabase.functions.invoke("send-sms", {
        body: {
          action: "send-verification",
          userId: pendingUserId,
          phoneNumber: phoneNumber,
        },
      });

      if (error) {
        toast({
          title: "Failed to resend",
          description: "Please wait a moment and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code resent! 📱",
          description: "Check your phone for the new code.",
        });
      }
    } finally {
      setSendingCode(false);
    }
  };

  const renderCredentialsStep = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground text-sm">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl border-border bg-background"
          disabled={loading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground text-sm">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl border-border bg-background"
          disabled={loading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="peach"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? "Please wait..." : isLogin ? "Sign In" : "Continue"}
      </Button>
    </form>
  );

  const renderPhoneStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-foreground text-sm">
          Phone Number
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          We'll send you a verification code and your login details via SMS
        </p>
        <PhoneInput
          value={phoneNumber}
          onChange={handlePhoneChange}
          disabled={sendingCode}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
      </div>

      <Button
        type="button"
        variant="peach"
        size="lg"
        className="w-full"
        onClick={handleSendVerification}
        disabled={sendingCode || rawPhoneNumber.length < 7}
      >
        {sendingCode ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending code...
          </>
        ) : (
          "Send Verification Code"
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => setSignupStep("credentials")}
      >
        Back
      </Button>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to
        </p>
        <p className="font-medium text-foreground">{phoneNumber}</p>
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
        type="button"
        variant="peach"
        size="lg"
        className="w-full"
        onClick={handleVerifyCode}
        disabled={verifying || verificationCode.length !== 6}
      >
        {verifying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify & Create Account"
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={sendingCode}
          className="text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          {sendingCode ? "Sending..." : "Resend code"}
        </button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => setSignupStep("phone")}
      >
        Change phone number
      </Button>
    </div>
  );

  const getStepTitle = () => {
    if (isLogin) return "Welcome Back";
    switch (signupStep) {
      case "credentials": return "Create Your Safe Space";
      case "phone": return "Verify Your Phone";
      case "verify": return "Enter Verification Code";
    }
  };

  const getStepSubtitle = () => {
    if (isLogin) return "Luna remembers your journey. Let's continue.";
    switch (signupStep) {
      case "credentials": return "Start your healing journey with Luna.";
      case "phone": return "We'll text you your login details.";
      case "verify": return "Almost there! Just one more step.";
    }
  };

  return (
    <MobileOnlyLayout hideTabBar>
      <div className="min-h-screen gradient-hero flex flex-col safe-area-top">
        {/* Header */}
        <header className="px-6 py-4">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/")}
          >
            <LunaAvatar size="sm" showGlow={false} />
            <span className="font-heading font-bold text-xl text-foreground">LUNA</span>
          </motion.div>
        </header>

        {/* Auth Form */}
        <main className="flex-1 flex items-center justify-center px-6 pb-10">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-card rounded-3xl p-6 shadow-luna border border-border">
              <div className="text-center mb-6">
                <LunaAvatar size="lg" className="mx-auto mb-4" />
                <h1 className="font-heading text-xl font-bold text-foreground mb-2">
                  {getStepTitle()}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {getStepSubtitle()}
                </p>
              </div>

              {isLogin ? (
                renderCredentialsStep()
              ) : (
                <>
                  {signupStep === "credentials" && renderCredentialsStep()}
                  {signupStep === "phone" && renderPhoneStep()}
                  {signupStep === "verify" && renderVerifyStep()}
                </>
              )}

              {(isLogin || signupStep === "credentials") && (
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                      setSignupStep("credentials");
                    }}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm"
                  >
                    {isLogin
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Your conversations are private and encrypted. 💜
            </p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <span className="text-muted-foreground/50">•</span>
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    </MobileOnlyLayout>
  );
};

export default Auth;