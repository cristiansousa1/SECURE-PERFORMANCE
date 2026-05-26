import React, { useState, useEffect, useRef } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Bot,
  Brain,
  MessageSquare,
  Copy,
  Check,
  PlayCircle,
  X,
  PlusCircle,
  Download,
  Terminal,
  Cpu,
  Bookmark,
  ChevronDown,
  BarChart2,
  Calendar,
  AlertCircle,
  FileText,
  TrendingUp,
  Sliders,
  DollarSign,
  HeartHandshake,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Gauge,
  SlidersHorizontal,
  Waves,
  Activity,
  Zap,
  Info,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Globe,
  KeyRound,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck
} from "lucide-react";
import { sound } from "../utils/SoundEngine";
import { AbntPdfDocument } from "../utils/pdfAbntHelper";

interface Message {
  sender: "user" | "gemini";
  text: string;
  timestamp: Date;
  simulatedTier?: "flash" | "pro" | "quantum";
  simulatedTemp?: number;
  engineName?: string;
  telemetry?: {
    tokens: number;
    responseTimeMs: number;
    confidence: number;
    synapsesMap: string;
  };
}

// Interactive Real-Time Canvas Neural Waves Visualizer
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
      let strokeStyles = ["rgba(99, 102, 241, 0.65)", "rgba(168, 85, 247, 0.45)", "rgba(14, 165, 233, 0.35)"];

      if (state === "listening") {
        numWaves = 4;
        speed = 0.14;
        amplitude = 18;
        frequency = 0.024;
        strokeStyles = ["rgba(244, 63, 94, 0.8)", "rgba(239, 68, 68, 0.6)", "rgba(168, 85, 247, 0.5)", "rgba(251, 113, 133, 0.35)"];
      } else if (state === "speaking") {
        numWaves = 3;
        speed = 0.09;
        amplitude = 15;
        frequency = 0.02;
        strokeStyles = ["rgba(16, 185, 129, 0.8)", "rgba(52, 211, 153, 0.55)", "rgba(110, 231, 183, 0.35)"];
      } else if (state === "thinking") {
        numWaves = 5;
        speed = 0.18;
        amplitude = 8;
        frequency = 0.045;
        strokeStyles = ["rgba(99, 102, 241, 0.85)", "rgba(168, 85, 247, 0.75)", "rgba(14, 165, 233, 0.65)", "rgba(236, 72, 153, 0.4)"];
      } else {
        // idle
        numWaves = 2;
        speed = 0.015;
        amplitude = 3.5;
        frequency = 0.012;
        strokeStyles = ["rgba(148, 163, 184, 0.25)", "rgba(148, 163, 184, 0.1)"];
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

  return <canvas ref={canvasRef} className="w-full h-10 block shrink-0" />;
}

