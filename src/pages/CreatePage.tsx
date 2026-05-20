import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import type { ChatMessage, StructuredOutput } from "@/types";
import { renderSeedAudio, playPreview, stopPreview, getDefaultInput, ensureAudioContext } from "@/lib/audioEngine";
import type { SeedRenderResult } from "@/lib/audioEngine";
import {
  Send, Snowflake, Copy, Check, Wand2, Music, AlertTriangle, Volume2,
  ThumbsUp, ThumbsDown, Mic, Loader2, Sparkles, Play, Pause, Square,
  Download, Headphones, ChevronDown, ChevronUp, Crown, Zap, Lock,
  Search, Radio, X
} from "lucide-react";
import { toast } from "sonner";

const PRESET_DATA: Record<string, { name: string; icon: typeof Snowflake; desc: string }> = {
  snowflake: { name: "SnowFlake", icon: Snowflake, desc: "Wu-Tang 93 BPM" },
  "dark-dnb": { name: "Dark DnB", icon: Music, desc: "Drum & Bass 140" },
  ambient: { name: "Ambient", icon: Sparkles, desc: "Ethereal 80 BPM" },
  techno: { name: "Techno", icon: Zap, desc: "Industrial 138" },
};

// ─── Voice Input Hook ────────────────────────────────────────────────────────
function useVoiceInput(onTranscript: (text: string) => void) {
  const { isListening, setIsListening } = useStore();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser"); return; }

    const rec = new (SR as new () => SpeechRecognition)();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
      if (e.results[e.results.length - 1].isFinal) {
        onTranscript(transcript);
        setIsListening(false);
      }
    };

    rec.onerror = () => { setIsListening(false); };
    rec.onend = () => { setIsListening(false); };

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [onTranscript, setIsListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [setIsListening]);

  return { startListening, stopListening, isListening };
}

// ─── Status Orb (Cube) Component ─────────────────────────────────────────────
function StatusOrb() {
  const { timStatus } = useStore();
  const { startListening, stopListening, isListening } = useVoiceInput((text) => {
    // Voice transcript is handled by parent
  });

  const isOnline = timStatus === "online";
  const isThinking = timStatus === "thinking";
  const isOffline = timStatus === "offline";

  return (
    <button
      onClick={() => { if (isListening) stopListening(); }}
      className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
      style={{
        background: isOnline ? "rgba(0,200,224,0.12)" : isOffline ? "rgba(239,68,68,0.1)" : "rgba(255,176,32,0.1)",
        border: `1px solid ${isOnline ? "rgba(0,200,224,0.25)" : isOffline ? "rgba(239,68,68,0.2)" : "rgba(255,176,32,0.2)"}`,
      }}
      title={isOnline ? "T.I.M. online — click for voice" : isOffline ? "T.I.M. offline" : isThinking ? "T.I.M. thinking..." : "Connecting..."}
    >
      <Radio className={`w-4 h-4 ${isOnline ? "text-[var(--tim-accent)]" : isOffline ? "text-[var(--tim-red)]" : "text-[var(--tim-amber)]"}`} />
      {isOnline && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--tim-accent)] animate-pulse" style={{ boxShadow: "0 0 6px var(--tim-accent)" }} />
      )}
      {isThinking && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--tim-amber)] animate-pulse" />
      )}
    </button>
  );
}

export { StatusOrb };

