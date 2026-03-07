
import React, { useState, useEffect, useMemo } from 'react';
import { Player, GroundingSource, NILDeal, ScoutUser } from '../types';
// Add 'Coins' to the lucide-react imports
import { Star, ArrowRight, Loader2, Link as LinkIcon, Activity, X, BrainCircuit, BarChart3, RefreshCw, Bookmark, BookmarkCheck, Wallet, Maximize2, User, Zap, Info, Handshake, ShieldCheck, DollarSign, Sparkles, Crown, ChevronDown, ChevronUp, Play, Video, Brain, CheckCircle2, TrendingUp, Building2, Target, FileText, ImageIcon, ExternalLink, Dumbbell, ZapIcon, ScanText, Volume2, Mic2, GraduationCap, MapPin, Coins } from 'lucide-react';
import { getPlayerDeepDive, generateScoutsTake, analyzeProgramFit } from '../services/gemini';
import { IntelligenceReport } from './IntelligenceReport';
import { ScoutingAudioPlayer } from './ScoutingAudioPlayer';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface PlayerCardProps {
  player: Player;
  onSelect?: (player: Player) => void;
  isSelected?: boolean;
  isPro?: boolean;
  onRequestPro?: () => boolean;
  viewMode?: 'grid' | 'list';
  onVoiceDeepDive?: (context: string) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, onSelect, isSelected, isPro, onRequestPro, viewMode = 'grid', onVoiceDeepDive
}) => {
  const [isSavedToBoard, setIsSavedToBoard] = useState(false);
  const [analysis, setAnalysis] = useState<{text: string, sources: GroundingSource[]} | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInlineDetails, setShowInlineDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  
  const [scoutsTake, setScoutsTake] = useState<string | null>(null);
  const [loadingTake, setLoadingTake] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Program Fit State
  const [fitAudit, setFitAudit] = useState<{ text: string, score: number } | null>(null);
  const [loadingFit, setLoadingFit] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('portal_scout_user') || 'null') as ScoutUser | null;
  const hasConfig = isSupabaseConfigured();

  useEffect(() => {
    checkSavedStatus();
  }, [player.id, currentUser]);

  const checkSavedStatus = async () => {
    if (!currentUser || !hasConfig) {
      const storageKey = player.recruitingType === 'HS' ? 'portal_saved_players_hs' : 'portal_saved_players';
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setIsSavedToBoard(saved.some((p: Player) => p.id === player.id));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portal_saved_players')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('player_id', player.id)
        .single();
      
      setIsSavedToBoard(!!data);
    } catch (err) {
      setIsSavedToBoard(false);
    }
  };

  const handleFitAudit = async () => {
    if (!currentUser?.blueprint) return;
    setLoadingFit(true);
    try {
      const result = await analyzeProgramFit(player, currentUser.blueprint);
      setFitAudit(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFit(false);
    }
  };

  const parseNILValue = (val?: string): number => {
    if (!val || val === 'TBD') return 0;
    const numeric = val.replace(/[$,+]/g, '').toLowerCase();
    if (numeric.endsWith('k')) return parseFloat(numeric) * 1000;
    if (numeric.endsWith('m')) return parseFloat(numeric) * 1000000;
    return parseFloat(numeric) || 0;
  };

  const piGrade = useMemo(() => {
    let grade = (player.stars * 10) + ((player.impactScore || 50) / 2);
    const nilVal = parseNILValue(player.nilValue);
    if (nilVal >= 1000000) grade += 10;
    else if (nilVal >= 500000) grade += 5;
    return Math.min(100, Math.round(grade));
  }, [player]);

  const isSuperstar = piGrade >= 90;

  const handlePlayPronunciation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      const { generateSpeech } = await import('../services/gemini');
      const audioData = await generateSpeech(`Player name: ${player.name}`);
      if (audioData) {
        const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
        audio.onended = () => setIsPlayingAudio(false);
        await audio.play();
      } else {
        setIsPlayingAudio(false);
      }
    } catch (err) {
      console.error("Failed to play pronunciation:", err);
      setIsPlayingAudio(false);
    }
  };

  const handleToggleSaveBoard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestPro && !onRequestPro()) return;
    
    if (!currentUser || !hasConfig) {
      const storageKey = player.recruitingType === 'HS' ? 'portal_saved_players_hs' : 'portal_saved_players';
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      let updated = isSavedToBoard 
        ? saved.filter((p: Player) => p.id !== player.id) 
        : [...saved, player];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setIsSavedToBoard(!isSavedToBoard);
      return;
    }

    setIsSaving(true);
    try {
      if (isSavedToBoard) {
        await supabase
          .from('portal_saved_players')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('player_id', player.id);
        setIsSavedToBoard(false);
      } else {
        await supabase
          .from('portal_saved_players')
          .insert([{
            user_id: currentUser.id,
            player_id: player.id,
            recruiting_type: player.recruitingType || 'College',
            player_data: player
          }]);
        setIsSavedToBoard(true);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFullAnalysis = async () => {
    setLoadingAnalysis(true);
    const result = await getPlayerDeepDive(player);
    setAnalysis(result);
    setLoadingAnalysis(false);
    
    if (currentUser?.blueprint && !fitAudit) {
      handleFitAudit();
    }
  };

  const handleScoutAI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestPro && !onRequestPro()) return;
    setLoadingTake(true);
    try {
      const take = await generateScoutsTake(player);
      setScoutsTake(take);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTake(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;
    
    if (onSelect) {
      onSelect(player);
    } else {
      setShowInlineDetails(!showInlineDetails);
    }
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestPro && !onRequestPro()) return;
    setIsExpanded(true);
    setShowAudio(false);
    if (!analysis) handleFullAnalysis();
  };

  const getGradeColor = (g: number) => {
    if (g >= 90) return 'text-purple-400 border-purple-500/30';
    if (g >= 80) return 'text-blue-400 border-blue-500/30';
    return 'text-slate-400 border-slate-700';
  };

  const renderModal = () => {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-500">
        <div className="bg-[#0b1224] w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-[4rem] border border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col relative" onClick={e => e.stopPropagation()}>
          <div className="p-8 md:p-12 border-b border-slate-800 flex justify-between items-center bg-[#0b1224] z-10">
             <div className="overflow-hidden">
                <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none truncate">{player.name}</h2>
                <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-6">
                   <span className="text-blue-500 text-[11px] md:text-sm font-black uppercase tracking-[0.4em]">{player.position} COMMAND BRIEF</span>
                   <div className={`px-5 py-2 rounded-full border font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-lg ${getGradeColor(piGrade)}`}>
                      {piGrade} PI Rating
                   </div>
                   <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 rounded-full flex items-center gap-2 shadow-lg">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-widest">{player.nilValue || 'TBD'} NIL</span>
                   </div>
                   {fitAudit && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 rounded-full flex items-center gap-2 shadow-lg animate-in zoom-in-95">
                         <Target className="w-4 h-4 text-emerald-400" />
                         <span className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-widest">{fitAudit.score}% Program Fit</span>
                      </div>
                   )}
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => { if (onVoiceDeepDive) onVoiceDeepDive(`Prospect Audit: ${player.name}. Position: ${player.position}. Stars: ${player.stars}. Alignment Score: ${fitAudit?.score || 'Pending'}. Analysis: ${analysis?.text || ''}`); setIsExpanded(false); }}
                  className="hidden md:flex items-center gap-3 px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 group"
                >
                   <Mic2 className="w-5 h-5 group-hover:animate-pulse" />
                   Live Voice Deep Dive
                </button>
                <button onClick={() => setIsExpanded(false)} className="p-6 bg-slate-900 rounded-2xl text-slate-500 hover:text-white border border-slate-800 shadow-xl active:scale-90"><X className="w-10 h-10" /></button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 scrollbar-hide">
             <div className="lg:col-span-4 space-y-10">
                <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                   <div className="flex items-center gap-5">
                      <GraduationCap className="w-8 h-8 text-blue-400" />
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">Vitals & Journey</h3>
                   </div>
                   
                   <div className="space-y-6">
                      <div>
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Origin Program</span>
                         <p className="text-lg font-black text-white uppercase">{player.previousSchool || player.highSchool || 'N/A'}</p>
                      </div>
                      <div>
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Target Destination</span>
                         <p className="text-lg font-black text-emerald-400 uppercase">{player.predictedDestination || 'TBD'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                         <div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Stars</span>
                            <div className="flex gap-1">
                               {Array.from({length: 5}).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < player.stars ? 'text-yellow-500 fill-current' : 'text-slate-800'}`} />)}
                            </div>
                         </div>
                         <div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Class</span>
                            <p className="text-sm font-black text-white uppercase">{player.classYear || '2026'}</p>
                         </div>
                         {player.draftEligibility && (
                           <div>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Draft Eligibility</span>
                              <p className="text-sm font-black text-blue-400 uppercase">{player.draftEligibility}</p>
                           </div>
                         )}
                         {player.draftProjection && (
                           <div>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Draft Projection</span>
                              <p className="text-sm font-black text-purple-400 uppercase">{player.draftProjection}</p>
                           </div>
                         )}
                      </div>
                   </div>
                </div>

                <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-[3rem] p-10 space-y-6 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign className="w-20 h-20 text-emerald-400" /></div>
                   <div className="flex items-center gap-4">
                      {/* Use 'Coins' icon */}
                      <Coins className="w-8 h-8 text-emerald-400" />
                      <h4 className="text-white font-black text-lg uppercase tracking-tight">Market Valuation</h4>
                   </div>
                   <div className="bg-slate-950/50 p-6 rounded-2xl border border-emerald-500/20 shadow-inner">
                      <span className="text-3xl font-black text-emerald-400 italic tracking-tighter">{player.nilValue || 'TBD'}</span>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Estimated Strategic Value</p>
                   </div>
                </div>

                {player.stats && (
                   <div className="bg-blue-600/5 border border-blue-500/10 rounded-[3rem] p-10 space-y-6 shadow-xl">
                      <div className="flex items-center gap-4">
                         <BarChart3 className="w-6 h-6 text-blue-400" />
                         <h4 className="text-white font-black text-lg uppercase tracking-tight">Production Stats</h4>
                      </div>
                      <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 shadow-inner">
                         <p className="text-sm text-slate-300 font-medium leading-relaxed italic">
                            {player.stats}
                         </p>
                      </div>
                   </div>
                )}
                
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] p-10 flex flex-col items-center text-center gap-6 shadow-xl">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                      <Volume2 className="w-8 h-8 text-emerald-400" />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-white font-black text-lg uppercase tracking-tight">AI Audio Briefing</h4>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Synthesized Static Dispatch</p>
                   </div>
                   <button 
                     onClick={() => setShowAudio(!showAudio)} 
                     disabled={!analysis || loadingAnalysis}
                     className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                       showAudio ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                     } disabled:opacity-30`}
                   >
                     {showAudio ? 'Deactivate Briefing' : 'Initialize Audio Relay'}
                   </button>
                   {showAudio && analysis && (
                      <div className="w-full pt-4 animate-in fade-in zoom-in-95">
                         <ScoutingAudioPlayer 
                           text={`Full Scouting Report for ${player.name}. PI Rating ${piGrade}. NIL Worth ${player.nilValue || 'unknown'}. ${analysis.text}`} 
                           label="Asset Intel Briefing" 
                           onClose={() => setShowAudio(false)} 
                         />
                      </div>
                   )}
                </div>
             </div>

             <div className="lg:col-span-8 space-y-10">
                {fitAudit && (
                   <div className="bg-[#0b1224] border border-blue-500/30 rounded-[4rem] p-10 md:p-16 shadow-2xl relative">
                      <div className="flex items-center gap-6 mb-12 pb-12 border-b border-slate-800/50">
                         <div className="w-16 h-16 bg-blue-600/10 rounded-[1.75rem] flex items-center justify-center border border-blue-500/20 shadow-inner">
                           <Target className="w-10 h-10 text-blue-500" />
                         </div>
                         <div>
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight italic">Program Alignment Logic</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Grounded Scheme & ROI Verification</p>
                         </div>
                      </div>
                      <IntelligenceReport text={fitAudit.text} />
                   </div>
                )}

                <div className="bg-[#0f172a] border border-slate-800 rounded-[4rem] p-10 md:p-16 relative shadow-2xl flex flex-col">
                   <div className="flex items-center justify-between mb-12 pb-12 border-b border-slate-800/50">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-[1.75rem] flex items-center justify-center border border-blue-500/20">
                          <BrainCircuit className="w-10 h-10 text-blue-500" />
                        </div>
                        <div>
                           <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Neural Capability Audit</h3>
                        </div>
                      </div>
                      <button onClick={handleFullAnalysis} disabled={loadingAnalysis} className="p-4 bg-slate-900 rounded-2xl text-blue-400 border border-slate-800 hover:bg-slate-800 transition-all shadow-xl">
                         <RefreshCw className={`w-6 h-6 ${loadingAnalysis ? 'animate-spin' : ''}`} />
                      </button>
                   </div>
                   
                   <div className="flex-1">
                      {loadingAnalysis ? (
                        <div className="h-full flex flex-col items-center justify-center py-24 gap-8">
                           <Loader2 className="w-16 h-16 animate-spin text-blue-500/30" />
                           <span className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-blue-400">Executing Audit...</span>
                        </div>
                      ) : (
                        <IntelligenceReport text={analysis?.text || "Intelligence briefing pending..."} />
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <>
        <tr 
          onClick={handleCardClick}
          className={`group transition-all duration-200 cursor-pointer ${
            isSelected 
              ? 'bg-blue-600/20' 
              : 'hover:bg-slate-800/40'
          }`}
        >
          <td className="px-6 py-4">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? (player.recruitingType === 'HS' ? 'bg-emerald-600 border-emerald-600' : 'bg-blue-600 border-blue-600') + ' text-white scale-110 shadow-lg' : 'border-slate-700 bg-slate-950'}`}>
              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </td>
          <td className="px-6 py-4 overflow-hidden">
            <div className="flex items-center gap-2 max-w-full">
              <span className={`text-sm font-black uppercase tracking-tight truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                {player.name}
              </span>
              {isSuperstar && <Crown className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
            </div>
          </td>
          <td className="px-6 py-4">
            <span className={`${player.recruitingType === 'HS' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-600/10 text-blue-400 border-blue-500/20'} px-2 py-0.5 rounded text-[10px] font-black uppercase border block text-center`}>
              {player.position}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase text-center block">
                {player.classYear || '2026'}
              </span>
              {player.draftEligibility && (
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter mt-0.5">
                  Draft {player.draftEligibility}
                </span>
              )}
              {player.draftProjection && (
                <span className="text-[8px] font-black text-purple-500 uppercase tracking-tighter mt-0.5">
                  Proj: {player.draftProjection}
                </span>
              )}
              {player.commitment && (
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter mt-0.5">
                  COMMITTED: {player.commitment.schoolName}
                </span>
              )}
            </div>
          </td>
          <td className="px-6 py-4 overflow-hidden">
            <span className="text-[11px] font-bold text-slate-400 uppercase truncate block">
              {player.previousSchool || player.highSchool}
            </span>
          </td>
          <td className="px-6 py-4 overflow-hidden">
            <span className="text-[11px] font-black text-emerald-400 uppercase truncate block">
              {player.predictedDestination}
            </span>
          </td>
          <td className="px-6 py-4">
             <span className="text-[11px] font-black text-emerald-500 uppercase text-center block tracking-tighter">
               {player.nilValue || 'TBD'}
             </span>
          </td>
          <td className="px-6 py-4 text-center">
            <span className={`text-sm font-black ${getGradeColor(piGrade)}`}>
              {piGrade}
            </span>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={handleToggleSaveBoard} 
                disabled={isSaving}
                className={`p-2 rounded-lg border transition-all ${isSavedToBoard ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                title="Save to Board"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={handleOpenModal} 
                className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-all active:scale-90"
                title="Deep Audit"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && renderModal()}
      </>
    );
  }

  return (
    <>
      <div 
        onClick={handleCardClick}
        className={`relative border rounded-[2.5rem] p-6 md:p-8 transition-all duration-500 group flex flex-col cursor-pointer overflow-hidden h-full hover:scale-[1.02] ${
          isSelected 
            ? `ring-4 ${player.recruitingType === 'HS' ? 'ring-emerald-500/30 border-emerald-500' : 'ring-blue-500/30 border-blue-500'} bg-[#0d1526] shadow-[0_0_60px_rgba(59,130,246,0.25)]` 
            : isSuperstar
              ? 'bg-[#1a0b2e] border-purple-500/50 animate-glow-pulse shadow-2xl'
              : 'bg-[#0d1526]/60 border-slate-800 hover:border-slate-600'
        }`}
      >
        {/* Selection Tag Overlay */}
        {isSelected && (
          <div className={`absolute top-0 right-0 p-3 ${player.recruitingType === 'HS' ? 'bg-emerald-600' : 'bg-blue-600'} rounded-bl-[1.5rem] z-20 shadow-xl animate-in fade-in slide-in-from-top-1 duration-300`}>
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        )}

        <div className="flex items-start justify-between mb-6 pr-10">
          <div className="flex flex-col pt-1 w-full overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <h3 className={`text-2xl md:text-3xl font-black tracking-tighter leading-tight truncate uppercase transition-colors ${isSelected ? 'text-white' : 'text-white'}`}>
                {player.name}
              </h3>
              <button 
                onClick={handlePlayPronunciation}
                disabled={isPlayingAudio}
                className="p-1.5 bg-slate-800/60 hover:bg-purple-600/20 rounded-lg text-slate-400 hover:text-purple-400 transition-all disabled:opacity-50"
                title="Pronounce Name"
              >
                {isPlayingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl shadow-lg">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] md:text-sm font-black text-emerald-400 tracking-tighter">{player.nilValue || 'TBD'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
               <span className={`${player.recruitingType === 'HS' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-600/10 text-blue-400 border-blue-500/20'} px-4 py-1.5 rounded-xl text-[11px] md:text-xs font-black tracking-[0.2em] border uppercase`}>
                 {player.position}
               </span>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Class {player.classYear || '2026'}</span>
               {player.commitment && (
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-xl shadow-lg">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span className="text-[9px] font-black text-blue-400 uppercase">COMMITTED: {player.commitment.schoolName}</span>
                 </div>
               )}
               {player.draftEligibility && (
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-l border-slate-800 pl-3">Draft {player.draftEligibility}</span>
               )}
               {player.draftProjection && (
                 <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest border-l border-slate-800 pl-3">Proj: {player.draftProjection}</span>
               )}
               {currentUser?.blueprint && fitAudit && (
                 <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-lg">
                    <Target className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-400">{fitAudit.score}% FIT</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* The School Journey Section - Enhanced Prominence */}
        <div className="mb-6 space-y-4">
          <div className="relative">
             <div className="absolute left-[18px] top-8 bottom-8 w-0.5 bg-slate-800/60 dashed border-l-2 border-slate-700/30 border-dashed"></div>
             
             <div className="flex items-center gap-4 group/journey">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg group-hover/journey:border-blue-500/50 transition-colors z-10">
                   <GraduationCap className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block leading-none mb-1">ORIGIN PROGRAM</span>
                   <p className="text-xs font-black text-slate-300 uppercase truncate leading-tight">
                     {player.previousSchool || player.highSchool || 'UNLISTED'}
                   </p>
                </div>
             </div>

             <div className="flex items-center gap-4 mt-6 group/journey">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg group-hover/journey:border-emerald-500/50 transition-colors z-10">
                   <MapPin className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block leading-none mb-1">PREDICTED DESTINATION</span>
                   <p className="text-xs font-black text-emerald-400 uppercase truncate leading-tight">
                     {player.predictedDestination || 'TBD'}
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Stats and Summary Highlights */}
        {player.summary && (
          <div className="mb-6">
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 shadow-inner">
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> INTEL SUMMARY
               </span>
               <p className="text-[10px] md:text-[11px] text-slate-400 leading-relaxed line-clamp-3 italic">
                 "{player.summary}"
               </p>
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-slate-800/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">PI GRADE</span>
                 <span className={`text-lg font-black leading-none mt-0.5 ${getGradeColor(piGrade)}`}>{piGrade}</span>
              </div>
              <div className="h-6 w-px bg-slate-800/50 mx-1"></div>
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">NIL VAL</span>
                 <span className="text-xs font-black text-emerald-400 mt-0.5 tracking-tighter">{player.nilValue || 'TBD'}</span>
              </div>
              <div className="h-6 w-px bg-slate-800/50 mx-1"></div>
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">STARS</span>
                 <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({length: 5}).map((_, i) => (
                      <Star key={i} className={`w-2.5 h-2.5 ${i < player.stars ? 'text-yellow-500 fill-current' : 'text-slate-800'}`} />
                    ))}
                 </div>
              </div>
           </div>
           <button onClick={(e) => { e.stopPropagation(); setShowInlineDetails(!showInlineDetails); }} className="p-2.5 bg-slate-800/60 rounded-xl text-slate-500 hover:text-blue-400 transition-all">
              {showInlineDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
           </button>
        </div>

        {showInlineDetails && (
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-800 space-y-4 md:space-y-6 animate-in slide-in-from-top-2 duration-300">
            {player.stats && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Production Audit</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/40">
                  {player.stats}
                </p>
              </div>
            )}
            {player.capabilities && player.capabilities.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ZapIcon className="w-3.5 h-3.5" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Capability Audit</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {player.capabilities.map((cap, idx) => (
                    <span key={idx} className="bg-emerald-600/10 text-emerald-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-emerald-500/20 shadow-sm">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {player.videoLinks && player.videoLinks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <Video className="w-3.5 h-3.5" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Verified Film</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {player.videoLinks.map((video, idx) => (
                    <a 
                      key={idx} 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-slate-900/40 border border-slate-800 p-3 rounded-xl group/video hover:bg-slate-800/60 hover:border-purple-500/40 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 group-hover/video:border-purple-500/50 transition-colors">
                          <Play className="w-4 h-4 text-purple-500 group-hover/video:scale-110 transition-transform" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase truncate max-w-[180px]">{video.title}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-600 group-hover/video:text-white transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="absolute top-24 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
           <button onClick={handleScoutAI} title="Quick AI Take" disabled={loadingTake} className={`p-4 rounded-[1.5rem] border transition-all ${loadingTake ? 'opacity-50' : ''} bg-purple-600/20 border-purple-500/40 text-purple-400 hover:bg-purple-600 hover:text-white shadow-2xl`}>
              {loadingTake ? <Loader2 className="w-6 h-6 animate-spin" /> : <ScanText className="w-6 h-6" />}
           </button>
           <button onClick={handleToggleSaveBoard} title="Save Asset" disabled={isSaving} className={`p-4 rounded-[1.5rem] border transition-all ${isSavedToBoard ? 'bg-blue-600 border-blue-500 text-white shadow-2xl' : 'bg-slate-800/95 border-slate-700 text-slate-400 hover:text-white shadow-2xl'} active:scale-90`}>
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : isSavedToBoard ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
           </button>
           <button onClick={handleOpenModal} title="Deep Audit" className="p-4 bg-slate-800/95 rounded-[1.5rem] border border-slate-700 text-slate-400 hover:text-white shadow-2xl active:scale-90"><Maximize2 className="w-6 h-6" /></button>
        </div>
      </div>
      {isExpanded && renderModal()}
    </>
  );
};
