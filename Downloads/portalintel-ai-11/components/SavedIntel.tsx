
import React, { useState, useEffect, useMemo } from 'react';
import { Player, SavedPrompt, SavedComparison, SavedProgram, SavedTrend, GroundingSource, ScoutUser } from '../types';
import { PlayerCard } from './PlayerCard';
import { EmailIntelModal } from './EmailIntelModal';
import { scanTransferPortal, scanHSRecruiting, getPlayerDeepDive } from '../services/gemini';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { 
  Bookmark, FileText, Trash2, User, ArrowRight, BrainCircuit, 
  X, FileDown, Clock, Search, ListFilter, School, 
  TrendingUp, Info, ShieldCheck, FileSpreadsheet, Mail, Database, History, 
  Lock, Zap, Fingerprint, Save, Target, Loader2, Sparkles, Trophy, Brain, AlertTriangle, PlusCircle, Check, Building2, FileStack
} from 'lucide-react';

interface SavedIntelProps {
  isPro?: boolean; 
  onRequestPro?: () => boolean;
  isPreview?: boolean;
  onShowPaywall?: () => void;
  onShowAuth?: () => void;
  onRescan?: (query: string) => void;
  mode?: 'College' | 'HS';
  // Added onVoiceDeepDive to props interface
  onVoiceDeepDive?: (context: string) => void;
}

// Destructured onVoiceDeepDive from props
export const SavedIntel: React.FC<SavedIntelProps> = ({ 
  isPro, onRequestPro, isPreview, onShowPaywall, onShowAuth, onRescan, mode = 'College', onVoiceDeepDive
}) => {
  const [savedPlayers, setSavedPlayers] = useState<Player[]>([]);
  const [savedReports, setSavedReports] = useState<SavedComparison[]>([]);
  const [promptHistory, setPromptHistory] = useState<SavedPrompt[]>([]);
  
  const [activeSubTab, setActiveSubTab] = useState<'prospects' | 'reports' | 'history'>('prospects');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const hasConfig = isSupabaseConfigured();
  const currentUser = JSON.parse(localStorage.getItem('portal_scout_user') || 'null') as ScoutUser | null;

  useEffect(() => {
    if (!isPreview && isPro && hasConfig && currentUser) {
      fetchCloudData();
    }
  }, [isPreview, isPro, hasConfig, mode, activeSubTab]);

  const fetchCloudData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      if (activeSubTab === 'prospects') {
        const { data, error } = await supabase
          .from('portal_saved_players')
          .select('player_data')
          .eq('user_id', currentUser.id)
          .eq('recruiting_type', mode);
        
        if (error) throw error;
        setSavedPlayers(data.map(d => d.player_data));
      }
    } catch (err) {
      console.error("Cloud Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!savedPlayers.length) return;
    const headers = ["Name", "Position", "Stars", mode === 'HS' ? "High School" : "Previous School", "Destination", "NIL Worth", "Summary"];
    const rows = savedPlayers.map(p => [
      `"${p.name}"`, p.position, p.stars, mode === 'HS' ? `"${p.highSchool}"` : `"${p.previousSchool}"`, `"${p.predictedDestination}"`, `"${p.nilValue || 'TBD'}"`, `"${p.summary}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ScoutBoard_${mode}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredPlayers = savedPlayers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!isPro || isPreview) {
    return (
      <div className="max-w-4xl mx-auto py-20 animate-in fade-in duration-700">
        <div className="bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-[4rem] p-16 flex flex-col items-center text-center">
          <Lock className="w-16 h-16 text-slate-700 mb-6" />
          <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">{mode} Scout Board Locked</h2>
          <p className="text-slate-500 mb-10 font-medium">Verify your Scout Identity to access cloud-synced player boards.</p>
          <button onClick={onShowPaywall} className="bg-amber-500 text-slate-950 px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl">Upgrade to Access</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      {!hasConfig && (
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center gap-4 text-amber-500">
           <AlertTriangle className="w-8 h-8 flex-shrink-0" />
           <div>
              <p className="text-sm font-black uppercase tracking-widest">Cloud Sync Offline</p>
              <p className="text-xs font-medium opacity-80 uppercase">Set VITE_SUPABASE environment variables to enable global scout board persistence.</p>
           </div>
        </div>
      )}

      <EmailIntelModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} players={filteredPlayers} reportTitle={`${mode} Scout Board Update`} />

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl ${mode === 'HS' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
              <Bookmark className="text-white w-8 h-8" />
            </div>
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">{mode} Scout Board</h2>
              <div className="flex items-center gap-2 mt-2">
                 <Database className="w-4 h-4 text-slate-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cloud Personnel Database</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="flex items-center gap-3 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /> CSV</button>
            <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-3 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl border border-slate-800 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"><Mail className="w-4 h-4 text-blue-400" /> Dispatch</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['prospects', 'reports', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`flex items-center justify-between px-8 py-6 rounded-2xl text-sm font-black transition-all border ${
                  activeSubTab === tab ? 'bg-slate-900 border-white shadow-xl' : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="uppercase tracking-widest">{tab}</span>
                <span className="bg-slate-800 px-2 py-1 rounded-lg text-[10px]">{tab === 'prospects' ? savedPlayers.length : tab === 'reports' ? savedReports.length : promptHistory.length}</span>
              </button>
            ))}
        </div>
      </div>

      <div className="pt-12 border-t border-slate-800/50 space-y-10">
        <div className="relative max-w-2xl">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
           <input 
             type="text"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder={`Search saved ${activeSubTab}...`}
             className="w-full bg-[#0d1526] border border-slate-800 rounded-[1.5rem] px-14 py-5 text-slate-100 placeholder-slate-600 focus:outline-none font-bold shadow-2xl focus:border-blue-500/50"
           />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-6">
             <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
             <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse">Syncing with cloud vault...</p>
          </div>
        ) : activeSubTab === 'prospects' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlayers.map((player, idx) => (
              /* Passed onVoiceDeepDive to PlayerCard */
              <PlayerCard key={player.id} player={player} isPro={isPro} onRequestPro={onRequestPro} onVoiceDeepDive={onVoiceDeepDive} />
            ))}
            {filteredPlayers.length === 0 && (
              <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
                <p className="text-slate-700 font-bold uppercase tracking-widest">No matching prospects found in your cloud board.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
             <History className="w-12 h-12 text-slate-800 mx-auto mb-4" />
             <p className="text-slate-700 font-bold uppercase tracking-widest italic">Intelligence archive loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};
