import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import smallCircleIcon from "@/assets/small-circle-icon.svg";
import muscleIcon from "@/assets/muscle-icon.svg";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const PENDING_EMAIL_KEY = "pushit:pendingSignupEmail";

const AuthPage = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState(() => localStorage.getItem(PENDING_EMAIL_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showContent, setShowContent] = useState(() => sessionStorage.getItem("splashShown") === "true");
  const { signIn, signUp, verifySignupOtp, resendSignupOtp, user } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          localStorage.setItem(PENDING_EMAIL_KEY, email);
          setStep("verify");
          setOtp("");
          toast.success("We sent a 6-digit code to your email.");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else if (error.message.toLowerCase().includes("not confirmed")) {
            // Account exists but unverified — resend OTP and jump to verify step.
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
        // Navigation happens via the user effect once session arrives.
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-top">
      {showContent && (
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src={smallCircleIcon} alt="" className="w-20 h-20 mb-4" />
          <h1 className="font-black text-white text-2xl">Push It</h1>
          <p className="text-muted-foreground mt-2">
            {step === "verify" ? "Enter your code" : "Welcome, push Buddy!"}
          </p>
        </div>

        <div className="bg-card/40 rounded-2xl p-6">
          {step === "form" ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 h-12 bg-transparent border-0 border-b border-[#EEEEEE] text-foreground placeholder:text-muted-foreground mb-[20px]"
                    required
                  />
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
                  />
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
                >
                  {isSubmitting ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
                </Button>

                {mode === "signin" && (
                  <div className="text-center">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {mode === "signin"
                    ? "New here? Create an account"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          ) : (
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
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                  }}
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
