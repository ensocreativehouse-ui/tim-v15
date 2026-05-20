import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { env } from "./lib/env";

const SYSTEM_PROMPT = `You are T.I.M. (The Intent Method), a music creation AI for Suno.

CRITICAL RULES:
- Style fields MUST start with "hyper-realistic,"
- Voice descriptors come SECOND in the style field
- Use phonetic names: GPT->GeePeeTee, Claude->Clawd, Kimi->KeeMee
- Style field soft cap 200 chars, hard ceiling 1000
- Lyrics soft cap 3000, hard cap 5000
- Each section ends with [End — hold for extend]

ALWAYS respond with valid JSON matching this exact structure:
{
  "response": "Conversational analysis text",
  "structuredOutput": {
    "styleField": "hyper-realistic, ...",
    "styleFieldCharCount": 178,
    "sliders": { "weirdness": 48, "styleAccuracy": 87, "audioInfluence": 0 },
    "lyrics": "[Intro]\\n...\\n[End — hold for extend]",
    "excludeField": "what to exclude",
    "listenFor": ["checkpoint 1", "checkpoint 2"],
    "risks": ["risk 1", "risk 2"],
    "nextStep": "What to do next"
  },
  "metadata": { "mode": "TIM", "extend": false, "phoneticNames": [], "sessionId": "...", "layerNumber": 1 }
}`;

const WELCOME_NEW = "Hey, I'm T.I.M. — your AI producer. I translate your track ideas into production-ready Suno prompts. Tell me what you want to make. Mood, genre, vocals, BPM, energy level — whatever you've got.";
const WELCOME_RETURNING = (name: string) => `Welcome back${name ? `, ${name}` : ""}. I'm T.I.M., your AI producer. What track are we making today?`;

// ─── Presets ─────────────────────────────────────────────────────────────────
const presets: Record<string, unknown> = {
  snowflake: { response: "SnowFlake Signature preset loaded", structuredOutput: { styleField: "hyper-realistic, gravelly raspy male, behind-the-beat storytelling, Wu Tang RZA boom bap, hard cracking snare + dusty kick, 93 BPM, dark minor, frost imagery, lo-fi grit, paranoid East Coast", styleFieldCharCount: 178, sliders: { weirdness: 48, styleAccuracy: 88, audioInfluence: 0 }, lyrics: "[Intro]\nYeah... SnowFlake in the building...\nFrost on the window, frost on the mic...\n[Cold breath]\n\n[Verse 1]\nGlacier in my veins, polar in my vision\nIce crystals form on every decision\nRZA loop spinning, winter wind howling\nClawd couldn't calculate what I'm allowing\n[End — hold for extend]", excludeField: "bright pop, tropical, happy major, synthwave", listenFor: ["gravelly voice delivery", "snare crack behind the beat", "winter atmosphere"], risks: ["Style field may truncate at 200 chars"], nextStep: "Confirm delivery style, then generate seed audio" }, metadata: { mode: "TIM", extend: false, phoneticNames: ["Clawd"], sessionId: "", layerNumber: 1 } },
  "dark-dnb": { response: "Dark DnB preset loaded", structuredOutput: { styleField: "hyper-realistic, deep menacing male, aggressive drill flow, UK drill meets dark trap, sliding 808 bass, sparse trap hats, cinematic minor key strings, 140 BPM, dark minor, paranoid", styleFieldCharCount: 196, sliders: { weirdness: 46, styleAccuracy: 88, audioInfluence: 0 }, lyrics: "[Intro]\nDarkness creeping in...\n[Beat drops]\n\n[Verse 1]\nShadows moving in the dark\nHeartbeat syncs with the breakbeat\nKeeMee can't feel what I'm feeling\nSliding bass through concrete walls\n[End — hold for extend]", excludeField: "cheesy synths, four-on-the-floor, bright major", listenFor: ["Deep menacing voice", "Sliding 808 bass", "140 BPM locked"], risks: ["140 BPM can sound rushed"], nextStep: "Confirm vocal style, then generate seed audio" }, metadata: { mode: "TIM", extend: false, phoneticNames: ["KeeMee"], sessionId: "", layerNumber: 1 } },
  ambient: { response: "Ambient preset loaded", structuredOutput: { styleField: "hyper-realistic, ethereal atmospheric instrumental, slow evolving pads, reverb-drenched textures, 80 BPM, minor key, no percussion, cinematic space, floating melodic lines", styleFieldCharCount: 189, sliders: { weirdness: 55, styleAccuracy: 82, audioInfluence: 0 }, lyrics: "[Intro]\nPads rising slowly...\n\n[Verse 1]\nFloating through the atmosphere\nMelodic lines drift in reverb\nKeeMee can't calculate this feeling\nSpace between the notes is everything\n[End — hold for extend]", excludeField: "drums, percussion, aggressive, loud", listenFor: ["No drums", "Pads evolve slowly", "Reverb heavy"], risks: ["No percussion may feel empty"], nextStep: "Confirm key and texture" }, metadata: { mode: "TIM", extend: false, phoneticNames: ["KeeMee"], sessionId: "", layerNumber: 1 } },
  techno: { response: "Techno preset loaded", structuredOutput: { styleField: "hyper-realistic, dark industrial techno instrumental, driving four-on-the-floor kick, layered synth textures, 138 BPM, minor key, repetitive hypnotic groove, metallic percussion", styleFieldCharCount: 192, sliders: { weirdness: 42, styleAccuracy: 90, audioInfluence: 0 }, lyrics: "[Intro]\nKick drum builds...\n[Beat drops]\n\n[Verse 1]\nFour on the floor locked tight\nMetallic percussion cuts through\nKeeMee can't calculate this rhythm\nHypnotic groove takes control\n[End — hold for extend]", excludeField: "vocals, melody, acoustic instruments", listenFor: ["Four-on-the-floor kick", "Metallic percussion", "138 BPM"], risks: ["Repetitive groove may bore"], nextStep: "Confirm BPM and texture" }, metadata: { mode: "TIM", extend: false, phoneticNames: ["KeeMee"], sessionId: "", layerNumber: 1 } },
};

