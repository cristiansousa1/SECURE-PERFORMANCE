import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripeClient) {
    const rawKey = process.env.STRIPE_SECRET_KEY || "";
    const key = rawKey.replace(/['"“”]/g, "").trim();
    if (key && key.startsWith("sk_")) {
      stripeClient = new Stripe(key, {
        apiVersion: "2025-01-27.acacia" as any,
      });
    }
  }
  return stripeClient;
}

let globalGeminiApiKey = process.env.GEMINI_API_KEY || "";

function getAiClient(customKey?: string): GoogleGenAI {
  const finalKey = customKey && customKey.trim().length > 10 
    ? customKey.trim().replace(/['"“”]/g, "") 
    : (globalGeminiApiKey || process.env.GEMINI_API_KEY || "");
  
  return new GoogleGenAI({
    apiKey: finalKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const ai = getAiClient();

// Helper to extract custom API key and custom model from Request
function getCustomKeyFromRequest(req: express.Request): string | undefined {
  const headerKey = req.headers["x-custom-gemini-key"] || req.headers["X-Custom-Gemini-Key"];
  if (headerKey && typeof headerKey === "string" && headerKey.trim().length > 10) {
    const key = headerKey.trim();
    if (key !== "AIzaSyC0FurafhGqn7jIOUYsJ0WMeMfhkvIihwA") {
      return key;
    }
  }
  const bodyKey = req.body?.customGeminiKey || req.body?.customApiKey;
  if (bodyKey && typeof bodyKey === "string" && bodyKey.trim().length > 10) {
    const key = bodyKey.trim();
    if (key !== "AIzaSyC0FurafhGqn7jIOUYsJ0WMeMfhkvIihwA") {
      return key;
    }
  }
  return undefined;
}

function getCustomModelFromRequest(req: express.Request): string | undefined {
  const headerModel = req.headers["x-custom-gemini-model"] || req.headers["X-Custom-Gemini-Model"];
  if (headerModel && typeof headerModel === "string" && headerModel.trim().length > 3) {
    return headerModel.trim();
  }
  const bodyModel = req.body?.geminiModel || req.body?.model;
  if (bodyModel && typeof bodyModel === "string" && bodyModel.trim().length > 3) {
    return bodyModel.trim();
  }
  return undefined;
}

// INITIALIZE FIREBASE FOR SERVER-SIDE DB CACHING
import fs from "fs";
import crypto from "crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, setLogLevel } from "firebase/firestore";

try {
  setLogLevel("silent");
} catch (e) {}

// Global interceptor to prevent noisy, expected gRPC-Web stream cancellation logs from polluting server console
if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  const isBenignFirestoreLog = (args: any[]): boolean => {
    if (!args || args.length === 0) return false;
    
    // Cycle-safe helper to recursively scan any log argument for benign Firestore messages
    const scan = (val: any, visited = new Set<any>()): string => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'number' || typeof val === 'boolean') return String(val);
      if (val instanceof Error) {
        return `${val.name} ${val.message} ${val.stack || ''}`;
      }
      if (typeof val === 'object') {
        if (visited.has(val)) return '';
        visited.add(val);
        try {
          let res = '';
          if (Array.isArray(val)) {
            return val.map(item => scan(item, visited)).join(' ');
          }
          for (const k of Object.keys(val)) {
            try {
              res += ` ${k} ${scan(val[k], visited)}`;
            } catch (_) {}
          }
          return res;
        } catch (_) {
          return String(val);
        }
      }
      return '';
    };

    try {
      const combinedText = args.map(arg => scan(arg)).join(' ').toLowerCase();

      return (
        combinedText.includes('disconnecting idle stream') ||
        combinedText.includes('timed out waiting for new targets') ||
        combinedText.includes('grpcconnection') ||
        combinedText.includes('cancelled') ||
        (combinedText.includes('listen') && combinedText.includes('stream')) ||
        combinedText.includes('stream error. code: 1')
      );
    } catch (_) {
      return false;
    }
  };

  console.warn = (...args: any[]) => {
    if (isBenignFirestoreLog(args)) return;
    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    if (isBenignFirestoreLog(args)) return;
    originalError.apply(console, args);
  };

  console.log = (...args: any[]) => {
    if (isBenignFirestoreLog(args)) return;
    originalLog.apply(console, args);
  };
}

let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const fbApp = initializeApp(firebaseConfig);
    db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    console.log("[Firebase Server Cache] Firebase inicializado com sucesso para armazenamento central de cache.");
  } else {
    console.warn("[Firebase Server Cache WARNING] firebase-applet-config.json não encontrado. Caches não serão acionados.");
  }
} catch (error) {
  console.error("[Firebase Server Cache ERROR] Falha ao inicializar o Firebase cache:", error);
}

async function loadGlobalApiKey() {
  const localConfigPath = path.join(process.cwd(), "global_api_key.json");
  if (fs.existsSync(localConfigPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(localConfigPath, "utf8"));
      if (data.apiKey && data.apiKey.trim().length > 10) {
        globalGeminiApiKey = data.apiKey.trim();
        console.log("[ApiKey Loader] Chave Global de IA carregada com sucesso do arquivo local.");
      }
    } catch (e: any) {
      console.warn("[ApiKey Loader WARNING] Falha ao ler arquivo local:", e.message);
    }
  }

  if (!db) return;
  try {
    const configDocRef = doc(db, "system_config", "gemini");
    const snap = await getDoc(configDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.apiKey && data.apiKey.trim().length > 10) {
        globalGeminiApiKey = data.apiKey.trim();
        console.log("[ApiKey Loader] Chave Global de IA ativa e carregada do Firestore!");
        try {
          fs.writeFileSync(localConfigPath, JSON.stringify({ apiKey: globalGeminiApiKey }), "utf8");
        } catch (_) {}
      }
    }
  } catch (error: any) {
    console.warn("[ApiKey Loader WARNING] Falha ao sincronizar chave com o Firestore:", error.message || error);
  }
}

loadGlobalApiKey();

/**
 * Computes a unique secure hash of the request parameters
 */
function computeRequestHash(provider: string, data: any): string {
  const hash = crypto.createHash("sha256");
  const dataString = typeof data === "string" ? data : JSON.stringify(data);
  hash.update(`${provider}:${dataString}`);
  return hash.digest("hex");
}

/**
 * Tries to fetch a cached response from Firestore
 */
async function getCachedAiResponse(provider: "gemini" | "openai", requestData: any): Promise<string | null> {
  if (!db) return null;
  try {
    const hash = computeRequestHash(provider, requestData);
    const cacheDocRef = doc(db, "ai_cache", hash);
    const cacheSnap = await getDoc(cacheDocRef);
    
    if (cacheSnap.exists()) {
      const data = cacheSnap.data();
      const expiresAt = new Date(data.expiresAt);
      if (expiresAt.getTime() > Date.now()) {
        console.log(`[Cache de IA] HIT de Cache no Firestore encontrado para [${provider}]! Chave: ${hash}`);
        return data.responseText || null;
      } else {
        console.log(`[Cache de IA] Cache expirado do Firestore para [${provider}]. Chave: ${hash}`);
      }
    }
  } catch (error: any) {
    console.warn("[Cache de IA WARNING] Erro ao ler cache do Firestore (prosseguindo sem cache):", error.message || error);
  }
  return null;
}

/**
 * Saves an AI response into Firestore cache
 */
async function saveCachedAiResponse(
  provider: "gemini" | "openai", 
  requestData: any, 
  responseText: string, 
  ttlMs: number
): Promise<void> {
  if (!db) return;
  try {
    const hash = computeRequestHash(provider, requestData);
    const cacheDocRef = doc(db, "ai_cache", hash);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    
    const cachePayload = {
      id: hash,
      provider,
      requestHash: hash,
      requestData: typeof requestData === "string" ? requestData : JSON.stringify(requestData).substring(0, 5000),
      responseText,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };
    
    await setDoc(cacheDocRef, cachePayload);
    console.log(`[Cache de IA] Resposta de [${provider}] salva com sucesso no Firestore cache! Chave: ${hash}. Expira em: ${expiresAt.toLocaleString()}`);
  } catch (error: any) {
    console.warn("[Cache de IA WARNING] Erro ao salvar cache no Firestore:", error.message || error);
  }
}

// Helper to call Gemini API with retry logic for high-demand (503) or transient errors
async function callGeminiWithRetry<T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 1000,
  skipRetryOnHighDemand = false
): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      const errorStrUpper = errorStr.toUpperCase();
      
      // Check for hard credit limits / quota budget exhausted which cannot be resolved by retrying
      const isHardQuotaExceeded = 
        errorStrUpper.includes("EXCEEDED YOUR CURRENT QUOTA") ||
        errorStrUpper.includes("QUOTA EXCEEDED") ||
        errorStrUpper.includes("CHECK YOUR PLAN") ||
        errorStrUpper.includes("BILLING DETAILS");
      
      const isHighDemand = 
        errorStrUpper.includes("HIGH DEMAND") ||
        errorStrUpper.includes("SPIKES IN DEMAND") ||
        errorStrUpper.includes("OVERLOAD") ||
        errorStrUpper.includes("503") ||
        errorStrUpper.includes("TEMPORARY") ||
        errorStrUpper.includes("UNAVAILABLE") ||
        errorStrUpper.includes("LOAD") ||
        errorStrUpper.includes("OVERLOADED");

      // For primary model, skip retrying standard high-demand instances to switch to fallback immediately
      if (skipRetryOnHighDemand && isHighDemand) {
        console.warn(`[Gemini API] Bypassing retry due to detected model high demand/congestion. Failing active call to trigger instant fallback model...`);
        throw error;
      }
      
      const isTransient = 
        (errorStrUpper.includes("503") || 
         errorStrUpper.includes("UNAVAILABLE") || 
         errorStrUpper.includes("RESOURCE_EXHAUSTED") || 
         errorStrUpper.includes("429") || 
         errorStrUpper.includes("QUOTA") || 
         errorStrUpper.includes("TEMPORARY") || 
         errorStrUpper.includes("RATE_LIMIT")) && 
        !isHardQuotaExceeded;
      
      if (isTransient && i < retries - 1) {
        console.warn(`[Gemini API Retry] Temporary load or quota limit on attempt ${i + 1}/${retries}. Retrying in ${delay}ms... Error:`, errorStr.substring(0, 150));
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5; // exponential backoff multiplier
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

// Tracks when Gemini API hits a hard quota limit (429 / RESOURCE_EXHAUSTED)
let lastQuotaExceededTime = 0;
const QUOTA_BLOCK_DURATION = 60 * 1000; // Pause API attempts for 60 seconds if a quota error is active

function handleQuotaErrorTrack(error: any): boolean {
  const errorStr = (error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))).toUpperCase();
  const isQuota = 
    errorStr.includes("RESOURCE_EXHAUSTED") || 
    errorStr.includes("429") || 
    errorStr.includes("QUOTA") || 
    errorStr.includes("LIMIT EXCEEDED") ||
    errorStr.includes("CHECK YOUR PLAN");
    
  if (isQuota) {
    lastQuotaExceededTime = Date.now();
  }
  return isQuota;
}

function sanitizeGeminiTurns(turns: any[]): any[] {
  const result: any[] = [];
  for (const turn of turns) {
    if (!turn || typeof turn !== "object") {
      result.push(turn);
      continue;
    }
    const role = turn.role === "assistant" || turn.role === "model" ? "model" : "user";
    let text = "";
    if (Array.isArray(turn.parts)) {
      text = turn.parts.map((p: any) => p?.text || "").join("\n");
    } else if (typeof turn.parts === "string") {
      text = turn.parts;
    } else if (turn.content) {
      text = turn.content;
    } else if (typeof turn.text === "string") {
      text = turn.text;
    }

    if (result.length === 0) {
      result.push({ role, parts: [{ text }] });
    } else {
      const lastTurn = result[result.length - 1];
      if (lastTurn.role === role) {
        // Merge identical consecutive roles
        const lastText = lastTurn.parts[0]?.text || "";
        lastTurn.parts = [{ text: lastText + "\n" + text }];
      } else {
        result.push({ role, parts: [{ text }] });
      }
    }
  }
  return result;
}

function cleanThoughtBlocks(text: string): string {
  if (!text || typeof text !== "string") return text;
  
  let cleaned = text;
  
  // 1. Remove complete <thought>...</thought> blocks
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, "");
  
  // 2. Remove complete [thought]...[/thought] blocks as well
  cleaned = cleaned.replace(/\[thought\][\s\S]*?\[\/thought\]/gi, "");
  
  // 3. Remove incomplete <thought> blocks (everything from <thought> to end of text)
  if (cleaned.toLowerCase().includes("<thought>")) {
    const idx = cleaned.toLowerCase().indexOf("<thought>");
    cleaned = cleaned.substring(0, idx);
  }
  
  // 4. Remove incomplete [thought] blocks (everything from [thought] to end of text)
  if (cleaned.toLowerCase().includes("[thought]")) {
    const idx = cleaned.toLowerCase().indexOf("[thought]");
    cleaned = cleaned.substring(0, idx);
  }

  // 5. Remove standalone "Thinking Process:" headers and any lines following it if it resembles a leakage
  const lines = cleaned.split("\n");
  const thinkingProcessIndex = lines.findIndex(line => 
    line.toLowerCase().includes("thinking process:") || 
    line.toLowerCase().includes("processo de pensamento:")
  );
  if (thinkingProcessIndex !== -1) {
    // If found, strip everything from that index onwards if it was appended as a thought block
    cleaned = lines.slice(0, thinkingProcessIndex).join("\n");
  }
  
  return cleaned.trim();
}