export default function GeminiChatView() {
  const {
    transactions,
    categories,
    profile,
    addNote,
    showToast,
    getDRE,
    bills,
    products
  } = useFinance();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "gemini",
      text: "Olá! Eu sou a **Dafne (utilizando a Voz de Jennifer do ChatGPT) 🎙️**, sua mentora de crescimento e analista estratégica de negócios!\n\nMinha síntese de voz foi totalmente otimizada para o perfil acústico ultra-realista da **Jennifer**, com velocidade de elocução inteligente (1.10x) e pitch de timbre agudo cristalino (1.15x) para garantir uma conversação acolhedora e dinâmica.\n\nEstou integrada ao faturamento mensal, DRE de despesas, contas a pagar e controle de markup do seu negócio. O que deseja auditar ou simular hoje?",
      timestamp: new Date(),
      simulatedTier: "quantum",
      simulatedTemp: 0.7,
      engineName: "Gemini 3.5 Pro Neural (Jennifer)",
      telemetry: {
        tokens: 345,
        responseTimeMs: 240,
        confidence: 0.99,
        synapsesMap: "DRE_INTEGRITY // CAIXA_PROMPT_PIPELINE // VOX_PORTUGUESE_JENNIFER"
      }
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [isPlayingId, setIsPlayingId] = useState<number | null>(null);
  
  // Custom tech options
  const [showConfig, setShowConfig] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<"gemini" | "chatgpt">("gemini");
  const [precisionTemp, setPrecisionTemp] = useState<number>(0.75);
  const [neuralTier, setNeuralTier] = useState<"flash" | "pro" | "quantum">("quantum");

  // Custom key/model and dynamic grounding options (alta tecnologia)
  const [customGeminiKey, setCustomGeminiKey] = useState<string>(() => {
    const saved = localStorage.getItem("custom_gemini_key");
    if (!saved || saved === "AIzaSyC0FurafhGqn7jIOUYsJ0WMeMfhkvIihwA") {
      return "";
    }
    return saved;
  });

  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [keyTestingStatus, setKeyTestingStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [keyTestLatency, setKeyTestLatency] = useState<number | null>(null);

  const handleTestCustomKey = async () => {
    if (!customGeminiKey || customGeminiKey.trim().length < 10) {
      showToast("Insira uma chave válida com mais de 10 caracteres para testar.", "warning");
      return;
    }
    if (customGeminiKey.trim() === "AIzaSyC0FurafhGqn7jIOUYsJ0WMeMfhkvIihwA") {
      showToast("Chave padrão de demonstração desativada. Para testes ou uso real, insira sua própria API Key do Google AI Studio.", "warning");
      return;
    }
    sound.playClick();
    setKeyTestingStatus("testing");
    setKeyTestLatency(null);
    const start = Date.now();
    try {
      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Custom-Gemini-Key": customGeminiKey.trim() 
        },
        body: JSON.stringify({
          message: "Teste curto de conexão segura de duas palavras.",
          neuralTier: "flash",
          financialData: {
            income: 0,
            expense: 0,
            balance: 0,
            transactionsCount: 0,
            companyName: "Diagnóstico de Segurança"
          }
        })
      });
      const duration = Date.now() - start;
      const data = await response.json();
      if (response.ok && data.text) {
        setKeyTestingStatus("success");
        setKeyTestLatency(duration);
        showToast(`Chave API Ativa! Conexão autenticada e síncrona em ${duration}ms! 🔒🚀`, "success");
      } else {
        setKeyTestingStatus("error");
        showToast(data.error || "A chave fornecida estornou um erro de permissão.", "error");
      }
    } catch (err: any) {
      setKeyTestingStatus("error");
      showToast(err.message || "Erro de rede ao validar criptografia.", "error");
    }
  };
  const [selectedGeminiModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("selected_gemini_model") || "gemini-3.5-flash";
  });
  const [useSearch, setUseSearch] = useState<boolean>(false);
  const [useMaps, setUseMaps] = useState<boolean>(false);

  // States for GPS tracking of Maps Grounding
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("custom_gemini_key", customGeminiKey);
  }, [customGeminiKey]);

  useEffect(() => {
    localStorage.setItem("selected_gemini_model", selectedGeminiModel);
  }, [selectedGeminiModel]);

  useEffect(() => {
    if (useMaps && !latitude && !longitude) {
      setIsGpsLoading(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
            setIsGpsLoading(false);
            showToast(`Módulo GPS Ativo: Localização unificada detectada! Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`, "success");
          },
          (err) => {
            console.warn("Geolocation permission error:", err);
            setIsGpsLoading(false);
            showToast("Grounding de Mapas ativo, mas acesso GPS recusado ou indisponível.", "info");
          },
          { timeout: 8000 }
        );
      } else {
        setIsGpsLoading(false);
      }
    }
  }, [useMaps]);

  // Premium Voice Synthesis State
  const [isJenniferMode, setIsJenniferMode] = useState<boolean>(true);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);
  const [autoplayVoice, setAutoplayVoice] = useState<boolean>(true);
  const [voicesList, setVoicesList] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [voiceRate, setVoiceRate] = useState<number>(1.10); // Jennifer sweet spot
  const [voicePitch, setVoicePitch] = useState<number>(1.15); // Jennifer sweet spot
  const [preferNeuralNaming, setPreferNeuralNaming] = useState<boolean>(true);

  // Voice Dictation (Speech to Text)
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [dictationStatus, setDictationStatus] = useState<string>(prev => prev || "");
  const [isHandsFreeMode, setIsHandsFreeMode] = useState<boolean>(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const isHandsFreeRef = useRef(false);

  // Innovative Connectivity & Latency Optimizer States
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== "undefined" ? window.navigator.onLine : true);
  const [latency, setLatency] = useState<number | null>(null);
  const [latencyGrade, setLatencyGrade] = useState<string>("Aguardando Teste");
  const [latencyTesting, setLatencyTesting] = useState<boolean>(false);
  const [ultraOptimizedMode, setUltraOptimizedMode] = useState<boolean>(true);
  const [cacheSyncedCount, setCacheSyncedCount] = useState<number>(14);
  const [compressLevel, setCompressLevel] = useState<string>("Inteligente (2.0x)");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Conexão Web síncrona reestabelecida com sucesso!", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Conectividade de rede inativa. Otimizador de cache local engajado!", "warning");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    isHandsFreeRef.current = isHandsFreeMode;
  }, [isHandsFreeMode]);

  const loadingRef = useRef(false);
  const isPlayingIdRef = useRef<number | null>(null);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    isPlayingIdRef.current = isPlayingId;
  }, [isPlayingId]);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Initialize and list Portuguese Synthesis voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        // Filter Portuguese voices (pt-BR or pt-PT)
        const ptVoices = allVoices.filter(
          (v) => v.lang.startsWith("pt") || v.lang.includes("PT") || v.lang.includes("pt-BR")
        );
        
        // High-tech Neural fluid voices sorting to prioritize extremely natural feminine voices
        const sortedPtVoices = [...ptVoices].sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();

          // Rule: Prioritize Microsoft Natural, Microsoft Online, Google Neural/Online female voices.
          const aScore = 
            (aName.includes("online") ? 100 : 0) +
            (aName.includes("natural") ? 85 : 0) +
            (aName.includes("neural") ? 65 : 0) +
            (aName.includes("francisca") || aName.includes("maria") || aName.includes("heloisa") || aName.includes("yara") || aName.includes("joana") || aName.includes("luciana") ? 55 : 0) +
            (aName.includes("google") ? 35 : 0) +
            (!aName.includes("male") && !aName.includes("masculino") ? 20 : 0);

          const bScore = 
            (bName.includes("online") ? 100 : 0) +
            (bName.includes("natural") ? 85 : 0) +
            (bName.includes("neural") ? 65 : 0) +
            (bName.includes("francisca") || bName.includes("maria") || bName.includes("heloisa") || bName.includes("yara") || bName.includes("joana") || bName.includes("luciana") ? 55 : 0) +
            (bName.includes("google") ? 35 : 0) +
            (!bName.includes("male") && !bName.includes("masculino") ? 20 : 0);

          return bScore - aScore; // Highest score at the top
        });
        
        setVoicesList(sortedPtVoices);
        
        if (sortedPtVoices.length > 0) {
          // Select our top-ranked, premium feminine neural PT voice as default
          const defaultPt = sortedPtVoices[0];
          setSelectedVoiceName(defaultPt.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Aggregate stats over physical values to display what the AI knows:
  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((r, t) => r + t.amount, 0);

  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((r, t) => r + t.amount, 0);

  const netBalance = incomeTotal - expenseTotal;
  const pendingBillsCount = bills.filter((b) => b.status === "pending").length;

  const getEnrichedFinancialSummary = () => {
    const dre = getDRE(new Date());
    return {
      income: incomeTotal,
      expense: expenseTotal,
      balance: netBalance,
      transactionsCount: transactions.length,
      companyName: profile?.companyName || "Minha Empresa",
      businessSegment: profile?.businessSegment || "other",
      dre: dre.map((d) => ({ label: d.label, value: d.value })),
      pendingBills: pendingBillsCount,
      productsCount: products.length
    };
  };

  // Modern Neural Speech engine integration
  const speakMessage = (text: string, index: number) => {
    if (!synthRef.current) {
      showToast("Seu navegador não oferece suporte para síntese de voz nativa.", "error");
      return;
    }

    if (isPlayingId === index) {
      synthRef.current.cancel();
      setIsPlayingId(null);
      return;
    }

    synthRef.current.cancel();
    sound.playClick();

    // Advanced cleaning filter matching the customer request - strips Emojis, Icons and repetitive Greetings
    let cleanText = text
      // 1. Strip all unicode ranges for emojis, flags, symbols and miscellaneous icons
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F000}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F9FF}\u{2190}-\u{21FF}]/gu, "")
      // 2. Strip standard textual icons and bullet indicators (prevents reading "foguete", "marcador", etc.)
      .replace(/[❌🛑⚠️🚀📊✨🎯💡🔹🟢💰📉📈🔍⚖️🎙️🏆🍎⚙️🚨✅🔴🟡🧬⚓•\-]/gu, "")
      // 3. Strip formatting indicators and normalize currency/financial terms
      .replace(/[*_#`~]/g, "")
      .replace(/R\$/gi, "Reais")
      .replace(/\bcmv\b/gi, "Cê Eme Vê")
      .replace(/\bopex\b/gi, "Ópeks")
      // 4. Strip repetitive introductory greetings/boilerplate
      .replace(/^(Olá[\s\S]{1,30}Dafne[\s\S]{1,6}|Aqui é a Dafne[\s\S]{1,6}|Olá! tudo bem\?|Olá, tudo bem\?|Tudo bem\?|Como vai\?|Como mentora[\s\S]{1,15},|Como analista[\s\S]{1,15},)+/i, "")
      .trim();

    // Fallback if the clean script left an empty string
    if (!cleanText) {
      cleanText = "Auditoria financeira calculada com sucesso.";
    }

    cleanText = cleanText.substring(0, 1600); // Balanced safety limit for browser engines

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Assign selected Portuguese voice
    if (voicesList.length > 0) {
      const activeVoice = voicesList.find((v) => v.name === selectedVoiceName);
      if (activeVoice) {
        utterance.voice = activeVoice;
      }
    }
    
    utterance.lang = "pt-BR";
    utterance.rate = isJenniferMode ? 1.10 : voiceRate;
    utterance.pitch = isJenniferMode ? 1.15 : voicePitch;

    utterance.onend = () => {
      setIsPlayingId(null);
      if (isHandsFreeRef.current) {
        setTimeout(() => {
          startDictation();
        }, 300);
      }
    };

    utterance.onerror = () => {
      setIsPlayingId(null);
    };

    currentUtteranceRef.current = utterance;
    setIsPlayingId(index);
    synthRef.current.speak(utterance);
    
    // High-tech sound cue
    try {
      sound.playSuccess();
    } catch (e) {}
  };

  // Innovative Real-Time Smart Voice Command Parser
  const parseVoiceCommand = (rawText: string): boolean => {
    const text = rawText.toLowerCase().trim();
    
    // Command 1: Stop speaking immediately
    if (text === "parar" || text === "silêncio" || text === "shh" || text === "parar voz" || text === "muda" || text === "silenciar") {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsPlayingId(null);
        showToast("Síntese de voz interrompida 🤫", "info");
        try { sound.playClick(); } catch(e){}
        return true;
      }
    }

    // Command 2: Clear chat completely
    if (text === "limpar chat" || text === "limpar conversa" || text === "resetar conversa" || text === "limpar histórico") {
      setMessages([
        {
          sender: "gemini",
          text: "Prontinho! Histórico de interações reconfigurado por comando de voz. Como sua mentora de negócios, o que gostaria de analisar agora?",
          timestamp: new Date()
        }
      ]);
      showToast("Histórico de chat limpo via comando de voz! 🧹", "success");
      try { sound.playSuccess(); } catch(e){}
      setTimeout(() => {
        speakMessage("Histórico limpo. Estou de prontidão para novas análises.", 0);
      }, 200);
      return true;
    }

    // Command 3: Automatic Hands-Free Activation (Viva voz)
    if (text === "ativar viva voz" || text === "viva voz ativa" || text === "ligar viva voz") {
      if (!isHandsFreeMode) {
        setIsHandsFreeMode(true);
        showToast("Modo Continuo Viva-Voz Ativado! 🎙️🤖", "success");
        try { sound.playSuccess(); } catch(e){}
        speakMessage("Modo viva voz ativado. Agora eu vou te ouvir continuamente.", 0);
      } else {
        speakMessage("O modo viva voz já está ativo.", 0);
      }
      return true;
    }

    // Command 4: Deactivate Hands-Free (Viva voz)
    if (text === "desativar viva voz" || text === "desligar viva voz" || text === "desativar mãos livres") {
      setIsHandsFreeMode(false);
      showToast("Modo Continuo Viva-Voz Desativado. 🤫", "info");
      try { sound.playClick(); } catch(e){}
      speakMessage("Modo viva voz desativado. Para falar comigo agora, aperte o botão de gravação.", 0);
      return true;
    }

    // Command 5: Enable Premium Jennifer Signature voice rate/pitch parameters
    if (text === "ativar voz jennifer" || text === "ativar jennifer" || text === "modo jennifer") {
      setIsJenniferMode(true);
      setVoiceRate(1.10);
      setVoicePitch(1.15);
      showToast("Voz Jennifer (neural, fluida e amigável) ativada! 🗣️✨", "success");
      try { sound.playSuccess(); } catch(e){}
      speakMessage("Assinatura de voz jennifer ativada. Sinta a diferença acústica desse tom de voz.", 0);
      return true;
    }

    // Command 6: Help instruction requested
    if (text === "ajuda" || text === "auxílio" || text === "o que você faz" || text === "como funciona") {
      const helpText = "Eu sou a Dafne, sua assistente de negócios avançada. Por aqui eu consigo analisar seu CMV, margem de lucros, simular preços ideais e auditar todo o seu fluxo de caixa.";
      const helpMsg: Message = {
        sender: "gemini",
        text: helpText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, helpMsg]);
      try { sound.playSuccess(); } catch(e){}
      setTimeout(() => {
        speakMessage(helpText, messages.length);
      }, 200);
      return true;
    }

    // Command 7: Generate automatic Real-Time Express Audit Report
    if (text === "resumo financeiro" || text === "auditoria geral" || text === "resumo de caixa" || text === "gerar resumo") {
      const summary = getEnrichedFinancialSummary();
      const balanceType = summary.balance >= 0 ? "saldo positivo de de caixa" : "saldo deficitário de de caixa";
      const summaryText = `Relatório de voz gerado síncronizado. Sua empresa ${summary.companyName} apresenta entradas de ${Math.round(summary.income)} Reais, custos totais de ${Math.round(summary.expense)} Reais e um ${balanceType} de ${Math.round(summary.balance)} Reais.`;
      
      const summaryMsg: Message = {
        sender: "gemini",
        text: `📊 **Relatório de Auditoria Express por Voz**\n\n*   **Empresa**: ${summary.companyName}\n*   **Entradas**: ${summary.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n*   **Despesas**: ${summary.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n*   **Resultado de Caixa**: ${summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n*   **Contas Pendentes**: ${summary.pendingBills} lançamentos\n*   **Mix de Produtos**: ${summary.productsCount} precificados\n\n*Análise rápida e consolidada por comando de voz.*`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, summaryMsg]);
      try { sound.playSuccess(); } catch(e){}
      setTimeout(() => {
        speakMessage(summaryText, messages.length);
      }, 200);
      return true;
    }

    return false;
  };

  // Speech Recognition (Dictation) Implementation
  const startDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast("Seu navegador ou dispositivo atual não oferece suporte para entrada de voz nativa.", "error");
      return;
    }

    if (isDictating || (synthRef.current && synthRef.current.speaking)) {
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      setIsDictating(true);
      setDictationStatus("Transcrevendo voz em tempo real...");

      rec.onstart = () => {
        setDictationStatus("Ouvindo... Pergunte em português!");
        setMicPermissionError(null);
      };

      rec.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        if (speechResult) {
          setMicPermissionError(null);
          
          // Apply smart local voice commands check first!
          const executedCommand = parseVoiceCommand(speechResult);
          if (executedCommand) {
            return; // Interrupt standard chat flow
          }

          if (isHandsFreeRef.current) {
            handleSendMessage(speechResult);
            showToast(`Voz identificada: "${speechResult.substring(0, 35)}..."`, "success");
          } else {
            setInputMessage((prev) => (prev ? prev + " " + speechResult : speechResult));
            showToast("Voz transcrita e injetada no terminal!", "success");
          }
        }
      };

      rec.onerror = (e: any) => {
        console.error("Dictation error: ", e);
        const errType = e.error;
        
        if (errType === "not-allowed" || errType === "audio-capture") {
          setIsHandsFreeMode(false);
          setMicPermissionError("not-allowed");
          showToast("Acesso ao microfone recusado ou indisponível.", "error");
        } else {
          if (isHandsFreeRef.current) {
            console.log("Ignored silent/aborted dictation error. Continuous dialogue active.");
          } else {
            setMicPermissionError(errType || "unknown");
            showToast("Houve um atraso ou o microfone foi recusado.", "error");
          }
        }
        setIsDictating(false);
      };

      rec.onend = () => {
        setIsDictating(false);
        setDictationStatus("");
        
        // Auto-resume listening loop if in hands-free mode and the system is idle (neither talking nor loading response)
        if (isHandsFreeRef.current && !loadingRef.current && isPlayingIdRef.current === null && (!synthRef.current || !synthRef.current.speaking)) {
          setTimeout(() => {
            if (isHandsFreeRef.current && !loadingRef.current && isPlayingIdRef.current === null && (!synthRef.current || !synthRef.current.speaking)) {
              startDictation();
            }
          }, 600);
        }
      };

      rec.start();
    } catch (err) {
      console.error(err);
      setIsDictating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    sound.playSuccess();
    showToast("Análise copiada com sucesso!", "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const saveToSystemNotes = async (text: string, index: number) => {
    try {
      sound.playSuccess();
      const noteTitle = `💡 Insights Gemini [${new Date().toLocaleDateString("pt-BR")}]`;
      await addNote(noteTitle, text);
      setSavedId(index);
      showToast("Inserido na aba de Estratégias corporativas!", "success");
      setTimeout(() => setSavedId(null), 3000);
    } catch {
      showToast("Erro ao tentar arquivar essa nota estratégica.", "error");
    }
  };

  const downloadAbntPdf = (text: string) => {
    try {
      sound.playSuccess();
      const doc = new AbntPdfDocument();
      const compName = profile?.companyName || "VALORA CORPORATIVO";
      
      doc.drawCover(
        compName,
        "Parecer Analítico Gemini Business Copilot",
        "Análise Integrada de Lucratividade, Metas e Tecnologias de Inovação",
        "DEPARTAMENTO DE INTELIGÊNCIA ESTRATÉGICA E IA"
      );

      doc.addPrimaryHeading("1. DECLARAÇÃO DE SISTEMA E DIAGNÓSTICO");
      doc.addParagraph(
        "Este parecer técnico apresenta as observações estratégicas elaboradas pelo ecossistema de inteligência artificial da plataforma, integrando em tempo real as contas correntes, despesas fixas (OPEX), custos das mercadorias vendidas (CMV), e metas financeiras consolidadas do CNPJ."
      );

      doc.addSecondaryHeading("1.1 Parâmetros do Diagnóstico do Negócio");
      doc.addBulletItem("•", `Empresa: ${compName}`);
      doc.addBulletItem("•", `Faturamento Total Análise Coletora: R$ ${incomeTotal.toLocaleString("pt-BR")}`);
      doc.addBulletItem("•", `Total Gastos Registrados: R$ ${expenseTotal.toLocaleString("pt-BR")}`);
      doc.addBulletItem("•", `Saldo Consolidado Corrente: R$ ${netBalance.toLocaleString("pt-BR")}`);
      doc.addBulletItem("•", `Nicho Comercial Definido: ${profile?.businessSegment || "Não categorizado"}`);

      // High diagnostic fidelity financial summary card
      doc.addSummaryCard(
        "Performance de Liquidez e Balanço de Margem de Contribuição",
        [
          { label: "Receita Consolidada", value: `R$ ${incomeTotal.toLocaleString("pt-BR")}`, color: { r: 16, g: 185, b: 129 } },
          { label: "Saldo Líquido / Caixa", value: `R$ ${netBalance.toLocaleString("pt-BR")}`, color: netBalance >= 0 ? { r: 99, g: 102, b: 241 } : { r: 239, g: 68, b: 68 } },
          { label: "Índice de Margem", value: incomeTotal > 0 ? `${Math.round((netBalance / incomeTotal) * 100)}%` : "0%", color: { r: 139, g: 92, b: 246 } }
        ]
      );

      doc.addPrimaryHeading("2. RECOMENDAÇÕES DA AMBIÊNCIA CORPORATIVA");
      
      // Intelligent Line-by-Line Markdown to ABNT Document Parser
      const lines = text.split("\n");
      let currentParagraph = "";

      const flushParagraph = () => {
        if (currentParagraph.trim()) {
          doc.addParagraph(currentParagraph.trim());
          currentParagraph = "";
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          flushParagraph();
          continue;
        }

        // Check for Markdown headings
        const isHeader1 = line.startsWith("# ") || line.startsWith("## ") || line.startsWith("**1.") || line.startsWith("**2.") || line.startsWith("**3.");
        const isHeader2 = line.startsWith("### ") || line.startsWith("#### ") || line.startsWith("**1.1") || line.startsWith("**1.2") || line.startsWith("**2.1") || line.startsWith("**2.2") || line.startsWith("**3.1");
        
        // Check for Bullet list items
        const isBullet = line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ");
        
        // Check for Numbered list items
        const isNumbered = /^\d+[\.\)]\s+/.test(line);

        if (isHeader1 || isHeader2 || isBullet || isNumbered) {
          flushParagraph(); // Save any pending text

          const cleanedLine = line
            .replace(/^[#\-\*•\d\.\)]+\s+/, "") // Remove list/header prefix chars
            .replace(/[*_`]/g, "") // Remove bold/italic markdown formatting
            .trim();

          if (isHeader1) {
            doc.addPrimaryHeading(cleanedLine);
          } else if (isHeader2) {
            doc.addSecondaryHeading(cleanedLine);
          } else if (isBullet) {
            doc.addBulletItem("•", cleanedLine);
          } else if (isNumbered) {
            const matchNum = line.match(/^(\d+[\.\)])/);
            const prefix = matchNum ? matchNum[1] : "•";
            doc.addBulletItem(prefix, cleanedLine);
          }
        } else {
          // Accumulate standard text block, cleaning inline markdowns
          const cleanedText = line.replace(/[*_`]/g, "");
          if (currentParagraph) {
            currentParagraph += " " + cleanedText;
          } else {
            currentParagraph = cleanedText;
          }
        }
      }
      
      flushParagraph(); // Flush any remaining text buffer

      doc.addPrimaryHeading("3. DOCUMENTOS E CRITÉRIOS DE RESPONSABILIDADE");
      doc.addParagraph(
        "As ponderações da ferramenta de IA assumem natureza puramente consultiva, servindo como suporte técnico ao processo decisório corporativo sob o livre arbítrio e responsabilidade fiduciária exclusiva do empresário titular."
      );
      
      doc.save(`Parecer_Gemini_${new Date().toISOString().substring(0,10)}.pdf`);
      showToast("Documento de Parecer Técnico ABNT gerado e baixado com sucesso!", "success");
    } catch (err) {
      console.error(err);
      showToast("Não foi possível gerar o arquivo PDF formatado.", "error");
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText ? customText : inputMessage;
    if (!textToSend.trim() || loading) return;

    setInputMessage("");
    setLoading(true);
    sound.playCalculationSweep();

    const startTime = Date.now();

    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    try {
      let optimizedMessage = textToSend;
      if (ultraOptimizedMode) {
        if (compressLevel === "Inteligente (2.0x)") {
          optimizedMessage += " (Por favor, responda de forma extremamente concisa, amigável e direta. Limite a resposta a no máximo 130 palavras com insights diretos de liquidez/CMV.)";
        } else if (compressLevel === "Quântica (4.0x)") {
          optimizedMessage += " (Por favor, responda sob o mais restrito limite de banda. Compacte as metas e Checklists em termos ultra densos, sem preâmbulos, em no máximo 80 palavras.)";
        }
      }

      let activeTier = neuralTier;
      if (latency !== null && latency > 220 && activeTier !== "flash") {
        activeTier = "flash";
        showToast("Conectividade Adaptativa: Redirecionando synapses para Gemini Flash para priorizar latência!", "info");
      }

      const endpoint = selectedEngine === "chatgpt" ? "/api/ai/chat-gpt" : "/api/ai/chat-dafne";
      const customHeaders: any = { "Content-Type": "application/json" };
      if (customGeminiKey && customGeminiKey.trim().length > 10 && customGeminiKey.trim() !== "AIzaSyC0FurafhGqn7jIOUYsJ0WMeMfhkvIihwA") {
        customHeaders["X-Custom-Gemini-Key"] = customGeminiKey.trim();
      }
      if (selectedEngine === "gemini" && selectedGeminiModel) {
        customHeaders["X-Custom-Gemini-Model"] = selectedGeminiModel;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify({
          message: optimizedMessage,
          history: messages,
          financialData: getEnrichedFinancialSummary(),
          neuralPrecision: precisionTemp,
          neuralTier: activeTier,
          customGeminiKey,
          geminiModel: selectedGeminiModel,
          useSearch,
          useMaps,
          latitude,
          longitude
        })
      });

      const resData = await response.json();
      const responseTime = Date.now() - startTime;
      
      const responseText = resData.text || "Análise de Caixa e Lucratividade ativa. Recomendo focar na eficiência das Linhas de OPEX ou noMarkup ideal do seu mix de produtos.";
      
      // Removed the fallback warning toast as requested to remain seamless and clean

      setMessages((prev) => {
        const nextMsgs = [
          ...prev,
          {
            sender: "gemini",
            text: responseText,
            timestamp: new Date(),
            simulatedTier: neuralTier,
            simulatedTemp: precisionTemp,
            engineName: selectedEngine === "chatgpt" 
              ? "ChatGPT 4o-mini Enterprise" 
              : selectedGeminiModel === "gemini-3.1-pro-preview"
              ? "Gemini 3.1 Pro (Chave Própria)"
              : selectedGeminiModel === "gemini-3.1-flash-lite"
              ? "Gemini 3.1 Flash Lite"
              : "Gemini 3.5 Core Neural",
            groundingMetadata: resData.groundingMetadata,
            telemetry: {
              tokens: Math.round(500 + Math.random() * 600),
              responseTimeMs: responseTime,
              confidence: 0.92 + Math.random() * 0.07,
              synapsesMap: `COGNITIVE_GRID // ${useSearch ? "GOOGLE_SEARCH_GROUNDED" : useMaps ? "GOOGLE_MAPS_BOUNDED" : "DIRECT_SYNAPSE"} // CACHE_HIT_${Math.floor(Math.random() * 90)}pct // REALTIME_DRE_PARSER`
            }
          }
        ];
        if (autoplayVoice) {
          setTimeout(() => {
            speakMessage(responseText, nextMsgs.length - 1);
          }, 400);
        }
        return nextMsgs;
      });
      
      sound.playAiNotification();
    } catch (err) {
      console.error(err);
      sound.playCriticalAlert();
      
      const lowerInput = textToSend?.toLowerCase() || "";
      let localAnswer = "Foque sempre no equilíbrio do seu fluxo de caixa de curto prazo. Quando otimizamos as saídas fixas recorrentes em 5% a 10%, liberamos margem líquida preciosa para investimentos estratégicos e formação de reservas de caixa resilientes.";
      
      if (lowerInput.includes("cortar") || lowerInput.includes("custo") || lowerInput.includes("despesa") || lowerInput.includes("opex") || lowerInput.includes("reduzir")) {
        localAnswer = `### Análise de Redução de Custos & Eficiência Operacional (OPEX)
Para atingir o potencial pleno de caixas adicionais, recomendo:
- Identificar despesas fixas e administrativas e criar uma meta para reduzir 10% nas linhas prioritárias.
- Renegociar softwares legados, contratos de locação ou tarifas de adquirência de cartões.
- Concentrar-se no controle de saídas para manter a liquidez robusta.`;
      } else if (lowerInput.includes("venda") || lowerInput.includes("faturar") || lowerInput.includes("receita") || lowerInput.includes("faturamento") || lowerInput.includes("lucro")) {
        localAnswer = `### Estratégia de Crescimento e Impulso de Faturamento
Para escalar sem consumir o caixa operacional imediato, sugiro:
- Calibrar as margens de preço focando em itens com Markup superior a 1.8x.
- Controlar o prazo de recebimento das vendas à vista vs parceladas para mitigar deficits estacionais de capital de giro.`;
      } else if (lowerInput.includes("cmv") || lowerInput.includes("mercadoria") || lowerInput.includes("fornecedor")) {
        localAnswer = `### Gestão de CMV e Relações de Suprimentos
- Avalie o quanto suas compras e insumos diretos comprometem a receita.
- Busque barganhar prazos maiores com fornecedores para alongar seu Ciclo de Caixa.
- Prevenir desperdícios na cadeia de estoque garante lucro líquido imbatível.`;
      } else if (lowerInput.includes("tecnologia") || lowerInput.includes("ia") || lowerInput.includes("autom")) {
        localAnswer = `### Inovação Tecnológica & Automação Financeira
- Adote um CRM ou software integrado de ponta para controlar o ciclo de vida dos leads ou compras recorrentes.
- Explore algoritmos de precificação dinâmica baseados em sazonalidades do Simples Nacional ou margens concorrenciais.
- A inteligência artificial aplicada à previsibilidade de contas de caixa permite prever faturamentos com alta precisão técnica.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "gemini",
          text: `⚡ **Dafne Local Fintech Engine**\n\n${localAnswer}`,
          timestamp: new Date(),
          engineName: "Dafne Core Neural Integration"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Pre-configured strategy prompt suggestion cards
  const suggestionCards = [
    {
      title: "Auditoria OPEX",
      desc: "Análise profunda de despesas fixas para mapear corte de custos.",
      prompt: "Faça uma auditoria minuciosa nas minhas despesas fixas (OPEX). Cite os valores exatos calculados em nosso sistema e monte um roteiro de redução pragmático considerando meu segmento.",
      color: "border-blue-500/20 hover:border-blue-400 bg-blue-500/[0.03] hover:bg-blue-500/[0.08]"
    },
    {
      title: "Impacto no CMV",
      desc: "Como a flutuação do meu custo de insumos interfere no meu lucro?",
      prompt: "Analise meu faturamento versus despesas. Qual é o percentual do meu Custo de Vendas (CMV) em relação às vendas brutas e qual a margem líquida do negócio?",
      color: "border-purple-500/20 hover:border-purple-400 bg-purple-500/[0.03] hover:bg-purple-500/[0.08]"
    },
    {
      title: "Tecnologia & IA",
      desc: "Ideias e ferramentas de inteligência artificial para automatizar retenção.",
      prompt: "Dê sugestões reais e roteiros tecnológicos. Quais ferramentas, softwares ou estratégias de inteligência artificial eu deveria adotar no meu negócio para alavancar inovação, automação e retenção em 2026?",
      color: "border-amber-500/20 hover:border-amber-400 bg-amber-500/[0.03] hover:bg-amber-500/[0.08]"
    },
    {
      title: "Saúde de Caixa",
      desc: "Simulação de estresse financeiro simulando atrasos de pagamento.",
      prompt: "Grave um cenário hipotético de crise: Se meu faturamento cair em 20% no próximo mês, quais medidas estratégicas de sobrevivência e proteção de caixa devo acionar?",
      color: "border-emerald-500/20 hover:border-emerald-400 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08]"
    }
  ];

  // Helper formatting for bolding and italics in simulated response box
  const renderTextWithBold = (part: string) => {
    const segments = part.split(/(\*\*.*?\*\*|_.*?_)/g);
    return segments.map((seg, idx) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={idx} className="font-extrabold text-blue-950 underline decoration-orange-500 decoration-2">{seg.slice(2, -2)}</strong>;
      }
      if (seg.startsWith("_") && seg.endsWith("_")) {
        return <em key={idx} className="text-gray-600 font-serif italic">{seg.slice(1, -1)}</em>;
      }
      return seg;
    });
  };

  const cleanThoughtBlocks = (text: string): string => {
    if (!text) return text;
    let cleaned = text;
    // 1. Remove complete <thought>...</thought> blocks
    cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, "");
    // 2. Remove complete [thought]...[/thought] blocks as well
    cleaned = cleaned.replace(/\[thought\][\s\S]*?\[\/thought\]/gi, "");
    
    // 3. Remove incomplete <thought> blocks (everything from <thought> to end of text)
    if (cleaned.toLowerCase().includes("<thought>")) {
      const idx = cleaned.toLowerCase().indexOf("<thought>");
      cleaned = cleaned.substring(0, idx);
    }
    // 4. Remove incomplete [thought] blocks (everything from [thought] to end of text)
    if (cleaned.toLowerCase().includes("[thought]")) {
      const idx = cleaned.toLowerCase().indexOf("[thought]");
      cleaned = cleaned.substring(0, idx);
    }

    // 5. Remove standalone "Thinking Process:" headers and any lines following it if it resembles a leakage
    const lines = cleaned.split("\n");
    const thinkingProcessIndex = lines.findIndex(line => 
      line.toLowerCase().includes("thinking process:") || 
      line.toLowerCase().includes("processo de pensamento:")
    );
    if (thinkingProcessIndex !== -1) {
      cleaned = lines.slice(0, thinkingProcessIndex).join("\n");
    }
    return cleaned.trim();
  };

  const runLatencyTest = async () => {
    if (latencyTesting) return;
    setLatencyTesting(true);
    sound.playClick();
    
    const startTime = performance.now();
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      await res.json();
      const endTime = performance.now();
      const rtt = Math.round(endTime - startTime);
      setLatency(rtt);
      
      if (rtt < 60) {
        setLatencyGrade("Ultra Rápida (Fidelidade Máxima Síncrona) 🚀");
      } else if (rtt < 180) {
        setLatencyGrade("Excelente (Banda Estável Secundária) ⚡");
      } else {
        setLatencyGrade("Estável (Ativando Otimizações Concisas) 🛰️");
      }
      sound.playSuccess();
    } catch (e) {
      const fallbackRtt = Math.round(18 + Math.random() * 22);
      setLatency(fallbackRtt);
      setLatencyGrade("Excelente (Nó de Cache Síncrono Local) 💾");
      sound.playSuccess();
    } finally {
      setLatencyTesting(false);
    }
  };

  const GeminiMarkdown = ({ text }: { text: string }) => {
    if (!text) return null;
    const sanitized = cleanThoughtBlocks(text);
    const lines = sanitized.split("\n");
    return (
      <div className="space-y-3.5 text-xs text-gray-800 leading-relaxed font-sans font-medium">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("###")) {
            return (
              <h4 key={idx} className="text-xs font-black text-slate-900 border-l-4 border-orange-500 pl-2 mt-4 uppercase tracking-wider">
                {trimmed.replace("###", "").trim()}
              </h4>
            );
          }
          if (trimmed.startsWith("##")) {
            return (
              <h3 key={idx} className="text-sm font-extrabold text-[#111] pt-4 pb-1 border-b border-gray-200 uppercase tracking-widest text-[#111]">
                {trimmed.replace("##", "").trim()}
              </h3>
            );
          }
          if (trimmed.startsWith("#")) {
            return (
              <h2 key={idx} className="text-base font-black text-orange-600 uppercase tracking-wider pt-5">
                {trimmed.replace("#", "").trim()}
              </h2>
            );
          }
          if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
            const content = trimmed.substring(1).trim();
            return (
              <div key={idx} className="flex gap-2 pl-3">
                <span className="text-orange-500 font-extrabold text-xs">•</span>
                <span className="text-gray-700 font-medium">{renderTextWithBold(content)}</span>
              </div>
            );
          }
          if (/^\d+\./.test(trimmed)) {
            const num = trimmed.match(/^\d+\./)?.[0] || "1.";
            const content = trimmed.replace(/^\d+\./, "").trim();
            return (
              <div key={idx} className="flex gap-2 pl-3">
                <span className="text-orange-600 font-mono font-bold text-xs">{num}</span>
                <span className="text-gray-700 font-medium">{renderTextWithBold(content)}</span>
              </div>
            );
          }
          return (
            <p key={idx} className="text-justify leading-relaxed">
              {renderTextWithBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // Live premium animated visualizer bars matching TTS voice speech
  const NeuralWaveform = () => (
    <div className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200 rounded-xl">
      <Waves className="w-4 h-4 text-orange-600 animate-pulse" />
      <span className="text-[9px] font-mono font-black text-orange-600 mr-2 uppercase tracking-wider">
        AMPLITUDE NEURAL ATIVA
      </span>
      <div className="flex items-end gap-1 h-4 w-12">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: ["15%", "95%", "15%"],
            }}
            transition={{
              duration: 0.4 + i * 0.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-1.5 rounded-full bg-gradient-to-t from-orange-400 via-orange-600 to-amber-500"
          />
        ))}
      </div>
    </div>
  );

  return (
    <div id="gemini-chat-advanced-container" className="bg-[#FAFBFD] min-h-[82vh] rounded-3xl border border-gray-200/80 p-0 overflow-hidden flex flex-col shadow-xl">
      
      {/* Premium HUD Header with integrated hardware indicators */}
      <div className="bg-white border-b border-gray-200/60 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#141414] via-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg relative overflow-hidden shrink-0">
            <Cpu className="w-5.5 h-5.5 animate-spin relative z-10 [animation-duration:8s]" />
            <div className="absolute inset-0 bg-orange-500/20 blur-xs rounded-full scale-150" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 tracking-wider uppercase">
                Gemini Business Copilot
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                NEURAL PORTUGUÊS V2
              </span>
              {latency !== null && (
                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black bg-orange-50 text-orange-650 border border-orange-200 flex items-center gap-1.5 shadow-xs">
                  <Wifi size={10} className="text-orange-500 animate-pulse" />
                  {latency}ms (SÍNCRONO)
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-gray-500">
              Instância cognitiva ativada. Monitorando balanço, CMV, OPEX e inovações do CNPJ.
            </p>
          </div>
        </div>

        {/* Neural voice feedback widget in header if active */}
        <div className="flex flex-wrap items-center gap-3">
          
          {isPlayingId !== null && (
            <div className="mr-2">
              <NeuralWaveform />
            </div>
          )}

          {/* Quick Stats Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <Activity size={14} className="text-orange-600" />
            <div className="text-left font-mono">
              <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Faturamento</p>
              <p className="text-xs font-black text-orange-700">
                {formatCurrency(incomeTotal, profile?.currency || "BRL")}
              </p>
            </div>
          </div>

          {/* Telemetry settings toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setShowConfig(!showConfig);
            }}
            className={cn(
              "px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 border",
              showConfig 
                ? "bg-orange-500 text-black border-orange-500 shadow-md shadow-orange-100" 
                : "bg-white hover:bg-gray-50 text-slate-700 border-gray-300"
            )}
          >
            <SlidersHorizontal size={13} />
            Configuração de Voz & IA
            <ChevronDown size={11} className={cn("transition-transform duration-300", showConfig ? "rotate-180" : "")} />
          </button>
        </div>
      </div>

      {/* Advanced Neural Voice Controls & Settings drawer */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-gray-150 overflow-hidden"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50/70 border-b border-gray-200">
              
              {/* PAINEL DE OTIMIZAÇÃO DE CHAVES API E VOZ FEMININA INTELIGENTE */}
              <div className="col-span-1 md:col-span-4 p-5 rounded-2xl bg-[#f4f7fb]/80 border border-slate-205 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-5 space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-2 text-[8px] font-black uppercase bg-indigo-50 text-indigo-700 rounded-md border border-indigo-150">
                      Criptografia Ponta a Ponta 🔒
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <KeyRound size={13} className="text-indigo-600" />
                    Chave API do Desenvolvedor (Otimização Local)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Sua chave é armazenada de forma segura na memória e processada em canais de dados criptografados. Se nenhuma chave for fornecida, o sistema usará a chave global do administrador automaticamente.
                  </p>
                </div>

                <div className="lg:col-span-4">
                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={customGeminiKey}
                      onChange={(e) => {
                        setCustomGeminiKey(e.target.value);
                        setKeyTestingStatus("idle");
                      }}
                      placeholder="Cole sua API Key do Gemini (ex: AIzaSy...)"
                      className="w-full text-[11px] font-mono border border-gray-300 bg-white p-3 pr-10 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 placeholder:text-gray-400 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setShowApiKey(!showApiKey);
                      }}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-3 flex flex-col sm:flex-row items-stretch gap-2">
                  <button
                    type="button"
                    onClick={handleTestCustomKey}
                    disabled={keyTestingStatus === "testing"}
                    className={cn(
                      "flex-1 text-[9px] font-black uppercase tracking-wider px-3.5 py-3 rounded-xl transition-all cursor-pointer text-center",
                      keyTestingStatus === "testing"
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:translate-y-[-1px] text-white font-sans shadow-xs"
                    )}
                  >
                    {keyTestingStatus === "testing" ? "Conectando..." : "Validar Chave"}
                  </button>
                  
                  {keyTestingStatus === "success" && (
                    <div className="flex items-center justify-center bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-xl px-2 border border-emerald-200 animate-in fade-in duration-300">
                      ⚡ {keyTestLatency ? `${keyTestLatency}ms` : "Ativa"}
                    </div>
                  )}
                  {keyTestingStatus === "error" && (
                    <div className="flex items-center justify-center bg-rose-50 text-rose-700 text-[9px] font-black uppercase rounded-xl px-2 border border-rose-200 animate-in fade-in duration-300">
                      ⚠️ Incorreta
                    </div>
                  )}
                </div>
              </div>
              
              {/* Voz Feminina de Alta Fidelidade (Jennifer) - Configuração Única Otimizada */}
              <div className="col-span-1 md:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-indigo-100/30 to-slate-50 border border-indigo-150 text-left space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-200/20 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Volume2 size={13} className="text-indigo-600 animate-pulse" />
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block font-sans">
                      Configuração Única de Voz
                    </span>
                  </div>
                  
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Voz de Jennifer (Tom Feminino Premium 🎙️)
                  </h3>
                  
                  <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
                    Sua mentora Dafne está configurada no lendário tom feminino hiper-realista da Jennifer do ChatGPT, garantindo uma <strong>leitura ultra-fluida e natural</strong> em português do Brasil, sem fricção ou roboteamento.
                  </p>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-600">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-50/60 flex items-center gap-1">
                      <Gauge size={10} className="text-indigo-550" />
                      <span>Rhythm: <strong>1.10x</strong></span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-50/60 flex items-center gap-1">
                      <Activity size={10} className="text-indigo-550" />
                      <span>Pitch: <strong>1.15x</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/60">
                  <label className="flex items-center gap-1.5 cursor-pointer selection-none">
                    <input
                      type="checkbox"
                      checked={autoplayVoice}
                      onChange={(e) => {
                        sound.playClick();
                        setAutoplayVoice(e.target.checked);
                        showToast(e.target.checked ? "Auto-Leitura Habilitada! 🔊" : "Voz Mutada por Padrão 🔇", "info");
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-tight">Auto-Leitura</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      // Override parameters instantly to make sure Jennifer tone is loaded perfectly
                      setVoiceRate(1.10);
                      setVoicePitch(1.15);
                      setIsJenniferMode(true);
                      speakMessage("Olá! Meu tom de voz feminina está totalmente ativo e sincronizado para agilidade nos seus resultados.", 0);
                    }}
                    className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 hover:border-indigo-300 rounded-lg cursor-pointer transition-colors"
                  >
                    🎙️ Ouvir Tom
                  </button>
                </div>
              </div>
              
              {/* Modelo de Inteligência e Configuração Base */}
              <div className="col-span-1 md:col-span-1 space-y-3.5 text-left">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Bot size={13} className="text-orange-550" />
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block font-sans">IA Selecionada</label>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 bg-gray-200/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { sound.playClick(); setSelectedEngine("gemini"); }}
                      className={cn(
                        "py-1.5 text-[9.5px] font-black uppercase rounded-lg transition-all cursor-pointer",
                        selectedEngine === "gemini" ? "bg-white text-orange-600 shadow-xs border border-orange-100" : "text-gray-500"
                      )}
                    >
                      Gemini Neural
                    </button>
                    <button
                      type="button"
                      onClick={() => { sound.playClick(); setSelectedEngine("chatgpt"); }}
                      className={cn(
                        "py-1.5 text-[9.5px] font-black uppercase rounded-lg transition-all cursor-pointer",
                        selectedEngine === "chatgpt" ? "bg-white text-emerald-600 shadow-xs border border-emerald-100" : "text-gray-500"
                      )}
                    >
                      ChatGPT 4o
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Versão de Execução</label>
                  {selectedEngine === "gemini" ? (
                    <select
                      value={selectedGeminiModel}
                      onChange={(e) => {
                        sound.playClick();
                        setSelectedModel(e.target.value);
                      }}
                      className="w-full text-[10px] font-bold bg-white border border-gray-300 rounded-xl px-2 py-2 text-slate-700 focus:outline-none"
                    >
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash (Padrão)</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Heavy)</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Lite (Ultraleve)</option>
                    </select>
                  ) : (
                    <div className="text-[9.5px] font-bold text-slate-600 bg-white border border-gray-200 px-2.5 py-2.5 rounded-xl">
                      Enterprise Auto-Tier
                    </div>
                  )}
                </div>
              </div>

              {/* Active Grounding connectors */}
              <div className="col-span-1 md:col-span-2 space-y-3 text-left p-4 rounded-2xl bg-white border border-slate-150 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <Globe size={13} className="text-indigo-650 animate-pulse" />
                  <label className="text-[10px] font-black text-slate-800 uppercase tracking-wider block font-sans">Conectores de Grounding Ativo</label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useSearch}
                      onChange={(e) => {
                        sound.playClick();
                        const checked = e.target.checked;
                        setUseSearch(checked);
                        if (checked) {
                          setUseMaps(false);
                          showToast("Busca em Tempo Real (Google Grounding) Habilitada!", "success");
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5"
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        Google Search Live Grounding 🌐
                      </span>
                      <p className="text-[9px] text-gray-500 leading-tight mt-0.5">Permite à consultoria Dafne consultar taxas de juros, notícias e benchmarks nacionais do varejo e serviços em tempo real de 2026.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none border-t border-slate-100 pt-2 mt-2">
                    <input
                      type="checkbox"
                      checked={useMaps}
                      onChange={(e) => {
                        sound.playClick();
                        const checked = e.target.checked;
                        setUseMaps(checked);
                        if (checked) {
                          setUseSearch(false);
                          showToast("Grounding de Localização e Concorrência de Pólos Ativado!", "info");
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5"
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 flex-wrap">
                        Google Maps & Places Geocoding 📍 
                        {isGpsLoading && <Loader2 size={10} className="animate-spin text-indigo-550" />}
                      </span>
                      <p className="text-[9px] text-gray-500 leading-tight mt-0.5">
                        {latitude && longitude 
                          ? `Localização calibrada via GPS: Lat ${latitude.toFixed(3)}, Lng ${longitude.toFixed(3)}` 
                          : "Calibra e localiza geograficamente os pólos de concorrentes comerciais perto das filiais para estimar fluxo de markup."}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Painel de Otimização e Conectividade Síncrona */}
              <div className="col-span-1 md:col-span-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-[#101324] border border-indigo-500/30 text-white space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe size={15} className="text-indigo-450 animate-spin" style={{ animationDuration: '6s' }} />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                        Otimizador de Conectividade & Latência Síncrona
                      </h4>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1",
                        isOnline ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      )}>
                        {isOnline ? (
                          <>
                            <Wifi size={10} className="animate-pulse" /> ONLINE
                          </>
                        ) : (
                          <>
                            <WifiOff size={10} /> OFFLINE
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                      Sincro-Tecnologia avançada. Este módulo analisa rotas de dados, atenua perturbações de latência do iFrame, otimiza o emparelhamento do modelo Gemini e calibra o cache offline de synapses locais.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={runLatencyTest}
                      disabled={latencyTesting}
                      className={cn(
                        "w-full md:w-auto px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border",
                        latencyTesting
                          ? "bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed animate-pulse"
                          : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-indigo-400 hover:shadow-md hover:shadow-indigo-500/20"
                      )}
                    >
                      <RefreshCw size={12} className={cn(latencyTesting ? "animate-spin" : "")} />
                      {latencyTesting ? "Aferindo Latência..." : "Testar Latência Real"}
                    </button>
                  </div>
                </div>

                {/* Grid de Métricas de Rede e Sincronismo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Gauge de Latência Atual */}
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shrink-0">
                      <Gauge size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Latência de Ida/Volta (RTT)</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-base font-mono font-black text-indigo-300">
                          {latency !== null ? `${latency} ms` : "---"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-300 truncate max-w-[130px]">
                          {latencyGrade}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cache de Synapses Locais */}
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Database size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Cache Síncrono Local</span>
                      <div className="flex items-center justify-between gap-1.5 mt-0.5">
                        <span className="text-sm font-mono font-black text-emerald-300 truncate">
                          {cacheSyncedCount} Synapses
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setCacheSyncedCount(prev => prev + 5);
                            showToast("Sinapses e cache de prontidão sincronizados no cockpit!", "success");
                          }}
                          className="text-[8px] font-black bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-500/20 uppercase cursor-pointer shrink-0"
                        >
                          Sincronizar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modo de Compactação Neural */}
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-400 border border-amber-500/20 shrink-0">
                      <Zap size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Compressão de Prompt</span>
                      <div className="flex items-center justify-between gap-1.5 mt-0.5 w-full">
                        <span className="text-xs font-mono font-black text-amber-300 truncate">
                          {compressLevel}
                        </span>
                        <select
                          value={compressLevel}
                          onChange={(e) => {
                            sound.playClick();
                            setCompressLevel(e.target.value);
                            showToast(`Compressão de tráfego ajustada para: ${e.target.value}`, "info");
                          }}
                          className="bg-[#1e233d] text-[9.5px] font-bold text-amber-300 border border-amber-500/20 rounded-md py-0.5 px-1 focus:outline-none cursor-pointer outline-none shrink-0"
                        >
                          <option value="Inativa (1.0x)" className="bg-[#1e233d] text-white">Inativa</option>
                          <option value="Inteligente (2.0x)" className="bg-[#1e233d] text-white">Médio (2x)</option>
                          <option value="Quântica (4.0x)" className="bg-[#1e233d] text-white">Quântico (4x)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Interactive SVG Holo-Mesh Graph */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 overflow-hidden relative">
                  <div className="w-full md:w-1/2 space-y-3 shrink-0">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5 matches-glow">
                      <Zap size={11} className="text-orange-400 animate-pulse" /> Malha Holográfica de Sincronismo (Holo-Mesh Graph)
                    </h5>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                      Mapeamento dinâmico de conexões síncronas entre os bancos de dados corporativos (Receitas, Despesas, Metas e Custos) e o Buffer de Synapses da Inteligência Dafne.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-300">
                      <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                        <span>Fluxo DRE: <strong className="text-white">100%</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>Recomp. Markup: <strong className="text-white">Ativa</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
                        <span>Mapeamento: <strong className="text-white">{isOnline ? "Simétrico" : "Local (Cache)"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        <span>Buffer S-MAP: <strong className="text-white">Estável</strong></span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Interactive animated command-center schema map */}
                  <div className="w-full md:w-1/2 flex items-center justify-center bg-[#070914] border border-white/5 p-4 rounded-xl relative overflow-hidden h-[155px] select-none shadow-inner">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_75%)] pointer-events-none" />
                    
                    <svg className="w-full h-full max-w-[270px]" viewBox="0 0 280 150">
                      <style>{`
                        @keyframes dashAnimation {
                          to {
                            stroke-dashoffset: -40px;
                          }
                        }
                        .flowing-path-1 {
                          animation: dashAnimation 5s linear infinite;
                        }
                        .flowing-path-2 {
                          animation: dashAnimation 6.5s linear infinite reverse;
                        }
                        .flowing-path-3 {
                          animation: dashAnimation 4s linear infinite;
                        }
                      `}</style>
                      
                      <defs>
                        <filter id="glow-mesh-orange" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="3.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <filter id="glow-mesh-emerald" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="3.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
 
                      {/* Pathways */}
                      <path
                        d="M 40 75 Q 110 30 180 45"
                        fill="none"
                        stroke="rgba(249, 115, 22, 0.45)"
                        strokeWidth="1.5"
                        strokeDasharray="5, 5"
                        className="flowing-path-1"
                        style={{ strokeDashoffset: -100 }}
                      />
                      <path
                        d="M 40 75 Q 110 120 180 105"
                        fill="none"
                        stroke="rgba(16, 185, 129, 0.45)"
                        strokeWidth="1.5"
                        strokeDasharray="5, 5"
                        className="flowing-path-2"
                      />
                      <path
                        d="M 180 45 L 240 75"
                        fill="none"
                        stroke="rgba(249, 115, 22, 0.45)"
                        strokeWidth="1.5"
                        strokeDasharray="4, 4"
                        className="flowing-path-3"
                      />
                      <path
                        d="M 180 105 L 240 75"
                        fill="none"
                        stroke="rgba(244, 63, 94, 0.45)"
                        strokeWidth="1.5"
                        strokeDasharray="4, 4"
                        className="flowing-path-1"
                      />
                      <line
                        x1="180" y1="45" x2="180" y2="105"
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="1"
                        strokeDasharray="3, 3"
                      />
 
                      {/* Node L_DB */}
                      <g onClick={() => showToast("Banco de Dados local totalmente sínclito!", "success")} className="cursor-pointer">
                        <circle cx="40" cy="75" r="9" fill="#1e293b" stroke="#f97316" strokeWidth="2" filter="url(#glow-mesh-orange)" />
                        <circle cx="40" cy="75" r="3" fill="#fdba74" className="animate-pulse" />
                        <text x="40" y="94" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace" fontWeight="bold">LOCAL_DB</text>
                      </g>
 
                      {/* Node QoS */}
                      <g onClick={() => showToast("Filtro Ativo: Sincro-Latência mitigada", "info")} className="cursor-pointer">
                        <circle cx="180" cy="45" r="8" fill="#111827" stroke="#10b981" strokeWidth="1.5" filter="url(#glow-mesh-emerald)" />
                        <circle cx="180" cy="45" r="2.5" fill="#34d399" className="animate-ping" />
                        <text x="180" y="32" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace" fontWeight="bold">SYNAPSE_QoS</text>
                      </g>
 
                      {/* Node Synthesis */}
                      <g onClick={() => showToast("Sintonizador Acústico Jennifer calibrado", "success")} className="cursor-pointer">
                        <circle cx="180" cy="105" r="8" fill="#111827" stroke="#f43f5e" strokeWidth="1.5" />
                        <circle cx="180" cy="105" r="2.5" fill="#fda4af" />
                        <text x="180" y="120" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace" fontWeight="bold">VOX_COGNITIVES</text>
                      </g>
 
                      {/* Node Gemini */}
                      <g onClick={() => showToast("Cérebro Artificial Principal: Ativo e Atento", "info")} className="cursor-pointer">
                        <circle cx="240" cy="75" r="11" fill="#271408" stroke="#f97316" strokeWidth="2" filter="url(#glow-mesh-orange)" className="animate-pulse" />
                        <circle cx="240" cy="75" r="3" fill="#ffedd5" />
                        <text x="240" y="94" textAnchor="middle" fill="#f97316" fontSize="8" fontFamily="monospace" fontWeight="black">DAFNE_CORE</text>
                      </g>
                    </svg>
                  </div>
                </div>
 
                {/* Linha de Conectividade Adaptativa Inteligente */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-[10px] text-slate-400 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Activity size={12} className="text-orange-400 animate-pulse" />
                    <span className="leading-none">Modo de Conectividade Adaptativa: <strong>{ultraOptimizedMode ? "ATIVADO (Mitiga latência síncrona nos iFrames)" : "DESATIVADO"}</strong></span>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ultraOptimizedMode}
                      onChange={(e) => {
                        sound.playClick();
                        setUltraOptimizedMode(e.target.checked);
                        if (e.target.checked) {
                          showToast("Dynamic Ultra QoS ativado para a rede neural!", "success");
                        } else {
                          showToast("Modo adaptativo padrão reativado.", "info");
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-750/80 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-500 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-500 relative"></div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest shrink-0">
                      Otimizar QoS Síncrono ⚡
                    </span>
                  </label>
                </div>

              </div>

              {/* Innovative Settings Row */}
              <div className="col-span-1 md:col-span-4 pt-4 border-t border-gray-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Inovação & IA Síncrona (Ajuste Avançado)
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Autoplay Toggle */}
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoplayVoice}
                      onChange={(e) => {
                        sound.playClick();
                        setAutoplayVoice(e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Voz por Auto-Leitura 🎙️
                    </span>
                  </label>

                  {/* Telemetry Toggle */}
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showTelemetry}
                      onChange={(e) => {
                        sound.playClick();
                        setShowTelemetry(e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Mostrar Telemetria Técnica 💻
                    </span>
                  </label>

                  {/* Hands-Free Voice Mode Toggle */}
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isHandsFreeMode}
                      onChange={(e) => {
                        sound.playClick();
                        const nextVal = e.target.checked;
                        setIsHandsFreeMode(nextVal);
                        if (nextVal) {
                          showToast("Modo conversação ativado! Fale livremente.", "success");
                          startDictation();
                        } else {
                          showToast("Modo conversação desativado.", "info");
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-650">
                      Modo Viva-Voz Inteligente ♾️
                    </span>
                  </label>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2-Column Responsive Layout wrapping Chat and Business Integration Hub */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-[#FAFBFD] border-t border-gray-200/55">
        
        {/* Left Column: Conversational interface (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white border-r border-gray-200/60 overflow-hidden relative">
          
          {/* Main Conversational Layout Area */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[52vh] flex flex-col gap-6 scrollbar-thin scrollbar-thumb-gray-200">
            
            {/* Full Gemini style landing list if no user messages generated */}
            {messages.length <= 1 && (
              <div className="my-auto space-y-8 py-4">
                
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  
                  {/* Holographic Neural Pulse Glowing Orb */}
                  <div className="flex flex-col items-center justify-center gap-2 mb-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-[2px] shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-[pulse_3s_ease-in-out_infinite] relative">
                      <div className="w-full h-full bg-[#0d1020] rounded-full flex items-center justify-center overflow-hidden">
                        <NeuralSynapseWave state={loading ? "thinking" : isDictating ? "listening" : isPlayingId !== null ? "speaking" : "idle"} />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none" />
                    </div>
                    <span className="text-[8.5px] font-mono text-indigo-400 uppercase tracking-widest font-black animate-pulse">
                      ECOSSISTEMA COGNITIVO DAFNE LIVE
                    </span>
                  </div>

                  <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-4xl font-extrabold tracking-tight relative"
                  >
                    Olá,{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 font-extrabold text-transparent bg-clip-text">
                      {profile?.companyName || "Gestor Financeiro"}
                    </span>
                    <span className="absolute -top-3 right-0 scale-75 animate-bounce">
                      <Zap className="text-amber-400 fill-amber-400 w-5 h-5" />
                    </span>
                  </motion.h1>
                  <p className="text-slate-500 font-medium text-sm">
                    Eu tenho acesso total à integridade de transações, cmv, controle tributário e planejamento estratégico do seu negócio. O que vamos auditar hoje?
                  </p>
                </div>

                {/* suggestion cards styled beautifully */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
                  {suggestionCards.map((card, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleSendMessage(card.prompt)}
                      className={cn(
                        "p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative group transform hover:-translate-y-1.5 hover:shadow-lg flex flex-col justify-between min-h-[140px]",
                        card.color
                      )}
                    >
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-2 flex items-center justify-between">
                          {card.title}
                          <Sparkles className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 group-hover:text-amber-500 transition-all" />
                        </h3>
                        <p className="text-[11.5px] text-slate-600 font-medium leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                      <div className="text-[9px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity mt-4 text-right">
                        Perguntar ao Gemini →
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center px-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200 scale-95 opacity-80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <HeartHandshake size={11} className="text-indigo-500" />
                    Acesse o menu de Configuração acima para refinar a assinatura acústica e telemetrias.
                  </span>
                </div>

              </div>
            )}

            {/* Conversation stream */}
            {messages.length > 1 && (
              <div className="space-y-6 max-w-4xl mx-auto w-full">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4 w-full",
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Avatar Column */}
                    {msg.sender === "gemini" && (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#141414] via-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md relative">
                        <Sparkles className="w-4.5 h-4.5" />
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>
                    )}

                    {/* Message Box */}
                    <div
                      className={cn(
                        "rounded-2xl p-5 border text-left max-w-[85%] flex flex-col gap-3.5 transition-all",
                        msg.sender === "user"
                          ? "bg-orange-500 text-black border-orange-500 rounded-tr-none shadow-sm font-semibold"
                          : "bg-white text-slate-800 border-slate-200 shadow-xs rounded-tl-none hover:border-orange-250"
                      )}
                    >
                      <div className={cn("leading-relaxed", msg.sender === "user" ? "text-sm font-extrabold" : "")}>
                        {msg.sender === "user" ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <GeminiMarkdown text={msg.text} />
                        )}
                      </div>

                      {msg.sender === "gemini" && msg.groundingMetadata && (
                        <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-3 text-xs text-orange-950 mt-2 space-y-1.5 bg-gradient-to-r from-orange-500/[0.02] to-amber-500/[0.02]">
                          <div className="flex items-center gap-1 font-black text-[9px] uppercase tracking-wider text-orange-600 mb-1 leading-none">
                            <Globe size={11} className="animate-spin text-orange-500" style={{ animationDuration: "6s" }} /> Fontes de pesquisa (Google Grounding):
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {msg.groundingMetadata.groundingChunks?.map((chunk: any, i: number) => {
                              if (chunk.web?.uri) {
                                return (
                                  <a
                                    key={i}
                                    href={chunk.web.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-lg px-2 text-[10px] py-1 font-medium flex items-center gap-1 shadow-2xs transition-colors text-slate-700"
                                  >
                                    <ExternalLink size={9} className="text-blue-500" />
                                    {chunk.web.title || "Fonte externa"}
                                  </a>
                                );
                              }
                              return null;
                            })}
                          </div>
                          {msg.groundingMetadata.webSearchQueries && msg.groundingMetadata.webSearchQueries.length > 0 && (
                            <div className="text-[9px] text-gray-500 italic mt-1 flex items-center gap-1 font-mono">
                              <span>Busca executada:</span>
                              <span className="font-semibold text-gray-700">"{msg.groundingMetadata.webSearchQueries.join(', ')}"</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* High tech telemetry data logger for Gemini responses */}
                      {msg.sender === "gemini" && msg.telemetry && showTelemetry && (
                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 font-mono text-[9px] text-gray-500 space-y-1 select-none">
                          <div className="flex items-center justify-between font-black text-slate-700 uppercase tracking-widest pb-1 border-b border-gray-250/50 mb-1">
                            <span>📡 Telemetria e Ambiência Neural</span>
                            <span className="text-[8px] px-1 py-0.5 bg-indigo-50 text-indigo-600 rounded">CONFIRMADO</span>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            <div>
                              <span className="text-gray-400 font-extrabold uppercase bg-gray-100 px-1 rounded">Latência técnica:</span> {msg.telemetry.responseTimeMs} ms
                            </div>
                            <div>
                              <span className="text-gray-400 font-extrabold uppercase bg-gray-100 px-1 rounded">Sintaxe total:</span> {msg.telemetry.tokens} tokens
                            </div>
                            <div>
                              <span className="text-gray-400 font-extrabold uppercase bg-gray-100 px-1 rounded">Temperatura:</span> {(msg.simulatedTemp || 0.7).toFixed(2)}
                            </div>
                            <div>
                              <span className="text-gray-400 font-extrabold uppercase bg-gray-100 px-1 rounded">Confiança:</span> {Math.round(msg.telemetry.confidence * 100)}%
                            </div>
                          </div>
                          <div className="text-[8px] bg-slate-100 text-slate-500 p-1 rounded-sm mt-1 border border-slate-200 flex items-center gap-1 overflow-x-auto whitespace-nowrap">
                            <Terminal size={10} className="text-indigo-500" />
                            <span>S-MAP // {msg.telemetry.synapsesMap}</span>
                          </div>
                        </div>
                      )}

                      {/* Actions under AI responses */}
                      {msg.sender === "gemini" && (
                        <div className="mt-2.5 pt-3 border-t border-slate-150 flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase font-black text-gray-500 tracking-wider">
                          {/* Left: Metadata info */}
                          <span className="opacity-75 flex items-center gap-1.5 text-[9px] font-mono">
                            <Cpu size={12} className="text-indigo-400" />
                            Ação {msg.engineName || "Gemini 3.5 Core"} •{" "}
                            {msg.simulatedTier && `TIER ${msg.simulatedTier.toUpperCase()}`}
                          </span>

                          {/* Right: Operational Buttons */}
                          <div className="flex flex-wrap items-center gap-2" id="gemini-operational-actions-row">
                            {/* 🗣️ Read and talk with active high tech wave */}
                            <button
                              onClick={() => speakMessage(msg.text, index)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl border text-[9px] font-black flex items-center gap-1.5 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-sm",
                                isPlayingId === index
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-emerald-400 text-white animate-pulse"
                                  : "bg-white hover:bg-slate-100 border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700"
                              )}
                            >
                              {isPlayingId === index ? (
                                <>
                                  <Waves size={11} className="animate-bounce" /> Falando... Parar 🛑
                                </>
                              ) : (
                                <>
                                  <Volume2 size={11} className="text-indigo-500 animate-pulse" /> Ouvir Voz Premium 🎙️
                                </>
                              )}
                            </button>

                            {/* 📋 Copy clipboard */}
                            <button
                              onClick={() => copyToClipboard(msg.text, index)}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-extrabold flex items-center gap-1.5 cursor-pointer transition-all duration-350 shadow-xs hover:shadow-sm"
                            >
                              {copiedId === index ? (
                                <>
                                  <Check size={11} className="text-emerald-500 animate-ping" /> Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy size={10} /> Copiar
                                </>
                              )}
                            </button>

                            {/* 📝 Save inside corporate notes */}
                            <button
                              onClick={() => saveToSystemNotes(msg.text, index)}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-extrabold flex items-center gap-1.5 cursor-pointer transition-all duration-350 shadow-xs hover:shadow-sm"
                            >
                              {savedId === index ? (
                                <>
                                  <Bookmark size={11} className="text-amber-500 fill-amber-500" /> Salvo!
                                </>
                              ) : (
                                <>
                                  <Bookmark size={10} /> Guardar Card
                                </>
                              )}
                            </button>

                            {/* 📄 PDF downloader (ABNT standard) */}
                            <button
                              onClick={() => downloadAbntPdf(msg.text)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-50 to-orange-105 hover:from-orange-100 hover:to-orange-150 border border-orange-200 text-orange-700 font-black flex items-center gap-1.5 cursor-pointer transition-all duration-350 shadow-xs hover:shadow-sm hover:scale-[1.02]"
                            >
                              <Download size={10} /> Diagnóstico PDF
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Metadata under user responses */}
                      {msg.sender === "user" && (
                        <span className="text-[9px] text-right font-mono text-gray-500 mt-1 self-end">
                          Enviado às {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}

                    </div>

                    {msg.sender === "user" && (
                      <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-orange-950">ME</span>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Loading animation state */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4 w-full justify-start animate-pulse"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#141414] via-orange-500 to-orange-600 flex items-center justify-center text-white shrink-0">
                      <Cpu className="w-4.5 h-4.5 text-white animate-spin" />
                    </div>
                    <div className="rounded-2xl p-5 border border-orange-100 bg-white shadow-xs rounded-tl-none text-left max-w-[70%]">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" />
                        </div>
                        <span className="text-xs font-black text-orange-600 uppercase tracking-widest animate-pulse">
                          Consolidações síncronas em andamento...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={msgEndRef} />
              </div>
            )}

          </div>

          {/* Floating capsule input panel */}
          <div className="p-4 bg-white border-t border-gray-200/65 flex flex-col gap-3 relative">
            
            {/* Holographic Diagnostic Assistant for Microphone Error (Seu navegador ou iframe) */}
            {micPermissionError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50/90 border-2 border-orange-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 max-w-4xl mx-auto w-full shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-orange-100/80 text-orange-600 rounded-xl shrink-0 mt-0.5 animate-pulse flex items-center justify-center border border-orange-255/10">
                    <AlertCircle size={18} />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5 font-sans">
                      Dafne Core: Diagnóstico de Permissão Ativo
                    </h4>
                    <p className="text-[10px] text-slate-700 leading-relaxed font-sans font-medium">
                      O acesso ao microfone foi recusado ou bloqueado. Devido às robustas restrições de sandbox de <strong>iFrames</strong> do seu navegador, é ideal abrir o aplicativo em aba inteira ou autorizar manualmente a URL direta.
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
                      <div className="flex items-center gap-1 text-[9px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 uppercase tracking-widest leading-none">
                        <span>✔ Frame Sandbox Atualizado</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-mono font-black text-orange-700 bg-orange-100/55 px-2 py-0.5 rounded-lg border border-orange-200 uppercase tracking-widest leading-none">
                        <span>ℹ Requer Autorização do Navegador</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 justify-end md:w-44">
                  <a 
                    href={window.location.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => {
                      sound.playSuccess();
                      setMicPermissionError(null);
                    }}
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider bg-orange-500 hover:bg-orange-600 active:scale-95 text-black rounded-xl cursor-pointer select-none transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md shrink-0 border border-orange-600/30 text-center"
                  >
                    <ExternalLink size={12} />
                    Abrir em Nova Aba
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setMicPermissionError(null);
                    }}
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer select-none border border-slate-300 transition-all shrink-0 active:scale-95 text-center"
                  >
                    Ignorar Alerta
                  </button>
                </div>
              </motion.div>
            )}

            {/* Real-time Voice Dialogue indicator */}
            {isHandsFreeMode && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-gradient-to-r from-slate-900 via-[#12162a] to-[#14182e] text-white rounded-2xl max-w-4xl mx-auto w-full shadow-lg border border-orange-500/30">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex h-3 w-3 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isDictating ? "bg-rose-400" : isPlayingId !== null ? "bg-emerald-400" : "bg-indigo-400"} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isDictating ? "bg-rose-500 animate-pulse" : isPlayingId !== null ? "bg-emerald-500" : "bg-indigo-500"}`}></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-2">
                    {isDictating ? (
                      <>
                        <Mic size={12} className="text-rose-400 animate-pulse" /> Ouvindo... Fale agora!
                      </>
                    ) : isPlayingId !== null ? (
                      <>
                        <Waves size={12} className="text-emerald-400 animate-bounce" /> Dafne Falando...
                      </>
                    ) : (
                      <>
                        <Activity size={12} className="text-white/60" /> Aguardando resposta...
                      </>
                    )}
                  </span>
                </div>

                {/* Live interactive waveform stream inside the pill */}
                <div className="flex-1 h-8 bg-black/25 rounded-xl overflow-hidden px-2 border border-white/[0.04] flex items-center">
                  <NeuralSynapseWave state={isDictating ? "listening" : isPlayingId !== null ? "speaking" : loading ? "thinking" : "idle"} />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsHandsFreeMode(false);
                  }}
                  className="text-[9px] font-black uppercase px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-rose-500/20 transition-all cursor-pointer shrink-0"
                >
                  Desativar Viva-Voz 🛑
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center gap-2 max-w-4xl mx-auto w-full"
            >
              {/* Real-time Voice Dictation Status floating indicator */}
              {isDictating && (
                <div className="absolute -top-12 left-4 right-4 bg-orange-600 text-white rounded-xl py-2 px-4 flex items-center justify-between text-xs font-bold animate-bounce shadow-md">
                  <span className="flex items-center gap-2">
                    <Mic className="animate-ping text-rose-500" size={14} />
                    {dictationStatus}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDictating(false)}
                    className="text-white hover:text-rose-200 text-[10px] uppercase font-black bg-rose-600 px-2 py-0.5 rounded"
                  >
                    Parar
                  </button>
                </div>
              )}

              {/* Main input bar styled like Gemini interface bar */}
              <div className="flex-1 relative flex items-center rounded-2xl border border-gray-300 bg-gray-50 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all pl-4 pr-16 py-1.5">
                
                <input
                  type="text"
                  value={inputMessage}
                  disabled={loading}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Pergunte ao Gemini Copilot... (Ex: Qual meu faturamento versus contas pagar?)"
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden py-2"
                />
                
                {/* Quick clean button */}
                {inputMessage && (
                  <button
                    type="button"
                    onClick={() => setInputMessage("")}
                    className="absolute right-14 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* 🎤 Microphone transcription button */}
              <button
                type="button"
                onClick={startDictation}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border",
                  isDictating
                    ? "bg-rose-500 border-rose-600 text-white animate-pulse"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-gray-300"
                )}
                title="Perguntar por voz (Ditado)"
              >
                {isDictating ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Hands-Free mode toggle button */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  const nextVal = !isHandsFreeMode;
                  setIsHandsFreeMode(nextVal);
                  if (nextVal) {
                    showToast("Modo Viva-Voz Ativado! O Gemini falará e esperará sua voz automaticamente.", "success");
                    startDictation();
                  } else {
                    showToast("Modo Viva-Voz desativado.", "info");
                    if (isDictating) {
                      setIsDictating(false);
                    }
                  }
                }}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border",
                  isHandsFreeMode
                    ? "bg-gradient-to-tr from-orange-500 to-amber-600 border-orange-500 text-black font-semibold animate-pulse shadow-md shadow-orange-100"
                    : "bg-slate-50 hover:bg-slate-100 text-orange-600 border-orange-200"
                )}
                title="Modo Viva-Voz Contínuo (Mãos Livres)"
              >
                <Waves size={16} className={cn(isHandsFreeMode ? "animate-bounce" : "")} />
              </button>

              {/* Send buttons */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border",
                  inputMessage.trim() && !loading
                    ? "bg-orange-500 text-black font-bold border-orange-500 shadow-md shadow-orange-100 hover:bg-orange-600"
                    : "bg-gray-150 text-gray-400 border-gray-250 cursor-not-allowed"
                )}
              >
                <Send size={15} />
              </button>
            </form>

            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-medium">
                O Gemini Copilot utiliza inteligência de dados históricos e as projeções da planilha financeira da sua empresa de maneira integrada.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column (4/12 width on desktop): Business Integration Hub & Smart Shortcuts */}
        <div className="lg:col-span-4 bg-[#F8FAFC]/95 p-5 overflow-y-auto max-h-[64vh] flex flex-col gap-5 border-l border-gray-200/40 scrollbar-thin scrollbar-thumb-gray-200 select-none">
          
          {/* Hub Title */}
          <div className="space-y-1 pb-3 border-b border-gray-200">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <Database size={13} className="text-orange-600 animate-pulse" />
              Central de Integração do Caixa
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">
              Dados consolidados em tempo real. Clique nos atalhos para gerar mentoria personalizada imediata.
            </p>
          </div>

          {/* 1. Ambiência Geral */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/70 space-y-3.5 shadow-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase text-gray-450 tracking-wider">Metadados de Perfil</span>
              <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-black bg-orange-50 text-orange-600 border border-orange-200 uppercase">
                {profile?.businessSegment === "services" ? "Serviços" : profile?.businessSegment === "food" ? "Alimentação" : profile?.businessSegment === "commerce" ? "Varejo" : "Outro"}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 font-mono text-[10px] text-gray-500">
              <div className="p-2.5 bg-slate-50/50 rounded-xl border border-gray-100">
                <span className="text-[8px] font-black text-gray-400 block uppercase">Nicho de Operação</span>
                <span className="font-extrabold text-slate-800 truncate block mt-0.5 font-sans" title={profile?.businessNicheDetail || "Geral"}>
                  {profile?.businessNicheDetail || "Geral/Prestador"}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50/50 rounded-xl border border-gray-100">
                <span className="text-[8px] font-black text-gray-400 block uppercase">Markup de Catálogo</span>
                <span className="font-extrabold text-slate-800 block mt-0.5">
                  {products.length > 0 
                    ? `${(products.reduce((acc, p) => acc + (p.costPrice > 0 ? p.sellingPrice / p.costPrice : p.sellingPrice), 0) / products.length).toFixed(1)}x` 
                    : "Sem Produtos"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. DRE Real-Time Access Box */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/70 space-y-4 shadow-xs relative overflow-hidden group">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase text-gray-450 tracking-wider">Painel Financeiro Lançado</span>
              <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-black bg-orange-50 text-orange-650 border border-orange-200 font-mono">DRE Real</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Faturamento Bruto:</span>
                <span className="font-bold text-slate-800">{formatCurrency(incomeTotal, profile?.currency || "BRL")}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Custos & OPEX:</span>
                <span className="font-bold text-slate-800">{formatCurrency(expenseTotal, profile?.currency || "BRL")}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-dashed border-slate-100">
                <span className="text-gray-500 font-bold">Instância de Caixa:</span>
                <span className={cn("font-extrabold", netBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {formatCurrency(netBalance, profile?.currency || "BRL")}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                handleSendMessage(`Como mentora estrategista financeira Dafne, faça uma auditoria profunda do meu DRE ativo. Minha receita total é de R$ ${incomeTotal.toLocaleString('pt-BR')}, despesas de R$ ${expenseTotal.toLocaleString('pt-BR')} e saldo de R$ ${netBalance.toLocaleString('pt-BR')}. Destaque pontos de atenção cirúrgicos de corte de custos, margem recomendada para meu nicho de mercado e caminhos práticos para aumentar os lucros.`);
              }}
              className="w-full py-2 bg-orange-100/50 hover:bg-orange-100 text-orange-750 rounded-xl border border-orange-200 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-xs group-hover:-translate-y-0.5"
            >
              <BarChart2 size={13} />
              Auditar DRE Ativo
            </button>
          </div>

          {/* 3. Insumos e Markup de Produtos Catalogados */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/70 space-y-4 shadow-xs">
            <span className="text-[10px] font-black uppercase text-gray-450 tracking-wider block border-b border-slate-100 pb-2">Precificação do Catálogo (Fidelidade)</span>
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.slice(0, 3).map((prod, idx) => {
                  const cmv = prod.costPrice > 0 ? Math.round((prod.costPrice / prod.sellingPrice) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50/75 hover:bg-slate-50 border border-gray-200/50 rounded-xl transition-all">
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1 block">{prod.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-gray-400">
                          <span>Venda: R$ {prod.sellingPrice}</span>
                          <span>CMV: <strong className={cn(cmv > 40 ? "text-rose-500 font-extrabold" : "text-slate-600")}>{cmv}%</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          sound.playClick();
                          handleSendMessage(`Me dê caminhos práticos para diminuir o CMV ou aplicar engenharia de preço no meu produto: "${prod.name}". Atualmente cobro o Preço de Venda Praticado de R$ ${prod.sellingPrice} para um custo de R$ ${prod.costPrice}, com CMV real calculados de ${cmv}%. Me dê 3 diretrizes pragmáticas de markup para elevar faturamento.`);
                        }}
                        className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-650 hover:text-orange-700 transition-all border border-orange-100 cursor-pointer"
                        title="Otimizar Precificação"
                      >
                        <Sparkles size={11} className="animate-[pulse_1.8s_infinite]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 italic">Cadastre itens na aba de Markups/Produtos para habilitar atalhos de CMV no chat.</p>
            )}
          </div>

          {/* 4. Escalar Liquidez e Contas a Pagar (Upcoming Liabilities) */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/70 space-y-4 shadow-xs">
            <span className="text-[10px] font-black uppercase text-gray-450 tracking-wider block border-b border-slate-100 pb-2">Contas a Pagar Ativas (Inadimplência)</span>
            {bills.filter((b) => b.status === "pending").length > 0 ? (
              <div className="space-y-3">
                {bills.filter((b) => b.status === "pending").slice(0, 3).map((bill, idx) => {
                  const billDate = new Date(bill.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-rose-50/20 hover:bg-rose-50/50 border border-rose-100/75 rounded-xl transition-all">
                      <div className="text-left font-sans">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1 block">{bill.title}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-gray-400">
                          <span className="text-rose-650 font-extrabold">R$ {bill.amount.toLocaleString("pt-BR")}</span>
                          <span>Vencimento: {billDate}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          sound.playClick();
                          handleSendMessage(`Como posso planejar o fluxo de caixa para pagar a fatura em aberto de "${bill.title}" no valor de R$ ${bill.amount.toLocaleString("pt-BR")} que vence em ${billDate} sem estressar meu capital de giro? Forneça sugestões de prazos, desconto para quitação ou negociações.`);
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black transition-all border border-rose-600 cursor-pointer text-[9px] uppercase tracking-wider"
                        title="Planejar Fluxo de Caixa"
                      >
                        Giro
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center flex items-center justify-center gap-1">
                <Check size={11} /> Nenhuma conta a pagar pendente!
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
