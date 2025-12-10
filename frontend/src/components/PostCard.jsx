import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Share2, MoreHorizontal, Check, Trash2, Flag, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../api/axios';

const REACTIONS = [
    { type: 'like', label: '👍', color: 'text-blue-500' },
    { type: 'love', label: '❤️', color: 'text-red-500' },
    { type: 'haha', label: '😂', color: 'text-yellow-500' },
    { type: 'wow',  label: '😮', color: 'text-orange-500' },
    { type: 'sad',  label: '😢', color: 'text-blue-300' },
    { type: 'angry', label: '😡', color: 'text-red-600' },
];

const PostCard = ({ post, onDelete }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const isMyPost = user?.id === post.user_id; 

  // CORRECTION : Gestion de l'avatar utilisateur connecté
  const currentUserAvatar = user?.avatar || user?.avatar_url;

  // STATES
  const [reaction, setReaction] = useState(null);
  const [likeCount, setLikeCount] = useState(parseInt(post.like_count) || 0);
  const [commentCount, setCommentCount] = useState(parseInt(post.comments_count) || 0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // States Menu & Commentaires
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Sécurité date
  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };
  
  const timeAgo = getTimeAgo(post.created_at);

  // Helper Image
 const getAvatarUrl = (path) => {
    if (!path) return null;
    // Si ça commence par http (Cloudinary), on affiche. Sinon, rien (null).
    return path.startsWith('http') ? path : null; 
};

  // --- LOGIQUE ACTIONS ---

  const handleReaction = async (type) => {
    if (reaction === type) { setReaction(null); setLikeCount(prev => prev - 1); }
    else { if (!reaction) setLikeCount(prev => prev + 1); setReaction(type); }
    setShowEmojiPicker(false);
    try { await api.post(`/posts/${post.id}/react`, { type }); } catch (err) {}
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce post ?")) return;
    try {
        await api.delete(`/posts/${post.id}`);
        if (onDelete) onDelete(post.id);
    } catch (err) { console.error("Erreur suppression", err); }
  };

  const toggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
        setLoadingComments(true);
        try {
            const res = await api.get(`/posts/${post.id}/comments`);
            setComments(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingComments(false); }
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
        const res = await api.post(`/posts/${post.id}/comments`, { content: newComment });
        // CORRECTION : On utilise currentUserAvatar ici pour l'affichage immédiat
        setComments([...comments, { 
            ...res.data, 
            username: user.username, 
            avatar_url: currentUserAvatar 
        }]);
        setNewComment('');
        setCommentCount(prev => prev + 1);
    } catch (err) { console.error(err); }
  };

  const currentReactionIcon = REACTIONS.find(r => r.type === reaction)?.label || '👍';
  const currentReactionColor = REACTIONS.find(r => r.type === reaction)?.color || 'text-textSub';

  // Récupération sécurisée de l'avatar du post
  const postAvatar = post.avatar_url || post.avatar;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-secondary border border-borderCol rounded-2xl p-4 mb-4">
      
      <div className="flex gap-4 relative">
        {/* Avatar du Posteur */}
        <div className="w-12 h-12 rounded-full bg-accent/20 border-2 border-accent overflow-hidden shrink-0 flex items-center justify-center">
            {postAvatar ? (
                <img src={getAvatarUrl(postAvatar)} className="w-full h-full object-cover" alt={post.username}/>
            ) : (
                <div className="font-bold text-accent">{post.username?.[0]}</div>
            )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-bold text-textMain">{post.username}</span>
              <span className="text-textSub text-sm ml-2">· {timeAgo}</span>
            </div>
            
            {/* MENU CONTEXTUEL */}
            <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="text-textSub hover:text-accent p-1 rounded-full hover:bg-primary transition-colors">
                    <MoreHorizontal size={20} />
                </button>
                
                <AnimatePresence>
                    {showMenu && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute right-0 top-full mt-2 w-40 bg-secondary border border-borderCol rounded-xl shadow-xl z-20 overflow-hidden"
                        >
                            {isMyPost ? (
                                <button onClick={handleDelete} className="flex items-center gap-2 w-full p-3 text-red-500 hover:bg-primary text-sm font-bold">
                                    <Trash2 size={16} /> Supprimer
                                </button>
                            ) : (
                                <button onClick={() => setShowMenu(false)} className="flex items-center gap-2 w-full p-3 text-textMain hover:bg-primary text-sm">
                                    <Flag size={16} /> Signaler
                                </button>
                            )}
                             <button onClick={() => setShowMenu(false)} className="flex items-center gap-2 w-full p-3 text-textSub hover:bg-primary text-sm border-t border-borderCol">
                                <X size={16} /> Annuler
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </div>

          <p className="mt-2 text-textMain whitespace-pre-wrap">{post.content}</p>
          
          {/* Médias */}
          {post.media_url && post.media_type === 'image' && (
            <img src={getAvatarUrl(post.media_url)} className="mt-3 rounded-xl w-full max-h-96 object-cover border border-borderCol" alt="media" />
          )}
          
          {post.media_type === 'code' && (
            <pre className="mt-3 bg-[#1e1e1e] p-4 rounded-xl text-sm text-green-400 overflow-x-auto font-mono border border-gray-700">
                <code>{post.code_snippet}</code>
            </pre>
          )}

          {/* BARRE D'ACTIONS */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-borderCol">
            
            {/* Réactions */}
            <div className="relative" onMouseEnter={() => setShowEmojiPicker(true)} onMouseLeave={() => setShowEmojiPicker(false)}>
                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -45 }} exit={{ opacity: 0 }} className="absolute left-0 bottom-full mb-2 flex gap-1 bg-secondary border border-borderCol p-2 rounded-full shadow-2xl z-20">
                            {REACTIONS.map(r => <button key={r.type} onClick={() => handleReaction(r.type)} className="text-2xl hover:scale-125 transition-transform p-1">{r.label}</button>)}
                        </motion.div>
                    )}
                </AnimatePresence>
                <button onClick={() => handleReaction(reaction || 'like')} className={`flex items-center gap-2 px-2 py-1 rounded-lg ${currentReactionColor} hover:bg-primary`}>
                    <span className="text-xl">{reaction ? currentReactionIcon : '👍'}</span>
                    <span className="font-medium">{likeCount || 'J\'aime'}</span>
                </button>
            </div>

            {/* Bouton Commentaires */}
            <button onClick={toggleComments} className="flex items-center gap-2 text-textSub hover:text-accent hover:bg-primary px-2 py-1 rounded-lg transition-colors">
              <MessageCircle size={20} />
              <span>{commentCount || 0}</span>
            </button>

            {/* Bouton Partage */}
            <button onClick={handleShare} className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${copied ? 'text-green-500' : 'text-textSub hover:text-green-500 hover:bg-primary'}`}>
              {copied ? <Check size={20} /> : <Share2 size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION COMMENTAIRES */}
      <AnimatePresence>
        {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 pt-4 border-t border-borderCol pl-0 md:pl-16">
                    {/* Liste */}
                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {loadingComments ? <div className="text-sm text-textSub">Chargement...</div> : (
                            comments.map((c, i) => {
                                const commentAvatar = c.avatar_url || c.avatar;
                                return (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-accent/20 overflow-hidden shrink-0 flex items-center justify-center">
                                            {commentAvatar ? (
                                                <img src={getAvatarUrl(commentAvatar)} className="w-full h-full object-cover" alt={c.username}/>
                                            ) : (
                                                <div className="text-center leading-8 font-bold text-xs text-accent">{c.username?.[0]}</div>
                                            )}
                                        </div>
                                        <div className="bg-primary p-3 rounded-2xl rounded-tl-none text-sm border border-borderCol">
                                            <div className="font-bold text-xs text-textSub mb-1">{c.username}</div>
                                            <div className="text-textMain">{c.content}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {!loadingComments && comments.length === 0 && <div className="text-xs text-textSub italic">Soyez le premier à commenter !</div>}
                    </div>

                    {/* Input */}
                    <form onSubmit={sendComment} className="flex gap-2">
                         <div className="w-8 h-8 rounded-full bg-accent/20 overflow-hidden shrink-0 flex items-center justify-center">
                            {currentUserAvatar ? (
                                <img src={getAvatarUrl(currentUserAvatar)} className="w-full h-full object-cover" alt="Me"/>
                            ) : (
                                <div className="text-center leading-8 font-bold text-xs text-accent">{user?.username?.[0]}</div>
                            )}
                        </div>
                        <input 
                            value={newComment} onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Écrire un commentaire..."
                            className="flex-1 bg-primary border border-borderCol rounded-full px-4 py-2 text-sm outline-none focus:border-accent text-textMain"
                        />
                        <button type="submit" className="bg-accent p-2 rounded-full text-white hover:bg-accentHover disabled:opacity-50" disabled={!newComment.trim()}>
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default PostCard;