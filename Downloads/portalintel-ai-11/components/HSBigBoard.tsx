
import React, { useState, useEffect, useMemo } from 'react';
import { Player, GroundingSource } from '../types';
import { getHSConsensusBigBoard } from '../services/gemini';
import { PlayerCard } from './PlayerCard';
// Fixed missing icon imports from lucide-react
import { Trophy, Globe, Loader2, Sparkles, Clock, Target, Play, ShieldCheck, ListFilter, GraduationCap, MapPin, ChevronDown, Lock, Zap, Crown, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface HSBigBoardProps {
  isPro?: boolean;
  onRequestPro?: () => boolean;
  // Added onVoiceDeepDive to props interface
  onVoiceDeepDive?: (context: string) => void;
}

const CLASSES = ['2026', '2027', '2028', '2029', '2030', '2031', '2032'];
const STATES = ['All', 'TX', 'FL', 'CA', 'GA', 'OH', 'LA', 'AL', 'NC', 'PA', 'NJ', 'AZ'];
const POSITIONS = ['All Positions', 'QB', 'RB', 'WR', 'OT', 'IOL', 'EDGE', 'DL', 'LB', 'DB'];

// Destructured onVoiceDeepDive from props
export const HSBigBoard: React.FC<HSBigBoardProps> = ({ isPro, onRequestPro, onVoiceDeepDive }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  
  // HS Context Filters
  const [classYear, setClassYear] = useState('2026');
  const [state, setState] = useState('All');
  const [position, setPosition] = useState('All Positions');
  const [targetSchool, setTargetSchool] = useState('');

  const handleGrounding = async () => {
    if (!isPro && onRequestPro) {
      onRequestPro();
      return;
    }
    setLoading(true);
    setPlayers([]);
    try {
      const data = await getHSConsensusBigBoard({ classYear, state, position });
      setPlayers(data.players);
      setSources(data.sources);
      setHasRun(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    let result = [...players];
    if (targetSchool) {
      result = result.filter(p => (p.predictedDestination || '').toLowerCase().includes(targetSchool.toLowerCase()));
    }
    return result;
  }, [players, targetSchool]);

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto py-20 animate-in fade-in duration-700 px-4">
        <div className="bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-[4rem] p-20 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-8 relative">
            <Lock className="w-10 h-10 text-slate-600" />
            <Crown className="absolute -top-2 -right-2 w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">HS Big Boards Locked</h2>
          <p className="text-slate-400 text-lg max-w-md mb-10 leading-relaxed font-medium">
            National and State consensus rankings for HS classes 2026-2032 are restricted to **Pro Members**.
          </p>
          <button 
            onClick={onRequestPro}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex items-center gap-3"
          >
            <Zap className="w-5 h-5 fill-current" />
            Unlock Pro Recruiting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Top Console */}
      <div className="bg-[#0b1224] border border-slate-800 p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
           <div className="space-y-4">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-emerald-600/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                    <Trophy className="w-10 h-10 text-emerald-400" />
                 </div>
                 <div>
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">HS Consensus Matrix</h2>
                    <div className="flex items-center gap-3 mt-2">
                       <GraduationCap className="w-4 h-4 text-emerald-500" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cycle Grounding: CLASS OF {classYear}</span>
                    </div>
                 </div>
              </div>
              <p className="text-slate-400 max-w-2xl font-medium leading-relaxed text-lg">
                Aggregate the <span className="text-white font-bold">Top 50 Prospects</span> for your target demographic. Grounded by real-time scouting feeds.
              </p>
           </div>

           <div className="flex flex-col items-center md:items-end gap-6 w-full md:w-auto">
              <button 
                onClick={handleGrounding}
                disabled={loading}
                className={`w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 ring-4 ${loading ? 'ring-emerald-500/10' : 'ring-emerald-500/30'}`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                Sync National HS Board
              </button>
           </div>
        </div>
      </div>

      {/* Control Matrix */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[3rem] shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
               <Clock className="w-3 h-3 text-emerald-500" /> Graduation Year
             </label>
             <div className="relative group">
               <select value={classYear} onChange={e => setClassYear(e.target.value)} className="w-full bg-[#0d1526] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none focus:outline-none focus:border-emerald-500/50">
                 {CLASSES.map(c => <option key={c} value={c}>Class of {c}</option>)}
               </select>
               <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none group-hover:scale-110 transition-transform" />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
               <MapPin className="w-3 h-3 text-emerald-500" /> State/Territory
             </label>
             <div className="relative group">
               <select value={state} onChange={e => setState(e.target.value)} className="w-full bg-[#0d1526] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none focus:outline-none focus:border-emerald-500/50">
                 {STATES.map(s => <option key={s} value={s}>{s === 'All' ? 'National Big Board' : `State: ${s}`}</option>)}
               </select>
               <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none group-hover:scale-110 transition-transform" />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
               <ListFilter className="w-3 h-3 text-emerald-500" /> Unit Specialization
             </label>
             <div className="relative group">
               <select value={position} onChange={e => setPosition(e.target.value)} className="w-full bg-[#0d1526] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none focus:outline-none focus:border-emerald-500/50">
                 {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
               <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none group-hover:scale-110 transition-transform" />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
               <GraduationCap className="w-3 h-3 text-emerald-500" /> Target School
             </label>
             <div className="relative group">
               <input 
                 type="text" 
                 value={targetSchool} 
                 onChange={e => setTargetSchool(e.target.value)} 
                 placeholder="Filter by school..." 
                 className="w-full bg-[#0d1526] border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50" 
               />
             </div>
          </div>
        </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-8 animate-pulse">
           <div className="relative">
              <Loader2 className="w-24 h-24 text-emerald-500/20 animate-spin" />
              <Sparkles className="w-10 h-10 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
           </div>
           <div className="text-center space-y-4">
              <h4 className="text-2xl font-black text-white tracking-tighter uppercase">Initializing Class of {classYear} Grounding...</h4>
              <div className="w-64 bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-emerald-500 animate-progress-indeterminate w-full origin-left"></div>
              </div>
           </div>
        </div>
      ) : hasRun ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
             {filteredPlayers.map((player, idx) => (
               <div key={player.id} className="relative group pt-4">
                  <div className="absolute -top-2 -left-2 z-20 w-12 h-12 bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                     <span className="text-xl font-black text-white tracking-tighter">{player.rank || idx + 1}</span>
                  </div>
                  {/* Passed onVoiceDeepDive to PlayerCard */}
                  <PlayerCard player={player} isPro={isPro} onRequestPro={onRequestPro} onVoiceDeepDive={onVoiceDeepDive} />
               </div>
             ))}
          </div>

          {players.length === 0 && (
            <div className="py-32 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
               <Info className="w-10 h-10 text-slate-700 mx-auto mb-4" />
               <p className="text-slate-500 font-bold uppercase tracking-widest">No rankings found for this specific demographic.</p>
            </div>
          )}
        </>
      ) : (
        <div className="py-40 flex flex-col items-center justify-center text-center gap-10 border-2 border-dashed border-slate-800 rounded-[4rem] bg-slate-900/10">
           <div className="w-24 h-24 rounded-[2rem] border-4 border-slate-800 border-t-emerald-500 animate-[spin_12s_linear_infinite] flex items-center justify-center">
              <Target className="w-10 h-10 text-slate-700" />
           </div>
           <div className="space-y-4 max-w-sm">
              <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Big Board Ready</h3>
              <p className="text-slate-500 font-medium">Select your class and territory above, then click <span className="text-emerald-400 font-bold">Sync</span> to view national rankings.</p>
           </div>
        </div>
      )}

      {sources.length > 0 && (
         <div className="mt-12 pt-10 border-t border-slate-800 flex flex-wrap gap-3">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] w-full mb-2">Grounding Assets</span>
            {sources.map((s, i) => (
               <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-emerald-400 transition-all flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  {s.title}
               </a>
            ))}
         </div>
      )}
    </div>
  );
};
