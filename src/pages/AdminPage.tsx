import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const AdminPage = () => {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-32 safe-top">
      <div className="px-6 pt-12">
        <header className="mb-8 animate-fade-in flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Admin
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Restricted area
            </p>
          </div>
        </header>

        <div className="card-glass rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Welcome, admin</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            This is the admin area. Admin tools and controls will live here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
