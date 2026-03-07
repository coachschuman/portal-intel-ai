
import React, { useState, useEffect } from 'react';
import { ProgramBlueprint, ScoutUser } from '../types';
import { X, Shield, ShieldCheck, Target, Zap, Info, Layers, Users, BookOpen, Crown, CheckCircle2, Building2, BrainCircuit } from 'lucide-react';

interface ProgramBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blueprint: ProgramBlueprint) => void;
  initialBlueprint?: ProgramBlueprint;
}

const OFFENSIVE_SCHEMES = ["Air Raid", "Pro-Style", "Spread", "RPO-Heavy", "Triple Option", "West Coast", "Pistol"];
const DEFENSIVE_SCHEMES = ["3-4 Base", "4-3 Base", "4-2-5 Nickel", "3-3-5 Stack", "Multiple", "Odd Front"];
const PRIORITIES = ["Character First", "NIL Aggressive", "Academic Priority", "NFL Potential", "Immediate Starter", "Developmental", "Local Only"];
const NEEDS = ["QB", "RB", "WR", "TE", "OT", "IOL", "EDGE", "DL", "LB", "CB", "S", "K/P", "LS"];

export const ProgramBlueprintModal: React.FC<ProgramBlueprintModalProps> = ({ isOpen, onClose, onSave, initialBlueprint }) => {
  const [blueprint, setBlueprint] = useState<ProgramBlueprint>(initialBlueprint || {
    schoolName: '',
    offensiveScheme: 'Spread',
    defensiveScheme: '4-2-5 Nickel',
    recruitingPriorities: [],
    rosterNeeds: [],
    nilBudgetTier: 'Medium',
    culturePillars: []
  });

  const [pillarInput, setPillarInput] = useState('');

  if (!isOpen) return null;

  const toggleSelection = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSave = () => {
    if (!blueprint.schoolName.trim()) {
      alert("Please specify your program name.");
      return;
    }
    onSave(blueprint);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-[#0b1224] w-full max-w-4xl max-h-[92vh] rounded-[3.5rem] border border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8 md:p-12 border-b border-slate-800 flex justify-between items-center bg-[#0b1224] z-10">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                 <Building2 className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Program Blueprint</h2>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Configure Bespoke School DNA</p>
              </div>
           </div>
           <button onClick={onClose} className="p-4 bg-slate-900 rounded-2xl text-slate-500 hover:text-white border border-slate-800 transition-all active:scale-90">
              <X className="w-8 h-8" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">Program Signature</label>
                 <input 
                   type="text" 
                   value={blueprint.schoolName}
                   onChange={e => setBlueprint({...blueprint, schoolName: e.target.value})}
                   placeholder="e.g. University of Texas, Michigan, etc."
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold text-lg focus:outline-none focus:border-blue-500/50 shadow-inner"
                 />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">NIL War-Chest Tier</label>
                 <div className="grid grid-cols-4 gap-2">
                    {(['Low', 'Medium', 'High', 'Elite'] as const).map(tier => (
                      <button
                        key={tier}
                        onClick={() => setBlueprint({...blueprint, nilBudgetTier: tier})}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          blueprint.nilBudgetTier === tier ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Offensive DNA
                 </label>
                 <select 
                   value={blueprint.offensiveScheme}
                   onChange={e => setBlueprint({...blueprint, offensiveScheme: e.target.value})}
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none focus:outline-none"
                 >
                    {OFFENSIVE_SCHEMES.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Defensive DNA
                 </label>
                 <select 
                   value={blueprint.defensiveScheme}
                   onChange={e => setBlueprint({...blueprint, defensiveScheme: e.target.value})}
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none focus:outline-none"
                 >
                    {DEFENSIVE_SCHEMES.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
           </div>

           <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Recruiting Cultural Priorities</label>
              <div className="flex flex-wrap gap-3">
                 {PRIORITIES.map(p => (
                   <button
                     key={p}
                     onClick={() => toggleSelection(blueprint.recruitingPriorities, p, (val) => setBlueprint({...blueprint, recruitingPriorities: val}))}
                     className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                       blueprint.recruitingPriorities.includes(p) ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-600'
                     }`}
                   >
                     {p}
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-4">Current Roster Voids (Top Priority)</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                 {NEEDS.map(n => (
                   <button
                     key={n}
                     onClick={() => toggleSelection(blueprint.rosterNeeds, n, (val) => setBlueprint({...blueprint, rosterNeeds: val}))}
                     className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                       blueprint.rosterNeeds.includes(n) ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-700'
                     }`}
                   >
                     {n}
                   </button>
                 ))}
              </div>
           </div>

           <div className="bg-blue-600/5 border border-blue-500/10 p-8 rounded-[2.5rem] flex items-start gap-6 shadow-inner">
              <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                 <BrainCircuit className="w-8 h-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                 <h4 className="text-white font-black uppercase tracking-tight italic">Neural Integration Active</h4>
                 <p className="text-slate-400 text-sm leading-relaxed font-medium">
                   Gemini 3 Pro will use this Program Blueprint to weigh all transfer entries. Your "Program Alignment Score" will reflect how well prospects suit these specific scheme and roster requirements.
                 </p>
              </div>
           </div>
        </div>

        <div className="p-10 border-t border-slate-800 bg-slate-950/50 flex gap-4">
           <button onClick={onClose} className="flex-1 py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-500 hover:bg-slate-900 transition-all border border-slate-800">Discard Changes</button>
           <button onClick={handleSave} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-3">
              <ShieldCheck className="w-5 h-5" /> Initialize Strategic DNA
           </button>
        </div>
      </div>
    </div>
  );
};
