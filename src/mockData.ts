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
  { id: 'cat15', name: 'Consultoria e Auditorias Externas', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat16', name: 'Logística, Entregadores e APPs', type: 'expense', group: 'COGS', userId: 'demo' },
  { id: 'cat17', name: 'Insumos de Manutenção e Reparos', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat18', name: 'Embalagens e Lacres de Segurança', type: 'expense', group: 'COGS', userId: 'demo' },
  { id: 'cat19', name: 'Honorários Contábeis e Fiscal', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat20', name: 'Impostos Municipais (ISS/IPTU)', type: 'expense', group: 'TAX', userId: 'demo' },
  { id: 'cat21', name: 'Treinamento e Capacitação Técnica', type: 'expense', group: 'OPEX', userId: 'demo' },
  { id: 'cat22', name: 'Brindes & Sucesso do Cliente (CS)', type: 'expense', group: 'OPEX', userId: 'demo' }
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

export const MOCK_TRANSACTIONS: Transaction[] = [
  // --- MÊS ATUAL ---
  {
    id: 't-curr-aporte-reserva',
    description: 'Aporte Reserva: Reserva de Emergência',
    amount: 100869,
    categoryId: 'cat12',
    date: currentMonthDate(15),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-1',
    description: 'Vendas E-commerce Lote A',
    amount: 28500,
    categoryId: 'cat1',
    date: currentMonthDate(2),
    type: 'income',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-2',
    description: 'Aluguel Escritório SP',
    amount: 3200,
    categoryId: 'cat3',
    date: currentMonthDate(5),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-3',
    description: 'Vendas Loja Física Matriz',
    amount: 18300,
    categoryId: 'cat1',
    date: currentMonthDate(7),
    type: 'income',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-4',
    description: 'Fornecedor Insumos Embalagens',
    amount: 4800,
    categoryId: 'cat5',
    date: currentMonthDate(10),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-5',
    description: 'Contrato de Suporte Mensal Clientes',
    amount: 19500,
    categoryId: 'cat2',
    date: currentMonthDate(12),
    type: 'income',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-6',
    description: 'Tráfego Pago Meta Ads',
    amount: 2500,
    categoryId: 'cat6',
    date: currentMonthDate(15),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-7',
    description: 'Matéria-prima Plásticos Ltda',
    amount: 3900,
    categoryId: 'cat5',
    date: currentMonthDate(18),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-8',
    description: 'Guia DAS Simples Nacional',
    amount: 1450,
    categoryId: 'cat7',
    date: currentMonthDate(20),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-9',
    description: 'Consultoria Estratégica Premium',
    amount: 12200,
    categoryId: 'cat2',
    date: currentMonthDate(22),
    type: 'income',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-10',
    description: 'Folha de Pagamento + Benefícios',
    amount: 13500,
    categoryId: 'cat4',
    date: currentMonthDate(25),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-11',
    description: 'Assinatura AWS Cloud + CRM HubSpot',
    amount: 685,
    categoryId: 'cat8',
    date: currentMonthDate(26),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-12',
    description: 'Compra de Equipamentos TI de Ponta',
    amount: 3100,
    categoryId: 'cat9',
    date: currentMonthDate(27),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-13',
    description: 'Rendimento CDB Liquidez Diária',
    amount: 950,
    categoryId: 'cat10',
    date: currentMonthDate(28),
    type: 'income',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-curr-14',
    description: 'Tarifas de Registro e Cobrança',
    amount: 125,
    categoryId: 'cat11',
    date: currentMonthDate(29),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // --- MÊS ANTERIOR ---
  {
    id: 't-prev-1',
    description: 'Vendas E-commerce Lote Ant.',
    amount: 25200,
    categoryId: 'cat1',
    date: prevMonthDate(2),
    type: 'income',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-2',
    description: 'Aluguel Escritório SP',
    amount: 3200,
    categoryId: 'cat3',
    date: prevMonthDate(5),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-3',
    description: 'Vendas Loja Física',
    amount: 16800,
    categoryId: 'cat1',
    date: prevMonthDate(7),
    type: 'income',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-4',
    description: 'Fornecedor Insumos Embalagens',
    amount: 4600,
    categoryId: 'cat5',
    date: prevMonthDate(10),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-5',
    description: 'Contrato de Suporte Mensal Clientes',
    amount: 17500,
    categoryId: 'cat2',
    date: prevMonthDate(12),
    type: 'income',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-6',
    description: 'Tráfego Pago Google Ads',
    amount: 2200,
    categoryId: 'cat6',
    date: prevMonthDate(15),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-7',
    description: 'Matéria-prima Plásticos Ltda',
    amount: 3700,
    categoryId: 'cat5',
    date: prevMonthDate(18),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-8',
    description: 'Guia DAS Simples Nacional',
    amount: 1250,
    categoryId: 'cat7',
    date: prevMonthDate(20),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-9',
    description: 'Consultoria Estratégica Premium',
    amount: 11500,
    categoryId: 'cat2',
    date: prevMonthDate(22),
    type: 'income',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-10',
    description: 'Folha de Pagamento + Benefícios',
    amount: 13500,
    categoryId: 'cat4',
    date: prevMonthDate(25),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-11',
    description: 'Assinatura AWS Cloud + CRM HubSpot',
    amount: 685,
    categoryId: 'cat8',
    date: prevMonthDate(26),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't-prev-12',
    description: 'Tarifas de Registro e Cobrança',
    amount: 115,
    categoryId: 'cat11',
    date: prevMonthDate(29),
    type: 'expense',
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const MOCK_BILLS = [
  {
    id: 'b1',
    description: 'Embalagens de Papelão Lote 3',
    amount: 1500,
    dueDate: '2026-05-22', // em 2 dias
    installments: 3,
    boletoBarcode: '00190.00009 02345.678903 12345.678901 5 99230000150000',
    status: 'pending' as const,
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'b2',
    description: 'Aluguel do Galpão Logístico',
    amount: 4500,
    dueDate: '2026-05-27', // em 7 dias
    installments: 1,
    boletoBarcode: '34191.79001 01043.513184 91020.150008 7 98450000450000',
    status: 'pending' as const,
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'b3',
    description: 'Servidor Dedicado Cloud Backup',
    amount: 480,
    dueDate: '2026-05-18', // atrasado
    installments: 12,
    boletoBarcode: '03399.08702 34001.222333 44101.999888 1 97220000048000',
    status: 'overdue' as const,
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'b4',
    description: 'Consultoria Contábil Mensal',
    amount: 800,
    dueDate: '2026-05-10', // pago
    installments: 1,
    boletoBarcode: '23790.11112 33333.444445 55555.666667 9 96250000080000',
    status: 'paid' as const,
    userId: 'demo',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
