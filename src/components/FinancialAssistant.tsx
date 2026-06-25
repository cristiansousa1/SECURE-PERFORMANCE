import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { formatCurrency, formatPercent, cn } from "../lib/utils";
import {
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  HelpCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  LayoutDashboard,
  ReceiptText,
  Settings,
  PieChart as PieChartIcon,
  Menu,
  X,
  LogOut,
  Loader2,
  Minimize2,
  CreditCard,
  Cpu,
  CheckCircle2,
  ChevronRight,
  Globe,
  Shield,
  Zap,
  QrCode,
  Barcode,
  ShieldAlert,
  BookOpen,
  StickyNote,
  PlayCircle,
  Clock,
  ExternalLink,
  Target,
  PlusCircle,
  Download,
  Sparkles,
  Sliders,
  Bot,
  Brain,
  MessageSquare,
  Send,
  Lightbulb,
  Search,
  Lock,
  Megaphone,
  Bell,
  AlertCircle,
  Calendar,
  DollarSign,
  Copy,
  Check,
  Mic,
  MicOff,
  Coins,
  FileText,
  UserPlus,
  Users,
  Share2,
  Scale,
  Receipt,
  Save,
  Percent,
  AlertTriangle,
  Info,
  Database,
  Calculator,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  ArrowUpRight,
  ArrowDownRight,
  Tv,
  MonitorPlay,
  Terminal,
  Layers,
  Flame,
  Code2,
  Volume2,
  VolumeX,
  ShieldCheck,
  Eye,
  EyeOff,
  Building,
  Laptop,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LabelList,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { sound } from "../utils/SoundEngine";
import BestTechnologySeal from "./BestTechnologySeal";
import { PlanConfig } from "../types";
import { getDynamicGoals } from "../utils/goalsHelper";
import { calculateHealthScore } from "../utils/healthCalculator";
import { getDREBasedTips, financialAssistantCache, DREBasedTip } from "../utils/financialTips";
import { AbntPdfDocument } from "../utils/pdfAbntHelper";
import TurnaroundModule from "./TurnaroundModule";
import SlimMarkdown from "./SlimMarkdown";
import AnimatedNumber from "./AnimatedNumber";

export default function FinancialAssistant({
  income,
  expense,
  balance,
  aiEngine,
  setAiEngine,
  autoGptTips,
  setAutoGptTips,
  gptTipInterval,
  setGptTipInterval,
  neuralPrecision = 0.7,
  neuralTier = "pro",
  voicePitch,
  setVoicePitch,
  voiceRate,
  setVoiceRate,
  voiceVolume,
  setVoiceVolume,
  availableVoices,
  selectedVoiceName,
  setSelectedVoiceName,
  setActiveTab,
  simulatedCrisis,
  setSimulatedCrisis,
}: {
  income: number;
  expense: number;
  balance: number;
  aiEngine: "gemini" | "chatgpt";
  setAiEngine: (e: "gemini" | "chatgpt") => void;
  autoGptTips: boolean;
  setAutoGptTips: (b: boolean) => void;
  gptTipInterval: number;
  setGptTipInterval: (i: number) => void;
  neuralPrecision?: number;
  neuralTier?: "flash" | "pro" | "quantum";
  voicePitch: number;
  setVoicePitch: (pitch: number) => void;
  voiceRate: number;
  setVoiceRate: (rate: number) => void;
  voiceVolume: number;
  setVoiceVolume: (volume: number) => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  setSelectedVoiceName: (voiceName: string) => void;
  setActiveTab?: (tab: any) => void;
  simulatedCrisis: boolean;
  setSimulatedCrisis: (val: boolean) => void;
}) {
  const { getDRE, transactions, allTransactions, categories, profile, addNote, showToast, products, isDemoMode, user } = useFinance();
  const [summary, setSummary] = useState<string | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState(sound.getMuted());
  const [goalProgress, setGoalProgress] = useState<any[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [operationalTips, setOperationalTips] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<{
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
  } | null>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // VOCAL SYNTHESIS (DAFNE VOICE) STATES & LOGIC
  const [isDafneVoiceEnabled, setIsDafneVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpokenText, setActiveSpokenText] = useState<string | null>(null);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      showToast("Seu navegador não oferece suporte para síntese de voz (SpeechSynthesis).", "warning");
      return;
    }
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Filter out markdown syntax cleanly so speech reads very organically
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/#/g, "")
      .replace(/_/g, "")
      .replace(/-\s/g, ", ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/🤖 |💡 |📈 |⚖️ |🎯 |📦 |✨ /g, "")
      .replace(/DRE/gi, "D.R.E.")
      .replace(/OPEX/gi, "Ópex")
      .replace(/CMV/gi, "C.M.V.");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    
    // Read dynamic pitch, rate, and voice name pre-configured by user
    const savedPitch = localStorage.getItem("dafne_voice_pitch");
    const savedRate = localStorage.getItem("dafne_voice_rate");
    const savedSelectedVoice = localStorage.getItem("dafne_selected_voice") || "";
    const savedVolume = localStorage.getItem("dafne_voice_volume");

    const activePitch = savedPitch ? parseFloat(savedPitch) : voicePitch;
    const activeRate = savedRate ? parseFloat(savedRate) : voiceRate;
    let activeVolume = savedVolume ? parseFloat(savedVolume) : voiceVolume;
    if (activeVolume === 1.0) {
      localStorage.setItem("dafne_voice_volume", "0.40");
      activeVolume = 0.40;
    }
    const activeVoiceName = savedSelectedVoice || selectedVoiceName;

    // Attempt standard voices and prioritize high-quality female neural engines
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter(v => 
      v.lang.toLowerCase().includes("pt-br") || 
      v.lang.toLowerCase().startsWith("pt")
    );
    
    let ptVoice = null;
    
    if (ptVoices.length > 0) {
      // 0. User Selected Voice
      if (activeVoiceName) {
        ptVoice = ptVoices.find(v => v.name === activeVoiceName);
      }

      // 1. Natural / Neural premium female voices
      if (!ptVoice) {
        ptVoice = ptVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes("natural") && (
            name.includes("maria") || 
            name.includes("francisca") || 
            name.includes("google") || 
            name.includes("female") || 
            name.includes("mulher") || 
            name.includes("suave")
          );
        });
      }
      
      // 2. High-quality default Google Brazil voice (highly optimized, fluent female speaker)
      if (!ptVoice) {
        ptVoice = ptVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes("google") && (
            name.includes("português") || 
            name.includes("portuguese") || 
            name.includes("br") || 
            name.includes("brasil")
          );
        });
      }

      // 3. Known system classic/premium female voices in Portuguese (Maria, Francisca, Heloísa, Luciana, Vitória, Fernanda, Heloisa)
      if (!ptVoice) {
        ptVoice = ptVoices.find(v => {
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
        });
      }

      // 4. Fallback to any Pt-BR voice
      if (!ptVoice) {
        ptVoice = ptVoices.find(v => v.lang.toLowerCase().includes("pt-br"));
      }

      // 5. Ultimate fallback to first Portuguese voice in list
      if (!ptVoice) {
        ptVoice = ptVoices[0];
      }
    }

    if (ptVoice) {
      utterance.voice = ptVoice;
    }
    
    utterance.pitch = activePitch;
    utterance.rate = activeRate;
    utterance.volume = activeVolume;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveSpokenText(text);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpokenText(null);
    };
    
    utterance.onerror = (e) => {
      console.warn("Vocal synthesis error:", e);
      setIsSpeaking(false);
      setActiveSpokenText(null);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveSpokenText(null);
  };

  const triggerVoiceIfEnabled = (text: string) => {
    if (isDafneVoiceEnabled) {
      speakText(text);
    }
  };

  // Tab & Chat state (chat is default start tab now!)
  const [activeModalTab, setActiveModalTab] = useState<
    "score" | "chat" | "report" | "scenarios" | "tips" | "simulator" | "niche"
  >("chat");

  // State for simulated crisis is now managed and passed from the parent state to keep sync across tabs

  // Simulador de Efeitos do Plano Estratégico no Relatório Consolidado
  const [reportStratPlan, setReportStratPlan] = useState<"opex" | "revenue" | "cmv">("opex");
  const [reportStratEfficacy, setReportStratEfficacy] = useState<number>(50);

  // Módulo de Margem de Contribuição e Detalhamento Integral Avançado
  const [showMargemDetail, setShowMargemDetail] = useState<boolean>(false);
  const [cmvOptimizationTarget, setCmvOptimizationTarget] = useState<number>(0); // % de otimização de custos/CMV a simular
  const [commissionSimRate, setCommissionSimRate] = useState<number>(0); // % de comissão de vendas direta a simular

  // MEMÓRIA E CÁLCULO DE MARGEM DE CONTRIBUIÇÃO DETALHADA E INTEGRAL
  const parsedContributionData = React.useMemo(() => {
    const currentDre = getDRE(new Date());
    
    const rob = Math.abs(currentDre.find(line => line.label === 'RECEITA OPERACIONAL BRUTA')?.value || 0);
    const deductionsVal = Math.abs(currentDre.find(line => line.label === '(-) Deduções e Impostos' || line.label.includes('Deduções'))?.value || 0);
    const rol = Math.abs(currentDre.find(line => line.label === '(=) RECEITA OPERACIONAL LÍQUIDA' || line.label.includes('LÍQUIDA'))?.value || 0);
    const cmvValue = Math.abs(currentDre.find(line => line.label === '(-) Custos dos Produtos/Serviços (CMV/CPV)' || line.label.includes('CMV'))?.value || 0);

    const isUsingSimulated = simulatedCrisis || (transactions.length === 0);
    
    // Fallbacks coerentes integrados
    const finalRob = isUsingSimulated ? (simulatedCrisis ? 32000 : 245000) : rob;
    const finalDeducoes = isUsingSimulated ? (simulatedCrisis ? 32000 * 0.12 : 245000 * 0.08) : deductionsVal;
    const finalRol = finalRob - finalDeducoes;
    
    // Calcular CMV de base de acordo com as margens de base desejadas
    const targetPct = simulatedCrisis ? 18.5 : 68.5;
    const baselineCmv = isUsingSimulated 
      ? finalRol * (1 - targetPct / 100) 
      : cmvValue;

    // Simulações estratégicas em tempo real
    const simulatedCmvVal = baselineCmv * (1 - cmvOptimizationTarget / 100);
    const extraCommissionFee = finalRob * (commissionSimRate / 100);
    
    const finalMargemValor = Math.max(0, finalRol - simulatedCmvVal - extraCommissionFee);
    const finalMargemPct = finalRol > 0 ? (finalMargemValor / finalRol) * 100 : 0;
    
    return {
      revenueGross: finalRob,
      deductions: finalDeducoes,
      revenueNet: finalRol,
      cmvOrig: baselineCmv,
      cmvSim: simulatedCmvVal,
      commissionFee: extraCommissionFee,
      marginVal: finalMargemValor,
      marginPct: finalMargemPct,
      isSimulated: isUsingSimulated
    };
  }, [getDRE, transactions, simulatedCrisis, cmvOptimizationTarget, commissionSimRate]);

  // Sync tab with external guided tour
  useEffect(() => {
    const handleSyncTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === 'string') {
        setActiveModalTab(customEvent.detail as any);
      }
    };
    window.addEventListener('dafne_sync_modal_tab', handleSyncTab);
    return () => window.removeEventListener('dafne_sync_modal_tab', handleSyncTab);
  }, []);



  // Custom AI Operating Niche Strategy states & synchronization at the App root
  const [localSegment, setLocalSegment] = useState(() => {
    return localStorage.getItem("dafne_business_segment") || "other";
  });
  const [localNicheDetail, setLocalNicheDetail] = useState(() => {
    return localStorage.getItem("dafne_business_niche_detail") || "";
  });
  const [nichePlan, setNichePlan] = useState<{
    nicheTitle: string;
    overview: string;
    kpis: Array<{ name: string; target: string; howToMeasure: string }>;
    milestones: Array<{ title: string; actions: Array<{ task: string; rationale: string }> }>;
    tips: Array<{ title: string; text: string }>;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("dafne_niche_growth_plan_data");
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [nicheLoading, setNicheLoading] = useState(false);
  const [completedNicheTasks, setCompletedNicheTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("dafne_niche_completed_tasks");
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  // Auto-sensing and pre-populating milkshake/gelato franchise parameters
  useEffect(() => {
    if (user && user.email === "cristianmilkymoo@gmail.com") {
      const savedSeg = localStorage.getItem("dafne_business_segment");
      const savedDetail = localStorage.getItem("dafne_business_niche_detail");
      if (!savedSeg) {
        setLocalSegment("food");
        localStorage.setItem("dafne_business_segment", "food");
      }
      if (!savedDetail) {
        setLocalNicheDetail("Franquia de Milkshakes & Sobremesas (Milky Moo)");
        localStorage.setItem("dafne_business_niche_detail", "Franquia de Milkshakes & Sobremesas (Milky Moo)");
      }
    }
  }, [user]);

  const toggleNicheTask = (taskName: string) => {
    const updated = { ...completedNicheTasks, [taskName]: !completedNicheTasks[taskName] };
    setCompletedNicheTasks(updated);
    localStorage.setItem("dafne_niche_completed_tasks", JSON.stringify(updated));
  };

  const handleGenerateNichePlan = async () => {
    if (!localNicheDetail.trim()) {
      showToast("Por favor, descreva em algumas palavras o seu nicho ou negócio!", "warning");
      return;
    }
    
    setNicheLoading(true);
    showToast("A assessoria I.A. está mapeando o mercado e modelando KPIs customizados... 🧠", "info");
    
    try {
      localStorage.setItem("dafne_business_segment", localSegment);
      localStorage.setItem("dafne_business_niche_detail", localNicheDetail);
      
      const appIncome = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
      const appExpense = transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
      const appBalance = appIncome - appExpense;
      const appDreData = getDRE(new Date());

      const response = await fetch("/api/ai/niche-growth-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialData: {
            income: appIncome,
            expense: appExpense,
            balance: appBalance,
            companyName: profile?.companyName || "Minha Empresa",
            dre: appDreData.map((line) => ({ label: line.label, value: line.value })),
            businessSegment: localSegment,
            businessNicheDetail: localNicheDetail,
            userEmail: user?.email || "",
          }
        })
      });
      
      const data = await response.json();
      setNichePlan(data);
      localStorage.setItem("dafne_niche_growth_plan_data", JSON.stringify(data));
      
      // Complete tutorial task
      if ((window as any).completeTourTask) {
        (window as any).completeTourTask("sector_switch");
      }
      
      // Clear checked status of old plan tasks
      setCompletedNicheTasks({});
      localStorage.removeItem("dafne_niche_completed_tasks");
      
      showToast("Plano estratégico de crescimento gerado com sucesso!", "success");
    } catch (err) {
      console.error("Niche plan generation error:", err);
      showToast("Não foi possível contatar a Inteligência Artificial, verifique a rede.", "error");
    } finally {
      setNicheLoading(false);
    }
  };

  const [secondsLeft, setSecondsLeft] = useState(gptTipInterval);
  const [currentIntervalTip, setCurrentIntervalTip] =
    useState<DREBasedTip | null>(null);

  const [chatMessages, setChatMessages] = useState<
    Array<{ 
      sender: string; 
      text: string; 
      timestamp: Date;
      simulatedTier?: string;
      simulatedTemp?: number;
    }>
  >([
    {
      sender: "dafne",
      text: "Olá! Sou a assessora virtual de lucratividade baseada em Inteligência Artificial. Analisei sua planilha de DRE em tempo real e estou pronta para formular dicas analíticas precisas para o seu negócio! Escolha uma das categorias rápidas abaixo ou me peça uma recomendação específica sobre OPEX, CMV, lucro ou fluxo de caixa.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const getEnrichedFinancialData = () => {
    const categoryGroupExpenses: Record<string, number> = {
      COGS: 0,
      OPEX: 0,
      TAX: 0,
      INVESTMENT: 0,
      OTHER_EXPENSE: 0,
    };

    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "expense") {
        const category = categories.find((c) => c.id === t.categoryId);
        if (category) {
          if (category.group in categoryGroupExpenses) {
            categoryGroupExpenses[category.group] += t.amount;
          }
          categoryTotals[category.name] =
            (categoryTotals[category.name] || 0) + t.amount;
        }
      }
    });

    const topExpenseCategories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const dreTextData = getDRE(new Date()).map((line) => ({
      label: line.label,
      value: line.value,
      isBold: line.isBold,
    }));

    return {
      income,
      expense,
      balance,
      transactionsCount: transactions.length,
      companyName: profile?.companyName || "Minha Empresa",
      categoryGroupExpenses,
      topExpenseCategories,
      dre: dreTextData,
      goals: getDynamicGoals(allTransactions, categories).map(g => ({
        title: g.title,
        current: g.current,
        target: g.target,
        inverse: g.inverse
      })),
      businessSegment: localStorage.getItem("dafne_business_segment") || "other",
      businessNicheDetail: localStorage.getItem("dafne_business_niche_detail") || "",
      averageBilling: profile?.averageBilling || 0,
      billingGoal: profile?.billingGoal || 0,
      billingGoalDeadline: profile?.billingGoalDeadline || "",
      billingNotes: profile?.billingNotes || "",
      businessType: profile?.businessType || "",
      chargeModel: profile?.chargeModel || "mixed",
      averageTicket: profile?.averageTicket || 0,
      additionalGoals: profile?.additionalGoals || [],
    };
  };

  // Dynamic automatic tip generator powered by ChatGPT / Gemini
  const fetchGptLiveTip = async () => {
    try {
      const useEndpoint = aiEngine === "chatgpt" ? "/api/ai/chat-gpt" : "/api/ai/chat-dafne";
      const userMsg = aiEngine === "chatgpt" 
        ? "Por favor, me envie uma dica financeira extremamente cirúrgica e acionável com base nos meus números. Seja conciso (máximo de 3 frases) e indique uma ação imediata." 
        : "Por favor, me dê uma dica estratégica prática e acionável focada na saúde geral do caixa.";
         
      const response = await fetch(useEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          financialData: getEnrichedFinancialData(),
          neuralPrecision,
          neuralTier,
        }),
      });

      const resData = await response.json();
      
      if (resData.text) {
        const prefix = aiEngine === "chatgpt" 
          ? `🤖 **[ChatGPT Automatizado às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]**`
          : `💡 **[Assessoria DRE - I.A. às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]**`;

        setChatMessages((prev) => [
          ...prev,
          {
            sender: "dafne",
            text: `${prefix}\n\n${resData.text}`,
            timestamp: new Date(),
            simulatedTier: resData.simulatedTier,
            simulatedTemp: resData.simulatedTemp,
          },
        ]);

        triggerVoiceIfEnabled(resData.text);

        setCurrentIntervalTip({
          title: aiEngine === "chatgpt" ? "Gestão Estratégica ChatGPT" : "Assessoria DRE Inteligente",
          category: "CONSELHO IA",
          text: resData.text,
          actionPlan: "Acompanhe de perto as dicas automáticas geradas e regule as finanças."
        });
      }
    } catch (err) {
      console.error("Dynamic Tip automation interval error:", err);
    }
  };

  // Periodic interval rotation logic to fetch tips according to the selected engine configuration (30s)
  useEffect(() => {
    // Set initial interval tip immediately
    const dre = getDRE(new Date());
    const possibleTips = getDREBasedTips(dre, transactions);
    if (possibleTips.length > 0 && !currentIntervalTip) {
      setCurrentIntervalTip(possibleTips[0]);
    }

    setSecondsLeft(gptTipInterval);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (aiEngine === "chatgpt" && autoGptTips) {
            fetchGptLiveTip();
          } else {
            // Rotative DRE based client tips
            const currentDre = getDRE(new Date());
            const list = getDREBasedTips(currentDre, transactions);
            if (list.length > 0) {
              setCurrentIntervalTip((curr) => {
                const prevIndex = list.findIndex(
                  (item) => item.title === curr?.title,
                );
                const nextIndex = (prevIndex + 1) % list.length;
                const nextTip = list[nextIndex];

                // Push beautiful automated alert in chat logs timeline
                setChatMessages((prevMsgs) => [
                  ...prevMsgs,
                  {
                    sender: "dafne",
                    text: `💡 **[Assessoria DRE - I.A. às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]**\n\n**${nextTip.title} (${nextTip.category})**\n\n${nextTip.text}\n\n👉 *Plano de Ação:* ${nextTip.actionPlan}`,
                    timestamp: new Date(),
                  },
                ]);

                return nextTip;
              });
            }
          }
          return gptTipInterval; // Reset timer count
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [transactions.length, categories.length, profile?.taxRate, aiEngine, autoGptTips, gptTipInterval]);

  const requestDynamicTip = async (topic: string) => {
    if (chatLoading) return;
    setChatLoading(true);

    const userText = `Solicitação: Dica de ${topic}`;
    const updatedMessages = [
      ...chatMessages,
      { sender: "user", text: userText, timestamp: new Date() },
    ];
    setChatMessages(updatedMessages);

    try {
      const useEndpoint = aiEngine === "chatgpt" ? "/api/ai/chat-gpt" : "/api/ai/chat-dafne";
      const response = await fetch(useEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Por favor, me dê uma dica estratégica prática e acionável focada em: ${topic}`,
          history: updatedMessages,
          financialData: getEnrichedFinancialData(),
          neuralPrecision,
          neuralTier,
        }),
      });
      const resData = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { 
          sender: "dafne", 
          text: resData.text, 
          timestamp: new Date(),
          simulatedTier: resData.simulatedTier,
          simulatedTemp: resData.simulatedTemp,
        },
      ]);
      triggerVoiceIfEnabled(resData.text);
    } catch (err) {
      console.error("Tip request error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "dafne",
          text: "Foque na otimização de custos e margem. Recomendo auditar suas despesas administrativas e focar nas linhas fixas do seu DRE operacional para maximizar o lucro real.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput;
    setChatInput("");

    const updatedMessages = [
      ...chatMessages,
      { sender: "user", text: userText, timestamp: new Date() },
    ];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    // Dynamic futuristic pitch sweep when starting mathematical AI reasoning
    sound.playCalculationSweep();

    try {
      const useEndpoint = aiEngine === "chatgpt" ? "/api/ai/chat-gpt" : "/api/ai/chat-dafne";
      const response = await fetch(useEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: updatedMessages,
          financialData: getEnrichedFinancialData(),
          neuralPrecision,
          neuralTier,
        }),
      });
      const resData = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { 
          sender: "dafne", 
          text: resData.text, 
          timestamp: new Date(),
          simulatedTier: resData.simulatedTier,
          simulatedTemp: resData.simulatedTemp,
        },
      ]);
      triggerVoiceIfEnabled(resData.text);
      
      // Futuristic dual-chime when Daphne's voice or advisor lands!
      sound.playAiNotification();
    } catch (err) {
      console.error("Chat error:", err);
      sound.playCriticalAlert();
      
      const lower = userText.toLowerCase();
      let msg = "Acompanhe sempre seus indicadores vitais de competência. Otimizar custos operacionais em apenas 5% pode ampliar severamente o seu saldo final de caixa.";
      if (lower.includes("cortar") || lower.includes("custo") || lower.includes("despesa") || lower.includes("opex")) {
        msg = "Para diminuir custos operacionais (OPEX), recomendo auditar licenças ativas de softwares sem uso e rever os custos de frete ou frete de entrada que corroem o lucro.";
      } else if (lower.includes("venda") || lower.includes("faturamento") || lower.includes("faturar") || lower.includes("receita") || lower.includes("lucro")) {
        msg = "Alavanque o faturamento de forma saudável focando na venda do mix de produtos com Markup adequado (mínimo de 1.8x) e evitando descontos excessivos.";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "dafne",
          text: msg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Interactive checkers state for operational tips
  const [completedSteps, setCompletedSteps] = useState<
    Record<string, Record<number, boolean>>
  >({});
  const [tipSavedFeedback, setTipSavedFeedback] = useState<
    Record<string, boolean>
  >({});

  // Simulation parameters for slider
  const [simRevenueChange, setSimRevenueChange] = useState(10); // +10%
  const [simOpexChange, setSimOpexChange] = useState(10); // -10%
  const [simCogsChange, setSimCogsChange] = useState(10); // -10%

  useEffect(() => {
    async function fetchSummary() {
      if (transactions.length === 0) {
        setSummary("Seja bem-vindo ao seu painel estratégico cru! Nenhuma movimentação financeira PJ foi cadastrada para esta empresa até o momento. Cadastre suas receitas e despesas para de imediato ativar o motor de inteligência analítica DAFNE, gerar os gráficos estratégicos e receber orientações exatas.");
        setGoalProgress([]);
        setReport("O parecer estratégico e a auditoria de metas serão calculados dinamicamente de forma síncrona assim que as primeiras transações PJ forem salvas no banco de dados.");
        setOperationalTips([]);
        setScenarios(null);
        setRisks([]);
        setAlerts([]);
        setLoading(false);
        return;
      }

      const hashKey = `fs_${income}_${expense}_${balance}_${transactions.length}_${categories.length}_${neuralPrecision}_${neuralTier}`;

      // 1. Try global in-memory cache first
      if (financialAssistantCache[hashKey]) {
        const cachedData = financialAssistantCache[hashKey];
        setSummary(cachedData.summary);
        setGoalProgress(cachedData.goalProgress || []);
        setReport(cachedData.report || "");
        setOperationalTips(cachedData.operationalTips || []);
        setScenarios(cachedData.scenarios || null);
        setRisks(cachedData.risks || []);
        setAlerts(cachedData.alerts || []);
        setLoading(false);
        return;
      }

      // 2. Try sessionStorage cache next
      try {
        const cached = sessionStorage.getItem(hashKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          financialAssistantCache[hashKey] = cachedData; // store in-memory for faster access
          setSummary(cachedData.summary);
          setGoalProgress(cachedData.goalProgress || []);
          setReport(cachedData.report || "");
          setOperationalTips(cachedData.operationalTips || []);
          setScenarios(cachedData.scenarios || null);
          setRisks(cachedData.risks || []);
          setAlerts(cachedData.alerts || []);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Storage access may be blocked in sandboxed iframes
      }

      try {
        setLoading(true);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const currentMonthTransactions = transactions.filter((t) => {
          const d = new Date(t.date);
          return (
            d.getFullYear() === currentYear && d.getMonth() === currentMonth
          );
        });

        const categoryGroupExpenses: Record<string, number> = {
          OPEX: 0,
          COGS: 0,
          TAX: 0,
          INVESTMENT: 0,
          OTHER_EXPENSE: 0,
        };

        const categoryTotals: Record<string, number> = {};

        currentMonthTransactions.forEach((t) => {
          if (t.type === "expense") {
            const category = categories.find((c) => c.id === t.categoryId);
            if (category) {
              if (category.group in categoryGroupExpenses) {
                categoryGroupExpenses[category.group] += t.amount;
              }
              categoryTotals[category.name] =
                (categoryTotals[category.name] || 0) + t.amount;
            }
          }
        });

        const topExpenseCategories = Object.entries(categoryTotals)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        const dreData = getDRE(now).map((line) => ({
          label: line.label,
          value: line.value,
          isBold: line.isBold,
        }));

        const dynamicGoals = getDynamicGoals(allTransactions, categories);

        const response = await fetch("/api/ai/financial-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              totalIncome: income,
              totalExpense: expense,
              balance,
              goals: dynamicGoals,
              dre: dreData,
              categoryGroupExpenses,
              topExpenseCategories,
              companyName: profile?.companyName || "Minha Empresa",
              products: products,
              businessSegment: localStorage.getItem("dafne_business_segment") || "other",
              businessNicheDetail: localStorage.getItem("dafne_business_niche_detail") || "",
              averageBilling: profile?.averageBilling || 0,
              billingGoal: profile?.billingGoal || 0,
              billingGoalDeadline: profile?.billingGoalDeadline || "",
              billingNotes: profile?.billingNotes || "",
              businessType: profile?.businessType || "",
              chargeModel: profile?.chargeModel || "mixed",
              averageTicket: profile?.averageTicket || 0,
              additionalGoals: profile?.additionalGoals || [],
            },
            neuralPrecision,
            neuralTier,
          }),
        });

        const data = await response.json();

        // Cache the response
        financialAssistantCache[hashKey] = data;
        try {
          sessionStorage.setItem(hashKey, JSON.stringify(data));
        } catch (e) {
          // ignore cache writing if sandbox rejects storage
        }

        setSummary(data.summary);
        setGoalProgress(data.goalProgress || []);
        setReport(data.report || "");
        setOperationalTips(data.operationalTips || []);
        setScenarios(data.scenarios || null);
        setRisks(data.risks || []);
        setAlerts(data.alerts || []);
      } catch (err) {
        console.error(err);
        setSummary(
          "Fique atento aos seus números hoje. Planeje cuidadosamente e otimize seus lucros!",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [
    income,
    expense,
    balance,
    transactions.length,
    categories.length,
    refreshTrigger,
    neuralPrecision,
    neuralTier,
  ]);

  const handleSaveTipAsNote = async (tip: any) => {
    try {
      const formattedContent = `### Anotação Estratégica da IA\n\n**Oportunidade:** ${tip.description}\n\n**Impacto:** ${tip.impact}\n**Categoria:** ${tip.category}\n\n**Plano de Ação Sugerido:**\n${tip.actionPlan}`;
      await addNote(`IA: ${tip.title}`, formattedContent);
      setTipSavedFeedback((prev) => ({ ...prev, [tip.title]: true }));
      setTimeout(() => {
        setTipSavedFeedback((prev) => ({ ...prev, [tip.title]: false }));
      }, 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPDF = () => {
    const pdf = new AbntPdfDocument();

    // 1. CAPA (ABNT Folha de Rosto)
    pdf.drawCover(
      profile?.companyName || "Minha Empresa",
      "RELATÓRIO FINANCEIRO CONSOLIDADO MENSAL E DRE",
      `Estudo Técnico de Performance Corporativa, Estruturação de CMV e Diagnóstico de Caixa`,
      "MODELAGEM DE INTELIGÊNCIA FINANCEIRA PJ"
    );

    // 2. INDICADORES GERAIS DE CAIXA
    pdf.addPrimaryHeading("1. Indicadores Gerais de Caixa");
    pdf.addParagraph(
      "O monitoramento contínuo dos recebimentos e desembolsos operacionais constitui o pilar básico da gestão de tesouraria. A análise de liquidez do período demonstra a capacidade de geração de caixa líquido livre a partir das atividades fim da empresa."
    );

    const marginPct = income > 0 ? (balance / income) * 100 : 0;
    const metricsColor = balance >= 0 ? { r: 22, g: 163, b: 74 } : { r: 220, g: 38, b: 38 };

    const metrics = [
      { label: "Faturamento Bruto", value: `R$ ${income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
      { label: "Despesa Total", value: `R$ ${expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: { r: 220, g: 38, b: 38 } },
      { label: "Saldo Líquido", value: `R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: metricsColor },
      { label: "Margem Líquida Real", value: `${marginPct.toFixed(1)}%` }
    ];

    pdf.addSummaryCard("Painel de Indicadores Consolidados", metrics);
    pdf.addParagraph(
      `Conforme demonstrado, a empresa obteve um faturamento bruto consolidado de R$ ${income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} contra despesas totais registradas de R$ ${expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, resultando em uma lucratividade líquida real do período avaliado em ${marginPct.toFixed(1)}%.`
    );

    pdf.y += 4;

    // 3. DEMONSTRATIVO DRE
    pdf.addPrimaryHeading("2. Demonstrativo de Resultado do Exercício (DRE)");
    pdf.addParagraph(
      "O DRE gerencial do período é estruturado de forma dedutiva a partir do faturamento bruto, segregando as despesas por classificações e centros de custos. Este instrumento técnico visa evidenciar a formação de margens intermediárias até a obtenção do lucro líquido ajustado:"
    );

    const currentDRE = getDRE(new Date());
    const dreColumns = [
      { header: "Conta / Classificação", key: "label", width: 85 },
      { header: "Valor Integral (R$)", key: "valueStr", width: 45, align: "right" as const },
      { header: "% Faturamento", key: "pctStr", width: 30, align: "right" as const }
    ];

    const dreData = currentDRE.map((line) => {
      const pctRevenue = income > 0 ? (line.value / income) * 100 : 0;
      return {
        label: line.label,
        valueStr: `R$ ${line.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        pctStr: `${pctRevenue.toFixed(1)}%`,
        isBold: line.isBold
      };
    });

    pdf.addAbntTable(dreColumns, dreData, "Demonstrativo Gerencial Consolidado de Contas");

    pdf.y += 6;

    // 4. QUADRO GERAL DE METAS OPERACIONAIS
    pdf.addPrimaryHeading("3. Quadro Geral de Metas Operacionais");
    pdf.addParagraph(
      "O desdobramento estratégico de objetivos quantitativos garante o alinhamento das atividades diárias às metas de sustentabilidade financeira de longo prazo estabelecidas. Apura-se a seguir o percentual médio de completude dos alvos estipulados para o período:"
    );

    const periodGoals = getDynamicGoals(allTransactions, categories);
    const goalsColumns = [
      { header: "Meta Estratégica", key: "title", width: 75 },
      { header: "Resultado Atual / Alvo", key: "execTar", width: 55 },
      { header: "Status / Percentual", key: "statusText", width: 30, align: "right" as const }
    ];

    const goalsData = periodGoals.map((goal) => {
      const isInverse = goal.inverse === true;
      let pctValue = 0;
      if (goal.target > 0) {
        if (isInverse) {
          pctValue = Math.max(0, Math.min(100, Math.round((goal.target / goal.current) * 100)));
        } else {
          pctValue = Math.max(0, Math.min(100, Math.round((goal.current / goal.target) * 100)));
        }
      }
      const curStr = goal.current.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
      const tarStr = goal.target.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
      const statusText = pctValue >= 100 ? "Alcançada" : `${pctValue}% Completa`;

      return {
        title: goal.title,
        execTar: `At: R$ ${curStr} / Meta: R$ ${tarStr}`,
        statusText: statusText
      };
    });

    pdf.addAbntTable(goalsColumns, goalsData, "Quadro Geral de Metas e Alinhamento Estratégico Corporativo");

    // 4. PROJEÇÃO DE IMPACTO DO PLANO ESTRATÉGICO (ABNT)
    pdf.y += 6;
    pdf.addPrimaryHeading("4. Projeção de Impacto do Plano Estratégico");
    pdf.addParagraph(
      "A modelagem preditiva e simulação técnica estimam a sensibilidade das principais contas operacionais sob efeito de reajustes direcionados pela diretoria de planejamento. Os cálculos estimam a eficiência e o lucro líquido em regime estável de conformidade:"
    );

    const planTypeLabel = reportStratPlan === "opex" 
      ? "Plano de Otimização de OPEX (Custo Administrativo)" 
      : reportStratPlan === "revenue" 
        ? "Plano de Expansão e Aceleração Comercial" 
        : "Plano de Redução de CMV (Suprimentos)";

    pdf.addSecondaryHeading(`Alvo Simulado: ${planTypeLabel} (${reportStratEfficacy}% de Eficácia)`);
    pdf.addParagraph(
      `Conforme calibração de eficácia estipulada no simulador integrado da empresa, projetam-se as seguintes alterações incrementais de margens e saldo operacional de tesouraria:`
    );

    const histIncome = income;
    const histExpense = expense;
    const histBalance = balance;

    let projIncome = histIncome;
    let projExpense = histExpense;
    if (reportStratPlan === "opex") {
      projExpense = histExpense - (histExpense * 0.15 * (reportStratEfficacy / 100));
    } else if (reportStratPlan === "revenue") {
      const growth = histIncome * 0.20 * (reportStratEfficacy / 100);
      projIncome = histIncome + growth;
      projExpense = histExpense + (growth * 0.30);
    } else {
      projExpense = histExpense - (histExpense * 0.08 * (reportStratEfficacy / 100));
    }
    const projBalance = projIncome - projExpense;

    const projColumns = [
      { header: "Indicador / Conta", key: "metric", width: 60 },
      { header: "Valor Histórico", key: "hist", width: 50, align: "right" as const },
      { header: "Valor Projetado", key: "proj", width: 50, align: "right" as const }
    ];

    const projData = [
      {
        metric: "Faturamento Bruto Mensal",
        hist: `R$ ${histIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        proj: `R$ ${projIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      },
      {
        metric: "Custo Operacional Mensal",
        hist: `R$ ${histExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        proj: `R$ ${projExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      },
      {
        metric: "Saldo Líquido / Caixa Livre",
        hist: `R$ ${histBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        proj: `R$ ${projBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        isBold: true
      },
      {
        metric: "Margem de Lucro Bruta / EBITDA",
        hist: `${(histIncome > 0 ? (histBalance / histIncome) * 100 : 0).toFixed(1)}%`,
        proj: `${(projIncome > 0 ? (projBalance / projIncome) * 100 : 0).toFixed(1)}%`,
        isBold: true
      }
    ];

    pdf.addAbntTable(projColumns, projData, "Dossiê Técnico de Projeção Comparativa do Plano Estratégico");

    // 5. PRECIFICAÇÃO E CMV (IF AVAILABLE)
    if (products && products.length > 0) {
      pdf.y += 6;
      pdf.addPrimaryHeading("5. Planilha de Precificação e Análise de CMV");
      pdf.addParagraph(
        "A composição científica de preços baseia-se na identificação acurada dos insumos, tributos e margem líquida requerida por SKU ou categoria de serviço. Abaixo consta o portfólio ativo mapeado:"
      );

      const productsColumns = [
        { header: "Nome do Item / Serviço", key: "name", width: 62 },
        { header: "Custo (R$)", key: "costPriceStr", width: 25, align: "right" as const },
        { header: "Preço Venda (R$)", key: "sellingPriceStr", width: 28, align: "right" as const },
        { header: "CMV (%)", key: "cmvPctStr", width: 20, align: "right" as const },
        { header: "Margem (%)", key: "profitMarginPctStr", width: 25, align: "right" as const }
      ];

      const productsData = products.map((p) => ({
        name: p.name.substring(0, 32),
        costPriceStr: `R$ ${p.costPrice.toFixed(2)}`,
        sellingPriceStr: `R$ ${p.sellingPrice.toFixed(2)}`,
        cmvPctStr: `${p.cmvPct.toFixed(1)}%`,
        profitMarginPctStr: `${p.profitMarginPct.toFixed(1)}%`
      }));

      pdf.addAbntTable(productsColumns, productsData, "Portfólio Ativo de Produtos e Prospecção Analítica");
    }

    // 6. COMENTÁRIO E DIAGNÓSTICO ESTRATÉGICO DA IA DAFNE (IF report)
    if (report) {
      pdf.y += 6;
      pdf.addPrimaryHeading("6. Parecer Técnico e Diagnóstico por Inteligência Artificial (I.A.)");
      pdf.addParagraph(
        "Emissão de parecer crítico fundamentado nas movimentações operacionais do período, desvios frente aos orçamentos estabelecidos e oportunidades de aumento imediato de eficiência:"
      );

      const reportLines = report.split("\n");
      reportLines.forEach((paragraph) => {
        const text = paragraph.trim();
        if (!text) return;

        if (text.startsWith("#")) {
          const headerClean = text.replace(/#/g, "").trim();
          pdf.addSecondaryHeading(headerClean);
        } else if (text.startsWith("* ") || text.startsWith("- ")) {
          pdf.addBulletItem("•", text.replace(/^[*-\s]+/, ""));
        } else {
          pdf.addParagraph(text);
        }
      });
    }

    // 7. SCENARIOS & RISQUES OPERACIONAIS (IF AVAILABLE)
    if (scenarios || (risks && risks.length > 0)) {
      pdf.y += 6;
      pdf.addPrimaryHeading("7. Cenários Futuros e Matriz de Riscos Críticos");
      pdf.addParagraph(
        "Análise preditiva de liquidez futura e mapeamento dos pontos de vulnerabilidade identificados pela assessoria de riscos corporativa:"
      );

      if (scenarios) {
        pdf.addSecondaryHeading("Planejamento Temporal de Cenários e Fluxos");
        pdf.addBulletItem("Curto Prazo (0-3 meses):", scenarios.shortTerm);
        pdf.addBulletItem("Médio Prazo (3-12 meses):", scenarios.mediumTerm);
        pdf.addBulletItem("Longo Prazo (>12 meses):", scenarios.longTerm);
        pdf.y += 3;
      }

      if (risks && risks.length > 0) {
        pdf.addSecondaryHeading("Matriz de Riscos e Sinais de Alerta Ativos");
        risks.forEach((risk) => {
          pdf.addBulletItem(`[${risk.severity}]`, `${risk.title}: ${risk.description}`);
        });
      }
    }

    const compiledFilename = `GESTOR_ABNT_Relatorio_Consolidado_${profile?.companyName?.replace(/\s+/g, "_") || "Empresa"}.pdf`;
    pdf.save(compiledFilename);
    showToast("Relatório Consolidado ABNT exportado com sucesso!", "success");
  };

  const toggleStepCheck = (tipTitle: string, stepIndex: number) => {
    setCompletedSteps((prev) => {
      const tipObject = prev[tipTitle] || {};
      const updatedValue = !tipObject[stepIndex];
      return {
        ...prev,
        [tipTitle]: {
          ...tipObject,
          [stepIndex]: updatedValue,
        },
      };
    });
  };

  // Profit simulations
  const simRevenue = income * (1 + simRevenueChange / 100);
  const opexPart = expense * 0.45; // Simulated OPEX portion
  const cogsPart = expense * 0.35; // Simulated COGS portion
  const otherexpPart = expense * 0.2; // Simulated constant structural expenses

  const simOpex = opexPart * (1 - simOpexChange / 100);
  const simCogs = cogsPart * (1 - simCogsChange / 100);
  const simExpense = simOpex + simCogs + otherexpPart;
  const simProfit = simRevenue - simExpense;
  const simProfitDiff = simProfit - balance;
  const simPercentImprovement =
    balance !== 0 ? (simProfitDiff / Math.abs(balance)) * 100 : 0;

  // Automated rule-based alerts to complement server side loaded alerts
  const currentMargin = income > 0 ? (balance / income) * 100 : 0;
  const isMarginLowByRule = income > 0 && currentMargin < 15;
  const isLiquidityLowByRule = balance < 1500;

  const mergedAlerts: Array<{
    type: string;
    severity: string;
    message: string;
  }> = [...alerts];
  if (
    isMarginLowByRule &&
    !alerts.some((a) => a.type?.toLowerCase().includes("margem"))
  ) {
    mergedAlerts.push({
      type: "Margem de Lucro",
      severity: "ATENÇÃO",
      message: `Sua margem líquida corrente de ${currentMargin.toFixed(1)}% está abaixo do ideal de 15% para o período.`,
    });
  }
  if (
    isLiquidityLowByRule &&
    !alerts.some((a) => a.type?.toLowerCase().includes("liquidez"))
  ) {
    mergedAlerts.push({
      type: "Liquidez Projetada",
      severity: "PREOCUPANTE",
      message: `Saldo disponível em caixa (R$ ${balance.toLocaleString("pt-BR")}) representa reserva de liquidez escassa.`,
    });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] text-[#1A1A1A] shadow-lg relative overflow-hidden group border border-orange-100"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.04] blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/[0.03] blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-500/[0.02] blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header section with profile details */}
          <div className="flex items-center justify-between gap-3 w-full border-b border-gray-150 pb-4">
            <div className="flex items-center gap-3.5">
              {/* Profile Icon representing AI */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-orange-200 shadow-sm bg-zinc-900 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-orange-400 animate-pulse" />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"
                  title="Assessoria IA Online"
                />
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-widest italic text-orange-500 flex items-center gap-2">
                  Assessoria I.A. • Lucratividade
                  <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[8px] font-bold px-2 py-0.5 rounded-full">
                    ATIVADA
                  </span>
                </h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                  Inteligência analítica de microempresas • Dicas estratégicas baseadas no DRE 💡
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const hashKey = `fs_${income}_${expense}_${balance}_${transactions.length}_${categories.length}`;
                delete financialAssistantCache[hashKey];
                try {
                  sessionStorage.removeItem(hashKey);
                } catch (e) {}
                setRefreshTrigger((prev) => prev + 1);
              }}
              disabled={loading}
              title="Recalcular Diagnóstico"
              className="p-2 gap-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 active:scale-95 transition-all text-orange-950 border border-orange-100 disabled:opacity-50 flex items-center text-[9px] uppercase font-black tracking-wider px-3.5 py-2 cursor-pointer"
            >
              <Sparkles
                size={11}
                className={cn("text-yellow-600", loading && "animate-spin")}
              />
              {loading ? "Sincronizando..." : "Sincronizar"}
            </button>
          </div>

          {/* Chat bubble body & warnings (now integrated inside Chat with I.A. tab) */}
          <div className={cn("space-y-4", activeModalTab !== "chat" && "hidden")}>
            {loading ? (
              <div className="flex items-center gap-3 py-6">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <p className="text-sm font-medium text-gray-600 animate-pulse italic">
                  A inteligência artificial está construindo sua simulação de saúde de faturamento...
                </p>
              </div>
            ) : (
              <>
                {/* Speech Bubble / Balão de Conversa */}
                <div className="relative mt-2">
                  {/* Arrow Pointing upwards towards Dafne's Avatar */}
                  <div className="absolute left-6 -top-1 w-2.5 h-2.5 bg-orange-50/70 border-l border-t border-orange-100 rotate-45 transform" />

                  <div className="relative bg-orange-50/70 border border-orange-100 rounded-2xl rounded-tl-none p-5 md:p-6 space-y-3 transition-all shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-orange-600">
                        Análise de Lucratividade:
                      </span>
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                    </div>

                    <p className="text-sm md:text-base font-medium leading-relaxed text-gray-950 italic">
                      "{summary}"
                    </p>

                    {currentIntervalTip && (
                      <div className="mt-4 pt-4 border-t border-orange-100/60 flex items-start gap-3 bg-orange-100/20 p-3 rounded-xl">
                        <span className="text-sm shrink-0">💡</span>
                        <div className="space-y-1 text-left">
                          <p className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                            Dica da DRE (Rotativa 30s):{" "}
                            {currentIntervalTip.title}
                          </p>
                          <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                            {currentIntervalTip.text}
                          </p>
                          <p className="text-[10px] text-orange-700 italic font-bold">
                            👉 {currentIntervalTip.actionPlan}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Automation Alert Warning List */}
                {mergedAlerts.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {mergedAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-[11px] font-semibold border",
                          alert.severity === "CRÍTICO" ||
                            alert.severity === "ALTÍSSIMA"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : alert.severity === "PREOCUPANTE"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-orange-50 text-orange-800 border-orange-200",
                        )}
                      >
                        <ShieldAlert
                          size={14}
                          className="shrink-0 text-orange-600"
                        />
                        <span>
                          <strong>{alert.type}:</strong> {alert.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Goals metrics list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {loading
                ? [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-50 rounded-2xl animate-pulse"
                    />
                  ))
                : goalProgress.map((goal, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60 hover:border-orange-200 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 truncate pr-2">
                          {goal.title}
                        </span>
                        <span className="text-[10px] font-black text-orange-600 italic">
                          {goal.percent}%
                        </span>
                      </div>
                      {/* Progress Bar of Goal */}
                      <div className="w-full bg-gray-200/70 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full bg-gradient-to-r",
                            goal.color || "from-orange-500 to-amber-500",
                          )}
                          style={{ width: `${Math.min(100, goal.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Central Avançada da Dafne (Inline Dashboard Section) */}
          {!loading && (
            <div className="mt-6 pt-6 border-t border-gray-150 space-y-6">
              {/* Embedded Sub-Tabs selection bar */}
              <div className="flex w-full bg-gray-100 p-1.5 rounded-2xl border border-gray-200/80 gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveModalTab("score")}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer flex items-center gap-2",
                    activeModalTab === "score"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50",
                  )}
                >
                  <Brain size={13} className={activeModalTab === "score" ? "text-white" : "text-orange-600"} />{" "}
                  Saúde Financeira Score
                </button>
                <button
                  onClick={() => setActiveModalTab("chat")}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer flex items-center gap-2",
                    activeModalTab === "chat"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50",
                  )}
                >
                  <Lightbulb
                    size={13}
                    className={activeModalTab === "chat" ? "text-white animate-pulse" : "text-yellow-600"}
                  />{" "}
                  Chat com I.A. & Lucratividade
                </button>
                <button
                  onClick={() => setActiveModalTab("report")}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer flex items-center gap-2",
                    activeModalTab === "report"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50",
                  )}
                >
                  <Bot size={13} className={activeModalTab === "report" ? "text-white" : "text-gray-600"} /> Relatório de Performance
                </button>
                <button
                  onClick={() => setActiveModalTab("scenarios")}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer flex items-center gap-2",
                    activeModalTab === "scenarios"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50",
                  )}
                >
                  <Clock size={13} className={activeModalTab === "scenarios" ? "text-white" : "text-gray-600"} /> Cenários & Riscos
                </button>
                <button
                  onClick={() => setActiveModalTab("tips")}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer flex items-center gap-2",
                    activeModalTab === "tips"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50",
                  )}
                >
                  <Sparkles size={13} className={activeModalTab === "tips" ? "text-white" : "text-yellow-600"} /> Dicas IA para Lucro
                </button>
                <button
                  onClick={() => setActiveModalTab("simulator")}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer flex items-center gap-2",
                    activeModalTab === "simulator"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50",
                  )}
                >
                  <Target size={13} className={activeModalTab === "simulator" ? "text-white" : "text-orange-600"} /> Simulador Financeiro
                </button>
                <button
                  onClick={() => setActiveModalTab("niche")}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer flex items-center gap-2",
                    activeModalTab === "niche"
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50",
                  )}
                >
                  <Zap size={13} className={activeModalTab === "niche" ? "text-white animate-pulse" : "text-orange-600"} /> Crescimento de Nicho (I.A. 🎯)
                </button>
              </div>

              {/* Dafne Intelligent Audio Narration Assistant Bar - High-Tech Neural Console */}
              <div className="bg-[#141414] text-white rounded-[2rem] p-5 border border-zinc-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
                {/* Futuristic background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
                
                {/* Left Section: AI Icon & Wave Indicator */}
                <div className="flex items-center gap-4 w-full lg:w-auto relative z-10">
                  <div className="relative shrink-0 select-none">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl overflow-hidden border-2 border-orange-500/80 bg-zinc-900 transition-all duration-300 shadow-md relative flex items-center justify-center",
                      isSpeaking && "scale-105 shadow-orange-500/30 border-orange-400"
                    )}>
                      <Brain className="w-6 h-6 text-orange-400 animate-pulse" />
                      {isSpeaking && (
                        <div className="absolute inset-0 bg-orange-500/10 animate-pulse" />
                      )}
                    </div>
                    <span className={cn(
                      "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 flex items-center justify-center transition-colors duration-350",
                      isSpeaking ? "bg-emerald-500 animate-pulse" : "bg-zinc-650"
                    )}>
                      <span className={cn("w-1 h-1 rounded-full bg-white", isSpeaking && "animate-ping")} />
                    </span>
                  </div>

                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Síntese Vocal Avançada
                      </span>
                      <span className="text-[9px] bg-[#2E7D32]/20 text-[#81C784] border border-[#2E7D32]/30 font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce inline-block" />
                        Voz Neural Suave
                      </span>
                    </div>
                    <h5 className="font-sans font-extrabold italic text-xs tracking-wider text-orange-400 mt-1 uppercase">
                      Mecanismo de Narração Neural (IA)
                    </h5>
                    <p className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                      {isSpeaking ? (
                        <span className="text-orange-300 font-extrabold flex items-center gap-1 animate-pulse">
                          🔊 Narrando: {
                            activeModalTab === "score" ? "Score de Saúde Financeira" : 
                            activeModalTab === "chat" ? "Conversação & Conselhos" : 
                            activeModalTab === "report" ? "Relatório de Performance" : 
                            activeModalTab === "scenarios" ? "Cenários & Provisão de Riscos" : 
                            activeModalTab === "tips" ? "Cartela de Dicas IA" : 
                            activeModalTab === "simulator" ? "Simulador de Projeções" : 
                            "Inteligência de Nicho Operacional"
                          }...
                        </span>
                      ) : (
                        <span>Ouça a explicação falada e as diretrizes táticas deste relatório</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Middle: Equalizer Animation */}
                {isSpeaking && (
                  <div className="flex items-end justify-center gap-1 h-7 px-3 shrink-0 relative z-10">
                    {[...Array(10)].map((_, i) => {
                      const delays = [0.15, 0.35, 0.2, 0.55, 0.3, 0.45, 0.1, 0.4, 0.25, 0.5];
                      return (
                        <div 
                          key={i} 
                          className="w-0.75 rounded-full bg-gradient-to-t from-orange-600 to-amber-300 animate-bounce transition-all duration-300"
                          style={{ 
                            animationDelay: `${delays[i]}s`, 
                            animationDuration: "0.85s",
                            height: isSpeaking ? "1.6rem" : "0.2rem"
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Right: Pitch & Controls wrapper */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto relative z-10">
                  
                  {/* Calibrator Panel */}
                  <div className="flex flex-col gap-2 bg-[#1A1A1A] p-3 rounded-2xl border border-zinc-800/80 w-full sm:w-60 text-left shrink-0">
                    {/* Pitch - Doçura / Tom da voz */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black uppercase text-zinc-400 tracking-wider">
                        <span>Doçura da Voz (Tom):</span>
                        <span className="text-orange-400 font-bold font-mono">{voicePitch.toFixed(2)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.80" 
                        max="1.30" 
                        step="0.02"
                        value={voicePitch}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVoicePitch(val);
                          sound.playTick();
                        }}
                        className="w-full h-1 bg-[#282828] rounded-lg appearance-none cursor-pointer accent-orange-500 bg-none outline-none"
                      />
                      <span className="text-[7.5px] text-zinc-500 block font-bold leading-tight uppercase font-mono">
                        {voicePitch <= 0.95 ? "Tom Grave Modular" : voicePitch <= 1.08 ? "Mentora Executiva" : voicePitch <= 1.18 ? "Voz Doce de Mentora" : "Voz Ultra Doce Aguda"}
                      </span>
                    </div>

                    {/* Rate - Velocidade de fala */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black uppercase text-zinc-400 tracking-wider">
                        <span>Velocidade de Fala:</span>
                        <span className="text-orange-400 font-bold font-mono">{voiceRate.toFixed(2)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.75" 
                        max="1.25" 
                        step="0.02"
                        value={voiceRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVoiceRate(val);
                          sound.playTick();
                        }}
                        className="w-full h-1 bg-[#282828] rounded-lg appearance-none cursor-pointer accent-orange-500 bg-none outline-none"
                      />
                    </div>

                    {/* Voice engine picker */}
                    {availableVoices.length > 1 && (
                      <div className="space-y-1 pt-1.5 border-t border-zinc-800/60 flex flex-col">
                        <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block">Mecanismo Reprodutor Ativo:</span>
                        <select
                          value={selectedVoiceName}
                          onChange={(e) => {
                            setSelectedVoiceName(e.target.value);
                            sound.playClick();
                          }}
                          className="bg-[#121212] border border-zinc-800 px-2 py-1 rounded-md text-[8.5px] font-bold text-zinc-300 tracking-wide outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="">-- Voz Feminina Doce (Automático) --</option>
                          {availableVoices.map((v, vIdx) => (
                            <option key={vIdx} value={v.name}>
                              {v.name.replace(/Microsoft|Google|Apple|Portuguese|Português/gi, "").trim()} ({v.localService ? "Local" : "Nuvem"})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Operational buttons */}
                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                    {isSpeaking ? (
                      <button
                        onClick={() => {
                          stopSpeaking();
                          sound.playClick();
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md hover:scale-95 cursor-pointer"
                      >
                        <VolumeX size={13} className="text-white" />
                        Silenciar Voz
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playClick();
                          sound.playAiNotification();
                          
                           // Synthesize the active tab report
                           let reportText = "";
                           if (activeModalTab === "score") {
                             const health = calculateHealthScore(getDRE(new Date()), transactions, simulatedCrisis, isDemoMode);
                             reportText = `Olá! Sou a assessora virtual de lucratividade baseada em Inteligência Artificial. Analisei a saúde financeira da sua empresa de forma automatizada e elaborei o seu diagnóstico gerencial. 
                             A nota de saúde financeira consolidada do seu negócio neste período é ${health.score} de dez, o que indica que sua empresa possui uma saúde descrita como ${health.level}. 
                             A minha recomendação estratégica chave para a sua gestão é: ${health.description}. 
                             Os principais fatores que observei incluem: ${health.reasons.join(". ")}.`;
                          } else if (activeModalTab === "report") {
                            if (!report) {
                              reportText = "O seu relatório estratégico de performance consolidada ainda está em fase de cálculo. Por favor, registre suas vendas e despesas operacionais no fluxo para gerar seu dossiê gerencial completo.";
                            } else {
                              reportText = `Aqui está o seu dossiê de performance consolidada sob auditoria. 
                              Identificamos um faturamento bruto acumulado de R$ ${income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} contra despesas de R$ ${expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, resultando em uma sobra líquida real de R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} com margem líquida de lucro de ${income > 0 ? ((balance / income) * 100).toFixed(1) : "zero"} por cento. 
                              Anote e estude com detalhe a seguinte análise que formulei: ${report}`;
                            }
                          } else if (activeModalTab === "scenarios") {
                            const cur = scenarios?.shortTerm || "Identifique e controle gargalos rápidos de caixa.";
                            const med = scenarios?.mediumTerm || "Revisão e renegociamento de fornecedores-chave.";
                            const lng = scenarios?.longTerm || "Escalonamento tático sustentável do modelo comercial.";
                            let risksText = "";
                            if (risks && risks?.length > 0) {
                              risksText = `Encontrei riscos sob investigação especial: ${risks.map((r, i) => `Risco número ${i+1}, ${r.title}: ${r.description}`).join(". ")}`;
                            } else {
                              risksText = "Até o momento, não detectei nenhum risco severo pendente de atenção nas suas contas.";
                            }
                            reportText = `Formulei a provisão de cenários estruturados e riscos. No Curto prazo, correspondendo de zero a três meses: ${cur}. No médio prazo, de três a doze meses: ${med}. No longo prazo, acima de doze meses: ${lng}. ${risksText}`;
                          } else if (activeModalTab === "tips") {
                            if (!operationalTips || operationalTips.length === 0) {
                              reportText = "Não identifiquei recomendações de otimização acionáveis sobressalentes para este período de dados.";
                            } else {
                              const tipsSum = operationalTips.map((tip, idx) => `Oportunidade de otimização de lucros número ${idx+1}. Linha estratégica: ${tip.category}. Título da oportunidade: ${tip.title}. Orientação tática: ${tip.description}`).join(". ");
                              reportText = `Elaborei um conjunto completo com conselhos focados na contenção de despesas e alavancagem de margens operativas. Aqui está o sumário de ações: ${tipsSum}`;
                            }
                          } else if (activeModalTab === "niche") {
                            if (!nichePlan) {
                              reportText = "O painel de inteligência de nicho operacional está aguardando parametrização. Defina o seu segmento operacional e informe o seu nicho comercial detalhado e clique em Sincronizar para que eu formule o roteiro ideal.";
                            } else {
                              const kpisSum = nichePlan.kpis?.map((k, idx) => `KPI recomendado número ${idx+1}: ${k.name}, com meta sugerida de ${k.target}`).join(". ") || "";
                              reportText = `Seguem as diretrizes de nicho inteligente formuladas sob medida para o setor de: ${nichePlan.nicheTitle}. Visão estratégica geral do ecossistema: ${nichePlan.overview}. Recomendo monitorar de perto os seguintes KPIs: ${kpisSum}.`;
                            }
                          } else if (activeModalTab === "simulator") {
                            reportText = "Este é o simulador tático de aportes composto. Altere os valores de aportes mensais, taxas de rendimento estimadas e horizontes temporais para calcular o crescimento futuro projetado de caixa disponível.";
                          } else {
                            reportText = "Central de debate estratégico ativo. Digite sua dúvida ou ative o leitor automático de dicas para receber novos briefings de forma simulada.";
                          }
                          
                          speakText(reportText);
                        }}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-black uppercase text-[10px] tracking-widest text-[#141414] px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 border-none hover:scale-95 cursor-pointer"
                      >
                        <Volume2 size={13} className="text-[#141414] animate-pulse" />
                        Ouvir Relatório Ativo
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const newMute = !sound.getMuted();
                        sound.setMute(newMute);
                        setIsSoundMuted(newMute);
                        if (!newMute) {
                          sound.playSuccess();
                        }
                        showToast(newMute ? "Efeitos sonoros cibernéticos desativados." : "Efeitos sonoros ativados!", "success");
                      }}
                      className={cn(
                        "flex-1 text-[8px] font-black uppercase tracking-wider py-1.5 border rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer",
                        !isSoundMuted 
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/20" 
                          : "bg-[#1A1A1A] text-zinc-500 border-zinc-800"
                      )}
                    >
                      <span className={cn("w-1 h-1 rounded-full", !isSoundMuted ? "bg-orange-400 animate-pulse" : "bg-zinc-500")} />
                      {!isSoundMuted ? "SND FX: ON" : "SND FX: OFF"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab content rendering inline below the bar */}
              <div className="space-y-6">
                {/* 0. Saúde Financeira Dashboard Tab (Grade 0 to 10) */}
                {activeModalTab === "score" &&
                  (() => {
                     const health = calculateHealthScore(
                       getDRE(new Date()),
                       transactions,
                       simulatedCrisis,
                       isDemoMode,
                     );
                    return (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
                          <div>
                            <h4 className="font-black uppercase italic tracking-wider text-sm text-gray-950">
                              Score de Saúde Financeira da Empresa
                            </h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                              Calculado automaticamente de acordo com as
                              planilhas do DRE e Caixa
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
                          {/* Circle Gauge Card */}
                          <div className="lg:col-span-3 bg-gray-50 border border-gray-200/60 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group/gauge">
                            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-0 group-hover/gauge:opacity-100 transition-opacity" />

                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                              Nota Consolidada
                            </span>

                            <div className="relative w-32 h-32 flex items-center justify-center">
                              {/* Radial Glow */}
                              <div
                                className={cn(
                                  "absolute inset-2 blur-xl rounded-full opacity-20 animate-pulse bg-gradient-to-tr",
                                  health.color,
                                )}
                              />

                              {/* Central Score Text */}
                              <div className="z-10 text-center">
                                <span className="text-4xl font-black italic tracking-tighter text-gray-950 font-mono">
                                  {health.score}
                                </span>
                                <span className="text-xs text-gray-500 block font-bold">
                                  de 10
                                </span>
                              </div>

                              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="50"
                                  className="stroke-gray-200"
                                  strokeWidth="8"
                                  fill="transparent"
                                />
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="50"
                                  className={cn(
                                    "transition-all duration-1000 ease-out",
                                    health.score >= 9.0
                                      ? "stroke-emerald-500"
                                      : health.score >= 7.0
                                        ? "stroke-green-500"
                                        : health.score >= 5.0
                                          ? "stroke-amber-500"
                                          : "stroke-red-500",
                                  )}
                                  strokeWidth="8"
                                  fill="transparent"
                                  strokeDasharray={`${2 * Math.PI * 50}`}
                                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - health.score / 10)}`}
                                />
                              </svg>
                            </div>

                            <div
                              className={cn(
                                "mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                health.bgLight,
                              )}
                            >
                              Saúde {health.level}
                            </div>
                          </div>

                          {/* Premium Gold Seal Card */}
                          <div className="lg:col-span-3 flex items-center justify-center">
                            <BestTechnologySeal layout="horizontal" size="sm" className="w-full h-full" />
                          </div>

                          {/* Analysis details */}
                          <div className="lg:col-span-6 bg-gray-50 border border-gray-200/60 rounded-[2rem] p-6 flex flex-col justify-between">
                            <div className="space-y-3.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">
                                Diagnóstico de Saúde IA
                              </span>
                              <p className="text-sm text-gray-800 leading-relaxed font-semibold">
                                {health.description}
                              </p>

                              <div className="border-t border-gray-200/60 pt-4">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2.5">
                                  Fatores sob Auditoria:
                                </p>
                                <div className="space-y-2.5 max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pr-2">
                                  {health.reasons.map((reason, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="flex gap-2 text-xs text-gray-700 font-medium"
                                    >
                                      <span className="text-[#f97316] font-extrabold">
                                        •
                                      </span>
                                      <span>{reason}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* WhatsApp Export Fast Tool */}
                            <button
                              onClick={() => {
                                const emojiScore = health.score >= 7 ? "🟢" : health.score >= 5 ? "🟡" : "🔴";
                                const shareText = `📊 *MaxPerformance Business - Resumo Gerencial Integrado*
━━━━━━━━━━━━━━━━━━━━━
🏢 *Empresa:* ${profile?.companyName || "Minha Empresa"}
📅 *Período:* ${format(new Date(), "MMMM / yyyy", { locale: ptBR })}

💰 *Saldo de Caixa:* R$ ${health.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📈 *Receita Estimada:* R$ ${health.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📉 *Despesa Operacional Total:* R$ ${health.totalPeriodExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

🌟 *SCORE DE SAÚDE:* ${health.score}/10 (${health.level}) ${emojiScore}
💡 *Reflexão Estratégica I.A.:* ${health.description}

🎯 *PROJEÇÕES ADICIONAIS:*
• % Margem de Contribuição: ${health.margemContribuicao.toFixed(1)}%
• Ponto de Equilíbrio (Breakeven): R$ ${health.pontoEquilibrio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Runway de Caixa: ${health.runwayDays} dias de sobrevivência

_Powered by MaxPerformance Business - Inteligência Financeira e DRE Integrado_`;
                                navigator.clipboard.writeText(shareText);
                                showToast("Resumo gerencial copiado! Envie via WhatsApp para sócios/gerentes.", "success");
                              }}
                              className="text-white bg-emerald-600 hover:bg-emerald-700 transition-all font-black text-[9px] uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 self-start sm:self-center shrink-0 border border-emerald-700/30 shadow-xs"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zM5.89 19.822c1.614.957 3.197 1.456 4.908 1.457 5.432 0 9.851-4.414 9.854-9.853.002-2.635-1.023-5.11-2.885-6.973C15.908 2.59 13.439 1.564 10.8 1.564c-5.437 0-9.854 4.415-9.856 9.856-.001 1.748.455 3.328 1.399 4.9L1.353 21.05l4.81-1.258z" />
                              </svg>
                              Compartilhar no WhatsApp
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Ponto de Equilíbrio Card */}
                            <div className="bg-gray-50 border border-gray-150 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 inline-block">
                                  Ponto de Equilíbrio
                                </span>
                                <h6 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Faturamento Mínimo</h6>
                              </div>
                              <div>
                                <span className="text-xl font-black text-gray-950 font-mono">
                                  {formatCurrency(health.pontoEquilibrio)}
                                </span>
                                <p className="text-[9px] text-gray-500 mt-1 uppercase font-semibold leading-relaxed">
                                  {health.receitaBruta >= health.pontoEquilibrio 
                                    ? "🎉 Meta de Breakeven superada! Cada venda extra agora gera lucro."
                                    : `⚠️ Faltam ${formatCurrency(health.pontoEquilibrio - health.receitaBruta)} para cobrir o custo operacional.`}
                                </p>
                              </div>
                            </div>

                            {/* Margem de Contribuição Card */}
                            <div className={cn(
                              "border p-5 rounded-2xl flex flex-col justify-between space-y-3 transition-all duration-300",
                              showMargemDetail 
                                ? "bg-orange-50/40 border-orange-200 shadow-xs" 
                                : "bg-neutral-50/50 border-neutral-200 hover:border-orange-300"
                            )}>
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 inline-block">
                                    Margem de Contribuição
                                  </span>
                                  <h6 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Eficiência de Venda</h6>
                                </div>
                                <button
                                  onClick={() => {
                                    sound.playClick();
                                    setShowMargemDetail(!showMargemDetail);
                                  }}
                                  className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0",
                                    showMargemDetail
                                      ? "bg-neutral-950 text-white border-neutral-950"
                                      : "bg-white text-orange-600 border-orange-200 hover:bg-orange-50"
                                  )}
                                >
                                  {showMargemDetail ? "Recolher ✕" : "Detalhar 🔎"}
                                </button>
                              </div>
                              <div>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="text-xl font-black text-gray-950 font-mono">
                                    {parsedContributionData.marginPct.toFixed(1)}%
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-bold font-mono">
                                    ({formatCurrency(parsedContributionData.marginVal)})
                                  </span>
                                </div>
                                <p className="text-[9px] text-gray-500 mt-1 uppercase font-semibold leading-relaxed">
                                  {parsedContributionData.marginPct >= 50 
                                    ? "🟢 Excelente margem operacional! Seu mix de produtos é altamente lucrativo."
                                    : parsedContributionData.marginPct >= 35 
                                      ? "🟡 Margem aceitável. Cobre custos operacionais primários do negócio."
                                      : "🔴 Margem sob risco. Revise precificação, impostos e CMV urgente."}
                                </p>
                              </div>
                            </div>

                            {/* Runway / Dias de Sobrevivência Card */}
                            <div className="bg-gray-50 border border-gray-150 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <span className={cn(
                                  "text-[9px] font-black uppercase px-2 py-0.5 rounded border inline-block",
                                  health.runwayDays >= 60 
                                    ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                                    : health.runwayDays >= 30 
                                      ? "text-amber-600 bg-amber-50 border-amber-100" 
                                      : "text-red-600 bg-red-50 border-red-100"
                                )}>
                                  Runway de Caixa
                                </span>
                                <h6 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dias de Sobrevivência</h6>
                              </div>
                              <div>
                                <span className="text-xl font-black text-gray-950 font-mono">
                                  {health.runwayDays} dias
                                </span>
                                <p className="text-[9px] text-gray-500 mt-1 uppercase font-semibold leading-relaxed">
                                  {health.runwayDays >= 60 
                                    ? "🟢 Fôlego confortável de caixa para decisões audaciosas."
                                    : health.runwayDays >= 30 
                                      ? "🟡 Atenção. Seu caixa cobre o custo de sobrevivência por 1 mês apenas."
                                      : "🔴 Risco de liquidez. Necessita atração de receitas urgente."}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Detalhamento Integral Avançado de Margem de Contribuição */}
                          {showMargemDetail && (
                            <div className="bg-gradient-to-br from-orange-50/50 to-white border-2 border-orange-200/80 p-6 rounded-[2rem] space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-orange-100">
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 inline-block mb-1">
                                    Governança de Lucros & Precificação
                                  </span>
                                  <h4 className="font-black uppercase italic tracking-wider text-sm text-gray-950">
                                    Detalhamento Integral da Margem de Contribuição
                                  </h4>
                                </div>
                                <div className="text-[9px] font-black tracking-widest text-[#141414] uppercase px-3 py-1 rounded-full bg-orange-400 border border-orange-500 flex items-center gap-1.5 shrink-0">
                                  <span className="w-1.5 h-1.5 bg-[#141414] rounded-full animate-pulse" />
                                  Auditado em Tempo Real
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                {/* Ladder de demonstração matemática */}
                                <div className="space-y-3 bg-white border border-gray-150 p-5 rounded-2xl shadow-xs">
                                  <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                                    Demonstrativo de Dedução Linear (Passo-a-Passo)
                                  </h5>

                                  {/* Step 1 */}
                                  <div className="flex justify-between items-center text-xs py-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 bg-orange-50 border border-orange-200 text-orange-600 font-bold rounded-md flex items-center justify-center text-[10px] shrink-0">
                                        1
                                      </span>
                                      <span className="font-semibold text-gray-700">Faturamento Bruto (ROB)</span>
                                    </div>
                                    <span className="font-bold font-mono text-gray-900">{formatCurrency(parsedContributionData.revenueGross)}</span>
                                  </div>

                                  {/* Step 2 */}
                                  <div className="flex justify-between items-center text-xs py-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-md flex items-center justify-center text-[10px] shrink-0">
                                        2
                                      </span>
                                      <span className="font-semibold text-gray-600">(-) Impostos e Deduções de Faturamento</span>
                                    </div>
                                    <span className="font-bold font-mono text-rose-600">-{formatCurrency(parsedContributionData.deductions)}</span>
                                  </div>

                                  {/* Step 3 */}
                                  <div className="flex justify-between items-center text-xs py-2 bg-gray-50/70 px-2 rounded-lg border border-dashed border-gray-200">
                                    <span className="font-bold text-gray-800">(=) Receita Operacional Líquida (ROL)</span>
                                    <span className="font-black font-mono text-gray-900">{formatCurrency(parsedContributionData.revenueNet)}</span>
                                  </div>

                                  {/* Step 4 */}
                                  <div className="flex justify-between items-center text-xs py-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 bg-orange-50 border border-orange-200 text-orange-600 font-bold rounded-md flex items-center justify-center text-[10px] shrink-0">
                                        3
                                      </span>
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-gray-600">(-) Custos de Vendas Variáveis (CMV)</span>
                                        {cmvOptimizationTarget > 0 && (
                                          <span className="text-[8px] text-orange-600 font-bold uppercase tracking-wider">
                                            (Simulando economia de {cmvOptimizationTarget}%)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-bold font-mono text-orange-600">-{formatCurrency(parsedContributionData.cmvSim)}</span>
                                  </div>

                                  {/* Step 5: Commission */}
                                  {parsedContributionData.commissionFee > 0 && (
                                    <div className="flex justify-between items-center text-xs py-2 border-b border-gray-100">
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-orange-50 border border-orange-200 text-orange-600 font-bold rounded-md flex items-center justify-center text-[10px] shrink-0">
                                          4
                                        </span>
                                        <span className="font-semibold text-gray-600">(-) Tarifa de Comissão de Venda Simulada</span>
                                      </div>
                                      <span className="font-bold font-mono text-orange-600">-{formatCurrency(parsedContributionData.commissionFee)}</span>
                                    </div>
                                  )}

                                  {/* Final Result Row */}
                                  <div className="flex justify-between items-center text-sm py-3 bg-orange-50 px-3 rounded-xl border border-orange-200 mt-2.5">
                                    <div className="flex flex-col">
                                      <span className="font-black uppercase tracking-wider text-[#141414] text-xs">(=) Margem de Contribuição Real</span>
                                      <span className="text-[9px] font-semibold text-orange-700">Retorno em Valor Absoluto</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="block font-black font-mono text-[#141414] text-base">{parsedContributionData.marginPct.toFixed(1)}%</span>
                                      <span className="text-[10px] font-bold text-orange-800 font-mono">{formatCurrency(parsedContributionData.marginVal)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Painel do Simulador de Otimização */}
                                <div className="space-y-4 bg-white border border-gray-150 p-5 rounded-2xl shadow-xs">
                                  <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                    <Sliders size={13} className="text-orange-500" />
                                    Simulador de Sensibilidade & Alavancagem
                                  </h5>
                                  <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                                    Manipule as variáveis abaixo para ver instantaneamente como a otimização de preços de insumos ou taxas impacta a sua margem de contribuição geral:
                                  </p>

                                  {/* Slider 1: CMV Reduction */}
                                  <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-gray-700">
                                      <span>Redução de Custo de Insumo (CMV)</span>
                                      <span className="font-mono text-orange-600 bg-orange-50 px-1 rounded font-bold">-{cmvOptimizationTarget}% custo</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="30" 
                                      step="5"
                                      value={cmvOptimizationTarget} 
                                      onChange={(e) => {
                                        sound.playTick();
                                        setCmvOptimizationTarget(Number(e.target.value));
                                      }}
                                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                    <div className="flex justify-between text-[7px] text-gray-400 font-bold uppercase tracking-widest pt-0.5">
                                      <span>Sem Alteração</span>
                                      <span>Negociar Fornecedores (-30%)</span>
                                    </div>
                                  </div>

                                  {/* Slider 2: Commissions */}
                                  <div className="space-y-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-gray-700">
                                      <span>Comissão Extras de Canais / CAC</span>
                                      <span className="font-mono text-orange-600 bg-orange-50 px-1 rounded font-bold">+{commissionSimRate}% tarifa</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="15" 
                                      step="1"
                                      value={commissionSimRate} 
                                      onChange={(e) => {
                                        sound.playTick();
                                        setCommissionSimRate(Number(e.target.value));
                                      }}
                                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                    <div className="flex justify-between text-[7px] text-gray-400 font-bold uppercase tracking-widest pt-0.5">
                                      <span>Sem comissão direta</span>
                                      <span>Sócio Repasse Alto (15%)</span>
                                    </div>
                                  </div>

                                  {/* AI Advice Block */}
                                  <div className="bg-orange-50/30 border border-orange-100/70 p-3.5 rounded-xl space-y-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1">
                                      <Sparkles size={11} className="text-orange-500" />
                                      Orientação Estratégica Max Performance:
                                    </span>
                                    <p className="text-[10px] text-gray-900 font-semibold leading-relaxed">
                                      {parsedContributionData.marginPct >= 50 ? (
                                        "Excelente saúde de mix econômico! Você possui uma folga notável devido à baixa incidência de custos de entrega. Aproveite para tracionar escalabilidade e expandir investimentos em OPEX estruturado."
                                      ) : parsedContributionData.marginPct >= 35 ? (
                                        "Sua margem permite uma operação equilibrada. Para otimizar, estude a possibilidade de reprecificar em lote seu estoque ou criar combos estruturados de alto valor agregado."
                                      ) : (
                                        "Alerta de margem crítica! Sua operação consome quase toda a liquidez das vendas em custos diretos. Reduza e renegocie CMVs, reduza tarifas bancárias ou aplique um ajuste imediato na tabela tarifária."
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Interactive Goal Progress Bar against Breakeven */}
                          <div className="bg-[#141414] text-white p-5 rounded-2xl border border-gray-800 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                                Progresso de Vendas vs Breakeven do Período
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {Math.round(health.receitaBruta > 0 ? (health.receitaBruta / health.pontoEquilibrio) * 100 : 0)}% Atingido
                              </span>
                            </div>
                            
                            <div className="relative w-full bg-gray-800 h-3 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-orange-600 to-amber-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, health.receitaBruta > 0 ? (health.receitaBruta / health.pontoEquilibrio) * 100 : 0)}%` }}
                              />
                            </div>
                            
                            <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-bold tracking-widest pt-1">
                              <span>Faturamento Atual: {formatCurrency(health.receitaBruta)}</span>
                              <span>Ponto de Equilíbrio: {formatCurrency(health.pontoEquilibrio)}</span>
                            </div>
                          </div>

                        {/* Interactive Warning or Ticker of I.A. seconds */}
                        <div className="bg-gradient-to-r from-orange-50/40 to-transparent p-4 rounded-2xl border border-orange-100/60 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={14} className="text-orange-500" />
                            <span>
                              Intervalo para próxima dica analítica da I.A. de
                              acordo com o DRE:
                            </span>
                          </div>
                          <div className="font-mono font-black text-orange-600 flex items-center gap-1.5 shrink-0 px-3 py-1 bg-orange-50 rounded-full border border-orange-100">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                            {secondsLeft}s
                          </div>
                        </div>

                        {/* Turnaround Module integration */}
                        {simulatedCrisis || health.score < 5.0 ? (
                          <TurnaroundModule 
                            simulatedCrisis={simulatedCrisis}
                            setSimulatedCrisis={setSimulatedCrisis}
                            transactions={transactions}
                            companyName={profile?.companyName || "Minha Empresa"}
                            setActiveTab={setActiveTab}
                          />
                        ) : (
                          <div className="bg-rose-50/25 border border-rose-100 rounded-[2rem] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                            <div className="flex gap-3 items-start text-left">
                              <ShieldAlert className="text-rose-500 shrink-0 mt-0.5 animate-pulse" size={18} />
                              <div>
                                <strong className="text-rose-950 font-bold block text-sm uppercase">💡 Módulo de Mudança de Jogo (Turnaround) Disponível</strong>
                                <span className="text-rose-700 leading-normal font-semibold text-[11px]">
                                  Se sua empresa enfrentar momentos de aperto, baixa liquidez ou desbalanceamento de custos, o <strong>Módulo de Turnaround</strong> será liberado para auxiliar no resgate do seu caixa com planos de sobrevivência de 7 dias e estratégias síncronas de fomento. Deseja testá-lo em modo de simulação?
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSimulatedCrisis(true);
                                localStorage.setItem("simulated_crisis", "true");
                                showToast("🚨 Modo de Crise Ativado! Canalizando Módulo de Mudança de Jogo.", "warning");
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[9px] uppercase tracking-widest px-4 py-3 rounded-xl cursor-pointer transition-colors shrink-0 shadow-sm hover:shadow-md border border-rose-700/35 whitespace-nowrap"
                            >
                              Ativar Simulação de Crise
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* 1. Interactive Tips Section (formerly Chat with I.A. Tab) */}
                {activeModalTab === "chat" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
                      <div>
                        <h4 className="font-black uppercase italic tracking-wider text-sm text-gray-950 flex items-center gap-2">
                          Assessoria I.A. • Lucratividade (Chat com I.A.)
                        </h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                          Consolidação analítica do DRE e planos de ação interativos para maximização de lucros
                        </p>
                      </div>
                    </div>

                    {/* SINTETIZADOR DE VOZ INTELIGENTE */}
                    <div className="bg-[#0b0b0b] text-gray-200 border-2 border-orange-500/25 rounded-2xl p-4.5 space-y-3.5 shadow-xl text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-gray-800">
                        <div className="flex items-center gap-2.5">
                          <Cpu className="w-4 h-4 text-orange-500 animate-pulse shrink-0" />
                          <div>
                            <h5 className="text-[11px] font-black uppercase tracking-wider text-white">
                              Sintetizador Vocal Neural (Speech I.A.)
                            </h5>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                              Simule a assessoria de lucratividade escutando por áudio em tempo real
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsDafneVoiceEnabled(!isDafneVoiceEnabled);
                            showToast(
                              isDafneVoiceEnabled 
                                ? "Assistente autônomo desligado." 
                                : "A assessoria de voz lerá todas as novas dicas recebidas automaticamente!", 
                              "info"
                            );
                          }}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full select-none cursor-pointer border text-[9px] font-black uppercase tracking-widest transition-all hover:scale-103",
                            isDafneVoiceEnabled 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40" 
                              : "bg-gray-900 text-gray-400 border-gray-800"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full", isDafneVoiceEnabled ? "bg-emerald-400 animate-pulse" : "bg-red-500")} />
                          {isDafneVoiceEnabled ? "AUTO-LEITOR ATIVO" : "AUTO-LEITOR INATIVO"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1">
                        {/* Pitch Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-400">
                              Tom da Voz (Pitch)
                            </span>
                            <span className="text-[9.5px] text-orange-400 font-black font-mono">
                              {voicePitch.toFixed(2)}x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.05"
                            value={voicePitch}
                            onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <p className="text-[7.5px] text-gray-500 font-bold uppercase tracking-wider">
                            {voicePitch <= 0.85 ? "Sombrio // Modulado" : voicePitch <= 1.25 ? "Voz Virtual de Mentora" : "Voz Aguda // Energética"}
                          </p>
                        </div>

                        {/* Rate Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-400">
                              Velocidade (Tempo)
                            </span>
                            <span className="text-[9.5px] text-orange-400 font-black font-mono">
                              {voiceRate.toFixed(2)}x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.05"
                            value={voiceRate}
                            onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <p className="text-[7.5px] text-gray-500 font-bold uppercase tracking-wider">
                            {voiceRate <= 0.85 ? "Leitura Cadenciada" : voiceRate <= 1.25 ? "Ritmo Humano Natural" : "Frequência Ultra-Instantânea"}
                          </p>
                        </div>
                      </div>

                      {/* Speaking indicator soundwave bar */}
                      {isSpeaking && (
                        <div className="flex items-center justify-between bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-end gap-0.5 h-3.5">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{
                                    height: ["3px", "13px", "3px"],
                                  }}
                                  transition={{
                                    duration: 0.4 + i * 0.08,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                  }}
                                  className="w-[2.5px] bg-orange-500 rounded-full"
                                />
                              ))}
                            </div>
                            <span className="text-[9px] text-orange-300 font-black uppercase tracking-widest animate-pulse">
                              Transmitindo ondas de áudio vocais agora...
                            </span>
                          </div>
                          <button
                            onClick={stopSpeaking}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[8px] uppercase tracking-wider px-3 py-1 rounded border border-rose-400 cursor-pointer transition-colors"
                          >
                            Silenciar
                          </button>
                        </div>
                      )}

                      {/* Efeitos Cibernéticos Sonoros Custom Toggle */}
                      <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-950/40 border border-gray-800/80 rounded-xl p-3 gap-3">
                        <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
                          {isSoundMuted ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-orange-500 animate-pulse shrink-0" />
                          )}
                          <div>
                            <span className="text-[9.5px] font-black uppercase text-white tracking-wider block">
                              Sons de Alta Tecnologia (Sound FX)
                            </span>
                            <span className="text-[7.5px] text-gray-400 font-bold uppercase tracking-widest block leading-tight">
                              Saldos, lançamentos reais e picos de IA sintetizados em áudio digital
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newMuted = !isSoundMuted;
                            sound.setMute(newMuted);
                            setIsSoundMuted(newMuted);
                            if (!newMuted) {
                              sound.playSuccess();
                            }
                            showToast(
                              newMuted 
                                ? "Efeitos sonoros cibernéticos silenciados." 
                                : "Efeitos sonoros reativados!", 
                              "success"
                            );
                          }}
                          className={cn(
                            "flex items-center justify-center gap-1.5 px-3 py-1 rounded-md border text-[8px] font-black uppercase tracking-wider transition-all hover:scale-103 cursor-pointer self-stretch sm:self-auto",
                            !isSoundMuted 
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/35" 
                              : "bg-gray-800 text-gray-400 border-gray-700"
                          )}
                        >
                          <div className={cn("w-1.5 h-1.5 rounded-full", !isSoundMuted ? "bg-orange-400 animate-pulse" : "bg-gray-500")} />
                          {!isSoundMuted ? "Sons Ativos" : "Sons Mudos"}
                        </button>
                      </div>
                    </div>

                    {/* Quick Selection Chips */}
                    <div className="flex flex-wrap gap-2 py-1.5 border-b border-gray-200/60">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 self-center mr-1">
                        Solicitar Dica Rápida:
                      </span>
                      <button
                        onClick={() =>
                          requestDynamicTip(
                            "Redução de Custos OPEX (Despesas Operacionais)",
                          )
                        }
                        className="bg-gray-100 hover:bg-orange-500/10 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        💡 OPEX
                      </button>
                      <button
                        onClick={() =>
                          requestDynamicTip(
                            "Otimização de CMV (Custo de Mercadorias Vendidas)",
                          )
                        }
                        className="bg-gray-100 hover:bg-orange-500/10 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        📦 CMV
                      </button>
                      <button
                        onClick={() =>
                          requestDynamicTip(
                            "Gestão Inteligente de Fluxo de Caixa",
                          )
                        }
                        className="bg-gray-100 hover:bg-orange-500/10 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        📈 Fluxo de Caixa
                      </button>
                      <button
                        onClick={() =>
                          requestDynamicTip(
                            "Estratégias de Lucro Líquido e Margens",
                          )
                        }
                        className="bg-gray-100 hover:bg-orange-500/10 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        💰 Lucro Líquido
                      </button>
                      <button
                        onClick={() =>
                          requestDynamicTip(
                            "Alíquotas e Configurações de Impostos",
                          )
                        }
                        className="bg-gray-100 hover:bg-orange-500/10 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        ⚖️ Impostos
                      </button>
                    </div>

                    <div className="bg-gray-50 border border-gray-200/80 rounded-3xl p-4 h-80 overflow-y-auto flex flex-col gap-3.5 scrollbar-thin scrollbar-thumb-gray-250 scrollbar-track-transparent">
                      {chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={cn(
                            "max-w-[85%] rounded-2xl p-4.5 text-xs font-medium space-y-1.5 relative group/msg text-left",
                            msg.sender === "user"
                              ? "bg-orange-50 text-orange-950 border border-orange-200 self-end rounded-tr-none shadow-sm"
                              : "bg-white text-gray-900 self-start rounded-tl-none border border-gray-200/60 shadow-sm",
                          )}
                        >
                          <div className="leading-relaxed">
                            <SlimMarkdown text={msg.text} />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4 mt-1.5 opacity-65 text-[9px] uppercase font-bold tracking-widest">
                            <span>
                              {msg.sender === "user" ? "Sua solicitação" : "Análise Estratégica"} •{" "}
                              {new Date(msg.timestamp).toLocaleTimeString(
                                "pt-BR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>

                          {msg.sender === "dafne" && (
                            <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-gray-100/60">
                              {/* Vocal Player Buttons */}
                              {activeSpokenText === msg.text && isSpeaking ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    stopSpeaking();
                                  }}
                                  className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 border border-rose-400 px-2.5 py-1 rounded-md text-white font-black text-[8px] uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  <X className="w-2 h-2" /> Parar Voz
                                  <div className="flex items-end gap-0.5 h-2 ml-1">
                                    {[1, 2, 3].map((i) => (
                                      <motion.div
                                        key={i}
                                        animate={{
                                          height: ["2px", "8px", "2px"],
                                        }}
                                        transition={{
                                          duration: 0.5 + i * 0.1,
                                          repeat: Infinity,
                                          repeatType: "reverse",
                                        }}
                                        className="w-[1.2px] bg-white rounded-full"
                                      />
                                    ))}
                                  </div>
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakText(msg.text);
                                  }}
                                  className="flex items-center gap-1 bg-gray-100 hover:bg-orange-500 hover:text-white border border-gray-200/80 px-2 py-1 rounded-md text-gray-600 font-black text-[8px] uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  <PlayCircle className="w-2.5 h-2.5 text-orange-500 group-hover:text-white shrink-0" /> Ouvir Dica
                                </button>
                              )}

                              {/* Neural Cognitive Badges */}
                              {msg.simulatedTier && (
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight",
                                  msg.simulatedTier === "quantum" 
                                    ? "bg-purple-500/10 text-purple-600 border border-purple-200/50" 
                                    : msg.simulatedTier === "flash"
                                    ? "bg-amber-500/10 text-amber-600 border border-amber-200/50"
                                    : "bg-emerald-500/10 text-emerald-600 border border-emerald-200/50"
                                )}>
                                  {msg.simulatedTier === "quantum" ? "🌌 QUANTUM LINK" : msg.simulatedTier === "flash" ? "⚡ FLASH LINK" : "🧠 PRO LINK"} (t={msg.simulatedTemp !== undefined ? msg.simulatedTemp.toFixed(1) : "0.7"})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="bg-white text-gray-600 self-start rounded-2xl rounded-tl-none p-4 text-xs font-medium border border-gray-200 animate-pulse flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                          <span>A I.A. está formulando uma recomendação personalizada...</span>
                        </div>
                      )}
                    </div>

                    {/* Msg input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && sendChatMessage()
                        }
                        placeholder="Peça uma dica específica para a I.A. (Ex: Como reduzir custos de marketing?)..."
                        className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-colors"
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={chatLoading}
                        className="bg-orange-500 hover:bg-orange-600 transition-colors active:scale-95 text-white font-black uppercase tracking-widest text-[10px] px-5 py-3.5 rounded-2xl cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        Solicitar
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Performance Report */}
                {activeModalTab === "report" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="font-black uppercase italic tracking-wider text-sm text-gray-950 flex items-center gap-2">
                          <span className="w-2.5 h-5 bg-[#f97316] rounded-xs block"></span>
                          Dossiê de Performance & Fechamento Consolidado
                        </h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                          Visão holística e auditoria qualificada de todos os indicadores do negócio
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            const hashKey = `fs_${income}_${expense}_${balance}_${transactions.length}_${categories.length}`;
                            delete financialAssistantCache[hashKey];
                            try {
                              sessionStorage.removeItem(hashKey);
                            } catch (e) {}
                            setRefreshTrigger((prev) => prev + 1);
                          }}
                          disabled={loading}
                          className="flex-1 sm:flex-initial bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-950 font-black uppercase tracking-widest text-[9px] px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-orange-100 disabled:opacity-50"
                        >
                          <Sparkles
                            size={11}
                            className={cn(
                              "text-yellow-600",
                              loading && "animate-spin",
                            )}
                          />{" "}
                          {loading ? "Processando..." : "Recalcular IA"}
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="flex-1 sm:flex-initial bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black uppercase tracking-widest text-[9px] px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-orange-200"
                        >
                          <Download size={11} className="text-white" />{" "}
                          Relatório Completo (PDF)
                        </button>
                      </div>
                    </div>

                    {/* Consolidated Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-4.5 space-y-1 shadow-2xs hover:shadow-sm transition-all duration-300">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Faturamento do Período</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-900 leading-none">R$ {income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
                        </div>
                        <p className="text-[9.5px] text-green-600 font-extrabold flex items-center gap-0.5">
                          <ArrowUpCircle size={10} className="inline" /> Entrada Ativa
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-4.5 space-y-1 shadow-2xs hover:shadow-sm transition-all duration-300">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Despesa Registrada</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-900 leading-none">R$ {expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <p className="text-[9.5px] text-red-500 font-extrabold flex items-center gap-0.5">
                          <ArrowDownCircle size={10} className="inline" /> Drenagem Recorrente
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-4.5 space-y-1 shadow-2xs hover:shadow-sm transition-all duration-300">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Resultado Operacional</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn("text-base font-black leading-none", balance >= 0 ? "text-green-600" : "text-red-600")}>
                            R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-600 font-extrabold">
                          Sobra Líquida Real
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-4.5 space-y-1 shadow-2xs hover:shadow-sm transition-all duration-300">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Margem Líquida Real</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn("text-base font-black leading-none", balance >= 0 ? "text-green-600" : "text-red-600")}>
                            {income > 0 ? ((balance / income) * 100).toFixed(1) : "0.0"}%
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-600 font-extrabold">
                          Taxa de Conversão de Lucro
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: DRE and AI Report */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* Interactive DRE Spreadsheet Grid */}
                        <div className="bg-white border border-gray-200/80 rounded-[2rem] p-6 shadow-2xs space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                              <h5 className="font-extrabold uppercase text-xs text-gray-950">Demonstrativo DRE Completo</h5>
                              <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mt-1">Conformidade fiscal e gerencial agregada</p>
                            </div>
                            <span className="text-[9px] bg-slate-100 text-slate-600 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Mapeamento Real</span>
                          </div>

                          <div className="divide-y divide-gray-100 text-xs overflow-hidden max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pr-1">
                            {getDRE(new Date()).map((item, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "py-2.5 flex justify-between items-center transition-all",
                                  item.isBold ? "font-black bg-slate-50/70 px-2.5 rounded-xl text-slate-900 border-y border-slate-100" : "text-gray-600 px-1"
                                )}
                              >
                                <span className={cn(item.isBold ? "text-slate-950 font-black" : "text-gray-600 font-medium")}>{item.label}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold">R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                  <span className="text-[9.5px] text-slate-400 font-medium w-10 text-right">
                                    {income > 0 ? ((item.value / income) * 100).toFixed(1) : "0.0"}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Qualitative Strategic AI Advisor Output */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-[2rem] p-6 space-y-4">
                          <div className="flex items-center gap-2.5 border-b border-slate-200/50 pb-3">
                            <Bot size={18} className="text-[#f97316]" />
                            <div>
                              <h5 className="font-extrabold uppercase text-xs text-slate-900">Diagnóstico Estratégico do Painel I.A.</h5>
                              <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-1">Diretrizes da Inteligência Artificial</p>
                            </div>
                          </div>

                          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pr-1 text-xs text-slate-850 leading-relaxed font-sans scroll-smooth">
                            {report ? (
                              <SlimMarkdown text={report} />
                            ) : (
                              <div className="text-center py-12 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                                Nenhum diagnóstico ativo. Realize novos lançamentos para alimentar sua mentora.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Goals and Products & CMV */}
                      <div className="lg:col-span-5 space-y-6">
                        {/* Dynamic Active Financial Goals */}
                        <div className="bg-white border border-gray-200/80 rounded-[2rem] p-6 shadow-2xs space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                              <h5 className="font-extrabold uppercase text-xs text-gray-950">Acompanhamento de Metas Ativas</h5>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mt-1">Progresso para o equilíbrio de caixa</p>
                            </div>
                            <Target size={15} className="text-[#f97316]" />
                          </div>

                          <div className="space-y-4">
                            {getDynamicGoals(allTransactions, categories).map((goal, gIdx) => {
                              const isInverse = goal.inverse === true;
                              let pct = 0;
                              if (goal.target > 0) {
                                if (isInverse) {
                                  pct = Math.max(0, Math.min(100, Math.round((goal.target / goal.current) * 100)));
                                } else {
                                  pct = Math.max(0, Math.min(100, Math.round((goal.current / goal.target) * 100)));
                                }
                              }

                              return (
                                <div key={gIdx} className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-extrabold text-slate-800">{goal.title}</span>
                                    <span className={cn("font-black px-2 py-0.5 rounded-lg text-[10px] uppercase", pct >= 100 ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                                      {pct >= 100 ? "Concluída" : `${pct}%`}
                                    </span>
                                  </div>
                                  
                                  {/* Progress bar wrapper */}
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full transition-all duration-500", goal.color || "bg-orange-500")}
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>

                                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                                    <span>Atual: R$ {goal.current.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
                                    <span>Meta: R$ {goal.target.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Active Portfolio Cost Price & CMV Grid */}
                        <div className="bg-white border border-gray-200/80 rounded-[2rem] p-6 shadow-2xs space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                              <h5 className="font-extrabold uppercase text-xs text-gray-950">Precificação & CMV de Produtos</h5>
                              <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mt-1">Margens e custos integrados no portfólio</p>
                            </div>
                            <span className="text-[10px] bg-orange-50 text-orange-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Planilha</span>
                          </div>

                          {products && products.length > 0 ? (
                            <div className="divide-y divide-gray-100 text-[11px] max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pr-1">
                              {products.slice(0, 6).map((product, pIdx) => (
                                <div key={pIdx} className="py-2.5 flex justify-between items-center hover:bg-slate-50/50 px-1 rounded-lg transition-all">
                                  <div>
                                    <span className="font-black text-slate-800 block leading-tight">{product.name}</span>
                                    <span className="text-[9.5px] text-slate-400">Custo: R$ {product.costPrice.toFixed(2)} | Venda: R$ {product.sellingPrice.toFixed(2)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className={cn("font-bold block text-xs", product.cmvPct > 45 ? "text-red-500" : "text-green-600")}>
                                      CMV: {product.cmvPct.toFixed(1)}%
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-medium font-mono">Margem Real: {product.profitMarginPct.toFixed(1)}%</span>
                                  </div>
                                </div>
                              ))}
                              {products.length > 6 && (
                                <p className="text-center text-[9px] font-bold text-orange-500 mt-2 hover:underline cursor-pointer">
                                  + {products.length - 6} produtos adicionais (visíveis na planilha e no PDF)
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-400 text-[11px]">
                              Nenhum produto cadastrado na planilha de precificação ativa.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* INOVAÇÃO: PLANO ESTRATÉGICO & SIMULADOR DE IMPACTO DE MARGEM */}
                    <div id="strategic-plan-impact-analysis" className="bg-gradient-to-br from-[#12131C] via-[#1A1D2D] to-[#0E1018] p-6 md:p-8 rounded-[2.5rem] border border-orange-500/20 shadow-xl space-y-6 text-white relative overflow-hidden mt-6">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />

                      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                        <div className="space-y-1 text-left">
                          <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-400/20 rounded-full px-2.5 py-0.5 text-[9px] text-orange-300 font-bold uppercase tracking-widest font-mono">
                            <Sparkles size={11} className="animate-spin" style={{ animationDuration: "12s" }} /> Simulador Estratégico Corporativo
                          </div>
                          <h4 className="text-sm md:text-base font-black tracking-tight uppercase text-white flex items-center gap-2">
                            <Target size={16} className="text-orange-400" /> Impacto Multidisciplinar de Planos de Ação PJ
                          </h4>
                          <p className="text-slate-400 text-[10px] md:text-xs">Estime as alavancas do seu negócio e analise em tempo real os efeitos de sobrevivência de caixa (Runway) e EBITDA.</p>
                        </div>

                        {/* Switch Plan buttons */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1 flex-wrap shrink-0">
                          <button
                            onClick={() => setReportStratPlan("opex")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                              reportStratPlan === "opex"
                                ? "bg-orange-500 text-white shadow-md border-orange-400"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            Otimizar OPEX
                          </button>
                          <button
                            onClick={() => setReportStratPlan("revenue")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                              reportStratPlan === "revenue"
                                ? "bg-orange-500 text-white shadow-md border-orange-400"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            Expansão de Canais
                          </button>
                          <button
                            onClick={() => setReportStratPlan("cmv")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                              reportStratPlan === "cmv"
                                ? "bg-orange-500 text-white shadow-md border-orange-400"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            Otimizar CMV
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                        {/* Sliders and Plan description */}
                        <div className="lg:col-span-12 xl:col-span-5 bg-white/[0.02] border border-white/[0.05] p-5 rounded-3xl flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <h5 className="text-xs uppercase font-extrabold text-orange-400 tracking-wider text-left">Metodologia e Foco do Alvo</h5>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-sans text-left">
                              {reportStratPlan === "opex" && "Configura ações cirúrgicas para cortes de SaaS não utilizados, renegociação de tarifas e congelamento de despesas de escritório secundárias. Almeja diminuir a taxa de queima de OPEX em até 15%."}
                              {reportStratPlan === "revenue" && "Direciona novas campanhas, abertura de canais comerciais parceiros, upsell e combos de fidelização. Almeja ampliar a receita recorrente bruta em até 20%."}
                              {reportStratPlan === "cmv" && "Estabelece auditorias de fornecedores, compra agrupada de insumos e refinamento de matéria-prima. Almeja aumentar a margem reduzindo custos de CMV em até 8%."}
                            </p>

                            {/* Efficiency Slider */}
                            <div className="space-y-2 pt-2 text-left">
                              <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-300">
                                <span>Eficácia na Execução:</span>
                                <span className="font-mono text-xs font-black text-orange-400">
                                  {reportStratEfficacy}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={reportStratEfficacy}
                                onChange={(e) => setReportStratEfficacy(parseInt(e.target.value))}
                                className="w-full accent-orange-450 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                              />
                              <span className="text-[9px] text-zinc-455 font-medium font-sans italic block">
                                {reportStratEfficacy < 40 ? "⚠️ Execução Parcial/Tímida" : reportStratEfficacy < 75 ? "⚡ Ritmo Operacional Saudável" : "🔥 Alta Eficácia e Entrega Corporativa"}
                              </span>
                            </div>
                          </div>

                          <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-2xl text-[10px] sm:text-[11px] text-orange-300 leading-normal text-left">
                            <strong className="block font-extrabold mb-0.5 uppercase tracking-wide">💡 Dica de Monitoramento</strong>
                            A simulação é incorporada diretamente na exportação do seu Relatório Consolidado para apresentação executiva.
                          </div>
                        </div>

                        {/* Interactive Outcomes side-by-side */}
                        <div className="lg:col-span-12 xl:col-span-7 bg-white/[0.02] border border-white/[0.05] p-5 rounded-3xl space-y-5">
                          <h5 className="text-xs uppercase font-extrabold text-[#9ca3af] tracking-wider text-left">Prospecção de Indicadores PJ</h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            {/* Projections values */}
                            {(() => {
                              const histInc = income;
                              const histExp = expense;
                              const histBal = balance;
                              const histMar = histInc > 0 ? (histBal / histInc) * 100 : 0;

                              let projInc = histInc;
                              let projExp = histExp;
                              if (reportStratPlan === "opex") {
                                projExp = histExp - (histExp * 0.15 * (reportStratEfficacy / 100));
                              } else if (reportStratPlan === "revenue") {
                                const gain = histInc * 0.20 * (reportStratEfficacy / 100);
                                projInc = histInc + gain;
                                projExp = histExp + (gain * 0.30);
                              } else {
                                projExp = histExp - (histExp * 0.08 * (reportStratEfficacy / 100));
                              }
                              const projBal = projInc - projExp;
                              const projMar = projInc > 0 ? (projBal / projInc) * 100 : 0;

                              // Liquid buffer assumed R$ 75,000 for realistic simulation
                              const currentRunway = histExp > 0 ? (75000 + (histBal > 0 ? histBal : 0)) / histExp : 12;
                              const projectedRunway = projExp > 0 ? (75000 + (projBal > 0 ? projBal : 0)) / projExp : 12;

                              return (
                                <>
                                  {/* Item 1: Balance / EBITDA */}
                                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03] space-y-1.5">
                                    <span className="text-[10px] text-[#9ca3af] uppercase font-bold block">Margem e Lucro EBITDA</span>
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-[10px] text-slate-400">Anterior:</span>
                                      <span className="text-xs font-mono font-bold text-gray-300">{histMar.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-[10px] text-slate-400">Projetada:</span>
                                      <span className={cn("text-sm font-mono font-black", projMar >= histMar ? "text-emerald-400" : "text-rose-400")}>
                                        {projMar.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1 font-sans">
                                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(5, projMar))}%` }} />
                                    </div>
                                  </div>

                                  {/* Item 2: Runway (Meses de Caixa) */}
                                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03] space-y-1.5">
                                    <span className="text-[10px] text-[#9ca3af] uppercase font-bold block">Autossuficiência (Runway)</span>
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-[10px] text-slate-400">Anterior:</span>
                                      <span className="text-xs font-mono font-bold text-gray-300">{currentRunway.toFixed(1)} meses</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-[10px] text-slate-400">Projetada:</span>
                                      <span className={cn("text-sm font-mono font-black", projectedRunway >= currentRunway ? "text-emerald-400" : "text-rose-400")}>
                                        {projectedRunway.toFixed(1)} meses
                                      </span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1 font-sans">
                                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(100, (projectedRunway / 24) * 100)}%` }} />
                                    </div>
                                  </div>

                                  {/* Item 3: Saldo Projetado */}
                                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03] sm:col-span-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] text-[#9ca3af] uppercase font-bold">Resumo Financeiro Mensal Projetado</span>
                                      <span className="text-[8.5px] font-mono px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Impacto Positivo
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                      <div>
                                        <span className="text-[9px] text-slate-400 uppercase block">Faturamento Estimado</span>
                                        <span className="text-xs font-mono font-black text-gray-150">
                                          <AnimatedNumber value={projInc} formatter={formatCurrency} />
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-slate-400 uppercase block">Custo Operacional Estimado</span>
                                        <span className="text-xs font-mono font-black text-gray-150">
                                          <AnimatedNumber value={projExp} formatter={formatCurrency} type="expense" />
                                        </span>
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-white/[0.04] flex justify-between items-center">
                                      <div>
                                        <span className="text-[9px] text-orange-300 font-extrabold uppercase">Sobra Residual de Caixa</span>
                                        <p className="text-sm font-mono font-black text-white">
                                          <AnimatedNumber value={projBal} formatter={formatCurrency} />
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[8px] text-slate-400 font-bold block">Delta de Ganho Mensal:</span>
                                        <span className="text-xs font-mono font-black text-emerald-400">
                                          + <AnimatedNumber value={projBal - histBal} formatter={formatCurrency} />
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Scenarios & Risks */}
                {activeModalTab === "scenarios" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-black uppercase italic tracking-wider text-sm text-gray-950">
                        Cenários Práticos & Provisão de Riscos
                      </h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                        Visão de curto, médio e longo prazo baseada nos custos
                        declarados
                      </p>
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 border border-gray-200/60 hover:border-orange-200 transition-all rounded-[2rem] p-5 space-y-3 shadow-sm">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                          <Clock size={15} className="text-orange-500" />
                          <span className="font-black text-[10px] uppercase tracking-wider text-gray-950">
                            Curto Prazo (0-3 meses)
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                          {scenarios?.shortTerm ||
                            "Identifique e controle gargalos rápidos de caixa. Foco em acumular margem livre e postergar despesas de OPEX não emergenciais."}
                        </p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200/60 hover:border-orange-200 transition-all rounded-[2rem] p-5 space-y-3 shadow-sm">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                          <Target size={15} className="text-orange-500" />
                          <span className="font-black text-[10px] uppercase tracking-wider text-gray-950">
                            Médio Prazo (3-12 meses)
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                          {scenarios?.mediumTerm ||
                            "Revisão e renegociamento de fornecedores-chave para solidificar custos de CMV. Implementação de metas de produtividade operativa automática."}
                        </p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200/60 hover:border-orange-200 transition-all rounded-[2rem] p-5 space-y-3 shadow-sm">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                          <Zap size={15} className="text-yellow-600" />
                          <span className="font-black text-[10px] uppercase tracking-wider text-gray-950">
                            Longo Prazo (12+ meses)
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                          {scenarios?.longTerm ||
                            "Escalonamento sustentável do modelo comercial e ampliação de investimentos em automação de canais digitais de faturamento seguro."}
                        </p>
                      </div>
                    </div>

                    {/* Risks section */}
                    <div className="space-y-3.5 pt-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={16} className="text-orange-500" />
                        <h4 className="font-black uppercase tracking-wider text-xs text-gray-950">
                          Perigos Potenciais Sob Investigação
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {risks && risks.length > 0 ? (
                           risks.map((risk, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 border border-gray-200 rounded-2xl p-4.5 space-y-2 shadow-sm"
                            >
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-black text-xs text-gray-950 uppercase truncate">
                                  {risk.title}
                                </span>
                                <span
                                  className={cn(
                                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0",
                                    risk.severity === "CRÍTICO" ||
                                      risk.severity === "ALTO"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-amber-50 text-amber-850 border-amber-200",
                                  )}
                                >
                                  {risk.severity}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                                {risk.description}
                              </p>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4.5 space-y-2 shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-black text-xs text-gray-950 uppercase">
                                  Gargalo de Sobrevivência
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-50 text-amber-850 border border-amber-200">
                                  Médio
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Contas fixas representam parcela expressiva do
                                OPEX. Monitoramento necessário nos próximos 90
                                dias.
                              </p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4.5 space-y-2 shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-black text-xs text-gray-950 uppercase">
                                  Perigo Operacional fiscal
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                  Alto
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Oscilações na alíquota e descaso contábil
                                reduzem lucros brutos se novas tabelas não forem
                                consultadas.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Tips & Checklists */}
                {activeModalTab === "tips" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-black uppercase italic tracking-wider text-sm text-gray-950">
                        Cartela de Otimização Prática de Lucros
                      </h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                        Planos acionáveis para cortar custos de CMV, OPEX ou
                        contingências administrativas
                      </p>
                    </div>

                    <div className="grid gap-4.5">
                      {operationalTips && operationalTips.length > 0 ? (
                        operationalTips.map((tip, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 border border-gray-200/60 rounded-[2rem] p-5 md:p-6 space-y-4 shadow-sm"
                          >
                            <div className="flex justify-between items-start gap-4 flex-wrap">
                              <div className="space-y-1">
                                <span className="bg-orange-55 text-orange-600 border border-orange-200 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded">
                                  {tip.category}
                                </span>
                                <h5 className="text-base font-black text-gray-950 italic uppercase tracking-tight mt-1">
                                  {tip.title}
                                </h5>
                              </div>
                              <span
                                className={cn(
                                  "font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0",
                                  tip.impact === "ALTO"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-[#FFFbeb] text-yellow-800 border-yellow-250",
                                )}
                              >
                                Impacto: {tip.impact}
                              </span>
                            </div>

                            <p className="text-xs md:text-sm text-gray-700 font-medium">
                              {tip.description}
                            </p>

                            <div className="bg-white border border-gray-200/80 p-4 rounded-xl">
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2.5">
                                Passos para Colocar em Ação:
                              </p>
                              <div className="space-y-2">
                                {tip.actionPlan
                                  .split("\n")
                                  .filter((step: string) => step.trim() !== "")
                                  .map((step: string, sIdx: number) => {
                                    const isChecked =
                                      !!completedSteps[tip.title]?.[sIdx];
                                    return (
                                      <div
                                        key={sIdx}
                                        onClick={() =>
                                          toggleStepCheck(tip.title, sIdx)
                                        }
                                        className="flex items-start gap-2.5 select-none cursor-pointer group/item py-1"
                                      >
                                        <div
                                          className={cn(
                                            "w-4.5 h-4.5 rounded border flex items-center justify-center transition-all shrink-0 mt-0.5",
                                            isChecked
                                              ? "bg-orange-500 border-orange-500 text-white shadow"
                                              : "border-gray-300 group-hover/item:border-orange-500",
                                          )}
                                        >
                                          {isChecked && (
                                            <CheckCircle2
                                              size={10}
                                              className="stroke-[3]"
                                            />
                                          )}
                                        </div>
                                        <span
                                          className={cn(
                                            "text-xs font-semibold transition-all duration-300",
                                            isChecked
                                              ? "text-gray-400 line-through"
                                              : "text-gray-800 group-hover/item:text-orange-600",
                                          )}
                                        >
                                          {step.replace(/^\d+\.\s*/, "")}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleSaveTipAsNote(tip)}
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer",
                                  tipSavedFeedback[tip.title]
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                                    : "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-500 hover:text-white hover:border-orange-500",
                                )}
                              >
                                {tipSavedFeedback[tip.title]
                                  ? "✓ Salva em Anotações!"
                                  : "Salvar no Bloco de Anotações"}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-gray-50/50 border border-dashed border-gray-200 rounded-[2rem] p-6 space-y-2">
                          <AlertCircle className="mx-auto text-amber-500" size={32} />
                          <h6 className="text-xs uppercase font-extrabold text-gray-900 tracking-wider">Aguardando Lançamentos</h6>
                          <p className="text-[10.5px] text-gray-550 leading-relaxed max-w-sm mx-auto font-medium">
                            Com a plataforma limpa e crua, as dicas automáticas e os diagnósticos táticos de saúde financeira de DAFNE serão liberados imediatamente após você registrar suas primeiras transações ou contas PJ.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Simulators */}
                {activeModalTab === "simulator" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-black uppercase italic tracking-wider text-sm text-gray-950">
                        Simulador de Alavancagem & Sobra de Caixa
                      </h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                        Calcule de imediato a sobra de caixa caso as metas
                        propostas pela assessoria Inteligente sejam efetuadas
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200/80 rounded-3xl p-6 space-y-6 text-gray-950 shadow-sm">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-wide">
                              Aumento Esperado de Receitas:
                            </span>
                            <span className="text-emerald-600 font-black font-mono">
                              +{simRevenueChange}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="60"
                            step="1"
                            value={simRevenueChange}
                            onChange={(e) =>
                              setSimRevenueChange(Number(e.target.value))
                            }
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-wide">
                              Redução Planejada de OPEX (Custos Fixos):
                            </span>
                            <span className="text-orange-600 font-black font-mono">
                              -{simOpexChange}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            step="1"
                            value={simOpexChange}
                            onChange={(e) =>
                              setSimOpexChange(Number(e.target.value))
                            }
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-bold uppercase tracking-wide">
                              Redução Planejada de CMV / Custos Variáveis:
                            </span>
                            <span className="text-orange-600 font-black font-mono">
                              -{simCogsChange}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            step="1"
                            value={simCogsChange}
                            onChange={(e) =>
                              setSimCogsChange(Number(e.target.value))
                            }
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 space-y-1.5 shadow-sm">
                          <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                            Métricas Financeiras Atuais
                          </p>
                          <div className="flex justify-between pt-1">
                            <span className="text-xs text-gray-500">
                              Receitas Totais:
                            </span>
                            <span className="text-xs font-bold font-mono text-gray-800">
                              {formatCurrency(income)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">
                              Custos & OPEX:
                            </span>
                            <span className="text-xs font-bold font-mono text-gray-800">
                              {formatCurrency(expense)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-gray-150 pt-1.5">
                            <span className="text-xs text-gray-950 font-semibold">
                              Sobra Líquida:
                            </span>
                            <span className="text-xs font-bold font-mono text-emerald-600">
                              {formatCurrency(balance)}
                            </span>
                          </div>
                        </div>

                        <div className="bg-orange-50/50 p-4.5 rounded-2xl border border-orange-200/60 space-y-1.5 shadow-sm">
                          <p className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                            Projeção Simulada de Caixa
                          </p>
                          <div className="flex justify-between pt-1">
                            <span className="text-xs text-gray-600">
                              Novas Receitas:
                            </span>
                            <span className="text-xs font-bold font-mono text-emerald-600">
                              <AnimatedNumber value={simRevenue} formatter={formatCurrency} />
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">
                              Novos Custos Totais:
                            </span>
                            <span className="text-xs font-bold font-mono text-orange-600">
                              <AnimatedNumber value={simExpense} formatter={formatCurrency} type="expense" />
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-orange-200 pt-1.5">
                            <span className="text-xs text-gray-950 font-black uppercase">
                              Novo Lucro Estimado:
                            </span>
                            <span className="text-sm font-black font-mono text-emerald-600 underline">
                              <AnimatedNumber value={simProfit} formatter={formatCurrency} />
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-orange-50/30 p-4 rounded-xl border-l-4 border-orange-500 flex items-center gap-3">
                        <Zap size={20} className="text-orange-500 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-750 leading-tight">
                            Com essas táticas, você incrementa seu Lucro Líquido
                            em{" "}
                            <strong className="text-gray-950 font-black">
                              <AnimatedNumber value={Math.max(0, simProfitDiff)} formatter={formatCurrency} />
                            </strong>{" "}
                            adicionais ao mês! Um salto de{" "}
                            <strong className="text-orange-600 font-black">
                              <AnimatedNumber value={simPercentImprovement} formatter={(v) => `${v.toFixed(1)}%`} />
                            </strong>{" "}
                            sobre seus números reais.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Crescimento de Nicho (I.A. 🎯) */}
                {activeModalTab === "niche" && (
                  <div className="space-y-8 animate-fadeIn">
                    <div>
                      <h4 className="font-black uppercase italic tracking-wider text-sm text-gray-950">
                        Painel de Inteligência de Nicho Operacional
                      </h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                        Defina com precisão a especificidade da sua atividade comercial para que a I.A. desenhe metas e roteiros táticos sob medida para sua operação.
                      </p>
                    </div>

                    {/* Inputs de definição do nicho */}
                    <div className="bg-white border rounded-3xl p-6 space-y-4 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">
                            Segmento Principal do Seu Negócio
                          </label>
                          <select
                            value={localSegment}
                            onChange={(e) => setLocalSegment(e.target.value)}
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-xs font-bold text-gray-800 cursor-pointer"
                          >
                            <option value="other">Outros / Prestação de Serviços</option>
                            <option value="commerce">Comércio (Roupas, Varejo, Lojas)</option>
                            <option value="food">Alimentação (Restaurantes, Cafés, Bares)</option>
                            <option value="services">Serviços Especializados (Clínicas, Consultoria)</option>
                            <option value="tech">Tecnologia, SaaS e Agências Digitais</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">
                            Nicho de Atuação Específico (Foco Comercial)
                          </label>
                          <input
                            type="text"
                            value={localNicheDetail}
                            onChange={(e) => setLocalNicheDetail(e.target.value)}
                            placeholder="Ex: Hamburgueria artesanal de delivery, E-commerce de sapatos de couro macio..."
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-xs font-bold text-gray-850 placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-4">
                        <p className="text-[10px] text-gray-500 leading-tight uppercase font-bold tracking-tight max-w-md">
                          * Ao clicar em sincronizar, a inteligência artificial recalculará metas, KPIs e checklists específicos de vendas baseando-se no seu DRE acumulado deste mês.
                        </p>
                        <button
                          onClick={handleGenerateNichePlan}
                          disabled={nicheLoading}
                          className="w-full sm:w-auto bg-[#141414] hover:bg-orange-600 font-black uppercase text-[10px] tracking-widest text-white px-6 py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                        >
                          {nicheLoading ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-white" />
                              Calculando Inteligência...
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} className="text-orange-500" />
                              Sincronizar Inteligência de Nicho
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Exibição do Plano Estratégico de Nicho */}
                    {!nichePlan ? (
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12 text-center space-y-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <Zap size={20} className="text-orange-600 animate-pulse" />
                        </div>
                        <h5 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Plano de Nicho Aguardando Mapeamento</h5>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                          Descreva o seu nicho específico de mercado acima para que a I.A. modele metas de margem, checklist de contenção de custos e KPIs que façam sentido para o seu ramo específico de operação.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Cabecalho Principal do Plano */}
                        <div className="bg-gradient-to-br from-[#141414] to-[#202020] rounded-3xl p-6 text-white space-y-3 shadow-md relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                          <div className="flex items-center gap-2">
                            <span className="bg-orange-500 text-black px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                              ESTRATÉGIA DE NICHO
                            </span>
                          </div>
                          <div>
                            <h5 className="text-lg md:text-xl font-bold tracking-tight">{nichePlan.nicheTitle}</h5>
                            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                              {nichePlan.overview}
                            </p>
                          </div>
                        </div>

                        {/* KPIS Sugeridos de Nicho */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                            <Target size={13} className="text-orange-600" /> KPIs Recomendados para Monitorar
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {nichePlan.kpis?.map((k, index) => (
                              <div key={index} className="bg-white border rounded-2xl p-5 space-y-2.5 hover:border-orange-500/30 transition-all shadow-sm">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    KPI {index + 1}
                                  </span>
                                  <h6 className="font-bold text-xs text-gray-950 mt-1">{k.name}</h6>
                                </div>
                                <div className="space-y-1 border-t border-gray-100 pt-2.5">
                                  <p className="text-[10px] text-gray-500 uppercase font-black">Meta de Nicho Sugerida:</p>
                                  <p className="text-xs font-black text-emerald-600 font-mono">{k.target}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold">Fórmula de Medição:</p>
                                  <p className="text-[10px] text-gray-500 italic leading-snug">{k.howToMeasure}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Checklist Interativo / Roadmap */}
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <h5 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                              <CheckCircle2 size={13} className="text-emerald-600" /> Roteiro Estratégico & Plano de Ação Interativo
                            </h5>
                            
                            {/* Medidor de progresso dinâmico */}
                            {(() => {
                              const totalTasks = nichePlan.milestones?.reduce((acc, m) => acc + (m.actions?.length || 0), 0) || 0;
                              const completedTasks = nichePlan.milestones?.reduce((acc, m) => {
                                return acc + (m.actions?.filter(a => completedNicheTasks[a.task])?.length || 0);
                              }, 0) || 0;
                              const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                              
                              return (
                                <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-50 border px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-700 tracking-wider">
                                  <span>Progresso:</span>
                                  <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                                  </div>
                                  <span className="text-orange-600 font-mono">{completedTasks}/{totalTasks} ({progressPct}%)</span>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="space-y-6">
                            {nichePlan.milestones?.map((m, mIndex) => (
                              <div key={mIndex} className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
                                <h6 className="font-extrabold text-xs text-gray-950 uppercase italic tracking-wider border-b pb-2 flex items-center gap-2">
                                  <span className="bg-[#141414] text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] not-italic">
                                    {mIndex + 1}
                                  </span>
                                  {m.title}
                                </h6>
                                
                                <div className="space-y-3">
                                  {m.actions?.map((a, aIndex) => {
                                    const isDone = !!completedNicheTasks[a.task];
                                    return (
                                      <div
                                        key={aIndex}
                                        onClick={() => toggleNicheTask(a.task)}
                                        className={cn(
                                          "group p-3 border rounded-xl flex items-start gap-3 transition-all cursor-pointer",
                                          isDone 
                                            ? "bg-orange-50/20 border-orange-500/30 opacity-70" 
                                            : "bg-gray-50/50 border-gray-150 hover:bg-gray-50 hover:border-gray-300"
                                        )}
                                      >
                                        <div className={cn(
                                          "w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition-colors",
                                          isDone 
                                            ? "bg-orange-500 border-orange-500 text-white" 
                                            : "bg-white border-gray-300 group-hover:border-orange-500"
                                        )}>
                                          {isDone && <Check size={11} className="stroke-[3]" />}
                                        </div>
                                        <div className="space-y-0.5">
                                          <p className={cn(
                                            "text-xs font-bold leading-tight",
                                            isDone ? "text-gray-500 line-through font-medium" : "text-gray-900"
                                          )}>
                                            {a.task}
                                          </p>
                                          <p className="text-[10px] text-gray-400 italic">
                                            Justificativa do Caixa: {a.rationale}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dicas Avancadas */}
                        {nichePlan.tips && nichePlan.tips.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                              <Lightbulb size={13} className="text-yellow-600" /> Dicas Táticas do Mestre Comercial
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {nichePlan.tips.map((tip, index) => (
                                <div key={index} className="bg-gradient-to-r from-orange-50/30 to-orange-50/10 border border-orange-200/50 p-5 rounded-2xl flex items-start gap-3 shadow-sm">
                                  <Lightbulb size={18} className="text-orange-500 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <h6 className="font-bold text-xs text-gray-950">{tip.title}</h6>
                                    <p className="text-[10px] md:text-xs text-gray-600 leading-relaxed">
                                      {tip.text}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// DashboardView and StatCard have been extracted to /src/components/DashboardView.tsx for React.lazy loading.