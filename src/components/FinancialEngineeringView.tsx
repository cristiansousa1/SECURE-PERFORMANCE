import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Sliders,
  DollarSign,
  Activity,
  Zap,
  Info,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Percent,
  Layers,
  LineChart as LineChartIcon,
  HelpCircle,
  Award,
  BookOpen,
  PieChart as RechartsPieIcon,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

export default function FinancialEngineeringView() {
  const {
    transactions,
    getDRE,
    bills,
    products,
    profile,
    showToast
  } = useFinance();

  // Selected technique tab
  const [activeEngTab, setActiveEngTab] = useState<"dupont" | "dcf" | "breakeven" | "workingcapital">("dupont");

  // Loading state for Gemini response
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  // Load actual financial calculations from context
  const currentMonthDRE = getDRE(new Date());
  
  // Real statistics extracted from current DRE
  const dIncome = currentMonthDRE.find(l => 
    l.label === "RECEITA OPERACIONAL BRUTA" || 
    l.label.toUpperCase().includes("RECEITA OPERACIONAL BRUTA") ||
    l.label.toLowerCase().includes("receita total") || 
    l.label.toLowerCase().includes("faturamento")
  );
  
  const dOpex = currentMonthDRE.find(l => 
    l.label.includes("Despesas Operacionais") || 
    l.label.toLowerCase().includes("despesas operacionais") || 
    l.label.toLowerCase().includes("opex")
  );

  const dCogs = currentMonthDRE.find(l => 
    l.label.includes("Custos dos Produtos") || 
    l.label.toLowerCase().includes("custos") || 
    l.label.toLowerCase().includes("cmv")
  );

  const dNetProfit = currentMonthDRE.find(l => 
    l.label === "(=) RESULTADO LÍQUIDO DO PERÍODO" || 
    l.label.toUpperCase().includes("RESULTADO LÍQUIDO") ||
    l.label.toLowerCase().includes("resultado líquido") ||
    l.label.toLowerCase().includes("resultado liquido")
  );

  const realRevenue = dIncome ? dIncome.value : 0;
  const opexVal = dOpex ? Math.abs(dOpex.value) : 0;
  const cogsVal = dCogs ? Math.abs(dCogs.value) : 0;
  const realExpense = opexVal + cogsVal;
  const realNetProfit = dNetProfit ? dNetProfit.value : 0;
  const realNetMargin = realRevenue > 0 ? (realNetProfit / realRevenue) * 100 : 0;

  // 1. DuPont Model Inputs & Simulation State
  const [dupontNetMargin, setDupontNetMargin] = useState<number>(0);
  const [dupontAssetTurnover, setDupontAssetTurnover] = useState<number>(1.2);
  const [dupontEquityMultiplier, setDupontEquityMultiplier] = useState<number>(1.5);

  // Sync dupontNetMargin with realNetMargin when real data is loaded
  useEffect(() => {
    setDupontNetMargin(Number(realNetMargin.toFixed(1)));
  }, [realNetMargin]);

  // DuPont calculations
  const dupontROA = dupontNetMargin * dupontAssetTurnover;
  const dupontROE = dupontROA * dupontEquityMultiplier;

  // 2. DCF (Discounted Cash Flow) Inputs
  const [dcfBaseRevenue, setDcfBaseRevenue] = useState<number>(1200000); // Annualized Revenue
  const [dcfEbitdaMargin, setDcfEbitdaMargin] = useState<number>(22); // % EBITDA margin
  const [dcfGrowthRate, setDcfGrowthRate] = useState<number>(15); // % annual growth
  const [dcfWacc, setDcfWacc] = useState<number>(12.5); // % discount rate (WACC)
  const [dcfPerpetuityRate, setDcfPerpetuityRate] = useState<number>(3.5); // % perpetuity growth rate
  const [dcfCapexPct, setDcfCapexPct] = useState<number>(4); // % capex over revenue

  // Calculate projected 5 year DCF
  const dcfProjectedData = React.useMemo(() => {
    const data = [];
    let prevRev = dcfBaseRevenue;

    for (let year = 1; year <= 5; year++) {
      const rev = prevRev * (1 + dcfGrowthRate / 100);
      const ebitda = rev * (dcfEbitdaMargin / 100);
      const taxes = ebitda * 0.15; // Simulated Corp Taxes (15%)
      const capex = rev * (dcfCapexPct / 100);
      const workingCapitalChange = rev * 0.02; // Simulated WC needs
      const fcf = ebitda - taxes - capex - workingCapitalChange; // Free Cash Flow

      // Discount Factor: 1 / (1 + WACC)^year
      const discountFactor = Math.pow(1 + (dcfWacc || 0) / 100, year);
      const pvFcf = discountFactor > 0 ? fcf / discountFactor : 0;

      data.push({
        year: `Ano ${year}`,
        revenue: Math.round(rev),
        fcf: Math.round(fcf),
        pvFcf: Math.round(pvFcf)
      });
      prevRev = rev;
    }
    return data;
  }, [dcfBaseRevenue, dcfEbitdaMargin, dcfGrowthRate, dcfWacc, dcfCapexPct]);

  const dcfCumulativePV = dcfProjectedData.reduce((acc, curr) => acc + curr.pvFcf, 0);
  const finalYearFCF = dcfProjectedData[4]?.fcf || 0;
  // Terminal Value = Final FCF * (1 + Growth) / (WACC - PerpetuityRate)
  const waccPerpDiff = (dcfWacc - dcfPerpetuityRate) / 100;
  const terminalValue = waccPerpDiff > 0 ? (finalYearFCF * (1 + dcfPerpetuityRate / 100)) / waccPerpDiff : 0;
  const pvTerminalValue = terminalValue / Math.pow(1 + (dcfWacc || 0) / 100, 5);
  const impliedEnterpriseValue = dcfCumulativePV + pvTerminalValue;

  // 3. Break-Even Point Dynamic Multi-Scenario State
  const [beFixedOpex, setBeFixedOpex] = useState<number>(35000);
  const [beMarginOfContribution, setBeMarginOfContribution] = useState<number>(60); // % contribution margin
  const [targetNetMarginA, setTargetNetMarginA] = useState<number>(10); // Target Margin A %
  const [targetNetMarginB, setTargetNetMarginB] = useState<number>(20); // Target Margin B %

  // Break-even output calculations
  const breakEvenFinancialRev = beMarginOfContribution > 0 ? (beFixedOpex / (beMarginOfContribution / 100)) : 0;
  const revForTargetA = beMarginOfContribution > targetNetMarginA ? (beFixedOpex / ((beMarginOfContribution - targetNetMarginA) / 100)) : 0;
  const revForTargetB = beMarginOfContribution > targetNetMarginB ? (beFixedOpex / ((beMarginOfContribution - targetNetMarginB) / 100)) : 0;

  // Graph data for Break-Even range
  const breakEvenGraphData = React.useMemo(() => {
    const data = [];
    const minScale = Math.max(10000, Math.round(breakEvenFinancialRev * 0.3));
    const maxScale = Math.round(Math.max(breakEvenFinancialRev * 2, revForTargetB * 1.5 || 200000));
    const step = Math.round((maxScale - minScale) / 10);

    for (let rev = minScale; rev <= maxScale; rev += step) {
      const contrib = rev * (beMarginOfContribution / 100);
      const totalCost = beFixedOpex + (rev * (1 - beMarginOfContribution / 100));
      const profit = contrib - beFixedOpex;

      data.push({
        revenue: rev,
        "Faturamento": Math.round(rev),
        "Custo Operacional Total": Math.round(totalCost),
        "Ponto de Break-Even": Math.round(breakEvenFinancialRev),
        "Resultado Líquido": Math.round(profit)
      });
    }
    return data;
  }, [beFixedOpex, beMarginOfContribution, breakEvenFinancialRev, revForTargetB]);

  // 4. Working Capital Inputs
  const [wcDso, setWcDso] = useState<number>(35); // Dias de Contas a Receber (DSO)
  const [wcDio, setWcDio] = useState<number>(45); // Dias de Estoque (DIO)
  const [wcDpo, setWcDpo] = useState<number>(28); // Dias de Contas a Pagar (DPO)
  const [outflowOptimizationPct, setOutflowOptimizationPct] = useState<number>(0); // Otimização de Custos (0% - 30%)
  const [customExtensionForSupplier, setCustomExtensionForSupplier] = useState<boolean>(false); // Postergar Fornecedores (+15 dias no DPO)
  const [customFastReceiving, setCustomFastReceiving] = useState<boolean>(false); // Antecipação / Recebimento Instantâneo (DSO para 2 dias)

  // Cash Conversion Cycle
  const adjustedDso = customFastReceiving ? 2 : wcDso;
  const adjustedDpo = customExtensionForSupplier ? Math.min(wcDpo + 15, 90) : wcDpo;
  const adjustedCCC = adjustedDso + wcDio - adjustedDpo;
  const wcCCC = adjustedCCC;

  // Derived expenses elements for our integrated working capital maths
  const totalPendingBills = bills
    ? bills
        .filter(b => b.status === "pending" || b.status === "overdue")
        .reduce((sum, b) => sum + b.amount, 0)
    : 0;

  const totalMonthExpenses = realExpense || 0;
  const totalGlobalOutflow = totalMonthExpenses + totalPendingBills;
  
  // Real or fallback daily outflow
  const baseOutflowValue = totalGlobalOutflow > 0 ? totalGlobalOutflow : 0;
  const dailyOutflow = baseOutflowValue / 30;

  // Adjusted daily outflow based on dynamic simulation reduction
  const adjustedDailyOutflow = dailyOutflow * (1 - outflowOptimizationPct / 100);

  // Safety reserve recommended
  const safetyReserveVal = adjustedDailyOutflow * 90;

  // Suggest default business metrics mapping on change of active stores/profile
  useEffect(() => {
    if (profile) {
      if (profile.averageBilling && profile.averageBilling > 0) {
        setDcfBaseRevenue(profile.averageBilling * 12);
      }
    }
    if (realRevenue > 0) {
      setDcfBaseRevenue(realRevenue * 12);
    }
    if (realExpense > 0) {
      setBeFixedOpex(Math.round(realExpense));
    }
  }, [profile, realRevenue, realExpense]);

  // Send stats to backend for premium AI insights
  const triggerAdvancedFinancialEngineeringAnalysis = async () => {
    setIsAnalyzing(true);
    setDiagnosticResult(null);

    const emailHeader = localStorage.getItem("dafne_user_email") || "";
    const customKeyHeader = localStorage.getItem("dafne_custom_api_key") || "";

    const payload = {
      technique: activeEngTab,
      companyName: profile?.companyName || "Minha Empresa",
      businessType: profile?.businessType || "Geral",
      currentRevenues: realRevenue,
      currentExpenses: realExpense,
      currentNetMargin: realNetMargin,
      dupontStats: {
        netMargin: dupontNetMargin,
        assetTurnover: dupontAssetTurnover,
        equityMultiplier: dupontEquityMultiplier,
        roa: dupontROA,
        roe: dupontROE
      },
      dcfStats: {
        annualizedBaseRevenue: dcfBaseRevenue,
        growth: dcfGrowthRate,
        wacc: dcfWacc,
        ebitdaMargin: dcfEbitdaMargin,
        impliedEnterpriseValue
      },
      breakEvenStats: {
        fixedOpex: beFixedOpex,
        contribMarginPct: beMarginOfContribution,
        breakEvenRevenue: breakEvenFinancialRev,
        revForTargetA,
        revForTargetB,
        targetA: targetNetMarginA,
        targetB: targetNetMarginB
      },
      workingCapitalStats: {
        dso: wcDso,
        dio: wcDio,
        dpo: wcDpo,
        ccc: wcCCC
      }
    };

    try {
      const response = await fetch("/api/ai/financial-engineering", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": emailHeader,
          "x-custom-gemini-key": customKeyHeader
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro desconhecido ao processar engenharia financeira.");
      }

      const data = await response.json();
      setDiagnosticResult(data.report);
      try {
        localStorage.setItem(`fin_eng_run_${transactions.length}`, "true");
      } catch (e) {}
      showToast("Suíte de Inteligência Cognitiva acionada com sucesso!", "success");
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || String(error);
      showToast(errMsg, "error");
      
      // Fallback offline dynamic guidance
      setDiagnosticResult(`
### 🤖 [CONEXÃO LOCAL EMERGENCIAL] PARECER DA MENTORA FINANCEIRA DAFNE

Não foi possível contactar o servidor em nuvem completo, mas preparei um parecer técnico resumido com base nas diretrizes matemáticas fornecidas:

1. **COMENTÁRIO DO MODELO SELECIONADO: ${activeEngTab.toUpperCase()}**
   * **Parâmetro de Alavancagem Estimado**: Suas configurações atuais mostram um ponto focal importante.
   * **Análise de Margem**: Com as variações propostas, sua taxa crítica de retorno se move de forma direta.

2. **RECOMENDAÇÃO TÁTICA IMEDIATA**:
   * Otimize os desembolsos de OPEX fixo para reduzir a linha de Ponto de Equilíbrio.
   * Negocie prazos de recebimento com adquirentes (visando reduzir o DSO) de forma a aliviar a pressão imediata de caixa.
   * Ajuste mark-ups com base no mark-up de contribuição real desejado de ${beMarginOfContribution}%.
      `);
      try {
        localStorage.setItem(`fin_eng_run_${transactions.length}`, "true");
      } catch (e) {}
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Decorative Elite Cognitive Header */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl p-6 md:p-8 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-15 translate-x-20 -translate-y-20 pointer-events-none">
          <Brain className="w-80 h-80 text-orange-500 animate-pulse" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full font-mono text-[10px] uppercase font-black tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Inteligência Regulatória Avançada
            </div>
            <h1 className="text-2xl md:text-3.5xl font-sans tracking-tight font-black">
              Suíte de Engenharia & <span className="text-orange-500">Inteligência Financeira</span>
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed font-sans">
              Acesse ferramentas táticas de alta performance estrutural para simular alavancagens, modelar o valor de mercado (Valuation), calibrar pontos de break-even e orquestrar capital de giro em tempo real.
            </p>
          </div>
          
          <button
            id="eng-btn-ai-trigger"
            onClick={triggerAdvancedFinancialEngineeringAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-4 rounded-xl bg-orange-500 text-black font-black uppercase tracking-wider text-xs shadow-lg hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center gap-3 self-start md:self-auto cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-500" />
                Processando Modelagem...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 text-black stroke-[2.5]" />
                Acionar Parecer Cognitivo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Financial Tactics Toggle Navigation Menu */}
      <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full border border-gray-200 shadow-inner overflow-x-auto gap-1">
        {[
          { id: "dupont", icon: <Layers size={15} />, label: "Análise DuPont Model" },
          { id: "dcf", icon: <TrendingUp size={15} />, label: "Valuation DCF" },
          { id: "breakeven", icon: <LineChartIcon size={15} />, label: "Break-Even Multicenário" },
          { id: "workingcapital", icon: <Activity size={15} />, label: "Otimização Capital de Giro" }
        ].map((tab) => (
          <button
            key={tab.id}
            id={`eng-nav-${tab.id}`}
            onClick={() => {
              setActiveEngTab(tab.id as any);
              setDiagnosticResult(null);
            }}
            className={cn(
              "flex-1 min-w-[160px] md:min-w-0 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer",
              activeEngTab === tab.id
                ? "bg-zinc-950 text-white shadow-md font-bold"
                : "text-zinc-500 hover:text-zinc-800 bg-transparent hover:bg-zinc-50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Analysis Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Calculations, Inputs and Graphs (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          <AnimatePresence mode="wait">
            {activeEngTab === "dupont" && (
              <motion.div
                key="dupont-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6"
                id="eng-card-dupont"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-lg text-zinc-900 leading-tight">Análise DuPont Tridimensional</h3>
                    <p className="text-zinc-400 text-xs">Simule o desdobramento da rentabilidade patrimonial (ROE) da sua empresa.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Metric inputs and sliders */}
                  <div className="space-y-4 md:col-span-1 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider mb-2">Parâmetros de Alavancagem</h4>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span>Margem Líquida</span>
                        <span className="font-mono font-bold text-orange-600">{dupontNetMargin}%</span>
                      </div>
                      <input
                        id="eng-slider-dupont-margin"
                        type="range"
                        min="1"
                        max="60"
                        step="0.5"
                        value={dupontNetMargin}
                        onChange={(e) => setDupontNetMargin(parseFloat(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] text-zinc-400 block leading-tight">Lucro Líquido gerado por real de receita.</span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span>Giro de Ativo (Eficiência)</span>
                        <span className="font-mono font-bold text-orange-600">{dupontAssetTurnover}x</span>
                      </div>
                      <input
                        id="eng-slider-dupont-turnover"
                        type="range"
                        min="0.2"
                        max="4.0"
                        step="0.1"
                        value={dupontAssetTurnover}
                        onChange={(e) => setDupontAssetTurnover(parseFloat(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] text-zinc-400 block leading-tight">Receita gerada por real de ativo investido.</span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span>Alavancagem de Balanço (ROE)</span>
                        <span className="font-mono font-bold text-orange-600">{dupontEquityMultiplier}x</span>
                      </div>
                      <input
                        id="eng-slider-dupont-multiplier"
                        type="range"
                        min="1.0"
                        max="3.5"
                        step="0.1"
                        value={dupontEquityMultiplier}
                        onChange={(e) => setDupontEquityMultiplier(parseFloat(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] text-zinc-400 block leading-tight font-sans">Multiplicador de Capital Próprio.</span>
                    </div>
                  </div>

                  {/* Operational Flow Visualization (Interactive Box) */}
                  <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white border border-gray-100 p-3.5 rounded-2xl text-center shadow-xs">
                        <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider font-bold">Margem Líquida</div>
                        <div id="eng-val-dupont-margin" className="text-xl font-bold font-mono text-zinc-800 mt-1">{dupontNetMargin.toFixed(1)}%</div>
                      </div>
                      <div className="flex items-center justify-center text-zinc-400 font-bold text-sm">×</div >
                      <div className="bg-white border border-gray-100 p-3.5 rounded-2xl text-center shadow-xs">
                        <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider font-bold">Giro de Ativo</div>
                        <div id="eng-val-dupont-turnover" className="text-xl font-bold font-mono text-zinc-800 mt-1">{dupontAssetTurnover.toFixed(1)}x</div>
                      </div>
                    </div>

                    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                      <div className="text-[10px] text-zinc-450 uppercase font-mono tracking-wider font-bold">Retorno sobre Ativo (ROA)</div>
                      <div id="eng-val-dupont-roa" className="text-2xl font-black font-mono text-zinc-800 mt-1.5">{dupontROA.toFixed(1)}%</div>
                      <p className="text-[10px] text-zinc-400 mt-1">Rentabilidade pura dos recursos operacionais aplicados</p>
                    </div>

                    <div className="flex items-center justify-center text-zinc-400 font-bold text-sm">×</div>

                    <div className="bg-zinc-950 p-4.5 rounded-2xl text-white text-center relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-5 translate-y-5">
                        <Award className="w-16 h-16 text-orange-500 font-bold" />
                      </div>
                      <div className="text-[10px] text-orange-400 uppercase font-mono tracking-wider font-black">DUPONT ROE FINAL (Retorno sobre Patrimônio)</div>
                      <div id="eng-val-dupont-roe" className="text-3.5xl font-black font-mono text-white mt-1.5">{dupontROE.toFixed(1)}%</div>
                      <p className="text-[10px] text-zinc-400 mt-1">Taxa final de remuneração dos sócios e investidores de capital próprio.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 text-xs text-orange-850 space-y-1.5 leading-relaxed font-sans">
                  <div className="flex items-center gap-1.5 font-bold text-orange-700">
                    <Info className="w-4 h-4" /> Entenda o impacto da técnica DuPont:
                  </div>
                  <p>
                    A equação Dupont prova que o retorno patrimonial não é derivado apenas de "preço de venda" (Margem Líquida). Ele pode ser amplificado ao aumentar a velocidade do giro de estoque/ativos (<span className="font-bold">{dupontAssetTurnover}x</span>) ou ao utilizar alavancagem de terceiros (<span className="font-bold">{dupontEquityMultiplier}x</span>). Dobre seu ROE de forma financeira sem alterar um centavo de seus preços!
                  </p>
                </div>
              </motion.div>
            )}

            {activeEngTab === "dcf" && (
              <motion.div
                key="dcf-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6"
                id="eng-card-dcf"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-lg text-zinc-900 leading-tight">Valuation por Fluxo de Caixa Descontado (FCD)</h3>
                    <p className="text-zinc-400 text-xs font-sans">Determine o valor patrimonial intrínseco de mercado baseado em fluxos futuros.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Parameters input column */}
                  <div className="md:col-span-1 space-y-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider mb-2">Parâmetros de Valuation</h4>
                    
                    <div className="space-y-1">
                      <label className="text-xxs uppercase font-black text-zinc-500 block">Faturamento Base Anualizado</label>
                      <input
                        id="eng-input-dcf-base"
                        type="number"
                        value={dcfBaseRevenue}
                        onChange={(e) => setDcfBaseRevenue(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xxs uppercase font-black text-zinc-500 block">Crescimento Anual Estimado: {dcfGrowthRate}%</label>
                      <input
                        id="eng-slider-dcf-growth"
                        type="range"
                        min="2"
                        max="45"
                        value={dcfGrowthRate}
                        onChange={(e) => setDcfGrowthRate(Number(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xxs uppercase font-black text-zinc-500 block">WACC (Custo de Capital): {dcfWacc}%</label>
                      <input
                        id="eng-slider-dcf-wacc"
                        type="range"
                        min="6"
                        max="24"
                        step="0.5"
                        value={dcfWacc}
                        onChange={(e) => setDcfWacc(Number(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xxs uppercase font-black text-zinc-500 block">Margem EBITDA Almejada: {dcfEbitdaMargin}%</label>
                      <input
                        id="eng-slider-dcf-ebitda"
                        type="range"
                        min="5"
                        max="50"
                        value={dcfEbitdaMargin}
                        onChange={(e) => setDcfEbitdaMargin(Number(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Valuation Outputs and dynamic graph */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 text-center">
                        <div className="text-[9.5px] uppercase font-bold text-zinc-400 font-mono tracking-wider">PV de Fluxos Explícitos (3-5 Anos)</div>
                        <div id="eng-val-dcf-fcf" className="text-lg font-black font-mono text-zinc-800 tracking-tight mt-1">
                          {formatCurrency(dcfCumulativePV)}
                        </div>
                      </div>
                      <div className="bg-zinc-950 p-3.5 rounded-2xl text-center text-white">
                        <div className="text-[9.5px] uppercase font-black text-orange-400 font-mono tracking-wider">Valor Intrínseco do Negócio</div>
                        <div id="eng-val-dcf-ev" className="text-lg font-black font-mono text-white tracking-tight mt-1">
                          {formatCurrency(impliedEnterpriseValue)}
                        </div>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dcfProjectedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, "Ref."]} />
                          <Bar dataKey="fcf" fill="#f97316" radius={[4, 4, 0, 0]} name="Fluxo de Caixa Livre" filter="url(#neon-glow-orange)" />
                          <Bar dataKey="pvFcf" fill="#3b82f6" radius={[4, 4, 0, 0]} name="FCF Descontado (Valor Presente)" filter="url(#neon-glow-blue)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 text-[10px] text-zinc-500">
                      <span>Perpetuidade da Taxa terminal: <strong className="text-zinc-700">{dcfPerpetuityRate}%</strong></span>
                      <span>Runway / CapEx estimado: <strong className="text-zinc-700">{dcfCapexPct}% do fat.</strong></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeEngTab === "breakeven" && (
              <motion.div
                key="breakeven-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6"
                id="eng-card-breakeven"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <LineChartIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-lg text-zinc-900 leading-tight">Ponto de Equilíbrio Dinâmico Multicenário</h3>
                    <p className="text-zinc-400 text-xs font-sans">Descubra faturamento limiar necessário e simule metas financeiras reais.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Inputs */}
                  <div className="space-y-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 md:col-span-1">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider mb-2">Engrenagem de Custos</h4>

                    <div className="space-y-1">
                      <label className="text-xxs uppercase font-black text-zinc-500 block">Custos Fixos Mensais (OPEX)</label>
                      <input
                        id="eng-input-be-fixed"
                        type="number"
                        value={beFixedOpex}
                        onChange={(e) => setBeFixedOpex(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xxs uppercase font-black text-zinc-500 block">Margem de Contribuição: {beMarginOfContribution}%</label>
                      <input
                        id="eng-slider-be-contrib"
                        type="range"
                        min="10"
                        max="90"
                        value={beMarginOfContribution}
                        onChange={(e) => setBeMarginOfContribution(Number(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="space-y-1">
                        <label className="text-xxs uppercase font-bold text-zinc-400 block">Meta Margem A</label>
                        <input
                          id="eng-input-be-target-a"
                          type="number"
                          max="40"
                          value={targetNetMarginA}
                          onChange={(e) => setTargetNetMarginA(Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg font-mono text-xs text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xxs uppercase font-bold text-zinc-400 block">Meta Margem B</label>
                        <input
                          id="eng-input-be-target-b"
                          type="number"
                          max="40"
                          value={targetNetMarginB}
                          onChange={(e) => setTargetNetMarginB(Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg font-mono text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Outputs & Break-Even Chart */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-red-50 border border-red-100 p-2 rounded-xl">
                        <div className="text-[8.5px] text-red-500 uppercase font-bold">BE Operacional (Zero-a-Zero)</div>
                        <div id="eng-val-be-zero" className="text-xs md:text-sm font-black font-mono text-red-700 mt-1">{formatCurrency(breakEvenFinancialRev)}</div>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-100 p-2 rounded-xl">
                        <div className="text-[8.5px] text-orange-600 uppercase font-bold">Faturamento Meta A (+{targetNetMarginA}%)</div>
                        <div id="eng-val-be-target-a" className="text-xs md:text-sm font-black font-mono text-orange-700 mt-1">{formatCurrency(revForTargetA)}</div>
                      </div>

                      <div className="bg-green-50 border border-green-100 p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                        <div className="text-[8.5px] text-green-600 uppercase font-bold">Faturamento Meta B (+{targetNetMarginB}%)</div>
                        <div id="eng-val-be-target-b" className="text-xs md:text-sm font-black font-mono text-green-700 mt-1">{formatCurrency(revForTargetB)}</div>
                      </div>
                    </div>

                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={breakEvenGraphData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="revenue" tick={{ fontSize: 9 }} tickFormatter={(val) => `R$ ${Math.round(val/1000)}k`} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, "Ref."]} />
                          <Line type="monotone" dataKey="Faturamento" stroke="#f97316" strokeWidth={3} dot={false} filter="url(#neon-glow-orange)" />
                          <Line type="monotone" dataKey="Custo Operacional Total" stroke="#ef4444" strokeWidth={2} dot={false} filter="url(#neon-glow-rose)" />
                          <Line type="monotone" dataKey="Resultado Líquido" stroke="#10b981" strokeWidth={2} dot={false} filter="url(#neon-glow-emerald)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeEngTab === "workingcapital" && (
              <motion.div
                key="workingcapital-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6"
                id="eng-card-workingcapital"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-sans font-black text-lg text-zinc-900 leading-tight">Painel Tecnológico de Capital de Giro PJ</h3>
                      <p className="text-zinc-500 text-xs font-sans">Análise preditiva integrada às faturas reais e fluxos operacionais.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start md:self-center">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-mono tracking-widest font-black text-emerald-600 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      CONEXÃO REAL ATIVA
                    </span>
                  </div>
                </div>

                {/* HERO SPOTLIGHT BENTO GRID (Em destaque) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Necessidade de Capital de Giro */}
                  <div className={cn(
                    "p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between shadow-xs",
                    (wcCCC * dailyOutflow * (1 - outflowOptimizationPct / 100)) > 0
                      ? "bg-gradient-to-br from-amber-50 to-orange-50/40 border-amber-200 text-amber-950"
                      : "bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-250 text-emerald-950"
                  )}>
                    <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 opacity-10">
                      <Zap className="w-full h-full text-current" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-black opacity-60">
                          Necessidade de Giro (NCG)
                        </span>
                        <span title="Fórmula: Ciclo Financeiro em Dias x Custo Operacional Diário Ajustado">
                          <HelpCircle className="w-3.5 h-3.5 opacity-40 cursor-help" />
                        </span>
                      </div>
                      
                      <div className="text-2.5xl md:text-3.5xl font-black font-mono tracking-tight leading-none mt-1">
                        {formatCurrency(Math.max(0, wcCCC * dailyOutflow * (1 - outflowOptimizationPct / 100)))}
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      {wcCCC > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-700 rounded-lg text-[9px] font-extrabold uppercase border border-amber-500/25">
                          ⚠️ Déficit Operacional de {wcCCC} dias
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 rounded-lg text-[9px] font-extrabold uppercase border border-emerald-500/25">
                          🏆 Ciclo Auto-Financiável (Destaque Elite)
                        </div>
                      )}
                      <p className="text-[10px] opacity-75 leading-relaxed">
                        {wcCCC > 0 
                          ? `Sua empresa exige R$ ${Math.round(wcCCC * dailyOutflow * (1 - outflowOptimizationPct / 100)).toLocaleString()} em reservas líquidas de fomento para sustentar o descasamento operacional de prazos atual.`
                          : "Excelente! Você recebe as faturas de venda dos clientes antes do dia do vencimento dos seus fornecedores de insumos."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Gasto Diário Integrado */}
                  <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-white relative overflow-hidden flex flex-col justify-between shadow-xs">
                    <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 opacity-10">
                      <DollarSign className="w-full h-full text-current" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest font-black text-zinc-550 block">
                        Gasto Diário Operacional
                      </span>
                      <div className="text-2.5xl md:text-3.5xl font-black font-mono tracking-tight leading-none mt-1 text-zinc-100">
                        {formatCurrency(adjustedDailyOutflow)}
                        <span className="text-xs font-normal text-zinc-500 ml-1">/dia</span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-1.5 border-t border-zinc-800 pt-3">
                      <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>OPEX DRE Corrente:</span>
                        <span className="font-mono text-zinc-200">{formatCurrency(totalMonthExpenses)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>Contas a Pagar Ativas (Bills):</span>
                        <span className="font-mono text-zinc-200">+{formatCurrency(totalPendingBills)}</span>
                      </div>
                      {outflowOptimizationPct > 0 && (
                        <div className="flex justify-between text-[10px] text-emerald-400 font-extrabold">
                          <span>Simulada Redução:</span>
                          <span className="font-mono">-{outflowOptimizationPct}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Reserva Recomendada de Fôlego */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-zinc-950 border border-slate-800 text-white relative overflow-hidden flex flex-col justify-between shadow-xs">
                    <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 opacity-10">
                      <TrendingUp className="w-full h-full text-current" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest font-black text-slate-500 block">
                        Colchão de Giro Seguro (Runway 90D)
                      </span>
                      <div className="text-2.5xl md:text-3.5xl font-black font-mono tracking-tight leading-none mt-1 text-orange-400">
                        {formatCurrency(safetyReserveVal)}
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 inline-block">
                        Folego de Caixa Saudável para PJ
                      </span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Recomendamos resguardar no mínimo 3 meses de despesas consolidadas de caixa para mitigar flutuações sazonais de receita.
                      </p>
                    </div>
                  </div>
                </div>

                {/* TECNOLOGIA DE SIMULAÇÃO E IMPACTO EM TEMPO REAL */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100">
                  
                  {/* Left Column: Direct parameter sliders */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <Sliders className="w-3.5 h-3.5 text-orange-500" />
                      Gargalos Operacionais de Prazo
                    </h4>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span className="font-medium">Recebimento Médio (DSO)</span>
                        <span className="font-mono font-black text-orange-600">
                          {customFastReceiving ? <span className="line-through text-zinc-400 mr-2">{wcDso} Dias</span> : null}
                          {adjustedDso} Dias
                        </span>
                      </div>
                      <input
                        id="eng-slider-wc-dso"
                        type="range"
                        min="1"
                        max="90"
                        value={wcDso}
                        disabled={customFastReceiving}
                        onChange={(e) => setWcDso(Number(e.target.value))}
                        className={cn(
                          "w-full h-1 bg-gray-200 rounded-lg cursor-pointer accent-orange-500",
                          customFastReceiving && "opacity-40 cursor-not-allowed"
                        )}
                      />
                      <span className="text-[9.5px] text-zinc-450 block leading-tight">Média de dias para o dinheiro do cliente cair em caixa.</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span className="font-medium">Giro de Estoque/Serviço (DIO)</span>
                        <span className="font-mono font-black text-orange-600">{wcDio} Dias</span>
                      </div>
                      <input
                        id="eng-slider-wc-dio"
                        type="range"
                        min="1"
                        max="120"
                        value={wcDio}
                        onChange={(e) => setWcDio(Number(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer accent-orange-500"
                      />
                      <span className="text-[9.5px] text-zinc-450 block leading-tight">Tempo médio de permanência em prateleira ou prazo de entrega.</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span className="font-medium">Prazo de Pagamento a Fornecedores (DPO)</span>
                        <span className="font-mono font-black text-emerald-600">
                          {customExtensionForSupplier ? <span className="line-through text-emerald-500/50 mr-2">{wcDpo} Dias</span> : null}
                          {adjustedDpo} Dias
                        </span>
                      </div>
                      <input
                        id="eng-slider-wc-dpo"
                        type="range"
                        min="1"
                        max="90"
                        value={wcDpo}
                        disabled={customExtensionForSupplier}
                        onChange={(e) => setWcDpo(Number(e.target.value))}
                        className={cn(
                          "w-full h-1 bg-gray-200 rounded-lg cursor-pointer accent-emerald-500",
                          customExtensionForSupplier && "opacity-40 cursor-not-allowed"
                        )}
                      />
                      <span className="text-[9.5px] text-zinc-450 block leading-tight">Prazo médio estipulado para honrar faturas de compras.</span>
                    </div>
                  </div>

                  {/* Right Column: High Tech Interactive Simulators (Adicionando Tecnologia) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      Intervenções de Tecnologia Ativas
                    </h4>

                    {/* Cost reduction slider */}
                    <div className="bg-white p-3.5 rounded-xl border border-zinc-200 space-y-1.5 shadow-2xs">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-zinc-700 flex items-center gap-1">
                          <Percent size={13} className="text-orange-500" />
                          Simular Redução de OPEX / Desperdício
                        </span>
                        <span className="font-mono font-black text-orange-600">{outflowOptimizationPct}%</span>
                      </div>
                      <input
                        id="eng-slider-outflow-reduction"
                        type="range"
                        min="0"
                        max="30"
                        step="5"
                        value={outflowOptimizationPct}
                        onChange={(e) => setOutflowOptimizationPct(Number(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer accent-orange-500"
                      />
                      <div className="flex justify-between items-center text-[9px] text-zinc-500 leading-tight">
                        <span>Giro polido de custos</span>
                        <span>
                          Giro preservado em: <strong className="text-emerald-600">{formatCurrency(dailyOutflow * (outflowOptimizationPct / 100) * 30)}/mês</strong>
                        </span>
                      </div>
                    </div>

                    {/* Interactive toggles representing high-tech adjustments */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Fast receiving toggle button */}
                      <button
                        onClick={() => setCustomFastReceiving(prev => !prev)}
                        className={cn(
                          "p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer h-24",
                          customFastReceiving
                            ? "bg-zinc-950 text-white border-zinc-950 shadow-md"
                            : "bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Zap size={14} className={customFastReceiving ? "text-orange-400 animate-bounce" : "text-zinc-400"} />
                          <span className={cn(
                            "text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded",
                            customFastReceiving ? "bg-orange-400/20 text-orange-300" : "bg-zinc-100 text-zinc-500"
                          )}>
                            {customFastReceiving ? "Zeras DSO Ativo" : "Pix Inteligente"}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-[10px] font-black uppercase tracking-wider block">Recebimento Express</span>
                          <span className="text-[9px] opacity-70 block">Zera DSO para 2 dias simulando liquidação instantânea.</span>
                        </div>
                      </button>

                      {/* Supplier terms toggle button */}
                      <button
                        onClick={() => setCustomExtensionForSupplier(prev => !prev)}
                        className={cn(
                          "p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer h-24",
                          customExtensionForSupplier
                            ? "bg-zinc-950 text-white border-zinc-950 shadow-md"
                            : "bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Activity size={14} className={customExtensionForSupplier ? "text-emerald-400 animate-spin" : "text-zinc-400"} />
                          <span className={cn(
                            "text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded",
                            customExtensionForSupplier ? "bg-emerald-400/20 text-emerald-300" : "bg-zinc-100 text-zinc-500"
                          )}>
                            {customExtensionForSupplier ? "Estendida +15D" : "Fatura Adicional"}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-[10px] font-black uppercase tracking-wider block">Acordo Fornecedores</span>
                          <span className="text-[9px] opacity-70 block">Estende o prazo com fornecedores de contas a pagar em +15 dias.</span>
                        </div>
                      </button>

                    </div>

                  </div>
                </div>

                {/* DIAGNOSTIC FORMULA FLOW & COMPARATIVES */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4.5 rounded-2xl border border-gray-200 bg-white shadow-xs">
                  <div className="text-center md:text-left space-y-1">
                    <div className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                      Fórmula do Ciclo PJ: DSO ({adjustedDso}) + DIO ({wcDio}) - DPO ({adjustedDpo})
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-zinc-950 text-white rounded font-bold">
                        Ciclo Financeiro (CCC)
                      </span>
                      <span id="eng-val-wc-ccc" className={cn(
                        "text-2xl font-black font-mono tracking-tight",
                        wcCCC > 50 ? "text-red-500" : wcCCC > 20 ? "text-orange-500" : "text-emerald-500"
                      )}>
                        {wcCCC} Dias
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto max-w-sm">
                    {wcCCC > 45 ? (
                      <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-xs text-red-800 flex gap-2.5 items-start">
                        <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-red-600 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold block">Giro Dependente Critico (CAC & DSO pressionados)</span>
                          <p className="text-[10.5px] leading-relaxed opacity-90">Sua empresa necessita financiar {wcCCC} dias de operação. Significa que você precisa de capital de giro robusto para manter o fluxo operacional sem sobressaltos.</p>
                        </div>
                      </div>
                    ) : wcCCC > 15 ? (
                      <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl text-xs text-orange-850 flex gap-2.5 items-start">
                        <Info className="w-4.5 h-4.5 shrink-0 text-orange-600 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold block">Equilíbrio Neutro Recomendado</span>
                          <p className="text-[10.5px] leading-relaxed opacity-90">Sua dependência de caixa é de {wcCCC} dias. Ative as ações interativas de tecnologia acima para reduzir as perdas e otimizar essa diferença.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs text-emerald-850 flex gap-2.5 items-start">
                        <Award className="w-4.5 h-4.5 shrink-0 text-emerald-600 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold block">Eficiência de Giro Elite</span>
                          <p className="text-[10.5px] leading-relaxed opacity-90">Com apenas {wcCCC} dias, você gira o caixa do negócio de forma espetacular sem travar liquidez, mantendo a empresa resiliente contra choques de mercado.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Interactive Simulation controls */}
          <div className="bg-zinc-950 text-white rounded-3xl p-6 border border-zinc-900 shadow-xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 font-mono">🚀 Controle Operacional Avançado</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-xxs uppercase text-zinc-500 block">Faturamento Real (DRE)</span>
                <span className="text-lg font-black font-mono text-zinc-150">{formatCurrency(realRevenue)}</span>
              </div>
              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-xxs uppercase text-zinc-500 block">Lucro Líquido Real</span>
                <span className="text-lg font-black font-mono text-zinc-150">{formatCurrency(realNetProfit)}</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-550 leading-normal">
              A Suíte de Engenharia Financeira puxa automaticamente suas faturas registradas do mês corrente para abastecer os cálculos-base, criando simulações perfeitamente calibradas à sua realidade empresarial única.
            </p>
          </div>

        </div>

        {/* Right Side: Deep Cognitive AI Diagnosis & Recommendations Feed (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-gradient-to-b from-zinc-50 to-zinc-100/30 rounded-3xl p-6 border border-gray-250 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3.5">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-500 animate-pulse" />
                <h3 className="font-sans font-black text-sm text-zinc-900 uppercase tracking-wider">Cérebro Cognitivo</h3>
              </div>
              <span className="text-[8.5px] py-1 px-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 font-mono font-black animate-pulse">
                DAFNE CHIP V2
              </span>
            </div>

            {/* AI Diagnosis Output */}
            <div className="space-y-4">
              {isAnalyzing ? (
                <div id="eng-ai-loader" className="py-20 text-center space-y-4 animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                  <p className="text-xs text-zinc-500 font-sans italic font-medium leading-relaxed">
                    Dafne está recalculando fórmulas tridimensionais, cruzando balanços e gerando pareceres técnicos sofisticados...
                  </p>
                </div>
              ) : diagnosticResult ? (
                <div id="eng-ai-report" className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-3 bg-zinc-950 text-white rounded-2xl flex items-center gap-2.5 border border-zinc-800 shadow-sm">
                    <Award className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="font-mono text-xxs tracking-wider uppercase font-black">
                      Parecer Estratégico Sênior Emitido
                    </span>
                  </div>
                  
                  <div className="text-xs text-zinc-700 space-y-3.5 leading-relaxed font-sans scroll-y max-h-[480px] overflow-y-auto pr-2 border-r border-zinc-100 bg-white/60 p-4.5 rounded-2xl border border-gray-200">
                    {/* Render simplistic parser for custom markdown format (highly readable, using basic replacements for bold lines and sections) */}
                    {diagnosticResult.split("\n").map((line, idx) => {
                      if (line.trim().startsWith("###")) {
                        return (
                          <h4 key={idx} className="font-sans font-black text-zinc-950 text-xs uppercase tracking-wider border-b border-zinc-100 pb-1 mt-3 flex items-center gap-1.5 first:mt-0 text-orange-600">
                            <Zap className="w-3.5 h-3.5 shrink-0 text-orange-500" />
                            {line.replace("###", "").trim()}
                          </h4>
                        );
                      }
                      if (line.trim().startsWith("**") || line.trim().startsWith("*")) {
                        const cleanLine = line.replace(/[*#]/g, "").trim();
                        return (
                          <div key={idx} className="flex gap-2 pl-1 my-1 italic font-semibold text-zinc-900 border-l-2 border-orange-500">
                            <span className="text-[11px] font-sans text-zinc-800">{cleanLine}</span>
                          </div>
                        );
                      }
                      if (line.trim().startsWith("-")) {
                        const cleanListItem = line.replace("-", "").replace(/[*#]/g, "").trim();
                        return (
                          <div key={idx} className="flex gap-1.5 pl-2 items-start text-zinc-600 my-1">
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-orange-400 mt-0.5" />
                            <span className="text-[11px] font-sans">{cleanListItem}</span>
                          </div>
                        );
                      }
                      const cleanParagraph = line.replace(/[*#]/g, "").trim();
                      if (!cleanParagraph) return <div key={idx} className="h-2" />;
                      return <p key={idx} className="text-[11px] text-zinc-600 font-sans">{cleanParagraph}</p>;
                    })}
                  </div>
                </div>
              ) : (
                <div id="eng-ai-placeholder" className="py-12 border border-dashed border-gray-200 rounded-3xl p-5 text-center space-y-4">
                  <div className="w-12 h-12 bg-zinc-100 text-zinc-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <BookOpen size={20} />
                  </div>
                  <div className="space-y-1">
                    <span className="font-sans font-black text-xs text-zinc-900 uppercase tracking-wider block">Cognição Financeira Ociosa</span>
                    <p className="text-xxs text-zinc-400 leading-normal font-sans">
                      Clique no botão no topo ou ajuste os sliders operacionais de simulação para fazer com que a Dafne gere um parecer analítico customizado em tempo real.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-900 text-zinc-400 p-3 rounded-2xl text-[9px] leading-relaxed flex gap-2.5 border border-zinc-800 font-mono">
              <Brain className="w-4 h-4 shrink-0 text-orange-500 animate-pulse mt-0.5" />
              <span>
                <strong>Aviso de Qualidade:</strong> Todas as análises de engenharia financeira obedecem estritamente a padrões de conformidade corporativa e marcos fiscais nacionais vigentes.
              </span>
            </div>
            
          </div>

        </div>

      </div>

    </div>
  );
}
