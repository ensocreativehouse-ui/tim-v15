import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Settings, User, Key, Palette, Save, Check, AlertTriangle, Snowflake, SlidersHorizontal, Ban, Mic2 } from "lucide-react";
import { toast } from "sonner";

type Tab = "profile" | "api" | "preferences";

export default function SettingsPage() {
  const { user, tier } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState(user?.name || "");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [defaultWeirdness, setDefaultWeirdness] = useState(48);
  const [defaultStyleAcc, setDefaultStyleAcc] = useState(87);
  const [bannedWords] = useState("epic, cinematic-cliche, sick, fire");

  const handleSave = () => { setSaved(true); toast.success("Settings saved"); setTimeout(() => setSaved(false), 2000); };

  const tabs = [
    { key: "profile" as Tab, label: "Profile", icon: User },
    { key: "api" as Tab, label: "API Keys", icon: Key },
    { key: "preferences" as Tab, label: "Preferences", icon: Palette },
  ];

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--tim-text)] flex items-center gap-2"><Settings className="w-5 h-5 text-[var(--tim-accent)]" />Settings</h2>
          <p className="text-sm text-[var(--tim-text-secondary)] mt-1">Manage your profile, API keys, and preferences</p>
        </div>

        <div className="flex items-center gap-1 tim-panel p-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-md transition-all ${tab === t.key ? "text-[var(--tim-accent)]" : "text-[var(--tim-text-secondary)] hover:text-[var(--tim-text)] hover:bg-[var(--tim-panel-hover)]"}`}
              style={tab === t.key ? { background: "rgba(0,200,224,0.08)", border: "1px solid rgba(0,200,224,0.15)" } : {}}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="tim-panel p-6 space-y-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(0,200,224,0.15)" }}>
                <User className="w-7 h-7 text-[var(--tim-accent)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--tim-text)]">{user?.name || "User"}</h3>
                <p className="text-xs text-[var(--tim-text-secondary)] capitalize">{tier} tier {user?.trialActive && <span className="text-[var(--tim-amber)]">(trial active)</span>}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div><label className="tim-label mb-1.5 block">Display Name</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="tim-input w-full" placeholder="Your name" /></div>
              <div><label className="tim-label mb-1.5 block">Email</label><input type="email" value={user?.email || ""} disabled className="tim-input w-full opacity-50" /></div>
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(0,200,224,0.05)", border: "1px solid rgba(0,200,224,0.1)" }}>
                <Snowflake className="w-5 h-5 text-[var(--tim-accent)] flex-shrink-0 mt-0.5" />
                <div><p className="text-xs font-medium text-[var(--tim-text)]">Signature Preset</p><p className="text-[11px] text-[var(--tim-text-secondary)]">SnowFlake — Method Menace, 93 BPM, RZA loops</p></div>
              </div>
            </div>
          </div>
        )}

        {tab === "api" && (
          <div className="tim-panel p-6 space-y-5">
            <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(255,176,32,0.05)", border: "1px solid rgba(255,176,32,0.1)" }}>
              <AlertTriangle className="w-4 h-4 text-[var(--tim-amber)] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--tim-text-secondary)]">API keys are stored locally and never sent to our servers.</p>
            </div>
            <div>
              <label className="tim-label mb-1.5 flex items-center gap-1.5"><Key className="w-3 h-3" />Anthropic API Key</label>
              <input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} className="tim-input w-full font-mono" placeholder="sk-ant-..." />
              <p className="text-[11px] text-[var(--tim-text-muted)] mt-1">For Claude API. Get yours at console.anthropic.com</p>
            </div>
          </div>
        )}

        {tab === "preferences" && (
          <div className="tim-panel p-6 space-y-6">
            <div>
              <label className="tim-label mb-3 block">Mode</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium" style={{ background: "rgba(0,200,224,0.08)", border: "1px solid rgba(0,200,224,0.15)", color: "var(--tim-accent)" }}>
                <Mic2 className="w-3.5 h-3.5" />T.I.M. — Music Production (only mode)
              </div>
            </div>
            <div>
              <label className="tim-label mb-3 flex items-center gap-1.5"><SlidersHorizontal className="w-3 h-3" />Default Sliders</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1.5"><span className="text-xs text-[var(--tim-text-secondary)]">Weirdness</span><span className="text-xs font-mono text-[var(--tim-accent)]">{defaultWeirdness}</span></div>
                  <input type="range" min={0} max={100} value={defaultWeirdness} onChange={(e) => setDefaultWeirdness(Number(e.target.value))} className="w-full accent-[var(--tim-accent)]" />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5"><span className="text-xs text-[var(--tim-text-secondary)]">Style Accuracy</span><span className="text-xs font-mono text-[var(--tim-accent)]">{defaultStyleAcc}</span></div>
                  <input type="range" min={0} max={100} value={defaultStyleAcc} onChange={(e) => setDefaultStyleAcc(Number(e.target.value))} className="w-full accent-[var(--tim-accent)]" />
                </div>
              </div>
            </div>
            <div>
              <label className="tim-label mb-1.5 flex items-center gap-1.5"><Ban className="w-3 h-3" />Banned Descriptors</label>
              <textarea value={bannedWords} disabled className="tim-input w-full h-20 resize-none font-mono text-xs opacity-60" />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handleSave} className="tim-btn-primary flex items-center gap-2 text-sm px-6 py-2.5 rounded-lg">
            {saved ? <><Check className="w-4 h-4" />Saved</> : <><Save className="w-4 h-4" />Save Settings</>}
          </button>
        </div>
      </div>
    </div>
  );
}