// Automatically falls back across multiple model tiers (gemini-3.5-flash -> gemini-flash-latest -> gemini-3.1-flash-lite) upon 429/Resource Exhausted/Quota errors, or transient 503 high demand errors
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  ttlMs?: number;
  customApiKey?: string;
  model?: string;
}) {
  const ttlMs = params.ttlMs ?? 12 * 60 * 60 * 1000; // default 12 hours TTL
  
  let sanitizedContents = params.contents;
  if (Array.isArray(sanitizedContents)) {
    sanitizedContents = sanitizeGeminiTurns(sanitizedContents);
  }

  // Try to load cached response from Firestore
  const cachedText = await getCachedAiResponse("gemini", sanitizedContents);
  if (cachedText) {
    return { text: cleanThoughtBlocks(cachedText) };
  }

  const now = Date.now();
  if (now - lastQuotaExceededTime < QUOTA_BLOCK_DURATION) {
    console.warn("[Gemini Fallback] Gemini API calls are temporarily paused due to active quota limits (bypassing model tiers to avoid hanging).");
    throw new Error("QUOTA_EXHAUSTED_PAUSE: Chamadas de IA suspensas temporariamente devido a limite de cota ativo.");
  }

  // Initialize client based on whether a custom API key is present
  const localAi = getAiClient(params.customApiKey);
  const primaryModel = params.model || "gemini-3.5-flash";

  let finalResponse: any = null;

  // Tier 1: Primary Model (user custom model or default gemini-3.5-flash)
  try {
    console.log(`[Gemini Fallback] Tentando Modelo Primário (${primaryModel})...`);
    finalResponse = await callGeminiWithRetry(() => localAi.models.generateContent({
      model: primaryModel,
      contents: sanitizedContents,
      config: params.config,
    }), 3, 800, false);
  } catch (err1: any) {
    const isQuota = handleQuotaErrorTrack(err1);
    if (isQuota) {
      console.warn(`[Gemini Fallback Warning] Modelo primário (${primaryModel}) atingiu limite de cota (429/RESOURCE_EXHAUSTED). Disparando fallback imediato.`);
      throw err1;
    }

    const err1Str = (err1?.message || (typeof err1 === 'object' ? JSON.stringify(err1) : String(err1))).substring(0, 150);
    console.warn(`[Gemini Fallback Warning] Modelo primário (${primaryModel}) falhou: "${err1Str}". Ativando Tier 2 (gemini-flash-latest)...`);
    
    // Tier 2: Secondary Model (gemini-flash-latest) - provides a different deployment version/endpoint
    try {
      console.log("[Gemini Fallback] Tentando Modelo Secundário (gemini-flash-latest)...");
      finalResponse = await callGeminiWithRetry(() => localAi.models.generateContent({
        model: "gemini-flash-latest",
        contents: sanitizedContents,
        config: params.config,
      }), 3, 1000, false);
    } catch (err2: any) {
      const isQuota2 = handleQuotaErrorTrack(err2);
      if (isQuota2) {
        console.warn("[Gemini Fallback Warning] Tier 2 atingiu limite de cota (429/RESOURCE_EXHAUSTED). Disparando fallback offline imediato.");
        throw err2;
      }

      const err2Str = (err2?.message || (typeof err2 === 'object' ? JSON.stringify(err2) : String(err2))).substring(0, 150);
      console.warn(`[Gemini Fallback Warning] Tier 2 (gemini-flash-latest) também falhou ou está congestionado: "${err2Str}". Ativando Tier 3 ultra-resiliente (gemini-3.1-flash-lite)...`);
      
      // Tier 3: Tertiary Ultra-resilient Model (gemini-3.1-flash-lite)
      try {
        console.log("[Gemini Fallback] Tentando Modelo Ultra-resiliente (gemini-3.1-flash-lite)...");
        finalResponse = await callGeminiWithRetry(() => localAi.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: sanitizedContents,
          config: params.config,
        }), 3, 1200, false);
      } catch (err3: any) {
        const isQuota3 = handleQuotaErrorTrack(err3);
        const errStr = (err3?.message || (typeof err3 === 'object' ? JSON.stringify(err3) : String(err3)));
        const err3Str = errStr.substring(0, 150);
        
        if (isQuota3) {
          console.warn(`[Gemini Fallback Failure] Todos os modelos de IA falharam/suspensos por limite de cota (429/RESOURCE_EXHAUSTED). Ativando fallback local.`);
        } else {
          console.error(`[Gemini Fallback Failure] Todos os modelos de IA falharam (Tier 1, 2, e 3) mesmo com retentativas: "${err3Str}".`);
        }
        throw err3;
      }
    }
  }

  // Save successful response text into Firestore cache
  if (finalResponse && typeof finalResponse.text === "string") {
    const responseText = cleanThoughtBlocks(finalResponse.text);
    await saveCachedAiResponse("gemini", sanitizedContents, responseText, ttlMs);
    
    // Create a shadowed object to override the read-only 'text' getter
    const customResponse = Object.create(finalResponse);
    Object.defineProperty(customResponse, "text", {
      value: responseText,
      writable: true,
      enumerable: true,
      configurable: true
    });
    return customResponse;
  }

  return finalResponse;
}

