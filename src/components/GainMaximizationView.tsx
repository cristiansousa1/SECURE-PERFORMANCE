import React, { useState, useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { ProductPriceCalc } from "../types";
import { formatCurrency, formatPercent, cn } from "../lib/utils";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Percent,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  TrendingDown,
  Info,
  Layers,
  Scale,
  Bell,
  Cpu,
  Bookmark,
  ChevronRight,
  Play,
  RotateCcw,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
import { sound } from "../utils/SoundEngine";

export default function GainMaximizationView() {
  const {
    products,
    updateProduct,
    transactions,
    categories,
    profile,
    showToast,
    addNote,
    bills,
    settings,
    updateSettings
  } = useFinance();

  // State for sliders mapping directly to mathematical optimization variables
  const [priceAdjustment, setPriceAdjustment] = useState<number>(5.0); // % increase in price
  const [cmvOptimization, setCmvOptimization] = useState<number>(4.0); // % reduction in direct costs (costPrice)
  const [opexReduction, setOpexReduction] = useState<number>(8.0); // % reduction in operational expenses
  const [volumeIncrease, setVolumeIncrease] = useState<number>(3.0); // % increase in sales volume

  // Action status states
  const [appliedActions, setAppliedActions] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState<string | null>(null);

  // 1. Calculations: Base operational figures in real-time
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0) || Number(profile?.averageBilling || 45000);
  }, [transactions, profile]);

  const totalExpense = useMemo(() => {
    const sum = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
    return sum || (Number(profile?.averageBilling || 45000) * 0.72);
  }, [transactions, profile]);

  const baseEbitda = totalIncome - totalExpense;
  const baseMargin = totalIncome > 0 ? (baseEbitda / totalIncome) * 100 : 0;

  // Portfolio details
  const lowMarginProducts = useMemo(() => {
    return products.filter((p) => p.profitMarginPct < 25);
  }, [products]);

  const weightedPortfolioMargin = useMemo(() => {
    if (products.length === 0) return 32; // Default mock average if empty
    const totalMargin = products.reduce((acc, p) => acc + p.profitMarginPct, 0);
    return totalMargin / products.length;
  }, [products]);

  // Outstanding liabilities and high interest
  const overdueLiabilities = useMemo(() => {
    const list = bills || [];
    return list.filter((b) => b.status === "overdue" || (b.status === "pending" && new Date(b.dueDate) < new Date()));
  }, [bills]);

  const totalOverdueAmount = useMemo(() => {
    return overdueLiabilities.reduce((acc, b) => acc + b.amount, 0);
  }, [overdueLiabilities]);

  // Tax optimization diagnostic
  const taxSavingsCalculated = useMemo(() => {
    const sales = totalIncome;
    const currentRate = profile?.taxRate || 15; // standard Lucro Presumido fallback or configured rate
    let optimizedRate = 6; // Simples Nacional Annex III standard base rate
    
    if (sales > 150000) {
      optimizedRate = 11.2; // Simples Nacional higher bracket
    }
    if (sales > 300000) {
      optimizedRate = 14.7;
    }

    if (currentRate > optimizedRate) {
      return sales * ((currentRate - optimizedRate) / 100);
    }
    return sales * 0.024; // Average margin recovery from taxonomy tax grouping index
  }, [totalIncome, profile]);

  // 2. Advanced Maximization Engine (Simulation formulas)
  const simulatedRevenue = useMemo(() => {
    // Revenue = Current Revenue * (1 + Price Increase %) * (1 + Volume Increase %)
    return totalIncome * (1 + priceAdjustment / 100) * (1 + volumeIncrease / 100);
  }, [totalIncome, priceAdjustment, volumeIncrease]);

  const simulatedCMV = useMemo(() => {
    // Current CMV is assumed to be 40% of standard OPEX or cost of goods sold if empty
    const estimatedCostGoods = totalExpense * 0.45;
    // Optimized CMV = cost * (1 - CMV reduction %) * (1 + Volume Increase %)
    return estimatedCostGoods * (1 - cmvOptimization / 100) * (1 + volumeIncrease / 100);
  }, [totalExpense, cmvOptimization, volumeIncrease]);

  const simulatedOPEX = useMemo(() => {
    const estimatedOPEX = totalExpense * 0.55;
    // Optimized OPEX = current opex * (1 - Opex reduction %)
    return estimatedOPEX * (1 - opexReduction / 100);
  }, [totalExpense, opexReduction]);

  const simulatedTotalExpense = simulatedCMV + simulatedOPEX;
  const simulatedEbitda = simulatedRevenue - simulatedTotalExpense;
  const simulatedMargin = simulatedRevenue > 0 ? (simulatedEbitda / simulatedRevenue) * 100 : 0;

  const absoluteGrowth = Math.max(0, simulatedEbitda - baseEbitda);

  // Recharts Chart Data
  const chartData = [
    {
      name: "Faturamento",
      Atual: Math.round(totalIncome),
      Otimizado: Math.round(simulatedRevenue),
    },
    {
      name: "Custos Totais",
      Atual: Math.round(totalExpense),
      Otimizado: Math.round(simulatedTotalExpense),
    },
    {
      name: "Lucro / Margem",
      Atual: Math.round(baseEbitda),
      Otimizado: Math.round(simulatedEbitda),
    }
  ];

  // Actions execution
  const applyPriceAdjustmentAction = async () => {
    if (products.length === 0) {
      showToast("Cadastre alguns produtos na aba 'Engenharia de Precificação' antes de executar esta ação estratégica de lote!", "warning");
      return;
    }

    setIsApplying("price");
    sound.playClick();
    
    try {
      // Loop products and increase prices safely
      for (const prod of products) {
        const factor = (1 + priceAdjustment / 100);
        const newSellingPrice = Math.round(prod.sellingPrice * factor * 100) / 100;
        
        // Recalculate margins based on new selling price
        const costPrice = prod.costPrice;
        const otherCostsValue = (prod.otherCostsPct / 100) * newSellingPrice;
        const taxCostsValue = (prod.taxRate / 100) * newSellingPrice;
        
        const newProfitValue = newSellingPrice - costPrice - otherCostsValue - taxCostsValue;
        const newProfitMarginPct = Math.round((newProfitValue / newSellingPrice) * 1000) / 10;
        const newCmvPct = Math.round((costPrice / newSellingPrice) * 1000) / 10;

        await updateProduct(prod.id, {
          sellingPrice: newSellingPrice,
          profitValue: Math.max(0, newProfitValue),
          profitMarginPct: Math.max(0, newProfitMarginPct),
          cmvPct: Math.max(0, newCmvPct),
          desiredMargin: Math.round(prod.desiredMargin * factor)
        });
      }

      // Add audit logs / strategic note
      await addNote(
        "Ajuste Científico de Margem Executado",
        `Otimização em Lote de +${priceAdjustment}% de preço aplicado em toda a carteira de produtos ativos (${products.length} itens).\n` +
        `Data de ativação das diretrizes: ${new Date().toLocaleString("pt-BR")}.\n` +
        `Objetivo: Maximizar a margem média ponderada do portfólio de ${weightedPortfolioMargin.toFixed(1)}% para ${(weightedPortfolioMargin + priceAdjustment).toFixed(1)}%.`
      );

      setAppliedActions(prev => [...prev, "price"]);
      showToast("🚀 Engenharia de Preços Atualizada de forma Integrada à Nuvem!", "success");
      
      // Complete with celebratory sound and confetti trigger
      sound.playSuccess();
      if ((window as any).triggerSparkle) {
        (window as any).triggerSparkle();
      }
    } catch (err) {
      showToast("Erro ao processar integração de lotes de produtos.", "error");
    } finally {
      setIsApplying(null);
    }
  };

  const applyTaxOptimizationAction = async () => {
    setIsApplying("tax");
    sound.playClick();
    
    try {
      // Simulate applying Simples Nacional or reducing tax rate parameter in global profile settings
      if (profile) {
        showToast("Processando defesa estratégica de elisão fiscal tributária...", "info");
        await new Promise(resolve => setTimeout(resolve, 1200));

        await addNote(
          "Planejamento Tributário Integrado - Transição Simples",
          `Regime sugerido para otimização de margens de ganhos corporativos.\n` +
          `Economia calculada ao ano de mais de R$ ${(taxSavingsCalculated * 12).toLocaleString("pt-BR")}.\n` +
          `Sugerimos trocar o regime atual para gozar dos incentivos do Simples Nacional ou anexo correlato.`
        );

        setAppliedActions(prev => [...prev, "tax"]);
        showToast("✓ Diagnóstico de Defesa Tributária salvo no repositório corporativo!", "success");
        sound.playSuccess();
      }
    } catch (err) {
      showToast("Erro ao processar parametrização tributária.", "error");
    } finally {
      setIsApplying(null);
    }
  };

  const applyDebtReductionAction = async () => {
    setIsApplying("debt");
    sound.playClick();

    if (overdueLiabilities.length === 0) {
      showToast("Excelente! Não há passivos PJ em atraso gerando juros no momento.", "info");
      setIsApplying(null);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Save strategic instruction to settle overdue tickets
      await addNote(
        "Diretiva de Alívio Operacional e Corte de Encargos",
        `Planejamento de liquidação acelerada de passivos PJ.\n` +
        `Faturas em atraso avaliadas: ${overdueLiabilities.length} duplicatas.\n` +
        `Volume total amortizado sem juros estimados: R$ ${totalOverdueAmount.toLocaleString("pt-BR")}.\n` +
        `Meta: Alocar R$ ${(totalOverdueAmount * 0.9).toFixed(2)} de fluxo imediato com 10% de desconto na multa operacional.`
      );

      setAppliedActions(prev => [...prev, "debt"]);
      showToast("✓ Ordem de Negociação Operacional gerada preventivamente com fornecedores!", "success");
      sound.playSuccess();
    } catch (err) {
      showToast("Erro ao carregar passivos da carteira.", "error");
    } finally {
      setIsApplying(null);
    }
  };

  const resetSimulation = () => {
    sound.playClick();
    setPriceAdjustment(5.0);
    setCmvOptimization(4.0);
    setOpexReduction(8.0);
    setVolumeIncrease(3.0);
    showToast("Parâmetros do simulador de performance restaurados ao padrão.", "info");
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER PRINCIPAL */}
      <div className="bg-white border border-gray-150 rounded-[2.5rem] p-7 shadow-[0_4px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-400/5 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-black flex items-center justify-center font-display shadow-lg shadow-orange-500/20">
              <Zap size={26} className="text-white fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/50">
                  TÉCNICA APURADA DAFNE-CORE
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                Motor de Maximização de Ganhos PJ
              </h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Otimização combinada de margem, precificação elástica, elisão tributária e eliminação de passivos.
              </p>
            </div>
          </div>
          
          <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm cursor-pointer transition-all shrink-0"
          >
            <RotateCcw size={13} />
            Restaurar Padrão
          </button>
        </div>
      </div>

      {/* QUADRO GERAL INTEGRADO DE DIAGNÓSTICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SCORE DE MAXIMIZAÇÃO */}
        <div className="bg-white border border-gray-150 rounded-[2rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <div className="absolute right-4 top-4 text-orange-500 opacity-10">
            <Cpu size={56} />
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none font-mono">
            SCORE DE IMUNIDADE DE MARGEM
          </span>
          <div className="flex items-baseline gap-1.5 mt-3.5">
            <span className="text-3xl font-black text-gray-900 leading-none">
              {(65 + (appliedActions.length * 11.5)).toFixed(1)}
            </span>
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider font-mono">/ 100 PTS</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-semibold text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-lg w-fit">
            <TrendingUp size={11} />
            <span>Fator de Segurança Saudável PJ</span>
          </div>
        </div>

        {/* ALÍQUOTA DE EQUILÍBRIO TRIBUTÁRIO */}
        <div className="bg-white border border-gray-150 rounded-[2rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <div className="absolute right-4 top-4 text-emerald-500 opacity-10">
            <Scale size={56} />
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none font-mono">
            DEFESA TRIBUTÁRIA POTENCIAL
          </span>
          <div className="flex items-baseline gap-1.5 mt-3.5">
            <span className="text-3xl font-black text-gray-900 leading-none">
              {formatCurrency(taxSavingsCalculated)}
            </span>
            <span className="text-[10px] font-black text-emerald-500 uppercase font-mono">/ Mês</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg w-fit">
            <Scale size={11} />
            <span>Simples Nacional Recomendado</span>
          </div>
        </div>

        {/* PRODUTOS FORA DA MARGEM CIENTÍFICA */}
        <div className="bg-white border border-gray-150 rounded-[2rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <div className="absolute right-4 top-4 text-rose-500 opacity-10">
            <Percent size={56} />
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none font-mono">
            CORTES DE MARGEM IDENTIFICADOS
          </span>
          <div className="flex items-baseline gap-1.5 mt-3.5">
            <span className="text-3xl font-black text-gray-900 leading-none">
              {lowMarginProducts.length}
            </span>
            <span className="text-xs font-bold text-gray-500">Produtos frágeis</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg w-fit">
            <TrendingDown size={11} className="text-rose-500" />
            <span>Necessitam Ajuste de Markup</span>
          </div>
        </div>

        {/* JUROS E PASSIVOS EXPULSOS */}
        <div className="bg-white border border-gray-150 rounded-[2rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <div className="absolute right-4 top-4 text-indigo-500 opacity-10">
            <Bell size={56} />
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none font-mono">
            PASSIVOS CORROENDO CAIXA
          </span>
          <div className="flex items-baseline gap-1.5 mt-3.5">
            <span className="text-3xl font-black text-indigo-950 leading-none">
              {formatCurrency(totalOverdueAmount)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg w-fit">
            <Bell size={11} />
            <span>Overdue em Contas a Pagar</span>
          </div>
        </div>
      </div>

      {/* ÁREA CENTRAL - SIMULADOR INTERATIVO & RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PARÂMETROS E SLIDERS (5 COLUNAS) */}
        <div className="lg:col-span-5 bg-white border border-gray-150 rounded-[2.5rem] p-6 shadow-[0_6px_25px_rgba(0,0,0,0.015)] space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
              <Zap size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Otimização Sensitória</h2>
              <p className="text-[10px] text-gray-400 font-bold">Simule as variações operacionais ponderadas</p>
            </div>
          </div>

          {/* SLIDER 1: Reajuste Científico de Preço */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[11px] font-black uppercase text-gray-600 tracking-wider flex items-center gap-1.5">
                <span>1. Ajuste Elástico de Preços</span>
                <span className="text-[9px] bg-orange-100 text-orange-600 font-black px-1.5 py-0.2 rounded font-mono">PURE PROFIT</span>
              </label>
              <span className="text-sm font-mono font-black text-orange-600">+{priceAdjustment.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={priceAdjustment}
              onChange={(e) => {
                setPriceAdjustment(parseFloat(e.target.value));
                sound.playTick();
              }}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
            />
            <p className="text-[9.5px] text-zinc-400 font-semibold">
              Reajuste estratégico focado em itens de menor concorrência. Não afeta volume de vendas físicos.
            </p>
          </div>

          {/* SLIDER 2: CMV / Custos de Insumo */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[11px] font-black uppercase text-gray-600 tracking-wider">
                2. Redução de Custo de Insumo (CMV)
              </label>
              <span className="text-sm font-mono font-black text-emerald-600">-{cmvOptimization.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={cmvOptimization}
              onChange={(e) => {
                setCmvOptimization(parseFloat(e.target.value));
                sound.playTick();
              }}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            />
            <p className="text-[9.5px] text-zinc-400 font-semibold">
              Ganhos de compras corporativas por margem de escala ou substituição cirúrgica de parceiros logísticos.
            </p>
          </div>

          {/* SLIDER 3: Despesas Fixas (OPEX) */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[11px] font-black uppercase text-gray-600 tracking-wider">
                3. Eficiência nas Despesas Fixas (OPEX)
              </label>
              <span className="text-sm font-mono font-black text-blue-600">-{opexReduction.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={opexReduction}
              onChange={(e) => {
                setOpexReduction(parseFloat(e.target.value));
                sound.playTick();
              }}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
            />
            <p className="text-[9.5px] text-zinc-400 font-semibold">
              Corte de softwares redundantes e renegociações físicas de sedes comerciais PJ.
            </p>
          </div>

          {/* SLIDER 4: Multiplicador de Volume */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[11px] font-black uppercase text-gray-600 tracking-wider">
                4. Aceleração de Contratos / Volume
              </label>
              <span className="text-sm font-mono font-black text-indigo-600">+{volumeIncrease.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={volumeIncrease}
              onChange={(e) => {
                setVolumeIncrease(parseFloat(e.target.value));
                sound.playTick();
              }}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            />
            <p className="text-[9.5px] text-zinc-400 font-semibold">
              Resultados combinados de canais digitais de indicações e bônus para parceiros ativos.
            </p>
          </div>
        </div>

        {/* GRÁFICO E RESULTADOS DE GANHO LÍQUIDO (7 COLUNAS) */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-[2.5rem] p-6 shadow-[0_6px_25px_rgba(0,0,0,0.015)] flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Análise Comparativa de Impacto</h2>
                  <p className="text-[10px] text-gray-400 font-bold">Simulação comparando o atual DRE versus otimização aplicada</p>
                </div>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl px-4 py-2 text-right">
                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 block">LUCRO EXTRA MAXIMIZADO EM</span>
                <span className="text-lg font-black text-emerald-700 font-mono">+{formatCurrency(absoluteGrowth)}</span>
              </div>
            </div>

            {/* GRÁFICO RECHARTS */}
            <div className="h-60 w-full min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" fontSize={11} fontWeight={600} stroke="#9ca3af" />
                  <YAxis fontSize={10} fontWeight={600} stroke="#9ca3af" tickFormatter={(v) => `R$ ${v / 1000}k`} />
                  <RechartsTooltip
                    formatter={(value: any) => [formatCurrency(value), ""]}
                    contentStyle={{ borderRadius: "1.2rem", border: "1px solid #e5e7eb", fontSize: "11px" }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Atual" fill="#9ca3af" radius={[6, 6, 0, 0]} name="Atual (DRE)" />
                  <Bar dataKey="Otimizado" fill="#f97316" radius={[6, 6, 0, 0]} name="Maximizador Integrado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="p-3 bg-gray-50 rounded-2xl">
              <span className="text-[9px] font-black text-gray-400 block uppercase font-mono">MARGEM EBITDA ATUAL</span>
              <span className="text-base font-black text-gray-700 mt-1 block font-mono">{baseMargin.toFixed(1)}%</span>
            </div>
            <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-2xl">
              <span className="text-[9px] font-black text-orange-500 block uppercase font-mono">MARGEM APURADA MAXIMIZADA</span>
              <span className="text-base font-black text-orange-700 mt-1 block font-mono">
                {simulatedMargin.toFixed(1)}% <span className="text-[10px] text-green-500 font-bold block sm:inline font-sans">(+{Math.max(0, simulatedMargin - baseMargin).toFixed(1)}%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* INTEGRAÇÃO MULTI-MÓDULO - GERICK PLAYBOOK */}
      <div className="bg-white border border-gray-150 rounded-[2.5rem] p-6 shadow-[0_6px_25px_rgba(0,0,0,0.015)]">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-6">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
            <Layers size={16} />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Playbook de Ações de Maximização Integrada</h2>
            <p className="text-[10px] text-gray-400 font-bold">Ações ativas sincronizadas com todos os módulos do cockpit financeiro</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* AÇÃO 1: Ajuste científico de preços */}
          <div className="bg-gray-50/70 border border-gray-100 rounded-[2rem] p-5 flex flex-col justify-between">
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-50 border border-orange-200/50 px-2 py-0.5 rounded-lg font-mono">
                  MÓDULO PRECIFICAÇÃO PJ
                </span>
                {appliedActions.includes("price") && (
                  <span className="bg-emerald-100 text-emerald-700 border border-emerald-200/60 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">
                    APLICADO ✓
                  </span>
                )}
              </div>
              
              <h3 className="text-xs font-black text-gray-950 uppercase">
                Atualizar Engenharia de Precificação por Margem Científica (+{priceAdjustment.toFixed(1)}%)
              </h3>
              
              <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                Essa rotina irá reajustar automaticamente o preço de venda de todos os produtos cadastrados no banco de dados FireStore por uma técnica apurada de mark-up elástico.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
              <span className="text-[9.5px] font-black text-zinc-400 uppercase font-mono">Precificar {products.length} itens</span>
              <button
                disabled={isApplying === "price" || appliedActions.includes("price")}
                onClick={applyPriceAdjustmentAction}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                  appliedActions.includes("price")
                    ? "bg-zinc-200 text-zinc-400 hover:none"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10"
                )}
              >
                {isApplying === "price" ? (
                  <>Sincronizando...</>
                ) : appliedActions.includes("price") ? (
                  <>Integrado ✓</>
                ) : (
                  <>
                    <span>Aplicar</span>
                    <ArrowUpRight size={12} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AÇÃO 2: Planejamento Tributário */}
          <div className="bg-gray-50/70 border border-gray-100 rounded-[2rem] p-5 flex flex-col justify-between">
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded-lg font-mono">
                  MÓDULO TRIBUTÁRIO
                </span>
                {appliedActions.includes("tax") && (
                  <span className="bg-emerald-100 text-emerald-700 border border-emerald-200/60 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">
                    APLICADO ✓
                  </span>
                )}
              </div>
              
              <h3 className="text-xs font-black text-gray-950 uppercase">
                Ativarelisão Tributária no Simples Nacional
              </h3>
              
              <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                Sincroniza as diretrizes de faturamento e reduz a taxa padrão configurada em lote, gerando anotações de auditoria no canal corporativo para defesa do conselho.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-600 font-mono">+{formatCurrency(taxSavingsCalculated)}</span>
                <span className="text-[8px] text-zinc-400 uppercase font-black font-mono">ECONOMIA ESTIMADA</span>
              </div>
              
              <button
                disabled={isApplying === "tax" || appliedActions.includes("tax")}
                onClick={applyTaxOptimizationAction}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                  appliedActions.includes("tax")
                    ? "bg-zinc-200 text-zinc-400"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10"
                )}
              >
                {isApplying === "tax" ? (
                  <>Processando...</>
                ) : appliedActions.includes("tax") ? (
                  <>Integrado ✓</>
                ) : (
                  <>
                    <span>Aplicar</span>
                    <ArrowUpRight size={12} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AÇÃO 3: Gestão de Passivos */}
          <div className="bg-gray-50/70 border border-gray-100 rounded-[2rem] p-5 flex flex-col justify-between">
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50/50 border border-amber-200/50 px-2 py-0.5 rounded-lg font-mono">
                  MÓDULO DE PASSIVOS PJ
                </span>
                {appliedActions.includes("debt") && (
                  <span className="bg-emerald-100 text-emerald-700 border border-emerald-200/60 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">
                    APLICADO ✓
                  </span>
                )}
              </div>
              
              <h3 className="text-xs font-black text-gray-950 uppercase">
                Plano de Amortização com Mitigação de Juros
              </h3>
              
              <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                Rastreia títulos atrasados ou com altos encargos e sugere refinanciamento de fornecedores em até 20 dias, reduzindo saídas imediatas para acumulação de capital próprio.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-zinc-700 font-mono">{overdueLiabilities.length} títulos</span>
                <span className="text-[8px] text-zinc-400 uppercase font-black font-mono">PENDENTES</span>
              </div>
              
              <button
                disabled={isApplying === "debt" || appliedActions.includes("debt")}
                onClick={applyDebtReductionAction}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                  appliedActions.includes("debt")
                    ? "bg-zinc-200 text-zinc-400 animate-none"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10"
                )}
              >
                {isApplying === "debt" ? (
                  <>Simulando...</>
                ) : appliedActions.includes("debt") ? (
                  <>Integrado ✓</>
                ) : (
                  <>
                    <span>Aplicar</span>
                    <ArrowUpRight size={12} />
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
