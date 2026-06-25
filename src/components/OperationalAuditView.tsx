import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFinance } from "../contexts/FinanceContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  CartesianGrid 
} from "recharts";
import { 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Sliders, 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  RefreshCw, 
  FileText, 
  Download, 
  AlertCircle, 
  Scale, 
  Activity, 
  Layers, 
  Percent, 
  Cpu, 
  Briefcase 
} from "lucide-react";
import { cn } from "../lib/utils";
import { sound } from "../utils/SoundEngine";
import { AbntPdfDocument } from "../utils/pdfAbntHelper";

export const OperationalAuditView: React.FC = () => {
  const { 
    allTransactions, 
    categories, 
    profile, 
    isDemoMode, 
    showToast 
  } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedAuditProfile, setSelectedAuditProfile] = useState<"all" | "matriz" | "filial">("all");

  // Otimizadores (Sliders de Simulação)
  const [cmvOptimization, setCmvOptimization] = useState<number>(0); // 0% a 20%
  const [logisticsOptimization, setLogisticsOptimization] = useState<number>(0); // 0% a 30%
  const [saasOptimization, setSaasOptimization] = useState<number>(0); // 0% a 50%
  const [payrollOptimization, setPayrollOptimization] = useState<number>(0); // 0% a 15%

  const [isGeneratingAudit, setIsGeneratingAudit] = useState<boolean>(false);
  const [aiCustomReport, setAiCustomReport] = useState<string | null>(null);

  // Filtra as transações correspondentes ao mês e perfil selecionado
  const auditTransactions = useMemo(() => {
    let filtered = allTransactions;
    
    // Período: Mês selecionado
    const selectedYear = selectedMonth.getFullYear();
    const selectedMonthIdx = selectedMonth.getMonth();
    
    filtered = filtered.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === selectedYear && txDate.getMonth() === selectedMonthIdx;
    });

    // Filtro de perfil (Matriz / Filial)
    if (selectedAuditProfile !== "all") {
      filtered = filtered.filter(tx => tx.profileId === selectedAuditProfile);
    }

    return filtered;
  }, [allTransactions, selectedMonth, selectedAuditProfile]);

  // Estatísticas Financeiras Reais do Mês de competência
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cmvCost = 0; // cat5
    let logisticsCost = 0; // cat16
    let saasCost = 0; // cat8 e cat14
    let payrollCost = 0; // cat4
    let fixedRent = 0; // cat3
    let directTaxes = 0; // cat7
    let marketing = 0; // cat6
    let otherExpenses = 0;

    auditTransactions.forEach(tx => {
      const amount = tx.amount;
      if (tx.type === "income") {
        totalRevenue += amount;
      } else {
        if (tx.categoryId === "cat5") {
          cmvCost += amount;
        } else if (tx.categoryId === "cat16") {
          logisticsCost += amount;
        } else if (tx.categoryId === "cat8" || tx.categoryId === "cat14") {
          saasCost += amount;
        } else if (tx.categoryId === "cat4") {
          payrollCost += amount;
        } else if (tx.categoryId === "cat3") {
          fixedRent += amount;
        } else if (tx.categoryId === "cat7") {
          directTaxes += amount;
        } else if (tx.categoryId === "cat6") {
          marketing += amount;
        } else {
          otherExpenses += amount;
        }
      }
    });

    const totalExpenses = cmvCost + logisticsCost + saasCost + payrollCost + fixedRent + directTaxes + marketing + otherExpenses;
    const ebitda = totalRevenue - totalExpenses;
    const initialMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      cmvCost,
      logisticsCost,
      saasCost,
      payrollCost,
      fixedRent,
      directTaxes,
      marketing,
      otherExpenses,
      totalExpenses,
      ebitda,
      initialMargin
    };
  }, [auditTransactions]);

  // Detecção de Gargalos Operacionais com Base em Parâmetros de Mercado
  const bottlenecks = useMemo(() => {
    const list = [];
    const rev = metrics.totalRevenue || 120000; //Fallback para PME

    // 1. CMV Superior
    const cmvRatio = (metrics.cmvCost / rev) * 100;
    if (cmvRatio > 32) {
      list.push({
        id: "cmv-high",
        title: "CMV de Insumos Descalibrado",
        ratio: cmvRatio,
        severity: "critical",
        impact: metrics.cmvCost,
        category: "cat5",
        text: `O Custo de Mercadorias Vendidas (CMV) representa ${cmvRatio.toFixed(1)}% do faturamento, ultrapassando a marca segura de 30%. Isso indica que fornecedores ou perdas internas de estoque estão deteriorando sua margem operacional bruta direta.`
      });
    }

    // 2. Margem de Transporte / Logística
    const logisticsRatio = (metrics.logisticsCost / rev) * 100;
    if (logisticsRatio > 4.5) {
      list.push({
        id: "logistics-leak",
        title: "Vazamento em Logística e Despacho",
        ratio: logisticsRatio,
        severity: "medium",
        category: "cat16",
        impact: metrics.logisticsCost,
        text: `As despesas de transporte e despacho representam ${logisticsRatio.toFixed(1)}% das receitas. É incomum uma empresa gastar tanto em logística sem parcerias estratégicas corporativas ou renegociações de frete flex.`
      });
    }

    // 3. SaaS Creep / Assinaturas e Cloud
    const saasRatio = (metrics.saasCost / rev) * 100;
    if (saasRatio > 2.2) {
      list.push({
        id: "saas-creep",
        title: "SaaS Creep & APIs Desgovernadas",
        ratio: saasRatio,
        severity: "low",
        category: "cat8",
        impact: metrics.saasCost,
        text: `Nuvem, hospedagens, APIs de IA e licenças de software consomem ${saasRatio.toFixed(1)}% da receita. Geralmente decorre de ferramentas redundantes ou subutilizadas ativas nos cartões corporativos.`
      });
    }

    // 4. Folha Ineficiente / Capacidade Ociosa
    const payrollRatio = (metrics.payrollCost / rev) * 100;
    if (payrollRatio > 23) {
      list.push({
        id: "payroll-overloaded",
        title: "Sobrecarga de OPEX com Pessoal",
        ratio: payrollRatio,
        severity: "high",
        category: "cat4",
        impact: metrics.payrollCost,
        text: `A folha salarial consome ${payrollRatio.toFixed(1)}% do faturamento de competência. Valores acima de 20% expõem o caixa a grave estrangulamento caso ocorra qualquer oscilação temporária na meta de vendas.`
      });
    }

    // 5. Se não houver problemas graves
    if (list.length === 0) {
      list.push({
        id: "healthy-business",
        title: "Padrão de Alocação Otimizado",
        ratio: 0,
        severity: "healthy",
        impact: 0,
        category: "all",
        text: "Nenhum desvio crítico encontrado! Seus parâmetros operacionais estão adequados e no padrão ouro de mercado para PMEs de alta performance comercial."
      });
    }

    return list;
  }, [metrics]);

  // Cálculos de Simulação pós Otimizadores (Sliders)
  const simulationResults = useMemo(() => {
    // Poupanças com base nos Sliders de Otimização selecionados
    const cmvSaved = metrics.cmvCost * (cmvOptimization / 100);
    const logisticsSaved = metrics.logisticsCost * (logisticsOptimization / 100);
    const saasSaved = metrics.saasCost * (saasOptimization / 100);
    const payrollSaved = metrics.payrollCost * (payrollOptimization / 100);

    const totalSavedMonthly = cmvSaved + logisticsSaved + saasSaved + payrollSaved;
    const totalSavedAnnual = totalSavedMonthly * 12;

    const simulatedExpenses = metrics.totalExpenses - totalSavedMonthly;
    const simulatedEbitda = metrics.totalRevenue - simulatedExpenses;
    const simulatedMargin = metrics.totalRevenue > 0 ? (simulatedEbitda / metrics.totalRevenue) * 100 : 0;

    // Pontuação de Eficiência de 0 a 100%
    let baselineEfficiency = 70;
    if (bottlenecks.length > 2) baselineEfficiency = 55;
    else if (bottlenecks.some(b => b.severity === "critical")) baselineEfficiency = 62;
    else if (bottlenecks.length === 1 && bottlenecks[0].severity === "healthy") baselineEfficiency = 95;

    // Adiciona eficiência incremental baseada nas otimizações aplicadas
    const maxPossibleOptimization = (metrics.cmvCost * 0.20) + (metrics.logisticsCost * 0.30) + (metrics.saasCost * 0.50) + (metrics.payrollCost * 0.15);
    const progressFactor = maxPossibleOptimization > 0 ? (totalSavedMonthly / maxPossibleOptimization) * 25 : 0;
    const finalEfficiencyScore = Math.min(100, Math.round(baselineEfficiency + progressFactor));

    return {
      cmvSaved,
      logisticsSaved,
      saasSaved,
      payrollSaved,
      totalSavedMonthly,
      totalSavedAnnual,
      simulatedExpenses,
      simulatedEbitda,
      simulatedMargin,
      finalEfficiencyScore
    };
  }, [metrics, cmvOptimization, logisticsOptimization, saasOptimization, payrollOptimization, bottlenecks]);

  // Recharts Chart Data
  const comparisonChartData = useMemo(() => {
    return [
      {
        name: "Faturamento",
        "Valor Atual": metrics.totalRevenue,
        "Projetado Otimizado": metrics.totalRevenue,
      },
      {
        name: "Custos Totais",
        "Valor Atual": metrics.totalExpenses,
        "Projetado Otimizado": simulationResults.simulatedExpenses,
      },
      {
        name: "Sobra/EBITDA",
        "Valor Atual": metrics.ebitda,
        "Projetado Otimizado": simulationResults.simulatedEbitda,
      }
    ];
  }, [metrics, simulationResults]);

  // Reseta os simuladores
  const handleResetFilters = () => {
    sound.playClick();
    setCmvOptimization(0);
    setLogisticsOptimization(0);
    setSaasOptimization(0);
    setPayrollOptimization(0);
    setAiCustomReport(null);
    showToast("Simuladores de gargalo resetados com sucesso!", "success");
  };

  // Executa uma Auditoria Contábil com I.A local simulada
  const handleGenerateAISummary = () => {
    sound.playClick();
    setIsGeneratingAudit(true);

    setTimeout(() => {
      let adviceLines = [];
      adviceLines.push(`### RELATÓRIO DO DIAGNÓSTICO OPERACIONAL E CONTROLE DE GARGALOS`);
      adviceLines.push(`**Parâmetros de Auditoria:** Compilado Contábil de Referência ${selectedMonth.toLocaleDateString("pt-BR", { month: 'long', year: 'numeric' })}.`);
      adviceLines.push(`\n**1. DIAGNÓSTICO DE INEFICIÊNCIA:**\nIdentificamos que os maiores escapes de recursos operacionais hoje residem em:`);

      bottlenecks.forEach(b => {
        if (b.severity !== "healthy") {
          adviceLines.push(`- **${b.title} (${b.severity.toUpperCase()}):** Consumindo R$ ${b.impact.toLocaleString("pt-BR")} as contas associadas. ${b.text}`);
        } else {
          adviceLines.push(`- **Excelente Performance:** Sem desvios consideráveis mapeados em suas contas.`);
        }
      });

      adviceLines.push(`\n**2. DIRETRIZES DE REORGANIZAÇÃO TÁTICA:**`);
      adviceLines.push(`- **Insumos e Estoques:** Reduzir desperdícios e forçar lotes maiores de compra para contrair o CMV bruto linear.`);
      adviceLines.push(`- **SaaS & Cloud:** Concentrar licenças administrativas, realizar o downgrade no plano de servidores e cessar cobranças fantasmas.`);
      adviceLines.push(`- **Logística Integrada:** Terceirizar trechos de despacho ou consolidar entregas locais com operadoras agregadoras.`);

      if (simulationResults.totalSavedMonthly > 0) {
        adviceLines.push(`\n**3. IMPACTO FINANCEIRO DA MODELAGEM DE METAS SELECIONADA:**`);
        adviceLines.push(`Com as otimizações ajustadas no painel, a empresa resgata **R$ ${simulationResults.totalSavedMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} por mês** de margem líquida desperdiçada. Convertendo isso em faturamento bruto proporcional necessário, seria equivalente a gerar **R$ ${(simulationResults.totalSavedMonthly * 3).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} em novas vendas** com as margens antigas.`);
        adviceLines.push(`\n**EBITDA Estimado pós-otimizado:** R$ ${simulationResults.simulatedEbitda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} com margem robusta de **${simulationResults.simulatedMargin.toFixed(1)}%**.`);
      }

      setAiCustomReport(adviceLines.join("\n"));
      setIsGeneratingAudit(false);
      showToast("Auditoria Geral Analítica concluída!", "success");
    }, 1200);
  };

  // Exportar Relatório em PDF Profissional ABNT
  const handleExportPDF = () => {
    sound.playClick();
    try {
      const pdf = new AbntPdfDocument({
        isAbntStandard: true,
        primaryColor: { r: 15, g: 23, b: 42 },
        secondaryColor: { r: 249, g: 115, b: 22 }
      });
      
      pdf.drawCover(
        profile?.companyName || "MaxPerformance Corporation",
        "Auditoria de Gargalos Operacionais",
        "Calibragem Contabil de CMV, Custos e Melhoria de EBITDA",
        "Dafne Strategic Advisory"
      );

      pdf.addPrimaryHeading("1. Introdução e Propósito da Auditoria");
      pdf.addParagraph(
        "Este documento consolida o relatório analítico de Auditoria Operacional de Negócios e Calibração Financeira. " +
        "Tem como objetivo mapear fontes silenciosas de ociosidade operacional, investigar o peso proporcional dos custos " +
        "variáveis (CMV, Custos de Serviços), e apontar caminhos gerenciais pragmáticos para escalar e blindar a lucratividade do caixa."
      );

      pdf.addPrimaryHeading("2. Indicadores Operacionais de Referência");
      const refMonth = selectedMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();
      pdf.addParagraph(`Período Contábil Analisado: ${refMonth} | Unidade Mapeada: ${selectedAuditProfile === "all" ? "Consolidado Geral" : selectedAuditProfile.toUpperCase()}`);

      const refCols = [
        { header: "Métrica de Análise", key: "metric", width: 65 },
        { header: "Valor Registrado (R$)", key: "valStr", width: 45, align: "right" as const },
        { header: "% S/ Receita", key: "pctStr", width: 25, align: "right" as const },
        { header: "Status Mercado", key: "status", width: 25, align: "center" as const }
      ];

      const refRows = [
        { metric: "Faturamento Bruto", valStr: `R$ ${metrics.totalRevenue.toLocaleString("pt-BR")}`, pctStr: "100%", status: "Referência" },
        { metric: "Insumos / CMV (Matéria-Prima)", valStr: `R$ ${metrics.cmvCost.toLocaleString("pt-BR")}`, pctStr: `${((metrics.cmvCost / (metrics.totalRevenue || 1)) * 100).toFixed(1)}%`, status: metrics.cmvCost / (metrics.totalRevenue || 1) > 0.32 ? "Gargalo" : "Apropriado" },
        { metric: "Operações Logísticas & Fretes", valStr: `R$ ${metrics.logisticsCost.toLocaleString("pt-BR")}`, pctStr: `${((metrics.logisticsCost / (metrics.totalRevenue || 1)) * 100).toFixed(1)}%`, status: metrics.logisticsCost / (metrics.totalRevenue || 1) > 0.045 ? "Vazamento" : "Apropriado" },
        { metric: "Tecnologia, Nuvem & SaaS", valStr: `R$ ${metrics.saasCost.toLocaleString("pt-BR")}`, pctStr: `${((metrics.saasCost / (metrics.totalRevenue || 1)) * 100).toFixed(1)}%`, status: metrics.saasCost / (metrics.totalRevenue || 1) > 0.022 ? "Gargalo" : "Enxuto" },
        { metric: "Folha de Pagamento", valStr: `R$ ${metrics.payrollCost.toLocaleString("pt-BR")}`, pctStr: `${((metrics.payrollCost / (metrics.totalRevenue || 1)) * 100).toFixed(1)}%`, status: metrics.payrollCost / (metrics.totalRevenue || 1) > 0.23 ? "Carga Alta" : "Enxuto" },
        { metric: "EBITDA Conservado", valStr: `R$ ${metrics.ebitda.toLocaleString("pt-BR")}`, pctStr: `${metrics.initialMargin.toFixed(1)}%`, status: metrics.initialMargin > 15 ? "Excelente" : "Defasada" }
      ];

      pdf.addAbntTable(refCols, refRows, "Estatísticas Operacionais e Contábeis de Alocação");

      pdf.addPrimaryHeading("3. Gargalos Diagnosticados e Oportunidades");
      bottlenecks.forEach((b, idx) => {
        pdf.addParagraph(`${idx + 1}. ${b.title.toUpperCase()} (${b.severity.toUpperCase()}): ${b.text}`);
      });

      pdf.addPrimaryHeading("4. Modelagem de Melhoria e Soberania Líquida");
      pdf.addParagraph(
        "A partir da aplicação do modelo de simulação gerencial, as economias operacionais planejadas provocam " +
        "os seguintes reflexos no DRE e na estrutura contábil da organização:"
      );

      const savedCols = [
        { header: "Frente Otimizada", key: "front", width: 50 },
        { header: "% Ajuste", key: "pct", width: 25, align: "center" as const },
        { header: "Economia Mensal", key: "monthly", width: 42, align: "right" as const },
        { header: "Economia Anualizada", key: "annual", width: 43, align: "right" as const }
      ];

      const savedRows = [
        { front: "CMV de Insumos", pct: `${cmvOptimization}%`, monthly: `R$ ${simulationResults.cmvSaved.toLocaleString("pt-BR")}`, annual: `R$ ${(simulationResults.cmvSaved * 12).toLocaleString("pt-BR")}` },
        { front: "Logística de Envio", pct: `${logisticsOptimization}%`, monthly: `R$ ${simulationResults.logisticsSaved.toLocaleString("pt-BR")}`, annual: `R$ ${(simulationResults.logisticsSaved * 12).toLocaleString("pt-BR")}` },
        { front: "Licenças SaaS & APIs", pct: `${saasOptimization}%`, monthly: `R$ ${simulationResults.saasSaved.toLocaleString("pt-BR")}`, annual: `R$ ${(simulationResults.saasSaved * 12).toLocaleString("pt-BR")}` },
        { front: "Folha de Pagamento", pct: `${payrollOptimization}%`, monthly: `R$ ${simulationResults.payrollSaved.toLocaleString("pt-BR")}`, annual: `R$ ${(simulationResults.payrollSaved * 12).toLocaleString("pt-BR")}` },
        { front: "RESULTADO CONSOLIDADO", pct: "-", monthly: `R$ ${simulationResults.totalSavedMonthly.toLocaleString("pt-BR")}`, annual: `R$ ${simulationResults.totalSavedAnnual.toLocaleString("pt-BR")}` }
      ];

      pdf.addAbntTable(savedCols, savedRows, "Modelagem de Resgate Margem Líquida");

      pdf.addPrimaryHeading("5. Conclusão e Próximos Passos");
      pdf.addParagraph(
        "A análise atesta que o negócio possui oportunidades latentes de elevação de EBITDA " +
        `sem a necessidade imediata de novas captações. O controle cirúrgico de CMV ` +
        `e OPEX, aliado às taxas de eficiência otimizadas, reconquista anualmente R$ ${simulationResults.totalSavedAnnual.toLocaleString("pt-BR")} ` +
        `diretamente para o caixa, elevando a margem geral do período para um teto operacional de ${simulationResults.simulatedMargin.toFixed(1)}%.`
      );

      pdf.save(`Relatorio_Auditoria_Gargalos_${Date.now()}.pdf`);
      showToast("Relatório de Auditoria Operacional gerado com sucesso!", "success");
    } catch (e) {
      console.error(e);
      showToast("Erro ao exportar PDF de auditoria contábil.", "error");
    }
  };

  // Cores de criticidade
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-500 font-extrabold rounded-lg text-[9px] uppercase tracking-wider">Altíssimo Risco</span>;
      case "high":
        return <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold rounded-lg text-[9px] uppercase tracking-wider">Risco Elevado</span>;
      case "medium":
        return <span className="px-2 py-0.5 bg-yellow-600/10 border border-yellow-600/20 text-yellow-600 font-bold rounded-lg text-[9px] uppercase tracking-wider">Atenção</span>;
      case "low":
        return <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 font-bold rounded-lg text-[9px] uppercase tracking-wider">Risco Leve</span>;
      case "healthy":
        return <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-black rounded-lg text-[9px] uppercase tracking-wider">Padrão Ouro</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* HEADER SECTION PANEL */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5 matches-tab">
            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-[9px] text-orange-400 font-bold uppercase tracking-widest font-mono">
              <Percent size={10} className="animate-pulse" /> Auditoria Geral & Margens
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
              <Scale size={22} className="text-orange-500" /> Auditoria Operacional Inteligente
            </h2>
            <p className="text-slate-400 text-xs md:text-sm">
              Analise desvios operacionais das suas contas, simule resoluções de gargalos industriais, logísticos e de pessoal, e extraia lucro perdido de forma cirúrgica.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Seletor de Perfil */}
            <div className="bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 flex items-center">
              {[
                { id: "all", label: "Geral" },
                { id: "matriz", label: "Matriz" },
                { id: "filial", label: "Filial" }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedAuditProfile(opt.id as any);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    selectedAuditProfile === opt.id 
                      ? "bg-slate-950 text-white shadow-sm border border-slate-700" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Seletor de Mês do Audit */}
            <input
              type="month"
              value={format(selectedMonth, "yyyy-MM")}
              onChange={(e) => {
                sound.playClick();
                if (e.target.value) {
                  const [y, m] = e.target.value.split("-").map(Number);
                  setSelectedMonth(new Date(y, m - 1, 15));
                }
              }}
              className="bg-slate-800 border border-slate-700 text-slate-100 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl outline-hide focus:ring-1 focus:ring-orange-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* METRIC CARD BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Faturamento Bruto",
            icon: <TrendingUp size={16} className="text-emerald-500" />,
            value: metrics.totalRevenue,
            desc: "Receitas operacionais PJ digitais & físicas",
            color: "border-gray-150"
          },
          {
            title: "Custo de Insumos (CMV)",
            icon: <Activity size={16} className="text-yellow-600" />,
            value: metrics.cmvCost,
            desc: `Equivale a ${((metrics.cmvCost / (metrics.totalRevenue || 1)) * 100).toFixed(1)}% das receitas`,
            color: metrics.cmvCost / (metrics.totalRevenue || 1) > 0.32 ? "border-rose-300 bg-rose-50/20" : "border-gray-150"
          },
          {
            title: "Prazos & Logística",
            icon: <Briefcase size={16} className="text-blue-500" />,
            value: metrics.logisticsCost,
            desc: `Equivale a ${((metrics.logisticsCost / (metrics.totalRevenue || 1)) * 100).toFixed(1)}% das receitas`,
            color: metrics.logisticsCost / (metrics.totalRevenue || 1) > 0.045 ? "border-rose-300 bg-rose-50/20" : "border-gray-150"
          },
          {
            title: "EBITDA Conservado",
            icon: <DollarSign size={16} className="text-orange-500 animate-pulse" />,
            value: metrics.ebitda,
            desc: `Margem operacional atual de ${metrics.initialMargin.toFixed(1)}%`,
            color: "border-gray-150-accent"
          }
        ].map((c, i) => (
          <div key={i} className={cn("bg-white p-5 rounded-2xl border flex flex-col justify-between shadow-xs space-y-2", c.color)}>
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">{c.title}</span>
              {c.icon}
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xl font-bold font-sans tracking-tight text-gray-900">
                R$ {c.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h4>
              <p className="text-[9.5px] text-gray-500 leading-tight font-medium">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* DIAGNOSTIC BOOSTER (Left Column of dashboard) */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-gray-150 p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-gray-950 tracking-wider flex items-center gap-2">
              <ShieldAlert size={18} className="text-orange-500 animate-pulse" /> Desvios & Gargalos Contábeis Mapeados
            </h3>
            
            <p className="text-gray-600 text-xs leading-relaxed max-w-2xl">
              Nosso motor analisa o comportamento das despesas operacionais da empresa em tempo real contra limites saudáveis de benchmark do segmento de atuação. Abaixo estão os fatores de vazamento ativos em seu caixa.
            </p>

            <div className="space-y-4">
              {bottlenecks.map((b) => (
                <div 
                  key={b.id} 
                  className={cn(
                    "p-4 rounded-2xl border flex flex-col md:flex-row items-start gap-4 transition-all hover:bg-slate-50/50",
                    b.severity === "critical" ? "bg-red-50/20 border-red-200" :
                    b.severity === "high" ? "bg-rose-50/20 border-rose-200" :
                    b.severity === "medium" ? "bg-yellow-50/25 border-yellow-250" :
                    b.severity === "low" ? "bg-blue-50/20 border-blue-200" : "bg-emerald-50/20 border-emerald-250"
                  )}
                >
                  <div className="pt-0.5 shrink-0">
                    {b.severity === "healthy" ? (
                      <ShieldCheck className="text-emerald-500" size={20} />
                    ) : (
                      <ShieldAlert className={cn(
                        b.severity === "critical" || b.severity === "high" ? "text-rose-500" : "text-yellow-600"
                      )} size={20} />
                    )}
                  </div>

                  <div className="space-y-2 text-left flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-1.5">
                      <h4 className="font-extrabold uppercase text-xs text-gray-950 font-sans tracking-tight leading-none">{b.title}</h4>
                      <div className="flex items-center gap-1.5">
                        {b.impact > 0 && (
                          <span className="text-[10px] font-bold text-gray-500 font-mono">
                            Volume: R$ {b.impact.toLocaleString("pt-BR")}
                          </span>
                        )}
                        {getSeverityBadge(b.severity)}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-[11px] leading-relaxed select-none">
                      {b.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIMULATED RESULTS PREVIEW CHART */}
          <div className="space-y-3 pt-5 border-t border-gray-100">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Mapeamento de Recomposição de Sobra</h4>
            
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: "bold" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fontWeight: "semibold" }} tickLine={false} tickFormatter={(v) => `R$ ${v > 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <RechartsTooltip formatter={(v) => [`R$ ${Number(v).toLocaleString("pt-BR")}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                  <Bar dataKey="Valor Atual" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Projetado Otimizado" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* WORK BENCH OF RESOLUTION SLIDERS (Right Column of dashboard) */}
        <div className="lg:col-span-12 xl:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div className="space-y-0.5">
                <span className="text-[8.5px] font-extrabold uppercase text-orange-400 tracking-widest block font-mono">Sandbox Operacional</span>
                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                  <Sliders size={14} className="text-orange-500 animate-pulse" /> Simulador de Otimização Operacional
                </h3>
              </div>
              <button 
                onClick={handleResetFilters}
                className="p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/5 active:scale-95"
                title="Resetar Sliders"
              >
                <RefreshCw size={13} className="text-slate-400" />
              </button>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Arraste os marcadores para modelar reduções sistemáticas nos custos operacionais identificados pela auditoria. Veja o impacto imediato na saúde líquida consolidada.
            </p>

            <div className="space-y-4 pt-1">
              {/* CMV SLIDER */}
              <div className="space-y-1.5 p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-extrabold text-slate-300 uppercase tracking-tight">Negociação com Fornecedores (CMV)</span>
                  <span className="font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-black text-[9px] uppercase">-{cmvOptimization}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={cmvOptimization}
                  onChange={(e) => {
                    sound.playTick();
                    setCmvOptimization(Number(e.target.value));
                  }}
                  className="w-full accent-orange-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                  <span>Margem Bruta Intacta</span>
                  <span>Impacto: -R$ {simulationResults.cmvSaved.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/mês</span>
                </div>
              </div>

              {/* LOGISTICS SLIDER */}
              <div className="space-y-1.5 p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-extrabold text-slate-300 uppercase tracking-tight">Otimização de Rota & Frete</span>
                  <span className="font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-black text-[9px] uppercase">-{logisticsOptimization}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={logisticsOptimization}
                  onChange={(e) => {
                    sound.playTick();
                    setLogisticsOptimization(Number(e.target.value));
                  }}
                  className="w-full accent-orange-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                  <span>Sem afetar prazos</span>
                  <span>Impacto: -R$ {simulationResults.logisticsSaved.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/mês</span>
                </div>
              </div>

              {/* CLOUD & SAAS SLIDER */}
              <div className="space-y-1.5 p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-extrabold text-slate-300 uppercase tracking-tight">Corte de SaaS Creep & Cloud</span>
                  <span className="font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-black text-[9px] uppercase">-{saasOptimization}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="50"
                  step="2"
                  value={saasOptimization}
                  onChange={(e) => {
                    sound.playTick();
                    setSaasOptimization(Number(e.target.value));
                  }}
                  className="w-full accent-orange-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                  <span>Remover redundâncias administrativas</span>
                  <span>Impacto: -R$ {simulationResults.saasSaved.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/mês</span>
                </div>
              </div>

              {/* PAYROLL EFFICIENCY SLIDER */}
              <div className="space-y-1.5 p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-extrabold text-slate-300 uppercase tracking-tight">Capacidade Ociosa / Terceirização</span>
                  <span className="font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-black text-[9px] uppercase">-{payrollOptimization}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={payrollOptimization}
                  onChange={(e) => {
                    sound.playTick();
                    setPayrollOptimization(Number(e.target.value));
                  }}
                  className="w-full accent-orange-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                  <span>Flexibilização de horas de trabalho</span>
                  <span>Impacto: -R$ {simulationResults.payrollSaved.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/mês</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIMULATION LIVE RESULTS GRID */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 relative z-10">
            <h4 className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">RESULTADO DA MODELAGEM DE AUDITORIA OPERACIONAL</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850/60 text-left">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase block leading-none">Lucro Resgatado Mensal</span>
                <span className="text-base font-extrabold text-emerald-400 block mt-1 tracking-tight">R$ {simulationResults.totalSavedMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850/60 text-left">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase block leading-none">Lucro Resgatado Anual</span>
                <span className="text-base font-extrabold text-emerald-400 block mt-1 tracking-tight">R$ {simulationResults.totalSavedAnnual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* General progress efficiency score indicator dial */}
            <div className="space-y-1.5 text-left border-t border-slate-850 pt-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Índice de Eficiência Operacional</span>
                <span className="text-emerald-400 font-extrabold">{simulationResults.finalEfficiencyScore}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850/50">
                <motion.div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                  animate={{ width: `${simulationResults.finalEfficiencyScore}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-[9px] text-slate-500 font-medium">Reflete o padrão de economia de caixa em relação às despesas controláveis diagnosticadas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED ACTION REPORT */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1 text-left">
            <h3 className="text-sm font-black uppercase text-gray-950 tracking-wider flex items-center gap-2">
              <Cpu size={18} className="text-orange-500 animate-pulse" /> Copiloto Executivo Contador de Gargalos
            </h3>
            <p className="text-gray-500 text-xs">
              Gere o laudo corporativo de otimização operacional baseado nas contas contábeis de faturamento, insumos e OPEX consolidado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAISummary}
              disabled={isGeneratingAudit}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white active:scale-98 rounded-xl font-black uppercase text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isGeneratingAudit ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Mapeando Parâmetros...
                </>
              ) : (
                <>
                  <Zap size={13} className="text-orange-400 fill-orange-400 animate-pulse" />
                  Rodar Auditoria I.A.
                </>
              )}
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 rounded-xl font-black uppercase text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Download size={13} />
              Exportar Laudo PDF
            </button>
          </div>
        </div>

        {/* COMPILABLE AI REPORTS */}
        <AnimatePresence mode="wait">
          {aiCustomReport ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden text-left"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/[0.02] rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-4 max-w-full">
                <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase text-orange-400 tracking-wider">
                    <Sparkles size={11} className="animate-pulse" /> Parecer de Controle de Ociosidade & Eficiência
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">DAFNE ADVISORY v1.2</span>
                </div>
                
                {/* Visual markdown rendering summary */}
                <div className="space-y-2 text-slate-200 font-sans leading-relaxed text-xs">
                  {aiCustomReport.split("\n").map((line, idx) => {
                    const l = line.trim();
                    if (l.startsWith("###")) {
                      return <h4 key={idx} className="text-xs font-black text-white uppercase tracking-wider mt-4 text-orange-400">{l.replace("###", "").trim()}</h4>;
                    }
                    if (l.startsWith("**")) {
                      return <p key={idx} className="mt-2 text-[11.5px] font-bold text-orange-200">{l.replace(/\*\*/g, "")}</p>;
                    }
                    if (l.startsWith("-")) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 pl-3 text-[11px] text-slate-305">
                          <span className="text-orange-500 font-bold">•</span>
                          <span>{l.slice(1).trim()}</span>
                        </div>
                      );
                    }
                    return <p key={idx} className="text-[11px] text-slate-300">{l}</p>;
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="border border-dashed border-gray-250 p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-gray-150 flex items-center justify-center text-gray-400">
                <AlertCircle size={18} />
              </div>
              <div className="space-y-1">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-gray-950">Nenhuma Auditoria Ativa no Momento</h5>
                <p className="text-[11px] text-gray-500 max-w-sm">
                  Clique em <strong>"Rodar Auditoria I.A."</strong> para obter o parecer analítico personalizado da mentora Dafne IA para recomposição de sobras financeiras.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