// ─── Chat Panel ──────────────────────────────────────────────────────────────
function ChatPanel() {
  const { messages, addMessage, isLoading, setIsLoading, setCurrentOutput, setTimStatus } = useStore();
  const { user, tier, canUseClaude } = useAuth();
  const [input, setInput] = useState("");
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const generateMutation = trpc.agent.generate.useMutation();
  const initQuery = trpc.agent.init.useQuery(
    { userName: user?.name || "", isNew: !user?.name },
    { enabled: !hasWelcomed, staleTime: Infinity }
  );
  const logMutation = trpc.generation.log.useMutation();
  const { data: genStatus } = trpc.generation.status.useQuery(undefined, { enabled: !!user, staleTime: 1000 * 30 });

  const remaining = genStatus?.remaining ?? (tier === "pro" ? 999 : tier === "creator" ? 3 : 1);

  // Welcome message on first load
  useEffect(() => {
    if (initQuery.data && !hasWelcomed) {
      const greeting = initQuery.data.greeting;
      addMessage({
        id: Date.now().toString(36) + "_welcome",
        role: "assistant",
        content: greeting,
        timestamp: Date.now(),
      });
      setTimStatus(initQuery.data.status === "online" ? "online" : "offline");
      setHasWelcomed(true);
    }
    if (initQuery.isError && !hasWelcomed) {
      addMessage({
        id: Date.now().toString(36) + "_welcome",
        role: "assistant",
        content: "Hey, I'm T.I.M. — your AI producer. What track are we making today?",
        timestamp: Date.now(),
      });
      setTimStatus("offline");
      setHasWelcomed(true);
    }
  }, [initQuery.data, initQuery.isError, hasWelcomed, addMessage, setTimStatus]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (inputRef.current) { inputRef.current.style.height = "auto"; inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`; }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (remaining <= 0) { toast.error("Daily limit reached. Upgrade for more."); return; }

    const userMsg: ChatMessage = { id: Date.now().toString(36), role: "user", content: input.trim(), timestamp: Date.now() };
    addMessage(userMsg);
    setInput("");
    setIsLoading(true);
    setTimStatus("thinking");

    try {
      const result = await generateMutation.mutateAsync({ message: userMsg.content });
      if (result && typeof result === "object") {
        const r = result as Record<string, unknown>;
        const so = r.structuredOutput as StructuredOutput | undefined;
        addMessage({ id: Date.now().toString(36) + "_a", role: "assistant", content: (r.response as string) || "Here's your track:", timestamp: Date.now(), structuredOutput: so });
        if (so) setCurrentOutput(so);
        setTimStatus("online");
        if (user) { try { await logMutation.mutateAsync({ prompt: userMsg.content }); } catch { /* ok */ } }
      }
    } catch (err) {
      addMessage({ id: Date.now().toString(36) + "_e", role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Failed"}. Try again.`, timestamp: Date.now() });
      setTimStatus("offline");
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handlePreset = async (presetId: string) => {
    if (remaining <= 0) { toast.error("Daily limit reached."); return; }
    setIsLoading(true); setTimStatus("thinking");
    try {
      const result = await generateMutation.mutateAsync({ message: "Load preset", preset: presetId });
      if (result && typeof result === "object") {
        const r = result as Record<string, unknown>;
        const so = r.structuredOutput as StructuredOutput | undefined;
        const name = PRESET_DATA[presetId]?.name || presetId;
        addMessage({ id: Date.now().toString(36) + "_p", role: "assistant", content: `Loaded **${name}** preset — ${so?.styleFieldCharCount || 0}/200 chars.`, timestamp: Date.now(), structuredOutput: so });
        if (so) setCurrentOutput(so); setTimStatus("online");
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); setTimStatus("offline"); }
    finally { setIsLoading(false); }
  };

  // Voice input handler
  const { startListening } = useVoiceInput((text) => {
    setInput(text);
    toast.success(`Voice: "${text}"`);
  });

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0 px-1">
        {filteredMessages.length === 0 && !initQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse" style={{ background: "rgba(0,200,224,0.08)", border: "1px solid rgba(0,200,224,0.15)" }}>
              <Wand2 className="w-8 h-8 text-[var(--tim-accent)]" />
            </div>
            {!canUseClaude && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs mb-4" style={{ background: "rgba(255,176,32,0.08)", border: "1px solid rgba(255,176,32,0.15)" }}>
                <Lock className="w-3.5 h-3.5 text-[var(--tim-amber)]" />
                <span className="text-[var(--tim-amber)]">Sign in for Claude AI + unlimited generations</span>
              </div>
            )}
          </div>
        ) : (
          filteredMessages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {isLoading && (
          <div className="flex items-start gap-3 px-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(0,200,224,0.15)" }}>
              <Wand2 className="w-3.5 h-3.5 text-[var(--tim-accent)] animate-pulse" />
            </div>
            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--tim-accent)]">T.I.M.</span>
                <span className="text-[11px] text-[var(--tim-text-muted)] animate-pulse">thinking...</span>
              </div>
              <div className="flex gap-1.5">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--tim-border)] pt-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className={`text-[11px] font-mono ${remaining === 0 ? "text-[var(--tim-red)]" : "text-[var(--tim-text-muted)]"}`}>
            {tier === "pro" ? <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-[var(--tim-amber)]" />Unlimited</span> : <span>{remaining}/{tier === "creator" ? 3 : 1} today</span>}
          </span>
          {!canUseClaude && <span className="tim-badge-amber text-[11px]"><Lock className="w-3 h-3" />Claude locked</span>}
        </div>

        <div className="tim-panel p-3">
          <div className="flex items-start gap-3">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Describe your track idea..." rows={1}
              className="flex-1 bg-transparent text-sm text-[var(--tim-text)] placeholder:text-[var(--tim-text-muted)] resize-none focus:outline-none min-h-[40px] max-h-[160px] py-2" />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Voice button */}
              <button onClick={startListening} className="p-2 rounded-lg text-[var(--tim-text-secondary)] hover:text-[var(--tim-accent)] hover:bg-[rgba(0,200,224,0.08)] transition-colors" title="Voice input">
                <Mic className="w-4 h-4" />
              </button>
              {/* Preset buttons */}
              {Object.entries(PRESET_DATA).map(([id, p]) => (
                <button key={id} onClick={() => handlePreset(id)} className="p-1.5 rounded-md text-[var(--tim-text-secondary)] hover:text-[var(--tim-accent)] hover:bg-[rgba(0,200,224,0.08)] transition-colors" title={p.name}>
                  <p.icon className="w-4 h-4" />
                </button>
              ))}
              <button onClick={handleSend} disabled={!input.trim() || isLoading || remaining <= 0} className="tim-btn-primary p-2.5 rounded-lg">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--tim-border)]">
            <span className="text-[11px] text-[var(--tim-text-muted)]">Shift+Enter for new line</span>
            <span className="text-[11px] text-[var(--tim-text-muted)] font-mono">{input.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--tim-bg-deep)", border: "1px solid var(--tim-border)" }}>
          <Search className="w-3.5 h-3.5 text-[var(--tim-text-muted)]" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search past sessions..."
            className="flex-1 bg-transparent text-xs text-[var(--tim-text)] placeholder:text-[var(--tim-text-muted)] outline-none" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="text-[var(--tim-text-muted)] hover:text-[var(--tim-text)]"><X className="w-3 h-3" /></button>}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => { await navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[80%]">
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(0,200,224,0.08)", border: "1px solid rgba(0,200,224,0.15)" }}>
            <p className="text-sm text-[var(--tim-text)] whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="text-[10px] text-[var(--tim-text-muted)] mt-1 block text-right">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--tim-panel-hover)" }}>
          <Mic className="w-3.5 h-3.5 text-[var(--tim-text-secondary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group px-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(0,200,224,0.15)" }}>
        <Wand2 className="w-3.5 h-3.5 text-[var(--tim-accent)]" />
      </div>
      <div className="max-w-[85%] flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-[var(--tim-accent)]">T.I.M.</span>
          <button onClick={handleCopy} className="text-[var(--tim-text-muted)] hover:text-[var(--tim-text)] transition-colors opacity-0 group-hover:opacity-100">
            {copied ? <Check className="w-3 h-3 text-[var(--tim-green)]" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <div className="text-sm text-[var(--tim-text)] whitespace-pre-wrap leading-relaxed">{message.content}</div>
        {message.structuredOutput && <StructuredPreview output={message.structuredOutput} />}
        <span className="text-[10px] text-[var(--tim-text-muted)] mt-1 block">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <FeedbackButtons messageId={message.id} />
      </div>
    </div>
  );
}

