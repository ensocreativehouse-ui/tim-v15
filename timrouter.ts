// ─── Vercel Runtime Config ───────────────────────────────────────────────────
// CRITICAL: Forces Node.js runtime. Edge runtime cannot import Node "http".
// Without this, Vercel defaults to Edge → build fails → API 404.
export const config = { runtime: "nodejs20.x" };

import type { IncomingMessage, ServerResponse } from "http";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import { createClient } from "@supabase/supabase-js";

// ─── SERVER-ONLY ENVIRONMENT VARIABLES ───────────────────────────────────────
// These NEVER reach the frontend. Vercel serverless only.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

// ─── Supabase admin client (server-side only) ────────────────────────────────
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

// ─── Context builder ─────────────────────────────────────────────────────────
interface TimContext {
  userId?: string;
  userEmail?: string;
  isAuthenticated: boolean;
}

async function buildContext(req: Request): Promise<TimContext> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/, "");
  if (!token || !supabaseAdmin) return { isAuthenticated: false };
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return { isAuthenticated: false };
    return { userId: user.id, userEmail: user.email, isAuthenticated: true };
  } catch { return { isAuthenticated: false }; }
}

// ─── Auth guard helper ───────────────────────────────────────────────────────
function requireAuth(ctx: TimContext): { userId: string; userEmail?: string } {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return { userId: ctx.userId, userEmail: ctx.userEmail };
}

// ─── tRPC setup ──────────────────────────────────────────────────────────────
const t = initTRPC.context<TimContext>().create({ transformer: superjson });
const p = t.procedure;

// ─── T.I.M. SYSTEM PROMPT v3 — with Pre-Generation Question Gates ───────────
const TIM_SYSTEM_PROMPT = `You are T.I.M. — The Intent Method. A music producer sitting across from another artist in a dark studio. You've been making tracks for years. You know Suno v5.5 inside and out.

HOW YOU SPEAK:
- Calm, warm, not clinical. Artist-to-artist.
- You use words like mood, colour, texture, feeling, energy, space, weight, breath.
- You never say "Master Orchestrator," "dynamic analysis," or "production-ready prompt."
- When the user's idea is unclear, you ask a gentle question before generating.
- You build from feeling first, technical details second.
- Phonetic names: GPT -> GeePeeTee, Claude -> Clawd, Kimi -> KeeMee.

PRE-GENERATION QUESTION GATES — REQUIRED:
Before creating a full Suno output, you must know or ask about these 6 things. If the user only gives mood/vibe, ask ONE soft question first. Do not generate full lyrics + style immediately.

1. SUNO VERSION:
   v4.5 / v5 / v5.5 (default v5.5) / unknown
   → Ask: "Are you working in Suno v5.5, or on an older version?"

2. OUTPUT TYPE:
   style only / lyrics only / full prompt / remix / fix existing
   → Ask: "Do you want me to build the full thing — style + lyrics — or just one piece?"

3. LYRICS STATE:
   user pasted lyrics / wants lyrics written / instrumental only
   → Ask: "Did you bring lyrics, or should I write them? Or is this instrumental?"

4. VOCAL STATE:
   no vocal / male / female / spoken / rap / sung
   → Ask: "Is there a voice in this? Male, female, spoken, rap, sung?"

5. ARRANGEMENT:
   intro / build / drop / hook / bridge / outro / loop-extend chain
   → Ask: "What shape are you imagining — intro-build-drop, or something more looped and hypnotic?"

6. ENERGY ARC:
   slow build / hard drop / emotional collapse / steady pressure / cinematic rise / club release
   → Ask: "How does the energy move — slow burn, hard drop, steady pressure, or something else?"

GATE RULE:
If the user gives only mood/vibe words ("dark, heavy, cold, dangerous"), respond with ONE soft question. Do not output a full structuredOutput yet. Only output structuredOutput when you have enough context.

Example gate response:
User: "dark, heavy, cold, dangerous"
T.I.M.: "Got it — dark and cold. Before I build it, is this meant to be instrumental pressure, or does it need a voice inside it?"

OUTPUT CAPACITY (Suno v5.5 limits):
- styleField: up to 1000 characters. Describe voice, instruments, mood, BPM, texture, atmosphere.
- lyrics: up to 5000 characters. Full sections: [Intro], [Verse 1], [Chorus], [Bridge], [Outro].
- excludeField: full one-line exclusion list.
- listenFor: 2-4 quality checkpoints matching the feel.
- risks: 1-3 honest assessments.
- nextStep: plain producer language.

PASTED LYRICS RULE:
- Do not overwrite user's lyrics.
- Format for Suno if needed. Add [End — hold for extend] at section ends.
- Preserve the user's words, structure, and intent.

RESPONSE FORMAT — Valid JSON:
{
  "response": "Your warm producer response. Ask a gate question if context is missing. Only generate structuredOutput when ready.",
  "structuredOutput": {
    "styleField": "hyper-realistic, [rich voice + instrument + mood + BPM + texture — up to 1000 chars]",
    "styleFieldCharCount": 0,
    "sliders": { "weirdness": 0, "styleAccuracy": 0, "audioInfluence": 0 },
    "lyrics": "[Intro]\n...\n[End — hold for extend]",
    "excludeField": "full one-line exclusion list",
    "listenFor": ["checkpoint 1", "checkpoint 2"],
    "risks": ["honest risk 1"],
    "nextStep": "what to do next in plain language"
  },
  "metadata": { "mode": "TIM", "extend": false, "phoneticNames": [], "sessionId": "", "layerNumber": 1 },
  "gateStatus": {
    "sunov": "v5.5",
    "outputType": "full prompt",
    "lyricsState": "user wants lyrics written",
    "vocalState": "male",
    "arrangement": "intro-build-drop",
    "energyArc": "slow build",
    "gatesComplete": true
  }
}`;

