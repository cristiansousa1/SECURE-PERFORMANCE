import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { 
  Brain, 
  Sparkles, 
  Wand2, 
  FileText, 
  Save, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  ChevronRight, 
  HelpCircle,
  Copy,
  Plus
} from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
}

export default function AIPlanningView() {
  const {
    transactions,
    categories,
    profile,
    addNote,
    showToast,
    isDemoMode,
    trackDemoInteraction
  } = useFinance();

  // Calculate live financial diagnostics
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const balanceValue = totalIncome - totalExpense;
  const ebitdaMargin = totalIncome > 0 ? (balanceValue / totalIncome) * 100 : 0;

  // Group expenses by category
  const categoryExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc: Record<string, number>, t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const catName = cat ? cat.name : "Outros";
      acc[catName] = (acc[catName] || 0) + t.amount;
      return acc;
    }, {});

  const sortedExpenses = Object.entries(categoryExpenses)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3);

  // States
  const [selectedTemplate, setSelectedTemplate] = useState<string>("reducao");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Olá! Sou Dafne, sua estrategista financeira. Vamos co-desenvolver o planejamento estratégico do seu negócio hoje? Escolha um plano de ação rápido acima ou digite suas ideias ao lado para começarmos o rascunho!"
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [documentTitle, setDocumentTitle] = useState("Plano de Otimização Financeira");
  const [documentContent, setDocumentContent] = useState(
    `# PLANEJAMENTO ESTRATÉGICO FINACEIRO PJ\n\n` +
    `## 1. DIAGNÓSTICO OPERACIONAL EM TEMPO REAL\n` +
    `- Faturamento Mensal Identificado: ${formatCurrency(totalIncome)}\n` +
    `- Custo Operacional Mensal: ${formatCurrency(totalExpense)}\n` +
    `- Saldo de Caixa Líquido: ${formatCurrency(balanceValue)}\n` +
    `- Margem Operacional EBITDA: ${ebitdaMargin.toFixed(1)}%\n\n` +
    `## 2. DIRETRIZES DE METAS\n` +
    `* [Rascunho] Reduzir os gastos mensais das três maiores categorias em até 10% nas próximas 4 semanas.\n` +
    `* [Rascunho] Manter reserva mínima operacional equivalente a 3 meses de despesas corporativas.\n\n` +
    `## 3. CRONOGRAMA DE EXECUÇÃO DETALHADO\n` +
    `- Semana 1: Auditoria profunda de SaaS ociosos e cancelamento de assinaturas duplicadas.\n` +
    `- Semana 2: Divisão estratégica de metas com o time operacional comercial.\n` +
    `- Semana 3: Negociação com principais fornecedores e prazos de pagamento.`
  );

  // Predefined prompt templates
  const planTemplates = [
    {
      id: "reducao",
      title: "Redução de Despesas OPEX",
      description: "Cortar despesas administrativas e software duplicados de forma rápida.",
      initialPrompt: "Desenvolva comigo um plano cirúrgico passo a passo para reduzir despesas administrativas e de operação em 15% sem prejudicar o faturamento.",
      docSnippet: (compName: string, inc: number, exp: number) => 
        `# PLANO DE REDUÇÃO DE CUSTOS E DESPESAS (OPEX)\n\n` +
        `Empresa: ${compName}\n` +
        `Data: ${new Date().toLocaleDateString("pt-BR")}\n\n` +
        `## 🎯 OBJETIVO PRINCIPAL\n` +
        `Cortar 12% a 15% de gastos supérfluos, visando aumentar a margem bruta operacional para preservar fluxo de caixa PJ.\n\n` +
        `## 🛡️ ANÁLISE DE VULNERABILIDADE\n` +
        `- Faturamento Atual: ${formatCurrency(inc)}\n` +
        `- Despesas Registradas: ${formatCurrency(exp)}\n` +
        `- Risco: Contratações duplicadas de plataformas, tarifas bancárias negligenciadas e gastos recorrentes sem monitoramento semanal.\n\n` +
        `## 📋 AÇÕES IMEDIATAS (PRÓXIMOS 15 DIAS)\n` +
        `1. Cancelamento imediato de licenças de software ou assinaturas não utilizadas pelos colaboradores.\n` +
        `2. Consolidação de contas bancárias PJ para eliminar tarifas administrativas cruzadas.\n` +
        `3. Implementação de aprovação dupla eletrônica para qualquer nova despesa acima de R$ 500.`
    },
    {
      id: "vendas",
      title: "Expansão de Faturamento Comercial",
      description: "Estratégias de canais, ticket médio e fidelização recorrente.",
      initialPrompt: "Quero criar um plano estratégico de faturamento para expandir minha receita bruta mensal em pelo menos 20% com foco em novos canais comerciais e conversor recorrente.",
      docSnippet: (compName: string, inc: number, exp: number) =>
        `# CLUBE DE METAS - EXPANSÃO COMERCIAL PJ\n\n` +
        `Empresa: ${compName}\n` +
        `Data: ${new Date().toLocaleDateString("pt-BR")}\n\n` +
        `## 🎯 OBJETIVO\n` +
        `Elevar o faturamento atual de ${formatCurrency(inc)} em 20% adicionais nas próximas 12 semanas, melhorando de imediato a saúde geral do caixa.\n\n` +
        `## 📈 ALAVANCAS DE CRESCIMENTO SELECIONADAS\n` +
        `- **Upsell na Base**: Desenvolver novas ofertas para clientes ativos, gerando mais vendas cruzadas.\n` +
        `- **Planos de Fidelidade / Assinatura**: Migrar 15% das vendas individuais pontuais para pacotes recorrentes visando travar fluxo financeiro no primeiro dia de cada mês.\n` +
        `- **Ajuste de Preços**: Corrigir em 4.5% o preço daqueles itens com alta demanda operacional, alavancando margem direta.\n\n` +
        `## ⚡ PILOTO DE CANAL (PLANO DE AÇÃO PARCIAL)\n` +
        `- Dias 1 a 7: Mapeamento dos 20% principais clientes que representam 80% da receita.\n` +
        `- Dias 8 a 15: Execução de campanhas personalizadas de retenção e recompra.`
    },
    {
      id: "capital",
      title: "Blindagem de Capital de Giro",
      description: "Proteger as reservas contra descasamentos de prazos e inadimplência.",
      initialPrompt: "Me ajude a planejar a blindagem do meu capital de giro e formar uma reserva rígida de fluxo de caixa para evitar dependência de empréstimos bancários emergenciais.",
      docSnippet: (compName: string, inc: number, exp: number) =>
        `# PROGRAMA DE BLINDAGEM DE CAPITAL DE GIRO PJ\n\n` +
        `Empresa: ${compName}\n` +
        `Data: ${new Date().toLocaleDateString("pt-BR")}\n\n` +
        `## 🎯 OBJETIVO DE SEGURANÇA\n` +
        `Formar reserva técnica operacional para suportar até 90 dias de custos fixos sem necessidade de captação de crédito oneroso comercial.\n\n` +
        `## 🧭 POLÍTICA PJ DETALHADA\n` +
        `1. **Regra de Cofrinho**: Transferir semanalmente de 5% a 8% de todo faturamento compensado diretamente para o Cofrinho de Investimentos.\n` +
        `2. **Janela de Recebimentos**: Ajustar prazos médios de vendas com cartões para diminuir taxas abusivas de antecipação.\n` +
        `3. **Garantia Tributária**: Reservar de forma destacada o montante do imposto federal mensal e do FGTS logo após o faturamento.`
    }
  ];

  const handleApplyTemplate = (id: string) => {
    setSelectedTemplate(id);
    const tmpl = planTemplates.find((t) => t.id === id);
    if (tmpl) {
      setDocumentTitle(`Plano de ${tmpl.title}`);
      const compName = profile?.companyName || "Minha Empresa";
      setDocumentContent(tmpl.docSnippet(compName, totalIncome, totalExpense));
      setChatMessages([
        {
          sender: "ai",
          text: `Fórmula estratégica para "${tmpl.title}" pré-carregada no painel direito com seus dados financeiros reais de faturamento e despesas. Agora, digite aqui ao lado as observações adicionais que você quer que eu insira, ou mande uma mensagem para iniciarmos o co-desenvolvimento conjunto!`
        }
      ]);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || userInput;
    if (!textToSend.trim()) return;

    if (!customPrompt) {
      setChatMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
      setUserInput("");
    }

    setIsGenerating(true);

    try {
      // Gather current state of document content to feed to the AI context so they develop in tandem!
      const userDocContext = `\n\n[CONTEÚDO ATUAL DO PLANEJAMENTO SENDO EDITADO PELO USUÁRIO (RASCUNHO)]:\n${documentContent}`;

      const finalPrompt = `Estou planejando financeiramente o meu negócio de forma cooperativa. 
      Instrução do usuário: "${textToSend}"
      
      Por favor, analise a instrução do usuário, responda amigavelmente com dicas práticas de mentor, e me forneça sugestões claras de tópicos, seções ou pontos que eu devo incluir ou atualizar no meu documento principal. Se for o caso, formate como pequenos marcadores ou cláusulas de fácil cópia.
      
      ${userDocContext}`;

      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalPrompt,
          history: chatMessages,
          financialData: {
            income: totalIncome,
            expense: totalExpense,
            balance: balanceValue,
            companyName: profile?.companyName || "Minha Empresa",
            businessSegment: profile?.businessSegment || "service",
            businessNicheDetail: profile?.nicheFocus || "",
            transactionsCount: transactions.length,
            averageBilling: profile?.averageBilling || 0,
            billingGoal: profile?.billingGoal || 0,
            billingGoalDeadline: profile?.billingGoalDeadline || "",
            billingNotes: profile?.billingNotes || ""
          }
        })
      });

      if (!response.ok) {
        throw new Error("Erro na solicitação de IA.");
      }

      const data = await response.json();
      setChatMessages((prev) => [...prev, { sender: "ai", text: data.text || "Sem resposta no momento." }]);
    } catch (error) {
      console.error(error);
      setChatMessages((prev) => [
        ...prev, 
        { 
          sender: "ai", 
          text: "Opa, tive um soluço técnico ao conectar aos servidores de inteligência. Considere utilizar dicas locais ou tentar gerar novamente!" 
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (isDemoMode) {
      trackDemoInteraction();
      return;
    }
    
    if (!documentContent.trim()) {
      showToast("Não há nenhum conteúdo no planejamento ativo para salvar.", "warning");
      return;
    }

    try {
      await addNote(
        `📁 ${documentTitle}`, 
        `Planejamento Estratégico Co-desenvolvido com Assessoria I.A. Dafne\n\n${documentContent}`
      );
      showToast("Seu plano estratégico foi salvo com sucesso na sua biblioteca de Anotações!", "success");
    } catch (e) {
      showToast("Ocorreu um erro ao salvar o plano. Verifique seus dados.", "error");
    }
  };

  const handleRefineDocument = async () => {
    setIsGenerating(true);
    showToast("Ajustando estrutura e auditando métricas com IA sênior...", "info");

    try {
      const prompt = `Por favor, atue como um auditor financeiro avançado. Refine o planejamento estratégico abaixo para que de forma elegante ele tenha o melhor vocabulário gerencial, metas mais claras (S.M.A.R.T), formatação em markdown limpa e de alta classe corporativa. Mantenha os dados numéricos intactos. Retorne APENAS o novo conteúdo refinado em markdown sem textos adicionais antes ou depois.\n\nDOCUMENTO ATUAL:\n${documentContent}`;
      
      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          financialData: {
            income: totalIncome,
            expense: totalExpense,
            balance: balanceValue,
            companyName: profile?.companyName || "Minha Empresa",
            businessSegment: profile?.businessSegment || "service",
            businessNicheDetail: profile?.nicheFocus || "",
            transactionsCount: transactions.length,
            averageBilling: profile?.averageBilling || 0,
            billingGoal: profile?.billingGoal || 0,
            billingGoalDeadline: profile?.billingGoalDeadline || "",
            billingNotes: profile?.billingNotes || ""
          }
        })
      });

      if (!response.ok) throw new Error("Falha no refinamento");
      const data = await response.json();
      
      // Extract clean text
      if (data.text) {
        setDocumentContent(data.text);
        showToast("Seu documento de planejamento foi consolidado e refinado profissionalmente!", "success");
      }
    } catch (e) {
      showToast("Erro ao processar refinamento com I.A.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate strategic tips locally based on current corporate indicators
  const getCorporateIndicatorTips = () => {
    const tipsRef = [];

    if (totalIncome === 0) {
      tipsRef.push({
        type: "warning",
        title: "Faturamento Zero Encontrado",
        text: "Verifique se registrou seus lançamentos de entrada ou provisões. Sem histórico de receitas, a consultoria estratégica sugere focar em validação rápida de canais de captação."
      });
    }

    if (ebitdaMargin < 15 && totalIncome > 0) {
      tipsRef.push({
        type: "danger",
        title: "Margem EBITDA Crítica",
        text: `Sua margem operacional está em ${ebitdaMargin.toFixed(1)}%. O patamar seguro do Simples Nacional / Lucro Presumido PJ opera na faixa de 22% a 30%. Reduza OPEX secundário urgentemente!`
      });
    } else if (ebitdaMargin >= 25) {
      tipsRef.push({
        type: "success",
        title: "Excelente Performance de Lucro",
        text: `Margem operacional robusta de ${ebitdaMargin.toFixed(1)}%! Excelente aproveitamento gerencial. Direcione a sobra líquida de caixa de imediato para blindagem de Cofrinhos pj.`
      });
    }

    if (sortedExpenses.length > 0) {
      const topCat = sortedExpenses[0];
      tipsRef.push({
        type: "info",
        title: `Custo Concentrado em "${topCat[0]}"`,
        text: `Seu maior desembolso operacional ocorre na categoria "${topCat[0]}" totalizando ${formatCurrency(topCat[1] as number)}. Almeje planos de rateio de volume estratégico para cortar 8% desse montante.`
      });
    }

    return tipsRef;
  };

  const dynamicTips = getCorporateIndicatorTips();

  return (
    <div id="ai-planning-view" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      {/* LEFT: Financial Diagnoses & Prompt Templates */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        
        {/* Real-time Diagnostic Bento Box */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-150/80 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Brain size={18} />
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
              Diagnóstico I.A. Express
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Lucro Mensal</p>
              <p className={cn(
                "text-sm font-black font-mono",
                balanceValue >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {formatCurrency(balanceValue)}
              </p>
            </div>
            <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Margem EBITDA</p>
              <p className="text-sm font-black font-mono text-gray-800">
                {ebitdaMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Actionable intelligent local tips */}
          <div className="space-y-2.5 pt-2">
            {dynamicTips.map((tip, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "p-3 rounded-2xl text-xs flex gap-2.5 border items-start transition-all",
                  tip.type === "danger" 
                    ? "bg-rose-50/60 border-rose-100 text-rose-800"
                    : tip.type === "success"
                      ? "bg-emerald-50/60 border-emerald-100 text-emerald-800"
                      : "bg-orange-50/60 border-orange-100 text-orange-850"
                )}
              >
                {tip.type === "danger" ? (
                  <AlertTriangle size={15} className="shrink-0 text-rose-500 mt-0.5" />
                ) : tip.type === "success" ? (
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <Sparkles size={15} className="shrink-0 text-orange-500 mt-0.5 animate-pulse" />
                )}
                <div>
                  <p className="font-extrabold text-[11px] leading-tight mb-0.5 uppercase tracking-wide">
                    {tip.title}
                  </p>
                  <p className="opacity-90 font-medium leading-relaxed leading-[1.3] text-[10px]">
                    {tip.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Templates selector for strategic co-development */}
        <div className="bg-[#141414] text-white p-6 rounded-[2.5rem] shadow-xl space-y-4 flex-1">
          <div className="flex items-center gap-1.5 justify-between">
            <h3 className="text-xs font-black tracking-widest text-orange-400 uppercase">
              Planos PJ Rápidos
            </h3>
            <span className="text-[7px] font-black uppercase text-white bg-orange-500/20 px-2 py-0.5 rounded-md border border-orange-500/30">
              Co-Development
            </span>
          </div>
          <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
            Selecione uma diretiva de mercado abaixo para pré-alimentar nosso roteiro e construir as metas dinamicamente com seu assistente corporativo.
          </p>

          <div className="space-y-2.5 pt-2">
            {planTemplates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleApplyTemplate(tmpl.id)}
                className={cn(
                  "w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1 cursor-pointer relative overflow-hidden group",
                  selectedTemplate === tmpl.id
                    ? "bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-950/20"
                    : "bg-[#1f1f1f] border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-[#252525]"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-xs uppercase tracking-tight">
                    {tmpl.title}
                  </span>
                  <ChevronRight size={13} className={cn(
                    "transition-transform",
                    selectedTemplate === tmpl.id ? "translate-x-1" : "opacity-30 group-hover:opacity-100"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] leading-relaxed",
                  selectedTemplate === tmpl.id ? "text-orange-100 font-medium" : "text-gray-450"
                )}>
                  {tmpl.description}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* CENTER & RIGHT: Dual Co-development desk */}
      <div className="xl:col-span-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Interactive Chat Console (Dafne Advice Console) */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-150/80 shadow-md flex flex-col h-[520px] lg:h-auto">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                <span className="text-xs font-black text-orange-600">DF</span>
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 leading-none">Dafne I.A.</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Ativa // Co-Piloto</p>
              </div>
            </div>
          </div>

          {/* Chat Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-2 my-4 space-y-3 scrollbar-thin">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-2xl text-xs max-w-[90%] leading-relaxed",
                  msg.sender === "user"
                    ? "bg-slate-900 text-white font-semibold self-end ml-auto"
                    : "bg-gray-100 text-gray-800 font-medium border border-gray-150"
                )}
              >
                {msg.sender === "ai" && (
                  <p className="text-[8px] font-black uppercase text-orange-500 tracking-wider mb-1">Assessor Técnico</p>
                )}
                <span className="whitespace-pre-line">{msg.text}</span>
              </div>
            ))}
            {isGenerating && (
              <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl text-xs text-gray-500 font-medium flex items-center gap-2 mr-auto animate-pulse">
                <Sparkles size={13} className="text-orange-500 animate-spin" />
                <span>Otimizando conceitos financeiros e estruturando roteiro...</span>
              </div>
            )}
          </div>

          {/* Prompt quick tags & message input */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => handleSendMessage("Dê dicas de controle de CMV")}
                className="text-[9px] font-bold uppercase tracking-wider bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-150 px-2 py-1 rounded-lg cursor-pointer"
              >
                💡 Reduzir CMV
              </button>
              <button 
                onClick={() => handleSendMessage("Como criar pacotes recorrentes?")}
                className="text-[9px] font-bold uppercase tracking-wider bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-150 px-2 py-1 rounded-lg cursor-pointer"
              >
                🌀 Planos Recorrentes
              </button>
              <button 
                onClick={() => handleSendMessage("Como blindar meu fluxo contra inadimplência?")}
                className="text-[9px] font-bold uppercase tracking-wider bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-150 px-2 py-1 rounded-lg cursor-pointer"
              >
                🛡️ Risco de Crédito
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Insira sua ideia ou peça conselhos à Dafne..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isGenerating}
                className="flex-1 bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-2.5 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isGenerating || !userInput.trim()}
                className="p-3 bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-40 disabled:scale-100 rounded-2xl text-white transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Co-developed Document Pane (Live Drafting Workspace) */}
        <div className="bg-[#0b0c0e] rounded-[2.5rem] border border-orange-500/10 shadow-xl flex flex-col p-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
          
          <div className="relative z-10 flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-orange-400" />
              <input 
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="font-black text-sm uppercase tracking-tight bg-transparent border-b border-transparent hover:border-gray-700 focus:border-orange-500 focus:outline-none w-full max-w-[200px]"
              />
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                Live Drafting
              </span>
            </div>
          </div>

          {/* Active text area and draft content editor */}
          <div className="relative z-10 flex-1 my-4 flex flex-col">
            <textarea
              className="w-full flex-1 bg-gray-900/40 border border-gray-800/80 rounded-2xl p-4 text-xs font-mono font-medium leading-relaxed resize-none text-gray-150 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 scrollbar-thin"
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Construa o conteúdo de seu planejamento aqui..."
            />
          </div>

          {/* Core collaborative workspace controls */}
          <div className="relative z-10 pt-2 border-t border-gray-850 flex items-center gap-2 justify-between">
            <button
              onClick={handleRefineDocument}
              disabled={isGenerating || !documentContent.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-[#1e2025] hover:bg-[#272a31] text-orange-400 font-extrabold uppercase text-[9px] tracking-wider transition-all flex items-center gap-2 cursor-pointer border border-orange-500/10"
              title="Reescrever, formatar Markdown e polir"
            >
              <Wand2 size={12} className="animate-pulse" />
              Consolidar com IA
            </button>

            <button
              onClick={handleSaveToNotes}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold uppercase text-[9px] tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-orange-950/20 cursor-pointer"
            >
              <Save size={12} />
              Salvar como Anotação PJ
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
