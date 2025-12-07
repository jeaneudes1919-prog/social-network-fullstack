const pool = require('../config/db');

// 1. SUIVRE UN UTILISATEUR
exports.followUser = async (req, res) => {
    const followerId = req.user.id; // Moi
    const followedId = req.params.id; // La personne que je veux suivre

    if (followerId == followedId) return res.status(400).json({ message: "Impossible de se suivre soi-même" });

    try {
        await pool.query(
            'INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [followerId, followedId]
        );
        res.json({ message: "Utilisateur suivi !" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 2. NE PLUS SUIVRE (UNFOLLOW)
exports.unfollowUser = async (req, res) => {
    const followerId = req.user.id;
    const followedId = req.params.id;

    try {
        await pool.query(
            'DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2',
            [followerId, followedId]
        );
        res.json({ message: "Utilisateur non suivi." });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 3. OBTENIR LE PROFIL COMPLET AVEC COMPTEURS (Abonnés/Abonnements)
exports.getUserProfile = async (req, res) => {
    const userId = req.params.id;
    
    try {
        const user = await pool.query('SELECT id, username, email, avatar_url, bio, created_at FROM users WHERE id = $1', [userId]);
        
        if (user.rows.length === 0) return res.status(404).json({ message: "Utilisateur introuvable" });

        // Compter les abonnés (ceux qui me suivent)
        const followers = await pool.query('SELECT COUNT(*) FROM follows WHERE followed_id = $1', [userId]);
        
        // Compter les abonnements (ceux que je suis)
        const following = await pool.query('SELECT COUNT(*) FROM follows WHERE follower_id = $1', [userId]);

        // Compter les posts
        const posts = await pool.query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [userId]);

        res.json({
            ...user.rows[0],
            followersCount: followers.rows[0].count,
            followingCount: following.rows[0].count,
            postsCount: posts.rows[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};
// ... codes existants (follow, unfollow...)

// MODIFICATION : Recherche globale (Utilisateurs + Posts)
exports.globalSearch = async (req, res) => {
    const { q } = req.query;
    
    if (!q || q.trim() === "") return res.json({ users: [], posts: [] });

    try {
        const searchTerm = `%${q}%`;

        // 1. Chercher les utilisateurs
        const users = await pool.query(
            "SELECT id, username, avatar_url FROM users WHERE username ILIKE $1 LIMIT 5",
            [searchTerm]
        );

        // 2. Chercher les posts (contenu)
        const posts = await pool.query(
            `SELECT p.id, p.content, p.user_id, u.username, u.avatar_url 
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.content ILIKE $1 
             LIMIT 5`,
            [searchTerm]
        );

        // On renvoie les deux listes
        res.json({ 
            users: users.rows, 
            posts: posts.rows 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};



// 6. RÉCUPÉRER TOUS LES UTILISATEURS (Pour démarrer un nouveau chat)
exports.getAllUsers = async (req, res) => {
    const userId = req.user.id;
    try {
        // Sélectionne tous les utilisateurs sauf celui qui fait la requête
        const users = await pool.query(
            'SELECT id, username, avatar_url FROM users WHERE id != $1 ORDER BY username ASC',
            [userId]
        );
        res.json(users.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};
// ... (tes autres fonctions comme searchUsers, getUserProfile, etc.)

// 7. RÉCUPÉRER UNIQUEMENT LES UTILISATEURS ABONNÉS
exports.getFollowing = async (req, res) => {
    const followerId = req.user.id; // MOI

    try {
        // Jointure complexe : Sélectionne les utilisateurs que JE suis (follower_id = $1)
        const followingUsers = await pool.query(
            `SELECT u.id, u.username, u.avatar_url 
             FROM follows f
             JOIN users u ON f.followed_id = u.id
             WHERE f.follower_id = $1
             ORDER BY u.username ASC`,
            [followerId]
        );
        res.json(followingUsers.rows);
    } catch (err) {
        console.error("Erreur getFollowing:", err);
        res.status(500).send("Erreur serveur");
    }
};

// 5. RÉCUPÉRER MES NOTIFICATIONS (NON LUES UNIQUEMENT)
exports.getNotifications = async (req, res) => {
    const userId = req.user.id;

    try {
        const notifs = await pool.query(`
            SELECT n.*, u.username, u.avatar_url 
            FROM notifications n
            JOIN users u ON n.actor_id = u.id
            WHERE n.user_id = $1 AND n.is_read = FALSE
            ORDER BY n.created_at DESC
        `, [userId]);

        res.json(notifs.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 6. MARQUER LES NOTIFICATIONS COMME LUES (NOUVEAU)
exports.markNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
        res.json({ message: "Notifications marquées comme lues" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};