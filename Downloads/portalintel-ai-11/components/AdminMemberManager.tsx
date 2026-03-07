
import React, { useState, useEffect } from 'react';
import { ScoutUser, UserRole, AccessLevel } from '../types';
import { Users, UserPlus, Shield, ShieldCheck, Trash2, Search, Filter, Mail, Crown, Zap, ShieldAlert, X, Check, Loader2, ArrowRight, RefreshCw, AlertTriangle, Terminal, Copy, ClipboardCheck, Info, ExternalLink, UserCircle, Key, ChevronDown } from 'lucide-react';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../services/supabase';

export const AdminMemberManager: React.FC = () => {
  const [members, setMembers] = useState<ScoutUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<{ message: string, code?: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const hasConfig = isSupabaseConfigured();

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    handle: '',
    password: '',
    role: 'Scout' as UserRole,
    accessLevel: 'Pro' as AccessLevel
  });

  useEffect(() => {
    if (hasConfig) {
      fetchMembers();
    } else {
      setFetching(false);
    }
  }, [hasConfig]);

  const fetchMembers = async () => {
    setFetching(true);
    setError(null);
    try {
      if (!hasConfig) return;
      // CRITICAL FIX: Use supabaseAdmin to fetch members to bypass RLS in the manager view
      const { data, error } = await supabaseAdmin
        .from('portal_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setMembers(data.map(m => ({
          id: m.id,
          name: m.name || 'Unknown Scout',
          email: m.email || '',
          handle: m.handle || '@unknown',
          role: m.role || 'Scout',
          accessLevel: m.access_level || 'Free',
          isVerified: m.is_verified || false,
          password: m.password || '',
          createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now()
        })));
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError({ message: err.message || "Cloud vault unreachable. Verify Service Role Key." });
    } finally {
      setFetching(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validation
    if (!newMember.name.trim()) { setError({ message: "Name Signature is required." }); return; }
    if (!newMember.email.trim() || !newMember.email.includes('@')) { setError({ message: "Valid recovery email is required." }); return; }
    if (!newMember.handle.trim()) { setError({ message: "Grid Handle is required." }); return; }
    const cleanHandle = newMember.handle.replace(/^@/, '').toLowerCase().trim();
    if (!/^[a-z][a-z0-9_]{2,31}$/.test(cleanHandle)) { 
      setError({ message: "Handle must start with a letter, use only lowercase letters/numbers/underscores, and be 3-32 characters." }); 
      return; 
    }
    if (!newMember.password || newMember.password.length < 4) { setError({ message: "Intelligence key must be 4+ characters." }); return; }

    if (!hasConfig) {
      setError({ message: "System Relay Offline: Supabase configuration missing." });
      return;
    }

    setLoading(true);
    try {
      // Strip @ prefix and force lowercase to match DB constraint: ^[a-z][a-z0-9_]{2,31}$
      const userHandle = newMember.handle.replace(/^@/, '').toLowerCase().trim();
      
      // CRITICAL: Using supabaseAdmin (Service Role) to bypass RLS for administrative entry
      const { data, error: dbError } = await supabaseAdmin
        .from('portal_members')
        .insert([
          {
            name: newMember.name.trim(),
            email: newMember.email.toLowerCase().trim(),
            handle: userHandle.trim(),
            password: newMember.password.toLowerCase().trim(), // Administrative forced lowercase
            role: newMember.role,
            access_level: newMember.accessLevel,
            is_verified: true
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      if (data) {
        setSuccessMsg(`Access Granted: ${newMember.name} initialized via Service Override.`);
        setTimeout(() => {
          setShowAddModal(false);
          setSuccessMsg(null);
          setNewMember({ name: '', email: '', handle: '', password: '', role: 'Scout', accessLevel: 'Pro' });
          fetchMembers();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Cloud Entry Exception:", err);
      setError({ message: err.message || "Cloud connection dropped during entry." });
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (id: string) => {
    if (id === 'admin-1') return alert("Cannot revoke primary admin.");
    if (confirm("Permanently revoke intelligence access for this member?")) {
      try {
        const { error } = await supabaseAdmin.from('portal_members').delete().eq('id', id);
        if (error) throw error;
        fetchMembers();
      } catch (err) { console.error(err); }
    }
  };

  const toggleAccess = async (id: string, currentLevel: AccessLevel) => {
    const levels: AccessLevel[] = ['Free', 'Pro', 'Enterprise'];
    const nextLevel = levels[(levels.indexOf(currentLevel) + 1) % levels.length];
    try {
      const { error } = await supabaseAdmin.from('portal_members').update({ access_level: nextLevel }).eq('id', id);
      if (error) throw error;
      fetchMembers();
    } catch (err) { console.error(err); }
  };

  const filteredMembers = (members || []).filter(m => 
    (m.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (m.handle?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (m.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-xl">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">Member Intelligence Vault</h2>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Bypass Protocol Active</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setShowAddModal(true); setError(null); setSuccessMsg(null); }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-95 flex items-center justify-center gap-3"
          >
            <UserPlus className="w-5 h-5" /> Initialize Identity
          </button>
        </div>
      </div>

      <div className="bg-[#0b1224] border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex flex-wrap items-center gap-6 bg-slate-900/40">
           <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search encrypted identity registry..."
                className="w-full bg-[#0d1526] border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-white font-bold placeholder-slate-700 focus:outline-none focus:border-blue-500/50"
              />
           </div>
           <div className="flex items-center gap-3">
              <button onClick={fetchMembers} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-blue-400 hover:bg-slate-800 shadow-xl active:scale-90">
                <RefreshCw className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`} />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40">
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Scout Signature</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Recovery Feed</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Grid Role</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Access Class</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-blue-600/[0.03] group transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xl border border-slate-700 shadow-lg">{member.name.charAt(0)}</div>
                      <div>
                        <div className="font-black text-white text-lg leading-none mb-2 uppercase tracking-tight">{member.name}</div>
                        <div className="text-xs text-blue-500 font-bold uppercase tracking-widest">{member.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-3 text-slate-400 font-medium">
                        <Mail className="w-4 h-4 opacity-30" />
                        {member.email}
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${member.role === 'Admin' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        {member.role}
                     </span>
                  </td>
                  <td className="px-10 py-8">
                    <button 
                      onClick={() => toggleAccess(member.id, member.accessLevel)} 
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-lg transition-all hover:scale-105 active:scale-95 ${
                        member.accessLevel === 'Enterprise' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 
                        member.accessLevel === 'Pro' ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 
                        'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      {member.accessLevel === 'Enterprise' ? <Crown className="w-4 h-4" /> : member.accessLevel === 'Pro' ? <Zap className="w-4 h-4 fill-current" /> : <Shield className="w-4 h-4" />}
                      {member.accessLevel}
                    </button>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button 
                      onClick={() => deleteMember(member.id)} 
                      className="p-3 text-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 bg-slate-900/50 border border-transparent hover:border-red-500/30 rounded-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fetching && (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500/40" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing Personnel Grid...</p>
            </div>
          )}
          {!fetching && filteredMembers.length === 0 && (
             <div className="py-20 text-center opacity-30">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p className="font-black uppercase tracking-[0.3em]">No personnel records found.</p>
             </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-[#0b1224] w-full max-w-2xl rounded-[3.5rem] border-2 border-slate-800 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-10 md:p-14">
               <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                        <UserPlus className="w-8 h-8 text-blue-400" />
                     </div>
                     <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tight italic">Service Override Entry</h3>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Direct Cloud Initialization</p>
                     </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-4 bg-slate-900 rounded-2xl text-slate-500 hover:text-white border border-slate-800 transition-all active:scale-90">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               {successMsg ? (
                 <div className="py-16 text-center space-y-6">
                    <div className="w-24 h-24 bg-emerald-500/10 border-4 border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                       <ShieldCheck className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h4 className="text-2xl font-black text-emerald-400 uppercase tracking-tight">{successMsg}</h4>
                 </div>
               ) : (
                 <form onSubmit={handleAddMember} className="space-y-6">
                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-tight">
                        <AlertTriangle className="w-4 h-4" />
                        {error.message}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Full Name</label>
                         <input 
                           type="text" 
                           value={newMember.name}
                           onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 font-bold"
                           placeholder="David Schuman"
                         />
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Recovery Email</label>
                         <input 
                           type="email" 
                           value={newMember.email}
                           onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 font-bold"
                           placeholder="dschuman@yahoo.com"
                         />
                       </div>
                       <div className="space-y-1.5">
                         <div className="flex justify-between items-center ml-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grid Handle</label>
                           <span className="text-[8px] font-black text-blue-500">LOWERCASE ONLY</span>
                         </div>
                         <input 
                           type="text" 
                           value={newMember.handle}
                           onChange={(e) => setNewMember({...newMember, handle: e.target.value.toLowerCase()})}
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 font-bold"
                           placeholder="coachalpha"
                         />
                       </div>
                       <div className="space-y-1.5">
                         <div className="flex justify-between items-center ml-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intelligence Key</label>
                           <span className="text-[8px] font-black text-blue-500">LOWERCASE ONLY</span>
                         </div>
                         <input 
                           type="password" 
                           value={newMember.password}
                           onChange={(e) => setNewMember({...newMember, password: e.target.value.toLowerCase()})}
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 font-bold"
                           placeholder="lowercase_key"
                         />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">System Role</label>
                          <select 
                            value={newMember.role}
                            onChange={(e) => setNewMember({...newMember, role: e.target.value as UserRole})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-black uppercase appearance-none focus:outline-none"
                          >
                             <option value="Scout">Field Scout</option>
                             <option value="Insider">Insider</option>
                             <option value="Director">Director</option>
                             <option value="Admin">Administrator</option>
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Access Class</label>
                          <select 
                            value={newMember.accessLevel}
                            onChange={(e) => setNewMember({...newMember, accessLevel: e.target.value as AccessLevel})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-black uppercase appearance-none focus:outline-none"
                          >
                             <option value="Pro">Pro Access</option>
                             <option value="Enterprise">Enterprise</option>
                             <option value="Free">Limited Free</option>
                          </select>
                       </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                      {loading ? 'Initializing Neural Relay...' : 'Initialize Identity'}
                    </button>
                 </form>
               )}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-[3rem] p-10 text-center">
         <ShieldCheck className="w-8 h-8 text-emerald-500/10 mx-auto mb-4" />
         <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] leading-loose max-w-3xl mx-auto">
            Cloud Personnel Infrastructure Ref v4.2 • Admin Service Override Enabled <br/>
            Bypassing Stripe verification via Service Role Key injection.
         </p>
      </div>
    </div>
  );
};
