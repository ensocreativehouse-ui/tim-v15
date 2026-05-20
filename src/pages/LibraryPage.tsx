import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Library, Music, Clock, Wand2, ExternalLink, Trash2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LibraryPage() {
  const { isAuthenticated } = useAuth();
  const { data: outputs, isLoading } = trpc.output.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const deleteMutation = trpc.output.delete.useMutation({
    onSuccess: () => { utils.output.list.invalidate(); toast.success("Deleted"); },
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--tim-text)] flex items-center gap-2"><Library className="w-5 h-5 text-[var(--tim-accent)]" />Library</h2>
            <p className="text-sm text-[var(--tim-text-secondary)] mt-1">All your generated outputs and saved sessions</p>
          </div>
          <span className="text-xs text-[var(--tim-text-muted)]">{outputs?.length || 0} tracks</span>
        </div>

        {!isAuthenticated ? (
          <div className="tim-panel p-12 text-center">
            <Library className="w-12 h-12 text-[var(--tim-text-muted)] mx-auto mb-4" />
            <p className="text-sm text-[var(--tim-text-secondary)]">Sign in to view your library</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-[var(--tim-accent)] border-t-transparent rounded-full" /></div>
        ) : !outputs?.length ? (
          <div className="tim-panel p-12 text-center">
            <Music className="w-12 h-12 text-[var(--tim-text-muted)] mx-auto mb-4" />
            <p className="text-sm text-[var(--tim-text-secondary)] mb-2">No outputs yet</p>
            <p className="text-xs text-[var(--tim-text-muted)]">Generate your first track in the Create page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outputs.map((output) => (
              <div key={output.id} className="tim-panel tim-panel-hover p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === output.id ? null : output.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Wand2 className="w-4 h-4 text-[var(--tim-accent)]" />
                      <span className="text-sm font-medium text-[var(--tim-text)] truncate">{output.styleField?.slice(0, 60) || "Untitled"}...</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--tim-text-muted)]">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(output.createdAt).toLocaleDateString()}</span>
                      <span className="tim-badge-cyan">Layer {output.layerNumber}</span>
                      {output.rating && <span className={output.rating === "up" ? "tim-badge-green" : "tim-badge-amber"}>{output.rating === "up" ? "Thumbs Up" : "Thumbs Down"}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(output.styleField || ""); toast.success("Copied"); }} className="p-1.5 rounded hover:bg-[var(--tim-panel-hover)] text-[var(--tim-text-secondary)]"><ExternalLink className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this output?")) deleteMutation.mutate({ id: output.id }); }} className="p-1.5 rounded hover:bg-[var(--tim-panel-hover)] text-[var(--tim-text-secondary)] hover:text-[var(--tim-red)]"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {expandedId === output.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--tim-border)] space-y-3">
                    {output.lyrics && <div><label className="tim-label mb-1.5 block">Lyrics</label><pre className="text-xs text-[var(--tim-text-secondary)] whitespace-pre-wrap font-mono p-3 rounded-lg" style={{ background: "var(--tim-bg-deep)" }}>{output.lyrics}</pre></div>}
                    {output.excludeField && <div><label className="tim-label mb-1.5 block">Exclude</label><p className="text-xs text-[var(--tim-red)] font-mono">{output.excludeField}</p></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
