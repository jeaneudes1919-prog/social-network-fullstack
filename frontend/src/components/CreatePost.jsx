import { useState } from 'react';
import { Image, Code, Timer, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [duration, setDuration] = useState(0); // 0 = illimité
  const [loading, setLoading] = useState(false);
  
  // State pour la catégorie (Par défaut Général)
  const [category, setCategory] = useState('General');

  // Récupérer l'utilisateur connecté
  const user = JSON.parse(localStorage.getItem('user'));
  const userAvatar = user?.avatar || user?.avatar_url;

  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `http://localhost:5000/uploads/${path}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content && !file && !codeSnippet) return;

    setLoading(true);
    
    // 1. On crée d'abord l'objet FormData
    const formData = new FormData();
    
    // 2. Ensuite on ajoute les champs
    formData.append('content', content);
    formData.append('category', category); // <--- Ajouté correctement ici
    
    if (file) formData.append('media', file);
    
    if (codeSnippet) {
        formData.append('code_snippet', codeSnippet);
        formData.append('code_language', 'javascript');
    }
    
    if (duration > 0) formData.append('duration', duration);

    try {
      await api.post('/posts', formData);
      
      // Reset form complet
      setContent('');
      setFile(null);
      setCodeSnippet('');
      setShowCode(false);
      setDuration(0);
      setCategory('General'); // Reset catégorie
      
      if (onPostCreated) onPostCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary rounded-2xl p-4 shadow-sm border border-borderCol mb-6">
      <div className="flex gap-4">
        
        {/* AVATAR DYNAMIQUE */}
        <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent flex items-center justify-center overflow-hidden shrink-0">
            {userAvatar ? (
                <img 
                    src={getAvatarUrl(userAvatar)} 
                    alt={user.username} 
                    className="w-full h-full object-cover" 
                />
            ) : (
                <span className="font-bold text-accent">{user?.username?.[0].toUpperCase()}</span>
            )}
        </div>
        
        {/* INPUT TEXTE */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Quoi de neuf, ${user?.username} ?`} 
          className="w-full bg-transparent text-textMain placeholder-textSub outline-none resize-none h-20 mt-2"
        />
      </div>

      {/* PREVIEW IMAGE */}
      {file && (
        <div className="relative mt-2 mb-4 w-fit">
            <img src={URL.createObjectURL(file)} className="h-32 rounded-lg border border-borderCol" alt="Preview" />
            <button onClick={() => setFile(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"><X size={12}/></button>
        </div>
      )}

      {/* ÉDITEUR DE CODE */}
      <AnimatePresence>
        {showCode && (
            <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}}>
                <textarea 
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    placeholder="Colle ton code ici..."
                    className="w-full bg-primary font-mono text-sm p-3 rounded-lg border border-borderCol text-green-400 mt-2 h-32 outline-none"
                />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-borderCol">
        <div className="flex gap-4 text-accent">
          {/* Bouton Image */}
          <label className="cursor-pointer hover:bg-accent/10 p-2 rounded-full transition-colors" title="Ajouter une image">
            <input type="file" hidden accept="image/*,audio/*" onChange={(e) => setFile(e.target.files[0])} />
            <Image size={20} />
          </label>

          {/* Bouton Code */}
          <button onClick={() => setShowCode(!showCode)} className={`hover:bg-accent/10 p-2 rounded-full transition-colors ${showCode ? 'bg-accent/20' : ''}`} title="Ajouter du code">
            <Code size={20} />
          </button>

          {/* Bouton Timer */}
          <div className="relative group">
            <button className={`hover:bg-accent/10 p-2 rounded-full transition-colors ${duration > 0 ? 'text-red-500' : ''}`} title="Durée de vie">
                <Timer size={20} />
            </button>
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-secondary border border-borderCol p-2 rounded-lg gap-2 shadow-xl z-10">
                {[15, 60, 1440].map(m => (
                    <button key={m} onClick={() => setDuration(m)} className="text-xs px-2 py-1 hover:bg-accent rounded text-textMain">
                        {m < 60 ? `${m}m` : `${m/60}h`}
                    </button>
                ))}
                <button onClick={() => setDuration(0)} className="text-xs px-2 py-1 text-red-400">Off</button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {/* SÉLECTEUR DE CATÉGORIE (Nouveau) */}
            <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="bg-primary text-textSub text-xs rounded-lg p-2 outline-none border border-borderCol cursor-pointer hover:border-accent transition-colors"
            >
                <option value="General">Général</option>
                <option value="Code">Code</option>
                <option value="Chill">Chill</option>
                <option value="News">News</option>
            </select>

            {/* BOUTON PUBLIER */}
            <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-accent hover:bg-accentHover text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg hover:shadow-accent/20"
            >
                {loading ? 'Envoi...' : <><Send size={18} /> Publier</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;