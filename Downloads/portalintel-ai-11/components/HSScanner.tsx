
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { scanHSRecruiting } from '../services/gemini';
import { Player, GroundingSource, ScoutUser } from '../types';
import { PlayerCard } from './PlayerCard';
import { EmailIntelModal } from './EmailIntelModal';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { 
  Search, Loader2, Globe, GraduationCap, Building2, ChevronDown, 
  ShieldCheck, AlertCircle, X, Brain, LayoutGrid, List, 
  FileSpreadsheet, FileDown, Mail, MessageCircle, Printer, Share2,
  ArrowUp, ArrowDown, ArrowRight, Info, Sparkles, User, History,
  ArrowLeftRight, CheckCircle2, BookmarkPlus
} from 'lucide-react';

interface HSScannerProps {
  isPro?: boolean; 
  onRequestPro?: () => boolean;
  onVoiceDeepDive?: (context: string) => void;
}

const CLASSES = ['2026', '2027', '2028', '2029', '2030', '2031', '2032'];
const STATES = [
  'All', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];
const POSITIONS = ['All Positions', 'QB', 'RB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DL', 'LB', 'CB', 'S', 'ATH'];

const ELITE_HS_HISTORY = [
  "Julian Lewis", "Julian Sayin", "Caleb Williams", "Arch Manning", "Travis Hunter", 
  "Quinn Ewers", "Nico Iamaleava", "Malachi Nelson", "Dante Moore", "Jackson Arnold", 
  "Cam Coleman", "Jeremiah Smith", "Ryan Williams", "Dylan Stewart", "Ellis Robinson IV",
  "Justin Fields", "Trevor Lawrence", "Kayvon Thibodeaux", "Korey Foreman"
];

