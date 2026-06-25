import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, Category, BusinessProfile, DRELine, GlobalSettings, PlanConfig, BillPayable, StoreProfile, ProductPriceCalc, DeveloperMessage, InventoryItem, ProductRecipeItem } from '../types';

export interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoResource {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: string;
}
import { DEFAULT_CATEGORIES } from '../constants';
import { MOCK_TRANSACTIONS, MOCK_CATEGORIES, MOCK_BILLS } from '../mockData';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { auth, db } from '../lib/firebase';
import { sound } from '../utils/SoundEngine';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  serverTimestamp, 
  Timestamp,
  where,
  getDocs
} from 'firebase/firestore';

const DEFAULT_PLANS: PlanConfig[] = [
  { id: 'basic', name: 'Plano Básico', price: 9.90, period: '/mês' },
  { id: 'pro', name: 'Plano Pro', price: 19.90, period: '/mês' },
  { id: 'annual', name: 'Plano Anual', price: 119.90, period: '/ano' }
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  
  // Filter out and suppress benign Firestore idle stream disconnects / timeouts / cancellations
  const isBenign = 
    errMsg.includes('Disconnecting idle stream') ||
    errMsg.includes('Cancelled: Disconnecting idle stream') ||
    errMsg.includes('Timed out waiting for new targets') ||
    errMsg.includes('cancelled') ||
    errMsg.includes('unauthenticated') || 
    (errMsg.toLowerCase().includes('listen') && errMsg.toLowerCase().includes('stream')) ||
    (error && typeof error === 'object' && (error as any).code === 1);

  if (isBenign) {
    return; // Quietly ignore expected connection resets / stream closures
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We remove the throw to avoid crashing the whole app during background syncs
}

function isPlainObject(value: any): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (isPlainObject(obj)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

function parseFirebaseDate(val: any): Date {
  if (val === null || val === undefined) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val && typeof val.toDate === 'function') return val.toDate();
  
  if (val && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return new Date();
}

interface FinanceContextType {
  user: User | null;
  loading: boolean;
  transactions: Transaction[];
  allTransactions: Transaction[];
  categories: Category[];
  notes: Note[];
  bills: BillPayable[];
  profile: BusinessProfile | null;
  settings: GlobalSettings | null;
  isDemoMode: boolean;
  setDemoMode: (active: boolean) => void;
  interactionCount: number;
  trackDemoInteraction: () => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { profileId?: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, 'id' | 'userId'>) => Promise<void>;
  updateProfile: (p: Partial<BusinessProfile>) => Promise<void>;
  updateSettings: (s: GlobalSettings) => Promise<void>;
  addNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, title: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addBill: (b: Omit<BillPayable, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  updateBill: (id: string, updates: Partial<BillPayable>) => Promise<void>;
  payBill: (id: string, categoryId: string) => Promise<void>;
  getDRE: (month: Date) => DRELine[];
  products: ProductPriceCalc[];
  addProduct: (p: Omit<ProductPriceCalc, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProduct: (id: string, updates: Partial<ProductPriceCalc>) => Promise<void>;
  inventoryItems: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  toast: { message: string; type: "success" | "warning" | "error" | "info"; isDarkPanel?: boolean } | null;
  showToast: (message: string, type?: "success" | "warning" | "error" | "info", options?: { isDarkPanel?: boolean }) => void;
  hideToast: () => void;
  storeProfiles: StoreProfile[];
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
  addStoreProfile: (sp: Omit<StoreProfile, "id">) => Promise<void>;
  deleteStoreProfile: (id: string) => Promise<void>;
  updateStoreProfile: (id: string, updates: Partial<StoreProfile>) => Promise<void>;
  language: 'pt' | 'en' | 'es';
  setLanguage: (lang: 'pt' | 'en' | 'es') => void;
  t: (key: string) => string;
  developerMessages: DeveloperMessage[];
  addDeveloperMessage: (subject: string, content: string) => Promise<void>;
  addDeveloperReply: (messageId: string, replyContent: string, sender?: 'user' | 'developer') => Promise<void>;
  firebaseSyncStatus: 'synced' | 'syncing' | 'idle';
  setFirebaseSyncStatus: (status: 'synced' | 'syncing' | 'idle') => void;
  demoSpeed: number;
  setDemoSpeed: (seconds: number) => void;
  triggerLiveSimTransaction: () => void;
  lastSimulatedTransactions: Array<{ id: string; description: string; amount: number; type: 'income' | 'expense'; date: Date }>;
  clearAllData: (mode?: 'month' | 'all') => Promise<void>;
}

const LANGUAGES_DICTIONARY = {
  pt: {
    // Tabs & Navigation Labels
    "tab_dashboard": "Cockpit IA & Performance",
    "tab_gemini-chat": "Copilot de IA",
    "tab_cashflow": "Performance de Caixa",
    "tab_strategic-report": "Auditoria, DRE & Governança",
    "tab_segment-metrics": "Crescimento & Marketing",
    "tab_analytics": "Comparações Gráficas Consolidadas",
    "tab_payable": "Gestão de Passivos Operacionais",
    "tab_strategies": "Planejamento Estratégico Corporativo",
    "tab_agenda": "Cronograma Seguro de Execuções PJ",
    "tab_pricing": "Modelagem Matemática de Precificação",
    "tab_knowledge": "Manual de Conformidade Operacional",
    "tab_settings": "Configurações de Segurança de Dados",
    "tab_help": "Ajuda & Tutoriais Tecnológicos",
    "tab_integrations": "Integração Multicloud & Conexões",
    "tab_admin": "Painel Administrativo da Sandbox",
    "tab_billing-goal": "Foco nas Metas de Faturamento",
    "tab_transactions": "Controle de Lançamentos Sínclitos",
 
    // Navigation Exact Sidebar Labels
    "nav_cockpit_ia_performance": "Cockpit IA & Performance",
    "nav_cerebro_de_inteligencia": "Copilot de IA",
    "nav_performance_de_caixa": "Performance de Caixa",
    "nav_registro_de_lancamentos": "Registro de Lançamentos",
    "nav_controle_orcamentario": "Controle Orçamentário",
    "nav_meta_de_expansao_pj": "Meta de Expansão PJ",
    "nav_campanhas_benchmarks": "Crescimento & Marketing",
    "nav_gestao_de_passivos_pj": "Gestão de Passivos PJ",
    "nav_auditoria_dre_corporativo": "Auditoria & DRE Corporativo",
    "nav_engenharia_de_precificacao": "Engenharia de Precificação",
    "nav_cronograma_de_diretivas": "Cronograma de Diretrizes",
    "nav_manual_de_conformidade": "Manual de Conformidade",
    "nav_criptografia_parametros_base": "Segurança & Configurações",
    "nav_central_de_ajuda_correlata": "Central de Ajuda",
    "nav_engenharia_financeira_ia": "Engenharia Financeira IA",
    "nav_maximizador_de_ganhos_ia": "Maximizador de Ganhos IA",
    "nav_indicacoes_parcerias_pj": "Indicações & Parcerias PJ",
    "nav_canal_do_desenvolvedor": "Canal do Desenvolvedor",
    "nav_painel_de_governanca_planos": "Painel de Governança & Planos",
    "nav_provedores_de_chaves_quotas": "Provedores de Chaves & Quotas",
    "nav_futuro_decenal": "Planejamento Futuro",
    "nav_planejamento_tributario": "Planejamento Tributário",

    // General App Text
    "select_language": "Idioma",
    "active_billing_goal_title": "Objetivo de Faturamento Ativo",
    "active_okrs_recommendations": "OKRs Recomendados por IA",
    "language_selector_caption": "Escolha o idioma do sistema",
    "welcome_message": "Bem-vindo de volta ao Cockpit Executivo",
    "save_settings": "Salvar Configurações",
    "logout_session": "Encerrar Sessão",
    "demo_mode_active": "Modo de Demonstração Corporativo Ativo",
    "currency_symbol": "R$",
    "data_security": "Governança e Segurança cibernética",
    "billing_goal": "Meta de Faturamento Comercial",
    "average_billing": "Faturamento MédioPJ",
    "growth_needed": "Crescimento Líquido Necessário",
    "financial_health": "Saúde Operacional de Caixa",
    "performance_summary": "Súmula de Desempenho",
    "monthly_income": "Receita Deste Competência",

    // Tab Descriptions
    "desc_dashboard": "Acompanhe e analise a performance financeira e o faturamento do seu negócio em tempo real.",
    "desc_transactions": "Registro, controle e conciliação de seus lançamentos financeiros diários.",
    "desc_segment-metrics": "Estudos setoriais, simulações de sensibilidade e planejamento estratégico de metas e tração.",
    "desc_analytics": "Métricas consolidadas de vendas, faturamento multicanal e relatórios comparativos.",
    "desc_cashflow": "Fluxo de caixa detalhado, acompanhamento de receitas e despesas com projeções de liquidez.",
    "desc_strategic-report": "Análise de DRE consolidado estruturado de acordo com padrões de contabilidade e relatórios gerenciais.",
    "desc_payable": "Gestão e controle de compromissos operacionais, prazos e contas a pagar.",
    "desc_strategies": "Planejamento tático de metas comerciais e simulação de cenários financeiros.",
    "desc_agenda": "Cronograma operacional sequencial e controle de compromissos corporativos.",
    "desc_pricing": "Estrutura matemática de markups, cálculo de CMV e definição científica de preços.",
    "desc_knowledge": "Diretrizes recomendadas e boas práticas de conformidade operacional.",
    "desc_settings": "Configurações de segurança da conta, preferências do sistema e dados corporativos.",
    "desc_help": "Guias de suporte, documentação de processos e tutoriais da plataforma.",
    "desc_integrations": "Integração de serviços multicanais, conexões externas e monitoramento de consumo de dados.",

    // Common UI Vocabulary Mapping For Instant Dynamic Translations
    "faturamento bruto": "Faturamento Bruto",
    "despesa total": "Despesa Total",
    "saldo líquido": "Saldo Líquido",
    "margem líquida real": "Margem Líquida Real",
    "ambiente 100% criptografado": "Ambiente 100% Criptografado",
    "recolher": "Recolher",
    "monitorar:": "Monitorar:",
    "consolidado (todas as lojas)": "Consolidado (Todas as Lojas)",
    "receitas": "Receitas",
    "despesas": "Despesas",
    "pagas": "Pagas",
    "pendentes": "Pendentes",
    "em atraso": "Em atraso",
    "todas contas": "Todas Contas",
    "novo lançamento": "Novo Lançamento",
    "importar do erp": "Importar do ERP",
    "sair": "Sair",
    "Sair": "Sair",
    "expandir": "Expandir",
    "Expandir": "Expandir"
  },
  en: {
    // Tabs & Navigation Labels
    "tab_dashboard": "AI Cockpit & Performance",
    "tab_gemini-chat": "AI Copilot",
    "tab_cashflow": "Cash Performance",
    "tab_strategic-report": "Audit, DRE & Governance",
    "tab_segment-metrics": "Growth & Marketing",
    "tab_analytics": "Consolidated Graphical Comparisons",
    "tab_payable": "Operating Liabilities Management",
    "tab_strategies": "Corporate Strategic Planning",
    "tab_agenda": "Safe PJ Execution Schedule",
    "tab_pricing": "Pricing Mathematical Modeling",
    "tab_knowledge": "Operational Compliance Manual",
    "tab_settings": "Data Security Settings",
    "tab_help": "Help & Technological Tutorials",
    "tab_integrations": "Multicloud Integration & Connections",
    "tab_admin": "Sandbox Administrative Dashboard",
    "tab_billing-goal": "Focus on Billing Goals",
    "tab_transactions": "Synchronized Transactions Control",
 
    // Navigation Exact Sidebar Labels
    "nav_cockpit_ia_performance": "AI Cockpit & Performance",
    "nav_cerebro_de_inteligencia": "AI Copilot",
    "nav_performance_de_caixa": "Cash Performance",
    "nav_registro_de_lancamentos": "Transaction Registry",
    "nav_controle_orcamentario": "Budgetary Control",
    "nav_meta_de_expansao_pj": "Expansion Goal (PJ)",
    "nav_campanhas_benchmarks": "Growth & Marketing",
    "nav_gestao_de_passivos_pj": "Operating Liabilities Management",
    "nav_auditoria_dre_corporativo": "Audit & Corporate DRE",
    "nav_engenharia_de_precificacao": "Pricing Engineering",
    "nav_cronograma_de_diretivas": "Guidelines Schedule",
    "nav_manual_de_conformidade": "Compliance Manual",
    "nav_criptografia_parametros_base": "Security & Settings",
    "nav_central_de_ajuda_correlata": "Help Center",
    "nav_engenharia_financeira_ia": "AI Financial Engineering",
    "nav_maximizador_de_ganhos_ia": "AI Earnings Maximizer",
    "nav_indicacoes_parcerias_pj": "Referral & Partnerships",
    "nav_canal_do_desenvolvedor": "Developer Channel",
    "nav_painel_de_governanca_planos": "Governance & Plans Panel",
    "nav_provedores_de_chaves_quotas": "Key Providers & Quotas",
    "nav_futuro_decenal": "Future Planning",
    "nav_planejamento_tributario": "Tax Planning",

    // General App Text
    "select_language": "Language",
    "active_billing_goal_title": "Active Billing Objective",
    "active_okrs_recommendations": "AI-Recommended OKRs",
    "language_selector_caption": "Choose the platform language",
    "welcome_message": "Welcome back to Executive Cockpit",
    "save_settings": "Save Settings",
    "logout_session": "Logout",
    "demo_mode_active": "Corporate Demo Mode Active",
    "currency_symbol": "$",
    "data_security": "Cybersecurity & Governance",
    "billing_goal": "Commercial Billing Goal",
    "average_billing": "Average Billing (PJ)",
    "growth_needed": "Net Growth Required",
    "financial_health": "Cash Operational Health",
    "performance_summary": "Performance Summary",
    "monthly_income": "This Competency's Revenue",

    // Tab Descriptions
    "desc_dashboard": "Track and analyze your business financial performance and revenue in real time.",
    "desc_transactions": "Secure record, control, and reconciliation of your daily financial entries.",
    "desc_segment-metrics": "Sector studies, sensitivity simulations, and strategic planning of billing goals and growth traction.",
    "desc_analytics": "Consolidated sales metrics, multi-channel performance tracking, and comparative reporting.",
    "desc_cashflow": "Detailed cash flow tracking, monitoring of incomes and expenses with liquidity forecasts.",
    "desc_strategic-report": "Structured consolidated DRE analysis in accordance with financial accounting standards and management reports.",
    "desc_payable": "Management and control of operational liabilities, deadlines, and accounts payable.",
    "desc_strategies": "Tactical planning of business goals and financial scenario simulations.",
    "desc_agenda": "Sequential operational timeline and corporate task scheduling.",
    "desc_pricing": "Mathematical markup structures, calculation of Cost of Goods Sold (CMV), and scientific pricing tools.",
    "desc_knowledge": "Recommended guidelines, processes, and operational compliance best practices.",
    "desc_settings": "Account security controls, system preferences, and corporate data settings.",
    "desc_help": "Support guides, core documentation, and visual platform tutorials.",
    "desc_integrations": "Multi-channel service integration, external API connections, and bandwidth usage tracking.",

    // Common UI Vocabulary Mapping For Instant Dynamic Translations
    "faturamento bruto": "Gross Revenue",
    "despesa total": "Total Expense",
    "saldo líquido": "Net Balance",
    "margem líquida real": "Real Net Margin",
    "ambiente 100% criptografado": "100% Encrypted Environment",
    "recolher": "Collapse",
    "monitorar:": "Monitor:",
    "consolidado (todas as lojas)": "Consolidated (All Stores)",
    "receitas": "Incomes",
    "despesas": "Expenses",
    "pagas": "Paid",
    "pendentes": "Pending",
    "em atraso": "Overdue",
    "todas contas": "All Accounts",
    "novo lançamento": "New Transaction",
    "importar do erp": "Import from ERP",
    "sair": "Logout",
    "Sair": "Logout",
    "expandir": "Expand",
    "Expandir": "Expand"
  },
  es: {
    // Tabs & Navigation Labels
    "tab_dashboard": "Cabina de IA y Rendimiento",
    "tab_gemini-chat": "Copilot de IA",
    "tab_cashflow": "Rendimiento de Caja",
    "tab_strategic-report": "Auditoría, DRE y Gobernanza",
    "tab_segment-metrics": "Crecimiento & Marketing",
    "tab_analytics": "Comparaciones Gráficas Consolidadas",
    "tab_payable": "Gestión de Pasivos Operativos",
    "tab_strategies": "Planificación Estratégica Corporativa",
    "tab_agenda": "Cronograma de Ejecuciones PJ Segura",
    "tab_pricing": "Modelado Matemático de Precios",
    "tab_knowledge": "Manual de Cumplimiento Operativo",
    "tab_settings": "Configuración de Seguridad de Datos",
    "tab_help": "Ayuda y Tutoriales Tecnológicos",
    "tab_integrations": "Integración Multicloud y Conexiones",
    "tab_admin": "Panel de Administración Sandbox",
    "tab_billing-goal": "Foco en Metas de Facturación",
    "tab_transactions": "Control de Transacciones Síncronas",
 
    // Navigation Exact Sidebar Labels
    "nav_cockpit_ia_performance": "Cabina de IA y Rendimiento",
    "nav_cerebro_de_inteligencia": "Copilot de IA",
    "nav_performance_de_caixa": "Rendimiento de Caja",
    "nav_registro_de_lancamentos": "Registro de Transacciones",
    "nav_controle_orcamentario": "Control Presupuestario",
    "nav_meta_de_expansao_pj": "Meta de Expansión PJ",
    "nav_campanhas_benchmarks": "Crecimiento & Marketing",
    "nav_gestao_de_passivos_pj": "Gestión de Pasivos Operativos",
    "nav_auditoria_dre_corporativo": "Auditoría y DRE Corporativo",
    "nav_engenharia_de_precificacao": "Ingeniería de Precios",
    "nav_cronograma_de_diretivas": "Cronograma de Directrices",
    "nav_manual_de_conformidade": "Manual de Cumplimiento",
    "nav_criptografia_parametros_base": "Seguridad y Configuración",
    "nav_central_de_ajuda_correlata": "Centro de Ajuda",
    "nav_engenharia_financeira_ia": "Ingeniería Financiera IA",
    "nav_maximizador_de_ganhos_ia": "Maximizador de Ganancias IA",
    "nav_indicacoes_parcerias_pj": "Referencias y Alianzas PJ",
    "nav_canal_do_desenvolvedor": "Canal del Desarrollador",
    "nav_painel_de_governanca_planos": "Panel de Gobernanza y Planes",
    "nav_provedores_de_chaves_quotas": "Proveedores de Claves y Cuotas",
    "nav_futuro_decenal": "Planeación Futura",
    "nav_planejamento_tributario": "Planificación Tributaria",

    // General App Text
    "select_language": "Idioma",
    "active_billing_goal_title": "Objetivo de Facturación Activo",
    "active_okrs_recommendations": "OKRs Recomendados por IA",
    "language_selector_caption": "Elija el idioma de la plataforma",
    "welcome_message": "Bienvenido de nuevo a la Cabina Ejecutiva",
    "save_settings": "Guardar Configuración",
    "logout_session": "Cerrar Sesión",
    "demo_mode_active": "Modo de Demo Corporativo Activo",
    "currency_symbol": "₣",
    "data_security": "Gobernanza y Seguridad Cibernética",
    "billing_goal": "Meta de Facturación Comercial",
    "average_billing": "Facturación Promedio PJ",
    "growth_needed": "Crecimiento Neto Necesario",
    "financial_health": "Salud de Caja Operacional",
    "performance_summary": "Resumen de Rendimiento",
    "monthly_income": "Ingresos de Esta Competencia",

    // Tab Descriptions
    "desc_dashboard": "Seguimiento y análisis del rendimiento financiero y los ingresos de su empresa en tiempo real.",
    "desc_transactions": "Registro, control y conciliación seguro de sus transacciones financieras diarias.",
    "desc_segment-metrics": "Estudios sectoriales, simulaciones de sensibilidad y planificación estratégica de metas de facturación.",
    "desc_analytics": "Métricas consolidadas de ventas, seguimiento de rendimiento multicanal e informes comparativos.",
    "desc_cashflow": "Seguimiento detallado del flujo de caja, monitoreo de ingresos y gastos con pronósticos de liquidez.",
    "desc_strategic-report": "Análisis estructurado de DRE consolidado conforme a principios contables e informes gerenciales.",
    "desc_payable": "Gestión y control de pasivos operativos, plazos y cuentas por pagar.",
    "desc_strategies": "Planificación táctica de metas comerciales y simulación de escenarios financieros.",
    "desc_agenda": "Cronograma operativo secuencial y agenda de tareas corporativas.",
    "desc_pricing": "Estructura matemática de márgenes, cálculo de CMV y herramientas científicas de precios.",
    "desc_knowledge": "Directrices recomendadas, procesos y mejores prácticas de cumplimiento operativo.",
    "desc_settings": "Controles de seguridad de la cuenta, preferencias corporativas y configuración de datos.",
    "desc_help": "Guías de soporte, documentación clave y tutoriales visuales de la plataforma.",
    "desc_integrations": "Integración de servicios multicanal, conexiones de API externas y consumo de datos.",

    // Common UI Vocabulary Mapping For Instant Dynamic Translations
    "faturamento bruto": "Ingresos Brutos",
    "despesa total": "Gastos Totales",
    "saldo líquido": "Saldo Neto",
    "margem líquida real": "Margen Neto Real",
    "ambiente 100% criptografado": "Ambiente 100% Cifrado",
    "recolher": "Contraer",
    "monitorar:": "Monitorear:",
    "consolidado (todas as lojas)": "Consolidado (Todas las Tiendas)",
    "receitas": "Ingresos",
    "despesas": "Gastos",
    "pagas": "Pagadas",
    "pendentes": "Pendientes",
    "em atraso": "En atraso",
    "todas contas": "Todas las Cuentas",
    "novo lançamento": "Nueva Transacción",
    "importar do erp": "Importar desde ERP",
    "sair": "Salir",
    "Sair": "Salir",
    "expandir": "Expandir",
    "Expandir": "Expandir"
  }
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<'pt' | 'en' | 'es'>(() => {
    const saved = localStorage.getItem("dafne_language");
    if (saved === 'pt' || saved === 'en' || saved === 'es') return saved;
    return 'pt';
  });

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("dafne_local_transactions");
    if (saved) {
      try {
        return JSON.parse(saved).map((t: any) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        }));
      } catch (e) { console.error("Error reading local transactions", e); }
    }
    return [];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("dafne_local_categories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { console.error("Error reading local categories", e); }
    }
    return [];
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("dafne_local_notes");
    if (saved) {
      try {
        return JSON.parse(saved).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt)
        }));
      } catch (e) { console.error("Error reading local notes", e); }
    }
    return [];
  });
  const [developerMessages, setDeveloperMessages] = useState<DeveloperMessage[]>([]);
  const [demoDeveloperMessages, setDemoDeveloperMessages] = useState<DeveloperMessage[]>(() => {
    const saved = localStorage.getItem("dafne_demo_developer_messages");
    if (saved) {
      try {
        return JSON.parse(saved).map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt)
        }));
      } catch (e) { console.error("Error reading demo dev messages", e); }
    }
    return [
      {
        id: "msg1",
        sender: "developer",
        subject: "feature",
        content: "Olá! Seja muito bem-vindo ao MaxPerformance Business. Sou o desenvolvedor responsável pela plataforma. Sinta-se à vontade para enviar dúvidas, sugestões de novas fórmulas, relatórios ou feedbacks por aqui!",
        userId: "demo",
        userName: "Desenvolvedor",
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        readByDeveloper: true
      },
      {
        id: "msg2",
        sender: "user",
        subject: "question",
        content: "Valeu! Gostei muito da mecânica de precificação rápida e o simulador estratégico de DRE. É possível exportar relatórios customizados?",
        userId: "demo",
        userName: "Cristian",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        readByDeveloper: true
      },
      {
        id: "msg3",
        sender: "developer",
        subject: "question",
        content: "Sim! Você pode clicar no botão 'Exportar DRE para PDF' ou 'Imprimir PDF' na aba de relatórios. Ela gera um PDF lindo e formatado segundo o padrão de relatórios executivos para investidores e bancos.",
        userId: "demo",
        userName: "Desenvolvedor",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        readByDeveloper: true
      }
    ];
  });
  const [realBills, setRealBills] = useState<BillPayable[]>(() => {
    const saved = localStorage.getItem("dafne_local_bills");
    if (saved) {
      try {
        return JSON.parse(saved).map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt)
        }));
      } catch (e) { console.error("Error reading local bills", e); }
    }
    return [];
  });
  const [demoBills, setDemoBills] = useState<BillPayable[]>(() => {
    const saved = localStorage.getItem("dafne_demo_bills");
    if (saved) {
      try {
        return JSON.parse(saved).map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt)
        }));
      } catch (e) { console.error("Error reading demo bills", e); }
    }
    return MOCK_BILLS;
  });
  const [profile, setProfile] = useState<BusinessProfile | null>(() => {
    const saved = localStorage.getItem("dafne_local_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { console.error("Error reading local profile", e); }
    }
    return null;
  });
  const [settings, setSettings] = useState<GlobalSettings | null>(null);

  // Auto-Save watch triggers with clean useEffect blocks
  useEffect(() => {
    if (profile) {
      localStorage.setItem("dafne_local_profile", JSON.stringify(profile));
    }
  }, [profile]);
  const [isDemoMode, setDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("dafne_is_demo_mode");
    return saved === "true";
  });
  const [demoSpeed, setDemoSpeed] = useState<number>(() => {
    const saved = localStorage.getItem("dafne_demo_speed");
    return saved !== null ? Number(saved) : 0;
  });
  const [lastSimulatedTransactions, setLastSimulatedTransactions] = useState<Array<{ id: string; description: string; amount: number; type: 'income' | 'expense'; date: Date }>>([]);
  const [demoTransactions, setDemoTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("dafne_demo_transactions");
    if (saved) {
      try {
        return JSON.parse(saved).map((t: any) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        }));
      } catch (e) { console.error("Error reading demo transactions", e); }
    }
    return MOCK_TRANSACTIONS;
  });
  const [demoCategories, setDemoCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("dafne_demo_categories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { console.error("Error reading demo categories", e); }
    }
    return MOCK_CATEGORIES;
  });
  const [interactionCount, setInteractionCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" | "info"; isDarkPanel?: boolean } | null>(null);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'synced' | 'syncing' | 'idle'>('idle');

  const [realProducts, setRealProducts] = useState<ProductPriceCalc[]>(() => {
    const saved = localStorage.getItem("dafne_local_products");
    if (saved) {
      try {
        return JSON.parse(saved).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
      } catch (e) { console.error("Error reading local products", e); }
    }
    return [];
  });
  const [demoProducts, setDemoProducts] = useState<ProductPriceCalc[]>(() => {
    const saved = localStorage.getItem("dafne_demo_products");
    if (saved) {
      try {
        return JSON.parse(saved).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
      } catch (e) { console.error("Error reading demo products", e); }
    }
    return [
      {
        id: "p1",
        name: "Combo Smash Bacon (Double Smash + Batata + Refrigerante)",
        sku: "CSB-001",
        costPrice: 12.90,
        desiredMargin: 35.0,
        sellingPrice: 48.00,
        cmvPct: 26.8,
        taxRate: 6.0,
        otherCostsPct: 10.0,
        profitMarginPct: 57.2,
        profitValue: 27.48,
        salesCount: 780,
        recipe: [
          { inventoryItemId: "i1", quantityNeeded: 180 }, // 180g Blend Carne
          { inventoryItemId: "i2", quantityNeeded: 1 },   // 1 Un Pão Brioche
          { inventoryItemId: "i3", quantityNeeded: 40 }   // 40g Queijo Cheddar
        ],
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "p2",
        name: "Burger Artesanal Grelhado Trufado (Blend 180g + Brie)",
        sku: "BGT-002",
        costPrice: 19.50,
        desiredMargin: 40.0,
        sellingPrice: 58.00,
        cmvPct: 33.6,
        taxRate: 6.0,
        otherCostsPct: 8.0,
        profitMarginPct: 52.4,
        profitValue: 30.39,
        salesCount: 340,
        recipe: [
          { inventoryItemId: "i1", quantityNeeded: 185 }, // 185g Blend Carne
          { inventoryItemId: "i2", quantityNeeded: 1 },   // 1 Un Pão Brioche
          { inventoryItemId: "i4", quantityNeeded: 50 }   // 50g brie trufado
        ],
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "p3",
        name: "Smash Burger Clássico (120g + Cheddar)",
        sku: "SBC-003",
        costPrice: 8.50,
        desiredMargin: 30.0,
        sellingPrice: 32.00,
        cmvPct: 26.5,
        taxRate: 6.0,
        otherCostsPct: 10.0,
        profitMarginPct: 57.5,
        profitValue: 18.40,
        salesCount: 920,
        recipe: [
          { inventoryItemId: "i1", quantityNeeded: 120 }, // 120g Blend Carne
          { inventoryItemId: "i2", quantityNeeded: 1 },   // 1 Un Pão Brioche
          { inventoryItemId: "i3", quantityNeeded: 30 }   // 30g Queijo Cheddar
        ],
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "p4",
        name: "Porção de Batata Rústica Turbinada (Bacon & Cheddar)",
        sku: "BRT-004",
        costPrice: 4.80,
        desiredMargin: 35.0,
        sellingPrice: 24.00,
        cmvPct: 20.0,
        taxRate: 6.0,
        otherCostsPct: 12.0,
        profitMarginPct: 62.0,
        profitValue: 14.88,
        salesCount: 610,
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "p5",
        name: "Pink Lemonade Saborizada do Bosque (400ml)",
        sku: "PLB-005",
        costPrice: 2.20,
        desiredMargin: 25.0,
        sellingPrice: 14.90,
        cmvPct: 14.8,
        taxRate: 6.0,
        otherCostsPct: 10.0,
        profitMarginPct: 69.2,
        profitValue: 10.31,
        salesCount: 450,
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  });

  const products = isDemoMode ? demoProducts : realProducts;

  // Inventory Stock Management State
  const [realInventoryItems, setRealInventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("dafne_local_inventory");
    if (saved) {
      try {
        return JSON.parse(saved).map((i: any) => ({
          ...i,
          createdAt: new Date(i.createdAt),
          updatedAt: new Date(i.updatedAt)
        }));
      } catch (e) { console.error("Error reading local inventory", e); }
    }
    return [];
  });
  const [demoInventoryItems, setDemoInventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("dafne_demo_inventory");
    if (saved) {
      try {
        return JSON.parse(saved).map((i: any) => ({
          ...i,
          createdAt: new Date(i.createdAt),
          updatedAt: new Date(i.updatedAt)
        }));
      } catch (e) { console.error("Error reading demo inventory", e); }
    }
    return [
      {
        id: "i1",
        name: "Blend Bovino Black Angus (Fresco)",
        sku: "INS-001",
        currentQuantity: 152000,
        minQuantity: 40000,
        unit: "g",
        costPricePerUnit: 0.040,
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "i2",
        name: "Pão Brioche Gourmet Saborizado",
        sku: "INS-002",
        currentQuantity: 850,
        minQuantity: 200,
        unit: "un",
        costPricePerUnit: 1.10,
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "i3",
        name: "Queijo Cheddar Prato Artesanal Fatiado",
        sku: "INS-003",
        currentQuantity: 42000,
        minQuantity: 15000,
        unit: "g",
        costPricePerUnit: 0.045,
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "i4",
        name: "Queijo Brie Francês Curado",
        sku: "INS-004",
        currentQuantity: 16000,
        minQuantity: 5000,
        unit: "g",
        costPricePerUnit: 0.090,
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "i5",
        name: "Bacon de Lombo Defumado em Árvore Pecã",
        sku: "INS-005",
        currentQuantity: 24000,
        minQuantity: 8000,
        unit: "g",
        costPricePerUnit: 0.038,
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "i6",
        name: "Molho Secreto da Casa Smash & Co.",
        sku: "INS-006",
        currentQuantity: 18500,
        minQuantity: 5000,
        unit: "g",
        costPricePerUnit: 0.022,
        userId: "demo",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  });

  const inventoryItems = isDemoMode ? demoInventoryItems : realInventoryItems;

  // Auto-Save watch triggers with clean useEffect blocks
  useEffect(() => {
    localStorage.setItem("dafne_is_demo_mode", String(isDemoMode));
  }, [isDemoMode]);

  useEffect(() => {
    localStorage.setItem("dafne_demo_speed", String(demoSpeed));
  }, [demoSpeed]);

  useEffect(() => {
    localStorage.setItem("dafne_local_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("dafne_local_products", JSON.stringify(realProducts));
  }, [realProducts]);

  useEffect(() => {
    localStorage.setItem("dafne_local_inventory", JSON.stringify(realInventoryItems));
  }, [realInventoryItems]);

  useEffect(() => {
    localStorage.setItem("dafne_local_bills", JSON.stringify(realBills));
  }, [realBills]);

  useEffect(() => {
    localStorage.setItem("dafne_local_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("dafne_local_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("dafne_demo_transactions", JSON.stringify(demoTransactions));
  }, [demoTransactions]);

  useEffect(() => {
    localStorage.setItem("dafne_demo_products", JSON.stringify(demoProducts));
  }, [demoProducts]);

  useEffect(() => {
    localStorage.setItem("dafne_demo_inventory", JSON.stringify(demoInventoryItems));
  }, [demoInventoryItems]);

  useEffect(() => {
    localStorage.setItem("dafne_demo_bills", JSON.stringify(demoBills));
  }, [demoBills]);

  useEffect(() => {
    localStorage.setItem("dafne_demo_categories", JSON.stringify(demoCategories));
  }, [demoCategories]);

  useEffect(() => {
    localStorage.setItem("dafne_demo_developer_messages", JSON.stringify(demoDeveloperMessages));
  }, [demoDeveloperMessages]);

  // Multiple Store Profiles State - Split for Demo Mode representation
  const [realStoreProfiles, setRealStoreProfiles] = useState<StoreProfile[]>(() => {
    const saved = localStorage.getItem('finai_store_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'matriz', companyName: 'Minha Empresa Matriz', cnpj: '', taxRate: 0, cardFeeRate: 0, businessSegment: 'general', color: 'zinc' }
    ];
  });

  const [demoStoreProfiles, setDemoStoreProfiles] = useState<StoreProfile[]>([
    { 
      id: 'matriz', 
      companyName: 'Bife Real (Moema SP)', 
      cnpj: '12.345.678/0001-01', 
      taxRate: 6, 
      cardFeeRate: 2.5, 
      businessSegment: 'food', 
      color: 'orange',
      razaoSocial: 'Bife Real Alimentos LTDA',
      inscricaoEstadual: '110.220.330.111',
      inscricaoMunicipal: '9.876.543-2',
      socioResponsavel: 'Cristian Milkymoo'
    },
    { 
      id: 'filial', 
      companyName: 'Moctail Bar (Mooca SP)', 
      cnpj: '87.654.321/0002-02', 
      taxRate: 8, 
      cardFeeRate: 3.2, 
      businessSegment: 'food', 
      color: 'blue',
      razaoSocial: 'Moctail Drinks e Eventos EIRELI',
      inscricaoEstadual: '220.440.550.222',
      inscricaoMunicipal: '8.765.432-1',
      socioResponsavel: 'Cristian Milkymoo'
    },
    {
      id: 'store-cpf-1',
      companyName: 'Representação Sorocaba (Sorocaba)',
      cnpj: '456.789.012-34',
      taxRate: 4,
      cardFeeRate: 1.9,
      businessSegment: 'services',
      color: 'emerald',
      razaoSocial: 'Cristian de Souza Silva (MEI Representações)',
      inscricaoEstadual: 'ISENTO',
      inscricaoMunicipal: '7.654.321-0',
      socioResponsavel: 'Cristian de Souza Silva'
    }
  ]);

  const storeProfiles = isDemoMode ? demoStoreProfiles : realStoreProfiles;
  const setStoreProfiles = isDemoMode ? setDemoStoreProfiles : setRealStoreProfiles;

  const [activeStoreId, setActiveStoreId] = useState<string>(() => {
    return localStorage.getItem('finai_active_store_id') || 'all';
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('finai_store_profiles', JSON.stringify(realStoreProfiles));
  }, [realStoreProfiles]);

  useEffect(() => {
    localStorage.setItem('finai_active_store_id', activeStoreId);
  }, [activeStoreId]);

  const addStoreProfile = async (sp: Omit<StoreProfile, 'id'>) => {
    const newStore: StoreProfile = {
      ...sp,
      id: 'store-' + Math.random().toString(36).substring(2, 9)
    };
    setStoreProfiles(prev => [...prev, newStore]);
    showToast(`Perfil "${sp.companyName}" criado com sucesso!`, "success");
  };

  const deleteStoreProfile = async (id: string) => {
    if (storeProfiles.length <= 1) {
      showToast("Não é possível remover. Você deve manter pelo menos um perfil de empresa.", "warning");
      return;
    }
    setStoreProfiles(prev => prev.filter(p => p.id !== id));
    if (activeStoreId === id) {
      setActiveStoreId('all');
    }
    showToast("Perfil de empresa removido.", "info");
  };

  const updateStoreProfile = async (id: string, updates: Partial<StoreProfile>) => {
    setStoreProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    showToast("Perfil de empresa atualizado.", "success");
  };

  const rawAllTransactions = isDemoMode ? demoTransactions : transactions;
  
  // Distribute demo/real transactions evenly across existing stores
  const allTransactions = React.useMemo(() => {
    return rawAllTransactions.map((t, index) => {
      if (t.profileId) return t;
      const storeIds = storeProfiles.map(s => s.id);
      const storeId = storeIds[index % storeIds.length] || 'matriz';
      return {
        ...t,
        profileId: storeId
      };
    });
  }, [rawAllTransactions, storeProfiles]);

  const filteredTransactions = React.useMemo(() => {
    if (activeStoreId === 'all') {
      return allTransactions;
    }
    return allTransactions.filter(t => t.profileId === activeStoreId);
  }, [allTransactions, activeStoreId]);

  const resolvedCategories = React.useMemo(() => {
    let activeCategories = isDemoMode ? demoCategories : categories;
    
    // Ensure CMV category is always present
    const hasCmv = activeCategories.some(c => c.name.toLowerCase().includes('cmv, custo de vendas') || c.name.toLowerCase() === 'cmv');
    if (!hasCmv) {
      const virtualCmvCat: Category = {
        id: 'cat-virtual-cmv',
        name: 'CMV, custo de vendas',
        type: 'expense',
        group: 'COGS',
        userId: user?.uid || 'demo'
      };
      activeCategories = [...activeCategories, virtualCmvCat];
    }

    const hasInvestment = activeCategories.some(c => c.group === 'INVESTMENT');
    if (!hasInvestment) {
      const virtualInvestmentCat: Category = {
        id: 'cat-virtual-investment',
        name: 'Aportes e Investimentos',
        type: 'expense',
        group: 'INVESTMENT',
        userId: user?.uid || 'demo'
      };
      return [...activeCategories, virtualInvestmentCat];
    }
    return activeCategories;
  }, [categories, demoCategories, isDemoMode, user]);

  const showToast = (
    message: string, 
    type: "success" | "warning" | "error" | "info" = "info",
    options?: { isDarkPanel?: boolean }
  ) => {
    setToast({ message, type, ...options });
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  const hideToast = () => {
    setToast(null);
  };

  const trackDemoInteraction = () => {
    if (isDemoMode) {
      setInteractionCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setTransactions([]);
        setCategories([]);
        setNotes([]);
        setRealBills([]);
        setDemoBills(MOCK_BILLS);
        setDemoTransactions(MOCK_TRANSACTIONS);
        setProfile(null);
        // We no longer auto-set demo mode to true here,
        // so that the landing page can show correctly.
      } else {
        setDemoMode(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Products
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/products`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          costPrice: Number(data.costPrice) || 0,
          desiredMargin: Number(data.desiredMargin) || 0,
          sellingPrice: Number(data.sellingPrice) || 0,
          cmvPct: Number(data.cmvPct) || 0,
          taxRate: Number(data.taxRate) || 0,
          otherCostsPct: Number(data.otherCostsPct) || 0,
          profitMarginPct: Number(data.profitMarginPct) || 0,
          profitValue: Number(data.profitValue) || 0,
          createdAt: parseFirebaseDate(data.createdAt),
          updatedAt: parseFirebaseDate(data.updatedAt),
        } as ProductPriceCalc;
      });
      setRealProducts(fetchedProducts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to Inventory items
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/inventory`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedInsumos = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          currentQuantity: Number(data.currentQuantity) || 0,
          minQuantity: Number(data.minQuantity) || 0,
          costPricePerUnit: Number(data.costPricePerUnit) || 0,
          createdAt: parseFirebaseDate(data.createdAt),
          updatedAt: parseFirebaseDate(data.updatedAt),
        } as InventoryItem;
      });
      setRealInventoryItems(fetchedInsumos.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to Notes
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/notes`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: parseFirebaseDate(data.createdAt),
          updatedAt: parseFirebaseDate(data.updatedAt),
        } as Note;
      });
      setNotes(fetchedNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to Developer Messages (Firestore)
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/developer_messages`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMsgs = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: parseFirebaseDate(data.createdAt),
        } as DeveloperMessage;
      });
      setDeveloperMessages(fetchedMsgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to Bills (Firestore)
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/bills`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBills = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          amount: Number(data.amount) || 0,
          createdAt: parseFirebaseDate(data.createdAt),
          updatedAt: parseFirebaseDate(data.updatedAt),
        } as BillPayable;
      });
      setRealBills(fetchedBills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const addNote = async (title: string, content: string) => {
    if (!user) {
      const newNote: Note = {
        id: 'note-local-' + Math.random().toString(36).substring(2, 9),
        title,
        content,
        userId: 'local',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setNotes(prev => [newNote, ...prev]);
      showToast("Nota / Anotação salva com sucesso localmente!", "success");
      return;
    }
    const path = `users/${user.uid}/notes`;
    try {
      await addDoc(collection(db, path), cleanUndefined({
        title,
        content,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const addDeveloperMessage = async (subject: string, content: string) => {
    sound.playClick();
    if (isDemoMode) {
      const newMsg: DeveloperMessage = {
        id: 'msg-demo-' + Math.random().toString(36).substring(2, 9),
        sender: 'user',
        subject,
        content,
        userId: 'demo',
        userName: profile?.companyName || 'Usuário Demo',
        userEmail: auth.currentUser?.email || 'demo@example.com',
        createdAt: new Date(),
        readByDeveloper: false
      };
      setDemoDeveloperMessages(prev => [...prev, newMsg]);
      showToast("Mensagem enviada com sucesso no canal de testes!", "success");

      // Auto-reply simulation for Demo mode after 2.5 seconds to make it responsive!
      setTimeout(() => {
        const replyMsg: DeveloperMessage = {
          id: 'msg-demo-reply-' + Math.random().toString(36).substring(2, 9),
          sender: 'developer',
          subject,
          content: `Mensagem de auto-resposta simulada: Recebi sua mensagem sobre "${subject === 'bug' ? 'Bug / Bug Report' : subject === 'feature' ? 'Solicitação de Recurso' : subject === 'question' ? 'Dúvida Técnica' : subject === 'layout' ? 'Sugestão de Layout' : subject === 'appreciation' ? 'Elogio' : 'Outros Assuntos'}"! Anotei seu feedback e irei analisá-lo com as prioridades de engenharia. Muito obrigado pelo contato direto!`,
          userId: 'demo',
          userName: 'Desenvolvedor',
          createdAt: new Date(),
          readByDeveloper: true
        };
        setDemoDeveloperMessages(prev => [...prev, replyMsg]);
        sound.playAiNotification();
        showToast("Você recebeu uma resposta do desenvolvedor (Simulado)!", "info");
      }, 2500);

      return;
    }

    if (!user) return;
    const path = `users/${user.uid}/developer_messages`;
    try {
      await addDoc(collection(db, path), cleanUndefined({
        sender: 'user',
        subject,
        content,
        userId: user.uid,
        userName: profile?.companyName || user.displayName || 'Usuário',
        userEmail: user.email || '',
        createdAt: serverTimestamp(),
        readByDeveloper: false
      }));
      showToast("Sua mensagem foi enviada diretamente para o Desenvolvedor!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      showToast("Erro ao enviar mensagem. Tente novamente.", "error");
    }
  };

  const addDeveloperReply = async (messageId: string, replyContent: string, sender: 'user' | 'developer' = 'developer') => {
    sound.playClick();
    if (isDemoMode) {
      const originalMsg = demoDeveloperMessages.find(m => m.id === messageId);
      const subject = originalMsg ? originalMsg.subject : 'other';
      const newReply: DeveloperMessage = {
        id: `${messageId}-reply-${Math.random().toString(36).substring(2, 9)}`,
        sender,
        subject,
        content: replyContent,
        userId: 'demo',
        userName: sender === 'developer' ? 'Desenvolvedor @ Dafne' : (profile?.companyName || 'Usuário Demo'),
        createdAt: new Date(),
        readByDeveloper: true
      };
      setDemoDeveloperMessages(prev => [...prev, newReply]);
      if (sender === 'developer') {
        sound.playAiNotification();
        showToast("Resposta enviada como Desenvolvedor!", "success");
      } else {
        showToast("Mensagem de acompanhamento enviada!", "success");
      }
      return;
    }

    if (!user) return;
    const path = `users/${user.uid}/developer_messages`;
    try {
      const originalMsg = developerMessages.find(m => m.id === messageId);
      const subject = originalMsg ? originalMsg.subject : 'other';
      const customReplyId = `${messageId}-reply-${Math.random().toString(36).substring(2, 9)}`;
      const docRef = doc(db, path, customReplyId);

      await setDoc(docRef, cleanUndefined({
        sender,
        subject,
        content: replyContent,
        userId: user.uid,
        userName: sender === 'developer' ? 'Desenvolvedor @ Dafne' : (profile?.companyName || user.displayName || 'Usuário'),
        userEmail: user.email || '',
        createdAt: serverTimestamp(),
        readByDeveloper: true
      }));

      if (sender === 'developer') {
        sound.playAiNotification();
        showToast("Resposta gravada como Desenvolvedor!", "success");
      } else {
        showToast("Mensagem de acompanhamento gravada!", "success");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      showToast("Erro ao gravar resposta do Desenvolvedor.", "error");
    }
  };

  const updateNote = async (id: string, title: string, content: string) => {
    if (!user) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, title, content, updatedAt: new Date() } : n));
      showToast("Nota / Anotação atualizada!", "success");
      return;
    }
    const path = `users/${user.uid}/notes/${id}`;
    try {
      await setDoc(doc(db, path), cleanUndefined({
        title,
        content,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) {
      setNotes(prev => prev.filter(n => n.id !== id));
      showToast("Nota / Anotação removida!", "info");
      return;
    }
    const path = `users/${user.uid}/notes/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const addBill = async (b: Omit<BillPayable, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode) {
      const newBill: BillPayable = {
        ...b,
        id: 'b-demo-' + Math.random().toString(36).substring(2, 9),
        userId: 'demo',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setDemoBills(prev => [...prev, newBill].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime()));
      showToast(`Conta "${b.description}" criada (Modo Demo)!`, "success");
      return;
    }

    if (!user) {
      const newBill: BillPayable = {
        ...b,
        id: 'b-local-' + Math.random().toString(36).substring(2, 9),
        userId: 'local',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setRealBills(prev => [...prev, newBill].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime()));
      showToast(`Conta "${b.description}" agendada com sucesso localmente!`, "success");
      return;
    }

    const path = `users/${user.uid}/bills`;
    try {
      await addDoc(collection(db, path), cleanUndefined({
        ...b,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
      showToast(`Conta "${b.description}" agendada com sucesso!`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteBill = async (id: string) => {
    if (isDemoMode) {
      setDemoBills(prev => prev.filter(b => b.id !== id));
      showToast("Conta removida (Modo Demo)!", "info");
      return;
    }

    if (!user) {
      setRealBills(prev => prev.filter(b => b.id !== id));
      showToast("Conta removida localmente!", "info");
      return;
    }

    const path = `users/${user.uid}/bills/${id}`;
    const desc = realBills.find(b => b.id === id)?.description || "Conta";
    try {
      await deleteDoc(doc(db, path));
      showToast(`Conta "${desc}" removida!`, "info");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateBill = async (id: string, updates: Partial<BillPayable>) => {
    if (isDemoMode) {
      setDemoBills(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b));
      return;
    }

    if (!user) {
      setRealBills(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b));
      showToast("Conta de despesa atualizada!", "success");
      return;
    }

    const path = `users/${user.uid}/bills/${id}`;
    try {
      await setDoc(doc(db, path), cleanUndefined({
        ...updates,
        updatedAt: serverTimestamp()
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const payBill = async (id: string, categoryId: string) => {
    const currentBills = isDemoMode ? demoBills : realBills;
    const billToPay = currentBills.find(b => b.id === id);
    if (!billToPay) return;

    // 1. Log transaction as expense
    await addTransaction({
      description: `Fatura Paga: ${billToPay.description}`,
      amount: billToPay.amount,
      type: 'expense',
      categoryId,
      date: new Date()
    });

    // 2. Mark bill as paid
    await updateBill(id, { status: 'paid' });
    showToast(`Conta "${billToPay.description}" paga com sucesso!`, "success");
  };

  // Listen to Global Settings
  useEffect(() => {
    const path = 'settings/global';
    const unsubscribe = onSnapshot(doc(db, path), (d) => {
      if (d.exists()) {
        setSettings(d.data() as GlobalSettings);
      } else {
        const initSettings = { plans: DEFAULT_PLANS };
        setDoc(doc(db, path), cleanUndefined(initSettings));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Categories
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/categories`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      
      // If no categories, seed with defaults
      if (cats.length === 0) {
        seedCategories(user.uid);
      } else {
        setCategories(cats);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to Transactions
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/transactions`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          amount: Number(data.amount) || 0,
          date: parseFirebaseDate(data.date),
          createdAt: parseFirebaseDate(data.createdAt),
          updatedAt: parseFirebaseDate(data.updatedAt),
          productId: data.productId || undefined,
          quantity: data.quantity !== undefined ? Number(data.quantity) : undefined,
          productCostPrice: data.productCostPrice !== undefined ? Number(data.productCostPrice) : undefined,
          isProductSale: data.isProductSale !== undefined ? Boolean(data.isProductSale) : undefined,
          feeAmount: data.feeAmount !== undefined ? Number(data.feeAmount) : undefined,
          netAmount: data.netAmount !== undefined ? Number(data.netAmount) : undefined,
        } as Transaction;
      });
      setTransactions(trans.sort((a, b) => b.date.getTime() - a.date.getTime()));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to Profile
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/profile/settings`;
    const unsubscribe = onSnapshot(doc(db, path), (d) => {
      if (d.exists()) {
        const data = d.data() as BusinessProfile;
        if (user && user.email === "kizzyxxx15@gmail.com" && (data.subscriptionStatus === "active" || data.subscriptionPlan === "pro")) {
          const revoked = {
            ...data,
            subscriptionPlan: undefined,
            subscriptionStatus: undefined
          };
          setDoc(doc(db, path), cleanUndefined(revoked));
          setProfile(revoked);
        } else {
          setProfile(data);
        }
      } else {
        // Init profile
        const initProfile = { 
          userId: user.uid, 
          companyName: user.email === "cristianmilkymoo@gmail.com" ? "Burger Artisan & Co. Hamburgueria" : (user.displayName || 'Minha Empresa'), 
          currency: 'BRL',
          taxRate: 6, // Default 6% for Simples Nacional
          cardFeeRate: 2.5,
          businessSegment: user.email === "cristianmilkymoo@gmail.com" ? "food" : "other",
          businessNicheDetail: user.email === "cristianmilkymoo@gmail.com" ? "Hamburgueria Gourmet, Smashes & Delivery Express Premium" : "",
          averageBilling: user.email === "cristianmilkymoo@gmail.com" ? 120000 : undefined,
          billingGoal: user.email === "cristianmilkymoo@gmail.com" ? 120000 : undefined,
          billingGoalDeadline: user.email === "cristianmilkymoo@gmail.com" ? "Dezembro de 2026" : undefined,
          billingNotes: user.email === "cristianmilkymoo@gmail.com" ? "Otimizar CMV de carnes black angus, pão brioche e taxas de comissão do delivery." : ""
        };
        setDoc(doc(db, path), cleanUndefined(initProfile));
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Process monthly subscription expenses automatically.
  // When active corporate subscriptions exist and have not been recorded in the transactions
  // for the current month and year, automatically launch them.
  useEffect(() => {
    // Wait until profile and transactions are fully loaded
    if (loading) return;
    
    const currentList = isDemoMode ? demoTransactions : transactions;
    const subs = profile?.corporateSubscriptions || [];
    const activeSubs = subs.filter(s => s.active);
    
    // If no active subscriptions, nothing to do
    if (activeSubs.length === 0) return;
    
    // Also skip processing if we are in real mode and transactions haven't finished loading yet (empty check safety)
    if (!isDemoMode && !user) return;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const processAutoSubscriptions = async () => {
      let launchedAny = false;

      for (const sub of activeSubs) {
        const alreadyExists = currentList.some(t => {
          const tDate = new Date(t.date);
          return t.description === `[Assinatura] ${sub.name}` && 
                 tDate.getMonth() === currentMonth && 
                 tDate.getFullYear() === currentYear;
        });

        if (!alreadyExists) {
          launchedAny = true;
          await addTransaction({
            description: `[Assinatura] ${sub.name}`,
            amount: sub.amount,
            categoryId: sub.categoryId || "cat8",
            date: new Date(),
            type: "expense"
          });
        }
      }

      if (launchedAny) {
        showToast("Suas assinaturas mensais ativas foram consolidadas automaticamente no fluxo deste mês! ⚡", "success");
      }
    };

    // Use a small safety timeout to ensure initial rendering has completed and states are synchronized
    const timer = setTimeout(() => {
      processAutoSubscriptions();
    }, 3000);

    return () => clearTimeout(timer);
  }, [profile?.corporateSubscriptions, transactions, demoTransactions, isDemoMode, loading, user]);

  // Monitor e sincronização automática de dados Firebase em tempo real
  useEffect(() => {
    if (!user) {
      if (isDemoMode) {
        setFirebaseSyncStatus('synced');
      } else {
        setFirebaseSyncStatus('idle');
      }
      return;
    }

    if (loading) {
      setFirebaseSyncStatus('syncing');
    } else {
      const timer = setTimeout(() => {
        setFirebaseSyncStatus('synced');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, user, isDemoMode]);

  // Synchronize profile for isDemoMode
  useEffect(() => {
    if (isDemoMode && !user) {
      setProfile({
        userId: 'demo',
        companyName: 'Smash & Co. Hamburgueria Gourmet',
        currency: 'BRL',
        taxRate: 6,
        cardFeeRate: 2.5,
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        subscriptionLink: localStorage.getItem("dafne_custom_subscription_link") || 'https://buy.stripe.com/test_7sY28t9ZY21T1wH3An2Nq00',
        subscriptionPrice: Number(localStorage.getItem("dafne_custom_subscription_price") || '99.99'),
        corporateSubscriptions: [
          { id: 'sub-aws', name: 'Suíte de Cloud AWS & ERP Integration', amount: 250.00, categoryId: 'cat8', active: true },
          { id: 'sub-openai', name: 'Tokens de Recomendação I.A. de Pedidos', amount: 99.00, categoryId: 'cat8', active: true },
          { id: 'sub-rent', name: 'Aluguel do Salão Comercial - Pinheiros SP', amount: 4500.00, categoryId: 'cat3', active: true },
        ],
        averageBilling: 125000,
        billingGoal: 125000,
        billingGoalDeadline: 'Dezembro / 2026',
        billingNotes: 'Otimizar comissão de delivery e insumos de carnes black angus (CMV) para manter rentabilidade 10/10.',
        businessType: 'Alimentação / Gastronomia',
        chargeModel: 'mixed',
        averageTicket: 48,
        additionalGoals: [
          { id: 'g1', title: 'Margem de Lucro Bruta 65%', targetValue: 65, type: 'profit', deadline: 'Dezembro / 2026', reached: true },
          { id: 'g2', title: 'Volume de Burgers Vendidos', targetValue: 2500, type: 'sales_volume', deadline: 'Novembro / 2026', reached: true },
          { id: 'g3', title: 'Reduzir Custo de Aquisição de Delivery', targetValue: 8, type: 'acquisition_cost', deadline: 'Outubro / 2026', reached: true }
        ]
      });
    } else if (!isDemoMode && !user) {
      setProfile(null);
    }
  }, [isDemoMode, user]);

  // Função para forçar o lançamento ao vivo de uma transação simulada comercial de teste
  const triggerLiveSimTransaction = React.useCallback(() => {
    const isIncome = Math.random() < 0.75;
    const today = new Date();

    const possibleIncomes = [
      { desc: "Venda PDV Delivery (Automática)", catId: "cat1", amount: () => Math.floor(65 + Math.random() * 180) },
      { desc: "Assinatura Mensal de Cliente Ativada", catId: "cat1", amount: () => Math.floor(129 + Math.random() * 120) },
      { desc: "E-commerce checkout aprovado (Web)", catId: "cat1", amount: () => Math.floor(150 + Math.random() * 450) },
      { desc: "Consultoria Express Estratégica", catId: "cat2", amount: () => Math.floor(600 + Math.random() * 1000) },
      { desc: "Upgrade de Licença de Software", catId: "cat1", amount: () => Math.floor(250 + Math.random() * 300) }
    ];

    const possibleExpenses = [
      { desc: "Investimento em Anúncios Google Ads", catId: "cat6", amount: () => Math.floor(60 + Math.random() * 120) },
      { desc: "Insumo de Embalagens Descartáveis", catId: "cat5", amount: () => Math.floor(80 + Math.random() * 180) },
      { desc: "Assinatura API de Inteligência Artificial", catId: "cat8", amount: () => Math.floor(45 + Math.random() * 90) }
    ];

    const pool = isIncome ? possibleIncomes : possibleExpenses;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    const amountValue = selected.amount();

    const saleTxId = 'tx-demo-auto-' + Math.random().toString(36).substring(2, 9);
    // Randomly pin this to matriz or filial
    const storeId = Math.random() < 0.6 ? 'matriz' : 'filial';

    const newTx: Transaction = {
      id: saleTxId,
      description: selected.desc,
      amount: amountValue,
      categoryId: selected.catId,
      date: today,
      type: isIncome ? 'income' : 'expense',
      userId: 'demo',
      profileId: storeId,
      createdAt: today,
      updatedAt: today
    };

    const newTransactions = [newTx];
    
    // If it's a product sale (cat1), calculate a simulated 30% CMV expense
    const hasCmv = isIncome && selected.catId === "cat1";
    if (hasCmv) {
      const cmvValue = Math.round(amountValue * 0.30);
      const possibleCategories = resolvedCategories.filter(c => c.type === 'expense');
      const cogsCategory = possibleCategories.find(c => c.name.toLowerCase().includes('cmv, custo de vendas')) ||
                           possibleCategories.find(c => c.name.toLowerCase() === 'cmv') ||
                           possibleCategories.find(c => c.group === 'COGS') ||
                           { id: 'cat25' };
      const cogsCatId = cogsCategory.id;

      newTransactions.push({
        id: 'tx-demo-auto-cmv-' + Math.random().toString(36).substring(2, 9),
        userId: 'demo',
        createdAt: today,
        updatedAt: today,
        date: today,
        profileId: storeId,
        description: `CMV, custo de vendas - ${selected.desc.replace(/venda:\s*/i, "")}`,
        amount: cmvValue,
        type: 'expense',
        categoryId: cogsCatId,
        isCmvExpense: true,
        originalSaleId: saleTxId
      });
    }

    setDemoTransactions(prev => [...newTransactions, ...prev]);

    // Grava no histórico temporário visível de simulações em tempo real
    setLastSimulatedTransactions(prev => {
      const logItem = {
        id: saleTxId,
        description: selected.desc,
        amount: amountValue,
        type: isIncome ? ('income' as const) : ('expense' as const),
        date: today
      };
      return [logItem, ...prev].slice(0, 10);
    });

    // Play rich audio transaction swell feedback
    sound.playTransactionSwell(isIncome ? 'income' : 'expense');

    // Display real-time simulation toast
    showToast(
      `⚡ [Tempo Real] Transação simulada: "${selected.desc}" no valor de R$ ${amountValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      isIncome ? "success" : "info"
    );
  }, [showToast]);

  // Simulação de Lançamentos Automáticos (de acordo com a velocidade demoSpeed) no Modo Demo
  useEffect(() => {
    if (!isDemoMode || demoSpeed <= 0) return;

    const interval = setInterval(() => {
      triggerLiveSimTransaction();
    }, demoSpeed * 1000);

    return () => clearInterval(interval);
  }, [isDemoMode, demoSpeed, triggerLiveSimTransaction]);

  const seedCategories = async (userId: string) => {
    const path = `users/${userId}/categories`;
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await addDoc(collection(db, path), cleanUndefined({ ...cat, userId }));
      }
    } catch (e) {
      console.error('Error seeding categories', e);
    }
  };

  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { profileId?: string }) => {
    const profileId = t.profileId || (activeStoreId === 'all' ? (storeProfiles[0]?.id || 'matriz') : activeStoreId);
    const parsedDate = parseFirebaseDate(t.date);

    // Dynamic cost calculations - automatic CMV (Cost of Goods Sold/COGS) logging
    const hasCmvCost = t.type === 'income' && t.productCostPrice !== undefined && t.productCostPrice > 0;
    const cmvValue = hasCmvCost ? Number(t.productCostPrice) * (Number(t.quantity) || 1) : 0;

    // Validate CMV expense requirements
    const selectedCatForCmv = resolvedCategories.find(c => c.id === t.categoryId);
    const isCmvCategory = selectedCatForCmv && (
      selectedCatForCmv.name.toLowerCase().includes("cmv") || 
      selectedCatForCmv.group === "COGS"
    );

    if (t.type === 'expense' && isCmvCategory && !t.productId) {
      showToast("Lançamentos de despesa na categoria CMV exigem a associação com um produto cadastrado.", "warning");
      throw new Error("Associação de produto obrigatória para lançamentos na categoria CMV.");
    }

    let cogsCategoryId = "";
    if (hasCmvCost) {
      const possibleCategories = resolvedCategories.filter(c => c.type === 'expense');
      // Prioritize category explicitly named "CMV, custo de vendas" first
      const cogsCategory = possibleCategories.find(c => c.name.toLowerCase().includes('cmv, custo de vendas')) ||
                           possibleCategories.find(c => c.name.toLowerCase() === 'cmv') ||
                           possibleCategories.find(c => {
                             const n = c.name.toLowerCase();
                             return c.group === 'COGS' && (n.includes('compra') || n.includes('mercadoria') || n.includes('cmv') || n.includes('custo') || n.includes('produto') || n.includes('insumo'));
                           }) ||
                           possibleCategories.find(c => {
                             const n = c.name.toLowerCase();
                             return n.includes('compra') || n.includes('mercadoria') || n.includes('cmv') || n.includes('custo') || n.includes('produto') || n.includes('insumo');
                           }) ||
                           possibleCategories.find(c => c.group === 'COGS') ||
                           possibleCategories[0];
      cogsCategoryId = cogsCategory ? cogsCategory.id : "";
    }

    if (t.isProductSale && t.productId) {
      await deductInventoryForProduct(t.productId, t.quantity || 1);
    }

    if (isDemoMode) {
      const saleTxId = 'tx-demo-' + Math.random().toString(36).substring(2, 9);
      const newTx: Transaction = {
        ...t,
        id: saleTxId,
        userId: 'demo',
        createdAt: new Date(),
        updatedAt: new Date(),
        date: parsedDate,
        profileId
      };
      
      const newTransactions = [newTx];

      if (hasCmvCost && cmvValue > 0 && cogsCategoryId) {
        const cmvTx: Transaction = {
          id: 'tx-demo-cmv-' + Math.random().toString(36).substring(2, 9),
          userId: 'demo',
          createdAt: new Date(),
          updatedAt: new Date(),
          date: parsedDate,
          profileId,
          description: `CMV, custo de vendas - ${t.description.replace(/^Venda:\s*/i, "")}`,
          amount: cmvValue,
          type: 'expense',
          categoryId: cogsCategoryId,
          productId: t.productId,
          quantity: t.quantity,
          productCostPrice: t.productCostPrice,
          isCmvExpense: true,
          originalSaleId: saleTxId
        };
        newTransactions.push(cmvTx);
      }

      setDemoTransactions(prev => [...newTransactions, ...prev]);
      if (hasCmvCost && cmvValue > 0) {
        showToast(`Venda + CMV de R$ ${cmvValue.toFixed(2)} lançados com sucesso (Modo Demo)!`, "success");
      } else {
        showToast("Lançamento adicionado com sucesso (Modo Demo)!", "success");
      }
      return;
    }

    if (!user) {
      const saleTxId = 'tx-local-' + Math.random().toString(36).substring(2, 9);
      const newTx: Transaction = {
        ...t,
        id: saleTxId,
        userId: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
        date: parsedDate,
        profileId
      };
      
      const newTransactions = [newTx];

      if (hasCmvCost && cmvValue > 0 && cogsCategoryId) {
        const cmvTx: Transaction = {
          id: 'tx-local-cmv-' + Math.random().toString(36).substring(2, 9),
          userId: 'local',
          createdAt: new Date(),
          updatedAt: new Date(),
          date: parsedDate,
          profileId,
          description: `CMV, custo de vendas - ${t.description.replace(/^Venda:\s*/i, "")}`,
          amount: cmvValue,
          type: 'expense',
          categoryId: cogsCategoryId,
          productId: t.productId,
          quantity: t.quantity,
          productCostPrice: t.productCostPrice,
          isCmvExpense: true,
          originalSaleId: saleTxId
        };
        newTransactions.push(cmvTx);
      }

      setTransactions(prev => [...newTransactions, ...prev]);
      if (hasCmvCost && cmvValue > 0) {
        showToast(`Venda + CMV de R$ ${cmvValue.toFixed(2)} lançados com sucesso localmente!`, "success");
      } else {
        showToast("Lançamento adicionado com sucesso localmente!", "success");
      }
      return;
    }

    const path = `users/${user.uid}/transactions`;
    try {
      const docRef = await addDoc(collection(db, path), cleanUndefined({
        ...t,
        userId: user.uid,
        profileId,
        date: Timestamp.fromDate(parsedDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));

      // Add corresponding physical CMV expense if applicable
      if (hasCmvCost && cmvValue > 0 && cogsCategoryId) {
        await addDoc(collection(db, path), cleanUndefined({
          description: `CMV, custo de vendas - ${t.description.replace(/^Venda:\s*/i, "")}`,
          amount: cmvValue,
          type: 'expense',
          categoryId: cogsCategoryId,
          productId: t.productId,
          quantity: t.quantity,
          productCostPrice: t.productCostPrice,
          isCmvExpense: true,
          originalSaleId: docRef.id,
          userId: user.uid,
          profileId,
          date: Timestamp.fromDate(parsedDate),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }));
        showToast(`Venda registrada! Lançamento de despesa CMV de R$ ${cmvValue.toFixed(2)} cadastrado automaticamente.`, "success");
      } else {
        showToast("Lançamento adicionado com sucesso!", "success");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (isDemoMode) {
      setDemoTransactions(prev => prev.filter(t => t.id !== id && t.originalSaleId !== id));
      showToast("Lançamento removido (Modo Demo)!", "info");
      return;
    }

    if (!user) {
      setTransactions(prev => prev.filter(t => t.id !== id && t.originalSaleId !== id));
      showToast("Lançamento removido com sucesso localmente!", "info");
      return;
    }

    const path = `users/${user.uid}/transactions`;
    try {
      // Delete the primary transaction
      await deleteDoc(doc(db, `${path}/${id}`));

      // Cascade delete any corresponding CMV expense transaction
      const q = query(collection(db, path), where("originalSaleId", "==", id));
      const querySnapshot = await getDocs(q);
      for (const matchedDoc of querySnapshot.docs) {
        await deleteDoc(doc(db, `${path}/${matchedDoc.id}`));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    }
  };

  const addCategory = async (c: Omit<Category, 'id' | 'userId'>) => {
    if (isDemoMode) {
      const newCat: Category = {
        ...c,
        id: 'cat-demo-' + Math.random().toString(36).substring(2, 9),
        userId: 'demo'
      };
      setDemoCategories(prev => [...prev, newCat]);
      showToast("Categoria operacional adicionada com sucesso (Modo Demo)!", "success");
      return;
    }
    if (!user) {
      const newCat: Category = {
        ...c,
        id: 'cat-local-' + Math.random().toString(36).substring(2, 9),
        userId: 'local'
      };
      setCategories(prev => [...prev, newCat]);
      showToast("Categoria operacional adicionada com sucesso localmente!", "success");
      return;
    }
    const path = `users/${user.uid}/categories`;
    try {
      await addDoc(collection(db, path), cleanUndefined({ ...c, userId: user.uid }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateProfile = async (p: Partial<BusinessProfile>) => {
    if (p.subscriptionLink !== undefined) {
      localStorage.setItem("dafne_custom_subscription_link", p.subscriptionLink);
    }
    if (p.subscriptionPrice !== undefined) {
      localStorage.setItem("dafne_custom_subscription_price", String(p.subscriptionPrice));
    }

    if (isDemoMode || !user) {
      setProfile(prev => prev ? { ...prev, ...p } : {
        userId: 'demo',
        companyName: 'Matriz Gourmet Spanner',
        currency: 'BRL',
        taxRate: 6,
        cardFeeRate: 2.5,
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        subscriptionLink: localStorage.getItem("dafne_custom_subscription_link") || 'https://buy.stripe.com/test_7sY28t9ZY21T1wH3An2Nq00',
        subscriptionPrice: Number(localStorage.getItem("dafne_custom_subscription_price") || '99.99'),
        corporateSubscriptions: [
          { id: 'sub-aws', name: 'Suíte de Cloud AWS (Tecnologia)', amount: 250.00, categoryId: 'cat8', active: true },
          { id: 'sub-openai', name: 'Tokens OpenAI API (Serviços I.A.)', amount: 99.00, categoryId: 'cat8', active: true },
          { id: 'sub-rent', name: 'Aluguel do Galpão Comercial', amount: 1500.00, categoryId: 'cat3', active: true },
        ],
        ...p
      });
      return;
    }
    const path = `users/${user.uid}/profile/settings`;
    try {
      await setDoc(doc(db, path), cleanUndefined({ ...profile, ...p, userId: user.uid }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateSettings = async (s: GlobalSettings) => {
    const path = 'settings/global';
    try {
      await setDoc(doc(db, path), cleanUndefined(s));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const getDRE = (month: Date): DRELine[] => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthTransactions = filteredTransactions.filter(t => 
      isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
    );

    const currentCategories = resolvedCategories;

    const productSalesCmv = monthTransactions
      .filter(t => t.isProductSale && t.productCostPrice && t.quantity && !monthTransactions.some(expr => expr.type === 'expense' && expr.originalSaleId === t.id))
      .reduce((acc, t) => acc + (Number(t.productCostPrice!) * Number(t.quantity!)), 0);

    const totalTransactionFees = monthTransactions
      .filter(t => t.feeAmount)
      .reduce((acc, t) => acc + (t.feeAmount || 0), 0);

    const getSumByGroup = (group: string) => {
      return monthTransactions
        .filter(t => {
          const category = currentCategories.find(c => c.id === t.categoryId);
          const descUpper = (t.description || "").toUpperCase();
          const isInvestment = (category?.group === 'INVESTMENT') || 
                               descUpper.includes("RESERVA") || 
                               descUpper.includes("EMERGENCIA") || 
                               descUpper.includes("EMERGÊNCIA") || 
                               descUpper.includes("APORTE") || 
                               descUpper.includes("INVESTIMENTO");

          if (group === 'INVESTMENT') {
            return isInvestment;
          } else {
            if (isInvestment) return false;
          }
          return category?.group === group;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const getCategoryBreakdown = (group: string) => {
      const breakdown: DRELine[] = [];
      const groupCategories = currentCategories.filter(c => c.group === group);
      
      groupCategories.forEach(cat => {
        const sum = monthTransactions
          .filter(t => {
            const descUpper = (t.description || "").toUpperCase();
            const isInvestment = (cat.group === 'INVESTMENT') || 
                                 descUpper.includes("RESERVA") || 
                                 descUpper.includes("EMERGENCIA") || 
                                 descUpper.includes("EMERGÊNCIA") || 
                                 descUpper.includes("APORTE") || 
                                 descUpper.includes("INVESTIMENTO");

            if (group === 'INVESTMENT') {
              if (t.categoryId === cat.id) return true;
              if (isInvestment && cat.group === 'INVESTMENT') return true;
              return false;
            } else {
              return t.categoryId === cat.id && !isInvestment;
            }
          })
          .reduce((acc, t) => acc + t.amount, 0);
        
        if (sum > 0) {
          breakdown.push({
            label: cat.name,
            value: cat.type === 'expense' ? -sum : sum,
            indent: 2
          });
        }
      });

      if (group === 'COGS' && productSalesCmv > 0) {
        breakdown.push({
          label: 'CMV Proporcional (Venda de Produtos)',
          value: -productSalesCmv,
          indent: 2
        });
      }

      if (group === 'INVESTMENT') {
        const totalInvestimentosGroup = getSumByGroup('INVESTMENT');
        const totalBreakdown = breakdown.reduce((acc, b) => acc + Math.abs(b.value), 0);
        
        if (totalInvestimentosGroup > totalBreakdown) {
          const diff = totalInvestimentosGroup - totalBreakdown;
          breakdown.push({
            label: 'Aporte Reserva de Emergência',
            value: -diff,
            indent: 2
          });
        }
      }
      
      return breakdown;
    };

    const getDeductionsBreakdown = () => {
      const breakdown: DRELine[] = [];
      if (impostosTransacoes > 0) {
        breakdown.push({ label: 'Impostos Diretos Lançados', value: -impostosTransacoes, indent: 2 });
      }
      if (impostosCalculados > 0) {
        breakdown.push({ label: `Provisão DAS Simples (${taxRate}%)`, value: -impostosCalculados, indent: 2 });
      }
      if (totalTransactionFees > 0) {
        breakdown.push({ label: 'Tarifas e Taxas de Operações', value: -totalTransactionFees, indent: 2 });
      }
      return breakdown;
    };

    const receitaBruta = getSumByGroup('REVENUE');
    const breakdownReceita = getCategoryBreakdown('REVENUE');
    const impostosTransacoes = getSumByGroup('TAX');
    
    // Calculate tax based on percentage if defined, otherwise use transaction values
    const taxRate = profile?.taxRate || 0;
    const impostosCalculados = receitaBruta * (taxRate / 100);
    
    // Use the higher of the two or combine them? 
    // Usually, either you track by transactions OR use a flat rate.
    // Let's combine them for flexibility: registered tax transactions + calculated rate
    const totalImpostos = impostosTransacoes + impostosCalculados + totalTransactionFees;

    const receitaLiquida = receitaBruta - totalImpostos;
    
    const cmv = getSumByGroup('COGS') + productSalesCmv;
    const lucroBruto = receitaLiquida - cmv;
    
    const despesasOp = getSumByGroup('OPEX');
    const ebitda = lucroBruto - despesasOp; 
    
    const outrasReceitas = getSumByGroup('OTHER_INCOME');
    const outrasDespesas = getSumByGroup('OTHER_EXPENSE');
    const lucroAntesInvest = ebitda + outrasReceitas - outrasDespesas;

    const investimentos = getSumByGroup('INVESTMENT');
    const resultadoFinal = lucroAntesInvest - investimentos;

    return [
      { label: 'RECEITA OPERACIONAL BRUTA', value: receitaBruta, isBold: true },
      ...breakdownReceita,
      { label: '(-) Deduções e Impostos', value: -totalImpostos, indent: 1 },
      ...getDeductionsBreakdown(),
      { label: '(=) RECEITA OPERACIONAL LÍQUIDA', value: receitaLiquida, isBold: true },
      { label: '(-) Custos dos Produtos/Serviços (CMV/CPV) - Despesa Dedutível', value: -cmv, indent: 1 },
      ...getCategoryBreakdown('COGS'),
      { label: '(=) LUCRO BRUTO', value: lucroBruto, isBold: true },
      { label: '(-) Despesas Operacionais (OPEX)', value: -despesasOp, indent: 1 },
      ...getCategoryBreakdown('OPEX'),
      { label: '(=) EBITDA / RESULTADO OPERACIONAL', value: ebitda, isBold: true },
      { label: '(+) Outras Receitas', value: outrasReceitas, indent: 1 },
      ...getCategoryBreakdown('OTHER_INCOME'),
      { label: '(-) Outras Despesas', value: -outrasDespesas, indent: 1 },
      ...getCategoryBreakdown('OTHER_EXPENSE'),
      { label: '(=) RESULTADO ANTES DOS INVESTIMENTOS', value: lucroAntesInvest, isBold: true },
      { label: '(-) Investimentos', value: -investimentos, indent: 1 },
      ...getCategoryBreakdown('INVESTMENT'),
      { label: '(=) RESULTADO LÍQUIDO DO PERÍODO', value: resultadoFinal, isBold: true },
    ];
  };

  const addProduct = async (p: Omit<ProductPriceCalc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode) {
      const newProduct: ProductPriceCalc = {
        ...p,
        id: 'p-demo-' + Math.random().toString(36).substring(2, 9),
        userId: 'demo',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setDemoProducts(prev => [newProduct, ...prev]);
      showToast("Produto adicionado com sucesso (Modo Demo)!", "success");
      return;
    }

    if (!user) {
      const newProduct: ProductPriceCalc = {
        ...p,
        id: 'p-local-' + Math.random().toString(36).substring(2, 9),
        userId: 'local',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setRealProducts(prev => [newProduct, ...prev]);
      showToast("Produto cadastrado com sucesso localmente!", "success");
      return;
    }

    const path = `users/${user.uid}/products`;
    try {
      await addDoc(collection(db, path), cleanUndefined({
        ...p,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
      showToast("Produto cadastrado com sucesso!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteProduct = async (id: string) => {
    if (isDemoMode) {
      setDemoProducts(prev => prev.filter(p => p.id !== id));
      showToast("Produto removido (Modo Demo)!", "success");
      return;
    }

    if (!user) {
      setRealProducts(prev => prev.filter(p => p.id !== id));
      showToast("Produto removido com sucesso localmente!", "success");
      return;
    }

    const path = `users/${user.uid}/products/${id}`;
    try {
      await deleteDoc(doc(db, path));
      showToast("Produto removido com sucesso!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateProduct = async (id: string, updates: Partial<ProductPriceCalc>) => {
    if (isDemoMode) {
      setDemoProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p));
      showToast("Produto atualizado (Modo Demo)!", "success");
      return;
    }

    if (!user) {
      setRealProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p));
      showToast("Produto atualizado com sucesso localmente!", "success");
      return;
    }

    const path = `users/${user.uid}/products/${id}`;
    try {
      await setDoc(doc(db, path), cleanUndefined({
        ...updates,
        updatedAt: serverTimestamp()
      }), { merge: true });
      showToast("Produto atualizado com sucesso!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deductInventoryForProduct = async (productId: string, quantitySold: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod || !prod.recipe || prod.recipe.length === 0) return;

    for (const recipeItem of prod.recipe) {
      const neededQty = recipeItem.quantityNeeded * quantitySold;
      if (isDemoMode) {
        setDemoInventoryItems(prev => prev.map(invItem => {
          if (invItem.id === recipeItem.inventoryItemId) {
            const newQty = Math.max(0, invItem.currentQuantity - neededQty);
            return {
              ...invItem,
              currentQuantity: Number(newQty.toFixed(3)),
              updatedAt: new Date()
            };
          }
          return invItem;
        }));
      } else {
        if (!user) {
          setRealInventoryItems(prev => prev.map(invItem => {
            if (invItem.id === recipeItem.inventoryItemId) {
              const newQty = Math.max(0, invItem.currentQuantity - neededQty);
              return {
                ...invItem,
                currentQuantity: Number(newQty.toFixed(3)),
                updatedAt: new Date()
              };
            }
            return invItem;
          }));
          continue;
        }
        const invItemPath = `users/${user.uid}/inventory/${recipeItem.inventoryItemId}`;
        const matchedItem = realInventoryItems.find(i => i.id === recipeItem.inventoryItemId);
        if (matchedItem) {
          const newQty = Math.max(0, matchedItem.currentQuantity - neededQty);
          await setDoc(doc(db, invItemPath), cleanUndefined({
            currentQuantity: Number(newQty.toFixed(3)),
            updatedAt: serverTimestamp()
          }), { merge: true });
        }
      }
    }
  };

  const addInventoryItem = async (insumo: Omit<InventoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode) {
      const newItem: InventoryItem = {
        ...insumo,
        id: 'i-demo-' + Math.random().toString(36).substring(2, 9),
        userId: 'demo',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setDemoInventoryItems(prev => [newItem, ...prev]);
      showToast("Insumo cadastrado com sucesso (Modo Demo)!", "success");
      return;
    }

    if (!user) {
      const newItem: InventoryItem = {
        ...insumo,
        id: 'i-local-' + Math.random().toString(36).substring(2, 9),
        userId: 'local',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setRealInventoryItems(prev => [newItem, ...prev]);
      showToast("Insumo cadastrado com sucesso localmente!", "success");
      return;
    }

    const path = `users/${user.uid}/inventory`;
    try {
      await addDoc(collection(db, path), cleanUndefined({
        ...insumo,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
      showToast("Insumo cadastrado com sucesso!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    if (isDemoMode) {
      setDemoInventoryItems(prev => prev.filter(item => item.id !== id));
      showToast("Insumo removido (Modo Demo)!", "success");
      return;
    }

    if (!user) {
      setRealInventoryItems(prev => prev.filter(item => item.id !== id));
      showToast("Insumo removido com sucesso localmente!", "success");
      return;
    }

    const path = `users/${user.uid}/inventory/${id}`;
    try {
      await deleteDoc(doc(db, path));
      showToast("Insumo removido com sucesso!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (isDemoMode) {
      setDemoInventoryItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item));
      showToast("Insumo atualizado (Modo Demo)!", "success");
      return;
    }

    if (!user) {
      setRealInventoryItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item));
      showToast("Insumo atualizado com sucesso localmente!", "success");
      return;
    }

    const path = `users/${user.uid}/inventory/${id}`;
    try {
      await setDoc(doc(db, path), cleanUndefined({
        ...updates,
        updatedAt: serverTimestamp()
      }), { merge: true });
      showToast("Insumo atualizado com sucesso!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const setLanguage = (lang: 'pt' | 'en' | 'es') => {
    setLanguageState(lang);
    localStorage.setItem("dafne_language", lang);
    showToast(
      lang === 'pt' ? 'Idioma alterado para Português' : 
      lang === 'en' ? 'Language changed to English' : 
      'Idioma cambiado a Español', 
      'success'
    );
  };

  const t = (key: string): string => {
    if (!key) return "";
    const dict = LANGUAGES_DICTIONARY[language] || LANGUAGES_DICTIONARY.pt;
    const ptDict = LANGUAGES_DICTIONARY.pt;

    // 1. Direct key match in the active language dictionary
    if (Object.prototype.hasOwnProperty.call(dict, key)) {
      return (dict as any)[key];
    }

    // 2. Direct key match in PT dictionary (fallback for newly added keys)
    if (language === "pt" && Object.prototype.hasOwnProperty.call(ptDict, key)) {
      return (ptDict as any)[key];
    }

    // 3. Match by original Portuguese value (Reverse Lookup)
    // If we pass raw Portuguese text, match it to a key in PT and return the active language equivalent.
    let matchedKey: string | null = null;
    const keyLower = key.trim().toLowerCase();

    for (const [k, v] of Object.entries(ptDict)) {
      if (typeof v === "string" && v.trim().toLowerCase() === keyLower) {
        matchedKey = k;
        break;
      }
    }

    if (matchedKey && Object.prototype.hasOwnProperty.call(dict, matchedKey)) {
      return (dict as any)[matchedKey];
    }

    // 4. Case-insensitive direct key search
    for (const [k, v] of Object.entries(dict)) {
      if (k.toLowerCase() === keyLower) {
        return v as string;
      }
    }

    return key;
  };

  const clearAllData = async (mode: 'month' | 'all' = 'all') => {
    sound.playClick();
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const yearMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    if (isDemoMode) {
      showToast("Não é possível zerar dados no Modo Demonstração. Realize uma assinatura para gerenciar dados de forma limpa!", "error");
      return;
    }

    if (!user) {
      if (mode === 'all') {
        setTransactions([]);
        setRealBills([]);
        setRealProducts([]);
        setRealInventoryItems([]);
        setNotes([]);
        showToast("Todos os seus dados locais foram totalmente limpos!", "success");
      } else {
        setTransactions(prev => prev.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() !== currentMonth || d.getFullYear() !== currentYear;
        }));
        showToast("Os lançamentos locais do mês atual foram limpos!", "success");
      }
      return;
    }

    setFirebaseSyncStatus('syncing');
    try {
      if (mode === 'all') {
        // 1. Delete all transactions
        const txPath = `users/${user.uid}/transactions`;
        const txDocs = await getDocs(collection(db, txPath));
        for (const tDoc of txDocs.docs) {
          await deleteDoc(doc(db, txPath, tDoc.id));
        }

        // 2. Delete all bills
        const billsPath = `users/${user.uid}/bills`;
        const billsDocs = await getDocs(collection(db, billsPath));
        for (const bDoc of billsDocs.docs) {
          await deleteDoc(doc(db, billsPath, bDoc.id));
        }

        // 3. Delete all products
        const pPath = `users/${user.uid}/products`;
        const pDocs = await getDocs(collection(db, pPath));
        for (const pDoc of pDocs.docs) {
          await deleteDoc(doc(db, pPath, pDoc.id));
        }

        // 4. Delete all notes
        const notesPath = `users/${user.uid}/notes`;
        const notesDocs = await getDocs(collection(db, notesPath));
        for (const nDoc of notesDocs.docs) {
          await deleteDoc(doc(db, notesPath, nDoc.id));
        }

        // 5. Reset Store Profiles
        setRealStoreProfiles([
          { id: 'matriz', companyName: 'Minha Empresa Matriz', cnpj: '', taxRate: 0, cardFeeRate: 0, businessSegment: 'general', color: 'zinc' }
        ]);
        setActiveStoreId('all');

        // 6. Reset Profile Info
        const profilePath = `users/${user.uid}/profile/settings`;
        await setDoc(doc(db, profilePath), cleanUndefined({
          userId: user.uid,
          companyName: 'Minha Empresa Matriz',
          currency: 'BRL',
          taxRate: 6,
          cardFeeRate: 2.5,
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          subscriptionLink: '',
          subscriptionPrice: 0,
          corporateSubscriptions: []
        }));

        try {
          sessionStorage.clear();
          localStorage.removeItem(`dafne_premium_tutorial_shown_${user.uid}`);
          localStorage.removeItem(`dafne_tutorial_shown_${user.uid}`);
        } catch (e) {
          console.warn(e);
        }

        showToast("Todos os dados do seu sistema foram totalmente zerados!", "success");
      } else {
        // mode === 'month'
        // 1. Delete transactions of current month/year
        const txPath = `users/${user.uid}/transactions`;
        const txDocs = await getDocs(collection(db, txPath));
        for (const tDoc of txDocs.docs) {
          const data = tDoc.data();
          const d = parseFirebaseDate(data.date);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            await deleteDoc(doc(db, txPath, tDoc.id));
          }
        }

        // 2. Delete bills of current month/year
        const billsPath = `users/${user.uid}/bills`;
        const billsDocs = await getDocs(collection(db, billsPath));
        for (const bDoc of billsDocs.docs) {
          const data = bDoc.data();
          if (data.dueDate && data.dueDate.startsWith(yearMonthStr)) {
            await deleteDoc(doc(db, billsPath, bDoc.id));
          }
        }

        showToast("Todas as movimentações e contas do mês atual foram excluídas!", "success");
      }
    } catch (error) {
      console.error("Erro ao limpar dados no Firestore:", error);
      showToast("Erro ao tentar limpar os dados na nuvem.", "error");
    } finally {
      setFirebaseSyncStatus('synced');
    }
  };

  return (
    <FinanceContext.Provider value={{
      user,
      loading,
      transactions: filteredTransactions,
      allTransactions,
      categories: resolvedCategories,
      notes: isDemoMode ? [] : notes,
      bills: isDemoMode ? demoBills : realBills,
      profile,
      settings,
      isDemoMode,
      setDemoMode,
      interactionCount,
      trackDemoInteraction,
      addTransaction,
      deleteTransaction,
      addCategory,
      updateProfile,
      updateSettings,
      addNote,
      updateNote,
      deleteNote,
      addBill,
      deleteBill,
      updateBill,
      payBill,
      getDRE,
      products,
      addProduct,
      deleteProduct,
      updateProduct,
      inventoryItems,
      addInventoryItem,
      deleteInventoryItem,
      updateInventoryItem,
      toast,
      showToast,
      hideToast,
      storeProfiles,
      activeStoreId,
      setActiveStoreId,
      addStoreProfile,
      deleteStoreProfile,
      updateStoreProfile,
      language,
      setLanguage,
      t,
      developerMessages: isDemoMode ? demoDeveloperMessages : developerMessages,
      addDeveloperMessage,
      addDeveloperReply,
      firebaseSyncStatus,
      setFirebaseSyncStatus,
      demoSpeed,
      setDemoSpeed,
      triggerLiveSimTransaction,
      lastSimulatedTransactions,
      clearAllData
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
