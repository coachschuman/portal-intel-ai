
import React, { useState, useEffect, useRef } from 'react';
import { ForumPost, Attachment, ScoutUser, ForumCategory, ForumBoard } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { 
  MessageSquare, Send, User, Sparkles, TrendingUp, Filter, ThumbsUp, Brain, 
  Loader2, AlertCircle, Bookmark, Megaphone, Paperclip, FileText, Table, 
  FileSearch, Bold, Italic, List, X, ExternalLink, Volume2, Lock, ShieldCheck, 
  Crown, UserPlus, GraduationCap, DollarSign, MapPin, Search, CornerDownRight, 
  Plus, Layout, Globe, Image as ImageIcon, Share2, FolderKanban, Info, ChevronRight,
  MoreVertical, FileUp, Hash, RefreshCw
} from 'lucide-react';
import { ScoutingAudioPlayer } from './ScoutingAudioPlayer';
import { EmailIntelModal } from './EmailIntelModal';

interface MessageBoardProps {
  currentUser: ScoutUser | null;
  onLoginRequest: () => void;
  isPro: boolean;
  onUpgradeRequest: () => void;
  // Added onVoiceDeepDive to props interface
  onVoiceDeepDive?: (context: string) => void;
}

const CATEGORIES: { id: ForumCategory; label: string; icon: any; color: string }[] = [
  { id: 'Entry', label: 'Portal Entry', icon: UserPlus, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { id: 'Commitment', label: 'Commitment', icon: GraduationCap, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { id: 'NIL Intel', label: 'NIL Intel', icon: DollarSign, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { id: 'OV Intel', label: 'OV Intel', icon: MapPin, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  { id: 'Roster Needs', label: 'Roster Needs', icon: Search, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { id: 'Analysis', label: 'Scout Analysis', icon: Brain, color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' },
  { id: 'Rumor', label: 'Portal Rumor', icon: Megaphone, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
  { id: 'Withdrawal', label: 'Withdrawal', icon: CornerDownRight, color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
];

// Destructured onVoiceDeepDive from props
export const MessageBoard: React.FC<MessageBoardProps> = ({ currentUser, onLoginRequest, isPro, onUpgradeRequest, onVoiceDeepDive }) => {
  const [boards, setBoards] = useState<ForumBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string>('');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ForumCategory>('Analysis');
  const [activeFilter, setActiveFilter] = useState<ForumCategory | 'All'>('All');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const hasConfig = isSupabaseConfigured();

  useEffect(() => {
    if (hasConfig) {
      fetchBoards();
    }
  }, [hasConfig]);

  useEffect(() => {
    if (activeBoardId && hasConfig) {
      fetchPosts();
    }
  }, [activeBoardId, activeFilter]);

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase.from('portal_boards').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setBoards(data);
        setActiveBoardId(data[0].id);
      }
    } catch (err) {
      console.error("Board Fetch Error:", err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('portal_posts').select('*').eq('board_id', activeBoardId).order('created_at', { ascending: false });
      if (activeFilter !== 'All') {
        query = query.eq('category', activeFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      setPosts(data.map(p => ({
        id: p.id,
        boardId: p.board_id,
        author: p.author_name,
        role: p.author_role as any,
        title: p.title,
        content: p.content,
        category: p.category as any,
        timestamp: new Date(p.created_at).getTime(),
        upvotes: p.upvotes,
        aiTake: p.ai_take
      })));
    } catch (err) {
      console.error("Post Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { onLoginRequest(); return; }
    const content = editorRef.current?.innerHTML || '';
    if (!title.trim() || !content.trim() || !hasConfig) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('portal_posts').insert([{
        board_id: activeBoardId,
        author_name: currentUser.name,
        author_role: currentUser.role,
        title,
        content,
        category,
        upvotes: 0
      }]);
      if (error) throw error;
      
      setTitle('');
      if (editorRef.current) editorRef.current.innerHTML = '';
      fetchPosts();
    } catch (err) {
      console.error("Publish Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    if (!hasConfig) return;
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const { error } = await supabase.from('portal_posts').update({ upvotes: post.upvotes + 1 }).eq('id', postId);
      if (error) throw error;
      // Fixed: changed 'i' to 'p.id' to correctly identify the post to update in local state
      setPosts(posts.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p));
    } catch (err) {
      console.error("Upvote Error:", err);
    }
  };

  const activeBoard = boards.find(b => b.id === activeBoardId);

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8 pb-32 animate-in fade-in duration-700">
      
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.25em] flex items-center gap-3 mb-8">
            <FolderKanban className="w-5 h-5 text-blue-400" />
            Intel Boards
          </h3>

          {!hasConfig ? (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] text-slate-500 font-bold text-center uppercase tracking-widest leading-relaxed">
              Cloud Boards Offline. Configure environment to access real-time war rooms.
            </div>
          ) : (
            <div className="space-y-1">
              {boards.map(board => (
                <button
                  key={board.id}
                  onClick={() => setActiveBoardId(board.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border ${
                    activeBoardId === board.id 
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-lg' 
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-left overflow-hidden">
                    <p className="text-[11px] font-black uppercase tracking-widest truncate">{board.name}</p>
                  </div>
                  <ChevronRight className={`ml-auto w-4 h-4 ${activeBoardId === board.id ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-8">
        {activeBoard && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                <div className="space-y-2">
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Active Intel Stream</span>
                   <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{activeBoard.name}</h2>
                </div>
                <button onClick={fetchPosts} className="p-3 bg-slate-950 rounded-xl text-blue-400 border border-slate-800">
                   <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
             </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl">
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8">Publish Intelligence</h3>
          {currentUser && isPro && hasConfig ? (
            <form onSubmit={handlePost} className="space-y-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Intelligence Subject Line..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none"
              />
              <div
                ref={editorRef}
                contentEditable
                className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-10 text-slate-100 min-h-[200px] outline-none prose prose-invert"
                // Fix: div element with contentEditable does not support 'placeholder' attribute in standard React types.
                // Using data-placeholder instead.
                data-placeholder="Detailed scouting content..."
              ></div>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Dispatch Scouting Report'}
              </button>
            </form>
          ) : (
            <div className="p-16 text-center border-2 border-dashed border-slate-800 rounded-[2rem] bg-slate-950/40">
               <Lock className="w-10 h-10 text-slate-700 mx-auto mb-4" />
               <p className="text-slate-500 font-bold uppercase tracking-widest">Initialization Required for Cloud Dispatch.</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {posts.map(post => (
            <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 hover:border-blue-500/30 transition-all shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-black">
                    {post.author.charAt(0)}
                 </div>
                 <div>
                    <p className="font-black text-white text-xl uppercase tracking-tight">{post.author}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{post.role} • {new Date(post.timestamp).toLocaleDateString()}</p>
                 </div>
              </div>
              <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter">{post.title}</h3>
              <div className="prose prose-invert max-w-none text-slate-400 mb-8" dangerouslySetInnerHTML={{ __html: post.content }}></div>
              <div className="flex items-center gap-6 pt-6 border-t border-slate-800">
                 <button onClick={() => handleUpvote(post.id)} className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 font-black text-xs uppercase transition-all">
                    <ThumbsUp className="w-4 h-4" /> {post.upvotes} Marks
                 </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && !loading && (
            <div className="py-32 text-center opacity-30">
               <MessageSquare className="w-12 h-12 mx-auto mb-4" />
               <p className="font-black uppercase tracking-[0.3em]">Board Cleared. Awaiting Intelligence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
