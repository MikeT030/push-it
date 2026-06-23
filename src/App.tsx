import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useOnboarded } from "@/hooks/useOnboarded";
import { useGoalHit } from "@/hooks/useGoalHit";
import { GameProvider } from "@/contexts/GameContext";
import { AvatarSelectorProvider } from "@/contexts/AvatarSelectorContext";
import BottomNav from "./components/BottomNav";
import SplashScreen from "./components/SplashScreen";

// Reload once if a lazy chunk fails to load (stale hash after redeploy)
const lazyWithRetry = <T,>(factory: () => Promise<{ default: T }>) =>
  lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem("chunkReloaded");
      return mod;
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (
        msg.includes("Importing a module script failed") ||
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("error loading dynamically imported module")
      ) {
        if (!sessionStorage.getItem("chunkReloaded")) {
          sessionStorage.setItem("chunkReloaded", "1");
          window.location.reload();
          return new Promise(() => {}) as any;
        }
      }
      throw err;
    }
  });


const DailyPage = lazyWithRetry(() => import("./pages/DailyPage"));
const TotalPage = lazyWithRetry(() => import("./pages/TotalPage"));
const GroupPage = lazyWithRetry(() => import("./pages/GroupPage"));
const ProfilePage = lazyWithRetry(() => import("./pages/ProfilePage"));
const AuthPage = lazyWithRetry(() => import("./pages/AuthPage"));
const ForgotPasswordPage = lazyWithRetry(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazyWithRetry(() => import("./pages/ResetPasswordPage"));
const AdminPage = lazyWithRetry(() => import("./pages/AdminPage"));
const WelcomePage = lazyWithRetry(() => import("./pages/WelcomePage"));
const WelcomePageV2 = lazyWithRetry(() => import("./pages/WelcomePageV2"));
const WelcomeRecalibratePage = lazyWithRetry(() => import("./pages/WelcomeRecalibratePage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { onboarded, isLoading: onboardedLoading } = useOnboarded();
  const { hit30k, isLoading: goalHitLoading } = useGoalHit();
  const location = useLocation();

  if (loading || (user && (onboardedLoading || goalHitLoading))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (onboarded === false && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" replace />;
  }

  if (hit30k && location.pathname !== "/welcome-v2") {
    return <Navigate to="/welcome-v2" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const showNav = user && ["/", "/daily", "/total", "/profile", "/group"].includes(location.pathname);

  const PageFallback = (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <Suspense fallback={PageFallback}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/welcome-v2"
          element={
            <ProtectedRoute>
              <WelcomePageV2 />
            </ProtectedRoute>
          }
        <Route
          path="/welcome-recalibrate"
          element={
            <ProtectedRoute>
              <WelcomeRecalibratePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TotalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily"
          element={
            <ProtectedRoute>
              <DailyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group"
          element={
            <ProtectedRoute>
              <GroupPage />
            </ProtectedRoute>
          }
        />
        <Route path="/total" element={<Navigate to="/" replace />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav && <BottomNav />}
    </Suspense>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AvatarSelectorProvider>
              <GameProvider>
                <AppContent />
              </GameProvider>
            </AvatarSelectorProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </>
  );

};

export default App;
