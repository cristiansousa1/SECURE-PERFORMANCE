import React, { useState, useEffect, useRef } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { sound } from "../utils/SoundEngine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  MessageSquare,
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sliders,
  TrendingUp,
  LineChart,
  Bot,
  Activity,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Minimize2,
  Maximize2,
  RefreshCw,
  Search,
  CheckSquare
} from "lucide-react";
import dafneAvatar from "../assets/images/dafne_avatar_tech_1779278120473.png";

// Interactive Real-Time Canvas Neural Waves Visualizer for CoPilot HUD (Orange Theme)
function NeuralSynapseWave({ 
  state 
}: { 
  state: "listening" | "speaking" | "thinking" | "idle" 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      let numWaves = 3;
      let speed = 0.04;
      let amplitude = 10;
      let frequency = 0.018;
      let strokeStyles = ["rgba(249, 115, 22, 0.65)", "rgba(251, 146, 60, 0.45)", "rgba(253, 186, 116, 0.3)"];

      if (state === "listening") {
        numWaves = 4;
        speed = 0.14;
        amplitude = 18;
        frequency = 0.024;
        strokeStyles = ["rgba(239, 68, 68, 0.8)", "rgba(249, 115, 22, 0.6)", "rgba(168, 85, 247, 0.5)", "rgba(251, 113, 133, 0.35)"];
      } else if (state === "speaking") {
        numWaves = 3;
        speed = 0.09;
        amplitude = 15;
        frequency = 0.02;
        strokeStyles = ["rgba(249, 115, 22, 0.85)", "rgba(251, 146, 60, 0.65)", "rgba(253, 186, 116, 0.4)"];
      } else if (state === "thinking") {
        numWaves = 5;
        speed = 0.18;
        amplitude = 8;
        frequency = 0.045;
        strokeStyles = ["rgba(249, 115, 22, 0.9)", "rgba(59, 130, 246, 0.7)", "rgba(14, 165, 233, 0.5)", "rgba(245, 158, 11, 0.4)"];
      } else {
        // idle
        numWaves = 2;
        speed = 0.015;
        amplitude = 3.5;
        frequency = 0.012;
        strokeStyles = ["rgba(249, 115, 22, 0.35)", "rgba(249, 115, 22, 0.1)"];
      }

      phase += speed;

      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        ctx.lineWidth = i === 0 ? 1.8 : 1.0;
        ctx.strokeStyle = strokeStyles[i] || "rgba(255,255,255,0.15)";

        const offset = i * (Math.PI / numWaves);
        for (let x = 0; x < width; x++) {
          const damping = Math.sin((x / width) * Math.PI);
          const y = (height / 2) + Math.sin(x * frequency + phase + offset) * amplitude * damping;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [state]);

  return <canvas ref={canvasRef} className="w-full h-8 block shrink-0 bg-[#101010]/90 border-b border-orange-500/10" />;
}

// Interface for conversational messages inside the HUD Co-pilot
interface HUDMessage {
  id: string;
  sender: "user" | "dafne";
  text: string;
  timestamp: Date;
  isQuickSuggested?: boolean;
  strategicDiagnosis?: {
    healthScore: number;
    cognitiveAlert: string;
    metricHighlights: Array<{ label: string; value: string; status: "success" | "warning" | "error" }>;
    remedialActionPlan: string[];
  } | null;
}

interface DafneCoPilotHUDProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function DafneCoPilotHUD({ activeTab, setActiveTab }: DafneCoPilotHUDProps) {
  const {
    transactions,
    categories,
    products,
    storeProfiles,
    activeStoreId,
    showToast,
    profile,
    addTransaction
  } = useFinance();

  // Settings & state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [bubbleText, setBubbleText] = useState<string>("");
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<HUDMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [usageStatus, setUsageStatus] = useState<any>(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showHelpConsole, setShowHelpConsole] = useState(false);
  const [jenniferMode, setJenniferMode] = useState<boolean>(() => {
    return localStorage.getItem("jennifer_mode_enabled") === "true";
  });

  const [voicePitch, setVoicePitch] = useState<number>(() => {
    return parseFloat(localStorage.getItem("dafne_voice_pitch") || "1.15");
  });
  const [voiceRate, setVoiceRate] = useState<number>(() => {
    return parseFloat(localStorage.getItem("dafne_voice_rate") || "1.10");
  });
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem("dafne_selected_voice") || "";
  });

  const fetchUsageStatus = async () => {
    try {
      const emailHeader = localStorage.getItem("dafne_user_email") || "";
      const headers: Record<string, string> = {};
      if (emailHeader) {
        headers["x-user-email"] = emailHeader;
      }
      const response = await fetch("/api/ai/usage-status", { headers });
      if (response.ok) {
        const data = await response.json();
        setUsageStatus(data);
      }
    } catch (e) {
      console.warn("Error fetching AI usage status:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsageStatus();
    }
  }, [isOpen]);
  
  // Save Jennifer Mode toggle to localStorage
  useEffect(() => {
    localStorage.setItem("jennifer_mode_enabled", String(jenniferMode));
  }, [jenniferMode]);

  // HUD Voice Synthesis & Speech Recognition state
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("dafne_hud_tts_enabled") === "true";
  });
  const [isListening, setIsListening] = useState(false);
  const [isDirectDictating, setIsDirectDictating] = useState(false);
  const directRecRef = useRef<any>(null);
  const wasWakeWordActiveRef = useRef<boolean>(false);
  const [wakeWordMode, setWakeWordMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("dafne_wakeword_mode");
    return saved === null ? true : saved === "true";
  });
  const wakeWordModeRef = useRef(wakeWordMode);
  const wakeWordRecRef = useRef<any>(null);
  const isSpeechProcessingRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);
  const silenceTimerRef_current = useRef<any>(null); // keeping dynamic tracks
  
  // Web Audio DSP Noise Filter system (Bandpass filter, highpass filter, noise gate)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const [dspActive, setDspActive] = useState<boolean>(false); // DSP Bandpass filter toggle
  const [voiceActivity, setVoiceActivity] = useState<number>(0);
  const [dspIndicator, setDspIndicator] = useState<string>("Inativo");
  const lastActiveSpeechTimeRef = useRef<number>(Date.now());
  const [noiseThreshold, setNoiseThreshold] = useState<number>(8); // adjustable noise gate threshold %
  
  const [speechError, setSpeechError] = useState(false);
  const [hudSpeaking, setHudSpeaking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // High-Tech Voice Reception Technology States
  const [acousticFeedback, setAcousticFeedback] = useState<boolean>(() => {
    const saved = localStorage.getItem("dafne_acoustic_feedback");
    return saved === null ? true : saved === "true";
  });
  const [phoneticCorrection, setPhoneticCorrection] = useState<boolean>(() => {
    const saved = localStorage.getItem("dafne_phonetic_correction");
    return saved === null ? true : saved === "true";
  });

  const playHapticBeep = (type: 'wakeup' | 'success' | 'error') => {
    if (!acousticFeedback) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'wakeup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1200, now + 0.08);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gainNode.gain.setValueAtTime(0.12, now + 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        osc.frequency.setValueAtTime(1046.50, now + 0.18);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gainNode.gain.setValueAtTime(0.15, now + 0.22);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(130, now + 0.12);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gainNode.gain.setValueAtTime(0.08, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn("Could not play haptic receiver feedback:", e);
    }
  };

  // Active store segments
  const activeStore = storeProfiles.find(s => s.id === activeStoreId);
  const currentSegment = activeStore?.businessSegment || "commerce";

  // Derive calculations for custom auditor
  const incomes = transactions.filter(t => t.type === "income");
  const expenses = transactions.filter(t => t.type === "expense");
  const totalSales = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalSales - totalExpenses;

  // Track speech recognition instance
  const recognitionRef = useRef<any>(null);

  // Text to speech synthesizer helper
  const speakText = (text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) {
      setHudSpeaking(false);
      return;
    }
    try {
      window.speechSynthesis.cancel(); // Stop anything playing
      const cleanText = text.replace(/[*#_`~[\]]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "pt-BR";
      
      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;

      // Locate pt-BR voices
      const voices = window.speechSynthesis.getVoices();
      const ptBrVoices = voices.filter(v => 
        v.lang.toLowerCase().includes("pt-br") || 
        v.lang.toLowerCase().startsWith("pt")
      );

      let chosenVoice: SpeechSynthesisVoice | null = null;

      if (ptBrVoices.length > 0) {
        // 1. Explicitly configured voice selected by user
        if (selectedVoice) {
          chosenVoice = ptBrVoices.find(v => v.name === selectedVoice) || null;
        }

        // 2. High-quality natural premium female voice search
        if (!chosenVoice) {
          chosenVoice = ptBrVoices.find(v => {
            const name = v.name.toLowerCase();
            return name.includes("natural") && (
              name.includes("maria") || 
              name.includes("francisca") || 
              name.includes("google") || 
              name.includes("female") || 
              name.includes("mulher") || 
              name.includes("suave")
            );
          }) || null;
        }

        // 3. Known system classic/premium female voices in Portuguese
        if (!chosenVoice) {
          chosenVoice = ptBrVoices.find(v => {
            const name = v.name.toLowerCase();
            return name.includes("maria") || 
                   name.includes("francisca") || 
                   name.includes("heloisa") || 
                   name.includes("heloísa") || 
                   name.includes("luciana") || 
                   name.includes("victoria") || 
                   name.includes("vitoria") || 
                   name.includes("vitória") || 
                   name.includes("fernanda") || 
                   name.includes("priscilla") || 
                   name.includes("helena") || 
                   name.includes("zoraida") || 
                   name.includes("female") || 
                   name.includes("mulher") || 
                   name.includes("suave");
          }) || null;
        }

        // 4. Default high-quality Google voice
        if (!chosenVoice) {
          chosenVoice = ptBrVoices.find(v => {
            const name = v.name.toLowerCase();
            return name.includes("google") && (
              name.includes("português") || 
              name.includes("portuguese") || 
              name.includes("br") || 
              name.includes("brasil")
            );
          }) || null;
        }

        // 5. Fallback of any pt-BR
        if (!chosenVoice) {
          chosenVoice = ptBrVoices.find(v => v.lang.toLowerCase().includes("pt-br")) || null;
        }

        // 6. First pt voice
        if (!chosenVoice) {
          chosenVoice = ptBrVoices[0];
        }
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.onstart = () => {
        setHudSpeaking(true);
      };
      utterance.onend = () => {
        setHudSpeaking(false);
      };
      utterance.onerror = () => {
        setHudSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error", e);
      setHudSpeaking(false);
    }
  };

  // Sync state & save
  useEffect(() => {
    localStorage.setItem("dafne_hud_tts_enabled", String(ttsEnabled));
    if (!ttsEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setHudSpeaking(false);
    }
  }, [ttsEnabled]);

  // Sync wakeWordMode & save
  useEffect(() => {
    wakeWordModeRef.current = wakeWordMode;
    localStorage.setItem("dafne_wakeword_mode", String(wakeWordMode));
  }, [wakeWordMode]);

  // Pure Web Audio API Bandpass + Highpass filters & Voice Activity Detector (VAD) / Noise Gate
  useEffect(() => {
    if (!wakeWordMode || !dspActive) {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
        audioCtxRef.current = null;
      }
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {}
        streamRef.current = null;
      }
      setVoiceActivity(0);
      setDspIndicator("Desativado");
      return;
    }

    let isDestroyed = false;
    let animationId: number;
    let cleanupResumeListeners = () => {};

    const startAudioFiltering = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          setDspIndicator("Filtro Indisponível");
          return;
        }

        // Request clean hardware-processed microphone input
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });

        if (isDestroyed) {
          micStream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = micStream;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const handleResume = () => {
          if (ctx.state === "suspended") {
            ctx.resume().then(() => {
              console.log("AudioContext resumed successfully on user interaction.");
              setDspIndicator("Filtro Bandpass Ativo (200Hz - 3.4kHz)");
            }).catch(e => console.warn("Failed to resume AudioContext:", e));
          }
        };

        window.addEventListener("click", handleResume);
        window.addEventListener("pointerdown", handleResume);
        cleanupResumeListeners = () => {
          window.removeEventListener("click", handleResume);
          window.removeEventListener("pointerdown", handleResume);
        };

        if (ctx.state === "suspended") {
          setDspIndicator("Filtro Suspenso (Toque na Tela)");
        } else {
          setDspIndicator("Filtro Bandpass Ativo (200Hz - 3.4kHz)");
        }

        const source = ctx.createMediaStreamSource(micStream);

        // 1. Highpass filter to eliminate low frequency room rumbles and fan hums below 200Hz
        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = "highpass";
        hpFilter.frequency.value = 200;
        hpFilter.Q.value = 1.0;

        // 2. Lowpass filter to eliminate continuous ambient high frequency static/hiss above 3400Hz
        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = "lowpass";
        lpFilter.frequency.value = 3400;
        lpFilter.Q.value = 1.0;

        // 3. Bandpass presence filter to boost central spoken frequencies at 1500Hz
        const bpFilter = ctx.createBiquadFilter();
        bpFilter.type = "bandpass";
        bpFilter.frequency.value = 1500;
        bpFilter.Q.value = 0.7; // Medium selectivity bandwidth to preserve voices

        // Analyser node for computing raw filtered decibel level vs noise-gate floor
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserNodeRef.current = analyser;

        // Route: Source -> HP -> LP -> BP -> Analyser
        source.connect(hpFilter);
        hpFilter.connect(lpFilter);
        lpFilter.connect(bpFilter);
        bpFilter.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const dspAnalyserLoop = () => {
          if (isDestroyed || !analyserNodeRef.current) return;
          analyserNodeRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avgLevel = sum / bufferLength;

          // Normalize frequency amplitude to percentage 0-100%
          const voiceEnergy = Math.min(100, Math.round((avgLevel / 255) * 100 * 2.5));
          setVoiceActivity(voiceEnergy);

          // If signal strength exceeds our configured Noise Gate threshold, track last active voice detection
          if (voiceEnergy > noiseThreshold) {
            lastActiveSpeechTimeRef.current = Date.now();
          }

          animationId = requestAnimationFrame(dspAnalyserLoop);
        };
        dspAnalyserLoop();

      } catch (err) {
        console.warn("Could not initiate Web Audio voice cleanup:", err);
        setDspIndicator("Acesso Recusado");
      }
    };

    startAudioFiltering();

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationId);
      cleanupResumeListeners();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
        audioCtxRef.current = null;
      }
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {}
        streamRef.current = null;
      }
    };
  }, [wakeWordMode, dspActive, noiseThreshold]);

  // Clean filler/transcription noise and stutter characters before interpretation
  const cleanSpeechCommand = (text: string): string => {
    let clean = text.trim();
    const fillers = [
      /\b(uhm|hmm|humm|hum|eh|ah|oh|er|ahn|eua|tipo|assim|né|ne|entao|então|tipo|sei|la|lá)\b/gi,
      /^(e|a|um|uma|tipo|olha|escuta|ouve|cara|mano|velho|daí|fala|da)\b/gi
    ];
    for (const pat of fillers) {
      clean = clean.replace(pat, "");
    }

    if (phoneticCorrection) {
      // High-Tech Adaptive Phonetic Normalization (Tecnologia de recepção melhorada)
      const phoneticMap: Array<[RegExp, string]> = [
        [/\b(lansa|lanse|lansar|lançaa|lánçar)\b/gi, "lançar"],
        [/\b(despeza|dispesa|dispeza|dispeiza|despeiza)\b/gi, "despesa"],
        [/\b(reçeita|reçita|recita|receitinha)\b/gi, "receita"],
        [/\b(gastei de|paguei de|paguei a)\b/gi, "gastei"],
        [/\b(vendi de|recebi de)\b/gi, "vendi"],
        [/\b(enel|enell|enel de)\b/gi, "conta de energia"],
        [/\b(insta|istagram|instagram de)\b/gi, "anúncio no Instagram"],
        [/\b(feice|face|facebook de|faceboque)\b/gi, "anúncio no Facebook"],
        [/\b(caixa de entrada|caixa de saida)\b/gi, "caixa"],
        [/\b(hamburguer|hamburgue|amborguer)\b/gi, "hambúrguer"],
      ];

      for (const [pattern, replacement] of phoneticMap) {
        clean = clean.replace(pattern, replacement);
      }
    }

    clean = clean.replace(/\s+/g, " ");
    clean = clean.replace(/^[\s,.:;!?-]+/, "");
    clean = clean.trim();
    return clean;
  };

  // Continuous Speech Recognition for Wake-word "Dafne" / "Jennifer"
  const processedTranscriptsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (!wakeWordMode || hudSpeaking || isAiResponding) {
      if (wakeWordRecRef.current) {
        try {
          wakeWordRecRef.current.abort();
        } catch (e) {}
        wakeWordRecRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const startSpeechRecognition = () => {
      if (!wakeWordModeRef.current || hudSpeaking || isAiResponding) return;

      try {
        if (wakeWordRecRef.current) {
          try {
            wakeWordRecRef.current.abort();
          } catch (e) {}
          wakeWordRecRef.current = null;
        }

        const rec = new SpeechRecognition();
        rec.lang = "pt-BR";
        rec.continuous = true;
        rec.interimResults = true;

        rec.onstart = () => {
          setIsListening(true);
          setSpeechError(false);
          console.log("Dafne continuous listening active. Always listening.");
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition continuous error", e);
          if (e.error === "not-allowed" || e.error === "audio-capture" || e.error === "service-not-allowed") {
            setSpeechError(true);
            setWakeWordMode(false);
            showToast("Microfone Bloqueado: Para usar o microfone da assistente, abra o aplicativo em uma 'Nova Aba' (botão no canto superior direito) e permita o acesso!", "error");
          }
        };

        rec.onend = () => {
          setIsListening(false);
          if (wakeWordRecRef.current === rec && wakeWordModeRef.current && !hudSpeaking && !isAiResponding) {
            setTimeout(() => {
              if (wakeWordRecRef.current === rec && wakeWordModeRef.current && !hudSpeaking && !isAiResponding) {
                startSpeechRecognition();
              }
            }, 605);
          }
        };

        const triggerSpeechMessage = (transcriptText: string) => {
          const lowerText = transcriptText.toLowerCase();
          const wakeWords = ["dafne", "daphne", "dafni", "dafine", "daffney", "daffne", "davne", "jennifer"];
          const hasWakeWord = wakeWords.some(w => lowerText.includes(w));

          if (hasWakeWord) {
            let commandText = "";
            for (const w of wakeWords) {
              const idx = lowerText.indexOf(w);
              if (idx !== -1) {
                commandText = transcriptText.substring(idx + w.length).trim();
                commandText = commandText.replace(/^[\s,.:;!?-]+/, "");
                break;
              }
            }

            // High-Tech DSP Noise Gate Check:
            // Ensure we heard genuine audio energy spikes above the noise floor in the last 8.0 seconds
            // to shield against continuous room noises, tapping typing clicks, or street static.
            // Bypassed if the AudioContext is not initialized or is suspended by safe browser policies.
            const isDspRunning = dspActive && audioCtxRef.current && audioCtxRef.current.state === "running";
            const timeSinceVocalActivity = Date.now() - lastActiveSpeechTimeRef.current;
            if (isDspRunning && timeSinceVocalActivity > 8000) {
              console.log(`Dafne DSP Noise-Gate: Blocked low energy ambient murmur (diff: ${timeSinceVocalActivity}ms)`);
              return;
            }

            // Apply textual signal cleaner for crystal-clear processing (removing filler markers)
            const preCleaned = cleanSpeechCommand(commandText);

            // Exclude triggers if command is too short (e.g. they just yelled "Dafne" or "Dafne?")
            // Open the HUD and prompt them to speak.
            if (preCleaned.length <= 1) {
              const key = `wake-only-${Math.floor(Date.now() / 4000)}`;
              if (processedTranscriptsRef.current.has(key)) return;
              processedTranscriptsRef.current.add(key);

              setIsOpen(true);
              playHapticBeep('wakeup');
              speakText("Estou aqui! O que você gostaria de registrar ou analisar hoje?");
              showToast("Dafne Co-Piloto: Estou te ouvindo!", "success");
              return;
            }

            const key = `${preCleaned.toLowerCase()}-${Math.floor(Date.now() / 4000)}`;
            if (processedTranscriptsRef.current.has(key)) {
              return;
            }
            processedTranscriptsRef.current.add(key);

            if (processedTranscriptsRef.current.size > 50) {
              processedTranscriptsRef.current.clear();
            }

            playHapticBeep('wakeup');
            showToast(`Comando: "${preCleaned}"`, "success");
            setIsOpen(true);

            setTimeout(() => {
              handleSendMessage(preCleaned);
            }, 300);
          }
        };

        rec.onresult = (event: any) => {
          if (hudSpeaking || window.speechSynthesis.speaking) {
            return;
          }

          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptSegment = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptSegment;
            } else {
              interimTranscript += transcriptSegment;
            }
          }

          const transcript = (finalTranscript || interimTranscript).trim();
          if (!transcript) return;

          // Mark active user speech because we have a valid transcribed phoneme fragment!
          lastActiveSpeechTimeRef.current = Date.now();

          // Clear existing silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Trigger on silence pause (1.2 seconds of no speech update)
          silenceTimerRef.current = setTimeout(() => {
            triggerSpeechMessage(transcript);
          }, 1200);

          // Trigger immediately on final phrase if it's long enough
          const isFinalPhrase = event.results[event.results.length - 1].isFinal;
          if (isFinalPhrase) {
            clearTimeout(silenceTimerRef.current);
            triggerSpeechMessage(transcript);
          }
        };

        wakeWordRecRef.current = rec;
        rec.start();
      } catch (err) {
        console.error("Error starting continuous speech recognition:", err);
      }
    };

    startSpeechRecognition();

    return () => {
      if (wakeWordRecRef.current) {
        try {
          wakeWordRecRef.current.abort();
        } catch (e) {}
        wakeWordRecRef.current = null;
      }
      if (directRecRef.current) {
        try {
          directRecRef.current.abort();
        } catch (e) {}
        directRecRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [wakeWordMode, hudSpeaking, isAiResponding]);

  // Initial welcome on component load
  useEffect(() => {
    setMessages([
      {
        id: "init-dafne",
        sender: "dafne",
        text: "Olá! Sou a Dafne, sua HUD Co-Piloto Inteligente e Assistente de faturamento corporativo. Estou sintonizada no que você faz em cada tela para guiar seus lucros em tempo real!\n\nMe faça perguntas estratégicas para melhorar seus resultados, ou use os recursos integrados de lançamento de transações por voz ou por digitação instantânea – por exemplo:\n\n• *'Lança uma venda de 3 hambúrgueres por 120 reais'*\n• *'Paguei a conta da Enel de R$ 95'*\n• *'Gastei 150 em anúncio no Instagram'*\n\nEu cuidarei de todo o mapeamento e lançamento no sistema para você de forma imediata contábil!",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Client-side simple fallback NLP parsing
  const parseClientTransactionFallback = (msg: string) => {
    const lower = msg.toLowerCase();
    
    // Prevent transactional parsing if the user is asking an analytical, conversational, or educational question
    const analyticalKeywords = [
      "analise", "análise", "analisar",
      "audita", "auditar", "auditoria",
      "relatorio", "relatório",
      "sugestao", "sugestão", "sugestões", "sugestoes",
      "dica", "dicas",
      "como", "por que", "porque", "qual", "quais", "quanto", "quantos",
      "explicar", "explica", "entender", "compreender",
      "ajuda", "ajudar", "ajude",
      "revisar", "revisao", "revisão",
      "diagnostico", "diagnóstico",
      "consultoria", "conselho", "conselhos",
      "planejamento", "plano", "planos",
      "meta", "metas",
      "comparar", "comparacao", "comparação", "comparacoes", "comparações",
      "pergunta", "perguntas", "duvida", "dúvida", "duvidas", "dúvidas"
    ];
    if (analyticalKeywords.some(kw => lower.includes(kw))) {
      return null;
    }
    
    // Help extract amount
    const extractPortugueseMoney = (text: string): number | null => {
      const clean = (text || "").toLowerCase();
      const regex = /(?:r\$|rs|\$)?\s*([0-9]+[0-9.,]*)/gi;
      let match;
      let candidates: number[] = [];
      
      while ((match = regex.exec(clean)) !== null) {
        let rawNum = match[1];
        while (rawNum && /[.,]/.test(rawNum[rawNum.length - 1])) {
          rawNum = rawNum.slice(0, -1);
        }
        if (!rawNum) continue;
        
        if (rawNum.includes(".") && rawNum.includes(",")) {
          const dotIdx = rawNum.lastIndexOf(".");
          const commaIdx = rawNum.lastIndexOf(",");
          if (commaIdx > dotIdx) {
            const normalized = rawNum.replace(/\./g, "").replace(",", ".");
            const val = parseFloat(normalized);
            if (!isNaN(val)) candidates.push(val);
          } else {
            const normalized = rawNum.replace(/,/g, "");
            const val = parseFloat(normalized);
            if (!isNaN(val)) candidates.push(val);
          }
        } else if (rawNum.includes(",")) {
          const parts = rawNum.split(",");
          if (parts.length === 2 && parts[1].length === 2) {
            const normalized = rawNum.replace(",", ".");
            const val = parseFloat(normalized);
            if (!isNaN(val)) candidates.push(val);
          } else if (parts.length === 2 && parts[1].length === 3) {
            const normalized = rawNum.replace(",", "");
            const val = parseFloat(normalized);
            if (!isNaN(val)) candidates.push(val);
          } else {
            const normalized = rawNum.replace(",", ".");
            const val = parseFloat(normalized);
            if (!isNaN(val)) candidates.push(val);
          }
        } else if (rawNum.includes(".")) {
          const parts = rawNum.split(".");
          if (parts.length === 2 && parts[1].length === 3) {
            const normalized = rawNum.replace(/\./g, "");
            const val = parseFloat(normalized);
            if (!isNaN(val)) candidates.push(val);
          } else {
            const val = parseFloat(rawNum);
            if (!isNaN(val)) candidates.push(val);
          }
        } else {
          const val = parseFloat(rawNum);
          if (!isNaN(val)) candidates.push(val);
        }
      }
      
      return candidates.length > 0 ? candidates[0] : null;
    };

    const val = extractPortugueseMoney(lower);
    if (!val || val <= 0) return null;

    const isExpense = lower.includes("paguei") || lower.includes("pagou") || lower.includes("pago") || 
                      lower.includes("pagar") || lower.includes("pagamento") || lower.includes("pagamentos") ||
                      lower.includes("gastei") || lower.includes("gastou") || lower.includes("gasto") || lower.includes("gastos") ||
                      lower.includes("custo") || lower.includes("custos") || 
                      lower.includes("despesa") || lower.includes("despesas") ||
                      lower.includes("compra") || lower.includes("compras") || lower.includes("comprei") || lower.includes("comprou") ||
                      lower.includes("perdi") || lower.includes("perda") || lower.includes("perdas") ||
                      lower.includes("insumo") || lower.includes("insumos") ||
                      lower.includes("fatura") || lower.includes("faturas") ||
                      lower.includes("frete") || lower.includes("fretes") || lower.includes("entrega") || lower.includes("entregas") ||
                      lower.includes("saída") || lower.includes("saida") || lower.includes("saídas") || lower.includes("saidas") ||
                      lower.includes("mensalidade") || lower.includes("mensalidades") ||
                      lower.includes("taxa") || lower.includes("taxas") || lower.includes("tarifa") || lower.includes("tarifas") ||
                      lower.includes("imposto") || lower.includes("impostos") || lower.includes("simples nacional") || lower.includes("das") ||
                      lower.includes("aluguel") || lower.includes("luz") || lower.includes("água") || lower.includes("agua") || 
                      lower.includes("energia") || lower.includes("internet") || lower.includes("telefone") ||
                      lower.includes("salário") || lower.includes("salario") || lower.includes("salários") || lower.includes("salarios") ||
                      lower.includes("pró-labore") || lower.includes("pro-labore") || lower.includes("pro labore") ||
                      lower.includes("anúncio") || lower.includes("anuncio") || lower.includes("anúncios") || lower.includes("anuncios") || 
                      lower.includes("marketing") || lower.includes("ads") || lower.includes("facebook") || lower.includes("instagram") ||
                      lower.includes("software") || lower.includes("sistema") || lower.includes("api") || lower.includes("tokens");

    const isRevenue = lower.includes("venda") || lower.includes("vendeu") || lower.includes("vendas") || lower.includes("vendi") || 
                      lower.includes("recebi") || lower.includes("recebeu") || lower.includes("recebimento") || lower.includes("recebimentos") ||
                      lower.includes("faturei") || lower.includes("faturou") || lower.includes("faturamento") ||
                      lower.includes("ganhei") || lower.includes("ganhou") || 
                      lower.includes("receita") || lower.includes("receitas") ||
                      lower.includes("entrada") || lower.includes("entradas");

    if (isRevenue) {
      let categoryName = "Venda de Produtos";
      if (lower.includes("serviço") || lower.includes("servico") || lower.includes("serviços") || lower.includes("servicos") || lower.includes("consultoria")) {
        categoryName = "Prestação de Serviços";
      }
      return {
        description: "Venda registrada automaticamente (Modo Local)",
        amount: val,
        type: "income" as "income" | "expense",
        categoryName
      };
    } else if (isExpense) {
      let categoryName = "Compra de Mercadoria";
      if (lower.includes("insumo") || lower.includes("insumos") || lower.includes("matéria prima") || lower.includes("materia prima")) {
        categoryName = "Compra de Mercadoria";
      } else if (lower.includes("luz") || lower.includes("energia") || lower.includes("água") || lower.includes("agua") || lower.includes("utilidade") || lower.includes("internet") || lower.includes("telefone")) {
        categoryName = "Energia / Água / Utilidades";
      } else if (lower.includes("anúncio") || lower.includes("anuncio") || lower.includes("anúncios") || lower.includes("anuncios") || lower.includes("marketing") || lower.includes("insta") || lower.includes("facebook") || lower.includes("ads")) {
        categoryName = "Marketing / Tráfego Pago";
      } else if (lower.includes("aluguel") || lower.includes("escritório") || lower.includes("galpão") || lower.includes("galpao")) {
        categoryName = "Aluguel Escritório / Galpão";
      } else if (lower.includes("frete") || lower.includes("entrega") || lower.includes("entregas") || lower.includes("logística") || lower.includes("logistica")) {
        categoryName = "Fretes";
      } else if (lower.includes("das") || lower.includes("simples") || lower.includes("imposto") || lower.includes("impostos")) {
        categoryName = "DAS / Simples Nacional";
      } else if (lower.includes("salário") || lower.includes("salario") || lower.includes("salários") || lower.includes("salarios") || lower.includes("pró-labore") || lower.includes("pro-labore") || lower.includes("pro labore")) {
        categoryName = "Salários e Encargos";
      } else if (lower.includes("nuvem") || lower.includes("cloud") || lower.includes("aws") || lower.includes("hosting") || lower.includes("servidor") || lower.includes("servidores") || lower.includes("heroku") || lower.includes("cloud run") || lower.includes("infraestrutura")) {
        categoryName = "Infraestrutura de Nuvem / Servidores";
      } else if (lower.includes("software") || lower.includes("sistema") || lower.includes("saas") || lower.includes("mensalidade") || lower.includes("assinatura") || lower.includes("hospedagem")) {
        categoryName = "Software / Assinaturas SaaS";
      } else if (lower.includes("tarifa") || lower.includes("tarifas") || lower.includes("taxa") || lower.includes("taxas") || lower.includes("banco") || lower.includes("bancária") || lower.includes("bancaria") || lower.includes("gateway")) {
        categoryName = "Tarifas Bancárias e Gateway";
      } else if (lower.includes("api") || lower.includes("openai") || lower.includes("gemini") || lower.includes("tokens") || lower.includes("inteligência") || lower.includes("inteligencia") || lower.includes("ia") || lower.includes("i.a.")) {
        categoryName = "Modelos e APIs de I.A. (OpenAI, Gemini)";
      }
      return {
        description: "Despesa registrada automaticamente (Modo Local)",
        amount: val,
        type: "expense" as "income" | "expense",
        categoryName
      };
    }
    return null;
  };

  // Helper for string normalization (removes accents/diacritics, lowercase)
  const normalizeStr = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Helper to find a registered product that matches the message text
  const findMatchingProduct = (msg: string) => {
    if (!products || products.length === 0) return null;
    const normMsg = normalizeStr(msg);

    // Sort products by length of name descending so we match more specific names first
    const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);

    // 1. Direct or partial full-name containment match
    for (const prod of sortedProducts) {
      const normName = normalizeStr(prod.name);
      const simplifiedName = normName.replace(/^(?:aplicativo|app)\s+(?:de\s+|da\s+|do\s+)?/i, "").trim();

      if (normMsg.includes(normName)) {
        return prod;
      }
      if (simplifiedName.length > 2 && normMsg.includes(simplifiedName)) {
        return prod;
      }
    }

    // 2. Word-based overlap match for keywords (length > 3 and not "aplicativo"/"app")
    for (const prod of sortedProducts) {
      const normName = normalizeStr(prod.name);
      const prodWords = normName.split(/\s+/).filter(w => w.length > 3 && w !== "aplicativo" && w !== "app");
      
      if (prodWords.length > 0) {
        const allWordsMatched = prodWords.every(word => normMsg.includes(word));
        if (allWordsMatched) {
          return prod;
        }
      }
    }

    // 3. Conversational/spoken name fallbacks for listed products
    if (normMsg.includes("aplicativo") || normMsg.includes("app") || normMsg.includes("licenca")) {
      const appProd = sortedProducts.find(p => p.id === "p4" || normalizeStr(p.name).includes("aplicativo") || normalizeStr(p.name).includes("app"));
      if (appProd) return appProd;
    }
    if (normMsg.includes("hamburguer") || normMsg.includes("burguer") || normMsg.includes("lanche")) {
      const burguerProd = sortedProducts.find(p => p.id === "p1" || normalizeStr(p.name).includes("hamburguer"));
      if (burguerProd) return burguerProd;
    }
    if (normMsg.includes("pizza") || normMsg.includes("rucula")) {
      const pizzaProd = sortedProducts.find(p => p.id === "p2" || normalizeStr(p.name).includes("pizza"));
      if (pizzaProd) return pizzaProd;
    }
    if (normMsg.includes("batata") || normMsg.includes("canoa") || normMsg.includes("frita")) {
      const batataProd = sortedProducts.find(p => p.id === "p3" || normalizeStr(p.name).includes("batata"));
      if (batataProd) return batataProd;
    }

    // 4. Fallback: return null if no product matches name
    return null;
  };

  // Helper to extract the quantity from the message
  const extractQuantity = (msg: string) => {
    let processedMsg = msg.toLowerCase();
    
    // Map Portuguese text number words to digits to sustain fully organic speech
    const numberWordsMap: Record<string, string> = {
      "uma": "1", "um": "1",
      "duas": "2", "dois": "2",
      "tres": "3",
      "quatro": "4",
      "cinco": "5",
      "seis": "6", "meia": "6",
      "sete": "7",
      "oito": "8",
      "nove": "9",
      "dez": "10"
    };
    for (const [word, val] of Object.entries(numberWordsMap)) {
      processedMsg = processedMsg.replace(new RegExp(`\\b${word}\\b`, "g"), val);
    }

    const normMsg = normalizeStr(processedMsg);
    
    const patterns = [
      /(\d+)\s*(?:vendas?|unidades?|itens|un\b|pcs?|pecas?|x\b|copias?|licencas?|aplicativos?)/i,
      /(?:vendi|venda\s+(?:de|da|do)?|vendas\s+(?:de|da|do)?|pago|lance|lancar|fiz|registrei)\s*(\d+)/i,
      /\b(\d+)\b/
    ];

    for (const pattern of patterns) {
      const match = processedMsg.match(pattern);
      if (match && match[1]) {
        const qty = parseInt(match[1]);
        if (!isNaN(qty) && qty > 0) {
          return qty;
        }
      }
    }
    
    return 1;
  };

  // Intercept and process product sale voice commands
  const processProductVoiceCommand = async (msg: string): Promise<boolean> => {
    const lower = msg.toLowerCase();
    
    // Prevent transactional parsing if the user is asking an analytical, conversational, or educational question
    const analyticalKeywords = [
      "analise", "análise", "analisar",
      "audita", "auditar", "auditoria",
      "relatorio", "relatório",
      "sugestao", "sugestão", "sugestões", "sugestoes",
      "dica", "dicas",
      "como", "por que", "porque", "qual", "quais", "quanto", "quantos",
      "explicar", "explica", "entender", "compreender",
      "ajuda", "ajudar", "ajude",
      "revisar", "revisao", "revisão",
      "diagnostico", "diagnóstico",
      "consultoria", "conselho", "conselhos",
      "planejamento", "plano", "planos",
      "meta", "metas",
      "comparar", "comparacao", "comparação", "comparacoes", "comparações",
      "pergunta", "perguntas", "duvida", "dúvida", "duvidas", "dúvidas"
    ];
    if (analyticalKeywords.some(kw => lower.includes(kw))) {
      return false;
    }
    
    // Check if the command has indicators of a sale
    const triggers = ["venda", "vendi", "vendeu", "lança", "lancar", "fiz", "registra", "registrar", "vendas"];
    const hasTrigger = triggers.some(t => lower.includes(t));
    if (!hasTrigger) return false;

    const matchedProduct = findMatchingProduct(msg);
    if (!matchedProduct) return false;

    const quantity = extractQuantity(msg);

    // Locate the appropriate 'income' (revenue) category for a product sale
    let categoryId = "";
    const incomeCategories = categories.filter(c => c.type === "income");
    const vendaCat = incomeCategories.find(c => c.name.toLowerCase().includes("venda") && c.name.toLowerCase().includes("produto"))
                  || incomeCategories.find(c => c.name.toLowerCase().includes("venda"))
                  || incomeCategories[0];
    
    if (vendaCat) {
      categoryId = vendaCat.id;
    } else {
      categoryId = categories[0]?.id || "";
    }

    try {
      const totalAmount = matchedProduct.sellingPrice * quantity;
      const description = `Venda: ${matchedProduct.name} (x${quantity})`;

      await addTransaction({
        date: new Date(),
        description,
        amount: totalAmount,
        type: "income",
        categoryId,
        profileId: activeStoreId || undefined,
        isProductSale: true,
        productId: matchedProduct.id,
        quantity,
        productCostPrice: matchedProduct.costPrice
      });

      // Show beautiful visual confirmation in the chat
      const responseText = `🎈 **Lançamento Automatizado por Voz Resolvido!**\n\nLancei com sucesso **${quantity}** ${quantity === 1 ? 'venda' : 'vendas'} do produto **${matchedProduct.name}** no sistema (através de comando de voz/texto).\n\n*   **Produto:** ${matchedProduct.name}\n*   **Quantidade:** ${quantity} un\n*   **Preço Unitário:** R$ ${matchedProduct.sellingPrice.toFixed(2)}\n*   **Total Consolidado:** **R$ ${totalAmount.toFixed(2)}**\n*   **Custo de Venda (CMV):** R$ ${(matchedProduct.costPrice * quantity).toFixed(2)}\n*   **Margem Real Obtida:** ${((1 - (matchedProduct.costPrice / matchedProduct.sellingPrice)) * 100).toFixed(1)}%\n\nO faturamento e CMV foram consolidados em tempo real no seu DRE operacional!`;
      
      addNewDafneMessage(responseText);

      // Speak confirmation
      const speakPhrase = quantity === 1
        ? `Lançamento de voz bem sucedido. Registrei uma venda de ${matchedProduct.name} no valor de ${matchedProduct.sellingPrice.toFixed(0)} reais para você!`
        : `Lançamento de voz bem sucedido. Registrei ${quantity} vendas de ${matchedProduct.name}, somando um total de ${totalAmount.toFixed(0)} reais no seu controle financeiro!`;
      
      speakText(speakPhrase);
      showToast(`Lançamento automático de ${quantity}x "${matchedProduct.name}" cadastrado!`, "success");
      return true;
    } catch (err) {
      console.error("Error processing voice product command:", err);
      showToast("Não foi possível persistir as vendas automáticas no sistema.", "error");
      return false;
    }
  };

  // Perform transaction logging inside context database
  const handleAutomaticTransactionLogging = async (detected: any) => {
    if (!detected || !detected.amount || !detected.type || !detected.categoryName) return;
    
    try {
      const type = detected.type === "income" ? "income" : "expense";
      const incomingName = detected.categoryName.toLowerCase().trim();
      
      const possibleCategories = categories.filter(c => c.type === type);
      let match = possibleCategories.find(c => c.name.toLowerCase() === incomingName);
      
      if (!match) {
        const isMateriaPrimaOrCompra = incomingName.includes("materia") || incomingName.includes("matéria") || 
                                       incomingName.includes("compra") || incomingName.includes("mercadoria") || 
                                       incomingName.includes("insumo") || incomingName.includes("estoque");
        const isSales = incomingName.includes("venda") || incomingName.includes("vendas") || incomingName.includes("receita");
        const isService = incomingName.includes("serviço") || incomingName.includes("servico");
        const isMarketing = incomingName.includes("marketing") || incomingName.includes("trafego") || incomingName.includes("tráfego") || incomingName.includes("anúncio") || incomingName.includes("anuncio") || incomingName.includes("ads") || incomingName.includes("insta") || incomingName.includes("facebook");
        const isSoftware = incomingName.includes("software") || incomingName.includes("saas") || incomingName.includes("assinatura") || incomingName.includes("sistema");
        const isTax = incomingName.includes("das") || incomingName.includes("simples nacional") || incomingName.includes("imposto") || incomingName.includes("tributo");
        const isRent = incomingName.includes("aluguel") || incomingName.includes("escritório") || incomingName.includes("galpão") || incomingName.includes("galpao");
        const isSalary = incomingName.includes("salário") || incomingName.includes("salario") || incomingName.includes("encargo") || incomingName.includes("folha") || incomingName.includes("pessoal") || incomingName.includes("pró-labore") || incomingName.includes("pro-labore") || incomingName.includes("pro labore");
        const isUtility = incomingName.includes("luz") || incomingName.includes("água") || incomingName.includes("agua") || incomingName.includes("energia") || incomingName.includes("utilidade") || incomingName.includes("internet") || incomingName.includes("telefone");
        const isBank = incomingName.includes("tarifa") || incomingName.includes("taxa") || incomingName.includes("bancária") || incomingName.includes("bancaria") || incomingName.includes("banco");
        const isFreight = incomingName.includes("frete") || incomingName.includes("logística") || incomingName.includes("logistica") || incomingName.includes("entrega");
        const isIA = incomingName.includes("openai") || incomingName.includes("gemini") || incomingName.includes("tokens") || incomingName.includes("api") || incomingName.includes("inteligência") || incomingName.includes("inteligencia") || incomingName.includes("ia") || incomingName.includes("i.a.");

        if (isMateriaPrimaOrCompra) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("compra") || n.includes("mercadoria") || n.includes("materia") || n.includes("matéria") || n.includes("insumo");
          });
        }
        if (!match && isSales) {
          match = possibleCategories.find(c => c.name.toLowerCase().includes("venda"));
        }
        if (!match && isService) {
          match = possibleCategories.find(c => c.name.toLowerCase().includes("serviço") || c.name.toLowerCase().includes("servico"));
        }
        if (!match && isMarketing) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("marketing") || n.includes("anúncio") || n.includes("anuncio") || n.includes("tráfego") || n.includes("trafego") || n.includes("ads");
          });
        }
        if (!match && isSoftware) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("software") || n.includes("saas") || n.includes("assinatura") || n.includes("sistema");
          });
        }
        if (!match && isTax) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("das") || n.includes("simples") || n.includes("imposto") || n.includes("tributo");
          });
        }
        if (!match && isRent) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("aluguel") || n.includes("escritório") || n.includes("galpão") || n.includes("galpao");
          });
        }
        if (!match && isSalary) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("salário") || n.includes("salario") || n.includes("folha") || n.includes("pessoal") || n.includes("pró-labore") || n.includes("pro-labore") || n.includes("pro labore");
          });
        }
        if (!match && isUtility) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("energia") || n.includes("utilidade") || n.includes("luz") || n.includes("água") || n.includes("agua");
          });
        }
        if (!match && isBank) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("tarifa") || n.includes("taxa") || n.includes("banca") || n.includes("banco");
          });
        }
        if (!match && isFreight) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("frete") || n.includes("logística") || n.includes("logistica") || n.includes("entrega");
          });
        }
        if (!match && isIA) {
          match = possibleCategories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes("openai") || n.includes("gemini") || n.includes("api") || n.includes("ia") || n.includes("i.a.");
          });
        }
      }

      if (!match) {
        match = possibleCategories.find(c => c.name.toLowerCase().includes(incomingName));
      }
      if (!match) {
        match = possibleCategories.find(c => incomingName.includes(c.name.toLowerCase()));
      }
      
      let categoryId = "";
      if (match) {
        categoryId = match.id;
      } else {
        const fallbackCat = possibleCategories[0];
        categoryId = fallbackCat ? fallbackCat.id : (categories[0]?.id || "");
      }
      
      await addTransaction({
        date: new Date(),
        description: detected.description || (type === "income" ? "Venda Registrada" : "Pagamento Registrado"),
        amount: Number(detected.amount),
        type,
        categoryId,
        profileId: activeStoreId || undefined,
        isProductSale: detected.isProductSale || undefined,
        productId: detected.productId || undefined,
        quantity: detected.quantity !== undefined ? Number(detected.quantity) : undefined,
        productCostPrice: detected.productCostPrice !== undefined ? Number(detected.productCostPrice) : undefined
      });
      
      showToast(`Jennifer AI: Lançamento de "${detected.description}" adicionado com sucesso!`, "success");
    } catch (err) {
      console.error("Failed to add transaction automatically:", err);
      showToast("Falta de permissão ou erro ao persistir lançamento automático.", "error");
    }
  };

  const handleTestSpeech = () => {
    const phrase = jenniferMode 
      ? "Sinal operacional calibrado. Sou a Jennifer AI, sua copiloto financeira ativa."
      : "Calibração de tônica concluída. Olá, sou a Dafne, sua mentora estratégica de negócios sintonizada.";
    speakText(phrase);
  };

  // Scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiResponding]);

  // DYNAMIC WORKSPACE SENSING (Innovative Feature: AI detects tab change and triggers micro advice)
  useEffect(() => {
    let advice = "";
    switch (activeTab) {
      case "dashboard":
        advice = "💡 Dafne: Sintonizei no Painel Gerencial. Estamos com R$ " + currentBalance.toLocaleString("pt-BR") + " em saldo operacional consolidado de caixa.";
        break;
      case "transactions":
        advice = "📋 Dafne: Carregando lançamentos de caixa. Digite '/auditoria' para eu varrer riscos fiscais e operacionais!";
        break;
      case "cashflow":
        advice = "📉 Dafne: Estamos visualizando as projeções de Fluxo de Caixa. Dica: observe os dias de vencimento concentrados e evite gargalos.";
        break;
      case "segment-metrics":
        advice = "📊 Dafne: Métricas de Nichos ativas! Use os sliders para simular como uma mudança sutil no markup explode sua lucratividade.";
        break;
      case "pricing":
        advice = "🧮 Dafne: Calculadoras de preços abertas. Lembre-se: preço muito baixo destrói o caixa, e preço sem valor destrói a captação.";
        break;
      case "strategies":
        advice = "🎯 Dafne: Peça Orçamentária de Gestão & Reservas. Planeje tetos de gastos, controle despesas e simule sobras de fluxo de caixa!";
        break;
      case "payable":
        advice = "📑 Dafne: Contas a Pagar e Monitor de boletos. Vamos conferir as datas críticas para evitar juros operacionais PJ.";
        break;
      case "referral":
        advice = "🤝 Dafne: Programa de Indicações e Alianças PJ. Indique amigos, garanta faturamento isento e impulsione nosso reinvestimento em IA!";
        break;
      default:
        advice = "✨ Dafne: HUD Co-Piloto ativa. Sintonizando parâmetros operacionais corporativos.";
    }

    setBubbleText(advice);
    setShowBubble(true);

    // Auto fade bubble after 8 seconds
    const timer = setTimeout(() => {
      setShowBubble(false);
    }, 8500);

    return () => clearTimeout(timer);
  }, [activeTab]);

  // Dynamic suggestion pills based on activeTab
  const getContextualPills = () => {
    switch (activeTab) {
      case "segment-metrics":
        return [
          { label: "🎯 Simulação Ideal", action: "Como atingir o markup ideal no meu segmento?" },
          { label: "🆚 Benchmark Setor", action: "Quais os benchmarks de margem para " + currentSegment + "?" },
          { label: "🔮 Analisar Lucro", action: "Como o giro de estoque afeta o faturamento?" }
        ];
      case "dashboard":
      case "transactions":
        return [
          { label: "🔮 Auditoria Rápida", action: "/auditoria" },
          { label: "📈 Margem de Contribuição", action: "Qual a diferença entre margem e lucro?" },
          { label: "🏥 Saúde de Caixa", action: "Qual o diagnóstico rápido do meu saldo?" }
        ];
      case "pricing":
        return [
          { label: "🏷️ Markup vs Margem", action: "Como calcular markup multiplicador?" },
          { label: "📊 Precificar Serviço", action: "Como precificar serviços por valor por hora?" },
          { label: "📉 CMV Alto", action: "O que fazer se o CMV for maior que 40%?" }
        ];
      case "cashflow":
        return [
          { label: "⚠️ Ponto de Equilíbrio", action: "Qual o meu break-even ou ponto de equilíbrio mensal?" },
          { label: "📅 Previsibilidade", action: "Como projetar receitas recorrentes no fluxo?" }
        ];
      case "financial-engineering":
        return [
          { label: "⚙️ Capital de Giro", action: "Como reduzir a minha Necessidade de Capital de Giro (NCG)?" },
          { label: "⏳ Prazo DPO e DSO", action: "Qual o impacto de estender prazos com fornecedores (DPO)?" },
          { label: "⚖️ Análise Dupont", action: "Como melhorar o ROE do meu negócio usando o Giro de Ativos?" }
        ];
      case "payable":
        return [
          { label: "💸 Gestão de Passivos", action: "Como me organizar para pagar minhas contas sem asfixiar o caixa de curto prazo?" },
          { label: "🔍 Alerta de Juros", action: "Qual o impacto de atrasar guias fiscais e duplicatas de fornecedores?" }
        ];
      case "tax-planning":
        return [
          { label: "⚖️ Planejamento Tributário", action: "Simples Nacional vs Lucro Presumido, qual escolher?" },
          { label: "🩺 Fator R", action: "Como o Fator R ajuda a economizar impostos no Simples Nacional?" }
        ];
      default:
        return [
          { label: "💡 Dica de hoje", action: "Dê uma dica estratégica rápida para meu negócio" },
          { label: "🔮 Diagnóstico Geral", action: "/auditoria" },
          { label: "🛠️ Comandos de Voz", action: "Como usar comandos de voz para navegar?" }
        ];
    }
  };

  // VOCAL COMMAND / KEYBOARD COMMAND COMMAND ROUTER
  // (Innovative Feature: Auto-recognition of navigation keywords or system functions)
  const processCommandRouting = (lowerText: string): boolean => {
    // Elegant check: if the user input contains numeric values or mentions of prices, or direct language
    // indicating registration of sales, expenses, costs, paguei, vendi, gastei, etc, do NOT routing-navigate because
    // this is a transaction recording instruction!
    const hasNumbersOrMoney = /[0-9]/.test(lowerText) || lowerText.includes("reais") || lowerText.includes("real") || lowerText.includes("r$");
    const hasLogIntent = lowerText.includes("registra") || lowerText.includes("lança") || lowerText.includes("anota") || lowerText.includes("adiciona") || 
                         lowerText.includes("gastei") || lowerText.includes("custo") || lowerText.includes("despesa") || lowerText.includes("paguei") || 
                         lowerText.includes("vendi") || lowerText.includes("recebi") || lowerText.includes("comprei") || lowerText.includes("gasto") || 
                         lowerText.includes("venda");

    if (hasNumbersOrMoney || hasLogIntent) {
      console.log("HUD command router bypassed: Detected numeric figures or transaction verbs in text command.");
      return false;
    }

    // 1. Audit route
    if (lowerText.trim() === "/auditoria" || lowerText.includes("executar auditoria") || lowerText.includes("fazer auditoria") || lowerText.includes("auditar agora")) {
      executeBoxAuditor();
      return true;
    }

    // 2. Exact match check for very common navigation nouns to navigate strictly on explicit commands
    const trimmedInput = lowerText.trim();
    const exactMatches = [
      { key: "dashboard", tab: "dashboard" },
      { key: "painel", tab: "dashboard" },
      { key: "configurações", tab: "settings" },
      { key: "configuracoes", tab: "settings" },
      { key: "ajustes", tab: "settings" }
    ];
    for (const e of exactMatches) {
      if (trimmedInput === e.key) {
        setActiveTab(e.tab);
        const feedbackMsg = `Perfeito! Comando interpretado. Direcionei sua tela para "${getTabLabel(e.tab)}".`;
        addNewDafneMessage(feedbackMsg);
        speakText(feedbackMsg);
        showToast(`Navegando: ${getTabLabel(e.tab)}`, "success");
        return true;
      }
    }

    // 3. Robust Navigation mappings with specific prefix requirements to prevent greedy single-word false matches
    const navMappings = [
      { keys: ["ir para nicho", "metricas de nicho", "métricas de nicho", "ver nicho", "ir para segmento", "ver benchmarks", "tela de nicho", "tela de segmento"], tab: "segment-metrics" },
      { keys: ["ir para painel", "ir para o painel", "abrir painel", "ver painel", "ir para o dashboard", "abrir dashboard", "ir para visao geral", "ir para visão geral", "ver visão geral"], tab: "dashboard" },
      { keys: ["ir para lancamentos", "ir para lançamentos", "ver lançamentos", "ver lancamentos", "tela de lançamentos", "ir para transações", "ver transações", "lista de transações"], tab: "transactions" },
      { keys: ["ir para fluxo", "ir para fluxo de caixa", "ver fluxo de caixa", "tela de fluxo de caixa", "previsão de caixa", "previsao de caixa"], tab: "cashflow" },
      { keys: ["ir para precificacao", "ir para precificação", "abrir preços", "ver preços", "ir para produtos", "tela de produtos", "ir para serviços", "tela de serviços", "gerenciar produtos", "gerenciar serviços", "tabela de preços", "tabela de precos"], tab: "pricing" },
      { keys: ["ir para estrategias", "ir para estratégias", "ir para metas", "planejamento estrategico", "planejamento estratégico", "ver metas", "tela de metas", "ver orçamento", "ver orcamento"], tab: "strategies" },
      { keys: ["ir para pagar", "ir para contas a pagar", "ir para despesas", "contas a pagar", "ver faturas", "tela de contas a pagar"], tab: "payable" },
      { keys: ["ir para configuracao", "ir para configurações", "ir para ajustes", "abrir configurações", "tela de configurações", "tela de ajustes"], tab: "settings" }
    ];

    for (const mapping of navMappings) {
      for (const k of mapping.keys) {
        if (lowerText.includes(k)) {
          setActiveTab(mapping.tab);
          const feedbackMsg = `Perfeito! Comando interpretado. Direcionei sua tela imediatamente para "${getTabLabel(mapping.tab)}". Já estou analisando este ambiente!`;
          addNewDafneMessage(feedbackMsg);
          speakText(feedbackMsg);
          showToast(`Navegando: ${getTabLabel(mapping.tab)}`, "success");
          return true;
        }
      }
    }

    return false;
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "dashboard": return "Painel Geral";
      case "transactions": return "Lançamentos";
      case "cashflow": return "Fluxo de Caixa";
      case "segment-metrics": return "Métricas de Nicho";
      case "pricing": return "Precificação";
      case "strategies": return "Orçamento & Metas";
      case "payable": return "Contas a Pagar";
      case "settings": return "Configurações";
      default: return tab;
    }
  };

  // Core Audit Routine - Scans Transactions and responds
  const executeBoxAuditor = async () => {
    setIsAiResponding(true);
    addNewUserMessage("/auditoria");

    // Dynamic audit facts
    const activeAuds = [
      `Faturamento Consolidado: R$ ${totalSales.toFixed(2)} acumulados.`,
      `Custos Operacionais Acumulados: R$ ${totalExpenses.toFixed(2)}.`,
      `Unidade Ativa Atualmente: ${activeStoreId === "all" ? "Consolidador de Filiais" : activeStore?.companyName || "Única"}.`,
      `Atuação Principal: Nicho Comercial de ${currentSegment === "commerce" ? "Varejo" : currentSegment === "food" ? "Alimentação" : currentSegment === "services" ? "Serviços" : "Tecnologia"}.`
    ];

    try {
      const emailHeader = localStorage.getItem("dafne_user_email") || "";
      const customHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (emailHeader) {
        customHeaders["x-user-email"] = emailHeader;
      }

      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify({
          message: `Faça uma auditoria financeira relâmpago de 3 linhas com tom de mentora Dafne. Dados atuais de caixa: ${activeAuds.join(" / ")}. Indique urgentemente 1 ponto forte e 1 ponto de atenção urgente sobre margens ou despesas. Finalize com incentivo vibrante!`,
          history: []
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        const errMsg = data.error || "Erro ao processar consulta da IA.";
        addNewDafneMessage(`⚠️ **Detecção do Gestor de Quotas:**\n\n${errMsg}`);
        speakText(errMsg);
        fetchUsageStatus();
        return;
      }

      if (data && data.text) {
        addNewDafneMessage(data.text, data.strategicDiagnosis);
        speakText(data.text);
        fetchUsageStatus();
      } else {
        throw new Error("Empty AI response");
      }
    } catch (e) {
      // Fallback local rule based analysis if API fails
      setTimeout(() => {
        const storeName = activeStore?.companyName || "sua empresa";
        let text = `⚡ [Auditoria Analítica Local - Dafne]
Para a empresa **${storeName}** (${currentSegment.toUpperCase()}):
• **Ponto Forte:** O faturamento consolidado de R$ ${totalSales.toLocaleString('pt-BR')} valida uma demanda ativa do mercado.
• **Ponto de Atenção:** Suas despesas acumuladas de R$ ${totalExpenses.toLocaleString('pt-BR')} demandam monitoramento preciso. Busque limitar os custos operacionais (OPEX) a no máximo 75% da receita líquida do ciclo para blindar sua margem de contribuição!`;
        addNewDafneMessage(text);
        speakText(text);
      }, 800);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Add Message Handlers
  const addNewUserMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: "msg-" + Math.random().toString(),
        sender: "user",
        text,
        timestamp: new Date()
      }
    ]);
  };

  const addNewDafneMessage = (text: string, strategicDiagnosis?: any) => {
    if (text.includes("⚠️")) {
      playHapticBeep('error');
    } else {
      playHapticBeep('success');
    }
    setMessages(prev => [
      ...prev,
      {
        id: "msg-" + Math.random().toString(),
        sender: "dafne",
        text,
        timestamp: new Date(),
        strategicDiagnosis: strategicDiagnosis || null
      }
    ]);
  };

  // State-of-the-art client-side cognitive financial synthesis for resilience
  const buildDafneLocalInteractiveAnalysis = (userMsg: string): string => {
    const lower = userMsg.toLowerCase();
    const storeName = activeStore?.companyName || "sua empresa";
    const segmentLabel = currentSegment === "commerce" ? "Varejo" : currentSegment === "food" ? "Alimentação" : currentSegment === "services" ? "Serviços" : "Outro";
    
    // Core parameters
    const margin = totalSales > 0 ? (currentBalance / totalSales) * 100 : 0;
    const breakEven = totalExpenses;
    const format = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    let evaluation = "";
    if (margin > 20) {
      evaluation = "Excelente! (Conversão de caixa de alta eficiência)";
    } else if (margin > 10) {
      evaluation = "Estável (Satisfatório, mas com margem de otimização)";
    } else if (margin > 0) {
      evaluation = "Comprimida (Atenção redobrada, vulnerável a despesas)";
    } else {
      evaluation = "Déficit Temporário (Risco de corrosão de liquidez)";
    }

    let coreAdvice = "";
    if (lower.includes("custo") || lower.includes("despesa") || lower.includes("corte") || lower.includes("cortar") || lower.includes("reduzir") || lower.includes("diminuir") || lower.includes("opex")) {
      coreAdvice = `**DIRETRIZ DE OTIMIZAÇÃO DE CUSTOS (OPEX):**
Focar no controle de saídas recorrentes é o caminho mais rápido para ver sobras de verdade. Para um acumulado atual de **${format(totalExpenses)}** em despesas corporativas, recomendo de imediato uma auditoria cirúrgica de 2 etapas:
1. Revise e liste cada cobrança em conta automatizada, descartando licenças duplicadas de sistemas operacionais.
2. Busque uma meta simples de redução de custos fixos administrativos de no mínimo 5% nos próximos 15 dias, injetando aproximadamente **${format(totalExpenses * 0.05)}** a mais direto no seu saldo de caixa livre.`;
    } else if (lower.includes("venda") || lower.includes("faturar") || lower.includes("receita") || lower.includes("faturamento") || lower.includes("lucro") || lower.includes("lucratividade") || lower.includes("crescer")) {
      coreAdvice = `**ESTRATÉGIA DE ALAVANCAGEM DE FATURAMENTO:**
Você registra hoje **${format(totalSales)}** acumulado de vendas bruto. Para de fato crescer sem asfixiar o caixa PJ com a necessidade de capital de giro elevado, estude o giro de estoque ou o tempo médio de recebíveis das suas transações. Prefira sempre vender os itens e produtos com maior margem de contribuição média cadastrados na sua Planilha de Markups do que forçar grandes descontos apenas para girar faturamento nominal sem margem.`;
    } else if (lower.includes("cmv") || lower.includes("mercadoria") || lower.includes("fornecedor")) {
      coreAdvice = `**ANÁLISE E CONTROLE DE CMV (Custo de Mercadoria):**
Os custos operacionais diretos são sensíveis e cruciais, principalmente no segmento de **${segmentLabel}**. Busque consolidar compras com parceiros de confiança em troca de prazos de faturamento diluídos ou bônus comerciais. No Painel, confira se os custos de frete internacional/nacional ou impostos de entrada foram adicionados de forma rigorosa na sua Planilha de Precificação de Produtos.`;
    } else if (lower.includes("imposto") || lower.includes("tax") || lower.includes("tributo") || lower.includes("fiscal")) {
      coreAdvice = `**AVALIAÇÃO FISCAL E TRIBUTÁRIA ESTRATÉGICA:**
Regimes de impostos no Brasil guardam ótimas avenidas legais de otimização. Verifique junto ao seu escritório contábil se produtos isentos ou que operam sob substituição tributária (tributo monofásico) não estão gerando impostos cumulativos de forma errada.`;
    } else {
      coreAdvice = `**PARECER GERAL DE METAS:**
Atualmente, para manter a liquidez ideal, sua empresa deve defender o faturamento à altura das metas diárias de vendas do Painel Gerencial. Acompanhe se o saldo operacional de **${format(currentBalance)}** é suficiente para suprir os prazos médios de contas a pagar de curto prazo. Recomenda-se reservar pelo menos 10% de cada recebimento Pix/Boleto para uma reserva financeira resiliente no cofrinho de estratégias.`;
    }

    return `### ⚡ DAFNE CORE: ANÁLISE COMPORTAMENTAL DE CAIXA

Olá! Sou a **Dafne**. Identifiquei e processei com sucesso os indicadores vitais de competência para a empresa **${storeName}** (${segmentLabel.toUpperCase()}):

* **Faturamento Bruto:** ${format(totalSales)}
* **Drenagem Operacional (OPEX/CMV):** ${format(totalExpenses)}
* **Saldo Líquido de Caixa:** ${format(currentBalance)}
* **Eficiência Operacional Real:** ${margin.toFixed(1)}% (${evaluation})

---

${coreAdvice}

---

#### 🎯 Metas Sugeridas:
* **Garantia de Ponto de Equilíbrio (Break-Even):** Faturar de forma recorrente e média no mínimo **${format(breakEven)}** a cada ciclo para manter as contas com saldo verde estável.
* **Margem Alvo Recomendada:** Elevar o markup médio global para buscar uma margem líquida consolidada ideal acima de 15% para o seu setor.`;
  };

  // SEND CHAT FORM TO BACKEND DAFNE API
  const handleSendMessage = async (textToSend?: string) => {
    const rawMsg = textToSend || inputVal;
    if (!rawMsg.trim()) return;

    if (!textToSend) setInputVal("");
    addNewUserMessage(rawMsg);
    setIsAiResponding(true);

    // 1. Check commands
    const isMatchedCommand = processCommandRouting(rawMsg.toLowerCase());
    if (isMatchedCommand) {
      setIsAiResponding(false);
      return;
    }

    // 1b. Intercept voice command for registered product sales
    const isProductCommand = await processProductVoiceCommand(rawMsg);
    if (isProductCommand) {
      setIsAiResponding(false);
      return;
    }

    // 2. Fetch from LLM AI
    try {
      const emailHeader = localStorage.getItem("dafne_user_email") || "";
      const customHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (emailHeader) {
        customHeaders["x-user-email"] = emailHeader;
      }

      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify({
          message: rawMsg,
          history: messages,
          enableTransactionParsing: jenniferMode,
          financialData: {
            businessSegment: currentSegment,
            income: totalSales,
            expense: totalExpenses,
            balance: currentBalance,
            companyName: activeStore?.companyName || "Apurar Consolidadas",
            averageBilling: profile?.averageBilling || 0,
            billingGoal: profile?.billingGoal || 0,
            billingGoalDeadline: profile?.billingGoalDeadline || "",
            billingNotes: profile?.billingNotes || "",
            products: products
          }
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        const errMsg = data.error || "Erro ao processar consulta da IA.";
        addNewDafneMessage(`⚠️ **Detecção do Gestor de Quotas:**\n\n${errMsg}`);
        speakText(errMsg);
        fetchUsageStatus();
        return;
      }

      if (data && data.text) {
        addNewDafneMessage(data.text, data.strategicDiagnosis);
        speakText(data.text);
        fetchUsageStatus();

        if (data.detectedTransaction) {
          await handleAutomaticTransactionLogging(data.detectedTransaction);
        } else {
          const localMatch = parseClientTransactionFallback(rawMsg);
          if (localMatch) {
            await handleAutomaticTransactionLogging(localMatch);
          }
        }
      } else {
        const localMatch = parseClientTransactionFallback(rawMsg);
        if (localMatch) {
          const label = localMatch.type === "income" ? "Venda" : "Despesa";
          const confirmTxt = `Confirmado localmente! Lançado um(a) **${label}** de **R$ ${localMatch.amount.toFixed(2)}** sob categoria **${localMatch.categoryName}** em modo de emergência.`;
          addNewDafneMessage(confirmTxt);
          speakText(confirmTxt);
          await handleAutomaticTransactionLogging(localMatch);
          return;
        }
        // Advanced client-side fallback compiler
        const fallbackText = buildDafneLocalInteractiveAnalysis(rawMsg);
        addNewDafneMessage(fallbackText);
        speakText(fallbackText);
      }
    } catch (e) {
      const localMatch = parseClientTransactionFallback(rawMsg);
      if (localMatch) {
        const label = localMatch.type === "income" ? "Venda" : "Despesa";
        const confirmTxt = `Confirmado localmente! Lançado um(a) **${label}** de **R$ ${localMatch.amount.toFixed(2)}** sob categoria **${localMatch.categoryName}** (Sinal offline resiliente).`;
        addNewDafneMessage(confirmTxt);
        speakText(confirmTxt);
        await handleAutomaticTransactionLogging(localMatch);
        return;
      }
      // Graceful local resilience fallback
      const fallbackText = buildDafneLocalInteractiveAnalysis(rawMsg);
      addNewDafneMessage(fallbackText);
      speakText(fallbackText);
    } finally {
      setIsAiResponding(false);
    }
  };

  // DIRECT MICROPHONE DICTATION OR WAKE-WORD TOGGLE
  const toggleSpeechListening = () => {
    setSpeechError(false);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError(true);
      showToast("Seu navegador não oferece suporte nativo para reconhecimento de voz.", "warning");
      return;
    }

    if (isOpen) {
      if (isDirectDictating) {
        if (directRecRef.current) {
          try {
            directRecRef.current.stop();
          } catch (e) {}
        }
        setIsDirectDictating(false);
        showToast("Escuta de áudio pausada.", "info");
        return;
      }

      // If continuous wake-word is currently listening in background, stop it and remember to restart it on end
      wasWakeWordActiveRef.current = wakeWordMode;
      if (wakeWordRecRef.current) {
        try {
          wakeWordRecRef.current.abort();
        } catch (e) {}
        wakeWordRecRef.current = null;
      }
      if (wakeWordMode) {
        setWakeWordMode(false);
      }
      setIsListening(false);

      try {
        const rec = new SpeechRecognition();
        rec.lang = "pt-BR";
        rec.continuous = false;
        rec.interimResults = true;

        rec.onstart = () => {
          setIsDirectDictating(true);
          playHapticBeep('wakeup');
          showToast("Ouvindo... Fale diretamente o comando!", "info");
        };

        rec.onerror = (e: any) => {
          console.error("Direct dictation error:", e);
          setIsDirectDictating(false);
          if (e.error === "not-allowed" || e.error === "audio-capture" || e.error === "service-not-allowed") {
            setSpeechError(true);
            showToast("Microfone Bloqueado: Para usar o microfone da assistente, abra o aplicativo em uma 'Nova Aba' (botão no topo direito) e conceda acesso!", "error");
          } else {
            showToast("Falha ou atraso no reconhecimento de áudio local.", "warning");
          }
        };

        rec.onend = () => {
          setIsDirectDictating(false);
          if (wasWakeWordActiveRef.current) {
            // Restore background continuous wake-word listening
            setTimeout(() => {
              setWakeWordMode(true);
            }, 500);
          }
        };

        let silenceTimer: any = null;
        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptSegment = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptSegment;
            } else {
              interimTranscript += transcriptSegment;
            }
          }

          const transcript = (finalTranscript || interimTranscript).trim();
          if (transcript) {
            setInputVal(transcript);
          }

          const isFinalPhrase = event.results[event.results.length - 1].isFinal;
          if (isFinalPhrase && finalTranscript.trim()) {
            if (silenceTimer) clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
              handleSendMessage(finalTranscript.trim());
              setInputVal("");
              try { rec.stop(); } catch (e) {}
            }, 600);
          }
        };

        directRecRef.current = rec;
        rec.start();
      } catch (err) {
        console.error("Error starting direct dictation:", err);
        setIsDirectDictating(false);
      }
    } else {
      if (wakeWordMode) {
        setWakeWordMode(false);
        showToast("Modo Viva-Voz Desativado. Microfone desligado.", "info");
      } else {
        setWakeWordMode(true);
        showToast("Modo Viva-Voz Ativo! Sou a Dafne, pode falar agora!", "success");
      }
    }
  };

  return (
    <div className="fixed bottom-[74px] md:bottom-20 right-4 md:right-8 z-[999] pointer-events-none">
      
      {/* 1. COMPACT DOCK HEADSPEECH INTEGRATOR */}
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        
        {/* DYNAMIC ADVICE TOAST SPEECH BUBBLE */}
        <AnimatePresence>
          {showBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="max-w-[280px] bg-[#0c0c0c] text-white p-3.5 rounded-2xl border border-orange-500/60 shadow-[0_8px_32px_rgba(249,115,22,0.18)] cursor-pointer text-left text-xs leading-relaxed flex items-center gap-3 relative mr-2"
            >
              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#0c0c0c] rotate-45 border-r border-t border-orange-500/50 pointer-events-none" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <p className="font-medium">{bubbleText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN HUD EXPANDED WINDOW PANEL */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 40 }}
              className={cn(
                "w-[calc(100vw-32px)] md:w-[380px] bg-[#0c0d12]/95 backdrop-blur-xl text-white border border-orange-500/40 rounded-3xl shadow-[0_16px_56px_rgba(0,0,0,0.4),_0_0_24px_rgba(249,115,22,0.06)] flex flex-col overflow-hidden transition-all duration-300",
                isMinimized ? "h-[60px]" : "h-[420px] max-h-[calc(100vh-160px)] md:h-[530px] md:max-h-none"
              )}
            >
              
              {/* HUD PANEL HEADER */}
              <div className="bg-[#161822]/90 px-5 py-4 border-b border-orange-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={dafneAvatar}
                      alt="Dafne"
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0c0c0c] animate-pulse bg-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-wider uppercase flex items-center gap-1">
                      <span>Dafne I.A.</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono border bg-orange-500/15 border-orange-500/30 text-orange-400">
                        CO-PILOTO FINANCEIRO
                      </span>
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-bold tracking-tight flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 
                      Sintonizado: {getTabLabel(activeTab)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Central de Ajuda "?" Toggle Button */}
                  <button
                    onClick={() => {
                      setShowHelpConsole(!showHelpConsole);
                      setShowCalibration(false);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all hover:bg-zinc-900 border",
                      showHelpConsole 
                        ? "text-orange-400 bg-orange-500/10 border-orange-500/30" 
                        : "text-zinc-400 hover:text-white border-transparent"
                    )}
                    title="Central de Ajuda e Comandos"
                  >
                    <HelpCircle size={15} />
                  </button>

                  {/* Calibration Sliders Toggle Button */}
                  <button
                    onClick={() => {
                      setShowCalibration(!showCalibration);
                      setShowHelpConsole(false);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all hover:bg-zinc-900 border",
                      showCalibration 
                        ? "text-orange-400 bg-orange-500/10 border-orange-500/30" 
                        : "text-zinc-400 hover:text-white border-transparent"
                    )}
                    title="Calibrar Voz e Agentes"
                  >
                    <Sliders size={15} />
                  </button>

                  {/* TTS Vocalizer Toggle */}
                  <button
                    onClick={() => {
                      setTtsEnabled(!ttsEnabled);
                      showToast(ttsEnabled ? "Leitor de Voz Desligado" : "Mentor de fala e leitura reativado!", "info");
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all hover:bg-zinc-900",
                      ttsEnabled ? "text-orange-400" : "text-zinc-650"
                    )}
                    title={ttsEnabled ? "Desativar Áudio" : "Ativar Leitura Automática"}
                  >
                    {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>

                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors hover:bg-zinc-900"
                  >
                    {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors hover:bg-zinc-900"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Dynamic AI Quota / API Key Waste Limiter Tracker HUD Indicator */}
              {usageStatus && !isMinimized && (
                <div className="bg-[#111111] border-b border-orange-500/15 px-5 py-2 flex items-center justify-between text-[9px] font-mono select-none text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full inline-block animate-pulse" 
                      style={{ 
                        backgroundColor: usageStatus.hasCustomKey || usageStatus.isAdmin 
                          ? "#10b981" 
                          : usageStatus.remaining <= 5 
                            ? "#ef4444" 
                            : "#f97316" 
                      }} 
                    />
                    <span className="font-bold">
                      {usageStatus.hasCustomKey 
                        ? "Chave Própria Utilizada (Uso Ilimitado)" 
                        : usageStatus.isAdmin 
                          ? "Sessão Administrativa (Sem Limites)" 
                          : `Cota IA: ${usageStatus.remaining}/${usageStatus.dailyLimit} consultas restantes`}
                    </span>
                  </div>
                  <div>
                    {!usageStatus.hasCustomKey && !usageStatus.isAdmin && (
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest">
                        Reset {usageStatus.resetInHours}h
                      </span>
                    )}
                    {(usageStatus.hasCustomKey || usageStatus.isAdmin) && (
                      <span className="text-[8px] bg-emerald-500/15 text-emerald-400 font-bold px-1 rounded border border-emerald-500/30">
                        ATIVO
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* HUD PANEL MESSAGE SCREEN */}
              {!isMinimized && (
                showHelpConsole ? (
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0a0a0a] text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="space-y-1 pb-3 border-b border-orange-500/10">
                      <h5 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <HelpCircle size={13} className="text-orange-500 animate-pulse" />
                        Central de Comando & Assistência
                      </h5>
                      <p className="text-[10px] text-zinc-500 font-sans">
                        Aprenda a comandar sua mentora de caixa e use automações rápidas com cliques. Estudo teórico e prático ao seu alcance.
                      </p>
                    </div>

                    {/* COMENTÁRIOS E DIALETOS DE LANÇAMENTOS */}
                    <div className="space-y-2.5">
                      <span className="text-[9.5px] font-black uppercase text-orange-400 tracking-wider font-mono block">
                        📝 Como Lançar Transações (Voz ou Texto)
                      </span>
                      <div className="grid grid-cols-1 gap-2 text-[10.5px]">
                        <div className="bg-[#101010] p-3 rounded-xl border border-zinc-800 hover:border-orange-500/20 transition-colors">
                          <strong className="text-emerald-400 font-bold block mb-1 font-sans">🟢 Receitas e Vendas Simples</strong>
                          <span className="text-zinc-400 leading-relaxed block font-sans">
                            Diga: <code className="text-zinc-200 font-mono bg-zinc-900 px-1 py-0.5 rounded">"Vendi R$ 250 em serviços"</code> ou <code className="text-zinc-200 font-mono bg-zinc-900 px-1 py-0.5 rounded">"Receita de R$ 1.200 de assessoria hoje"</code>
                          </span>
                        </div>

                        <div className="bg-[#101010] p-3 rounded-xl border border-zinc-800 hover:border-orange-500/20 transition-colors">
                          <strong className="text-amber-500 font-bold block mb-1 font-sans">⚙️ CMV Automático / Venda de Catálogo</strong>
                          <span className="text-zinc-400 leading-relaxed block font-sans">
                            Quando você vende itens cadastrados com preço de custo, DAFNE gera a receita de faturamento e também **deduz automaticamente o CMV como despesa**!
                            <br />
                            Diga: <code className="text-zinc-200 font-mono bg-zinc-900 px-1 py-0.5 rounded flex-wrap block mt-1">"Vendi 3 Camisetas de algodão para Maria por R$ 90 cada"</code>
                          </span>
                        </div>

                        <div className="bg-[#101010] p-3 rounded-xl border border-zinc-800 hover:border-orange-500/20 transition-colors">
                          <strong className="text-rose-400 font-bold block mb-1 font-sans">🔴 Despesas e Gastos Operacionais</strong>
                          <span className="text-zinc-400 leading-relaxed block font-sans">
                            Categorize automaticamente indicando a finalidade ou a palavra despesa.
                            <br />
                            Diga: <code className="text-zinc-200 font-mono bg-zinc-900 px-1 py-0.5 rounded">"Paguei R$ 140 de água da loja"</code> ou <code className="text-zinc-200 font-mono bg-zinc-900 px-1 py-0.5 rounded">"Despesa de R$ 900 com o contador ontem"</code>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* COMANDOS DIRECT-CLICK */}
                    <div className="space-y-2.5">
                      <span className="text-[9.5px] font-black uppercase text-orange-400 tracking-wider font-mono block">
                        🚀 Atalhos de Comando Rápido (Clique para Carregar)
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                        {[
                          { text: "📊 Analisar meu DRE e Margens reais", icon: <LineChart size={11} className="text-orange-500" /> },
                          { text: "📌 Detalhar despesas OPEX vs CMV", icon: <Search size={11} className="text-sky-400" /> },
                          { text: "💎 Como posso aumentar meu lucro?", icon: <Sparkles size={11} className="text-yellow-400" /> },
                          { text: "❓ O que é e como funciona o CMV?", icon: <Bot size={11} className="text-teal-400" /> },
                          { text: "💵 Auditar lançamentos deste mês", icon: <Activity size={11} className="text-emerald-400" /> },
                        ].map((cmd, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              sound.playClick();
                              setInputVal(cmd.text);
                              setShowHelpConsole(false);
                              showToast(`Comando copiado: "${cmd.text}"`, "info");
                            }}
                            className="bg-[#121212] hover:bg-[#181818] border border-zinc-850 hover:border-orange-500/30 p-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 select-none group"
                          >
                            <span className="group-hover:scale-110 transition-transform">{cmd.icon}</span>
                            <span className="text-zinc-300 font-bold leading-tight group-hover:text-white transition-colors">{cmd.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-xl border border-orange-500/10 text-zinc-400 text-[10px] space-y-1">
                      <strong className="text-zinc-200 block font-mono uppercase tracking-wider text-[8.5px]">💡 Auditoria de Inteligência de Resposta</strong>
                      <p className="leading-relaxed">
                        DAFNE opera com modelos generativos de ultra-baixa latência. Se ela apresentar dificuldades em diferenciar comandos ou dúvidas, use nossos atalhos acima para padronizar e treinar a intenção desejada.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowHelpConsole(false)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black text-center py-2.5 rounded-xl transition-colors cursor-pointer text-xs"
                    >
                      Voltar ao Chat
                    </button>
                  </div>
                ) : showCalibration ? (
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0a0a0a] text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="space-y-1 pb-3 border-b border-orange-500/10">
                      <h5 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <Sliders size={13} className="text-orange-500" />
                        Sintonizador de Voz Neural
                      </h5>
                      <p className="text-[10px] text-zinc-500 font-sans">
                        Calibre as configurações de áudio para uma mentoria natural e fluida do caixa.
                      </p>
                    </div>

                    {/* ASSISTANT SELECTION TOGGLE */}
                    <div className="space-y-2 bg-[#101010] p-3.5 rounded-xl border border-orange-500/10">
                      <label className="text-[10px] font-black uppercase text-orange-400 tracking-wider font-mono flex items-center gap-1.5">
                        <Bot size={13} />
                        Sistema Unificado: Dafne I.A.
                      </label>
                      <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                        A assessoria da <strong>Dafne</strong> agora integra os dois sistemas em uma única inteligência. Ela atua permanentemente tanto como sua mentora financeira estratégica (geração de DRE, markups e relatórios de metas) quanto como sua agente ágil de execução de lançamentos por voz ou texto.
                      </p>
                    </div>

                    {/* TIMBRE SELECTION (NEURAL VOICES FILTERED) */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider font-mono">
                        Timbres Neurais Disponíveis
                      </label>
                      
                      <div className="space-y-1 max-h-[96px] overflow-y-auto border border-orange-500/10 rounded-xl p-1.5 bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800">
                        {(() => {
                          const voices = typeof window !== "undefined" && "speechSynthesis" in window
                            ? window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().includes("pt-br") || v.lang.toLowerCase().startsWith("pt"))
                            : [];
                          
                          if (voices.length === 0) {
                            return (
                              <div className="text-[9px] text-zinc-550 text-center py-2 italic font-mono">
                                Nenhum timbre alternativo detectado. Usando sintetizador nativo suave do sistema.
                              </div>
                            );
                          }

                          return voices.map((v, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedVoice(v.name);
                                localStorage.setItem("dafne_selected_voice", v.name);
                              }}
                              className={cn(
                                "w-full text-left text-[9.5px] py-1 px-2 rounded border transition-all flex items-center justify-between cursor-pointer",
                                selectedVoice === v.name
                                  ? "bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold"
                                  : "bg-transparent border-transparent text-zinc-500 hover:bg-zinc-900"
                              )}
                            >
                              <span className="font-mono truncate max-w-[170px]">{v.name}</span>
                              <span className="text-[8px] bg-zinc-900 px-1 py-0.5 rounded text-zinc-650 font-bold uppercase shrink-0 font-mono">
                                {v.localService ? "Local/HD" : "Rede"}
                              </span>
                            </button>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* SLIDERS FOR PITCH & RATE */}
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1 font-mono">
                          <span>Tom de Voz (Pitch): {voicePitch.toFixed(2)}x</span>
                          <span className="text-[8px] text-zinc-500 font-normal">Padrão: 1.15</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.05"
                          value={voicePitch}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setVoicePitch(v);
                            localStorage.setItem("dafne_voice_pitch", String(v));
                          }}
                          className="w-full accent-orange-500 bg-zinc-900 h-1 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1 font-mono">
                          <span>Velocidade de Fala (Rate): {voiceRate.toFixed(2)}x</span>
                          <span className="text-[8px] text-zinc-500 font-normal">Padrão: 1.10</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.05"
                          value={voiceRate}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setVoiceRate(v);
                            localStorage.setItem("dafne_voice_rate", String(v));
                          }}
                          className="w-full accent-orange-500 bg-zinc-900 h-1 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1 font-mono">
                          <span>Limiar de Ruído (Noise Gate): {noiseThreshold}%</span>
                          <span className="text-[8px] text-zinc-500 font-normal">Recomendado: 8%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="35"
                          step="1"
                          value={noiseThreshold}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            setNoiseThreshold(v);
                          }}
                          className="w-full accent-orange-500 bg-zinc-900 h-1 rounded-lg cursor-pointer"
                        />
                        <p className="text-[7.5px] text-zinc-500 font-sans mt-1">
                          Nossos filtros de banda (200Hz - 3400Hz) eliminam de forma ativa ruidos, estalos e cliques que fiquem abaixo de {noiseThreshold}%.
                        </p>
                      </div>

                      {/* Tecnologia de Recepção de Voz Melhorada (Acoustic & Phonetic Controls) */}
                      <div className="pt-3 border-t border-orange-500/10 space-y-2.5">
                        <span className="text-[9.5px] font-black uppercase text-orange-400 tracking-wider font-mono block">
                          Tecnologia de Recepção
                        </span>
                        
                        <div className="flex items-start gap-2.5 bg-zinc-950 p-2.5 rounded-xl border border-orange-500/10">
                          <input
                            type="checkbox"
                            id="acousticFeedbackToggle"
                            checked={acousticFeedback}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAcousticFeedback(checked);
                              localStorage.setItem("dafne_acoustic_feedback", String(checked));
                              showToast(checked ? "Sinal Acústico Ativado 🔊" : "Sinal Acústico Desativado 🔇", "info");
                            }}
                            className="mt-0.5 rounded text-orange-500 focus:ring-orange-500 h-3.5 w-3.5 cursor-pointer accent-orange-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <label htmlFor="acousticFeedbackToggle" className="text-[10px] font-extrabold text-slate-200 cursor-pointer flex items-center gap-1 leading-tight font-sans">
                              Retorno Háptico Acústico (Bipe)
                            </label>
                            <p className="text-[7.5px] text-zinc-500 font-sans mt-0.5 leading-normal">
                              Sinal sonoro instantâneo quando a voz inicia a transmissão e quando o comando é bem-sucedido.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 bg-zinc-950 p-2.5 rounded-xl border border-orange-500/10">
                          <input
                            type="checkbox"
                            id="phoneticCorrectionToggle"
                            checked={phoneticCorrection}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setPhoneticCorrection(checked);
                              localStorage.setItem("dafne_phonetic_correction", String(checked));
                              showToast(checked ? "Correção Fonética Habilitada" : "Correção Fonética Desativada", "info");
                            }}
                            className="mt-0.5 rounded text-orange-500 focus:ring-orange-500 h-3.5 w-3.5 cursor-pointer accent-orange-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <label htmlFor="phoneticCorrectionToggle" className="text-[10px] font-extrabold text-slate-200 cursor-pointer flex items-center gap-1 leading-tight font-sans">
                              Filtro de Correção Fonética IA
                            </label>
                            <p className="text-[7.5px] text-zinc-500 font-sans mt-0.5 leading-normal">
                              Corrige automaticamente termos de português verbal sotaque ou escrita para máxima eficácia no caixa.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CALIBRATION UTILITIES */}
                    <div className="flex gap-2 pt-2 border-t border-orange-500/10">
                      <button
                        onClick={handleTestSpeech}
                        className="flex-1 bg-[#141414] hover:bg-zinc-900 text-orange-400 hover:text-orange-300 text-[10.5px] font-black py-2.5 px-3 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Play size={11} className="text-orange-500" />
                        Testar Áudio 🔊
                      </button>

                      <button
                        onClick={() => {
                          setShowCalibration(false);
                          showToast("Configurações salvas!", "success");
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-black text-[11px] font-black py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                      >
                        Sintonizar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <NeuralSynapseWave state={isListening ? "listening" : hudSpeaking ? "speaking" : isAiResponding ? "thinking" : "idle"} />
                    <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 bg-[#0c0c0c] scrollbar-thin scrollbar-thumb-zinc-800">
                      <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed backdrop-blur-sm",
                              msg.sender === "user"
                                ? "bg-orange-500 text-black ml-auto rounded-tr-none border border-orange-500"
                                : "bg-[#141414] border border-orange-500/15 text-slate-100 rounded-tl-none shadow-sm"
                            )}
                          >
                            <div className={cn(
                              "flex items-center gap-1 mb-1 font-black uppercase text-[8px] tracking-wider",
                              msg.sender === "user" ? "text-stone-800 ml-auto" : "text-orange-400"
                            )}>
                              {msg.sender === "user" ? "Você" : "Dafne I.A. ⚡"}
                              <span className="text-zinc-500 font-mono text-[7px]">
                                {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            
                            <p className="whitespace-pre-line select-text font-serif leading-relaxed text-slate-200">
                              {msg.text}
                            </p>

                            {msg.strategicDiagnosis && (
                              <div className="mt-4 border-t border-orange-500/10 pt-3 space-y-3">
                                {/* Health Rating Gauge */}
                                <div className="bg-zinc-950 p-3 rounded-xl border border-orange-500/10 flex items-center justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 font-mono block">Auditoria de Saúde</span>
                                    <p className="text-[8px] text-zinc-500 font-sans leading-relaxed">
                                      Nível de segurança financeira tática calculada pela IA.
                                    </p>
                                  </div>
                                  <div className="relative flex items-center justify-center shrink-0">
                                    <svg className="w-12 h-12 transform -rotate-90">
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r="18"
                                        stroke="#1c1917"
                                        strokeWidth="3.5"
                                        fill="transparent"
                                      />
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r="18"
                                        stroke={msg.strategicDiagnosis.healthScore >= 70 ? "#10b981" : msg.strategicDiagnosis.healthScore >= 40 ? "#f97316" : "#ef4444"}
                                        strokeWidth="3.5"
                                        fill="transparent"
                                        strokeDasharray={2 * Math.PI * 18}
                                        strokeDashoffset={2 * Math.PI * 18 * (1 - msg.strategicDiagnosis.healthScore / 100)}
                                        className="transition-all duration-1000 ease-out"
                                      />
                                    </svg>
                                    <span className="absolute text-[10px] font-black font-mono text-slate-100">
                                      {msg.strategicDiagnosis.healthScore}%
                                    </span>
                                  </div>
                                </div>

                                {/* Cognitive Alert */}
                                {msg.strategicDiagnosis.cognitiveAlert && (
                                  <div className="bg-zinc-950 p-3 rounded-xl border border-orange-500/10 space-y-1">
                                    <div className="flex items-center gap-1.5 text-orange-400">
                                      <Bot size={13} className="shrink-0 animate-pulse" />
                                      <span className="text-[9px] font-black uppercase tracking-wider font-mono">Conselho Direcionado</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-300 font-mono leading-relaxed select-text italic">
                                      "{msg.strategicDiagnosis.cognitiveAlert}"
                                    </p>
                                  </div>
                                )}

                                {/* Metric Highlights Grid */}
                                {msg.strategicDiagnosis.metricHighlights && msg.strategicDiagnosis.metricHighlights.length > 0 && (
                                  <div className="grid grid-cols-3 gap-2">
                                    {msg.strategicDiagnosis.metricHighlights.map((kpi, idx) => {
                                      const statusStr = kpi.status as string;
                                      const isErr = statusStr === 'error' || statusStr === 'danger' || statusStr === 'err';
                                      const isWarn = statusStr === 'warning' || statusStr === 'warn';
                                      const isSucc = statusStr === 'success' || statusStr === 'stable' || statusStr === 'succ';
                                      return (
                                        <div key={idx} className="bg-zinc-950 p-2 rounded-lg border border-orange-500/5 text-center space-y-0.5">
                                          <span className="text-[7.5px] font-black uppercase text-zinc-500 tracking-wider font-mono block truncate" title={kpi.label}>
                                            {kpi.label}
                                          </span>
                                          <div className={cn(
                                            "text-[10px] font-black font-mono leading-none truncate",
                                            isSucc ? "text-emerald-400" : isErr ? "text-red-400" : "text-amber-400"
                                          )}>
                                            {kpi.value}
                                          </div>
                                          <div className="flex justify-center">
                                            <span className={cn(
                                              "w-1 h-1 rounded-full",
                                              isSucc ? "bg-emerald-500" : isErr ? "bg-red-500" : "bg-amber-500"
                                            )} />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Remedial Action Plan */}
                                {msg.strategicDiagnosis.remedialActionPlan && msg.strategicDiagnosis.remedialActionPlan.length > 0 && (
                                  <div className="bg-zinc-950 p-3 rounded-xl border border-orange-500/10 space-y-2">
                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                      <Activity size={13} className="shrink-0" />
                                      <span className="text-[9px] font-black uppercase tracking-wider font-mono">Plano de Mitigação de Risco</span>
                                    </div>
                                    <div className="space-y-1.5">
                                      {msg.strategicDiagnosis.remedialActionPlan.map((action, idx) => (
                                        <div key={idx} className="flex items-start gap-2 bg-[#0c0c0c] p-2 rounded-lg border border-emerald-500/10">
                                          <input
                                            type="checkbox"
                                            id={`plan-chk-${msg.id}-${idx}`}
                                            className="mt-0.5 h-3 w-3 rounded accent-emerald-500 border-zinc-800 bg-zinc-950 cursor-pointer"
                                          />
                                          <label htmlFor={`plan-chk-${msg.id}-${idx}`} className="text-[9.5px] cursor-pointer text-zinc-300 leading-normal font-sans font-medium transition-colors hover:text-slate-100 select-none">
                                            {action}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {isAiResponding && (
                        <div className="flex items-center gap-2 bg-[#141414] p-3 rounded-2xl border border-orange-500/10 max-w-[80%] rounded-tl-none">
                          <div className="flex space-x-1">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono animate-pulse">
                            Pensando...
                          </span>
                        </div>
                      )}

                      {/* Integrated Micro Permission & iFrame diagnostic assistant */}
                      {speechError && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-orange-50/10 border border-orange-500/35 p-3.5 rounded-2xl max-w-[90%] font-sans text-left space-y-2 select-none shadow-lg relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full pointer-events-none" />
                          <div className="flex items-center gap-2">
                            <AlertCircle size={15} className="text-orange-400 shrink-0 animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">
                              Diagnóstico de Áudio do HUD
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-300 leading-relaxed font-sans font-medium">
                            Detectamos que o microfone está indisponível ou foi recusado. Isso ocorre por segurança do navegador ao executar o app dentro de um <strong>iframe</strong>.
                          </p>
                          <div className="text-[9px] font-mono text-zinc-400 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-400">✔</span> <span>Sandbox habilitado na plataforma</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-orange-400">ℹ</span> <span>Falta permissão manual no navegador</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1 text-[9px] font-black uppercase font-sans">
                            <a 
                              href={window.location.href} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="bg-orange-500 border border-orange-600 px-2.5 py-1 text-black font-semibold rounded-lg hover:bg-orange-600 transition-all flex items-center gap-1"
                              onClick={() => setSpeechError(false)}
                            >
                              Abrir em Nova Aba 🌐
                            </a>
                            <button 
                              onClick={() => setSpeechError(false)} 
                              className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-zinc-300 rounded-lg hover:bg-zinc-900 transition-all cursor-pointer"
                            >
                              Descartar
                            </button>
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* HIGH-TECH NEURAL VOICE AUDIO visualizer line (if listening) */}
                    {isListening && (
                      <div className="bg-[#141414] px-4 py-3 border-t border-orange-500/10 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest font-mono animate-pulse">
                              Sintonizada! Fale "Dafne, lançar..."
                            </span>
                          </div>

                          {/* MICROPHONE GRAPHICS */}
                          <div className="flex items-end justify-center gap-0.5 h-4">
                            {[5, 12, 18, 10, 16, 7, 13, 6].map((h, i) => {
                              const scale = dspActive ? (voiceActivity / 50) + 0.35 : 1.0;
                              const currentHeight = Math.min(22, Math.round(h * scale));
                              return (
                                <motion.div
                                  key={i}
                                  animate={{ height: [currentHeight, currentHeight * 0.3, currentHeight * 1.4, currentHeight] }}
                                  transition={{ repeat: Infinity, duration: 0.5 + (i * 0.1), ease: "easeInOut" }}
                                  className={cn("w-0.5 rounded-full", dspActive ? "bg-emerald-400 animate-pulse" : "bg-rose-500")}
                                  style={{ height: currentHeight }}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* HIGH-TECH DSP AUDIO FILTER CONTROLLER FOOTER AREA */}
                        <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 text-[8px] font-mono text-zinc-400 select-none">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setDspActive(!dspActive);
                                showToast(`Filtros de Banda DSP ${!dspActive ? 'Ativados' : 'Ignorados (Bypass)'}`, "info");
                              }}
                              className={cn(
                                "px-1.5 py-0.5 rounded border uppercase text-[7px] font-black tracking-widest transition-colors cursor-pointer",
                                dspActive 
                                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/70"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                              )}
                              title="Alternar filtro de áudio DSP"
                            >
                              DSP: {dspActive ? "FILTRANDO" : "BYPASS"}
                            </button>
                            <span className="text-[7.5px] truncate max-w-[130px]">{dspIndicator}</span>
                          </div>

                          {dspActive && (
                            <div className="flex items-center gap-2">
                              <span>Energia:</span>
                              <div className="w-14 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative flex items-center shrink-0">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-75"
                                  style={{ width: `${voiceActivity}%` }}
                                />
                                <div 
                                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80" 
                                  style={{ left: `${noiseThreshold}%` }}
                                />
                              </div>
                              <span className={cn(
                                "font-bold text-[7.5px] tracking-wider shrink-0",
                                voiceActivity > noiseThreshold ? "text-emerald-400 animate-pulse font-extrabold" : "text-zinc-650"
                              )}>
                                {voiceActivity > noiseThreshold ? "VOZ DETECTADA" : "SILÊNCIO"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RECOMMENDATION PILLS CONTAINER */}
                    <div className="bg-[#0c0c0c] px-4 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-t border-orange-500/15 select-none animate-fade-in">
                      {getContextualPills().map((pill, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(pill.action)}
                          className="text-[9.5px] font-black px-3 py-1.5 rounded-full transition-all cursor-pointer inline-block border bg-[#141414] hover:bg-zinc-900 border-orange-500/20 hover:border-orange-500/50 text-orange-400 hover:text-orange-300"
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>

                    {/* HUD PANEL CHAT INPUT ACCORDION */}
                    <div className="bg-[#141414] p-3 border-t border-orange-500/15 flex items-center gap-1.5">
                      
                      {/* Active Voice Microphone trigger */}
                      <button
                        onClick={toggleSpeechListening}
                        className={cn(
                          "p-2.5 rounded-xl transition-all border shrink-0 relative cursor-pointer",
                          (isDirectDictating || isListening) 
                            ? "bg-rose-500/25 border-rose-500/50 text-rose-400 animate-pulse"
                            : speechError 
                              ? "bg-[#0c0c0c] border-zinc-800 text-zinc-500" 
                              : "bg-[#0c0c0c] hover:bg-zinc-900 border-orange-500/20 text-orange-400"
                        )}
                        title="Falar Comando de Voz"
                      >
                        {(isDirectDictating || isListening) ? <MicOff size={16} /> : <Mic size={16} />}
                        {(isDirectDictating || isListening) && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                        )}
                      </button>

                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder={isDirectDictating ? "Ouvindo... Pergunte ou diga o que registrar!" : "Dafne: Diga o que registrar (ex: vendi R$ 120) ou pergunte algo..."}
                          value={inputVal}
                          onChange={(e) => setInputVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendMessage();
                            }
                          }}
                          className="w-full text-xs bg-[#0c0c0c] text-white placeholder-zinc-650 pl-3.5 pr-8 py-2.5 rounded-xl border outline-none transition-colors border-orange-500/20 focus:border-orange-500/60"
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!inputVal.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 p-1 rounded-md"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    </div>
                  </>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. ROUND FLOATING ACTION BUTTON / LAUNCHER */}
        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="w-14 h-14 bg-[#0c0c0c] hover:bg-[#141414] text-white rounded-full shadow-[0_10px_35px_rgba(249,115,22,0.3)] border border-orange-500 flex items-center justify-center relative cursor-pointer outline-none focus:outline-none"
            title="Dafne HUD Co-Piloto"
          >
            {/* Pulsing outer ring */}
            <span className="absolute -inset-1.5 rounded-full border border-orange-500/25 animate-pulse" style={{ animationDuration: "2.5s" }} />
            <span className="absolute -inset-3 rounded-full border border-orange-500/[0.08] animate-ping" style={{ animationDuration: "3.5s" }} />

            <div className="relative">
              <img
                src={dafneAvatar}
                alt="Dafne Avatar"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover border border-white/10"
              />
              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0c0c0c]" />
            </div>

            {/* Micro strategic badge */}
            <div className="absolute -top-1.5 -right-1.5 bg-orange-500 text-black text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full shadow-md animate-bounce" style={{ animationDuration: "2s" }}>
              HUD
            </div>
          </motion.button>
        )}

      </div>
    </div>
  );
}
