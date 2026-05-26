import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Target, 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Wand2, 
  ArrowUpRight, 
  Save, 
  Copy, 
  Zap,
  Activity,
  AlertTriangle,
  Lightbulb
} from "lucide-react";

export default function BillingGoalRegistrationView() {
  const {
    profile,
    updateProfile,
    transactions,
    showToast,
    isDemoMode,
    trackDemoInteraction,
    addNote
  } = useFinance();

  // Inputs
  const [averageBilling, setAverageBilling] = useState<number>(0);
  const [billingGoal, setBillingGoal] = useState<number>(0);
  const [billingGoalDeadline, setBillingGoalDeadline] = useState<string>("");
  const [billingNotes, setBillingNotes] = useState<string>("");

  // AI strategy states
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState<string>("");

  // Sync state from profile
  useEffect(() => {
    if (profile) {
      setAverageBilling(profile.averageBilling || 0);
      setBillingGoal(profile.billingGoal || 0);
      setBillingGoalDeadline(profile.billingGoalDeadline || "");
      setBillingNotes(profile.billingNotes || "");
    }
  }, [profile]);

  // Calculate actual revenue for the current month and year
  const currentMonthIncome = React.useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "income" &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  // Calculations
  const hasMeta = billingGoal > 0;
  const growthNeededAmount = billingGoal - averageBilling;
  const growthNeededPct = averageBilling > 0 ? (growthNeededAmount / averageBilling) * 100 : 0;
  const currentProgressPct = billingGoal > 0 ? (currentMonthIncome / billingGoal) * 100 : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      trackDemoInteraction();
    }
    
    try {
      await updateProfile({
        averageBilling,
        billingGoal,
        billingGoalDeadline,
        billingNotes
      });
      showToast("Metas e objetivos de faturamento salvos e integrados com sucesso! ⚡", "success");
    } catch (err) {
      showToast("Erro ao tentar atualizar os dados de faturamento do perfil.", "error");
    }
  };

  const handleCopyPlan = () => {
    navigator.clipboard.writeText(strategicPlan);
    showToast("Plano estratégico copiado para a área de transferência!", "success");
  };

  const handleSavePlanAsNote = async () => {
    if (isDemoMode) {
      trackDemoInteraction();
      return;
    }
    if (!strategicPlan) return;
    try {
      await addNote(
        `📌 Plano de Ação: Meta R$ ${billingGoal.toLocaleString("pt-BR")}`,
        `### DETALHAMENTO DO OBJETIVO DE FATURAMENTO\n\n- Média Inicial: ${formatCurrency(averageBilling)}\n- Objetivo Alvo: ${formatCurrency(billingGoal)}\n- Prazo: ${billingGoalDeadline || "Não especificado"}\n\n### DIRETRIZES TÁTICAS PROPOSTAS PELA DAFNE I.A:\n\n${strategicPlan}`
      );
      showToast("Manual e estratégia salvos com sucesso nas suas anotações!", "success");
    } catch (e) {
      showToast("Erro ao criar nota estratégica.", "error");
    }
  };

  const handleGeneratePlan = async () => {
    if (billingGoal <= 0) {
      showToast("Cadastre um objetivo principal de faturamento maior que zero para gerar o planejamento estratégico.", "warning");
      return;
    }

    setIsGenerating(true);
    setStrategicPlan("");
    showToast("Estruturando diretrizes financeiras personalizadas...", "info");

    try {
      const prompt = `Como Dafne, a estrategista financeira especialista, elabore um plano de ação tático personalizado para eu aumentar meu faturamento atual de R$ ${averageBilling.toLocaleString("pt-BR")} (média inicial registrada) para atingir meu principal OBJETIVO de R$ ${billingGoal.toLocaleString("pt-BR")} ${billingGoalDeadline ? `até o prazo de ${billingGoalDeadline}` : ""}. 
      
      Análise de dados do contexto:
      - O faturamento médio registrado atualmente é: R$ ${averageBilling.toLocaleString("pt-BR")}
      - O faturamento que conquistamos nas vendas registradas deste mês atual é de: R$ ${currentMonthIncome.toLocaleString("pt-BR")}
      - Notas e características do negócio: ${billingNotes || "Não informadas"}

      Utilize toda a sua autoridade e metodologias financeiras. Traga metas semanais, 2 alavancas principais de receita específicas de mercado e 1 dica infalível de otimização de custos para garantir que o aumento de faturamento se transforme em margem líquida real. Seja extremamente cirúrgica, amigável e realista nos cálculos.`;

      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          financialData: {
            averageBilling,
            billingGoal,
            billingGoalDeadline,
            billingNotes,
            income: currentMonthIncome,
            companyName: profile?.companyName || "Minha Empresa"
          }
        })
      });

      if (!response.ok) throw new Error("Erro de comunicação com o servidor de IA.");
      const data = await response.json();
      
      if (data.text) {
        setStrategicPlan(data.text);
        showToast("Seu plano de ação de faturamento foi sintetizado com sucesso!", "success");
      } else {
        throw new Error("Resposta de IA vazia.");
      }
    } catch (err) {
      console.error(err);
      setStrategicPlan(
        `### PLANO TÁTICO MANUAL - METAS DE FATURAMENTO\n\n` +
        `• **Diagnóstico de Meta:** Transicionar o faturamento médio de **${formatCurrency(averageBilling)}** para o objetivo estratégico de **${formatCurrency(billingGoal)}** (Crescimento necessário de **${growthNeededPct.toFixed(1)}%**).\n\n` +
        `• **Alavanca 1: Correção de Preços & Markup:** Revise a margem de contribuição média nos canais para reajustar o preço em 4% a 7% nos itens de alta rotatividade. Isso gera caixa imediato sem perdas de volumes.\n\n` +
        `• **Alavanca 2: Ativação de Canais de Recorrência:** Ofereça descontos progressivos ou benefícios exclusivos para clientes que fecharem planos semanais ou mensais (fidelização de fluxo).\n\n` +
        `• **Ponto de Controle:** Monitore rigorosamente o CMV abaixo de 33% para resguardar a margem EBITDA em busca do break-even.`
      );
      showToast("Plano alternativo gerado com sucesso.", "success");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="billing-goal-tab-view" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Banner */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-150/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.04] blur-3xl rounded-full translate-x-12 -translate-y-12" />
        <div className="space-y-2 relative z-10 text-left">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-650 flex items-center justify-center">
              <Target size={22} className="text-orange-600 font-bold" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#f97316] bg-orange-500/[0.08] px-3 py-1 rounded-full border border-orange-500/10">
              Planejamento Estratégico
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">
            Metas & Alinhamento de Faturamento
          </h1>
          <p className="text-xs text-gray-600 font-medium max-w-xl leading-relaxed">
            Cadastre sua média de faturamento histórico e seu objetivo financeiro central. Toda a assessoria da Dafne I.A. será automaticamente calibrada para focar no atingimento desta meta específica comercial.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10 md:self-end">
          <div className="bg-[#141414] text-white py-3.5 px-5 rounded-2xl border border-gray-800 shadow-md text-right">
            <p className="text-[9px] font-black text-orange-400 uppercase tracking-wider">Objetivo Principal</p>
            <p className="text-base font-black font-mono mt-0.5 text-white">
              {billingGoal > 0 ? formatCurrency(billingGoal) : "R$ 0,00"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Indicators Bento Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Média Registrada */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-150/80 shadow-sm flex flex-col justify-between h-[130px] text-left">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Média Histórica</p>
              <span className="p-1 rounded-lg bg-gray-50 text-gray-400"><DollarSign size={14} /></span>
            </div>
            <p className="text-lg font-black font-mono text-gray-900 mt-2">
              {formatCurrency(averageBilling)}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold leading-none">
            Faturamento recorrente inicial
          </p>
        </div>

        {/* Card 2: Objetivo Alvo */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-150/80 shadow-sm flex flex-col justify-between h-[130px] text-left">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest">Objetivo do Negócio</p>
              <span className="p-1 rounded-lg bg-orange-50 text-orange-500"><Target size={14} /></span>
            </div>
            <p className="text-lg font-black font-mono text-orange-650 mt-2">
              {formatCurrency(billingGoal)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-orange-500 font-bold leading-none">
            <Calendar size={11} />
            <span>Prazo: {billingGoalDeadline || "Indefinido"}</span>
          </div>
        </div>

        {/* Card 3: Gap / Crescimento */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-150/80 shadow-sm flex flex-col justify-between h-[130px] text-left">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Diferença (Gap)</p>
              <span className="p-1 rounded-lg bg-amber-50 text-amber-500"><TrendingUp size={14} /></span>
            </div>
            <p className="text-lg font-black font-mono text-gray-900 mt-2">
              {growthNeededAmount > 0 ? `+ ${formatCurrency(growthNeededAmount)}` : formatCurrency(0)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-extrabold leading-none">
            <ArrowUpRight size={14} />
            <span>Expandir em {growthNeededPct > 0 ? `${growthNeededPct.toFixed(1)}%` : "0%"}</span>
          </div>
        </div>

        {/* Card 4: Faturamento Real do Mês */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-150/80 shadow-sm flex flex-col justify-between h-[130px] text-left relative overflow-hidden">
          {billingGoal > 0 && (
            <div 
              className="absolute left-0 bottom-0 h-1.5 bg-emerald-500 transition-all duration-1000" 
              style={{ width: `${Math.min(currentProgressPct, 100)}%` }}
            />
          )}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest text-left">Vendas deste Mês</p>
              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-500"><Activity size={14} /></span>
            </div>
            <p className="text-lg font-black font-mono text-gray-950 mt-2">
              {formatCurrency(currentMonthIncome)}
            </p>
          </div>
          <p className="text-[10px] text-emerald-600 font-extrabold leading-none">
            {billingGoal > 0 
              ? `${currentProgressPct.toFixed(1)}% atingido` 
              : "Defina o objetivo principal"
            }
          </p>
        </div>

      </div>

      {/* Main split grid: Form vs AI Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left side: Form for registration */}
        <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-150/80 shadow-md flex flex-col justify-between">
          <div className="space-y-5 text-left">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-orange-100 text-orange-600"><FileText size={16} /></span>
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-950">
                Cadastro de Objetivos PJ
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Média de Faturamento Atual Registrado (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-550 focus:bg-white transition-all"
                    placeholder="Ex: 15000.00"
                    value={averageBilling || ""}
                    onChange={(e) => setAverageBilling(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
                {/* Innovative Value Addition Buttons */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setAverageBilling(Math.max(0, averageBilling - 5000))}
                    className="px-2 py-1 text-[9px] font-bold font-mono rounded-lg bg-red-50 text-red-650 hover:bg-red-100 border border-red-100/50 transition-all cursor-pointer"
                  >
                    -5k
                  </button>
                  <button
                    type="button"
                    onClick={() => setAverageBilling(Math.max(0, averageBilling - 1000))}
                    className="px-2 py-1 text-[9px] font-bold font-mono rounded-lg bg-red-50 text-red-650 hover:bg-red-100 border border-red-100/50 transition-all cursor-pointer"
                  >
                    -1k
                  </button>
                  <button
                    type="button"
                    onClick={() => setAverageBilling((averageBilling || 0) + 1000)}
                    className="px-2 py-1 text-[9px] font-bold font-mono rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100/50 transition-all cursor-pointer"
                  >
                    +1k
                  </button>
                  <button
                    type="button"
                    onClick={() => setAverageBilling((averageBilling || 0) + 5000)}
                    className="px-2 py-1 text-[9px] font-bold font-mono rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100/50 transition-all cursor-pointer"
                  >
                    +5k
                  </button>
                  <button
                    type="button"
                    onClick={() => setAverageBilling((averageBilling || 0) + 10000)}
                    className="px-2 py-1 text-[9px] font-bold font-mono rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100/50 transition-all cursor-pointer"
                  >
                    +10k
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Objetivo Principal de Faturamento Comercial (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-gray-950 focus:outline-none focus:ring-2 focus:ring-orange-550 focus:bg-white transition-all"
                    placeholder="Ex: 25000.00"
                    value={billingGoal || ""}
                    onChange={(e) => setBillingGoal(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
                {/* Innovative Value Addition Buttons and Smart Percent-growth Shortcuts */}
                <div className="flex flex-col gap-1.5 pt-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBillingGoal(Math.max(0, billingGoal - 5000))}
                      className="px-2 py-1 text-[9px] font-bold font-mono rounded-lg bg-red-50 text-red-650 hover:bg-red-100 border border-red-100/50 transition-all cursor-pointer"
                    >
                      -5k
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingGoal((billingGoal || 0) + 5000)}
                      className="px-2 py-1 text-[9px] font-bold font-mono rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100/50 transition-all cursor-pointer"
                    >
                      +5k
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingGoal((billingGoal || 0) + 10000)}
                      className="px-2 py-1 text-[9px] font-bold font-mono rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100/50 transition-all cursor-pointer"
                    >
                      +10k
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingGoal((billingGoal || 0) + 50000)}
                      className="px-2 py-1 text-[9px] font-bold font-mono rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100/50 transition-all cursor-pointer"
                    >
                      +50k
                    </button>
                  </div>
                  {averageBilling > 0 && (
                    <div className="bg-orange-50/40 p-2 rounded-xl border border-orange-100/30">
                      <p className="text-[8px] font-black uppercase tracking-wider text-orange-600 mb-1">
                        🚀 Atalhos I.A de Alinhamento de Faturamento:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setBillingGoal(Math.round(averageBilling * 1.15))}
                          className="px-2 py-0.5 text-[8px] font-black uppercase rounded-md bg-white border border-orange-200 text-orange-655 hover:bg-orange-50 transition-all cursor-pointer"
                          title="Faturar +15%"
                        >
                          +15% (R$ {Math.round(averageBilling * 1.15).toLocaleString()})
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingGoal(Math.round(averageBilling * 1.30))}
                          className="px-2 py-0.5 text-[8px] font-black uppercase rounded-md bg-white border border-orange-200 text-orange-655 hover:bg-orange-50 transition-all cursor-pointer"
                          title="Faturar +30%"
                        >
                          +30% (R$ {Math.round(averageBilling * 1.30).toLocaleString()})
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingGoal(Math.round(averageBilling * 1.50))}
                          className="px-2 py-0.5 text-[8px] font-black uppercase rounded-md bg-white border border-orange-200 text-orange-655 hover:bg-orange-50 transition-all cursor-pointer"
                          title="Faturar +50%"
                        >
                          +50% (R$ {Math.round(averageBilling * 1.50).toLocaleString()})
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingGoal(Math.round(averageBilling * 2))}
                          className="px-2 py-0.5 text-[8px] font-black uppercase rounded-md bg-[#141414] text-white hover:bg-orange-650 transition-all cursor-pointer"
                          title="Faturar 2x mais"
                        >
                          2X (R$ {Math.round(averageBilling * 2).toLocaleString()})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Prazo / Cronograma Limite (Data)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Calendar size={14} />
                  </span>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-550 focus:bg-white transition-all"
                    placeholder="Ex: Dezembro / 2026, Próximos 6 meses"
                    value={billingGoalDeadline}
                    onChange={(e) => setBillingGoalDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold">
                  Notas Estratégicas Extras do Negócio
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-3 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-550 focus:bg-white transition-all resize-none"
                  placeholder="Descreva detalhes como nicho do negócio, principais gargalos que você enfrenta para atingir essa meta, orçamentos, canais que deseja explorar..."
                  value={billingNotes}
                  onChange={(e) => setBillingNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-98 rounded-2xl text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Save size={15} />
                Confirmar Cadastro de Faturamento
              </button>

            </form>
          </div>
        </div>

        {/* Right side: AI Action Plan Generator */}
        <div className="lg:col-span-7 bg-[#0b0c0e] p-6 md:p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
          
          <div className="space-y-4 relative z-10 text-left flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-orange-500/15 text-orange-400">
                  <Sparkles size={16} />
                </span>
                <h3 className="text-sm font-black uppercase tracking-widest text-orange-400">
                  Plano Tático AI Recalibrado
                </h3>
              </div>
              <span className="text-[8px] font-black uppercase bg-orange-500/15 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full">
                Sincronismo Ativo Dafne
              </span>
            </div>

            {/* Simulated target explanation */}
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              A inteligência assessora reescreve todo o seu ecossistema focando no seu objetivo final de <span className="text-white font-semibold">{formatCurrency(billingGoal)}</span>. Clique abaixo para simular as principais alavancas necessárias para vencer a diferença.
            </p>

            {/* Strategic results area */}
            <div className="flex-1 min-h-[180px] bg-slate-900/40 border border-gray-800 rounded-2xl p-4 flex flex-col relative">
              <textarea
                readOnly
                className="w-full flex-1 bg-transparent text-gray-250 font-mono text-[11px] leading-relaxed resize-none focus:outline-none scrollbar-thin rounded-lg text-slate-300"
                value={
                  strategicPlan || 
                  (isGenerating 
                    ? "Sintonizando conexões de mercado...\nConectando aos benchmarks do comércio brasileiro...\nEstruturando cronograma estratégico para fechamento de gap de faturamento..."
                    : "Insira seu objetivo acima e clique no botão abaixo para simular soluções e desenhar seu plano tático passo a passo de faturamento.")
                }
              />
            </div>

            {/* Custom interactive action notes saving */}
            {strategicPlan && (
              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCopyPlan}
                  className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase text-[9px] tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-gray-750"
                >
                  <Copy size={11} />
                  Copiar Plano
                </button>
                <button
                  type="button"
                  onClick={handleSavePlanAsNote}
                  className="px-4 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 font-extrabold uppercase text-[9px] tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-orange-400/20"
                >
                  <FileText size={11} />
                  Salvar como Anotação PJ
                </button>
              </div>
            )}

            {/* Strategic button trigger */}
            <div className="pt-3 border-t border-gray-850">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGeneratePlan}
                className={cn(
                  "w-full py-3.5 font-black uppercase text-xs tracking-wider transition-all rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg",
                  isGenerating
                    ? "bg-gray-800/80 text-gray-500 cursor-not-allowed border-zinc-800"
                    : "bg-[#f97316] hover:bg-orange-600 active:scale-98 text-white shadow-orange-950/20"
                )}
              >
                {isGenerating ? (
                  <>
                    <Zap className="animate-spin text-orange-400" size={15} />
                    <span>Confeccionando Roteiro de Margens...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={15} />
                    <span>Gerar Plano de Ação Personalizado (I.A. Dafne)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
