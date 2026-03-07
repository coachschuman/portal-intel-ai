
import React, { useState, useEffect } from 'react';
import { getNFLDraftIntelligence, scanNFLDraft, getFullNFLDraftBoard, getNFLDraftComparison, getPlayerDeepDive } from '../services/gemini';
import { NFLDraftProspect, GroundingSource } from '../types';
import { 
  Trophy, Search, Loader2, Cpu, Globe, RefreshCw, ChevronDown, 
  BarChart3, Target, Zap, ShieldCheck, ExternalLink, Info, 
  ArrowRight, ShieldAlert, Layers, Activity, TrendingUp, Mic2, Star, Shield as ShieldIcon, 
  Terminal, Sparkles, Filter, X, Send, ListOrdered, Video, Volume2, PlayCircle, ExternalLink as LinkIcon,
  MonitorPlay, LayoutPanelTop, Play, Maximize2, GraduationCap, MapPin, ChevronRight, User, FileText, ChevronLeft,
  BrainCircuit, ArrowLeftRight, CheckCircle2, Shield as LockIcon, Brain
} from 'lucide-react';
import { IntelligenceReport } from './IntelligenceReport';
import { ScoutingAudioPlayer } from './ScoutingAudioPlayer';

const CLASSES = ['2025', '2026', '2027'];
const POSITIONS = ['FULL BOARD (1-257)', 'QB', 'RB', 'WR', 'OT', 'IOL', 'EDGE', 'DL', 'LB', 'CB', 'S'];

