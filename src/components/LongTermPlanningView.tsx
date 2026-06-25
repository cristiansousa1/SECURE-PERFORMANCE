import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ReferenceLine
} from "recharts";
import {
  TrendingUp,
  Sliders,
  Sparkles,
  Target,
  Calendar,
  AlertCircle,
  FileText,
  Copy,
  CheckCircle,
  TrendingDown,
  Activity,
  Award,
  Zap,
  Globe,
  HelpCircle,
  ArrowRight,
  Info
} from "lucide-react";

interface AIPlanResponse {
  title: string;
  intro: string;
  year1Milestone: string;
  year1Directives: string[];
  year5Milestone: string;
  year5Directives: string[];
  year10Milestone: string;
  year10Directives: string[];
  marketAnalysis: string;
  aiDirectives: Array<{
    title: string;
    desc: string;
    priority: string;
  }>;
  investmentSimulatorAdvise: string;
}

export default function LongTermPlanningView() {
  const {
    transactions,
    categories,
    profile,
    showToast,
    isDemoMode,
    trackDemoInteraction
  } = useFinance();

  // 1. Sliders parameters state
  const [growthRate, setGrowthRate] = useState<number>(() => {
    const saved = localStorage.getItem("dafne_lt_growth_rate");
    return saved ? Number(saved) : 15;
  }); // Annual Revenue growth
  const [opexReduction, setOpexReduction] = useState<number>(() => {
    const saved = localStorage.getItem("dafne_lt_opex_reduction");
    return saved ? Number(saved) : 8;
  }); // Annual Operational cost optimization
  const [marginTarget, setMarginTarget] = useState<number>(() => {
    const saved = localStorage.getItem("dafne_lt_margin_target");
    return saved ? Number(saved) : 25;
  }); // Target Net Margin
  const [capexTarget, setCapexTarget] = useState<number>(() => {
    const saved = localStorage.getItem("dafne_lt_capex_target");
    return saved ? Number(saved) : 6;
  }); // Target Capex / reinvestment % of revenue

  useEffect(() => {
    localStorage.setItem("dafne_lt_growth_rate", String(growthRate));
    localStorage.setItem("dafne_lt_opex_reduction", String(opexReduction));
    localStorage.setItem("dafne_lt_margin_target", String(marginTarget));
    localStorage.setItem("dafne_lt_capex_target", String(capexTarget));
  }, [growthRate, opexReduction, marginTarget, capexTarget]);

  // 2. AI Strategic results state
  const [aiPlan, setAiPlan] = useState<AIPlanResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  
  // Custom loader messages mapping to strategic corporate milestones
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const loadingMessages = [
    "Acessando base de transações e DRE retrospectivo...",
    "Pesquisando cenário brasileiro macroeconômico e juros para 2026...",
    "Executando algoritmos preditivos de elasticidade de markup no segmento...",
    "Calculando ponto de equilíbrio cumulativo e runway em 1, 5, e 10 anos...",
    "Mentora Dafne refinando marcos estratégicos e preparando diretrizes de expansão..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoadingAI) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoadingAI]);

  // 3. Live financial baselines
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  
  // Annualized values for accurate long term baseline
  const baseIncomeAnnual = totalIncome * 12;
  const baseExpenseAnnual = totalExpense * 12;
  const baseProfitAnnual = baseIncomeAnnual - baseExpenseAnnual;
  const baseMarginAnnual = baseIncomeAnnual > 0 ? (baseProfitAnnual / baseIncomeAnnual) * 100 : 0;

  const hasIncome = totalIncome > 0;

  // 4. Mathematical Model for 10-year Financial Outlook
  const projectionData = Array.from({ length: 11 }, (_, year) => {
    if (year === 0) {
      return {
        year: "Ano Atual",
        yearNum: 0,
        revenue: baseIncomeAnnual || (hasIncome ? 120000 : 0),
        expenses: baseExpenseAnnual || (hasIncome ? 96000 : 0),
        profit: baseProfitAnnual || (hasIncome ? 24000 : 0),
        margin: baseMarginAnnual || (hasIncome ? 20 : 0),
        capex: (baseIncomeAnnual || (hasIncome ? 120000 : 0)) * (capexTarget / 100),
        accumulatedReserve: baseProfitAnnual > 0 ? baseProfitAnnual : (hasIncome ? 10000 : 0)
      };
    }

    // Previous year values
    let prevRev = baseIncomeAnnual || (hasIncome ? 120000 : 0);
    let prevExp = baseExpenseAnnual || (hasIncome ? 96000 : 0);
    let prevAcc = baseProfitAnnual > 0 ? baseProfitAnnual : (hasIncome ? 10000 : 0);

    for (let i = 1; i <= year; i++) {
      // Revenue grows at growthRate per year
      const currentRev = prevRev * (1 + growthRate / 100);
      
      // Expenses are modeled mathematically:
      // - 40% are variable (scale directly with revenue)
      // - 60% are operational fixed expenses (optimized by opexReduction)
      const variablePart = prevExp * 0.4 * (1 + (growthRate * 0.5) / 100);
      const fixedPart = prevExp * 0.6 * (1 - opexReduction / 100);
      
      const currentExp = Math.max(currentRev * 0.35, variablePart + fixedPart); // Cost of operations boundary
      const currentProfit = currentRev - currentExp;
      const currentCapex = currentRev * (capexTarget / 100);
      
      prevAcc += (currentProfit - currentCapex);
      prevRev = currentRev;
      prevExp = currentExp;
    }

    const currentRevenue = prevRev;
    const currentExpenses = prevExp;
    const currentProfit = currentRevenue - currentExpenses;
    const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
    const currentCapex = currentRevenue * (capexTarget / 100);

    return {
      year: `Ano ${year}`,
      yearNum: year,
      revenue: Math.round(currentRevenue),
      expenses: Math.round(currentExpenses),
      profit: Math.round(currentProfit),
      margin: parseFloat(currentMargin.toFixed(1)),
      capex: Math.round(currentCapex),
      accumulatedReserve: Math.round(prevAcc)
    };
  });

  // Extract key target points (1, 5, 10 years) for cards
  const year1Data = projectionData[1];
  const year5Data = projectionData[5];
  const year10Data = projectionData[10];

  // 5. Query AI Dafne 전략/planejamento
  const generateAIPlanning = async () => {
    setIsLoadingAI(true);
    setLoadingStep(0);
    if (!isDemoMode) trackDemoInteraction();

    try {
      const response = await fetch("/api/ai/long-term-planning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          financialData: {
            companyName: profile?.companyName || "Minha Empresa",
            businessSegment: profile?.businessSegment || "other",
            businessNicheDetail: profile?.businessNicheDetail || "",
            income: totalIncome,
            expense: totalExpense,
            balance: totalIncome - totalExpense
          },
          parameters: {
            growthRate,
            opexReduction,
            marginTarget,
            capexTarget
          }
        })
      });

      if (!response.ok) {
        throw new Error("Erro na rota do conselho corporativo");
      }

      const data = await response.json();
      setAiPlan(data);
      showToast("Diretrizes de Longo Prazo traçadas com maestria!", "success");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível conectar à Dafne. Ativando robustez do plano integrado local.", "info");
      // Resilient template fallback
      setAiPlan({
        title: `Estratégia de Expansão & Legado de 10 Anos: ${profile?.companyName || "Minha Empresa"}`,
        intro: `Plano estruturado de forma otimizada para combater a espiral de custos e garantir o crescimento sustentável. Com seu segmento em ${profile?.businessSegment || 'suas frentes operacionais'}, prevemos que uma taxa anualizada de crescimento de ${growthRate}% requer um aumento de automação de retaguarda de forma que seu OPEX fixo sofra contração programada.`,
        year1Milestone: "Sustentação de Margem e Blindagem Tributária",
        year1Directives: [
          "Eliminar imediatamente vazões periféricas em SaaS e plataformas secundárias (estimativa de economia de 8%).",
          "Ajustar margem de contribuição média nos principais 3 produtos ou serviços do portfólio de modo a sustentar Markup acima de 1.8x.",
          "Implantar checklist de ponto de equilíbrio semanal, auditando custos logísticos e taxas rotativas de cartão."
        ],
        year5Milestone: "Maturação Tecnológica, Escala de Praça e Franquia",
        year5Directives: [
          "Criar novos produtos/serviços de alto valor agregado com margem de contribuição bruta de 65%.",
          "Mapear canais digitais automatizados e estruturar funil de vendas previsível com CAC controlado.",
          "Estabelecer a provisão operacional equivalente a 6 meses de suporte operacional PJ intactos."
        ],
        year10Milestone: "Estruturação de Holding Familiar/Patrimonial e Liquidez",
        year10Directives: [
          "Desenvolver governança corporativa profissionalizada para emancipação operacional dos sócios majoritários.",
          "M&A: Consolidar liderança regional adquirindo concorrentes locais fragilizados no fluxo de caixa.",
          "Avaliar oportunidades de atração de aportes de capital externo ou preparativos de valuation de alto nível."
        ],
        marketAnalysis: "Cenário competitivo brasileiro impõe rigidez operacional. Flutuações de juros demandam captação interna e proibição de empréstimos sem margem amortizável.",
        aiDirectives: [
          {
            title: "Automatização de Retaguarda",
            desc: "Usar agentes inteligentes no financeiro e cobrança para esmagar custos comerciais e atritos de atrasos.",
            priority: "ALTA"
          },
          {
            title: "Preço Líquido de Insumos (Controle de CME)",
            desc: "Instituir contratos de fidelidade com distribuidores de CMV com trava de custos contra inflação.",
            priority: "MÉDIA"
          }
        ],
        investmentSimulatorAdvise: "Nunca coloque recursos de alto retorno do faturamento em aplicações longas de baixa liquidez. Suas reservas de Capex de 6% devem ser alocadas em infraestrutura que traga eficiência de mão de obra."
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const copyToClipboard = () => {
    if (!aiPlan) return;
    
    const textToCopy = `
=== ${aiPlan.title} ===
${aiPlan.intro}

PARÂMETROS DE ACELERAÇÃO:
- Crescimento anual: ${growthRate}%
- Redução OPEX anual: ${opexReduction}%
- Margem alvo: ${marginTarget}%
- Investimento Capex: ${capexTarget}%

** ANOS 1: ${aiPlan.year1Milestone} **
${aiPlan.year1Directives.map((d, i) => `${i+1}. ${d}`).join("\n")}

** ANOS 5: ${aiPlan.year5Milestone} **
${aiPlan.year5Directives.map((d, i) => `${i+1}. ${d}`).join("\n")}

** ANOS 10: ${aiPlan.year10Milestone} **
${aiPlan.year10Directives.map((d, i) => `${i+1}. ${d}`).join("\n")}

ANÁLISE DE MERCADO:
${aiPlan.marketAnalysis}

DIRETRIZES DA MENTORA DAFNE:
${aiPlan.aiDirectives.map(d => `- [${d.priority}] ${d.title}: ${d.desc}`).join("\n")}

CONSELHO DE REINVESTIMENTO:
${aiPlan.investmentSimulatorAdvise}
    `;

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    showToast("Planejamento copiado com sucesso para a área de transferência!", "success");
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Header section styled with micro-animations */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-850 to-orange-950 p-8 rounded-[2.5rem] border border-gray-800 shadow-xl text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Calendar size={180} className="text-orange-400 rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Sparkles size={12} className="animate-pulse" />
              PLANEJAMENTO CORPORATIVO DE LONGO PRAZO
            </span>
            <h2 className="text-3xl font-black font-sans tracking-tight">
              Projeção Financeira & Decenal IA
            </h2>
            <p className="text-gray-300 max-w-2xl text-sm leading-relaxed">
              Descubra o futuro da sua empresa. Use os parâmetros de aceleração baseados nos lançamentos reais para simular em tempo real as contas, margens e sobressaltos nos horizontes de 1, 5 e 10 anos.
            </p>
          </div>
          <button
            onClick={generateAIPlanning}
            disabled={isLoadingAI}
            className={cn(
              "relative px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all duration-300 text-white overflow-hidden",
              isLoadingAI 
                ? "bg-gray-800 border border-gray-700 cursor-not-allowed" 
                : "bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-110 border border-orange-400/30 hover:scale-102 cursor-pointer active:scale-98"
            )}
          >
            {isLoadingAI ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <span>Simulando com IA...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-yellow-200" />
                <span>✦ Traçar Diretrizes com Dafne</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main interactive cockpit grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sliders Configuration Column (Left) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] border border-gray-150/80 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sliders size={18} className="text-orange-500" />
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
                Alavancas de Aceleração
              </h3>
            </div>

            {/* Slider 1: Revenue Growth */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-gray-700 flex items-center gap-1">
                  <TrendingUp size={14} className="text-emerald-500" />
                  Crescimento Anual de Receita
                </label>
                <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  +{growthRate}% ao ano
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={growthRate}
                onChange={(e) => {
                  sound.playClick();
                  setGrowthRate(Number(e.target.value));
                }}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
              />
              <p className="text-[10px] text-gray-400">
                Taxa média anualizada que o faturamento bruto crescerá de forma previsível. 
              </p>
            </div>

            {/* Slider 2: OPEX optimization */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-gray-700 flex items-center gap-1">
                  <TrendingDown size={14} className="text-red-500" />
                  Redução Anual de Custos Operacionais
                </label>
                <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  -{opexReduction}% ao ano
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={opexReduction}
                onChange={(e) => {
                  sound.playClick();
                  setOpexReduction(Number(e.target.value));
                }}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
              />
              <p className="text-[10px] text-gray-400">
                Otimização contratual de OPEX e contenção anual de desperdícios redundantes.
              </p>
            </div>

            {/* Slider 3: Target Profit Margin */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-gray-700 flex items-center gap-1">
                  <Target size={14} className="text-teal-500" />
                  Margem Líquida Alvo
                </label>
                <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  {marginTarget}% de margem
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={marginTarget}
                onChange={(e) => {
                  sound.playClick();
                  setMarginTarget(Number(e.target.value));
                }}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
              />
              <p className="text-[10px] text-gray-400">
                A referência de eficiência que a empresa deseja atingir e blindar nas contas.
              </p>
            </div>

            {/* Slider 4: CAPEX / Reinvestment rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-gray-700 flex items-center gap-1">
                  <Activity size={14} className="text-indigo-500" />
                  Investimento CAPEX Anual
                </label>
                <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  {capexTarget}% do faturamento
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={capexTarget}
                onChange={(e) => {
                  sound.playClick();
                  setCapexTarget(Number(e.target.value));
                }}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
              />
              <p className="text-[10px] text-gray-400">
                Porcentagem de faturamento real que será reinvestido em inovação, liderança ou expansão física.
              </p>
            </div>
          </div>

          {/* Current base indicators block */}
          <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/50 space-y-3.5">
            <h4 className="text-xs font-black text-orange-900 uppercase tracking-wider flex items-center gap-1">
              <Info size={14} /> Base de Lançamentos Vigentes
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <p className="text-gray-400 text-[10px]">Faturamento Anual Est.</p>
                <p className="font-bold text-gray-900">{formatCurrency(baseIncomeAnnual)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Resultado Líquido Anual Est.</p>
                <p className={cn("font-bold", baseProfitAnnual >= 0 ? "text-emerald-700" : "text-red-700")}>
                  {formatCurrency(baseProfitAnnual)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Margem Líquida Est.</p>
                <p className="font-bold text-gray-900">{baseMarginAnnual.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">Modelo Simulação</p>
                <p className="font-bold text-orange-700">Decenal Dinâmico</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard charts and tables (Right) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Projections Key milestones cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Year 1 Card */}
            <div className="bg-gradient-to-b from-white to-gray-50/30 p-5 rounded-3xl border border-gray-150/85 relative overflow-hidden flex flex-col justify-between">
              <span className="absolute top-4 right-4 text-xs font-black text-gray-300 font-mono">Ano 1</span>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  Fase de Consolidação
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-gray-900 font-mono">
                    {formatCurrency(year1Data?.revenue || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Faturamento Projetado</p>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between items-center text-xs font-mono">
                <span className="text-gray-400">Margem:</span>
                <span className={cn("font-bold px-1.5 py-0.5 rounded bg-gray-100", year1Data?.margin >= marginTarget ? "text-emerald-700 bg-emerald-50" : "text-orange-700 bg-orange-50")}>
                  {year1Data?.margin}%
                </span>
              </div>
            </div>

            {/* Year 5 Card */}
            <div className="bg-gradient-to-b from-white to-orange-50/10 p-5 rounded-3xl border border-orange-100/50 relative overflow-hidden flex flex-col justify-between">
              <span className="absolute top-4 right-4 text-xs font-black text-orange-300 font-mono">Ano 5</span>
              <div>
                <p className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Fase de Expansão
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-gray-900 font-mono">
                    {formatCurrency(year5Data?.revenue || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Faturamento Projetado</p>
                </div>
              </div>
              <div className="border-t border-orange-100/50 mt-4 pt-3 flex justify-between items-center text-xs font-mono p-1 rounded bg-orange-50/50">
                <span className="text-orange-850">Líquido Anual:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(year5Data?.profit || 0)}
                </span>
              </div>
            </div>

            {/* Year 10 Card */}
            <div className="bg-gradient-to-b from-white to-amber-50/15 p-5 rounded-3xl border border-amber-100/50 relative overflow-hidden flex flex-col justify-between">
              <span className="absolute top-4 right-4 text-xs font-black text-amber-300 font-mono">Ano 10</span>
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Estratégia de Legado
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-gray-900 font-mono">
                    {formatCurrency(year10Data?.revenue || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Faturamento Projetado</p>
                </div>
              </div>
              <div className="border-t border-amber-100/50 mt-4 pt-3 flex justify-between items-center text-xs font-mono p-1 rounded bg-amber-50/50">
                <span className="text-amber-850">Reserva Acumulada:</span>
                <span className="font-bold text-amber-700">
                  {formatCurrency(year10Data?.accumulatedReserve || 0)}
                </span>
              </div>
            </div>

          </div>

          {/* Recharts chart representation */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-150/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
                  Trajetória Decenal de Lucro vs. Gastos
                </h3>
                <p className="text-[11px] text-gray-400">
                  Valores modelados ao consolidar as otimizações de custos contra a taxa de crescimento.
                </p>
              </div>
              <div className="flex gap-4 text-[10px] font-mono">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-orange-500 rounded-full" /> Faturamento</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-400 rounded-full" /> Custos</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Lucro Líquido</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={projectionData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="year" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "monospace" }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    tick={{ fill: "#9ca3af", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), ""]}
                    contentStyle={{ borderRadius: "1rem", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f97316" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#f87171" 
                    strokeWidth={2} 
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* Structured interactive Table details */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-150/80 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="space-y-1">
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
              <Calendar size={18} className="text-orange-500" />
              Matriz Comparativa das Contas Simulação
            </h3>
            <p className="text-[11px] text-gray-400">
              Visualize em detalhes decrescentes os valores anuais modelados de progresso operacional.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-mono">
                <th className="py-3 px-4 font-normal">Período</th>
                <th className="py-3 px-4 font-normal">Faturamento Anual</th>
                <th className="py-3 px-4 font-normal">Drenagem OPEX / Custos</th>
                <th className="py-3 px-4 font-normal">Sobra Líquida</th>
                <th className="py-3 px-4 font-normal">Eficiência Margem %</th>
                <th className="py-3 px-4 font-normal">Reinvestimento CAPEX</th>
                <th className="py-3 px-4 font-normal bg-orange-50/20 text-orange-850">Caixa de Retenção Acum.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-mono">
              {projectionData.map((d, index) => (
                <tr 
                  key={d.year} 
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    index === 0 && "text-gray-400",
                    d.yearNum % 5 === 0 && "bg-gray-50/40 text-gray-900 font-bold"
                  )}
                >
                  <td className="py-3 px-4 font-bold font-sans">
                    {d.year}
                    {index === 0 && " (Base)"}
                  </td>
                  <td className="py-3 px-4 font-bold">{formatCurrency(d.revenue)}</td>
                  <td className="py-3 px-4 text-red-650">{formatCurrency(d.expenses)}</td>
                  <td className={cn("py-3 px-4 font-bold", d.profit >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {formatCurrency(d.profit)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn("px-1.5 py-0.5 rounded font-black", d.margin >= marginTarget ? "text-emerald-700 bg-emerald-50" : "text-orange-700 bg-orange-50")}>
                      {d.margin}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatCurrency(d.capex)}</td>
                  <td className="py-3 px-4 bg-orange-50/10 text-orange-800 font-black">{formatCurrency(d.accumulatedReserve)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading strategic thoughts panel */}
      {isLoadingAI && (
        <div className="bg-slate-50 border border-gray-150 p-8 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 text-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            <Sparkles size={20} className="text-yellow-500 absolute top-3.5 left-3.5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-gray-900">IA MENTORA DAFNE CALCULANDO EXPANSÃO...</h4>
            <p className="text-xs text-orange-600 font-mono animate-pulse">{loadingMessages[loadingStep]}</p>
          </div>
          <div className="w-64 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-full transition-all duration-300" 
              style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Dynamic strategic board from AI Mentor response */}
      {aiPlan && !isLoadingAI && (
        <div className="bg-white rounded-[2.5rem] border border-gray-150/80 shadow-md divide-y divide-gray-100 overflow-hidden">
          
          {/* Internal strategic header banner */}
          <div className="p-8 bg-gradient-to-r from-slate-50 to-orange-50/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full uppercase font-mono tracking-widest border border-orange-200/50">
                ✦ AUDITORIA DE LONGO PRAZO CONCLUÍDA
              </span>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{aiPlan.title}</h3>
              <p className="text-xs text-gray-500">
                Elaborado pela conselheira Dafne com base em sua margem configurada de {marginTarget}%.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button 
                onClick={copyToClipboard}
                className="px-4 py-2.5 bg-white border border-gray-150 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-all outline-none"
              >
                {copiedText ? (
                  <>
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Plano para Anotações</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Intro analysis */}
          <div className="p-8 space-y-6">
            <div className="flex gap-3 items-start bg-amber-50/30 p-4 rounded-2xl border border-amber-100/30 text-xs text-amber-900 leading-relaxed">
              <Activity size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="italic">{aiPlan.intro}</p>
            </div>

            {/* Decenal Steps (1, 5, 10 Years milestones) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Year 1 Guidelines */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">ANO 1 DA OPERAÇÃO</span>
                  <h4 className="text-base font-black text-gray-900 leading-tight">
                    {aiPlan.year1Milestone}
                  </h4>
                </div>
                <ul className="space-y-2.5">
                  {aiPlan.year1Directives.map((d, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-2 items-start leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Year 5 Guidelines */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-orange-600 font-mono bg-orange-50 px-2 py-0.5 rounded border border-orange-200/20">ANO 5 DA OPERAÇÃO</span>
                  <h4 className="text-base font-black text-gray-900 leading-tight">
                    {aiPlan.year5Milestone}
                  </h4>
                </div>
                <ul className="space-y-2.5">
                  {aiPlan.year5Directives.map((d, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-2 items-start leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-orange-50 text-orange-700 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Year 10 Guidelines */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-amber-600 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200/20">ANO 10 DA OPERAÇÃO</span>
                  <h4 className="text-base font-black text-gray-900 leading-tight">
                    {aiPlan.year10Milestone}
                  </h4>
                </div>
                <ul className="space-y-2.5">
                  {aiPlan.year10Directives.map((d, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-2 items-start leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Bottom Market analysis & Reinvestment advise */}
            <div className="border-t border-gray-100 pt-6 mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              <div className="space-y-2 leading-relaxed">
                <h5 className="font-bold text-gray-900 flex items-center gap-1">
                  <Globe size={14} className="text-orange-500" />
                  Brasilian Macro Trends 2026 / 2030
                </h5>
                <p className="text-gray-500">{aiPlan.marketAnalysis}</p>
              </div>
              <div className="space-y-2 leading-relaxed p-4 bg-orange-50/30 rounded-2xl border border-orange-100/30">
                <h5 className="font-bold text-orange-900 flex items-center gap-1">
                  <Award size={14} className="text-orange-600" />
                  Diretrizes de Alocação de CAPEX
                </h5>
                <p className="text-orange-850 italic font-medium">{aiPlan.investmentSimulatorAdvise}</p>
              </div>
            </div>
          </div>

          {/* Priority AI Directives rows */}
          <div className="p-8 bg-slate-50/50 space-y-4">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest font-mono">
              ★ Recomendações Prioritárias de Margem
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiPlan.aiDirectives.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-2xl border border-gray-150/70 flex gap-3 items-start shadow-2xs">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-black font-mono shrink-0 mt-0.5",
                    item.priority === "ALTA" ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50"
                  )}>
                    {item.priority}
                  </span>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-gray-900">{item.title}</p>
                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// Quick Sound mock safety to avoid crashes of audio alerts in the layout
const sound = {
  playClick: () => {
    try {
      const syn = new Audio();
      // Safe noop
    } catch(e) {}
  },
  playSuccess: () => {
    try {
      const syn = new Audio();
      // Safe noop
    } catch(e) {}
  }
};
