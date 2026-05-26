/**
 * SoundEngine.ts
 * Immersive Procedural Web Audio API Synthesizer for high-technology auditive feedback.
 * Generates custom cybernetic sounds on-the-fly without requiring static asset files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialized on first user interaction to comply with web browser autoplay security policies
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtxClass();
      } catch (err) {
        console.warn("Web Audio API not supported in this browser:", err);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem("dafne_sound_muted", muted ? "true" : "false");
  }

  public getMuted(): boolean {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dafne_sound_muted");
      if (saved !== null) {
        return saved === "true";
      }
    }
    return this.isMuted;
  }

  /**
   * Safe oscillator creator with master gain and envelope control
   */
  private playTone(
    freqs: number[],
    durations: number[],
    type: OscillatorType = "sine",
    gains: number[] = [0.15, 0.0],
    detune: number = 0
  ) {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqs[0], now);
      
      // Sweep frequencies if multiple are set
      if (freqs.length > 1) {
        for (let i = 1; i < freqs.length; i++) {
          const t = now + (durations[i - 1] || 0.1);
          osc.frequency.exponentialRampToValueAtTime(freqs[i], t);
        }
      }

      if (detune !== 0) {
        osc.detune.setValueAtTime(detune, now);
      }

      // Gain envelope
      gainNode.gain.setValueAtTime(gains[0], now);
      let cumulativeTime = 0;
      for (let i = 1; i < gains.length; i++) {
        cumulativeTime += (durations[i - 1] || 0.1);
        gainNode.gain.exponentialRampToValueAtTime(Math.max(gains[i], 0.0001), now + cumulativeTime);
      }

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      const totalDur = durations.reduce((a, b) => a + b, 0);
      osc.stop(now + totalDur + 0.1);
    } catch (e) {
      console.warn("Sound play failure:", e);
    }
  }

  /**
   * Ultra-fast high-frequency cyber click for button focus/presses
   */
  public playClick() {
    this.playTone([800, 1500], [0.03], "triangle", [0.08, 0.001]);
  }

  /**
   * Shorter high-precision tick for data tables, metrics, typing simulation
   */
  public playTick() {
    this.playTone([2400, 4800], [0.015], "sine", [0.05, 0.001]);
  }

  /**
   * Ascending, rich synthetic triadic arpeggio with high clarity (for successes, saves)
   */
  public playSuccess() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const delay = 0.06;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * delay);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * delay + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * delay);
        osc.stop(now + idx * delay + 0.4);
      });
    } catch (e) {
      console.warn("Sound play failure:", e);
    }
  }

  /**
   * Sci-fi sweeping frequency pitch ramp symbolizing artificial intelligence deep calculation
   */
  public playCalculationSweep() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const mainOsc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const filterNode = ctx.createBiquadFilter();
      const mainGain = ctx.createGain();

      // Main Sweeper
      mainOsc.type = "triangle";
      mainOsc.frequency.setValueAtTime(150, now);
      mainOsc.frequency.exponentialRampToValueAtTime(1600, now + 0.65);
      mainOsc.frequency.exponentialRampToValueAtTime(800, now + 1.1);

      // Low end Sub for raw physical feel
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(80, now);
      subOsc.frequency.linearRampToValueAtTime(220, now + 0.82);

      // Cyber Bandpass filter sweep
      filterNode.type = "bandpass";
      filterNode.Q.setValueAtTime(5.0, now);
      filterNode.frequency.setValueAtTime(300, now);
      filterNode.frequency.exponentialRampToValueAtTime(2800, now + 0.7);
      filterNode.frequency.exponentialRampToValueAtTime(500, now + 1.1);

      mainGain.gain.setValueAtTime(0.0001, now);
      mainGain.gain.linearRampToValueAtTime(0.18, now + 0.25);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

      mainOsc.connect(filterNode);
      subOsc.connect(filterNode);
      filterNode.connect(mainGain);
      mainGain.connect(ctx.destination);

      mainOsc.start(now);
      subOsc.start(now);
      mainOsc.stop(now + 1.3);
      subOsc.stop(now + 1.3);
    } catch (e) {
      console.warn("Calculation sweep sound play failure:", e);
    }
  }

  /**
   * Elegant double-beep synthesized signature when Daphne sends a message or completes audit
   */
  public playAiNotification() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Tone 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Tone 2: 1318.51Hz (E6) with a delay
      const delay = 0.085;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.51, now + delay);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.08, now + delay);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + delay);
      osc2.stop(now + delay + 0.35);

    } catch (e) {
      console.warn("AiNotification sound failure:", e);
    }
  }

  /**
   * Dual-tone telemetry sonar pulse for active UI changes or page loads
   */
  public playActivePulse() {
    this.playTone([660, 440], [0.18], "sine", [0.08, 0.001]);
  }

  /**
   * Dynamic cyber whistle/swell for cash flow entries (ascending for income, descending for expense)
   */
  public playTransactionSwell(type: "income" | "expense") {
    if (type === "income") {
      // Ascending pleasant swell
      this.playTone([350, 950], [0.2], "sine", [0.12, 0.001]);
    } else {
      // Descending warning swell
      this.playTone([700, 200], [0.22], "triangle", [0.08, 0.001]);
    }
  }

  /**
   * Dual-harmonic digital chime warning for critical cash levels or limit alerts
   */
  public playCriticalAlert() {
    if (this.getMuted()) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [330, 495]; // E4, B4 (perfect fifth dissonance warning)

      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth"; // buzzier wave
        osc.frequency.setValueAtTime(freq, now);
        
        // Slight low pass filter to avoid harshness
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(700, now);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch (err) {
      console.warn("Alert sound failure:", err);
    }
  }

  /**
   * High-fidelity Text-To-Speech (TTS) using the best available pt-BR female neural synthesis.
   * Features a refined corporate feminine rate & pitch configuration with automatic markdown parsing.
   */
  public speak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (this.getMuted()) {
      if (onEnd) onEnd();
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Cancel active speech to avoid overlap
      window.speechSynthesis.cancel();

      // Pure text-cleansing pipeline for elegant speech
      const cleaned = text
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/#/g, "")
        .replace(/[-•]\s*/g, " ")
        .replace(/\(R\$\s*([^\)]+)\)/g, "$1 Reais")
        .replace(/R\$\s*([0-9.,]+)/g, "$1 Reais")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = "pt-BR";
      utterance.rate = 1.10; // Unified Jennifer pitch rate
      utterance.pitch = 1.15; // Beautiful and clear feminine tone signature (Jennifer)

      // Locate pt-BR voices
      const voices = window.speechSynthesis.getVoices();
      const ptBrVoices = voices.filter(v => v.lang.replace("_", "-").startsWith("pt"));

      // Prioritize high-fidelity, neural, natural, or Google/Microsoft female voices
      const preferred = ptBrVoices.find(v => 
        v.name.includes("Google") || 
        v.name.includes("Natural") || 
        v.name.toLowerCase().includes("maria") || 
        v.name.toLowerCase().includes("neural") ||
        v.name.toLowerCase().includes("luciana") ||
        v.name.toLowerCase().includes("francisca")
      );
      const fallback = ptBrVoices[0] || null;

      if (preferred) {
        utterance.voice = preferred;
      } else if (fallback) {
        utterance.voice = fallback;
      }

      if (onStart) utterance.onstart = onStart;
      if (onEnd) utterance.onend = onEnd;
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("TTS Speech Synthesis failure:", err);
      if (onEnd) onEnd();
    }
  }

  /**
   * Cancels active speech output immediately
   */
  public stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
}

export const sound = new SoundEngine();
export default sound;
