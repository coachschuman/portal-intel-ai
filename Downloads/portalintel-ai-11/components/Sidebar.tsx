
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Search, Globe, Zap, Crown, ShieldCheck, Lock, Users, Bookmark, HelpCircle, Shield, Coins, UserCog, Trophy, X, Settings, GraduationCap, Building2, MapPin, Activity, Radio, Mic2, RefreshCcw, Cpu, ChevronDown, ChevronRight, Layout } from 'lucide-react';
import { PortalTab } from '../types';

interface NavItem {
  id: PortalTab;
  label: string;
  icon: any;
  pro?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
  color: "blue" | "emerald" | "purple" | "slate";
}

interface NavButtonProps {
  item: NavItem;
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
  isPro?: boolean;
  isAdmin?: boolean;
  color: "blue" | "emerald" | "purple" | "slate";
}

const NavButton: React.FC<NavButtonProps> = ({ 
  item, activeTab, setActiveTab, isPro, isAdmin, color 
}) => {
  const isActive = activeTab === item.id;
  const isLocked = item.pro && !isPro && !isAdmin;
  
  const colors = {
    blue: "blue",
    emerald: "emerald",
    purple: "purple",
    slate: "slate"
  };
  
  const colorClass = colors[color];
  
  return (
    <button
      onClick={() => setActiveTab(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
        isActive 
          ? `bg-${colorClass}-600/10 text-${colorClass}-400 border border-${colorClass}-600/20 shadow-lg shadow-${colorClass}-900/10` 
          : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
      }`}
    >
      <item.icon className={`w-4 h-4 ${isActive ? `text-${colorClass}-400` : 'text-slate-600 group-hover:text-slate-400'}`} />
      <span className={`text-[11px] font-bold tracking-tight uppercase ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
      {isLocked && (
        <Lock className="w-2.5 h-2.5 text-slate-700 ml-auto" />
      )}
      {isActive && <div className={`ml-auto w-1 h-1 rounded-full bg-${colorClass}-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]`} />}
    </button>
  );
};

interface SidebarProps {
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
  isPro?: boolean;
  isAdmin?: boolean;
  onUpgrade?: () => void;
  onAdminToggle?: () => void;
  mobileVariant?: 'drawer' | 'stacked';
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, isPro, isAdmin, onUpgrade, onAdminToggle, mobileVariant = 'drawer', onCloseMobile
}) => {
  const [logoError, setLogoError] = useState(false);
  const [heartbeat, setHeartbeat] = useState(true);
  
  // Section collapse state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    college: true,
    hs: true,
    draft: true,
    admin: true
  });

  useEffect(() => {
    const id = setInterval(() => setHeartbeat(prev => !prev), 3000);
    return () => clearInterval(id);
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const sections: NavSection[] = [
    {
      id: 'general',
      label: 'Intelligence Central',
      icon: Layout,
      color: 'slate',
      items: [
        { id: PortalTab.DASHBOARD, label: 'Control Center', icon: LayoutDashboard },
        { id: PortalTab.CHAT, label: 'Scout Assistant', icon: MessageSquare },
        { id: PortalTab.PODCAST_HUB, label: 'Intel Podcast', icon: Radio },
        { id: PortalTab.FORUM, label: 'Strategy Forum', icon: Users },
        { id: PortalTab.HELP_CENTER, label: 'System Manual', icon: HelpCircle },
      ]
    },
    {
      id: 'college',
      label: 'College Hub',
      icon: Globe,
      color: 'blue',
      items: [
        { id: PortalTab.SEARCH, label: 'Portal Scanner', icon: Search, pro: true },
        { id: PortalTab.BIG_BOARD, label: 'Consensus Board', icon: Trophy, pro: true },
        { id: PortalTab.SAVED_INTEL, label: 'My Scout Board', icon: Bookmark, pro: true },
        { id: PortalTab.NIL_BIG_BOARD, label: 'NIL Strategic', icon: Coins, pro: true },
      ]
    },
    {
      id: 'hs',
      label: 'HS Recruiting',
      icon: GraduationCap,
      color: 'emerald',
      items: [
        { id: PortalTab.HS_SEARCH, label: 'HS Scanner', icon: Building2, pro: true },
        { id: PortalTab.HS_BIG_BOARD, label: 'National Boards', icon: Trophy, pro: true },
        { id: PortalTab.HS_SAVED_INTEL, label: 'HS Scout Board', icon: Bookmark, pro: true },
      ]
    },
    {
      id: 'draft',
      label: 'Pro Logic Hub',
      icon: Cpu,
      color: 'purple',
      items: [
        { id: PortalTab.NFL_DRAFT_INTEL, label: 'NFL Draft Hub', icon: Cpu, pro: true },
        { id: PortalTab.SOCIAL_INTEL, label: 'Social Pulse', icon: Activity, pro: true },
        { id: PortalTab.VOICE_HUB, label: 'Voice Intel', icon: Mic2, pro: true },
      ]
    }
  ];

  const adminSection: NavSection = {
    id: 'admin',
    label: 'System Admin',
    icon: ShieldCheck,
    color: 'slate',
    items: [
      { id: PortalTab.ADMIN_MEMBERS, label: 'Member Manager', icon: UserCog },
    ]
  };

  const renderSection = (section: NavSection) => {
    const isExpanded = expandedSections[section.id];
    
    // Check if any item in this section is active
    const hasActiveItem = section.items.some(item => item.id === activeTab);
    
    return (
      <div key={section.id} className="space-y-1">
        <button 
          onClick={() => toggleSection(section.id)}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group ${
            hasActiveItem ? 'text-slate-200' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <section.icon className={`w-3.5 h-3.5 ${isExpanded ? 'opacity-100' : 'opacity-40'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] flex-1 text-left">{section.label}</span>
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 opacity-30" />
          ) : (
            <ChevronRight className="w-3 h-3 opacity-30" />
          )}
        </button>
        
        {isExpanded && (
          <div className="space-y-1 ml-2 pl-2 border-l border-slate-800/60 animate-in slide-in-from-top-1 duration-200">
            {section.items.map(item => (
              <NavButton 
                key={item.id} 
                item={item} 
                activeTab={activeTab} 
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  if (onCloseMobile) onCloseMobile();
                }} 
                isPro={isPro} 
                isAdmin={isAdmin} 
                color={section.color}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const innerContent = (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {!logoError ? (
              <img 
                src="logo.png" 
                alt="PortalIntel AI" 
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Shield className="w-5 h-5 text-blue-500" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tighter leading-none">
              PortalIntel<span className="text-blue-500">.ai</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[7px] font-black text-slate-500 tracking-[0.1em] uppercase leading-none">
                {isAdmin ? 'Admin' : isPro ? 'Pro' : 'Free'} Tier
              </span>
            </div>
          </div>
        </div>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="p-2 text-slate-500 hover:text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-2 space-y-4 overflow-y-auto scrollbar-hide pb-10">
        {sections.map(renderSection)}
        
        {isAdmin && renderSection(adminSection)}
      </nav>

      <div className="p-4 border-t border-slate-800/50 space-y-3 bg-slate-950/50">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-2xl mb-2">
           <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-1000 ${heartbeat ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-700'}`}></div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Neural Link</span>
           </div>
           <RefreshCcw className={`w-3 h-3 text-slate-700 ${heartbeat ? 'animate-spin-slow' : ''}`} />
        </div>

        {!isPro && !isAdmin && (
          <button 
            onClick={onUpgrade}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all flex items-center justify-center gap-3 group shadow-xl active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest">Go Pro Access</span>
          </button>
        )}

        <div className="space-y-1 pb-2">
          <button 
            onClick={onAdminToggle}
            className={`w-full flex items-center justify-center p-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${
              isAdmin 
                ? 'text-red-400 bg-red-400/5 border border-red-500/10' 
                : 'text-slate-800 hover:text-slate-600'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2 opacity-20" />}
            {isAdmin ? 'Bypass Active' : 'Staff Auth'}
          </button>
        </div>
      </div>
    </>
  );

  if (mobileVariant === 'stacked') {
    return (
      <div className="w-full space-y-6 animate-in slide-in-from-bottom-6 duration-700">
        <div className="grid grid-cols-2 gap-4 px-3">
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveTab(sec.items[0].id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all active:scale-95 text-center gap-3 relative overflow-hidden group bg-slate-900/60 border-slate-800 text-slate-500`}
            >
              <sec.icon className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{sec.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden md:flex flex-col h-screen bg-[#0d121f] border-r border-slate-800/50 w-64 flex-shrink-0 sticky top-0 z-40">
      {innerContent}
    </aside>
  );
};
