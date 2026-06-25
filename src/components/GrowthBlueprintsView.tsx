import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { sound } from "../utils/SoundEngine";
import { 
  Megaphone,
  Sparkles,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Percent,
  DollarSign,
  Target,
  Users,
  Award,
  ArrowUpRight,
  TrendingDown,
  Info,
  Layers,
  Sparkle,
  AlertTriangle,
  Check,
  Activity
} from "lucide-react";

interface Blueprint {
  id: string;
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  estimatedImpact: string;
  difficulty: "Fácil" | "Moderado" | "Avançado";
  summary: string;
  steps: { id: string; label: string; checked: boolean }[];
}

export default function GrowthBlueprintsView() {
  const { profile, transactions = [], showToast } = useFinance();

  // Selected strategy blueprint state
  const [activeBlueprintId, setActiveBlueprintId] = useState<string>("google_ads");

  // Tactical Funnel & ROI Planner states
  const [targetRevenueGoal, setTargetRevenueGoal] = useState<number>(80000);
  const [minRequiredRoi, setMinRequiredRoi] = useState<number>(200);
  const [selectedFunnelTactics, setSelectedFunnelTactics] = useState<string[]>(["t_gads", "t_meta"]);

  useEffect(() => {
    if (profile?.billingGoal && profile.billingGoal > 0) {
      setTargetRevenueGoal(profile.billingGoal);
    }
  }, [profile?.billingGoal]);

  // Local state for interactive marketing acquisition blueprints
  const [blueprints, setBlueprints] = useState<Blueprint[]>([
    {
      id: "google_ads",
      title: "Google Ads & Otimização de Pesquisa Intencional (CPL)",
      category: "GOOGLE TRÁFEGO",
      badge: "Inbound Ativo de Conversão",
      badgeColor: "bg-orange-500/15 text-orange-655 border-orange-200",
      estimatedImpact: "Redução de até 28% no Custo por Lead e incremento síncrono de +18% em leads PJ.",
      difficulty: "Moderado",
      summary: "Método pragmático de engenharia de busca para negativar termos de pouca relevância em tráfego pago, focar em termos transacionais (fundo de funil) e otimizar conversões de chamadas por WhatsApp de forma cirúrgica.",
      steps: [
        { id: "g_1", label: "Pesquisar e carregar lista de palavras-chave negativas (ex: grátis, fofoca, pdf, curso) para estancar vazamentos de budget diário", checked: true },
        { id: "g_2", label: "Ajustar tags globais de conversão do Google Ads no clique de correspondência direta dos botões flutuantes de WhatsApp", checked: false },
        { id: "g_3", label: "Diferenciar grupos de anúncios em correspondência de frase vs exata focado na dor específica do seu cliente-alvo", checked: false },
        { id: "g_4", label: "Criar uma Landing Page ultra-clean carregando abaixo de 1.5s dedicada exclusivamente a uma única promessa de solução", checked: false }
      ]
    },
    {
      id: "meta_ads",
      title: "Meta Ads & Engenharia de Criativos de Retenção Rápida",
      category: "META SOCIAL",
      badge: "Geração de Demanda",
      badgeColor: "bg-blue-500/15 text-blue-650 border-blue-200",
      estimatedImpact: "Aceleração do tráfego qualificado para WhatsApp duplicando cliques úteis sem subir custos.",
      difficulty: "Fácil",
      summary: "Mobilização de campanhas geolocalizadas baseadas em criativos de alta velocidade com ganchos fortes de 3 segundos (Hooks), focando em converter engajamentos casuais em atendimento corporativo síncrono.",
      steps: [
        { id: "m_1", label: "Gravar vídeos nativos de celular de até 15 segundos expondo uma dor latente comum do seu público ideal", checked: false },
        { id: "m_2", label: "Ajustar público geolocalizado com foco no raio operacional imediato para reduzir custos improdutivos de logística", checked: false },
        { id: "m_3", label: "Conectar o fluxo de anúncios de mensagens diretamente ao WhatsApp Business configurado com automação prévia de boas-vindas", checked: false },
        { id: "m_4", label: "Limitar a saturação de frequência de exibição da campanha sob no máximo 3.5 exibições semanais por usuário", checked: false }
      ]
    },
    {
      id: "referral_viral",
      title: "Programa de Indicação Direta (Referral) Bilateral",
      category: "ORGÂNICO / PARCEIROS",
      badge: "Multiplicador CAC Zero",
      badgeColor: "bg-emerald-500/15 text-emerald-650 border-emerald-200",
      estimatedImpact: "Até 25% dos novos clientes gerados de forma espontânea com custo marginal zero de mídia.",
      difficulty: "Fácil",
      summary: "Estruturação metódica de incentivos bilaterais simplificados no pós-venda para incentivar seus clientes atuais a compartilharem seu negócio com redes de contatos interessadas.",
      steps: [
        { id: "r_1", label: "Definir bônus bilateral atraente de desconto na fatura subsequente ou crédito para novos indicados no primeiro ciclo", checked: false },
        { id: "r_2", label: "Incluir banners de fácil envio e convite na tela inicial e no rodapé das mensagens eletrônicas de faturas periódicas", checked: false },
        { id: "r_3", label: "Treinar a equipe comercial e os operadores de pós-venda para pedir 2 indicações quentes no fechamento de cada NPS alto (9 ou 10)", checked: false },
        { id: "r_4", label: "Lançar ranking de parceiros indicativos trimestral premiando os campeões embaixadores com prêmios de interesse do nicho", checked: false }
      ]
    },
    {
      id: "crm_ltv",
      title: "Régua de CRM ativo & Alavancagem de Retenção (LTV)",
      category: "CRM RETENÇÃO",
      badge: "Expansão de Faturamento Interno",
      badgeColor: "bg-purple-500/15 text-purple-655 border-purple-200",
      estimatedImpact: "Upgrade de ticket médio gerando recorrência extraída de clientes já existentes sem novas despesas de aquisição.",
      difficulty: "Avançado",
      summary: "Maximização de receitas sob o mesmo cliente utilizando e-mails responsivos síncronos e lembretes periódicos de expiração para reconversão rápida.",
      steps: [
        { id: "c_1", label: "Estruturar réguas eletrônicas de e-mails educativos para leads frios contendo demonstrações e cases de sucesso real", checked: false },
        { id: "c_2", label: "Mapear datas de reabastecimento de faturas ou ciclos de uso para disparar notificação 5 dias antes da interrupção", checked: false },
        { id: "c_3", label: "Implementar campanhas de venda casada (cross-sell ou combos) oferecendo benefícios adicionais com desconto estratégico de conversão", checked: false },
        { id: "c_4", label: "Reconhecer clientes inativos a mais de 25 dias e acionar gatilho de resgate ativo com promoção única e tempo determinado", checked: false }
      ]
    }
  ]);

  // Marketing Performance Simulator States
  const [midiaBudget, setMidiaBudget] = useState<number>(3000);
  const [cpcPrice, setCpcPrice] = useState<number>(1.2);
  const [funnelConvRate, setFunnelConvRate] = useState<number>(12); // clicados para leads %
  const [comConvRate, setComConvRate] = useState<number>(18); // lead para cliente %
  const [ticketMedio, setTicketMedio] = useState<number>(240);
  const [ltvFrequency, setLtvFrequency] = useState<number>(4); // numero de compras sobre vida útil
  const [contributionMarginPct, setContributionMarginPct] = useState<number>(55); // margem de contribuição %

  // Live Calculations
  const estimatedClicks = cpcPrice > 0 ? Math.round(midiaBudget / cpcPrice) : 0;
  const estimatedLeads = Math.round(estimatedClicks * (funnelConvRate / 100));
  const newCustomers = Math.round(estimatedLeads * (comConvRate / 100)) || 1; // avoid divide by zero
  
  const calculatedCPL = estimatedLeads > 4 ? midiaBudget / estimatedLeads : 0;
  const calculatedCAC = midiaBudget / newCustomers;
  const estimatedRevenue = newCustomers * ticketMedio;
  const calculatedROAS = midiaBudget > 0 ? estimatedRevenue / midiaBudget : 0;
  
  const estimatedLTV = ticketMedio * ltvFrequency * (contributionMarginPct / 100);
  const ltvToCacRatio = calculatedCAC > 0 ? estimatedLTV / calculatedCAC : 0;

  // --- INTEGRATED BILLING GOAL, FUNNEL & ROI CALCULATIONS ---
  // 1. Current Billing (Soma das receitas)
  const currentActualRevenue = (transactions || [])
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // 2. Funnel metrics: History vs Projected
  // Historical context values
  const histCpc = cpcPrice || 1.2;
  const histClicks = Math.max(1, Math.round(midiaBudget / histCpc));
  const histClickToLeadRate = funnelConvRate; // e.g. 12%
  const histLeads = Math.round(histClicks * (histClickToLeadRate / 100));
  const histLeadToSaleRate = comConvRate; // e.g. 18%
  const histCustomers = Math.round(histLeads * (histLeadToSaleRate / 100)) || 1;
  const histTicket = ticketMedio || 240;
  const histRevenue = histCustomers * histTicket;
  
  // Projected calculations (adjusted by toggles)
  const projCpc = histCpc * (selectedFunnelTactics.includes("t_gads") ? 0.80 : 1.0);
  const projTrafficMult = selectedFunnelTactics.includes("t_meta") ? 1.35 : 1.0;
  const projClicks = Math.max(1, Math.round((midiaBudget / (projCpc || 0.1)) * projTrafficMult));
  
  const projClickToLeadRate = histClickToLeadRate + (selectedFunnelTactics.includes("t_gads") ? 3.0 : 0);
  const projLeads = Math.round(projClicks * (projClickToLeadRate / 100));
  
  const projLeadToSaleRate = histLeadToSaleRate + 
    (selectedFunnelTactics.includes("t_meta") ? 3.0 : 0) + 
    (selectedFunnelTactics.includes("t_referral") ? 8.0 : 0);
  const projCustomers = Math.round(projLeads * (projLeadToSaleRate / 100)) || 1;
  
  const projTicket = histTicket * (selectedFunnelTactics.includes("t_crm") ? 1.30 : 1.0);
  const projRevenue = projCustomers * projTicket;
  const projRoi = midiaBudget > 0 ? ((projRevenue - midiaBudget) / midiaBudget) * 100 : 0;

  // Gap Analysis & Sums
  const overallProjectedRevenueSum = currentActualRevenue + projRevenue;
  const goalAchievementPct = Math.round((overallProjectedRevenueSum / (targetRevenueGoal || 1)) * 100);
  const remainingGap = Math.max(0, targetRevenueGoal - currentActualRevenue);

  const isRoiBelowMinimum = projRoi < minRequiredRoi;

  const handleToggleStep = (blueprintId: string, stepId: string) => {
    sound.playTick();
    setBlueprints((prev) =>
      prev.map((bp) => {
        if (bp.id === blueprintId) {
          return {
            ...bp,
            steps: bp.steps.map((st) =>
              st.id === stepId ? { ...st, checked: !st.checked } : st
            )
          };
        }
        return bp;
      })
    );
  };

  const currentBlueprint = blueprints.find((b) => b.id === activeBlueprintId) || blueprints[0];
  const checkedCount = currentBlueprint.steps.filter((s) => s.checked).length;
  const progressPct = Math.round((checkedCount / currentBlueprint.steps.length) * 100);

  const handleActivateBlueprint = () => {
    sound.playClick();
    showToast(`Plano de Alavancagem de Marketing Ativado! Roteiro pronto para auditoria.`, "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Dynamic Upper Banner with Minimal White Styling */}
      <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1.5 flex-1 min-w-0">
            <span className="bg-orange-50 px-3 py-1 rounded-full text-orange-600 font-black text-[9px] uppercase tracking-widest border border-orange-100 inline-flex items-center gap-1.5 font-mono">
              <Megaphone size={11} className="text-orange-500 animate-pulse" /> QUADRO DE TRACEJO & ALAVANCAGEM DE MARKETING
            </span>
            <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-gray-900 mt-1">
              Marketing Estratégico & Engenharia de CAC PJ
            </h3>
            <p className="text-xs text-gray-500 max-w-2xl font-semibold leading-relaxed font-sans">
              O faturamento de escala depende de metodologias científicas de aquisição de clientes. 
              Substitua achismos de marketing por taxas de conversão de funil, controle do <strong className="text-gray-900 font-extrabold">CAC (Customer Acquisition Cost)</strong> e previsibilidade de <strong className="text-gray-900 font-extrabold">LTV (Lifetime Value)</strong>.
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-150 px-4 py-3 rounded-2xl flex flex-col items-center justify-center shrink-0 w-full md:w-40">
            <span className="text-[8.5px] font-black uppercase text-gray-400 tracking-wider">Ações Concluídas</span>
            <span className="text-xl font-black text-gray-900 font-mono mt-0.5">
              {blueprints.reduce((acc, bp) => acc + bp.steps.filter(s => s.checked).length, 0)}
              <span className="text-xs text-gray-400 font-normal"> / {blueprints.reduce((acc, bp) => acc + bp.steps.length, 0)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT PANEL: Marketing strategy selector */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-gray-150 p-5 rounded-[2.5rem] shadow-sm flex flex-col gap-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2 text-left">
              Biblioteca de Alavancagem de Mídia
            </h4>
            
            <div className="space-y-2.5">
              {blueprints.map((bp) => {
                const isActive = bp.id === activeBlueprintId;
                const completedSteps = bp.steps.filter((s) => s.checked).length;
                const bpPct = Math.round((completedSteps / bp.steps.length) * 100);
                
                return (
                  <button
                    key={bp.id}
                    onClick={() => {
                      setActiveBlueprintId(bp.id);
                      sound.playClick();
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 focus:outline-none relative overflow-hidden group",
                      isActive
                        ? "bg-[#141414] text-white border-[#141414] shadow-md"
                        : "bg-gray-55/40 hover:bg-gray-50 border-gray-150 hover:border-gray-300 text-gray-800"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2 w-full">
                      <span className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider leading-none",
                        isActive ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-gray-150 text-gray-500 border-gray-200"
                      )}>
                        {bp.category}
                      </span>
                      <span className="text-[9px] font-bold font-mono opacity-80 shrink-0">
                        {bpPct}% feito
                      </span>
                    </div>

                    <h5 className="font-extrabold text-xs leading-snug tracking-tight">
                      {bp.title}
                    </h5>

                    {/* Progress indicator bar */}
                    <div className="w-full h-1 bg-gray-200/50 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-550",
                          bp.id === "google_ads" ? "bg-orange-500" : bp.id === "meta_ads" ? "bg-blue-500" : bp.id === "referral_viral" ? "bg-emerald-500" : "bg-purple-500"
                        )}
                        style={{ width: `${bpPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Active Blueprint Marketing Projection Card */}
          <div className="bg-[#141414] text-white p-5 rounded-[2.5rem] border border-gray-150/10 space-y-3.5 relative overflow-hidden flex-1 text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/[0.03] rounded-full blur-2xl pointer-events-none" />
            
            <h4 className="text-[10px] font-black tracking-widest text-orange-400 uppercase">
              Projeção de Performance de Mídia
            </h4>
            
            <div className="space-y-3">
              <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Impacto Direto Gerencial</p>
                <p className="text-xs font-semibold text-gray-200 mt-1 leading-relaxed">
                  {currentBlueprint.estimatedImpact}
                </p>
              </div>

              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-gray-400 font-semibold">Dificuldade Operacional:</span>
                <span className={cn(
                  "font-black uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded border",
                  currentBlueprint.difficulty === "Fácil"
                    ? "bg-emerald-500/10 border-emerald-600/20 text-emerald-400"
                    : currentBlueprint.difficulty === "Moderado"
                      ? "bg-amber-500/10 border-amber-600/20 text-amber-500"
                      : "bg-rose-500/10 border-rose-600/20 text-rose-400"
                )}>
                  {currentBlueprint.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Interactive Checklist and the brand-new Scientific CAC/LTV/ROAS Simulator */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          
          {/* Section 1: Active Interactive Checklist */}
          <div className="bg-white border border-gray-150 p-6 rounded-[2.5rem] shadow-sm flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
              <div className="text-left">
                <span className={cn(
                  "text-[9px] font-black uppercase px-2 py-0.5 rounded border inline-block mb-1 font-mono tracking-widest",
                  currentBlueprint.badgeColor
                )}>
                  {currentBlueprint.badge}
                </span>
                <h4 className="font-extrabold text-[#141414] text-sm uppercase leading-none">
                  Diretrizes de Implementação Tática
                </h4>
              </div>
              
              <div className="text-right">
                <div className="text-xs font-black text-gray-950 font-mono">
                  {progressPct}% Executado
                </div>
                <div className="text-[9px] text-gray-450 font-semibold uppercase tracking-wider mt-0.5">
                  ({checkedCount} de {currentBlueprint.steps.length} etapas)
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-550 leading-relaxed font-semibold text-left">
              {currentBlueprint.summary}
            </p>

            {/* Checklist Loop */}
            <div className="space-y-2.5 pt-2 flex-1">
              {currentBlueprint.steps.map((step) => (
                <div
                  key={step.id}
                  onClick={() => handleToggleStep(currentBlueprint.id, step.id)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none",
                    step.checked
                      ? "bg-emerald-50/45 border-emerald-200 text-slate-900"
                      : "bg-gray-50/70 border-gray-150 hover:border-gray-250 text-gray-600"
                  )}
                >
                  <button className="focus:outline-none shrink-0 cursor-pointer">
                    {step.checked ? (
                      <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-100" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border border-gray-300 bg-white" />
                    )}
                  </button>
                  <span className={cn(
                    "text-xs font-bold leading-relaxed text-left",
                    step.checked ? "line-through text-gray-400 decoration-2 decoration-emerald-200/50" : ""
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom button trigger */}
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center gap-3">
              <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
                Auditoria de Progresso Ativa
              </span>
              <button
                onClick={handleActivateBlueprint}
                className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                🏁 Registrar Conclusão de Roteiro
              </button>
            </div>
          </div>

          {/* New Section 2: Pure Scientific CAC, LTV and ROAS Marketing leverage Simulator */}
          <div className="bg-white border border-gray-150 p-6 rounded-[2.5rem] shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                <Sliders size={15} />
              </span>
              <div className="text-left">
                <h4 className="font-extrabold text-gray-900 text-xs uppercase leading-tight">
                  Simulador Científico de Alavancagem Comercial (CAC & LTV)
                </h4>
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                  Preveja o ROI Real, Custo de Aquisição (CAC), e a real sustentabilidade (LTV/CAC) da sua verba de mídia
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              
              {/* Sliders Area */}
              <div className="space-y-3.5">
                {/* Midia Budget */}
                <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-2xl border border-gray-150">
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-700 font-mono">
                    <span>Verba Mensal de Mídia (Ads)</span>
                    <span className="text-gray-950 font-black font-mono">{formatCurrency(midiaBudget)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="500" 
                    max="50000" 
                    step="500"
                    value={midiaBudget} 
                    onChange={(e) => {
                      sound.playTick();
                      setMidiaBudget(Number(e.target.value));
                    }}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                {/* CPC Slider */}
                <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-2xl border border-gray-150">
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-700 font-mono">
                    <span>Custo médio por Clique (CPC)</span>
                    <span className="text-gray-950 font-black font-mono">{formatCurrency(cpcPrice)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.2" 
                    max="8" 
                    step="0.1"
                    value={cpcPrice} 
                    onChange={(e) => {
                      sound.playTick();
                      setCpcPrice(Number(e.target.value));
                    }}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[8px] text-gray-400 font-bold uppercase">
                    <span>Cliques estimados:</span>
                    <span>{estimatedClicks} cliques</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Conversão Funil Cliques -> Leads */}
                  <div className="space-y-1 bg-gray-50/55 p-3 rounded-xl border border-gray-150">
                    <span className="text-[8.5px] font-black uppercase text-gray-500 block">Conversão LP / WhatsApp (%)</span>
                    <input 
                      type="number"
                      min="1"
                      max="40"
                      value={funnelConvRate}
                      onChange={(e) => setFunnelConvRate(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs font-black font-mono py-1.5 px-2.5 outline-none focus:border-orange-500"
                    />
                    <span className="text-[8px] text-gray-400 font-medium block mt-1">{estimatedLeads} leads obtidos</span>
                  </div>

                  {/* Conversão Comercial Leads -> Clientes */}
                  <div className="space-y-1 bg-gray-50/55 p-3 rounded-xl border border-gray-150">
                    <span className="text-[8.5px] font-black uppercase text-gray-500 block">Taxa de Conversão Vendas (%)</span>
                    <input 
                      type="number"
                      min="1"
                      max="60"
                      value={comConvRate}
                      onChange={(e) => setComConvRate(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs font-black font-mono py-1.5 px-2.5 outline-none focus:border-orange-500"
                    />
                    <span className="text-[8px] text-gray-400 font-medium block mt-1">{newCustomers} clientes novos</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Ticket Medio */}
                  <div className="space-y-1 bg-gray-50/55 p-3 rounded-xl border border-gray-150">
                    <span className="text-[8.5px] font-black uppercase text-gray-500 block">Ticket Médio (Venda inicial)</span>
                    <input 
                      type="number"
                      step="10"
                      value={ticketMedio}
                      onChange={(e) => setTicketMedio(Math.max(10, Number(e.target.value)))}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs font-black font-mono py-1.5 px-2.5 outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Frequencia LTV */}
                  <div className="space-y-1 bg-gray-50/55 p-3 rounded-xl border border-gray-150">
                    <span className="text-[8.5px] font-black uppercase text-gray-500 block">Frequência Recompra Anual</span>
                    <select
                      value={ltvFrequency}
                      onChange={(e) => setLtvFrequency(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-lg text-xs font-black py-1.5 px-1.5 outline-none focus:border-orange-500"
                    >
                      <option value="1">Uso único (1x)</option>
                      <option value="2">Semestral (2x)</option>
                      <option value="4">Trimestral (4x)</option>
                      <option value="12">Mensal (12x)</option>
                      <option value="24">Quinzenal (24x)</option>
                    </select>
                  </div>
                </div>

              </div>
              
              {/* Gauges and scientific diagnostics */}
              <div className="bg-gray-50/50 border border-gray-150 p-5 rounded-[2rem] flex flex-col justify-between space-y-4">
                
                {/* Critical Output indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-3.5 rounded-2xl border border-gray-150/70">
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest block font-mono">
                      CPL Estimado
                    </span>
                    <div className="text-xl font-black text-gray-900 font-mono mt-0.5">
                      {formatCurrency(calculatedCPL)}
                    </div>
                    <span className="text-[8px] text-gray-400 font-bold block mt-0.5 uppercase tracking-tight">Custo por Lead</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-gray-150/70">
                    <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest block font-mono">
                      CAC Calculado
                    </span>
                    <div className="text-xl font-black text-gray-900 font-mono mt-0.5">
                      {formatCurrency(calculatedCAC)}
                    </div>
                    <span className="text-[8px] text-gray-400 font-bold block mt-0.5 uppercase tracking-tight">Custo de Aquisição</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-3.5 rounded-2xl border border-gray-150/70">
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block font-mono">
                      Faturamento Ads
                    </span>
                    <div className="text-xl font-black text-gray-900 font-mono mt-0.5">
                      {formatCurrency(estimatedRevenue)}
                    </div>
                    <span className="text-[8.5px] font-bold text-gray-500 block mt-0.5 font-mono">
                      ROAS: <strong className="text-[#141414]">{calculatedROAS.toFixed(2)}x</strong>
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-gray-150/70">
                    <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest block font-mono">
                      LTV Estimado
                    </span>
                    <div className="text-xl font-black text-gray-900 font-mono mt-0.5">
                      {formatCurrency(estimatedLTV)}
                    </div>
                    <span className="text-[8.5px] font-bold text-gray-400 block mt-0.5 uppercase tracking-tight">
                      Vida Útil Cliente Margem
                    </span>
                  </div>
                </div>

                {/* Scientif Ratio Banner */}
                <div className="p-3.5 rounded-2xl bg-zinc-900 text-white text-left relative overflow-hidden flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block font-mono">Sustentabilidade Operacional</span>
                    <div className="text-xl font-black text-white font-mono mt-0.5 flex items-baseline gap-1.5">
                      {ltvToCacRatio.toFixed(1)}x
                      <span className="text-[10px] text-zinc-400 font-medium">LTV / CAC</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[8px] font-black font-mono uppercase px-2 py-0.5 rounded tracking-widest border",
                      ltvToCacRatio >= 3 
                        ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-400" 
                        : ltvToCacRatio >= 1.8 
                          ? "bg-amber-500/20 border-amber-500/35 text-amber-400" 
                          : "bg-rose-500/20 border-rose-500/35 text-rose-400"
                    )}>
                      {ltvToCacRatio >= 3 ? "EFICIENTE (SAUDÁVEL)" : ltvToCacRatio >= 1.8 ? "ALERTA (MODERADO)" : "INSUFICIENTE"}
                    </span>
                  </div>
                </div>

                {/* Diagnostic box */}
                <div className={cn(
                  "p-3 rounded-xl border text-[10.5px] font-semibold text-left leading-relaxed transition-colors duration-200",
                  ltvToCacRatio >= 3 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-850" 
                    : ltvToCacRatio >= 1.8 
                      ? "bg-amber-50 border-amber-100 text-amber-850" 
                      : "bg-rose-50 border-rose-100 text-rose-850"
                )}>
                  {ltvToCacRatio >= 3 ? (
                    "🟢 Suas métricas de alavancagem comercial estão excelentes! O LTV gerencia com folga o CAC exigido pela mídia (LTV/CAC > 3x), indicando que vale a pena injetar mais budget diário de forma audaciosa."
                  ) : ltvToCacRatio >= 1.8 ? (
                    "🟡 Alerta de rentabilidade limítrofe. Sua relação LTV/CAC exige otimização rápida de canis ou aumento do ciclo de fidelização para evitar esgoelamento sobre as margens residuais do negócio."
                  ) : (
                    "🔴 Relação LTV/CAC deficitária! O custo de aquisição (CAC) via mídia paga está alto demais para o retorno que o cliente entrega no ciclo de vida do negócio. Reavalie o CPC ou promova combos urgentes de upsell."
                  )}
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

      {/* SECTION 3: INTEGRATED GOAL PLANNER, TACTICAL FUNNEL & ROI ALERTS */}
      <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-[2.5rem] shadow-sm space-y-6 text-left mt-6 animate-in fade-in duration-450">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-150">
          <div className="space-y-1 text-left">
            <span className="bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 font-black text-[9px] uppercase tracking-widest border border-indigo-100 inline-flex items-center gap-1.5 font-mono">
              <Target size={11} className="text-indigo-500 animate-pulse" /> MAPEAMENTO E SOMA DE METAS DE FATURAMENTO
            </span>
            <h4 className="text-lg font-black uppercase italic tracking-tight text-gray-900 mt-1">
              Planejador de Metas, Alinhamento de Faturamento & ROI Alertas
            </h4>
            <p className="text-[11px] text-gray-400 font-semibold leading-relaxed max-w-3xl">
              Selecione seu objetivo de faturamento, some as receitas contábeis do DRE real e projete o impacto de novas táticas de escala. 
              O sistema confronta o funil resultante com o histórico de conversões e emite alertas de risco fiscal se o ROI da tática estiver abaixo do mínimo estabelecido.
            </p>
          </div>
          <div className="bg-indigo-50/60 border border-indigo-150/50 px-4 py-2.5 rounded-2xl flex items-center gap-2">
            <Activity size={18} className="text-indigo-600 animate-spin" style={{ animationDuration: "3s" }} />
            <div className="text-left font-sans">
              <span className="text-[8px] font-black uppercase text-indigo-400 block tracking-wider font-mono">Motor de Projeção</span>
              <strong className="text-xs font-black text-indigo-800">Científico Síncrono</strong>
            </div>
          </div>
        </div>

        {/* Core Inputs & Dashboard Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Inputs Section (Left - 5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Metas Setup */}
            <div className="bg-gray-50/60 p-5 rounded-3xl border border-gray-150 space-y-4">
              <h4 className="text-[10px] font-black uppercase text-gray-550 tracking-wider flex items-center gap-1">
                <span>🎯</span> 1. Alvos de Faturamento & Parâmetros
              </h4>

              {/* Billing Goal */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-600 uppercase text-[10px]">Objetivo de Faturamento</span>
                  <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-0.5">
                    <span className="text-gray-450 text-[10px] font-bold">R$</span>
                    <input
                      type="number"
                      min="1000"
                      max="1000000"
                      value={targetRevenueGoal}
                      onChange={(e) => {
                        setTargetRevenueGoal(Math.max(0, parseInt(e.target.value) || 0));
                      }}
                      className="w-24 text-right font-black font-mono text-gray-800 bg-transparent focus:outline-none focus:ring-0 text-xs"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="400000"
                  step="5000"
                  value={targetRevenueGoal}
                  onChange={(e) => {
                    sound.playClick();
                    setTargetRevenueGoal(parseInt(e.target.value));
                  }}
                  className="w-full h-1 bg-gray-250 rounded appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* ROI Mínimo */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-600 uppercase text-[10px]">ROI de Mídia Mínimo Esperado</span>
                  <span className="font-mono font-black text-indigo-700">
                    {minRequiredRoi}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={minRequiredRoi}
                  onChange={(e) => {
                    sound.playTick();
                    setMinRequiredRoi(parseInt(e.target.value));
                  }}
                  className="w-full h-1 bg-gray-250 rounded appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Sum of Realized Values (Soma do valor atual) */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-gray-150/15 space-y-4">
              <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider font-mono">
                📊 2. Receita Contábil Atual (DRE Somado)
              </h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Faturamento Atual Real</span>
                  <strong className="text-base font-mono font-black text-white block mt-0.5">
                    {formatCurrency(currentActualRevenue)}
                  </strong>
                  <span className="text-[8.5px] text-emerald-400 font-semibold block mt-0.5">
                    ({transactions.length} transações brutas)
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Lacuna de Faturamento</span>
                  <strong className="text-base font-mono font-black text-orange-400 block mt-0.5">
                    {formatCurrency(remainingGap)}
                  </strong>
                  <span className="text-[8.5px] text-gray-400 block mt-0.5 font-sans">
                    Falta comercializar
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <div className="flex justify-between items-center text-[9px] font-black">
                  <span>Atingimento da Meta via Histórico:</span>
                  <span className="font-mono">
                    {Math.round((currentActualRevenue / (targetRevenueGoal || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round((currentActualRevenue / (targetRevenueGoal || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Tactics Selector */}
            <div className="bg-gray-50/60 p-5 rounded-3xl border border-gray-150 space-y-3">
              <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center justify-between">
                <span>⚡ 3. Projetar Táticas de Ativação</span>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black font-sans">
                  {selectedFunnelTactics.length} ATIVAS
                </span>
              </h5>
              
              <div className="space-y-2">
                {[
                  {
                    id: "t_gads",
                    name: "Google Ads (Palavras-Chave Fundo de Funil)",
                    impactStr: "Corta CPC em 20% & Escala conversão Click-to-Lead em +3%",
                    badge: "Google Ads",
                    badgeColor: "bg-orange-50 border-orange-200 text-orange-700"
                  },
                  {
                    id: "t_meta",
                    name: "Meta Ads (Criativos de Retenção Dinâmica)",
                    impactStr: "Aumenta Cliques em +35% (mesma verba) & Sobe conversão Lead-to-Cust em +3%",
                    badge: "Meta Social",
                    badgeColor: "bg-blue-50 border-blue-200 text-blue-700"
                  },
                  {
                    id: "t_referral",
                    name: "Programa de Indicação Bilateral Ativo",
                    impactStr: "Alavanca fluxo de recomendação crescendo conversão final em +8% (CAC zero)",
                    badge: "Indicação",
                    badgeColor: "bg-emerald-50 border-emerald-200 text-emerald-700"
                  },
                  {
                    id: "t_crm",
                    name: "CRM Ativo & combos de UpSell (LTV Upgrade)",
                    impactStr: "Impulsiona Ticket Médio Corporativo em +30% com ofertas associadas",
                    badge: "CRM Retenção",
                    badgeColor: "bg-purple-50 border-purple-200 text-purple-700"
                  }
                ].map((tac) => {
                  const isChecked = selectedFunnelTactics.includes(tac.id);
                  return (
                    <button
                      key={tac.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedFunnelTactics((prev) =>
                          prev.includes(tac.id) ? prev.filter((x) => x !== tac.id) : [...prev, tac.id]
                        );
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer",
                        isChecked 
                          ? "bg-white border-indigo-650 shadow-sm ring-1 ring-indigo-500/20" 
                          : "bg-gray-50/30 hover:bg-white border-gray-200 text-gray-700"
                      )}
                    >
                      <div className="pt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-[17px] h-[17px] rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-[17px] h-[17px] rounded-full border border-gray-300 bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-extrabold text-[11px] text-slate-800 truncate">{tac.name}</span>
                          <span className={cn("text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0 border font-sans", tac.badgeColor)}>
                            {tac.badge}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-gray-450 font-semibold mt-0.5 leading-tight">
                          {tac.impactStr}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Results Comparison and Alerts Section (Right - 7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Side-by-side Conversion Funnel Comparison */}
            <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden flex flex-col justify-between">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div className="text-left">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">4. Impacto Comparativo de Conversão no Funil</h4>
                  <p className="text-[10px] text-gray-400 font-medium">Confronto matemático das táticas contra o histórico de conversão base.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-black uppercase font-mono">
                  Sustentabilidade: {projCustomers > 0 ? (estimatedLTV / (midiaBudget / projCustomers)).toFixed(1) : "0"}x LTV/CAC
                </span>
              </div>

              {/* Comparison table */}
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[8.5px] font-black text-gray-450 uppercase tracking-widest">
                      <th className="py-2">Métrica do Funil</th>
                      <th className="py-2 text-right">Histórico (Base)</th>
                      <th className="py-2 text-right text-indigo-600 font-extrabold">Projetado com Táticas</th>
                      <th className="py-2 text-right">Incremento Lift</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-slate-750">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono text-[10.5px]">Custo por Clique (CPC)</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(histCpc)}</td>
                      <td className="py-2 text-right font-mono text-indigo-600 font-bold">{formatCurrency(projCpc)}</td>
                      <td className="py-2 text-right font-mono text-emerald-600">
                        {projCpc < histCpc ? `-${Math.round((1 - projCpc / histCpc) * 100)}%` : "Estável"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono text-[10.5px]">Cliques Totais Captados</td>
                      <td className="py-2 text-right font-mono">{histClicks}</td>
                      <td className="py-2 text-right font-mono text-indigo-600 font-bold">{projClicks}</td>
                      <td className="py-2 text-right font-mono text-emerald-600">
                        {projClicks > histClicks ? `+${Math.round((projClicks / histClicks - 1) * 100)}%` : "Estável"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-[#fafafa]">
                      <td className="py-2 font-bold font-sans text-[11px]">Conversão LP (Click-to-Lead)</td>
                      <td className="py-2 text-right font-mono">{histClickToLeadRate.toFixed(1)}%</td>
                      <td className="py-2 text-right font-mono text-indigo-600 font-extrabold">{projClickToLeadRate.toFixed(1)}%</td>
                      <td className="py-2 text-right font-mono text-indigo-600">+{ (projClickToLeadRate - histClickToLeadRate).toFixed(1) }% p.p.</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono text-[10.5px]">Leads Qualificados Gerados</td>
                      <td className="py-2 text-right font-mono">{histLeads}</td>
                      <td className="py-2 text-right font-mono text-indigo-600 font-bold">{projLeads}</td>
                      <td className="py-2 text-right font-mono text-emerald-600">+{projLeads - histLeads} leads</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-[#fafafa]">
                      <td className="py-2 font-bold font-sans text-[11px]">Conversão Vendas (Lead-to-Cust)</td>
                      <td className="py-2 text-right font-mono">{histLeadToSaleRate.toFixed(1)}%</td>
                      <td className="py-2 text-right font-mono text-indigo-600 font-extrabold">{projLeadToSaleRate.toFixed(1)}%</td>
                      <td className="py-2 text-right font-mono text-indigo-600">+{ (projLeadToSaleRate - histLeadToSaleRate).toFixed(1) }% p.p.</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-bold text-slate-800">Eficiência Geral do Funil</td>
                      <td className="py-2 text-right font-mono">
                        {((histCustomers / (histClicks || 1)) * 100).toFixed(2)}%
                      </td>
                      <td className="py-2 text-right font-mono text-indigo-600 font-bold">
                        {((projCustomers / (projClicks || 1)) * 100).toFixed(2)}%
                      </td>
                      <td className="py-2 text-right font-mono text-emerald-600">
                        {Math.round(((projCustomers / (projClicks || 1)) / (Math.max(0.0001, histCustomers / (histClicks || 1))) - 1) * 100)}% lift
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-bold text-slate-900">Conversões (Contratos Fechados)</td>
                      <td className="py-2 text-right font-mono text-slate-500 font-extrabold">{histCustomers}</td>
                      <td className="py-2 text-right font-mono text-indigo-600 font-black bg-indigo-50/20">{projCustomers}</td>
                      <td className="py-2 text-right font-mono text-emerald-600 font-black">+{projCustomers - histCustomers} u.</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono text-[10.5px]">Ticket Médio Comercial</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(histTicket)}</td>
                      <td className="py-2 text-right font-mono text-indigo-600 font-bold">{formatCurrency(projTicket)}</td>
                      <td className="py-2 text-right font-mono text-emerald-600">
                        {projTicket > histTicket ? `+${Math.round((projTicket / histTicket - 1) * 100)}%` : "Estável"}
                      </td>
                    </tr>
                    <tr className="bg-indigo-50/30 border-t border-indigo-150">
                      <td className="py-2.5 font-bold text-indigo-950">Faturamento Mídia Estimado</td>
                      <td className="py-2.5 text-right font-mono text-gray-400">{formatCurrency(histRevenue)}</td>
                      <td className="py-2.5 text-right font-mono text-indigo-800 font-black bg-indigo-50/60">
                        {formatCurrency(projRevenue)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-emerald-700 font-extrabold">
                        +{formatCurrency(projRevenue - histRevenue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Target Integration Goal Analysis Grid */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 text-left space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.04] rounded-full blur-2xl pointer-events-none" />
              <h5 className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono leading-none flex items-center gap-1.5">
                <span>🎯</span> Meta Consolidada (Faturamento Real Somado + Faturamento Mídia)
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <span className="block text-[8px] uppercase font-bold text-gray-400">Objetivo Faturamento</span>
                  <strong className="text-[13px] font-mono text-white block mt-0.5">{formatCurrency(targetRevenueGoal)}</strong>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <span className="block text-[8px] uppercase font-bold text-gray-400">Total Integrado (Atual + Mídia)</span>
                  <strong className="text-[13px] font-mono text-emerald-400 block mt-0.5">
                    {formatCurrency(overallProjectedRevenueSum)}
                  </strong>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <span className="block text-[8px] uppercase font-bold text-gray-400">Atingimento Real</span>
                  <strong className="text-[13px] font-mono text-orange-400 block mt-0.5">{goalAchievementPct}%</strong>
                </div>
              </div>

              {/* Gauge achievement feedback */}
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-2xl text-[10px] leading-relaxed">
                {overallProjectedRevenueSum >= targetRevenueGoal ? (
                  <p className="font-semibold text-emerald-400 font-sans">
                    🎉 <strong>Meta de Faturamento Viabilizada!</strong> Ao somar seu faturamento atualizado de {formatCurrency(currentActualRevenue)} com o faturamento adicional de mídia de {formatCurrency(projRevenue)}, seu faturamento alcança <strong>{formatCurrency(overallProjectedRevenueSum)}</strong>, cobrindo com plenitude {goalAchievementPct}% do alvo selecionado de faturamento.
                  </p>
                ) : (
                  <p className="font-semibold text-slate-300 font-sans">
                    ⚠️ <strong>Suporte Parcial de Faturamento.</strong> O faturamento integrado projetado para o ciclo atinge {formatCurrency(overallProjectedRevenueSum)} ({goalAchievementPct}% da meta). Para vencer a lacuna remanescente de <strong>{formatCurrency(Math.max(0, targetRevenueGoal - overallProjectedRevenueSum))}</strong>, experimente ativar novas táticas ou elevar o Ticket Médio de Venda Comercial.
                  </p>
                )}
              </div>
            </div>

            {/* Expected ROI and Alert block */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[9.5px] font-black uppercase text-gray-500 tracking-wider font-sans">
                  📉 5. Auditoria de Viabilidade de ROI
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                  Tolerância Mínima: <strong className="text-[#141414] font-mono">{minRequiredRoi}%</strong>
                </span>
              </div>

              {/* ROI calculated display card */}
              <div className={cn(
                "p-4 rounded-3xl border text-left grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-all",
                isRoiBelowMinimum 
                  ? "bg-rose-50 border-rose-200" 
                  : "bg-emerald-50 border-emerald-250"
              )}>
                <div className="md:col-span-4 text-center md:text-left">
                  <span className="text-[8px] font-black text-gray-450 uppercase block tracking-wider leading-none">
                    ROI Incremental de Mídia
                  </span>
                  <strong className={cn(
                    "text-2xl font-mono block mt-1 font-black",
                    isRoiBelowMinimum ? "text-rose-600" : "text-emerald-700"
                  )}>
                    {projRoi.toFixed(0)}%
                  </strong>
                  <span className="text-[9px] text-gray-500 block font-bold uppercase mt-1 leading-none font-sans">
                    ROAS: {projCustomers > 0 ? (projRevenue / (midiaBudget || 1)).toFixed(2) : "0"}x
                  </span>
                </div>

                <div className="md:col-span-8 space-y-1.5 border-t md:border-t-0 md:border-l border-gray-250/40 pt-3 md:pt-0 md:pl-4">
                  {isRoiBelowMinimum ? (
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-rose-800 text-[11px] flex items-center gap-1.5 uppercase leading-none">
                        <AlertTriangle size={14} className="text-rose-600 animate-bounce" /> ALERTA: Retorno Abaixo do Mínimo Estipulado!
                      </h5>
                      <p className="text-[10px] leading-relaxed text-rose-955 font-bold">
                        Risco Comercial Ativo! O ROI projetado de <strong>{projRoi.toFixed(0)}%</strong> está abaixo do limite admissível de <strong>{minRequiredRoi}%</strong>. 
                        A escala sob essas circunstâncias pode comprimir perigosamente seu saldo operacional. 
                        <strong>Ação Corretiva:</strong> Habilite o <em>CRM LTV Upgrade</em> para reajustar o Ticket Médio de Venda Comercial em +30% ou diminua o CPC ativo por meio da tática do Google Ads Fundo de Funil de imediato para restabelecer a segurança financeira.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-emerald-800 text-[11px] flex items-center gap-1.5 uppercase leading-none">
                        <CheckCircle2 size={14} className="text-emerald-600" /> VALIDAÇÃO: ROI Projetado Seguro para Escalar!
                      </h5>
                      <p className="text-[10px] leading-relaxed text-emerald-950 font-bold">
                        Viabilidade Econômica Aprovada. O retorno sob ações comerciais táticas atinge <strong>{projRoi.toFixed(0)}%</strong>, superando com margem segura as diretrizes de viabilidade de <strong>{minRequiredRoi}%</strong>. 
                        A modelagem assegura uma ingestão segura de lucratividade líquida de vendas, protegendo o caixa corporativo de sua matriz de faturamento.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
