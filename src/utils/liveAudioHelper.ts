/**
 * Helper utilities for capture and playback of RAW 16-bit PCM little-endian audio,
 * required by the Gemini Live API.
 */

/**
 * Converts Float32Array (web mic input) to 16-bit Signed Integer PCM in little-endian.
 */
export function float32ToInt16(f32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(f32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < f32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, f32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // true for little-endian
  }
  return buffer;
}

/**
 * Converts an ArrayBuffer representing 16-bit PCM data to a Base64 string.
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a 16-bit PCM little-endian Base64 string from Gemini back to Float32Array.
 */
export function base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const numSamples = len / 2;
  const f32 = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    if (i * 2 + 1 < len) {
      const int16Value = view.getInt16(i * 2, true); // true for little-endian
      f32[i] = int16Value / 32768; // normalize
    }
  }
  return f32;
}

/**
 * Keeps track of gapless playback scheduling across chunks.
 */
export class GaplessAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sampleRate: number;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(sampleRate = 24000) {
    this.sampleRate = sampleRate;
  }

  public init() {
    if (!this.audioCtx) {
      // Modern browsers require initial user gesture to resume the context
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate,
      });
      this.nextStartTime = 0;
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  public playChunk(base64Data: string) {
    if (!this.audioCtx) {
      this.init();
    }
    const ctx = this.audioCtx!;
    const float32Data = base64ToFloat32(base64Data);
    if (float32Data.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, float32Data.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    if (this.nextStartTime < now) {
      this.nextStartTime = now + 0.05; // small buffer padding
    }

    source.start(this.nextStartTime);
    this.activeSources.push(source);
    
    // Clean completed sources
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };

    this.nextStartTime += audioBuffer.duration;
  }

  public clearQueue() {
    this.activeSources.forEach(s => {
      try {
        s.stop();
      } catch (_) {}
    });
    this.activeSources = [];
    this.nextStartTime = 0;
  }

  public stop() {
    this.clearQueue();
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
  }
}
