import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserCheck, UserPlus, MessageSquare, MapPin, Calendar, Settings, Save, X, Trash2, Camera, Loader2 } from 'lucide-react';
import api from '../api/axios';
import PostCard from '../components/PostCard';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  // Data States
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); 
  
  // Form States
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  
  // CORRECTION ICI : "setAvatarFile" et non "sete"
  const [avatarFile, setAvatarFile] = useState(null); 
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // Helper pour l'avatar (Sécurité Cloudinary)
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return null;
  };

  // 1. CHARGEMENT DES DONNÉES
  const fetchData = async () => {
    try {
        setLoading(true);
        const userRes = await api.get(`/users/${id}`);
        setProfile(userRes.data);
        setEditForm({ username: userRes.data.username, bio: userRes.data.bio || '' });

        const postRes = await api.get(`/posts/user/${id}`);
        setPosts(postRes.data);
        
        if (userRes.data.isFollowing) setIsFollowing(true);

    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // 2. GESTION DES ACTIONS
  const handleFollow = async () => {
    try {
        if (isFollowing) await api.delete(`/users/${id}/unfollow`);
        else await api.post(`/users/${id}/follow`);
        setIsFollowing(!isFollowing);
        // Mise à jour locale des stats
        setProfile(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                followers: isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1
            }
        }));
    } catch (err) { console.error(err); }
  };

  const handleMessage = () => {
    navigate('/messages', { state: { contact: profile } });
  };

  // 3. GESTION DE LA MISE À JOUR
  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', editForm.username);
    formData.append('bio', editForm.bio);
    
    if (avatarFile) formData.append('avatar', avatarFile);
    else formData.append('existingAvatar', profile.avatar_url);

    try {
        const res = await api.put(`/users/${id}`, formData);
        setProfile({ ...profile, ...res.data }); 
        
        if (currentUser.id === parseInt(id)) {
            localStorage.setItem('user', JSON.stringify({ ...currentUser, ...res.data }));
        }
        
        setIsEditing(false);
        setAvatarFile(null); // Reset du fichier après upload
    } catch (err) {
        alert("Erreur lors de la mise à jour.");
        console.error(err);
    }
  };

  // 4. SUPPRESSION
  const handleDeleteAccount = async () => {
    if (!window.confirm("⚠️ ATTENTION : Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?")) return;
    try {
        await api.delete(`/users/${id}`);
        localStorage.clear();
        window.location.href = '/login';
    } catch (err) {
        console.error(err);
        alert("Impossible de supprimer le compte.");
    }
  };

  // 5. PREVIEW IMAGE
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setAvatarFile(file); // Maintenant ça marche !
        setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  if (!profile) return <div className="text-center p-20">Utilisateur introuvable.</div>;

  const isMyProfile = currentUser?.id === profile.id;
  const displayAvatar = previewAvatar || getAvatarUrl(profile.avatar_url);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* --- BANNIÈRE & INFO --- */}
      <div className="bg-secondary rounded-2xl overflow-hidden border border-borderCol shadow-sm mb-6 relative">
        <div className="h-40 bg-gradient-to-r from-accent to-purple-600 relative">
            {isMyProfile && !isEditing && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition-all"
                    title="Modifier le profil"
                >
                    <Settings size={20} />
                </button>
            )}
        </div>
        
        <div className="px-8 pb-8 relative">
            {/* AVATAR */}
            <div className="absolute -top-16 left-8">
                <div className="w-32 h-32 rounded-full bg-primary border-4 border-secondary overflow-hidden relative group flex items-center justify-center">
                    {displayAvatar ? (
                        <img src={displayAvatar} className="w-full h-full object-cover"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-4xl text-accent bg-accent/10">
                            {profile.username[0].toUpperCase()}
                        </div>
                    )}

                    {/* Overlay Changement Photo */}
                    {isEditing && (
                        <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={32} />
                            <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                        </label>
                    )}
                </div>
            </div>
            
            {/* ACTIONS BAR */}
            <div className="flex justify-end mt-4 h-10">
                {isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={() => { setIsEditing(false); setPreviewAvatar(null); }} className="px-4 py-2 rounded-full font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center gap-2">
                            <X size={18}/> Annuler
                        </button>
                        <button onClick={handleUpdate} className="px-4 py-2 rounded-full font-bold bg-accent text-white hover:bg-accentHover flex items-center gap-2 shadow-lg">
                            <Save size={18}/> Enregistrer
                        </button>
                    </div>
                ) : (
                    !isMyProfile && (
                        <div className="flex gap-2">
                            <button onClick={handleMessage} className="px-4 py-2 rounded-full font-bold bg-secondary border border-borderCol hover:bg-primary flex items-center gap-2">
                                <MessageSquare size={18}/> Message
                            </button>
                            <button onClick={handleFollow} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${isFollowing ? 'border border-borderCol text-textSub' : 'bg-textMain text-primary'}`}>
                                {isFollowing ? <><UserCheck size={18}/> Abonné</> : <><UserPlus size={18}/> Suivre</>}
                            </button>
                        </div>
                    )
                )}
            </div>

            {/* INFO TEXTES */}
            <div className="mt-6">
                {isEditing ? (
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="text-xs text-textSub font-bold uppercase">Nom d'utilisateur</label>
                            <input 
                                type="text" 
                                value={editForm.username} 
                                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                className="w-full bg-primary border border-borderCol rounded-lg p-2 outline-none focus:border-accent font-bold text-lg text-textMain"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-textSub font-bold uppercase">Bio</label>
                            <textarea 
                                value={editForm.bio} 
                                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                className="w-full bg-primary border border-borderCol rounded-lg p-2 outline-none focus:border-accent resize-none h-24 text-textMain"
                                placeholder="Dis quelque chose sur toi..."
                            />
                        </div>
                        
                        <div className="pt-4 border-t border-borderCol mt-4">
                            <button onClick={handleDeleteAccount} className="text-red-500 hover:text-red-600 text-sm font-bold flex items-center gap-2">
                                <Trash2 size={16} /> Supprimer mon compte définitivement
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-textMain">
                            {profile.username}
                            {isMyProfile && <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">C'est vous</span>}
                        </h1>
                        <p className="text-textSub">@{profile.username.toLowerCase()}</p>
                        
                        <p className="mt-4 text-textMain whitespace-pre-wrap">{profile.bio || "Aucune bio pour l'instant."}</p>

                        <div className="flex flex-wrap gap-4 mt-6 text-sm text-textSub">
                            <div className="flex items-center gap-1"><MapPin size={16}/> Bénin</div>
                            <div className="flex items-center gap-1"><Calendar size={16}/> Inscrit depuis {new Date(profile.created_at).getFullYear()}</div>
                        </div>

                        {/* STATS */}
                        <div className="flex gap-8 mt-6 border-t border-borderCol pt-4">
                            <div className="text-center"><span className="block font-bold text-xl text-textMain">{posts.length}</span> <span className="text-xs text-textSub uppercase">Posts</span></div>
                            <div className="text-center"><span className="block font-bold text-xl text-textMain">{profile.stats?.followers || 0}</span> <span className="text-xs text-textSub uppercase">Abonnés</span></div>
                            <div className="text-center"><span className="block font-bold text-xl text-textMain">{profile.stats?.following || 0}</span> <span className="text-xs text-textSub uppercase">Suivis</span></div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* --- SECTION DES POSTS --- */}
      <h2 className="font-bold text-xl mb-4 px-2 flex items-center gap-2 text-textMain">
         Publications <span className="bg-primary text-textSub text-sm px-2 py-1 rounded-full">{posts.length}</span>
      </h2>

      <div className="space-y-4">
        {posts.length > 0 ? (
            posts.map(post => (
                <PostCard 
                    key={post.id} 
                    post={post} 
                    onDelete={(id) => setPosts(posts.filter(p => p.id !== id))} 
                />
            ))
        ) : (
            <div className="text-center py-20 bg-secondary rounded-2xl border border-dashed border-borderCol">
                <p className="text-textSub">Aucune publication pour le moment.</p>
                {isMyProfile && (
                    <button onClick={() => navigate('/')} className="mt-4 text-accent font-bold hover:underline">
                        Créer mon premier post
                    </button>
                )}
            </div>
        )}
      </div>

    </div>
  );
};

export default Profile;