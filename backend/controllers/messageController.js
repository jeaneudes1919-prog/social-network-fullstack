const pool = require('../config/db');

// 1. ENVOYER UN MESSAGE
exports.sendMessage = async (req, res) => {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    try {
        const newMessage = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
            [senderId, receiverId, content]
        );
        // Note: Ici, on émettra plus tard un événement Socket.io
        res.json(newMessage.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 2. RÉCUPÉRER LA CONVERSATION AVEC UNE PERSONNE
exports.getConversation = async (req, res) => {
    const myId = req.user.id;
    const otherUserId = req.params.userId;

    try {
        // On cherche les messages où (JE suis l'expéditeur ET l'autre le receveur) OU l'inverse.
        const messages = await pool.query(`
            SELECT * FROM messages 
            WHERE (sender_id = $1 AND receiver_id = $2) 
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [myId, otherUserId]);

        res.json(messages.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 3. LISTE DES CONVERSATIONS (Derniers messages reçus)
exports.getConversationsList = async (req, res) => {
    const myId = req.user.id;
    try {
        // Requête complexe pour trouver les personnes avec qui j'ai parlé (DISTINCT)
        const contacts = await pool.query(`
            SELECT DISTINCT u.id, u.username, u.avatar_url
            FROM messages m
            JOIN users u ON (m.sender_id = u.id OR m.receiver_id = u.id)
            WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND u.id != $1
        `, [myId]);
        res.json(contacts.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};