// ─── Feedback ────────────────────────────────────────────────────────────────
function FeedbackButtons({ messageId }: { messageId: string }) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const rateMutation = trpc.output.update.useMutation();

  const handle = async (rating: "up" | "down") => {
    setFeedback(rating);
    try { const id = parseInt(messageId); if (!isNaN(id)) await rateMutation.mutateAsync({ id, rating }); } catch { /* ok */ }
    toast.success(rating === "up" ? "Thanks!" : "Noted.");
  };

  return (
    <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-[10px] text-[var(--tim-text-muted)] mr-1">Helpful?</span>
      <button onClick={() => handle("up")} className={`p-1 rounded transition-colors ${feedback === "up" ? "bg-[rgba(16,185,129,0.15)] text-[var(--tim-green)]" : "text-[var(--tim-text-muted)] hover:text-[var(--tim-green)]"}`}><ThumbsUp className="w-3 h-3" /></button>
      <button onClick={() => handle("down")} className={`p-1 rounded transition-colors ${feedback === "down" ? "bg-[rgba(239,68,68,0.15)] text-[var(--tim-red)]" : "text-[var(--tim-text-muted)] hover:text-[var(--tim-red)]"}`}><ThumbsDown className="w-3 h-3" /></button>
    </div>
  );
}

// ─── Structured Preview ──────────────────────────────────────────────────────
function StructuredPreview({ output }: { output: StructuredOutput }) {
  const [expanded, setExpanded] = useState(true);
  const { canExtend } = useAuth();
  const getCharClass = (count: number) => count > 200 ? "char-count-red" : count > 180 ? "char-count-amber" : "char-count-safe";

  return (
    <div className="mt-3 tim-panel overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-[var(--tim-text-secondary)] hover:text-[var(--tim-text)] transition-colors">
        <span className="flex items-center gap-2"><Music className="w-3.5 h-3.5 text-[var(--tim-accent)]" />Structured Output</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="tim-label">Style Field</label>
              <span className={`text-xs font-mono ${getCharClass(output.styleFieldCharCount)}`}>{output.styleFieldCharCount}/200</span>
            </div>
            <CopyBox text={output.styleField} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SliderReadout label="Weirdness" value={output.sliders.weirdness} />
            <SliderReadout label="Style Acc." value={output.sliders.styleAccuracy} />
            <SliderReadout label="Audio Inf." value={output.sliders.audioInfluence} />
          </div>
          {output.lyrics && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="tim-label">Lyrics</label>
                <span className={`text-xs font-mono ${output.lyrics.length > 3000 ? "char-count-red" : "char-count-safe"}`}>{output.lyrics.length}/3000</span>
              </div>
              <div className="tim-panel p-3 max-h-48 overflow-y-auto group relative" style={{ background: "var(--tim-bg-deep)" }}>
                <pre className="text-xs text-[var(--tim-text-secondary)] whitespace-pre-wrap font-mono">{output.lyrics}</pre>
                <CopyBtn text={output.lyrics} />
              </div>
            </div>
          )}
          {output.excludeField && (
            <div><label className="tim-label mb-1.5 block">Exclude</label><CopyBox text={output.excludeField} color="red" /></div>
          )}
          {output.listenFor.length > 0 && (
            <div><label className="tim-label mb-2 block">Listen For</label><div className="flex flex-wrap gap-1.5">{output.listenFor.map((item, i) => <span key={i} className="tim-badge-cyan"><Volume2 className="w-3 h-3" />{item}</span>)}</div></div>
          )}
          {output.risks.length > 0 && (
            <div><label className="tim-label mb-2 block">Risks</label><div className="flex flex-wrap gap-1.5">{output.risks.map((item, i) => <span key={i} className="tim-badge-amber"><AlertTriangle className="w-3 h-3" />{item}</span>)}</div></div>
          )}
          {output.nextStep && (
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: "rgba(0,200,224,0.05)", border: "1px solid rgba(0,200,224,0.1)" }}>
              <Sparkles className="w-4 h-4 text-[var(--tim-accent)] flex-shrink-0 mt-0.5" /><p className="text-xs text-[var(--tim-text)]">{output.nextStep}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button className="flex-1 tim-btn-primary text-xs py-2.5 rounded-lg" onClick={() => { navigator.clipboard.writeText(JSON.stringify({ style: output.styleField, lyrics: output.lyrics, exclude: output.excludeField }, null, 2)); toast.success("Suno payload copied!"); }}>
              <Copy className="w-3.5 h-3.5" />Copy Suno Payload
            </button>
            {canExtend ? (
              <button className="flex-1 tim-btn-secondary text-xs py-2.5 rounded-lg" onClick={() => toast.info("Extend coming soon!")}><Sparkles className="w-3.5 h-3.5" />Extend</button>
            ) : (
              <button className="flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 rounded-lg opacity-50 cursor-not-allowed" style={{ background: "var(--tim-panel)", border: "1px solid var(--tim-border)", color: "var(--tim-text-muted)" }} disabled><Lock className="w-3.5 h-3.5" />Extend</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────
function SliderReadout({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5"><span className="text-[11px] text-[var(--tim-text-muted)] uppercase">{label}</span><span className="text-xs font-mono font-semibold text-[var(--tim-text)]">{value}</span></div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--tim-bg-deep)" }}><div className="h-full rounded-full transition-all duration-300 bg-[var(--tim-accent)]" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function CopyBox({ text, color }: { text: string; color?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="tim-panel p-3 group relative" style={{ background: "var(--tim-bg-deep)" }}>
      <p className={`text-sm font-mono leading-relaxed break-all pr-8 ${color === "red" ? "text-[var(--tim-red)]" : "text-[var(--tim-text)]"}`}>{text}</p>
      <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("Copied!"); }} className="absolute top-2.5 right-2.5 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--tim-panel)", border: "1px solid var(--tim-border)" }}>
        {copied ? <Check className="w-3 h-3 text-[var(--tim-green)]" /> : <Copy className="w-3 h-3 text-[var(--tim-text-secondary)]" />}
      </button>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("Copied!"); }} className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--tim-panel)", border: "1px solid var(--tim-border)" }}>
      {copied ? <Check className="w-3 h-3 text-[var(--tim-green)]" /> : <Copy className="w-3 h-3 text-[var(--tim-text-secondary)]" />}
    </button>
  );
}

