export type Tier = "stock" | "creator" | "pro";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  structuredOutput?: StructuredOutput;
}

export interface StructuredOutput {
  styleField: string;
  styleFieldCharCount: number;
  sliders: {
    weirdness: number;
    styleAccuracy: number;
    audioInfluence: number;
  };
  lyrics: string;
  excludeField: string;
  listenFor: string[];
  risks: string[];
  nextStep: string;
}

export interface AgentResponse {
  response: string;
  structuredOutput: StructuredOutput;
  metadata: {
    mode: string;
    extend: boolean;
    phoneticNames: string[];
    sessionId: string;
    layerNumber: number;
  };
}

export interface SeedRenderInput {
  bpm: number;
  bars: number;
}

export interface SeedRenderResult {
  audioBlob: Blob;
  audioUrl: string;
  format: "wav";
  durationSeconds: number;
  peakDb: number;
}

export const TIER_LIMITS: Record<Tier, number> = {
  stock: 1,
  creator: 3,
  pro: 999,
};
