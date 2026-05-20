import { useAuth } from "@/hooks/useAuth";
import { GitBranch, Layers, Wand2, Play, Pause, Lock, ArrowRight, Music } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const REMIX_STEPS = [
  { name: "Stem Separation", desc: "Isolate vocals, drums, bass, melody", icon: Layers },
  { name: "Style Transfer", desc: "Apply new genre/style to existing track", icon: Wand2 },
  { name: "Layer Stack", desc: "Stack multiple generations", icon: GitBranch },
  { name: "Crossfade", desc: "Smooth transitions between layers", icon: ArrowRight },
];

export default function RemixPage() {
  const { canExtend } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-[var(--tim-text)] flex items-center gap-2"><GitBranch className="w-5 h-5 text-[var(--tim-accent)]" />Remix Workstation</h2>
          <p className="text-sm text-[var(--tim-text-secondary)] mt-1">Deconstruct, transform, and recombine tracks</p>
        </div>

        {!canExtend && (
          <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "rgba(255,176,32,0.08)", border: "1px solid rgba(255,176,32,0.15)" }}>
            <Lock className="w-5 h-5 text-[var(--tim-amber)] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--tim-amber)]">Creator/Pro Required</p>
              <p className="text-xs text-[var(--tim-text-secondary)]">Upgrade to access the full Remix workstation</p>
            </div>
          </div>
        )}

        {/* Step Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {REMIX_STEPS.map((step, i) => {
            const Icon = step.icon;
            const active = activeStep === i;
            const locked = !canExtend && i > 0;
            return (
              <button key={i} onClick={() => { if (!locked) setActiveStep(i); }} className={`tim-panel p-5 text-left transition-all ${active ? "ring-2 ring-[var(--tim-accent)]" : "tim-panel-hover"} ${locked ? "opacity-40 cursor-not-allowed" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-[rgba(0,200,224,0.15)]" : "bg-[var(--tim-panel-hover)]"}`}>
                    {locked ? <Lock className="w-5 h-5 text-[var(--tim-text-muted)]" /> : <Icon className={`w-5 h-5 ${active ? "text-[var(--tim-accent)]" : "text-[var(--tim-text-secondary)]"}`} />}
                  </div>
                  <span className="text-[11px] text-[var(--tim-text-muted)]">Step {i + 1}</span>
                </div>
                <h3 className={`text-sm font-medium ${active ? "text-[var(--tim-accent)]" : "text-[var(--tim-text)]"}`}>{step.name}</h3>
                <p className="text-xs text-[var(--tim-text-muted)] mt-1">{step.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Active Step Detail */}
        <div className="tim-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--tim-text)]">{REMIX_STEPS[activeStep].name}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsPlaying(!isPlaying)} className="tim-btn-secondary text-xs py-2 px-4 rounded-lg">
                {isPlaying ? <><Pause className="w-3.5 h-3.5" />Pause</> : <><Play className="w-3.5 h-3.5" />Preview</>}
              </button>
              <button onClick={() => toast.info("Processing...")} className="tim-btn-primary text-xs py-2 px-4 rounded-lg">
                <Wand2 className="w-3.5 h-3.5" />Process
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center py-16 rounded-lg" style={{ background: "var(--tim-bg-deep)", border: "2px dashed var(--tim-border)" }}>
            <div className="text-center">
              <Music className="w-10 h-10 text-[var(--tim-text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--tim-text-secondary)]">Drop audio files here or click to upload</p>
              <p className="text-xs text-[var(--tim-text-muted)] mt-1">Supports WAV, MP3, FLAC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
