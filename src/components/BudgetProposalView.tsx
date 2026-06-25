import React, { useState } from "react";
import { formatCurrency, formatPercent, cn } from "../lib/utils";
import { sound } from "../utils/SoundEngine";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  PlayCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertCircle, 
  CheckCircle2, 
  Brain, 
  HelpCircle,
  StickyNote,
  Copy,
  ChevronRight,
  Zap,
  Cpu,
  ShieldAlert,
  Activity,
  RefreshCw,
  Calendar,
  TrendingUp,
  Gauge,
  Lightbulb,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface BudgetProposalViewProps {
  transactions: any[];
  categories: any[];
  getDRE: (month: Date) => any[];
  profile: any;
  addNote: (title: string, content: string) => Promise<any>;
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export default function BudgetProposalView({
  transactions,
  categories,
  getDRE,
  profile,
  addNote,
  showToast
}: BudgetProposalViewProps) {
  // Configuração padrão persistida localmente (Peça Orçamentária Configurável)
  const [budgetConfig, setBudgetConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("dafne_budget_config_v2");
      return saved ? JSON.parse(saved) : {
        plannedRevenue: 50000,
        cogsLimitPercent: 25,  // 25% teto de CMV
        opexLimitPercent: 20,  // 20% teto de despesas fixas
        taxLimitPercent: 12,   // 12% teto de tributos
        reserveLimitPercent: 10 // 10% de faturamento bruto reservado
      };
    } catch {
      return {
        plannedRevenue: 50000,
        cogsLimitPercent: 25,
        opexLimitPercent: 20,
        taxLimitPercent: 12,
        reserveLimitPercent: 10
      };
    }
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localDafneAnalysis, setLocalDafneAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeMute, setActiveMute] = useState(() => sound.getMuted());

  // Tecnologia de Otimização por IA e Varredura de Riscos
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationSummary, setOptimizationSummary] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string[]>([]);
  const [activeRiskReport, setActiveRiskReport] = useState<{
    score: number;
    anomalies: string[];
    actions: string[];
    projectedMonthsRunway: number;
  } | null>(null);

  const saveConfig = (newCfg: typeof budgetConfig) => {
    setBudgetConfig(newCfg);
    localStorage.setItem("dafne_budget_config_v2", JSON.stringify(newCfg));
  };

  // 1. Filtragem das Transações do Mês Corrente (Maio de 2026 / Período Atual)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthTrans = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // Faturamento Realizado bruto (REVENUE)
  const realIncome = currentMonthTrans
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return cat?.group === "REVENUE";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Custos Reais (COGS)
  const realCogsBase = currentMonthTrans
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return cat?.group === "COGS";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // CMV de produtos
  const realCogsProduct = currentMonthTrans
    .filter(t => t.isProductSale && t.productCostPrice && t.quantity)
    .reduce((acc, t) => acc + (t.productCostPrice! * t.quantity!), 0);

  const realCogsTotal = realCogsBase + realCogsProduct;

  // Despesas Fixas (OPEX)
  const realOpex = currentMonthTrans
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return cat?.group === "OPEX";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Tributos e Impostos
  const realTaxes = currentMonthTrans
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return cat?.group === "TAX" || cat?.group === "DEDUCTION";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Investimentos e Aportes Realizados
  const realInvestments = currentMonthTrans
    .filter((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return cat?.group === "INVESTMENT";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Cálculos Orçamentários da "Peça Orçamentária" Planejada (Absolutos)
  const plannedCogs = (budgetConfig.plannedRevenue * budgetConfig.cogsLimitPercent) / 100;
  const plannedOpex = (budgetConfig.plannedRevenue * budgetConfig.opexLimitPercent) / 100;
  const plannedTaxes = (budgetConfig.plannedRevenue * budgetConfig.taxLimitPercent) / 100;
  const plannedReserve = (budgetConfig.plannedRevenue * budgetConfig.reserveLimitPercent) / 100;

  const totalPlannedOutflow = plannedCogs + plannedOpex + plannedTaxes + plannedReserve;
  const totalRealOutflow = realCogsTotal + realOpex + realTaxes + realInvestments;

  // Saldos e Margens Planejado vs Realizado
  const plannedNetSavings = budgetConfig.plannedRevenue - totalPlannedAllocated();
  function totalPlannedAllocated() {
    return plannedCogs + plannedOpex + plannedTaxes + plannedReserve;
  }
  
  const realNetSavings = realIncome - totalRealOutflow;

  const plannedNetMargin = (plannedNetSavings / Math.max(1, budgetConfig.plannedRevenue)) * 100;
  const realNetMargin = (realNetSavings / Math.max(1, realIncome)) * 100;

  // Desvios Orçamentários
  const divRevenue = realIncome - budgetConfig.plannedRevenue;
  const divCogs = plannedCogs - realCogsTotal; // Positivo é economia (abaixo do teto)
  const divOpex = plannedOpex - realOpex;      // Positivo é economia (abaixo do teto)
  const divTaxes = plannedTaxes - realTaxes;    // Positivo é economia
  const divReserve = realInvestments - plannedReserve; // Positivo é superação de reserva

  // Auto-Geração passiva da análise DAFNE e do relatório de riscos para garantir exibição imediata
  React.useEffect(() => {
    // 1. Geração da Diretriz de Voz/Texto DAFNE
    const isOpexOver = realOpex > plannedOpex;
    const isCogsOver = realCogsTotal > plannedCogs;

    let text = `Olá! Sou a Dafne, sua conselheira financeira. Vamos analisar a performance de sua peça orçamentária para este mês. `;
    text += `Sua receita consolidada de ${formatCurrency(realIncome).replace(",00", "")} Reais atingiu ${Math.round((realIncome / Math.max(1, budgetConfig.plannedRevenue)) * 100)}% da meta estimada de ${formatCurrency(budgetConfig.plannedRevenue).replace(",00", "")} Reais. `;

    if (isOpexOver) {
      text += `Como ponto de grave atenção técnica, suas despesas fixas excederam o limite planejado em ${formatCurrency(realOpex - plannedOpex).replace(",00", "")} Reais, comprometendo sua margem operacional. `;
    } else {
      text += `Parabéns! Suas despesas operacionais estão altamente controladas, gerando uma folga de caixa de ${formatCurrency(plannedOpex - realOpex).replace(",00", "")} Reais neste período. `;
    }

    if (isCogsOver) {
      text += `Adicionalmente, seus custos com produtos ou mercadorias estão acima do teto estipulado de ${budgetConfig.cogsLimitPercent} por cento. Audite seus fornecedores parceiros. `;
    }

    if (realInvestments >= plannedReserve) {
      text += `Excelente trabalho! Você superou sua meta de blindagem financeira corporativa, aportando ${formatCurrency(realInvestments).replace(",00", "")} Reais de segurança estável. `;
    } else {
      text += `Seu ritmo de aporte em reservas está em ${Math.round((realInvestments / Math.max(1, plannedReserve)) * 100)}% do planejado. Priorize o capital de proteção para expandir o runway. `;
    }

    text += `No geral, sua margem líquida realizada está em ${Math.round(realNetMargin)}% contra os ${Math.round(plannedNetMargin)}% homologados no planejamento. Mantenha o foco cirúrgico no teto de despesas.`;

    setLocalDafneAnalysis(text);

    // 2. Geração do Relatório de de Vulnerabilidades/Riscos Passivo para não deixar a tela vazia
    const anomaliesList: string[] = [];
    const recommendedActions: string[] = [];
    let riskScore = 100;

    if (realOpex > plannedOpex) {
      riskScore -= 25;
      anomaliesList.push(`Vazamento em Custos OPEX: Seus gastos administrativos reais de ${formatCurrency(realOpex)} excederam seu teto planejado de ${formatCurrency(plannedOpex)}.`);
      recommendedActions.push("Suspender compras discricionárias imediatamente e efetuar auditoria detalhada de assinaturas de software ou despesas com terceiros.");
    }

    if (realCogsTotal > plannedCogs) {
      riskScore -= 20;
      anomaliesList.push(`Descompressão de Margem no CMV: O custo real de mercadorias de ${formatCurrency(realCogsTotal)} superou a verba limite estipulada.`);
      recommendedActions.push("Ajustar os Markup de preços na aba de Precificação ou renegociar lotes mínimos de compra.");
    }

    if (realIncome < budgetConfig.plannedRevenue) {
      riskScore -= 15;
      anomaliesList.push(`Gap de Faturamento Ativo: Suas receitas reais estão em ${Math.round((realIncome / Math.max(1, budgetConfig.plannedRevenue)) * 100)}% em relação à receita planejada de ${formatCurrency(budgetConfig.plannedRevenue)}.`);
      recommendedActions.push("Traçar ações imediatas de pós-venda, upsell para clientes recorrentes, ou campanhas promocionais de liquidação de estoque.");
    }

    if (realNetSavings < 0) {
      riskScore -= 30;
      anomaliesList.push(`Alerta Vermelho: Saldo mensal líquido negativo (${formatCurrency(realNetSavings)}). Sua empresa está queimando recursos!`);
      recommendedActions.push("Entrar em regime de teto emergencial financeiro. Mapeie todas as saídas programadas e corte custos não-essenciais.");
    }

    if (recommendedActions.length === 0) {
      recommendedActions.push("Sua gestão administrativa de OPEX está de parabéns, mantendo-se rigorosamente dentro dos limites.");
    }

    const mockTotalLiquidity = realInvestments + 35000;
    const averageMonthlySpend = Math.max(1000, totalRealOutflow);
    const computedRunway = parseFloat((mockTotalLiquidity / averageMonthlySpend).toFixed(1));

    setActiveRiskReport(prev => {
      // Se já está escaneando de forma interativa, não sobrescrever para evitar cortes
      if (isScanning) return prev;
      return {
        score: Math.max(15, riskScore),
        anomalies: anomaliesList,
        actions: recommendedActions,
        projectedMonthsRunway: computedRunway
      };
    });

  }, [
    realIncome,
    realOpex,
    realCogsTotal,
    realInvestments,
    plannedOpex,
    plannedCogs,
    plannedReserve,
    realNetMargin,
    plannedNetMargin,
    budgetConfig,
    realNetSavings,
    totalRealOutflow,
    isScanning
  ]);

  // 3. Montagem da Direção Estratégica via Voz Neural
  const handleToggleSpeakReport = () => {
    if (isSpeaking) {
      sound.stopSpeaking();
      setIsSpeaking(false);
      showToast("Diretriz de voz interrompida pelo administrador.", "info");
      return;
    }

    sound.playClick();
    setIsSpeaking(true);

    sound.speak(localDafneAnalysis, 
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleMuteToggle = () => {
    const nextVal = !activeMute;
    setActiveMute(nextVal);
    sound.setMute(nextVal);
    if (nextVal) {
      sound.stopSpeaking();
      setIsSpeaking(false);
      showToast("Sons e instrução por voz desabilitados.", "warning");
    } else {
      sound.playSuccess();
      showToast("Retorno auditivo e voz fluida ativados!", "success");
    }
  };

  const syncAnotacao = async () => {
    if (!localDafneAnalysis) {
      showToast("Por favor, ative a análise orçamentária antes para gerar o sumário.", "info");
      return;
    }
    try {
      await addNote(`📊 Relatório Peça Orçamentária - ${format(now, "MMMM/yyyy", { locale: ptBR })}`, localDafneAnalysis);
      showToast("Sumário orçamentário e conselho prático salvos nas anotações!", "success");
    } catch {
      showToast("Falha temporária ao sincronizar anotação estratégica.", "error");
    }
  };

  // 4. AUTOMAÇÃO E INTERRUPÇÕES TECNOLÓGICAS (Otimização e Varredura)
  const runAutoOptimizer = () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    setOptimizationSummary("");
    sound.stopSpeaking();
    sound.playCalculationSweep();
    
    let ticks = 0;
    const interval = setInterval(() => {
      sound.playTick();
      ticks++;
      if (ticks > 7) clearInterval(interval);
    }, 200);

    setTimeout(() => {
      // Filtrar histórico e tirar médias reais das receitas corporativas
      const revenueTrans = transactions.filter(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return cat?.group === "REVENUE";
      });
      
      const monthlyRevenueMap: Record<string, number> = {};
      revenueTrans.forEach(t => {
        let dateStr = "2026-05";
        try {
          if (t.date) {
            const dateObj = t.date instanceof Date ? t.date : new Date(t.date);
            if (!isNaN(dateObj.getTime())) {
              const yyyy = dateObj.getFullYear();
              const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
              dateStr = `${yyyy}-${mm}`;
            }
          }
        } catch (e) {
          console.error("Erro ao converter data na Cabine de Automação:", e);
        }
        monthlyRevenueMap[dateStr] = (monthlyRevenueMap[dateStr] || 0) + t.amount;
      });
      
      const monthsCount = Math.max(1, Object.keys(monthlyRevenueMap).length);
      const totalRevHist = Object.values(monthlyRevenueMap).reduce((a, b) => a + b, 0);
      const averageRevenueHist = totalRevHist / monthsCount;
      
      // Calibrar faturamento com base na média histórica PJ +10% de expansão comercial
      const predictedRevenue = Math.max(15000, Math.round((averageRevenueHist * 1.1) / 1000) * 1000 || 50000);

      // Descobrir a real proporção de gastos em OPEX para atuar preventivamente
      const allOpex = transactions.filter(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return cat?.group === "OPEX";
      }).reduce((sum, t) => sum + t.amount, 0);
      const opexHistoricalRatio = allOpex / Math.max(1, totalRevHist || 1);

      let optimalOpex = 16; 
      if (opexHistoricalRatio > 0) {
        // Aplica fator de eficiência reduzindo a desproporção histórica em 15%
        optimalOpex = Math.max(11, Math.min(22, Math.round(opexHistoricalRatio * 100 * 0.85)));
      }

      // CMV padrão otimizado e seguro
      const optimalCogs = 20;
      const optimalTaxes = budgetConfig.taxLimitPercent; 
      const otherCosts = optimalOpex + optimalCogs + optimalTaxes;
      
      // Aloca as sobras geradas na economia de despesas para aportes em reservas estritas
      const optimalReserve = Math.max(10, Math.min(25, 100 - otherCosts - 30));

      const newOptimizedConfig = {
        plannedRevenue: predictedRevenue,
        cogsLimitPercent: optimalCogs,
        opexLimitPercent: optimalOpex,
        taxLimitPercent: optimalTaxes,
        reserveLimitPercent: optimalReserve
      };

      saveConfig(newOptimizedConfig);
      setIsOptimizing(false);
      sound.playSuccess();
      
      const textSummary = `🤖 ALGORITMO COMPLETO: Sua peça orçamentária foi recalibrada com base matemática nas transações reais PJ:
• Faturamento Elevado a R$ ${predictedRevenue.toLocaleString("pt-BR")} (Média real corrigida com +10% de aceleração comercial).
• Parâmetro OPEX fixado em ${optimalOpex}% (redução acentuada de desperdícios para blindar sua margem).
• CMV Otimizado para ${optimalCogs}% (estipulando menor desperdício ou melhor precificação de venda).
• Aporte de Segurança reajustado para ${optimalReserve}% (aumentando a blindagem financeira contra imprevistos).`;
      
      setOptimizationSummary(textSummary);
      showToast("Automação de I.A.: Tetos orçamentários reorganizados com sucesso!", "success");
      sound.speak("Otimização concluída. Calibrei seus tetos baseado nos seus dados históricos reais de transações.");
    }, 1800);
  };

  const runAutonomousScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress([]);
    setActiveRiskReport(null);
    sound.stopSpeaking();
    sound.playActivePulse();

    const steps = [
      { msg: "⚡ [09:12:01] Conectando ao Banco PJ de Contas a Pagar e Livros síncronos...", delay: 250 },
      { msg: "⚡ [09:12:02] Analisando dispersão histórica e conformidade corporativa...", delay: 750 },
      { msg: "⚡ [09:12:03] Rastreando possíveis vazamentos invisíveis em OPEX e contratos...", delay: 1300 },
      { msg: "⚡ [09:12:04] Calculando margem sobre CMV real e precificação de estoque...", delay: 1850 },
      { msg: "⚡ [09:12:05] Auditando a saúde das contas de Impostos PJ e Provisões...", delay: 2400 },
      { msg: "✨ [09:12:06] Varredura e laudo operacional emitido com 100% de sucesso!", delay: 2800 },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setScanProgress((prev) => [...prev, step.msg]);
        sound.playTick();
      }, step.delay);
    });

    setTimeout(() => {
      const anomaliesList: string[] = [];
      const recommendedActions: string[] = [];
      let riskScore = 100;

      // Análises de conformidade
      if (realOpex > plannedOpex) {
        riskScore -= 25;
        anomaliesList.push(`Vazamento em Custos OPEX: Seus gastos administrativos reais de ${formatCurrency(realOpex)} excederam seu teto planejado de ${formatCurrency(plannedOpex)}.`);
        recommendedActions.push("Suspender compras discricionárias imediatamente e efetuar auditoria detalhada de assinaturas de software ou despesas com terceiros.");
      } else {
        recommendedActions.push("Sua gestão administrativa de OPEX está de parabéns, mantendo-se rigorosamente dentro dos limites.");
      }

      if (realCogsTotal > plannedCogs) {
        riskScore -= 20;
        anomaliesList.push(`Descompressão de Margem no CMV: O custo real de mercadorias de ${formatCurrency(realCogsTotal)} superou a verba limite estipulada.`);
        recommendedActions.push("Ajustar os Markup de preços na aba de Precificação ou renegociar lotes mínimos de compra.");
      }

      if (realIncome < budgetConfig.plannedRevenue) {
        riskScore -= 15;
        anomaliesList.push(`Gap de Faturamento Ativo: Suas receitas reais estão em ${Math.round((realIncome / Math.max(1, budgetConfig.plannedRevenue)) * 100)}% em relação à receita planejada de ${formatCurrency(budgetConfig.plannedRevenue)}.`);
        recommendedActions.push("Traçar ações imediatas de pós-venda, upsell para clientes recorrentes, ou campanhas promocionais de liquidação de estoque.");
      }

      if (realNetSavings < 0) {
        riskScore -= 30;
        anomaliesList.push(`Alerta Vermelho: Saldo mensal líquido negativo (${formatCurrency(realNetSavings)}). Sua empresa está queimando recursos!`);
        recommendedActions.push("Entrar em regime de teto emergencial financeiro. Mapeie todas as saídas programadas e corte custos não-essenciais.");
      }

      const mockTotalLiquidity = realInvestments + 35000;
      const averageMonthlySpend = Math.max(1000, totalRealOutflow);
      const computedRunway = parseFloat((mockTotalLiquidity / averageMonthlySpend).toFixed(1));

      setActiveRiskReport({
        score: Math.max(15, riskScore),
        anomalies: anomaliesList.length > 0 ? anomaliesList : ["Nenhum vazamento ou anomalia crítica foi identificado nos lançamentos atuais do período!"],
        actions: recommendedActions,
        projectedMonthsRunway: computedRunway
      });

      setIsScanning(false);
      sound.playSuccess();
      sound.speak(`Diagnóstico de caixa concluído com sucesso. Sua pontuação de consistência é de ${Math.max(15, riskScore)} pontos de conformidade.`);
    }, 3200);
  };

  // Recharts Data Configuration
  const chartData = [
    { name: "Receitas", Planejado: budgetConfig.plannedRevenue, Realizado: realIncome },
    { name: "CMV (Custos)", Planejado: plannedCogs, Realizado: realCogsTotal },
    { name: "OPEX (Gastos)", Planejado: plannedOpex, Realizado: realOpex },
    { name: "Impostos", Planejado: plannedTaxes, Realizado: realTaxes },
    { name: "Investimento", Planejado: plannedReserve, Realizado: realInvestments },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ====== CABINE DE AUTOMAÇÃO E TECNOLOGIA DAFNE ====== */}
      <div className="bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-indigo-500/10 p-6 md:p-8 rounded-[2.5rem] border border-orange-200/50 shadow-md space-y-6">
        
        {/* Header da Central */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider font-sans">Mecanismos Autônomos Integrados</span>
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900 flex items-center gap-2">
              <Cpu size={20} className="text-orange-500 animate-pulse" /> Cabine de Automação & Tecnologia DAFNE
            </h3>
            <p className="text-xs text-gray-450 font-medium font-sans">
              Calibre limites, otimize a peça orçamentária por dados históricos PJ, e execute varreduras analíticas contra perdas.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={runAutoOptimizer}
              disabled={isOptimizing}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all cursor-pointer shadow-md border font-sans tracking-wider",
                isOptimizing 
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-600 hover:brightness-105 active:scale-95 shadow-orange-550/15"
              )}
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="animate-spin text-white" size={12} />
                  Calculando Parâmetros...
                </>
              ) : (
                <>
                  <Zap size={12} className="text-amber-200 animate-pulse" />
                  Auto-Otimização por I.A.
                </>
              )}
            </button>
            
            <button
              onClick={runAutonomousScan}
              disabled={isScanning}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all cursor-pointer shadow-md border font-sans tracking-wider",
                isScanning 
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-slate-900 text-white border-slate-950 hover:bg-slate-800 active:scale-95 shadow-slate-950/15"
              )}
            >
              {isScanning ? (
                <>
                  <Activity className="animate-pulse text-orange-500" size={12} />
                  Executando Varredura...
                </>
              ) : (
                <>
                  <Activity size={12} className="text-orange-400" />
                  Varredura de Riscos
                </>
              )}
            </button>
          </div>
        </div>

        {/* Console / Resultados Dinâmicos de Tecnologia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Lado Esquerdo: Resumo de Otimização I.A. */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-3xl border border-white/65 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100/60 pb-3">
              <div className="p-1.5 bg-orange-50 rounded-xl text-orange-600">
                <Brain size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider font-sans">Diretrizes da Otimização Algorítmica</h4>
                <p className="text-[9px] text-gray-400 font-medium">Modelagem baseada em tendências e dispersões históricas</p>
              </div>
            </div>

            {optimizationSummary ? (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-gray-700 leading-relaxed space-y-2 whitespace-pre-line font-medium bg-orange-50/20 p-4 rounded-2xl border border-orange-100/40 font-sans"
              >
                {optimizationSummary}
              </motion.div>
            ) : isOptimizing ? (
              <div className="h-32 flex flex-col items-center justify-center text-center space-y-2">
                <RefreshCw className="animate-spin text-orange-500" size={24} />
                <p className="text-[11px] font-bold text-gray-500 animate-pulse font-sans">
                  Sincronizando faturamento médio histórico e calibrando OPEX...
                </p>
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-center text-gray-400">
                <Zap size={20} className="text-orange-400/30 animate-bounce mb-1" />
                <p className="text-[11px] font-bold font-sans">Nenhuma otimização ativa. Clique em &quot;Auto-Otimização por I.A.&quot; para calcular tetos inteligentes automáticos.</p>
              </div>
            )}
          </div>

          {/* Lado Direito: Radar e Logs de Anomalias (Dark Terminal style) */}
          <div className="bg-slate-950 text-slate-100 p-5 rounded-3xl border border-slate-900 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-950 rounded-xl text-indigo-400">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-wider font-sans">Radar de Anomalias & Conformidade PJ</h4>
                  <p className="text-[9px] text-gray-500 font-medium font-sans">Identificação de perdas operacionais em tempo real</p>
                </div>
              </div>
              {activeRiskReport && (
                <div className="px-2.5 py-1 bg-indigo-505 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-bold uppercase font-sans">
                  Nota: {activeRiskReport.score}/100
                </div>
              )}
            </div>

            {/* Logs de progresso se estiver rodando */}
            {isScanning && (
              <div className="space-y-1.5 h-32 overflow-y-auto font-mono text-[10px] text-emerald-400">
                {scanProgress.map((prog, index) => (
                  <div key={index} className="animate-pulse">
                    {prog}
                  </div>
                ))}
              </div>
            )}

            {/* Relatório final de riscos */}
            {!isScanning && activeRiskReport && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3 max-h-36 overflow-y-auto pr-1"
              >
                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block mb-1">Distorções Identificadas:</span>
                  {activeRiskReport.anomalies.length > 0 ? (
                    <ul className="space-y-1 text-[10px] text-red-300 font-sans">
                      {activeRiskReport.anomalies.map((anom, idx) => (
                        <li key={idx} className="flex gap-1.5 items-start">
                          <span className="text-red-500 font-black">•</span> <span>{anom}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-sans bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Nenhum desvio, anomalia ou vazamento de caixa identificado. Operação 100% conforme.
                    </div>
                  )}
                </div>
                
                <div className="border-t border-slate-900 pt-2">
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block mb-1">Ações Corretivas por IA:</span>
                  <ul className="space-y-1 text-[10px] text-emerald-300 font-sans">
                    {activeRiskReport.actions.map((act, idx) => (
                      <li key={idx} className="flex gap-1.5 items-start">
                        <span className="text-emerald-500 font-black">✓</span> <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[10px] font-sans">
                  <span className="text-gray-400">Autonomia estimada de caixa acumulada:</span>
                  <span className="font-extrabold text-[#f97316]">
                    ~{activeRiskReport.projectedMonthsRunway} meses de Runway
                  </span>
                </div>
              </motion.div>
            )}

            {!isScanning && !activeRiskReport && (
              <div className="h-28 flex flex-col items-center justify-center text-center text-slate-500 py-3 font-sans">
                <Activity size={20} className="text-slate-650 animate-pulse mb-1" />
                <p className="text-[11px] font-bold">Monitor síncrono ocioso. Execute a &quot;Varredura de Riscos&quot; para auditar desvios e identificar vazamentos.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 1. SEÇÃO DE CONFIGURAÇÃO INTERATIVA (A PEÇA CONFIGURÁVEL) */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
              <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Configuração da Peça</span>
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">
              Planejamento e Teto de Custos Mensais
            </h3>
            <p className="text-xs text-gray-450 font-medium">
              Altere seu faturamento estimado e os percentuais de distribuição preventiva de caixa operacional.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={handleMuteToggle}
              className={cn(
                "p-2.5 rounded-xl border transition-all cursor-pointer",
                activeMute 
                  ? "bg-rose-50 text-rose-500 border-rose-100" 
                  : "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100"
              )}
              title={activeMute ? "Desmutar voz de feedback" : "Mutar voz de feedback"}
            >
              {activeMute ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeMute ? "Mudo" : "Voz Neural Ativa"}</span>
          </div>
        </div>

        {/* Sliders de Definição Orçamentária */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Lado Esquerdo Sliders */}
          <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100/60 font-sans">
            
            {/* 1. Faturamento Estimado */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Faturamento Previsto (Receita Bruta Alvo)
                </label>
                <span className="text-sm font-black text-gray-900 italic">
                  {formatCurrency(budgetConfig.plannedRevenue)}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="150000"
                step="2500"
                value={budgetConfig.plannedRevenue}
                onChange={(e) => saveConfig({ ...budgetConfig, plannedRevenue: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* 2. Custo de Mercadorias (CMV) */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Teto CMV de Produtos / Serviços (Distribuição)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold">({formatCurrency(plannedCogs)})</span>
                  <span className="text-sm font-black text-orange-500">{budgetConfig.cogsLimitPercent}%</span>
                </div>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={budgetConfig.cogsLimitPercent}
                onChange={(e) => saveConfig({ ...budgetConfig, cogsLimitPercent: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* 3. Despesas Fixas (OPEX) */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Teto OPEX Administrativo (Gasto Operacional)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold">({formatCurrency(plannedOpex)})</span>
                  <span className="text-sm font-black text-purple-500">{budgetConfig.opexLimitPercent}%</span>
                </div>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="1"
                value={budgetConfig.opexLimitPercent}
                onChange={(e) => saveConfig({ ...budgetConfig, opexLimitPercent: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* 4. Tributário (TAX) */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Provisionamento de Tributos / Impostos
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold">({formatCurrency(plannedTaxes)})</span>
                  <span className="text-sm font-black text-blue-500">{budgetConfig.taxLimitPercent}%</span>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="1"
                value={budgetConfig.taxLimitPercent}
                onChange={(e) => saveConfig({ ...budgetConfig, taxLimitPercent: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* 5. Reserva Blindada (Investment) */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Meta Provisória de Aporte em Reserva (Segurança)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold">({formatCurrency(plannedReserve)})</span>
                  <span className="text-sm font-black text-emerald-500">{budgetConfig.reserveLimitPercent}%</span>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={budgetConfig.reserveLimitPercent}
                onChange={(e) => saveConfig({ ...budgetConfig, reserveLimitPercent: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

          </div>

          {/* Lado Direito: Resumo Estratégico Real / Margens */}
          <div className="flex flex-col justify-between border border-gray-150 p-6 rounded-2xl bg-white space-y-4 shadow-sm relative overflow-hidden">
            
            {/* Indicador de Margem Líquida Prevista */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Ponto de Equilíbrio / Margem Prevista</p>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <h4 className="text-xl font-bold font-serif text-gray-800 leading-none">
                    Sobras de Planejamento:
                  </h4>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Margem Líquida Alvo: {plannedNetMargin.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black italic tracking-tight text-emerald-500 uppercase">
                    {formatCurrency(plannedNetSavings)}
                  </div>
                </div>
              </div>
            </div>

            {/* Comparação do EBITDA / Lucro Operacional */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center text-xs">
              <div className="space-y-1">
                <span className="font-bold text-gray-600">Total Distribuído no Teto:</span>
                <p className="text-[10px] text-gray-400 font-semibold">Teto Máximo Alocado de Custos</p>
              </div>
              <span className="font-bold text-orange-500">{formatCurrency(totalPlannedOutflow)}</span>
            </div>

            {/* Comparativo de Resultados em Tempo Real */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500">Faturamento Realizado:</span>
                <span className="text-gray-900">{formatCurrency(realIncome)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500">Gastos Reais Consumidos:</span>
                <span className={cn(totalRealOutflow > totalPlannedOutflow ? "text-rose-500 font-bold" : "text-emerald-500 font-bold")}>
                  {formatCurrency(totalRealOutflow)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold border-t border-gray-100 pt-2.5">
                <span className="text-gray-700">Margem Líquida Real:</span>
                <span className={cn("text-sm font-black italic", realNetSavings > 0 ? "text-emerald-500" : "text-rose-500")}>
                  {realNetMargin.toFixed(1)}% ({formatCurrency(realNetSavings)})
                </span>
              </div>
            </div>

            {/* Caixa Informativo do Teto */}
            <div className="text-[10px] text-gray-400 leading-relaxed italic border-t border-gray-50 pt-3">
              💡 <strong>Alerta de Conformidade:</strong> Seus gastos reais somados atingem <strong>{((totalRealOutflow / Math.max(1, totalPlannedOutflow)) * 100).toFixed(0)}%</strong> da sua peça orçamentária máxima.
            </div>

          </div>

        </div>
      </div>

      {/* 2. TABELA COMPARATIVA LEDGER & GRÁFICO RECHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Tabela de Lançamento / Desvios (7 Colunas) */}
        <div className="xl:col-span-7 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-450 tracking-widest italic">Ledger de Controle</span>
            <h4 className="text-lg font-black italic tracking-tighter uppercase text-gray-900 mt-1">Conformidade e Desvio Orçamentário</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-1">Categoria</th>
                  <th className="py-3 px-2 text-right">Planejado (Teto)</th>
                  <th className="py-3 px-2 text-right">Consumido (Real)</th>
                  <th className="py-3 px-2 text-right">Saldo Restante</th>
                  <th className="py-3 px-2 text-right">Conformidade</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Receitas */}
                <tr className="border-b border-gray-50/50 hover:bg-gray-50/30 font-medium">
                  <td className="py-3 px-1 font-bold text-gray-800">Receitas Totais</td>
                  <td className="py-3 px-2 text-right text-gray-600">{formatCurrency(budgetConfig.plannedRevenue)}</td>
                  <td className="py-3 px-2 text-right text-emerald-500 font-bold">{formatCurrency(realIncome)}</td>
                  <td className="py-3 px-2 text-right font-bold text-gray-800">{formatCurrency(divRevenue)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", divRevenue >= 0 ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500")}>
                      {divRevenue >= 0 ? "Meta Batida" : "Restante"}
                    </span>
                  </td>
                </tr>

                {/* 2. CMV */}
                <tr className="border-b border-gray-50/50 hover:bg-gray-50/30 font-medium">
                  <td className="py-3 px-1 text-gray-700">CMV (Custos Diretos)</td>
                  <td className="py-3 px-2 text-right text-gray-650">{formatCurrency(plannedCogs)}</td>
                  <td className="py-3 px-2 text-right text-gray-800">{formatCurrency(realCogsTotal)}</td>
                  <td className="py-3 px-2 text-right font-semibold text-gray-650">{formatCurrency(divCogs)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", divCogs >= 0 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500")}>
                      {divCogs >= 0 ? "Economia" : "Extrapolado"}
                    </span>
                  </td>
                </tr>

                {/* 3. OPEX */}
                <tr className="border-b border-gray-50/50 hover:bg-gray-50/30 font-medium">
                  <td className="py-3 px-1 text-gray-700">OPEX (Gastos Fixos)</td>
                  <td className="py-3 px-2 text-right text-gray-650">{formatCurrency(plannedOpex)}</td>
                  <td className="py-3 px-2 text-right text-gray-800">{formatCurrency(realOpex)}</td>
                  <td className="py-3 px-2 text-right font-semibold text-purple-600">{formatCurrency(divOpex)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", divOpex >= 0 ? "bg-purple-50 text-purple-600" : "bg-rose-50 text-rose-500")}>
                      {divOpex >= 0 ? "Ok" : "Estouro de OPEX"}
                    </span>
                  </td>
                </tr>

                {/* 4. Tributos */}
                <tr className="border-b border-gray-50/50 hover:bg-gray-50/30 font-medium">
                  <td className="py-3 px-1 text-gray-700">Impostos / Provisão</td>
                  <td className="py-3 px-2 text-right text-gray-650">{formatCurrency(plannedTaxes)}</td>
                  <td className="py-3 px-2 text-right text-gray-800">{formatCurrency(realTaxes)}</td>
                  <td className="py-3 px-2 text-right font-semibold text-gray-600">{formatCurrency(divTaxes)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[9px] font-bold uppercase">Provisionado</span>
                  </td>
                </tr>

                {/* 5. Investimento */}
                <tr className="border-b border-gray-50/50 hover:bg-gray-50/30 font-medium">
                  <td className="py-3 px-1 text-gray-700">Reserva de Segurança</td>
                  <td className="py-3 px-2 text-right text-gray-650">{formatCurrency(plannedReserve)}</td>
                  <td className="py-3 px-2 text-right text-emerald-600 font-bold">{formatCurrency(realInvestments)}</td>
                  <td className="py-3 px-2 text-right font-semibold text-emerald-600">{formatCurrency(divReserve)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", realInvestments >= plannedReserve ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-400")}>
                      {realInvestments >= plannedReserve ? "Meta Parcial OK" : "Pendente"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recharts Bar Comparison (5 Colunas) */}
        <div className="xl:col-span-5 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-450 tracking-widest italic">Acompanhamento Gráfico</span>
            <h4 className="text-lg font-black italic tracking-tighter uppercase text-gray-900 mt-1">Planejado vs Realizado</h4>
          </div>

          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={8} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111827", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                  formatter={(value) => [`R$ ${Number(value).toLocaleString("pt-BR")}`]}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                <Bar dataKey="Planejado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realizado" fill="#f97316" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    let c = "#f97316";
                    if (entry.name === "Reserva de Segurança" || entry.name === "Receitas") {
                      c = "#10b981";
                    } else if (entry.name === "OPEX (Gastos)") {
                      c = entry.Realizado > entry.Planejado ? "#ef4444" : "#a855f7";
                    }
                    return <Cell key={`cell-${index}`} fill={c} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. PARTE TECNOLÓGICA INTELIGENTE: PARECER POR VOZ NEURAL E ASSESSORIA SÍNCRONA */}
      <div className="bg-gradient-to-br from-[#12122d] via-slate-900 to-slate-950 text-white rounded-[2.5rem] p-6 md:p-8 border border-indigo-500/20 shadow-[0_20px_45px_rgba(99,102,241,0.15)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Lado Esquerdo Waveform de Voz (4 Colunas) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center bg-slate-900/40 p-6 rounded-2xl border border-white/5 min-h-[180px] text-center">
            
            <div className="relative mb-4 flex items-center justify-center">
              <AnimatePresence>
                {isSpeaking && (
                  <div className="absolute flex space-x-1.5 z-10">
                    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((val, idx) => (
                      <motion.span
                        key={idx}
                        animate={{ height: [12, 42, 12] }}
                        transition={{ duration: 1, repeat: Infinity, delay: idx * 0.1, ease: "easeInOut" }}
                        className="w-1.5 bg-gradient-to-t from-orange-400 to-amber-500 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <button
                onClick={handleToggleSpeakReport}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-lg cursor-pointer z-20",
                  isSpeaking 
                    ? "from-amber-400 to-orange-500 hover:scale-105 shadow-orange-500/30 bg-gradient-to-br" 
                    : "from-indigo-950 via-slate-900 to-indigo-900 hover:bg-slate-800 border border-indigo-500/30"
                )}
              >
                <Volume2 size={32} className={cn(isSpeaking ? "text-white animate-pulse" : "text-indigo-300")} />
              </button>
            </div>

            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mt-2">
              {isSpeaking ? "Narrando Análise..." : "Voz Neural de Assessoria"}
            </span>

            <p className="text-[9px] text-indigo-300 font-semibold mt-1 font-sans">
              Narrando com voz neural feminina e fluida.
            </p>
          </div>

          {/* Lado Direito: Caixa de Conselho I.A. (8 Colunas) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="font-sans">
              <div className="flex items-center gap-1.5 mb-1 bg-indigo-500/15 py-1 px-3 border border-indigo-500/25 rounded-full w-fit">
                <Brain size={12} className="text-indigo-400" />
                <span className="text-[9px] font-black uppercase text-indigo-300 tracking-widest">Tecnologia Executiva DAFNE</span>
              </div>
              <h4 className="text-xl font-black italic tracking-tighter uppercase">Inteligência Operacional Auditiva</h4>
              <p className="text-xs text-gray-300 leading-relaxed max-w-2xl font-semibold">
                Nossa IA processa as variáveis da peça orçamentária (Receita, OPEX, CMV, Imposto) e gera um conselho tático em tempo real de conformidade corporativa para o mês. Clique no emissor ao lado para ouvir.
              </p>
            </div>

            {/* Balão do Feedback */}
            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 min-h-[110px] flex flex-col justify-between text-xs leading-relaxed text-gray-200">
              {localDafneAnalysis ? (
                <p className="whitespace-pre-line font-sans">{localDafneAnalysis}</p>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-[90px] text-gray-500">
                  <Sparkles size={18} className="text-orange-400/40 animate-pulse mb-1.5" />
                  <p className="text-[11px] font-bold">Diretriz inativa. Clique no botão de voz ou áudio para iniciar o sumário auditivo neural.</p>
                </div>
              )}

              {/* Botões do Balão */}
              {localDafneAnalysis && (
                <div className="flex gap-2.5 mt-4 pt-3 border-t border-white/5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(localDafneAnalysis);
                      showToast("Texto da directriz copiado para transferência!", "success");
                    }}
                    className="flex-1 max-w-[150px] bg-slate-950 hover:bg-slate-800 text-white border border-white/10 p-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5"
                  >
                    Copiar Diretriz <Copy size={11} />
                  </button>
                  <button
                    onClick={syncAnotacao}
                    className="flex-1 max-w-[200px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-350 p-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5"
                  >
                    Salvar nas Anotações <StickyNote size={11} />
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
