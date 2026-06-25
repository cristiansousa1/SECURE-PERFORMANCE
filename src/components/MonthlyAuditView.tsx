import React, { useState, useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import { 
  Sparkles, 
  Target, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Brain, 
  ChevronRight, 
  TrendingUp, 
  LineChart, 
  Coins, 
  Gauge, 
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Info
} from "lucide-react";
import { cn } from "../lib/utils";
import { sound } from "../utils/SoundEngine";
import { AbntPdfDocument } from "../utils/pdfAbntHelper";

// Sub-markdown renderer for the AI Audit report
const LocalMarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-3.5 text-xs md:text-sm text-slate-300 leading-relaxed font-sans text-left">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return (
            <h4 key={idx} className="text-sm font-black text-orange-200 mt-5 mb-2 uppercase tracking-wide border-l-2 border-orange-500 pl-2">
              {trimmed.replace("###", "").trim()}
            </h4>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h3 key={idx} className="text-base font-black text-white mt-6 mb-2.5 uppercase tracking-tight flex items-center gap-1.5 pt-4 border-t border-white/5">
              <Sparkles size={14} className="text-orange-400" />
              {trimmed.replace("##", "").trim()}
            </h3>
          );
        }
        if (trimmed.startsWith("#")) {
          return (
            <h2 key={idx} className="text-lg font-black text-orange-100 mt-7 mb-3 uppercase tracking-tighter border-b border-white/10 pb-1.5">
              {trimmed.replace("#", "").trim()}
            </h2>
          );
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
        return <p key={idx} className="text-slate-300 leading-relaxed">{trimmed}</p>;
      })}
    </div>
  );
};

