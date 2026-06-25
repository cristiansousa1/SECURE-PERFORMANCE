import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Sparkles, 
  Activity, 
  Info,
  Waves,
  RefreshCw,
  X,
  Bot,
  User,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { GaplessAudioPlayer, float32ToInt16, bufferToBase64 } from '../utils/liveAudioHelper';
import { useFinance } from '../contexts/FinanceContext';

interface TranscriptLine {
  id: string;
  sender: 'user' | 'model';
  text: string;
}

export default function GeminiLiveCall({ onClose }: { onClose?: () => void }) {
  const { profile, showToast, isDemoMode } = useFinance();

  // Call Settings
  const [voice, setVoice] = useState<string>('Zephyr');
  const [systemInstruction, setSystemInstruction] = useState<string>(
    `Você é a Dafne, a co-piloto financeira inteligente com cabelos loiros e olhos verdes chamativos do aplicativo de BI financeiro. Seu tom é profissional, ágil, extremamente empático e amigável. Responda de forma curta e direta para conversas por voz em português do Brasil.`
  );
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // States
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<GaplessAudioPlayer | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCall();
    };
  }, []);

  const handleInterrupt = () => {
    if (playerRef.current) {
      playerRef.current.clearQueue();
    }
    setStatus('listening');
  };

  const startCall = async () => {
    try {
      setStatus('connecting');
      setTranscript([]);
      setErrorMessage('');

      // Initialize player
      if (!playerRef.current) {
        playerRef.current = new GaplessAudioPlayer(24000);
      }
      playerRef.current.init();

      // Setup WebSocket connection
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const connectionUrl = `${wsProtocol}//${window.location.host}/api/live?voice=${voice}&systemInstruction=${encodeURIComponent(systemInstruction)}`;
      
      const ws = new WebSocket(connectionUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('[WebSocket Client] Conectado e iniciando captura de áudio...');
        try {
          await startAudioCapture();
          setStatus('listening');
          showToast('Chamada de voz com Dafne iniciada!', 'success');
        } catch (micErr: any) {
          console.error('Erro de permissão ou captura de microfone:', micErr);
          setStatus('error');
          setErrorMessage('Erro ao acessar o microfone. Verifique as permissões.');
          stopCall();
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.error) {
            setStatus('error');
            setErrorMessage(message.error);
            showToast(`Erro na Conexão Live: ${message.error}`, 'error');
            stopCall();
            return;
          }

          if (message.interrupted) {
            console.log('[WebSocket Client] Interrupção detectada');
            handleInterrupt();
            return;
          }

          if (message.audio) {
            setStatus('speaking');
            if (playerRef.current) {
              playerRef.current.playChunk(message.audio);
            }
          }

          if (message.text) {
            const isModel = message.isModel;
            setTranscript((prev) => {
              const lastLine = prev[prev.length - 1];
              if (lastLine && lastLine.sender === (isModel ? 'model' : 'user')) {
                // Append text to existing line
                return [
                  ...prev.slice(0, -1),
                  { ...lastLine, text: lastLine.text + message.text }
                ];
              } else {
                // Return new line
                return [
                  ...prev,
                  {
                    id: Math.random().toString(),
                    sender: isModel ? 'model' : 'user',
                    text: message.text,
                  }
                ];
              }
            });
          }

        } catch (err) {
          console.warn('[WebSocket Client Warning] Erro processando dados do servidor:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket Client] Conexão encerrada pelo servidor.');
        if (status !== 'error') {
          setStatus('idle');
        }
      };

      ws.onerror = (err) => {
        console.error('[WebSocket Client] Erro no socket cliente:', err);
        setStatus('error');
        setErrorMessage('Falha na comunicação de rede com o servidor de voz.');
      };

    } catch (err: any) {
      console.error('Falha de inicialização:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Falha de inicialização desconhecida.');
    }
  };

  const startAudioCapture = async () => {
    // MediaStream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    audioStreamRef.current = stream;

    // input context at 16000Hz (downsamples/converts voice inputs natively)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });
    inputAudioCtxRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    
    // ScriptProcessorNode
    const processor = audioContext.createScriptProcessor(2048, 1, 1);
    processorRef.current = processor;

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (isMuted) return;

      const float32Pcm = e.inputBuffer.getChannelData(0);
      const int16Buffer = float32ToInt16(float32Pcm);
      const base64Data = bufferToBase64(int16Buffer);

      ws.send(JSON.stringify({ audio: base64Data }));
    };
  };

  const stopCall = () => {
    // Close websocket session
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_) {}
      wsRef.current = null;
    }

    // Stop microphone stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    // Disconnect processors
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (_) {}
      processorRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (_) {}
      inputAudioCtxRef.current = null;
    }

    // Stop player sound
    if (playerRef.current) {
      try {
        playerRef.current.stop();
      } catch (_) {}
      playerRef.current = null;
    }

    if (status !== 'error') {
      setStatus('idle');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    showToast(isMuted ? 'Microfone ativado!' : 'Microfone mutado no canal.', 'info');
  };

  // Pulse rings helper for micro visualizers
  const renderStatusWaveform = () => {
    let text = 'Ocioso';
    let ringColor = 'bg-slate-400';
    let showWave = false;

    if (status === 'connecting') {
      text = 'Conectando à Dafne...';
      ringColor = 'bg-orange-500 animate-ping';
    } else if (status === 'listening') {
      text = isMuted ? 'Mudo (Sem capturar)' : 'Dafne ouvindo... Pode falar!';
      ringColor = isMuted ? 'bg-amber-400' : 'bg-rose-500 animate-pulse';
      showWave = !isMuted;
    } else if (status === 'speaking') {
      text = 'Dafne falando...';
      ringColor = 'bg-emerald-500 animate-pulse';
      showWave = true;
    } else if (status === 'thinking') {
      text = 'Dafne processando...';
      ringColor = 'bg-indigo-500 animate-bounce';
    } else if (status === 'error') {
      text = 'Erro na Conexão';
      ringColor = 'bg-red-500';
    }

    return (
      <div className="flex flex-col items-center">
        {/* Immersive voice ring glow */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
          <AnimatePresence>
            {showWave && (
              <>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border border-orange-500/30 bg-orange-500/5"
                />
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0.4 }}
                  animate={{ scale: [1, 2.2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: Math.random() * 1.5 + 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border border-purple-500/20 bg-purple-500/5"
                />
              </>
            )}
          </AnimatePresence>

          <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-white overflow-hidden transition-all duration-500 ${
            status === 'listening' && !isMuted ? 'bg-gradient-to-tr from-rose-50 to-rose-100 ring-4 ring-rose-200' : 
            status === 'speaking' ? 'bg-gradient-to-tr from-emerald-50 to-emerald-100 ring-4 ring-emerald-200' : 
            status === 'thinking' ? 'bg-gradient-to-tr from-indigo-50 to-indigo-100 ring-4 ring-indigo-200' : 
            status === 'connecting' ? 'bg-gradient-to-tr from-orange-50 to-orange-100 ring-4 ring-orange-200' :
            'bg-slate-50 border-gray-100'
          }`}>
            {status === 'speaking' ? (
              <Waves size={40} className="text-emerald-600 animate-pulse" />
            ) : status === 'listening' && !isMuted ? (
              <Mic size={40} className="text-rose-600 animate-bounce" />
            ) : status === 'listening' && isMuted ? (
              <MicOff size={40} className="text-amber-600" />
            ) : status === 'thinking' ? (
              <RefreshCw size={40} className="text-indigo-600 animate-spin" />
            ) : (
              <Bot size={40} className="text-slate-400" />
            )}
          </div>

          {/* Miniature state light */}
          <span className={`absolute bottom-2 right-2 flex h-5 w-5 rounded-full border-2 border-white select-none ${ringColor}`}></span>
        </div>

        <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 animate-fade-in flex items-center gap-1.5 font-mono">
          <Activity size={14} className={status !== 'idle' ? 'animate-pulse text-orange-500' : 'text-gray-400'} />
          {text}
        </h3>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200/80">
      {/* Wave Header style */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#141414] to-[#252525] text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-black text-sm relative">
            <Zap size={18} className="absolute -top-1 -right-1 text-black animate-bounce" />
            LIVE
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1">
              Dafne Live Voice Call <Sparkles size={11} className="animate-pulse" />
            </h4>
            <p className="text-[10px] text-gray-400 font-bold leading-none">Canal de Voz Bidirecional Gemini Live (3.1-Flash)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${showConfig ? 'bg-orange-500 text-black' : 'hover:bg-white/10 text-gray-300'}`}
            title="Configurações da Chamada"
          >
            <Settings size={16} />
          </button>
          
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-stretch p-5 gap-5 overflow-hidden">
        
        {/* Left Interactive Vis Panel */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-h-[300px] md:max-h-none md:flex-[0.8] relative overflow-hidden">
          {renderStatusWaveform()}

          {status === 'idle' ? (
            <button
              type="button"
              onClick={startCall}
              className="mt-6 w-full max-w-xs py-3 px-5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black uppercase text-[11px] tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <Play size={14} fill="currentColor" />
              Ligar para Dafne
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCall}
              className="mt-6 w-full max-w-xs py-3 px-5 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black uppercase text-[11px] tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <Square size={13} fill="currentColor" />
              Desligar Chamada
            </button>
          )}

          {errorMessage && (
            <p className="text-[10px] font-black text-red-500 mt-4 leading-normal bg-red-50 p-2 rounded-lg text-center border border-red-200">
              {errorMessage}
            </p>
          )}

          <div className="absolute bottom-3 text-center">
            <span className="text-[8px] font-black tracking-widest text-gray-400 font-mono uppercase">
              Latência Ultra-Baixa <ShieldCheck size={10} className="inline ml-0.5 text-emerald-500" />
            </span>
          </div>
        </div>

        {/* Right Active Transcript Lines */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Activity size={12} className="text-orange-500" />
              Transcrição da Conversa em Tempo Real
            </span>
            <span className="text-[9px] font-mono bg-orange-100 text-orange-850 px-1.5 py-0.5 rounded font-black">
              LIVE STREAM
            </span>
          </div>

          {/* Transcript Scroll Area */}
          <div 
            ref={transcriptContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[150px]"
          >
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-70 p-6">
                <Waves size={24} className="text-orange-300 animate-pulse mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">A chamada iniciará a transcrição imediata das palavras ditadas e respondidas</p>
              </div>
            ) : (
              transcript.map((line) => (
                <div 
                  key={line.id} 
                  className={`flex gap-3 max-w-sm ${line.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black uppercase ${
                    line.sender === 'user' ? 'bg-[#141414] text-white' : 'bg-orange-100 text-orange-900'
                  }`}>
                    {line.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed font-semibold shadow-2xs ${
                    line.sender === 'user' 
                      ? 'bg-[#141414] text-white rounded-tr-none' 
                      : 'bg-orange-50 text-gray-800 border border-orange-100 rounded-tl-none'
                  }`}>
                    {line.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Call Control Row */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              disabled={status === 'idle'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                isMuted 
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-205' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isMuted ? (
                <>
                  <MicOff className="text-amber-600" size={13} />
                  Microfone Mudo
                </>
              ) : (
                <>
                  <Mic className="text-slate-600" size={13} />
                  Mutar Canal
                </>
              )}
            </button>

            <span className="text-[9px] font-black text-gray-400 uppercase font-mono tracking-widest leading-none flex items-center gap-1">
              <Info size={11} /> 
              Fale continuamente, Dafne escuta e responde.
            </span>
          </div>

        </div>

      </div>

      {/* Floating Settings/Configuration drawer */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute inset-0 bg-[#141414]/95 text-white z-20 flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h4 className="font-black text-sm uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Settings size={16} className="text-orange-400" />
                Painel de Voz & Cognição Live
              </h4>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 max-w-xl mx-auto w-full">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">
                  Voz Artificial Integrada (Pre-built Sound Module)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVoice(v)}
                      className={`text-xs py-2.5 px-3 rounded-xl border text-center font-bold tracking-wider transition-all cursor-pointer ${
                        voice === v 
                          ? 'bg-orange-500 text-black border-orange-500' 
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                      }`}
                    >
                      {v === 'Zephyr' ? 'Zephyr (Feminina Suave)' : 
                       v === 'Puck' ? 'Puck (Masculina Jovem)' : 
                       v === 'Charon' ? 'Charon (Feminina Madura)' : 
                       v === 'Kore' ? 'Kore (Feminina Alegre)' : 
                       'Fenrir (Masculino Corporativo)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider">
                  Diretrizes Sistêmicas de Personalidade (System Prompt)
                </label>
                <textarea
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-orange-500 text-gray-200 font-semibold"
                  placeholder="Instruções de personalidade para a Dafne..."
                />
              </div>

              <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 text-[10px] text-gray-300 space-y-1.5 leading-normal">
                <p className="font-bold uppercase text-orange-400">Instruções Importantes para Uso:</p>
                <p>1. O modelo <span className="font-mono text-white">Live API (gemini-3.1-flash-live-preview)</span> responde de forma extremamente rápida, imitando o fluxo natural de uma ligação de voz.</p>
                <p>2. Caso fira a conexão por latência ou bloqueio de cache, você pode redefinir clicando em <span className="text-white">Desligar</span> e conectando novamente.</p>
                <p>3. Permita com segurança o microfone quando solicitado por seu navegador.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
              >
                Salvar e Voltar para Chamada
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
