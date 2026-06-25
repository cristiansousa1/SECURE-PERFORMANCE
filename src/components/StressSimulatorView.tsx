import React, { useState, useEffect, useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Sliders,
  DollarSign,
  Briefcase,
  Layers,
  Activity,
  Heart,
  HelpCircle,
  HelpCircle as InfoIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";

// Interfaces
interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  revenueFactor: number; // multiplier, e.g. 0.8 for -20%
  opexFactor: number;    // multiplier, e.g. 1.15 for +15%
  marginShift: number;   // margin percentage shift, e.g. -5 means margins drop by 5%
  defaultRate: number;   // default rate percentage of revenue, e.g. 8% of revenue is lost
  severity: "low" | "moderate" | "high" | "severe";
  icon: React.ReactNode;
}

export default function StressSimulatorView() {
  const { transactions, categories, products, profile, showToast, isDemoMode } = useFinance();

  // 1. Calculate Baseline Metrics based on Current Financial State
  const baselineMetrics = useMemo(() => {
    const incomes = transactions.filter((t) => t.type === "income");
    const expenses = transactions.filter((t) => t.type === "expense");

    const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);

    const hasData = transactions.length > 0;

    // Dynamic initial cash balance (fallback to R$ 0 if empty)
    const currentBalance = hasData ? Math.max(0, totalIncome - totalExpense) : 0;

    // Typical monthly averages (use total or divide if multiple months)
    const avgMonthlyIncome = incomes.length > 0 ? (totalIncome / Math.max(1, incomes.length)) * 1.5 : 0;
    const avgMonthlyOpex = expenses.length > 0 ? (totalExpense / Math.max(1, expenses.length)) * 1.5 : 0;

    // Average Product margin
    const avgProductMargin = products && products.length > 0
      ? products.reduce((sum, p) => sum + p.profitMarginPct, 0) / products.length
      : 0;

    return {
      currentBalance,
      avgMonthlyIncome,
      avgMonthlyOpex,
      avgProductMargin,
    };
  }, [transactions, products]);

  // Scenarios Pre-defined Configs
  const presets: ScenarioPreset[] = [
    {
      id: "baseline",
      name: "Status Quo (Linha de Base)",
      description: "Manutenção do ritmo atual de mercado e custos operacionais puros.",
      revenueFactor: 1.0,
      opexFactor: 1.0,
      marginShift: 0,
      defaultRate: 2.0,
      severity: "low",
      icon: <Activity className="w-5 h-5 text-emerald-555" />,
    },
    {
      id: "recession",
      name: "Recessão Forte de Mercado",
      description: "Desaceleração severa de faturamento com aumento discreto de custos por escassez.",
      revenueFactor: 0.75, // -25%
      opexFactor: 1.10,    // +10%
      marginShift: -4,     // -4% de margem
      defaultRate: 8.0,    // 8% inadimplência
      severity: "high",
      icon: <TrendingDown className="w-5 h-5 text-amber-500" />,
    },
    {
      id: "hiring_expansion",
      name: "Expansão Agressiva PJ",
      description: "Aumento robusto de vendas, porém com contratações imediatas elevando o custo fixo.",
      revenueFactor: 1.35, // +35% faturamento
      opexFactor: 1.25,    // +25% OPEX fixo
      marginShift: 2,      // +2% margem ganha por escala
      defaultRate: 3.5,    // 3.5% inadimplência
      severity: "moderate",
      icon: <TrendingUp className="w-5 h-5 text-indigo-500" />,
    },
    {
      id: "price_war",
      name: "Guerra de Margens & Preços",
      description: "Concorrência agressiva força redução de preço (markup menor), com volume estagnado.",
      revenueFactor: 0.90, // -10% receita bruta
      opexFactor: 1.05,    // +5% custos de marketing defensivo
      marginShift: -8,     // -8% margem de contribuição direta
      defaultRate: 4.0,    // 4% inadimplência
      severity: "high",
      icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
    },
    {
      id: "hyperinflation",
      name: "Crise Inflacionária de Insumos",
      description: "Preços de matérias-primas e tarifas disparam rápido com receita nominal congelada.",
      revenueFactor: 0.95, // -5% volume real
      opexFactor: 1.30,    // +30% OPEX/Logística de insumos
      marginShift: -10,    // -10% margem corroída
      defaultRate: 6.0,    // 6% inadimplência
      severity: "severe",
      icon: <AlertOctagon className="w-5 h-5 text-red-650" />,
    }
  ];

  // Simulator Parameters State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("recession");
  const [customRevenueFactor, setCustomRevenueFactor] = useState<number>(75); // % of baseline
  const [customOpexFactor, setCustomOpexFactor] = useState<number>(110);    // % of baseline
  const [customMarginShift, setCustomMarginShift] = useState<number>(-4);    // margin percentage difference
  const [customDefaultRate, setCustomDefaultRate] = useState<number>(8);     // % default of revenue

  // Sync state when Preset Changes
  useEffect(() => {
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (preset && selectedPresetId !== "custom") {
      setCustomRevenueFactor(Math.round(preset.revenueFactor * 100));
      setCustomOpexFactor(Math.round(preset.opexFactor * 100));
      setCustomMarginShift(preset.marginShift);
      setCustomDefaultRate(preset.defaultRate);
    }
  }, [selectedPresetId]);

  // Determine current active factor ranges
  const activeRevenueFactor = customRevenueFactor / 100;
  const activeOpexFactor = customOpexFactor / 100;
  const activeMarginShift = customMarginShift;
  const activeDefaultRate = customDefaultRate;

  // 2. Perform 12-Month Projections
  const projectionData = useMemo(() => {
    const dataList = [];
    let currentCash = baselineMetrics.currentBalance;
    let baselineCumulativeCash = baselineMetrics.currentBalance;

    const baseMonthlyRevenue = baselineMetrics.avgMonthlyIncome;
    const baseMonthlyOpex = baselineMetrics.avgMonthlyOpex;

    for (let month = 1; month <= 12; month++) {
      // Baseline Curve Calculation (Status Quo)
      const baseMonthlyReceipt = baseMonthlyRevenue * (1 - 0.02); // 2% normal default
      const baseNetProfit = baseMonthlyReceipt - baseMonthlyOpex;
      baselineCumulativeCash += baseNetProfit;

      // Simulated Stress Curve Calculation
      const simulatedRevenue = baseMonthlyRevenue * activeRevenueFactor;
      const simulatedReceipt = simulatedRevenue * (1 - activeDefaultRate / 100);
      const simulatedOpex = baseMonthlyOpex * activeOpexFactor;

      // Contribution Margin Shift penalty impact on profitability (estimated)
      const marginPenaltyFactor = 1 + (activeMarginShift / 100);
      const simulatedNetProfit = (simulatedReceipt * marginPenaltyFactor) - simulatedOpex;

      currentCash += simulatedNetProfit;

      dataList.push({
        monthName: `Mês ${month}`,
        "Saldo Projetado (Linha Base)": Math.round(baselineCumulativeCash),
        "Saldo Projetado (Estresse)": Math.round(currentCash),
        Faturamento: Math.round(simulatedRevenue),
        Despesas: Math.round(simulatedOpex),
        LucroLiquido: Math.round(simulatedNetProfit),
      });
    }

    return dataList;
  }, [baselineMetrics, activeRevenueFactor, activeOpexFactor, activeMarginShift, activeDefaultRate]);

  // Calculate Survival stats
  const survivalAnalysis = useMemo(() => {
    let cash = baselineMetrics.currentBalance;
    const baseMonthlyRevenue = baselineMetrics.avgMonthlyIncome;
    const baseMonthlyOpex = baselineMetrics.avgMonthlyOpex;

    let monthsToDecline = 0;
    const limit = 120; // safe cap

    for (let month = 1; month <= limit; month++) {
      const simulatedRevenue = baseMonthlyRevenue * activeRevenueFactor;
      const simulatedReceipt = simulatedRevenue * (1 - activeDefaultRate / 100);
      const simulatedOpex = baseMonthlyOpex * activeOpexFactor;

      const marginPenaltyFactor = 1 + (activeMarginShift / 100);
      const simulatedNetProfit = (simulatedReceipt * marginPenaltyFactor) - simulatedOpex;

      cash += simulatedNetProfit;

      if (cash <= 0) {
        monthsToDecline = month;
        break;
      }
    }

    const currentSimulatedNet = (baseMonthlyRevenue * activeRevenueFactor * (1 - activeDefaultRate/100) * (1 + activeMarginShift/100)) - (baseMonthlyOpex * activeOpexFactor);
    const simulatedEbitdaMargin = (baseMonthlyRevenue * activeRevenueFactor) > 0 
      ? (currentSimulatedNet / (baseMonthlyRevenue * activeRevenueFactor)) * 100 
      : 0;

    return {
      runwayMonths: monthsToDecline > 0 ? monthsToDecline : "Inalterado / Saudável",
      isCritical: monthsToDecline > 0 && monthsToDecline <= 6,
      simulatedMonthlyProfit: currentSimulatedNet,
      simulatedEbitdaMargin,
    };
  }, [baselineMetrics, activeRevenueFactor, activeOpexFactor, activeMarginShift, activeDefaultRate]);

  // 3. AI Copilot Integration (Server-side Gemini request)
  const [aiReport, setAiReport] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const requestAiDiagnosis = async () => {
    setIsAiLoading(true);
    setAiReport("");
    try {
      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": localStorage.getItem("dafne_user_email") || "",
        },
        body: JSON.stringify({
          message: `Dafne, como estrategista, por favor faça um [DIAGNÓSTICO CIRÚRGICO DE ESTRESSE] para a empresa (${profile?.companyName || "PJ"}).
Simulamos o cenário idealizado "${presets.find(p=>p.id===selectedPresetId)?.name || 'Personalizado'}" com as seguintes variações extremas de estresse operacional corporativo:
- Variação do Faturamento: ${customRevenueFactor}% sobre o original (${activeRevenueFactor >= 1 ? '+' : ''}${Math.round((activeRevenueFactor - 1)*100)}%)
- Variação do Custo Fixo/OPEX: ${customOpexFactor}% (${activeOpexFactor >= 1 ? '+' : ''}${Math.round((activeOpexFactor - 1)*100)}%)
- Queda de Margem de Contribuição: Mudança de ${activeMarginShift} pontos percentuais
- Taxa de Inadimplência Média Estimada: ${activeDefaultRate}%

DADOS ATUAIS DE BASELINE:
- Faturamento mensal estimado: ${formatCurrency(baselineMetrics.avgMonthlyIncome)}
- Custo operacional estimado: ${formatCurrency(baselineMetrics.avgMonthlyOpex)}
- Projeção de Runway (Meses de Sobrevivência): ${survivalAnalysis.runwayMonths} meses.
- Margem EBITDA Simulada resultante: ${survivalAnalysis.simulatedEbitdaMargin.toFixed(1)}%

Por favor, forneça em Markdown estruturado:
1. Uma análise breve e sincera sobre a viabilidade operacional sob estes parâmetros de estresse.
2. Três contra-medidas financeiras urgentes de curtíssimo prazo para blindar o fluxo de caixa PJ.
3. Sugestões de corte operacional ("OPEX Triggers") para equilibrar o caixa imediatamente.
Use seu tom profissional de Dafne, sem enrolações.`,
          financialData: {
            businessSegment: profile?.businessSegment || "other",
            companyName: profile?.companyName || "Minha Empresa",
            totalIncome: baselineMetrics.avgMonthlyIncome,
            totalExpense: baselineMetrics.avgMonthlyOpex,
            balance: baselineMetrics.currentBalance,
          },
          neuralPrecision: 0.85,
          neuralTier: "quantum"
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Extract message response safely
        const dafneText = result.message || result.text || "";
        setAiReport(dafneText);
        showToast("Parecer Dafne AI gerado com sucesso!", "success");
      } else {
        throw new Error("Erro na solicitação com o servidor de inteligência.");
      }
    } catch (err: any) {
      console.error(err);
      setAiReport("⚠️ Desculpe, não conseguimos conectar ao motor de inteligência central da Dafne. Verifique sua chave de API nas configurações ou tente novamente.");
      showToast("Falha ao contatar a inteligência central.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div id="stress-simulator-lab" className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in duration-500">
      
      {/* 1. Header block */}
      <div className="xl:col-span-12 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert className="w-40 h-40 text-orange-500 animate-pulse" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-orange-400 text-xs font-black uppercase tracking-widest font-mono mb-2">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
              TECNOLOGIA COGNITIVA DAFNE
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-1.5 flex items-center gap-2">
              Laboratório Avançado de Stress-Testing & Simulação de Caixa
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Descubra a resiliência do seu fluxo de caixa PJ inserindo simulações macroeconômicas de recessão, aumentos de custos ou queda de margem corporativa. Proteja o faturamento antes da crise.
            </p>
          </div>
          <button
            onClick={() => setSelectedPresetId("baseline")}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start md:self-center cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Variações Padrão
          </button>
        </div>
      </div>

      {/* 2. Control center - parameters sliders */}
      <div className="xl:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-6">
        <div>
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-orange-555" />
            <h2 className="text-sm font-black text-slate-850 uppercase tracking-wider font-sans">
              Parâmetros de Estresse
            </h2>
          </div>

          {/* Preset Selector */}
          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Escolher Modelo de Estresse (Preset)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={cn(
                    "p-3 rounded-xl border text-left text-xs transition-all relative flex gap-3 items-start cursor-pointer",
                    selectedPresetId === preset.id
                      ? "border-orange-500 bg-orange-50/40 text-orange-950 shadow-sm"
                      : "border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50 hover:border-slate-250"
                  )}
                >
                  <div className="mt-0.5">{preset.icon}</div>
                  <div>
                    <h3 className="font-extrabold text-slate-850">{preset.name}</h3>
                    <p className="text-[10px] text-slate-450 leading-relaxed mt-0.5">{preset.description}</p>
                  </div>
                  {preset.severity !== "low" && (
                    <span className={cn(
                      "absolute top-3 right-3 text-[9px] font-mono leading-none tracking-widest px-1.5 py-0.5 rounded-full font-black uppercase",
                      preset.severity === "high" && "bg-rose-100 text-rose-700",
                      preset.severity === "moderate" && "bg-indigo-100 text-indigo-700",
                      preset.severity === "severe" && "bg-red-100 text-red-700"
                    )}>
                      {preset.severity === "severe" ? "Crítico!" : preset.severity}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setSelectedPresetId("custom")}
                className={cn(
                  "p-3 rounded-xl border text-left text-xs transition-all flex gap-3 items-start cursor-pointer",
                  selectedPresetId === "custom"
                    ? "border-orange-500 bg-orange-50/40 text-orange-950"
                    : "border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="mt-0.5">
                  <Sliders className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-850">Personalizar Simulador</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Ajuste os controles deslizantes ao seu critério.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Sliders */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">Volume de Vendas / Faturamento</span>
                <strong className="font-mono text-slate-900">{customRevenueFactor}%</strong>
              </div>
              <input
                type="range"
                min="40"
                max="180"
                value={customRevenueFactor}
                onChange={(e) => {
                  setSelectedPresetId("custom");
                  setCustomRevenueFactor(Number(e.target.value));
                }}
                className="w-full accent-orange-500 h-1 bg-slate-100 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                {customRevenueFactor < 100 
                  ? `Queda de ${100 - customRevenueFactor}% no volume bruto de demandas.`
                  : `Aumento de ${customRevenueFactor - 100}% no tráfego comercial.`}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">Custo de Operação (OPEX PJ)</span>
                <strong className="font-mono text-slate-900">{customOpexFactor}%</strong>
              </div>
              <input
                type="range"
                min="50"
                max="180"
                value={customOpexFactor}
                onChange={(e) => {
                  setSelectedPresetId("custom");
                  setCustomOpexFactor(Number(e.target.value));
                }}
                className="w-full accent-orange-500 h-1 bg-slate-100 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                {customOpexFactor > 100
                  ? `Inchaço inflacionário ou desvio de despesa fixa de +${customOpexFactor - 100}%.`
                  : `Combate cirúrgico de custos com economia de ${100 - customOpexFactor}%.`}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">Distorsão de Margem Bruta</span>
                <strong className="font-mono text-slate-900">
                  {customMarginShift > 0 ? `+${customMarginShift}` : customMarginShift} p.p.
                </strong>
              </div>
              <input
                type="range"
                min="-25"
                max="20"
                value={customMarginShift}
                onChange={(e) => {
                  setSelectedPresetId("custom");
                  setCustomMarginShift(Number(e.target.value));
                }}
                className="w-full accent-orange-500 h-1 bg-slate-100 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                {customMarginShift < 0
                  ? `Margem de lucro média de seus itens cai de ${(baselineMetrics.avgProductMargin).toFixed(1)}% para ${(baselineMetrics.avgProductMargin + customMarginShift).toFixed(1)}%.`
                  : `Escala de lucratividade ponderada sobe para ${(baselineMetrics.avgProductMargin + customMarginShift).toFixed(1)}%.`}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">Taxa de Inadimplência</span>
                <strong className="font-mono text-slate-900">{customDefaultRate}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={customDefaultRate}
                onChange={(e) => {
                  setSelectedPresetId("custom");
                  setCustomDefaultRate(Number(e.target.value));
                }}
                className="w-full accent-orange-500 h-1 bg-slate-100 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Perda direta de receita compensada por atrasos ou falta de pagamento de clientes PJ.
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Recommendation prompt trigger */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={requestAiDiagnosis}
            disabled={isAiLoading}
            className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 select-none shadow-md hover:translate-y-[-1px] transition-all cursor-pointer"
          >
            {isAiLoading ? (
              <>
                <RefreshCw className="animate-spin w-4 h-4 text-orange-400" />
                <span>Calculando Parecer I.A...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Solicitar Laudo Dafne AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Operational graphs & numbers visualization */}
      <div className="xl:col-span-8 flex flex-col gap-6">
        
        {/* Metric summary panel under this stress state */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Runway Estimado PJ
            </span>
            <div className="flex items-baseline gap-1.5">
              <strong className={cn(
                "text-2xl font-black font-mono tracking-tight",
                typeof survivalAnalysis.runwayMonths === "number" && survivalAnalysis.runwayMonths <= 6
                  ? "text-rose-600"
                  : "text-slate-850"
              )}>
                {typeof survivalAnalysis.runwayMonths === "number" 
                  ? `${survivalAnalysis.runwayMonths} Meses` 
                  : "Indefinido"}
              </strong>
            </div>
            <p className="text-[10px] text-slate-450 leading-normal mt-2">
              {typeof survivalAnalysis.runwayMonths === "number"
                ? `⚠️ Alerta Vermelho! O caixa atual suportará no máximo ${survivalAnalysis.runwayMonths} meses de operação sob custos inalterados.`
                : `🎉 Excelente! O superávit contínuo impede a queima de reservas de capital no período simulado.`}
            </p>
          </div>

          <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Margem EBITDA Projetada
            </span>
            <div className="flex items-baseline gap-1.5">
              <strong className={cn(
                "text-2xl font-black font-mono tracking-tight",
                survivalAnalysis.simulatedEbitdaMargin < 15 ? "text-rose-500" : "text-emerald-500"
              )}>
                {survivalAnalysis.simulatedEbitdaMargin.toFixed(1)}%
              </strong>
              <span className="text-[10px] font-bold text-slate-400">vs {baselineMetrics.avgProductMargin.toFixed(1)}%</span>
            </div>
            <p className="text-[10px] text-slate-450 leading-normal mt-2">
              {survivalAnalysis.simulatedEbitdaMargin < 15
                ? "As margens comprimidas indicam que você precisará urgente de um repricing ou corte profundo de OPEX administrativo."
                : "A lucratividade operacional simulada permanece resiliente e acima do patamar de fragilidade de fluxo de caixa."}
            </p>
          </div>

          <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Resultado Mensal Simulado
            </span>
            <div className="flex items-baseline gap-1.5">
              <strong className={cn(
                "text-2xl font-black font-mono tracking-tight",
                survivalAnalysis.simulatedMonthlyProfit < 0 ? "text-rose-500 animate-pulse" : "text-emerald-500"
              )}>
                {formatCurrency(survivalAnalysis.simulatedMonthlyProfit)}
              </strong>
              <span className="text-[10px] font-mono leading-none tracking-wider text-slate-400">/mês</span>
            </div>
            <p className="text-[10px] text-slate-450 leading-normal mt-2">
              {survivalAnalysis.simulatedMonthlyProfit < 0
                ? "Déficit mensal recorrente. Necessário renegociar prazos ou injetar capital externo para estabilizar o fluxo de giro."
                : "Superávit mensal operacional. O caixa PJ continuará em expansão contínua, embora em ritmo variável."}
            </p>
          </div>
        </div>

        {/* Main LineChart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-black text-slate-850 uppercase tracking-wider">
                Simulador Gráfico de Reservas Financeiras (12 Meses)
              </h2>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                Valores de caixa acumulados projetados mês a mês comparando a Linha de Base à Curva de Estresse Simulada.
              </p>
            </div>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${(val / 1000)}k`} 
                />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "16px", border: "none", color: "#fff", fontSize: "11px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area 
                  type="monotone" 
                  dataKey="Saldo Projetado (Linha Base)" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorBaseline)" 
                  filter="url(#neon-glow-emerald)"
                />
                <Area 
                  type="monotone" 
                  dataKey="Saldo Projetado (Estresse)" 
                  stroke="#ef4444" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorStress)" 
                  filter="url(#neon-glow-rose)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Dafne Opinion Render Terminal */}
        <AnimatePresence>
          {(isAiLoading || aiReport) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-950 text-slate-100 rounded-3xl p-6 shadow-xl border border-orange-500/20 relative font-sans overflow-hidden"
            >
              {/* Pulsing neuro indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-450 opacity-75", isAiLoading && "bg-orange-500")} />
                  <span className={cn("relative inline-flex rounded-full h-3 w-3 bg-orange-500", isAiLoading && "animate-pulse")} />
                </span>
                <span className="text-[9px] font-bold text-orange-400 font-mono uppercase tracking-widest">
                  {isAiLoading ? "Processando Neurônios" : "Auditoria Completa"}
                </span>
              </div>

              <div className="flex items-center gap-3.5 pb-4 mb-4 border-b border-white/5 relative z-10">
                <div className="h-10 w-10 rounded-full border border-orange-500/30 overflow-hidden shrink-0 shadow-inner bg-slate-900 flex items-center justify-center">
                  <span className="font-extrabold text-orange-400 text-sm font-mono">DA</span>
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Laudo de Estresse Dafne AI</h3>
                  <p className="text-[10px] text-slate-400 font-mono">CO-PILOTO DE DIAGNÓSTICO PJ & PREVENÇÃO DE CRISES</p>
                </div>
              </div>

              {isAiLoading ? (
                <div className="py-8 text-center space-y-4">
                  <RefreshCw className="animate-spin text-orange-500 w-10 h-10 mx-auto" />
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-300 font-medium">Analisando impacto nas despesas ordinárias e margem ponderada...</p>
                    <p className="text-[10px] text-slate-550 font-mono">Dafne está estimulando redundâncias financeiras e pontos cegos comerciais</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert prose-xs text-xs text-slate-300 leading-relaxed font-sans max-w-none space-y-3 whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
                  {aiReport}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