export const MonthlyAuditView: React.FC = () => {
  const {
    transactions,
    getDRE,
    profile,
    showToast,
    isDemoMode,
    trackDemoInteraction,
    user
  } = useFinance();

  // User configurability for evaluation criteria
  const [successCriteria, setSuccessCriteria] = useState<"pure_profit" | "billing_goal" | "hybrid">("hybrid");

  // Selection for dynamic historical months scope (last 3, 6 or 12 months)
  const [historyScope, setHistoryScope] = useState<number>(6);

  // Advanced model configurations for strategic prediction
  const [selectedPrecision, setSelectedPrecision] = useState<number>(0.7);
  const [selectedTier, setSelectedTier] = useState<"flash" | "pro" | "quantum">("pro");

  // AI response state
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  // Generate date bounds chronologically for the selected scope
  const listMonths = useMemo(() => {
    const list: Date[] = [];
    for (let i = historyScope - 1; i >= 0; i--) {
      list.push(subMonths(new Date(), i));
    }
    return list;
  }, [historyScope]);

  // Compute DRE financial metrics per month
  const auditedMonthsData = useMemo(() => {
    const billingGoal = profile?.billingGoal || 0;
    
    return listMonths.map((mDate) => {
      const monthName = format(mDate, "MMMM 'de' yyyy", { locale: ptBR });
      const monthKey = format(mDate, "yyyy-MM");
      
      const dreLines = getDRE(mDate);
      
      // Extract Revenue from DRE structure
      const revenueObj = dreLines.find(l => l.label.toUpperCase().includes("RECEITA OPERACIONAL BRUTA"));
      let revenue = revenueObj ? revenueObj.value : 0;

      // Extract Net result of period from DRE structure
      const profitObj = dreLines.find(l => l.label.toUpperCase().includes("RESULTADO LÍQUIDO DO PERÍODO"));
      let profit = profitObj ? profitObj.value : 0;

      // Sandbox optimization / fallbacks for demo realism if no transactions recorded
      const hasRealTxs = transactions.some(t => t.date && format(new Date(t.date), "yyyy-MM") === monthKey);
      
      if (!hasRealTxs && isDemoMode) {
        // Generate stable realistic seeded records scaled to user average billing
        const base = profile?.averageBilling || 45000;
        const seedIndex = mDate.getMonth();
        const factor = 0.8 + (seedIndex % 5) * 0.15; // varying 80% to 140%
        revenue = Math.round(base * factor);
        
        // Expense scaling with slight seasonal variations
        const expenseFactor = 0.72 + ((seedIndex * 7) % 3) * 0.08; // 72% to 88%
        const opex = Math.round(revenue * expenseFactor);
        profit = revenue - opex;
      }

      const expense = Math.max(0, revenue - profit);
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      // Determine Hit/Miss based on criteria
      let isHit = false;
      let ratioOfGoal = billingGoal > 0 ? (revenue / billingGoal) * 100 : 100;
      
      if (successCriteria === "pure_profit") {
        isHit = profit > 0;
      } else if (successCriteria === "billing_goal") {
        isHit = billingGoal > 0 ? revenue >= billingGoal : profit > 0;
      } else {
        // Hybrid: positive profit AND faturamento exceeds 85% of standard goal
        isHit = profit > 0 && (billingGoal > 0 ? revenue >= billingGoal * 0.85 : true);
      }

      return {
        monthKey,
        monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        revenue,
        expense,
        profit,
        margin,
        isHit,
        goalAchievedPct: Number(ratioOfGoal.toFixed(1))
      };
    });
  }, [listMonths, getDRE, profile, transactions, successCriteria, isDemoMode]);

  // Compute aggregate indicators
  const stats = useMemo(() => {
    const totalCount = auditedMonthsData.length;
    if (totalCount === 0) return { successCount: 0, failCount: 0, rate: 0, avgRevenue: 0, avgProfit: 0, streak: 0 };
    
    const successCount = auditedMonthsData.filter(m => m.isHit).length;
    const failCount = totalCount - successCount;
    const rate = Math.round((successCount / totalCount) * 100);
    
    const sumRevenue = auditedMonthsData.reduce((acc, m) => acc + m.revenue, 0);
    const sumProfit = auditedMonthsData.reduce((acc, m) => acc + m.profit, 0);
    
    // Calculates current consecutive streak of hits (reading backwards)
    let streak = 0;
    for (let i = auditedMonthsData.length - 1; i >= 0; i--) {
      if (auditedMonthsData[i].isHit) {
        streak++;
      } else {
        break;
      }
    }

    return {
      successCount,
      failCount,
      rate,
      avgRevenue: Math.round(sumRevenue / totalCount),
      avgProfit: Math.round(sumProfit / totalCount),
      streak
    };
  }, [auditedMonthsData]);

  // Find highest profit/margin month (O mês de maior acerto)
  const bestMonth = useMemo(() => {
    if (auditedMonthsData.length === 0) return null;
    return [...auditedMonthsData].sort((a, b) => b.profit - a.profit)[0];
  }, [auditedMonthsData]);

  // Find lowest profit/margin month (O mês de descasamento ou maior erro)
  const worstMonth = useMemo(() => {
    if (auditedMonthsData.length === 0) return null;
    return [...auditedMonthsData].sort((a, b) => a.profit - b.profit)[0];
  }, [auditedMonthsData]);

  // Action: Invoke endpoint to trigger AI insights
  const handleGenerateAuditInsight = async () => {
    sound.playClick();
    setLoadingAI(true);
    setAiReport(null);
    if (trackDemoInteraction) trackDemoInteraction();

    try {
      const response = await fetch("/api/ai/monthly-performance-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": user?.email || profile?.userId || "user_placeholder@gmail.com"
        },
        body: JSON.stringify({
          data: {
            companyName: profile?.companyName || "Minha Empresa",
            businessSegment: profile?.businessSegment || "other",
            businessNicheDetail: profile?.businessNicheDetail || "Geral",
            billingGoal: profile?.billingGoal || 0
          },
          historicalMonths: auditedMonthsData,
          neuralPrecision: selectedPrecision,
          neuralTier: selectedTier
        })
      });

      if (!response.ok) {
        throw new Error("Erro na rota de inteligência.");
      }

      const result = await response.json();
      setAiReport(result.auditReport);
      showToast("Diagnóstico de Auditoria e metas integrado com sucesso!", "success");
    } catch (e: any) {
      console.error(e);
      showToast("Não foi possível conectar com o servidor. Executando diagnóstico programático.", "warning");
    } finally {
      setLoadingAI(false);
    }
  };

  // Action: Export structural analytics table and AI Advice text into ABNT PDF format
  const exportAuditReportPDF = () => {
    sound.playClick();
    if (trackDemoInteraction) trackDemoInteraction();
    showToast("Gerando Relatório de Auditoria estruturado ABNT. Aguarde...", "info");

    const pdf = new AbntPdfDocument({
      isAbntStandard: true,
      primaryColor: { r: 15, g: 23, b: 42 },
      secondaryColor: { r: 249, g: 115, b: 22 }
    });

    // 1. Capa
    pdf.drawCover(
      profile?.companyName || "Minha Empresa",
      "AUDITORIA HISTÓRICA E MAPA DE ASSERTIVIDADE",
      "Diagnósticos Mensais de Metas de Lucro e Desvios de Fluxo (I.A. Integrada)"
    );

    pdf.doc.addPage();
    pdf.y = 30;

    // 2. Headings
    pdf.addPrimaryHeading("1 - SEÇÃO ANALÍTICA MENSAL");
    pdf.addParagraph(
      "Este relatório fornece uma avaliação sistêmica de todos os dados financeiros coletados do empreendimento, calculando a taxa de sucesso (" +
      stats.rate + "%) e segregando os meses sob as métricas de conformidade definidas em cockpit."
    );

    // KPI Summary card
    pdf.addSummaryCard("SÍNTESE DOS INDICADORES DE ASSERTIVIDADE", [
      { label: "Média de Custos Acumulada", value: `R$ ${(stats.avgRevenue - stats.avgProfit).toLocaleString('pt-BR')}` },
      { label: "Sobra Operacional Média", value: `R$ ${stats.avgProfit.toLocaleString('pt-BR')}` },
      { label: "Assertividade Comercial", value: `${stats.rate}%` },
      { label: "Recorrência Consecutiva (Streak)", value: `${stats.streak} meses` }
    ]);

    pdf.y += 10;

    // 3. Table of historical months
    const tableColumns = [
      { header: "Mês Declarado", key: "month", width: 45 },
      { header: "Faturamento (R$)", key: "revenue", width: 35 },
      { header: "Despesas (R$)", key: "expense", width: 35 },
      { header: "Resultado (R$)", key: "profit", width: 30 },
      { header: "Status", key: "status", width: 15 }
    ];

    const tableRows = auditedMonthsData.map(m => ({
      month: m.monthName,
      revenue: m.revenue.toLocaleString('pt-BR'),
      expense: m.expense.toLocaleString('pt-BR'),
      profit: m.profit.toLocaleString('pt-BR'),
      status: m.isHit ? "ACERTOU" : "ERROU"
    }));

    pdf.addAbntTable(tableColumns, tableRows, "Auditoria Consolidada de Históricos de Caixa");

    pdf.y += 10;
    
    // Check page space for AI Advice text
    pdf.checkNewPage(60);

    // 4. AI Diagnosis Chapter
    pdf.addPrimaryHeading("2 - DIAGNÓSTICO E MENTORIA DA ESTRATEGISTA DAFNE");
    
    if (aiReport) {
      // Split AI lines to export without breaking formatting
      const lines = aiReport.split("\n");
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed === "") {
          pdf.y += 3;
        } else if (trimmed.startsWith("###")) {
          pdf.checkNewPage(10);
          pdf.doc.setFont("Helvetica", "bold");
          pdf.doc.setFontSize(10);
          pdf.doc.setTextColor(249, 115, 22);
          pdf.doc.text(trimmed.replace("###", "").trim().toUpperCase(), pdf.leftMargin, pdf.y);
          pdf.y += 6;
        } else if (trimmed.startsWith("##") || trimmed.startsWith("#")) {
          pdf.checkNewPage(12);
          pdf.addSecondaryHeading(trimmed.replace(/^#+\s*/g, ""));
        } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          pdf.checkNewPage(8);
          pdf.addBulletItem("•", trimmed.substring(1).trim());
        } else {
          pdf.checkNewPage(15);
          pdf.addParagraph(trimmed);
        }
      });
    } else {
      pdf.addParagraph(
        "Nenhum diagnóstico de IA foi processado até esta data. Para enriquecer este parecer técnico com mapas estratégicos de controle, ative o cockpit e clique em 'Gerar Auditoria de Desempenho por I.A.' no painel."
      );
    }

    pdf.y += 15;
    pdf.checkNewPage(40);
    pdf.addSignaturesBlock();
    pdf.addAuditSeal();

    pdf.currentPage = 1; // reset or trigger save
    pdf.doc.save(`auditoria_metas_lucratividade_${format(new Date(), "yyyyMMdd")}.pdf`);
    showToast("PDF de Auditoria exportado com êxito!", "success");
  };

  return (
    <div id="monthly-audit-main-widget" className="space-y-6">
      
      {/* HEADER & CRITERIA BAR */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-orange-500/15 border border-orange-500/25 text-orange-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                Auditoria Avançada
              </span>
              {isDemoMode && (
                <span className="bg-blue-500/15 border border-blue-500/25 text-blue-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                  Sandbox Integrado
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Assertividade de Metas & Cockpit de Faturamento
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Compare ciclicamente seus acertos (meses lucrativos estruturados) versus desvios operacionais (erros de margem ou OPEX). Personalize critérios de batimento e avalie a eficiência financeira histórica.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportAuditReportPDF}
              className="px-3.5 py-1.5 text-xs font-black text-slate-200 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
              title="Exportar auditoria de assertividade em relatório oficial ABNT"
            >
              <Download size={14} className="text-orange-400" /> Exportar ABNT
            </button>
          </div>
        </div>

        {/* SETTINGS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/5 relative z-10">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Métrica de Avaliação do Acerto:
            </label>
            <select
              value={successCriteria}
              onChange={(e) => {
                sound.playClick();
                setSuccessCriteria(e.target.value as any);
              }}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 md:p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="hybrid">Híbrido: Resultado Positivo + Faturamento &ge; 85% Meta</option>
              <option value="pure_profit">Lucratividade Pura: Sobra de Caixa &gt; R$ 0,00</option>
              <option value="billing_goal">Meta Comercial: Faturamento &ge; 100% Meta Securitária</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Escopo Cronológico Analisado:
            </label>
            <select
              value={historyScope}
              onChange={(e) => {
                sound.playClick();
                setHistoryScope(Number(e.target.value));
              }}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 md:p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value={3}>Últimos 3 Meses Analíticos</option>
              <option value={6}>Últimos 6 Meses Consolidados</option>
              <option value={12}>Últimos 12 Meses Inteiros</option>
            </select>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-xl p-2.5 flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 shrink-0">
              <Target size={16} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Meta Atual Cadastrada:</p>
              <p className="text-xs font-black text-white mt-0.5">
                R$ {profile?.billingGoal ? profile.billingGoal.toLocaleString('pt-BR') : "0,00"}
                <span className="text-[9px] font-normal text-slate-400 ml-1.5 block md:inline">
                  {profile?.billingGoal ? `(${profile?.billingGoalDeadline || 'Sem prazo'})` : "(Configure nas Configurações)"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI STATS BOARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: SUCCESS RATE */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle2 size={20} className={cn(stats.rate > 60 && "animate-pulse")} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assertividade Geral</p>
            <p className="text-lg md:text-xl font-black text-emerald-400 mt-0.5">{stats.rate}%</p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
              {stats.successCount} acertos de {stats.successCount + stats.failCount} meses
            </p>
          </div>
        </div>

        {/* KPI 2: CURRENT STREAK */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden">
          <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Série Consecutiva</p>
            <p className="text-lg md:text-xl font-black text-orange-400 mt-0.5">{stats.streak} {stats.streak === 1 ? 'mês' : 'meses'}</p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
              Série histórica ininterrupta
            </p>
          </div>
        </div>

        {/* KPI 3: AVERAGE REVENUE */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faturamento Médio</p>
            <p className="text-lg md:text-xl font-black text-white mt-0.5">R$ {stats.avgRevenue.toLocaleString('pt-BR')}</p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
              Capacidade de faturamento
            </p>
          </div>
        </div>

        {/* KPI 4: AVERAGE MARGIN */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <Coins size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margem Líquida Mdia</p>
            <p className="text-lg md:text-xl font-black text-purple-400 mt-0.5">
              {stats.avgRevenue > 0 ? ((stats.avgProfit / stats.avgRevenue) * 100).toFixed(1) : "0"}%
            </p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
              Sobra real: R$ {stats.avgProfit.toLocaleString('pt-BR')}/mês
            </p>
          </div>
        </div>

      </div>

      {/* CHART & HISTORICAL TIMELINE BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* VISUAL CHART */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5 tracking-wider">
              <LineChart size={14} className="text-orange-500" /> Histórico Financeiro Multicorrelacionado
            </h3>
            <span className="text-[9px] text-slate-400 font-mono">Unidade: R$ Real</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auditedMonthsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="monthKey" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                  formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar name="Faturamento" dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar name="Saídas / Custos" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar name="Lucro Líquido" dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SUMMARY ANALYSIS EXPLAINER DETAILS */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Info size={14} className="text-orange-400" />
              <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Elegibilidade Operativa</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Cada ciclo mensal é submetido à sua regra de sucesso. Entenda como o seu negócio se comporta sob o crivo do DRE:
            </p>

            <div className="space-y-3">
              <div className="bg-zinc-950 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Faturamento Ideal vs Real</span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">Progress</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, stats.rate)}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1.5">
                  Seu índice médio de meta batida está em <strong className="text-orange-400 font-extrabold">{stats.rate}%</strong> do ideal corporativo.
                </p>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Média Mensal Detalhada</span>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-slate-400">Entradas médias:</span>
                  <span className="text-white font-bold">R$ {stats.avgRevenue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-slate-400">Lucro médio:</span>
                  <span className="text-emerald-400 font-bold">R$ {stats.avgProfit.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-400 leading-relaxed">
            *Nota: Se o segmento e nicho não estiverem definidos nas configurações, a IA utilizará projeções generalistas de varejo e serviços. Defina-os para calibrar seu diagnóstico.
          </div>
        </div>

      </div>

      {/* SEÇÃO ANALÍTICA: ACERTOS, ERROS E RELATÓRIO GERAL (I.A. INTEGRADA) */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden" id="hits-misses-diagnostics-topic">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5 relative z-10 text-left">
          <div>
            <span className="bg-orange-500 text-black font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded font-mono">
              Auditoria de Assertividade
            </span>
            <h3 className="text-base font-black uppercase text-white tracking-tight italic mt-1.5 flex items-center gap-2">
              🩺 Diagnósticos de Acertos & Erros de Margens
            </h3>
            <p className="text-xs text-gray-400">
              Cruzamento de dados cronológicos para identificar gargalos operacionais e padrões de meses de sucesso vs desvios.
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleGenerateAuditInsight}
            disabled={loadingAI}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-2 transition-all shrink-0 shadow-lg shadow-orange-950/20 active:scale-95 disabled:opacity-50"
          >
            {loadingAI ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>Gerar Relatório por I.A.</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 relative z-10 text-left">
          
          {/* Card 1: Mês de Maior Acerto */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-450">
              <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400"><ThumbsUp size={14} /></span>
              <span className="text-[10px] font-black uppercase tracking-wider font-mono text-emerald-400">Melhor Mês (Maior Acerto)</span>
            </div>
            
            {bestMonth ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-black text-white">{bestMonth.monthName}</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Sobra e conformidade extremas detectadas no período.</p>
                </div>
                
                <div className="space-y-1.5 border-t border-white/5 pt-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Lucro Real:</span>
                    <span className="text-emerald-400 font-bold">R$ {bestMonth.profit.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Margem Real:</span>
                    <span className="text-white font-bold">{bestMonth.margin.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Progresso da Meta:</span>
                    <span className="text-orange-400 font-bold">{bestMonth.goalAchievedPct}%</span>
                  </div>
                </div>
                
                <div className="bg-[#15251f] border border-emerald-500/15 p-2.5 rounded-xl text-[10px] text-emerald-300 leading-relaxed font-sans">
                  <strong>Fator chave:</strong> O DRE indica que o faturamento médio e markup de produtos cobriram confortavelmente o OPEX fixo.
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-450">Aguardando dados...</p>
            )}
          </div>

          {/* Card 2: Mês de Maior Desvio/Erro */}
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <span className="p-1.5 bg-red-500/10 rounded-lg text-red-400"><ThumbsDown size={14} /></span>
              <span className="text-[10px] font-black uppercase tracking-wider font-mono">Maior Desvio (Erro de Caixa)</span>
            </div>
            
            {worstMonth ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-black text-white">{worstMonth.monthName}</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Maior compressão de caixa fixo ou markup insuficiente registrados.</p>
                </div>
                
                <div className="space-y-1.5 border-t border-white/5 pt-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Resultado Líquido:</span>
                    <span className={worstMonth.profit >= 0 ? "text-emerald-400 font-bold" : "text-rose-450 font-bold"}>
                      R$ {worstMonth.profit.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Margem Líquida:</span>
                    <span className="text-white font-bold">{worstMonth.margin.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Progresso da Meta:</span>
                    <span className="text-rose-450 font-bold">{worstMonth.goalAchievedPct}%</span>
                  </div>
                </div>
                
                <div className="bg-[#2a171c] border border-red-500/15 p-2.5 rounded-xl text-[10px] text-rose-300 leading-relaxed font-sans">
                  <strong>Atenção operacional:</strong> Desalinhamento severo entre volume comercial e despesa operacional fixa registrada.
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-450">Aguardando dados...</p>
            )}
          </div>

          {/* Card 3: Relatório Geral Sincronizado */}
          <div className="bg-zinc-950/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-orange-400">
              <span className="p-1.5 bg-orange-500/10 rounded-lg text-orange-400"><Gauge size={14} /></span>
              <span className="text-[10px] font-black uppercase tracking-wider font-mono">Relatório Geral Sincronizado</span>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Compilamos todos os seus dados cronológicos do ciclo de {historyScope} meses para computar assertividade operacional:
              </p>
              
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                  <span className="text-zinc-500">Resultado Acumulado:</span>
                  <span className={stats.avgProfit >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    R$ {(stats.avgProfit * historyScope).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                  <span className="text-zinc-500">Assertividade Metas:</span>
                  <span className="text-orange-400 font-bold">
                    {stats.successCount} de {historyScope} meses ({stats.rate}%)
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                  <span className="text-zinc-500">Médias Líquidas:</span>
                  <span className="text-white font-bold">
                    {stats.avgRevenue > 0 ? ((stats.avgProfit / stats.avgRevenue) * 100).toFixed(1) : "0"}% Sobra
                  </span>
                </div>
              </div>
              
              <div className="text-[10px] text-zinc-400 font-sans italic leading-tight pt-2 border-t border-white/5">
                * Conectado à inteligência artificial para personalização com base no segmento: <strong className="text-zinc-250 uppercase">{profile?.businessSegment ? (profile.businessSegment === "food" ? "Alimentação 🍔" : profile.businessSegment === "tech" ? "Tecnologia 💻" : profile.businessSegment === "commerce" || profile.businessSegment === "retail" ? "Varejo & Comércio 🏪" : "Serviços PJ 💼") : "Geral"}</strong>.
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* MONTHS LIST TIMELINE */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5 tracking-wider">
            <Calendar size={14} className="text-orange-400" /> Registro Cronológico de Performance
          </h3>
          <span className="text-[10px] text-slate-400">Crivo de auditoria ativo: <span className="font-bold text-white uppercase">{successCriteria === "hybrid" ? "Híbrido" : successCriteria === "pure_profit" ? "Lucratividade" : "Meta"}</span></span>
        </div>

        <div className="divide-y divide-white/5">
          {auditedMonthsData.slice().reverse().map((m, idx) => {
            const hasProfit = m.profit > 0;
            const progressWidth = m.goalAchievedPct;
            
            return (
              <div 
                key={m.monthKey} 
                className={cn(
                  "p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-white/[0.01]",
                  m.isHit ? "border-l-4 border-emerald-500/50" : "border-l-4 border-red-500/50"
                )}
              >
                {/* MONTH INFO & STATUS */}
                <div className="flex items-start gap-3.5">
                  <div className={cn(
                    "p-2.5 rounded-xl shrink-0 mt-0.5",
                    m.isHit 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  )}>
                    {m.isHit ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{m.monthName}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {m.isHit ? (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20">
                          ACERTOU ✅
                        </span>
                      ) : (
                        <span className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-red-500/20">
                          ERROU ❌
                        </span>
                      )}
                      
                      <span className="text-[10px] text-slate-400 font-mono">
                        Progress: {m.goalAchievedPct}% da meta
                      </span>
                    </div>
                  </div>
                </div>

                {/* PROGRESS BAR FROM METRIC */}
                <div className="w-full md:max-w-xs bg-zinc-950 border border-white/5 p-3 rounded-lg flex flex-col justify-center">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                    <span>Meta Faturamento</span>
                    <span className={cn(progressWidth >= 100 ? "text-emerald-400" : "text-amber-400")}>
                      {progressWidth}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        m.isHit ? "bg-emerald-500" : "bg-red-500"
                      )}
                      style={{ width: `${Math.min(100, progressWidth)}%` }}
                    />
                  </div>
                </div>

                {/* METRICS OF THE MONTH */}
                <div className="grid grid-cols-3 gap-6 text-right">
                  <div>
                    <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Faturamento</span>
                    <span className="text-xs font-black text-white">R$ {m.revenue.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Despesas</span>
                    <span className="text-xs font-bold text-slate-300">R$ {m.expense.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="min-w-[100px]">
                    <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Resultado (Margem)</span>
                    <span className={cn(
                      "text-xs font-black block",
                      hasProfit ? "text-emerald-400" : "text-red-400"
                    )}>
                      R$ {m.profit.toLocaleString('pt-BR')}
                      <span className="block text-[9px] font-mono font-medium text-slate-400 mt-0.5">
                        ({m.margin.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COGNITIVE AI CONTROL CONSOLE */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-white/5">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-1.5 tracking-tight">
              <Brain size={18} className="text-orange-400 animate-pulse" /> Inteligência Artificial de Auditoria Baseada em Histórico
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Alimente o processador Dafne com todo o seu histórico analítico. Ela correlacionará seus acertos e desvios para fornecer um relatório diretivo completo de mitigação de erros e expansão de margens.
            </p>
          </div>
          <div>
            <button
              onClick={handleGenerateAuditInsight}
              disabled={loadingAI}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-95 shrink-0"
            >
              {loadingAI ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Processando Métricas...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Gerar Auditoria por I.A.
                </>
              )}
            </button>
          </div>
        </div>

        {/* SETTINGS PARAMETERS FOR BRAIN */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 relative z-10">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Profundidade de Pensamento (Neural Tier):
            </label>
            <div className="flex gap-1.5">
              {(["flash", "pro", "quantum"] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedTier(tier);
                  }}
                  className={cn(
                    "flex-1 py-1.5 text-[9px] font-bold uppercase rounded-lg border cursor-pointer transition-all",
                    selectedTier === tier
                      ? "bg-orange-500/10 text-orange-400 border-orange-500"
                      : "bg-zinc-950 text-slate-400 border-white/10 hover:text-white"
                  )}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Temperatura / Criatividade de Projeção ({selectedPrecision}):
            </label>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.1}
              value={selectedPrecision}
              onChange={(e) => {
                setSelectedPrecision(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          <div className="lg:col-span-2 flex items-center gap-2 text-slate-400 text-[10px] leading-relaxed bg-zinc-950/50 p-2.5 border border-white/5 rounded-xl">
            <Info size={14} className="text-orange-400 shrink-0" />
            <span>
              Ao selecionar o modo **Quantum**, a mentora Dafne utilizará raciocínio profundo multiciclo (high thinking precision) para realizar correlações macroeconômicas de markups baseadas diretamente no seu segmento.
            </span>
          </div>
        </div>

        {/* AI OUTPUT CONTAINER */}
        <AnimatePresence>
          {(aiReport || loadingAI) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-white/5 relative z-10"
            >
              {loadingAI ? (
                <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 size={32} className="text-orange-500 animate-spin" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Compilando Relatórios Históricos</h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                      A estrategista Dafne está cruzando seus faturamentos, despesas operacionais e markups dos últimos {historyScope} meses. Aguarde...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-6 relative">
                  
                  {/* Floating Action Bar */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                        Diagnóstico Estratégico Ativo
                      </span>
                    </div>
                  </div>

                  <div className="prose max-w-none prose-invert">
                    <LocalMarkdownRenderer text={aiReport || ""} />
                  </div>

                  <div className="mt-8 pt-5 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[10px] text-slate-400">
                    <div>
                      Diagnóstico computado síncronamente pela consultora Dafne (Gemini AI Integrada).
                    </div>
                    <button
                      onClick={exportAuditReportPDF}
                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-lg flex items-center gap-2 border border-white/10 cursor-pointer text-[10px] uppercase transition-all"
                    >
                      <Download size={12} className="text-orange-400" /> Exportar para PDF de Auditoria
                    </button>
                  </div>

                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
