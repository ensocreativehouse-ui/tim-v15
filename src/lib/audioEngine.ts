import * as Tone from "tone";
import type { SeedRenderInput, SeedRenderResult } from "@/types";

let audioContextStarted = false;
let currentTransport: Tone.Transport | null = null;
let currentSynths: Tone.ToneAudioNode[] = [];

export async function ensureAudioContext(): Promise<void> {
  if (!audioContextStarted) {
    await Tone.start();
    audioContextStarted = true;
  }
}

export function getDefaultInput(): SeedRenderInput {
  return { bpm: 93, bars: 8 };
}

export function stopPreview(): void {
  if (currentTransport) {
    currentTransport.stop();
    currentTransport.cancel();
  }
  currentSynths.forEach((s) => {
    try { s.dispose(); } catch { /* ok */ }
  });
  currentSynths = [];
}

// ─── WAV Encoding ────────────────────────────────────────────────────────────
function writeWavHeader(
  dataLength: number,
  sampleRate: number,
  channels: number
): ArrayBuffer {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);
  return buffer;
}

function encodeWav(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number
): Blob {
  const length = left.length;
  const interleaved = new Int16Array(length * 2);
  for (let i = 0; i < length; i++) {
    interleaved[i * 2] = Math.max(-1, Math.min(1, left[i])) * 0x7fff;
    interleaved[i * 2 + 1] = Math.max(-1, Math.min(1, right[i])) * 0x7fff;
  }
  const header = writeWavHeader(interleaved.length * 2, sampleRate, 2);
  return new Blob([header, interleaved.buffer], { type: "audio/wav" });
}

// ─── Offline Render ──────────────────────────────────────────────────────────
export async function renderSeedAudio(
  input: SeedRenderInput = getDefaultInput()
): Promise<SeedRenderResult> {
  const { bpm, bars } = input;
  const duration = (60 / bpm) * bars * 4;
  const sampleRate = 44100;

  const buffer = await Tone.Offline(() => {
    Tone.getTransport().bpm.value = bpm;

    // Kick
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 10, oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" },
      volume: -2,
    }).toDestination();

    // Snare
    const snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      volume: -6,
    }).toDestination();

    // Bass
    const bass = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
      filter: { Q: 2, type: "lowpass", rolloff: -12 },
      filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.8, baseFrequency: 80, octaves: 3 },
      volume: -10,
    }).toDestination();

    // Pad
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 2 },
      volume: -16,
    }).toDestination();
    pad.maxPolyphony = 8;

    // Sequences
    const kickLoop = new Tone.Sequence(
      (_, note) => { if (note) kick.triggerAttackRelease(note, "8n"); },
      ["C1", null, "C1", null, "C1", null, "C1", null],
      "4n"
    );

    const snareLoop = new Tone.Sequence(
      (_, note) => { if (note) snare.triggerAttackRelease("8n"); },
      [null, null, null, null, "hit", null, null, null],
      "4n"
    );

    const bassLoop = new Tone.Sequence(
      (_, note) => { if (note) bass.triggerAttackRelease(note, "8n"); },
      ["C2", "C2", "Eb2", "C2", "F2", "C2", "G2", "F2"],
      "4n"
    );

    const padLoop = new Tone.Sequence(
      (_, note) => { if (note) pad.triggerAttackRelease(note, "1n"); },
      [["C3", "Eb3", "G3"], null, ["Ab3", "C3", "Eb3"], null],
      "2n"
    );

    kickLoop.start(0);
    snareLoop.start(0);
    bassLoop.start(0);
    padLoop.start(0);

    Tone.getTransport().start();
  }, duration + 0.5);

  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;

  // Calculate peak
  let peak = 0;
  for (let i = 0; i < left.length; i++) {
    peak = Math.max(peak, Math.abs(left[i]));
  }
  const peakDb = 20 * Math.log10(peak || 0.0001);

  const wavBlob = encodeWav(left, right, sampleRate);
  const audioUrl = URL.createObjectURL(wavBlob);

  return {
    audioBlob: wavBlob,
    audioUrl,
    format: "wav",
    durationSeconds: buffer.duration,
    peakDb,
  };
}

// ─── Live Preview ────────────────────────────────────────────────────────────
export async function playPreview(input: SeedRenderInput = getDefaultInput()): Promise<void> {
  await ensureAudioContext();
  stopPreview();

  const { bpm, bars } = input;
  currentTransport = Tone.getTransport();
  currentTransport.bpm.value = bpm;

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05, octaves: 10, oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
    volume: -6,
  }).toDestination();

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
    volume: -10,
  }).toDestination();

  const bass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
    filter: { Q: 2, type: "lowpass", rolloff: -12 },
    filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.8, baseFrequency: 80, octaves: 3 },
    volume: -12,
  }).toDestination();

  currentSynths.push(kick, snare, bass);

  new Tone.Sequence((_, note) => { if (note) kick.triggerAttackRelease(note, "8n"); }, ["C1", null, "C1", null], "4n").start(0);
  new Tone.Sequence((_, note) => { if (note) snare.triggerAttackRelease("8n"); }, [null, null, null, null], "4n").start(0);
  new Tone.Sequence((_, note) => { if (note) bass.triggerAttackRelease(note, "8n"); }, ["C2", "C2", "Eb2", "C2"], "4n").start(0);

  currentTransport.start();

  // Auto-stop
  const dur = (60 / bpm) * bars * 4 * 1000;
  setTimeout(() => stopPreview(), dur);
}
