import React, { useState, useEffect, useRef } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Plus,
  RefreshCw,
  Users,
  LogIn,
  LogOut,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Layers,
  ChevronRight,
  Shield,
  Loader2,
  Bell,
  CheckCircle2,
  Hash,
  Globe,
  Info
} from "lucide-react";
import { formatCurrency } from "../lib/utils";

interface GoogleChatSpace {
  name: string;
  displayName?: string;
  type?: string;
  spaceThreadingState?: string;
}

interface GoogleChatMessage {
  name: string;
  sender?: {
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    type?: string;
  };
  text: string;
  createTime?: string;
}

export default function GoogleChatView() {
  const { user, bills, transactions, showToast } = useFinance();
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem("google_chat_access_token") || null;
  });
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Interface states
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // For creating a new space dialog
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Computed financial stats to share in chat
  const welcomeMetrics = React.useMemo(() => {
    const inc = (transactions || []).filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + t.amount, 0);
    const exp = (transactions || []).filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + t.amount, 0);
    const balance = inc - exp;
    
    const overdueBills = (bills || []).filter((b: any) => b.status !== "paid" && new Date(b.dueDate) < new Date());
    const totalPendingAmount = (bills || []).filter((b: any) => b.status !== "paid").reduce((sum: number, b: any) => sum + b.amount, 0);

    return {
      balance,
      faturamento: inc,
      compras: exp,
      overdueCount: overdueBills.length,
      pendingTotal: totalPendingAmount
    };
  }, [transactions, bills]);

  // Connect / Auth to Google Chat Scopes
  const handleConnectChat = async () => {
    setIsConnecting(true);
    try {
      const provider = new GoogleAuthProvider();
      // Add all authorized scopes
      provider.addScope("https://www.googleapis.com/auth/chat.spaces");
      provider.addScope("https://www.googleapis.com/auth/chat.messages.create");
      provider.addScope("https://www.googleapis.com/auth/chat.spaces.readonly");
      provider.addScope("https://www.googleapis.com/auth/chat.memberships");
      provider.addScope("https://www.googleapis.com/auth/chat.memberships.readonly");
      provider.addScope("https://www.googleapis.com/auth/chat.messages.readonly");

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential?.accessToken) {
        throw new Error("Não foi possível extrair o Token de Acesso do Google.");
      }

      const cleanToken = credential.accessToken;
      setToken(cleanToken);
      sessionStorage.setItem("google_chat_access_token", cleanToken);
      showToast("Conexão com Google Chat efetuada com sucesso! 🛡️", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "Houve uma interrupção ao solicitar credenciais de acesso.", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    sessionStorage.removeItem("google_chat_access_token");
    setSpaces([]);
    setSelectedSpace(null);
    setMessages([]);
    showToast("Canal desconectado.", "info");
  };

  // List Spaces from Google Chat API
  const fetchSpaces = async () => {
    if (!token) return;
    setIsLoadingSpaces(true);
    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "application/json"
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          handleDisconnect();
          throw new Error("Sua sessão do Google Chat expirou. Por favor, conecte novamente.");
        }
        throw new Error(`Erro na API do Google: Código ${res.status}`);
      }

      const data = await res.json();
      setSpaces(data.spaces || []);
      if (data.spaces && data.spaces.length > 0 && !selectedSpace) {
        setSelectedSpace(data.spaces[0]);
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao consultar Espaços de mensagens ativos.", "error");
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  // Fetch Message feed from Google Chat
  const fetchMessages = async (spaceName: string) => {
    if (!token) return;
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error(`Código de resposta: ${res.status}`);
      }

      const data = await res.json();
      // Ensure messages are ordered ascending or handled correctly
      setMessages(data.messages || []);
      
      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error("Error messages:", err);
      // Suppress noisy overlays but show standard log warning
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Create Space (New Room)
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || !token) return;
    setIsCreatingSpace(true);
    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          spaceType: "SPACE",
          displayName: newSpaceName.trim()
        })
      });

      if (!res.ok) {
        throw new Error("Não foi possível criar o espaço. Verifique as permissões administrativas.");
      }

      const createdSpace = await res.json();
      showToast(`Espaço "${newSpaceName}" criado com sucesso no seu Google Chat!`, "success");
      setNewSpaceName("");
      setShowCreateSpaceModal(false);
      
      // Refresh list and select new space
      fetchSpaces();
      setSelectedSpace(createdSpace);
    } catch (err: any) {
      showToast(err.message || "Falha ao criar canal.", "error");
    } finally {
      setIsCreatingSpace(false);
    }
  };

  // Send Message to Google Chat
  const handleSendMessage = async (textToSend?: string) => {
    const finalMsg = textToSend || newMessage;
    if (!finalMsg.trim() || !selectedSpace || !token) return;
    setIsSendingMessage(true);
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace.name}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: finalMsg.trim()
        })
      });

      if (!res.ok) {
        throw new Error("Erro de webhook ou de escopo de gravação.");
      }

      if (!textToSend) {
        setNewMessage("");
      }
      showToast("Mensagem entregue com sucesso!", "success");
      
      // Reload current thread/messages
      fetchMessages(selectedSpace.name);
    } catch (err: any) {
      showToast("Falha ao entregar texto para o Google Chat. Experimente sincronizar de novo.", "error");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Quick Financial Summaries to post in chat
  const handleShareBalanceSummary = () => {
    const textMsg = `📊 *Dafne Financial BI - Resumo de Caixa Corp*\n` +
      `• *Saldo Acumulado:* R$ ${welcomeMetrics.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• *Faturamento Bruto:* R$ ${welcomeMetrics.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• *Total Contas PJ Pendentes:* R$ ${welcomeMetrics.pendingTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `⚡ _Atualizado direto da inteligência analítica de vanguarda._`;
    handleSendMessage(textMsg);
  };

  const handleShareOverdueAlert = () => {
    const textMsg = `🚨 *Alerta de Governança Operacional PJ*\n` +
      `⚠️ Constam *${welcomeMetrics.overdueCount}* fatura(s) PJ vencida(s) no seu livro diário de passivos de caixa.\n` +
      `Soma pendente total de contas operacionais a pagar: R$ ${welcomeMetrics.pendingTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.\n` +
      `Por favor, acesse a plataforma de auditoria interna para regularizarmos.`;
    handleSendMessage(textMsg);
  };

  const handleShareDailyIncome = () => {
    const textMsg = `📈 *Relatório Executivo de Receitas PJ - Dafne BI*\n` +
      `• Volume total de entradas ativas auditadas: R$ ${welcomeMetrics.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• Custos operacionais correspondentes: R$ ${welcomeMetrics.compras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
      `• Margem livre operacional líquida preliminar: *${(((welcomeMetrics.faturamento - welcomeMetrics.compras) / (welcomeMetrics.faturamento || 1)) * 100).toFixed(2)}%*`;
    handleSendMessage(textMsg);
  };

  // Sync Spaces on token change
  useEffect(() => {
    if (token) {
      fetchSpaces();
    }
  }, [token]);

  // Sync Messages when space changes
  useEffect(() => {
    if (selectedSpace) {
      fetchMessages(selectedSpace.name);
    }
  }, [selectedSpace]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-6 text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950 to-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl border border-zinc-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/35 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-300 font-mono">
            💬 CONECTIVIDADE INTEGRAL DE PRODUTO
          </span>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-sans">
            Comunicação Integrada via <span className="text-orange-400">Google Chat</span>
          </h2>
          <p className="text-slate-300 max-w-xl text-xs font-medium leading-relaxed font-sans">
            Compartilhe DREs de caixa instantâneas, alertas urgentes de vencimentos PJ e relatórios consultivos diretamente nos canais de comunicação da sua equipe.
          </p>
        </div>
      </div>

      {!token ? (
        /* DISCONNECTED / LOGIN STATE */
        <div className="bg-white border border-gray-150 p-10 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto my-12">
          <div className="bg-slate-50 border border-gray-100 p-6 rounded-full text-orange-500 scale-110 shadow-sm relative">
            <MessageSquare size={48} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-1.5 text-[8px] font-black">
              LIVE
            </span>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Sincronize com sua Conta Google Workspace
            </h3>
            <p className="text-xs text-gray-500 font-medium max-w-md leading-relaxed font-sans">
              Para listar seus canais, criar novos espaços de mensagens ou exportar os insights de BI, precisamos que você autorize o app da Dafne BI utilizando as credenciais seguras do Google Chat.
            </p>
          </div>

          <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl text-[11px] text-orange-850 font-medium max-w-lg leading-relaxed text-left">
            <div className="flex gap-2 items-start">
              <span className="text-lg">🛡️</span>
              <div>
                <strong>Segurança & Proteção de Dados:</strong> O acesso é feito via OAuth2 seguro de forma direta para a API Oficial de comunicação do Google. Seus relatórios somente serão compartilhados sob seu comando individual.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConnectChat}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-slate-900 border border-slate-950 text-white font-black text-xs uppercase px-8 py-3.5 rounded-2xl hover:bg-orange-600 hover:border-orange-600 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md disabled:bg-gray-350 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Autenticando via Google OAuth...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Conectar Conta Google Chat</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* CONNECTED DASHBOARD STATE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Panel - Channels / Spaces list */}
          <div className="lg:col-span-4 bg-white border border-gray-150 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
            
            <div className="space-y-4 flex-1">
              {/* Connected User Identity Pin */}
              <div className="bg-slate-50 border border-gray-150/60 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-black text-xs text-orange-500 border border-orange-200">
                    {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "G"}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-[11px] font-black uppercase text-slate-400 font-mono tracking-wider leading-none">USUÁRIO ADM CONECTADO</p>
                    <p className="text-xs font-extrabold text-slate-900 truncate mt-1">{user?.displayName || "Google User"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  title="Desconectar do Google Chat"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              </div>

              {/* Title & Sincronizar Area */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider font-mono">
                  Seus Canais & Espaços ({spaces.length})
                </h3>
                <button
                  type="button"
                  onClick={fetchSpaces}
                  disabled={isLoadingSpaces}
                  className="p-1 px-2.5 rounded-lg border border-gray-150 hover:bg-slate-50 text-slate-600 hover:text-orange-600 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} className={isLoadingSpaces ? "animate-spin" : ""} />
                  <span>Sincronizar</span>
                </button>
              </div>

              {/* Spaces List Container */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                {isLoadingSpaces && spaces.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 font-medium flex flex-col items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin text-orange-500" />
                    <span>Lendo espaços de mensagens do Google Chat...</span>
                  </div>
                ) : spaces.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-gray-250 p-4 rounded-xl text-xs text-gray-400 font-medium space-y-2">
                    <span>Nenhum espaço ativo encontrado na sua conta.</span>
                    <p className="text-[10px] text-gray-300">
                      Crie um novo espaço corporativo usando o botão de adição abaixo para começarmos.
                    </p>
                  </div>
                ) : (
                  spaces.map((space) => {
                    const isSelected = selectedSpace?.name === space.name;
                    return (
                      <button
                        key={space.name}
                        type="button"
                        onClick={() => setSelectedSpace(space)}
                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 border-slate-950 text-white font-extrabold pb-3.5 pr-4 pl-4"
                            : "bg-gray-50/40 border-gray-100 hover:bg-gray-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={isSelected ? "text-orange-400" : "text-gray-400"}>
                            {space.type === "DIRECT_MESSAGE" ? "👤" : <Hash size={14} />}
                          </span>
                          <span className="text-xs truncate">{space.displayName || "Sem Nome"}</span>
                        </div>
                        <ChevronRight size={12} className={isSelected ? "text-orange-400" : "text-gray-300"} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Create Space Trigger Button */}
            <button
              type="button"
              onClick={() => setShowCreateSpaceModal(true)}
              className="w-full bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-dashed border-gray-300 p-2.5 rounded-2xl text-[10.5px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Criar Novo Espaço Chat</span>
            </button>
          </div>

          {/* Right Panel - Active Chat Window */}
          <div className="lg:col-span-8 bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[500px]">
            
            {/* Thread Header */}
            <div className="border-b border-gray-150 p-4.5 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-2 rounded-xl text-xs font-black">
                  💬 G-CHAT
                </div>
                {selectedSpace ? (
                  <div className="text-left font-sans">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>{selectedSpace.displayName || "Espaço Ativo"}</span>
                      <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">
                        ({selectedSpace.type || "SPACE"})
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Transmitindo insights diretamente de Dafne BI</p>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 font-bold">Nenhum canal ativo selecionado</span>
                )}
              </div>

              {selectedSpace && (
                <button
                  type="button"
                  onClick={() => fetchMessages(selectedSpace.name)}
                  disabled={isLoadingMessages}
                  className="p-1 px-2 border border-gray-200 hover:bg-white rounded-lg text-gray-500 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw size={11} className={isLoadingMessages ? "animate-spin" : ""} />
                  <span>Sincronizar Feed</span>
                </button>
              )}
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 bg-slate-100/30 p-5 overflow-y-auto space-y-4 max-h-[350px] min-h-[300px]">
              {!selectedSpace ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-gray-400">
                  <span className="text-3xl">👈</span>
                  <p className="text-xs font-bold uppercase tracking-tight">Escolha ou crie um espaço do Google Chat</p>
                  <p className="text-[10px] font-medium text-gray-300">Selecione um canal na barra lateral para carregar a conversa e compartilhar dados.</p>
                </div>
              ) : isLoadingMessages && messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-3">
                  <Loader2 size={24} className="animate-spin text-orange-500" />
                  <span className="text-xs text-gray-400 font-medium">Requisitando histórico do chat corporativo...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 p-8 rounded-2xl space-y-3">
                  <span className="text-2xl text-gray-300">✉️</span>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-tight">Sem mensagens registradas hoje</p>
                  <p className="text-[10.5px] text-gray-450 leading-relaxed max-w-sm">
                    Este canal do Google Chat ainda não possui mensagens no histórico desta sessão, ou tem foco exclusivo de app. Diálogo inicial ativo!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col overflow-x-hidden">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, index) => {
                      const isAppSender = msg.sender?.type === "BOT";
                      return (
                        <motion.div
                          key={msg.name || index}
                          initial={{ opacity: 0, x: isAppSender ? 50 : -50, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                          className={`flex gap-3 max-w-[85%] ${
                            isAppSender ? "self-end flex-row-reverse" : "self-start"
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black border ${
                            isAppSender 
                              ? "bg-slate-900 border-slate-950 text-white" 
                              : "bg-orange-50 border-orange-100 text-orange-600"
                          }`}>
                            {msg.sender?.avatarUrl ? (
                              <img src={msg.sender.avatarUrl} alt="avatar" className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              msg.sender?.displayName?.slice(0, 2).toUpperCase() || "GC"
                            )}
                          </div>

                          {/* Speech Bubble */}
                          <div className="space-y-1">
                            <div className={`text-[9px] font-bold text-gray-400 ${isAppSender ? "text-right" : "text-left"}`}>
                              {msg.sender?.displayName || "Google Chat User"} •{" "}
                              {msg.createTime ? new Date(msg.createTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "agora"}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-full break-words text-left ${
                              isAppSender
                                ? "bg-orange-500 text-white rounded-tr-none font-medium selection:bg-orange-200"
                                : "bg-white border border-gray-150 rounded-tl-none text-slate-800"
                            }`}>
                              <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Quick Share Panels (Only when Space is Selected) */}
            {selectedSpace && (
              <div className="p-3 bg-slate-50 border-t border-b border-gray-150 flex flex-wrap gap-2 text-left items-center justify-between font-sans">
                <span className="text-[9.5px] font-black uppercase text-gray-400 font-mono tracking-wider">
                  ⚡ Compartilhar no Canal PJ:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleShareBalanceSummary}
                    title="Compartilhar resumo de caixa"
                    className="p-1 px-2.5 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-xl text-[10px] font-black text-slate-700 hover:text-orange-600 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <DollarSign size={11} className="text-orange-500 animate-pulse" />
                    <span>Resumo Caixa PJ</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareOverdueAlert}
                    title="Compartilhar alerta de vencimento"
                    className="p-1 px-2.5 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-200 rounded-xl text-[10px] font-black text-slate-700 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <AlertTriangle size={11} className="text-rose-500" />
                    <span>Aviso Contas Vencidas</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareDailyIncome}
                    title="Compartilhar fechamento do dia"
                    className="p-1 px-2.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl text-[10px] font-black text-slate-700 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 size={11} className="text-indigo-500" />
                    <span>Margem & Balanço</span>
                  </button>
                </div>
              </div>
            )}

            {/* Input Message Form */}
            <div className="p-4 bg-slate-50/60 border-t border-gray-150">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  disabled={!selectedSpace || isSendingMessage}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    selectedSpace
                      ? "Digite uma mensagem corporativa..."
                      : "Selecione um canal ao lado primeiro para poder enviar"
                  }
                  className="flex-1 text-xs font-semibold bg-white border border-gray-150/90 px-4 py-2.5 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!selectedSpace || !newMessage.trim() || isSendingMessage}
                  className="bg-slate-900 border border-slate-950 text-white font-black hover:bg-orange-600 hover:border-orange-600 p-2.5 rounded-2xl w-11 h-11 flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95 disabled:bg-gray-200 disabled:border-transparent disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isSendingMessage ? (
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* CREATE SPACE MODAL */}
      {showCreateSpaceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-zinc-950/60 blur-sm" onClick={() => setShowCreateSpaceModal(false)} />
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-3xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-200/60">
              <div className="px-6 pt-6 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-500 sm:mx-0 sm:h-9 sm:w-9">
                    <Users size={18} />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">Criar Novo Espaço de Mensagens</h3>
                    <p className="text-[10px] text-gray-500 font-medium font-sans mt-0.5">
                      Insira o nome do canal (Room) que deseja adicionar instantaneamente na sua plataforma de Google Chat Workspace.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateSpace} className="mt-5 space-y-4 font-sans">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 font-mono tracking-widest block mb-1">Nome do Espaço</label>
                    <input
                      type="text"
                      required
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                      placeholder="Ex: Dafne Financial Alertas PJ"
                      className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-orange-500 focus:bg-white outline-none text-slate-800"
                    />
                  </div>

                  <div className="bg-amber-50 p-3 rounded-2xl text-[9px] text-amber-900 font-medium leading-relaxed font-sans border border-amber-100 flex gap-2">
                    <span className="text-xs">👋</span>
                    <p>
                      <strong>Nota de Espaços do Chat:</strong> Lembre-se que para membros da sua equipe acessarem este espaço, você poderá convidá-los diretamente pela interface nativa do Google Chat.
                    </p>
                  </div>

                  {/* Trigger buttons */}
                  <div className="flex gap-2.5 pt-3 border-t border-gray-100 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCreateSpaceModal(false)}
                      className="text-xs font-bold uppercase text-slate-500 bg-slate-50 hover:bg-slate-100 border border-gray-200 px-4.5 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingSpace || !newSpaceName.trim()}
                      className="text-xs font-black uppercase text-white bg-slate-900 border border-slate-950 hover:bg-orange-600 hover:border-orange-600 px-5.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isCreatingSpace ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-white" />
                          <span>Criando...</span>
                        </>
                      ) : (
                        <span>Criar Espaço</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
