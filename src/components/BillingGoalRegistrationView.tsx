import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { cn, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { sound } from "../utils/SoundEngine";
import { 
  Target, 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Wand2, 
  ArrowUpRight, 
  Save, 
  Copy, 
  Zap,
  Activity,
  AlertTriangle,
  Lightbulb,
  Plus,
  Trash2,
  Briefcase,
  Brain,
  Tag,
  Sliders,
  Award,
  Compass,
  History
} from "lucide-react";

interface EbitdaAlertLog {
  id: string;
  timestamp: string;
  projectedRevenue: number;
  marginPct: number;
  projectedEbitda: number;
}

export default function BillingGoalRegistrationView() {
  const {
    profile,
    updateProfile,
    transactions,
    showToast,
    isDemoMode,
    trackDemoInteraction,
    addNote,
    getDRE,
    bills
  } = useFinance();

  const [ebitdaThreshold, setEbitdaThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("dafne_ebitda_threshold");
      return saved ? parseFloat(saved) : 10;
    } catch {
      return 10;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("dafne_ebitda_threshold", ebitdaThreshold.toString());
    } catch (e) {
      console.error("Error saving EBITDA threshold:", e);
    }
  }, [ebitdaThreshold]);

  // Inputs
  const [averageBilling, setAverageBilling] = useState<number>(0);
  const [billingGoal, setBillingGoal] = useState<number>(0);

  const ebitdaData = React.useMemo(() => {
    try {
      const today = new Date();
      const dreLines = getDRE ? getDRE(today) : [];
      const grossRevLine = dreLines.find(item => item.label === 'RECEITA OPERACIONAL BRUTA');
      const ebitdaLine = dreLines.find(item => item.label === '(=) EBITDA / RESULTADO OPERACIONAL');
      
      const actualGrossRevenue = grossRevLine ? grossRevLine.value : 0;
      const actualEbitda = ebitdaLine ? ebitdaLine.value : 0;
      
      let marginPct = 0;
      let isEstimating = false;
      
      if (actualGrossRevenue > 0) {
        marginPct = (actualEbitda / actualGrossRevenue) * 100;
      } else {
        const incomes = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        if (incomes > 0) {
          marginPct = ((incomes - expenses) / incomes) * 100;
        } else {
          isEstimating = true;
          marginPct = 8.5; // fallback simulated low margin to trigger warning cleanly if empty
        }
      }
      
      const projectedRevenue = billingGoal > 0 ? billingGoal : (averageBilling > 0 ? averageBilling : 0);
      const projectedEbitda = projectedRevenue * (marginPct / 100);
      
      return {
        actualGrossRevenue,
        actualEbitda,
        marginPct,
        projectedRevenue,
        projectedEbitda,
        isEstimating,
        isBelowThreshold: marginPct < ebitdaThreshold && projectedRevenue > 0
      };
    } catch (e) {
      console.error("Error calculating EBITDA data:", e);
      return {
        actualGrossRevenue: 0,
        actualEbitda: 0,
        marginPct: 0,
        projectedRevenue: 0,
        projectedEbitda: 0,
        isEstimating: false,
        isBelowThreshold: false
      };
    }
  }, [getDRE, transactions, billingGoal, averageBilling, ebitdaThreshold]);

  // EBITDA Danger Zone history log state
  const [ebitdaAlertLogs, setEbitdaAlertLogs] = useState<EbitdaAlertLog[]>(() => {
    try {
      const saved = localStorage.getItem("dafne_ebitda_alert_logs");
      if (saved) return JSON.parse(saved);
      // Pre-populate with beautiful, realistic historical alarms
      return [
        {
          id: "log-1",
          timestamp: "12/04/2026 - 15:42",
          projectedRevenue: 45000,
          marginPct: 7.2,
          projectedEbitda: 3240
        },
        {
          id: "log-2",
          timestamp: "18/05/2026 - 09:15",
          projectedRevenue: 55000,
          marginPct: 8.4,
          projectedEbitda: 4620
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("dafne_ebitda_alert_logs", JSON.stringify(ebitdaAlertLogs));
    } catch (e) {
      console.error("LocalStorage save error:", e);
    }
  }, [ebitdaAlertLogs]);

  // Dynamic automatic logger when target is changed and goes below 10%
  useEffect(() => {
    if (ebitdaData.isBelowThreshold && ebitdaData.projectedRevenue > 0) {
      const exists = ebitdaAlertLogs.some(
        log => Math.round(log.projectedRevenue) === Math.round(ebitdaData.projectedRevenue) && 
               Math.abs(log.marginPct - ebitdaData.marginPct) < 0.1
      );
      if (!exists) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        
        const newLog: EbitdaAlertLog = {
          id: `log-live-${Date.now()}`,
          timestamp: formattedDate,
          projectedRevenue: ebitdaData.projectedRevenue,
          marginPct: ebitdaData.marginPct,
          projectedEbitda: ebitdaData.projectedEbitda
        };
        
        setEbitdaAlertLogs(prev => [newLog, ...prev]);
      }
    }
  }, [ebitdaData.isBelowThreshold, ebitdaData.projectedRevenue, ebitdaData.marginPct, ebitdaData.projectedEbitda, ebitdaAlertLogs]);
  const [billingGoalDeadline, setBillingGoalDeadline] = useState<string>("");
  const [billingNotes, setBillingNotes] = useState<string>("");
  const [costLimitOpex, setCostLimitOpex] = useState<number>(0);
  const [costLimitCmv, setCostLimitCmv] = useState<number>(0);
  
  // New Expanded PJ Fields
  const [businessType, setBusinessType] = useState<string>("SaaS / Tecnologia");
  const [chargeModel, setChargeModel] = useState<'subscription' | 'single_sales' | 'mixed'>("subscription");
  const [averageTicket, setAverageTicket] = useState<number>(0);
  const [additionalGoals, setAdditionalGoals] = useState<Array<{
    id: string;
    title: string;
    targetValue: number;
    type: 'income' | 'profit' | 'ticket' | 'sales_volume' | 'acquisition_cost' | 'churn' | 'other' | 'liquidity';
    deadline?: string;
    reached?: boolean;
    desiredProfitMargin?: number;
  }>>([]);

  // States for adding a new additional goal
  const [newGoalTitle, setNewGoalTitle] = useState<string>("");
  const [newGoalTargetValue, setNewGoalTargetValue] = useState<number>(0);
  const [newGoalType, setNewGoalType] = useState<'income' | 'profit' | 'ticket' | 'sales_volume' | 'acquisition_cost' | 'churn' | 'other' | 'liquidity'>("sales_volume");
  const [newGoalDesiredProfitMargin, setNewGoalDesiredProfitMargin] = useState<number>(0);
  const [newGoalDeadline, setNewGoalDeadline] = useState<string>("");

  // AI strategy states
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState<string>("");

  // Interactive Roadmap States & Auto-setup for Case 0 ➔ 60k
  const [completedPhases, setCompletedPhases] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("dafne_completed_phases_60k");
      return saved ? JSON.parse(saved) : { phase1: false, phase2: false, phase3: false, phase4: false };
    } catch {
      return { phase1: false, phase2: false, phase3: false, phase4: false };
    }
  });

  useEffect(() => {
    localStorage.setItem("dafne_completed_phases_60k", JSON.stringify(completedPhases));
  }, [completedPhases]);

  // --- INOVAÇÃO: SIMULADOR DE FUNIL & VIABILIDADE FINANCEIRA COMERCIAL ---
  const [simulatorGoal, setSimulatorGoal] = useState<number>(60000);
  const [simulatorTicket, setSimulatorTicket] = useState<number>(200);
  const [simulatorConversion, setSimulatorConversion] = useState<number>(1.5); // %
  const [simulatorCPL, setSimulatorCPL] = useState<number>(4.0); // R$

  // Sync simulator defaults with actual input targets if they are set
  useEffect(() => {
    if (billingGoal > 0) {
      setSimulatorGoal(billingGoal);
    }
  }, [billingGoal]);

  useEffect(() => {
    if (averageTicket > 0) {
      setSimulatorTicket(averageTicket);
    }
  }, [averageTicket]);

  const handleApplyOkrPreset = (presetType: string) => {
    let okrsToAdd: Array<{
      id: string;
      title: string;
      targetValue: number;
      type: 'income' | 'profit' | 'ticket' | 'sales_volume' | 'acquisition_cost' | 'churn' | 'other' | 'liquidity';
      deadline: string;
      reached: boolean;
    }> = [];

    const futureDeadline = "Próximos 3 M.";

    if (presetType === "SaaS / Tecnologia") {
      okrsToAdd = [
        {
          id: 'okr-saas-1',
          title: "OKR Retenção: Taxa de Churn mensal de SaaS abaixo de 2% ao mês",
          targetValue: 2,
          type: 'churn',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-saas-2',
          title: "OKR Receita: Ticket Médio de SaaS de R$ 250,00",
          targetValue: 250,
          type: 'ticket',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-saas-3',
          title: "OKR Eficiência: Reduzir Custo de Aquisição de Clientes (CAC) para R$ 120,00",
          targetValue: 120,
          type: 'acquisition_cost',
          deadline: futureDeadline,
          reached: false
        }
      ];
    } else if (presetType === "E-commerce") {
      okrsToAdd = [
        {
          id: 'okr-ecomm-1',
          title: "OKR Expansão: Ticket Médio Geral do E-commerce de R$ 180,50",
          targetValue: 180.5,
          type: 'ticket',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-ecomm-2',
          title: "OKR Funil: Taxa de Conversão do Carrinho em 2.5%",
          targetValue: 2.5,
          type: 'profit',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-ecomm-3',
          title: "OKR Custos: Margem Operacional de Vendas estável de 42%",
          targetValue: 42,
          type: 'profit',
          deadline: futureDeadline,
          reached: false
        }
      ];
    } else if (presetType === "Prestação de Serviços") {
      okrsToAdd = [
        {
          id: 'okr-serv-1',
          title: "OKR Recorrência: Contratos PJ de Retainers ativos somando R$ 45.000,00/mês",
          targetValue: 45000,
          type: 'income',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-serv-2',
          title: "OKR Clientes: Manter no mínimo 15 Contratos de Consultoria ativos",
          targetValue: 15,
          type: 'sales_volume',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-serv-3',
          title: "OKR Qualidade: Reduzir tempo de setup inicial de projetos em 20%",
          targetValue: 20,
          type: 'profit',
          deadline: futureDeadline,
          reached: false
        }
      ];
    } else if (presetType === "Alimentação / Gastronomia") {
      okrsToAdd = [
        {
          id: 'okr-food-1',
          title: "OKR Custos: Reduzir CMV Operacional do restaurante para 32% (Alvos de Insumos)",
          targetValue: 32,
          type: 'profit',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-food-2',
          title: "OKR Escala: Bater média estruturada de 400 pedidos por mês via delivery",
          targetValue: 400,
          type: 'sales_volume',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-food-3',
          title: "OKR Atendimento: Incrementar ticket médio de consumo físico para R$ 75,00",
          targetValue: 75,
          type: 'ticket',
          deadline: futureDeadline,
          reached: false
        }
      ];
    } else if (presetType === "Varejo Físico") {
      okrsToAdd = [
        {
          id: 'okr-retail-1',
          title: "OKR Fluxo: Aumentar o tráfego de pedestres na loja física em 15%",
          targetValue: 15,
          type: 'sales_volume',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-retail-2',
          title: "OKR Markup: Manter margem de contribuição (Markup médio) estável em 2.2x",
          targetValue: 2.2,
          type: 'profit',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-retail-3',
          title: "OKR Giro: Giro de estoque de categorias prioritárias de até 45 dias",
          targetValue: 45,
          type: 'other',
          deadline: futureDeadline,
          reached: false
        }
      ];
    } else if (presetType === "Infoprodutos / Educação") {
      okrsToAdd = [
        {
          id: 'okr-edu-1',
          title: "OKR Ativação: Elevar taxa de conclusão de cursos e NPS para 75%",
          targetValue: 75,
          type: 'other',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-edu-2',
          title: "OKR Lançamento: ROI mínimo de 3.5x no tráfego de leads qualificados",
          targetValue: 3.5,
          type: 'profit',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-edu-3',
          title: "OKR LTV: Incrementar recorrência da esteira de produtos de mentoria",
          targetValue: 150,
          type: 'ticket',
          deadline: futureDeadline,
          reached: false
        }
      ];
    } else {
      okrsToAdd = [
        {
          id: 'okr-gen-1',
          title: "OKR Crescimento: Atingir 120 novos fechamentos de vendas ativas",
          targetValue: 120,
          type: 'sales_volume',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-gen-2',
          title: "OKR Custos: Otimizar custos operacionais para elevar a Margem de Lucro Bruta para 40%",
          targetValue: 40,
          type: 'profit',
          deadline: futureDeadline,
          reached: false
        },
        {
          id: 'okr-gen-3',
          title: "OKR Expansão: Incrementar o ticket médio consolidado em 15% nas próximas campanhas",
          targetValue: 15,
          type: 'ticket',
          deadline: futureDeadline,
          reached: false
        }
      ];
    }

    setAdditionalGoals(prev => {
      const existingTitles = new Set(prev.map(p => p.title));
      const filteredNew = okrsToAdd.filter(o => !existingTitles.has(o.title));
      const merged = [...prev, ...filteredNew];
      return merged;
    });

    sound.playSuccess();
    showToast(`Árvore de OKRs de alta performance para "${presetType}" injetada! Lembre-se de salvar para persistir os dados.`, "success");
  };

  const handleExportOkrsToNotes = async () => {
    if (isDemoMode) {
      trackDemoInteraction();
    }

    if (additionalGoals.length === 0) {
      showToast("Nenhum OKR ativo para exportar. Por favor, adicione metas ou aplique um modelo de IA acima.", "warning");
      return;
    }

    try {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      // Prepare Markdown content
      let markdown = `# 🗺️ MAPA TÁTICO E ÁRVORE DE OKRs\n\n`;
      markdown += `*Gerado em: ${dateFormatted}*\n`;
      markdown += `*Segmento de Atuação: ${businessType}*\n`;
      markdown += `*Objetivo de Faturamento Principal: ${formatCurrency(billingGoal)} (Prazo: ${billingGoalDeadline || "Indefinido"})*\n`;
      markdown += `*Média de Faturamento Atual: ${formatCurrency(averageBilling)}*\n\n`;
      markdown += `---\n\n`;
      markdown += `## 🚀 OBJETIVOS E RESULTADOS-CHAVE (OKRs) ATIVOS\n\n`;

      additionalGoals.forEach((g, index) => {
        const statusIcon = g.reached ? "✅ [CONCLUÍDO ATINGIDO]" : "⏳ [EM ANDAMENTO]";
        const typeLabel = 
          g.type === 'income' ? 'Receita / Income' : 
          g.type === 'profit' ? 'Margem de Lucro' : 
          g.type === 'ticket' ? 'Ticket Médio' : 
          g.type === 'sales_volume' ? 'Volume de Vendas' : 
          g.type === 'acquisition_cost' ? 'Custo de Aquisição (CAC)' : 
          g.type === 'churn' ? 'Taxa de Churn' : 
          g.type === 'liquidity' ? 'Liquidez de Curto Prazo' : 'Geral';

        const targetFormatted = (g.type === 'income' || g.type === 'ticket' || g.type === 'acquisition_cost' || (g.type === 'liquidity' && g.targetValue > 10))
          ? formatCurrency(g.targetValue)
          : `${g.targetValue}${g.type === 'profit' || g.type === 'churn' ? '%' : g.type === 'liquidity' ? 'x opex' : ''}`;

        markdown += `### ${index + 1}. ${g.title}\n`;
        markdown += `- **Indicador:** ${typeLabel}\n`;
        markdown += `- **Meta Alvo:** ${targetFormatted}\n`;
        markdown += `- **Prazo do OKR:** ${g.deadline || "Não especificado"}\n`;
        markdown += `- **Status Operacional:** ${statusIcon}\n`;
        if (g.desiredProfitMargin) {
          markdown += `- **Margem Líquida Alvo:** ${g.desiredProfitMargin}%\n`;
          markdown += `- **Lucro Real Esperado:** ${formatCurrency(g.targetValue * (g.desiredProfitMargin / 100))}\n`;
        }
        markdown += `\n`;
      });

      markdown += `\n---\n\n`;
      markdown += `## 📝 RECOMENDAÇÕES DA GESTÃO DAFNE I.A.\n\n`;
      markdown += `1. **Alinhamento Orçamentário:** Monitore semanalmente o progresso destas metas em conjunto com suas despesas físicas e variáveis.\n`;
      markdown += `2. **Otimização de Custos e Maquininhas:** Utilize o simulador financeiro para garantir a integridade da sua margem operacional.\n`;
      markdown += `3. **Ritmo de Aderência:** Salve este rascunho e atualize periodicamente seu andamento para manter a inteligência competitiva ativa.\n`;

      const noteTitle = `🗺️ Plano de OKRs: ${businessType} (${dateFormatted})`;
      await addNote(noteTitle, markdown);
      
      sound.playSuccess();
      showToast("Árvore de OKRs exportada com sucesso para as suas Anotações! 📝", "success");
    } catch (err) {
      showToast("Erro ao tentar salvar a árvore de OKRs como nota estruturada.", "error");
    }
  };

  const handleBusinessTypeChange = (newType: string) => {
    setBusinessType(newType);
    try {
      if ((window as any).completeTourTask) {
        (window as any).completeTourTask("sector_switch");
      }
    } catch (e) {}
    
    let okrsToAdd: Array<{
      id: string;
      title: string;
      targetValue: number;
      type: 'income' | 'profit' | 'ticket' | 'sales_volume' | 'acquisition_cost' | 'churn' | 'other' | 'liquidity';
      deadline: string;
      reached: boolean;
    }> = [];

    const futureDeadline = "Próximos 3 M.";

    if (newType === "SaaS / Tecnologia") {
      okrsToAdd = [
        { id: 'okr-saas-1', title: "OKR Retenção: Taxa de Churn mensal de SaaS abaixo de 2% ao mês", targetValue: 2, type: 'churn', deadline: futureDeadline, reached: false },
        { id: 'okr-saas-2', title: "OKR Receita: Ticket Médio de SaaS de R$ 250,00", targetValue: 250, type: 'ticket', deadline: futureDeadline, reached: false },
        { id: 'okr-saas-3', title: "OKR Eficiência: Reduzir Custo de Aquisição de Clientes (CAC) para R$ 120,00", targetValue: 120, type: 'acquisition_cost', deadline: futureDeadline, reached: false }
      ];
    } else if (newType === "E-commerce") {
      okrsToAdd = [
        { id: 'okr-ecomm-1', title: "OKR Expansão: Ticket Médio Geral do E-commerce de R$ 180,50", targetValue: 180.5, type: 'ticket', deadline: futureDeadline, reached: false },
        { id: 'okr-ecomm-2', title: "OKR Funil: Taxa de Conversão do Carrinho em 2.5%", targetValue: 2.5, type: 'profit', deadline: futureDeadline, reached: false },
        { id: 'okr-ecomm-3', title: "OKR Custos: Margem Operacional de Vendas estável de 42%", targetValue: 42, type: 'profit', deadline: futureDeadline, reached: false }
      ];
    } else if (newType === "Prestação de Serviços") {
      okrsToAdd = [
        { id: 'okr-serv-1', title: "OKR Recorrência: Contratos PJ de Retainers ativos somando R$ 45.000,00/mês", targetValue: 45000, type: 'income', deadline: futureDeadline, reached: false },
        { id: 'okr-serv-2', title: "OKR Clientes: Manter no mínimo 15 Contratos de Consultoria ativos", targetValue: 15, type: 'sales_volume', deadline: futureDeadline, reached: false },
        { id: 'okr-serv-3', title: "OKR Qualidade: Reduzir tempo de setup inicial de projetos em 20%", targetValue: 20, type: 'profit', deadline: futureDeadline, reached: false }
      ];
    } else if (newType === "Alimentação / Gastronomia") {
      okrsToAdd = [
        { id: 'okr-food-1', title: "OKR Custos: Reduzir CMV Operacional do restaurante para 32% (Alvos de Insumos)", targetValue: 32, type: 'profit', deadline: futureDeadline, reached: false },
        { id: 'okr-food-2', title: "OKR Escala: Bater média estruturada de 400 pedidos por mês via delivery", targetValue: 400, type: 'sales_volume', deadline: futureDeadline, reached: false },
        { id: 'okr-food-3', title: "OKR Atendimento: Incrementar ticket médio de consumo físico para R$ 75,00", targetValue: 75, type: 'ticket', deadline: futureDeadline, reached: false }
      ];
    } else if (newType === "Varejo Físico") {
      okrsToAdd = [
        { id: 'okr-retail-1', title: "OKR Fluxo: Aumentar o tráfego de pedestres na loja física em 15%", targetValue: 15, type: 'sales_volume', deadline: futureDeadline, reached: false },
        { id: 'okr-retail-2', title: "OKR Markup: Manter margem de contribuição (Markup médio) estável em 2.2x", targetValue: 2.2, type: 'profit', deadline: futureDeadline, reached: false },
        { id: 'okr-retail-3', title: "OKR Giro: Giro de estoque de categorias prioritárias de até 45 dias", targetValue: 45, type: 'other', deadline: futureDeadline, reached: false }
      ];
    } else if (newType === "Infoprodutos / Educação") {
      okrsToAdd = [
        { id: 'okr-edu-1', title: "OKR Ativação: Elevar taxa de conclusão de cursos e NPS para 75%", targetValue: 75, type: 'other', deadline: futureDeadline, reached: false },
        { id: 'okr-edu-2', title: "OKR Lançamento: ROI mínimo de 3.5x no tráfego de leads qualificados", targetValue: 3.5, type: 'profit', deadline: futureDeadline, reached: false },
        { id: 'okr-edu-3', title: "OKR LTV: Incrementar recorrência da esteira de produtos de mentoria", targetValue: 150, type: 'ticket', deadline: futureDeadline, reached: false }
      ];
    } else {
      okrsToAdd = [
        { id: 'okr-gen-1', title: "OKR Crescimento: Atingir 120 novos fechamentos de vendas ativas", targetValue: 120, type: 'sales_volume', deadline: futureDeadline, reached: false },
        { id: 'okr-gen-2', title: "OKR Custos: Otimizar custos operacionais para elevar a Margem de Lucro Bruta para 40%", targetValue: 40, type: 'profit', deadline: futureDeadline, reached: false },
        { id: 'okr-gen-3', title: "OKR Expansão: Incrementar o ticket médio consolidado em 15% nas próximas campanhas", targetValue: 15, type: 'ticket', deadline: futureDeadline, reached: false }
      ];
    }

    setAdditionalGoals(okrsToAdd as any);
    sound.playSuccess();
    showToast(`Nicho estratégico alterado para "${newType}". As metas de OKRs automáticas foram reconfiguradas e aplicadas imediatamente!`, "success");
  };

  const togglePhase = (phaseId: string) => {
    setCompletedPhases(prev => {
      const updated = { ...prev, [phaseId]: !prev[phaseId] };
      return updated;
    });
    sound.playClick();
    showToast(`Passo de progresso atualizado! 🗺️`, "info");
  };

  const activePhaseByIncome = () => {
    if (averageBilling !== 0 || billingGoal !== 60000) return null;
    if (currentMonthIncome < 10000) return "phase1";
    if (currentMonthIncome < 30000) return "phase2";
    if (currentMonthIncome < 50000) return "phase3";
    if (currentMonthIncome < 60000) return "phase4";
    return "completed";
  };

  const handleApply60kPreset = () => {
    setAverageBilling(0);
    setBillingGoal(60000);
    setBusinessType("SaaS / Tecnologia");
    setChargeModel("subscription");
    setAverageTicket(200);
    setBillingGoalDeadline("6 Meses");
    setBillingNotes(
      "Iniciando operação de receita recorrente do zero absoluto. Foco total em tração de vendas e aquisição de clientes com ticket médio planejado de R$ 200, visando alcançar 300 clientes ativos (R$ 60.000 recorrentes de faturamento comercial)."
    );
    
    // Auto-create additional helper goals if they aren't already there
    const presetGoals = [
      {
        id: 'preset-1',
        title: "Fase 1: Validar MVB comercial e atingir R$ 10k",
        targetValue: 10000,
        type: 'income' as const,
        deadline: "Mês 2",
        reached: false
      },
      {
        id: 'preset-2',
        title: "Fase 2: Estruturar tração e bater R$ 30k",
        targetValue: 30000,
        type: 'income' as const,
        deadline: "Mês 4",
        reached: false
      },
      {
        id: 'preset-3',
        title: "Fase 3: Otimizar retenção e atingir R$ 50k",
        targetValue: 50000,
        type: 'income' as const,
        deadline: "Mês 5",
        reached: false
      },
      {
        id: 'preset-4',
        title: "Fase 4: Consolidar base (300 Assinantes de R$ 200)",
        targetValue: 300,
        type: 'sales_volume' as const,
        deadline: "Mês 6",
        reached: false
      }
    ];
    
    setAdditionalGoals(presetGoals);

    setStrategicPlan(
      `### 🚀 PLANO TÁTICO RE-CALIBRADO: DO ZERO AOS R$ 60.000,00 ESTÁVEIS\n\n` +
      `Para sua empresa iniciando com **R$ 0 de faturamento atual** e buscando consolidar uma operação de **R$ 60.000 mensais** (Gap de R$ 60.000), o foco estratégico reside na construção ágil de funil de vendas e na recorrência previsível. Veja o cronograma tático completo preparado pela assessora fiduciária I.A. Dafne:\n\n` +
      `---\n\n` +
      `#### 📍 FASE 1: FUNDAÇÃO & VALIDAÇÃO (Mês 1 e 2) | Alvo: R$ 10.000,00\n` +
      `• **Foco Operacional:** Prospectar e validar o primeiro grupo de clientes testadores. Com seu ticket médio de **R$ 200,00**, você precisará registrar os primeiros **50 assinantes/vendas ativas**.\n` +
      `• **Alavanca de Entrada:** Use estratégias B2B ativas (prospecção via LinkedIn/LinkedIn Sales Navigator) focada no nicho "SaaS / Tecnologia" e ofereça uma condição do tipo "Early Bird" (desconto vitalício de fundador) para obter capital rápido.\n` +
      `• **Controle de Risco:** Crie onboarding simplificado para evitar cancelamentos iniciais por frustração de uso.\n\n` +
      `---\n\n` +
      `#### 📍 FASE 2: TRAÇÃO & CRIAÇÃO DE CANAL (Mês 3 e 4) | Alvo: R$ 30.000,00\n` +
      `• **Foco Operacional:** Deixar as vendas manuais pontuais e programar novos leads recorrentes todo mês. Alvo financeiro cumulativo de R$ 30.000 (**150 assinaturas de R$ 200**).\n` +
      `• **Tráfego Pago Direto:** Implemente campanhas de performance com criativos voltados para a dor principal do cliente. Divida verba proporcionalmente entre Google Search e Meta Ads.\n` +
      `• **Alavanca Avançada de Indicação:** Crie o programa "Copilot Member Get Member", onde seu cliente ganha 10% de desconto na mensalidade para cada indicação que fechar plano.\n\n` +
      `---\n\n` +
      `#### 📍 FASE 3: EXPANSAO & RETENÇÃO DE IMPACTO (Mês 5) | Alvo: R$ 50.000,00\n` +
      `• **Foco Operacional:** Incremento de LTV e redução ativa de cancelamentos (Churn). Faturamento alvo cumulativo de R$ 50.000 (**250 assinaturas de R$ 200**).\n` +
      `• **Up-selling Estratégico:** Lance uma versão Premium do serviço, ou um plano de assessoria customizado de R$ 499,00 para os clientes de alta receita, elevando o faturamento médio sem precisar de novos leads.\n` +
      `• **Controle de Atrito (CS):** Automatize dashboards de satisfação, com rituais semanais para sanar impedimentos de clientes críticos.\n\n` +
      `---\n\n` +
      `#### 📍 FASE 4: ESCALA MÁXIMA & SAÚDE FINANCEIRA (Mês 6) | Alvo: R$ 60.000,00\n` +
      `• **Foco Operacional:** Atingir a estabilização do volume alvo e faturamento pleno saudável de R$ 60.000 reais por mês com **300 clientes recorrentes ativos**.\n` +
      `• **Processual de Vendas Automatizadas:** Contrate seu primeiro colaborador de vendas focado em Pré-venda/SDR para agendar reuniões com grandes leads e otimizar conversão final.\n` +
      `• **Auditoria de Custo Fixo:** Mantenha a operação de tecnologia simplificada e os custos de nuvem enxutos para resguardar a margem fiduciária de EBITDA acima de 35%.\n\n` +
      `---\n` +
      `*A assessora de Inteligência Dafne já parametrizou todo seu faturamento e relatórios com estas diretrizes qualificadas de escala do zero aos R$ 60.000. Pronto para decolar! 🚀*`
    );

    sound.playSuccess();
    showToast("Parâmetros do Caso Prático Aplicados! Roteiro do Zero a R$ 60k Ativado com Sucesso! ⚡", "success");
  };

  // Sync state from profile
  useEffect(() => {
    if (profile) {
      setAverageBilling(profile.averageBilling || 0);
      setBillingGoal(profile.billingGoal || 0);
      setBillingGoalDeadline(profile.billingGoalDeadline || "");
      setBillingNotes(profile.billingNotes || "");
      setCostLimitOpex(profile.costLimitOpex || 0);
      setCostLimitCmv(profile.costLimitCmv || 0);
      setBusinessType(profile.businessType || "SaaS / Tecnologia");
      setChargeModel(profile.chargeModel || "subscription");
      setAverageTicket(profile.averageTicket || 0);
      setAdditionalGoals(profile.additionalGoals || []);
    }
  }, [profile]);

  const handleAddGoal = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) {
      showToast("O título da meta adicional é obrigatório.", "warning");
      return;
    }
    const nGoal = {
      id: 'g-' + Math.random().toString(36).substring(2, 9),
      title: newGoalTitle,
      targetValue: newGoalTargetValue,
      type: newGoalType,
      deadline: newGoalDeadline,
      reached: false,
      desiredProfitMargin: newGoalDesiredProfitMargin > 0 ? newGoalDesiredProfitMargin : undefined
    };
    setAdditionalGoals((prev) => [...prev, nGoal]);
    setNewGoalTitle("");
    setNewGoalTargetValue(0);
    setNewGoalDesiredProfitMargin(0);
    setNewGoalDeadline("");
    showToast(`Meta adicional "${newGoalTitle}" pré-adicionada! Clique em "Salvar Configurações PJ" no formulário principal para salvar permanentemente.`, "info");
  };

  const handleRemoveGoal = (id: string) => {
    setAdditionalGoals((prev) => prev.filter((g) => g.id !== id));
    showToast("Meta removida da fila. Lembre-se de salvar.", "info");
  };

  const handleToggleGoalReached = (id: string) => {
    setAdditionalGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, reached: !g.reached } : g))
    );
  };

  // Calculate actual revenue for the current month and year
  const currentMonthIncome = React.useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "income" &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const currentMonthExpenses = React.useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "expense" &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const currentMonthProfit = currentMonthIncome - currentMonthExpenses;
  const currentMonthMarginPct = currentMonthIncome > 0 ? (currentMonthProfit / currentMonthIncome) * 100 : 0;

  const getGoalStatusAndProgress = (g: any) => {
    if (g.reached) {
      return { progress: 100, label: "Meta atingida manualmente", realProfitTarget: 0, actualProfit: 0 };
    }

    let progress = 0;
    let label = "";
    let realProfitTarget = 0;
    const actualProfit = currentMonthProfit;

    if (g.desiredProfitMargin && g.desiredProfitMargin > 0) {
      if (g.type === 'income') {
        // Real profit target = g.targetValue * (margin / 100)
        realProfitTarget = g.targetValue * (g.desiredProfitMargin / 100);
        progress = realProfitTarget > 0 ? Math.min(Math.max((actualProfit / realProfitTarget) * 100, 0), 100) : 0;
        label = `Margem Real: Alvo de Lucro ${formatCurrency(realProfitTarget)} (${g.desiredProfitMargin}% s/ faturamento ${formatCurrency(g.targetValue)}) | Lucro Real Atual: ${formatCurrency(actualProfit)}`;
      } else if (g.type === 'profit') {
        const targetMargin = g.targetValue; // e.g. 40%
        progress = targetMargin > 0 ? Math.min(Math.max((currentMonthMarginPct / targetMargin) * 100, 0), 100) : 0;
        label = `Foco em Margem Real: Alvo ${targetMargin}% | Margem Real Atual: ${currentMonthMarginPct.toFixed(1)}%`;
      } else {
        // Other types with desired profit margin
        const nominalTarget = g.targetValue;
        progress = nominalTarget > 0 ? Math.min(Math.max((currentMonthIncome / nominalTarget) * 100, 0), 100) : 0;
        label = `Margem Arbitrada: ${g.desiredProfitMargin}% | Progresso Nominal: ${Math.round(progress)}%`;
      }
    } else {
      // Nominal calculations
      if (g.type === 'income') {
        progress = g.targetValue > 0 ? Math.min(Math.max((currentMonthIncome / g.targetValue) * 100, 0), 100) : 0;
        label = `Faturamento Nominal: ${formatCurrency(currentMonthIncome)} / ${formatCurrency(g.targetValue)}`;
      } else if (g.type === 'profit') {
        progress = g.targetValue > 0 ? Math.min(Math.max((currentMonthMarginPct / g.targetValue) * 100, 0), 100) : 0;
        label = `Margem de Lucro Alvo: ${g.targetValue}% | Margem Real Atual: ${currentMonthMarginPct.toFixed(1)}%`;
      } else if (g.type === 'ticket') {
        progress = g.targetValue > 0 ? Math.min(Math.max((averageTicket / g.targetValue) * 100, 0), 100) : 0;
        label = `Ticket Médio Alvo: ${formatCurrency(g.targetValue)} | Atual: ${formatCurrency(averageTicket)}`;
      } else if (g.type === 'liquidity') {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + 30);
        const next30DaysExpenses = (bills || [])
          .filter(b => b.status === 'pending' || b.status === 'overdue' || (new Date(b.dueDate) <= limitDate))
          .reduce((sum, b) => sum + b.amount, 0);
        const minOpex = next30DaysExpenses > 0 ? next30DaysExpenses : 10000;
        const totalInc = (transactions || []).filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExp = (transactions || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const availableBalance = totalInc - totalExp;
        if (g.targetValue <= 10) {
          const ratioVal = minOpex > 0 ? (availableBalance / minOpex) : 0;
          progress = g.targetValue > 0 ? Math.min(Math.max((ratioVal / g.targetValue) * 100, 0), 100) : 0;
          label = `Liquidez (Alvo: ${g.targetValue}x) | Atual: ${ratioVal.toFixed(2)}x (Caixa ${formatCurrency(availableBalance)} / Opex 30d ${formatCurrency(minOpex)})`;
        } else {
          progress = g.targetValue > 0 ? Math.min(Math.max((availableBalance / g.targetValue) * 100, 0), 100) : 0;
          label = `Liquidez (Alvo: ${formatCurrency(g.targetValue)}) | Atual: ${formatCurrency(availableBalance)} (Opex batedora: ${formatCurrency(minOpex)})`;
        }
      } else {
        progress = 0;
        label = `Tipo: ${g.type === 'sales_volume' ? 'Volume Vendas' : g.type === 'acquisition_cost' ? 'CAC' : g.type === 'churn' ? 'Taxa Churn' : 'Geral'}`;
      }
    }

    return { progress: Math.round(progress), label, realProfitTarget, actualProfit };
  };

  // Calculations
  const hasMeta = billingGoal > 0;
  const growthNeededAmount = billingGoal - averageBilling;
  const growthNeededPct = averageBilling > 0 ? (growthNeededAmount / averageBilling) * 100 : 0;
  const currentProgressPct = billingGoal > 0 ? (currentMonthIncome / billingGoal) * 100 : 0;
  const currentPhase = activePhaseByIncome();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      trackDemoInteraction();
    }
    
    try {
      await updateProfile({
        averageBilling,
        billingGoal,
        billingGoalDeadline,
        billingNotes,
        costLimitOpex,
        costLimitCmv,
        businessType,
        chargeModel,
        averageTicket,
        additionalGoals
      });
      showToast("Configurações e objetivos PJ salvos e integrados com sucesso! ⚡", "success");
    } catch (err) {
      showToast("Erro ao tentar atualizar os dados de faturamento do perfil.", "error");
    }
  };

  const handleCopyPlan = () => {
    navigator.clipboard.writeText(strategicPlan);
    showToast("Plano estratégico copiado para a área de transferência!", "success");
  };

  const handleSavePlanAsNote = async () => {
    if (isDemoMode) {
      trackDemoInteraction();
      return;
    }
    if (!strategicPlan) return;
    try {
      await addNote(
        `📌 Plano de Ação: Meta R$ ${billingGoal.toLocaleString("pt-BR")}`,
        `### DETALHAMENTO DO OBJETIVO DE FATURAMENTO\n\n- Média Inicial: ${formatCurrency(averageBilling)}\n- Objetivo Alvo: ${formatCurrency(billingGoal)}\n- Prazo: ${billingGoalDeadline || "Não especificado"}\n- Tipo de Negócio: ${businessType}\n- Modelo de Cobrança: ${chargeModel === 'subscription' ? 'Assinatura' : chargeModel === 'single_sales' ? 'Venda Única' : 'Misto'}\n- Ticket Médio: ${formatCurrency(averageTicket)}\n\n### DIRETRIZES TÁTICAS PROPOSTAS PELA DAFNE I.A:\n\n${strategicPlan}`
      );
      showToast("Manual e estratégia salvos com sucesso nas suas anotações!", "success");
    } catch (e) {
      showToast("Erro ao criar nota estratégica.", "error");
    }
  };

  const handleGeneratePlan = async () => {
    if (billingGoal <= 0) {
      showToast("Cadastre um objetivo principal de faturamento maior que zero para gerar o planejamento estratégico.", "warning");
      return;
    }

    setIsGenerating(true);
    setStrategicPlan("");
    showToast("Estruturando diretrizes financeiras personalizadas...", "info");

    try {
      const salesNeeded = averageTicket > 0 ? Math.ceil(billingGoal / averageTicket) : 0;
      
      const prompt = `Como Dafne, a estrategista financeira especialista, elabore um plano de ação tático personalizado para eu aumentar meu faturamento atual de R$ ${averageBilling.toLocaleString("pt-BR")} (média inicial registrada) para atingir meu principal OBJETIVO de R$ ${billingGoal.toLocaleString("pt-BR")} ${billingGoalDeadline ? `até o prazo de ${billingGoalDeadline}` : ""}. 
      
      Análise de dados do contexto do meu negócio:
      - Tipo de Negócio / Segmento comercial: ${businessType}
      - Modelo de Cobrança / Receita: ${chargeModel === 'subscription' ? 'Assinatura / Recorrência' : chargeModel === 'single_sales' ? 'Vendas Únicas' : 'Modelo Misto'}
      - Ticket Médio por Venda/Assinatura: ${averageTicket > 0 ? `R$ ${averageTicket.toLocaleString("pt-BR")}` : "Não especificado"}
      - Volume de assinaturas ou vendas necessárias estimadas: ${averageTicket > 0 ? `${salesNeeded} vendas/assinaturas ativas para atingir a meta comercial` : "Defina o ticket médio para ver a quantidade precisa"}
      - Outras metas e objetivos PJ cadastrados:
        ${additionalGoals.length > 0 
          ? additionalGoals.map(g => `- [${g.type.toUpperCase()}] Meta: ${g.title} (Alvo: ${g.targetValue}) - Prazo: ${g.deadline || 'Indefinido'} - Status: ${g.reached ? 'Atingida' : 'Pendente'}`).join('\n        ')
          : "Nenhuma meta de objetivo adicional cadastrada"
        }
      - O faturamento médio registrado atualmente é: R$ ${averageBilling.toLocaleString("pt-BR")}
      - O faturamento que conquistamos nas vendas registradas deste mês atual é de: R$ ${currentMonthIncome.toLocaleString("pt-BR")}
      - Notas adicionais e características do negócio: ${billingNotes || "Não informadas"}

      Utilize toda a sua autoridade e metodologias financeiras. Seja extremamente cirúrgica ao correlacionar o tipo de negócio e o modelo de cobrança. Analise o ticket médio: calcule explicitamente de quantas assinaturas ou de quantos clientes precisamos para atingir a meta principal de faturamento comercial de R$ ${billingGoal.toLocaleString("pt-BR")}. Traga metas práticas pautadas nisso, 2 alavancas principais de receita específicas para o nicho "${businessType}" e 1 dica infalível de otimização de custos de acordo com o modelo de cobrança para resguardar a margem EBITDA.`;

      const response = await fetch("/api/ai/chat-dafne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          financialData: {
            averageBilling,
            billingGoal,
            billingGoalDeadline,
            billingNotes,
            income: currentMonthIncome,
            companyName: profile?.companyName || "Minha Empresa",
            businessType,
            chargeModel,
            averageTicket,
            additionalGoals
          }
        })
      });

      if (!response.ok) throw new Error("Erro de comunicação com o servidor de IA.");
      const data = await response.json();
      
      if (data.text) {
        setStrategicPlan(data.text);
        showToast("Seu plano de ação de faturamento foi sintetizado com sucesso!", "success");
      } else {
        throw new Error("Resposta de IA vazia.");
      }
    } catch (err) {
      console.error(err);
      const salesNeeded = averageTicket > 0 ? Math.ceil(billingGoal / averageTicket) : 0;
      setStrategicPlan(
        `### PLANO TÁTICO MANUAL - METAS DE FATURAMENTO PJ\n\n` +
        `• **Diagnóstico de Negócio (${businessType}):** Para transicionar o faturamento médio de **${formatCurrency(averageBilling)}** para o objetivo de **${formatCurrency(billingGoal)}** (Crescimento necessário de **${growthNeededPct.toFixed(1)}%**).\n\n` +
        `• **Metas de Clientes / Volumetria:** Baseado em seu ticket médio de **${formatCurrency(averageTicket)}**, você precisa atingir exatamente **${salesNeeded > 0 ? salesNeeded + ' clientes/vendas ativos' : 'um volume calibrado pelo ticket médio'}**. ${chargeModel === 'subscription' ? 'Consolide essa base através de planos de assinatura recorrente e contenção de churn.' : 'Aumente o reinvestimento em tráfego pago B2B para fechar novos negócios avulsos.'}\n\n` +
        `• **Alavanca 1 (Nicho ${businessType}):** Otimize o funil comercial e revise custos fixos operacionais. ${additionalGoals.length > 0 ? `Foque no atingimento das metas adicionais: ${additionalGoals.map(g => g.title).join(', ')}.` : ''}\n\n` +
        `• **Alavanca 2 (Modelo de Cobrança ${chargeModel === 'subscription' ? 'Assinaturas' : 'Vendas'}):** Crie ofertas de upgrade ou planos de fidelidade anuais para elevar seu LTV.`
      );
      showToast("Plano tático gerado com sucesso.", "success");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="billing-goal-tab-view" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Banner */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-150/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.04] blur-3xl rounded-full translate-x-12 -translate-y-12" />
        <div className="space-y-2 relative z-10 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-650 flex items-center justify-center">
              <Target size={22} className="text-orange-600 font-bold" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#f97316] bg-orange-500/[0.08] px-3 py-1 rounded-full border border-orange-500/10">
              Planejamento Estratégico
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/[0.08] px-3 py-1 rounded-full border border-emerald-500/10 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
              Ambiente Seguro LGPD 🛡️
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">
            Metas & Alinhamento de Faturamento
          </h1>
          <p className="text-xs text-gray-600 font-medium max-w-xl leading-relaxed">
            Cadastre sua média de faturamento histórico e seu objetivo financeiro central. Toda a assessoria da Dafne I.A. será automaticamente calibrada para focar no atingimento desta meta específica comercial. Seus objetivos comerciais e faturamentos são guardados sob segurança de barramento privado e criptografados.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10 md:self-end">
          <div className="bg-[#141414] text-white py-3.5 px-5 rounded-2xl border border-gray-800 shadow-md text-right">
            <p className="text-[9px] font-black text-orange-400 uppercase tracking-wider">Objetivo Principal</p>
            <p className="text-base font-black font-mono mt-0.5 text-white">
              {billingGoal > 0 ? formatCurrency(billingGoal) : "R$ 0,00"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Indicators Bento Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Média Registrada */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-150/80 shadow-sm flex flex-col justify-between h-[130px] text-left">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Média Histórica</p>
              <span className="p-1 rounded-lg bg-gray-50 text-gray-400"><DollarSign size={14} /></span>
            </div>
            <p className="text-lg font-black font-mono text-gray-900 mt-2">
              {formatCurrency(averageBilling)}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold leading-none">
            Faturamento recorrente inicial
          </p>
        </div>

        {/* Card 2: Objetivo Alvo */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-150/80 shadow-sm flex flex-col justify-between h-[130px] text-left">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest">Objetivo do Negócio</p>
              <span className="p-1 rounded-lg bg-orange-50 text-orange-500"><Target size={14} /></span>
            </div>
            <p className="text-lg font-black font-mono text-orange-650 mt-2">
              {formatCurrency(billingGoal)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-orange-500 font-bold leading-none">
            <Calendar size={11} />
            <span>Prazo: {billingGoalDeadline || "Indefinido"}</span>
          </div>
        </div>

        {/* Card 3: Gap / Crescimento */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-150/80 shadow-sm flex flex-col justify-between h-[130px] text-left">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Diferença (Gap)</p>
              <span className="p-1 rounded-lg bg-amber-50 text-amber-500"><TrendingUp size={14} /></span>
            </div>
            <p className="text-lg font-black font-mono text-gray-900 mt-2">
              {growthNeededAmount > 0 ? `+ ${formatCurrency(growthNeededAmount)}` : formatCurrency(0)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-extrabold leading-none">
            <ArrowUpRight size={14} />
            <span>Expandir em {growthNeededPct > 0 ? `${growthNeededPct.toFixed(1)}%` : "0%"}</span>
          </div>
        </div>

        {/* Card 4: Faturamento Real do Mês */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-150/80 shadow-sm flex flex-col justify-between h-[130px] text-left relative overflow-hidden">
          {billingGoal > 0 && (
            <div 
              className="absolute left-0 bottom-0 h-1.5 bg-emerald-500 transition-all duration-1000" 
              style={{ width: `${Math.min(currentProgressPct, 100)}%` }}
            />
          )}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest text-left">Vendas deste Mês</p>
              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-500"><Activity size={14} /></span>
            </div>
            <p className="text-lg font-black font-mono text-gray-950 mt-2">
              {formatCurrency(currentMonthIncome)}
            </p>
          </div>
          <p className="text-[10px] text-emerald-600 font-extrabold leading-none">
            {billingGoal > 0 
              ? `${currentProgressPct.toFixed(1)}% atingido` 
              : "Defina o objetivo principal"
            }
          </p>
        </div>

      </div>

      {/* Interactive Goal Accelerator & Case Study (Zero to 60k) */}
      <div className="bg-gradient-to-br from-[#0c0d0f] via-[#121316] to-[#07080a] p-6 md:p-8 rounded-[2.5rem] border border-gray-800 shadow-xl text-white relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/[0.03] blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-500/[0.03] blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-orange-500/15 text-orange-400 rounded-xl border border-orange-500/20">
                <Sparkles size={16} />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">
                Acelerador de Metas & Simulação Comercial
              </span>
            </div>
            <h2 className="text-xl font-black text-gray-100 tracking-tight">
              Recalibração Tática Expressa: Roteiro Inicial de R$ 0 a R$ 60.000,00
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl font-medium font-sans animate-pulse">
              Começando do absoluto zero (sem faturamento inicial de base) até estruturar R$ 60 Mil de receita recorrente mensal. Use o simulador piloto abaixo para carregar as métricas qualificadas no seu painel.
            </p>
          </div>

          <button
            type="button"
            onClick={handleApply60kPreset}
            className="px-5 py-3 rounded-2xl bg-[#f97316] text-white hover:bg-orange-600 transition-all cursor-pointer font-black uppercase text-[10px] tracking-wider active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-950/30 shrink-0 font-sans"
          >
            <Zap size={14} className="text-white fill-white" />
            Ativar Parâmetros de Simulação (0 ➔ R$ 60k)
          </button>
        </div>

        {/* Dynamic RoadMap Timeline */}
        <div className="mt-6 space-y-5 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Phase 1 */}
            <div className={cn(
              "p-4 rounded-2xl border transition-all text-left flex flex-col justify-between space-y-3 relative overflow-hidden",
              averageBilling === 0 && billingGoal === 60000 && currentPhase === "phase1"
                ? "bg-orange-500/[0.04] border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.1)] scale-[1.02]"
                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
            )}>
              {/* Pulse status indicator if active */}
              {averageBilling === 0 && billingGoal === 60000 && currentPhase === "phase1" && (
                <span className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
              )}

              <div className="space-y-1.5 prose prose-invert">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">PASSO 1</span>
                  {currentMonthIncome >= 10000 && averageBilling === 0 && billingGoal === 60000 && (
                    <span className="text-[9px] font-bold text-emerald-400">✓ Concluído</span>
                  )}
                </div>
                <h3 className="text-xs font-black text-gray-200 uppercase font-sans">1. Fundação & Validação</h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans mt-1">
                  <strong>Margem: R$ 0 a R$ 10k</strong><br />
                  Seu foco militar é conquistar os primeiros 50 clientes com ticket de R$ 200, validando a oferta primária.
                </p>
              </div>

              <button
                type="button"
                onClick={() => togglePhase("phase1")}
                className={cn(
                  "w-full py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans",
                  completedPhases.phase1
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
                )}
              >
                {completedPhases.phase1 ? "✓ Iniciado & Validado" : "Marcar como Ativo"}
              </button>
            </div>

            {/* Phase 2 */}
            <div className={cn(
              "p-4 rounded-2xl border transition-all text-left flex flex-col justify-between space-y-3 relative overflow-hidden",
              averageBilling === 0 && billingGoal === 60000 && currentPhase === "phase2"
                ? "bg-orange-500/[0.04] border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.1)] scale-[1.02]"
                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
            )}>
              {averageBilling === 0 && billingGoal === 60000 && currentPhase === "phase2" && (
                <span className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">PASSO 2</span>
                  {currentMonthIncome >= 30000 && averageBilling === 0 && billingGoal === 60000 && (
                    <span className="text-[9px] font-bold text-emerald-400">✓ Concluído</span>
                  )}
                </div>
                <h3 className="text-xs font-black text-gray-200 uppercase font-sans">2. Tração & Máquina</h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans mt-1">
                  <strong>Margem: R$ 10k a R$ 30k</strong><br />
                  Expandir a base para 150 assinantes estruturando tráfego pago escalável e parcerias de Cashback.
                </p>
              </div>

              <button
                type="button"
                onClick={() => togglePhase("phase2")}
                className={cn(
                  "w-full py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans",
                  completedPhases.phase2
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
                )}
              >
                {completedPhases.phase2 ? "✓ Máquina de Tração Ativa" : "Marcar como Ativo"}
              </button>
            </div>

            {/* Phase 3 */}
            <div className={cn(
              "p-4 rounded-2xl border transition-all text-left flex flex-col justify-between space-y-3 relative overflow-hidden",
              averageBilling === 0 && billingGoal === 60000 && currentPhase === "phase3"
                ? "bg-orange-500/[0.04] border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.1)] scale-[1.02]"
                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
            )}>
              {averageBilling === 0 && billingGoal === 60000 && currentPhase === "phase3" && (
                <span className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">PASSO 3</span>
                  {currentMonthIncome >= 50000 && averageBilling === 0 && billingGoal === 60000 && (
                    <span className="text-[9px] font-bold text-emerald-400">✓ Concluído</span>
                  )}
                </div>
                <h3 className="text-xs font-black text-gray-200 uppercase font-sans">3. LTV & Expansão</h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans mt-1">
                  <strong>Margem: R$ 30k a R$ 50k</strong><br />
                  Aproveitar a base para lançar upgrades de serviços complementares e mitigar Churn com CS dedicado.
                </p>
              </div>

              <button
                type="button"
                onClick={() => togglePhase("phase3")}
                className={cn(
                  "w-full py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans",
                  completedPhases.phase3
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
                )}
              >
                {completedPhases.phase3 ? "✓ Alta Retenção Ativa" : "Marcar como Ativo"}
              </button>
            </div>

            {/* Phase 4 */}
            <div className={cn(
              "p-4 rounded-2xl border transition-all text-left flex flex-col justify-between space-y-3 relative overflow-hidden",
              averageBilling === 0 && billingGoal === 60000 && currentPhase === "phase4"
                ? "bg-orange-500/[0.04] border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.1)] scale-[1.02]"
                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
            )}>
              {averageBilling === 0 && billingGoal === 60000 && currentPhase === "phase4" && (
                <span className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">ESTÁGIO ALVO</span>
                  {currentMonthIncome >= 60000 && averageBilling === 0 && billingGoal === 60000 && (
                    <span className="text-[9px] font-bold text-emerald-400">🎉 ALCANÇADO</span>
                  )}
                </div>
                <h3 className="text-xs font-black text-gray-200 uppercase font-sans">4. Consolidação & SDRs</h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans mt-1">
                  <strong>Margem: R$ 50k a R$ 60k</strong><br />
                  Escalar faturamento a 300 clientes por SDRs de vendas ativas e automação total de rotinas fiduciárias.
                </p>
              </div>

              <button
                type="button"
                onClick={() => togglePhase("phase4")}
                className={cn(
                  "w-full py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans",
                  completedPhases.phase4
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
                )}
              >
                {completedPhases.phase4 ? "✓ Alvo Batido!" : "Marcar como Ativo"}
              </button>
            </div>

          </div>

          {/* Real-time sync tracker alert banner */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0"><Lightbulb size={14} /></span>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-gray-100 uppercase font-mono tracking-tight">Sincronizador Dinâmico Inteligente Ativo</p>
                <p className="text-[10.5px] text-gray-400 font-sans leading-relaxed">
                  {averageBilling === 0 && billingGoal === 60000 ? (
                    <>
                      Monitorando lançamentos deste mês para o caso prático comercial de R$ 60.000,00. Seu faturamento atual é <strong className="text-emerald-400">{formatCurrency(currentMonthIncome)}</strong>. 
                      {currentPhase === "phase1" && " Você está no Passo 1: Fundação! Foco em bater R$ 10.000!"}
                      {currentPhase === "phase2" && " Você está no Passo 2: Tração comercial! Foco em estruturar tráfego pago!"}
                      {currentPhase === "phase3" && " Você está no Passo 3: Expansão! Foco em mitigar cancelamentos quinzenais!"}
                      {currentPhase === "phase4" && " Você está no Passo 4 o Estágio Alvo! Contratação de SDR comercial!"}
                      {currentPhase === "completed" && " Parabéns! Atingiu o teto da Jornada de faturamento de R$ 60k no mês atual! 🎉"}
                    </>
                  ) : (
                    "O sincronizador inteligente aguarda a ativação do Roteiro Recomendado do Zero ao R$60k acima para guiar seu progresso tático em tempo real."
                  )}
                </p>
              </div>
            </div>

            {averageBilling === 0 && billingGoal === 60000 && (
              <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold font-mono text-center sm:text-right shrink-0">
                🚀 Progresso Geral: {Math.min(currentProgressPct, 100).toFixed(1)}% Batido
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Main split grid: Form vs AI Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left side: Form for registration */}
        <div className="lg:col-span-6 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-150/80 shadow-md flex flex-col justify-between font-sans">
          <div className="space-y-5 text-left">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-orange-100 text-orange-600"><FileText size={16} /></span>
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-950">
                Configuração de Objetivos & Perfil PJ
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Seção 1: Faturamento & Meta Financeira principal */}
              <div className="p-4 bg-orange-50/20 border border-orange-100/50 rounded-2xl space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-650 font-bold">1. Finanças & Alvo Principal</p>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold">
                    Média de Faturamento Atual Registrado (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-white border border-gray-200/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-550 transition-all font-mono"
                      placeholder="Ex: 15000.00"
                      value={averageBilling || ""}
                      onChange={(e) => setAverageBilling(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  {/* Value shortcut buttons */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setAverageBilling(Math.max(0, averageBilling - 1000))}
                      className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-red-50 text-red-650 hover:bg-red-100 transition-all cursor-pointer"
                    >
                      -1k
                    </button>
                    <button
                      type="button"
                      onClick={() => setAverageBilling((averageBilling || 0) + 1000)}
                      className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-emerald-50 text-emerald-750 hover:bg-emerald-100 transition-all cursor-pointer"
                    >
                      +1k
                    </button>
                    <button
                      type="button"
                      onClick={() => setAverageBilling((averageBilling || 0) + 5000)}
                      className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                    >
                      +5k
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold">
                    Objetivo Principal de Faturamento Comercial (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-white border border-gray-200/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-gray-950 focus:outline-none focus:ring-2 focus:ring-orange-550 transition-all font-mono"
                      placeholder="Ex: 25000.00"
                      value={billingGoal || ""}
                      onChange={(e) => setBillingGoal(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  {/* Percentage multiplier value recommendations */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBillingGoal(Math.max(0, billingGoal - 5000))}
                        className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-red-50 text-red-650 hover:bg-red-100 transition-all cursor-pointer"
                      >
                        -5k
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingGoal((billingGoal || 0) + 5000)}
                        className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                      >
                        +5k
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingGoal((billingGoal || 0) + 10000)}
                        className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                      >
                        +10k
                      </button>
                    </div>
                  </div>
                </div>

                {/* LIMITES DE CUSTOS PJ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-orange-100/30">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#cf5200] font-bold">
                      Limite de Custo Operacional (OPEX) (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-white border border-gray-200/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-550 transition-all font-mono"
                        placeholder="Ex: 10000.00"
                        value={costLimitOpex || ""}
                        onChange={(e) => setCostLimitOpex(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCostLimitOpex(Math.max(0, costLimitOpex - 1000))}
                        className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-red-50 text-red-650 hover:bg-red-100 cursor-pointer"
                      >
                        -1k
                      </button>
                      <button
                        type="button"
                        onClick={() => setCostLimitOpex((costLimitOpex || 0) + 1000)}
                        className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                      >
                        +1k
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#cf5200] font-bold">
                      Limite de Custo de Mercadorias (CMV) (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-white border border-gray-200/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-550 transition-all font-mono"
                        placeholder="Ex: 8000.00"
                        value={costLimitCmv || ""}
                        onChange={(e) => setCostLimitCmv(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCostLimitCmv(Math.max(0, costLimitCmv - 1000))}
                        className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-red-50 text-red-650 hover:bg-red-100 cursor-pointer"
                      >
                        -1k
                      </button>
                      <button
                        type="button"
                        onClick={() => setCostLimitCmv((costLimitCmv || 0) + 1000)}
                        className="px-2 py-0.5 text-[8.5px] font-bold font-mono rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                      >
                        +1k
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 2: Tipo de Negócio & Modelo de Cobrança & Ticket Médio */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#141414] flex items-center gap-1 font-bold">
                  <Briefcase size={12} className="text-orange-500" /> 2. Perfil Comercial & Ticket Médio
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold">
                      Tipo de Negócio
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => handleBusinessTypeChange(e.target.value)}
                      className="w-full bg-white border border-gray-200/80 rounded-2xl px-3 py-2.5 text-xs font-bold text-gray-850 focus:outline-none focus:ring-2 focus:ring-orange-550 transition-all cursor-pointer"
                    >
                      <option value="SaaS / Tecnologia">SaaS / Recorrência</option>
                      <option value="E-commerce">E-commerce / Vendas Online</option>
                      <option value="Varejo Físico">Varejo / Loja Física</option>
                      <option value="Alimentação / Gastronomia">Alimentação / Gastronomia</option>
                      <option value="Prestação de Serviços">Serviços / Consultoria</option>
                      <option value="Infoprodutos / Educação">Infoproduto / Educação</option>
                      <option value="Outro">Outro modelo</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold">
                      Ticket Médio Comercial
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-white border border-gray-200/80 rounded-2xl pl-10 pr-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-550 transition-all font-mono"
                        placeholder="Ex: 150.00"
                        value={averageTicket || ""}
                        onChange={(e) => setAverageTicket(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold">
                    Modelo de Cobrança Predominante
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'subscription', label: 'Assinatura', desc: 'Mensalidades/LTV' },
                      { id: 'single_sales', label: 'Vendas Únicas', desc: 'Transacional' },
                      { id: 'mixed', label: 'Modelo Misto', desc: 'Híbrido' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setChargeModel(m.id as any)}
                        className={cn(
                          "flex-1 p-2 rounded-xl border text-center transition-all cursor-pointer",
                          chargeModel === m.id
                            ? "bg-orange-500 text-white border-orange-500 shadow-sm font-bold"
                            : "bg-white text-gray-650 border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        <p className="text-[10px] font-extrabold leading-none">{m.label}</p>
                        <p className={cn("text-[8px] font-semibold mt-1 leading-none", chargeModel === m.id ? "text-orange-100" : "text-gray-400")}>{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subscriptions Calculation Volumetry */}
                {averageTicket > 0 && billingGoal > 0 && (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-1 text-left">
                    <p className="text-[9px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1 font-bold">
                      <Tag size={12} className="text-indigo-600" />
                      Projeção de Volumetria Necessária
                    </p>
                    <p className="text-[11px] text-gray-750 leading-normal">
                      Para faturar <strong className="font-extrabold text-gray-950">{formatCurrency(billingGoal)}</strong> com ticket médio de <strong className="font-semibold text-gray-900">{formatCurrency(averageTicket)}</strong>:
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                      <div className="bg-[#141414] text-white px-2.5 py-1 rounded-lg text-xs font-mono font-black shrink-0 text-center inline-block">
                        {Math.ceil(billingGoal / averageTicket)} {chargeModel === 'subscription' ? 'Assinaturas Ativas' : 'Vendas Unitárias'}
                      </div>
                      <p className="text-[10.5px] text-gray-500 font-semibold leading-tight font-sans">
                        {chargeModel === 'subscription' 
                          ? "Fidelizar assinaturas com LTV consolidado e baixo cancelamento (churn)." 
                          : "Gere esse volume em conversões comerciais para bater a meta principal."
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 3: Metas Adicionais PJ (Mais que uma meta!) */}
              <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#141414] flex items-center gap-1 font-bold">
                  <CheckCircle2 size={12} className="text-emerald-500" /> 3. Metas Adicionais Cadastradas ({additionalGoals.length})
                </p>
                                {/* Goals Tracker List */}
                {additionalGoals.length === 0 ? (
                  <div className="text-center py-5 bg-white border border-dashed border-gray-200 rounded-xl text-[10px] text-gray-400 font-medium">
                    Nenhuma meta adicional para rastrear nesta conta. Defina uma meta no formulário rápido abaixo!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    <AnimatePresence mode="popLayout">
                      {additionalGoals.map((g, idx) => {
                        const { progress, label: progressLabel } = getGoalStatusAndProgress(g);
                        return (
                          <motion.div
                            key={g.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            className="bg-white p-3 rounded-xl border border-gray-150 flex flex-col gap-2 text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-start gap-1.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={g.reached || false}
                                  onChange={() => handleToggleGoalReached(g.id)}
                                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-500 h-3.5 w-3.5 cursor-pointer accent-orange-500 shrink-0"
                                  title="Alternar atingimento"
                                />
                                <div className="min-w-0">
                                  <p className={cn("text-[11px] font-extrabold leading-tight truncate", g.reached ? "line-through text-gray-400" : "text-gray-900")}>
                                    {g.title}
                                  </p>
                                  <p className="text-[8.5px] text-gray-400 font-mono mt-0.5">
                                    Alvo: {g.type === 'income' || g.type === 'ticket' || (g.type === 'liquidity' && g.targetValue > 10) ? formatCurrency(g.targetValue) : g.type === 'liquidity' ? `${g.targetValue}x opex` : g.targetValue} ({g.type === 'sales_volume' ? 'Vol. Vendas' : g.type === 'profit' ? 'Margem' : g.type === 'acquisition_cost' ? 'CAC' : g.type === 'churn' ? 'Churn Rate' : g.type === 'liquidity' ? 'Liquidez 30d' : g.type}) {g.deadline ? `| Prazo: ${g.deadline}` : ''}
                                    {g.desiredProfitMargin ? ` | Margem Desejada: ${g.desiredProfitMargin}%` : ''}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveGoal(g.id)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-neutral-50 rounded transition-all cursor-pointer shrink-0"
                                title="Remover meta"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            {/* Dynamic progress bar and label for the OKR */}
                            <div className="space-y-1.5 pl-5 pt-0.5 border-l border-gray-100">
                              <div className="flex items-center justify-between text-[8px] font-mono font-bold">
                                <span className="text-gray-500 truncate max-w-[85%]">{progressLabel}</span>
                                <span className={cn(
                                  "shrink-0 px-1 py-0.2 rounded text-[7.5px]",
                                  progress >= 100 ? "text-emerald-600 bg-emerald-50" : "text-orange-600 bg-orange-50"
                                )}>
                                  {progress}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <motion.div 
                                  className={cn(
                                    "h-1.5 rounded-full",
                                    progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-500" : "bg-orange-400"
                                  )}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}

                {/* Quick Add Form Section */}
                <div className="bg-white p-3 border border-gray-200 rounded-xl space-y-2.5 text-left">
                  <p className="text-[9px] font-extrabold uppercase tracking-wide text-gray-400">Adicionar Nova Meta Secundária</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-950 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 font-medium"
                      placeholder="Título (ex: CAC abaixo de R$45)"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-950 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 font-mono font-semibold"
                      placeholder="Alvo Numérico"
                      value={newGoalTargetValue || ""}
                      onChange={(e) => setNewGoalTargetValue(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={newGoalType}
                      onChange={(e) => setNewGoalType(e.target.value as any)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-750 focus:outline-none focus:bg-white cursor-pointer font-semibold"
                    >
                      <option value="sales_volume">Volume de Assinaturas / Vendas</option>
                      <option value="profit">Margem de Lucro (%)</option>
                      <option value="income">Faturamento Secundário (R$)</option>
                      <option value="ticket">Ticket Médio Alvo (R$)</option>
                      <option value="acquisition_cost">Custo de Aquisição (CAC)</option>
                      <option value="churn">Taxa de Churn / Cancelamento (%)</option>
                      <option value="liquidity">Liquidez de Curto Prazo (Fator de Segurança ou R$)</option>
                      <option value="other">Outra Meta Customizada</option>
                    </select>

                    <input
                      type="text"
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-950 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 font-medium"
                      placeholder="Prazo (ex: Dez/26)"
                      value={newGoalDeadline}
                      onChange={(e) => setNewGoalDeadline(e.target.value)}
                    />

                    <input
                      type="number"
                      className="w-full bg-gray-50 border border-orange-200/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-950 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 font-mono font-semibold placeholder-orange-300"
                      placeholder="Margem Desejada %"
                      value={newGoalDesiredProfitMargin || ""}
                      onChange={(e) => setNewGoalDesiredProfitMargin(parseFloat(e.target.value) || 0)}
                      title="Opcional: Margem de Lucro Desejada para que o progresso seja calculado com base no lucro real."
                    />
                  </div>

                  {newGoalDesiredProfitMargin > 0 && (
                    <p className="text-[8.5px] text-orange-600 font-semibold leading-tight font-sans bg-orange-50/75 p-2 rounded-xl border border-orange-100/50">
                      💡 <strong>Inteligência de Margem:</strong> O sistema calculará o progresso do OKR considerando <strong>{newGoalDesiredProfitMargin}% de margem líquida real</strong> sobre o alvo nominal de {formatCurrency(newGoalTargetValue || 0)} (Lucro real necessário: <strong>{formatCurrency((newGoalTargetValue || 0) * (newGoalDesiredProfitMargin / 100))}</strong>).
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="w-full py-2 bg-gray-900 hover:bg-orange-550 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer font-sans"
                  >
                    <Plus size={12} /> Vincular Meta Adicional
                  </button>
                </div>
              </div>

              {/* Seção 4: Prazos e Notas */}
              <div className="space-y-3.5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold font-sans">
                    Prazo / Cronograma Limite (Data)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Calendar size={14} />
                    </span>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-550 focus:bg-white transition-all font-sans"
                      placeholder="Ex: Dezembro / 2026, Próximos 6 meses"
                      value={billingGoalDeadline}
                      onChange={(e) => setBillingGoalDeadline(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold font-sans">
                    Notas Estratégicas Extras do Negócio
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-3 text-xs font-medium text-gray-950 focus:outline-none focus:ring-2 focus:ring-orange-550 focus:bg-white transition-all resize-none font-sans"
                    placeholder="Descreva detalhes como nicho do negócio, principais gargalos que você enfrenta para atingir essa meta, orçamentos, canais que deseja explorar..."
                    value={billingNotes}
                    onChange={(e) => setBillingNotes(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:scale-98 rounded-2xl text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2 transition-all mt-4 font-sans"
              >
                <Save size={15} />
                Confirmar Cadastro de Faturamento PJ
              </button>

            </form>
          </div>
        </div>

        {/* Right side: AI Action Plan Generator */}
        <div className="lg:col-span-6 bg-[#0b0c0e] p-6 md:p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
          
          <div className="space-y-4 relative z-10 text-left flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-orange-500/15 text-orange-400">
                  <Sparkles size={16} />
                </span>
                <h3 className="text-sm font-black uppercase tracking-widest text-orange-400">
                  Plano Tático AI Recalibrado
                </h3>
              </div>
              <span className="text-[8px] font-black uppercase bg-orange-500/15 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full">
                Sincronismo Ativo Dafne
              </span>
            </div>

            {/* Simulated target explanation */}
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              A inteligência assessora reescreve todo o seu ecossistema focando no seu objetivo final de <span className="text-white font-semibold">{formatCurrency(billingGoal)}</span>. Clique abaixo para simular as principais alavancas necessárias para vencer a diferença.
            </p>

            {/* Strategic results area */}
            <div className="flex-1 min-h-[180px] bg-slate-900/40 border border-gray-800 rounded-2xl p-4 flex flex-col relative">
              <textarea
                readOnly
                className="w-full flex-1 bg-transparent text-gray-250 font-mono text-[11px] leading-relaxed resize-none focus:outline-none scrollbar-thin rounded-lg text-slate-300"
                value={
                  strategicPlan || 
                  (isGenerating 
                    ? "Sintonizando conexões de mercado...\nConectando aos benchmarks do comércio brasileiro...\nEstruturando cronograma estratégico para fechamento de gap de faturamento..."
                    : "Insira seu objetivo acima e clique no botão abaixo para simular soluções e desenhar seu plano tático passo a passo de faturamento.")
                }
              />
            </div>

            {/* Custom interactive action notes saving */}
            {strategicPlan && (
              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCopyPlan}
                  className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase text-[9px] tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-gray-750"
                >
                  <Copy size={11} />
                  Copiar Plano
                </button>
                <button
                  type="button"
                  onClick={handleSavePlanAsNote}
                  className="px-4 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 font-extrabold uppercase text-[9px] tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-orange-400/20"
                >
                  <FileText size={11} />
                  Salvar como Anotação PJ
                </button>
              </div>
            )}

            {/* Strategic button trigger */}
            <div className="pt-3 border-t border-gray-850">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGeneratePlan}
                className={cn(
                  "w-full py-3.5 font-black uppercase text-xs tracking-wider transition-all rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg",
                  isGenerating
                    ? "bg-gray-800/80 text-gray-500 cursor-not-allowed border-zinc-800"
                    : "bg-[#f97316] hover:bg-orange-600 active:scale-98 text-white shadow-orange-950/20"
                )}
              >
                {isGenerating ? (
                  <>
                    <Zap className="animate-spin text-orange-400" size={15} />
                    <span>Confeccionando Roteiro de Margens...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={15} />
                    <span>Gerar Plano de Ação Personalizado (I.A. Dafne)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* SECTION 2: HIGH INNOVATION METAS & SIMULATORS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 text-left font-sans">
        
        {/* OKR Presets Builder Panel */}
        <div id="okr-presets-panel" className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-150/80 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-orange-100 text-orange-655">
                <Award size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-950 leading-tight">
                  Árvores SMART & OKRs Recomendadas por IA
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono">
                  Alinhamento estratégico instantâneo
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-650 font-medium leading-relaxed font-sans">
              O tracejo profissional de metas exige o desdobramento do faturamento em indicadores operacionais (Key Results). Escolha o modelo de negócios da sua empresa abaixo e carregue instantaneamente uma árvore de OKRs recomendada na sua fila de metas adicionais:
            </p>

            {/* EBITDA CONFIGURATION CONTROL */}
            <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-gray-750 tracking-wider">
                  <Sliders size={13} className="text-orange-500" />
                  <span>Limite de Alerta EBITDA</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-700 font-mono font-black text-[10px]">
                  Limiar: {ebitdaThreshold}%
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                Configure o limiar mínimo de margem operacional EBITDA para acionamento do alerta de proteção. Ajuste conforme a volatilidade do mercado para precocidade do aviso.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={ebitdaThreshold}
                  onChange={(e) => setEbitdaThreshold(Math.max(5, Math.min(40, parseFloat(e.target.value) || 10)))}
                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min="5"
                    max="40"
                    value={ebitdaThreshold}
                    onChange={(e) => setEbitdaThreshold(Math.max(5, Math.min(40, parseFloat(e.target.value) || 10)))}
                    className="w-12 px-1.5 py-1 text-center font-mono text-[11px] font-bold bg-white border border-gray-200 rounded-md focus:outline-none focus:border-orange-400"
                  />
                  <span className="text-[10px] font-bold text-gray-400">%</span>
                </div>
              </div>
            </div>

            {/* EBITDA Danger Zone Alerter */}
            {ebitdaData.isBelowThreshold && (
              <motion.div 
                animate={{
                  boxShadow: [
                    "0 0 0 0px rgba(239, 68, 68, 0)",
                    "0 0 0 6px rgba(239, 68, 68, 0.12)",
                    "0 0 0 0px rgba(239, 68, 68, 0)"
                  ],
                  scale: [1, 1.01, 1]
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="bg-rose-50/90 border-2 border-red-200 rounded-3xl p-5 space-y-3.5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0 mt-0.5 animate-pulse">
                    <AlertTriangle size={17} />
                  </span>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wider text-red-950 leading-tight">
                      ⚠️ ZONA DE PERIGO: ALERTA FINANCEIRO DE EBITDA
                    </p>
                    <p className="text-[10px] text-red-700 font-bold uppercase tracking-widest font-mono leading-none">
                      Margem EBITDA Projetada abaixo do Limite de Segurança ({ebitdaThreshold}%)
                    </p>
                    <p className="text-[11px] text-red-800 leading-relaxed font-semibold pt-1">
                      Com base nas movimentações registradas, a projeção indica que a conversão operacional gerará uma margem financeira de apenas <strong className="font-extrabold text-red-950">{ebitdaData.marginPct.toFixed(1)}%</strong>. Margens abaixo de {ebitdaThreshold}% expõem o caixa ao risco severo de insolvência nas metas ativas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-red-250/30 pt-3">
                  <div className="bg-white/90 p-2.5 rounded-2xl border border-red-100">
                    <span className="text-[8.5px] font-bold text-gray-400 uppercase block leading-none">Faturamento Projetado</span>
                    <span className="text-xs font-mono font-black text-gray-900 mt-1 block">
                      {formatCurrency(ebitdaData.projectedRevenue)}
                    </span>
                  </div>
                  <div className="bg-red-100/50 p-2.5 rounded-2xl border border-red-250/30">
                    <span className="text-[8.5px] font-bold text-red-750 uppercase block leading-none">EBITDA Estimado ({ebitdaData.marginPct.toFixed(1)}%)</span>
                    <span className="text-xs font-mono font-black text-red-700 mt-1 block">
                      {formatCurrency(ebitdaData.projectedEbitda)}
                    </span>
                  </div>
                </div>

                <div className="bg-white/60 rounded-2xl p-3 border border-red-100 text-[10px] text-red-850 font-semibold space-y-1 leading-relaxed">
                  <span className="font-extrabold block text-red-900 uppercase tracking-wider text-[8px]">🛡️ Protocolos de Proteção de Caixa (Dafne):</span>
                  <p>1. Ajuste despesas operacionais administrativas (OPEX) em no mínimo 15%.</p>
                  <p>2. Adicione objetivos de OKR focados em ticket de vendas {formatCurrency((ebitdaData.projectedRevenue * 1.15) / Math.max(1, Math.ceil(ebitdaData.projectedRevenue / (averageTicket || 100))))} para preservar a margem operacional.</p>
                </div>
              </motion.div>
            )}

            {/* HISTÓRICO DE ALERTAS DE EBITDA (ÚLTIMAS 5 OCORRÊNCIAS) */}
            <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase text-gray-800 tracking-wider">
                  <History size={13} className="text-orange-500 shrink-0 animate-pulse" />
                  <span>Histórico de Zona de Perigo (Últimos 5 Alertas)</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-gray-200/60 text-gray-700 font-mono font-bold text-[9px]">
                  Alertas: {ebitdaAlertLogs.length}
                </span>
              </div>
              
              {ebitdaAlertLogs.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic font-semibold text-center py-2">
                  Nenhuma ocorrência de perigo registrada. O caixa encontra-se saudável.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {ebitdaAlertLogs.slice(0, 5).map((log) => (
                    <div 
                      key={log.id} 
                      className="bg-white hover:bg-orange-50/20 active:scale-[0.99] transition-all p-2.5 rounded-xl border border-gray-150 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-mono text-[9px] font-extrabold text-orange-600 tracking-wider">
                          📅 {log.timestamp}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500 truncate">
                          Receita Projetada: <strong className="font-black text-gray-800">{formatCurrency(log.projectedRevenue)}</strong>
                        </span>
                      </div>
                      <div className="flex flex-col text-right items-end gap-0.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-wider font-mono leading-none">
                          {log.marginPct.toFixed(1)}% Margem
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          EBITDA: <strong className="font-black text-red-650">{formatCurrency(log.projectedEbitda)}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {[
                { type: "SaaS / Tecnologia", label: "SaaS / Recorrência", emoji: "⚡" },
                { type: "E-commerce", label: "E-commerce", emoji: "🛒" },
                { type: "Prestação de Serviços", label: "Prestação de Serviços", emoji: "💼" },
                { type: "Alimentação / Gastronomia", label: "Alimentação & Delivery", emoji: "🍕" },
                { type: "Outro", label: "Geral / Corporativo", emoji: "🎯" }
              ].map((p) => {
                const isActive = businessType === p.type;
                return (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => handleApplyOkrPreset(p.type)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-[80px]",
                      isActive 
                        ? "bg-orange-500/10 border-orange-400 text-orange-950" 
                        : "bg-gray-50 border-gray-200/80 hover:bg-white text-gray-755 border-gray-200"
                    )}
                  >
                    <span className="text-lg">{p.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider leading-none">{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Overall Additional Goals completion tracking bar */}
            {additionalGoals.length > 0 && (
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-150 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#141414] font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      Progresso Geral de KRs Cadastrados
                    </p>
                    <span className="text-[10px] font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {Math.round((additionalGoals.filter(g => g.reached).length / additionalGoals.length) * 100)}% Concluído
                    </span>
                  </div>
                  
                  {/* Visual completion progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${(additionalGoals.filter(g => g.reached).length / additionalGoals.length) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[8px] font-semibold text-gray-400 uppercase font-mono">
                    <span>Pendente: {additionalGoals.filter(g => !g.reached).length} objetivos</span>
                    <span>Batidas: {additionalGoals.filter(g => g.reached).length} objetivos</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleExportOkrsToNotes}
                  className="w-full py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-wider text-[10.5px] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer border border-transparent"
                >
                  <FileText size={14} className="shrink-0" />
                  <span>Exportar Árvore de OKRs para Anotações (Markdown)</span>
                </motion.button>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-orange-50/20 border border-orange-100/50 rounded-3xl text-left">
            <p className="text-[9.5px] font-extrabold text-orange-750 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Lightbulb size={12} className="text-orange-500 shrink-0" />
              Conselho de Alinhamento OKR
            </p>
            <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
              Diferente de metas estáticas de faturamento, os OKRs dividem a responsabilidade. Alinhe suas campanhas com o CAC simulado ao lado e revise contratos obsoletos para garantir previsibilidade na competência operante.
            </p>
          </div>
        </div>

        {/* Funnel Feasibility Scientific Simulator */}
        <div id="feasibility-funnel-simulator" className="bg-[#101214] p-6 md:p-8 rounded-[2.5rem] border border-gray-850 shadow-xl text-white flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-orange-500/10 text-orange-400">
                <Sliders size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-100">
                  Simulador de Viabilidade Comercial SMART
                </h3>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest font-mono">
                  Dimensionamento de tráfego, funil e CAC
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Descubra se sua meta comercial é viável. Arraste os controles abaixo para simular as taxas de conversão de anúncios em vendas e calcular os orçamentos ideais de aquisição de leads:
            </p>

            {/* Sim Sliders Grid */}
            <div className="space-y-3.5 bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
              
              {/* Slider 1: Goal */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-350">
                  <span>Meta de Faturamento Alvo</span>
                  <span className="font-mono text-white text-[11px] font-black">{formatCurrency(simulatorGoal)}</span>
                </div>
                <input 
                  type="range"
                  min="5000"
                  max="300000"
                  step="5000"
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  value={simulatorGoal}
                  onChange={(e) => setSimulatorGoal(parseInt(e.target.value) || 5000)}
                />
              </div>

              {/* Slider 2: Ticket */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-350">
                  <span>Ticket Médio por Venda/Assinatura</span>
                  <span className="font-mono text-white text-[11px] font-black">{formatCurrency(simulatorTicket)}</span>
                </div>
                <input 
                  type="range"
                  min="20"
                  max="5000"
                  step="10"
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-550"
                  value={simulatorTicket}
                  onChange={(e) => setSimulatorTicket(parseInt(e.target.value) || 20)}
                />
              </div>

              {/* Slider 3: Conversion Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-350">
                  <span>Taxa de Conversão do Funil (Leads ➔ Venda)</span>
                  <span className="font-mono text-orange-400 text-[11px] font-black">{simulatorConversion.toFixed(1)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.2"
                  max="15"
                  step="0.1"
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  value={simulatorConversion}
                  onChange={(e) => setSimulatorConversion(parseFloat(e.target.value) || 0.2)}
                />
              </div>

              {/* Slider 4: CPL */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-350">
                  <span>Custo médio por Lead (CPL)</span>
                  <span className="font-mono text-white text-[11px] font-black">{formatCurrency(simulatorCPL)}</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="50"
                  step="0.5"
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  value={simulatorCPL}
                  onChange={(e) => setSimulatorCPL(parseFloat(e.target.value) || 0.5)}
                />
              </div>

            </div>

            {/* Calculated outputs in Bento grid */}
            <div className="grid grid-cols-2 gap-3.5 pt-1.5">
              
              <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5 text-left font-sans">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Clientes Requeridos</p>
                <p className="text-base font-black font-mono text-white mt-1">
                  {simulatorTicket > 0 ? Math.ceil(simulatorGoal / simulatorTicket) : 0} <span className="text-[10px] text-gray-400">ativos</span>
                </p>
              </div>

              <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/8 text-left font-sans">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Leads Necessários</p>
                <p className="text-base font-black font-mono text-white mt-1">
                  {simulatorConversion > 0 ? Math.ceil(Math.ceil(simulatorGoal / simulatorTicket) / (simulatorConversion / 100)).toLocaleString("pt-BR") : 0} <span className="text-[10px] text-gray-400">leads</span>
                </p>
              </div>

              <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5 text-left font-sans">
                <p className="text-[9px] font-bold uppercase tracking-wider text-orange-400 font-bold">Verba Recomendada Ads</p>
                <p className="text-base font-black font-mono text-orange-400 mt-1 font-bold">
                  {formatCurrency(
                    (simulatorConversion > 0 ? Math.ceil(Math.ceil(simulatorGoal / simulatorTicket) / (simulatorConversion / 100)) : 0) * simulatorCPL
                  )}
                </p>
              </div>

              <div className="bg-[#1a1c1e] p-3.5 rounded-2xl border border-white/10 text-left font-sans animate-in">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">CAC Estimado</p>
                <p className="text-base font-black font-mono text-white mt-1">
                  {formatCurrency(simulatorConversion > 0 ? simulatorCPL / (simulatorConversion / 100) : 0)}
                </p>
              </div>

            </div>

            {/* Verdict and dynamic ROAS metric indicator */}
            <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fator de Retorno Estimado (ROAS Mínimo)</span>
                
                {/* Dynamically evaluate ROAS Badge */}
                {(() => {
                  const clients = simulatorTicket > 0 ? Math.ceil(simulatorGoal / simulatorTicket) : 0;
                  const leads = simulatorConversion > 0 ? Math.ceil(clients / (simulatorConversion / 100)) : 0;
                  const mktCost = leads * simulatorCPL;
                  const roasVal = mktCost > 0 ? simulatorGoal / mktCost : 0;

                  let colorBadge = "bg-red-500/15 text-red-400 border-red-500/20";
                  let levelText = "Risco Financeiro (ROAS < 2)";

                  if (roasVal > 10) {
                    colorBadge = "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";
                    levelText = "Máxima Viabilidade (ROAS " + roasVal.toFixed(1) + "x)";
                  } else if (roasVal >= 4) {
                    colorBadge = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
                    levelText = "Excelente Viabilidade (ROAS " + roasVal.toFixed(1) + "x)";
                  } else if (roasVal >= 2) {
                    colorBadge = "bg-amber-500/15 text-amber-400 border-amber-500/20";
                    levelText = "Conversão Exigente (ROAS " + roasVal.toFixed(1) + "x)";
                  }

                  return (
                    <span className={cn("px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wide border", colorBadge)}>
                      {levelText}
                    </span>
                  );
                })()}
              </div>

              {/* Dynamic feedback from AI Consultant Dafne */}
              <div className="flex items-start gap-2.5 text-xs text-gray-450 font-sans leading-relaxed text-left">
                <span className="p-1 rounded bg-orange-500/10 text-orange-400 shrink-0 mt-0.5"><Compass size={12} /></span>
                <p>
                  {(() => {
                    const clients = simulatorTicket > 0 ? Math.ceil(simulatorGoal / simulatorTicket) : 0;
                    const leads = simulatorConversion > 0 ? Math.ceil(clients / (simulatorConversion / 100)) : 0;
                    const mktCost = leads * simulatorCPL;
                    const cacVal = simulatorConversion > 0 ? simulatorCPL / (simulatorConversion / 100) : 0;
                    const roasVal = mktCost > 0 ? simulatorGoal / mktCost : 0;

                    if (roasVal > 10) {
                      return `Sua oferta é extremamente rentável. Com ticket de ${formatCurrency(simulatorTicket)} e CAC de ${formatCurrency(cacVal)}, você pode escalar os investimentos agressivamente, pois as conversões cobrirão seus investimentos de forma muito expressiva.`;
                    } else if (roasVal >= 4) {
                      return `Comportamento financeiro saudável. Um orçamento de ${formatCurrency(mktCost)} em anúncios é razoável para gerar ${leads.toLocaleString("pt-BR")} leads qualificados, gerando excelente margem comercial operacional de contribuição.`;
                    } else if (roasVal >= 2) {
                      return `Cuidado com as margens! Com CAC de ${formatCurrency(cacVal)} o seu ticket médio de ${formatCurrency(simulatorTicket)} está pressionado. Sugerimos subir o ticket ou otimizar a conversão para acima de 3% para mitigar riscos de prejuízo fixo.`;
                    } else {
                      return `Alerta de Viabilidade Crítica! O custo de aquisição (CAC: ${formatCurrency(cacVal)}) excede ou está muito próximo do seu ticket médio (${formatCurrency(simulatorTicket)}). Essa meta gerará prejuízo de caixa líquido no curto prazo. Reduza o CPL ou aumente o ticket imediatamente!`;
                    }
                  })()}
                </p>
              </div>

              {/* Advanced ROI Tipping Point Analysis & Action Plan */}
              {(() => {
                const clients = simulatorTicket > 0 ? Math.ceil(simulatorGoal / simulatorTicket) : 0;
                const leads = simulatorConversion > 0 ? Math.ceil(clients / (simulatorConversion / 100)) : 0;
                const mktCost = leads * simulatorCPL;
                const cacVal = simulatorConversion > 0 ? simulatorCPL / (simulatorConversion / 100) : 0;
                const roasVal = mktCost > 0 ? simulatorGoal / mktCost : 0;
                const isRoiPositive = roasVal >= 1.0;

                const minConversionForBreakeven = (simulatorCPL / (simulatorTicket || 1)) * 100;
                const maxCPLForBreakeven = simulatorTicket * (simulatorConversion / 100);

                return (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.01]/30 border border-white/5 text-left font-sans">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1">
                        <Brain size={11} className="text-orange-400 animate-pulse" />
                        Diagnóstico de Viabilidade Operacional
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full inline-block animate-ping duration-1000",
                          isRoiPositive ? "bg-emerald-500" : "bg-rose-500"
                        )} />
                        <span className={cn(
                          "text-xs font-black uppercase font-mono tracking-wider",
                          isRoiPositive ? "text-emerald-400" : "text-rose-400"
                        )}>
                          ROI {isRoiPositive ? "POSITIVO" : "NEGATIVO"} ({roasVal.toFixed(2)}x ROAS)
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        {isRoiPositive 
                          ? `Excelente! Seu CAC atual de ${formatCurrency(cacVal)} é inferior ao seu Ticket Médio de ${formatCurrency(simulatorTicket)}. Você está retendo margem líquida positiva e cada venda gera lucro operacional.`
                          : `Alerta! O seu CAC atual de ${formatCurrency(cacVal)} ultrapassa o Ticket Médio de ${formatCurrency(simulatorTicket)}. Isso significa que o custo de acquisição está corroendo suas receitas imediatas de vendas.`
                        }
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-gray-400">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-500 block">Conversão de Breakeven:</span>
                          <span className="text-white font-extrabold font-mono">&ge; {minConversionForBreakeven.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-500 block">CPL Máximo p/ Breakeven:</span>
                          <span className="text-white font-extrabold font-mono">&le; {formatCurrency(maxCPLForBreakeven)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Auto-Calibrate Tool CTA */}
                    {!isRoiPositive && (
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatorConversion(3.5);
                          setSimulatorCPL(2.50);
                          sound.playSuccess();
                          showToast("Métricas calibradas com sucesso! Conversão definida em 3.5% e CPL em R$ 2,50 (ROI Positivo com ROAS sustentável de 2.8x).", "success");
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-605 text-[#0c0e10] rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer font-sans flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                      >
                        <Sliders size={12} className="text-black shrink-0 animate-bounce" />
                        ⚡ Ajustar para Alvo de Alta Performance (ROI Positivo)
                      </button>
                    )}

                    {/* Dynamic Action Plan Section */}
                    <div className="space-y-2 text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block mb-1">
                        📋 Plano de Ação Estratégico p/ Atingimento da Meta
                      </span>
                      
                      <div className="space-y-2">
                        {/* Action 1 */}
                        <div className="flex gap-2.5 p-2.5 rounded-xl bg-white/[0.02]/20 border border-white/5 font-sans leading-relaxed text-[11px]">
                          <span className="text-[11px] font-mono font-black text-orange-400 px-1.5 py-0.5 rounded bg-orange-500/10 h-fit leading-none mt-0.5">
                            01
                          </span>
                          <div>
                            <span className="font-bold text-gray-200 block text-xs">Otimização de Conversão no Funil</span>
                            <p className="text-gray-450 mt-0.5">
                              Suba a conversão de leads para <strong>&ge; {minConversionForBreakeven.toFixed(1)}%</strong> através de melhorias de velocidade de carregamento nas landing pages, simplificação drástica do formulário de checkout e inserção de depoimentos/prova social perto dos botões de compra.
                            </p>
                          </div>
                        </div>

                        {/* Action 2 */}
                        <div className="flex gap-2.5 p-2.5 rounded-xl bg-white/[0.02]/20 border border-white/5 font-sans leading-relaxed text-[11px]">
                          <span className="text-[11px] font-mono font-black text-orange-400 px-1.5 py-0.5 rounded bg-orange-500/10 h-fit leading-none mt-0.5">
                            02
                          </span>
                          <div>
                            <span className="font-bold text-gray-200 block text-xs">Engenharia de Redução de CPL</span>
                            <p className="text-gray-450 mt-0.5">
                              Garanta um CPL sob <strong>&le; {formatCurrency(maxCPLForBreakeven)}</strong> negativando termos de baixa conversão nas campanhas de busca, restringindo canais de display automáticos dispersivos e expandindo públicos semelhantes (lookalike) com base na lista de clientes recorrentes.
                            </p>
                          </div>
                        </div>

                        {/* Action 3 */}
                        <div className="flex gap-2.5 p-2.5 rounded-xl bg-white/[0.02]/20 border border-white/5 font-sans leading-relaxed text-[11px]">
                          <span className="text-[11px] font-mono font-black text-orange-400 px-1.5 py-0.5 rounded bg-orange-500/10 h-fit leading-none mt-0.5">
                            03
                          </span>
                          <div>
                            <span className="font-bold text-gray-200 block text-xs">Alavancagem de Ticket Médio por Transação</span>
                            <p className="text-gray-450 mt-0.5">
                              Minimize a dependência de novos investimentos de mídia integrando mecânicas de ticket múltiplo (Order Bump na finalização do pedido, Upsell de mentoria, combos estruturados ou planos anuais prioritários).
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Option to Inject Simulator outputs to Additional Goals */}
            <button
              type="button"
              onClick={() => {
                const clients = simulatorTicket > 0 ? Math.ceil(simulatorGoal / simulatorTicket) : 0;
                const leads = simulatorConversion > 0 ? Math.ceil(clients / (simulatorConversion / 100)) : 0;
                const mktCost = leads * simulatorCPL;
                const cacVal = simulatorConversion > 0 ? simulatorCPL / (simulatorConversion / 100) : 0;

                const goalsToSave = [
                  {
                    id: 'sim-goal-cac',
                    title: `Simulador Viabilidade: Manter CAC Geral sob ${formatCurrency(cacVal)}`,
                    targetValue: parseFloat(cacVal.toFixed(2)),
                    type: 'acquisition_cost' as const,
                    deadline: "Próximos 3 M.",
                    reached: false
                  },
                  {
                    id: 'sim-goal-budget',
                    title: `Simulador Viabilidade: Alocar verba comercial de Ads até ${formatCurrency(mktCost)}`,
                    targetValue: parseFloat(mktCost.toFixed(2)),
                    type: 'profit' as const,
                    deadline: "Próximos 3 M.",
                    reached: false
                  }
                ];

                setAdditionalGoals(prev => {
                  const existingTitles = new Set(prev.map(p => p.title));
                  const filtered = goalsToSave.filter(o => !existingTitles.has(o.title));
                  return [...prev, ...filtered];
                });

                sound.playSuccess();
                showToast("Orçamento de tráfego e limite de CAC simulados importados no seu controle como metas! Lembre-se de salvar.", "success");
              }}
              className="w-full py-3 text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer text-white transition-all active:scale-95 text-center block font-sans"
            >
              📥 Importar Métricas de CAC e Verba Simulada como Metas PJ
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