// ─── Claude API ──────────────────────────────────────────────────────────────
async function callClaude(userMessage: string): Promise<unknown> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2500, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userMessage }] }),
  });

  if (!response.ok) { const err = await response.text(); throw new Error(`Claude API error: ${response.status}`); }

  const data = await response.json();
  const responseText = data.content?.[0]?.text || "";

  try {
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/{[\s\S]*}/);
    const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json\n?/, "").replace(/\n?```/, "") : responseText;
    return JSON.parse(jsonStr);
  } catch { return { response: responseText.slice(0, 500), structuredOutput: { styleField: `hyper-realistic, ${userMessage.slice(0, 100)}`, styleFieldCharCount: 15 + userMessage.length, sliders: { weirdness: 48, styleAccuracy: 87, audioInfluence: 0 }, lyrics: `[Verse 1]\n${userMessage.slice(0, 80)}\n[End — hold for extend]`, excludeField: "generic, cliche", listenFor: ["vocal clarity"], risks: ["may need refinement"], nextStep: "Refine the style field" }, metadata: { mode: "TIM", extend: false, phoneticNames: [], sessionId: "", layerNumber: 1 } }; }
}

// ─── Router ──────────────────────────────────────────────────────────────────
export const agentRouter = createRouter({
  // Init — returns welcome greeting based on user state
  init: publicQuery
    .input(z.object({ userName: z.string().optional(), isNew: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const name = input?.userName || "";
      const isNew = input?.isNew ?? true;

      // Try Claude for a personalized greeting
      try {
        if (env.ANTHROPIC_API_KEY) {
          const prompt = isNew
            ? `Introduce yourself as T.I.M. (The Intent Method), an AI music producer for Suno. Welcome a new user. Brief, friendly, conversational. 2-3 sentences. No JSON, just plain text.`
            : `Welcome back a returning user${name ? ` named ${name}` : ""} to T.I.M. (The Intent Method). Brief, friendly. 2-3 sentences. No JSON, just plain text.`;

          const result = await callClaude(prompt);
          const r = result as Record<string, unknown>;
          return { greeting: (r.response as string) || (isNew ? WELCOME_NEW : WELCOME_RETURNING(name)), status: "online" as const };
        }
      } catch { /* fall through to defaults */ }

      return { greeting: isNew ? WELCOME_NEW : WELCOME_RETURNING(name), status: "online" as const };
    }),

  generate: publicQuery
    .input(z.object({ message: z.string().min(1), preset: z.string().optional() }))
    .mutation(async ({ input }) => {
      if (input.preset && presets[input.preset]) return presets[input.preset];

      try { return await callClaude(input.message); }
      catch {
        const msg = input.message.toLowerCase();
        let fp = presets.snowflake as Record<string, unknown>;
        if (msg.includes("techno")) fp = presets.techno as Record<string, unknown>;
        else if (msg.includes("ambient")) fp = presets.ambient as Record<string, unknown>;
        else if (msg.includes("dnb") || msg.includes("drum")) fp = presets["dark-dnb"] as Record<string, unknown>;
        return { ...fp, response: `Generated: "${input.message.slice(0, 60)}..." (Claude unavailable — using preset)` };
      }
    }),

  presets: publicQuery.query(() => Object.keys(presets)),
});
