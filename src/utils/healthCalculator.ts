import { formatCurrency } from "../lib/utils";

export const calculateHealthScore = (
  dreData: any[],
  transactionsList: any[],
  simulatedCrisis: boolean = false,
  isDemoMode: boolean = false
) => {
  const getVal = (label: string) =>
    Math.abs(dreData.find((line: any) => line.label === label || line.label.includes(label))?.value || 0);

  const realReceitaBruta = getVal("RECEITA OPERACIONAL BRUTA");
  const cmv = getVal("(-) Custos dos Produtos/Serviços (CMV/CPV)");
  const opex = getVal("(-) Despesas Operacionais (OPEX)");

  const currentBalanceValue = transactionsList.reduce(
    (acc, t) => acc + (t.type === "income" ? t.amount : -t.amount),
    0,
  );

  if (simulatedCrisis) {
    const currentBalance = currentBalanceValue < 8000 ? currentBalanceValue : 4850.00;
    const receitaBruta = realReceitaBruta < 35000 ? realReceitaBruta : 32000.00;
    const totalPeriodExpense = (cmv + opex) > 42500 ? (cmv + opex) : 48500.00;
    const margemContribuicao = 18.5; 
    const pontoEquilibrio = 52000.00;
    const runwayDays = 9;
    const dailyBurn = totalPeriodExpense / 30;

    const finalScore = 2.1;
    const level = "Debilitada - Crítica";
    const color = "from-rose-600 to-red-500 animate-pulse";
    const bgLight = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    const description = "Saúde financeira extremamente debilitada e sob imenso risco operacional imediato. Custos de OPEX exorbitantes faturando abaixo do ponto de equilíbrio, com baixíssima liquidez (runway menor do que 10 dias). Módulo de Mudança de Jogo (Turnaround) Desbloqueado!";
    const reasons = [
      "Margem de contribuição crítica (18.5%) incompatível com a sobrevivência comercial.",
      "Alto custo operacional fixo de infraestrutura devorando faturamento e reservas.",
      "Runway iminente sob risco de insolvência severa em menos de 10 dias úteis.",
      "Desalinhamento absoluto entre faturamento real acumulado e o breakeven projetado."
    ];

    return {
      score: finalScore,
      level,
      color,
      bgLight,
      description,
      reasons,
      margemContribuicao,
      pontoEquilibrio,
      runwayDays,
      dailyBurn,
      currentBalance,
      totalPeriodExpense,
      receitaBruta
    };
  }

  // Real calculations
  const receitaBruta = realReceitaBruta;
  const currentBalance = currentBalanceValue;
  const totalPeriodExpense = cmv + opex;
  const margemContribuicao = receitaBruta > 0 ? ((receitaBruta - cmv) / receitaBruta) * 100 : 0;
  
  const mRatio = receitaBruta > 0 ? (receitaBruta - cmv) / receitaBruta : 0;
  const pontoEquilibrio = mRatio > 0 ? opex / mRatio : 0;
  const dailyBurn = totalPeriodExpense / 30;
  const runwayDays = dailyBurn > 0 && currentBalance > 0 ? Math.max(0, Math.round(currentBalance / dailyBurn)) : (currentBalance > 0 ? 365 : 0);

  if (receitaBruta === 0 && totalPeriodExpense === 0) {
    return {
      score: 0.0,
      level: "Sem Lançamentos",
      color: "from-slate-400 to-slate-500",
      bgLight: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      description: "Nenhum faturamento ou gasto operacional registrado no fluxo de caixa. Insira seus lançamentos para auditar sua saúde financeira.",
      reasons: [
        "Aguardando registro de faturamento operacional bruto ou prestação de serviços.",
        "Aguardando lançamento de despesas fixas (OPEX) ou custos variáveis diretos (CMV)."
      ],
      margemContribuicao: 0,
      pontoEquilibrio: 0,
      runwayDays: 0,
      dailyBurn: 0,
      currentBalance: 0,
      totalPeriodExpense: 0,
      receitaBruta: 0
    };
  }

  // Score computation
  let scorePoints = 5.0;
  if (receitaBruta >= pontoEquilibrio && receitaBruta > 0) {
    scorePoints += 2.5;
  } else {
    scorePoints -= 2.0;
  }

  if (currentBalance > totalPeriodExpense) {
    scorePoints += 1.5;
  } else if (currentBalance < 0) {
    scorePoints -= 1.5;
  }

  if (margemContribuicao >= 40) {
    scorePoints += 1.0;
  } else if (margemContribuicao < 20) {
    scorePoints -= 1.0;
  }

  // Force high score and healthy indicators for demo mode when not in simulated crisis
  if (isDemoMode && !simulatedCrisis) {
    scorePoints = 10.0;
  }

  const finalScore = Math.min(10.0, Math.max(1.0, Number(scorePoints.toFixed(1))));
  
  let level = "Boa";
  let color = "from-neutral-800 to-black";
  let bgLight = "bg-neutral-900/10 text-neutral-800 border-neutral-900/15";
  let description = "Saúde financeira estável. Sua empresa opera com fluxo de caixa active, porém monitore as variações de CMV e margem operacional para expandir.";
  let reasons = [
    `Margem de contribuição de ${margemContribuicao.toFixed(1)}% calculada com base no faturamento real.`,
    `Ponto de equilíbrio atingido em ${receitaBruta >= pontoEquilibrio ? "consonância com" : "abaixo de"} suas despesas operacionais.`
  ];

  if (finalScore >= 8.2) {
    level = "Ótima";
    color = "from-emerald-500 to-teal-500";
    bgLight = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    description = "Excelente liquidez de caixa e eficiência de margens. O faturamento está bem posicionado acima do break-even financeiro do negócio.";
    reasons.push("Estrutura operacional e geração de reservas líquidas impecáveis.");
  } else if (finalScore < 5.0) {
    level = "Debilitada";
    color = "from-rose-500 to-red-500";
    bgLight = "bg-rose-500/10 text-rose-450 border-rose-500/20";
    description = "Sua empresa está operando com perigo iminente de insolvência ou baixa margem de contribuição. Considere revisão com urgência.";
    reasons.push("Alerta operacional ativado: necessidade de controle de OPEX e ajuste de preços.");
  }

  return {
    score: finalScore,
    level,
    color,
    bgLight,
    description,
    reasons,
    margemContribuicao,
    pontoEquilibrio,
    runwayDays,
    dailyBurn,
    currentBalance,
    totalPeriodExpense,
    receitaBruta
  };
};
