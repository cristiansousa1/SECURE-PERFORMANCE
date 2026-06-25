import React, { useState, useMemo, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  TrendingUp, 
  Coins, 
  ArrowUpRight, 
  Percent, 
  Info, 
  AlertTriangle,
  HelpCircle,
  Layers,
  Sliders,
  Sparkles,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Building,
  User,
  Calculator,
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  SlidersHorizontal,
  Scale,
  DollarSign,
  PieChart as PieIcon,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie 
} from "recharts";
import { cn } from "../lib/utils";
import { sound } from "../utils/SoundEngine";

// --- SELF-CONTAINED RESILIENT CPF/CNPJ UTILITIES TO PREVENT LINK BREAKS ---
const isCPF = (doc: string = "") => {
  const clean = doc.replace(/\D/g, "");
  return clean.length === 11;
};

const formatCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  return v
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCNPJ = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 14) v = v.substring(0, 14);
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const isValidCPF = (cpfStr: string) => {
  const clean = cpfStr.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean[10])) return false;
  return true;
};

const isValidCNPJ = (cnpjStr: string) => {
  const clean = cnpjStr.replace(/\D/g, "");
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;
  
  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

export const StoresConsolidationSubView: React.FC = () => {
  const {
    storeProfiles,
    addStoreProfile,
    deleteStoreProfile,
    updateStoreProfile,
    allTransactions, // Utilizando a lista completa para o fatiamento preciso por filial
    categories,
    profile,
    showToast
  } = useFinance();

  // Active sub-sections
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  
  // Track expanded store IDs for rich legal visualization
  const [expandedStoreIds, setExpandedStoreIds] = useState<string[]>([]);

  // Interactive shared cost allocation (Rateio) States
  const [sharedCostToAllocate, setSharedCostToAllocate] = useState<number>(0);
  const [allocationMethod, setAllocationMethod] = useState<"equal" | "proportional">("proportional");

  // New Store Form State with enhanced legal properties
  const [newStoreForm, setNewStoreForm] = useState({
    companyName: "",
    documentType: "cnpj" as "cnpj" | "cpf",
    cnpj: "",
    taxRate: 6,
    cardFeeRate: 2.5,
    businessSegment: "commerce",
    color: "orange",
    customUrl: "",
    razaoSocial: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    socioResponsavel: ""
  });
  const [newCnpjError, setNewCnpjError] = useState("");

  // Edit Store Form State with enhanced properties
  const [editStoreForm, setEditStoreForm] = useState({
    companyName: "",
    documentType: "cnpj" as "cnpj" | "cpf",
    cnpj: "",
    taxRate: 6,
    cardFeeRate: 2.5,
    businessSegment: "commerce",
    color: "orange",
    customUrl: "",
    razaoSocial: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    socioResponsavel: ""
  });
  const [editCnpjError, setEditCnpjError] = useState("");

  // Slices selection state - by default, all available store profiles are checked
  const [selectedStoresForSlice, setSelectedStoresForSlice] = useState<string[]>([]);

  // Sync selected stores when storeProfiles list is populated or updated
  useEffect(() => {
    if (storeProfiles.length > 0 && selectedStoresForSlice.length === 0) {
      setSelectedStoresForSlice(storeProfiles.map(s => s.id));
    } else {
      setSelectedStoresForSlice(prev => {
        const activeIds = storeProfiles.map(s => s.id);
        const next = prev.filter(id => activeIds.includes(id));
        // Add any new ones
        activeIds.forEach(id => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }
  }, [storeProfiles]);

  const toggleExpandStore = (id: string) => {
    sound.playClick();
    setExpandedStoreIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSliceStore = (id: string) => {
    sound.playClick();
    setSelectedStoresForSlice(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          showToast("A consolidação precisa apresentar ao menos 1(uma) filial ativa para o fatiamento.", "warning");
          return prev;
        }
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllSliceStores = () => {
    sound.playClick();
    setSelectedStoresForSlice(storeProfiles.map(s => s.id));
    showToast("Todas as filiais foram acopladas ao consolidado.", "success");
  };

  const selectOnlyCNPJ = () => {
    sound.playClick();
    const cnpjs = storeProfiles.filter(s => !isCPF(s.cnpj) && s.cnpj.trim() !== "").map(s => s.id);
    if (cnpjs.length === 0) {
      showToast("Nenhuma filial cadastrada sob documento CNPJ.", "info");
      return;
    }
    setSelectedStoresForSlice(cnpjs);
    showToast("Consolidado fatiado restritamente para Pessoas Jurídicas (CNPJ).", "success");
  };

  const selectOnlyCPF = () => {
    sound.playClick();
    const cpfs = storeProfiles.filter(s => isCPF(s.cnpj)).map(s => s.id);
    if (cpfs.length === 0) {
      showToast("Nenhuma filial cadastrada sob pessoa física (CPF).", "info");
      return;
    }
    setSelectedStoresForSlice(cpfs);
    showToast("Consolidado fatiado restritamente para Pessoas Físicas (CPF).", "success");
  };

  // Color mapping config helper
  const getColorClasses = (colorName?: string) => {
    switch (colorName) {
      case "emerald":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
          badge: "bg-emerald-500",
          hex: "#10b981",
          border: "border-emerald-500/30",
          text: "text-emerald-500",
          darkBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        };
      case "blue":
        return {
          bg: "bg-blue-50 border-blue-200 text-blue-700",
          badge: "bg-blue-600",
          hex: "#2563eb",
          border: "border-blue-500/30",
          text: "text-blue-500",
          darkBg: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
        };
      case "purple":
        return {
          bg: "bg-purple-50 border-purple-200 text-purple-700",
          badge: "bg-purple-500",
          hex: "#a855f7",
          border: "border-purple-500/30",
          text: "text-purple-500",
          darkBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20"
        };
      case "rose":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-700",
          badge: "bg-rose-500",
          hex: "#f43f5e",
          border: "border-rose-500/30",
          text: "text-rose-500",
          darkBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
        };
      default:
        return {
          bg: "bg-orange-50 border-orange-200 text-orange-700",
          badge: "bg-orange-500",
          hex: "#f97316",
          border: "border-orange-500/30",
          text: "text-orange-500",
          darkBg: "bg-orange-500/10 text-orange-400 border border-orange-500/20"
        };
    }
  };

  const segmentLabels: Record<string, string> = {
    commerce: "Varejo / Comércio",
    food: "Alimentação / Gastronomia",
    services: "Prestação de Serviços",
    tech: "Agência / SaaS / Tech",
    other: "Outras Atividades"
  };

  // 1. CALCULATE INDIVIDUAL METRICS FOR EACH STORE FROM THE SINK TRANSACTIONS
  const storeCalculations = useMemo(() => {
    return storeProfiles.map(store => {
      // Find transactions specific to this store model inside allTransactions
      const storeTx = allTransactions.filter(t => {
        if (t.profileId === store.id) return true;
        // fallback to matriz if profileId is omitted and store is 'matriz'
        if (store.id === "matriz" && (!t.profileId || t.profileId === "matriz")) return true;
        return false;
      });

      let revenue = 0;
      let costOfGoods = 0; // CMV (explicitly flagged or with specific tags)
      let opex = 0;

      storeTx.forEach(t => {
        const amt = t.amount || 0;
        if (t.type === "income") {
          revenue += amt;
        } else if (t.type === "expense") {
          if (t.isCmvExpense) {
            costOfGoods += amt;
          } else {
            opex += amt;
          }
        }
      });

      // Simple calculated tax based on registered store taxRate percent
      const calculatedTaxes = revenue * ((store.taxRate || 0) / 100);
      const ebitda = revenue - costOfGoods - opex - calculatedTaxes;
      const margin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

      return {
        ...store,
        txCount: storeTx.length,
        revenue,
        costOfGoods,
        opex,
        calculatedTaxes,
        ebitda,
        margin
      };
    });
  }, [storeProfiles, allTransactions]);

  // Total Consolidated Net worth for onlychecked/sliced stores
  const totals = useMemo(() => {
    let revenue = 0;
    let costOfGoods = 0;
    let opex = 0;
    let taxes = 0;
    let transactionsCount = 0;

    storeCalculations.forEach(calc => {
      if (selectedStoresForSlice.includes(calc.id)) {
        revenue += calc.revenue;
        costOfGoods += calc.costOfGoods;
        opex += calc.opex;
        taxes += calc.calculatedTaxes;
        transactionsCount += calc.txCount;
      }
    });

    const ebitda = revenue - costOfGoods - opex - taxes;
    const netMarginPercent = revenue > 0 ? (ebitda / revenue) * 100 : 0;

    return {
      revenue,
      costOfGoods,
      opex,
      taxes,
      ebitda,
      netMarginPercent,
      transactionsCount
    };
  }, [storeCalculations, selectedStoresForSlice]);

  // Allocation computations for Simulatedrateio
  const allocationBreakdown = useMemo(() => {
    if (sharedCostToAllocate <= 0 || selectedStoresForSlice.length === 0) return [];

    let totalWeightMetric = 0;
    const targets = storeCalculations.filter(c => selectedStoresForSlice.includes(c.id));

    if (allocationMethod === "proportional") {
      targets.forEach(c => {
        totalWeightMetric += c.revenue;
      });
    }

    return targets.map(c => {
      let allocatedValue = 0;
      if (allocationMethod === "equal") {
        allocatedValue = sharedCostToAllocate / targets.length;
      } else {
        // Proportional to faturamento
        allocatedValue = totalWeightMetric > 0 
          ? (c.revenue / totalWeightMetric) * sharedCostToAllocate 
          : sharedCostToAllocate / targets.length;
      }

      const simulatedEbitda = c.ebitda - allocatedValue;
      const simulatedMargin = c.revenue > 0 ? (simulatedEbitda / c.revenue) * 100 : 0;

      return {
        id: c.id,
        companyName: c.companyName,
        revenue: c.revenue,
        originalEbitda: c.ebitda,
        allocatedValue,
        simulatedEbitda,
        simulatedMargin
      };
    });
  }, [storeCalculations, selectedStoresForSlice, sharedCostToAllocate, allocationMethod]);

  // Handle store profile elimination
  const handleDeleteStore = (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir permanentemente a filial/documento "${name}"? Os lançamentos serão mantidos no sistema mas desvinculados do perfil.`)) {
      sound.playClick();
      deleteStoreProfile(id);
      showToast(`Perfil "${name}" desqualificado com sucesso.`, "success");
    }
  };

  // Form submit for new Store with detailed fields
  const handleCreateStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreForm.companyName.trim()) {
      showToast("O nome de fantasia ou referência é obrigatório.", "error");
      return;
    }

    const docStr = newStoreForm.cnpj.trim();
    if (docStr !== "") {
      const isValid = newStoreForm.documentType === "cnpj" ? isValidCNPJ(docStr) : isValidCPF(docStr);
      if (!isValid) {
        showToast(`Documento ${newStoreForm.documentType.toUpperCase()} estruturalmente incorreto.`, "error");
        return;
      }
    }

    // Save with the clean structured extra metadata properties for granular differentiation
    addStoreProfile({
      companyName: newStoreForm.companyName.trim(),
      cnpj: docStr,
      taxRate: newStoreForm.taxRate,
      cardFeeRate: newStoreForm.cardFeeRate || 2.5,
      businessSegment: newStoreForm.businessSegment,
      color: newStoreForm.color,
      customUrl: newStoreForm.customUrl.trim(),
      razaoSocial: newStoreForm.razaoSocial.trim() || undefined,
      inscricaoEstadual: newStoreForm.inscricaoEstadual.trim() || undefined,
      inscricaoMunicipal: newStoreForm.inscricaoMunicipal.trim() || undefined,
      socioResponsavel: newStoreForm.socioResponsavel.trim() || undefined
    });

    setNewStoreForm({
      companyName: "",
      documentType: "cnpj",
      cnpj: "",
      taxRate: 6,
      cardFeeRate: 2.5,
      businessSegment: "commerce",
      color: "orange",
      customUrl: "",
      razaoSocial: "",
      inscricaoEstadual: "",
      inscricaoMunicipal: "",
      socioResponsavel: ""
    });
    setNewCnpjError("");
    setShowAddForm(false);
  };

  // Handle loaded parameters for editing
  const startEditStore = (store: any) => {
    sound.playClick();
    const isDocCpf = isCPF(store.cnpj);
    setEditingStoreId(store.id);
    setEditStoreForm({
      companyName: store.companyName,
      documentType: isDocCpf ? "cpf" : "cnpj",
      cnpj: store.cnpj || "",
      taxRate: store.taxRate || 0,
      cardFeeRate: store.cardFeeRate || 2.5,
      businessSegment: store.businessSegment || "commerce",
      color: store.color || "orange",
      customUrl: store.customUrl || "",
      razaoSocial: store.razaoSocial || "",
      inscricaoEstadual: store.inscricaoEstadual || "",
      inscricaoMunicipal: store.inscricaoMunicipal || "",
      socioResponsavel: store.socioResponsavel || ""
    });
    setEditCnpjError("");
  };

  const handleEditStoreSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editStoreForm.companyName.trim()) {
      showToast("O nome fantasia é obrigatório.", "error");
      return;
    }

    const docStr = editStoreForm.cnpj.trim();
    if (docStr !== "") {
      const isValid = editStoreForm.documentType === "cnpj" ? isValidCNPJ(docStr) : isValidCPF(docStr);
      if (!isValid) {
        showToast(`Dígitos do ${editStoreForm.documentType.toUpperCase()} incorretos.`, "error");
        return;
      }
    }

    updateStoreProfile(id, {
      companyName: editStoreForm.companyName.trim(),
      cnpj: docStr,
      taxRate: editStoreForm.taxRate,
      cardFeeRate: editStoreForm.cardFeeRate,
      businessSegment: editStoreForm.businessSegment,
      color: editStoreForm.color,
      customUrl: editStoreForm.customUrl.trim(),
      razaoSocial: editStoreForm.razaoSocial.trim() || undefined,
      inscricaoEstadual: editStoreForm.inscricaoEstadual.trim() || undefined,
      inscricaoMunicipal: editStoreForm.inscricaoMunicipal.trim() || undefined,
      socioResponsavel: editStoreForm.socioResponsavel.trim() || undefined
    });

    setEditingStoreId(null);
    setEditCnpjError("");
  };

  const filteredStoreCalcs = storeCalculations.filter(calc => {
    const text = (
      calc.companyName + " " + 
      calc.cnpj + " " + 
      (calc.razaoSocial || "") + " " + 
      (calc.socioResponsavel || "") + " " +
      calc.businessSegment
    ).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const compareChartData = useMemo(() => {
    return storeCalculations.map(c => ({
      name: c.companyName.split("(")[0].trim(),
      "Faturamento (R$)": c.revenue,
      "Custo Operacional (R$)": c.costOfGoods + c.opex,
      "Imposto Estimado (R$)": c.calculatedTaxes,
      "Lucro EBITDA (R$)": c.ebitda
    }));
  }, [storeCalculations]);

  const pieChartData = useMemo(() => {
    return storeCalculations
      .filter(c => c.revenue > 0)
      .map(c => ({
        name: c.companyName.split("(")[0].trim(),
        value: c.revenue,
        color: getColorClasses(c.color).hex
      }));
  }, [storeCalculations]);

  return (
    <div className="space-y-8 pb-12 transition-all">
      
      {/* 1. SECTOR BANNER METRIC MATRIX SLICING - MODERN & CHIC */}
      <div className="bg-[#0b0c10] border border-zinc-800 rounded-3xl p-6 md:p-8 text-left text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-amber-500/15 text-orange-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/30 flex items-center gap-1.5 ring-4 ring-orange-500/5 animate-pulse">
                <Sliders size={12} /> Matrix Slicing Tech V3.5
              </span>
              <span className="px-3 py-1 bg-white/5 text-zinc-300 rounded-full text-[10px] font-mono font-bold border border-white/10 uppercase">
                Consolidação Unificada de Caixas
              </span>
            </div>
            <h1 className="text-2xl md:text-3.5xl font-black uppercase tracking-tight text-white font-sans">
              Consolidado Avançado de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Lojas & CPFs/CNPJs</span>
            </h1>
            <p className="text-xs text-zinc-300 font-medium leading-relaxed max-w-3xl">
              Uma cockpit de governança fiduciária integrada. Cadastre múltiplas lojas, representações ou filiais sob CNPJ ou CPF de forma isolada e discriminada. Controle alíquotas reais, taxas de transações, fatiamento tributário proporcional e analise o balancete dinâmico com simulação matemática avançada de rateio de despesas.
            </p>
          </div>
          
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 shrink-0 self-stretch md:self-auto flex flex-row md:flex-col justify-around items-center gap-4">
            <div className="text-center md:text-right">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block font-mono">STATUS CONCEITUAL</span>
              <span className="text-[11.5px] font-bold text-orange-400 italic font-sans flex items-center justify-center gap-1.5 mt-1">
                <ShieldCheck size={14} className="text-emerald-400 animate-pulse" /> Governança Segura
              </span>
            </div>
            <div className="text-center md:text-right border-l md:border-l-0 md:border-t border-zinc-800 pl-4 md:pl-0 md:pt-4 self-stretch">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block font-mono">FILIAIS ARROLANDO</span>
              <strong className="text-xl font-mono text-white block mt-0.5">{storeProfiles.length} Activas</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC SLIP CONTROL PANEL & DETAILED METRICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SLICER PILOT INTERACTION SECTION */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between space-y-5 text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <span className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-orange-500" /> Slicing & Fatiamento
              </span>
              <span className="bg-orange-100 text-orange-700 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full">
                {selectedStoresForSlice.length}/{storeProfiles.length} Seleções
              </span>
            </div>

            <p className="text-[10.5px] text-gray-500 leading-relaxed font-medium">
              Altere os checks abaixo para ligar/desligar filiais específicas e recalcular instantaneamente todas as métricas financeiras integradas e gráficos consolidados do sistema.
            </p>

            {/* Micro Quick Presets */}
            <div className="grid grid-cols-3 gap-1 shadow-2xs rounded-lg p-1 bg-gray-50 border border-gray-150">
              <button
                type="button"
                onClick={selectAllSliceStores}
                className="px-1.5 py-2 hover:bg-white text-gray-800 text-[8.5px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer text-center hover:shadow-xs"
              >
                Ativar 100%
              </button>
              <button
                type="button"
                onClick={selectOnlyCNPJ}
                className="px-1.5 py-2 hover:bg-white text-gray-800 text-[8.5px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer text-center hover:shadow-xs"
              >
                Fatiar CNPJ
              </button>
              <button
                type="button"
                onClick={selectOnlyCPF}
                className="px-1.5 py-2 hover:bg-white text-gray-800 text-[8.5px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer text-center hover:shadow-xs"
              >
                Fatiar CPF
              </button>
            </div>

            {/* Checkbox collection list */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {storeProfiles.map(store => {
                const isSelected = selectedStoresForSlice.includes(store.id);
                const isDocCpf = isCPF(store.cnpj);
                const storeCalculationsData = storeCalculations.find(sc => sc.id === store.id);
                const storeRevenue = storeCalculationsData?.revenue || 0;
                const dotColor = getColorClasses(store.color || "orange").badge;

                return (
                  <div
                    key={store.id}
                    onClick={() => toggleSliceStore(store.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between select-none hover:translate-x-1 hover:shadow-xs",
                      isSelected 
                        ? "border-orange-200 bg-orange-50/40" 
                        : "border-gray-150 bg-gray-50 hover:bg-gray-100/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-5.5 h-5.5 rounded-lg flex items-center justify-center border-2 transition-all duration-150 shrink-0",
                        isSelected 
                          ? "bg-orange-500 border-orange-500 text-white shadow-xs" 
                          : "border-gray-300 bg-white"
                      )}>
                        {isSelected && <Check size={12} strokeWidth={4} />}
                      </div>
                      
                      <div className="text-left leading-tight">
                        <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", dotColor)} />
                          {store.companyName}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 block mt-1">
                          {isDocCpf ? "CPF: " + formatCPF(store.cnpj) : "CNPJ: " + formatCNPJ(store.cnpj)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono font-black text-zinc-800 block">
                        R$ {storeRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[8.5px] text-zinc-400 block leading-none mt-0.5">
                        DAS {store.taxRate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 p-3.5 rounded-2xl text-[10.5px] leading-relaxed text-orange-900/95 font-medium">
            💡 <strong>Slicing Multipessoal:</strong> O faturamento fatiado em CPFs isentos de regimes comerciais robustos permite auditar custos acessórios sem ferir a zona primária da empresa Matriz.
          </div>
        </div>

        {/* METRICS PRESENTATION BOX */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <div className="bg-zinc-950 text-white p-6 rounded-3xl border border-zinc-800 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/5 blur-2xl rounded-full pointer-events-none" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-zinc-800">
                <div>
                  <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                    Estatística do Balancete Consolidado Sliced
                  </h3>
                  <p className="text-[9.5px] text-zinc-500 mt-0.5 uppercase font-mono tracking-widest font-black">
                    Resultados integrados matemáticos e fiscais
                  </p>
                </div>
                <div className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-[9px] font-mono font-black border border-orange-500/20 uppercase tracking-widest">
                  {selectedStoresForSlice.length} lojas fatiadas
                </div>
              </div>

              {/* 4 Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* 1. Vendas */}
                <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block font-mono">Receita Sliced</span>
                  <strong className="text-base md:text-lg font-mono text-white block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                    R$ {totals.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="text-[8.5px] font-mono text-zinc-400 block mt-2">
                    {totals.transactionsCount} Lançamentos ativos
                  </span>
                </div>

                {/* 2. Custo */}
                <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block font-mono">CMV / Custos</span>
                  <strong className="text-base md:text-lg font-mono text-orange-400 block mt-1">
                    R$ {totals.costOfGoods.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="text-[8.5px] font-mono text-zinc-400 block mt-2">
                    CMV Médio: {totals.revenue > 0 ? ((totals.costOfGoods / totals.revenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>

                {/* 3. Tributos */}
                <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block font-mono">DAS Tributos</span>
                  <strong className="text-base md:text-lg font-mono text-amber-300 block mt-1">
                    R$ {totals.taxes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="text-[8.5px] font-mono text-zinc-400 block mt-2 font-bold">
                    Alíquota Média: {totals.revenue > 0 ? ((totals.taxes / totals.revenue) * 100).toFixed(2) : 0}%
                  </span>
                </div>

                {/* 4. EBITDA */}
                <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block font-mono">Ebitda Lojas</span>
                  <strong className={cn(
                    "text-base md:text-lg font-mono block mt-1",
                    totals.ebitda >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    R$ {totals.ebitda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="text-[8.5px] font-mono text-zinc-400 block mt-2">
                    Margem Líquida: {totals.netMarginPercent.toFixed(1)}%
                  </span>
                </div>

              </div>
            </div>

            {/* Visual stacked metric bar */}
            <div className="mt-6 pt-4 border-t border-zinc-850">
              <span className="text-[9.5px] uppercase font-mono font-bold text-zinc-450 block mb-2">Composição Tributária e de Custos Consolidada do Faturamento</span>
              <div className="w-full h-3.5 bg-zinc-900 rounded-full overflow-hidden flex ring-2 ring-zinc-800">
                <div 
                  style={{ width: `${totals.revenue > 0 ? Math.max(0, (totals.ebitda / totals.revenue) * 100) : 0}%` }} 
                  className="bg-emerald-400 h-full transition-all duration-500" 
                  title="Lucro EBITDA"
                />
                <div 
                  style={{ width: `${totals.revenue > 0 ? (totals.costOfGoods / totals.revenue) * 100 : 0}%` }} 
                  className="bg-orange-500 h-full transition-all duration-500" 
                  title="Custos (CMV)"
                />
                <div 
                  style={{ width: `${totals.revenue > 0 ? (totals.opex / totals.revenue) * 100 : 0}%` }} 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  title="Despesas Operacionais"
                />
                <div 
                  style={{ width: `${totals.revenue > 0 ? (totals.taxes / totals.revenue) * 100 : 0}%` }} 
                  className="bg-amber-300 h-full transition-all duration-500" 
                  title="Imposto DAS"
                />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2 leading-none text-[8.5px] font-mono tracking-wider text-zinc-400 uppercase">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/> Sobras: {totals.revenue > 0 ? ((totals.ebitda / totals.revenue) * 100).toFixed(1) : 0}%</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"/> CMV: {totals.revenue > 0 ? ((totals.costOfGoods / totals.revenue) * 100).toFixed(1) : 0}%</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"/> OPEX/Administrativo: {totals.revenue > 0 ? ((totals.opex / totals.revenue) * 100).toFixed(1) : 0}%</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-300"/> DAS Tributário: {totals.revenue > 0 ? ((totals.taxes / totals.revenue) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. granulardetail TABLE AND FORMS / DISCRIMINATED PROFILES ("bem discriminado") */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-150 shadow-sm space-y-6 text-left">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2 text-gray-900 uppercase italic font-sans tracking-tight">
              📂 Perfis Discriminados de Caixas & CNPJs/CPFs
            </h3>
            <p className="text-[10px] text-gray-450 uppercase font-black tracking-widest mt-1 font-mono">
              Gestão Cadastral Avançada, Contratos Sociais, Inscrições e Representações Fiscais Integradas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por sócio, IE, nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8.5 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400 w-52 font-semibold transition-all shadow-2xs"
              />
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowAddForm(!showAddForm);
              }}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-black text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              {showAddForm ? <X size={14} /> : <Plus size={14} />}
              {showAddForm ? "Fechar Painel" : "Cadastrar Nova Filial"}
            </button>
          </div>
        </div>

        {/* COMPREHENSIVE DETAILED FORM */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleCreateStoreSubmit} className="bg-zinc-50 border border-gray-250/20 p-6 rounded-2xl space-y-6 mb-3 shadow-inner">
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1.5 font-mono">
                  <Building2 size={13} /> ADICIONAR FILIAL / REPRESENTANTE AO CONSOLIDADO CORPORATIVO
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Store Name */}
                  <div>
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      Nome Fantasia (Ref) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sorveteria Brooklin (Loja 4)"
                      value={newStoreForm.companyName}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, companyName: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    />
                  </div>

                  {/* Document selector/validate */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[9.5px] font-black text-gray-500 uppercase">
                        Documento Tributário *
                      </label>
                      <div className="flex gap-1 bg-gray-200 p-0.5 rounded-md">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setNewStoreForm({ ...newStoreForm, documentType: "cnpj", cnpj: "" });
                            setNewCnpjError("");
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer",
                            newStoreForm.documentType === "cnpj" ? "bg-zinc-950 text-white shadow-xs" : "text-gray-500"
                          )}
                        >
                          CNPJ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setNewStoreForm({ ...newStoreForm, documentType: "cpf", cnpj: "" });
                            setNewCnpjError("");
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer",
                            newStoreForm.documentType === "cpf" ? "bg-zinc-950 text-white shadow-xs" : "text-gray-500"
                          )}
                        >
                          CPF
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder={newStoreForm.documentType === "cnpj" ? "00.000.000/0001-00" : "000.000.000-00"}
                      value={newStoreForm.cnpj}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const formatted = newStoreForm.documentType === "cnpj" ? formatCNPJ(raw) : formatCPF(raw);
                        setNewStoreForm({ ...newStoreForm, cnpj: formatted });

                        if (formatted.trim() === "") {
                          setNewCnpjError("");
                        } else {
                          const isValid = newStoreForm.documentType === "cnpj" ? isValidCNPJ(formatted) : isValidCPF(formatted);
                          if (!isValid) {
                            setNewCnpjError(`Dígitos do ${newStoreForm.documentType.toUpperCase()} incorretos.`);
                          } else {
                            setNewCnpjError("");
                          }
                        }
                      }}
                      className={cn(
                        "w-full text-xs font-mono font-semibold border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 bg-white text-gray-800",
                        newCnpjError ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-orange-500"
                      )}
                    />
                    {newCnpjError && (
                      <p className="text-[9px] text-red-500 mt-1 font-bold">{newCnpjError}</p>
                    )}
                  </div>

                  {/* Business Segment */}
                  <div>
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      Segmento Operacional
                    </label>
                    <select
                      value={newStoreForm.businessSegment}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, businessSegment: e.target.value })}
                      className="w-full text-xs font-bold border border-gray-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 cursor-pointer"
                    >
                      <option value="commerce">Comércio / Varejo</option>
                      <option value="food">Alimentação / Gastronomia</option>
                      <option value="services">Prestação de Serviços</option>
                      <option value="tech">Tecnologia, SaaS e Agência</option>
                      <option value="other">Outros Segmentos</option>
                    </select>
                  </div>

                  {/* Razão Social (Legal Name) - Discriminado */}
                  <div>
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      Razão Social / Nome de Registro Legal
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Brooklin Shake Alimentos LTDA"
                      value={newStoreForm.razaoSocial}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, razaoSocial: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    />
                  </div>

                  {/* Sócio Responsável */}
                  <div>
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      Diretor / Sócio Responsável Principal
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do Administrador da Filial"
                      value={newStoreForm.socioResponsavel}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, socioResponsavel: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    />
                  </div>

                  {/* Inscrição Estadual (IE) */}
                  <div>
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      Inscrição Estadual (IE)
                    </label>
                    <input
                      type="text"
                      placeholder="Inscrição Fazendária (opcional)"
                      value={newStoreForm.inscricaoEstadual}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, inscricaoEstadual: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    />
                  </div>

                  {/* Inscrição Municipal (IM) */}
                  <div>
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      Inscrição Municipal (IM)
                    </label>
                    <input
                      type="text"
                      placeholder="Cadastro na Prefeitura (opcional)"
                      value={newStoreForm.inscricaoMunicipal}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, inscricaoMunicipal: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    />
                  </div>

                  {/* Tax Rate (DAS) */}
                  <div>
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      Tributação Estimada DAS (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newStoreForm.taxRate}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-semibold border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    />
                  </div>

                  {/* Card Fee Rate */}
                  <div>
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      Taxa de Maquininha (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newStoreForm.cardFeeRate}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, cardFeeRate: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-semibold border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    />
                  </div>

                  {/* Visual Color identification */}
                  <div>
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      Cor de Identidade Visual
                    </label>
                    <select
                      value={newStoreForm.color}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, color: e.target.value })}
                      className="w-full text-xs font-bold border border-gray-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 cursor-pointer"
                    >
                      <option value="orange">Laranja Corporativo</option>
                      <option value="blue">Azul Industrial</option>
                      <option value="emerald">Verde Esmeralda</option>
                      <option value="purple">Roxo Editorial</option>
                      <option value="rose">Rosa Impacto</option>
                    </select>
                  </div>

                  {/* Custom URL */}
                  <div className="md:col-span-2">
                    <label className="block text-[9.5px] font-black text-gray-500 uppercase mb-1.5">
                      URL da Filial ou Ponto Geográfico (opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="Ex: https://google.com/maps/... ou https://sorvetesbrooklin.com.br"
                      value={newStoreForm.customUrl}
                      onChange={(e) => setNewStoreForm({ ...newStoreForm, customUrl: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#141414] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    Gravar Filial no Banco
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LIST TABLE PRESENTATION */}
        <div className="overflow-x-auto rounded-2xl border border-gray-150 shadow-2xs">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[9px] font-black tracking-widest border-b border-gray-150">
                <th className="py-4 px-4 text-center w-10">Ativo</th>
                <th className="py-4 px-4 text-left">Filial / Nome de Fachada</th>
                <th className="py-4 px-4 text-left">Sócio Adm</th>
                <th className="py-4 px-4 text-left">Segmento</th>
                <th className="py-4 px-4 text-right">Faturamento Sliced</th>
                <th className="py-4 px-4 text-right">DAS (%)</th>
                <th className="py-4 px-4 text-right">EBITDA Real</th>
                <th className="py-4 px-4 text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStoreCalcs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 font-bold">
                    Nenhuma filial correspondente encontrada para os filtros ativos.
                  </td>
                </tr>
              ) : (
                filteredStoreCalcs.map(calc => {
                  const isChecked = selectedStoresForSlice.includes(calc.id);
                  const isEditing = editingStoreId === calc.id;
                  const isExpanded = expandedStoreIds.includes(calc.id);
                  const colorMatch = getColorClasses(calc.color || "orange");
                  const isDocCpf = isCPF(calc.cnpj);

                  // Calculate revenue share percentage
                  const sharePercentage = totals.revenue > 0 ? (calc.revenue / totals.revenue) * 100 : 0;

                  if (isEditing) {
                    return (
                      <tr key={calc.id} className="bg-orange-50/20 border-b border-gray-200 animate-in fade-in duration-200">
                        <td colSpan={8} className="p-6">
                          <form onSubmit={(e) => handleEditStoreSubmit(e, calc.id)} className="space-y-4">
                            <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1.5 font-mono">
                              <Edit3 size={13} /> EDITANDO REGISTROS DE FILIAL: {calc.companyName}
                            </span>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Nome Fantasia */}
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">
                                  Nome Fantasia
                                </label>
                                <input
                                  type="text"
                                  value={editStoreForm.companyName}
                                  onChange={(e) => setEditStoreForm({ ...editStoreForm, companyName: e.target.value })}
                                  className="w-full text-xs font-semibold border border-gray-300 bg-white rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                                />
                              </div>

                              {/* CNPJ / CPF Toggle */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[9px] font-black text-gray-500 uppercase">
                                    Documento ({editStoreForm.documentType.toUpperCase()})
                                  </label>
                                  <div className="flex gap-1 bg-gray-200 p-0.5 rounded">
                                    <button
                                      type="button"
                                      onClick={() => setEditStoreForm({ ...editStoreForm, documentType: "cnpj", cnpj: "" })}
                                      className={cn(
                                        "px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase transition-all cursor-pointer",
                                        editStoreForm.documentType === "cnpj" ? "bg-zinc-950 text-white shadow-2xs" : "text-gray-500"
                                      )}
                                    >
                                      CNPJ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditStoreForm({ ...editStoreForm, documentType: "cpf", cnpj: "" })}
                                      className={cn(
                                        "px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase transition-all cursor-pointer",
                                        editStoreForm.documentType === "cpf" ? "bg-zinc-950 text-white shadow-2xs" : "text-gray-500"
                                      )}
                                    >
                                      CPF
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  value={editStoreForm.cnpj}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const formatted = editStoreForm.documentType === "cnpj" ? formatCNPJ(raw) : formatCPF(raw);
                                    setEditStoreForm({ ...editStoreForm, cnpj: formatted });

                                    if (formatted.trim() === "") {
                                      setEditCnpjError("");
                                    } else {
                                      const isValid = editStoreForm.documentType === "cnpj" ? isValidCNPJ(formatted) : isValidCPF(formatted);
                                      if (!isValid) {
                                        setEditCnpjError(`Dígitos verificadores do ${editStoreForm.documentType.toUpperCase()} incorretos.`);
                                      } else {
                                        setEditCnpjError("");
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full text-xs font-mono font-semibold border rounded-lg px-2.5 py-2 outline-none focus:ring-2 bg-white text-gray-800",
                                    editCnpjError ? "border-red-350 focus:ring-red-500" : "border-gray-300 focus:ring-orange-500"
                                  )}
                                />
                              </div>

                              {/* Business Segment */}
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">
                                  Segmento Operacional
                                </label>
                                <select
                                  value={editStoreForm.businessSegment}
                                  onChange={(e) => setEditStoreForm({ ...editStoreForm, businessSegment: e.target.value })}
                                  className="w-full text-xs font-bold border border-gray-300 bg-white rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 cursor-pointer"
                                >
                                  <option value="commerce">Comércio / Varejo</option>
                                  <option value="food">Alimentação / Gastronomia</option>
                                  <option value="services">Prestação de Serviços</option>
                                  <option value="tech">Tecnologia, SaaS e Agência</option>
                                  <option value="other">Outros Segmentos</option>
                                </select>
                              </div>

                              {/* Razão Social */}
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">
                                  Razão Social / Nome de Registro
                                </label>
                                <input
                                  type="text"
                                  placeholder="Razão Social"
                                  value={editStoreForm.razaoSocial}
                                  onChange={(e) => setEditStoreForm({ ...editStoreForm, razaoSocial: e.target.value })}
                                  className="w-full text-xs font-semibold border border-gray-300 bg-white rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                                />
                              </div>

                              {/* Sócio Responsável */}
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">
                                  Sócio Administrador Responsável
                                </label>
                                <input
                                  type="text"
                                  placeholder="Sócio Adm"
                                  value={editStoreForm.socioResponsavel}
                                  onChange={(e) => setEditStoreForm({ ...editStoreForm, socioResponsavel: e.target.value })}
                                  className="w-full text-xs font-semibold border border-gray-300 bg-white rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                                />
                              </div>

                              {/* Inscrição Estadual */}
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">
                                  Inscrição Estadual (IE)
                                </label>
                                <input
                                  type="text"
                                  value={editStoreForm.inscricaoEstadual}
                                  onChange={(e) => setEditStoreForm({ ...editStoreForm, inscricaoEstadual: e.target.value })}
                                  className="w-full text-xs font-semibold border border-gray-300 bg-white rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                                />
                              </div>

                              {/* Inscrição Municipal */}
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">
                                  Inscrição Municipal (IM)
                                </label>
                                <input
                                  type="text"
                                  value={editStoreForm.inscricaoMunicipal}
                                  onChange={(e) => setEditStoreForm({ ...editStoreForm, inscricaoMunicipal: e.target.value })}
                                  className="w-full text-xs font-semibold border border-gray-300 bg-white rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                                />
                              </div>

                              {/* Alíquota DAS */}
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">
                                  DAS Tributação (%)
                                </label>
                                <input
                                  type="number"
                                  value={editStoreForm.taxRate}
                                  onChange={(e) => setEditStoreForm({ ...editStoreForm, taxRate: parseFloat(e.target.value) || 0 })}
                                  className="w-full text-xs font-semibold border border-gray-300 bg-white rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                                />
                              </div>

                              {/* Card fee */}
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">
                                  Taxa Maquininha (%)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editStoreForm.cardFeeRate}
                                  onChange={(e) => setEditStoreForm({ ...editStoreForm, cardFeeRate: parseFloat(e.target.value) || 0 })}
                                  className="w-full text-xs font-semibold border border-gray-300 bg-white rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-150">
                              <button
                                type="button"
                                onClick={() => setEditingStoreId(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer font-sans"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs font-sans"
                              >
                                Gravar Informações
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <React.Fragment key={calc.id}>
                      <tr 
                        className={cn(
                          "border-b border-gray-150 hover:bg-zinc-50/60 transition-all duration-150 text-gray-700",
                          isChecked ? "" : "bg-zinc-100/50 text-zinc-400"
                        )}
                      >
                        {/* Checkbox Slicing */}
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSliceStore(calc.id)}
                            className={cn(
                              "w-5 h-5 mx-auto rounded flex items-center justify-center border-2 transition-all cursor-pointer shrink-0",
                              isChecked 
                                ? "bg-orange-500 border-orange-500 text-white shadow-2xs" 
                                : "border-gray-350 bg-white text-transparent"
                            )}
                          >
                            {isChecked && <Check size={11} strokeWidth={4} />}
                          </button>
                        </td>

                        {/* Fantasia */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", colorMatch.badge)} />
                            <div className="text-left">
                              <span className="font-extrabold text-gray-900 block leading-tight">
                                {calc.companyName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 text-[9.5px] font-mono font-bold leading-none text-zinc-400">
                                {isDocCpf ? (
                                  <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[7px] font-black px-1 rounded uppercase tracking-wide">Parente / CPF</span>
                                ) : (
                                  <span className="bg-orange-50 text-orange-700 border border-orange-100 text-[7px] font-black px-1 rounded uppercase tracking-wide">Filial / CNPJ</span>
                                )}
                                <span>{calc.cnpj ? (isDocCpf ? formatCPF(calc.cnpj) : formatCNPJ(calc.cnpj)) : "ISENTO / S.D"}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Socio Administrador */}
                        <td className="py-4 px-4 text-left font-semibold text-gray-700">
                          {calc.socioResponsavel ? (
                            <span className="flex items-center gap-1 font-semibold">
                              <User size={12} className="text-zinc-400 shrink-0" />
                              {calc.socioResponsavel}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">Não discriminado</span>
                          )}
                        </td>

                        {/* Segment label */}
                        <td className="py-4 px-4 text-left">
                          <span className="bg-zinc-150/80 text-zinc-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                            {segmentLabels[calc.businessSegment] || "Outros"}
                          </span>
                        </td>

                        {/* Faturamento */}
                        <td className="py-4 px-4 text-right font-mono font-black text-gray-900">
                          R$ {calc.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>

                        {/* DAS Aliquota */}
                        <td className="py-4 px-4 text-right font-mono font-extrabold text-zinc-700">
                          {calc.taxRate}%
                        </td>

                        {/* EBITDA */}
                        <td className="py-4 px-4 text-right">
                          <span className={cn(
                            "font-mono font-black",
                            calc.ebitda >= 0 ? "text-emerald-600" : "text-rose-500"
                          )}>
                            R$ {calc.ebitda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="block text-[8px] font-mono text-zinc-400 leading-none mt-1">
                            Margem: {calc.margin.toFixed(1)}%
                          </span>
                        </td>

                        {/* Actions & expander */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Expand toggle */}
                            <button
                              type="button"
                              onClick={() => toggleExpandStore(calc.id)}
                              className={cn(
                                "p-1 px-1.5 rounded-lg transition-colors cursor-pointer text-zinc-500 hover:text-black hover:bg-zinc-100",
                                isExpanded ? "bg-zinc-100 text-black" : ""
                              )}
                              title={isExpanded ? "Ocultar detalhes legais" : "Ver detalhes legais discriminados"}
                            >
                              {isExpanded ? <ChevronUp size={13.5} /> : <ChevronDown size={13.5} />}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => startEditStore(calc)}
                              className="p-1 px-1.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Editar parâmetros"
                            >
                              <Edit3 size={13.5} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStore(calc.id, calc.companyName)}
                              className="p-1 px-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Excluir filial"
                            >
                              <Trash2 size={13.5} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDABLE ROW SHOWING DEEP PARAMETERS ("bem discriminado") */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr className="bg-zinc-50/50">
                            <td colSpan={8} className="p-0 border-b border-gray-150">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-left border-l-4 border-orange-500 bg-white">
                                  
                                  {/* Legal description */}
                                  <div className="md:col-span-2 space-y-2.5">
                                    <span className="text-[9px] font-black uppercase font-mono tracking-widest text-[#f97316]">
                                      1. Informações de Registro Societário & Fiscal
                                    </span>
                                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                                      <div className="p-2 border border-gray-100 rounded-xl bg-zinc-50">
                                        <span className="text-[8px] font-black text-zinc-400 block uppercase">Razão Social de Registro</span>
                                        <span className="text-gray-900 mt-1 block font-extrabold max-w-full truncate">{calc.razaoSocial || "Não cadastrada"}</span>
                                      </div>
                                      <div className="p-2 border border-gray-100 rounded-xl bg-zinc-50">
                                        <span className="text-[8px] font-black text-zinc-400 block uppercase">Administrador / Diretor</span>
                                        <span className="text-gray-900 mt-1 block font-extrabold">{calc.socioResponsavel || "Não cadastrado"}</span>
                                      </div>
                                      <div className="p-2 border border-gray-100 rounded-xl bg-zinc-50">
                                        <span className="text-[8px] font-black text-zinc-400 block uppercase">Inscrição Estadual (IE)</span>
                                        <span className="text-gray-900 mt-1 block font-mono font-bold">{calc.inscricaoEstadual || "ISENTO / NÃO CONST"}</span>
                                      </div>
                                      <div className="p-2 border border-gray-100 rounded-xl bg-zinc-50">
                                        <span className="text-[8px] font-black text-zinc-400 block uppercase">Inscrição Municipal (IM)</span>
                                        <span className="text-gray-900 mt-1 block font-mono font-bold">{calc.inscricaoMunicipal || "ISENTO / S.I"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Metric detail */}
                                  <div className="space-y-2.5">
                                    <span className="text-[9px] font-black uppercase font-mono tracking-widest text-zinc-500">
                                      2. Contribuição de Rede
                                    </span>
                                    <div className="p-4 border border-zinc-100 bg-zinc-50 rounded-2xl flex flex-col justify-between h-28">
                                      <div>
                                        <span className="text-[9.5px] font-black uppercase text-zinc-400 tracking-wider">Share de Faturamento</span>
                                        <strong className="text-xl font-mono block text-gray-900 mt-1">
                                          {sharePercentage.toFixed(1)}% do consolidado
                                        </strong>
                                      </div>
                                      
                                      {/* Mini share bar */}
                                      <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden mt-1">
                                        <div style={{ width: `${sharePercentage}%` }} className="bg-[#f97316] h-full" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Fiscal scanner */}
                                  <div className="space-y-2.5">
                                    <span className="text-[9px] font-black uppercase font-mono tracking-widest text-zinc-500">
                                      3. Escâner de Risco Tributário
                                    </span>
                                    
                                    {isDocCpf ? (
                                      <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-2xl flex flex-col justify-between h-28 leading-normal text-[11px] font-semibold text-blue-900">
                                        <div>
                                          <span className="text-[8px] font-black uppercase text-blue-600 block font-mono">TETO COMERCIAL CPF MEI</span>
                                          Limite anual de R$ 81.000 (R$ 6.750/mês). 
                                        </div>
                                        <div className="text-[9.5px] border-t border-blue-200/50 pt-1 mt-1 font-mono">
                                          Atual: R$ {(calc.revenue * 12).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/ano proj.
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-4 border border-orange-200 bg-orange-50/50 rounded-2xl flex flex-col justify-between h-28 leading-normal text-[11px] font-semibold text-orange-900">
                                        <div>
                                          <span className="text-[8px] font-black uppercase text-orange-600 block font-mono">TETO SIMPLES NACIONAL</span>
                                          Limite de R$ 4,8 Milhões/ano consolidado.
                                        </div>
                                        <div className="text-[9.5px] border-t border-orange-200/50 pt-1 mt-1 font-mono">
                                          Faturamento Proj: R$ {(calc.revenue * 12).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/ano.
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>

                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 4. RATEIO SIMULATOR & SIDE-BY-SIDE CHART - MODERN & HIGH-TECH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* SHARED EXPENSE ALLOCATION RATEIO EXPERIMENTAL WIDGET */}
        <div className="bg-[#ffffff] p-6 md:p-8 rounded-[2rem] border border-gray-150 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <div>
                <h3 className="text-sm font-black uppercase text-gray-900 tracking-wider flex items-center gap-1.5">
                  <Scale size={16} className="text-[#f97316]" /> Simulador Slicing Tech de Rateio
                </h3>
                <p className="text-[9.5px] text-zinc-400 uppercase font-bold mt-0.5">
                  Proporção de custos indiretos no Ebitda consolidado
                </p>
              </div>
              <span className="bg-[#141414] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded font-mono">
                MATEMÁTICA PJ
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-500 font-medium">
              Simule a distribuição de uma despesa administrativa comum da holding (como contabilidade, escritórios, consultoria jurídica ou ferramentas cloud) entre as filiais selecionadas para verificar o impacto financeiro real na rentabilidade individual.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[9.5px] font-black text-zinc-450 uppercase mb-1.5">
                  Valor Total a Ratear (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold text-xs">R$</span>
                  <input
                    type="number"
                    placeholder="Ex: 5000"
                    value={sharedCostToAllocate || ""}
                    onChange={(e) => setSharedCostToAllocate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 placeholder-gray-400 w-full font-bold shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] font-black text-zinc-450 uppercase mb-1.5">
                  Metodologia de Divisão
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-0.5 border border-zinc-150 rounded-xl bg-zinc-50">
                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setAllocationMethod("proportional"); }}
                    className={cn(
                      "py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                      allocationMethod === "proportional" ? "bg-[#141414] text-white shadow-2xs" : "text-zinc-500"
                    )}
                  >
                    Faturamento
                  </button>
                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setAllocationMethod("equal"); }}
                    className={cn(
                      "py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                      allocationMethod === "equal" ? "bg-[#141414] text-white shadow-2xs" : "text-zinc-500"
                    )}
                  >
                    Igualitário
                  </button>
                </div>
              </div>
            </div>

            {/* Results distribution */}
            {sharedCostToAllocate > 0 ? (
              <div className="space-y-2 pt-2">
                <span className="text-[8.5px] font-mono font-black uppercase text-zinc-400 block">Distribuição Simulada</span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {allocationBreakdown.map(item => (
                    <div key={item.id} className="p-2.5 border border-zinc-150 bg-zinc-50 rounded-xl flex items-center justify-between text-[11px] font-semibold leading-none">
                      <div className="text-left">
                        <span className="text-gray-900 block font-bold leading-normal">{item.companyName}</span>
                        <span className="text-[8px] font-mono text-zinc-400 block mt-1 uppercase">Alloc: R$ {item.allocatedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "font-mono font-black text-xs block",
                          item.simulatedEbitda >= 0 ? "text-emerald-600" : "text-rose-500"
                        )}>
                          R$ {item.simulatedEbitda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 mt-1 block">Margem: {item.simulatedMargin.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 border border-dashed border-gray-200 rounded-2xl text-center text-zinc-400 text-xs font-semibold bg-zinc-50/50">
                Digite um valor para simular a redistribuição integrada de custos.
              </div>
            )}
          </div>

          <div className="p-3 bg-zinc-900 text-stone-250 rounded-xl text-[10.5px] leading-relaxed font-mono mt-4">
            🛡️ <strong className="text-white">Regulamentação Holding:</strong> O rateio proporcional ao faturamento ("Revenue Method") é a forma homologada pelo CARF / Receita Federal para justificar legalmente repasses de custos de matrizes para filiais (Transfer Pricing).
          </div>
        </div>

        {/* RECHARTS INTEGRATED DEMO GRAPH */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-150 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase text-gray-900 tracking-wider">
              Gráfico Comparativo de Faturamento vs EBITDA por Filial
            </h3>
            <p className="text-[9.5px] text-zinc-400 uppercase font-black tracking-widest mt-0.5">
              Representação side-by-side de vendas e margem EBITDA real de caixas cadastrados.
            </p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {compareChartData.length === 0 ? (
              <div className="text-zinc-400 font-bold text-xs">
                Insira lançamentos ou ative o modo de simulação corporativa para gerar as representações visuais.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9.5, fontWeight: 700, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 9.5, fill: '#64748b' }} stroke="#cbd5e1" />
                  <RechartsTooltip formatter={(val: number) => ["R$ " + val.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), ""]} />
                  <Legend wrapperStyle={{ fontSize: '9.5px', fontWeight: 700 }} />
                  <Bar dataKey="Faturamento (R$)" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Lucro EBITDA (R$)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
