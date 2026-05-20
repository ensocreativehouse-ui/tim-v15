import { create } from "zustand";
import type { ChatMessage, StructuredOutput } from "@/types";

export type TimStatus = "connecting" | "online" | "offline" | "thinking";

interface StoreState {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;

  currentOutput: StructuredOutput | null;
  setCurrentOutput: (o: StructuredOutput | null) => void;
  currentSeedUrl: string | null;
  setCurrentSeedUrl: (url: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;

  isLoading: boolean;
  setIsLoading: (v: boolean) => void;

  timStatus: TimStatus;
  setTimStatus: (s: TimStatus) => void;

  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
  onboardingStep: number;
  setOnboardingStep: (v: number) => void;

  isListening: boolean;
  setIsListening: (v: boolean) => void;
  voiceTranscript: string;
  setVoiceTranscript: (t: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  currentOutput: null,
  setCurrentOutput: (o) => set({ currentOutput: o }),
  currentSeedUrl: null,
  setCurrentSeedUrl: (url) => set({ currentSeedUrl: url }),
  isPlaying: false,
  setIsPlaying: (v) => set({ isPlaying: v }),

  isLoading: false,
  setIsLoading: (v) => set({ isLoading: v }),

  timStatus: "connecting",
  setTimStatus: (s) => set({ timStatus: s }),

  showOnboarding: false,
  setShowOnboarding: (v) => set({ showOnboarding: v }),
  onboardingStep: 0,
  setOnboardingStep: (v) => set({ onboardingStep: v }),

  isListening: false,
  setIsListening: (v) => set({ isListening: v }),
  voiceTranscript: "",
  setVoiceTranscript: (t) => set({ voiceTranscript: t }),
}));
