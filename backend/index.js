const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http'); // Nécessaire pour Socket.io
const { Server } = require('socket.io'); // Import de Socket.io
const cron = require('node-cron');
require('dotenv').config();

const pool = require('./config/db');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

// --- TÂCHE PLANIFIÉE (CRON JOB) ---
// Cette fonction s'exécute toutes les minutes ('* * * * *')
cron.schedule('* * * * *', async () => {
    try {
        // Supprime tous les posts dont la date d'expiration est passée (< NOW())
        const result = await pool.query("DELETE FROM posts WHERE expires_at < NOW() RETURNING id");
        if (result.rowCount > 0) {
            console.log(`🧹 Nettoyage Auto : ${result.rowCount} post(s) expiré(s) supprimé(s).`);
        }
    } catch (err) {
        console.error("Erreur lors du nettoyage automatique :", err);
    }
});

// --- 1. CONFIGURATION SOCKET.IO ---
// On crée le serveur HTTP manuellement pour le partager entre Express et Socket.io
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:5173"], // Accepte React (3000) et Vite (5173)
        methods: ["GET", "POST"]
    }
});

// --- 2. MIDDLEWARES ---
app.use(express.json());
//app.use(cors());
app.use(cors({
    origin: '*', // Autorise tout le monde (plus simple pour démarrer)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({
    crossOriginResourcePolicy: false, // Autorise l'affichage des images
}));
app.use(morgan('dev'));

// --- 3. RENDRE LE DOSSIER UPLOADS PUBLIC ---
// C'est CRITIQUE pour lire les images/sons depuis le frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. ROUTES API ---
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Route de test simple
app.get('/', (req, res) => {
    res.send('API Réseau Social (HTTP + Socket) fonctionne ! 🚀');
});

// --- 5. LOGIQUE TEMPS RÉEL (SOCKET.IO) ---
io.on('connection', (socket) => {
    console.log(`⚡ Client connecté via Socket : ${socket.id}`);

    // Rejoindre sa propre "salle" (basée sur l'ID user)
    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} a rejoint sa room.`);
    });

    // Envoyer un message
    socket.on('send_message', (data) => {
        // data = { senderId, receiverId, content }
        io.to(data.receiverId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté');
    });
});

// --- 6. DÉMARRAGE SERVEUR ---
// Test DB au démarrage
pool.query('SELECT NOW()', (err, res) => {
    if (err) console.error('❌ Erreur DB', err);
    else console.log('✅ Base de Données connectée !');
});

const PORT = process.env.PORT || 5000;

// IMPORTANT : On utilise server.listen, pas app.listen
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});