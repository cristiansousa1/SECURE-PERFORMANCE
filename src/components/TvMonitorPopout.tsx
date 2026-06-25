import React, { useState, useEffect } from "react";
import { sound } from "../utils/SoundEngine";
import { 
  X, 
  Tv, 
  ExternalLink, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Sun, 
  Moon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  DollarSign,
  TrendingUp,
  Percent,
  TrendingDown,
  Building,
  Activity,
  Briefcase,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Receipt,
  Check,
  ArrowRight,
  Calendar,
  Copy
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface TvMonitorPopoutProps {
  popoutId: string;
  onClose: () => void;
  transactions: any[];
  allTransactions: any[];
  totalIncome: number;
  totalExpense: number;
  totalOpexExpense: number;
  totalCmvExpense: number;
  avgProductMargin: number;
  formatCurrency: (value: number) => string;
  storeProfiles: any[];
  activeStoreId: string;
  setActiveStoreId: (storeId: string) => void;
  products: any[];
  bills: any[];
  addTransaction?: (t: any) => Promise<void>;
  triggerLiveSimTransaction?: () => void;
  isDemoMode?: boolean;
}

export default function TvMonitorPopout({
  popoutId,
  onClose,
  transactions,
  allTransactions,
  totalIncome,
  totalExpense,
  totalOpexExpense,
  totalCmvExpense,
  avgProductMargin,
  formatCurrency,
  storeProfiles,
  activeStoreId,
  setActiveStoreId,
  products,
  bills = [],
  addTransaction,
  triggerLiveSimTransaction,
  isDemoMode = true
}: TvMonitorPopoutProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Automated Data Upload / Uplink States
  const [isAutoSyncActive, setIsAutoSyncActive] = useState<boolean>(true);
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(15); // seconds
  const [countdown, setCountdown] = useState<number>(15);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFeed, setUploadedFeed] = useState<Array<{
    id: string;
    description: string;
    amount: number;
    time: string;
    isIncome: boolean;
  }>>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [dashboardRange, setDashboardRange] = useState<6 | 12 | 24>(12);

  // Auto-Rotation Carousel State
  const [currentSlideId, setCurrentSlideId] = useState<string>(popoutId || "tv-dashboard");
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [rotationInterval, setRotationInterval] = useState<number>(8000); // 8 seconds per slide
  const [progress, setProgress] = useState<number>(0);
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  // List of Available Slides
  const SLIDES = [
    { id: "tv-dashboard", label: "Painel Consolidado", icon: Activity, desc: "Visão Geral" },
    { id: "receita", label: "Faturamento", icon: TrendingUp, desc: "Histórico de Receita" },
    { id: "chart-faturamento", label: "Gráfico de Receitas", icon: ArrowUpRight, desc: "Curva Temporal de Entradas" },
    { id: "despesa", label: "Custos & OPEX", icon: TrendingDown, desc: "Saídas & CMV" },
    { id: "contas-pagar", label: "Contas a Pagar", icon: Receipt, desc: "Vencimentos Operacionais" },
    { id: "margem", label: "Margem de Lucro", icon: Percent, desc: "Análise de Retorno" },
    { id: "chart-margem", label: "Gráfico de Margem", icon: Sparkles, desc: "Curva Temporal de Lucro" }
  ];

  // Compute dashboard history dynamically inside popout
  const dashboardHistoryData = React.useMemo(() => {
    const selectedMonthsList = Array.from({ length: dashboardRange }, (_, i) => subMonths(new Date(), i)).reverse();
    const averageTaxRate = storeProfiles.length > 0
      ? storeProfiles.reduce((acc, s) => acc + s.taxRate, 0) / storeProfiles.length
      : 6;

    return selectedMonthsList.map(m => {
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const mLabel = format(m, "MMM/yy", { locale: ptBR });
      
      const txs = allTransactions.filter(t => {
        const d = new Date(t.date);
        return isWithinInterval(d, { start: mStart, end: mEnd });
      });
      
      const receitas = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const despesas = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const imposto = (receitas * averageTaxRate) / 100;
      const lucroLiquido = receitas - despesas - imposto;
      const margemLiquida = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0;
      
      return {
        month: mLabel,
        rawDate: m,
        receitas,
        despesas,
        lucroLiquido,
        margemLiquida: parseFloat(margemLiquida.toFixed(1))
      };
    });
  }, [allTransactions, storeProfiles, dashboardRange]);

  // Compute KPIs inside popout
  const dashboardKpis = React.useMemo(() => {
    if (dashboardHistoryData.length === 0) return {
      totalReceitas: 0,
      avgMargem: 0,
      growthMoM: 0,
      marginChange: 0,
      bestRevenueMonth: "-",
      bestRevenueVal: 0,
      bestMarginMonth: "-",
      bestMarginVal: 0,
    };

    const totalReceitas = dashboardHistoryData.reduce((sum, d) => sum + d.receitas, 0);
    const avgMargem = dashboardHistoryData.reduce((sum, d) => sum + d.margemLiquida, 0) / dashboardHistoryData.length;

    const firstMonth = dashboardHistoryData[0];
    const lastMonth = dashboardHistoryData[dashboardHistoryData.length - 1];

    let growthMoM = 0;
    if (firstMonth && lastMonth && firstMonth.receitas > 0) {
      growthMoM = ((lastMonth.receitas - firstMonth.receitas) / firstMonth.receitas) * 100;
    }

    let marginChange = 0;
    if (firstMonth && lastMonth) {
      marginChange = lastMonth.margemLiquida - firstMonth.margemLiquida;
    }

    const sortedByRevenue = [...dashboardHistoryData].sort((a, b) => b.receitas - a.receitas);
    const bestRevenueMonth = sortedByRevenue[0]?.month || "-";
    const bestRevenueVal = sortedByRevenue[0]?.receitas || 0;

    const sortedByMargin = [...dashboardHistoryData].sort((a, b) => b.margemLiquida - a.margemLiquida);
    const bestMarginMonth = sortedByMargin[0]?.month || "-";
    const bestMarginVal = sortedByMargin[0]?.margemLiquida || 0;

    return {
      totalReceitas,
      avgMargem,
      growthMoM,
      marginChange,
      bestRevenueMonth,
      bestRevenueVal,
      bestMarginMonth,
      bestMarginVal,
    };
  }, [dashboardHistoryData]);

  // Compute Bills (Contas a Pagar) Statistics
  const billsData = React.useMemo(() => {
    const allBills = bills || [];
    
    // Unpaid bills (pending or overdue)
    const unpaid = allBills.filter(b => b.status === "pending" || b.status === "overdue");
    const totalUnpaidAmount = unpaid.reduce((sum, b) => sum + b.amount, 0);
    
    // Overdue bills
    const overdue = allBills.filter(b => b.status === "overdue");
    const totalOverdueAmount = overdue.reduce((sum, b) => sum + b.amount, 0);
    
    // Upcoming in next 7 days
    const next7Days = allBills.filter(b => {
      if (b.status === "paid") return false;
      try {
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(b.dueDate + "T00:00:00");
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      } catch {
        return false;
      }
    });
    const totalNext7DaysAmount = next7Days.reduce((sum, b) => sum + b.amount, 0);

    // Upcoming in next 30 days
    const next30Days = allBills.filter(b => {
      if (b.status === "paid") return false;
      try {
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(b.dueDate + "T00:00:00");
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      } catch {
        return false;
      }
    });
    const totalNext30DaysAmount = next30Days.reduce((sum, b) => sum + b.amount, 0);

    // Category breakdown
    const adminAmount = unpaid.filter(b => b.expenseCategory === "administrative").reduce((sum, b) => sum + b.amount, 0);
    const marketingAmount = unpaid.filter(b => b.expenseCategory === "marketing").reduce((sum, b) => sum + b.amount, 0);
    const productionAmount = unpaid.filter(b => b.expenseCategory === "production").reduce((sum, b) => sum + b.amount, 0);
    const unclassifiedAmount = unpaid.filter(b => !b.expenseCategory).reduce((sum, b) => sum + b.amount, 0);

    // Sorted priority bills (overdue first, then by date)
    const sortedUrgent = [...unpaid].sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (a.status !== "overdue" && b.status === "overdue") return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return {
      unpaidCount: unpaid.length,
      totalUnpaidAmount,
      overdueCount: overdue.length,
      totalOverdueAmount,
      next7DaysCount: next7Days.length,
      totalNext7DaysAmount,
      next30DaysCount: next30Days.length,
      totalNext30DaysAmount,
      sortedUrgent,
      adminAmount,
      marketingAmount,
      productionAmount,
      unclassifiedAmount
    };
  }, [bills]);

  // Clock for TV Display
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("pt-BR"));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh simulation
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      handleManualRefresh();
    }, 15000); // refresh metadata indicator every 15s
    return () => clearInterval(refreshInterval);
  }, []);

  // Auto-Rotation Logic
  useEffect(() => {
    if (!isAutoRotating) {
      setProgress(0);
      return;
    }

    const updateIntervalMs = 100; // update progress every 100ms
    const step = (updateIntervalMs / rotationInterval) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlideId((currId) => {
            const currIdx = SLIDES.findIndex(s => s.id === currId);
            const nextIdx = (currIdx + 1) % SLIDES.length;
            return SLIDES[nextIdx].id;
          });
          return 0;
        }
        return prev + step;
      });
    }, updateIntervalMs);

    return () => clearInterval(timer);
  }, [isAutoRotating, rotationInterval, currentSlideId]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 800);
  };

  // Auto-Uplink simulation trigger
  const triggerAutoUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);
    
    // Play subtle beep sound when transmission starts
    try {
      if (sound && sound.playTick) {
        sound.playTick();
      }
    } catch (err) {}

    setTimeout(async () => {
      const isIncome = Math.random() < 0.75;
      const amountValue = Math.floor(65 + Math.random() * 220);
      const today = new Date();
      const timeStr = today.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const randomId = "tx-auto-tv-" + Math.random().toString(36).substring(2, 9);
      
      let description = "";
      if (isIncome) {
        const incomeDescs = [
          "Venda PDV Balcão (Uplink Automático)",
          "Checkout Digital Web-App (Sincronizado)",
          "Venda Canal Externo Marketplace",
          "Receita Serviço Consultoria",
          "Aporte de Giro Caixa"
        ];
        description = incomeDescs[Math.floor(Math.random() * incomeDescs.length)];
      } else {
        const expenseDescs = [
          "Insumo Logístico & Descartáveis",
          "Serviço Cloud APIs de Inteligência",
          "Custo de Embalagem & Envio",
          "Despesa de Limpeza e Manutenção"
        ];
        description = expenseDescs[Math.floor(Math.random() * expenseDescs.length)];
      }

      try {
        if (isDemoMode) {
          if (triggerLiveSimTransaction) {
            triggerLiveSimTransaction();
          }
        } else if (addTransaction) {
          await addTransaction({
            description,
            amount: amountValue,
            categoryId: isIncome ? "cat1" : "cat5",
            date: today,
            type: isIncome ? "income" : "expense",
            profileId: activeStoreId === "all" ? "matriz" : activeStoreId,
          });
          try {
            if (sound && sound.playTransactionSwell) {
              sound.playTransactionSwell(isIncome ? "income" : "expense");
            }
          } catch (err) {}
        }

        // Add to visual feed on TV Screen
        setUploadedFeed((prev) => [
          {
            id: randomId,
            description,
            amount: amountValue,
            time: timeStr,
            isIncome
          },
          ...prev
        ].slice(0, 5));

      } catch (err) {
        console.error("Erro no auto-upload:", err);
      } finally {
        setIsUploading(false);
      }
    }, 1000);
  };

  // Auto-Upload Count loop
  useEffect(() => {
    if (!isAutoSyncActive) return;

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerAutoUpload();
          return autoSyncInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isAutoSyncActive, autoSyncInterval, isDemoMode, addTransaction, triggerLiveSimTransaction, activeStoreId]);

  const handleCopyBoleto = (billId: string, barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedBillId(billId);
    setTimeout(() => setCopiedBillId(null), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Erro ao ativar tela cheia:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Generate dynamic, real-time contábil insights for the TV marquee ticker
  const marqueeInsights = React.useMemo(() => {
    const insights: string[] = [];
    const profitMargin = dashboardKpis.avgMargem;
    const isMargemSaudavel = profitMargin >= 15;
    const balance = totalIncome - totalExpense;

    insights.push(`🚀 DIRETORIA EXECUTIVA: Transmissão corporativa sincronizada. Inteligência Comercial Dafne AI monitorando filiais.`);

    if (billsData.overdueCount > 0) {
      insights.push(`⚠️ ALERTA FINANCEIRO URGENTE: Há ${billsData.overdueCount} contas em atraso totalizando ${formatCurrency(billsData.totalOverdueAmount)}. Verifique o slide "Contas a Pagar" para regularizar.`);
    }

    if (isMargemSaudavel) {
      insights.push(`📈 EXCELENTE RESULTADO: Margem líquida consolidada de ${profitMargin.toFixed(1)}% operando acima do benchmark ideal.`);
    } else {
      insights.push(`⚠️ MONITORAMENTO DE RETORNO: Margem líquida de ${profitMargin.toFixed(1)}% operando abaixo da meta desejada (15%). Avalie reajuste de preços ou OPEX.`);
    }

    if (balance > 0) {
      insights.push(`💰 FLUXO POSITIVO: Saldo consolidado superavitário em ${formatCurrency(balance)}. Recomendação: Provisionar juros e investir no giro comercial.`);
    } else {
      insights.push(`🚨 ATENÇÃO OPERACIONAL: Caixa consolidado operando em déficit temporário. Busque acelerar recebíveis e adiar contas não-essenciais.`);
    }

    if (totalCmvExpense > 0 && totalIncome > 0) {
      const cmvPct = (totalCmvExpense / totalIncome) * 100;
      if (cmvPct > 40) {
        insights.push(`⚙️ ANÁLISE DE CUSTO: CMV consome ${cmvPct.toFixed(1)}% das receitas. É aconselhável rever custo de mercadoria ou markup praticado.`);
      } else {
        insights.push(`✅ EFICIÊNCIA DO CMV: Custo de Mercadorias sob controle em ${cmvPct.toFixed(1)}% das vendas.`);
      }
    }

    if (billsData.next7DaysCount > 0) {
      insights.push(`📅 AGENDA SEMANAL: ${billsData.next7DaysCount} contas vencendo nos próximos 7 dias, totalizando ${formatCurrency(billsData.totalNext7DaysAmount)}.`);
    }

    return insights;
  }, [dashboardKpis, totalIncome, totalExpense, totalCmvExpense, billsData, formatCurrency]);

  const growthColor = dashboardKpis.growthMoM >= 0 ? "text-emerald-500" : "text-rose-500";
  const balanceVal = totalIncome - totalExpense;

  const handleNextSlide = () => {
    setProgress(0);
    const currIdx = SLIDES.findIndex(s => s.id === currentSlideId);
    const nextIdx = (currIdx + 1) % SLIDES.length;
    setCurrentSlideId(SLIDES[nextIdx].id);
  };

  const handlePrevSlide = () => {
    setProgress(0);
    const currIdx = SLIDES.findIndex(s => s.id === currentSlideId);
    const prevIdx = (currIdx - 1 + SLIDES.length) % SLIDES.length;
    setCurrentSlideId(SLIDES[prevIdx].id);
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-[#0b0c10] text-gray-100" : "bg-[#f8fafc] text-slate-900"} flex flex-col font-sans transition-colors duration-300 overflow-x-hidden relative`}>
      
      {/* GLOW DECORATIONS - ONLY IN DARK THEME */}
      {theme === "dark" && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-80 h-80 bg-blue-500/[0.02] rounded-full blur-[100px] pointer-events-none" />
        </>
      )}

      {/* TOP WALLBOARD HEADER */}
      <header className={`px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b ${theme === "dark" ? "border-zinc-800 bg-[#12131a]/80" : "border-slate-200 bg-white/80"} backdrop-blur-md sticky top-0 z-50`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme === "dark" ? "bg-orange-500/10 text-orange-400" : "bg-orange-500/5 text-orange-600"}`}>
            <Tv size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black uppercase tracking-tight font-sans">
                Monitor Corporativo Integrado
              </h1>
              <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                Transmissão Ativa
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
              Painel Contábil e Gestão Operacional de Negócios • Dafne AI
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Store Indicator */}
          <div className={`text-xs px-3 py-1.5 rounded-xl font-bold font-mono border ${theme === "dark" ? "bg-zinc-900/60 border-zinc-800 text-zinc-300" : "bg-slate-100 border-slate-200 text-slate-700"}`}>
            🏢 {activeStoreId === "all" ? "Resultados Consolidados" : storeProfiles.find(s => s.id === activeStoreId)?.companyName || "Filial Selecionada"}
          </div>

          {/* Clock */}
          <div className={`px-4 py-1.5 rounded-xl text-xs font-black font-mono border ${theme === "dark" ? "bg-zinc-950 border-zinc-850 text-orange-400" : "bg-slate-50 border-slate-150 text-orange-600"} shadow-inner`}>
            ⏱️ {currentTime || "00:00:00"}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${theme === "dark" ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-amber-400" : "bg-white border-slate-200 hover:bg-slate-50 text-amber-600"} cursor-pointer`}
              title="Alternar Tema"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Refresh */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${theme === "dark" ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"} cursor-pointer`}
              title="Sincronizar Dados"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${theme === "dark" ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"} cursor-pointer`}
              title="Modo Tela Cheia"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close / Return */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Voltar ao Painel Geral"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* CAROUSEL SLIDESHOW BAR & PROGRESS BAR */}
      <div className={`px-6 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${theme === "dark" ? "bg-[#161720] border-zinc-800" : "bg-slate-50 border-slate-200"}`}>
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
              isAutoRotating 
                ? (theme === "dark" ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-orange-100 border-orange-300 text-orange-700")
                : (theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-slate-200 border-slate-300 text-slate-500")
            }`}
            title={isAutoRotating ? "Pausar Rotação Automática" : "Iniciar Rotação Automática"}
          >
            {isAutoRotating ? (
              <>
                <Pause size={12} className="animate-pulse" />
                <span>Carrossel Ativo</span>
              </>
            ) : (
              <>
                <Play size={12} />
                <span>Carrossel Pausado</span>
              </>
            )}
          </button>

          {/* Skip buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevSlide}
              className={`p-1.5 rounded-lg border transition-all ${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"} cursor-pointer`}
              title="Slide Anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextSlide}
              className={`p-1.5 rounded-lg border transition-all ${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"} cursor-pointer`}
              title="Próximo Slide"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Time Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Velocidade:</span>
            {[5000, 8000, 12000, 15000].map((val) => (
              <button
                key={val}
                onClick={() => {
                  setRotationInterval(val);
                  setProgress(0);
                }}
                className={`px-2 py-1 rounded-md text-[9px] font-bold tracking-wider font-mono border transition-all cursor-pointer ${
                  rotationInterval === val
                    ? "bg-slate-900 text-white border-slate-700"
                    : (theme === "dark" ? "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100")
                }`}
              >
                {val / 1000}s
              </button>
            ))}
          </div>
        </div>

        {/* Slides Navigation Dots/Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          {SLIDES.map((s) => {
            const Icon = s.icon;
            const isSelected = currentSlideId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentSlideId(s.id);
                  setProgress(0);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-orange-500 border-orange-500 text-white font-black"
                    : (theme === "dark" ? "bg-zinc-900 border-zinc-850 text-zinc-400 hover:bg-zinc-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100")
                }`}
                title={s.desc}
              >
                <Icon size={11} className={isSelected ? "text-white" : "text-gray-400"} />
                <span>{s.label}</span>
                {s.id === "contas-pagar" && billsData.overdueCount > 0 && (
                  <span className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TIMED PROGRESS BAR */}
      <div className={`w-full h-1 ${theme === "dark" ? "bg-zinc-950" : "bg-slate-100"} overflow-hidden`}>
        <div 
          className="h-full bg-orange-500 transition-all ease-linear"
          style={{ width: `${progress}%`, transitionDuration: progress === 0 ? "0ms" : "100ms" }}
        />
      </div>

      {/* VIEWPORT AREA */}
      <main className="flex-1 p-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-7xl mx-auto space-y-6"
          >
            {/* 1. FATURAMENTO / RECEITA SINGLE PANEL */}
            {(currentSlideId === "receita") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className={`md:col-span-2 p-8 rounded-[2rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-2xl space-y-6`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-black uppercase text-orange-500 tracking-widest font-mono block mb-1">Entradas & Desempenho</span>
                      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Faturamento Bruto Consolidado</h2>
                      <p className="text-xs text-gray-400 font-semibold uppercase mt-1">Série acumulada no período de análise contábil.</p>
                    </div>
                    <span className="bg-orange-500/15 text-orange-500 p-3 rounded-2xl">
                      <TrendingUp size={28} />
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Valor Líquido Registrado</span>
                    <h3 className="text-5xl md:text-7xl font-black font-mono tracking-tight text-orange-500">
                      {formatCurrency(totalIncome)}
                    </h3>
                  </div>

                  <div className={`p-4 rounded-2xl flex items-center justify-between border ${theme === "dark" ? "bg-zinc-950/50 border-zinc-850" : "bg-slate-50 border-slate-150"}`}>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Volume Comercial Médio</span>
                      <strong className="text-lg font-black font-mono">
                        {formatCurrency(totalIncome / Math.max(1, dashboardRange))} / mês
                      </strong>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Crescimento MoM</span>
                      <strong className={`text-lg font-black font-mono flex items-center justify-end gap-1 ${growthColor}`}>
                        {dashboardKpis.growthMoM >= 0 ? "+" : ""}{dashboardKpis.growthMoM.toFixed(1)}% {dashboardKpis.growthMoM >= 0 ? "↑" : "↓"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Goal Card */}
                  <div className={`p-6 rounded-[2rem] border ${theme === "dark" ? "bg-emerald-950/10 border-emerald-500/20" : "bg-emerald-50/30 border-emerald-200"} shadow-xl text-left`}>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-extrabold uppercase px-2.5 py-1 rounded-full inline-block font-mono mb-3">
                      🎯 Meta Comercial
                    </span>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider font-mono">Status da Meta das Filiais</h4>
                    <p className="text-3xl font-black font-mono text-emerald-500 mt-2">
                      Eficiência Máxima
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-2">
                      Faturamento operando em patamares saudáveis nas últimas semanas para todo o grupo integrado.
                    </p>
                  </div>

                  {/* Operational Security */}
                  <div className={`p-6 rounded-[2rem] border ${theme === "dark" ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-slate-200"} shadow-xl text-left space-y-3`}>
                    <span className="text-[9px] bg-orange-500/10 text-orange-500 font-extrabold uppercase px-2.5 py-1 rounded-full inline-block font-mono">
                      🔒 Auditoria de Receita
                    </span>
                    <p className="text-xs text-gray-300 font-medium leading-relaxed">
                      Lançamentos de caixa reconciliados automaticamente via banco de dados corporativo, sem nenhuma inconformidade registrada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DESPESA MENSAL SINGLE PANEL */}
            {currentSlideId === "despesa" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className={`md:col-span-2 p-8 rounded-[2rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-2xl space-y-6`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-black uppercase text-rose-500 tracking-widest font-mono block mb-1">Drenagem de Caixa</span>
                      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Despesas & Custos Consolidados</h2>
                      <p className="text-xs text-gray-400 font-semibold uppercase mt-1">Consolidação de saídas fixas (OPEX) e variáveis (CMV) do grupo.</p>
                    </div>
                    <span className="bg-rose-500/15 text-rose-500 p-3 rounded-2xl">
                      <TrendingDown size={28} />
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Montante Total de Saídas</span>
                    <h3 className="text-5xl md:text-7xl font-black font-mono tracking-tight text-rose-500">
                      -{formatCurrency(totalExpense)}
                    </h3>
                  </div>

                  {/* Breakdown bars */}
                  <div className="space-y-4 pt-2 border-t border-zinc-800/60">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block mb-2">Composição Operacional das Saídas</span>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-sky-400">⚙️ OPEX (Despesas Operacionais Fixas)</span>
                        <span className="font-mono">{formatCurrency(totalOpexExpense)} ({totalExpense > 0 ? ((totalOpexExpense / totalExpense) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-zinc-900" : "bg-slate-100"}`}>
                        <div 
                          className="bg-sky-500 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${totalExpense > 0 ? (totalOpexExpense / totalExpense) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-orange-400">📦 CMV (Custo de Vendas / Variável)</span>
                        <span className="font-mono">{formatCurrency(totalCmvExpense)} ({totalExpense > 0 ? ((totalCmvExpense / totalExpense) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-zinc-900" : "bg-slate-100"}`}>
                        <div 
                          className="bg-orange-500 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${totalExpense > 0 ? (totalCmvExpense / totalExpense) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Control Advice */}
                  <div className={`p-6 rounded-[2rem] border ${theme === "dark" ? "bg-rose-950/10 border-rose-500/20" : "bg-rose-50/30 border-rose-200"} shadow-xl text-left`}>
                    <span className="text-[9px] bg-rose-500/10 text-rose-500 font-extrabold uppercase px-2.5 py-1 rounded-full inline-block font-mono mb-3">
                      🛡️ Auditoria de Saídas
                    </span>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider font-mono">Meta OPEX Fixo</h4>
                    <p className="text-2xl font-black font-mono text-rose-500 mt-2">
                      Redução de OPEX (-5%)
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-2">
                      Audite assinaturas redundantes de SaaS corporativo e renegocie planos de internet/telecom para melhorar as margens.
                    </p>
                  </div>

                  {/* Recommendation */}
                  <div className={`p-6 rounded-[2rem] border ${theme === "dark" ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-slate-200"} shadow-xl text-left space-y-3`}>
                    <span className="text-[9px] bg-sky-500/10 text-sky-500 font-extrabold uppercase px-2.5 py-1 rounded-full inline-block font-mono">
                      💡 Fornecedores
                    </span>
                    <p className="text-xs text-gray-300 font-medium leading-relaxed">
                      Prolongue o prazo médio de pagamento com fornecedores chave para aliviar o fluxo de caixa mensal imediato.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CONTAS A PAGAR SINGLE PANEL (NEW DEDICATED SLIDE - DAILY EFFECTIVE) */}
            {currentSlideId === "contas-pagar" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Summary and stats (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className={`p-8 rounded-[2rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-2xl space-y-6 text-left`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-black uppercase text-amber-500 tracking-widest font-mono block mb-1">Agenda de Obrigações</span>
                        <h2 className="text-3xl font-black uppercase tracking-tight">Contas a Pagar</h2>
                        <p className="text-xs text-gray-400 font-semibold uppercase mt-1">Visão integrada das obrigações e boletos pendentes.</p>
                      </div>
                      <span className="bg-amber-500/15 text-amber-500 p-3 rounded-2xl">
                        <Receipt size={28} />
                      </span>
                    </div>

                    {/* Pending Total */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Total de Contas Pendentes</span>
                      <h3 className="text-4xl md:text-5xl font-black font-mono tracking-tight text-amber-500">
                        {formatCurrency(billsData.totalUnpaidAmount)}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold uppercase font-mono">{billsData.unpaidCount} boletos aguardando pagamento</p>
                    </div>

                    {/* Split Grid KPIs */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-850">
                      
                      {/* KPI OVERDUE */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                        billsData.overdueCount > 0 
                          ? (theme === "dark" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-700")
                          : (theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-slate-50 border-slate-100")
                      }`}>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider block">🚨 Em Atraso</span>
                          <strong className="text-xl font-black font-mono mt-1 block">
                            {formatCurrency(billsData.totalOverdueAmount)}
                          </strong>
                        </div>
                        <span className="text-[9px] font-bold uppercase block mt-2 opacity-80">{billsData.overdueCount} contas vencidas</span>
                      </div>

                      {/* KPI WEEKLY */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                        billsData.next7DaysCount > 0 
                          ? (theme === "dark" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700")
                          : (theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-slate-50 border-slate-100")
                      }`}>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider block">📅 Próximos 7 Dias</span>
                          <strong className="text-xl font-black font-mono mt-1 block">
                            {formatCurrency(billsData.totalNext7DaysAmount)}
                          </strong>
                        </div>
                        <span className="text-[9px] font-bold uppercase block mt-2 opacity-80">{billsData.next7DaysCount} contas vencendo</span>
                      </div>

                    </div>

                    {/* KPI 30 DAYS */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-between ${theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-slate-100 border-slate-200"}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Projeção Próximos 30 Dias:</span>
                        <strong className="text-base font-black font-mono text-gray-300">
                          {formatCurrency(billsData.totalNext30DaysAmount)}
                        </strong>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-3">
                        <div 
                          className="bg-amber-500 h-full rounded-full" 
                          style={{ width: `${billsData.totalUnpaidAmount > 0 ? (billsData.totalNext7DaysAmount / billsData.totalUnpaidAmount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase font-mono mt-2 block text-right">
                        Sendo {((billsData.totalNext7DaysAmount / Math.max(1, billsData.totalUnpaidAmount)) * 100).toFixed(0)}% com vencimento imediato (7 dias)
                      </span>
                    </div>

                    {/* Category distribution */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Distribuição por Categoria de Despesa</span>
                      <div className="flex w-full h-3 rounded-md overflow-hidden bg-zinc-800">
                        {billsData.adminAmount > 0 && (
                          <div 
                            className="bg-sky-500" 
                            style={{ width: `${(billsData.adminAmount / billsData.totalUnpaidAmount) * 100}%` }}
                            title={`Administrativo: ${formatCurrency(billsData.adminAmount)}`}
                          />
                        )}
                        {billsData.marketingAmount > 0 && (
                          <div 
                            className="bg-purple-500" 
                            style={{ width: `${(billsData.marketingAmount / billsData.totalUnpaidAmount) * 100}%` }}
                            title={`Marketing: ${formatCurrency(billsData.marketingAmount)}`}
                          />
                        )}
                        {billsData.productionAmount > 0 && (
                          <div 
                            className="bg-orange-500" 
                            style={{ width: `${(billsData.productionAmount / billsData.totalUnpaidAmount) * 100}%` }}
                            title={`Produção/COGS: ${formatCurrency(billsData.productionAmount)}`}
                          />
                        )}
                        {billsData.unclassifiedAmount > 0 && (
                          <div 
                            className="bg-gray-500" 
                            style={{ width: `${(billsData.unclassifiedAmount / billsData.totalUnpaidAmount) * 100}%` }}
                            title={`Sem Categoria: ${formatCurrency(billsData.unclassifiedAmount)}`}
                          />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono font-bold text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span> Admin</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Marketing</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> Produção</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span> Outros</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Side: List of priority bills / code copiers (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div className={`p-6 rounded-[2rem] border h-full flex flex-col justify-between ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-2xl`}>
                    <div className="text-left mb-4">
                      <span className="text-[10px] bg-red-500/10 text-red-500 font-extrabold uppercase px-2.5 py-1 rounded-full inline-block font-mono mb-2">
                        🔥 Prioridade Máxima de Caixa
                      </span>
                      <h4 className="text-lg font-black uppercase tracking-tight">Obrigações e Boletos Críticos</h4>
                      <p className="text-xs text-gray-400 font-semibold uppercase mt-1">Efetue o pagamento prioritário para evitar multas bancárias e paralisações.</p>
                    </div>

                    {/* Scrollable priority list */}
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-2">
                      {billsData.sortedUrgent.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 space-y-3 h-full">
                          <CheckCircle2 size={54} className="text-emerald-500 animate-bounce" />
                          <div>
                            <h5 className="font-extrabold text-base text-gray-200 uppercase">Tudo em Dia!</h5>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm">
                              Nenhum boleto em atraso ou pendente registrado no sistema. Excelente gestão de fluxo de caixa!
                            </p>
                          </div>
                        </div>
                      ) : (
                        billsData.sortedUrgent.map((bill) => {
                          const isOverdue = bill.status === "overdue";
                          const formattedDueDate = bill.dueDate ? format(new Date(bill.dueDate + "T00:00:00"), "dd 'de' MMMM", { locale: ptBR }) : "-";
                          
                          return (
                            <div 
                              key={bill.id} 
                              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-left ${
                                isOverdue 
                                  ? (theme === "dark" ? "bg-red-500/[0.03] border-red-500/30 hover:border-red-500/55" : "bg-red-50/45 border-red-200 hover:border-red-300")
                                  : (theme === "dark" ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-750" : "bg-slate-50 border-slate-150 hover:border-slate-200")
                              }`}
                            >
                              <div className="space-y-1 md:max-w-md">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    isOverdue ? "bg-red-500 text-white animate-pulse" : "bg-amber-500/10 text-amber-500"
                                  }`}>
                                    {isOverdue ? "Atrasado" : "Pendente"}
                                  </span>
                                  {bill.expenseCategory && (
                                    <span className="text-[8px] font-extrabold font-mono uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                                      {bill.expenseCategory}
                                    </span>
                                  )}
                                  {bill.installments > 1 && (
                                    <span className="text-[8px] font-bold font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                                      {bill.installments} Parcela(s)
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-bold text-sm text-gray-200 truncate">{bill.description}</h5>
                                <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                                  <Calendar size={11} className="text-gray-500" />
                                  <span>Vence em: <strong className={isOverdue ? "text-red-400" : "text-amber-400 font-bold"}>{formattedDueDate}</strong></span>
                                </p>
                              </div>

                              <div className="flex flex-col md:items-end justify-between gap-2">
                                <span className={`text-base font-black font-mono tracking-tight ${isOverdue ? "text-red-400" : "text-gray-100"}`}>
                                  {formatCurrency(bill.amount)}
                                </span>
                                
                                {bill.boletoBarcode && (
                                  <button
                                    onClick={() => handleCopyBoleto(bill.id, bill.boletoBarcode)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border font-mono ${
                                      copiedBillId === bill.id
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : (theme === "dark" ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100")
                                    } cursor-pointer`}
                                    title="Copiar código de barras do Boleto"
                                  >
                                    {copiedBillId === bill.id ? (
                                      <>
                                        <Check size={10} className="text-emerald-400" />
                                        <span>Copiado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={10} />
                                        <span>Código Boleto</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Boleto rapid Scan indicator */}
                    {billsData.sortedUrgent.some(b => b.boletoBarcode) && (
                      <div className="mt-4 p-3 rounded-xl bg-orange-500/[0.04] border border-orange-500/20 text-center flex items-center justify-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        <p className="text-[10px] font-extrabold uppercase font-mono text-orange-400 tracking-wider">
                          📸 Leitores Ópticos Ativos: Aponte a câmera para copiar ou ler o código de barras no monitor.
                        </p>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

            {/* 4. MARGEM DE LUCRO SINGLE PANEL */}
            {(currentSlideId === "margem") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className={`md:col-span-2 p-8 rounded-[2rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-2xl space-y-6`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-black uppercase text-emerald-400 tracking-widest font-mono block mb-1">Rendimento Ponderado</span>
                      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Margem de Lucro Média</h2>
                      <p className="text-xs text-gray-400 font-semibold uppercase mt-1">Margem média consolidada obtida sobre o faturamento do grupo.</p>
                    </div>
                    <span className="bg-emerald-500/15 text-emerald-500 p-3 rounded-2xl">
                      <Percent size={28} />
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Margem Líquida Média</span>
                    <h3 className="text-5xl md:text-7xl font-black font-mono tracking-tight text-emerald-400">
                      {dashboardKpis.avgMargem.toFixed(2)}%
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/60">
                    <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 space-y-1">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">🎯 Margem Recomendável</span>
                      <p className="text-lg font-black font-mono text-emerald-400">&gt;= 15.00%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 space-y-1">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">🛡️ Status de Mercado</span>
                      <p className="text-base font-black uppercase text-gray-200">
                        {dashboardKpis.avgMargem >= 15 ? "Excelente 💎" : "Monitorar ⚠️"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Contribution Card */}
                  <div className={`p-6 rounded-[2rem] border ${theme === "dark" ? "bg-emerald-950/10 border-emerald-500/20" : "bg-emerald-50/30 border-emerald-200"} shadow-xl text-left`}>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-extrabold uppercase px-2.5 py-1 rounded-full inline-block font-mono mb-3">
                      ⚡ Alavancagem de Lucro
                    </span>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-wider font-mono">Margem de Contribuição Média</h4>
                    <p className="text-3xl font-black font-mono text-emerald-400 mt-2">
                      {avgProductMargin.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-2">
                      Representa a taxa de conversão líquida direta obtida a cada nova venda de produto/serviço no balcão.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. FULLSCREEN AREA CHART: FATURAMENTO */}
            {currentSlideId === "chart-faturamento" && (
              <div className={`p-8 rounded-[2rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-2xl space-y-4`}>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-800/60">
                  <div className="text-left">
                    <span className="text-xs font-black uppercase text-orange-500 tracking-widest font-mono block">Monitoramento Visual</span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Gráfico de Crescimento de Faturamento</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Faturamento Médio</span>
                    <strong className="text-sm font-black font-mono text-orange-500">
                      {formatCurrency(dashboardKpis.totalReceitas / Math.max(1, dashboardRange))} / mês
                    </strong>
                  </div>
                </div>

                <div className="h-[430px] w-full pt-4 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={dashboardHistoryData} 
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorFaturamentoPop" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#1e202c" : "#e2e8f0"} />
                      <XAxis 
                        dataKey="month" 
                        stroke={theme === "dark" ? "#a1a1aa" : "#475569"} 
                        fontSize={11} 
                        fontWeight="bold" 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke={theme === "dark" ? "#a1a1aa" : "#475569"} 
                        fontSize={11} 
                        fontWeight="bold" 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(v) => `R$ ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} 
                      />
                      <Tooltip
                        formatter={(value: any) => [formatCurrency(Number(value)), "Faturamento"]}
                        contentStyle={{ 
                          backgroundColor: theme === "dark" ? "#18181b" : "#FFFFFF", 
                          color: theme === "dark" ? "#f4f4f5" : "#18181b",
                          borderRadius: "16px", 
                          border: `1px solid ${theme === "dark" ? "#27272a" : "#e2e8f0"}`, 
                          fontSize: "12px", 
                          fontWeight: "bold" 
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="receitas" 
                        stroke="#f97316" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorFaturamentoPop)" 
                        dot={{ r: 4, strokeWidth: 0, fill: "#f97316" }}
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 6. FULLSCREEN AREA CHART: MARGEM */}
            {currentSlideId === "chart-margem" && (
              <div className={`p-8 rounded-[2rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-2xl space-y-4`}>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-800/60">
                  <div className="text-left">
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-widest font-mono block">Monitoramento Visual</span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Gráfico de Evolução da Margem de Lucro (%)</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono block">Margem Média Ponderada</span>
                    <strong className="text-sm font-black font-mono text-emerald-400">
                      {dashboardKpis.avgMargem.toFixed(2)}%
                    </strong>
                  </div>
                </div>

                <div className="h-[430px] w-full pt-4 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={dashboardHistoryData} 
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorMargemPop" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#1e202c" : "#e2e8f0"} />
                      <XAxis 
                        dataKey="month" 
                        stroke={theme === "dark" ? "#a1a1aa" : "#475569"} 
                        fontSize={11} 
                        fontWeight="bold" 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke={theme === "dark" ? "#a1a1aa" : "#475569"} 
                        fontSize={11} 
                        fontWeight="bold" 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(v) => `${v}%`} 
                      />
                      <Tooltip
                        formatter={(value: any) => [`${value}%`, "Margem de Lucro"]}
                        contentStyle={{ 
                          backgroundColor: theme === "dark" ? "#18181b" : "#FFFFFF", 
                          color: theme === "dark" ? "#f4f4f5" : "#18181b",
                          borderRadius: "16px", 
                          border: `1px solid ${theme === "dark" ? "#27272a" : "#e2e8f0"}`, 
                          fontSize: "12px", 
                          fontWeight: "bold" 
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="margemLiquida" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorMargemPop)" 
                        dot={{ r: 4, strokeWidth: 0, fill: "#10b981" }}
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 7. PAINEL COMPLETO DE TV (CONSOLIDADO WALLBOARD) */}
            {currentSlideId === "tv-dashboard" && (
              <div className="space-y-6">
                {/* TOP 5 KEY METRICS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                  
                  {/* CARD 1: REVENUE */}
                  <div className={`p-6 rounded-[1.8rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-xl flex flex-col justify-between space-y-3`}>
                    <div className="space-y-1">
                      <span className="text-[10px] text-orange-500 font-extrabold uppercase font-mono block">Faturamento Consolidado</span>
                      <h4 className="text-2xl font-black font-mono tracking-tight text-orange-500">
                        {formatCurrency(totalIncome)}
                      </h4>
                    </div>
                    <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-gray-400">Var MoM:</span>
                      <span className={`font-mono font-black ${growthColor}`}>
                        {dashboardKpis.growthMoM >= 0 ? "+" : ""}{dashboardKpis.growthMoM.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* CARD 2: EXPENSES */}
                  <div className={`p-6 rounded-[1.8rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-xl flex flex-col justify-between space-y-3`}>
                    <div className="space-y-1">
                      <span className="text-[10px] text-rose-500 font-extrabold uppercase font-mono block">Saídas & Despesas Totais</span>
                      <h4 className="text-2xl font-black font-mono tracking-tight text-rose-500">
                        -{formatCurrency(totalExpense)}
                      </h4>
                    </div>
                    <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-gray-400">OPEX Fixo:</span>
                      <span className="text-sky-400 font-mono font-black">
                        {formatCurrency(totalOpexExpense)}
                      </span>
                    </div>
                  </div>

                  {/* CARD 3: NET PROFIT */}
                  <div className={`p-6 rounded-[1.8rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-xl flex flex-col justify-between space-y-3`}>
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase font-mono block">Lucro Líquido Real</span>
                      <h4 className={`text-2xl font-black font-mono tracking-tight ${balanceVal >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                        {formatCurrency(balanceVal)}
                      </h4>
                    </div>
                    <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-gray-400">Eficiência de Caixa:</span>
                      <span className={`font-mono font-black ${balanceVal >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                        {balanceVal >= 0 ? "SUPERAVIT" : "DÉFICIT"}
                      </span>
                    </div>
                  </div>

                  {/* CARD 4: PROFIT MARGIN */}
                  <div className={`p-6 rounded-[1.8rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-xl flex flex-col justify-between space-y-3`}>
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase font-mono block">Margem de Lucro Média</span>
                      <h4 className="text-2xl font-black font-mono tracking-tight text-emerald-400">
                        {dashboardKpis.avgMargem.toFixed(2)}%
                      </h4>
                    </div>
                    <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-gray-400">Status Geral:</span>
                      <span className={`font-mono font-black ${dashboardKpis.avgMargem >= 15 ? "text-emerald-400" : "text-amber-500"}`}>
                        {dashboardKpis.avgMargem >= 15 ? "EXCELENTE" : "ALERTA"}
                      </span>
                    </div>
                  </div>

                  {/* CARD 5: ACCOUNTS PAYABLE (NEW TO WALLBOARD) */}
                  <div className={`p-6 rounded-[1.8rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-xl flex flex-col justify-between space-y-3`}>
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-500 font-extrabold uppercase font-mono block">Boletos & Contas a Pagar</span>
                      <h4 className={`text-2xl font-black font-mono tracking-tight ${billsData.overdueCount > 0 ? "text-red-400 animate-pulse" : "text-amber-500"}`}>
                        {formatCurrency(billsData.totalUnpaidAmount)}
                      </h4>
                    </div>
                    <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-gray-400">Vencidos/Atrasados:</span>
                      <span className={`font-mono font-black ${billsData.overdueCount > 0 ? "text-red-400" : "text-gray-400"}`}>
                        {billsData.overdueCount} contas
                      </span>
                    </div>
                  </div>

                </div>

                {/* DOUBLE CHART ROW WITH REAL-TIME UPLINK TELEMETRY */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Chart 1: Revenue */}
                  <div className={`col-span-1 lg:col-span-5 p-6 rounded-[2rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-xl space-y-3 text-left`}>
                    <h5 className="text-sm font-black uppercase text-gray-300 tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                      Curva Temporal de Faturamento (R$)
                    </h5>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardHistoryData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorFaturamentoTv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#1e202c" : "#e2e8f0"} />
                          <XAxis dataKey="month" stroke="#71717a" fontSize={9} fontWeight="bold" tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                          <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), "Faturamento"]} contentStyle={{ backgroundColor: theme === "dark" ? "#18181b" : "#FFFFFF", border: "none", fontSize: "11px" }} />
                          <Area type="monotone" dataKey="receitas" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturamentoTv)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Margins */}
                  <div className={`col-span-1 lg:col-span-4 p-6 rounded-[2rem] border ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-xl space-y-3 text-left`}>
                    <h5 className="text-sm font-black uppercase text-gray-300 tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      Curva Temporal de Margem de Lucro (%)
                    </h5>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardHistoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorMargemTv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#1e202c" : "#e2e8f0"} />
                          <XAxis dataKey="month" stroke="#71717a" fontSize={9} fontWeight="bold" tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                          <Tooltip formatter={(value: any) => [`${value}%`, "Margem"]} contentStyle={{ backgroundColor: theme === "dark" ? "#18181b" : "#FFFFFF", border: "none", fontSize: "11px" }} />
                          <Area type="monotone" dataKey="margemLiquida" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMargemTv)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Widget: Live Sync Telemetry */}
                  <div className={`col-span-1 lg:col-span-3 p-6 rounded-[2rem] border flex flex-col justify-between ${theme === "dark" ? "bg-[#111218] border-zinc-800/80" : "bg-white border-slate-200"} shadow-xl space-y-4 text-left relative overflow-hidden`}>
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-black uppercase tracking-widest text-orange-500 font-mono flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isAutoSyncActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`} />
                          UPLINK EM TEMPO REAL
                        </h5>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                          isUploading 
                            ? "bg-amber-500/10 text-amber-400 animate-pulse" 
                            : isAutoSyncActive 
                              ? "bg-emerald-500/10 text-emerald-400" 
                              : "bg-zinc-500/10 text-zinc-400"
                        }`}>
                          {isUploading ? "TRANSMITINDO..." : isAutoSyncActive ? "ATIVO" : "PAUSADO"}
                        </span>
                      </div>

                      {/* Connection Signal */}
                      <div className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
                        theme === "dark" 
                          ? "bg-zinc-950/40 border-zinc-850" 
                          : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Zap size={14} className={isUploading ? "text-amber-400 animate-bounce" : "text-orange-500"} />
                          </div>
                          <span className="font-extrabold uppercase text-[9px] tracking-wider text-gray-400 font-mono">Status Cloud:</span>
                        </div>
                        <span className="font-mono text-[10px] font-black text-emerald-400">
                          {isDemoMode ? "SIMULADOR ATIVO" : "CONEXÃO SECURE"}
                        </span>
                      </div>

                      {/* Timer Loop progress bar */}
                      {isAutoSyncActive && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-400 uppercase font-mono tracking-wider">Novo Lançamento em:</span>
                            <span className="text-orange-400 font-mono font-black animate-pulse">{countdown}s</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-zinc-900" : "bg-slate-100"}`}>
                            <div 
                              className="h-full bg-orange-500 transition-all ease-linear"
                              style={{ width: `${(countdown / autoSyncInterval) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Sync History Logs */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase font-mono tracking-widest block leading-none">FEED DE SUBIDA RECENTE</span>
                        <div className={`rounded-xl p-2.5 space-y-1.5 overflow-hidden ${theme === "dark" ? "bg-zinc-950/60" : "bg-slate-50/80"} min-h-[90px]`}>
                          {uploadedFeed.length === 0 ? (
                            <div className="h-[90px] flex flex-col items-center justify-center text-center space-y-1 text-zinc-500">
                              <span className="text-[10px] font-bold">Nenhum upload automático registrado.</span>
                              <span className="text-[8.5px] font-medium leading-normal max-w-[150px]">Aguarde o timer ou force um upload de teste!</span>
                            </div>
                          ) : (
                            uploadedFeed.slice(0, 3).map((f) => (
                              <div key={f.id} className="flex items-center justify-between text-[10px] leading-tight font-mono py-1 border-b border-zinc-900/45 last:border-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.isIncome ? "bg-emerald-500" : "bg-rose-500"}`} />
                                  <span className="text-gray-300 truncate max-w-[90px] font-bold uppercase">{f.description}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`font-black ${f.isIncome ? "text-emerald-400" : "text-rose-500"}`}>
                                    {f.isIncome ? "+" : "-"}{formatCurrency(f.amount)}
                                  </span>
                                  <span className="text-zinc-500 text-[8px] block">{f.time}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Trigger Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/50">
                      <button
                        onClick={() => {
                          try {
                            if (sound && sound.playClick) sound.playClick();
                          } catch (err) {}
                          setIsAutoSyncActive(!isAutoSyncActive);
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-[9px] font-black uppercase text-center transition-all cursor-pointer ${
                          isAutoSyncActive 
                            ? (theme === "dark" ? "bg-zinc-900 border-zinc-800 text-amber-500" : "bg-amber-50 border-amber-200 text-amber-700")
                            : (theme === "dark" ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-orange-100 border-orange-300 text-orange-700")
                        }`}
                      >
                        {isAutoSyncActive ? "PAUSAR TIMER" : "ATIVAR TIMER"}
                      </button>
                      <button
                        onClick={() => {
                          triggerAutoUpload();
                        }}
                        disabled={isUploading}
                        className={`py-1.5 px-2 rounded-lg text-white text-[9px] font-black uppercase text-center transition-all cursor-pointer bg-orange-500 hover:bg-orange-600`}
                      >
                        {isUploading ? "SINC..." : "FORÇAR UPLOAD"}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* DYNAMIC MARQUEE TICKER INSIGHTS BAR */}
      <footer className={`py-3.5 border-t ${theme === "dark" ? "bg-[#08090d] border-zinc-850/80" : "bg-white border-slate-200"} select-none`}>
        <div className="w-full overflow-hidden relative flex items-center">
          <div className="absolute left-0 top-0 bottom-0 px-4 bg-orange-500 text-white font-black text-[10px] tracking-widest flex items-center uppercase z-10 shadow-lg">
            🚨 DIRETRIZES CONTÁBEIS DAFNE AI
          </div>
          
          <div className="flex whitespace-nowrap animate-marquee font-mono font-bold text-xs uppercase tracking-wider text-orange-400">
            {marqueeInsights.map((ins, idx) => (
              <span key={idx} className="mx-8 flex items-center gap-2">
                <span>{ins}</span>
                <span className="text-gray-600">•</span>
              </span>
            ))}
          </div>

          <div className="absolute right-0 top-0 bottom-0 px-4 bg-zinc-950 text-white font-black text-[10px] font-mono flex items-center gap-1.5 z-10 border-l border-zinc-850">
            <span>SINC: AUTOMÁTICA</span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
