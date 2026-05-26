import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Interceptor global de requisições de IA para habilitar a própria chave em todo o sistema
try {
  const originalFetch = window.fetch;
  
  const customFetch = async function (this: any, input: any, init: any) {
    try {
      const url = typeof input === "string" 
        ? input 
        : input instanceof URL 
          ? input.toString() 
          : (input && typeof input === "object" && "url" in input) 
            ? input.url 
            : "";
      
      if (url && typeof url === "string" && url.includes("/api/ai/")) {
        const customModel = localStorage.getItem("selected_gemini_model") || "gemini-3.5-flash";
        
        // Clona as opções adicionais para evitar mutar objetos de configuração congelados ou somente leitura do chamador
        const newInit = init ? { ...init } : {};
        
        // Constrói um novo objeto de Headers
        const headers = new Headers();
        
        // Copia os cabeçalhos preexistentes seguros da configuração original
        if (init && init.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value: string, key: string) => {
              headers.append(key, value);
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
              headers.append(key, value);
            });
          } else if (typeof init.headers === "object") {
            Object.entries(init.headers).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                headers.append(key, String(value));
              }
            });
          }
        }
        
        // Copia cabeçalhos caso a requisição seja instanciada com um objeto Request
        if (input && typeof input === "object" && input.headers instanceof Headers) {
          input.headers.forEach((value: string, key: string) => {
            if (!headers.has(key)) {
              headers.append(key, value);
            }
          });
        }
        
        // Injeta o cabeçalho do modelo selecionado
        headers.set("X-Custom-Gemini-Model", customModel);
        newInit.headers = headers;

        // Injeta com segurança o modelo selecionado no body JSON caso exista
        if (newInit.body && typeof newInit.body === "string" && newInit.body.startsWith("{")) {
          try {
            const bodyObj = JSON.parse(newInit.body);
            bodyObj.geminiModel = customModel;
            newInit.body = JSON.stringify(bodyObj);
          } catch (e) {
            // Silencia falhas de conversão de JSON
          }
        }
        
        // Se a entrada original for do tipo Request, constrói uma nova requisição adaptável
        if (input instanceof Request) {
          const newRequest = new Request(input, newInit);
          return originalFetch.call(this || window, newRequest);
        }
        
        return originalFetch.call(this || window, input, newInit);
      }
    } catch (err) {
      console.warn("[Interceptor Fetch] Falha ao processar cabeçalhos otimizados. Utilizando fallback transparente da requisição original:", err);
    }
    
    // Fallback absoluto e ultra-seguro: encaminha os parâmetros idênticos e não alterados à chamada nativa
    return originalFetch.call(this || window, input, init);
  };

  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (error) {
  console.warn("Não foi possível interceptar globalmente window.fetch. Utilizando fallback local.", error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

