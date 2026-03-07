
import React, { useState, useRef, useEffect } from 'react';
import { chatWithIntel, fastChatWithIntelStream } from '../services/gemini';
import { ChatMessage, GroundingSource } from '../types';
import { Send, Bot, User, Loader2, Link as LinkIcon, Zap, Globe, Volume2, Search, DollarSign, Target, HelpCircle, LayoutDashboard, Terminal, MessageSquare, Brain, Mic2, ShieldAlert } from 'lucide-react';
import { ScoutingAudioPlayer } from './ScoutingAudioPlayer';

interface ChatInterfaceProps {
  isPro?: boolean;
  onRequestPro?: () => boolean;
  onVoiceDeepDive?: (context: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isPro, onRequestPro, onVoiceDeepDive }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I'm your PortalIntel Scout Assistant. I can help you find talent, estimate NIL values, or explain how to use our platform's elite scouting tools. Select a template below or ask me anything.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(messages.length === 1);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend: string = input) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowTemplates(false);
    setErrorStatus(null);

    try {
      // Construct history turns for the intelligence relay
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      if (turboMode) {
        const botId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
          id: botId,
          role: 'model',
          content: '',
          timestamp: Date.now()
        }]);

        let fullText = '';
        await fastChatWithIntelStream(history, userMsg.content, (chunk) => {
          fullText += chunk;
          setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: fullText } : m));
        });
      } else {
        const response = await chatWithIntel(history, userMsg.content, thinkingMode);
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: response.text,
          sources: response.sources,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (error: any) {
      console.error("Chat Interaction Failure:", error);
      setErrorStatus(error.message || "Network Timeout");
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "Sorry, I encountered a relay error while auditing the portal network. This usually occurs if the grounding source is unresponsive or the search parameters are too narrow.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    {
      category: "Talent Discovery",
      icon: Search,
      color: "text-blue-400",
      prompts: [
        "Find me undecided 4-star offensive tackles from the SEC.",
        "List top interior defensive linemen entering the portal today.",
        "Identify best available QBs with over 2000 career passing yards."
      ]
    },
    {
      category: "NIL & Financials",
      icon: DollarSign,
      color: "text-emerald-400",
      prompts: [
        "What is the estimated NIL valuation for Julian Lewis?",
        "Compare NIL asking prices for top 3 portal wide receivers.",
        "Synthesize recent NIL contract trends for starting O-Line."
      ]
    },
    {
      category: "Team Strategy",
      icon: Target,
      color: "text-purple-400",
      prompts: [
        "Which portal players fit a pro-style passing offense?",
        "Identify top defensive targets for a program with an $800k budget.",
        "Rank available safeties by their impact on a Top-25 defense."
      ]
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] max-w-7xl mx-auto gap-6 animate-in fade-in duration-700">
      
      {/* Templates Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-4 order-2 lg:order-1">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
           <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Scout Master Prompts</h3>
           </div>
           
           <div className="space-y-8 h-[calc(100vh-18rem)] overflow-y-auto scrollbar-hide pr-2">
              {templates.map((cat, i) => (
                <div key={i} className="space-y-3">
                   <div className="flex items-center gap-2 px-1">
                      <cat.icon className={`w-3.5 h-3.5 ${cat.color}`} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{cat.category}</span>
                   </div>
                   <div className="space-y-2">
                      {cat.prompts.map((p, j) => (
                        <button 
                          key={j}
                          onClick={() => handleSend(p)}
                          className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3 rounded-xl transition-all group active:scale-95 shadow-sm"
                        >
                           <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 leading-relaxed italic">"{p}"</p>
                        </button>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Main Chat Hub */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl order-1 lg:order-2">
        <div className="p-5 md:p-7 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <Bot className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h2 className="font-black text-white text-base tracking-tight uppercase">Scout Assistant Hub</h2>
              <div className="flex items-center gap-2">
                <p className={`text-[10px] font-black flex items-center gap-1.5 ${thinkingMode ? 'text-purple-400' : turboMode ? 'text-amber-400' : 'text-blue-400'} uppercase tracking-widest`}>
                  {thinkingMode ? <Brain className="w-3 h-3 animate-pulse" /> : turboMode ? <Zap className="w-3 h-3" /> : <Globe className="w-3 h-3 animate-pulse" />}
                  {thinkingMode ? 'Deep Intelligence Active' : turboMode ? 'Fast Intelligence Mode' : 'Grounded Deep Search Active'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            {errorStatus && (
               <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-[9px] font-black text-red-500 uppercase animate-pulse">
                  <ShieldAlert className="w-3 h-3" /> Relay Warning
               </div>
            )}
            <button 
              onClick={() => {
                setThinkingMode(!thinkingMode);
                if (!thinkingMode) setTurboMode(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                thinkingMode 
                  ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                  : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Brain className={`w-4 h-4 ${thinkingMode ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Deep Intel</span>
            </button>

            <button 
              onClick={() => {
                setTurboMode(!turboMode);
                if (!turboMode) setThinkingMode(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                turboMode 
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                  : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Zap className={`w-4 h-4 ${turboMode ? 'fill-current animate-bounce' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Turbo</span>
            </button>
            <button 
              onClick={() => setMessages([messages[0]])}
              className="p-3 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-500 hover:text-white rounded-xl transition-all active:scale-90"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in duration-300`}
            >
              <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg border ${
                msg.role === 'user' ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700'
              }`}>
                {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-blue-400" />}
              </div>

              <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-6 py-4 rounded-[2rem] relative shadow-xl ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm border border-blue-400/20'
                      : 'bg-[#0b1221] text-slate-200 rounded-tl-sm border border-slate-800'
                  }`}
                >
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed font-medium whitespace-pre-wrap">
                    {msg.content || (loading && msg.role === 'model' && msg.id === messages[messages.length - 1].id ? <span className="flex gap-1.5 py-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></span><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></span></span> : null)}
                  </div>
                  
                  {msg.role === 'model' && msg.content && (
                    <div className="absolute -right-12 top-0 flex flex-col gap-2">
                      <button 
                        onClick={() => setActiveAudioId(activeAudioId === msg.id ? null : msg.id)}
                        className={`p-3 rounded-2xl transition-all ${activeAudioId === msg.id ? 'bg-blue-600 text-white shadow-xl scale-110' : 'bg-slate-800 text-slate-500 hover:text-blue-400'}`}
                        title="Generate Audio Brief"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onVoiceDeepDive?.(msg.content)}
                        className="p-3 rounded-2xl bg-slate-800 text-slate-500 hover:text-blue-400 transition-all hover:scale-110 shadow-xl"
                        title="Voice Deep Dive Analysis"
                      >
                        <Mic2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                
                {activeAudioId === msg.id && (
                  <div className="mt-4 w-full animate-in fade-in slide-in-from-top-2">
                     <ScoutingAudioPlayer 
                       text={msg.content} 
                       label="Scout Intel Audio" 
                       onClose={() => setActiveAudioId(null)}
                     />
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-xl border border-slate-800 transition-all text-[10px] font-black uppercase tracking-widest max-w-[240px] truncate shadow-sm"
                      >
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{source.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && !turboMode && (
            <div className="flex gap-6 animate-in fade-in duration-300">
               <div className="w-10 h-10 rounded-2xl bg-slate-800 flex-shrink-0 flex items-center justify-center border border-slate-700 shadow-lg">
                  <Bot className="w-6 h-6 text-blue-500" />
               </div>
               <div className="bg-[#0b1221] px-6 py-4 rounded-[2rem] rounded-tl-sm flex items-center gap-3 border border-slate-800 shadow-xl">
                  {thinkingMode ? <Brain className="w-5 h-5 animate-pulse text-purple-400" /> : <Loader2 className="w-5 h-5 animate-spin text-blue-500/50" />}
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    {thinkingMode ? 'Performing neural audit of demographic data...' : 'Grounding national recruiting channels...'}
                  </span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 md:p-8 bg-slate-900 border-t border-slate-800">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            className="relative group max-w-5xl mx-auto"
          >
            {turboMode && (
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            )}
            {thinkingMode && (
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            )}
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={thinkingMode ? "Ask Deep Intelligence (Complex reasoning)..." : turboMode ? "Ask Fast Scout (Instant response)..." : "Ask about a player, team need, or platform help..."}
                className={`w-full bg-[#0d1526] text-white placeholder-slate-700 rounded-[2rem] pl-8 pr-16 py-5 focus:outline-none focus:ring-2 transition-all border text-lg font-medium shadow-inner ${
                  thinkingMode ? 'border-purple-500/30 focus:ring-purple-500/50' : turboMode ? 'border-amber-500/30 focus:ring-amber-500/50' : 'border-slate-800 focus:ring-blue-500/50'
                }`}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-3.5 rounded-2xl transition-all ${
                  thinkingMode
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : turboMode 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                } disabled:opacity-50 active:scale-90`}
              >
                {thinkingMode ? <Brain className="w-5 h-5" /> : turboMode ? <Zap className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${thinkingMode ? 'bg-purple-500' : turboMode ? 'bg-amber-500' : 'bg-blue-500'} animate-pulse`}></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Authorized Intelligence Node</span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] italic">Powered by Gemini 3 Pro</p>
          </div>
        </div>
      </div>
    </div>
  );
};
