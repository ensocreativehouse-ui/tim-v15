import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { trpc } from "@/providers/trpc";
import {
  Mic2, Library, GitBranch, FileOutput, Settings,
  CreditCard, Menu, Snowflake, LogOut, User, X,
  ChevronLeft, Crown, Zap, Sparkles, Infinity,
  Clock, AlertTriangle, Radio,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { path: "/create", label: "Create", icon: Mic2 },
  { path: "/library", label: "Library", icon: Library },
  { path: "/remix", label: "Remix", icon: GitBranch },
  { path: "/output", label: "Output", icon: FileOutput },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/billing", label: "Billing", icon: CreditCard },
];

// ─── Status Orb (Cube) ──────────────────────────────────────────────────────
function StatusOrb() {
  const { timStatus } = useStore();
  const isOnline = timStatus === "online";
  const isThinking = timStatus === "thinking";
  const isOffline = timStatus === "offline";
  const isConnecting = timStatus === "connecting";

  return (
    <div
      className="relative w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
      style={{
        background: isOnline ? "rgba(0,200,224,0.12)" : isOffline ? "rgba(239,68,68,0.1)" : "rgba(255,176,32,0.1)",
        border: `1px solid ${isOnline ? "rgba(0,200,224,0.3)" : isOffline ? "rgba(239,68,68,0.2)" : "rgba(255,176,32,0.2)"}`,
      }}
      title={isOnline ? "T.I.M. online" : isOffline ? "T.I.M. offline — check Settings" : isThinking ? "T.I.M. thinking..." : "Connecting..."}
    >
      <Radio className={`w-3.5 h-3.5 ${isOnline ? "text-[var(--tim-accent)]" : isOffline ? "text-[var(--tim-red)]" : "text-[var(--tim-amber)]"}`} />
      {/* Status dot */}
      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
        isOnline ? "bg-[var(--tim-accent)] animate-pulse" :
        isThinking ? "bg-[var(--tim-amber)] animate-pulse" :
        isOffline ? "bg-[var(--tim-red)]" :
        "bg-[var(--tim-amber)] animate-pulse"
      }`} style={isOnline ? { boxShadow: "0 0 6px var(--tim-accent)" } : {}} />
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen } = useStore();
  const { user, logout, tier, trialActive, trialDaysRemaining } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const showTrialBadge = trialActive && trialDaysRemaining > 0;

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 bg-[var(--tim-panel)] border-r border-[var(--tim-border)] ${sidebarOpen || !isMobile ? "w-64 translate-x-0" : "w-64 -translate-x-full"}`}>
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--tim-border)] flex-shrink-0">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
            <Snowflake className="w-6 h-6 text-[var(--tim-accent)] group-hover:rotate-45 transition-transform duration-300" />
            <div>
              <span className="font-semibold text-[var(--tim-text)] text-sm tracking-tight">T.I.M.</span>
              <span className="block text-[10px] text-[var(--tim-text-muted)] -mt-0.5">The Intent Method</span>
            </div>
          </button>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-md hover:bg-[var(--tim-panel-hover)] text-[var(--tim-text-secondary)]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Trial Badge */}
        {showTrialBadge && (
          <div className="mx-4 mt-3 p-3 rounded-lg flex-shrink-0" style={{ background: "rgba(255,176,32,0.08)", border: "1px solid rgba(255,176,32,0.15)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-[var(--tim-amber)]" />
              <span className="text-xs font-semibold text-[var(--tim-amber)]">Pro Trial Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--tim-text-muted)]">
              <Clock className="w-3 h-3" />
              <span>{trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining</span>
            </div>
            {trialDaysRemaining <= 2 && (
              <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[var(--tim-amber)]">
                <AlertTriangle className="w-3 h-3" /><span>Trial expires soon</span>
              </div>
            )}
          </div>
        )}

        {/* Generation Status */}
        <div className="mx-4 mt-2 px-3 py-2 rounded-md flex items-center justify-between flex-shrink-0" style={{ background: "var(--tim-bg-deep)" }}>
          <span className="text-[11px] text-[var(--tim-text-muted)]">Daily generations</span>
          <GenerationCounter />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button key={item.path} onClick={() => { navigate(item.path); if (isMobile) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${active ? "text-[var(--tim-accent)] border border-[rgba(0,200,224,0.2)]" : "text-[var(--tim-text-secondary)] hover:text-[var(--tim-text)] hover:bg-[var(--tim-panel-hover)] border border-transparent"}`}
                style={active ? { background: "rgba(0,200,224,0.1)" } : {}}>
                <Icon className={`w-[18px] h-[18px] ${active ? "text-[var(--tim-accent)]" : "text-[var(--tim-text-muted)] group-hover:text-[var(--tim-text)]"}`} />
                <span className="font-medium">{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--tim-accent)]" />}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-[var(--tim-border)] p-3 flex-shrink-0">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,200,224,0.15)" }}>
                  {user.avatar ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" /> : <User className="w-4 h-4 text-[var(--tim-accent)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--tim-text)] truncate">{user.name || "User"}</p>
                  <p className="text-[11px] text-[var(--tim-text-muted)] capitalize flex items-center gap-1">
                    {tier === "pro" && <Crown className="w-3 h-3 text-[var(--tim-amber)]" />}
                    {tier === "creator" && <Zap className="w-3 h-3 text-[var(--tim-accent)]" />}
                    {tier === "stock" && <Sparkles className="w-3 h-3 text-[var(--tim-text-muted)]" />}
                    {tier}
                    {showTrialBadge && <span className="text-[var(--tim-amber)]">(trial)</span>}
                  </p>
                </div>
              </div>
              <button onClick={logout} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--tim-text-secondary)] hover:text-[var(--tim-text)] rounded-md hover:bg-[var(--tim-panel-hover)] transition-colors">
                <LogOut className="w-3.5 h-3.5" />Sign out
              </button>
            </div>
          ) : (
            <button onClick={() => navigate("/login")} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-[var(--tim-accent)] rounded-md transition-colors"
              style={{ background: "rgba(0,200,224,0.1)", border: "1px solid rgba(0,200,224,0.2)" }}>
              <User className="w-4 h-4" />Sign In
            </button>
          )}
        </div>
      </aside>

      {!isMobile && (
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`fixed z-50 top-1/2 -translate-y-1/2 bg-[var(--tim-panel)] border border-[var(--tim-border)] rounded-r-md p-1 text-[var(--tim-text-secondary)] hover:text-[var(--tim-text)] transition-all duration-300 ${sidebarOpen ? "left-64" : "left-0"}`}>
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`} />
        </button>
      )}
    </>
  );
}

