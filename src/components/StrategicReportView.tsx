import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { AbntPdfDocument } from "../utils/pdfAbntHelper";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";
import { 
  Sparkles, 
  Target, 
  Download, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Bot, 
  ChevronRight, 
  TrendingUp, 
  LineChart, 
  Coins, 
  Activity, 
  CheckCircle2, 
  FileText,
  AlertCircle,
  Loader2,
  Percent,
  Shield,
  Info,
  ReceiptText,
  Brain,
  HelpCircle,
  ArrowRight,
  Gauge,
  Square,
  Volume2,
  Cpu,
  Database,
  Building2,
  Zap
} from "lucide-react";
import { cn } from "../lib/utils";
import { sound } from "../utils/SoundEngine";
import { OperationalAuditView } from "./OperationalAuditView";
import { MonthlyAuditView } from "./MonthlyAuditView";
import { StoresConsolidationSubView } from "./StoresConsolidationSubView";
import { StrategicCockpitView } from "./StrategicCockpitView";
import BestTechnologySeal from "./BestTechnologySeal";

// Custom small Markdown solver to avoid external library dependency issues
const QuickMarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-3.5 text-xs md:text-sm text-slate-300 leading-relaxed font-sans text-left">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return <h4 key={idx} className="text-sm font-black text-orange-200 mt-5 mb-2 uppercase tracking-wide border-l-2 border-orange-500 pl-2">{trimmed.replace("###", "").trim()}</h4>;
        }
        if (trimmed.startsWith("##")) {
          return <h3 key={idx} className="text-base font-black text-white mt-6 mb-2.5 uppercase tracking-tight flex items-center gap-1.5"><Sparkles size={14} className="text-orange-400" />{trimmed.replace("##", "").trim()}</h3>;
        }
        if (trimmed.startsWith("#")) {
          return <h2 key={idx} className="text-lg font-black text-orange-100 mt-7 mb-3 uppercase tracking-tighter border-b border-white/10 pb-1.5">{trimmed.replace("#", "").trim()}</h2>;
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-orange-400 mt-1.5 shrink-0">•</span>
              <span>{trimmed.substring(1).trim()}</span>
            </div>
          );
        }
        if (trimmed === "") return <div key={idx} className="h-2" />;
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
};

interface StrategicReportViewProps {
  onNavigateToCofrinho?: () => void;
  analyticsView?: React.ReactNode;
  planningView?: React.ReactNode;
}

