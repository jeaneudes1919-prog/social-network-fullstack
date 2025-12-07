import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { Send, User, Search, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [followingUsers, setFollowingUsers] = useState([]); 
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [currentChat, setCurrentChat] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Search & Sticker States
  const [searchQuery, setSearchQuery] = useState('');
  const [errorSticker, setErrorSticker] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const scrollRef = useRef(); 
  
  // --- A. INITIALISATION ---

  const fetchFollowing = async () => {
    try {
        const res = await api.get('/users/following');
        setFollowingUsers(res.data);
        setFilteredUsers(res.data); 
    } catch (err) {
        console.error("Erreur chargement des abonnements:", err);
    }
  };

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    if (user) newSocket.emit('join_room', String(user.id));
    fetchFollowing();
    return () => newSocket.close();
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;
    socket.on('receive_message', (data) => {
        const currentChatId = String(currentChat?.id);
        const senderId = String(data.senderId || data.sender_id);
        const receiverId = String(data.receiverId || data.receiver_id);

        if (currentChat && (senderId === currentChatId || receiverId === currentChatId)) {
            setMessages((prev) => [...prev, data]);
        }
    });
  }, [socket, currentChat?.id]); 

  useEffect(() => {
    if (currentChat) {
        api.get(`/messages/${currentChat.id}`)
           .then(res => setMessages(res.data))
           .catch(err => console.error(err));
    } else {
        setMessages([]);
    }
  }, [currentChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- LOGIQUE DE RECHERCHE LIVE ---
  useEffect(() => {
    if (searchQuery.length > 0) {
      setFilteredUsers(
        followingUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      setFilteredUsers(followingUsers); 
    }
  }, [searchQuery, followingUsers]); 

  // --- LOGIQUE DU STICKER (Soumission vide) ---
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
        // DÉCLENCHE LE STICKER COLÉRIQUE
        setErrorSticker(true);
        setTimeout(() => setErrorSticker(false), 2000);
    }
  };

  // --- B. ENVOI DE MESSAGE ---

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;

    const msgData = { receiverId: currentChat.id, content: newMessage };

    try {
        const res = await api.post('/messages', msgData);
        const sentMessage = { ...res.data, sender_id: user.id };
        setMessages((prev) => [...prev, sentMessage]); 
        socket.emit('send_message', { ...sentMessage, senderId: user.id, receiverId: currentChat.id });
        setNewMessage('');
    } catch (err) { 
        console.error(err); 
        alert("Erreur d'envoi. Vérifiez la console.");
    }
  };

  // --- C. RENDU VISUEL ---
  
  return (
    <div className="h-[calc(100vh-10rem)] bg-secondary rounded-2xl border border-borderCol overflow-hidden flex">
      
      {/* GAUCHE : LISTE DES CONTACTS */}
      <div className={`w-full md:w-1/3 border-r border-borderCol flex flex-col ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 font-bold border-b border-borderCol bg-secondary z-10">Contacts</div>
        
        {/* BARRE DE RECHERCHE INTERACTIVE + STICKER */}
        <div className="p-3 border-b border-borderCol relative z-20">
            <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-2.5 text-textSub" size={18} />
                <input
                    type="text"
                    placeholder="Chercher un ami..."
                    className={`w-full pl-10 pr-4 py-2 bg-primary rounded-full border ${errorSticker ? 'border-red-500 ring-2 ring-red-500' : 'border-borderCol'} focus:border-accent outline-none text-sm transition-all`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>

            {/* LE STICKER D'ERREUR FLOTTANT */}
            <AnimatePresence>
                {errorSticker && (
                    <motion.div 
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1.2, rotate: [0, -10, 10, -10, 10, 0] }} // Effet Shake
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="absolute -right-2 -top-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-xl border-2 border-red-500 z-50 flex items-center justify-center w-12 h-12"
                    >
                        <span className="text-3xl">🤬</span>
                        <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-white">!</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* LISTE FILTRÉE */}
        <div className="overflow-y-auto flex-1 bg-secondary">
            {filteredUsers.map(c => (
                <div 
                    key={c.id} 
                    onClick={() => setCurrentChat(c)}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-primary transition-colors border-b border-borderCol/50 ${currentChat?.id === c.id ? 'bg-primary border-l-4 border-l-accent' : ''}`}
                >
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg overflow-hidden shrink-0">
                        {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover"/> : c.username[0]}
                    </div>
                    <div className="overflow-hidden">
                        <div className="font-bold truncate text-textMain">{c.username}</div>
                        <div className="text-xs text-textSub truncate">Cliquez pour discuter</div>
                    </div>
                </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center opacity-60">
                <div className="text-4xl mb-2">🕵️‍♂️</div>
                <div className="text-sm text-textSub">
                    {searchQuery ? "Aucun ami trouvé." : "Abonnez-vous à des gens pour les voir ici !"}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* DROITE : ZONE DE CHAT */}
      <div className={`w-full md:w-2/3 flex flex-col bg-primary/30 ${!currentChat ? 'hidden md:flex' : 'flex'}`}>
        {currentChat ? (
            <>
                <div className="p-4 border-b border-borderCol flex items-center gap-3 bg-secondary shadow-sm z-10">
                    <button onClick={() => setCurrentChat(null)} className="md:hidden text-textSub hover:bg-primary p-2 rounded-full">←</button>
                    <div className="w-10 h-10 rounded-full bg-accent/20 overflow-hidden">
                        {currentChat.avatar_url ? <img src={currentChat.avatar_url} className="w-full h-full object-cover"/> : <div className="flex h-full items-center justify-center font-bold text-accent">{currentChat.username[0]}</div>}
                    </div>
                    <div className="font-bold text-lg">{currentChat.username}</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((m, index) => {
                        const isMe = String(m.sender_id || m.senderId) === String(user.id); 
                        return (
                            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-accent text-white rounded-br-none' : 'bg-secondary border border-borderCol text-textMain rounded-bl-none'}`}>
                                    {m.content}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>

                <form onSubmit={sendMessage} className="p-3 border-t border-borderCol bg-secondary flex gap-2">
                    <input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message pour ${currentChat.username}...`}
                        className="flex-1 bg-primary rounded-full px-4 py-3 outline-none border border-transparent focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
                    />
                    <button type="submit" className="bg-accent p-3 rounded-full text-white hover:bg-accentHover shadow-lg hover:scale-105 transition-all">
                        <Send size={20} />
                    </button>
                </form>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-textSub opacity-50 p-6 text-center">
                <User size={64} className="mb-4 text-accent/50"/>
                <h3 className="text-xl font-bold mb-2">Messagerie DevSocial</h3>
                <p>Sélectionnez un contact à gauche pour commencer une discussion sécurisée.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Chat;