import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import smallCircleIcon from "@/assets/small-circle-icon.svg";
import muscleIcon from "@/assets/muscle-icon.svg";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const PENDING_EMAIL_KEY = "pushit:pendingSignupEmail";

type Step = "email" | "signin" | "signup" | "verify";

const AuthPage = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(() => localStorage.getItem(PENDING_EMAIL_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showContent, setShowContent] = useState(() => sessionStorage.getItem("splashShown") === "true");
  const { signIn, signUp, verifySignupOtp, resendSignupOtp, checkEmailExists, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (showContent) return;
    const interval = setInterval(() => {
      if (sessionStorage.getItem("splashShown") === "true") {
        setShowContent(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [showContent]);

  useEffect(() => {
    if (user) {
      localStorage.removeItem(PENDING_EMAIL_KEY);
      navigate("/");
    }
  }, [user, navigate]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }
    setIsSubmitting(true);
    try {
      const { exists, error } = await checkEmailExists(email);
      if (error) {
        toast.error("Could not verify email. Please try again.");
        return;
      }
      setPassword("");
      setStep(exists ? "signin" : "signup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else if (error.message.toLowerCase().includes("not confirmed")) {
          await resendSignupOtp(email);
          localStorage.setItem(PENDING_EMAIL_KEY, email);
          setStep("verify");
          setOtp("");
          toast.message("Almost there", { description: "Enter the 6-digit code we just emailed you." });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Welcome, push Buddy!");
        navigate("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        localStorage.setItem(PENDING_EMAIL_KEY, email);
        setStep("verify");
        setOtp("");
        toast.success("We sent a 6-digit code to your email.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return;
    setIsSubmitting(true);
    try {
      const { error } = await verifySignupOtp(email, code);
      if (error) {
        toast.error(error.message || "Invalid or expired code");
        setOtp("");
      } else {
        localStorage.removeItem(PENDING_EMAIL_KEY);
        toast.success("Welcome, push Buddy!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const { error } = await resendSignupOtp(email);
      if (error) toast.error(error.message);
      else toast.success("New code sent.");
    } finally {
      setIsResending(false);
    }
  };

  const resetToEmail = () => {
    setStep("email");
    setPassword("");
    setOtp("");
  };

  const handleTryDemo = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-demo-account", { body: {} });
      if (error || !data?.email || !data?.password) {
        toast.error("Could not start demo. Please try again.");
        return;
      }
      const { error: signInErr } = await signIn(data.email, data.password);
      if (signInErr) {
        toast.error(signInErr.message);
        return;
      }
      toast.success("Demo account ready — expires in 5 days.");
      navigate("/welcome");
    } finally {
      setIsSubmitting(false);
    }
  };


  const headerSubtitle =
    step === "verify"
      ? "Enter your code"
      : step === "signin"
      ? "Welcome back!"
      : step === "signup"
      ? "Let's set up your account"
      : "Welcome, push Buddy!";

  const passwordValid = passwordSchema.safeParse(password).success;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-top">
      {showContent && (
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src={smallCircleIcon} alt="" className="w-20 h-20 mb-4" />
          <h1 className="font-black text-white text-2xl">Push It</h1>
          <p className="text-muted-foreground mt-2">{headerSubtitle}</p>
        </div>

        <div className="bg-transparent rounded-2xl p-6">
          {step === "email" && (
            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 h-12 bg-transparent border-0 border-b border-[#EEEEEE] text-foreground placeholder:text-muted-foreground mb-[20px]"
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
              >
                {isSubmitting ? "Checking..." : "Continue"}
              </Button>
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleTryDemo}
                  disabled={isSubmitting}
                  className="text-sm text-white underline decoration-white hover:text-primary disabled:opacity-50"
                >
                  Try the demo (no signup)
                </button>
                <p className="text-xs text-muted-foreground mt-2">
                  Explore every feature. Nothing is saved to the real leaderboard.
                </p>
              </div>
            </form>
          )}

          {(step === "signin" || step === "signup") && (
            <form
              onSubmit={step === "signin" ? handleSignIn : handleCreateAccount}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="mt-1.5 flex items-center justify-between text-sm h-12 border-b border-[#EEEEEE] mb-[20px]">
                  <span className="text-foreground truncate">{email}</span>
                  <button
                    type="button"
                    onClick={resetToEmail}
                    className="text-muted-foreground hover:text-primary hover:underline shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 h-12 bg-transparent border-0 border-b border-[#EEEEEE] text-foreground placeholder:text-muted-foreground mb-[20px]"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting || (step === "signup" && !passwordValid)}
                className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white disabled:opacity-50"
              >
                {isSubmitting
                  ? "Please wait..."
                  : step === "signin"
                  ? "Sign In"
                  : "Create Account"}
              </Button>

              {step === "signin" && (
                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-white underline decoration-white hover:text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </form>
          )}

          {step === "verify" && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground text-center">
                We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>.
              </p>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(v) => {
                    setOtp(v);
                    if (v.length === 6) handleVerify(v);
                  }}
                  disabled={isSubmitting}
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
                variant="outline"
                disabled={isSubmitting || otp.length !== 6}
                onClick={() => handleVerify(otp)}
                className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
              >
                {isSubmitting ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={resetToEmail}
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  ← Wrong email?
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-muted-foreground hover:text-primary hover:underline disabled:opacity-50"
                >
                  {isResending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-muted-foreground/50 text-xs mt-8 flex items-center justify-center gap-1">
          Track your way to 30,000 push-ups <img src={muscleIcon} alt="" className="w-4 h-4 inline" />
        </p>
      </div>
      )}
    </div>
  );
};

export default AuthPage;
