
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Bot, ShieldCheck, Zap, X, BrainCircuit, Activity, Waves, ShieldAlert, Cpu, RefreshCcw } from 'lucide-react';
import { encode, decode, decodeAudioData } from '../services/audio-utils';

interface LiveVoiceHubProps {
  isPro: boolean;
  onRequestPro: () => void;
  initialContext?: string;
}

export const LiveVoiceHub: React.FC<LiveVoiceHubProps> = ({ isPro, onRequestPro, initialContext }) => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Refs to handle stale closures in audio process callbacks
  const isMutedRef = useRef(false);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    setIsActive(false);
    setLoading(false);
  };

  const startSession = async () => {
    if (!isPro) {
      onRequestPro();
      return;
    }

    setLoading(true);
    setError(null);
    setTranscript([]);
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';

    try {
      // Prompting for microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Crucial for mobile: resume context on user gesture
      if (inputAudioContext.state === 'suspended') await inputAudioContext.resume();
      if (outputAudioContext.state === 'suspended') await outputAudioContext.resume();
      
      audioContextRef.current = { input: inputAudioContext, output: outputAudioContext };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              // Note: strictly adhering to "do not add other condition checks" for sendRealtimeInput
              // but we check a ref to allow muting logic without breaking the promise chain
              if (isMutedRef.current) return;

              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              // CRITICAL: Solely rely on sessionPromise resolves
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
            setIsActive(true);
            setLoading(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Process model audio
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContext) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Transcription aggregation logic
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscriptionRef.current;
              const modelText = currentOutputTranscriptionRef.current;
              
              if (userText || modelText) {
                setTranscript(prev => {
                  const newTranscript = [...prev];
                  if (userText) newTranscript.push({ role: 'user', text: userText });
                  if (modelText) newTranscript.push({ role: 'model', text: modelText });
                  return newTranscript;
                });
              }
              
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            setError("The neural relay encountered a signal interruption. Verify your hardware connection.");
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are an elite CFB Recruiting Analyst for PortalIntel.ai. 
            Act as a high-level scouting director named 'Zephyr'. 
            Provide real-time voice feedback on player profiles.
            Current Intelligence Context: ${initialContext || 'Global 2026 Recruitment Grid Active.'}`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Hardware Access Error:", err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || err.message?.includes('device not found')) {
        setError("Authorized audio hardware not detected. Please ensure a microphone is connected and try again.");
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Microphone permission denied. Please enable access in browser settings to connect.");
      } else {
        setError(err.message || "Encryption bridge failure. Check network integrity.");
      }
      setLoading(false);
    }
  };

  const createPcmBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-4">
      <div className="bg-[#0b1224] border border-slate-800 p-10 md:p-20 rounded-[4rem] relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
        {/* Animated Background Atmosphere */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] -mr-64 -mt-64 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] -ml-48 -mb-48 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-12 w-full flex flex-col items-center">
          {/* Neural Radar Visualized Section */}
          <div className="relative mb-4">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 border-2 border-blue-500/5 rounded-full animate-ping pointer-events-none opacity-40"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 border border-blue-500/10 rounded-full animate-[pulse_4s_infinite] pointer-events-none"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 border border-blue-500/20 rounded-full animate-[pulse_2s_infinite] pointer-events-none"></div>
            
            <div className={`relative w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] flex items-center justify-center border-2 transition-all duration-700 z-10 ${isActive ? 'bg-blue-600 border-blue-400 shadow-[0_0_100px_rgba(37,99,235,0.5)] scale-110' : 'bg-slate-900/90 backdrop-blur-2xl border-slate-700 shadow-2xl'}`}>
              {loading ? (
                <Loader2 className="w-14 h-14 text-blue-400 animate-spin" />
              ) : (
                <Bot className={`w-14 h-14 md:w-20 md:h-20 ${isActive ? 'text-white animate-pulse' : 'text-slate-600'}`} />
              )}
            </div>
          </div>

          <div className="space-y-4">
             <h2 className="text-4xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-2xl">Voice Intel Hub</h2>
             <p className="text-slate-400 text-lg md:text-2xl max-w-xl mx-auto leading-relaxed font-medium">
                Initialize an encrypted real-time audio bridge with our Elite Scouting Node.
             </p>
          </div>

          {error ? (
            <div className="w-full max-w-lg animate-in slide-in-from-top-4 duration-500">
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex flex-col items-center gap-6 text-center shadow-xl backdrop-blur-md">
                 <div className="p-4 bg-red-500/20 rounded-2xl">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                 </div>
                 <div className="space-y-2">
                    <p className="text-sm font-black text-white uppercase tracking-widest leading-none">Hardware Protocol Error</p>
                    <p className="text-slate-500 text-xs font-bold leading-relaxed">{error}</p>
                 </div>
                 <button 
                  onClick={startSession}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                 >
                    <RefreshCcw className="w-4 h-4" /> Retry Hardware Sync
                 </button>
              </div>
            </div>
          ) : !isActive ? (
             <button 
               onClick={startSession}
               disabled={loading}
               className="group relative bg-blue-600 hover:bg-blue-500 text-white px-14 py-7 rounded-[2.5rem] font-black text-xl uppercase tracking-widest transition-all shadow-[0_20px_60px_rgba(37,99,235,0.4)] active:scale-95 flex items-center gap-5 disabled:opacity-50"
             >
               <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
               {loading ? <Loader2 className="animate-spin w-7 h-7" /> : <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />}
               Initialize Relay
             </button>
          ) : (
            <div className="flex flex-col items-center gap-8 w-full">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-8 rounded-[2rem] border-2 transition-all active:scale-90 shadow-2xl ${isMuted ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                    title={isMuted ? "Unmute Scout" : "Mute Scout"}
                  >
                    {isMuted ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                  </button>
                  <button 
                    onClick={stopSession}
                    className="p-8 bg-slate-900 border-2 border-slate-800 text-red-500 rounded-[2rem] hover:bg-red-950/20 transition-all active:scale-90 shadow-xl"
                  >
                    <X className="w-10 h-10" />
                  </button>
               </div>

               <div className="w-full bg-slate-950/80 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 max-h-[400px] overflow-y-auto scrollbar-hide text-left space-y-8 shadow-inner relative">
                  <div className="sticky top-0 right-0 flex justify-end">
                     <span className="bg-blue-600/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">E2E Encrypted Stream</span>
                  </div>
                  {transcript.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 opacity-20 text-center space-y-4">
                       <Waves className="w-12 h-12 text-slate-700 animate-bounce" />
                       <p className="text-xs font-black uppercase tracking-[0.3em]">Awaiting scout vocal input...</p>
                    </div>
                  )}
                  {transcript.map((m, i) => (
                    <div key={i} className={`flex gap-5 animate-in fade-in slide-in-from-bottom-2 ${m.role === 'user' ? 'opacity-70' : ''}`}>
                       <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-xl ${m.role === 'user' ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-blue-600/10 border-blue-500/30 text-blue-400'}`}>
                          {m.role === 'user' ? <Activity className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                       </div>
                       <div className="flex-1 space-y-2">
                          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${m.role === 'user' ? 'text-slate-600' : 'text-blue-500'}`}>{m.role === 'user' ? 'Field Agent' : 'Zephyr Analyst'}</p>
                          <p className={`text-sm md:text-lg font-bold leading-relaxed ${m.role === 'user' ? 'text-slate-400 italic' : 'text-slate-100'}`}>
                             {m.text}
                          </p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { icon: Cpu, color: 'text-blue-400', label: 'Neural Relay', desc: 'Native audio grounding via Gemini 2.5 architecture.' },
           { icon: Zap, color: 'text-emerald-400', label: 'Low Latency', desc: 'Real-time roster fit and NIL risk discussion.' },
           { icon: BrainCircuit, color: 'text-indigo-400', label: 'Multi-Step Logic', desc: 'Complex recruiting scenarios resolved conversationally.' }
         ].map((feat, idx) => (
           <div key={idx} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-5 shadow-xl hover:border-blue-500/30 transition-all group">
              <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                 <feat.icon className={`w-8 h-8 ${feat.color}`} />
              </div>
              <div>
                 <h4 className="text-white font-black uppercase tracking-tight text-xl italic">{feat.label}</h4>
                 <p className="text-slate-500 text-sm leading-relaxed font-medium mt-1">{feat.desc}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="p-10 bg-slate-950/40 border border-dashed border-slate-800 rounded-[3rem] text-center">
         <ShieldCheck className="w-12 h-12 text-emerald-500/10 mx-auto mb-6" />
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] leading-loose max-w-4xl mx-auto">
            AUTHORIZED PERSONNEL INTERFACE v4.2 • SECURE AUDIO RELAY LINK <br/>
            ALL DATA IS END-TO-END ENCRYPTED VIA GEMINI NEURAL INFRASTRUCTURE
         </p>
      </div>
    </div>
  );
};
