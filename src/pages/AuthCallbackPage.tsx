import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      // Supabase JS auto-detects tokens from URL hash/query and sets a session.
      // Wait briefly for that to settle, then route based on session state.
      try {
        // Give the SDK a tick to process the URL.
        await new Promise((r) => setTimeout(r, 50));
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          navigate("/", { replace: true });
        } else {
          // Listen briefly in case the token exchange is still in flight.
          const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
            if (session) {
              sub.subscription.unsubscribe();
              navigate("/", { replace: true });
            }
          });
          setTimeout(() => {
            sub.subscription.unsubscribe();
            if (!cancelled) {
              setMessage("Couldn't complete sign-in. Please sign in below.");
              toast.error("Verification link expired or already used. Please sign in.");
              navigate("/auth", { replace: true });
            }
          }, 2500);
        }
      } catch {
        if (!cancelled) navigate("/auth", { replace: true });
      }
    };

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground mt-4">{message}</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
