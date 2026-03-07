
import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, ChevronDown, ChevronRight, Zap, Sparkles, 
  FileSpreadsheet, ShieldCheck, Shield, Target, Terminal, 
  Lightbulb, Info, BookOpen, AlertCircle, FileDown, 
  Search, Bookmark, MessageSquare, Users, Star, BrainCircuit,
  ClipboardCheck, Copy, X, Check, ArrowRight, ExternalLink,
  CalendarDays, LayoutDashboard, Coins, Brain, GraduationCap, Building2,
  Presentation, Headphones, Rocket, Mail, Globe, Monitor, Play, Layers,
  Database, Share2, Filter, MousePointer2, Smartphone, Crown, Trophy, Megaphone, Clock, Activity
} from 'lucide-react';

const SystemSnapshot: React.FC<{ type: 'dashboard' | 'scanner' | 'pro' }> = ({ type }) => {
  return (
    <div className="w-full h-full bg-[#0b1224] p-6 flex flex-col gap-6 relative overflow-hidden font-sans border-2 border-blue-500/20 rounded-[2rem]">
      {/* UI Controls Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>
        </div>
        <div className="h-2 w-32 bg-slate-800/60 rounded-full"></div>
      </div>
      
      {type === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-500" />
             </div>
             <div className="space-y-1">
                <div className="h-4 w-32 bg-white rounded-sm"></div>
                <div className="h-2 w-48 bg-slate-700 rounded-sm"></div>
             </div>
          </div>
          <div className="h-12 w-full bg-slate-900 border border-slate-800 rounded-xl flex items-center px-4 justify-between">
             <div className="flex items-center gap-3">
                <Megaphone className="w-4 h-4 text-blue-400" />
                <div className="h-1.5 w-24 bg-slate-700 rounded-full"></div>
             </div>
             <div className="h-6 w-24 bg-blue-600/20 border border-blue-500/40 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="h-24 bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
                <div className="h-1.5 w-1/2 bg-slate-600 rounded-full"></div>
                <div className="h-4 w-full bg-slate-800 rounded-sm"></div>
                <div className="h-2 w-3/4 bg-slate-800 rounded-full mt-auto"></div>
             </div>
             <div className="h-24 bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
                <div className="h-1.5 w-1/2 bg-slate-600 rounded-full"></div>
                <div className="h-4 w-full bg-slate-800 rounded-sm"></div>
                <div className="h-2 w-3/4 bg-slate-800 rounded-full mt-auto"></div>
             </div>
          </div>
        </div>
      )}

      {type === 'scanner' && (
        <div className="space-y-4">
          <div className="flex justify-between">
             <div className="h-4 w-40 bg-white rounded-sm"></div>
             <div className="h-8 w-24 bg-slate-800 rounded-xl"></div>
          </div>
          <div className="h-14 w-full bg-[#0f172a] border border-slate-800 rounded-2xl flex items-center px-4">
            <Search className="w-5 h-5 text-slate-700 mr-4" />
            <div className="h-2 w-1/2 bg-slate-700 rounded-full"></div>
          </div>
          <div className="flex gap-2">
             {[1,2,3].map(i => <div key={i} className="h-6 w-16 bg-blue-900/20 border border-blue-500/20 rounded-lg"></div>)}
          </div>
        </div>
      )}

      {type === 'pro' && (
        <div className="flex flex-col items-center justify-center h-full gap-4 pb-4">
           <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Trophy className="w-8 h-8 text-white" />
           </div>
           <div className="space-y-2">
              <div className="h-4 w-48 bg-white rounded-full mx-auto"></div>
              <div className="h-2 w-40 bg-slate-700 rounded-full mx-auto"></div>
           </div>
           <div className="grid grid-cols-2 gap-3 w-full px-4 mt-2">
              <div className="h-20 bg-slate-900 border-2 border-blue-500 rounded-2xl"></div>
              <div className="h-20 bg-slate-900 border border-slate-800 rounded-2xl"></div>
           </div>
           <div className="h-12 w-full max-w-[200px] bg-blue-600 rounded-xl shadow-lg mt-2"></div>
        </div>
      )}

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-30 pointer-events-none"></div>
    </div>
  );
};

export const HelpCenter: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [heartbeat, setHeartbeat] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setHeartbeat(prev => !prev), 3000);
    return () => clearInterval(interval);
  }, []);

  const tutorials = [
    {
      id: 'getting-started',
      title: 'Priority Intelligence',
      icon: LayoutDashboard,
      snapshot: 'dashboard',
      color: 'text-blue-400',
      steps: [
        {
          title: 'Sync Grounding Relay',
          desc: 'Ensure your Intel Dashboard is synced. Grounded news from national channels aggregates here in 60-minute cycles.',
          uiHint: 'Pulsing "LIVE GROUNDING" status badge in the flash bar.'
        },
        {
          title: 'Initialize Pro Session',
          desc: 'To interact with the portal network or publish intel, verify your identity via the staff login portal.',
          uiHint: 'Top right button: "Sign In to Post Intel".'
        }
      ]
    },
    {
      id: 'scanner',
      title: 'Portal Scanner Grid',
      icon: Search,
      snapshot: 'scanner',
      color: 'text-emerald-400',
      steps: [
        {
          title: 'Execute Network Scans',
          desc: 'Use natural language to query the portal. Type phrases like "Undecided QBs from the SEC" to trigger grounding.',
          uiHint: 'Blue "Scan Portal" button executes the grounding cycle.'
        },
        {
          title: 'Activate Deep Research',
          desc: 'Toggle Speed Mode to use "Pro Thinking" for multi-step audits of roster fit and NIL ROI.',
          uiHint: 'Yellow "Zap" icon in the scanner header bar.'
        }
      ]
    },
    {
      id: 'pro',
      title: 'Pro Access Protocol',
      icon: Trophy,
      snapshot: 'pro',
      color: 'text-amber-400',
      steps: [
        {
          title: 'Select Access Level',
          desc: 'Choose between a Daily Pass for monitoring or Season Access for the full recruitment cycle.',
          uiHint: 'Check the "Most Popular" Season Access badge.'
        },
        {
          title: 'Establish Identity',
          desc: 'After authorization, finalize your unique Scout Handle and Intelligence Key for encrypted access.',
          uiHint: 'Follow the "Finalize Pro Access" setup flow.'
        }
      ]
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      
      {/* Cinematic Manual Header */}
      <div className="relative bg-[#0b1224] border border-slate-800 rounded-[3rem] p-12 md:p-20 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.3)] flex-shrink-0 transform rotate-3">
            <BookOpen className="text-white w-16 h-16 md:w-20 md:h-20" />
          </div>
          <div className="text-center lg:text-left space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">Scout Manual</h1>
            <p className="text-slate-400 text-lg md:text-2xl max-w-2xl leading-relaxed font-medium">
              Standard Operating Procedure for the PortalIntel Intelligence Grid.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-2 md:px-0">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl sticky top-8">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 px-4">Command Sections</h3>
              <div className="space-y-1">
                 {tutorials.map(t => (
                   <button
                     key={t.id}
                     onClick={() => setActiveSection(t.id)}
                     className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border ${
                       activeSection === t.id 
                       ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg' 
                       : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                     }`}
                   >
                     <t.icon className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{t.title}</span>
                   </button>
                 ))}
                 <div className="h-px bg-slate-800 my-4 mx-4"></div>
                 <button
                   onClick={() => setActiveSection('faq')}
                   className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border ${
                     activeSection === 'faq' 
                     ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg' 
                     : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                   }`}
                 >
                   <HelpCircle className="w-5 h-5" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Global FAQ</span>
                 </button>
              </div>

              {/* System Diagnostics Heartbeat */}
              <div className="mt-8 bg-[#0b1224] border border-slate-800 rounded-[2rem] p-6 space-y-6 shadow-2xl">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Neural Heartbeat</span>
                    <div className={`w-2 h-2 rounded-full transition-all duration-1000 ${heartbeat ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'bg-slate-800'}`}></div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] font-bold text-slate-500 uppercase">Grounding Relay</span>
                       <span className="text-[8px] font-black text-emerald-500 uppercase">Nominal</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] font-bold text-slate-500 uppercase">Search Integrity</span>
                       <span className="text-[8px] font-black text-emerald-500 uppercase">Verified</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] font-bold text-slate-500 uppercase">Thinking Budget</span>
                       <span className="text-[8px] font-black text-blue-400 uppercase">32,768 Tokens</span>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                       <Activity className="w-3 h-3 text-blue-600" />
                       <span className="text-[7px] font-black text-slate-700 uppercase tracking-[0.2em]">Deployment: Authorized v4.2</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Dynamic Walkthrough View */}
        <div className="lg:col-span-9 space-y-10">
          {activeSection !== 'faq' ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
               {/* Section Title */}
               <div className="flex items-center gap-6 border-b border-slate-800 pb-8">
                  <div className={`p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl ${tutorials.find(t => t.id === activeSection)?.color}`}>
                    {React.createElement(tutorials.find(t => t.id === activeSection)?.icon || Info, { className: "w-10 h-10" })}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                      {tutorials.find(t => t.id === activeSection)?.title}
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Section Command Protocol</p>
                  </div>
               </div>

               {/* Steps with High Fidelity Snapshots */}
               <div className="grid grid-cols-1 gap-12">
                  {tutorials.find(t => t.id === activeSection)?.steps.map((step, i) => (
                    <div key={i} className="group bg-[#0d1526] border border-slate-800 rounded-[3rem] p-8 md:p-12 hover:border-blue-500/40 transition-all shadow-2xl overflow-hidden relative">
                       <div className="absolute top-0 right-0 p-8 text-8xl font-black text-blue-500/5 font-mono select-none">
                          0{i + 1}
                       </div>
                       
                       <div className="flex flex-col md:flex-row gap-10 md:gap-14 relative z-10">
                          {/* Visual Snapshot Replication */}
                          <div className="w-full md:w-[360px] h-[280px] bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-inner group-hover:scale-[1.02] transition-transform relative">
                             <SystemSnapshot type={tutorials.find(t => t.id === activeSection)?.snapshot as any} />
                             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-blue-600 text-white px-4 py-2 rounded-full shadow-2xl scale-90 md:scale-100">
                                <MousePointer2 className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Interface Snapshot</span>
                             </div>
                          </div>

                          {/* Explanation */}
                          <div className="flex-1 space-y-6 md:py-4">
                             <div className="space-y-2">
                                <span className="text-blue-500 font-black text-[11px] uppercase tracking-[0.4em]">Step 0{i + 1}</span>
                                <h3 className="text-3xl font-black text-white tracking-tight uppercase leading-none">{step.title}</h3>
                             </div>
                             <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium">
                                {step.desc}
                             </p>
                             <div className="bg-slate-950/80 border border-blue-500/20 p-6 rounded-[1.75rem] flex items-start gap-5 shadow-inner">
                                <div className="p-2 bg-blue-600/10 rounded-lg">
                                   <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                </div>
                                <div>
                                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Scout's Interface Instruction</span>
                                   <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-tight mt-1 leading-snug">{step.uiHint}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-6 border-b border-slate-800 pb-8">
                  <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-blue-400">
                    <HelpCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Global Intelligence FAQ</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Verification & Protocol Details</p>
                  </div>
               </div>

               <div className="space-y-6">
                 {[
                   {
                     q: "How often is the data synced?",
                     a: "The Priority Intel dashboard syncs with the Gemini Neural Relay every 60 minutes. Search grounding occurs in real-time on every query to ensure the most up-to-date portal movements."
                   },
                   {
                     q: "What is Turbo Mode vs standard?",
                     a: "Turbo mode uses Gemini Flash for near-instant scanning of portal movements, ideal for rapid monitoring. Standard mode uses Gemini 3 Pro with a 32,768 reasoning budget for deep audits and ROI analysis."
                   },
                   {
                     q: "Is the data verified by scouts?",
                     a: "All intelligence reports are synthesized from grounded national news sources. Verified staff members can contribute to the Scout Forum to add human-verified context to AI reports."
                   }
                 ].map((faq, i) => (
                   <div key={i} className="bg-[#0b1224] border border-slate-800 rounded-[2.5rem] p-10 shadow-lg hover:border-blue-500/20 transition-all group">
                      <h4 className="text-2xl font-black text-white mb-6 tracking-tight flex items-center gap-4 group-hover:text-blue-400 transition-colors uppercase italic">
                         <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                         {faq.q}
                      </h4>
                      <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium pl-8 border-l-2 border-slate-800">
                         {faq.a}
                      </p>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Support Tier */}
      <section className="relative overflow-hidden group mt-20 px-2 md:px-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 rounded-[4rem] blur-3xl opacity-50"></div>
        <div className="relative bg-[#0d1526] border border-slate-800 p-12 md:p-16 rounded-[4rem] flex flex-col lg:flex-row items-center gap-12 shadow-2xl">
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <Presentation className="w-10 h-10 text-blue-500" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Need System Integration?</h2>
                <p className="text-blue-500/60 font-black text-[10px] uppercase tracking-[0.4em] mt-1">Enterprise White Glove Support</p>
              </div>
            </div>
            
            <p className="text-slate-300 text-xl md:text-2xl leading-relaxed font-medium">
              If your department requires specialized data formatting, custom API integration for internal recruiting boards, or private security audits, our team is ready to assist.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
               <button className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
                  <Mail className="w-6 h-6" />
                  Contact Support Node
               </button>
               <button className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border border-slate-700 active:scale-95">
                  Full API Documentation
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer System Info */}
      <div className="text-center pt-24 border-t border-slate-900/50 opacity-40">
         <p className="text-slate-800 text-[11px] font-black uppercase tracking-[0.6em] mb-6">
            Authorized Personnel Only • PortalIntel Intelligence Protocol v4.2
         </p>
         <div className="flex items-center justify-center gap-10">
            <Smartphone className="w-5 h-5 text-slate-800" />
            <Monitor className="w-5 h-5 text-slate-800" />
            <Layers className="w-5 h-5 text-slate-800" />
         </div>
      </div>
    </div>
  );
};
