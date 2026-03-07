
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { PortalDashboard } from './components/PortalDashboard';
import { PortalScanner } from './components/PortalScanner';
import { HSScanner } from './components/HSScanner';
import { HSBigBoard } from './components/HSBigBoard';
import { SocialPulseHub } from './components/SocialPulseHub';
import { PodcastHub } from './components/PodcastHub';
import { ChatInterface } from './components/ChatInterface';
import { LiveVoiceHub } from './components/LiveVoiceHub';
import { MessageBoard } from './components/MessageBoard';
import { BigBoard } from './components/BigBoard';
import { SavedIntel } from './components/SavedIntel';
import { NILBigBoard } from './components/NILBigBoard';
import { HelpCenter } from './components/HelpCenter';
import { PremiumGate } from './components/PremiumGate';
import { AuthModal } from './components/AuthModal';
import { AccountSetup } from './components/AccountSetup';
import { AdminMemberManager } from './components/AdminMemberManager';
import { ProgramBlueprintModal } from './components/ProgramBlueprintModal';
import { NFLDraftIntel } from './components/NFLDraftIntel';
import { PortalTab, ScoutUser, ProgramBlueprint } from './types';
import { checkSubscriptionStatus } from './services/stripe';
import { Shield, Menu, X, Bell, ChevronDown, UserCircle, LogOut, Building2, Settings, User } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<PortalTab>(PortalTab.CHAT);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | undefined>(undefined);
  const [voiceContext, setVoiceContext] = useState<string | undefined>(undefined);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth & Onboarding State
  const [user, setUser] = useState<ScoutUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isAwaitingSetup, setIsAwaitingSetup] = useState(false);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('status') === 'success') {
      setIsAwaitingSetup(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const verifyAccess = async () => {
      try {
        const isSubscribed = await checkSubscriptionStatus();
        if (isSubscribed) {
          setIsPro(true);
        }
      } catch (e) {
        console.error("Subscription verify error:", e);
      }
    };
    
    verifyAccess();

    try {
      const savedUser = localStorage.getItem('portal_scout_user');
      if (savedUser && savedUser !== "undefined") {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
          if (parsedUser.role === 'Admin') {
            setIsAdmin(true);
            setIsPro(true);
          } else {
            if (parsedUser.accessLevel === 'Pro' || parsedUser.accessLevel === 'Enterprise') {
              setIsPro(true);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Corrupted scout session found. Resetting session store.");
      localStorage.removeItem('portal_scout_user');
    }
  }, []);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Close mobile menu when tab changes
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  const effectiveProAccess = isPro || isAdmin;

  const handleUpgradeSuccess = () => {
    setIsAwaitingSetup(true);
    setShowPaywall(false);
  };

  const handleSetupComplete = (newUser: ScoutUser) => {
    setUser(newUser);
    localStorage.setItem('portal_scout_user', JSON.stringify(newUser));
    localStorage.setItem('portal_pro_access', 'true');
    
    setIsPro(true);
    setIsAwaitingSetup(false);
    setActiveTab(PortalTab.DASHBOARD);
  };

  const handleLogin = (newUser: ScoutUser) => {
    setUser(newUser);
    localStorage.setItem('portal_scout_user', JSON.stringify(newUser));
    setShowAuth(false);
    
    if (newUser.role === 'Admin') {
      setIsAdmin(true);
      setIsPro(true);
      setShowPaywall(false);
    } else if (newUser.accessLevel === 'Pro' || newUser.accessLevel === 'Enterprise') {
      setIsPro(true);
      localStorage.setItem('portal_pro_access', 'true');
    }
  };

  const handleSaveBlueprint = (blueprint: ProgramBlueprint) => {
    if (user) {
      const updatedUser = { ...user, blueprint };
      setUser(updatedUser);
      localStorage.setItem('portal_scout_user', JSON.stringify(updatedUser));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setIsPro(false);
    localStorage.removeItem('portal_scout_user');
    localStorage.removeItem('portal_pro_access'); 
  };

  const handleRequestAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setActiveTab(PortalTab.DASHBOARD);
      return;
    }
    
    const password = window.prompt("Enter Admin Security Key to bypass restrictions:");
    if (password === "scout-master-2025" || password === "362511davE?!?!" || password === "362511dave") {
      setIsAdmin(true);
      setIsPro(true);
      setShowPaywall(false);
      const adminUser: ScoutUser = {
        id: 'admin-1',
        name: 'Coach Schuman',
        handle: '@coachschuman',
        role: 'Admin',
        accessLevel: 'Enterprise',
        isVerified: true,
        password: password || '',
        createdAt: Date.now()
      };
      setUser(adminUser);
      localStorage.setItem('portal_scout_user', JSON.stringify(adminUser));
      localStorage.setItem('portal_pro_access', 'true');
    } else if (password !== null) {
      alert("Unauthorized access attempt.");
    }
  };

  const requestProAccess = () => {
    if (!effectiveProAccess) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  const handleJoinForumRequest = () => {
    if (!effectiveProAccess) {
      setShowPaywall(true);
    } else {
      setShowAuth(true);
    }
  };

  const handleRescan = (query: string) => {
    setPendingQuery(query);
    setActiveTab(PortalTab.SEARCH);
    setTimeout(() => setPendingQuery(undefined), 100);
  };

  const handleVoiceDeepDive = (context: string) => {
    setVoiceContext(context);
    setActiveTab(PortalTab.VOICE_HUB);
  };

  if (isAwaitingSetup) {
    return <AccountSetup onComplete={handleSetupComplete} />;
  }

  const renderContent = () => {
    try {
      switch (activeTab) {
        case PortalTab.DASHBOARD:
          return <PortalDashboard isPro={effectiveProAccess} onRequestPro={requestProAccess} onVoiceDeepDive={handleVoiceDeepDive} />;
        case PortalTab.SEARCH:
          return <PortalScanner isPro={effectiveProAccess} onRequestPro={requestProAccess} initialQuery={pendingQuery} onVoiceDeepDive={handleVoiceDeepDive} />;
        case PortalTab.BIG_BOARD:
          return <BigBoard isPro={effectiveProAccess} onRequestPro={requestProAccess} onVoiceDeepDive={handleVoiceDeepDive} />;
        case PortalTab.HS_SEARCH:
          return <HSScanner isPro={effectiveProAccess} onRequestPro={requestProAccess} onVoiceDeepDive={handleVoiceDeepDive} />;
        case PortalTab.HS_BIG_BOARD:
          return <HSBigBoard isPro={effectiveProAccess} onRequestPro={requestProAccess} onVoiceDeepDive={handleVoiceDeepDive} />;
        case PortalTab.NFL_DRAFT_INTEL:
          return <NFLDraftIntel isPro={effectiveProAccess} onRequestPro={() => setShowPaywall(true)} />;
        case PortalTab.SOCIAL_INTEL:
          return <SocialPulseHub isPro={effectiveProAccess} onRequestPro={() => setShowPaywall(true)} onVoiceDeepDive={handleVoiceDeepDive} />;
        case PortalTab.PODCAST_HUB:
          return <PodcastHub />;
        case PortalTab.HS_SAVED_INTEL:
          return (
            <SavedIntel 
              isPro={effectiveProAccess} 
              onRequestPro={requestProAccess} 
              isPreview={!effectiveProAccess || !user}
              onShowPaywall={() => setShowPaywall(true)}
              onShowAuth={() => { setShowAuth(true); }}
              onRescan={handleRescan}
              onVoiceDeepDive={handleVoiceDeepDive}
              mode="HS"
            />
          );
        case PortalTab.CHAT:
          return <ChatInterface isPro={effectiveProAccess} onRequestPro={requestProAccess} onVoiceDeepDive={handleVoiceDeepDive} />;
        case PortalTab.VOICE_HUB:
          return <LiveVoiceHub isPro={effectiveProAccess} onRequestPro={() => setShowPaywall(true)} initialContext={voiceContext} />;
        case PortalTab.FORUM:
          return <MessageBoard currentUser={user} onLoginRequest={handleJoinForumRequest} isPro={effectiveProAccess} onUpgradeRequest={() => setShowPaywall(true)} onVoiceDeepDive={handleVoiceDeepDive} />;
        case PortalTab.SAVED_INTEL:
          return (
            <SavedIntel 
              isPro={effectiveProAccess} 
              onRequestPro={requestProAccess} 
              isPreview={!effectiveProAccess || !user}
              onShowPaywall={() => setShowPaywall(true)}
              onShowAuth={() => { setShowAuth(true); }}
              onRescan={handleRescan}
              onVoiceDeepDive={handleVoiceDeepDive}
              mode="College"
            />
          );
        case PortalTab.NIL_BIG_BOARD:
          return <NILBigBoard isPro={effectiveProAccess && user !== null} onUpgradeRequest={() => { if (!user) setShowAuth(true); else setShowPaywall(true); }} />;
        case PortalTab.ADMIN_MEMBERS:
          return isAdmin ? <AdminMemberManager /> : <PortalDashboard isPro={effectiveProAccess} onRequestPro={requestProAccess} onVoiceDeepDive={handleVoiceDeepDive} />;
        case PortalTab.HELP_CENTER:
          return <HelpCenter />;
        default:
          return <PortalDashboard isPro={effectiveProAccess} onRequestPro={requestProAccess} onVoiceDeepDive={handleVoiceDeepDive} />;
      }
    } catch (e) {
      console.error("Tab Render Error:", e);
      return <div className="p-20 text-center text-slate-500">System initialization failure in this module.</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden flex-col md:flex-row">
      <ProgramBlueprintModal 
        isOpen={showBlueprint} 
        onClose={() => setShowBlueprint(false)} 
        onSave={handleSaveBlueprint} 
        initialBlueprint={user?.blueprint} 
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0d121f] border-r border-slate-800 animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isPro={effectiveProAccess} 
                isAdmin={isAdmin}
                onUpgrade={() => setShowPaywall(true)} 
                onAdminToggle={handleRequestAdmin}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
              />
           </div>
        </div>
      )}

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#0d121f] border-b border-slate-800/50 z-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-300 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <h1 className="text-sm font-black text-white tracking-tighter uppercase italic">PortalIntel</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={() => setShowBlueprint(true)} className="p-2 text-blue-500 bg-blue-500/10 rounded-lg border border-blue-500/20">
               <Building2 className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleJoinForumRequest} className="p-2 text-slate-400 bg-slate-800 rounded-lg">
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isPro={effectiveProAccess} 
        isAdmin={isAdmin}
        onUpgrade={() => setShowPaywall(true)} 
        onAdminToggle={handleRequestAdmin}
      />
      
      <main ref={mainScrollRef} className="flex-1 overflow-y-auto relative scroll-smooth bg-[#080d1a]">
        {/* Desktop Header Nav */}
        <div className="hidden md:flex justify-between items-center p-6 pb-2 max-w-7xl mx-auto print:hidden">
          <div className="flex items-center gap-4">
             {user && (
               <button 
                 onClick={() => setShowBlueprint(true)}
                 className="flex items-center gap-3 px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all shadow-xl group"
               >
                  <Building2 className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    {user.blueprint ? `Blueprint: ${user.blueprint.schoolName}` : 'Establish Program DNA'}
                  </span>
               </button>
             )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-5 py-2.5 rounded-2xl shadow-xl">
                <div className="text-right">
                  <p className="text-xs font-black text-white uppercase tracking-tight leading-none mb-1">{user.name}</p>
                  <p className="text-[8px] text-blue-500 font-black uppercase tracking-widest leading-none">AUTHORIZED: {user.role}</p>
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-all active:scale-90" title="Revoke Session">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleJoinForumRequest}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-8 py-2.5 rounded-2xl border border-slate-800 text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
              >
                Initialize Scout Session
              </button>
            )}
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full flex flex-col">
           <div className="flex-1">
             {renderContent()}
           </div>
           
           <footer className="mt-20 py-12 border-t border-slate-900/50 text-center space-y-4 print:hidden px-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.3em]">Authorized Grounding Relay v4.2</span>
              </div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] leading-relaxed">
                Proprietary Scout Intel • 2026 Patent Pending
              </p>
           </footer>
        </div>
      </main>

      <PremiumGate isOpen={showPaywall} onClose={() => setShowPaywall(false)} onUpgrade={handleUpgradeSuccess} onAdminGrant={handleRequestAdmin} onLoginClick={() => { setShowAuth(true); }} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} isPro={effectiveProAccess} />
    </div>
  );
}
