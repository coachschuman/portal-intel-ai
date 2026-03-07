
import React, { useState, useEffect, useMemo } from 'react';
import { Player, GroundingSource, ScoutUser } from '../types';
import { getConsensusBigBoard } from '../services/gemini';
import { PlayerCard } from './PlayerCard';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Trophy, Globe, Loader2, Sparkles, Clock, Target, Play, ShieldCheck, ListFilter, GraduationCap, MapPin, ChevronDown, Lock, Zap, Crown, Info, ChevronLeft, ChevronRight, ArrowDown, Search, X, DollarSign, School, BookmarkPlus } from 'lucide-react';

interface BigBoardProps {
  isPro?: boolean;
  onRequestPro?: () => boolean;
  // Added onVoiceDeepDive to props interface
  onVoiceDeepDive?: (context: string) => void;
}

const POSITIONS = ['All Positions', 'QB', 'RB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DL', 'LB', 'CB', 'S', 'K', 'P', 'LS', 'ATH'];
const VALUATIONS = [ { label: 'All Values', value: 0 }, { label: '$100K+', value: 100000 }, { label: '$250K+', value: 250000 }, { label: '$500K+', value: 500000 }, { label: '$1M+', value: 1000000 } ];
const COMMITMENT_STATUSES = [ { label: 'All Players', value: 'All' }, { label: 'Not Committed / Available', value: 'Available' }, { label: 'Committed / Signed', value: 'Committed' } ];

const PLAYERS_PER_PAGE = 12;

