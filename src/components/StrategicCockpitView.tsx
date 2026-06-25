import React, { useState, useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Coins,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sliders,
  HelpCircle,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  DollarSign,
  Briefcase,
  Play,
  ArrowRight,
  X,
  Target,
  RefreshCw,
  Award,
  AlertOctagon,
  FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { cn } from "../lib/utils";
import { sound } from "../utils/SoundEngine";

export const StrategicCockpitView: React.FC = () => {
  const {
    transactions,
    bills,
    showToast,
    storeProfiles,
    activeStoreId,
    profile
  } = useFinance();

  // Reset or interactive triggers
  const [activeTab, setActiveTab] = useState<"breakeven" | "guard-angel" | "what-if" | "ncg">("breakeven");

  // 1. BREAKEVEN STATES
  const [customOpexOverride, setCustomOpexOverride] = useState<number | null>(null);
  const [customCmvOverride, setCustomCmvOverride] = useState<number | null>(null);

  // 2. GUARD ANGEL STATES
  const [safetyBuffer, setSafetyBuffer] = useState(10000);
  const [isAntecipacaoSimulated, setIsAntecipacaoSimulated] = useState(false);
  const [isRenegociacaoSimulated, setIsRenegociacaoSimulated] = useState(false);

  // 3. WHAT-IF STATES
  const [scenSalary, setScenSalary] = useState(2500);
  const [scenHires, setScenHires] = useState(2);
  const [scenDiscountPercent, setScenDiscountPercent] = useState(10);
  const [scenPriceHikePercent, setScenPriceHikePercent] = useState(8);

  // 4. NCG STATES
  const [pme, setPme] = useState(45); // Prazo Médio Estocagem
  const [pmr, setPmr] = useState(30); // Prazo Médio Recebimento
  const [pmp, setPmp] = useState(20); // Prazo Médio Pagamento

  // --- COMPUTE ROOT METRICS FROM TRANSACTIONS ---
  const currentMonthMetrics = useMemo(() => {
    // Filter transactions for currently active store context
    const currentTx = transactions.filter(t => {
      if (activeStoreId === "all") return true;
      return t.profileId === activeStoreId || (activeStoreId === "matriz" && (!t.profileId || t.profileId === "matriz"));
    });

    let revenue = 0;
    let cmvCost = 0;
    let opexCost = 0;

    currentTx.forEach(t => {
      const amt = t.amount || 0;
      if (t.type === "income") {
        revenue += amt;
      } else if (t.type === "expense") {
        if (t.isCmvExpense) {
          cmvCost += amt;
        } else {
          opexCost += amt;
        }
      }
    });

    // Fallbacks if no data exists in demo database yet
    if (revenue === 0) revenue = 85000;
    if (cmvCost === 0) cmvCost = 34000; // 40%
    if (opexCost === 0) opexCost = 28000;

    const cmvRate = (cmvCost / revenue) * 100;
    const contributionMarginPercent = 100 - cmvRate;

    return {
      revenue,
      cmvCost,
      opexCost,
      cmvRate,
      contributionMarginPercent
    };
  }, [transactions, activeStoreId]);

  // Handle fine-tuning parameters with overrides
  const selectedOpex = customOpexOverride !== null ? customOpexOverride : currentMonthMetrics.opexCost;
  const selectedCmvRate = customCmvOverride !== null ? customCmvOverride : currentMonthMetrics.cmvRate;
  const selectedContributionMarginPercent = 100 - selectedCmvRate;

  // 1. --- CALCULATING BREAKEVEN DAY ---
  const breakevenResult = useMemo(() => {
    // Ponto de Equilíbrio em Reais
    const breakevenValueInRevenue = selectedOpex / (selectedContributionMarginPercent / 100);
    
    // Day distribution simulation (Days 1 to 30)
    const dailyRevenue = currentMonthMetrics.revenue / 30;
    const dailyContributionMargin = dailyRevenue * (selectedContributionMarginPercent / 100);

    const timeline = [];
    let cumulativeContribution = 0;
    let breakevenDay = -1;

    for (let day = 1; day <= 30; day++) {
      cumulativeContribution += dailyContributionMargin;
      const remains = selectedOpex - cumulativeContribution;
      
      if (cumulativeContribution >= selectedOpex && breakevenDay === -1) {
        breakevenDay = day;
      }

      timeline.push({
        day: `Dia ${day}`,
        "Margem Acumulada": Math.round(cumulativeContribution),
        "Custo Fixo (OPEX)": Math.round(selectedOpex),
        "Meta Breakeven": Math.round(breakevenValueInRevenue)
      });
    }

    // Guessing a fictional current calendar day to show in-app reactive behavior (e.g., June 23rd)
    const mockCurrentDay = 23; 
    const isPastBreakeven = mockCurrentDay >= breakevenDay && breakevenDay !== -1;

    return {
      breakevenValueInRevenue,
      breakevenDay,
      timeline,
      mockCurrentDay,
      isPastBreakeven,
      dailyContributionMargin,
      gapToBreakeven: Math.max(0, selectedOpex - (mockCurrentDay * dailyContributionMargin))
    };
  }, [selectedOpex, selectedContributionMarginPercent, currentMonthMetrics.revenue]);


  // 2. --- CALCULATING THE "ANJO DA GUARDA" CASH OUTLOOK OVER 30 DAYS ---
  const guardAngelResult = useMemo(() => {
    // Let's build a timeline of simulated cash flow for the next 30 days
    const days = 30;
    const initialCash = 18500; // current standard liquid cash
    const timeline = [];
    let rollingCash = initialCash;
    let ruptureDay = -1;
    let fallbackRuptureDaysCount = 12; // Days until negative

    // Fictional accounts payable schedule
    const accountsPayable = Array(31).fill(0);
    accountsPayable[5] = 12000;  // Folha de Pagamento / RH
    accountsPayable[10] = 8000;  // Fornecedor de Matéria-Prima
    accountsPayable[12] = 16000; // Impostos / Aluguel Corporativo (Major liability!)
    accountsPayable[20] = 5000;  // Licenças de Software & Google Ads
    accountsPayable[25] = 4000;  // Custos de Logística

    // Simulated action offsets
    let expectedDailyReceivable = currentMonthMetrics.revenue / 30;
    
    // Adjust receivable if simulated antecipação
    const antecipacaoAmount = isAntecipacaoSimulated ? 19000 : 0;
    
    // Adjust payables if renegotiated
    if (isRenegociacaoSimulated) {
      accountsPayable[12] = 6000;  // Reduced immediately
      accountsPayable[28] = 10000; // Pushed back to end of month
    }

    for (let day = 1; day <= days; day++) {
      let dailyOutflow = accountsPayable[day] || 0;
      let dailyInflow = expectedDailyReceivable;

      // On day 1 (today), inject antecipação if simulated
      if (day === 1) {
        dailyInflow += antecipacaoAmount;
      }

      rollingCash += dailyInflow - dailyOutflow;

      if (rollingCash < safetyBuffer && ruptureDay === -1) {
        ruptureDay = day;
      }

      timeline.push({
        day: `D+${day}`,
        "Saldo Projetado": Math.round(rollingCash),
        "Limite Alerta": safetyBuffer
      });
    }

    const hasRuptureRisk = ruptureDay !== -1;

    return {
      initialCash,
      timeline,
      hasRuptureRisk,
      ruptureDay,
      finalCash: rollingCash
    };
  }, [currentMonthMetrics.revenue, safetyBuffer, isAntecipacaoSimulated, isRenegociacaoSimulated]);


  // 3. --- CALCULATING WHAT-IF SCENARIO IMPACTS ---
  const whatIfCalculations = useMemo(() => {
    // A: RH Hires
    const rhEmployeeCostPercent = 1.42; // Brazilian taxes, benefits, social costs
    const rhAddedMonthlyCost = scenHires * scenSalary * rhEmployeeCostPercent;
    // Additional revenue needed to keep same profit: addedFixedCost / Margin%
    const rhRequiredSalesMultiplier = rhAddedMonthlyCost / (selectedContributionMarginPercent / 100);

    // B: Discount Model
    const currentItemPrice = 120; // Assume fictional average unit price
    // Giving discount reduces unit revenue while unit CMV is fixed
    const currentCmvUnit = currentItemPrice * (selectedCmvRate / 100);
    const discountedItemPrice = currentItemPrice * (1 - scenDiscountPercent / 100);
    const discountContributionMarginAmount = discountedItemPrice - currentCmvUnit;
    const currentContributionMarginAmount = currentItemPrice - currentCmvUnit;
    
    // Percentage increase in sales volume needed to make the exact same contribution money pools
    let discountVolumeIncreasePercent = 0;
    if (discountContributionMarginAmount <= 0) {
      discountVolumeIncreasePercent = 999; // Infinite / Destroys margin completely
    } else {
      discountVolumeIncreasePercent = ((currentContributionMarginAmount / discountContributionMarginAmount) - 1) * 100;
    }

    // C: Price Hike Model
    const hikedItemPrice = currentItemPrice * (1 + scenPriceHikePercent / 100);
    const hikedContributionMarginAmount = hikedItemPrice - currentCmvUnit;
    // Permitted sales loss before starting to lose total contribution money relative to original price
    const priceHikeAllowedVolumeLossPercent = ((hikedContributionMarginAmount - currentContributionMarginAmount) / hikedContributionMarginAmount) * 100;

    return {
      rhAddedMonthlyCost,
      rhRequiredSalesMultiplier,
      discountVolumeIncreasePercent,
      priceHikeAllowedVolumeLossPercent,
      discountContributionMarginAmount
    };
  }, [scenHires, scenSalary, selectedContributionMarginPercent, selectedCmvRate, scenDiscountPercent, scenPriceHikePercent]);


  // 4. --- CALCULATING NCG (CAPITAL DE GIRO) CYCLES & NEEDS ---
  const ncgCalculations = useMemo(() => {
    const economicCycle = pme;
    const operationalCycle = pme + pmr;
    const financialCycle = pme + pmr - pmp; // Prazo médio de caixa

    // daily outflow cost = (CMV + OPEX) / 30
    const dailyOutflows = (currentMonthMetrics.cmvCost + selectedOpex) / 30;
    const capitalNeedAmount = dailyOutflows * financialCycle;

    return {
      economicCycle,
      operationalCycle,
      financialCycle,
      dailyOutflows,
      capitalNeedAmount
    };
  }, [pme, pmr, pmp, currentMonthMetrics.cmvCost, selectedOpex]);


  const handlePresetScenario = (type: string) => {
    sound.playClick();
    if (type === "heavy_rh") {
      setScenSalary(3200);
      setScenHires(3);
      showToast("Carregado preset de contratação corporativa robusta.", "info");
    } else if (type === "aggressive_discount") {
      setScenDiscountPercent(15);
      showToast("Carregado simulação de Mega Saldão Black Friday (-15%).", "warning");
    } else if (type === "premium_reposition") {
      setScenPriceHikePercent(12);
      showToast("Carregado reposicionamento estratégico de preços (+12%).", "success");
    }
  };

  const handleApplyAntecipacao = () => {
    sound.playClick();
    setIsAntecipacaoSimulated(!isAntecipacaoSimulated);
    showToast(
      isAntecipacaoSimulated 
        ? "Simulação de antecipação retirada." 
        : "Simulou antecipação de R$ 19.000 em duplicatas e cartões com taxa de 2.2%!", 
      isAntecipacaoSimulated ? "info" : "success"
    );
  };

  const handleApplyRenegociacao = () => {
    sound.playClick();
    setIsRenegociacaoSimulated(!isRenegociacaoSimulated);
    showToast(
      isRenegociacaoSimulated 
        ? "Simulação de prorrogação desmarcada." 
        : "Simulou postergação do aluguel fiscal e negociação de CMV com fornecedores (+16 dias de fôlego)!", 
      isRenegociacaoSimulated ? "info" : "success"
    );
  };

  // Metas de expansão e limites PJ sincronizados
  const expansionMetrics = useMemo(() => {
    const billingGoalValue = profile?.billingGoal || 60000;
    const currentRevenue = currentMonthMetrics.revenue;
    const revProgressPct = Math.min(100, (currentRevenue / billingGoalValue) * 100);
    const isRevGoalMet = currentRevenue >= billingGoalValue;

    // OPEX limits
    const opexLimitValue = profile?.costLimitOpex || 0;
    const currentOpex = currentMonthMetrics.opexCost;
    const hasOpexLimit = opexLimitValue > 0;
    const opexProgressPct = hasOpexLimit ? Math.min(100, (currentOpex / opexLimitValue) * 100) : 0;
    const isOpexExceeded = hasOpexLimit && currentOpex > opexLimitValue;
    const opexDiff = opexLimitValue - currentOpex;

    // CMV limits
    const cmvLimitValue = profile?.costLimitCmv || 0;
    const currentCmv = currentMonthMetrics.cmvCost;
    const hasCmvLimit = cmvLimitValue > 0;
    const cmvProgressPct = hasCmvLimit ? Math.min(100, (currentCmv / cmvLimitValue) * 100) : 0;
    const isCmvExceeded = hasCmvLimit && currentCmv > cmvLimitValue;
    const cmvDiff = cmvLimitValue - currentCmv;

    return {
      billingGoalValue,
      currentRevenue,
      revProgressPct,
      isRevGoalMet,
      opexLimitValue,
      currentOpex,
      hasOpexLimit,
      opexProgressPct,
      isOpexExceeded,
      opexDiff,
      cmvLimitValue,
      currentCmv,
      hasCmvLimit,
      cmvProgressPct,
      isCmvExceeded,
      cmvDiff,
    };
  }, [profile, currentMonthMetrics]);

  return (
    <div className="bg-[#FAFBFD] p-6 rounded-3xl border border-gray-150/80 shadow-md space-y-6">
      
      {/* HUD SUITE SELECTOR TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150/70 pb-4">
        <div className="text-left">
          <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1">
            <Award size={11} className="animate-bounce" /> Centro de Batalha Econômico
          </span>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
            Cockpit Sênior de Comando e Engenharia de Margem
          </h2>
        </div>

        <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1 rounded-xl scrollbar-none self-start">
          <button
            onClick={() => { sound.playClick(); setActiveTab("breakeven"); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
              activeTab === "breakeven" ? "bg-orange-500 text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
            )}
          >
            🏁 Ponto de Equilíbrio
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab("guard-angel"); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
              activeTab === "guard-angel" ? "bg-orange-500 text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
            )}
          >
            🛡️ Anjo da Guarda
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab("what-if"); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
              activeTab === "what-if" ? "bg-orange-500 text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
            )}
          >
            🧠 Simulador "E se?"
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab("ncg"); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
              activeTab === "ncg" ? "bg-orange-500 text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
            )}
          >
            🔄 Capital de Giro (NCG)
          </button>
        </div>
      </div>

      {/* PAINEL INTEGRADO DAFNE GUARD: METAS PJ E LIMITES */}
      <div id="dafne-guard-limits-cockpit" className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Target size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 font-sans">
                Acompanhamento Sênior de Metas e Limites PJ
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold leading-none mt-0.5 font-sans">
                Vinculado diretamente aos objetivos definidos na aba Meta de Expansão PJ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50/50 px-2.5 py-1 rounded-xl text-[9px] font-mono font-bold text-orange-700 border border-orange-100/30">
            <span>Dafne Guard</span>
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping"></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
          
          {/* Card 1: Meta de Faturamento */}
          <div className="border border-gray-200/80 p-4 rounded-xl flex flex-col justify-between space-y-3 bg-[#FAFBFD]/60 hover:bg-[#FAFBFD] transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Meta de Faturamento</span>
                <p className="text-lg font-black text-slate-850 font-mono">
                  R$ {expansionMetrics.currentRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className={cn(
                "text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md",
                expansionMetrics.isRevGoalMet ? "bg-emerald-50 text-emerald-700 font-sans" : "bg-orange-50 text-orange-700 font-sans"
              )}>
                {expansionMetrics.isRevGoalMet ? "Batida! 🎉" : "Em Progresso"}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                <span>Alvo: R$ {expansionMetrics.billingGoalValue.toLocaleString("pt-BR")}</span>
                <span className="font-mono text-gray-900 font-bold">{expansionMetrics.revProgressPct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/50">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    expansionMetrics.isRevGoalMet ? "bg-emerald-500" : "bg-orange-500"
                  )}
                  style={{ width: `${expansionMetrics.revProgressPct}%` }}
                />
              </div>
            </div>
            
            <p className="text-[9.5px] text-gray-500 font-semibold leading-snug">
              {expansionMetrics.isRevGoalMet 
                ? "🚀 Espetacular! A meta de expansão comercial foi atingida ou superada para o mês atual." 
                : `Faltam R$ ${(expansionMetrics.billingGoalValue - expansionMetrics.currentRevenue).toLocaleString("pt-BR")} de receita para consolidação da meta.`
              }
            </p>
          </div>

          {/* Card 2: Limite de OPEX */}
          <div className="border border-gray-200/80 p-4 rounded-xl flex flex-col justify-between space-y-3 bg-[#FAFBFD]/60 hover:bg-[#FAFBFD] transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Despesa OPEX Atual</span>
                <p className="text-lg font-black text-slate-850 font-mono">
                  R$ {expansionMetrics.currentOpex.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className={cn(
                "text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md",
                !expansionMetrics.hasOpexLimit 
                  ? "bg-slate-100 text-slate-500 border border-slate-200 font-sans" 
                  : expansionMetrics.isOpexExceeded 
                    ? "bg-rose-50 text-rose-700 border border-rose-100 animate-pulse font-sans" 
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans"
              )}>
                {!expansionMetrics.hasOpexLimit 
                  ? "Sem limite" 
                  : expansionMetrics.isOpexExceeded 
                    ? "Teto Estourado! ⚠️" 
                    : "Dentro do Teto ✅"
                }
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                <span>Teto: {expansionMetrics.hasOpexLimit ? `R$ ${expansionMetrics.opexLimitValue.toLocaleString("pt-BR")}` : "Não definido"}</span>
                <span className="font-mono text-gray-900 font-bold">
                  {expansionMetrics.hasOpexLimit ? `${expansionMetrics.opexProgressPct.toFixed(1)}%` : "N/A"}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/50">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    expansionMetrics.isOpexExceeded ? "bg-rose-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${expansionMetrics.hasOpexLimit ? expansionMetrics.opexProgressPct : 0}%` }}
                />
              </div>
            </div>

            <p className="text-[9.5px] text-gray-500 font-semibold leading-snug">
              {!expansionMetrics.hasOpexLimit 
                ? "💡 Cadastre um limite de custo operacional na página de 'Meta de Expansão PJ' para ativar esta inteligência fiduciária." 
                : expansionMetrics.isOpexExceeded 
                  ? `🚨 Perigo: Custo operacional ultrapassou o teto em R$ ${Math.abs(expansionMetrics.opexDiff).toLocaleString("pt-BR")}!` 
                  : `Margem de segurança de OPEX restante: R$ ${expansionMetrics.opexDiff.toLocaleString("pt-BR")} no caixa.`
              }
            </p>
          </div>

          {/* Card 3: Limite de CMV */}
          <div className="border border-gray-200/80 p-4 rounded-xl flex flex-col justify-between space-y-3 bg-[#FAFBFD]/60 hover:bg-[#FAFBFD] transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Gasto de CMV Atual</span>
                <p className="text-lg font-black text-slate-850 font-mono">
                  R$ {expansionMetrics.currentCmv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className={cn(
                "text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md",
                !expansionMetrics.hasCmvLimit 
                  ? "bg-slate-100 text-slate-500 border border-slate-200 font-sans" 
                  : expansionMetrics.isCmvExceeded 
                    ? "bg-rose-50 text-rose-700 border border-rose-100 animate-pulse font-sans" 
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans"
              )}>
                {!expansionMetrics.hasCmvLimit 
                  ? "Sem limite" 
                  : expansionMetrics.isCmvExceeded 
                    ? "Teto Estourado! ⚠️" 
                    : "Dentro do Teto ✅"
                }
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                <span>Teto: {expansionMetrics.hasCmvLimit ? `R$ ${expansionMetrics.cmvLimitValue.toLocaleString("pt-BR")}` : "Não definido"}</span>
                <span className="font-mono text-gray-900 font-bold">
                  {expansionMetrics.hasCmvLimit ? `${expansionMetrics.cmvProgressPct.toFixed(1)}%` : "N/A"}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/50">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    expansionMetrics.isCmvExceeded ? "bg-rose-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${expansionMetrics.hasCmvLimit ? expansionMetrics.cmvProgressPct : 0}%` }}
                />
              </div>
            </div>

            <p className="text-[9.5px] text-gray-500 font-semibold leading-snug">
              {!expansionMetrics.hasCmvLimit 
                ? "💡 Configure um teto de custo de mercadorias para acompanhar as frações de insumos e matérias-primas no DRE." 
                : expansionMetrics.isCmvExceeded 
                  ? `🚨 Atenção: CMV excedeu o limite estratégico em R$ ${Math.abs(expansionMetrics.cmvDiff).toLocaleString("pt-BR")}!` 
                  : `Falta consumir R$ ${expansionMetrics.cmvDiff.toLocaleString("pt-BR")} para atingir o limite estipulado.`
              }
            </p>
          </div>

        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- 1.BreakEven Module --- */}
        {activeTab === "breakeven" && (
          <motion.div
            key="v-breakeven"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Interactive Param Tuning */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1.5">
                  <Sliders size={13} /> Tune Seus Custos Estruturais
                </span>
                <p className="text-[10.5px] text-gray-500 leading-relaxed font-medium">
                  Modifique os números de base para recalcular instantaneamente as curvas de margem e o dia de escape de endividamento da empresa.
                </p>

                {/* Overriding OPEX Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-gray-700 uppercase">
                    <span>OPEX Fixo Mensal:</span>
                    <span className="font-mono text-orange-600 font-black">R$ {selectedOpex.toLocaleString("pt-BR")}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="100000"
                    step="1000"
                    value={selectedOpex}
                    onChange={(e) => {
                      sound.playClick();
                      setCustomOpexOverride(parseFloat(e.target.value));
                    }}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[8px] text-gray-400 font-mono font-bold leading-none">
                    <span>R$ 10.000</span>
                    <span>OPEX Atual Real: R$ {currentMonthMetrics.opexCost.toLocaleString("pt-BR")}</span>
                    <span>R$ 100.000</span>
                  </div>
                </div>

                {/* Overriding CMV Slider */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-gray-700 uppercase">
                    <span>Margem CMV (%):</span>
                    <span className="font-mono text-orange-600 font-black">{selectedCmvRate.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="75"
                    step="1"
                    value={selectedCmvRate}
                    onChange={(e) => {
                      sound.playClick();
                      setCustomCmvOverride(parseFloat(e.target.value));
                    }}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[8px] text-gray-400 font-mono font-bold leading-none">
                    <span>CMV Baixo (15%)</span>
                    <span>Margem Contribuição: {selectedContributionMarginPercent.toFixed(1)}%</span>
                    <span>CMV Alto (75%)</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 flex items-start gap-2 text-[10px] text-gray-500 font-medium">
                  <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    A sua <strong className="text-gray-700 font-bold">Margem de Contribuição ({selectedContributionMarginPercent.toFixed(1)}%)</strong> é o que sobra para pagar os custos fixos após deduzir o custo operacional direto da mercadoria (CMV).
                  </div>
                </div>
              </div>

              {/* Right Column: Gamified Calendar and Chart */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-150 space-y-6">
                
                {/* Gamified Congratulations Banner */}
                {breakevenResult.isPastBreakeven ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3 text-emerald-800 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="space-y-1">
                      <strong className="text-xs uppercase font-black tracking-tight block">🏆 Ponto de Equilíbrio Atingido! (Dia {breakevenResult.breakevenDay})</strong>
                      <p className="text-[10.5px] leading-relaxed text-emerald-700 font-medium font-sans">
                        Parabéns! Hoje você atingiu seu Ponto de Equilíbrio operacional. A partir de amanha, cada real que entra no seu caixa já contabiliza livre como <span className="bg-emerald-500/10 px-1 py-0.5 rounded font-bold">Lucro Líquido Real</span>. Mantenha os custos sob rédea curta!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex items-start gap-3 text-orange-900 leading-relaxed font-sans">
                    <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 animate-spin duration-5000">
                      <Zap size={18} />
                    </div>
                    <div className="space-y-1 text-left">
                      <strong className="text-xs uppercase font-black tracking-tight block">Faltam R$ {breakevenResult.gapToBreakeven.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} de margem para o Breakeven</strong>
                      <p className="text-[10.5px] leading-relaxed text-orange-800 font-medium">
                        Sua margem diária acumulada está marchando. Previsão matemática de pagar todas as despesas do mês e entrar na zona de lucratividade livre no dia <span className="font-black bg-orange-500/10 px-1 py-0.5 rounded text-orange-700">Dia {breakevenResult.breakevenDay}</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* VISUAL MONTH PROGRESS TIMELINE */}
                <div className="space-y-2">
                  <span className="text-[9.5px] font-black uppercase text-gray-500 tracking-wider block">Linha de Corrida do Capital de Giro do Mês (1 à 30)</span>
                  <div className="relative w-full h-8 bg-gray-100 rounded-lg flex items-center overflow-hidden border">
                    
                    {/* Fill proportion to breakeven day */}
                    <div 
                      style={{ width: `${(breakevenResult.breakevenDay / 30) * 100}%` }}
                      className="h-full bg-gradient-to-r from-orange-400/30 to-orange-500/50 flex items-center justify-end pr-2 transition-all duration-500 border-r-2 border-orange-500/40"
                    >
                      <span className="text-[8px] font-sans font-black text-orange-950 uppercase opacity-70">Despesa Paga (Até Dia {breakevenResult.breakevenDay})</span>
                    </div>

                    {/* Fictional current day line */}
                    <div 
                      style={{ left: `${(breakevenResult.mockCurrentDay / 30) * 100}%` }}
                      className="absolute top-0 bottom-0 w-1 bg-blue-500 z-10"
                      title="Hoje (Dia 23)"
                    >
                      <span className="absolute -top-1 bg-blue-500 text-white text-[7px] px-1 font-bold rounded -translate-x-1/2 leading-none">Hoje</span>
                    </div>

                    {/* Left space which is pure profit */}
                    <div className="flex-1 h-full bg-emerald-500/20 flex items-center pl-2">
                      <span className="text-[8.5px] font-serif italic text-emerald-800 font-black opacity-80 uppercase leading-none">Zona de Lucro</span>
                    </div>

                  </div>

                  {/* Day grid map representation */}
                  <div className="grid grid-cols-10 gap-1.5 mt-2">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const day = i + 1;
                      const isBreakeven = day === breakevenResult.breakevenDay;
                      const isCurrentDay = day === breakevenResult.mockCurrentDay;
                      const isProfitZone = day >= breakevenResult.breakevenDay && breakevenResult.breakevenDay !== -1;

                      return (
                        <div
                          key={day}
                          className={cn(
                            "aspect-square rounded-md border flex flex-col items-center justify-center p-1 font-mono transition-all",
                            isBreakeven 
                              ? "bg-orange-500 border-orange-600 text-white shadow-md font-extrabold ring-4 ring-orange-500/20 z-10" 
                              : isCurrentDay
                                ? "border-blue-500 bg-blue-50 text-blue-800 font-bold"
                                : isProfitZone
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-gray-50 border-gray-100 text-gray-400"
                          )}
                          title={isBreakeven ? `Dia do Breakeven Fiduciário!` : `Dia ${day}`}
                        >
                          <span className="text-[9px] leading-none">{day}</span>
                          {isBreakeven && <span className="text-[7px] font-sans font-black uppercase mt-0.5 scale-95 origin-center leading-none">P.E</span>}
                          {isCurrentDay && !isBreakeven && <span className="text-[7.5px] font-sans uppercase mt-0.5 text-blue-600 font-bold leading-none">Hoje</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CHART SHOWING PROGRESS CORRELATION */}
                <div className="h-56 mt-4 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={breakevenResult.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" style={{ fontSize: 9, fontFamily: "monospace" }} />
                      <YAxis style={{ fontSize: 9, fontFamily: "monospace" }} />
                      <RechartsTooltip formatter={(val) => `R$ ${val}`} />
                      <Legend wrapperStyle={{ fontSize: 9, marginTop: 5 }} />
                      <Area type="monotone" dataKey="Margem Acumulada" stroke="#f97316" fill="#fed7aa" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="Custo Fixo (OPEX)" stroke="#64748b" strokeDasharray="3 3" fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* --- 2. Anjo da Guarda --- */}
        {activeTab === "guard-angel" && (
          <motion.div
            key="v-guard-angel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left animate-in fade-in"
          >
            <div className="bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/[0.03] rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-white/[0.08] pb-4 mb-6">
                <div>
                  <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[8.5px] font-black uppercase font-mono tracking-widest">
                    Previsor de Fluxo Futuro Inteligente
                  </span>
                  <h3 className="text-base font-black uppercase mt-1 text-white flex items-center gap-1.5">
                    <ShieldCheck size={18} className="text-orange-500" /> Anjo da Guarda: Antirruptura de Caixa PJ
                  </h3>
                  <p className="text-slate-400 text-[11px] leading-relaxed max-w-xl">
                    Varredura avançada e variação preditiva de caixa dos próximos 30 dias para identificar descasamentos de prazo. Antecipe problemas críticos e preserve a saúde cambial.
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.08] text-right">
                    <span className="text-[8px] text-slate-400 block font-black uppercase">Saldo Líquido</span>
                    <strong className="text-xs font-mono text-emerald-400">R$ {guardAngelResult.initialCash.toLocaleString("pt-BR")}</strong>
                  </div>
                  <div className="p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.08] text-right">
                    <span className="text-[8px] text-slate-400 block font-black uppercase">Faturamento Projetado</span>
                    <strong className="text-xs font-mono text-white">R$ {currentMonthMetrics.revenue.toLocaleString("pt-BR")}</strong>
                  </div>
                </div>
              </div>

              {/* RUPTURE CARD LOGIC */}
              {guardAngelResult.hasRuptureRisk && !isAntecipacaoSimulated && !isRenegociacaoSimulated ? (
                <div className="bg-red-950/40 border border-red-500/20 rounded-2xl p-5 mb-6 space-y-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/10 text-red-400 rounded-xl shrink-0">
                      <AlertTriangle size={20} className="animate-bounce" />
                    </div>
                    <div className="text-left font-sans">
                      <strong className="text-xs font-black uppercase tracking-tight text-white block">🚨 ALERTA CRÍTICO: Risco de ruptura de caixa em {guardAngelResult.ruptureDay} dias!</strong>
                      <p className="text-[10.5px] text-red-200/90 leading-relaxed mt-1 font-medium">
                        Dafne detectou que seu caixa líquido consolidado cairá abaixo do limite de segurança aceitável em virtude de vencimento concentrado de fornecedores e impostos federais no dia 12. Seu saldo projetado atingirá <span className="bg-red-500/20 text-white font-bold px-1.5 py-0.5 rounded">R$ -2.500,00</span> caso nada seja alterado.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    
                    {/* Suggestion A */}
                    <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-2">
                      <span className="text-[8.5px] font-black uppercase text-orange-400 tracking-wider">Ação Recomendada 1: Antecipação</span>
                      <p className="text-[10px] text-slate-300">
                        Antecipe R$ 19.000,00 de faturamento de cartões já garantidos da Maquininha X com taxa coordenada de 2.2% para blindar o fluxo.
                      </p>
                      <button
                        onClick={handleApplyAntecipacao}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-black uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        Aplicar Antecipação <ArrowRight size={11} />
                      </button>
                    </div>

                    {/* Suggestion B */}
                    <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-2">
                      <span className="text-[8.5px] font-black uppercase text-orange-400 tracking-wider">Ação Recomendada 2: Prorrogação</span>
                      <p className="text-[10px] text-slate-300">
                        Postergar o aluguel fiscal de impostos DAS e renegociar o vencimento do fornecedor principal Y para mais 16 dias extras sem juros.
                      </p>
                      <button
                        onClick={handleApplyRenegociacao}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        Estender Fornecedores <ArrowRight size={11} />
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 mb-6 flex items-start gap-3 text-emerald-100 font-sans">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                    <ShieldCheck size={20} className="animate-pulse" />
                  </div>
                  <div className="text-left space-y-1">
                    <strong className="text-xs font-black uppercase tracking-tight text-white block">✅ Caixa Equilibrado e Sob Controle Preventivo</strong>
                    <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold">
                      Com as diretivas de correção simuladas aplicadas ({isAntecipacaoSimulated && "Antecipação Ativa"} {isRenegociacaoSimulated && "• Fornecedores Negociados"}), seu caixa operacional consolidado manterá saldo líquido preventivo acima do buffer de segurança para os próximos 30 dias!
                    </p>
                    {(isAntecipacaoSimulated || isRenegociacaoSimulated) && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setIsAntecipacaoSimulated(false);
                          setIsRenegociacaoSimulated(false);
                        }}
                        className="text-[9px] font-mono font-bold text-orange-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <RefreshCw size={10} className="animate-spin duration-10000" /> Resetar simulação do caixa
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TIMELINE OUTLOOK */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center text-[9.5px] font-black uppercase tracking-wider text-slate-400">
                  <span>Andamento do Caixa Diário Projetado (D+1 à D+30)</span>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500"></span> Saldo Projetado</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400"></span> Limite buffer</span>
                  </div>
                </div>

                <div className="h-60 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={guardAngelResult.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" style={{ fontSize: 9, fontFamily: "monospace", fill: "#94a3b8" }} />
                      <YAxis style={{ fontSize: 9, fontFamily: "monospace", fill: "#94a3b8" }} />
                      <RechartsTooltip formatter={(val) => `R$ ${val}`} />
                      <Area type="monotone" dataKey="Saldo Projetado" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="Limite Alerta" stroke="#ef4444" strokeDasharray="3 3" fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* --- 3. Simulador "E se?" --- */}
        {activeTab === "what-if" && (
          <motion.div
            key="v-what-if"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 font-sans">
              
              <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-[9.5px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="text-orange-500 animate-spin" /> Ferramenta de Análises Corporativas
                  </span>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mt-0.5">
                    Laboratório Estratégico de Sensibilidade "What-If"
                  </h3>
                  <p className="text-gray-500 text-[10.5px] leading-relaxed">
                    Compare os impactos financeiros imediatos de contratação de equipe, descontos massivos de preço ou reajustes preventivos de venda.
                  </p>
                </div>

                <div className="flex gap-1.5 self-start">
                  <button
                    onClick={() => handlePresetScenario("heavy_rh")}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[8.5px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Preset: Contratar Comercial
                  </button>
                  <button
                    onClick={() => handlePresetScenario("aggressive_discount")}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[8.5px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Preset: Queima de Estoque (-15%)
                  </button>
                  <button
                    onClick={() => handlePresetScenario("premium_reposition")}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[8.5px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Preset: Reajuste Premium
                  </button>
                </div>
              </div>

              {/* THREE INTERACTIVE SCENARIOS ROWS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Scenario 1: RH Contratação */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200/50 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 border-b pb-2.5 border-gray-200">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">A</span>
                      <div>
                        <strong className="text-[11.5px] uppercase font-black text-slate-800 tracking-tight block">Simular Equipe de RH</strong>
                        <span className="text-[8.5px] text-gray-400 uppercase leading-none font-bold block mt-0.5">Custos sociais embutidos</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-relaxed mt-3">
                      E se eu contratar mais colaboradores comerciais CLT para a expansão operacional das minhas lojas do grupo consolidado?
                    </p>

                    {/* Inputs */}
                    <div className="space-y-3.5 mt-4">
                      {/* Salaries */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-gray-700 uppercase">
                          <span>Salário Base:</span>
                          <span className="font-mono text-orange-600">R$ {scenSalary.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="1500"
                          max="15000"
                          step="500"
                          value={scenSalary}
                          onChange={(e) => { sound.playClick(); setScenSalary(parseFloat(e.target.value)); }}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>

                      {/* Number of hires */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-gray-700 uppercase">
                          <span>Contratados:</span>
                          <span className="font-mono text-orange-600">{scenHires} Funcionários</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          step="1"
                          value={scenHires}
                          onChange={(e) => { sound.playClick(); setScenHires(parseInt(e.target.value)); }}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculations Result */}
                  <div className="p-3 bg-white border rounded-xl space-y-1 text-left mt-3">
                    <div className="text-[8.5px] font-black uppercase text-gray-400">Total acrescido de Gasto Fixo:</div>
                    <strong className="text-sm font-mono text-slate-800">
                      R$ {whatIfCalculations.rhAddedMonthlyCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </strong>
                    <div className="text-[9px] text-slate-500 leading-tight pt-1 border-t mt-1.5 font-medium">
                      🎯 Meta de faturamento incremental para pagar o salário sem prejudicar o lucro: <strong className="text-orange-600">R$ {whatIfCalculations.rhRequiredSalesMultiplier.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/mês</strong>.
                    </div>
                  </div>
                </div>

                {/* Scenario 2: Descontos de preços */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200/50 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 border-b pb-2.5 border-gray-200">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">B</span>
                      <div>
                        <strong className="text-[11.5px] uppercase font-black text-slate-800 tracking-tight block">Simular Práticas de Desconto</strong>
                        <span className="text-[8.5px] text-gray-400 uppercase leading-none font-bold block mt-0.5">Erosão de margem CMV</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-relaxed mt-3">
                      E se eu conceder um desconto promocional de venda nos produtos do grupo para aumentar fluxo de saída?
                    </p>

                    {/* Inputs */}
                    <div className="space-y-3.5 mt-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-gray-700 uppercase">
                          <span>Desconto Concedido (%):</span>
                          <span className="font-mono text-red-500 font-extrabold">{scenDiscountPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="35"
                          step="1"
                          value={scenDiscountPercent}
                          onChange={(e) => { sound.playClick(); setScenDiscountPercent(parseFloat(e.target.value)); }}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculations Result */}
                  <div className="p-3 bg-white border rounded-xl space-y-1 text-left mt-3">
                    <div className="text-[8.5px] font-black uppercase text-gray-400">Risco de Margem Unitária:</div>
                    <strong className={cn(
                      "text-sm font-mono block",
                      whatIfCalculations.discountContributionMarginAmount > 0 ? "text-slate-800" : "text-rose-600"
                    )}>
                      {whatIfCalculations.discountContributionMarginAmount > 0 
                        ? `Ainda positivo (Margem R$ ${whatIfCalculations.discountContributionMarginAmount.toFixed(1)})` 
                        : "Gera CMV deficitário! Margem negativa!"}
                    </strong>
                    <div className="text-[9px] text-slate-500 leading-tight pt-1 border-t mt-1.5 font-medium">
                      🚀 Volume físico de vendas precisará subir <strong className="text-red-500 font-black">{whatIfCalculations.discountVolumeIncreasePercent.toFixed(1)}%</strong> no mês apenas para faturar o mesmo montante absoluto anterior!
                    </div>
                  </div>
                </div>

                {/* Scenario 3: Preço de Venda Prêmium */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200/50 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 border-b pb-2.5 border-gray-200">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">C</span>
                      <div>
                        <strong className="text-[11.5px] uppercase font-black text-slate-800 tracking-tight block">Simular Aumento de Preço</strong>
                        <span className="text-[8.5px] text-gray-400 uppercase leading-none font-bold block mt-0.5">Elasticidade de Demanda</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-relaxed mt-3">
                      E se eu reajustar o preço geral de venda das minhas lojas em prol de cobrir taxas de impostos inflacionados?
                    </p>

                    {/* Inputs */}
                    <div className="space-y-3.5 mt-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-gray-700 uppercase">
                          <span>Reajuste Positivo (%):</span>
                          <span className="font-mono text-[#10b981] font-extrabold">+{scenPriceHikePercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={scenPriceHikePercent}
                          onChange={(e) => { sound.playClick(); setScenPriceHikePercent(parseFloat(e.target.value)); }}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculations Result */}
                  <div className="p-3 bg-white border rounded-xl space-y-1 text-left mt-3">
                    <div className="text-[8.5px] font-black uppercase text-gray-400">Eficiência de Reposição Margem:</div>
                    <strong className="text-sm font-mono text-emerald-600">Alavancagem Positiva</strong>
                    <div className="text-[9px] text-slate-500 leading-tight pt-1 border-t mt-1.5 font-medium">
                      💡 Com este aumento de preço, sua operação suporta um Churn (perda) de até <strong className="text-[#10b981] font-black">{whatIfCalculations.priceHikeAllowedVolumeLossPercent.toFixed(1)}%</strong> dos clientes antes do lucro bruto cair!
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* --- 4. Capital de Giro NCG --- */}
        {activeTab === "ncg" && (
          <motion.div
            key="v-ncg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left sliders */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-150 space-y-4 font-sans">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1.5">
                  <Clock size={13} /> Ciclo de Conversion de Caixa
                </span>
                
                <p className="text-[10.5px] text-gray-500 leading-relaxed font-semibold">
                  Ajuste os prazos representativos para desenrolar o ciclo de caixa e entender quantos dias o dinheiro fica imobilizado em estoque.
                </p>

                {/* Inventory slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-gray-700 uppercase">
                    <span>Prazo Estoque (PME):</span>
                    <span className="font-mono text-orange-600 font-black">{pme} dias</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="1"
                    value={pme}
                    onChange={(e) => { sound.playClick(); setPme(parseInt(e.target.value)); }}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-[8px] text-gray-400 font-mono block">Tempo médio que o produto fica parado</span>
                </div>

                {/* Receivables slider */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[10px] font-semibold text-gray-700 uppercase">
                    <span>Prazo Recebimento (PMR):</span>
                    <span className="font-mono text-orange-600 font-black">{pmr} dias</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="120"
                    step="1"
                    value={pmr}
                    onChange={(e) => { sound.playClick(); setPmr(parseInt(e.target.value)); }}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-[8px] text-gray-400 font-mono block">Prazo médio de recebimento de cartões e duplicatas</span>
                </div>

                {/* Payable slider */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[10px] font-semibold text-gray-700 uppercase">
                    <span>Prazo Fornecedor (PMP):</span>
                    <span className="font-mono text-orange-600 font-black">{pmp} dias</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="120"
                    step="1"
                    value={pmp}
                    onChange={(e) => { sound.playClick(); setPmp(parseInt(e.target.value)); }}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-[8px] text-gray-400 font-mono block">Tempo de fôlego que o fornecedor te concede</span>
                </div>
              </div>

              {/* Right explanation of NCG */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-150 space-y-6 text-left">
                
                <h3 className="text-sm font-extrabold uppercase text-gray-800 border-b pb-2 flex items-center gap-1.5">
                  <Briefcase size={16} className="text-orange-500" /> Diagnóstico do Ciclo Operacional & Liquidez (NCG)
                </h3>

                {/* Explanations columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="p-4 bg-gray-50 border rounded-xl">
                    <span className="text-[9px] font-black uppercase text-gray-400 text-left block">1. Economia Interna</span>
                    <strong className="text-lg font-mono text-slate-800 text-left block mt-1">{pme} dias</strong>
                    <p className="text-[9px] text-gray-500 leading-tight mt-1.5 font-medium">Representa o tempo em que o seu dinheiro fica "preso" integralmente na prateleira de estocagem sob risco de obsolescência.</p>
                  </div>

                  <div className="p-4 bg-gray-50 border rounded-xl">
                    <span className="text-[9px] font-black uppercase text-gray-400 text-left block">2. Ciclo Operacional</span>
                    <strong className="text-lg font-mono text-slate-800 text-left block mt-1">{ncgCalculations.operationalCycle} dias</strong>
                    <p className="text-[9px] text-gray-500 leading-tight mt-1.5 font-medium">Prazo total abrangendo desde a primeira compra do insumo corporativo até a efetivação física do cliente final pagar.</p>
                  </div>

                  <div className="p-4 bg-white border border-orange-200 rounded-xl bg-orange-50/20">
                    <span className="text-[9px] font-black uppercase text-orange-600 text-left block">3. GAP de Caixa</span>
                    <strong className="text-lg font-mono text-orange-500 text-left block mt-1">{ncgCalculations.financialCycle} dias</strong>
                    <p className="text-[9px] text-orange-800 leading-tight mt-1.5 font-semibold">Espaço de dias fiduciários sem caixa líquido. É o tamanho de cobertura financeira que você precisa aguentar.</p>
                  </div>

                </div>

                {/* HORIZONTAL CYCLE DIAGRAM CHART BAR */}
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Representação Gráfica Linear do Descompasso Operacional</span>
                  
                  <div className="space-y-4">
                    {/* Bar 1: Operational */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] text-gray-400 uppercase font-mono font-bold leading-none">
                        <span>Prazo Médio de Estoque ({pme} D) + Prazo Médio de Recebimento ({pmr} D)</span>
                        <span>Ciclo de Operação: {ncgCalculations.operationalCycle} dias</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full flex overflow-hidden">
                        <div style={{ width: `${(pme / (pme+pmr)) * 100}%` }} className="bg-orange-400 h-full"></div>
                        <div style={{ width: `${(pmr / (pme+pmr)) * 100}%` }} className="bg-blue-400 h-full"></div>
                      </div>
                    </div>

                    {/* Bar 2: Financial cycle showing Gap explicitly */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] text-orange-700 uppercase font-mono font-bold leading-none">
                        <span>Fornecedores Pagos no Dia {pmp} (PMP)</span>
                        <span>Déficit de Financiamento por {ncgCalculations.financialCycle} dias</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full flex overflow-hidden relative">
                        {/* Supplier payment timeline */}
                        <div style={{ width: `${(pmp / (pme+pmr)) * 100}%` }} className="bg-emerald-400 h-full" title="Financiado por Fornecedor"></div>
                        {/* Gap timeline */}
                        <div style={{ width: `${(ncgCalculations.financialCycle / (pme+pmr)) * 100}%` }} className="bg-orange-500 h-full animate-pulse" title="Necessidade de Capital Próprio"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-2 justify-end text-[8.5px] uppercase font-mono text-gray-500 font-extrabold leading-none">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Estoque (CMV)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Recebimentos</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Prazo com Fornecedores</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Capital Amortizado / Giro Trancado</span>
                  </div>
                </div>

                {/* THE GOLDEN CALCULATOR ADVICE */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 font-sans space-y-2 mt-4 text-left">
                  <div className="flex items-center gap-2 text-orange-400">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">Necessidade Prevista de Reserva de Capital de Giro</span>
                  </div>
                  
                  <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold">
                    Para cobrir os custos diários operacionais (mercadorias e folha fixa administrativa) durante esses <strong className="text-white font-bold">{ncgCalculations.financialCycle} dias</strong> de descasamento sem recorrer a empréstimos bancários nocivos, sua empresa precisa de:
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800">
                    <div>
                      <span className="text-[8.5px] uppercase font-mono text-slate-400 font-bold block">Reserva de Capital Estimada (NCG em Reais)</span>
                      <strong className="text-xl font-mono text-orange-400 block mt-0.5">R$ {ncgCalculations.capitalNeedAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                    </div>

                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9.5px] font-mono text-slate-300">
                      Custo Diário Estimado de Saída: <strong className="text-emerald-400 font-bold">R$ {ncgCalculations.dailyOutflows.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/dia</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
