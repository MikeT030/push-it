import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import smallCircleIcon from "@/assets/small-circle-icon.svg";
import muscleIcon from "@/assets/muscle-icon.svg";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContent, setShowContent] = useState(() => sessionStorage.getItem("splashShown") === "true");
  const { signIn, signUp, user } = useAuth();
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
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
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
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome, push Buddy!");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Try logging in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! You're now logged in.");
          navigate("/");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-top">
      {showContent && (
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo / Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src={smallCircleIcon} alt="" className="w-20 h-20 mb-4" />
          <h1 className="font-black text-white text-2xl">Push It</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Welcome, push Buddy!" : "30K Push Ups – 1 Year"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card/40 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
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
              <label className="text-sm font-medium text-muted-foreground">
                Password
              </label>
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
              className="w-full h-12 bg-[#48CAE4]/10 border-[#48CAE4] text-[#48CAE4] hover:bg-[#48CAE4] hover:text-white active:bg-[#48CAE4]/25 active:text-white"
            >
              {isSubmitting
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </Button>

            {isLogin && (
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

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-muted-foreground/50 text-xs mt-8 flex items-center justify-center gap-1">
          Track your way to 30,000 push-ups <img src={muscleIcon} alt="" className="w-4 h-4 inline" />
        </p>
      </div>
      )}
    </div>
  );
};

export default AuthPage;
