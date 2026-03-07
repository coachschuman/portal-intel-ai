
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Download, Loader2, Volume2, VolumeX } from 'lucide-react';
import { generateAudioBlob } from '../services/gemini';

interface ScoutingAudioPlayerProps {
  text: string;
  voiceName?: string;
  label?: string;
  onClose?: () => void;
}

export const ScoutingAudioPlayer: React.FC<ScoutingAudioPlayerProps> = ({ 
  text, 
  voiceName = 'Kore', 
  label = "Scouting Intelligence Report",
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync muted state with audio element property
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const handleInitialize = async () => {
    if (blobUrl) {
      togglePlay();
      return;
    }

    setLoading(true);
    try {
      const blob = await generateAudioBlob(text, voiceName);
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(err => {
          console.warn("Autoplay prevented or failed", err);
        });
      }
    } catch (err) {
      console.error("Audio initialization failed", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.error("Play failed", err));
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!blobUrl) return;
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `PortalIntel_ScoutReport_${Date.now()}.wav`;
    // For Safari/Firefox compatibility, append to body
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <Square className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {!blobUrl && !loading ? (
            <button 
              onClick={handleInitialize}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              Generate Scouting Audio
            </button>
          ) : loading ? (
            <div className="flex items-center gap-3 text-blue-400 font-bold text-xs animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
              Compiling Intel...
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-all shadow-lg active:scale-90"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              
              <button 
                onClick={handleStop}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-all active:scale-90"
              >
                <Square className="w-4 h-4" />
              </button>

              <div className="flex-1 px-4 flex flex-col gap-1">
                 <input 
                   type="range" 
                   min="0" 
                   max={duration || 100} 
                   value={currentTime} 
                   onChange={(e) => {
                     if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
                   }}
                   className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                 />
                 <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                 </div>
              </div>

              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
                <button 
                  onClick={() => setMuted(!muted)}
                  className={`p-2 transition-colors ${muted ? 'text-red-400' : 'text-slate-500 hover:text-white'}`}
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleDownload}
                  className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"
                  title="Download WAV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <audio 
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        className="hidden"
      />
    </div>
  );
};
