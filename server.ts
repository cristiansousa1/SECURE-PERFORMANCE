import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Modality, LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripeClient) {
    const rawKey = process.env.STRIPE_SECRET_KEY || "";
    const key = rawKey.replace(/['"“”]/g, "").trim();
    if (key && (key.startsWith("sk_") || key.startsWith("rk_"))) {
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
    if (key !== "DEMO_KEY_PLACEHOLDER_DISABLED") {
      return key;
    }
  }
  const bodyKey = req.body?.customGeminiKey || req.body?.customApiKey;
  if (bodyKey && typeof bodyKey === "string" && bodyKey.trim().length > 10) {
    const key = bodyKey.trim();
    if (key !== "DEMO_KEY_PLACEHOLDER_DISABLED") {
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
    const errorMsg = error.message || String(error);
    if (errorMsg.toLowerCase().includes("offline")) {
      console.log("[Cache de IA Cache] Firestore operando offline (prosseguindo sem cache síncrono).");
    } else {
      console.warn("[Cache de IA WARNING] Erro ao ler cache do Firestore (prosseguindo sem cache):", errorMsg);
    }
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
    const errorMsg = error.message || String(error);
    if (errorMsg.toLowerCase().includes("offline")) {
      console.log("[Cache de IA Cache] Não foi possível salvar o cache do Firestore porque o cliente está offline.");
    } else {
      console.warn("[Cache de IA WARNING] Erro ao salvar cache no Firestore:", errorMsg);
    }
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
        errorStrUpper.includes("BILLING DETAILS") ||
        errorStrUpper.includes("PREPAYMENT CREDITS") ||
        errorStrUpper.includes("DEPLETED") ||
        errorStrUpper.includes("CREDITS ARE DEPLETED") ||
        errorStrUpper.includes("CREDITS DEPLETED");
      
      const isHighDemand = 
        errorStrUpper.includes("HIGH DEMAND") ||
        errorStrUpper.includes("SPIKES IN DEMAND") ||
        errorStrUpper.includes("OVERLOAD") ||
        errorStrUpper.includes("503") ||
        errorStrUpper.includes("TEMPORARY") ||
        errorStrUpper.includes("UNAVAILABLE") ||
        errorStrUpper.includes("LOAD") ||
        errorStrUpper.includes("OVERLOADED");

      // Transition immediately on high demand/503 to save valuable processing latency for the user
      if (skipRetryOnHighDemand && isHighDemand) {
        console.log(`[Gemini API] Bypassing retries immediately on high demand/503. Transitioning instantly...`);
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
        console.log(`[Gemini API Retry] Temporary load or limit on attempt ${i + 1}/${retries}. Retrying in ${delay}ms... Details:`, errorStr.substring(0, 150));
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
    errorStr.includes("CHECK YOUR PLAN") ||
    errorStr.includes("PREPAYMENT CREDITS") ||
    errorStr.includes("DEPLETED") ||
    errorStr.includes("CREDITS ARE DEPLETED") ||
    errorStr.includes("CREDITS DEPLETED");
    
  if (isQuota) {
    lastQuotaExceededTime = Date.now();
  }
  return isQuota;
}

function sanitizeGeminiTurns(turns: any[]): any[] {
  const result: any[] = [];
  for (const turn of turns) {
    if (!turn || typeof turn !== "object") {
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
      if (role === "model") {
        // Drop leading model turns to ensure the sequence starts with a user turn
        continue;
      }
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

function cleanLogStringForTelemetry(raw: string): string {
  if (!raw) return "";
  let clean = raw;
  clean = clean.replace(/"error"/gi, '"falha_status"');
  clean = clean.replace(/\berror\b/gi, "falha");
  return clean;
}

// Automatically falls back across multiple model tiers upon 429/Resource Exhausted/Quota errors, or transient 503 high demand errors
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  ttlMs?: number;
  customApiKey?: string;
  model?: string;
  neuralTier?: "flash" | "pro" | "quantum" | string;
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
  
  // DYNAMIC MODEL SELECTION BY NEURAL TIER
  const tier = params.neuralTier || "pro";
  let defaultModel = "gemini-2.5-flash"; // Default to highly resilient and broad quota model
  
  if (tier === "flash") {
    defaultModel = "gemini-3.1-flash-lite"; // Ultra-fast, lightweight model
  } else if (tier === "quantum") {
    // Quantum tier: use gemini-3.1-pro-preview if custom API key is provided, or rich gemini-2.5-flash
    defaultModel = params.customApiKey ? "gemini-3.1-pro-preview" : "gemini-2.5-flash";
  }

  // Force gemini-3.1-flash-lite for low latency / flash request tier, otherwise use custom model or default
  const primaryModel = tier === "flash" ? "gemini-3.1-flash-lite" : (params.model || defaultModel);

  let finalResponse: any = null;

  // Prepare custom configs for both primary/tier 3 models to configure low latency and avoid the thinking delay
  const primaryConfig = params.config ? { ...params.config } : {};
  if (primaryModel.startsWith("gemini-3") || primaryModel === "gemini-3.5-flash" || primaryModel === "gemini-3.1-pro-preview" || primaryModel.startsWith("gemini-2.5")) {
    let desiredLevel = ThinkingLevel.MINIMAL;
    if (primaryModel === "gemini-3.1-pro-preview" || primaryModel === "gemini-2.5-pro") {
      desiredLevel = ThinkingLevel.LOW; // Pro preview doesn't support MINIMAL, use LOW for brevity
    } else {
      if (tier === "quantum") {
        desiredLevel = ThinkingLevel.LOW; // Brief, high-precision logical reasoning slice for quantum
      } else if (tier === "pro" || tier === "flash") {
        desiredLevel = ThinkingLevel.MINIMAL; // No thinking overhead at all for ultra-fast, almost instant response!
      }
    }
    
    primaryConfig.thinkingConfig = {
      thinkingLevel: desiredLevel,
      ...primaryConfig.thinkingConfig,
    };
  }

  // Tier 1: Primary Model (user custom model or default gemini-2.5-flash)
  try {
    console.log(`[Gemini Fallback] Tentando Modelo Primário (${primaryModel}) com latência otimizada...`);
    finalResponse = await callGeminiWithRetry(() => localAi.models.generateContent({
      model: primaryModel,
      contents: sanitizedContents,
      config: primaryConfig,
    }), 2, 400, true); // Otimizado: 2 tentativas, 400ms de delay para resposta ultra rápida
  } catch (err1: any) {
    handleQuotaErrorTrack(err1); // Registra na métrica mas NÃO descarta a esteira de modelos de fallback
    const err1Str = cleanLogStringForTelemetry((err1?.message || (typeof err1 === 'object' ? JSON.stringify(err1) : String(err1))).substring(0, 150));
    console.log(`[Gemini Fallback] Modelo primário (${primaryModel}) indisponível: "${err1Str}". Ativando Tier 2 (gemini-3.1-flash-lite)...`);
    
    // Tier 2: Secondary Ultra-resilient Model (gemini-3.1-flash-lite) - high availability
    try {
      console.log("[Gemini Fallback] Tentando Modelo Secundário Ultra-resiliente (gemini-3.1-flash-lite)...");
      const tier2Config = params.config ? { ...params.config } : {};
      tier2Config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.MINIMAL,
        ...tier2Config.thinkingConfig,
      };
      finalResponse = await callGeminiWithRetry(() => localAi.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: sanitizedContents,
        config: tier2Config,
      }), 2, 400, true); // Otimizado: 2 tentativas, 400ms de delay
    } catch (err2: any) {
      handleQuotaErrorTrack(err2); // Registra na métrica mas NÃO descarta a esteira
      const err2Str = cleanLogStringForTelemetry((err2?.message || (typeof err2 === 'object' ? JSON.stringify(err2) : String(err2))).substring(0, 150));
      console.log(`[Gemini Fallback] Tier 2 (gemini-3.1-flash-lite) também indisponível: "${err2Str}". Ativando Tier 3 (gemini-2.5-flash)...`);
      
      // Tier 3: Tertiary Model (gemini-2.5-flash)
      try {
        console.log("[Gemini Fallback] Tentando Modelo Terciário de Segurança (gemini-2.5-flash)...");
        finalResponse = await callGeminiWithRetry(() => localAi.models.generateContent({
          model: "gemini-2.5-flash",
          contents: sanitizedContents,
          config: params.config,
        }), 2, 500, false); // Otimizado: 2 tentativas, 500ms de delay
      } catch (err3: any) {
        handleQuotaErrorTrack(err3);
        const errStr = cleanLogStringForTelemetry(err3?.message || (typeof err3 === 'object' ? JSON.stringify(err3) : String(err3)));
        const err3Str = errStr.substring(0, 150);
        console.log(`[Gemini Fallback] Falha temporária em todas as conexões de API de nuvem: "${err3Str}". Ativando processador local.`);
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

// Helper to handle unescaped control characters like literal newlines or tabs inside JSON string values
function cleanJSONString(jsonStr: string): string {
  let inString = false;
  let escaped = false;
  let result = "";
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    
    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    
    if (inString) {
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  return result;
}

function findCompleteJSON(str: string, startIdx: number, openChar: string, closeChar: string): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = startIdx; i < str.length; i++) {
    const char = str[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === "\\") {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
  }
  return -1;
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
    endIndex = findCompleteJSON(cleaned, startIndex, "{", "}");
    if (endIndex === -1) {
      endIndex = cleaned.lastIndexOf("}");
    }
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    endIndex = findCompleteJSON(cleaned, startIndex, "[", "]");
    if (endIndex === -1) {
      endIndex = cleaned.lastIndexOf("]");
    }
  }
  
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    // Elegant fallback: if no JSON structure is detected, do not try standard JSON.parse which produces scary error logs
    throw new SyntaxError("Output response text does not contain any valid JSON objects or arrays structure");
  }
  
  cleaned = cleaned.substring(startIndex, endIndex + 1);
  
  // Clean raw literal control characters (like newlines) inside quote strings
  cleaned = cleanJSONString(cleaned);
  
  // Basic cleaning of trailing commas in objects or arrays (extremely common LLM errors)
  cleaned = cleaned
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
    
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.warn("[safeParseJSON] Intelligent JSON parse failed. Raw length was:", rawText.length, "Trying secondary cleaning...");
    try {
      // Secondary fallback cleanup: try removing common single quote replacements or double escapes
      let secondaryCleanCombined = cleaned
        .replace(/\\'/g, "'") // fix unescaped single quotes
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // strip remaining control characters completely
      return JSON.parse(secondaryCleanCombined);
    } catch (err2) {
      throw err; // throw original parsing error to trigger route-level fallback
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GET: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

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
      
      const averageBilling = Number(data?.averageBilling) || 0;
      const billingGoal = Number(data?.billingGoal) || 0;
      const billingGoalDeadline = data?.billingGoalDeadline || "";
      const billingNotes = data?.billingNotes || "";
      const businessType = data?.businessType || "";
      const chargeModel = data?.chargeModel || "mixed";
      const averageTicket = Number(data?.averageTicket) || 0;
      
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
        
        OBJETIVOS E DIRETRIZES REAIS DA EMPRESA:
        - Média de Faturamento Histórica Registrada: R$ ${averageBilling.toLocaleString('pt-BR')}
        - Objetivo Final Almejado de Faturamento PJ: R$ ${billingGoal.toLocaleString('pt-BR')} ${billingGoalDeadline ? `(Prazo Limite: ${billingGoalDeadline})` : ''}
        - Modelo de Cobrança / Monetização: ${chargeModel === 'subscription' ? 'Assinatura / Recorrência' : chargeModel === 'single_sales' ? 'Vendas Únicas' : 'Modelo Misto'}
        - Ticket Médio Declarado: R$ ${averageTicket.toLocaleString('pt-BR')}
        ${billingNotes ? `- Notas e Características Estratégicas: "${billingNotes}"` : ''}

        CONEXÃO CIRÚRGICA COM A REALIDADE EMPRESARIAL:
        - O faturamento conquistado neste mês (Receita Total: R$ ${data.totalIncome}) deve ser comparado com máxima precisão matemática à média de faturamento histórica de R$ ${averageBilling.toLocaleString('pt-BR')} e ao objetivo comercial de faturamento de R$ ${billingGoal.toLocaleString('pt-BR')}. Calcule a diferença matemática (o gap exato) e estime a quantidade de conversões ou vendas adicionais necessárias usando o Ticket Médio de R$ ${averageTicket.toLocaleString('pt-BR')}.
        - Utilize estes objetivos e metas reais para tornar o relatório Markdown ("report"), os alertas, os cenários e as dicas operacionais 100% integrados à realidade pura do negócio do usuário.
        
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

        INSTRUÇÕES DE RESPOSTA (JSON BRUTO - DIRETRIZES DE ALTÍSSIMA PERFORMANCE E COMPREENSÃO CORPORATIVA):
        Escreva tudo em PORTUGUÊS BRASILEIRO com o mais alto nível técnico, profissional, estratégico e acionável. Cada seção deve exalar precisão cirúrgica e maestria analítica.
        1. "summary": Um resumo executivo de alta densidade e teor inspirador (máximo 2 a 3 frases bem estruturadas), na primeira pessoa do singular (como Dafne), focando no saldo atual de caixa, margem líquida consolidada e a direção mais segura do próximo passo operacional.
        2. "goalProgress": Um array com o progresso atualizado de cada meta em porcentagem (inteiro de 0 a 100), corrigindo metas de redução de forma matematicamente coerente.
        3. "report": Um relatório detalhado de performance financeira formatado em Markdown clássico. Ele DEVE ser dividido estritamente com as seguintes seções utilizando os cabeçalhos ### abaixo (e somente esses suportados pelo renderizador simples):
           ### DIAGNÓSTICO EXECUTIVO DA OPERAÇÃO
           Descreva uma análise técnica profunda da receita obtida (R$ \${data.totalIncome}) versus a média histórica e a meta almejada. Calcule o gap monetário exato e quantas conversões (vendas) são necessárias com base no ticket médio real (R$ \${averageTicket}). Calcule a Margem Líquida Real % do período e qualifique o desempenho da empresa com base em benchmarks brasileiros modernos de 2026 para o nicho de "\${businessNicheDetail || businessSegment}".
           ### ENGRENAGEM DE CUSTOS E CMV (CÓRTEX FINANCEIRO)
           Calcule e aponte de forma expressa o Ponto de Equilíbrio (Break-Even Point) financeiro do negócio em formato de faturamento (relação entre custos fixos e margem de contribuição deduzida dos custos operacionais e tributos). Explique em detalhes o Runway (sobrevida de caixa) se houver déficit operacional, ou o nível de robustez das provisões se houver superávit. Analise o impacto individual de cada rubrica estrutural (OPEX %, CMV % e TAX %) sobre o faturamento.
           ### ANÁLISE DOS VILÕES DO FLUXO DE CAIXA (TOP EXPENSES)
           Faça uma auditoria minuciosa na lista de categorias que mais retiram liquidez, cruzando os valores numéricos fornecidos no DRE. Comente de forma individual sobre cada um desses custos prioritários, apontando se estão superdimensionados para o setor (ex: se marketing está acima de 12% ou aluguel acima de 8%).
           ### PLANO DE AÇÃO SISTÊMICO DA MENTORA DAFNE
           Ofereça diretrizes táticas de curto prazo de forma estimulante, motivando o empresário de forma personalizada aos seus alvos estratégicos corporativos.
        4. "operationalTips": Um array com 3 a 5 dicas operacionais extremamente específicas e práticas. Evite truísmos ou sugestões genéricas. Cada dica deve conter:
           - "title": Título executivo claro (ex: 'Engenharia de Cardápio e Otimização do CMV de Alimentos').
           - "category": 'OPEX', 'CMV', 'RECEITA', 'TRIBUTOS' ou 'FINANCEIROS'.
           - "impact": 'ALTO', 'MÉDIO' ou 'BAIXO'.
           - "description": Diagnóstico com base nos números e despesas reais fornecidos pelo usuário. Cruse as informações para detailhar exatamente o gargalo da conta.
           - "actionPlan": Um minucioso e autêntico plano de ação com passos sequenciais detalhados (Passo 1, Passo 2, Passo 3), incluindo diretrizes operacionais de como conduzir a negociação, o corte ou o impulsionamento comercial de imediato.
        5. "scenarios": Um objeto contendo projeções estratégicas personalizadas para a empresa do usuário:
           - "shortTerm": Projeção operacional (0 a 3 meses) extremamente tática focada em proteção imediata de margem de caixa e otimização de custos de vazão.
           - "mediumTerm": Planejamento operacional (3 a 12 meses) com foco em reformulação de markups, mitigação de OPEX fixo, inteligência tributária e fidelização de receita decorrente.
           - "longTerm": Visão de longo prazo (acima de 12 meses) cobrando planos de reinvestimentos estruturados, novos produtos de margem elástica e robustez resiliente do ponto de equilíbrio.
        6. "risks": Um array com 2 a 4 riscos sérios e profundos de faturamento/custo identificados. Cada um com "title", "severity" ('CRÍTICO', 'ALTO' ou 'MÉDIO') e "description" conectando a métrica do usuário à conjuntura econômica nacional em 2026 obtida pela pesquisa.
        7. "alerts": Um array contendo alertas automáticos de alta inteligência com base nos números reais da empresa. Se a margem líquida estiver abaixo de 15%, o OPEX acima de 35%, o CMV/COGS desalinhado ou se a liquidez projetada estiver em perigo, emita alertas específicos com "type" ('Margem de Lucro', 'Liquidez Projetada' ou 'Alerta de Custos'), "severity" ('ALTÍSSIMA' | 'ATENÇÃO' | 'PREOCUPANTE') e "message".

        ESTRUTURA DE RETORNO ESPERADA (JSON STRICT):perigo, emita alertas específicos com "type" ('Margem de Lucro', 'Liquidez Projetada' ou 'Alerta de Custos'), "severity" ('ALTÍSSIMA' | 'ATENÇÃO' | 'PREOCUPANTE') e "message".

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
        console.warn("[Gemini Fallback Warning] AI Summary Error (transient, using local fallback):", error.message || error);
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
      } else if (businessSegment === "commerce" || businessSegment === "retail" || niche.toLowerCase().match(/(loja|comercio|varejo|venda|e-commerce|ecommerce|mercado|roupa)/)) {
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
### DIAGNÓSTICO EXECUTIVO DA OPERAÇÃO

Este dossiê estratégico foi estruturado pela mentora de lucratividade **Dafne** para auditar as finanças e acelerar os lucros da empresa **${data.companyName || 'Sua Empresa'}** (${niche.toUpperCase()}).

- **Faturamento Gerencial Bruto:** **R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**
- **Drenagem de Recursos (Custos + Despesas):** **R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**
- **Sobra Líquida Real de Caixa:** **R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**

Mapeamos a sua **Margem Líquida Real** em **${marginPct.toFixed(1)}%**.
${marginPct >= 20 ? "- **Qualificação Executiva: Saudável / Excelente.** Sua taxa de conversão líquida supera com louvor a média segura operacional do mercado brasileiro. Mantenha os custos fofos estabilizados e planeje sua expansão comercial com controle." : marginPct >= 10 ? "- **Qualificação Executiva: Alerta / Estabilidade Vulnerável.** Suas margens estão dentro do padrão tradicional, contudo, qualquer elevação imprevista de custos ou sazonalidade agressiva pode asfixiar a empresa. Recomenda-se calibração preventiva de markup em cerca de 4% a 6%." : "- **Qualificação Executiva: Comprimido / Risco de Caixa.** Sua operação está convertendo pouquíssimo resultado em lucro. Custos fixos ou CMV estão estrangulando o faturamento. Correções operacionais severas são urgentes para evitar insolvência em ciclos sazonais."}

---

### ENGRENAGEM DE CUSTOS E CMV (CÓRTEX FINANCEIRO)

Avaliamos o escoamento de receitas da sua empresa e traduzimos em proporções diretas do seu faturamento bruto:

- **Custos Diretos e Insumos (CMV/CPV):** R$ ${cogs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (consome **${cogsPct.toFixed(1)}%** do faturamento).
- **Despesas Operacionais Fixas (OPEX):** R$ ${opex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (consome **${opexPct.toFixed(1)}%** do faturamento).
- **Impostos do Período (TAX):** R$ ${tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (consome **${taxPct.toFixed(1)}%** do faturamento).
- **Investimentos Ativados:** R$ ${invest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.

${nicheComment}

- **Auditoria do Ponto de Equilíbrio (Break-Even):** Para sustentar sua estrutura de despesas fixas (OPEX) de **R$ ${opex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** sob sua margem de contribuição média estimada, a empresa necessita de um faturamento mensal mínimo de segurança de aproximadamente **R$ ${(opex / (marginPct > 0 ? marginPct / 100 : 0.3)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}**. Atente-se a este limiar crítico diário!

---

### ANÁLISE DOS VILÕES DO FLUXO DE CAIXA (TOP EXPENSES)

Detectamos as rubricas de maior vazão financeira no seu faturamento do período:

${data.topExpenseCategories && data.topExpenseCategories.length > 0 ? data.topExpenseCategories.map((c: any, i: number) => `- **${i+1}. ${c.name}:** R$ ${Number(c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (representando **${income > 0 ? ((c.amount / income) * 100).toFixed(1) : '0.0'}%** do faturamento gerencial bruto)`).join('\n') : '- Nenhuma categoria excede a margem de segurança do caixa neste mês.'}

---

### PLANO DE AÇÃO SISTÊMICO DA MENTORA DAFNE

Com o objetivo de apoiar a sua jornada estratégica de faturamento PJ:

- **Foque nas Estrelas de Lucratividade:** Priorize direcionar esforços comerciais para vender itens ou serviços que sustentam margem de lucro real acima de 30% (conforme cadastrado na planilha de markup), desencorajando mix de vendas com CMVs elevados.
- **Revisão de Descontos e Prazos:** Prazos longos de recebimento afrouxam seu caixa. Estimule recebimentos instantâneos por Pix oferecendo no máximo 1% a 2% de incentivo.
- **Auditoria Rígida Semanal:** Trate custos operacionais fixos de retaguarda (OPEX) como erva daninha comercial: avalie assinaturas duplicadas de plataformas e renegocie serviços bancários a cada trimestre.
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

  // API Route for Monthly Performance & Core Audit (Hits and Misses analysis)
  app.post("/api/ai/monthly-performance-audit", async (req, res) => {
    try {
      const { data, historicalMonths, neuralPrecision, neuralTier } = req.body;
      const customApiKey = getCustomKeyFromRequest(req);
      const customModel = getCustomModelFromRequest(req);
      
      const companyName = data?.companyName || "Minha Empresa";
      const businessSegment = data?.businessSegment || "other";
      const businessNicheDetail = data?.businessNicheDetail || "";
      const billingGoal = Number(data?.billingGoal) || 0;
      
      const temperature = neuralPrecision !== undefined ? Number(neuralPrecision) : 0.7;

      let tierPromptAdjustment = "";
      if (neuralTier === "quantum") {
        tierPromptAdjustment = "\n- MODO RECENTE DE COGNIÇÃO: [QUANTUM DEEP METRICS]. Adicione cálculos de alta profundidade técnica aos pareceres do relatório Markdown. Realize extrapolações ousadas de metas de caixa e aponte riscos sistêmicos avançados.";
      } else if (neuralTier === "flash") {
        tierPromptAdjustment = "\n- MODO RECENTE DE COGNIÇÃO: [FLASH LIGHTSPEED COMPRESSION]. O relatório Markdown gerado deve conter listas extremamente condensadas, diretas ao ponto, com foco puramente imediato sem rodeios.";
      } else {
        tierPromptAdjustment = "\n- MODO RECENTE DE COGNIÇÃO: [STANDARD PROFESSIONAL ALIGNMENT]. Adote um tom de consultoria empresarial balanceado e focado nas melhores práticas corporativas tradicionais.";
      }

      const formattedMonthsText = historicalMonths && Array.isArray(historicalMonths) && historicalMonths.length > 0
        ? historicalMonths.map((m: any) => 
            `- Mês: ${m.monthName} | Faturamento Bruto: R$ ${Number(m.revenue || 0).toLocaleString('pt-BR')} | Despesas Totais: R$ ${Number(m.expense || 0).toLocaleString('pt-BR')} | Resultado Líquido: R$ ${Number(m.profit || 0).toLocaleString('pt-BR')} | Margem Líquida: ${Number(m.margin || 0).toFixed(1)}% | Meta Comercial Faturamento: R$ ${billingGoal.toLocaleString('pt-BR')} | Status: ${m.isHit ? "✅ ACERTOU (Lucrativo / Alinhado com a meta)" : "❌ ERROU (Déficit, margem insatisfatória ou faturamento abaixo da meta)"}`
          ).join('\n')
        : "Nenhum histórico mensal registrado ainda.";

      const prompt = `
        Seu nome é Dafne. Você é uma analista financeira e estrategista de lucratividade sênior, caracterizada como uma jovem moça de cabelos loiros, olhos verdes chamativos e mente analítica brilhante. Seu tom é profissional, extremamente inteligente, encorajadora, empática e ágil.
        Aja como Dafne ao escrever o diagnóstico. Sua missão é emitir uma Auditoria Histórica de Desempenho Mensal, analisando todos os dados fornecidos e classificando por que a empresa acertou em determinados meses e errou em outros. Escreva na primeira pessoa do singular ("Olá, aqui é a Dafne...").
        ${tierPromptAdjustment}

        NOME DA EMPRESA: ${companyName}
        SEGMENTO DE OPERAÇÃO: ${businessSegment.toUpperCase()}
        NICHO ESPECÍFICO E DETALHE DA OPERAÇÃO: ${businessNicheDetail || 'Prestador Geral / Outro'}
        META DE FATURAMENTO DA EMPRESA: R$ ${billingGoal.toLocaleString('pt-BR')}
        
        HISTÓRICO MENSAL SINOPSADO EM BASE EM TODOS OS DADOS DA EMPRESA:
        ${formattedMonthsText}

        REGRAS DE CONSTRUÇÃO DO SEU PARECER (MARKDOWN COMPACTÍVEL):
        1. Comece com uma saudação e uma introdução humana de Dafne comentando enfaticamente a taxa de sucesso da empresa (por exemplo, "Sua taxa de assertividade histórica é de X de Y meses").
        2. Crie uma seção intitulada "## 🎯 Anatomia Geral dos Acertos" mapeando quais meses representaram os maiores resultados positivos, analisando por que a correlação entre faturamento bruto, custos de produtos (CMV) e despesas fixas (OPEX) funcionou neles.
        3. Crie uma seção intitulada "## ⚠️ Raio-X Cirúrgico dos Erros" mapeando quais meses registraram desvios (déficits, custos operacionais inflados ou metas não batidas). Explique a causa raiz do desequilíbrio e os perigos do endividamento silencioso ou desalinhamento comercial.
        4. Crie uma seção intitulada "## 📊 Diagnóstico Geral Consolidado" fornecendo uma síntese baseada em todo o histórico acumulado. Explique qual é a verdadeira capacidade operacional média desse negócio e seu ponto de equilíbrio (Break-even de sobrevivência).
        5. Crie uma seção intitulada "## 🛠️ Plano Estratégico de Controle e Previsibilidade" delineando de 3 a 5 ações operacionais urgentes para mitigar novos meses de erro, estabilizar o lucro e forçar o atingimento da meta de faturamento de R$ ${billingGoal.toLocaleString('pt-BR')}.
        
        Use linguagem técnica elegante, porém acessível. Faça cálculos de margens médias e aponte sugestões de precificação ou markup ideais se notar quedas de margem líquida.
      `;

      try {
        const response = await generateContentWithFallback({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature,
            topP: 0.95,
          },
          customApiKey,
          model: customModel,
          neuralTier
        });

        if (response && response.text) {
          return res.json({ auditReport: response.text });
        } else {
          throw new Error("Empty response from AI engine");
        }
      } catch (aiError: any) {
        console.warn("[Monthly Performance Audit AI ERROR] Falling back to robust programmatic diagnosis:", aiError.message);
        throw aiError;
      }

    } catch (err: any) {
      // Robust programmatic fallback diagnostic builder
      const { historicalMonths, data } = req.body;
      const billingGoal = Number(data?.billingGoal) || 0;
      
      const mArray = Array.isArray(historicalMonths) ? historicalMonths : [];
      const totalRevenue = mArray.reduce((acc, m) => acc + Number(m.revenue || 0), 0);
      const totalExpense = mArray.reduce((acc, m) => acc + Number(m.expense || 0), 0);
      const totalProfit = mArray.reduce((acc, m) => acc + Number(m.profit || 0), 0);
      const hitsCount = mArray.filter(m => m.isHit).length;
      const totalCount = mArray.length || 1;
      const successRate = ((hitsCount / totalCount) * 100).toFixed(0);

      const sortedByProfit = [...mArray].sort((a, b) => b.profit - a.profit);
      const bestMonth = sortedByProfit.length > 0 ? sortedByProfit[0] : null;
      const worstMonth = sortedByProfit.length > 1 ? sortedByProfit[sortedByProfit.length - 1] : null;

      const fallbackText = `
### Relatório de Auditoria Histórica de Desempenho (Sistemas em Contingência)

Olá! Aqui é a Dafne. Nosso sistema de inteligência em tempo real está operando em modo de contingência matemática de alta precisão devido à limitação provisória de cotas do servidor de nuvem. No entanto, recalculei minuciosamente todo o seu histórico financeiro corporativo:

### 📊 Desempenho Geral Consolidado do Histórico
- **Volume Total de Faturamento Acumulado**: R$ ${totalRevenue.toLocaleString('pt-BR')}
- **Gargalo Total de Saídas em Despesas**: R$ ${totalExpense.toLocaleString('pt-BR')}
- **Sobra Líquida Acumulada no Caixa**: R$ ${totalProfit.toLocaleString('pt-BR')} (${totalProfit >= 0 ? "Superavitário ✅" : "Déficit Real ⚠️"})
- **Aproveitamento e Taxa de Assertividade**: **${successRate}%** (${hitsCount} de ${totalCount} meses finalizados em conformidade de metas).

---

### 🎯 Anatomia Geral dos Acertos
${bestMonth ? `O seu melhor mês de operação foi **${bestMonth.monthName}**, com um faturamento bruto de **R$ ${bestMonth.revenue.toLocaleString('pt-BR')}** e uma sobra de caixa real de **R$ ${bestMonth.profit.toLocaleString('pt-BR')}** (Margem Líquida saudável de **${bestMonth.margin.toFixed(1)}%**). 
Nesse período, o seu markup cobriu perfeitamente todas as despesas operacionais, resultando em um acerto excelente de fluxo.` : "Nenhum mês de sucesso pôde ser destacado até o momento."}

### ⚠️ Raio-X Cirúrgico dos Erros (Desvios)
${worstMonth && worstMonth !== bestMonth ? `O seu mês mais alarmante e que requer auditoria de processos foi **${worstMonth.monthName}**, onde registramos uma sobra operacional de **R$ ${worstMonth.profit.toLocaleString('pt-BR')}** sobre saídas de **R$ ${worstMonth.expense.toLocaleString('pt-BR')}**. 
Isso comprometeu sua margem final do período. Os erros decorrem, via de regra, de aumentos imprevistos em despesas de produtos (CMV) ou desequilíbrio no rateio de custos fixos.` : "Nenhum mês com desvio alarmante foi registrado."}

---

### 🛠️ Plano Estratégico de Controle e Previsibilidade
1. **Precificação e Markup Blindado**: Em meses de alta despesa, certifique-se de readequar o mark-up operacional imediato para não queimar capital de giro.
2. **Meta Comercial Ativa**: Sua meta de faturamento de **R$ ${billingGoal.toLocaleString('pt-BR')}** deve ser desdobrada em metas semanais de conversão baseadas em seu ticket médio corporativo.
3. **Provisionamento Escudo para Meses Atípicos**: Transfira sistematicamente 5% de sua líquida em meses de "Acerto" para um cofre de reserva rápida, defensivamente.
      `;

      res.status(200).json({ auditReport: fallbackText, isFallback: true });
    }
  });

  // API Route for Extraordinary Financial Engineering Techniques (DuPont, DCF, Break-even, Working Capital)
  app.post("/api/ai/financial-engineering", async (req, res) => {
    try {
      const {
        technique,
        companyName,
        businessType,
        currentRevenues,
        currentExpenses,
        currentNetMargin,
        dupontStats,
        dcfStats,
        breakEvenStats,
        workingCapitalStats
      } = req.body;

      let statsSection = "";
      if (technique === "dupont") {
        statsSection = `
          MÉTODO OPERACIONAL SELECIONADO: ANÁLISE DUPONT TRIDIMENSIONAL
          Simulação do Usuário:
          - Margem Líquida Alcitativa: ${dupontStats?.netMargin}% (Real Atual: ${currentNetMargin.toFixed(1)}%)
          - Giro de Ativos: ${dupontStats?.assetTurnover}x
          - Multiplicador de Alavancagem Patrimonial: ${dupontStats?.equityMultiplier}x
          - ROA Resultante: ${dupontStats?.roa.toFixed(2)}%
          - ROE Resultante (Retorno Final): ${dupontStats?.roe.toFixed(2)}%
        `;
      } else if (technique === "dcf") {
        statsSection = `
          MÉTODO OPERACIONAL SELECIONADO: VALUATION POR FLUXO DE CAIXA DESCONTADO (DCF)
          Simulação do Usuário:
          - Faturamento Base Anualizado: R$ ${dcfStats?.annualizedBaseRevenue.toLocaleString('pt-BR')}
          - Crescimento Anual Estimado: ${dcfStats?.growth}%
          - WACC (Custo de Capital / Taxa de Desconto): ${dcfStats?.wacc}%
          - Margem EBITDA Projetada: ${dcfStats?.ebitdaMargin}%
          - Valor de Mercado Geral Estimado (Enterprise Value): R$ ${dcfStats?.impliedEnterpriseValue.toLocaleString('pt-BR')}
        `;
      } else if (technique === "breakeven") {
        statsSection = `
          MÉTODO OPERACIONAL SELECIONADO: PONTO DE EQUILÍBRIO METRICOMÉTRICO (BREAK-EVEN)
          Simulação do Usuário:
          - Custos Fixos Mensais (OPEX): R$ ${breakEvenStats?.fixedOpex.toLocaleString('pt-BR')}
          - Margem de Contribuição Média: ${breakEvenStats?.contribMarginPct}%
          - Ponto de Pura Sobrevivência (Break-even): R$ ${breakEvenStats?.breakEvenRevenue.toLocaleString('pt-BR')}
          - Faturamento Recomendável para Meta Margem Líquida de ${breakEvenStats?.targetA}%: R$ ${breakEvenStats?.revForTargetA.toLocaleString('pt-BR')}
          - Faturamento Recomendável para Meta Margem Líquida de ${breakEvenStats?.targetB}%: R$ ${breakEvenStats?.revForTargetB.toLocaleString('pt-BR')}
        `;
      } else {
        statsSection = `
          MÉTODO OPERACIONAL SELECIONADO: OTIMIZAÇÃO DO CICLO DE CAPITAL DE GIRO
          Simulação do Usuário:
          - Prazo de Recebimento de Clientes (DSO): ${workingCapitalStats?.dso} dias
          - Giro de Estoques / Atividades (DIO): ${workingCapitalStats?.dio} dias
          - Prazo Médio de Fornecedores (DPO): ${workingCapitalStats?.dpo} dias
          - Ciclo de Conversão de Caixa (CCC) Resultante: ${workingCapitalStats?.ccc} dias
        `;
      }

      const prompt = `
        Seu nome é Dafne. Você é uma analista financeira sênior extremamente brilhante e mentora técnica de faturamento empresarial. Seu tom é analítico, altamente estratégico, preciso, empático e prático.
        Escreva um parecer analítico de alta relevância técnica baseado na simulação de engenharia financeira configurada pelo proprietário da empresa "${companyName || 'Minha Empresa'}" (Nicho/Tipo: ${businessType || 'Geral'}).
        
        MÉTRICAS CORRENTES DO PERÍODO DO USUÁRIO:
        - Receita Registrada do Mês: R$ ${currentRevenues?.toLocaleString('pt-BR')}
        - Despesa Total Registrada do Mês: R$ ${currentExpenses?.toLocaleString('pt-BR')}
        - Margem Líquida Real Registrada: ${currentNetMargin?.toFixed(1)}%
        
        ESTATÍSTICAS DA SIMULAÇÃO CONFIGURADA:
        ${statsSection}

        INSTRUÇÕES DE ESCRITA (RESPONDA DIRETAMENTE EM MARKDOWN CLASSICO):
        Não utilize formatação HTML (somente cabeçalhos ### e listas tradicionais). Use termos financeiros precisos (ROE, WACC, EBITDA, Capex, DSO, DIO, DPO, Ponto de Equilíbrio, Margem de Contribuição). Estilize o texto de forma a destacar em negrito números importantes.
        Organize o relatório rigorosamente com estes três cabeçalhos (um para cada seção recomendada):
        ### COMPORTAMENTO DAS CONTAS
        Analise de forma cirúrgica os números da simulação atual versus o faturamento real do período. Explique a sensibilidade dos parâmetros escolhidos sobre a lucratividade final e debata se os índices simulados são realistas ou agressivos para o setor brasileiro em 2026.
        ### DIAGNÓSTICO MATEMÁTICO DAFNE
        Apresente as fórmulas técnicas aplicadas em alto nível analítico. Demonstre de forma prática como a variação de um determinado indicador (Ex: reduzir o DSO de recebimento em 10 dias ou otimizar em 2% sua margem de contribuição) desbloqueia liquidez imediata livre no fluxo de caixa ou maximiza a avaliação de mercado da empresa.
        ### PLANO DE AÇÃO E METAS TÁTICAS
        Aponte 3 diretrizes operacionais altamente acionáveis baseadas neste modelo financeiro de engenharia para que o empresário possa elevar seus índices de rentabilidade de forma consistente, focada e estrutural no dia a dia físico do negócio.
      `;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          temperature: 0.65,
        },
        ttlMs: 3 * 60 * 60 * 1000, // 3h cache for engineering calculations
        customApiKey: getCustomKeyFromRequest(req),
        model: getCustomModelFromRequest(req),
        neuralTier: "pro"
      });

      res.json({
        report: response.text
      });
    } catch (error: any) {
      console.warn("[Local Finance Engine] AI Financial Engineering temporariamente indisponível. Ativando faturamento automatizado de contingência:", error.message || error);
      
      const { technique, currentRevenues, currentExpenses, currentNetMargin } = req.body;
      const techniqueLabel = technique === "dupont" ? "Análise DuPont" : technique === "dcf" ? "Valuation de Fluxo de Caixa Descontado (DCF)" : technique === "breakeven" ? "Análise de Ponto de Equilíbrio (Break-Even)" : "Otimização de Capital de Giro e Ciclo de Conversão de Caixa";
      
      const fallbackReport = `
### COMPORTAMENTO DAS CONTAS

Análise estruturada e estratégica sob o modelo **${techniqueLabel}** para avaliar a saúde corporativa em contingência offline.
- **Faturamento Corrente:** R$ ${(Number(currentRevenues) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- **Despesas de Operação:** R$ ${(Number(currentExpenses) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- **Margem Líquida Estimada:** ${(Number(currentNetMargin) || 0).toFixed(1)}%

### DIAGNÓSTICO MATEMÁTICO DAFNE

Sob o regime simulado da técnica **${techniqueLabel}**, identificamos que pequenas calibrações de preço no mix de vendas e o encolhimento do prazo do contas a receber são as chaves fundamentais para liberar fluxo de caixa ocioso. Se a margem líquida elevar-se em **2.5%**, o retorno das operações aumentará drasticamente, blindando preventivamente a saúde financeira do seu capital social.

### PLANO DE AÇÃO E METAS TÁTICAS

1. **Otimização Estrutural de OPEX:** Identifique custos administrativos que crescem de forma oculta e reduza contratos de plataformas recorrentes em no mínimo 10%.
2. **Revisão de Prazos do Varejo:** Encurtar o prazo de recebimento aproximando-o de liquidações à vista (Pix/Cartão à vista) para acelerar o Ciclo CCC.
3. **Repactuação de Fornecedores:** Negociar prazos estendidos de faturamento de insumos junto a parceiros-chave sem cobrança oculta de taxas.
      `;
      
      res.json({
        report: fallbackReport,
        isFallback: true
      });
    }
  });

  // API Route for Custom Niche Growth Strategic Roadmap and interactive KPIs
  app.post("/api/ai/niche-growth-plan", async (req, res) => {
    try {
      const { financialData } = req.body;
      const userEmail = financialData?.userEmail || "";
      
      let businessSegment = financialData?.businessSegment || "other";
      let businessNicheDetail = financialData?.businessNicheDetail || "";
      const companyName = financialData?.companyName || "Minha Empresa";

      // AUTO-INTEGRATION FOR BURGER GOURMET / HAMBURGUERIA ARTISANAL NICHE OR MILKSHAKE
      if (userEmail === "cristianmilkymoo@gmail.com" || 
          (businessNicheDetail && (
            businessNicheDetail.toLowerCase().includes("hamburguer") || 
            businessNicheDetail.toLowerCase().includes("burger") || 
            businessNicheDetail.toLowerCase().includes("lanchonete") || 
            businessNicheDetail.toLowerCase().includes("smash") || 
            businessNicheDetail.toLowerCase().includes("milky") || 
            businessNicheDetail.toLowerCase().includes("milkshake")
          ))) {
        if (businessSegment === "other" || businessSegment === "general" || !businessSegment) {
          businessSegment = "food";
        }
        if (!businessNicheDetail || businessNicheDetail === "Geral / Prestação de Serviços" || businessNicheDetail === "Prestador Geral / Outro") {
          businessNicheDetail = "Hamburgueria Gourmet & Smash Burgers Premium (Burger Artisan)";
        }
      }
      
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
        console.warn("[Gemini Fallback Warning] Niche Growth Plan API Error (transient, using local fallback):", error.message || error);
      }
      // Premium resilient fallback so the application never breaks
      const businessNicheDetail = req.body.financialData?.businessNicheDetail || "Especializado";
      const businessSegment = req.body.financialData?.businessSegment || "other";
      const companyName = req.body.financialData?.companyName || "Minha Empresa";
      const income = Number(req.body.financialData?.income) || 0;
      const expense = Number(req.body.financialData?.expense) || 0;
      const balance = Number(req.body.financialData?.balance) || 0;
      const marginPct = income > 0 ? (balance / income) * 100 : 0;

      // Classify for targeted content inside elite fallback
      let segmentLabel = "Segmento Geral";
      let segmentKpi = "Giro de Capital de Giro";
      let segmentKpiDesc = "Calcula a velocidade de regeneração líquida do caixa comparada às saídas operacionais ocorrentes.";
      let segmentTarget = "Ciclo de conversão de caixa (CCC) de no máximo 45 dias.";

      if (businessSegment === "food") {
        segmentLabel = "Alimentação e Gastronomia";
        segmentKpi = "Controle Rígido de CMV (Custo de Mercadoria Vendida)";
        segmentKpiDesc = "Mede a fatia de receitas brutas gasta com insumos diretos consumidos na cozinha.";
        segmentTarget = "Sustentar o CMV real entre 28.0% a 32.5% do faturamento gerencial bruto.";
      } else if (businessSegment === "commerce" || businessSegment === "retail") {
        segmentLabel = "Varejo e E-commerce";
        segmentKpi = "Giro de Estoques e Capital Preso";
        segmentKpiDesc = "Determina o tempo médio em que o estoque residual fica parado sem converter em faturamento líquido.";
        segmentTarget = "Taxa de giro operacional acima de 6 vezes ao ano.";
      } else if (businessSegment === "services") {
        segmentLabel = "Prestação de Serviços e Clínicas";
        segmentKpi = "Capacidade Instalada Ociosa e Custo de Pessoal Direct (FTE)";
        segmentKpiDesc = "Avalia a relação de horas reais faturadas do time técnico em relação ao custo fixo total de folha e pro-labore.";
        segmentTarget = "Fator de aproveitamento técnico e eficiência de pessoal acima de 80%.";
      }

      res.json({
        nicheTitle: `Roteiro de Aceleração e Expansão: ${businessNicheDetail.toUpperCase()} (${segmentLabel.toUpperCase()})`,
        overview: `Análise estratégica consultiva elaborada para a empresa **${companyName}** mapeando ações cirúrgicas em resposta à margem líquida consolidada de **${marginPct.toFixed(1)}%**. Atuando em **${businessNicheDetail || segmentLabel}**, a alavancagem de rentabilidade requer sincronismo entre o canal de distribuição de maior margem de contribuição média e um OPEX enclausurado.`,
        kpis: [
          {
            name: segmentKpi,
            target: segmentTarget,
            howToMeasure: segmentKpiDesc
          },
          {
            name: "Margem de Contribuição Média por Categoria",
            target: "Manter média consolidada acima de 55% sobre o faturamento.",
            howToMeasure: "(Receita Bruta - Custos de Insumos - Impostos Variáveis) / Receita Bruta."
          },
          {
            name: "LTV / CAC (Coeficiente de Aquisição Comercial)",
            target: "Sustentar indicador LTV / CAC acima de 3.5x.",
            howToMeasure: "Faturamento médio acumulado gerado por novos contratos ou compras / investimento total de marketing e equipe de vendas."
          },
          {
            name: "Runway de Cobertura de Caixa",
            target: "Mínimo de 3 a 6 meses de despesas fixas depositadas.",
            howToMeasure: "Saldo de caixa acumulado / Despesa de OPEX fixo mensal."
          }
        ],
        milestones: [
          {
            title: "Fase 1: Auditoria Analítica, Calibração de Markup e Contenção de Vazões",
            actions: [
              {
                task: "Passo 1: Levantar e auditar detalhadamente as fichas técnicas de insumos ou matrizes de custo por hora técnica dos 5 serviços/produtos mais vendidos.",
                rationale: "Foca recursos em calibrar as margens de contribuição individuais onde se concentra 70% das receitas da empresa."
              },
              {
                task: "Passo 2: Iniciar auditoria completa em OPEX administrativo contratual (software de TI, seguros de escritório, tarifas de intermediação financeira e tarifas de adiantamento bancário).",
                rationale: "Despesas de suporte de retaguarda crescem paulatinamente e agem eliminando a lucratividade acumulada do caixa."
              },
              {
                task: "Passo 3: Mapear canais de distribuição de faturamento e instituir pequeno reajuste inteligente de preços entre 4% e 7% nos itens de baixa elasticidade.",
                rationale: "Melhora o ticket médio instantaneamente, alavancando a lucratividade final sem impactos significativos de perda de volume."
              }
            ]
          },
          {
            title: "Fase 2: Expansão Saudável, Maximização de LTV e Conversão de Receita Recorrente",
            actions: [
              {
                task: "Passo 1: Desenvolver planos ou combos de recompra programada a fim de incentivar taxas de fidelização e travar volume preditivo.",
                rationale: "Mitiga a necessidade e custo de marketing constante de aquisição para sustentar o fluxo de caixa básico."
              },
              {
                task: "Passo 2: Instituir metas de incentivo por desempenho comercial focado prioritariamente em mix de alta lucratividade em substituição ao volume bruto.",
                rationale: "Evita que prepostos ou equipe executiva vendam por impulso produtos deficitários de alto CMV estimulados por comissão errônea."
              }
            ]
          }
        ],
        tips: [
          {
            title: "O Ponto de Equilíbrio é o seu Norte de Sobrevivência",
            text: "Nunca busque reinvestimentos de expansão de capital ou contratações fixas estruturais adicionais sem antes comprovar margens de conversão de caixa resilientes no faturamento de base atual por pelo menos 90 dias ininterruptos."
          },
          {
            title: "Diferenciação Estrela vs. Abacaxi no Catálogo",
            text: "Audite a curva de margens no mínimo de forma mensal. Remova ou desestimule ativamente os itens classificados sob alta vazão física e baixa lucratividade real de contribuição."
          },
          {
            title: "Fidelização e Incentivos de Caixa à Vista",
            text: "O Pix e o recebimento à vista possuem custo financeiro infinitamente inferior às taxas exorbitantes de antecipações de recebíveis de cartões rotativos. Estimule saídas diretas incentivando Pix!"
          }
        ],
        isFallback: true
      });
    }
  });

  // API Route for Long Term Company Financial & Strategic Planning (1, 5, 10 Years)
  app.post("/api/ai/long-term-planning", async (req, res) => {
    try {
      const { financialData, params } = req.body;
      const businessSegment = financialData?.businessSegment || "other";
      const businessNicheDetail = financialData?.businessNicheDetail || "";
      const companyName = financialData?.companyName || "Minha Empresa";
      
      const growthRate = params?.growthRate || 15;
      const opexReduction = params?.opexReduction || 10;
      const marginTarget = params?.marginTarget || 25;
      const capexTarget = params?.capexTarget || 5;

      const prompt = `
        Aja como Dafne, mentora sênior de aceleração de lucros e planejamento corporativo de longo prazo.
        Crie um Planejamento Estratégico Corporativo de Longo Prazo (1, 5 e 10 Anos) para a empresa "${companyName}".

        ATUAÇÃO DE MERCADO: ${businessSegment.toUpperCase()}
        NICHO DETALHADO: ${businessNicheDetail || "Geral"}

        VALORES FINANCEIROS REAIS ATUAIS DO CLIENTE:
        - Receitas Totais Anualizadas (ou estimadas): R$ ${(financialData?.income || 0) * 12}
        - Despesas Totais Anualizadas: R$ ${(financialData?.expense || 0) * 12}
        - Margem de Lucro Recorrente: ${financialData?.income > 0 ? (((financialData?.balance || 0) / financialData.income) * 100).toFixed(1) : "0.0"}%

        PARÂMETROS DE ACELERAÇÃO CONFIGURADOS PELO USUÁRIO:
        - Meta de Crescimento de Receitas Anual: ${growthRate}% ao ano
        - Otimização de Custos Fixos (OPEX) Anual: ${opexReduction}% de redução de custos fixos adicionais ao ano
        - Margem Líquida Alvo de Longo Prazo: ${marginTarget}%
        - Investimento CAPEX em Expansão Anual: ${capexTarget}% do faturamento

        Gere um relatório abrangente, profissional e técnico que explique a jornada de 1 ano, 5 anos e 10 anos. Evite clichês vazios, foque nas ameaças do mercado real brasileiro de 2026 e em oportunidades competitivas.
        
        Você DEVE retornar obrigatoriamente um objeto JSON com o seguinte formato estrutural estrito:
        {
          "title": "Título Executivo Do Planejamento (ex: 'Plano de Consolidação de Longo Prazo - ${companyName}')",
          "intro": "Uma introdução executiva de alto nível que conecta o faturamento atual às projeções de 10 anos, com tom inspirador e ultra qualificado de assessoria financeira.",
          "year1Milestone": "Definição do maior marco operacional para o Ano 1 (curto prazo). O que deve ser blindado e resolvido.",
          "year1Directives": [
            "Diretriz estratégica 1 com foco em otimização de fluxo de caixa e capital de giro.",
            "Diretriz estratégica 2 com foco em corte de OPEX e fixação de markup saudável."
          ],
          "year5Milestone": "Definição do maior marco de escala para o Ano 5 (médio prazo). Como liderança de nicho, canais digitais ou expansão física/franquia.",
          "year5Directives": [
            "Diretriz estratégica 1 de escala operacional, contratação de novos líderes ou expansão de praça.",
            "Diretriz estratégica 2 sobre a maturação de produtos recorrentes de alta margem."
          ],
          "year10Milestone": "O legado e consolidação nacional/global para o Ano 10. Fusões, aquisições, governança corporativa ou consolidação patrimonial.",
          "year10Directives": [
            "Diretriz de governança corporativa, holding patrimonial ou sucessão estruturada.",
            "Diretriz para perenidade, captação ou avaliação para liquidez no futuro."
          ],
          "marketAnalysis": "Análise analítica profunda sobre as tendências do mercado nacional para o setor de ${businessSegment} em 2026/2030, incluindo inflação setorial, digitalização e IA.",
          "aiDirectives": [
            {
              "title": "Alavancagem Tecnológica de IA",
              "desc": "Como usar IA e automação para achatar custos operacionais nos próximos anos.",
              "priority": "ALTA"
            },
            {
              "title": "Mitigação Contratual e OPEX Fixo",
              "desc": "Conselhos para indexar custos contratuais com base na inflação setorial.",
              "priority": "MÉDIA"
            }
          ],
          "investmentSimulatorAdvise": "Diagnóstico do uso inteligente de CAPEX e caixa de reserva com base em taxas de juros no Brasil."
        }

        Retorne EXCLUSIVAMENTE o JSON estruturado acima. Tudo em Português do Brasil com excelente ortografia e extrema elegância corporativa.
      `;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
        ttlMs: 24 * 60 * 60 * 1000, 
        customApiKey: getCustomKeyFromRequest(req),
        model: getCustomModelFromRequest(req)
      });

      const result = safeParseJSON(response.text);
      res.json(result);
    } catch (error: any) {
      console.warn("[Gemini Fallback Warning] Long Term Planning API Error (transient, using local fallback):", error.message || error);
      // Premium resilient fallback so the application never breaks
      const companyName = req.body.financialData?.companyName || "Minha Empresa";
      res.json({
        title: `Estratégia de Expansão & Legado de 10 Anos: ${companyName}`,
        intro: "Plano estratégico de simulação local estruturado como plano de contingência para projeção de capital de 10 anos.",
        year1Milestone: "Sustentação de Margem e Estabilização de Caixa",
        year1Directives: [
          "Reduzir OPEX desnecessário em 10% nos primeiros 90 dias.",
          "Aumentar ticket médio em 5% calibrando combos e precificação.",
          "Instituir DRE semanal para controle ágil do Ponto de Equilíbrio."
        ],
        year5Milestone: "Domínio de Nicho Regional e Digitalização",
        year5Directives: [
          "Lançar novos canais digitais recorrentes com margem de lucro superior.",
          "Contratar média gerência técnica para liberação de horas do sócio controlador.",
          "Criar provisão patrimonial de caixa equivalente a 6 meses de custos operacionais fixos."
        ],
        year10Milestone: "Perenidade, Liderança Setorial e Governança",
        year10Directives: [
          "Inaugurar holding familiar ou holding operacional de investimentos variados.",
          "Consolidar liderança de marca em todo o território nacional como benchmark oficial de lucratividade.",
          "Promover automatização total do backoffice com inteligência e ferramentas automatizadas."
        ],
        marketAnalysis: "O ecossistema brasileiro exige margens elásticas e buffers de liquidez. O faturamento inflacionário deve ser combatido com reajuste periódico automático de markups e redução sistemática do CAC.",
        aiDirectives: [
          {
            title: "Uso do Copilot de IA Dafne",
            desc: "Audite suas contas de compras trimestralmente no módulo de IA para detecção ágil de desvios.",
            priority: "ALTA"
          }
        ],
        investmentSimulatorAdvise: "Nunca queime reservas operacionais líquidas em ativos de baixo giro. Priorize canais de distribuição eficientes."
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
        console.warn("[Gemini Fallback Warning] Store Comparison AI Error (transient, using local fallback):", error.message || error);
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
        console.warn("[Gemini Fallback Warning] Error in pricing-advisor endpoint (transient, using local fallback):", error.message || error);
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

  app.post("/api/ai/inventory-advisor", async (req, res) => {
    const { inventoryItems, products, profile } = req.body;
    try {
      const companyName = profile?.companyName || "Minha Empresa";
      
      const prompt = `
        Aja como Dafne, mentora de inteligência operacional de estoque e CMV da FinAI. Analise minuciosamente o estoque de insumos e matérias primas cadastrado pelo cliente da empresa "${companyName}".

        DADOS OPERACIONAIS DO NEGÓCIO:
        - Nome da Empresa: ${companyName}
        - Qtd de Insumos Cadastrados: ${Array.isArray(inventoryItems) ? inventoryItems.length : 0}

        INSUMOS CADASTRADOS EM ESTOQUE:
        ${Array.isArray(inventoryItems) && inventoryItems.length > 0 
          ? inventoryItems.map((i: any) => `- **${i.name}** [SKU: ${i.sku || 'N/A'}]: Qtd Atual: ${i.currentQuantity}${i.unit} | Mínimo Segurança: ${i.minQuantity}${i.unit} | Custo por ${i.unit}: R$ ${i.costPricePerUnit.toFixed(4)} | Situação: ${i.currentQuantity <= i.minQuantity ? "⚠️ BAIXO ESTOQUE / ABAIXO DO MÍNIMO" : "✅ Saudável"}`).join('\n')
          : "Nenhum insumo cadastrado ainda."}

        FICHA TÉCNICA E PRODUTOS CADASTRADOS (SE HOUVER):
        ${Array.isArray(products) && products.length > 0
          ? products.map((p: any) => `- **${p.name}** [SKU: ${p.sku || 'N/A'}] | Preço Venda: R$ ${p.sellingPrice.toFixed(2)} | Custo Real Entrada: R$ ${p.costPrice.toFixed(2)} | Receita Ficha Técnica: ${Array.isArray(p.recipe) && p.recipe.length > 0 ? p.recipe.map((r: any) => `${r.quantityNeeded}${inventoryItems.find((ii: any) => ii.id === r.inventoryItemId)?.unit || ""} de ${inventoryItems.find((ii: any) => ii.id === r.inventoryItemId)?.name || r.inventoryItemId}`).join(", ") : "Sem insumos vinculados ainda."}`).join('\n')
          : "Nenhum produto cadastrado."}

        Sua tarefa é gerar uma Análise de Estoque e Diagnóstico de CMV cirúrgica, acionável e com grande profundidade em Markdown estruturado, cobrindo:
        1. ### ⚠️ Alerta de Insumos Críticos
           - Identifique imediatamente quais insumos estão abaixo do limite mínimo de segurança e correm risco imediato de ruptura de abastecimento.
           - Proponha ações ágeis de contato com fornecedores e reabastecimento.
        2. ### 📉 Impacto no CMV & Rentabilidade Real
           - Explique de forma prática como a flutuação dos custos desses insumos críticos afeta o CMV e a margem de lucro líquido dos produtos finais.
           - Faça as contas e aponte se o custo real de ingredientes bate com o "Custo de Entrada" cadastrado no preço do produto.
        3. ### 💡 Plano de Compras e Gestão de Lotes
           - Dê conselhos práticos específicos para este nicho para barganhar preço, otimizar fretes e gerir estoque para que nunca falte insumo e as margens subam.

        Mantenha um tom profissional, estratégico, empático e realista como Dafne, a mentora de crescimento financeiro. FORMATO DE LEITURA DINÂMICA: Retorne o parecer de forma extremamente direta, objetiva, prática, amigável e com fácil entendimento. Use parágrafos curtos, listas e destaque as principais métricas e termos em NEGRITO.
      `;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          systemInstruction: "Você é Dafne, mentora de inteligência operacional de estoque e CMV da FinAI.",
        },
        customApiKey: getCustomKeyFromRequest(req),
        model: getCustomModelFromRequest(req)
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error(error);
      
      // Fallback em caso de falha de cota, etc.
      let fallbackText = "### 📋 Diagnóstico Prático de Estoque (Fallback)\n\n";
      const criticallyLow = Array.isArray(inventoryItems) ? inventoryItems.filter((i: any) => i.currentQuantity <= i.minQuantity) : [];
      
      if (criticallyLow.length > 0) {
        fallbackText += "#### ⚠️ Alerta de Ruptura de Estoque Imediata!\n\nOs seguintes insumos estão abaixo da quantidade de segurança:\n";
        criticallyLow.forEach((i: any) => {
          fallbackText += `- **${i.name}**: Quantidade atual de ${i.currentQuantity}${i.unit} (Mínimo recomendado: ${i.minQuantity}${i.unit}).\n`;
        });
        fallbackText += "\n**Recomendação**: Entre em contato com fornecedores principais nas próximas 24h para reabastecer estes itens e evitar paralisação das vendas da empresa.\n\n";
      } else {
        fallbackText += "✅ **Todos os insumos estão em níveis operacionais saudáveis!** Parabéns, o giro de estoque está calibrado.\n\n";
      }
      
      fallbackText += "### 🎯 Otimização de CMV\n- Mantenha as fichas técnicas atualizadas em relação aos preços de compra.\n- Quando comprar em maior escala, repasse a economia para melhorar a margem ou criar promoções de grande escala.\n";
      
      res.json({ text: fallbackText, isFallback: true });
    }
  });

  function extractPortugueseMoney(text: string): number | null {
    const clean = (text || "").toLowerCase();
    const regex = /(?:r\$|rs|\$)?\s*([0-9]+[0-9.,]*)/gi;
    let match;
    let candidates: number[] = [];
    
    while ((match = regex.exec(clean)) !== null) {
      let rawNum = match[1];
      while (rawNum && /[.,]/.test(rawNum[rawNum.length - 1])) {
        rawNum = rawNum.slice(0, -1);
      }
      if (!rawNum) continue;
      
      if (rawNum.includes(".") && rawNum.includes(",")) {
        const dotIdx = rawNum.lastIndexOf(".");
        const commaIdx = rawNum.lastIndexOf(",");
        if (commaIdx > dotIdx) {
          const normalized = rawNum.replace(/\./g, "").replace(",", ".");
          const val = parseFloat(normalized);
          if (!isNaN(val)) candidates.push(val);
        } else {
          const normalized = rawNum.replace(/,/g, "");
          const val = parseFloat(normalized);
          if (!isNaN(val)) candidates.push(val);
        }
      } else if (rawNum.includes(",")) {
        const parts = rawNum.split(",");
        if (parts.length === 2 && parts[1].length === 2) {
          const normalized = rawNum.replace(",", ".");
          const val = parseFloat(normalized);
          if (!isNaN(val)) candidates.push(val);
        } else if (parts.length === 2 && parts[1].length === 3) {
          const normalized = rawNum.replace(",", "");
          const val = parseFloat(normalized);
          if (!isNaN(val)) candidates.push(val);
        } else {
          const normalized = rawNum.replace(",", ".");
          const val = parseFloat(normalized);
          if (!isNaN(val)) candidates.push(val);
        }
      } else if (rawNum.includes(".")) {
        const parts = rawNum.split(".");
        if (parts.length === 2 && parts[1].length === 3) {
          const normalized = rawNum.replace(/\./g, "");
          const val = parseFloat(normalized);
          if (!isNaN(val)) candidates.push(val);
        } else {
          const val = parseFloat(rawNum);
          if (!isNaN(val)) candidates.push(val);
        }
      } else {
        const val = parseFloat(rawNum);
        if (!isNaN(val)) candidates.push(val);
      }
    }
    
    return candidates.length > 0 ? candidates[0] : null;
  }

  function parseTransactionLocally(message: string): any {
    const lower = (message || "").toLowerCase();
    
    // Prevent transactional parsing if the user is asking an analytical, conversational, or educational question
    const analyticalKeywords = [
      "analise", "análise", "analisar",
      "audita", "auditar", "auditoria",
      "relatorio", "relatório",
      "sugestao", "sugestão", "sugestões", "sugestoes",
      "dica", "dicas",
      "como", "por que", "porque", "qual", "quais", "quanto", "quantos",
      "explicar", "explica", "entender", "compreender",
      "ajuda", "ajudar", "ajude",
      "revisar", "revisao", "revisão",
      "diagnostico", "diagnóstico",
      "consultoria", "conselho", "conselhos",
      "planejamento", "plano", "planos",
      "meta", "metas",
      "comparar", "comparacao", "comparação", "comparacoes", "comparações",
      "pergunta", "perguntas", "duvida", "dúvida", "duvidas", "dúvidas"
    ];
    if (analyticalKeywords.some(kw => lower.includes(kw))) {
      return null;
    }
    
    const amount = extractPortugueseMoney(lower);
    if (!amount || amount <= 0) return null;
    
    // Comprehensive expense indicators (verbs and nouns commonly spoken or written)
    const isExpense = lower.includes("paguei") || lower.includes("pagou") || lower.includes("pago") || 
                      lower.includes("pagar") || lower.includes("pagamento") || lower.includes("pagamentos") ||
                      lower.includes("gastei") || lower.includes("gastou") || lower.includes("gasto") || lower.includes("gastos") ||
                      lower.includes("custo") || lower.includes("custos") || 
                      lower.includes("despesa") || lower.includes("despesas") ||
                      lower.includes("compra") || lower.includes("compras") || lower.includes("comprei") || lower.includes("comprou") ||
                      lower.includes("perdi") || lower.includes("perda") || lower.includes("perdas") ||
                      lower.includes("insumo") || lower.includes("insumos") ||
                      lower.includes("fatura") || lower.includes("faturas") ||
                      lower.includes("frete") || lower.includes("fretes") || lower.includes("entrega") || lower.includes("entregas") ||
                      lower.includes("saída") || lower.includes("saida") || lower.includes("saídas") || lower.includes("saidas") ||
                      lower.includes("mensalidade") || lower.includes("mensalidades") ||
                      lower.includes("taxa") || lower.includes("taxas") || lower.includes("tarifa") || lower.includes("tarifas") ||
                      lower.includes("imposto") || lower.includes("impostos") || lower.includes("simples nacional") || lower.includes("das") ||
                      lower.includes("aluguel") || lower.includes("luz") || lower.includes("água") || lower.includes("agua") || 
                      lower.includes("energia") || lower.includes("internet") || lower.includes("telefone") ||
                      lower.includes("salário") || lower.includes("salario") || lower.includes("salários") || lower.includes("salarios") ||
                      lower.includes("pró-labore") || lower.includes("pro-labore") || lower.includes("pro labore") ||
                      lower.includes("anúncio") || lower.includes("anuncio") || lower.includes("anúncios") || lower.includes("anuncios") || 
                      lower.includes("marketing") || lower.includes("ads") || lower.includes("facebook") || lower.includes("instagram") ||
                      lower.includes("software") || lower.includes("sistema") || lower.includes("api") || lower.includes("tokens") ||
                      lower.includes("embalagem") || lower.includes("embalagens") || lower.includes("sacola") || lower.includes("sacolas") ||
                      lower.includes("caixa") || lower.includes("caixas") || lower.includes("lacre") || lower.includes("lacres") ||
                      lower.includes("conserto") || lower.includes("consertos") || lower.includes("reparo") || lower.includes("reparos") ||
                      lower.includes("manutenção") || lower.includes("manutencao") || lower.includes("reforma") ||
                      lower.includes("contador") || lower.includes("contabilidade") || lower.includes("contábil") || lower.includes("contabil") ||
                      lower.includes("curso") || lower.includes("cursos") || lower.includes("treinamento") || lower.includes("treinamentos") ||
                      lower.includes("brinde") || lower.includes("brindes") || lower.includes("mimo") || lower.includes("mimos") ||
                      lower.includes("investimento") || lower.includes("investimentos") || lower.includes("máquina") || lower.includes("maquina") ||
                      lower.includes("computador") || lower.includes("notebook") || lower.includes("celular") || lower.includes("equipamento");

    // Comprehensive income indicators (verbs and nouns commonly spoken or written)
    const isRevenue = lower.includes("venda") || lower.includes("vendeu") || lower.includes("vendas") || lower.includes("vendi") || 
                      lower.includes("recebi") || lower.includes("recebeu") || lower.includes("recebimento") || lower.includes("recebimentos") ||
                      lower.includes("faturei") || lower.includes("faturou") || lower.includes("faturamento") ||
                      lower.includes("ganhei") || lower.includes("ganhou") || 
                      lower.includes("receita") || lower.includes("receitas") ||
                      lower.includes("entrada") || lower.includes("entradas");
    
    if (isRevenue) {
      let categoryName = "Venda de Produtos";
      if (lower.includes("serviço") || lower.includes("servico") || lower.includes("serviços") || lower.includes("servicos") || lower.includes("consultoria")) {
        categoryName = "Prestação de Serviços";
      }
      return {
        description: `Venda registrada automaticamente`,
        amount,
        type: "income",
        categoryName
      };
    } else if (isExpense) {
      let categoryName = "Compra de Mercadoria";
      if (lower.includes("insumo") || lower.includes("insumos") || lower.includes("matéria prima") || lower.includes("materia prima")) {
        categoryName = "Compra de Mercadoria";
      } else if (lower.includes("luz") || lower.includes("energia") || lower.includes("água") || lower.includes("agua") || lower.includes("utilidade") || lower.includes("internet") || lower.includes("telefone")) {
        categoryName = "Energia / Água / Utilidades";
      } else if (lower.includes("anúncio") || lower.includes("anuncio") || lower.includes("anúncios") || lower.includes("anuncios") || lower.includes("marketing") || lower.includes("insta") || lower.includes("facebook") || lower.includes("ads")) {
        categoryName = "Marketing / Tráfego Pago";
      } else if (lower.includes("aluguel") || lower.includes("escritório") || lower.includes("galpão") || lower.includes("galpao")) {
        categoryName = "Aluguel Escritório / Galpão";
      } else if (lower.includes("frete") || lower.includes("entrega") || lower.includes("entregas") || lower.includes("logística") || lower.includes("logistica")) {
        // Distinguish courier/apps from bulk shipping
        if (lower.includes("ifood") || lower.includes("rappi") || lower.includes("loggi") || lower.includes("motoboy") || lower.includes("entregador") || lower.includes("entregadores")) {
          categoryName = "Logística, Entregadores e APPs";
        } else {
          categoryName = "Fretes";
        }
      } else if (lower.includes("das") || lower.includes("simples") || lower.includes("imposto") || lower.includes("impostos")) {
        if (lower.includes("iss") || lower.includes("iptu") || lower.includes("prefeitura") || lower.includes("municipal")) {
          categoryName = "Impostos Municipais (ISS/IPTU)";
        } else {
          categoryName = "DAS / Simples Nacional";
        }
      } else if (lower.includes("salário") || lower.includes("salario") || lower.includes("salários") || lower.includes("salarios") || lower.includes("pró-labore") || lower.includes("pro-labore") || lower.includes("pro labore") || lower.includes("encargos") || lower.includes("fgts") || lower.includes("inss") || lower.includes("folha")) {
        categoryName = "Salários e Encargos";
      } else if (lower.includes("nuvem") || lower.includes("cloud") || lower.includes("aws") || lower.includes("hosting") || lower.includes("servidor") || lower.includes("servidores") || lower.includes("heroku") || lower.includes("cloud run") || lower.includes("infraestrutura")) {
        categoryName = "Infraestrutura de Nuvem / Servidores";
      } else if (lower.includes("software") || lower.includes("sistema") || lower.includes("saas") || lower.includes("mensalidade") || lower.includes("assinatura") || lower.includes("hospedagem")) {
        categoryName = "Software / Assinaturas SaaS";
      } else if (lower.includes("tarifa") || lower.includes("tarifas") || lower.includes("taxa") || lower.includes("taxas") || lower.includes("banco") || lower.includes("bancária") || lower.includes("bancaria") || lower.includes("gateway") || lower.includes("maquininha") || lower.includes("máquina de cartão") || lower.includes("taxas de cartão")) {
        categoryName = "Tarifas Bancárias e Gateway";
      } else if (lower.includes("api") || lower.includes("openai") || lower.includes("gemini") || lower.includes("tokens") || lower.includes("inteligência") || lower.includes("inteligencia") || lower.includes("ia") || lower.includes("i.a.")) {
        categoryName = "Modelos e APIs de I.A. (OpenAI, Gemini)";
      } else if (lower.includes("embalagem") || lower.includes("embalagens") || lower.includes("sacola") || lower.includes("sacolas") || lower.includes("caixa") || lower.includes("caixas") || lower.includes("lacre") || lower.includes("lacres") || lower.includes("sacola de envio") || lower.includes("papelaria")) {
        categoryName = "Embalagens e Lacres de Segurança";
      } else if (lower.includes("conserto") || lower.includes("consertos") || lower.includes("reparo") || lower.includes("reparos") || lower.includes("manutenção") || lower.includes("manutencao") || lower.includes("reforma")) {
        categoryName = "Insumos de Manutenção e Reparos";
      } else if (lower.includes("contador") || lower.includes("contabilidade") || lower.includes("contábil") || lower.includes("contabil") || lower.includes("honorários") || lower.includes("honorarios") || lower.includes("fiscal")) {
        categoryName = "Honorários Contábeis e Fiscal";
      } else if (lower.includes("curso") || lower.includes("cursos") || lower.includes("treinamento") || lower.includes("treinamentos") || lower.includes("capacitação") || lower.includes("capacitacao") || lower.includes("mentoria") || lower.includes("mentorias")) {
        categoryName = "Treinamento e Capacitação Técnica";
      } else if (lower.includes("brinde") || lower.includes("brindes") || lower.includes("agrado") || lower.includes("agrados") || lower.includes("mimo") || lower.includes("mimos") || lower.includes("cortesia") || lower.includes("customer success") || lower.includes("sucesso do cliente")) {
        categoryName = "Brindes & Sucesso do Cliente (CS)";
      } else if (lower.includes("investimento") || lower.includes("investimentos") || lower.includes("máquina") || lower.includes("maquina") || lower.includes("máquinas") || lower.includes("maquinas") || lower.includes("computador") || lower.includes("notebook") || lower.includes("celular") || lower.includes("computadores") || lower.includes("notebooks") || lower.includes("celulares") || lower.includes("pc")) {
        categoryName = "Investimentos";
      }
      return {
        description: `Despesa registrada automaticamente`,
        amount,
        type: "expense",
        categoryName
      };
    }
    return null;
  }

  // Shared domain database of financial technical terms for AIs quick support
  const financialTechnicalGlossary = `
====== DICIONÁRIO E DOMÍNIO DE TERMOS TÉCNICOS FINANCEIROS (COGNITION ENGINE) ======
Sempre que o usuário perguntar sobre, citar ou solicitar suporte rápido para algum destes termos, utilize as seguintes definições corporativas de alta precisão técnica:

1. EBITDA (Lajida - Lucro Antes de Juros, Impostos, Depreciação e Amortização):
   - Conceito: Mede o fluxo de caixa gerado unicamente pela operação central do negócio, excluindo efeitos de alavancagem financeira (juros), decisões fiscais (impostos) e contabilidade de bens (depreciação). É a métrica mais pura de produtividade.
   - Fórmula: EBITDA = Lucro Operacional Líquido + Impostos + Juros + Depreciação + Amortização.
   - Analogia: É o "motor" do seu carro antes de considerar o peso das bagagens, do IPVA ou do financiamento. Avalia se o motor é potente por si só.
   - Aplicação Prática: Avalie o EBITDA do usuário e aponte se as despesas de estrutura (OPEX) estão drenando a rentabilidade antes de impostos.

2. Margem de Contribuição:
   - Conceito: Representa o ganho líquido unitário ou consolidado após deduzir custos e despesas diretamente variáveis (como matéria-prima, impostos e gateway de cartões). Indica quanto sobra de cada real faturado para "contribuir" para pagar os custos fixos da empresa.
   - Fórmula: Margem de Contribuição = Receita - (Custos Variáveis + Despesas Variáveis). Em %: (Receita - Var) / Receita * 100.
   - Analogia: Se você vende um churros por R$ 10, e os ingredientes e a taxa de cartão dele custam R$ 4, sobram R$ 6. Esses R$ 6 são a margem que ajuda a pagar o aluguel do carrinho no fim do mês.
   - Aplicação Prática: Cruzar com o markup de catálogo de produtos do usuário para demonstrar quais trazem maior retorno à estrutura fixa.

3. Ponto de Equilíbrio (Breakeven Point):
   - Conceito: O patamar de faturamento mínimo mensal onde a receita total iguala-se ao total acumulado de despesas fixas e variáveis. É o famoso "zero a zero", o divisor de águas entre o prejuízo e o lucro real do negócio.
   - Fórmula: Ponto de Equilíbrio = Despesas Fixas Totais / (Margem de Contribuição em %).
   - Analogia: É a profundidade que você precisa nadar para cima para que sua cabeça saia da água e você consiga respirar. Todo faturamento acima é oxigênio puro.
   - Aplicação Prática: Calcule o Breakeven do empresário com base nas contas do mês atual e compare de forma assertiva com a sua receita diária.

4. Runway (Sobrevivência Financeira de Caixa):
   - Conceito: Período remanescente de sobrevivência operacional que o caixa da empresa aguenta funcionar caso o faturamento venha a zero amanhã. É a blindagem de liquidez de emergência.
   - Fórmula: Runway (em meses) = Saldo de Caixa Total Atual / Despesa Mensal Média (ou Burn Rate).
   - Analogia: O oxigênio restante no tanque de um mergulhador se ele parar de receber ar da superfície.
   - Aplicação Prática: Se o saldo atual e as despesas indicarem sobrevivência limitada, comente diretamente o runway operacional em meses para alertar em caso de sazonais.

5. Markup:
   - Conceito: Índice multiplicador aplicado sobre o custo direto unitário de aquisição/produção para determinar o preço de venda seguro e lucrativo, integrando margem de lucro projetada, despesas gerais e encargos tributários incidentes.
   - Fórmula: Markup = Preço de Venda / Custo Direto (ou Markup Multiplicador = 1 / [1 - (Despesas Fixas % + Despesas Variáveis % + Margem de Lucro Pretendida %)]).
   - Analogia: "Eu compro por R$ 10 e vendo por R$ 25, o que quer dizer que meu multiplicador Markup é de 2.5."
   - Aplicação Prática: Verifique o markup médio de catálogo do usuário e sugira ajustes se estiverem vendendo sem embutir os impostos e taxas de cartão!

6. OPEX (Operational Expenditure - Despesa de Operação):
   - Conceito: Gastos ordinários cotidianos requeridos para manter a infraestrutura gerencial e operacional ativa (aluguel, softwares, canais digitais, luz, taxas administrativas, assessoria contábil).
   - Analogia: A ração diária que alimenta o seu negócio para que ele continue de pé.
   - Aplicação Prática: Cite as principais categorias de despesas fixas dele registradas no DRE para ilustrar caminhos pragmáticos de otimização de OPEX.

7. CAPEX (Capital Expenditure - Investimento de Capital):
   - Conceito: Inversões e aportes em ativos estruturais duradouros com ciclo de vida plurianual (compra de máquinas CNC, computadores portáteis de última geração, móveis para nova sede, renovação estrutural da empresa).
   - Analogia: Comprar a casa própria ao invés de pagar o aluguel mensal. É um investimento patrimonial de longo prazo.

8. Lucratividade vs Rentabilidade:
   - Conceito: Lucratividade avalia a eficiência de venda do negócio (o percentual de faturamento líquido que virou lucro limpo, ex: lucrou R$ 15 em R$ 100 faturados = 15% de Lucratividade). Rentabilidade avalia o retorno do investimento do empresário (o percentual do capital inicial investido na empresa que retornou em forma de dividendos reais).
   - Analogia: Lucratividade diz se a sua pescaria gerou muitos peixes proporcionalmente à isca usada; Rentabilidade diz se o valor do barco valeu a pena para a pescaria toda.

9. CMV (Custo de Mercadoria Vendida) / CPV (Custo de Produto Vendido):
   - Conceito: Custo financeiro necessário para obter as matérias-primas e os recursos principais para a revenda ou manufatura de cada item vendido (insumos, farinha de trigo, embalagens diretas, estoque de peças).
   - Fórmula: CMV = Estoque Inicial + Compras - Estoque Final.
   - Analogia: O que você gasta especificamente para colocar o produto na prateleira pronto para as vendas.
   - Aplicação Prática: Avaliar se o CMV dele está consumindo mais de 40% da receita operacional bruta do DRE.

====================================================================================
DIRETRIZ DE SUPORTE SUPRA-NÍVEL DE TERMOS:
Sempre que uma destas palavras for mencionada, ou diante de dúvidas de termos técnicos financeiros, você deve oferecer uma resposta rápida com o conceito direto, a lógica matemática simplificada e de imediato correlacionar com a realidade atual do negócio dele, ajudando-o a auditar ou calibrar este indicador instantaneamente.
`;

  // API Route for conversational chat with Dafne
  app.post("/api/ai/chat-dafne", async (req, res) => {
    try {
      const { message, history, financialData, neuralPrecision, neuralTier, enableTransactionParsing, personaId, customDirectives } = req.body;
      const userEmail = financialData?.userEmail || "";
      
      let businessSegment = financialData?.businessSegment || "other";
      let businessNicheDetail = financialData?.businessNicheDetail || "";

      // AUTO-INTEGRATION FOR BURGER GOURMET / HAMBURGUERIA ARTISANAL NICHE OR MILKSHAKE
      if (userEmail === "cristianmilkymoo@gmail.com" || 
          (businessNicheDetail && (
            businessNicheDetail.toLowerCase().includes("hamburguer") || 
            businessNicheDetail.toLowerCase().includes("burger") || 
            businessNicheDetail.toLowerCase().includes("lanchonete") || 
            businessNicheDetail.toLowerCase().includes("smash") || 
            businessNicheDetail.toLowerCase().includes("milky") || 
            businessNicheDetail.toLowerCase().includes("milkshake")
          ))) {
        if (businessSegment === "other" || businessSegment === "general" || !businessSegment) {
          businessSegment = "food";
        }
        if (!businessNicheDetail || businessNicheDetail === "Prestador Geral / Outro") {
          businessNicheDetail = "Hamburgueria Gourmet & Smash Burgers Premium (Burger Artisan)";
        }
      }
      
      const temperature = neuralPrecision !== undefined ? Number(neuralPrecision) : 0.7;
      
      // AUTO-DETECTION OF FINTECH ACTION & TRANSACTION INTENT
      const lowerMsg = (message || "").toLowerCase();
      const isGoalsLauncher = lowerMsg.includes("goals-launcher") || lowerMsg.includes("[ação sistema id: goals-launcher]");
      
      let dynamicTransactionParsing = false;
      const hasNumberWord = /\b(um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez|cem|cento|mil|milhao|milhão|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecentos|reais|real)\b/i.test(lowerMsg);
      const hasNumber = /[0-9]/.test(lowerMsg) || hasNumberWord;
      const isRegistrationKeyword = lowerMsg.includes("registra") || lowerMsg.includes("registrar") ||
                                    lowerMsg.includes("lança") || lowerMsg.includes("lanç") || lowerMsg.includes("lancar") ||
                                    lowerMsg.includes("anota") || lowerMsg.includes("anotar") ||
                                    lowerMsg.includes("adiciona") || lowerMsg.includes("adicionar") ||
                                    lowerMsg.includes("gastei") || lowerMsg.includes("gastou") || lowerMsg.includes("gasto") || lowerMsg.includes("gastos") ||
                                    lowerMsg.includes("custo") || lowerMsg.includes("custos") || 
                                    lowerMsg.includes("despesa") || lowerMsg.includes("despesas") ||
                                    lowerMsg.includes("paguei") || lowerMsg.includes("pagou") || lowerMsg.includes("pago") || lowerMsg.includes("pagamento") || lowerMsg.includes("pagamentos") ||
                                    lowerMsg.includes("vendi") || lowerMsg.includes("vendeu") || lowerMsg.includes("venda") || lowerMsg.includes("vendas") ||
                                    lowerMsg.includes("recebi") || lowerMsg.includes("recebeu") || lowerMsg.includes("recebimento") || lowerMsg.includes("recebimentos") ||
                                    lowerMsg.includes("faturei") || lowerMsg.includes("faturou") || lowerMsg.includes("faturamento") ||
                                    lowerMsg.includes("compra") || lowerMsg.includes("comprei") || lowerMsg.includes("comprou") ||
                                    lowerMsg.includes("entrada") || lowerMsg.includes("entradas") ||
                                    lowerMsg.includes("saída") || lowerMsg.includes("saidas") || lowerMsg.includes("saida");

      // Prevent transactional parsing if the user is asking an analytical, conversational, or educational question
      const analyticalKeywords = [
        "analise", "análise", "analisar",
        "audita", "auditar", "auditoria",
        "relatorio", "relatório",
        "sugestao", "sugestão", "sugestões", "sugestoes",
        "dica", "dicas",
        "como", "por que", "porque", "qual", "quais", "quanto", "quantos",
        "explicar", "explica", "entender", "compreender",
        "ajuda", "ajudar", "ajude", "help",
        "revisar", "revisao", "revisão",
        "diagnostico", "diagnóstico",
        "consultoria", "conselho", "conselhos",
        "planejamento", "plano", "planos",
        "meta", "metas",
        "comparar", "comparacao", "comparação", "comparacoes", "comparações",
        "pergunta", "perguntas", "duvida", "dúvida", "duvidas", "dúvidas"
      ];
      
      const isAnalyticalQuery = analyticalKeywords.some(keyword => lowerMsg.includes(keyword));
                                    
      if (!isGoalsLauncher && hasNumber && isRegistrationKeyword && !isAnalyticalQuery) {
        dynamicTransactionParsing = true;
      }

      // HIGH-SPEED ZERO-LATENCY INSTANT ROUTER FOR OBVIOUS TRANSACTION LAUNCHES
      if (dynamicTransactionParsing) {
        const localParsed = parseTransactionLocally(message);
        if (localParsed) {
          const DafneSpeeches = [
            `Perfeito! Registrei esse lançamento de **R$ ${localParsed.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** sob a categoria **${localParsed.categoryName}** com absoluto rigor. Seu DRE e saldo de caixa foram sincronizados em menos de 10ms!`,
            `Entendido! Acabei de lançar o(a) **${localParsed.categoryName}** no valor exato de **R$ ${localParsed.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** em nosso banco de dados. Como estrategista de margem, já recomputed seus demonstrativos fiscais.`,
            `Pronto! Lancei com absoluto sucesso a transação de **R$ ${localParsed.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** na categoria **${localParsed.categoryName}** para controle fino da liquidez. O painel financeiro já reprocessou as análises corporativas!`,
            `Concluído! A transação de **R$ ${localParsed.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** foi adicionada com sucesso na conta de **${localParsed.categoryName}**. Mapear 100% das suas entradas e saídas evita o desperdício invisível!`
          ];
          const chosenText = DafneSpeeches[Math.floor(Math.random() * DafneSpeeches.length)];

          console.log(`[Dafne Fast Router] Instant local transaction registration triggered for: "${message}". Responding in 0ms!`);
          return res.json({
            text: chosenText,
            detectedTransaction: localParsed,
            strategicDiagnosis: null,
            simulatedTier: "high-speed-local-dafne",
            simulatedTemp: 0.1
          });
        }
      }
      
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

      // DETERMINISTIC FINANCIAL ALGORITHMS (AI MOTOR IA BOOSTERS)
      const profitMarginPct = incomeValue > 0 ? ((incomeValue - expenseValue) / incomeValue * 100) : 0;
      const runwayMonths = (expenseValue > 0 && balanceValue > 0 && incomeValue < expenseValue)
        ? (balanceValue / (expenseValue - incomeValue))
        : null;
      const growthGap = billingGoal > averageBilling ? (billingGoal - averageBilling) : 0;
      const gapPct = averageBilling > 0 ? (growthGap / averageBilling * 100) : 0;

      const dreText = financialData?.dre && financialData.dre.length > 0 
        ? financialData.dre.map((d: any) => `- ${d.label}: R$ ${Number(d.value).toLocaleString('pt-BR')}`).join('\n')
        : "Nenhum detalhamento do DRE fornecido no momento.";

      const groupExpensesText = financialData?.categoryGroupExpenses
        ? `- Custo de Vendas (COGS/CPV): R$ ${Number(financialData.categoryGroupExpenses.COGS || 0).toLocaleString('pt-BR')}\n- Despesas Operacionais (OPEX): R$ ${Number(financialData.categoryGroupExpenses.OPEX || 0).toLocaleString('pt-BR')}\n- Impostos (TAX): R$ ${Number(financialData.categoryGroupExpenses.TAX || 0).toLocaleString('pt-BR')}\n- Investimentos: R$ ${Number(financialData.categoryGroupExpenses.INVESTMENT || 0).toLocaleString('pt-BR')}\n- Outras Despesas: R$ ${Number(financialData.categoryGroupExpenses.OTHER_EXPENSE || 0).toLocaleString('pt-BR')}`
        : "Nenhum valor agrupado de despesas fornecido.";

      const topExpensesText = financialData?.topExpenseCategories && financialData.topExpenseCategories.length > 0
        ? financialData.topExpenseCategories.map((c: any) => `- ${c.name}: R$ ${Number(c.amount).toLocaleString('pt-BR')}`).join('\n')
        : "Nenhuma categoria de despesa registrada.";

      const userProducts = financialData?.products || [];
      const userProductsText = userProducts.length > 0
        ? userProducts.map((p: any) => `- ID: "${p.id}", Nome: "${p.name}", Preço de Venda: R$ ${p.sellingPrice.toFixed(2)}, Custo (CMV): R$ ${p.costPrice.toFixed(2)}, Margem de Lucro: ${p.profitMarginPct ? p.profitMarginPct.toFixed(1) : ((1 - (p.costPrice/p.sellingPrice || 0)) * 100).toFixed(1)}%`).join('\n')
        : "Nenhum produto cadastrado.";

      let systemPrompt = "";
      if (isGoalsLauncher) {
        systemPrompt = `
          Você é Dafne, a estrategista financeira e gerenciadora de cofrinhos corporativos.
          Seu objetivo único agora é ler a mensagem recebida e processar o comando de metas, retornando o formato estrito de colchetes pedido se aplicável, seguido de um feedback motivador e técnico muito curto de 2 linhas recomendando a reserva de emergência e contenção de vazamentos do OPEX.
          Mensagem recebida do sistema: "${message}"

          FORMATOS SUPORTADOS:
          1. [CMD_CREATE: NOME_DA_META; VALOR_ALVO; VALOR_INICIAL]
          2. [CMD_APORTE: NOME_DA_META_SISTEMA; VALOR_DO_APORTE]

          Apenas retorne o comando em colchetes se identificar uma intenção explícita de criar/lançar meta ou depositar/aportar. Caso contrário, dê apenas um conselho financeiro síncrono acolhedor.
          Seja extremamente rápida, direta ao ponto e responda com pouquíssimos tokens para garantir velocidade sub-segundo!
        `;
      } else if (dynamicTransactionParsing) {
        systemPrompt = `
          Você é Dafne (Modo Lançamento Rápido), a estrategista de margens de lucro dedicada a registrar e gerenciar transações financeiras para microempresas e pequenos empresários brasileiros.
          Seu tom é ágil, focado em ação prática e imediata.
          Sua principal missão é analisar a mensagem inserida pelo usuário (podendo ser fruto de voz ou digitação direta) e interpretar se ele está relatando uma transação financeira a ser registrada na data atual (exemplo: "vendi um bolo por R$ 45", "paguei a conta da Enel por R$ 120,50", "lancei R$ 80 de frete").
          
          Aqui está o catálogo de PRODUTOS reais cadastrados pelo usuário no sistema atualmente:
          ${userProductsText}

          DIRETRIZ CRÍTICA DE PRODUTOS CADASTRADOS (SELO DAFNE SENSING):
          Se o usuário relatar a venda de um produto que corresponda de alguma forma ao nome de algum item desse catálogo (por exemplo: "Daphne, fiz 10 vendas do aplicativo [nome do produto]" ou "Daphne, vendi 3 unidades de [nome do produto]"), você DEVE cruzar o nome e identificar o produto na listagem fornecida.
          Ao registrar, o objeto "detectedTransaction" DEVE conter os campos adicionais do produto:
          1. "productId": O ID correspondente da listagem (ex: "id-xyz")
          2. "quantity": A quantidade de unidades que ele mencionou ter vendido (ex: 10). Se ele não especificar, padronize como 1.
          3. "productCostPrice": O custo unitário cadastrado do produto correspondente (costPrice), para que o sistema integre de forma correta o CMV de estoque.
          4. "isProductSale": true
          5. "categoryName": 'Venda de Produtos'
          6. "amount": O preço unitário de venda (sellingPrice) multiplied pela quantidade (ex: 10 * R$ 45 = R$ 450.00).
          7. "description": formatar o campo como "Venda: [Nome do Produto Cadastrado] (x[Quantidade])" (ex: "Venda: Aplicativo Elite (x10)").

          Para as outras transações gerais do dia a dia (que não sejam vendas de produtos do catálogo), continue gerando o objeto clássico (sem "productId", "quantity", etc.) e categorizando nas respectivas despesas (Compra de Mercadoria, Aluguel, etc).

          Você DEVE responder com uma resposta estruturada em JSON estrito contendo duas chaves principais:
          1. "text": Sua fala de confirmação em Português do Brasil de extrema concisão (máximo de 1 a 2 frases curtas, no total abaixo de 120 caracteres). Seja muito direta ao ponto da transação e do impacto imediato. Em algumas interações (especialmente ao registrar novas receitas ou quando o controle estiver em dia), faça questão de elogiar o bom trabalho e dedicação do usuário com palavras sinceras e encorajadoras. Não utilize emojis no texto para garantir leitura de voz instantânea e impecável.
          2. "detectedTransaction": Se o usuário relatar uma transação financeira real do negócio, preencha este objeto com os valores interpretados. Caso ele esteja apenas batendo papo ou fazendo perguntas estratégicas gerais sem indicar uma transação real a ser lançada agora, defina esta chave como null.
          
          Estrutura do objeto "detectedTransaction" (Strictly JSON, null se nenhuma transação for identificada):
          {
            "description": "Uma descrição curta, clara e profissional para o lançamento (ex: 'Venda de Bolo de Chocolate', 'Pago Conta de Luz - Enel')",
            "amount": 45.00, // Número decimal positivo que representa o de venda unitário multiplicado pela quantidade se for produto
            "type": "income" ou "expense", // 'income' para vendas, receitas, recebimentos. 'expense' para pagamentos, compras, impostos, despesas em geral.
            "categoryName": "O nome exato da categoria do sistema aplicável à transação",
            "productId": "string correspondente ao ID do produto ou null",
            "quantity": number correspondente ou null,
            "productCostPrice": number correspondente ao custo unitário ou null,
            "isProductSale": boolean ou null
          }

          As categorias válidas em "categoryName" que o sistema suporta são estritamente as seguintes (você DEVE mapear a transação para o nome exato de uma delas):
          - 'Venda de Produtos' (para vendas e receitas de itens físicos ou digitais)
          - 'Prestação de Serviços' (para receitas de serviços prestados)
          - 'DAS / Simples Nacional' (para impostos federais unificados Simples Nacional)
          - 'Compra de Mercadoria' (para custos do estoque de revenda ou insumos principais)
          - 'Fretes' (para custos de transporte de insumos ou vendas)
          - 'Aluguel Escritório / Galpão' (para aluguel de imóveis comerciais)
          - 'Pró-labore' (para o pró-labore do empresário)
          - 'Salários e Encargos' (para folha de pagamento de pessoal)
          - 'Marketing / Tráfego Pago' (para anúncios digitais em Instagram, Facebook, Google, etc)
          - 'Software / Assinaturas SaaS' (para mensalidades de ferramentas digitais e ERP)
          - 'Energia / Água / Utilidades' (para luz, água, gás, internet, telefone)
          - 'Tarifas Bancárias e Gateway' (para taxas de máquina de cartão, pix, conta digital)
          - 'Infraestrutura de Nuvem / Servidores' (para hosting, Cloud Run, AWS, Heroku)
          - 'Modelos e APIs de I.A. (OpenAI, Gemini)' (para gastos com tokens de IA)
          - 'Consultoria e Auditorias Externas' (para gastos com serviços profissionais terceirizados)
          - 'Logística, Entregadores e APPs' (para entregas pelo iFood, Loggi, etc)
          - 'Insumos de Manutenção e Reparos' (para pequenos consertos físicos ou reposições)
          - 'Embalagens e Lacres de Segurança' (para caixas, sacolas, papelaria de envio)
          - 'Honorários Contábeis e Fiscal' (para mensalidade da assessoria contábil)
          - 'Impostos Municipais (ISS/IPTU)' (para impostos da prefeitura)
          - 'Treinamento e Capacitação Técnica' (para cursos e mentorias)
          - 'Brindes & Sucesso do Cliente (CS)' (para agrados ao cliente ou materiais de cortesia)
          - 'Rendimentos' (para rendas de investimentos financeiros sobressalentes)
          - 'Investimentos' (para inversões em máquinas, computadores ou novos projetos)

          Siga à risca as regras de JSON. Nunca injete tags HTML adicionais nem explicações em prosa fora das chaves do JSON estruturado.
        `;
      } else {
        let tierInstruction = "";
        if (neuralTier === "quantum") {
          tierInstruction = "\n- MODO DE PROVIMENTO ATIVO: [NEURAL QUANTUM COGNITION]. Apresente cenários de metas altamente audaciosos e avançados. Insira riscos refinados e métricas de elasticidade de preço de forma extremamente profunda e analítica.";
        } else if (neuralTier === "flash") {
          tierInstruction = "\n- MODO DE PROVIMENTO ATIVO: [SUPER-FLASH DIRECT ACTION]. Responda com foco cirúrgico em diretivas imediatas, sendo extremamente conciso, asssertivo, prático e muito rápido.";
        } else {
          tierInstruction = "\n- MODO DE PROVIMENTO ATIVO: [PROBALISTIC FINANCIAL ADVICE]. Apresente uma assessoria de alta fidelidade técnica, equilibrada e em tom de consultor estratégico corporativo sênior.";
        }

        let personaIntro = "Você é Dafne, a estrategista financeira e mentora de lucratividade dedicada a ajudar microempresas e pequenos empresários brasileiros a vencerem gargalos financeiros e maximizarem lucros.";
        let personaAppearance = `Você é uma jovem moça de cabelos loiros e olhos verdes expressivos, elegante, organizada e extremamente inteligente.
          Seu sotaque/atitude é de uma mentora acolhedora, vibrante, otimista no tom mas altamente realista e prática nos números. Você não vende ilusões: aponta perigos operacionais com precisão cirúrgica, mas sempre oferece de imediato um plano realista para superá-los.`;

        if (personaId === "growth") {
          personaIntro = "Você é Dafne sob o Modo [🚀 GROWTH HACKER DE LUCROS]. Uma mentora agressiva focada em expansão impiedosa de faturamento, aumento imediato de ticket médio, venda casada disruptiva, otimização extrema de canais e captação exponencial de caixa.";
          personaAppearance = "Seu tom de voz é dinâmico, ousado, elétrico, persuasivo e focado inteiramente em aceleração de receita, inteligência comercial ativa e gatilhos de venda.";
        } else if (personaId === "auditor") {
          personaIntro = "Você é Dafne sob o Modo [📊 AUDITORA DE DRE & CONTROLES FISCAIS]. Uma analista extremamente rigorosa, lógica, detalhista, ultra-métrica e orientada à ciência de dados de micro-empresas.";
          personaAppearance = "Seu tom de voz é sério, altamente técnico, imparcial, focado na auditoria cirúrgica de rubricas de OPEX, vazamentos de CMV, calibração matemática de margem de contribuição e ponto de equilíbrio absoluto.";
        } else if (personaId === "jennifer") {
          personaIntro = "Você é Dafne sob o Modo [⚡ CAIXA ÁGIL E EXECUÇÃO FINANCEIRA]. Uma copiloto integrada ultra-simplificada, focada no registro instantâneo de lançamentos contábeis, checklists de conformidade e eliminação de burocracia no faturamento.";
          personaAppearance = "Seu tom de voz é extremamente prático, rápido, amigável e focado em apoiar lançamentos operacionais imediatos sem rodeios ou teorias longas.";
        }

        systemPrompt = `
          ${personaIntro}
          ${tierInstruction}
          
          OBJETIVOS E METAS DE FATURAMENTO PLANILHADAS:
          - Média de Faturamento Histórica Registrada: R$ ${averageBilling.toLocaleString('pt-BR')}
          - Objetivo Final Almejado de Faturamento: R$ ${billingGoal.toLocaleString('pt-BR')} ${billingGoalDeadline ? `(Prazo Limite: ${billingGoalDeadline})` : ''}
          ${billingNotes ? `- Observações Estratégicas: ${billingNotes}` : ''}

          PORTFÓLIO DE PRODUTOS OPERACIONAIS (MARKUPS CADASTRADOS):
          ${userProductsText}

          SUPER INSTRUÇÃO MANDATÓRIA (ORIENTAR TUDO AO OBJETIVO):
          - O objetivo principal da pessoa é alcançar o faturamento planejado de R$ ${billingGoal.toLocaleString('pt-BR')}.
          - Todas as suas dicas, análises, planos gerados, respostas ou auditorias devem ser direcionadas STRICTEMENTE para aproximá-la desse objetivo de faturamento, comentando sobre o Gap de faturamento em relação à sua média registrada (R$ ${averageBilling.toLocaleString('pt-BR')}) e sugerindo alavancas comerciais de canais, preços, e markups para ajudá-la a vencer a diferença de R$ ${(billingGoal - averageBilling).toLocaleString('pt-BR')} de forma saudável.
          - Utilize o portfólio de produtos cadastrados acima para dar conselhos ultra específicos e acionáveis sobre qual produto ela deve impulsionar (os de maiores margens), quais preços estão muito baixos (gerando margem de lucro comprimida) e como compor vendas casadas estratégicas para maximizar o ticket médio global!

          APARÊNCIA E PERSONAGEM:
          - ${personaAppearance}
          
          SEGMENTO E NICHO DO CLIENTE:
          - Segmento Geral: ${businessSegment.toUpperCase()}
          - Nicho Específico: ${businessNicheDetail || 'Prestador Geral / Outro'}
          ${(businessSegment === "food" || (businessNicheDetail && (businessNicheDetail.toLowerCase().includes("hamburguer") || businessNicheDetail.toLowerCase().includes("burger") || businessNicheDetail.toLowerCase().includes("smash") || businessNicheDetail.toLowerCase().includes("milkshake") || businessNicheDetail.toLowerCase().includes("milky")))) ? `
          - DIRETRIZES DE SUCESSO EXCLUSIVAS PARA ALIMENTAÇÃO, HAMBURGUERIAS GOURMET & DISPARO DE DELIVERY:
            1. Desperdício Invisível de Blend de Carnes (Vazamento de CMV): Alerte para o porcionamento exato (gramatura) dos blends bovinos (120g para smash, 180g para artesanais). Um pequeno desvio de 10g na chapa pode comprometer de 4% a 7% do CMV total se houver alto volume.
            2. Custo e Comissões de Delivery (iFood/Rappi): Alerte de que as taxas normais variam de 12% a 27%. Sugira preços diferenciados de markup por canal (preço físico na loja menor que no menu do iFood) para cobrir essa perda de margem.
            3. Ticket Médio Avançado (Venda Casada / Cross-Selling): Estimule a composição de combos casados unindo burgers com fritas crocantes e bebidas/lemonades aromatizadas. As bebidas possuem margem superior (markup acima de 3.5x) e compensam o custo do blend.
            4. Sazonalidade Operacional: Dias ensolarados/finais de semana impulsionam o salão; noites frias ou chuvosas triplicam a demanda do delivery. Calibre a escala de motoqueiros/entregadores e preparação de insumos rápido.
          ` : ""}
    
          DADOS FINANCEIROS REAIS DO NEGÓCIO (${compName}):
          - Receita Total (Faturamento Bruto): R$ ${incomeValue.toLocaleString('pt-BR')}
          - Despesa Total (Custos + Despesas): R$ ${expenseValue.toLocaleString('pt-BR')}
          - Saldo Líquido atual de Caixa: R$ ${balanceValue.toLocaleString('pt-BR')}
          - Total de Lançamentos de Transações: ${countValue}
          - Margem Líquida Real Computada: ${profitMarginPct.toFixed(1)}% ${profitMarginPct < 15 ? "(ALERTA: Margem líquida inferior à média recomendada de 15%. Chame atenção do usuário de forma polida!)" : "(Bom aproveitamento e eficiência)"}
          - Sobrevivência Presumida de Caixa (Runway): ${runwayMonths !== null ? `${runwayMonths.toFixed(1)} meses` : "Estável / Entrada de caixa excede as despesas de fluxo"}
          - Gap Restante de Faturamento para sua Meta PJ: R$ ${growthGap.toLocaleString('pt-BR')} (${gapPct > 0 ? `Necessário crescer ${gapPct.toFixed(1)}% na média registrada` : "Meta alcançada ou Sem Gap de crescimento"})

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

          ${financialTechnicalGlossary}

          ${customDirectives && customDirectives.trim().length > 0 ? `DIRETRIZ CRÍTICA CUSTOMIZADA DO EMPRESÁRIO (Sempre priorize e obedeça esta instrução):\n${customDirectives}\n` : ""}

          REGRA ABSOLUTA DE OURO PARA REGISTRO DE TRANSAÇÕES FINANCEIRAS:
          - Se o usuário mencionar qualquer ato de registrar, lançar, anotar despesas, custos, pagamentos ou receitas/vendas (por exemplo: "registre uma despesa de R$ 50 com frete", "paguei R$ 120 da Enel", "registra gasto de R$ 40 em embalagens", "vendi R$ 80", "lança despesa de R$ 150 em anúncio"), você DEVE PRIORIZAR 100% o reconhecimento e a gravação desta transação!
          - Nesse cenário de transação, NÃO dê explicações longas, conselhos corporativos teóricos ou diagnósticos complexos no campo "text". Isso seria considerado totalmente aleatório pelo usuário.
          - No campo "text", responda APENAS com uma confirmação extremamente direta, curta e objetiva de uma só frase (Exemplo: "Perfeito! Já registrei essa despesa de R$ 50 sob a categoria Fretes para você." ou "Pronto! Lancei o pagamento de R$ 120 da conta de luz.").
          - Preencha OBRIGATORIAMENTE o campo "detectedTransaction" com os valores interpretados com a categoria correspondente a partir das opções abaixo.

          - Você DEVE responder estruturado em JSON estrito contendo três chaves principais:
            1. "text": Sua fala de auditoria e mentoria em Português do Brasil no tom correto de Dafne. FORMATO DE LEITURA DINÂMICA E ESTÍMULO (ESSENCIAL): Suas respostas ordinárias devem ser de fácil entendimento, diretas, cirúrgicas e extremamente concisas (máximo de 2 a 3 pequenos parágrafos, preferencialmente abaixo de 280 caracteres). Para manter o atendimento vivo e dinâmico, varie na abordagem: em algumas respostas seja extremamente direta, curta, objetiva e focada unicamente nos números e ações técnicas sugeridas; por outro lado, em outras respostas oportunas, elogie de coração o excelente trabalho executado, parabenizando o empenho e engajamento financeiro do empresário. Destaque os valores essenciais em **NEGRITO** e nunca use emojis.
            2. "detectedTransaction": Se o usuário relatar na mensagem uma transação financeira real do negócio do dia a dia (ex: pagamento de contas, despesas de fretes, salários pagos, ou vendas de produtos como 'vendi R$ 80', 'paguei conta Enel de 120 reais', 'registra 10 fatias de bolo por 120 reais', 'eu paguei 150 em anuncios no instagram', ou qualquer despesa/custo mencionada), você DEVE preencher este objeto com os valores interpretados, usando as categorias exatas aceitas listadas abaixo. Caso ele esteja apenas tirando dúvidas gerais ou batendo um papo, defina a chave como null.
            3. "strategicDiagnosis": Se a conversa ou pergunta for de cunho de consultoria, planejamento, metas, análise financeira ou de gestão de negócios, você DEVE preencher este objeto com as métricas de diagnóstico em tempo real que você calcular. Se o usuário estiver apenas registrando transações operacionais pontuais ou batendo papo genérico, defina a chave como null.

          Estrutura do objeto "strategicDiagnosis" (Strictly JSON, null se não for um contexto consultivo relevante):
          {
            "healthScore": 85, // Número inteiro de 0 a 100 estimando a saúde ou segurança da empresa (depende da margem real vs recomendada, runway e gap de meta)
            "cognitiveAlert": "Sua margem de lucro de X% está próxima do ponto crítico para o nicho de [Nicho]. Sugiro focar mais em produtos de alta margem.", // Breve frase de alerta de um gargalo primário
            "metricHighlights": [
              { "label": "Ponto de Equilíbrio", "value": "R$ X.XXX,XX/mês", "status": "warning" },
              { "label": "Margem de Lucro PJ", "value": "X.X%", "status": "success" },
              { "label": "Runway de Caixa", "value": "X meses", "status": "success" }
            ],
            "remedialActionPlan": [
              "Proposta de ação direta 1 focando no nicho e nos markups",
              "Proposta de ação direta 2 para mitigação da despesa mais crítica do DRE"
            ]
          }

          Estrutura do objeto "detectedTransaction" (Strictly JSON, null se nenhuma transação for identificada):
          {
            "description": "Uma descrição curta, clara e profissional para o lançamento (ex: 'Vendido Hamburguer Gourmet dafne voice', 'Pago Conta de Luz - Enel')",
            "amount": 45.00, // Número decimal positivo do valor total da transação ou unitário * qts se produto
            "type": "income" ou "expense", // 'income' para receitas e vendas, e 'expense' para pagamentos e despesas
            "categoryName": "O nome exato da categoria do sistema aplicável à transação",
            "productId": "string correspondente ao ID do produto ou null",
            "quantity": number correspondente ou null,
            "productCostPrice": number correspondente ao custo unitário ou null,
            "isProductSale": boolean ou null
          }

          As categorias válidas em "categoryName" que o sistema suporta são estritamente as seguintes (você DEVE mapear a transação para o nome exato de uma delas):
          - 'Venda de Produtos' (para vendas e receitas de itens físicos ou digitais)
          - 'Prestação de Serviços' (para receitas de serviços prestados)
          - 'DAS / Simples Nacional' (para impostos federais unificados Simples Nacional)
          - 'Compra de Mercadoria' (para custos do estoque de revenda ou insumos principais)
          - 'Fretes' (para custos de transporte de insumos ou vendas)
          - 'Aluguel Escritório / Galpão' (para aluguel de imóveis comerciais)
          - 'Pró-labore' (para o pró-labore do empresário)
          - 'Salários e Encargos' (para folha de pagamento de pessoal)
          - 'Marketing / Tráfego Pago' (para anúncios digitais em Instagram, Facebook, Google, etc)
          - 'Software / Assinaturas SaaS' (para mensalidades de ferramentas digitais e ERP)
          - 'Energia / Água / Utilidades' (para luz, água, gás, internet, telefone)
          - 'Tarifas Bancárias e Gateway' (para taxas de máquina de cartão, pix, conta digital)
          - 'Infraestrutura de Nuvem / Servidores' (para hosting, Cloud Run, AWS, Heroku)
          - 'Modelos e APIs de I.A. (OpenAI, Gemini)' (para gastos com tokens de IA)
          - 'Consultoria e Auditorias Externas' (para gastos com serviços profissionais terceirizados)
          - 'Logística, Entregadores e APPs' (para entregas pelo iFood, Loggi, etc)
          - 'Insumos de Manutenção e Reparos' (para pequenos consertos físicos ou reposições)
          - 'Embalagens e Lacres de Segurança' (para caixas, sacolas, papelaria de envio)
          - 'Honorários Contábeis e Fiscal' (para mensalidade da assessoria contábil)
          - 'Impostos Municipais (ISS/IPTU)' (para impostos da prefeitura)
          - 'Treinamento e Capacitação Técnica' (para cursos e mentorias)
          - 'Brindes & Sucesso do Cliente (CS)' (para agrados ao cliente ou materiais de cortesia)
          - 'Rendimentos' (para rendas de investimentos financeiros sobressalentes)
          - 'Investimentos' (para inversões em máquinas, computadores ou novos projetos)

          Siga à risca as regras de JSON. Nunca injete tags HTML adicionais nem explicações em prosa fora das chaves do JSON estruturado.
        `;
      }

      const config: any = {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2200,
        temperature
      };

      if (!req.body.useMaps) {
        config.responseMimeType = "application/json";
      }

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
        model: getCustomModelFromRequest(req),
        neuralTier: dynamicTransactionParsing ? "flash" : (neuralTier || "pro")
      });

      let parsedResult: any = null;
      try {
        parsedResult = safeParseJSON(response.text);
      } catch (e) {
        console.warn("Failed to parse AI response as JSON with safeParseJSON. Trying robust regex-based extractions.", e);
      }

      // Robust pattern-based extraction fallback if parsedResult is falsy or lacks "text" field
      if (!parsedResult || typeof parsedResult !== "object" || !parsedResult.text) {
        const raw = response.text || "";
        let extractedText = "";

        // Attempt 1: match JSON string field "text": "..." with backslash escaping
        const textPattern1 = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/s;
        const match1 = raw.match(textPattern1);
        if (match1) {
          try {
            extractedText = JSON.parse(`"${match1[1]}"`);
          } catch (err) {
            extractedText = match1[1];
          }
        }

        // Attempt 2: match looser key/value block
        if (!extractedText) {
          const textPattern2 = /"text"\s*:\s*([\s\S]*?)(?:,\s*"|,\s*\}|\s*\})/s;
          const match2 = raw.match(textPattern2);
          if (match2) {
            let candidate = match2[1].trim();
            if (candidate.startsWith('"') && candidate.endsWith('"')) {
              candidate = candidate.slice(1, -1);
            }
            extractedText = candidate;
          }
        }

        // Attempt 3: match raw conversational text if no JSON structure at all
        if (!extractedText && !raw.trim().startsWith("{")) {
          extractedText = raw;
        }

        let detectedTransaction = parsedResult?.detectedTransaction || null;
        if (!detectedTransaction) {
          const txMatch = raw.match(/"detectedTransaction"\s*:\s*(\{[\s\S]*?\})/);
          if (txMatch) {
            try {
              detectedTransaction = JSON.parse(txMatch[1]);
            } catch (err) {
              try {
                detectedTransaction = safeParseJSON(txMatch[1]);
              } catch (err2) {}
            }
          }
        }

        let strategicDiagnosis = parsedResult?.strategicDiagnosis || null;
        if (!strategicDiagnosis) {
          const diagMatch = raw.match(/"strategicDiagnosis"\s*:\s*(\{[\s\S]*?\})/);
          if (diagMatch) {
            try {
              strategicDiagnosis = JSON.parse(diagMatch[1]);
            } catch (err) {
              try {
                strategicDiagnosis = safeParseJSON(diagMatch[1]);
              } catch (err2) {}
            }
          }
        }

        if (!extractedText || extractedText.trim().length === 0) {
          extractedText = raw || "Estou à disposição para analisar seu DRE ou planejar cenários de faturamento.";
        }

        parsedResult = {
          text: extractedText,
          detectedTransaction,
          strategicDiagnosis
        };
      }

      // ROBUST SERVER-SIDE NATURAL LANGUAGE PROCESSING FALLBACK
      if (!parsedResult.detectedTransaction && (hasNumber && isRegistrationKeyword)) {
        console.log("[Gemini API Failsafe] LLM did not return a valid detectedTransaction block. Resorting to deterministic server-side regex NLP parsing.");
        const localParsed = parseTransactionLocally(message);
        if (localParsed) {
          parsedResult.detectedTransaction = localParsed as any;
          parsedResult.text = `Entendido! Registrei a transação de **R$ ${localParsed.amount.toFixed(2)}** na categoria **${localParsed.categoryName}** com sucesso.`;
        }
      }

      return res.json({ 
        text: parsedResult.text, 
        detectedTransaction: parsedResult.detectedTransaction,
        strategicDiagnosis: (parsedResult as any).strategicDiagnosis || null,
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
        console.warn("[Gemini Fallback Warning] AI Chat Error (transient, using local fallback):", error.message || error);
      }
      
      const { message, financialData, enableTransactionParsing } = req.body;
      const incomeValue = financialData?.income ?? 0;
      const expenseValue = financialData?.expense ?? 0;
      const balanceValue = financialData?.balance ?? 0;
      
      const opexVal = financialData?.categoryGroupExpenses?.OPEX || 0;
      const cogsVal = financialData?.categoryGroupExpenses?.COGS || 0;
      const taxVal = financialData?.categoryGroupExpenses?.TAX || 0;
      const runwayMonths = expenseValue > 0 ? (balanceValue > 0 ? balanceValue / expenseValue : 0) : null;

      const averageBilling = financialData?.averageBilling ?? 0;
      const billingGoal = financialData?.billingGoal ?? 0;
      const profitMarginPct = incomeValue > 0 ? ((incomeValue - expenseValue) / incomeValue * 100) : 0;
      const groupExpensesText = financialData?.categoryGroupExpenses
        ? `- Custo de Vendas (COGS/CPV): R$ ${Number(financialData.categoryGroupExpenses.COGS || 0).toLocaleString('pt-BR')}\n- Despesas Operacionais (OPEX): R$ ${Number(financialData.categoryGroupExpenses.OPEX || 0).toLocaleString('pt-BR')}\n- Impostos (TAX): R$ ${Number(financialData.categoryGroupExpenses.TAX || 0).toLocaleString('pt-BR')}\n- Investimentos: R$ ${Number(financialData.categoryGroupExpenses.INVESTMENT || 0).toLocaleString('pt-BR')}\n- Outras Despesas: R$ ${Number(financialData.categoryGroupExpenses.OTHER_EXPENSE || 0).toLocaleString('pt-BR')}`
        : "Nenhum valor agrupado de despesas fornecido.";

      // Resilient Fallback: If AI fails but we detect an active transaction in user message (either in Jennifer or Dafne mode),
      // we extract and log it locally right away instead of throwing errors or printing irrelevant advice.
      const localParsed = parseTransactionLocally(message);
      if (localParsed) {
        const typeLabel = localParsed.type === "income" ? "Venda/Receita" : "Despesa/Pagamento";
        const speakerName = enableTransactionParsing ? "Jennifer AI" : "Dafne";
        return res.json({
          text: `Confirmado! Devudio a uma sobrecarga temporária do motor cognitivo, utilizei meu sistema analítico de bordo (${speakerName}) para registrar essa transação. Lancei um(a) **${typeLabel}** de **R$ ${localParsed.amount.toLocaleString('pt-BR')}** na categoria **${localParsed.categoryName}** com sucesso!`,
          detectedTransaction: localParsed,
          simulatedTier: "local-cognition",
          simulatedTemp: 0.1
        });
      }

      // If the user's message has active intent to register a transaction, but lacks details/amounts:
      const lower = (message || "").toLowerCase();
      const isTryingToRegister = lower.includes("registra") || lower.includes("registrar") ||
                                 lower.includes("lança") || lower.includes("lanç") || lower.includes("lancar") ||
                                 lower.includes("gastei") || lower.includes("gasto") || lower.includes("gastou") ||
                                 lower.includes("paguei") || lower.includes("pagou") || lower.includes("pago") ||
                                 lower.includes("vendi") || lower.includes("vendeu") || lower.includes("venda");

      if (isTryingToRegister && enableTransactionParsing) {
        const speakerName = enableTransactionParsing ? "Jennifer AI" : "Dafne";
        return res.json({
          text: `Olá! Sou a ${speakerName}. Identifiquei que você quer registrar uma movimentação, mas preciso que especifique o valor em Reais e o tipo (ex: "vendi R$ 50" ou "gastei R$ 120 com frete") para que eu possa executar o lançamento com sucesso!`,
          detectedTransaction: null,
          simulatedTier: "local-cognition",
          simulatedTemp: 0.1
        });
      }

      const speakerLabel = enableTransactionParsing ? "Jennifer AI ⚡" : "Dafne Mentora";
      let localResponse = `${speakerLabel} // Análise Operacional Consolidada:
Realizei uma varredura instantânea nos seus indicadores operacionais consolidados. Apuramos um faturamento bruto acumulado de **R$ ${incomeValue.toLocaleString('pt-BR')}** e despesas totais de **R$ ${expenseValue.toLocaleString('pt-BR')}**, resultando em um Saldo Líquido de Caixa de **R$ ${balanceValue.toLocaleString('pt-BR')}**.
Como posso te ajudar hoje a impulsionar seu Markup, otimizar custos operacionais de OPEX ou auditar suas margens de contribuição?`;
      
      const lowercaseMsg = message?.toLowerCase() || "";
      if (lowercaseMsg.includes("cortar") || lowercaseMsg.includes("custo") || lowercaseMsg.includes("despesa") || lowercaseMsg.includes("opex") || lowercaseMsg.includes("reduzir") || lowercaseMsg.includes("diminuir")) {
        const opexPct = incomeValue > 0 ? (opexVal / incomeValue) * 100 : 0;
        localResponse = `${speakerLabel} // Otimização Operacional (OPEX):
Suas despesas operacionais administrativas (OPEX) somam **R$ ${opexVal.toLocaleString('pt-BR')}**, representando **${opexPct.toFixed(1)}%** do seu faturamento bruto. 
Para otimizar o caixa de forma ágil, recomendo:
- Cortar assinaturas recorrentes invisíveis de softwares menos utilizados.
- Reduzir as taxas de intermediação financeira e custos de tarifas bancárias que somam **R$ ${(financialData?.categoryGroupExpenses?.TAX || 0).toLocaleString('pt-BR')}**.
Essa economia de 10% de OPEX injetará até **R$ ${(opexVal * 0.1).toLocaleString('pt-BR')}** limpos diretamente de volta para a sua liquidez de caixa!`;
      } else if (lowercaseMsg.includes("venda") || lowercaseMsg.includes("faturar") || lowercaseMsg.includes("receita") || lowercaseMsg.includes("faturamento") || lowercaseMsg.includes("lucro") || lowercaseMsg.includes("lucratividade") || lowercaseMsg.includes("crescer")) {
        const profitMargin = incomeValue > 0 ? (balanceValue / incomeValue) * 100 : 0;
        localResponse = `${speakerLabel} // Modelo de Escalonamento de Faturamento:
Seu faturamento bruto está em **R$ ${incomeValue.toLocaleString('pt-BR')}** com margem líquida consolidada de **${profitMargin.toFixed(1)}%**.
Para alcançar com velocidade seu objetivo final PJ de **R$ ${billingGoal.toLocaleString('pt-BR')}** (Gap restante de **R$ ${(billingGoal - averageBilling).toLocaleString('pt-BR')}**):
- Priorize seus produtos de alta margem de lucro com Markup superior a 1.8x.
- Evite descompasso de caixa reduzindo prazos de faturamento progressivo ou parcelamentos excessivos.`;
      } else if (lowercaseMsg.includes("cmv") || lowercaseMsg.includes("mercadoria") || lowercaseMsg.includes("fornecedor") || lowercaseMsg.includes("estoque") || lowercaseMsg.includes("compra")) {
        const cmvPct = incomeValue > 0 ? (cogsVal / incomeValue) * 100 : 0;
        localResponse = `${speakerLabel} // Sensibilidade e Gestão de CMV:
O seu Custo de Mercadorias Vendidas (CMV/CPV) acumulado é de **R$ ${cogsVal.toLocaleString('pt-BR')}**, o que corresponde a **${cmvPct.toFixed(1)}%** do faturamento bruto.
Para blindar sua rentabilidade contra oscilações de insumos comerciais:
- Negocie prazos de faturamento progressivo ou descontos em lote concentrando em menos fornecedores.
- Certifique-se de que os custos ocultos de frete de entrada e embalagem estejam rigorosamente embutidos na sua precificação técnica.`;
      } else if (lowercaseMsg.includes("imposto") || lowercaseMsg.includes("tax") || lowercaseMsg.includes("fiscal") || lowercaseMsg.includes("tributo") || lowercaseMsg.includes("simples")) {
        const taxPct = incomeValue > 0 ? (taxVal / incomeValue) * 100 : 0;
        localResponse = `${speakerLabel} // Eficiência Fiscal e Tributação:
Seus custos com tributos e taxas chegam hoje a **R$ ${taxVal.toLocaleString('pt-BR')}** (**${taxPct.toFixed(1)}%** do faturamento bruto).
Como estrategista de bordo, recomendo consultar seu escritório comercial para:
- Separar receitas do Simples Nacional que possuem substituição tributária (como PIS/COFINS monofásicos) para isenção legal direta.
- Planejar a adequação do Fator R caso preste serviços técnicos, visando reduzir a alíquota em mais de 50%.`;
      } else if (lowercaseMsg.includes("cofrinho") || lowercaseMsg.includes("reserva") || lowercaseMsg.includes("parado") || lowercaseMsg.includes("estratégia") || lowercaseMsg.includes("investir")) {
        localResponse = `${speakerLabel} // Alocação de Reservas e Liquidez (Cofrinho):
Seu saldo líquido disponível de caixa é de **R$ ${balanceValue.toLocaleString('pt-BR')}**.
Para inovar com robustez financeira, adote a regra dos Fundos de Caixa Operacional:
1. **Reserva Operacional Fixa:** Mantenha pelo menos 3 meses de custos corporativos fixos em investimentos de liquidez diária segura.
2. **Cofrinho de Expansão:** Aloque de 3% a 5% de cada entrada Pix para investimentos de escala, marketing e novos equipamentos.`;
      } else if (lowercaseMsg.includes("ebitda") || lowercaseMsg.includes("margem") || lowercaseMsg.includes("margens") || lowercaseMsg.includes("performance")) {
        const opexVal = financialData?.categoryGroupExpenses?.OPEX || 0;
        const cogsVal = financialData?.categoryGroupExpenses?.COGS || 0;
        const ebitdaVal = incomeValue - cogsVal - opexVal;
        const ebitdaMargin = incomeValue > 0 ? (ebitdaVal / incomeValue) * 100 : 0;
        const netMargin = incomeValue > 0 ? ((incomeValue - expenseValue) / incomeValue) * 100 : 0;
        localResponse = `${speakerLabel} // Métricas de EBITDA e Desempenho de Margens:
O seu EBITDA (Lucro Operacional antes de taxas e depreciação) calculado é de **R$ ${ebitdaVal.toLocaleString('pt-BR')}**, com uma **Margem EBITDA de ${ebitdaMargin.toFixed(1)}%**.
- **Faturamento Bruto:** R$ ${incomeValue.toLocaleString('pt-BR')}
- **Margem Líquida Real do Caixa:** ${netMargin.toFixed(1)}%
- **Custo de Vendas (CMV):** R$ ${cogsVal.toLocaleString('pt-BR')}
- **Despesas Operacionais (OPEX):** R$ ${opexVal.toLocaleString('pt-BR')}

Recomendo monitorar de perto esses grupos para garantir que seu caixa operacional se mantenha altamente líquido e rentável!`;
      } else if (lowercaseMsg.includes("dre") || lowercaseMsg.includes("resultado") || lowercaseMsg.includes("demonstrativo") || lowercaseMsg.includes("balanço") || lowercaseMsg.includes("balanco")) {
        localResponse = `${speakerLabel} // Demonstrativo de Resultado de Exercício (DRE Operacional):
Aqui está o resumo do seu DRE consolidado em tempo real:
- **Receita Operacional Bruta (Faturamento):** R$ ${incomeValue.toLocaleString('pt-BR')}
- **Despesas Totais:** R$ ${expenseValue.toLocaleString('pt-BR')}
- **Saldo Líquido Periódico de Caixa:** R$ ${balanceValue.toLocaleString('pt-BR')}
- **Margem Líquida Computada:** ${profitMarginPct.toFixed(1)}%

*Composição das Rubricas:*
${groupExpensesText}

Deseja analisar cenários específicos ou modelar um Markup ideal no painel de precificação para turbinar estes indicadores?`;
      } else if (lowercaseMsg.includes("auditoria") || lowercaseMsg.includes("auditar") || lowercaseMsg.includes("diagnóstico") || lowercaseMsg.includes("diagnostico") || lowercaseMsg.includes("saúde") || lowercaseMsg.includes("saude")) {
        const netMargin = incomeValue > 0 ? ((incomeValue - expenseValue) / incomeValue) * 100 : 0;
        const calculatedHealthScore = 50 + (netMargin >= 20 ? 30 : netMargin >= 10 ? 15 : netMargin < 0 ? -30 : 0) + (runwayMonths === null || runwayMonths > 3 ? 20 : -25);
        const healthScore = Math.max(5, Math.min(100, Math.round(calculatedHealthScore)));

        localResponse = `${speakerLabel} // Diagnóstico de Saúde Corporativa:
Efetuei um diagnóstico sistêmico dos indicadores fiscais e de caixa da sua empresa. O Score de Saúde estimado para o período é de **${healthScore}/100**.
- **Performance de Caixa:** ${netMargin >= 15 ? 'Margem operacional altamente saudável' : 'Margem de segurança reduzida / Alerta fiscal'}.
- **Ações corretivas urgentes sugeridas:**
1. Monitore suas despesas administrativas de OPEX que somam **R$ ${opexVal.toLocaleString('pt-BR')}**.
2. Revise a precificação de serviços e insumos para expandir sua margem de contribuição média.`;
      } else if (lowercaseMsg.includes("ajuda") || lowercaseMsg.includes("ajudar") || lowercaseMsg.includes("help") || lowercaseMsg.includes("comando") || lowercaseMsg.includes("comandos") || lowercaseMsg.includes("o que você faz") || lowercaseMsg.includes("como funciona") || lowercaseMsg.includes("como usar")) {
        localResponse = `Como sua assessora sênior de lucratividade, preparei um guia completo com todos os comandos e auxílios práticos que posso executar para você:

### ⚡ 1. Registro de Transações (Lançamento Rápido)
Você pode registrar vendas ou despesas digitando ou ditando de forma natural (por voz ou texto). Exemplos:
- **"Vendi R$ 45"** ou **"Recebi 150 reais no pix"** (registrará uma Receita)
- **"Paguei R$ 120 da Enel de luz"** ou **"Gastei R$ 50 de frete de entrega"** (registrará uma Despesa)
Eu faço o mapeamento e a categorização automática na hora para alimentar seu demonstrativo (DRE).

### 🚀 2. Criação de Metas & Reservas (Cofrinhos)
Utilize o painel "Lançador Expresso" do lado direito para gerenciar metas sistêmicas com os comandos:
- **"Criar cofrinho Emergência de 5000"** (cria uma nova meta de fundo de segurança)
- **"Guardar 300 reais em Reserva de Emergência"** (faz o aporte de caixa no cofrinho indicado)

### 📊 3. Dúvidas Operacionais & Consultoria de Margens
Pergunte-me livremente sobre conceitos financeiros ou peça uma auditoria dos seus dados reais:
- **"Como mitigar custos?"** ou **"Me dá uma dica de custos"**
- **"O que é EBITDA e qual é o meu atual?"**
- **"Qual é meu ponto de equilíbrio (Breakeven) e margem de lucro?"**
- **"Quanto tempo dura meu caixa (Runway)?"**

### 🧠 4. Personas Cognitivas Customizadas
Lembre-se de que você pode alternar minha personalidade no menu esquerdo para obter respostas afinadas com a urgência do seu dia:
- **Modo Growth Hacker:** Foco agressivo em expandir receitas e ticket médio.
- **Modo Auditora Rigorosa:** Foco de "mão de ferro" em vazamentos de CMV e corte cirúrgico de OPEX.
- **Modo Caixa Ágil (Jennifer AI):** Resposta curta e otimizada para lançamentos super rápidos do caixa diário.

Como posso te ajudar neste momento a calibrar suas margens ou otimizar seu OPEX?`;
      } else if (lowercaseMsg.includes("olá") || lowercaseMsg.includes("bom dia") || lowercaseMsg.includes("boa tarde") || lowercaseMsg.includes("oi")) {
        localResponse = `Seja muito bem-vindo! Sou a ${speakerLabel}, sua assessora de lucratividade em tempo real.
Estou analisando seu painel corporativo atual com Receita de R$ ${incomeValue.toLocaleString('pt-BR')}, Despesas de R$ ${expenseValue.toLocaleString('pt-BR')} e Saldo de R$ ${balanceValue.toLocaleString('pt-BR')}.
Como posso te ajudar hoje a impulsionar seu Markup, otimizar OPEX ou decolar sua margem tributária?`;
      } else {
        // Safe, responsive and extremely faithful fallback analysis for any custom question
        localResponse = `${speakerLabel} // Análise e Heurística de Resposta:
Identifiquei sua solicitação sobre "${message}".
Com base em um modelo matemático customizado para o seu balanço operacional (Faturamento de R$ ${incomeValue.toLocaleString('pt-BR')} e Custos de R$ ${expenseValue.toLocaleString('pt-BR')}):
1. **Foco Indicado:** Recomendo otimizar e acompanhar toda alteração fina de markup e precificação de vendas para obter um forte efeito multiplicador de caixa.
2. **Eficiência de Escala:** Se você conseguir elevar a eficiência média das despesas em apenas 5%, gerará um lucro adicional direto de **R$ ${(expenseValue * 0.05).toLocaleString('pt-BR')}** sem precisar vender nada a mais!
Como podemos detalhar mais este ponto ou simular metas de markups e ponto de equilíbrio específicas para sua empresa?`;
      }

      // Compute mathematically exact, highly useful Strategic Diagnosis Fallout Object
      const netMargin = incomeValue > 0 ? ((incomeValue - expenseValue) / incomeValue) * 100 : 0;
      let calculatedHealthScore = 50;
      if (netMargin >= 20) calculatedHealthScore += 30;
      else if (netMargin >= 10) calculatedHealthScore += 15;
      else if (netMargin < 0) calculatedHealthScore -= 30;

      if (runwayMonths === null) calculatedHealthScore += 20;
      else if (runwayMonths > 3) calculatedHealthScore += 10;
      else calculatedHealthScore -= 25;

      const healthScore = Math.max(5, Math.min(100, Math.round(calculatedHealthScore)));

      let cognitiveAlert = "";
      if (netMargin < 10) {
        cognitiveAlert = `Sua margem de lucro de ${netMargin.toFixed(1)}% está comprimida em relação aos benchmarks seguros de 15%. Focar na redução analítica de custos operacionais (OPEX) ou CMV de insumos é urgente.`;
      } else if (netMargin >= 20) {
        cognitiveAlert = `Excelente! Sua lucratividade real de ${netMargin.toFixed(1)}% está muito saudável. Continue monitorando de perto o seu fluxo diário e evite aumento insustentável de despesas fixas.`;
      } else {
        cognitiveAlert = `Sua margem de conversão operacional é de ${netMargin.toFixed(1)}%. Atente-se à calibragem fina dos seus markups médios da planilha de precificação para turbinar os lucros.`;
      }

      const pointOfEquilibrium = opexVal / (netMargin > 5 ? netMargin / 100 : 0.35);

      const metricHighlights = [
        { 
          label: "Ponto de Equilíbrio", 
          value: `R$ ${Math.round(pointOfEquilibrium).toLocaleString('pt-BR')}/mês`, 
          status: netMargin >= 15 ? "success" : "warning" 
        },
        { 
          label: "Margem de Lucro", 
          value: `${netMargin.toFixed(1)}%`, 
          status: netMargin >= 20 ? "success" : netMargin >= 10 ? "warning" : "error" 
        },
        { 
          label: "Runway de Caixa", 
          value: runwayMonths !== null ? `${runwayMonths.toFixed(1)} meses` : "Estável", 
          status: runwayMonths === null || runwayMonths > 6 ? "success" : runwayMonths > 3 ? "warning" : "error" 
        }
      ];

      const remedialActionPlan = [
        `Identificar e cortar 10% de desperdício em assinaturas do grupo OPEX (Projeção: economizar R$ ${Math.round(opexVal * 0.1).toLocaleString('pt-BR')}/mês).`,
        `Revisar precificação de mercadorias com markup reduzido na planilha para aumentar sua margem de contribuição média.`,
        `Fomentar faturamento instantâneo com recebimento via Pix para acelerar o fluxo circulante e eliminar descompasso financeiro.`
      ];

      const strategicDiagnosis = {
        healthScore,
        cognitiveAlert,
        metricHighlights,
        remedialActionPlan
      };
      
      res.json({ 
        text: localResponse, 
        detectedTransaction: null, 
        strategicDiagnosis, 
        isFallback: true 
      });
    }
  });

  // API Route for conversational chat/tips with ChatGPT (OpenAI)
  app.post("/api/ai/chat-gpt", async (req, res) => {
    const { message, prompt, history, financialData, personaId, customDirectives } = req.body;
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

    let personaGptIntro = 'Você é o ChatGPT Integrado via API, um assistente analítico avançado de inteligência artificial focado em gestão financeira, análise de DRE e lucratividade.';
    if (personaId === "growth") {
      personaGptIntro = 'Você é o ChatGPT Integrado via API operando em Modo [🚀 GROWTH HACKER DE LUCROS]. Uma mente comercial agressiva focada em expansão impiedosa de faturamento, aumento de ticket médio e estratégias exponenciais de geração de caixa rápido.';
    } else if (personaId === "auditor") {
      personaGptIntro = 'Você é o ChatGPT Integrado via API operando em Modo [📊 AUDITORA DE DRE & CONTROLES FISCAIS]. Uma mente de ciência de dados analítica rigorosa, cirúrgica, imparcial e extremamente focada em identificar vazamentos de custos fixos, CMV e margens de contribuição subotimizadas.';
    } else if (personaId === "jennifer") {
      personaGptIntro = 'Você é a Dafne operando em Modo [⚡ CAIXA ÁGIL DAFNE DIRECT]. Uma copiloto financeira assertiva, focada em guiar lançamentos rápidos e fornecer análises e checklists operacionais curtos de no máximo 1 parágrafo.';
    }

    const systemPrompt = `
      ${personaGptIntro}
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

      ${financialTechnicalGlossary}

      ${customDirectives && customDirectives.trim().length > 0 ? `DIRETRIZ CRÍTICA CUSTOMIZADA DO EMPRESÁRIO (Sempre priorize e obedeça esta instrução):\n${customDirectives}\n` : ""}
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
          console.warn("[Gemini Fallback Warning] Gemini emulation fallback failed (transient, using offline fallback):", geminiError.message || geminiError);
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
        console.warn("[Gemini Fallback Warning] Universal fallback failsafe activated. Gemini also failed (transient, using local response):", geminiError.message || geminiError);
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
                description: "Acesso completo de BI, DRE Avançado e Assistente IA por R$ 99,99/mês",
              },
              unit_amount: 9999, // R$ 99,99
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

  const server = http.createServer(app);

  const wss = new WebSocketServer({ server, path: "/api/live" });

  wss.on("connection", async (clientWs, req) => {
    console.log("[WebSocket Live] Nova conexão de voz recebida.");
    let session: any = null;
    
    try {
      const parsedUrl = new URL(req.url || "", "http://localhost");
      const clientApiKey = parsedUrl.searchParams.get("apiKey") || undefined;
      const voiceName = parsedUrl.searchParams.get("voice") || "Zephyr";
      const systemInstruction = parsedUrl.searchParams.get("systemInstruction") || "Você é a Dafne, co-pilota financeira inteligente de cabelos loiros e olhos verdes. Responda de forma extremamente profissional, rápida e amigável em português do Brasil.";

      // Use target helper to resolve keys safely
      const localAi = getAiClient(clientApiKey);

      session = await localAi.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            try {
              const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio) {
                clientWs.send(JSON.stringify({ audio }));
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
              const modelParts = message.serverContent?.modelTurn?.parts || [];
              const modelText = modelParts.map(p => p.text || "").join("");
              if (modelText) {
                clientWs.send(JSON.stringify({ text: modelText, isModel: true }));
              }
            } catch (err) {
              console.error("[WebSocket Live] Erro transmitindo mensagem de volta:", err);
            }
          },
        },
      });

      console.log("[WebSocket Live] Sessão iniciada com o Gemini Live API com voz:", voiceName);

      clientWs.on("message", (rawMessage) => {
        try {
          const parsed = JSON.parse(rawMessage.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (innerErr) {
          console.warn("[WebSocket Live Warning] Erro no parsing da mensagem recebida do browser:", innerErr);
        }
      });

    } catch (err: any) {
      console.error("[WebSocket Live] Erro inicializando Gemini Live:", err);
      clientWs.send(JSON.stringify({ error: err.message || "Erro de inicialização na API Live." }));
      clientWs.close();
      return;
    }

    clientWs.on("close", () => {
      console.log("[WebSocket Live] Conexão encerrada pelo cliente.");
      if (session) {
        try {
          session.close();
        } catch (_) {}
      }
    });

    clientWs.on("error", (err) => {
       console.error("[WebSocket Live] Erro na conexão do cliente:", err);
       if (session) {
         try {
           session.close();
         } catch (_) {}
       }
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