export const NFLDraftIntel: React.FC<{ isPro: boolean; onRequestPro: () => void }> = ({ isPro, onRequestPro }) => {
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState<NFLDraftProspect[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [pos, setPos] = useState('FULL BOARD (1-257)');
  const [year, setYear] = useState('2026');
  const [selectedProspect, setSelectedProspect] = useState<NFLDraftProspect | null>(null);
  const [prospectAnalysis, setProspectAnalysis] = useState<{text: string, sources: GroundingSource[]} | null>(null);
  const [loadingProspectAnalysis, setLoadingProspectAnalysis] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  
  // Selection and Comparison State
  const [selectedForCompare, setSelectedForCompare] = useState<NFLDraftProspect[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonInsight, setComparisonInsight] = useState<string | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [programNeeds, setProgramNeeds] = useState('');

  // Scanner State
  const [mode, setMode] = useState<'BigBoard' | 'Scanner'>('BigBoard');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const fetchBigBoard = async () => {
    if (!isPro) {
      onRequestPro();
      return;
    }
    setLoading(true);
    setProspects([]);
    setSelectedProspect(null);
    setSelectedForCompare([]);
    setHasSearched(false);
    try {
      let data;
      if (pos === 'FULL BOARD (1-257)') {
        data = await getFullNFLDraftBoard(year);
      } else {
        data = await getNFLDraftIntelligence(pos, year);
      }
      setProspects(data.prospects);
      setSources(data.sources);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (!isPro) { onRequestPro(); return; }

    setLoading(true);
    setProspects([]);
    setSelectedProspect(null);
    setSelectedForCompare([]);
    setHasSearched(true);
    try {
      const data = await scanNFLDraft(searchQuery);
      setProspects(data.prospects);
      setSources(data.sources);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompareSelection = (prospect: NFLDraftProspect, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForCompare(prev => {
      const isAlreadySelected = prev.some(p => p.id === prospect.id);
      if (isAlreadySelected) return prev.filter(p => p.id !== prospect.id);
      return [...prev, prospect].slice(0, 4); // Max 4 for comparison
    });
  };

  const executeComparison = async () => {
    if (selectedForCompare.length < 2) return;
    setLoadingComparison(true);
    setShowComparison(true);
    try {
      const result = await getNFLDraftComparison(selectedForCompare, programNeeds);
      setComparisonInsight(result.text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComparison(false);
    }
  };

  useEffect(() => {
    if (isPro && mode === 'BigBoard') fetchBigBoard();
  }, [pos, year, mode]);

  const renderComparisonModal = () => {
    if (!showComparison) return null;

    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-10 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-500 overflow-y-auto scrollbar-hide">
        <div className="bg-[#080d1a] w-full max-w-7xl min-h-[90vh] rounded-[4rem] border border-slate-800 shadow-2xl flex flex-col relative my-auto">
          {/* Modal Header */}
          <div className="p-8 md:p-12 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-[#080d1a]/95 backdrop-blur-xl z-30">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/10 flex items-center justify-center border border-purple-500/20 shadow-inner">
                <ArrowLeftRight className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Draft Prospect Comparison</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Multi-Asset Strategic Benchmarking</p>
              </div>
            </div>
            <button onClick={() => { setShowComparison(false); setComparisonInsight(null); }} className="p-4 bg-slate-900 rounded-2xl text-slate-500 hover:text-white border border-slate-800 transition-all active:scale-90">
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="flex-1 p-8 md:p-14 space-y-12">
            {/* Stat Benchmarking Table */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800">
                      <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Metric</th>
                      {selectedForCompare.map(p => (
                        <th key={p.id} className="px-10 py-6 text-center">
                          <p className="font-black text-white text-lg uppercase tracking-tight truncate max-w-[150px] mx-auto">{p.name}</p>
                          <span className="text-[9px] font-black text-purple-500 uppercase">{p.position} • {p.school}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    <tr className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consensus Rank</td>
                      {selectedForCompare.map(p => (
                        <td key={p.id} className="px-10 py-5 text-center font-black text-white text-xl">#{p.consensusRank}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">PFF Grade</td>
                      {selectedForCompare.map(p => (
                        <td key={p.id} className="px-10 py-5 text-center font-black text-purple-400 text-xl italic">{p.pffGrade || 'N/A'}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proj Round</td>
                      {selectedForCompare.map(p => (
                        <td key={p.id} className="px-10 py-5 text-center font-black text-emerald-400 uppercase text-sm">{p.projectedRound}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Comparison Logic */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-6 shadow-xl">
                  <div className="flex items-center gap-4">
                    <Target className="w-6 h-6 text-amber-500" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Staff Requirements</h3>
                  </div>
                  <textarea 
                    value={programNeeds}
                    onChange={(e) => setProgramNeeds(e.target.value)}
                    placeholder="Define specific scheme needs or role gaps for tailored comparison..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-white placeholder-slate-800 focus:outline-none focus:border-purple-500/50 transition-all min-h-[150px] font-medium"
                  />
                  <button 
                    onClick={executeComparison}
                    disabled={loadingComparison}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    {loadingComparison ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                    {loadingComparison ? 'Synthesizing...' : 'Refresh AI Logic'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="bg-[#0b1224] border border-slate-800 rounded-[4rem] p-10 md:p-14 shadow-2xl relative min-h-[500px] flex flex-col">
                  <div className="flex items-center gap-5 mb-10 pb-10 border-b border-slate-800/50">
                    <div className="w-16 h-16 bg-purple-600/10 rounded-[1.75rem] flex items-center justify-center border border-purple-500/20 shadow-inner">
                      <BrainCircuit className="w-10 h-10 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Strategic Synthesis</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Neural Comparative Audit Active</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    {loadingComparison ? (
                      <div className="h-full flex flex-col items-center justify-center py-24 gap-8">
                        <div className="relative">
                          <Loader2 className="w-20 h-20 animate-spin text-purple-500/20" />
                          <Activity className="w-10 h-10 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.5em] text-purple-400 animate-pulse text-center">Parsing play styles and scheme parallels...</p>
                      </div>
                    ) : comparisonInsight ? (
                      <IntelligenceReport text={comparisonInsight} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-24 gap-6 opacity-30">
                        <BrainCircuit className="w-20 h-20 text-slate-700" />
                        <p className="text-lg font-black uppercase tracking-[0.3em] text-center max-w-sm">Awaiting Intelligence Initialization</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleProspectDeepDive = async () => {
    if (!selectedProspect) return;
    setLoadingProspectAnalysis(true);
    try {
      // Convert NFLDraftProspect to Player-like object for the service
      const playerObj: any = {
        name: selectedProspect.name,
        position: selectedProspect.position,
        school: selectedProspect.school,
        stars: 5, // Default for draft prospects
        nilValue: 'N/A'
      };
      const result = await getPlayerDeepDive(playerObj);
      setProspectAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProspectAnalysis(false);
    }
  };

  const renderProspectModal = () => {
    if (!selectedProspect) return null;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-500 overflow-y-auto scrollbar-hide">
        <div className="bg-[#080d1a] w-full max-w-7xl min-h-[90vh] rounded-[4rem] border border-slate-800 shadow-[0_0_150px_rgba(168,85,247,0.15)] flex flex-col relative my-auto">
          {/* Header Bar */}
          <div className="p-8 md:p-14 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-[#080d1a]/95 backdrop-blur-xl z-30">
            <div className="flex items-center gap-8 overflow-hidden">
               <div className="w-20 h-20 md:w-28 md:h-28 bg-purple-600/10 rounded-[2.5rem] flex items-center justify-center border border-purple-500/20 shadow-2xl flex-shrink-0 animate-in zoom-in duration-700">
                  <User className="w-10 h-10 md:w-16 md:h-16 text-purple-400" />
               </div>
               <div className="overflow-hidden">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] md:text-xs font-black text-purple-500 uppercase tracking-[0.5em] italic">Authorized Deep Breakout</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></div>
                  </div>
                  <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none italic truncate">{selectedProspect.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 md:gap-8 mt-4">
                     <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-500" />
                        <span className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest">{selectedProspect.school}</span>
                     </div>
                     <div className="h-1 w-1 rounded-full bg-slate-700 hidden md:block"></div>
                     <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        <span className="text-xs md:text-sm font-black text-white uppercase tracking-[0.2em]">{selectedProspect.position} COMMAND UNIT</span>
                     </div>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => { setSelectedProspect(null); setProspectAnalysis(null); }} 
                 className="p-6 bg-slate-900 rounded-[2rem] text-slate-500 hover:text-white border border-slate-800 transition-all hover:scale-105 active:scale-90 group shadow-2xl"
               >
                  <X className="w-10 h-10 group-hover:rotate-90 transition-transform duration-300" />
               </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 p-8 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
             {/* Left Column: Vitals & Audio */}
             <div className="lg:col-span-4 space-y-12">
                {/* Draft Grade Block */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[3.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all"></div>
                   <div className="space-y-1">
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] block">War Room Projection</span>
                      <div className="text-6xl font-black text-white italic tracking-tighter drop-shadow-2xl">ELITE</div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 text-center">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">PFF Grade</span>
                         <span className="text-3xl font-black text-purple-400 italic leading-none">{selectedProspect.pffGrade || '88.5'}</span>
                      </div>
                      <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 text-center">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Proj Round</span>
                         <span className="text-xl font-black text-emerald-400 uppercase leading-none">{selectedProspect.projectedRound}</span>
                      </div>
                   </div>
                </div>

                {/* Audio Briefing Block */}
                <div className="bg-purple-600/5 border border-purple-500/20 rounded-[3.5rem] p-10 space-y-8 shadow-xl relative overflow-hidden">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-lg">
                         <Volume2 className="w-8 h-8 text-purple-400" />
                      </div>
                      <div>
                         <h4 className="text-xl font-black text-white uppercase tracking-tight italic">Intelligence Audio</h4>
                         <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Authorized Staff Only</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setShowAudio(!showAudio)}
                     className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${
                       showAudio ? 'bg-purple-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-700'
                     }`}
                   >
                     <Mic2 className="w-5 h-5" />
                     {showAudio ? 'Close Neural Link' : 'Initialize Audio Relay'}
                   </button>
                   {showAudio && (
                      <div className="pt-2 animate-in slide-in-from-top-4 duration-300">
                         <ScoutingAudioPlayer 
                           text={`Deep Intelligence Breakout for ${selectedProspect.name}. A top rated ${selectedProspect.position} from ${selectedProspect.school}. Consenus Ranking #${selectedProspect.consensusRank}. Analysis summary: ${selectedProspect.summary}`} 
                           label="Asset Intel Briefing" 
                           onClose={() => setShowAudio(false)} 
                         />
                      </div>
                   )}
                </div>

                {/* Film Room Block */}
                <div className="space-y-6">
                   <div className="flex items-center gap-4 border-b border-slate-800 pb-4 ml-4">
                      <MonitorPlay className="w-6 h-6 text-purple-500" />
                      <h4 className="text-xl font-black text-white uppercase tracking-tight italic">Film Study Room</h4>
                   </div>
                   <div className="grid grid-cols-1 gap-4">
                      {selectedProspect.videoLinks && selectedProspect.videoLinks.length > 0 ? (
                         selectedProspect.videoLinks.map((video, idx) => (
                            <a 
                               key={idx} 
                               href={video.url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="flex items-center justify-between bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] group/video hover:bg-slate-800/60 hover:border-purple-500/40 transition-all shadow-xl"
                            >
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 group-hover/video:border-purple-500/50 transition-colors">
                                     <PlayCircle className="w-7 h-7 text-purple-500 group-hover/video:scale-110 transition-transform" />
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">VERIFIED FILM</span>
                                     <span className="text-sm font-black text-slate-200 uppercase tracking-tight">{video.title}</span>
                                  </div>
                               </div>
                               <ExternalLink className="w-4 h-4 text-slate-700 group-hover/video:text-white transition-colors" />
                            </a>
                         ))
                      ) : (
                         <div className="p-10 text-center bg-slate-950/40 border-2 border-dashed border-slate-800 rounded-[3rem] opacity-50">
                            <Video className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">Intelligence ciphers indicate no verified study film for this node in the current cycle.</p>
                         </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Right Column: Analysis & Reports */}
             <div className="lg:col-span-8 space-y-12">
                {/* Pro Model Comparison */}
                <div className="bg-slate-900/20 border border-slate-800 rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative">
                   <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-40 h-40 text-amber-500" /></div>
                   <div className="flex items-center gap-4 mb-8">
                      <Zap className="w-8 h-8 text-amber-500 fill-current" />
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">NFL Pro-Model Parallel</h4>
                   </div>
                   <p className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">{selectedProspect.nflComparison || 'TBD'}</p>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4">Synthesized via neural traits and production benchmarks</p>
                </div>

                {/* Scouting Hub */}
                <div className="bg-[#0b1224] border border-slate-800 rounded-[4rem] p-10 md:p-16 shadow-2xl relative">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-12 border-b border-slate-800/50">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-[1.75rem] flex items-center justify-center border border-blue-500/20 shadow-inner">
                           <BrainCircuit className="w-10 h-10 text-blue-400" />
                        </div>
                        <div>
                           <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight italic leading-none">Scouting Consensus Audit</h3>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">Grounded Synthesis: Kiper, PFF, MockDB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={handleProspectDeepDive} 
                           disabled={loadingProspectAnalysis}
                           className="flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50"
                         >
                            {loadingProspectAnalysis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Execute Deep Audit
                         </button>
                         <div className="px-6 py-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Rank</span>
                            <span className="text-xl font-black text-white">#{selectedProspect.consensusRank}</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-12">
                      {prospectAnalysis ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                           <div className="flex items-center gap-3">
                              <Brain className="w-5 h-5 text-purple-400" />
                              <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Enhanced AI Deep Dive</span>
                           </div>
                           <div className="bg-slate-950/50 p-10 rounded-[3rem] border border-purple-500/20 shadow-inner">
                              <IntelligenceReport text={prospectAnalysis.text} />
                           </div>
                        </div>
                      ) : loadingProspectAnalysis ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6">
                           <Loader2 className="w-12 h-12 animate-spin text-purple-500/30" />
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Synthesizing Deep Intelligence...</p>
                        </div>
                      ) : null}

                      <div className="space-y-6">
                         <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">National Consensus Take</span>
                         </div>
                         <div className="text-lg text-slate-400 leading-relaxed font-medium bg-slate-950/50 p-10 rounded-[3rem] border border-slate-800 shadow-inner italic">
                           "{selectedProspect.kiperTake}"
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="flex items-center gap-3">
                            <Star className="w-5 h-5 text-blue-400" />
                            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Deep Technical Summary</span>
                         </div>
                         <div className="p-2">
                           <IntelligenceReport text={selectedProspect.summary} />
                         </div>
                      </div>
                   </div>

                   {/* Sources Breakdown */}
                   {selectedProspect.sources && selectedProspect.sources.length > 0 && (
                      <div className="mt-16 pt-12 border-t border-slate-800">
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-6">Breakout Grounding Evidence Vault</span>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedProspect.sources.map((s, i) => (
                               <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-slate-950 border border-slate-800 p-5 rounded-2xl group/src hover:border-purple-500/30 transition-all flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                     <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover/src:border-purple-500/50">
                                        <Globe className="w-4 h-4 text-slate-500 group-hover/src:text-purple-400" />
                                     </div>
                                     <span className="text-[10px] font-black uppercase text-slate-400 group-hover/src:text-white truncate max-w-[180px]">{s.title}</span>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-slate-800 group-hover/src:text-purple-500 group-hover/src:translate-x-1 transition-all" />
                               </a>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>

          <div className="p-10 border-t border-slate-800 bg-slate-950/40 rounded-b-[4rem] text-center">
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">Proprietary Breakout Intelligence v4.2 • Authorized Access Protocol Active</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
      {selectedProspect && renderProspectModal()}
      {showComparison && renderComparisonModal()}

      {/* Header Panel */}
      <div className="bg-[#0b1224] border border-slate-800 p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-center md:text-left">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-purple-600/10 rounded-3xl flex items-center justify-center border border-purple-500/20 shadow-2xl">
                     <Trophy className="w-10 h-10 text-purple-400" />
                  </div>
                  <div>
                     <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none italic">NFL War Room</h2>
                     <div className="flex items-center gap-3 mt-2">
                        <Activity className="w-4 h-4 text-purple-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Consensus Aggregator v2.1</span>
                     </div>
                  </div>
               </div>
               <p className="text-slate-400 max-w-2xl font-medium leading-relaxed text-lg">
                  Grounding intelligence from <span className="text-white">PFF, ESPN (Kiper/McShay), WalterFootball, CBS, and NFL Mock Draft Database.</span>
               </p>
               
               {/* Mode Switcher */}
               <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-2xl w-fit">
                  <button 
                    onClick={() => setMode('BigBoard')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'BigBoard' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Consensus Board
                  </button>
                  <button 
                    onClick={() => setMode('Scanner')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'Scanner' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    NFL Scanner
                  </button>
               </div>
            </div>

            {mode === 'BigBoard' ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-3">DRAFT CLASS</label>
                  <div className="relative group">
                    <select value={year} onChange={e => setYear(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none outline-none focus:border-purple-500/50 min-w-[140px]">
                      {CLASSES.map(c => <option key={c} value={c}>Class of {c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-3">POSITION UNIT</label>
                  <div className="relative group">
                    <select value={pos} onChange={e => setPos(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none outline-none focus:border-purple-500/50 min-w-[180px]">
                      {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  </div>
                </div>
                <button onClick={fetchBigBoard} disabled={loading} className="p-4 bg-slate-900 mt-5 border border-slate-800 rounded-2xl text-purple-400 hover:text-white transition-all shadow-xl active:scale-90 h-[58px]">
                  <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="w-full max-w-md">
                 <form onSubmit={handleScannerSubmit} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative flex bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/30 transition-all">
                       <input 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         placeholder="Day 2 Slot Receivers..."
                         className="flex-1 bg-transparent px-6 py-4 text-white font-bold placeholder:text-slate-700 focus:outline-none"
                       />
                       <button 
                         type="submit"
                         disabled={loading || !searchQuery.trim()}
                         className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 font-black transition-all active:scale-95 disabled:opacity-50"
                       >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                       </button>
                    </div>
                 </form>
                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-2 ml-2">Grounding Search: ACTIVE (PFF, ESPN, WALTER)</p>
              </div>
            )}
         </div>
      </div>

      {!isPro ? (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-8 border-2 border-dashed border-slate-800 rounded-[3rem]">
           <ShieldAlert className="w-16 h-16 text-slate-700" />
           <div className="space-y-3">
              <h3 className="text-2xl font-black text-white uppercase">Draft War Room Restricted</h3>
              <p className="text-slate-500 font-medium max-w-sm">Consensus Big Board aggregation requires Pro Access.</p>
           </div>
           <button onClick={onRequestPro} className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">Initialize Access</button>
        </div>
      ) : loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-8 animate-pulse text-center">
           <div className="relative">
              <Loader2 className="w-24 h-24 text-purple-600/20 animate-spin" />
              <Cpu className="w-10 h-10 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
           </div>
           <div className="space-y-4">
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Syncing National Draft Nodes...</h4>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Crawling PFF, ESPN, WalterFootball & MockDraftDB</p>
           </div>
        </div>
      ) : (
        <div className="w-full">
           {/* Primary Intelligence Grid */}
           <div className="bg-[#0b1224] border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl w-full">
              <div className="p-8 md:p-12 border-b border-slate-800 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-purple-600/10 rounded-[1.75rem] flex items-center justify-center border border-purple-500/20 shadow-inner">
                       {pos === 'FULL BOARD (1-257)' ? <ListOrdered className="w-8 h-8 text-purple-400" /> : <BarChart3 className="w-8 h-8 text-purple-400" />}
                    </div>
                    <div>
                       <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight italic">
                         {pos === 'FULL BOARD (1-257)' ? 'OVERALL CONSENSUS PREDICTION (1-257)' : mode === 'BigBoard' ? 'CONSENSUS BIG BOARD' : 'INTELLIGENCE SCANNER RESULTS'}
                       </h3>
                       <div className="flex items-center gap-3 mt-2">
                          <Globe className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grounded Search Integrity: 100%</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex flex-wrap gap-3">
                    <div className="bg-slate-950 border border-slate-800 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[120px]">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Assets Sync</span>
                       <span className="text-xl font-black text-white">{prospects.length}</span>
                    </div>
                    {selectedForCompare.length > 0 && (
                      <div className="bg-purple-600 border border-purple-500 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[120px] shadow-lg animate-in zoom-in duration-300">
                        <span className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-1">Tagged for Compare</span>
                        <span className="text-xl font-black text-white">{selectedForCompare.length}</span>
                      </div>
                    )}
                 </div>
              </div>
              
              <div className="overflow-x-auto scrollbar-hide">
                 <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                       <tr className="bg-slate-900/60 border-b border-slate-800">
                          <th className="px-10 py-7 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] w-32 text-center">Tag</th>
                          <th className="px-10 py-7 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] w-32">Rank</th>
                          <th className="px-10 py-7 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Prospect Intel</th>
                          <th className="px-10 py-7 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Program/School</th>
                          <th className="px-10 py-7 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Proj. Deployment</th>
                          <th className="px-10 py-7 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Breakout</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                       {prospects.map((p, idx) => {
                          const isSelected = selectedForCompare.some(item => item.id === p.id);
                          return (
                            <tr 
                              key={p.id} 
                              onClick={() => setSelectedProspect(p)}
                              className={`group cursor-pointer transition-all hover:bg-purple-600/[0.04] ${selectedProspect?.id === p.id ? 'bg-purple-600/10' : ''} ${isSelected ? 'bg-purple-600/5' : ''}`}
                            >
                               <td className="px-10 py-8 text-center">
                                  <button 
                                    onClick={(e) => toggleCompareSelection(p, e)}
                                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-110' : 'border-slate-800 hover:border-purple-500/50'}`}
                                  >
                                     {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                  </button>
                               </td>
                               <td className="px-10 py-8">
                                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-white text-xl shadow-2xl group-hover:border-purple-500/50 transition-colors">
                                     {p.consensusRank || idx + 1}
                                  </div>
                               </td>
                               <td className="px-10 py-8">
                                  <div className="space-y-1.5">
                                     <p className="font-black text-white text-2xl uppercase tracking-tighter group-hover:text-purple-400 transition-colors">{p.name}</p>
                                     <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-purple-500 uppercase bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">{p.position}</span>
                                        {p.videoLinks && p.videoLinks.length > 0 && (
                                           <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                              <Video className="w-3 h-3 text-emerald-400 animate-pulse" />
                                              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">FILM INCLUDED</span>
                                           </div>
                                        )}
                                     </div>
                                  </div>
                               </td>
                               <td className="px-10 py-8">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                        <GraduationCap className="w-5 h-5 text-slate-600" />
                                     </div>
                                     <span className="text-sm md:text-lg font-black text-slate-300 uppercase italic tracking-tight">{p.school}</span>
                                  </div>
                               </td>
                               <td className="px-10 py-8">
                                  <span className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-emerald-400 uppercase tracking-[0.2em] shadow-lg">
                                     {p.projectedRound}
                                  </span>
                               </td>
                               <td className="px-10 py-8 text-right">
                                  <div className="flex items-center justify-end gap-5">
                                     <button className="p-4 bg-slate-800 rounded-2xl text-slate-500 group-hover:text-white group-hover:bg-purple-600 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center">
                                        <ChevronRight className="w-6 h-6" />
                                     </button>
                                  </div>
                               </td>
                            </tr>
                          );
                       })}
                    </tbody>
                 </table>
                 {prospects.length === 0 && !loading && (hasSearched || mode === 'BigBoard') && (
                    <div className="py-32 flex flex-col items-center justify-center text-center gap-8 opacity-20">
                       <ShieldIcon className="w-16 h-16 text-slate-700" />
                       <p className="text-xl font-black text-slate-600 uppercase tracking-[0.4em]">No matching intelligence nodes found.</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Floating Comparison Bar */}
           {selectedForCompare.length > 0 && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-6 animate-in slide-in-from-bottom-10 duration-500">
                 <div className="bg-[#0f172a]/90 border-2 border-purple-500 shadow-[0_0_60px_rgba(168,85,247,0.3)] rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-2xl">
                    <div className="flex items-center gap-6">
                       <div className="flex -space-x-3 overflow-hidden">
                          {selectedForCompare.map(p => (
                            <div key={p.id} className="w-12 h-12 rounded-full bg-purple-600 border-4 border-[#0f172a] flex items-center justify-center text-xs font-black text-white shadow-xl flex-shrink-0">
                               {p.name.charAt(0)}
                            </div>
                          ))}
                       </div>
                       <span className="text-lg font-black text-white uppercase tracking-tighter">{selectedForCompare.length} Prospects Shortlisted</span>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                       <button onClick={() => setSelectedForCompare([])} className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-slate-400 hover:text-red-400 transition-colors font-black text-[10px] uppercase tracking-widest border border-slate-800">Clear</button>
                       <button 
                         disabled={selectedForCompare.length < 2}
                         onClick={executeComparison} 
                         className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 group disabled:opacity-30 disabled:cursor-not-allowed"
                       >
                          <ArrowLeftRight className="w-5 h-5" /> Compare Benchmarks
                       </button>
                    </div>
                 </div>
              </div>
           )}

           {/* Dashboard Footer Suite */}
           <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-[2.5rem] p-10 space-y-5 group hover:border-blue-500/30 transition-all">
                 <div className="flex items-center gap-4">
                    <LayoutPanelTop className="w-6 h-6 text-blue-500" />
                    <h4 className="text-lg font-black text-white uppercase tracking-widest italic">Grid Architecture</h4>
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                    Proprietary consensus modeling synthesizing thousands of national scouting reports into a single, high-fidelity draft board.
                 </p>
              </div>

              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-[2.5rem] p-10 space-y-5 group hover:border-purple-500/30 transition-all">
                 <div className="flex items-center gap-4">
                    <Zap className="w-6 h-6 text-purple-500" />
                    <h4 className="text-lg font-black text-white uppercase tracking-widest italic">Neural Surveillance</h4>
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                    Real-time crawler active across 247Sports, Rivals, On3, ESPN, CBS, and PFF ensuring no prospect entry is missed.
                 </p>
              </div>

              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-[2.5rem] p-10 space-y-5 group hover:border-emerald-500/30 transition-all">
                 <div className="flex items-center gap-4">
                    <MonitorPlay className="w-6 h-6 text-emerald-500" />
                    <h4 className="text-lg font-black text-white uppercase tracking-widest italic">Film study Suite</h4>
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                    Each elite node contains verified study film links and audio intelligence synthesize by Gemini 3 Pro.
                 </p>
              </div>
           </div>
        </div>
      )}

      {sources.length > 0 && (
         <div className="mt-20 pt-12 border-t border-slate-800 flex flex-wrap gap-4">
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] w-full mb-4">Primary Global Intelligence Grounding Assets</span>
            {sources.map((s, i) => (
               <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-slate-900/60 border border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:text-purple-400 transition-all flex items-center gap-3 max-w-sm truncate shadow-xl">
                  <Globe className="w-4 h-4 text-slate-700" />
                  {s.title}
               </a>
            ))}
         </div>
      )}
    </div>
  );
};
