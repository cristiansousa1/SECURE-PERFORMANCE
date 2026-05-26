import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { AbntPdfDocument } from "../utils/pdfAbntHelper";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";
import { 
  Sparkles, 
  Target, 
  Download, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Bot, 
  ChevronRight, 
  TrendingUp, 
  LineChart, 
  Coins, 
  Activity, 
  CheckCircle2, 
  FileText,
  AlertCircle,
  Loader2,
  Percent,
  Shield,
  ReceiptText,
  Brain,
  HelpCircle,
  ArrowRight,
  Gauge
} from "lucide-react";
import { cn } from "../lib/utils";

// Custom small Markdown solver to avoid external library dependency issues
const QuickMarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-3.5 text-xs md:text-sm text-slate-300 leading-relaxed font-sans text-left">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return <h4 key={idx} className="text-sm font-black text-orange-200 mt-5 mb-2 uppercase tracking-wide border-l-2 border-orange-500 pl-2">{trimmed.replace("###", "").trim()}</h4>;
        }
        if (trimmed.startsWith("##")) {
          return <h3 key={idx} className="text-base font-black text-white mt-6 mb-2.5 uppercase tracking-tight flex items-center gap-1.5"><Sparkles size={14} className="text-orange-400" />{trimmed.replace("##", "").trim()}</h3>;
        }
        if (trimmed.startsWith("#")) {
          return <h2 key={idx} className="text-lg font-black text-orange-100 mt-7 mb-3 uppercase tracking-tighter border-b border-white/10 pb-1.5">{trimmed.replace("#", "").trim()}</h2>;
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
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
};

interface StrategicReportViewProps {
  onNavigateToCofrinho?: () => void;
  analyticsView?: React.ReactNode;
  planningView?: React.ReactNode;
}

