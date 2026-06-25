import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Zap,
  TrendingUp,
  Sliders,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Heart,
  RotateCcw,
  RefreshCw,
  Award
} from "lucide-react";

interface TurnaroundModuleProps {
  simulatedCrisis: boolean;
  setSimulatedCrisis: (val: boolean) => void;
  transactions: any[];
  companyName: string;
  setActiveTab: (tab: string) => void;
}

export default function TurnaroundModule({
  simulatedCrisis,
  setSimulatedCrisis,
  transactions,
  companyName,
  setActiveTab,
}: TurnaroundModuleProps) {
  // Input simulation states
  const [fixedExpenses, setFixedExpenses] = useState(48500);
  const [targetCutPercent, setTargetCutPercent] = useState(30);
  const [currentCash, setCurrentCash] = useState(4850);
  const [flashSalesRevenue, setFlashSalesRevenue] = useState(15000);

  // Active day index for playbook
  const [activeDay, setActiveDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  // Checklist of rapid operations
  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem("dafne_turnaround_checklist");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "saas_cut",
        label: "Suspender licenças de SaaS e softwares duplicados ou ociosos",
        savings: 850,
        checked: false,
        type: "fixed_cut",
      },
      {
        id: "capex_freeze",
        label: "Congelar investimentos de CAPEX (compras de maquinários, móveis ou reformas)",
        savings: 7500,
        checked: false,
        type: "fixed_cut",
      },
      {
        id: "provider_reneg",
        label: "Negociar extensão de prazo em 20 dias com os 3 principais fornecedores",
        savings: 12000,
        checked: false,
        type: "cash_flash",
      },
      {
        id: "vip_deal",
        label: "Fazer campanha Flash com 15% desc. para clientes VIP com pagamento à vista",
        savings: 18000,
        checked: false,
        type: "cash_flash",
      },
      {
        id: "loose_stock",
        label: "Liquidar mercadorias ou inventários parados com margem de custo",
        savings: 9500,
        checked: false,
        type: "cash_flash",
      },
      {
        id: "unjustified_withdraw",
        label: "Bloquear retiradas extras de pró-labore e dividendos por 60 dias",
        savings: 5000,
        checked: false,
        type: "fixed_cut",
      },
    ];
  });

  // Save checklist state to localStorage when changed
  React.useEffect(() => {
    try {
      localStorage.setItem("dafne_turnaround_checklist", JSON.stringify(checklist));
    } catch (e) {
      console.error(e);
    }
  }, [checklist]);

  // Mini AI Turnaround consultant chat mock responses
  const [consultationStatus, setConsultationStatus] = useState<"idle" | "running" | "done">("idle");
  const [aiReport, setAiReport] = useState<string>("");

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const [pricingCost, setPricingCost] = useState(100);
  const [pricingCurrentPrice, setPricingCurrentPrice] = useState(120);
  const [pricingNewPrice, setPricingNewPrice] = useState(145);

  // Interactive Calculations
  const calculatedSavings = checklist
    .filter((item) => item.checked && item.type === "fixed_cut")
    .reduce((acc, item) => acc + item.savings, 0);

  const calculatedFlashInflow = checklist
    .filter((item) => item.checked && item.type === "cash_flash")
    .reduce((acc, item) => acc + item.savings, 0);

  // Math simulations based on sliders
  const finalFixedExpenses = Math.max(0, fixedExpenses * (1 - targetCutPercent / 100) - calculatedSavings);
  const finalCash = currentCash + flashSalesRevenue + calculatedFlashInflow;

  const currentRunway = Math.round(currentCash / Math.max(1, fixedExpenses / 30));
  const projectRunway = Math.round(finalCash / Math.max(1, finalFixedExpenses / 30));

  const currentBreakeven = fixedExpenses / 0.5; // assumes 50% contributions margin base
  const projectBreakeven = finalFixedExpenses / 0.5;

  const toggleDayCompletion = (day: number) => {
    setCompletedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const runTurnaroundDiagnosis = () => {
    setConsultationStatus("running");
    setTimeout(() => {
      const generatedTips = `🚨 DIRETRIZ EMERGENCIAL PARA ${companyName.toUpperCase()} 🚨

1. REDUÇÃO DE PONTE DE EQUILÍBRIO (BREAKEVEN MINIMIZATION):
   Seu ponto de equilíbrio ideal despencou de R$ ${(currentBreakeven).toLocaleString("pt-BR")} para R$ ${(projectBreakeven).toLocaleString("pt-BR")}. Isso significa que sua empresa agora respira muito mais aliviada com menor necessidade de venda diária.

2. AÇÃO DE FLUXO DIRETO (CASH PIPELINE):
   Você capturou R$ ${(calculatedFlashInflow + flashSalesRevenue).toLocaleString("pt-BR")} adicionais em caixa com liquidez imediata. Utilize esta reserva exclusivamente para liquidar as faturas com juros mais abusivos na aba de Contas a Pagar.

3. RECOMENDAÇÃO OPERACIONAL DAFNE IA:
   O congelamento de CAPEX e suspensão de softwares reduziu seu OPEX mensal de forma consistente. Mantenha os custos em rédea curta nos próximos 45 dias até que o runway esteja estabilizado acima de 45 dias úteis.`;
      setAiReport(generatedTips);
      setConsultationStatus("done");
    }, 1500);
  };

  const playbookSteps = [
    {
      day: 1,
      title: "Diagnóstico de Estancamento & Sangria",
      objective: "Bloquear imediatamente qualquer evasão descontrolada de capitais do caixa.",
      instructions: [
        "Acesse todo o extrato bancário dos últimos 15 dias e audite cobranças duplicadas ou automáticas.",
        "Bloqueie temporariamente todos os cartões corporativos de compras gerais de equipe.",
        "Instale um comitê interno de aprovação para qualquer gasto superior a R$ 200,00."
      ]
    },
    {
      day: 2,
      title: "Mapeamento e Negociação com Fornecedores",
      objective: "Dilatar prazos de passivos sem gerar multas contratuais gravosas.",
      instructions: [
        "Faça uma lista prioritária dos 5 principais fornecedores insubstituíveis.",
        "Faça contato telefônico direto propondo o parcelamento do vencimento corrente da fatura e alongamento de prazo.",
        "Troque a compra de lotes massivos por suprimento fracionado sob demanda (Just In Time)."
      ]
    },
    {
      day: 3,
      title: "Injeção Flash de Caixa (Estoque & VIPs)",
      objective: "Obter faturamento imediato em 24h para rechear as reservas emergenciais.",
      instructions: [
        "Separe produtos ou serviços ociosos de baixa rotação do seu portfólio.",
        "Proponha uma campanha restrita e confidencial de 'Combo de Fomento' com 15% a 20% de desconto unicamente para pagamentos via PIX à vista.",
        "Estipule um teto de cotas promocionais para manter a escassez e apelo da proposta comercial."
      ]
    },
    {
      day: 4,
      title: "Auditoria de Assinaturas e OPEX Fixo",
      objective: "Remover custos parasitas que corroem seus lucros silenciosamente de forma recorrente.",
      instructions: [
        "Reunir todas as assinaturas ativas de CRM, softwares secundários, hospedagens e ferramentas de design.",
        "Cancelar contas redundantes e negociar downgrade temporário de planos para o plano inicial básico.",
        "Postergue aluguéis de licenças desnecessárias."
      ]
    },
    {
      day: 5,
      title: "Reprecificação de Sobrevivência (Margem)",
      objective: "Garantir margem de contribuição mínima de 40% em todas as ofertas correntes.",
      instructions: [
        "Calcule rigorosamente o custo unitário mais impostos e comissões do seu serviço primário.",
        "Corte descontos excessivos concedidos pelo time comercial sem supervisão direta.",
        "Se aplicável, crie um pequeno reajuste de sobrevivência de 5% a 10% cobrindo a perda inflacionária de insumos."
      ]
    },
    {
      day: 6,
      title: "Otimização de Ciclo Comercial PJ",
      objective: "Concentrar força de vendas onde o dinheiro entra mais rápido no caixa.",
      instructions: [
        "Pesquise quais clientes trazem receita em ciclo rápido (vendas à vista ou faturamento máximo de 7 dias).",
        "Redirecione toda a sua verba de publicidade digital ativa e tempo operacional apenas para esta fatia de alta velocidade.",
        "Pause transações com prazos de recebimento extensos (ex: faturamento de 60 ou 90 dias) temporariamente."
      ]
    },
    {
      day: 7,
      title: "Telemetria Horária de Governança",
      objective: "Fixar a nova rotina de acompanhamento contra recaídas operacionais.",
      instructions: [
        "Implemente no checklist de rotina o preenchimento do extrato de transações ao meio-dia e fim do dia.",
        "Utilize o Score de Saúde da Dafne IA como baliza diária nas suas reuniões executivas.",
        "Comemore a retomada da saúde financeira ao cruzar o runway saudável de 45 dias ativos!"
      ]
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-rose-200 overflow-hidden shadow-xl shadow-rose-100 p-5 md:p-6 space-y-6">
      {/* Alert Header Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <span className="bg-white/15 backdrop-blur-md text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5 font-mono border border-white/10">
              <ShieldAlert size={11} className="text-white animate-pulse" /> SALA DE SITUAÇÃO & TURNAROUND
            </span>
            <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight pt-1">
              Módulo de Mudança de Jogo: Recuperação Rápida
            </h3>
            <p className="text-xs text-rose-100 max-w-2xl font-medium leading-relaxed font-sans">
              Desenvolvido sob medida para blindar a <strong className="text-white">{companyName}</strong> durante instabilidades e crises agudas de caixa. Conecte de imediato novas estratégias síncronas de injeção de lucros, queima operatória e extensão de fôlego bancário!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const newVal = !simulatedCrisis;
                setSimulatedCrisis(newVal);
                localStorage.setItem("simulated_crisis", newVal ? "true" : "false");
              }}
              className={`px-4 py-2.5 rounded-xl font-mono font-black text-[10px] uppercase tracking-widest transition-all duration-300 pointer-events-auto cursor-pointer border ${
                simulatedCrisis
                  ? "bg-white text-rose-600 border-white shadow-md shadow-white/10"
                  : "bg-rose-700/50 hover:bg-rose-750 text-white border-rose-500/30"
              }`}
            >
              {simulatedCrisis ? "🟢 Restaurar Saúde Normal" : "🔌 Simular Crise de Caixa"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Col: Survivability Sliders & Live Projections */}
        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-sans">
              <Sliders size={14} className="text-rose-500" /> Parâmetros de Crise
            </h4>
            <span className="text-[9px] bg-rose-50 text-rose-600 font-bold font-mono px-2 py-0.5 rounded-full uppercase">
              Simulador Ativo
            </span>
          </div>

          {/* Slider 1: Fixed Expenses */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Despesa Fixa Mensal Atual:</span>
              <span className="font-mono text-rose-600">R$ {fixedExpenses.toLocaleString("pt-BR")},00</span>
            </div>
            <input
              type="range"
              min="10000"
              max="150000"
              step="2500"
              value={fixedExpenses}
              onChange={(e) => setFixedExpenses(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Slider 2: Target cuts percent */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Corte de OPEX Projetado (Demissões/Gerais):</span>
              <span className="font-mono text-orange-600">{targetCutPercent}% de Corte</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={targetCutPercent}
              onChange={(e) => setTargetCutPercent(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Slider 3: Current Cash */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Giro em Conta Bancária Disponível:</span>
              <span className="font-mono text-red-650">R$ {currentCash.toLocaleString("pt-BR")},00</span>
            </div>
            <input
              type="range"
              min="500"
              max="60000"
              step="500"
              value={currentCash}
              onChange={(e) => setCurrentCash(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-red-650"
            />
          </div>

          {/* Slider 4: Emergency Revenue Campaign */}
          <div className="space-y-1.5 pb-4 border-b border-gray-200">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Faturamento Emergencial (Campanha Flash):</span>
              <span className="font-mono text-emerald-600">R$ {flashSalesRevenue.toLocaleString("pt-BR")},00</span>
            </div>
            <input
              type="range"
              min="0"
              max="60000"
              step="1000"
              value={flashSalesRevenue}
              onChange={(e) => setFlashSalesRevenue(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Live Survival Output Cards */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block font-mono">
              Projeção de Mudança de Jogo (Resultados)
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Runway Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 flex flex-col justify-between">
                <span className="text-[8px] uppercase font-black text-gray-400 font-mono tracking-widest">
                  Runway de Caixa
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`text-xl font-mono font-black italic tracking-tighter ${projectRunway <= 15 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                    {projectRunway} DIAS
                  </span>
                </div>
                <p className="text-[8.5px] text-gray-500 leading-tight mt-1 font-medium">
                  Antes: <strong className="text-rose-600">{currentRunway} dias</strong>. Sobrevivência ampliada pelo fomento e tesoura de custos.
                </p>
              </div>

              {/* Breakeven Rescue Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 flex flex-col justify-between">
                <span className="text-[8px] uppercase font-black text-gray-400 font-mono tracking-widest">
                  Novo Ponto Equilíbrio
                </span>
                <div className="mt-1">
                  <span className="text-base font-mono font-black italic text-slate-800 tracking-tighter">
                    R$ {Math.round(projectBreakeven).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-[8.5px] text-gray-500 leading-tight mt-1 font-medium">
                  Reduziu em <strong className="text-emerald-600 font-extrabold">{Math.round(((currentBreakeven - projectBreakeven) / currentBreakeven) * 100)}%</strong>. Menos faturamento necessário para sobreviver!
                </p>
              </div>
            </div>

            {/* Total Balance after flash operations */}
            <div className="bg-emerald-50/50 border border-emerald-150 rounded-2xl p-4 flex justify-between items-center text-xs">
              <div>
                <span className="block text-[8px] font-black uppercase text-emerald-700 tracking-widest">
                  Caixa Estimado Após Ações
                </span>
                <span className="text-base font-mono font-black text-emerald-600">
                  R$ {finalCash.toLocaleString("pt-BR")},00
                </span>
              </div>
              <TrendingUp className="text-emerald-500 stroke-2" size={24} />
            </div>
          </div>
        </div>

        {/* Middle Col: Tactical Operations Checklist */}
        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-sans">
                <CheckCircle2 size={14} className="text-rose-500" /> Operações de Sobrevivência
              </h4>
              <span className="text-[9px] bg-orange-50 text-orange-600 font-bold font-mono px-2 py-0.5 rounded-full">
                Corta-Gordura
              </span>
            </div>

            <p className="text-[11px] text-gray-500 font-medium leading-relaxed font-sans">
              Marque as operações táticas já implantadas ou simuladas na empresa para recalcular os ganhos operacionais imediatos no painel lateral esquerdo:
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 text-left ${
                    item.checked
                      ? "bg-rose-50 border-rose-200 text-rose-950 shadow-xs"
                      : "bg-white border-gray-150 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {}} // Click handled by parent div
                    className="mt-0.5 rounded border-gray-300 text-rose-500 focus:ring-rose-400 h-3.5 w-3.5 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold leading-snug block">{item.label}</span>
                    <span className={`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded inline-block ${
                      item.type === "fixed_cut" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {item.type === "fixed_cut" ? `OPEX Economizado: +R$ ${item.savings}/mês` : `Atalho Caixa: R$ ${item.savings} Líquido`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 mt-4 flex items-center justify-between text-xs">
            <div>
              <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest font-mono">
                Economia Fixa Total
              </span>
              <span className="font-mono text-rose-600 font-extrabold text-sm">
                + R$ {calculatedSavings.toLocaleString("pt-BR")}/mês
              </span>
            </div>
            <div>
              <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest font-mono">
                Resgate Injetado
              </span>
              <span className="font-mono text-emerald-600 font-extrabold text-sm">
                + R$ {calculatedFlashInflow.toLocaleString("pt-BR")} imediato
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Reprecpricing Under Fire & Interactive AI Directives */}
        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-sans">
                <Sparkles size={14} className="text-orange-500" /> Reprecificação de Fôlego
              </h4>
              <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold font-mono px-2 py-0.5 rounded-full">
                Análise Markup
              </span>
            </div>

            <p className="text-[11px] text-gray-500 font-medium leading-relaxed font-sans">
              Em crises de caixa, a precificação inadequada é o principal matador de empresas. Ajuste o CMV unitário e confira o impacto de reajustar seu preço de venda emergencialmente:
            </p>

            <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-gray-150">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-gray-400 uppercase block">CMV Insumo</span>
                  <input
                    type="number"
                    value={pricingCost}
                    onChange={(e) => setPricingCost(Number(e.target.value))}
                    className="w-full text-center px-1 py-1 rounded bg-gray-55 border border-gray-150 text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-gray-400 uppercase block">Preço Atual</span>
                  <input
                    type="number"
                    value={pricingCurrentPrice}
                    onChange={(e) => setPricingCurrentPrice(Number(e.target.value))}
                    className="w-full text-center px-1 py-1 rounded bg-gray-55 border border-gray-150 text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-gray-400 uppercase block">Novo Preço</span>
                  <input
                    type="number"
                    value={pricingNewPrice}
                    onChange={(e) => setPricingNewPrice(Number(e.target.value))}
                    className="w-full text-center px-1 py-1 rounded bg-gray-55 border border-gray-150 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Math markup values */}
              {pricingCost > 0 && (
                <div className="grid grid-cols-2 gap-3 text-center pt-3 border-t border-gray-100">
                  <div className="p-2 bg-rose-50/50 rounded-xl border border-rose-100">
                    <span className="block text-[7.5px] uppercase font-bold text-rose-500 tracking-wider">Margem Atual</span>
                    <span className="text-xs font-black font-mono text-rose-600">
                      {(((pricingCurrentPrice - pricingCost) / pricingCurrentPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 animate-pulse">
                    <span className="block text-[7.5px] uppercase font-bold text-emerald-500 tracking-wider">Nova Margem (+{(((pricingNewPrice - pricingCurrentPrice) / pricingCurrentPrice) * 100).toFixed(0)}%)</span>
                    <span className="text-xs font-black font-mono text-emerald-600">
                      {(((pricingNewPrice - pricingCost) / pricingNewPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Turnaround advice trigger button */}
          <div className="bg-slate-950 text-white rounded-2xl p-4.5 border border-zinc-800 space-y-3 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-orange-400 animate-bounce" />
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest font-mono">
                Conselheiro de Crise Dafne IA
              </span>
            </div>

            <p className="text-[10px] text-gray-300 font-medium leading-relaxed font-sans">
              Deseja que a mentora estratégica de controladoria Dafne gere um parecer de plano de retomada consolidado para sua empresa baseado nos sliders e checklist selecionados?
            </p>

            <button
              onClick={runTurnaroundDiagnosis}
              disabled={consultationStatus === "running"}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 text-black font-black text-[10px] uppercase tracking-widest py-2 px-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md border border-orange-600/30"
            >
              {consultationStatus === "running" ? (
                <>
                  <RefreshCw size={12} className="animate-spin" /> Processando Auditoria Fiscal...
                </>
              ) : (
                <>
                  <Sparkles size={12} /> Gerar Parecer de Turnaround
                </>
              )}
            </button>

            <AnimatePresence>
              {aiReport && consultationStatus === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 max-h-[160px] overflow-y-auto scrollbar-thin text-left space-y-2 text-[10px] font-mono leading-relaxed text-yellow-300"
                >
                  <pre className="whitespace-pre-wrap">{aiReport}</pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Playbook 7 steps bottom section */}
      <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-3 gap-3">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-sans">
              <Clock size={14} className="text-rose-500" /> Plano de Retomada em 7 Dias Corridos
            </h4>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5 font-mono">
              Siga religiosamente o protocolo emergencial dia a dia para recuperar a saúde do faturamento
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {playbookSteps.map((step) => {
              const isCompleted = completedDays.includes(step.day);
              const isActive = activeDay === step.day;
              return (
                <button
                  key={step.day}
                  onClick={() => setActiveDay(step.day)}
                  className={`w-10 h-10 rounded-xl font-mono text-xs font-black italic tracking-tighter cursor-pointer flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-black"
                      : isActive
                      ? "bg-rose-500 text-white border border-rose-600 scale-105 shadow-md shadow-rose-500/20"
                      : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  D{step.day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Playbook step content details card */}
        <AnimatePresence mode="wait">
          {playbookSteps.map((step) => {
            if (activeDay !== step.day) return null;
            const isCompleted = completedDays.includes(step.day);
            return (
              <motion.div
                key={step.day}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-rose-100 text-rose-700 font-mono font-black italic tracking-widest px-3 py-0.5 rounded uppercase inline-block">
                      ETAPA {step.day} DE 7 (DIA DO PROTOCOLO)
                    </span>
                    <h5 className="text-sm font-black text-slate-900 uppercase">
                      {step.title}
                    </h5>
                  </div>

                  <button
                    onClick={() => toggleDayCompletion(step.day)}
                    className={`px-4 py-2 rounded-xl font-mono font-black text-[9px] uppercase tracking-widest cursor-pointer transition-all border ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-gray-900 hover:bg-black text-white border-zinc-700"
                    }`}
                  >
                    {isCompleted ? "✓ Dia Concluído!" : "Marcar Dia como Executado"}
                  </button>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block font-mono">
                    Objetivo Primordial do Dia:
                  </span>
                  <p className="text-xs font-bold text-gray-700 leading-snug mt-1">
                    {step.objective}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block font-mono">
                    Instruções Táticas de Campo:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {step.instructions.map((inst, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50/50 border border-gray-200 p-3.5 rounded-xl flex gap-2.5 items-start text-xs font-medium"
                      >
                        <span className="bg-rose-500 text-white rounded-full font-mono text-[9px] w-4.5 h-4.5 flex items-center justify-center shrink-0 font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-gray-700 leading-snug">{inst}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Helpful Info footer linking to Partner system */}
      <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div className="flex gap-2.5 items-start">
          <Info className="text-orange-500 stroke-2 shrink-0 mt-0.5 animate-pulse" size={16} />
          <p className="text-slate-700 leading-relaxed font-semibold">
            🚨 <strong>Importante:</strong> Para ampliar a tração de caixa da sua PJ e atrair fomento, lembre-se de cadastrar outras empresas parceiras no menu <strong className="text-orange-600">Aliança de Fomento Tecnológico</strong>. Juntos, reduzimos custos de infraestrutura e aceleramos novos investimentos de inteligência preditiva para todas as empresas da rede.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("referral")}
          className="text-orange-650 hover:text-orange-550 transition-colors font-black uppercase text-[10px] tracking-widest whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0"
        >
          Ir para Aliança <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
