import React, { useState, useEffect, useRef } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  MessageSquare,
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sliders,
  TrendingUp,
  LineChart,
  Bot,
  Activity,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Minimize2,
  Maximize2,
  RefreshCw,
  Search,
  CheckSquare
} from "lucide-react";
import dafneAvatar from "../assets/images/dafne_avatar_tech_1779278120473.png";

// Interactive Real-Time Canvas Neural Waves Visualizer for CoPilot HUD (Orange Theme)
function NeuralSynapseWave({ 
  state 
}: { 
  state: "listening" | "speaking" | "thinking" | "idle" 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      let numWaves = 3;
      let speed = 0.04;
      let amplitude = 10;
      let frequency = 0.018;
      let strokeStyles = ["rgba(249, 115, 22, 0.65)", "rgba(251, 146, 60, 0.45)", "rgba(253, 186, 116, 0.3)"];

      if (state === "listening") {
        numWaves = 4;
        speed = 0.14;
        amplitude = 18;
        frequency = 0.024;
        strokeStyles = ["rgba(239, 68, 68, 0.8)", "rgba(249, 115, 22, 0.6)", "rgba(168, 85, 247, 0.5)", "rgba(251, 113, 133, 0.35)"];
      } else if (state === "speaking") {
        numWaves = 3;
        speed = 0.09;
        amplitude = 15;
        frequency = 0.02;
        strokeStyles = ["rgba(249, 115, 22, 0.85)", "rgba(251, 146, 60, 0.65)", "rgba(253, 186, 116, 0.4)"];
      } else if (state === "thinking") {
        numWaves = 5;
        speed = 0.18;
        amplitude = 8;
        frequency = 0.045;
        strokeStyles = ["rgba(249, 115, 22, 0.9)", "rgba(59, 130, 246, 0.7)", "rgba(14, 165, 233, 0.5)", "rgba(245, 158, 11, 0.4)"];
      } else {
        // idle
        numWaves = 2;
        speed = 0.015;
        amplitude = 3.5;
        frequency = 0.012;
        strokeStyles = ["rgba(249, 115, 22, 0.35)", "rgba(249, 115, 22, 0.1)"];
      }

      phase += speed;

      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        ctx.lineWidth = i === 0 ? 1.8 : 1.0;
        ctx.strokeStyle = strokeStyles[i] || "rgba(255,255,255,0.15)";

        const offset = i * (Math.PI / numWaves);
        for (let x = 0; x < width; x++) {
          const damping = Math.sin((x / width) * Math.PI);
          const y = (height / 2) + Math.sin(x * frequency + phase + offset) * amplitude * damping;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [state]);

  return <canvas ref={canvasRef} className="w-full h-8 block shrink-0 bg-[#101010]/90 border-b border-orange-500/10" />;
}

// Interface for conversational messages inside the HUD Co-pilot
interface HUDMessage {
  id: string;
  sender: "user" | "dafne";
  text: string;
  timestamp: Date;
  isQuickSuggested?: boolean;
}

interface DafneCoPilotHUDProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function DafneCoPilotHUD({ activeTab, setActiveTab }: DafneCoPilotHUDProps) {
  const {
    transactions,
    categories,
    products,
    storeProfiles,
    activeStoreId,
    showToast,
    profile
  } = useFinance();

  // Settings & state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [bubbleText, setBubbleText] = useState<string>("");
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<HUDMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [usageStatus, setUsageStatus] = useState<any>(null);

  const fetchUsageStatus = async () => {
    try {
      const emailHeader = localStorage.getItem("dafne_user_email") || "";
      const headers: Record<string, string> = {};
      if (emailHeader) {
        headers["x-user-email"] = emailHeader;
      }
      const response = await fetch("/api/ai/usage-status", { headers });
      if (response.ok) {
        const data = await response.json();
        setUsageStatus(data);
      }
    } catch (e) {
      console.warn("Error fetching AI usage status:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsageStatus();
    }
  }, [isOpen]);
  
  // HUD Voice Synthesis & Speech Recognition state
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("dafne_hud_tts_enabled") === "true";
  });
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(false);
  const [hudSpeaking, setHudSpeaking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active store segments
  const activeStore = storeProfiles.find(s => s.id === activeStoreId);
  const currentSegment = activeStore?.businessSegment || "commerce";

  // Derive calculations for custom auditor
  const incomes = transactions.filter(t => t.type === "income");
  const expenses = transactions.filter(t => t.type === "expense");
  const totalSales = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalSales - totalExpenses;

  // Track speech recognition instance
  const recognitionRef = useRef<any>(null);

  // Text to speech synthesizer helper
  const speakText = (text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) {
      setHudSpeaking(false);
      return;
    }
    try {
      window.speechSynthesis.cancel(); // Stop anything playing
      const cleanText = text.replace(/[*#_`~[\]]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "pt-BR";
      
      // Try to find a Portuguese female voice if possible
      const voices = window.speechSynthesis.getVoices();
      const ptVo = voices.find(v => v.lang.includes("pt") && v.name.toLowerCase().includes("maria") || v.name.toLowerCase().includes("luciana") || v.lang.includes("pt-BR"));
      if (ptVo) {
        utterance.voice = ptVo;
      }
      utterance.pitch = 1.15; // Set Jennifer signature pitch
      utterance.rate = 1.10; // Set Jennifer signature speed

      utterance.onstart = () => {
        setHudSpeaking(true);
      };
      utterance.onend = () => {
        setHudSpeaking(false);
      };
      utterance.onerror = () => {
        setHudSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error", e);
      setHudSpeaking(false);
    }
  };

  // Sync state & save
  useEffect(() => {
    localStorage.setItem("dafne_hud_tts_enabled", String(ttsEnabled));
    if (!ttsEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setHudSpeaking(false);
    }
  }, [ttsEnabled]);

  // Initial welcome on component load
  useEffect(() => {
    setMessages([
      {
        id: "init-1",
        sender: "dafne",
        text: "Olá! Sou a Dafne, sua HUD Co-Piloto Inteligente. Estou sintonizada no que você faz em cada tela para guiar seus lucros em tempo real! Como posso assessorar hoje?",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiResponding]);

  // DYNAMIC WORKSPACE SENSING (Innovative Feature: AI detects tab change and triggers micro advice)
  useEffect(() => {
    let advice = "";
    switch (activeTab) {
      case "dashboard":
        advice = "💡 Dafne: Sintonizei no Painel Gerencial. Estamos com R$ " + currentBalance.toLocaleString("pt-BR") + " em saldo operacional consolidado de caixa.";
        break;
      case "transactions":
        advice = "📋 Dafne: Carregando lançamentos de caixa. Digite '/auditoria' para eu varrer riscos fiscais e operacionais!";
        break;
      case "cashflow":
        advice = "📉 Dafne: Estamos visualizando as projeções de Fluxo de Caixa. Dica: observe os dias de vencimento concentrados e evite gargalos.";
        break;
      case "segment-metrics":
        advice = "📊 Dafne: Métricas de Nichos ativas! Use os sliders para simular como uma mudança sutil no markup explode sua lucratividade.";
        break;
      case "pricing":
        advice = "🧮 Dafne: Calculadoras de preços abertas. Lembre-se: preço muito baixo destrói o caixa, e preço sem valor destrói a captação.";
        break;
      case "strategies":
        advice = "🎯 Dafne: Peça Orçamentária de Gestão & Reservas. Planeje tetos de gastos, controle despesas e simule sobras de fluxo de caixa!";
        break;
      case "payable":
        advice = "📑 Dafne: Contas a Pagar e Monitor de boletos. Vamos conferir as datas críticas para evitar juros operacionais PJ.";
        break;
      default:
        advice = "✨ Dafne: HUD Co-Piloto ativa. Sintonizando parâmetros operacionais corporativos.";
    }

    setBubbleText(advice);
    setShowBubble(true);

    // Auto fade bubble after 8 seconds
    const timer = setTimeout(() => {
      setShowBubble(false);
    }, 8500);

    return () => clearTimeout(timer);
  }, [activeTab]);

  // Dynamic suggestion pills based on activeTab
  const getContextualPills = () => {
    switch (activeTab) {
      case "segment-metrics":
        return [
          { label: "🎯 Simulação Ideal", action: "Como atingir o markup ideal no meu segmento?" },
          { label: "🆚 Benchmark Setor", action: "Quais os benchmarks de margem para " + currentSegment + "?" },
          { label: "🔮 Analisar Lucro", action: "Como o giro de estoque afeta o faturamento?" }
        ];
      case "dashboard":
      case "transactions":
        return [
          { label: "🔮 Auditoria Rápida", action: "/auditoria" },
          { label: "📈 Margem de Contribuição", action: "Qual a diferença entre margem e lucro?" },
          { label: "🏥 Saúde de Caixa", action: "Qual o diagnóstico rápido do meu saldo?" }
        ];
      case "pricing":
        return [
          { label: "🏷️ Markup vs Margem", action: "Como calcular markup multiplicador?" },
          { label: "📊 Precificar Serviço", action: "Como precificar serviços por valor por hora?" },
          { label: "📉 CMV Alto", action: "O que fazer se o CMV for maior que 40%?" }
        ];
      case "cashflow":
        return [
          { label: "⚠️ Ponto de Equilíbrio", action: "Qual o meu break-even ou ponto de equilíbrio mensal?" },
          { label: "📅 Previsibilidade", action: "Como projetar receitas recorrentes no fluxo?" }
        ];
      default:
        return [
          { label: "💡 Dica de hoje", action: "Dê uma dica estratégica rápida para meu negócio" },
          { label: "🔮 Diagnóstico Geral", action: "/auditoria" },
          { label: "🛠️ Comandos de Voz", action: "Como usar comandos de voz para navegar?" }
        ];
    }
  };

  // VOCAL COMMAND / KEYBOARD COMMAND COMMAND ROUTER
  // (Innovative Feature: Auto-recognition of navigation keywords or system functions)
  const processCommandRouting = (lowerText: string): boolean => {
    // 1. Audit route
    if (lowerText.includes("/auditoria") || lowerText.includes("auditoria") || lowerText.includes("auditar")) {
      executeBoxAuditor();
      return true;
    }

    // 2. Navigation mappings
    const navMappings = [
      { keys: ["ir para nicho", "metricas de nicho", "métricas de nicho", "nicho", "segmento", "benchmarks"], tab: "segment-metrics" },
      { keys: ["ir para painel", "dashboard", "gerencial", "visao geral", "visão geral"], tab: "dashboard" },
      { keys: ["ir para lancamentos", "ir para lançamentos", "lancamentos", "lançamentos", "transacoes", "transações"], tab: "transactions" },
      { keys: ["ir para fluxo", "fluxo de caixa", "caixa", "previsão de caixa", "previsao de caixa"], tab: "cashflow" },
      { keys: ["ir para precificacao", "ir para precificação", "precos", "preços", "produtos", "servicos", "serviços"], tab: "pricing" },
      { keys: ["ir para estrategias", "ir para metas", "cofrinho", "copiloto", "planejamento estrategico", "orçamento", "orcamento", "peça", "peca", "budget", "tetos", "teto", "metas"], tab: "strategies" },
      { keys: ["ir para pagar", "contas a pagar", "boletos", "despesas", "compromissos"], tab: "payable" },
      { keys: ["ir para configuracao", "configurações", "ajustes", "motor de ia"], tab: "settings" }
    ];

    for (const mapping of navMappings) {
      for (const k of mapping.keys) {
        if (lowerText.includes(k)) {
          setActiveTab(mapping.tab);
          const feedbackMsg = `Perfeito! Comando interpretado. Direcionei sua tela imediatamente para "${getTabLabel(mapping.tab)}". Já estou analisando este ambiente!`;
          addNewDafneMessage(feedbackMsg);
          speakText(feedbackMsg);
          showToast(`Navegando: ${getTabLabel(mapping.tab)}`, "success");
          return true;
        }
      }
    }

    return false;
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "dashboard": return "Painel Geral";
      case "transactions": return "Lançamentos”;";
      case "cashflow": return "Fluxo de Caixa";
      case "segment-metrics": return "Métricas de Nicho";
      case "pricing": return "Precificação";
      case "strategies": return "Orçamento & Metas";
      case "payable": return "Contas a Pagar";
      case "settings": return "Configurações";
      default: return tab;
    }
  };

  // Core Audit Routine - Scans Transactions and responds
  const executeBoxAuditor = async () => {
    setIsAiResponding(true);
    addNewUserMessage("/auditoria");

    // Dynamic audit facts
    const activeAuds = [
      `Faturamento Consolidado: R$ ${totalSales.toFixed(2)} acumulados.`,
      `Custos Operacionais Acumulados: R$ ${totalExpenses.toFixed(2)}.`,
      `Unidade Ativa Atualmente: ${activeStoreId === "all" ? "Consolidador de Filiais" : activeStore?.companyName || "Única"}.`,
      `Atuação Principal: Nicho Comercial de ${currentSegment === "commerce" ? "Varejo" : currentSegment === "food" ? "Alimentação" : currentSegment === "services" ? "Serviços" : "Tecnologia"}.`
    ];

    try {
      const emailHeader = localStorage.getItem("dafne_user_email") || "";
      const customHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (emailHeader) {
        customHeaders["x-user-email"] = emailHeader;
      }

      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify({
          message: `Faça uma auditoria financeira relâmpago de 3 linhas com tom de mentora Dafne. Dados atuais de caixa: ${activeAuds.join(" / ")}. Indique urgentemente 1 ponto forte e 1 ponto de atenção urgente sobre margens ou despesas. Finalize com incentivo vibrante!`,
          history: []
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        const errMsg = data.error || "Erro ao processar consulta da IA.";
        addNewDafneMessage(`⚠️ **Detecção do Gestor de Quotas:**\n\n${errMsg}`);
        speakText(errMsg);
        fetchUsageStatus();
        return;
      }

      if (data && data.text) {
        addNewDafneMessage(data.text);
        speakText(data.text);
        fetchUsageStatus();
      } else {
        throw new Error("Empty AI response");
      }
    } catch (e) {
      // Fallback local rule based analysis if API fails
      setTimeout(() => {
        const storeName = activeStore?.companyName || "sua empresa";
        let text = `⚡ [Auditoria Analítica Local - Dafne]
Para a empresa **${storeName}** (${currentSegment.toUpperCase()}):
• **Ponto Forte:** O faturamento consolidado de R$ ${totalSales.toLocaleString('pt-BR')} valida uma demanda ativa do mercado.
• **Ponto de Atenção:** Suas despesas acumuladas de R$ ${totalExpenses.toLocaleString('pt-BR')} demandam monitoramento preciso. Busque limitar os custos operacionais (OPEX) a no máximo 75% da receita líquida do ciclo para blindar sua margem de contribuição!`;
        addNewDafneMessage(text);
        speakText(text);
      }, 800);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Add Message Handlers
  const addNewUserMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: "msg-" + Math.random().toString(),
        sender: "user",
        text,
        timestamp: new Date()
      }
    ]);
  };

  const addNewDafneMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: "msg-" + Math.random().toString(),
        sender: "dafne",
        text,
        timestamp: new Date()
      }
    ]);
  };

  // State-of-the-art client-side cognitive financial synthesis for resilience
  const buildDafneLocalInteractiveAnalysis = (userMsg: string): string => {
    const lower = userMsg.toLowerCase();
    const storeName = activeStore?.companyName || "sua empresa";
    const segmentLabel = currentSegment === "commerce" ? "Varejo" : currentSegment === "food" ? "Alimentação" : currentSegment === "services" ? "Serviços" : "Outro";
    
    // Core parameters
    const margin = totalSales > 0 ? (currentBalance / totalSales) * 100 : 0;
    const breakEven = totalExpenses;
    const format = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    let evaluation = "";
    if (margin > 20) {
      evaluation = "Excelente! (Conversão de caixa de alta eficiência)";
    } else if (margin > 10) {
      evaluation = "Estável (Satisfatório, mas com margem de otimização)";
    } else if (margin > 0) {
      evaluation = "Comprimida (Atenção redobrada, vulnerável a despesas)";
    } else {
      evaluation = "Déficit Temporário (Risco de corrosão de liquidez)";
    }

    let coreAdvice = "";
    if (lower.includes("custo") || lower.includes("despesa") || lower.includes("corte") || lower.includes("cortar") || lower.includes("reduzir") || lower.includes("diminuir") || lower.includes("opex")) {
      coreAdvice = `**DIRETRIZ DE OTIMIZAÇÃO DE CUSTOS (OPEX):**
Focar no controle de saídas recorrentes é o caminho mais rápido para ver sobras de verdade. Para um acumulado atual de **${format(totalExpenses)}** em despesas corporativas, recomendo de imediato uma auditoria cirúrgica de 2 etapas:
1. Revise e liste cada cobrança em conta automatizada, descartando licenças duplicadas de sistemas operacionais.
2. Busque uma meta simples de redução de custos fixos administrativos de no mínimo 5% nos próximos 15 dias, injetando aproximadamente **${format(totalExpenses * 0.05)}** a mais direto no seu saldo de caixa livre.`;
    } else if (lower.includes("venda") || lower.includes("faturar") || lower.includes("receita") || lower.includes("faturamento") || lower.includes("lucro") || lower.includes("lucratividade") || lower.includes("crescer")) {
      coreAdvice = `**ESTRATÉGIA DE ALAVANCAGEM DE FATURAMENTO:**
Você registra hoje **${format(totalSales)}** acumulado de vendas bruto. Para de fato crescer sem asfixiar o caixa PJ com a necessidade de capital de giro elevado, estude o giro de estoque ou o tempo médio de recebíveis das suas transações. Prefira sempre vender os itens e produtos com maior margem de contribuição média cadastrados na sua Planilha de Markups do que forçar grandes descontos apenas para girar faturamento nominal sem margem.`;
    } else if (lower.includes("cmv") || lower.includes("mercadoria") || lower.includes("fornecedor")) {
      coreAdvice = `**ANÁLISE E CONTROLE DE CMV (Custo de Mercadoria):**
Os custos operacionais diretos são sensíveis e cruciais, principalmente no segmento de **${segmentLabel}**. Busque consolidar compras com parceiros de confiança em troca de prazos de faturamento diluídos ou bônus comerciais. No Painel, confira se os custos de frete internacional/nacional ou impostos de entrada foram adicionados de forma rigorosa na sua Planilha de Precificação de Produtos.`;
    } else if (lower.includes("imposto") || lower.includes("tax") || lower.includes("tributo") || lower.includes("fiscal")) {
      coreAdvice = `**AVALIAÇÃO FISCAL E TRIBUTÁRIA ESTRATÉGICA:**
Regimes de impostos no Brasil guardam ótimas avenidas legais de otimização. Verifique junto ao seu escritório contábil se produtos isentos ou que operam sob substituição tributária (tributo monofásico) não estão gerando impostos cumulativos de forma errada.`;
    } else {
      coreAdvice = `**PARECER GERAL DE METAS:**
Atualmente, para manter a liquidez ideal, sua empresa deve defender o faturamento à altura das metas diárias de vendas do Painel Gerencial. Acompanhe se o saldo operacional de **${format(currentBalance)}** é suficiente para suprir os prazos médios de contas a pagar de curto prazo. Recomenda-se reservar pelo menos 10% de cada recebimento Pix/Boleto para uma reserva financeira resiliente no cofrinho de estratégias.`;
    }

    return `### ⚡ DAFNE CORE: ANÁLISE COMPORTAMENTAL DE CAIXA

Olá! Sou a **Dafne**. Identifiquei e processei com sucesso os indicadores vitais de competência para a empresa **${storeName}** (${segmentLabel.toUpperCase()}):

* **Faturamento Bruto:** ${format(totalSales)}
* **Drenagem Operacional (OPEX/CMV):** ${format(totalExpenses)}
* **Saldo Líquido de Caixa:** ${format(currentBalance)}
* **Eficiência Operacional Real:** ${margin.toFixed(1)}% (${evaluation})

---

${coreAdvice}

---

#### 🎯 Metas Sugeridas:
* **Garantia de Ponto de Equilíbrio (Break-Even):** Faturar de forma recorrente e média no mínimo **${format(breakEven)}** a cada ciclo para manter as contas com saldo verde estável.
* **Margem Alvo Recomendada:** Elevar o markup médio global para buscar uma margem líquida consolidada ideal acima de 15% para o seu setor.`;
  };

  // SEND CHAT FORM TO BACKEND DAFNE API
  const handleSendMessage = async (textToSend?: string) => {
    const rawMsg = textToSend || inputVal;
    if (!rawMsg.trim()) return;

    if (!textToSend) setInputVal("");
    addNewUserMessage(rawMsg);
    setIsAiResponding(true);

    // 1. Check commands
    const isMatchedCommand = processCommandRouting(rawMsg.toLowerCase());
    if (isMatchedCommand) {
      setIsAiResponding(false);
      return;
    }

    // 2. Fetch from LLM AI
    try {
      const emailHeader = localStorage.getItem("dafne_user_email") || "";
      const customHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (emailHeader) {
        customHeaders["x-user-email"] = emailHeader;
      }

      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: customHeaders,
        body: JSON.stringify({
          message: rawMsg,
          history: messages,
          financialData: {
            businessSegment: currentSegment,
            income: totalSales,
            expense: totalExpenses,
            balance: currentBalance,
            companyName: activeStore?.companyName || "Apurar Consolidadas",
            averageBilling: profile?.averageBilling || 0,
            billingGoal: profile?.billingGoal || 0,
            billingGoalDeadline: profile?.billingGoalDeadline || "",
            billingNotes: profile?.billingNotes || ""
          }
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        const errMsg = data.error || "Erro ao processar consulta da IA.";
        addNewDafneMessage(`⚠️ **Detecção do Gestor de Quotas:**\n\n${errMsg}`);
        speakText(errMsg);
        fetchUsageStatus();
        return;
      }

      if (data && data.text) {
        addNewDafneMessage(data.text);
        speakText(data.text);
        fetchUsageStatus();
      } else {
        // Advanced client-side fallback compiler
        const fallbackText = buildDafneLocalInteractiveAnalysis(rawMsg);
        addNewDafneMessage(fallbackText);
        speakText(fallbackText);
      }
    } catch (e) {
      // Graceful local resilience fallback
      const fallbackText = buildDafneLocalInteractiveAnalysis(rawMsg);
      addNewDafneMessage(fallbackText);
      speakText(fallbackText);
    } finally {
      setIsAiResponding(false);
    }
  };

  // FULL SPEECH RECOGNITION (Usability Innovation 3)
  const toggleSpeechListening = () => {
    setSpeechError(false);
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError(true);
      showToast("Seu navegador não oferece suporte de microfone síncrono. Use a digitação rápida!", "warning");
      // Simulated fallback typing animation or quick instruction
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(false);
        showToast("Estou te ouvindo... Fale seu comando ou dúvida!", "info");
      };

      rec.onerror = (e: any) => {
        console.error("Speech error", e);
        setIsListening(false);
        setSpeechError(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          setInputVal(transcript);
          showToast(`Interpretado: "${transcript}"`, "success");
          setTimeout(() => {
            handleSendMessage(transcript);
          }, 600);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-14 md:bottom-20 right-4 md:right-8 z-[999] pointer-events-none">
      
      {/* 1. COMPACT DOCK HEADSPEECH INTEGRATOR */}
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        
        {/* DYNAMIC ADVICE TOAST SPEECH BUBBLE */}
        <AnimatePresence>
          {showBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="max-w-[280px] bg-[#0c0c0c] text-white p-3.5 rounded-2xl border border-orange-500/60 shadow-[0_8px_32px_rgba(249,115,22,0.18)] cursor-pointer text-left text-xs leading-relaxed flex items-center gap-3 relative mr-2"
            >
              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#0c0c0c] rotate-45 border-r border-t border-orange-500/50 pointer-events-none" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <p className="font-medium">{bubbleText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN HUD EXPANDED WINDOW PANEL */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 40 }}
              className={cn(
                "w-[340px] md:w-[380px] bg-[#0c0c0c] text-white border border-orange-500/70 rounded-3xl shadow-[0_16px_50px_rgba(249,115,22,0.15)] flex flex-col overflow-hidden transition-all duration-300",
                isMinimized ? "h-[60px]" : "h-[480px] md:h-[530px]"
              )}
            >
              
              {/* HUD PANEL HEADER */}
              <div className="bg-[#141414] px-5 py-4 border-b border-orange-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={dafneAvatar}
                      alt="Dafne"
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0c0c0c] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-wider uppercase flex items-center gap-1">
                      <span>Dafne I.A.</span>
                      <span className="bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                        CO-PILOTO HUD
                      </span>
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-bold tracking-tight flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Sintonizado: {getTabLabel(activeTab)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* TTS Vocalizer Toggle */}
                  <button
                    onClick={() => {
                      setTtsEnabled(!ttsEnabled);
                      showToast(ttsEnabled ? "Leitor de Voz Desligado" : "Dafne agora lerá as respostas!", "info");
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all hover:bg-zinc-900",
                      ttsEnabled ? "text-orange-400" : "text-zinc-650"
                    )}
                    title={ttsEnabled ? "Desativar Áudio" : "Ativar Leitura Automática"}
                  >
                    {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>

                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors hover:bg-zinc-900"
                  >
                    {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors hover:bg-zinc-900"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Dynamic AI Quota / API Key Waste Limiter Tracker HUD Indicator */}
              {usageStatus && !isMinimized && (
                <div className="bg-[#111111] border-b border-orange-500/15 px-5 py-2 flex items-center justify-between text-[9px] font-mono select-none text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full inline-block animate-pulse" 
                      style={{ 
                        backgroundColor: usageStatus.hasCustomKey || usageStatus.isAdmin 
                          ? "#10b981" 
                          : usageStatus.remaining <= 5 
                            ? "#ef4444" 
                            : "#f97316" 
                      }} 
                    />
                    <span className="font-bold">
                      {usageStatus.hasCustomKey 
                        ? "Chave Própria Utilizada (Uso Ilimitado)" 
                        : usageStatus.isAdmin 
                          ? "Sessão Administrativa (Sem Limites)" 
                          : `Cota IA: ${usageStatus.remaining}/${usageStatus.dailyLimit} consultas restantes`}
                    </span>
                  </div>
                  <div>
                    {!usageStatus.hasCustomKey && !usageStatus.isAdmin && (
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest">
                        Reset {usageStatus.resetInHours}h
                      </span>
                    )}
                    {(usageStatus.hasCustomKey || usageStatus.isAdmin) && (
                      <span className="text-[8px] bg-emerald-500/15 text-emerald-400 font-bold px-1 rounded border border-emerald-500/30">
                        ATIVO
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* HUD PANEL MESSAGE SCREEN */}
              {!isMinimized && (
                <>
                  <NeuralSynapseWave state={isListening ? "listening" : hudSpeaking ? "speaking" : isAiResponding ? "thinking" : "idle"} />
                  <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 bg-[#0c0c0c] scrollbar-thin scrollbar-thumb-zinc-800">
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed backdrop-blur-sm",
                            msg.sender === "user"
                              ? "bg-orange-500 text-black ml-auto rounded-tr-none border border-orange-500"
                              : "bg-[#141414] border border-orange-500/15 text-slate-100 rounded-tl-none shadow-sm"
                          )}
                        >
                          <div className={cn(
                            "flex items-center gap-1 mb-1 font-black uppercase text-[8px] tracking-wider",
                            msg.sender === "user" ? "text-stone-800 ml-auto" : "text-orange-400"
                          )}>
                            {msg.sender === "user" ? "Você" : "Dafne Mentora"}
                            <span className="text-zinc-500 font-mono text-[7px]">
                              {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          
                          <p className="whitespace-pre-line select-text font-serif leading-relaxed text-slate-200">
                            {msg.text}
                          </p>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isAiResponding && (
                      <div className="flex items-center gap-2 bg-[#141414] p-3 rounded-2xl border border-orange-500/10 max-w-[80%] rounded-tl-none">
                        <div className="flex space-x-1">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono animate-pulse">
                          Pensando...
                        </span>
                      </div>
                    )}

                    {/* Integrated Micro Permission & iFrame diagnostic assistant */}
                    {speechError && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-orange-50/10 border border-orange-500/35 p-3.5 rounded-2xl max-w-[90%] font-sans text-left space-y-2 select-none shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full pointer-events-none" />
                        <div className="flex items-center gap-2">
                          <AlertCircle size={15} className="text-orange-400 shrink-0 animate-pulse" />
                          <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">
                            Diagnóstico de Áudio do HUD
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-300 leading-relaxed font-sans font-medium">
                          Detectamos que o microfone está indisponível ou foi recusado. Isso ocorre por segurança do navegador ao executar o app dentro de um <strong>iframe</strong>.
                        </p>
                        <div className="text-[9px] font-mono text-zinc-400 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✔</span> <span>Sandbox habilitado na plataforma</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-orange-400">ℹ</span> <span>Falta permissão manual no navegador</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1 text-[9px] font-black uppercase font-sans">
                          <a 
                            href={window.location.href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-orange-500 border border-orange-600 px-2.5 py-1 text-black font-semibold rounded-lg hover:bg-orange-600 transition-all flex items-center gap-1"
                            onClick={() => setSpeechError(false)}
                          >
                            Abrir em Nova Aba 🌐
                          </a>
                          <button 
                            onClick={() => setSpeechError(false)} 
                            className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-zinc-300 rounded-lg hover:bg-zinc-900 transition-all cursor-pointer"
                          >
                            Descartar
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* HIGH-TECH NEURAL VOICE AUDIO visualizer line (if listening) */}
                  {isListening && (
                    <div className="bg-[#141414] px-4 py-3 border-t border-orange-500/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest font-mono animate-pulse">
                          Escutando sua fala...
                        </span>
                      </div>

                      {/* MICROPHONE GRAPHICS */}
                      <div className="flex items-end justify-center gap-0.5 h-4">
                        {[5, 12, 18, 10, 16, 7, 13, 6].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [h, h * 0.3, h * 1.4, h] }}
                            transition={{ repeat: Infinity, duration: 0.5 + (i * 0.1), ease: "easeInOut" }}
                            className="w-0.5 bg-rose-500 rounded-full"
                            style={{ height: h }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RECOMMENDATION PILLS CONTAINER */}
                  <div className="bg-[#0c0c0c] px-4 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-t border-orange-500/15 select-none">
                    {getContextualPills().map((pill, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(pill.action)}
                        className="bg-[#141414] hover:bg-zinc-900 text-orange-400 hover:text-orange-300 text-[9.5px] font-black px-3 py-1.5 rounded-full border border-orange-500/20 hover:border-orange-500/50 transition-all cursor-pointer inline-block"
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* HUD PANEL CHAT INPUT ACCORDION */}
                  <div className="bg-[#141414] p-3 border-t border-orange-500/15 flex items-center gap-1.5">
                    
                    {/* Active Voice Microphone trigger */}
                    <button
                      onClick={toggleSpeechListening}
                      className={cn(
                        "p-2.5 rounded-xl transition-all border shrink-0 relative cursor-pointer",
                        isListening 
                          ? "bg-rose-500/25 border-rose-500/50 text-rose-400"
                          : speechError 
                            ? "bg-[#0c0c0c] border-zinc-800 text-zinc-500" 
                            : "bg-[#0c0c0c] hover:bg-zinc-900 border-orange-500/20 text-orange-400"
                      )}
                      title="Falar Comando de Voz"
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      {isListening && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                      )}
                    </button>

                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Pergunte à Dafne ou digite '/auditoria'..."
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSendMessage();
                          }
                        }}
                        className="w-full text-xs bg-[#0c0c0c] text-white placeholder-zinc-650 pl-3.5 pr-8 py-2.5 rounded-xl border border-orange-500/20 focus:border-orange-500/60 outline-none transition-colors"
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputVal.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 p-1 rounded-md"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. ROUND FLOATING ACTION BUTTON / LAUNCHER */}
        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="w-14 h-14 bg-[#0c0c0c] hover:bg-[#141414] text-white rounded-full shadow-[0_10px_35px_rgba(249,115,22,0.3)] border border-orange-500 flex items-center justify-center relative cursor-pointer outline-none focus:outline-none"
            title="Dafne HUD Co-Piloto"
          >
            {/* Pulsing outer ring */}
            <span className="absolute -inset-1.5 rounded-full border border-orange-500/25 animate-pulse" style={{ animationDuration: "2.5s" }} />
            <span className="absolute -inset-3 rounded-full border border-orange-500/[0.08] animate-ping" style={{ animationDuration: "3.5s" }} />

            <div className="relative">
              <img
                src={dafneAvatar}
                alt="Dafne Avatar"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover border border-white/10"
              />
              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0c0c0c]" />
            </div>

            {/* Micro strategic badge */}
            <div className="absolute -top-1.5 -right-1.5 bg-orange-500 text-black text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full shadow-md animate-bounce" style={{ animationDuration: "2s" }}>
              HUD
            </div>
          </motion.button>
        )}

      </div>
    </div>
  );
}