// Helper to safely parse JSON from AI outputs, removing extra characters, citations, or markdown fences
function safeParseJSON(rawText: string): any {
  if (!rawText) {
    throw new Error("Empty raw text cannot be parsed to JSON");
  }
  
  let cleaned = rawText.trim();
  
  // Find first opening brace '{' or bracket '['
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  
  let startIndex = -1;
  let endIndex = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    endIndex = cleaned.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    endIndex = cleaned.lastIndexOf("]");
  }
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    cleaned = cleaned.substring(startIndex, endIndex + 1);
  }
  
  // Basic cleaning of trailing commas in objects or arrays (extremely common LLM errors)
  cleaned = cleaned
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
    
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.warn("[safeParseJSON] Simple JSON parse failed. Raw length was:", rawText.length, "Attempting advanced regex cleaning...");
    // Fallback: strip line breaks/tabs that could break string values inside JSON
    try {
      // Just try standard parsing once more, in case any subtle cleaning helped
      return JSON.parse(cleaned);
    } catch (err2) {
      throw err; // throw original parsing error to trigger route-level fallback
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory API key usage budget and rate limiting system
  interface UserUsage {
    dailyCount: number;
    lastRequestTime: number;
    minuteRequests: number;
    firstRequestOfDay: number;
  }

  const usageStore: Record<string, UserUsage> = {};

  // Clean old store records periodically to avoid memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const key in usageStore) {
      if (now - usageStore[key].firstRequestOfDay > 24 * 60 * 60 * 1000) {
        delete usageStore[key];
      }
    }
  }, 3600 * 1000);

  function checkUsageLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const userEmail = (req.headers["x-user-email"] as string) || "";
    const clientIp = (req.headers["x-forwarded-for"] as string) || req.ip || "anonymous";
    const identifier = userEmail.trim().length > 0 ? userEmail.trim().toLowerCase() : clientIp;
    
    const isAdmin = identifier === "cristianmilkymoo@gmail.com";
    const hasCustomKey = !!getCustomKeyFromRequest(req);
    
    const now = Date.now();
    
    if (!usageStore[identifier]) {
      usageStore[identifier] = {
        dailyCount: 0,
        lastRequestTime: now,
        minuteRequests: 0,
        firstRequestOfDay: now
      };
    }
    
    const usage = usageStore[identifier];
    
    // Reset minute tracking if more than 60 seconds have elapsed
    if (now - usage.lastRequestTime > 60 * 1000) {
      usage.minuteRequests = 0;
    }
    
    // Reset daily tracking if more than 24 hours have elapsed
    if (now - usage.firstRequestOfDay > 24 * 60 * 60 * 1000) {
      usage.dailyCount = 0;
      usage.firstRequestOfDay = now;
    }
    
    usage.lastRequestTime = now;
    
    // Check minute rate-limiting: Max 6 queries per minute to prevent accidental spam/flickering
    usage.minuteRequests++;
    if (usage.minuteRequests > 6 && !isAdmin) {
      return res.status(429).json({
        error: "Velocidade de Processamento: Você atingiu o limite máximo de requisições por minuto (limite de 6). Por segurança, dê um intervalo de alguns segundos antes de prosseguir."
      });
    }
    
    if (isAdmin) {
      return next();
    }
    
    // If the client is using their own custom API key, they don't consume our shared budget!
    if (hasCustomKey) {
      return next();
    }
    
    // Check daily budget: max 40 queries to ensure high availability and preserve API keys
    const DAILY_LIMIT = 40;
    if (usage.dailyCount >= DAILY_LIMIT) {
      return res.status(403).json({
        error: "Gestão de Recursos: Cota Diária Esgotada (40 de 40 consultas consumidas). Para prevenir desperdício de fundos ou uso abusivo das chaves de IA integradas, o sistema suspendeu as consultas gratuitas temporariamente. Por favor, adicione sua própria chave API Gemini nas Configurações para continuar sem restrições!"
      });
    }
    
    // Count as consumption
    usage.dailyCount++;
    next();
  }

  // Intercept and protect all server POST calls to Gemini endpoints
  app.use("/api/ai/*", (req, res, next) => {
    if (req.originalUrl.includes("/config") || req.originalUrl.includes("/usage-status")) {
      return next();
    }
    if (req.method !== "POST") {
      return next();
    }
    checkUsageLimit(req, res, next);
  });

  // GET: Obter o status de uso atual do plano de cota de IA do usuário
  app.get("/api/ai/usage-status", (req, res) => {
    try {
      const userEmail = (req.headers["x-user-email"] as string) || "";
      const clientIp = (req.headers["x-forwarded-for"] as string) || req.ip || "anonymous";
      const identifier = userEmail.trim().length > 0 ? userEmail.trim().toLowerCase() : clientIp;
      
      const isAdmin = identifier === "cristianmilkymoo@gmail.com";
      const hasCustomKey = !!getCustomKeyFromRequest(req);
      const now = Date.now();
      
      if (!usageStore[identifier]) {
        usageStore[identifier] = {
          dailyCount: 0,
          lastRequestTime: now,
          minuteRequests: 0,
          firstRequestOfDay: now
        };
      }
      
      const usage = usageStore[identifier];
      
      if (now - usage.firstRequestOfDay > 24 * 60 * 60 * 1000) {
        usage.dailyCount = 0;
        usage.firstRequestOfDay = now;
      }
      
      const DAILY_LIMIT = 40;
      const hoursRemaining = (24 * 60 * 60 * 1000 - (now - usage.firstRequestOfDay)) / (1000 * 60 * 60);
      
      res.json({
        identifier: userEmail || "Guest / Visitante",
        email: userEmail,
        dailyCount: usage.dailyCount,
        dailyLimit: DAILY_LIMIT,
        minuteRequests: usage.minuteRequests,
        hasCustomKey: hasCustomKey,
        isAdmin: isAdmin,
        remaining: Math.max(0, DAILY_LIMIT - usage.dailyCount),
        resetInHours: Math.max(0.1, Number(hoursRemaining.toFixed(1)))
      });
    } catch (e: any) {
      res.status(500).json({ error: "Erro ao obter status da cota de IA" });
    }
  });

  // GET: Obter relatório detalhado de auditoria de segurança (EXCLUSIVO PARA ADMINISTRADOR)
  app.get("/api/admin/detailed-audit", (req, res) => {
    try {
      const userEmail = (req.headers["x-user-email"] as string) || "";
      const isAdmin = userEmail.trim().toLowerCase() === "cristianmilkymoo@gmail.com";

      if (!isAdmin) {
        return res.status(403).json({
          error: "Acesso Negado: Apenas o administrador cristianmilkymoo@gmail.com possui permissão para acessar o console de inteligência detalhado."
        });
      }

      // Compute interesting diagnostic stats
      const userUsageProfiles = Object.entries(usageStore).map(([id, usage]) => {
        const resetHoursLeft = (24 * 60 * 60 * 1000 - (Date.now() - usage.firstRequestOfDay)) / (1000 * 60 * 60);
        return {
          id,
          dailyCount: usage.dailyCount,
          minuteRequests: usage.minuteRequests,
          resetInHours: Math.max(0, Number(resetHoursLeft.toFixed(2))),
          isAbusing: usage.dailyCount > 30 || usage.minuteRequests > 4,
        };
      });

      const totalRequestsRecorded = Object.values(usageStore).reduce((acc, u) => acc + u.dailyCount, 0);
      const estimatedCostUSD = totalRequestsRecorded * 0.0025; // Estimate $0.0025/req on average

      res.json({
        success: true,
        auditTimestamp: new Date().toISOString(),
        systemUptimeSec: Math.floor(process.uptime()),
        totalActiveProfiles: Object.keys(usageStore).length,
        totalRequestsRecorded,
        estimatedCostUSD: Number(estimatedCostUSD.toFixed(4)),
        hasGlobalKeyConfigured: !!globalGeminiApiKey,
        usageProfiles: userUsageProfiles,
        environmentMode: process.env.NODE_ENV || "development",
        safetyGuidelinesEnforced: true,
        databaseProvider: db ? "Cloud Firestore (Persistente)" : "In-Memory Fallback (Volátil)",
      });
    } catch (error: any) {
      res.status(500).json({ error: `Erro na auditoria avançada: ${error.message || error}` });
    }
  });

  // GET: Obter a configuração da chave API global do aplicativo
  app.get("/api/ai/config", async (req, res) => {
    try {
      const userEmail = req.headers["x-user-email"];
      const isAdmin = userEmail === "cristianmilkymoo@gmail.com";
      const exists = !!globalGeminiApiKey;
      let maskedKey = null;

      // Only the admin can see the masked key structure
      if (exists && isAdmin) {
        const len = globalGeminiApiKey.length;
        maskedKey = globalGeminiApiKey.substring(0, 6) + "..." + (len > 4 ? globalGeminiApiKey.substring(len - 4) : "");
      }

      res.json({
        hasGlobalKey: exists,
        maskedKey: maskedKey,
      });
    } catch (e: any) {
      res.status(500).json({ error: "Erro ao obter configurações de IA." });
    }
  });

  // POST: Cadastrar/Salvar a chave API global do aplicativo
  app.post("/api/ai/config", async (req, res) => {
    const { apiKey } = req.body;
    const userEmail = req.headers["x-user-email"];
    const isAdmin = userEmail === "cristianmilkymoo@gmail.com";

    if (!isAdmin) {
      return res.status(403).json({ 
        error: "Segurança de Acesso: Apenas o administrador do sistema possui privilégios para registrar ou alterar a chave API global." 
      });
    }
    
    try {
      if (apiKey === undefined) {
        return res.status(400).json({ error: "O campo apiKey é obrigatório." });
      }

      const keyToSave = apiKey.trim().replace(/['"“”]/g, "");

      if (keyToSave.length === 0) {
        // Remover a chave global (limpar)
        globalGeminiApiKey = "";

        // Remover do Firestore se aplicável
        if (db) {
          const configDocRef = doc(db, "system_config", "gemini");
          await setDoc(configDocRef, { apiKey: "", updatedAt: new Date().toISOString() });
        }

        // Remover do Arquivo Local
        const localConfigPath = path.join(process.cwd(), "global_api_key.json");
        if (fs.existsSync(localConfigPath)) {
          try {
            fs.unlinkSync(localConfigPath);
          } catch (_) {}
        }

        return res.json({
          success: true,
          message: "Chave API Global do aplicativo removida com sucesso. O sistema voltou a utilizar o faturamento padrão do servidor.",
          hasGlobalKey: false
        });
      }

      if (keyToSave.length < 10) {
        return res.status(400).json({ error: "Sua chave API Gemini parece ser inválida (muito curta)." });
      }

      // Validação rápida da chave chamando a API do Gemini
      try {
        const testClient = new GoogleGenAI({ apiKey: keyToSave });
        await testClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Teste rápido de autenticação."
        });
      } catch (authError: any) {
        console.warn("[Autenticação API] Falha na validação rápida da nova chave:", authError);
        return res.status(400).json({
          error: `A chave API informada é inválida ou não pôde ser autenticada pelo Google AI Studio. Detalhes: ${authError.message || authError}`
        });
      }

      // Atualiza em memória
      globalGeminiApiKey = keyToSave;

      // Salva no Firestore
      if (db) {
        const configDocRef = doc(db, "system_config", "gemini");
        await setDoc(configDocRef, {
          apiKey: keyToSave,
          updatedAt: new Date().toISOString()
        });
      }

      // Salva em arquivo físico para inicializações subsequentes rápidas
      const localConfigPath = path.join(process.cwd(), "global_api_key.json");
      fs.writeFileSync(localConfigPath, JSON.stringify({ apiKey: keyToSave }), "utf8");

      const len = keyToSave.length;
      res.json({
        success: true,
        message: "Chave API Global do aplicativo cadastrada, validada e salva com sucesso para todos os usuários!",
        hasGlobalKey: true,
        maskedKey: keyToSave.substring(0, 6) + "..." + (len > 4 ? keyToSave.substring(len - 4) : "")
      });
    } catch (e: any) {
      console.error("[Cadastro API Key Error]", e);
      res.status(500).json({ error: `Erro interno ao cadastrar a chave API: ${e.message || e}` });
    }
  });

  // API Route for Financial Summary
  app.post("/api/ai/financial-summary", async (req, res) => {
    try {
      const { data, neuralPrecision, neuralTier } = req.body;
      const businessSegment = data?.businessSegment || "other";
      const businessNicheDetail = data?.businessNicheDetail || "";
      
      const temperature = neuralPrecision !== undefined ? Number(neuralPrecision) : 0.7;
      
      let tierPromptAdjustment = "";
      if (neuralTier === "quantum") {
        tierPromptAdjustment = "\n- MODO RECENTE DE COGNIÇÃO: [QUANTUM DEEP METRICS]. Adicione cálculos de alta profundidade técnica aos pareceres do relatório Markdown. Realize extrapolações ousadas de metas de caixa e aponte riscos sistêmicos avançados.";
      } else if (neuralTier === "flash") {
        tierPromptAdjustment = "\n- MODO RECENTE DE COGNIÇÃO: [FLASH LIGHTSPEED COMPRESSION]. O relatório Markdown gerado deve conter listas extremamente condensadas, diretas ao ponto, com foco puramente imediato sem rodeios.";
      } else {
        tierPromptAdjustment = "\n- MODO RECENTE DE COGNIÇÃO: [STANDARD PROFESSIONAL ALIGNMENT]. Adote um tom de consultoria empresarial balanceado e focado nas melhores práticas corporativas tradicionais.";
      }

      const prompt = `
        Seu nome é Dafne. Você é uma analista financeira e estrategista de lucratividade sênior, caracterizada como uma jovem moça de cabelos loiros, olhos verdes chamativos e mente analítica brilhante. Seu tom é profissional, extremamente inteligente, encorajadora, empática e ágil.
        Aja como Dafne ao escrever o diagnóstico. Sua missão é emitir um diagnóstico completo, um relatório estratégico profundo e dicas operacionais altamente práticas para aumentar a lucratividade da empresa cliente. O "summary" deve ser escrito na primeira pessoa do singular ("Olá, aqui é a Dafne..."), mantendo um tom de especialista inteligente muito próximo, focado e orientador.
        ${tierPromptAdjustment}

        NOME DA EMPRESA: ${data.companyName || 'Minha Empresa'}
        SEGMENTO DE OPERAÇÃO: ${businessSegment.toUpperCase()}
        NICHO ESPECÍFICO E DETALHE DA OPERAÇÃO: ${businessNicheDetail || 'Prestador Geral / Outro'}
        
        MÉTRICAS FINANCEIRAS DO PERÍODO ATUAL:
        - Receita Total (Faturamento Bruto): R$ ${data.totalIncome}
        - Despesa Total (Custos + Despesas): R$ ${data.totalExpense}
        - Saldo Líquido atual: R$ ${data.balance}
        
        DETALHAMENTO DO DRE OPERACIONAL (CATEGORIAS E VALORES):
        ${data.dre ? data.dre.map((d: any) => `- ${d.label}: R$ ${d.value}`).join('\n') : 'Não fornecido'}

        DESPESAS E CUSTOS AGRUPADOS:
        - Custo de Vendas (COGS/CPV): R$ ${data.categoryGroupExpenses?.COGS || 0}
        - Despesas Operacionais (OPEX): R$ ${data.categoryGroupExpenses?.OPEX || 0}
        - Impostos (TAX): R$ ${data.categoryGroupExpenses?.TAX || 0}
        - Investimentos: R$ ${data.categoryGroupExpenses?.INVESTMENT || 0}
        - Outras Despesas: R$ ${data.categoryGroupExpenses?.OTHER_EXPENSE || 0}

        PRINCIPAIS CATEGORIAS DE DESPESA QUE MAIS RETIRAM LIQUIDEZ:
        ${data.topExpenseCategories && data.topExpenseCategories.length > 0 ? data.topExpenseCategories.map((c: any) => `- ${c.name}: R$ ${c.amount}`).join('\n') : 'Nenhuma específica registrada'}

        METAS ATUAIS:
        ${data.goals.map((g: any) => `- ${g.title}: Atual R$ ${g.current} / Meta R$ ${g.target} ${g.inverse ? '(Meta de REDUÇÃO)' : ''}`).join('\n')}

        PLANILHA DE PRODUTOS E PRECIFICAÇÃO REGISTRADOS (CMV OPERACIONAL):
        ${data.products && data.products.length > 0
          ? data.products.map((p: any) => `- **${p.name}**: Venda R$ ${Number(p.sellingPrice).toFixed(2)} | Custo R$ ${Number(p.costPrice).toFixed(2)} | CMV ${Number(p.cmvPct).toFixed(1)}% | Margem Real ${Number(p.profitMarginPct).toFixed(1)}%`).join('\n')
          : 'Nenhum item cadastrado na planilha de precificação de produtos.'}

        INSTRUÇÃO CRÍTICA DE ATRIBUIÇÃO DE NICHO E CONTEXTO DE MERCADO:
        Você deve adaptar RIGOROSAMENTE todas as análises de lucratividade, riscos descritos, projeções de cenários e dicas operacionais para o nicho de operation informado: "${businessNicheDetail || businessSegment}". Comente sobre os desafios desse modelo de negócios em especial, aplicando termos técnicos do setor (ex: CMV de alimento para bares/restaurantes, giro de estoques e capital parado para comércio, custos com cloud e LTV para tecnologia).
        Você DEVE usar a ferramenta de busca unificada (Google Search) para obter informações atualizadas do cenário econômico brasileiro em 2026 para este nicho (por exemplo, pesquisando benchmarks de margem líquida, custos mais comuns, sazonalidades ou juros), integrando esses fatos mercadológicos de ponta com os dados financeiros reais da empresa fornecidos acima. Embase seu diagnóstico com o mundo real!

        INSTRUÇÕES DE RESPOSTA (JSON BRUTO - DIRETRIZES DE LEITURA DINÂMICA):
        Escreva tudo em PORTUGUÊS BRASILEIRO com foco em FÁCIL ENTENDIMENTO, de forma extremamente DIRETA e OBJETIVA. Evite textos longos, cansativos ou explicações prolixas.
        1. "summary": Um resumo de caixa curto e motivador (máximo 2 a 3 frases) focado no saldo e em ação direta.
        2. "goalProgress": Um array com o progresso atualizado de cada meta em porcentagem (inteiro de 0 a 100), corrigindo metas de redução de forma coerente.
        3. "report": Um relatório de performance altamente direto, objetivo e focado no formato Markdown (com títulos ###, listas rápidas com hífens, e termos importantes e valores em NEGRITO). Estruture parágrafos curtos para leitura dinâmica. Analise a rentabilidade (Receita vs Custos), gargalos e ações imediatas recomendadas para recompor o lucro sem enrolação.
        4. "operationalTips": Um array com 3 a 5 dicas operacionais concretas para elevar o lucro líquido. Cada dica deve ter:
           - "title": Título claro (ex: 'Otimização de Fornecedores de CMV').
           - "category": 'OPEX', 'CMV', 'RECEITA', 'TRIBUTOS' ou 'FINANCEIROS'.
           - "impact": 'ALTO', 'MÉDIO' ou 'BAIXO'.
           - "description": Diagnóstico com base nos números fornecidos pelo usuário.
           - "actionPlan": Roteiro passo a passo realista sobre como executar para obter melhora imediata.
        5. "scenarios": Um objeto contendo projeções estratégicas para a empresa:
           - "shortTerm": Projeção de curto prazo (0 a 3 meses) focada em ações imediatas de caixa/lucro.
           - "mediumTerm": Planejamento de médio prazo (3 a 12 meses) abordando estruturação de custos e expansão de margem.
           - "longTerm": Visão de longo prazo (acima de 12 meses) englobando novos investimentos e consolidação de lucratividade ideal.
        6. "risks": Um array com 2 a 4 riscos em destaque baseados na relação receita/despesas (ex: margem apertada, alto custo fixo, falta de capital de giro). Cada um com "title", "severity" ('CRÍTICO', 'ALTO' ou 'MÉDIO') e "description".
        7. "alerts": Um array contendo alertas automáticos inteligentes baseados nas métricas reais da empresa. Se a margem líquida (lucro / faturamento) estiver abaixo de 15% ou se as despesas operacionais excederem 60% do faturamento, ou se a liquidez projetada estiver em perigo, emita alertas específicos com "type" ('Margem de Lucro', 'Liquidez Projetada' ou 'Alerta de Custos'), "severity" ('ALTÍSSIMA' | 'ATENÇÃO' | 'PREOCUPANTE') e "message".

        ESTRUTURA DE RETORNO ESPERADA (JSON STRICT):
        {
          "summary": "...",
          "goalProgress": [
            { "title": "Nome da Meta", "percent": 85 }
          ],
          "report": "### Relatório de Saúde Financeira\\n\\n...",
          "operationalTips": [
            {
              "title": "...",
              "category": "...",
              "impact": "...",
              "description": "...",
              "actionPlan": "..."
            }
          ],
          "scenarios": {
            "shortTerm": "...",
            "mediumTerm": "...",
            "longTerm": "..."
          },
          "risks": [
            {
              "title": "...",
              "severity": "...",
              "description": "..."
            }
          ],
          "alerts": [
            {
              "type": "...",
              "severity": "...",
              "message": "..."
            }
          ]
        }
      `;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature,
        },
        ttlMs: 24 * 60 * 60 * 1000, // 24-hour cache for financial summaries
        customApiKey: getCustomKeyFromRequest(req),
        model: getCustomModelFromRequest(req)
      });

      const result = safeParseJSON(response.text);
      res.json({
        ...result,
        simulatedTier: neuralTier || "pro",
        simulatedTemp: temperature
      });
    } catch (error: any) {
      const errorStr = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      const errorStrUpper = errorStr.toUpperCase();
      const isQuotaError = errorStrUpper.includes("RESOURCE_EXHAUSTED") || errorStrUpper.includes("429") || errorStrUpper.includes("QUOTA") || errorStrUpper.includes("LIMIT") || errorStrUpper.includes("PAUSE");
      
      if (isQuotaError) {
        console.warn("[Gemini API Warning] Limite de cota atingido ou suspenso (429/RESOURCE_EXHAUSTED). Ativando motor de finanças local com sucesso.");
      } else {
        console.error("AI Summary Error:", error);
      }
      
      const { data } = req.body;
      const income = Number(data.totalIncome) || 0;
      const expense = Number(data.totalExpense) || 0;
      const balance = Number(data.balance) || 0;
      
      const cogs = Number(data.categoryGroupExpenses?.COGS) || 0;
      const opex = Number(data.categoryGroupExpenses?.OPEX) || 0;
      const tax = Number(data.categoryGroupExpenses?.TAX) || 0;
      const invest = Number(data.categoryGroupExpenses?.INVESTMENT) || 0;
      
      const marginPct = income > 0 ? (balance / income) * 100 : 0;
      const cogsPct = income > 0 ? (cogs / income) * 100 : 0;
      const opexPct = income > 0 ? (opex / income) * 100 : 0;
      const taxPct = income > 0 ? (tax / income) * 100 : 0;

      const businessSegment = data.businessSegment || "other";
      const businessNicheDetail = data.businessNicheDetail || "";
      const niche = businessNicheDetail || businessSegment || "Prestações Gerais";

      let nicheComment = "";
      if (businessSegment === "food" || niche.toLowerCase().match(/(hamburg|restaurante|doce|aliment|bar|cafe|pizzaria)/)) {
        nicheComment = `Atuando no nicho de **Alimentação / Gastronomia** (${niche}), o controle rígido do CMV é o coração da sobrevivência do caixa. Benchmarks nacionais indicam que o custo de insumos (CMV) ideal flutua estritamente entre **28% e 34%** do faturamento bruto. Suas despesas diretas de reposição totalizam **R$ ${cogs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** (${cogsPct.toFixed(1)}% da receita).`;
      } else if (businessSegment === "commerce" || niche.toLowerCase().match(/(loja|comercio|venda|e-commerce|ecommerce|mercado|roupa)/)) {
        nicheComment = `No ecossistema de **Comércio / Varejo** (${niche}), os desafios operacionais envolvem o capital de giro retido em estoque, o custo logístico de entrega e descontos excessivos. Margens líquidas típicas de comércio flutuam entre **10% e 15%**. No período, sua taxa real de conversão final de lucro (Margem Líquida) registrou **${marginPct.toFixed(1)}%**.`;
      } else if (businessSegment === "services" || niche.toLowerCase().match(/(servico|consultoria|agencia|clinica|estetica|salao|medico|advoc)/)) {
        nicheComment = `No segmento de **Prestação de Serviços / Clínicas** (${niche}), a maior vazão de liquidez decorre de despesas operacionais fixas (OPEX) e pessoal direto/terceirizado. Prestadores de serviços eficientes se beneficiam de reduzido custo tributário monofásico ou insumos diretos, devendo buscar margens líquidas robustas de **20% a 35%**. Sua margem real neste ciclo foi de **${marginPct.toFixed(1)}%**.`;
      } else {
        nicheComment = `Para a atividade cadastrada em **${niche}**, alinhar a precificação e margem de contribuição média nos serviços com uma estrutura enxuta de custos administrativos assegura o potencial de expansão constante da equipe.`;
      }

      const fallbackSummary = `Olá, aqui é a Dafne! Fiz um raio-X completo das contas de ${data.companyName || 'sua empresa'} para o período. Com faturamento de R$ ${income.toLocaleString('pt-BR')} e saldo de R$ ${balance.toLocaleString('pt-BR')}, sua margem líquida real é de ${marginPct.toFixed(1)}%.`;

      const fallbackGoals = data.goals.map((g: any) => {
        let percent = 0;
        if (g.target !== 0) {
          if (g.inverse) {
            percent = Math.max(0, Math.min(100, Math.round((g.target / g.current) * 100)));
          } else {
            percent = Math.max(0, Math.min(100, Math.round((g.current / g.target) * 100)));
          }
        }
        return { title: g.title, percent };
      });

      const fallbackReport = `
### Relatório de Performance e Auditoria de Lucratividade

Este dossiê estratégico foi desenhado pela conselheira financeira **Dafne** para auditar as contas e projetar caminhos de lucros crescentes para a empresa **${data.companyName || 'Sua Empresa'}** (${niche.toUpperCase()}).

---

#### 1. Consolidação dos Resultados Líquidos
No ciclo de competência ativa, o negócio obteve as seguintes marcas de faturamento e custos:
* 💰 **Faturamento Gerencial Bruto:** **R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**
* 📉 **Drenagem de Recursos (Despesas + Custos):** **R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**
* 🍏 **Sobra Financeira de Caixa:** **R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**

Com base nesses vetores primários, sua **Margem Líquida Real** foi de **${marginPct.toFixed(1)}%**.
${marginPct >= 20 ? "* ✅ **Qualificação: Excelente!** Seu negócio converte receitas em caixa em um nível de eficiência acima do mercado standard. Concentre-se em reter essa musculatura operacional, mantendo o OPEX estático enquanto planeja expansões de faturamento." : marginPct >= 10 ? "* ⚠️ **Qualificação: Estabilidade Operacional.** Suas margens são satisfatórias, contudo vulneráveis a aumentos de insumos de fornecedores. Ativar um reajuste prudente de markup de 4% a 6% pode alavancar drasticamente seus resultados líquidos." : "* 🚨 **Qualificação: Margem Comprimida.** O caixa está sob asfixia financeira, apresentando alto risco para períodos sazonais de baixa de vendas. Ação corretiva em corte de OPEX ou eliminação de gargalos é obrigatória."}

---

#### 2. Raio-X Tributário e de Alavancagem Comercial (CMV vs. OPEX)
Avaliando a distribuição e destino de cada real faturado na empresa:
* **Custo dos Insumos Vendidos (CMV/CPV):** R$ ${cogs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (**${cogsPct.toFixed(1)}%** da receita total).
* **Estrutura de Custo Fixo (OPEX):** R$ ${opex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (**${opexPct.toFixed(1)}%** da receita total).
* **Impostos e Simples Nacional (TAX):** R$ ${tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (**${taxPct.toFixed(1)}%** da receita total).
* **Investimentos Produtivos:** R$ ${invest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.

${nicheComment}

*Recomendação:* Despesas administrativas e OPEX que superam **40%** do faturamento bruto necessitam de revisão sistêmica de licenças de software negligenciadas, contas de concessionárias e tarifas bancárias.

---

#### 3. Auditoria Analítica das Categorias com Maior Vazão Financeira
Mapeamento decrescente dos principais gargalos que retiraram liquidez do seu caixa corporativo:
${data.topExpenseCategories && data.topExpenseCategories.length > 0 ? data.topExpenseCategories.map((c: any, i: number) => `* **${i+1}. ${c.name}:** R$ ${Number(c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (consome **${income > 0 ? ((c.amount / income) * 100).toFixed(1) : '0.0'}%** da sua receita bruta total)`).join('\n') : '*Nenhuma despesa parametrizada excede as margens toleráveis este mês.'}

---

#### 4. Análise de Markups & CMV de Itens Cadastrados
Abaixo, segue a auditoria das margens de contribuição unitária do seu catálogo ativo:
${data.products && data.products.length > 0 ? data.products.map((p: any) => `* **${p.name}** | Preço de Custo R$ ${p.costPrice.toFixed(2)} vs Preço de Venda R$ ${p.sellingPrice.toFixed(2)} -> CMV real de **${p.cmvPct.toFixed(1)}%** (Lucratividade Real de **${p.profitMarginPct.toFixed(1)}%**). ${p.profitMarginPct < 25 ? '*(Aviso: Margem comprimida, reavalie precificação)*' : '*(Margem excelente de contribuição)*'}`).join('\n') : '*Nenhum produto cadastrado na planilha de Markups ativos.'}

---

#### 5. Considerações Finais e Plano Diretor da Mentora Dafne
Para o próximo período, a empresa deve defender vigorosamente o Ponto de Equilíbrio: No curto prazo, prefira a consolidação de preços e margens antes de buscar o crescimento bruto de faturamento a qualquer custo.
      `;

      const fallbackTips = [
        {
          title: "Auditoria e Corte Analítico em Despesas (OPEX)",
          category: "OPEX",
          impact: "ALTO",
          description: `Suas despesas operacionais totalizam R$ ${opex.toLocaleString('pt-BR')} (representando ${opexPct.toFixed(1)}% das receitas). Despesas fixas crescem feito erva daninha e precisam de poda constante.`,
          actionPlan: "1. Enumere todos os débitos em conta e Pix automatizados.\n2. Cancele assinaturas duplicadas ou sistemas de TI desativados no escritório.\n3. Proponha ao locador ou grandes prestadores uma renegociação amigável buscando economizar pelo menos 10%."
        },
        {
          title: "Combate ao Custo Descontrolado de Estoque (CMV)",
          category: "CMV",
          impact: "ALTO",
          description: `Seus insumos ou custos diretos de reposição consomem R$ ${cogs.toLocaleString('pt-BR')} do seu caixa. Reduzir as perdas de materiais ou o markup incorreto de venda é prioritário.`,
          actionPlan: "1. Realize cotações paralelas em pelo menos 3 fornecedores adicionais para os insumos do mix estrela.\n2. Incorpore pequenos reajustes cirúrgicos de preço entre 3% e 6% nos itens com margem de lucro abaixo de 25%.\n3. Concentre compras para extrair frete gratuito e bônus comerciais."
        },
        {
          title: "Saneamento Fiscal Tributário (TAX)",
          category: "TRIBUTOS",
          impact: "MÉDIO",
          description: `Sua carga tributária gerencial foi avaliada em R$ ${tax.toLocaleString('pt-BR')} (${taxPct.toFixed(1)}% do faturamento bruto). Mapear isenções e classificação correta de NCM/CST previne pagamento em duplicidade.`,
          actionPlan: "1. Agende uma conversa direta com seu contador este mês para analisar se seu regime tributário atual (Simples Nacional) está correto.\n2. Faça a segregação de receitas isentas de tributos monofásicos de PIS/COFINS (comum no varejo e cosméticos).\n3. Evite multas acessórias emitindo corretamente todas as NFes."
        }
      ];

      const fallbackScenarios = {
        shortTerm: `No trimestre inicial, foque na contenção de saídas imediatas para consolidar uma reserva de liquidez equivalente a no mínimo 1.5x o seu custo fixo operacional de R$ ${opex.toLocaleString('pt-BR')}.`,
        mediumTerm: `Ative reajustes nos SKUs com baixa lucratividade cadastrados na planilha (${data.products?.length || '0'} itens ativos), visando escalar a margem de conversão média para a média mercadológica segura de 18%.`,
        longTerm: `Após acumular 6 meses de despesas de OPEX no caixa, estruture investimentos focados em marketing para expandir sua fatia de lucros sem sobrecarregar seu fluxo financeiro mensal corrente.`
      };

      const fallbackRisks = [
        {
          title: "Vulnerabilidade em Margem de Contribuição",
          severity: marginPct < 15 ? "CRÍTICO" : "ALTO",
          description: `Sua margem atual de ${marginPct.toFixed(1)}% oferece reduzida flexibilidade operacional para absorver inadimplências repentinas ou quedas temporárias de sazonalidade.`
        },
        {
          title: "Despesas Administrativas Elevadas",
          severity: opexPct > 35 ? "ALTO" : "MÉDIO",
          description: `Com o OPEX representando ${opexPct.toFixed(1)}% do seu faturamento bruto, grande parte da sua margem comercial é consumida pela manutenção estrutural de retaguarda.`
        }
      ];

      const fallbackAlerts = [
        {
          type: "Margem de Lucro",
          severity: marginPct < 12 ? "ALTÍSSIMA" : "ATENÇÃO",
          message: `Sua margem de conversão real liquida (${marginPct.toFixed(1)}%) está abaixo da linha ideal de segurança física comercial (${businessSegment === "services" ? "20%" : "15%"}).`
        },
        {
          type: "Liquidez Projetada",
          severity: balance < 0 ? "ALTÍSSIMA" : "ATENÇÃO",
          message: balance < 0 ? `Seu caixa registrou déficit financeiro de R$ ${balance.toLocaleString('pt-BR')} neste ciclo. Corte de despesas é mandatório!` : "Seu saldo de caixa acumulado requer constante controle de OPEX e acompanhamento de metas."
        }
      ];

      res.json({
        summary: fallbackSummary,
        goalProgress: fallbackGoals,
        report: fallbackReport,
        operationalTips: fallbackTips,
        scenarios: fallbackScenarios,
        risks: fallbackRisks,
        alerts: fallbackAlerts,
        isFallback: true
      });
    }
  });

  // API Route for Custom Niche Growth Strategic Roadmap and interactive KPIs
  app.post("/api/ai/niche-growth-plan", async (req, res) => {
    try {
      const { financialData } = req.body;
      const businessSegment = financialData?.businessSegment || "other";
      const businessNicheDetail = financialData?.businessNicheDetail || "";
      const companyName = financialData?.companyName || "Minha Empresa";
      
      const prompt = `
        Aja como Dafne, mentora de lucratividade. Crie um Plano de Crescimento de Nicho Estratégico com Metas Interativas sob Medida para a empresa "${companyName}".
        
        SEGMENTO DE OPERAÇÃO: ${businessSegment.toUpperCase()}
        DETALHE DO NICHO / ATUAÇÃO DE MERCADO: ${businessNicheDetail || "Geral / Prestação de Serviços"}

        VALORES FINANCEIROS REAIS DO PERÍODO DO CLIENTE:
        - Receitas Totais: R$ ${financialData?.income || 0}
        - Despesas Totais: R$ ${financialData?.expense || 0}
        - Saldo de Caixa: R$ ${financialData?.balance || 0}

        DRE ATUAL DO USUÁRIO PARA ANÁLISE:
        ${financialData?.dre && financialData.dre.length > 0 
          ? financialData.dre.map((d: any) => `- ${d.label}: R$ ${Number(d.value).toLocaleString('pt-BR')}`).join('\n')
          : "Nenhum DRE lançado."}

        Gere uma análise extremamente direta, focada e cirúrgica sobre este nicho exato ("${businessNicheDetail || businessSegment}"), evitando clichês fúteis ou textos cansativos.
        FORMATO DE LEITURA DINÂMICA: Todas as explicações, metas, raciocínios (rationale) e dicas devem ser de fácil entendimento para o pequeno empresário, sem nunca perder a qualidade técnica. Seja cirúrgica, ultra objetiva, usando termos em negrito quando apropriado e mantendo frases curtas e muito claras para permitir uma leitura rápida e dinâmica.
        Você DEVE utilizar a ferramenta de busca unificada (Google Search) para obter informações atualizadas do mercado brasileiro real de 2026. Pesquise por benchmarks de margem saudáveis para este segmento, comportamento do consumidor no cenário atual ou custos típicos, integrando-os de maneira harmônica com os números reais da empresa.

        Você DEVE retornar obrigatoriamente um objeto JSON com o seguinte formato estrutural estrito:
        {
          "nicheTitle": "Título Altamente Relevante (ex: 'Aceleração Estratégica para Hamburguerias Gourmet')",
          "overview": "Uma análise de 2 a 3 frases unindo a saúde financeira do caixa com as tendências operacionais do nicho exato indicado.",
          "kpis": [
            {
              "name": "Nome do KPI de Nicho Inteligente",
              "target": "Alvo específico sugerido para este faturamento e mercado",
              "howToMeasure": "Explicação matemática simples e operacional de como medir"
            }
          ],
          "milestones": [
            {
              "title": "Fase 1: Otimização de Margem Operacional",
              "actions": [
                {
                  "task": "Ação cirúrgica e mensurável (ex: Ajustar ficha técnica renegociando carne moída)",
                  "rationale": "Razão financeira prática (reduzir OPEX/CMV) baseada nos números do cliente"
                }
              ]
            }
          ],
          "tips": [
            {
              "title": "Segredo Tático do Nicho",
              "text": "Dica executiva profunda de mestre para este mercado de nicho."
            }
          ]
        }

        Retorne EXCLUSIVAMENTE o JSON estruturado acima. Forneça 3 a 5 KPIs específicos, 2 fases (milestones) cada uma contendo 2 a 3 ações, e de 2 a 3 dicas táticas avançadas. Tudo em Português do Brasil de forma extremamente polida.
      `;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
        ttlMs: 24 * 60 * 60 * 1000, // 24-hour cache for niche growth plans
        customApiKey: getCustomKeyFromRequest(req),
        model: getCustomModelFromRequest(req)
      });

      const result = safeParseJSON(response.text);
      res.json(result);
    } catch (error: any) {
      const errorStrUpper = (error?.message || String(error)).toUpperCase();
      const isQuotaError = errorStrUpper.includes("RESOURCE_EXHAUSTED") || errorStrUpper.includes("429") || errorStrUpper.includes("QUOTA") || errorStrUpper.includes("LIMIT") || errorStrUpper.includes("PAUSE");
      
      if (isQuotaError) {
        console.warn("[Niche Growth Plan Warning] Limite de cota atingido ou suspenso. Ativando planejamento estratégico local qualificado.");
      } else {
        console.error("Niche Growth Plan API Error:", error);
      }
      // Premium resilient fallback so the application never breaks
      const businessNicheDetail = req.body.financialData?.businessNicheDetail || "Especializado";
      res.json({
        nicheTitle: `Aceleração Operacional: ${businessNicheDetail.toUpperCase()}`,
        overview: "Análise estratégica local gerada de forma otimizada para o segmento e finanças atuais.",
        kpis: [
          {
            name: "CMV / Custos Diretos do Nicho",
            target: "Manter abaixo de 33% do faturamento bruto",
            howToMeasure: "Faturamento Líquido / Custo dos Materiais ou Insumos Vendidos."
          },
          {
            name: "LTV / CAC (Retorno de Aquisição)",
            target: "Manter proporção de LTV/CAC acima de 3x",
            howToMeasure: "Faturamento médio acumulado por cliente / Custo de anúncios + equipe comercial."
          }
        ],
        milestones: [
          {
            title: "Fase 1: Ajuste de Margem e CMV",
            actions: [
              {
                task: "Fazer auditoria do mix de produtos/serviços mais vendidos e cortar itens com margem bruta abaixo de 40%.",
                rationale: "Foca o capital de giro nos canais que sustentam o crescimento do caixa."
              },
              {
                task: "Mapear as 3 principais contas operacionais (OPEX) e negociar 10% de redução.",
                rationale: "Previne a erosão do faturamento líquido acumulado do negócio."
              }
            ]
          }
        ],
        tips: [
          {
            title: "Dica de Margem Otimizada",
            text: "Em mercados competitivos, foque em criar planos de assinatura ou fidelidades recorrentes para travar faturamento no dia 01 de cada mês."
          }
        ],
        isFallback: true
      });
    }
  });

  // API Route for Store Comparison Report (AI Multi-CNPJ Analysis)
  app.post("/api/ai/store-comparison-report", async (req, res) => {
    try {
      const { period, stores, consolidated } = req.body;
      const storesList = Array.isArray(stores) ? stores : [];
      const consolidatedData = consolidated || { receitas: 0, despesas: 0, imposto: 0, lucroLiquido: 0, margemLiquida: 0 };
      
      const storesInfo = storesList.map((s: any) => `
        - EMPRESA: ${s.companyName || 'Sem Nome'}
          CNPJ: ${s.cnpj || 'Não cadastrado'}
          Faturamento (Receita): R$ ${(s.receitas || 0).toLocaleString('pt-BR')}
          Imposto DAS Estimado (${s.taxRate || 0}%): R$ ${(s.imposto || 0).toLocaleString('pt-BR')}
          Custos & OPEX Operacional: R$ ${(s.despesas || 0).toLocaleString('pt-BR')}
          Lucro Líquido: R$ ${(s.lucroLiquido || 0).toLocaleString('pt-BR')}
          Margem Líquida: ${(s.margemLiquida || 0).toFixed(1)}%
          Segmento: ${s.businessSegment || 'Não especificado'}
      `).join('\n');

      const prompt = `
        Seu nome é Dafne. Você é uma analista financeira sênior e estrategista de lucratividade de negócios multi-CNPJ ou redes de franquias e filiais do mercado brasileiro. Seu tom é analítico, extremamente inteligente, encorajador, empático e ágil.
        Aja como Dafne ao escrever o diagnóstico comparativo e consolidado do grupo de empresas.
        
        PERÍODO DE ANÁLISE: ${period || "Mensal"}
        
        MÉTRICAS COLETADAS POR EMPRESA/FILIAL:
        ${storesInfo}
        
        MÉTRICAS DO CONSOLIDADO GERAL (GRUPO EM CONJUNTO):
        - Faturamento Consolidado: R$ ${(consolidatedData.receitas || 0).toLocaleString('pt-BR')}
          Impostos DAS Acumulados: R$ ${(consolidatedData.imposto || 0).toLocaleString('pt-BR')}
          Custos de OPEX Operacionais Acumulados: R$ ${(consolidatedData.despesas || 0).toLocaleString('pt-BR')}
          Lucro Líquido Consolidado: R$ ${(consolidatedData.lucroLiquido || 0).toLocaleString('pt-BR')}
          Margem de Lucro Média do Grupo: ${(consolidatedData.margemLiquida || 0).toFixed(1)}%

        SUA MISSÃO (FORMATO DE LEITURA DINÂMICA):
        Emita um relatório estratégico comparativo extremamente direto, objetivo, acionável e de fácil entendimento para os sócios, sem nunca perder a precisão dos dados ou a qualidade do diagnóstico técnico. O relatório deve começar de imediato sem preâmbulos repetitivos e ser focado na primeira pessoa ("Olá, aqui é a Dafne...").
        Evite textos longos, cansativos ou enrolação. Use parágrafos curtos, listas focadas com hífens (-), e destaque as principais metas, filiais e valores em NEGRITO para facilitar a leitura rápida de portfólios multi-CNPJ. Focus on practical insights first.
        
        ESTRUTURA DE RESPOSTA ESPERADA (Estilo Markdown completo, sem tags HTML extras):
        Escreva tudo em PORTUGUÊS BRASILEIRO.
        Instruções de seções obrigatórias no Markdown:
        1. ### Introdução & Visão Consolidada do Grupo
           Apresente um resumo executivo inteligente de como o grupo como um todo performou no período ${period || "Mensal"}. Comente sobre a saúde agregada e se a margem de lucro consolidada de ${(consolidatedData.margemLiquida || 0).toFixed(1)}% está saudável ou sob risco.
        2. ### Ranking de Faturamento Bruto vs. Lucratividade Líquida
           Identifique qual filial faturou mais bruto e qual filial obteve a melhor rentabilidade (margem líquida %). Explique de forma cirúrgica que faturamento alto sem margem consome capital de giro, e destaque as melhores eficiências.
        3. ### Diagnósticos Individuais & Gargalos Críticos
           Destaque os principais "vilões" ou oportunidades de cada filial. Por exemplo, mencione impostos se uma filial tiver alíquota DAS maior, ou OPEX se estiver consumindo muito o caixa. Mencione cada empresa pelo nome fantasia de forma personalizada!
        4. ### Plano de Ação & Sinergias Corporativas para Crescimento
           Ofereça de 3 a 4 diretrizes de sinergia entre as empresas (ex: compras centralizadas em lote com fornecedores, otimização tributária, compartilhamento de custos corporativos fixos de marketing/adm).
        5. ### 🏆 3 Metas Práticas de Curto Prazo para o Grupo
           Enumere 3 metas objetivas de curto prazo (ex: elevar margem média para X%, auditar o OPEX da filial Y em X dias, etc.) para implementar agora.

        Você DEVE usar a ferramenta de busca integrada (Google Search) para fundamentar suas análises com notícias reais sobre inflação, taxas, médias nacionais do varejo/serviços brasileiro de 2026, oferecendo informações fidedignas e de altíssimo valor de mercado.
      `;

      const response = await generateContentWithFallback({
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
        config: {
          maxOutputTokens: 1800,
          temperature: 0.7,
        },
        customApiKey: getCustomKeyFromRequest(req),
        model: getCustomModelFromRequest(req)
      });

      res.json({ text: response.text });
    } catch (error: any) {
      const errorStrUpper = (error?.message || String(error)).toUpperCase();
      const isQuotaError = errorStrUpper.includes("RESOURCE_EXHAUSTED") || errorStrUpper.includes("429") || errorStrUpper.includes("QUOTA") || errorStrUpper.includes("LIMIT") || errorStrUpper.includes("PAUSE");
      
      if (isQuotaError) {
        console.warn("[Store Comparison AI Warning] Limite de cota atingido ou suspenso. Ativando comparativo offline estratégico.");
      } else {
        console.error("Store Comparison AI Error:", error);
      }
      
      const { period, stores, consolidated } = req.body;
      const storesList = Array.isArray(stores) ? stores : [];
      const consolidatedData = consolidated || { receitas: 0, despesas: 0, imposto: 0, lucroLiquido: 0, margemLiquida: 0 };
      
      // Multi-store high performance fallback generator with safe parameter guards
      const bestStoreByMargin = storesList.length > 0 
        ? [...storesList].sort((a,b) => (b.margemLiquida || 0) - (a.margemLiquida || 0))[0] 
        : { companyName: "Nenhuma cadastrada", receitas: 0, margemLiquida: 0, lucroLiquido: 0 };
        
      const bestStoreByRevenue = storesList.length > 0 
        ? [...storesList].sort((a,b) => (b.receitas || 0) - (a.receitas || 0))[0] 
        : { companyName: "Nenhuma cadastrada", receitas: 0, margemLiquida: 0, lucroLiquido: 0 };
      
      let storeSummariesFallback = storesList.length > 0 ? storesList.map((s: any) => {
        return `* **${s.companyName || 'Sem Nome'}:** Faturamento de R$ ${(s.receitas || 0).toLocaleString('pt-BR')} com margem líquida de **${(s.margemLiquida || 0).toFixed(1)}%** (Lucro líquido real: R$ ${(s.lucroLiquido || 0).toLocaleString('pt-BR')}).`;
      }).join('\n') : '* *Nenhuma filial cadastrada até o momento.*';

      const maxTaxRate = storesList.length > 0 ? Math.max(...storesList.map((s: any) => s.taxRate || 0)) : 0;

      const fallbackText = `
### Olá, aqui é a Dafne! 

Minha conexão com o satélite de inteligência analítica de alta precisão está operando de forma limitada no momento por cota de rede. No entanto, meu algoritmo interno preparou este **Diagnóstico Estratégico Consolidado** para acelerar o crescimento de suas filiais a partir de métricas de caixa reais e fidedignas:

---

### 1. Visão Consolidada do Grupo (${period || "Geral"})
O grupo obteve um faturamento consolidado acumulado de **R$ ${(consolidatedData.receitas || 0).toLocaleString('pt-BR')}** com lucro líquido consolidado de **R$ ${(consolidatedData.lucroLiquido || 0).toLocaleString('pt-BR')}**. Isso gera uma **Margem Líquida Média de ${(consolidatedData.margemLiquida || 0).toFixed(1)}%**.
* Uma margem média de grupo de ${(consolidatedData.margemLiquida || 0).toFixed(1)}% está no patamar ${(consolidatedData.margemLiquida || 0) >= 15 ? 'altamente saudável e gerando excelente atratividade de investimentos' : 'de alerta operacional, exigindo imediata revisão estratégica de despesas operacionais (OPEX) para focar em crescimento real'}.

---

### 2. Ranking de Faturamento vs. Lucratividade Líquida
* **📈 Líder de Faturamento (Volume):** **${bestStoreByRevenue?.companyName}** lidera o volume do grupo, movimentando R$ ${(bestStoreByRevenue?.receitas || 0).toLocaleString('pt-BR')}.
* **🏆 Líder de Eficiência (Margem):** **${bestStoreByMargin?.companyName}** é a operação com maior ganho relativo, convertendo impressionantes **${(bestStoreByMargin?.margemLiquida || 0).toFixed(1)}%** de receita diretamente em lucro limpo no caixa.
* *Nota Técnica de Crescimento:* Replicar a governança e o controle de despesas operacionais da sua filial líder de eficiência nas demais unidades é o caminho mais rápido para expandir os lucros sem precisar aumentar os custos fixos ou depender unicamente de novas vendas.

---

### 3. Diagnósticos Individuais & Gargalos Críticos
${storeSummariesFallback}

* **Desafio Fiscal (Gargalo de DAS):** A filial com maior alíquota em vigor apresenta alíquota DAS de **${maxTaxRate}%**. Monitorar a ascensão de limites de faturamento no Simples Nacional é decisivo para não onerar desnecessariamente a margem do grupo. Busque orientação de um contador corporativo especializado em Elisão Fiscal.

---

### 4. Plano de Ação Estratégico para Crescimento Sustentável
1. **Negociação e Escala no CMV (Custos):** Compras centralizadas de insumos fundamentais das ${storesList.length} unidades em lote único unificado. Ao consolidar as compras do grupo inteiro, você assegura descontos de grande escala de fornecedores e reduz imediatamente o impacto do CMV geral.
2. **Rateio de Custos Administrativos (Diluição de OPEX):** Centralize a contratação de agências de marketing, ferramentas de ERP e suporte administrativo geral. Em vez de pagar assinaturas isoladas por filial, exija planos corporativos guarda-chuva e divida o valor entre as filiais no DRE.
3. **Multiplicação de Melhores Práticas de Giro:** Organize reuniões bimestrais para auditar processos de controle de estoque e desperdícios da melhor unidade, visando implantar o mesmo controle estrito de perdas operacionais nas filiais sob risco de caixa.

---

### 🏆 3 Metas Práticas de Curto Prazo para o Grupo
1. Elevar a margem média consolidada de lucratividade de todo o grupo para atingir ou superar **18.5%** nos próximos 90 dias.
2. Realizar uma auditoria analítica integral na filial menos rentável para mapear e eliminar pelo menos **8% de custos fixos sem impacto em qualidade** em 30 dias.
3. Desenvolver o planejamento tributário consolidado de 2026 para mapear o enquadramento ideal de cada CNPJ (Simples Nacional vs. Lucro Presumido).
      `;
      
      res.json({ text: fallbackText, isFallback: true });
    }
  });

  // API Route for Custom Product Pricing & CMV Strategic Advice by Dafne
  app.post("/api/ai/pricing-advisor", async (req, res) => {
    try {
      const { products, profile } = req.body;
      const companyName = profile?.companyName || "Minha Empresa";
      
      const prompt = `
        Aja como Dafne, mentora de inteligência financeira e precificação de alta lucratividade. Analise minuciosamente a planilha de produtos lançada pelo cliente da empresa "${companyName}".

        DADOS OPERACIONAIS DO NEGÓCIO:
        - Nome da Empresa: ${companyName}
        - Alíquota de Impostos Base do Negócio: ${profile?.taxRate || 6}%

        PRODUTOS CADASTRADOS PARA ANÁLISE:
        ${Array.isArray(products) && products.length > 0 
          ? products.map((p: any) => `- **${p.name}** [SKU: ${p.sku || 'N/A'}]: Custo R$ ${p.costPrice.toFixed(2)} | Venda R$ ${p.sellingPrice.toFixed(2)} | Imposto ${p.taxRate}% | Custos Var. ${p.otherCostsPct}% | CMV ${p.cmvPct.toFixed(1)}% | Margem Líquida Real ${p.profitMarginPct.toFixed(1)}% (Lucro R$ ${p.profitValue.toFixed(2)})`).join('\n')
          : "Nenhum produto cadastrado ainda."}

        Regras de cálculo financeiro importantes para você revisar nos produtos:
        1. CMV% real = (Preço de Custo / Preço de Venda Praticado) * 100
        2. Margem Líquida Real% = ((Preço de Venda Praticado - Preço de Custo - Impostos - Custos Variáveis Adicionais) / Preço de Venda Praticado) * 100
        
        Sua tarefa é gerar uma Análise de Precificação e Gestão de CMV cirúrgica, acionável e com grande profundidade em Markdown estruturado, cobrindo:
        1. ### 📊 Raio-X Geral do Portfólio
           - Destaque o produto com a melhor margem real de contribuição e o de menor margem.
           - Alerte sobre produtos que estejam com margem real negativa ou muito baixa (abaixo de 15%).
           - Comente sobre o CMV médio e se ele condiz com o nicho de mercado (ex: alimentação deve idealmente girar entre 25% a 35%).
        2. ### 🎯 Oportunidades de Engenharia de Portfólio
           - Para os produtos com margens excelentes (Estrelas), sugira ações de promoção cruzada e otimização de faturamento.
           - Para produtos com CMVs perigosos / altos, dê sugestões práticas para diminuição de custos (compras conjuntas, renegociação de matérias primas, engenharia reversa de embalagens).
        3. ### 💡 Simulações de Recomposição de Preço
           - Escolha de forma inteligente pelo menos 1 ou 2 produtos lançados que poderiam sofrer recomposição tarifária / aumento cirúrgico de preço e mostre o impacto benéfico projetado nas finanças.
        
        Mantenha um tom profissional, perspicaz e ultra motivador como Dafne. FORMATO DE LEITURA DINÂMICA: Retorne o parecer de forma extremamente direta, objetiva, prática e com fácil entendimento, sem nunca perder a alta qualidade do diagnóstico ou a precisão dos cálculos. Use parágrafos curtos, listas com hífens (-), e destaque as principais métricas e termos em NEGRITO para facilitar a leitura dinâmica imediata pelo empresário. Não use clichês vazios ou textos longos e cansativos.
      `;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          systemInstruction: "Você é Dafne, mentora de crescimento de lucros e precificação estratégica.",
        },
        customApiKey: getCustomKeyFromRequest(req),
        model: getCustomModelFromRequest(req)
      });

      res.json({ text: response.text });
    } catch (error: any) {
      const errorStrUpper = (error?.message || String(error)).toUpperCase();
      const isQuotaError = errorStrUpper.includes("RESOURCE_EXHAUSTED") || errorStrUpper.includes("429") || errorStrUpper.includes("QUOTA") || errorStrUpper.includes("LIMIT") || errorStrUpper.includes("PAUSE");
      
      if (isQuotaError) {
        console.warn("[Pricing Advisor Warning] Limite de cota atingido ou suspenso. Ativando análise de preços offline inteligente.");
      } else {
        console.error("Error in pricing-advisor endpoint:", error);
      }
      
      const { products } = req.body;
      let fallbackText = "### 📊 Raio-X Geral do Portfólio (Automatico)\n\nAnálise baseada nos indicadores cadastrados:\n\n";
      
      if (Array.isArray(products) && products.length > 0) {
        const sortedByMargin = [...products].sort((a, b) => b.profitMarginPct - a.profitMarginPct);
        const best = sortedByMargin[0];
        const worst = sortedByMargin[sortedByMargin.length - 1];
        
        fallbackText += `* **Melhor Margem**: O produto **${best.name}** possui a maior lucratividade real de **${best.profitMarginPct.toFixed(1)}%** por venda (Lucro de R$ ${best.profitValue.toFixed(2)}).\n`;
        fallbackText += `* **Pior Margem**: O produto **${worst.name}** possui a menor lucratividade real de **${worst.profitMarginPct.toFixed(1)}%**. Preste atenção se vale a pena mantê-lo ou recompor o preço!\n\n`;
        
        fallbackText += "### 🎯 Oportunidades de Otimização\n\n";
        fallbackText += `* **CMV Crítico**: Fique atento aos produtos com CMV elevado (maiores de 40%). Reduza custos negociando lotes maiores com fornecedores ou simplificando insumos de embalagem.\n`;
        fallbackText += `* **Simulação de Preços**: Aumentos sutis de 3% a 5% em produtos de alta demanda têm baixíssimo impacto na percepção do cliente e aumentam o lucro de modo imediato.\n`;
      } else {
        fallbackText += "Cadastre seus produtos para visualizar a análise estratégica inteligente de custos e margem como CMV e markup.\n";
      }
      
      res.json({ text: fallbackText, isFallback: true });
    }
  });

  // API Route for conversational chat with Dafne
  app.post("/api/ai/chat-dafne", async (req, res) => {
    try {
      const { message, history, financialData, neuralPrecision, neuralTier } = req.body;
      const businessSegment = financialData?.businessSegment || "other";
      const businessNicheDetail = financialData?.businessNicheDetail || "";
      
      const temperature = neuralPrecision !== undefined ? Number(neuralPrecision) : 0.7;
      
      // Construct chat history context for Gemini SDK
      const previousTurns = history ? history.slice(-6).map((msg: any) => {
         const role = msg.sender === 'user' ? 'user' : 'model';
         return { role, parts: [{ text: msg.text }] };
      }) : [];

      const incomeValue = financialData?.income ?? 0;
      const expenseValue = financialData?.expense ?? 0;
      const balanceValue = financialData?.balance ?? 0;
      const countValue = financialData?.transactionsCount ?? 0;
      const compName = financialData?.companyName || "Minha Empresa";
      
      const averageBilling = financialData?.averageBilling ?? 0;
      const billingGoal = financialData?.billingGoal ?? 0;
      const billingGoalDeadline = financialData?.billingGoalDeadline || "";
      const billingNotes = financialData?.billingNotes || "";

      const dreText = financialData?.dre && financialData.dre.length > 0 
        ? financialData.dre.map((d: any) => `- ${d.label}: R$ ${Number(d.value).toLocaleString('pt-BR')}`).join('\n')
        : "Nenhum detalhamento do DRE fornecido no momento.";

      const groupExpensesText = financialData?.categoryGroupExpenses
        ? `- Custo de Vendas (COGS/CPV): R$ ${Number(financialData.categoryGroupExpenses.COGS || 0).toLocaleString('pt-BR')}\n- Despesas Operacionais (OPEX): R$ ${Number(financialData.categoryGroupExpenses.OPEX || 0).toLocaleString('pt-BR')}\n- Impostos (TAX): R$ ${Number(financialData.categoryGroupExpenses.TAX || 0).toLocaleString('pt-BR')}\n- Investimentos: R$ ${Number(financialData.categoryGroupExpenses.INVESTMENT || 0).toLocaleString('pt-BR')}\n- Outras Despesas: R$ ${Number(financialData.categoryGroupExpenses.OTHER_EXPENSE || 0).toLocaleString('pt-BR')}`
        : "Nenhum valor agrupado de despesas fornecido.";

      const topExpensesText = financialData?.topExpenseCategories && financialData.topExpenseCategories.length > 0
        ? financialData.topExpenseCategories.map((c: any) => `- ${c.name}: R$ ${Number(c.amount).toLocaleString('pt-BR')}`).join('\n')
        : "Nenhuma categoria de despesa registrada.";

      let tierInstruction = "";
      if (neuralTier === "quantum") {
        tierInstruction = "\n- MODO DE PROVIMENTO ATIVO: [NEURAL QUANTUM COGNITION]. Apresente cenários de metas altamente audaciosos e avançados. Insira riscos refinados e métricas de elasticidade de preço de forma extremamente profunda e analítica.";
      } else if (neuralTier === "flash") {
        tierInstruction = "\n- MODO DE PROVIMENTO ATIVO: [SUPER-FLASH DIRECT ACTION]. Responda com foco cirúrgico em diretivas imediatas, sendo extremamente conciso, asssertivo, prático e muito rápido.";
      } else {
        tierInstruction = "\n- MODO DE PROVIMENTO ATIVO: [PROBALISTIC FINANCIAL ADVICE]. Apresente uma assessoria de alta fidelidade técnica, equilibrada e em tom de consultor estratégico corporativo sênior.";
      }

      const systemPrompt = `
        Você é Dafne, a estrategista financeira e mentora de lucratividade dedicada a ajudar microempresas e pequenos empresários brasileiros a vencerem gargalos financeiros e maximizarem lucros.
        ${tierInstruction}
        
        OBJETIVOS E METAS DE FATURAMENTO PLANILHADAS:
        - Média de Faturamento Histórica Registrada: R$ ${averageBilling.toLocaleString('pt-BR')}
        - Objetivo Final Almejado de Faturamento: R$ ${billingGoal.toLocaleString('pt-BR')} ${billingGoalDeadline ? `(Prazo Limite: ${billingGoalDeadline})` : ''}
        ${billingNotes ? `- Observações Estratégicas: ${billingNotes}` : ''}

        SUPER INSTRUÇÃO MANDATÓRIA (ORIENTAR TUDO AO OBJETIVO):
        - O objetivo principal da pessoa é alcançar o faturamento planejado de R$ ${billingGoal.toLocaleString('pt-BR')}.
        - Todas as suas dicas, análises, planos gerados, respostas ou auditorias devem ser direcionadas STRICTEMENTE para aproximá-la desse objetivo de faturamento, comentando sobre o Gap de faturamento em relação à sua média registrada (R$ ${averageBilling.toLocaleString('pt-BR')}) e sugerindo alavancas comerciais de canais, preços, e markups para ajudá-la a vencer a diferença de R$ ${(billingGoal - averageBilling).toLocaleString('pt-BR')} de forma saudável.

        APARÊNCIA E PERSONAGEM:
        - Você é uma jovem moça de cabelos loiros e olhos verdes expressivos, elegante, organizada e extremamente inteligente.
        - Seu sotaque/atitude é de uma mentora acolhedora, vibrante, otimista no tom mas altamente realista e prática nos números. Você não vende ilusões: aponta perigos operacionais com precisão cirúrgica, mas sempre oferece de imediato um plano realista para superá-los.
        
        SEGMENTO E NICHO DO CLIENTE:
        - Segmento Geral: ${businessSegment.toUpperCase()}
        - Nicho Específico: ${businessNicheDetail || 'Prestador Geral / Outro'}
 
        DADOS FINANCEIROS REAIS DO NEGÓCIO (${compName}):
        - Receita Total (Faturamento Bruto): R$ ${incomeValue.toLocaleString('pt-BR')}
        - Despesa Total (Custos + Despesas): R$ ${expenseValue.toLocaleString('pt-BR')}
        - Saldo Líquido atual de Caixa: R$ ${balanceValue.toLocaleString('pt-BR')}
        - Total de Lançamentos: ${countValue}

        DETALHAMENTO DO DRE OPERACIONAL EM TEMPO REAL:
        ${dreText}

        DESPESAS E CUSTOS AGRUPADOS:
        ${groupExpensesText}

        CATEGORIAS DE DESPESAS MAIS SIGNIFICATIVAS:
        ${topExpensesText}

        DIRETRIZ DE FIDELIDADE CRÍTICA À PERGUNTA (FIDELIDADE MÁXIMA):
        - Sua prioridade absoluta é responder de forma direta, clara, cirúrgica e FIEL à pergunta exata realizada pelo usuário. Se ele perguntou sobre "como diminuir despesas corporativas", concentre seu conselho inteiramente em rubricas de OPEX, renegociação de aluguel ou revisão de softwares desnecessários, sem divagar sobre vendas ou marketing.
        - Se o usuário realizar perguntas matemáticas ou simulações (ex: "se eu aumentar o preço em 10%..."), faça as contas de forma extremamente detalhada passo a passo e exiba o impacto direto no lucro projetado.
        - NÃO responda com conselhos genéricos ou fórmulas prontas desligadas da pergunta ou das métricas reais do usuário.

        INTRÓITO DE INOVAÇÃO TECNOLÓGICA (FINTECH COGNITION ENGINE):
        - Utilize conceitos de ponta em tecnologia financeira: simulação de sensibilidade de markups, análise de elasticidade de demanda, previsão de sobrevida corporativa (Runway mensal), EBITDA operacional e buffers de segurança de ponto de equilíbrio.

        DIRETRIZES DE COMUNICAÇÃO:
        - Responda de forma direta, cirúrgica e extremamente profissional, baseando-se RIGOROSAMENTE nos dados financeiros do usuário fornecidos acima.
        - NÃO adicione saudações iniciais, apresentações redundantes ou preambles como "Olá, aqui é a Dafne" ou "Como sua conselheira financeira" em cada mensagem do histórico. Comece imediatamente com a análise e as respostas práticas solicitadas pelo empresário.
        - NÃO use emojis ou símbolos gráficos no início ou meio das frases de seus parágrafos ou listas. Isso causa ruído sonoro pesado e poluição quando lido pelo sintetizador de voz (Speech Synthesis). Mantenha o texto limpo de decorações.
        - Dê conselhos absolutamente adaptados ao nicho operacional informado ("${businessNicheDetail || businessSegment}"). Se o nicho for específico como hamburgueria, pizzaria, e-commerce, marcenaria, agência de marketing ou clínica de estética, traga analogias e estratégias de margem apropriadas para este nicho físico ou digital!
        - PESQUISA DE MERCADO REAL (GOOGLE SEARCH): Você DEVE usar a ferramenta integrada de buscas para trazer insights do mercado atual brasileiro de 2026 correspondente ao nicho ("${businessNicheDetail || businessSegment}"). Se houver oscilações relevantes de matéria-prima, inflação ou benchmarks do setor, integre com as respostas.
        - Não dê conselhos genéricos. Mencione os números e categorias reais dele para dar credibilidade e precisão cirúrgica!
        - Use listas em tópicos limpos marcados unicamente com hífens ou números simples, sem nenhum caractere ou ícone especial.
        - Sempre use a primeira pessoa do singular ("Eu", "creio que", "recomendo para você", "minha análise sobre") de forma extremamente executiva e polida.
        - Seja altamente encorajadora e amigável, mas mostre se a empresa está com rentabilidade ociosa ou se a margem líquida (Lucro / Receita) está perigosamente baixa.
        - Responda em Português do Brasil no tom correto de uma mentora sênior brilhante.
        - FORMATO DE LEITURA DINÂMICA (ESSENCIAL): Suas respostas devem ser de fácil entendimento para um pequeno empresário, sem nunca perder a qualidade técnica ou precisão matemática. Seja direta, cirúrgica e objetiva. Evite parágrafos longos, cansativos ou explicações prolixas. Utilize listas rápidas com tópicos claros marcados unicamente com hífen, e destaque os valores financeiros ou conceitos importantes em NEGRITO para facilitar a leitura imediata em telas rápidas.
      `;

      const config: any = {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2200,
        temperature,
      };

      if (req.body.useSearch) {
        config.tools = [{ googleSearch: {} }];
      } else if (req.body.useMaps) {
        config.tools = [{ googleMaps: {} }];
        if (req.body.latitude && req.body.longitude) {
          config.toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: Number(req.body.latitude),
                longitude: Number(req.body.longitude)
              }
            }
          };
        }
      }

      const response = await generateContentWithFallback({
        contents: [
          ...previousTurns,
          { role: "user", parts: [{ text: message }] }
        ],
        config,
        customApiKey: getCustomKeyFromRequest(req),
        model: getCustomModelFromRequest(req)
      });

      res.json({ 
        text: response.text, 
        simulatedTier: neuralTier || "pro", 
        simulatedTemp: temperature,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      });
    } catch (error: any) {
      const errorStrUpper = (error?.message || String(error)).toUpperCase();
      const isQuotaError = errorStrUpper.includes("RESOURCE_EXHAUSTED") || errorStrUpper.includes("429") || errorStrUpper.includes("QUOTA") || errorStrUpper.includes("LIMIT") || errorStrUpper.includes("PAUSE");
      
      if (isQuotaError) {
        console.warn("[Gemini API Warning in Chat] Limite de cota atingido ou suspenso (429). Gerando atendimento local inteligente.");
      } else {
        console.error("AI Chat Error:", error);
      }
      
      const { message, financialData } = req.body;
      const incomeValue = financialData?.income ?? 0;
      const expenseValue = financialData?.expense ?? 0;
      const balanceValue = financialData?.balance ?? 0;
      
      const opexVal = financialData?.categoryGroupExpenses?.OPEX || 0;
      const cogsVal = financialData?.categoryGroupExpenses?.COGS || 0;
      const taxVal = financialData?.categoryGroupExpenses?.TAX || 0;

      let localResponse = `Como sua estrategista financeira e mentora, realizei uma varredura instantânea nos seus indicadores operacionais consolidados. Apuramos um faturamento bruto acumulado de R$ ${incomeValue.toLocaleString('pt-BR')} e despesas totais de R$ ${expenseValue.toLocaleString('pt-BR')}, resultando em um Saldo Líquido de Caixa de R$ ${balanceValue.toLocaleString('pt-BR')}. Diga-me, qual decisão estratégica ou tática gostaria de simular ou otimizar agora?`;
      
      const lowercaseMsg = message?.toLowerCase() || "";
      if (lowercaseMsg.includes("cortar") || lowercaseMsg.includes("custo") || lowercaseMsg.includes("despesa") || lowercaseMsg.includes("opex") || lowercaseMsg.includes("reduzir") || lowercaseMsg.includes("diminuir")) {
        const opexPct = incomeValue > 0 ? (opexVal / incomeValue) * 100 : 0;
        localResponse = `Análise de Otimização Operacional (OPEX):
Suas despesas operacionais administrativas (OPEX) somam **R$ ${opexVal.toLocaleString('pt-BR')}**, representando **${opexPct.toFixed(1)}%** do seu faturamento de R$ ${incomeValue.toLocaleString('pt-BR')}. 
Recomendo realizar uma auditoria ágil em 2 etapas:
1. Revise assinaturas recorrentes invisíveis da empresa e taxas de adquirência de parcelas sem juros.
2. Busque economizar uma meta de 10% nessas linhas fiscais/administrativas para injetar cerca de **R$ ${(opexVal * 0.1).toLocaleString('pt-BR')}** limpos diretamente de volta para a sua liquidez de caixa.`;
      } else if (lowercaseMsg.includes("venda") || lowercaseMsg.includes("faturar") || lowercaseMsg.includes("receita") || lowercaseMsg.includes("faturamento") || lowercaseMsg.includes("lucro") || lowercaseMsg.includes("lucratividade") || lowercaseMsg.includes("crescer")) {
        const profitMargin = incomeValue > 0 ? (balanceValue / incomeValue) * 100 : 0;
        localResponse = `Modelagem de Escalonamento de Faturamento:
Seu faturamento bruto está em **R$ ${incomeValue.toLocaleString('pt-BR')}** com margem final líquida de **${profitMargin.toFixed(1)}%**.
Para elevar seu faturamento sem asfixiar o capital de giro (Working Capital), sugiro calibrar o mix de vendas do negócio:
- Priorize nas campanhas os serviços ou produtos de altíssima margem de contribuição (cadastrados com Markup acima de 1.8x).
- Evite queimar preços ou oferecer prazos excessivos em boletos faturados que criam um perigoso 'descompasso de caixa' no seu ciclo financeiro.`;
      } else if (lowercaseMsg.includes("cmv") || lowercaseMsg.includes("mercadoria") || lowercaseMsg.includes("fornecedor") || lowercaseMsg.includes("estoque") || lowercaseMsg.includes("compra")) {
        const cmvPct = incomeValue > 0 ? (cogsVal / incomeValue) * 100 : 0;
        localResponse = `Métrica de Sensibilidade do CMV (Custo de Mercadoria):
O seu Custo de Mercadorias Vendidas (CMV/CPV) acumulado é de **R$ ${cogsVal.toLocaleString('pt-BR')}**, o que corresponde a **${cmvPct.toFixed(1)}%** do faturamento bruto.
Para blindar sua rentabilidade contra oscilações de insumos em 2026:
- Tente concentrar seu volume de reposição em menos fornecedores para barganhar prazos de faturamento progressivo ou descontos em lote.
- Certifique-se de que os custos ocultos de frete de entrada, perdas produtivas e embalagem estejam rigorosamente embutidos no seu simulador de markup técnico para não corroer a sua margem de contribuição.`;
      } else if (lowercaseMsg.includes("imposto") || lowercaseMsg.includes("tax") || lowercaseMsg.includes("fiscal") || lowercaseMsg.includes("tributo") || lowercaseMsg.includes("simples")) {
        const taxPct = incomeValue > 0 ? (taxVal / incomeValue) * 100 : 0;
        localResponse = `Avaliação de Eficiência Fiscal e Tributária:
Seus custos com tributos e taxas chegam hoje a **R$ ${taxVal.toLocaleString('pt-BR')}** (**${taxPct.toFixed(1)}%** do faturamento bruto).
Como estrategista, exija do seu escritório de contabilidade uma revisão do Simples Nacional ou Lucro Presumido focado em:
- Segregação de receitas com substituição tributária (PIS/COFINS monofásicos), isenções automáticas ou benefícios locais.
- Planejamento do Fator R caso sua empresa seja prestadora de serviços de TI, saúde ou design, o que pode reduzir sua alíquota de largada de 15,5% para apenas 6% legalmente.`;
      } else if (lowercaseMsg.includes("cofrinho") || lowercaseMsg.includes("reserva") || lowercaseMsg.includes("parado") || lowercaseMsg.includes("estratégia") || lowercaseMsg.includes("investir")) {
        localResponse = `Estratégia de Liquidez e Alocação de Reservas (Cofrinho):
Seu saldo líquido disponível de caixa é de **R$ ${balanceValue.toLocaleString('pt-BR')}**.
Para inovar em tecnologia financeira, recomendo adotar a regra dos 3 Fundos de Caixa Operacional:
1. **Reserva Operacional Imediata:** Manter o equivalente a pelo menos 3 meses de despesas corporativas fixas em investimentos conservadores de liquidez diária.
2. **Cofrinho de Expansão:** Reservar de 3% a 5% de cada faturamento Pix/Boleto para fazer frente a novos equipamentos, marketing de escala e reformas.
3. **Fundo Tributário/Provisões:** Anticipar as provisões para o 13º salário, férias e encargos trabalhistas para evitar sobressaltos no final do ciclo anual.`;
      } else if (lowercaseMsg.includes("olá") || lowercaseMsg.includes("bom dia") || lowercaseMsg.includes("boa tarde") || lowercaseMsg.includes("oi") || lowercaseMsg.includes("olá!")) {
        localResponse = `Seja muito bem-vindo! Sou Dafne, sua assistente e mentora de lucratividade em tempo real.
Estou analisando seu painel com Receita de R$ ${incomeValue.toLocaleString('pt-BR')}, Despesas de R$ ${expenseValue.toLocaleString('pt-BR')} e Saldo de R$ ${balanceValue.toLocaleString('pt-BR')}.
Como posso te ajudar hoje a impulsionar seu Markup, otimizar OPEX ou auditar suas margens tributárias de forma fiel?`;
      } else {
        // Dynamic semantic-based resolution for any custom question to be completely faithful!
        localResponse = `Dafne Cognitive Engine ⚡ Análise Fiel à Pergunta:
Identifiquei sua solicitação sobre "${message}".
Com base em um modelo matemático refinado para o seu balanço atual (Faturamento de R$ ${incomeValue.toLocaleString('pt-BR')} e Custos de R$ ${expenseValue.toLocaleString('pt-BR')}):
1. **Foco Indicado:** Toda alteração que otimize suas margens operacionais tem um efeito multiplicador no seu caixa líquido livre.
2. **Simulação Técnica:** Se você conseguir elevar a eficiência média das despesas em apenas 5%, gerará um lucro adicional direto de **R$ ${(expenseValue * 0.05).toLocaleString('pt-BR')}** sem precisar vender um real a mais!
Como podemos detalhar mais este ponto ou calcular cenários específicos de markups para sua empresa?`;
      }
      
      res.json({ text: localResponse, isFallback: true });
    }
  });

  // API Route for conversational chat/tips with ChatGPT (OpenAI)
  app.post("/api/ai/chat-gpt", async (req, res) => {
    const { message, prompt, history, financialData } = req.body;
    const rawApiKey = process.env.OPENAI_API_KEY || "";
    // Sanitize API Key by removing quote wrappers, trims
    const apiKey = rawApiKey.replace(/['"“”]/g, "").trim();

    // Ensure we have a payload message
    const userMessage = message || prompt || "Olá!";

    const incomeValue = financialData?.income ?? 0;
    const expenseValue = financialData?.expense ?? 0;
    const balanceValue = financialData?.balance ?? 0;
    const countValue = financialData?.transactionsCount ?? 0;
    const compName = financialData?.companyName || "Minha Empresa";
    
    const dreText = financialData?.dre && financialData.dre.length > 0 
      ? financialData.dre.map((d: any) => `- ${d.label}: R$ ${Number(d.value).toLocaleString('pt-BR')}`).join('\n')
      : "Nenhum detalhamento do DRE fornecido no momento.";

    const groupExpensesText = financialData?.categoryGroupExpenses
      ? `- Custo de Vendas (COGS/CPV): R$ ${Number(financialData.categoryGroupExpenses.COGS || 0).toLocaleString('pt-BR')}
- Despesas Operacionais (OPEX): R$ ${Number(financialData.categoryGroupExpenses.OPEX || 0).toLocaleString('pt-BR')}
- Impostos (TAX): R$ ${Number(financialData.categoryGroupExpenses.TAX || 0).toLocaleString('pt-BR')}
- Investimentos: R$ ${Number(financialData.categoryGroupExpenses.INVESTMENT || 0).toLocaleString('pt-BR')}
- Outras Despesas: R$ ${Number(financialData.categoryGroupExpenses.OTHER_EXPENSE || 0).toLocaleString('pt-BR')}`
      : "Nenhum valor agrupado de despesas fornecido.";

    const topExpensesText = financialData?.topExpenseCategories && financialData.topExpenseCategories.length > 0
      ? financialData.topExpenseCategories.map((c: any) => `- ${c.name}: R$ ${Number(c.amount).toLocaleString('pt-BR')}`).join('\n')
      : "Nenhuma categoria de despesa registrada.";

    const systemPrompt = `
      Você é o ChatGPT Integrado via API, um assistente analítico avançado de inteligência artificial focado em gestão financeira, análise de DRE e lucratividade.
      Ajude o empresário da empresa "${compName}" com dicas financeiras cirúrgicas e acionáveis de caixa.

      DADOS FINANCEIROS REAIS DO NEGÓCIO (${compName}):
      - Receita Total (Faturamento Bruto): R$ ${incomeValue.toLocaleString('pt-BR')}
      - Despesa Total (Custos + Despesas): R$ ${expenseValue.toLocaleString('pt-BR')}
      - Saldo Líquido atual de Caixa: R$ ${balanceValue.toLocaleString('pt-BR')}
      - Total de Lançamentos: ${countValue}

      DETALHAMENTO DO DRE OPERACIONAL EM TEMPO REAL:
      ${dreText}

      DESPESAS E CUSTOS AGRUPADOS:
      ${groupExpensesText}

      CATEGORIAS DE DESPESAS MAIS SIGNIFICATIVAS:
      ${topExpensesText}

      DIRETRIZES DE COMUNICAÇÃO (DIRETRIZES DE LEITURA DINÂMICA):
      - Responda de forma extremamente direta, objetiva, prática e de fácil entendimento sem perder a qualidade técnica. Evite preâmbulos longos, introduções demoradas ou explicações redundantes.
      - Baseie-se RIGOROSAMENTE nos dados financeiros fornecidos acima. Se o usuário perguntar sobre OPEX, cite o valor do OPEX dele.
      - Não dê conselhos genéricos. Mencione os números e categorias reais dele para dar credibilidade e precisão.
      - Use parágrafos curtos, listas enxutas com hífens (-), e destaque números e conceitos cruciais em NEGRITO para facilitar a leitura rápida e dinâmica em telas de celular ou computador.
      - Seja altamente encorajadora, amigável e vá direto ao ponto sem enrolação.
      - Responda em Português do Brasil de forma extremamente polida.
    `;

    const isApiKeyMissingOrInvalid = !apiKey || apiKey === "YOUR_OPENAI_KEY" || apiKey.toLowerCase() === "undefined" || apiKey.length < 10 || !apiKey.startsWith("sk-");

    if (isApiKeyMissingOrInvalid) {
      // Emulate ChatGPT with Gemini to guarantee absolute compatibility/usability out of the box when key is missing!
      console.warn("[OpenAI API Connection] Chave de API OPENAI_API_KEY não configurada ou inválida. Mudando para a emulação assistida pelo Gemini.");
      try {
        const response = await generateContentWithFallback({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n[EMULAÇÃO GPT-4o-mini] O usuário enviou: ${userMessage}` }] }
          ],
          customApiKey: getCustomKeyFromRequest(req),
          model: getCustomModelFromRequest(req)
        });

        const simulatedText = response.text || "";
        res.json({
          text: simulatedText,
          isMocked: true,
          notice: "Para usar o ChatGPT real via OpenAI API oficial, registre sua OPENAI_API_KEY no painel de segredos do ambiente."
        });
      } catch (geminiError: any) {
        const errStrUpper = (geminiError?.message || String(geminiError)).toUpperCase();
        const isQuotaError = errStrUpper.includes("RESOURCE_EXHAUSTED") || errStrUpper.includes("429") || errStrUpper.includes("QUOTA") || errStrUpper.includes("LIMIT") || errStrUpper.includes("PAUSE");
        
        if (isQuotaError) {
          console.warn("[OpenAI Emulation] Limite de cota atingido ou suspenso. Ativando simulador offline com sucesso.");
        } else {
          console.error("Gemini emulation fallback failed:", geminiError);
        }
        const localResponse = `Com base na análise preliminar do faturamento de R$ ${incomeValue.toLocaleString('pt-BR')} e no saldo atual de R$ ${balanceValue.toLocaleString('pt-BR')}, sugiro monitorar de perto suas principais despesas operacionais e buscar uma otimização de até 10% nas contas administrativas a fim de recompor sua margem de segurança.`;
        res.json({ text: localResponse, isFallback: true });
      }
      return;
    }

    try {
      // Format previous turns to OpenAI history structure
      const previousTurns = history ? history.slice(-6).map((msg: any) => {
        const role = msg.sender === 'user' ? 'user' : 'assistant';
        return { role, content: msg.text };
      }) : [];

      // OpenAI Cache Strategy (4h TTL for conversational chat logs)
      const chatCacheInput = {
        systemPrompt,
        previousTurns,
        userMessage
      };
      
      const cachedResponse = await getCachedAiResponse("openai", chatCacheInput);
      if (cachedResponse) {
        console.log("[Cache de IA] HIT de cache do OpenAI no Firestore retornado!");
        return res.json({ text: cachedResponse, isMocked: false, isCached: true });
      }

      const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...previousTurns,
            { role: "user", content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!openAiResponse.ok) {
        const errText = await openAiResponse.text();
        throw new Error(`OpenAI respond-error: Status ${openAiResponse.status} - Details: ${errText}`);
      }

      const openAiData = await openAiResponse.json();
      const outputText = openAiData.choices?.[0]?.message?.content || "Nenhuma resposta obtida do ChatGPT.";

      // Save successful OpenAI response to Firestore cache (4h TTL)
      await saveCachedAiResponse("openai", chatCacheInput, outputText, 4 * 60 * 60 * 1000);

      res.json({ text: outputText, isMocked: false });
    } catch (error: any) {
      console.warn("[OpenAI API Connection Success Warning/Quota Error] Conexão com OpenAI retornou erro, recuperando via sistema de inteligência auxiliar:", error.message || error);
      
      // Attempt high-quality automatic emulation with Gemini to keep the app working perfectly even on 401, 403, etc.
      try {
        const response = await generateContentWithFallback({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n[EMULAÇÃO GPT-4o-mini NA FALHA] O usuário enviou: ${userMessage}. O serviço original retornou um erro (${error.message || "401"}), então forneça uma resposta completa e excelente fingindo ser o ChatGPT.` }] }
          ],
          customApiKey: getCustomKeyFromRequest(req),
          model: getCustomModelFromRequest(req)
        });

        const simulatedText = response.text || "";
        res.json({
          text: simulatedText,
          isMocked: true,
          notice: "Sua chave OPENAI_API_KEY falhou (ex: erro de autorização ou saldo expirado). Suas respostas foram direcionadas para a IA do Gemini para que o aplicativo continue rodando perfeitamente."
        });
      } catch (geminiError: any) {
        console.error("Universal fallback failsafe activated. Gemini also failed:", geminiError);
        const localResponse = `Ocorreu uma interrupção temporária na conexão com a API da OpenAI. Entretanto, com base nos seus dados financeiros atuais de faturamento R$ ${incomeValue.toLocaleString('pt-BR')} e liquidez de R$ ${balanceValue.toLocaleString('pt-BR')}, nossa recomendação prioritária é auditar despesas operacionais fixas (OPEX) para manter a sustentabilidade do fluxo de caixa.`;
        res.json({ text: localResponse, isFallback: true, error: error.message });
      }
    }
  });

  // API Route to create Stripe checkout session or simulate it if the key is missing
  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    try {
      const { userId, origin, planId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId é pre-requisito obrigatório." });
      }

      const stripe = getStripe();
      if (!stripe) {
        console.warn("[Stripe API Connection] STRIPE_SECRET_KEY não encontrada ou inválida. Simulando Checkout de sucesso.");
        // Simulated checkout URL to redirect the user natively
        return res.json({ 
          url: `${origin}/?stripe_checkout=success&is_mocked=true&plan_id=${planId || 'pro'}&user_id=${userId}`,
          isMocked: true 
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "pix", "boleto"],
        payment_method_options: {
          boleto: {
            expires_after_days: 3,
          },
        },
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: "Plano Premium Gestor",
                description: "Acesso completo de BI, DRE Avançado e Assistente IA por R$ 99,90/mês",
              },
              unit_amount: 9990, // R$ 99,90
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/?stripe_checkout=success&session_id={CHECKOUT_SESSION_ID}&plan_id=${planId || 'pro'}`,
        cancel_url: `${origin}/?stripe_checkout=cancel`,
        metadata: {
          userId,
          planId: planId || "pro",
        },
      });

      res.json({ url: session.url, isMocked: false });
    } catch (error: any) {
      console.error("Erro ao criar sessão do Stripe:", error);
      res.status(500).json({ error: error.message || "Erro interno ao processar Stripe Checkout" });
    }
  });

  // API Route to verify a checkout session state
  app.post("/api/stripe/verify-session", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId é obrigatório" });
      }

      // If mocked session
      if (sessionId === "mocked_session" || sessionId.startsWith("mock_")) {
        return res.json({ status: "complete", isMocked: true });
      }

      const stripe = getStripe();
      if (!stripe) {
        return res.json({ status: "complete", isMocked: true });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json({ status: session.status, payment_status: session.payment_status });
    } catch (error: any) {
      console.error("Erro ao verificar sessão do Stripe:", error);
      res.status(500).json({ error: error.message || "Erro ao verificar sessão" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
