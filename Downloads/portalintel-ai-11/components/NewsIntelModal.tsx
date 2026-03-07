
import React, { useState, useEffect } from 'react';
import { NewsItem, GroundingSource } from '../types';
import { X, Loader2, Newspaper, ExternalLink, Link as LinkIcon, BrainCircuit, Sparkles, ArrowRight, RefreshCw, Volume2, Mic2 } from 'lucide-react';
import { getNewsDeepDive } from '../services/gemini';
import { ScoutingAudioPlayer } from './ScoutingAudioPlayer';
import { IntelligenceReport } from './IntelligenceReport';

interface NewsIntelModalProps {
  newsItem: NewsItem | null;
  onClose: () => void;
  onVoiceDeepDive?: (context: string) => void;
}

export const NewsIntelModal: React.FC<NewsIntelModalProps> = ({ newsItem, onClose, onVoiceDeepDive }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{ text: string, sources: GroundingSource[] } | null>(null);
  const [activeAudio, setActiveAudio] = useState(false);

  useEffect(() => {
    if (newsItem) {
      handleFetchReport();
    }
  }, [newsItem]);

  const handleFetchReport = async () => {
    if (!newsItem) return;
    setLoading(true);
    try {
      const result = await getNewsDeepDive(newsItem);
      setReport(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!newsItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-slate-950 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[4rem] border border-slate-800 shadow-2xl flex flex-col relative" onClick={e => e.stopPropagation()}>
        
        <div className="p-10 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-950 z-10">
           <div className="flex items-center gap-6 overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 shadow-2xl flex-shrink-0">
                 <Newspaper className="w-8 h-8 text-blue-500" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">{newsItem.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">{newsItem.source} REPORT</span>
                   <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                   <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{newsItem.timestamp}</span>
                </div>
              </div>
           </div>
           <div className="flex items-center gap-3 ml-4">
             <button 
                onClick={() => { if (onVoiceDeepDive) onVoiceDeepDive(`News Report Analysis: ${newsItem.title}. Summary: ${newsItem.summary}. Deep Dive Intel: ${report?.text || ''}`); onClose(); }}
                className="hidden md:flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 group"
             >
                <Mic2 className="w-4 h-4 group-hover:animate-pulse" />
                Live Voice Audit
             </button>
             <button onClick={handleFetchReport} className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-blue-400 border border-slate-800 transition-all active:scale-90" title="Refresh Intel">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
             <button onClick={onClose} className="p-3 bg-slate-900 rounded-xl text-slate-500 hover:text-white border border-slate-800 transition-all active:scale-90"><X className="w-6 h-6" /></button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 md:p-14 scrollbar-hide grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-8 space-y-6">
                 <div className="flex items-center gap-3 mb-2"><Sparkles className="w-5 h-5 text-blue-400" /><h3 className="text-sm font-black text-white uppercase tracking-widest">News Context</h3></div>
                 <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-4">"{newsItem.summary}"</p>
                 <div className="pt-4">
                   <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-6 py-4 rounded-2xl border border-blue-500/20 transition-all font-black text-[10px] uppercase tracking-widest group">
                     View Original Source <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                   </a>
                 </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] p-8 flex flex-col items-center text-center gap-4">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20"><Volume2 className="w-6 h-6 text-emerald-400" /></div>
                 <h4 className="text-white font-bold text-sm">Audio Briefing</h4>
                 <button onClick={() => setActiveAudio(!activeAudio)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-xs transition-all">{activeAudio ? 'Close Player' : 'Initialize Audio'}</button>
                 {activeAudio && report && <div className="w-full pt-4"><ScoutingAudioPlayer text={report.text} label="News Intel Audio" /></div>}
              </div>
           </div>

           <div className="lg:col-span-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-[4rem] p-10 md:p-14 relative h-full flex flex-col shadow-2xl">
                 <div className="flex items-center gap-4 mb-10 pb-10 border-b border-slate-800/50">
                    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20"><BrainCircuit className="w-8 h-8 text-blue-400" /></div>
                    <div><h3 className="text-2xl font-black text-white tracking-tight uppercase">Expanded Scouting Report</h3><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI-Synthesized Market Intel</p></div>
                 </div>
                 <div className="flex-1">
                    {loading ? (
                      <div className="h-full flex flex-col items-center justify-center py-24 gap-6 text-slate-600">
                         <Loader2 className="w-12 h-12 animate-spin text-blue-500/30" />
                         <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Running Deep Portal Scan...</span>
                      </div>
                    ) : (
                      <IntelligenceReport text={report?.text || "Intelligence synthesis pending..."} />
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
