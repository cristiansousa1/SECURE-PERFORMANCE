import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  UtensilsCrossed, 
  Briefcase, 
  Code, 
  ArrowRight, 
  Percent, 
  Users, 
  RefreshCw, 
  Play,
  Lightbulb,
  CheckCircle2,
  PieChart,
  HelpCircle,
  TrendingDown,
  ChevronRight,
  Info,
  Newspaper,
  Cpu,
  Globe,
  Flame,
  Swords,
  History,
  Save,
  Copy,
  Check,
  ShieldAlert,
  Share2,
  UserPlus
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface SectorNews {
  id: string;
  title: string;
  source: string;
  date: string;
  category: "Tech" | "Mercado" | "Faturamento" | "Inovação";
  summary: string;
  hotness: "high" | "medium" | "low";
}

const getSectorNewsForSegment = (segment: string): SectorNews[] => {
  switch (segment) {
    case "commerce":
      return [
        {
          id: "comm-1",
          title: "Pix Reversível e Cashback de Controle Automatizado",
          source: "Febraban Digital",
          date: "Hoje",
          category: "Inovação",
          summary: "Implementação da nova tecnologia de cashback automático via Pix simplifica cobranças e devolve margem para incentivar novas compras imediatas.",
          hotness: "high"
        },
        {
          id: "comm-2",
          title: "Inteligência Artificial Local com Câmeras de Calor no Varejo",
          source: "E-Commerce Brasil",
          date: "Ontem",
          category: "Tech",
          summary: "Utilização de IA de prateleira para aferir fluxo de calor físico em gôndolas físicas, ajustando preços dinâmicos conforme picos de atratividade.",
          hotness: "high"
        },
        {
          id: "comm-3",
          title: "Modelos de Linguagem Conversacionais para Checkout",
          source: "E-Commerce News",
          date: "Há 2 dias",
          category: "Mercado",
          summary: "Varejistas relatam aumento médio de até 22% de faturamento bruto ao substituir barra fria de recomendação por chat interativo humanizado.",
          hotness: "medium"
        }
      ];
    case "food":
      return [
        {
          id: "food-1",
          title: "Algoritmos Zero Desperdício (Zero Waste AI Analytics)",
          source: "Abrasel",
          date: "Hoje",
          category: "Inovação",
          summary: "Conectar balanças inteligentes a preditores de clima em tempo real reduz compras excessivas de perecíveis e otimiza CMV setorial em até 4.5%.",
          hotness: "high"
        },
        {
          id: "food-2",
          title: "Pedidos Autônomos por Voz Natural de Baixíssima Latência",
          source: "FoodTech Hub",
          date: "Ontem",
          category: "Tech",
          summary: "Unidades que integraram comando de voz por IA natural e fluida no autoatendimento relatam impulsão de venda de sobremesas em 18.5%.",
          hotness: "high"
        },
        {
          id: "food-3",
          title: "Menu Esportivo de Preços de Demanda Elástica",
          source: "Gastronomia S/A",
          date: "Há 3 dias",
          category: "Faturamento",
          summary: "Reajustes ponderados automáticos baseados no fluxo de clientes desobstruem gargalos de cozinha e cobrem o custo de OPEX fixo no ócio.",
          hotness: "medium"
        }
      ];
    case "services":
      return [
        {
          id: "serv-1",
          title: "Revisão e Geração de Escopos em Lote por Agentes Cognitivos",
          source: "Harvard Business Review Brasil",
          date: "Hoje",
          category: "Inovação",
          summary: "Agências utilizam Agentes de IA para auditar e preencher painéis de timesheets de consultores, garantindo cobrança correta de horas de retrabalho.",
          hotness: "high"
        },
        {
          id: "serv-2",
          title: "Surgimento da Cobrança Híbrida em Serviços de Sucesso",
          source: "Exame Negócios",
          date: "Há 2 dias",
          category: "Faturamento",
          summary: "Retainers puros sofrem retração, dando espaço para contratos com taxa de sucesso atreladas à performance real dos dados gerados.",
          hotness: "medium"
        },
        {
          id: "serv-3",
          title: "Predição Inteligente de Churn por Sentimento de Vídeos",
          source: "TechCrunch",
          date: "Há 4 dias",
          category: "Tech",
          summary: "Modelos processam transcrições e entonação de voz em reuniões de entrega de briefing, alertando sobre risco de quebra de contrato imediato.",
          hotness: "high"
        }
      ];
    case "tech":
      return [
        {
          id: "tech-1",
          title: "Faturamento por Consumo Híbrido em SaaS AI-First",
          source: "SaaS Capital",
          date: "Hoje",
          category: "Inovação",
          summary: "Novas plataformas tech substituem a licença plana por usuário por billing orientado à eficiência de tokens e processamento em nuvem.",
          hotness: "high"
        },
        {
          id: "tech-2",
          title: "Demonstração Autônoma de Retorno sobre Investimento (ROI)",
          source: "VentureBeat",
          date: "Ontem",
          category: "Faturamento",
          summary: "Sistemas emitem resumos automáticos com o valor financeiro economizado pelo produto para tomadores de decisão, mitigando cancelamentos prematuros.",
          hotness: "high"
        },
        {
          id: "tech-3",
          title: "Migração para Modelos Locais WebAssembly (Edge AI)",
          source: "Wired",
          date: "Há 3 dias",
          category: "Tech",
          summary: "Executar processadores de linguagem no próprio navegador do cliente corta custos de servidor AWS em até 72%, melhorando a margem EBITDA.",
          hotness: "medium"
        }
      ];
    default:
      return [
        {
          id: "other-1",
          title: "Gestão Algorítmica Preventiva de Caixa e Juros Zero",
          source: "Valor Econômico",
          date: "Hoje",
          category: "Faturamento",
          summary: "Algoritmos avançados auxiliam pequenas e médias empresas a casar prazos médios de recebimento com o vencimento do OPEX mensal sem acionar linhas de crédito cara.",
          hotness: "high"
        },
        {
          id: "other-2",
          title: "Bloqueio Arbitrário de Preços Cambiais com Cofres Digitais",
          source: "Bloomberg",
          date: "Ontem",
          category: "Mercado",
          summary: "PMEs nacionais utilizam cofres automatizados de hedging para pré-comprar mercadorias e travar margem operacional antes de flutuações fiscais.",
          hotness: "medium"
        }
      ];
  }
};

