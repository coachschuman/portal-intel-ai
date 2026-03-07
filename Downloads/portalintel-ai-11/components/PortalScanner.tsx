
import React, { useState, useMemo, useEffect } from 'react';
import { scanTransferPortal, getComparisonInsight } from '../services/gemini';
import { Player, GroundingSource, SavedComparison, SavedPrompt, ScoutUser } from '../types';
import { PlayerCard } from './PlayerCard';
import { EmailIntelModal } from './EmailIntelModal';
import { IntelligenceReport } from './IntelligenceReport';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Search, Loader2, Sparkles, AlertTriangle, Filter, X, ArrowUp, ArrowDown, ArrowRight, Trash2, ArrowLeftRight, Star, Globe, FileDown, FileSpreadsheet, Mail, Check, DollarSign, Info, Zap, Maximize2, LayoutGrid, List, BrainCircuit, User, Save, ShieldCheck, BarChart3, Activity, Crown, Target, CheckCircle2, Lock, Mic2, Building2, BookmarkPlus } from 'lucide-react';

interface PortalScannerProps {
  isPro?: boolean;
  onRequestPro?: () => boolean;
  initialQuery?: string;
  onVoiceDeepDive?: (context: string) => void;
}

export const PortalScanner: React.FC<PortalScannerProps> = ({ isPro, onRequestPro, initialQuery, onVoiceDeepDive }) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ players: Player[], text: string, sources: GroundingSource[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFastScan, setIsFastScan] = useState(false);
  // Default to list view for a cleaner table-like experience
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonInsight, setComparisonInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isComparisonSaved, setIsComparisonSaved] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [programNeeds, setProgramNeeds] = useState('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('portal_scout_user') || 'null') as ScoutUser | null;
  const hasConfig = isSupabaseConfigured();

  useEffect(() => {
    if (initialQuery && isPro) {
      setQuery(initialQuery);
      handleScan(initialQuery);
    }
  }, [initialQuery, isPro]);

  const handleScan = async (e?: React.FormEvent | string) => {
    if (e && typeof e !== 'string') e.preventDefault();
    if (!isPro && onRequestPro) { onRequestPro(); return; }
    const searchTarget = typeof e === 'string' ? e : query;
    if (!searchTarget.trim()) return;
    
    setLoading(true); 
    setError(null); 
    setResults(null); 
    setSelectedPlayers([]);
    
    try {
      const data = await scanTransferPortal(searchTarget, isFastScan);
      setResults(data);
      const archive: SavedPrompt[] = JSON.parse(localStorage.getItem('portal_prompt_history') || '[]');
      const newEntry: SavedPrompt = { id: `prompt-${Date.now()}`, query: searchTarget.trim(), timestamp: Date.now(), isFast: isFastScan, resultCount: data.players.length };
      const filteredArchive = archive.filter(p => p.query !== newEntry.query);
      localStorage.setItem('portal_prompt_history', JSON.stringify([newEntry, ...filteredArchive].slice(0, 50)));
    } catch (err: any) {
      console.error("Scan Relay Failure:", err);
      setError(err.message || "Intelligence relay timeout. Please refine your query or try again.");
    } finally { 
      setLoading(false); 
    }
  };

  const handleBulkSaveToBoard = async () => {
    if (!selectedPlayers.length || isBulkSaving) return;
    setIsBulkSaving(true);
    try {
       if (!currentUser || !hasConfig) {
          const storageKey = 'portal_saved_players';
          const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const newPlayers = selectedPlayers.filter(p => !saved.some((sp: Player) => sp.id === p.id));
          localStorage.setItem(storageKey, JSON.stringify([...saved, ...newPlayers]));
       } else {
          const entries = selectedPlayers.map(p => ({
            user_id: currentUser.id,
            player_id: p.id,
            recruiting_type: 'College',
            player_data: p
          }));
          const { error } = await supabase.from('portal_saved_players').upsert(entries, { onConflict: 'user_id,player_id' });
          if (error) throw error;
       }
       alert(`Successfully synced ${selectedPlayers.length} assets to your Scout Board.`);
       setSelectedPlayers([]);
    } catch (err) {
       console.error(err);
    } finally {
       setIsBulkSaving(false);
    }
  };

  const togglePlayerSelection = (player: Player) => {
    setSelectedPlayers(prev => {
      const isAlreadySelected = prev.some(p => p.id === player.id);
      if (isAlreadySelected) return prev.filter(p => p.id !== player.id);
      return [...prev, player].slice(0, 15);
    });
  };

  const executeComparisonAnalysis = async () => {
    setLoadingInsight(true); setIsComparisonSaved(false);
    try {
      const insight = await getComparisonInsight(selectedPlayers, programNeeds, currentUser?.blueprint);
      setComparisonInsight(insight);
    } catch (err) { setComparisonInsight("Could not generate AI comparison."); } finally { setLoadingInsight(false); }
  };

  const handleSaveComparison = () => {
    if (!comparisonInsight) return;
    const newReport: SavedComparison = { id: `comp-${Date.now()}`, title: `Comparative Intel: ${selectedPlayers.map(p => p.name).join(' vs ')}`, content: comparisonInsight, timestamp: Date.now(), players: selectedPlayers.map(p => p.name) };
    const saved = JSON.parse(localStorage.getItem('portal_saved_comparisons') || '[]');
    localStorage.setItem('portal_saved_comparisons', JSON.stringify([newReport, ...saved]));
    setIsComparisonSaved(true);
  };

  const parseNILValue = (val?: string): number => {
    if (!val || val === 'TBD' || val.toLowerCase() === 'unknown') return 0;
    let numericStr = val.replace(/[$,+]/g, '').toLowerCase();
    let multiplier = 1;
    if (numericStr.includes('k')) { multiplier = 1000; numericStr = numericStr.replace('k', ''); } else if (numericStr.includes('m')) { multiplier = 1000000; numericStr = numericStr.replace('m', ''); }
    return (parseFloat(numericStr) || 0) * multiplier;
  };

  const calculatePIGrade = (p: Player): number => {
    let grade = (p.stars * 10) + ((p.impactScore || 50) / 2);
    const nilVal = parseNILValue(p.nilValue);
    if (nilVal >= 1000000) grade += 10; else if (nilVal >= 500000) grade += 5;
    return Math.min(100, Math.round(grade));
  };

  const [minStars, setMinStars] = useState(0);
  const [minNILWorth, setMinNILWorth] = useState<number>(0);
  const [minPIGrade, setMinPIGrade] = useState(0);
  const [positionFilter, setPositionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [originSchool, setOriginSchool] = useState('');
  const [targetSchool, setTargetSchool] = useState('');
  const [sortBy, setSortBy] = useState<'grade' | 'stars' | 'name' | 'updated'>('grade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const processedPlayers = useMemo(() => {
    if (!results?.players) return [];
    const filtered = results.players.filter(player => {
        const grade = calculatePIGrade(player);
        if (minStars > 0 && player.stars < minStars) return false;
        if (minNILWorth > 0 && parseNILValue(player.nilValue) < minNILWorth) return false;
        if (minPIGrade > 0 && grade < minPIGrade) return false;
        if (positionFilter !== 'All' && player.position !== positionFilter) return false;
        const isUndecided = (player.predictedDestination || '').toLowerCase().includes('undecided') || (player.predictedDestination || '').toLowerCase().includes('unknown') || player.predictedDestination === 'TBD';
        if (statusFilter === 'Available' && !isUndecided) return false;
        if (statusFilter === 'Committed' && isUndecided) return false;
        
        if (originSchool && !(player.previousSchool || '').toLowerCase().includes(originSchool.toLowerCase())) return false;
        
        if (targetSchool) {
          const dest = (player.predictedDestination || '').toLowerCase();
          const comm = (player.commitment?.schoolName || '').toLowerCase();
          if (!dest.includes(targetSchool.toLowerCase()) && !comm.includes(targetSchool.toLowerCase())) return false;
        }
        
        return true;
    });
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'grade': comparison = calculatePIGrade(a) - calculatePIGrade(b); break;
        case 'stars': comparison = a.stars - b.stars; break;
        case 'name': comparison = a.name.localeCompare(b.name); break;
        case 'updated': comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime(); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [results, minStars, minNILWorth, minPIGrade, positionFilter, statusFilter, sortBy, sortOrder]);

  const renderComparisonModal = () => (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="bg-[#0b1224] w-full max-w-7xl max-h-[92vh] rounded-[3.5rem] border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8 md:p-10 border-b border-slate-800 flex justify-between items-center bg-[#0b1224] z-10">
           <div className="flex items-center gap-6"><div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20"><ArrowLeftRight className="w-8 h-8 text-blue-400" /></div><div><h2 className="text-3xl font-black text-white tracking-tighter uppercase">Strategic Comparison Hub</h2></div></div>
           <div className="flex items-center gap-4">{comparisonInsight && !loadingInsight && (<button onClick={handleSaveComparison} disabled={isComparisonSaved} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isComparisonSaved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl active:scale-95'}`}>{isComparisonSaved ? <ShieldCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}{isComparisonSaved ? 'Archived' : 'Archive Audit'}</button>)}<button onClick={() => setShowComparison(false)} className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-white border border-slate-800 transition-all active:scale-90"><X className="w-8 h-8" /></button></div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide">
           <div className="mb-12 bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center gap-4"><Target className="w-6 h-6 text-amber-400" /><h3 className="text-xl font-black text-white uppercase tracking-tight">Program Alignment Requirements</h3></div>
                 {currentUser?.blueprint && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                       <Building2 className="w-4 h-4 text-blue-400" />
                       <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Linked: {currentUser.blueprint.schoolName} DNA</span>
                    </div>
                 )}
              </div>
              <div className="flex flex-col lg:flex-row gap-6"><textarea value={programNeeds} onChange={(e) => setProgramNeeds(e.target.value)} placeholder="Define specific unit gaps or character requirements..." className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px]" /><button onClick={executeComparisonAnalysis} disabled={loadingInsight} className="lg:w-72 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex flex-col items-center justify-center gap-3 py-6 shadow-2xl transition-all active:scale-95 group">{loadingInsight ? <Loader2 className="w-8 h-8 animate-spin" /> : <BrainCircuit className="w-8 h-8 group-hover:scale-110 transition-transform" />}{loadingInsight ? 'Synthesizing...' : 'Generate Comparative Insight'}</button></div>
           </div>

           <div className="bg-[#0f172a] border border-slate-800 rounded-[4rem] p-10 md:p-14 relative shadow-2xl flex flex-col min-h-[400px]">
              <div className="flex items-center gap-5 mb-10 pb-10 border-b border-slate-800/50"><div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20"><BrainCircuit className="w-8 h-8 text-blue-400" /></div><div><h3 className="text-2xl font-black text-white uppercase tracking-tight">Bespoke Strategic Synthesis</h3></div></div>
              <div className="flex-1">
                 {loadingInsight ? (
                   <div className="flex flex-col items-center justify-center py-24 gap-8"><div className="relative"><Loader2 className="w-20 h-20 animate-spin text-blue-500/20" /><ArrowLeftRight className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" /></div><p className="text-xs font-black uppercase tracking-[0.4em] text-blue-400 animate-pulse">Running Comparative Algorithms...</p></div>
                 ) : comparisonInsight ? (
                   <IntelligenceReport text={comparisonInsight} />
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center py-24 gap-6 opacity-30"><BrainCircuit className="w-16 h-16 text-slate-700" /><p className="text-sm font-black uppercase tracking-[0.2em] text-center max-w-xs">Define Program context above to initiate bespoke comparison</p></div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  if (!isPro) { return <div className="p-20 text-center">Pro Access Required</div>; }

  return (
    <div className="w-full space-y-10 relative px-4 md:px-0">
      <EmailIntelModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} players={selectedPlayers.length > 0 ? selectedPlayers : processedPlayers} reportTitle={selectedPlayers.length > 0 ? "Shortlisted Prospect Report" : `Portal Scanner Report: ${query}`} />

      <div className="bg-[#0b1224] border border-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden print:hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
            <div className="space-y-3"><h2 className="text-4xl font-black text-white tracking-tighter uppercase">Portal Scanner <Sparkles className="inline text-yellow-400 w-8 h-8 ml-1" /></h2></div>
            <div className="flex items-center gap-3">
               <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner mr-4">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Grid View"
                  >
                     <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Table View"
                  >
                     <List className="w-4 h-4" />
                  </button>
               </div>
               <button onClick={() => setIsFastScan(!isFastScan)} className="flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all duration-500 group min-w-[180px] bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700">
                  <Zap className={`w-5 h-5 ${isFastScan ? 'fill-current animate-bounce text-amber-500' : ''}`} />
                  <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">SPEED MODE</div>
                    <div className="text-sm font-bold">{isFastScan ? 'Turbo (3 Flash)' : 'Normal (3 Pro)'}</div>
                  </div>
               </button>
            </div>
          </div>
          <form onSubmit={handleScan} className="relative max-w-4xl"><div className="flex bg-[#0f172a] border border-slate-800 rounded-[1.25rem] overflow-hidden shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/30 transition-all"><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search by name, school, or position" className="flex-1 bg-transparent px-8 py-5 text-white placeholder-slate-700 focus:outline-none text-xl font-medium" /><button type="submit" disabled={loading || !query.trim()} className="bg-[#2563eb] hover:bg-blue-500 text-white px-10 py-5 font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-3 active:scale-95 whitespace-nowrap">{loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Scan Portal'}</button></div></form>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Filter className="w-3 h-3" /> Position</label>
              <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-2.5 px-4 text-slate-300 font-bold text-xs outline-none focus:border-blue-500/50 transition-all">
                {['All', 'QB', 'RB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DL', 'LB', 'CB', 'S', 'ATH'].map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><DollarSign className="w-3 h-3" /> NIL Worth</label>
              <select value={minNILWorth} onChange={(e) => setMinNILWorth(Number(e.target.value))} className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-2.5 px-4 text-slate-300 font-bold text-xs outline-none focus:border-blue-500/50 transition-all">
                <option value={0}>All Values</option>
                <option value={100000}>$100K+</option>
                <option value={250000}>$250K+</option>
                <option value={500000}>$500K+</option>
                <option value={1000000}>$1M+</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Target className="w-3 h-3" /> Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-2.5 px-4 text-slate-300 font-bold text-xs outline-none focus:border-blue-500/50 transition-all">
                <option value="All">All Players</option>
                <option value="Available">Available</option>
                <option value="Committed">Committed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Building2 className="w-3 h-3" /> Origin School</label>
              <input type="text" value={originSchool} onChange={(e) => setOriginSchool(e.target.value)} placeholder="From school..." className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-2.5 px-4 text-slate-300 font-bold text-xs outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Target className="w-3 h-3" /> Destination</label>
              <input type="text" value={targetSchool} onChange={(e) => setTargetSchool(e.target.value)} placeholder="To school..." className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-2.5 px-4 text-slate-300 font-bold text-xs outline-none focus:border-blue-500/50 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {loading && !results && ( 
        <div className="py-24 flex flex-col items-center justify-center gap-6 animate-pulse">
           <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
           <p className="text-slate-500 font-black uppercase tracking-widest">Grounded Network Intelligence Scanning...</p>
        </div> 
      )}

      {results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Found Prospects</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{processedPlayers.length} matches detected via neural grounding</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => { if (onVoiceDeepDive) onVoiceDeepDive(`Search results analysis for query: ${query}. Total found: ${processedPlayers.length}. Top targets include: ${processedPlayers.slice(0, 5).map(p=>p.name).join(', ')}.`); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all text-xs font-black uppercase tracking-widest shadow-xl active:scale-95"
              >
                <Mic2 className="w-4 h-4" /> VOICE ANALYSIS
              </button>
              <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1e293b] border border-blue-500/20 text-blue-400 hover:text-white hover:bg-blue-600 transition-all text-xs font-black uppercase tracking-widest shadow-xl active:scale-95"><Mail className="w-4 h-4" /> EMAIL REPORT</button>
            </div>
          </div>
          
          {processedPlayers.length > 0 ? (
            <div className="bg-[#0b1224] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              {viewMode === 'list' && (
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left border-collapse min-w-[1200px] table-fixed">
                    <colgroup>
                      <col className="w-[60px]" />
                      <col className="w-[200px]" />
                      <col className="w-[80px]" />
                      <col className="w-[100px]" />
                      <col className="w-[180px]" />
                      <col className="w-[180px]" />
                      <col className="w-[120px]" />
                      <col className="w-[100px]" />
                      <col className="w-[80px]" />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800">
                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tag</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Prospect Name</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pos</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Class</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Previous Program</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Target/Commit</th>
                        <th className="px-6 py-5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">NIL Worth</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">PI Grade</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Brief</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {processedPlayers.map((player) => (
                        <PlayerCard 
                          key={player.id} 
                          player={player} 
                          onSelect={togglePlayerSelection} 
                          isSelected={selectedPlayers.some(p => p.id === player.id)} 
                          isPro={isPro} 
                          onRequestPro={onRequestPro} 
                          onVoiceDeepDive={onVoiceDeepDive}
                          viewMode="list" 
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-6">
                  {processedPlayers.map((player) => (
                    <PlayerCard 
                      key={player.id} 
                      player={player} 
                      onSelect={togglePlayerSelection} 
                      isSelected={selectedPlayers.some(p => p.id === player.id)} 
                      isPro={isPro} 
                      onRequestPro={onRequestPro} 
                      onVoiceDeepDive={onVoiceDeepDive}
                      viewMode="grid" 
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/10">
               <AlertTriangle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
               <p className="text-slate-500 font-black uppercase tracking-widest">No verified assets found for this specific query signature.</p>
               <p className="text-slate-600 text-xs mt-2">Try a more broad term or check position filters.</p>
            </div>
          )}

          {results.sources && results.sources.length > 0 && (
            <div className="pt-10 border-t border-slate-800/50 flex flex-wrap gap-3 px-4">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] w-full mb-1">Grounded via Neural Relay Path:</span>
              {results.sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-blue-500/30 px-3 py-1.5 rounded-lg text-[9px] font-black text-slate-500 hover:text-blue-400 transition-all">
                  <Globe className="w-3 h-3" />
                  {s.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedPlayers.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-6 animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-[#0f172a]/90 border-2 border-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.3)] rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-2xl">
              <div className="flex items-center gap-6">
                 <div className="flex -space-x-3 overflow-hidden">{selectedPlayers.slice(0, 5).map((p) => (<div key={p.id} className="w-12 h-12 rounded-full bg-blue-600 border-4 border-[#0f172a] flex items-center justify-center text-xs font-black text-white shadow-xl flex-shrink-0">{p.name.charAt(0)}</div>))}</div>
                 <span className="text-lg font-black text-white uppercase tracking-tighter">{selectedPlayers.length} Assets Tagged</span>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <button onClick={() => setSelectedPlayers([])} className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-slate-400 hover:text-red-400 transition-colors font-black text-[10px] uppercase tracking-widest border border-slate-800">Clear</button>
                 <div className="flex items-center gap-2 flex-1 md:flex-none">
                    <button onClick={handleBulkSaveToBoard} disabled={isBulkSaving} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 border border-slate-700 shadow-xl active:scale-95">
                       {isBulkSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                       Save All
                    </button>
                    <button disabled={selectedPlayers.length < 2} onClick={() => setShowComparison(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-30 shadow-2xl active:scale-95 group">
                       <ArrowLeftRight className="w-5 h-5" /> Compare Assets
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showComparison && renderComparisonModal()}
    </div>
  );
};
