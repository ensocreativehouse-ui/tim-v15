import { useAuth } from "@/hooks/useAuth";
import { CreditCard, Check, Sparkles, Zap, Crown, ArrowRight, Infinity } from "lucide-react";
import { toast } from "sonner";

const tiers = [
  {
    id: "stock", name: "Stock", icon: Sparkles, price: 0, period: "",
    limit: 1, color: "text-[var(--tim-text-secondary)]",
    features: ["1 generation/day", "Manual prompt entry", "Single track output", "View-only Library", "Community support"],
  },
  {
    id: "creator", name: "Creator", icon: Zap, price: 9, period: "/month",
    limit: 3, color: "text-[var(--tim-accent)]",
    features: ["3 generations/day", "Full Claude AI engine", "2-3 layer Extend", "Save/load sessions", "All intelligence features", "Priority support"],
  },
  {
    id: "pro", name: "Pro", icon: Crown, price: 29, period: "/month",
    limit: 999, highlighted: true, color: "text-[var(--tim-amber)]",
    features: ["Unlimited generations", "Full Claude AI engine", "Unlimited Extend chains", "Full Remix workstation", "Template creation", "Stems + seed audio export", "Priority support"],
  },
];

export default function BillingPage() {
  const { user, tier: currentTier, trialActive } = useAuth();

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[var(--tim-text)] mb-2">Pricing</h2>
          <p className="text-sm text-[var(--tim-text-secondary)]">Start free with Stock, upgrade to unlock the full T.I.M. engine</p>
        </div>

        {/* Current Plan */}
        <div className="tim-panel p-4 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,200,224,0.1)" }}>
              <CreditCard className="w-5 h-5 text-[var(--tim-accent)]" />
            </div>
            <div>
              <p className="text-[11px] text-[var(--tim-text-muted)]">Current plan</p>
              <p className="text-sm font-semibold text-[var(--tim-text)] capitalize">{currentTier}{trialActive && <span className="text-xs font-normal text-[var(--tim-amber)] ml-2">(Pro trial active)</span>}</p>
            </div>
          </div>
          <span className="tim-badge-green text-[11px]">Active</span>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrent = currentTier === tier.id;
            return (
              <div key={tier.id} className={`tim-panel p-6 flex flex-col ${tier.highlighted ? "ring-1" : ""}`} style={tier.highlighted ? { borderColor: "rgba(0,200,224,0.3)", ring: "1px solid rgba(0,200,224,0.2)" } : {}}>
                <div className="mb-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${tier.highlighted ? "bg-[rgba(0,200,224,0.12)]" : "bg-[var(--tim-panel-hover)]"}`}>
                    <Icon className={`w-5 h-5 ${tier.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--tim-text)]">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-[var(--tim-text)]">{tier.price === 0 ? "Free" : `$${tier.price}`}</span>
                    {tier.period && <span className="text-xs text-[var(--tim-text-secondary)]">{tier.period}</span>}
                  </div>
                </div>
                <div className="mb-5 pb-4 border-b border-[var(--tim-border)]">
                  <span className="text-xs text-[var(--tim-text-secondary)]">{tier.limit === 999 ? "Unlimited generations/day" : `${tier.limit} generation${tier.limit !== 1 ? "s" : ""}/day`}</span>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-[var(--tim-text-secondary)]"><Check className="w-3.5 h-3.5 text-[var(--tim-green)] flex-shrink-0 mt-0.5" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => { if (!user) { toast.info("Please sign in first"); return; } toast.info("Stripe checkout coming soon!"); }}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${isCurrent ? "bg-[rgba(16,185,129,0.08)] text-[var(--tim-green)] border border-[rgba(16,185,129,0.15)] cursor-default" : tier.highlighted ? "tim-btn-primary" : "tim-btn-secondary"}`}>
                  {isCurrent ? <><Check className="w-3.5 h-3.5" />Current Plan</> : tier.id === "pro" ? <><Crown className="w-3.5 h-3.5" />Start 7-Day Trial</> : tier.id === "stock" ? <><Sparkles className="w-3.5 h-3.5" />Continue Free</> : <><>Subscribe<ArrowRight className="w-3.5 h-3.5" /></></>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trial Note */}
        <div className="tim-panel p-5 text-center" style={{ background: "rgba(0,200,224,0.05)", borderColor: "rgba(0,200,224,0.15)" }}>
          <p className="text-sm text-[var(--tim-text)]">New accounts get a <strong className="text-[var(--tim-accent)]">7-day Pro trial</strong> — no credit card required</p>
          <p className="text-xs text-[var(--tim-text-secondary)] mt-1">After 7 days, keep using Stock for free or upgrade</p>
        </div>
      </div>
    </div>
  );
}
