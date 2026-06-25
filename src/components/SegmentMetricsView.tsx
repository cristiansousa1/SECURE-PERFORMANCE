import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { motion } from "motion/react";
import { AbntPdfDocument } from "../utils/pdfAbntHelper";
import { 
  FileDown,
  FileText,
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
  UserPlus,
  Calendar,
  Megaphone,
  Target,
  Plus,
  Trash2
} from "lucide-react";
import { sound } from "../utils/SoundEngine";
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

const DEFAULT_AD_TEMPLATE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Max Performance Business - Ad de Alta Conversão</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0a0b14 0%, #111326 100%);
      color: #ffffff;
      font-family: 'Space Grotesk', sans-serif;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      min-height: 100vh;
      box-sizing: border-box;
      border: 3px solid rgba(249, 115, 22, 0.45);
      border-radius: 12px;
    }
    .container {
      padding: 20px;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      justify-content: center;
    }
    .badge {
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.5);
      color: #ff8433;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1.5px;
      align-self: center;
      margin-bottom: 12px;
      animation: pulse 2s infinite;
    }
    h1 {
      font-size: 21px;
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }
    h1 span {
      color: #ff7420;
    }
    p.subtitle {
      font-size: 12px;
      color: #a0aec0;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }
    /* Animated Metrics */
    .metrics-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 10px;
      text-align: left;
      transition: all 0.3s;
    }
    .metric-card:hover {
      background: rgba(249, 115, 22, 0.05);
      border-color: rgba(249, 115, 22, 0.25);
    }
    .metric-label {
      font-size: 8px;
      color: #718096;
      text-transform: uppercase;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .metric-value {
      font-size: 16px;
      font-weight: bold;
      color: #ffffff;
      margin-top: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
    .metric-trend {
      font-size: 8px;
      color: #48bb78;
      margin-top: 2px;
      font-weight: bold;
    }
    /* Interactive Video Simulator */
    .video-simulator {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      aspect-ratio: 16 / 9;
      width: 100%;
      margin-bottom: 20px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .canvas-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.35;
      background: radial-gradient(circle at 50% 50%, #ff8433 0%, transparent 60%);
    }
    .video-bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      width: 80%;
      height: 60%;
      position: relative;
      z-index: 1;
    }
    .chart-bar {
      width: 12%;
      background: linear-gradient(to top, #ff7420, #ffb833);
      border-radius: 4px 4px 0 0;
      animation: expandHeight 2.5s infinite ease-in-out;
      min-height: 20%;
    }
    .chart-bar:nth-child(2) { animation-delay: 0.3s; }
    .chart-bar:nth-child(3) { animation-delay: 0.6s; }
    .chart-bar:nth-child(4) { animation-delay: 0.9s; }
    .chart-bar:nth-child(5) { animation-delay: 1.2s; }

    .play-overlay {
      position: absolute;
      z-index: 2;
      background: rgba(249, 115, 22, 0.9);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 15px rgba(249, 115, 22, 0.5);
      transition: all 0.2s;
    }
    .play-overlay:hover {
      transform: scale(1.1);
      background: #ff7420;
    }
    .play-icon {
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-left: 14px solid #ffffff;
      margin-left: 3px;
    }
    
    .cta-btn {
      background: linear-gradient(135deg, #f97316 0%, #ff5500 100%);
      color: #0e101f;
      border: none;
      border-radius: 12px;
      padding: 14px 20px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      width: 100%;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
      transition: all 0.3s;
      margin-top: auto;
    }
    .cta-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(249, 115, 22, 0.45);
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(0.98); }
    }
    @keyframes expandHeight {
      0%, 100% { height: 25%; }
      50% { height: 80%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Max Performance Ads</div>
    <h1>O seu negócio com <span>Multiplicador Real</span></h1>
    <p class="subtitle">Aprenda a estruturar seu caixa e injetar inteligência financeira automática para alavancar seu ROI de tráfego pago.</p>
    
    <div class="video-simulator" id="videoSim">
      <div class="canvas-bg"></div>
      <div class="video-bar-chart">
        <div class="chart-bar" style="height: 30%;"></div>
        <div class="chart-bar" style="height: 60%;"></div>
        <div class="chart-bar" style="height: 45%;"></div>
        <div class="chart-bar" style="height: 80%;"></div>
        <div class="chart-bar" style="height: 55%;"></div>
      </div>
      <div class="play-overlay" onclick="triggerPlay()">
        <div class="play-icon"></div>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Margem Líquida</div>
        <div class="metric-value">+48.2%</div>
        <div class="metric-trend">▲ RECORD HISTÓRICO</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">ROAS Estimado</div>
        <div class="metric-value">5.8x</div>
        <div class="metric-trend">▲ ESCALA DE VERBA</div>
      </div>
    </div>
    
    <button class="cta-btn" onclick="triggerCta()">Escalar Minhas Vendas Agora 🚀</button>
  </div>

  <script>
    function triggerPlay() {
      window.parent.postMessage({ type: 'AD_PLAY', data: { timestamp: Date.now() } }, '*');
      const bars = document.querySelectorAll('.chart-bar');
      bars.forEach((bar, idx) => {
        bar.style.animation = 'none';
        setTimeout(() => {
          bar.style.animation = 'expandHeight ' + (1.2 + idx * 0.25) + 's infinite ease-in-out';
        }, 10);
      });
    }

    function triggerCta() {
      window.parent.postMessage({ type: 'AD_CTA', data: { timestamp: Date.now() } }, '*');
    }
  </script>
</body>
</html>`;

export default function SegmentMetricsView() {
  const {
    transactions,
    categories,
    profile,
    products,
    storeProfiles,
    activeStoreId,
    setActiveStoreId,
    showToast,
    updateProfile
  } = useFinance();

  // Active store's segment resolution
  const activeStore = storeProfiles.find(s => s.id === activeStoreId);
  const detectedStoreSegment = (activeStore as any)?.businessSegment || (profile as any)?.businessSegment || localStorage.getItem("dafne_business_segment") || "commerce";

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
  const realTicketMedio = totalSalesCount > 0 ? totalSales / totalSalesCount : 0.00;

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

  const realCmvPct = totalSales > 0 ? (totalCogs / totalSales) * 100 : 0.0;

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

  // Marketing ROI Simulator States
  const [roiCmvPct, setRoiCmvPct] = useState<number>(30); // % of generated sales eaten by COGS
  const [roiAgencyCost, setRoiAgencyCost] = useState<number>(1000); // R$ flat support cost (agency/editorial/tools)
  const [useRealFinanceBase, setUseRealFinanceBase] = useState<boolean>(true); // Base calculator on real firm metrics or preset boilerplate

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

  // OKR Suggestion States & Custom Utilities
  const [okrTargetMultiplier, setOkrTargetMultiplier] = useState<number>(1.0);
  const [isExportingOkrs, setIsExportingOkrs] = useState<boolean>(false);

  // Ad Simulator & Code Reader States
  const [uploadedAdHtml, setUploadedAdHtml] = useState<string>(() => {
    return localStorage.getItem("uploaded_max_performance_ad_html") || "";
  });
  const [adViewportSize, setAdViewportSize] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [isDraggingAdFile, setIsDraggingAdFile] = useState<boolean>(false);
  const [adSimBudget, setAdSimBudget] = useState<number>(5000);
  const [adSimCpm, setAdSimCpm] = useState<number>(15);
  const [adSimCtr, setAdSimCtr] = useState<number>(1.8);
  const [adSimCv, setAdSimCv] = useState<number>(2.2);

  // Intercept events from inside the video ad preview iframe
  useEffect(() => {
    const handleAdMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === "object") {
        if (event.data.type === "AD_PLAY") {
          sound.playSuccess();
          showToast("Amostragem de vídeo iniciada! Analisando retenção de retenção...", "info");
        } else if (event.data.type === "AD_CTA") {
          sound.playSuccess();
          showToast("Conversão Capturada! 🚀 O cliente engajou no botão 'Call To Action'.", "success");
        }
      }
    };
    window.addEventListener("message", handleAdMessage);
    return () => window.removeEventListener("message", handleAdMessage);
  }, [showToast]);

  const getSuggestedOkrs = () => {
    const rawGoal = profile?.billingGoal || 65000;
    const currentGoal = Math.round(rawGoal * okrTargetMultiplier);
    
    // Choose the best dynamic ticket or base rate
    const currentTicket = selectedSegment === "commerce" 
      ? (avgTicketSlider || 85) 
      : selectedSegment === "food" 
      ? (avgCoverSpend || 65) 
      : selectedSegment === "services" 
      ? (hourlyRate || 150) 
      : (arpuTech || 120);

    const isComm = selectedSegment === "commerce";
    const isFood = selectedSegment === "food";
    const isServ = selectedSegment === "services";
    const isTech = selectedSegment === "tech";

    if (isComm) {
      return [
        {
          id: "sug-okr-comm-1",
          title: `OKR Vendas: Entregar ${Math.ceil(currentGoal / currentTicket)} pedidos de venda com Ticket de ${formatCurrency(currentTicket)}`,
          targetValue: Math.ceil(currentGoal / currentTicket),
          type: "sales_volume",
          desiredProfitMargin: 15,
          reason: "Desdobra o objetivo de faturamento bruto em volume de vendas real."
        },
        {
          id: "sug-okr-comm-2",
          title: `OKR Markup: Garantir o Markup Médio de ${markupSlider.toFixed(2)}x para salvaguardar a margem líquida de caixa`,
          targetValue: markupSlider,
          type: "profit",
          desiredProfitMargin: 20,
          reason: "Protege o lucro bruto das transações contra a alta do COGS do varejo."
        },
        {
          id: "sug-okr-comm-3",
          title: `OKR Captação: Manter CAC de tráfego pago sob limite controlado de ${formatCurrency(cacSlider)}`,
          targetValue: cacSlider,
          type: "acquisition_cost",
          desiredProfitMargin: 25,
          reason: "Garante eficiência contra leilões agressivos e inflação de CPC."
        }
      ];
    } else if (isFood) {
      return [
        {
          id: "sug-okr-food-1",
          title: `OKR Volume: Atender ${Math.ceil(currentGoal / currentTicket)} coberturas/pedidos no mês para tracionar faturamento`,
          targetValue: Math.ceil(currentGoal / currentTicket),
          type: "sales_volume",
          desiredProfitMargin: 15,
          reason: "Calcula a quantidade de clientes consumindo para bater a meta principal de caixa."
        },
        {
          id: "sug-okr-food-2",
          title: `OKR CMV: Reduzir a barreira média de desperdício de insumos no estoque para abaixo de ${foodWastePct}%`,
          targetValue: foodWastePct,
          type: "profit",
          desiredProfitMargin: 35,
          reason: "Controla vazamento de caixa causado por perdas na cozinha e manipulação."
        },
        {
          id: "sug-okr-food-3",
          title: `OKR Ocupação: Manter Giro de Mesa em escala estável de ${tableTurnover.toFixed(1)}x por período`,
          targetValue: tableTurnover,
          type: "other",
          desiredProfitMargin: 25,
          reason: "Otimiza a infraestrutura física de salão durante picos e ócios."
        }
      ];
    } else if (isServ) {
      return [
        {
          id: "sug-okr-serv-1",
          title: `OKR Produtividade: Consolidar ${billableHours} horas faturáveis diretas de consultoria por mês`,
          targetValue: billableHours,
          type: "sales_volume",
          desiredProfitMargin: 20,
          reason: "Garante o aproveitamento produtivo da folha de consultores e prestadores."
        },
        {
          id: "sug-okr-serv-2",
          title: `OKR Escala: Elevar taxa de utilização produtiva total da equipe para ${utilizationRate}%`,
          targetValue: utilizationRate,
          type: "profit",
          desiredProfitMargin: 30,
          reason: "Desobstrui gargalos operacionais e eleva rentabilidade líquida."
        },
        {
          id: "sug-okr-serv-3",
          title: `OKR Clientes: Manter captação de no mínimo ${Math.ceil(currentGoal / (currentTicket * 20 || 3500))} contratos recorrentes ativos (Retainers)`,
          targetValue: Math.ceil(currentGoal / (currentTicket * 20 || 3500)),
          type: "income",
          desiredProfitMargin: 25,
          reason: "Assegura os contratos estáveis corporativos para lastrear o OPEX fixo da agência."
        }
      ];
    } else if (isTech) {
      return [
        {
          id: "sug-okr-tech-1",
          title: `OKR Escala SaaS: Atingir base consolidada de ${formatCurrency(currentGoal)} de MRR sob gestão`,
          targetValue: currentGoal,
          type: "income",
          desiredProfitMargin: 20,
          reason: "O principal gerador de previsibilidade de fluxo de caixa recorrente SaaS."
        },
        {
          id: "sug-okr-tech-2",
          title: `OKR Blindagem: Mitigar a taxa de cancelamentos de assinaturas (Churn Rate) para menos de ${churnRate}% ao mês`,
          targetValue: churnRate,
          type: "churn",
          desiredProfitMargin: 30,
          reason: "Protege o balde furado contra evasão de MRR e estagnação comercial."
        },
        {
          id: "sug-okr-tech-3",
          title: `OKR Marketing: Manter CAC de nova assinatura estrito ao patamar de ${formatCurrency(cacTech)}`,
          targetValue: cacTech,
          type: "acquisition_cost",
          desiredProfitMargin: 25,
          reason: "Assegura relação de LTV / CAC acima de 3x para crescimento saudável."
        }
      ];
    } else {
      return [
        {
          id: "sug-okr-gen-1",
          title: `OKR Financeiro: Atingir faturamento consolidado de ${formatCurrency(currentGoal)}`,
          targetValue: currentGoal,
          type: "income",
          desiredProfitMargin: 18,
          reason: "Direciona a atividade comercial para bater o ponto de equilíbrio nominal."
        },
        {
          id: "sug-okr-gen-2",
          title: `OKR Eficiência: Preservar Margem de Lucro Líquida Real acima de ${userNetMargin > 0 ? userNetMargin.toFixed(1) : "15.0"}%`,
          targetValue: parseFloat(userNetMargin > 0 ? userNetMargin.toFixed(1) : "15.0"),
          type: "profit",
          desiredProfitMargin: 20,
          reason: "Assegura a rentabilidade real líquida livre de desperdício em opex."
        }
      ];
    }
  };

  const handleExportOkrsToProfile = async () => {
    if (!profile) {
      showToast("Não foi possível carregar as credenciais da empresa para persistir as metas.", "error");
      return;
    }

    setIsExportingOkrs(true);
    try {
      try { sound.playClick(); } catch(e) {}
      
      const suggestedList = getSuggestedOkrs();
      const existingGoals = profile.additionalGoals || [];
      const existingTitles = new Set(existingGoals.map(g => g.title));
      
      const okrsToAppend = suggestedList
        .filter(sug => !existingTitles.has(sug.title))
        .map(sug => ({
          id: `okr-exported-${Math.random().toString(36).substring(2, 9)}`,
          title: sug.title,
          targetValue: sug.targetValue,
          type: sug.type as any,
          reached: false,
          desiredProfitMargin: sug.desiredProfitMargin,
          deadline: profile.billingGoalDeadline || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0]
        }));

      if (okrsToAppend.length === 0) {
        showToast("Estes OKRs sugeridos já constam na sua lista de Metas Ativas!", "warning");
        setIsExportingOkrs(false);
        return;
      }

      await updateProfile({
        additionalGoals: [...existingGoals, ...okrsToAppend]
      });

      showToast(`Sucesso! ${okrsToAppend.length} OKRs alinhados foram adicionados à sua lista de Metas Ativas!`, "success");
    } catch (e) {
      console.error(e);
      showToast("Falha ao salvar metas adicionais no perfil e nuvem.", "error");
    } finally {
      setIsExportingOkrs(false);
    }
  };

  // Community Referral States
  const [inviteName, setInviteName] = useState<string>("");
  const [inviteContact, setInviteContact] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<string>("CFO / Sócio");
  const [invitedFriends, setInvitedFriends] = useState<{ id: string; name: string; contact: string; role: string; status: string; date: string }[]>([
    { id: "ref-1", name: "Rogério Antunes", contact: "(11) 98111-4432", role: "CFO de Varejo", status: "Confirmado", date: "2026-05-24" },
    { id: "ref-2", name: "Alessandra Toledo", contact: "alessandra@techhouse.io", role: "CEO & Co-founder", status: "Pendente", date: "2026-05-25" }
  ]);

  // --- INTERACTIVE VISUAL MARKETING PLANNER & CAMPAIGNS TRACEJO ---
  const [mktCampaigns, setMktCampaigns] = useState<Array<{
    id: string;
    name: string;
    channel: string;
    budget: number;
    targetCac: number;
    status: "Planejada" | "Ativa" | "Pausada" | "Concluída";
    date: string;
    actualInvestment?: number;
    actualReturn?: number;
    salesCount?: number;
  }>>(() => {
    const cached = localStorage.getItem("dafne_marketing_campaigns_v2");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [
      { 
        id: "cam-1", 
        name: "Campanha Institucional - Tráfego de Leads", 
        channel: "Meta Ads (Instagram)", 
        budget: 3500, 
        targetCac: 45, 
        status: "Ativa", 
        date: "2026-05-25",
        actualInvestment: 3200,
        actualReturn: 14500,
        salesCount: 82
      },
      { 
        id: "cam-2", 
        name: "Fundo de Funil - Google Busca Otimizado", 
        channel: "Google Ads", 
        budget: 2000, 
        targetCac: 110, 
        status: "Ativa", 
        date: "2026-05-26",
        actualInvestment: 1850,
        actualReturn: 9200,
        salesCount: 45
      },
      { 
        id: "cam-3", 
        name: "Campanha Sazonal - Promoção de Inverno PJ", 
        channel: "E-mail & WhatsApp", 
        budget: 800, 
        targetCac: 15, 
        status: "Planejada", 
        date: "2026-05-27",
        actualInvestment: 0,
        actualReturn: 0,
        salesCount: 0
      }
    ];
  });

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editActualInvestment, setEditActualInvestment] = useState<number>(0);
  const [editActualReturn, setEditActualReturn] = useState<number>(0);
  const [editSalesCount, setEditSalesCount] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem("dafne_marketing_campaigns_v2", JSON.stringify(mktCampaigns));
  }, [mktCampaigns]);

  useEffect(() => {
    if (realCmvPct > 0) {
      setRoiCmvPct(Math.round(realCmvPct));
    }
  }, [realCmvPct]);

  const [isSyncingGoogleAds, setIsSyncingGoogleAds] = useState(false);
  const [crmLeadsState, setCrmLeadsState] = useState(() => {
    const cached = localStorage.getItem("dafne_crm_leads");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return {
      activeCount: 342,
      dailyVolume: 48,
      movingAverage: 40
    };
  });

  useEffect(() => {
    const handleSyncUpdate = () => {
      const cached = localStorage.getItem("dafne_crm_leads");
      if (cached) {
        try {
          setCrmLeadsState(JSON.parse(cached));
        } catch (e) {}
      }
    };
    window.addEventListener("google-ads-sync-event", handleSyncUpdate);
    return () => {
      window.removeEventListener("google-ads-sync-event", handleSyncUpdate);
    };
  }, []);

  const handleSyncGoogleAds = () => {
    setIsSyncingGoogleAds(true);
    try { sound.playClick(); } catch(e) {}
    
    // Dispatch starting sync event
    window.dispatchEvent(new CustomEvent("google-ads-sync-event", {
      detail: { status: "start" }
    }));

    setTimeout(() => {
      setIsSyncingGoogleAds(false);
      
      const newCampaignItem = {
        id: "cam-synced-" + Date.now(),
        name: "Google Ads Synced - Performance Max LP",
        channel: "Google Ads",
        budget: 2500,
        targetCac: 75,
        status: "Ativa" as const,
        date: new Date().toISOString().split("T")[0],
        actualInvestment: 2450,
        actualReturn: 11200,
        salesCount: 68
      };
      
      setMktCampaigns(prev => [newCampaignItem, ...prev]);
      
      const currentLeads = localStorage.getItem("dafne_crm_leads");
      let parsed = { activeCount: 342, dailyVolume: 48, movingAverage: 40 };
      if (currentLeads) {
        try { parsed = JSON.parse(currentLeads); } catch(e) {}
      }
      
      const addedLeads = Math.floor(Math.random() * 15) + 15; // +15 a +30 leads
      const newDaily = Math.floor(Math.random() * 20) + 55; // 55 a 74 leads diários
      const updated = {
        activeCount: parsed.activeCount + addedLeads,
        dailyVolume: newDaily,
        movingAverage: parsed.movingAverage
      };
      localStorage.setItem("dafne_crm_leads", JSON.stringify(updated));
      
      // Dispatch completion and sync success to trigger Tab pulse
      window.dispatchEvent(new CustomEvent("google-ads-sync-event", {
        detail: { status: "complete", data: updated }
      }));

      try { sound.playSuccess(); } catch(e) {}
      showToast(`Sucesso! Google Ads sincronizado. ${addedLeads} novos leads integrados ao CRM.`, "success");
    }, 1500);
  };

  const [newCamName, setNewCamName] = useState<string>("");
  const [newCamChannel, setNewCamChannel] = useState<string>("Meta Ads (Instagram)");
  const [newCamBudget, setNewCamBudget] = useState<number>(1500);
  const [newCamTargetCac, setNewCamTargetCac] = useState<number>(45);
  const [newCamStatus, setNewCamStatus] = useState<"Planejada" | "Ativa" | "Pausada" | "Concluída">("Planejada");

  const [briefCamType, setBriefCamType] = useState<string>("Atração de Novos Clientes (Estímulo de Demanda)");
  const [briefAudience, setBriefAudience] = useState<string>("Decisores PJ / Gerentes Financeiros");
  const [briefGeneratedText, setBriefGeneratedText] = useState<string>("");
  const [isBriefGenerating, setIsBriefGenerating] = useState<boolean>(false);

  const handleAddCampaign = () => {
    if (!newCamName.trim()) {
      showToast("Insira o nome operacional da campanha de marketing.", "warning");
      return;
    }
    if (newCamBudget <= 0) {
      showToast("O investimento da campanha precisa ser maior que zero.", "warning");
      return;
    }

    const itemObj: {
      id: string;
      name: string;
      channel: string;
      budget: number;
      targetCac: number;
      status: "Planejada" | "Ativa" | "Pausada" | "Concluída";
      date: string;
      actualInvestment: number;
      actualReturn: number;
      salesCount: number;
    } = {
      id: "cam-" + Date.now(),
      name: newCamName.trim(),
      channel: newCamChannel,
      budget: Number(newCamBudget),
      targetCac: Number(newCamTargetCac),
      status: newCamStatus,
      date: new Date().toISOString().split("T")[0],
      actualInvestment: 0,
      actualReturn: 0,
      salesCount: 0
    };

    setMktCampaigns(prev => [itemObj, ...prev]);
    setNewCamName("");
    setNewCamBudget(1500);
    setNewCamTargetCac(45);
    
    try { sound.playSuccess(); } catch(e) {}
    showToast("Campanha de marketing adicionada com sucesso ao seu Tracejo!", "success");
  };

  const handleDeleteCampaign = (id: string) => {
    setMktCampaigns(prev => prev.filter(c => c.id !== id));
    try { sound.playClick(); } catch(e) {}
    showToast("Campanha removida de sua escala operacional.", "info");
  };

  const handleUpdateCampaignPerformance = (id: string, actualInvestment: number, actualReturn: number, salesCount: number) => {
    setMktCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          actualInvestment: Number(actualInvestment) || 0,
          actualReturn: Number(actualReturn) || 0,
          salesCount: Number(salesCount) || 0
        };
      }
      return c;
    }));
    setEditingCampaignId(null);
    try { sound.playSuccess(); } catch(e) {}
    showToast("Resultados de campanha atualizados e consolidados com sucesso!", "success");
  };

  const handleGenerateMarketingBrief = () => {
    setIsBriefGenerating(true);
    setBriefGeneratedText("");
    try { sound.playClick(); } catch(e) {}

    setTimeout(() => {
      const selectedSect = selectedSegment === "commerce" ? "E-commerce & Varejo" : selectedSegment === "food" ? "Gastronomia & Restaurantes" : selectedSegment === "services" ? "Serviços em Geral / Consultoria" : "SaaS / Tecnologia de Recorrência";
      
      const hooks = [
        `🧠 GANCHO PRINCIPAL (Dor Aguda): "Quão caro custa para sua empresa não ter nossa agilidade? Pare de queimar margem na informalidade no mês que vem."`,
        `💡 BENEFÍCIO TÁTICO: "Substitua processos lentos e erráticos por uma infraestrutura auditável, elevando sua margem operacional em até 30% já no primeiro ciclo."`,
        `🔥 ESCASSEZ CONDIZENTE: "Vagas limitadas para o diagnóstico tático gratuito de CAC desta semana. Garanta o seu briefing operacional agora mesma."`
      ];

      const channelsRecom = [
        `📱 Meta Ads: Criativo baseado em Reels mostrando 'Anterior vs Novo' com alta empatia sobre a dor do cliente (Ideal: 45% do orçamento total).`,
        `🔍 Google Ads: Anúncios de busca focados em termos de alta intenção comercial (Ex: 'solução robusta com transparência de custos') redirecionando para Landing Page de resposta direta (Ideal: 35% do orçamento).`,
        `✉️ Email & WhatsApp: Mensagens curtas, diretas, direcionadas a leads antigos que se desengajaram (Ideal: 20% do orçamento).`
      ];

      const text = `### 🎯 BRIEFING TÁTICO E PLANO DE TRÁFEGO PARA MÍDIA SMART
Elaborado pela Especialista em Growth Dafne com base nas finanças integradas.

#### 📊 Detalhamento de Foco e Audiência:
- **Modelo de Negócio:** ${selectedSect}
- **Objetivo da Campanha:** ${briefCamType}
- **Minuta de Público-Alvo:** ${briefAudience}
- **LTV Médio Calculado PJ:** ${formatCurrency(realTicketMedio * 12)} (Projeção anualizada)

---

#### ✍️ Copywriting & Direcionamentos Criativos Recomendados:
1. **Ângulo de Abordagem:** Foco absoluto na solução de ineficiências operacionais imediatas.
2. ${hooks[0]}
3. ${hooks[1]}
4. ${hooks[2]}

---

#### 🌐 Estrutura Recomendada de Canais e Verba:
- ${channelsRecom[0]}
- ${channelsRecom[1]}
- ${channelsRecom[2]}

---

#### ⚙️ KPIs e Tracejo de Sucesso Alvo:
- **CAC Máximo Tolerável:** ${formatCurrency(realTicketMedio * 0.4)} (Mantendo excelente margem comercial de 60%)
- **Taxa de Conversão da Landing Page Alvo:** 2.8% a 4.5%
- **Cliques mínimos requeridos para fechar 1 venda:** ~35 cliques de tráfego qualificado

*Utilize este briefing de alta performance para alimentar suas agências ou criadores de conteúdo e garanta máximo retorno de ads.*`;

      setBriefGeneratedText(text);
      setIsBriefGenerating(false);
      try { sound.playSuccess(); } catch(e) {}
      showToast("Briefing inteligente gerado por I.A. com base em métricas contábeis!", "success");
    }, 1200);
  };

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
      
      const report = `### 📋 Parecer de Otimização de Valuation Max Performance Business & Dafne
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
3. **Implantar Conciliação de Caixa 100% Auditada no Max Performance Business (Ganha até +15% no Valor):**
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

  const handleExportSegmentAiReport = () => {
    if (!aiInsight) {
      showToast("Não há nenhum parecer da IA Dafne gerado ainda para exportação.", "error");
      return;
    }
    
    showToast("Gerando Parecer Corporativo I.A. sob Normas ABNT... Aguarde.", "info");
    
    try {
      const pdf = new AbntPdfDocument();

      const compName = profile?.companyName || "MAX PERFORMANCE BUSINESS";
      pdf.drawCover(
        compName,
        "PARECER TÉCNICO DE AUDITORIA E PLANO DE METAS SETORIAIS",
        `Conselho Avançado Síncrono e Otimização de Liquidez - Segmento: ${
          selectedSegment === "commerce" ? "Varejo" : 
          selectedSegment === "food" ? "Alimentação / Food Service" : 
          selectedSegment === "services" ? "Prestação de Serviços" : 
          selectedSegment === "tech" ? "Tecnologia / SaaS" : "Geral"
        }`,
        "CONSELHO AVANÇADO SÍNCRONO I.A."
      );

      // Section 1: Dashboard Context
      pdf.addPrimaryHeading("1. Elementos de Contexto e Saúde de Giro");
      pdf.addParagraph(
        `O presente relatório foi consolidado pela assessora de faturamento I.A., Dafne, examinando os indicadores contábeis da empresa ${compName}. Com base nos lançamentos registrados para o período corrido, foram identificadas as seguintes métricas estruturais de entrada para a modelagem preditiva:`
      );

      pdf.addBulletItem("•", `Faturamento Bruto (Receita Total): R$ ${totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      pdf.addBulletItem("•", `Custo de Mercadorias/Serviços (CMV/COGS): R$ ${totalCogs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      pdf.addBulletItem("•", `Despesas Operacionais Fixas (OPEX): R$ ${totalOpex.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      pdf.addBulletItem("•", `Margem Operacional Estimada (EBITDA): R$ ${(totalSales - totalCogs - totalOpex).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      pdf.addBulletItem("•", `Ticket Médio Real Observado: R$ ${realTicketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

      pdf.y += 5;

      // Section 2: AI Strategic Counsel
      pdf.addPrimaryHeading("2. Parecer e Diretriz Contábil por IA (Dafne)");
      pdf.addParagraph(
        "Abaixo consta a reprodução literal do parecer estratégico elaborado pelo mecanismo de inteligência do Conselho Avançado Síncrono em resposta direta à composição de caixa do usuário:"
      );

      const lines = aiInsight.split("\n");
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith("###")) {
          pdf.addSecondaryHeading(trimmed.replace(/^###\s*/, ""));
        } else if (trimmed.startsWith("##")) {
          pdf.addPrimaryHeading(trimmed.replace(/^##\s*/, ""));
        } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          pdf.addBulletItem("•", trimmed.replace(/^[-*]\s*/, ""));
        } else {
          pdf.addParagraph(trimmed);
        }
      });

      pdf.y += 5;

      // Section 3: Validation indicator
      pdf.addPrimaryHeading("3. Validação e Controle de Riscos Corporativos");
      pdf.addParagraph(
        `Este documento expressa o diagnóstico analítico calculado com base nas transações auditadas. A auditoria contábil certifica que os desvios e metas sugeridos visam recompor as reservas de segurança contra flutuações e cobrir gargalos operacionais específicos ao nicho de atuação.`
      );

      const compSanitized = compName.toUpperCase().replace(/\s+/g, "_");
      pdf.save(`PARECER_IA_SINC_DAFNE_${compSanitized}.pdf`);
      showToast("Parecer síncrono exportado em PDF com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao gerar PDF do Parecer Síncrono:", err);
      showToast("Houve uma falha ao confeccionar o PDF do Parecer.", "error");
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
  const userGrossMargin = totalSales > 0 ? ((totalSales - totalCogs) / totalSales) * 100 : 0.0;
  const userOpexRatio = totalSales > 0 ? (totalOpex / totalSales) * 100 : 0.0;
  const userNetMargin = totalSales > 0 ? ((totalSales - totalCogs - totalOpex) / totalSales) * 100 : 0.0;

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
  
  const currentRevenue = totalSales > 0 ? totalSales : 0;
  const currentCogs = totalCogs > 0 ? totalCogs : 0;
  const currentOpex = totalOpex > 0 ? totalOpex : 0;

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
              O Max Performance Business analisa e subdivide as operações da sua matriz e filias de acordo com o modelo de negócio registrado, comparando com benchmarks nacionais e fornecendo calculadores de simulação avançados.
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
                <span className="text-[10px] font-black uppercase text-indigo-600 block">⏳ Tempo de Retorno (Payback)</span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Mostra <strong>quantos meses</strong> você leva para recuperar o dinheiro que gastou com anúncios para trazer o cliente. Quanto mais rápido recuperar, mais dinheiro sobra em caixa livre.
                </p>
              </div>
            </div>
          </div>
        </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/90 p-6 md:p-8 rounded-[2.2rem] border-2 border-orange-500 shadow-xl shadow-orange-500/10 relative z-10 transition-all duration-300 hover:border-orange-400">
              {/* BRANDING/PRIORITY HEADER BAR FOR BOTH COLS */}
              <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-orange-950/80 via-slate-900/40 to-slate-950 p-4 rounded-2xl border border-orange-550/30 gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-[10px] bg-orange-500 text-black font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 w-fit leading-none">
                      ★ PRIORIDADE OPERACIONAL MÁXIMA
                    </span>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight font-sans">
                      Simulador Preditivo do Funil de Conversão e Aquisição (Dafne Forecast)
                    </h4>
                  </div>
                </div>
                <div className="text-[9.5px] font-mono text-orange-400 font-bold bg-orange-950/60 border border-orange-500/20 px-2.5 py-1.5 rounded-lg shrink-0 text-center sm:text-right">
                  ⚡ Alavancagem Exponencial
                </div>
              </div>

              {/* COL 1: PARÂMETROS CONTÁBEIS */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                  <span className="text-[11px] font-black uppercase tracking-widest text-orange-400 block font-sans">
                    🎛️ Parâmetros Contábeis de Mídia
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Investimento & CPC</span>
                </div>

                {/* SLIDER 1: AD SPEND */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      Investimento Mensal (Ad Spend):
                      <span className="text-[9.5px] bg-slate-900 text-orange-400 px-1.5 py-0.5 rounded font-mono border border-orange-500/10">
                        R$ {Math.round(mktAdSpend / 30)}/dia
                      </span>
                    </span>
                    <span className="text-orange-400 font-mono text-sm font-black">{formatCurrency(mktAdSpend)}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={mktAdSpend}
                    onChange={(e) => setMktAdSpend(parseInt(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none transition-all hover:bg-slate-700"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono">
                    <span>R$ 500 / Baixo</span>
                    <span>R$ 50.000 / Tração Máxima</span>
                  </div>
                </div>

                {/* SLIDER 2: CPC */}
                <div className="space-y-2 text-left pt-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      Custo por Clique (CPC Estimado):
                      <span className="text-[9.5px] bg-slate-900 text-orange-400 px-1.5 py-0.5 rounded font-mono border border-orange-500/10">
                        {clicksMkt.toLocaleString()} Cliques
                      </span>
                    </span>
                    <span className="text-orange-400 font-mono text-sm font-black">R$ {mktCpc.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="5.00"
                    step="0.05"
                    value={mktCpc}
                    onChange={(e) => setMktCpc(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none transition-all hover:bg-slate-700"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono">
                    <span>R$ 0.15 / Otimizado</span>
                    <span>R$ 5.00 / Concorrência</span>
                  </div>
                </div>
              </div>

              {/* COL 2: EFICIÊNCIA DO FUNIL */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#f97316] block font-sans">
                    📈 Eficiência de Conversão & LTV
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Retenção & Retorno</span>
                </div>

                {/* SLIDER 3: CONVERSION */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      Taxa de Conversão do Funil:
                      <span className="text-[9.5px] bg-slate-900 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-500/15">
                        {clientsMkt} Clientes
                      </span>
                    </span>
                    <span className="text-orange-400 font-mono text-sm font-black">{mktConversionRate.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="10.0"
                    step="0.1"
                    value={mktConversionRate}
                    onChange={(e) => setMktConversionRate(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none transition-all hover:bg-slate-700"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono">
                    <span>0.2% / Baixo Atrito</span>
                    <span>10.0% / Alta Performance</span>
                  </div>
                </div>

                {/* SLIDER 4: LTV */}
                <div className="space-y-2 text-left pt-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      Valor de Ciclo do Cliente (LTV):
                      <span className="text-[9.5px] bg-slate-900 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-500/15">
                        LTV/CAC: {(computedLtv / (cacMkt || 1)).toFixed(1)}x
                      </span>
                    </span>
                    <span className="text-orange-400 font-mono text-sm font-black">
                      {mktTargetLtv > 0 ? formatCurrency(mktTargetLtv) : `${formatCurrency(computedLtv)} (Auto)`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="50"
                    value={mktTargetLtv}
                    onChange={(e) => setMktTargetLtv(parseInt(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none transition-all hover:bg-slate-700"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono">
                    <span>Ajuste Zero / Tradicional</span>
                    <span>R$ 5.000 / Ticket Premium</span>
                  </div>
                </div>
              </div>

              {/* DAFNE MICRO PERFORMANCE FORECAST REPORT PANELS */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-left">
                <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 hover:border-orange-500/20 transition-all">
                  <span className="text-[9px] font-mono font-bold text-slate-400 block mb-0.5">CLIQUES MENSAIS ESTIMADOS</span>
                  <p className="text-sm font-black font-sans text-white">{clicksMkt.toLocaleString()}</p>
                  <p className="text-[8.5px] text-slate-500 font-sans mt-1">Visitantes únicos qualificados em sua página.</p>
                </div>
                <div className="p-3.5 bg-slate-950/90 rounded-xl border border-rose-955/40 hover:border-orange-500/20 transition-all">
                  <span className="text-[9px] font-mono font-bold text-orange-400 block mb-0.5">CAC MÁXIMO CALCULADO</span>
                  <p className="text-sm font-black font-sans text-orange-400">{formatCurrency(cacMkt)}</p>
                  <p className="text-[8.5px] text-slate-500 font-sans mt-1">Custo médio total para conquistar 1 novo cliente.</p>
                </div>
                <div className="p-3.5 bg-slate-950/90 rounded-xl border border-emerald-955/40 hover:border-orange-500/20 transition-all">
                  <span className="text-[9px] font-mono font-bold text-emerald-400 block mb-0.5">FATURAMENTO ADICIONAL PREVISTO</span>
                  <p className="text-sm font-black font-sans text-emerald-400">{formatCurrency(growthRevenue)}</p>
                  <p className="text-[8.5px] text-slate-500 font-sans mt-1">Total bruto faturado de forma incremental (ROI {mktRoi.toFixed(0)}%).</p>
                </div>
              </div>

              {/* INTEGRADO CRM & CANAL GOOGLE ADS API REAL-TIME */}
              <div className="md:col-span-2 bg-slate-950/70 p-4 rounded-xl border border-orange-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className={cn("relative flex h-2.5 w-2.5", isSyncingGoogleAds ? "animate-spin" : "")}>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10.5px] font-black uppercase text-white font-sans tracking-tight">Sincronização Integrada & APIs CRM</span>
                  </div>
                  <p className="text-[10.1px] text-slate-400 leading-normal max-w-xl">
                    Leads Ativos no CRM: <strong className="text-emerald-400 font-mono">{crmLeadsState.activeCount}</strong> | Volume Diário: <strong className={cn("font-mono px-1 rounded", crmLeadsState.dailyVolume > crmLeadsState.movingAverage ? "text-orange-400 bg-orange-950/40" : "text-white")}>{crmLeadsState.dailyVolume} leads</strong> (Média 7 dias: <span className="font-mono text-slate-350">{crmLeadsState.movingAverage}</span>). Sincronize novas campanhas do Google Ads com um toque para receber dados operacionais em tempo real.
                  </p>
                </div>
                <button
                  id="sync-google-ads-btn"
                  onClick={handleSyncGoogleAds}
                  disabled={isSyncingGoogleAds}
                  className="bg-orange-500 hover:bg-orange-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-[10.2px] font-black uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 shadow-md shadow-orange-500/10"
                >
                  <RefreshCw size={12} className={cn(isSyncingGoogleAds && "animate-spin")} />
                  {isSyncingGoogleAds ? "Sincronizando Google Ads..." : "Sincronizar Google Ads"}
                </button>
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
            {(() => {
              const baselineGrossTotal = useRealFinanceBase ? totalSales : (totalSalesCount > 0 ? totalSales : 0);
              const baselineCogsTotal = useRealFinanceBase ? totalCogs : (totalSalesCount > 0 ? totalCogs : 0);
              const baselineOpexTotal = useRealFinanceBase ? totalOpex : (totalSalesCount > 0 ? totalOpex : 0);
              const baselineNetTotal = useRealFinanceBase ? (totalSales - totalCogs - totalOpex) : (totalSalesCount > 0 ? (totalSales - totalCogs - totalOpex) : 0);

              const campaignGrossTotal = metaRevenue + googleRevenue + organicRevenue;
              const campaignCogsTotal = campaignGrossTotal * (roiCmvPct / 100);
              const campaignTrafficCost = mktAdSpend;
              const campaignAgencyCost = roiAgencyCost;
              const campaignTotalCost = campaignTrafficCost + campaignAgencyCost;
              const campaignNetTotal = campaignGrossTotal - campaignCogsTotal - campaignTotalCost;

              const consolidatedGrossTotal = baselineGrossTotal + campaignGrossTotal;
              const consolidatedCogsTotal = baselineCogsTotal + campaignCogsTotal;
              const consolidatedOpexTotal = baselineOpexTotal + campaignTrafficCost + campaignAgencyCost;
              const consolidatedNetTotal = consolidatedGrossTotal - consolidatedCogsTotal - consolidatedOpexTotal;

              const netRoi = campaignTotalCost > 0 ? (campaignNetTotal / campaignTotalCost) * 100 : 0;
              const maxCacTolerated = computedLtv * (1 - roiCmvPct / 100);
              const isCacDangerous = cacMkt > maxCacTolerated;

              let verdictColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/40";
              let verdictBadge = "★ Tração Alta Rentabilidade";
              let verdictText = `Seu tráfego pago está saudável com ROI Líquido Real de ${netRoi.toFixed(0)}%. O modelo gera lucro marginal robusto, sendo o CAC de ${formatCurrency(cacMkt)} compatível com as margens de entrega. Recomendado autorizar expansões progressivas de mídia (+10% a 15% semanal).`;

              if (netRoi < 0) {
                verdictColor = "text-rose-400 border-rose-500/30 bg-rose-950/40";
                verdictBadge = "⚠️ Tráfego Consumidor de Caixa";
                verdictText = `Alerta de Risco de Caixa. A operação das campanhas é deficitária (ROI Real de ${netRoi.toFixed(0)}%). O motivo crítico é que o custo por novo cliente (${formatCurrency(cacMkt)}) ou o CMV marginal de entrega (${roiCmvPct}%) está drenando o lucro gerado. Sugere-se elevar o markup do produto ou auditar o CTR para baixar o CPC de mídia de imediato.`;
              } else if (netRoi <= 40) {
                verdictColor = "text-amber-400 border-amber-500/30 bg-amber-955/40";
                verdictBadge = "⚡ Margem Estreita de Operação";
                verdictText = `Equilíbrio frágil. Embora positivo com Margem de ${netRoi.toFixed(0)}%, o retorno corre risco de se tornar prejuízo caso o CPC de captação sofra pequenas oscilações de leilão. Estabilize primeiro a taxa de conversão do funil antes de escalar o orçamento.`;
              }

              return (
                <div className="bg-[#0e1026] border border-orange-500/25 rounded-2xl p-6 relative z-10 space-y-6">
                  {/* Title and Base Toggle */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Simulador de Impacto de Tráfego Pago no Caixa PJ
                      </span>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">
                        Apurador Contábil de Retorno Real do Investimento (ROI Avançado)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Calcule o faturamento e o lucro líquido real residual após descontar o tráfego pago, custos de suporte e o Custo de Mercadorias Vendidas (CMV/COGS) das novas conversões.
                      </p>
                    </div>

                    {/* Toggle Base */}
                    <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 self-start lg:self-auto">
                      <button
                        onClick={() => { setUseRealFinanceBase(true); try { sound.playClick(); } catch(e) {} }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all truncate",
                          useRealFinanceBase 
                            ? "bg-orange-600 text-slate-950 font-black shadow" 
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        DRE Real da Empresa
                      </button>
                      <button
                        onClick={() => { setUseRealFinanceBase(false); try { sound.playClick(); } catch(e) {} }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all truncate",
                          !useRealFinanceBase 
                            ? "bg-orange-600 text-slate-950 font-black shadow" 
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        Simular Padrão PME
                      </button>
                    </div>
                  </div>

                  {/* Micro-inputs Sliders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                        <span className="flex items-center gap-1.5">
                          💼 CMV Marginal sobre Vendas de Mídia:
                          <span className="text-[9px] bg-slate-950 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">
                            Fórmula: COGS%
                          </span>
                        </span>
                        <span className="text-orange-400 font-mono text-sm font-black">{roiCmvPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        step="1"
                        value={roiCmvPct}
                        onChange={(e) => setRoiCmvPct(parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono font-sans">
                        <span>10% / Alta Margem (Ex: SaaS)</span>
                        <span className={cn(Math.round(realCmvPct) === roiCmvPct && "text-emerald-400 font-black")}>
                          {Math.round(realCmvPct) === roiCmvPct ? "★ Seu CMV Real do DRE" : `DRE Real: ${Math.round(realCmvPct)}%`}
                        </span>
                        <span>80% / Varejo Estrito</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                        <span className="flex items-center gap-1.5">
                          🏷️ Custos de Suporte (Agência & Ferramentas):
                          <span className="text-[9px] bg-slate-950 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">
                            Custo Fixo Mensal Extra
                          </span>
                        </span>
                        <span className="text-orange-400 font-mono text-sm font-black">{formatCurrency(roiAgencyCost)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={roiAgencyCost}
                        onChange={(e) => setRoiAgencyCost(parseInt(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase font-mono font-sans">
                        <span>R$ 0 / Orgânico Puro</span>
                        <span>R$ 5.000 / Assessoria de Growth</span>
                        <span>R$ 10.000 / Agência Sênior</span>
                      </div>
                    </div>
                  </div>

                  {/* Comparisons Table */}
                  <div className="overflow-x-auto text-[11px] rounded-xl border border-slate-800 bg-[#070918]/80">
                    <table className="w-full text-left border-collapse table-auto">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400 font-mono uppercase tracking-wider text-[9px]">
                          <th className="p-3 font-semibold text-slate-300 text-left">Métrica de DRE Estimada</th>
                          <th className="p-3 font-semibold text-slate-300 text-right">Cenário Atual (Sem Ads)</th>
                          <th className="p-3 font-semibold text-orange-400 text-right bg-orange-950/20">Incremento de Captação</th>
                          <th className="p-3 font-semibold text-emerald-400 text-right bg-slate-900/30">Novo Consolidado (Com Ads)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-medium text-left">
                        <tr>
                          <td className="p-3 text-slate-400 font-sans">Faturamento Bruto Recorrente (Adesão/Vendas)</td>
                          <td className="p-3 text-right font-mono text-slate-200">{formatCurrency(baselineGrossTotal)}</td>
                          <td className="p-3 text-right font-mono text-orange-300 bg-orange-950/10 font-bold">+{formatCurrency(campaignGrossTotal)}</td>
                          <td className="p-3 text-right font-mono text-white bg-slate-900/20 font-black">{formatCurrency(consolidatedGrossTotal)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-400 font-sans">Custo Operacional de Entrega (COGS / CMV)</td>
                          <td className="p-3 text-right font-mono text-rose-300">-{formatCurrency(baselineCogsTotal)}</td>
                          <td className="p-3 text-right font-mono text-rose-400 bg-orange-950/10 font-semibold">-{formatCurrency(campaignCogsTotal)} <span className="text-[9.5px] text-slate-500 font-mono">({roiCmvPct}%)</span></td>
                          <td className="p-3 text-right font-mono text-rose-300 bg-slate-900/20 font-bold">-{formatCurrency(consolidatedCogsTotal)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-400 font-sans">Despesa de Marketing (Tráfego Pago & Ads)</td>
                          <td className="p-3 text-right font-mono text-zinc-500">R$ 0,00</td>
                          <td className="p-3 text-right font-mono text-amber-500 bg-orange-950/10">-{formatCurrency(campaignTrafficCost)}</td>
                          <td className="p-3 text-right font-mono text-amber-500 bg-slate-900/20 mr-1">-{formatCurrency(mktAdSpend)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-400 font-sans">Custos Fixos / Ferramental & Agência PJ</td>
                          <td className="p-3 text-right font-mono text-zinc-500">R$ 0,00</td>
                          <td className="p-3 text-right font-mono text-amber-500 bg-orange-950/10">-{formatCurrency(campaignAgencyCost)}</td>
                          <td className="p-3 text-right font-mono text-amber-500 bg-slate-900/20">-{formatCurrency(roiAgencyCost)}</td>
                        </tr>
                        <tr className="bg-slate-950/40 border-t border-slate-700">
                          <td className="p-3 font-black text-slate-200">Faturamento Líquido (Lucro Semanal / Mensal)</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-100">{formatCurrency(baselineNetTotal)}</td>
                          <td className={cn(
                            "p-3 text-right font-mono bg-orange-950/20 font-black",
                            campaignNetTotal >= 0 ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {campaignNetTotal >= 0 ? "+" : ""}{formatCurrency(campaignNetTotal)}
                          </td>
                          <td className={cn(
                            "p-3 text-right font-mono bg-slate-900/50 font-black text-sm border-l border-slate-800",
                            consolidatedNetTotal >= baselineNetTotal ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {formatCurrency(consolidatedNetTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* ROI Stats grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* ROI card */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-[#080a1e] flex flex-col justify-between text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                        <TrendingUp size={48} className="text-orange-500" />
                      </div>
                      <div className="space-y-0.5 z-10">
                        <span className="text-[10px] text-indigo-450 font-mono font-bold uppercase tracking-wider block">ROI Líquido de Mídia (Real)</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn(
                            "text-xl font-black font-mono tracking-tight",
                            netRoi < 0 ? "text-rose-400 truncate" : netRoi > 50 ? "text-emerald-400 truncate" : "text-amber-400 truncate"
                          )}>
                            {netRoi.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-450 leading-normal block pt-1 font-sans">
                          Calcula faturamento líquido descontando operacionalidade do produto.
                        </span>
                      </div>
                    </div>

                    {/* ROAS comparison card */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-[#080a1e] flex flex-col justify-between text-left relative overflow-hidden">
                      <div className="space-y-0.5 z-10">
                        <span className="text-[10px] text-indigo-405 font-mono font-bold uppercase tracking-wider block">ROAS do Tráfego Pago (Bruto)</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-white font-mono tracking-tight">
                            {((metaRevenue + googleRevenue + organicRevenue) / (mktAdSpend || 1)).toFixed(2)}x
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-455 leading-normal block pt-1 font-sans">
                          Razão simples de verba/receita de marketing: <strong className="text-slate-300 font-bold whitespace-nowrap">Sem descontar CMV.</strong>
                        </span>
                      </div>
                    </div>

                    {/* Safety CAC threshold */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-[#080a1e] flex flex-col justify-between text-left relative overflow-hidden">
                      <div className="space-y-0.5 z-10 font-sans">
                        <span className="text-[10px] text-indigo-410 font-mono font-bold uppercase tracking-wider block">CAC Máximo de Segurança (Break-even)</span>
                        <div className="space-y-0.5">
                          <div className="text-xl font-black text-rose-400 font-mono tracking-tight">
                            {formatCurrency(maxCacTolerated)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono leading-none font-bold">
                            <span className="text-slate-400">Custo Atual:</span>
                            <span className={isCacDangerous ? "text-rose-400 underline font-black" : "text-emerald-400 font-black"}>
                              {formatCurrency(cacMkt)} {isCacDangerous ? "⚠ Prejuízo!" : "✓ Seguro"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dafne AI Audit Alert Badge Section */}
                  <div className={cn(
                    "p-4 rounded-2xl border text-left flex flex-col md:flex-row items-start md:items-center gap-3.5 relative overflow-hidden font-sans",
                    verdictColor
                  )}>
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] bg-orange-500 rounded-full blur-xl pointer-events-none" />
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-white/[0.06] text-white shrink-0 text-xl font-bold font-sans">
                      🤖
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded-md border border-current text-current">
                          Auditoria de Tráfego de Dafne
                        </span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-tight">
                          {verdictBadge}
                        </span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-slate-100 italic select-text">
                        "{verdictText}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

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
                    <option value="Gerar Mais Receita Imediata (Dafne Growth)">🔥 Gerar Mais Receita Imediata</option>
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
                      <span className="text-[9px] text-orange-500/40 mt-1 block">Conectado com modelos síncronos de linguagem do Max Performance Business</span>
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

            {/* INTERACTIVE MARKETING CAMPAIGN TRACKER & BRIEFING BUILDER */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 md:p-6 space-y-6 relative z-10 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-orange-400 uppercase flex items-center gap-1.5 font-sans">
                    <Megaphone size={14} className="text-orange-500 animate-bounce" /> Quadro Tático de Tracejo de Campanhas
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans">Desenvolva planos táticos, organize investimentos por canal de anúncio e controle as metas de CAC (Custo de Aquisição de Clientes) de forma centralizada.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300">
                  <span className="font-bold">Total Alocado:</span>
                  <span className="text-[#f97316] font-extrabold font-sans">
                    {formatCurrency(mktCampaigns.reduce((sum, c) => sum + c.budget, 0))}
                  </span>
                </div>
              </div>

              {/* DAFNE REAL-TIME CAMPAIGN INVESTMENT & RETURN MONITORING DASHBOARD */}
              <div className="bg-slate-950 p-4 md:p-5 rounded-2xl border border-orange-500/20 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[9px] bg-orange-500/10 text-orange-400 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-orange-500/10 inline-block">
                      Módulo de Análise e Auditoria de Tráfego Realizado
                    </span>
                    <h5 className="text-xs font-black text-white uppercase font-sans tracking-wide">
                      Relatório de Performance Comercial e Retorno das Estratégias (ROI LTV Ledger)
                    </h5>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    Consolidado em Tempo Real • Ativo
                  </div>
                </div>

                {/* KPI Metrics Matrix Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-left">
                    <span className="text-[8px] text-slate-500 uppercase font-black font-sans block">Total Planejado (Verba Alocada)</span>
                    <div className="text-sm font-black text-slate-300 font-mono mt-0.5">
                      {formatCurrency(mktCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0))}
                    </div>
                    <span className="text-[7.5px] text-slate-500 font-mono mt-1 block">Teto de mídia tático</span>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-left">
                    <span className="text-[8px] text-orange-400 uppercase font-black font-sans block">Investimento Real (Executado)</span>
                    <div className="text-sm font-black text-orange-400 font-mono mt-0.5">
                      {formatCurrency(mktCampaigns.reduce((sum, c) => sum + (c.actualInvestment || 0), 0))}
                    </div>
                    <span className="text-[7.5px] text-slate-500 font-mono mt-1 block">
                      {mktCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0) > 0 
                        ? `${((mktCampaigns.reduce((sum, c) => sum + (c.actualInvestment || 0), 0) / mktCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0)) * 100).toFixed(0)}% de consumo de verba`
                        : "Consumo de verba"
                      }
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-emerald-950 rounded-xl text-left relative overflow-hidden">
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-emerald-400 uppercase font-black font-sans block">Retorno Real (Faturamento)</span>
                    <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                      {formatCurrency(mktCampaigns.reduce((sum, c) => sum + (c.actualReturn || 0), 0))}
                    </div>
                    <span className="text-[7.5px] text-slate-500 font-mono mt-1 block">
                      {mktCampaigns.reduce((sum, c) => sum + (c.salesCount || 0), 0)} conversões registradas
                    </span>
                  </div>

                  {(() => {
                    const totalInv = mktCampaigns.reduce((sum, c) => sum + (c.actualInvestment || 0), 0);
                    const totalRet = mktCampaigns.reduce((sum, c) => sum + (c.actualReturn || 0), 0);
                    const overallProfit = totalRet - totalInv;
                    const isPositive = overallProfit >= 0;
                    const overallRoiValue = totalInv > 0 ? (overallProfit / totalInv) * 100 : 0;

                    return (
                      <div className={cn(
                        "p-3 border rounded-xl text-left relative overflow-hidden",
                        isPositive ? "bg-emerald-950/20 border-emerald-500/20" : "bg-rose-950/20 border-rose-500/20"
                      )}>
                        <span className="text-[8px] text-slate-400 uppercase font-black font-sans block">Resultado Líquido / ROI</span>
                        <div className={cn("text-sm font-black font-mono mt-0.5", isPositive ? "text-emerald-400" : "text-rose-400")}>
                          {isPositive ? "+" : ""}{formatCurrency(overallProfit)}
                        </div>
                        <span className="text-[7.5px] font-mono mt-1 block font-bold text-slate-350">
                          ROI: <strong className={isPositive ? "text-emerald-400" : "text-rose-400"}>{overallRoiValue.toFixed(1)}%</strong>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Sub-container representing decision matrix and recharts dynamic reporting */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  {/* Recharts comparison bar chart of campaigns */}
                  <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[8.5px] text-slate-500 uppercase font-black font-sans block">Demonstrativo Detalhado de Campanhas</span>
                        <h6 className="text-[10px] font-black text-slate-350 uppercase font-mono">Investimento Alocado vs. Retorno Efetivo por Ação</h6>
                      </div>
                    </div>

                    <div className="h-[180px] w-full font-sans">
                      {mktCampaigns.filter(c => c.budget > 0 || (c.actualInvestment || 0) > 0).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-slate-600 text-[10px] font-bold uppercase">
                          Sem campanhas válidas para gerar comparativo gráfico.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={mktCampaigns.filter(c => c.budget > 0 || (c.actualInvestment || 0) > 0).map(c => ({
                              nome: c.name.length > 20 ? c.name.substring(0, 18) + "..." : c.name,
                              "Planejado": c.budget || 0,
                              "Investido Real": c.actualInvestment || 0,
                              "Retorno Real": c.actualReturn || 0
                            }))}
                            margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                            <XAxis dataKey="nome" stroke="#64748b" fontSize={8.5} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={8} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                              itemStyle={{ fontSize: '10px', color: '#e2e8f0' }}
                              labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#f97316' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '8px', paddingTop: '10px' }} />
                            <Bar dataKey="Planejado" name="Planejado (R$)" fill="#475569" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="Investido Real" name="Investido Real (R$)" fill="#f97316" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="Retorno Real" name="Retorno Real (R$)" fill="#10b981" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Decisions recommendation advice */}
                  <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between text-left space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
                        <Sparkles size={12} className="text-orange-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-[#38bdf8] font-sans tracking-wide">Dafne Decision Advisor</span>
                      </div>

                      {(() => {
                        const totalInv = mktCampaigns.reduce((sum, c) => sum + (c.actualInvestment || 0), 0);
                        const totalRet = mktCampaigns.reduce((sum, c) => sum + (c.actualReturn || 0), 0);
                        const overallProfit = totalRet - totalInv;
                        const overallRoiValue = totalInv > 0 ? (overallProfit / totalInv) * 100 : 0;

                        if (totalInv === 0) {
                          return (
                            <div className="space-y-2">
                              <span className="inline-flex items-center gap-1 text-[8.5px] font-black bg-slate-800 text-slate-300 font-sans px-2 py-0.5 rounded border border-slate-700 uppercase">
                                ⚪ Sem Dados de Execução
                              </span>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">
                                Sem registros de investimento real nas estratégias. Comece inserindo os valores reais de custo e retorno do seu tráfego nos cards abaixo clicando em "Ajustar Execução".
                              </p>
                            </div>
                          );
                        }

                        if (overallRoiValue >= 110) {
                          return (
                            <div className="space-y-2">
                              <span className="inline-flex items-center gap-1 text-[8.5px] font-black bg-emerald-950 text-emerald-400 font-sans px-2 py-0.5 rounded border border-emerald-900 uppercase">
                                🟢 ESCALAR VERBA IMEDIATO
                              </span>
                              <p className="text-[10px] text-slate-300 leading-relaxed font-sans mt-1">
                                Suas campanhas ativos mostram excelente eficiência com <strong className="text-emerald-400">{overallRoiValue.toFixed(0)}% de ROI real</strong>. Há fôlego de margem para acelerar e tracionar com maior intensidade comercial em canais de anúncio.
                              </p>
                              <div className="p-2 bg-emerald-950/25 border border-emerald-500/10 rounded text-[9px] text-emerald-400 font-mono">
                                Recomendação: Aumentar orçamento operacional de mídia em 15% nos canais ativos de alta performance.
                              </div>
                            </div>
                          );
                        }

                        if (overallRoiValue < 0) {
                          return (
                            <div className="space-y-2">
                              <span className="inline-flex items-center gap-1 text-[8.5px] font-black bg-rose-950 text-rose-400 font-sans px-2 py-0.5 rounded border border-rose-900 uppercase">
                                🔴 PAUSAR & DIAGNOSTICAR GAPS
                              </span>
                              <p className="text-[10px] text-slate-350 leading-relaxed font-sans mt-1">
                                O balanço geral das campanhas executadas está deficitário. Estão ocorrendo pontos de ineficiência no checkout ou criativos desalinhados com o ticket de <strong className="text-white">{formatCurrency(realTicketMedio)}</strong>.
                              </p>
                              <div className="p-2 bg-rose-950/25 border border-rose-500/10 rounded text-[9px] text-rose-300 font-mono">
                                Recomendação: Use a I.A. Dafne abaixo para reescrever as as copys e blindar escoamento.
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-1 text-[8.5px] font-black bg-amber-950 text-amber-400 font-sans px-2 py-0.5 rounded border border-amber-900 uppercase">
                              🟡 OTIMIZAÇÃO CIRÚRGICA
                            </span>
                            <p className="text-[10px] text-[#fad] text-slate-300 leading-relaxed font-sans mt-1">
                              O resultado líquido consolidado é positivo ({overallRoiValue.toFixed(0)}% de ROI), mas opera com teto apertado. Refine criativos em canais secundários para expandir margem.
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    <p className="text-[8.5px] text-slate-500 font-mono pt-2 border-t border-slate-800 leading-snug">
                      * O ROI calculado pondera a margem de contribuição ajustada, assegurando que o retorno descontado cubra também os custos indiretos.
                    </p>
                  </div>
                </div>
              </div>

              {/* DAFNE REVENUE ACCELERATION ENGINE RECOMMENDATIONS */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-orange-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-orange-500 animate-pulse" />
                    <span className="text-[10.5px] font-black uppercase text-white font-sans tracking-wide">
                      Campanhas de Alavancagem de Receita da Dafne I.A.
                    </span>
                  </div>
                  <span className="text-[8px] bg-orange-950 text-orange-400 font-bold px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest font-mono">
                    Segmento: {selectedSegment === "commerce" ? "Varejo/E-commerce" : selectedSegment === "food" ? "Alimentação/Gastronomia" : selectedSegment === "services" ? "Serviços/Consultoria" : "SaaS/Recorrência"}
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-normal">
                  Estas táticas exclusivas foram estruturadas pela mentora Dafne para impulsionar instantaneamente o faturamento líquido da sua empresa com base nas métricas contábeis reais de ticket médio (<strong className="text-white">{formatCurrency(realTicketMedio)}</strong>). Toque em any campanha para ativá-la no seu painel.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {(() => {
                    // Predefined campaigns based on segment
                    let recommendations = [];
                    if (selectedSegment === "commerce") {
                      recommendations = [
                        {
                          name: "🚀 Remarketing Smart p/ Carrinhos VIP",
                          channel: "Meta Ads (Instagram)",
                          budget: Math.round(realTicketMedio * 15),
                          targetCac: Math.round(realTicketMedio * 0.25),
                          description: "Recupere até 25% de carrinhos com benefícios no checkout.",
                          roas: "4.0x"
                        },
                        {
                          name: "🔥 Combo Exclusivo Premium Multi-Kit",
                          channel: "Google Ads",
                          budget: Math.round(realTicketMedio * 25),
                          targetCac: Math.round(realTicketMedio * 0.35),
                          description: "Gere receita agrupando os 3 produtos de maior margem.",
                          roas: "2.8x"
                        },
                        {
                          name: "🤝 Indicação Premiada Member-get-Member",
                          channel: "E-mail & WhatsApp",
                          budget: Math.round(realTicketMedio * 8),
                          targetCac: Math.round(realTicketMedio * 0.15),
                          description: "Ofereça bônus de indicação focado em aumentar a taxa de conversão.",
                          roas: "6.6x"
                        }
                      ];
                    } else if (selectedSegment === "food") {
                      recommendations = [
                        {
                          name: "🍹 Menu Especial Happy Hour Corporativo",
                          channel: "Meta Ads (Instagram)",
                          budget: Math.round(realTicketMedio * 12),
                          targetCac: Math.round(realTicketMedio * 0.20),
                          description: "Venda antecipada de combos para aumentar o fluxo semanal.",
                          roas: "5.0x"
                        },
                        {
                          name: "🍱 Assinatura Recorrente Gourmet Ledger",
                          channel: "Influenciadores / Parcerias",
                          budget: Math.round(realTicketMedio * 30),
                          targetCac: Math.round(realTicketMedio * 0.40),
                          description: "Assinaturas corporativas de lanches/cafés com faturamento estável.",
                          roas: "2.5x"
                        },
                        {
                          name: "🍕 Cashback VIP para Eventos e Grupos",
                          channel: "E-mail & WhatsApp",
                          budget: Math.round(realTicketMedio * 10),
                          targetCac: Math.round(realTicketMedio * 0.18),
                          description: "Ação programada para receber reservas de comemorações e empresas.",
                          roas: "5.5x"
                        }
                      ];
                    } else if (selectedSegment === "services") {
                      recommendations = [
                        {
                          name: "💼 Sessão Estratégica Diagnóstica Express",
                          channel: "Google Ads",
                          budget: Math.round(realTicketMedio * 8),
                          targetCac: Math.round(realTicketMedio * 0.30),
                          description: "Atraia tomadores de decisão PJ oferecendo um diagnóstico inicial grátis.",
                          roas: "3.3x"
                        },
                        {
                          name: "🎓 Retainer Premium c/ Upgrades Ativos",
                          channel: "Influenciadores / Parcerias",
                          budget: Math.round(realTicketMedio * 18),
                          targetCac: Math.round(realTicketMedio * 0.45),
                          description: "Venda de escopo expandido para clientes ativos com maior faturamento.",
                          roas: "2.2x"
                        },
                        {
                          name: "📬 Reativação Relâmpago de Leads Antigos",
                          channel: "E-mail & WhatsApp",
                          budget: Math.round(realTicketMedio * 5),
                          targetCac: Math.round(realTicketMedio * 0.15),
                          description: "Venda de pacotes limitados com preços promocionais exclusivos.",
                          roas: "6.6x"
                        }
                      ];
                    } else { // default or tech/SaaS
                      recommendations = [
                        {
                          name: "💻 Conversão Direta para Plano Anual Ledger",
                          channel: "E-mail & WhatsApp",
                          budget: Math.round(realTicketMedio * 20),
                          targetCac: Math.round(realTicketMedio * 0.30),
                          description: "Incentive clientes mensais com desconto promocional anual antecipado.",
                          roas: "3.3x"
                        },
                        {
                          name: "⚡ Ativação Inteligente de Base Expirada",
                          channel: "Meta Ads (Instagram)",
                          budget: Math.round(realTicketMedio * 15),
                          targetCac: Math.round(realTicketMedio * 0.25),
                          description: "Retargeting de leads antigos para assinar o ecossistema financeiro.",
                          roas: "4.0x"
                        },
                        {
                          name: "🏢 Upsell para Plano Corporativo Multi-Sede",
                          channel: "Google Ads",
                          budget: Math.round(realTicketMedio * 25),
                          targetCac: Math.round(realTicketMedio * 0.40),
                          description: "Ofereça pacotes consolidados sob medida para expandir faturamento.",
                          roas: "2.5x"
                        }
                      ];
                    }

                    return recommendations.map((rec, i) => (
                      <div key={i} className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 flex flex-col justify-between text-left space-y-2 relative group hover:border-orange-500/40 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black text-white truncate max-w-[130px] sm:max-w-none" title={rec.name}>{rec.name}</span>
                            <span className="text-[8px] font-mono text-emerald-400 font-extrabold bg-emerald-950 px-1 rounded shrink-0">{rec.roas} ROAS</span>
                          </div>
                          <p className="text-[9.5px] text-slate-400 leading-snug min-h-[28px]">{rec.description}</p>
                        </div>
                        <div className="text-[8.5px] font-mono text-slate-500 border-t border-slate-950 pt-1.5 flex flex-col gap-0.5">
                          <div className="flex justify-between"><span>Verba:</span> <span className="text-orange-400 font-bold">{formatCurrency(rec.budget)}</span></div>
                          <div className="flex justify-between"><span>CAC Alvo:</span> <span className="text-slate-300 font-bold">{formatCurrency(rec.targetCac)}</span></div>
                          <div className="flex justify-between"><span>Canal:</span> <span className="text-slate-305 truncate max-w-[90px]">{rec.channel}</span></div>
                        </div>
                        <button
                          onClick={() => {
                            const newCampaignItem = {
                              id: "cam-" + Date.now() + i,
                              name: rec.name.replace(/^[^\w]*/, ""), // strip icons
                              channel: rec.channel,
                              budget: rec.budget,
                              targetCac: rec.targetCac,
                              status: "Ativa" as const,
                              date: new Date().toISOString().split("T")[0]
                            };
                            setMktCampaigns(prev => [newCampaignItem, ...prev]);
                            try { sound.playSuccess(); } catch(e) {}
                            showToast(`Campanha '${rec.name}' de Alavancagem de Receita ativada e adicionada à escala!`, "success");
                          }}
                          className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 text-[8.5px] py-1 rounded font-black uppercase tracking-widest cursor-pointer transition-colors text-center"
                        >
                          🪄 Ativar Campanha
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Form and Campaign list side-by-side on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Form column (4 cols on lg) */}
                <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase text-orange-500 font-sans tracking-wide block">
                      🚀 Lançar Novo Plano Comercial
                    </span>

                    <div className="space-y-1">
                      <label className="text-[9.5px] text-slate-400 font-bold uppercase block">Nome da Campanha:</label>
                      <input 
                        type="text"
                        placeholder="Ex: Novo Lançamento de Inverno"
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-100 placeholder-slate-600 focus:border-orange-500 outline-none font-sans font-bold"
                        value={newCamName}
                        onChange={(e) => setNewCamName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block">Canal ou Mídia:</label>
                        <select 
                          className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:border-orange-500 outline-none font-sans cursor-pointer font-bold"
                          value={newCamChannel}
                          onChange={(e) => setNewCamChannel(e.target.value)}
                        >
                          <option value="Meta Ads (Instagram)">Instagram / Facebook</option>
                          <option value="Google Ads">Google Busca (SEM)</option>
                          <option value="TikTok Ads">TikTok Ads</option>
                          <option value="YouTube Video Ads">YouTube Ads</option>
                          <option value="E-mail & WhatsApp">E-mail / WhatsApp</option>
                          <option value="Influenciadores / Parcerias">Parceria c/ Creator</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block">Status Inicial:</label>
                        <select 
                          className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:border-orange-500 outline-none font-sans cursor-pointer font-bold"
                          value={newCamStatus}
                          onChange={(e: any) => setNewCamStatus(e.target.value)}
                        >
                          <option value="Planejada">💻 Planejada</option>
                          <option value="Ativa">🟢 Ativa</option>
                          <option value="Pausada">🟡 Pausada</option>
                          <option value="Concluída">🔵 Concluída</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block">Orçamento (R$):</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-100 placeholder-slate-600 focus:border-orange-500 outline-none font-mono"
                          value={newCamBudget === 0 ? "" : newCamBudget}
                          onChange={(e) => setNewCamBudget(Number(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase block">CAC Alvo Máx (R$):</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-100 placeholder-slate-600 focus:border-orange-500 outline-none font-mono"
                          value={newCamTargetCac === 0 ? "" : newCamTargetCac}
                          onChange={(e) => setNewCamTargetCac(Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddCampaign}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-[#101214] bg-orange-500 hover:bg-orange-400 rounded-lg transition-transform active:scale-95 cursor-pointer font-sans text-center flex items-center justify-center gap-1 shrink-0"
                  >
                    <Plus size={13} className="stroke-[3]" /> Adicionar à Escala Operacional
                  </button>
                </div>

                {/* List column (7 cols on lg) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
                    {mktCampaigns.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 text-center">
                        <Megaphone size={28} className="text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400">Nenhuma campanha registrada no tracejo.</p>
                      </div>
                    ) : (
                      mktCampaigns.map((cam) => {
                        let statusColor = "bg-slate-950 text-slate-400 border-slate-800";
                        if (cam.status === "Ativa") statusColor = "bg-emerald-950 text-emerald-400 border-emerald-900/40";
                        if (cam.status === "Pausada") statusColor = "bg-amber-950 text-amber-400 border-amber-900/40";
                        if (cam.status === "Concluída") statusColor = "bg-teal-950 text-teal-400 border-teal-900/40";

                        const roasEst = (realTicketMedio / (cam.targetCac || 1)).toFixed(1);

                        // Actual values descompressions
                        const actInv = cam.actualInvestment || 0;
                        const actRet = cam.actualReturn || 0;
                        const actSalesCount = cam.salesCount || 0;
                        const hasExecuted = actInv > 0;
                        const actRoi = actInv > 0 ? ((actRet - actInv) / actInv) * 100 : 0;
                        const isEditing = editingCampaignId === cam.id;

                        return (
                          <div key={cam.id} className="p-4 bg-slate-950 rounded-xl border border-slate-850 hover:border-slate-800 transition-all flex flex-col gap-4 text-left">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className={cn("px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider border", statusColor)}>
                                    {cam.status}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                                    {cam.date}
                                  </span>
                                  {hasExecuted && (
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded text-[8.5px] font-black font-mono border",
                                      actRoi >= 0 
                                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" 
                                        : "bg-rose-950/40 text-rose-400 border-rose-500/20"
                                    )}>
                                      ROI: {actRoi >= 0 ? "+" : ""}{actRoi.toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-[11.5px] font-extrabold text-white leading-snug">{cam.name}</h5>
                                <p className="text-[10.1px] text-slate-400 font-medium flex items-center gap-1.5 flex-wrap">
                                  <span>Canal: <strong className="text-slate-300">{cam.channel}</strong></span>
                                  <span className="opacity-40">•</span>
                                  <span>Orçamento Planejado: <strong className="text-slate-350">{formatCurrency(cam.budget)}</strong></span>
                                </p>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-2 sm:pt-0 border-slate-900 shrink-0">
                                <div className="text-left sm:text-right font-sans">
                                  <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider text-slate-500">CAC Alvo</div>
                                  <div className="text-[11px] font-black font-mono text-white leading-none mt-0.5">{formatCurrency(cam.targetCac)}</div>
                                  <span className="text-[8px] text-emerald-500 font-bold block mt-1">~{roasEst}x ROAS Potencial</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (isEditing) {
                                        setEditingCampaignId(null);
                                      } else {
                                        setEditingCampaignId(cam.id);
                                        setEditActualInvestment(actInv);
                                        setEditActualReturn(actRet);
                                        setEditSalesCount(actSalesCount);
                                      }
                                      try { sound.playClick(); } catch(e) {}
                                    }}
                                    className={cn(
                                      "p-2 rounded-lg border text-xs cursor-pointer transition-all active:scale-95 text-[10px] font-black uppercase font-sans flex items-center gap-1",
                                      isEditing 
                                        ? "bg-white/10 border-white/15 text-white" 
                                        : "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 text-orange-400"
                                    )}
                                    title="Definir valores reais de custo/retorno"
                                  >
                                    {isEditing ? "Fechar" : "Ajustar Execução"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCampaign(cam.id)}
                                    className="bg-rose-950/20 hover:bg-rose-950/60 p-2 rounded-lg border border-rose-500/10 text-rose-400 cursor-pointer transition-all active:scale-95 shrink-0"
                                    title="Excluir campanha"
                                  >
                                    <Trash2 size={12} className="stroke-[2.5]" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Inline Execution Metrics Fields */}
                            {isEditing ? (
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                                <span className="text-[9px] font-black text-orange-500 uppercase font-sans tracking-wider block">
                                  📊 Registrar Resultados Reais Executados (Monitoramento)
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div className="space-y-1">
                                    <label className="text-[8.5px] text-slate-400 font-bold uppercase block">Investimento Real (R$)</label>
                                    <input 
                                      type="number" 
                                      className="w-full bg-slate-950 border border-slate-800 text-[11px] rounded p-1.5 text-white font-mono outline-none focus:border-orange-500"
                                      value={editActualInvestment === 0 ? "" : editActualInvestment}
                                      onChange={(e) => setEditActualInvestment(Number(e.target.value) || 0)}
                                      placeholder="Ex: 3200"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8.5px] text-slate-400 font-bold uppercase block">Retorno Real (R$)</label>
                                    <input 
                                      type="number" 
                                      className="w-full bg-slate-940 bg-slate-950 border border-slate-800 text-[11px] rounded p-1.5 text-white font-mono outline-none focus:border-orange-500"
                                      value={editActualReturn === 0 ? "" : editActualReturn}
                                      onChange={(e) => setEditActualReturn(Number(e.target.value) || 0)}
                                      placeholder="Ex: 14500"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8.5px] text-slate-400 font-bold uppercase block">Vendas Geradas (Qtd)</label>
                                    <input 
                                      type="number" 
                                      className="w-full bg-slate-955 bg-slate-950 border border-slate-800 text-[11px] rounded p-1.5 text-white font-mono outline-none focus:border-orange-500"
                                      value={editSalesCount === 0 ? "" : editSalesCount}
                                      onChange={(e) => setEditSalesCount(Number(e.target.value) || 0)}
                                      placeholder="Ex: 82"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                                  <button
                                    onClick={() => setEditingCampaignId(null)}
                                    className="px-2.5 py-1 text-[9px] font-black uppercase text-slate-400 hover:text-white"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleUpdateCampaignPerformance(cam.id, editActualInvestment, editActualReturn, editSalesCount)}
                                    className="px-3 py-1 bg-orange-555 bg-orange-500 hover:bg-orange-400 text-slate-950 text-[9px] font-black uppercase rounded shadow transition-all active:scale-[0.98]"
                                  >
                                    Salvar Resultados
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Visual performance overview if executed */
                              hasExecuted && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-slate-900/40 border border-slate-900 rounded-lg text-xs leading-snug font-mono">
                                  <div>
                                    <span className="text-[7.5px] uppercase font-bold text-slate-500 block font-sans">Investido Real</span>
                                    <span className="text-orange-400 font-bold text-[10.5px]">{formatCurrency(actInv)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[7.5px] uppercase font-bold text-slate-500 block font-sans">Faturamento Gerado</span>
                                    <span className="text-emerald-400 font-bold text-[10.5px]">{formatCurrency(actRet)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[7.5px] uppercase font-bold text-slate-500 block font-sans">Eficiência Real (ROAS)</span>
                                    <span className="text-blue-400 font-black text-[10.5px]">{(actRet / actInv).toFixed(1)}x roas</span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3 bg-orange-950/25 border border-orange-500/15 rounded-xl flex items-start gap-2.5">
                    <Target size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9.5px] font-extrabold text-orange-400 uppercase tracking-widest leading-none block">Dica Profissional de Investimento</span>
                      <p className="text-[10.5px] text-slate-300 mt-1 leading-relaxed">
                        Nacionais mostram que o investimento de mídia não deve ultrapassar <strong>12% da margem líquida média</strong> projetada para não canibalizar a folga de estoque e despesas administrativas. Redobre a otimização de seu tráfego pago na data de pico.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 🎬 ESTÚDIO E IMPORTADOR DE VÍDEO ADS - MAX PERFORMANCE */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 md:p-6 space-y-6 relative z-10 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-orange-400 uppercase flex items-center gap-1.5 font-sans">
                    <Play size={14} className="text-orange-500" /> Estúdio & Importador de Vídeo Ads (Max Performance)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Importe seu arquivo local <code className="text-orange-300">max_performance_video_ad.html</code> ou pré-visualize nossa peça padrão de altíssima conversão diretamente no simulador móvel.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                    uploadedAdHtml 
                      ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/20" 
                      : "bg-slate-950 text-orange-450/80 border-orange-500/10"
                  )}>
                    {uploadedAdHtml ? "Anúncio Personalizado Ativo" : "Template Padrão Ativo"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* COLUNA ESQUERDA: CONTROLES, UPLOAD & INTEGRADOR (5 COLS) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    {/* DROPZONE AREA */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingAdFile(true);
                      }}
                      onDragLeave={() => setIsDraggingAdFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingAdFile(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const text = evt.target?.result as string;
                              setUploadedAdHtml(text);
                              localStorage.setItem("uploaded_max_performance_ad_html", text);
                              showToast("Vídeo Ad integrado com sucesso!", "success");
                              sound.playSuccess();
                            };
                            reader.readAsText(file);
                          } else {
                            showToast("Por favor, solte um arquivo .html válido.", "error");
                          }
                        }
                      }}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3",
                        isDraggingAdFile 
                          ? "border-orange-500 bg-orange-500/10" 
                          : "border-slate-800 hover:border-orange-500/30 hover:bg-orange-500/[0.02]"
                      )}
                      onClick={() => {
                        const fileInput = document.getElementById("ad-html-file-upload") as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      }}
                    >
                      <input
                        type="file"
                        id="ad-html-file-upload"
                        accept=".html,.htm"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const text = evt.target?.result as string;
                              setUploadedAdHtml(text);
                              localStorage.setItem("uploaded_max_performance_ad_html", text);
                              showToast("Vídeo Ad carregado com sucesso!", "success");
                              sound.playSuccess();
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                      <div className="p-3 bg-slate-950 rounded-full border border-slate-800">
                        <Code size={20} className="text-orange-500" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-extrabold text-slate-200 block uppercase tracking-wide">
                          Importar max_performance_video_ad.html
                        </span>
                        <p className="text-[9.5px] text-slate-500 leading-relaxed max-w-[240px] mx-auto">
                          Arraste seu arquivo baixado aqui ou clique para selecionar do computador. O sistema irá carregar e rodar localmente no simulador.
                        </p>
                      </div>
                    </div>

                    {/* DYNAMIC METRICS SIMULATOR WEIGHTS */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 text-left">
                      <span className="text-[9px] bg-slate-900 text-orange-400 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-slate-800 inline-block">
                        Calibrador de Performance do Ad
                      </span>

                      <div className="space-y-3">
                        {/* Budget */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                            <span>Verba Alocada:</span>
                            <span className="text-white">{formatCurrency(adSimBudget)}</span>
                          </div>
                          <input
                            type="range"
                            min="500"
                            max="50000"
                            step="500"
                            value={adSimBudget}
                            onChange={(e) => setAdSimBudget(Number(e.target.value))}
                            className="w-full accent-orange-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                          />
                        </div>

                        {/* CTR */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                            <span>Taxa de Cliques (CTR):</span>
                            <span className="text-orange-400">{adSimCtr.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="6.0"
                            step="0.1"
                            value={adSimCtr}
                            onChange={(e) => setAdSimCtr(Number(e.target.value))}
                            className="w-full accent-orange-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                          />
                        </div>

                        {/* Conversion Rate */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                            <span>Conversão do Funil (CV):</span>
                            <span className="text-orange-400">{adSimCv.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="8.0"
                            step="0.1"
                            value={adSimCv}
                            onChange={(e) => setAdSimCv(Number(e.target.value))}
                            className="w-full accent-orange-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {uploadedAdHtml && (
                    <button
                      onClick={() => {
                        setUploadedAdHtml("");
                        localStorage.removeItem("uploaded_max_performance_ad_html");
                        showToast("Template padrão restaurado.", "info");
                        sound.playClick();
                      }}
                      className="w-full py-2.5 border border-dashed border-rose-500/20 text-rose-400 bg-rose-950/20 hover:bg-rose-950/35 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer font-sans"
                    >
                      Remover HTML e Restaurar Padrão
                    </button>
                  )}
                </div>

                {/* COLUNA DIREITA: PREVIEW DEVICE E ANALYTICS (7 COLS) */}
                <div className="lg:col-span-7 flex flex-col md:flex-row items-stretch gap-4">
                  {/* PREVIEW FRAME DEVICE */}
                  <div className="flex-grow flex flex-col items-center justify-between space-y-4">
                    {/* Viewport Size Controls */}
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850 w-full justify-between">
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase pl-2">Viewport:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAdViewportSize("mobile")}
                          className={cn(
                            "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                            adViewportSize === "mobile" ? "bg-orange-500 text-slate-950" : "text-slate-400 hover:text-white"
                          )}
                        >
                          📱 Celular
                        </button>
                        <button
                          onClick={() => setAdViewportSize("tablet")}
                          className={cn(
                            "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                            adViewportSize === "tablet" ? "bg-orange-500 text-slate-950" : "text-slate-400 hover:text-white"
                          )}
                        >
                          📐 Tablet
                        </button>
                        <button
                          onClick={() => setAdViewportSize("desktop")}
                          className={cn(
                            "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                            adViewportSize === "desktop" ? "bg-orange-500 text-slate-950" : "text-slate-400 hover:text-white"
                          )}
                        >
                          💻 Desktop
                        </button>
                      </div>
                    </div>

                    {/* Smartphone or Device Frame Mockup */}
                    <div className="w-full flex justify-center items-center bg-slate-950/45 border border-slate-850 rounded-2xl p-4 min-h-[440px] flex-grow relative overflow-hidden">
                      <div
                        className="transition-all duration-500 ease-out border border-slate-800 bg-slate-950 rounded-3xl relative overflow-hidden flex flex-col shadow-2xl"
                        style={{
                          width: adViewportSize === "mobile" ? "280px" : adViewportSize === "tablet" ? "420px" : "100%",
                          height: adViewportSize === "desktop" ? "380px" : "420px",
                          maxWidth: "100%"
                        }}
                      >
                        {/* Device Top Bar decoration */}
                        <div className="absolute top-0 left-0 w-full h-4 bg-slate-950 flex items-center justify-center z-20 border-b border-slate-900">
                          <div className="w-16 h-2.5 bg-slate-900 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-950 rounded-full" />
                          </div>
                        </div>

                        {/* RENDER VIEWPORT */}
                        <div className="flex-grow pt-4 h-full relative z-10">
                          <iframe
                            srcDoc={uploadedAdHtml || DEFAULT_AD_TEMPLATE}
                            title="Max Performance Video Ad Simulator Preview"
                            sandbox="allow-scripts allow-same-origin"
                            className="w-full h-full border-none rounded-b-2xl bg-slate-950"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SIMULATED METRICS DASHBOARD FOR THIS AD */}
                  <div className="w-full md:w-56 bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between space-y-4 text-left">
                    <div className="space-y-4">
                      <div className="border-b border-slate-900 pb-2">
                        <span className="text-[8px] text-orange-400 uppercase font-black font-sans block">Resultado Projetado</span>
                        <h5 className="text-[11px] font-black text-white uppercase tracking-wider font-sans">Métricas Calculadas</h5>
                      </div>

                      {/* Views */}
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-500 uppercase font-bold block">Visualizações Estimadas</span>
                        <span className="text-sm font-black text-slate-200 font-mono">
                          {Math.round((adSimBudget / adSimCpm) * 1000).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[7.5px] text-slate-500 block font-mono">Custo p/ Mil: {formatCurrency(adSimCpm)}</span>
                      </div>

                      {/* Clicks */}
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-500 uppercase font-bold block">Cliques Únicos</span>
                        <span className="text-sm font-black text-orange-400 font-mono">
                          {Math.round(((adSimBudget / adSimCpm) * 1000) * (adSimCtr / 100)).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[7.5px] text-slate-500 block font-mono">CTR Alvo: {adSimCtr}%</span>
                      </div>

                      {/* Conversions */}
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-emerald-400 uppercase font-bold block">Vendas Convertidas</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {Math.max(1, Math.round(((adSimBudget / adSimCpm) * 1000 * (adSimCtr / 100)) * (adSimCv / 100))).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[7.5px] text-slate-500 block font-mono">Média: {adSimCv}%</span>
                      </div>

                      {/* Real CAC */}
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-500 uppercase font-bold block">Custo de Aquisição (CAC)</span>
                        <span className="text-sm font-black text-white font-mono">
                          {formatCurrency(adSimBudget / Math.max(1, ((adSimBudget / adSimCpm) * 1000 * (adSimCtr / 100)) * (adSimCv / 100)))}
                        </span>
                        <span className="text-[7.5px] text-slate-500 block font-mono">Foco de mídia calibrado</span>
                      </div>

                      {/* Simulated ROAS */}
                      <div className="space-y-0.5 border-t border-slate-900 pt-3">
                        <span className="text-[8px] text-blue-400 uppercase font-black block">ROAS Projetado</span>
                        <span className="text-md font-black text-blue-400 font-mono block mt-1">
                          {(((Math.max(1, ((adSimBudget / adSimCpm) * 1000 * (adSimCtr / 100)) * (adSimCv / 100))) * (realTicketMedio || 110)) / adSimBudget).toFixed(1)}x
                        </span>
                        <span className="text-[7.5px] text-slate-500 block font-mono">Sobre Ticket de {formatCurrency(realTicketMedio || 110)}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-orange-950/20 border border-orange-500/10 rounded-lg text-[9px] text-slate-400 leading-relaxed font-sans">
                      💡 Ajuste os calibradores de CTR e CV para simular canais de anúncio mais qualificados.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DAFNE CUSTOM TACTICAL BRIEFING GENERATOR WITH CONTROLS */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 md:p-6 space-y-4 relative z-10 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-orange-400 uppercase flex items-center gap-1 font-sans">
                    <Sparkles size={13} className="text-orange-500 animate-spin" style={{ animationDuration: "8s" }} /> Dafne Inteligência de Briefing & Plano de Tráfego 🤖
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans">Apoie seu planejamento gerando um briefing corporativo estruturado com ganchos promocionais, canais e metas táticas.</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={briefCamType} 
                    onChange={(e) => setBriefCamType(e.target.value)}
                    className="bg-slate-950 border text-[10px] border-slate-800 rounded-lg p-1.5 font-bold uppercase cursor-pointer text-orange-450 focus:border-orange-500 outline-none text-orange-400"
                  >
                    <option value="Atração de Novos Clientes (Estímulo de Demanda)">Atração de Clientes</option>
                    <option value="Maximização de Ticket Médio por Venda">Aumento de Ticket Médio</option>
                    <option value="Lançamento e Posicionamento de Novo Produto">Lançamento de Produto</option>
                    <option value="Ações de Remarketing & Redução de Churn">Fidelizar / Reduzir Churn</option>
                  </select>

                  <select 
                    value={briefAudience} 
                    onChange={(e) => setBriefAudience(e.target.value)}
                    className="bg-slate-950 border text-[10px] border-slate-800 rounded-lg p-1.5 font-bold uppercase cursor-pointer text-orange-450 focus:border-orange-500 outline-none text-orange-400"
                  >
                    <option value="Decisores PJ / Donos de Empresa / Gerentes Financeiros">Audiência B2B / Executivos</option>
                    <option value="Consumidores Finais de Classe A/B com Alto Poder Aquisitivo">Público Alta Renda / Consumidor</option>
                    <option value="Jovens Profissionais, Freelancers e Empreendedores Digitais">Profissionais Liberais / Autônomos</option>
                    <option value="Clientes Inativos ou Críticos em Busca de Recuperação">Clientes Antigos Inativos</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col xl:flex-row items-stretch gap-4">
                
                <div className="xl:w-1/3 flex flex-col justify-between">
                  <p className="text-[11.5px] text-slate-350 leading-relaxed font-sans">
                    Nossa assessoria inteligente irá ler em tempo real seu segmento operacional (<strong className="text-white capitalize">{selectedSegment === "commerce" ? "Varejo & E-commerce" : selectedSegment === "food" ? "Alimentação & Gastronomia" : selectedSegment === "tech" ? "Tecnologia / SaaS" : "Serviços & Parcerias"}</strong>) e configurar o plano ideal.
                  </p>
                  
                  <button
                    onClick={handleGenerateMarketingBrief}
                    disabled={isBriefGenerating}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-slate-950 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 font-sans shadow-lg shadow-orange-500/10 active:scale-95 mt-4"
                  >
                    <Sparkles size={11} className={cn(isBriefGenerating && "animate-spin text-slate-950")} />
                    {isBriefGenerating ? "Computando Plano Tático..." : "Gerar Briefing Inteligente"}
                  </button>
                </div>

                <div className="flex-1 min-h-[160px] bg-slate-950 text-orange-100 rounded-xl p-4 text-xs font-mono text-left relative overflow-hidden select-text border border-slate-800">
                  <div className="absolute top-1 right-2 text-[8px] uppercase tracking-widest text-orange-450 font-bold select-none opacity-40">gabinete tático</div>
                  {isBriefGenerating ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 gap-2">
                      <div className="h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[9px] text-orange-400 uppercase animate-pulse font-bold tracking-wider font-sans text-center">
                        Dafne está mapeando canais e estruturando copy...
                      </p>
                    </div>
                  ) : briefGeneratedText ? (
                    <div className="whitespace-pre-wrap max-h-[250px] overflow-y-auto leading-relaxed scrollbar-thin text-[11px] text-slate-205">
                      {briefGeneratedText}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-slate-500 text-center uppercase text-[10px] font-bold font-sans">
                      <span className="text-orange-500/70 block">Clique ao lado para gerar o briefing complementar da sua verba.</span>
                      <span className="text-[9px] text-[#f97316]/50 mt-1 block">Traceje canais táticos com base nas premissas monetárias</span>
                    </div>
                  )}
                </div>

              </div>
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
                  )}                </div>
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
                    <option value="auditoria_plena_pfa">Auditoria fiscal plena Max Performance Business PFA</option>
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
                      {/* SEGMENT SPECIFIC INDICATORS GRID */}
            {selectedSegment === "commerce" && (() => {
              const avgProdMarkup = products.length > 0
                ? (products.reduce((acc, p) => acc + (p.sellingPrice / (p.costPrice || 1)), 0) / products.length)
                : 1.78;
              const markupBadge = avgProdMarkup >= 1.8 
                ? { text: "🟢 Saudável (Ideal > 1.8x)", bg: "bg-emerald-50 text-emerald-700" }
                : { text: "🔴 Crítico (Reajuste Recomendado)", bg: "bg-rose-50 text-rose-750 animate-pulse font-bold" };

              const stockBadge = stockTurnoverSlider >= 5 && stockTurnoverSlider <= 8
                ? { text: "🟢 Ideal (5x a 8x)", bg: "bg-emerald-50 text-emerald-700" }
                : stockTurnoverSlider < 5
                ? { text: "🟡 Lento (Risco de Margem)", bg: "bg-amber-50 text-amber-700" }
                : { text: "🔴 Acelerado (Risco de Ruptura)", bg: "bg-rose-50 text-rose-750 animate-pulse font-bold" };

              const ticketBadge = realTicketMedio >= 80
                ? { text: "🟢 Saudável (≥ R$ 80)", bg: "bg-emerald-50 text-emerald-700" }
                : { text: "🟡 Sob Pressão (< R$ 80)", bg: "bg-amber-50 text-amber-700" };

              const cacRatio = (realTicketMedio / (cacSlider || 1));
              const cacBadge = cacRatio >= 3.0
                ? { text: `🟢 Saudável (LTV/CAC: ${cacRatio.toFixed(1)}x)`, bg: "bg-[#eafef7] text-emerald-850" }
                : cacRatio >= 1.5
                ? { text: `🟡 Alerta (LTV/CAC: ${cacRatio.toFixed(1)}x)`, bg: "bg-amber-50 text-amber-700" }
                : { text: `🔴 Crítico (LTV/CAC: ${cacRatio.toFixed(1)}x)`, bg: "bg-rose-50 text-rose-750 animate-pulse font-bold" };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Markup Médio Geral (Produtos)</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", markupBadge.bg)}>{markupBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{avgProdMarkup.toFixed(2)}x</span>
                        <span className="text-xs text-gray-500 font-medium">Multiplicador sobre custo direto</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 leading-relaxed font-sans">
                      Você possui <strong>{products.length} produtos cadastrados</strong>. A precificação sólida protege seu caixa de rupturas invisíveis.
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Giro de Estoque Anualizado</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", stockBadge.bg)}>{stockBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{stockTurnoverSlider} vezes/ano</span>
                        <span className="text-xs text-indigo-600 font-bold font-mono">{Math.round(365 / stockTurnoverSlider)} dias de permanência</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>Simular Alavancagem Giro:</span>
                          <span className="font-mono text-indigo-650">{stockTurnoverSlider}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="3" 
                          max="12" 
                          value={stockTurnoverSlider} 
                          onChange={(e) => setStockTurnoverSlider(Number(e.target.value))} 
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Ticket Médio das Transações</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", ticketBadge.bg)}>{ticketBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(realTicketMedio)}</span>
                        <span className="text-xs text-gray-500 font-medium">por venda real</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>Ajustar Simulação de Ticket Médio:</span>
                          <span className="font-mono text-indigo-650">{formatCurrency(avgTicketSlider)}</span>
                        </div>
                        <input 
                          type="range" 
                          min="40" 
                          max="180" 
                          value={avgTicketSlider} 
                          onChange={(e) => setAvgTicketSlider(Number(e.target.value))} 
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Custo de Aquisição de Cliente (CAC)</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", cacBadge.bg)}>{cacBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(cacSlider)}</span>
                        <span className="text-xs text-slate-500">Razão LTV/CAC: {cacRatio.toFixed(1)}x</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>Simular Categoria Marketing (CAC):</span>
                          <span className="font-mono text-indigo-650">{formatCurrency(cacSlider)}</span>
                        </div>
                        <input 
                          type="range" 
                          min="15" 
                          max="100" 
                          value={cacSlider} 
                          onChange={(e) => setCacSlider(Number(e.target.value))} 
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedSegment === "food" && (() => {
              const cmvBadge = realCmvPct <= 35 && realCmvPct >= 28
                ? { text: "🟢 Perfeito (28% a 35%)", bg: "bg-emerald-50 text-emerald-700" }
                : realCmvPct < 28
                ? { text: "🟢 Excelente (Ultra Margem)", bg: "bg-teal-50 text-teal-700 font-bold" }
                : { text: "🔴 CMV Crítico: Reduzir Insumos", bg: "bg-rose-50 text-rose-750 animate-pulse font-bold" };

              const wasteBadge = foodWastePct <= 5
                ? { text: "🟢 Ótimo (≤ 5%)", bg: "bg-emerald-50 text-emerald-700" }
                : { text: "🔴 Perigoso (> 5%)", bg: "bg-rose-50 text-rose-750 animate-pulse font-bold" };

              const valDesk = (seatCount * tableTurnover * avgCoverSpend) / 3;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">CMV Total Real (Balanço de Caixa)</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", cmvBadge.bg)}>{cmvBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{realCmvPct.toFixed(1)}%</span>
                        <span className="text-xs text-gray-500 font-medium">do faturamento total</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 leading-relaxed font-sans">
                      {realCmvPct > 36 
                        ? "⚠️ Alerta de CMV alto! Seu custo de alimentos está corroendo o caixa operacional básico." 
                        : "✅ CMV dentro dos padrões recomendados para manter a integridade econômica da empresa."}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Índice Estimado de Desperdício</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", wasteBadge.bg)}>{wasteBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{foodWastePct}%</span>
                        <span className="text-xs text-rose-500 font-bold font-mono">Dispersão: {formatCurrency(totalSales * (foodWastePct / 100))}</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>Simular Desperdício Cozinha:</span>
                          <span className="font-mono text-indigo-650">{foodWastePct}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="2.0" 
                          max="18.0" 
                          step="0.5"
                          value={foodWastePct} 
                          onChange={(e) => setFoodWastePct(Number(e.target.value))} 
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Faturamento Diário por Cadeira</span>
                        <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Simulado físico</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(valDesk)}</span>
                        <span className="text-xs text-slate-500">giro de salão</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[9px] text-gray-400 font-bold">
                        <div>
                          <span>Nº Assentos:</span>
                          <input 
                            type="number"
                            value={seatCount}
                            onChange={(e) => setSeatCount(Math.max(10, Number(e.target.value)))}
                            className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-center font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <span>Ticket Consumo (R$):</span>
                          <input 
                            type="number"
                            value={avgCoverSpend}
                            onChange={(e) => setAvgCoverSpend(Math.max(10, Number(e.target.value)))}
                            className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-center font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Giro de Mesas Recomendado</span>
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Meta: &gt; 3.0x</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{tableTurnover.toFixed(1)}x por dia</span>
                        <span className="text-xs text-indigo-650 font-bold">Saudável</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>Ajustar Giro de Mesas:</span>
                          <span className="font-mono text-indigo-650">{tableTurnover.toFixed(1)}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="1.0" 
                          max="6.0" 
                          step="0.1"
                          value={tableTurnover} 
                          onChange={(e) => setTableTurnover(Number(e.target.value))} 
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedSegment === "services" && (() => {
              const hourlyRateBadge = hourlyRate >= 150
                ? { text: "🟢 Saudável (≥ R$ 150)", bg: "bg-emerald-50 text-emerald-700" }
                : { text: "🟡 Subvalorizado (< R$ 150)", bg: "bg-amber-50 text-amber-700" };

              const utilBadge = utilizationRate >= 70
                ? { text: "🟢 Produtivo (≥ 70%)", bg: "bg-emerald-50 text-emerald-700" }
                : { text: "🔴 Ociosidade (Baixa Ocupação)", bg: "bg-rose-50 text-rose-750 animate-pulse font-bold" };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Valor Médio da Hora Prestada</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", hourlyRateBadge.bg)}>{hourlyRateBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(hourlyRate)}</span>
                        <span className="text-xs text-gray-500 font-medium">por hora produtiva livre</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>Simular Preço da Hora (R$):</span>
                          <span className="font-mono text-indigo-650">{formatCurrency(hourlyRate)}</span>
                        </div>
                        <input 
                          type="range" 
                          min="80" 
                          max="350" 
                          step="5"
                          value={hourlyRate} 
                          onChange={(e) => setHourlyRate(Number(e.target.value))} 
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Taxa de Utilização de Horas</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", utilBadge.bg)}>{utilBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{utilizationRate}%</span>
                        <span className="text-xs text-indigo-600 font-bold font-mono">{billableHours}h faturadas</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>Simular Tempo de Alocação:</span>
                          <span className="font-mono text-indigo-650">{utilizationRate}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="40" 
                          max="100" 
                          value={utilizationRate} 
                          onChange={(e) => setUtilizationRate(Number(e.target.value))} 
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Custo de Retrabalho Mensalizado</span>
                        <span className="bg-slate-105 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Alvo: &lt; 5%</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-rose-600">8.2%</span>
                        <span className="text-xs text-gray-500 font-medium font-mono">13h refazendo tarefas</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 leading-relaxed font-sans">
                      Equivale a perder cerca de <strong>13 horas/mês</strong> refazendo partes não alinhadas no briefing inicial com clientes.
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Receita de Contrato Fixo (Retainers)</span>
                        <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Recorrença PJ</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">45.0%</span>
                        <span className="text-xs text-emerald-600 font-bold">Excelente previsibilidade</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 leading-relaxed font-sans">
                      Excelente previsão estável. Idealmente de 60% a 70% do caixa fixo deve provir de taxas mensais programadas de contratos longos.
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedSegment === "tech" && (() => {
              const mrrBadge = mrrBase >= 40000
                ? { text: "🟢 Crescimento SaaS Elegante", bg: "bg-emerald-50 text-emerald-700" }
                : { text: "🟡 Consolidação de Base", bg: "bg-amber-50 text-amber-700" };

              const churnBadge = churnRate <= 4
                ? { text: "🟢 Churn Sob Controle (< 4%)", bg: "bg-emerald-50 text-emerald-700" }
                : { text: "🔴 Evasão Elevada (Churn Crítico)", bg: "bg-rose-50 text-rose-750 animate-pulse font-bold" };

              const currentLtvCac = ((arpuTech * (100 / (churnRate || 1))) / (cacTech || 1));
              const ltvCacBadge = currentLtvCac >= 3.0
                ? { text: `🟢 LTV/CAC Saudável (${currentLtvCac.toFixed(1)}x)`, bg: "bg-[#eafef7] text-emerald-850" }
                : { text: `🟡 Atenção (${currentLtvCac.toFixed(1)}x)`, bg: "bg-amber-50 text-amber-700" };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Receita de Assinaturas (MRR)</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", mrrBadge.bg)}>{mrrBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(mrrBase)}</span>
                        <span className="text-xs text-indigo-650 font-bold font-mono">recorrência ativa</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>Simular MRR Contratual:</span>
                          <span className="font-mono text-indigo-650">{formatCurrency(mrrBase)}</span>
                        </div>
                        <input 
                          type="range" 
                          min="10000" 
                          max="90000" 
                          step="1000"
                          value={mrrBase} 
                          onChange={(e) => setMrrBase(Number(e.target.value))} 
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Taxa de Cancelamento Mensal (Churn)</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", churnBadge.bg)}>{churnBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{churnRate}%</span>
                        <span className="text-xs text-indigo-650 font-bold font-mono">LTV: {(100 / (churnRate || 1)).toFixed(1)} meses</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="flex justify-between text-[9px] font-bold text-gray-400">
                          <span>Simular Churn de Assinantes:</span>
                          <span className="font-mono text-indigo-650">{churnRate}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="1.0" 
                          max="12.0" 
                          step="0.1"
                          value={churnRate} 
                          onChange={(e) => setChurnRate(Number(e.target.value))} 
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Índice LTV / CAC Tecnológico</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", ltvCacBadge.bg)}>{ltvCacBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{currentLtvCac.toFixed(2)}x</span>
                        <span className="text-xs text-slate-500 font-mono">Alvo ideal: &gt; 3.0x</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[9px] text-gray-400 font-bold">
                        <div>
                          <span>ARPU Mensal (R$):</span>
                          <input 
                            type="number"
                            value={arpuTech}
                            onChange={(e) => setArpuTech(Math.max(10, Number(e.target.value)))}
                            className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-center font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <span>CAC Técnico (R$):</span>
                          <input 
                            type="number"
                            value={cacTech}
                            onChange={(e) => setCacTech(Math.max(10, Number(e.target.value)))}
                            className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-center font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Custos Cloud & Redes</span>
                        <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">OPEX Infra</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">12.5%</span>
                        <span className="text-xs text-teal-600 font-bold">Altamente Eficiente</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 leading-relaxed font-sans">
                      Seus gastos com servidores, APIs e infraestrutura de rede na nuvem estão equilibrados em relação ao volume faturado.
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedSegment === "other" && (() => {
              const breakeven = totalSales > 0 ? (totalOpex / (1 - (totalCogs / (totalSales || 1) || 0.35))) : 0;
              const breakBadge = totalSales >= breakeven && totalSales > 0
                ? { text: "🟢 Saudável (No Azul)", bg: "bg-emerald-50 text-emerald-700" }
                : { text: "🔴 Alerta: Sem Movimentações", bg: "bg-red-50 text-red-650" };

              const ebitdaVal = totalSales > 0 ? (((totalSales - totalCogs - totalOpex) / totalSales) * 100) : 0;
              const ebitdaBadge = ebitdaVal >= 20
                ? { text: "🟢 Margem Robusta (≥ 20%)", bg: "bg-emerald-50 text-emerald-700" }
                : ebitdaVal >= 10
                ? { text: "🟡 Margem Estável (10-20%)", bg: "bg-amber-50 text-amber-700" }
                : { text: "🔴 Margem Inadequada (< 10%)", bg: "bg-red-50 text-red-650" };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Ponto de Equilíbrio Real</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", breakBadge.bg)}>{breakBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(breakeven)}</span>
                        <span className="text-xs text-gray-500 font-medium">por mês</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 leading-relaxed font-sans">
                      Faturamento mínimo necessário para pagar todas as contas fixas e custos diretos sem acumular prejuízos comerciais ou taxas extras.
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Margem EBITDA Geral</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono", ebitdaBadge.bg)}>{ebitdaBadge.text}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{ebitdaVal.toFixed(1)}%</span>
                        <span className="text-xs text-indigo-650 font-bold">Retorno operacional bruto</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 leading-relaxed font-sans">
                      Retorno operacional líquido sobre as vendas brutas deduzidas de custos de produção e despesas fixas da equipe.
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Prazo Médio de Caixa Operacional</span>
                        <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Dias Limite</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">45 dias</span>
                        <span className="text-xs text-gray-500 font-medium">cobertura com caixa ativo</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 leading-relaxed font-sans">
                      Mapeia o fôlego financeiro caso ocorra uma perda abrupta de 100% de novos pedidos no mês atual.
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Liquidez Corrente Comercial</span>
                        <span className="bg-slate-100 text-slate-750 text-[9px] px-2 py-0.5 rounded-lg font-bold font-mono">Liquidez PJ</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600">2.14x</span>
                        <span className="text-xs text-emerald-600 font-bold">Robusto</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 leading-relaxed font-sans">
                      Sua capacidade de curto prazo é blindada e excelente. Você possui mais de duas vezes o valor necessário para cobrir contas imediatas.
                    </div>
                  </div>
                </div>
              );
            })()}
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
                  Para prestadoras de serviços em geral e indústrias leves que não se enquadram nos modelos acima, o Max Performance Business aplica o cálculo direto de <strong>Margem de Contribuição Geral</strong> e <strong>Multiplicador de Sobrevivência</strong> para o fluxo de caixa corporativo de sua PJ.
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

      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-orange-500/30 hover:border-orange-500/50 rounded-2xl p-6 space-y-6 relative z-10 text-left transition-all shadow-xl font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-805 pb-4 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] bg-orange-950 text-orange-400 font-mono font-bold px-2 py-0.5 rounded-md border border-orange-500/20 uppercase tracking-widest">
              Aliança de Tecnologia • Indicação B2B
            </span>
            <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
              <UserPlus size={16} className="text-orange-500 animate-pulse" /> Aliança de Fomento Tecnológico & Coinvestimento Coletivo
            </h3>
            <p className="text-xs text-slate-300">
              Indique outros empreendedores e empresas PJ da sua rede. A expansão de nossa comunidade viabiliza maior atração de capital e novos pools de investimentos para <strong className="text-orange-400">fomentar o ecossistema e acelerar o desenvolvimento de novas tecnologias, algoritmos e recursos avançados para o aplicativo</strong>.
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
              Gerar Convite & Fomentar Expansão
            </button>
          </div>

          {/* Status Column list */}
          <div className="flex-1 flex flex-col justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-850 space-y-4">
            {/* Progress panel */}
            <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-300 font-bold uppercase">Progresso de Fomento Tecnológico</span>
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
                    🎉 Engajamento Coletivo Ativo! A tração e expansão de nossa rede garante novos investimentos estratégicos direcionados à evolução da engenharia preditiva da Dafne IA.
                  </p>
                ) : (
                  <p>
                    Como funciona? Faltam <strong className="text-orange-400 font-bold">{4 - invitedFriends.length}</strong> indicações para atingirmos o próximo marco de fomento coletivo. Cada indicação expande a comunidade e a atratividade do app, <strong className="text-emerald-400 font-bold">trazendo mais investimentos de capital de fundos parceiros para acelerar o desenvolvimento de novas tecnologias e inteligência artificial no app</strong>.
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
                      <span className="text-[8px] bg-orange-950 text-orange-400 px-1 py-0.2 rounded font-mono font-normal">Indicação de Fomento</span>
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
                        const inviteText = `Olá, ${friend.name}! Estou utilizando a Dafne I.A. (sistema avançado de gestão financeira e controladoria para PJ) e ela revolucionou nossa análise de DRE, precificação de CMV e controle de fluxo de caixa. Ao unirmos forças e expandirmos nossa rede de parceiros empresariais PJ, geramos mais tração e volume para atrair grandes rodadas de investimento de capital. Todo esse aporte de fomento é direcionado em grande parte ao desenvolvimento de novas tecnologias e algoritmos de inteligência artificial de ponta no app! Se quiser se conectar a este ecossistema inovador, registre-se no link abaixo ou me avise para nosso time de implantação integrado entrar em contato direto com você: ${window.location.origin}?ref=${friend.id}`;
                        navigator.clipboard.writeText(inviteText);
                        showToast(`Convite copiado com sucesso! Agora é só colar no WhatsApp de ${friend.name}.`, "success");
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
        </div> {/* Close col-span-2 layout */}

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
                <div className="pt-2 border-t border-slate-800 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={handleExportSegmentAiReport}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <FileDown size={11} className="animate-bounce" style={{ animationDuration: "2.5s" }} /> Baixar Relatório IA (PDF ABNT)
                  </button>
                  <button
                    onClick={handleAskDafneInsights}
                    disabled={isAiLoading}
                    className="w-full sm:w-auto text-[9px] text-indigo-300 hover:text-white uppercase font-black tracking-widest flex items-center justify-center gap-1 cursor-pointer py-1"
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
          
        </div>
      </div> {/* Close outer grid layout */}

      {/* 🎯 PLANNER DE BENCHMARK & OKRs AUTOMÁTICOS PERSONALIZADOS */}
      <div id="personalized-okrs-hub" className="bg-[#101229] border border-indigo-500/35 rounded-2xl p-6 md:p-8 text-white space-y-6 text-left relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/[0.05] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-orange-500/[0.03] rounded-full blur-3xl pointer-events-none opacity-60" />

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.08] pb-5 gap-4 relative z-10">
          <div className="space-y-1">
            <span className="bg-orange-500/20 border border-orange-400/30 text-orange-400 text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest font-mono inline-flex items-center gap-1">
              <Sparkles size={11} className="animate-spin text-orange-400" /> Metas de Conversão e Caixa PJ
            </span>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              🎯 Gerador e Recomendador de OKRs Automatizados por Segmento
            </h3>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              O Max Performance Business desdobra o seu faturamento de meta em objetivos táticos (Objectives) e resultados-chave (Key Results) cirúrgicos de acordo com o seu nicho.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-900/60 p-3 border border-slate-800 rounded-xl">
            <div className="text-right">
              <p className="text-[9px] text-[#818cf8] uppercase tracking-wider font-extrabold font-mono">Meta de Faturamento Ativa:</p>
              <p className="text-sm font-black font-mono text-emerald-400">
                {profile?.billingGoal ? formatCurrency(profile.billingGoal) : "Sem Meta Definida"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
          {/* Controls Column */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-slate-950/80 p-5 rounded-xl border border-slate-850 space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest block font-mono">
                🎛️ Nível de Rigor Operacional
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Selecione o multiplicador de agressividade do mercado para recalibrar as metas de volumetria e conversão de forma realista:
              </p>

              <div className="space-y-2.5 pt-1">
                {[
                  { value: 0.8, label: "Conservador (80% da Meta)", color: "border-blue-500 text-blue-300 bg-blue-950/15" },
                  { value: 1.0, label: "Nominal (100% da Meta Plano)", color: "border-emerald-500 text-emerald-300 bg-emerald-950/15" },
                  { value: 1.2, label: "Arrojado & Escala (120% Turbinado)", color: "border-orange-500 text-orange-300 bg-orange-950/15" },
                ].map((tier) => (
                  <button
                    key={tier.value}
                    onClick={() => {
                      try { sound.playClick(); } catch(e) {}
                      setOkrTargetMultiplier(tier.value);
                    }}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between",
                      okrTargetMultiplier === tier.value
                        ? `${tier.color} font-black ring-1 ring-white/10 scale-[1.02]`
                        : "border-slate-800 text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span>{tier.label}</span>
                    {okrTargetMultiplier === tier.value && (
                      <span className="text-xs">✔️</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 space-y-4">
              <div className="bg-slate-900/50 p-3 rounded-lg text-[10px] text-slate-400 leading-relaxed border border-slate-850">
                💡 <strong>Alinhamento Síncrono:</strong> Os OKRs ao lado se atualizam dinamicamente com base nas suas simulações nos gráficos acima (Markup, Desperdiço, Turnovers ou Valor Hora).
              </div>

              <button
                onClick={handleExportOkrsToProfile}
                disabled={isExportingOkrs}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-[#090b16] font-black text-xs uppercase tracking-widest py-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
              >
                {isExportingOkrs ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-indigo-900" />
                    <span>Injetando Metas...</span>
                  </>
                ) : (
                  <>
                    <Plus size={13} className="stroke-[3]" />
                    <span>Injetar OKRs Recomendados</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* OKR List Column */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950/50 border border-slate-850 rounded-xl p-5 md:p-6 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block font-mono">
                  📋 Árvore de OKRs Sugerida por Dafne I.A.
                </span>
                <span className="text-[9px] text-[#818cf8] font-mono font-bold uppercase">
                  Foco: {segmentDetails.label}
                </span>
              </div>

              <div className="space-y-3.5">
                {getSuggestedOkrs().map((okr, index) => (
                  <div 
                    key={okr.id} 
                    className="p-4 rounded-xl border border-white/[0.05] bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-800 transition-all text-left space-y-2.5 relative group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/[0.04] pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-tight text-white">
                        <span className="bg-indigo-500 text-[9px] font-black font-mono text-[#090b16] w-5 h-5 rounded-md flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        {okr.type === 'sales_volume' ? "KR Volumetria comercial" :
                         okr.type === 'profit' ? "KR Rentabilidade & Custos" :
                         okr.type === 'acquisition_cost' ? "KR Custo de Aquisição (CAC)" :
                         okr.type === 'income' ? "KR Receita Sob Gestão" :
                         okr.type === 'churn' ? "KR Fidelidade & Retenção" : "KR Alvo Operacional"}
                      </div>
                      <span className="text-[9.5px] font-mono font-bold text-[#f97316]">
                        Margem Alvo Esperada: {okr.desiredProfitMargin}%
                      </span>
                    </div>
                    
                    <p className="text-xs font-extrabold text-slate-100 font-sans leading-relaxed group-hover:text-orange-300 transition-all">
                      {okr.title}
                    </p>
                    
                    <div className="text-[10px] text-slate-400/90 leading-relaxed font-sans bg-slate-950/50 p-2 border border-slate-900 rounded-lg">
                      🔑 <strong>Justificativa Dafne:</strong> {okr.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center leading-normal pt-2 border-t border-slate-900 font-sans">
              *Ao injetar, estas metas ficarão ativas na guia principal de faturamento, onde você poderá acompanhar o progresso real com base na reconciliação diária de suas faturas e DRE.
            </div>
          </div>
        </div>
      </div>

      {/* SECTOR NEWS & AI PERSONALIZED ANALYSIS */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
          <div className="space-y-1 text-left">
            <h3 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
              <Newspaper size={18} className="text-orange-500 animate-pulse" /> Notícias & Inovação do Setor
            </h3>
            <p className="text-gray-400 text-xs font-medium">Trends e inovações setoriais de seu nicho de atuação analisados com Inteligência Artificial.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 text-[10px] font-bold uppercase tracking-wider font-mono">
            <Globe size={12} className="text-indigo-600 animate-spin" style={{ animationDuration: "12s" }} /> feed integrado
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {getSectorNewsForSegment(selectedSegment).map((newsItem) => {
            const isAnalyzing = analyzingNewsId === newsItem.id;
            const analysisResult = newsAnalyses[newsItem.id];
            const isExpanded = activeNewsAnalysisId === newsItem.id;

            return (
              <div 
                key={newsItem.id} 
                className={cn(
                  "p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between text-left",
                  isExpanded 
                    ? "bg-[#fafbff] border-indigo-200/80 shadow-sm col-span-1 lg:col-span-3" 
                    : "bg-slate-50/40 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                )}
              >
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono font-bold uppercase text-left">
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
                      <h4 className="text-sm font-black text-slate-900 leading-snug tracking-tight text-left">
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

                  <p className="text-xs text-slate-500 leading-relaxed text-left">
                    {newsItem.summary}
                  </p>
                </div>

                {/* AI PERSONALIZED ANALYSIS FEEDBACK BOX */}
                {isExpanded && (
                  <div className="bg-white border border-indigo-100/80 rounded-xl p-4 md:p-5 text-left text-xs text-slate-705 space-y-3 shadow-inner mt-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <div className="flex items-center justify-between border-b border-indigo-50/50 pb-2 font-sans">
                      <div className="flex items-center gap-1.5 font-black text-[10px] text-indigo-650 uppercase tracking-widest font-mono">
                        <Sparkles size={11} className="text-indigo-550 animate-spin" style={{ animationDuration: "6s" }} /> Dafne Parecer de Impacto & Metas
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
                        <div className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-line text-left">
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
  );
}
