
import React, { useState, useEffect } from 'react';
import { Newspaper, Clock, ExternalLink, Loader2, Sparkles, Megaphone, RefreshCw, ShieldCheck, Zap, Shield, ArrowRight, Link as LinkIcon, AlertTriangle, BarChart3, TrendingUp, TrendingDown, Target, UserPlus, Fingerprint, Info, Globe, Activity } from 'lucide-react';
import { PortalScanner } from './PortalScanner';
import { getDailyPortalNews, getPortalMarketPulse } from '../services/gemini';
import { NewsItem } from '../types';
import { NewsIntelModal } from './NewsIntelModal';

// Declare custom Stripe element
const StripeBuyButton = 'stripe-buy-button' as any;

interface PortalDashboardProps {
  isPro?: boolean;
  onRequestPro?: () => boolean;
  onVoiceDeepDive?: (context: string) => void;
}

// 20 Minutes in Milliseconds
const CRON_SYNC_INTERVAL = 20 * 60 * 1000;

export const PortalDashboard: React.FC<PortalDashboardProps> = ({ isPro, onRequestPro, onVoiceDeepDive }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [pulse, setPulse] = useState<any>(null);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingPulse, setLoadingPulse] = useState(true);
  const [errorNews, setErrorNews] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [syncCountdown, setSyncCountdown] = useState(100);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchNews = async (force: boolean = false) => {
    setLoadingNews(true);
    setErrorNews(null);
    try {
      const items = await getDailyPortalNews(force);
      setNews(items);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error("News Relay Failure", err);
      setErrorNews("RELAY INTERRUPTION");
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchPulse = async (force: boolean = false) => {
    setLoadingPulse(true);
    try {
      const data = await getPortalMarketPulse(force);
      setPulse(data);
    } catch (err) {
      console.error("Pulse Error:", err);
    } finally {
      setLoadingPulse(false);
    }
  };

  // Automatic "Cron" Synchronization logic
  useEffect(() => {
    fetchNews();
    if (isPro) fetchPulse();

    // Set up the 20-minute interval
    const cronId = setInterval(() => {
      triggerCronSync();
    }, CRON_SYNC_INTERVAL);

    // Visual countdown update every second
    const startTime = Date.now();
    const countdownId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.max(0, 100 - (elapsed / CRON_SYNC_INTERVAL) * 100);
      setSyncCountdown(progress);
      
      // If cycle finishes, the main interval handles the sync, but we reset visuals here
      if (progress <= 0) {
        // Reset visually will happen on next interval tick
      }
    }, 1000);

    return () => {
      clearInterval(cronId);
      clearInterval(countdownId);
    };
  }, [isPro]);

  const triggerCronSync = async () => {
    setIsSyncing(true);
    console.log("PortalIntel: Background Cron Triggered (20min cycle)");
    await Promise.all([
       fetchNews(true),
       isPro ? fetchPulse(true) : Promise.resolve()
    ]);
    setIsSyncing(false);
  };

  const handleManualSync = () => {
    triggerCronSync();
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto relative">
      <NewsIntelModal newsItem={selectedNews} onClose={() => setSelectedNews(null)} onVoiceDeepDive={onVoiceDeepDive} />

      {/* Grounding Cron Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-slate-900 pointer-events-none overflow-hidden">
         <div 
           className={`h-full bg-blue-500 transition-all duration-1000 ${isSyncing ? 'animate-progress-indeterminate' : ''}`} 
           style={{ width: isSyncing ? '100%' : `${syncCountdown}%` }}
         ></div>
      </div>

      {/* High Fidelity Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12 text-center md:text-left px-4">
        <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-[#0d1526] border-2 border-blue-500/20 rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] relative group">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
          {!logoError ? (
            <img 
              src="logo.png" 
              alt="PortalIntel.ai Shield" 
              className="w-12 h-12 md:w-16 md:h-16 object-contain relative z-10" 
              onError={() => setLogoError(true)}
            />
          ) : (
            <Shield className="w-10 h-10 md:w-14 md:h-14 text-blue-500 relative z-10" />
          )}
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
             <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none italic">Intelligence Hub</h1>
             <div className="flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full mb-1">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`}></div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  {isSyncing ? 'Neural Syncing...' : 'Grounded Cycle Active'}
                </span>
             </div>
          </div>
          <p className="text-slate-500 text-base md:text-2xl font-black uppercase tracking-widest opacity-60">Neural Grounding v4.2 • 20m Cron Active</p>
        </div>
      </div>

      {/* Market Pulse Section - INDIGO COLORING */}
      {isPro && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
           <div className="lg:col-span-8 bg-[#0b1224] border border-blue-500/30 rounded-[3rem] p-6 md:p-12 shadow-2xl relative overflow-hidden group">
              {/* Background Accent */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/15 transition-all duration-1000"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 relative z-10 gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-14 md:w-16 h-14 md:h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                       <Fingerprint className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                       <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight italic">Intelligence Matrix</h2>
                       <p className="text-[8px] md:text-[10px] font-black text-blue-500/60 uppercase tracking-[0.4em] mt-1">Next Auto-Cron: {Math.ceil(syncCountdown * (CRON_SYNC_INTERVAL/100/1000/60))} min</p>
                    </div>
                 </div>
                 <button onClick={handleManualSync} className="p-4 bg-slate-900 rounded-2xl text-blue-400 hover:text-white border border-slate-800 transition-all active:scale-90 shadow-xl self-start sm:self-center">
                    <RefreshCw className={`w-5 md:w-6 h-5 md:h-6 ${loadingPulse || isSyncing ? 'animate-spin' : ''}`} />
                 </button>
              </div>

              {loadingPulse ? (
                <div className="py-24 md:py-32 flex flex-col items-center justify-center gap-8">
                   <div className="relative">
                      <Loader2 className="w-16 h-16 animate-spin text-blue-500/20" />
                      <BarChart3 className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                   </div>
                   <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Syncing Neural Nodes...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                   <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                         <Target className="w-5 h-5 text-red-500" />
                         <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Scarcity Criticality</h3>
                      </div>
                      <div className="space-y-4">
                         {pulse?.scarcityReport?.length > 0 ? pulse.scarcityReport.map((s: any, idx: number) => (
                           <div key={idx} className="flex items-center justify-between bg-slate-900/60 p-4 md:p-5 rounded-2xl border border-slate-800 group/item hover:border-blue-500/30 transition-all">
                              <span className="font-black text-white text-base md:text-lg">{s.position}</span>
                              <div className="text-right">
                                 <div className={`text-[9px] md:text-[10px] font-black uppercase px-2.5 py-1 rounded-full mb-1 inline-block ${s.scarcityLevel === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                   {s.scarcityLevel} VOL
                                 </div>
                                 <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-tight">{s.summary}</p>
                              </div>
                           </div>
                         )) : (
                            <div className="text-center py-10 opacity-20"><Info className="mx-auto mb-2" /> Awaiting Grounding</div>
                         )}
                      </div>
                   </div>
                   
                   <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                         <TrendingUp className="w-5 h-5 text-blue-400" />
                         <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Migration Velocity</h3>
                      </div>
                      <div className="space-y-4">
                         {pulse?.marketVelocity?.length > 0 ? pulse.marketVelocity.map((v: any, idx: number) => (
                           <div key={idx} className="flex items-center justify-between bg-slate-950/40 p-4 md:p-5 rounded-2xl border border-slate-800 hover:bg-slate-900 transition-colors">
                              <span className="font-black text-slate-300 uppercase tracking-tighter text-sm md:text-base">{v.school}</span>
                              <div className="flex items-center gap-4">
                                 <div className={`flex items-center gap-1.5 font-black ${v.trend === 'Bleeding' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {v.trend === 'Bleeding' ? <TrendingDown className="w-3 md:w-4 h-3 md:h-4" /> : <TrendingUp className="w-3 md:w-4 h-3 md:h-4" />}
                                    <span className="text-lg md:text-xl">{v.count}</span>
                                 </div>
                                 <span className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest">{v.trend}</span>
                              </div>
                           </div>
                         )) : (
                            <div className="text-center py-10 opacity-20"><RefreshCw className="mx-auto mb-2" /> No Data Found</div>
                         )}
                      </div>
                   </div>
                </div>
              )}
           </div>

           <div className="lg:col-span-4 space-y-8">
              <div className="bg-[#0d1526] border border-emerald-500/30 rounded-[3rem] p-8 md:p-10 shadow-2xl space-y-8 md:space-y-10 flex flex-col h-full relative overflow-hidden group">
                 <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-600/10 transition-all duration-1000"></div>
                 
                 <div className="flex items-center gap-5 relative z-10">
                    <div className="w-12 md:w-14 h-12 md:h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg">
                       <Globe className="w-7 md:w-8 h-7 md:h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic">Global Flow</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4 md:gap-6 flex-1 relative z-10">
                    <div className="bg-[#080d1a] p-6 md:p-8 rounded-[2rem] border border-slate-800 text-center shadow-inner group/stat">
                       <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2 group-hover/stat:text-blue-400 transition-colors">Neural Sync Total</span>
                       <span className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">{pulse?.totalEstimatedEntries || '0'}</span>
                    </div>
                    <div className="bg-[#080d1a] p-6 md:p-8 rounded-[2rem] border border-slate-800 text-center shadow-inner group/stat">
                       <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2 group-hover/stat:text-emerald-400 transition-colors">Elite Assets (4-5★)</span>
                       <span className="text-4xl md:text-5xl font-black text-emerald-500 italic tracking-tighter">{pulse?.eliteAssetsAvailable || '0'}</span>
                    </div>
                 </div>

                 <div className="p-4 md:p-5 bg-slate-950/80 border border-slate-800 rounded-3xl relative z-10">
                    <div className="flex items-center justify-center gap-3 text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">
                       <ShieldCheck className="w-3.5 md:w-4 h-3.5 md:w-4 text-blue-500/50" />
                       Synced: {lastRefreshed || 'INITIALIZING'}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Priority Intel Section - ROSE COLORING */}
      <div className="space-y-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[#0b1224] p-5 md:p-6 rounded-[2rem] border border-rose-500/20 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-rose-600"></div>
           <div className="flex items-center gap-4 md:gap-6">
             <div className="w-12 md:w-14 h-12 md:h-14 bg-rose-600/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <Megaphone className="w-6 md:w-7 h-6 md:h-7 text-rose-500" />
             </div>
             <div>
                <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-[0.3em]">Priority News Stream</h2>
                <div className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                   Grounding Status: <span className="text-rose-400 font-bold">NOMINAL</span>
                   <Activity className="w-3 h-3 text-rose-400 animate-pulse" />
                </div>
             </div>
           </div>
           
           <div className="flex items-center gap-2 md:gap-3">
             <button onClick={() => fetchNews(true)} className="p-3 md:p-4 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white rounded-2xl border border-slate-800 transition-all active:scale-95 shadow-xl">
                <RefreshCw className={`w-4 md:w-5 h-4 md:h-5 ${loadingNews ? 'animate-spin' : ''}`} />
             </button>
             <button onClick={() => fetchNews(true)} className="hidden md:flex items-center gap-3 px-8 py-4 bg-rose-600/10 border border-rose-500/30 rounded-full hover:bg-rose-600 hover:text-white transition-all text-rose-400 font-black text-[11px] uppercase tracking-widest shadow-2xl group">
                <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                Trigger Grounding Sync
             </button>
           </div>
        </div>

        {loadingNews ? (
          <div className="bg-slate-900/40 border border-slate-800 p-16 md:p-20 rounded-[3rem] flex flex-col items-center justify-center gap-8 shadow-xl text-center">
             <div className="relative">
                <Loader2 className="w-14 md:w-16 h-14 md:h-16 text-rose-500/20 animate-spin" />
                <Newspaper className="w-6 md:w-7 h-6 md:h-7 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
             </div>
             <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Aggregating National Data Feed...</p>
          </div>
        ) : errorNews ? (
          <div className="bg-rose-500/5 border border-rose-500/20 p-16 md:p-20 rounded-[3rem] flex flex-col items-center justify-center gap-6 shadow-xl text-center">
             <AlertTriangle className="w-12 md:w-16 h-12 md:w-16 text-rose-500/50" />
             <p className="text-base md:text-lg font-black text-rose-400 uppercase tracking-[0.3em] italic">Relay Interruption</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {news.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedNews(item)}
                className="group bg-[#0d1526] border border-slate-800 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] hover:border-rose-500/40 transition-all cursor-pointer flex flex-col h-full shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-8 md:top-10 left-8 md:top-10">
                   <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${item.urgency === 'High' ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]' : 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]'} animate-pulse`}></div>
                </div>

                <div className="flex justify-between items-start mb-6 md:mb-8 pl-6 md:pl-8">
                   <div className="flex flex-col">
                      <span className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-[0.3em]">{item.source}</span>
                      <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">Grounding Verified</span>
                   </div>
                   <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-slate-900 rounded-xl md:rounded-2xl border border-slate-800 shadow-inner">
                      <Clock className="w-3 md:w-3.5 h-3 md:h-3.5 text-slate-600" />
                      <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.timestamp}</span>
                   </div>
                </div>

                <h3 className="text-xl md:text-3xl font-black text-white mb-4 md:mb-6 group-hover:text-rose-400 transition-colors leading-tight tracking-tighter">
                  {item.title}
                </h3>
                
                <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-6 md:mb-8 italic font-medium border-l-2 border-slate-800 pl-4 md:pl-6 line-clamp-4">
                  "{item.summary}"
                </p>

                <div className="mt-auto flex items-center gap-3 md:gap-4">
                   <div className={`flex-1 px-4 md:px-5 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center border ${item.urgency === 'High' ? 'bg-rose-900/10 border-rose-500/20 text-rose-400' : 'bg-blue-900/10 border-blue-500/20 text-blue-400'}`}>
                      {item.urgency} URGENCY
                   </div>
                   <div className="p-3 md:p-3.5 bg-slate-800 group-hover:bg-rose-600 group-hover:text-white text-slate-500 rounded-xl md:rounded-2xl transition-all shadow-xl">
                      <ArrowRight className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-800/50 pt-16 pb-24 px-4">
         <div className="w-full">
            <PortalScanner isPro={isPro} onRequestPro={onRequestPro} onVoiceDeepDive={onVoiceDeepDive} />
         </div>

         {!isPro && (
           <div className="mt-24 w-full max-w-5xl mx-auto bg-gradient-to-br from-[#0b1224] to-[#0d1526] border border-amber-500/30 rounded-[3rem] md:rounded-[4rem] p-10 md:p-20 flex flex-col items-center text-center relative overflow-hidden group shadow-[0_0_100px_rgba(245,158,11,0.05)]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="relative z-10 space-y-10 flex flex-col items-center w-full">
                <div className="w-20 md:w-24 h-20 md:h-24 bg-amber-500/10 border-2 border-amber-500/20 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-700">
                   <ShieldCheck className="w-10 md:w-12 h-10 md:h-12 text-amber-500" />
                </div>
                <div className="space-y-4">
                   <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Upgrade to Pro</h2>
                   <p className="text-base md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">Unlock the full Market Intelligence Matrix and deep grounded scanning.</p>
                </div>
                <div className="pt-8 w-full flex justify-center scale-110 md:scale-125">
                   <StripeBuyButton buy-button-id="buy_btn_1SmolPKD7eSzR5VQ3bqICXkd" publishable-key="pk_live_YCSycCj8SZWCtRXP5C9HQLH6"></StripeBuyButton>
                </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
