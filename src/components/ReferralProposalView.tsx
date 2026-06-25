import React, { useState, useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { sound } from "../utils/SoundEngine";
import { 
  Users, 
  Send, 
  CheckCircle2, 
  Copy, 
  Check, 
  Trash2, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Cpu, 
  Zap, 
  Share2, 
  HelpCircle, 
  Briefcase, 
  DollarSign, 
  UserCheck, 
  Gift,
  Building2,
  Phone,
  Mail,
  Download,
  Workflow,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Referral {
  id: string;
  name: string;
  companyName: string;
  role: string;
  contact: string;
  status: "Pendente" | "Em Contato" | "Ativado";
  date: string;
}

export default function ReferralProposalView() {
  const { profile, showToast } = useFinance();

  // Load existing referrals from LocalStorage or seed defaults
  const [referrals, setReferrals] = useState<Referral[]>(() => {
    try {
      const saved = localStorage.getItem("dafne_pj_referrals_v2");
      if (saved) return JSON.parse(saved);

      const oldSaved = localStorage.getItem("dafne_pj_referrals");
      if (oldSaved) {
        const oldRefs = JSON.parse(oldSaved);
        if (oldRefs.length > 3) return oldRefs;
      }
    } catch (e) {
      console.error(e);
    }
    // Default mock connections to give immediate context
    // 7 active partners yielding a total of R$ 245.000 in fomento (7 * R$ 35.000 = R$ 245.000)
    return [
      {
        id: "ref-pj-1",
        name: "Carlos Eduardo Silveira",
        companyName: "Silveira & Associados Logística",
        role: "Diretor Financeiro (CFO)",
        contact: "(11) 98765-4321",
        status: "Ativado",
        date: "2026-05-12"
      },
      {
        id: "ref-pj-2",
        name: "Mariana Vasconcellos",
        companyName: "Biotech Pharma Ltda",
        role: "Controllership Manager",
        contact: "mariana@biotechpharma.com.br",
        status: "Ativado",
        date: "2026-05-28"
      },
      {
        id: "ref-pj-3",
        name: "Roberto Mendes",
        companyName: "Mendes Alimentos S/A",
        role: "Sócio Proprietário",
        contact: "(31) 99321-7788",
        status: "Ativado",
        date: "2026-06-01"
      },
      {
        id: "ref-pj-4",
        name: "Clara Gurgel",
        companyName: "Gouvêa & Gurgel Distribuidora",
        role: "Sócio Proprietário",
        contact: "(81) 98844-3322",
        status: "Ativado",
        date: "2026-06-02"
      },
      {
        id: "ref-pj-5",
        name: "Felipe Andrade",
        companyName: "Andrade Metalúrgica S/A",
        role: "Diretor de Operações",
        contact: "felipe@andrademetalurgica.com",
        status: "Ativado",
        date: "2026-06-04"
      },
      {
        id: "ref-pj-6",
        name: "Patrícia Souza",
        companyName: "Rede Sorriso Odontologia",
        role: "Sócio Proprietário",
        contact: "(11) 97755-1122",
        status: "Ativado",
        date: "2026-06-06"
      },
      {
        id: "ref-pj-7",
        name: "Guilherme Santos",
        companyName: "Santos & Ramos Hortifruti",
        role: "Controller / Gerente",
        contact: "(21) 98122-3344",
        status: "Ativado",
        date: "2026-06-08"
      },
      {
        id: "ref-pj-8",
        name: "Ricardo Fonseca",
        companyName: "Prisma Tech Soluções",
        role: "Sócio Proprietário",
        contact: "ricardo@prismatech.com",
        status: "Em Contato",
        date: "2026-06-09"
      },
      {
        id: "ref-pj-9",
        name: "Sandra Pires",
        companyName: "Pires & Dias Supermercados",
        role: "Diretor Financeiro (CFO)",
        contact: "(19) 3254-8899",
        status: "Pendente",
        date: "2026-06-11"
      }
    ];
  });

  // Form states
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formRole, setFormRole] = useState("Sócio Proprietário");
  const [formContact, setFormContact] = useState("");
  const [formSector, setFormSector] = useState("Varejo & Comércio");

  // General tab states: "referral-program" or "commercial-proposal"
  const [activeTab, setActiveTab] = useState<"referral" | "proposal" | "simulator">("referral");
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // Discount / Technology simulator states
  const [simulatorReferralCount, setSimulatorReferralCount] = useState<number>(3);
  const [activationProbability, setActivationProbability] = useState<number>(75);

  // Save utility
  const saveReferrals = (updated: Referral[]) => {
    setReferrals(updated);
    localStorage.setItem("dafne_pj_referrals_v2", JSON.stringify(updated));
  };

  // Add Referral
  const handleAddReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCompany.trim() || !formContact.trim()) {
      showToast("Preencha todos os campos obrigatórios para registrar a indicação.", "warning");
      return;
    }

    sound.playClick();

    const newRef: Referral = {
      id: `ref-pj-${Date.now()}`,
      name: formName.trim(),
      companyName: formCompany.trim(),
      role: formRole,
      contact: formContact.trim(),
      status: "Pendente",
      date: new Date().toISOString().split("T")[0]
    };

    const updated = [newRef, ...referrals];
    saveReferrals(updated);
    showToast(`Indicação de ${formName} enviada para nosso time comercial com sucesso!`, "success");

    // Clear form
    setFormName("");
    setFormCompany("");
    setFormContact("");
  };

  // Delete referral
  const handleDeleteReferral = (id: string) => {
    sound.playClick();
    const updated = referrals.filter(r => r.id !== id);
    saveReferrals(updated);
    showToast("Indicação removida.", "info");
  };

  // Compute metrics
  const stats = useMemo(() => {
    const total = referrals.length;
    const activated = referrals.filter(r => r.status === "Ativado").length;
    const pendingAndContact = referrals.filter(r => r.status !== "Ativado").length;

    // Discount Calculation: 10% per activated referral up to 100% (exempt status!)
    const discountPercent = Math.min(100, activated * 15); // Let's make it 15% per friend to be super lucrative!

    return { total, activated, pendingAndContact, discountPercent };
  }, [referrals]);

  // Copy B2B Invitation template to clipboard
  const handleCopyInvite = (text: string, id: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    showToast("Convite personalizado copiado para a Área de Transferência!", "success");
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  // Simulated conversion data for Reinvesting in AI Technology
  // Shows how aggregate community scaling reduces relative cost per user while exponentially compounding system accuracy and models
  const scalingData = useMemo(() => {
    const data = [];
    for (let index = 1; index <= 10; index++) {
      // Per user compute overhead drops as users scale up (dilution of static premium infrastructure)
      const baseCost = Math.round(150 / (1 + index * 0.45));
      // Accuracy / speed increases due to community deep models fine-tuning
      const aiAccuracy = Math.round(75 + (index * 2.3 > 24 ? 24 : index * 2.3));
      // Reinvested converted funds in Technology (Cumulative, R$)
      const reinvestedTechFunds = index * 450;

      data.push({
        users: `${index} Empresas`,
        overhead: baseCost,
        accuracy: aiAccuracy,
        reinvestment: reinvestedTechFunds
      });
    }
    return data;
  }, []);

  const invitationTemplate = `Olá! Estou utilizando a Dafne I.A. (sistema avançado de gestão financeira e controladoria para PJ) e ela revolucionou nossa análise de DRE, precificação de CMV e controle de fluxo de caixa. 

Ao unirmos forças e expandirmos nossa rede de parceiros empresariais PJ, geramos mais tração e volume para atrair grandes rodadas de investimento de capital. Todo esse aporte de fomento é direcionado integralmente ao desenvolvimento de novas tecnologias e algoritmos de inteligência artificial de ponta no app!

Se quiser se conectar a este ecossistema inovador, registre-se no link abaixo ou me avise para nosso time de implantação integrado entrar em contato direto com você:
\${window.location.origin}`;

  return (
    <div id="referrals-view-container" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-800">
      
      {/* High-Tech Dashboard Title Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-left">
        {/* Futuristic background grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-orange-500/20 via-transparent to-transparent blur-[80px] pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 text-[9.5px] bg-gradient-to-r from-orange-500 to-amber-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            Dafne Aliança PJ Engine v4.12 // Conectado
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Users className="text-orange-500" size={26} />
            ECOSSISTEMA & ALIANÇA DE FOMENTO TECNOLÓGICO
          </h2>
          <p className="text-xs text-slate-400 font-medium max-w-3xl leading-relaxed">
            Expanda o cérebro do sistema indicando novas corporações. Cada ativação PJ injeta recursos de fomento para processamento sob demanda, eliminando a concorrência computacional e expanding a inteligência preditiva para todos os membros.
          </p>
        </div>

        {/* Tab navigation headers in cybernetic glass look */}
        <div className="flex bg-slate-800/85 p-1.5 rounded-2xl border border-slate-700/60 self-stretch xl:self-auto gap-1 relative z-10 shadow-inner">
          <button
            onClick={() => { sound.playClick(); setActiveTab("referral"); }}
            className={cn(
              "flex-1 xl:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              activeTab === "referral"
                ? "bg-gradient-to-r from-orange-500 to-amber-650 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-750"
            )}
          >
            <Activity size={13} className={cn(activeTab === "referral" && "animate-pulse")} />
            Painel da Aliança
          </button>
          
          <button
            onClick={() => { sound.playClick(); setActiveTab("proposal"); }}
            className={cn(
              "flex-1 xl:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              activeTab === "proposal"
                ? "bg-gradient-to-r from-orange-500 to-amber-650 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-750"
            )}
          >
            <Briefcase size={13} />
            A Proposta B2B
          </button>

          <button
            onClick={() => { sound.playClick(); setActiveTab("simulator"); }}
            className={cn(
              "flex-1 xl:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              activeTab === "simulator"
                ? "bg-gradient-to-r from-orange-500 to-amber-650 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-750"
            )}
          >
            <Cpu size={13} />
            Simulador de Impacto
          </button>
        </div>
      </div>

      {/* Cybernetic Connecting Pipeline Flow (Setas e Integração Visual) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl text-left relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-10" />
        
        {/* Floating title */}
        <div className="flex justify-between items-center mb-5 relative z-10">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Fluxograma Operacional de Tração & Fomento PJ
          </span>
          <span className="text-[9px] text-slate-400 font-mono bg-slate-800 border border-slate-705 px-2.5 py-0.5 rounded uppercase font-semibold">
            Sincronização Ativa
          </span>
        </div>

        {/* The Horizontal Pipeline with arrows */}
        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-2 md:gap-1 relative z-10">
          
          {/* Card 01 - Total Indicações */}
          <div className="col-span-1 bg-slate-850 border border-slate-800 hover:border-slate-750 p-4.5 rounded-[2rem] transition-all hover:scale-[1.01] shadow-md relative group flex flex-col justify-between h-[120px] text-left">
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-bold text-indigo-400 font-mono tracking-widest uppercase">NÓ_01 // CADASTROS</span>
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Users size={14} />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Total Indicado</span>
              <span className="text-lg font-black tracking-tight text-white">
                {stats.total} {stats.total === 1 ? "Empresa" : "Empresas"}
              </span>
            </div>
          </div>

          {/* Seta 1 */}
          <div className="flex justify-center items-center py-1 md:py-0">
            <div className="hidden md:flex flex-col items-center justify-center">
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="text-orange-500 font-black text-xl leading-none select-none"
              >
                ➔
              </motion.div>
              <span className="text-[7px] text-orange-400 font-mono font-black mt-1 uppercase tracking-widest">VALIDAR</span>
            </div>
            <div className="flex md:hidden items-center justify-center">
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="text-orange-500 font-black text-lg select-none"
              >
                ⬇
              </motion.div>
            </div>
          </div>

          {/* Card 02 - Parceiros Ativados */}
          <div className="col-span-1 bg-slate-850 border border-emerald-900/30 hover:border-emerald-805 p-4.5 rounded-[2rem] transition-all hover:scale-[1.01] shadow-md relative group flex flex-col justify-between h-[120px] text-left">
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-bold text-emerald-400 font-mono tracking-widest uppercase">NÓ_02 // ATIVAÇÃO</span>
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg animate-pulse">
                <UserCheck size={14} />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Parceiros Ativos</span>
              <span className="text-lg font-black tracking-tight text-emerald-400 flex items-center gap-1.5">
                {stats.activated} {stats.activated === 1 ? "Ativo" : "Ativos"}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </span>
            </div>
          </div>

          {/* Seta 2 */}
          <div className="flex justify-center items-center py-1 md:py-0">
            <div className="hidden md:flex flex-col items-center justify-center">
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.4 }}
                className="text-orange-500 font-black text-xl leading-none select-none"
              >
                ➔
              </motion.div>
              <span className="text-[7px] text-orange-400 font-mono font-black mt-1 uppercase tracking-widest">FINANCIAR</span>
            </div>
            <div className="flex md:hidden items-center justify-center">
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.4 }}
                className="text-orange-500 font-black text-lg select-none"
              >
                ⬇
              </motion.div>
            </div>
          </div>

          {/* Card 03 - Fomento Captado */}
          <div className="col-span-1 bg-gradient-to-br from-slate-850 to-slate-900 border-2 border-orange-500/40 hover:border-orange-500/85 p-4.5 rounded-[2rem] transition-all hover:scale-[1.01] shadow-lg relative group flex flex-col justify-between h-[120px] text-left">
            {/* Glowing background bubble */}
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-orange-500/10 blur-xl rounded-full" />
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-bold text-orange-400 font-mono tracking-widest uppercase">NÓ_03 // CAPTAÇÃO</span>
              <div className="p-1.5 bg-orange-500/15 text-orange-400 rounded-lg animate-pulse">
                <Sparkles size={14} />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-300 block font-semibold">Fomento Coletivo</span>
              <span className="text-[15px] font-black italic tracking-wide font-sans text-orange-500 drop-shadow-[0_2px_12px_rgba(249,115,22,0.2)] whitespace-nowrap">
                R$ {(stats.activated * 35000).toLocaleString("pt-BR")},00
              </span>
            </div>
          </div>

          {/* Seta 3 */}
          <div className="flex justify-center items-center py-1 md:py-0">
            <div className="hidden md:flex flex-col items-center justify-center">
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.8 }}
                className="text-orange-500 font-black text-xl leading-none select-none"
              >
                ➔
              </motion.div>
              <span className="text-[7px] text-orange-400 font-mono font-black mt-1 uppercase tracking-widest">UPGRADE</span>
            </div>
            <div className="flex md:hidden items-center justify-center">
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.8 }}
                className="text-orange-500 font-black text-lg select-none"
              >
                ⬇
              </motion.div>
            </div>
          </div>

          {/* Card 04 - Expansão de P&D Preditivo */}
          <div className="col-span-1 bg-slate-850 border border-slate-850 hover:border-slate-750 p-4.5 rounded-[2rem] transition-all hover:scale-[1.01] shadow-md relative group flex flex-col justify-between h-[120px] text-left">
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-bold text-amber-400 font-mono tracking-widest uppercase">NÓ_04 // INTELIGÊNCIA</span>
              <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                <Cpu size={14} />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold leading-tight">Expansão de P&D Preditivo</span>
              <span className="text-[11px] font-black text-amber-500 font-mono mt-1.5 block">
                Fomento P&D: <span className="font-extrabold">+{stats.activated * 25}% do Alvo</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Areas */}
      <AnimatePresence mode="wait">
        {activeTab === "referral" && (
          <motion.div
            key="referral-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* LEFT CONTAINER (5 cols): Cybernetic Form & Share Template */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Sci-Fi Form Input */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-4">
                <div className="border-b border-gray-150 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Send className="text-orange-500" size={16} />
                    REGISTRAR NOVO PARCEIRO PJ
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed text-left">
                    Insira as chaves de conexão do decisor da empresa indicada para ativar o processo de qualificação técnica da Dafne.
                  </p>
                </div>

                <form onSubmit={handleAddReferral} className="space-y-4 text-left">
                  {/* Nome do Sócio */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-650 uppercase tracking-tight block">
                      Nome Completo do Decisor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Alexandre de Almeida"
                      className="w-full text-xs font-bold bg-slate-50 border border-gray-300 rounded-xl px-3.5 py-3 text-slate-705 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  {/* Razão Social/Fantasia */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-650 uppercase tracking-tight block">
                      Nome da Empresa (PJ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="Ex: Almeida Alimentos Ltda"
                      className="w-full text-xs font-bold bg-slate-50 border border-gray-300 rounded-xl px-3.5 py-3 text-slate-705 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  {/* Cargo & Nicho */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-black text-slate-655 uppercase tracking-tight block">
                        Cargo / Função
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        className="w-full text-xs font-black bg-slate-50 border border-gray-300 rounded-xl px-2.5 py-3 text-slate-705 focus:ring-2 focus:ring-orange-555"
                      >
                        <option value="Sócio Proprietário">Sócio Proprietário</option>
                        <option value="Diretor Financeiro (CFO)">Direto Finan. (CFO)</option>
                        <option value="Controller / Gerente">Controller / Adm</option>
                        <option value="Diretor de Operações">Dir. de Operações</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-black text-slate-655 uppercase tracking-tight block">
                        Área de Atuação
                      </label>
                      <select
                        value={formSector}
                        onChange={(e) => setFormSector(e.target.value)}
                        className="w-full text-xs font-black bg-slate-50 border border-gray-300 rounded-xl px-2.5 py-3 text-slate-705 focus:ring-2 focus:ring-orange-555"
                      >
                        <option value="Varejo & Comércio">Varejo & Comércio</option>
                        <option value="Indústria & Manufatura">Indústria & Manuf.</option>
                        <option value="Alimentos & Restaurantes">Alimentos & Rest.</option>
                        <option value="Serviços Médicos / Saúde">Saúde / Clínicas</option>
                        <option value="Logística & Rede Log">Logística & Transp.</option>
                      </select>
                    </div>
                  </div>

                  {/* Email ou Telefone */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-650 uppercase tracking-tight block">
                      Contato de Negócios (WhatsApp/Email) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      placeholder="Ex: (11) 99999-5555 ou alexandre@empresa.com"
                      className="w-full text-xs font-bold bg-slate-50 border border-gray-300 rounded-xl px-3.5 py-3 text-slate-705 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="w-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 font-extrabold text-xs py-3.5 rounded-xl cursor-pointer tracking-wider uppercase transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Send size={14} className="text-orange-500 animate-pulse" />
                    Enviar Conexão de Fomento PJ
                  </button>
                </form>
              </div>

              {/* Instant Script Copy block in Terminal style */}
              <div className="bg-slate-950 text-white rounded-[2rem] border border-slate-800 p-6 shadow-xl space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <h4 className="text-[10px] font-black font-mono uppercase text-slate-400 ml-2 tracking-wider">
                      CONVITE_B2B_TEMPLATE.SH
                    </h4>
                  </div>
                  <span className="text-[8px] text-orange-400 font-mono uppercase bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-900/30 font-semibold">
                    B2B Pitch
                  </span>
                </div>

                <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                  Envie o convite oficial nos canais de comunicação com outros empresários para acelerar o processo:
                </p>

                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl font-mono text-[9.5px] text-slate-300 max-h-[140px] overflow-y-auto leading-relaxed border-l-2 border-l-orange-500 block">
                  {invitationTemplate}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleCopyInvite(invitationTemplate, "command-copy")}
                    className={cn(
                      "px-4 py-2.5 text-[10px] font-mono tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 uppercase font-bold",
                      copiedTextId === "command-copy"
                        ? "bg-emerald-600 text-white"
                        : "bg-orange-600 text-white hover:bg-orange-700"
                    )}
                  >
                    {copiedTextId === "command-copy" ? (
                      <>
                        <Check size={12} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        Copiar Script de Indicações
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT CONTAINER (7 cols): Tech Charts, Fomento Destination, Active Connections */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Chart Pane - Modern Neon Grid Dashboard Style */}
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-[2.5rem] shadow-xl text-left space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-white text-sm font-black uppercase tracking-tight flex items-center gap-2">
                      <TrendingUp className="text-orange-500 animate-pulse" size={15} />
                      Curva de Produtividade & Economias de Escala
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                      Visualização matemática da diluição de latência do processador neural conforme novos nós PJ são agregados.
                    </p>
                  </div>
                  <span className="text-[8.5px] bg-slate-800 text-slate-350 font-mono px-3 py-1 rounded-full border border-slate-700 tracking-wider font-semibold shrink-0">
                    SINC_NÓS: {stats.activated} LIGADOS
                  </span>
                </div>

                {/* Recharts chart integrated directly onto the first tab! */}
                <div className="h-[210px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={scalingData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="mainFomento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="latencySlope" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis 
                        dataKey="users" 
                        tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 'bold' }} 
                        stroke="#334155"
                      />
                      <YAxis 
                        tick={{ fontSize: 8, fill: '#94a3b8' }} 
                        stroke="#334155"
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '10px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="reinvestment" 
                        name="Aporte de fomento (R$)" 
                        stroke="#f59e0b" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#mainFomento)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="overhead" 
                        name="Latência Relativa (ms)" 
                        stroke="#10b981" 
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fillOpacity={1} 
                        fill="url(#latencySlope)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fomento Capital Destination */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-4 text-left">
                <div className="border-b border-gray-150 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                    <Workflow className="text-orange-500" size={16} />
                    Destinação Mensal do Fomento Coletivo (R$ {(stats.activated * 35000).toLocaleString("pt-BR")},00)
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                    Estratégia Real de Marketing & Tecnologia: Como dividimos cientificamente os investimentos de cooperação PJ injetados em nosso ecossistema todos os meses.
                  </p>
                </div>

                {/* Progress bars showing the layout of the fomento split */}
                <div className="space-y-4 pt-1">
                  
                  {/* Item 1 - 40% */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                        <span className="font-extrabold text-slate-800 uppercase tracking-tight text-[11px]">40% Cluster de Supercomputação H100 GPU</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        R$ {Math.round(stats.activated * 35000 * 0.4).toLocaleString("pt-BR")},00
                      </span>
                    </div>
                    {/* Visual bar container */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                      <div className="bg-slate-900 h-full rounded-full transition-all duration-1000" style={{ width: "40%" }} />
                    </div>
                    <span className="block text-[9px] text-gray-500 italic pl-4 leading-tight">
                      ↳ Processamento em altíssima concorrência para rodar auditorias cruzadas de DRE e balanços em menos de 2.1 segundos por solicitação.
                    </span>
                  </div>

                  {/* Item 2 - 35% */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <span className="font-extrabold text-slate-850 uppercase tracking-tight text-[11px]">35% Treinamento Local de Modelos Tax/CMV</span>
                      </div>
                      <span className="font-mono font-bold text-orange-600 text-[11px]">
                        R$ {Math.round(stats.activated * 35000 * 0.35).toLocaleString("pt-BR")},00
                      </span>
                    </div>
                    {/* Visual bar container */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                      <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: "35%" }} />
                    </div>
                    <span className="block text-[9px] text-gray-500 italic pl-4 leading-tight">
                      ↳ Calibração contínua dos modelos cognitivos locais adaptados para a legislação societária e tributária das corporações aliadas.
                    </span>
                  </div>

                  {/* Item 3 - 25% */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="font-extrabold text-slate-850 uppercase tracking-tight text-[11px]">25% Jennifer Voice Pro Direct Calls</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-650 text-[11px]">
                        R$ {Math.round(stats.activated * 35000 * 0.25).toLocaleString("pt-BR")},00
                      </span>
                    </div>
                    {/* Visual bar container */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: "25%" }} />
                    </div>
                    <span className="block text-[9px] text-gray-500 italic pl-4 leading-tight">
                      ↳ Geração automatizada de alertas de caixa via chamadas neurais de voz sob demanda diretamente para o celular dos CFOs parceiros.
                    </span>
                  </div>

                </div>
              </div>

              {/* The Active Connection Nodes List */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col justify-between text-left">
                <div>
                  <div className="flex justify-between items-center border-b border-gray-150 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        REDE DE NÓS PJ CONECTADAS NO ECOSSISTEMA
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                        Lista descentralizada de empresas parceiras sincronizadas em nossa rede de fomento de P&D computacional.
                      </p>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-700 font-mono font-bold px-3 py-1 rounded-full uppercase border">
                      {referrals.length} NÓS INTEGRADOS
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                    {referrals.length === 0 ? (
                      <div className="py-12 text-center text-gray-400">
                        <p className="text-sm font-semibold">Nenhum nó corporativo cadastrado.</p>
                        <p className="text-xs text-slate-350 mt-1">Registre sua primeira empresa parceira ao lado!</p>
                      </div>
                    ) : (
                      referrals.map((friend) => {
                        const hostPing = friend.status === "Ativado" ? "14ms" : friend.status === "Em Contato" ? "180ms" : "---";
                        return (
                          <div 
                            key={friend.id} 
                            className="p-4 bg-slate-50 border border-gray-200 hover:border-gray-200/90 rounded-2xl flex items-center justify-between text-xs transition-all relative group"
                          >
                            <div className="min-w-0 flex items-start gap-3">
                              <div className={cn(
                                "p-2.5 rounded-xl shrink-0 text-white flex items-center justify-center mt-0.5 shadow-sm",
                                friend.status === "Ativado" ? "bg-emerald-650" : friend.status === "Em Contato" ? "bg-indigo-600" : "bg-amber-600"
                              )}>
                                <Building2 size={15} />
                              </div>
                              <div className="min-w-0 text-left">
                                <div className="font-extrabold text-slate-900 truncate flex items-center gap-2 leading-tight">
                                  {friend.companyName}
                                  {friend.status === "Ativado" && (
                                    <span className="text-[7.5px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold animate-[pulse_3.5s_infinite] uppercase">
                                      FOMENTO_ATIVO
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                  Contato: {friend.name} ({friend.role})
                                </div>
                                <div className="text-[9.5px] text-indigo-700 font-mono mt-1 flex items-center gap-4">
                                  <span>{friend.contact}</span>
                                  <span>•</span>
                                  <span className="text-slate-500 font-semibold">Cadastrado: {friend.date}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              {/* Virtual Ping Indicator */}
                              <div className="hidden md:flex flex-col text-right font-mono text-[9px] text-[#8e8e8e] select-none mr-2">
                                <span className="text-[7.5px] uppercase text-gray-400 font-semibold leading-none">PING</span>
                                <span className={cn("font-bold mt-0.5", friend.status === "Ativado" ? "text-emerald-600" : "text-amber-600")}>{hostPing}</span>
                              </div>

                              <span className={cn(
                                "text-[8.5px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wider font-mono",
                                friend.status === "Ativado" 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-250" 
                                  : friend.status === "Em Contato" 
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-250" 
                                    : "bg-amber-50 text-amber-600 border-amber-250"
                              )}>
                                {friend.status}
                              </span>
                              <button
                                onClick={() => handleDeleteReferral(friend.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Remover Indicação"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Instant Whastapp Share option banner */}
                <div className="mt-6 pt-5 border-t border-gray-150 bg-gradient-to-r from-orange-500/5 to-transparent p-4.5 rounded-2xl border border-orange-500/10 text-left">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 max-w-xl">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                        <Share2 size={13} className="text-orange-500" />
                        Disparar Convite Rápido via WhatsApp
                      </h4>
                      <p className="text-[10px] text-gray-500 leading-snug">
                        Copie a proposta simplificada e envie diretamente aos seus contatos de alto perfil para acoplá-los rapidamente à rede de amortização de custos.
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyInvite(invitationTemplate, "banner")}
                      className={cn(
                        "px-4 py-2.5 text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5 border leading-none",
                        copiedTextId === "banner"
                          ? "bg-emerald-650 border-emerald-650 text-white"
                          : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                      )}
                    >
                      {copiedTextId === "banner" ? (
                        <>
                          <Check size={12} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copiar Pitch do WhatsApp
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === "proposal" && (
          <motion.div
            key="proposal-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 text-left"
          >
            {/* The Commercial Proposal Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-150 shadow-xs p-6 md:p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.02] blur-[80px] rounded-full pointer-events-none" />
              
              {/* Header block resembling a nice printed document report */}
              <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-150 pb-6 gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-[9px] bg-slate-900 text-white px-2.5 py-0.5 rounded font-black uppercase tracking-widest font-sans">
                    Dafne AI Systems
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Proposta Comercial de Controladoria Inteligente PJ
                  </h3>
                  <p className="text-xs text-gray-500">
                    Modelagem Financeira Avançada, Auditoria Contínua de DRE e Assessoria Pessoal com IA de Baixa Latência.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-orange-100 text-orange-700 font-extrabold px-3 py-1.5 rounded-xl uppercase border border-orange-200">
                    Fomento de I.A. & Redes Neurais
                  </span>
                </div>
              </div>

              {/* Grid: Description/Value prop + Technology reinvestment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest border-l-2 border-orange-500 pl-2">
                    A Solução Operacional // Dafne
                  </h4>
                  <p className="text-xs text-slate-655 leading-relaxed">
                    A Dafne é uma inteligência artificial estrutural focada em atuar como a co-piloto financeira definitiva de pequenas e médias empresas brasileiras. Diferente de planilhas engessadas e ERPs tradicionais complexos, nós simplificamos o dia a dia por meio de modelagem preditiva e feedback acionável síncrono.
                  </p>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-800">DRE Automático & Análise Vertical:</strong> Classifique lançamentos em tempo real de OPEX, COGS, Dividendos e Impostos.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-800">Auditor Tributário Integrado:</strong> Mapeie instantaneamente sua margem líquida real de portfólio versus a alíquota fiscal, evitando prejuízos operacionais.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-800">Assistente Conversacional Personalizado:</strong> Tire dúvidas e trace cenários diretamente via comandos de linguagem natural, com as diretivas customizadas de seu negócio respeitadas em todos os níveis.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/20 blur-3xl rounded-full" />
                  
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-1 text-[9px] font-black text-orange-400 tracking-wider uppercase">
                      <Sparkles size={11} className="animate-pulse text-orange-400" />
                      NOSSA FILOSOFIA DE DESENVOLVIMENTO
                    </div>
                    <h4 className="text-base font-extrabold tracking-tight">
                      Ganho de Escala Reinvestido em Tecnologia Real
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sistemas tradicionais lucram mantendo taxas elevadas para cobrir silos individuais de dados. Na Dafne, operamos com uma arquitetura de infraestrutura inteligente que otimiza e unifica o poder de computação de modelos neurais e gráficos conforme nossa comunidade empresarial cresce.
                    </p>
                    <p className="text-xs text-orange-200 font-bold leading-relaxed italic border-l border-orange-500/30 pl-2.5 mt-2">
                      "Quanto mais donos de empresas, diretores de finanças e controllers se conectam à nossa rede de assessoria via I.A., mais diluímos a ociosidade dos processadores neurais. Nós garantimos o compromisso de transferir 100% desse ganho operacional diretamente para a otimização de velocidade de latência e precisão das consultas da inteligência."
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>ARQUITETURA DILUÍDA COLETIVA</span>
                    <span className="text-emerald-400 font-semibold uppercase">100% Eficiência</span>
                  </div>
                </div>
              </div>

              {/* B2B Subscription benefits grid */}
              <div className="space-y-4 pt-4 border-t border-gray-150">
                <h4 className="text-[12px] font-black text-slate-850 uppercase tracking-wider block">
                  Marcos de Engajamento & Fomento Tecnológico Coletivo 🚀
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tier 1 */}
                  <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50 relative flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase inline-block">
                        1 Parceiro Ativo
                      </span>
                      <h5 className="text-xs font-black text-slate-900 uppercase">Fase Inicial de P&D</h5>
                      <p className="text-[10.5px] text-slate-500 leading-snug">
                        Atração inicial de R$ 35.000 de incentivo. Libera o <span className="text-indigo-650 font-extrabold">Copilot de Inteligência Expandido</span> com cota de respostas refinadas 2x maior para todas as empresas da rede.
                      </p>
                    </div>
                    <span className="text-[8px] text-gray-400 font-mono mt-3 uppercase tracking-wider">Cota de IA Avançada</span>
                  </div>

                  {/* Tier 2 */}
                  <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50/20 relative flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase inline-block">
                        2 Parceiros Ativos
                      </span>
                      <h5 className="text-xs font-black text-slate-900 uppercase">Modelagem Avançada</h5>
                      <p className="text-[10.5px] text-slate-500 leading-snug">
                        Atração de R$ 70.000 de fomento. Permite implantar novas <span className="text-orange-650 font-extrabold">Rotinas de Voz Neurais Jennifer Pro</span> com processamento sob demanda e áudios realistas.
                      </p>
                    </div>
                    <span className="text-[8px] text-orange-500 font-mono mt-3 uppercase tracking-wider">Índice Computacional</span>
                  </div>

                  {/* Tier 3 */}
                  <div className="p-4 rounded-2xl border border-emerald-250 bg-emerald-50/20 relative flex flex-col justify-between animate-in duration-500">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase inline-block">
                        3+ Parceiros Ativos
                      </span>
                      <h5 className="text-xs font-black text-slate-900 uppercase">Consolidação de Nuvem 👑</h5>
                      <p className="text-[10.5px] text-slate-500 leading-snug">
                        Atração de fomento em escala (R$ 245.000+). Desbloqueia o <span className="text-emerald-750 font-extrabold">Diagnóstico de Valuation Secreto da Dafne</span> com simulações gráficas em tempo real.
                      </p>
                    </div>
                    <span className="text-[8px] text-emerald-600 font-mono mt-3 uppercase tracking-wider">Controladoria Avançada</span>
                  </div>
                </div>
              </div>

              {/* Ready pitch generator */}
              <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-black text-slate-650 uppercase tracking-widest">Amostra do Convite Comercial de Análise Financeira</span>
                  <span className="text-[8.5px] text-gray-400 uppercase">PITCH B2B</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-250 text-slate-600 font-mono text-[10px] whitespace-pre-wrap leading-relaxed text-left max-h-[120px] overflow-y-auto">
                  {invitationTemplate}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleCopyInvite(invitationTemplate, "proposal-text")}
                    className={cn(
                      "px-3 py-1.5 text-[9.5px] font-bold uppercase transition-all rounded-lg scrollbar-none flex items-center gap-1 cursor-pointer",
                      copiedTextId === "proposal-text"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                  >
                    {copiedTextId === "proposal-text" ? (
                      <>
                        <Check size={11} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        Copiar Pitch para Envio Rápido
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === "simulator" && (
          <motion.div
            key="simulator-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Simulation controls card */}
            <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-gray-150 shadow-xs space-y-5 text-left">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <Cpu className="text-orange-555" size={17} />
                  Simule o Crescimento da Rede
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Ajuste a quantidade de indicados e a probabilidade de fechamento para estimar o impacto no ganho tecnológico e desoneração da mensalidade.
                </p>
              </div>

              {/* Slider 1: Number of referrals */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-600 font-black uppercase">Amigos PJ Indicados</span>
                  <span className="text-orange-600 font-mono font-black text-xs">{simulatorReferralCount} Empresas</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={simulatorReferralCount}
                  onChange={(e) => {
                    sound.playClick();
                    setSimulatorReferralCount(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-[8px] text-gray-400 font-mono">
                  <span>1 Empresa</span>
                  <span>5 Empresas</span>
                  <span>10 Empresas</span>
                </div>
              </div>

              {/* Slider 2: Probability of conversion */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-600 font-black uppercase">Probabilidade de Fechamento</span>
                  <span className="text-indigo-600 font-mono font-black text-xs">{activationProbability}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={activationProbability}
                  onChange={(e) => {
                    sound.playClick();
                    setActivationProbability(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[8px] text-gray-400 font-mono">
                  <span>20% (Pessimista)</span>
                  <span>60% (Média)</span>
                  <span>100% (Garantido)</span>
                </div>
              </div>

              {/* Immediate resulting estimate card */}
              {(() => {
                const estimatedSales = Math.max(1, Math.round(simulatorReferralCount * (activationProbability / 100)));
                const discount = Math.min(100, estimatedSales * 15);
                const currentPlanVal = 199; // baseline cost of DRE plan
                const finalCost = Math.max(0, currentPlanVal * (1 - discount / 100));

                let technologyIncreaseMultiplier = estimatedSales * 30; // 30% computing reinvestment multiplier

                return (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
                    <span className="block text-[8.5px] uppercase font-black tracking-widest text-[#9e9e9e]">Estimativa do Seu Retorno</span>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-200/60">
                        <span className="block text-[7.5px] uppercase font-extrabold text-gray-400">Progresso de P&D</span>
                        <span className="text-sm font-black text-slate-800 font-mono tracking-tight">
                          +{estimatedSales * 25}% do Alvo
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-gray-200/60">
                        <span className="block text-[7.5px] uppercase font-extrabold text-gray-400">Aporte Estimado</span>
                        <span className="text-sm font-black text-emerald-600 font-mono">
                          R$ {(estimatedSales * 35000).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-orange-200/60 leading-relaxed text-[10px] text-gray-500">
                      <div className="flex items-center gap-1 font-semibold text-slate-750 mb-1">
                        <Zap size={11} className="text-orange-500" />
                        Ganho Coletivo em Servidores Neurais:
                      </div>
                      O ganho de escala destas indicações reduz o processamento geral da nuvem e permite à Dafne injetar <strong className="text-indigo-650">+{technologyIncreaseMultiplier}% de capacidade e velocidade</strong> em suas varreduras financeiras de DRE e dicas!
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Simulated technology charts showing collective economy of scale and reinvestment */}
            <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-gray-150 shadow-xs flex flex-col justify-between text-left space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                  Como suas indicações financiam melhorias no App
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Evidência visual: quanto mais participantes ativos na aliança, menor é a sobrecarga computacional de hospedagem e mais verba é revertida para precisão de análise de inteligência.
                </p>
              </div>

              {/* Chart container */}
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={scalingData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorReinvestment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOverhead" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="users" 
                      tick={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }} 
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      tick={{ fontSize: 8, fill: '#64748b' }} 
                      stroke="#cbd5e1"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '10px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="reinvestment" 
                      name="Fundo de Otimização IA (R$)" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorReinvestment)" 
                      filter="url(#neon-glow-orange)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="overhead" 
                      name="Custo Computacional Unitário" 
                      stroke="#4f46e5" 
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1} 
                      fill="url(#colorOverhead)" 
                      filter="url(#neon-glow-indigo)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Explicit informational items details */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-xs">
                <div className="space-y-1">
                  <span className="block text-[8.5px] uppercase font-black text-[#858585] tracking-widest">
                    REINVESTIMENTO DIRETO
                  </span>
                  <p className="text-[10.5px] text-slate-655 leading-relaxed">
                    Convertemos o ganho coletivo de infraestrutura de rede diretamente em novos recursos de automação de fluxo de caixa tributário e conexões inteligentes para a plataforma.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="block text-[8.5px] uppercase font-black text-[#858585] tracking-widest">
                    SUSTENTABILIDADE DE INFRA
                  </span>
                  <p className="text-[10.5px] text-slate-655 leading-relaxed">
                    A entrada de novos parceiros expande nossa base corporativa conectada, viabilizando novos investimentos e recursos de inteligência exclusivos para a controladoria de todas as empresas participantes.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helpful FAQ block */}
      <div className="bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-150 text-left space-y-4">
        <h4 className="text-[11.5px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle size={15} className="text-[#888]" />
          Dúvidas Recorrentes sobre o Programa Comercial & Tecnologia Coletiva
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-slate-600 text-xs leading-relaxed">
          <div className="space-y-1.5 bg-white p-4.5 rounded-2xl border border-gray-150">
            <strong className="text-slate-800">Como funciona o reinvestimento de tecnologia na prática?</strong>
            <p className="text-[10.5px] text-slate-540">
              O processamento de logs de faturamento e geração de insights de IA consome recursos de servidores de nuvem de alto custo. Conforme o número de empresas parceiras na rede acumula, o valor por empresa desse processamento cai drasticamente. Quanto mais donos de empresas, diretores de finanças e controllers se conectam à nossa rede de assessoria via I.A., mais diluímos a ociosidade dos processadores neurais. Nós garantimos o compromisso de transferir 100% desse ganho operacional diretamente para a otimização de velocidade de latência e precisão das consultas da inteligência.
            </p>
          </div>

          <div className="space-y-1.5 bg-white p-4.5 rounded-2xl border border-gray-150">
            <strong className="text-slate-800">Como as indicações se traduzem em novos recursos de IA?</strong>
            <p className="text-[10.5px] text-slate-540">
              Cada indicação qualificada expande a comunidade, promovendo a atratividade do app para novas rodadas de coinvestimento. Esse capital adicional é inteiramente focado na concepção de novos algoritmos preditivos de margim de caixa e inteligência de controladoria integradas de ponta.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
