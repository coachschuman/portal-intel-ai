import React, { useState } from 'react';
import { Book, ShieldCheck, Zap, Info, ImageOff, Loader2, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

export const ScoutPlaybook: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  // Directly link to the source if proxy fails, or use a slightly more robust proxy setup
  const rawUrl = "https://images.squarespace-cdn.com/content/v1/58249826cd0f68e0d65b77c5/29f8c67c-9b90-4828-98e9-d352b2b11568/The+Modern+Scout%27s+Playbook.png";
  const infographicUrl = `https://images.weserv.nl/?url=${encodeURIComponent(rawUrl)}&w=2000`;

  return (
    <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(30,58,138,0.3)]">
            <Book className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1">The Modern Scout's Playbook</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Strategic Intelligence Framework</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 border border-slate-800 rounded-full shadow-inner">
              <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Standard Operating Procedure</span>
           </div>
           <button 
             onClick={() => setIsZoomed(!isZoomed)}
             className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full border border-slate-700 transition-all active:scale-95"
             title={isZoomed ? "Exit Zoom" : "Maximize Playbook"}
           >
             {isZoomed ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
           </button>
        </div>
      </div>

      <div className={`relative group transition-all duration-500 ${isZoomed ? 'fixed inset-4 z-[100] md:inset-10' : ''}`}>
        {/* Subtle glow background */}
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/10 to-transparent rounded-[3rem] blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className={`relative bg-[#0b1221] border border-slate-800/60 rounded-[2.5rem] p-2 md:p-6 shadow-2xl overflow-hidden flex flex-col items-center justify-center h-full min-h-[500px] transition-all duration-500 ${isZoomed ? 'rounded-[1.5rem] md:rounded-[3rem]' : ''}`}>
          
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#0b1221] z-20">
               <div className="relative">
                  <Loader2 className="w-14 h-14 text-blue-500/20 animate-spin" />
                  <Book className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
               </div>
               <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Syncing Intelligence Assets</span>
                  <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600 animate-progress-indeterminate w-full origin-left"></div>
                  </div>
               </div>
            </div>
          )}

          {hasError ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 px-10 animate-in fade-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <ImageOff className="w-10 h-10 text-slate-600" />
               </div>
               <div className="space-y-3">
                  <h4 className="text-2xl font-black text-white tracking-tight">Infographic Asset Blocked</h4>
                  <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed">
                    The Modern Scout's Playbook asset could not be retrieved from the cloud relay. This often happens if the source image host is temporarily unavailable.
                  </p>
               </div>
               <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => { setHasError(false); setIsLoading(true); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-900/40"
                  >
                    Retry Protocol
                  </button>
                  <a 
                    href={rawUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-slate-700"
                  >
                    View Original <ExternalLink className="w-3 h-3" />
                  </a>
               </div>
            </div>
          ) : (
            <div className={`w-full h-full flex justify-center bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl relative ${isZoomed ? 'overflow-auto scrollbar-hide' : ''}`}>
               <img 
                 src={infographicUrl} 
                 alt="The Modern Scout's Playbook Infographic"
                 className={`transition-all duration-1000 ${isZoomed ? 'min-w-[1000px] h-auto object-contain' : 'w-full h-auto max-w-full object-contain'} ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                 onLoad={() => setIsLoading(false)}
                 onError={() => {
                   setHasError(true);
                   setIsLoading(false);
                 }}
               />
               
               {isZoomed && (
                 <button 
                   onClick={() => setIsZoomed(false)}
                   className="fixed top-8 right-8 md:top-14 md:right-14 p-4 bg-slate-950/80 hover:bg-slate-900 text-white rounded-full shadow-2xl border border-white/10 z-[110] backdrop-blur-md transition-all active:scale-90"
                 >
                   <Minimize2 className="w-8 h-8" />
                 </button>
               )}
            </div>
          )}

          {!isZoomed && (
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-800/50 pt-8 px-4 w-full">
              <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Architecture</span>
                    <span className="text-xs text-slate-400 font-bold">Centralized Data Aggregation</span>
                  </div>
                  <div className="h-8 w-px bg-slate-800"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Analysis Mode</span>
                    <span className="text-xs text-slate-400 font-bold">Dual-Speed AI Scanning</span>
                  </div>
                  <div className="h-8 w-px bg-slate-800"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Verification</span>
                    <span className="text-xs text-slate-400 font-bold">Grounded Market Intelligence</span>
                  </div>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">
                  <Info className="w-3.5 h-3.5" />
                  Ref 2026.04 • Authorized Staff Only
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center">
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Proprietary Scouting Intelligence Platform</p>
      </div>
    </div>
  );
};