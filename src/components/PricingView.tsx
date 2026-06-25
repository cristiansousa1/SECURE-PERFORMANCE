import React, { useState, useMemo, useEffect } from "react";
import InventoryView from "./InventoryView";
import { useFinance, Note } from "../contexts/FinanceContext";
import { ProductPriceCalc } from "../types";
import { sound } from "../utils/SoundEngine";
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
  Volume2,
  VolumeX,
  Play,
  Square,
  Edit3,
  Award,
  DollarSign,
  Search,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { AbntPdfDocument } from "../utils/pdfAbntHelper";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line, BarChart, Bar, ReferenceLine } from "recharts";

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
    inventoryItems,
    addInventoryItem,
    deleteInventoryItem,
    updateInventoryItem,
  } = useFinance();

  // Audit of Margin vs simplified taxation
  const [activeModule, setActiveModule] = useState<"pricing" | "inventory">("pricing");
  const [taxAuditProductId, setTaxAuditProductId] = useState<string>("");

  // Top-level states and effects for smooth cubic-bezier CSS animations
  const currentAuditProduct = products.find(p => p.id === taxAuditProductId) || products[0];
  const targetMargemPct = currentAuditProduct ? Math.max(5, Math.min(95, (currentAuditProduct.profitMarginPct / Math.max(0.1, currentAuditProduct.profitMarginPct + currentAuditProduct.taxRate)) * 100)) : 0;
  const targetTaxPct = currentAuditProduct ? Math.max(5, Math.min(95, (currentAuditProduct.taxRate / Math.max(0.1, currentAuditProduct.profitMarginPct + currentAuditProduct.taxRate)) * 100)) : 0;

  const [animMargem, setAnimMargem] = useState(0);
  const [animTax, setAnimTax] = useState(0);

  useEffect(() => {
    setAnimMargem(0);
    setAnimTax(0);
    const r = requestAnimationFrame(() => {
      const t = setTimeout(() => {
        setAnimMargem(targetMargemPct);
        setAnimTax(targetTaxPct);
      }, 50);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(r);
  }, [targetMargemPct, targetTaxPct]);

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
    salesCount: "0",
  });

  // Edit form states
  const [editingProduct, setEditingProduct] = useState<ProductPriceCalc | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    sku: "",
    costPrice: "",
    desiredMargin: "30",
    taxRate: (profile?.taxRate || 6).toString(),
    otherCostsPct: "10",
    sellingPrice: "",
    salesCount: "0",
  });

  // Channel Pricing Simulator states
  const [simulatorProduct, setSimulatorProduct] = useState<ProductPriceCalc | null>(null);
  const [channelCommissions, setChannelCommissions] = useState({
    balcao: 2.5,
    deliveryBasic: 12.0,
    deliveryPremium: 25.0,
  });

  // Price Elasticity of Demand (EPD) Simulator states
  const [elasticityProduct, setElasticityProduct] = useState<ProductPriceCalc | null>(null);
  const [elasticityCoef, setElasticityCoef] = useState<number>(-1.5);
  const [priceChangePct, setPriceChangePct] = useState<number>(10);
  const [baseWeeklyVolume, setBaseWeeklyVolume] = useState<number>(100);

  // Fast Sales Mode states
  const [sellingProduct, setSellingProduct] = useState<ProductPriceCalc | null>(null);
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleStoreId, setSaleStoreId] = useState<string>("");
  const [adjustedSellingPrice, setAdjustedSellingPrice] = useState<string>("");

  // AI advisory state
  const [aiReport, setAiReport] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSpeakingReport, setIsSpeakingReport] = useState(false);

  // Targets Net Profit Margin Markup Simulator states
  const [simCost, setSimCost] = useState<number>(30);
  const [simTax, setSimTax] = useState<number>(profile?.taxRate || 6);
  const [simOther, setSimOther] = useState<number>(10);
  const [simTargetMargin, setSimTargetMargin] = useState<number>(30);
  const [simModel, setSimModel] = useState<'divisora' | 'cost_plus' | 'nominal'>('divisora');
  const [desiredProfitNominal, setDesiredProfitNominal] = useState<number>(15);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [costIncreasePct, setCostIncreasePct] = useState<number>(0);

  // SKU Price Optimization States
  const [adjustedMarkups, setAdjustedMarkups] = useState<Record<string, number>>({});
  const [skuSearch, setSkuSearch] = useState<string>("");
  const [marginAnalysisSearch, setMarginAnalysisSearch] = useState<string>("");
  const [isApplyingAllSKUs, setIsApplyingAllSKUs] = useState<boolean>(false);

  useEffect(() => {
    if (profile?.taxRate) {
      setSimTax(profile.taxRate);
    }
  }, [profile?.taxRate]);

  // Stop vocal speech upon component unmount to prevent floating background voices
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[*#_`~[\]]/g, "") // remove markdown structure symbols for natural pronunciation
      .replace(/[-•]\s*/g, " ")   // convert lists bullet marks to smooth spaces
      .replace(/R\$\s*([0-9.,]+)/g, "$1 Reais") // friendly real brazilian currency pronunciation
      .replace(/\%/g, " por cento") // pronounce percentages smoothly
      .trim();
  };

  const handleToggleSpeech = (textToSpeak: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      showToast("Seu navegador não oferece suporte para síntese de voz (SpeechSynthesis).", "warning");
      return;
    }

    if (isSpeakingReport) {
      window.speechSynthesis.cancel();
      setIsSpeakingReport(false);
      showToast("Leitura do relatório interrompida.", "info");
      return;
    }

    const cleanedText = cleanTextForSpeech(textToSpeak);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = "pt-BR";

    // Read pitch, rate, and voice name pre-configured by user or fallback
    const savedPitch = localStorage.getItem("dafne_voice_pitch");
    const savedRate = localStorage.getItem("dafne_voice_rate");
    const savedVoiceName = localStorage.getItem("dafne_selected_voice") || "";

    utterance.rate = savedRate ? parseFloat(savedRate) : 1.10;
    utterance.pitch = savedPitch ? parseFloat(savedPitch) : 1.15;

    // Resolve pt-BR voice from platform native options
    const availableVoices = window.speechSynthesis.getVoices();
    const ptBrVoices = availableVoices.filter(v => 
      v.lang.toLowerCase().includes("pt-br") || 
      v.lang.toLowerCase().startsWith("pt")
    );

    let chosenVoice: SpeechSynthesisVoice | null = null;
    if (ptBrVoices.length > 0) {
      if (savedVoiceName) {
        chosenVoice = ptBrVoices.find(v => v.name === savedVoiceName) || null;
      }
      if (!chosenVoice) {
        chosenVoice = ptBrVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes("natural") && (
            name.includes("maria") || 
            name.includes("francisca") || 
            name.includes("google") || 
            name.includes("female") || 
            name.includes("mulher") || 
            name.includes("suave")
          );
        }) || null;
      }
      if (!chosenVoice) {
        chosenVoice = ptBrVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes("maria") || 
                 name.includes("francisca") || 
                 name.includes("heloisa") || 
                 name.includes("heloísa") || 
                 name.includes("luciana") || 
                 name.includes("victoria") || 
                 name.includes("vitoria") || 
                 name.includes("vitória") || 
                 name.includes("fernanda") || 
                 name.includes("priscilla") || 
                 name.includes("helena") || 
                 name.includes("zoraida") || 
                 name.includes("female") || 
                 name.includes("mulher") || 
                 name.includes("suave");
        }) || null;
      }
      if (!chosenVoice) {
        chosenVoice = ptBrVoices[0];
      }
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => {
      setIsSpeakingReport(true);
    };
    utterance.onend = () => {
      setIsSpeakingReport(false);
    };
    utterance.onerror = () => {
      setIsSpeakingReport(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    showToast("A mentora Dafne iniciou a leitura do laudo financeiro sob medida.", "info");
  };

  // Dynamic calculations as user types in form
  const computedValues = useMemo(() => {
    const rawCost = parseFloat(formData.costPrice) || 0;
    // Guaranteed safety margin of at least 30% to prevent zero-to-zero suggestions
    const rawMargin = Math.max(parseFloat(formData.desiredMargin) || 0, 30);
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

  // Reverse margin analyzer for adding new products (Calculates markup required dynamically if sellingPrice is manually adjusted)
  const reverseMarginPct = useMemo(() => {
    const rawCost = parseFloat(formData.costPrice) || 0;
    const rawTax = parseFloat(formData.taxRate) || 0;
    const rawOther = parseFloat(formData.otherCostsPct) || 0;
    const rawPrice = parseFloat(formData.sellingPrice) || 0;

    if (rawCost > 0 && rawPrice > rawCost) {
      const calcMargin = 100 * (1 - rawCost / rawPrice) - rawTax - rawOther;
      return Math.round(calcMargin * 10) / 10;
    }
    return null;
  }, [formData]);

  // Edit calculations
  const editComputedValues = useMemo(() => {
    if (!editingProduct) return null;
    const rawCost = parseFloat(editFormData.costPrice) || 0;
    // Guaranteed safety margin of at least 30% to prevent zero-to-zero suggestions
    const rawMargin = Math.max(parseFloat(editFormData.desiredMargin) || 0, 30);
    const rawTax = parseFloat(editFormData.taxRate) || 0;
    const rawOther = parseFloat(editFormData.otherCostsPct) || 0;

    const totalDeductionsPct = rawTax + rawOther + rawMargin;
    
    let suggestedPrice = 0;
    if (totalDeductionsPct < 100) {
      suggestedPrice = rawCost / (1 - totalDeductionsPct / 100);
    } else {
      suggestedPrice = rawCost * (1 + rawMargin / 100);
    }

    const activePrice = parseFloat(editFormData.sellingPrice) || suggestedPrice;
    const cmvPct = activePrice > 0 ? (rawCost / activePrice) * 100 : 0;
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
  }, [editFormData, editingProduct]);

  // Reverse margin analyzer for editing products
  const editReverseMarginPct = useMemo(() => {
    const rawCost = parseFloat(editFormData.costPrice) || 0;
    const rawTax = parseFloat(editFormData.taxRate) || 0;
    const rawOther = parseFloat(editFormData.otherCostsPct) || 0;
    const rawPrice = parseFloat(editFormData.sellingPrice) || 0;

    if (rawCost > 0 && rawPrice > rawCost) {
      const calcMargin = 100 * (1 - rawCost / rawPrice) - rawTax - rawOther;
      return Math.round(calcMargin * 10) / 10;
    }
    return null;
  }, [editFormData, editingProduct]);

  const handleOpenEdit = (product: ProductPriceCalc) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      sku: product.sku || "",
      costPrice: product.costPrice.toString(),
      desiredMargin: product.desiredMargin.toString(),
      taxRate: product.taxRate.toString(),
      otherCostsPct: product.otherCostsPct.toString(),
      sellingPrice: product.sellingPrice.toString(),
      salesCount: (product.salesCount || 0).toString(),
    });
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editFormData.name) {
      showToast("Insira o nome do produto!", "error");
      return;
    }
    const rawCost = parseFloat(editFormData.costPrice) || 0;
    const rawMargin = Math.max(parseFloat(editFormData.desiredMargin) || 0, 30);
    const rawTax = parseFloat(editFormData.taxRate) || 0;
    const rawOther = parseFloat(editFormData.otherCostsPct) || 0;
    const activeSellingPrice = parseFloat(editFormData.sellingPrice) || (editComputedValues?.suggestedPrice || 0);

    if (rawCost <= 0) {
      showToast("O preço de custo deve ser maior que zero!", "error");
      return;
    }
    if (activeSellingPrice <= 0) {
      showToast("Preço de venda deve ser maior que zero!", "error");
      return;
    }

    const cmvPercent = (rawCost / activeSellingPrice) * 100;
    const taxAmt = activeSellingPrice * (rawTax / 100);
    const otherAmt = activeSellingPrice * (rawOther / 100);
    const profitR$ = activeSellingPrice - rawCost - taxAmt - otherAmt;
    const profitPercent = (profitR$ / activeSellingPrice) * 100;

    try {
      await updateProduct(editingProduct.id, {
        name: editFormData.name,
        sku: editFormData.sku || undefined,
        costPrice: rawCost,
        desiredMargin: rawMargin,
        sellingPrice: activeSellingPrice,
        cmvPct: cmvPercent,
        taxRate: rawTax,
        otherCostsPct: rawOther,
        profitMarginPct: profitPercent,
        profitValue: profitR$,
        salesCount: parseInt(editFormData.salesCount) || 0,
      });
      showToast("Produto atualizado com sucesso!", "success");
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      showToast("Erro ao editar produto.", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast("Insira o nome do produto!", "error");
      return;
    }

    const rawCost = parseFloat(formData.costPrice) || 0;
    const rawMargin = Math.max(parseFloat(formData.desiredMargin) || 0, 30);
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
        salesCount: parseInt(formData.salesCount) || 0,
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
        salesCount: "0",
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

  // Targets Net Profit Margin Markup Calculations
  const computedSim = useMemo(() => {
    const costAfterInflation = simCost * (1 + costIncreasePct / 100);
    const tax = simTax;
    const other = simOther;
    const targetMargin = simTargetMargin; // Dynamic net margin
    const totalDeductions = tax + other + targetMargin;
    
    // 1. Margem Divisora (Margem de Contribuição % Alvo)
    let sellingPriceDivisora = 0;
    let possibleDivisora = totalDeductions < 100;
    if (possibleDivisora) {
      sellingPriceDivisora = costAfterInflation / (1 - totalDeductions / 100);
    }
    
    // 2. Cost-Plus Aditivo
    const sellingPriceCostPlus = costAfterInflation * (1 + totalDeductions / 100);
    
    // 3. Valor Líquido Nominal Alvo
    let sellingPriceNominal = 0;
    const taxesAndOther = tax + other;
    let possibleNominal = taxesAndOther < 100;
    if (possibleNominal) {
      sellingPriceNominal = (costAfterInflation + desiredProfitNominal) / (1 - taxesAndOther / 100);
    }
    
    // Select active proposed price based on layout selection
    let proposedPrice = 0;
    let possible = true;
    if (simModel === 'divisora') {
      proposedPrice = sellingPriceDivisora;
      possible = possibleDivisora;
    } else if (simModel === 'cost_plus') {
      proposedPrice = sellingPriceCostPlus;
    } else {
      proposedPrice = sellingPriceNominal;
      possible = possibleNominal;
    }
    
    // Apply discount simulation
    const finalPrice = proposedPrice * (1 - discountPct / 100);
    const taxAmount = finalPrice * (tax / 100);
    const otherAmount = finalPrice * (other / 100);
    const targetProfitVal = finalPrice - costAfterInflation - taxAmount - otherAmount;
    const netProfitMarginPct = finalPrice > 0 ? (targetProfitVal / finalPrice) * 100 : 0;
    const markupMultiplier = costAfterInflation > 0 ? finalPrice / costAfterInflation : 0;
    const markupPct = (markupMultiplier > 0) ? (markupMultiplier - 1) * 100 : 0;
    
    return {
      markupMultiplier,
      markupPct,
      sellingPrice30: finalPrice, // Keep consistent variable name so layout remains unbroken
      sellingPriceDivisora,
      sellingPriceCostPlus,
      sellingPriceNominal,
      possibleDivisora,
      possibleNominal,
      taxAmount,
      otherAmount,
      targetProfitVal,
      possible,
      totalDeductions,
      costAfterInflation,
      netProfitMarginPct
    };
  }, [simCost, simTax, simOther, simTargetMargin, simModel, desiredProfitNominal, discountPct, costIncreasePct]);

  const productsRecommendations = useMemo(() => {
    return products.map(p => {
      const targetMargin = simTargetMargin; // Margem líquida alvo dinâmica definida pelo usuário
      const totalDeductions = p.taxRate + p.otherCostsPct + targetMargin;
      let recPrice = 0;
      let markupMultiplier = 0;
      let possible = true;
      
      if (totalDeductions < 100) {
        markupMultiplier = 1 / (1 - totalDeductions / 100);
        recPrice = p.costPrice * markupMultiplier;
      } else {
        possible = false;
      }
      
      const markupPct = markupMultiplier > 0 ? (markupMultiplier - 1) * 100 : 0;
      const isPriceClose = p.sellingPrice > 0 ? Math.abs(p.sellingPrice - recPrice) < 0.05 : false;
      
      return {
        product: p,
        recPrice,
        markupMultiplier,
        markupPct,
        possible,
        isPriceClose,
        totalDeductions
      };
    });
  }, [products, simTargetMargin]);

  // SKU Price Optimization Calculations
  const skuOptimizations = useMemo(() => {
    return products.map(p => {
      const defaultMarkup = p.costPrice > 0 ? (p.sellingPrice / p.costPrice) : 1.0;
      const currentMarkup = adjustedMarkups[p.id] !== undefined ? adjustedMarkups[p.id] : defaultMarkup;
      
      const simSellingPrice = p.costPrice * currentMarkup;
      const simCmvPct = simSellingPrice > 0 ? (p.costPrice / simSellingPrice) * 100 : 0;
      const simProfitValue = simSellingPrice - p.costPrice - (simSellingPrice * (p.taxRate + p.otherCostsPct) / 100);
      const simMarginPct = simSellingPrice > 0 ? (simProfitValue / simSellingPrice) * 100 : 0;
      
      const isModified = adjustedMarkups[p.id] !== undefined && Math.abs(adjustedMarkups[p.id] - defaultMarkup) > 0.001;
      
      return {
        product: p,
        currentMarkup,
        simSellingPrice,
        simCmvPct,
        simProfitValue,
        simMarginPct,
        isModified,
        defaultMarkup
      };
    });
  }, [products, adjustedMarkups]);

  const skuSummary = useMemo(() => {
    let totalOriginalMargin = 0;
    let totalSimulatedMargin = 0;
    
    let originalCriticalCount = 0;
    let simulatedCriticalCount = 0;
    
    let totalOriginalRevenue = 0;
    let totalSimulatedRevenue = 0;
    
    skuOptimizations.forEach(item => {
      const origMargin = item.product.profitMarginPct;
      totalOriginalMargin += origMargin;
      if (origMargin < 20) {
        originalCriticalCount++;
      }
      const sales = item.product.salesCount || 0;
      totalOriginalRevenue += item.product.sellingPrice * sales;
      
      totalSimulatedMargin += item.simMarginPct;
      if (item.simMarginPct < 20) {
        simulatedCriticalCount++;
      }
      totalSimulatedRevenue += item.simSellingPrice * sales;
    });
    
    const avgOriginalMargin = products.length > 0 ? totalOriginalMargin / products.length : 18.5;
    const avgSimulatedMargin = products.length > 0 ? totalSimulatedMargin / products.length : 18.5;
    
    const modifiedCount = Object.keys(adjustedMarkups).length;
    
    return {
      avgOriginalMargin,
      avgSimulatedMargin,
      originalCriticalCount,
      simulatedCriticalCount,
      totalOriginalRevenue,
      totalSimulatedRevenue,
      modifiedCount
    };
  }, [skuOptimizations, products.length, adjustedMarkups]);

  // Margin Analysis Memoized calculations for Contribution Margin Evaluation
  const marginAnalysisData = useMemo(() => {
    const list = products.map((p) => {
      const rawCost = p.costPrice;
      const activePrice = p.sellingPrice;
      const taxAmt = activePrice * (p.taxRate / 100);
      const otherAmt = activePrice * (p.otherCostsPct / 100);
      const profitR$ = activePrice - rawCost - taxAmt - otherAmt;
      const marginPct = activePrice > 0 ? (profitR$ / activePrice) * 100 : 0;
      const cmvPct = activePrice > 0 ? (rawCost / activePrice) * 100 : 0;
      const isCritical = marginPct < 20;

      return {
        ...p,
        profitR$,
        marginPct,
        cmvPct,
        taxAmt,
        otherAmt,
        isCritical,
      };
    });

    const totalProducts = list.length;
    const criticalList = list.filter(item => item.isCritical);
    const criticalCount = criticalList.length;
    const avgMargin = totalProducts > 0 ? list.reduce((sum, item) => sum + item.marginPct, 0) / totalProducts : 0;

    return {
      list,
      totalProducts,
      criticalCount,
      avgMargin,
      criticalList
    };
  }, [products]);

  // Search filter matching product name and SKU
  const filteredProductsForMargin = useMemo(() => {
    return marginAnalysisData.list.filter((p) => {
      const term = marginAnalysisSearch.toLowerCase().trim();
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
    });
  }, [marginAnalysisData.list, marginAnalysisSearch]);

  const handleRePriceProductToHealthy = async (id: string, targetMarginPct = 30) => {
    sound.playClick();
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    
    const rawTax = p.taxRate;
    const rawOther = p.otherCostsPct;
    const totalDeductionsPct = rawTax + rawOther + targetMarginPct;
    
    let suggestedPrice = 0;
    if (totalDeductionsPct < 100) {
      suggestedPrice = p.costPrice / (1 - totalDeductionsPct / 100);
    } else {
      suggestedPrice = p.costPrice * 1.5; // Fallback
    }
    
    const cmvPercent = p.costPrice > 0 ? (p.costPrice / suggestedPrice) * 100 : 0;
    const taxAmt = suggestedPrice * (rawTax / 100);
    const otherAmt = suggestedPrice * (rawOther / 100);
    const profitR$ = suggestedPrice - p.costPrice - taxAmt - otherAmt;
    const profitPercent = (profitR$ / suggestedPrice) * 100;
    
    try {
      await updateProduct(id, {
        sellingPrice: Number(suggestedPrice.toFixed(2)),
        cmvPct: Number(cmvPercent.toFixed(2)),
        profitMarginPct: Number(profitPercent.toFixed(2)),
        profitValue: Number(profitR$.toFixed(2)),
        desiredMargin: targetMarginPct,
      });
      
      showToast(`Preço de "${p.name}" atualizado para atingir ${targetMarginPct}% de margem saudável!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao tentar atualizar preço do produto.", "error");
    }
  };

  const handleApplySKUAdjustment = async (id: string, simPrice: number, simMargin: number, simProfitVal: number, markupVal: number) => {
    sound.playClick();
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    
    const cmvPercent = p.costPrice > 0 ? (p.costPrice / simPrice) * 100 : 0;
    
    try {
      await updateProduct(id, {
        sellingPrice: Number(simPrice.toFixed(2)),
        cmvPct: Number(cmvPercent.toFixed(2)),
        profitMarginPct: Number(simMargin.toFixed(2)),
        profitValue: Number(simProfitVal.toFixed(2)),
        desiredMargin: Number(markupVal.toFixed(2)),
      });
      
      const updated = { ...adjustedMarkups };
      delete updated[id];
      setAdjustedMarkups(updated);
      showToast(`Preço do SKU "${p.name}" foi reajustado com sucesso!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao atualizar o preço do SKU.", "error");
    }
  };

  const handleResetSKUAdjustment = (id: string) => {
    sound.playClick();
    const updated = { ...adjustedMarkups };
    delete updated[id];
    setAdjustedMarkups(updated);
  };

  const handleApplyAllSKUAdjustments = async () => {
    sound.playClick();
    const idsToApply = Object.keys(adjustedMarkups);
    if (idsToApply.length === 0) {
      showToast("Nenhuma otimização de SKU para salvar!", "info");
      return;
    }
    setIsApplyingAllSKUs(true);
    try {
      for (const id of idsToApply) {
        const p = products.find(prod => prod.id === id);
        if (!p) continue;
        const m = adjustedMarkups[id];
        const simPrice = p.costPrice * m;
        const simProfitVal = simPrice - p.costPrice - (simPrice * (p.taxRate + p.otherCostsPct) / 100);
        const simMargin = simPrice > 0 ? (simProfitVal / simPrice) * 100 : 0;
        const cmvPercent = p.costPrice > 0 ? (p.costPrice / simPrice) * 100 : 0;
        
        await updateProduct(id, {
          sellingPrice: Number(simPrice.toFixed(2)),
          cmvPct: Number(cmvPercent.toFixed(2)),
          profitMarginPct: Number(simMargin.toFixed(2)),
          profitValue: Number(simProfitVal.toFixed(2)),
        });
      }
      setAdjustedMarkups({});
      showToast("Todas as margens otimizadas por SKU foram gravadas em lote!", "success");
    } catch (err) {
      console.error(err);
      showToast("Houve um erro ao atualizar os produtos em lote.", "error");
    } finally {
      setIsApplyingAllSKUs(false);
    }
  };

  const applyGlobalMarkupPreset = (preset: number) => {
    sound.playClick();
    const newMarkups: Record<string, number> = {};
    products.forEach(p => {
      newMarkups[p.id] = preset;
    });
    setAdjustedMarkups(newMarkups);
    showToast(`Simulador ajustado para o markup global de ${preset.toFixed(1)}x para todos os produtos!`, "info");
  };

  const resetAllMarkupsPreset = () => {
    sound.playClick();
    setAdjustedMarkups({});
    showToast("Todas as simulações de markup foram resetadas para os originais praticados.", "info");
  };

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
      
      {/* Module Selector tabs */}
      <div className="flex bg-gray-100/95 p-1.5 rounded-3xl max-w-lg border border-gray-200">
        <button
          onClick={() => {
            sound.playClick();
            setActiveModule("pricing");
          }}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
            activeModule === "pricing"
              ? "bg-white text-gray-900 shadow-xs border border-gray-150 font-extrabold"
              : "text-gray-500 hover:text-gray-850"
          )}
        >
          🏷️ Precificação & Margem de CMV
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveModule("inventory");
          }}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
            activeModule === "inventory"
              ? "bg-white text-gray-900 shadow-xs border border-gray-150 font-extrabold"
              : "text-gray-500 hover:text-gray-850"
          )}
        >
          📦 Estoque de Insumos
        </button>
      </div>

      {activeModule === "inventory" ? (
        <InventoryView />
      ) : (
        <>
      {/* Portfolio overview cards & Simplified Tax Auditor */}
      {products.length > 0 && portfolioStats && (() => {
        const activeAuditProduct = products.find(p => p.id === taxAuditProductId) || products[0];
        
        // Safety / Aggressiveness conditions
        const isHealthy = activeAuditProduct.profitMarginPct > activeAuditProduct.taxRate * 2.5;
        const isModerate = activeAuditProduct.profitMarginPct > activeAuditProduct.taxRate && activeAuditProduct.profitMarginPct <= activeAuditProduct.taxRate * 2.5;
        const isDangerous = activeAuditProduct.profitMarginPct <= activeAuditProduct.taxRate;
        
        let healthLabel = "Segura / Conservadora";
        let healthBadgeClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        let cardBorderClass = "border-emerald-500/30 hover:border-emerald-500";
        let descriptionMsg = "A margem operacional é robusta e supera o imposto com folga securitária.";
        
        if (isModerate) {
          healthLabel = "Margem Estreita / Atenção";
          healthBadgeClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
          cardBorderClass = "border-amber-400/30 hover:border-amber-400";
          descriptionMsg = "Margem sob atenção. Qualquer aumento ou ajuste tributário corroerá seu ganho líquido.";
        } else if (isDangerous) {
          healthLabel = "ALTAMENTE AGRESSIVA / PERIGO";
          healthBadgeClass = "bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse";
          cardBorderClass = "border-rose-500/50 hover:border-rose-500 animate-[pulse_2.5s_infinite]";
          descriptionMsg = "Operação crítica! O imposto simplificado consome quase toda a margem líquida real.";
        }

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Existing Cards Subgrid (col-span-8) */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[2rem] border border-gray-150 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-2xl text-orange-600 shrink-0">
                  <Calculator size={22} />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black tracking-widest text-[#9c9c9c] italic">Preço de Venda Praticado</span>
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
                  <span className="block text-[10px] uppercase font-black tracking-widest text-[#9c9c9c] italic">CMV Médio Real</span>
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
                  <span className="block text-[10px] uppercase font-black tracking-widest text-[#9c9c9c] italic">Margem Média Real</span>
                  <span className="block text-xl font-black italic tracking-tight font-sans text-emerald-600">
                    {portfolioStats.avgMargin.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-[2rem] border border-gray-150 shadow-xs">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <span className="block text-[10px] uppercase font-black tracking-widest text-[#9c9c9c] italic">Produto Líder (Margem)</span>
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

            {/* Simulated Tax vs Net Margin Auditor Card using class dashboard-stat-card (col-span-4) */}
            <div className={cn(
              "dashboard-stat-card bg-white p-6.5 rounded-[2.2rem] border-2 shadow-xs transition-all duration-400 flex flex-col justify-between relative overflow-hidden select-none lg:col-span-4",
              cardBorderClass
            )}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 blur-xl rounded-full pointer-events-none" />
              
              <div className="space-y-3.5 relative z-10 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1.5 border-b border-gray-100 pb-2 mb-2">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className={cn("w-2 h-2 rounded-full", isDangerous ? "bg-rose-500 animate-ping" : isModerate ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                      <p className="text-[12px] font-semibold uppercase text-slate-705 font-sans tracking-tight">
                        Auditor Tributário
                      </p>
                    </div>
                    <span className={cn("text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border", healthBadgeClass)}>
                      {healthLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Produto:</span>
                    <select
                      value={activeAuditProduct ? activeAuditProduct.id : ""}
                      onChange={(e) => {
                        sound.playClick();
                        setTaxAuditProductId(e.target.value);
                      }}
                      className="bg-[#fafafa]/50 hover:bg-slate-100 font-extrabold text-[11px] text-slate-800 border border-gray-250 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500 flex-1 min-w-0"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center my-3 bg-gray-50/50 p-2 rounded-2xl border border-gray-150/50">
                    <div>
                      <span className="block text-[8px] uppercase font-black tracking-widest text-slate-400">Margem Líquida</span>
                      <span className={cn("text-lg font-black font-mono tracking-tight", isDangerous ? "text-rose-600" : isModerate ? "text-amber-600" : "text-emerald-600")}>
                        {activeAuditProduct ? activeAuditProduct.profitMarginPct.toFixed(1) : "0.0"}%
                      </span>
                    </div>
                    <div className="border-l border-gray-200">
                      <span className="block text-[8px] uppercase font-black tracking-widest text-slate-400">Tributação (Def)</span>
                      <span className="text-lg font-black font-mono tracking-tight text-indigo-650">
                        {activeAuditProduct ? activeAuditProduct.taxRate.toFixed(1) : "0.0"}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Graphical Bar for direct comparison */}
                  {activeAuditProduct && (
                    <div className="space-y-1.5 my-3">
                      <div className="flex justify-between text-[8.5px] font-extrabold text-slate-500">
                        <span>MARGEM LÍQUIDA VS IMPOSTOS</span>
                        <span className="text-gray-400 font-mono">PROPORÇÃO</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        {/* Margem Bar */}
                        <div 
                          className={cn(
                            "h-full transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                            isDangerous ? "bg-rose-500" : isModerate ? "bg-amber-400" : "bg-emerald-500"
                          )}
                          style={{ width: `${animMargem}%` }}
                          title={`Proporção Margem: ${activeAuditProduct.profitMarginPct.toFixed(1)}%`}
                        />
                        {/* Tax Bar */}
                        <div 
                          className="h-full bg-indigo-400 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                          style={{ width: `${animTax}%` }}
                          title={`Proporção Imposto: ${activeAuditProduct.taxRate.toFixed(1)}%`}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-bold text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Margem</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-400 inline-block" /> Alíquota Fiscal</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 mt-2">
                  <p className="text-[10px] text-gray-500 leading-snug font-medium italic">
                    {descriptionMsg}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Ranking e Contagem de Produtos que Mais Vendem */}
      {products.length > 0 && (() => {
        const sortedBySales = [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        const totalSalesVolume = products.reduce((acc, p) => acc + (p.salesCount || 0), 0);
        const topSeller = sortedBySales[0];
        const maxSales = topSeller && (topSeller.salesCount || 0) > 0 ? (topSeller.salesCount || 0) : 1;
        const totalEstimatedRevenue = products.reduce((acc, p) => acc + ((p.salesCount || 0) * p.sellingPrice), 0);
        const totalEstimatedProfit = products.reduce((acc, p) => acc + ((p.salesCount || 0) * p.profitValue), 0);

        // Chart colors matching brand feel
        const chartColors = ["#f97316", "#6366f1", "#10b981", "#0284c7", "#f59e0b", "#8b5cf6", "#64748b"];

        // Prepare chart data for billing share
        const salesShareData = sortedBySales.slice(0, 5).map((p, idx) => {
          const rev = (p.salesCount || 0) * p.sellingPrice;
          const pct = totalEstimatedRevenue > 0 ? (rev / totalEstimatedRevenue) * 100 : 0;
          return {
            name: p.name.length > 18 ? p.name.substring(0, 18) + "..." : p.name,
            fullName: p.name,
            value: parseFloat(pct.toFixed(1)),
            rawRevenue: rev,
            color: chartColors[idx % chartColors.length]
          };
        });

        // Group trailing products as "Other"
        if (sortedBySales.length > 5) {
          const rest = sortedBySales.slice(5);
          const restRevenue = rest.reduce((acc, p) => acc + ((p.salesCount || 0) * p.sellingPrice), 0);
          const restPct = totalEstimatedRevenue > 0 ? (restRevenue / totalEstimatedRevenue) * 100 : 0;
          if (restRevenue > 0) {
            salesShareData.push({
              name: "Outros",
              fullName: "Outros Produtos",
              value: parseFloat(restPct.toFixed(1)),
              rawRevenue: restRevenue,
              color: "#94a3b8"
            });
          }
        }

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6 mb-8 items-stretch">
            {/* Column 1: Ranking panel (col-span-7) */}
            <div className="lg:col-span-7 bg-white rounded-[2.2rem] border border-gray-150 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 bg-orange-100 rounded-2xl text-orange-600">
                      <Award size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Ranking de Campeões de Venda</h4>
                      <p className="text-[10px] text-gray-500">Produtos ordenados pelo volume total de vendas acumuladas</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-extrabold px-2.5 py-1 rounded-full uppercase">
                    Portfólio PJ
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  {/* Left subcolumn: Top list items (column-span 7) */}
                  <div className="xl:col-span-7 space-y-3.5">
                    {sortedBySales.slice(0, 5).map((p, index) => {
                      const salesVal = p.salesCount || 0;
                      const pctOfMax = Math.round((salesVal / maxSales) * 100);
                      const individualRevenue = salesVal * p.sellingPrice;
                      const revenuePct = totalEstimatedRevenue > 0 ? (individualRevenue / totalEstimatedRevenue) * 100 : 0;
                      
                      // Podiums styling
                      let medal = "";
                      let rowBg = "hover:bg-gray-50/50";
                      let rankLabel = "";
                      if (index === 0) {
                        medal = "🏆";
                        rowBg = "bg-orange-500/[0.02] border border-orange-500/15";
                        rankLabel = "text-orange-600 font-black";
                      } else if (index === 1) {
                        medal = "🥈";
                        rankLabel = "text-slate-500 font-bold";
                      } else if (index === 2) {
                        medal = "🥉";
                        rankLabel = "text-amber-700 font-bold";
                      } else {
                        rankLabel = "text-gray-400 font-semibold";
                      }

                      return (
                        <div 
                          key={p.id} 
                          className={cn(
                            "p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors border border-transparent",
                            rowBg
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-xs bg-gray-50 font-mono shrink-0", rankLabel)}>
                              {medal || `#${index + 1}`}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-extrabold text-[#141414] truncate max-w-[150px]">{p.name}</span>
                                {p.sku && <span className="text-[9px] font-mono text-gray-400 shrink-0">({p.sku})</span>}
                              </div>
                              
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-full flex items-center gap-0.5">
                                  📊 {revenuePct.toFixed(1)}% do faturamento total
                                </span>
                              </div>
                              
                              {/* Visual Progress Bar relative to Top Product (colored with Recharts match colors) */}
                              <div className="w-full flex items-center gap-2 mt-1.5">
                                <div className="h-1.5 bg-gray-100 rounded-full flex-1 overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-[1000ms] ease-out"
                                    style={{ 
                                      width: `${pctOfMax}%`,
                                      backgroundColor: chartColors[index % chartColors.length]
                                    }}
                                  />
                                </div>
                                <span className="text-[9px] font-bold text-gray-400 font-mono w-14 text-right shrink-0">
                                  {pctOfMax}% volume
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                            <div className="text-right">
                              <span className="block text-xs font-black text-[#141414] font-mono">
                                {salesVal} un.
                              </span>
                              <span className="block text-[8px] text-gray-400 tracking-wide font-sans">
                                Total: {formatCurrency(individualRevenue)}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                sound.playClick();
                                setSellingProduct(p);
                                setSaleQty(1);
                                setAdjustedSellingPrice(p.sellingPrice.toFixed(2));
                                setSaleStoreId(activeStoreId === "all" ? (storeProfiles[0]?.id || "matriz") : activeStoreId);
                              }}
                              className="p-1.5 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-lg transition-all cursor-pointer border border-orange-500/10"
                              title="Registar nova venda rápida"
                            >
                              <ShoppingCart size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right subcolumn: Interactive Doughnut Pie Chart (column-span 5) */}
                  <div className="xl:col-span-5 bg-gray-50/50 rounded-3xl p-4 border border-gray-100 flex flex-col items-center justify-center min-h-[290px] relative">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#9c9c9c] mb-3 block text-center">
                      Distribuição do Faturamento (%)
                    </span>

                    {totalEstimatedRevenue > 0 ? (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-full h-[160px] relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={salesShareData}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={68}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {salesShareData.map((entry, index) => {
                                  let fId = "neon-glow-orange";
                                  const c = entry.color?.toLowerCase() || "";
                                  if (c.includes("10b981") || c.includes("emerald")) fId = "neon-glow-emerald";
                                  else if (c.includes("3b82f6") || c.includes("blue")) fId = "neon-glow-blue";
                                  else if (c.includes("ef4444") || c.includes("rose") || c.includes("red")) fId = "neon-glow-rose";
                                  else if (c.includes("6366f1") || c.includes("indigo")) fId = "neon-glow-indigo";
                                  else if (c.includes("f97316") || c.includes("orange")) fId = "neon-glow-orange";
                                  return (
                                    <Cell key={`cell-${index}`} fill={entry.color} filter={`url(#${fId})`} />
                                  );
                                })}
                              </Pie>
                              <ChartTooltip
                                formatter={(value: any, name: any, props: any) => [
                                  `${value}% (${formatCurrency(props.payload.rawRevenue)})`,
                                  props.payload.fullName
                                ]}
                                contentStyle={{ 
                                  backgroundColor: "rgba(20, 20, 20, 0.95)", 
                                  borderRadius: "10px", 
                                  color: "white", 
                                  fontSize: "9px", 
                                  fontWeight: "bold",
                                  border: "none",
                                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Inner Total Legend */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                            <span className="text-[7.5px] uppercase tracking-widest text-gray-400 font-bold">Total</span>
                            <span className="text-xs font-black text-slate-800 font-mono">
                              {formatCurrency(totalEstimatedRevenue)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Colored Legends breakdown */}
                        <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1 mt-4 w-full px-1">
                          {salesShareData.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-1 min-w-[70px]">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                              <span className="text-[8.5px] font-extrabold text-slate-700 truncate max-w-[90px]" title={entry.fullName}>
                                {entry.name}: <span className="font-mono text-gray-500 font-normal">{entry.value}%</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4 flex flex-col items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2.5 border border-orange-100">
                          <DollarSign size={16} />
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold max-w-[160px] mx-auto leading-relaxed">
                          Registre vendas rápidas usando o botão de carrinho para alimentar o gráfico de pizza.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Statistical overview cards (col-span-5) */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-4 items-stretch">
              {/* Card 1: Total volume */}
              <div className="bg-white p-5 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] uppercase font-black tracking-widest text-[#9c9c9c] italic">Volume Total de Venda</span>
                    <span className="block text-xl font-black italic tracking-tight font-sans text-gray-905 mt-1">
                      {totalSalesVolume} unidades
                    </span>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-650 rounded-2xl">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 mt-3 flex justify-between text-[10px] text-gray-500">
                  <span>Média por item catalogado:</span>
                  <span className="font-extrabold font-mono text-gray-800">
                    {Math.round(totalSalesVolume / products.length)} u.
                  </span>
                </div>
              </div>

              {/* Card 2: Projected gross revenue based on salesCount */}
              <div className="bg-white p-5 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] uppercase font-black tracking-widest text-[#9c9c9c] italic">Faturamento Total Estimado</span>
                    <span className="block text-xl font-black italic tracking-tight font-sans text-emerald-600 mt-1">
                      {formatCurrency(totalEstimatedRevenue)}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <DollarSign size={20} />
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 mt-3 flex justify-between text-[10px] text-gray-500">
                  <span>Preço médio praticado:</span>
                  <span className="font-extrabold font-mono text-gray-800">
                    {formatCurrency(totalSalesVolume > 0 ? (totalEstimatedRevenue / totalSalesVolume) : 0)}
                  </span>
                </div>
              </div>

              {/* Card 3: Projected profit return */}
              <div className="bg-[#141414] p-5 rounded-[2rem] shadow-md flex flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-xl rounded-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <span className="block text-[9px] uppercase font-black tracking-widest text-[#9c9c9c] italic">LUCRO LÍQUIDO ACUMULADO</span>
                    <span className="block text-2xl font-black italic tracking-tight font-sans text-orange-400 mt-1">
                      {formatCurrency(totalEstimatedProfit)}
                    </span>
                  </div>
                  <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                    <Award size={20} />
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10 mt-3 flex justify-between text-[10px] text-[#9c9c9c] relative z-10">
                  <span>Margem Média Consolidada:</span>
                  <span className="font-extrabold font-mono text-emerald-400">
                    {totalEstimatedRevenue > 0 ? ((totalEstimatedProfit / totalEstimatedRevenue) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                {profile?.cardFeeRate !== undefined && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, otherCostsPct: (profile.cardFeeRate ?? 2.5).toString() }));
                      showToast("Taxa de maquininha aplicada com sucesso!", "success");
                    }}
                    className="mt-1 text-[9px] text-orange-600 hover:text-orange-700 font-black uppercase tracking-wider flex items-center gap-0.5 focus:outline-none transition-colors"
                  >
                    💳 Usar taxa de maquininha ({profile.cardFeeRate}% )
                  </button>
                )}
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
                {reverseMarginPct !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, desiredMargin: reverseMarginPct.toString() }));
                      showToast(`Margem desejada sincronizada para ${reverseMarginPct}%!`, "success");
                    }}
                    className="mt-1.5 text-[9.5px] text-emerald-600 hover:text-emerald-750 font-bold flex items-center gap-1 focus:outline-none transition-all text-left bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-500/10 cursor-pointer w-full hover:bg-emerald-100/50"
                    title="Aplica automaticamente esta margem calculada de trás pra frente no formulário"
                  >
                    <span>🎯 Preço equivale a <strong>{reverseMarginPct}%</strong> de margem. Aplicar?</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wide mb-1">Vendas Acumuladas (Qtd)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 50"
                  value={formData.salesCount}
                  onChange={(e) => setFormData({ ...formData, salesCount: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
                <span className="block text-[8px] text-gray-400 mt-1">Somas reais e estimadas para ranking</span>
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
                  <th className="px-4 py-4 text-center">Vendas (Qtd)</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {products.map((p) => {
                  const isCmvHigh = p.cmvPct > 40;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className={cn(
                        "hover:bg-gray-50/50 transition-all text-xs",
                        isCmvHigh && "bg-red-50/40 hover:bg-red-100/50 cmv-high-row"
                      )}
                    >
                      <td className="px-6 py-4 font-extrabold text-[#141414] flex items-center gap-2">
                        {isCmvHigh && (
                          <span className="inline-flex items-center justify-center p-1 bg-red-100 rounded-lg text-red-600 shrink-0" title="Alerta: CMV Alto">
                            <AlertTriangle size={12} className="animate-pulse" />
                          </span>
                        )}
                        <span>{p.name}</span>
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
                      <td 
                        className={cn(
                          "px-4 py-4 text-center transition-all",
                          p.cmvPct > 40 && "bg-[#fef2f2] font-semibold"
                        )}
                        style={p.cmvPct > 40 ? { backgroundColor: "#fef2f2" } : undefined}
                      >
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black font-mono tracking-widest border inline-flex items-center gap-1",
                          p.cmvPct <= 30
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : p.cmvPct <= 40
                              ? "bg-amber-50 border-amber-200 text-amber-600"
                              : "bg-red-100 border-red-300 text-red-700 font-black"
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
                        {p.profitMarginPct < 20 && (
                          <div className="mt-1 flex flex-col items-center">
                            <span className="inline-block bg-red-100 text-red-700 font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded border border-red-200 animate-pulse">
                              ⚠️ Alerta Precificação
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-mono">
                        <span className="px-3 py-1 bg-orange-50 border border-orange-100 text-orange-700 rounded-full text-xs font-black inline-flex items-center gap-1 shadow-2xs">
                          {p.salesCount || 0} u.
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setSimulatorProduct(p);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Simular precificação e margem por canal (iFood, Rappi, etc)"
                        >
                          <Sparkles size={11} /> Canais
                        </button>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setElasticityProduct(p);
                            // Critical products (e.g., high CMV or margin issues) default to slightly more inelastic profiles, others to standard elastic ones
                            const defaultCoef = p.cmvPct > 40 ? -0.8 : -1.6;
                            setElasticityCoef(defaultCoef);
                            setPriceChangePct(10);
                            setBaseWeeklyVolume(p.salesCount && p.salesCount > 0 ? p.salesCount : 100);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Simular Elasticidade-Preço da Demanda (Sensibilidade de Volume)"
                        >
                          <TrendingUp size={11} /> Elasticidade
                        </button>
                        <button
                          onClick={() => {
                            handleOpenEdit(p);
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-600 text-slate-600 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Editar precificação deste produto"
                        >
                          <Edit3 size={11} /> Editar
                        </button>
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
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DIAGNÓSTICO E ANÁLISE DE MARGEM DE CONTRIBUIÇÃO */}
      {products.length > 0 && (() => {
        const sortedByMargin = [...marginAnalysisData.list].sort((a, b) => a.marginPct - b.marginPct);
        const weakestProd = sortedByMargin[0] || null;
        const healthiestProd = sortedByMargin[sortedByMargin.length - 1] || null;

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-[2.5rem] p-6 md:p-8 border-2 border-[#141414] shadow-xl space-y-6 text-left"
            id="product-margin-analysis-panel"
          >
            {/* Header section with status warning badge if there are critical items */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-gray-150">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white font-mono font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 leading-none">
                    <Percent size={11} className="text-white" /> Análise de Rentabilidade
                  </span>
                  <span className={cn(
                    "font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md",
                    marginAnalysisData.criticalCount > 0 
                      ? "bg-rose-100 text-rose-750 font-black animate-pulse" 
                      : "bg-emerald-100 text-emerald-700 font-extrabold"
                  )}>
                    {marginAnalysisData.criticalCount > 0 
                      ? `⚠️ ${marginAnalysisData.criticalCount} Produto(s) com Margem Crítica` 
                      : "✅ Portfólio 100% Saudável (>20%)"}
                  </span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#141414] italic">
                  Diagnóstico de Margem de Contribuição
                </h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-2xl">
                  Esta análise calcula a margem líquida de contribuição individual de cada produto do seu menu para destacar quais itens estão abaixo do patamar mínimo de rentabilidade de <strong className="text-rose-600 font-bold">20%</strong>. Use os botões de ação para recompor preços imediatamente.
                </p>
              </div>

              {/* Reset view tool inside card */}
              <button 
                type="button"
                onClick={() => {
                  setMarginAnalysisSearch("");
                  sound.playClick();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:text-[#141414] border border-gray-200 transition-colors cursor-pointer"
              >
                <RefreshCw size={12} /> Limpar Filtros
              </button>
            </div>

            {/* Bento statistics tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[8.5px] font-black uppercase text-gray-400 tracking-wider">Margem Média Geral</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                    {marginAnalysisData.avgMargin.toFixed(1)}%
                  </span>
                  <span className={cn(
                    "text-[9px] font-bold",
                    marginAnalysisData.avgMargin >= 30 ? "text-emerald-600" : marginAnalysisData.avgMargin >= 20 ? "text-amber-600" : "text-rose-600"
                  )}>
                    {marginAnalysisData.avgMargin >= 25 ? "Excelente" : "Atenção"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[8.5px] font-black uppercase text-gray-400 tracking-wider">Críticos (Abaixo de 20%)</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className={cn(
                    "text-xl sm:text-2xl font-black font-mono",
                    marginAnalysisData.criticalCount > 0 ? "text-rose-600" : "text-emerald-700"
                  )}>
                    {marginAnalysisData.criticalCount}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Proporção: {products.length > 0 ? ((marginAnalysisData.criticalCount / products.length) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[8.5px] font-black uppercase text-gray-400 tracking-wider">Líder de Rentabilidade</span>
                {healthiestProd ? (
                  <div className="mt-1 block truncate">
                    <span className="text-[13px] font-black text-emerald-700 block truncate" title={healthiestProd.name}>
                      {healthiestProd.name}
                    </span>
                    <span className="text-[9.5px] font-bold font-mono text-gray-400">
                      Margem: {healthiestProd.marginPct.toFixed(1)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 mt-1">-</span>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[8.5px] font-black uppercase text-gray-400 tracking-wider">Gargalo / Menor Margem</span>
                {weakestProd ? (
                  <div className="mt-1 block truncate">
                    <span className={cn(
                      "text-[13px] font-black block truncate",
                      weakestProd.marginPct < 20 ? "text-rose-600" : "text-orange-600"
                    )} title={weakestProd.name}>
                      {weakestProd.name}
                    </span>
                    <span className="text-[9.5px] font-bold font-mono text-gray-400">
                      Margem: {weakestProd.marginPct.toFixed(1)}% {weakestProd.marginPct < 20 ? "⚠️" : ""}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 mt-1">-</span>
                )}
              </div>
            </div>

            {/* Recharts Bar Chart Section */}
            <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-[2rem] space-y-3">
              <span className="text-[8.5px] uppercase tracking-widest font-black text-gray-400 block font-mono">
                Comparativo de Margem de Contribuição % por SKU Item
              </span>
              <div className="h-[220px] w-full relative select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={marginAnalysisData.list}
                    margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#64748b", fontSize: 9, fontWeight: "bold" }}
                      tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#64748b", fontSize: 9, fontWeight: "bold" }}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#141414] border border-orange-500/30 p-3 rounded-2xl shadow-xl text-left text-white max-w-[240px] font-sans">
                              <p className="text-[9.5px] font-black uppercase tracking-widest text-[#9c9c9c] font-mono mb-1 truncate">
                                {data.name}
                              </p>
                              <p className="text-xs font-bold font-mono text-white">
                                Margem: {data.marginPct.toFixed(1)}%
                              </p>
                              <p className="text-[9px] text-gray-305 mt-1 font-medium leading-normal">
                                Preço Venda: {formatCurrency(data.sellingPrice)} <br />
                                Custo Direto: {formatCurrency(data.costPrice)}
                              </p>
                              <span className={cn(
                                "text-[8px] font-bold px-1.5 py-0.5 rounded mt-2 inline-block uppercase",
                                data.isCritical ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              )}>
                                {data.isCritical ? "Crítico (<20%)" : "Saudável"}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine 
                      y={20} 
                      stroke="#ef4444" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ value: "Meta 20%", fill: "#ef4444", position: "insideLeft", fontSize: 9, fontWeight: "black" }} 
                    />
                    <Bar dataKey="marginPct" radius={[6, 6, 0, 0]}>
                      {marginAnalysisData.list.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isCritical ? "#f43f5e" : "#10b981"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Interactive Search Controls & Table */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-150">
                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wide font-mono flex items-center gap-1">
                  🔍 Filtro de Produtos Ativos ({filteredProductsForMargin.length} de {products.length})
                </span>
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou SKU..."
                    value={marginAnalysisSearch}
                    onChange={(e) => setMarginAnalysisSearch(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 font-mono text-gray-800"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-[2rem] border border-gray-150">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-55 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-150">
                      <th className="px-5 py-4">Produto & SKU</th>
                      <th className="px-4 py-4 text-center">Preço Venda</th>
                      <th className="px-4 py-4 text-center">Deduções Variáveis</th>
                      <th className="px-4 py-4 text-center">Custo Direto (CMV%)</th>
                      <th className="px-4 py-4 text-center">Sobras (Lucro)</th>
                      <th className="px-4 py-4 text-center">Margem %</th>
                      <th className="px-5 py-4 text-right">Diagnóstico & Reajuste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {filteredProductsForMargin.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-xs text-secondary-text font-bold font-mono">
                          Nenhum produto atendeu aos critérios de busca.
                        </td>
                      </tr>
                    ) : (
                      filteredProductsForMargin.map((p) => {
                        const totalVariables = p.taxAmt + p.otherAmt;
                        return (
                          <tr 
                            key={p.id}
                            className={cn(
                              "hover:bg-slate-50/50 transition-all text-xs",
                              p.isCritical && "bg-rose-50/35 hover:bg-rose-50/80"
                            )}
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-extrabold text-slate-900 font-sans text-xs">{p.name}</p>
                              <span className="text-[9px] font-semibold text-gray-400 font-mono">SKU: {p.sku || "-"}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-850 font-mono">
                              {formatCurrency(p.sellingPrice)}
                            </td>
                            <td className="px-4 py-3.5 text-center text-gray-500 font-mono">
                              <span className="block text-[10.5px] font-medium">{formatCurrency(totalVariables)}</span>
                              <span className="block text-[8.5px] text-gray-400 font-semibold uppercase">({(p.taxRate + p.otherCostsPct).toFixed(1)}% Taxas)</span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono">
                              <span className="block font-bold text-slate-700">{formatCurrency(p.costPrice)}</span>
                              <span className="block text-[8.5px] text-gray-400 font-semibold uppercase">({p.cmvPct.toFixed(1)}%)</span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                              {formatCurrency(p.profitR$)}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={cn(
                                "font-mono font-black text-xs px-2 py-1 rounded-md",
                                p.isCritical ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-800"
                              )}>
                                {p.marginPct.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {p.isCritical ? (
                                  <>
                                    <div className="text-left hidden md:block select-none pointer-events-none">
                                      <span className="block text-[8.5px] text-rose-600 font-black uppercase tracking-wider animate-pulse">⚠️ ALERTA: Margem Crítica</span>
                                      <span className="block text-[8px] text-gray-400 font-semibold tracking-tighter leading-snug">Risco de erosão de caixa</span>
                                    </div>
                                    <button
                                      onClick={() => handleRePriceProductToHealthy(p.id, 30)}
                                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wide transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                      title="Calcula e aplica automaticamente o preço de venda para atingir 30% de margem real de segurança"
                                    >
                                      <Wand2 size={11} /> Ajustar para 30%
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-left hidden md:block select-none pointer-events-none">
                                      <span className="block text-[8.5px] text-emerald-600 font-black uppercase tracking-wider">✅ Saudável</span>
                                      <span className="block text-[8px] text-gray-400 font-semibold tracking-tighter leading-snug">Excelente retorno unitário</span>
                                    </div>
                                    <button
                                      disabled
                                      className="px-3 py-1.5 bg-emerald-50 text-emerald-500 rounded-lg text-[10px] font-extrabold uppercase transition-all select-none border border-emerald-200/50 flex items-center gap-1"
                                    >
                                      <CheckCircle2 size={11} className="text-emerald-500" /> Confirmado
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {marginAnalysisData.criticalCount > 0 && (
                <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-3xl flex items-start gap-3">
                  <AlertTriangle className="text-rose-500 shrink-0 mt-0.5 animate-bounce" size={18} />
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold uppercase text-rose-700 tracking-wider font-mono">Manual da Defesa de Caixa (IA)</p>
                    <p className="text-gray-600 leading-relaxed font-semibold">
                      Fórmulas analíticas de margem de contribuição inferiores a <strong>20%</strong> acusam vulnerabilidade severa. Sem markup de segurança, o item rebaixa seu Capital de Giro Líquido. Clique no botão verde <strong>"Ajustar para 30%"</strong> para forçar a precificação a flutuar para um markup de alta proteção ou considere eliminá-los do fluxo tático operacional.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })()}

      {/* Painel Interativo de Otimização de Preços por SKU */}
      <div id="sku-pricing-optimization-panel" className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-150 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 animate-pulse">
              <Sparkles size={10} /> Inteligência de SKU & Sensibilidade de Markup
            </span>
            <h3 className="text-xl font-extrabold text-[#141414] mt-2 flex items-center gap-2">
              <TrendingUp className="text-amber-500 animate-bounce" size={20} />
              Otimização de Preços por SKU
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Ajuste o Markup individual de cada produto/serviço em tempo real. Monitore o CMV simulado e garanta que todos os itens operem acima da margem mínima de segurança de <strong>20% (vinte por cento)</strong> para blindar o fluxo de caixa corporativo.
            </p>
          </div>

          {/* Global Multi-preset tools */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 border border-gray-150 rounded-xl w-full lg:w-auto">
            <span className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-wide font-mono block w-full sm:w-auto">Simulação Coletiva:</span>
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => applyGlobalMarkupPreset(1.5)}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 transition-all cursor-pointer"
              >
                1.5x
              </button>
              <button
                type="button"
                onClick={() => applyGlobalMarkupPreset(1.8)}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 transition-all cursor-pointer"
              >
                1.8x
              </button>
              <button
                type="button"
                onClick={() => applyGlobalMarkupPreset(2.0)}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 border border-amber-500 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
              >
                2.0x Ideal
              </button>
              <button
                type="button"
                onClick={() => applyGlobalMarkupPreset(2.5)}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 transition-all cursor-pointer"
              >
                2.5x Alta
              </button>
              <button
                type="button"
                onClick={resetAllMarkupsPreset}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-rose-600 transition-all cursor-pointer flex items-center gap-1"
                title="Resetar simulações"
              >
                <RefreshCw size={9} /> Resetar
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Metrics Comparative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Margem de Contribuição Média</span>
              <p className="text-xl font-extrabold text-[#141414] mt-1 font-mono">
                {skuSummary.avgOriginalMargin.toFixed(1)}% <span className="text-xs font-normal text-gray-400 font-sans">➔</span> <span className="text-amber-600 font-black">{skuSummary.avgSimulatedMargin.toFixed(1)}%</span>
              </p>
            </div>
            <div className="mt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-tight">
              {skuSummary.avgSimulatedMargin >= skuSummary.avgOriginalMargin ? (
                <span className="text-emerald-600 font-black">▲ Incremento positivo de +{(skuSummary.avgSimulatedMargin - skuSummary.avgOriginalMargin).toFixed(1)}%</span>
              ) : (
                <span className="text-rose-600 font-black">▼ Redução média de -{Math.abs(skuSummary.avgSimulatedMargin - skuSummary.avgOriginalMargin).toFixed(1)}%</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Itens Abaixo de 20% (Alerta CMV)</span>
              <p className="text-xl font-extrabold text-[#141414] mt-1 font-mono flex items-center gap-2">
                {skuSummary.originalCriticalCount > 0 ? (
                  <span className="text-red-500 font-black">{skuSummary.originalCriticalCount} SKU(s)</span>
                ) : (
                  <span className="text-emerald-500 font-black">Nenhum</span>
                )}
                <span className="text-xs font-normal text-gray-400 font-sans">➔</span>
                {skuSummary.simulatedCriticalCount > 0 ? (
                  <span className="px-2 py-0.5 bg-red-105 text-red-700 text-xs font-black rounded-lg border border-red-200 animate-pulse">{skuSummary.simulatedCriticalCount} SKU(s) Críticos</span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg border border-emerald-200">100% Protegidos ✨</span>
                )}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-tight">
              Prevenção de vendas com prejuízo silencioso.
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Receita Potencial Estimada</span>
              <p className="text-xl font-extrabold text-[#141414] mt-1 font-mono">
                {formatCurrency(skuSummary.totalOriginalRevenue)} <span className="text-xs font-normal text-gray-400 font-sans">➔</span> <span className="text-emerald-600 font-black">{formatCurrency(skuSummary.totalSimulatedRevenue)}</span>
              </p>
            </div>
            <div className="mt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-tight">
              Faturamento com base nas contagens registradas.
            </div>
          </div>
        </div>

        {/* Filter / Search input for SKU panel */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar SKU ou nome de produto neste painel..."
            value={skuSearch}
            onChange={(e) => setSkuSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/60 border border-gray-150 rounded-xl text-xs font-semibold text-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder-gray-400"
          />
        </div>

        {/* Interactive Products Optimization Table */}
        <div className="border border-gray-150 rounded-[2rem] overflow-hidden bg-white">
          <div className="overflow-x-auto">
            {products.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs font-medium">
                Nenhum produto cadastrado para otimização de SKU.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-150 font-sans">
                    <th className="px-6 py-4">Nome & SKU</th>
                    <th className="px-4 py-4 text-center">Custo + Imposto Fixo</th>
                    <th className="px-6 py-4 text-center">Simulador de Markup</th>
                    <th className="px-4 py-4 text-right">Novo Preço Praticado</th>
                    <th className="px-4 py-4 text-center">Novo CMV %</th>
                    <th className="px-4 py-4 text-right">Margem de Contribuição</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {skuOptimizations
                    .filter(item => {
                      if (!skuSearch) return true;
                      const searchLower = skuSearch.toLowerCase();
                      return item.product.name.toLowerCase().includes(searchLower) ||
                             (item.product.sku && item.product.sku.toLowerCase().includes(searchLower));
                    })
                    .map(item => {
                      const isCritical = item.simMarginPct < 20;
                      return (
                        <tr
                          key={item.product.id}
                          className={cn(
                            "hover:bg-gray-50/50 transition-all text-xs",
                            isCritical ? "bg-rose-50/40 hover:bg-rose-100/30 font-semibold" : ""
                          )}
                        >
                          {/* Name & SKU */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-[#141414] uppercase tracking-tight">
                                {item.product.name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                                SKU: {item.product.sku || "Não definido"}
                              </span>
                            </div>
                          </td>

                          {/* Cost / Taxes */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono font-bold text-gray-700">
                                {formatCurrency(item.product.costPrice)}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                +{(item.product.taxRate + item.product.otherCostsPct).toFixed(1)}% cargos var.
                              </span>
                            </div>
                          </td>

                          {/* Markup interactive range slider + small microadjust selectors */}
                          <td className="px-6 py-4 min-w-[200px]">
                            <div className="flex flex-col gap-1.5 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400 font-semibold uppercase">Markup Multiplicador:</span>
                                <span className={cn(
                                  "font-black font-mono px-2 py-0.5 rounded text-[10.5px]",
                                  item.isModified ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"
                                )}>
                                  {item.currentMarkup.toFixed(2)}x
                                  {item.isModified && <span className="ml-1 text-[9px] text-amber-600 font-bold">&#9999;</span>}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextVal = Math.max(1.0, item.currentMarkup - 0.05);
                                    setAdjustedMarkups(prev => ({ ...prev, [item.product.id]: nextVal }));
                                  }}
                                  className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center rounded transition-all focus:outline-none cursor-pointer"
                                  title="Deduzir 0.05x"
                                >
                                  -
                                </button>
                                <input
                                  type="range"
                                  min="1.0"
                                  max="4.0"
                                  step="0.05"
                                  value={item.currentMarkup}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setAdjustedMarkups(prev => ({ ...prev, [item.product.id]: val }));
                                  }}
                                  className="grow accent-amber-500 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextVal = Math.min(4.0, item.currentMarkup + 0.05);
                                    setAdjustedMarkups(prev => ({ ...prev, [item.product.id]: nextVal }));
                                  }}
                                  className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center rounded transition-all focus:outline-none cursor-pointer"
                                  title="Adicionar 0.05x"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* New Price */}
                          <td className="px-4 py-4 text-right font-mono">
                            <div className="flex flex-col items-end">
                              <span className={cn(
                                "font-extrabold text-sm",
                                item.isModified ? "text-amber-600 scale-105 transition-transform font-black" : "text-gray-900 font-bold"
                              )}>
                                {formatCurrency(item.simSellingPrice)}
                              </span>
                              {item.isModified && (
                                <span className="text-[8.5px] text-gray-400 line-through">
                                  {formatCurrency(item.product.sellingPrice)} orig.
                                </span>
                              )}
                            </div>
                          </td>

                          {/* CMV % */}
                          <td className="px-4 py-4 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black font-mono border",
                              item.simCmvPct <= 30
                                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                : item.simCmvPct <= 40
                                  ? "bg-amber-50 border-amber-200 text-amber-600"
                                  : "bg-red-50 border-red-150 text-red-650"
                            )}>
                              {item.simCmvPct.toFixed(1)}%
                            </span>
                          </td>

                          {/* Contribution Margin & Red Highlighting if < 20% */}
                          <td className="px-4 py-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className={cn(
                                "font-black px-2 py-0.5 rounded text-[11px] font-mono border",
                                isCritical 
                                  ? "bg-red-100 border-red-350 text-red-700 animate-pulse font-extrabold" 
                                  : "bg-emerald-50 border-emerald-200 text-emerald-600"
                              )}>
                                {item.simMarginPct.toFixed(1)}%
                              </span>
                              <span className="text-[9.5px] text-gray-400 font-mono">
                                {formatCurrency(item.simProfitValue)} liq.
                              </span>
                              {isCritical && (
                                <span className="text-[8px] uppercase font-black text-red-600 bg-red-100/30 px-1 rounded [font-size:7.5px] shrink-0 font-sans tracking-tight">
                                  ⚠️ Margem &lt; 20%
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Quick applies */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {item.isModified ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApplySKUAdjustment(
                                      item.product.id,
                                      item.simSellingPrice,
                                      item.simMarginPct,
                                      item.simProfitValue,
                                      item.currentMarkup
                                    )}
                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(245,158,11,0.25)]"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleResetSKUAdjustment(item.product.id)}
                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold italic mr-3 uppercase select-none">Padrão</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bulk Action Area Banner */}
        {skuSummary.modifiedCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-250">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-amber-950 uppercase tracking-wide">Preços Otimizados Pendentes</h4>
                <p className="text-[10.5px] text-amber-800 font-semibold font-sans mt-0.5">
                  Você possui <strong>{skuSummary.modifiedCount} produto(s)</strong> com reajustes de preço simulados. Deseja sincronizar todas as novas tabelas de venda com o banco de dados?
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleApplyAllSKUAdjustments}
                disabled={isApplyingAllSKUs}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-[0_2px_12px_rgba(245,158,11,0.3)] disabled:opacity-55"
              >
                {isApplyingAllSKUs ? "Salvando..." : "Aplicar Todos Preços em Lote!"}
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAdjustedMarkups({});
                }}
                className="bg-white hover:bg-gray-155 border border-gray-200 text-gray-700 font-bold uppercase text-[10px] tracking-widest px-4 py-2.5 rounded-lg transition-all cursor-pointer"
              >
                Descartar Lote
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Target Margin Markup Simulator Section */}
      <div id="target-margin-markup-simulator" className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-150 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <span className="text-[10px] bg-orange-100 text-orange-600 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Gerador de Engenharia Tarifária
            </span>
            <h3 className="text-xl font-extrabold text-[#141414] mt-2 flex items-center gap-2">
              <Percent className="text-orange-500" size={20} />
              Suíte Avançada de Métodos & Sensibilidade de Precificação
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Simule sob múltiplos métodos financeiros (DRE, Cost-Plus, Margem Absoluta) e meça a elasticidade de lucro contra inflação de insumo e descontos concedidos.
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-600 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Modelo Ativo: {simModel === 'divisora' ? 'Margem Divisora' : simModel === 'cost_plus' ? 'Cost-Plus Aditivo' : 'Valor Nominal Alvo'}
            </span>
          </div>
        </div>

        {/* Method Selection Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-150 pb-4">
          <button
            onClick={() => {
              sound.playClick();
              setSimModel('divisora');
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border",
              simModel === 'divisora'
                ? "bg-[#141414] text-white border-[#141414] shadow-xs"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            )}
          >
            📊 Margem Líquida Alvo (Divisora de DRE)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setSimModel('cost_plus');
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border",
              simModel === 'cost_plus'
                ? "bg-[#141414] text-white border-[#141414] shadow-xs"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            )}
          >
            ➕ Cost-Plus Aditivo (Markup no Custo)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setSimModel('nominal');
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border",
              simModel === 'nominal'
                ? "bg-[#141414] text-white border-[#141414] shadow-xs"
                : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
            )}
          >
            💵 Margem de Lucro em Valor Fixo (R$)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Interactive calculator (col-span-5) */}
          <div className="lg:col-span-5 bg-gray-50/50 p-5 rounded-[2rem] border border-gray-150 text-left space-y-4">
            <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5 border-b border-gray-200 pb-2">
              <Calculator size={16} className="text-orange-500" />
              Parâmetros Base & Tributários
            </h4>

            {/* Slider 1: Custo Base do Produto */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-bold uppercase text-[10px]">Custo Nominal de Compra / Produção (CMV)</span>
                <span className="text-slate-900 font-black font-mono">{formatCurrency(simCost)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={simCost}
                onChange={(e) => {
                  sound.playClick();
                  setSimCost(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[8px] text-gray-400 font-mono">
                <span>R$ 1</span>
                <span>R$ 250</span>
                <span>R$ 500</span>
              </div>
            </div>

            {/* Slider 2: Alíquota de Tributação PJ */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-bold uppercase text-[10px]">Carga Tributária PJ / Impostos sobre Venda</span>
                <span className="text-indigo-650 font-black font-mono">{simTax.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="0.5"
                value={simTax}
                onChange={(e) => {
                  sound.playClick();
                  setSimTax(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              {/* Presets Tributários */}
              <div className="flex flex-wrap gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSimTax(6);
                  }}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border cursor-pointer",
                    simTax === 6 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  Simples Nacional (6%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSimTax(15);
                  }}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border cursor-pointer",
                    simTax === 15 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  Lucro Presumido (15%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSimTax(27.25);
                  }}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border cursor-pointer",
                    simTax === 27.25 ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  Lucro Real (27.25%)
                </button>
              </div>
            </div>

            {/* Slider 3: Outros Custos Variáveis */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-bold uppercase text-[10px]">Taxas de Meio de Pagamento, Embalagem & Entregas</span>
                <span className="text-orange-500 font-black font-mono">{simOther.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={simOther}
                onChange={(e) => {
                  sound.playClick();
                  setSimOther(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              {/* Presets Financeiros Meios de Pagamento */}
              <div className="flex flex-wrap gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSimOther(1);
                  }}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border cursor-pointer",
                    simOther === 1 ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  Pix / PIX (1%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSimOther(2);
                  }}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border cursor-pointer",
                    simOther === 2 ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  Débito (2%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSimOther(4.5);
                  }}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border cursor-pointer",
                    simOther === 4.5 ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  Crédito à Vista (4.5%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSimOther(12);
                  }}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border cursor-pointer",
                    simOther === 12 ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  Crédito 12x (12%)
                </button>
              </div>
            </div>

            {/* Slider 4 or Input: Targets depending on active mode */}
            {simModel === 'nominal' ? (
              <div className="space-y-1.5 p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-550/15">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-800 font-extrabold uppercase text-[10px]">Margem de Lucro Alvo Nominal (R$ Desejado por Unidade)</span>
                  <div className="flex items-center gap-1 bg-white border border-emerald-300 rounded-lg px-2 py-0.5 shadow-2xs">
                    <span className="text-emerald-600 font-bold font-mono text-[10px]">R$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      value={desiredProfitNominal}
                      onChange={(e) => {
                        const typedValue = Math.max(1, Math.min(1000, Number(e.target.value) || 0));
                        setDesiredProfitNominal(typedValue);
                      }}
                      className="w-16 text-right font-black font-mono text-emerald-700 bg-transparent focus:outline-none focus:ring-0 select-all"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="300"
                  step="1"
                  value={desiredProfitNominal}
                  onChange={(e) => {
                    sound.playClick();
                    setDesiredProfitNominal(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[8px] text-gray-400 font-mono font-bold">
                  <span>R$ 1</span>
                  <span>R$ 150</span>
                  <span>R$ 300</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-550/15">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-800 font-extrabold uppercase text-[10px]">Margem de Lucro Alvo Desejada (%)</span>
                  <div className="flex items-center gap-1 bg-white border border-emerald-300 rounded-lg px-2 py-0.5 shadow-2xs">
                    <input
                      type="number"
                      min="0.1"
                      max="99"
                      step="0.1"
                      value={simTargetMargin}
                      onChange={(e) => {
                        const typedValue = Math.max(0.1, Math.min(99, Number(e.target.value) || 0));
                        setSimTargetMargin(typedValue);
                      }}
                      className="w-16 text-right font-black font-mono text-emerald-700 bg-transparent focus:outline-none focus:ring-0 select-all"
                    />
                    <span className="text-emerald-600 font-extrabold font-mono text-[10px]">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="95"
                  step="0.5"
                  value={simTargetMargin}
                  onChange={(e) => {
                    sound.playClick();
                    setSimTargetMargin(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[8px] text-gray-400 font-mono font-bold">
                  <span>0.5% Mínimo</span>
                  <span>30% Sugerido</span>
                  <span>95% Ultra Alto</span>
                </div>
              </div>
            )}

            {/* Sensitivity Analysis Control Panel */}
            <div className="bg-slate-900 text-white p-4.5 rounded-[1.8rem] border border-slate-800 space-y-4">
              <h5 className="text-[10px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1 pb-1 border-b border-zinc-800">
                ⚡ Engenharia de Stress & Elasticidade de Custo
              </h5>
              
              {/* Inflation/Cost Increase Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] uppercase font-bold text-gray-300">
                  <span>Custo do Insumo (CMV) Inflacionado</span>
                  <span className="font-mono text-red-400">+{costIncreasePct}% inflação</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={costIncreasePct}
                  onChange={(e) => {
                    sound.playTick();
                    setCostIncreasePct(Number(e.target.value));
                  }}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-[7px] text-zinc-500 font-mono font-bold">
                  <span>Insumo Nominal ({formatCurrency(simCost)})</span>
                  <span>Insumo Inflacionado ({formatCurrency(simCost * (1 + costIncreasePct / 100))})</span>
                </div>
              </div>

              {/* Discount Offer Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] uppercase font-bold text-gray-300">
                  <span>Desconto Praticado no Ponto de Venda</span>
                  <span className="font-mono text-amber-400">-{discountPct}% desconto</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="2.5"
                  value={discountPct}
                  onChange={(e) => {
                    sound.playTick();
                    setDiscountPct(Number(e.target.value));
                  }}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[7px] text-zinc-500 font-mono font-bold">
                  <span>Preço Sólido (0%)</span>
                  <span>Promoção Agressiva (30%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Applied results / analysis outputs (col-span-7) */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] border border-gray-150 flex flex-col justify-between overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="text-left">
                <h4 className="text-sm font-extrabold text-slate-800">Resultado Consolidado da Simulação</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Demonstrativo DRE unitário projetado de acordo com a engenharia tarifária escolhida.</p>
              </div>
              <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                DRE Unitário Simulado
              </span>
            </div>

            {/* Content pane for results */}
            <div className="p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-center">
              {computedSim.possible ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-center">
                      <span className="block text-[8px] uppercase font-extrabold text-gray-400 leading-tight">Preço de Venda Final</span>
                      <strong className="text-xl font-mono text-slate-900 block mt-1">{formatCurrency(computedSim.sellingPrice30)}</strong>
                      {discountPct > 0 && (
                        <span className="text-[7.5px] bg-amber-100 text-amber-850 font-black px-1.5 py-0.5 rounded mt-1 inline-block">
                          Original: {formatCurrency(computedSim.sellingPrice30 / (1 - discountPct / 100))}
                        </span>
                      )}
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-center">
                      <span className="block text-[8px] uppercase font-extrabold text-gray-400 leading-tight">Markup Fator Gerado</span>
                      <strong className="text-xl font-mono text-indigo-650 block mt-1">{computedSim.markupMultiplier.toFixed(3)}x</strong>
                      <span className="text-[8px] text-gray-500 font-mono block mt-1">Margem em CMV +{computedSim.markupPct.toFixed(1)}%</span>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-center">
                      <span className="block text-[8px] uppercase font-extrabold text-gray-400 leading-tight">Margem Líquida Real</span>
                      <strong className={cn(
                        "text-xl font-mono block mt-1",
                        computedSim.netProfitMarginPct >= 30 ? "text-emerald-600" : computedSim.netProfitMarginPct >= 10 ? "text-amber-500" : "text-rose-500"
                      )}>
                        {computedSim.netProfitMarginPct.toFixed(1)}%
                      </strong>
                      <span className="text-[8px] text-gray-500 font-black block mt-1 uppercase">
                        {computedSim.netProfitMarginPct >= 30 ? "🟢 Excelente" : computedSim.netProfitMarginPct >= 10 ? "🟡 Regular" : "🔴 Crítico"}
                      </span>
                    </div>
                  </div>

                  {/* Financial Ladder Demonstration (DRE unitário) */}
                  <div className="bg-slate-50 border border-gray-150 rounded-2xl p-5 space-y-3 text-left">
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Passo a Passo DRE de 1 Unidade Vendida</span>
                    
                    {/* Linha 1: Receita de Venda */}
                    <div className="flex justify-between items-center text-xs border-b border-gray-200/65 pb-2">
                      <span className="font-semibold text-gray-700">Preço Consumidor Final (ROB):</span>
                      <strong className="font-mono text-gray-950 font-black">{formatCurrency(computedSim.sellingPrice30)}</strong>
                    </div>

                    {/* Linha 2: Custo de Aquisição/Produção */}
                    <div className="flex justify-between items-center text-xs border-b border-gray-200/65 pb-2">
                      <div>
                        <span className="font-medium text-gray-600">(-) Custo Real do Insumo (CMV):</span>
                        {costIncreasePct > 0 && (
                          <span className="text-[8px] bg-red-150 text-red-700 px-1 py-0.5 rounded font-black ml-1.5 uppercase">Inflacionado</span>
                        )}
                      </div>
                      <span className="font-mono text-red-650 font-bold">-{formatCurrency(computedSim.costAfterInflation)} ({(computedSim.costAfterInflation / (computedSim.sellingPrice30 || 1) * 100).toFixed(1)}%)</span>
                    </div>

                    {/* Linha 3: Tributação PJ */}
                    <div className="flex justify-between items-center text-xs border-b border-gray-200/65 pb-2">
                      <span className="font-medium text-gray-600">(-) Impostos s/ Venda ({simTax}%):</span>
                      <span className="font-mono text-red-650 font-bold">-{formatCurrency(computedSim.taxAmount)}</span>
                    </div>

                    {/* Linha 4: Taxas Extra Variáveis */}
                    <div className="flex justify-between items-center text-xs border-b border-gray-200/65 pb-2">
                      <span className="font-medium text-gray-600">(-) Comissões & Provedores ({simOther}%):</span>
                      <span className="font-mono text-red-650 font-bold">-{formatCurrency(computedSim.otherAmount)}</span>
                    </div>

                    {/* Linha 5: Margem Líquida Real Residual */}
                    <div className="flex justify-between items-center text-sm pt-2">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-950 uppercase tracking-wide text-xs">(=) Lucro Líquido Real Residual (Sobra)</span>
                        <span className="text-[9px] text-gray-400 font-medium">Reais que sobram livres no caixa da empresa</span>
                      </div>
                      <strong className={cn(
                        "font-mono text-base font-black p-1 px-3.5 rounded-lg border",
                        computedSim.targetProfitVal > 0 
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-300/30" 
                          : "bg-red-500/10 text-red-705 border-red-300/30"
                      )}>
                        {formatCurrency(computedSim.targetProfitVal)}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-250 text-rose-850 p-6 rounded-[2rem] text-center space-y-3">
                  <AlertTriangle className="mx-auto text-rose-600" size={36} />
                  <p className="text-sm font-black uppercase tracking-wider">Cálculo de Margem Inviável</p>
                  <p className="text-xs text-rose-600 leading-normal max-w-md mx-auto">
                    A soma das deduções (Tributos de {simTax}% + Comissões Extras de {simOther}% + Margem Alvo de {simTargetMargin}%) atingiu <strong>{computedSim.totalDeductions}%</strong>.
                    Não é matematicamente possível gerar preço de venda positivo quando despesas e lucros desejados somam 100% ou mais do preço final. Reduza suas margens ou despesas variáveis.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom recommendations checklist of the simulator */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 text-[10px] text-gray-500 block text-left">
              <strong>💡 Mentoria Estratégica Rápida:</strong>{" "}
              {computedSim.netProfitMarginPct >= 30 ? (
                <span>Seu preço de venda está blindado! Esta margem de {computedSim.netProfitMarginPct.toFixed(1)}% oferece excelente sustentabilidade para reinvestimento tático ou ampliação de estoque.</span>
              ) : computedSim.netProfitMarginPct >= 10 ? (
                <span>Cuidado operacional. Embora positiva, a margem de {computedSim.netProfitMarginPct.toFixed(1)}% está vulnerável a flutuações rápidas de preços de frete ou renegociações de insumos.</span>
              ) : (
                <span>Alerta Crítico! A precificação está gerando perdas ou margem abaixo de 10%. Reavalie tributos ou faça correção imediata da sua tabela ou mude para o modelo Cost-Plus.</span>
              )}
            </div>
          </div>

          {/* Column 2: Applied products table (col-span-7) */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] border border-gray-150 flex flex-col justify-between overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="text-left">
                <h4 className="text-sm font-extrabold text-slate-800">Cálculo de Markup em Escala por Produto</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Aplique margem de {simTargetMargin}% em seu portfólio de produtos com apenas um clique.</p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-750 font-extrabold px-2.5 py-1 rounded-full uppercase border">
                {products.length} {products.length === 1 ? "Item" : "Itens"}
              </span>
            </div>

            <div className="p-3 overflow-y-auto max-h-[340px] space-y-2.5 text-left scrollbar-thin flex-grow">
              {products.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Package className="mx-auto mb-2 text-slate-300 animate-pulse" size={34} />
                  <p className="text-xs font-semibold">Sem produtos para avaliação no momento.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Insira produtos na planilha de custos para simular.</p>
                </div>
              ) : (
                productsRecommendations.map(({ product, recPrice, markupMultiplier, markupPct, possible, isPriceClose }) => {
                  return (
                    <div 
                      key={product.id}
                      className={cn(
                        "p-3.5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all text-xs",
                        isPriceClose 
                          ? "bg-emerald-50/30 border-emerald-555/20 text-emerald-850" 
                          : "bg-slate-50/50 border-slate-200/60 hover:border-slate-300"
                      )}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-extrabold text-[#141414] truncate flex items-center gap-1.5 flex-wrap">
                          <span>{product.name}</span>
                          {isPriceClose && (
                            <span className="text-[8.5px] bg-emerald-100 text-emerald-800 border border-emerald-300/30 px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider">
                              Equilibrado 30%
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-450 font-medium">
                          Custo: <strong className="font-mono text-gray-600">{formatCurrency(product.costPrice)}</strong> | Impostos: <strong className="font-mono text-gray-600">{product.taxRate}%</strong> | Outros custos: <strong className="font-mono text-gray-600">{product.otherCostsPct}%</strong>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Preço Praticado: <span className="font-mono font-bold text-gray-800">{formatCurrency(product.sellingPrice)}</span> (Margem atual: <span className={cn("font-bold font-mono", product.profitMarginPct < 15 ? "text-red-500" : product.profitMarginPct >= 30 ? "text-emerald-600" : "text-amber-500")}>{product.profitMarginPct.toFixed(1)}%</span>)
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-2.5 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-gray-100">
                        {possible ? (
                          <>
                            <div className="text-left sm:text-right">
                              <span className="text-[8px] uppercase font-black tracking-widest text-[#9e9e9e] block leading-none mb-1">Preço Sugerido ({simTargetMargin.toFixed(1)}%)</span>
                              <div className="font-mono font-black text-gray-900 text-sm">
                                {formatCurrency(recPrice)}
                              </div>
                              <span className="text-[9px] text-[#8e8e8e] font-sans block mt-0.5">
                                Markup: <strong className="text-indigo-600">{markupMultiplier.toFixed(2)}x</strong> ({markupPct >= 0 ? `+${markupPct.toFixed(0)}%` : `${markupPct.toFixed(0)}%`})
                              </span>
                            </div>

                            {!isPriceClose && (
                              <button
                                onClick={async () => {
                                  sound.playClick();
                                  const rawCost = product.costPrice;
                                  const rawTax = product.taxRate;
                                  const rawOther = product.otherCostsPct;
                                  const recPriceRounded = Math.round(recPrice * 100) / 100;
                                  const profitR$ = recPriceRounded - rawCost - (recPriceRounded * (rawTax / 100)) - (recPriceRounded * (rawOther / 100));
                                  const profitPercent = (profitR$ / recPriceRounded) * 100;
                                  
                                  try {
                                    await updateProduct(product.id, {
                                      ...product,
                                      sellingPrice: recPriceRounded,
                                      cmvPct: (rawCost / recPriceRounded) * 100,
                                      profitMarginPct: profitPercent,
                                      profitValue: profitR$,
                                    });
                                    showToast(`O preço de venda do prato/produto "${product.name}" foi ajustado para ${formatCurrency(recPriceRounded)} garantindo a margem líquida PJ de ${simTargetMargin.toFixed(1)}%!`, "success");
                                  } catch (err) {
                                    console.error(err);
                                    showToast("Incapaz de atualizar precificação do produto.", "error");
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow active:scale-95",
                                  simTargetMargin < 30
                                    ? "bg-rose-600 hover:bg-rose-700 font-extrabold focus:ring-2 focus:ring-rose-500/50"
                                    : "bg-orange-500 hover:bg-orange-600"
                                )}
                                title={
                                  simTargetMargin < 30
                                    ? `Alerta: Margem líquida configurada de ${simTargetMargin.toFixed(1)}% está abaixo do benchmark seguro de 30%!`
                                    : `Aplicar preço recalculado para atingir ${simTargetMargin.toFixed(1)}% de margem líquida real`
                                }
                              >
                                {simTargetMargin < 30 ? "⚠️ Aplicar Preço" : "Aplicar Preço"}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-rose-500 font-bold font-sans text-[10px] text-right">
                            Markup Impossível (Taxas &gt;= 70%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-150 rounded-b-[2rem]">
              <p className="text-[10px] text-gray-500 leading-snug">
                <strong>💡 Gestão Inteligente:</strong> Ao clicar em <strong>"Aplicar Preço"</strong>, o sistema atualiza em tempo real o preço de venda e recalculados no cockpit de custos com base nas cargas tributárias especificas de cada produto.
              </p>
            </div>
          </div>
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
          <div className="p-6 md:p-8 space-y-5 prose max-w-none text-xs leading-relaxed text-gray-750">
            {/* AUDITORY CALIBRATION PLAYER: DIRECT ROAD TO PRE-CONFIGURED VOICE */}
            <div className="bg-orange-50/70 border border-orange-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs text-left">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleToggleSpeech(aiReport)}
                  className={cn(
                    "p-4 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-[0_4px_12px_rgba(249,115,22,0.2)] hover:scale-[1.02] outline-none",
                    isSpeakingReport 
                      ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse" 
                      : "bg-[#141414] hover:bg-orange-500 text-white hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                  )}
                  title={isSpeakingReport ? "Interromper áudio da Dafne" : "Ouvir este laudo estratégico na voz calibrada de Dafne"}
                >
                  {isSpeakingReport ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} className="animate-pulse" />}
                </button>
                <div>
                  <h5 className="font-extrabold text-[12.5px] text-gray-900 m-0 leading-tight flex items-center gap-1.5">
                    {isSpeakingReport ? "Dafne Narrando Análise..." : "Ouvir Relatório por Voz"}
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block" />
                  </h5>
                  <p className="text-[9.5px] m-0 text-gray-500 mt-0.5 uppercase tracking-wide font-black">
                    {isSpeakingReport ? "Calibração de timbre ativa (Sintonizador)" : "Ouvir diretrizes financeiras cruas"}
                  </p>
                </div>
              </div>
              
              {/* Dynamic Soundwave Visualizer Sincronized with Voice State */}
              <div className="flex items-end gap-1 bg-white/60 py-2.5 px-4 rounded-xl border border-gray-150 shrink-0 w-36 justify-center h-9 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={isSpeakingReport ? {
                      height: [
                        "15%", 
                        `${Math.floor(Math.random() * 70) + 30}%`, 
                        `${Math.floor(Math.random() * 40) + 10}%`, 
                        `${Math.floor(Math.random() * 80) + 20}%`, 
                        "15%"
                      ]
                    } : {
                      height: "15%"
                    }}
                    transition={isSpeakingReport ? {
                      duration: 0.5 + (i % 3) * 0.12,
                      repeat: Infinity,
                      ease: "easeInOut"
                    } : {}}
                    className={cn(
                      "w-[3px] rounded-full transition-all duration-300",
                      isSpeakingReport ? "bg-orange-500" : "bg-gray-300"
                    )}
                    style={{ height: "4px" }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/65 border border-gray-150 rounded-3xl p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <HelpCircle size={18} className="text-orange-650 mt-0.5 shrink-0" />
                <div>
                  <h5 className="font-extrabold text-xs text-slate-805 m-0 leading-tight">Sua Mentoria Estratégica Está Pronta!</h5>
                  <p className="text-[10px] m-0 text-slate-500 mt-1 font-medium">
                    Análise exclusiva baseada nos seus {products.length} produtos. Exporte um documento independente com todas as tomadas de decisões financeiras.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportMentorshipOnlyPDF}
                className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(249,115,22,0.25)] cursor-pointer shrink-0 font-bold"
              >
                <FileDown size={14} /> Baixar PDF da Mentoria
              </button>
            </div>
 
            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-200/60 font-sans text-gray-800 space-y-3 whitespace-pre-line leading-relaxed relative text-left">
              <div className="absolute top-4 right-4 print:hidden opacity-80 hover:opacity-100 transition-all z-10">
                <button
                  type="button"
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
          <div className="bg-white rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
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

                // Increment sales count of the selected product
                updateProduct(sellingProduct.id, {
                  salesCount: (sellingProduct.salesCount || 0) + qty
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

      {/* Modal Editar Produto */}
      {editingProduct && editComputedValues && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h4 className="text-xl font-extrabold text-[#141414] mb-1 flex items-center gap-2">
              <Edit3 size={20} className="text-orange-500 shrink-0" /> Editar Precificação de Produto
            </h4>
            <p className="text-xs text-gray-500 mb-6 font-medium">
              Altere os custos, impostos e decole a margem de contribuição média.
            </p>

            <form onSubmit={handleUpdateProductSubmit} className="space-y-5 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">Nome do Produto / Prato *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">Código / SKU (Opcional)</label>
                  <input
                    type="text"
                    value={editFormData.sku}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">Preço de Custo (Insumo) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={editFormData.costPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, costPrice: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 font-mono text-gray-850"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">Margem Desejada % *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="95"
                    value={editFormData.desiredMargin}
                    onChange={(e) => setEditFormData({ ...editFormData, desiredMargin: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 font-mono text-gray-850"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">Alíquota de Impostos %</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editFormData.taxRate}
                    onChange={(e) => setEditFormData({ ...editFormData, taxRate: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 font-mono text-gray-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">Outros custos var. % (Cartão, comissões)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editFormData.otherCostsPct}
                    onChange={(e) => setEditFormData({ ...editFormData, otherCostsPct: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 font-mono text-gray-850"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">Preço Praticado R$</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={`Sugerido: R$ ${editComputedValues.suggestedPrice.toFixed(2)}`}
                    value={editFormData.sellingPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 font-mono text-gray-850"
                  />
                  {editReverseMarginPct !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditFormData((prev) => ({ ...prev, desiredMargin: editReverseMarginPct.toString() }));
                        showToast(`Margem desejada sincronizada para ${editReverseMarginPct}%!`, "success");
                      }}
                      className="mt-1.5 text-[9.5px] text-emerald-650 hover:text-emerald-755 font-bold flex items-center gap-1 focus:outline-none transition-all text-left bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-500/10 cursor-pointer w-full hover:bg-emerald-100/50"
                    >
                      <span>🎯 Preço equivale a <strong>{editReverseMarginPct}%</strong> de margem. Aplicar?</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">Vendas Acumuladas (Qtd)</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.salesCount}
                    onChange={(e) => setEditFormData({ ...editFormData, salesCount: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 font-mono text-gray-850"
                    placeholder="Ex: 15"
                  />
                  <span className="block text-[8px] text-gray-400 mt-1">Somas digitadas manualmente</span>
                </div>
              </div>

              {/* Edit Simulator status indicator */}
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
                <span className="text-[10px] bg-orange-100 text-orange-600 font-black px-2 py-0.5 rounded uppercase">Previsão Operacional de Margem</span>
                <p className="text-[11.5px] text-gray-705 mt-2">
                  Preço Sugerido: <strong className="font-mono text-gray-900">{formatCurrency(editComputedValues.suggestedPrice)}</strong> | CMV Previsto: <strong className="font-mono text-gray-900">{editComputedValues.cmvPct.toFixed(1)}%</strong>
                </p>
                <p className="text-[11.5px] text-gray-705 mt-1">
                  Lucro Líquido Real: <strong className={cn("font-mono", editComputedValues.profitVal >= 0 ? "text-emerald-600" : "text-red-500")}>
                    {formatCurrency(editComputedValues.profitVal)} ({editComputedValues.profitMarginPct.toFixed(1)}%)
                  </strong>
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-1/2 border border-gray-200 text-gray-700 hover:bg-gray-50 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Simulador Multicanal de Canais */}
      {simulatorProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              type="button"
              onClick={() => setSimulatorProduct(null)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="text-emerald-500 shrink-0" size={22} />
              <h4 className="text-xl font-extrabold text-[#141414] text-left">
                Simulador de Elasticidade de Canais
              </h4>
            </div>
            <p className="text-xs text-gray-500 mb-6 font-medium text-left">
              Analise como as taxas de comissão do Rappi/iFood corroem as suas margens e descubra o preço correto para cada canal de vendas!
            </p>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs text-emerald-800 font-extrabold mb-1">📦 Produto em Análise</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800 text-sm">{simulatorProduct.name}</span>
                <span className="text-xs font-black text-emerald-700 font-mono bg-emerald-100 px-3 py-1 rounded-lg">
                  Custo: {formatCurrency(simulatorProduct.costPrice)} | Margem Desejada: {simulatorProduct.desiredMargin}%
                </span>
              </div>
            </div>

            {/* Commissions configurations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/50">
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Comissão Balcão / Loja (%)</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={channelCommissions.balcao}
                  onChange={(e) => setChannelCommissions({ ...channelCommissions, balcao: parseFloat(e.target.value) || 0 })}
                  className="w-full accent-emerald-600 mb-1"
                />
                <span className="text-xs font-mono font-black text-gray-700 flex justify-between">
                  <span>Taxa:</span> <span>{channelCommissions.balcao}%</span>
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/50">
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Comissão iFood Básico (%)</label>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="0.5"
                  value={channelCommissions.deliveryBasic}
                  onChange={(e) => setChannelCommissions({ ...channelCommissions, deliveryBasic: parseFloat(e.target.value) || 0 })}
                  className="w-full accent-emerald-600 mb-1"
                />
                <span className="text-xs font-mono font-black text-gray-700 flex justify-between">
                  <span>Taxa iFood:</span> <span>{channelCommissions.deliveryBasic}%</span>
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/50">
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Comissão iFood Premium (%)</label>
                <input
                  type="range"
                  min="15"
                  max="35"
                  step="0.5"
                  value={channelCommissions.deliveryPremium}
                  onChange={(e) => setChannelCommissions({ ...channelCommissions, deliveryPremium: parseFloat(e.target.value) || 0 })}
                  className="w-full accent-emerald-600 mb-1"
                />
                <span className="text-xs font-mono font-black text-gray-700 flex justify-between">
                  <span>Logística iFood:</span> <span>{channelCommissions.deliveryPremium}%</span>
                </span>
              </div>
            </div>

            {/* Calculations comparing Channels */}
            <div className="space-y-4 mb-6 text-left">
              {[
                { name: "🏪 Canal Balcão / Presencial", commission: channelCommissions.balcao, bg: "bg-emerald-50/20 border-emerald-100", accent: "text-emerald-600" },
                { name: "🛵 Delivery Básico (Entrega Própria)", commission: channelCommissions.deliveryBasic, bg: "bg-amber-50/10 border-amber-100", accent: "text-amber-600" },
                { name: "⚡ Delivery Premium (Logística Parceira)", commission: channelCommissions.deliveryPremium, bg: "bg-red-50/10 border-red-100", accent: "text-red-700" },
              ].map((channel, i) => {
                // Calculate required price to keep exact same net profit margin as desired!
                const overallTaxes = simulatorProduct.taxRate + simulatorProduct.otherCostsPct;
                const totalDeductionsPct = overallTaxes + channel.commission + simulatorProduct.desiredMargin;
                
                let recPrice = 0;
                if (totalDeductionsPct < 100) {
                  recPrice = simulatorProduct.costPrice / (1 - totalDeductionsPct / 100);
                } else {
                  recPrice = simulatorProduct.costPrice * (1 + (simulatorProduct.desiredMargin + channel.commission) / 100);
                }

                // If they sell at the current sellingPrice, what is the DECAYED margin?
                const standardPrice = simulatorProduct.sellingPrice;
                const comAmount = standardPrice * (channel.commission / 100);
                const taxAmount = standardPrice * (simulatorProduct.taxRate / 100);
                const otherAmount = standardPrice * (simulatorProduct.otherCostsPct / 100);
                const actualProfit = standardPrice - simulatorProduct.costPrice - comAmount - taxAmount - otherAmount;
                const actualMarginPct = standardPrice > 0 ? (actualProfit / standardPrice) * 100 : 0;

                return (
                  <div key={i} className={cn("p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all", channel.bg)}>
                    <div>
                      <span className={cn("text-[9px] uppercase font-black tracking-widest block font-sans", channel.accent)}>
                        {channel.name} (Taxa: {channel.commission}%)
                      </span>
                      <p className="text-gray-500 text-[11px] mt-1">
                        Se vender ao preço atual de <strong className="text-gray-800">{formatCurrency(standardPrice)}</strong>:
                      </p>
                      <p className="text-xs mt-0.5 font-bold">
                        Margem Líquida Real Cai para:{" "}
                        <span className={cn(actualMarginPct < 5 ? "text-red-600 font-extrabold animate-pulse" : actualMarginPct < 15 ? "text-amber-600" : "text-emerald-600")}>
                          {actualMarginPct.toFixed(1)}%
                        </span>{" "}
                        (Sobram: <span className="font-mono">{formatCurrency(actualProfit)}</span> líquidos por unidade de venda)
                      </p>
                    </div>

                    <div className="text-left md:text-right bg-white p-3 rounded-xl border border-gray-200/60 grow md:grow-0 self-stretch md:self-auto flex flex-col justify-center min-w-[180px]">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">Preço Recomendado</span>
                      <strong className="text-base text-gray-900 font-mono block mt-0.5">{formatCurrency(recPrice)}</strong>
                      <span className="text-[9.5px] text-emerald-600 font-black tracking-wide block mt-0.5">Retém os {simulatorProduct.desiredMargin}% de lucro</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSimulatorProduct(null)}
                className="w-full bg-[#141414] hover:bg-orange-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Concluir Simulação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Análise de Elasticidade-Preço da Demanda (EPD) */}
      {elasticityProduct && (() => {
        const basePrice = elasticityProduct.sellingPrice || 1;
        const costPrice = elasticityProduct.costPrice;
        const taxRate = elasticityProduct.taxRate || 0;
        const otherCostsPct = elasticityProduct.otherCostsPct || 0;
        const totalTaxAndOthersPct = taxRate + otherCostsPct;
        const proposedPrice = basePrice * (1 + priceChangePct / 100);
        const demandChangePct = elasticityCoef * priceChangePct;
        const projectedVolume = Math.max(0, baseWeeklyVolume * (1 + demandChangePct / 100));

        // Contribution calculations
        const currentUnitProfit = basePrice * (1 - totalTaxAndOthersPct / 100) - costPrice;
        const proposedUnitProfit = proposedPrice * (1 - totalTaxAndOthersPct / 100) - costPrice;

        const currentTotalProfit = currentUnitProfit * baseWeeklyVolume;
        const proposedTotalProfit = proposedUnitProfit * projectedVolume;
        const profitDiff = proposedTotalProfit - currentTotalProfit;
        const profitDiffPct = currentTotalProfit !== 0 ? (profitDiff / Math.abs(currentTotalProfit)) * 100 : 0;

        const currentTotalRevenue = basePrice * baseWeeklyVolume;
        const proposedTotalRevenue = proposedPrice * projectedVolume;
        const revenueDiff = proposedTotalRevenue - currentTotalRevenue;
        const revenueDiffPct = currentTotalRevenue !== 0 ? (revenueDiff / currentTotalRevenue) * 100 : 0;

        const chartPoints = [-30, -20, -10, 0, 10, 20, 30, 40, 50].map(pct => {
          const p = basePrice * (1 + pct / 100);
          const dq = elasticityCoef * pct;
          const q = Math.max(0, baseWeeklyVolume * (1 + dq / 100));
          const rev = p * q;
          const uProfit = p * (1 - totalTaxAndOthersPct / 100) - costPrice;
          const totalProf = uProfit * q;
          return {
            name: `${pct > 0 ? '+' : ''}${pct}%`,
            Price: Number(p.toFixed(1)),
            Volume: Math.round(q),
            Revenue: Math.round(rev),
            Profit: Math.round(totalProf)
          };
        });

        const elasticityPresets = [
          { label: "💼 Altamente Inelástico", coef: -0.4, desc: "Produtos críticos, indispensáveis, exclusivos ou insumos de produção essenciais." },
          { label: "🏷️ Pouco Inelástico", coef: -0.8, desc: "Marca forte, nicho relevante ou alta fidelidade de compras recorrentes." },
          { label: "⚖️ Unitário (Equilíbrio)", coef: -1.0, desc: "A alteração no preço induz o mesmo percentual de variação de consumo." },
          { label: "📣 Elástico", coef: -1.8, desc: "Produto com forte concorrência e fácil substituição no mercado." },
          { label: "⚡ Altamente Elástico", coef: -2.8, desc: "Guerra de preços em commodity tática. Qualquer aumento zera as vendas." },
        ];

        // Is elasticity level elastic or inelastic?
        const isElastic = Math.abs(elasticityCoef) > 1.0;
        const isUnitary = Math.abs(elasticityCoef) === 1.0;

        let elasticityLabel = "Inelástico (Baixa Sensibilidade)";
        let elasticityBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (isElastic) {
          elasticityLabel = "Elástico (Alta Sensibilidade)";
          elasticityBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
        } else if (isUnitary) {
          elasticityLabel = "Elasticidade Unitária";
          elasticityBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        }

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl relative overflow-y-auto max-h-[92vh] space-y-6">
              <button
                type="button"
                onClick={() => setElasticityProduct(null)}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-650 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-all font-bold"
              >
                <X size={20} />
              </button>

              <div className="flex gap-2.5 items-center">
                <span className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-700">
                  <TrendingUp size={22} />
                </span>
                <div className="text-left">
                  <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    Engenharia de Precificação & Volume
                  </span>
                  <h3 className="text-xl font-extrabold text-[#141414] mt-1">
                    Análise Estatística de Elasticidade de Demanda (EPD)
                  </h3>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-left leading-normal max-w-3xl">
                A <strong>Elasticidade-Preço da Demanda (EPD)</strong> mede quão sensíveis seus clientes são a reajustes de preço.
                Produtos críticos com marca forte ou essenciais para a operação suportam aumentos (Inelásticos), enquanto itens comuns sofrem rápida fuga de volume (Elásticos).
              </p>

              {/* Product Info Banner */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                <div>
                  <span className="text-[8px] text-indigo-300 font-black uppercase tracking-wider block">Produto Selecionado</span>
                  <strong className="text-base font-extrabold mt-0.5 block truncate text-white">{elasticityProduct.name}</strong>
                  <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{elasticityProduct.sku || "Sem SKU cadastrado"}</span>
                </div>
                <div>
                  <span className="text-[8px] text-indigo-300 font-black uppercase tracking-wider block">Preço de Venda Praticado</span>
                  <strong className="text-base font-mono font-black mt-0.5 block text-white">{formatCurrency(basePrice)}</strong>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-0.5 font-sans">Margem Operacional: {elasticityProduct.profitMarginPct.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[8px] text-indigo-300 font-black uppercase tracking-wider block">Custo Unitário de Confecção</span>
                  <strong className="text-base font-mono font-black mt-0.5 block text-white">{formatCurrency(costPrice)}</strong>
                  <span className="text-[10px] text-gray-400 font-bold block mt-0.5 font-sans">CMV Base: {elasticityProduct.cmvPct.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[8px] text-indigo-300 font-black uppercase tracking-wider block">Tributação + Variáveis</span>
                  <strong className="text-base font-mono font-black mt-0.5 block text-white">{(totalTaxAndOthersPct).toFixed(1)}%</strong>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5 font-sans">Imposto ({taxRate}%) + Comissões ({otherCostsPct}%)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Inputs Column (col-span-5) */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-5 text-left w-full">
                  
                  {/* Preset Elasticities */}
                  <div className="bg-gray-50/70 p-5 rounded-3xl border border-gray-150 space-y-3.5">
                    <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                      <span>🏷️</span> Tipo de Comportamento de Demanda
                    </h5>
                    
                    <div className="space-y-1.5">
                      {elasticityPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setElasticityCoef(preset.coef);
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-2xl border text-xs transition-all flex flex-col gap-0.5 cursor-pointer",
                            elasticityCoef === preset.coef
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                              : "bg-white hover:bg-gray-100 border-gray-200 text-gray-700"
                          )}
                        >
                          <div className="flex justify-between items-center w-full font-bold">
                            <span>{preset.label}</span>
                            <span className="font-mono">EPD: {preset.coef.toFixed(1)}</span>
                          </div>
                          <p className={cn("text-[9.5px] font-medium leading-relaxed", elasticityCoef === preset.coef ? "text-indigo-100" : "text-gray-450")}>
                            {preset.desc}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Technical Custom Adjustment Slider */}
                    <div className="pt-2.5 border-t border-gray-200 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                        <span>Ajuste Fino do Coeficiente (EPD)</span>
                        <span className="font-mono text-indigo-700 font-extrabold font-sans">Coef: {elasticityCoef.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="-4.0"
                        max="-0.1"
                        step="0.1"
                        value={elasticityCoef}
                        onChange={(e) => {
                          sound.playTick();
                          setElasticityCoef(parseFloat(e.target.value));
                        }}
                        className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Baseline Volumes and Adjustments */}
                  <div className="bg-gray-50/70 p-5 rounded-3xl border border-gray-150 space-y-4">
                    <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                      ⚙️ Parâmetros de Simulação Tática
                    </h5>

                    {/* Monthly Volume */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-600 uppercase text-[10px]">Demanda Base do Período (Volume de Vendas)</span>
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-0.5">
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            value={baseWeeklyVolume}
                            onChange={(e) => {
                              setBaseWeeklyVolume(Math.max(1, parseInt(e.target.value) || 0));
                            }}
                            className="w-20 text-right font-black font-mono text-gray-800 bg-transparent focus:outline-none focus:ring-0 text-xs"
                          />
                          <span className="text-gray-450 text-[10px] font-bold">Unidades</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="2000"
                        step="10"
                        value={baseWeeklyVolume}
                        onChange={(e) => {
                          sound.playClick();
                          setBaseWeeklyVolume(parseInt(e.target.value));
                        }}
                        className="w-full h-1 bg-gray-250 rounded appearance-none cursor-pointer accent-slate-750"
                      />
                    </div>

                    {/* Price Slider */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-600 uppercase text-[10px]">Alteração de Preço Proposta</span>
                        <span className={cn(
                          "font-mono font-black text-xs px-2 py-0.5 rounded font-sans",
                          priceChangePct > 0 ? "bg-emerald-50 text-emerald-700" : priceChangePct < 0 ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {priceChangePct > 0 ? `+${priceChangePct}` : priceChangePct}% (Reajuste)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="50"
                        step="1"
                        value={priceChangePct}
                        onChange={(e) => {
                          sound.playTick();
                          setPriceChangePct(parseInt(e.target.value));
                        }}
                        className="w-full h-1 bg-gray-250 rounded appearance-none cursor-pointer accent-orange-500"
                      />
                      <div className="flex justify-between text-[8px] text-gray-400 font-mono font-semibold">
                        <span>Desconto (-30%)</span>
                        <span>Preço Praticado Atual</span>
                        <span>Acréscimo (+50%)</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Simulation Outputs Column (col-span-7) */}
                <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-gray-150 overflow-hidden flex flex-col justify-between w-full">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-left">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">Resultado da Projeção de Volume</h4>
                      <p className="text-[10px] text-gray-400">Projeção matemática com base no coeficiente de sensibilidade.</p>
                    </div>
                    <span className={cn("px-2.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-tight", elasticityBadgeClass)}>
                      {elasticityLabel}
                    </span>
                  </div>

                  {/* Core Metrics Cards Grid */}
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* Price changes */}
                      <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-200 text-center">
                        <span className="block text-[8px] uppercase font-extrabold text-gray-400 leading-none">Novo Preço Simulado</span>
                        <strong className="text-base font-mono text-slate-900 block mt-1.5">{formatCurrency(proposedPrice)}</strong>
                        <span className="text-[8px] block text-gray-400 mt-1 uppercase leading-none font-sans">
                          Anterior: {formatCurrency(basePrice)}
                        </span>
                      </div>

                      {/* Demand change */}
                      <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-200 text-center">
                        <span className="block text-[8px] uppercase font-extrabold text-gray-400 leading-none font-sans">Impacto na Demanda</span>
                        <strong className={cn(
                          "text-base font-mono block mt-1.5",
                          demandChangePct < 0 ? "text-rose-600" : demandChangePct > 0 ? "text-emerald-600" : "text-gray-500"
                        )}>
                          {demandChangePct > 0 ? '+' : ''}{demandChangePct.toFixed(1)}%
                        </strong>
                        <span className="text-[8px] block text-gray-500 font-bold mt-1 uppercase leading-none">
                          {Math.round(projectedVolume)} u. projetadas
                        </span>
                      </div>

                      {/* Profit change */}
                      <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-200 text-center">
                        <span className="block text-[8px] uppercase font-extrabold text-gray-400 leading-none font-sans">Lucro Operacional Total</span>
                        <strong className={cn(
                          "text-base font-mono block mt-1.5",
                          profitDiff > 0 ? "text-emerald-600" : profitDiff < 0 ? "text-rose-600" : "text-gray-500"
                        )}>
                          {profitDiffPct > 0 ? '+' : ''}{profitDiffPct.toFixed(1)}%
                        </strong>
                        <span className="text-[8px] block text-gray-500 font-bold mt-1 uppercase leading-none font-sans">
                          Dif: {formatCurrency(profitDiff)}
                        </span>
                      </div>

                    </div>

                    {/* Comparison Details List */}
                    <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 text-left space-y-2.5">
                      <div className="flex justify-between items-center text-xs pb-1.5 border-b border-gray-200/50 font-semibold">
                        <span className="text-gray-650">Parâmetro de Comparação</span>
                        <div className="flex gap-4 font-mono w-40 text-right">
                          <span className="w-20 block text-gray-400 uppercase text-[9px] font-black">Histórico</span>
                          <span className="w-20 block text-slate-800 uppercase text-[9px] font-black">Projetado</span>
                        </div>
                      </div>

                      {/* Row: Volume */}
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200/50">
                        <span className="text-gray-650">Giro Estimado no Período:</span>
                        <div className="flex gap-4 font-mono font-bold text-right w-40 text-xs">
                          <span className="w-20 text-gray-500">{baseWeeklyVolume} u.</span>
                          <span className="w-20 text-slate-900">{Math.round(projectedVolume)} u.</span>
                        </div>
                      </div>

                      {/* Row: Unit margin */}
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200/50">
                        <span className="text-gray-655 font-sans">Sobra Unitária Líquida:</span>
                        <div className="flex gap-4 font-mono font-bold text-right w-40 text-xs">
                          <span className="w-20 text-gray-500">{formatCurrency(currentUnitProfit)}</span>
                          <span className="w-20 text-indigo-650">{formatCurrency(proposedUnitProfit)}</span>
                        </div>
                      </div>

                      {/* Row: Gross revenue */}
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200/50">
                        <span className="text-gray-655 font-sans">Faturamento Bruto Total:</span>
                        <div className="flex gap-4 font-mono font-bold text-right w-40 text-xs">
                          <span className="w-20 text-gray-400">{formatCurrency(currentTotalRevenue)}</span>
                          <span className={cn("w-20", revenueDiff >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {formatCurrency(proposedTotalRevenue)}
                          </span>
                        </div>
                      </div>

                      {/* Row: Total Profit */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-800">Lucro Operacional Real:</span>
                        <div className="flex gap-4 font-mono font-black text-right w-40 text-xs">
                          <span className="w-20 text-gray-500">{formatCurrency(currentTotalProfit)}</span>
                          <span className={cn("w-20", profitDiff >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {formatCurrency(proposedTotalProfit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Chart visual representation */}
                    <div className="space-y-1.5 pt-1 text-left">
                      <span className="block text-[9px] font-black uppercase text-gray-450 tracking-wider">
                        📈 Curva Dinâmica Price-Volume-Profit (Variação Simulação)
                      </span>
                      <div className="h-44 w-full bg-slate-50 border border-gray-200 rounded-2xl p-3 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} fontWeight="bold" />
                            <YAxis stroke="#9ca3af" fontSize={8} />
                            <ChartTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-[#141414] text-white p-3 rounded-2xl border border-gray-800 shadow-xl text-left text-[11px] space-y-1">
                                      <p className="font-black text-orange-400">Reajuste de Preço: {data.name}</p>
                                      <p className="font-medium text-gray-300">Preço Unit.: <span className="font-mono text-white font-bold">{formatCurrency(data.Price)}</span></p>
                                      <p className="font-medium text-gray-300">Demanda Volume: <span className="font-mono text-white font-bold">{data.Volume} u.</span></p>
                                      <p className="font-medium text-gray-300">Receita Bruta: <span className="font-mono text-orange-400 font-bold">{formatCurrency(data.Revenue)}</span></p>
                                      <p className="font-medium text-gray-300">Lucro Operacional: <span className="font-mono text-emerald-400 font-bold">{formatCurrency(data.Profit)}</span></p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" name="Lucro Projetado" filter="url(#neon-glow-emerald)" />
                            <Line type="monotone" dataKey="Revenue" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Receita" filter="url(#neon-glow-orange)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between text-[8px] md:text-[9px] font-bold text-gray-400">
                        <span>🏷️ Tracejado Laranja: Faturamento Bruto</span>
                        <span>🟢 Área Verde: Lucro Líquido Operacional Projetado</span>
                      </div>
                    </div>

                    {/* Mentoria da Dafne Coordinator */}
                    <div className={cn(
                      "p-4 rounded-2xl border text-left text-xs space-y-1.5 transition-all text-gray-700",
                      profitDiff > 0 ? "bg-emerald-50 border-emerald-200" : profitDiff < 0 ? "bg-rose-50 border-rose-200" : "bg-gray-100 border-gray-150"
                    )}>
                      <p className="font-extrabold flex items-center gap-1">
                        <span>🤖</span> Mentoria Tática da Dafne IA:
                      </p>
                      <p className="leading-relaxed text-[10.5px]">
                        {profitDiff > 0 ? (
                          <span>
                            <strong>Reajuste Estratégico Favorável:</strong> Devido ao perfil <strong>Inelástico</strong> deste SKU de produto crítico, o acréscimo proposto de {priceChangePct}% gera uma variação de compra contida. Mesmo vendendo menos unidades ({Math.round(projectedVolume)} u. vs {baseWeeklyVolume} u.), seu lucro operacional consolidado cresce em <strong>{formatCurrency(profitDiff)} (+{profitDiffPct.toFixed(1)}%)</strong>! A tabela é viável.
                          </span>
                        ) : profitDiff < 0 ? (
                          <span>
                            <strong>Alerta de Ruptura Operacional (Efeito Elástico):</strong> Desaconselhado. Com um coeficiente de sensibilidade elástico de {elasticityCoef.toFixed(1)}, a fuga de volume cancela o efeito de maior preço unitário, encolhendo seu lucro em <strong>{formatCurrency(Math.abs(profitDiff))} (-{Math.abs(profitDiffPct).toFixed(1)}%)</strong>. Estude agregar serviços adicionais de valor antes de reposicionar.
                          </span>
                        ) : (
                          <span>
                            <strong>Ajuste Neutro:</strong> Variação sem tração de margem diferencial. A mudança induz o mesmo percentual de recuo de consumo de compras.
                          </span>
                        )}
                      </p>
                    </div>

                  </div>

                  <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        const updated = { ...elasticityProduct, sellingPrice: proposedPrice };
                        updateProduct(elasticityProduct.id, { sellingPrice: proposedPrice });
                        showToast(`Nova tabela de vendas para ${elasticityProduct.name} atualizada para ${formatCurrency(proposedPrice)}!`, "success");
                        setElasticityProduct(null);
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Aplicar Proposta na Tabela de Vendas (Nacional)
                    </button>
                    <button
                      type="button"
                      onClick={() => setElasticityProduct(null)}
                      className="px-6 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </div>
        );
      })()}

        </>
      )}
    </div>
  );
}