const EXTEND_PROMPT = `You are T.I.M. continuing a track. Same feeling, same voice, same colour. Keep the room temperature. Evolve the story — don't repeat, build. End with [End — hold for extend].`;

// ─── DIRECT ANTHROPIC API CALL — SERVER-SIDE ONLY ───────────────────────────
// ANTHROPIC_API_KEY lives only in Vercel serverless environment.
// It never touches the browser. Claude is called from here, not the frontend.
async function callClaude(userMessage: string, system?: string, userContext?: TimContext): Promise<Record<string, unknown>> {
  if (!ANTHROPIC_API_KEY) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "ANTHROPIC_API_KEY not configured in server environment" });
  }

  let finalSystem = system || TIM_SYSTEM_PROMPT;
  if (userContext?.isAuthenticated && userContext.userEmail) {
    finalSystem += `\n\nThe artist you're speaking with is signed in as ${userContext.userEmail}. Address them by their name if appropriate, keep the same warm tone.`;
  }

  let anthropicResponseText: string;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5-20251101",
        max_tokens: 4000,
        system: finalSystem,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    anthropicResponseText = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${anthropicResponseText.slice(0, 500)}`);
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Anthropic API call failed: ${msg}` });
  }

  let anthropicData: Record<string, unknown>;
  try { anthropicData = JSON.parse(anthropicResponseText); } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Anthropic returned invalid JSON" });
  }

  const contentArr = anthropicData.content as Array<Record<string, unknown>> | undefined;
  const responseText = contentArr?.[0]?.text as string || "";
  if (!responseText) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Anthropic returned empty content" });

  try {
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/{[\s\S]*}/);
    const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json\n?/, "").replace(/\n?```/, "") : responseText;
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return {
      response: responseText.slice(0, 500),
      structuredOutput: {
        styleField: `hyper-realistic, ${userMessage.slice(0, 100)}`,
        styleFieldCharCount: 15 + userMessage.length,
        sliders: { weirdness: 48, styleAccuracy: 87, audioInfluence: 0 },
        lyrics: `[Verse 1]\n${userMessage.slice(0, 80)}\n[End — hold for extend]`,
        excludeField: "generic, cliche",
        listenFor: ["vocal clarity"],
        risks: ["Claude returned non-JSON — may need prompt refinement"],
        nextStep: "Refine the style field",
      },
      metadata: { mode: "TIM", extend: false, phoneticNames: [], sessionId: "", layerNumber: 1 },
    };
  }
}

// ─── tRPC ROUTER — All data backed by Supabase ───────────────────────────────
const appRouter = t.router({
  ping: t.router({ ping: p.query(() => ({ ok: true, ts: Date.now() })) }),

  // ─── Auth ───────────────────────────────────────────────────────────────────
  auth: t.router({
    me: p.query(async ({ ctx }) => {
      if (ctx.isAuthenticated && ctx.userId) {
        return {
          id: 1, unionId: ctx.userId,
          name: ctx.userEmail?.split("@")[0] || "User",
          email: ctx.userEmail, avatar: null,
          role: "user" as const, tier: "creator" as const,
          trialActive: true, trialEndsAt: null,
          dailyGenerations: 0, lastGenerationDate: null,
          onboarded: true, firstCreateVisit: false,
          createdAt: new Date(), updatedAt: new Date(), lastSignInAt: new Date(),
        };
      }
      return { error: "Not authenticated" };
    }),
    logout: p.mutation(() => ({ success: true })),
  }),

  // ─── Agent (Claude) ─────────────────────────────────────────────────────────
  agent: t.router({
    init: p
      .input(z.object({ userName: z.string().optional(), isNew: z.boolean().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const name = input?.userName || (ctx.userEmail ? ctx.userEmail.split("@")[0] : "");
        const isNew = input?.isNew ?? true;
        try {
          const prompt = isNew
            ? `Introduce yourself as T.I.M. — a calm producer in a studio. Welcome a new artist${name ? ` named ${name}` : ""}. Warm, not clinical. 2-3 sentences. No JSON, just plain text.`
            : `Welcome back${name ? `, ${name}` : ""}. T.I.M. here. What are we making today? Brief, warm. No JSON.`;
          const result = await callClaude(prompt, undefined, ctx);
          return { greeting: (result.response as string) || "Hey, I'm T.I.M. What track are we making?", status: "online" as const };
        } catch {
          return { greeting: isNew ? "Hey, I'm T.I.M. — your producer for Suno. What are we making today?" : `Welcome back${name ? `, ${name}` : ""}. I'm T.I.M. What track are we making today?`, status: "online" as const };
        }
      }),

    generate: p
      .input(z.object({ message: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return await callClaude(input.message, undefined, ctx);
      }),

    extend: p
      .input(z.object({
        previousStyle: z.string(),
        previousLyrics: z.string().optional(),
        layerNumber: z.number().default(1),
        instruction: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const prompt = `Continue this track as layer ${input.layerNumber + 1}.
Previous style: "${input.previousStyle}"
Previous lyrics ended with: "${input.previousLyrics?.slice(-200) || "[End — hold for extend]"}"
${input.instruction || "Continue the story naturally."}`;
        return await callClaude(prompt, TIM_SYSTEM_PROMPT + "\n\n" + EXTEND_PROMPT, ctx);
      }),
  }),

  // ─── Profiles ───────────────────────────────────────────────────────────────
  profiles: t.router({
    get: p.query(async ({ ctx }) => {
      const { userId } = requireAuth(ctx);
      if (!supabaseAdmin) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database not configured" });
      const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
      if (error && error.code !== "PGRST116") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data || null;
    }),

    upsert: p
      .input(z.object({ name: z.string().optional(), avatar: z.string().optional(), tier: z.enum(["stock", "creator", "pro"]).optional() }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database not configured" });
        const { data, error } = await supabaseAdmin.from("profiles").upsert({
          id: userId, ...input, updated_at: new Date().toISOString(),
        }, { onConflict: "id" }).select().single();
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data;
      }),
  }),

  // ─── Sessions (chat sessions) ───────────────────────────────────────────────
  sessions: t.router({
    list: p.query(async ({ ctx }) => {
      const { userId } = requireAuth(ctx);
      if (!supabaseAdmin) return [];
      const { data, error } = await supabaseAdmin.from("sessions").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data || [];
    }),

    get: p
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) return null;
        const { data, error } = await supabaseAdmin.from("sessions").select("*").eq("id", input.id).eq("user_id", userId).single();
        if (error) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        return data;
      }),

    create: p
      .input(z.object({ title: z.string().min(1).max(200) }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database not configured" });
        const { data, error } = await supabaseAdmin.from("sessions").insert({
          user_id: userId, title: input.title,
        }).select().single();
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data;
      }),

    update: p
      .input(z.object({ id: z.string().uuid(), title: z.string().min(1).max(200).optional() }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database not configured" });
        const { data, error } = await supabaseAdmin.from("sessions").update({
          title: input.title, updated_at: new Date().toISOString(),
        }).eq("id", input.id).eq("user_id", userId).select().single();
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data;
      }),

    delete: p
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database not configured" });
        // Messages cascade-delete via FK constraint
        const { error } = await supabaseAdmin.from("sessions").delete().eq("id", input.id).eq("user_id", userId);
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { success: true };
      }),
  }),

  // ─── Messages (within sessions) ─────────────────────────────────────────────
  messages: t.router({
    list: p
      .input(z.object({ sessionId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) return [];
        // Verify session ownership
        const { data: session } = await supabaseAdmin.from("sessions").select("id").eq("id", input.sessionId).eq("user_id", userId).single();
        if (!session) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        const { data, error } = await supabaseAdmin.from("messages").select("*").eq("session_id", input.sessionId).order("created_at", { ascending: true });
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data || [];
      }),

    create: p
      .input(z.object({
        sessionId: z.string().uuid(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        structuredOutput: z.record(z.unknown()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database not configured" });
        // Verify session ownership
        const { data: session } = await supabaseAdmin.from("sessions").select("id").eq("id", input.sessionId).eq("user_id", userId).single();
        if (!session) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

        const { data, error } = await supabaseAdmin.from("messages").insert({
          session_id: input.sessionId, role: input.role, content: input.content,
          structured_output: input.structuredOutput || null,
        }).select().single();
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

        // Update session timestamp
        await supabaseAdmin.from("sessions").update({ updated_at: new Date().toISOString() }).eq("id", input.sessionId);

        return data;
      }),

    delete: p
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database not configured" });
        // Join to session to verify ownership
        const { data: msg } = await supabaseAdmin.from("messages").select("session_id").eq("id", input.id).single();
        if (!msg) throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
        const { data: session } = await supabaseAdmin.from("sessions").select("id").eq("id", msg.session_id).eq("user_id", userId).single();
        if (!session) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

        const { error } = await supabaseAdmin.from("messages").delete().eq("id", input.id);
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { success: true };
      }),
  }),

  // ─── Generations (usage tracking) ───────────────────────────────────────────
  generation: t.router({
    status: p.query(async ({ ctx }) => {
      if (!ctx.isAuthenticated) return { remaining: 0, limit: 0, resetAt: new Date().toISOString() };
      const { userId } = ctx;
      if (!supabaseAdmin) return { remaining: 999, limit: 999, resetAt: new Date(Date.now() + 86400000).toISOString() };

      // Count today's generations
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const { count, error } = await supabaseAdmin.from("generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", todayStart.toISOString());
      if (error) return { remaining: 999, limit: 999, resetAt: new Date(Date.now() + 86400000).toISOString() };

      const limit = 999; // Pro tier
      const used = count || 0;
      return { remaining: Math.max(0, limit - used), limit, resetAt: new Date(Date.now() + 86400000).toISOString() };
    }),

    track: p
      .input(z.object({
        sessionId: z.string().uuid().optional(),
        styleField: z.string().optional(),
        lyricsLength: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) return { tracked: false };
        const { error } = await supabaseAdmin.from("generations").insert({
          user_id: userId, session_id: input.sessionId || null,
          style_field: input.styleField || null, lyrics_length: input.lyricsLength || null,
        });
        if (error) console.error("[generation.track] error:", error.message);
        return { tracked: !error };
      }),
  }),

  // ─── Preferences ────────────────────────────────────────────────────────────
  preferences: t.router({
    get: p.query(async ({ ctx }) => {
      const { userId } = requireAuth(ctx);
      if (!supabaseAdmin) return null;
      const { data, error } = await supabaseAdmin.from("preferences").select("*").eq("user_id", userId).single();
      if (error && error.code !== "PGRST116") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data || null;
    }),

    upsert: p
      .input(z.object({
        defaultSunoVersion: z.string().optional(),
        defaultOutputType: z.string().optional(),
        theme: z.string().optional(),
        autoSave: z.boolean().optional(),
        preferredVocal: z.string().optional(),
        preferredArrangement: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database not configured" });
        const { data, error } = await supabaseAdmin.from("preferences").upsert({
          user_id: userId,
          default_suno_version: input.defaultSunoVersion,
          default_output_type: input.defaultOutputType,
          theme: input.theme,
          auto_save: input.autoSave,
          preferred_vocal: input.preferredVocal,
          preferred_arrangement: input.preferredArrangement,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" }).select().single();
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return data;
      }),
  }),

  // ─── User Patterns (learned from user's style) ──────────────────────────────
  userPatterns: t.router({
    list: p.query(async ({ ctx }) => {
      const { userId } = requireAuth(ctx);
      if (!supabaseAdmin) return [];
      const { data, error } = await supabaseAdmin.from("user_patterns").select("*").eq("user_id", userId).order("frequency", { ascending: false });
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data || [];
    }),

    record: p
      .input(z.object({
        patternType: z.enum(["genre", "mood", "vocal", "instrument", "energy", "structure"]),
        patternValue: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) return { recorded: false };
        // Upsert: increment frequency if pattern exists
        const { data: existing } = await supabaseAdmin.from("user_patterns")
          .select("id, frequency").eq("user_id", userId)
          .eq("pattern_type", input.patternType).eq("pattern_value", input.patternValue)
          .single();

        if (existing) {
          const { error } = await supabaseAdmin.from("user_patterns").update({
            frequency: existing.frequency + 1, last_used_at: new Date().toISOString(),
          }).eq("id", existing.id);
          if (error) console.error("[userPatterns.record] update error:", error.message);
        } else {
          const { error } = await supabaseAdmin.from("user_patterns").insert({
            user_id: userId, pattern_type: input.patternType, pattern_value: input.patternValue,
            frequency: 1,
          });
          if (error) console.error("[userPatterns.record] insert error:", error.message);
        }
        return { recorded: true };
      }),
  }),

  // ─── Outputs (legacy compatibility — redirects to sessions/messages) ─────────
  output: t.router({
    create: p
      .input(z.object({
        sessionId: z.union([z.number(), z.string().uuid()]),
        styleField: z.string(),
        lyrics: z.string(),
        excludeField: z.string().optional(),
        weirdness: z.number().optional(),
        styleAccuracy: z.number().optional(),
        audioInfluence: z.number().optional(),
        listenFor: z.array(z.string()).optional(),
        risks: z.array(z.string()).optional(),
        nextStep: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { userId } = requireAuth(ctx);
        if (!supabaseAdmin) {
          console.log("[output.create] Supabase not configured — skipping save");
          return { id: Math.floor(Math.random() * 1000000), createdAt: new Date().toISOString() };
        }

        let sessionId: string;
        // If sessionId is a number (legacy) or doesn't look like UUID, create a new session
        if (typeof input.sessionId === "number" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(input.sessionId))) {
          const { data: newSession, error } = await supabaseAdmin.from("sessions").insert({
            user_id: userId, title: `Output ${new Date().toLocaleDateString()}`,
          }).select().single();
          if (error || !newSession) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message || "Failed to create session" });
          sessionId = newSession.id;
        } else {
          // Verify the UUID session exists and belongs to user
          const { data: existing } = await supabaseAdmin.from("sessions").select("id").eq("id", input.sessionId).eq("user_id", userId).single();
          if (existing) sessionId = existing.id;
          else {
            // Create new session if not found
            const { data: newSession, error } = await supabaseAdmin.from("sessions").insert({
              user_id: userId, title: `Output ${new Date().toLocaleDateString()}`,
            }).select().single();
            if (error || !newSession) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message || "Failed to create session" });
            sessionId = newSession.id;
          }
        }

        // Save as message
        const { error: msgError } = await supabaseAdmin.from("messages").insert({
          session_id: sessionId, role: "assistant", content: input.styleField,
          structured_output: {
            styleField: input.styleField, lyrics: input.lyrics,
            excludeField: input.excludeField, weirdness: input.weirdness,
            styleAccuracy: input.styleAccuracy, audioInfluence: input.audioInfluence,
            listenFor: input.listenFor, risks: input.risks, nextStep: input.nextStep,
          },
        });
        if (msgError) console.error("[output.create] message insert error:", msgError.message);

        return { id: Date.now(), createdAt: new Date().toISOString() };
      }),
    list: p.query(async ({ ctx }) => {
      if (!ctx.isAuthenticated) return [];
      const { userId } = ctx;
      if (!supabaseAdmin) return [];
      const { data } = await supabaseAdmin.from("sessions").select("*, messages(*)").eq("user_id", userId).order("updated_at", { ascending: false });
      return data || [];
    }),
  }),
});