export const StrategicReportView: React.FC<StrategicReportViewProps> = ({ 
  onNavigateToCofrinho,
  analyticsView,
  planningView
}) => {
  const {
    transactions,
    categories,
    storeProfiles,
    activeStoreId,
    products,
    getDRE,
    showToast,
    profile,
    updateProfile,
    isDemoMode,
    trackDemoInteraction
  } = useFinance();

  // Primary Workspace tab switcher
  const [activeSubTab, setActiveSubTab] = useState<"dre" | "cockpit-decisoes" | "simulator" | "ai-advisor" | "analytics" | "plans" | "reports" | "tax-panel" | "operational-audit" | "monthly-audit" | "stores">("dre");

  // Corporate Brand Customization States
  const [selectedThemePreset, setSelectedThemePreset] = useState<string>("ocean");
  const [brandPrimary, setBrandPrimary] = useState<{ r: number; g: number; b: number }>({ r: 30, g: 64, b: 175 }); // Royal Blue
  const [brandSecondary, setBrandSecondary] = useState<{ r: number; g: number; b: number }>({ r: 16, g: 185, b: 129 }); // Emerald Green

  // Tax planning module state variables
  const [taxMonthlyRevenue, setTaxMonthlyRevenue] = useState<number>(45000);
  const [taxPayroll, setTaxPayroll] = useState<number>(12600);
  const [taxActivity, setTaxActivity] = useState<"saas" | "servicos" | "comercio" | "industria">("saas");
  const [monofasicoPct, setMonofasicoPct] = useState<number>(20); // 20% default monofasico goods share
  const [monofasicoYears, setMonofasicoYears] = useState<number>(5); // 5 years to recover
  const [loadingTaxReport, setLoadingTaxReport] = useState<boolean>(false);
  const [taxAIReport, setTaxAIReport] = useState<string | null>(null);

  // DRE State
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showCmvTooltip, setShowCmvTooltip] = useState(false);
  const [dreViewMode, setDreViewMode] = useState<"table" | "chart">("table");
  const [isExportingDRE, setIsExportingDRE] = useState(false);
  const [compareMonthA, setCompareMonthA] = useState<Date>(subMonths(new Date(), 1));
  const [compareMonthB, setCompareMonthB] = useState<Date>(new Date());
  const [compareMonthC, setCompareMonthC] = useState<Date | null>(subMonths(new Date(), 2));
  const dreReportRef = useRef<HTMLDivElement>(null);

  // AI Diagnostic report caching/state
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [isSpeakingReport, setIsSpeakingReport] = useState<boolean>(false);
  const [isSpeakingTaxReport, setIsSpeakingTaxReport] = useState<boolean>(false);

  // Stop vocal speech upon component unmount or sub-tab switch to prevent floating background voices
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Cancel speech dynamically if user switches subtab inside StrategicReport
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingReport(false);
    setIsSpeakingTaxReport(false);
  }, [activeSubTab]);

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[*#_`~[\]]/g, "") // remove markdown structure symbols for natural pronunciation
      .replace(/[-•]\s*/g, " ")   // convert lists bullet marks to smooth spaces
      .replace(/R\$\s*([0-9.,]+)/g, "$1 Reais") // friendly real brazilian currency pronunciation
      .replace(/\%/g, " por cento") // pronounce percentages smoothly
      .trim();
  };

  const handleToggleSpeech = (textToSpeak: string, isTax: boolean) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      showToast("Seu navegador não oferece suporte para síntese de voz (SpeechSynthesis).", "warning");
      return;
    }

    const currentlySpeaking = isTax ? isSpeakingTaxReport : isSpeakingReport;

    if (currentlySpeaking) {
      window.speechSynthesis.cancel();
      if (isTax) setIsSpeakingTaxReport(false);
      else setIsSpeakingReport(false);
      showToast("Leitura do relatório interrompida.", "info");
      return;
    }

    // Cancel any active voice to start a new one cleanly
    window.speechSynthesis.cancel();
    if (isTax) {
      setIsSpeakingReport(false);
    } else {
      setIsSpeakingTaxReport(false);
    }

    const cleanedText = cleanTextForSpeech(textToSpeak);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = "pt-BR";

    // Read pitch, rate, and voice name pre-configured by user or fallback
    const savedPitch = localStorage.getItem("dafne_voice_pitch");
    const savedRate = localStorage.getItem("dafne_voice_rate");
    const savedVoiceName = localStorage.getItem("dafne_selected_voice") || "";

    utterance.rate = savedRate ? parseFloat(savedRate) : 1.10;
    utterance.pitch = savedPitch ? parseFloat(savedPitch) : 1.15;

    // Resolve pt-BR voice from platform native options
    const availableVoices = window.speechSynthesis.getVoices();
    const ptBrVoices = availableVoices.filter(v => 
      v.lang.toLowerCase().includes("pt-br") || 
      v.lang.toLowerCase().startsWith("pt")
    );

    let chosenVoice: SpeechSynthesisVoice | null = null;
    if (ptBrVoices.length > 0) {
      if (savedVoiceName) {
        chosenVoice = ptBrVoices.find(v => v.name === savedVoiceName) || null;
      }
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
      if (!chosenVoice) {
        chosenVoice = ptBrVoices[0];
      }
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => {
      if (isTax) setIsSpeakingTaxReport(true);
      else setIsSpeakingReport(true);
    };
    utterance.onend = () => {
      if (isTax) setIsSpeakingTaxReport(false);
      else setIsSpeakingReport(false);
    };
    utterance.onerror = () => {
      if (isTax) setIsSpeakingTaxReport(false);
      else setIsSpeakingReport(false);
    };

    window.speechSynthesis.speak(utterance);
    showToast(`A mentora Dafne iniciou a leitura do diagnóstico ${isTax ? "fiscal" : "financeiro"}.`, "info");
  };

  // Strategic projections / simulator parameters
  const [stratPlan, setStratPlan] = useState<"opex" | "revenue" | "cmv">("opex");
  const [stratEfficacy, setStratEfficacy] = useState<number>(50);
  const [stressScenario, setStressScenario] = useState<"none" | "recession" | "inflation" | "supply_shock" | "bull_market">("none");

  // Generate Months List representing trailing 12 months for select dropdown
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => subMonths(new Date(), i)), []);

  // Format currency wrapper
  const rawFormatCurrency = (val: number) => {
    return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Safe parameters extraction for calculations based on activeStore / selected filtered transactions
  const activeTxs = useMemo(() => {
    return transactions;
  }, [transactions]);

  // Derive historical metrics dynamically
  const income = useMemo(() => {
    return activeTxs
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [activeTxs]);

  const expense = useMemo(() => {
    return activeTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [activeTxs]);

  const balance = income - expense;
  const histMargin = income > 0 ? (balance / income) * 100 : 0;

  // Sync with actual financial averages when average values are derived
  useEffect(() => {
    if (income > 0) {
      setTaxMonthlyRevenue(Math.round(income / 12) || 45000);
    }
    if (expense > 0) {
      setTaxPayroll(Math.round((expense * 0.28) / 12) || 12600);
    }
  }, [income, expense]);

  // Active Store Label formatted
  const getActiveStoreLabel = () => {
    if (activeStoreId === "all") return "Consolidado Geral (Todas Filiais)";
    const pt = storeProfiles.find((s) => s.id === activeStoreId);
    return pt ? pt.companyName : "Filial Selecionada";
  };

  // Subscription check
  const isPremium = useMemo(() => {
    return (
      isDemoMode ||
      profile?.subscriptionPlan === "pro" ||
      profile?.subscriptionPlan === "annual"
    );
  }, [isDemoMode, profile]);

  // Strategic projections formulas based on plan type selection & execution efficacy
  let strategyIncome = income;
  let strategyExpense = expense;
  if (stratPlan === "opex") {
    // Up to 15% reduction in OPEX at 100% efficacy
    strategyExpense = expense - (expense * 0.15 * (stratEfficacy / 100));
  } else if (stratPlan === "revenue") {
    // Up to 20% increase in revenue with 30% incremental costs for fulfillment
    const growth = income * 0.20 * (stratEfficacy / 100);
    strategyIncome = income + growth;
    strategyExpense = expense + (growth * 0.30);
  } else if (stratPlan === "cmv") {
    // Up to 8% cost optimization on total CMV / operating cost
    strategyExpense = expense - (expense * 0.08 * (stratEfficacy / 100));
  }

  // Apply macro stress shock on top of strategy performance
  let projIncome = strategyIncome;
  let projExpense = strategyExpense;

  if (stressScenario === "recession") {
    // Recessão: Reduz faturamento em 20%, custos logísticos aumentam 5%
    projIncome = strategyIncome * 0.80;
    projExpense = strategyExpense * 1.05;
  } else if (stressScenario === "inflation") {
    // Inflação: Aumenta despesas gerais operacionais em 15%
    projExpense = strategyExpense * 1.15;
  } else if (stressScenario === "supply_shock") {
    // Choque de CMV: Aumenta insumos/despesas em 20%
    projExpense = strategyExpense * 1.20;
  } else if (stressScenario === "bull_market") {
    // Boom de mercado: Faturamento +25%, OPEX de marketing +10%
    projIncome = strategyIncome * 1.25;
    projExpense = strategyExpense * 1.10;
  }

  const projBalance = projIncome - projExpense;
  const projMargin = projIncome > 0 ? (projBalance / projIncome) * 100 : 0;

  // Assumed liquid safety buffer for runway
  const bufferReserve = 75000;
  const histRunway = expense > 0 ? (bufferReserve + (balance > 0 ? balance : 0)) / expense : 12;
  const projRunway = projExpense > 0 ? (bufferReserve + (projBalance > 0 ? projBalance : 0)) / projExpense : 12;

  // Resiliency Score calculation
  const resiliencyScore = useMemo(() => {
    if (projRunway >= 18 && projBalance > 0) {
      return { 
        grade: "AAA", 
        title: "Soberano", 
        desc: "Excepcional blindagem de giro. Altíssima capacidade de neutralizar crises e investir.", 
        colorClass: "text-emerald-500 border-emerald-500/50 bg-emerald-500/10", 
        textColor: "text-emerald-400",
        prob: "99%",
        rec: "Cenário altamente seguro. Mantenha os aportes regulares no Cofrinho Inteligente para perenidade sustentável."
      };
    }
    if (projRunway >= 12) {
      return { 
        grade: "AA", 
        title: "Excelente", 
        desc: "Fluxo confortável. Elevado nível de autossuficiência e resiliência financeira.", 
        colorClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5", 
        textColor: "text-emerald-400",
        prob: "95%",
        rec: "Balanço robusto. Parcela do caixa excedente pode ser designada a testes de novos canais de faturamento."
      };
    }
    if (projRunway >= 8) {
      return { 
        grade: "A", 
        title: "Forte", 
        desc: "Margem operacional sadia. Baixa suscetibilidade a oscilações normais de mercado.", 
        colorClass: "text-teal-400 border-teal-500/30 bg-teal-500/5", 
        textColor: "text-teal-400",
        prob: "88%",
        rec: "Mantenha rigor com contas de fornecedores e busque otimizações incrementais no CMV unitário."
      };
    }
    if (projRunway >= 6) {
      return { 
        grade: "BBB", 
        title: "Sustentável", 
        desc: "Capacidade adequada. Estrutura equilibrada, mas vulnerável a recessões profundas.", 
        colorClass: "text-amber-400 border-amber-500/30 bg-amber-500/5", 
        textColor: "text-amber-400",
        prob: "75%",
        rec: "Acione auditorias de despesas fixas (OPEX) não essenciais para resguardar ao menos 12 meses de sobrevida."
      };
    }
    if (projRunway >= 4) {
      return { 
        grade: "BB", 
        title: "Vulnerável", 
        desc: "Nível especulativo de insolvência. Flutuações de CMV põem as operações sob estresse.", 
        colorClass: "text-orange-400 border-orange-500/30 bg-orange-500/5", 
        textColor: "text-orange-400",
        prob: "55%",
        rec: "Seu caixa está encurtando. Reduza custos administrativos e antecipe faturas de recebíveis sem desconto agressivo."
      };
    }
    if (projRunway >= 2) {
      return { 
        grade: "B", 
        title: "Risco Alto", 
        desc: "Margem de giro perigosamente estreita. Probabilidade acentuada de aperto fiscal.", 
        colorClass: "text-rose-400 border-rose-500/20 bg-rose-500/5", 
        textColor: "text-rose-400",
        prob: "35%",
        rec: "Atenção máxima: acione o Plano de Redução Crítica de Opex e busque faturamentos imediatos de alta margem."
      };
    }
    return { 
      grade: "C/D", 
      title: "Insolvência Crítica", 
      desc: "Autossuficiência severamente comprometida. Alerta de insolvência sem injeção urgente de giro.", 
      colorClass: "text-rose-500 border-rose-600 bg-rose-500/10 animate-pulse", 
      textColor: "text-rose-500",
      prob: "15%",
      rec: "Insolvência iminente sob este cenário de estresse. Requer renegociação emergencial de passivos e aporte de capital."
    };
  }, [projRunway, projBalance]);

  // Brazilian tax planning helper calculations
  const calcSimplesNacional = (monthlyRevenue: number, payroll: number, activity: "saas" | "servicos" | "comercio" | "industria") => {
    const annualRevenue = monthlyRevenue * 12;
    let baseRate = 0;
    let deduction = 0;
    let annex = "I";
    let explanation = "";

    if (activity === "comercio") {
      annex = "Anexo I (Comércio)";
      if (annualRevenue <= 180000) { baseRate = 0.04; deduction = 0; }
      else if (annualRevenue <= 360000) { baseRate = 0.073; deduction = 5940; }
      else if (annualRevenue <= 720000) { baseRate = 0.095; deduction = 13860; }
      else if (annualRevenue <= 1800000) { baseRate = 0.107; deduction = 22500; }
      else if (annualRevenue <= 3600000) { baseRate = 0.143; deduction = 87300; }
      else { baseRate = 0.19; deduction = 378000; }
      explanation = "Tributação sobre o faturamento bruto de vendas físicas ou virtuais.";
    } else if (activity === "industria") {
      annex = "Anexo II (Indústria)";
      if (annualRevenue <= 180000) { baseRate = 0.045; deduction = 0; }
      else if (annualRevenue <= 360000) { baseRate = 0.078; deduction = 5940; }
      else if (annualRevenue <= 720000) { baseRate = 0.10; deduction = 13860; }
      else if (annualRevenue <= 1800000) { baseRate = 0.112; deduction = 22500; }
      else if (annualRevenue <= 3600000) { baseRate = 0.147; deduction = 87300; }
      else { baseRate = 0.30; deduction = 720000; }
      explanation = "Tributação sobre faturamento industrial, com IPI embutido.";
    } else {
      // Services or SaaS (SaaS is Service)
      // SaaS and tech-enabled services can fall under Anexo III or Anexo V.
      // This is determined by Fator R: payroll / revenue
      const factorR = monthlyRevenue > 0 ? (payroll / monthlyRevenue) : 0;
      const isAnexoIIIEligible = factorR >= 0.28;

      if (activity === "saas" || isAnexoIIIEligible) {
        annex = isAnexoIIIEligible ? "Anexo III (Serviços - Fator R Ativo)" : "Anexo III (SaaS - Otimizado)";
        if (annualRevenue <= 180000) { baseRate = 0.06; deduction = 0; }
        else if (annualRevenue <= 360000) { baseRate = 0.112; deduction = 9360; }
        else if (annualRevenue <= 720000) { baseRate = 0.135; deduction = 17640; }
        else if (annualRevenue <= 1800000) { baseRate = 0.16; deduction = 35640; }
        else if (annualRevenue <= 3600000) { baseRate = 0.21; deduction = 125640; }
        else { baseRate = 0.33; deduction = 648000; }
        explanation = isAnexoIIIEligible 
          ? `Alíquota reduzida devido ao seu Fator R ser de ${(factorR * 100).toFixed(1)}% (mínimo de 28%). Economia real substancial!`
          : "Serviços sob alíquota base otimizada de 6%.";
      } else {
        annex = "Anexo V (Serviços - Fator R Inativo)";
        if (annualRevenue <= 180000) { baseRate = 0.155; deduction = 0; }
        else if (annualRevenue <= 360000) { baseRate = 0.18; deduction = 4500; }
        else if (annualRevenue <= 720000) { baseRate = 0.195; deduction = 9900; }
        else if (annualRevenue <= 1800000) { baseRate = 0.205; deduction = 17100; }
        else if (annualRevenue <= 3600000) { baseRate = 0.23; deduction = 62100; }
        else { baseRate = 0.305; deduction = 540000; }
        explanation = `Alíquota desonesta devido ao seu Fator R ser de ${(factorR * 100).toFixed(1)}% (abaixo de 28%). Recomenda-se elevar seu Pró-labore para economizar impostos!`;
      }
    }

    // Nominal vs Effective rate: Effective rate = (cumulative * rate - deduction) / cumulative
    let effectiveRate = annualRevenue > 0 ? ((annualRevenue * baseRate - deduction) / annualRevenue) : baseRate;
    if (effectiveRate < 0.04) effectiveRate = 0.04; // Floor rate
    
    // Simples Nacional has a ceiling of 4.8 million annual
    const isExceeded = annualRevenue > 4800000;

    const taxAmount = monthlyRevenue * effectiveRate;
    return {
      taxAmount: isExceeded ? monthlyRevenue * 0.25 : taxAmount, // fallback
      effectiveRate: isExceeded ? 0.25 : effectiveRate,
      annex,
      explanation,
      isExceeded
    };
  };

  const calcLucroPresumido = (monthlyRevenue: number, activity: "saas" | "servicos" | "comercio" | "industria") => {
    let effectiveRate = 0;
    let description = "";

    if (activity === "comercio" || activity === "industria") {
      effectiveRate = 0.1193; // 11.93% estimate
      description = "Alíquota fixada incluindo PIS/COFINS cumulativos (3.65%), IRPJ/CSLL presumidos (2.28%) e ICMS médio estimado de 6.0%.";
    } else {
      effectiveRate = 0.1433; // 14.33% standard
      description = "Alíquota composta de PIS/COFINS (3.65%), ISS (3.0%) e IRPJ/CSLL presumidos sobre presunção fiscal de 32% (7.68%).";
    }

    return {
      taxAmount: monthlyRevenue * effectiveRate,
      effectiveRate,
      description
    };
  };

  const calcLucroReal = (monthlyRevenue: number, payroll: number, activity: "saas" | "servicos" | "comercio" | "industria") => {
    const estimatedMargin = (activity === "comercio" || activity === "industria") ? 0.08 : 0.18;
    const preTaxProfit = monthlyRevenue * estimatedMargin;
    
    const pisCofinsRate = 0.055; // 5.5% effective on gross (with inputs credits)
    const irpjRate = 0.15;
    const csllRate = 0.09;
    
    const irpjSub = preTaxProfit * irpjRate;
    const irpsExcesso = preTaxProfit > 20000 ? (preTaxProfit - 20000) * 0.10 : 0;
    const csllSub = preTaxProfit * csllRate;
    const pisCofinsSub = monthlyRevenue * pisCofinsRate;

    const totalTax = irpjSub + irpsExcesso + csllSub + pisCofinsSub;
    const effectiveRate = monthlyRevenue > 0 ? (totalTax / monthlyRevenue) : 0;

    return {
      taxAmount: totalTax,
      effectiveRate,
      description: `Simulado sob margem operacional real de ${(estimatedMargin * 100).toFixed(0)}%. Deduz IRPJ (15%), adicional (10%), CSLL (9%) e PIS/COFINS não-cumulativo.`
    };
  };

  // Group expenses for the telemetry AI payload
  const categoryGroupExpenses = useMemo(() => {
    return activeTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const group = cat?.group || "OPEX";
        acc[group] = (acc[group] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [activeTxs, categories]);

  // Extract Top 5 critical categories
  const topExpenseCategories = useMemo(() => {
    const catAmountsMap = activeTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const name = cat?.name || "Outros";
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(catAmountsMap)
      .map(([name, amount]) => ({ name, amount: Number(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [activeTxs, categories]);

  // Fetch AI Report advisor from Express endpoint
  const fetchAiReport = async (force = false) => {
    const hashKey = `fs_${income}_${expense}_${balance}_${activeTxs.length}_${categories.length}_0.7_pro_strat`;
    
    // Check local cache
    if (!force) {
      try {
        const cached = sessionStorage.getItem(hashKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          if (cachedData.report) {
            setReport(cachedData.report);
            return;
          }
        }
      } catch (e) {
        console.error("Cache read failed", e);
      }
    }

    setLoadingReport(true);
    try {
      const response = await fetch("/api/ai/financial-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            totalIncome: income,
            totalExpense: expense,
            balance: balance,
            goals: [],
            dre: getDRE(selectedMonth),
            categoryGroupExpenses,
            topExpenseCategories,
            companyName: getActiveStoreLabel(),
            products: products,
            businessSegment: localStorage.getItem("dafne_business_segment") || "other",
            businessNicheDetail: localStorage.getItem("dafne_business_niche_detail") || "",
          },
          neuralPrecision: 0.7,
          neuralTier: "pro",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na requisição da API de IA");
      }

      const responseData = await response.json();
      const fetchedReport = responseData.report || "Nenhum relatório pôde ser gerado pela assessoria no momento.";
      setReport(fetchedReport);
      
      try {
        sessionStorage.setItem(hashKey, JSON.stringify({ report: fetchedReport }));
      } catch (e) {
        console.error("Cache write failed", e);
      }
    } catch (err) {
      console.error("Erro ao sincronizar assessoria:", err);
      // Failover fallback reporting
      setReport(
        `### Diagnóstico Rápido de Contingência (Dafne AI)\n` +
        `Olá, aqui é a Dafne! Devido a uma interrupção temporária na conexão, estruturei este parecer de fôlego com base nos logs correntes do seu faturamento bruto de **${rawFormatCurrency(income)}** contra saídas globais avaliadas em **${rawFormatCurrency(expense)}**.\n\n` +
        `- **Sobras de Caixa:** Atualmente acumula saldo positivo de **${rawFormatCurrency(balance)}**, gerando uma margem líquida real estável de **${histMargin.toFixed(1)}%**.\n` +
        `- **Indicador de Sustentabilidade:** Considerando a liquidez imediata ideal, seu fôlego operacional estimado (Runway) está em **${histRunway.toFixed(1)} meses**, resguardado pela reserva de blindagem.\n\n` +
        `### Recomendações e Plano de Ação Prático\n` +
        `1. **Controle de Alocação:** Destine parcelas líquidas de imediato ao seu Cofrinho Inteligente para rentabilizar ativos redundantes.\n` +
        `2. **Auditoria de Custo de Serviço (CMV):** Busque a renegociação de Skus ativos com fornecedores primários do segmento para recompor suas margens de lucro.`
      );
      if (showToast) {
        showToast("Apresentando fallback local de diagnóstico financeiro temporário.", "warning");
      }
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchAiReport();
  }, [activeStoreId, income, expense, activeTxs.length, selectedMonth]);

  // Action: Export Structured Monthly DRE standard table directly using toPng & jsPDF
  const exportDREToPDF = async () => {
    if (!dreReportRef.current) return;
    setIsExportingDRE(true);
    if (trackDemoInteraction) trackDemoInteraction();
    if (showToast) showToast("Gerando arquivo PDF consolidado sob as normas executivas. Aguarde...", "info");

    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const element = dreReportRef.current;
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const imgWidth = pdfWidth;
      const imgHeight = (img.height * pdfWidth) / img.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Draw first page
      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Handle multiline/pagination cleanly if DRE content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(
        `DRE_Certificado_${profile?.companyName || "Empresa"}_${format(selectedMonth, "MM_yyyy")}.pdf`
      );
      if (showToast) showToast("Demonstrativo DRE exportado em PDF com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      if (showToast) showToast("Erro técnico na captação visual do DRE. Tente novamente.", "error");
    } finally {
      setIsExportingDRE(false);
    }
  };

  // Theme Presets and RGB Hex Converters
  const THEME_PRESETS = [
    { id: "ocean", name: "Ocean Tech (Azul/Verde)", primary: { r: 30, g: 64, b: 175 }, secondary: { r: 16, g: 185, b: 129 } },
    { id: "orange", name: "MaxPerformance (Slate/Laranja)", primary: { r: 15, g: 23, b: 42 }, secondary: { r: 249, g: 115, b: 22 } },
    { id: "emerald", name: "Green Wealth (Floresta/Esmeralda)", primary: { r: 6, g: 95, b: 70 }, secondary: { r: 16, g: 185, b: 129 } },
    { id: "royal", name: "Sovereign Gold (Roxo/Dourado)", primary: { r: 88, g: 28, b: 135 }, secondary: { r: 234, g: 179, b: 8 } },
    { id: "crimson", name: "Venture Crimson (Vinho/Rosa)", primary: { r: 127, g: 29, b: 29 }, secondary: { r: 253, g: 164, b: 175 } },
  ];

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 15, g: 23, b: 42 };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Action: Export Comprehensive Across-Fronts General PDF Report supporting ABNT and Customized Branding Styles
  const exportFullComprehensivePDF = (isAbnt: boolean) => {
    if (trackDemoInteraction) trackDemoInteraction();
    if (showToast) showToast(`Gerando Relatório de Todas as Frentes (${isAbnt ? "Normas ABNT" : "Personalizado"}). Aguarde...`, "info");

    const pdf = new AbntPdfDocument({
      isAbntStandard: isAbnt,
      primaryColor: brandPrimary,
      secondaryColor: brandSecondary
    });

    const companyLabel = getActiveStoreLabel();

    // 1. Capa do Relatório
    pdf.drawCover(
      companyLabel,
      isAbnt ? "RELATÓRIO FINANCEIRO ACROSS-FRONTS DE CONFORMIDADE" : "DIAGNÓSTICO E PERFORMANÇA CORPORATIVA INTEGRADA",
      "Auditoria Geral de Fluxo de Caixa, DRE Geral, Margens SKU, Valuation e Diretrizes I.A.",
      "DIRETORIA DE ADMINISTRAÇÃO, FINANÇAS E TECNOLOGIA"
    );

    // 2. Seção 1: Indicadores e Saúde Financeira Geral (General Balance, Cash, and Runway metrics)
    pdf.addPrimaryHeading("1. Indicadores de Liquidez e Parâmetros de Caixa");
    pdf.addParagraph(
      "A integridade corporativa está vinculada ao fluxo líquido contínuo de recursos. Abaixo compilamos a receita comercial bruta contra as despesas gerais auditadas para o período corrente, apurando os demonstrativos de conversão operacional e o fôlego em meses (Runway) resguardado em caixa:"
    );

    const metricsColor = balance >= 0 ? { r: 16, g: 185, b: 129 } : { r: 239, g: 68, b: 68 };
    const summaryMetrics = [
      { label: "Receita Bruta", value: rawFormatCurrency(income) },
      { label: "Custo Operacional", value: rawFormatCurrency(expense), color: { r: 239, g: 68, b: 68 } },
      { label: "Resultado Líquido", value: rawFormatCurrency(balance), color: metricsColor },
      { label: "Runway Estimado", value: `${histRunway.toFixed(1)} meses` }
    ];

    pdf.addSummaryCard("Quadro de Liquidez Resumida e Capital Comercial", summaryMetrics);

    pdf.addParagraph(
      `Conclui-se que o faturamento de ${rawFormatCurrency(income)} subtraído dos desembolsos e provisões de ${rawFormatCurrency(expense)} projeta resultado de saldo líquido de ${rawFormatCurrency(balance)}, auferindo margem real final de ${histMargin.toFixed(1)}%. Com suporte nas provisões líquidas de Blindagem de R$ 75.000,00, a autossuficiência do negócio se estabiliza em ${histRunway.toFixed(1)} meses de sobrevida operacional continuada.`
    );

    // 3. Seção 2: Demonstrativo de Resultado Gerencial (DRE) Completo
    pdf.addPrimaryHeading("2. Demonstrativo de Resultado do Exercício (DRE)");
    pdf.addParagraph(
      "O demonstrativo de resultado (DRE) verticaliza contabilmente cada degrau fiscal, separando receitas de serviços ou vendas brutas, taxas e comissões acessórias, impostos sobre faturamento e despesas de OPEX corporativo:"
    );

    const dreColumns = [
      { header: "Linha da Conta do DRE", key: "label", width: 90 },
      { header: "Valor Nominal Real", key: "valStr", width: 40, align: "right" as const },
      { header: "% Faturamento", key: "pctStr", width: 30, align: "right" as const }
    ];

    const dreLines = getDRE(selectedMonth);
    const dreTableData = dreLines.map((line) => ({
      label: line.label,
      valStr: rawFormatCurrency(line.value),
      pctStr: `${income > 0 ? ((Math.abs(line.value) / income) * 100).toFixed(1) : "0.0"}%`,
      isBold: line.isBold
    }));

    pdf.addAbntTable(dreColumns, dreTableData, `Demonstrativo Estrutural do Período (${format(selectedMonth, "MMMM yyyy", { locale: ptBR })})`);

    // 4. Seção 3: Auditoria de Precificação, Custos e SKUs
    pdf.addPrimaryHeading("3. Precificação, Custos e Análise de CMV por SKU");
    pdf.addParagraph(
      "Refinamos o provimento de preços de serviços ou mercadorias cadastrados, avaliando o percentual de Custo de Mercadoria Vendida (CMV), as margens de contribuição unitárias de cada SKU e a precificação sugerida para retorno ideal do PJ:"
    );

    const skuColumns = [
      { header: "Descrição do Item SKU cadastrado", key: "name", width: 65 },
      { header: "Preço de Custo", key: "cost", width: 30, align: "right" as const },
      { header: "Preço de Venda Pt.", key: "price", width: 35, align: "right" as const },
      { header: "Margem Lucrativa %", key: "margin", width: 30, align: "right" as const }
    ];

    const skuTableData = products && products.length > 0
      ? products.map(p => ({
          name: p.name,
          cost: rawFormatCurrency(p.costPrice),
          price: rawFormatCurrency(p.sellingPrice),
          margin: `${p.profitMarginPct ? p.profitMarginPct.toFixed(1) : "0.0"}%`
        }))
      : [
          { name: "Licença de Software SaaS", cost: rawFormatCurrency(35.00), price: rawFormatCurrency(149.00), margin: "76.5%" },
          { name: "Insumo Logístico Distribuição", cost: rawFormatCurrency(48.50), price: rawFormatCurrency(95.00), margin: "48.9%" },
          { name: "Suporte Técnico Operacional", cost: rawFormatCurrency(120.00), price: rawFormatCurrency(320.00), margin: "62.5%" }
        ];

    pdf.addAbntTable(skuColumns, skuTableData, "Matriz Geral de Custos de SKUs e Mark-ups PJ");

    // 5. Seção 4: Multiplicadores, Valuation e Atratividade para Exit
    pdf.addPrimaryHeading("4. Governança, Valuation e Múltiplos de Exit");
    pdf.addParagraph(
      "A mensuração do valor de firma estimado (Valuation) correlaciona os fluxos operacionais EBITDA anualizados aos múltiplos médios do setor econômico do PJ. Ajustamos e descontamos a atratividade baseados em governança e dependência:"
    );

    const sectorMultiple = localStorage.getItem("dafne_valuation_sector_multiple") || "4.5";
    const governanceScore = localStorage.getItem("dafne_valuation_governance_score") || "7.8";
    const keyPersonRisk = localStorage.getItem("dafne_valuation_key_person_score") || "médio-baixo";
    const revenueRecurrence = localStorage.getItem("dafne_valuation_recurrence_level") || "médio (~50%)";
    const annualEbitda = Math.max(0, balance * 12);
    const estimatedValuation = annualEbitda * parseFloat(sectorMultiple);

    const valMetrics = [
      { label: "Múltiplo Médio", value: `${sectorMultiple}x` },
      { label: "EBITDA Anualizado", value: rawFormatCurrency(annualEbitda) },
      { label: "Nota de Governança", value: `${governanceScore}/10` },
      { label: "Valuation Projetado", value: rawFormatCurrency(estimatedValuation), color: { r: 16, g: 185, b: 129 } }
    ];

    pdf.addSummaryCard("Parâmetros do Laboratório de Valuation e Atratividade PJ", valMetrics);

    pdf.addParagraph(
      `Com base na geração operacional anualizada, o valuation estipulado atinge ${rawFormatCurrency(estimatedValuation)}, fundamentado no múltiplo de ${sectorMultiple}x. A companhia demonstra maturidade orçamentária expressa em nota de governança de ${governanceScore}/10, exibindo riscos de pessoa-chave classificados em grau ${keyPersonRisk} com recorrência de receitas de padrão ${revenueRecurrence}.`
    );

    // 6. Seção 5: Modelo de Projeção Estratégica e Alinhamento
    pdf.addPrimaryHeading("5. Projeções de Cenários e Planejamento e Metas");
    pdf.addParagraph(
      "A modelagem preditiva estipula impactos fiscais comparativos com base na execução orçamentária ativa orquestrada pelo conselho principal da empresa:"
    );

    const playPlanLabel = stratPlan === "opex"
      ? "Plano de Redução Estrutural de OPEX (Administrativo -15%)"
      : stratPlan === "revenue"
        ? "Plano de Atração e Expansão de Canais de Receita (+20%)"
        : "Plano de Parceria com Fornecedores e Redução CMV (-8%)";

    pdf.addSecondaryHeading(`Alinhamento de Metas: ${playPlanLabel} (Eficácia em ${stratEfficacy}%)`);

    const projCols = [
      { header: "Métrica Estrutural", key: "metric", width: 70 },
      { header: "Comportamento Corrente", key: "hist", width: 45, align: "right" as const },
      { header: "Modelo de Projeção", key: "proj", width: 45, align: "right" as const }
    ];

    const projData = [
      { metric: "Receita Comercial Bruta", hist: rawFormatCurrency(income), proj: rawFormatCurrency(projIncome) },
      { metric: "Custos e Provisões Gerais", hist: rawFormatCurrency(expense), proj: rawFormatCurrency(projExpense) },
      { metric: "Sobra Operacional Residual", hist: rawFormatCurrency(balance), proj: rawFormatCurrency(projBalance), isBold: true },
      { metric: "Lucratividade Líquida %", hist: `${histMargin.toFixed(1)}%`, proj: `${projMargin.toFixed(1)}%`, isBold: true },
      { metric: "Survival Runway (Survival)", hist: `${histRunway.toFixed(1)} meses`, proj: `${projRunway.toFixed(1)} meses` }
    ];

    pdf.addAbntTable(projCols, projData, "Estudo Técnico de Sensibilidade do Plano de Ação");

    // 6. Planejamento Financeiro de Longo Prazo (1, 5 e 10 Anos)
    pdf.addPrimaryHeading("6. Planejamento Financeiro de Longo Prazo (1, 5 e 10 Anos)");
    
    const ltGrowth = Number(localStorage.getItem("dafne_lt_growth_rate") || "15");
    const ltOpex = Number(localStorage.getItem("dafne_lt_opex_reduction") || "8");
    const ltMargin = Number(localStorage.getItem("dafne_lt_margin_target") || "25");
    const ltCapex = Number(localStorage.getItem("dafne_lt_capex_target") || "6");

    pdf.addParagraph(
      `Com base nas premissas estratégicas sincronizadas do cockpit decenal, projetamos os fluxos de caixa e as metas de retenção para os próximos 10 anos. Este modelo de sensibilidade computa um crescimento anual de receita de +${ltGrowth}%, otimização fiscal e contração de despesas operacionais da ordem de -${ltOpex}% ao ano, mantendo foco na blindagem de liquidez com reinvestimento de ${ltCapex}% de CAPEX do faturamento bruto:`
    );

    const baseIncomeAnnual = income * 12;
    const baseExpenseAnnual = expense * 12;
    const baseProfitAnnual = baseIncomeAnnual - baseExpenseAnnual;
    const baseMarginAnnual = baseIncomeAnnual > 0 ? (baseProfitAnnual / baseIncomeAnnual) * 100 : 0;

    const hasIncome = income > 0;
    const decenalProjectionData = Array.from({ length: 11 }, (_, year) => {
      if (year === 0) {
        return {
          year: "Ano Atual",
          revenue: baseIncomeAnnual || (hasIncome ? 120000 : 0),
          expenses: baseExpenseAnnual || (hasIncome ? 96000 : 0),
          profit: baseProfitAnnual || (hasIncome ? 24000 : 0),
          margin: baseMarginAnnual || (hasIncome ? 20 : 0),
          accumulatedReserve: baseProfitAnnual > 0 ? baseProfitAnnual : (hasIncome ? 10000 : 0)
        };
      }

      let prevRev = baseIncomeAnnual || (hasIncome ? 120000 : 0);
      let prevExp = baseExpenseAnnual || (hasIncome ? 96000 : 0);
      let prevAcc = baseProfitAnnual > 0 ? baseProfitAnnual : (hasIncome ? 10000 : 0);

      for (let i = 1; i <= year; i++) {
        const currentRev = prevRev * (1 + ltGrowth / 100);
        const variablePart = prevExp * 0.4 * (1 + (ltGrowth * 0.5) / 100);
        const fixedPart = prevExp * 0.6 * (1 - ltOpex / 100);
        const currentExp = Math.max(currentRev * 0.35, variablePart + fixedPart);
        const currentProfit = currentRev - currentExp;
        const currentCapex = currentRev * (ltCapex / 100);
        
        prevAcc += (currentProfit - currentCapex);
        prevRev = currentRev;
        prevExp = currentExp;
      }

      const currentRevenue = prevRev;
      const currentExpenses = prevExp;
      const currentProfit = currentRevenue - currentExpenses;
      const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;

      return {
        year: `Ano ${year}`,
        revenue: Math.round(currentRevenue),
        expenses: Math.round(currentExpenses),
        profit: Math.round(currentProfit),
        margin: parseFloat(currentMargin.toFixed(1)),
        accumulatedReserve: Math.round(prevAcc)
      };
    });

    const ltCols = [
      { header: "Horizonte", key: "year", width: 25 },
      { header: "Faturamento Proj.", key: "revenueStr", width: 33, align: "right" as const },
      { header: "Custos Proj.", key: "expensesStr", width: 28, align: "right" as const },
      { header: "Sobra Operacional", key: "profitStr", width: 29, align: "right" as const },
      { header: "Margem %", key: "marginStr", width: 20, align: "right" as const },
      { header: "Reserva Acumulat.", key: "reserveStr", width: 25, align: "right" as const }
    ];

    const ltTableRows = [
      decenalProjectionData[0], // Base
      decenalProjectionData[1], // Ano 1
      decenalProjectionData[3], // Ano 3
      decenalProjectionData[5], // Ano 5
      decenalProjectionData[10] // Ano 10
    ].map(item => ({
      year: item.year === "Ano Atual" ? "Base (Atual)" : item.year,
      revenueStr: rawFormatCurrency(item.revenue),
      expensesStr: rawFormatCurrency(item.expenses),
      profitStr: rawFormatCurrency(item.profit),
      marginStr: `${item.margin}%`,
      reserveStr: rawFormatCurrency(item.accumulatedReserve)
    }));

    const year5Goal = decenalProjectionData[5];
    const year10Goal = decenalProjectionData[10];

    const ltSummaryMetrics = [
      { label: "Fat. Ano 5 Proj.", value: rawFormatCurrency(year5Goal.revenue) },
      { label: "Sobra Ano 5 Proj.", value: rawFormatCurrency(year5Goal.profit), color: { r: 16, g: 185, b: 129 } },
      { label: "Fat. Ano 10 Proj.", value: rawFormatCurrency(year10Goal.revenue) },
      { label: "Reserva Ano 10", value: rawFormatCurrency(year10Goal.accumulatedReserve), color: { r: 249, g: 115, b: 22 } }
    ];

    pdf.addSummaryCard("Metas Estruturais dos Horizontes de Projeção Decenal", ltSummaryMetrics);
    pdf.addAbntTable(ltCols, ltTableRows, "Modelo Simulação Dinâmica de Fluxo de Caixa Decenal");

    // 7. Seção 7: Parecer de Mentoria da Assessora Dafne IA
    if (report) {
      pdf.addPrimaryHeading("7. Parecer Técnico Integral e Diretriz Contábil Dafne IA");
      pdf.addParagraph(
        "Apresentamos na íntegra a auditoria consultiva inteligente focada nas contas PJ do período:"
      );

      const markdownLines = report.split("\n");
      markdownLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith("###")) {
          pdf.addSecondaryHeading(trimmed.replace("###", "").trim());
        } else if (trimmed.startsWith("##")) {
          pdf.addPrimaryHeading(trimmed.replace("##", "").trim());
        } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          pdf.addBulletItem("•", trimmed.substring(1).trim());
        } else {
          pdf.addParagraph(trimmed);
        }
      });
    }

    // Certificação e Carimbos/Assinaturas finais
    pdf.addAuditSeal();
    pdf.addSignaturesBlock();

    const reportLabel = isAbnt ? "ABNT" : "CORPORATIVO";
    pdf.save(`Relatorio_Geral_${reportLabel}_${companyLabel.replace(/\s+/g, "_")}_${format(selectedMonth, "MM_yyyy")}.pdf`);
    
    if (showToast) {
      showToast(`Relatório Geral de Todas as Frentes (${reportLabel}) exportado com sucesso!`, "success");
    }
  };

  // Action: Export ONLY Dafne Advisor counsel and diagnostic guidelines to PDF
  const exportDafneAdvisorReportPDF = () => {
    if (trackDemoInteraction) trackDemoInteraction();
    if (showToast) showToast("A mentora Dafne está gerando seu arquivo PDF estruturado. Aguarde...", "info");

    const pdf = new AbntPdfDocument({
      isAbntStandard: false, // Make it beautifully colored in her style!
      primaryColor: { r: 15, g: 23, b: 42 }, // Slate 900
      secondaryColor: { r: 249, g: 115, b: 22 } // Dafne Orange/Amber
    });

    const companyLabel = getActiveStoreLabel();

    // 1. Capa para o Diagnóstico da Dafne
    pdf.drawCover(
      companyLabel,
      "DIAGNÓSTICO E DIRETRIZES FINANCEIRAS PJ",
      "Parecer Técnico Qualitativo e Recomendações Táticas - Assessora Dafne I.A.",
      "CONSELHO CONSULTIVO E INTELIGÊNCIA ARTIFICIAL"
    );

    // 2. Seção de Sumário Geral do Período
    pdf.addPrimaryHeading("I. Indicador de Saúde PJ e Balanço Corrente");
    pdf.addParagraph(
      `Este parecer técnico, formulado pela Assessora Dafne IA baseia-se nos índices patrimoniais ativos do negócio. A análise cruzou faturamentos e desembolsos recentes para calibrar o fôlego operacional e sugerir blindagens orçamentárias imediatas:`
    );

    const metricsColor = balance >= 0 ? { r: 16, g: 185, b: 129 } : { r: 239, g: 68, b: 68 };
    const summaryMetrics = [
      { label: "Receitas Registradas", value: rawFormatCurrency(income) },
      { label: "Saídas Operacionais", value: rawFormatCurrency(expense), color: { r: 239, g: 68, b: 68 } },
      { label: "Saldo Acumulado", value: rawFormatCurrency(balance), color: metricsColor },
      { label: "Fôlego Atual (Runway)", value: `${histRunway.toFixed(1)} meses` }
    ];

    pdf.addSummaryCard("Métricas e Monitoramento de Liquidez de Caixa", summaryMetrics);

    pdf.addParagraph(
      `Conclui-se que o negócio goza de margem operacional básica de ${histMargin.toFixed(1)}%. Sob o cenário atual, a estrutura possui capacidade sustentável frente a oscilações em uma janela estimada de ${histRunway.toFixed(1)} meses.`
    );

    // 3. Seção do Parecer da Dafne IA na Íntegra
    pdf.addPrimaryHeading("II. Recomendações e Diretrizes da Assessora Dafne IA");
    pdf.addParagraph(
      "Abaixo, transcrevemos na íntegra a auditoria de contingências e o planejamento sob medida formulado para a maturidade financeira PJ do seu negócio:"
    );

    if (report) {
      const markdownLines = report.split("\n");
      markdownLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith("###")) {
          pdf.addSecondaryHeading(trimmed.replace("###", "").trim());
        } else if (trimmed.startsWith("##")) {
          pdf.addPrimaryHeading(trimmed.replace("##", "").trim());
        } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          pdf.addBulletItem("•", trimmed.substring(1).trim());
        } else {
          pdf.addParagraph(trimmed);
        }
      });
    } else {
      pdf.addParagraph(
        "Nenhum parecer dinâmico estruturado pôde ser capturado. Recomenda-se acionar a conexão e recarregar a auditoria principal da mentora."
      );
    }

    pdf.addPrimaryHeading("III. Termo de Governança e Melhores Práticas PJ");
    pdf.addParagraph(
      `Este relatório constitui um instrumento de governança qualificada e suporte decisório. É de responsabilidade do corpo gestor da empresa ${companyLabel} revisar e aplicar as reduções e o mark-up de precificação sugeridos, observando regimes tributários adequados e a constituição do fundo de blindagem no Cofrinho Inteligente para perenidade sustentável do caixa.`
    );

    pdf.addAuditSeal();
    pdf.addSignaturesBlock();

    pdf.save(`Parecer_Dafne_IA_${companyLabel.replace(/\s+/g, "_")}_${format(selectedMonth, "MM_yyyy")}.pdf`);
    
    if (showToast) {
      showToast("Relatório de Diagnóstico e Diretrizes da Dafne IA exportado em PDF com sucesso!", "success");
    }
  };

  const exportStandardFinancialPDF = () => {
    // Falls back to full comprehensive ABNT report to maintain full backwards compatibility but with enhanced data completeness
    exportFullComprehensivePDF(true);
  };

  // Action: Export Strategic Simulation PDF with custom projections under ABNT standards
  const exportStrategicPlanPDF = () => {
    const pdf = new AbntPdfDocument({
      isAbntStandard: true,
      primaryColor: brandPrimary,
      secondaryColor: brandSecondary
    });

    pdf.drawCover(
      getActiveStoreLabel(),
      "SÍNTESE DE PROJEÇÃO E ALINHAMENTO ESTRATÉGICO",
      `Modelagem e Simulação Qualitativa e Quantitativa do Plano de Ação PJ`,
      "CÉLULA DE INTELIGÊNCIA OPERACIONAL E GOVERNANÇA"
    );

    pdf.addPrimaryHeading("1. Modelagem do Plano Orçamentário");
    pdf.addParagraph(
      "Este relatório projeta o comportamento das contas fiscais e operacionais PJ mediante a adoção de estratégias estruturais ajustadas. O objetivo é auferir fôlego orçamentário no curto-médio prazo."
    );

    const planTypeLabel = stratPlan === "opex" 
      ? "Plano de Redução Estrutural de OPEX (Custos Administrativos)" 
      : stratPlan === "revenue" 
        ? "Plano de Expansão e Atração de Canais comerciais" 
        : "Plano de Otimização e Compra com Maior Margem de CMV";

    const stressLabel = stressScenario === "none" ? "Estabilidade Neutra (Mercado Normal)"
      : stressScenario === "recession" ? "Recessão Local (Volume de Faturamento -20%)"
      : stressScenario === "inflation" ? "Explosão Inflacionária (Acréscimo de Despesas de OPEX +15%)"
      : stressScenario === "supply_shock" ? "Choque Logístico e CMV (Insumos +20%)"
      : "Boom Proporcional de Vendas (+25% Demanda)";

    pdf.addSecondaryHeading(`Diretriz do Plano Local: ${planTypeLabel}`);
    pdf.addParagraph(
      `A simulação mapeia a eficácia de governança planejada sob rigor de ${stratEfficacy}% da meta real disponível.`
    );

    pdf.addSecondaryHeading(`Estresse de Choque Macroeconômico Selecionado: ${stressLabel}`);
    pdf.addParagraph(
      `Mapeamos a resiliência orçamentária sob choques sistêmicos para averiguar a vulnerabilidade de faturamento, custos de distribuição e longevidade de recursos, definindo uma classificação rating conselho.`
    );

    pdf.addPrimaryHeading("2. Projeção Orçamentária PJ Comparativa");
    pdf.addParagraph(
      "A tabela abaixo detalha as compensações simuladas entre o histórico de contas vigente e o modelo após a execução do plano:"
    );

    const projColumns = [
      { header: "Métrica / Parâmetro de Caixa", key: "metric", width: 70 },
      { header: "Histórico Atual", key: "hist", width: 45, align: "right" as const },
      { header: "Simulação do Plano Projetado", key: "proj", width: 45, align: "right" as const }
    ];

    const projTableData = [
      {
        metric: "Receita Operacional Bruta",
        hist: rawFormatCurrency(income),
        proj: rawFormatCurrency(projIncome)
      },
      {
        metric: "Custo Operacional Total",
        hist: rawFormatCurrency(expense),
        proj: rawFormatCurrency(projExpense)
      },
      {
        metric: "Lucro / Sobra Caixa Residual",
        hist: rawFormatCurrency(balance),
        proj: rawFormatCurrency(projBalance),
        isBold: true
      },
      {
        metric: "Margem de Lucratividade",
        hist: `${histMargin.toFixed(1)}%`,
        proj: `${projMargin.toFixed(1)}%`,
        isBold: true
      },
      {
        metric: "Autossuficiência (Runway)",
        hist: `${histRunway.toFixed(1)} meses`,
        proj: `${projRunway.toFixed(1)} meses`
      }
    ];

    pdf.addAbntTable(projColumns, projTableData, `Síntese Comparativa de Impacto do Plano de Ação (${stratEfficacy}% Eficácia)`);

    pdf.y += 5;

    const expectedDelta = projBalance - balance;
    pdf.addPrimaryHeading("3. Classificação de Resiliência & Rating PJ");
    pdf.addParagraph(
      `Classificação Geral do Conselho: Rating [ ${resiliencyScore.grade} ] - Nível ${resiliencyScore.title.toUpperCase()}.\n` +
      `Sob o cenário simulado, o fator de probabilidade de sustentabilidade diante de choques assenta-se em ${resiliencyScore.prob}.\n` +
      `Parecer Diretor Recomendado: ${resiliencyScore.rec}`
    );

    pdf.y += 3;
    pdf.addPrimaryHeading("4. Conclusão e Diretriz Consultiva");
    pdf.addParagraph(
      `Conclui-se que a adoção estratégica deste plano gerará um acréscimo líquido sobre o caixa operacional de ${rawFormatCurrency(expectedDelta)} por mês. Esse aporte dilui os riscos regulatórios e expande a longevidade operacional PJ para ${projRunway.toFixed(1)} meses, blindando o capital de giro em cenários restritivos.`
    );

    if (report) {
      pdf.y += 3;
      pdf.addSecondaryHeading("Recomendações da Assessora I.A.");
      const markdownLines = report.split("\n");
      markdownLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith("###")) {
          const cleanHeading = trimmed.replace("###", "").trim();
          pdf.addSecondaryHeading(cleanHeading);
        } else if (trimmed.startsWith("##")) {
          const cleanHeading = trimmed.replace("##", "").trim();
          pdf.addPrimaryHeading(cleanHeading);
        } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const cleanBullet = trimmed.substring(1).trim();
          pdf.addBulletItem("•", cleanBullet);
        } else {
          pdf.addParagraph(trimmed);
        }
      });
    }

    // Certificação e Carimbos/Assinaturas finais
    pdf.addAuditSeal();
    pdf.addSignaturesBlock();

    pdf.save(`MaxPerformance_Plano_Estrategico_${Date.now()}.pdf`);
    if (showToast) showToast("Plano Orçamentário Estratégico (ABNT) gerado!", "success");
  };

  // Recharts Pie chart data formatter
  const chartData = useMemo(() => {
    return getDRE(selectedMonth)
      .filter(
        (line) =>
          line.isBold &&
          line.label !== "RECEITA OPERACIONAL BRUTA" &&
          Math.abs(line.value) > 0
      )
      .map((line) => ({
        name: line.label.replace(/^(\(=\)\s*)/, "").split(" / ")[0],
        value: Math.abs(line.value),
        originalValue: line.value,
      }));
  }, [getDRE, selectedMonth]);

  const hasChartData = chartData.length > 0;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      {/* CARD PRINCIPAL DE CABEÇALHO - ALTOS LUCROS & BENTO DE TECNOLOGIAS NATIVAS */}
      <div className="bg-slate-950 text-white p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-orange-650/[0.02] rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10 pb-6 border-b border-slate-900">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 max-w-4xl">
            <BestTechnologySeal size="md" showDetails={false} className="shrink-0 bg-slate-900/60 p-4 rounded-[2rem] border border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] self-center" />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/35 text-orange-400 font-extrabold text-[9.5px] uppercase tracking-widest px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-mono shadow-[0_2px_10px_rgba(249,115,22,0.08)]">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                  🏆 REFERÊNCIA EM GESTÃO PERFORMÁTICA
                </span>
                <span className="bg-slate-900 border border-slate-800 text-slate-300 font-black text-[9.5px] uppercase tracking-widest px-3.5 py-1.5 rounded-full font-mono">
                  ⚡ INTEGRADO COM @google/genai SDK
                </span>
              </div>
              
              <h2 className="font-sans font-black text-2xl md:text-3xl lg:text-[2.1rem] uppercase tracking-tight italic text-white leading-none">
                A Melhor Tecnologia para <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-450 to-amber-400">Negócios de Altos Lucros</span>
              </h2>
              
              <p className="text-xs md:text-[13px] text-slate-300 font-medium leading-relaxed font-sans max-w-3xl">
                Consolidada como o melhor instrumento na área de gestão performática para negócios de alta rentabilidade. Unimos auditoria de balanço automatizada de sub-segundos, sincronização contábil resiliente e inteligência analítica de vanguarda que garante que cada fração de lucro seja preservada e multiplicada com precisão.
              </p>
            </div>
          </div>

          {/* Global Toolbar - Perfeitamente Posicionada de Forma Executiva */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full xl:w-auto relative z-10">
            <button
              onClick={() => fetchAiReport(true)}
              disabled={loadingReport}
              className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-800 font-black uppercase tracking-widest text-[9.5px] px-4.5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles size={11.5} className={cn("text-orange-400", loadingReport && "animate-spin")} />
              Sincronizar IA
            </button>
            
            <button
              onClick={exportStandardFinancialPDF}
              className="flex-1 sm:flex-initial bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black uppercase tracking-widest text-[9.5px] px-4.5 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/15 flex items-center justify-center gap-1.5"
            >
              <Download size={11.5} /> Exportar DRE Executivo (ABNT)
            </button>
          </div>
        </div>

        {/* ⚡ Bento-Grid de Tecnologias Integradas no Ecossistema */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <div className="bg-[#0b0c11]/85 border border-slate-900 p-4.5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-orange-500/25 transition-all group duration-300">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
                <Cpu size={15.5} />
              </div>
              <span className="text-[7.5px] font-mono uppercase bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-md font-bold">@google/genai</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11.5px] font-black uppercase tracking-wider text-white">Google Gemini 3.5 & Lite</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans font-medium">
                Processamento instantâneo de auditoria de balanço via SDK nativo. Diante de oscilações de latência do iFrame ou requisições em tempo real, aciona de forma resiliente e em sub-segundos o modelo ultra-rápido <strong className="text-orange-400 font-bold">gemini-3.1-flash-lite</strong>.
              </p>
            </div>
          </div>

          <div className="bg-[#0b0c11]/85 border border-slate-900 p-4.5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-orange-500/25 transition-all group duration-300">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
                <Database size={15.5} />
              </div>
              <span className="text-[7.5px] font-mono uppercase bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-md font-bold">Firebase Act</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11.5px] font-black uppercase tracking-wider text-white">Firestore Realtime Sync & Cache</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans font-medium">
                Sincronização em nuvem e autenticação com Firebase Firestore acompanhado de roteamento inteligente de cache local ultrarrápido para absoluta proteção de latência e trabalho síncrono offgrid.
              </p>
            </div>
          </div>

          <div className="bg-[#0b0c11]/85 border border-slate-900 p-4.5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-orange-500/25 transition-all group duration-300">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
                <TrendingUp size={15.5} />
              </div>
              <span className="text-[7.5px] font-mono uppercase bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-md font-bold">Unified BI</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11.5px] font-black uppercase tracking-wider text-white">D3.js & Recharts Unified</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans font-medium">
                Renderizadores analíticos para gráficos vetoriais multi-dimensionais de alta precisão que destrincham OPEX, tendências marginais de lucratividade, Break-Even e saúde financeira.
              </p>
            </div>
          </div>

          <div className="bg-[#0b0c11]/85 border border-slate-900 p-4.5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-orange-500/25 transition-all group duration-300">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
                <Volume2 size={15.5} />
              </div>
              <span className="text-[7.5px] font-mono uppercase bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-md font-bold">Voz Executiva</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11.5px] font-black uppercase tracking-wider text-white">Voz Executiva IA</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans font-medium">
                Algoritmo de síntese de voz (TTS) calibrado em frequências de pitch de diretoria executiva de alta credibilidade para ler e comentar insights cruciais do caixa de forma altriva.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WORKSPACE SUB-TABS SELECTOR */}
      <div className="flex flex-nowrap overflow-x-auto border-b border-gray-200 gap-2.5 py-2 select-none whitespace-nowrap scrollbar-thin max-w-full pb-3 scroll-smooth">
        <button
          onClick={() => setActiveSubTab("dre")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "dre"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <ReceiptText size={15} /> Demonstrativo DRE
        </button>
        <button
          onClick={() => {
            setActiveSubTab("cockpit-decisoes");
            if (trackDemoInteraction) trackDemoInteraction();
          }}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "cockpit-decisoes"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-650"
          )}
        >
          <Zap size={15} className="text-orange-500 animate-pulse" /> Cockpit Estratégico & Previsões
        </button>
        <button
          onClick={() => {
            setActiveSubTab("stores");
            if (trackDemoInteraction) trackDemoInteraction();
          }}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "stores"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-650"
          )}
        >
          <Building2 size={15} className="text-orange-500 animate-pulse" /> Consolidado de Lojas & CNPJs (Slicing)
        </button>
        <button
          onClick={() => setActiveSubTab("simulator")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "simulator"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Target size={15} /> Planejamento & Projeções
        </button>
        <button
          onClick={() => setActiveSubTab("ai-advisor")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "ai-advisor"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Bot size={15} /> Mentoria I.A. & SKU/CMV
        </button>
        <button
          onClick={() => setActiveSubTab("analytics")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "analytics"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Activity size={15} /> Análises & Comparativos
        </button>
        <button
          onClick={() => setActiveSubTab("plans")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "plans"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <FileText size={15} /> Plano Estratégico I.A.
        </button>
        <button
          onClick={() => {
            setActiveSubTab("tax-panel");
            if (trackDemoInteraction) trackDemoInteraction();
          }}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "tax-panel"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Percent size={15} className="text-orange-500 animate-pulse" /> Inteligência Tributária & Diagnóstico Fiscal
        </button>
        <button
          onClick={() => setActiveSubTab("reports")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "reports"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <FileText size={15} className="text-orange-500" /> Central de Relatórios
        </button>
        <button
          onClick={() => {
            setActiveSubTab("operational-audit");
            if (trackDemoInteraction) trackDemoInteraction();
          }}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "operational-audit"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Gauge size={15} className="text-orange-500 animate-pulse animate-none" /> Auditoria Operacional & Gargalos
        </button>
        <button
          onClick={() => {
            setActiveSubTab("monthly-audit");
            if (trackDemoInteraction) trackDemoInteraction();
          }}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0",
            activeSubTab === "monthly-audit"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Sparkles size={15} className="text-orange-500 animate-pulse" /> Auditoria de Metas & Acertos I.A.
        </button>
      </div>

      {/* DYNAMICS CONTENTS ACCORDING TO WORKING SUB-TAB */}
      <AnimatePresence mode="wait">
        
        {/* SUBTAB 1: MONTHLY INTERACTIVE DRE */}
        {activeSubTab === "dre" && (
          <motion.div
            key="dre-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Control Bar specific for DRE */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-150">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setDreViewMode("table")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      dreViewMode === "table"
                        ? "bg-gray-950 text-white shadow-sm"
                        : "text-gray-500"
                    )}
                  >
                    Exibição em Tabela
                  </button>
                  <button
                    onClick={() => {
                      if (!isPremium) {
                        showToast("Gráficos analíticos de composição do DRE estão restritos a clientes Pro.", "warning");
                        return;
                      }
                      setDreViewMode("chart");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1",
                      dreViewMode === "chart"
                        ? "bg-gray-950 text-white shadow-sm"
                        : "text-gray-500"
                    )}
                  >
                    Exibição Gráfica
                    {!isPremium && <Shield size={10} className="text-orange-500 animate-pulse" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Imposto Estimado (%)</span>
                  <input
                    type="number"
                    value={profile?.taxRate || 0}
                    onChange={(e) => updateProfile({ taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-12 border-none bg-transparent outline-none p-0 text-center font-bold text-xs text-gray-900 focus:ring-0"
                  />
                  <Percent size={11} className="text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedMonth.toISOString()}
                  onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                  className="bg-white text-slate-900 rounded-xl border border-gray-250 px-3 py-1.5 font-bold outline-none text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m.toISOString()} value={m.toISOString()} className="bg-white text-slate-900 font-bold">
                      {format(m, "MMMM yyyy", { locale: ptBR })}
                    </option>
                  ))}
                </select>

                {dreViewMode === "table" && (
                  <button
                    onClick={exportDREToPDF}
                    disabled={isExportingDRE}
                    className="bg-gray-950 hover:bg-orange-600 font-extrabold text-[10px] text-white uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-black/5 flex items-center gap-1.5"
                  >
                    {isExportingDRE ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    {isExportingDRE ? "Gerando..." : "Captura Visual (PDF)"}
                  </button>
                )}
              </div>
            </div>

            {/* EDUCATIONAL/AUDIT INFO BANNER ABOUT CMV & DRE */}
            <div className="bg-orange-50/40 border border-orange-200/80 rounded-2xl p-4 flex gap-3 text-left">
              <AlertCircle className="text-orange-600 shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 block font-sans">
                  Auditoria de Dedutibilidade Fiscal (CMV & Lucro Operacional)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  Para fins gerenciais e contábeis, o <strong>Custo de Mercadoria Vendida (CMV/CPV)</strong> é uma despesa integralmente dedutível de margem antes de computar o Lucro Operacional (EBITDA). Isso permite visualizar o ganho real de contribuição por SKU e planejar a elisão fiscal de custos operacionais com total nitidez.
                </p>
              </div>
            </div>

            {/* DRE Interactive Display Render */}
            <div className="grid grid-cols-1 gap-6">
              {dreViewMode === "table" ? (
                <div 
                  ref={dreReportRef}
                  className="bg-white rounded-[3rem] border border-gray-150 p-6 md:p-10 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 flex flex-col items-end opacity-5 pointer-events-none">
                    <span className="text-[64px] font-black italic tracking-tighter leading-none text-slate-900">DRE</span>
                    <span className="text-[10px] font-mono tracking-widest block uppercase font-bold text-slate-800">Oficial</span>
                  </div>

                  <div className="border-b-4 border-slate-950 pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div className="space-y-1 text-left">
                      <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                        {profile?.companyName || "Minha Empresa PJ"}
                      </h3>
                      <p className="text-[11px] text-orange-600 font-mono font-bold uppercase tracking-wider">
                        Demonstrativo de Resultado do Exercício • {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right border-l-2 border-slate-300 pl-4">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">CNPJ REGULARIZADO</p>
                      <p className="text-[10px] font-mono text-slate-800 font-semibold">{getActiveStoreLabel()}</p>
                    </div>
                  </div>

                  {/* DRE Vertical accounting lines */}
                  <div className="divide-y divide-gray-100 text-xs md:text-sm text-left">
                    {(() => {
                      const dreLines = getDRE(selectedMonth);
                      const grossRevenueLine = dreLines.find((l) => l.label === "RECEITA OPERACIONAL BRUTA");
                      const grossRevenueVal = grossRevenueLine ? grossRevenueLine.value : 0;

                      return dreLines.map((line, index) => {
                        const percentageOfRevenue = (grossRevenueVal > 0 && line.label !== "RECEITA OPERACIONAL BRUTA") 
                          ? Math.round((Math.abs(line.value) / grossRevenueVal) * 100)
                          : null;

                        const isCmv = line.label.includes("CMV");

                        return (
                          <div
                            key={index}
                            className={cn(
                              "flex justify-between items-center py-3.5 px-2 transition-all",
                              line.isBold
                                ? "font-black text-slate-950 bg-slate-50 border-y border-slate-200/60 uppercase tracking-tight"
                                : isCmv
                                  ? "text-slate-900 bg-orange-50/35 font-bold border-l-4 border-orange-500 rounded-r-xl"
                                  : "text-slate-600 hover:bg-slate-50/50"
                            )}
                          >
                            <div
                              style={{ paddingLeft: `${(line.indent || 0) * 14}px` }}
                              className="flex items-center gap-2 flex-1 shrink-0"
                            >
                              {isCmv ? (
                                <div className="relative inline-flex items-center gap-2 group/cmv">
                                  <span 
                                    onClick={() => {
                                      setShowCmvTooltip(!showCmvTooltip);
                                      sound.playClick();
                                    }}
                                    className="font-bold text-orange-600 underline decoration-dashed decoration-orange-400 decoration-1 cursor-help hover:text-orange-700 transition-colors flex items-center gap-1.5"
                                    title="Clique para ver detalhes do impacto do CMV"
                                  >
                                    {line.label}
                                    <Info size={12} className="text-orange-500 hover:text-orange-600 shrink-0 inline-block animate-pulse hover:animate-none" />
                                  </span>

                                  {/* Tooltip Card */}
                                  <div className={cn(
                                    "absolute left-0 bottom-full mb-3 w-80 p-4 bg-slate-950 text-white text-xs rounded-2xl shadow-2xl transition-all duration-300 z-50 leading-relaxed font-sans normal-case tracking-normal text-left space-y-2.5 border border-orange-500/30",
                                    showCmvTooltip 
                                      ? "opacity-100 pointer-events-auto translate-y-0" 
                                      : "opacity-0 pointer-events-none translate-y-1 group-hover/cmv:opacity-100 group-hover/cmv:pointer-events-auto group-hover/cmv:translate-y-0"
                                  )}>
                                    <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-slate-950 border-r border-b border-orange-500/30 transform rotate-45"></div>
                                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                      <span className="text-orange-400 font-bold flex items-center gap-1 font-sans">
                                        📊 Impacto do CMV no Lucro Bruto
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowCmvTooltip(false);
                                          sound.playClick();
                                        }}
                                        className="text-slate-400 hover:text-white text-[10px] uppercase font-mono px-1 rounded hover:bg-white/10"
                                      >
                                        Fechar
                                      </button>
                                    </div>
                                    <p className="text-slate-300 font-medium font-sans">
                                      O <strong>CMV (Custo de Mercadorias Vendidas)</strong> representa o custo dos itens vendidos e deduz diretamente o faturamento para apurar o Lucro Bruto.
                                    </p>
                                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono text-[10px] text-orange-200/95 space-y-1">
                                      <div className="flex justify-between">
                                        <span>Receita Operacional Líquida</span>
                                        <span className="text-slate-400">Faturamento Real</span>
                                      </div>
                                      <div className="flex justify-between text-rose-400 font-bold">
                                        <span>(-) CMV (Custo do Produto)</span>
                                        <span>(-) Custo Direto</span>
                                      </div>
                                      <div className="border-t border-white/10 pt-1 flex justify-between text-emerald-400 font-black">
                                        <span>(=) LUCRO BRUTO</span>
                                        <span>(=) Retorno Real</span>
                                      </div>
                                    </div>
                                    <p className="text-slate-400 text-[10.5px] leading-relaxed">
                                      ⚠️ Cada R$ pago em CMV subtrai exatamente R$ 1,00 do Lucro Bruto. Se o custo do seu estoque estiver muito alto (ou seu preço sobressair fraco), a margem de Lucro Bruto encolhe e torna a empresa incapaz de saudar a folha e despesas fixas (OPEX).
                                    </p>
                                  </div>

                                  <span className="px-1.5 py-0.5 rounded-[5px] text-[8px] tracking-tighter font-extrabold uppercase font-mono bg-orange-600 text-white shadow-xs animate-pulse shrink-0">
                                    DESPESA DEDUTÍVEL ANTES DE OPERACIONAL
                                  </span>
                                </div>
                              ) : (
                                <span>{line.label}</span>
                              )}
                              {percentageOfRevenue !== null && percentageOfRevenue > 0 && (
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded-[5px] text-[8px] tracking-tighter font-extrabold uppercase font-mono",
                                  line.isBold
                                    ? "bg-orange-500/10 text-orange-700 border border-orange-500/20"
                                    : "bg-slate-100 text-slate-400 border border-slate-200/40"
                                )}>
                                  {percentageOfRevenue}% rec.
                                </span>
                              )}
                            </div>
                            <div className={cn(
                              "font-mono font-bold tracking-tighter shrink-0",
                              !line.isBold && line.value < 0 ? "text-rose-500" : ""
                            )}>
                              {line.value < 0 ? "(" : ""}
                              {rawFormatCurrency(Math.abs(line.value))}
                              {line.value < 0 ? ")" : ""}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex flex-col sm:flex-row justify-between items-center gap-2">
                    <span className="flex items-center gap-1"><Shield size={11} /> Autenticação Criptografada MaxPerformance</span>
                    <span>Modo Gerencial de Caixa • Imposto estimado: {profile?.taxRate || 0}%</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Composição Margem (Pie) */}
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-xs h-[380px]">
                    <h4 className="font-extrabold text-slate-900 mb-4 uppercase text-xs tracking-wider text-left flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <Coins size={14} className="text-orange-500" /> Composição Estrutural de Custos DRE
                    </h4>
                    {!hasChartData ? (
                      <div className="flex flex-col items-center justify-center h-[260px] text-gray-300">
                        <LineChart className="mb-2" size={32} />
                        <span className="text-[10px] uppercase font-bold">Sem movimentações de custo</span>
                      </div>
                    ) : (
                      <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {chartData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={[
                                    "#10B981", // Emerald
                                    "#3B82F6", // Blue
                                    "#F59E0B", // Amber
                                    "#EF4444", // Red
                                    "#8B5CF6", // Purple
                                  ][index % 5]}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(val: number) => rawFormatCurrency(val)} />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        <div className="flex flex-wrap justify-center gap-3 mt-1 max-h-[50px] overflow-y-auto">
                          {chartData.map((item, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full block"
                                style={{
                                  backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"][i % 5]
                                }}
                              />
                              <span className="text-[9px] text-slate-500 truncate max-w-[80px] font-bold uppercase">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evolução (Bar Chart) */}
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-xs h-[380px]">
                    <h4 className="font-extrabold text-slate-900 mb-4 uppercase text-xs tracking-wider text-left flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <LineChart size={14} className="text-[#3b82f6]" /> Comparação Econômica Vertical
                    </h4>
                    {!hasChartData ? (
                      <div className="flex flex-col items-center justify-center h-[260px] text-gray-300">
                        <LineChart className="mb-2" size={32} />
                        <span className="text-[10px] uppercase font-bold">Sem dados suficientes</span>
                      </div>
                    ) : (
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={90}
                              tick={{ fontSize: 9, fontWeight: "bold", fill: "#64748b" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartsTooltip formatter={(val: number) => rawFormatCurrency(val)} />
                            <Bar dataKey="value" fill="#f97316" radius={[0, 5, 5, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Link to Cofrinho */}
            <div 
              onClick={onNavigateToCofrinho}
              className="bg-linear-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200/60 rounded-[2rem] p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold uppercase text-xs text-orange-950 tracking-wide">
                    Cofrinho Inteligente de Otimização PJ
                  </h4>
                  <p className="text-[11px] text-orange-900/80 font-medium mt-1">
                    Realoque sobras de sua margem operacional no Cofrinho I.A., proteja o fluxo econômico contra contingências fiscais e planeje metas de médio prazo com fôlego garantido.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0 bg-white border border-orange-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-orange-700 transition-all hover:scale-105 active:scale-95 font-sans">
                <span>Alocar Caixa</span>
                <ChevronRight size={13} />
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: INTERACTIVE SCENARIOS SIMULATOR */}
        {activeSubTab === "simulator" && (
          <motion.div
            key="simulator-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Simulation Dashboard Header Banner */}
            <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-emerald-500/[0.03] rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 border-b border-white/[0.08] pb-5 mb-6">
                <div className="space-y-1.5 text-left font-sans">
                  <div className="inline-flex items-center gap-1.5 bg-orange-400/10 border border-orange-400/20 rounded-full px-2.5 py-0.5 text-[9px] text-orange-300 font-bold uppercase tracking-widest font-mono">
                    <Sparkles size={10} className="text-orange-400 animate-pulse" /> Laboratório Estratégico Corporativo
                  </div>
                  <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                    <Target size={18} className="text-orange-400" /> Simulador de Estresse, Diagnóstico & Rating PJ
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Simule os planos de ação da sua empresa contra choques e oscilações do mercado. Avalie o fôlego operacional (Runway) e receba notas de classificação internacional de risco financeiro.
                  </p>
                </div>

                {/* Scenario tabs */}
                <div className="flex bg-slate-900 border border-white/10 p-1.5 rounded-xl gap-1 shrink-0 flex-wrap">
                  <button
                    onClick={() => {
                      setStratPlan("opex");
                      if (trackDemoInteraction) trackDemoInteraction();
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      stratPlan === "opex"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Reduzir OPEX (-15%)
                  </button>
                  <button
                    onClick={() => {
                      setStratPlan("revenue");
                      if (trackDemoInteraction) trackDemoInteraction();
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      stratPlan === "revenue"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Alavancar Canais (+20%)
                  </button>
                  <button
                    onClick={() => {
                      setStratPlan("cmv");
                      if (trackDemoInteraction) trackDemoInteraction();
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      stratPlan === "cmv"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Negociar CMV (-8%)
                  </button>
                </div>
              </div>

              {/* Grid Simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                
                {/* LEFT COLUMN: PARAMETER SETUP */}
                <div className="lg:col-span-5 flex flex-col gap-5 text-left">
                  
                  {/* Strategic Plan Card */}
                  <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-3xl space-y-4 font-sans">
                    <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-2">
                      <ChevronRight size={13} /> 1. Parâmetros do Plano Local
                    </h4>
                    
                    <p className="text-[11px] text-slate-300 leading-relaxed min-h-[44px]">
                      {stratPlan === "opex" && "Cortar gargalos fixos, despesas administrativas excludentes e auditorias preventivas imediatas no OPEX direto da matriz."}
                      {stratPlan === "revenue" && "Impulsionar contratos recorrentes ativos, otimização de tiquetes médios de conversão sob investimento tático de publicidade."}
                      {stratPlan === "cmv" && "Desenvolver novas ordens centralizadas com fabricantes industriais e rotinas just-in-time para extinguir excesso de estoque."}
                    </p>

                    {/* Slider Governance */}
                    <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wide font-black text-slate-400">
                        <span>Governança & Rigor Executivo</span>
                        <span className="font-mono text-xs font-black text-white bg-orange-500/25 border border-orange-500/30 px-2 py-0.5 rounded">
                          {stratEfficacy}% Eficácia
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={stratEfficacy}
                        onChange={(e) => setStratEfficacy(parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[8px] font-mono text-slate-400">
                        <span>Confortável (10%)</span>
                        <span>Conselho Diretor (100%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Macro Stress Shock Selection */}
                  <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-3xl space-y-4 font-sans">
                    <div>
                      <h4 className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-2">
                        <Activity size={13} className="text-sky-400" /> 2. Choque Macroeconômico Alvo
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                        Estresse seu negócio escolhendo um cenário e veja o impacto instantâneo de liquidez:
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setStressScenario("none");
                          if (showToast) showToast("Simulando cenário estável de mercado.", "info");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "none"
                            ? "bg-slate-900 border-sky-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Estabilidade Neutra
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">Sem Shock</span>
                      </button>

                      <button
                        onClick={() => {
                          setStressScenario("recession");
                          if (showToast) showToast("Aviso: Teste de estresse de recessão ativo (-20% Faturamento).", "warning");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "recession"
                            ? "bg-slate-900 border-red-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Recessão Local (Faturamento -20%)
                        </span>
                        <span className="text-[9px] font-mono text-red-400 font-extrabold uppercase bg-red-400/10 px-1.5 py-0.5 rounded">Vol. -20%</span>
                      </button>

                      <button
                        onClick={() => {
                          setStressScenario("inflation");
                          if (showToast) showToast("Aviso: Teste de estresse de inflação ativo (+15% Despesas).", "warning");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "inflation"
                            ? "bg-slate-900 border-amber-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Explosão Inflacionária (OPEX +15%)
                        </span>
                        <span className="text-[9px] font-mono text-amber-400 font-extrabold uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">Opex +15%</span>
                      </button>

                      <button
                        onClick={() => {
                          setStressScenario("supply_shock");
                          if (showToast) showToast("Aviso: Teste de estresse logístico/CMV ativo (+20% Custos).", "warning");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "supply_shock"
                            ? "bg-slate-900 border-orange-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          Choque de Insumos/CMV (Custos +20%)
                        </span>
                        <span className="text-[9px] font-mono text-orange-400 font-extrabold uppercase bg-orange-500/10 px-1.5 py-0.5 rounded">CMV +20%</span>
                      </button>

                      <button
                        onClick={() => {
                          setStressScenario("bull_market");
                          if (showToast) showToast("Excelente: Cenário de expansão cambial e boom de faturamento ativo.", "success");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "bull_market"
                            ? "bg-slate-900 border-emerald-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          Boom de Demanda (Vendas +25%)
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase bg-emerald-400/10 px-1.5 py-0.5 rounded">Vendas +25%</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={exportStrategicPlanPDF}
                      className="w-full bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-black text-[10px] uppercase tracking-wider py-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 text-white shadow-lg shadow-orange-500/15 font-sans"
                    >
                      <Download size={13} /> Baixar Relatório de Estresse PDF
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN: DETAILED DIAGNOSTICS & SCORE */}
                <div className="lg:col-span-7 flex flex-col gap-5 text-left">
                  
                  {/* PREMIUM RESILIENCY RATING RADIAL/GRADE BOARD */}
                  <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 text-[9px] font-mono font-bold text-slate-500 select-none">
                      DAFNE AI RESILIENCY MODEL
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                      
                      {/* Interactive Badge Grade Circle */}
                      <div className="relative shrink-0 flex items-center justify-center w-28 h-28 rounded-full border-4 border-dashed border-white/10 p-2">
                        <div className={cn("w-full h-full rounded-full flex flex-col items-center justify-center border shadow-inner", resiliencyScore.colorClass)}>
                          <span className="text-3xl font-black font-mono tracking-tighter leading-none">{resiliencyScore.grade}</span>
                          <span className="text-[8px] font-gray-400 font-black tracking-widest uppercase mt-0.5">Rating</span>
                        </div>
                      </div>

                      {/* Diagnostic details */}
                      <div className="space-y-2 font-sans flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className={cn("text-sm font-black uppercase tracking-wide", resiliencyScore.textColor)}>
                            {resiliencyScore.title}
                          </span>
                          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                            Sobrevivência: {resiliencyScore.prob}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-100 leading-normal">
                          {resiliencyScore.desc}
                        </h4>
                        
                        {/* Interactive AI recommendation ticker */}
                        <div className="mt-3.5 bg-white/[0.03] border border-white/[0.04] p-3 rounded-2xl flex items-start gap-2.5">
                          <Bot size={14} className="text-orange-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-orange-300 uppercase tracking-wider block">Recomendação Contra Choque (Dafne IA)</span>
                            <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                              {resiliencyScore.rec}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Survival Under Crisis Progress Bar */}
                    <div className="mt-5 pt-4 border-t border-white/[0.04] space-y-1.5 font-sans">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-400">
                        <span>Fator do Runway sob Choque Ativo</span>
                        <span className={cn("font-mono text-xs font-black", projRunway >= 12 ? "text-emerald-400" : projRunway >= 6 ? "text-amber-400" : "text-rose-400")}>
                          {projRunway >= 24 ? "Suficiente (+2 Anos)" : `${projRunway.toFixed(1)} meses`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.05]">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            projRunway >= 12 ? "bg-emerald-500" : projRunway >= 6 ? "bg-amber-400" : "bg-rose-500"
                          )} 
                          style={{ width: `${Math.min(100, (projRunway / 24) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                        <span>Aperto Imediato</span>
                        <span>Equilíbrio Perfeito (12m)</span>
                        <span>Reserva Blindada (24m+)</span>
                      </div>
                    </div>

                  </div>

                  {/* Standard results delta boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Item 1: Conversão Líquida */}
                    <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl text-left space-y-1.5 font-sans">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Conversão Líquida Estimada</span>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-[#9ca3af]">Atual:</span>
                        <span className="text-xs font-mono font-bold text-gray-300">{histMargin.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-[#9ca3af]">Planejada:</span>
                        <span className={cn("text-xs font-mono font-black", projMargin >= histMargin ? "text-emerald-400" : "text-rose-400")}>
                          {projMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, projMargin))}%` }} />
                      </div>
                    </div>

                    {/* Item 2: Runway */}
                    <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl text-left space-y-1.5 font-sans">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Sustentabilidade (Runway)</span>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-[#9ca3af]">Atual:</span>
                        <span className="text-xs font-mono font-bold text-gray-300">{histRunway.toFixed(1)} meses</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-[#9ca3af]">Planejada:</span>
                        <span className={cn("text-xs font-mono font-black", projRunway >= histRunway ? "text-orange-400" : "text-rose-400")}>
                          {projRunway.toFixed(1)} meses
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (projRunway / 24) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Detailed bookkeeping balance */}
                    <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl md:col-span-2 space-y-3">
                      <div className="flex justify-between items-center border-b border-white/[0.05] pb-2 font-sans">
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Tabela Resumo Geral de Caixa</span>
                        <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">
                          Simulador Integrado
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 font-sans text-left">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block">Faturamento Projetado</span>
                          <span className="text-xs font-mono font-black text-gray-200">{rawFormatCurrency(projIncome)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block">Custo Total Projetado</span>
                          <span className="text-xs font-mono font-black text-gray-200">{rawFormatCurrency(projExpense)}</span>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-white/[0.05] flex justify-between items-center bg-white/[0.01] p-2.5 rounded-xl font-sans">
                        <div>
                          <span className="text-[9px] text-orange-300 font-extrabold uppercase">Sobra Residual Líquida</span>
                          <p className="text-sm font-mono font-black text-white">{rawFormatCurrency(projBalance)}</p>
                        </div>
                        <div className="text-right font-sans">
                          <span className="text-[8px] text-[#9ca3af] font-bold block">Delta de Margem Mensal:</span>
                          <span className={cn("text-xs font-mono font-black", projBalance - balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {projBalance - balance >= 0 ? "+" : ""} {rawFormatCurrency(projBalance - balance)}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: AI DIAGNOSTIC ADVISOR & SKU PRICING */}
        {activeSubTab === "ai-advisor" && (
          <motion.div
            key="ai-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left AI audit report panel */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-lg flex flex-col space-y-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/[0.03] rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 relative z-10">
                <div className="flex items-center gap-2.5">
                  <Bot size={20} className="text-orange-400 animate-pulse" />
                  <div className="text-left">
                    <h4 className="font-extrabold uppercase text-xs text-white">Conselhos da Assessora Dafne IA</h4>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Diagnósticos e diretrizes financeiras PJ</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                  <button
                    onClick={exportDafneAdvisorReportPDF}
                    className="bg-orange-500 hover:bg-orange-600 font-extrabold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg text-white transition-all duration-350 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 border border-orange-400/30"
                    title="Exportar diagnóstico estruturado em PDF com as diretrizes e conselhos"
                  >
                    <Download size={11} className="animate-pulse" />
                    Gerar Relatório PDF
                  </button>

                  <button
                    onClick={() => fetchAiReport(true)}
                    disabled={loadingReport}
                    className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {loadingReport ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} className="text-orange-400" />}
                    Atualizar Auditoria
                  </button>
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto pr-1 relative z-10 text-left">
                {loadingReport ? (
                  <div className="py-24 text-center space-y-3">
                    <Loader2 size={24} className="animate-spin text-orange-400 mx-auto" />
                    <p className="text-xs text-slate-400 uppercase font-black tracking-widest font-mono">Dafne está recalculando margens e buscando padrões...</p>
                  </div>
                ) : report ? (
                  <div className="space-y-4">
                    {/* ACCORDION/PODCAST SOUND PLAYER FOR REPORT */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(report, false)}
                          className={cn(
                            "p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-102 outline-none",
                            isSpeakingReport 
                              ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse" 
                              : "bg-orange-500 hover:bg-orange-600 text-white"
                          )}
                          title={isSpeakingReport ? "Interromper reprodução física" : "Tocar relatório em voz alta"}
                        >
                          {isSpeakingReport ? <Square size={13} fill="currentColor" /> : <Volume2 size={13} className="animate-pulse" />}
                        </button>
                        <div className="text-left">
                          <h5 className="font-extrabold text-[11px] text-white m-0 leading-tight">
                            {isSpeakingReport ? "Dafne está lendo..." : "Ouvir Parecer por Voz"}
                          </h5>
                          <p className="text-[8px] m-0 text-slate-405 mt-0.5 uppercase tracking-wider font-bold">
                            Timbre e velocidade de leitura calibrados
                          </p>
                        </div>
                      </div>
                      
                      {/* Mini Equalizer */}
                      <div className="flex items-end gap-1 bg-white/5 py-1.5 px-3 rounded-lg border border-white/5 shrink-0 w-28 justify-center h-7 overflow-hidden">
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={isSpeakingReport ? {
                              height: [
                                "20%", 
                                `${Math.floor(Math.random() * 80) + 20}%`, 
                                `${Math.floor(Math.random() * 50) + 10}%`, 
                                "20%"
                              ]
                            } : {
                              height: "20%"
                            }}
                            transition={isSpeakingReport ? {
                              duration: 0.4 + (i % 3) * 0.1,
                              repeat: Infinity,
                              ease: "easeInOut"
                            } : {}}
                            className={cn(
                              "w-[2.5px] rounded-full transition-all duration-300",
                              isSpeakingReport ? "bg-orange-500" : "bg-slate-600"
                            )}
                            style={{ height: "4px" }}
                          />
                        ))}
                      </div>
                    </div>

                    <QuickMarkdownRenderer text={report} />
                  </div>
                ) : (
                  <div className="text-center py-24 text-slate-400 space-y-2">
                    <AlertCircle size={24} className="mx-auto text-slate-500" />
                    <p className="font-black text-[10px] uppercase tracking-wider">Nenhum parecer financeiro ativo</p>
                    <p className="text-[11px] text-slate-500">Clique em "Sincronizar IA" no cabeçalho para gerar o parecer sob medida.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Products Pricing CMV panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white border border-gray-150 p-6 rounded-[2.5rem] shadow-xs hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-center border-b border-gray-150 pb-3 mb-4">
                  <div className="text-left">
                    <h4 className="font-black uppercase text-xs text-slate-900">Precificação Estruturada de SKUs</h4>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Contribuição marginal e markup por produto</p>
                  </div>
                  <Coins size={16} className="text-orange-500" />
                </div>

                {products && products.length > 0 ? (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {products.map((prod, idx) => (
                      <div key={idx} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-150 hover:border-gray-300 transition-colors flex justify-between items-center text-left">
                        <div>
                          <span className="font-black text-slate-900 text-xs block truncate max-w-[150px]">{prod.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">Cust. Unit: {rawFormatCurrency(prod.costPrice)} | Vend. {rawFormatCurrency(prod.sellingPrice)}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-orange-600 block font-mono">CMV: {prod.cmvPct.toFixed(1)}%</span>
                          <span className="text-[9px] text-emerald-600 font-bold">Margem: {prod.profitMarginPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400 space-y-2">
                    <HelpCircle size={20} className="mx-auto text-gray-300" />
                    <p className="font-bold text-[11px] uppercase tracking-wider">Sem produtos parametrizados</p>
                    <p className="text-[10px] text-gray-400">Insira valores na planilha de precificação para que a Dafne ajude no faturamento.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === "analytics" && (
          <motion.div
            key="analytics-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {analyticsView || (
              <div className="bg-white border border-gray-150 p-12 rounded-[2.5rem] shadow-xs text-center text-slate-500">
                Visualizador de análises comparativas e relatórios gráficos e de OPEX indisponível.
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === "plans" && (
          <motion.div
            key="plans-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {planningView || (
              <div className="bg-[#0b0c0e] border border-orange-500/10 p-12 rounded-[2.5rem] shadow-xs text-center text-slate-400">
                Assessor de plano de metas cooperativo integrado indisponível.
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === "tax-panel" && (
          <motion.div
            key="tax-panel-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header Cyber Card */}
            <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 border-b border-white/[0.08] pb-5 mb-6 text-left">
                <div className="space-y-1.5 text-left font-sans">
                  <div className="inline-flex items-center gap-1.5 bg-orange-400/10 border border-orange-400/20 rounded-full px-2.5 py-0.5 text-[9px] text-orange-300 font-bold uppercase tracking-widest font-mono">
                    <Shield size={10} className="text-orange-400 animate-pulse" /> Inteligência Regulatória de Alta Performance
                  </div>
                  <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                    <Percent size={18} className="text-orange-400" /> Simulador de Enquadramento & Planejamento Tributário
                  </h3>
                  <p className="text-slate-400 text-xs text-left max-w-4xl">
                    Compare os regimes de tributação do Brasil em tempo real (Simples Nacional vs. Lucro Presumido vs. Lucro Real). Realize o teste do Fator R de forma automática e audite créditos passivos monofásicos de PIS e COFINS.
                  </p>
                </div>
                <div className="flex bg-slate-900 border border-white/10 p-2 rounded-xl text-center shrink-0">
                  <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider font-mono">
                    Carga Fiscal Sincronizada
                  </span>
                </div>
              </div>

              {/* Calculator Panel Inputs & Scenario Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 text-left">
                {/* Inputs Setup Card */}
                <div className="lg:col-span-4 bg-slate-900 p-5 rounded-3xl border border-white/5 space-y-5 text-left font-sans">
                  <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider flex items-center gap-1">
                    <Gauge size={12} className="text-orange-400" /> Configuração Escalar do Negócio
                  </span>
                  
                  {/* Select Activity */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-450 font-mono">Atividade Principal / Segmento</label>
                    <select
                      value={taxActivity}
                      onChange={(e) => {
                        sound.playClick();
                        setTaxActivity(e.target.value as any);
                      }}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition-all font-sans"
                    >
                      <option value="saas">SaaS (Software / Assinaturas / Tech)</option>
                      <option value="servicos">Prestação de Serviços (TI / Consultoria / Saúde)</option>
                      <option value="comercio">Comércio / E-commerce / Varejo</option>
                      <option value="industria">Fabricação / Indústria Geral</option>
                    </select>
                  </div>

                  {/* Monthly revenue slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-black text-slate-450 font-mono">Faturamento Mensal Estimado</label>
                      <span className="text-xs font-black font-mono text-white">{rawFormatCurrency(taxMonthlyRevenue)}</span>
                    </div>
                    <input
                      type="range"
                      min={5000}
                      max={350000}
                      step={5000}
                      value={taxMonthlyRevenue}
                      onChange={(e) => setTaxMonthlyRevenue(Number(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                      <span>R$ 5K</span>
                      <span>R$ 175K</span>
                      <span>R$ 350K</span>
                    </div>
                  </div>

                  {/* Payroll / Pro-labore slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-black text-slate-450 font-mono">Folha de Salários + Pró-Labore</label>
                      <span className="text-xs font-black font-mono text-white">{rawFormatCurrency(taxPayroll)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={120000}
                      step={1000}
                      value={taxPayroll}
                      onChange={(e) => setTaxPayroll(Number(e.target.value))}
                      className="w-full accent-indigo-505 cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                      <span>R$ 0</span>
                      <span>R$ 60K</span>
                      <span>R$ 120K</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.02]/30 border border-white/5 rounded-2xl text-[10px] text-slate-400 leading-relaxed font-sans">
                    <span className="font-extrabold text-slate-200 block uppercase tracking-wider mb-0.5">Nota DAFNE Fiscal</span>
                    Estimativa dinâmica baseada na receita projetada anual de <strong className="text-white">{rawFormatCurrency(taxMonthlyRevenue * 12)}</strong>. Esses parâmetros são comparados sob as diretrizes vigentes da Receita Federal de 2026.
                  </div>
                </div>

                {/* Simulation Output Cards Comparing Regimes on right */}
                <div className="lg:col-span-8 flex flex-col gap-5 text-left">
                  {(() => {
                    const sn = calcSimplesNacional(taxMonthlyRevenue, taxPayroll, taxActivity);
                    const lp = calcLucroPresumido(taxMonthlyRevenue, taxActivity);
                    const lr = calcLucroReal(taxMonthlyRevenue, taxPayroll, taxActivity);

                    // Determine cheapest
                    const options = [
                      { id: "sn", name: "Simples Nacional", value: sn.taxAmount, rate: sn.effectiveRate, detail: sn.annex },
                      { id: "lp", name: "Lucro Presumido", value: lp.taxAmount, rate: lp.effectiveRate, detail: "Alíquota Fixa Presumida" },
                      { id: "lr", name: "Lucro Real (Simulado)", value: lr.taxAmount, rate: lr.effectiveRate, detail: "Tributação sobre Lucro Efetivo" }
                    ];
                    options.sort((a, b) => a.value - b.value);
                    const cheapest = options[0];
                    const secondCheapest = options[1];
                    const annualSavings = (secondCheapest.value - cheapest.value) * 12;

                    return (
                      <div className="space-y-5 text-left font-sans">
                        {/* Highlights & Best Choice Ribbon */}
                        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans leading-relaxed text-left">
                          <div className="space-y-1 text-left">
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1 font-mono text-left">
                              ⭐ Recomendação Técnica de Otimização
                            </span>
                            <h4 className="text-lg font-black text-white text-left">
                              Regime Recomendado: <span className="text-emerald-400">{cheapest.name}</span>
                            </h4>
                            <p className="text-slate-400 text-xs text-left">
                              A enquadramento ideal para o seu perfil comercial é no <strong className="text-white">{cheapest.name} ({cheapest.detail})</strong> com alíquota efetiva de <strong className="text-emerald-400">{(cheapest.rate * 100).toFixed(2)}%</strong>.
                            </p>
                          </div>
                          
                          {/* Savings meter */}
                          {annualSavings > 100 && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl shrink-0 flex flex-col items-center justify-center font-mono">
                              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">ECONOMIA ESTIMADA</span>
                              <span className="text-xl font-black text-emerald-400 mt-1">{rawFormatCurrency(annualSavings)}/ano</span>
                              <span className="text-[9px] text-slate-450 mt-0.5 italic">vs. segunda melhor via ({secondCheapest.name})</span>
                            </div>
                          )}
                        </div>

                        {/* Comparative Columns Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                          {/* 1. Simples Nacional Card */}
                          <div className={cn(
                            "p-4 rounded-3xl border text-left flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300",
                            cheapest.id === "sn" 
                              ? "bg-slate-900 border-emerald-500/40 shadow-md shadow-emerald-500/[0.03] scale-102"
                              : "bg-slate-950/60 border-white/5 opacity-85 hover:opacity-100"
                          )}>
                            {cheapest.id === "sn" && (
                              <span className="absolute -top-1 right-0 bg-emerald-500 text-slate-950 font-black text-[7px] uppercase tracking-widest px-2.5 py-1 rounded-bl-xl font-mono">IDEAL</span>
                            )}
                            <div className="space-y-1 text-left">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono block">Simples Nacional</span>
                              <span className="text-xs font-black text-white block truncate">{sn.annex}</span>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1.5 text-left">{sn.explanation}</p>
                            </div>

                            <div className="pt-3 border-t border-white/5 space-y-1.5 font-mono text-left">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-500">Alíquota Efetiva:</span>
                                <span className="text-white font-bold">{(sn.effectiveRate * 100).toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-500">Imposto Mensal:</span>
                                <span className="text-white font-extrabold">{rawFormatCurrency(sn.taxAmount)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] pt-1">
                                <span className="text-slate-600">Imposto Anual:</span>
                                <span className="text-slate-400">{rawFormatCurrency(sn.taxAmount * 12)}</span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Lucro Presumido Card */}
                          <div className={cn(
                            "p-4 rounded-3xl border text-left flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300",
                            cheapest.id === "lp" 
                              ? "bg-slate-900 border-emerald-500/40 shadow-md shadow-emerald-500/[0.03] scale-102"
                              : "bg-slate-950/60 border-white/5 opacity-85 hover:opacity-100"
                          )}>
                            {cheapest.id === "lp" && (
                              <span className="absolute -top-1 right-0 bg-emerald-500 text-slate-950 font-black text-[7px] uppercase tracking-widest px-2.5 py-1 rounded-bl-xl font-mono">IDEAL</span>
                            )}
                            <div className="space-y-1 text-left">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono block">Lucro Presumido</span>
                              <span className="text-xs font-black text-white block">Regime por Margem Fixa</span>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1.5 text-left">{lp.description}</p>
                            </div>

                            <div className="pt-3 border-t border-white/5 space-y-1.5 font-mono text-left">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-500">Alíquota Efetiva:</span>
                                <span className="text-white font-bold">{(lp.effectiveRate * 100).toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-500">Imposto Mensal:</span>
                                <span className="text-white font-extrabold">{rawFormatCurrency(lp.taxAmount)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] pt-1">
                                <span className="text-slate-600">Imposto Anual:</span>
                                <span className="text-slate-400">{rawFormatCurrency(lp.taxAmount * 12)}</span>
                              </div>
                            </div>
                          </div>

                          {/* 3. Lucro Real Card */}
                          <div className={cn(
                            "p-4 rounded-3xl border text-left flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300",
                            cheapest.id === "lr" 
                              ? "bg-slate-900 border-emerald-500/40 shadow-md shadow-emerald-500/[0.03] scale-102"
                              : "bg-slate-950/60 border-white/5 opacity-85 hover:opacity-100"
                          )}>
                            {cheapest.id === "lr" && (
                              <span className="absolute -top-1 right-0 bg-emerald-500 text-slate-950 font-black text-[7px] uppercase tracking-widest px-2.5 py-1 rounded-bl-xl font-mono">IDEAL</span>
                            )}
                            <div className="space-y-1 text-left">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono block">Lucro Real</span>
                              <span className="text-xs font-black text-white block">Regime por Lucro Real</span>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1.5 text-left">{lr.description}</p>
                            </div>

                            <div className="pt-3 border-t border-white/5 space-y-1.5 font-mono text-left">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-500">Alíquota Efetiva:</span>
                                <span className="text-white font-bold">{(lr.effectiveRate * 100).toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-500">Imposto Mensal:</span>
                                <span className="text-white font-extrabold">{rawFormatCurrency(lr.taxAmount)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] pt-1">
                                <span className="text-slate-600">Imposto Anual:</span>
                                <span className="text-slate-400">{rawFormatCurrency(lr.taxAmount * 12)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Specific Submodule Widgets based on Type Selected */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pt-4 text-left">
                
                {/* WIDGET A: FATOR R DE ALTA ACCURACY FOR SERVICES/SaaS */}
                {(taxActivity === "saas" || taxActivity === "servicos") && (() => {
                  const factorR = taxMonthlyRevenue > 0 ? (taxPayroll / taxMonthlyRevenue) : 0;
                  const isAnexoIIIEligible = factorR >= 0.28;
                  const recommendedPayroll = Math.ceil(taxMonthlyRevenue * 0.28);
                  
                  return (
                    <div className="p-6 rounded-[2rem] bg-slate-900 border border-white/5 text-left font-sans flex flex-col justify-between space-y-4">
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] font-black uppercase text-orange-400 tracking-wider font-mono flex items-center gap-1 text-left">
                          <Brain size={12} className="text-orange-400" /> Diagnóstico Avançado do Fator R (DAS Nacional)
                        </span>
                        <h4 className="text-base font-black text-white text-left">
                          Status do Fator R:{" "}
                          <span className={isAnexoIIIEligible ? "text-emerald-400" : "text-orange-400 animate-pulse"}>
                            {isAnexoIIIEligible ? "ANEXO III (Ativo - Saudável)" : "ANEXO V (Inativo - Prejudicial)"}
                          </span>
                        </h4>
                        
                        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-white/5 font-mono">
                          <div className="text-center w-1/3">
                            <span className="text-[8px] uppercase font-bold text-slate-500 block">Sua Razão R:</span>
                            <span className={cn(
                              "text-md font-black font-mono",
                              isAnexoIIIEligible ? "text-emerald-400" : "text-orange-400"
                            )}>
                              {(factorR * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div className="text-center w-1/3">
                            <span className="text-[8px] uppercase font-bold text-slate-500 block">Teto Inicial:</span>
                            <span className="text-emerald-400 text-xs font-black font-mono">6.0% (Anexo III)</span>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div className="text-center w-1/3">
                            <span className="text-[8px] uppercase font-bold text-slate-500 block">Piso Atual:</span>
                            <span className={cn("text-xs font-black font-mono", isAnexoIIIEligible ? "text-emerald-500" : "text-rose-450")}>
                              {isAnexoIIIEligible ? "6.0%" : "15.5%"}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed text-left">
                          {isAnexoIIIEligible 
                            ? "Parabéns! Suas despesas de pro-labore e pessoal superam os 28% requeridos pela Lei do Simples. Sua empresa desfruta de uma alíquota reduzida inicial de 6% sobre faturas de serviços."
                            : `Atenção! Sua razão provisória está sob 28%. Isso enquadra a empresa no Anexo V, pagando 15.5% (uma perda de 9.5% de margem operacional sem necessidade legal).`
                          }
                        </p>
                      </div>

                      {!isAnexoIIIEligible ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTaxPayroll(recommendedPayroll);
                            sound.playSuccess();
                            if (showToast) showToast(`Pró-labore elevado para R$ ${recommendedPayroll.toLocaleString('pt-BR')} (28% do faturado mensal). Fator R ativado!`, "success");
                          }}
                          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 font-sans"
                        >
                          ⚡ Otimizar Pró-labore para R$ {recommendedPayroll.toLocaleString('pt-BR')} & Economizar 9.5%
                        </button>
                      ) : (
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase text-center rounded-xl tracking-wider flex items-center justify-center gap-1 font-mono">
                          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> Planejamento Tributário Otimizado
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* WIDGET B: MONOFÁSICO PIS/COFINS AUDITOR FOR COMMERCE/RETAIL */}
                {(taxActivity === "comercio" || taxActivity === "industria") && (
                  <div className="p-6 rounded-[2rem] bg-slate-900 border border-white/5 text-left font-sans flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-left bg-transparent">
                      <span className="text-[9px] font-black uppercase text-orange-400 tracking-wider font-mono flex items-center gap-1 text-left">
                        <Coins size={12} className="text-orange-400" /> Auditoria de PIS/COFINS Monofásicos & Isenções
                      </span>
                      <h4 className="text-base font-black text-white text-left">Segregação Tributária Homologada</h4>
                      
                      <p className="text-[11px] text-slate-400 leading-relaxed text-left">
                        No comércio de cosméticos, bebidas, combustíveis, autopeças, petshops ou medicamentos, o PIS e COFINS são pagos na indústria. O revendedor do Simples Nacional tem direito legal a abater esta parcela de sua DAS mensal, economizando fôlego.
                      </p>

                      {/* Slider for monofasico shares */}
                      <div className="space-y-1.5 pt-1 text-left">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 uppercase font-semibold">Participação de Itens Monofásicos:</span>
                          <span className="text-orange-400 font-extrabold font-mono">{monofasicoPct}% do portfólio</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={monofasicoPct}
                          onChange={(e) => setMonofasicoPct(Number(e.target.value))}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Recalculate credit */}
                      {(() => {
                        const sn = calcSimplesNacional(taxMonthlyRevenue, taxPayroll, taxActivity);
                        const estimatedPisCofinsFraction = sn.taxAmount * 0.1274; // PIS/COFINS represents approx 12.74% of cumulative DAS rate
                        const monthlyCredit = estimatedPisCofinsFraction * (monofasicoPct / 100);
                        const fiveYearsCredit = monthlyCredit * 60;

                        return (
                          <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between gap-3 font-mono text-left">
                            <div className="space-y-0.5 text-left">
                              <span className="text-[8px] uppercase font-bold text-slate-500 block">Recuperável Estimado (Mensal / 5 anos):</span>
                              <span className="text-xs font-black text-white block">{rawFormatCurrency(monthlyCredit)} / mês</span>
                              <span className="text-[9px] text-[#728090] font-semibold flex items-center gap-1">
                                <Coins size={9} className="text-orange-400 animate-pulse" /> {rawFormatCurrency(fiveYearsCredit)} acumulado (60m)
                              </span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                sound.playSuccess();
                                if (showToast) showToast(`Solicitação contábil enviada! Varredura de cupons XMLs dos últimos 60m para captação de ${rawFormatCurrency(fiveYearsCredit)} agendada com seu contador.`, "success");
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-lg cursor-pointer transition-all shrink-0 active:scale-95 font-sans"
                            >
                              Resgatar
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* TAX AI GENERATIVE ADVISOR CARDS */}
                <div className="p-6 rounded-[2rem] bg-slate-900 border border-white/5 text-left font-sans flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-left">
                    <span className="text-[9px] font-black uppercase text-orange-400 tracking-wider font-mono flex items-center gap-1 text-left">
                      <Sparkles size={11} className="text-orange-400" /> Parecer e Planejamento Tributário da I.A.
                    </span>
                    <h4 className="text-base font-black text-white text-left">Auditoria Regulatória Dafne I.A.</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed text-left">
                      Convoque a inteligência de governança da Dafne para tecer um plano de ação tático, contendo regimes tributários preferíveis, limites de faixas jurídicas e blindagens contábeis.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoadingTaxReport(true);
                      sound.playSuccess();
                      if (showToast) showToast("Dafne IA está simulando as faixas tributárias brasileiras vigentes. Aguarde...", "info");
                      
                      setTimeout(() => {
                        const sn = calcSimplesNacional(taxMonthlyRevenue, taxPayroll, taxActivity);
                        const lp = calcLucroPresumido(taxMonthlyRevenue, taxActivity);
                        const lr = calcLucroReal(taxMonthlyRevenue, taxPayroll, taxActivity);
                        const isSnBest = sn.taxAmount < lp.taxAmount && sn.taxAmount < lr.taxAmount;
                        
                        let reportText = `### 📜 LAUDO DE COMPATIBILIDADE FISCAL & PLANEJAMENTO TRIBUTÁRIO 2026

Emitido com base na simulação eletrônica ativa para faturamento estimado de **${rawFormatCurrency(taxMonthlyRevenue)}/mês** (Anual: **${rawFormatCurrency(taxMonthlyRevenue * 12)}**) e investimentos de pessoal em **${rawFormatCurrency(taxPayroll)}/mês**.

---

### 1. COMPILADO COMPARATIVO DE CUSTOS REAIS
- **Simples Nacional (${sn.annex}):** Alíquota Efetiva de **${(sn.effectiveRate * 100).toFixed(2)}%** gerando um gasto anual acumulado de **${rawFormatCurrency(sn.taxAmount * 12)}**.
- **Lucro Presumido:** Alíquota Efetiva de **${(lp.effectiveRate * 100).toFixed(2)}%** gerando um gasto anual acumulado de **${rawFormatCurrency(lp.taxAmount * 12)}**.
- **Lucro Real (Simulado):** Alíquota Efetiva de **${(lr.effectiveRate * 100).toFixed(2)}%** gerando um gasto anual acumulado de **${rawFormatCurrency(lr.taxAmount * 12)}**.

---

### 2. PLANO DE AÇÃO PREVENTIVO DAFNE (CONTROLES FISCAIS)

*   **¹ Otimização do Pró-Labore (Fator R)**: ${taxActivity === "saas" || taxActivity === "servicos" ? `Sua razão de folha é de **${((taxPayroll/taxMonthlyRevenue)*100).toFixed(1)}%**. Ative a razão de no mínimo 28% (aumentando seu Pró-labore para **${rawFormatCurrency(Math.ceil(taxMonthlyRevenue * 0.28))}**) para escapar da alíquota inicial nociva de 15.5% do Anexo V e enquadrar-se a 6.0% no Anexo III. Isso gera economia líquida imediata de mais de **9.5% do seu faturamento bruto**.` : `Sua atividade é de ${taxActivity}. Mantenha a auditoria contábil clássica para reclassificar o NCM de insumos manufaturados.`}
*   **² Segregação Monofásica de Bens**: Se aplica a comércio e varejo físico ou digital de cosméticos, bebidas, peças e utilitários. Mapear CSTs monofásicos para abater o PIS e COFINS na guia mensal do DAS nacional, evitando que a empresa recolha impostos cumulativos em duplicidade.
*   **³ Monitoramento do Sublimite**: Lembre-se que o Simples Nacional possui sublimites estaduais para apuração de ICMS e ISS de R$ 3,6 Milhões por ano. Se suas operações ultrapassarem este marco, o imposto estadual será cobrado por fora da guia e requererá apuração pelo regime tradicional de débito e crédito.

---

### *Diagnóstico de Conformidade Geral do Grupo:* [ RATING AAA - ALTÍSSIMO RESGUARDO ]
A adoção tática do regime de **${isSnBest ? "Simples Nacional" : "Lucro Presumido"}** resguarda sua margem líquida em fôlego positivo e previne vazamento de caixa financeiro para o Erário de forma lícita e estrutural.`;
                        
                        setTaxAIReport(reportText);
                        setLoadingTaxReport(false);
                      }, 1200);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl cursor-pointer transition-all hover:brightness-110 flex items-center justify-center gap-1.5 font-sans"
                  >
                    {loadingTaxReport ? (
                      <>
                        <Loader2 size={12} className="text-slate-950 animate-spin" />
                        Gerando Parecer da Dafne...
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} className="text-slate-950" />
                        Calcular Parecer e Diagnóstico por I.A.
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* RENDER DAFNE AI FISCAL PARECER */}
              {taxAIReport && (
                <div className="mt-8 pt-6 border-t border-white/5 text-left relative z-10">
                  <div className="p-6 md:p-8 bg-slate-900 rounded-[2rem] border border-orange-500/20 space-y-4 max-w-5xl mx-auto text-left">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 text-left">
                      <div className="flex items-center gap-2 text-left">
                        <Shield className="text-orange-500" size={16} />
                        <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 font-sans">AUDITORIA REGULATÓRIA EMITIDA POR DAFNE I.A.</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Autêntico & Licenciado</span>
                    </div>

                    {/* AUDITORY CALIBRATION PLAYER FOR TAX REPORT */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(taxAIReport, true)}
                          className={cn(
                            "p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-[1.02] outline-none",
                            isSpeakingTaxReport 
                              ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse" 
                              : "bg-orange-500 hover:bg-orange-600 text-white"
                          )}
                          title={isSpeakingTaxReport ? "Interromper reprodução física" : "Tocar relatório fiscal em voz alta"}
                        >
                          {isSpeakingTaxReport ? <Square size={13} fill="currentColor" /> : <Volume2 size={13} className="animate-pulse" />}
                        </button>
                        <div className="text-left">
                          <h5 className="font-extrabold text-[11px] text-white m-0 leading-tight">
                            {isSpeakingTaxReport ? "Dafne está lendo..." : "Ouvir Diagnóstico Tributário por Voz"}
                          </h5>
                          <p className="text-[8px] m-0 text-slate-400 mt-0.5 uppercase tracking-wider font-bold">
                            Timbre e velocidade de leitura calibrados
                          </p>
                        </div>
                      </div>
                      
                      {/* Mini Equalizer */}
                      <div className="flex items-end gap-1 bg-white/5 py-1.5 px-3 rounded-lg border border-white/5 shrink-0 w-28 justify-center h-7 overflow-hidden">
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={isSpeakingTaxReport ? {
                              height: [
                                "20%", 
                                `${Math.floor(Math.random() * 80) + 20}%`, 
                                `${Math.floor(Math.random() * 50) + 10}%`, 
                                "20%"
                              ]
                            } : {
                              height: "20%"
                            }}
                            transition={isSpeakingTaxReport ? {
                              duration: 0.4 + (i % 3) * 0.1,
                              repeat: Infinity,
                              ease: "easeInOut"
                            } : {}}
                            className={cn(
                              "w-[2.5px] rounded-full transition-all duration-300",
                              isSpeakingTaxReport ? "bg-orange-500" : "bg-slate-600"
                            )}
                            style={{ height: "4px" }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed font-sans prose prose-invert max-w-none text-left">
                      <QuickMarkdownRenderer text={taxAIReport} />
                    </div>

                    <div className="flex justify-end pt-3 border-t border-white/5 text-left">
                      <button
                        onClick={() => {
                          const doc = new jsPDF();
                          doc.setFont("helvetica", "bold");
                          doc.setFontSize(16);
                          doc.text("PARECER E PLANEJAMENTO TRIBUTÁRIO - DAFNE IA", 14, 20);
                          doc.setFont("helvetica", "normal");
                          doc.setFontSize(10);
                          let textY = 30;
                          
                          const lines = taxAIReport.split("\n");
                          lines.forEach((line) => {
                            if (textY > 280) {
                              doc.addPage();
                              textY = 20;
                            }
                            const text = line.replace(/###/g, "").replace(/\*\*/g, "").trim();
                            if (!text) return;
                            doc.text(text, 14, textY);
                            textY += 6;
                          });
                          doc.save(`Parecer_Tributario_Dafne_${Date.now()}.pdf`);
                          if (showToast) showToast("Parecer tributário baixado com sucesso!", "success");
                        }}
                        className="py-1.5 px-3 bg-slate-850 hover:bg-slate-800 text-white font-mono rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download size={11} className="text-slate-400" /> Exportar Laudo Fiscal PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {activeSubTab === "reports" && (
          <motion.div
            key="reports-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-slate-800"
          >
            {/* Header Description */}
            <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-[2.5rem] shadow-xs text-left relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="text-orange-500" size={20} />
                    Central de Relatórios Corporativos Multi-Frentes
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Consolide as 6 frentes do negócio (Liquidez de Caixa, DRE Geral, Precificação SKU/CMV, Diagnóstico de Valuation/Exit, Simulador estratégico e Parecer da Dafne IA) em um único arquivo PDF altamente polido.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-xl shrink-0">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Dados Sincronizados</span>
                </div>
              </div>
            </div>

            {/* Config & Choices Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* BRANDING SETUP PANEL */}
              <div className="lg:col-span-5 bg-white border border-gray-150 p-6 rounded-[2.5rem] shadow-xs space-y-6">
                <div>
                  <h4 className="font-black uppercase text-xs text-slate-900 flex items-center gap-1.5 border-b border-gray-150 pb-3">
                    <span>1. Estilo / Cores da Empresa</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-wider text-left">
                    Selecione um tema pré-configurado ou selecione as cores hexadecimais da sua marca:
                  </p>
                </div>

                {/* Preset List */}
                <div className="space-y-2 text-left">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedThemePreset(preset.id);
                        setBrandPrimary(preset.primary);
                        setBrandSecondary(preset.secondary);
                      }}
                      className={cn(
                        "w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        selectedThemePreset === preset.id
                          ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                          : "bg-gray-50 text-slate-700 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      <span className="font-black uppercase tracking-wide text-[10px]">{preset.name}</span>
                      <div className="flex gap-1.5 shrink-0">
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: rgbToHex(preset.primary.r, preset.primary.g, preset.primary.b) }} />
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: rgbToHex(preset.secondary.r, preset.secondary.g, preset.secondary.b) }} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Manual Hex Selectors */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cor Primária</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                      <input
                        type="color"
                        value={rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b)}
                        onChange={(e) => {
                          setSelectedThemePreset("custom");
                          setBrandPrimary(hexToRgb(e.target.value));
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent shrink-0"
                      />
                      <span className="font-mono text-[10px] font-black uppercase">{rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cor Secundária</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                      <input
                        type="color"
                        value={rgbToHex(brandSecondary.r, brandSecondary.g, brandSecondary.b)}
                        onChange={(e) => {
                          setSelectedThemePreset("custom");
                          setBrandSecondary(hexToRgb(e.target.value));
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent shrink-0"
                      />
                      <span className="font-mono text-[10px] font-black uppercase">{rgbToHex(brandSecondary.r, brandSecondary.g, brandSecondary.b)}</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Preview Card Mock */}
                <div className="border-t border-gray-100 pt-5 space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block text-left">Prévia ao Vivo da Capa Personalizada</label>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-gray-200 overflow-hidden relative">
                    {/* Simulated ABNT Document Cover in Miniature */}
                    <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm min-h-[160px] flex flex-col justify-between text-left relative overflow-hidden">
                      {/* Brand Banner Preview */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-2"
                        style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }}
                      />
                      <div 
                        className="absolute top-2 left-0 right-0 h-1 opacity-60"
                        style={{ backgroundColor: rgbToHex(brandSecondary.r, brandSecondary.g, brandSecondary.b) }}
                      />
                      
                      <div className="space-y-1 text-center pt-3">
                        <span className="text-[8px] font-black tracking-widest text-slate-400 block uppercase">{getActiveStoreLabel()}</span>
                        <div className="w-10 h-0.5 mx-auto opacity-30 mt-1" style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }} />
                      </div>

                      <div className="text-center py-2">
                        <h5 className="text-[9px] font-black tracking-tight text-slate-900 uppercase">Diagnóstico e Performance Corporativa</h5>
                        <p className="text-[7px] text-slate-500 mt-0.5 leading-none">Auditoria Integrada de Finanças e Soluções PJ</p>
                      </div>

                      <div className="text-center pb-1">
                        <span className="text-[6px] font-mono font-bold text-slate-400 uppercase tracking-wide">Dafne inteligência financeira</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* REPORT VOUCHERS DOWNLOADS GRID */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* ABNT Academic Report card */}
                <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-[2.5rem] shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-full hover:shadow-xs transition-shadow">
                  <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 border-b border-l border-gray-200 text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest font-mono">
                    Normativa NBR
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Relatório Completo nas Normas ABNT
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Formatação formal, neutra e técnica estruturada de conformidade com as diretrizes acadêmicas brasileiras. Ideal para apresentação em conselhos de administração, auditorias oficiais de contabilidade, envio para instituições financeiras e relatórios legais formais.
                    </p>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-medium space-y-2">
                      <span className="font-extrabold uppercase text-[9px] text-slate-400 tracking-wider block">Frentes inclusas no Sumário:</span>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                        <li className="flex items-center gap-1.5">✓ Performance de Caixa</li>
                        <li className="flex items-center gap-1.5">✓ Tabela DRE Geral</li>
                        <li className="flex items-center gap-1.5">✓ Análise CMV & SKUs</li>
                        <li className="flex items-center gap-1.5">✓ Valuation Estimado</li>
                        <li className="flex items-center gap-1.5">✓ Plano de Metas Ativo</li>
                        <li className="flex items-center gap-1.5">✓ Parecer da Dafne IA</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => exportFullComprehensivePDF(true)}
                    className="mt-6 w-full bg-slate-900 hover:bg-slate-950 active:scale-98 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all cursor-pointer shadow-md shadow-slate-950/15 flex items-center justify-center gap-2"
                  >
                    <Download size={13} />
                    Download PDF Estilo ABNT
                  </button>
                </div>

                {/* Branded corporate customized style card */}
                <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-[2.5rem] shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-full hover:shadow-xs transition-shadow">
                  <div className="absolute top-0 right-0 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest font-mono" style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }}>
                    Identidade Corporativa
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }} />
                      Relatório Geral Personalizado (Cores da Empresa)
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Estampado com as cores de marca selecionadas por você. Apresenta elementos visuais integrados de alto impacto como cabeçalhos estilizados, fitas e barras dinâmicas coloridas, quadros de KPIs personalizados e tabelas com sombreamento correspondente. Perfeito para parceiros de negócios, investidores e equipes internas.
                    </p>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-medium space-y-2">
                      <span className="font-extrabold uppercase text-[9px] text-slate-400 tracking-wider block">Frentes inclusas no Sumário:</span>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                        <li className="flex items-center gap-1.5">✓ Performance de Caixa</li>
                        <li className="flex items-center gap-1.5">✓ Tabela DRE Geral</li>
                        <li className="flex items-center gap-1.5">✓ Análise CMV & SKUs</li>
                        <li className="flex items-center gap-1.5">✓ Valuation Estimado</li>
                        <li className="flex items-center gap-1.5">✓ Plano de Metas Ativo</li>
                        <li className="flex items-center gap-1.5">✓ Parecer da Dafne IA</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => exportFullComprehensivePDF(false)}
                    style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }}
                    className="mt-6 w-full hover:brightness-110 active:scale-98 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Download size={13} />
                    Download PDF Estilo Corporativo
                  </button>
                </div>

              </div>

            </div>

            {/* COMPARATOR OF PERIODS */}
            <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-[2.5rem] shadow-sm text-left mt-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-150 pb-5 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <LineChart className="text-orange-500" size={18} />
                    Comparador de DRE Avançado (Lado a Lado - Até 3 Meses)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selecione até três meses para comparar receitas, despesas e margens detalhadamente com cálculo automático de variação percentual sincronizado por rubrica.
                  </p>
                </div>

                {/* Selection dropdowns for Month A, Month B and Month C */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mês A:</span>
                    <select
                      id="comp-select-a"
                      value={compareMonthA.getTime()}
                      onChange={(e) => {
                        const match = months.find((m) => m.getTime() === Number(e.target.value));
                        if (match) {
                          sound.playClick();
                          setCompareMonthA(match);
                        }
                      }}
                      className="text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      {months.map((m) => (
                        <option key={`comp-a-${m.getTime()}`} value={m.getTime()}>
                          {format(m, "MMMM 'de' yyyy", { locale: ptBR })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mês B:</span>
                    <select
                      id="comp-select-b"
                      value={compareMonthB.getTime()}
                      onChange={(e) => {
                        const match = months.find((m) => m.getTime() === Number(e.target.value));
                        if (match) {
                          sound.playClick();
                          setCompareMonthB(match);
                        }
                      }}
                      className="text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      {months.map((m) => (
                        <option key={`comp-b-${m.getTime()}`} value={m.getTime()}>
                          {format(m, "MMMM 'de' yyyy", { locale: ptBR })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mês C (Opcional):</span>
                    <select
                      id="comp-select-c"
                      value={compareMonthC ? compareMonthC.getTime() : "none"}
                      onChange={(e) => {
                        sound.playClick();
                        if (e.target.value === "none") {
                          setCompareMonthC(null);
                        } else {
                          const match = months.find((m) => m.getTime() === Number(e.target.value));
                          if (match) setCompareMonthC(match);
                        }
                      }}
                      className="text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="none">Nenhum (Comparar 2 meses)</option>
                      {months.map((m) => (
                        <option key={`comp-c-${m.getTime()}`} value={m.getTime()}>
                          {format(m, "MMMM 'de' yyyy", { locale: ptBR })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* DRE Rows Generation and side-by-side rendering */}
              {(() => {
                const dreLinesA = getDRE(compareMonthA);
                const dreLinesB = getDRE(compareMonthB);
                const dreLinesC = compareMonthC ? getDRE(compareMonthC) : [];

                // Standard function to calculate percentage variance safely and identify if it is improved or not
                const calculateChange = (vA: number, vB: number, label: string) => {
                  const isExpense = label.includes("(-)") || 
                                    label.toLowerCase().includes("despesa") || 
                                    label.toLowerCase().includes("custo") || 
                                    label.toLowerCase().includes("imposto") || 
                                    label.toLowerCase().includes("dedução") || 
                                    label.toLowerCase().includes("cmv") || 
                                    label.toLowerCase().includes("cpv");

                  if (vA === 0 && vB === 0) return { pct: 0, text: "0.0%", isImproved: true, isNoChange: true };
                  if (vA === 0) return { pct: 100, text: vB > 0 ? "+100%" : "-100%", isImproved: isExpense ? vB < 0 : vB > 0 };

                  const absA = Math.abs(vA);
                  const absB = Math.abs(vB);
                  const diff = absB - absA;
                  const pct = absA !== 0 ? (diff / absA) * 100 : 0;
                  
                  let isImproved = false;
                  if (isExpense) {
                    // Expenses: lower absolute value is improved (green)
                    isImproved = absB < absA;
                  } else {
                    // Income/Profit: higher signed value is improved (green)
                    isImproved = vB > vA;
                  }

                  const direction = diff > 0 ? "+" : "";
                  const text = `${direction}${pct.toFixed(1)}%`;

                  return {
                    pct,
                    text,
                    isImproved,
                    isNoChange: diff === 0
                  };
                };

                // Alignment mapping logic: ensures all lines that exist in any month are compiled sequentially
                const labelMap = new Map<string, { label: string; isBold?: boolean; indent?: number }>();
                
                const processDREForMapping = (lines: typeof dreLinesA) => {
                  lines.forEach(l => {
                    if (!labelMap.has(l.label)) {
                      labelMap.set(l.label, {
                        label: l.label,
                        isBold: l.isBold,
                        indent: l.indent
                      });
                    }
                  });
                };

                processDREForMapping(dreLinesA);
                processDREForMapping(dreLinesB);
                if (compareMonthC) processDREForMapping(dreLinesC);

                const alignedLines = Array.from(labelMap.values()).map(info => {
                  const itemA = dreLinesA.find(l => l.label === info.label);
                  const itemB = dreLinesB.find(l => l.label === info.label);
                  const itemC = compareMonthC ? dreLinesC.find(l => l.label === info.label) : null;

                  const valA = itemA ? itemA.value : 0;
                  const valB = itemB ? itemB.value : 0;
                  const valC = itemC ? itemC.value : 0;

                  const changeAB = calculateChange(valA, valB, info.label);
                  const changeBC = compareMonthC ? calculateChange(valB, valC, info.label) : null;

                  return {
                    ...info,
                    valA,
                    valB,
                    valC,
                    changeAB,
                    changeBC
                  };
                });

                // Top high-level key entries to feed Recharts for quick visualization
                const keyPositions = [
                  "RECEITA OPERACIONAL BRUTA",
                  "(=) RECEITA OPERACIONAL LÍQUIDA",
                  "(=) LUCRO BRUTO",
                  "(=) EBITDA / RESULTADO OPERACIONAL",
                  "(=) RESULTADO LÍQUIDO DO PERÍODO"
                ];

                const chartIndicators = keyPositions.map(labelKey => {
                  const aligned = alignedLines.find(l => l.label === labelKey);
                  // shorten labels for charts legibility
                  let shortLabel = labelKey
                    .replace("(=) ", "")
                    .replace(" / RESULTADO OPERACIONAL", "")
                    .replace(" DO PERÍODO", "");

                  return {
                    name: shortLabel,
                    [format(compareMonthA, "MMM/yy", { locale: ptBR }).toUpperCase()]: aligned ? Math.max(0, aligned.valA) : 0,
                    [format(compareMonthB, "MMM/yy", { locale: ptBR }).toUpperCase()]: aligned ? Math.max(0, aligned.valB) : 0,
                    ...(compareMonthC ? {
                      [format(compareMonthC, "MMM/yy", { locale: ptBR }).toUpperCase()]: aligned ? Math.max(0, aligned.valC) : 0
                    } : {})
                  };
                });

                return (
                  <div className="space-y-8">
                    {/* TABLE SIDE */}
                    <div className="overflow-x-auto border border-gray-150 rounded-3xl bg-white shadow-xs">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-150 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            <th className="p-4 w-[30%]">Linha do DRE / Conta</th>
                            <th className="p-4 text-right bg-indigo-50/20">{format(compareMonthA, "MMMM 'de' yyyy", { locale: ptBR })}</th>
                            <th className="p-4 text-right bg-orange-50/20">{format(compareMonthB, "MMMM 'de' yyyy", { locale: ptBR })}</th>
                            <th className="p-4 text-center bg-orange-100/30">Variação (A → B)</th>
                            {compareMonthC && (
                              <>
                                <th className="p-4 text-right bg-emerald-50/20">{format(compareMonthC, "MMMM 'de' yyyy", { locale: ptBR })}</th>
                                <th className="p-4 text-center bg-emerald-100/30">Variação (B → C)</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-155 text-xs font-semibold">
                          {alignedLines.map((row, idx) => {
                            const isHeadingType = row.isBold;
                            const isCmv = row.label.includes("CMV");

                            return (
                              <tr 
                                key={`row-comp-dre-${idx}`} 
                                className={cn(
                                  "transition-colors",
                                  isHeadingType 
                                    ? "bg-slate-50/80 font-black text-slate-950 uppercase border-y border-slate-200/60 hover:bg-slate-50" 
                                    : isCmv
                                      ? "bg-orange-50/35 text-slate-905 font-bold border-l-4 border-orange-500 hover:bg-orange-50/50"
                                      : "text-slate-600 hover:bg-slate-50/50"
                                )}
                              >
                                {/* ACCOUNT LABEL WITH GRACEFUL INDENT */}
                                <td className="p-4">
                                  <div 
                                    style={{ paddingLeft: `${(row.indent || 0) * 16}px` }}
                                    className="flex items-center gap-1.5"
                                  >
                                    {!isHeadingType && <span className="text-gray-400 tracking-tighter sm:inline hidden shrink-0 font-mono">•</span>}
                                    <span className="truncate max-w-[280px] sm:max-w-none">{row.label}</span>
                                    {isCmv && (
                                      <span className="px-1.5 py-0.5 rounded-[5px] text-[8px] tracking-tighter font-extrabold uppercase font-mono bg-orange-600 text-white shadow-xs animate-pulse shrink-0">
                                        DESPESA DEDUTÍVEL ANTES DE OPERACIONAL
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* MONTH A VALUE */}
                                <td className={cn("p-4 text-right font-mono font-bold text-slate-700 bg-indigo-50/5", isHeadingType && "text-slate-950")}>
                                  {row.valA < 0 ? "(" : ""}
                                  {rawFormatCurrency(Math.abs(row.valA))}
                                  {row.valA < 0 ? ")" : ""}
                                </td>

                                {/* MONTH B VALUE */}
                                <td className={cn("p-4 text-right font-mono font-bold text-slate-800 bg-orange-50/5", isHeadingType && "text-slate-950")}>
                                  {row.valB < 0 ? "(" : ""}
                                  {rawFormatCurrency(Math.abs(row.valB))}
                                  {row.valB < 0 ? ")" : ""}
                                </td>

                                {/* VARIATION A -> B */}
                                <td className="p-4 bg-orange-100/10 text-center">
                                  {row.changeAB.isNoChange ? (
                                    <span className="text-slate-400 font-mono text-[10px]">-</span>
                                  ) : (
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase font-mono border inline-flex items-center gap-1",
                                      row.changeAB.isImproved
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                        : "bg-rose-50 text-rose-700 border-rose-200/50"
                                    )}>
                                      {row.changeAB.isImproved ? <ArrowUpCircle size={10} /> : <ArrowDownCircle size={10} />}
                                      {row.changeAB.text}
                                    </span>
                                  )}
                                </td>

                                {/* MONTH C AND VARIATION B -> C (IF REQUISITED) */}
                                {compareMonthC && (
                                  <>
                                    <td className={cn("p-4 text-right font-mono font-bold text-slate-800 bg-emerald-50/5", isHeadingType && "text-slate-950")}>
                                      {row.valC < 0 ? "(" : ""}
                                      {rawFormatCurrency(Math.abs(row.valC))}
                                      {row.valC < 0 ? ")" : ""}
                                    </td>

                                    <td className="p-4 bg-emerald-100/10 text-center">
                                      {row.changeBC && row.changeBC.isNoChange ? (
                                        <span className="text-slate-400 font-mono text-[10px]">-</span>
                                      ) : row.changeBC ? (
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase font-mono border inline-flex items-center gap-1",
                                          row.changeBC.isImproved
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                            : "bg-rose-50 text-rose-700 border-rose-200/50"
                                        )}>
                                          {row.changeBC.isImproved ? <ArrowUpCircle size={10} /> : <ArrowDownCircle size={10} />}
                                          {row.changeBC.text}
                                        </span>
                                      ) : null}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* DYNAMIC COMBINED BAR CHART AND VARIANCE EVALUATION OUTLINE */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      
                      {/* CHART SIDE */}
                      <div className="lg:col-span-12 xl:col-span-7 bg-slate-50/55 border border-slate-100 p-6 rounded-[2rem] flex flex-col justify-between min-h-[350px]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 text-left">
                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-sans">Comportamento Geral das Rubricas Principais</span>
                            <h4 className="text-xs font-black text-slate-800 mt-0.5">Indicadores do DRE de Resultados Lado a Lado (R$)</h4>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-[9px] font-black text-slate-600 font-mono">
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-[#4F46E5] rounded-[4px]" />
                              <span>{format(compareMonthA, "MMM/yy", { locale: ptBR }).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-[#F97316] rounded-[4px]" />
                              <span>{format(compareMonthB, "MMM/yy", { locale: ptBR }).toUpperCase()}</span>
                            </div>
                            {compareMonthC && (
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-[#10B981] rounded-[4px]" />
                                <span>{format(compareMonthC, "MMM/yy", { locale: ptBR }).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="h-[260px] w-full mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={chartIndicators}
                              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 8, fontWeight: 800, fill: "#64748B" }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis 
                                tickFormatter={(val) => `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                                tick={{ fontSize: 9, fontWeight: 600, fill: "#64748B" }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <RechartsTooltip 
                                formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]}
                                labelClassName="text-xs font-black text-slate-800 uppercase"
                                contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                              />
                              <Bar dataKey={format(compareMonthA, "MMM/yy", { locale: ptBR }).toUpperCase()} fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={16} />
                              <Bar dataKey={format(compareMonthB, "MMM/yy", { locale: ptBR }).toUpperCase()} fill="#F97316" radius={[4, 4, 0, 0]} barSize={16} />
                              {compareMonthC && (
                                <Bar dataKey={format(compareMonthC, "MMM/yy", { locale: ptBR }).toUpperCase()} fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} />
                              )}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* SUMMARY / EXPLANATION OUTLINE CARD */}
                      <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between">
                        <div className="bg-orange-50/60 border border-orange-100 p-6 rounded-[2rem] text-left h-full flex flex-col justify-between">
                          <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase text-orange-850 tracking-wider flex items-center gap-1.5 border-b border-orange-200/50 pb-3">
                              <Bot size={14} className="text-orange-500 animate-pulse" />
                              Parecer de Sensibilidade Econômica
                            </span>
                            
                            <div className="text-xs text-orange-950/80 space-y-3 leading-relaxed font-sans">
                              {(() => {
                                // Extract and check variations of Revenue and expenses
                                const revA = alignedLines.find(l => l.label === "RECEITA OPERACIONAL BRUTA")?.valA || 0;
                                const revB = alignedLines.find(l => l.label === "RECEITA OPERACIONAL BRUTA")?.valB || 0;
                                const revC = compareMonthC ? (alignedLines.find(l => l.label === "RECEITA OPERACIONAL BRUTA")?.valC || 0) : null;

                                const expA = Math.abs(alignedLines.find(l => l.label === "(-) Despesas Operacionais (OPEX)")?.valA || 0);
                                const expB = Math.abs(alignedLines.find(l => l.label === "(-) Despesas Operacionais (OPEX)")?.valB || 0);
                                const expC = compareMonthC ? Math.abs(alignedLines.find(l => l.label === "(-) Despesas Operacionais (OPEX)")?.valC || 0) : null;

                                const netA = alignedLines.find(l => l.label === "(=) RESULTADO LÍQUIDO DO PERÍODO")?.valA || 0;
                                const netB = alignedLines.find(l => l.label === "(=) RESULTADO LÍQUIDO DO PERÍODO")?.valB || 0;
                                const netC = compareMonthC ? (alignedLines.find(l => l.label === "(=) RESULTADO LÍQUIDO DO PERÍODO")?.valC || 0) : null;

                                let trendStr = "";

                                // Compare A -> B
                                if (revB > revA && expB <= expA) {
                                  trendStr += "No período inicial (Mês A para Mês B), a companhia apresentou excelente alavancagem operacional expandindo faturamento bruto e contraindo OPEX de forma otimizada. ";
                                } else if (revB > revA && expB > expA) {
                                  trendStr += `A dilatação de OPEX entre Mês A e B (${((expB-expA)/expA*100).toFixed(1)}%) foi acompanhada por uma expansão do faturamento da ordem de ${((revB-revA)/revA*100).toFixed(1)}%. `;
                                } else {
                                  trendStr += "Identificamos retração de faturamento ou aumento indevido de OPEX na primeira perna da comparação. ";
                                }

                                // If Month C is active
                                if (compareMonthC && revC !== null && expC !== null && netC !== null) {
                                  const revVarBC = revC > revB;
                                  const expVarBC = expC <= expB;
                                  
                                  if (revVarBC && expVarBC) {
                                    trendStr += "Seguindo para o Mês C, observa-se aceleração consistente e excelente mitigação de perdas operacionais, demonstrando tração robusta.";
                                  } else if (revVarBC) {
                                    trendStr += `O faturamento do Mês C continuou crescendo (+${((revC-revB)/revB*100).toFixed(1)}%), porém acompanhado por despesas mais salgadas em custos administrativos.`;
                                  } else {
                                    trendStr += "No Mês C, houve arrefecimento comercial. Recomenda-se investigar a conversão de canais de aquisição para estancar desvios operacionais.";
                                  }
                                } else {
                                  trendStr += "Selecione um terceiro mês (Mês C) para expandir a análise histórica e obter projeções de ciclo orçamentário completo.";
                                }

                                return <p className="leading-relaxed">{trendStr}</p>;
                              })()}
                            </div>
                          </div>

                          <div className="bg-orange-100/40 p-3 rounded-xl border border-orange-200/50 mt-4 text-[10px] text-orange-900/80 font-mono">
                            ✓ Cálculo automático de CMV integrado • Indentação de rubricas no padrão DRE Gerencial de conformidade fiscal.
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}
            </div>

          </motion.div>
        )}

        {activeSubTab === "operational-audit" && (
          <motion.div
            key="operational-audit-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <OperationalAuditView />
          </motion.div>
        )}

        {activeSubTab === "monthly-audit" && (
          <motion.div
            key="monthly-audit-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <MonthlyAuditView />
          </motion.div>
        )}

        {activeSubTab === "stores" && (
          <motion.div
            key="stores-consolidation-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <StoresConsolidationSubView />
          </motion.div>
        )}

        {activeSubTab === "cockpit-decisoes" && (
          <motion.div
            key="strategic-cockpit-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <StrategicCockpitView />
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
