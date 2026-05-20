import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Snowflake, Sparkles, ArrowRight, Music, Mic2, Layers, Zap, Crown } from "lucide-react";
import { useEffect } from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate("/create");
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen" style={{ background: "var(--tim-bg)" }}>
      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-8 border-b border-[var(--tim-border)]">
        <div className="flex items-center gap-2.5">
          <Snowflake className="w-6 h-6 text-[var(--tim-accent)]" />
          <span className="font-semibold text-[var(--tim-text)] text-sm">T.I.M.</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/pricing")} className="tim-btn-ghost text-xs">Pricing</button>
          <button onClick={() => navigate("/login")} className="tim-btn-secondary text-xs py-2 px-4">Sign In</button>
          <button onClick={() => navigate("/login")} className="tim-btn-primary text-xs py-2 px-4">
            <Crown className="w-3.5 h-3.5" />Start Free Trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs" style={{ background: "rgba(0,200,224,0.08)", border: "1px solid rgba(0,200,224,0.15)", color: "var(--tim-accent)" }}>
            <Sparkles className="w-3.5 h-3.5" />Powered by Claude AI for Suno
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-[var(--tim-text)] mb-6 tracking-tight">
            T.I.M. — <span className="text-[var(--tim-accent)]">The Intent Method</span>
          </h1>
          <p className="text-lg text-[var(--tim-text-secondary)] mb-4 max-w-xl mx-auto">
            Conversational AI music creation. Describe your track idea, and T.I.M. builds the perfect Suno prompt — style field, lyrics, and production notes.
          </p>
          <p className="text-sm text-[var(--tim-amber)] mb-10">Signature: SnowFlake — 93 BPM RZA loops, Method Menace cold winter track</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => navigate("/login")} className="tim-btn-primary text-sm py-3 px-8 rounded-lg">
              <Crown className="w-4 h-4" />Start 7-Day Pro Trial
            </button>
            <button onClick={() => navigate("/login")} className="tim-btn-secondary text-sm py-3 px-8 rounded-lg">
              <ArrowRight className="w-4 h-4" />Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-8 border-t border-[var(--tim-border)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-[var(--tim-text)] text-center mb-12">What T.I.M. Does</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Mic2, title: "Conversational", desc: "Talk like a real producer. No forms, no templates." },
              { icon: Music, title: "Structured Output", desc: "Style field, lyrics, sliders, risks — all formatted for Suno." },
              { icon: Layers, title: "Extend Chains", desc: "Build multi-layer tracks with continuity between generations." },
              { icon: Zap, title: "Claude AI", desc: "Powered by Anthropic Claude for intelligent music generation." },
            ].map((f, i) => (
              <div key={i} className="tim-panel p-6 tim-panel-hover">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(0,200,224,0.1)" }}>
                  <f.icon className="w-5 h-5 text-[var(--tim-accent)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--tim-text)] mb-2">{f.title}</h3>
                <p className="text-xs text-[var(--tim-text-secondary)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 px-8 border-t border-[var(--tim-border)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-[var(--tim-text)] mb-8">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Stock", price: "Free", features: ["1 gen/day", "Manual prompts", "Community"], icon: Sparkles },
              { name: "Creator", price: "$9/mo", features: ["3 gens/day", "Claude AI", "2-3 layer Extend"], icon: Zap, highlight: true },
              { name: "Pro", price: "$29/mo", features: ["Unlimited", "Full Extend", "Remix workstation"], icon: Crown, highlight: true },
            ].map((t, i) => (
              <div key={i} className={`tim-panel p-6 ${t.highlight ? "ring-1" : ""}`} style={t.highlight ? { borderColor: "rgba(0,200,224,0.3)" } : {}}>
                <t.icon className={`w-6 h-6 mx-auto mb-3 ${i === 2 ? "text-[var(--tim-amber)]" : "text-[var(--tim-accent)]"}`} />
                <h3 className="text-sm font-semibold text-[var(--tim-text)]">{t.name}</h3>
                <p className="text-xl font-bold text-[var(--tim-text)] mt-1">{t.price}</p>
                <ul className="mt-4 space-y-1.5">
                  {t.features.map((f, j) => <li key={j} className="text-xs text-[var(--tim-text-secondary)]">{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/pricing")} className="mt-8 tim-btn-secondary text-sm py-2.5 px-6 rounded-lg">View Full Pricing</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-[var(--tim-border)] text-center">
        <p className="text-xs text-[var(--tim-text-muted)]">T.I.M. v13 — The Intent Method for Suno</p>
      </footer>
    </div>
  );
}
