import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Snowflake, Crown, User, ArrowRight, Sparkles } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const navigate = useNavigate();
  const { enableGuest } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--tim-bg)" }}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(0,200,224,0.1)" }}>
            <Snowflake className="w-8 h-8 text-[var(--tim-accent)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--tim-text)]">T.I.M.</h1>
          <p className="text-sm text-[var(--tim-text-secondary)] mt-1">The Intent Method for Suno</p>
        </div>

        {/* Auth Options */}
        <div className="space-y-4">
          {/* Full Account */}
          <button
            onClick={() => { window.location.href = getOAuthUrl(); }}
            className="w-full tim-panel p-5 text-left tim-panel-hover group transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,200,224,0.1)" }}>
                <Crown className="w-5 h-5 text-[var(--tim-amber)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--tim-text)]">Full Account</h3>
                  <span className="tim-badge-amber text-[10px]"><Sparkles className="w-2.5 h-2.5" />7-day Pro trial</span>
                </div>
                <p className="text-xs text-[var(--tim-text-secondary)] mt-1">OAuth sign-in with cloud saves, full Claude AI, and unlimited generations during trial</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-[var(--tim-accent)] group-hover:gap-2 transition-all">
                  Sign in with Kimi <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </button>

          {/* Guest */}
          <button
            onClick={enableGuest}
            className="w-full tim-panel p-5 text-left tim-panel-hover group transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--tim-panel-hover)" }}>
                <User className="w-5 h-5 text-[var(--tim-text-secondary)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--tim-text)]">Guest Mode</h3>
                <p className="text-xs text-[var(--tim-text-secondary)] mt-1">1 generation/day, no Claude AI, no cloud saves. Try before you commit.</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-[var(--tim-text-muted)] group-hover:text-[var(--tim-text-secondary)] group-hover:gap-2 transition-all">
                  Continue as guest <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Back */}
        <button onClick={() => navigate("/")} className="w-full text-center mt-6 text-xs text-[var(--tim-text-muted)] hover:text-[var(--tim-text-secondary)] transition-colors">
          Back to landing page
        </button>
      </div>
    </div>
  );
}