// Destructured onVoiceDeepDive from props
export const BigBoard: React.FC<BigBoardProps> = ({ isPro, onRequestPro, onVoiceDeepDive }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [hasRunInitialSearch, setHasRunInitialSearch] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  
  const [activePos, setActivePos] = useState('All Positions');
  const [minNILWorth, setMinNILWorth] = useState<number>(0);
  const [commitmentStatus, setCommitmentStatus] = useState('All');
  const [targetSchool, setTargetSchool] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'rank' | 'nil'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const currentUser = JSON.parse(localStorage.getItem('portal_scout_user') || 'null') as ScoutUser | null;
  const hasConfig = isSupabaseConfigured();
  const syncInterval = 12 * 60 * 60 * 1000;

  useEffect(() => {
    if (isPro) {
      const cachedData = localStorage.getItem('portal_bigboard_cache');
      const cachedTime = localStorage.getItem('portal_bigboard_sync_time');
      if (cachedData && cachedTime) {
        setPlayers(JSON.parse(cachedData));
        setLastSync(parseInt(cachedTime));
        setHasRunInitialSearch(true);
      }
    }
  }, [isPro]);

  useEffect(() => { setCurrentPage(1); }, [activePos, searchQuery, minNILWorth, commitmentStatus, targetSchool, sortBy, sortOrder]);

  const handleGrounding = async () => {
    if (!isPro && onRequestPro) { onRequestPro(); return; }
    setLoading(true); setSelectedPlayers([]);
    try {
      const data = await getConsensusBigBoard({ position: activePos, minValuation: minNILWorth, commitmentStatus, school: targetSchool });
      setPlayers(data.players); setSources(data.sources); setLastSync(Date.now()); setHasRunInitialSearch(true);
      localStorage.setItem('portal_bigboard_cache', JSON.stringify(data.players));
      localStorage.setItem('portal_bigboard_sync_time', Date.now().toString());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const togglePlayerSelection = (player: Player) => {
    setSelectedPlayers(prev => {
      const isAlreadySelected = prev.some(p => p.id === player.id);
      if (isAlreadySelected) return prev.filter(p => p.id !== player.id);
      return [...prev, player].slice(0, 15);
    });
  };

  const handleBulkSave = async () => {
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
       alert(`Successfully dispatched ${selectedPlayers.length} assets to your cloud board.`);
       setSelectedPlayers([]);
    } catch (err) {
       console.error(err);
    } finally {
       setIsBulkSaving(false);
    }
  };

  const parseNILValue = (val?: string): number => {
    if (!val || val === 'TBD' || val.toLowerCase() === 'unknown') return 0;
    let numericStr = val.replace(/[$,+]/g, '').toLowerCase();
    let multiplier = 1;
    if (numericStr.includes('k')) { multiplier = 1000; numericStr = numericStr.replace('k', ''); } else if (numericStr.includes('m')) { multiplier = 1000000; numericStr = numericStr.replace('m', ''); }
    return (parseFloat(numericStr) || 0) * multiplier;
  };

  const filteredPlayers = useMemo(() => {
    let result = [...players];
    if (activePos !== 'All Positions') result = result.filter(p => p.position.toUpperCase() === activePos.toUpperCase());
    if (minNILWorth > 0) result = result.filter(p => parseNILValue(p.nilValue) >= minNILWorth);
    if (commitmentStatus !== 'All') {
      result = result.filter(p => {
        const isUndecided = (p.predictedDestination || '').toLowerCase().includes('undecided') || (p.predictedDestination || '').toLowerCase().includes('unknown') || p.predictedDestination === 'TBD';
        return commitmentStatus === 'Available' ? isUndecided : !isUndecided;
      });
    }
    if (targetSchool) result = result.filter(p => (p.predictedDestination || '').toLowerCase().includes(targetSchool.toLowerCase()));
    if (searchQuery.trim()) result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    result.sort((a, b) => {
      let comparison = sortBy === 'rank' ? (a.rank || 0) - (b.rank || 0) : parseNILValue(a.nilValue) - parseNILValue(b.nilValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [players, activePos, searchQuery, minNILWorth, commitmentStatus, targetSchool, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE);
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * PLAYERS_PER_PAGE;
    return filteredPlayers.slice(startIndex, startIndex + PLAYERS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const timeUntilSync = lastSync ? Math.max(0, syncInterval - (Date.now() - lastSync)) : 0;
  const hoursRemaining = Math.floor(timeUntilSync / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeUntilSync % (1000 * 60 * 60)) / (1000 * 60));

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto py-12 md:py-20 animate-in fade-in duration-700 px-4">
        <div className="bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-[2.5rem] p-10 md:p-20 flex flex-col items-center text-center">
          <Lock className="w-12 h-12 text-slate-600 mb-6" />
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4 tracking-tight">Consensus Big Board Locked</h2>
          <button onClick={onRequestPro} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all">Go Pro Access</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-700 pb-32 px-2 md:px-0 relative">
      <div className="bg-[#0b1224] border border-slate-800 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-5">
                 <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-2xl"><Trophy className="w-8 h-8 text-blue-400" /></div>
                 <div>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Consensus Matrix</h2>
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-2"><Globe className="w-3.5 h-3.5 text-blue-500 animate-pulse" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grounding: SYNC READY</span></div>
                 </div>
              </div>
           </div>
           <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
              <button onClick={handleGrounding} disabled={loading} className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl md:rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <Play className="w-5 h-5 fill-current" />} Execute Search
              </button>
           </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2"><ListFilter className="w-3 h-3" /> Unit Filter</label>
           <select value={activePos} onChange={(e) => setActivePos(e.target.value)} className="w-full bg-[#0b1224] border border-slate-800 rounded-xl py-3.5 px-6 text-slate-200 font-bold appearance-none outline-none">{POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}</select></div>
           <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2"><DollarSign className="w-3 h-3" /> NIL Worth</label>
           <select value={minNILWorth} onChange={(e) => setMinNILWorth(Number(e.target.value))} className="w-full bg-[#0b1224] border border-slate-800 rounded-xl py-3.5 px-6 text-slate-200 font-bold appearance-none outline-none">{VALUATIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select></div>
           <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2"><Target className="w-3 h-3" /> Status</label>
           <select value={commitmentStatus} onChange={(e) => setCommitmentStatus(e.target.value)} className="w-full bg-[#0b1224] border border-slate-800 rounded-xl py-3.5 px-6 text-slate-200 font-bold appearance-none outline-none">{COMMITMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
           <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2"><School className="w-3 h-3" /> Target School</label>
           <input type="text" value={targetSchool} onChange={(e) => setTargetSchool(e.target.value)} placeholder="Filter by school..." className="w-full bg-[#0b1224] border border-slate-800 rounded-xl py-3.5 px-6 text-slate-200 font-bold outline-none focus:border-blue-500/50 transition-all" /></div>
        </div>
        <div className="relative flex-1 w-full"><Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by prospect name..." className="w-full bg-[#0b1224] border border-slate-800 rounded-xl md:rounded-2xl py-4 pl-14 pr-6 text-white placeholder-slate-700 focus:outline-none font-bold shadow-xl" /></div>
      </div>

      {!hasRunInitialSearch && !loading ? (
        <div className="py-40 flex flex-col items-center justify-center text-center gap-8 border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-900/10 px-6">
           <Trophy className="w-12 h-12 text-slate-700" />
           <button onClick={handleGrounding} className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all">Initialize Matrix</button>
        </div>
      ) : loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-8 animate-pulse text-center"><Loader2 className="w-16 h-16 animate-spin text-blue-500/20" /><h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Initializing Grounding...</h4></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
           {paginatedPlayers.map((player, idx) => (
             <div key={player.id} className="relative group pt-4">
                <div className="absolute -top-2 -left-2 z-20 w-12 h-12 bg-slate-900 border-2 border-blue-500 rounded-xl shadow-2xl flex items-center justify-center font-black text-white">{player.rank || ((currentPage - 1) * PLAYERS_PER_PAGE + idx + 1)}</div>
                {/* Passed onVoiceDeepDive to PlayerCard */}
                <PlayerCard player={player} isPro={isPro} onRequestPro={onRequestPro} onSelect={togglePlayerSelection} isSelected={selectedPlayers.some(sp => sp.id === player.id)} onVoiceDeepDive={onVoiceDeepDive} />
             </div>
           ))}
        </div>
      )}

      {selectedPlayers.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-6 animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-[#0f172a]/90 border-2 border-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.3)] rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-2xl">
              <div className="flex items-center gap-6">
                 <div className="flex -space-x-3 overflow-hidden">{selectedPlayers.slice(0, 5).map(p => (<div key={p.id} className="w-12 h-12 rounded-full bg-blue-600 border-4 border-[#0f172a] flex items-center justify-center text-xs font-black text-white shadow-xl flex-shrink-0">{p.name.charAt(0)}</div>))}</div>
                 <span className="text-lg font-black text-white uppercase tracking-tighter">{selectedPlayers.length} Assets Tagged</span>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => setSelectedPlayers([])} className="px-6 py-4 rounded-2xl text-slate-400 hover:text-red-400 transition-colors font-black text-[10px] uppercase tracking-widest border border-slate-800">Clear</button>
                 <button onClick={handleBulkSave} disabled={isBulkSaving} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 group">
                    {isBulkSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <BookmarkPlus className="w-5 h-5" />} Bulk Sync to Board
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
