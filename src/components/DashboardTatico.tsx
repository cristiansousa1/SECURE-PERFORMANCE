import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Cpu, 
  Calendar, 
  DollarSign, 
  HelpCircle,
  FileText,
  Percent,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { useFinance } from "../contexts/FinanceContext";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import SlimMarkdown from "./SlimMarkdown";

export const DashboardTatico: React.FC = () => {
  const { 
    getDRE, 
    transactions, 
    profile, 
    showToast,
    isDemoMode 
  } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [timeWindow, setTimeWindow] = useState<"month" | "quarter" | "year">("month");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAuditReport, setAiAuditReport] = useState<string>("");
  const [showExplanation, setShowExplanation] = useState<string | null>(null);

  // Available months for selection (last 6 months)
  const availableMonths = useMemo(() => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      list.push(subMonths(new Date(), i));
    }
    return list;
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: profile?.currency || "BRL",
    }).format(val);
  };

  // Determine current period months
  const currentPeriodMonths = useMemo(() => {
    if (timeWindow === "month") {
      return [selectedMonth];
    } else if (timeWindow === "quarter") {
      return [
        selectedMonth,
        subMonths(selectedMonth, 1),
        subMonths(selectedMonth, 2),
      ];
    } else { // "year"
      const list = [];
      for (let i = 0; i < 12; i++) {
        list.push(subMonths(selectedMonth, i));
      }
      return list;
    }
  }, [selectedMonth, timeWindow]);

  // Determine previous period months for trend (apples-to-apples)
  const previousPeriodMonths = useMemo(() => {
    if (timeWindow === "month") {
      return [subMonths(selectedMonth, 1)];
    } else if (timeWindow === "quarter") {
      return [
        subMonths(selectedMonth, 3),
        subMonths(selectedMonth, 4),
        subMonths(selectedMonth, 5),
      ];
    } else { // "year"
      const list = [];
      for (let i = 12; i < 24; i++) {
        list.push(subMonths(selectedMonth, i));
      }
      return list;
    }
  }, [selectedMonth, timeWindow]);

  // Helper to aggregate DRE values for a set of months
  const getAggregatedVal = (label: string, months: Date[]) => {
    let total = 0;
    months.forEach((m) => {
      const dre = getDRE(m);
      const found = dre.find(
        (line) => line.label === label || line.label.includes(label)
      );
      if (found) {
        total += found.value;
      }
    });
    return total;
  };

  // 1. EXTRACT DATA FOR THE CURRENT PERIOD
  const currentDre = useMemo(() => {
    return getDRE(selectedMonth);
  }, [getDRE, selectedMonth]);

  const rob = getAggregatedVal("RECEITA OPERACIONAL BRUTA", currentPeriodMonths);
  const deductions = Math.abs(getAggregatedVal("(-) Deduções e Impostos", currentPeriodMonths));
  const rl = getAggregatedVal("(=) RECEITA OPERACIONAL LÍQUIDA", currentPeriodMonths);
  const cmv = Math.abs(getAggregatedVal("(-) Custos dos Produtos/Serviços (CMV/CPV) - Despesa Dedutível", currentPeriodMonths));
  const opex = Math.abs(getAggregatedVal("(-) Despesas Operacionais (OPEX)", currentPeriodMonths));
  const ebitda = getAggregatedVal("(=) EBITDA / RESULTADO OPERACIONAL", currentPeriodMonths);
  const resultadoLiquido = getAggregatedVal("(=) RESULTADO LÍQUIDO DO PERÍODO", currentPeriodMonths);
  const lucroBruto = getAggregatedVal("(=) LUCRO BRUTO", currentPeriodMonths) || (rl - cmv);

  // Percentages & Margins
  const margins = useMemo(() => {
    const robSafe = rob > 0 ? rob : 1;
    return {
      grossMargin: (lucroBruto / robSafe) * 100,
      opexEfficiency: (opex / robSafe) * 100,
      ebitdaMargin: (ebitda / robSafe) * 100,
      netMargin: (resultadoLiquido / robSafe) * 100,
    };
  }, [rob, lucroBruto, opex, ebitda, resultadoLiquido]);

  // 2. EXTRACT PREVIOUS PERIOD TO SHOW TRENDS
  const prevRob = getAggregatedVal("RECEITA OPERACIONAL BRUTA", previousPeriodMonths);
  const prevRl = getAggregatedVal("(=) RECEITA OPERACIONAL LÍQUIDA", previousPeriodMonths);
  const prevCmv = Math.abs(getAggregatedVal("(-) Custos dos Produtos/Serviços (CMV/CPV) - Despesa Dedutível", previousPeriodMonths));
  const prevOpex = Math.abs(getAggregatedVal("(-) Despesas Operacionais (OPEX)", previousPeriodMonths));
  const prevEbitda = getAggregatedVal("(=) EBITDA / RESULTADO OPERACIONAL", previousPeriodMonths);
  const prevResultadoLiquido = getAggregatedVal("(=) RESULTADO LÍQUIDO DO PERÍODO", previousPeriodMonths);
  const prevLucroBruto = getAggregatedVal("(=) LUCRO BRUTO", previousPeriodMonths) || (prevRl - prevCmv);

  // Calculate trends (percentage changes)
  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  const trends = useMemo(() => {
    return {
      rob: calcTrend(rob, prevRob),
      lucroBruto: calcTrend(lucroBruto, prevLucroBruto),
      opex: calcTrend(opex, prevOpex), // negative change is good (expenses decreased)
      ebitda: calcTrend(ebitda, prevEbitda),
      resultadoLiquido: calcTrend(resultadoLiquido, prevResultadoLiquido),
    };
  }, [rob, prevRob, lucroBruto, prevLucroBruto, opex, prevOpex, ebitda, prevEbitda, resultadoLiquido, prevResultadoLiquido]);

  // 3. MULTI-PERIOD EBITDA COMPARISON DATA FOR THE CHART
  const ebitdaChartData = useMemo(() => {
    const getEbitdaFromLines = (lines: any[]) => {
      const found = lines.find((l) => l.label === "(=) EBITDA / RESULTADO OPERACIONAL" || l.label.includes("EBITDA"));
      return found ? found.value : 0;
    };

    const getRobFromLines = (lines: any[]) => {
      const found = lines.find((l) => l.label === "RECEITA OPERACIONAL BRUTA");
      return found ? found.value : 0;
    };

    if (timeWindow === "month") {
      const m3 = subMonths(selectedMonth, 2);
      const m2 = subMonths(selectedMonth, 1);
      const m1 = selectedMonth;

      const dre3 = getDRE(m3);
      const dre2 = getDRE(m2);
      const dre1 = currentDre;

      const ebitda3 = getEbitdaFromLines(dre3);
      const ebitda2 = getEbitdaFromLines(dre2);
      const ebitda1 = getEbitdaFromLines(dre1);

      const rob3 = getRobFromLines(dre3);
      const rob2 = getRobFromLines(dre2);
      const rob1 = getRobFromLines(dre1);

      return [
        {
          monthName: format(m3, "MMM yy", { locale: ptBR }),
          EBITDA: ebitda3,
          Faturamento: rob3,
          Margem: rob3 > 0 ? (ebitda3 / rob3) * 100 : 0,
        },
        {
          monthName: format(m2, "MMM yy", { locale: ptBR }),
          EBITDA: ebitda2,
          Faturamento: rob2,
          Margem: rob2 > 0 ? (ebitda2 / rob2) * 100 : 0,
        },
        {
          monthName: format(m1, "MMM yy", { locale: ptBR }),
          EBITDA: ebitda1,
          Faturamento: rob1,
          Margem: rob1 > 0 ? (ebitda1 / rob1) * 100 : 0,
        },
      ];
    } else if (timeWindow === "quarter") {
      // Last 3 quarters
      const getQuarterData = (offset: number) => {
        const qMonths = [];
        for (let i = 0; i < 3; i++) {
          qMonths.push(subMonths(selectedMonth, offset * 3 + i));
        }
        let qEbitda = 0;
        let qRob = 0;
        qMonths.forEach(m => {
          const dre = getDRE(m);
          qEbitda += getEbitdaFromLines(dre);
          qRob += getRobFromLines(dre);
        });
        const label = `T-${offset} (${format(qMonths[2], "MMM", { locale: ptBR })}/${format(qMonths[0], "MMM", { locale: ptBR })})`;
        return {
          monthName: label,
          EBITDA: qEbitda,
          Faturamento: qRob,
          Margem: qRob > 0 ? (qEbitda / qRob) * 100 : 0,
        };
      };

      return [
        getQuarterData(2),
        getQuarterData(1),
        getQuarterData(0),
      ];
    } else {
      // Last 3 years
      const getYearData = (offset: number) => {
        const yMonths = [];
        for (let i = 0; i < 12; i++) {
          yMonths.push(subMonths(selectedMonth, offset * 12 + i));
        }
        let yEbitda = 0;
        let yRob = 0;
        yMonths.forEach(m => {
          const dre = getDRE(m);
          yEbitda += getEbitdaFromLines(dre);
          yRob += getRobFromLines(dre);
        });
        const label = `A-${offset} (${format(yMonths[11], "yy", { locale: ptBR })}/${format(yMonths[0], "yy", { locale: ptBR })})`;
        return {
          monthName: label,
          EBITDA: yEbitda,
          Faturamento: yRob,
          Margem: yRob > 0 ? (yEbitda / yRob) * 100 : 0,
        };
      };

      return [
        getYearData(2),
        getYearData(1),
        getYearData(0),
      ];
    }
  }, [getDRE, selectedMonth, currentDre, timeWindow]);

  const previousPeriodLabel = useMemo(() => {
    if (timeWindow === "month") return "Vs Mês Anterior";
    if (timeWindow === "quarter") return "Vs Trimestre Ant.";
    return "Vs Ano Anterior";
  }, [timeWindow]);

  const adjustedBillingGoal = useMemo(() => {
    if (!profile?.billingGoal) return null;
    if (timeWindow === "month") return profile.billingGoal;
    if (timeWindow === "quarter") return profile.billingGoal * 3;
    return profile.billingGoal * 12; // "year"
  }, [profile?.billingGoal, timeWindow]);

  // 4. GENERATING DETAILED AI AUDIT REPORT VIA GEMINI
  const runAiTacticalAudit = async () => {
    setIsAiLoading(true);
    setAiAuditReport("");
    try {
      const periodLabel = 
        timeWindow === "month" ? `mês de ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}` :
        timeWindow === "quarter" ? `trimestre finalizando em ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}` :
        `ano (12 meses) finalizando em ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}`;

      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": localStorage.getItem("dafne_user_email") || "",
        },
        body: JSON.stringify({
          message: `Dafne, como Engenheira de Inteligência Financeira e Mentora PJ, por favor faça um [RELATÓRIO DE AUDITORIA TÁTICA AVANÇADA] com base nos seguintes dados operacionais extraídos do nosso DRE para o período correspondente ao ${periodLabel} para a empresa ${profile?.companyName || "Minha Empresa"}:

INDICADORES EXTRAÍDOS:
1. Faturamento Operacional Bruto: ${formatCurrency(rob)} (Mudança vs Período Anterior: ${trends.rob.toFixed(1)}%)
2. Lucro Bruto / Margem de Contribuição: ${formatCurrency(lucroBruto)} (Margem: ${margins.grossMargin.toFixed(1)}%)
3. Despesas Operacionais (OPEX): ${formatCurrency(opex)} (Eficiência: ${margins.opexEfficiency.toFixed(1)}%)
4. EBITDA Operacional: ${formatCurrency(ebitda)} (Margem EBITDA: ${margins.ebitdaMargin.toFixed(1)}%)
5. Resultado Líquido Final: ${formatCurrency(resultadoLiquido)} (Margem Líquida: ${margins.netMargin.toFixed(1)}%)

HISTÓRICO RECENTE DO EBITDA (ÚLTIMOS 3 INTERVALOS TEMPORAIS):
- ${ebitdaChartData[0].monthName}: EBITDA ${formatCurrency(ebitdaChartData[0].EBITDA)} (Margem: ${ebitdaChartData[0].Margem.toFixed(1)}%)
- ${ebitdaChartData[1].monthName}: EBITDA ${formatCurrency(ebitdaChartData[1].EBITDA)} (Margem: ${ebitdaChartData[1].Margem.toFixed(1)}%)
- ${ebitdaChartData[2].monthName}: EBITDA ${formatCurrency(ebitdaChartData[2].EBITDA)} (Margem: ${ebitdaChartData[2].Margem.toFixed(1)}%)

Por favor, forneça em Markdown estruturado, polido e cirúrgico:
1. **Parecer Crítico do EBITDA**: Analise a tendência de EBITDA nos últimos 3 períodos (se está expandindo, comprimindo ou instável) e o que isso diz sobre a saúde da operação.
2. **Diagnóstico dos 5 KPIs**: Um diagnóstico curto de 1 parágrafo para cada um dos 5 indicadores chave.
3. **Plano de Ação Tático (3 Recomendações de Impacto)**: Forneça 3 passos de execução imediatos e aplicáveis focados no modelo de negócio (${profile?.businessSegment || "Serviço/Comércio"}).
Use seu tom profissional de Dafne: direto ao ponto, realista, sem introduções desnecessárias ou redundâncias decorativas.`,
          financialData: {
            businessSegment: profile?.businessSegment || "other",
            companyName: profile?.companyName || "Minha Empresa",
            totalIncome: rob,
            totalExpense: opex,
            balance: profile?.balance || 0,
          },
          neuralPrecision: 0.9,
          neuralTier: "quantum"
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const text = result.message || result.text || "";
        setAiAuditReport(text);
        showToast("Relatório de Auditoria Tática Neural gerado!", "success");
      } else {
        showToast("Erro ao conectar com o motor de IA. Usando diagnóstico tático local.", "warning");
      }
    } catch (err) {
      console.error(err);
      showToast("Falha técnica ao acessar a inteligência neural.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Local rule-based advisory triggers
  const localAdvice = useMemo(() => {
    const advices = [];
    if (rob === 0) {
      advices.push({
        type: "warning",
        title: "Faturamento Zero Detectado",
        text: "Não há registro de faturamento operacional bruto para o mês selecionado. Registre lançamentos para iniciar o monitoramento.",
      });
      return advices;
    }

    // EBITDA Margin check
    if (margins.ebitdaMargin < 10) {
      advices.push({
        type: "danger",
        title: "EBITDA Altamente Comprimido",
        text: `Sua margem EBITDA atual está em ${margins.ebitdaMargin.toFixed(1)}%, que está abaixo do limite saudável de 15%. Indica que a eficiência operacional está baixa ou seus preços não cobrem o OPEX.`,
      });
    } else if (margins.ebitdaMargin >= 25) {
      advices.push({
        type: "success",
        title: "Excelente Eficiência Operacional",
        text: `Sua margem EBITDA de ${margins.ebitdaMargin.toFixed(1)}% está muito saudável. A estrutura de custos está alinhada e as vendas geram excelente retorno operacional.`,
      });
    } else {
      advices.push({
        type: "info",
        title: "EBITDA Dentro dos Padrões de Giro",
        text: `Margem EBITDA operacional estabilizada em ${margins.ebitdaMargin.toFixed(1)}%. Mantenha o acompanhamento do OPEX para evitar vazamentos invisíveis de lucro bruto.`,
      });
    }

    // OPEX Check
    if (margins.opexEfficiency > 40) {
      advices.push({
        type: "warning",
        title: "Custo Fixo & OPEX Elevado",
        text: `Suas despesas operacionais consomem ${margins.opexEfficiency.toFixed(1)}% de todo o seu faturamento operacional bruto. Considere renegociar contratos ou automatizar processos para aliviar o caixa.`,
      });
    }

    // Profitability Check
    if (margins.netMargin < 0) {
      advices.push({
        type: "danger",
        title: "Prejuízo Líquido Corporativo",
        text: "O resultado final do período é negativo. Há custos de produtos/mercadorias ou despesas administrativas excessivas que ultrapassam a capacidade de tração das suas receitas.",
      });
    }

    // EBITDA Trend
    const last3Data = ebitdaChartData;
    if (last3Data[2].EBITDA < last3Data[1].EBITDA && last3Data[1].EBITDA < last3Data[0].EBITDA) {
      advices.push({
        type: "danger",
        title: "Tendência de Queda no EBITDA",
        text: "Alerta de compressão de lucratividade: o lucro operacional gerado antes de impostos e depreciações vem caindo consistentemente há 3 meses consecutivos.",
      });
    } else if (last3Data[2].EBITDA > last3Data[1].EBITDA && last3Data[1].EBITDA > last3Data[0].EBITDA) {
      advices.push({
        type: "success",
        title: "Trajetória de Crescimento Operacional",
        text: "Parabéns! O EBITDA da empresa apresenta expansão consistente mês após mês, validando o aumento de margem e ganho de escala.",
      });
    }

    return advices;
  }, [rob, margins, ebitdaChartData]);

  return (
    <div id="dashboard_tatico_container" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 text-white p-6 rounded-[2rem] border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10 text-left">
          <div className="flex items-center gap-2">
            <span className="bg-orange-500/15 text-orange-400 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase font-mono border border-orange-500/30">
              AUDITORIA TÁTICA CORPORATIVA
            </span>
            {isDemoMode && (
              <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full uppercase font-mono">
                SIMULADOR
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Activity className="text-orange-500" />
            Dashboard Tático de Performance PJ
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl font-medium">
            Métricas cruciais extraídas em tempo real diretamente da estrutura contábil e do DRE mensal. Monitore faturamento, margem operacional, OPEX e a curva temporal de EBITDA.
          </p>
        </div>

        {/* Period Selector & Month Picker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
          
          {/* Period Selector */}
          <div className="flex items-center bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800">
            <button
              onClick={() => {
                setTimeWindow("month");
                setAiAuditReport("");
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all font-mono cursor-pointer ${
                timeWindow === "month"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => {
                setTimeWindow("quarter");
                setAiAuditReport("");
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all font-mono cursor-pointer ${
                timeWindow === "quarter"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              Trimestre
            </button>
            <button
              onClick={() => {
                setTimeWindow("year");
                setAiAuditReport("");
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all font-mono cursor-pointer ${
                timeWindow === "year"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              Ano
            </button>
          </div>

          {/* Month Picker */}
          <div className="flex items-center gap-3 bg-zinc-950/80 p-2.5 rounded-2xl border border-zinc-800">
            <Calendar size={16} className="text-orange-400" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 font-mono leading-none">REFERÊNCIA</span>
              <select
                value={selectedMonth.toISOString()}
                onChange={(e) => {
                  setSelectedMonth(new Date(e.target.value));
                  setAiAuditReport(""); // Reset report on change
                }}
                className="bg-transparent border-none text-xs font-extrabold text-orange-400 focus:outline-none focus:ring-0 pr-6 uppercase font-mono cursor-pointer"
              >
                {availableMonths.map((m, idx) => (
                  <option key={idx} value={m.toISOString()} className="bg-zinc-900 text-white">
                    {format(m, "MMMM 'de' yyyy", { locale: ptBR })}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 1: THE 5 PRINCIPAL KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* KPI 1: ROB */}
        <div className="bg-zinc-900 border border-zinc-800 text-white p-5 rounded-[1.8rem] shadow-lg hover:border-zinc-700/80 transition-all flex flex-col justify-between text-left relative overflow-hidden group">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400 font-mono">1. FATURAMENTO OPERACIONAL (ROB)</span>
              <button 
                onClick={() => setShowExplanation(showExplanation === "rob" ? null : "rob")}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight font-mono text-zinc-100">
                {formatCurrency(rob)}
              </h3>
              <p className="text-[11px] font-bold text-zinc-400 mt-0.5">
                Total bruto de entradas registradas
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-4">
            <span className="text-[9px] font-black text-zinc-500 uppercase font-mono">{previousPeriodLabel}:</span>
            <div className={`flex items-center gap-1.5 text-xs font-extrabold ${trends.rob >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
              {trends.rob >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="font-mono">{trends.rob >= 0 ? "+" : ""}{trends.rob.toFixed(1)}%</span>
            </div>
          </div>
          {showExplanation === "rob" && (
            <div className="absolute inset-0 bg-zinc-950 p-4 rounded-[1.8rem] flex flex-col justify-between text-xs z-20">
              <div className="space-y-1.5">
                <p className="font-black text-orange-400 uppercase font-mono tracking-wider text-[10px]">Faturamento Bruto (ROB)</p>
                <p className="text-zinc-300 text-[10.5px] leading-relaxed">
                  Representa a totalidade de vendas brutas efetuadas antes de quaisquer deduções fiscais, devoluções, ou taxas operacionais de transação. É a métrica mãe do volume de tração do negócio.
                </p>
              </div>
              <button 
                onClick={() => setShowExplanation(null)}
                className="text-[10px] font-black uppercase text-orange-400 hover:text-orange-300 cursor-pointer text-right self-end mt-2"
              >
                Entendi
              </button>
            </div>
          )}
        </div>

        {/* KPI 2: LUCRO BRUTO / MARGEM CONTRIBUIÇÃO */}
        <div className="bg-zinc-900 border border-zinc-800 text-white p-5 rounded-[1.8rem] shadow-lg hover:border-zinc-700/80 transition-all flex flex-col justify-between text-left relative overflow-hidden group">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400 font-mono">2. LUCRO BRUTO PJ</span>
              <button 
                onClick={() => setShowExplanation(showExplanation === "gross" ? null : "gross")}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight font-mono text-emerald-400">
                {formatCurrency(lucroBruto)}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-zinc-400">Margem Bruta:</span>
                <span className="text-[11px] font-black text-emerald-400 font-mono">{margins.grossMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-4">
            <span className="text-[9px] font-black text-zinc-500 uppercase font-mono">{previousPeriodLabel}:</span>
            <div className={`flex items-center gap-1.5 text-xs font-extrabold ${trends.lucroBruto >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
              {trends.lucroBruto >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="font-mono">{trends.lucroBruto >= 0 ? "+" : ""}{trends.lucroBruto.toFixed(1)}%</span>
            </div>
          </div>
          {showExplanation === "gross" && (
            <div className="absolute inset-0 bg-zinc-950 p-4 rounded-[1.8rem] flex flex-col justify-between text-xs z-20">
              <div className="space-y-1.5">
                <p className="font-black text-emerald-400 uppercase font-mono tracking-wider text-[10px]">Lucro Bruto & Margem</p>
                <p className="text-zinc-300 text-[10.5px] leading-relaxed">
                  Faturamento líquido deduzido o CMV (Custo de Mercadoria Vendida) ou CPV. Mostra se seu markup de produto ou margem unitária de serviços é suficiente para sustentar as despesas de estrutura.
                </p>
              </div>
              <button 
                onClick={() => setShowExplanation(null)}
                className="text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 cursor-pointer text-right self-end mt-2"
              >
                Entendi
              </button>
            </div>
          )}
        </div>

        {/* KPI 3: OPEX */}
        <div className="bg-zinc-900 border border-zinc-800 text-white p-5 rounded-[1.8rem] shadow-lg hover:border-zinc-700/80 transition-all flex flex-col justify-between text-left relative overflow-hidden group">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400 font-mono">3. DESPESA OPERACIONAL (OPEX)</span>
              <button 
                onClick={() => setShowExplanation(showExplanation === "opex" ? null : "opex")}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight font-mono text-rose-400">
                {formatCurrency(opex)}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-zinc-400">Peso no Caixa:</span>
                <span className="text-[11px] font-black text-rose-400 font-mono">{margins.opexEfficiency.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-4">
            <span className="text-[9px] font-black text-zinc-500 uppercase font-mono">{previousPeriodLabel}:</span>
            {/* For OPEX, a positive change is bad (expenses increased), and negative is good */}
            <div className={`flex items-center gap-1.5 text-xs font-extrabold ${trends.opex <= 0 ? "text-emerald-400" : "text-rose-500"}`}>
              {trends.opex <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              <span className="font-mono">{trends.opex >= 0 ? "+" : ""}{trends.opex.toFixed(1)}%</span>
            </div>
          </div>
          {showExplanation === "opex" && (
            <div className="absolute inset-0 bg-zinc-950 p-4 rounded-[1.8rem] flex flex-col justify-between text-xs z-20">
              <div className="space-y-1.5">
                <p className="font-black text-rose-400 uppercase font-mono tracking-wider text-[10px]">OPEX (Despesas Operacionais)</p>
                <p className="text-zinc-300 text-[10.5px] leading-relaxed">
                  Agrega todos os custos de manutenção da empresa (aluguel, salários fixos, softwares de gestão, marketing, etc.) que não variam diretamente em função de cada venda efetuada. Deve ser mantido o mais baixo possível.
                </p>
              </div>
              <button 
                onClick={() => setShowExplanation(null)}
                className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 cursor-pointer text-right self-end mt-2"
              >
                Entendi
              </button>
            </div>
          )}
        </div>

        {/* KPI 4: EBITDA */}
        <div className="bg-zinc-900 border border-zinc-800 text-white p-5 rounded-[1.8rem] shadow-lg hover:border-zinc-700/80 transition-all flex flex-col justify-between text-left relative overflow-hidden group">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400 font-mono">4. EBITDA PJ OPERACIONAL</span>
              <button 
                onClick={() => setShowExplanation(showExplanation === "ebitda" ? null : "ebitda")}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <h3 className={`text-xl font-black tracking-tight font-mono ${ebitda >= 0 ? "text-orange-400" : "text-red-500"}`}>
                {formatCurrency(ebitda)}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-zinc-400">Margem EBITDA:</span>
                <span className={`text-[11px] font-black font-mono ${ebitda >= 0 ? "text-orange-400" : "text-red-500"}`}>{margins.ebitdaMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-4">
            <span className="text-[9px] font-black text-zinc-500 uppercase font-mono">{previousPeriodLabel}:</span>
            <div className={`flex items-center gap-1.5 text-xs font-extrabold ${trends.ebitda >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
              {trends.ebitda >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="font-mono">{trends.ebitda >= 0 ? "+" : ""}{trends.ebitda.toFixed(1)}%</span>
            </div>
          </div>
          {showExplanation === "ebitda" && (
            <div className="absolute inset-0 bg-zinc-950 p-4 rounded-[1.8rem] flex flex-col justify-between text-xs z-20">
              <div className="space-y-1.5">
                <p className="font-black text-orange-400 uppercase font-mono tracking-wider text-[10px]">EBITDA Operacional</p>
                <p className="text-zinc-300 text-[10.5px] leading-relaxed">
                  O lucro gerado pela operação em si, desconsiderando custos de impostos estaduais, juros de empréstimos, depreciação de maquinário e despesas financeiras. Mostra a real capacidade de geração de caixa da atividade operacional pura.
                </p>
              </div>
              <button 
                onClick={() => setShowExplanation(null)}
                className="text-[10px] font-black uppercase text-orange-400 hover:text-orange-300 cursor-pointer text-right self-end mt-2"
              >
                Entendi
              </button>
            </div>
          )}
        </div>

        {/* KPI 5: NET PROFIT */}
        <div className="bg-zinc-900 border border-zinc-800 text-white p-5 rounded-[1.8rem] shadow-lg hover:border-zinc-700/80 transition-all flex flex-col justify-between text-left relative overflow-hidden group">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400 font-mono">5. RESULTADO LÍQUIDO (LUCRO)</span>
              <button 
                onClick={() => setShowExplanation(showExplanation === "net" ? null : "net")}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <h3 className={`text-xl font-black tracking-tight font-mono ${resultadoLiquido >= 0 ? "text-orange-400" : "text-red-500"}`}>
                {formatCurrency(resultadoLiquido)}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-zinc-400">Margem Líquida:</span>
                <span className={`text-[11px] font-black font-mono ${resultadoLiquido >= 0 ? "text-orange-400" : "text-red-500"}`}>{margins.netMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-4">
            <span className="text-[9px] font-black text-zinc-500 uppercase font-mono">{previousPeriodLabel}:</span>
            <div className={`flex items-center gap-1.5 text-xs font-extrabold ${trends.resultadoLiquido >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
              {trends.resultadoLiquido >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="font-mono">{trends.resultadoLiquido >= 0 ? "+" : ""}{trends.resultadoLiquido.toFixed(1)}%</span>
            </div>
          </div>
          {showExplanation === "net" && (
            <div className="absolute inset-0 bg-zinc-950 p-4 rounded-[1.8rem] flex flex-col justify-between text-xs z-20">
              <div className="space-y-1.5">
                <p className="font-black text-orange-400 uppercase font-mono tracking-wider text-[10px]">Resultado Líquido do Período</p>
                <p className="text-zinc-300 text-[10.5px] leading-relaxed">
                  O lucro de fato do sócio ao fim de todas as deduções imagináveis: operacionais, impostos totais de faturamento (DAS), eventuais despesas não operacionais e aportes para investimentos PJ. É a métrica de dividendos.
                </p>
              </div>
              <button 
                onClick={() => setShowExplanation(null)}
                className="text-[10px] font-black uppercase text-orange-400 hover:text-orange-300 cursor-pointer text-right self-end mt-2"
              >
                Entendi
              </button>
            </div>
          )}
        </div>

      </div>

      {/* SECTION 2: CHARTS & METRICS TABLE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* EBITDA Bar Chart */}
        <div className="col-span-1 lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-left">
            <div>
              <h4 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
                Histórico do EBITDA PJ ({timeWindow === "month" ? "Últimos 3 Meses" : timeWindow === "quarter" ? "Últimos 3 Trimestres" : "Últimos 3 Anos"})
              </h4>
              <p className="text-[11.5px] text-zinc-400 font-medium">
                Comparação sequencial de lucratividade operacional e margem EBITDA de forma automática.
              </p>
            </div>
            
            <span className="bg-zinc-850 px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">
              CURVA TEMPORAL TÁTICA
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ebitdaChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="ebitdaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="ebitdaNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="monthName" 
                  stroke="#71717a" 
                  fontSize={10.5} 
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10.5} 
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
                    return `R$ ${val}`;
                  }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)", radius: 12 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isNeg = data.EBITDA < 0;
                      return (
                        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 shadow-2xl text-left space-y-2">
                          <p className="text-[11px] font-black tracking-widest uppercase text-zinc-500 font-mono">
                            {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR }).split("de")[0]} {data.monthName}
                          </p>
                          <div className="space-y-1 font-mono">
                            <div className="flex justify-between gap-6 text-[11px]">
                              <span className="text-zinc-400">EBITDA:</span>
                              <span className={`font-black ${isNeg ? "text-rose-400" : "text-orange-400"}`}>
                                {formatCurrency(data.EBITDA)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-6 text-[11px]">
                              <span className="text-zinc-400">Faturamento:</span>
                              <span className="font-bold text-zinc-300">
                                {formatCurrency(data.Faturamento)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-6 text-[11px] border-t border-zinc-900 pt-1 mt-1">
                              <span className="text-zinc-400">Margem EBITDA:</span>
                              <span className={`font-black ${isNeg ? "text-rose-400" : "text-emerald-400"}`}>
                                {data.Margem.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="EBITDA" 
                  radius={[12, 12, 0, 0]}
                  maxBarSize={60}
                >
                  {ebitdaChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.EBITDA >= 0 ? "url(#ebitdaGradient)" : "url(#ebitdaNegativeGradient)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mini Table comparing the numbers */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/40 p-1">
            <table className="w-full text-left text-[11px] font-mono leading-relaxed">
              <thead className="bg-zinc-950 text-zinc-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-2.5 px-4 rounded-l-xl">
                    {timeWindow === "month" ? "MÊS" : timeWindow === "quarter" ? "TRIMESTRE" : "ANO"}
                  </th>
                  <th className="py-2.5 px-3 text-right">FATURAMENTO (ROB)</th>
                  <th className="py-2.5 px-3 text-right">EBITDA PJ</th>
                  <th className="py-2.5 px-4 text-right rounded-r-xl">MARGEM OPERACIONAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {ebitdaChartData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/35 transition-all">
                    <td className="py-3 px-4 font-bold text-white uppercase">{item.monthName}</td>
                    <td className="py-3 px-3 text-right">{formatCurrency(item.Faturamento)}</td>
                    <td className={`py-3 px-3 text-right font-bold ${item.EBITDA >= 0 ? "text-orange-400" : "text-rose-500"}`}>
                      {formatCurrency(item.EBITDA)}
                    </td>
                    <td className={`py-3 px-4 text-right font-black ${item.EBITDA >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                      {item.Margem.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Local Strategy Advisor Panels */}
        <div className="col-span-1 lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl space-y-4 text-left">
          <div className="space-y-1">
            <h4 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldCheck className="text-orange-500" size={18} />
              Diagnóstico de Saúde PJ
            </h4>
            <p className="text-[11.5px] text-zinc-400 font-medium">
              Regras táticas de consistência que emitem alertas imediatos baseados nos dados atuais do DRE.
            </p>
          </div>

          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {localAdvice.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
                Registre receitas operacionais ou despesas corporativas para desencadear as análises de saúde de caixa de forma automatizada.
              </div>
            ) : (
              localAdvice.map((adv, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-2xl border flex gap-3 ${
                    adv.type === "danger" 
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-300" 
                      : adv.type === "warning"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                        : adv.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          : "bg-zinc-850 border-zinc-800 text-zinc-300"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {adv.type === "danger" && <AlertTriangle size={16} className="text-rose-400 animate-pulse" />}
                    {adv.type === "warning" && <AlertTriangle size={16} className="text-amber-400" />}
                    {adv.type === "success" && <CheckCircle2 size={16} className="text-emerald-400" />}
                    {adv.type === "info" && <Info size={16} className="text-blue-400" />}
                  </div>
                  <div className="space-y-1 text-left">
                    <h5 className="text-[11.5px] font-black uppercase tracking-wider">{adv.title}</h5>
                    <p className="text-[10.5px] font-medium leading-relaxed opacity-85">{adv.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
            <h5 className="font-extrabold uppercase text-[10px] text-zinc-400 tracking-wider font-mono">METAS CORPORATIVAS PJ</h5>
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-500">Meta Faturamento:</span>
              <span className="font-mono font-bold text-white">
                {profile?.billingGoal ? formatCurrency(profile.billingGoal) : "Não definida"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-zinc-900">
              <span className="text-zinc-500">Progresso Atual:</span>
              <span className="font-mono font-black text-orange-400">
                {profile?.billingGoal && rob > 0 ? `${((rob / profile.billingGoal) * 100).toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 3: DEEP AI STRATEGIC AUDIT PANEL */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.2rem] p-6 shadow-xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-5 mb-5 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500/10 text-orange-400 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase font-mono">
                MENTORIA NEURAL DAFNE CO-PILOT
              </span>
              <span className="text-zinc-500 font-mono text-[10px]">Model: Gemini-3.5-Flash</span>
            </div>
            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
              <Sparkles className="text-orange-500" size={18} />
              Auditoria Tática Avançada por IA
            </h3>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              Solicite uma análise profunda baseada na estrutura de EBITDA, OPEX e CMV dos últimos 3 meses. Nossa inteligência neural simulará cortes operacionais e recomendará 3 planos de ação táticos cirúrgicos.
            </p>
          </div>

          <button
            onClick={runAiTacticalAudit}
            disabled={isAiLoading || rob === 0}
            className={`py-3 px-5 rounded-2xl text-white font-black uppercase text-xs tracking-wider flex items-center gap-2.5 transition-all shadow-lg shrink-0 ${
              rob === 0
                ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            }`}
          >
            {isAiLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Auditando DRE PJ...</span>
              </>
            ) : (
              <>
                <Cpu size={15} />
                <span>Gerar Parecer Estratégico</span>
              </>
            )}
          </button>
        </div>

        {/* IA Response Output */}
        {aiAuditReport ? (
          <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-850 max-h-[500px] overflow-y-auto relative z-10 font-sans prose prose-invert prose-orange max-w-none text-zinc-300 text-xs text-left">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
              <span className="text-[10px] font-black tracking-wider uppercase text-orange-400 font-mono flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                RELATÓRIO DE AUDITORIA DISPONÍVEL
              </span>
              <button 
                onClick={() => setAiAuditReport("")}
                className="text-[10px] font-black text-zinc-500 hover:text-zinc-300 uppercase font-mono cursor-pointer"
              >
                Limpar Relatório
              </button>
            </div>
            <div className="markdown-body">
              <SlimMarkdown text={aiAuditReport} />
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950/40 rounded-2xl p-8 border border-zinc-850/60 text-center space-y-2 relative z-10">
            {isAiLoading ? (
              <div className="space-y-3.5 max-w-sm mx-auto">
                <div className="flex justify-center">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-orange-500/10 border-t-orange-500 animate-spin" />
                    <Cpu className="absolute text-orange-500 animate-pulse" size={18} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-white uppercase tracking-wider animate-pulse">Consultando Redes Neurais...</p>
                  <p className="text-[10.5px] text-zinc-500 font-medium">Extraindo índices marginais, calculando projeções OPEX e compilando contra-medidas financeiras PJ.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-w-md mx-auto text-zinc-400 py-3">
                <HelpCircle className="mx-auto text-zinc-600" size={36} />
                <div className="space-y-1">
                  <p className="text-xs font-black text-zinc-300 uppercase tracking-widest">Nenhum Parecer Neural Solicitado</p>
                  <p className="text-[11px] font-medium leading-relaxed text-zinc-500">
                    {rob === 0 
                      ? "O faturamento atual está em R$ 0,00. Registre lançamentos para liberar a geração do diagnóstico tático corporativo avançado."
                      : "Clique no botão acima para iniciar a auditoria tática baseada no EBITDA do trimestre. O processo leva em média de 3 a 5 segundos."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