// ─── Preview Panel ───────────────────────────────────────────────────────────
function PreviewPanel() {
  const { currentOutput, currentSeedUrl, isPlaying, setIsPlaying, setCurrentSeedUrl } = useStore();
  const [audioResult, setAudioResult] = useState<SeedRenderResult | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(93);

  const handleGenerateSeed = async () => {
    setIsRendering(true); setFlash(false);
    try {
      await ensureAudioContext();
      const inp = getDefaultInput();
      if (currentOutput) { const m = currentOutput.styleField.match(/(\d+)\s*BPM/i); if (m) inp.bpm = parseInt(m[1]); }
      const result = await renderSeedAudio(inp);
      setAudioResult(result); setCurrentSeedUrl(result.audioUrl); setCurrentBpm(inp.bpm);
      setFlash(true); setTimeout(() => setFlash(false), 2000);
      toast.success(`Seed ready: ${result.durationSeconds.toFixed(1)}s WAV`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Render failed"); }
    finally { setIsRendering(false); }
  };

  const handlePlayPreview = async () => {
    if (isPreviewing) { stopPreview(); setIsPreviewing(false); setIsPlaying(false); }
    else {
      try { const inp = getDefaultInput(); if (currentOutput) { const m = currentOutput.styleField.match(/(\d+)\s*BPM/i); if (m) inp.bpm = parseInt(m[1]); } await playPreview(inp); setIsPreviewing(true); setIsPlaying(true); setTimeout(() => { setIsPreviewing(false); setIsPlaying(false); }, (60 / inp.bpm) * inp.bars * 4 * 1000); } catch { toast.error("Preview failed"); }
    }
  };

  const getCharClass = (c: number) => c > 200 ? "char-count-red" : c > 180 ? "char-count-amber" : "char-count-safe";

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--tim-text)] flex items-center gap-2"><div className="status-ready" />Live Preview</h3>
        <div className="flex items-center gap-1">
          {isPreviewing && <button onClick={() => { stopPreview(); setIsPreviewing(false); setIsPlaying(false); }} className="p-1.5 rounded text-[var(--tim-red)] hover:bg-[rgba(239,68,68,0.1)]"><Square className="w-3.5 h-3.5" /></button>}
          {audioResult && (
            <button onClick={() => { const a = new Audio(currentSeedUrl || ""); if (isPlaying) { a.pause(); setIsPlaying(false); } else { a.play(); setIsPlaying(true); a.onended = () => setIsPlaying(false); } }} className="flex items-center gap-1 px-3 py-1.5 text-xs tim-btn-primary rounded-md">
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}{isPlaying ? "Pause" : "Play"}
            </button>
          )}
        </div>
      </div>

      {/* Seed Generator */}
      <div className={`tim-panel p-4 transition-all duration-300 rounded-xl ${flash ? "ring-2 ring-[var(--tim-accent)]" : ""}`} style={{ background: "rgba(0,200,224,0.05)", borderColor: "rgba(0,200,224,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[var(--tim-accent)] flex items-center gap-1.5"><Headphones className="w-4 h-4" />Seed Audio Engine</span>
          {audioResult && <span className="text-[11px] font-mono text-[var(--tim-text-muted)]">{audioResult.durationSeconds.toFixed(1)}s · {currentBpm} BPM</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={handlePlayPreview} disabled={isRendering} className="flex-1 tim-btn-secondary text-xs py-2.5 rounded-lg">{isPreviewing ? <><Square className="w-3.5 h-3.5" />Stop</> : <><Play className="w-3.5 h-3.5" />Preview</>}</button>
          <button onClick={handleGenerateSeed} disabled={isRendering || isPreviewing} className="flex-1 tim-btn-primary text-xs py-2.5 rounded-lg">{isRendering ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Rendering...</> : <><Music className="w-3.5 h-3.5" />Generate Seed</>}</button>
        </div>
        {audioResult && (
          <button onClick={() => { const a = document.createElement("a"); a.href = audioResult.audioUrl; a.download = `tim-seed-${Date.now()}.wav`; a.click(); toast.success("WAV downloaded"); }} className="w-full mt-3 text-xs text-[var(--tim-accent)] hover:text-[var(--tim-accent-hover)] flex items-center justify-center gap-1.5 py-2 rounded-md transition-colors hover:bg-[rgba(0,200,224,0.05)]">
            <Download className="w-3 h-3" />Download WAV
          </button>
        )}
      </div>

      {!currentOutput ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--tim-panel)", border: "1px solid var(--tim-border)" }}><Music className="w-7 h-7 text-[var(--tim-text-muted)]" /></div>
          <p className="text-xs text-[var(--tim-text-secondary)] max-w-[200px]">Generate a track to see structured output</p>
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="tim-label">Style Field</label><span className={`text-xs font-mono ${getCharClass(currentOutput.styleFieldCharCount)}`}>{currentOutput.styleFieldCharCount}/200</span></div>
            <CopyBox text={currentOutput.styleField} />
            {currentOutput.styleFieldCharCount > 200 && <p className="text-[11px] text-[var(--tim-red)] mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Over 200 chars — may truncate</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SliderReadout label="Weirdness" value={currentOutput.sliders.weirdness} />
            <SliderReadout label="Style Acc." value={currentOutput.sliders.styleAccuracy} />
            <SliderReadout label="Audio Inf." value={currentOutput.sliders.audioInfluence} />
          </div>
          {currentOutput.lyrics && (
            <div>
              <div className="flex items-center justify-between mb-2"><label className="tim-label">Lyrics</label><span className={`text-xs font-mono ${currentOutput.lyrics.length > 3000 ? "char-count-red" : "char-count-safe"}`}>{currentOutput.lyrics.length}/3000</span></div>
              <div className="tim-panel p-3 max-h-60 overflow-y-auto group relative rounded-lg" style={{ background: "var(--tim-bg-deep)" }}>
                <pre className="text-xs text-[var(--tim-text-secondary)] whitespace-pre-wrap font-mono">{currentOutput.lyrics}</pre>
                <CopyBtn text={currentOutput.lyrics} />
              </div>
            </div>
          )}
          {currentOutput.excludeField && <div><label className="tim-label mb-2 block">Exclude</label><CopyBox text={currentOutput.excludeField} color="red" /></div>}
          {currentOutput.listenFor.length > 0 && <div><label className="tim-label mb-2 block">Listen For</label><div className="flex flex-wrap gap-1.5">{currentOutput.listenFor.map((item, i) => <span key={i} className="tim-badge-cyan"><Volume2 className="w-3 h-3" />{item}</span>)}</div></div>}
          {currentOutput.risks.length > 0 && <div><label className="tim-label mb-2 block">Risks</label><div className="flex flex-wrap gap-1.5">{currentOutput.risks.map((item, i) => <span key={i} className="tim-badge-amber"><AlertTriangle className="w-3 h-3" />{item}</span>)}</div></div>}
          {currentOutput.nextStep && <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: "rgba(0,200,224,0.05)", border: "1px solid rgba(0,200,224,0.1)" }}><Sparkles className="w-4 h-4 text-[var(--tim-accent)] flex-shrink-0 mt-0.5" /><p className="text-xs text-[var(--tim-text)]">{currentOutput.nextStep}</p></div>}
          <button className="w-full tim-btn-primary text-xs py-2.5 rounded-lg" onClick={() => { navigator.clipboard.writeText(JSON.stringify({ style: currentOutput.styleField, lyrics: currentOutput.lyrics, exclude: currentOutput.excludeField }, null, 2)); toast.success("Suno payload copied!"); }}><Copy className="w-3.5 h-3.5" />Copy Suno Payload</button>
        </>
      )}
    </div>
  );
}

// ─── Create Page ─────────────────────────────────────────────────────────────
export default function CreatePage() {
  return (
    <div className="h-full flex gap-6 p-6">
      <div className="flex-1 h-full min-h-0 overflow-hidden"><ChatPanel /></div>
      <div className="hidden lg:block w-[420px] xl:w-[480px] flex-shrink-0 h-full overflow-hidden">
        <div className="tim-panel p-5 h-full overflow-hidden flex flex-col rounded-xl"><PreviewPanel /></div>
      </div>
    </div>
  );
}
