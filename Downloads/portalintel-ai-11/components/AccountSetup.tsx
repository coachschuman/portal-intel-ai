import React, { useState } from 'react';
/* Fix: Removed duplicate CheckCircle identifier from lucide-react imports */
import { Shield, Lock, User, CheckCircle, Loader2, PartyPopper, Fingerprint, Activity, Mail, Zap, Crown } from 'lucide-react';
import { ScoutUser } from '../types';
import { supabase } from '../services/supabase';

interface AccountSetupProps {
  onComplete: (user: ScoutUser) => void;
}

export const AccountSetup: React.FC<AccountSetupProps> = ({ onComplete }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    
    // IMPLEMENTED REQUESTED NORMALIZATION LOGIC
    const userHandle = (handle.startsWith('@') ? handle : `@${handle}`).toLowerCase();

    try {
      const { data, error: dbError } = await supabase
        .from('portal_members')
        .insert([
          {
            name: fullName || handle,
            email: email.toLowerCase().trim(),
            handle: userHandle,
            password: password.toLowerCase().trim(), // Ensure password is also saved as lowercase
            role: 'Scout',
            access_level: 'Pro',
            is_verified: true
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      if (data) {
        onComplete({
          id: data.id,
          name: data.name,
          email: data.email,
          handle: data.handle,
          role: data.role,
          accessLevel: data.access_level,
          isVerified: data.is_verified,
          password: data.password,
          createdAt: new Date(data.created_at).getTime()
        });
      }
    } catch (err: any) {
      console.error("Database Entry Failed:", err);
      setError(err.message || "Failed to establish cloud personnel record.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 overflow-y-auto">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] -mr-96 -mt-96 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-amber-600/5 rounded-full blur-[150px] -ml-96 -mb-96 pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 animate-gradient-x"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <PartyPopper className="w-10 h-10 text-amber-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-500 rounded-xl p-2 border-4 border-slate-900 shadow-xl">
               <Crown className="w-4 h-4 text-slate-950" />
            </div>
          </div>
          
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight uppercase">Access Authorized</h1>
          <p className="text-slate-400 text-lg mb-10 max-w-md leading-relaxed font-medium">
            Initialize your unique Scout Identity in the cloud database.
          </p>

          {error && <p className="mb-6 text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

          <form onSubmit={handleSetup} className="w-full max-w-md space-y-6">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Full Name / Signature</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
                <input
                  type="text"
                  required
                  placeholder="e.g. David Schuman"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Recovery Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
                <input
                  type="email"
                  required
                  placeholder="scout@recruiting.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center ml-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Authorized Handle</label>
                <span className="text-[9px] font-black text-amber-500 uppercase">LOWERCASE ONLY</span>
              </div>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 font-black text-lg">@</div>
                <input
                  type="text"
                  required
                  placeholder="recruiter_alpha (lowercase)"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center ml-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intelligence Access Key</label>
                <span className="text-[9px] font-black text-amber-500 uppercase">LOWERCASE ONLY</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
                <input
                  type="password"
                  required
                  placeholder="secure_key (lowercase)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.toLowerCase())}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-4.5 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-500/50 transition-all font-bold text-lg"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isVerifying || !handle.trim() || !password.trim() || !email.trim()}
              className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-2xl shadow-amber-900/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-sm disabled:opacity-50 mt-8"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synchronizing with Cloud...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Establish Scout Session
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-800 w-full flex flex-col md:flex-row items-center justify-center gap-6 opacity-60">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Supabase Cloud Synced
            </div>
            <div className="hidden md:block h-1 w-1 rounded-full bg-slate-700"></div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Fingerprint className="w-4 h-4 text-blue-400" />
              Encrypted Personnel Records
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};