// ─── Generation Counter ──────────────────────────────────────────────────────
function GenerationCounter() {
  const { user, tier } = useAuth();
  const { data: genStatus } = trpc.generation.status.useQuery(undefined, { enabled: !!user, staleTime: 1000 * 30 });
  if (!user || !genStatus) return null;
  const remaining = genStatus.remaining;
  const limit = genStatus.limit;
  return (
    <span className={`text-[11px] font-mono ${remaining === 0 ? "text-[var(--tim-red)]" : "text-[var(--tim-text-secondary)]"}`}>
      {tier === "pro" ? <span className="flex items-center gap-1"><Infinity className="w-3 h-3 text-[var(--tim-amber)]" /><span className="text-[var(--tim-amber)]">Unlimited</span></span> : <span>{remaining}/{limit}</span>}
    </span>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────
function TopBar() {
  const { sidebarOpen, setSidebarOpen, timStatus } = useStore();
  const { user, tier, trialActive, trialDaysRemaining } = useAuth();
  const isOnline = timStatus === "online";
  const isThinking = timStatus === "thinking";

  return (
    <header className="h-14 flex-shrink-0 border-b border-[var(--tim-border)] flex items-center px-5 sticky top-0 z-30"
      style={{ background: "rgba(11,17,24,0.85)", backdropFilter: "blur(12px)" }}>
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-[var(--tim-panel-hover)] text-[var(--tim-text-secondary)] lg:hidden">
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {/* T.I.M. Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: "var(--tim-bg-deep)", border: "1px solid var(--tim-border)" }}>
          <StatusOrb />
          <span className={`text-[11px] font-medium ${isOnline ? "text-[var(--tim-accent)]" : isThinking ? "text-[var(--tim-amber)]" : "text-[var(--tim-text-muted)]"}`}>
            {isOnline ? "T.I.M. online" : isThinking ? "T.I.M. thinking..." : "T.I.M. offline"}
          </span>
        </div>

        {/* Generation Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: "var(--tim-bg-deep)", border: "1px solid var(--tim-border)" }}>
          <span className="text-[11px] text-[var(--tim-text-muted)]">Gens</span>
          <GenerationCounter />
        </div>

        {/* Trial Pill */}
        {trialActive && trialDaysRemaining > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md" style={{ background: "rgba(255,176,32,0.08)", border: "1px solid rgba(255,176,32,0.15)" }}>
            <Clock className="w-3 h-3 text-[var(--tim-amber)]" />
            <span className="text-[11px] text-[var(--tim-amber)] font-medium">{trialDaysRemaining}d left</span>
          </div>
        )}

        {/* Tier Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-medium capitalize ${
          tier === "pro" ? "bg-[rgba(255,176,32,0.08)] border-[rgba(255,176,32,0.15)] text-[var(--tim-amber)]" :
          tier === "creator" ? "bg-[rgba(0,200,224,0.08)] border-[rgba(0,200,224,0.15)] text-[var(--tim-accent)]" :
          "bg-[var(--tim-panel)] border-[var(--tim-border)] text-[var(--tim-text-muted)]"
        }`}>
          {tier === "pro" ? <Crown className="w-3 h-3" /> : tier === "creator" ? <Zap className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {tier}
        </div>
      </div>
    </header>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export function Layout() {
  const { sidebarOpen } = useStore();

  return (
    <div className="h-screen overflow-hidden" style={{ background: "var(--tim-bg)" }}>
      <Sidebar />
      <div className={`h-screen flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-0"}`}>
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