export const HSScanner: React.FC<HSScannerProps> = ({ isPro, onRequestPro, onVoiceDeepDive }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ players: Player[], text: string, sources: GroundingSource[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isManualQuery, setIsManualQuery] = useState(false);
  const [useDeepResearch, setUseDeepResearch] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('portal_scout_user') || 'null') as ScoutUser | null;
  const hasConfig = isSupabaseConfigured();

  // HS Specific Filters
  const [classYear, setClassYear] = useState('2027');
  const [state, setState] = useState('All');
  const [position, setPosition] = useState('All Positions');
  const [targetSchool, setTargetSchool] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState<'grade' | 'stars' | 'name' | 'class'>('grade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isManualQuery) {
      const posPart = position === 'All Positions' ? 'elite prospects' : `${position} prospects`;
      const statePart = state === 'All' ? 'nationally' : `in ${state}`;
      const yearPart = `Class of ${classYear}`;
      setQuery(`Top ${posPart} ${statePart} from ${yearPart}`);
    }
  }, [classYear, state, position, isManualQuery]);

  const handleScan = async (e?: React.FormEvent | string) => {
    if (e && typeof e !== 'string') e.preventDefault();
    const finalQuery = typeof e === 'string' ? e : query;
    if (!isPro && onRequestPro) { const allowed = onRequestPro(); if (!allowed) return; }
    if (!finalQuery.trim()) return;

    setLoading(true); setResults(null); setError(null); setShowSuggestions(false); setSelectedPlayers([]);
    
    try {
      const data = await scanHSRecruiting(finalQuery, { classYear, state, position }, useDeepResearch);
      if (data.players.length === 0) {
        setError("Network scan returned zero direct asset matches.");
      } else {
        setResults(data);
      }
    } catch (err: any) {
      setError("Intelligence relay error. Check system status.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlayerSelection = (player: Player) => {
    setSelectedPlayers(prev => {
      const isAlreadySelected = prev.some(p => p.id === player.id);
      if (isAlreadySelected) return prev.filter(p => p.id !== player.id);
      return [...prev, player].slice(0, 15);
    });
  };

  const handleBulkSaveToBoard = async () => {
    if (!selectedPlayers.length || isBulkSaving) return;
    setIsBulkSaving(true);
    try {
       if (!currentUser || !hasConfig) {
          const storageKey = 'portal_saved_players_hs';
          const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const newPlayers = selectedPlayers.filter(p => !saved.some((sp: Player) => sp.id === p.id));
          localStorage.setItem(storageKey, JSON.stringify([...saved, ...newPlayers]));
       } else {
          const entries = selectedPlayers.map(p => ({
            user_id: currentUser.id,
            player_id: p.id,
            recruiting_type: 'HS',
            player_data: p
          }));
          const { error } = await supabase.from('portal_saved_players').upsert(entries, { onConflict: 'user_id,player_id' });
          if (error) throw error;
       }
       alert(`Successfully synced ${selectedPlayers.length} prospects to your Scout Board.`);
       setSelectedPlayers([]);
    } catch (err) {
       console.error(err);
       alert("Bulk sync failure. Please check cloud connection.");
    } finally {
       setIsBulkSaving(false);
    }
  };

  const calculatePIGrade = (p: Player): number => {
    let grade = (p.stars * 10) + ((p.impactScore || 50) / 2);
    return Math.min(100, Math.round(grade));
  };

  const processedPlayers = useMemo(() => {
    if (!results?.players) return [];
    let filtered = [...results.players];
    if (targetSchool) {
      filtered = filtered.filter(p => (p.predictedDestination || '').toLowerCase().includes(targetSchool.toLowerCase()));
    }
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'grade': comparison = calculatePIGrade(a) - calculatePIGrade(b); break;
        case 'stars': comparison = a.stars - b.stars; break;
        case 'name': comparison = a.name.localeCompare(b.name); break;
        case 'class': comparison = (a.classYear || '').localeCompare(b.classYear || ''); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [results, sortBy, sortOrder]);

  const handleExportCSV = () => {
    if (!processedPlayers.length) return;
    const headers = ["Rank", "Name", "Position", "Stars", "PI Grade", "Class", "High School", "State", "Summary"];
    const rows = processedPlayers.map((p, idx) => [idx + 1, `"${p.name}"`, p.position, p.stars, calculatePIGrade(p), p.classYear || classYear, `"${p.highSchool}"`, p.state || state, `"${p.summary}"`]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `PortalIntel_HS_Report_${classYear}.csv`; link.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setQuery(val); setIsManualQuery(true);
    if (val.trim().length > 1) {
      const matches = ELITE_HS_HISTORY.filter(name => name.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
      setSuggestions(matches); setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (name: string) => { setQuery(name); setShowSuggestions(false); handleScan(name); };
  const resetManualMode = () => { setIsManualQuery(false); setPosition('All Positions'); setState('All'); setClassYear('2027'); setQuery(''); setSelectedPlayers([]); };

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700 pb-32 max-w-7xl mx-auto px-2 md:px-0 relative">
      <EmailIntelModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} players={processedPlayers} reportTitle={`HS Intelligence: Class of ${classYear}`} />

      <div className="bg-[#0b1224] border border-slate-800 p-6 md:p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl print:hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
        <div className="relative z-10 space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-600/10 rounded-xl border border-emerald-500/20">
                       <GraduationCap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">HS PROSPECT SCANNER</h2>
                 </div>
                 <p className="text-slate-400 text-sm font-medium pl-1">Targeting elite talent from <span className="text-white font-bold">Class of 2026-2032</span>.</p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl shadow-xl">
                 <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">National Grid Active</span>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[ {label: 'TARGET CLASS', val: classYear, set: setClassYear, list: CLASSES}, {label: 'TERRITORY', val: state, set: setState, list: STATES}, {label: 'UNIT GROUP', val: position, set: setPosition, list: POSITIONS} ].map((f, i) => (
                <div key={i} className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">{f.label}</label>
                   <div className="relative">
                      <select value={f.val} onChange={e => { f.set(e.target.value); setIsManualQuery(false); }} className="w-full bg-[#0d1526] border border-slate-800 rounded-xl px-5 py-3.5 text-white font-bold appearance-none focus:outline-none focus:border-emerald-500/50 shadow-inner">
                         {f.list.map(o => <option key={o} value={o}>{o.length === 2 ? `State: ${o}` : o === 'All' ? 'National Search' : o}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                   </div>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">TARGET SCHOOL / PREDICTED</label>
               <div className="relative">
                 <input 
                   type="text" 
                   value={targetSchool} 
                   onChange={(e) => setTargetSchool(e.target.value)} 
                   placeholder="Filter by school..." 
                   className="w-full bg-[#0d1526] border border-slate-800 rounded-xl px-5 py-3.5 text-white font-bold focus:outline-none focus:border-emerald-500/50 shadow-inner" 
                 />
                 <Building2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
               </div>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">SORT BY</label>
               <div className="relative">
                 <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full bg-[#0d1526] border border-slate-800 rounded-xl px-5 py-3.5 text-white font-bold appearance-none focus:outline-none focus:border-emerald-500/50 shadow-inner">
                   <option value="grade">PI Grade</option>
                   <option value="stars">Stars</option>
                   <option value="name">Name</option>
                   <option value="class">Class</option>
                 </select>
                 <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
               </div>
             </div>
           </div>

           <div className="relative" ref={searchRef}>
             <form onSubmit={handleScan} className="relative group">
               <div className="flex flex-col sm:flex-row bg-[#0d1526] border border-slate-800 rounded-[1.25rem] overflow-hidden shadow-2xl focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all z-10 relative">
                  <div className="flex-1 flex items-center min-h-[72px]">
                     <div className="pl-6 flex items-center justify-center"><Search className="w-6 h-6 text-slate-700" /></div>
                     <input type="text" value={query} onChange={handleInputChange} onFocus={() => query.trim().length > 1 && suggestions.length > 0 && setShowSuggestions(true)} placeholder="Search by prospect name or keywords..." className="flex-1 bg-transparent px-6 py-4 text-white placeholder-slate-700 focus:outline-none text-xl font-bold tracking-tight" />
                     {query && <button type="button" onClick={resetManualMode} className="p-2 mr-4 bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all active:scale-90"><X className="w-5 h-5" /></button>}
                  </div>
                  <button type="submit" disabled={loading || !query.trim()} className="bg-[#00a86b] hover:bg-[#00c880] text-white px-12 py-4 md:py-6 font-black text-sm uppercase tracking-[0.1em] transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 min-w-[280px] border-l border-slate-800/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                     {loading ? <Loader2 className="animate-spin w-6 h-6" /> : 'SCAN HS NETWORK'}
                  </button>
               </div>
             </form>
             {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-3 z-[100] bg-[#0d1526]/95 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                   <div className="p-4 border-b border-slate-800 flex items-center justify-between"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><History className="w-3.5 h-3.5 text-blue-400" /> Intel Matches</span></div>
                   <div className="py-2">
                      {suggestions.map((name, i) => (
                        <button key={i} onClick={() => selectSuggestion(name)} className="w-full text-left px-8 py-4 hover:bg-emerald-500/10 transition-colors flex items-center justify-between group border-b border-slate-800/40 last:border-none">
                           <div className="flex items-center gap-4"><div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-emerald-500/30"><User className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" /></div><span className="text-white font-bold text-lg">{name}</span></div>
                           <ArrowRight className="w-4 h-4 text-slate-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                   </div>
                </div>
             )}
           </div>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button onClick={() => setUseDeepResearch(!useDeepResearch)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${useDeepResearch ? 'bg-purple-600/10 border-purple-500/40 text-purple-400 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                <Brain className={`w-4 h-4 ${useDeepResearch ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{useDeepResearch ? 'DEEP RESEARCH ACTIVE' : 'STANDARD SEARCH'}</span>
              </button>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">POWERED BY GEMINI 3 THINKING ARCHITECTURE</p>
           </div>
        </div>
      </div>

      {results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                 <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Scouting Assets Found</h3>
                 <div className="flex items-center gap-3">
                   <span className="bg-slate-800 text-slate-500 px-3 py-1 rounded-lg text-xs font-black tracking-widest">({results.players.length} TOTAL)</span>
                   <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
                     <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                     <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-emerald-400' : 'text-slate-600'}`}><List className="w-4 h-4" /></button>
                   </div>
                 </div>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden justify-center">
                 <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-all text-[10px] font-black uppercase tracking-widest"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
                 <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"><Mail className="w-4 h-4" /> EMAIL</button>
              </div>
           </div>

           <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" : "space-y-2.5"}>
              {processedPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} onSelect={togglePlayerSelection} isSelected={selectedPlayers.some(sp => sp.id === p.id)} isPro={isPro} onRequestPro={onRequestPro} viewMode={viewMode} onVoiceDeepDive={onVoiceDeepDive} />
              ))}
           </div>
        </div>
      )}

      {selectedPlayers.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-6 animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-[#0f172a]/90 border-2 border-emerald-500/50 shadow-[0_0_60px_rgba(16,185,129,0.3)] rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-2xl">
              <div className="flex items-center gap-6">
                 <div className="flex -space-x-3 overflow-hidden">
                    {selectedPlayers.slice(0, 5).map((p) => (
                      <div key={p.id} className="w-12 h-12 rounded-full bg-emerald-600 border-4 border-[#0f172a] flex items-center justify-center text-xs font-black text-white shadow-xl flex-shrink-0">{p.name.charAt(0)}</div>
                    ))}
                    {selectedPlayers.length > 5 && (
                      <div className="w-12 h-12 rounded-full bg-slate-800 border-4 border-[#0f172a] flex items-center justify-center text-[10px] font-black text-slate-400 flex-shrink-0">+{selectedPlayers.length - 5}</div>
                    )}
                 </div>
                 <span className="text-lg font-black text-white uppercase tracking-tighter">{selectedPlayers.length} HS Assets Tagged</span>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <button onClick={() => setSelectedPlayers([])} className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-slate-400 hover:text-red-400 transition-colors font-black text-[10px] uppercase tracking-widest border border-slate-800">Clear</button>
                 <button onClick={handleBulkSaveToBoard} disabled={isBulkSaving} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 group">
                    {isBulkSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
                    Bulk Save to Board
                 </button>
              </div>
           </div>
        </div>
      )}

      {loading && (
        <div className="py-40 flex flex-col items-center justify-center gap-8 animate-pulse text-center">
           <div className="relative"><div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div><GraduationCap className="w-10 h-10 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" /></div>
           <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Initializing Network Scan...</h4>
        </div>
      )}
    </div>
  );
};

const FilterIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