export default function SegmentMetricsView() {
  const {
    transactions,
    categories,
    profile,
    products,
    storeProfiles,
    activeStoreId,
    setActiveStoreId,
    showToast
  } = useFinance();

  // Active store's segment resolution
  const activeStore = storeProfiles.find(s => s.id === activeStoreId);
  const detectedStoreSegment = activeStore?.businessSegment || profile?.businessSegment || localStorage.getItem("dafne_business_segment") || "commerce";

  const selectedSegment = detectedStoreSegment;

  // Track user interactive simulation weights
  const [markupSlider, setMarkupSlider] = useState<number>(1.8);
  const [stockTurnoverSlider, setStockTurnoverSlider] = useState<number>(6); // times per year
  const [cacSlider, setCacSlider] = useState<number>(45); // R$
  const [avgTicketSlider, setAvgTicketSlider] = useState<number>(85); // R$

  // Food specific inputs
  const [foodWastePct, setFoodWastePct] = useState<number>(8.5); // %
  const [tableTurnover, setTableTurnover] = useState<number>(3.2); // times per night
  const [seatCount, setSeatCount] = useState<number>(42);
  const [avgCoverSpend, setAvgCoverSpend] = useState<number>(65);

  // Services specific inputs
  const [billableHours, setBillableHours] = useState<number>(110); // per month
  const [hourlyRate, setHourlyRate] = useState<number>(150); // R$/hour
  const [monthlyOverhead, setMonthlyOverhead] = useState<number>(3500); // R$
  const [utilizationRate, setUtilizationRate] = useState<number>(75); // %

  // Tech specific inputs
  const [mrrBase, setMrrBase] = useState<number>(25000); // R$
  const [churnRate, setChurnRate] = useState<number>(3.5); // % per month
  const [cacTech, setCacTech] = useState<number>(350); // R$
  const [arpuTech, setArpuTech] = useState<number>(120); // R$

  // Inovação e Tecnologia: Estado de Benchmarking Dinâmico e Elasticidade de Preço
  const [selectedBenchmarkTier, setSelectedBenchmarkTier] = useState<"national" | "top10" | "exponential">("national");
  const [priceChangePct, setPriceChangePct] = useState<number>(10); // +10% de alteração de preço
  const [marketElasticity, setMarketElasticity] = useState<"inelastic" | "unitary" | "elastic">("unitary");

  // General helper variables derived from real transaction logs
  const filteredTransactions = activeStoreId === "all" 
    ? transactions 
    : transactions.filter(t => t.profileId === activeStoreId);

  const salesTransactions = filteredTransactions.filter(t => t.type === "income");
  const totalSales = salesTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalSalesCount = salesTransactions.length;
  const realTicketMedio = totalSalesCount > 0 ? totalSales / totalSalesCount : 85.00;

  // Resolve COGS (Custo de Vendas) and OPEX
  const totalCogs = filteredTransactions
    .filter(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return cat?.group === "COGS";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOpex = filteredTransactions
    .filter(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return cat?.group === "OPEX";
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const realCmvPct = totalSales > 0 ? (totalCogs / totalSales) * 100 : 32.5;

  // AI custom prompt response loading simulation or actual request
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Marketing & Growth technological states
  const [mktAdSpend, setMktAdSpend] = useState<number>(3500);
  const [mktCpc, setMktCpc] = useState<number>(1.25);
  const [mktConversionRate, setMktConversionRate] = useState<number>(2.5); // %
  const [mktTargetLtv, setMktTargetLtv] = useState<number>(0); // 0 means auto-derived
  const [mktObjective, setMktObjective] = useState<string>("Atração de Novos Clientes");
  const [mktTone, setMktTone] = useState<string>("Inovador & Tech");
  const [mktGeneratedCopy, setMktGeneratedCopy] = useState<string>("");
  const [mktIsGenerating, setMktIsGenerating] = useState<boolean>(false);

  // Distributed Channel Shares
  const [mktMetaShare, setMktMetaShare] = useState<number>(50);
  const [mktGoogleShare, setMktGoogleShare] = useState<number>(30);

  // Campaign Ledger State
  const [savedCreatives, setSavedCreatives] = useState<{ id: string; title: string; objective: string; tone: string; content: string; date: string }[]>([
    { 
      id: "1", 
      title: "Campanha Estrutural - Tração Primária PJ", 
      objective: "Atração de Novos Clientes", 
      tone: "Inovador & Tech", 
      content: "🚀 TRANSFORME SUA OPERAÇÃO PJ: Seus processos de vendas estão travados no analógico?\n\nConheça nossa nova infraestrutura tecnológica de alta performance focada em otimizar sua margem real de lucro. Fale com um consultor especialista agora e ganhe um playbook exclusivo de diagnóstico gratuito. Oferta válida por tempo limitado!", 
      date: "2026-05-25" 
    }
  ]);

  // Valuation & Exit Strategy Simulator States
  const [valEbitda, setValEbitda] = useState<number>(145000);
  const [valIndustryMultiple, setValIndustryMultiple] = useState<number>(4.2);
  const [valGovernanceScore, setValGovernanceScore] = useState<string>("contabilidade_simples");
  const [valKeyPersonDependency, setValKeyPersonDependency] = useState<string>("alta");
  const [valRecurrenceLevel, setValRecurrenceLevel] = useState<string>("mista");
  const [isCalculatingExitPath, setIsCalculatingExitPath] = useState<boolean>(false);
  const [valuationAiReport, setValuationAiReport] = useState<string>("");

  // Competitor Analysis States
  const [competitorName, setCompetitorName] = useState<string>("");
  const [competitorRevenue, setCompetitorRevenue] = useState<number>(35000);
  const [competitorGapsAnalysis, setCompetitorGapsAnalysis] = useState<string>("");
  const [isAnalyzingCompetitor, setIsAnalyzingCompetitor] = useState<boolean>(false);

  // Community Referral States
  const [inviteName, setInviteName] = useState<string>("");
  const [inviteContact, setInviteContact] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<string>("CFO / Sócio");
  const [invitedFriends, setInvitedFriends] = useState<{ id: string; name: string; contact: string; role: string; status: string; date: string }[]>([
    { id: "ref-1", name: "Rogério Antunes", contact: "(11) 98111-4432", role: "CFO de Varejo", status: "Confirmado", date: "2026-05-24" },
    { id: "ref-2", name: "Alessandra Toledo", contact: "alessandra@techhouse.io", role: "CEO & Co-founder", status: "Pendente", date: "2026-05-25" }
  ]);

  const handleSendCommunityInvite = () => {
    if (!inviteName.trim()) {
      showToast("Indique o nome do amigo ou parceiro comercial.", "warning");
      return;
    }
    if (!inviteContact.trim()) {
      showToast("Indique o número de WhatsApp ou e-mail de contato.", "warning");
      return;
    }

    const newInvite = {
      id: "ref-" + Date.now(),
      name: inviteName,
      contact: inviteContact,
      role: inviteRole,
      status: "Pendente",
      date: new Date().toISOString().split("T")[0]
    };

    setInvitedFriends(prev => [newInvite, ...prev]);
    setInviteName("");
    setInviteContact("");
    
    showToast(`O link exclusivo para ${inviteName} foi gerado com sucesso!`, "success");
  };

  // Helper to save current copy
  const handleSaveCurrentCreative = () => {
    if (!mktGeneratedCopy) {
      showToast("Não há criativo gerado para salvar no momento.", "warning");
      return;
    }
    const newCreative = {
      id: Date.now().toString(),
      title: `Criativo de Growth - ${mktObjective}`,
      objective: mktObjective,
      tone: mktTone,
      content: mktGeneratedCopy,
      date: new Date().toISOString().split('T')[0]
    };
    setSavedCreatives(prev => [newCreative, ...prev]);
    showToast("Criativo salvo com sucesso no seu Hub Ledger!", "success");
  };

  const handleCalculateExitPath = () => {
    setIsCalculatingExitPath(true);
    setValuationAiReport("");
    setTimeout(() => {
      const depLabel = valKeyPersonDependency === "total_dependencia" ? "Total dependência do fundador" : valKeyPersonDependency === "alta" ? "Alta dependência" : valKeyPersonDependency === "parcial" ? "Parcialmente independente" : "100% Independente (Delegada)";
      const recLabel = valRecurrenceLevel === "avulsa" ? "Apenas vendas avulsas corporativas" : valRecurrenceLevel === "mista" ? "Misto comercial" : "Recorrência forte (Assinaturas)";
      const govLabel = valGovernanceScore === "não_auditado" ? "Controle contábil simples não-auditado" : valGovernanceScore === "contabilidade_simples" ? "Controle conciliado estruturado" : "Auditoria certificada PFA";
      
      const report = `### 📋 Parecer de Otimização de Valuation Fin.AI & Dafne
Dafne analisou as finanças da sua empresa com base nos parâmetros inseridos e detectou uma oportunidade de elevar o valor do seu negócio em até **+45%** de forma estruturada.

#### ⚖️ Retrato do seu Multiplicador:
- **EBITDA Comercial Analisável:** R$ ${valEbitda.toLocaleString("pt-BR")},00
- **Dependência dos Sócios:** ${depLabel}
- **Previsibilidade de Caixa:** ${recLabel}
- **Nível de Governança Contábil:** ${govLabel}

---

#### 🚀 3 Iniciativas Críticas para Agregar Valor Imediato (R$ no Bolso no momento da Venda):
1. **Reduzir Dependência dos Sócios (Ganha até +20% no Valor):**
   Crie playbooks de processos para os 3 eixos fundamentais (Vendas, Atendimento e Faturamento). Quando um comprador vê que o negócio anda sem os sócios no operacional diário, o multiplicador de valuation sobe substancialmente de imediato.
2. **Converter 20% do faturamento em Recorrência (Ganha até +30% no Valor):**
   Mesmo trabalhando em varejo, alimentação ou serviços comuns, crie pacotes pré-pagos ou fidelidades mensais (Ex: Assinatura de café/cesta ou contratos de assessoria continuada). Negócios recorrentes possuem valuation de 2x a 3x maior por sua previsibilidade.
3. **Implantar Conciliação de Caixa 100% Auditada no Fin.AI (Ganha até +15% no Valor):**
   Deixar o balanço corporativo impecável e auditável previne o "desconto de risco de due diligence" exigido por investidores institucionais.

*Este plano prático e visual destrava um crescimento líquido e sustentável para qualquer negociação PJ.*`;

      setValuationAiReport(report);
      setIsCalculatingExitPath(false);
      showToast("Diagnóstico e Roteiro de Valuation gerados com Inteligência Artificial!", "success");
    }, 1200);
  };

  // Helper to delete a saved creative
  const handleDeleteCreative = (id: string) => {
    setSavedCreatives(prev => prev.filter(c => c.id !== id));
    showToast("Criativo removido do seu painel.", "info");
  };

  // Strategy Benchmarking handler
  const handleAnalyzeCompetitor = async () => {
    if (!competitorName.trim()) {
      showToast("Por favor, indique um nome para o seu concorrente.", "warning");
      return;
    }
    setIsAnalyzingCompetitor(true);
    setCompetitorGapsAnalysis("");
    try {
      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Você é a mestre em Growth Marketing e Estratégia Competitiva chamada Dafne.
Analise a concorrência contra a empresa '${competitorName}' que atua no mesmo segmento que nós ('${selectedSegment}').
Estimativa de Faturamento Mensal do Concorrente: R$ ${competitorRevenue.toLocaleString()}

Nossas Informações Contábeis Reais (para embasamento de margem e força tática):
- Faturamento Total Real nosso: R$ ${totalSales.toFixed(2)}
- Ticket Médio nosso: R$ ${realTicketMedio.toFixed(2)}
- Nosso Custo de Aquisição de Clientes (CAC): R$ ${cacMkt.toFixed(2)}
- Nossa relação LTV/CAC: ${(computedLtv / (cacMkt || 1)).toFixed(2)}x

Por favor, elabore um "Parecer de Gaps de Conversão & Contra-Ataque de Crescimento" contendo as seguintes 3 partes estruturadas e diretas em português do Brasil (use formatação markdown limpa com subtítulos claros):
1. **ANÁLISE DE VULNERABILIDADES DO CONCORRENTE:** O faturamento de R$ ${competitorRevenue.toLocaleString()} sugere um certo volume de vendas. Quais são os principais gargalos tecnológicos e de conversão que uma empresa desse porte comumente sofre no nicho de '${selectedSegment}'?
2. **PLANILHA DE CONTRA-ATAQUE DAFNE:** Proponha uma tática comercial agressiva baseada na nossa agilidade tecnológica e no nosso ticket médio de R$ ${realTicketMedio.toFixed(2)}.
3. **MÉTRICA CHAVE DE COMBATE:** Indique um indicador de ativação rápida para superarmos sua presença física ou online.`,
          history: []
        })
      });
      const data = await response.json();
      if (data && data.text) {
        setCompetitorGapsAnalysis(data.text);
        showToast(`Parecer estratégico contra ${competitorName} gerado!`, "success");
      } else {
        setCompetitorGapsAnalysis("A mentora Dafne está com oscilações no servidor de inteligência estratégica. Repita a operação.");
      }
    } catch (e) {
      console.error(e);
      setCompetitorGapsAnalysis("Erro ao estabelecer conexão segura de análise tática no servidor.");
    } finally {
      setIsAnalyzingCompetitor(false);
    }
  };

  const handleGenerateMarketingCopy = async () => {
    setMktIsGenerating(true);
    setMktGeneratedCopy("");
    try {
      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Você é uma especialista em Growth Marketing e Copywriting de alta conversão chamada Dafne. 
Gere um conjunto completo de criativos de campanha para o segmento cadastrado '${selectedSegment}'.

Objetivo da Campanha: ${mktObjective}
Tom de Voz: ${mktTone}
Dados de Entrada do Negócio (Consonantes com o fluxo contábil real em reais):
- Ticket Médio Real do Negócio: R$ ${realTicketMedio.toFixed(2)}
- Verba Mensal Simulada de Tráfego: R$ ${mktAdSpend.toFixed(2)}
- Custo por Clique Simulado (CPC): R$ ${mktCpc.toFixed(2)}
- Taxa de Conversão do Funil Estimada: ${mktConversionRate.toFixed(1)}%

Por favor, apresente na sua resposta 3 formatos prontos para copiar em português do Brasil:
1. **ANÚNCIO PARA REDES SOCIAIS (Meta/Instagram/TikTok):** Com gancho de atenção disruptivo focado no nicho, corpo altamente persuasivo e chamada para ação (CTA).
2. **HEALDINES PARA GOOGLE ADS:** Três títulos eficientes e descrições diretas para mecanismos de busca.
3. **PEQUENO CONSELHO DE PERFORMANCE (Growth Hack):** Um hack de tecnologia para reduzir o CAC e aumentar a taxa de conversão neste canal específico.`,
          history: []
        })
      });
      const data = await response.json();
      if (data && data.text) {
        setMktGeneratedCopy(data.text);
        showToast("Anúncios & Copys de Growth gerados pela I.A. Dafne!", "success");
      } else {
        setMktGeneratedCopy("A mentora Dafne não pôde gerar as copys de anúncios no momento. Recarregue.");
      }
    } catch (e) {
      console.error(e);
      setMktGeneratedCopy("Ocorreu uma falha na conexão de marketing integrada ao servidor de Inteligência Artificial.");
    } finally {
      setMktIsGenerating(false);
    }
  };

  // Marketing estimation calculations
  const computedLtv = mktTargetLtv > 0 ? mktTargetLtv : (realTicketMedio > 0 ? realTicketMedio * 1.5 : 120);
  const clicksMkt = Math.round(mktAdSpend / (mktCpc || 0.1));
  const clientsMkt = Math.max(1, Math.round(clicksMkt * (mktConversionRate / 100)));
  const cacMkt = mktAdSpend / clientsMkt;
  const growthRevenue = clientsMkt * computedLtv;
  const roasMkt = growthRevenue / (mktAdSpend || 1);
  const mktRoi = ((growthRevenue - mktAdSpend) / (mktAdSpend || 1)) * 100;
  const isHealthyLtvCac = computedLtv / (cacMkt || 1) >= 3.0;

  // Multi-Channel Calculations
  const mktOrganicShare = Math.max(0, 100 - mktMetaShare - mktGoogleShare);

  // Meta Ads Channel Data
  const metaSpend = mktAdSpend * (mktMetaShare / 100);
  const metaCpc = mktCpc;
  const metaClicks = Math.round(metaSpend / (metaCpc || 0.1));
  const metaClients = Math.round(metaClicks * (mktConversionRate / 100));
  const metaCac = metaClients > 0 ? (metaSpend / metaClients) : (metaSpend > 0 ? metaSpend : 0);
  const metaRevenue = metaClients * computedLtv;
  // Payback period = CAC / (Monthly Net Margin Contribution, estimated at Ltv / 10)
  const metaPayback = metaCac > 0 ? (metaCac / Math.max(10, (computedLtv / 10))) : 0;

  // Google Ads Channel Data
  const googleSpend = mktAdSpend * (mktGoogleShare / 100);
  const googleCpc = mktCpc * 1.35;
  const googleClicks = Math.round(googleSpend / (googleCpc || 0.1));
  // High-search-intent conversion increase
  const googleClients = Math.round(googleClicks * ((mktConversionRate * 1.4) / 100));
  const googleCac = googleClients > 0 ? (googleSpend / googleClients) : (googleSpend > 0 ? googleSpend : 0);
  const googleRevenue = googleClients * computedLtv;
  const googlePayback = googleCac > 0 ? (googleCac / Math.max(10, (computedLtv / 10))) : 0;

  // Organic / SEO / Direct Channel Data
  const organicSpend = mktAdSpend * (mktOrganicShare / 100);
  // Organic/SEO doesn't have CPC, but equivalent investment-to-click cost is extremely low over time
  const organicClicks = Math.round((organicSpend * 3) / (mktCpc || 0.1));
  const organicClients = Math.round(organicClicks * ((mktConversionRate * 1.8) / 100));
  const organicCac = organicClients > 0 ? (organicSpend / organicClients) : (organicSpend > 0 ? organicSpend / 3 : 0);
  const organicRevenue = organicClients * computedLtv;
  const organicPayback = organicCac > 0 ? (organicCac / Math.max(10, (computedLtv / 10))) : 0;

  // AI-powered Sector News feed integration
  const [activeNewsAnalysisId, setActiveNewsAnalysisId] = useState<string | null>(null);
  const [newsAnalyses, setNewsAnalyses] = useState<Record<string, string>>({});
  const [analyzingNewsId, setAnalyzingNewsId] = useState<string | null>(null);

  const handleAnalyzeNews = async (newsItem: SectorNews) => {
    setAnalyzingNewsId(newsItem.id);
    setActiveNewsAnalysisId(newsItem.id);
    try {
      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Você é a mentora e assessora de negócios Dafne. Analise a seguinte notícia de inovação ou tendência '${newsItem.title}' do canal '${newsItem.source}' focada no nicho de mercado '${selectedSegment}'.
Considere meus dados contábeis consolidados reais:
- Faturamento Total Real: R$ ${totalSales.toFixed(2)}
- Custo de Mercadorias/Vendas (COGS): R$ ${totalCogs.toFixed(2)}
- Despesas Operacionais (OPEX): R$ ${totalOpex.toFixed(2)}
- Margem Líquida Real: ${userNetMargin.toFixed(1)}%
- Ticket Médio Real: R$ ${realTicketMedio.toFixed(2)}

O seu retorno DEVE conter 3 seções curtas, diretas e super profissionais em português do Brasil:
1. **IMPACTO NO SEU CAIXA (Simulação Metódica):** Estime de forma numérica e direta de que forma essa inovação pode otimizar meu faturamento ou reduzir meus custos no curto prazo.
2. **RECOMENDAÇÃO TÁTICA DAFNE:** Como posso aplicar ou me adaptar a essa notícia em 3 passos práticos específicos.
3. **MÉTRICA DE IMPACTO:** Qual indicador (ex: Giro de Estoque, CMV, MRR ou Taxa de Utilização) deve ser monitorado de perto.`,
          history: []
        })
      });
      const data = await response.json();
      if (data && data.text) {
        setNewsAnalyses(prev => ({
          ...prev,
          [newsItem.id]: data.text
        }));
        showToast("Análise da notícia por I.A. concluída!", "success");
      } else {
        setNewsAnalyses(prev => ({
          ...prev,
          [newsItem.id]: "Dafne não pôde consolidar a análise. Recarregue em instantes."
        }));
      }
    } catch (e) {
      console.error(e);
      setNewsAnalyses(prev => ({
        ...prev,
        [newsItem.id]: "Erro ao conectar com a IA Dafne para inteligência setorial externa."
      }));
    } finally {
      setAnalyzingNewsId(null);
    }
  };

  const handleAskDafneInsights = async () => {
    setIsAiLoading(true);
    setAiInsight("");
    try {
      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Gerar sugestões e direcionamentos analíticos estratégicos e de controle profundo exclusivamente para o nicho comercial do tipo "${selectedSegment}". Considere que meu faturamento total atual é R$ ${totalSales.toFixed(2)}, meus custos diretos (COGS) são R$ ${totalCogs.toFixed(2)}, minas despesas operacionais (OPEX) estão em R$ ${totalOpex.toFixed(2)}, e meu ticket médio real extraído das transações é R$ ${realTicketMedio.toFixed(2)}. Por favor, entregue 4 dicas super objetivas de maximização com porcentagens de metas sugeridas e títulos curtos.`,
          history: []
        })
      });
      const data = await response.json();
      if (data && data.text) {
        setAiInsight(data.text);
        showToast("Análise estratégica de nicho gerada por Dafne!", "success");
      } else {
        setAiInsight("Dafne não pôde consolidar a análise em tempo real. Tente novamente em instantes.");
      }
    } catch (e) {
      console.error(e);
      setAiInsight("Erro ao contactar a conselheira de faturamento. Usando inteligência local do sistema.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Pre-compiled native local advisor recommendations if AI is not fetched yet
  const getLocalSegmentTips = (segment: string) => {
    switch (segment) {
      case "commerce":
        return [
          {
            title: "Giro de Estoque e Obsolescência",
            description: "Itens com mais de 75 dias no estoque corroem sua margem de contribuição. Faça liquidações focadas (Markup 1.1x) para liberar liquidez de caixa.",
            impact: "+15% Liquidez de Caixa",
            status: "crítico"
          },
          {
            title: "Otimização de Ticket Médio por Checkout",
            description: "Implemente produtos complementares (cross-selling) com preço de impulso ao lado do caixa ou em checkout virtual de e-commerce.",
            impact: "+8% Vendas Totais",
            status: "oportunidade"
          },
          {
            title: "Estudo de Antecipação de Recebíveis",
            description: "Taxas de antecipação de cartão (1.8% a 3.4%) ocultas em relatórios mensais somam perdas expressivas. Priorize Pix ou adie prazos de OPEX para casar fluxo.",
            impact: "Redução de 4% de custos financeiros",
            status: "vulnerável"
          }
        ];
      case "food":
        return [
          {
            title: "Engenharia de Cardápio (Menu Psychology)",
            description: "Destaque itens de alto markup e baixo tempo de preparo geométrico no canto superior direito do menu físico ou digital.",
            impact: "+12% Margem de Contribuição",
            status: "crítico"
          },
          {
            title: "Controles de Fita de Produção & Desperdício",
            description: "Divida o desperdício em 3 etapas: Pré-preparo, Sobra de Prato e Validade. O desperdício total não deve ultrapassar 4.5% do CMV.",
            impact: "Otimização de 3.2% de Margem Bruta",
            status: "crítico"
          },
          {
            title: "Gargalo Operacional no Salão",
            description: "Cada mesa livre desnecessariamente por 15min durante horários de pico custa em média R$ 45. Melhore o fluxo de pagamento com tablets ou QR Code.",
            impact: "Aumento de Giro de Mesas em 0.5x",
            status: "oportunidade"
          }
        ];
      case "services":
        return [
          {
            title: "Faturamento Fixo (Assinatura Recorrente)",
            description: "Substitua a cobrança avulsa por contratos de retainer mensualizados (com franquia de horas), estabilizando o fluxo primário de caixa.",
            impact: "+40% Previsibilidade Mensal",
            status: "oportunidade"
          },
          {
            title: "Mensuração de Horas de Retrabalho",
            description: "Crie relatórios internos rápidos no kanban de entrega. Horas perdidas corrigindo escopo sem cobrança adicional reduzem a taxa real da sua hora de R$ 150 para menos de R$ 80.",
            impact: "Mais eficiência de OPEX em 18%",
            status: "vulnerável"
          },
          {
            title: "Prospecção Síncrona vs. Indicação",
            description: "Se 80% dos clientes dependem de indicações espontâneas, sua captação é passiva e vulnerável. Crie campanhas de Referral estruturadas com bônus fixos.",
            impact: "Previsibilidade de novos leads em 2x",
            status: "crítico"
          }
        ];
      case "tech":
        return [
          {
            title: "Métricas LTV/CAC Saudáveis",
            description: "Modelos SaaS ou Agências digitais exigem um LTV pelo menos 3x maior que o CAC. Reduza o CAC focando em marketing orgânico ou parcerias integradas.",
            impact: "Redução de Burn Rate em 20%",
            status: "oportunidade"
          },
          {
            title: "Incomodação do Churn Voluntário",
            description: "Clientes saem por má experiência ou falta de adoção inicial. Crie um fluxo robusto de Onboarding assistido nas duas primeiras semanas.",
            impact: "Queda de Churn de 4.5% para 2.0%",
            status: "crítico"
          },
          {
            title: "Acompanhamento de Servidores & API Overheads",
            description: "Identifique custos ocultos em moedas estrangeiras (como AWS, OpenAI, etc.). Faça o hedge ou compre instâncias reservadas.",
            impact: "Economia de até 15% em custos tech",
            status: "oportunidade"
          }
        ];
      default:
        return [
          {
            title: "Ponto de Equilíbrio Realista",
            description: "Seu ponto de equilíbrio exige monitoramento diário. Se as margens variáveis oscilarem, aumente o prazo de pagamento com fornecedores para compensar.",
            impact: "Fôlego financeiro adicional",
            status: "oportunidade"
          },
          {
            title: "Reservas de Contingência PJ",
            description: "Evite utilizar recursos de pessoa física para cobrir descasamento de caixa comercial. Crie uma linha automática de aplicação diária de 5% de toda receita líquida.",
            impact: "Segurança de fluxo de caixa",
            status: "crítico"
          }
        ];
    }
  };

  const segmentDetails = {
    commerce: { label: "🛍️ Varejo & Comércio", desc: "Foco em Giro de Estoque, Precificação Markup e custo de aquisição (CAC).", color: "from-blue-600/10 to-indigo-600/10 text-indigo-700 bg-indigo-50 border-indigo-200" },
    food: { label: "🍔 Alimentação & Gastronomia", desc: "Foco em CMV (Custo de Mercadoria Vendida), Desperdício de Insumos e Ocupação do Salão.", color: "from-[#e26a2c]/10 to-orange-600/10 text-[#e26a2c] bg-orange-50 border-orange-200" },
    services: { label: "💼 Serviços & Consultorias", desc: "Foco em Valor Hora Praticado, Horas Faturáveis (Utilization Rate) e Prevenção de Retrabalho.", color: "from-teal-600/10 to-emerald-600/10 text-emerald-700 bg-emerald-50 border-emerald-200" },
    tech: { label: "💻 SaaS, Assinaturas & Tech", desc: "Foco em MRR (Receita Recorrente), Churn Rate de Clientes, LTV e Custo de Infraestrutura Cloud.", color: "from-slate-600/10 to-slate-900/10 text-slate-800 bg-slate-50 border-slate-350" },
    other: { label: "🏪 Outros Modelos PJ", desc: "Painel Geral de Liquidez PJ, Ponto de Equilíbrio Realista de DRE e Margem EBITDA Ponderada.", color: "from-slate-600/10 to-zinc-650/10 text-zinc-700 bg-zinc-50 border-zinc-200" }
  }[selectedSegment as "commerce" | "food" | "services" | "tech" | "other"] || { label: "🏪 GERAL UNIFICADO", desc: "Monitoramento de liquidez pj, margem EBITDA e prazo de caixa.", color: "from-gray-650/10 to-gray-800/10 text-gray-700 bg-gray-50 border-gray-250" };

  const currentLocalTips = getLocalSegmentTips(selectedSegment);

  // ----------------------------------------------------
  // METODOLOGIA CIENTÍFICA: CÁLCULOS DE BENCHMARKING DINÂMICO
  // ----------------------------------------------------
  const userGrossMargin = totalSales > 0 ? ((totalSales - totalCogs) / totalSales) * 100 : 65.0;
  const userOpexRatio = totalSales > 0 ? (totalOpex / totalSales) * 100 : 30.0;
  const userNetMargin = totalSales > 0 ? ((totalSales - totalCogs - totalOpex) / totalSales) * 100 : 15.0;

  const getBenchmarkMetricsForSegmentAndTier = () => {
    const isComm = selectedSegment === "commerce";
    const isFood = selectedSegment === "food";
    const isServ = selectedSegment === "services";
    const isTech = selectedSegment === "tech";

    if (selectedBenchmarkTier === "national") {
      return {
        grossMargin: isComm ? 55 : isFood ? 62 : isServ ? 75 : 80,
        opexRatio: isComm ? 38 : isFood ? 48 : isServ ? 45 : 55,
        netMargin: isComm ? 12 : isFood ? 14 : isServ ? 20 : 18,
      };
    } else if (selectedBenchmarkTier === "top10") {
      return {
        grossMargin: isComm ? 68 : isFood ? 72 : isServ ? 85 : 90,
        opexRatio: isComm ? 28 : isFood ? 38 : isServ ? 35 : 42,
        netMargin: isComm ? 20 : isFood ? 22 : isServ ? 32 : 30,
      };
    } else { // exponential
      return {
        grossMargin: isComm ? 78 : isFood ? 80 : isServ ? 92 : 95,
        opexRatio: isComm ? 18 : isFood ? 28 : isServ ? 24 : 28,
        netMargin: isComm ? 32 : isFood ? 38 : isServ ? 48 : 45,
      };
    }
  };

  const currentBenchmark = getBenchmarkMetricsForSegmentAndTier();

  const comparisonChartData = [
    {
      name: "Margem Bruta %",
      "Sua Empresa": parseFloat(userGrossMargin.toFixed(1)),
      "Benchmark Alvo": currentBenchmark.grossMargin,
    },
    {
      name: "Despesa OPEX %",
      "Sua Empresa": parseFloat(userOpexRatio.toFixed(1)),
      "Benchmark Alvo": currentBenchmark.opexRatio,
    },
    {
      name: "Margem Líquida %",
      "Sua Empresa": parseFloat(userNetMargin.toFixed(1)),
      "Benchmark Alvo": currentBenchmark.netMargin,
    },
  ];

  // ----------------------------------------------------
  // ENGENHARIA DE SIMULAÇÃO DE ELASTICIDADE DE DEMANDA
  // ----------------------------------------------------
  const getElasticityCoefficient = () => {
    if (marketElasticity === "inelastic") return -0.4;
    if (marketElasticity === "unitary") return -1.0;
    return -1.8;
  };

  const elasticityCoef = getElasticityCoefficient();
  const volumeChangePct = priceChangePct * elasticityCoef;
  
  const priceMultiplier = 1 + (priceChangePct / 100);
  const volumeMultiplier = Math.max(0.1, 1 + (volumeChangePct / 100)); // piso mínimo de 10%
  
  const currentRevenue = totalSales > 0 ? totalSales : 45000;
  const currentCogs = totalCogs > 0 ? totalCogs : 15000;
  const currentOpex = totalOpex > 0 ? totalOpex : 12000;

  const simulatedRevenue = currentRevenue * priceMultiplier * volumeMultiplier;
  const simulatedCogs = currentCogs * volumeMultiplier;
  const simulatedOpex = currentOpex;

  const currentProfitReal = currentRevenue - currentCogs - currentOpex;
  const simulatedProfit = simulatedRevenue - simulatedCogs - simulatedOpex;
  const profitDifference = simulatedProfit - currentProfitReal;

  const getElasticityVerdict = () => {
    if (profitDifference > currentProfitReal * 0.05) {
      return {
        title: "Zona de Expansão e Lucratividade Máxima 🚀",
        desc: "Excelente! As perdas volumétricas por debandada de clientes são compensadas perfeitamente pelo fôlego extra do preço unitário. Prossiga com reajustes graduais.",
        style: "bg-emerald-50/80 border-emerald-200 text-emerald-800",
        badge: "Altamente Viável"
      };
    } else if (profitDifference > -currentProfitReal * 0.02) {
      return {
        title: "Zona de Equilíbrio Frágil ⚖️",
        desc: "O reajuste apresenta resultado neutro ou muito plano. O ganho marginal por transação equilibra quase perfeitamente a queda de vendas. Ajuste com extrema prudência comercial.",
        style: "bg-blue-50/80 border-blue-200 text-blue-800",
        badge: "Moderação Crítica"
      };
    } else {
      return {
        title: "Erosão Severa de Caixa ⚠️",
        desc: "Alerta de elasticidade-preço! Seu público é altamente sensível ao preço neste segmento. A perda de volume arrebina seu caixa de forma violenta. Prefira cortar OPEX.",
        style: "bg-rose-50/80 border-rose-200 text-rose-800",
        badge: "Risco Alto"
      };
    }
  };

  const getDynamicValuation = () => {
    let depMult = 1.0;
    if (valKeyPersonDependency === "total_dependencia") depMult = 0.75;
    else if (valKeyPersonDependency === "alta") depMult = 0.9;
    else if (valKeyPersonDependency === "parcial") depMult = 1.05;
    else if (valKeyPersonDependency === "independente") depMult = 1.25;

    let recMult = 1.0;
    if (valRecurrenceLevel === "avulsa") recMult = 0.8;
    else if (valRecurrenceLevel === "mista") recMult = 1.0;
    else if (valRecurrenceLevel === "recorrente") recMult = 1.3;

    let govMult = 1.0;
    if (valGovernanceScore === "não_auditado") govMult = 0.85;
    else if (valGovernanceScore === "contabilidade_simples") govMult = 1.0;
    else if (valGovernanceScore === "auditoria_plena_pfa") govMult = 1.15;

    const baseMultiple = valIndustryMultiple;
    const finalMultiple = baseMultiple * depMult * recMult * govMult;
    const calculatedValuation = valEbitda * finalMultiple;

    return {
      finalMultiple,
      calculatedValuation,
      rating: finalMultiple > 5.2 ? "A+" : finalMultiple > 4.2 ? "A" : finalMultiple > 3.2 ? "B" : "C"
    };
  };

  const { finalMultiple, calculatedValuation, rating } = getDynamicValuation();

  const elasticityVerdict = getElasticityVerdict();

  return (
    <div className="space-y-8 pb-12">
      {/* INTRO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-[#13152d] to-[#12111d] rounded-2xl p-8 text-white border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/30 rounded-xl px-3 py-1 text-xs text-indigo-300 font-bold uppercase tracking-wider">
              <Sparkles size={12} className="animate-pulse" /> Inteligência Setorial Dedicada
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight" id="niche-title">
              Métricas & Dicas por Segmento de Atuação
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              O Fin.AI analisa e subdivide as operações da sua matriz e filias de acordo com o modelo de negócio registrado, comparando com benchmarks nacionais e fornecendo calculadores de simulação avançados.
            </p>
          </div>
          
          <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-xl border border-slate-700 space-y-2 min-w-[220px]">
            <span className="text-[10px] uppercase text-slate-400 font-black tracking-wider block">Unidade Selecionada Atualmente:</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏪</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {activeStoreId === "all" ? "Apurar Consolidadas (Consolidação de Filiais)" : activeStore?.companyName || "Matriz"}
                </p>
                <p className="text-[9px] text-orange-400 font-mono font-bold uppercase">
                  Segmento: {detectedStoreSegment === "commerce" ? "🛍️ Varejo" : detectedStoreSegment === "food" ? "🍔 Alimentação" : detectedStoreSegment === "services" ? "💼 Serviços" : detectedStoreSegment === "tech" ? "💻 Tecnologia" : "🏪 Geral"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GUIA ULTRA RÁPIDO PARA NÃO-TECNOLÓGICOS (Acessibilidade & Usabilidade) */}
      <div className="bg-gradient-to-br from-indigo-50 via-sky-50/50 to-white border border-indigo-100 rounded-2xl p-5 text-left text-slate-800 shadow-sm relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-md shrink-0 text-lg flex items-center justify-center w-10 h-10">
            💡
          </div>
          <div className="space-y-2 min-w-0">
            <h4 className="text-sm font-black text-indigo-950 uppercase tracking-tight flex items-center gap-2">
              Guia Rápido: Como ler estes números sem complicação
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Não se preocupe com termos técnicos difíceis! Esta janela calcula como o dinheiro investido em anúncios traz clientes de verdade para o seu caixa. Veja o significado simplificado de cada indicador abaixo:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/80 p-3 rounded-xl border border-indigo-50/80 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 block">💸 Custo por Novo Cliente (CAC)</span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Representa o valor gasto em anúncios para trazer <strong>um único cliente novo</strong>. Quanto menor for este valor, mais barato e fácil está sendo atrair novas vendas!
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-indigo-50/80 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 block">🔁 Retorno Médio de Gasto (LTV)</span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Estima o quanto de faturamento um cliente deixa no seu negócio ao longo de toda a sua relação com ele. Se for muito maior do que o CAC, seu marketing é <strong>altamente lucrativo</strong>!
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-indigo-50/80 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 block">⏳ Tempo de Retorono (Payback)</span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Mostra <strong>quantos meses</strong> você leva para recuperar o dinheiro que gastou com anúncios para trazer o cliente. Quanto mais rápido recuperar, mais dinheiro sobra em caixa livre.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PORTAL DA COMUNIDADE VIP & INDICAÇÃO DE PARCEIROS (Private Alliance Hub) */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-orange-500/30 hover:border-orange-500/50 rounded-2xl p-6 space-y-6 relative z-10 text-left transition-all shadow-xl font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-805 pb-4 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] bg-orange-950 text-orange-400 font-mono font-bold px-2 py-0.5 rounded-md border border-orange-500/20 uppercase tracking-widest">
              Campanha Ativa • Indique e Ganhe
            </span>
            <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
              <UserPlus size={16} className="text-orange-500 animate-pulse" /> Campanha Especial: Indique um Amigo (1º Mês Grátis)
            </h3>
            <p className="text-xs text-slate-300">
              Convide outros empreendedores, fundadores ou diretores comerciais com este convite exclusivo: <strong className="text-orange-400">O primeiro mês de uso é 100% gratuito!</strong> Ele só precisa assinar para ativar, e as faturas só serão geradas no segundo mês de uso.
            </p>
          </div>
          <div className="bg-emerald-950 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-mono font-bold uppercase tracking-wider shrink-0 text-[10px] text-center">
            {invitedFriends.length} convites ativos
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Form column */}
          <div className="lg:w-2/5 flex flex-col justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-850 space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Nome do seu Amigo / Convidado:</label>
                <input 
                  type="text"
                  placeholder="Ex: Carlos Albuquerque"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">WhatsApp ou E-mail dele:</label>
                <input 
                  type="text"
                  placeholder="Ex: (11) 99999-8888 ou email@parceiro.com"
                  value={inviteContact}
                  onChange={(e) => setInviteContact(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Cargo / Relação Comercial:</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:border-orange-500 outline-none font-bold cursor-pointer"
                >
                  <option value="CFO / Diretor Financeiro">CFO / Diretor Financeiro</option>
                  <option value="CEO & Sócio Geral">CEO & Sócio Geral</option>
                  <option value="Controller / Contador PJ">Controller / Contador PJ</option>
                  <option value="Investidor ou Mentor">Investidor ou Mentor</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSendCommunityInvite}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-slate-950 py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
            >
              <Share2 size={13} className="text-slate-950" />
              Gerar Convite de 1º Mês Grátis
            </button>
          </div>

          {/* Status Column list */}
          <div className="flex-1 flex flex-col justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-850 space-y-4">
            {/* Progress panel */}
            <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-300 font-bold uppercase">Progresso de Destrave de Conteúdo</span>
                <span className="text-orange-400 font-mono font-black">{invitedFriends.length}/4 Indicados</span>
              </div>
              
              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                <div 
                  className="bg-gradient-to-r from-orange-600 to-orange-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (invitedFriends.length / 4) * 100)}%` }}
                />
              </div>
              
              <div className="text-[10px] text-slate-400 leading-relaxed">
                {invitedFriends.length >= 4 ? (
                  <p className="text-emerald-400 font-black flex items-center gap-1">
                    🎉 Aliança de Guerra Completa! Seus relatórios de valuation da Dafne estão totalmente liberados.
                  </p>
                ) : (
                  <p>
                    Como funciona? Faltam <strong className="text-orange-400 font-bold">{4 - invitedFriends.length}</strong> ativações para você destravar o <strong>Diagnóstico de Valuation Secreto</strong> da Dafne. Cada amigo que você convidar ganha o <strong className="text-emerald-400 font-bold">1º mês totalmente grátis</strong> para testar a vontade.
                  </p>
                )}
              </div>
            </div>

            {/* Invitations List */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin text-left">
              <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider mb-1">Membros Convidados na Rede:</span>
              {invitedFriends.map((friend) => (
                <div key={friend.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 flex items-center justify-between text-[11px] gap-2">
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-202 truncate flex items-center gap-1">
                      {friend.name}
                      <span className="text-[8px] bg-orange-950 text-orange-400 px-1 py-0.2 rounded font-mono font-normal">1º Mês Grátis</span>
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-mono truncate">{friend.contact} • {friend.role}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "text-[8.5px] px-1.5 py-0.5 rounded font-bold",
                      friend.status === "Confirmado" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" : "bg-amber-950 text-amber-400 border border-amber-500/20"
                    )}>
                      {friend.status}
                    </span>
                    <button
                      onClick={() => {
                        const inviteText = `Olá, ${friend.name}! Estou utilizando a inteligência financeira Fin.AI e acabo de te liberar um convite promocional exclusivo com o primeiro mês 100% GRÁTIS! Você só precisa assinar sem pagar nada, e a primeira fatura será gerada apenas a partir do segundo mês de uso para testar à vontade. Aproveite o convite aqui: https://fin.ai/join/comunidade?ref=${friend.id}`;
                        navigator.clipboard.writeText(inviteText);
                        showToast(`Convide copiado com sucesso! Agora é só colar no WhatsApp de ${friend.name}.`, "success");
                      }}
                      className="bg-slate-900 hover:bg-slate-800 p-1.5 rounded border border-slate-850 text-slate-400 hover:text-orange-400 cursor-pointer transition-all active:scale-95 text-[10px] font-bold"
                      title="Copiar texto de convite para WhatsApp"
                    >
                      Copiar Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENT EXCLUSIVITY LOCK BANNER */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#101124] to-orange-500" />
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 text-slate-800 flex-shrink-0 flex items-center justify-center">
            <span className="text-xl">🔒</span>
          </div>
          <div className="space-y-1.5 min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full border",
                segmentDetails.color
              )}>
                {segmentDetails.label}
              </span>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                Auditoria Profissional Ativa
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              Apurado Exclusivamente Para O Segmento Cadastrado
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
              {segmentDetails.desc} Para preservar a rigidez técnica e a integridade de caixa, as telas de simulação e os multiplicadores foram parametrizados sob as metas comerciais reais do seu nicho cadastrado.
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 bg-slate-50 border border-gray-150 px-4 py-2.5 rounded-xl self-stretch md:self-auto justify-between md:justify-start">
          <div className="text-right">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Metodologia PFA</p>
            <p className="text-[10.5px] font-extrabold text-slate-800 font-mono">Particular Finance Audit</p>
          </div>
          <span className="text-lg">🏆</span>
        </div>
      </div>

      {/* 🎯 MODELADOR INTERATIVO DE VALUATION & EXIT - INOVAÇÃO GESTÃO GERAL */}
      <div className="bg-gradient-to-br from-[#0c0d1b] via-[#10122e] to-[#0c0c16] rounded-2xl p-6 md:p-8 border border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden font-sans text-left text-white" id="valuation-exit-lab">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.08] pb-5 gap-4">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/25 border border-indigo-400/40 text-indigo-300 text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest font-mono">
              <Sparkles size={11} className="text-indigo-400 animate-spin" style={{ animationDuration: "6s" }} /> Inovação Estratégica: Exit & Solvência
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              📊 Modelador de Valuation & Saúde de Atração (Exit M&A)
            </h3>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              Descubra quanto vale o seu negócio hoje e simule alterações operacionais fundamentais para maximizar sua lucratividade e múltiplo setorial.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/40 px-4 py-2 border border-slate-800 rounded-2xl self-start md:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block">Rating de M&A:</span>
              <p className="text-xs text-slate-300 font-mono">Atratividade de Capitais</p>
            </div>
            <span className={cn(
              "text-3xl font-black font-mono",
              rating.startsWith("A") ? "text-emerald-400" : "text-amber-400"
            )}>
              {rating}
            </span>
          </div>
        </div>

        {/* VALUATION CALCULATIONS SPLIT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sliders and selection Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* EBITDA Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black text-slate-305 uppercase tracking-wider">
                  <span>EBITDA / Lucro Anual PJ:</span>
                  <span className="text-emerald-400 font-mono font-black text-sm">
                    {formatCurrency(valEbitda)}
                  </span>
                </div>
                <input 
                  type="range"
                  min="30000"
                  max="1200000"
                  step="5000"
                  value={valEbitda}
                  onChange={(e) => setValEbitda(parseInt(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                />
                <span className="text-[9.5px] text-slate-400 block leading-tight">
                  Sua geração anual esperada de caixa operacional bruto.
                </span>
              </div>

              {/* Multiple Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black text-slate-305 uppercase tracking-wider">
                  <span>Múltiplo Base do Setor:</span>
                  <span className="text-indigo-400 font-mono font-black text-sm">
                    {valIndustryMultiple.toFixed(1)}x
                  </span>
                </div>
                <input 
                  type="range"
                  min="1.5"
                  max="10.0"
                  step="0.1"
                  value={valIndustryMultiple}
                  onChange={(e) => setValIndustryMultiple(parseFloat(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                />
                <span className="text-[9.5px] text-slate-400 block leading-tight">
                  Regra média de mercado (Múltiplos de EBITDA) no seu setor.
                </span>
              </div>
            </div>

            {/* Adjustment Toggles */}
            <div className="space-y-4 pt-2">
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest block border-b border-white/[0.05] pb-2">
                🎛️ Filtros de Ajuste de Risco & Segurança Corporativa:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Key-Person Dependency */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Operação Sem o Dono:</label>
                  <select
                    value={valKeyPersonDependency}
                    onChange={(e) => setValKeyPersonDependency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-100 font-bold outline-none cursor-pointer focus:border-indigo-500"
                  >
                    <option value="total_dependencia">Totalmente Dependente (Risco)</option>
                    <option value="alta">Depende no dia-a-dia comercial</option>
                    <option value="parcial">Time autônomo com diretrizes</option>
                    <option value="independente">Sócio atua apenas no conselho</option>
                  </select>
                  <span className="text-[9px] text-slate-500 block leading-tight">
                    Refletes o risco de saída do fundador.
                  </span>
                </div>

                {/* Recurrence Level */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Recorrência de Caixa:</label>
                  <select
                    value={valRecurrenceLevel}
                    onChange={(e) => setValRecurrenceLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-100 font-bold outline-none cursor-pointer focus:border-indigo-500"
                  >
                    <option value="avulsa">Venda 100% Avulsa / Transacional</option>
                    <option value="mista">Fidelidade básica ou pacotes</option>
                    <option value="recorrente">Contratos ativos / Assinaturas</option>
                  </select>
                  <span className="text-[9px] text-slate-500 block leading-tight">
                    Previsibilidade contratual de entradas.
                  </span>
                </div>

                {/* Governance Score */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Qualidade Contábil:</label>
                  <select
                    value={valGovernanceScore}
                    onChange={(e) => setValGovernanceScore(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-100 font-bold outline-none cursor-pointer focus:border-indigo-500"
                  >
                    <option value="não_auditado">Controle simples não-auditado</option>
                    <option value="contabilidade_simples">Balanço estruturado em dia</option>
                    <option value="auditoria_plena_pfa">Auditoria fiscal plena Fin.AI PFA</option>
                  </select>
                  <span className="text-[9px] text-slate-500 block leading-tight">
                    Transparência contra passivos invisíveis.
                  </span>
                </div>
              </div>
            </div>

            {/* BUTTON TO GEN STRATEGIC Blueprints */}
            <button
              onClick={handleCalculateExitPath}
              disabled={isCalculatingExitPath}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
            >
              {isCalculatingExitPath ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-orange-400" />
                  <span>Dafne AI Roteando Exit...</span>
                </>
              ) : (
                <>
                  <Cpu size={14} className="animate-pulse" />
                  <span>Gerar Diagnóstico Avançado de Exit</span>
                </>
              )}
            </button>
          </div>

          {/* Valuation Display Card Column */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full bg-[#11122a] p-5 rounded-2xl border border-white/[0.05] relative space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest block font-mono text-left">
                📈 Equação de Valuation Estimada
              </span>
              
              <div className="space-y-0.5 text-left border-b border-white/[0.05] pb-2">
                <span className="text-[11px] text-slate-400 font-medium block leading-none">Múltiplo Final Ajustado:</span>
                <p className="text-3xl font-black text-white font-mono leading-none">
                  {finalMultiple.toFixed(2)}x
                </p>
                <span className="text-[9px] text-slate-400 block leading-tight mt-1">
                  Multiplicador obtido após avaliar e ponderar as notas de risco, recorrência e qualidade tributária.
                </span>
              </div>

              <div className="space-y-0.5 text-left pt-1">
                <span className="text-[11px] text-slate-400 font-medium block leading-none">Valuation Estimado Comercial:</span>
                <p className="text-2xl font-black text-emerald-400 font-mono leading-none tracking-tight">
                  {formatCurrency(calculatedValuation)}
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans pt-1">
                  Este é o capital de venda estimado da marca com base na sua lucratividade líquida ajustável.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                <Info size={11} className="text-orange-500 shrink-0" /> Explicação para usabilidade:
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                Você pode simular aumentar o seu lucro (EBITDA) ou a recorrência do faturamento para assistir este número valorizar ao vivo. Use para negociar captações ou planejar a venda do CNPJ.
              </p>
            </div>
          </div>
        </div>

        {/* DIAGNOSTIC REPORT TEXT (Dynamic display) */}
        {valuationAiReport && (
          <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-5 text-left text-xs text-slate-100 space-y-4 shadow-inner mt-4 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest font-mono">
                <Sparkles size={11} className="text-indigo-400 animate-spin" style={{ animationDuration: "5s" }} /> Relatório de Valuation e Exit por Dafne I.A.
              </span>
              <span className="bg-indigo-950 text-indigo-400 text-[8px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                Análise em Tempo Real
              </span>
            </div>
            <div className="space-y-3 whitespace-pre-line text-[11px] text-slate-300 antialiased leading-relaxed">
              {valuationAiReport}
            </div>
          </div>
        )}
      </div>

      {/* CORE PERFORMANCE INDICATORS WITH REAL VS BENCHMARK CHECKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* EXCELENT METRICS BLOCK */}
        <div className="col-span-2 space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                  <TrendingUp size={18} className="text-indigo-650" /> Métricas e Indicadores Setoriais
                </h3>
                <p className="text-gray-400 text-xs font-medium">Valores derivados em tempo real de suas transações e dados comparados com benchmarks para o seu segmento.</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold text-[9px] px-2 py-1 rounded-full uppercase tracking-wider font-mono">
                  ● Conexão Síncrona Ativa
                </span>
              </div>
            </div>

            {/* SEGMENT SPECIFIC INDICATORS GRID */}
            {selectedSegment === "commerce" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Markup Médio Geral (Produtos)</span>
                      <span className="bg-orange-50 text-orange-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">{"Ideal > 1.8x"}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {products.length > 0
                          ? `${(products.reduce((acc, p) => acc + (p.sellingPrice / (p.costPrice || 1)), 0) / products.length).toFixed(2)}x`
                          : "1.78x"}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">Multiplicador sobre custo direto</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Você possui <strong>{products.length} produtos cadastrados</strong>. A precificação sólida protege seu caixa de rupturas invisíveis.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Giro de Estoque Anualizado</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Méd. Mercado: 5 a 8x</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{stockTurnoverSlider} vezes/ano</span>
                      <span className="text-xs text-emerald-600 font-bold">Saudável</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans animate-pulse">
                    Média de permanência de mercadorias em galpões ou lojas estimado em: <strong className="text-indigo-600 font-bold">{Math.round(365 / stockTurnoverSlider)} dias</strong>.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Ticket Médio das Transações</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">DRE Real</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{formatCurrency(realTicketMedio)}</span>
                      <span className="text-xs text-gray-500 font-medium">por venda computada</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Faturamento total de vendedoras consolidado em <strong className="font-bold">{totalSalesCount} transações de vendas</strong>.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Custo de Aquisição de Cliente (CAC)</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Meta & Ajustáveis</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{formatCurrency(cacSlider)}</span>
                      <span className="text-xs text-indigo-600 font-bold">LTV/CAC: {(realTicketMedio / (cacSlider || 1)).toFixed(1)}x</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Seu custo de atração por cliente está bem enquadrado na média de vestuário e acessórios.
                  </div>
                </div>
              </div>
            )}

            {selectedSegment === "food" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">CMV Total Real (Balanço de Caixa)</span>
                      <span className="bg-orange-50 text-orange-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Meta: 28% a 35%</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-2xl font-black",
                        realCmvPct > 36 ? "text-rose-600 animate-pulse" : "text-slate-900"
                      )}>
                        {realCmvPct.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500 font-medium font-mono">do faturamento total</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    {realCmvPct > 36 
                      ? "⚠️ Alerta de CMV alto! Seu custo de alimentos está corroendo o caixa operacional básico." 
                      : "✅ CMV dentro dos padrões recomendados para manter a integridade econômica da empresa."}
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Índice Estimado de Desperdício</span>
                      <span className="bg-red-50 text-red-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Máximo Ideal: 5%</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{foodWastePct}%</span>
                      <span className="text-xs text-red-500 font-bold">Acima da Meta</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    As perdas diárias representam prejuízo estimado equivalente a <strong className="text-rose-600">{formatCurrency((totalSales * (foodWastePct / 100)))}</strong> em insumos de cozinha.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Faturamento Diário por Cadeira</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Capacidade</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{formatCurrency((seatCount * tableTurnover * avgCoverSpend) / 3)}</span>
                      <span className="text-xs text-slate-500">por mesa integrada</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Considerando <strong className="font-bold">{seatCount} assentos totais</strong> e um giro médio de mesas de <strong className="font-bold">{tableTurnover}x</strong> por dia de funcionamento.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Ocupação Operacional (Salão/Delivery)</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Média Ponderada</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">74.5%</span>
                      <span className="text-xs text-indigo-650 font-bold">Saudável</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Força de pedidos está bem distribuída entre salão físico (45.5%) e canais de delivery e aplicativo (54.5%).
                  </div>
                </div>
              </div>
            )}

            {selectedSegment === "services" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Valor Médio da Hora Prestada</span>
                      <span className="bg-orange-50 text-orange-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Ponto Crítico</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{formatCurrency(hourlyRate)}</span>
                      <span className="text-xs text-gray-500 font-medium">por hora produtiva livre</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Taxa calculada com base em tempo de entrega médio, garantindo cobrir impostos e custos operacionais fixos.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Taxa de Utilização de Horas</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">{"Ideal > 70%"}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{utilizationRate}%</span>
                      <span className="text-xs text-indigo-600 font-bold">Saudável</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Representa <strong className="font-bold">{billableHours} horas faturáveis</strong> ao cliente final sobre um pool teórico de 160h mensais por analista.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Custo de Retrabalho Mensalizado</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Prevenção</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-rose-600">8.2%</span>
                      <span className="text-xs text-gray-500 font-medium">horas improdutivas</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Equivale a perder cerca de <strong className="font-bold">13 horas/mês</strong> refazendo partes não alinhadas no briefing inicial com clientes.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Receita de Contrato Fixo (Retainers)</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Recorrença PJ</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">45.0%</span>
                      <span className="text-xs text-slate-500">das suas receitas totais</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Excelente previsão estável. Idealmente de 60% a 70% do caixa fixo deve provir de taxas mensais programadas de contratos longos.
                  </div>
                </div>
              </div>
            )}

            {selectedSegment === "tech" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Receita de Assinaturas (MRR)</span>
                      <span className="bg-orange-50 text-orange-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Recorrente SaaS</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{formatCurrency(mrrBase)}</span>
                      <span className="text-xs text-indigo-600 font-bold">por mês cadastrado</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Soma automatizada que inclui acessos repetitivos recorrentes consolidados na carteira de faturamento.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Taxa de Cancelamento Mensal (Churn)</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Saudável &lt; 4%</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{churnRate}%</span>
                      <span className="text-xs text-indigo-650 font-bold">Meta Atendida</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans animate-pulse">
                    Representa uma vida média do cliente em seu contrato (Customer Lifetime) de <strong className="text-indigo-650 font-bold">{(100 / (churnRate || 1)).toFixed(1)} meses</strong>.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Índice LTV / CAC Tecnológico</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Métrica Rei do SaaS</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {((arpuTech * (100 / (churnRate || 1))) / (cacTech || 1)).toFixed(2)}x
                      </span>
                      <span className="text-xs text-slate-500">Alvo &gt; 3.0x</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    LTV Calculado estimado em: <strong className="font-bold">{formatCurrency(arpuTech * (100 / (churnRate || 1)))}</strong> por cliente retido contra um CAC de <strong className="font-bold">{formatCurrency(cacTech)}</strong>.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-105 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Margem e Custo de Infraestrutura Cloud</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">OPEX Tech</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">12.5%</span>
                      <span className="text-xs text-emerald-600 font-bold">Eficiente</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Seus gastos com servidores, APIs e infraestrutura de rede na nuvem estão equilibrados em relação ao volume faturado.
                  </div>
                </div>
              </div>
            )}

            {selectedSegment === "other" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Ponto de Equilíbrio Real</span>
                      <span className="bg-orange-50 text-orange-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Cálculo Financeiro</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {formatCurrency(totalOpex / (1 - (totalCogs / (totalSales || 1) || 0.35)))}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">por mês com DRE</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Faturamento mínimo necessário para pagar todas as contas fixas e custos diretos sem acumular prejuízos comerciais ou taxas extras.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Margem EBITDA Geral</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Margem Real</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {totalSales > 0 ? (((totalSales - totalCogs - totalOpex) / totalSales) * 100).toFixed(1) : "21.4"}%
                      </span>
                      <span className="text-xs text-indigo-600 font-bold">Ativo no Período</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Retorno operacional líquido sobre as vendas brutas deduzidas de custos de produção e despesas fixas da equipe.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Prazo Médio de Caixa Operacional</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Dias Limite</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">45 dias</span>
                      <span className="text-xs text-gray-500 font-medium">cobertura com caixa ativo</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Mapeia o fôlego financeiro caso ocorra uma perda abrupta de 100% de novos pedidos no mês atual.
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Liquidez Corrente Comercial</span>
                      <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Liquidez PJ</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-600">2.14x</span>
                      <span className="text-xs text-emerald-600 font-bold">Robusto</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed font-sans">
                    Sua capacidade de curto prazo é blindada e excelente. Você possui mais de duas vezes o valor necessário para cobrir contas imediatas.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INOVAÇÃO TECNOLÓGICA: HUB COGNITIVO DE BENCHMARKING E ELASTICIDADE */}
          <div className="bg-gradient-to-br from-[#0c0e22] via-[#11132e] to-[#0a0b1a] p-6 md:p-8 rounded-2xl border border-indigo-500/20 shadow-xl space-y-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/[0.03] rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div className="space-y-1.5 text-left">
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-2.5 py-0.5 text-[9px] text-indigo-300 font-bold uppercase tracking-widest font-mono">
                  <Sparkles size={11} className="animate-spin" style={{ animationDuration: "8s" }} /> Cognition Engine 3.5
                </div>
                <h3 className="text-lg font-black tracking-tight uppercase text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-400" /> Inteligência de Mercado & Simulação de Elasticidade
                </h3>
                <p className="text-slate-400 text-xs font-medium">Controle avançado de posicionamento do seu negócio em relação a benchmarks nacionais e teste a sensibilidade-preço de sua demanda.</p>
              </div>

              {/* TIER TOGGLE BAR */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1 self-start lg:self-auto flex-wrap">
                <button
                  onClick={() => setSelectedBenchmarkTier("national")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    selectedBenchmarkTier === "national"
                      ? "bg-indigo-600 text-white shadow-md border-indigo-500"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Média Nacional
                </button>
                <button
                  onClick={() => setSelectedBenchmarkTier("top10")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    selectedBenchmarkTier === "top10"
                      ? "bg-indigo-600 text-white shadow-md border-indigo-500"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Líderes (Top 10%)
                </button>
                <button
                  onClick={() => setSelectedBenchmarkTier("exponential")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    selectedBenchmarkTier === "exponential"
                      ? "bg-indigo-600 text-white shadow-md border-indigo-500"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Classe Mundial
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">

              {/* LEFT: LIVE BENCHMARK COMPARATIVE BAR CHART */}
              <div className="space-y-4 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#9ca3af] block">Gráfico Comparativo Real-Time</span>
                  <span className="text-[9px] text-[#818cf8] font-mono font-bold uppercase">Valores calculados em %</span>
                </div>

                <div className="h-[210px] w-full font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonChartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" stroke="#718096" tickLine={false} />
                      <YAxis stroke="#718096" tickLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a202c", borderColor: "#4a5568", color: "#fff", borderRadius: "8px" }}
                        itemStyle={{ color: "#fff" }}
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                      <Bar dataKey="Sua Empresa" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Benchmark Alvo" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-white/[0.05] font-sans">
                  Sua empresa opera atualmente com margem líquida real de <strong className="text-white">{userNetMargin.toFixed(1)}%</strong> contra a meta do benchmark de <strong className="text-orange-400">{currentBenchmark.netMargin}%</strong>.
                </div>
              </div>

              {/* RIGHT: ADVANCED ELASTICITY LAB */}
              <div className="space-y-5 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#9ca3af] block">Simulador de Sensibilidade-Preço</span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold font-mono px-2 py-0.5 rounded uppercase">Laboratório de Preço</span>
                  </div>

                  <p className="text-[11px] text-slate-300 mb-4 text-left leading-relaxed font-sans">
                    Arraste o slider para testar um reajuste de preço e selecione a sensibilidade típica dos seus clientes para calcular o impacto direto de volume e faturamento.
                  </p>

                  <div className="space-y-4">
                    {/* Price Slider */}
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-300">
                        <span>Ajuste de Preço Simulável:</span>
                        <span className={cn(
                          "font-mono text-xs font-black",
                          priceChangePct > 0 ? "text-emerald-400" : priceChangePct < 0 ? "text-rose-400" : "text-white"
                        )}>
                          {priceChangePct > 0 ? `+${priceChangePct}%` : `${priceChangePct}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-15"
                        max="45"
                        step="1"
                        value={priceChangePct}
                        onChange={(e) => setPriceChangePct(parseInt(e.target.value))}
                        className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Elasticity Buttons */}
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Elasticidade de Demanda do Segmento:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setMarketElasticity("inelastic")}
                          className={cn(
                            "py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase transition-all tracking-wide border cursor-pointer",
                            marketElasticity === "inelastic"
                              ? "bg-white text-slate-950 border-white font-black"
                              : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                          )}
                        >
                          Inelástica (Fidelidade)
                        </button>
                        <button
                          onClick={() => setMarketElasticity("unitary")}
                          className={cn(
                            "py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase transition-all tracking-wide border cursor-pointer",
                            marketElasticity === "unitary"
                              ? "bg-white text-slate-950 border-white font-black"
                              : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                          )}
                        >
                          Unitária (Média)
                        </button>
                        <button
                          onClick={() => setMarketElasticity("elastic")}
                          className={cn(
                            "py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase transition-all tracking-wide border cursor-pointer",
                            marketElasticity === "elastic"
                              ? "bg-white text-slate-950 border-white font-black"
                              : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                          )}
                        >
                          Elástica (Preço)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PROJECTED METRIC OUTCOMES */}
                <div className="pt-4 border-t border-white/[0.05] space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.03]">
                      <span className="text-[9px] text-[#9ca3af] uppercase font-bold block mb-0.5">Variação de Volume</span>
                      <p className={cn(
                        "text-sm font-black font-mono",
                        volumeChangePct < 0 ? "text-rose-400" : volumeChangePct > 0 ? "text-emerald-400" : "text-white"
                      )}>
                        {volumeChangePct > 0 ? `+${volumeChangePct.toFixed(1)}%` : `${volumeChangePct.toFixed(1)}%`}
                      </p>
                      <p className="text-[8px] text-gray-500 font-medium">estimativa de transações</p>
                    </div>

                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.03]">
                      <span className="text-[9px] text-[#9ca3af] uppercase font-bold block mb-0.5">Variação de Lucro F.C.</span>
                      <p className={cn(
                        "text-sm font-black font-mono",
                        profitDifference >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {profitDifference >= 0 ? `+${formatCurrency(profitDifference)}` : formatCurrency(profitDifference)}
                      </p>
                      <p className="text-[8px] text-gray-500 font-medium">sobra de caixa líquida</p>
                    </div>
                  </div>

                  {/* Verdict and dynamic details */}
                  <div className={cn(
                    "p-3 rounded-xl border text-[10.5px] leading-relaxed transition-all text-left",
                    elasticityVerdict.style
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <strong className="font-extrabold text-xs tracking-tight">{elasticityVerdict.title}</strong>
                      <span className="text-[8.5px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-white/10">
                        {elasticityVerdict.badge}
                      </span>
                    </div>
                    <p className="opacity-90 leading-normal font-sans">{elasticityVerdict.desc}</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* DYNAMIC METRICS VS SIMULATION SLIDERS */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                <Percent size={18} className="text-indigo-650" /> Simulador e Análise de Sensibilidade do Modelo
              </h3>
              <p className="text-gray-400 text-xs font-medium">Ajuste as alavancas do seu segmento abaixo para simular imediatamente o impacto no seu faturamento anualizado e lucros líquidos.</p>
            </div>

            {selectedSegment === "commerce" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Multiplicador de Markup Alvo:</span>
                      <span className="text-indigo-600 font-mono text-sm">{markupSlider.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.1"
                      max="3.0"
                      step="0.05"
                      value={markupSlider}
                      onChange={(e) => setMarkupSlider(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase font-mono">
                      <span>1.1x Margem Mínima</span>
                      <span>3.0x Alta Grife</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Ciclos de Giro de Estoque por Ano:</span>
                      <span className="text-indigo-600 font-mono text-sm">{stockTurnoverSlider}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="1"
                      value={stockTurnoverSlider}
                      onChange={(e) => setStockTurnoverSlider(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase font-mono">
                      <span>1 Custo Alto / Parado</span>
                      <span>15 Giro Rápido</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#fafaff] border border-indigo-100/60 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-mono">Impacto Estimado no Lucro Bruto Anual</span>
                    <p className="text-xs text-slate-500 leading-relaxed">Considerando seu custo de aquisição atual e faturamento real registrado, elevar o giro e o markup proposto projeta:</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-700 font-mono block">
                      {formatCurrency(totalSales * (markupSlider - 1.0) * (stockTurnoverSlider / 4.4))}
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black uppercase px-2 py-0.5 rounded-lg">Margem Direta Melhorada</span>
                  </div>
                </div>
              </div>
            )}

            {selectedSegment === "food" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Desperdício Est.:</span>
                      <span className="text-[#e26a2c] font-mono text-sm">{foodWastePct.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="20.0"
                      step="0.5"
                      value={foodWastePct}
                      onChange={(e) => setFoodWastePct(parseFloat(e.target.value))}
                      className="w-full accent-orange-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Giro de Mesas/Dia:</span>
                      <span className="text-[#e26a2c] font-mono text-sm">{tableTurnover.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="6.0"
                      step="0.2"
                      value={tableTurnover}
                      onChange={(e) => setTableTurnover(parseFloat(e.target.value))}
                      className="w-full accent-orange-600 cursor-pointer h-2 bg-slate-150 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Nº de Cadeiras:</span>
                      <span className="text-[#e26a2c] font-mono text-sm">{seatCount} assentos</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={seatCount}
                      onChange={(e) => setSeatCount(parseInt(e.target.value))}
                      className="w-full accent-orange-600 cursor-pointer h-2 bg-slate-150 rounded-lg appearance-none"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#fffaf5] border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-[#e26a2c] uppercase tracking-widest block font-mono">Fat. Teórico de Pico do Salão</span>
                    <p className="text-xs text-slate-500">Com o salão {seatCount} assentos rodando {tableTurnover} vezes com ticket médio estimado de R$ 65.00:</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#e26a2c] font-mono block">
                      {formatCurrency(seatCount * tableTurnover * avgCoverSpend)}
                    </span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-black uppercase px-2 py-0.5 rounded-lg">Capacidade Diária Estável</span>
                  </div>
                </div>
              </div>
            )}

            {selectedSegment === "services" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Horas Faturáveis:</span>
                      <span className="text-indigo-650 font-mono text-sm">{billableHours}h/mês</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="180"
                      step="5"
                      value={billableHours}
                      onChange={(e) => setBillableHours(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Valor de sua Hora:</span>
                      <span className="text-indigo-650 font-mono text-sm">{formatCurrency(hourlyRate)}/h</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="10"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-150 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Despesa Adm (OPEX):</span>
                      <span className="text-indigo-650 font-mono text-sm">{formatCurrency(monthlyOverhead)}</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="25000"
                      step="500"
                      value={monthlyOverhead}
                      onChange={(e) => setMonthlyOverhead(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-150 rounded-lg appearance-none"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/20 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block font-mono">Margem Líquida Operacional Simulada</span>
                    <p className="text-xs text-slate-500">Estimou receita bruta de {formatCurrency(billableHours * hourlyRate)} deduzida das despesas operacionais simuladas:</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-700 font-mono block">
                      {formatCurrency((billableHours * hourlyRate) - monthlyOverhead)}
                    </span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black uppercase px-2 py-0.5 rounded-lg">
                      {(((billableHours * hourlyRate) - monthlyOverhead) / ((billableHours * hourlyRate) || 1) * 100).toFixed(1)}% Margem Líquida
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedSegment === "tech" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2 text-left col-span-1 md:col-span-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Base MRR (Receita Recorrente):</span>
                      <span className="text-[#101010] font-mono text-xs">{formatCurrency(mrrBase)}</span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="150000"
                      step="2500"
                      value={mrrBase}
                      onChange={(e) => setMrrBase(parseInt(e.target.value))}
                      className="w-full accent-[#101010] cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Taxa Churn:</span>
                      <span className="text-indigo-650 font-mono text-xs">{churnRate.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="12.0"
                      step="0.1"
                      value={churnRate}
                      onChange={(e) => setChurnRate(parseFloat(e.target.value))}
                      className="w-full accent-[#101010] cursor-pointer h-2 bg-slate-150 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>CAC Unitário:</span>
                      <span className="text-indigo-650 font-mono text-xs">{formatCurrency(cacTech)}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1500"
                      step="25"
                      value={cacTech}
                      onChange={(e) => setCacTech(parseInt(e.target.value))}
                      className="w-full accent-[#101010] cursor-pointer h-2 bg-slate-150 rounded-lg appearance-none"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block font-mono">Saúde do Investimento em Tráfego (LTV/CAC)</span>
                    <p className="text-xs text-slate-500">Seu LTV estimado é {formatCurrency(arpuTech * (100 / (churnRate || 1)))}. A relação de retorno comercial simulada é:</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-2xl font-black font-mono block",
                      ((arpuTech * (100 / (churnRate || 1))) / (cacTech || 1)) >= 3.0 ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {((arpuTech * (100 / (churnRate || 1))) / (cacTech || 1)).toFixed(2)}x
                    </span>
                    <span className="text-[9px] bg-slate-205 text-slate-800 font-black uppercase px-2 py-0.5 rounded-lg">
                      {((arpuTech * (100 / (churnRate || 1))) / (cacTech || 1)) >= 3.0 ? "Excelente Eficiência" : "Rever Canais de Anúncio"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedSegment === "other" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para prestadoras de serviços em geral e indústrias leves que não se enquadram nos modelos acima, o Fin.AI aplica o cálculo direto de <strong>Margem de Contribuição Geral</strong> e <strong>Multiplicador de Sobrevivência</strong> para o fluxo de caixa corporativo de sua PJ.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-dashed border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Como calcular Mark-up Geral</span>
                    <p className="text-xs text-slate-600">Fórmula básica do Markup = 100 / (100 - (Impostos% + Custos Variáveis% + Margem Desejada%)). Garanta que seu Markup esteja sempre acima de 1.6x para garantir lucro líquido PJ.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-dashed border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Gabinete de Prazos Cruzados</span>
                    <p className="text-xs text-slate-600">Negocie com fornecedores prazo médio de pagamento superior a 35 dias, enquanto oferece prazo médio de recebimento máximo de 14 dias aos clientes.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TECNOLOGIA DE MARKETING & AQUISIÇÃO DIGITAL (Growth Dashboard) */}
          <div className="bg-slate-950 p-6 md:p-8 rounded-2xl border border-orange-650/45 shadow-2xl space-y-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-orange-600/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 relative z-10">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase flex items-center gap-2 tracking-tight">
                  <TrendingUp size={18} className="text-orange-500" /> Estrutura Tecnológica de Marketing (Growth Tech)
                </h3>
                <p className="text-slate-400 text-xs font-medium">Estime o funil de tráfego pago da sua PJ, avalie a retenção (LTV/CAC) de nicho e gere criativos de conversão automatizados por Inteligência Artificial.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-orange-950/60 text-orange-400 px-3 py-1.5 rounded-xl border border-orange-500/30 text-[10px] font-bold uppercase tracking-wider font-mono">
                <Cpu size={12} className="text-orange-500 animate-spin" style={{ animationDuration: "6s" }} /> Dafne Growth Engine
              </div>
            </div>

            {/* INTERACTIVE FUNNEL SLIDERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 relative z-10">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-orange-400 block font-sans text-left">
                  🎛️ Parâmetros Contábeis de Mídia
                </span>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Investimento Mensal (Ad Spend):</span>
                    <span className="text-orange-400 font-mono text-sm font-black">{formatCurrency(mktAdSpend)}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={mktAdSpend}
                    onChange={(e) => setMktAdSpend(parseInt(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono font-sans">
                    <span>R$ 500 / Baixo</span>
                    <span>R$ 50.000 / Tração Máxima</span>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Custo por Clique (CPC Estimado):</span>
                    <span className="text-orange-400 font-mono text-sm font-black">R$ {mktCpc.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="5.00"
                    step="0.05"
                    value={mktCpc}
                    onChange={(e) => setMktCpc(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono font-sans">
                    <span>R$ 0.15 / Altamente Otimizado</span>
                    <span>R$ 5.00 / Concorrido</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-orange-400 block font-sans text-left">
                  📈 Eficiência de Conversão & Lifetime Value
                </span>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Taxa de Conversão do Funil:</span>
                    <span className="text-orange-400 font-mono text-sm font-black">{mktConversionRate.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="10.0"
                    step="0.1"
                    value={mktConversionRate}
                    onChange={(e) => setMktConversionRate(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono font-sans">
                    <span>0.2% / Baixa conversão</span>
                    <span>10.0% / Landing Page de Elite</span>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Valor de Ciclo do Cliente (LTV):</span>
                    <span className="text-orange-400 font-mono text-sm font-black">
                      {mktTargetLtv > 0 ? formatCurrency(mktTargetLtv) : `${formatCurrency(computedLtv)} (Auto-Ticket)`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="50"
                    value={mktTargetLtv}
                    onChange={(e) => setMktTargetLtv(parseInt(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono font-sans font-sans">
                    <span>Ajuste Zero / Automático</span>
                    <span>R$ 5.000 / Contratos Premium</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DYNAMIC MULTI-CHANNEL CAC ALLOCATION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 relative z-10 text-left">
              <div className="space-y-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#f97316] block font-sans flex items-center gap-1.5">
                  🌐 Distribuição de Mídia por Canal
                </span>
                <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans">
                  Controle a distribuição de sua verba total de <span className="text-white font-bold">{formatCurrency(mktAdSpend)}</span> entre seus principais canais de tráfego pago. O tráfego orgânico/SEO receberá o residual de verba automaticamente.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Meta Ads (Instagram / TikTok):</span>
                      <span className="text-orange-400 font-mono font-black">{mktMetaShare}% ({formatCurrency(metaSpend)})</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={100 - mktGoogleShare}
                      step="5"
                      value={mktMetaShare}
                      onChange={(e) => setMktMetaShare(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Google Ads (Busca / Classificados):</span>
                      <span className="text-orange-400 font-mono font-black">{mktGoogleShare}% ({formatCurrency(googleSpend)})</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={100 - mktMetaShare}
                      step="5"
                      value={mktGoogleShare}
                      onChange={(e) => setMktGoogleShare(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Tráfego Orgânico / SEO / E-mail:
                    </span>
                    <span className="font-mono font-black text-emerald-400">{mktOrganicShare}% ({formatCurrency(organicSpend)})</span>
                  </div>
                </div>
              </div>

              {/* DETALHAMENTO INDIVIDUAL DE CAC & PAYBACK POR CANAL */}
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#f97316] block font-sans flex items-center gap-1.5">
                  📊 Detalhamento Individualizado de Canais
                </span>
                <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans">
                  Retorno esperado de aquisição de cada modalidade e <strong>CAC Payback</strong> (meses de recorrência de faturamento de LTV necessários para recuperar a verba de marketing).
                </p>

                <div className="space-y-2">
                  {/* Meta Card */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-black text-orange-400 flex items-center gap-1">
                        Meta Ads <span className="text-[9px] bg-slate-900 border border-slate-850 text-slate-400 px-1.5 py-0.5 rounded font-mono">CPC R$ {metaCpc.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Conversões estimadas: <strong className="text-white font-mono">{metaClients} PJ</strong></span>
                    </div>
                    <div className="sm:text-right">
                      <div className="font-mono">Verbalizado: <span className="font-extrabold text-slate-200">{formatCurrency(metaSpend)}</span></div>
                      <div className="font-mono font-bold mt-0.5">CAC: <span className="text-orange-400">{formatCurrency(metaCac)}</span></div>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-md mt-1 inline-block",
                        metaPayback <= 3.5 ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" : "bg-amber-950 text-amber-400 border border-amber-500/20"
                      )}>
                        Payback: {metaPayback.toFixed(1)} meses {metaPayback <= 3.5 ? "⚡ Rápido" : "⚡ Moderado"}
                      </span>
                    </div>
                  </div>

                  {/* Google Card */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-black text-orange-400 flex items-center gap-1">
                        Google Ads <span className="text-[9px] bg-slate-900 border border-slate-850 text-slate-400 px-1.5 py-0.5 rounded font-mono">CPC R$ {googleCpc.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Conversões estimadas: <strong className="text-white font-mono">{googleClients} PJ</strong></span>
                    </div>
                    <div className="sm:text-right">
                      <div className="font-mono">Verbalizado: <span className="font-extrabold text-slate-200">{formatCurrency(googleSpend)}</span></div>
                      <div className="font-mono font-bold mt-0.5">CAC: <span className="text-orange-400">{formatCurrency(googleCac)}</span></div>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-md mt-1 inline-block",
                        googlePayback <= 3.5 ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" : "bg-amber-950 text-amber-400 border border-amber-500/20"
                      )}>
                        Payback: {googlePayback.toFixed(1)} meses {googlePayback <= 3.5 ? "⚡ Rápido" : "⚡ Moderado"}
                      </span>
                    </div>
                  </div>

                  {/* Organic Card */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-black text-emerald-400 flex items-center gap-1">
                        SEO & Orgânico <span className="text-[9px] bg-slate-900 border border-slate-850 text-emerald-500/70 px-1.5 py-0.5 rounded font-mono">S/ CPC Direto</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Conversões estimadas: <strong className="text-emerald-400 font-mono">{organicClients} PJ</strong></span>
                    </div>
                    <div className="sm:text-right">
                      <div className="font-mono">Custo Fixado: <span className="font-extrabold text-slate-200">{formatCurrency(organicSpend)}</span></div>
                      <div className="font-mono font-bold mt-0.5">CAC Real: <span className="text-emerald-400">{formatCurrency(organicCac)}</span></div>
                      <span className="text-[9px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-1 inline-block">
                        Payback: {organicPayback.toFixed(1)} meses ⚡ Retorno Máximo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* METRICS RESULTS DISPLAY (SÍNTESE CONSOLIDADA) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-left hover:border-orange-500/20 transition-all">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase block mb-1">Cliques Estimados</span>
                <p className="text-base font-black text-white font-mono leading-none">{(metaClicks + googleClicks + organicClicks).toLocaleString()}</p>
                <span className="text-[9px] text-slate-400 mt-1 block font-sans">Soma de todos os canais</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-left hover:border-orange-500/20 transition-all">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase block mb-1">Novas Conversões PJ</span>
                <p className="text-base font-black text-white font-mono leading-none">{(metaClients + googleClients + organicClients).toLocaleString()} clientes</p>
                <span className="text-[9px] text-slate-400 mt-1 block font-sans">Retorno agregado de rede</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-left hover:border-orange-500/20 transition-all">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase block mb-1">CAC Geral Ponderado</span>
                <p className={cn(
                  "text-base font-black font-mono leading-none",
                  cacMkt > computedLtv ? "text-rose-400" : "text-orange-400"
                )}>
                  {formatCurrency(cacMkt)}
                </p>
                <span className="text-[9px] text-slate-400 mt-1 block font-sans">Por cliente unificado</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/45 text-left hover:border-orange-500/30 transition-all">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase block mb-1">Relação LTV / CAC</span>
                <p className={cn(
                  "text-base font-black font-mono leading-none",
                  isHealthyLtvCac ? "text-emerald-400" : "text-orange-500"
                )}>
                  {(computedLtv / (cacMkt || 1)).toFixed(2)}x
                </p>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-tight block mt-1 font-sans",
                  isHealthyLtvCac ? "text-emerald-400" : "text-orange-400"
                )}>
                  {isHealthyLtvCac ? "✓ Saudável > 3x" : "⚠ Margem Curta"}
                </span>
              </div>
            </div>

            {/* SIMULATED ROI BOX */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-orange-950/40 border border-orange-500/30 relative z-10">
              <div className="md:col-span-2 space-y-1 text-left">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block font-mono">Retorno Operacional do Tráfego Pago Pró-PJ</span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Investindo {formatCurrency(mktAdSpend)} mensais distribuídos eletronicamente, estimamos uma receita agregada agregando <strong className="font-extrabold text-white">{formatCurrency(metaRevenue + googleRevenue + organicRevenue)}</strong> baseada no LTV do seu nicho. O resultado pós-investimento gera retorno líquido de <strong className="font-extrabold text-[#f97316]">{formatCurrency((metaRevenue + googleRevenue + organicRevenue) - mktAdSpend)}</strong> direto para fortalecimento do caixa.
                </p>
              </div>
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                <div className="text-left md:text-right">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block font-sans">Retorno ROAS Projetado Geral</span>
                  <span className="text-2xl font-black text-[#f97316] font-mono block">{((metaRevenue + googleRevenue + organicRevenue) / (mktAdSpend || 1)).toFixed(2)}x</span>
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border font-sans",
                  roasMkt >= 3.0 ? "bg-emerald-950 text-emerald-400 border-emerald-500/30" : "bg-orange-950 text-orange-400 border-orange-500/30"
                )}>
                  ROI Estimado: {(((metaRevenue + googleRevenue + organicRevenue - mktAdSpend) / (mktAdSpend || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* AI-GENERATED AD COPIES & CAMPAIGN LEDGER PORT */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 md:p-6 space-y-4 relative z-10 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-orange-400 uppercase flex items-center gap-1 font-sans">
                    <Sparkles size={13} className="text-orange-500 animate-spin" style={{ animationDuration: "8s" }} /> Dafne Smart Copywriter 🤖
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans">Gere headlines de busca e copys persuasivas de anúncios em lote sincronizados ao seu ticket de vendas real.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={mktObjective} 
                    onChange={(e) => setMktObjective(e.target.value)}
                    className="bg-slate-950 border text-[10px] border-slate-800 rounded-lg p-1.5 font-bold uppercase cursor-pointer text-orange-400 focus:border-orange-500 outline-none"
                  >
                    <option value="Atração de Novos Clientes">Atração de Clientes</option>
                    <option value="Aumento de Ticket Médio">Aumentar Ticket Médio</option>
                    <option value="Lançamento de Novo Produto">Lançamento de Produto</option>
                    <option value="Fidelização e Combate ao Churn">Fidelizar / Reduzir Churn</option>
                  </select>

                  <select 
                    value={mktTone} 
                    onChange={(e) => setMktTone(e.target.value)}
                    className="bg-slate-950 border text-[10px] border-slate-800 rounded-lg p-1.5 font-bold uppercase cursor-pointer text-orange-400 focus:border-orange-500 outline-none"
                  >
                    <option value="Inovador & Tech">Inovador & Tech</option>
                    <option value="Persuasivo & Direto">Persuasivo & Direto</option>
                    <option value="Humorado & Descontraído">Humorado / Amigável</option>
                    <option value="Focado em Escassez & Descontos">Urgência & Escassez</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col xl:flex-row items-stretch gap-4">
                <div className="xl:w-1/3 flex flex-col justify-between">
                  <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans">
                    A mentora Dafne irá redigir copies promocionais utilizando métodos comerciais modernos (AIDA / PAS), integrando seus limites de verba de <strong className="font-extrabold text-orange-400">{formatCurrency(mktAdSpend)}</strong> e seu ticket médio real de <strong className="font-bold text-white">{formatCurrency(realTicketMedio)}</strong>.
                  </p>
                  <div className="flex flex-col sm:flex-row xl:flex-col gap-2 mt-4">
                    <button
                      onClick={handleGenerateMarketingCopy}
                      disabled={mktIsGenerating}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-slate-950 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 font-sans shadow-lg shadow-orange-500/10 active:scale-95"
                    >
                      <Cpu size={12} className={cn(mktIsGenerating && "animate-spin text-slate-950")} />
                      {mktIsGenerating ? "Processando I.A..." : "Redigir criativos síncronos"}
                    </button>
                    {mktGeneratedCopy && (
                      <button
                        onClick={handleSaveCurrentCreative}
                        className="bg-slate-950 hover:bg-slate-900 border border-orange-500/30 text-orange-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Save size={12} />
                        Salvar no Hub
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-[140px] bg-slate-950 text-orange-100 rounded-xl p-4 text-xs font-mono text-left relative overflow-hidden select-text border border-slate-800">
                  <div className="absolute top-1 right-2 text-[8px] uppercase tracking-widest text-[#f97316] font-bold select-none opacity-50">output terminal</div>
                  {mktIsGenerating ? (
                    <div className="h-full flex flex-col items-center justify-center py-6 gap-2">
                      <div className="h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[9px] text-orange-400 uppercase animate-pulse font-bold tracking-wider font-sans">
                        Criando modelo publicitário de alta conversão para {selectedSegment}...
                      </p>
                    </div>
                  ) : mktGeneratedCopy ? (
                    <div className="whitespace-pre-wrap max-h-[220px] overflow-y-auto leading-relaxed scrollbar-thin text-[11px] text-slate-205">
                      {mktGeneratedCopy}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-slate-500 text-center uppercase text-[10px] font-bold font-sans">
                      <span className="text-orange-500/70 block">Clique ao lado para gerar copies estruturadas de anúncios por I.A.</span>
                      <span className="text-[9px] text-orange-500/40 mt-1 block">Conectado com modelos síncronos de linguagem do Fin.AI</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* HUB DE CAMPANHAS & HISTÓRICO DE CRIATIVOS (Creative Ledger) */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 md:p-6 space-y-4 relative z-10 text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-[#f97316] uppercase flex items-center gap-1.5 font-sans">
                    <History size={13} className="text-orange-500" /> Hub de Campanhas & Registro de Criativos (Creative Ledger)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans">Armazene, resgate e copie os melhores textos publicitários gerados pela mentora Dafne sem perder dados operacionais.</p>
                </div>
                <span className="text-[10px] bg-slate-950 text-orange-400 px-2.5 py-1 rounded-lg border border-orange-500/20 font-mono font-bold">
                  {savedCreatives.length} salvos
                </span>
              </div>

              {savedCreatives.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Nenhum criativo arquivado na biblioteca operacional móvel. Gere copie de copywriter e salve-a.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {savedCreatives.map((creative) => (
                    <div key={creative.id} className="p-3.5 rounded-xl border border-slate-850 bg-slate-950 text-left space-y-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-[10px] font-black text-orange-400 font-sans truncate pr-2 max-w-[200px]">
                          {creative.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
                            {creative.date}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(creative.content);
                              showToast("Conteúdo copiado de forma segura!", "success");
                            }}
                            className="bg-slate-900 hover:bg-slate-850 p-1.5 rounded border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-all"
                            title="Copiar criativo"
                          >
                            <Copy size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteCreative(creative.id)}
                            className="bg-rose-950/40 hover:bg-rose-900/40 p-1.5 rounded border border-rose-500/25 text-rose-400 cursor-pointer transition-all"
                            title="Deletar"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-text max-h-[120px] overflow-y-auto scrollbar-thin">
                        {creative.content}
                      </p>
                      <div className="flex justify-between items-center text-[8.5px] text-slate-500 border-t border-slate-900 pt-2 font-sans font-bold uppercase">
                        <span>Foco: {creative.objective}</span>
                        <span>Tom de Voz: {creative.tone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SIMULADOR DE CONTRA-ATAQUE DE CONCORRENTES (Competitor Benchmarking) */}
            <div className="bg-slate-900 border border-orange-500/10 rounded-2xl p-5 md:p-6 space-y-4 relative z-10 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-orange-400 uppercase flex items-center gap-1.5 font-sans">
                    <Swords size={13} className="text-orange-500 animate-pulse" /> Simulador de Contra-ataque de Concorrentes
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans">Estime as deficiências de conversão de seus rivais regionais e use a inteligência da Dafne para forjar ações defensivas de margem.</p>
                </div>
                <div className="text-[9px] bg-slate-950 text-[#f97316] px-2.5 py-1 rounded-xl border border-orange-500/20 font-mono font-bold uppercase tracking-wider font-sans shrink-0">
                  Parecer Tático de Gaps
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-5 items-stretch">
                {/* Form column */}
                <div className="lg:w-1/3 flex flex-col justify-between bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block font-sans">Nome do Concorrente Rival:</label>
                      <input 
                        type="text"
                        placeholder="Ex: Rival local ou Online"
                        value={competitorName}
                        onChange={(e) => setCompetitorName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-2.5 text-slate-100 focus:border-orange-500 outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase block font-sans">Receita Mensal Rival Est.:</span>
                        <span className="text-[#f97316] font-mono font-black">{formatCurrency(competitorRevenue)}</span>
                      </div>
                      <input 
                        type="range"
                        min="5000"
                        max="250000"
                        step="5000"
                        value={competitorRevenue}
                        onChange={(e) => setCompetitorRevenue(parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[8px] text-slate-550 font-bold font-mono">
                        <span>R$ 5.000</span>
                        <span>R$ 250.000+</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeCompetitor}
                    disabled={isAnalyzingCompetitor}
                    className="w-full bg-slate-900 border border-orange-500/20 hover:border-orange-500 hover:text-white text-orange-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md font-sans"
                  >
                    <Swords size={11} className={isAnalyzingCompetitor ? "animate-spin text-orange-500" : ""} />
                    {isAnalyzingCompetitor ? "Gerando Parecer..." : "Gerar Planilha de Defesa"}
                  </button>
                </div>

                {/* Response column terminal */}
                <div className="flex-1 min-h-[160px] bg-slate-950 text-slate-300 rounded-xl p-4 text-[11px] font-mono text-left select-text border border-slate-850 relative">
                  <div className="absolute top-1.5 right-2 text-[8px] uppercase tracking-widest text-[#f97316] font-bold select-none opacity-50">gaps report tab</div>
                  {isAnalyzingCompetitor ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 gap-2">
                      <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[9px] text-[#f97316] uppercase animate-pulse font-bold tracking-wider font-sans">
                        Sincronizando vulnerabilidades contra nossos dados ativos...
                      </p>
                    </div>
                  ) : competitorGapsAnalysis ? (
                    <div className="whitespace-pre-wrap max-h-[250px] overflow-y-auto leading-relaxed scrollbar-thin pr-1 text-slate-205">
                      {competitorGapsAnalysis}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-slate-600 text-center uppercase text-[10px] font-bold font-sans space-y-1">
                      <span className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-slate-500" /> Nenhum contra-ataque carregado</span>
                      <p className="text-[9.5px] text-slate-500 max-w-[340px] normal-case font-normal mt-1 leading-relaxed">
                        Preencha o nome e o faturamento do seu rival local acima para forjar um verdadeiro planejamento tático de guerra comercial parametrizado pelas finanças reais.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTOR NEWS & AI PERSONALIZED ANALYSIS */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                  <Newspaper size={18} className="text-orange-500 animate-pulse" /> Notícias & Inovação do Setor
                </h3>
                <p className="text-gray-400 text-xs font-medium">Trends e inovações setoriais de seu nicho de atuação analisados com Inteligência Artificial.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 text-[10px] font-bold uppercase tracking-wider font-mono">
                <Globe size={12} className="text-indigo-600 animate-spin" style={{ animationDuration: "12s" }} /> feed integrado
              </div>
            </div>

            <div className="space-y-5">
              {getSectorNewsForSegment(selectedSegment).map((newsItem) => {
                const isAnalyzing = analyzingNewsId === newsItem.id;
                const analysisResult = newsAnalyses[newsItem.id];
                const isExpanded = activeNewsAnalysisId === newsItem.id;

                return (
                  <div 
                    key={newsItem.id} 
                    className={cn(
                      "p-5 rounded-2xl border transition-all space-y-4",
                      isExpanded 
                        ? "bg-[#fafbff] border-indigo-200/80 shadow-sm" 
                        : "bg-slate-50/40 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">
                            {newsItem.source} • {newsItem.date}
                          </span>
                          <span className={cn(
                            "text-[9px] uppercase font-black px-2 py-0.5 rounded border tracking-wider",
                            newsItem.category === "Inovação" ? "bg-purple-50 text-purple-700 border-purple-100" :
                            newsItem.category === "Tech" ? "bg-blue-50 text-blue-700 border-blue-100" :
                            newsItem.category === "Faturamento" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            "bg-amber-50 text-amber-700 border-amber-100"
                          )}>
                            {newsItem.category}
                          </span>
                          {newsItem.hotness === "high" && (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-black uppercase tracking-wider">
                              <Flame size={10} className="fill-current text-rose-600 animate-pulse" /> explosivo
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 leading-snug tracking-tight">
                          {newsItem.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleAnalyzeNews(newsItem)}
                        disabled={isAnalyzing}
                        className={cn(
                          "sm:self-start inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border shadow-sm sm:shrink-0",
                          isExpanded 
                            ? "bg-indigo-600 border-indigo-650 text-white hover:bg-indigo-700" 
                            : "bg-white border-slate-200 hover:border-slate-350 text-slate-800 hover:bg-slate-50"
                        )}
                      >
                        <Cpu size={12} className={cn(isAnalyzing && "animate-spin text-orange-400")} />
                        {isAnalyzing ? "Analisando..." : isExpanded ? "Analisado" : "Simular Impacto I.A."}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {newsItem.summary}
                    </p>

                    {/* AI PERSONALIZED ANALYSIS FEEDBACK BOX */}
                    {isExpanded && (
                      <div className="bg-white border border-indigo-100/80 rounded-xl p-4 md:p-5 text-left text-xs text-slate-705 space-y-3 shadow-inner mt-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        <div className="flex items-center justify-between border-b border-indigo-50/50 pb-2 font-sans">
                          <div className="flex items-center gap-1.5 font-black text-[10px] text-indigo-600 uppercase tracking-widest font-mono">
                            <Sparkles size={11} className="text-indigo-500 animate-spin" style={{ animationDuration: "6s" }} /> Dafne Parecer de Impacto & Metas
                          </div>
                          <span className="bg-slate-100 text-slate-600 text-[8px] px-1.5 py-0.5 rounded-md font-mono font-bold uppercase">
                            Simulação Contábil Ativa
                          </span>
                        </div>

                        {isAnalyzing ? (
                          <div className="py-6 flex flex-col items-center justify-center gap-3">
                            <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] text-indigo-600 uppercase font-black tracking-widest animate-pulse">
                              Cruzando dados de vendas {formatCurrency(totalSales)} com a inovação...
                            </p>
                          </div>
                        ) : analysisResult ? (
                          <div className="space-y-3 font-sans">
                            <div className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-line">
                              {analysisResult}
                            </div>
                            <div className="pt-2 border-t border-dashed border-slate-100 flex items-center justify-between text-[9px] text-gray-400">
                              <span>Métrica avaliada: {selectedSegment === "commerce" ? "Giro de Estoque/Markup" : selectedSegment === "food" ? "CMV/Giro de Mesa" : selectedSegment === "services" ? "Taxa de Utilização" : "LTV/CAC/MRR"}</span>
                              <span>Análise em Tempo Real</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-rose-500 font-medium">Houve um erro de carregamento. Tente acionar novamente.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: HIGH TECH DAFNE PERSONALIZED RECOMMENDATIONS & AI ADVISORY */}
        <div className="space-y-8">
          
          {/* INTERACTIVE COMPLIANCE / ADVICE CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5 font-sans">
                <Lightbulb size={16} className="text-orange-500 animate-pulse" /> Recomendações Estratégicas
              </h4>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-0.5">Alertas e Oportunidades do Segmento</p>
            </div>

            <div className="space-y-4">
              {currentLocalTips.map((tip, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                      tip.status === "crítico" 
                        ? "bg-rose-50 text-rose-700 border border-rose-100" 
                        : tip.status === "vulnerável" 
                        ? "bg-amber-50 text-amber-700 border border-amber-100" 
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    )}>
                      {tip.status}
                    </span>
                    <span className="text-[9px] font-mono font-extrabold text-indigo-650">{tip.impact}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 leading-tight">{tip.title}</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CHAT-INTEGRATION / DISCOVERY WITH GEMINI DAFNE COUNSELOR */}
          <div className="bg-gradient-to-br from-[#101124] to-[#14182f] p-6 rounded-2xl border border-indigo-500/30 shadow-lg text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-2">
              <span className="bg-indigo-500/25 border border-indigo-400/40 text-indigo-300 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest font-mono">
                Dafne Setorial Bot 💬
              </span>
              <h4 className="text-sm font-black uppercase tracking-tight">Conselho Avançado Síncrono</h4>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                Acione a mentora inteligente para auditar suas transações e formular direcionamentos táticos sob medida para seu nicho e capital de giro.
              </p>
            </div>

            {aiInsight ? (
              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-[11px] leading-relaxed text-slate-100 max-h-[300px] overflow-y-auto space-y-2 scrollbar-thin">
                <div className="font-extrabold text-[10px] text-indigo-400 tracking-wider uppercase mb-1 flex items-center gap-1">
                  <Sparkles size={11} className="text-indigo-400 animate-spin" style={{ animationDuration: "5s" }} /> Dafne Parecer Analítico:
                </div>
                <p className="whitespace-pre-line font-sans">{aiInsight}</p>
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleAskDafneInsights}
                    disabled={isAiLoading}
                    className="text-[9px] text-indigo-300 hover:text-white uppercase font-black tracking-widest flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={10} className={cn(isAiLoading && "animate-spin")} /> Gerar Novo Parecer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAskDafneInsights}
                disabled={isAiLoading}
                className="w-full bg-white hover:bg-orange-500 hover:text-white text-[#101010] py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Auditando Transações...</span>
                  </>
                ) : (
                  <>
                    <Play size={12} className="fill-current" />
                    <span>Gerar Plano de Metas I.A.</span>
                  </>
                )}
              </button>
            )}

            <div className="text-[9px] text-slate-400 leading-relaxed font-sans border-t border-slate-850 pt-4 flex items-start gap-1.5">
              <Info size={11} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>
                Esta consulta consome diretamente os dados contábeis de suas receitas de <strong>{totalSalesCount} transações registradas</strong> para formular um diagnóstico cirúrgico.
              </span>
            </div>
          </div>

          {/* GABINETE DE AUDITORIA E CONSULTORIA INDIVIDUAL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest font-mono">Suporte Analítico PJ</span>
              <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5 font-sans">
                💼 Consultoria de Nicho Credenciada
              </h4>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed font-sans text-left">
              Como empresa registrada sob o segmento <strong className="font-bold text-slate-700 capitalize">{selectedSegment === "commerce" ? "Varejo" : selectedSegment === "food" ? "Alimentação" : selectedSegment === "services" ? "Serviços" : selectedSegment === "tech" ? "Tecnologia" : "Geral"}</strong>, você possui canais dedicados para formular auditorias de alta complexidade contábil.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  showToast("Iniciando exportação de parecer de auditoria... Baixando relatório síncrono.", "success");
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-150 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-850 leading-none">Exportar Parecer Físico</p>
                    <p className="text-[9px] text-gray-400 font-mono mt-1">Relatório homologado de CMV e OPEX</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </button>

              <button
                onClick={() => {
                  showToast("Redirecionando para agendamento de mentoria com planejador financeiro especializado (PFA).", "info");
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-150 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤝</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-850 leading-none">Agendar Mentoria Particular</p>
                    <p className="text-[9px] text-gray-400 font-mono mt-1">Sessão individual com mentor certificado</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </button>
            </div>

            <div className="pt-3 border-t border-dashed border-gray-200 flex items-center gap-2 text-[9.5px] text-gray-400 justify-start">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Garantia de Confidencialidade e LGPD</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
