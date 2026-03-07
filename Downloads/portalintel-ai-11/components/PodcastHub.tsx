
import React from 'react';
import { Radio, Mic, Info, ShieldCheck, Globe, TrendingUp } from 'lucide-react';

export const PodcastHub: React.FC = () => {
  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="bg-[#0b1224] border border-slate-800 p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-center md:text-left">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-2xl">
                     <Radio className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                     <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none italic">Intel Podcast Hub</h2>
                     <div className="flex items-center gap-3 mt-2">
                        <Mic className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Audio Intelligence: FREE ACCESS</span>
                     </div>
                  </div>
               </div>
               <p className="text-slate-400 max-w-2xl font-medium leading-relaxed text-lg">
                  Access elite recruiting breakdowns, scouting insights, and industry interviews from the leading minds in college football.
               </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-5 rounded-[2rem] shadow-xl">
               <div className="flex flex-col items-center gap-2 px-4 border-r border-slate-800/50">
                  <span className="text-2xl font-black text-white">2</span>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Channels</span>
               </div>
               <div className="px-4">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="w-3 h-3 text-emerald-500" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized Source</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                     <Globe className="w-3 h-3 text-blue-500" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Relay</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Podcast Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Podcast 1 */}
         <div className="group bg-[#0d1526] border border-slate-800 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl hover:border-blue-500/40 transition-all duration-500">
            <div className="p-8 pb-4">
               <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-widest">Featured Channel</span>
                  <TrendingUp className="w-3 h-3 text-blue-500" />
               </div>
               <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight uppercase mb-4">College Football & Recruiting Intelligence</h3>
               <p className="text-slate-400 text-sm font-medium leading-relaxed">Intelligence with Coach Schuman's Intelligence Service. Deep dives into portal movements and high school scouting.</p>
            </div>
            <div className="p-6 md:p-8 pt-4">
               <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-black/40">
                  <iframe 
                    allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" 
                    frameBorder="0" 
                    height="450" 
                    style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', borderRadius: '10px' }} 
                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" 
                    src="https://embed.podcasts.apple.com/us/podcast/college-football-recruiting-intelligence-with-coach/id1542682639"
                  ></iframe>
               </div>
            </div>
         </div>

         {/* Podcast 2 */}
         <div className="group bg-[#0d1526] border border-slate-800 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl hover:border-blue-500/40 transition-all duration-500">
            <div className="p-8 pb-4">
               <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-emerald-600/10 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest">The Prospect Series</span>
                  <Radio className="w-3 h-3 text-emerald-500" />
               </div>
               <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight uppercase mb-4">The Prospect Podcast</h3>
               <p className="text-slate-400 text-sm font-medium leading-relaxed">Focusing on individual asset development and scouting profiles of the nation's top emerging talent.</p>
            </div>
            <div className="p-6 md:p-8 pt-4">
               <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-black/40">
                  <iframe 
                    allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" 
                    frameBorder="0" 
                    height="450" 
                    style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', borderRadius: '10px' }} 
                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" 
                    src="https://embed.podcasts.apple.com/us/podcast/the-prospect-podcast/id1546574525"
                  ></iframe>
               </div>
            </div>
         </div>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-[2.5rem] p-8 text-center px-10">
         <div className="flex items-center justify-center gap-4 mb-4">
            <Info className="w-5 h-5 text-blue-500/30" />
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] leading-loose">
               Audio relay provided via Apple Podcasts Integration. Synchronization active for Class of 2026-2032 updates.
            </p>
         </div>
      </div>
    </div>
  );
};
