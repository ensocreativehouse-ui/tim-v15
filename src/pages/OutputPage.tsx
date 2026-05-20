import { FileOutput, Download, Copy, Check, ExternalLink, Music, FileAudio, FileText } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function OutputPage() {
  const { currentOutput } = useStore();
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const createMutation = trpc.output.create.useMutation();
  const [saved, setSaved] = useState(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${field} copied`);
  };

  const handleSave = async () => {
    if (!user || !currentOutput) { toast.error("Sign in to save outputs"); return; }
    try {
      await createMutation.mutateAsync({
        sessionId: 1, // default session
        styleField: currentOutput.styleField,
        lyrics: currentOutput.lyrics,
        excludeField: currentOutput.excludeField,
        weirdness: currentOutput.sliders.weirdness,
        styleAccuracy: currentOutput.sliders.styleAccuracy,
        audioInfluence: currentOutput.sliders.audioInfluence,
        listenFor: currentOutput.listenFor,
        risks: currentOutput.risks,
        nextStep: currentOutput.nextStep,
      });
      setSaved(true);
      toast.success("Output saved to library");
    } catch { toast.error("Failed to save"); }
  };

  if (!currentOutput) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--tim-panel)", border: "1px solid var(--tim-border)" }}>
          <FileOutput className="w-8 h-8 text-[var(--tim-text-muted)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--tim-text)] mb-2">No Output Yet</h3>
        <p className="text-sm text-[var(--tim-text-secondary)] max-w-sm text-center">Generate a track in the Create page to see export options here</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--tim-text)] flex items-center gap-2"><FileOutput className="w-5 h-5 text-[var(--tim-accent)]" />Export & Publish</h2>
            <p className="text-sm text-[var(--tim-text-secondary)] mt-1">Save your output and export to Suno</p>
          </div>
          <button onClick={handleSave} disabled={saved} className={`text-xs py-2 px-4 rounded-lg ${saved ? "tim-badge-green" : "tim-btn-primary"}`}>
            {saved ? <><Check className="w-3.5 h-3.5" />Saved</> : <><Download className="w-3.5 h-3.5" />Save to Library</>}
          </button>
        </div>

        {/* Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ExportCard icon={FileText} title="Style Field" content={currentOutput.styleField} onCopy={() => handleCopy(currentOutput.styleField, "Style Field")} copied={copiedField === "Style Field"} />
          <ExportCard icon={Music} title="Lyrics" content={currentOutput.lyrics} onCopy={() => handleCopy(currentOutput.lyrics, "Lyrics")} copied={copiedField === "Lyrics"} />
          <ExportCard icon={FileAudio} title="Exclude" content={currentOutput.excludeField} onCopy={() => handleCopy(currentOutput.excludeField, "Exclude")} copied={copiedField === "Exclude"} />
        </div>

        {/* Suno Export */}
        <div className="tim-panel p-6">
          <h3 className="text-sm font-semibold text-[var(--tim-text)] mb-4 flex items-center gap-2"><ExternalLink className="w-4 h-4 text-[var(--tim-accent)]" />Export to Suno</h3>
          <div className="space-y-3">
            <button onClick={() => { navigator.clipboard.writeText(JSON.stringify({ style: currentOutput.styleField, lyrics: currentOutput.lyrics, exclude: currentOutput.excludeField }, null, 2)); toast.success("Full payload copied"); }}
              className="w-full tim-btn-primary text-sm py-3 rounded-lg">
              <Copy className="w-4 h-4" />Copy Full Suno Payload
            </button>
            <a href="https://suno.com/create" target="_blank" rel="noopener noreferrer" className="w-full tim-btn-secondary text-sm py-3 rounded-lg flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />Open Suno Creator
            </a>
          </div>
        </div>

        {/* Full JSON */}
        <div className="tim-panel p-5">
          <h3 className="text-sm font-semibold text-[var(--tim-text)] mb-3">Full Output JSON</h3>
          <pre className="text-xs text-[var(--tim-text-secondary)] whitespace-pre-wrap font-mono p-4 rounded-lg overflow-auto max-h-96" style={{ background: "var(--tim-bg-deep)" }}>
            {JSON.stringify(currentOutput, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ExportCard({ icon: Icon, title, content, onCopy, copied }: { icon: typeof FileText; title: string; content: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="tim-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[var(--tim-accent)]" />
        <h4 className="text-sm font-medium text-[var(--tim-text)]">{title}</h4>
      </div>
      <div className="group relative">
        <p className="text-xs text-[var(--tim-text-secondary)] line-clamp-6 font-mono leading-relaxed">{content}</p>
        <button onClick={onCopy} className="absolute top-0 right-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--tim-panel)", border: "1px solid var(--tim-border)" }}>
          {copied ? <Check className="w-3 h-3 text-[var(--tim-green)]" /> : <Copy className="w-3 h-3 text-[var(--tim-text-secondary)]" />}
        </button>
      </div>
    </div>
  );
}
