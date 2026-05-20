import { useState } from "react";
import { useNavigate } from "react-router";
import { Snowflake, Mic2, Library, Layers, ArrowRight, SkipForward, Check, Crown } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { icon: Mic2, title: "Describe Your Track", desc: "Talk to T.I.M. like a real producer. Describe mood, genre, vocals, BPM. Claude AI builds the Suno prompt." },
  { icon: Layers, title: "Structured Output", desc: "T.I.M. generates style field, lyrics, sliders, listen-fors, and risk flags — all formatted for Suno." },
  { icon: Library, title: "Save & Extend", desc: "Save outputs to your Library. Use Extend to build multi-layer tracks with continuity." },
  { icon: Snowflake, title: "SnowFlake Method", desc: "Always start 'hyper-realistic'. Voice descriptors second. Each section ends with [End — hold for extend]." },
  { icon: Crown, title: "Pro Trial Active", desc: "Your 7-day Pro trial is active! You have unlimited generations and full Claude AI access." },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step >= STEPS.length - 1) {
      toast.success("Welcome to T.I.M.!");
      navigate("/create");
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => navigate("/create");

  const CurrentIcon = STEPS[step].icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--tim-bg)" }}>
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--tim-bg-deep)" }}>
            <div className="h-full rounded-full transition-all duration-500 bg-[var(--tim-accent)]" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-[var(--tim-text-muted)] font-mono">{step + 1}/{STEPS.length}</span>
        </div>

        {/* Card */}
        <div className="tim-panel p-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(0,200,224,0.1)" }}>
            <CurrentIcon className="w-8 h-8 text-[var(--tim-accent)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--tim-text)] text-center mb-3">{STEPS[step].title}</h2>
          <p className="text-sm text-[var(--tim-text-secondary)] text-center leading-relaxed mb-8">{STEPS[step].desc}</p>
          <div className="flex gap-3">
            <button onClick={handleSkip} className="flex-1 tim-btn-secondary text-sm py-2.5 rounded-lg">
              <SkipForward className="w-3.5 h-3.5" />Skip
            </button>
            <button onClick={handleNext} className="flex-1 tim-btn-primary text-sm py-2.5 rounded-lg">
              {step >= STEPS.length - 1 ? <><Check className="w-3.5 h-3.5" />Get Started</> : <><ArrowRight className="w-3.5 h-3.5" />Next</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
