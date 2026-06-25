import React, { useState, useEffect, useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { sound } from "../utils/SoundEngine";
import {
  Scale,
  Receipt,
  Landmark,
  Calendar,
  Percent,
  PiggyBank,
  Sparkles,
  TrendingDown,
  Target,
  HelpCircle,
  FileText,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Sliders,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronDown,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";

export default function TaxPlanningView() {
  const {
    transactions,
    allTransactions,
    profile,
    showToast,
    isDemoMode,
  } = useFinance();

  // Active view tab inside the tax module
  const [activeSubTab, setActiveSubTab] = useState<"calculator" | "fatorR" | "monofasico" | "schedule">("calculator");

  // Inputs mapped to Brazilian business characteristics
  const [businessType, setBusinessType] = useState<"service" | "commerce">("service");
  const [monthlyRevenueInput, setMonthlyRevenueInput] = useState<number>(0);
  const [annualRevenueInput, setAnnualRevenueInput] = useState<number>(0);
  const [currentTaxRate, setCurrentTaxRate] = useState<number>(6); // Brutos baseline Simples rate
  const [localISSRate, setLocalISSRate] = useState<number>(3.0); // municipal ISS or commerce state average
  const [payrollInput, setPayrollInput] = useState<number>(0); // Monthly wages + pro-labore for Fator R
  const [realProfitMargin, setRealProfitMargin] = useState<number>(15); // operating profit Margin for Lucro Real sim
  const [monofasicoProductPct, setMonofasicoProductPct] = useState<number>(0); // Percentage of revenue in monofasicos

  // Help Tooltips State
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Sync initial inputs with actual real-time database totals if available
  const dbCurrentMonthRevenue = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === "income" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const dbLtmRevenue = useMemo(() => {
    // Cumulative 12-month revenue
    return allTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [allTransactions]);

  useEffect(() => {
    const initialMonthly = dbCurrentMonthRevenue > 0 ? dbCurrentMonthRevenue : 0;
    const initialLtm = dbLtmRevenue > 0 ? dbLtmRevenue : (initialMonthly * 12);
    
    setMonthlyRevenueInput(initialMonthly);
    setAnnualRevenueInput(initialLtm);
    
    // Estimate logical payroll (approx 25% of monthly revenue is standard for small SME)
    setPayrollInput(Math.round(initialMonthly * 0.25));
  }, [dbCurrentMonthRevenue, dbLtmRevenue]);

  // Adjust defaults when changing business sector
  const handleBusinessTypeChange = (type: "service" | "commerce") => {
    sound.playClick();
    setBusinessType(type);
    if (type === "service") {
      setLocalISSRate(3.0); // Safe ISS average
      setCurrentTaxRate(6.0); // Safe Anexo III baseline
    } else {
      setLocalISSRate(12.0); // ICMS standard effective with retail credits
      setCurrentTaxRate(4.0); // Anexo I baseline
    }
  };

  // Tax Calculators based on precise progressive bracket rules
  const getSimplesNacionalCalculation = (
    type: "service" | "commerce",
    monthlyRev: number,
    annualRev: number,
    hasFatorRApply: boolean
  ) => {
    let anexo: 1 | 3 | 5 = 1;
    if (type === "commerce") {
      anexo = 1;
    } else {
      anexo = hasFatorRApply ? 3 : 5;
    }

    let nominalRate = 0.06;
    let deduction = 0;
    let bracketName = "Faixa 1";

    if (anexo === 1) { // Anexo I (Commerce)
      if (annualRev <= 180000) { nominalRate = 0.04; deduction = 0; bracketName = "Faixa 1 (Até R$ 180k)"; }
      else if (annualRev <= 360000) { nominalRate = 0.073; deduction = 5940; bracketName = "Faixa 2 (R$ 180k - R$ 360k)"; }
      else if (annualRev <= 720000) { nominalRate = 0.095; deduction = 13860; bracketName = "Faixa 3 (R$ 360k - R$ 720k)"; }
      else if (annualRev <= 1800000) { nominalRate = 0.107; deduction = 22500; bracketName = "Faixa 4 (R$ 720k - R$ 1.8M)"; }
      else if (annualRev <= 3600000) { nominalRate = 0.143; deduction = 87300; bracketName = "Faixa 5 (R$ 1.8M - R$ 3.6M)"; }
      else { nominalRate = 0.19; deduction = 378000; bracketName = "Faixa 6 (R$ 3.6M - R$ 4.8M)"; }
    } else if (anexo === 3) { // Anexo III (Services with Fator R or simple tech)
      if (annualRev <= 180000) { nominalRate = 0.06; deduction = 0; bracketName = "Faixa 1 (Até R$ 180k)"; }
      else if (annualRev <= 360000) { nominalRate = 0.112; deduction = 9360; bracketName = "Faixa 2 (R$ 180k - R$ 360k)"; }
      else if (annualRev <= 720000) { nominalRate = 0.135; deduction = 17640; bracketName = "Faixa 3 (R$ 360k - R$ 720k)"; }
      else if (annualRev <= 1800000) { nominalRate = 0.16; deduction = 35640; bracketName = "Faixa 4 (R$ 720k - R$ 1.8M)"; }
      else if (annualRev <= 3600000) { nominalRate = 0.21; deduction = 125640; bracketName = "Faixa 5 (R$ 1.8M - R$ 3.6M)"; }
      else { nominalRate = 0.33; deduction = 648000; bracketName = "Faixa 6 (R$ 3.6M - R$ 4.8M)"; }
    } else { // Anexo V (Services with no Fator R, higher tax)
      if (annualRev <= 180000) { nominalRate = 0.155; deduction = 0; bracketName = "Faixa 1 (Até R$ 180k)"; }
      else if (annualRev <= 360000) { nominalRate = 0.18; deduction = 4500; bracketName = "Faixa 2 (R$ 180k - R$ 360k)"; }
      else if (annualRev <= 720000) { nominalRate = 0.195; deduction = 9900; bracketName = "Faixa 3 (R$ 360k - R$ 720k)"; }
      else if (annualRev <= 1800000) { nominalRate = 0.205; deduction = 17100; bracketName = "Faixa 4 (R$ 720k - R$ 1.8M)"; }
      else if (annualRev <= 3600000) { nominalRate = 0.23; deduction = 62100; bracketName = "Faixa 5 (R$ 1.8M - R$ 3.6M)"; }
      else { nominalRate = 0.305; deduction = 540000; bracketName = "Faixa 6 (R$ 3.6M - R$ 4.8M)"; }
    }

    // DAS effective rate Formula: (RBT12 * nominalRate - deduction) / RBT12
    let effectiveRate = annualRev > 0 ? ((annualRev * nominalRate) - deduction) / annualRev : nominalRate;
    
    // Bounds check to safeguard legal minimums
    if (effectiveRate < 0.04) {
      effectiveRate = anexo === 1 ? 0.04 : 0.06;
    }

    return {
      anexo,
      nominalRate,
      effectiveRate,
      deduction,
      bracketName,
      monthlyTaxVal: monthlyRev * effectiveRate
    };
  };

  // Complete calculations calculated based on states
  const factorRRatioPct = monthlyRevenueInput > 0 ? (payrollInput / monthlyRevenueInput) * 100 : 0;
  const isFatorREligible = factorRRatioPct >= 28;

  const calculatedSimples = useMemo(() => {
    return getSimplesNacionalCalculation(businessType, monthlyRevenueInput, annualRevenueInput, isFatorREligible);
  }, [businessType, monthlyRevenueInput, annualRevenueInput, isFatorREligible]);

  const derivedLucroPresumido = useMemo(() => {
    // 32% presumptive profit for services, 8% for commerce
    const presumptiveMargin = businessType === "service" ? 0.32 : 0.08;
    const presumptiveProfitBase = monthlyRevenueInput * presumptiveMargin;

    // Federal income taxes: IRPJ 15% + CSLL 9% = 24% of the presumptive margin.
    // If presumptive profit exceeds R$ 20.000, there is an extra 10% IRPJ.
    const standardIrcsTax = presumptiveProfitBase * 0.24;
    const extraIrcsSurcharge = Math.max(0, (presumptiveProfitBase - 20000) * 0.10);
    const totalFederalIncomeTax = standardIrcsTax + extraIrcsSurcharge;

    // PIS + COFINS cumulative (0.65% + 3.00% = 3.65% on gross revenue)
    const pisCofinsTax = monthlyRevenueInput * 0.0365;

    // Local standard taxes (ISS for service, ICMS net for commerce)
    const localInvoicedTax = monthlyRevenueInput * (localISSRate / 100);

    const totalTaxes = totalFederalIncomeTax + pisCofinsTax + localInvoicedTax;
    const effectiveRate = monthlyRevenueInput > 0 ? totalTaxes / monthlyRevenueInput : 0.14;

    return {
      presumptiveMargin,
      presumptiveProfitBase,
      federalIncomeTax: totalFederalIncomeTax,
      pisCofinsTax,
      localInvoicedTax,
      totalTaxes,
      effectiveRate
    };
  }, [businessType, monthlyRevenueInput, localISSRate]);

  const derivedLucroReal = useMemo(() => {
    // Actual profit based on margin slider
    const realProfitAmount = monthlyRevenueInput * (realProfitMargin / 100);

    // Federal income taxes: 15% IRPJ + 9% CSLL = 24% on real profit amount
    // Surcharge profile: plus 10% on profit exceeding R$ 20k/month
    const baseIrcs = Math.max(0, realProfitAmount * 0.24);
    const surchargeIrcs = Math.max(0, (realProfitAmount - 20000) * 0.10);
    const totalFederalIncome = baseIrcs + surchargeIrcs;

    // Non-cumulative PIS & COFINS (average 9.25% standard, but with average estimated input credits of 4.60%, leaving ~4.65% net)
    const pisCofinsNonCumulative = monthlyRevenueInput * 0.0465;

    // Local ISS or ICMS
    const localInvoicedTax = monthlyRevenueInput * (localISSRate / 100);

    const totalTaxes = totalFederalIncome + pisCofinsNonCumulative + localInvoicedTax;
    const effectiveRate = monthlyRevenueInput > 0 ? totalTaxes / monthlyRevenueInput : 0.16;

    return {
      realProfitAmount,
      federalIncome: totalFederalIncome,
      pisCofinsTax: pisCofinsNonCumulative,
      localInvoicedTax,
      totalTaxes,
      effectiveRate
    };
  }, [monthlyRevenueInput, realProfitMargin, localISSRate]);

  // Monofasico tax credit calculations
  const commerceMonofasicoSavings = useMemo(() => {
    if (businessType !== "commerce") return 0;
    
    // In commerce under Simples Nacional, products with Monofasico PIS/COFINS (e.g. cosmetics, auto parts, pharmaceuticals, beverages)
    // shouldn't pay PIS & COFINS inside the DAS. PIS/COFINS represents approx 12.7% to 20% of the DAS total.
    // For Faixa 1 to 3, skipping PIS/COFINS gives about a 15% discount on the effective rate of the monofasico portion.
    const rawDas = calculatedSimples.monthlyTaxVal;
    const monofasicoPortion = rawDas * (monofasicoProductPct / 100);
    const estimatedSavedTaxes = monofasicoPortion * 0.16; // PIS/COFINS deduction quotient inside Simples Nacional
    
    return estimatedSavedTaxes;
  }, [businessType, monofasicoProductPct, calculatedSimples.monthlyTaxVal]);

  const sortedRegimes = useMemo(() => {
    const rCurrent = calculatedSimples.monthlyTaxVal;
    const rPresumed = derivedLucroPresumido.totalTaxes;
    const rReal = derivedLucroReal.totalTaxes;

    const regimesList = [
      { id: "simples", name: "Simples Nacional", value: rCurrent, rate: calculatedSimples.effectiveRate * 100, color: "#f97316", desc: "Regime Simplificado para PMEs" },
      { id: "presumido", name: "Lucro Presumido", value: rPresumed, rate: derivedLucroPresumido.effectiveRate * 100, color: "#10b981", desc: "Lucro Baseado em Presunção Legal" },
      { id: "real", name: "Lucro Real", value: rReal, rate: derivedLucroReal.effectiveRate * 100, color: "#5046e5", desc: "Imposto sobre Lucro Contábil Efetivo" }
    ];

    return [...regimesList].sort((a, b) => a.value - b.value);
  }, [calculatedSimples, derivedLucroPresumido, derivedLucroReal]);

  const optimalRegime = sortedRegimes[0];
  const worstRegime = sortedRegimes[2];
  const monthlySaved = worstRegime.value - optimalRegime.value;
  const yearlySaved = monthlySaved * 12;

  // Render chart data
  const comparisonChartData = useMemo(() => {
    return [
      {
        name: "Simples Nacional",
        "Imposto Total": Math.round(calculatedSimples.monthlyTaxVal),
        "Alíquota Efetiva": parseFloat((calculatedSimples.effectiveRate * 100).toFixed(1)),
        fill: "#f97316"
      },
      {
        name: "Lucro Presumido",
        "Imposto Total": Math.round(derivedLucroPresumido.totalTaxes),
        "Alíquota Efetiva": parseFloat((derivedLucroPresumido.effectiveRate * 100).toFixed(1)),
        fill: "#10b981"
      },
      {
        name: "Lucro Real",
        "Imposto Total": Math.round(derivedLucroReal.totalTaxes),
        "Alíquota Efetiva": parseFloat((derivedLucroReal.effectiveRate * 100).toFixed(1)),
        fill: "#5a67d8"
      }
    ];
  }, [calculatedSimples, derivedLucroPresumido, derivedLucroReal]);

  // Fator R advice engine
  const targetPayrollForFatorR = monthlyRevenueInput * 0.28;
  const payrollDifference = targetPayrollForFatorR - payrollInput;
  
  // Calculate Simples without Fator R (Anexo V) and with Fator R (Anexo III)
  const simplesNoFatorR = getSimplesNacionalCalculation("service", monthlyRevenueInput, annualRevenueInput, false);
  const simplesWithFatorR = getSimplesNacionalCalculation("service", monthlyRevenueInput, annualRevenueInput, true);
  const factorRMonthlyTaxSavings = simplesNoFatorR.monthlyTaxVal - simplesWithFatorR.monthlyTaxVal;

  return (
    <div className="space-y-6">
      {/* Upper Title HUD */}
      <div className="bg-[#0c0c0c] text-white p-6 rounded-3xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-black font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Saneamento & Estratégia
            </span>
            <span className="bg-zinc-800 text-amber-500 font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              BRASIL FISCAL v5.0
            </span>
          </div>
          <h2 className="font-sans font-black text-2xl lg:text-3xl uppercase tracking-tight italic text-zinc-50">
            Planejamento Tributário Inteligente 
          </h2>
          <p className="text-xs text-gray-400 font-medium max-w-xl">
            Simule o enquadramento ideal, planeje o Fator R de forma automatizada e analise créditos monofásicos para blindar o lucro líquido da sua empresa.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-2 w-full md:w-auto z-10">
          <button
            onClick={() => handleBusinessTypeChange("service")}
            className={cn(
              "flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border",
              businessType === "service"
                ? "bg-emerald-500 border-emerald-400 text-black shadow-lg"
                : "bg-zinc-900 border-zinc-800 text-gray-400 hover:text-white"
            )}
          >
            💼 Prestação de Serviços
          </button>
          <button
            onClick={() => handleBusinessTypeChange("commerce")}
            className={cn(
              "flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border",
              businessType === "commerce"
                ? "bg-emerald-500 border-emerald-400 text-black shadow-lg"
                : "bg-zinc-900 border-zinc-800 text-gray-400 hover:text-white"
            )}
          >
            🛒 Comércio ou Varejo
          </button>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex overflow-x-auto gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit border border-gray-200">
        <button
          onClick={() => { sound.playClick(); setActiveSubTab("calculator"); }}
          className={cn(
            "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
            activeSubTab === "calculator"
              ? "bg-white text-gray-900 shadow-sm font-black"
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          ⚖ Comparador de Regimes
        </button>
        <button
          onClick={() => { sound.playClick(); setActiveSubTab("fatorR"); }}
          className={cn(
            "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
            activeSubTab === "fatorR"
              ? "bg-white text-gray-900 shadow-sm font-black"
              : "text-gray-500 hover:text-gray-900",
            businessType === "commerce" && "opacity-50"
          )}
        >
          📊 Otimizador Fator R
          {businessType === "service" && (
            <span className={cn(
              "w-2 h-2 rounded-full",
              isFatorREligible ? "bg-emerald-500" : "bg-red-500 animate-ping"
            )} />
          )}
        </button>
        <button
          onClick={() => { sound.playClick(); setActiveSubTab("monofasico"); }}
          className={cn(
            "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
            activeSubTab === "monofasico"
              ? "bg-white text-gray-900 shadow-sm font-black"
              : "text-gray-500 hover:text-gray-900",
            businessType === "service" && "opacity-50"
          )}
        >
          💊 Recuperação de Monofásicos
          {businessType === "commerce" && monofasicoProductPct > 0 && (
            <span className="bg-emerald-500 text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold">
              +{formatCurrency(commerceMonofasicoSavings)}
            </span>
          )}
        </button>
        <button
          onClick={() => { sound.playClick(); setActiveSubTab("schedule"); }}
          className={cn(
            "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
            activeSubTab === "schedule"
              ? "bg-white text-gray-900 shadow-sm font-black"
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          📅 Cronograma Fiscal
        </button>
      </div>

      {/* Main Tab Interactivity wrapper */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: COMPARADOR DE REGIMES */}
        {activeSubTab === "calculator" && (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Input Controls Panel (Left) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-gray-150">
                <h3 className="font-extrabold text-sm uppercase text-gray-900 tracking-tight font-sans flex items-center gap-1.5">
                  <Sliders size={16} className="text-emerald-500" />
                  Parâmetros de Simulação
                </h3>
                <span className="text-[10px] font-mono text-zinc-400">BR-SME PRO</span>
              </div>

              {/* Slider 1: Gross Monthly Revenue */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10.5px] font-black uppercase tracking-wide text-gray-650 flex items-center gap-1 font-sans">
                    Faturamento Mensal
                    <HelpCircle
                      size={13}
                      className="text-gray-400 cursor-pointer"
                      onClick={() => setShowTooltip(showTooltip === "monthlyRevenue" ? null : "monthlyRevenue")}
                    />
                  </label>
                  <span className="text-xs font-mono font-black text-emerald-600">
                    {formatCurrency(monthlyRevenueInput)}
                  </span>
                </div>
                
                {showTooltip === "monthlyRevenue" && (
                  <p className="text-[10px] bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-gray-500 leading-relaxed font-semibold">
                    Seu faturamento médio mensal esperado. Serve como base de faturamento bruto para aplicar as alíquotas efetivas estimadas de cada regime.
                  </p>
                )}

                <input
                  type="range"
                  min="5000"
                  max="1000000"
                  step="5000"
                  value={monthlyRevenueInput}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setMonthlyRevenueInput(value);
                    setAnnualRevenueInput(value * 12);
                  }}
                  className="w-full accent-emerald-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-gray-400 font-mono">
                  <span>R$ 5k</span>
                  <span>R$ 500k</span>
                  <span>R$ 1.0M/mês</span>
                </div>
              </div>

              {/* Slider 2: 12-Month Cumulative LTM Revenue */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10.5px] font-black uppercase tracking-wide text-gray-650 flex items-center gap-1 font-sans">
                    Acumulado 12m (LTM)
                    <HelpCircle
                      size={13}
                      className="text-gray-400 cursor-pointer"
                      onClick={() => setShowTooltip(showTooltip === "annualRevenue" ? null : "annualRevenue")}
                    />
                  </label>
                  <span className="text-xs font-mono font-black text-amber-600">
                    {formatCurrency(annualRevenueInput)}
                  </span>
                </div>

                {showTooltip === "annualRevenue" && (
                  <p className="text-[10px] bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-gray-500 leading-relaxed font-semibold">
                    No Simples Nacional brasileiro, a alíquota mensal de imposto varia de acordo com seu faturamento acumulado dos últimos 12 meses (RBT12), gerando um sistema de faixas de imposto progressivas.
                  </p>
                )}

                <input
                  type="range"
                  min="60000"
                  max="4800000"
                  step="10000"
                  value={annualRevenueInput}
                  onChange={(e) => setAnnualRevenueInput(Number(e.target.value))}
                  className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-gray-400 font-mono">
                  <span>R$ 60k</span>
                  <span>R$ 2.4M</span>
                  <span>R$ 4.8M (Limite)</span>
                </div>
              </div>

              {/* Slider 3: local ISS or Average state ICMS rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10.5px] font-black uppercase tracking-wide text-gray-650 flex items-center gap-1 font-sans">
                    {businessType === "service" ? "Alíquota ISS" : "ICMS Praticado"}
                    <HelpCircle
                      size={13}
                      className="text-gray-400 cursor-pointer"
                      onClick={() => setShowTooltip(showTooltip === "localTax" ? null : "localTax")}
                    />
                  </label>
                  <span className="text-xs font-mono font-black text-indigo-600">
                    {localISSRate.toFixed(1)}%
                  </span>
                </div>

                {showTooltip === "localTax" && (
                  <p className="text-[10px] bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-gray-500 leading-relaxed font-semibold">
                    {businessType === "service"
                      ? "O imposto sobre serviços (ISS) municipal varia tipicamente de 2% a 5% de acordo com as leis do município e atividade correspondente."
                      : "Alíquota média praticada para impostos indiretos de vendas com as deduções e créditos de ICMS incidentes."}
                  </p>
                )}

                <input
                  type="range"
                  min={businessType === "service" ? "2" : "1"}
                  max={businessType === "service" ? "5" : "18"}
                  step="0.1"
                  value={localISSRate}
                  onChange={(e) => setLocalISSRate(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-gray-400 font-mono">
                  <span>{businessType === "service" ? "2%" : "1%"}</span>
                  <span>{businessType === "service" ? "3.5%" : "9.5%"}</span>
                  <span>{businessType === "service" ? "5%" : "18%"}</span>
                </div>
              </div>

              {/* Slider 4: Operating profit margin for Lucro Real sim */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10.5px] font-black uppercase tracking-wide text-gray-650 flex items-center gap-1 font-sans">
                    Margem de Lucro PJ
                    <HelpCircle
                      size={13}
                      className="text-gray-400 cursor-pointer"
                      onClick={() => setShowTooltip(showTooltip === "profitMargin" ? null : "profitMargin")}
                    />
                  </label>
                  <span className="text-xs font-mono font-black text-rose-500">
                    {realProfitMargin}%
                  </span>
                </div>

                {showTooltip === "profitMargin" && (
                  <p className="text-[10px] bg-gray-50 border border-gray-150 p-2.5 rounded-xl text-gray-500 leading-relaxed font-semibold">
                    Para o cálculo do **Lucro Real**, a margem de lucratividade efetiva é essencial, pois o IRPJ (15% + 10% adicional) e a CSLL (9%) recaem de forma direta sobre os lucros contábeis apurados, e não sobre o faturamento.
                  </p>
                )}

                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={realProfitMargin}
                  onChange={(e) => setRealProfitMargin(Number(e.target.value))}
                  className="w-full accent-rose-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-gray-400 font-mono">
                  <span>1%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-sans mt-1">
                  <span>Lucro Real Estimado:</span>
                  <span className="font-mono font-black text-gray-800">{formatCurrency(monthlyRevenueInput * (realProfitMargin / 100))}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150">
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-1 font-sans font-medium text-[11px] text-gray-600">
                  <span className="text-gray-900 font-black block text-[10px] uppercase tracking-wider">
                    Análise em Tempo Real do Dashboard:
                  </span>
                  No faturamento inserido de <strong className="text-emerald-600">{formatCurrency(monthlyRevenueInput)}</strong>, foram cruzados todos os anexo contábeis vigentes. Use os outros tabs para calibrar folha e créditos.
                </div>
              </div>
            </div>

            {/* Layout Comparison Content (Right) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Strategic Advice Banner */}
              <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-1.5 z-10 max-w-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-emerald-500 text-black font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={11} /> Diagnóstico Estratégico
                    </span>
                    <span className="text-gray-500 text-[10px] font-mono font-black">
                      OTIMIZADOR DAFNE TRIBUTÁRIO
                    </span>
                  </div>
                  <h4 className="font-sans font-black text-lg text-slate-900 tracking-tight leading-snug">
                    O Regime ideal projetado para sua empresa é o <span className="text-emerald-600 underline">{optimalRegime.name}</span>.
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed font-sans font-semibold">
                    Ao migrar ou manter-se neste modelo, você alcança um custo efetivo de <strong className="text-gray-900 font-extrabold">{optimalRegime.rate.toFixed(1)}%</strong> sobre a receita bruta, gerando fôlego extra de caixa de até <strong className="text-emerald-600 font-black">{formatCurrency(yearlySaved)}</strong> no acumulado de 12 meses!
                  </p>
                </div>

                <div className="z-10 bg-white/90 border border-gray-150 p-4 rounded-2xl shadow-sm text-center shrink-0 min-w-[170px]">
                  <span className="text-[8.5px] uppercase tracking-wider font-black text-gray-500 block">Diferencial Prático</span>
                  <span className="text-3xl font-black font-sans text-emerald-600 block mt-0.5 tracking-tight">
                    +{((worstRegime.rate - optimalRegime.rate)).toFixed(2)}%
                  </span>
                  <span className="text-[9px] font-bold text-gray-700 italic block mt-0.5 leading-none">
                    Retenção Líquida de Lucro
                  </span>
                </div>
              </div>

              {/* Interactive Charts comparison */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm">
                <h4 className="font-black text-xs uppercase tracking-wider text-gray-900 mb-6 font-sans flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-orange-500" />
                  Comparativo Financeiro Mensal (Custo de Imposto em R$)
                </h4>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4b5563", fontWeight: '700' }} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#9ca3af", fontFamily: 'monospace' }} 
                        tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#f3f4f6', opacity: 0.6 }}
                        formatter={(val: number) => [formatCurrency(val), "Encargo Mensal"]}
                        labelStyle={{ fontWeight: "bold", color: "#111827", fontSize: "12px" }}
                        contentStyle={{ borderRadius: "1rem", border: "1px solid #e5e7eb", background: "white" }}
                      />
                      <Bar dataKey="Imposto Total" radius={[8, 8, 0, 0]} maxBarSize={60}>
                        {comparisonChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill} 
                            filter={entry.name === "Simples Nacional" ? "url(#neon-glow-orange)" : entry.name === "Lucro Presumido" ? "url(#neon-glow-emerald)" : "url(#neon-glow-indigo)"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-2 border-t border-gray-100 text-center">
                  <div>
                    <span className="text-[8.5px] uppercase font-black text-gray-400 block tracking-widest leading-none">Simples Nac.</span>
                    <strong className="text-sm font-mono text-orange-500 block mt-1">{calculatedSimples.effectiveRate * 100 >= 100 ? "N/A" : `${(calculatedSimples.effectiveRate * 100).toFixed(1)}%`}</strong>
                  </div>
                  <div className="sm:border-x border-y sm:border-y-0 py-2 sm:py-0 border-gray-150">
                    <span className="text-[8.5px] uppercase font-black text-gray-400 block tracking-widest leading-none">L. Presumido</span>
                    <strong className="text-sm font-mono text-emerald-500 block mt-1">{(derivedLucroPresumido.effectiveRate * 100).toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span className="text-[8.5px] uppercase font-black text-gray-400 block tracking-widest leading-none">Lucro Real</span>
                    <strong className="text-sm font-mono text-indigo-600 block mt-1">{(derivedLucroReal.effectiveRate * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Panel Simples */}
                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 text-left relative overflow-hidden flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-[10px] font-black uppercase text-orange-500 leading-none tracking-wider">Simples Nacional</span>
                      <span className="text-[9px] font-mono font-bold bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-md">Regime Unificado</span>
                    </div>

                    <div className="space-y-1.5 font-sans font-semibold">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Tabela Ativa:</span>
                        <span className="text-gray-900 font-extrabold font-mono">ANEXO {calculatedSimples.anexo}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Faixa Progressiva:</span>
                        <span className="text-gray-900 text-[10px]">{calculatedSimples.bracketName}</span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1.5 border-t border-dashed border-gray-100">
                        <span className="text-gray-500">Alíquota Efetiva:</span>
                        <span className="text-orange-600 font-mono font-black">{(calculatedSimples.effectiveRate * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-4 flex justify-between items-baseline">
                    <span className="text-[10px] text-gray-500 font-bold">Encargo Mensal</span>
                    <strong className="text-base font-mono font-black text-orange-600">{formatCurrency(calculatedSimples.monthlyTaxVal)}</strong>
                  </div>
                </div>

                {/* Panel Presumido */}
                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 text-left relative overflow-hidden flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-[10px] font-black uppercase text-emerald-600 leading-none tracking-wider">Lucro Presumido</span>
                      <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">Margem Legal</span>
                    </div>

                    <div className="space-y-1.5 font-sans font-semibold">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Presunção Lucro:</span>
                        <span className="text-gray-900 font-extrabold font-mono">{(derivedLucroPresumido.presumptiveMargin * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">IRPJ + CSLL (Fed):</span>
                        <span className="text-gray-900 font-mono">{formatCurrency(derivedLucroPresumido.federalIncomeTax)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">PIS/COFINS (3.65%):</span>
                        <span className="text-gray-900 font-mono">{formatCurrency(derivedLucroPresumido.pisCofinsTax)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-4 flex justify-between items-baseline">
                    <span className="text-[10px] text-gray-500 font-bold">Encargo Mensal</span>
                    <strong className="text-base font-mono font-black text-emerald-600">{formatCurrency(derivedLucroPresumido.totalTaxes)}</strong>
                  </div>
                </div>

                {/* Panel Lucro Real */}
                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 text-left relative overflow-hidden flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-[10px] font-black uppercase text-indigo-700 leading-none tracking-wider">Lucro Real</span>
                      <span className="text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-md">Margem Efetiva</span>
                    </div>

                    <div className="space-y-1.5 font-sans font-semibold">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Faturamento Real:</span>
                        <span className="text-gray-900 font-mono">{formatCurrency(monthlyRevenueInput)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">IRPJ + CSLL (24%+):</span>
                        <span className="text-gray-900 font-mono">{formatCurrency(derivedLucroReal.federalIncome)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">PIS/COFINS (Cred):</span>
                        <span className="text-gray-900 font-mono">{formatCurrency(derivedLucroReal.pisCofinsTax)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-4 flex justify-between items-baseline">
                    <span className="text-[10px] text-gray-500 font-bold">Encargo Mensal</span>
                    <strong className="text-base font-mono font-black text-indigo-700">{formatCurrency(derivedLucroReal.totalTaxes)}</strong>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: OTIMIZADOR DE FATOR R */}
        {activeSubTab === "fatorR" && (
          <motion.div
            key="fatorR"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {businessType === "commerce" ? (
              <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4">
                <AlertTriangle size={40} className="text-amber-500 mx-auto" />
                <h3 className="font-sans font-black text-lg text-slate-900 uppercase tracking-tight">
                  Dispositivo Inativo para Comércio
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-sans font-semibold">
                  O **Fator R** aplica-se exclusivamente a optantes do **Simples Nacional para Prestação de Serviços**. No Comércio (Anexo I), o imposto é calculado diretamente sobre o faturamento, sem variar conforme a folha de pagamento.
                </p>
                <button
                  onClick={() => handleBusinessTypeChange("service")}
                  className="px-6 py-2.5 bg-zinc-900 text-amber-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Alternar para Prestação de Serviços
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left controls Column */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
                  <div>
                    <span className="bg-orange-500 text-black font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      Dafne Fator R Coprocessor
                    </span>
                    <h3 className="font-sans font-black text-lg text-slate-900 uppercase tracking-tight mt-1">
                      Painel do Fator R
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                      O Fator R é um cálculo que determina se sua empresa de serviços será tributada pelo Anexo III (alíquota a partir de 6%) ou Anexo V (a partir de 15,50%). Basta ter folha de salários superior a 28% do faturamento de 12 meses.
                    </p>
                  </div>

                  {/* Monthly revenue read-out to guide Fator R */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-black uppercase text-gray-500">Receita de Simulação</span>
                      <strong className="text-sm font-mono font-black text-gray-950">{formatCurrency(monthlyRevenueInput)}</strong>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: "100%" }} />
                    </div>
                  </div>

                  {/* Slider to control payroll / pro-labore inside simulation */}
                  <div className="space-y-3 bg-orange-50/50 p-4 border border-orange-200/40 rounded-2xl">
                    <div className="flex justify-between items-baseline font-sans font-semibold">
                      <label className="text-[11px] font-black uppercase text-gray-800 tracking-wide">
                        Folha + Pró-Labore Mensal
                      </label>
                      <span className={cn("text-xs font-mono font-black", isFatorREligible ? "text-emerald-600" : "text-amber-500")}>
                        {formatCurrency(payrollInput)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={monthlyRevenueInput}
                      step="500"
                      value={payrollInput}
                      onChange={(e) => setPayrollInput(Number(e.target.value))}
                      className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />

                    <div className="flex justify-between text-[8px] text-gray-450 font-mono">
                      <span>R$ 0</span>
                      <span className="font-bold text-emerald-600">Alvo (28%): {formatCurrency(targetPayrollForFatorR)}</span>
                      <span>R$ {monthlyRevenueInput.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-2 font-sans font-medium text-[11px] text-slate-600">
                    <span className="text-gray-900 font-black block text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Info size={14} className="text-amber-500" />
                      Como utilizar pro-labore a seu favor:
                    </span>
                    Se a sua folha de salários CLT for pequena, você pode aumentar de forma artificial a tirada de Pró-Labore do sócio. Embora pague INSS (11%) e IRPF de tabela progressiva sobre o pro-labore, a economia tributária na atividade da empresa via DAS compensa drasticamente os impostos extras da pessoa física.
                  </div>
                </div>

                {/* Right Visual Breakdown & Target */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Gauge Card */}
                  <div className="bg-white border border-gray-200/85 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-xs uppercase tracking-wider text-gray-900 font-sans">
                        Seu Indicador do Fator R Atual
                      </h4>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        isFatorREligible 
                          ? "bg-emerald-500 text-black shadow-sm"
                          : "bg-red-500 text-white animate-pulse"
                      )}>
                        {isFatorREligible ? "FATOR R ATIVO (Anexo III)" : "FATOR R INSUFICIENTE (Anexo V)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      
                      {/* Percent Gauge Meter inside absolute box */}
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-gray-150 text-center relative overflow-hidden">
                        <span className="text-[10.5px] uppercase tracking-widest font-black text-gray-400 block mb-1">Folha / Faturamento</span>
                        <strong className={cn(
                          "text-4xl font-sans font-black tracking-tight",
                          isFatorREligible ? "text-emerald-500" : "text-amber-500"
                        )}>
                          {factorRRatioPct.toFixed(1)}%
                        </strong>
                        <div className="w-full bg-gray-250 h-2.5 rounded-full overflow-hidden mt-3 max-w-[150px]">
                          <div 
                            className={cn("h-full transition-all duration-300", isFatorREligible ? "bg-emerald-500" : "bg-amber-500")}
                            style={{ width: `${Math.min(100, Math.max(5, (factorRRatioPct / 40) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-gray-500 block mt-2 font-semibold">Regra legal exige no mínimo 28%</span>
                      </div>

                      {/* Direct Numeric Advice */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-black uppercase text-gray-450 block font-mono">Simulador de Folhas</span>
                          <h5 className="font-extrabold text-[#141414] text-base leading-tight font-sans">
                            {isFatorREligible 
                              ? "Excelente! Sua empresa está enquadrada perfeitamente no Anexo III."
                              : "Planejamento corretivo recomendado para economia de DAS."
                            }
                          </h5>
                        </div>

                        <div className="space-y-2 font-sans font-semibold text-xs leading-relaxed text-gray-650">
                          {isFatorREligible ? (
                            <p>
                              Com a proporção folha de faturamento em <strong className="text-emerald-600">{factorRRatioPct.toFixed(1)}%</strong>, seu imposto é de <strong className="text-gray-900 font-extrabold">{formatCurrency(simplesWithFatorR.monthlyTaxVal)}</strong> ao invés de <strong className="text-rose-500">{formatCurrency(simplesNoFatorR.monthlyTaxVal)}</strong>. Parabéns pela engenharia fiscal!
                            </p>
                          ) : (
                            <p>
                              Você precisa de um acréscimo mensal de <strong className="text-amber-600 font-black">{formatCurrency(payrollDifference)}</strong> na sua folha ou Pró-labore para atingir os 28% necessários de forma estratégica.
                            </p>
                          )}

                          {!isFatorREligible && (
                            <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-xl leading-relaxed text-[11px] text-stone-700 flex gap-1.5 items-start font-semibold mt-1">
                              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                              <span>
                                Se você aumentar seu Pró-Labore em <strong>{formatCurrency(payrollDifference)}</strong>, você economizará até <strong>{formatCurrency(factorRMonthlyTaxSavings)}/mês</strong> ({formatCurrency(factorRMonthlyTaxSavings * 12)}/ano) em DAS no Simples Nacional.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Impact Scenario Chart */}
                  <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm">
                    <h4 className="font-black text-xs uppercase tracking-wider text-gray-900 mb-4 font-sans flex items-center gap-1.5">
                      <Percent size={16} className="text-orange-500" />
                      Efeito Prático do Fator R na sua Alíquota de DAS Progressiva
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/40 space-y-2">
                        <span className="text-[9px] uppercase tracking-wider font-mono bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded-full font-bold">Sem Fator R (Anexo V)</span>
                        <strong className="text-2xl font-mono block text-rose-600">{(simplesNoFatorR.effectiveRate * 100).toFixed(2)}%</strong>
                        <p className="text-[10px] text-gray-500 leading-tight block font-semibold">
                          Sua alíquota efetiva estimada no imposto de serviço geral, sem o recolhimento de impostos ou folha sobre folha qualificada.
                        </p>
                        <div className="pt-2 border-t border-rose-100 flex justify-between text-xs font-mono">
                          <span className="text-gray-500">Tributo DAS:</span>
                          <strong className="text-rose-500">{formatCurrency(simplesNoFatorR.monthlyTaxVal)}</strong>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/40 space-y-2">
                        <span className="text-[9px] uppercase tracking-wider font-mono bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold">Com Fator R (Anexo III)</span>
                        <strong className="text-2xl font-mono block text-emerald-600">{(simplesWithFatorR.effectiveRate * 100).toFixed(2)}%</strong>
                        <p className="text-[10px] text-gray-500 leading-tight block font-semibold">
                          Sua alíquota cai significativamente, otimizando seu faturamento mensal perante a menor alíquota permitida para o seu porte.
                        </p>
                        <div className="pt-2 border-t border-emerald-100 flex justify-between text-xs font-mono">
                          <span className="text-gray-500">Tributo DAS:</span>
                          <strong className="text-emerald-600">{formatCurrency(simplesWithFatorR.monthlyTaxVal)}</strong>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: RECUPERAÇÃO DE MONOFÁSICOS */}
        {activeSubTab === "monofasico" && (
          <motion.div
            key="monofasico"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {businessType === "service" ? (
              <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4">
                <AlertTriangle size={40} className="text-amber-500 mx-auto" />
                <h3 className="font-sans font-black text-lg text-slate-900 uppercase tracking-tight">
                  Dispositivo Inativo para Prestação de Serviços
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-sans font-semibold">
                  A **Recuperação de Impostos Monofásicos** aplica-se essencialmente a empresas do comércio e distribuição varejista que vendem produtos categorizados em regime monofásico de tributação (como ICMS-ST e PIS/COFINS monofásico).
                </p>
                <button
                  onClick={() => handleBusinessTypeChange("commerce")}
                  className="px-6 py-2.5 bg-zinc-900 text-amber-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Alternar para Comércio / Varejo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="monofasico-planning">
                
                {/* Visual control on left */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
                  <div>
                    <span className="bg-emerald-500 text-black font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      Auditoria de Créditos Monofásicos
                    </span>
                    <h3 className="font-sans font-black text-lg text-slate-900 uppercase tracking-tight mt-1">
                      Saneamento de Produtos
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                      Diversas mercadorias em farmácias, pet shops, revendas de autopeças, perfumarias, adegas e postos de combustível possuem recolhimento tributário monofásico. Significa que a fábrica já pagou os impostos de PIS e COFINS pelo restante de toda a cadeia logística. O comerciante de varejo do Simples Nacional tem o pleno direito de segregar o faturamento desses produtos e deduzir essas alíquotas do DAS mensal!
                    </p>
                  </div>

                  {/* Monthly revenue reference */}
                  <div className="space-y-1.5 p-3.5 bg-slate-50 border border-gray-150 rounded-2xl flex justify-between items-baseline">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Faturamento Mensal</span>
                    <strong className="text-sm font-mono font-black text-gray-950">{formatCurrency(monthlyRevenueInput)}</strong>
                  </div>

                  {/* Monofasicos Share slide */}
                  <div className="space-y-3 bg-emerald-50/40 p-4 border border-emerald-200/30 rounded-2xl">
                    <div className="flex justify-between items-baseline font-sans font-semibold">
                      <label className="text-[11px] font-black uppercase text-slate-900 tracking-wide">
                        Proporção de Produtos Monofásicos
                      </label>
                      <span className="text-sm font-mono font-black text-emerald-600 font-bold">
                        {monofasicoProductPct}% ({formatCurrency(monthlyRevenueInput * (monofasicoProductPct / 100))}/mês)
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={monofasicoProductPct}
                      onChange={(e) => setMonofasicoProductPct(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-2 bg-gray-205 rounded-lg appearance-none cursor-pointer"
                    />

                    <div className="flex justify-between text-[8px] text-gray-450 font-mono">
                      <span>0% (Sem monofásicos)</span>
                      <span>50%</span>
                      <span>100% (Apenas monofásicos)</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-2 font-sans font-medium text-[11px] text-slate-600">
                    <span className="text-gray-900 font-black block text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Award size={14} className="text-emerald-500" />
                      Auditar seu cadastro de produtos:
                    </span>
                    Tudo reside no seu sistema de ERP de vendas. Mapear o código de NCM (Nomenclatura Comum do Mercosul) correto de cada SKU é a chave da sua economia. Se estiver parametrizado com NCM de tributação normal, o sistema gera bitributação desnecessária e ilegal.
                  </div>
                </div>

                {/* Performance indicators right */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Cashback Calculator Banner */}
                  <div className="bg-white border border-gray-200/85 rounded-3xl p-6 shadow-sm space-y-6">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-800 font-sans flex items-center gap-1.5">
                      <PiggyBank size={18} className="text-emerald-500" />
                      Estimativa Real de Recuperação e Desconto no DAS
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      <div className="p-5 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-2xl flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-widest font-black text-gray-400 block">Dedução DAS Mensal Estimada:</span>
                          <strong className="text-3xl font-mono text-emerald-600 block tracking-tight">
                            {formatCurrency(commerceMonofasicoSavings)}
                          </strong>
                          <span className="text-[9px] text-gray-500 block leading-tight font-semibold">
                            Custo de impostos puramente economizados e deduzidos a cada boleto mensal gerado.
                          </span>
                        </div>

                        <div className="pt-2 border-t border-emerald-100/60 mt-4 text-[10px] leading-snug text-slate-600 font-sans font-semibold">
                          Economia Anualizada Projetada:<br/>
                          <strong className="text-emerald-600 font-black text-sm font-mono">{formatCurrency(commerceMonofasicoSavings * 12)} / ano</strong>
                        </div>
                      </div>

                      <div className="space-y-4 text-left font-sans font-semibold text-xs leading-relaxed text-gray-650">
                        <div className="p-3.5 bg-slate-50 border border-gray-150 rounded-xl space-y-3">
                          <span className="text-[10px] text-gray-900 font-black uppercase tracking-wider block">Produtos Monofásicos Elegíveis:</span>
                          <ul className="space-y-1.5 text-[11px] text-slate-705">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              Bebidas frias (Cervejas, Refrigerantes, Água)
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              Autopeças e Pneumáticos (Pneus, Rodas)
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              Perfumaria e Cosméticos avançados
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              Medicamentos em geral (Farmácia popular)
                            </li>
                          </ul>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Comparative Graphic of Monofasico optimization */}
                  <div className="bg-[#0c0c0c] text-white p-6 rounded-3xl border border-gray-800 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="space-y-1.5 text-center md:text-left">
                      <span className="bg-emerald-500/10 text-emerald-400 font-mono font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                        AUDITORIA EXTRAjudicial
                      </span>
                      <h4 className="font-bold text-gray-100 text-sm font-sans uppercase tracking-tight flex items-center justify-center md:justify-start gap-1">
                        <CheckCircle size={15} className="text-emerald-400" />
                        Auditar e Saneamento Tributário Retroativo
                      </h4>
                      <p className="text-[10px] text-gray-400 max-w-md">
                        Sua empresa pagou a mais nos últimos anos por não fazer a exclusão? É possível auditar as obrigações acessórias transmitidas (PGDAS-D) dos últimos **5 ANOS** (60 meses) e solicitar reembolso ou compensação direta junto à Receita Federal, com homologação em até 60 dias de forma expressa!
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shrink-0 min-w-[200px] text-center">
                      <span className="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">LTM 5 Anos Retroativo Estimado</span>
                      <strong className="text-xl font-mono text-emerald-400 block mt-1">
                        {formatCurrency(commerceMonofasicoSavings * 60)}
                      </strong>
                      <span className="text-[7.5px] text-zinc-500 block leading-tight mt-1 leading-none font-sans">
                        Soma total aproximada elegível a compensar
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: CALENDÁRIO FISCAL / CRONOGRAMA */}
        {activeSubTab === "schedule" && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm"
          >
            <div className="flex justify-between items-center pb-4 border-b border-gray-150 mb-6">
              <div className="space-y-1">
                <span className="bg-indigo-100 text-indigo-700 font-mono font-black text-[9.5px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  Agenda Recorrente
                </span>
                <h3 className="font-sans font-black text-lg text-slate-1000 uppercase tracking-tight">
                  Cronograma Tributário Ativo do Setor
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Audite e atente para os vencimentos fiscais regulares para evitar inadimplências, bloqueios cadastrais e a imposição de multas de mora da Receita Federal.
                </p>
              </div>

              <span className="text-xs font-mono font-black text-gray-400 text-right uppercase">Setor: {businessType === "service" ? "Serviço" : "Comércio"}</span>
            </div>

            {/* List of Brazilian tax due dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  day: "20",
                  title: "Guia do DAS (Simples Nacional)",
                  desc: "Recolhimento unificado de impostos (IRPJ, CSLL, PIS, COFINS, CPP, ISS/ICMS). Vencimento no dia 20 de cada mês (ou dia útil subsequente).",
                  importance: "high",
                  appliesTo: "all",
                  fuso: "Mensal"
                },
                {
                  day: "20",
                  title: "DCTFWeb & Previdenciário",
                  desc: "Transmissão da Declaração de Débitos e Créditos Tributários Federais Previdenciários e das contribuições recolhidas para o eSocial.",
                  importance: "medium",
                  appliesTo: "service",
                  fuso: "Mensal"
                },
                {
                  day: "07",
                  title: "FGTS Mensal (CLT)",
                  desc: "Prazo para depósito do Fundo de Garantia por Tempo de Serviço dos empregados ativos na folha salarial.",
                  importance: "medium",
                  appliesTo: "all",
                  fuso: "Mensal"
                },
                {
                  day: "Tr.",
                  title: "IRPJ e CSLL Trimestral (Presumido)",
                  desc: "Para o Lucro Presumido, o recolhimento dos impostos federais sobre o lucro ocorre de forma trimestral (vencimentos em Abril, Julho, Outubro e Janeiro).",
                  importance: "high",
                  appliesTo: "presumido",
                  fuso: "Trimestral"
                },
                {
                  day: "15",
                  title: "Transmissão do eSocial (Mensal)",
                  desc: "Envio de fechamento dos eventos periódicos da folha de pagamento de funcionários PJ e Pró-Labore de diretores.",
                  importance: "low",
                  appliesTo: "all",
                  fuso: "Mensal"
                },
                {
                  day: "An.",
                  title: "Defis (Declaração de Informações)",
                  desc: "Entrega anual obrigatória por parte das empresas do Simples Nacional reportando as movimentações financeiras à Receita Federal.",
                  importance: "high",
                  appliesTo: "all",
                  fuso: "Anual"
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 border border-gray-150 rounded-2xl hover:border-gray-300 transition-colors bg-slate-50/50">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex flex-col justify-center items-center font-mono font-black shrink-0 text-center text-sm tracking-tighter leading-none border shadow-xs",
                    item.importance === "high" 
                      ? "bg-rose-500/10 border-rose-200 text-rose-600" 
                      : "bg-slate-100 border-slate-200 text-slate-700"
                  )}>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold">{item.fuso}</span>
                    <span className="text-base font-sans block mt-1">{item.day}</span>
                  </div>

                  <div className="space-y-1 text-left font-sans font-semibold text-xs text-gray-655 font-semibold">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-[#141414] text-xs uppercase tracking-tight">{item.title}</h4>
                      {item.importance === "high" && (
                        <span className="bg-rose-500 text-white font-mono text-[8px] uppercase font-black px-1.5 py-0.2 rounded-full">Crítico</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex md:items-center justify-between gap-4 mt-6 text-left">
              <div className="flex gap-3 items-center z-10">
                <ShieldCheck size={24} className="text-emerald-500 shrink-0" />
                <p className="text-[11.5px] text-slate-800 leading-relaxed font-semibold">
                  <strong>Conselho Fiscal da Dafne:</strong> É fundamental manter um fluxo fiscal preventivo sintonizado com sua assessoria contábil. No cockpit de caixa, reserve provisões para as obrigações fiscais no dia 15 de cada mês para garantir o pleno fôlego operacional da empresa.
                </p>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
