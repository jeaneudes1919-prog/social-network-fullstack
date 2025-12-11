import { useEffect, useState } from 'react';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { Loader2, Zap, Code, Coffee, Sparkles, Plus, X, Trash2, Image as ImageIcon, Type, Send, Palette, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
const STORY_THEMES = [
    'bg-gradient-to-br from-purple-600 to-blue-500', 'bg-gradient-to-br from-pink-500 to-orange-400',
    'bg-gradient-to-br from-teal-400 to-yellow-200', 'bg-gradient-to-br from-gray-900 to-gray-600',
    'bg-gradient-to-br from-red-500 to-pink-500',    'bg-gradient-to-br from-green-400 to-blue-500',
    'bg-gradient-to-br from-indigo-500 to-purple-500','bg-gradient-to-br from-yellow-400 to-orange-500',
    'bg-gradient-to-br from-blue-800 to-indigo-900',  'bg-gradient-to-br from-rose-400 to-red-500',
    'bg-gradient-to-r from-slate-900 to-slate-700',   'bg-gradient-to-br from-cyan-500 to-blue-500'
];

const QUICK_REACTIONS = ['🔥', '😂', '❤️', '😮', '👏', '😢'];

const Home = () => {
  // --- STATES ---
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Pour toi');
  
  // UI States : Visionneuse & Créateur
  const [viewingStory, setViewingStory] = useState(null);
  const [creatingStory, setCreatingStory] = useState(false);
  const [storyType, setStoryType] = useState('image');
  const [showViewersList, setShowViewersList] = useState(false); 
  const [viewersData, setViewersData] = useState([]); 

  // Contenu Story Texte
  const [textStoryContent, setTextStoryContent] = useState('');
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  const user = JSON.parse(localStorage.getItem('user'));

  // --- HELPERS (CORRECTION LOCALE) ---
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "À l'instant";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return "Il y a +24h";
  };

  // CORRECTION CLOUDINARY
  const getAvatarUrl = (path) => {
    if (!path) return null;
    // Si l'URL commence par http (Cloudinary), on la retourne directement
    if (path.startsWith('http')) return path;
    // Sinon (si c'était un ancien path local), on ignore pour éviter le localhost
    return null; 
  };

  // --- 1. CHARGEMENT DONNÉES ---
  const fetchPosts = async (filter = 'Pour toi') => {
    setLoading(true);
    try {
      const query = filter === 'Pour toi' ? '' : `?category=${filter}`;
      const res = await api.get(`/posts${query}`);
      setPosts(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const fetchStories = async () => {
    try {
        const res = await api.get('/posts/stories');
        setStories(res.data);
    } catch (err) { console.error(err); }
  };

  // --- 2. LOGIQUE VISIONNEUSE ---
  const openStory = async (story) => {
    setViewingStory(story);
    setShowViewersList(false); // On cache la liste par défaut
    
    // Si ce n'est pas ma story, je signale que je l'ai vue
    if (story.user_id !== user.id) {
        try { await api.post(`/posts/stories/${story.id}/view`); } catch(e){ console.error(e) }
    } else {
        // Si c'est ma story, je charge directement les stats
        loadViewers(story.id);
    }
  };

  const loadViewers = async (storyId) => {
      try {
          const res = await api.get(`/posts/stories/${storyId}/viewers`);
          setViewersData(res.data);
      } catch (err) { console.error(err); }
  };

  const handleReaction = async (emoji) => {
    // Petit effet visuel
    const btn = document.getElementById(`reaction-${emoji}`);
    if(btn) {
        btn.style.transform = "scale(1.5)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
    }

    try {
        await api.post(`/posts/stories/${viewingStory.id}/react`, { reaction: emoji });
    } catch (err) { console.error(err); }
  };

  // --- 3. LOGIQUE CRÉATION ---
  const handleImageStoryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('media', file);
    formData.append('theme', 'Simple'); // Ajout du thème par défaut pour le backend
    
    try {
        await api.post('/posts/stories', formData);
        closeCreator();
        fetchStories();
    } catch (err) { alert("Erreur upload"); }
  };

  const handleTextStoryUpload = async (e) => {
    e.preventDefault();
    if (!textStoryContent.trim()) return;
    try {
        await api.post('/posts/stories', { 
            content: textStoryContent,
            theme: STORY_THEMES[currentThemeIndex] 
        }); 
        closeCreator();
        fetchStories();
    } catch (err) { alert("Erreur création"); }
  };

  const closeCreator = () => {
    setCreatingStory(false);
    setTextStoryContent('');
    setCurrentThemeIndex(0);
    setStoryType('image');
  };

  const cycleTheme = () => setCurrentThemeIndex((prev) => (prev + 1) % STORY_THEMES.length);

  // --- 4. SUPPRESSION & ACTIONS ---
  const handleDeleteStory = async (storyId) => {
    if(!window.confirm("Supprimer cette story ?")) return;
    try {
        await api.delete(`/posts/stories/${storyId}`);
        setViewingStory(null);
        fetchStories();
    } catch (err) { console.error(err); }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    fetchPosts(filter);
  };

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  // Init
  useEffect(() => {
    fetchPosts(activeFilter);
    fetchStories();
  }, []);

  const filters = [
    { label: 'Pour toi', icon: Sparkles },
    { label: 'Code', icon: Code },
    { label: 'Chill', icon: Coffee },
    { label: 'News', icon: Zap },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. BARRE DE STORIES */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide select-none">
        
        {/* BOUTON AJOUTER */}
        <div 
            onClick={() => setCreatingStory(true)}
            className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 relative transition-transform hover:scale-105"
        >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-textSub group-hover:border-accent flex items-center justify-center bg-secondary transition-colors">
                <Plus size={24} className="text-textSub group-hover:text-accent"/>
            </div>
            <span className="text-xs font-medium text-textSub">Ajouter</span>
        </div>

        {/* LISTE DES STORIES */}
        {stories.map((story) => (
            <motion.div 
                whileHover={{ scale: 1.05 }}
                key={story.id} 
                className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
                onClick={() => openStory(story)}
            >
                <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-accent to-purple-500`}>
                    <div className={`w-full h-full rounded-full bg-primary border-2 border-primary overflow-hidden relative flex items-center justify-center ${story.media_type === 'text' ? story.theme || STORY_THEMES[0] : 'bg-gray-800'}`}>
                        {story.media_type === 'image' && story.avatar_url ? (
                            // Utilisation de getAvatarUrl pour l'avatar dans la liste
                            <img src={getAvatarUrl(story.avatar_url)} className="w-full h-full object-cover"/>
                        ) : story.media_type === 'image' ? (
                            <span className="font-bold text-white">{story.username[0]}</span>
                        ) : (
                            <Type size={20} className="text-white drop-shadow-md"/> 
                        )}
                    </div>
                </div>
                <span className="text-xs font-medium max-w-[64px] truncate">{story.username}</span>
            </motion.div>
        ))}
      </div>

      {/* 2. VISIONNEUSE DE STORY (MODAL PLEIN ÉCRAN) */}
      <AnimatePresence>
        {viewingStory && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex items-center justify-center"
                onClick={() => setViewingStory(null)}
            >
                <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden flex flex-col bg-black shadow-2xl border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/60 to-transparent z-20 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/50 bg-gray-500">
                                 {/* Utilisation de getAvatarUrl ici aussi */}
                                 {viewingStory.avatar_url ? <img src={getAvatarUrl(viewingStory.avatar_url)} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-white">{viewingStory.username[0]}</div>}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold drop-shadow-md text-sm">{viewingStory.username}</span>
                                <span className="text-white/70 text-xs">{getTimeAgo(viewingStory.created_at)}</span>
                            </div>
                        </div>
                        <button onClick={() => setViewingStory(null)}><X className="text-white" size={28}/></button>
                    </div>

                    {/* --- CONTENU --- */}
                    <div className="flex-1 flex items-center justify-center bg-[#1a1a1a] relative overflow-hidden">
                        
                        {/* LISTE DES VUES (Overlay Propriétaire) */}
                        {showViewersList && user.id === viewingStory.user_id ? (
                            <div className="absolute inset-0 bg-black/90 z-30 p-4 overflow-y-auto animate-fadeIn">
                                <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-2">
                                    <h3 className="text-white font-bold text-lg">Spectateurs ({viewersData.length})</h3>
                                    <button onClick={() => setShowViewersList(false)}><X className="text-white"/></button>
                                </div>
                                {viewersData.length === 0 ? <p className="text-white/50 text-center mt-10">Personne n'a encore vu cette story.</p> : (
                                    viewersData.map((v, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl mb-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                                                    {v.avatar_url ? <img src={getAvatarUrl(v.avatar_url)} className="w-full h-full object-cover"/> : <span className="text-white font-bold pl-2">{v.username[0]}</span>}
                                                </div>
                                                <span className="text-white font-bold">{v.username}</span>
                                            </div>
                                            <span className="text-2xl">{v.reaction}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            // AFFICHAGE STORY
                            viewingStory.media_type === 'image' ? (
                                {/* CORRECTION ICI : On utilise le helper pour la media_url */}
                                <img src={getAvatarUrl(viewingStory.media_url)} className="w-full h-full object-contain" alt="Story"/>
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center p-8 text-center ${viewingStory.theme || STORY_THEMES[0]}`}>
                                    <p className="text-white font-bold text-3xl md:text-4xl leading-tight drop-shadow-lg break-words">
                                        {viewingStory.content}
                                    </p>
                                </div>
                            )
                        )}
                    </div>

                    {/* --- FOOTER / ACTIONS --- */}
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
                        {user.id === viewingStory.user_id ? (
                            <div className="flex justify-between items-center">
                                {/* BOUTON VOIR LES VUES */}
                                <button 
                                    onClick={() => setShowViewersList(true)}
                                    className="flex items-center gap-2 text-white font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full backdrop-blur-md transition-colors"
                                >
                                    <Eye size={20} />
                                    <span>{viewersData.length} vues</span>
                                </button>
                                {/* BOUTON SUPPRIMER */}
                                <button onClick={() => handleDeleteStory(viewingStory.id)} className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-md transition-colors"><Trash2 size={20} /></button>
                            </div>
                        ) : (
                            // REACTIONS POUR LES AUTRES
                            <div className="flex justify-center gap-3">
                                {QUICK_REACTIONS.map(emoji => (
                                    <button 
                                        key={emoji} 
                                        id={`reaction-${emoji}`}
                                        onClick={() => handleReaction(emoji)}
                                        className="text-3xl hover:scale-125 transition-transform active:scale-90"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MODAL CRÉATEUR */}
      <AnimatePresence>
        {creatingStory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeCreator}>
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-secondary border border-borderCol w-full max-w-md rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-xl">Créer une Story</h3><button onClick={closeCreator}><X/></button></div>
                    <div className="flex gap-2 mb-4">
                        <button onClick={() => setStoryType('image')} className={`flex-1 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${storyType === 'image' ? 'bg-accent text-white' : 'bg-primary text-textSub'}`}><ImageIcon size={20}/> Photo</button>
                        <button onClick={() => setStoryType('text')} className={`flex-1 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${storyType === 'text' ? 'bg-purple-500 text-white' : 'bg-primary text-textSub'}`}><Type size={20}/> Texte</button>
                    </div>
                    {storyType === 'image' ? (
                        <div className="border-2 border-dashed border-borderCol rounded-xl p-10 text-center hover:border-accent transition-colors">
                            <input type="file" id="storyFile" hidden accept="image/*" onChange={handleImageStoryUpload} />
                            <label htmlFor="storyFile" className="cursor-pointer flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent"><Plus size={24}/></div>
                                <span className="font-bold text-textMain">Choisir une image</span>
                            </label>
                        </div>
                    ) : (
                        <form onSubmit={handleTextStoryUpload}>
                            <div className={`aspect-[9/16] ${STORY_THEMES[currentThemeIndex]} rounded-xl p-6 flex flex-col items-center justify-center mb-4 relative transition-all duration-500`}>
                                <button type="button" onClick={cycleTheme} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-all shadow-lg"><Palette size={20} /></button>
                                <textarea value={textStoryContent} onChange={(e) => setTextStoryContent(e.target.value)} placeholder="Tape ton texte ici..." maxLength={200} className="w-full h-full bg-transparent text-white placeholder-white/70 text-center font-bold text-2xl outline-none resize-none overflow-hidden drop-shadow-md flex items-center justify-center pt-[50%]" autoFocus />
                            </div>
                            <button type="submit" disabled={!textStoryContent.trim()} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"><Send size={20}/> Publier</button>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <CreatePost onPostCreated={() => fetchPosts(activeFilter)} />

      <div className="flex gap-2 overflow-x-auto pb-2 sticky top-16 z-30 bg-primary/95 backdrop-blur-sm py-2 -mx-4 px-4 md:mx-0 md:px-0">
        {filters.map((f) => (
            <button key={f.label} onClick={() => handleFilterChange(f.label)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${activeFilter === f.label ? 'bg-textMain text-primary border-transparent transform scale-105' : 'bg-secondary text-textSub border-borderCol hover:bg-secondary/80'}`}><f.icon size={16} /> {f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-accent" size={40} /></div>
      ) : (
        <motion.div layout className="space-y-6">
          {posts.map((post, index) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <PostCard post={post} onDelete={handleDeletePost} />
            </motion.div>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-20 opacity-50"><div className="text-6xl mb-4">🤷‍♂️</div><p>Aucun post dans "{activeFilter}".</p></div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Home;