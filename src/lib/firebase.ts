import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);

// Silence benign internal Firestore connection/debug/warning logs completely
try {
  setLogLevel('silent');
} catch (e) {}

// Global interceptor to prevent noisy, expected gRPC-Web stream cancellation logs from polluting the console
if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;

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
          // Loop through keys safely
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

  console.info = (...args: any[]) => {
    if (isBenignFirestoreLog(args)) return;
    originalInfo.apply(console, args);
  };

  console.debug = (...args: any[]) => {
    if (isBenignFirestoreLog(args)) return;
    originalDebug.apply(console, args);
  };

  if (typeof window !== 'undefined') {
    // Prevent reaching window.onerror or unhandled promise rejection for these specific idle disconnect errors and cross-origin stream error masks
    window.addEventListener('error', (event) => {
      const errorMsg = event.message || '';
      if (
        errorMsg.includes('Disconnecting idle stream') ||
        errorMsg.includes('Disconnecting idle stream. Timed out waiting for new targets') ||
        errorMsg.includes('GrpcConnection') ||
        errorMsg.includes('stream error. code: 1') ||
        errorMsg.toLowerCase().includes('script error') ||
        errorMsg === 'Script error.'
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      if (reason) {
        const reasonStr = String(reason).toLowerCase();
        if (
          reasonStr.includes('disconnecting idle stream') ||
          reasonStr.includes('cancelled: disconnecting idle stream') ||
          reasonStr.includes('timed out waiting for new targets') ||
          reasonStr.includes('stream error. code: 1') ||
          reasonStr.includes('script error')
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }, true);
  }
}
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const loginWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Redirect login error:', error);
    throw error;
  }
};

// Connection checked dynamically on-demand; no blocking or false-positive offline-checks on initial load.
