import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import LandingPage from "@/pages/LandingPage";
import CreatePage from "@/pages/CreatePage";
import LibraryPage from "@/pages/LibraryPage";
import RemixPage from "@/pages/RemixPage";
import OutputPage from "@/pages/OutputPage";
import SettingsPage from "@/pages/SettingsPage";
import BillingPage from "@/pages/BillingPage";
import OnboardingPage from "@/pages/OnboardingPage";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--tim-bg)" }}>
      <div className="animate-spin w-8 h-8 border-2 border-[var(--tim-accent)] border-t-transparent rounded-full" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<LandingPage />} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

        <Route element={<Layout />}>
          <Route path="/create" element={<RequireAuth><CreatePage /></RequireAuth>} />
          <Route path="/library" element={<RequireAuth><LibraryPage /></RequireAuth>} />
          <Route path="/remix" element={<RequireAuth><RemixPage /></RequireAuth>} />
          <Route path="/output" element={<RequireAuth><OutputPage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/billing" element={<RequireAuth><BillingPage /></RequireAuth>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="bottom-right" toastOptions={{ style: { background: "#111B24", border: "1px solid #1E2D3A", color: "#E8EFF4" } }} />
    </>
  );
}
