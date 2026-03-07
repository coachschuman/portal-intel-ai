
import React, { useState } from 'react';
import { Shield, Lock, User, CheckCircle, Loader2, X, Trophy, Fingerprint, Activity, Crown, Zap, PartyPopper, AlertTriangle, Settings, Mail, RefreshCw, ArrowLeft, MailCheck, Database, ZapOff } from 'lucide-react';
import { ScoutUser } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { dispatchScoutingReport } from '../services/email';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: ScoutUser) => void;
  isPro?: boolean;
  mode?: 'login' | 'register' | 'recovery';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, isPro, mode: initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(initialMode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDirectRetry, setShowDirectRetry] = useState(false);

  if (!isOpen) return null;

  const isRegister = mode === 'register';
  const isRecovery = mode === 'recovery';
  const hasConfig = isSupabaseConfigured();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isRecovery) {
      if (!email.trim()) { setError("Recovery email is required."); return; }
    } else {
      if (!handle.trim()) { setError("Scout handle is required."); return; }
      if (!password.trim()) { setError("Intelligence key (password) is required."); return; }
    }
    
    setIsVerifying(true);
    
    try {
      if (isRecovery) {
        if (!hasConfig) {
          setError("Recovery requires Cloud Relay. Environment keys missing.");
          setIsVerifying(false);
          return;
        }

        const { data, error: dbError } = await supabase
          .from('portal_members')
          .select('name, password, handle')
          .eq('email', email.toLowerCase().trim())
          .single();

        if (dbError || !data) {
          setError("No scout identity found with that recovery email.");
        } else {
          const subject = "PortalIntel Scout Recovery: Intelligence Key Retrieval";
          const body = `Identity: ${data.name}\nHandle: ${data.handle}\n\nYour Intelligence Key is: ${data.password}\n\nSecure this key immediately. Do not share with unauthorized staff.`;
          
          await dispatchScoutingReport(
            email.toLowerCase().trim(),
            subject,
            body,
            (status) => {
               if (status.step === 'success') {
                 setSuccess("Intelligence key dispatched to your recovery inbox.");
               } else if (status.step === 'security_block') {
                 setError("Automated relay blocked. Please contact system admin for manual recovery.");
               }
            }
          );
        }
      } else {
        const cleanHandle = handle.replace(/^@/, '').toLowerCase().trim();
        
        // --- MASTER ADMIN BYPASS PROTOCOL (Coach Schuman Priority Access) ---
        if ((cleanHandle === 'coachschuman' || cleanHandle === 'schuman') && (password === '362511davE?!?!' || password === 'scout-master-2025' || password === '362511dave')) {
          const adminUser: ScoutUser = {
            id: 'admin-1',
            name: 'Coach Schuman',
            handle: '@coachschuman',
            role: 'Admin',
            accessLevel: 'Enterprise',
            isVerified: true,
            password: password,
            createdAt: Date.now()
          };
          onLogin(adminUser);
          setIsVerifying(false);
          return;
        }

        if (!hasConfig && !showDirectRetry) {
          setError("System Warning: Cloud database not linked. Verify your environment variables.");
          setShowDirectRetry(true);
          setIsVerifying(false);
          return;
        }

        const { data, error: dbError } = await supabase
          .from('portal_members')
          .select('*')
          .eq('handle', cleanHandle)
          .eq('password', password)
          .single();

        if (dbError || !data) {
          setError("Invalid identity handle or intelligence key.");
        } else {
          const scoutUser: ScoutUser = {
            id: data.id,
            name: data.name,
            email: data.email,
            handle: data.handle,
            role: data.role,
            accessLevel: data.access_level,
            isVerified: data.is_verified,
            password: data.password,
            createdAt: new Date(data.created_at).getTime()
          };
          onLogin(scoutUser);
        }
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      setError(err.message || "Cloud authentication relay failed. Check connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0b1224] w-full max-w-lg rounded-[3rem] border border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isRegister ? 'from-amber-400 via-yellow-500 to-amber-400' : isRecovery ? 'from-purple-600 via-indigo-500 to-purple-600' : 'from-blue-600 via-emerald-500 to-blue-600'} animate-gradient-x`}></div>
        
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all p-2 bg-slate-900 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center p-10 md:p-14">
          <div className="relative mb-8">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border shadow-2xl ${
              isRegister ? 'bg-amber-500/10 border-amber-500/20' : 
              isRecovery ? 'bg-purple-600/10 border-purple-500/20' :
              'bg-blue-600/10 border-blue-500/20'
            }`}>
              {isRegister ? <PartyPopper className="w-10 h-10 text-amber-500" /> : 
               isRecovery ? <RefreshCw className="w-10 h-10 text-purple-400" /> :
               <Shield className="w-10 h-10 text-blue-400" />}
            </div>
            {(isPro || isRegister) && (
              <div className="absolute -bottom-2 -right-2 bg-amber-500 rounded-xl p-2 border-4 border-slate-900 shadow-2xl">
                 <Crown className="w-4 h-4 text-slate-950" />
              </div>
            )}
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter uppercase italic">
            {isRegister ? 'Access Granted' : 
             isRecovery ? 'Key Recovery' : 
             'Scout Identity'}
          </h2>

          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mb-10 max-w-[280px] leading-relaxed">
            {isRecovery ? 'Verify your recovery email to retrieve your key.' : 'Initialize your secure scouting session.'}
          </p>

          {error && (
            <div className="w-full mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-black uppercase tracking-tight animate-shake">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-8 p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
                <MailCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-emerald-500 text-sm font-black uppercase tracking-widest leading-relaxed">{success}</p>
              <button 
                onClick={() => { setMode('login'); setSuccess(null); }}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all mt-2"
              >
                Back to Session Entry
              </button>
            </div>
          )}
          
          {!success && (
            <form onSubmit={handleAuth} className="w-full space-y-6">
              {isRecovery ? (
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-900 rounded-lg group-focus-within:bg-purple-600/20 transition-all">
                    <Mail className="w-4 h-4 text-purple-500" />
                  </div>
                  <input
                    type="email"
                    placeholder="ENTER RECOVERY EMAIL"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0d1526] border-2 border-slate-800 rounded-2xl py-6 pl-16 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/50 transition-all font-black text-lg shadow-inner"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-900 rounded-lg group-focus-within:bg-blue-600/20 transition-all">
                        <User className={`w-4 h-4 ${isRegister ? 'text-amber-500' : 'text-slate-500'}`} />
                      </div>
                      <input
                        type="text"
                        placeholder={isRegister ? "CHOOSE SCOUT HANDLE (LOWERCASE)" : "HANDLE (LOWERCASE ONLY)"}
                        value={handle}
                        onChange={(e) => setHandle(e.target.value.toLowerCase())}
                        className="w-full bg-[#0d1526] border-2 border-slate-800 rounded-2xl py-6 pl-16 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all font-black text-lg shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-900 rounded-lg group-focus-within:bg-blue-600/20 transition-all">
                        <Lock className={`w-4 h-4 ${isRegister ? 'text-amber-500' : 'text-slate-500'}`} />
                      </div>
                      <input
                        type="password"
                        placeholder="INTELLIGENCE KEY (LOWERCASE)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value.toLowerCase())}
                        className="w-full bg-[#0d1526] border-2 border-slate-800 rounded-2xl py-6 pl-16 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all font-black text-lg shadow-inner"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <button
                type="submit"
                className={`w-full py-6 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] text-sm ${
                  isRegister 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/20' 
                    : isRecovery
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                } active:scale-95 transform hover:scale-[1.01]`}
              >
                {isVerifying ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                 isRegister ? 'Finalize Pro Access' : 
                 isRecovery ? 'Dispatch Recovery Key' : 
                 'Initialize Session'}
              </button>
            </form>
          )}

          <div className="mt-8 flex flex-col gap-5 w-full">
            {!isRecovery ? (
              <button 
                onClick={() => { setMode('recovery'); setError(null); }}
                className="text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group"
              >
                <Lock className="w-3.5 h-3.5 group-hover:text-blue-500 transition-colors" /> Forgot Intelligence Key?
              </button>
            ) : (
              <button 
                onClick={() => { setMode('login'); setError(null); }}
                className="text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Session Entry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
