import { Transaction, Category } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Vendas de Produtos', type: 'income', group: 'REVENUE', userId: 'demo' },
  { id: 'cat2', name: 'Serviços Prestados', type: 'income', group: 'REVENUE', userId: 'demo' },
  { id: 'cat3', name: 'Aluguel Escritório', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat4', name: 'Folha de Pagamento', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat5', name: 'Matéria Prima', type: 'expense', group: 'COGS', userId: 'demo' },
  { id: 'cat6', name: 'Marketing Digital', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat7', name: 'Guia DAS Simples Nacional', type: 'expense', group: 'TAX', userId: 'demo' },
  { id: 'cat8', name: 'Assinaturas de Software (SaaS)', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat9', name: 'Investimentos em Equipamento', type: 'expense', group: 'INVESTMENT', userId: 'demo' },
  { id: 'cat12', name: 'Reserva de Emergência', type: 'expense', group: 'INVESTMENT', userId: 'demo' },
  { id: 'cat10', name: 'Rendimento CDB Liquidez', type: 'income', group: 'OTHER_INCOME', userId: 'demo' },
  { id: 'cat11', name: 'Tarifas Bancárias e Custos', type: 'expense', group: 'OTHER_EXPENSE', userId: 'demo' },
  { id: 'cat13', name: 'Infraestrutura de Nuvem / Servidores', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat14', name: 'Modelos e APIs de I.A. (OpenAI, Gemini)', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat23', name: 'Despesas com Inteligência Artificial', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat24', name: 'Custos de Infraestrutura de Nuvem', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat15', name: 'Consultoria e Auditorias Externas', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat16', name: 'Logística, Entregadores e APPs', type: 'expense', group: 'COGS', userId: 'demo' },
  { id: 'cat17', name: 'Insumos de Manutenção e Reparos', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat18', name: 'Embalagens e Lacres de Segurança', type: 'expense', group: 'COGS', userId: 'demo' },
  { id: 'cat19', name: 'Honorários Contábeis e Fiscal', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat20', name: 'Impostos Municipais (ISS/IPTU)', type: 'expense', group: 'TAX', userId: 'demo' },
  { id: 'cat21', name: 'Treinamento e Capacitação Técnica', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat22', name: 'Brindes & Sucesso do Cliente (CS)', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat25', name: 'CMV, custo de vendas', type: 'expense', group: 'COGS', userId: 'demo' }
];

// Helper to calculate relative dates easily, supporting past months
const currentMonthDate = (day: number) => {
  const d = new Date();
  d.setDate(day);
  return d;
};

const prevMonthDate = (day: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  d.setDate(day);
  return d;
};

// Geração Dinâmica de Dados de 24 Meses Realistas (Simulação de uma PME com R$ 2.5MM/ano)
const generate24MonthsMockTransactions = (): Transaction[] => {
  const transactionsList: Transaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const monthKey = `${year}-${month}`;
    const isCurrentMonth = i === 0;

    // Faturamento base: R$ 210.000, com crescimento histórico sutil no decorrer dos meses (empresas mais antigas faturando um pouco menos orgonicamente)
    const baseRevenue = 220000 - (i * 2000); 
    
    // Fatores de Sazonalidade Realista PJ
    let seasonalFactor = 1.0;
    if (month === 11) seasonalFactor = 1.35; // Dezembro (Pico de Festas de Fim de Ano & Varejo)
    else if (month === 10) seasonalFactor = 1.18; // Novembro (Black Friday & Eventos)
    else if (month === 0) seasonalFactor = 0.85; // Janeiro (Ressaca de mercado / início de ano)
    else if (month === 1) seasonalFactor = 0.90; // Fevereiro (Carnaval / menos dias úteis)
    else if (month === 5) seasonalFactor = 1.05; // Junho (Dia dos Namorados / Festas Juninas)
    
    const randomFactor = 0.93 + Math.random() * 0.14; // Oscilação sutil diária
    const monthlyRevenueTotal = Math.round(baseRevenue * seasonalFactor * randomFactor);

    // Divisão realista de faturamento: 70% Vendas Balcão / Salão Físico e 30% Delivery Aplicativos
    const commerceRevenue = Math.round(monthlyRevenueTotal * 0.70);
    const servicesRevenue = Math.round(monthlyRevenueTotal * 0.30);

    // 1. Receitas
    transactionsList.push({
      id: `t-${monthKey}-rev-prod`,
      description: `Vendas Balcão & Salão Físico (Burgers/Bebidas) - Competência ${month + 1}/${year}`,
      amount: commerceRevenue,
      categoryId: 'cat1',
      date: isCurrentMonth ? currentMonthDate(10) : new Date(year, month, 10),
      type: 'income',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    transactionsList.push({
      id: `t-${monthKey}-rev-serv`,
      description: `Faturamento Delivery Integrado iFood / Rappi - Competência ${month + 1}/${year}`,
      amount: servicesRevenue,
      categoryId: 'cat2',
      date: isCurrentMonth ? currentMonthDate(15) : new Date(year, month, 15),
      type: 'income',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Rendimento da Reserva do grupo (Proporcional ao caixa estimado acumulado)
    transactionsList.push({
      id: `t-${monthKey}-rev-cdb`,
      description: 'Rendimento Diário CDB Liquidez - Tesouraria Smash',
      amount: Math.round(1800 + (Math.random() * 600)),
      categoryId: 'cat10',
      date: isCurrentMonth ? currentMonthDate(28) : new Date(year, month, 28),
      type: 'income',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 2. Despesas
    // Margem de Custo Variável Realista (CMV / Insumos / Logística): 34% sobre produtos
    const cogsInsumos = Math.round(commerceRevenue * 0.30);
    const cogsLogistica = Math.round(commerceRevenue * 0.04);

    transactionsList.push({
      id: `t-${monthKey}-exp-raw`,
      description: `Compra de Insumos: Carnes Blend Angus, Pães e Laticínios`,
      amount: cogsInsumos,
      categoryId: 'cat5',
      date: isCurrentMonth ? currentMonthDate(3) : new Date(year, month, 3),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    transactionsList.push({
      id: `t-${monthKey}-exp-log`,
      description: `Logística e Fretes de Distribuidoras (Hortifrúti e Descartáveis)`,
      amount: cogsLogistica,
      categoryId: 'cat16',
      date: isCurrentMonth ? currentMonthDate(12) : new Date(year, month, 12),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Despesas Operacionais Fixas (OPEX)
    // Folha de pagamento média: R$ 38.000 fixo + encargos
    transactionsList.push({
      id: `t-${monthKey}-exp-payroll`,
      description: `Escala de Salários, Encargos CLT e Folha Operacional (Smashers / Garçons)`,
      amount: 38500,
      categoryId: 'cat4',
      date: isCurrentMonth ? currentMonthDate(25) : new Date(year, month, 25),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Aluguel Escritório e Galpão SP (R$ 6.800 fixo)
    transactionsList.push({
      id: `t-${monthKey}-exp-rent`,
      description: `Locação Ponto Comercial (Hamburgueria Pinheiros SP)`,
      amount: 6800,
      categoryId: 'cat3',
      date: isCurrentMonth ? currentMonthDate(5) : new Date(year, month, 5),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Marketing e Tráfego Pago (Aproximadamente 9% das receitas para escalar crescimento)
    const marketingBudget = Math.round(monthlyRevenueTotal * 0.09);
    transactionsList.push({
      id: `t-${monthKey}-exp-mkt`,
      description: `Campanhas Meta Ads Geolocalizadas & Ativações de Influenciadores`,
      amount: marketingBudget,
      categoryId: 'cat6',
      date: isCurrentMonth ? currentMonthDate(18) : new Date(year, month, 18),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Imposto (Guia DAS do Simples Nacional - 6% do faturamento total do mês anterior/atual)
    const taxPayment = Math.round(monthlyRevenueTotal * 0.06);
    transactionsList.push({
      id: `t-${monthKey}-exp-tax`,
      description: `Guia Unificada DAS Simples Nacional - Impostos Simples`,
      amount: taxPayment,
      categoryId: 'cat7',
      date: isCurrentMonth ? currentMonthDate(20) : new Date(year, month, 20),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // APIs, Nuvem e Infra (AWS + Licenças SaaS + Modelos de IA): R$ 4.500 no total
    transactionsList.push({
      id: `t-${monthKey}-exp-cloud`,
      description: `Licença do Softwares de Frente de Caixa (PDV) & Sistema KDS`,
      amount: 1950,
      categoryId: 'cat8',
      date: isCurrentMonth ? currentMonthDate(21) : new Date(year, month, 21),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    transactionsList.push({
      id: `t-${monthKey}-exp-ai-services`,
      description: 'Tokens de CRM Inteligente & Recomendações de Vendas Dafne I.A.',
      amount: 2840,
      categoryId: 'cat14',
      date: isCurrentMonth ? currentMonthDate(26) : new Date(year, month, 26),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Reservas de Emergência corporativas sistemáticas (Aporte mensal de investimentos)
    transactionsList.push({
      id: `t-${monthKey}-exp-reserve`,
      description: `Retenção Estratégica: Alocação em Reserva Hamburgueria`,
      amount: Math.round(monthlyRevenueTotal * 0.05),
      categoryId: 'cat12',
      date: isCurrentMonth ? currentMonthDate(28) : new Date(year, month, 28),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Brindes / Honorários e Outras Despesas Corporativas
    transactionsList.push({
      id: `t-${monthKey}-exp-others`,
      description: `Honorários Contábeis, Gestão Financeira e Manutenções de Chapas`,
      amount: 2200,
      categoryId: 'cat11',
      date: isCurrentMonth ? currentMonthDate(29) : new Date(year, month, 29),
      type: 'expense',
      userId: 'demo',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return transactionsList;
};

export const MOCK_TRANSACTIONS: Transaction[] = generate24MonthsMockTransactions();

export const MOCK_BILLS = [
  {
    id: 'b1',
    description: 'Embalagens Térmicas & Sacolas Kraft Delivery',
    amount: 1500,
    dueDate: '2026-06-28', // futuro confortável
    installments: 3,
    boletoBarcode: '00190.00009 02345.678903 12345.678901 5 99230000150000',
    status: 'pending' as const,
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date(),
    expenseCategory: 'production' as const
  },
  {
    id: 'b2',
    description: 'Ajuste de Locação Ponto de Venda Pinheiros',
    amount: 4500,
    dueDate: '2026-06-25', // futuro confortável
    installments: 1,
    boletoBarcode: '34191.79001 01043.513184 91020.150008 7 98450000450000',
    status: 'pending' as const,
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date(),
    expenseCategory: 'administrative' as const
  },
  {
    id: 'b3',
    description: 'Mensalidade Sistema PDV & KDS de Cozinha',
    amount: 480,
    dueDate: '2026-05-18', 
    installments: 12,
    boletoBarcode: '03399.08702 34001.222333 44101.999888 1 97220000048000',
    status: 'paid' as const, // pago
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date(),
    expenseCategory: 'administrative' as const
  },
  {
    id: 'b4',
    description: 'Honorários Contábeis Especiais Simples Nacional',
    amount: 800,
    dueDate: '2026-05-10', // pago
    installments: 1,
    boletoBarcode: '23790.11112 33333.444445 55555.666667 9 96250000080000',
    status: 'paid' as const,
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date(),
    expenseCategory: 'administrative' as const
  }
];

