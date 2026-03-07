
import React, { useState, useEffect } from 'react';
import { Mail, X, Loader2, Send, Copy, Check, ShieldCheck, Zap, Info, Bot, Globe, Lock, ShieldAlert, Users, ExternalLink, ShieldQuestion, Monitor } from 'lucide-react';
import { Player } from '../types';
import { generateScoutingEmail } from '../services/gemini';
import { dispatchScoutingReport, DispatchStatus } from '../services/email';

interface EmailIntelModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  reportTitle?: string;
  initialDraft?: { subject: string, body: string };
}

export const EmailIntelModal: React.FC<EmailIntelModalProps> = ({ isOpen, onClose, players, reportTitle, initialDraft }) => {
  const [recipient, setRecipient] = useState('');
  const [draft, setDraft] = useState<{ subject: string, body: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialDraft) {
        setDraft(initialDraft);
        setLoading(false);
      } else if (players.length > 0) {
        handleDraftEmail();
      } else {
        setLoading(false);
      }
    }
    if (!isOpen) {
      setDispatchStatus(null);
    }
  }, [isOpen, players, initialDraft]);

  const handleDraftEmail = async () => {
    setLoading(true);
    setDraft(null);
    try {
      const result = await generateScoutingEmail(players, reportTitle);
      setDraft(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    const fullText = `Subject: ${draft.subject}\n\n${draft.body}\n\nCopyright & Patent Pending 2026 by Schuman Enterprises LLC`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloudDispatch = async () => {
    if (!draft || !recipient.trim()) {
        alert("Please enter a valid recipient address.");
        return;
    }
    
    await dispatchScoutingReport(
      recipient, 
      draft.subject, 
      draft.body,
      (status) => setDispatchStatus(status)
    );
  };

  const openRelay = (type: 'native' | 'gmail' | 'outlook' | 'yahoo') => {
    if (!draft) return;
    
    const subject = encodeURIComponent(draft.subject);
    const body = encodeURIComponent(draft.body);
    const to = encodeURIComponent(recipient);

    let url = '';
    switch (type) {
      case 'gmail':
        url = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
        break;
      case 'outlook':
        url = `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${subject}&body=${body}`;
        break;
      case 'yahoo':
        url = `https://compose.mail.yahoo.com/?to=${to}&subject=${subject}&body=${body}`;
        break;
      default:
        url = `mailto:${recipient}?subject=${subject}&body=${body}`;
        break;
    }

    window.open(url, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  const isDone = dispatchStatus?.step === 'success';
  const isSecurityBlock = dispatchStatus?.step === 'security_block';
  const isError = dispatchStatus?.step === 'error';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-2xl rounded-[3.5rem] border border-slate-700 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
        
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-blue-600/10 rounded-3xl border border-blue-500/20 shadow-inner">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">Cloud Dispatcher</h3>
                <div className="flex items-center gap-2 mt-1">
                   <Users className="w-3.5 h-3.5 text-blue-400" />
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{initialDraft ? 'Grounded Intel Report' : `Reporting for ${players.length} targeted prospects`}</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-90">
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
                <Loader2 className="w-20 h-20 animate-spin text-blue-500/30" />
                <Bot className="w-10 h-10 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-white font-black text-xl tracking-tight">Synthesizing Intelligence...</h4>
                <p className="text-slate-500 text-sm max-w-[280px] font-medium leading-relaxed">Gemini is compiling production audits and recruiting summaries.</p>
              </div>
            </div>
          ) : dispatchStatus ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
               {isDone ? (
                 <div className="space-y-6">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20 mx-auto">
                        <Check className="w-12 h-12 text-emerald-400 animate-in zoom-in duration-500" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-white mb-2">Intel Dispatched</h4>
                        <p className="text-slate-400 font-medium">Reporting has been securely routed to staff inboxes.</p>
                    </div>
                 </div>
               ) : (isSecurityBlock || isError) ? (
                  <div className="space-y-8 max-w-lg mx-auto w-full">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/20 mx-auto">
                        <ShieldQuestion className="w-10 h-10 text-amber-400" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-white mb-2">{isSecurityBlock ? 'Relay Restriction' : 'Dispatch Halted'}</h4>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">{isSecurityBlock ? "The automated Cloud Relay is restricted by browser security policies. Choose your preferred dispatch protocol below to send manually." : dispatchStatus.message}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => openRelay('gmail')}
                         className="flex flex-col items-center gap-3 p-5 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500/50 hover:bg-slate-900 transition-all group shadow-xl"
                       >
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                            <span className="text-lg font-black text-white">G</span>
                         </div>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gmail</span>
                       </button>

                       <button 
                         onClick={() => openRelay('outlook')}
                         className="flex flex-col items-center gap-3 p-5 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500/50 hover:bg-slate-900 transition-all group shadow-xl"
                       >
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform text-blue-400">
                            <Monitor className="w-5 h-5" />
                         </div>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Outlook</span>
                       </button>

                       <button 
                         onClick={() => openRelay('yahoo')}
                         className="flex flex-col items-center gap-3 p-5 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500/50 hover:bg-slate-900 transition-all group shadow-xl"
                       >
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                            <span className="text-lg font-black text-purple-400 italic">Y!</span>
                         </div>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yahoo</span>
                       </button>

                       <button 
                         onClick={() => openRelay('native')}
                         className="flex flex-col items-center gap-3 p-5 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500/50 hover:bg-slate-900 transition-all group shadow-xl"
                       >
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform text-emerald-400">
                            <Mail className="w-5 h-5" />
                         </div>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Default App</span>
                       </button>
                    </div>

                    <button onClick={() => setDispatchStatus(null)} className="text-slate-600 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors">Return to Draft</button>
                  </div>
               ) : (
                  <div className="w-full max-w-sm space-y-8">
                     <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-800">
                            <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 animate-progress-indeterminate w-full"></div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 justify-center text-blue-400 animate-pulse">
                           <Globe className="w-5 h-5" />
                           <span className="font-black text-sm uppercase tracking-widest">{dispatchStatus.message}</span>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          ) : draft ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Staff Recipient(s)</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="email"
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    placeholder="coach@university.edu, director@recruiting.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 pl-12 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold shadow-inner"
                  />
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 relative group shadow-2xl">
                <div className="absolute top-6 right-6 flex gap-3">
                   <button 
                     onClick={handleCopy}
                     className={`p-3 rounded-xl border transition-all ${copied ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}
                   >
                     {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                   </button>
                </div>
                <div className="space-y-6 max-h-[320px] overflow-y-auto pr-6 scrollbar-hide">
                  <div>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">Subject Line</span>
                    <p className="text-lg font-black text-white leading-tight pr-12">{draft.subject}</p>
                  </div>
                  <div className="h-px bg-slate-800/50 w-full"></div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Intelligence Body</span>
                    <p className="text-xs text-slate-400 leading-[1.8] whitespace-pre-wrap font-medium">{draft.body}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={onClose}
                  className="flex-1 px-8 py-5 rounded-2xl font-black text-slate-500 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest text-xs"
                >
                  Discard Intel
                </button>
                <button 
                  onClick={handleCloudDispatch}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Initialize Cloud Dispatch
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-6">
               <Zap className="w-10 h-10 text-red-500/40 mx-auto" />
               <button onClick={handleDraftEmail} className="px-8 py-3 bg-slate-800 text-blue-400 font-black rounded-xl">Retry AI Draft</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
