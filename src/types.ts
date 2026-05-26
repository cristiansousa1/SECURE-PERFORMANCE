export type TransactionType = 'income' | 'expense';

export type CategoryGroup = 
  | 'REVENUE'        // Receita Bruta
  | 'COGS'           // CPV/CMV (Custo de Vendas)
  | 'OPEX'           // Despesas Operacionais (Aluguel, Salário, etc)
  | 'OTHER_INCOME'   // Outras Receitas
  | 'OTHER_EXPENSE'  // Outras Despesas
  | 'TAX'            // Impostos sobre Faturamento
  | 'INVESTMENT';    // Investimentos (não entra no DRE operacional direto, mas é bom ter)

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  group: CategoryGroup;
  userId: string;
  showInDRE?: boolean;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  profileId?: string;
  productId?: string;
  quantity?: number;
  productCostPrice?: number;
  isProductSale?: boolean;
  feeAmount?: number;
  netAmount?: number;
}

export interface StoreProfile {
  id: string;
  companyName: string;
  cnpj: string;
  taxRate: number;
  businessSegment: string;
  color?: string;
}

export interface DRELine {
  label: string;
  value: number;
  isBold?: boolean;
  isPercentage?: boolean;
  indent?: number;
}

export interface BusinessProfile {
  userId: string;
  companyName: string;
  currency: string;
  taxRate?: number;
  subscriptionPlan?: 'free' | 'pro' | 'enterprise' | 'annual';
  subscriptionStatus?: 'active' | 'inactive';
  corporateSubscriptions?: Array<{
    id: string;
    name: string;
    amount: number;
    categoryId: string;
    active: boolean;
  }>;
  averageBilling?: number;     // Média de faturamento registrada
  billingGoal?: number;        // Objetivo principal de faturamento
  billingGoalDeadline?: string; // Prazo do objetivo
  billingNotes?: string;       // Notas/Anotações de estratégia
}

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  period: string;
}

export interface GlobalSettings {
  plans: PlanConfig[];
}

export interface BillPayable {
  id: string;
  description: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  installments: number; // "Em quantas vezes terá que ser pago"
  boletoBarcode?: string; // "Número do boleto"
  status: 'pending' | 'paid' | 'overdue';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPriceCalc {
  id: string;
  name: string;
  sku?: string;
  costPrice: number;       // Preço de Custo (Matéria prima + insumos diretos)
  desiredMargin: number;    // % Margem de lucro desejada (Mark-up)
  sellingPrice: number;     // Preço de venda praticado
  cmvPct: number;           // CMV em % ((costPrice / sellingPrice) * 100)
  taxRate: number;         // Alíquota de imposto cobrada (%)
  otherCostsPct: number;    // Outros custos variáveis % (Comissões, Cartão, Embalagem)
  profitMarginPct: number;  // Margem líquida de lucro em %
  profitValue: number;      // Lucro líquido em R$
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
