import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, MessageSquare, User, LogOut, Sun, Moon, Cpu, Bell, X, FileText, UserPlus, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // CORRECTION : On gère les deux cas possibles pour le nom de la propriété image
  const userAvatar = user?.avatar || user?.avatar_url;
  
  // --- STATES ---
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorSticker, setErrorSticker] = useState(false); // Déclenche l'animation colérique

  const searchRef = useRef(null);

  // --- 1. CHARGEMENT DES NOTIFICATIONS ---
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    api.get('/users/notifications')
       .then(res => setNotifications(res.data))
       .catch(console.error);
  };

  const handleToggleNotifs = () => {
    if (!showNotifs) {
        setShowNotifs(true);
        const hasUnread = notifications.some(n => !n.is_read);
        if (hasUnread) {
            api.put('/users/notifications/read').catch(console.error);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    } else {
        setShowNotifs(false);
    }
  };

  // --- 2. RECHERCHE LIVE (Interactive) ---
  useEffect(() => {
    const timer = setTimeout(() => {
        if (searchQuery.trim().length > 0) {
            api.get(`/users/search?q=${searchQuery}`)
               .then(res => {
                   // On sécurise la structure
                   setResults({
                       users: res.data.users || [],
                       posts: res.data.posts || []
                   });
                   setShowDropdown(true);
               })
               .catch(console.error);
        } else {
            setShowDropdown(false);
            setResults({ users: [], posts: [] });
        }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 3. SOUMISSION MANUELLE ---
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
        setErrorSticker(true);
        setTimeout(() => setErrorSticker(false), 2000);
        return;
    }
    setShowDropdown(false);
    navigate(`/search?q=${searchQuery}`);
  };

  // --- UTILS ---
  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('cyber');
    else setTheme('light');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    // Si ça commence par http (Cloudinary), on affiche. Sinon, rien (null).
    return path.startsWith('http') ? path : null; 
};

  const navLinks = [
    { icon: Home, path: "/" },
    { icon: MessageSquare, path: "/messages" },
    { icon: User, path: `/profile/${user?.id}` },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-primary/80 backdrop-blur-md border-b border-borderCol transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="bg-gradient-to-tr from-accent to-purple-500 p-2 rounded-lg group-hover:rotate-12 transition-transform">
            <Cpu className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-textMain to-accent hidden sm:block">
            ScialTyKy
          </span>
        </Link>

        {/* --- ZONE DE RECHERCHE CENTRALE --- */}
        <div className="hidden md:flex flex-1 max-w-md relative" ref={searchRef}>
            
            <form onSubmit={handleManualSubmit} className="w-full relative z-20">
                <Search className="absolute left-3 top-2.5 text-textSub group-focus-within:text-accent transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Chercher un dev, un code..." 
                    className={`w-full bg-secondary border ${errorSticker ? 'border-red-500 ring-2 ring-red-500' : 'border-borderCol'} rounded-2xl pl-10 pr-4 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-sm text-textMain placeholder-textSub`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowDropdown(true)}
                />
            </form>

            {/* STICKER COLÈRE */}
            <AnimatePresence>
                {errorSticker && (
                    <motion.div 
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1.2, rotate: [0, -10, 10, -10, 10, 0] }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -right-12 top-0 bg-white dark:bg-gray-800 rounded-full p-2 shadow-2xl border-2 border-red-500 z-50 flex items-center justify-center w-12 h-12"
                    >
                        <span className="text-3xl">🤬</span>
                        <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-white">!</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DROPDOWN RÉSULTATS */}
            <AnimatePresence>
                {/* MODIFICATION ICI : On affiche le dropdown si searchQuery n'est pas vide, même sans résultats */}
                {showDropdown && searchQuery.trim().length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-secondary border border-borderCol rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-10 custom-scrollbar"
                    >
                        {/* CAS : AUCUN RÉSULTAT */}
                        {results.users.length === 0 && results.posts.length === 0 && (
                             <div className="p-6 text-center text-textSub">
                                <div className="text-3xl mb-2">🤷‍♂️</div>
                                <p className="text-sm">Aucun résultat pour "<span className="text-textMain font-bold">{searchQuery}</span>"</p>
                             </div>
                        )}

                        {/* Section Utilisateurs */}
                        {results.users.length > 0 && (
                            <div className="p-2">
                                <h4 className="text-xs font-bold text-textSub uppercase mb-2 px-2 flex items-center gap-2">
                                    <UserPlus size={12}/> Utilisateurs
                                </h4>
                                {results.users.map(u => (
                                    <div 
                                        key={u.id} 
                                        onClick={() => { navigate(`/profile/${u.id}`); setShowDropdown(false); }}
                                        className="flex items-center gap-3 p-2 hover:bg-primary rounded-lg cursor-pointer transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-xs overflow-hidden border border-accent/30">
                                            {u.avatar_url ? (
                                                <img src={getAvatarUrl(u.avatar_url)} className="w-full h-full object-cover" alt={u.username} />
                                            ) : (
                                                u.username[0]
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-textMain">{u.username}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Section Posts */}
                        {results.posts.length > 0 && (
                            <div className="p-2 border-t border-borderCol">
                                <h4 className="text-xs font-bold text-textSub uppercase mb-2 px-2 flex items-center gap-2">
                                    <FileText size={12}/> Publications
                                </h4>
                                {results.posts.map(p => (
                                    <div 
                                        key={p.id}
                                        onClick={() => { navigate(`/profile/${p.user_id}`); setShowDropdown(false); }}
                                        className="flex items-center gap-3 p-2 hover:bg-primary rounded-lg cursor-pointer transition-colors"
                                    >
                                        <div className="p-2 bg-primary rounded-lg text-textSub shrink-0"><FileText size={16}/></div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm text-textMain truncate font-medium">{p.content}</p>
                                            <p className="text-xs text-textSub">Par {p.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div 
                            onClick={handleManualSubmit}
                            className="p-3 bg-primary text-center text-xs text-accent font-bold cursor-pointer hover:underline border-t border-borderCol"
                        >
                            Voir plus de résultats
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* --- NAVIGATION DROITE --- */}
        <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-4 mr-4">
                {navLinks.map((item) => (
                    <NavLink 
                    key={item.path} 
                    to={item.path}
                    className={({ isActive }) => `
                        relative p-2 rounded-full transition-all duration-300
                        ${isActive ? 'text-accent bg-accent/10' : 'text-textSub hover:text-textMain hover:bg-secondary'}
                    `}
                    >
                        <item.icon size={24} />
                    </NavLink>
                ))}
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary text-textMain transition-colors">
                {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Cpu size={20} />}
            </button>
            
            <div className="relative">
                <button 
                    onClick={handleToggleNotifs}
                    className={`p-2 rounded-full transition-colors relative ${showNotifs ? 'bg-accent text-white' : 'hover:bg-secondary text-textMain'}`}
                >
                    <Bell size={20} />
                    {notifications.some(n => !n.is_read) && (
                         <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </button>

                <AnimatePresence>
                    {showNotifs && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-3 w-80 bg-secondary border border-borderCol rounded-xl shadow-2xl p-4 z-50 origin-top-right"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-textMain">Notifications</h3>
                            {!notifications.some(n => !n.is_read) && notifications.length > 0 && (
                                <span className="text-xs text-textSub">Toutes lues</span>
                            )}
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? <p className="text-sm text-textSub text-center py-4">Rien pour l'instant 😴</p> : (
                                notifications.map(n => (
                                    <div key={n.id} className={`flex items-center gap-3 p-2 hover:bg-primary rounded-lg cursor-pointer transition-colors ${!n.is_read ? 'border-l-4 border-accent bg-primary/50' : ''}`}>
                                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-xs overflow-hidden">
                                            {n.avatar_url ? (
                                                <img src={getAvatarUrl(n.avatar_url)} className="w-full h-full object-cover" alt={n.username} />
                                            ) : (
                                                n.username?.[0]
                                            )}
                                        </div>
                                        <div className="text-sm text-textMain">
                                            <span className="font-bold">{n.username}</span> {n.message}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative group cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent flex items-center justify-center overflow-hidden">
                {userAvatar ? (
                    <img src={getAvatarUrl(userAvatar)} className="w-full h-full object-cover" alt="avatar"/>
                ) : (
                    <span className="font-bold text-accent">{user?.username?.[0].toUpperCase()}</span>
                )}
                </div>
                
                <div className="absolute right-0 top-full mt-2 w-32 bg-secondary border border-borderCol rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                <button onClick={handleLogout} className="flex items-center gap-2 w-full p-3 text-red-500 hover:bg-primary text-sm font-bold rounded-xl">
                    <LogOut size={16} /> Déconnexion
                </button>
                </div>
            </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;