export const StrategicReportView: React.FC<StrategicReportViewProps> = ({ 
  onNavigateToCofrinho,
  analyticsView,
  planningView
}) => {
  const {
    transactions,
    categories,
    storeProfiles,
    activeStoreId,
    products,
    getDRE,
    showToast,
    profile,
    updateProfile,
    isDemoMode,
    trackDemoInteraction
  } = useFinance();

  // Primary Workspace tab switcher
  const [activeSubTab, setActiveSubTab] = useState<"dre" | "simulator" | "ai-advisor" | "analytics" | "plans" | "reports">("dre");

  // Corporate Brand Customization States
  const [selectedThemePreset, setSelectedThemePreset] = useState<string>("ocean");
  const [brandPrimary, setBrandPrimary] = useState<{ r: number; g: number; b: number }>({ r: 30, g: 64, b: 175 }); // Royal Blue
  const [brandSecondary, setBrandSecondary] = useState<{ r: number; g: number; b: number }>({ r: 16, g: 185, b: 129 }); // Emerald Green

  // DRE State
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [dreViewMode, setDreViewMode] = useState<"table" | "chart">("table");
  const [isExportingDRE, setIsExportingDRE] = useState(false);
  const dreReportRef = useRef<HTMLDivElement>(null);

  // AI Diagnostic report caching/state
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  // Strategic projections / simulator parameters
  const [stratPlan, setStratPlan] = useState<"opex" | "revenue" | "cmv">("opex");
  const [stratEfficacy, setStratEfficacy] = useState<number>(50);
  const [stressScenario, setStressScenario] = useState<"none" | "recession" | "inflation" | "supply_shock" | "bull_market">("none");

  // Generate Months List representing trailing 12 months for select dropdown
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => subMonths(new Date(), i)), []);

  // Format currency wrapper
  const rawFormatCurrency = (val: number) => {
    return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Safe parameters extraction for calculations based on activeStore / selected filtered transactions
  const activeTxs = useMemo(() => {
    return transactions;
  }, [transactions]);

  // Derive historical metrics dynamically
  const income = useMemo(() => {
    return activeTxs
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [activeTxs]);

  const expense = useMemo(() => {
    return activeTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [activeTxs]);

  const balance = income - expense;
  const histMargin = income > 0 ? (balance / income) * 100 : 0;

  // Active Store Label formatted
  const getActiveStoreLabel = () => {
    if (activeStoreId === "all") return "Consolidado Geral (Todas Filiais)";
    const pt = storeProfiles.find((s) => s.id === activeStoreId);
    return pt ? pt.companyName : "Filial Selecionada";
  };

  // Subscription check
  const isPremium = useMemo(() => {
    return (
      isDemoMode ||
      profile?.subscriptionPlan === "pro" ||
      profile?.subscriptionPlan === "annual"
    );
  }, [isDemoMode, profile]);

  // Strategic projections formulas based on plan type selection & execution efficacy
  let strategyIncome = income;
  let strategyExpense = expense;
  if (stratPlan === "opex") {
    // Up to 15% reduction in OPEX at 100% efficacy
    strategyExpense = expense - (expense * 0.15 * (stratEfficacy / 100));
  } else if (stratPlan === "revenue") {
    // Up to 20% increase in revenue with 30% incremental costs for fulfillment
    const growth = income * 0.20 * (stratEfficacy / 100);
    strategyIncome = income + growth;
    strategyExpense = expense + (growth * 0.30);
  } else if (stratPlan === "cmv") {
    // Up to 8% cost optimization on total CMV / operating cost
    strategyExpense = expense - (expense * 0.08 * (stratEfficacy / 100));
  }

  // Apply macro stress shock on top of strategy performance
  let projIncome = strategyIncome;
  let projExpense = strategyExpense;

  if (stressScenario === "recession") {
    // Recessão: Reduz faturamento em 20%, custos logísticos aumentam 5%
    projIncome = strategyIncome * 0.80;
    projExpense = strategyExpense * 1.05;
  } else if (stressScenario === "inflation") {
    // Inflação: Aumenta despesas gerais operacionais em 15%
    projExpense = strategyExpense * 1.15;
  } else if (stressScenario === "supply_shock") {
    // Choque de CMV: Aumenta insumos/despesas em 20%
    projExpense = strategyExpense * 1.20;
  } else if (stressScenario === "bull_market") {
    // Boom de mercado: Faturamento +25%, OPEX de marketing +10%
    projIncome = strategyIncome * 1.25;
    projExpense = strategyExpense * 1.10;
  }

  const projBalance = projIncome - projExpense;
  const projMargin = projIncome > 0 ? (projBalance / projIncome) * 100 : 0;

  // Assumed liquid safety buffer for runway
  const bufferReserve = 75000;
  const histRunway = expense > 0 ? (bufferReserve + (balance > 0 ? balance : 0)) / expense : 12;
  const projRunway = projExpense > 0 ? (bufferReserve + (projBalance > 0 ? projBalance : 0)) / projExpense : 12;

  // Resiliency Score calculation
  const resiliencyScore = useMemo(() => {
    if (projRunway >= 18 && projBalance > 0) {
      return { 
        grade: "AAA", 
        title: "Soberano", 
        desc: "Excepcional blindagem de giro. Altíssima capacidade de neutralizar crises e investir.", 
        colorClass: "text-emerald-500 border-emerald-500/50 bg-emerald-500/10", 
        textColor: "text-emerald-400",
        prob: "99%",
        rec: "Cenário altamente seguro. Mantenha os aportes regulares no Cofrinho Inteligente para perenidade sustentável."
      };
    }
    if (projRunway >= 12) {
      return { 
        grade: "AA", 
        title: "Excelente", 
        desc: "Fluxo confortável. Elevado nível de autossuficiência e resiliência financeira.", 
        colorClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5", 
        textColor: "text-emerald-400",
        prob: "95%",
        rec: "Balanço robusto. Parcela do caixa excedente pode ser designada a testes de novos canais de faturamento."
      };
    }
    if (projRunway >= 8) {
      return { 
        grade: "A", 
        title: "Forte", 
        desc: "Margem operacional sadia. Baixa suscetibilidade a oscilações normais de mercado.", 
        colorClass: "text-teal-400 border-teal-500/30 bg-teal-500/5", 
        textColor: "text-teal-400",
        prob: "88%",
        rec: "Mantenha rigor com contas de fornecedores e busque otimizações incrementais no CMV unitário."
      };
    }
    if (projRunway >= 6) {
      return { 
        grade: "BBB", 
        title: "Sustentável", 
        desc: "Capacidade adequada. Estrutura equilibrada, mas vulnerável a recessões profundas.", 
        colorClass: "text-amber-400 border-amber-500/30 bg-amber-500/5", 
        textColor: "text-amber-400",
        prob: "75%",
        rec: "Acione auditorias de despesas fixas (OPEX) não essenciais para resguardar ao menos 12 meses de sobrevida."
      };
    }
    if (projRunway >= 4) {
      return { 
        grade: "BB", 
        title: "Vulnerável", 
        desc: "Nível especulativo de insolvência. Flutuações de CMV põem as operações sob estresse.", 
        colorClass: "text-orange-400 border-orange-500/30 bg-orange-500/5", 
        textColor: "text-orange-400",
        prob: "55%",
        rec: "Seu caixa está encurtando. Reduza custos administrativos e antecipe faturas de recebíveis sem desconto agressivo."
      };
    }
    if (projRunway >= 2) {
      return { 
        grade: "B", 
        title: "Risco Alto", 
        desc: "Margem de giro perigosamente estreita. Probabilidade acentuada de aperto fiscal.", 
        colorClass: "text-rose-400 border-rose-500/20 bg-rose-500/5", 
        textColor: "text-rose-400",
        prob: "35%",
        rec: "Atenção máxima: acione o Plano de Redução Crítica de Opex e busque faturamentos imediatos de alta margem."
      };
    }
    return { 
      grade: "C/D", 
      title: "Insolvência Crítica", 
      desc: "Autossuficiência severamente comprometida. Alerta de insolvência sem injeção urgente de giro.", 
      colorClass: "text-rose-500 border-rose-600 bg-rose-500/10 animate-pulse", 
      textColor: "text-rose-500",
      prob: "15%",
      rec: "Insolvência iminente sob este cenário de estresse. Requer renegociação emergencial de passivos e aporte de capital."
    };
  }, [projRunway, projBalance]);

  // Group expenses for the telemetry AI payload
  const categoryGroupExpenses = useMemo(() => {
    return activeTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const group = cat?.group || "OPEX";
        acc[group] = (acc[group] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [activeTxs, categories]);

  // Extract Top 5 critical categories
  const topExpenseCategories = useMemo(() => {
    const catAmountsMap = activeTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const name = cat?.name || "Outros";
        acc[name] = (acc[name] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(catAmountsMap)
      .map(([name, amount]) => ({ name, amount: Number(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [activeTxs, categories]);

  // Fetch AI Report advisor from Express endpoint
  const fetchAiReport = async (force = false) => {
    const hashKey = `fs_${income}_${expense}_${balance}_${activeTxs.length}_${categories.length}_0.7_pro_strat`;
    
    // Check local cache
    if (!force) {
      try {
        const cached = sessionStorage.getItem(hashKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          if (cachedData.report) {
            setReport(cachedData.report);
            return;
          }
        }
      } catch (e) {
        console.error("Cache read failed", e);
      }
    }

    setLoadingReport(true);
    try {
      const response = await fetch("/api/ai/financial-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            totalIncome: income,
            totalExpense: expense,
            balance: balance,
            goals: [],
            dre: getDRE(selectedMonth),
            categoryGroupExpenses,
            topExpenseCategories,
            companyName: getActiveStoreLabel(),
            products: products,
            businessSegment: localStorage.getItem("dafne_business_segment") || "other",
            businessNicheDetail: localStorage.getItem("dafne_business_niche_detail") || "",
          },
          neuralPrecision: 0.7,
          neuralTier: "pro",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na requisição da API de IA");
      }

      const responseData = await response.json();
      const fetchedReport = responseData.report || "Nenhum relatório pôde ser gerado pela assessoria no momento.";
      setReport(fetchedReport);
      
      try {
        sessionStorage.setItem(hashKey, JSON.stringify({ report: fetchedReport }));
      } catch (e) {
        console.error("Cache write failed", e);
      }
    } catch (err) {
      console.error("Erro ao sincronizar assessoria:", err);
      // Failover fallback reporting
      setReport(
        `### Diagnóstico Rápido de Contingência (Dafne AI)\n` +
        `Olá, aqui é a Dafne! Devido a uma interrupção temporária na conexão, estruturei este parecer de fôlego com base nos logs correntes do seu faturamento bruto de **${rawFormatCurrency(income)}** contra saídas globais avaliadas em **${rawFormatCurrency(expense)}**.\n\n` +
        `- **Sobras de Caixa:** Atualmente acumula saldo positivo de **${rawFormatCurrency(balance)}**, gerando uma margem líquida real estável de **${histMargin.toFixed(1)}%**.\n` +
        `- **Indicador de Sustentabilidade:** Considerando a liquidez imediata ideal, seu fôlego operacional estimado (Runway) está em **${histRunway.toFixed(1)} meses**, resguardado pela reserva de blindagem.\n\n` +
        `### Recomendações e Plano de Ação Prático\n` +
        `1. **Controle de Alocação:** Destine parcelas líquidas de imediato ao seu Cofrinho Inteligente para rentabilizar ativos redundantes.\n` +
        `2. **Auditoria de Custo de Serviço (CMV):** Busque a renegociação de Skus ativos com fornecedores primários do segmento para recompor suas margens de lucro.`
      );
      if (showToast) {
        showToast("Apresentando fallback local de diagnóstico financeiro temporário.", "warning");
      }
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchAiReport();
  }, [activeStoreId, income, expense, activeTxs.length, selectedMonth]);

  // Action: Export Structured Monthly DRE standard table directly using toPng & jsPDF
  const exportDREToPDF = async () => {
    if (!dreReportRef.current) return;
    setIsExportingDRE(true);
    if (trackDemoInteraction) trackDemoInteraction();
    if (showToast) showToast("Gerando arquivo PDF consolidado sob as normas executivas. Aguarde...", "info");

    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const element = dreReportRef.current;
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const imgWidth = pdfWidth;
      const imgHeight = (img.height * pdfWidth) / img.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Draw first page
      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Handle multiline/pagination cleanly if DRE content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(
        `DRE_Certificado_${profile?.companyName || "Empresa"}_${format(selectedMonth, "MM_yyyy")}.pdf`
      );
      if (showToast) showToast("Demonstrativo DRE exportado em PDF com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      if (showToast) showToast("Erro técnico na captação visual do DRE. Tente novamente.", "error");
    } finally {
      setIsExportingDRE(false);
    }
  };

  // Theme Presets and RGB Hex Converters
  const THEME_PRESETS = [
    { id: "ocean", name: "Ocean Tech (Azul/Verde)", primary: { r: 30, g: 64, b: 175 }, secondary: { r: 16, g: 185, b: 129 } },
    { id: "orange", name: "Valora Fintech (Slate/Laranja)", primary: { r: 15, g: 23, b: 42 }, secondary: { r: 249, g: 115, b: 22 } },
    { id: "emerald", name: "Green Wealth (Floresta/Esmeralda)", primary: { r: 6, g: 95, b: 70 }, secondary: { r: 16, g: 185, b: 129 } },
    { id: "royal", name: "Sovereign Gold (Roxo/Dourado)", primary: { r: 88, g: 28, b: 135 }, secondary: { r: 234, g: 179, b: 8 } },
    { id: "crimson", name: "Venture Crimson (Vinho/Rosa)", primary: { r: 127, g: 29, b: 29 }, secondary: { r: 253, g: 164, b: 175 } },
  ];

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 15, g: 23, b: 42 };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Action: Export Comprehensive Across-Fronts General PDF Report supporting ABNT and Customized Branding Styles
  const exportFullComprehensivePDF = (isAbnt: boolean) => {
    if (trackDemoInteraction) trackDemoInteraction();
    if (showToast) showToast(`Gerando Relatório de Todas as Frentes (${isAbnt ? "Normas ABNT" : "Personalizado"}). Aguarde...`, "info");

    const pdf = new AbntPdfDocument({
      isAbntStandard: isAbnt,
      primaryColor: brandPrimary,
      secondaryColor: brandSecondary
    });

    const companyLabel = getActiveStoreLabel();

    // 1. Capa do Relatório
    pdf.drawCover(
      companyLabel,
      isAbnt ? "RELATÓRIO FINANCEIRO ACROSS-FRONTS DE CONFORMIDADE" : "DIAGNÓSTICO E PERFORMANÇA CORPORATIVA INTEGRADA",
      "Auditoria Geral de Fluxo de Caixa, DRE Geral, Margens SKU, Valuation e Diretrizes I.A.",
      "DIRETORIA DE ADMINISTRAÇÃO, FINANÇAS E TECNOLOGIA"
    );

    // 2. Seção 1: Indicadores e Saúde Financeira Geral (General Balance, Cash, and Runway metrics)
    pdf.addPrimaryHeading("1. Indicadores de Liquidez e Parâmetros de Caixa");
    pdf.addParagraph(
      "A integridade corporativa está vinculada ao fluxo líquido contínuo de recursos. Abaixo compilamos a receita comercial bruta contra as despesas gerais auditadas para o período corrente, apurando os demonstrativos de conversão operacional e o fôlego em meses (Runway) resguardado em caixa:"
    );

    const metricsColor = balance >= 0 ? { r: 16, g: 185, b: 129 } : { r: 239, g: 68, b: 68 };
    const summaryMetrics = [
      { label: "Receita Bruta", value: rawFormatCurrency(income) },
      { label: "Custo Operacional", value: rawFormatCurrency(expense), color: { r: 239, g: 68, b: 68 } },
      { label: "Resultado Líquido", value: rawFormatCurrency(balance), color: metricsColor },
      { label: "Runway Estimado", value: `${histRunway.toFixed(1)} meses` }
    ];

    pdf.addSummaryCard("Quadro de Liquidez Resumida e Capital Comercial", summaryMetrics);

    pdf.addParagraph(
      `Conclui-se que o faturamento de ${rawFormatCurrency(income)} subtraído dos desembolsos e provisões de ${rawFormatCurrency(expense)} projeta resultado de saldo líquido de ${rawFormatCurrency(balance)}, auferindo margem real final de ${histMargin.toFixed(1)}%. Com suporte nas provisões líquidas de Blindagem de R$ 75.000,00, a autossuficiência do negócio se estabiliza em ${histRunway.toFixed(1)} meses de sobrevida operacional continuada.`
    );

    // 3. Seção 2: Demonstrativo de Resultado Gerencial (DRE) Completo
    pdf.addPrimaryHeading("2. Demonstrativo de Resultado do Exercício (DRE)");
    pdf.addParagraph(
      "O demonstrativo de resultado (DRE) verticaliza contabilmente cada degrau fiscal, separando receitas de serviços ou vendas brutas, taxas e comissões acessórias, impostos sobre faturamento e despesas de OPEX corporativo:"
    );

    const dreColumns = [
      { header: "Linha da Conta do DRE", key: "label", width: 90 },
      { header: "Valor Nominal Real", key: "valStr", width: 40, align: "right" as const },
      { header: "% Faturamento", key: "pctStr", width: 30, align: "right" as const }
    ];

    const dreLines = getDRE(selectedMonth);
    const dreTableData = dreLines.map((line) => ({
      label: line.label,
      valStr: rawFormatCurrency(line.value),
      pctStr: `${income > 0 ? ((Math.abs(line.value) / income) * 100).toFixed(1) : "0.0"}%`,
      isBold: line.isBold
    }));

    pdf.addAbntTable(dreColumns, dreTableData, `Demonstrativo Estrutural do Período (${format(selectedMonth, "MMMM yyyy", { locale: ptBR })})`);

    // 4. Seção 3: Auditoria de Precificação, Custos e SKUs
    pdf.addPrimaryHeading("3. Precificação, Custos e Análise de CMV por SKU");
    pdf.addParagraph(
      "Refinamos o provimento de preços de serviços ou mercadorias cadastrados, avaliando o percentual de Custo de Mercadoria Vendida (CMV), as margens de contribuição unitárias de cada SKU e a precificação sugerida para retorno ideal do PJ:"
    );

    const skuColumns = [
      { header: "Descrição do Item SKU cadastrado", key: "name", width: 65 },
      { header: "Preço de Custo", key: "cost", width: 30, align: "right" as const },
      { header: "Preço de Venda Pt.", key: "price", width: 35, align: "right" as const },
      { header: "Margem Lucrativa %", key: "margin", width: 30, align: "right" as const }
    ];

    const skuTableData = products && products.length > 0
      ? products.map(p => ({
          name: p.name,
          cost: rawFormatCurrency(p.costPrice),
          price: rawFormatCurrency(p.sellingPrice),
          margin: `${p.profitMarginPct ? p.profitMarginPct.toFixed(1) : "0.0"}%`
        }))
      : [
          { name: "Licença de Software SaaS", cost: rawFormatCurrency(35.00), price: rawFormatCurrency(149.00), margin: "76.5%" },
          { name: "Insumo Logístico Distribuição", cost: rawFormatCurrency(48.50), price: rawFormatCurrency(95.00), margin: "48.9%" },
          { name: "Suporte Técnico Operacional", cost: rawFormatCurrency(120.00), price: rawFormatCurrency(320.00), margin: "62.5%" }
        ];

    pdf.addAbntTable(skuColumns, skuTableData, "Matriz Geral de Custos de SKUs e Mark-ups PJ");

    // 5. Seção 4: Multiplicadores, Valuation e Atratividade para Exit
    pdf.addPrimaryHeading("4. Governança, Valuation e Múltiplos de Exit");
    pdf.addParagraph(
      "A mensuração do valor de firma estimado (Valuation) correlaciona os fluxos operacionais EBITDA anualizados aos múltiplos médios do setor econômico do PJ. Ajustamos e descontamos a atratividade baseados em governança e dependência:"
    );

    const sectorMultiple = localStorage.getItem("dafne_valuation_sector_multiple") || "4.5";
    const governanceScore = localStorage.getItem("dafne_valuation_governance_score") || "7.8";
    const keyPersonRisk = localStorage.getItem("dafne_valuation_key_person_score") || "médio-baixo";
    const revenueRecurrence = localStorage.getItem("dafne_valuation_recurrence_level") || "médio (~50%)";
    const annualEbitda = Math.max(0, balance * 12);
    const estimatedValuation = annualEbitda * parseFloat(sectorMultiple);

    const valMetrics = [
      { label: "Múltiplo Médio", value: `${sectorMultiple}x` },
      { label: "EBITDA Anualizado", value: rawFormatCurrency(annualEbitda) },
      { label: "Nota de Governança", value: `${governanceScore}/10` },
      { label: "Valuation Projetado", value: rawFormatCurrency(estimatedValuation), color: { r: 16, g: 185, b: 129 } }
    ];

    pdf.addSummaryCard("Parâmetros do Laboratório de Valuation e Atratividade PJ", valMetrics);

    pdf.addParagraph(
      `Com base na geração operacional anualizada, o valuation estipulado atinge ${rawFormatCurrency(estimatedValuation)}, fundamentado no múltiplo de ${sectorMultiple}x. A companhia demonstra maturidade orçamentária expressa em nota de governança de ${governanceScore}/10, exibindo riscos de pessoa-chave classificados em grau ${keyPersonRisk} com recorrência de receitas de padrão ${revenueRecurrence}.`
    );

    // 6. Seção 5: Modelo de Projeção Estratégica e Alinhamento
    pdf.addPrimaryHeading("5. Projeções de Cenários e Planejamento e Metas");
    pdf.addParagraph(
      "A modelagem preditiva estipula impactos fiscais comparativos com base na execução orçamentária ativa orquestrada pelo conselho principal da empresa:"
    );

    const playPlanLabel = stratPlan === "opex"
      ? "Plano de Redução Estrutural de OPEX (Administrativo -15%)"
      : stratPlan === "revenue"
        ? "Plano de Atração e Expansão de Canais de Receita (+20%)"
        : "Plano de Parceria com Fornecedores e Redução CMV (-8%)";

    pdf.addSecondaryHeading(`Alinhamento de Metas: ${playPlanLabel} (Eficácia em ${stratEfficacy}%)`);

    const projCols = [
      { header: "Métrica Estrutural", key: "metric", width: 70 },
      { header: "Comportamento Corrente", key: "hist", width: 45, align: "right" as const },
      { header: "Modelo de Projeção", key: "proj", width: 45, align: "right" as const }
    ];

    const projData = [
      { metric: "Receita Comercial Bruta", hist: rawFormatCurrency(income), proj: rawFormatCurrency(projIncome) },
      { metric: "Custos e Provisões Gerais", hist: rawFormatCurrency(expense), proj: rawFormatCurrency(projExpense) },
      { metric: "Sobra Operacional Residual", hist: rawFormatCurrency(balance), proj: rawFormatCurrency(projBalance), isBold: true },
      { metric: "Lucratividade Líquida %", hist: `${histMargin.toFixed(1)}%`, proj: `${projMargin.toFixed(1)}%`, isBold: true },
      { metric: "Survival Runway (Survival)", hist: `${histRunway.toFixed(1)} meses`, proj: `${projRunway.toFixed(1)} meses` }
    ];

    pdf.addAbntTable(projCols, projData, "Estudo Técnico de Sensibilidade do Plano de Ação");

    // 7. Seção 6: Parecer de Mentoria da Assessora Dafne IA
    if (report) {
      pdf.addPrimaryHeading("6. Parecer Técnico Integral e Diretriz Contábil Dafne IA");
      pdf.addParagraph(
        "Apresentamos na íntegra a auditoria consultiva inteligente focada nas contas PJ do período:"
      );

      const markdownLines = report.split("\n");
      markdownLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith("###")) {
          pdf.addSecondaryHeading(trimmed.replace("###", "").trim());
        } else if (trimmed.startsWith("##")) {
          pdf.addPrimaryHeading(trimmed.replace("##", "").trim());
        } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          pdf.addBulletItem("•", trimmed.substring(1).trim());
        } else {
          pdf.addParagraph(trimmed);
        }
      });
    }

    const reportLabel = isAbnt ? "ABNT" : "CORPORATIVO";
    pdf.save(`Relatorio_Geral_${reportLabel}_${companyLabel.replace(/\s+/g, "_")}_${format(selectedMonth, "MM_yyyy")}.pdf`);
    
    if (showToast) {
      showToast(`Relatório Geral de Todas as Frentes (${reportLabel}) exportado com sucesso!`, "success");
    }
  };

  const exportStandardFinancialPDF = () => {
    // Falls back to full comprehensive ABNT report to maintain full backwards compatibility but with enhanced data completeness
    exportFullComprehensivePDF(true);
  };

  // Action: Export Strategic Simulation PDF with custom projections under ABNT standards
  const exportStrategicPlanPDF = () => {
    const pdf = new AbntPdfDocument();

    pdf.drawCover(
      getActiveStoreLabel(),
      "SÍNTESE DE PROJEÇÃO E ALINHAMENTO ESTRATÉGICO",
      `Modelagem e Simulação Qualitativa e Quantitativa do Plano de Ação PJ`,
      "CÉLULA DE INTELIGÊNCIA OPERACIONAL E GOVERNANÇA"
    );

    pdf.addPrimaryHeading("1. Modelagem do Plano Orçamentário");
    pdf.addParagraph(
      "Este relatório projeta o comportamento das contas fiscais e operacionais PJ mediante a adoção de estratégias estruturais ajustadas. O objetivo é auferir fôlego orçamentário no curto-médio prazo."
    );

    const planTypeLabel = stratPlan === "opex" 
      ? "Plano de Redução Estrutural de OPEX (Custos Administrativos)" 
      : stratPlan === "revenue" 
        ? "Plano de Expansão e Atração de Canais comerciais" 
        : "Plano de Otimização e Compra com Maior Margem de CMV";

    const stressLabel = stressScenario === "none" ? "Estabilidade Neutra (Mercado Normal)"
      : stressScenario === "recession" ? "Recessão Local (Volume de Faturamento -20%)"
      : stressScenario === "inflation" ? "Explosão Inflacionária (Acréscimo de Despesas de OPEX +15%)"
      : stressScenario === "supply_shock" ? "Choque Logístico e CMV (Insumos +20%)"
      : "Boom Proporcional de Vendas (+25% Demanda)";

    pdf.addSecondaryHeading(`Diretriz do Plano Local: ${planTypeLabel}`);
    pdf.addParagraph(
      `A simulação mapeia a eficácia de governança planejada sob rigor de ${stratEfficacy}% da meta real disponível.`
    );

    pdf.addSecondaryHeading(`Estresse de Choque Macroeconômico Selecionado: ${stressLabel}`);
    pdf.addParagraph(
      `Mapeamos a resiliência orçamentária sob choques sistêmicos para averiguar a vulnerabilidade de faturamento, custos de distribuição e longevidade de recursos, definindo uma classificação rating conselho.`
    );

    pdf.addPrimaryHeading("2. Projeção Orçamentária PJ Comparativa");
    pdf.addParagraph(
      "A tabela abaixo detalha as compensações simuladas entre o histórico de contas vigente e o modelo após a execução do plano:"
    );

    const projColumns = [
      { header: "Métrica / Parâmetro de Caixa", key: "metric", width: 70 },
      { header: "Histórico Atual", key: "hist", width: 45, align: "right" as const },
      { header: "Simulação do Plano Projetado", key: "proj", width: 45, align: "right" as const }
    ];

    const projTableData = [
      {
        metric: "Receita Operacional Bruta",
        hist: rawFormatCurrency(income),
        proj: rawFormatCurrency(projIncome)
      },
      {
        metric: "Custo Operacional Total",
        hist: rawFormatCurrency(expense),
        proj: rawFormatCurrency(projExpense)
      },
      {
        metric: "Lucro / Sobra Caixa Residual",
        hist: rawFormatCurrency(balance),
        proj: rawFormatCurrency(projBalance),
        isBold: true
      },
      {
        metric: "Margem de Lucratividade",
        hist: `${histMargin.toFixed(1)}%`,
        proj: `${projMargin.toFixed(1)}%`,
        isBold: true
      },
      {
        metric: "Autossuficiência (Runway)",
        hist: `${histRunway.toFixed(1)} meses`,
        proj: `${projRunway.toFixed(1)} meses`
      }
    ];

    pdf.addAbntTable(projColumns, projTableData, `Síntese Comparativa de Impacto do Plano de Ação (${stratEfficacy}% Eficácia)`);

    pdf.y += 5;

    const expectedDelta = projBalance - balance;
    pdf.addPrimaryHeading("3. Classificação de Resiliência & Rating PJ");
    pdf.addParagraph(
      `Classificação Geral do Conselho: Rating [ ${resiliencyScore.grade} ] - Nível ${resiliencyScore.title.toUpperCase()}.\n` +
      `Sob o cenário simulado, o fator de probabilidade de sustentabilidade diante de choques assenta-se em ${resiliencyScore.prob}.\n` +
      `Parecer Diretor Recomendado: ${resiliencyScore.rec}`
    );

    pdf.y += 3;
    pdf.addPrimaryHeading("4. Conclusão e Diretriz Consultiva");
    pdf.addParagraph(
      `Conclui-se que a adoção estratégica deste plano gerará um acréscimo líquido sobre o caixa operacional de ${rawFormatCurrency(expectedDelta)} por mês. Esse aporte dilui os riscos regulatórios e expande a longevidade operacional PJ para ${projRunway.toFixed(1)} meses, blindando o capital de giro em cenários restritivos.`
    );

    if (report) {
      pdf.y += 3;
      pdf.addSecondaryHeading("Recomendações da Assessora I.A.");
      const markdownLines = report.split("\n");
      markdownLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith("###")) {
          const cleanHeading = trimmed.replace("###", "").trim();
          pdf.addSecondaryHeading(cleanHeading);
        } else if (trimmed.startsWith("##")) {
          const cleanHeading = trimmed.replace("##", "").trim();
          pdf.addPrimaryHeading(cleanHeading);
        } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const cleanBullet = trimmed.substring(1).trim();
          pdf.addBulletItem("•", cleanBullet);
        } else {
          pdf.addParagraph(trimmed);
        }
      });
    }

    pdf.doc.save(`ValoraAI_Plano_Estrategico_${Date.now()}.pdf`);
    if (showToast) showToast("Plano Orçamentário Estratégico (ABNT) gerado!", "success");
  };

  // Recharts Pie chart data formatter
  const chartData = useMemo(() => {
    return getDRE(selectedMonth)
      .filter(
        (line) =>
          line.isBold &&
          line.label !== "RECEITA OPERACIONAL BRUTA" &&
          Math.abs(line.value) > 0
      )
      .map((line) => ({
        name: line.label.replace(/^(\(=\)\s*)/, "").split(" / ")[0],
        value: Math.abs(line.value),
        originalValue: line.value,
      }));
  }, [getDRE, selectedMonth]);

  const hasChartData = chartData.length > 0;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      {/* CARD PRINCIPAL DE CABEÇALHO */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5 text-left">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-[9px] text-orange-400 font-bold uppercase tracking-widest font-mono">
            <Activity size={10} className="animate-pulse" /> Diretoria Financeira & IA
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <ReceiptText size={22} className="text-orange-500" /> DRE & Inteligência Estratégica
          </h2>
          <p className="text-slate-400 text-xs md:text-sm">
            Audite o demonstrativo DRE profissional, projete sensibilidade orçamentária e obtenha pareceres da assessora Dafne IA.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={() => fetchAiReport(true)}
            disabled={loadingReport}
            className="bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700/50 font-black uppercase tracking-widest text-[9px] px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={11} className={cn("text-orange-400", loadingReport && "animate-spin")} />
            Sincronizar IA
          </button>
          
          <button
            onClick={exportStandardFinancialPDF}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black uppercase tracking-widest text-[9px] px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/15 flex items-center gap-1.5"
          >
            <Download size={11} /> Exportar DRE Executivo (ABNT)
          </button>
        </div>
      </div>

      {/* WORKSPACE SUB-TABS SELECTOR */}
      <div className="flex border-b border-gray-200 gap-1.5 py-1">
        <button
          onClick={() => setActiveSubTab("dre")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
            activeSubTab === "dre"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <ReceiptText size={15} /> Demonstrativo DRE
        </button>
        <button
          onClick={() => setActiveSubTab("simulator")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
            activeSubTab === "simulator"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Target size={15} /> Planejamento & Projeções
        </button>
        <button
          onClick={() => setActiveSubTab("ai-advisor")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
            activeSubTab === "ai-advisor"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Bot size={15} /> Mentoria I.A. & SKU/CMV
        </button>
        <button
          onClick={() => setActiveSubTab("analytics")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
            activeSubTab === "analytics"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Activity size={15} /> Análises & Comparativos
        </button>
        <button
          onClick={() => setActiveSubTab("plans")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
            activeSubTab === "plans"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <FileText size={15} /> Plano Estratégico I.A.
        </button>
        <button
          onClick={() => setActiveSubTab("reports")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
            activeSubTab === "reports"
              ? "border-orange-500 text-gray-950 font-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <FileText size={15} className="text-orange-500" /> Central de Relatórios
        </button>
      </div>

      {/* DYNAMICS CONTENTS ACCORDING TO WORKING SUB-TAB */}
      <AnimatePresence mode="wait">
        
        {/* SUBTAB 1: MONTHLY INTERACTIVE DRE */}
        {activeSubTab === "dre" && (
          <motion.div
            key="dre-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Control Bar specific for DRE */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-150">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setDreViewMode("table")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      dreViewMode === "table"
                        ? "bg-gray-950 text-white shadow-sm"
                        : "text-gray-500"
                    )}
                  >
                    Exibição em Tabela
                  </button>
                  <button
                    onClick={() => {
                      if (!isPremium) {
                        showToast("Gráficos analíticos de composição do DRE estão restritos a clientes Pro.", "warning");
                        return;
                      }
                      setDreViewMode("chart");
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1",
                      dreViewMode === "chart"
                        ? "bg-gray-950 text-white shadow-sm"
                        : "text-gray-500"
                    )}
                  >
                    Exibição Gráfica
                    {!isPremium && <Shield size={10} className="text-orange-500 animate-pulse" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Imposto Estimado (%)</span>
                  <input
                    type="number"
                    value={profile?.taxRate || 0}
                    onChange={(e) => updateProfile({ taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-12 border-none bg-transparent outline-none p-0 text-center font-bold text-xs text-gray-900 focus:ring-0"
                  />
                  <Percent size={11} className="text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedMonth.toISOString()}
                  onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                  className="bg-white rounded-xl border border-gray-200 px-3 py-1.5 font-bold outline-none text-xs text-gray-800"
                >
                  {months.map((m) => (
                    <option key={m.toISOString()} value={m.toISOString()}>
                      {format(m, "MMMM yyyy", { locale: ptBR })}
                    </option>
                  ))}
                </select>

                {dreViewMode === "table" && (
                  <button
                    onClick={exportDREToPDF}
                    disabled={isExportingDRE}
                    className="bg-gray-950 hover:bg-orange-600 font-extrabold text-[10px] text-white uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-black/5 flex items-center gap-1.5"
                  >
                    {isExportingDRE ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    {isExportingDRE ? "Gerando..." : "Captura Visual (PDF)"}
                  </button>
                )}
              </div>
            </div>

            {/* DRE Interactive Display Render */}
            <div className="grid grid-cols-1 gap-6">
              {dreViewMode === "table" ? (
                <div 
                  ref={dreReportRef}
                  className="bg-white rounded-[3rem] border border-gray-150 p-6 md:p-10 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 flex flex-col items-end opacity-5 pointer-events-none">
                    <span className="text-[64px] font-black italic tracking-tighter leading-none text-slate-900">DRE</span>
                    <span className="text-[10px] font-mono tracking-widest block uppercase font-bold text-slate-800">Oficial</span>
                  </div>

                  <div className="border-b-4 border-slate-950 pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div className="space-y-1 text-left">
                      <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                        {profile?.companyName || "Minha Empresa PJ"}
                      </h3>
                      <p className="text-[11px] text-orange-600 font-mono font-bold uppercase tracking-wider">
                        Demonstrativo de Resultado do Exercício • {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right border-l-2 border-slate-300 pl-4">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">CNPJ REGULARIZADO</p>
                      <p className="text-[10px] font-mono text-slate-800 font-semibold">{getActiveStoreLabel()}</p>
                    </div>
                  </div>

                  {/* DRE Vertical accounting lines */}
                  <div className="divide-y divide-gray-100 text-xs md:text-sm text-left">
                    {(() => {
                      const dreLines = getDRE(selectedMonth);
                      const grossRevenueLine = dreLines.find((l) => l.label === "RECEITA OPERACIONAL BRUTA");
                      const grossRevenueVal = grossRevenueLine ? grossRevenueLine.value : 0;

                      return dreLines.map((line, index) => {
                        const percentageOfRevenue = (grossRevenueVal > 0 && line.label !== "RECEITA OPERACIONAL BRUTA") 
                          ? Math.round((Math.abs(line.value) / grossRevenueVal) * 100)
                          : null;

                        return (
                          <div
                            key={index}
                            className={cn(
                              "flex justify-between items-center py-3.5 px-2 transition-all hover:bg-slate-50/50",
                              line.isBold
                                ? "font-black text-slate-950 bg-slate-50 border-y border-slate-200/60 uppercase tracking-tight"
                                : "text-slate-600"
                            )}
                          >
                            <div
                              style={{ paddingLeft: `${(line.indent || 0) * 14}px` }}
                              className="flex items-center gap-2 flex-1 shrink-0"
                            >
                              <span>{line.label}</span>
                              {percentageOfRevenue !== null && percentageOfRevenue > 0 && (
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded-[5px] text-[8px] tracking-tighter font-extrabold uppercase font-mono",
                                  line.isBold
                                    ? "bg-orange-500/10 text-orange-700 border border-orange-500/20"
                                    : "bg-slate-100 text-slate-400 border border-slate-200/40"
                                )}>
                                  {percentageOfRevenue}% rec.
                                </span>
                              )}
                            </div>
                            <div className={cn(
                              "font-mono font-bold tracking-tighter shrink-0",
                              !line.isBold && line.value < 0 ? "text-rose-500" : ""
                            )}>
                              {line.value < 0 ? "(" : ""}
                              {rawFormatCurrency(Math.abs(line.value))}
                              {line.value < 0 ? ")" : ""}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex flex-col sm:flex-row justify-between items-center gap-2">
                    <span className="flex items-center gap-1"><Shield size={11} /> Autenticação Criptografada Valora</span>
                    <span>Modo Gerencial de Caixa • Imposto estimado: {profile?.taxRate || 0}%</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Composição Margem (Pie) */}
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-xs h-[380px]">
                    <h4 className="font-extrabold text-slate-900 mb-4 uppercase text-xs tracking-wider text-left flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <Coins size={14} className="text-orange-500" /> Composição Estrutural de Custos DRE
                    </h4>
                    {!hasChartData ? (
                      <div className="flex flex-col items-center justify-center h-[260px] text-gray-300">
                        <LineChart className="mb-2" size={32} />
                        <span className="text-[10px] uppercase font-bold">Sem movimentações de custo</span>
                      </div>
                    ) : (
                      <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {chartData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={[
                                    "#10B981", // Emerald
                                    "#3B82F6", // Blue
                                    "#F59E0B", // Amber
                                    "#EF4444", // Red
                                    "#8B5CF6", // Purple
                                  ][index % 5]}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(val: number) => rawFormatCurrency(val)} />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        <div className="flex flex-wrap justify-center gap-3 mt-1 max-h-[50px] overflow-y-auto">
                          {chartData.map((item, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full block"
                                style={{
                                  backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"][i % 5]
                                }}
                              />
                              <span className="text-[9px] text-slate-500 truncate max-w-[80px] font-bold uppercase">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evolução (Bar Chart) */}
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-xs h-[380px]">
                    <h4 className="font-extrabold text-slate-900 mb-4 uppercase text-xs tracking-wider text-left flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <LineChart size={14} className="text-[#3b82f6]" /> Comparação Econômica Vertical
                    </h4>
                    {!hasChartData ? (
                      <div className="flex flex-col items-center justify-center h-[260px] text-gray-300">
                        <LineChart className="mb-2" size={32} />
                        <span className="text-[10px] uppercase font-bold">Sem dados suficientes</span>
                      </div>
                    ) : (
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={90}
                              tick={{ fontSize: 9, fontWeight: "bold", fill: "#64748b" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartsTooltip formatter={(val: number) => rawFormatCurrency(val)} />
                            <Bar dataKey="value" fill="#f97316" radius={[0, 5, 5, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Link to Cofrinho */}
            <div 
              onClick={onNavigateToCofrinho}
              className="bg-linear-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200/60 rounded-[2rem] p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold uppercase text-xs text-orange-950 tracking-wide">
                    Cofrinho Inteligente de Otimização PJ
                  </h4>
                  <p className="text-[11px] text-orange-900/80 font-medium mt-1">
                    Realoque sobras de sua margem operacional no Cofrinho I.A., proteja o fluxo econômico contra contingências fiscais e planeje metas de médio prazo com fôlego garantido.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0 bg-white border border-orange-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-orange-700 transition-all hover:scale-105 active:scale-95 font-sans">
                <span>Alocar Caixa</span>
                <ChevronRight size={13} />
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: INTERACTIVE SCENARIOS SIMULATOR */}
        {activeSubTab === "simulator" && (
          <motion.div
            key="simulator-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Simulation Dashboard Header Banner */}
            <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-emerald-500/[0.03] rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 border-b border-white/[0.08] pb-5 mb-6">
                <div className="space-y-1.5 text-left font-sans">
                  <div className="inline-flex items-center gap-1.5 bg-orange-400/10 border border-orange-400/20 rounded-full px-2.5 py-0.5 text-[9px] text-orange-300 font-bold uppercase tracking-widest font-mono">
                    <Sparkles size={10} className="text-orange-400 animate-pulse" /> Laboratório Estratégico Corporativo
                  </div>
                  <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                    <Target size={18} className="text-orange-400" /> Simulador de Estresse, Diagnóstico & Rating PJ
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Simule os planos de ação da sua empresa contra choques e oscilações do mercado. Avalie o fôlego operacional (Runway) e receba notas de classificação internacional de risco financeiro.
                  </p>
                </div>

                {/* Scenario tabs */}
                <div className="flex bg-slate-900 border border-white/10 p-1.5 rounded-xl gap-1 shrink-0 flex-wrap">
                  <button
                    onClick={() => {
                      setStratPlan("opex");
                      if (trackDemoInteraction) trackDemoInteraction();
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      stratPlan === "opex"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Reduzir OPEX (-15%)
                  </button>
                  <button
                    onClick={() => {
                      setStratPlan("revenue");
                      if (trackDemoInteraction) trackDemoInteraction();
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      stratPlan === "revenue"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Alavancar Canais (+20%)
                  </button>
                  <button
                    onClick={() => {
                      setStratPlan("cmv");
                      if (trackDemoInteraction) trackDemoInteraction();
                    }}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      stratPlan === "cmv"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Negociar CMV (-8%)
                  </button>
                </div>
              </div>

              {/* Grid Simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                
                {/* LEFT COLUMN: PARAMETER SETUP */}
                <div className="lg:col-span-5 flex flex-col gap-5 text-left">
                  
                  {/* Strategic Plan Card */}
                  <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-3xl space-y-4 font-sans">
                    <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-2">
                      <ChevronRight size={13} /> 1. Parâmetros do Plano Local
                    </h4>
                    
                    <p className="text-[11px] text-slate-300 leading-relaxed min-h-[44px]">
                      {stratPlan === "opex" && "Cortar gargalos fixos, despesas administrativas excludentes e auditorias preventivas imediatas no OPEX direto da matriz."}
                      {stratPlan === "revenue" && "Impulsionar contratos recorrentes ativos, otimização de tiquetes médios de conversão sob investimento tático de publicidade."}
                      {stratPlan === "cmv" && "Desenvolver novas ordens centralizadas com fabricantes industriais e rotinas just-in-time para extinguir excesso de estoque."}
                    </p>

                    {/* Slider Governance */}
                    <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wide font-black text-slate-400">
                        <span>Governança & Rigor Executivo</span>
                        <span className="font-mono text-xs font-black text-white bg-orange-500/25 border border-orange-500/30 px-2 py-0.5 rounded">
                          {stratEfficacy}% Eficácia
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={stratEfficacy}
                        onChange={(e) => setStratEfficacy(parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[8px] font-mono text-slate-400">
                        <span>Confortável (10%)</span>
                        <span>Conselho Diretor (100%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Macro Stress Shock Selection */}
                  <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-3xl space-y-4 font-sans">
                    <div>
                      <h4 className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-2">
                        <Activity size={13} className="text-sky-400" /> 2. Choque Macroeconômico Alvo
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                        Estresse seu negócio escolhendo um cenário e veja o impacto instantâneo de liquidez:
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setStressScenario("none");
                          if (showToast) showToast("Simulando cenário estável de mercado.", "info");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "none"
                            ? "bg-slate-900 border-sky-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Estabilidade Neutra
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">Sem Shock</span>
                      </button>

                      <button
                        onClick={() => {
                          setStressScenario("recession");
                          if (showToast) showToast("Aviso: Teste de estresse de recessão ativo (-20% Faturamento).", "warning");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "recession"
                            ? "bg-slate-900 border-red-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Recessão Local (Faturamento -20%)
                        </span>
                        <span className="text-[9px] font-mono text-red-400 font-extrabold uppercase bg-red-400/10 px-1.5 py-0.5 rounded">Vol. -20%</span>
                      </button>

                      <button
                        onClick={() => {
                          setStressScenario("inflation");
                          if (showToast) showToast("Aviso: Teste de estresse de inflação ativo (+15% Despesas).", "warning");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "inflation"
                            ? "bg-slate-900 border-amber-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Explosão Inflacionária (OPEX +15%)
                        </span>
                        <span className="text-[9px] font-mono text-amber-400 font-extrabold uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">Opex +15%</span>
                      </button>

                      <button
                        onClick={() => {
                          setStressScenario("supply_shock");
                          if (showToast) showToast("Aviso: Teste de estresse logístico/CMV ativo (+20% Custos).", "warning");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "supply_shock"
                            ? "bg-slate-900 border-orange-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          Choque de Insumos/CMV (Custos +20%)
                        </span>
                        <span className="text-[9px] font-mono text-orange-400 font-extrabold uppercase bg-orange-500/10 px-1.5 py-0.5 rounded">CMV +20%</span>
                      </button>

                      <button
                        onClick={() => {
                          setStressScenario("bull_market");
                          if (showToast) showToast("Excelente: Cenário de expansão cambial e boom de faturamento ativo.", "success");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-center justify-between cursor-pointer",
                          stressScenario === "bull_market"
                            ? "bg-slate-900 border-emerald-500/40 text-white text-[11.5px] font-black"
                            : "bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          Boom de Demanda (Vendas +25%)
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase bg-emerald-400/10 px-1.5 py-0.5 rounded">Vendas +25%</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={exportStrategicPlanPDF}
                      className="w-full bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-black text-[10px] uppercase tracking-wider py-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 text-white shadow-lg shadow-orange-500/15 font-sans"
                    >
                      <Download size={13} /> Baixar Relatório de Estresse PDF
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN: DETAILED DIAGNOSTICS & SCORE */}
                <div className="lg:col-span-7 flex flex-col gap-5 text-left">
                  
                  {/* PREMIUM RESILIENCY RATING RADIAL/GRADE BOARD */}
                  <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 text-[9px] font-mono font-bold text-slate-500 select-none">
                      DAFNE AI RESILIENCY MODEL
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                      
                      {/* Interactive Badge Grade Circle */}
                      <div className="relative shrink-0 flex items-center justify-center w-28 h-28 rounded-full border-4 border-dashed border-white/10 p-2">
                        <div className={cn("w-full h-full rounded-full flex flex-col items-center justify-center border shadow-inner", resiliencyScore.colorClass)}>
                          <span className="text-3xl font-black font-mono tracking-tighter leading-none">{resiliencyScore.grade}</span>
                          <span className="text-[8px] font-gray-400 font-black tracking-widest uppercase mt-0.5">Rating</span>
                        </div>
                      </div>

                      {/* Diagnostic details */}
                      <div className="space-y-2 font-sans flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className={cn("text-sm font-black uppercase tracking-wide", resiliencyScore.textColor)}>
                            {resiliencyScore.title}
                          </span>
                          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                            Sobrevivência: {resiliencyScore.prob}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-100 leading-normal">
                          {resiliencyScore.desc}
                        </h4>
                        
                        {/* Interactive AI recommendation ticker */}
                        <div className="mt-3.5 bg-white/[0.03] border border-white/[0.04] p-3 rounded-2xl flex items-start gap-2.5">
                          <Bot size={14} className="text-orange-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-orange-300 uppercase tracking-wider block">Recomendação Contra Choque (Dafne IA)</span>
                            <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                              {resiliencyScore.rec}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Survival Under Crisis Progress Bar */}
                    <div className="mt-5 pt-4 border-t border-white/[0.04] space-y-1.5 font-sans">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-400">
                        <span>Fator do Runway sob Choque Ativo</span>
                        <span className={cn("font-mono text-xs font-black", projRunway >= 12 ? "text-emerald-400" : projRunway >= 6 ? "text-amber-400" : "text-rose-400")}>
                          {projRunway >= 24 ? "Suficiente (+2 Anos)" : `${projRunway.toFixed(1)} meses`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.05]">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            projRunway >= 12 ? "bg-emerald-500" : projRunway >= 6 ? "bg-amber-400" : "bg-rose-500"
                          )} 
                          style={{ width: `${Math.min(100, (projRunway / 24) * 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                        <span>Aperto Imediato</span>
                        <span>Equilíbrio Perfeito (12m)</span>
                        <span>Reserva Blindada (24m+)</span>
                      </div>
                    </div>

                  </div>

                  {/* Standard results delta boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Item 1: Conversão Líquida */}
                    <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl text-left space-y-1.5 font-sans">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Conversão Líquida Estimada</span>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-[#9ca3af]">Atual:</span>
                        <span className="text-xs font-mono font-bold text-gray-300">{histMargin.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-[#9ca3af]">Planejada:</span>
                        <span className={cn("text-xs font-mono font-black", projMargin >= histMargin ? "text-emerald-400" : "text-rose-400")}>
                          {projMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, projMargin))}%` }} />
                      </div>
                    </div>

                    {/* Item 2: Runway */}
                    <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl text-left space-y-1.5 font-sans">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Sustentabilidade (Runway)</span>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-[#9ca3af]">Atual:</span>
                        <span className="text-xs font-mono font-bold text-gray-300">{histRunway.toFixed(1)} meses</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-[#9ca3af]">Planejada:</span>
                        <span className={cn("text-xs font-mono font-black", projRunway >= histRunway ? "text-orange-400" : "text-rose-400")}>
                          {projRunway.toFixed(1)} meses
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (projRunway / 24) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Detailed bookkeeping balance */}
                    <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl md:col-span-2 space-y-3">
                      <div className="flex justify-between items-center border-b border-white/[0.05] pb-2 font-sans">
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Tabela Resumo Geral de Caixa</span>
                        <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">
                          Simulador Integrado
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 font-sans text-left">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block">Faturamento Projetado</span>
                          <span className="text-xs font-mono font-black text-gray-200">{rawFormatCurrency(projIncome)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block">Custo Total Projetado</span>
                          <span className="text-xs font-mono font-black text-gray-200">{rawFormatCurrency(projExpense)}</span>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-white/[0.05] flex justify-between items-center bg-white/[0.01] p-2.5 rounded-xl font-sans">
                        <div>
                          <span className="text-[9px] text-orange-300 font-extrabold uppercase">Sobra Residual Líquida</span>
                          <p className="text-sm font-mono font-black text-white">{rawFormatCurrency(projBalance)}</p>
                        </div>
                        <div className="text-right font-sans">
                          <span className="text-[8px] text-[#9ca3af] font-bold block">Delta de Margem Mensal:</span>
                          <span className={cn("text-xs font-mono font-black", projBalance - balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {projBalance - balance >= 0 ? "+" : ""} {rawFormatCurrency(projBalance - balance)}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: AI DIAGNOSTIC ADVISOR & SKU PRICING */}
        {activeSubTab === "ai-advisor" && (
          <motion.div
            key="ai-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left AI audit report panel */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-lg flex flex-col space-y-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/[0.03] rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 relative z-10">
                <div className="flex items-center gap-2.5">
                  <Bot size={20} className="text-orange-400 animate-pulse" />
                  <div className="text-left">
                    <h4 className="font-extrabold uppercase text-xs text-white">Conselhos da Assessora Dafne IA</h4>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Diagnósticos e diretrizes financeiras PJ</p>
                  </div>
                </div>

                <button
                  onClick={() => fetchAiReport(true)}
                  disabled={loadingReport}
                  className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {loadingReport ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} className="text-orange-400" />}
                  Atualizar Auditoria
                </button>
              </div>

              <div className="max-h-[380px] overflow-y-auto pr-1 relative z-10 text-left">
                {loadingReport ? (
                  <div className="py-24 text-center space-y-3">
                    <Loader2 size={24} className="animate-spin text-orange-400 mx-auto" />
                    <p className="text-xs text-slate-400 uppercase font-black tracking-widest font-mono">Dafne está recalculando margens e buscando padrões...</p>
                  </div>
                ) : report ? (
                  <QuickMarkdownRenderer text={report} />
                ) : (
                  <div className="text-center py-24 text-slate-400 space-y-2">
                    <AlertCircle size={24} className="mx-auto text-slate-500" />
                    <p className="font-black text-[10px] uppercase tracking-wider">Nenhum parecer financeiro ativo</p>
                    <p className="text-[11px] text-slate-500">Clique em "Sincronizar IA" no cabeçalho para gerar o parecer sob medida.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Products Pricing CMV panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white border border-gray-150 p-6 rounded-[2.5rem] shadow-xs hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-center border-b border-gray-150 pb-3 mb-4">
                  <div className="text-left">
                    <h4 className="font-black uppercase text-xs text-slate-900">Precificação Estruturada de SKUs</h4>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Contribuição marginal e markup por produto</p>
                  </div>
                  <Coins size={16} className="text-orange-500" />
                </div>

                {products && products.length > 0 ? (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {products.map((prod, idx) => (
                      <div key={idx} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-150 hover:border-gray-300 transition-colors flex justify-between items-center text-left">
                        <div>
                          <span className="font-black text-slate-900 text-xs block truncate max-w-[150px]">{prod.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">Cust. Unit: {rawFormatCurrency(prod.costPrice)} | Vend. {rawFormatCurrency(prod.sellingPrice)}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-orange-600 block font-mono">CMV: {prod.cmvPct.toFixed(1)}%</span>
                          <span className="text-[9px] text-emerald-600 font-bold">Margem: {prod.profitMarginPct.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400 space-y-2">
                    <HelpCircle size={20} className="mx-auto text-gray-300" />
                    <p className="font-bold text-[11px] uppercase tracking-wider">Sem produtos parametrizados</p>
                    <p className="text-[10px] text-gray-400">Insira valores na planilha de precificação para que a Dafne ajude no faturamento.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === "analytics" && (
          <motion.div
            key="analytics-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {analyticsView || (
              <div className="bg-white border border-gray-150 p-12 rounded-[2.5rem] shadow-xs text-center text-slate-500">
                Visualizador de análises comparativas e relatórios gráficos e de OPEX indisponível.
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === "plans" && (
          <motion.div
            key="plans-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {planningView || (
              <div className="bg-[#0b0c0e] border border-orange-500/10 p-12 rounded-[2.5rem] shadow-xs text-center text-slate-400">
                Assessor de plano de metas cooperativo integrado indisponível.
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === "reports" && (
          <motion.div
            key="reports-subtab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-slate-800"
          >
            {/* Header Description */}
            <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-[2.5rem] shadow-xs text-left relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="text-orange-500" size={20} />
                    Central de Relatórios Corporativos Multi-Frentes
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Consolide as 6 frentes do negócio (Liquidez de Caixa, DRE Geral, Precificação SKU/CMV, Diagnóstico de Valuation/Exit, Simulador estratégico e Parecer da Dafne IA) em um único arquivo PDF altamente polido.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-xl shrink-0">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Dados Sincronizados</span>
                </div>
              </div>
            </div>

            {/* Config & Choices Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* BRANDING SETUP PANEL */}
              <div className="lg:col-span-5 bg-white border border-gray-150 p-6 rounded-[2.5rem] shadow-xs space-y-6">
                <div>
                  <h4 className="font-black uppercase text-xs text-slate-900 flex items-center gap-1.5 border-b border-gray-150 pb-3">
                    <span>1. Estilo / Cores da Empresa</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-wider text-left">
                    Selecione um tema pré-configurado ou selecione as cores hexadecimais da sua marca:
                  </p>
                </div>

                {/* Preset List */}
                <div className="space-y-2 text-left">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedThemePreset(preset.id);
                        setBrandPrimary(preset.primary);
                        setBrandSecondary(preset.secondary);
                      }}
                      className={cn(
                        "w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                        selectedThemePreset === preset.id
                          ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                          : "bg-gray-50 text-slate-700 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      <span className="font-black uppercase tracking-wide text-[10px]">{preset.name}</span>
                      <div className="flex gap-1.5 shrink-0">
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: rgbToHex(preset.primary.r, preset.primary.g, preset.primary.b) }} />
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: rgbToHex(preset.secondary.r, preset.secondary.g, preset.secondary.b) }} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Manual Hex Selectors */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cor Primária</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                      <input
                        type="color"
                        value={rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b)}
                        onChange={(e) => {
                          setSelectedThemePreset("custom");
                          setBrandPrimary(hexToRgb(e.target.value));
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent shrink-0"
                      />
                      <span className="font-mono text-[10px] font-black uppercase">{rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cor Secundária</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                      <input
                        type="color"
                        value={rgbToHex(brandSecondary.r, brandSecondary.g, brandSecondary.b)}
                        onChange={(e) => {
                          setSelectedThemePreset("custom");
                          setBrandSecondary(hexToRgb(e.target.value));
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent shrink-0"
                      />
                      <span className="font-mono text-[10px] font-black uppercase">{rgbToHex(brandSecondary.r, brandSecondary.g, brandSecondary.b)}</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Preview Card Mock */}
                <div className="border-t border-gray-100 pt-5 space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block text-left">Prévia ao Vivo da Capa Personalizada</label>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-gray-200 overflow-hidden relative">
                    {/* Simulated ABNT Document Cover in Miniature */}
                    <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm min-h-[160px] flex flex-col justify-between text-left relative overflow-hidden">
                      {/* Brand Banner Preview */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-2"
                        style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }}
                      />
                      <div 
                        className="absolute top-2 left-0 right-0 h-1 opacity-60"
                        style={{ backgroundColor: rgbToHex(brandSecondary.r, brandSecondary.g, brandSecondary.b) }}
                      />
                      
                      <div className="space-y-1 text-center pt-3">
                        <span className="text-[8px] font-black tracking-widest text-slate-400 block uppercase">{getActiveStoreLabel()}</span>
                        <div className="w-10 h-0.5 mx-auto opacity-30 mt-1" style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }} />
                      </div>

                      <div className="text-center py-2">
                        <h5 className="text-[9px] font-black tracking-tight text-slate-900 uppercase">Diagnóstico e Performance Corporativa</h5>
                        <p className="text-[7px] text-slate-500 mt-0.5 leading-none">Auditoria Integrada de Finanças e Soluções PJ</p>
                      </div>

                      <div className="text-center pb-1">
                        <span className="text-[6px] font-mono font-bold text-slate-400 uppercase tracking-wide">Dafne inteligência financeira</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* REPORT VOUCHERS DOWNLOADS GRID */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* ABNT Academic Report card */}
                <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-[2.5rem] shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-full hover:shadow-xs transition-shadow">
                  <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 border-b border-l border-gray-200 text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest font-mono">
                    Normativa NBR
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Relatório Completo nas Normas ABNT
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Formatação formal, neutra e técnica estruturada de conformidade com as diretrizes acadêmicas brasileiras. Ideal para apresentação em conselhos de administração, auditorias oficiais de contabilidade, envio para instituições financeiras e relatórios legais formais.
                    </p>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-medium space-y-2">
                      <span className="font-extrabold uppercase text-[9px] text-slate-400 tracking-wider block">Frentes inclusas no Sumário:</span>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                        <li className="flex items-center gap-1.5">✓ Performance de Caixa</li>
                        <li className="flex items-center gap-1.5">✓ Tabela DRE Geral</li>
                        <li className="flex items-center gap-1.5">✓ Análise CMV & SKUs</li>
                        <li className="flex items-center gap-1.5">✓ Valuation Estimado</li>
                        <li className="flex items-center gap-1.5">✓ Plano de Metas Ativo</li>
                        <li className="flex items-center gap-1.5">✓ Parecer da Dafne IA</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => exportFullComprehensivePDF(true)}
                    className="mt-6 w-full bg-slate-900 hover:bg-slate-950 active:scale-98 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all cursor-pointer shadow-md shadow-slate-950/15 flex items-center justify-center gap-2"
                  >
                    <Download size={13} />
                    Download PDF Estilo ABNT
                  </button>
                </div>

                {/* Branded corporate customized style card */}
                <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-[2.5rem] shadow-xs text-left relative overflow-hidden flex flex-col justify-between h-full hover:shadow-xs transition-shadow">
                  <div className="absolute top-0 right-0 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest font-mono" style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }}>
                    Identidade Corporativa
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }} />
                      Relatório Geral Personalizado (Cores da Empresa)
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Estampado com as cores de marca selecionadas por você. Apresenta elementos visuais integrados de alto impacto como cabeçalhos estilizados, fitas e barras dinâmicas coloridas, quadros de KPIs personalizados e tabelas com sombreamento correspondente. Perfeito para parceiros de negócios, investidores e equipes internas.
                    </p>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-medium space-y-2">
                      <span className="font-extrabold uppercase text-[9px] text-slate-400 tracking-wider block">Frentes inclusas no Sumário:</span>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                        <li className="flex items-center gap-1.5">✓ Performance de Caixa</li>
                        <li className="flex items-center gap-1.5">✓ Tabela DRE Geral</li>
                        <li className="flex items-center gap-1.5">✓ Análise CMV & SKUs</li>
                        <li className="flex items-center gap-1.5">✓ Valuation Estimado</li>
                        <li className="flex items-center gap-1.5">✓ Plano de Metas Ativo</li>
                        <li className="flex items-center gap-1.5">✓ Parecer da Dafne IA</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => exportFullComprehensivePDF(false)}
                    style={{ backgroundColor: rgbToHex(brandPrimary.r, brandPrimary.g, brandPrimary.b) }}
                    className="mt-6 w-full hover:brightness-110 active:scale-98 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Download size={13} />
                    Download PDF Estilo Corporativo
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
