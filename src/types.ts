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
  isCmvExpense?: boolean;
  originalSaleId?: string;
}

export interface StoreProfile {
  id: string;
  companyName: string;
  cnpj: string;
  taxRate: number;
  cardFeeRate?: number;
  businessSegment: string;
  color?: string;
  customUrl?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  socioResponsavel?: string;
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
  cardFeeRate?: number;
  balance?: number;            // Current dynamic cash balance
  subscriptionPlan?: 'free' | 'pro' | 'enterprise' | 'annual';
  subscriptionStatus?: 'active' | 'inactive';
  cancellationFeedback?: any;   // Custom feedback object stored on cancel
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
  costLimitOpex?: number;      // Limite de custo operacional (OPEX)
  costLimitCmv?: number;       // Limite de custo de mercadorias vendidas (CMV)
  businessType?: string;       // Tipo/modelo do negócio (ex: SaaS, Varejo, Alimentação, Serviços)
  businessSegment?: string;    // Custom business segment (e.g. "service", "retail")
  businessNicheDetail?: string;// Detailed custom niche
  enabledModules?: string[];   // Active sidebar modules/tabs customizable by segment
  nicheFocus?: string;         // Custom niche focus
  chargeModel?: 'subscription' | 'single_sales' | 'mixed'; // Modelo de Cobrança (Assinaturas, Vendas Únicas, Misto)
  averageTicket?: number;      // Ticket Médio
  subscriptionLink?: string;   // Link customizado para checkout de assinatura Stripe/gateway
  subscriptionPrice?: number;  // Preço customizado para a assinatura
  subscriptionAnnualLink?: string; // Link customizado para checkout anual
  subscriptionAnnualPrice?: number; // Preço customizado para a assinatura anual
  additionalGoals?: Array<{     // Outros objetivos/metas PJ adicionais
    id: string;
    title: string;
    targetValue: number;
    type: 'income' | 'profit' | 'ticket' | 'sales_volume' | 'acquisition_cost' | 'churn' | 'other' | 'liquidity';
    deadline?: string;
    reached?: boolean;
    desiredProfitMargin?: number; // Margem de lucro desejada (%) para consideração no progresso real
  }>;
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
  expenseCategory?: 'administrative' | 'marketing' | 'production'; // "Categoria da despesa (administrativa, marketing ou producao) para a DRE"
}

export interface ProductRecipeItem {
  inventoryItemId: string;    // ID do insumo vinculado
  quantityNeeded: number;     // Quantidade necessária (ex: 150g, 0.5kg)
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
  salesCount?: number;      // Contagem acumulada de vendas registradas na precificação
  recipe?: ProductRecipeItem[]; // Ficha técnica: lista de insumos com quantidades
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  currentQuantity: number;    // Quantidade atual em estoque
  minQuantity: number;        // Quantidade mínima de segurança para emitir alertas
  unit: 'g' | 'kg' | 'un';     // Claras unidades: gramas, quilos ou unidades
  costPricePerUnit: number;   // Preço de custo unitário (por g, por kg, ou por unidade)
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeveloperMessage {
  id: string;
  sender: 'user' | 'developer';
  subject: string; // 'bug' | 'feature' | 'question' | 'layout' | 'appreciation' | 'other'
  content: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  createdAt: Date;
  readByDeveloper?: boolean;
}
