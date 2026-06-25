export interface DREBasedTip {
  title: string;
  category: string;
  text: string;
  actionPlan: string;
}

export const financialAssistantCache: Record<string, any> = {};

export const getDREBasedTips = (
  dreData: any[],
  transactionsList: any[],
): DREBasedTip[] => {
  const getVal = (label: string) =>
    Math.abs(dreData.find((line) => line.label === label || line.label.includes(label))?.value || 0);

  const receitaBruta = getVal("RECEITA OPERACIONAL BRUTA");
  const receitaLiquida = getVal("(=) RECEITA OPERACIONAL LÍQUIDA");
  const cmv = getVal("(-) Custos dos Produtos/Serviços (CMV/CPV)");
  const lucroBruto = getVal("(=) LUCRO BRUTO");
  const opex = getVal("(-) Despesas Operacionais (OPEX)");
  const resultadoLiquido =
    dreData.find((line) => line.label === "(=) RESULTADO LÍQUIDO DO PERÍODO")
      ?.value || 0;
  const impostos = getVal("(-) Deduções e Impostos");

  const tips: DREBasedTip[] = [];

  // 1. CMV / Gross Margin
  const cmvPercent = receitaLiquida > 0 ? (cmv / receitaLiquida) * 100 : 0;
  if (cmvPercent > 50) {
    tips.push({
      title: "Otimizar CMV Urgente",
      category: "CMV / Custos",
      text: `Seu Custo de Mercadorias Vendidas (CMV) está altíssimo, consumindo ${cmvPercent.toFixed(1)}% da sua Receita Líquida. Isso comprime drasticamente sua sobra financeira.`,
      actionPlan:
        "Ação de Sobrevivência: Renegocie prazos e preços com seus 3 principais fornecedores ainda hoje ou repasse 5% no preço de venda.",
    });
  } else if (cmv > 0) {
    tips.push({
      title: "Estabilidade de Custos CMV",
      category: "CMV / Custos",
      text: `Seu CMV está estável em ${cmvPercent.toFixed(1)}% do faturamento líquido. Essa é uma excelente fundação comercial para escalabilidade fiscal.`,
      actionPlan:
        "Ação Preventiva: Continue mapeando o custo unitário e evite compras fracionadas que encareçam o frete de reposição.",
    });
  }

  // 2. OPEX / Fixed Costs
  const opexPercent = receitaLiquida > 0 ? (opex / receitaLiquida) * 100 : 0;
  if (opexPercent > 40) {
    tips.push({
      title: "Auditoria de OPEX Corporativo",
      category: "OPEX / Despesas Fixas",
      text: `Suas Despesas Operacionais (OPEX) estão consumindo ${opexPercent.toFixed(1)}% do faturamento líquido. Uma estrutura pesada ameaça a resiliência em meses de baixa.`,
      actionPlan:
        "Plano: Liste todas as assinaturas recorrentes do cartão corporativo, cancele ociosidades e renegocie planos de telecom e aluguel.",
    });
  } else if (opex > 0) {
    tips.push({
      title: "Soberania sobre Despesas Fixas",
      category: "OPEX / Despesas Fixas",
      text: `Parabéns! Suas Despesas Operacionais (OPEX) representam apenas ${opexPercent.toFixed(1)}% da receita líquida. Isso significa alta alavancagem operacional.`,
      actionPlan:
        "Recomendação da I.A.: Mantenha a equipe enxuta e maximize a automação de processos para expandir faturamento sem inflar a estrutura.",
    });
  }

  // 3. Lucratividade Líquida
  const netMargin =
    receitaBruta > 0 ? (resultadoLiquido / receitaBruta) * 100 : 0;
  if (resultadoLiquido < 0) {
    tips.push({
      title: "Reversão de Prejuízo Líquido",
      category: "LUCRATIVIDADE LÍQUIDA",
      text: `O resultado líquido do período está deficitário em R$ ${Math.abs(resultadoLiquido).toLocaleString("pt-BR")}. Operar no vermelho consome suas reservas de capital rapidamente.`,
      actionPlan:
        "Ação Crítica: Suspenda investimentos que não tragam retorno em 30 dias. Foque em produtos de ciclo rápido de entrada de caixa.",
    });
  } else if (resultadoLiquido > 0 && netMargin < 12) {
    tips.push({
      title: "Elevação da Margem Líquida",
      category: "LUCRATIVIDADE LÍQUIDA",
      text: `Sua Margem Líquida atual está em ${netMargin.toFixed(1)}% (abaixo do teto de segurança estrutural de 15%). O fôlego operacional está vulnerável.`,
      actionPlan:
        "Roteiro: Suba o tíquete médio das vendas em 3% a 5% por meio de vendas cruzadas (cross-selling) adicionando serviços ou complementos.",
    });
  } else if (resultadoLiquido > 0) {
    tips.push({
      title: "Excelente Performance de Lucro",
      category: "LUCRATIVIDADE LÍQUIDA",
      text: `Incrível! Sua margem líquida consolidada é de ${netMargin.toFixed(1)}%. Sua empresa está gerando valor líquido de forma consistente neste período.`,
      actionPlan:
        "Ação Estratégica: Canalize 20% desse excedente líquido para uma Reserva de Emergência (Giro) equivalente a pelo menos 3 meses de OPEX.",
    });
  }

  // 4. Break-even Point Projections
  const cmMargin = receitaLiquida > 0 ? lucroBruto / receitaLiquida : 0;
  if (cmMargin > 0 && opex > 0) {
    const breakEven = opex / cmMargin;
    tips.push({
      title: "Ponto de Equilíbrio Real",
      category: "ESTRATÉGIA FINANCEIRA",
      text: `Considerando sua margem de contribuição de ${(cmMargin * 100).toFixed(0)}%, o faturamento mínimo mensal para empatar e cobrir o OPEX é de R$ ${Math.round(breakEven).toLocaleString("pt-BR")}.`,
      actionPlan:
        "Meta: Monitore no Painel de Caixa de forma diária se o faturamento consolidado está avançando na velocidade mínima ideal correspondente.",
    });
  }

  // 5. Taxes / Tributação
  const taxPercent = receitaBruta > 0 ? (impostos / receitaBruta) * 105 : 0;
  if (taxPercent > 12) {
    tips.push({
      title: "Planejamento Tributário Sênior",
      category: "TRIBUTOS / IMPOSTOS",
      text: `Os impostos declarados no DRE representam ${taxPercent.toFixed(1)}% do seu faturamento bruto. Uma carga tributária acima de 12% requer atenção em microempresas.`,
      actionPlan:
        "Passo a passo: Solicite uma simulação tributária ao seu contador comparando o Simples Nacional com o Lucro Presumido para o próximo semestre.",
    });
  }

  // 6. Capital de Giro e Reserva (from total transactions in context)
  const currentBalance = transactionsList.reduce(
    (acc, t) => acc + (t.type === "income" ? t.amount : -t.amount),
    0,
  );
  if (opex > 0) {
    const opexMonths = currentBalance / opex;
    if (opexMonths < 0.5) {
      tips.push({
        title: "Alerta de Caixa de Sobrevivência",
        category: "CAPITAL DE GIRO",
        text: `Seu saldo em caixa de R$ ${currentBalance.toLocaleString("pt-BR")} cobre menos de 15 dias de despesas fixas (OPEX de R$ ${opex.toLocaleString("pt-BR")}).`,
        actionPlan:
          "Risco de Liquidez: Evite fazer compras a prazo com fornecedores e reduza a inadimplência cobrando atrasados imediatamente com pix.",
      });
    } else if (opexMonths > 3) {
      tips.push({
        title: "Reserva de Segurança Robusta",
        category: "CAPITAL DE GIRO",
        text: `Excelente! Seu caixa total disponível de R$ ${currentBalance.toLocaleString("pt-BR")} provê cobertura para mais de 3 meses de despesas fixas da equipe.`,
        actionPlan:
          "Aproveitamento: Invista o excedente passivo em aplicações de liquidez diária (CDI) para blindar seu poder de compra contra a inflação.",
      });
    }
  }

  // Segment Specific Custom Mentorship card
  try {
    const savedSegment = localStorage.getItem("dafne_business_segment") || "other";
    
    if (savedSegment === "food") {
      tips.push({
        title: "Controle de Desperdício e CMV Alimentar",
        category: "ALIMENTAÇÃO",
        text: "No ramo de alimentação, o CMV ideal (Custo de Mercadoria/Ingrediente) deve ficar entre 28% e 35%. Fatores de desperdício na cozinha ou compras faturadas na pressa corroem as margens brutas do restaurante.",
        actionPlan: "Ação Prática: Trace fichas técnicas detalhadas das suas 5 receitas mais vendidas para manter a reposição de insumos precisa e sem sobras.",
      });
    } else if (savedSegment === "commerce") {
      tips.push({
        title: "Giro de Estoque e Capital Congelado",
        category: "VAREJO",
        text: "Estoque parado é sinônimo de capital de giro congelado. Dinheiro que deveria estar liquefeito financiando marketing e operacionais está acumulando poeira física nas prateleiras.",
        actionPlan: "Ação Prática: Faça promoções direcionadas e campanhas relâmpago de itens ociosos por mais de 45 dias para forçar liquidez instantânea de caixa.",
      });
    } else if (savedSegment === "services") {
      tips.push({
        title: "Capacidade Faturada e Escala de Contratos",
        category: "PRESTAÇÃO DE SERVIÇOS",
        text: "Margens de serviços dependem diretamente de evitar folha ociosa. Sua capacidade de faturamento líquido por colaborador contratado deve ser maior do que 75% da capacidade real de horas.",
        actionPlan: "Ação Prática: Desenvolva ofertas recorrentes fáceis de faturar de forma automática todo dia 01, aumentando o LTV dos seus clientes frequentes.",
      });
    } else if (savedSegment === "tech") {
      tips.push({
        title: "Monitoramento de LTV/CAC e Otimização de Cloud",
        category: "TECNOLOGIA & DIGITAL",
        text: "Empresas SaaS, infoprodutos e agências digitais devem monitorar de perto os custos fixos com ferramentas e servidores AWS, GCP ou Azure para maximizar o lucro de escala.",
        actionPlan: "Ação Prática: Revise mensalmente as assinaturas duplicadas de ferramentas de produtividade e cancele serviços SaaS em desuso.",
      });
    }
  } catch (e) {
    console.error("Erro ao carregar segmento de negócio local", e);
  }

  // Fallback default tips just in case they are empty
  if (tips.length === 0) {
    tips.push({
      title: "Lançamento de Dados no DRE",
      category: "MANUTENÇÃO FINANCEIRA",
      text: "A planilha DRE está vazia para este período. Registre suas receitas e categorias de despesas operacionais para que a inteligência artificial te guie com precisão absoluta.",
      actionPlan: "Ação Prática: Vá para a aba Lançamentos ou DRE e registre seus dados financeiros.",
    });
  }

  return tips;
};