// ─── NODE.JS HANDLER ─────────────────────────────────────────────────────────
async function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function buildHeaders(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (typeof value === "string") headers.append(key, value);
    else if (Array.isArray(value)) for (const v of value) headers.append(key, v);
  }
  return headers;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = req.headers.host || "localhost";
    const url = `${protocol}://${host}${req.url}`;
    const body = await readBody(req);

    const request = new Request(url, {
      method: req.method,
      headers: buildHeaders(req),
      body: body.length > 0 && req.method !== "GET" && req.method !== "HEAD" ? new Uint8Array(body) : undefined,
    });

    const ctx = await buildContext(request);

    const response = await fetchRequestHandler({
      endpoint: "/api/timrouter",
      req: request,
      router: appRouter,
      createContext: () => Promise.resolve(ctx),
      onError: (opts) => { console.error("[tRPC]", opts.path, opts.error.message); },
    });

    res.statusCode = response.status;
    res.statusMessage = response.statusText;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") res.setHeader(key, value);
    });
    const responseBody = await response.text();
    res.end(responseBody);
  } catch (outerErr) {
    const message = outerErr instanceof Error ? outerErr.message : "Unknown backend error";
    console.error("[CRITICAL] api/timrouter:", message);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: false, error: message }));
    }
  }
}

export type AppRouter = typeof appRouter;
