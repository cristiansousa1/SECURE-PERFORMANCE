import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, Category, BusinessProfile, DRELine, GlobalSettings, PlanConfig, BillPayable, StoreProfile, ProductPriceCalc } from '../types';

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
  toast: { message: string; type: "success" | "warning" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "warning" | "error" | "info") => void;
  hideToast: () => void;
  storeProfiles: StoreProfile[];
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
  addStoreProfile: (sp: Omit<StoreProfile, "id">) => Promise<void>;
  deleteStoreProfile: (id: string) => Promise<void>;
  updateStoreProfile: (id: string, updates: Partial<StoreProfile>) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [realBills, setRealBills] = useState<BillPayable[]>([]);
  const [demoBills, setDemoBills] = useState<BillPayable[]>(MOCK_BILLS);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isDemoMode, setDemoMode] = useState(false);
  const [demoTransactions, setDemoTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [demoCategories, setDemoCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [interactionCount, setInteractionCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" | "info" } | null>(null);

  const [realProducts, setRealProducts] = useState<ProductPriceCalc[]>([]);
  const [demoProducts, setDemoProducts] = useState<ProductPriceCalc[]>([
    {
      id: "p1",
      name: "Hamburguer Gourmet Premium",
      sku: "HGD-001",
      costPrice: 12.50,
      desiredMargin: 35.0,
      sellingPrice: 32.90,
      cmvPct: 38.0,
      taxRate: 6.0,
      otherCostsPct: 10.0,
      profitMarginPct: 46.0,
      profitValue: 15.13,
      userId: "demo",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "p2",
      name: "Pizza Artesanal Rucula",
      sku: "PAR-002",
      costPrice: 15.80,
      desiredMargin: 30.0,
      sellingPrice: 48.00,
      cmvPct: 32.9,
      taxRate: 6.0,
      otherCostsPct: 12.0,
      profitMarginPct: 49.1,
      profitValue: 23.57,
      userId: "demo",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "p3",
      name: "Batata Rustica Canoa",
      sku: "BRC-003",
      costPrice: 3.20,
      desiredMargin: 40.0,
      sellingPrice: 14.90,
      cmvPct: 21.5,
      taxRate: 6.0,
      otherCostsPct: 8.0,
      profitMarginPct: 64.5,
      profitValue: 9.61,
      userId: "demo",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const products = isDemoMode ? demoProducts : realProducts;

  // Multiple Store Profiles State
  const [storeProfiles, setStoreProfiles] = useState<StoreProfile[]>(() => {
    const saved = localStorage.getItem('finai_store_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'matriz', companyName: 'Loja 1 (Matriz São Paulo)', cnpj: '12.345.678/0001-01', taxRate: 6, businessSegment: 'commerce', color: 'orange' },
      { id: 'filial', companyName: 'Loja 2 (Filial Campinas)', cnpj: '87.654.321/0002-02', taxRate: 8, businessSegment: 'commerce', color: 'blue' }
    ];
  });

  const [activeStoreId, setActiveStoreId] = useState<string>(() => {
    return localStorage.getItem('finai_active_store_id') || 'all';
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('finai_store_profiles', JSON.stringify(storeProfiles));
  }, [storeProfiles]);

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
    const activeCategories = isDemoMode ? demoCategories : categories;
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

  const showToast = (message: string, type: "success" | "warning" | "error" | "info" = "info") => {
    setToast({ message, type });
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
    if (!user) return;
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

  const updateNote = async (id: string, title: string, content: string) => {
    if (!user) return;
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
    if (!user) return;
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

    if (!user) return;
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

    if (!user) return;
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

    if (!user) return;
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
        setProfile(d.data() as BusinessProfile);
      } else {
        // Init profile
        const initProfile = { 
          userId: user.uid, 
          companyName: user.displayName || 'Minha Empresa', 
          currency: 'BRL',
          taxRate: 6 // Default 6% for Simples Nacional
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

  // Synchronize profile for isDemoMode
  useEffect(() => {
    if (isDemoMode && !user) {
      setProfile({
        userId: 'demo',
        companyName: 'Matriz Gourmet Spanner',
        currency: 'BRL',
        taxRate: 6,
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        corporateSubscriptions: [
          { id: 'sub-aws', name: 'Suíte de Cloud AWS (Tecnologia)', amount: 250.00, categoryId: 'cat8', active: true },
          { id: 'sub-openai', name: 'Tokens OpenAI API (Serviços I.A.)', amount: 99.00, categoryId: 'cat8', active: true },
          { id: 'sub-rent', name: 'Aluguel do Galpão Comercial', amount: 1500.00, categoryId: 'cat3', active: true },
        ],
        averageBilling: 18500,
        billingGoal: 30000,
        billingGoalDeadline: 'Dezembro / 2026',
        billingNotes: 'Expandir o delivery em canais próprios e otimizar margem bruta dos principais itens (CMV).'
      });
    } else if (!isDemoMode && !user) {
      setProfile(null);
    }
  }, [isDemoMode, user]);

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

    if (isDemoMode) {
      const newTx: Transaction = {
        ...t,
        id: 'tx-demo-' + Math.random().toString(36).substring(2, 9),
        userId: 'demo',
        createdAt: new Date(),
        updatedAt: new Date(),
        date: parsedDate,
        profileId
      };
      setDemoTransactions(prev => [newTx, ...prev]);
      showToast("Lançamento adicionado com sucesso (Modo Demo)!", "success");
      return;
    }

    if (!user) return;
    const path = `users/${user.uid}/transactions`;
    try {
      await addDoc(collection(db, path), cleanUndefined({
        ...t,
        userId: user.uid,
        profileId,
        date: Timestamp.fromDate(parsedDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (isDemoMode) {
      setDemoTransactions(prev => prev.filter(t => t.id !== id));
      showToast("Lançamento removido (Modo Demo)!", "info");
      return;
    }

    if (!user) return;
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
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
    if (!user) return;
    const path = `users/${user.uid}/categories`;
    try {
      await addDoc(collection(db, path), cleanUndefined({ ...c, userId: user.uid }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateProfile = async (p: Partial<BusinessProfile>) => {
    if (isDemoMode || !user) {
      setProfile(prev => prev ? { ...prev, ...p } : {
        userId: 'demo',
        companyName: 'Matriz Gourmet Spanner',
        currency: 'BRL',
        taxRate: 6,
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
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
      .filter(t => t.isProductSale && t.productCostPrice && t.quantity)
      .reduce((acc, t) => acc + (t.productCostPrice! * t.quantity!), 0);

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
      { label: '(-) Custos dos Produtos/Serviços (CMV/CPV)', value: -cmv, indent: 1 },
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

    if (!user) return;
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

    if (!user) return;
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

    if (!user) return;
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
      toast,
      showToast,
      hideToast,
      storeProfiles,
      activeStoreId,
      setActiveStoreId,
      addStoreProfile,
      deleteStoreProfile,
      updateStoreProfile
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
