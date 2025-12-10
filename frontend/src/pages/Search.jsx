import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard'; // On garde les belles cartes pour les posts
import { Search as SearchIcon, User, FileText, Loader2, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  // --- STATES (Comme dans Navbar) ---
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ users: [], posts: [] }); // Structure sécurisée
  const [loading, setLoading] = useState(false);
  
  // State pour gérer l'affichage de "Rien trouvé" ou "Intro"
  const [hasSearched, setHasSearched] = useState(false);
  const [errorSticker, setErrorSticker] = useState(false); // Le sticker colérique

  const navigate = useNavigate();

  // --- HELPER IMAGE (Copié de Navbar) ---
  const getAvatarUrl = (path) => {
    if (!path) return null;
    // Si ça commence par http (Cloudinary), on affiche. Sinon, rien (null).
    return path.startsWith('http') ? path : null; 
};
  // --- 1. LOGIQUE LIVE SEARCH (Debounce comme Navbar) ---
  useEffect(() => {
    const timer = setTimeout(() => {
        // SÉCURITÉ : On lance la recherche seulement à partir de 3 caractères
        if (query.trim().length >= 3) {
            performSearch(query);
        } else {
            // Reset si moins de 3 caractères
            setResults({ users: [], posts: [] });
            setHasSearched(false);
        }
    }, 300); // 300ms de délai

    return () => clearTimeout(timer);
  }, [query]);

  // --- 2. APPEL API ---
  const performSearch = async (searchTerm) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/users/search?q=${searchTerm}`);
      // On s'assure de la structure pour éviter l'écran noir
      setResults({
          users: res.data.users || [],
          posts: res.data.posts || []
      });
      // Met à jour l'URL sans recharger
      setSearchParams({ q: searchTerm }, { replace: true });
    } catch (err) {
      console.error(err);
      setResults({ users: [], posts: [] });
    } finally {
      setLoading(false);
    }
  };

  // --- 3. SOUMISSION MANUELLE (Gestion Colère) ---
  const handleManualSubmit = (e) => {
    e.preventDefault();
    // Si c'est vide ou trop court lors de la validation manuelle
    if (query.trim().length < 3) {
        setErrorSticker(true);
        setTimeout(() => setErrorSticker(false), 2000);
        return;
    }
    // Si OK, le useEffect s'en charge
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ users: [], posts: [] });
    setHasSearched(false);
    setSearchParams({});
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-20 relative">
      
      {/* 1. BARRE DE RECHERCHE FLOTTANTE */}
      <div className="sticky top-16 md:top-0 z-20 bg-primary/95 backdrop-blur-md p-4 border-b border-borderCol">
        <form onSubmit={handleManualSubmit} className="relative">
            <SearchIcon className="absolute left-3 top-3 text-textSub transition-colors group-focus-within:text-accent" size={20} />
            
            <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher des devs, du code..."
                className={`w-full bg-secondary border ${errorSticker ? 'border-red-500 ring-2 ring-red-500' : 'border-borderCol'} rounded-xl py-2.5 pl-10 pr-10 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-textMain shadow-sm`}
                autoFocus
            />

            {/* Bouton croix */}
            {query && (
                <button 
                    type="button" 
                    onClick={clearSearch}
                    className="absolute right-3 top-3 text-textSub hover:text-textMain"
                >
                    <X size={20} />
                </button>
            )}
        </form>
      </div>

      {/* 2. STICKER COLÉRIQUE (Animation Overlay) */}
      <AnimatePresence>
        {errorSticker && (
            <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1.2, rotate: [0, -10, 10, -10, 10, 0] }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
            >
                <div className="relative w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-2xl border-4 border-red-500">
                    <span className="text-4xl">🤬</span>
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold">!</div>
                </div>
                {query.length > 0 && query.length < 3 && (
                    <p className="text-red-500 font-bold text-center mt-2 text-sm bg-secondary px-2 py-1 rounded-lg border border-red-500 shadow-lg">3 lettres min !</p>
                )}
            </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ZONE DE RÉSULTATS */}
      <div className="p-4 space-y-6">
        
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-accent mb-2" size={40}/>
                <p className="text-textSub text-sm animate-pulse">Recherche en cours...</p>
            </div>
        ) : (
            <>
                {/* CAS : RIEN TROUVÉ (Après recherche valide) */}
                {hasSearched && results.users?.length === 0 && results.posts?.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                        <div className="text-6xl mb-4">🤷‍♂️</div>
                        <h2 className="text-xl font-bold text-textMain mb-2">Aucun résultat</h2>
                        <p className="text-textSub">Rien trouvé pour "<span className="font-bold text-accent">{query}</span>"</p>
                    </motion.div>
                )}

                {/* CAS : INTRO (Avant recherche ou recherche trop courte) */}
                {!hasSearched && (
                    <div className="text-center py-20 opacity-50">
                        <SearchIcon size={64} className="mx-auto mb-4 text-textSub"/>
                        {query.length > 0 && query.length < 3 ? (
                            <p className="text-accent font-bold animate-pulse">Continuez à taper... (3 caractères min)</p>
                        ) : (
                            <p>Tapez au moins 3 lettres pour explorer !</p>
                        )}
                    </div>
                )}

                {/* --- LISTE UTILISATEURS --- */}
                {results.users?.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="font-bold text-sm uppercase text-textSub mb-3 flex items-center gap-2">
                            <User size={16}/> Utilisateurs
                        </h2>
                        <div className="bg-secondary border border-borderCol rounded-xl overflow-hidden shadow-sm">
                            {results.users.map(u => (
                                <Link 
                                    key={u.id}
                                    to={`/profile/${u.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-primary cursor-pointer border-b border-borderCol last:border-0 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent overflow-hidden border border-accent/30 group-hover:border-accent">
                                            {u.avatar_url ? (
                                                <img src={getAvatarUrl(u.avatar_url)} className="w-full h-full object-cover" alt={u.username}/>
                                            ) : (
                                                u.username[0]
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-textMain group-hover:text-accent transition-colors">{u.username}</div>
                                            <div className="text-xs text-textSub">Voir le profil</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-textSub group-hover:translate-x-1 transition-transform"/>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* --- LISTE POSTS --- */}
                {results.posts?.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <h2 className="font-bold text-sm uppercase text-textSub mb-3 flex items-center gap-2 mt-6">
                            <FileText size={16}/> Publications
                        </h2>
                        <div className="space-y-4">
                            {results.posts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default Search;