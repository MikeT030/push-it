import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        setSent(true);
        toast.success("Check your email for the reset link.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-top">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-gradient">Push-it</h1>
          <p className="text-muted-foreground mt-2">Reset your password</p>
        </div>

        <div className="card-glass rounded-2xl p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-foreground">
                If an account exists for <span className="font-medium">{email}</span>, a password reset link has been sent.
              </p>
              <p className="text-sm text-muted-foreground">
                Don't forget to check your spam folder.
              </p>
              <Link
                to="/auth"
                className="inline-block text-primary font-medium hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
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
                    className="mt-1.5 h-12 bg-transparent border-0 border-b border-[#EEEEEE] text-foreground placeholder:text-muted-foreground mb-[12px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/auth"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
