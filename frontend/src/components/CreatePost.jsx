import { useState, useRef } from 'react';
import { Image, Code, Smile, Send, X, Loader2, Timer } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '🎉', '🤔', '😢', '🚀', '💯'];

const CreatePost = ({ onPostCreated }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // States Contenu
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  
  // States Options
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0); // 0 = illimité
  const [category, setCategory] = useState('General'); 
  
  // Code Snippet States
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');

  const fileInputRef = useRef(null);

  // Helper pour l'avatar (Sécurité Cloudinary)
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return null; 
  };

  const userAvatar = user?.avatar_url || user?.avatar;

  // Gestion Image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
      setIsExpanded(true);
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Soumission
  const handleSubmit = async () => {
    if ((!content.trim() && !media && !codeSnippet) || loading) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('content', content);
    formData.append('category', category); 

    if (duration > 0) formData.append('duration', duration);
    if (media) formData.append('media', media);
    
    if (codeSnippet) {
        formData.append('code_snippet', codeSnippet);
        formData.append('code_language', codeLanguage);
    }

    try {
      const res = await api.post('/posts', formData);
      
      // Reset total
      setContent('');
      setMedia(null);
      setMediaPreview(null);
      setCodeSnippet('');
      setShowCodeInput(false);
      setIsExpanded(false);
      setDuration(0);
      setCategory('General');
      
      if (onPostCreated) onPostCreated(res.data);

    } catch (err) {
      console.error(err);
      alert("Erreur lors de la publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary p-4 rounded-2xl border border-borderCol mb-6 shadow-sm">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden shrink-0">
           {userAvatar ? (
               <img src={getAvatarUrl(userAvatar)} className="w-full h-full object-cover" alt="Me"/>
           ) : (
               <span className="font-bold text-accent">{user?.username?.[0]}</span>
           )}
        </div>

        <div className="flex-1">
          {/* Zone de texte */}
          <textarea
            className="w-full bg-transparent border-none outline-none text-textMain placeholder-textSub resize-none text-lg min-h-[40px]"
            placeholder="Quoi de neuf, dev ?"
            value={content}
            onClick={() => setIsExpanded(true)}
            onChange={(e) => setContent(e.target.value)}
            rows={isExpanded ? 3 : 1}
          />

          {/* Prévisualisation Image */}
          {mediaPreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden group">
                <img src={mediaPreview} alt="Preview" className="w-full max-h-60 object-cover rounded-xl border border-borderCol"/>
                <button 
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
          )}

          {/* Éditeur de Code */}
          <AnimatePresence>
            {showCodeInput && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 overflow-hidden"
                >
                    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-2">
                        <div className="flex justify-between mb-2">
                            <select 
                                value={codeLanguage} 
                                onChange={(e) => setCodeLanguage(e.target.value)}
                                className="bg-gray-800 text-white text-xs rounded px-2 py-1 outline-none border border-gray-600"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                                <option value="sql">SQL</option>
                            </select>
                            <button onClick={() => setShowCodeInput(false)} className="text-gray-400 hover:text-white"><X size={14}/></button>
                        </div>
                        <textarea 
                            value={codeSnippet}
                            onChange={(e) => setCodeSnippet(e.target.value)}
                            placeholder="// Colle ton code ici..."
                            className="w-full bg-transparent text-green-400 font-mono text-sm outline-none resize-none h-32"
                        />
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Barre d'outils */}
          {(isExpanded || content || media || codeSnippet) && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 pt-2 border-t border-borderCol gap-3">
                
                {/* Outils d'ajout (Image, Code, Timer, Emoji) */}
                <div className="flex gap-2 text-accent items-center justify-between sm:justify-start w-full sm:w-auto">
                    <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-accent/10 rounded-full transition-colors">
                            <Image size={20} />
                            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange}/>
                        </button>
                        
                        <button onClick={() => setShowCodeInput(!showCodeInput)} className={`p-2 hover:bg-accent/10 rounded-full transition-colors ${showCodeInput ? 'bg-accent/10' : ''}`}>
                            <Code size={20} />
                        </button>

                        <div className="relative group">
                            <button className={`p-2 hover:bg-accent/10 rounded-full transition-colors ${duration > 0 ? 'text-red-500 bg-red-500/10' : ''}`}>
                                <Timer size={20} />
                            </button>
                            {/* Popup Timer */}
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-secondary border border-borderCol p-2 rounded-lg gap-2 shadow-xl z-10">
                                {[15, 60, 1440].map(m => (
                                    <button key={m} onClick={() => setDuration(m)} className="text-xs px-2 py-1 hover:bg-accent rounded text-textMain">
                                        {m < 60 ? `${m}m` : `${m/60}h`}
                                    </button>
                                ))}
                                <button onClick={() => setDuration(0)} className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded">Off</button>
                            </div>
                        </div>

                        <div className="relative">
                            <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 hover:bg-accent/10 rounded-full transition-colors">
                                <Smile size={20} />
                            </button>
                            {showEmoji && (
                                <div className="absolute top-full left-0 mt-2 bg-secondary border border-borderCol shadow-xl rounded-xl p-2 flex gap-1 z-10">
                                    {EMOJIS.map(e => (
                                        <button key={e} onClick={() => { setContent(prev => prev + e); setShowEmoji(false); }} className="text-xl hover:scale-125 transition-transform">{e}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Catégorie & Publier */}
                <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                    {/* Sélecteur Catégorie (Visible même sur mobile mais compact) */}
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-primary text-textSub text-xs rounded-lg p-2 outline-none border border-borderCol cursor-pointer hover:border-accent transition-colors max-w-[100px] sm:max-w-none"
                    >
                        <option value="General">Général</option>
                        <option value="Code">Code</option>
                        <option value="Chill">Chill</option>
                        <option value="News">News</option>
                    </select>

                    {/* Bouton Publier RESPONSIVE */}
                    <button 
                        onClick={handleSubmit}
                        disabled={(!content.trim() && !media && !codeSnippet) || loading}
                        className="bg-accent hover:bg-accentHover text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Send size={18} />
                                {/* Texte caché sur mobile (hidden), visible sur PC (md:inline) */}
                                <span className="hidden md:inline">Publier</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;