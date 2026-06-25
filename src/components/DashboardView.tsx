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
import { toPng } from "html-to-image";
import { AnimatedNumber } from "./AnimatedNumber";
import { calculateHealthScore } from "../utils/healthCalculator";
import { getDynamicGoals } from "../utils/goalsHelper";
import FinancialAssistant from "./FinancialAssistant";
import { AbntPdfDocument, TableColumn } from "../utils/pdfAbntHelper";

export default function DashboardView({ 
  setActiveTab,
  aiEngine,
  setAiEngine,
  autoGptTips,
  setAutoGptTips,
  gptTipInterval,
  setGptTipInterval,
  voicePitch,
  setVoicePitch,
  voiceRate,
  setVoiceRate,
  voiceVolume,
  setVoiceVolume,
  availableVoices,
  selectedVoiceName,
  setSelectedVoiceName,
  simulatedCrisis,
  setSimulatedCrisis,
  wcPixExpress,
  setWcdPixExpress,
  wcAcordoFornecedores,
  setWcdAcordoFornecedores,
  wcOtimizarCustos,
  setWcdOtimizarCustos,
  wcCenarioCrise,
  setWcCenarioCrise,
}: { 
  setActiveTab: (tab: any) => void;
  aiEngine: "gemini" | "chatgpt";
  setAiEngine: (e: "gemini" | "chatgpt") => void;
  autoGptTips: boolean;
  setAutoGptTips: (b: boolean) => void;
  gptTipInterval: number;
  setGptTipInterval: (i: number) => void;
  voicePitch: number;
  setVoicePitch: (pitch: number) => void;
  voiceRate: number;
  setVoiceRate: (rate: number) => void;
  voiceVolume: number;
  setVoiceVolume: (volume: number) => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  setSelectedVoiceName: (voiceName: string) => void;
  simulatedCrisis: boolean;
  setSimulatedCrisis: (val: boolean) => void;
  wcPixExpress: boolean;
  setWcdPixExpress: (val: boolean) => void;
  wcAcordoFornecedores: boolean;
  setWcdAcordoFornecedores: (val: boolean) => void;
  wcOtimizarCustos: boolean;
  setWcdOtimizarCustos: (val: boolean) => void;
  wcCenarioCrise: boolean;
  setWcCenarioCrise: (val: boolean) => void;
}) {
  const { transactions, allTransactions, categories, isDemoMode, getDRE, profile, showToast, updateProfile, products, updateProduct, bills } = useFinance();
  const [capitalWidgetTooltip, setCapitalWidgetTooltip] = React.useState<string | null>(null);
  const [isWcAiAnalyzing, setIsWcAiAnalyzing] = React.useState<boolean>(false);
  const [isApplyingQuickAdjustment, setIsApplyingQuickAdjustment] = React.useState<boolean>(false);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = React.useState<string | null>(null);
  const [extraFixedExpense, setExtraFixedExpense] = React.useState<number>(0);
  const [isWcSimulatorOpen, setIsWcSimulatorOpen] = React.useState<boolean>(false);
  const [wcAiFeedback, setWcAiFeedback] = React.useState<string>("");

  const handleWcAiConsult = async (calculatedCCC: number, workingCapitalNeed: number, adjustedDailyOutflow: number, displayScore: number) => {
    if (isWcAiAnalyzing) return;
    setIsWcAiAnalyzing(true);
    setWcAiFeedback("");
    sound.playClick();
    showToast("Dafne IA está rodando simulações estressadas de liquidez... 🧠✨", "info");

    const promptMsg = `Olá Dafne. Como nossa Engenheira Virtual de Controladoria I.A. de alta performance, preciso de um DIAGNÓSTICO INTEGRADO DE MITIGAÇÃO DE CRISE de curto prazo para as nossas métricas reais de tesouraria de caixa.
Dados do simulador sob condições operacionais atuais:
- Cenário de Crise Ativo: \${wcCenarioCrise ? "SIM (Prazos de recebimento DSO duplicados e margem reduzida do faturamento real)" : "NÃO"}
- Ciclo CCC simulado: \${calculatedCCC} dias
- Necessidade de Capital de Giro (NCG): \${formatCurrency(workingCapitalNeed)}
- OPEX Financeiro diário: \${formatCurrency(adjustedDailyOutflow)}
- Alavancas de mitigação simuladas: Pix Express (Zerar DSO) = \${wcPixExpress ? 'ATIVO' : 'INATIVO'}, Alongamento Fornecedores = \${wcAcordoFornecedores ? 'ATIVO' : 'INATIVO'}, Otimização de Custos (OPEX) = \${wcOtimizarCustos ? 'ATIVO' : 'INATIVO'}
- Score de Saúde do Caixa Corporativo: \${displayScore}/100

Por favor, forneça em Português uma análise tática cirúrgica de até 3 parágrafos curtos, objetivos contendo:
1. Um parecer imediato do nosso Score atual de Caixa (\${displayScore}/100) e o risco de asfixia operacional baseado nos dados acima.
2. Uma ação inovadora de mitigação específica baseada nos nossos números reais de despesa diária e reserva.
3. Sugestão pragmática de quais alavancas extras de tesouraria devemos ligar neste momento para reverter a crise. Seja ultra técnica, empoderadora e brilhante!`;

    try {
      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptMsg,
          financialData: {
            businessSegment: profile?.businessSegment || "Holding PJ",
            businessNicheDetail: profile?.businessNicheDetail || "Operações comerciais gerais",
            simulatedCrisis: wcCenarioCrise,
            calculatedCCC,
            workingCapitalNeed,
            adjustedDailyOutflow,
            displayScore,
          },
          neuralPrecision: 0.6,
          enableTransactionParsing: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro de resposta da API de Inteligência");
      }

      const resData = await response.json();
      if (resData && resData.text) {
        setWcAiFeedback(resData.text);
        sound.playSuccess();
        showToast("Diagnóstico tático concluído com sucesso por Dafne IA! 📊🎙️", "success");
      } else {
        throw new Error("Resposta inválida");
      }
    } catch (error) {
      console.error("AI Error:", error);
      // Fallback advice in case of offline/test mode
      const fallbackTips = [
        `🚨 **Análise de Sobrevivência sob Rigor:** Com o Score de Caixa estimado em **\${displayScore}/100** sob o cenário de crise ativa, o seu caixa entra na zona crítica de asfixia em curto prazo se nenhuma alavanca for acionada. Seu ciclo de conversão (CCC) de **\${calculatedCCC} dias** retém **\${formatCurrency(workingCapitalNeed)}** imobilizados no giro.`,
        `💡 **Mitigação com OPEX Operacional:** Recomendamos cortar micro-vazamentos operacionais desligando contas recorrentes extras (-15%) e negociando prazos médios de pagamentos com fornecedores para alongar o DPO de 28 para 43 dias imediatamente.`,
        `🎯 **Acelerar Recebíveis no Pix:** Ative o 'Pix Express' para motivar pagamentos instantâneos com descontos agressivos na nota faturada. Isso zera o descasamento operacional de seus recebimentos em tempo recorde!`
      ];
      setWcAiFeedback(fallbackTips.join("\n\n"));
      sound.playSuccess();
      showToast("Dafne rodou o diagnóstico tático local preventivo com sucesso!", "success");
    } finally {
      setIsWcAiAnalyzing(false);
    }
  };

  const handleWcAiVoiceSpeak = () => {
    if (!wcAiFeedback) return;
    sound.playClick();
    
    // Check if speechSynthesis is available
    if (typeof window === "undefined" || !window.speechSynthesis) {
      showToast("Seu navegador não oferece suporte para síntese de voz (SpeechSynthesis).", "warning");
      return;
    }
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clean text up for pleasant read
    const cleanText = wcAiFeedback
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/#/g, "")
      .replace(/_/g, "")
      .replace(/-\s/g, ", ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/🤖 |💡 |📈 |⚖️ |🎯 |📦 |✨ |🚨 /g, "")
      .replace(/DRE/gi, "D.R.E.")
      .replace(/OPEX/gi, "Ópex")
      .replace(/CMV/gi, "C.M.V.");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    
    // Attempt standard voices and prioritize female voices
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter(v => 
      v.lang.toLowerCase().includes("pt-br") || 
      v.lang.toLowerCase().startsWith("pt")
    );
    
    let selectedVoice = null;
    if (ptVoices.length > 0) {
      selectedVoice = ptVoices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes("maria") || name.includes("francisca") || name.includes("female") || name.includes("google") || name.includes("suave");
      });
      if (!selectedVoice) selectedVoice = ptVoices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.pitch = 1.0;
    utterance.rate = 1.01;
    
    window.speechSynthesis.speak(utterance);
    showToast("Dafne IA iniciou locução executiva. Ouça atentamente!", "info");
  };

  const [topWidgets, setTopWidgets] = React.useState<string[]>(() => {
    const cached = localStorage.getItem("dafne_cockpit_top_widgets_v1");
    return cached ? JSON.parse(cached) : ["telemetry", "ebitda_comparison"];
  });

  const [isSliding, setIsSliding] = React.useState(false);
  const [isExportingChart, setIsExportingChart] = React.useState(false);
  const [isExportingFiveYearsChart, setIsExportingFiveYearsChart] = React.useState(false);
  const [isResettingFiveYears, setIsResettingFiveYears] = React.useState(false);
  const [fiveYearsRange, setFiveYearsRange] = React.useState<12 | 36 | 60>(60);
  const [fiveYearsMetricFilter, setFiveYearsMetricFilter] = React.useState<"both" | "income" | "profit">("both");

  const handleResetFiveYearsSnapshot = () => {
    setIsResettingFiveYears(true);
    try { sound.playClick(); } catch(e) {}
    setFiveYearsRange(60);
    setFiveYearsMetricFilter("both");
    showToast("Visualização do histórico restaurada para o estado inicial!", "success");
    setTimeout(() => {
      setIsResettingFiveYears(false);
    }, 800);
  };
  
  const slidingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerSlidingEffect = () => {
    setIsSliding(true);
    if (slidingTimeoutRef.current) {
      clearTimeout(slidingTimeoutRef.current);
    }
    slidingTimeoutRef.current = setTimeout(() => {
      setIsSliding(false);
    }, 1000);
  };

  const handleExportFiveYearsChart = async () => {
    if (isExportingFiveYearsChart) return;
    try {
      setIsExportingFiveYearsChart(true);
      sound.playClick();
      
      const element = document.getElementById("five-years-general-history-chart");
      if (!element) {
        showToast("Elemento do gráfico não encontrado.", "error");
        return;
      }

      const exportBtn = element.querySelector('[data-export-button]');
      if (exportBtn) {
        (exportBtn as HTMLElement).style.visibility = "hidden";
      }

      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      if (exportBtn) {
        (exportBtn as HTMLElement).style.visibility = "visible";
      }

      const link = document.createElement("a");
      link.download = `historico-5anos-${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();
      
      showToast("Histórico multianual exportado com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao exportar gráfico de 5 anos:", err);
      showToast("Erro ao exportar o histórico como imagem.", "error");
    } finally {
      setIsExportingFiveYearsChart(false);
    }
  };

  const handleExportChart = async () => {
    if (isExportingChart) return;
    try {
      setIsExportingChart(true);
      sound.playClick();
      
      const element = document.getElementById("profit-margin-history-chart");
      if (!element) {
        showToast("Elemento do gráfico não encontrado.", "error");
        return;
      }

      const exportBtn = element.querySelector('[data-export-button]');
      if (exportBtn) {
        (exportBtn as HTMLElement).style.visibility = "hidden";
      }

      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      if (exportBtn) {
        (exportBtn as HTMLElement).style.visibility = "visible";
      }

      const link = document.createElement("a");
      link.download = `historico-margens-${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();
      
      showToast("Gráfico exportado com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao exportar gráfico:", err);
      showToast("Erro ao exportar o gráfico como imagem.", "error");
    } finally {
      setIsExportingChart(false);
    }
  };

  // Metas do mês corrente para mostrar progresso real das metas adicionais no cockpit
  const currentMonthIncome = React.useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "income" &&
          tDate.getFullYear() === currentYear &&
          tDate.getMonth() === currentMonth
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const currentMonthExpenses = React.useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "expense" &&
          tDate.getFullYear() === currentYear &&
          tDate.getMonth() === currentMonth
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const currentMonthProfit = currentMonthIncome - currentMonthExpenses;
  const currentMonthMarginPct = currentMonthIncome > 0 ? (currentMonthProfit / currentMonthIncome) * 100 : 0;
  const averageTicket = profile?.averageTicket || 0;

  const getGoalStatusAndProgress = (g: any) => {
    if (g.reached) {
      return { progress: 100, label: "Meta atingida" };
    }

    let progress = 0;
    let label = "";

    if (g.desiredProfitMargin && g.desiredProfitMargin > 0) {
      if (g.type === 'income') {
        const realProfitTarget = g.targetValue * (g.desiredProfitMargin / 100);
        progress = realProfitTarget > 0 ? Math.min(Math.max((currentMonthProfit / realProfitTarget) * 100, 0), 100) : 0;
        label = `Lucro Real: Meta ${formatCurrency(realProfitTarget)} (${g.desiredProfitMargin}%) | Atual: ${formatCurrency(currentMonthProfit)}`;
      } else if (g.type === 'profit') {
        const targetMargin = g.targetValue;
        progress = targetMargin > 0 ? Math.min(Math.max((currentMonthMarginPct / targetMargin) * 100, 0), 100) : 0;
        label = `Margem Real: Meta ${targetMargin}% | Atual: ${currentMonthMarginPct.toFixed(1)}%`;
      } else {
        const nominalTarget = g.targetValue;
        progress = nominalTarget > 0 ? Math.min(Math.max((currentMonthIncome / nominalTarget) * 100, 0), 100) : 0;
        label = `Faturamento: ${formatCurrency(currentMonthIncome)} / ${formatCurrency(nominalTarget)}`;
      }
    } else {
      if (g.type === 'income') {
        progress = g.targetValue > 0 ? Math.min(Math.max((currentMonthIncome / g.targetValue) * 100, 0), 100) : 0;
        label = `Faturamento: ${formatCurrency(currentMonthIncome)} / ${formatCurrency(g.targetValue)}`;
      } else if (g.type === 'profit') {
        progress = g.targetValue > 0 ? Math.min(Math.max((currentMonthMarginPct / g.targetValue) * 100, 0), 100) : 0;
        label = `Margem de Lucro Alvo: ${g.targetValue}% | Margem Real Atual: ${currentMonthMarginPct.toFixed(1)}%`;
      } else if (g.type === 'ticket') {
        progress = g.targetValue > 0 ? Math.min(Math.max((averageTicket / g.targetValue) * 100, 0), 100) : 0;
        label = `Ticket Médio Alvo: ${formatCurrency(g.targetValue)} | Atual: ${formatCurrency(averageTicket)}`;
      } else if (g.type === 'liquidity') {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + 30);
        const next30DaysExpenses = (bills || [])
          .filter(b => b.status === 'pending' || b.status === 'overdue' || (new Date(b.dueDate) <= limitDate))
          .reduce((sum, b) => sum + b.amount, 0);
        const minOpex = next30DaysExpenses > 0 ? next30DaysExpenses : 10000;
        const availableBalance = balance;
        if (g.targetValue <= 10) {
          const ratioVal = minOpex > 0 ? (availableBalance / minOpex) : 0;
          progress = g.targetValue > 0 ? Math.min(Math.max((ratioVal / g.targetValue) * 100, 0), 100) : 0;
          label = `Liquidez (Alvo: ${g.targetValue}x) | Atual: ${ratioVal.toFixed(2)}x (Caixa ${formatCurrency(availableBalance)} / Opex 30d ${formatCurrency(minOpex)})`;
        } else {
          progress = g.targetValue > 0 ? Math.min(Math.max((availableBalance / g.targetValue) * 100, 0), 100) : 0;
          label = `Liquidez (Alvo: ${formatCurrency(g.targetValue)}) | Atual: ${formatCurrency(availableBalance)} (Opex batedora: ${formatCurrency(minOpex)})`;
        }
      } else {
        progress = 0;
        label = `Tipo: ${g.type === 'sales_volume' ? 'Vol. Vendas' : g.type === 'acquisition_cost' ? 'Custo de Aquisição' : g.type === 'churn' ? 'Controle Faturamento' : 'Geral'}`;
      }
    }

    return { progress: Math.round(progress), label };
  };

  const dashboardGoals = profile?.additionalGoals || [];

  const handleToggleDashboardGoal = async (goalId: string) => {
    if (!profile) return;
    try {
      const updatedGoals = dashboardGoals.map((g) => {
        if (g.id === goalId) {
          return { ...g, reached: !g.reached };
        }
        return g;
      });
      await updateProfile({ ...profile, additionalGoals: updatedGoals });
      showToast("Meta do cockpit atualizada com sucesso!", "success");
    } catch (e) {
      console.error(e);
      showToast("Dificuldade para atualizar a meta.", "error");
    }
  };

  // Local state for real-time strategic decisions sandbox simulation
  const [markupSim, setMarkupSim] = useState<number>(0); // general price/markup change % (-15% to +30%)
  const [opexSim, setOpexSim] = useState<number>(0);     // fixed costs / opex reduction % (0% to 50%)
  const [cardFeeReductionSim, setCardFeeReductionSim] = useState<number>(0); // card machine fees optimization % (0% to 2%)

  // Estados para o Menu de Indicação de Amigos / Captação de Leads Comerciais (Dashboard)
  const [friendName, setFriendName] = useState<string>("");
  const [friendContact, setFriendContact] = useState<string>("");
  const [friendCompany, setFriendCompany] = useState<string>("");
  const [friendRole, setFriendRole] = useState<string>("CEO & Sócio Geral");
  const [referralLeads, setReferralLeads] = useState<Array<{ id: string; name: string; contact: string; role: string; company: string; status: string; date: string }>>(() => {
    const cached = localStorage.getItem("dafne_invited_friends_leads");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [
      { id: "ref-1", name: "Rogério Antunes", contact: "(11) 98111-4432", role: "CFO / Diretor Financeiro", company: "Antunes Varejo", status: "Em Contato Comercial", date: "2026-05-24" },
      { id: "ref-2", name: "Alessandra Toledo", contact: "alessandra@techhouse.io", role: "CEO & Sócio Geral", company: "TechHouse.io", status: "Proposta Enviada", date: "2026-05-25" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("dafne_invited_friends_leads", JSON.stringify(referralLeads));
  }, [referralLeads]);

  const handleRegisterReferralLead = () => {
    if (!friendName.trim()) {
      showToast("Por favor, informe o nome do amigo ou parceiro indicado.", "warning");
      return;
    }
    if (!friendContact.trim()) {
      showToast("Por favor, informe o WhatsApp ou e-mail de contato.", "warning");
      return;
    }

    const newLead = {
      id: "ref-" + Date.now(),
      name: friendName.trim(),
      contact: friendContact.trim(),
      role: friendRole,
      company: friendCompany.trim() || "Empresa Parceira",
      status: "Em Contato Comercial",
      date: new Date().toISOString().split("T")[0]
    };

    const newLeads = [newLead, ...referralLeads];
    setReferralLeads(newLeads);
    localStorage.setItem("dafne_invited_friends_leads", JSON.stringify(newLeads));

    setFriendName("");
    setFriendContact("");
    setFriendCompany("");
    setFriendRole("CEO & Sócio Geral");

    try { sound.playSuccess(); } catch (e) {}
    showToast(`Indicação registrada! Nossa equipe comercial entrará em contato com ${friendName.trim()} para oferecer o produto.`, "success");
  };

  // Auto-complete sandbox simulation step on change
  useEffect(() => {
    if (markupSim !== 0 || opexSim !== 0 || cardFeeReductionSim !== 0) {
      try {
        if ((window as any).completeTourTask) {
          (window as any).completeTourTask("sandbox_simulation");
        }
      } catch (err) {}
    }
  }, [markupSim, opexSim, cardFeeReductionSim]);

  // Inspector detailed entries/exits modal state
  const [detailModalToken, setDetailModalToken] = useState<"balance" | "income" | "expense" | "contribution" | null>(null);
  const [detailSearch, setDetailSearch] = useState<string>("");

  // Active comparative card selection state
  const [activeCompareCard, setActiveCompareCard] = useState<string>("Saldo Atual");

  // Correlation analysis pricing variables
  const [showCorrelationModal, setShowCorrelationModal] = useState(false);
  const [correlationProductId, setCorrelationProductId] = useState<string>("");
  const [simPrice, setSimPrice] = useState<number>(0);
  const [simVolume, setSimVolume] = useState<number>(0);

  // Product Tax Compare Modal state and helper states
  const [showProductTaxCompareModal, setShowProductTaxCompareModal] = useState(false);
  const [taxCompareProductId, setTaxCompareProductId] = useState<string>("");
  const [taxCompareSimPrice, setTaxCompareSimPrice] = useState<number>(0);
  const [taxCompareCustomTax, setTaxCompareCustomTax] = useState<number>(0);

  useEffect(() => {
    if (correlationProductId && products.length > 0) {
      const p = products.find(prod => prod.id === correlationProductId);
      if (p) {
        setSimPrice(p.sellingPrice);
        const productSalesTransactions = transactions.filter(t => t.type === "income" && t.productId === p.id);
        const actualUnitsSold = productSalesTransactions.reduce((acc, t) => acc + (t.quantity || 1), 0);
        setSimVolume(actualUnitsSold || 35);
      }
    }
  }, [correlationProductId, products, transactions]);

  useEffect(() => {
    if (showCorrelationModal && products.length > 0 && !correlationProductId) {
      setCorrelationProductId(products[0].id);
    }
  }, [showCorrelationModal, products, correlationProductId]);

  useEffect(() => {
    if (showProductTaxCompareModal && products.length > 0 && !taxCompareProductId) {
      const p = products[0];
      setTaxCompareProductId(p.id);
      setTaxCompareSimPrice(p.sellingPrice);
      setTaxCompareCustomTax(p.taxRate);
    }
  }, [showProductTaxCompareModal, products, taxCompareProductId]);

  // Real-time AI Neural Parameters Simulator (Traga mais inovação)
  const [neuralPrecision, setNeuralPrecision] = useState<number>(0.7);
  const [neuralTier, setNeuralTier] = useState<"flash" | "pro" | "quantum">("pro");
  const [liveStreamRate, setLiveStreamRate] = useState<number>(315);

  // Innovation & Investment Simulator state
  const [selectedInnovationId, setSelectedInnovationId] = useState<"ia" | "software" | "equipamento">("ia");
  const [innovationIntensity, setInnovationIntensity] = useState<number>(100); // 50% to 150% investment multiplier

  // Calculation of average contribution margin of products
  const avgProductMargin = React.useMemo(() => {
    if (!products || products.length === 0) return 18.5; // default fallback under 20% to showcase the alert
    const total = products.reduce((sum, p) => sum + p.profitMarginPct, 0);
    return total / products.length;
  }, [products]);

  // Interactive Profit Margin History Trend states & calculations
  const [activeHistoryMetric, setActiveHistoryMetric] = useState<"margin" | "faturamento_lucro">("margin");
  const [historyMonthsRange, setHistoryMonthsRange] = useState<6 | 12>(6);
  const [selectedHistoryMonthIndex, setSelectedHistoryMonthIndex] = useState<number>(5);

  // M&A Valuation Engine & Pricing Elasticity dynamic states
  const [valuationSector, setValuationSector] = useState<"services" | "retail" | "tech" | "industry">("services");
  const [valuationCustomMultiplier, setValuationCustomMultiplier] = useState<number>(5.5);
  const [valuationGovernanceScore, setValuationGovernanceScore] = useState<number>(75);
  const [valuationGrowthExpected, setValuationGrowthExpected] = useState<number>(20); // annual target %
  const [valuationScenario, setValuationScenario] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [valuationAIReport, setValuationAIReport] = useState<string>("");
  const [isGeneratingValuationAIReport, setIsGeneratingValuationAIReport] = useState<boolean>(false);
  const [elasticityPriceChange, setElasticityPriceChange] = useState<number>(5); // % change
  const [elasticityCoeff, setElasticityCoeff] = useState<number>(1.2); // price elasticity of demand coefficient

  // Synchronize index when history range switches to point to the newest month
  React.useEffect(() => {
    setSelectedHistoryMonthIndex(historyMonthsRange - 1);
  }, [historyMonthsRange]);

  // States and calculations for the 7-day trend of daily expenses
  const [selectedExpenseDayIndex, setSelectedExpenseDayIndex] = useState<number>(6);

  const last7DaysExpenseData = React.useMemo(() => {
    const today = new Date();
    const days = [];
    let totalRealExpenses = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // yyyy-mm-dd
      const label = format(d, "dd/MM");
      const dayName = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

      // Get real expense transactions for this day
      const dayTxs = transactions.filter(t => {
        if (!t.date) return false;
        try {
          const tDate = new Date(t.date);
          return t.type === "expense" && tDate.toISOString().split("T")[0] === dateStr;
        } catch {
          return false;
        }
      });
      const realCost = dayTxs.reduce((sum, t) => sum + t.amount, 0);

      totalRealExpenses += realCost;

      days.push({
        dateStr,
        label: `${label} (${formattedDayName})`,
        shortLabel: label,
        dayName: formattedDayName,
        Valor: realCost,
        isDemo: false,
        transactions: dayTxs.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          category: categories.find(c => c.id === t.categoryId)?.name || "Geral",
        }))
      });
    }

    // Fallback demo data if no expenses recorded at all in the last 7 days
    if (totalRealExpenses === 0) {
      const demoExpenses = [1420, 2150, 1100, 5200, 1800, 1350, 2400]; // Day 4 (index 3) is a spike of 5200
      const demoTxsMap = [
        [{ id: "d-1", description: "Hospedagem Cloud AWS PJ", amount: 820, category: "Infraestrutura" }, { id: "d-2", description: "Assinatura Software ERP", amount: 600, category: "Licenças" }],
        [{ id: "d-3", description: "Marketing de Performance Meta Ads", amount: 1650, category: "Marketing" }, { id: "d-4", description: "Ferramenta Anti-Fraude", amount: 500, category: "Segurança" }],
        [{ id: "d-5", description: "Logística e Frete de Distribuição", amount: 1100, category: "Operacional" }],
        [{ id: "d-6", description: "Boleto Licenciamento Anual de Software (SPIKE) ⚠️", amount: 3900, category: "Licenças" }, { id: "d-7", description: "Manutenção Emergencial Ar-Condicionado", amount: 1300, category: "Infraestrutura" }],
        [{ id: "d-8", description: "Serviço de Limpeza PJ", amount: 1200, category: "Terceiros" }, { id: "d-9", description: "Papelaria e Materiais Administrativos", amount: 600, category: "Escritório" }],
        [{ id: "d-10", description: "Seguros e Taxas Bancárias", amount: 750, category: "Financeiro" }, { id: "d-11", description: "Telefonia e Links de Internet PJ", amount: 600, category: "Utilidades" }],
        [{ id: "d-12", description: "Consultoria Contábil PJ", amount: 1800, category: "Assessoria" }, { id: "d-13", description: "Suprimentos de Lanches de Refeitório", amount: 600, category: "Escritório" }]
      ];

      return days.map((day, idx) => ({
        ...day,
        Valor: demoExpenses[idx],
        isDemo: true,
        transactions: demoTxsMap[idx]
      }));
    }

    return days;
  }, [transactions, categories]);

  const dailyExpensesStats = React.useMemo(() => {
    const values = last7DaysExpenseData.map(d => d.Valor);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / 7;
    const maxVal = Math.max(...values);
    const peakDay = last7DaysExpenseData.find(d => d.Valor === maxVal);
    
    // Spike detector: peak is > 1.75x average, and peak > 500
    const isSpikeDetected = maxVal > avg * 1.75 && maxVal > 500;
    const spikeFactor = avg > 0 ? (maxVal / avg).toFixed(1) : "0";

    return {
      sum,
      avg,
      maxVal,
      peakDay,
      isSpikeDetected,
      spikeFactor
    };
  }, [last7DaysExpenseData]);

  const previous7DaysRealSum = React.useMemo(() => {
    const today = new Date();
    let sum = 0;
    const daysStrList = [];
    for (let i = 13; i >= 7; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      daysStrList.push(d.toISOString().split("T")[0]);
    }

    transactions.forEach(t => {
      if (t.type === "expense" && t.date) {
        try {
          const tDate = new Date(t.date);
          const tDateStr = tDate.toISOString().split("T")[0];
          if (daysStrList.includes(tDateStr)) {
            sum += t.amount;
          }
        } catch {
          // ignore
        }
      }
    });

    return sum;
  }, [transactions]);

  const previousPeriodExpensesTotal = React.useMemo(() => {
    const isUsingDemo = last7DaysExpenseData.some(d => d.isDemo);
    if (isUsingDemo) {
      return 12200; // Demo previous total (current demo is 15420, representing +26.4% growth)
    }
    return previous7DaysRealSum;
  }, [last7DaysExpenseData, previous7DaysRealSum]);

  const expensesPercentageVariation = React.useMemo(() => {
    const current = dailyExpensesStats.sum;
    const previous = previousPeriodExpensesTotal;

    if (previous === 0) {
      if (current === 0) return 0;
      return 100;
    }
    return ((current - previous) / previous) * 100;
  }, [dailyExpensesStats.sum, previousPeriodExpensesTotal]);

  const marginHistoryData = React.useMemo(() => {
    const today = new Date();
    const months = [];
    const limit = historyMonthsRange - 1;
    
    // Fallback data points for beautiful cockpit presentation if user hasn't uploaded historical transactions yet
    const demoMargins6 = [22.4, 25.1, 19.3, 27.8, 31.2, currentMonthMarginPct > 0 ? Math.round(currentMonthMarginPct * 10) / 10 : 24.8];
    const demoIncomes6 = [45000, 48000, 42000, 52000, 58000, currentMonthIncome > 0 ? currentMonthIncome : 50000];

    const demoMargins12 = [18.5, 21.2, 24.0, 20.8, 22.6, 23.5, 22.4, 25.1, 19.3, 27.8, 31.2, currentMonthMarginPct > 0 ? Math.round(currentMonthMarginPct * 10) / 10 : 24.8];
    const demoIncomes12 = [38000, 41000, 44000, 40000, 43000, 46000, 45000, 48000, 42005, 52000, 58000, currentMonthIncome > 0 ? currentMonthIncome : 50000];
    
    for (let i = limit; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const monthTx = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      });
      
      let income = monthTx
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
        
      let expense = monthTx
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
        
      let profit = income - expense;
      let marginPct = income > 0 ? (profit / income) * 100 : 0;
      
      let isDemo = false;
      if (income === 0) {
        if (isDemoMode) {
          isDemo = true;
          const demoIdx = limit - i;
          marginPct = historyMonthsRange === 12 ? demoMargins12[demoIdx] : demoMargins6[demoIdx];
          income = historyMonthsRange === 12 ? demoIncomes12[demoIdx] : demoIncomes6[demoIdx];
          profit = income * (marginPct / 100);
          expense = income - profit;
        } else {
          income = 0;
          expense = 0;
          profit = 0;
          marginPct = 0;
          isDemo = false;
        }
      }
      
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const formattedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
      const fullMonthName = d.toLocaleDateString("pt-BR", { month: "long" });
      const formattedFullMonthName = fullMonthName.charAt(0).toUpperCase() + fullMonthName.slice(1);
      
      months.push({
        name: formattedMonth,
        fullMonth: formattedFullMonthName,
        Faturamento: Math.round(income),
        Despesas: Math.round(expense),
        Lucro: Math.round(profit),
        "Margem de Lucro (%)": Math.round(marginPct * 10) / 10,
        isDemo,
      });
    }
    
    return months;
  }, [transactions, isDemoMode, currentMonthMarginPct, currentMonthIncome, historyMonthsRange]);

  const fiveYearsHistoryData = React.useMemo(() => {
    const today = new Date();
    const months = [];
    
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const monthTx = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      });
      
      let realIncome = monthTx
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
        
      let realExpense = monthTx
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      let income = 0;
      let expense = 0;
      let isDemo = false;
      
      if (realIncome > 0 || realExpense > 0) {
        income = realIncome;
        expense = realExpense;
        isDemo = false;
      } else {
        if (isDemoMode) {
          isDemo = true;
          const monthIndex = 59 - i; // 0 to 59
          const baseIncome = 22000 + (monthIndex * 480);
          const seasonality = Math.sin(monthIndex * 0.5) * 4000;
          const randomFactor = ((monthIndex * 7 + 13) % 10) * 150 - 750;
          
          income = Math.max(10000, Math.round(baseIncome + seasonality + randomFactor));
          const costRatio = 0.72 + (Math.cos(monthIndex * 0.8) * 0.06);
          expense = Math.round(income * costRatio);
        } else {
          income = 0;
          expense = 0;
          isDemo = false;
        }
      }
      
      const profit = income - expense;
      const marginPct = income > 0 ? (profit / income) * 100 : 0;
      
      // Calculate CMV (Custo de Mercadorias Vendidas) representing direct product/service cost
      let cmvVal = 0;
      if (realIncome > 0 || realExpense > 0) {
        // Real database calculations
        const productCmv = monthTx
          .filter(t => t.isProductSale && t.productCostPrice && t.quantity)
          .reduce((acc, t) => acc + (Number(t.productCostPrice!) * Number(t.quantity!)), 0);

        const cogsCmv = monthTx
          .filter(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            return cat?.group === 'COGS';
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const realCmv = productCmv + cogsCmv;
        // Fallback estimate if no explicit CMV category but expenses are loaded
        cmvVal = realCmv > 0 ? realCmv : Math.round(realExpense * 0.42);
      } else {
        if (isDemoMode) {
          // High quality simulated CMV based on month index (seasonal margin changes)
          const monthIndex = 59 - i;
          const cmvRatio = 0.35 + (Math.sin(monthIndex * 0.5) * 0.035); // CMV varies between ~31.5% and ~38.5%
          cmvVal = Math.round(income * cmvRatio);
        } else {
          cmvVal = 0;
        }
      }
      
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const formattedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
      const fullMonthName = d.toLocaleDateString("pt-BR", { month: "long" });
      const formattedFullMonthName = fullMonthName.charAt(0).toUpperCase() + fullMonthName.slice(1) + " " + year;
      
      months.push({
        index: 59 - i,
        name: `${formattedMonth}/${String(year).slice(-2)}`,
        fullMonth: formattedFullMonthName,
        Faturamento: income,
        Despesas: expense,
        Lucro: profit,
        CMV: cmvVal,
        "Margem de Lucro (%)": Math.round(marginPct * 10) / 10,
        isDemo,
      });
    }
    
    return months;
  }, [transactions, isDemoMode, categories]);

  const fiveYearsFilteredData = React.useMemo(() => {
    return fiveYearsHistoryData.slice(-fiveYearsRange);
  }, [fiveYearsHistoryData, fiveYearsRange]);

  const fiveYearsStats = React.useMemo(() => {
    const totalIncomeValue = fiveYearsFilteredData.reduce((sum, item) => sum + item.Faturamento, 0);
    const totalProfitValue = fiveYearsFilteredData.reduce((sum, item) => sum + item.Lucro, 0);
    const avgMargin = totalIncomeValue > 0 ? Math.round((totalProfitValue / totalIncomeValue) * 100 * 10) / 10 : 0;
    const hasRealData = fiveYearsFilteredData.some(item => !item.isDemo);
    
    // CMV stats and trends
    const totalCmvValue = fiveYearsFilteredData.reduce((sum, item) => sum + (item.CMV || 0), 0);
    const avgCmvPercentage = totalIncomeValue > 0 ? Math.round((totalCmvValue / totalIncomeValue) * 100 * 10) / 10 : 0;
    
    // Trend calculation (compare first half of period vs second half of period)
    const halfIndex = Math.floor(fiveYearsFilteredData.length / 2);
    const firstHalf = fiveYearsFilteredData.slice(0, halfIndex);
    const secondHalf = fiveYearsFilteredData.slice(halfIndex);
    
    const firstHalfIncome = firstHalf.reduce((sum, item) => sum + item.Faturamento, 0);
    const firstHalfCmv = firstHalf.reduce((sum, item) => sum + (item.CMV || 0), 0);
    const firstHalfCmvPct = firstHalfIncome > 0 ? (firstHalfCmv / firstHalfIncome) * 100 : 0;
    
    const secondHalfIncome = secondHalf.reduce((sum, item) => sum + item.Faturamento, 0);
    const secondHalfCmv = secondHalf.reduce((sum, item) => sum + (item.CMV || 0), 0);
    const secondHalfCmvPct = secondHalfIncome > 0 ? (secondHalfCmv / secondHalfIncome) * 100 : 0;
    
    const cmvTrendDiff = secondHalfCmvPct - firstHalfCmvPct; // Negative is good (cost reduction)
    
    return {
      totalIncome: totalIncomeValue,
      totalProfit: totalProfitValue,
      avgMargin,
      hasRealData,
      totalCmv: totalCmvValue,
      avgCmvPct: avgCmvPercentage,
      cmvTrendDiff: Math.round(cmvTrendDiff * 10) / 10
    };
  }, [fiveYearsFilteredData]);

  const cmvSummaryPeriods = React.useMemo(() => {
    if (!fiveYearsFilteredData || fiveYearsFilteredData.length === 0) return [];
    
    let segments: { name: string; firstIndex: number; lastIndex: number }[] = [];
    
    if (fiveYearsRange === 60) {
      segments = [
        { name: "Ano 1 (Início)", firstIndex: 0, lastIndex: 11 },
        { name: "Ano 2", firstIndex: 12, lastIndex: 23 },
        { name: "Ano 3", firstIndex: 24, lastIndex: 35 },
        { name: "Ano 4", firstIndex: 36, lastIndex: 47 },
        { name: "Ano 5 (Recente)", firstIndex: 48, lastIndex: 59 },
      ];
    } else if (fiveYearsRange === 36) {
      segments = [
        { name: "Ano 1 (Início)", firstIndex: 0, lastIndex: 11 },
        { name: "Ano 2 (Intermediário)", firstIndex: 12, lastIndex: 23 },
        { name: "Ano 3 (Recente)", firstIndex: 24, lastIndex: 35 },
      ];
    } else {
      segments = [
        { name: "1º Trimestre (Início)", firstIndex: 0, lastIndex: 2 },
        { name: "2º Trimestre", firstIndex: 3, lastIndex: 5 },
        { name: "3º Trimestre", firstIndex: 6, lastIndex: 8 },
        { name: "4º Trimestre (Recente)", firstIndex: 9, lastIndex: 11 },
      ];
    }
    
    return segments.map(seg => {
      const slice = fiveYearsFilteredData.slice(seg.firstIndex, seg.lastIndex + 1);
      const revenue = slice.reduce((sum, item) => sum + item.Faturamento, 0);
      const cmv = slice.reduce((sum, item) => sum + (item.CMV || 0), 0);
      const cmvPct = revenue > 0 ? (cmv / revenue) * 100 : 0;
      const marginPct = 100 - cmvPct;
      
      return {
        name: seg.name,
        revenue,
        cmv,
        cmvPct: Math.round(cmvPct * 10) / 10,
        marginPct: Math.round(marginPct * 10) / 10,
      };
    });
  }, [fiveYearsFilteredData, fiveYearsRange]);

  const cmvSummaryTrend = React.useMemo(() => {
    if (cmvSummaryPeriods.length < 2) return null;
    const first = cmvSummaryPeriods[0];
    const last = cmvSummaryPeriods[cmvSummaryPeriods.length - 1];
    
    const diffPctPoints = last.cmvPct - first.cmvPct;
    const relativeChange = first.cmvPct > 0 ? (diffPctPoints / first.cmvPct) * 100 : 0;
    
    const isLoss = diffPctPoints > 0;
    const isGain = diffPctPoints < 0;
    
    return {
      first,
      last,
      diffPctPoints: Math.round(diffPctPoints * 10) / 10,
      relativeChange: Math.round(relativeChange * 10) / 10,
      isGain,
      isLoss,
    };
  }, [cmvSummaryPeriods]);

  const valuationMetrics = React.useMemo(() => {
    // Take the last 12 months from fiveYearsHistoryData to represent Last 12 Months (LTM)
    const last12Months = fiveYearsHistoryData.slice(-12);
    const ltmRevenue = last12Months.reduce((sum, item) => sum + item.Faturamento, 0);
    const ltmProfit = last12Months.reduce((sum, item) => sum + item.Lucro, 0);
    
    // Simple EBITDA approximation for SMEs: Profit + 8% of total expenses as depreciation/interest
    const ltmExpense = last12Months.reduce((sum, item) => sum + item.Despesas, 0);
    const simulatedEbitda = Math.max(ltmProfit, ltmProfit + (ltmExpense * 0.08)); 
    
    // Scale coefficient based on Governance Score (75 is baseline, 0.7x to 1.3x)
    const governanceFactor = 0.6 + ((valuationGovernanceScore / 100) * 0.6);
    
    // Growth multiplier (growth expected adds value to the multiple, e.g. 20% growth adds 10% multiple bonus)
    const growthFactor = 1 + (valuationGrowthExpected / 150);
    
    // Scenario adjustments
    const scenarioFactor = {
      conservative: 0.75,
      moderate: 1.0,
      aggressive: 1.3
    }[valuationScenario];
    
    const finalMultiplier = Number((valuationCustomMultiplier * governanceFactor * growthFactor * scenarioFactor).toFixed(2));
    
    const valuationByEbitda = simulatedEbitda * finalMultiplier;
    const valuationByRevenue = ltmRevenue * (finalMultiplier * 0.14); // standard revenue proxy multiplier
    
    // Weighted mixed Valuation
    const finalValuation = Math.round((valuationByEbitda * 0.72) + (valuationByRevenue * 0.28));
    
    return {
      ltmRevenue,
      ltmProfit,
      simulatedEbitda: Math.round(simulatedEbitda),
      governanceFactor,
      growthFactor,
      scenarioFactor,
      finalMultiplier,
      valuationByEbitda: Math.round(valuationByEbitda),
      valuationByRevenue: Math.round(valuationByRevenue),
      finalValuation: ltmRevenue > 0 ? Math.max(120000, finalValuation) : 0 // minimum proxy floor only if faturamento exists
    };
  }, [fiveYearsHistoryData, valuationSector, valuationCustomMultiplier, valuationGovernanceScore, valuationGrowthExpected, valuationScenario]);

  const valuationAnalysisText = React.useMemo(() => {
    const { finalValuation, ltmRevenue, finalMultiplier, simulatedEbitda } = valuationMetrics;
    const marginPct = ltmRevenue > 0 ? (simulatedEbitda / ltmRevenue) * 100 : 0;
    
    let sectorText = "";
    let optimizationTips: string[] = [];
    
    switch(valuationSector) {
      case "services":
        sectorText = "O setor de Serviços possui alta previsibilidade se estruturado sob contratos recorrentes (SaaS/Fee Mensal).";
        optimizationTips = [
          "Transforme contratos avulsos em assinaturas anuais recorrentes para reduzir o Churn de clientes.",
          "Profitabilize a operação tornando a empresa independente da presença física dos sócios (eleva Governança).",
          "Mantenha a taxa de ocupação produtiva da equipe acima de 80% para otimizar os custos de prestação."
        ];
        break;
      case "retail":
        sectorText = "O Comércio/Varejo é altamente sensível ao giro de estoques e aos custos de aquisição de mercadorias (CMV).";
        optimizationTips = [
          "Otimize o Ciclo de Caixa (CCC) negociando prazos de pagamento mais longos com seus fornecedores.",
          "Corte produtos de baixa margem (< 12%) que apenas inflam o faturamento secundário sem gerar lucro líquido.",
          "Negocie melhores tarifas de adquirentes e canais online para esticar a margem bruta de contribuição."
        ];
        break;
      case "tech":
        sectorText = "O setor de Tecnologia capitaliza os maiores múltiplos globais pela escalabilidade excepcional e margem de contribuição alta.";
        optimizationTips = [
          "Aumente a Receita Recorrente Anual (ARR) como proporção do faturamento anual total para atingir o prêmio máximo.",
          "Monitore e refine a taxa LTV / CAC buscando índices acima de 3x para otimizar o investimento em marketing.",
          "Desenvolva ferramentas proprietárias e garanta a segurança técnica do software para blindar o fosso competitivo."
        ];
        break;
      case "industry":
        sectorText = "A Indústria tem barreiras de entrada sólidas, mas requer grande imobilização de capital (Capex) em estoque e maquinários.";
        optimizationTips = [
          "Melhore o índice de Eficiência Global dos Equipamentos (OEE) para diluir custos indiretos de fabricação.",
          "Faça um saneamento tributário para recuperar créditos de PIS/COFINS e regimes monofásicos aplicáveis.",
          "Implate metodologias Kanban de gestão de inventário para reduzir drasticamente o dinheiro retido de capital de giro."
        ];
        break;
    }

    const valToRevenueRatio = finalValuation / (ltmRevenue || 1);
    
    return {
      sectorExplanation: sectorText,
      multipleAssessment: finalMultiplier < 4.2 
        ? "Múltiplo conservatively posicionado. Indica excelente oportunidade para compradores de empresas, mas margem de valorização pendente para o controlador."
        : finalMultiplier < 7.8 
        ? "Múltiplo saudável e estruturado. Alinhado ao padrão de liquidez e governança de PMEs estáveis de médio porte no Brasil."
        : "Múltiplo prêmio excepcional. Justificado por forte ritmo de crescimento integrado, alta governança e diferenciação técnica.",
      optimizations: optimizationTips,
      strategicVerdict: finalValuation > 0 
        ? `Avaliada em ${formatCurrency(finalValuation)}, sua empresa está operando com um múltiplo de faturamento de ${valToRevenueRatio.toFixed(2)}x LTM. Para adicionar significativos R$ ${(finalValuation * 0.4).toFixed(0)} ao valuation, foque na expansão da margem líquida e na blindagem de processos operacionais.`
        : `Nenhum faturamento registrado no período selecionado. Colete ou insira seus lançamentos de vendas para que o cockpit calcule o Valuation de mercado em tempo real.`
    };
  }, [valuationMetrics, valuationSector]);

  const priceSensitivityMetrics = React.useMemo(() => {
    // Elasticity formula: % change in Q = - (Elasticity Coeff) * (% price change)
    const pctQtyChange = - (elasticityCoeff) * (elasticityPriceChange);
    
    const { ltmRevenue } = valuationMetrics;
    const currentPrice = 100;
    const newPrice = currentPrice * (1 + (elasticityPriceChange / 100));
    
    const currentQty = ltmRevenue / currentPrice;
    const newQty = currentQty * (1 + (pctQtyChange / 100));
    
    const simulatedNewRevenue = Math.round(newQty * newPrice);
    const revenueDifference = simulatedNewRevenue - ltmRevenue;
    const revDiffPct = ltmRevenue > 0 ? (revenueDifference / ltmRevenue) * 100 : 0;
    
    return {
      pctQtyChange: Math.round(pctQtyChange * 10) / 10,
      simulatedNewRevenue,
      revenueDifference,
      revDiffPct: Math.round(revDiffPct * 10) / 10,
      isPositiveImpact: revenueDifference > 0
    };
  }, [valuationMetrics, elasticityPriceChange, elasticityCoeff]);

  const sandboxComparisonData = React.useMemo(() => {
    const months = fiveYearsHistoryData.slice(-6);
    return months.map(item => {
      // 1. Base/Real EBITDA of the month
      const baseEbitda = Math.round(Math.max(item.Lucro, item.Lucro + (item.Despesas * 0.08)));
      const baseMargin = item.Faturamento > 0 ? (baseEbitda / item.Faturamento) * 100 : 0;

      // 2. Simulated EBITDA and Margin under current sandbox sliders
      const monthlyCardSavings = item.Faturamento * 0.70 * (cardFeeReductionSim / 100);
      const monthlySimRevenue = item.Faturamento * (1 + markupSim / 100);
      const monthlySimExpenses = item.Despesas * (1 - opexSim / 100) - monthlyCardSavings;
      const monthlySimProfit = monthlySimRevenue - Math.max(0, monthlySimExpenses);
      
      const simEbitda = Math.round(Math.max(monthlySimProfit, monthlySimProfit + (Math.max(0, monthlySimExpenses) * 0.08)));
      const simMargin = monthlySimRevenue > 0 ? (simEbitda / monthlySimRevenue) * 100 : 0;

      return {
        name: item.name,
        fullMonth: item.fullMonth,
        "EBITDA Real": baseEbitda,
        "EBITDA Simulado": simEbitda,
        "Margem Real (%)": Math.round(baseMargin * 10) / 10,
        "Margem Simulada (%)": Math.round(simMargin * 10) / 10,
      };
    });
  }, [fiveYearsHistoryData, markupSim, opexSim, cardFeeReductionSim]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  // Working Capital / Markup Automatic Repricing Modal State
  const [showRepricerModal, setShowRepricerModal] = useState(false);
  const [selectedRepriceProductIds, setSelectedRepriceProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (showRepricerModal && products) {
      setSelectedRepriceProductIds(products.map((p) => p.id));
    }
  }, [showRepricerModal, products]);

  // Tax Simulation - Lucro Presumido States
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxBusinessActivity, setTaxBusinessActivity] = useState<"service" | "commerce">("service");
  const [taxCustomRevenue, setTaxCustomRevenue] = useState<number>(0);
  const [taxCustomCurrentRate, setTaxCustomCurrentRate] = useState<number>(6); // Default 6% Simples Nacional rate
  const [taxCustomISSorICMS, setTaxCustomISSorICMS] = useState<number>(3); // ISS or ICMS average rate
  const [taxPayroll, setTaxPayroll] = useState<number>(20000); // Monthly payroll for Fator R Sim
  const [taxAnnualRevenue, setTaxAnnualRevenue] = useState<number>(0); // Cumulative 12 month revenue
  const [taxProfitMargin, setTaxProfitMargin] = useState<number>(15); // Operating profit margin for Lucro Real Sim

  useEffect(() => {
    if (showTaxModal) {
      if (taxCustomRevenue === 0) {
        const initialRev = totalIncome > 0 ? totalIncome : 85000;
        setTaxCustomRevenue(initialRev);
        setTaxAnnualRevenue(initialRev * 12);
        setTaxPayroll(Math.round(initialRev * 0.25)); // Recommend standard ~25%
      } else if (taxAnnualRevenue === 0) {
        setTaxAnnualRevenue(taxCustomRevenue * 12);
      }
    }
  }, [showTaxModal, totalIncome, taxCustomRevenue, taxAnnualRevenue]);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const getIsCmvTransaction = (t: any) => {
    if (t.isCmvExpense) return true;
    const descLower = (t.description || "").toLowerCase();
    if (descLower.includes("cmv, custo") || descLower.includes("custo de vendas") || descLower.includes("cmv - ")) return true;
    const cat = categories.find((c) => c.id === t.categoryId);
    if (cat) {
      const catName = cat.name.toLowerCase();
      if (cat.group === "COGS" || catName.includes("cmv") || catName.includes("custo de vendas") || catName.includes("custo de mercadoria") || catName.includes("custo dos produtos")) return true;
    }
    return false;
  };

  const totalCmvExpense = transactions
    .filter((t) => t.type === "expense" && getIsCmvTransaction(t))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOpexExpense = transactions
    .filter((t) => t.type === "expense" && !getIsCmvTransaction(t))
    .reduce((acc, t) => acc + t.amount, 0);
  const totalProductSales = transactions
    .filter((t) => t.type === "income" && t.isProductSale)
    .reduce((acc, t) => acc + t.amount, 0);
  const totalGeneralSales = transactions
    .filter((t) => t.type === "income" && !t.isProductSale)
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const totalInvestments = transactions
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return cat?.group === "INVESTMENT";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Dynamic health evaluation for the cards
  const balanceHealth = (() => {
    const totalCap = balance + totalInvestments;
    if (totalCap >= totalExpense * 1.3) return "good";
    if (totalCap >= totalExpense * 0.4) return "regular";
    return "poor";
  })();

  const incomeHealth = (() => {
    if (totalIncome >= totalExpense * 1.15) return "good";
    if (totalIncome >= totalExpense * 0.9) return "regular";
    return "poor";
  })();

  const expenseHealth = (() => {
    if (totalIncome === 0) return totalExpense === 0 ? "good" : "poor";
    const ratio = totalExpense / totalIncome;
    if (ratio <= 0.45) return "good";
    if (ratio <= 0.8) return "regular";
    return "poor";
  })();

  const chartData = [
    { name: "Receitas", value: totalIncome },
    { name: "Despesas", value: totalExpense },
  ];

  // Raw variables from real DRE data of the current month
  const dreData = getDRE(new Date());
  const getVal = (label: string) => Math.abs(dreData.find((line) => line.label === label || line.label.includes(label))?.value || 0);
  const recBruta = getVal("RECEITA OPERACIONAL BRUTA") || totalIncome;
  const cmv = getVal("(-) Custos dos Produtos/Serviços (CMV/CPV)");
  const opex = getVal("(-) Despesas Operacionais (OPEX)") || totalExpense;
  const lucroBruto = getVal("(=) LUCRO BRUTO") || (recBruta - cmv);

  // Safe Division Helper
  const percentDivider = (numerator: number, denominator: number) => {
    if (denominator <= 0) return 0;
    return (numerator / denominator) * 100;
  };

  // Base metrics from the operational history
  const baseMC = recBruta > 0 ? (lucroBruto / recBruta) * 100 : 50; 
  const baseBreakeven = baseMC > 0 ? (opex / (baseMC / 100)) : opex;
  const basePeriodExpense = cmv + opex;
  const baseDailyBurn = basePeriodExpense > 0 ? (basePeriodExpense / 30) : (balance > 0 ? (balance / 30) : 100);
  const baseRunwayDays = balance > 0 ? Math.max(0, Math.round(balance / baseDailyBurn)) : 0;

  // Sandbox simulation calculus
  const cardSavings = recBruta * 0.70 * (cardFeeReductionSim / 100); // Assuming 70% of transactions on card machine
  const simRevenue = recBruta * (1 + markupSim / 100);
  // CMV represents unit costs, stays relative to quantity unless specified, so general margin expands. Card fee savings are added to bottom-line
  const simLucroBruto = Math.max(0, simRevenue - cmv + cardSavings);
  const simMC = simRevenue > 0 ? (simLucroBruto / simRevenue) * 100 : baseMC;
  const simOpex = opex * (1 - opexSim / 100);
  const simBreakeven = simMC > 0 ? (simOpex / (simMC / 100)) : simOpex;
  
  const simPeriodExpense = Math.max(0, cmv + simOpex - cardSavings);
  const simDailyBurn = simPeriodExpense > 0 ? (simPeriodExpense / 30) : (balance > 0 ? 100 : 1);
  const simRunwayDays = balance > 0 ? Math.max(0, Math.round(balance / simDailyBurn)) : baseRunwayDays;

  // Innovation Setup Data & Metrics
  const innovationProjects = {
    ia: {
      title: "Automação por IA & CRM de Vendas",
      desc: "Implementação de assistentes virtuais de atendimento automáticos via WhatsApp e funil de vendas ativo gerido por inteligência artificial.",
      baseCost: 12000,
      revBoostPct: 15,
      opexSavingsFixed: 2000,
      cmvReductionPct: 0,
      opexReductionPct: 0,
      icon: <Cpu className="w-5 h-5 text-emerald-500" />,
      complexity: "Baixa",
      tag: "Inteligência de Vendas"
    },
    software: {
      title: "ERP Integrado & SaaS Customizado",
      desc: "Plataforma de gestão digital de estoque integrado ao faturamento do grupo e fluxo automatizado com fornecedores de OPEX.",
      baseCost: 28000,
      revBoostPct: 8,
      opexSavingsFixed: 0,
      cmvReductionPct: 0,
      opexReductionPct: 15,
      icon: <Brain className="w-5 h-5 text-emerald-500" />,
      complexity: "Média",
      tag: "Eficiência Estrutural"
    },
    equipamento: {
      title: "Maquinários High-Tech & Robótica",
      desc: "Automação física de processos de produção e empacotamento, otimizando os custos unitários e insumos diretos.",
      baseCost: 45000,
      revBoostPct: 5,
      opexSavingsFixed: 1000,
      cmvReductionPct: 20,
      opexReductionPct: 0,
      icon: <Lightbulb className="w-5 h-5 text-emerald-500" />,
      complexity: "Alta",
      tag: "Otimização de CMV"
    }
  };

  const currentProj = innovationProjects[selectedInnovationId];
  const mult = innovationIntensity / 100;
  
  const estimatedAppCost = currentProj.baseCost * mult;
  const estimatedRevBoost = recBruta * (currentProj.revBoostPct / 100) * mult;
  
  let estimatedOpexSavings = 0;
  if (currentProj.opexSavingsFixed) {
    estimatedOpexSavings += currentProj.opexSavingsFixed * mult;
  }
  if (currentProj.opexReductionPct) {
    estimatedOpexSavings += opex * (currentProj.opexReductionPct / 100) * mult;
  }

  const estimatedCmvSavings = cmv * (currentProj.cmvReductionPct / 100) * mult;

  const inovRevenue = recBruta + estimatedRevBoost;
  const inovCmv = Math.max(0, cmv - estimatedCmvSavings);
  const inovOpex = Math.max(0, opex - estimatedOpexSavings);
  const inovLucroBruto = inovRevenue - inovCmv;
  const inovLucroLiquido = inovLucroBruto - inovOpex;
  const traditionalLucroLiquido = lucroBruto - opex;

  const monthlyIncrementalGain = Math.max(0, inovLucroLiquido - traditionalLucroLiquido);
  const paybackMonths = monthlyIncrementalGain > 10 ? (estimatedAppCost / monthlyIncrementalGain) : 99;
  const dynamicROIYear = estimatedAppCost > 0 ? (((monthlyIncrementalGain * 12) - estimatedAppCost) / estimatedAppCost) * 100 : 0;

  const projectionData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = i + 1;
    const traditionalCumulative = traditionalLucroLiquido * monthIndex;
    const inovCumulative = inovLucroLiquido * monthIndex - estimatedAppCost;
    return {
      name: `Mês ${monthIndex}`,
      "Trabalho Tradicional": Math.round(traditionalCumulative),
      "Modelo com Inovação": Math.round(inovCumulative),
    };
  });

  const renderTelemetry = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0c0c0c] text-white border-2 border-orange-500 rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-4 right-4 text-[9px] font-mono text-orange-500 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full font-black uppercase tracking-widest">
        SYSTEM ACTIVE // v2.6.4
      </div>

      <div className="space-y-3 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-orange-500 text-black font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5" /> PLATAFORMA MAXPERFORMANCE CONECTADA
          </span>
          <span className="bg-white/10 text-orange-400 font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-orange-500/25">
            MICROPROCESSAMENTO REATIVO ATIVO
          </span>
        </div>
        <h2 className="font-black text-2xl sm:text-4xl uppercase tracking-tight italic text-white flex items-center gap-2">
          Inteligência Financeira de Próxima Geração
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed max-w-4xl">
          Bem-vindo à cabine de comando da **MaxPerformance Business**. Um ecossistema de alta fidelidade computacional, unindo inteligência de negócios (BI), cenários sandbox preditivos e auditoria automática por IA de nichos comerciais.
        </p>
      </div>

      {/* Dynamic Horizontal Technical Stack Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-white/10 pt-5">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-orange-400">
            <Code2 className="w-4 h-4" />
            <span className="font-black text-[11px] uppercase tracking-wider">React 18 & TS 5</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-snug">
            Client-side ultra reativo impulsionado pelo compilador <strong>Vite ESM</strong> de re-renders sob demanda em sub-milissegundos.
          </p>
        </div>

        <div className="space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-orange-400">
            <Cpu className="w-4 h-4" />
            <span className="font-black text-[11px] uppercase tracking-wider">SDK @google/genai</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-snug">
            Consultoria contábil por IA generativa usando chamadas de proxy seguras ao modelo <strong>Gemini Flash/Pro</strong>.
          </p>
        </div>

        <div className="space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-orange-400">
            <Layers className="w-4 h-4" />
            <span className="font-black text-[11px] uppercase tracking-wider">Recharts (D3 layout)</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-snug">
            Cálculo vetorial e renderização em SVG puros para gráficos instantâneos de caixa, de metas de nicho e simulação DRE.
          </p>
        </div>

        <div className="space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-orange-400">
            <Terminal className="w-4 h-4" />
            <span className="font-black text-[11px] uppercase tracking-wider">Firestore & LS Cache</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-snug">
            Persistência híbrida assíncrona baseada em <strong>localStorage</strong> offline com sincronização em nuvem do <strong>Firebase Cloud</strong>.
          </p>
        </div>
      </div>
    </motion.div>
  );

  const renderLatestTransactions = () => (
    <div className="bg-[#0c0c0c] text-white p-6 lg:p-8 rounded-[2.5rem] shadow-2xl border-2 border-orange-500/20 relative overflow-hidden transition-all duration-500 flex flex-col justify-between text-left">
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-[60px] pointer-events-none" />
      
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="bg-orange-500 text-black font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-sm inline-block mb-1">
              HISTÓRICO ATIVO // OPERACIONAL
            </span>
            <h3 className="font-black uppercase italic tracking-tighter text-xl text-white">
              Atividade Recente
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Últimos 5 registros de transações
            </p>
          </div>
          <div
            className="p-3 bg-white/5 border border-white/5 rounded-2xl text-orange-400 hover:text-white transition-colors cursor-pointer"
            onClick={() => {
              sound.playClick();
              setActiveTab("transactions");
            }}
          >
            <ReceiptText size={24} />
          </div>
        </div>
        
        <div className="space-y-3">
          {transactions.slice(0, 5).map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-orange-500/5 group transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform",
                    t.type === "income"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20",
                  )}
                >
                  {t.type === "income" ? (
                    <ArrowUpCircle size={20} />
                  ) : (
                    <ArrowDownCircle size={20} />
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-sm text-white uppercase tracking-tighter font-mono group-hover:text-orange-400 transition-colors">
                    {t.description}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest font-mono">
                    {format(new Date(t.date), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  "font-black text-sm font-mono tracking-tighter",
                  t.type === "income" ? "text-emerald-400" : "text-red-400",
                )}
              >
                {t.type === "income" ? "+" : "-"} {formatCurrency(t.amount)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-[#141414] rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-xl relative overflow-hidden text-left"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
        <div className="space-y-1 text-left font-sans">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#141414] text-white font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 leading-none">
              <Target size={11} className="text-orange-500" /> Metas Trimestrais & OKRs
            </span>
            <span className="bg-orange-100 text-orange-700 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md">
              Monitoramento Operacional
            </span>
          </div>
          <h3 className="font-black text-2xl lg:text-3xl uppercase tracking-tight text-[#141414] italic">
            Objetivos de Crescimento PJ
          </h3>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-3xl">
            Confira e controle as metas operacionais de faturamento e rentabilidade calibradas para o nicho de mercado do seu negócio. O acompanhamento contínuo destes indicadores blinda a rentabilidade do seu caixa.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab("billing-goal");
          }}
          className="w-full sm:w-auto self-start sm:self-center bg-gray-50 border border-gray-250 hover:bg-gray-100/60 text-gray-700 hover:text-black font-black text-xs uppercase tracking-widest py-3 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          Configurar Objetivos
          <ChevronRight size={14} className="text-orange-500" />
        </button>
      </div>

      {dashboardGoals.length === 0 ? (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-left">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-1.5 text-amber-700 font-black uppercase text-[11px] font-sans">
              <AlertCircle size={15} />
              <span>Nenhuma meta adicional ativada no trimestre</span>
            </div>
            <p className="text-xs text-amber-900 font-semibold leading-relaxed">
              Você ainda não registrou metas secundárias baseadas em Ticket de Atendimento, CAC, Volume de Vendas ou Churn no planejador. Tracejar objetivos táticos claros de faturamento para o seu time do dia a dia é o primeiro pilar do crescimento inteligente.
            </p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab("billing-goal");
            }}
            className="bg-[#141414] hover:bg-[#1a1a1a] text-orange-500 hover:text-orange-400 font-black text-xs uppercase tracking-widest py-3 px-6 rounded-2xl cursor-pointer shrink-0 shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle size={15} /> Cadastrar Metas Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {dashboardGoals.map((g, idx) => {
              const { progress, label: progressLabel } = getGoalStatusAndProgress(g);
              const typeColor = 
                g.type === 'income' ? 'bg-indigo-50 border-indigo-150 text-indigo-700' :
                g.type === 'profit' ? 'bg-emerald-50 border-emerald-150 text-emerald-700' :
                g.type === 'ticket' ? 'bg-orange-50 border-orange-150 text-orange-700' :
                g.type === 'sales_volume' ? 'bg-sky-50 border-sky-150 text-sky-700' :
                g.type === 'liquidity' ? 'bg-teal-50 border-teal-150 text-teal-700' :
                'bg-slate-50 border-slate-150 text-slate-700';

              const typeBadge = 
                g.type === 'income' ? '💰 Faturamento' :
                g.type === 'profit' ? '📈 Lucratividade' :
                g.type === 'ticket' ? '🏷️ Ticket Médio' :
                g.type === 'sales_volume' ? '📦 Vol. Vendas' :
                g.type === 'acquisition_cost' ? '🎯 CAC' :
                g.type === 'churn' ? '⚠️ Churn' : 
                g.type === 'liquidity' ? '💧 Liquidez 30d' : '⚙️ Geral';

              return (
                <motion.div 
                  key={g.id} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  className={cn(
                    "bg-white border rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all relative overflow-hidden text-left",
                    g.reached ? "border-emerald-100 bg-[#fafafa]/65" : "border-gray-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider", typeColor)}>
                        {typeBadge}
                      </span>
                      <p className={cn(
                        "text-[13px] font-black tracking-tight leading-tight pt-1.5 uppercase truncate text-gray-900",
                        g.reached && "line-through text-gray-400"
                      )}>
                        {g.title}
                      </p>
                      <p className="text-[10px] text-gray-500 font-semibold truncate">
                        Alvo: <strong className="font-bold text-gray-800">{g.type === 'income' || g.type === 'ticket' || (g.type === 'liquidity' && g.targetValue > 10) ? formatCurrency(g.targetValue) : g.type === 'liquidity' ? `${g.targetValue}x OPEX` : g.targetValue}</strong>
                        {g.deadline ? ` | Prazo: ${g.deadline}` : ''}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={g.reached || false}
                      onChange={() => handleToggleDashboardGoal(g.id)}
                      className="rounded text-orange-500 focus:ring-orange-500 h-5 w-5 cursor-pointer accent-orange-500 shrink-0"
                      title={g.reached ? "Reabrir meta" : "Marcar como atingida"}
                    />
                  </div>

                  <div className="space-y-2 border-t border-gray-100 pt-3 group/progress relative">
                    <div className="flex items-center justify-between text-[9px] font-mono font-bold leading-none">
                      <span className="text-gray-400 truncate max-w-[80%]" title={progressLabel}>{progressLabel}</span>
                      <span className={cn(
                        "font-black text-[10px]",
                        g.reached ? "text-emerald-700" : "text-orange-600"
                      )}>
                        {progress}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden cursor-help relative">
                      <motion.div 
                        className={cn(
                          "h-full rounded-full",
                          g.reached ? "bg-emerald-500" : "bg-orange-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>

                    {/* Dynamic Tooltip Popover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-slate-950 text-white rounded-2xl p-3 shadow-xl ring-1 ring-white/10 opacity-0 scale-95 pointer-events-none group-hover/progress:opacity-100 group-hover/progress:scale-100 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 transform origin-bottom font-sans">
                      <div className="absolute top-[99%] left-1/2 -translate-x-1/2 border-6 border-transparent border-t-slate-950" />
                      
                      <div className="space-y-1.5 text-center">
                        <div className="border-b border-white/5 pb-1 flex justify-between items-center">
                          <span className="text-[8px] uppercase tracking-widest font-black text-slate-400 font-mono">Status da Meta</span>
                          <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full font-mono", g.reached ? "bg-emerald-500/20 text-emerald-300" : "bg-orange-500/20 text-orange-300")}>
                            {g.reached ? "Concluída" : "Em Andamento"}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-200">
                          Progresso: <strong className="font-mono text-white text-xs">{progress}%</strong>
                        </div>
                        <div className="text-[10px] text-slate-300 leading-normal font-medium bg-white/5 p-1.5 rounded-lg border border-white/5">
                          {(() => {
                            if (g.reached) return "🎉 Parabéns! Objetivo atingido.";
                            if (g.desiredProfitMargin && g.desiredProfitMargin > 0) {
                              if (g.type === 'income') {
                                const realProfitTarget = g.targetValue * (g.desiredProfitMargin / 100);
                                const diff = realProfitTarget - currentMonthProfit;
                                return diff <= 0 ? "Meta superada!" : `Falta ${formatCurrency(diff)} de lucro`;
                              } else if (g.type === 'profit') {
                                const diff = g.targetValue - currentMonthMarginPct;
                                return diff <= 0 ? "Meta superada!" : `Faltam ${diff.toFixed(1)}% de margem`;
                              }
                            }
                            if (g.type === 'income') {
                              const diff = g.targetValue - currentMonthIncome;
                              return diff <= 0 ? "Meta superada!" : `Falta ${formatCurrency(diff)} faturado`;
                            } else if (g.type === 'profit') {
                              const diff = g.targetValue - currentMonthMarginPct;
                              return diff <= 0 ? "Meta superada!" : `Faltam ${diff.toFixed(1)}% de margem`;
                            } else if (g.type === 'ticket') {
                              const diff = g.targetValue - averageTicket;
                              return diff <= 0 ? "Meta superada!" : `Falta ${formatCurrency(diff)} no Ticket`;
                            }
                            return `Falta ${100 - progress}% para atingir o alvo`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );

  const ebitda3Months = React.useMemo(() => {
    const last3 = fiveYearsHistoryData.slice(-3);
    if (last3.length < 3) return [];
    return last3.map(item => {
      // Approximation for SMEs EBITDA: Profit + 8% of expenses as depreciation/interest
      const ebitdaVal = Math.round(Math.max(item.Lucro, item.Lucro + (item.Despesas * 0.08)));
      return {
        ...item,
        ebitda: ebitdaVal,
        ebitdaMargin: item.Faturamento > 0 ? (ebitdaVal / item.Faturamento) * 100 : 0
      };
    });
  }, [fiveYearsHistoryData]);

  const renderEbitdaComparison = () => {
    if (ebitda3Months.length < 3) return null;

    const m2 = ebitda3Months[0]; // Month N-2
    const m1 = ebitda3Months[1]; // Month N-1
    const m0 = ebitda3Months[2]; // Month N (Current)

    const changePct = m1.ebitda !== 0 ? ((m0.ebitda - m1.ebitda) / m1.ebitda) * 100 : 0;
    const prevChangePct = m2.ebitda !== 0 ? ((m1.ebitda - m2.ebitda) / m2.ebitda) * 100 : 0;

    const isUp = changePct >= 0;
    const isPrevUp = prevChangePct >= 0;

    // Trend description
    let trendLabel = "";
    let trendColor = "";
    let trendbgColor = "";
    let trendDesc = "";
    let adviceText = "";

    if (isUp && isPrevUp) {
      trendLabel = "Alta Consistente 🚀";
      trendColor = "text-emerald-500";
      trendbgColor = "bg-emerald-500/10 border-emerald-500/25";
      trendDesc = "A performance operacional EBITDA está em expansão sequencial consolidada de alta performance.";
      adviceText = "Momento excelente para reinvestir parte deste excedente operacional em escala de novos canais de faturamento ou redução ativa de passivos.";
    } else if (isUp && !isPrevUp) {
      trendLabel = "Recuperação Operacional 📈";
      trendColor = "text-amber-500";
      trendbgColor = "bg-amber-500/10 border-amber-500/25";
      trendDesc = "Inversão de tendência de EBITDA detectada. O EBITDA real voltou a crescer após o recuo do mês anterior.";
      adviceText = "Mantenha o controle de custos (OPEX) e priorize a consolidação das margens saudáveis antes de efetuar novos aportes substanciais.";
    } else if (!isUp && isPrevUp) {
      trendLabel = "Correção de Percurso 📉";
      trendColor = "text-orange-500";
      trendbgColor = "bg-orange-500/10 border-orange-500/25";
      trendDesc = "Recuo temporário apontando contração de eficiência após um período de expansão operacional do EBITDA.";
      adviceText = "Audite se houve inflação de custos variáveis ou se novos passivos ociosos sufocaram a margem de contribuição deste mês.";
    } else {
      trendLabel = "Atenção Primária ⚠️";
      trendColor = "text-red-500";
      trendbgColor = "bg-red-500/10 border-red-500/25";
      trendDesc = "Dois meses consecutivos de retração operacional acumulada de EBITDA real.";
      adviceText = "Gatilho crítico de contingência sugerido. É ideal efetuar uma auditoria rigorosa de preços de venda por SKU e corte imediato de custos redundantes.";
    }

    const maxValue = Math.max(m0.ebitda, m1.ebitda, m2.ebitda, 1000);

    return (
      <div className="bg-[#0c0c0c] text-white border-2 border-orange-500 rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Custom Header Badge */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[9px] uppercase tracking-widest font-black px-3 py-1 rounded-full font-mono">
              📊 MONITOR DE COMPETÊNCIA OPERACIONAL
            </span>
            <h3 className="font-black text-xl sm:text-2xl uppercase tracking-tight italic text-white flex items-center gap-2">
              Análise de Tendência EBITDA <span className="text-[10px] sm:text-xs font-mono font-medium not-italic text-gray-400 select-none">(Trimestre Corrente)</span>
            </h3>
          </div>
          <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5", trendbgColor)}>
            <span className="relative flex h-2 w-2">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isUp ? "bg-emerald-400" : "bg-orange-400")} />
              <span className={cn("relative inline-flex rounded-full h-2 w-2", isUp ? "bg-emerald-500" : "bg-orange-500")} />
            </span>
            <span className={trendColor}>{trendLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Stat and Trend Indicators */}
          <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest block">EBITDA Corrente ({m0.name})</span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-4xl font-extrabold tracking-tight font-mono text-white">
                  {formatCurrency(m0.ebitda)}
                </span>
                <span className={cn("text-xs font-black px-2 py-0.5 rounded-lg border", 
                  isUp 
                    ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400" 
                    : "bg-rose-500/15 border-rose-500/20 text-rose-450"
                )}>
                  {isUp ? "↑ +" : "↓ "}{changePct.toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-snug font-medium pt-1">
                Representa uma margem EBITDA de <strong className="text-white font-mono">{m0.ebitdaMargin.toFixed(1)}%</strong> baseada em faturamento bruto de {formatCurrency(m0.faturamento)}.
              </p>
            </div>

            {/* Neural explanation block */}
            <div className="bg-orange-500/5 border border-orange-500/10 p-3.5 rounded-2xl flex items-start gap-2.5">
              <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white text-[10px] font-black shadow-md shadow-orange-500/10 select-none mt-0.5">
                AI
              </div>
              <div className="space-y-1 text-[10.5px] leading-relaxed">
                <p className="text-orange-400 font-extrabold uppercase text-[8px] tracking-widest font-mono select-none">Parecer Estratégico da Dafne</p>
                <p className="text-gray-300 font-medium">
                  {trendDesc} {adviceText}
                </p>
              </div>
            </div>
          </div>

          {/* Graphical/Columns Bar Comparison Visualizer */}
          <div className="lg:col-span-7 bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] flex flex-col justify-between space-y-5">
            <div className="text-[8.5px] uppercase tracking-widest font-black text-gray-400 text-left select-none">
              Histórico de Competência Operacional Real
            </div>
            
            {/* Visual Bar Pillars of the three months */}
            <div className="flex justify-around items-end gap-3 px-2 pt-2 h-36">
              {[m2, m1, m0].map((m, idx) => {
                const heightPct = Math.max(10, Math.round((m.ebitda / maxValue) * 100));
                // Colors layout for each pill-bar based on its index
                let barColor = "from-zinc-700 to-zinc-650 text-zinc-300"; // fallback
                if (idx === 0) barColor = "from-zinc-800 to-zinc-705 text-zinc-400 border border-white/5";
                else if (idx === 1) barColor = "from-orange-500/50 to-orange-500/30 text-orange-200 border border-orange-500/15";
                else barColor = isUp ? "from-emerald-500 to-teal-500 text-black font-black" : "from-orange-500 to-amber-500 text-black font-black";

                return (
                  <div key={m.name} className="flex flex-col items-center flex-1 space-y-2 h-full justify-end max-w-[90px]">
                    <div className="text-[10px] font-mono font-bold select-all text-white shrink-0 mb-1">
                      {formatCurrency(m.ebitda)}
                    </div>
                    
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ type: "spring", damping: 15, stiffness: 80, delay: idx * 0.15 }}
                      className={cn(
                        "w-full bg-gradient-to-t rounded-2xl relative shadow-lg overflow-hidden flex items-end justify-center py-2.5 min-h-[25px]",
                        barColor
                      )}
                    >
                      {/* Glow effect on hover */}
                      <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                      <span className="text-[8.5px] font-mono font-black tracking-tighter uppercase shrink-0 leading-none pb-0.5 flex flex-col items-center">
                        <span>{m.ebitdaMargin.toFixed(0)}%</span>
                        <span className="text-[5.5px] opacity-75 font-medium tracking-normal select-none uppercase">margem</span>
                      </span>
                    </motion.div>

                    <div className="text-[9.5px] font-mono font-extrabold text-gray-400 shrink-0 text-center uppercase">
                      {m.name}
                      <span className="block text-[7px] font-medium text-gray-500 capitalize leading-none pt-0.5">{m.fullMonth.split(" ")[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Performance Stats Subfield */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div className="space-y-0.5 text-left border-r border-[#141414]/5 pr-2">
                <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Período Anterior</span>
                <p className="text-[10.5px] text-gray-300 font-bold font-mono">
                  {m2.name} → {m1.name}:{" "}
                  <span className={isPrevUp ? "text-emerald-400" : "text-rose-450"}>
                    {isPrevUp ? "↑ +" : "↓ "}{prevChangePct.toFixed(1)}%
                  </span>
                </p>
              </div>

              <div className="space-y-0.5 text-left pl-2">
                <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Último Período</span>
                <p className="text-[10.5px] text-gray-300 font-bold font-mono">
                  {m1.name} → {m0.name}:{" "}
                  <span className={isUp ? "text-emerald-400" : "text-rose-450"}>
                    {isUp ? "↑ +" : "↓ "}{changePct.toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkingCapital = () => {
    const currentMonthDRE = getDRE(new Date());
    const dCmv = currentMonthDRE.find(l => l.label.toLowerCase().includes("custos de") || l.label.toLowerCase().includes("cmv"));
    const dOpex = currentMonthDRE.find(l => l.label.toLowerCase().includes("despesas operacionais") || l.label.toLowerCase().includes("opex"));
    const realExpense = Math.abs(dCmv ? dCmv.value : 0) + Math.abs(dOpex ? dOpex.value : 0);

    const totalPendingBills = bills
      ? bills
          .filter(b => b.status === "pending" || b.status === "overdue")
          .reduce((sum, b) => sum + b.amount, 0)
      : 0;

    const totalGlobalOutflow = realExpense + totalPendingBills;
    const baseOutflowValue = totalGlobalOutflow > 0 ? totalGlobalOutflow : 35000;
    const dailyOutflow = baseOutflowValue / 30;

    const baseDso = (wcPixExpress ? 2 : 35) * (wcCenarioCrise ? 2 : 1);
    const baseDio = 45;
    const baseDpo = wcAcordoFornecedores ? 28 + 15 : 28;
    const calculatedCCC = baseDso + baseDio - baseDpo;

    const adjustedDailyOutflow = wcOtimizarCustos ? dailyOutflow * 0.85 : dailyOutflow;

    const defaultCCC = calculatedCCC; // dynamically updated defaultCCC
    const workingCapitalNeed = calculatedCCC * adjustedDailyOutflow;

    // For comparison
    const originalCCC = 35 + 45 - 28; // 52 days
    const originalWorkingCapitalNeed = originalCCC * dailyOutflow;
    const releasedCapital = Math.max(0, originalWorkingCapitalNeed - workingCapitalNeed);

    // Dynamic Health and Score Calculations shared across widgets and AI advisor
    const baseHealth = calculateHealthScore(getDRE(new Date()), transactions, simulatedCrisis, isDemoMode);
    let displayScore = Math.round(baseHealth.score * 10);
    let contributionMargin = baseHealth.margemContribuicao; // default is 68.5% or 18.5%

    if (wcCenarioCrise) {
      // Dobra os prazos de recebimento e reduz a margem de contribuição em 10%
      contributionMargin = Math.max(0, contributionMargin - 10);
      // Reduce display score proportionally due to doubled collection gap + margin crunch
      displayScore = Math.max(12, displayScore - 42);
    }

    if (wcPixExpress) displayScore = Math.min(100, displayScore + 18);
    if (wcAcordoFornecedores) displayScore = Math.min(100, displayScore + 12);
    if (wcOtimizarCustos) displayScore = Math.min(100, displayScore + 10);

    const cccHistoryData = [
      { month: "Jan/26", ccc: 68, efficiency: "Excesso de prazos concedidos" },
      { month: "Fev/26", ccc: 64, efficiency: "Estoques em maturação lenta" },
      { month: "Mar/26", ccc: 60, efficiency: "Início de readequação de OPEX" },
      { month: "Abr/26", ccc: 57, efficiency: "Faturamento e recebíveis otimizados" },
      { month: "Mai/26", ccc: 54, efficiency: "Parcerias de prazo com fornecedores" },
      { month: "Jun/26", ccc: calculatedCCC, efficiency: calculatedCCC !== 52 ? "Ciclo otimizado via simulação tática" : "Eficiência operacional integrada correntemente" },
    ];

    // -------------------------------------------------------------
    // CÁLCULO E DIAGNÓSTICO INTEGRADO DO RISCO DE MARKUP (DRE)
    // -------------------------------------------------------------
    // 1. Margem de markup médio real dos produtos
    const validMarkupProdList = (products || []).filter(p => p.costPrice > 0);
    const avgProductMarkup = validMarkupProdList.length > 0
      ? validMarkupProdList.reduce((sum, p) => sum + (p.sellingPrice / p.costPrice), 0) / validMarkupProdList.length
      : 1.65; // fallback se não houver produtos cadastrados

    // 2. Valores reais operacionais extraídos do fechamento do DRE
    const findDREValue = (lbl: string) =>
      Math.abs(currentMonthDRE.find((line) => line?.label === lbl)?.value || 0);

    const faturamentoDRE = findDREValue("RECEITA OPERACIONAL BRUTA") || (isDemoMode ? 42050 : 35000);
    const opexDRE = findDREValue("(-) Despesas Operacionais (OPEX)") || (isDemoMode ? 16800 : 12000);
    
    // Ponto de Equilíbrio baseado na estrutura de custos fixos do DRE
    // Margem de contribuição média requerida para cobrir OPEX no faturamento atual
    const requiredMarginPct = faturamentoDRE > 0 ? (opexDRE / faturamentoDRE) * 100 : 35;
    const safeRequiredMargin = Math.min(90, Math.max(5, requiredMarginPct));
    
    // Required markup to break-even: Preço de Custo / (1 - Margem Requerida%)
    // Multiplicador = 1 / (1 - MargemRequerida%)
    const requiredBreakevenMarkup = 1 / (1 - safeRequiredMargin / 100);

    const actualMarkup = avgProductMarkup;
    const breakEvenMarkup = requiredBreakevenMarkup;
    const markupDiff = actualMarkup - breakEvenMarkup;

    // Cálculo do Markup projetado considerando despesas fixas extras simuladas pelo slider
    const projectedOpexDRE = opexDRE + extraFixedExpense;
    const projectedRequiredMarginPct = faturamentoDRE > 0 ? (projectedOpexDRE / faturamentoDRE) * 100 : 35;
    const safeProjectedRequiredMargin = Math.min(90, Math.max(5, projectedRequiredMarginPct));
    const projectedBreakEvenMarkup = 1 / (1 - safeProjectedRequiredMargin / 100);

    // NOVO: Cálculo determinístico dos últimos 30 dias para variação do markup e risco de giro (calculado inline sem usar Hooks para respeitar as regras do React)
    const last30DaysMarkupData = (() => {
      const data: any[] = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        // Pequena variação determinística senoidal sem efeitos colaterais de re-render
        const noise = Math.sin(i / 3.2) * 0.05 + Math.cos(i / 1.8) * 0.03;
        // Tendência que converge para o markup de hoje
        const trend = (actualMarkup - 0.12) + (0.12 * (30 - i) / 30) + noise;
        const finalVal = Number(Math.max(1.10, trend).toFixed(2));
        data.push({
          date: dayStr,
          markup: finalVal,
          breakeven: Number(breakEvenMarkup.toFixed(2)),
          isAtRisk: finalVal < breakEvenMarkup
        });
      }
      return data;
    })();

    // Definição visual do nível de risco por markup
    let riskLabel = "Baixo Risco (Saudável)";
    let riskColorClass = "text-emerald-450 bg-emerald-500/10 border-emerald-500/20";
    let riskBadgeColor = "bg-emerald-500";
    let riskBarIndicatorColor = "border-emerald-500 bg-emerald-400";
    let diagnosticAdvice = "Seu multiplicador médio de precificação cobre com folga as despesas operacionais da empresa.";

    if (markupDiff < -0.15) {
      riskLabel = "Risco Crítico (Erosão de Caixa)";
      riskColorClass = "text-rose-450 bg-rose-500/10 border-rose-500/20 animate-pulse";
      riskBadgeColor = "bg-rose-500";
      riskBarIndicatorColor = "border-rose-500 bg-rose-400";
      diagnosticAdvice = "Atenção: Seu markup de venda médio está significativamente abaixo do ponto de equilíbrio necessário do DRE. Eleve preços ou reveja os custos operacionais (OPEX) imediatamente.";
    } else if (markupDiff < 0) {
      riskLabel = "Risco Moderado (Alerta de Lucro)";
      riskColorClass = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      riskBadgeColor = "bg-yellow-550";
      riskBarIndicatorColor = "border-yellow-400 bg-yellow-300";
      diagnosticAdvice = "Sinal Amarelo: O markup atual está no limite para cobrir as contas fixas. Qualquer oscilação de faturamento pode levar a operação ao prejuízo.";
    }

    // Mapeamento das percentagens visuais na escala de risco: Green (0% risco / 3.0x markup) a Red (100% risco / 1.0x markup)
    const getRiskTrackPercentage = (mu: number) => {
      const p = ((3.0 - mu) / (3.0 - 1.0)) * 100;
      return Math.min(100, Math.max(0, p));
    };

    const actualMarkupRiskPct = getRiskTrackPercentage(actualMarkup);
    const breakEvenMarkupRiskPct = getRiskTrackPercentage(breakEvenMarkup);

    return (
      <div 
        className={cn(
          "bg-gradient-to-br from-[#1c1c1c] via-[#141414] to-[#1a1511] text-white border rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-xl relative overflow-hidden text-left transition-all duration-500 ease-in-out",
          // Hover interactions and borders colored precisely based on markup risk level
          markupDiff < -0.15 
            ? "border-rose-500/30 hover:border-rose-500/50 hover:shadow-[0_0_35px_rgba(239,68,68,0.22)] shadow-rose-950/20 shadow-2.5xl" 
            : markupDiff < 0 
            ? "border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_0_35px_rgba(245,158,11,0.18)] shadow-amber-950/10 shadow-2.5xl" 
            : "border-white/5 hover:border-emerald-500/30 hover:shadow-[0_0_35px_rgba(16,185,129,0.18)] shadow-black/40",
          !isWcSimulatorOpen && "cursor-pointer hover:scale-[1.005]"
        )} 
        id="cockpit-working-capital-widget"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button") || target.closest("input") || target.closest("textarea") || target.closest("select") || target.closest(".recharts-wrapper") || target.closest(".cursor-pointer")) {
            return;
          }
          setIsWcSimulatorOpen(prev => !prev);
          sound.playClick();
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4 relative z-10 font-sans">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-black font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded font-mono">
                Métrica Operacional
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight italic mt-1">Capital de Giro & Giro de Caixa</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mt-0.5">
              <p className="text-xs text-gray-400">Análise estrutural baseada no descasamento de caixa real integrado às contas a pagar e custos.</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setIsWcSimulatorOpen(prev => !prev);
                }}
                className={cn(
                  "px-2.5 py-0.5 text-[8.5px] rounded-md font-mono font-black uppercase tracking-wider transition-all duration-300 cursor-pointer inline-flex items-center gap-1 justify-center max-w-fit shrink-0",
                  isWcSimulatorOpen 
                    ? "bg-orange-500 text-black border border-orange-450" 
                    : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 animate-pulse"
                )}
              >
                <span>⚡ {isWcSimulatorOpen ? "Fechar Simulador" : "Abrir Simulador de Despesas Extras"}</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle de Cenário de Crise */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setWcCenarioCrise(!wcCenarioCrise);
                if (!wcCenarioCrise) {
                  showToast("Cenário de Crise Ativado! Prazos de recebimento dobrados e margem reduzida em 10%.", "warning");
                } else {
                  showToast("Cenário de Crise Desativado. Parâmetros operacionais limpos.", "success");
                }
              }}
              className={cn(
                "px-3.5 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-2 border transition-all duration-300",
                wcCenarioCrise
                  ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                  : "bg-white/5 hover:bg-white/10 text-rose-400 border-rose-500/20"
              )}
            >
              <span>🚨 Cenário de Crise: {wcCenarioCrise ? "ATIVO" : "INATIVO"}</span>
            </button>

            <button 
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab("financial-engineering");
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider border border-white/10 cursor-pointer flex items-center gap-1"
            >
              Ajustar Simulador <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* SIMULADOR RÁPIDO DE DESPESAS FIXAS EXTRAS & MARKUP PROJETADO */}
        {isWcSimulatorOpen && (
          <div className="bg-[#161210] border border-orange-500/20 rounded-3xl p-5 md:p-6 space-y-4 relative z-10 overflow-hidden animate-fadeIn shadow-2xl">
            <div className="absolute top-0 right-0 p-3 text-[9px] font-mono font-black text-orange-400 opacity-35 uppercase tracking-wider">
              Modo Projeção Ativo
            </div>
            
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
              <span className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-base">
                💸
              </span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  Simulador de Despesas Extras & Markup Requerido
                </h4>
                <p className="text-[10.5px] text-zinc-400">
                  Arraste o slider para estressar a tesouraria com novos custos fixos e recalcular em tempo real o markup de ponto de equilíbrio necessário.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Slider Control Block */}
              <div className="lg:col-span-8 space-y-3 bg-black/45 border border-white/5 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400 font-bold block">Adicionar Despesa Fixa Extra / Mês:</span>
                  <span className="text-orange-400 font-black text-sm block">
                    + {formatCurrency(extraFixedExpense)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-500">R$ 0</span>
                  <input
                    type="range"
                    min="0"
                    max="25000"
                    step="500"
                    value={extraFixedExpense}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setExtraFixedExpense(val);
                      if (val % 2000 === 0) {
                        try { sound.playClick(); } catch (_) {}
                      }
                    }}
                    className="flex-grow accent-orange-500 h-2 bg-zinc-800 rounded-lg cursor-pointer transition-all duration-150"
                  />
                  <span className="text-[10px] font-mono text-zinc-500">R$ 25k</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5 mt-1">
                  {[
                    { label: "Mínimo (R$ 0)", val: 0 },
                    { label: "Contratação (+R$ 3.500)", val: 3500 },
                    { label: "Novo Aluguel (+R$ 7.000)", val: 7000 },
                    { label: "Expansão (+R$ 15.000)", val: 15000 },
                    { label: "Máximo (+R$ 25.000)", val: 25000 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setExtraFixedExpense(preset.val);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer",
                        extraFixedExpense === preset.val
                          ? "bg-orange-500 text-black font-extrabold border border-orange-400"
                          : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projections Sidebar results */}
              <div className="lg:col-span-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4.5 space-y-3.5">
                <div className="space-y-1 border-b border-white/5 pb-2.5">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 block">Novo OPEX Mensal Estimado:</span>
                  <div className="text-base font-black font-mono text-zinc-200">
                    {formatCurrency(opexDRE + extraFixedExpense)}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[8.5px] font-mono uppercase text-zinc-500 block">Markup Requerido Projetado:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold font-mono text-orange-400">
                      {projectedBreakEvenMarkup.toFixed(2)}x
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      (era {breakEvenMarkup.toFixed(2)}x)
                    </span>
                  </div>
                </div>

                <div className={cn(
                  "p-2.5 rounded-xl border font-mono text-[9.5px] leading-relaxed text-left transition-all",
                  actualMarkup < projectedBreakEvenMarkup
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                )}>
                  {actualMarkup < projectedBreakEvenMarkup ? (
                    <span>
                      ⚠️ <strong>Alerta:</strong> Seu markup praticado ({actualMarkup.toFixed(2)}x) não comporta essa nova despesa! Recomendamos reajustar menus preventivamente.
                    </span>
                  ) : (
                    <span>
                      ✓ <strong>Margem Segura:</strong> Seu markup atual de {actualMarkup.toFixed(2)}x suporta plenamente este nível extra de gastos fixos.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INDICADOR DE RISCO DE MARKUP FINANCEIRO / PONTO DE EQUILÍBRIO */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 md:p-6 space-y-4 relative z-10 overflow-hidden" id="markup-risk-indicator-panel">
          {/* Background Ambient Aura based on risk */}
          <div className={cn(
            "absolute -right-20 -bottom-20 w-48 h-48 rounded-full blur-[60px] pointer-events-none opacity-10 transition-colors duration-500",
            markupDiff < -0.15 ? "bg-rose-500" : markupDiff < 0 ? "bg-yellow-500" : "bg-emerald-500"
          )} />

          {/* NOVO: Guia de Termos Técnicos Interativo com Definições e Exemplos para Instrução */}
          <div className="bg-[#121215] border border-orange-500/15 rounded-2xl p-4.5 space-y-3.5 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 p-3 text-[10px] font-mono font-black text-orange-550 select-none opacity-40 uppercase">
              Área de Educação & Aprendizado
            </div>
            
            <div className="space-y-1">
              <span className="bg-orange-500/10 text-orange-400 font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded border border-orange-500/15 inline-flex items-center gap-1.5 shadow-[0_0_12px_rgba(249,115,22,0.05)]">
                <Info size={11} className="text-orange-400 animate-pulse" /> Glossário de Instrução Técnica
              </span>
              <h5 className="text-[12px] font-bold text-zinc-200 font-sans leading-snug">
                Clique em qualquer termo técnico abaixo para abrir a <strong className="text-orange-400 font-semibold">definição simplificada e uma simulação de exemplo prático</strong> de aplicação:
              </h5>
            </div>

            {/* Fila de Botões / Termos Técnicos para Click */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                { id: "markup", name: "Markup", icon: "🎯", color: "from-amber-400/10 to-orange-400/20" },
                { id: "cmv", name: "CMV (Insumos)", icon: "📦", color: "from-emerald-400/10 to-teal-400/20" },
                { id: "dre", name: "DRE (Balanço)", icon: "📊", color: "from-sky-400/10 to-indigo-400/20" },
                { id: "ccc", name: "Giro de Caixa (CCC)", icon: "⚡", color: "from-purple-400/10 to-pink-400/20" }
              ].map(term => (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveGlossaryTerm(activeGlossaryTerm === term.id ? null : term.id);
                  }}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-[10.5px] font-mono font-black uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer",
                    activeGlossaryTerm === term.id 
                      ? "bg-orange-500 text-black border-orange-450 scale-[1.03] shadow-[0_4px_15px_rgba(249,115,22,0.25)]" 
                      : "bg-[#16161a] hover:bg-neutral-900 text-zinc-300 border-white/5 hover:border-white/15"
                  )}
                >
                  <span className="text-xs">{term.icon}</span>
                  <span>{term.name}</span>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded ml-1 font-sans",
                    activeGlossaryTerm === term.id ? "bg-black/20 text-black" : "bg-white/5 text-zinc-500"
                  )}>
                    {activeGlossaryTerm === term.id ? "FECHAR" : "VER EXEMPLO"}
                  </span>
                </button>
              ))}
            </div>

            {/* Conteúdo Explicativo Ativo */}
            {activeGlossaryTerm && (
              <div className="bg-[#18181f] border border-orange-500/25 rounded-2xl p-4.5 space-y-3.5 animate-fadeIn relative">
                <div className="absolute top-2 right-2">
                  <button 
                    type="button" 
                    onClick={() => { sound.playClick(); setActiveGlossaryTerm(null); }}
                    className="text-zinc-500 hover:text-white font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-white/5 rounded-lg border border-white/10"
                  >
                    Fechar &times;
                  </button>
                </div>

                {activeGlossaryTerm === "markup" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <span className="text-lg">🎯</span>
                      <h6 className="text-[11.5px] font-black uppercase font-mono tracking-widest text-orange-400">MARKUP OPERACIONAL</h6>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      O <strong className="text-white">Markup</strong> é o multiplicador financeiro aplicado sobre o custo direto operacional (custo da mercadoria na chapa) para fixar o preço de venda definitivo dos hambúrgueres de forma sustentável. Ele precisa ser forte o suficiente para cobrir os salários, aluguel, luz, taxas de entrega e garantir seu lucro.
                    </p>
                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-2.5">
                      <span className="text-[8.5px] font-black font-mono uppercase text-orange-450 block tracking-wider font-semibold">Exemplo Prático Simples de Instrução:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-zinc-350">
                        <div className="space-y-1 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                          <span className="text-[#a1a1aa] block text-[9px] uppercase font-bold">1. Custos de Produção</span>
                          <span className="text-white font-bold block">Pão Brioche Selado: R$ 2,00</span>
                          <span className="text-white font-bold block">Blend de Carne Angus (120g): R$ 6,00</span>
                          <span className="text-white font-bold block">Queijo Cheddar + Embalagem: R$ 2,00</span>
                          <span className="text-emerald-400 font-black block border-t border-white/15 pt-1 mt-1">Custo Total de Produção: R$ 10,00</span>
                        </div>
                        <div className="space-y-1 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                          <span className="text-[#a1a1aa] block text-[9px] uppercase font-bold">2. Cálculo do Markup</span>
                          <span className="text-white block">Preço Cobrado no Menu: <strong className="text-orange-400">R$ 25,00</strong></span>
                          <span className="text-zinc-500 block text-[10px]">Preço de Venda dividido pelo Custo de Produção:</span>
                          <span className="text-[#e1e1e6] block mt-1 bg-black/45 px-2 py-1 rounded border border-white/5 font-black">
                            Cálculo: R$ 25,00 / R$ 10,00 = <span className="text-orange-400">2.50x de Markup</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeGlossaryTerm === "cmv" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <span className="text-lg">📦</span>
                      <h6 className="text-[11.5px] font-black uppercase font-mono tracking-widest text-[#10b981]">CMV (Custo de Mercadoria Vendida)</h6>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      O <strong className="text-white">CMV</strong> representa a fatia percentual do faturamento bruto que é consumida diretamente para comprar os ingredientes que foram vendidos. Quanto menor o seu CMV, mais saudável e lucrativa é a sua operação, liberando capital de giro rápido.
                    </p>
                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-2.5">
                      <span className="text-[8.5px] font-black font-mono uppercase text-emerald-450 block tracking-wider font-semibold">Exemplo Prático Simples de Instrução:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-zinc-350">
                        <div className="space-y-1 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                          <span className="text-[#a1a1aa] block text-[9px] uppercase font-bold">1. Fórmula do CMV Unitário</span>
                          <span className="text-zinc-400">(Custo Insumos / Preço de Venda) &times; 100</span>
                          <span className="text-[#e2e8f0] block">Custo de Cozinha: R$ 10,00</span>
                          <span className="text-[#e2e8f0] block">Preço de Venda: R$ 25,00</span>
                          <span className="text-emerald-400 font-black block border-t border-white/10 pt-1 mt-1">CMV: 40.0% por burger</span>
                        </div>
                        <div className="space-y-1 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                          <span className="text-[#a1a1aa] block text-[9px] uppercase font-bold">2. Impacto Mensal Real</span>
                          <span className="text-white block">Se o faturamento mensal é <strong className="text-emerald-400">R$ 120.000</strong>:</span>
                          <span className="text-zinc-400 block text-[9.5px]">Seu gasto em reposição de carnes, embalagens, fritas e bebidas no mês será de:</span>
                          <span className="text-[#f1f5f9] font-black block mt-1 bg-black/45 px-2 py-1 rounded border border-white/5">
                            Faturamento &times; CMV (40%) = <span className="text-emerald-400">R$ 48.000 em Insumos</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeGlossaryTerm === "dre" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <span className="text-lg">📊</span>
                      <h6 className="text-[11.5px] font-black uppercase font-mono tracking-widest text-[#38bdf8]">DRE (Demonstração do Resultado)</h6>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      O <strong className="text-white">DRE</strong> é um "filme fotográfico" estruturado de toda a engrenagem financeira de sua hamburgueria em um dado mês. Ele deduz do seu faturamento bruto todos os impostos, custos diretos, folha, marketing e despesas fixas de ponto de venda, revelando a sobra limpa real de caixa.
                    </p>
                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-2.5">
                      <span className="text-[8.5px] font-black font-mono uppercase text-sky-450 block tracking-wider font-semibold">Exemplo Prático Simples de Instrução:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-zinc-350">
                        <div className="space-y-1 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                          <span className="text-[#a1a1aa] block text-[9px] uppercase font-bold">1. Entradas e CMV</span>
                          <span className="text-emerald-300 block">Faturamento Bruto: R$ 120.000</span>
                          <span className="text-rose-400 block">(-) CMV de Carnes e Alimentos: R$ 48.000</span>
                          <span className="text-rose-450 block">(-) Impostos DAS Simples: R$ 7.200</span>
                          <span className="text-sky-400 font-bold block border-t border-white/10 pt-1">Sobrou Margem de Contribuição: R$ 64.800</span>
                        </div>
                        <div className="space-y-1 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                          <span className="text-[#a1a1aa] block text-[9px] uppercase font-bold">2. OPEX e Lucro Final</span>
                          <span className="text-rose-450 block">(-) Salários da Equipe: R$ 38.500</span>
                          <span className="text-rose-450 block">(-) Aluguel de Salão Físico: R$ 6.800</span>
                          <span className="text-rose-450 block">(-) Marketing de Delivery: R$ 10.800</span>
                          <span className="text-emerald-400 font-black block mt-1.5 bg-black/45 px-2 py-1.5 rounded border border-white/5 text-center">
                            Sobra Líquida Real do DRE: <span className="text-sky-400 font-black text-xs">R$ 8.700</span> (Lucrativa!)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeGlossaryTerm === "ccc" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <span className="text-lg">⚡</span>
                      <h6 className="text-[11.5px] font-black uppercase font-mono tracking-widest text-[#c084fc]">CICLO DE CONVERSÃO DE CAIXA (Giro)</h6>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      O <strong className="text-white">Ciclo de Conversão de Caixa (CCC)</strong> traduz em dias o intervalo entre pagar seus distribuidores de matérias-primas e receber o dinheiro de volta após a venda ao cliente através das plataformas de delivery ou cartões de crédito. Quanto menor esse ciclo, maior é a liquidez interna de giro.
                    </p>
                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-2.5">
                      <span className="text-[8.5px] font-black font-mono uppercase text-purple-450 block tracking-wider font-semibold">Exemplo Prático Simples de Instrução:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-zinc-350">
                        <div className="space-y-1 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                          <span className="text-[#a1a1aa] block text-[9px] uppercase font-bold">1. Fórmula do Ciclo de Caixa</span>
                          <span className="text-zinc-400 block font-bold">Média Estoques (DIO) + Prazo Vendas (DSO) - Prazo Fornecedor (DPO)</span>
                          <span className="text-[#e2e8f0] block">➔ Estoque parado (Carnes/Embalagem): 45 dias</span>
                          <span className="text-[#e2e8f0] block">➔ Prazo para iFood liberar dinheiro: 35 dias</span>
                          <span className="text-[#e2e8f0] block">➔ Prazo pago ao fornecedor: 28 dias</span>
                        </div>
                        <div className="space-y-1 bg-white/[0.01] p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                          <div>
                            <span className="text-[#a1a1aa] block text-[9px] uppercase font-bold">2. Ciclo de Giro Real</span>
                            <span className="text-zinc-500 block text-[9.5px]">Processando os prazos atuais do negócio:</span>
                          </div>
                          <span className="text-[#f1f5f9] font-black block mt-1 bg-black/45 px-2 py-1.5 rounded border border-white/5 text-center">
                            45 + 35 - 28 = <span className="text-purple-400 font-extrabold text-xs">52 Dias de Caixa Descoberto!</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/5 text-gray-300 font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border border-white/10 flex items-center gap-1">
                  <Percent size={11} className="text-orange-400" /> Balanço de Markup & CMV
                </span>
                <span className={cn(
                  "font-mono font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1",
                  riskColorClass
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", riskBadgeColor)} />
                  {riskLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black uppercase text-gray-150 tracking-tight font-mono flex items-center gap-1.5 animate-pulse">
                  Risco de Markup Operacional
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    // Alterna com o termo 'markup' para instruir o usuário direto de cima do nome do widget
                    setActiveGlossaryTerm(activeGlossaryTerm === "markup" ? null : "markup");
                  }}
                  className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[8.5px] font-mono font-black border border-orange-500/25 px-2 py-0.5 rounded uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1"
                  title="Clique para ver definição do Markup com exemplo"
                >
                  <span>💡 Definição e Exemplo</span>
                </button>
              </div>
            </div>

            <div className="text-right flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
              <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Excedente de Cobertura:</span>
              <span className={cn(
                "text-sm font-black font-mono",
                markupDiff >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {markupDiff >= 0 ? `+${markupDiff.toFixed(2)}x` : `${markupDiff.toFixed(2)}x`}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Visual Double-Pin Slider Gauge Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                <span className="text-emerald-450 font-bold">✓ Força de Margem (3.00x)</span>
                <span className="text-rose-400 font-semibold font-black">✗ Risco Operacional Máximo (1.00x)</span>
              </div>

              {/* Flex wrapper to place the info help icon right beside the gradient track */}
              <div className="flex items-center gap-4 my-5">
                {/* The slider track with dynamic verde-amarelo-vermelho gradient */}
                <div className="relative h-3.5 flex-grow bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full shadow-inner border border-white/10">
                  
                  {/* 1. Pin representing Break-Even Requirement */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -ml-2.5 flex flex-col items-center z-20 group"
                    style={{ left: `${breakEvenMarkupRiskPct}%` }}
                  >
                    <div className="w-5 h-5 bg-black border-2 border-red-500 rounded-full flex items-center justify-center shadow-md cursor-help hover:scale-110 active:scale-95 transition-transform">
                      <span className="text-[7.5px] font-black text-rose-450 font-mono">⚠️</span>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-6 bg-rose-950 border border-rose-500/50 text-white text-[8px] font-mono font-black px-2.5 py-1 rounded-lg shadow-2xl whitespace-nowrap opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wide flex flex-col items-center">
                      <span className="text-rose-450">Ponto de Equilíbrio DRE</span>
                      <span className="text-[10px] font-black">{breakEvenMarkup.toFixed(2)}x</span>
                    </div>
                  </div>

                  {/* 3. PIN REPRESENTATIVO DA PROJEÇÃO SIMULADA (aparece dinamicamente quando há despesa extra simulada) */}
                  {extraFixedExpense > 0 && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 -ml-2.5 flex flex-col items-center z-40 group animate-bounce"
                      style={{ left: `${getRiskTrackPercentage(projectedBreakEvenMarkup)}%` }}
                    >
                      <div className="w-5 h-5 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center shadow-xl cursor-help hover:scale-120 active:scale-95 transition-all">
                        <span className="text-[8px] font-mono font-bold text-black">⚡</span>
                      </div>
                      {/* Tooltip on hover/active */}
                      <div className="absolute bottom-6 bg-orange-950 border border-orange-500 text-white text-[8px] font-mono font-black px-2.5 py-1 rounded-lg shadow-2xl whitespace-nowrap opacity-100 transition-opacity pointer-events-none uppercase tracking-wide flex flex-col items-center">
                        <span className="text-orange-400">Requerido (Projetado)</span>
                        <span className="text-[10px] font-black">{projectedBreakEvenMarkup.toFixed(2)}x</span>
                      </div>
                    </div>
                  )}

                  {/* 2. Pin representing current Average Product Markup */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -ml-3 flex flex-col items-center z-30 group"
                    style={{ left: `${actualMarkupRiskPct}%` }}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shadow-lg cursor-help hover:scale-115 active:scale-95 transition-transform border-2 bg-black",
                      markupDiff >= 0 ? "border-emerald-400 text-emerald-400" : "border-rose-500 text-rose-500"
                    )}>
                      <span className="text-[9px] font-mono font-black">🎯</span>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-7 bg-zinc-900 border border-white/10 text-white text-[8.5px] font-mono font-black px-2.5 py-1 rounded-lg shadow-2xl whitespace-nowrap opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wide flex flex-col items-center">
                      <span className="text-zinc-450">Seu Markup Médio Real</span>
                      <span className="text-[11px] font-black text-white">{actualMarkup.toFixed(2)}x</span>
                    </div>
                  </div>

                </div>

                {/* Info Help Icon alongside the gradient indicator slider */}
                <div className="relative group shrink-0">
                  <button 
                    type="button" 
                    className="text-zinc-400 hover:text-white transition-colors cursor-help p-1.5 bg-white/5 rounded-xl border border-white/10"
                    aria-label="Informações sobre Markup"
                  >
                    <Info size={14} className="text-orange-400" />
                  </button>
                  {/* Tooltip on hover explaining actual/current markup vs ideal markup calculated by DRE */}
                  <div className="absolute right-0 bottom-full mb-3 w-80 p-5 bg-[#17171a] border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 text-left space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <Info size={13} className="text-orange-400 shrink-0" />
                      <span className="text-[11px] font-black uppercase text-zinc-100 tracking-wider font-mono">DRE Smart Markup Tracker</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                      O <strong>Markup Ideal</strong> calcula o fator multiplicador mínimo que cada produto precisa ter para cobrir todos os <strong>Custos Fixos e OPEX</strong> mapeados no seu DRE. O seu <strong>Markup Real Atual</strong> é a média praticada nos seus produtos.
                    </p>
                    <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl font-mono">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-zinc-500 uppercase block">Markup Real</span>
                        <span className="text-xs font-black text-emerald-400">{actualMarkup.toFixed(2)}x</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-red-500 uppercase block">Markup Ideal</span>
                        <span className="text-xs font-black text-rose-450">{breakEvenMarkup.toFixed(2)}x</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[8.5px] font-bold text-zinc-400 uppercase font-mono">Status da Cobertura:</span>
                      <span className={cn(
                        "text-[10px] font-black font-mono px-2 py-0.5 rounded-md uppercase tracking-tight",
                        markupDiff >= 0 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : "bg-rose-500/10 text-rose-400 animate-pulse"
                      )}>
                        {markupDiff >= 0 ? "Margem Segura ✓" : "Risco de Caixa ⚠️"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pin markers footer legend */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[10px] font-mono pt-2 border-b border-white/5 pb-4 text-zinc-400 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-black border border-red-500 rounded-full flex items-center justify-center text-[5.5px] text-red-500">⚠️</span>
                  <span>Markup Requerido DRE: <strong>{breakEvenMarkup.toFixed(2)}x</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold text-black border-2 bg-black", markupDiff >= 0 ? "border-emerald-400 text-emerald-400" : "border-rose-500 text-rose-500")}>🎯</span>
                  <span>Markup Real Atual: <strong className="text-white">{actualMarkup.toFixed(2)}x</strong></span>
                </div>
              </div>

              {/* BLOCO DE AJUSTE DE PREÇO RÁPIDO DO MARKUP PREVENTIVO */}
              <div className="bg-[#1c1410] border border-orange-500/15 hover:border-orange-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden transition-all duration-300">
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-orange-500 text-black font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded flex items-center gap-1.5">
                        <Sparkles size={11} className="text-black animate-pulse" /> Ajuste de Preço Rápido
                      </span>
                      <span className="bg-orange-500/15 text-orange-400 text-[8.5px] font-black border border-orange-500/20 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                        Cesta de Alto Giro (+5% Prev)
                      </span>
                    </div>
                    <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans">
                      Proteja seu faturamento promovendo espontaneamente um reajuste de markup de <strong className="text-orange-400 font-bold">5%</strong> na cesta de alto giro (&ge; 400 vendas). Isso defende sua tesouraria e eleva a cobertura real do caixa antecipadamente no ponto de venda.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isApplyingQuickAdjustment || (products || []).filter(p => (p.salesCount || 0) >= 400).length === 0}
                    onClick={async () => {
                      if (isApplyingQuickAdjustment) return;
                      setIsApplyingQuickAdjustment(true);
                      sound.playClick();
                      try {
                        const highVolume = (products || []).filter(p => (p.salesCount || 0) >= 400);
                        if (highVolume.length === 0) {
                          showToast("Nenhum produto de alto giro encontrado para ajuste.", "info");
                          setIsApplyingQuickAdjustment(false);
                          return;
                        }
                        
                        showToast(`Calculando e alterando valores de ${highVolume.length} itens principais...`, "info");
                        
                        for (const p of highVolume) {
                          const newPrice = Math.round((p.sellingPrice * 1.05) * 100) / 100;
                          const taxVal = newPrice * ((p.taxRate || 0) / 100);
                          const otherVal = newPrice * ((p.otherCostsPct || 0) / 100);
                          const profitValue = newPrice - p.costPrice - taxVal - otherVal;
                          const profitMarginPct = newPrice > 0 ? (profitValue / newPrice) * 100 : 0;
                          const cmvPct = newPrice > 0 ? (p.costPrice / newPrice) * 100 : 100;
                          
                          await updateProduct(p.id, {
                            sellingPrice: newPrice,
                            profitMarginPct,
                            profitValue,
                            cmvPct,
                          });
                        }
                        
                        showToast(`Sucesso! Markup de segurança aplicado nos produtos de maior rotação!`, "success");
                      } catch (err) {
                        console.error(err);
                        showToast("Falha operacional ao processar novo markup preventivo.", "error");
                      } finally {
                        setIsApplyingQuickAdjustment(false);
                      }
                    }}
                    className={cn(
                      "bg-orange-500 hover:bg-orange-400 text-black font-black text-[9.5px] uppercase tracking-widest px-4 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-orange-950/20 shrink-0 w-full xl:w-auto text-center flex items-center justify-center gap-2 font-mono",
                      isApplyingQuickAdjustment && "opacity-50 pointer-events-none"
                    )}
                  >
                    {isApplyingQuickAdjustment ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Ajustando...
                      </>
                    ) : (
                      <>
                        <Calculator size={12} />
                        Aplicar +5% Rápido
                      </>
                    )}
                  </button>
                </div>

                {/* Display affected high-volume products list compactly */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {(products || []).filter(p => (p.salesCount || 0) >= 400).map(p => {
                    const currentPrice = p.sellingPrice;
                    const proposedPrice = currentPrice * 1.05;
                    const currentMarkupVal = p.costPrice > 0 ? (currentPrice / p.costPrice).toFixed(2) : "1.00";
                    const proposedMarkupVal = p.costPrice > 0 ? (proposedPrice / p.costPrice).toFixed(2) : "1.05";
                    
                    return (
                      <div key={p.id} className="bg-white/[0.02]/50 hover:bg-white/[0.04] border border-white/5 rounded-lg p-2 flex flex-col justify-between transition-colors text-left space-y-1.5">
                        <div className="space-y-0.5">
                          <span className="text-[7.5px] font-black uppercase text-zinc-500 font-mono tracking-tight block">
                            Giro: {p.salesCount} vendas
                          </span>
                          <span className="text-[10px] font-bold text-white truncate block" title={p.name}>
                            {p.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-end border-t border-white/5 pt-1.5">
                          <div>
                            <span className="text-[7.5px] font-mono text-zinc-500 block uppercase">Atual</span>
                            <span className="text-[9.5px] font-bold font-mono text-zinc-350">R$ {currentPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[7.5px] font-mono text-orange-400 block uppercase">+5% Ajustado</span>
                            <span className="text-[10px] font-black font-mono text-orange-400">R$ {proposedPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[7.5px] font-mono bg-black/35 px-1.5 py-0.5 rounded border border-white/5">
                          <span className="text-zinc-500">MU: {currentMarkupVal}x</span>
                          <span className="text-orange-400 font-black">&rarr; {proposedMarkupVal}x</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MAPA DE VARIAÇÃO DE MARKUP (Últimos 30 Dias) */}
              <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 relative overflow-hidden">
                <div className="flex-grow space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      <h5 className="text-[10.5px] font-black uppercase text-orange-400 tracking-wider font-mono">
                        Histórico de Variação de Markup (Últimos 30 Dias)
                      </h5>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Giro de Caixa vs Risco de Cobertura
                    </span>
                  </div>

                  <div className="h-[100px] w-full pt-1.5">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={last30DaysMarkupData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <XAxis 
                          dataKey="date" 
                          stroke="#52525b" 
                          fontSize={8} 
                          tickLine={false} 
                          axisLine={false}
                          dy={5}
                          interval={4}
                        />
                        <YAxis 
                          stroke="#52525b" 
                          fontSize={8} 
                          tickLine={false} 
                          axisLine={false}
                          domain={['dataMin - 0.1', 'dataMax + 0.1']}
                          dx={-5}
                          tickFormatter={(v) => `${v.toFixed(1)}x`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#121214] border border-orange-500/30 p-2.5 rounded-xl shadow-2xl font-mono text-[9px] text-left space-y-1 z-50">
                                  <p className="text-zinc-500 font-bold border-b border-white/5 pb-1">Dia {data.date}</p>
                                  <p className="text-white font-bold">
                                    Markup Real: <span className="text-orange-400 font-black">{data.markup.toFixed(2)}x</span>
                                  </p>
                                  <p className="text-zinc-400">
                                    Requerido DRE: <span className="text-rose-400 font-bold">{data.breakeven.toFixed(2)}x</span>
                                  </p>
                                  <div className={cn(
                                    "font-black text-[7.5px] uppercase tracking-wider mt-1.5 rounded-md px-2 py-0.5 inline-block text-center",
                                    data.markup >= data.breakeven 
                                      ? "bg-emerald-500/10 text-emerald-455" 
                                      : "bg-rose-500/15 text-rose-455 animate-pulse border border-rose-500/30"
                                  )}>
                                    {data.markup >= data.breakeven ? "CAIXA SEGURO ✓" : "RISCO OPERACIONAL ⚠️"}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="breakeven" 
                          stroke="#ef4444" 
                          strokeWidth={1.2}
                          strokeDasharray="4 4"
                          dot={false}
                          activeDot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="markup" 
                          stroke={markupDiff >= 0 ? "#10b981" : "#f59e0b"} 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0, fill: markupDiff >= 0 ? "#10b981" : "#f59e0b" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Resumo da Tendência do Período */}
                <div className="md:w-[160px] bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-row md:flex-col justify-between shrink-0 text-left gap-3 md:gap-1.5">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase text-zinc-500 font-mono block">Média Móvel 30D</span>
                    <div className="text-sm font-black font-mono text-zinc-100 flex items-baseline gap-1">
                      {(last30DaysMarkupData.reduce((acc, d) => acc + d.markup, 0) / 30).toFixed(2)}x
                    </div>
                  </div>
                  <div className="space-y-0.5 border-l md:border-l-0 md:border-t border-white/5 pl-3 md:pl-0 md:pt-1.5">
                    <span className="text-[8px] font-black uppercase text-zinc-500 font-mono block">Mínimo Histórico</span>
                    <div className="text-xs font-black font-mono text-rose-400">
                      {Math.min(...last30DaysMarkupData.map(d => d.markup)).toFixed(2)}x
                    </div>
                  </div>
                  <div className="space-y-0.5 border-l md:border-l-0 md:border-t border-white/5 pl-3 md:pl-0 md:pt-1.5">
                    <span className="text-[8px] font-black uppercase text-zinc-500 font-mono block">Tendência Geral</span>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-tight block font-mono mt-0.5",
                      markupDiff >= 0 ? "text-emerald-400" : "text-amber-400 animate-pulse"
                    )}>
                      {markupDiff >= 0 ? "✓ Estabilidade de Margem" : "⚠️ Alerta de Risco"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Elemento Visual de Adequação de Risco de Margem com Lançamento Automático */}
            {markupDiff < 0.15 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left shadow-lg relative overflow-hidden"
              >
                <div className="absolute -left-10 -top-10 w-28 h-28 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30 text-rose-400 animate-bounce">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black uppercase text-rose-400 font-mono tracking-wide flex items-center gap-1">
                      Ação Recomendada: Reajuste Preventivo de Defesa (+15%)
                    </h5>
                    <p className="text-[10.5px] text-zinc-300 leading-normal font-sans">
                      Operando com markup médio próximo de {actualMarkup.toFixed(2)}x, sua margem de contribuição média não cobre as contas operacionais (OPEX) ideais. Recomendamos restaurar a saúde do caixa.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowRepricerModal(true);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all hover:scale-[1.03] active:scale-95 shadow-md shadow-rose-950/40 shrink-0 w-full sm:w-auto text-center flex items-center justify-center gap-1.5 border border-rose-500/30 font-mono"
                >
                  <Sparkles size={11} className="text-white animate-pulse" /> Recompor Margem (+15%)
                </button>
              </motion.div>
            )}

            {/* Diagnostic advice callout */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex gap-3 text-left items-start">
              <AlertTriangle className={cn("shrink-0 mt-0.5", markupDiff < 0 ? "text-rose-500 animate-bounce" : "text-emerald-450")} size={16} />
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase text-zinc-400 block font-mono">Diagnóstico de Markup de Equilíbrio</span>
                <p className="text-[11px] text-gray-300 leading-normal font-semibold font-sans">
                  {diagnosticAdvice}{" "}
                  <span className="text-[10px] text-zinc-500 font-mono">
                    (Faturamento Base: {formatCurrency(faturamentoDRE)} | OPEX DRE: {formatCurrency(opexDRE)})
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          
          {/* CELL 1: Métricas de CCC (Upper-Left) */}
          <div className="space-y-4 bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div>
                  <h4 className="text-xs font-black uppercase font-mono text-orange-400 tracking-wider flex items-center gap-1.5">
                    <TrendingDown size={14} className="animate-pulse" />
                    Métricas & Ciclo CCC
                  </h4>
                </div>
                {wcCenarioCrise ? (
                  <div className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider border border-rose-500/30 animate-pulse">
                    ⚠️ Crise Receb. DSO x2
                  </div>
                ) : (
                  <div className="bg-black/30 px-2 py-0.5 rounded text-[8px] font-mono text-gray-400 border border-white/5">
                    Ideal: 25-35 dias
                  </div>
                )}
              </div>

              {/* 3 Mini KPI Boxes */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-[#1c1c1c] p-2 rounded-xl border border-white/5">
                  <span className="text-[7.5px] text-gray-500 uppercase font-black block font-mono">
                    Giro (NCG)
                  </span>
                  <div className="text-[11px] font-black font-mono text-orange-400 truncate mt-0.5">
                    <AnimatedNumber value={workingCapitalNeed} formatter={formatCurrency} type="expense" />
                  </div>
                </div>

                <div className="bg-[#1c1c1c] p-2 rounded-xl border border-white/5">
                  <span className="text-[7.5px] text-gray-500 uppercase font-black block font-mono">
                    Despesa Diária
                  </span>
                  <div className="text-[11px] font-black font-mono text-zinc-150 truncate mt-0.5">
                    <AnimatedNumber value={adjustedDailyOutflow} formatter={formatCurrency} type="expense" />
                  </div>
                </div>

                <div className="bg-[#1c1c1c] p-2 rounded-xl border border-white/5">
                  <span className="text-[7.5px] text-gray-500 uppercase font-black block font-mono">
                    Reserva (90D)
                  </span>
                  <div className="text-[11px] font-black font-mono text-emerald-450 truncate mt-0.5">
                    <AnimatedNumber value={adjustedDailyOutflow * 90} formatter={formatCurrency} type="expense" />
                  </div>
                </div>
              </div>

              {/* Render Recharts CCC historic trend chart */}
              <div className="h-[105px] w-full pt-1.5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cccHistoryData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                    <XAxis 
                      dataKey="month" 
                      stroke="#4b5563" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false}
                      dy={5}
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false}
                      domain={[0, 'auto']}
                      dx={-5}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#161616] border border-orange-500/25 p-2 rounded-lg shadow-xl font-mono text-[9px]">
                              <p className="text-gray-400 uppercase font-black">{payload[0].payload.month}</p>
                              <p className="text-orange-400 font-bold mt-0.5">
                                CCC: <span className="text-white text-xs">{payload[0].value} dias</span>
                              </p>
                              <p className="text-gray-500 text-[8px] mt-0.5">
                                {payload[0].payload.efficiency}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ccc" 
                      stroke="#f97316" 
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 1.5, fill: "#141414", stroke: "#f97316" }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#f97316" }}
                      filter="url(#neon-glow-orange)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1.5 font-mono text-[8px] border-t border-white/5 mt-2">
              <div className="text-left">
                <span className="text-gray-500 block">Pico Anterior</span>
                <span className="text-rose-450 font-bold">68 dias</span>
              </div>
              <div className="text-center border-x border-white/5">
                <span className="text-gray-500 block">Média Real</span>
                <span className="text-yellow-400 font-bold">59.2 dias</span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block">Simulação Atual</span>
                <span className="text-emerald-400 font-bold">{calculatedCCC} dias</span>
              </div>
            </div>
          </div>

          {/* CELL 2: Diagnóstico de Score & Saúde de Caixa (Upper-Right) */}
          <div 
            className={cn(
              "space-y-4 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300",
              wcCenarioCrise 
                ? "bg-rose-500/[0.03] border border-rose-500/20 shadow-inner" 
                : "bg-white/[0.01] border border-white/5"
            )}
          >
            <div className="space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "p-1 rounded-md transition-colors",
                      wcCenarioCrise ? "bg-rose-500/20 text-rose-400" : "bg-orange-500/10 text-orange-400"
                    )}>
                      <Target size={13} />
                    </span>
                    <h4 className="text-xs font-black uppercase text-gray-200 font-mono tracking-wider">
                      Diagnóstico & Score
                    </h4>
                  </div>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      setCapitalWidgetTooltip(capitalWidgetTooltip === "score" ? null : "score");
                    }}
                    className={cn(
                      "font-mono text-[10.5px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider hover:scale-105 active:scale-95 transition-all select-none cursor-pointer flex items-center gap-1.5",
                      wcCenarioCrise
                        ? "bg-rose-500 text-white border border-rose-400 shadow-md shadow-rose-500/20 animate-pulse"
                        : displayScore >= 70 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                    )}
                    title="Score de Caixa sob as condições simuladas"
                  >
                    SCORE: {displayScore}/100
                    <HelpCircle size={10} />
                  </button>
                </div>
 
                {/* Score Alerts or Conformity Banner */}
                <div className="pt-2">
                  {wcCenarioCrise ? (
                    <div className="bg-rose-650/10 border border-rose-500/30 p-2.5 rounded-xl flex items-start gap-2 text-left relative overflow-hidden animate-pulse">
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-rose-500" />
                      <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={13} />
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] font-black uppercase text-rose-455 block font-mono leading-none">
                          ⚠️ ALERTA: ESTRESSE DE CAIXA EM CURSO
                        </span>
                        <p className="text-[9px] text-gray-200 leading-normal font-medium">
                          Sua empresa simulou cenário de crise. Prazos de recebimento dobrados e Margem de Contribuição reduzida em 10% ({contributionMargin.toFixed(1)}%).
                        </p>
                      </div>
                    </div>
                  ) : displayScore < 70 ? (
                    <div className="bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl flex items-start gap-2 text-left relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-0.5 bg-rose-500/50" />
                      <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={12} />
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] font-black uppercase text-rose-400 block font-mono leading-none">
                          RISCO DE DESCOMPENSAÇÃO DE LIQUIDEZ
                        </span>
                        <p className="text-[9px] text-gray-300 leading-normal">
                          Score inferior a 70. Ciclo médio retém recursos excessivos. Use os controles de ação estratégica na linha inferior para simular blindagem de tesouraria.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 border border-emerald-555 p-2.5 rounded-xl flex items-start gap-2 text-left relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500/50" />
                      <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={12} />
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] font-black uppercase text-emerald-400 block font-mono leading-none">
                          LIQUIDEZ PREVENTIVA AUDITADA E BLINDADA
                        </span>
                        <p className="text-[9px] text-gray-300 leading-normal">
                          Parabéns! Sua empresa opera em segurança com um Score projetado de {displayScore}/100. A estrutura simulada garante a regeneração integral do fluxo de caixa.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
 
              {/* Projections Matrix of Targets */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setCapitalWidgetTooltip(capitalWidgetTooltip === "strategy" ? null : "strategy");
                  }}
                  className="bg-[#1c1c1c]/40 hover:bg-[#222]/80 border border-white/5 p-2 rounded-xl text-left transition-colors relative group cursor-pointer"
                >
                  <span className="text-[7.5px] text-gray-400 uppercase font-black block font-mono">
                    CCC Otimizado
                  </span>
                  <div className="text-xs font-black text-white font-mono mt-0.5 whitespace-nowrap">
                    {calculatedCCC} dias <span className="text-emerald-400 text-[8px] font-bold">(-{Math.max(0, (wcCenarioCrise ? 115 : 52) - calculatedCCC)}d)</span>
                  </div>
                </button>
 
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setCapitalWidgetTooltip(capitalWidgetTooltip === "strategy" ? null : "strategy");
                  }}
                  className="bg-[#1c1c1c]/40 hover:bg-[#222]/80 border border-orange-500/20 p-2 rounded-xl text-left transition-colors relative group cursor-pointer"
                >
                  <span className="text-[7.5px] text-orange-400 uppercase font-black block font-mono">
                    Capital Destravado
                  </span>
                  <div className="text-xs font-black text-orange-400 font-mono mt-0.5 truncate">
                    {formatCurrency(releasedCapital)}
                  </div>
                </button>
 
                <div
                  className={cn(
                    "p-2 rounded-xl text-left transition-colors relative group border",
                    wcCenarioCrise 
                      ? "bg-rose-500/10 border-rose-500/20"
                      : "bg-[#1c1c1c]/40 border-white/5"
                  )}
                >
                  <span className={cn(
                    "text-[7.5px] uppercase font-black block font-mono",
                    wcCenarioCrise ? "text-rose-400" : "text-gray-400"
                  )}>
                    Margem Contrib.
                  </span>
                  <div className="text-xs font-black font-mono mt-0.5 flex items-center gap-1">
                    <span className={wcCenarioCrise ? "text-rose-450" : "text-emerald-400"}>
                      {contributionMargin.toFixed(1)}%
                    </span>
                    {wcCenarioCrise && (
                      <span className="text-[6.5px] font-black text-rose-500 bg-rose-500/10 px-1 py-0.2 rounded font-mono shrink-0">
                        -10%
                      </span>
                    )}
                  </div>
                </div>
              </div>
 
              {/* Info helper block */}
              <div className="text-[8px] font-mono text-zinc-500 leading-tight border-t border-white/5 pt-2 flex justify-between">
                <span>*Cálculo integrado com dados reais da DRE.</span>
                <button 
                  type="button" 
                  onClick={() => setCapitalWidgetTooltip(capitalWidgetTooltip === "score" ? null : "score")} 
                  className="text-orange-500 hover:underline cursor-pointer"
                >
                  Ver detalhes do cálculo
                </button>
              </div>
            </div>
          </div>

          {/* CELL 3: Botões de Ação Estratégica (Bottom-Left) */}
          <div className="space-y-3.5 bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black uppercase font-mono text-orange-400 tracking-wider flex items-center gap-1.5">
                <Zap size={14} className="animate-pulse text-yellow-400" />
                Ações Estratégicas Ativas
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Ligue e desligue alavancas de engenharia de caixa para simular blindagem.</p>
            </div>

            <div className="space-y-2 pt-1">
              {/* Option 1: Pix Express */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setWcdPixExpress(!wcPixExpress);
                }}
                className={cn(
                  "w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all duration-300 cursor-pointer text-xs font-bold",
                  wcPixExpress 
                    ? "bg-orange-500/10 text-white border-orange-500/30 shadow-md shadow-orange-500/5" 
                    : "bg-white/[0.02] text-gray-300 border-white/5 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                    wcPixExpress ? "bg-orange-500 text-black font-extrabold" : "bg-white/10"
                  )}>
                    {wcPixExpress ? "✓" : ""}
                  </span>
                  <div>
                    <span className="block text-[10.5px]">⚡ Pix Express / Zera DSO</span>
                    <span className="text-[8.5px] font-normal text-gray-400">Recebimento de clientes focado em Pix para 2 dias</span>
                  </div>
                </div>
                <span className="text-[8.5px] font-mono opacity-80 uppercase px-1.5 py-0.5 bg-black/40 rounded border border-white/5">
                  DSO → 2d
                </span>
              </button>

              {/* Option 2: Acordo de Fornecedores */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setWcdAcordoFornecedores(!wcAcordoFornecedores);
                }}
                className={cn(
                  "w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all duration-300 cursor-pointer text-xs font-bold",
                  wcAcordoFornecedores 
                    ? "bg-orange-500/10 text-white border-orange-500/30 shadow-md shadow-orange-500/5" 
                    : "bg-white/[0.02] text-gray-300 border-white/5 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                    wcAcordoFornecedores ? "bg-orange-500 text-black font-extrabold" : "bg-white/10"
                  )}>
                    {wcAcordoFornecedores ? "✓" : ""}
                  </span>
                  <div>
                    <span className="block text-[10.5px]">🤝 Alongar Prorrogados (DPO+15)</span>
                    <span className="text-[8.5px] font-normal text-gray-400">Postergue desembolsos de faturas sem incidência de juros</span>
                  </div>
                </div>
                <span className="text-[8.5px] font-mono opacity-80 uppercase px-1.5 py-0.5 bg-black/40 rounded border border-white/5">
                  DPO +15d
                </span>
              </button>

              {/* Option 3: OPEX Eficiente */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setWcdOtimizarCustos(!wcOtimizarCustos);
                }}
                className={cn(
                  "w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all duration-300 cursor-pointer text-xs font-bold",
                  wcOtimizarCustos 
                    ? "bg-orange-500/10 text-white border-orange-500/30 shadow-md shadow-orange-500/5" 
                    : "bg-white/[0.02] text-gray-300 border-white/5 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                    wcOtimizarCustos ? "bg-orange-500 text-black font-extrabold" : "bg-white/10"
                  )}>
                    {wcOtimizarCustos ? "✓" : ""}
                  </span>
                  <div>
                    <span className="block text-[10.5px]">🎯 Otimizar OPEX de Caixa (-15%)</span>
                    <span className="text-[8.5px] font-normal text-gray-400">Redução operacional de micro-vazamentos financeiros</span>
                  </div>
                </div>
                <span className="text-[8.5px] font-mono opacity-80 uppercase px-1.5 py-0.5 bg-black/40 rounded border border-white/5">
                  OPEX -15%
                </span>
              </button>
            </div>
          </div>

          {/* CELL 4: Telemetria de Prospecção / Ajustes (Bottom-Right) */}
          <div className="space-y-4 bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black uppercase font-mono text-orange-400 tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="animate-pulse" />
                Telemetria & Resultados
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Impacto provável das metas de liquidez no caixa pj.</p>
            </div>

            <div className="bg-[#1c1c1c]/50 p-3 rounded-xl border border-white/5 space-y-2.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Giro Necessário (NCG):</span>
                <span className="font-mono font-black text-white bg-black/50 px-2 py-0.5 rounded border border-white/5">
                  {formatCurrency(workingCapitalNeed)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Fluxo de Caixa Destravado:</span>
                <span className={cn(
                  "font-mono font-black px-2 py-0.5 rounded border",
                  releasedCapital > 0 
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" 
                    : "text-zinc-500 bg-zinc-950 border-white/5"
                )}>
                  +{formatCurrency(releasedCapital)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Novo Ciclo Operacional:</span>
                <span className={cn(
                  "font-mono font-black px-2 py-0.5 rounded border",
                  calculatedCCC < originalCCC 
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" 
                    : "text-white bg-black/50 border-white/5"
                )}>
                  {calculatedCCC} dias
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="button" 
                onClick={() => {
                  sound.playClick();
                  setActiveTab("financial-engineering");
                }}
                className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-black uppercase text-[10px] rounded-xl cursor-pointer transition-all duration-300 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1"
              >
                Sandbox de Engenharia Financeira
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

        </div>

        {/* DAFNE IA CO-PILOTO INTEGRADO: DIAGNÓSTICO INTELIGENTE DE CRISES E LIQUIDEZ */}
        <div className={cn(
          "mt-6 border p-5 rounded-2xl transition-all duration-300 relative overflow-hidden",
          wcCenarioCrise 
            ? "bg-rose-955/15 border-rose-500/20 shadow-lg shadow-rose-950/20" 
            : "bg-white/[0.01] border-white/5"
        )}>
          {/* Background Ambient Glow */}
          <div className={cn(
            "absolute -right-32 -bottom-32 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-500",
            wcCenarioCrise ? "bg-rose-500" : "bg-orange-500"
          )} />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold relative shrink-0",
                wcCenarioCrise ? "bg-rose-500/20 text-rose-400" : "bg-orange-500/20 text-orange-400"
              )}>
                <Sparkles size={18} className="animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                </span>
              </div>
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-2">
                  <span className="bg-zinc-800 text-gray-300 font-mono text-[7.5px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded">
                    Dafne Intelligence v3.5
                  </span>
                  {wcCenarioCrise && (
                    <span className="bg-rose-500/25 text-rose-300 font-mono text-[7px] uppercase font-black px-1.5 py-0.2 rounded border border-rose-500/20">
                      CRISIS MODE
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black uppercase text-gray-150 font-mono tracking-wide">
                  Painel de Mitigação & Diagnóstico IA de Liquidez
                </h4>
                <p className="text-[11px] text-gray-400">
                  Execute uma varredura completa por rede neural com base nos parâmetros simulados de faturamento, CCC, OPEX e contas reais.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isWcAiAnalyzing}
              onClick={() => handleWcAiConsult(calculatedCCC, workingCapitalNeed, adjustedDailyOutflow, displayScore)}
              className={cn(
                "px-5 py-3 rounded-xl font-mono text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 select-none border whitespace-nowrap active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                wcCenarioCrise
                  ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-450 shadow-md shadow-rose-500/20"
                  : "bg-orange-500 hover:bg-orange-600 text-black border-orange-400 font-mono"
              )}
            >
              {isWcAiAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                  ANALISANDO DADOS...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  RODAR DIAGNÓSTICO INTEGRADO IA
                </>
              )}
            </button>
          </div>

          {/* Response Container */}
          <AnimatePresence mode="wait">
            {wcAiFeedback ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 pt-4 border-t border-white/5 space-y-4 text-left relative z-10"
              >
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-mono uppercase font-black text-emerald-400">
                        Diagnóstico Estratégico Preparado
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleWcAiVoiceSpeak}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-mono uppercase font-black flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Volume2 size={11} className="text-orange-400" />
                      OUVIR DIAGNÓSTICO EM ÁUDIO
                    </button>
                  </div>

                  <div className="text-[11.5px] text-gray-200 leading-relaxed font-sans whitespace-pre-line space-y-2">
                    {wcAiFeedback}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
                  <span>*Análise baseada em simulação preditiva do caixa real e contas agregadas.</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    Neural Engine Ativa
                  </span>
                </div>
              </motion.div>
            ) : !isWcAiAnalyzing && (
              <div className="mt-4 pt-3.5 border-t border-white/5 text-center">
                <span className="text-[10px] font-mono text-zinc-500">
                  Ainda sem diagnóstico rodado para as condições simuladas. Clique em <strong className="text-orange-400/80">RODAR DIAGNÓSTICO</strong> acima para iniciar.
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Animated Tooltip Overlay block */}
        <AnimatePresence>
          {capitalWidgetTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-4 bottom-4 bg-[#161616] border border-orange-500/25 rounded-2xl p-4.5 shadow-2xl z-20 space-y-3 mt-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5 text-orange-400 font-mono font-black text-[10px] uppercase tracking-wider">
                  <Sparkles size={13} className="animate-pulse" />
                  {capitalWidgetTooltip === "score" ? "O que significa o Score de Caixa (CCC)?" : "Cálculo da Estratégia de Otimização de Liquidez"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setCapitalWidgetTooltip(null);
                  }}
                  className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>

              <div className="text-[10px] text-gray-300 leading-relaxed font-sans space-y-2">
                {capitalWidgetTooltip === "score" ? (
                  <>
                    <p>
                      O <strong>Score de Saúde de Caixa</strong> quantifica a eficiência operacional das finanças corporativas integradas de modo matemático simplificado. Baseia-se no <strong>Ciclo de Conversão de Caixa (CCC)</strong> totalizando estoque, contas a pagar e contas a receber comercial.
                    </p>
                    <p>
                      • <span className="text-emerald-400 font-black font-mono">ÍNDICE ACIMA DE 70 (CONFORME):</span> Sua tesouraria regenera recursos líquidos com agilidade. A necessidade de fôlego próprio imobilizado no giro é minimizada, evitando endividamentos adicionais de fomento.
                    </p>
                    <p>
                      • <span className="text-rose-450 font-black font-mono">ÍNDICE ABAIXO DE 70 (ALTA NECESSIDADE):</span> O giro demora para completar o ciclo, indicando descasamento crítico de prazos com clientes excessivamente longos ou acúmulo improdutivo em prateleiras, asfixiando sua capacidade bancária imediata.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      A <strong>Estratégia de Otimização de Liquidez</strong> recalcula metas de fôlego financeiro corporativo por regras de melhor uso do capital ativo quando o score cai abaixo de 70:
                    </p>
                    <p>
                      1. <strong>Fator Alvo de Equilíbrio:</strong> Definimos um ciclo saudável consolidado calibrado com a meta estrita de <strong className="text-white font-mono">25 dias</strong> como Ciclo CCC ideal de percurso.
                    </p>
                    <p>
                      2. <strong>Capital de Giro Alvo:</strong> Recalculamos a NCG multiplicando a meta de <strong className="text-white font-mono">25 dias</strong> pela sua <span className="text-orange-400 font-mono">Despesa Diária Integrada</span> real (OPEX e faturas).
                    </p>
                    <p>
                      3. <strong>Geração Liquidez Liberada:</strong> A diferença direta entre a NCG Corrente real e a NCG Alvo ideal projeta o <strong>Capital Líquido Gerado</strong> sob as ações táticas de simulação para DSO, DIO e DPO.
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-1 text-[8px] font-mono text-zinc-500 font-medium">
                <span>*Diagnóstico preventivo automatizado Dafne Inteligência Corporativa integrada.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* CENTRAL OPERACIONAL: ATALHOS DO DIA A DIA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border-2 border-orange-500 rounded-[2.2rem] p-5 lg:p-6 space-y-4 shadow-md text-left relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-150">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-black font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1 leading-none">
                <Zap size={11} className="animate-bounce" /> Operação Direta
              </span>
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-tight">Atalhos de Alta Prioridade (Dia a Dia)</h3>
            </div>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Gerencie as rotinas essenciais da sua empresa com acesso expresso em um único clique para poupar tempo.
            </p>
          </div>
          <span className="text-[10px] font-mono text-gray-400 font-bold bg-[#fafafa] border border-gray-200 px-3 py-1.5 rounded-xl self-start sm:self-center shrink-0">
            ⏳ Monitoramento Ativo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* LANÇAMENTOS */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab("transactions");
            }}
            className="group flex items-start gap-4 p-4 rounded-2xl bg-[#fafafa] hover:bg-orange-50/50 border border-gray-200/80 hover:border-orange-200/80 text-left transition-all duration-300 hover:-translate-y-0.5 cursor-pointer w-full text-left"
          >
            <div className="p-2.5 rounded-xl bg-[#141414] text-orange-500 shrink-0 group-hover:scale-115 transition-transform">
              <ArrowUpCircle size={18} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-950 block group-hover:text-orange-600 transition-colors leading-none pb-0.5">
                Lançamentos
              </span>
              <span className="text-[10px] text-gray-500 font-semibold leading-snug block">
                Registre receitas, despesas diárias e guarde comprovantes fiscais.
              </span>
            </div>
          </button>

          {/* PERFORMANCE DE CAIXA */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab("cashflow");
            }}
            className="group flex items-start gap-4 p-4 rounded-2xl bg-[#fafafa] hover:bg-orange-50/50 border border-gray-200/80 hover:border-orange-200/80 text-left transition-all duration-300 hover:-translate-y-0.5 cursor-pointer w-full text-left"
          >
            <div className="p-2.5 rounded-xl bg-[#141414] text-orange-500 shrink-0 group-hover:scale-115 transition-transform">
              <BarChart3 size={18} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-950 block group-hover:text-orange-600 transition-colors leading-none pb-0.5">
                Fluxo de Caixa
              </span>
              <span className="text-[10px] text-gray-500 font-semibold leading-snug block">
                Visualize saldo disponível, previsões e conciliação bancária diária.
              </span>
            </div>
          </button>

          {/* PASSIVOS PJ */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab("payable");
            }}
            className="group flex items-start gap-4 p-4 rounded-2xl bg-[#fafafa] hover:bg-orange-50/50 border border-gray-200/80 hover:border-orange-200/80 text-left transition-all duration-300 hover:-translate-y-0.5 cursor-pointer w-full text-left"
          >
            <div className="p-2.5 rounded-xl bg-[#141414] text-orange-500 shrink-0 group-hover:scale-115 transition-transform">
              <Bell size={18} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-950 block group-hover:text-orange-600 transition-colors leading-none pb-0.5">
                Passivos PJ
              </span>
              <span className="text-[10px] text-gray-500 font-semibold leading-snug block">
                Controle boletos, contas a pagar e datas limite de vencimento.
              </span>
            </div>
          </button>
        </div>
      </motion.div>

      {/* COCKPIT WIDGET CUSTOMIZATION CONTROL BAR */}
      <div className="bg-[#141414] text-white border-2 border-orange-500 rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <span className="bg-orange-500 text-black font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full inline-block font-mono">
              ⚙️ SISTEMA CORE // CUSTOMIZADOR DE COCKPIT
            </span>
            <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight italic text-white">
              Painel de Customização e Acesso Rápido
            </h2>
            <p className="text-xs text-gray-300 font-medium leading-relaxed font-sans">
              Selecione e organize quais painéis de apoio você gostaria de fixar no <strong className="text-orange-400">topo do Cockpit IA</strong> para acompanhamento imediato e tomadas de decisão céleres.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto self-start md:self-center">
            {[
              { id: "telemetry", label: "📡 Telemetria", desc: "Stack & Conectividade" },
              { id: "ebitda_comparison", label: "📊 EBITDA L3M", desc: "Tendência Recente" },
              { id: "working_capital", label: "🏢 Giro PJ", desc: "Capital & Faturas" },
              { id: "latest_transactions", label: "🧾 Lançamentos", desc: "Atividade Recente" },
              { id: "goals", label: "🎯 Metas Trimestrais", desc: "OKRs Ativos" }
            ].map((widget) => {
              const isSelected = topWidgets.includes(widget.id);
              return (
                <button
                  key={widget.id}
                  onClick={() => {
                    sound.playClick();
                    setTopWidgets(prev => {
                      const next = prev.includes(widget.id)
                        ? prev.filter(id => id !== widget.id)
                        : [...prev, widget.id];
                      localStorage.setItem("dafne_cockpit_top_widgets_v1", JSON.stringify(next));
                      return next;
                    });
                    showToast(`Painel ${widget.label} atualizado com sucesso!`, "success");
                  }}
                  className={cn(
                    "flex-1 md:flex-initial px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 border min-w-[130px]",
                    isSelected
                      ? "bg-orange-500 hover:bg-orange-600 text-black border-transparent shadow-[0_4px_14px_rgba(249,115,22,0.3)] scale-[1.03]"
                      : "bg-[#0c0c0c] text-gray-400 border-white/5 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span>{widget.label}</span>
                  <span className={cn("text-[7.5px] lowercase italic font-semibold leading-none", isSelected ? "text-slate-900" : "text-gray-550")}>
                    {isSelected ? "📍 fixado no topo" : "📍 local padrão"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DYNAMIC TOP PINNED WIDGETS SECTION */}
      {topWidgets.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1 text-left">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_#f97316]"></span>
            <span className="text-[10px] font-mono font-black text-orange-500 uppercase tracking-widest">
              Painéis Operacionais Destaques no Topo ({topWidgets.length})
            </span>
          </div>
          
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {topWidgets.map((widgetId) => {
                let widgetContent = null;
                if (widgetId === "telemetry") widgetContent = renderTelemetry();
                else if (widgetId === "ebitda_comparison") widgetContent = renderEbitdaComparison();
                else if (widgetId === "latest_transactions") widgetContent = renderLatestTransactions();
                else if (widgetId === "goals") widgetContent = renderGoals();
                else if (widgetId === "working_capital") widgetContent = renderWorkingCapital();

                if (!widgetContent) return null;

                return (
                  <motion.div
                    key={widgetId}
                    layoutId={`cockpit-widget-${widgetId}`}
                    initial={{ opacity: 0, y: 50, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.98 }}
                    transition={{
                      type: "spring",
                      damping: 22,
                      stiffness: 120,
                      layout: { type: "spring", damping: 25, stiffness: 120 }
                    }}
                    className="w-full"
                  >
                    {widgetContent}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="border-b border-gray-250/40 pb-2" />
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Lucro Líquido (Saldo)"
          value={formatCurrency(balance + totalInvestments)}
          type="neutral"
          trend={`Operacional: ${formatCurrency(balance)} | Cofrinho: ${formatCurrency(totalInvestments)}`}
          importance="high"
          health={balanceHealth}
          isActive={activeCompareCard === "Saldo Atual"}
          onClick={() => { sound.playClick(); setActiveCompareCard("Saldo Atual"); setDetailModalToken("balance"); }}
          detailsLabel="Auditoria Integral de Caixa"
          onCorrelationClick={() => { sound.playClick(); setShowCorrelationModal(true); }}
          onTaxSimClick={() => { sound.playClick(); setActiveTab("tax-planning"); }}
        >
          <div className="mt-3.5 pt-2.5 border-t border-dashed border-slate-205 flex flex-col gap-1 text-[9.5px] text-gray-500 font-sans font-medium">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">🟢 Receitas Totais:</span>
              <strong className="font-mono text-zinc-800">{formatCurrency(totalIncome)}</strong>
            </div>
            <div className="flex justify-between items-center text-rose-500">
              <span className="flex items-center gap-1">🔴 Despesas Totais:</span>
              <strong className="font-mono">-{formatCurrency(totalExpense)}</strong>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100 pt-1 text-slate-800 font-extrabold text-[10.5px]">
              <span className="flex items-center gap-1">💎 Lucro Líquido:</span>
              <strong className="font-mono text-emerald-600 font-black">{formatCurrency(balance)}</strong>
            </div>
          </div>
        </StatCard>
        <StatCard
          title="Receita Mensal"
          value={formatCurrency(totalIncome)}
          type="positive"
          trend="+5% vs mês anterior"
          importance="medium"
          health={incomeHealth}
          isActive={activeCompareCard === "Receita Mensal"}
          onClick={() => { sound.playClick(); setActiveCompareCard("Receita Mensal"); setDetailModalToken("income"); }}
          detailsLabel="Detalhamento das Receitas"
          onCorrelationClick={() => { sound.playClick(); setShowCorrelationModal(true); }}
          onTaxSimClick={() => { sound.playClick(); setActiveTab("tax-planning"); }}
        >
          <div className="mt-3.5 pt-2.5 border-t border-dashed border-slate-205 flex flex-col gap-1 text-[9.5px] text-gray-500 font-sans font-medium">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">📦 Vendas de Peças/Produtos:</span>
              <strong className="font-mono text-zinc-700">{formatCurrency(totalProductSales)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">💼 Serviços/Receitas Gerais:</span>
              <strong className="font-mono text-zinc-700">{formatCurrency(totalGeneralSales)}</strong>
            </div>
          </div>
        </StatCard>
        <StatCard
          title="Despesa Mensal"
          value={formatCurrency(totalExpense)}
          type="negative"
          trend="-2% vs mês anterior"
          importance="low"
          health={expenseHealth}
          isActive={activeCompareCard === "Despesa Mensal"}
          onClick={() => { sound.playClick(); setActiveCompareCard("Despesa Mensal"); setDetailModalToken("expense"); }}
          detailsLabel="Detalhamento das Despesas"
          onCorrelationClick={() => { sound.playClick(); setShowCorrelationModal(true); }}
          onTaxSimClick={() => { sound.playClick(); setActiveTab("tax-planning"); }}
        >
          <div className="mt-3.5 pt-2 text-[9.5px] text-gray-500 font-sans font-medium space-y-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-1">
              <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400">
                <span>⚙️ OPEX (Despesas Fixas)</span>
                <span className="font-mono text-slate-700 font-extrabold">{formatCurrency(totalOpexExpense)}</span>
              </div>
              <div className="w-full bg-slate-150 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full" 
                  style={{ width: `${totalExpense > 0 ? (totalOpexExpense / totalExpense) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-1">
              <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider font-extrabold text-orange-400">
                <span>📦 CMV (Custo de Vendas)</span>
                <span className="font-mono font-extrabold text-orange-600">{formatCurrency(totalCmvExpense)}</span>
              </div>
              <div className="w-full bg-slate-150 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full" 
                  style={{ width: `${totalExpense > 0 ? (totalCmvExpense / totalExpense) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </StatCard>
        <StatCard
          title="Margem de Contribuição Média"
          value={`${avgProductMargin.toFixed(1)}%`}
          type={avgProductMargin >= 20 ? "positive" : "negative"}
          trend={avgProductMargin >= 20 ? "Taxa de conversão de caixa saudável e robusta." : "ALERTA: Margem média sob forte risco!"}
          importance="high"
          marginPct={avgProductMargin}
          isActive={activeCompareCard === "Margem de Contribuição Média"}
          onClick={() => { sound.playClick(); setActiveCompareCard("Margem de Contribuição Média"); setDetailModalToken("contribution"); }}
          detailsLabel="Detalhamento Integral da Margem"
          onAutoAdjustPrice={async () => {
            sound.playClick();
            const lowMarginProducts = products.filter((p) => p.profitMarginPct < 20);
            if (lowMarginProducts.length === 0) {
              showToast("Todos os seus produtos já operam acima do limite de 20% de margem!", "success");
              return;
            }
            try {
              for (const p of lowMarginProducts) {
                const totalTaxesAndOther = p.taxRate + p.otherCostsPct;
                const secureMargin = 25; // recompose to exactly 25% profit margin
                const totalDeductionPct = totalTaxesAndOther + secureMargin;
                let adjustedPrice = 0;
                if (totalDeductionPct < 100) {
                  adjustedPrice = p.costPrice / (1 - totalDeductionPct / 100);
                } else {
                  adjustedPrice = p.costPrice * 1.5;
                }
                const formattedPrice = Math.round(adjustedPrice * 100) / 100;
                
                const commissionVal = formattedPrice * (p.taxRate / 100);
                const otherVal = formattedPrice * (p.otherCostsPct / 100);
                const profitValue = formattedPrice - p.costPrice - commissionVal - otherVal;
                const profitMarginPct = formattedPrice > 0 ? (profitValue / formattedPrice) * 100 : 0;

                await updateProduct(p.id, {
                  sellingPrice: formattedPrice,
                  profitMarginPct,
                  profitValue,
                  cmvPct: formattedPrice > 0 ? (p.costPrice / formattedPrice) * 100 : 100,
                });
              }
              showToast(`Preços de ${lowMarginProducts.length} produto(s) recompostos automaticamente para margem saudável de 25%!`, "success");
            } catch (err) {
              console.error(err);
              showToast("Falha técnica no processo de reajuste de preços.", "error");
            }
          }}
        />
      </div>

      {/* MONITOR DE PICOS DE GASTOS DIÁRIOS (7 DIAS) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white border-2 border-[#141414] rounded-[2.5rem] p-6 lg:p-8 space-y-6 relative overflow-hidden text-left shadow-xl"
        id="daily-7day-expenses-trend-chart"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-150">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#141414] text-white font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 leading-none">
                <Clock size={11} className="text-orange-500" /> Histórico Recente (7 Dias)
              </span>
              <span className={cn(
                "font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md",
                dailyExpensesStats.isSpikeDetected 
                  ? "bg-rose-100 text-rose-700" 
                  : "bg-emerald-100 text-emerald-700"
              )}>
                {dailyExpensesStats.isSpikeDetected ? "⚠️ Anomalia de Custo" : "✅ Despesas Harmonizadas"}
              </span>
            </div>
            <h3 className="font-black text-2xl lg:text-3xl uppercase tracking-tight text-[#141414] italic">
              Detector de Spikes & Gastos Operacionais
            </h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-2xl">
              Monitore desvios e picos abruptos nas despesas de caixa PJ. Selecione qualquer ponto no gráfico para desvendar instantaneamente os lançamentos que impulsionaram as saídas.
            </p>
          </div>
        </div>

        {/* 7-Day Stats Summary Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[8.5px] font-black uppercase text-gray-400 tracking-wider">Gasto Total (7 dias)</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
              {formatCurrency(dailyExpensesStats.sum)}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[8.5px] font-black uppercase text-gray-400 tracking-wider">Média Diária de Saída</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-950 mt-1">
              {formatCurrency(dailyExpensesStats.avg)}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[8.5px] font-black uppercase text-gray-400 tracking-wider">Maior Saída (Pico)</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-orange-600 mt-1 flex items-center gap-1.5">
              {formatCurrency(dailyExpensesStats.maxVal)}
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-normal">({dailyExpensesStats.peakDay?.shortLabel})</span>
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[8.5px] font-black uppercase text-gray-400 tracking-wider">Variação (Semanas)</span>
            <div className="mt-1 flex flex-col">
              <span className={cn(
                "text-xl sm:text-2xl font-black font-mono flex items-center gap-1 leading-none",
                expensesPercentageVariation > 5
                  ? "text-rose-600"
                  : expensesPercentageVariation < -5
                    ? "text-emerald-700"
                    : "text-slate-900"
              )}>
                {expensesPercentageVariation > 0 ? "+" : ""}{expensesPercentageVariation.toFixed(1)}%
                {expensesPercentageVariation > 5 ? (
                  <TrendingUp size={16} className="text-rose-500 shrink-0" />
                ) : expensesPercentageVariation < -5 ? (
                  <TrendingDown size={14} className="text-emerald-500 shrink-0" />
                ) : null}
              </span>
              <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-tighter mt-1 block">
                {dailyExpensesStats.sum - previousPeriodExpensesTotal >= 0 ? "Acréscimo de" : "Redução de"}{" "}
                <strong className={cn(
                  "font-black font-mono",
                  expensesPercentageVariation > 5 ? "text-rose-600" : expensesPercentageVariation < -5 ? "text-emerald-700" : "text-gray-600"
                )}>
                  {formatCurrency(Math.abs(dailyExpensesStats.sum - previousPeriodExpensesTotal))}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Warning Alert on Spike */}
        <div className={cn(
          "border rounded-2xl p-4.5 flex flex-col sm:flex-row items-start gap-3.5 transition-all duration-300",
          dailyExpensesStats.isSpikeDetected
            ? "bg-rose-50 border-rose-200 text-rose-900"
            : "bg-emerald-50 border-emerald-200 text-emerald-900"
        )}>
          {dailyExpensesStats.isSpikeDetected ? (
            <ShieldAlert size={20} className="text-rose-500 shrink-0 mt-0.5" />
          ) : (
            <Check size={20} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
          )}
          <div className="space-y-1 text-left">
            <h4 className="text-xs font-black uppercase tracking-wider font-mono">
              {dailyExpensesStats.isSpikeDetected ? "Diagnóstico da IA: Alerta Máximo de Spike" : "Diagnóstico da IA: Fluxo de Gastos Estável"}
            </h4>
            <p className="text-[11px] font-semibold leading-relaxed text-gray-600">
              {dailyExpensesStats.isSpikeDetected ? (
                <span>
                  Detectamos uma distorção financeira expressiva no dia <strong className="text-rose-750 font-bold">{dailyExpensesStats.peakDay?.label}</strong>. A despesa registrada de <strong className="text-rose-750 font-bold">{formatCurrency(dailyExpensesStats.maxVal)}</strong> superou a média normal na semana em <strong className="text-rose-750 font-bold">{dailyExpensesStats.spikeFactor}x</strong>. Recomendamos de forma prioritária auditar o lote de faturas e boletos lançados sob esta data para identificar micro-vazamentos ou duplicidades.
                </span>
              ) : (
                <span>
                  O desembolso diário da sua empresa operou sob controle linear estável nos últimos 7 dias. Não identificamos anomalias fiscais ou lançamentos com desvio estatístico. Excelente condução tática de tesouraria de caixa empresarial.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 7-Day Expense Recharts Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Chart Wrapper Container */}
          <div className="lg:col-span-8 bg-slate-50 border border-slate-150 p-4 rounded-[2rem] flex flex-col justify-between">
            <span className="text-[8.5px] uppercase tracking-widest font-black text-gray-400 block mb-2 font-mono">
              Tendência Diária de Desembolsos PJ // Toque para Inspecionar Lançamentos
            </span>
            <div className="h-[220px] w-full relative select-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={last7DaysExpenseData}
                  onClick={(state) => {
                    if (state && state.activeTooltipIndex !== undefined) {
                      sound.playClick();
                      setSelectedExpenseDayIndex(Number(state.activeTooltipIndex));
                    }
                  }}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="expense-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={dailyExpensesStats.isSpikeDetected ? "#ef4444" : "#f97316"} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={dailyExpensesStats.isSpikeDetected ? "#ef4444" : "#f97316"} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="shortLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip
                    cursor={{ stroke: dailyExpensesStats.isSpikeDetected ? "#ef4444" : "#f97316", strokeWidth: 1.5, strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#141414] border border-orange-500/30 p-3 rounded-2xl shadow-xl text-left text-white max-w-[210px] font-sans">
                            <p className="text-[9px] font-black uppercase tracking-widest text-orange-450 font-mono">
                              {data.label}
                              {data.isDemo && <span className="ml-2 text-[7px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1 py-0.5 rounded">Demo</span>}
                            </p>
                            <p className="text-xs font-bold font-mono mt-1 text-white">
                              Total: {formatCurrency(data.Valor)}
                            </p>
                            <span className="text-[8px] text-gray-400 block mt-1">Clique para ver os lançamentos desse dia</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    name="Gastos"
                    dataKey="Valor"
                    stroke={dailyExpensesStats.isSpikeDetected ? "#ef4444" : "#f97316"}
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#expense-gradient)"
                    dot={{ r: 5, fill: "#ffffff", stroke: dailyExpensesStats.isSpikeDetected ? "#ef4444" : "#f97316", strokeWidth: 3 }}
                    activeDot={{ r: 7, fill: dailyExpensesStats.isSpikeDetected ? "#ef4444" : "#f97316", stroke: "#ffffff", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* List of transactions for selected day */}
          <div className="lg:col-span-4 space-y-3 flex flex-col justify-between self-stretch">
            <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-[2rem] h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-gray-150 pb-2 mb-3">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                    Lançamentos de Despesa
                  </span>
                  <span className="text-[9.5px] font-bold font-mono text-slate-800 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-xs">
                    {last7DaysExpenseData[selectedExpenseDayIndex]?.label.split(" ")[0]}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                  {last7DaysExpenseData[selectedExpenseDayIndex]?.transactions && last7DaysExpenseData[selectedExpenseDayIndex].transactions.length > 0 ? (
                    last7DaysExpenseData[selectedExpenseDayIndex].transactions.map((tx: any) => (
                      <div key={tx.id} className="bg-white border border-slate-150 p-2.5 rounded-xl flex items-center justify-between text-left shadow-2xs group hover:border-orange-200 transition-colors">
                        <div className="min-w-0 pr-2">
                          <p className="font-extrabold text-[11px] text-slate-900 uppercase tracking-tighter truncate font-mono">
                            {tx.description}
                          </p>
                          <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded font-sans uppercase">
                            {tx.category}
                          </span>
                        </div>
                        <span className="font-black font-mono text-xs text-rose-500 shrink-0">
                          - {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 flex flex-col items-center justify-center space-y-1.5 bg-white border border-dashed border-gray-200 rounded-xl">
                      <span className="text-xl">🍃</span>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Zero Desembolsos PJ</p>
                      <p className="text-[8.5px] text-gray-500 font-semibold px-4 leading-normal">
                        Nenhum custo operacional debitado ou agendado sob esta data.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[8.5px] text-gray-400 leading-normal border-t border-gray-150 pt-2 mt-4">
                * Toque em qualquer outro nó gráfico para alternar os relatórios detalhados de despesas diárias correspondentes.
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* HISTÓRICO DE MARGENS - GRÁFICO DE LINHAS INTERATIVO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "bg-white border-2 rounded-[2.5rem] p-6 lg:p-8 space-y-6 relative overflow-hidden text-left transition-all duration-300",
          isSliding 
            ? "border-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.5)] ring-4 ring-orange-500/10 scale-[1.005] animate-pulse duration-700" 
            : "border-[#141414] shadow-xl"
        )}
        id="profit-margin-history-chart"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Export Button */}
        <button
          onClick={handleExportChart}
          disabled={isExportingChart}
          data-export-button
          className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 bg-[#141414] hover:bg-[#2a2a2a] text-white disabled:bg-gray-400 font-mono font-black text-[10px] uppercase tracking-wider px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer border border-transparent hover:border-orange-500/30"
          title="Exportar Gráfico atual como imagem PNG"
        >
          {isExportingChart ? (
            <Loader2 size={12} className="animate-spin text-orange-500" />
          ) : (
            <Download size={12} className="text-orange-500" />
          )}
          <span>Exportar Gráfico</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-150">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#141414] text-white font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 leading-none">
                <TrendingUp size={11} className="text-orange-500" /> Histórico de {historyMonthsRange} Meses
              </span>
              <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md">
                Interativo e Reativo
              </span>
            </div>
            <h3 className="font-black text-2xl lg:text-3xl uppercase tracking-tight text-[#141414] italic">
              Tendência de Margem & Lucratividade
            </h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-2xl">
              Monitore a eficiência real de conversão do seu fluxo. Toque em qualquer mês no gráfico para inspecionar um relatório executivo detalhado sobre o balanço daquele período.
            </p>
          </div>

          {/* Interactive controls */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center shrink-0 lg:mr-36">
            {/* Timeframe Range switchers requested by user */}
            <div className="flex items-center gap-1 bg-orange-50/70 p-1 rounded-2xl border border-orange-100">
              <button
                onClick={() => {
                  sound.playClick();
                  setHistoryMonthsRange(12);
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  historyMonthsRange === 12
                    ? "bg-orange-500 text-white shadow-sm font-bold"
                    : "text-orange-700 hover:bg-orange-100/50 hover:text-orange-950 font-semibold"
                )}
                title="Visualizar histórico completo de 12 meses"
              >
                Expandir Visão (12M)
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setHistoryMonthsRange(6);
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  historyMonthsRange === 6
                    ? "bg-orange-500 text-white shadow-sm font-bold"
                    : "text-orange-700 hover:bg-orange-100/50 hover:text-orange-950 font-semibold"
                )}
                title="Resumir histórico para os últimos 6 meses"
              >
                Resumir (6M)
              </button>
            </div>

            {/* Metric Mode switchers */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl border border-gray-200">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveHistoryMetric("margin");
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeHistoryMetric === "margin"
                    ? "bg-[#141414] text-white shadow-md font-bold"
                    : "text-gray-500 hover:text-black font-semibold"
                )}
              >
                Margem Líquida %
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveHistoryMetric("faturamento_lucro");
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeHistoryMetric === "faturamento_lucro"
                    ? "bg-[#141414] text-white shadow-md font-bold"
                    : "text-gray-500 hover:text-black font-semibold"
                )}
              >
                Faturamento vs Lucro
              </button>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <motion.div 
          animate={isSliding ? {
            opacity: [1, 0.72, 1],
            scale: [1, 0.99, 1.01, 1],
          } : { opacity: 1, scale: 1 }}
          transition={{ 
            repeat: isSliding ? Infinity : 0, 
            duration: 0.8, 
            ease: "easeInOut" 
          }}
          className="h-[280px] w-full pt-4 relative select-none"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={marginHistoryData}
              onClick={(state) => {
                if (state && state.activeTooltipIndex !== undefined) {
                  sound.playClick();
                  setSelectedHistoryMonthIndex(Number(state.activeTooltipIndex));
                }
              }}
              margin={{ top: 20, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
                unit={activeHistoryMetric === "margin" ? "%" : ""}
                tickFormatter={(val) => activeHistoryMetric === "margin" ? `${val}%` : `R$ ${val >= 1000 ? (val / 1000) + "k" : val}`}
              />
              <Tooltip
                cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "4 4" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#141414] border border-orange-500/30 p-4 rounded-2xl shadow-xl space-y-2 text-left text-white max-w-[240px] font-sans">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-450 font-mono">
                          {data.fullMonth}
                          {data.isDemo && <span className="ml-2 text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-sm">Demo</span>}
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4 font-semibold text-slate-350">
                            <span>Faturamento:</span>
                            <span className="font-mono text-white">{formatCurrency(data.Faturamento)}</span>
                          </div>
                          <div className="flex justify-between gap-4 font-semibold text-slate-355">
                            <span>Lucro Líquido:</span>
                            <span className={cn("font-mono", data.Lucro >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {formatCurrency(data.Lucro)}
                            </span>
                          </div>
                          <div className="border-t border-white/10 pt-1.5 flex justify-between gap-4 font-black">
                            <span className="text-orange-400 font-bold">Margem Líquida:</span>
                            <span className="font-mono text-orange-400">{data["Margem de Lucro (%)"]}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              {activeHistoryMetric === "margin" ? (
                <Line
                  type="monotone"
                  name="Margem Líquida (%)"
                  dataKey="Margem de Lucro (%)"
                  stroke="#f97316"
                  strokeWidth={4}
                  dot={{ r: 6, fill: "#ffffff", stroke: "#f97316", strokeWidth: 3 }}
                  activeDot={{ r: 8, fill: "#f97316", stroke: "#ffffff", strokeWidth: 3 }}
                  filter="url(#neon-glow-orange)"
                />
              ) : (
                <>
                  <Line
                    type="monotone"
                    name="Receitas (R$)"
                    dataKey="Faturamento"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#ffffff", stroke: "#f97316", strokeWidth: 2 }}
                    activeDot={{ r: 7, strokeWidth: 2, fill: "#f97316" }}
                    filter="url(#neon-glow-orange)"
                  />
                  <Line
                    type="monotone"
                    name="Lucro Líquido (R$)"
                    dataKey="Lucro"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#ffffff", stroke: "#10b981", strokeWidth: 2 }}
                    activeDot={{ r: 7, strokeWidth: 2, fill: "#10b981" }}
                    filter="url(#neon-glow-emerald)"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Selected Month Interactive Details Micro-panel */}
        {(() => {
          const mData = marginHistoryData[selectedHistoryMonthIndex];
          if (!mData) return null;

          const isPositive = mData.Lucro >= 0;
          let tipText = "";
          let badgeColor = "";
          let badgeLabel = "";

          if (mData["Margem de Lucro (%)"] >= 25) {
            tipText = `Excelente patamar de rentabilidade operacional em ${mData.fullMonth}. Sua precificação de venda absorve com extrema eficiência os impostos de alíquota tributária e o seu OPEX fixo. Continue operando focado neste mark-up para blindar seu fôlego financeiro duradouro.`;
            badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
            badgeLabel = "Rentabilidade Saudável 🟢";
          } else if (mData["Margem de Lucro (%)"] >= 10) {
            tipText = `Margem de lucro moderada em ${mData.fullMonth}. O volume de OPEX (despesas fixas) ou CMV (custo de insumos) reteve uma fatia considerável do faturamento. Considere renegociar despesas recorrentes ou ajustar sutilmente os preços de venda para alcançar a zona ideal de cobertura.`;
            badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
            badgeLabel = "Rentabilidade Moderada 🟡";
          } else {
            tipText = `Alerta de compressão de margens de lucro em ${mData.fullMonth}. O ponto de equilíbrio (breakeven) opera muito esticado. Recomenda-se realizar uma auditoria imediata de mark-up para evitar o escoamento descontrolado e garantir a solvabilidade do caixa empresarial.`;
            badgeColor = "bg-rose-50 text-rose-800 border-rose-200";
            badgeLabel = "Margem Sob Pressão 🔴";
          }

          return (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 lg:p-6 text-left grid grid-cols-1 md:grid-cols-12 gap-5 items-center transition-all duration-300">
              <div className="md:col-span-4 space-y-1.5">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest font-mono">
                  Informativo Mensal Detalhado
                </p>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-slate-900 font-sans uppercase leading-none">
                    {mData.fullMonth}
                  </h4>
                  <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border", badgeColor)}>
                    {badgeLabel}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Faturamento</span>
                    <strong className="text-[13px] text-slate-850 font-mono font-black">{formatCurrency(mData.Faturamento)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Margem Líquida</span>
                    <strong className="text-[13px] text-orange-600 font-mono font-black">{mData["Margem de Lucro (%)"]}%</strong>
                  </div>
                </div>
              </div>

              <div className="md:col-span-8 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-5">
                <span className="text-[10px] bg-orange-500 text-black font-black px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
                  Diretriz estratégica da IA
                </span>
                <p className="text-xs text-slate-655 font-semibold leading-relaxed mt-2 italic font-sans text-gray-600">
                  "{tipText}"
                </p>
              </div>
            </div>
          );
        })()}
      </motion.div>

      {/* HISTÓRICO FINANCEIRO GERAL - 5 ANOS DE DADOS */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white border-2 border-[#141414] rounded-[2.5rem] p-6 space-y-6 shadow-xl relative overflow-hidden text-left"
        id="five-years-general-history-chart"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Actions Toolbar */}
        <div 
          data-export-button="true"
          className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 flex flex-nowrap items-center gap-2"
        >
          {/* Limpar Snapshot Button */}
          <button
            onClick={handleResetFiveYearsSnapshot}
            disabled={isResettingFiveYears}
            className="bg-white hover:bg-slate-50 text-[#141414] border border-slate-200 hover:border-slate-300 disabled:bg-gray-100 disabled:text-gray-400 font-mono font-black text-[9px] sm:text-[10px] uppercase tracking-wider px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Limpar filtros e restaurar visualização padrão do histórico de 5 anos"
          >
            <RotateCcw size={12} className={cn("text-orange-500", isResettingFiveYears && "animate-spin")} />
            <span>Limpar Snapshot</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportFiveYearsChart}
            disabled={isExportingFiveYearsChart}
            className="bg-[#141414] hover:bg-[#2a2a2a] text-white disabled:bg-gray-400 font-mono font-black text-[9px] sm:text-[10px] uppercase tracking-wider px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer border border-transparent hover:border-emerald-500/30"
            title="Exportar Gráfico de 5 Anos atual como imagem PNG"
          >
            {isExportingFiveYearsChart ? (
              <Loader2 size={12} className="animate-spin text-emerald-500" />
            ) : (
              <Download size={12} className="text-emerald-500" />
            )}
            <span>Exportar Histórico</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-150">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#141414] text-white font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 leading-none">
                <TrendingUp size={11} className="text-emerald-500" /> Histórico Geral da Empresa
              </span>
              <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md">
                Toda a História PJ
              </span>
            </div>
            <h3 className="font-black text-2xl lg:text-3xl uppercase tracking-tight text-[#141414] italic">
              Evolução Histórica de Faturamento & Lucro
            </h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-2xl">
              Uma visualização completa e detalhada de todos os meses de operação. Abrange toda a jornada histórica de faturamento bruto e lucros acumulados por até 5 anos.
            </p>
          </div>

          {/* Controls - Timeframe switches */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center shrink-0 lg:mr-44">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl border border-gray-200">
              <button
                onClick={() => {
                  sound.playClick();
                  setFiveYearsRange(60);
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  fiveYearsRange === 60
                    ? "bg-[#141414] text-white shadow-sm font-bold"
                    : "text-gray-500 hover:text-black font-semibold"
                )}
                title="Histórico completo de 5 Anos (60 Meses)"
              >
                5 Anos (60M)
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setFiveYearsRange(36);
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  fiveYearsRange === 36
                    ? "bg-[#141414] text-white shadow-sm font-bold"
                    : "text-gray-500 hover:text-black font-semibold"
                )}
                title="Histórico de 3 Anos (36 Meses)"
              >
                3 Anos (36M)
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setFiveYearsRange(12);
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  fiveYearsRange === 12
                    ? "bg-[#141414] text-white shadow-sm font-bold"
                    : "text-gray-500 hover:text-black font-semibold"
                )}
                title="Histórico de 1 Ano (12 Meses)"
              >
                1 Ano (12M)
              </button>
            </div>
            
            {/* Metric Mode Filter */}
            <div className="flex items-center gap-1 bg-emerald-50/70 p-1 rounded-2xl border border-emerald-100">
              <button
                onClick={() => {
                  sound.playClick();
                  setFiveYearsMetricFilter("both");
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  fiveYearsMetricFilter === "both"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-emerald-700 hover:bg-emerald-100/50 hover:text-emerald-950 font-semibold"
                )}
              >
                Ambos
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setFiveYearsMetricFilter("income");
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  fiveYearsMetricFilter === "income"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-emerald-700 hover:bg-emerald-100/50 hover:text-emerald-950 font-semibold"
                )}
              >
                Faturamento
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setFiveYearsMetricFilter("profit");
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  fiveYearsMetricFilter === "profit"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-emerald-700 hover:bg-emerald-100/50 hover:text-emerald-950 font-semibold"
                )}
              >
                Lucro
              </button>
            </div>
          </div>
        </div>

        {/* Selected Data Range Indicators / Stats Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Faturamento Acumulado</span>
            <strong className="text-lg text-slate-850 font-mono font-black">{formatCurrency(fiveYearsStats.totalIncome)}</strong>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Lucro Acumulado</span>
            <strong className={cn("text-lg font-mono font-black block", fiveYearsStats.totalProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {formatCurrency(fiveYearsStats.totalProfit)}
            </strong>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Margem Média Geral</span>
            <strong className="text-lg text-orange-600 font-mono font-black">{fiveYearsStats.avgMargin}%</strong>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Volume Histórico</span>
            <strong className="text-lg text-[#141414] font-mono font-black flex items-center gap-1.5">
              <span>{fiveYearsRange} Meses</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-sans uppercase">
                {fiveYearsStats.hasRealData ? "Com Dados Reais" : "Base Estável"}
              </span>
            </strong>
          </div>
        </div>

        {/* Trend of Margin Neon Indicator Banner */}
        {(() => {
          const isCmvEfficient = fiveYearsStats.cmvTrendDiff <= 0;
          const isCustoSuperaFaturamento = fiveYearsStats.totalProfit < 0 || (fiveYearsStats.totalCmv && fiveYearsStats.totalCmv > fiveYearsStats.totalIncome);

          let neonBorderColor = "border-amber-400";
          let neonTextColor = "text-amber-400";
          let neonBgColor = "bg-amber-950/30";
          let neonShadow = "shadow-[0_0_15px_rgba(251,191,36,0.35)]";
          let neonTitle = "Tendência de Margem: Estável";
          let neonDescription = "Custos e faturamento operando dentro da estabilidade regulamentar de longo prazo.";
          let pingColor = "bg-amber-400";
          let icon = <Layers size={14} className="text-amber-400" />;

          if (isCustoSuperaFaturamento) {
            neonBorderColor = "border-[#ff003c]";
            neonTextColor = "text-[#ff003c]";
            neonBgColor = "bg-red-950/20";
            neonShadow = "shadow-[0_0_12px_rgba(255,0,60,0.6)]";
            neonTitle = "Alerta Crítico: Custo Supera Faturamento";
            neonDescription = "O montante total acumulado do custo superou o faturamento bruto. Margens reprimidas demandam correção de precificação ou markup urgente.";
            pingColor = "bg-[#ff003c]";
            icon = <Flame size={14} className="text-[#ff003c] animate-pulse" />;
          } else if (isCmvEfficient) {
            neonBorderColor = "border-[#39ff14]";
            neonTextColor = "text-[#39ff14]";
            neonBgColor = "bg-emerald-950/25";
            neonShadow = "shadow-[0_0_12px_rgba(57,255,20,0.6)]";
            neonTitle = "Tendência de Margem: Excelente Eficiência de CMV";
            neonDescription = `A eficiência do seu CMV do ciclo obteve melhora real de ${Math.abs(fiveYearsStats.cmvTrendDiff)}%, expandindo a alavancagem de rentabilidade real.`;
            pingColor = "bg-[#39ff14]";
            icon = <TrendingDown size={14} className="text-[#39ff14] animate-pulse" />;
          }

          return (
            <div className={cn(
              "border rounded-2xl p-4.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all duration-300 bg-slate-950 text-white",
              neonBorderColor,
              neonShadow,
              neonBgColor
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl shrink-0 flex items-center justify-center">
                  {icon}
                </div>
                <div className="text-left">
                  <h4 className={cn("text-xs font-black uppercase tracking-wider font-mono flex items-center gap-2", neonTextColor)}>
                    <span className="relative flex h-2 w-2">
                      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", pingColor)}></span>
                      <span className={cn("relative inline-flex rounded-full h-2 w-2", pingColor)}></span>
                    </span>
                    {neonTitle}
                  </h4>
                  <p className="text-[10.5px] text-slate-300 font-semibold leading-relaxed mt-1">
                    {neonDescription}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <span className={cn("font-mono text-[10px] font-black px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800", neonTextColor)}>
                  CMV LTM Trend: {fiveYearsStats.cmvTrendDiff <= 0 ? "" : "+"}{fiveYearsStats.cmvTrendDiff}%
                </span>
              </div>
            </div>
          );
        })()}

        {/* Sparkline de Margem L6M */}
        {(() => {
          const last6Months = fiveYearsHistoryData.slice(-6);
          const isGrowing = last6Months.length >= 2 
            && last6Months[last6Months.length - 1]["Margem de Lucro (%)"] >= last6Months[last6Months.length - 2]["Margem de Lucro (%)"];
          
          return (
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="text-left space-y-1">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase font-mono block">Histórico Rápido de Margens</span>
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5 leading-none">
                  <span className={cn("w-1.5 h-1.5 rounded-full", isGrowing ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse")} />
                  Oscilação nos últimos 6 meses (DRE L6M)
                </h5>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Monitoramento imediato de rentabilidade bruta para rápida resposta tática de CMV.
                </p>
              </div>

              {/* Sparkline Visualization */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="h-[40px] w-full sm:w-[150px] select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={last6Months} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <XAxis dataKey="name" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-[8.5px] font-mono text-white text-left shadow-lg">
                                <span className="font-bold">{data.name}:</span> {data["Margem de Lucro (%)"]}%
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Margem de Lucro (%)" 
                        stroke={isGrowing ? "#10b981" : "#ef4444"} 
                        strokeWidth={2} 
                        dot={{ r: 2, strokeWidth: 0, fill: isGrowing ? "#10b981" : "#ef4444" }} 
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Values table list preview for rapid visibility */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] w-full sm:w-auto justify-start sm:justify-end">
                  {last6Months.map((item, index) => {
                    const isLast = index === last6Months.length - 1;
                    return (
                      <div key={item.name} className="flex flex-col items-center">
                        <span className="text-slate-400 font-semibold uppercase text-[7px] leading-none mb-0.5">{item.name.split("/")[0]}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded font-bold leading-tight border transition-colors",
                          isLast 
                            ? (item["Margem de Lucro (%)"] >= 15 ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse" : "bg-orange-50 text-orange-700 border-orange-200") 
                            : "bg-white text-slate-600 border-slate-150"
                        )}>
                          {item["Margem de Lucro (%)"]}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Chart Viewport container */}
        <div className="h-[280px] w-full pt-4 relative select-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={fiveYearsFilteredData}
              margin={{ top: 20, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 9, fontWeight: "bold" }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 9, fontWeight: "bold" }}
                tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000) + "k" : val}`}
              />
              <Tooltip
                cursor={{ stroke: "#059669", strokeWidth: 1, strokeDasharray: "4 4" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#141414] border border-emerald-500/30 p-4 rounded-2xl shadow-xl space-y-2 text-left text-white max-w-[240px] font-sans">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">
                          {data.fullMonth}
                          {data.isDemo ? (
                            <span className="ml-2 text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-sm">Base Estável</span>
                          ) : (
                            <span className="ml-2 text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-sm">Real</span>
                          )}
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4 font-semibold text-slate-300">
                            <span>Faturamento:</span>
                            <span className="font-mono text-white">{formatCurrency(data.Faturamento)}</span>
                          </div>
                          <div className="flex justify-between gap-4 font-semibold text-slate-300">
                            <span>Despesas:</span>
                            <span className="font-mono text-white">{formatCurrency(data.Despesas)}</span>
                          </div>
                          <div className="flex justify-between gap-4 font-semibold text-slate-300">
                            <span>Lucro Líquido:</span>
                            <span className={cn("font-mono", data.Lucro >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {formatCurrency(data.Lucro)}
                            </span>
                          </div>
                          <div className="border-t border-white/10 pt-1.5 flex justify-between gap-4 font-black">
                            <span className="text-emerald-400 font-bold">Margem Líquida:</span>
                            <span className="font-mono text-emerald-400">{data["Margem de Lucro (%)"]}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              {(fiveYearsMetricFilter === "both" || fiveYearsMetricFilter === "income") && (
                <Line
                  type="monotone"
                  name="Faturamento (R$)"
                  dataKey="Faturamento"
                  stroke="#f97316"
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#f97316' }}
                  dot={fiveYearsRange === 12}
                  filter="url(#neon-glow-orange)"
                />
              )}
              
              {(fiveYearsMetricFilter === "both" || fiveYearsMetricFilter === "profit") && (
                <Line
                  type="monotone"
                  name="Lucro Líquido (R$)"
                  dataKey="Lucro"
                  stroke="#10b981"
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#10b981' }}
                  dot={{ r: 4, stroke: '#10b981', fill: '#fff' }}
                  filter="url(#neon-glow-emerald)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Métrica Avançada de CMV e Alavancagem de Margem */}
        <div className="bg-[#fcfdff] border border-blue-50/75 p-5 rounded-[2rem] space-y-4 shadow-sm" id="five-years-cmv-evolution-metrics">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-100/70 text-emerald-700 rounded-xl shadow-xs">
                <Layers size={14} className="text-emerald-600" />
              </span>
              <div>
                <h4 className="font-extrabold text-[12px] md:text-[13px] text-gray-900 uppercase tracking-tight">
                  Evolução do CMV & Eficiência de Margem Comercial a Longo Prazo
                </h4>
                <p className="text-[10px] text-gray-500 font-semibold">
                  Mapeia a variação proporcional de custos diretos (produtos/insumos) sobre o faturamento bruto
                </p>
              </div>
            </div>

            {/* Badges and comparative indicator with Neon Feedback */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-gray-400">Status de Operação:</span>
                {fiveYearsStats.cmvTrendDiff <= 0 ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1 shadow-xs">
                    <TrendingDown size={10} /> CMV Sob Controle (Margem Expandindo)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1 shadow-xs">
                    <TrendingUp size={10} /> CMV em Expansão (Revisar Fornecedores)
                  </span>
                )}
              </div>

              {/* Neon Feedback Indicator: Tendência de Margem */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-gray-400">Tendência de Margem:</span>
                {fiveYearsStats.totalProfit <= 0 || (fiveYearsStats.totalCmv && fiveYearsStats.totalCmv > fiveYearsStats.totalIncome) || fiveYearsStats.cmvTrendDiff > 0 ? (
                  <div className="relative flex items-center gap-2 px-3 py-1 bg-black text-rose-500 border border-rose-500 rounded-full text-[9px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    <span>Custos Elevados (Prejuízo ou Perda de Margem)</span>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 px-3 py-1 bg-black text-emerald-400 border border-emerald-400 rounded-full text-[9px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    <span>Eficiência CMV Ativa (Expansão de Caixa)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats blocks for CMV comparative dynamics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">CMV Médio Histórico</span>
                <strong className="text-base md:text-lg text-slate-900 font-mono font-black">{fiveYearsStats.avgCmvPct}%</strong>
                <span className="text-[9px] text-gray-500 block font-medium mt-0.5">do total do Faturamento Bruto</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-mono font-bold text-[10px] text-slate-500">
                LTM
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Variação do CMV (Trend)</span>
                <strong className={cn("text-base md:text-lg font-mono font-black flex items-center gap-1", fiveYearsStats.cmvTrendDiff <= 0 ? "text-emerald-600" : "text-amber-600")}>
                  {fiveYearsStats.cmvTrendDiff <= 0 ? "" : "+"}{fiveYearsStats.cmvTrendDiff}%
                </strong>
                <span className="text-[9px] text-gray-500 block font-medium mt-0.5">comparando primeiro vs segundo período</span>
              </div>
              <div className={cn("p-1.5 rounded-lg shrink-0", fiveYearsStats.cmvTrendDiff <= 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                {fiveYearsStats.cmvTrendDiff <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Margem de Contribuição Média</span>
                <strong className="text-base md:text-lg text-emerald-600 font-mono font-black">
                  {Math.round((100 - fiveYearsStats.avgCmvPct) * 10) / 10}%
                </strong>
                <span className="text-[9px] text-gray-500 block font-medium mt-0.5">eficiência operacional de insumo</span>
              </div>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <Check size={14} />
              </div>
            </div>
          </div>

          {/* AI generated interpretation or actionable advice */}
          <div className="bg-[#141414] text-white p-3.5 rounded-xl text-xs flex gap-3 items-start border border-emerald-500/10">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-md shrink-0">
              <Flame size={12} className="animate-pulse" />
            </div>
            <p className="font-semibold text-gray-300 leading-relaxed text-[11px]">
              {fiveYearsStats.cmvTrendDiff <= 0 ? (
                <span>
                  <strong>Análise de Eficiência de Margem:</strong> Excelente! A evolução de longo prazo aponta uma redução acumulada do CMV de <span className="text-emerald-400 font-mono">{Math.abs(fiveYearsStats.cmvTrendDiff)}%</span>. Seus custos de aquisição e venda de mercadorias estão evoluindo de forma otimizada frente ao faturamento bruto, atestando um forte processo de <strong>alavancagem de margem</strong> no longo prazo.
                </span>
              ) : (
                <span>
                  <strong>Alerta de Margem Operacional:</strong> Atenção! O CMV aumentou em <span className="text-amber-400 font-mono">{fiveYearsStats.cmvTrendDiff}%</span> ao longo do período analisado. Recomenda-se implementar rotinas automáticas de precificação refinada, centralização de suprimentos e renegociação periódica com fornecedores diretos para recompor os níveis ótimos de contribuição.
                </span>
              )}
            </p>
          </div>

          {/* Tabela Resumo de CMV e Eficiência Operacional */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h5 className="font-extrabold text-[11px] text-gray-900 uppercase tracking-wider font-mono">
                  DRE Sintético: Histórico de Custos Diretos (CMV) por Ciclo
                </h5>
                <p className="text-[9px] text-gray-450 font-semibold font-sans mt-0.5">
                  Consolidado periódico para auditoria retrospectiva de margem bruta
                </p>
              </div>
              
              {cmvSummaryTrend && (
                <div className={cn(
                  "text-[9.5px] font-black uppercase px-2.5 py-1 rounded-lg border text-left sm:text-right shrink-0",
                  cmvSummaryTrend.isGain 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : "bg-amber-50 text-amber-700 border-amber-100"
                )}>
                  Variação {cmvSummaryTrend.isGain ? "Líquida" : "Geral"}: {cmvSummaryTrend.diffPctPoints > 0 ? "+" : ""}{cmvSummaryTrend.diffPctPoints} p.p. ({cmvSummaryTrend.relativeChange > 0 ? "+" : ""}{cmvSummaryTrend.relativeChange}%)
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-gray-100 text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">
                    <th className="py-3 px-4">Período Selecionado</th>
                    <th className="py-3 px-4 text-right">Faturamento Acumulado</th>
                    <th className="py-3 px-4 text-right">CMV Total (R$)</th>
                    <th className="py-3 px-4 text-right">CMV Proporcional (%)</th>
                    <th className="py-3 px-4 text-right">Margem Ref. (%)</th>
                    <th className="py-3 px-4 text-center">Status de Eficiência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {cmvSummaryPeriods.map((period, index) => {
                    const isFirst = index === 0;
                    const isLast = index === cmvSummaryPeriods.length - 1;
                    
                    let rowBg = "hover:bg-slate-50/30";
                    if (isFirst) rowBg = "bg-neutral-50/40 hover:bg-neutral-50/70";
                    if (isLast) rowBg = "bg-emerald-50/10 hover:bg-emerald-50/20";
                    
                    return (
                      <tr key={index} className={cn("transition-colors font-sans", rowBg)}>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            isFirst ? "bg-slate-400" : isLast ? "bg-emerald-500" : "bg-blue-400"
                          )} />
                          <span className="font-extrabold text-slate-800 text-[11px]">
                            {period.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 text-[11px]">
                          {formatCurrency(period.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-650 text-[11px]">
                          {formatCurrency(period.cmv)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn(
                            "font-mono font-extrabold text-[11px]",
                            isLast ? (cmvSummaryTrend?.isGain ? "text-emerald-600" : "text-amber-600") : "text-slate-800"
                          )}>
                            {period.cmvPct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-medium text-emerald-600 text-[11px]">
                            {period.marginPct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isFirst ? (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm">
                              Baseline
                            </span>
                          ) : isLast ? (
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm",
                              cmvSummaryTrend?.isGain ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            )}>
                              {cmvSummaryTrend?.isGain ? "Alta Eficiência" : "Requer Ajuste"}
                            </span>
                          ) : (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-sm">
                              Intermediário
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Diagnóstico de ganho ou perda de eficiência operacional */}
            {cmvSummaryTrend && (
              <div className="p-4 bg-slate-50/55 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex gap-2.5 items-start">
                  <div className={cn(
                    "p-1.5 rounded-lg shrink-0 mt-0.5",
                    cmvSummaryTrend.isGain ? "bg-emerald-100/70 text-emerald-700" : "bg-amber-100/70 text-amber-700"
                  )}>
                    {cmvSummaryTrend.isGain ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  </div>
                  <div>
                    <h6 className="font-extrabold text-[10px] text-gray-900 uppercase tracking-tight">
                      Diagnóstico: {cmvSummaryTrend.isGain ? "Ganho de Eficiência de Margem" : "Aumento Marginal de Custos"}
                    </h6>
                    <p className="text-[10.5px] text-gray-500 font-semibold leading-relaxed mt-0.5">
                      {cmvSummaryTrend.isGain ? (
                        <span>
                          Comparado ao <strong>{cmvSummaryTrend.first.name}</strong>, o ciclo atual (<strong>{cmvSummaryTrend.last.name}</strong>) registrou uma redução de <strong>{Math.abs(cmvSummaryTrend.diffPctPoints)} pontos percentuais</strong> no CMV relativo. Isso representa um ganho relativo de eficiência de <strong>{Math.abs(cmvSummaryTrend.relativeChange)}%</strong> no custo de mercadorias vendidas, expandindo diretamente a capacidade de geração de fluxo de caixa operacional por real faturado.
                        </span>
                      ) : (
                        <span>
                          Comparado ao <strong>{cmvSummaryTrend.first.name}</strong>, o ciclo atual (<strong>{cmvSummaryTrend.last.name}</strong>) registrou uma elevação de <strong>{cmvSummaryTrend.diffPctPoints} pontos percentuais</strong> no CMV proporcional. Isso equivale a um aumento de <strong>{cmvSummaryTrend.relativeChange}%</strong> na pressão inflacionária de insumos, sinalizando a necessidade urgente de renegociação com distribuidores PJ para evitar a erosão da rentabilidade.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footnote stating context */}
        <div className="text-[10px] text-gray-450 font-semibold italic flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
          <span>Informações calculadas em tempo real com base na reconciliação de contas integradas e lançamentos históricos.</span>
        </div>
      </motion.div>

      {/* HUB EXCLUSIVO DE VALUATION E ENGENHARIA DE MERCADO (M&A) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white border-2 border-[#141414] rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-xl relative overflow-hidden text-left"
        id="ma-valuation-engineering-hub"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-150">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-orange-600 text-white font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 leading-none">
                <Sparkles size={11} /> DIFERENCIAL EXECUTIVE PJ
              </span>
              <span className="bg-gray-100 text-gray-800 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md">
                Planejamento de Exit & Valuation
              </span>
            </div>
            <h3 className="font-black text-2xl lg:text-3xl uppercase tracking-tight text-[#141414] italic">
              Simulador de Valuation & Tomada de Decisão de Preço
            </h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-3xl">
              Descubra quanto vale o seu negócio com base em múltiplos de M&A (Fusões e Aquisições) de mercado e projete os impactos diretos da elasticidade da demanda tática ao reajustar seus preços.
            </p>
          </div>
        </div>

        {/* Outer Tabs / View Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          
          {/* LADO ESQUERDO: CONTROLE E CALIBRAÇÃO FINANCEIRA */}
          <div className="space-y-6 bg-slate-50/50 border border-slate-100 rounded-3xl p-5 lg:p-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Calculator size={16} className="text-orange-500" />
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-800">
                1. Calibração de Parâmetros de Mercado
              </h4>
            </div>

            {/* Setor de Atuação */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Setor de Atuação da Empresa</label>
              <div className="grid grid-cols-2 gap-2">
                {(["services", "retail", "tech", "industry"] as const).map((sector) => {
                  const label = { services: "Serviços", retail: "Varejo", tech: "Tecnologia", industry: "Indústria" }[sector];
                  return (
                    <button
                      key={sector}
                      onClick={() => {
                        sound.playClick();
                        setValuationSector(sector);
                        // Adjust default sector multiplier
                        const defaults = { services: 5.5, retail: 3.8, tech: 8.5, industry: 5.8 };
                        setValuationCustomMultiplier(defaults[sector]);
                      }}
                      className={cn(
                        "py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border transition-all cursor-pointer",
                        valuationSector === sector
                          ? "bg-[#141414] text-white border-transparent shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slide Multiplo Base de Lucro */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <span className="text-gray-400">Múltiplo EBITDA Base (Padrão Setor)</span>
                <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-mono">{valuationCustomMultiplier}x</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="15.0"
                step="0.5"
                value={valuationCustomMultiplier}
                onChange={(e) => setValuationCustomMultiplier(parseFloat(e.target.value))}
                className="w-full accent-orange-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] text-gray-400 font-semibold block leading-tight">
                Reflete o número de anos de geração de lucro acumulados demandados para recuperar o custo de aquisição da operação.
              </span>
            </div>

            {/* Governança & Organização Slide */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <span className="text-gray-400">Eficiência de Governança & Processos</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono">{valuationGovernanceScore}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={valuationGovernanceScore}
                onChange={(e) => setValuationGovernanceScore(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] text-gray-400 font-semibold block leading-tight">
                Processos documentados, compliance financeiro, menor contingência judicial e equipe autônoma elevam o prêmio do seu valuation.
              </span>
            </div>

            {/* Crescimento Esperado */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <span className="text-gray-400">Expectativa de Crescimento Anual %</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">+{valuationGrowthExpected}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={valuationGrowthExpected}
                onChange={(e) => setValuationGrowthExpected(parseInt(e.target.value))}
                className="w-full accent-blue-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] text-gray-400 font-semibold block leading-tight">
                Taxas elevadas de crescimento acelerado no topo da linha (topline) atraem fundos M&A/Venture Capital dispostos a pagar ágio substancial.
              </span>
            </div>

            {/* Cenário Macroeconômico */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Cenário Macroeconômico Corrente</label>
              <div className="grid grid-cols-3 gap-2">
                {(["conservative", "moderate", "aggressive"] as const).map((sc) => {
                  const label = { conservative: "Aperto/Defensivo", moderate: "Estável/Neutro", aggressive: "Otimista/Expansão" }[sc];
                  return (
                    <button
                      key={sc}
                      onClick={() => {
                        sound.playClick();
                        setValuationScenario(sc);
                      }}
                      className={cn(
                        "py-2 px-1 rounded-xl text-[9px] font-bold uppercase text-center border transition-all cursor-pointer",
                        valuationScenario === sc
                          ? "bg-[#141414] text-white border-transparent"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* LADO DIREITO: PERFORMANCE DE VALUATION & COGNILOGIC */}
          <div className="space-y-6 flex flex-col justify-between">
            
            {/* VALUATION PRINCIPAL */}
            <div className="bg-[#141414] border-2 border-orange-500/25 rounded-3xl p-6 text-white text-left relative overflow-hidden space-y-3">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-orange-500 font-mono font-black text-[9px] uppercase tracking-widest block">
                    VALUATION ESTIMADO POR MÚLTIPLOS (LTM)
                  </span>
                  <p className="text-xs text-slate-400 font-semibold leading-tight">
                    Previsão para Ofertas de Investimento Privado (M&A)
                  </p>
                </div>
                <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black text-[9px] uppercase px-2 py-1 rounded font-mono">
                  Mapeado {valuationSector}
                </span>
              </div>

              <div className="pt-2">
                <strong className="text-3xl sm:text-4xl font-mono font-black text-white block tracking-tight leading-none">
                  {formatCurrency(valuationMetrics.finalValuation)}
                </strong>
                <span className="text-[10px] text-orange-400 font-semibold block mt-1">
                  Múltiplo Efetivo Aplicado: <strong className="font-mono bg-orange-500/10 px-1 py-0.5 rounded text-white">{valuationMetrics.finalMultiplier}x EBITDA</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-xs">
                <div>
                  <span className="text-[8px] text-slate-400 block font-bold uppercase">Faturamento LTM</span>
                  <span className="font-mono font-black text-slate-200">{formatCurrency(valuationMetrics.ltmRevenue)}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 block font-bold uppercase">Lucro Líquido LTM</span>
                  <span className="font-mono font-black text-slate-200">{formatCurrency(valuationMetrics.ltmProfit)}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 block font-bold uppercase">EBITDA Simulado</span>
                  <span className="font-mono font-black text-slate-200">{formatCurrency(valuationMetrics.simulatedEbitda)}</span>
                </div>
              </div>
            </div>

            {/* HEURÍSTICA DE ANÁLISE DE EXIT AI CO PILOT */}
            <div className="bg-orange-50/25 border border-orange-100 rounded-3xl p-5 text-left space-y-3">
              <div className="flex gap-2.5 items-start">
                <Lightbulb size={18} className="text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-orange-950 font-black uppercase text-[11px] font-sans block">
                    Dica Consultiva de Elevado Potencial (M&A)
                  </strong>
                  <p className="text-xs text-orange-900/95 leading-relaxed font-semibold">
                    {valuationAnalysisText.strategicVerdict}
                  </p>
                </div>
              </div>

              {/* Tips list */}
              <div className="space-y-2 pt-2 border-t border-orange-100">
                <span className="text-[9px] text-orange-850 font-black uppercase block tracking-wider">Ações estratégicas para multiplicar seu Múltiplo:</span>
                <ul className="space-y-1.5">
                  {valuationAnalysisText.optimizations.map((tip, idx) => (
                    <li key={idx} className="text-[11px] text-orange-950 font-semibold flex items-start gap-1.5">
                      <span className="text-orange-500 font-bold shrink-0">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* PARTE INFERIOR: SIMULADOR DE ELASTICIDADE DE PREÇO (STRATEGIC PRICING SENSTIVITY) */}
        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-emerald-500" />
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-800">
              2. Simulador de Elasticidade de Preço de Demanda (Tática de Portfólio)
            </h4>
          </div>

          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            Seus clientes aceitam aumentos de preços? Ajuste as variáveis para simular a mudança líquida no faturamento de acordo com a sensibilidade natural de Elasticidade (Queda de Volume por aumento de % valor).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
            <div className="space-y-4">
              
              {/* Slider 1: Reajuste planejado */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                  <span className="text-gray-400">Reajuste de Preço Proposto (%)</span>
                  <span className={cn("px-2 py-0.5 rounded font-mono font-bold", elasticityPriceChange >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50")}>
                    {elasticityPriceChange >= 0 ? `+${elasticityPriceChange}%` : `${elasticityPriceChange}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={elasticityPriceChange}
                  onChange={(e) => setElasticityPriceChange(parseInt(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2: Coeficiente de elasticidade */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                  <span className="text-gray-400">Coeficiente de Elasticidade (Sensibilidade)</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">{elasticityCoeff} (Sensível)</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={elasticityCoeff}
                  onChange={(e) => setElasticityCoeff(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-450 font-bold px-1">
                  <span>0.2 - Pouco Sensível (Remédio/Monopólio)</span>
                  <span>1.0 - Unidade</span>
                  <span>3.0 - Hiper Sensível (Commodities)</span>
                </div>
              </div>

            </div>

            {/* RESULTADO E IMPACTO SÍNCRONO */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Projeto de Impacto Financeiro</span>
                <span className={cn(
                  "px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider",
                  priceSensitivityMetrics.isPositiveImpact ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                )}>
                  {priceSensitivityMetrics.isPositiveImpact ? "Ganho de Caixa" : "Destruição de Receita"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-slate-100">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Variação Física de Volume</span>
                  <strong className={cn("text-base font-mono font-black", priceSensitivityMetrics.pctQtyChange >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {priceSensitivityMetrics.pctQtyChange > 0 ? `+${priceSensitivityMetrics.pctQtyChange}%` : `${priceSensitivityMetrics.pctQtyChange}%`}
                  </strong>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Demanda Física Projetada</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Faturamento LTM Futuro</span>
                  <strong className="text-base font-mono font-black text-slate-850">
                    {formatCurrency(priceSensitivityMetrics.simulatedNewRevenue)}
                  </strong>
                  <strong className={cn("text-[9px] font-bold block mt-0.5", priceSensitivityMetrics.revenueDifference >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {priceSensitivityMetrics.revenueDifference >= 0 ? `+${priceSensitivityMetrics.revDiffPct}%` : `${priceSensitivityMetrics.revDiffPct}%`} ({formatCurrency(priceSensitivityMetrics.revenueDifference)})
                  </strong>
                </div>
              </div>

              <div className="text-[10px] bg-slate-50 border border-slate-150 p-3 rounded-2xl text-slate-600 font-semibold leading-relaxed">
                {priceSensitivityMetrics.isPositiveImpact ? (
                  <span className="text-emerald-950">
                    💡 <strong>Veredito: Lucrativo.</strong> A inelasticidade dos clientes permite cobrir a pequeníssima perda física de volume pelo ganho extra arrecadado por cada venda. Recomendado implantar!
                  </span>
                ) : (
                  <span className="text-rose-950">
                     ⚠️ <strong>Veredito: Recuar.</strong> O reajuste sugerido causará uma evasão de clientes tão agressiva que reduzirá seu faturamento anual consolidado. Prefira cortar OPEX.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      </motion.div>

      {/* COMPARADOR REALTIME EBITDA DO TRIMESTRE */}
      <AnimatePresence mode="popLayout">
        {!topWidgets.includes("ebitda_comparison") && (
          <motion.div
            key="ebitda-comparison-default"
            layoutId="cockpit-widget-ebitda_comparison"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.98 }}
            transition={{
              type: "spring",
              damping: 22,
              stiffness: 120,
              layout: { type: "spring", damping: 25, stiffness: 120 }
            }}
            className="w-full"
          >
            {renderEbitdaComparison()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAINEL DE OBJETIVOS E OKRS OPERACIONAIS */}
      <AnimatePresence mode="popLayout">
        {!topWidgets.includes("goals") && (
          <motion.div
            key="goals-default"
            layoutId="cockpit-widget-goals"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.98 }}
            transition={{
              type: "spring",
              damping: 22,
              stiffness: 120,
              layout: { type: "spring", damping: 25, stiffness: 120 }
            }}
            className="w-full"
          >
            {renderGoals()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAINEL DECISOR DO EMPRESÁRIO */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#141414] rounded-[2.5rem] p-6 lg:p-8 space-y-8 shadow-xl relative overflow-hidden"
      >
        {/* Background Accent Grids & Orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/3 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Grid: Elite Executive Styled Header (Pitch Black & Orange) */}
        <div className="bg-[#141414] text-white p-6 lg:p-8 rounded-t-[2.2rem] -mx-6 lg:-mx-8 -mt-6 lg:-mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border-b-4 border-orange-500">
          <div className="space-y-1.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-orange-500 text-black font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                👑 COCKPIT DECISOR DO EMPRESÁRIO
              </span>
              <span className="bg-white/10 text-gray-300 font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/5">
                GESTÃO ESTRATÉGICA ATIVA
              </span>
            </div>
            <h3 className="font-black text-2xl lg:text-3xl uppercase tracking-tight text-white italic">
              Alavancagem de Lucratividade
            </h3>
            <p className="text-xs text-gray-400 max-w-3xl font-medium leading-relaxed">
              Painel de simulação científica. Avalie instantaneamente o impacto de reajustar seus preços gerais de venda (<span className="text-orange-400 font-bold">Mark-up</span>) ou cortar despesas operacionais (<span className="text-orange-400 font-bold">OPEX</span>) para blindar seu caixa corporativo.
            </p>
          </div>

          <button
            onClick={() => {
              const emojiMC = simMC >= 40 ? "🟢" : simMC >= 25 ? "🟡" : "🔴";
              const shareText = `👑 *MaxPerformance Business - Cockpit Decisor do Empresário*
━━━━━━━━━━━━━━━━━━━━━
🏢 *Empresa:* ${profile?.companyName || "Minha Empresa"}
📅 *Período:* ${format(new Date(), "MMMM yyyy", { locale: ptBR })}

🎯 *PONTO DE EQUILÍBRIO (BREAKEVEN)*
• Real Operacional: R$ ${baseBreakeven.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Alvo Simulado: R$ ${simBreakeven.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Meta Batida? ${recBruta >= simBreakeven ? "Sim! 🎉 Sobra Gerada" : "Ainda não ⚠️ deficitário"}

📊 *MARGEM DE CONTRIBUIÇÃO (EFICIÊNCIA)*
• Margem Real: ${baseMC.toFixed(1)}%
• Margem Simulada: ${simMC.toFixed(1)}% ${emojiMC}
• Alteração Planejada: ${markupSim >= 0 ? `+${markupSim}% nos preços` : `${markupSim}%`}

⏳ *RUNWAY DE CAIXA (DIAS DE SOBREVIVÊNCIA)*
• Sobrevivência Atual: ${baseRunwayDays} dias
• Sobrevivência Simulada: ${simRunwayDays} dias
• Burn Rate de OPEX Diário: R$ ${simDailyBurn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia

💡 _"Menos custo fixo, mais margem e precificação científica para blindar o seu patrimônio corporativo."_`;
              navigator.clipboard.writeText(shareText);
              showToast("Diretrizes de Alavancagem copiadas com sucesso!", "success");
            }}
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-black hover:text-black font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-lg transform hover:-translate-y-0.5 shrink-0"
          >
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Exportar Diretrizes
          </button>
        </div>

        {/* Dynamic Indicators Grid - Styled as Premium Dashboard Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Card 1: Contribution Margin */}
          <div className="bg-[#fafafa] border border-gray-250 hover:border-orange-500 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-1 bg-orange-500 h-full group-hover:h-full transition-all duration-300" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-orange-500/10 text-orange-600 font-extrabold px-2.5 py-1 rounded border border-orange-500/20 uppercase tracking-wider">
                  MARGEM DE CONTRIBUIÇÃO (MC)
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Eficiência Bruta sobre Vendas
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-[#141414] font-mono tracking-tight leading-none">
                  <AnimatedNumber value={simMC} formatter={(v) => `${v.toFixed(1)}%`} />
                </span>
                {markupSim !== 0 && (
                  <span className={cn(
                    "text-xs font-black font-mono px-2 py-0.5 rounded-full",
                    markupSim > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  )}>
                    ({markupSim > 0 ? `+${markupSim.toFixed(1)}%` : `${markupSim.toFixed(1)}%`})
                  </span>
                )}
              </div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono mt-1.5">
                Taxa Operacional Real: {baseMC.toFixed(1)}%
              </div>
            </div>

            <div className="border-t border-gray-200/60 pt-3">
              {simMC >= 40 ? (
                <p className="text-[10px] text-emerald-700 font-bold uppercase leading-relaxed flex items-start gap-1">
                  <span>🟢</span>
                  <span>MARGEM SAUDÁVEL. Alto retorno para cobrir OPEX fixo.</span>
                </p>
              ) : simMC >= 25 ? (
                <p className="text-[10px] text-amber-600 font-bold uppercase leading-relaxed flex items-start gap-1">
                  <span>🟡</span>
                  <span>MARGEM MODERADA. Avalie e renegocie preços de fornecedores.</span>
                </p>
              ) : (
                <p className="text-[10px] text-rose-600 font-bold uppercase leading-relaxed flex items-start gap-1 animate-pulse">
                  <span>🔴</span>
                  <span>MARGEM CRÍTICA. Você corre risco de vender sem gerar lucro líquido.</span>
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Breakeven Point (Ponto de Equilíbrio) */}
          <div className="bg-[#fafafa] border border-gray-250 hover:border-[#141414] rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-1 bg-[#141414] h-full group-hover:h-full transition-all duration-300" />
            <div className="space-y-1.5 flex flex-col items-start">
              <span className="text-[10px] bg-[#141414] text-white font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">
                PONTO DE EQUILÍBRIO (BREAKEVEN)
              </span>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Faturamento alvo para deficit zero
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#141414] font-mono tracking-tight leading-none">
                  <AnimatedNumber value={simBreakeven} formatter={formatCurrency} type="expense" />
                </span>
                {opexSim !== 0 && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-black px-1.5 py-0.5 rounded-sm">
                    OTIMIZADO
                  </span>
                )}
              </div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono mt-1.5">
                Real Realizado: {formatCurrency(recBruta)}
              </div>
            </div>

            <div className="border-t border-gray-200/60 pt-3">
              {recBruta >= simBreakeven ? (
                <p className="text-[10px] text-emerald-700 font-bold uppercase leading-relaxed flex items-start gap-1">
                  <span>🎉</span>
                  <span>MARGEM DE LUCRO SUPERADA. Sobrou {formatCurrency(recBruta - simBreakeven)} em caixa líquido.</span>
                </p>
              ) : (
                <p className="text-[10px] text-rose-600 font-bold uppercase leading-relaxed flex items-start gap-1">
                  <span>⚠️</span>
                  <span>DEFICITÁRIO. Faltam {formatCurrency(simBreakeven - recBruta)} para equilibrar as despesas.</span>
                </p>
              )}
            </div>
          </div>

          {/* Card 3: Runway de Caixa (Survival Runway) */}
          <div className="bg-[#fafafa] border border-gray-250 hover:border-orange-500 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-1 bg-orange-500 h-full group-hover:h-full transition-all duration-300" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-[10px] font-extrabold px-2.5 py-1 rounded border uppercase tracking-wider",
                  simRunwayDays >= 60 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : simRunwayDays >= 30 
                      ? "bg-amber-50 text-amber-700 border-amber-100" 
                      : "bg-rose-50 text-rose-700 border-rose-100"
                )}>
                  RUNWAY DE CAIXA
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-sans">
                Dias de Cobertura sem Novas Receitas
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-[#141414] font-mono tracking-tight leading-none font-black">
                  <AnimatedNumber value={simRunwayDays} formatter={(v) => `${Math.round(v)} dias`} />
                </span>
                {simRunwayDays !== baseRunwayDays && (
                  <span className="text-xs text-emerald-600 font-black font-mono">
                    (+{simRunwayDays - baseRunwayDays}d fôlego)
                  </span>
                )}
              </div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono mt-1.5">
                Taxa de Queima Diária: {formatCurrency(simDailyBurn)}/dia
              </div>
            </div>

            <div className="border-t border-gray-200/60 pt-3">
              {simRunwayDays >= 90 ? (
                <p className="text-[10px] text-emerald-700 font-bold uppercase leading-relaxed flex items-start gap-1">
                  <span>🟢</span>
                  <span>FÔLEGO CONFORTÁVEL. Caixa seguro para guiar expansões de mercado.</span>
                </p>
              ) : simRunwayDays >= 30 ? (
                <p className="text-[10px] text-amber-500 font-bold uppercase leading-relaxed flex items-start gap-1">
                  <span>🟡</span>
                  <span>ATENÇÃO. Caixa residual cobre menos de 60 dias das obrigações.</span>
                </p>
              ) : (
                <p className="text-[10px] text-rose-600 font-bold uppercase leading-relaxed flex items-start gap-1 animate-pulse">
                  <span>🚨</span>
                  <span>RISCO IMEDIATO. Liquidez vulnerável. Enxugue custos imediatamente!</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Interactive Sandbox Controls - Premium Clean Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-6 lg:p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-5 bg-orange-500 rounded-xs block"></span>
            <h4 className="font-black text-xs uppercase text-gray-900 tracking-wider">
              Simulador de Decisões do Diretor (Sandbox Alavancagem)
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control 1: Price expansion */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-4 shadow-3xs">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-gray-900 font-black uppercase tracking-wider text-[10px] block">
                    📊 Ajuste de Preço Operacional (Mark-up)
                  </label>
                  <span className="text-[9px] text-gray-400 font-sans uppercase font-bold tracking-widest mt-0.5 block">
                    Ajuste médio das tabelas de vendas
                  </span>
                </div>
                <span className={cn(
                  "font-black font-mono px-3 py-1 rounded text-sm shrink-0 border",
                  markupSim > 0 
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" 
                    : markupSim < 0 
                      ? "bg-rose-500/10 text-rose-700 border-rose-500/20" 
                      : "bg-[#141414] text-white border-transparent"
                )}>
                  {markupSim >= 0 ? `+${markupSim}%` : `${markupSim}%`}
                </span>
              </div>
              
              <input
                type="range"
                min="-15"
                max="30"
                step="1"
                value={markupSim}
                onPointerDown={() => setIsSliding(true)}
                onPointerUp={() => setIsSliding(false)}
                onPointerCancel={() => setIsSliding(false)}
                onChange={(e) => {
                  setMarkupSim(Number(e.target.value));
                  triggerSlidingEffect();
                  try {
                    if ((window as any).completeTourTask) {
                      (window as any).completeTourTask("sandbox_simulation");
                    }
                  } catch (err) {}
                }}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-[9px] font-extrabold text-gray-400 uppercase font-mono pt-1">
                <span>Defasado (-15%)</span>
                <span className="text-gray-600">Atual (0%)</span>
                <span className="text-orange-600 font-bold">Otimizado (+30%)</span>
              </div>
            </div>

            {/* Control 2: OPEX reductions */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-4 shadow-3xs">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-gray-900 font-black uppercase tracking-wider text-[10px] block">
                    ✂️ Enxugamento de Custos Fixos (OPEX)
                  </label>
                  <span className="text-[9px] text-gray-400 font-sans uppercase font-bold tracking-widest mt-0.5 block">
                    Corte estrutural em despesas administrativas
                  </span>
                </div>
                <span className={cn(
                  "font-black font-mono px-3 py-1 rounded text-sm shrink-0 border",
                  opexSim > 0 
                    ? "bg-orange-500/10 text-orange-600 border-orange-500/20" 
                    : "bg-[#141414] text-white border-transparent"
                )}>
                  -{opexSim}% despesas
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={opexSim}
                onPointerDown={() => setIsSliding(true)}
                onPointerUp={() => setIsSliding(false)}
                onPointerCancel={() => setIsSliding(false)}
                onChange={(e) => {
                  setOpexSim(Number(e.target.value));
                  triggerSlidingEffect();
                  try {
                    if ((window as any).completeTourTask) {
                      (window as any).completeTourTask("sandbox_simulation");
                    }
                  } catch (err) {}
                }}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-[9px] font-extrabold text-gray-400 uppercase font-mono pt-1">
                <span>Custo Integrado (0%)</span>
                <span className="text-gray-600">Alvo Moderado (-25%)</span>
                <span className="text-orange-600 font-bold">Enxugo Forte (-50%)</span>
              </div>
            </div>

            {/* Control 3: Card machine fee optimizations */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-4 shadow-3xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-gray-900 font-black uppercase tracking-wider text-[10px] block">
                      💳 Negociação de Taxas de Maquininha
                    </label>
                    <span className="text-[9px] text-gray-400 font-sans uppercase font-bold tracking-widest mt-0.5 block">
                      Otimização de taxas em transações de cartão
                    </span>
                  </div>
                  <span className={cn(
                    "font-black font-mono px-3 py-1 rounded text-sm shrink-0 border",
                    cardFeeReductionSim > 0 
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-black" 
                      : "bg-[#141414] text-white border-transparent"
                  )}>
                    -{cardFeeReductionSim.toFixed(1)}% de taxas
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={cardFeeReductionSim}
                  onPointerDown={() => setIsSliding(true)}
                  onPointerUp={() => setIsSliding(false)}
                  onPointerCancel={() => setIsSliding(false)}
                  onChange={(e) => {
                    setCardFeeReductionSim(Number(e.target.value));
                    triggerSlidingEffect();
                    try {
                      if ((window as any).completeTourTask) {
                        (window as any).completeTourTask("sandbox_simulation");
                      }
                    } catch (err) {}
                  }}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex justify-between text-[9px] font-extrabold text-gray-400 uppercase font-mono pt-1">
                  <span>Taxa Cheia (0%)</span>
                  <span className="text-gray-600 font-bold">Alvo (-1%)</span>
                  <span className="text-orange-600 font-bold font-mono">Parceria VIP (-2%)</span>
                </div>
              </div>

              {cardFeeReductionSim > 0 && (
                <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100 flex items-center gap-1.5 mt-2 animate-in fade-in zoom-in-95 duration-200 text-left">
                  <span className="text-lg">💰</span>
                  <p className="text-[10px] text-emerald-800 leading-tight font-bold uppercase font-sans">
                    Margem Líquida Ampliada: <span className="text-emerald-700 font-extrabold font-mono text-xs block">R$ {cardSavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gráficos de Comparação de DRE Lado a Lado para o Simulador Sandbox */}
        <div className="bg-[#141414] text-white p-6 lg:p-8 rounded-[2rem] border border-gray-850 space-y-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
            <div className="space-y-1 text-left">
              <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[9px] uppercase tracking-widest font-black px-3 py-1 rounded-full font-mono">
                📈 SIMULAÇÃO VISUAL DE COMPETÊNCIA
              </span>
              <h4 className="font-black text-lg lg:text-xl uppercase tracking-tight italic text-white">
                Projeção Comparativa de DRE (Real vs. Sandbox Simulado)
              </h4>
              <p className="text-xs text-gray-400 font-medium">
                Evolução mensal do EBITDA operacional em reais paralela às margens calculadas sob as premissas ativas do Sandbox.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
            {/* EBITDA Comparison - Side-by-Side Bars */}
            <div className="bg-black/30 border border-gray-850 p-5 rounded-2xl space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest font-black text-orange-400 font-mono">
                  📊 Evolução Mensal do EBITDA
                </span>
                <span className="text-[9px] text-gray-450 font-semibold font-mono uppercase bg-white/5 px-2 py-0.5 rounded">
                  Valores em Reais (R$)
                </span>
              </div>
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={sandboxComparisonData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888" 
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#888" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0c0c0c", borderColor: "#333", borderRadius: "12px", color: "#fff" }}
                      formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                      labelStyle={{ color: "#f97316", fontWeight: "bold" }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} 
                    />
                    <Bar dataKey="EBITDA Real" fill="#52525b" name="EBITDA Real" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="EBITDA Simulado" fill="#f97316" name="EBITDA Simulado" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Margin Comparison - Side-by-Side Lines */}
            <div className="bg-black/30 border border-gray-850 p-5 rounded-2xl space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 font-mono">
                  🎯 Projeções de Margem Calculada
                </span>
                <span className="text-[9px] text-gray-450 font-semibold font-mono uppercase bg-white/5 px-2 py-0.5 rounded">
                  Margem EBITDA (%)
                </span>
              </div>
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={sandboxComparisonData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888" 
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#888" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val.toFixed(0)}%`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0c0c0c", borderColor: "#333", borderRadius: "12px", color: "#fff" }}
                      formatter={(value: any) => [`${value}%`, ""]}
                      labelStyle={{ color: "#10b981", fontWeight: "bold" }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Margem Real (%)" 
                      stroke="#a1a1aa" 
                      name="Margem Real" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Margem Simulada (%)" 
                      stroke="#10b981" 
                      name="Margem Simulada" 
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Quick Informative Metric Alert Footer */}
          <div className="bg-white/[0.02] border border-gray-850 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💡</span>
              <p className="text-[11px] leading-relaxed text-gray-300 font-medium">
                Dicas: Ajuste as barras sliders acima (Markup de Preço, Redução OPEX e Redução da taxa de cartão) e veja os efeitos instantâneos síncronos na evolução histórica simulada!
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar visualization vs Breakeven - Clean Custom Design */}
        <div className="bg-[#141414] text-white p-6 rounded-3xl border border-gray-850 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">
                TERMÔMETRO OPERACIONAL DE METAS
              </span>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">
                Relação entre Faturamento Atual e o Ponto de Equilíbrio Alvo
              </p>
            </div>
            <span className="text-xs bg-white/10 text-orange-400 font-mono font-black py-1 px-3 rounded-full border border-white/5 self-start sm:self-auto uppercase tracking-wider">
              {Math.round(recBruta > 0 ? (recBruta / simBreakeven) * 100 : 0)}% Atingido
            </span>
          </div>
          
          <div className="relative w-full bg-gray-800 h-4 rounded-full overflow-hidden border border-black p-0.5">
            <div 
              className="bg-gradient-to-r from-orange-600 to-amber-500 h-full rounded-full transition-all duration-1000 relative"
              style={{ width: `${Math.min(100, recBruta > 0 ? (recBruta / simBreakeven) * 100 : 0)}%` }}
            >
              <div className="absolute top-0 right-1 bottom-0 w-1 bg-white/30 animate-pulse rounded-full" />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between text-[10px] text-gray-400 uppercase font-black tracking-widest gap-2">
            <span>Faturamento Bruto Correto: {formatCurrency(recBruta)}</span>
            <span className="text-orange-400">Ponto de Equilíbrio Simulado: {formatCurrency(simBreakeven)}</span>
          </div>
        </div>

        {/* Actionable Strategy Checklist Panel - Pitch Black Elegant Layout */}
        <div className="bg-[#141414] text-white p-6 lg:p-8 rounded-[2rem] border border-gray-850 space-y-5 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/2 rounded-full blur-2xl pointer-events-none" />
          <h5 className="font-black text-xs lg:text-sm uppercase tracking-widest text-orange-400 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5h-18" />
            </svg>
            Recomendações e Diretrizes Estratégicas para Implementação Imediata:
          </h5>

          <ul className="text-xs space-y-4 font-semibold text-gray-300">
            {simMC < 30 ? (
              <li className="flex gap-3 items-start bg-white/3 p-4 rounded-xl border border-white/5">
                <span className="text-rose-500 font-extrabold text-sm shrink-0 pt-0.5">⚠️</span>
                <span className="leading-relaxed">
                  <strong className="text-white block uppercase tracking-wide text-[10px] mb-1">Ação de Margem Requerida</strong>
                  Sua Margem de Contribuição está severamente reduzida. Considere renegociar tarifas ou prazos corporativos com fornecedores diretos do CMV ou aplicar reajustes escalonados na precificação de seus principais produtos.
                </span>
              </li>
            ) : (
              <li className="flex gap-3 items-start bg-white/3 p-4 rounded-xl border border-white/5">
                <span className="text-emerald-500 font-extrabold text-sm shrink-0 pt-0.5">✓</span>
                <span className="leading-relaxed">
                  <strong className="text-white block uppercase tracking-wide text-[10px] mb-1">Aproveitamento de Alavancagem</strong>
                  Sua Margem de Contribuição está em patamar confortável! Concentre a musculatura comercial nos canais digitais ou produtos premium que entregam esse retorno unitário acima da média.
                </span>
              </li>
            )}

            {recBruta < simBreakeven ? (
              <li className="flex gap-3 items-start bg-white/3 p-4 rounded-xl border border-white/5">
                <span className="text-orange-500 font-extrabold text-sm shrink-0 pt-0.5">⚠️</span>
                <span className="leading-relaxed">
                  <strong className="text-white block uppercase tracking-wide text-[10px] mb-1">Otimização de Breakeven</strong>
                  Sua receita atual ainda opera em zona deficitária. Para conquistar o ponto de equilíbrio, a meta de faturamento médio diário comercial precisa manter o ritmo de <span className="text-orange-400 font-mono font-bold">{formatCurrency(simBreakeven / 30)}/dia</span>.
                </span>
              </li>
            ) : (
              <li className="flex gap-3 items-start bg-white/3 p-4 rounded-xl border border-white/5">
                <span className="text-emerald-500 font-extrabold text-sm shrink-0 pt-0.5">✓</span>
                <span className="leading-relaxed">
                  <strong className="text-white block uppercase tracking-wide text-[10px] mb-1">Crescimento Sustentável Ativo</strong>
                  Faturamento de vendas saudável e operando acima da linha crítica de breakeven! Qualquer incremento em vendas faturará cerca de <span className="text-emerald-400 font-mono font-bold">{(simMC).toFixed(0)}%</span> em lucro operacional puro e dividendos.
                </span>
              </li>
            )}

            {simRunwayDays < 60 ? (
              <li className="flex gap-3 items-start bg-white/3 p-4 rounded-xl border border-white/5">
                <span className="text-rose-400 font-extrabold text-sm shrink-0 pt-0.5">⚠️</span>
                <span className="leading-relaxed">
                  <strong className="text-white block uppercase tracking-wide text-[10px] mb-1">Garantia de Capital de Giro</strong>
                  Seu runway de caixa residual está reduzido ({simRunwayDays} dias). É imperativo antecipar recebíveis comerciais de menor custo ou renegociar alongamentos de prazos com fornecedores de OPEX estrutural para ampliar seu fôlego financeiro.
                </span>
              </li>
            ) : (
              <li className="flex gap-3 items-start bg-white/3 p-4 rounded-xl border border-white/5">
                <span className="text-emerald-500 font-extrabold text-sm shrink-0 pt-0.5">✓</span>
                <span className="leading-relaxed">
                  <strong className="text-white block uppercase tracking-wide text-[10px] mb-1">Resiliência Operacional Premium</strong>
                  Fôlego financeiro de alto padrão de retenção de capital de giro. Seu caixa residual cobre as necessidades fixas por mais de {simRunwayDays} dias, garantindo paz operacional para negociar prazos ou expandir a presença.
                </span>
              </li>
            )}
          </ul>
        </div>
      </motion.div>

      {/* Financial Assistant Card */}
      <FinancialAssistant
        income={totalIncome}
        expense={totalExpense}
        balance={balance}
        aiEngine={aiEngine}
        setAiEngine={setAiEngine}
        autoGptTips={autoGptTips}
        setAutoGptTips={setAutoGptTips}
        gptTipInterval={gptTipInterval}
        setGptTipInterval={setGptTipInterval}
        neuralPrecision={neuralPrecision}
        neuralTier={neuralTier}
        voicePitch={voicePitch}
        setVoicePitch={setVoicePitch}
        voiceRate={voiceRate}
        setVoiceRate={setVoiceRate}
        voiceVolume={voiceVolume}
        setVoiceVolume={setVoiceVolume}
        availableVoices={availableVoices}
        selectedVoiceName={selectedVoiceName}
        setSelectedVoiceName={setSelectedVoiceName}
        setActiveTab={setActiveTab}
        simulatedCrisis={simulatedCrisis}
        setSimulatedCrisis={setSimulatedCrisis}
      />

      <div className={cn(
        "grid grid-cols-1 gap-6",
        !topWidgets.includes("latest_transactions") && "lg:grid-cols-2"
      )}>
        {/* Chart */}
        <div className="bg-[#0c0c0c] text-white p-6 lg:p-8 rounded-[2.5rem] shadow-2xl border-2 border-orange-500/20 relative overflow-hidden group transition-all duration-500 flex flex-col justify-between text-left">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-[60px] pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="bg-orange-500 text-black font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-sm inline-block mb-1">
                  MÓDULO GRÁFICO // VETORES D3
                </span>
                <h3 className="font-black uppercase italic tracking-tighter text-xl text-white">
                  Desempenho Geral
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Comparativo de fluxo mensal realizado
                </p>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-orange-400 group-hover:text-white transition-colors">
                <BarChart3 size={24} />
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#1F2937"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: "black", fill: "#E5E7EB" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "rgba(249, 115, 22, 0.05)" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid rgba(249, 115, 22, 0.3)",
                      backgroundColor: "#0c0c0c",
                      color: "#ffffff"
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Total"]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#ff8c3c" : "#f97316"}
                        className="transition-all duration-500"
                      />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(val: number) => formatCurrency(val)}
                      style={{
                        fontSize: "9px",
                        fontWeight: "900",
                        fill: "#fb923c",
                        fontFamily: "JetBrains Mono",
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="text-[10px] font-mono text-gray-500 flex justify-between pt-4 border-t border-white/5 mt-4">
            <span>D3 CONSTANT: ACTIVE</span>
            <span>GRID SYSTEM: OK</span>
          </div>
        </div>

        {/* Latest Transactions */}
        <AnimatePresence mode="popLayout">
          {!topWidgets.includes("latest_transactions") && (
            <motion.div
              key="latest-transactions-default"
              layoutId="cockpit-widget-latest_transactions"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.98 }}
              transition={{
                type: "spring",
                damping: 22,
                stiffness: 120,
                layout: { type: "spring", damping: 25, stiffness: 120 }
              }}
              className="w-full"
            >
              <div className="flex flex-col gap-6">
                {/* Solução de Selo de Alta Performance e 1º Lugar Nacional sobre a animação do lado direito */}
                <BestTechnologySeal layout="horizontal" size="sm" className="w-full" />
                {renderLatestTransactions()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SEÇÃO ARQUITETURA DE SELEÇÃO & ENGENHARIA DO SISTEMA */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#141414] text-white border-2 border-[#141414] rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden mt-6"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1.5 z-10 text-left">
            <span className="bg-orange-500 text-black font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 w-max">
              <Cpu className="w-3.5 h-3.5" /> CORE APP ARCHITECTURE
            </span>
            <h3 className="font-black text-2xl uppercase tracking-tight italic text-white flex items-center gap-2">
              Engenharia de Software & Arquitetura de Sistemas
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Detalhamento de baixo nível da pilha de tecnologias de alta performance, processamento analítico e computação inteligente que sustentam o app.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2 text-left">
            <div className="flex items-center gap-2 text-orange-400">
              <Code2 className="w-5 h-5" />
              <h5 className="font-extrabold text-xs uppercase tracking-wider">Frontend SPA & React</h5>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Desenvolvido sob o ecossistema <strong>React 18+</strong> e tipado estritamente com <strong>TypeScript 5</strong>. O build e bundles são orquestrados em tempo recorde pelo compilador do <strong>Vite</strong>, assegurando que toda renderização permaneça com 100% de reatividade client-side.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2 text-left">
            <div className="flex items-center gap-2 text-indigo-400">
              <Flame className="w-5 h-5" />
              <h5 className="font-extrabold text-xs uppercase tracking-wider">Motor de Dados & Recharts</h5>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Gráficos de fluxo de caixa, balancete e DRE simulados de forma interativa com Tags SVG dinâmicas usando <strong>Recharts</strong> sob as regras matemáticas do motor de renderização vetorial de dados do <strong>D3.js</strong>.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2 text-left">
            <div className="flex items-center gap-2 text-emerald-400">
              <Cpu className="w-5 h-5" />
              <h5 className="font-extrabold text-xs uppercase tracking-wider">Cognição Artificial Gemini</h5>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Algoritmos preditivos e geradores de relatórios de auditoria financeira criados via proxy server-side integrado ao novo SDK de <strong>@google/genai</strong>, lendo relatórios DRE estruturados e devolvendo insights estratégicos.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2 text-left">
            <div className="flex items-center gap-2 text-pink-400">
              <Zap className="w-5 h-5" />
              <h5 className="font-extrabold text-xs uppercase tracking-wider">Backend Express & Deploy</h5>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Executando sob nuvem ágil num container do **Google Cloud Run (Platform Knative)**. O backend em **Express (custom Node.js server)** tem suas rotas Typescript elegantemente compiladas e unificadas em CommonJS CJS via **esbuild** reduzindo gargalos.
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center text-left">
          <div className="space-y-1">
            <h6 className="text-xs font-extrabold text-gray-200 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" /> REATIVIDADE DE CONTEXTO & REDUX-FREE STATE
            </h6>
            <p className="text-[11px] text-gray-400 leading-relaxed max-w-4xl">
              Nossa gerência de transações de filiais, DRE e sandbox de simulações macroeconômicas dispensa gerenciadores pesados obsoletos. Utilizamos uma malha reativa de alta performance baseada em múltiplos <strong>React Context Providers</strong> combinados a hooks unificados, com sincronização em cache local persistente em <strong>localStorage</strong> e persistência nativa assíncrona com os canais do <strong>Firebase Firestore Cloud</strong> para usuários autenticados.
            </p>
          </div>
          <div className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-black px-4 py-2 rounded-xl border border-white/10 w-full md:w-auto text-center shrink-0">
            ENV_BUILD_STATE = "PRODUCTION_STABLE"
          </div>
        </div>
      </motion.div>

      {/* SEÇÃO/MENU DE INDICAÇÃO DE AMIGOS E CAPTAÇÃO DE LEADS COMERCIAIS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0c0c0c] border-2 border-orange-500 rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden"
        id="dashboard-referral-leadmenu-card"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1 text-left">
            <span className="bg-orange-500 text-black font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5 font-mono">
              🤝 ECOSSISTEMA DE CAPTAÇÃO & FOMENTO COLETIVO
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight pt-1">
              Menu de Indicação PJ & Aliança de Fomento Tecnológico
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-2xl font-sans">
              Indique outros proprietários de empresas, controllers ou diretores financeiros de sua rede PJ. A expansão de nossa rede síncrônica viabiliza rodadas de coinvestimento de capital dedicadas a acelerar novas modelagens computacionais e inteligências de controladoria preditivas no app!
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              onClick={() => {
                showToast("Iniciando a exportação do Relatório de Metas...", "info");
                try {
                  const pdfDoc = new AbntPdfDocument({
                    isAbntStandard: false,
                    primaryColor: { r: 12, g: 12, b: 12 },
                    secondaryColor: { r: 249, g: 115, b: 22 }
                  });

                  // Calculate local goals
                  const goals = getDynamicGoals(allTransactions, categories);
                  const rawRemoved = localStorage.getItem("dafne_removed_default_goals");
                  const removedTitles: string[] = rawRemoved ? JSON.parse(rawRemoved) : [];
                  const filteredDefaultGoals = goals.filter((g) => !removedTitles.includes(g.title));

                  const rawCustom = localStorage.getItem("dafne_custom_goals");
                  const customGoals: any[] = rawCustom ? JSON.parse(rawCustom) : [];

                  const now = new Date();
                  const currentYear = now.getFullYear();
                  const currentMonth = now.getMonth();

                  const updatedCustomGoals = customGoals.map((g) => {
                    const matchingInvestment = transactions
                      .filter((t) => {
                        const d = new Date(t.date);
                        if (!(d.getFullYear() === currentYear && d.getMonth() === currentMonth)) return false;

                        const cat = categories.find((c) => c.id === t.categoryId);
                        const descUpper = (t.description || "").toUpperCase();
                        const isInvestment = (cat?.group === "INVESTMENT") || 
                                             descUpper.includes("RESERVA") || 
                                             descUpper.includes("EMERGENCIA") || 
                                             descUpper.includes("EMERGÊNCIA") || 
                                             descUpper.includes("APORTE") || 
                                             descUpper.includes("INVESTIMENTO");
                        if (!isInvestment) return false;

                        return (t.description || "").toUpperCase().includes(g.title.toUpperCase());
                      })
                      .reduce((sum, t) => sum + t.amount, 0);

                    return {
                      ...g,
                      current: g.current + matchingInvestment,
                    };
                  });

                  const rawOverrides = localStorage.getItem("dafne_goal_overrides");
                  const goalOverrides: Record<string, { current?: number; target?: number }> = rawOverrides ? JSON.parse(rawOverrides) : {};

                  const localAllGoals = [...filteredDefaultGoals, ...updatedCustomGoals].map((g) => {
                    const key = g.isCustom ? g.id : g.title;
                    const override = goalOverrides[key];
                    return {
                      ...g,
                      current: override?.current !== undefined ? override.current : g.current,
                      target: override?.target !== undefined ? override.target : g.target,
                    };
                  });

                  const companyName = profile?.companyName || "Holding de Negócios PJ";

                  pdfDoc.drawCover(
                    companyName,
                    "RELATÓRIO RESUMIDO DE METAS & COFRINHOS DE BLINDAGEM",
                    `Auditoria de Reservas Acumuladas, Fundos de Risco e Margens de Segurança - Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
                    "CONTROLADORIA & MODELAGEM MACROECONÔMICA"
                  );

                  pdfDoc.addPrimaryHeading("1. RESUMO EXECUTIVO DE RESERVAS PJ");

                  const totalReservado = localAllGoals.filter(g => !g.inverse).reduce((acc, g) => acc + g.current, 0);
                  const totalAlvo = localAllGoals.filter(g => !g.inverse).reduce((acc, g) => acc + g.target, 0);
                  const totalGoalsCount = localAllGoals.length;
                  const avgProgress = localAllGoals.reduce((acc, g) => acc + (Math.min(100, (g.current / g.target) * 100)), 0) / Math.max(1, localAllGoals.length);

                  pdfDoc.addParagraph(
                    `O monitoramento de metas corporativas e fundos de blindagem constitui um pilar fundamental para a resiliência operacional da ${companyName}. Em épocas de flutuações macroeconômicas ou sazonais, manter reservas líquidas com liquidez imediata garante a amortização de passivos sem sobressaltos e de forma independente de aportes externos.`
                  );

                  pdfDoc.addSummaryCard("KPIs das Metas Corporativas", [
                    {
                      label: "Fundo Reservado",
                      value: `R$ ${totalReservado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    },
                    {
                      label: "Alvo Desejado",
                      value: `R$ ${totalAlvo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    },
                    {
                      label: "Qtd. de Metas",
                      value: `${totalGoalsCount} ativas`
                    },
                    {
                      label: "Progresso Médio",
                      value: `${avgProgress.toFixed(1)}%`,
                      color: { r: 249, g: 115, b: 22 }
                    }
                  ]);

                  pdfDoc.addParagraph(
                    `Nossa inteligência computacional recomenda que as empresas guardem ao menos 10% a 15% de todo o seu faturamento síncrono. Atualmente, o grupo apresenta um montante já consolidado de R$ ${totalReservado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em seus vários cofrinhos de segurança, cobrindo as despesas planejadas de forma robusta.`
                  );

                  pdfDoc.addPrimaryHeading("2. ESTADO DETALHADO DOS COFRINHOS E MARCOS ATIVOS");

                  pdfDoc.addParagraph(
                    "Abaixo estão detalhados individualmente todos os cofrinhos operacionais e metas de limite em andamento. Estes marcos representam os escopos financeiros síncronos criados organicamente ou programados via inteligência artificial na Dafne:"
                  );

                  const columns: TableColumn[] = [
                    { header: "Meta / Cofrinho", key: "title", width: 62, align: "left" },
                    { header: "Acumulado Atual", key: "currentStr", width: 32, align: "right" },
                    { header: "Meta de Alvo", key: "targetStr", width: 32, align: "right" },
                    { header: "Progresso", key: "progressStr", width: 20, align: "right" },
                    { header: "Dinâmica", key: "typeStr", width: 14, align: "center" }
                  ];

                  const tableData = localAllGoals.map(g => {
                    const progress = Math.min(100, (g.current / g.target) * 100);
                    return {
                      title: g.title,
                      currentStr: `R$ ${g.current.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
                      targetStr: `R$ ${g.target.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
                      progressStr: `${Math.round(progress)}%`,
                      typeStr: g.inverse ? "Limite" : "Cofrinho"
                    };
                  });

                  tableData.push({
                    title: "CONSOLIDADO GERAL",
                    currentStr: `R$ ${totalReservado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
                    targetStr: `R$ ${totalAlvo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
                    progressStr: `${Math.round(totalReservado / Math.max(1, totalAlvo) * 100)}%`,
                    typeStr: "Soma",
                    isBold: true,
                    isTotal: true
                  } as any);

                  pdfDoc.addAbntTable(columns, tableData, `Auditoria Realizada em ${format(new Date(), "dd/MM/yyyy HH:mm")}`);

                  pdfDoc.addParagraph(
                    "Recomendações e Plano Síncrono de Alocação: as metas que atingiram 100% de progresso devem ser imediatamente convertidas em investimentos produtivos ou realocadas para contas de rendimento pós-fixado. Esforços de faturamento adicionais devem ser concentrados em cofrinhos com menor margem de cobertura para equilibrar as metas."
                  );

                  pdfDoc.addAuditSeal();

                  pdfDoc.save(`Relatorio_Metas_Dafne_${Date.now()}.pdf`);
                  showToast("Relatório de Metas exportado com sucesso!", "success");
                  sound.playClick();
                } catch (err) {
                  console.error("PDF generation error:", err);
                  showToast("Erro ao exportar o relatório de metas.", "error");
                }
              }}
              className="bg-white/10 hover:bg-orange-500 border border-white/20 hover:border-orange-500 text-white hover:text-black font-mono font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all h-8 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={11} />
              Exportar Relatório de Metas
            </button>
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono font-bold text-xs px-4 py-2 rounded-2xl h-8 flex items-center justify-center">
              {referralLeads.length} de 4 Parceiros Indicados
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 text-left">
          {/* Formulário de Envio */}
          <div className="xl:col-span-2 bg-white/[0.02] border border-white/[0.05] p-5 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-orange-500 font-mono tracking-widest block">Cadastrar Novo Parceiro</span>
              
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase block font-sans">Nome do Amigo / Decisor:</label>
                <input 
                  type="text"
                  placeholder="Ex: Carlos Eduardo Silveira"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none font-bold placeholder-white/20 transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block font-sans">WhatsApp ou E-mail:</label>
                  <input 
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={friendContact}
                    onChange={(e) => setFriendContact(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none font-bold placeholder-white/20 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase block font-sans">Nome da Empresa:</label>
                  <input 
                    type="text"
                    placeholder="Ex: Silveira Logística PJ"
                    value={friendCompany}
                    onChange={(e) => setFriendCompany(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none font-bold placeholder-white/20 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase block font-sans">Cargo / Relação Corporativa:</label>
                <select
                  value={friendRole}
                  onChange={(e) => setFriendRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none font-bold transition-all cursor-pointer font-sans"
                >
                  <option value="CEO & Sócio Geral">CEO & Sócio Geral</option>
                  <option value="CFO / Diretor Financeiro">CFO / Diretor Financeiro</option>
                  <option value="Controller / Contador PJ">Controller / Contador PJ</option>
                  <option value="Diretor Comercial / Vendas">Diretor Comercial / Vendas</option>
                  <option value="Advogado PJ / Advisor">Advogado PJ / Advisor</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRegisterReferralLead}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              <UserPlus size={15} />
              Enviar Cadastro de Indicações
            </button>
          </div>

          {/* Histórico e Status dos Contatos de Vendas */}
          <div className="xl:col-span-3 bg-white/[0.02] border border-white/[0.05] p-5 rounded-3xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase text-orange-500 font-mono tracking-widest block">Histórico de Indicações Enviadas</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">Monitor de Negócios</span>
              </div>

              <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin">
                {referralLeads.map((friend) => (
                  <div key={friend.id} className="p-3 bg-slate-900 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-left gap-3 relative group transition-all hover:border-orange-500/35">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-white font-sans">{friend.name}</span>
                        {friend.company && (
                          <span className="text-[9px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full font-bold font-sans">
                            {friend.company}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium font-mono leading-none">
                        {friend.contact} • <span className="text-orange-450 italic font-sans">{friend.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className={cn(
                        "text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider font-mono",
                        friend.status === "Aprovado" || friend.status === "Confirmado"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : friend.status === "Pendente" || friend.status === "Em Contato Comercial"
                          ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                          : "bg-gray-850 text-gray-400 border border-white/5"
                      )}>
                        ● {friend.status}
                      </span>
                      
                      <button
                        onClick={() => {
                          const customPitch = `Olá ${friend.name}! Estou utilizando a Dafne I.A. (sistema avançado de gestão financeira e controladoria para PJ) e ela revolucionou nossa análise de DRE, precificação de CMV e controle de fluxo de caixa. Ao unirmos forças e expandirmos nossa rede de parceiros empresariais PJ, geramos mais tração e volume para atrair grandes rodadas de investimento de capital. Todo esse aporte de fomento é direcionado em grande parte ao desenvolvimento de novas tecnologias e algoritmos de inteligência artificial de ponta no app! Se quiser se conectar a este ecossistema inovador, registre-se no link abaixo ou me avise para nosso time de implantação integrado entrar em contato direto com você: ${window.location.origin}?ref=${friend.id}`;
                          navigator.clipboard.writeText(customPitch);
                          showToast(`Pitch comercial copiado! Você pode colar no WhatsApp de ${friend.name}.`, "success");
                        }}
                        className="bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/20 p-2 rounded-xl text-gray-400 hover:text-orange-400 transition-all cursor-pointer"
                        title="Copiar pitch para WhatsApp"
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10.5px] text-gray-400 leading-relaxed pt-3 border-t border-white/5 font-sans">
              💡 <strong>Monitor Ativo de Coinvestimento:</strong> Cada empresa PJ cadastrada expande nosso ecossistema e atrai capital, direcionando mais recursos para acelerar novas automações inteligentes no sistema de controladoria de todos os participantes.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detalhamento Modal da Saúde Financeira */}
      <AnimatePresence>
        {detailModalToken && (() => {
          const title = detailModalToken === "balance" 
            ? "Detalhamento Integral de Caixa (Entradas & Saídas)" 
            : detailModalToken === "income" 
              ? "Detalhamento de Lançamentos de Receita" 
              : detailModalToken === "expense"
                ? "Detalhamento de Lançamentos de Despesa"
                : "Detalhamento Integral da Margem de Contribuição Média";

          const subtitle = detailModalToken === "balance"
            ? "Visualização e auditoria síncrona de todas as receitas, despesas e investimentos."
            : detailModalToken === "income"
              ? "Análise minuciosa de todas as entradas de faturamento bruto e aportes."
              : detailModalToken === "expense"
                ? "Monitoramento de todas as saídas de caixa operacionais (OPEX/CMV)."
                : "Auditoria analítica dos preços de venda, custos de aquisição e margens por produto/serviço.";

          let listToShow = [];
          if (detailModalToken === "balance") {
            listToShow = transactions;
          } else if (detailModalToken === "income") {
            listToShow = transactions.filter(t => t.type === "income");
          } else if (detailModalToken === "expense") {
            listToShow = transactions.filter(t => t.type === "expense");
          } else {
            listToShow = products || [];
          }

          // Filter list by search query
          const filteredList = listToShow.filter(t => {
            if (!detailSearch) return true;
            const searchStr = detailSearch.toLowerCase();
            if (detailModalToken === "contribution") {
              const p = t as any;
              return p.name.toLowerCase().includes(searchStr) ||
                     (p.description && p.description.toLowerCase().includes(searchStr)) ||
                     p.sellingPrice.toString().includes(searchStr);
            }
            const catName = categories.find(c => c.id === t.categoryId)?.name || "";
            return t.description.toLowerCase().includes(searchStr) ||
                   catName.toLowerCase().includes(searchStr) ||
                   t.amount.toString().includes(searchStr);
          });

          const totalSum = detailModalToken === "contribution"
            ? avgProductMargin
            : filteredList.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#060606]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-6 text-left"
              onClick={() => { setDetailModalToken(null); setDetailSearch(""); }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-[#0f0f10] border border-zinc-800 rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 lg:p-8 bg-zinc-950 border-b border-zinc-850 flex items-start justify-between gap-6 relative">
                  <div className="absolute top-0 right-16 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none" />
                  <div className="space-y-1 z-10">
                    <span className="text-[10px] font-mono text-orange-500 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block mb-2">
                      SYS_INSPECT_MODE // ATIVO
                    </span>
                    <h2 className="text-xl lg:text-2xl font-black uppercase italic tracking-tight text-white">
                      {title}
                    </h2>
                    <p className="text-xs text-gray-400 font-medium font-sans">
                      {subtitle}
                    </p>
                  </div>
                  <button 
                    onClick={() => { sound.playClick(); setDetailModalToken(null); setDetailSearch(""); }}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all transform hover:rotate-90 active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Search & Aggregations Bar */}
                <div className="px-6 lg:px-8 py-4 bg-zinc-900 border-b border-zinc-850 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder={detailModalToken === "contribution" ? "Pesquisar por produto/serviço..." : "Pesquisar por descrição ou categoria..."}
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-zinc-950 text-white rounded-xl border border-zinc-800 focus:border-orange-500/50 focus:ring-0 text-xs font-semibold placeholder-gray-500 font-sans outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end font-mono">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {detailModalToken === "contribution" ? "Margem de Contribuição Média:" : "Consolidado Listado:"}
                    </span>
                    <span className={cn(
                      "text-sm font-black px-3 py-1 rounded-lg border",
                      (detailModalToken === "contribution" ? avgProductMargin : totalSum) >= (detailModalToken === "contribution" ? 20 : 0)
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {detailModalToken === "contribution" ? "" : totalSum >= 0 ? "+" : ""}
                      {detailModalToken === "contribution" ? `${avgProductMargin.toFixed(1)}%` : formatCurrency(totalSum)}
                    </span>
                  </div>
                </div>

                {/* Transactions Table / List Container */}
                <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-4">
                  {filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gray-500">
                        <FileText size={28} />
                      </div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                        Nenhum registro encontrado
                      </p>
                      <p className="text-xs text-gray-500 font-medium font-sans">
                        Tente ajustar a sua busca.
                      </p>
                    </div>
                  ) : detailModalToken === "contribution" ? (
                    <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-950">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-zinc-900/50 border-b border-zinc-850 text-[9px] font-mono font-black uppercase text-gray-400 tracking-wider">
                              <th className="px-5 py-3 text-left">Produto / Serviço</th>
                              <th className="px-5 py-3 text-right">Preço de Custo</th>
                              <th className="px-5 py-3 text-right">Deduções (Impostos/Outros)</th>
                              <th className="px-5 py-3 text-right">Preço de Venda</th>
                              <th className="px-5 py-3 text-right">Margem Unitária</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900">
                            {filteredList.map((p: any) => {
                              const totalDeductionPct = p.taxRate + p.otherCostsPct;
                              return (
                                <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                                  <td className="px-5 py-3.5">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-white uppercase tracking-tight">
                                        {p.name}
                                      </span>
                                      {p.description && (
                                        <span className="text-[10px] text-gray-500 mt-0.5">
                                          {p.description}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-mono text-xs text-red-400">
                                    {formatCurrency(p.costPrice)}
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-mono text-xs text-amber-500">
                                    {totalDeductionPct.toFixed(1)}%
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-mono text-xs text-emerald-400 font-bold">
                                    {formatCurrency(p.sellingPrice)}
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-mono text-xs">
                                    <span className={cn(
                                      "font-black tracking-tight px-2.5 py-1 rounded text-[10.5px]",
                                      p.profitMarginPct >= 20 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    )}>
                                      {p.profitMarginPct.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-zinc-850 rounded-2xl overflow-hidden bg-zinc-950">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-zinc-900/50 border-b border-zinc-850 text-[9px] font-mono font-black uppercase text-gray-400 tracking-wider">
                              <th className="px-5 py-3 text-left">Data</th>
                              <th className="px-5 py-3 text-left">Descrição</th>
                              <th className="px-5 py-3 text-left">Categoria</th>
                              <th className="px-5 py-3 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900">
                            {filteredList.map((t) => {
                              const cat = categories.find(c => c.id === t.categoryId);
                              return (
                                <tr key={t.id} className="hover:bg-zinc-900/30 transition-colors">
                                  <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">
                                    {format(new Date(t.date), "dd/MM/yyyy")}
                                  </td>
                                  <td className="px-5 py-3.5 text-xs font-bold text-white uppercase tracking-tight">
                                    {t.description}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <span className="text-[10px] font-mono text-gray-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-sm inline-block">
                                      {cat?.name || "Geral"}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-right font-mono text-xs">
                                    <span className={cn(
                                      "font-black tracking-tight",
                                      t.type === "income" ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                      {t.type === "income" ? "+" : "-"} {formatCurrency(t.amount)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-zinc-950 border-t border-zinc-850 flex justify-between items-center text-[10px] font-mono text-gray-500">
                  <span>Listando {filteredList.length} de {listToShow.length} registros</span>
                  <button 
                    onClick={() => { sound.playClick(); setDetailModalToken(null); setDetailSearch(""); }}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-800 hover:border-zinc-700 transition-all font-mono animate-pulse"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}

        {showCorrelationModal && (() => {
          const p = products.find(prod => prod.id === correlationProductId) || products[0];
          
          if (!p) {
            return (
              <motion.div 
                key="correlation-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#0c0c0c]/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md"
              >
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-red-500 max-w-md w-full text-center space-y-4">
                  <AlertCircle className="mx-auto text-red-500" size={48} />
                  <h4 className="text-lg font-black uppercase text-red-955 tracking-tight">Sem produtos cadastrados</h4>
                  <p className="text-xs text-gray-500 font-medium font-sans">
                    Cadastre produtos e precifique na aba de precificação para liberar o algoritmo de simulação e correlação com o DRE.
                  </p>
                  <button 
                    onClick={() => { sound.playClick(); setShowCorrelationModal(false); }}
                    className="w-full bg-[#141414] hover:bg-orange-600 font-bold uppercase text-[10px] tracking-wider text-white py-3 rounded-xl transition-colors cursor-pointer font-sans"
                  >
                    Entendido
                  </button>
                </div>
              </motion.div>
            );
          }

          // Mathematical model
          const productSalesTransactions = transactions.filter(t => t.type === "income" && t.productId === p.id);
          const actualUnitsSold = productSalesTransactions.reduce((acc, t) => acc + (t.quantity || 1), 0);
          const actualRevenue = productSalesTransactions.reduce((acc, acc_t) => acc + acc_t.amount, 0);
          
          const actualProductProfit = productSalesTransactions.reduce((acc, t) => {
            const cost = t.productCostPrice || p.costPrice;
            const tax = t.amount * (p.taxRate / 100);
            const other = t.amount * (p.otherCostsPct / 100);
            return acc + (t.amount - cost - tax - other);
          }, 0);

          // Use selected price or default to loaded values
          const activeSimPrice = simPrice || p.sellingPrice;
          const activeSimVolume = simVolume !== undefined ? simVolume : (actualUnitsSold || 35);

          // Simulated metrics per unit
          const taxSimAmount = activeSimPrice * (p.taxRate / 100);
          const otherSimCostsAmount = activeSimPrice * (p.otherCostsPct / 100);
          const simulatedProfitValue = activeSimPrice - p.costPrice - taxSimAmount - otherSimCostsAmount;
          const simulatedMarginPct = activeSimPrice > 0 ? (simulatedProfitValue / activeSimPrice) * 100 : 0;

          // Simulated totals
          const simulatedRevenueTotal = activeSimVolume * activeSimPrice;
          const simulatedProfitTotal = activeSimVolume * simulatedProfitValue;

          // Consolidated DRE
          const baseRevenue = Math.max(0, totalIncome - actualRevenue);
          const baseNetProfit = balance - actualProductProfit;

          const simulatedConsolidatedRevenue = baseRevenue + simulatedRevenueTotal;
          const simulatedConsolidatedNetProfit = baseNetProfit + simulatedProfitTotal;

          const currentNetMargin = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
          const simulatedNetMargin = simulatedConsolidatedRevenue > 0 ? (simulatedConsolidatedNetProfit / simulatedConsolidatedRevenue) * 100 : 0;

          const marginDiff = simulatedNetMargin - currentNetMargin;

          // Share calculation
          const currentRevenueShare = totalIncome > 0 ? (actualRevenue / totalIncome) * 100 : 0;
          const currentProfitShare = balance > 0 ? (actualProductProfit / balance) * 100 : 0;

          return (
            <motion.div 
              key="correlation-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0c0c0c]/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-zinc-50 border-2 border-orange-500 rounded-[3rem] max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col my-8 relative text-left font-sans"
              >
                {/* Header Pitch Black */}
                <div className="bg-[#141414] text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-orange-500/20">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-orange-500 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-widest font-mono">
                      Algoritmo de Correlação Financeira
                    </span>
                    <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight flex items-center gap-2 mt-2">
                       Análise de Impacto Marginal no DRE
                    </h3>
                  </div>
                  <button 
                    onClick={() => { sound.playClick(); setShowCorrelationModal(false); }}
                    className="md:self-center px-4 py-2 bg-zinc-800 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-700 hover:border-orange-500 transition-all font-mono cursor-pointer"
                  >
                    Fechar Simulador
                  </button>
                </div>

                {/* Main panel container */}
                <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto max-h-[70vh]">
                  
                  {/* Select product section */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-150 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="w-full sm:w-auto">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1">
                          Selecionar Produto para Análise
                        </label>
                        <select
                          value={correlationProductId}
                          onChange={(e) => {
                            sound.playClick();
                            setCorrelationProductId(e.target.value);
                          }}
                          className="font-sans font-bold text-gray-800 text-sm bg-gray-100 px-4 py-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer min-w-[260px] w-full"
                        >
                          {products.map(prod => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} ({prod.sku || "Sem SKU"})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-[9px] uppercase font-black tracking-widest text-gray-400">Total Vendas Acumuladas</span>
                        <span className="text-base font-black text-gray-800 font-mono">
                          {actualUnitsSold} un. | {formatCurrency(actualRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Two Column Layout: Current Breakdown & Real-time Interactive Simulator */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Column 1: Info & Baseline (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6 animate-fade-in">
                      <div className="bg-white p-6 rounded-2xl border border-gray-150 space-y-4 h-full">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Estrutura Unitária de Custo</h4>
                        
                        <div className="space-y-3 font-sans">
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
                            <span className="text-gray-500">Preço de Custo (Insumo/CMV):</span>
                            <span className="font-bold text-gray-800 font-mono">{formatCurrency(p.costPrice)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
                            <span className="text-gray-500 font-medium">Impostos unitários ({p.taxRate}%):</span>
                            <span className="font-semibold text-gray-750 font-mono">
                              {formatCurrency(p.sellingPrice * (p.taxRate / 100))}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
                            <span className="text-gray-500 font-medium font-sans">Custos variáveis ({p.otherCostsPct}%):</span>
                            <span className="font-semibold text-gray-750 font-mono">
                              {formatCurrency(p.sellingPrice * (p.otherCostsPct / 100))}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs pt-2">
                            <span className="text-gray-950 font-extrabold font-sans">Lucro Líquido Unitário:</span>
                            <span className="font-black text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded">
                              {formatCurrency(p.profitValue)} ({p.profitMarginPct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* Direct Contribution status */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 mt-4 text-[11px] leading-relaxed text-gray-600 font-sans">
                          <h5 className="font-black text-[9px] uppercase tracking-wider text-orange-600 font-sans">Impacto Atual no Caixa</h5>
                          <p>
                            Atualmente, este produto representa <strong className="font-black text-gray-800 font-mono">{currentRevenueShare.toFixed(1)}%</strong> da receita bruta da sua empresa.
                          </p>
                          <p>
                            No DRE consolidado, a margem gerada por ele responde diretamente por <strong className="font-black text-gray-800 font-mono">{currentProfitShare.toFixed(1)}%</strong> do lucro operacional do período.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Sandbox Simulator (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-[#141414] text-white p-6 rounded-[2rem] border-2 border-orange-500 shadow-lg space-y-6 font-sans">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider font-sans">Painel de Simulação de Vendas PJ</h4>
                          <span className="text-[8px] bg-emerald-500 text-black py-0.5 px-2 rounded-full font-black uppercase tracking-widest animate-pulse font-mono">Ativo</span>
                        </div>

                        {/* Slider 1: Preço */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 font-sans">Simular Novo Preço de Venda:</span>
                            <span className="text-base font-black text-orange-400 font-mono">{formatCurrency(activeSimPrice)}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-gray-500 font-semibold">{formatCurrency(p.costPrice * 1.05)}</span>
                            <input 
                              type="range"
                              min={Math.ceil(p.costPrice * 1.05)}
                              max={Math.ceil(p.sellingPrice * 2.5)}
                              step="0.50"
                              value={activeSimPrice}
                              onChange={(e) => setSimPrice(parseFloat(e.target.value))}
                              className="flex-1 accent-orange-500 cursor-ew-resize bg-zinc-800 h-1.5 rounded-lg"
                            />
                            <span className="text-[10px] text-gray-500 font-semibold font-mono">{formatCurrency(p.sellingPrice * 2.5)}</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400 font-sans">
                            <span>Preço Praticado: {formatCurrency(p.sellingPrice)}</span>
                            <span>Simulado: lucro unitário {formatCurrency(simulatedProfitValue)} ({simulatedMarginPct.toFixed(1)}%)</span>
                          </div>
                        </div>

                        {/* Slider 2: Volume */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-transparent">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 font-sans">Simular Volume de Vendas (Mensal):</span>
                            <span className="text-base font-black text-emerald-400 font-mono">{activeSimVolume} un.</span>
                          </div>
                          <div className="flex items-center gap-4 bg-transparent">
                            <span className="text-[10px] text-gray-500 font-semibold font-sans">0 un.</span>
                            <input 
                              type="range"
                              min="0"
                              max="500"
                              step="5"
                              value={activeSimVolume}
                              onChange={(e) => setSimVolume(parseInt(e.target.value) || 0)}
                              className="flex-1 accent-emerald-500 cursor-ew-resize bg-zinc-800 h-1.5 rounded-lg"
                            />
                            <span className="text-[10px] text-gray-500 font-semibold font-sans">500 un.</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400 font-sans">
                            <span>Histórico Comercial: {actualUnitsSold} un.</span>
                            <span>Simulado: faturamento bruto +{formatCurrency(simulatedRevenueTotal)}</span>
                          </div>
                        </div>

                        {/* Cenários Rápidos para o Dia a Dia */}
                        <div className="pt-4 border-t border-white/10 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-sans">
                              📌 Cenários Pro de Decisão Diária
                            </span>
                            <span className="text-[8px] text-gray-400 italic">Interativos</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                sound.playClick();
                                setSimPrice(p.sellingPrice * 1.10);
                                setSimVolume(actualUnitsSold || 35);
                                showToast("Cenário inflacionário aplicado: +10% de markup de sobrevivência.", "info");
                              }}
                              className="bg-zinc-900 hover:bg-orange-600/30 text-left p-2.5 rounded-xl border border-zinc-800 hover:border-orange-500 transition-all cursor-pointer group"
                            >
                              <span className="block text-[9px] font-extrabold text-orange-400 group-hover:text-white uppercase">Ajuste Inflacionário</span>
                              <span className="text-[8.5px] text-zinc-400 group-hover:text-zinc-200">+10% no Preço de Venda</span>
                            </button>

                            <button
                              onClick={() => {
                                sound.playClick();
                                setSimPrice(p.sellingPrice * 0.85);
                                setSimVolume(Math.round((actualUnitsSold || 35) * 1.4));
                                showToast("Cenário promocional ativo: Giro acelerado com -15% preço e +40% volume.", "info");
                              }}
                              className="bg-zinc-900 hover:bg-emerald-600/30 text-left p-2.5 rounded-xl border border-zinc-800 hover:border-emerald-500 transition-all cursor-pointer group"
                            >
                              <span className="block text-[9px] font-extrabold text-emerald-400 group-hover:text-white uppercase">Promoção de Giro (-15%)</span>
                              <span className="text-[8.5px] text-zinc-400 group-hover:text-zinc-200">+40% Volume Compensatório</span>
                            </button>

                            <button
                              onClick={() => {
                                sound.playClick();
                                setSimPrice(p.sellingPrice * 1.20);
                                setSimVolume(Math.round((actualUnitsSold || 35) * 0.9));
                                showToast("Cenário de Valor de Marca: ticket elevado em +20% com retenção de 90%.", "info");
                              }}
                              className="bg-zinc-900 hover:bg-amber-600/30 text-left p-2.5 rounded-xl border border-zinc-800 hover:border-amber-500 transition-all cursor-pointer group"
                            >
                              <span className="block text-[9px] font-extrabold text-amber-400 group-hover:text-white uppercase">Gourmetização / Premium</span>
                              <span className="text-[8.5px] text-zinc-400 group-hover:text-zinc-200">+20% Preço | -10% Retração</span>
                            </button>

                            <button
                              onClick={() => {
                                sound.playClick();
                                setSimPrice(p.sellingPrice);
                                setSimVolume(actualUnitsSold || 35);
                                showToast("Simulação reiniciada para os valores praticados no seu banco.", "success");
                              }}
                              className="bg-zinc-800 hover:bg-white hover:text-black text-left p-2.5 rounded-xl border border-zinc-700 transition-all cursor-pointer flex flex-col justify-center"
                            >
                              <span className="block text-[9px] font-extrabold uppercase text-gray-300">Restaurar Padrão</span>
                              <span className="text-[8.5px] text-zinc-400">Valores Reais Consolidados</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Impact Summary Output (Current vs Simulated DRE) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Resultado Consolidado da Simulação no DRE</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Current DRE info */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-150 space-y-4 shadow-sm text-left">
                        <span className="text-[9px] bg-gray-100 text-gray-500 font-black px-2 py-0.5 rounded uppercase font-mono">DRE Real Atual</span>
                        
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center text-xs font-sans">
                            <span className="text-gray-500 font-medium">Receita Bruta Total:</span>
                            <span className="font-extrabold text-gray-800 font-mono">{formatCurrency(totalIncome)}</span>
                          </div>

                          <div className="flex justify-between items-center text-xs font-sans">
                            <span className="text-gray-500 font-medium">Resultado Líquido (EBITDA):</span>
                            <span className={cn("font-extrabold font-mono", balance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                              {formatCurrency(balance)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-sm font-sans pt-2 border-t border-gray-100">
                            <span className="text-gray-900 font-extrabold">Margem Operacional Líquida:</span>
                            <span className={cn("font-black font-mono px-2 py-0.5 rounded", currentNetMargin >= 15 ? "bg-emerald-50 text-emerald-700" : currentNetMargin >= 5 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                              {currentNetMargin.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Simulated DRE output */}
                      <div className="bg-white p-6 rounded-[2rem] border-2 border-orange-500 space-y-4 shadow-xl shadow-orange-500/5 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                        <span className="text-[9px] bg-orange-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">DRE Simulado Projetado</span>

                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center text-xs font-sans">
                            <span className="text-gray-500 font-medium">Nova Receita Bruta:</span>
                            <span className="font-extrabold text-gray-950 font-mono">{formatCurrency(simulatedConsolidatedRevenue)}</span>
                          </div>

                          <div className="flex justify-between items-center text-xs font-sans">
                            <span className="text-gray-500 font-medium">Novo Resultado Operacional:</span>
                            <span className={cn("font-extrabold font-mono", simulatedConsolidatedNetProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                              {formatCurrency(simulatedConsolidatedNetProfit)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-sm font-sans pt-2 border-t border-gray-100">
                            <span className="text-gray-950 font-extrabold font-sans font-sans">Nova Margem de Lucro:</span>
                            <div className="flex items-center gap-1.5 bg-transparent">
                              <span className={cn("font-black font-mono px-2 py-0.5 rounded", simulatedNetMargin >= 15 ? "bg-emerald-50 text-emerald-700" : simulatedNetMargin >= 5 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                                {simulatedNetMargin.toFixed(1)}%
                              </span>
                              
                              {marginDiff !== 0 && (
                                <span className={cn("text-[9px] font-black uppercase font-mono px-1.5 py-0.5 rounded-sm flex items-center shrink-0", marginDiff > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                  {marginDiff > 0 ? "▲" : "▼"} {Math.abs(marginDiff).toFixed(2)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Scientific interpretation box */}
                  <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-200/50 flex items-start gap-3 text-left font-sans">
                    <div className="space-y-1">
                      <span className="text-[9px] text-orange-950 font-extrabold uppercase tracking-widest leading-none block">Diagnóstico de Equilíbrio Marginal</span>
                      <p className="text-[11px] text-orange-900 leading-relaxed font-sans font-medium">
                        {marginDiff > 0 ? (
                          `O cenário simulado indica que elevar a performance comercial deste item aumentará a Margem Líquida Geral da empresa em +${marginDiff.toFixed(2)}% de rentabilidade operacional. Isso comprova que ele possui excelente tração marginal e markup compensador para otimizar o fluxo de caixa de forma sustentável.`
                        ) : marginDiff < 0 ? (
                          `Cuidado: A simulação indica uma diluição da margem líquida da empresa em ${marginDiff.toFixed(2)}%. Isso ocorre porque o CMV marginal é maior ou a margem unitária do produto é inferior à média consolidada do DRE atual. Recomenda-se reajustar o preço ou cortar custos fixos (OPEX) antes de acelerar em canais de mídia.`
                        ) : (
                          "O cenário simulado mantém a margem estável. Tente redefinir o preço de venda ou aumentar a quantidade de vendas projetada para verificar o ponto de equilíbrio."
                        )}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Footer and confirm button */}
                <div className="bg-zinc-100 p-6 border-t border-gray-150 flex justify-end gap-3 rounded-b-[2.5rem]">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowCorrelationModal(false);
                      showToast("Simulador de correlação concluído!", "info");
                    }}
                    className="px-6 py-2.5 bg-[#141414] hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Encerrar Simulação
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}

        {showProductTaxCompareModal && (() => {
          const p = products.find(prod => prod.id === taxCompareProductId) || products[0];

          if (!p) {
            return (
              <motion.div 
                key="tax-compare-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#0c0c0c]/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md"
              >
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-red-500 max-w-md w-full text-center space-y-4">
                  <AlertCircle className="mx-auto text-red-500" size={48} />
                  <h4 className="text-lg font-black uppercase text-red-955 tracking-tight">Sem produtos cadastrados</h4>
                  <p className="text-xs text-gray-500 font-medium font-sans">
                    Cadastre produtos e precifique na aba de precificação para liberar o comparativo de margem contra a tributação simplificada.
                  </p>
                  <button 
                    onClick={() => { sound.playClick(); setShowProductTaxCompareModal(false); }}
                    className="w-full bg-[#141414] hover:bg-orange-600 font-bold uppercase text-[10px] tracking-wider text-white py-3 rounded-xl transition-colors cursor-pointer font-sans"
                  >
                    Entendido
                  </button>
                </div>
              </motion.div>
            );
          }

          // Dynamic calculation variables based on slider overrides or default
          const activeSimPrice = taxCompareSimPrice || p.sellingPrice;
          const activeCustomTaxRate = taxCompareCustomTax !== 0 ? taxCompareCustomTax : p.taxRate;

          // Financial breakdowns
          const costAmount = p.costPrice;
          const taxAmount = activeSimPrice * (activeCustomTaxRate / 100);
          const otherAmount = activeSimPrice * (p.otherCostsPct / 100);
          const netProfit = activeSimPrice - costAmount - taxAmount - otherAmount;
          const netMarginPct = activeSimPrice > 0 ? (netProfit / activeSimPrice) * 100 : 0;

          // Normalized width percentages for the custom stacked design bar
          const totalBreakdown = costAmount + taxAmount + otherAmount + Math.max(0, netProfit);
          const cmvWidth = totalBreakdown > 0 ? (costAmount / totalBreakdown) * 100 : 0;
          const taxWidth = totalBreakdown > 0 ? (taxAmount / totalBreakdown) * 100 : 0;
          const otherWidth = totalBreakdown > 0 ? (otherAmount / totalBreakdown) * 100 : 0;
          const profitWidth = totalBreakdown > 0 ? (Math.max(0, netProfit) / totalBreakdown) * 100 : 0;

          // Classify aggressiveness/risk status of pricing
          let riskLevel: "critical" | "warning" | "safe" = "safe";
          let riskLabel = "";
          let riskDescription = "";

          if (netMarginPct <= 0) {
            riskLevel = "critical";
            riskLabel = "Alerta: Margem Negativa (Prejuízo Ocular)";
            riskDescription = "O preço de venda é inferior aos custos totais + impostos. Cada unidade vendida resulta em prejuízo operacional líquido imediato.";
          } else if (netMarginPct < activeCustomTaxRate) {
            riskLevel = "critical";
            riskLabel = "Altamente Agressiva (Imposto Devora o Lucro)";
            riskDescription = "Sua precificação atual é agressiva demais para a alíquota fiscal definida. A tributação simplificada devora a maior parte da sua margem. Você gera mais impostos para o governo do que retém em lucro líquido real por venda!";
          } else if (netMarginPct < activeCustomTaxRate * 1.8) {
            riskLevel = "warning";
            riskLabel = "Risco Moderado (Defesa Estreita)";
            riskDescription = "Sua precificação é viável mas oferece baixa margem de segurança. Eventuais descontos pontuais, taxas de maquininha ou variações de insumos podem rapidamente eliminar seu lucro real.";
          } else {
            riskLevel = "safe";
            riskLabel = "Seguro e Sustentável";
            riskDescription = "Excelente distribuição. Sua margem líquida líquida supera com folga a carga de impostos simplificada, assegurando proteção robusta para a sua saúde de fluxo de caixa.";
          }

          const handleSavePrice = async () => {
            try {
              sound.playClick();
              
              const updatedTaxVal = activeSimPrice * (p.taxRate / 100);
              const updatedOtherVal = activeSimPrice * (p.otherCostsPct / 100);
              const updatedProfitValue = activeSimPrice - p.costPrice - updatedTaxVal - updatedOtherVal;
              const updatedProfitMarginPct = activeSimPrice > 0 ? (updatedProfitValue / activeSimPrice) * 100 : 0;

              await updateProduct(p.id, {
                sellingPrice: Number(activeSimPrice.toFixed(2)),
                profitMarginPct: updatedProfitMarginPct,
                profitValue: updatedProfitValue,
                cmvPct: activeSimPrice > 0 ? (p.costPrice / activeSimPrice) * 100 : 100,
              });

              showToast(`Preço de "${p.name}" atualizado para ${formatCurrency(activeSimPrice)} com sucesso!`, "success");
              setShowProductTaxCompareModal(false);
            } catch (err) {
              showToast("Falha ao redefinir preço do produto.", "error");
            }
          };

          return (
            <motion.div
              key="product-tax-compare-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0c0c0c]/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                className="bg-white rounded-[2.5rem] border-2 border-slate-900 w-full max-w-4xl shadow-[0_24px_64px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden my-8 text-left"
              >
                {/* Header */}
                <div className="bg-[#141414] p-6 lg:p-8 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="space-y-1 z-10">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#f97316] text-[#0c0c0c] font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                        Auditoria de Precificação
                      </span>
                      <span className="bg-zinc-800 text-slate-350 font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                        Margem Líquida vs Tributação Simplificada
                      </span>
                    </div>
                    <h3 className="font-black text-2xl lg:text-3xl uppercase tracking-tight italic text-amber-50">
                      Termômetro de Risco Tributário
                    </h3>
                    <p className="text-xs text-gray-400 font-medium font-sans">
                      Compare a margem líquida do produto com a estimativa de tributação simplificada e verifique se o seu preço praticado está defendido ou exposto demais.
                    </p>
                  </div>
                  <button
                    onClick={() => { sound.playClick(); setShowProductTaxCompareModal(false); }}
                    className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer shrink-0 z-10"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 lg:p-8 overflow-y-auto space-y-6 max-h-[68vh] bg-slate-50/50">
                  
                  {/* Selector & Product info */}
                  <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 space-y-3">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#141414] font-sans">
                        Selecionar Produto para Auditoria
                      </label>
                      <select
                        value={taxCompareProductId}
                        onChange={(e) => {
                          sound.playClick();
                          setTaxCompareProductId(e.target.value);
                          const chosen = products.find(prod => prod.id === e.target.value);
                          if (chosen) {
                            setTaxCompareSimPrice(chosen.sellingPrice);
                            setTaxCompareCustomTax(chosen.taxRate);
                          }
                        }}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs py-3 px-4 rounded-2xl cursor-pointer outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name}
                          </option>
                        ))}
                      </select>
                      
                      <div className="p-3 bg-zinc-100 rounded-2xl space-y-2">
                        <p className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider">Metadados Originais</p>
                        <div className="text-[11px] text-zinc-700 font-medium space-y-1">
                          <div className="flex justify-between">
                            <span>Preço Praticado:</span>
                            <span className="font-bold">{formatCurrency(p.sellingPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>M. Líquida Original:</span>
                            <span className="font-bold">{p.profitMarginPct.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Custo Direto:</span>
                            <span className="font-bold">{formatCurrency(p.costPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Alíquota do Imposto:</span>
                            <span className="font-bold">{p.taxRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Sliders */}
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Price slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#141414] font-sans">
                            Preço de Venda Simulado
                          </span>
                          <span className="text-sm font-mono font-black text-orange-600 bg-orange-100/60 px-3 py-1 rounded-xl">
                            {formatCurrency(activeSimPrice)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={p.costPrice > 0 ? Math.round(p.costPrice * 0.4 * 10) / 10 : 1}
                          max={p.costPrice > 0 ? Math.round(p.costPrice * 4.5 * 10) / 10 : 250}
                          step="0.50"
                          value={activeSimPrice}
                          onChange={(e) => setTaxCompareSimPrice(Number(e.target.value))}
                          className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8.5px] font-mono text-gray-400">
                          <span>Est. Custo: {formatCurrency(p.costPrice)}</span>
                          <span>Markup 50%</span>
                          <span>Recom. {formatCurrency(p.costPrice * 2.2)}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-normal font-sans pt-1">
                          Arraste para calcular instantaneamente como um aumento ou desconto afeta sua resistência tributária.
                        </p>
                      </div>

                      {/* Tax slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#141414] font-sans">
                            Alíquota Fiscal Praticada
                          </span>
                          <span className="text-sm font-mono font-black text-rose-600 bg-rose-100/60 px-3 py-1 rounded-xl">
                            {activeCustomTaxRate.toFixed(1)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="35"
                          step="0.5"
                          value={activeCustomTaxRate}
                          onChange={(e) => setTaxCompareCustomTax(Number(e.target.value))}
                          className="w-full accent-rose-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8.5px] font-mono text-gray-400">
                          <span>Anexo I (Comércio): ~4%</span>
                          <span>Anexo III (Serviço): ~6%</span>
                          <span>Anexo V (Tecnologia): ~15.5%</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-normal font-sans pt-1">
                          Simule mudanças na carga do Simples Nacional ou impostos indiretos se você migrar de regime tributário ou volume.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Comparisons meters */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Visual Gauges */}
                    <div className="md:col-span-5 bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-900 border-b border-slate-100 pb-2">
                        Comparativo Direto
                      </span>
                      
                      <div className="space-y-4 py-2">
                        {/* Margem Liquida gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold font-sans">
                            <span className="text-slate-600">Margem Líquida Real do Produto:</span>
                            <span className={cn("font-bold font-mono", netMarginPct <= 0 ? "text-red-600" : netMarginPct < activeCustomTaxRate ? "text-red-500" : "text-emerald-600")}>
                              {netMarginPct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                            <div 
                              className={cn("h-full transition-all duration-350", 
                                netMarginPct <= 0 ? "bg-red-550" : netMarginPct < activeCustomTaxRate ? "bg-red-400" : "bg-emerald-500"
                              )}
                              style={{ width: `${Math.min(100, Math.max(0, netMarginPct))}%` }}
                            />
                          </div>
                        </div>

                        {/* Tributacao gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold font-sans">
                            <span className="text-slate-600">Encargo Tributário Simplificado:</span>
                            <span className="font-bold font-mono text-rose-500">{activeCustomTaxRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                            <div 
                              className="h-full bg-rose-500/80 transition-all duration-350"
                              style={{ width: `${Math.min(100, Math.max(0, activeCustomTaxRate))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-zinc-100 rounded-2xl flex items-center gap-3">
                        <Coins size={16} className="text-amber-500 shrink-0" />
                        <span className="text-[10px] text-zinc-600 font-bold leading-normal">
                          Para cada R$100 de venda simulada, <span className="font-mono text-rose-600 font-black">R$ {activeCustomTaxRate.toFixed(2)}</span> são impostos simplificados e <span className="font-mono text-emerald-600 font-black">R$ {Math.max(0, netProfit > 0 ? netMarginPct : 0).toFixed(2)}</span> representam o seu lucro líquido real de bolso.
                        </span>
                      </div>

                    </div>

                    {/* Breakdown & Stacked Price Bar & Diagnosis */}
                    <div className="md:col-span-7 bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                      <div className="space-y-1 text-left">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-[#141414]">
                          Anatomia da Precificação (Percentual Fracionado)
                        </span>
                        <p className="text-[10px] text-gray-500 font-medium">Observe graficamente em qual fatia do preço ocorre a maior evasão de recursos.</p>
                      </div>

                      {/* Stacked segment chart */}
                      <div className="my-4">
                        <div className="w-full h-8 rounded-2xl overflow-hidden flex border border-gray-200 shadow-inner">
                          {cmvWidth > 0 && (
                            <div 
                              className="bg-zinc-800 h-full flex items-center justify-center text-white text-[8px] font-black tracking-widest transition-all duration-300" 
                              style={{ width: `${cmvWidth}%` }}
                              title={`CMV (Custo Direto): ${formatCurrency(costAmount)} (${cmvWidth.toFixed(1)}%)`}
                            >
                              {cmvWidth > 12 ? "CMV" : ""}
                            </div>
                          )}
                          {taxWidth > 0 && (
                            <div 
                              className="bg-rose-500 h-full flex items-center justify-center text-white text-[8px] font-black tracking-widest transition-all duration-300" 
                              style={{ width: `${taxWidth}%` }}
                              title={`Impostos: ${formatCurrency(taxAmount)} (${taxWidth.toFixed(1)}%)`}
                            >
                              {taxWidth > 12 ? "IMP" : ""}
                            </div>
                          )}
                          {otherWidth > 0 && (
                            <div 
                              className="bg-amber-400 h-full flex items-center justify-center text-slate-900 text-[8px] font-black tracking-widest transition-all duration-300" 
                              style={{ width: `${otherWidth}%` }}
                              title={`Outros Variáveis: ${formatCurrency(otherAmount)} (${otherWidth.toFixed(1)}%)`}
                            >
                              {otherWidth > 12 ? "OUTR" : ""}
                            </div>
                          )}
                          {profitWidth > 0 && (
                            <div 
                              className="bg-emerald-500 h-full flex items-center justify-center text-white text-[8px] font-black tracking-widest transition-all duration-300" 
                              style={{ width: `${profitWidth}%` }}
                              title={`Lucro Líquido: ${formatCurrency(netProfit)} (${profitWidth.toFixed(1)}%)`}
                            >
                              {profitWidth > 12 ? "LUCRO" : ""}
                            </div>
                          )}
                        </div>

                        {/* Legends for segments */}
                        <div className="grid grid-cols-4 gap-2 mt-2 pt-1">
                          <div className="text-[9px] text-[#141414] font-sans font-bold flex flex-col items-start border-l-2 border-zinc-900 pl-1.5">
                            <span className="text-gray-450 font-normal block">CMV (Custo)</span>
                            <span className="font-semibold text-gray-800 truncate">{formatCurrency(costAmount)}</span>
                          </div>
                          <div className="text-[9px] text-rose-600 font-sans font-bold flex flex-col items-start border-l-2 border-rose-500 pl-1.5">
                            <span className="text-rose-455 font-normal block">Imposto Est.</span>
                            <span className="font-semibold truncate">{formatCurrency(taxAmount)}</span>
                          </div>
                          <div className="text-[9px] text-amber-600 font-sans font-bold flex flex-col items-start border-l-2 border-amber-400 pl-1.5">
                            <span className="text-amber-500 font-normal block">Desp. Var.</span>
                            <span className="font-semibold truncate">{formatCurrency(otherAmount)}</span>
                          </div>
                          <div className="text-[9px] text-emerald-600 font-sans font-bold flex flex-col items-start border-l-2 border-emerald-500 pl-1.5">
                            <span className="text-emerald-500 font-normal block">Lucro Líquido</span>
                            <span className={`font-semibold truncate ${netProfit < 0 ? "text-red-500 font-black animate-pulse" : ""}`}>
                              {formatCurrency(netProfit)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnosis dynamic alert */}
                      <div className={cn("p-4.5 rounded-2xl border flex flex-col gap-2 relative overflow-hidden transition-all duration-300 text-left", 
                        riskLevel === "critical" ? "bg-rose-50/60 border-rose-200" :
                        riskLevel === "warning" ? "bg-amber-50/60 border-amber-200" : "bg-emerald-50/60 border-emerald-200"
                      )}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2.5 h-2.5 rounded-full animate-bounce shrink-0", 
                            riskLevel === "critical" ? "bg-red-500" : riskLevel === "warning" ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                          <span className={cn("text-[10px] font-black uppercase tracking-wider block font-sans", 
                            riskLevel === "critical" ? "text-red-700" : riskLevel === "warning" ? "text-amber-700" : "text-emerald-700"
                          )}>
                            {riskLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-700 leading-relaxed font-sans font-semibold">
                          {riskDescription}
                        </p>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Footer and dynamic save/apply buttons */}
                <div className="bg-zinc-100 p-6 border-t border-gray-150 flex justify-between items-center rounded-b-[2.5rem] shrink-0">
                  <div className="text-left font-sans text-[10px] text-zinc-500 max-w-[40%]">
                    *A auditoria calcula a margem líquida retirando impostos proporcionais ao faturamento e despesas operacionais da venda direta.
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setShowProductTaxCompareModal(false);
                      }}
                      className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePrice}
                      disabled={activeSimPrice === p.sellingPrice}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95",
                        activeSimPrice === p.sellingPrice 
                          ? "bg-slate-200 text-slate-400 border border-slate-300 pointer-events-none shadow-none" 
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      )}
                    >
                      <Check size={12} /> Salvar Nova Precificação Praticada
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}

        {showTaxModal && (() => {
          const rev = taxCustomRevenue || 85000;
          const currentTax = rev * (taxCustomCurrentRate / 100);
          const currentTaxInput = currentTax;

          // Get calculated Simples Nacional based on Brackets and Fator R
          const calculateSimplesNacional = (type: "service" | "commerce", monthlyRev: number, annualRev: number, hasFatorR: boolean) => {
            let anexo: 1 | 3 | 5 = 1;
            if (type === "commerce") {
              anexo = 1;
            } else {
              anexo = hasFatorR ? 3 : 5;
            }

            let nominalRate = 0;
            let deduction = 0;
            let bracketName = "";

            if (anexo === 1) { // Comércio Anexo I
              if (annualRev <= 180000) { nominalRate = 0.04; deduction = 0; bracketName = "Faixa 1 (até R$ 180k)"; }
              else if (annualRev <= 360000) { nominalRate = 0.073; deduction = 5940; bracketName = "Faixa 2 (R$ 180k a R$ 360k)"; }
              else if (annualRev <= 720000) { nominalRate = 0.095; deduction = 13860; bracketName = "Faixa 3 (R$ 360k a R$ 720k)"; }
              else if (annualRev <= 1800000) { nominalRate = 0.107; deduction = 22500; bracketName = "Faixa 4 (R$ 720k a R$ 1,8M)"; }
              else if (annualRev <= 3600000) { nominalRate = 0.143; deduction = 87300; bracketName = "Faixa 5 (R$ 1,8M a R$ 3,6M)"; }
              else { nominalRate = 0.19; deduction = 378000; bracketName = "Faixa 6 (R$ 3,6M a R$ 4,8M)"; }
            } else if (anexo === 3) { // Serviços Anexo III
              if (annualRev <= 180000) { nominalRate = 0.06; deduction = 0; bracketName = "Faixa 1 (até R$ 180k)"; }
              else if (annualRev <= 360000) { nominalRate = 0.112; deduction = 9360; bracketName = "Faixa 2 (R$ 180k a R$ 360k)"; }
              else if (annualRev <= 720000) { nominalRate = 0.135; deduction = 17640; bracketName = "Faixa 3 (R$ 360k a R$ 720k)"; }
              else if (annualRev <= 1800000) { nominalRate = 0.16; deduction = 35640; bracketName = "Faixa 4 (R$ 720k a R$ 1,8M)"; }
              else if (annualRev <= 3600000) { nominalRate = 0.21; deduction = 125640; bracketName = "Faixa 5 (R$ 1,8M a R$ 3,6M)"; }
              else { nominalRate = 0.33; deduction = 648000; bracketName = "Faixa 6 (R$ 3,6M a R$ 4,8M)"; }
            } else { // Serviços Anexo V (sem Fator R)
              if (annualRev <= 180000) { nominalRate = 0.155; deduction = 0; bracketName = "Faixa 1 (até R$ 180k)"; }
              else if (annualRev <= 360000) { nominalRate = 0.18; deduction = 4500; bracketName = "Faixa 2 (R$ 180k a R$ 360k)"; }
              else if (annualRev <= 720000) { nominalRate = 0.195; deduction = 9900; bracketName = "Faixa 3 (R$ 360k a R$ 720k)"; }
              else if (annualRev <= 1800000) { nominalRate = 0.205; deduction = 17100; bracketName = "Faixa 4 (R$ 720k a R$ 1,8M)"; }
              else if (annualRev <= 3600000) { nominalRate = 0.23; deduction = 62100; bracketName = "Faixa 5 (R$ 1,8M a R$ 3,6M)"; }
              else { nominalRate = 0.305; deduction = 540000; bracketName = "Faixa 6 (R$ 3,6M a R$ 4,8M)"; }
            }

            let effectiveRate = annualRev > 0 ? ((annualRev * nominalRate) - deduction) / annualRev : nominalRate;
            if (effectiveRate < 0.04) {
              effectiveRate = anexo === 1 ? 0.04 : 0.06;
            }

            return {
              anexo,
              effectiveRate,
              nominalRate,
              deduction,
              bracketName,
              monthlyTax: monthlyRev * effectiveRate
            };
          };

          // Fator R Calculations
          const factorR_Ratio = rev > 0 ? (taxPayroll / rev) * 100 : 0;
          const hasFatorR = factorR_Ratio >= 28;
          const simplesCalculated = calculateSimplesNacional(taxBusinessActivity, rev, taxAnnualRevenue || rev * 12, hasFatorR);

          const simplesTaxAmount = simplesCalculated.monthlyTax;
          const simplesEffectiveRate = simplesCalculated.effectiveRate;

          // Lucro Presumido Calculations
          const presMargin = taxBusinessActivity === "service" ? 0.32 : 0.08;
          const presProfitBasis = rev * presMargin;
          const ircsTax = presProfitBasis * 0.24; // IRPJ 15% + CSLL 9% = 24% of the presumptive margin
          const pisCofinsTax = rev * 0.0365; // Social cumulative taxes (PIS 0.65% + COFINS 3.0%)
          const localTax = rev * (taxCustomISSorICMS / 100);
          const totalPresumedTax = ircsTax + pisCofinsTax + localTax;
          const presumedEffectiveRate = totalPresumedTax / rev;

          // Lucro Real Calculations (Based on custom profitability margin)
          const actualProfitBasis = rev * (taxProfitMargin / 100);
          const federalTaxLR = Math.max(0, actualProfitBasis * 0.24); // 24% effective Federal taxes on real profits
          const pisCofinsLR = rev * 0.0465; // average non-cumulative effective rate
          const localTaxLR = rev * (taxCustomISSorICMS / 100);
          const totalLucroRealTax = federalTaxLR + pisCofinsLR + localTaxLR;
          const lrEffectiveRate = totalLucroRealTax / rev;

          const taxDifference = currentTaxInput - totalPresumedTax;
          const percentageSaved = rev > 0 ? (taxDifference / rev) * 100 : 0;
          const isPresumedMoreAdvantageous = taxDifference > 0;

          // Determine the most optimal tax layout
          const regimes = [
            { id: "simples", name: "Simples Nacional", value: simplesTaxAmount, rate: simplesEffectiveRate, color: "text-[#f97316]", tag: "Regime Unificado" },
            { id: "presumido", name: "Lucro Presumido", value: totalPresumedTax, rate: presumedEffectiveRate, color: "text-emerald-600", tag: "Margem Estipulada" },
            { id: "real", name: "Lucro Real", value: totalLucroRealTax, rate: lrEffectiveRate, color: "text-indigo-600", tag: "Lucro Liquido PJ" }
          ];

          const sortedRegimes = [...regimes].sort((a, b) => a.value - b.value);
          const bestRegime = sortedRegimes[0];
          const worstRegime = sortedRegimes[2];
          const averageSavedMonth = parseFloat((worstRegime.value - bestRegime.value).toFixed(2));
          const annualizedSavings = averageSavedMonth * 12;

          return (
            <motion.div
              key="tax-simulation-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0c0c0c]/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                className="bg-white rounded-[2.5rem] border-2 border-slate-900 w-full max-w-5xl shadow-[0_24px_64px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden my-8 text-left"
              >
                {/* Header */}
                <div className="bg-[#141414] p-6 lg:p-8 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="space-y-1 z-10">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-black font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                        Planejamento Tributário Inteligente 
                      </span>
                      <span className="bg-zinc-800 text-slate-300 font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                        Simples vs Presumido vs Real
                      </span>
                    </div>
                    <h3 className="font-black text-2xl lg:text-3xl uppercase tracking-tight italic text-amber-50">
                      CoPiloto de Planejamento Fiscal
                    </h3>
                    <p className="text-xs text-gray-400 font-medium font-sans">
                      Audite e projete a menor alíquota brasileira para sua empresa, comparando os regimes tributários com simulação avançada de Fator R e margens de lucro reais.
                    </p>
                  </div>
                  <button
                    onClick={() => { sound.playClick(); setShowTaxModal(false); }}
                    className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer shrink-0 z-10 animate-pulse"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 lg:p-8 overflow-y-auto space-y-6 max-h-[72vh] bg-slate-50/50">
                  
                  {/* Selector & Setup Controls */}
                  <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Activity Selector */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-950 font-sans">
                          1. Segmento de Atuação
                        </label>
                        <div className="flex flex-col gap-2 font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setTaxBusinessActivity("service");
                              setTaxCustomISSorICMS(3.0); // Municipal ISS average
                            }}
                            className={cn(
                              "py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider text-left transition-all border cursor-pointer flex justify-between items-center",
                              taxBusinessActivity === "service"
                                ? "bg-emerald-55 border-emerald-500 text-emerald-700 shadow-sm ring-2 ring-emerald-500/10 font-bold"
                                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                            )}
                          >
                            <span>💼 Prestação de Serviços</span>
                            <span className="text-[9px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">Serviços</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setTaxBusinessActivity("commerce");
                              setTaxCustomISSorICMS(12.0); // State ICMS average effective with credits
                            }}
                            className={cn(
                              "py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider text-left transition-all border cursor-pointer flex justify-between items-center",
                              taxBusinessActivity === "commerce"
                                ? "bg-emerald-55 border-emerald-500 text-emerald-700 shadow-sm ring-2 ring-emerald-500/10 font-bold"
                                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                            )}
                          >
                            <span>🛒 Comércio / Indústria</span>
                            <span className="text-[9px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">Vendas</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-[10px] text-zinc-500 leading-relaxed font-sans font-semibold">
                        <span className="font-bold text-gray-950 block mb-1">Impacto da Atividade:</span>
                        O enquadramento impacta a presunção legal de lucro no Lucro Presumido (32% serviços vs 8% comércio) e os anexos tributáveis progressivos do Simples Nacional.
                      </div>
                    </div>

                    {/* Interactive Setup Sliders Column */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                      
                      {/* Revenue Slider */}
                      <div className="space-y-2 text-left animate-none">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#141414] font-sans">
                            Faturamento Mensal Estimado
                          </span>
                          <span className="text-xs font-mono font-black text-emerald-600">
                            {formatCurrency(rev)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="800000"
                          step="5000"
                          value={rev}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTaxCustomRevenue(val);
                            setTaxAnnualRevenue(val * 12);
                          }}
                          className="w-full accent-emerald-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-gray-400">
                          <span>R$ 10k</span>
                          <span>R$ 400k</span>
                          <span>R$ 800k/mês</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            const val = totalIncome > 0 ? totalIncome : 85000;
                            setTaxCustomRevenue(val);
                            setTaxAnnualRevenue(val * 12);
                          }}
                          className="text-[9px] font-black uppercase text-orange-650 hover:text-orange-700 underline tracking-wider cursor-pointer mt-1"
                        >
                          Usar faturamento real do DRE ({formatCurrency(totalIncome > 0 ? totalIncome : 0)})
                        </button>
                      </div>

                      {/* Cumulative LTM Revenue Slider */}
                      <div className="space-y-2 text-left animate-none">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#141414] font-sans">
                            Faturamento Anual Acumulado (últimos 12m)
                          </span>
                          <span className="text-xs font-mono font-black text-[#f97316]">
                            {formatCurrency(taxAnnualRevenue || rev * 12)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="120000"
                          max="4800000"
                          step="20000"
                          value={taxAnnualRevenue || rev * 12}
                          onChange={(e) => setTaxAnnualRevenue(Number(e.target.value))}
                          className="w-full accent-[#f97316] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-gray-400">
                          <span>R$ 120k</span>
                          <span>R$ 2.4M</span>
                          <span>R$ 4.8M (Gargalo Simples)</span>
                        </div>
                        <p className="text-[8.5px] text-gray-450 italic mt-1 leading-none font-sans">
                          * Define a faixa e alíquota progressiva no Simples Nacional.
                        </p>
                      </div>

                      {/* CONDITIONAL CONTROLS: FOR SERVICES (FATOR R SIMULATION) */}
                      {taxBusinessActivity === "service" ? (
                        <div className="space-y-2 text-left bg-orange-50/40 p-4 border border-orange-200/50 rounded-2xl block animate-none">
                          <div className="flex justify-between items-center font-sans font-semibold">
                            <span className="text-[9.5px] font-black uppercase tracking-widest text-[#141414] flex items-center gap-1">
                              Folha de Pagamento + Pró-Labore
                            </span>
                            <span className={cn("text-xs font-mono font-black", hasFatorR ? "text-emerald-600" : "text-amber-600")}>
                              {formatCurrency(taxPayroll)} ({factorR_Ratio.toFixed(1)}%)
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={rev}
                            step="500"
                            value={taxPayroll}
                            onChange={(e) => setTaxPayroll(Number(e.target.value))}
                            className="w-full accent-[#f97316] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer animate-none"
                          />
                          <div className="flex justify-between text-[8px] font-mono text-gray-450">
                            <span>R$ 0</span>
                            <span className={cn("font-bold", hasFatorR ? "text-emerald-500 font-extrabold" : "text-red-400")}>
                              Fator R Regra (28%): {formatCurrency(rev * 0.28)}
                            </span>
                            <span>Max (R$ {rev})</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-left bg-slate-50 p-4 border border-slate-150 rounded-2xl block animate-none">
                          <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-500 font-sans block">
                            Atividade Comercial: Isenta de Fator R
                          </span>
                          <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                            Empresas comerciais seguem o **Anexo I** do Simples Nacional que tributa a partir de 4% iniciais sobre o faturamento direto, sem variação de folha de pagamento.
                          </p>
                        </div>
                      )}

                      {/* Profit Margin slider for Lucro Real comparison */}
                      <div className="space-y-2 text-left bg-indigo-50/20 p-4 border border-indigo-200/20 rounded-2xl block animate-none">
                        <div className="flex justify-between items-center">
                          <span className="text-[9.5px] font-black uppercase tracking-widest text-[#141414] font-sans">
                            Margem de Lucro PJ Real Estimada
                          </span>
                          <span className="text-xs font-mono font-black text-indigo-700 font-bold">
                            {taxProfitMargin}% ({formatCurrency(rev * (taxProfitMargin / 100))}/mês)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="50"
                          step="1"
                          value={taxProfitMargin}
                          onChange={(e) => setTaxProfitMargin(Number(e.target.value))}
                          className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-gray-400">
                          <span>2%</span>
                          <span>15%</span>
                          <span>50%</span>
                        </div>
                      </div>

                      {/* Slider ISS/ICMS rate */}
                      <div className="md:col-span-2 space-y-2 text-left bg-zinc-50 p-4 border border-zinc-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 block animate-none animate-none">
                        <div className="space-y-1 md:w-1/2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-650 block leading-tight font-sans">
                            {taxBusinessActivity === "service" ? "Alíquota ISS Municipal" : "Alíquota ICMS Efetiva PJ"}
                          </span>
                          <p className="text-[9px] text-zinc-400 leading-tight block">
                            * Praticado localmente na sua praça (ISS de 2% a 5%, ICMS efetivo varia com créditos e despesas fiscais).
                          </p>
                        </div>
                        <div className="md:w-1/2 flex items-center gap-4">
                          <input
                            type="range"
                            min={taxBusinessActivity === "service" ? "2" : "1"}
                            max={taxBusinessActivity === "service" ? "5" : "18"}
                            step="0.1"
                            value={taxCustomISSorICMS}
                            onChange={(e) => setTaxCustomISSorICMS(Number(e.target.value))}
                            className="w-full accent-gray-700 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="font-mono text-sm font-black text-gray-800 min-w-[45px] text-right font-bold">
                            {taxCustomISSorICMS.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Diagnostic Banner */}
                  <div className={cn(
                    "rounded-3xl p-6 border-2 flex flex-col md:flex-row md:items-center justify-between gap-5 text-left relative overflow-hidden",
                    isPresumedMoreAdvantageous
                      ? "bg-emerald-50/80 border-emerald-500/50 shadow-[0_4px_24px_rgba(16,185,129,0.08)]"
                      : "bg-amber-50/80 border-amber-300/60"
                  )}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-2 max-w-xl z-10">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 leading-none",
                          isPresumedMoreAdvantageous ? "bg-emerald-500 text-black animate-pulse" : "bg-amber-500 text-black"
                        )}>
                          {isPresumedMoreAdvantageous ? "✔ Recomendação de Migração" : "ℹ Manter Regime Simples"}
                        </span>
                        <span className="text-zinc-500 font-bold text-[9px] uppercase tracking-widest">
                          Auditoria de Alavancagem Fiscal
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-[#141414] text-lg uppercase tracking-tight italic font-sans">
                        {isPresumedMoreAdvantageous 
                          ? `O Lucro Presumido reduzirá seus impostos em ${formatCurrency(taxDifference)}/mês!`
                          : "O Simples Nacional ainda é mais vantajoso no seu faturamento!"
                        }
                      </h4>
                      
                      <p className="text-xs text-slate-800 leading-relaxed font-sans font-semibold">
                        {isPresumedMoreAdvantageous 
                          ? `Excelente oportunidade! No faturamento mensal de ${formatCurrency(rev)}, o Lucro Presumido gera imposto consolidado de ${formatCurrency(totalPresumedTax)} (alíquota média de ${(totalPresumedTax / rev * 100).toFixed(2)}%) contra ${formatCurrency(currentTax)} do regime atual. Isso gera uma economia limpa anualizada projetada de R$ ${(taxDifference * 12).toLocaleString("pt-BR")}.`
                          : `Mantenha seu regime! A alíquota do Lucro Presumido somaria ${(totalPresumedTax / rev * 100).toFixed(2)}% (${formatCurrency(totalPresumedTax)}/mês) enquanto seu custo tributário atual de ${taxCustomCurrentRate.toFixed(2)}% representa ${formatCurrency(currentTax)}/mês. Migrar para o Lucro Presumido aumentaria sua carga de impostos em R$ ${Math.abs(taxDifference).toLocaleString("pt-BR")} por mês.`
                        }
                      </p>
                    </div>

                    <div className="flex flex-col items-center sm:items-start justify-center p-4 bg-white/95 rounded-2xl border border-gray-150 shadow-md shrink-0 z-10 min-w-[200px] text-center sm:text-left">
                      <span className="text-[8.5px] uppercase tracking-widest font-black text-gray-500 block">Diferença de Margem Fiscal</span>
                      <span className={cn(
                        "text-2xl font-black font-sans tracking-tight",
                        isPresumedMoreAdvantageous ? "text-emerald-600" : "text-amber-500"
                      )}>
                        {isPresumedMoreAdvantageous ? `+${percentageSaved.toFixed(2)}%` : `${percentageSaved.toFixed(2)}%`}
                      </span>
                      <span className="text-[10px] text-gray-700 italic block mt-1">
                        {isPresumedMoreAdvantageous ? "Economia líquida gerada" : "Custo extra na transição"}
                      </span>
                    </div>
                  </div>

                  {/* Side-by-Side Detail Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Current tax detail */}
                    <div className="bg-white border border-gray-205 rounded-3xl p-6 space-y-4 text-left">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-[11px] font-black uppercase text-rose-550 font-sans">Regime Atual (baseline)</span>
                        <span className="text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded-full">
                          {taxCustomCurrentRate.toFixed(2)}% Efetivo
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-500 font-semibold">Faturamento Bruto</span>
                          <span className="text-sm font-mono font-bold text-gray-950">{formatCurrency(rev)}</span>
                        </div>
                        
                        <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-gray-150">
                          <span className="text-xs text-gray-500 font-semibold">Imposto Mensal Consolidado</span>
                          <span className="text-lg font-mono font-black text-rose-500">{formatCurrency(currentTax)}</span>
                        </div>
                        
                        <div className="p-3 bg-red-50/40 rounded-2xl border border-red-100/60 text-[10px] text-red-900 leading-relaxed font-semibold">
                          Tributação unificada. Geralmente segue a tabela progressiva conforme o faturamento anual acumulado dos últimos 12 meses.
                        </div>
                      </div>
                    </div>

                    {/* Presumed tax detail */}
                    <div className="bg-white border border-slate-900 rounded-3xl p-6 space-y-4 text-left shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full pointer-events-none blur-xl" />
                      
                      <div className="flex justify-between items-center pb-2 border-b border-gray-105 z-10 relative">
                        <span className="text-[11px] font-black uppercase text-emerald-600 font-sans">Lucro Presumido Otimizado</span>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full">
                          {(totalPresumedTax / rev * 100).toFixed(2)}% Efetivo
                        </span>
                      </div>

                      <div className="space-y-3.5 z-10 relative">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-500 font-semibold">Margem de Lucro Presumida por Lei</span>
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {(presMargin * 100).toFixed(0)}% ({formatCurrency(presProfitBasis)})
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline border-t border-gray-100 pt-2 text-[11px]">
                          <span className="text-gray-500 font-medium">IRPJ + CSLL (24% da presunção)</span>
                          <span className="font-mono text-zinc-950">{formatCurrency(ircsTax)}</span>
                        </div>

                        <div className="flex justify-between items-baseline border-t border-gray-100 pt-2 text-[11px]">
                          <span className="text-gray-500 font-medium">PIS + COFINS (3.65% cumulativo)</span>
                          <span className="font-mono text-zinc-950">{formatCurrency(pisCofinsTax)}</span>
                        </div>

                        <div className="flex justify-between items-baseline border-t border-gray-100 pt-2 text-[11px]">
                          <span className="text-gray-500 font-medium">
                            {taxBusinessActivity === "service" ? "ISS Municipal" : "ICMS Efetivo Consolidado"}
                          </span>
                          <span className="font-mono text-zinc-950">{formatCurrency(localTax)}</span>
                        </div>

                        <div className="flex justify-between items-baseline pt-4 border-t-2 border-dashed border-gray-200">
                          <span className="text-xs text-[#141414] font-bold">Imposto Mensal Consolidado</span>
                          <span className="text-lg font-mono font-black text-emerald-600">{formatCurrency(totalPresumedTax)}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Footer and confirm button */}
                <div className="bg-zinc-50 p-6 border-t border-gray-200 flex justify-between items-center rounded-b-[2.5rem] shrink-0 font-sans text-xs">
                  <div className="flex items-center gap-2 text-gray-500 font-semibold font-mono text-[9.5px]">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Dafne Fiscal v4.12 Neural Coprocessor</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setTaxBusinessActivity(taxBusinessActivity === "service" ? "commerce" : "service");
                        setTaxCustomISSorICMS(taxBusinessActivity === "service" ? 12 : 3);
                        showToast(`Roteado para ${taxBusinessActivity === "service" ? "Comércio" : "Prestação de Serviços"}!`, "info");
                      }}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer font-bold"
                    >
                      Alterar Atividade
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setShowTaxModal(false);
                        showToast("Simulação encerrada com sucesso!", "success");
                      }}
                      className="px-6 py-2.5 bg-[#141414] hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer font-bold shadow-md hover:shadow-lg"
                    >
                      Concluído
                    </button>
                  </div>
                </div>

              </motion.div>
            </motion.div>
          );
        })()}

        {showRepricerModal && (() => {
          const validMarkupProdList = (products || []).filter(p => p.costPrice > 0);
          
          // 2. Valores reais operacionais extraídos do fechamento do DRE
          const findDREValue = (lbl: string) =>
            Math.abs(getDRE(new Date()).find((line) => line?.label === lbl)?.value || 0);

          const faturamentoDRE = findDREValue("RECEITA OPERACIONAL BRUTA") || (isDemoMode ? 42050 : 35000);
          const opexDRE = findDREValue("(-) Despesas Operacionais (OPEX)") || (isDemoMode ? 16800 : 12000);
          
          const requiredMarginPct = faturamentoDRE > 0 ? (opexDRE / faturamentoDRE) * 100 : 35;
          const safeRequiredMargin = Math.min(90, Math.max(5, requiredMarginPct));
          const breakEvenMarkupValue = 1 / (1 - safeRequiredMargin / 100);

          // Calculate current and simulated markup averages
          const currentAvgMarkup = validMarkupProdList.length > 0
            ? validMarkupProdList.reduce((sum, p) => sum + (p.sellingPrice / p.costPrice), 0) / validMarkupProdList.length
            : 1.65;

          const calculatedProposedProds = validMarkupProdList.map(p => {
            const hasSelection = selectedRepriceProductIds.includes(p.id);
            if (!hasSelection) {
              return {
                id: p.id,
                name: p.name,
                costPrice: p.costPrice,
                currentPrice: p.sellingPrice,
                currentMargin: p.profitMarginPct,
                proposedPrice: p.sellingPrice,
                proposedMargin: p.profitMarginPct,
                currentMarkup: p.sellingPrice / p.costPrice,
                proposedMarkup: p.sellingPrice / p.costPrice,
              };
            }

            const targetMarginPct = Math.min(90, Math.max(5, p.profitMarginPct + 15));
            const totalDeductionsPct = p.taxRate + p.otherCostsPct + targetMarginPct;
            let proposedPrice = 0;
            if (totalDeductionsPct < 100) {
              proposedPrice = p.costPrice / (1 - totalDeductionsPct / 100);
            } else {
              proposedPrice = p.sellingPrice * 1.15;
            }
            proposedPrice = Math.round(proposedPrice * 100) / 100;

            const commissionValue = proposedPrice * (p.taxRate / 100);
            const otherValue = proposedPrice * (p.otherCostsPct / 100);
            const profitValue = proposedPrice - p.costPrice - commissionValue - otherValue;
            const proposedMarginReal = proposedPrice > 0 ? (profitValue / proposedPrice) * 100 : targetMarginPct;

            return {
              id: p.id,
              name: p.name,
              costPrice: p.costPrice,
              currentPrice: p.sellingPrice,
              currentMargin: p.profitMarginPct,
              proposedPrice: proposedPrice,
              proposedMargin: proposedMarginReal,
              currentMarkup: p.sellingPrice / p.costPrice,
              proposedMarkup: proposedPrice / p.costPrice,
            };
          });

          const simAvgMarkup = calculatedProposedProds.length > 0
            ? calculatedProposedProds.reduce((sum, p) => sum + p.proposedMarkup, 0) / calculatedProposedProds.length
            : 1.65;

          const simDiffToBreakEven = simAvgMarkup - breakEvenMarkupValue;

          // Toggle helper
          const toggleAllSelection = () => {
            if (selectedRepriceProductIds.length === validMarkupProdList.length) {
              setSelectedRepriceProductIds([]);
            } else {
              setSelectedRepriceProductIds(validMarkupProdList.map(p => p.id));
            }
          };

          const toggleSingleSelection = (id: string) => {
            if (selectedRepriceProductIds.includes(id)) {
              setSelectedRepriceProductIds(selectedRepriceProductIds.filter(item => item !== id));
            } else {
              setSelectedRepriceProductIds([...selectedRepriceProductIds, id]);
            }
          };

          // Handle applying in batch
          const applyBatchRepricing = async () => {
            try {
              let updateCount = 0;
              for (const p of validMarkupProdList) {
                if (selectedRepriceProductIds.includes(p.id)) {
                  const targetObj = calculatedProposedProds.find(item => item.id === p.id);
                  if (targetObj) {
                    const commissionValue = targetObj.proposedPrice * (p.taxRate / 100);
                    const otherValue = targetObj.proposedPrice * (p.otherCostsPct / 100);
                    const profitValue = targetObj.proposedPrice - p.costPrice - commissionValue - otherValue;

                    await updateProduct(p.id, {
                      sellingPrice: targetObj.proposedPrice,
                      profitMarginPct: targetObj.proposedMargin,
                      profitValue: profitValue,
                      cmvPct: targetObj.proposedPrice > 0 ? (p.costPrice / targetObj.proposedPrice) * 100 : 100,
                    });
                    updateCount++;
                  }
                }
              }
              showToast(`Sucesso! ${updateCount} produto(s) calibrados com margem de segurança de +15%.`, "success");
              setShowRepricerModal(false);
            } catch (err) {
              console.error(err);
              showToast("Erro ao efetuar o reajuste coletivo.", "error");
            }
          };

          return (
            <motion.div
              key="markup-recompose-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0c0c0c]/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                className="bg-white rounded-[2.5rem] border-2 border-slate-900 w-full max-w-4xl shadow-[0_24px_64px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden my-8 text-left"
              >
                {/* Header aspect */}
                <div className="bg-[#1c1c1c] p-6 lg:p-8 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="space-y-1.5 z-10 text-left">
                    <span className="bg-rose-500/25 text-rose-300 font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/30">
                      🎯 CoPiloto de Calibração Preventiva
                    </span>
                    <h3 className="font-black text-2xl uppercase tracking-tight italic text-amber-50">
                      Readequação para Margem de Defesa (+15%)
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium font-sans">
                      Seu markup atual está gerando erosão de caixa frente às despesas operacionais simuladas no DRE. Ajuste suas margens de lucro líquidas em lote de forma preventiva.
                    </p>
                  </div>
                  <button
                    onClick={() => { sound.playClick(); setShowRepricerModal(false); }}
                    className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer shrink-0 z-10"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Content body */}
                <div className="p-6 lg:p-8 overflow-y-auto space-y-6 max-h-[66vh] bg-slate-50/50">
                  
                  {/* Realtime Simulation Gauge inside Modal */}
                  <div className="bg-slate-900 text-white rounded-3xl p-5 border border-white/5 shadow-inner space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-rose-400 font-black">Impacto no Balanço Consolidado</span>
                        <h4 className="text-sm font-bold font-sans flex items-center gap-1.5 shadow-neutral-900">Simulação Dinâmica de Markup Coletivo</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-zinc-400 uppercase">Markup Mínimo Requerido DRE:</span>
                        <div className="text-sm font-black font-mono text-zinc-200">{breakEvenMarkupValue.toFixed(2)}x</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-left">
                      <div className="bg-[#141414] border border-white/5 rounded-2xl p-3.5 space-y-1">
                        <span className="text-[8.5px] font-mono uppercase text-zinc-400 block font-semibold">Markup Atual Médio:</span>
                        <div className="text-lg font-black font-mono tracking-tight text-white">{currentAvgMarkup.toFixed(2)}x</div>
                      </div>
                      
                      <div className="bg-[#141414] border border-white/5 rounded-2xl p-3.5 space-y-1 relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-emerald-500 to-teal-600" />
                        <span className="text-[8.5px] font-mono uppercase text-zinc-400 block font-semibold">Simulado Após Reajuste:</span>
                        <div className="text-lg font-black font-mono tracking-tight text-emerald-450">{simAvgMarkup.toFixed(2)}x</div>
                      </div>

                      <div className="bg-[#141414] border border-white/5 rounded-2xl p-3.5 space-y-1">
                        <span className="text-[8.5px] font-mono uppercase text-zinc-400 block font-semibold">Balanço de Margem:</span>
                        <div className={cn(
                          "text-[11px] font-black font-mono uppercase",
                          simDiffToBreakEven >= 0 ? "text-emerald-400" : "text-rose-450 animate-pulse"
                        )}>
                          {simDiffToBreakEven >= 0 
                            ? `✓ Seguro (Sobra de +${simDiffToBreakEven.toFixed(2)}x)` 
                            : `✗ Insuficiente (${simDiffToBreakEven.toFixed(2)}x abaixo)`}
                        </div>
                      </div>
                    </div>

                    {/* Progress slider bar inside modal */}
                    <div className="space-y-1.5 pt-2">
                      <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full relative">
                        {/* Selected markup pointer */}
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-md transition-all duration-300"
                          style={{ left: `${Math.min(100, Math.max(0, ((simAvgMarkup - 1) / 2) * 100))}%` }}
                        />
                        {/* Required pointer */}
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-black border-2 border-rose-550 shadow-md"
                          style={{ left: `${Math.min(100, Math.max(0, ((breakEvenMarkupValue - 1) / 2) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400">
                        <span>Ponto Inicial (1.00x)</span>
                        <span>Alvo Ideal (3.00x)</span>
                      </div>
                    </div>
                  </div>

                  {/* Product List */}
                  {validMarkupProdList.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center text-zinc-500">
                      Não existem produtos cadastrados com preços de custo no sistema. Vá para a tela de Precificação no Menu Lateral para cadastrar produtos.
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="text-xs font-black text-zinc-800 font-sans uppercase tracking-wider">Produtos Disponíveis para Calibração</h4>
                        <button
                          type="button"
                          onClick={() => { sound.playClick(); toggleAllSelection(); }}
                          className="bg-white border hover:bg-zinc-50 border-gray-300 text-[10px] font-black text-gray-700 font-mono px-3 py-1 rounded-lg transition-all"
                        >
                          {selectedRepriceProductIds.length === validMarkupProdList.length ? "Desmarcar Todos" : "Selecionar Todos"}
                        </button>
                      </div>

                      <div className="divide-y divide-gray-100 max-h-[35vh] overflow-y-auto">
                        {calculatedProposedProds.map(p => {
                          const isChecked = selectedRepriceProductIds.includes(p.id);
                          return (
                            <div 
                              key={p.id} 
                              onClick={() => { sound.playClick(); toggleSingleSelection(p.id); }}
                              className={cn(
                                "p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer text-left",
                                isChecked ? "bg-rose-550/5 hover:bg-rose-550/10" : "bg-white"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // Handled by outer div click
                                  className="h-4.5 w-4.5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                  <div className="text-xs font-black text-zinc-950 font-sans">{p.name}</div>
                                  <div className="text-[10px] text-zinc-450 font-mono">
                                    Custo Unitário: <strong className="text-zinc-700">{formatCurrency(p.costPrice)}</strong>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-right w-full sm:w-auto justify-between sm:justify-end">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-mono uppercase text-zinc-400 block">Preço Atual / Margem:</span>
                                  <div className="text-xs font-bold text-zinc-600 font-mono">
                                    {formatCurrency(p.currentPrice)} <span className="text-[10px] text-zinc-400">({p.currentMargin.toFixed(0)}%)</span>
                                  </div>
                                </div>

                                <div className="space-y-0.5 text-right">
                                  <span className="text-[8px] font-mono uppercase text-zinc-400 block">Markup Atual:</span>
                                  <span className="text-xs font-mono font-medium text-zinc-500">{p.currentMarkup.toFixed(2)}x</span>
                                </div>

                                <div className="hidden sm:block text-zinc-300">→</div>

                                <div className="space-y-0.5 text-right">
                                  <span className="text-[8px] font-mono uppercase text-emerald-600 block font-bold">Novo Preço Sugerido:</span>
                                  <div className="text-xs font-black text-emerald-600 font-mono">
                                    {formatCurrency(p.proposedPrice)} <span className="text-[10px] ml-0.5 text-emerald-500 font-black">({p.proposedMargin.toFixed(0)}%)</span>
                                  </div>
                                </div>

                                <div className="space-y-0.5 text-right">
                                  <span className="text-[8px] font-mono uppercase text-emerald-600 block font-bold">Novo Markup:</span>
                                  <span className="text-xs font-mono font-black text-emerald-600">{p.proposedMarkup.toFixed(2)}x</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-left items-start">
                    <span className="text-amber-600 font-bold shrink-0 mt-0.5 text-base">💡</span>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-amber-800 block font-mono">Nota de Segurança Operacional</span>
                      <p className="text-[10.5px] text-yellow-950 font-medium font-sans leading-normal">
                        O reajuste de +15% adiciona margem protetiva líquida na sua operação para cobrir a folha de pagamento, OPEX administrativo e os juros de capital de giro sem gerar prejuízos na venda. Seus produtos de maior volume de vendas devem ser priorizados.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Footer buttons */}
                <div className="bg-slate-100 p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center rounded-b-[2.5rem] gap-4 shrink-0">
                  <div className="text-[10px] font-semibold text-zinc-500 font-sans max-w-sm text-left">
                    *Ao confirmar, os novos preços base de venda serão aplicados na sua planilha de precificação e refletidos em todas as projeções subsequentes.
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setShowRepricerModal(false);
                      }}
                      className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer w-full sm:w-auto text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={applyBatchRepricing}
                      disabled={selectedRepriceProductIds.length === 0}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg w-full sm:w-auto text-center",
                        selectedRepriceProductIds.length === 0
                          ? "bg-slate-250 text-slate-400 border border-slate-350 pointer-events-none shadow-none"
                          : "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/20"
                      )}
                    >
                      <Check size={12} /> Confirmar Reajuste (+{selectedRepriceProductIds.length})
                    </button>
                  </div>
                </div>

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  title,
  value,
  type,
  trend,
  importance = "medium",
  health,
  onClick,
  detailsLabel,
  onCorrelationClick,
  onTaxSimClick,
  marginPct,
  onAutoAdjustPrice,
  isActive = false,
  children,
}: {
  title: string;
  value: string;
  type: "positive" | "negative" | "neutral";
  trend?: string;
  importance?: "high" | "medium" | "low";
  health?: "good" | "regular" | "poor";
  onClick?: () => void;
  detailsLabel?: string;
  onCorrelationClick?: () => void;
  onTaxSimClick?: () => void;
  marginPct?: number;
  onAutoAdjustPrice?: () => void;
  isActive?: boolean;
  children?: React.ReactNode;
}) {
  const { products, updateProduct, showToast } = useFinance();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (marginPct !== undefined) {
      setAnimatedProgress(0);
      const r = requestAnimationFrame(() => {
        const t = setTimeout(() => {
          setAnimatedProgress(marginPct);
        }, 50);
        return () => clearTimeout(t);
      });
      return () => cancelAnimationFrame(r);
    }
  }, [marginPct]);

  const handleContextAutoAdjust = async () => {
    sound.playClick();
    const lowMarginProducts = products.filter((p) => p.profitMarginPct < 20);
    if (lowMarginProducts.length === 0) {
      showToast("Todos os seus produtos já operam com margem igual ou superior a 20%!", "success");
      setContextMenu(null);
      return;
    }
    try {
      for (const p of lowMarginProducts) {
        const totalTaxesAndOther = p.taxRate + p.otherCostsPct;
        const targetMargin = 20; // 20% margin
        const totalDeductionPct = totalTaxesAndOther + targetMargin;
        let adjustedPrice = 0;
        if (totalDeductionPct < 100) {
          adjustedPrice = p.costPrice / (1 - totalDeductionPct / 100);
        } else {
          adjustedPrice = p.costPrice * 1.5;
        }
        const formattedPrice = Math.round(adjustedPrice * 100) / 100;
        
        const commissionVal = formattedPrice * (p.taxRate / 100);
        const otherVal = formattedPrice * (p.otherCostsPct / 100);
        const profitValue = formattedPrice - p.costPrice - commissionVal - otherVal;
        const profitMarginPct = formattedPrice > 0 ? (profitValue / formattedPrice) * 100 : 0;

        await updateProduct(p.id, {
          sellingPrice: formattedPrice,
          profitMarginPct,
          profitValue,
          cmvPct: formattedPrice > 0 ? (p.costPrice / formattedPrice) * 100 : 100,
        });
      }
      showToast(`Sucesso! Os preços de ${lowMarginProducts.length} produto(s) foram ajustados para garantir faturamento com margem de 20%!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao processar o ajuste automático de preços.", "error");
    }
    setContextMenu(null);
  };

  let cardClasses = "";
  let titleClasses = "";
  let valueClasses = "";
  let trendClasses = "";
  let badgeText = "";
  let healthDotColor = "";
  let healthBadge = null;

  if (health) {
    if (health === "good") {
      cardClasses = "bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.012)] hover:border-emerald-300 hover:shadow-[0_12px_28px_-4px_rgba(16,185,129,0.05)] transition-all duration-300";
      valueClasses = "text-2xl sm:text-3xl lg:text-[1.7rem] xl:text-[1.85rem] font-extrabold tracking-tight text-slate-900 mb-1 font-mono tabular-nums leading-none";
      titleClasses = "text-[9.5px] font-bold uppercase tracking-widest text-slate-400 font-mono";
      healthDotColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
      healthBadge = (
        <span className="text-[8.5px] font-bold bg-emerald-50/80 text-emerald-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100/60 leading-none">
          ● SEGURO
        </span>
      );
    } else if (health === "regular") {
      cardClasses = "bg-white p-5 rounded-[2.2rem] border border-slate-150 shadow-[0_8px_30px_rgba(0,0,0,0.012)] hover:border-amber-300 hover:shadow-[0_12px_28px_-4px_rgba(245,158,11,0.05)] transition-all duration-300";
      valueClasses = "text-2xl sm:text-3xl lg:text-[1.7rem] xl:text-[1.85rem] font-extrabold tracking-tight text-slate-900 mb-1 font-mono tabular-nums leading-none";
      titleClasses = "text-[9.5px] font-bold uppercase tracking-widest text-slate-400 font-mono";
      healthDotColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
      healthBadge = (
        <span className="text-[8.5px] font-bold bg-amber-50/80 text-amber-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-100/60 leading-none">
          ● REGULAR
        </span>
      );
    } else { // poor
      cardClasses = "bg-white p-5 rounded-[2.2rem] border border-slate-150 shadow-[0_8px_30px_rgba(0,0,0,0.012)] hover:border-rose-350 hover:shadow-[0_12px_28px_-4px_rgba(244,63,94,0.05)] transition-all duration-300";
      valueClasses = "text-2xl sm:text-3xl lg:text-[1.7rem] xl:text-[1.85rem] font-extrabold tracking-tight text-slate-900 mb-1 font-mono tabular-nums leading-none";
      titleClasses = "text-[9.5px] font-bold uppercase tracking-widest text-slate-400 font-mono";
      healthDotColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]";
      healthBadge = (
        <span className="text-[8.5px] font-bold bg-rose-50/85 text-rose-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-100/60 leading-none">
          ● CRÍTICO
        </span>
      );
    }
  } else {
    if (importance === "high") {
      cardClasses = "bg-white p-5 rounded-[2.2rem] border border-orange-200/80 shadow-[0_8px_30px_rgba(249,115,22,0.015)] hover:border-orange-400 hover:shadow-[0_16px_36px_-6px_rgba(249,115,22,0.06)] transition-all duration-400 scale-[1.01] z-10";
      titleClasses = "text-[9.5px] font-bold uppercase tracking-widest text-orange-600 font-mono";
      valueClasses = "text-2xl sm:text-3xl lg:text-[1.7rem] xl:text-[1.85rem] font-extrabold tracking-tight text-slate-900 mb-1 font-mono tabular-nums leading-none";
      trendClasses = "mt-auto pt-5 border-t border-slate-100";
      badgeText = "Alta Importância";
    } else if (importance === "medium") {
      cardClasses = "bg-white p-5 rounded-[2rem] border border-slate-150 shadow-[0_8px_30px_rgba(0,0,0,0.012)] hover:border-slate-800 hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] transition-all duration-300";
      titleClasses = "text-[9.5px] font-bold uppercase tracking-widest text-slate-400 font-mono";
      valueClasses = "text-2xl sm:text-3xl lg:text-[1.7rem] xl:text-[1.85rem] font-extrabold tracking-tight text-slate-900 mb-1 font-mono tabular-nums leading-none";
      trendClasses = "mt-auto pt-5 border-t border-slate-100";
      badgeText = "Média Importância";
    } else { // low
      cardClasses = "bg-slate-50/40 p-4 rounded-[1.5rem] border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.008)] hover:bg-slate-50 hover:border-slate-350 transition-all duration-350 opacity-95";
      titleClasses = "text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono";
      valueClasses = "text-xl sm:text-2xl font-bold tracking-tight text-slate-700 mb-1 font-mono tabular-nums leading-none";
      trendClasses = "mt-auto pt-4 border-t border-slate-100/40";
      badgeText = "Baixa Importância";
    }
  }

  // Active comparative analysis focus style adjustments
  if (isActive) {
    if (health === "good") {
      cardClasses = "bg-emerald-500/[0.005] p-5 rounded-[2.2rem] border-2 border-emerald-500 shadow-[0_12px_32px_rgba(16,185,129,0.08)] ring-4 ring-emerald-500/5 scale-[1.015] duration-400 z-10";
    } else if (health === "regular") {
      cardClasses = "bg-amber-500/[0.005] p-5 rounded-[2.2rem] border-2 border-amber-500 shadow-[0_12px_32px_rgba(245,158,11,0.08)] ring-4 ring-amber-500/5 scale-[1.015] duration-400 z-10";
    } else if (health === "poor") {
      cardClasses = "bg-rose-500/[0.005] p-5 rounded-[2.2rem] border-2 border-rose-500 shadow-[0_12px_32px_rgba(244,63,94,0.08)] ring-4 ring-rose-500/5 scale-[1.015] duration-400 z-10";
    } else {
      if (importance === "high") {
        cardClasses = "bg-orange-500/[0.005] p-5 rounded-[2.2rem] border-2 border-orange-500 shadow-[0_12px_32px_rgba(249,115,22,0.08)] ring-4 ring-orange-500/5 scale-[1.02] z-10";
      } else if (importance === "medium") {
        cardClasses = "bg-slate-500/[0.005] p-5 rounded-[2rem] border-2 border-slate-800 shadow-[0_12px_32px_rgba(71,85,105,0.06)] ring-4 ring-slate-500/5 scale-[1.015] z-10";
      } else {
        cardClasses = "bg-slate-500/[0.005] p-4 rounded-[1.5rem] border-2 border-slate-500 shadow-[0_10px_25px_rgba(71,85,105,0.04)] ring-4 ring-slate-400/5 scale-[1.015] z-10 opacity-100";
      }
    }
  }

  let popoutId: string | null = null;
  if (title === "Lucro Líquido (Saldo)" || title === "Saldo Atual") {
    popoutId = "saldo";
  } else if (title === "Receita Mensal") {
    popoutId = "receita";
  } else if (title === "Despesa Mensal") {
    popoutId = "despesa";
  } else if (title === "Margem de Contribuição Média" || title === "Margem de Lucro Média") {
    popoutId = "margem";
  }

  return (
    <div 
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        sound.playClick();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      className={cn(
        "dashboard-stat-card flex flex-col justify-between h-full group relative overflow-hidden select-none", 
        cardClasses,
        onClick && "cursor-pointer active:scale-[0.985] transition-all duration-300"
      )}
    >
      {/* Active Selection Badge */}
      {isActive && (
        <div className="absolute top-3 right-3 sm:right-4 flex items-center gap-1 bg-slate-900 text-white font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md z-30 pointer-events-none">
          <Sparkles size={9} className="animate-spin text-orange-400" /> EM ANÁLISE
        </div>
      )}
      {/* Decorative top corner background orbs - very faint and subtle */}
      {!health && importance === "high" && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/5 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
      )}
      {!health && importance === "medium" && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-gray-500/3 blur-xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      )}
      {health === "good" && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/3 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      )}
      {health === "regular" && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/3 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      )}
      {health === "poor" && (
        <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/3 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      )}

      <div className="relative z-10 space-y-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2.5 border-b border-slate-100/80 pb-2">
            <div className="flex items-center gap-1.5 font-sans">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  health ? healthDotColor : (
                    type === "positive"
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      : type === "negative"
                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                        : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                  )
                )}
              />
              <p className={cn(titleClasses, "text-[9px] font-bold uppercase tracking-widest")}>
                {title}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {health ? healthBadge : (
                <span className={cn(
                  "text-[8px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide border leading-none",
                  importance === "high" 
                    ? "bg-orange-50 text-orange-700 border-orange-100/60"
                    : importance === "medium"
                      ? "bg-slate-50 text-slate-600 border-slate-100"
                      : "bg-gray-50 text-gray-400 border-gray-100"
                )}>
                  {badgeText}
                </span>
              )}
              {popoutId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    window.open(window.location.origin + window.location.pathname + `?popout=${popoutId}`, "_blank");
                  }}
                  className="p-1 rounded-md bg-slate-50 border border-slate-150 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all cursor-pointer"
                  title="Abrir este painel em um monitor externo"
                >
                  <ExternalLink size={9} />
                </button>
              )}
            </div>
          </div>
          
          <h2 className={cn(valueClasses, "font-sans font-extrabold tracking-tight text-2xl sm:text-3xl lg:text-[1.7rem] xl:text-[1.85rem] truncate")}>
            {value}
          </h2>

          {trend && (
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide leading-normal mt-1 text-left font-sans truncate">
              {trend}
            </p>
          )}

          {children}

          {marginPct !== undefined && (
            <div className="mt-4 space-y-1.5 text-left group/progress relative">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                <span>Eficiência de Margem</span>
                <span className={cn("font-black text-[10px]", marginPct >= 20 ? "text-emerald-600" : "text-rose-600")}>
                  {marginPct.toFixed(1)}% / 20% Alvo
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative cursor-help">
                <div 
                  className={cn(
                    "h-full rounded-full transition-[width] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                    marginPct >= 20 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, animatedProgress))}%` }}
                />
              </div>

              {/* High-Contrast Interactive Tooltip/Popover */}
              <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-64 bg-slate-950 text-white rounded-2xl p-3 shadow-xl ring-1 ring-white/10 opacity-0 scale-95 pointer-events-none group-hover/progress:opacity-100 group-hover/progress:scale-100 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 transform origin-bottom font-sans">
                {/* Visual Arrow indicator */}
                <div className="absolute top-[99%] left-1/2 -translate-x-1/2 border-6 border-transparent border-t-slate-950" />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">Auditoria Operacional</span>
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono", marginPct >= 20 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")}>
                      {marginPct >= 20 ? "Seguro" : "Sinal Vermelho"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Margem Real:</span>
                    <strong className="font-mono text-white text-sm">{marginPct.toFixed(2)}%</strong>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5">
                    <span className="text-slate-400">Meta Mínima:</span>
                    <span className="font-mono text-slate-300">20.00%</span>
                  </div>
                  
                  <div className="text-[11px] leading-relaxed border-t border-white/10 pt-1.5 font-medium">
                    {marginPct < 20 ? (
                      <span className="text-rose-300">
                        ⚠️ Déficit de <strong className="font-mono text-rose-400 font-bold">{(20 - marginPct).toFixed(2)}%</strong> para atingir o padrão recomendado de retorno.
                      </span>
                    ) : (
                      <span className="text-emerald-300">
                        🎉 Superávit de <strong className="font-mono text-emerald-400 font-bold">{(marginPct - 20).toFixed(2)}%</strong> acima da zona crítica operacional.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {marginPct !== undefined && marginPct < 20 && (() => {
            const lowMarginProducts = products.filter((p) => p.profitMarginPct < 20);
            return (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setIsExpanded(!isExpanded);
                }}
                className={cn(
                  "mt-3.5 p-3 bg-rose-50/25 border border-rose-200/50 rounded-2xl space-y-1.5 transition-all cursor-pointer hover:bg-rose-50/40 active:scale-[0.99]",
                  !isExpanded && "animate-pulse"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-rose-700 text-[9.5px] font-bold uppercase tracking-wider font-sans">
                    <AlertCircle size={12} className="text-rose-500 shrink-0" />
                    Alerta de Precificação
                  </div>
                  <span className="text-[8px] font-extrabold uppercase bg-rose-550/15 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200/50 tracking-wide select-none">
                    {isExpanded ? "RECOLHER" : `DETALHAR (${lowMarginProducts.length})`}
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                  A margem de contribuição média ({marginPct.toFixed(1)}%) caiu abaixo do limite de segurança (20%). Preço médio desbalanceado!
                </p>

                {isExpanded && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="mt-2 space-y-1.5 text-left border-t border-rose-200/30 pt-2 animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <div className="text-[9px] font-bold uppercase text-rose-800 tracking-wider mb-1">
                      Itens Críticos (&lt; 20%):
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs select-text">
                      {lowMarginProducts.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic">Nenhum produto com margem crítica.</p>
                      ) : (
                        lowMarginProducts.map((p) => (
                           <div 
                            key={p.id} 
                            className="flex items-center justify-between p-1.5 bg-white border border-rose-100 rounded-lg shadow-2xs"
                          >
                            <div className="flex flex-col min-w-0 grow pr-2">
                              <span className="font-bold text-slate-800 uppercase tracking-tight truncate text-[10px]">
                                {p.name}
                              </span>
                              <span className="text-[8.5px] text-slate-400 font-mono">
                                Custo: {formatCurrency(p.costPrice)} • Preço: {formatCurrency(p.sellingPrice)}
                              </span>
                            </div>
                            <span className="shrink-0 text-[9.5px] font-bold text-rose-600 bg-rose-50/50 px-1.5 py-0.5 rounded border border-rose-100 font-mono tracking-tight">
                              {p.profitMarginPct.toFixed(1)}%
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {onAutoAdjustPrice && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAutoAdjustPrice();
                    }}
                    className="w-full text-center bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] uppercase tracking-wider py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm hover:shadow active:scale-95 mt-1"
                  >
                    <Sparkles size={10} /> Corrigir Margem Automático (25%)
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {(onClick || onCorrelationClick || onTaxSimClick) && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 font-sans shrink-0">
            {onClick ? (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <span>{detailsLabel || "Ver Detalhes"}</span>
                <ChevronRight size={11} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            ) : <div />}
            
            <div className="flex items-center gap-1.5 shrink-0">
              {onCorrelationClick && (
                <button
                  type="button"
                  title="Análise de Correlação"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCorrelationClick();
                  }}
                  className="p-1 px-1.5 rounded-md bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-slate-400 border border-slate-200/60 hover:border-orange-200/60 transition-all text-[9.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <TrendingUp size={11} className="text-slate-400 hover:text-orange-600" />
                  <span className="sr-only sm:not-sr-only text-[8.5px] uppercase tracking-wider font-extrabold text-slate-500 hover:text-orange-600">Correlação</span>
                </button>
              )}
              {onTaxSimClick && (
                <button
                  type="button"
                  title="Simulação Tributária"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaxSimClick();
                  }}
                  className="p-1 px-1.5 rounded-md bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 border border-slate-200/60 hover:border-emerald-200/60 transition-all text-[9.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Coins size={11} className="text-slate-400 hover:text-emerald-500" />
                  <span className="sr-only sm:not-sr-only text-[8.5px] uppercase tracking-wider font-extrabold text-slate-500 hover:text-emerald-600">Tributário</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
