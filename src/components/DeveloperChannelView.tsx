import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  MessageSquare, 
  Code2, 
  Sparkles, 
  Clock, 
  User, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  Smile, 
  Layers,
  Wrench,
  ShieldCheck,
  CheckCircle,
  HelpCircle as QuestionIcon,
  Share2,
  Activity,
  ShieldAlert,
  Check,
  Lock,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign
} from "lucide-react";
import { sound } from "../utils/SoundEngine";
import { cn } from "../lib/utils";

export default function DeveloperChannelView() {
  const { 
    developerMessages, 
    addDeveloperMessage, 
    addDeveloperReply, 
    profile, 
    transactions,
    categories,
    user, 
    isDemoMode, 
    t, 
    showToast 
  } = useFinance();

  const [subject, setSubject] = useState<string>("feature");
  const [content, setContent] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // Administrative perspective toggle and reply states
  const isAdminUser = user?.email === "cristianmilkymoo@gmail.com";
  const [adminPerspective, setAdminPerspective] = useState<boolean>(isAdminUser);
  const [replyText, setReplyText] = useState<string>("");
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);

  // Data Sharing Toggle
  const userKey = user?.uid || "demo";
  const [dataShared, setDataShared] = useState<boolean>(() => {
    return localStorage.getItem(`dafne_audit_data_shared_${userKey}`) === "true";
  });

  const toggleDataSharing = () => {
    const newValue = !dataShared;
    setDataShared(newValue);
    localStorage.setItem(`dafne_audit_data_shared_${userKey}`, String(newValue));
    sound.playClick();
    if (newValue) {
      showToast("Auditoria Visual Ativada! Seus dados financeiros foram compartilhados com segurança com o Administrador.", "success");
    } else {
      showToast("Compartilhamento revogado. O Administrador não poderá visualizar seus relatórios.", "info");
    }
  };

  // Live Bidirectional Chat Simulator Typing Indicators
  const [isDevTyping, setIsDevTyping] = useState<boolean>(false);
  const [isClientTyping, setIsClientTyping] = useState<boolean>(false);

  // Auto Reply Trigger for fully functional live dynamic feel
  const triggerAutoAdminReply = (msgId: string) => {
    setIsDevTyping(true);
    setTimeout(async () => {
      setIsDevTyping(false);
      const responses = [
        "Olá! Entendi perfeitamente sua questão técnica. Já estou com os dados consolidados da sua empresa compartilhados e iniciando uma análise completa do seu DRE. Aguarde um instante enquanto desenho feedback de auditoria estrutural.",
        "Recebido com sucesso. Sua estrutura de custos e despesas aponta pequenas flutuações operacionais. Recomendo fazermos uma auditoria do seu Markup e das alíquotas de imposto. Já estou pronto para guiar com sugestões.",
        "Excelente relato! Registrei isso no plano de melhorias semanais da nossa roadmap. Você andou fazendo conciliações na sandbox recentemente?",
        "Análise paralela concluída com absoluto sucesso! Os indicadores do cockpit estão operando com consistência sínclita perfeita. Suporte técnico liberado para responder suas dúvidas."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      try {
        await addDeveloperReply(msgId, randomResponse, "developer");
      } catch (err) {
        console.error("Auto reply error", err);
      }
    }, 4000);
  };

  const triggerAutoClientReply = (msgId: string) => {
    setIsClientTyping(true);
    setTimeout(async () => {
      setIsClientTyping(false);
      const responses = [
        "Muito obrigado pelo retorno rápido, Dr.! Vou ajustar exatamente agora esses gastos de OPEX nas minhas categorias para regularizar a meta de EBITDA.",
        "Excelente orientação técnica! O markup multiplicador de fato corrigiu as perdas de CMV nas vendas corporativas. Valeu demais!",
        "Perfeito. Acabei de habilitar o compartilhamento da auditoria. Pode inspecionar todos os meus relatórios DRE e dar seu parecer para reestruturação financeira?",
        "Entendido! Vou alinhar com nosso contador de confiança a respeito da alíquota PJ e farei novos testes na sandbox amanhã cedo!"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      try {
        await addDeveloperReply(msgId, randomResponse, "user");
      } catch (err) {
        console.error("Auto client reply error", err);
      }
    }, 4500);
  };

  const subjects = [
    { id: "bug", label: "🐛 Bug / Bug Report", color: "text-red-500 bg-red-100/50 border-red-250", icon: <Bug size={14} className="text-red-500" /> },
    { id: "feature", label: "💡 Solicitação de Recurso", color: "text-amber-500 bg-amber-100/50 border-amber-250", icon: <Lightbulb size={14} className="text-amber-600" /> },
    { id: "question", label: "❓ Dúvida Técnica", color: "text-blue-500 bg-blue-100/50 border-blue-250", icon: <HelpCircle size={14} className="text-blue-500" /> },
    { id: "layout", label: "🎨 Sugestão de UI/Layout", color: "text-purple-500 bg-purple-100/50 border-purple-250", icon: <Layers size={14} className="text-purple-500" /> },
    { id: "appreciation", label: "🌸 Elogio à Plataforma", color: "text-emerald-500 bg-emerald-100/50 border-emerald-250", icon: <Smile size={14} className="text-emerald-500" /> },
    { id: "other", label: "⚙️ Outros Assuntos", color: "text-gray-500 bg-gray-100/50 border-gray-250", icon: <Code2 size={14} className="text-gray-500" /> }
  ];

  const quickReplies = [
    {
      label: "🐛 Bug Solucionado",
      text: "Olá! Confirmamos o comportamento reportado por você. Nosso time de engenharia já aplicou o patch de correção e a funcionalidade está normalizada! Obrigado pelo aviso e por nos ajudar a blindar o sistema."
    },
    {
      label: "💡 Recurso Aprovado",
      text: "Excelente sugestão! Nós aprovamos essa solicitação de recurso e a adicionamos ao nosso roadmap semanal de lançamentos operacionais. Avisaremos assim que estiver liberada na sandbox!"
    },
    {
      label: "❓ Orientação Técnica",
      text: "Olá! Para essa questão técnica, recomendamos verificar o novo Roteiro de Crescimento na aba do Planejamento Estratégico ou ajustar as diretrizes tributárias. Nosso time está à disposição para auxiliá-lo!"
    },
    {
      label: "🤝 Suporte Concluído",
      text: "Olá! Muito obrigado pelo contato e pela contribuição direta para o aprimoramento do sistema. Seu chamado foi analisado e devidamente atualizado. Conta com a nossa equipe sempre!"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSending(true);
    try {
      await addDeveloperMessage(subject, content);
      setContent("");
      sound.playClick();
      showToast("Bilhete enviado e registrado na sandbox!", "success");
      // Find the message we just sent (which would trigger typing simulation if we want instant feedback)
      setIsDevTyping(true);
      setTimeout(() => {
        setIsDevTyping(false);
        sound.playAiNotification();
      }, 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const roundedMessages = developerMessages || [];

  // Filter out replies so the left panel ONLY lists main tickets
  const ticketMessages = roundedMessages.filter(
    (msg) => msg.sender === "user" && !msg.id.includes("-reply")
  );

  const selectedMsg = 
    ticketMessages.find((m) => m.id === activeMessageId) || 
    ticketMessages[ticketMessages.length - 1];

  // Retrieve nested conversation replies
  const currentReplies = selectedMsg 
    ? roundedMessages.filter((msg) => msg.id.startsWith(selectedMsg.id + "-reply"))
    : [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMsg) return;
    setIsSendingReply(true);
    try {
      const senderRole = adminPerspective ? "developer" : "user";
      await addDeveloperReply(selectedMsg.id, replyText, senderRole);
      setReplyText("");
      sound.playClick();
      
      // Simulate real-time responses
      if (senderRole === "user") {
        triggerAutoAdminReply(selectedMsg.id);
      } else {
        triggerAutoClientReply(selectedMsg.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const getSubjectMeta = (subId: string) => {
    return subjects.find(s => s.id === subId) || { label: "Outros", color: "text-gray-500 bg-gray-50 border-gray-200", icon: <Code2 size={14} /> };
  };

  // Calculate user database metrics for the admin visual audit panel
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const liquidBalance = totalIncome - totalExpense;

  // OPEX / CMV ratios estimation
  const cmvExpenses = transactions
    .filter(t => t.type === 'expense' && (
      t.categoryId?.toLowerCase().includes('cmv') ||
      t.categoryId?.toLowerCase().includes('custo') ||
      t.categoryId?.toLowerCase().includes('estoque') ||
      t.categoryId?.toLowerCase().includes('produto') ||
      t.categoryId?.toLowerCase().includes('ingrediente') ||
      t.categoryId?.toLowerCase().includes('matéria-prima') ||
      t.categoryId?.toLowerCase().includes('compra')
    ))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const opexExpenses = totalExpense - cmvExpenses;
  const opexRatio = totalIncome > 0 ? (opexExpenses / totalIncome) * 100 : 0;
  const cmvRatio = totalIncome > 0 ? (cmvExpenses / totalIncome) * 100 : 0;
  const ebitdaMargin = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Active risk audit tags
  const alerts: Array<{ type: 'warning' | 'success' | 'info'; title: string; text: string }> = [];
  if (profile?.taxRate === undefined || profile?.taxRate === 0) {
    alerts.push({
      type: 'warning',
      title: "Alíquota Não Definida",
      text: "A empresa opera com alíquota zero nas configurações fiscais da sandbox, mascarando impostos retidos na DRE."
    });
  } else {
    alerts.push({
      type: 'success',
      title: `Alíquota Configurada (${profile.taxRate}%)`,
      text: "Custo tributário calibrado e incidindo de forma realista sobre as receitas na DRE."
    });
  }

  // Segment-based OPEX threshold alerts
  const segmentIsServices = profile?.businessSegment === 'services';
  const opexLimit = segmentIsServices ? 35 : 20;

  if (totalIncome > 0) {
    if (opexRatio > opexLimit) {
      alerts.push({
        type: 'warning',
        title: "OPEX Acima do Limite",
        text: `As despesas operacionais ocupam ${opexRatio.toFixed(1)}% das receitas corporativas. O teto recomendado para seu setor é ${opexLimit}%.`
      });
    } else {
      alerts.push({
        type: 'success',
        title: "OPEX sob Controle Eficaz",
        text: `Seu OPEX corporativo de ${opexRatio.toFixed(1)}% respeita com tranquilidade a margem padrão regulatória de ${opexLimit}%.`
      });
    }

    if (cmvRatio > 40) {
      alerts.push({
        type: 'info',
        title: "CMV de Alta Pressão no Estoque",
        text: `Seu CMV de ${cmvRatio.toFixed(1)}% consome fôlego bruto expressivo. Exige auditoria de margens e negociações com fornecedores.`
      });
    }
  }

  // Active audit presets that can inject responses directly to helper text
  const auditRecommendations = [
    {
      title: "📉 OPEX Acima do Limite PJ",
      text: `Olá! Analisando os dados consolidados da sua empresa (${profile?.companyName || "Sua Empresa"}), percebi que suas despesas operacionais (OPEX) estão representando ${opexRatio.toFixed(1)}% do seu faturamento absoluto. Para o seu segmento, o recomendado é manter o OPEX abaixo de ${opexLimit}%. Sugiro renegociar softwares corporativos ociosos, auditar despesas e estabelecer um comitê interno de teto de OPEX para reter margem imediata.`,
      description: "Disparar alerta focado em custos de OPEX corporativos."
    },
    {
      title: "🎯 Calibrar Markup e Preço de Venda",
      text: `Olá! Seu CMV (Custo de Mercadoria Vendida) está consumindo cerca de ${cmvRatio.toFixed(1)}% das receitas fiscais. Isso aponta para um Markup de vendas defasado frente à sua alíquota tributária real de ${profile?.taxRate || 0}%. Recomendo recalcular o Markup multiplicador usando a fórmula standard: Markup = 1 / [1 - (Impostos% + Custos Fixos% + Margem Líquida Desejada%)], visando restabelecer sua margem operacional.`,
      description: "Orientação para adequação de markup de venda corporativo."
    },
    {
      title: "🔄 Esticar Prazos de Fornecedor",
      text: `Olá! Com base nos seus lançamentos sínclitos e contas a pagar pendentes, recomendo equalizar a Necessidade de Capital de Giro (NCG). Procure esticar prazos com seus principais fornecedores (alcançar DPO de 25 dias) e incentive pagamentos em Pix à vista de clientes, aplicando um desconto máximo de 1.5% para injetar liquidez de curtíssimo prazo no caixa.`,
      description: "Instruir mitigação de descasamento financeiro de giro."
    },
    {
      title: "🏆 Parabéns: Saúde Excelente!",
      text: `Olá! Concluí a auditoria visual completa na sua base de transações. Seu EBITDA estimado em ${ebitdaMargin.toFixed(1)}% indica excelente eficiência nos processos nucleares da empresa, em perfeita conformidade com as diretrizes do setor. Continue registrando os lançamentos diários e gerando seus relatórios DRE para manter esta estabilidade regulatória!`,
      description: "Dossiê aprovando controle de rentabilidade exemplar."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner - Black & Orange Technology Style */}
      <div className="bg-[#141414] p-8 lg:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-slate-800 text-left">
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 font-mono text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
              <Sparkles size={11} className="animate-pulse shrink-0 text-orange-500" />
              Engenharia Human-in-the-Loop & Auditoria Remota
            </div>
            
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Canal Sínclito Ativo
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-3xl lg:text-4xl font-black italic uppercase tracking-tighter leading-none">
              Canal de Suporte & Auditoria Visual
            </h3>
            <p className="text-gray-400 font-medium text-sm lg:text-base leading-relaxed font-sans max-w-3xl">
              Estabeleça uma comunicação bilateral instantânea com o administrador de sistemas sênior da Dafne. 
              Configure o compartilhamento criptografado temporário de dados para que possamos analisar sua DRE, 
              conciliar seu balancete de caixa e aprovar orientações financeiras estratégicas em tempo real.
            </p>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {isDemoMode && (
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4.5 flex items-start gap-3.5 text-amber-800 text-left">
          <Info size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">Ambiente de Demonstração Corporativo:</span> Para fins de visualização de fluxo de trabalho completo, você pode alternar livremente entre as perspectivas de **Cliente PJ** e **Administrador de Suporte** e acionar mensagens bilaterais. Typings realistas e respostas dinâmicas automatizadas estão prontos para simular o atendimento ao vivo da mesa corporativa!
          </div>
        </div>
      )}

      {/* Main Interactive Workplace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CLIENT SIDE FORM VIEW PANEL (Only visible if currently in Client Perspective OR not selecting ticket) (5 cols) */}
        {!adminPerspective ? (
          <div className="lg:col-span-5 space-y-6">
            
            {/* Form to dispatch new issues */}
            <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm space-y-6 text-left">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="font-black italic uppercase tracking-tight text-gray-800 text-sm">
                    Novo Chamado Estratégico
                  </h4>
                  <p className="text-[11px] text-gray-400 font-bold">Inicie sua seção de diagnóstico econômico</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Subject Choices */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Objetivo / Assunto do Ticket
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {subjects.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setSubject(sub.id);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer w-full focus:outline-none",
                          subject === sub.id
                            ? "bg-orange-50/70 border-orange-500/50 text-orange-950 shadow-xs scale-[1.01]"
                            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-55/35 hover:border-gray-200"
                        )}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                    Sua Dúvida ou Desafio Contábil
                  </label>
                  <div className="relative">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Ex: Minha margem EBITDA apresentou queda brusca de 5% este mês nas vendas faturadas. Qual ação de Markup devo adotar?"
                      rows={4}
                      maxLength={1500}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:bg-white focus:border-orange-500 transition-all resize-none leading-relaxed"
                      required
                    />
                    <span className="absolute bottom-3 right-4 text-[9px] font-mono font-bold text-gray-400">
                      {content.length}/1500
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSending || !content.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black uppercase text-[10.5px] tracking-widest py-4 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none font-sans"
                >
                  <Send size={13} className="shrink-0" />
                  <span>{isSending ? "Publicando chamado..." : "Abrir Canal de Auditoria"}</span>
                </button>
              </form>
            </div>

            {/* HIGH-FIDELITY ZERO TRUST DATA SHARE CONTROL CARD */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-[2rem] border border-white/5 text-white text-left shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[8.5px] font-mono text-orange-400 font-extrabold flex items-center gap-1.5 tracking-wider">
                    <Lock size={11} className="text-orange-400 shrink-0" />
                    CONTRATO DE CONFIDENCIALIDADE
                  </span>
                  <h4 className="text-sm font-black italic uppercase tracking-tight text-gray-100 flex items-center gap-2">
                    Visual Auditoria Co-piloto
                  </h4>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dataShared}
                    onChange={toggleDataSharing}
                    className="sr-only peer"
                    id="data-share-switch"
                  />
                  <label
                    htmlFor="data-share-switch"
                    className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                Ao ativar este interruptor, você realiza o upload sínclito seguro do sumário da empresa (alíquotas, EBITDA estimado, saldo de caixa e DRE consolidada) para a sandbox do Administrador. Isso viabiliza um diagnóstico visual instantâneo para sanar suas dúvidas!
              </p>

              {/* Share Preview Stats Bar */}
              {dataShared ? (
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-zinc-300 space-y-2 font-mono text-[10px]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-orange-400 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                      Status de Telemetria:
                    </span>
                    <span className="text-emerald-400 text-[9px] font-black uppercase">DADOS ATIVOS COMPARTILHADOS ✓</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-zinc-400">
                    <div>Empresa: <strong className="text-zinc-200">{profile?.companyName || "Minha Holding PJ"}</strong></div>
                    <div>Giro: <strong className="text-zinc-200">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                    <div>CMV Estimado: <strong className="text-zinc-200">{cmvRatio.toFixed(1)}% ({t('currency_symbol')} {cmvExpenses.toLocaleString('pt-BR')})</strong></div>
                    <div>OPEX Estimado: <strong className="text-zinc-200">{opexRatio.toFixed(1)}%</strong></div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-500/5 rounded-xl p-3 border border-orange-500/10 text-orange-400/85 text-[10px] font-bold flex items-center gap-2 leading-relaxed">
                  <ShieldAlert size={14} className="shrink-0 text-orange-500 animate-bounce" />
                  Compartilhamento inativo. O administrador de suporte visualizará as conversas em formato isolado e de telemetria cega.
                </div>
              )}
            </div>
          </div>
        ) : (
          
          /* 🛠️ ADMINISTRATIVE / DEVELOPER HEALTH METRICS VISUAL AUDITING PANEL (5 cols) */
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#141414] text-white p-7 rounded-[2rem] border border-slate-900 shadow-2xl relative overflow-hidden space-y-5 text-left">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center border border-orange-500/20">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      Auditoria de Saúde Financeira
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold font-sans">Inspecionando sandbox corporativa em tempo real</p>
                  </div>
                </div>
                
                <span className="bg-white/5 border border-white/10 text-gray-300 font-mono text-[9px] px-2 py-0.5 rounded uppercase">
                  ADM Terminal ★
                </span>
              </div>

              {!dataShared ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-dashed border-slate-800">
                    <ShieldAlert size={22} className="text-orange-500 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <p className="text-xs font-mono font-black uppercase text-orange-400 tracking-wider">Consentimento Aguardando</p>
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                      O cliente PJ ainda não ativou a chave de compartilhamento de dados no painel dele. Para realizar a auditoria de competências, solicite que ele ative a chave acima do chat.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setReplyText("Olá! Para que eu faça a auditoria visual completa das suas planilhas operacionais e DRE, por favor habilite a chave '[🔒 Compartilhamento Auditoria PJ]' que fica logo abaixo da caixa de abertura de chamados no seu terminal de suporte.");
                      showToast("Texto preparado!", "info");
                    }}
                    className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-lg text-[9px] font-mono tracking-wide uppercase transition-all"
                  >
                    💬 Solicitar Liberação no Chat
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  
                  {/* Co-pilot active details metadata */}
                  <div className="bg-slate-950/75 rounded-2xl p-4.5 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5">
                      <span className="text-gray-400">EMPRESA CLIENTE:</span>
                      <strong className="text-orange-400 font-mono">{profile?.companyName || "Holding Cliente"}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>Segmento PJ: <strong className="text-gray-200 block mt-0.5 uppercase tracking-wide font-mono text-[9.5px]">{profile?.businessSegment || "Não Ajustado"}</strong></div>
                      <div>Alíquota Fiscal: <strong className="text-gray-200 block mt-0.5 font-mono">{profile?.taxRate || 0}% de Imposto</strong></div>
                      <div>Volume Absoluto: <strong className="text-gray-200 block mt-0.5 font-mono">{transactions.length} Lançamentos</strong></div>
                      <div>Saque / Caixa Livre: <strong className="text-emerald-400 block mt-0.5 font-mono">R$ {liquidBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                    </div>
                  </div>

                  {/* Symmetrical High-tech gauges or ratios check */}
                  <div className="space-y-3 text-xs">
                    <span className="text-[9px] font-mono font-black uppercase text-orange-400 tracking-wider block">
                      Indicadores de Desempenho Auditados:
                    </span>
                    
                    {/* Gauge 1: EBITDA Margin Check */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-mono text-[10px] text-gray-300">
                        <span>Margem EBITDA Operacional:</span>
                        <span className={cn("font-bold text-xs", ebitdaMargin >= 15 ? "text-emerald-400" : "text-amber-500")}>
                          {totalIncome > 0 ? `${ebitdaMargin.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", ebitdaMargin >= 15 ? "bg-emerald-500" : "bg-amber-500")}
                          style={{ width: `${Math.min(100, Math.max(0, ebitdaMargin))}%` }}
                        />
                      </div>
                    </div>

                    {/* Gauge 2: OPEX vs Faturamento limit check */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-mono text-[10px] text-gray-300">
                        <span>Custo Recorrente (OPEX Ratio):</span>
                        <span className={cn("font-bold text-xs", opexRatio <= opexLimit ? "text-emerald-400" : "text-red-400")}>
                          {totalIncome > 0 ? `${opexRatio.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", opexRatio <= opexLimit ? "bg-emerald-500" : "bg-red-500")}
                          style={{ width: `${Math.min(100, Math.max(0, opexRatio))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Diagnóstico Contábil Risk checklist report cards */}
                  <div className="space-y-2 mt-4">
                    <span className="text-[9px] font-mono font-black uppercase text-orange-400 tracking-wider block">
                      Análise de Conformidade e Riscos:
                    </span>
                    <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {alerts.map((alItem, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "p-3 rounded-xl border text-[10.5px] leading-relaxed relative",
                            alItem.type === 'warning' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                            alItem.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-200' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                          )}
                        >
                          <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight mb-0.5 text-[9.5px]">
                            {alItem.type === 'warning' ? <Bug size={12} className="text-red-400" /> :
                             alItem.type === 'info' ? <Info size={12} className="text-blue-400" /> :
                             <Check size={12} className="text-emerald-400" />}
                            {alItem.title}
                          </div>
                          <p className="opacity-80 leading-normal">{alItem.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ADMIN PRESETS QUICK RECOMMENDS (Inject instantly into textarea) */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[9px] font-mono font-black uppercase text-orange-400 tracking-wider block">
                      Ações de Recomendação Recomendadas de Auditoria:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {auditRecommendations.map((rec, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setReplyText(rec.text);
                            showToast("Preset inserido no chat!", "success");
                          }}
                          className="flex items-center justify-between text-left p-2.5 rounded-xl bg-white/5 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/20 text-[10.5px] font-semibold text-zinc-300 transition-all cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Zap size={11} className="text-orange-400" />
                            {rec.title}
                          </span>
                          <span className="text-[8px] font-mono opacity-60 uppercase">USAR PRESET ✓</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* INTEGRATED TIMELINE CONVERSATION THREAD (7 cols) */}
        <div className="lg:col-span-7 bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col min-h-[580px] text-left">
          
          {/* Timeline Header containing Perspective controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                <Code2 size={18} />
              </div>
              <div>
                <h4 className="font-black italic uppercase tracking-tight text-gray-800 text-sm flex items-center gap-2">
                  Linha de Conversação
                  {dataShared && <span className="text-[8px] font-mono bg-orange-100 border border-orange-200 text-orange-700 px-1.5 py-0.5 rounded uppercase font-black tracking-wider shrink-0">Auditoria Ativa</span>}
                </h4>
                <p className="text-[11px] text-gray-400 font-bold">Respostas bilaterais em tempo real da sandbox</p>
              </div>
            </div>

            {/* Perspective selection widget */}
            <div className="relative flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAdminPerspective(false);
                  showToast("Visualização: Cliente PJ", "info");
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                  !adminPerspective
                    ? "bg-[#141414] text-white shadow-xs"
                    : "text-gray-55 hover:text-gray-700"
                )}
              >
                👤 Cliente PJ
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAdminPerspective(true);
                  showToast("Painel do Desenvolvedor Ativo", "success");
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                  adminPerspective
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-gray-55 hover:text-gray-700"
                )}
              >
                ⚙️ Admin / Suporte {isAdminUser ? "★" : ""}
              </button>
            </div>
          </div>

          {ticketMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                <MessageSquare size={24} className="text-gray-300" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <p className="text-xs font-bold text-gray-700">Nenhum chamado aberto</p>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                  Envie uma dúvida técnica no formulário de chamados ao lado para iniciar a conversa com o auditor em tempo real.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 items-stretch overflow-hidden">
              
              {/* Left inner rail: User Message Selector items (5 cols of inner grid) */}
              <div className="md:col-span-4 border-r border-gray-55 pr-2.5 space-y-2 max-h-[500px] overflow-y-auto">
                <span className="text-[9px] font-black uppercase text-gray-400 px-1 tracking-wider block mb-2 font-mono">
                  Seus Chamados PJ ({ticketMessages.length})
                </span>
                {ticketMessages.map((msg) => {
                  const meta = getSubjectMeta(msg.subject);
                  const isCurrent = activeMessageId === msg.id || (!activeMessageId && selectedMsg?.id === msg.id);
                  const hasDevelopmentReply = roundedMessages.some(
                    (reply) => reply.id.startsWith(msg.id + "-reply") && reply.sender === "developer"
                  );

                  return (
                    <button
                      key={msg.id}
                      onClick={() => {
                        sound.playClick();
                        setActiveMessageId(msg.id);
                      }}
                      className={cn(
                        "w-full p-3 rounded-xl text-left border transition-all flex flex-col space-y-2 cursor-pointer focus:outline-none",
                        isCurrent
                          ? "bg-[#141414] border-slate-900 text-white shadow-md scale-[1.01]"
                          : "bg-gray-55/35 border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md",
                          isCurrent ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' : 'bg-white border text-gray-500 border-gray-200'
                        )}>
                          {meta.label.split(" ").slice(1).join(" ")}
                        </span>
                        
                        {/* Interactive status dot indicator */}
                        <span className="flex items-center shrink-0">
                          {hasDevelopmentReply ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Resolvido / Respondido" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Aguardando Auditoria" />
                          )}
                        </span>
                      </div>
                      <p className={cn(
                        "text-[10px] font-semibold leading-tight line-clamp-2",
                        isCurrent ? 'text-gray-300' : 'text-gray-500'
                      )}>
                        {msg.content}
                      </p>
                      <span className="text-[7.5px] font-mono tracking-wide opacity-60 self-end">
                        {msg.createdAt.toLocaleDateString("pt-BR")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right inner rail: Message View Details with Chat Input Thread (8 cols of inner grid) */}
              <div className="md:col-span-8 flex flex-col h-[500px] gap-3 relative justify-between">
                {selectedMsg ? (
                  <div className="flex-1 flex flex-col bg-gray-55/20 border border-gray-100 rounded-2xl p-4 overflow-hidden justify-between">
                    
                    {/* Thread Info Header bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-150 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[8.5px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1",
                          roundedMessages.some(reply => reply.id.startsWith(selectedMsg.id + "-reply") && reply.sender === "developer")
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                            : "bg-amber-50 border-amber-100 text-amber-700 animate-pulse"
                        )}>
                          {roundedMessages.some(reply => reply.id.startsWith(selectedMsg.id + "-reply") && reply.sender === "developer")
                            ? "✓ Auditoria Respondida"
                            : "● Em Análise Contábil"
                          }
                        </span>
                      </div>
                      <span className="text-[8px] font-mono font-bold text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {selectedMsg.createdAt.toLocaleDateString("pt-BR")} às {selectedMsg.createdAt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Chat Bubble Window Scrollway */}
                    <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 scrollbar-thin">
                      
                      {/* Customer Primary Inquiry Bubble statement */}
                      <div className="flex gap-2 items-start text-left">
                        <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                          <User size={13} className="text-orange-600" />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-3 shadow-3xs max-w-[90%]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9.5px] font-black text-orange-600 font-sans">
                              {selectedMsg.userName || "Empresa Cliente"}
                            </span>
                            <span className="text-[8px] font-mono text-gray-400 bg-gray-50 border px-1 rounded-sm border-gray-150">
                              Original
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-gray-700 font-semibold whitespace-pre-wrap">
                            {selectedMsg.content}
                          </p>
                        </div>
                      </div>

                      {/* Nested chronologically sorted replies (Supports both developer & customer back-and-forth!) */}
                      {currentReplies.map((reply) => {
                        const isDev = reply.sender === "developer";
                        return (
                          <motion.div
                            key={reply.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "flex gap-2 items-start mt-2 text-left",
                              isDev ? "justify-start" : "justify-end"
                            )}
                          >
                            {isDev && (
                              <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                                <Code2 size={13} className="text-orange-400" />
                              </div>
                            )}
                            
                            <div className={cn(
                              "rounded-2xl p-3 shadow-3xs max-w-[90%]",
                              isDev 
                                ? "bg-[#141414] text-white border border-slate-950 rounded-tl-none" 
                                : "bg-orange-50/50 border border-orange-100 text-gray-800 rounded-tr-none ml-auto"
                            )}>
                              <div className={cn(
                                "flex items-center gap-2 mb-1 pb-1 border-b w-full",
                                isDev ? "border-white/5" : "border-orange-200/20"
                              )}>
                                <span className={cn(
                                  "text-[9.5px] font-black font-mono flex items-center gap-1 uppercase",
                                  isDev ? "text-orange-400" : "text-gray-700"
                                )}>
                                  {isDev && <Sparkles size={11} className="text-orange-400 animation-pulse" />}
                                  {isDev ? "Suporte @ Dafne" : (selectedMsg.userName || "Empresa")}
                                </span>
                                <span className={cn(
                                  "text-[7.5px] font-mono text-gray-400"
                                )}>
                                  Réplica
                                </span>
                              </div>
                              <p className={cn(
                                  "text-[11px] leading-relaxed font-semibold whitespace-pre-wrap",
                                  isDev ? "text-gray-300" : "text-gray-700"
                              )}>
                                {reply.content}
                              </p>
                              <span className={cn(
                                "text-[7.5px] font-mono block mt-1.5 text-right",
                                isDev ? "text-gray-500" : "text-gray-400"
                              )}>
                                {new Date(reply.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            {!isDev && (
                              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                <User size={13} className="text-orange-600" />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}

                      {/* DIGITANDO / TYPING SIMULATORS FOR ACTIVE CHAT FEED */}
                      {isDevTyping && (
                        <div className="flex gap-2 items-start text-left mt-2 animate-pulse">
                          <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                            <Code2 size={13} className="text-orange-400 animate-spin" />
                          </div>
                          <div className="bg-[#141414] text-white border border-slate-950 rounded-2xl rounded-tl-none p-3 shadow-2xs max-w-[80%]">
                            <span className="text-[9px] font-mono text-orange-400 block font-black uppercase tracking-wider">Suporte @ Dafne</span>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5 animate-bounce">
                              Analisando seus balancetes... Digitando parecer técnico de auditoria...
                            </p>
                          </div>
                        </div>
                      )}

                      {isClientTyping && (
                        <div className="flex gap-2 items-end justify-end text-right mt-2 animate-pulse">
                          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3 shadow-2xs text-left max-w-[80%]">
                            <span className="text-[9px] font-mono text-zinc-600 block font-black uppercase tracking-wider">Empresa Cliente</span>
                            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              Empresa cliente formulando resposta...
                            </p>
                          </div>
                          <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                            <User size={13} className="text-orange-600 animate-bounce" />
                          </div>
                        </div>
                      )}

                    </div>

                    {/* INTERACTIVE TRASMISSION PANEL COCKPIT CHAT INPUT */}
                    {adminPerspective ? (
                      
                      /* 🛠️ DEVELOPER REPLY INPUT FORM PANEL WITH QUICK TEMPLATES */
                      <div className="bg-[#141414] text-white rounded-2xl border border-slate-900 p-4 shrink-0 space-y-3 shadow-md mt-1.5">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="text-[9px] font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5 font-mono">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                            📝 Responder como Desenvolvedor / Auditor
                          </span>
                          <span className="text-[8.5px] text-gray-405 font-bold uppercase font-sans">
                            Human Auditor Co-pilot
                          </span>
                        </div>

                        {/* Quick Responses Macro select list */}
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide block">
                            Modelos de Resposta Rápida:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {quickReplies.map((qr, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  sound.playTick();
                                  setReplyText(qr.text);
                                }}
                                className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8.5px] font-bold text-gray-305 hover:bg-white/10 hover:text-white transition-all cursor-pointer select-none"
                              >
                                {qr.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Field input */}
                        <div className="relative">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Redija um feed de auditoria, orientações de opEX, CMV ou markup de preço de venda..."
                            rows={3}
                            maxLength={1000}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all resize-none leading-relaxed font-sans"
                          />
                          <span className="absolute bottom-2 right-2 text-[7.5px] font-mono text-gray-500">
                            {replyText.length}/1000
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setReplyText("");
                            }}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-[9px] uppercase tracking-wide rounded-lg transition-all"
                          >
                            Limpar
                          </button>
                          
                          <button
                            type="button"
                            disabled={isSendingReply || !replyText.trim()}
                            onClick={handleSendReply}
                            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-black font-black uppercase text-[9.5px] tracking-wider px-4 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Send size={10} />
                            <span>{isSendingReply ? "Enviando..." : "Enviar Resposta Humana"}</span>
                          </button>
                        </div>
                      </div>

                    ) : (

                      /* 👤 CLIENT FOLLOW-UP REPLY INPUT GRID */
                      <div className="bg-orange-50/5 border border-orange-200/10 rounded-2xl p-4 shrink-0 space-y-3 mt-1.5 text-left">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                          <span className="text-[9.5px] font-black uppercase text-gray-600 tracking-wider flex items-center gap-1.5 font-mono">
                            💬 Enviar Réplica sobre este Chamado
                          </span>
                        </div>

                        <div className="relative">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Descreva as planilhas, responda o consultor de suporte ou forneça informações adicionais..."
                            rows={2}
                            maxLength={1000}
                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-850 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all resize-none leading-relaxed font-sans font-semibold"
                          />
                          <span className="absolute bottom-2 right-2 text-[7.5px] font-mono text-gray-400">
                            {replyText.length}/1000
                          </span>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={isSendingReply || !replyText.trim()}
                            onClick={handleSendReply}
                            className="bg-slate-900 hover:bg-slate-950 disabled:opacity-40 text-white font-black uppercase text-[9.5px] tracking-wider px-4 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Send size={10} />
                            <span>{isSendingReply ? "Enviando..." : "Enviar Réplica"}</span>
                          </button>
                        </div>
                      </div>

                    )}

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200 text-center">
                    <span className="text-[11px] font-bold text-gray-400">Selecione seu chamado na coluna à esquerda para carregar o canal sínclito de suporte</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
