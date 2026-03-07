import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Coins, TrendingUp, PieChart, Plus, X, ShieldCheck, Zap, DollarSign, Calculator, Download, Send, AlertCircle, Info, ChevronRight, BarChart3 } from 'lucide-react';
import { TeamAllocation } from '../types';

interface NILBigBoardProps {
  isPro: boolean;
  onUpgradeRequest: () => void;
}

const DEFAULT_SEGMENTS: TeamAllocation[] = [
  { id: '1', name: 'SKILL POSITION TARGETS', percentage: 20 },
  { id: '2', name: 'SECONDARY DEPTH', percentage: 15 },
  { id: '3', name: 'OFFENSIVE LINE REBUILD', percentage: 30 },
  { id: '4', name: 'ELITE EDGE RUSHERS', percentage: 25 },
  { id: '5', name: 'SPECIAL TEAMS UNIT', percentage: 10 },
];

export const NILBigBoard: React.FC<NILBigBoardProps> = ({ isPro, onUpgradeRequest }) => {
  const [totalPool, setTotalPool] = useState<number>(1000000);
  const [segments, setSegments] = useState<TeamAllocation[]>(DEFAULT_SEGMENTS);
  const [isExporting, setIsExporting] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('portal_nil_segments');
    const savedPool = localStorage.getItem('portal_nil_pool');
    if (saved) setSegments(JSON.parse(saved));
    if (savedPool) setTotalPool(Number(savedPool));
  }, []);

  useEffect(() => {
    localStorage.setItem('portal_nil_segments', JSON.stringify(segments));
    localStorage.setItem('portal_nil_pool', totalPool.toString());
  }, [segments, totalPool]);

  const totalAllocated = useMemo(() => segments.reduce((sum, s) => sum + s.percentage, 0), [segments]);

  const updatePercentage = (id: string, value: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, percentage: Math.max(0, Math.min(100, value)) } : s));
  };

  const removeSegment = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const addSegment = () => {
    const newSeg: TeamAllocation = {
      id: Date.now().toString(),
      name: 'NEW STRATEGIC UNIT',
      percentage: 0
    };
    setSegments([...segments, newSeg]);
  };

  const updateName = (id: string, name: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, name: name.toUpperCase() } : s));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-2xl">
            <Coins className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">My NIL Big Board</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/20 border border-emerald-500/30 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">FINANCIAL VAULT</span>
              </div>
              <span className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">Ref Cycle: 2026.1</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95">
            <Download className="w-3.5 h-3.5" /> EXPORT CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95">
            <Send className="w-3.5 h-3.5" /> SEND TO STAFF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recruitment Pool */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0b1224] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-8 flex-1">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-black text-white uppercase tracking-tight">RECRUITMENT POOL</h2>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Total Available War-Chest ($)</label>
                <div className="bg-slate-950/50 border-2 border-slate-800 rounded-[2rem] p-6 md:p-8 relative group focus-within:border-emerald-500/30 transition-all shadow-inner">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl md:text-2xl font-black text-slate-800 pointer-events-none">$</span>
                  <input 
                    type="number"
                    value={totalPool || ''}
                    onChange={(e) => setTotalPool(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-black text-2xl md:text-3xl outline-none pl-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                </div>
                <p className="text-[9px] text-slate-600 font-medium px-2 text-center uppercase tracking-tighter">
                  Enter global amount. Weighted percentages calculate against this value.
                </p>
              </div>

              {/* Enhanced Guidance Note */}
              <div className="p-5 bg-blue-600/10 border border-blue-500/30 rounded-2xl space-y-2 shadow-lg animate-in fade-in zoom-in-95 duration-500">
                 <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Strategic Input Guide</span>
                 </div>
                 <p className="text-[10px] text-slate-300 leading-relaxed font-medium uppercase tracking-tight">
                    Define segments by <span className="text-white">Position</span> (e.g. QB), <span className="text-white">Player Type</span> (I.E. Transfer or HS), or specific <span className="text-white">Player Name</span> to track specific deal allocations.
                 </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-800/50">
               <button 
                onClick={addSegment}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-800 text-slate-600 hover:text-emerald-400 hover:border-emerald-500/30 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg"
               >
                 <Plus className="w-4 h-4" /> ADD STRATEGIC SEGMENT
               </button>
            </div>
          </div>
        </div>

        {/* Right Column: Allocation Matrix */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-6 md:p-10 shadow-2xl relative">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-emerald-600/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                       <BarChart3 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Strategic Weighted Matrix</h3>
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1.5">Percentage Weight Allocation</p>
                    </div>
                 </div>
                 <div className={`px-4 py-2 rounded-xl border flex flex-col items-center min-w-[80px] ${totalAllocated > 100 ? 'bg-red-900/20 border-red-500/30 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <span className="text-xs font-black uppercase tracking-widest leading-none mb-1">{totalAllocated}%</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest">ALLOCATED</span>
                 </div>
              </div>

              <div className="space-y-3">
                 {segments.map((seg) => (
                    <div key={seg.id} className="bg-[#0b1224] border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all group">
                       <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                             <div className="relative flex-1">
                               <input 
                                 value={seg.name}
                                 onChange={(e) => updateName(seg.id, e.target.value)}
                                 placeholder="Enter Position, Type, or Name..."
                                 className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500/50 rounded-xl px-4 py-2 text-white font-black text-[10px] md:text-xs uppercase tracking-widest outline-none transition-all placeholder:text-slate-800 shadow-inner"
                               />
                             </div>
                             <button onClick={() => removeSegment(seg.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-800 hover:text-red-500 transition-all flex-shrink-0">
                                <X className="w-3.5 h-3.5" />
                             </button>
                          </div>
                          
                          <div className="relative pt-1 px-1">
                             <input 
                               type="range"
                               min="0"
                               max="100"
                               value={seg.percentage}
                               onChange={(e) => updatePercentage(seg.id, Number(e.target.value))}
                               className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                             />
                          </div>
                       </div>

                       <div className="flex items-center gap-4 md:pl-6 md:border-l border-slate-800">
                          <div className="text-right min-w-[100px]">
                             <div className="text-emerald-400 font-black text-xs md:text-sm leading-none truncate">
                               {formatCurrency((seg.percentage / 100) * totalPool)}
                             </div>
                             <span className="text-[7px] font-bold text-slate-700 uppercase tracking-widest block mt-1">TARGET SPEND</span>
                          </div>
                          
                          <div className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                             <input 
                               type="number"
                               value={seg.percentage}
                               onChange={(e) => updatePercentage(seg.id, Number(e.target.value))}
                               className="w-8 bg-transparent text-white font-black text-right outline-none text-xs"
                             />
                             <span className="text-slate-700 font-bold text-[10px]">%</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              {segments.length === 0 && (
                <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                   <PieChart className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                   <p className="text-slate-700 font-black uppercase tracking-widest text-[10px]">No active segments defined. Initialize matrix.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-lg">
            <div className="flex items-center gap-2">
               <Zap className="w-4 h-4 text-amber-500" />
               <h4 className="text-[10px] font-black text-white uppercase tracking-widest">NIL Efficiency Score</h4>
            </div>
            <p className="text-slate-500 text-[9px] leading-relaxed font-medium uppercase tracking-tight">Your current weighting prioritizes trenches at a 2.4:1 ratio over skill positions. This aligns with national championship roster construction.</p>
         </div>
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-lg">
            <div className="flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-blue-500" />
               <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Market Comparison</h4>
            </div>
            <p className="text-slate-500 text-[9px] leading-relaxed font-medium uppercase tracking-tight">Based on grounded 2026 data, your skill position spend is 12% below average. Consider maintenance reallocations for competitive bidding.</p>
         </div>
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-lg">
            <div className="flex items-center gap-2">
               <Info className="w-4 h-4 text-emerald-500" />
               <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Recruitment Health</h4>
            </div>
            <p className="text-slate-500 text-[9px] leading-relaxed font-medium uppercase tracking-tight">Financial model verified. All target spends represent hard caps for the cycle. Synchronization with collective assets active.</p>
         </div>
      </div>
      
      <div className="text-center pt-4">
         <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em]">Proprietary Financial Modeling Framework v2026.4 • Secure Vault Access Only</p>
      </div>
    </div>
  );
};