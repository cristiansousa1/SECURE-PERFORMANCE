import React, { useState, useMemo, useEffect } from "react";
import { useFinance, Note } from "../contexts/FinanceContext";
import { ProductPriceCalc } from "../types";
import { formatCurrency, formatPercent, cn } from "../lib/utils";
import {
  Sparkles,
  Calculator,
  Plus,
  Trash2,
  AlertTriangle,
  FileDown,
  ChevronDown,
  Wand2,
  Package,
  PiggyBank,
  CheckCircle2,
  Percent,
  TrendingUp,
  HelpCircle,
  ShoppingCart,
  X,
} from "lucide-react";
import { AbntPdfDocument } from "../utils/pdfAbntHelper";

export default function PricingView() {
  const {
    products,
    addProduct,
    deleteProduct,
    updateProduct,
    profile,
    showToast,
    addTransaction,
    categories,
    storeProfiles,
    activeStoreId,
  } = useFinance();

  // Dialog and form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    costPrice: "",
    desiredMargin: "30",
    taxRate: (profile?.taxRate || 6).toString(),
    otherCostsPct: "10",
    sellingPrice: "",
  });

  // Fast Sales Mode states
  const [sellingProduct, setSellingProduct] = useState<ProductPriceCalc | null>(null);
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleStoreId, setSaleStoreId] = useState<string>("");
  const [adjustedSellingPrice, setAdjustedSellingPrice] = useState<string>("");

  // AI advisory state
  const [aiReport, setAiReport] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Dynamic calculations as user types in form
  const computedValues = useMemo(() => {
    const rawCost = parseFloat(formData.costPrice) || 0;
    const rawMargin = parseFloat(formData.desiredMargin) || 0;
    const rawTax = parseFloat(formData.taxRate) || 0;
    const rawOther = parseFloat(formData.otherCostsPct) || 0;

    const totalDeductionsPct = rawTax + rawOther + rawMargin;
    
    // Suggested price based on Markup margins: Selling Price = costPrice / (1 - (taxRate + otherCostsPct + desiredMargin) / 100)
    let suggestedPrice = 0;
    if (totalDeductionsPct < 100) {
      suggestedPrice = rawCost / (1 - totalDeductionsPct / 100);
    } else {
      // Direct margin scale markup fallback if percentage is over 100%
      suggestedPrice = rawCost * (1 + rawMargin / 100);
    }

    // Set or compute active selling price
    const activePrice = parseFloat(formData.sellingPrice) || suggestedPrice;

    // CMV% = (cost / active Price) * 100
    const cmvPct = activePrice > 0 ? (rawCost / activePrice) * 100 : 0;

    // Real profit value = selling - cost - tax% - other%
    const taxAmt = activePrice * (rawTax / 100);
    const otherAmt = activePrice * (rawOther / 100);
    const profitVal = activePrice - rawCost - taxAmt - otherAmt;
    const profitMarginPct = activePrice > 0 ? (profitVal / activePrice) * 100 : 0;

    return {
      suggestedPrice,
      activePrice,
      cmvPct,
      profitVal,
      profitMarginPct,
    };
  }, [formData]);

  // Apply default suggested price value when inputs change
  useEffect(() => {
    if (!formData.sellingPrice) {
      // Keep input updated dynamically
    }
  }, [computedValues.suggestedPrice]);

  // Autofill suggested price to active selling price input
  const handleAutofillSuggested = () => {
    setFormData((prev) => ({
      ...prev,
      sellingPrice: computedValues.suggestedPrice.toFixed(2),
    }));
    showToast("Preço de venda definido para o sugerido!", "info");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast("Insira o nome do produto!", "error");
      return;
    }

    const rawCost = parseFloat(formData.costPrice) || 0;
    const rawMargin = parseFloat(formData.desiredMargin) || 0;
    const rawTax = parseFloat(formData.taxRate) || 0;
    const rawOther = parseFloat(formData.otherCostsPct) || 0;
    const activeSellingPrice = parseFloat(formData.sellingPrice) || computedValues.suggestedPrice;

    if (rawCost <= 0) {
      showToast("O preço de custo deve ser maior que zero!", "error");
      return;
    }

    if (activeSellingPrice <= 0) {
      showToast("Preço de venda deve ser maior que zero!", "error");
      return;
    }

    // CMV% = (cost / sale) * 100
    const cmvPercent = (rawCost / activeSellingPrice) * 100;
    
    // Real profit rates
    const taxAmt = activeSellingPrice * (rawTax / 100);
    const otherAmt = activeSellingPrice * (rawOther / 100);
    const profitR$ = activeSellingPrice - rawCost - taxAmt - otherAmt;
    const profitPercent = (profitR$ / activeSellingPrice) * 100;

    try {
      await addProduct({
        name: formData.name,
        sku: formData.sku || undefined,
        costPrice: rawCost,
        desiredMargin: rawMargin,
        sellingPrice: activeSellingPrice,
        cmvPct: cmvPercent,
        taxRate: rawTax,
        otherCostsPct: rawOther,
        profitMarginPct: profitPercent,
        profitValue: profitR$,
      });

      // Clear form
      setFormData({
        name: "",
        sku: "",
        costPrice: "",
        desiredMargin: "30",
        taxRate: (profile?.taxRate || 6).toString(),
        otherCostsPct: "10",
        sellingPrice: "",
      });
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      showToast("Erro ao cadastrar produto.", "error");
    }
  };

  const handleFetchAiAdvisor = async () => {
    if (products.length === 0) {
      showToast("Cadastre pelo menos 1 produto para obter a consultoria!", "warning");
      return;
    }
    setLoadingAi(true);
    try {
      const response = await fetch("/api/ai/pricing-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, profile }),
      });
      const data = await response.json();
      if (data.text) {
        setAiReport(data.text);
        showToast("Consultoria estratégica gerada pela Inteligência Artificial!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Falha ao se conectar com a Inteligência Artificial.", "error");
    } finally {
      setLoadingAi(false);
    }
  };

  // Compute stats of registered portfolio
  const portfolioStats = useMemo(() => {
    if (products.length === 0) return null;
    let totalCmv = 0;
    let totalMargin = 0;
    let highestMarginProd: ProductPriceCalc | null = null;
    let highestCmvProd: ProductPriceCalc | null = null;

    products.forEach((p) => {
      totalCmv += p.cmvPct;
      totalMargin += p.profitMarginPct;

      if (!highestMarginProd || p.profitMarginPct > highestMarginProd.profitMarginPct) {
        highestMarginProd = p;
      }
      if (!highestCmvProd || p.cmvPct > highestCmvProd.cmvPct) {
        highestCmvProd = p;
      }
    });

    return {
      avgCmv: totalCmv / products.length,
      avgMargin: totalMargin / products.length,
      bestProduct: highestMarginProd as ProductPriceCalc | null,
      worstCmvProduct: highestCmvProd as ProductPriceCalc | null,
    };
  }, [products]);

  // Export full PDF report of product pricing and AI advice
  const handleExportPDF = () => {
    if (products.length === 0) {
      showToast("Nenhum produto cadastrado para exportar!", "warning");
      return;
    }

    const pdf = new AbntPdfDocument();
    
    // Draw formal ABNT Cover Page
    pdf.drawCover(
      profile?.companyName || "Minha Empresa",
      "RELATÓRIO DE PORTFÓLIO, PRECIFICAÇÃO E ANÁLISE DE CMV",
      "Diagnóstico e Otimização Estratégica de Margens de Lucratividade",
      "PREÇO DE VENDA E MODELAGEM DE CMV PJ"
    );

    // Seção 1
    pdf.addPrimaryHeading("1. RESUMO CONSOLIDADO DO PORTFÓLIO");
    pdf.addParagraph(
      "A precificação estratégica de produtos e serviços fundamenta-se no equilíbrio entre o Custo de Mercadoria Vendida (CMV), as despesas variáveis incidentes e a margem de contribuição mínima exigida para a cobertura dos custos fixos. A seguir, destacam-se os indicadores consolidados obtidos a partir do portfólio ativo:"
    );

    const metrics = [
      { label: "Itens Cadastrados", value: `${products.length} itens` },
      { label: "CMV Médio", value: portfolioStats ? `${portfolioStats.avgCmv.toFixed(1)}%` : "0%" },
      { label: "Margem Líquida Real Média", value: portfolioStats ? `${portfolioStats.avgMargin.toFixed(1)}%` : "0%" }
    ];
    pdf.addSummaryCard("Métricas Consolidadas de Precificação", metrics);

    if (portfolioStats?.bestProduct) {
      pdf.addBulletItem("•", `Produto Mais Lucrativo (Estrela): ${portfolioStats.bestProduct.name} - Margem Líquida de ${portfolioStats.bestProduct.profitMarginPct.toFixed(1)}%.`);
    }
    if (portfolioStats?.worstCmvProduct) {
      pdf.addBulletItem("•", `Produto de Maior CMV (Atenção): ${portfolioStats.worstCmvProduct.name} - CMV de ${portfolioStats.worstCmvProduct.cmvPct.toFixed(1)}%.`);
    }

    pdf.y += 4;

    // Seção 2
    pdf.addPrimaryHeading("2. DEMONSTRATIVO DETALHADO DO PORTFÓLIO E MARGENS");
    
    const tableColumns = [
      { header: "Produto / Serviço", key: "name", width: 60 },
      { header: "Custo (R$)", key: "cost", width: 25, align: "right" as const },
      { header: "Venda (R$)", key: "sale", width: 25, align: "right" as const },
      { header: "CMV (%)", key: "cmv", width: 25, align: "right" as const },
      { header: "Margem (%)", key: "margin", width: 25, align: "right" as const }
    ];

    const tableData = products.map(p => ({
      name: p.name.substring(0, 28),
      cost: `R$ ${p.costPrice.toFixed(2)}`,
      sale: `R$ ${p.sellingPrice.toFixed(2)}`,
      cmv: `${p.cmvPct.toFixed(1)}%`,
      margin: `${p.profitMarginPct.toFixed(1)}%`
    }));

    pdf.addAbntTable(tableColumns, tableData, `Dados extraídos do portfólio cadastrado (2026)`);

    // Seção 3
    if (aiReport) {
      pdf.y += 6;
      pdf.addPrimaryHeading("3. DIRETRIZES ESTRATÉGICAS - CONSULTORIA INTELIGÊNCIA ARTIFICIAL (I.A.)");
      pdf.addParagraph(
        "A seguir, apresenta-se o parecer consultivo emitido por inteligência artificial sob medida para as características do seu portfólio operacional:"
      );

      const paragraphs = aiReport.split("\n");
      paragraphs.forEach((pData) => {
        const text = pData.trim();
        if (!text) return;

        if (text.startsWith("#")) {
          const headerText = text.replace(/#/g, "").trim();
          pdf.addSecondaryHeading(headerText);
        } else if (text.startsWith("* ") || text.startsWith("- ")) {
          pdf.addBulletItem("•", text.replace(/^[*-\s]+/, ""));
        } else {
          pdf.addParagraph(text);
        }
      });
    }

    pdf.save(`Gestor_Relatorio_Produtos_Precificacao_CMV.pdf`);
    showToast("Relatório PDF completo exportado com sucesso!", "success");
  };

  // Export only the AI mentorship report to a beautiful PDF layout
  const handleExportMentorshipOnlyPDF = () => {
    if (!aiReport) {
      showToast("Gere a mentoria estratégica primeiro!", "warning");
      return;
    }

    const pdf = new AbntPdfDocument();

    // Cover page for single Mentorship
    pdf.drawCover(
      profile?.companyName || "Minha Empresa",
      "DIAGNÓSTICO E MENTORIA ESTRATÉGICA DE PRECIFICAÇÃO & CMV",
      "Análise Crítica e Parecer de Inteligência Artificial para Alinhamento de Portfólio",
      "CONSULTORIA INTELIGÊNCIA ARTIFICIAL (I.A.)"
    );

    pdf.addPrimaryHeading("1. PARECER DE CONSULTORIA ESTRATÉGICA");
    pdf.addParagraph(
      "Este documento apresenta as recomendações personalizadas elaboradas pela Inteligência Artificial com base nas métricas de custos, markup e CMV declarados pela gestão empresarial."
    );

    const paragraphs = aiReport.split("\n");
    paragraphs.forEach((pData) => {
      const text = pData.trim();
      if (!text) return;

      if (text.startsWith("#")) {
        const headerText = text.replace(/#/g, "").trim();
        pdf.addSecondaryHeading(headerText);
      } else if (text.startsWith("* ") || text.startsWith("- ")) {
        pdf.addBulletItem("•", text.replace(/^[*-\s]+/, ""));
      } else {
        pdf.addParagraph(text);
      }
    });

    pdf.save(`Mentoria_Precificacao_CMV_IA.pdf`);
    showToast("Mentoria em PDF exportada com sucesso!", "success");
  };

  return (
    <div id="pricing-view-container" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Portfolio overview cards */}
      {products.length > 0 && portfolioStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-[2rem] border border-gray-150 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-2xl text-orange-600 shrink-0">
              <Calculator size={22} />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 italic">Preço de Venda Praticado</span>
              <span className="block text-xl font-black italic tracking-tight font-sans text-gray-900">
                {products.length} {products.length === 1 ? "Produto" : "Produtos"}
              </span>
            </div>
          </div>

          <div className={cn(
            "bg-white p-5 rounded-[2rem] border shadow-xs flex items-center gap-4",
            portfolioStats.avgCmv > 40 ? "border-red-200 bg-red-50/20" : "border-gray-150"
          )}>
            <div className={cn(
              "p-3 rounded-2xl shrink-0",
              portfolioStats.avgCmv > 40 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
            )}>
              <TrendingUp size={22} />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 italic">CMV Médio Real</span>
              <span className="block text-xl font-black italic tracking-tight font-sans text-gray-900">
                {portfolioStats.avgCmv.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[2rem] border border-gray-150 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shrink-0">
              <PiggyBank size={22} />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 italic">Margem Média Real</span>
              <span className="block text-xl font-black italic tracking-tight font-sans text-emerald-600">
                {portfolioStats.avgMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[2rem] border border-gray-150 shadow-xs">
            <div className="flex justify-between items-start gap-1">
              <div>
                <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400 italic">Produto Líder (Margem)</span>
                <span className="block text-xs font-black text-gray-800 line-clamp-1 mt-1">
                  {portfolioStats.bestProduct?.name || "N/A"}
                </span>
                <span className="block text-[10px] font-bold text-emerald-600 mt-0.5">
                  Margem: {portfolioStats.bestProduct?.profitMarginPct.toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded uppercase">Estrela</span>
            </div>
          </div>
        </div>
      )}

      {/* Main product spreadsheet section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-150 shadow-xs overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-6 border-b border-gray-150/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div>
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-orange-500" /> Planilha de Cadastro, Custos & CMV
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure faturamento, impostos e decole a margem de contribuição.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer"
            >
              <Plus size={14} /> Novo Produto
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileDown size={14} /> Exportar PDF
            </button>
          </div>
        </div>

        {/* Dynamic add form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-6 border-b border-gray-150 bg-gray-50/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wide mb-1">Nome do Produto / Prato *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pizza Calabresa Especial"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wide mb-1">Código / SKU (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: CAL-01"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wide mb-1">Preço de Custo (Insumos / Matéria Prima) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Ex: 12.00"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wide mb-1">Margem de Lucro Desejada % *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="95"
                  value={formData.desiredMargin}
                  onChange={(e) => setFormData({ ...formData, desiredMargin: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wide mb-1">Aliquota de Impostos % (Venda)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wide mb-1">Comissões, Cartão & Outros custos var. %</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.otherCostsPct}
                  onChange={(e) => setFormData({ ...formData, otherCostsPct: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wide mb-1">Preço Praticado R$ (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`Sugerido: R$ ${computedValues.suggestedPrice.toFixed(2)}`}
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>

            {/* Dynamic Interactive Calculadora Sidebar Preview panel */}
            <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-orange-100 text-orange-600 font-black px-2 py-0.5 rounded uppercase">Simulador de Margem Dinâmico</span>
                <p className="text-xs text-gray-700 mt-1">
                  Baseado nas suas taxas, o <strong>Preço Sugerido</strong> é de{" "}
                  <strong className="text-orange-600 font-mono">{formatCurrency(computedValues.suggestedPrice)}</strong>.
                </p>
                <p className="text-[10px] text-gray-500">
                  Preço Praticado Ativo: <strong className="font-mono text-gray-700">{formatCurrency(computedValues.activePrice)}</strong> | CMV Projetado:{" "}
                  <strong className="font-mono text-gray-700">{computedValues.cmvPct.toFixed(1)}%</strong> | Lucro Real Líquido:{" "}
                  <strong className={cn("font-mono", computedValues.profitVal >= 0 ? "text-emerald-600" : "text-red-500")}>
                    {formatCurrency(computedValues.profitVal)} ({computedValues.profitMarginPct.toFixed(1)}%)
                  </strong>
                </p>
              </div>

              <div className="flex gap-2 w-full md:w-auto self-stretch md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleAutofillSuggested}
                  className="px-3.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all grow text-center justify-center cursor-pointer"
                >
                  <Wand2 size={13} /> Usar Sugerido
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all grow text-center justify-center cursor-pointer"
                >
                  Adicionar Produto
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Spreadsheet Content */}
        <div className="overflow-x-auto">
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <Calculator size={52} className="text-gray-200 mx-auto mb-4" />
              <h4 className="font-extrabold text-[#141414] text-base">Nenhum produto cadastrado</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Adicione pratos, produtos ou mercadorias para calcular sua margem de contribuição, preço sugerido e custos.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cadastrar Primeiro Produto
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-55 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-150">
                  <th className="px-6 py-4">Nome do Itens</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-4 py-4 text-center">Custo Direto</th>
                  <th className="px-4 py-4 text-center">Taxas % Total</th>
                  <th className="px-4 py-4 text-center">Venda Praticada</th>
                  <th className="px-4 py-4 text-center">CMV%</th>
                  <th className="px-4 py-4 text-center">Lucro Líquido Real</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {products.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-all text-xs">
                      <td className="px-6 py-4 font-extrabold text-[#141414]">
                        {p.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-400">
                        {p.sku || "-"}
                      </td>
                      <td className="px-4 py-4 text-center font-mono font-bold text-gray-700">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-500 font-mono">
                        {(p.taxRate + p.otherCostsPct).toFixed(1)}%
                      </td>
                      <td className="px-4 py-4 text-center font-mono font-bold text-gray-900">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black font-mono tracking-widest border",
                          p.cmvPct <= 30
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : p.cmvPct <= 40
                              ? "bg-amber-50 border-amber-200 text-amber-600"
                              : "bg-red-50 border-red-200 text-red-600"
                        )}>
                          {p.cmvPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          "block font-mono font-black",
                          p.profitValue >= 0 ? "text-emerald-600" : "text-red-500"
                        )}>
                          {formatCurrency(p.profitValue)}
                        </span>
                        <span className="block text-[9px] text-gray-400 tracking-wider">
                          ({p.profitMarginPct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setSellingProduct(p);
                            setSaleQty(1);
                            setAdjustedSellingPrice(p.sellingPrice.toFixed(2));
                            setSaleStoreId(activeStoreId === "all" ? (storeProfiles[0]?.id || "matriz") : activeStoreId);
                          }}
                          className="px-2.5 py-1 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Lançar venda direta deste produto"
                        >
                          <ShoppingCart size={12} /> Lançar Venda
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-1 px-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Remover Prato/Produto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CMV Status Explanatory benchmarks legend */}
      <div className="bg-gray-50/60 p-6 rounded-[2.5rem] border border-gray-150/80 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h5 className="font-extrabold text-xs text-emerald-600 uppercase tracking-widest flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span> CMV Excelente (Até 30%)
          </h5>
          <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
            Seus custos de fabricação estão muito controlados. Garante excelentes margens operacionais brutas para arcar com as despesas fixas da estrutura.
          </p>
        </div>
        <div>
          <h5 className="font-extrabold text-xs text-amber-600 uppercase tracking-widest flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span> CMV Saudável (30% a 40%)
          </h5>
          <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
            Indicador aceitável para a maior parte do comércio varejista e ramo gastronômico brasileiro. Continue renegociando com fornecedores.
          </p>
        </div>
        <div>
          <h5 className="font-extrabold text-xs text-red-500 uppercase tracking-widest flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span> Alerta de CMV Alto (Acima de 40%)
          </h5>
          <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
            Margem de lucro severamente espremida pelos insumos diretos. Risco de prejuízo se houver oscilação de volume. Recomendado otimização urgente.
          </p>
        </div>
      </div>

      {/* IA advice / integration card */}
      <div className="bg-white rounded-[2.5rem] border border-gray-150/80 shadow-xs overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-r from-orange-500/5 to-amber-500/5 border-b border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-500 text-white rounded-3xl shadow-[0_0_15px_rgba(249,115,22,0.3)] shrink-0 animate-bounce">
              <Sparkles size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-[#141414] text-base">Assessoria de Precificação Integrada (I.A.)</h4>
              <p className="text-xs text-gray-500 mt-0.5">Clique para simular, obter diagnóstico de margem cruzada e decolar seus lucros.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto self-stretch md:self-auto shrink-0">
            {aiReport && (
              <button
                onClick={handleExportMentorshipOnlyPDF}
                className="px-5 py-3 border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 transition-all text-center justify-center shrink-0 cursor-pointer"
              >
                <FileDown size={14} /> Exportar Mentoria (PDF)
              </button>
            )}
            <button
              onClick={handleFetchAiAdvisor}
              disabled={loadingAi}
              className="px-6 py-3 bg-[#141414] hover:bg-[#141414]/90 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 transition-all text-center justify-center shrink-0 shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
            >
              {loadingAi ? "Analisando planilha..." : "Analisar com I.A."}
            </button>
          </div>
        </div>

        {/* AI response content */}
        {aiReport && (
          <div className="p-6 md:p-8 space-y-4 prose max-w-none text-xs leading-relaxed text-gray-750">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-orange-50 border border-orange-100 rounded-3xl p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <HelpCircle size={18} className="text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <h5 className="font-extrabold text-xs text-orange-800 m-0 leading-tight">Sua Mentoria Estratégica Está Pronta!</h5>
                  <p className="text-[10px] m-0 text-orange-700/80 mt-1">
                    Análise exclusiva baseada nos seus {products.length} produtos. Exporte um documento independente com todas as tomadas de decisões financeiras.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportMentorshipOnlyPDF}
                className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(249,115,22,0.25)] cursor-pointer shrink-0 font-bold"
              >
                <FileDown size={14} /> Baixar PDF da Mentoria
              </button>
            </div>

            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-200/60 font-sans text-gray-800 space-y-3 whitespace-pre-line leading-relaxed relative">
              <div className="absolute top-4 right-4 print:hidden opacity-80 hover:opacity-100 transition-all z-10">
                <button
                  onClick={handleExportMentorshipOnlyPDF}
                  className="p-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  title="Exportar esta mentoria para PDF"
                >
                  <FileDown size={13} /> Exportar PDF
                </button>
              </div>
              {aiReport}
            </div>
          </div>
        )}
      </div>

      {/* Modal Lançar Venda Direta (Fast Sale) */}
      {sellingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
            <button
              onClick={() => setSellingProduct(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={18} />
            </button>
            <h4 className="text-lg font-extrabold text-[#141414] mb-1 flex items-center gap-2">
              <ShoppingCart size={18} className="text-orange-500 shrink-0" /> Registrar Venda de Produto
            </h4>
            <p className="text-[11px] text-gray-450 mb-5 font-medium leading-relaxed">
              Venda integrada direta com geração automática de CMV no DRE e relatórios da Inteligência Artificial.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const qty = saleQty;
                const sellingPriceVal = parseFloat(adjustedSellingPrice) || sellingProduct.sellingPrice;
                const revenueCategory = categories.find(c => c.group === 'REVENUE' && c.type === 'income') || categories.find(c => c.type === 'income');
                
                if (!revenueCategory) {
                  showToast("Nenhuma categoria de receita cadastrada no sistema.", "error");
                  return;
                }

                addTransaction({
                  description: `Venda: ${sellingProduct.name} (x${qty})`,
                  amount: sellingPriceVal * qty,
                  type: "income",
                  categoryId: revenueCategory.id,
                  date: new Date(),
                  profileId: saleStoreId,
                  isProductSale: true,
                  productId: sellingProduct.id,
                  quantity: qty,
                  productCostPrice: sellingProduct.costPrice,
                });

                showToast(`Sucesso! Venda de ${qty}x ${sellingProduct.name} (Total: ${formatCurrency(sellingPriceVal * qty)}) lançada no sistema.`, "success");
                setSellingProduct(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                  Produto Selecionado
                </label>
                <div className="w-full text-xs font-bold bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-[#141414] flex justify-between items-center">
                  <span>{sellingProduct.name}</span>
                  <span className="font-mono text-gray-400 text-[10px]">{sellingProduct.sku || "SEM SKU"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                    Qtd Vendida
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={saleQty}
                    onChange={(e) => setSaleQty(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-bold font-mono border border-gray-150 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                    Preço Unitário Praticado
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black font-mono text-gray-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={adjustedSellingPrice}
                      onChange={(e) => setAdjustedSellingPrice(e.target.value)}
                      className="w-full text-xs font-bold font-mono border border-gray-150 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                  Empresa / Filial
                </label>
                <select
                  required
                  value={saleStoreId}
                  onChange={(e) => setSaleStoreId(e.target.value)}
                  className="w-full text-xs font-bold border border-gray-150 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer text-gray-800"
                >
                  {storeProfiles.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Receita Bruta</p>
                  <p className="text-sm font-black font-mono text-orange-600">
                    {formatCurrency((parseFloat(adjustedSellingPrice) || sellingProduct.sellingPrice) * saleQty)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">CMV Total Integrada</p>
                  <p className="text-xs font-black font-mono text-gray-500">
                    {formatCurrency(sellingProduct.costPrice * saleQty)}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#141414] hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-xs font-black uppercase tracking-widest cursor-pointer mt-2"
              >
                Registrar Lançamento Financeiro
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
