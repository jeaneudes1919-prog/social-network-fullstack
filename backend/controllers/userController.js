const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. RECHERCHE GLOBALE (USERS + POSTS)
exports.searchUsers = async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim() === '') return res.json({ users: [], posts: [] });

    try {
        const searchTerm = `%${q}%`;
        const users = await pool.query('SELECT id, username, avatar_url FROM users WHERE username ILIKE $1 LIMIT 5', [searchTerm]);
        const posts = await pool.query(`
            SELECT p.*, u.username, u.avatar_url,
            (SELECT COUNT(*)::int FROM likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) as comments_count 
            FROM posts p JOIN users u ON p.user_id = u.id
            WHERE p.content ILIKE $1 ORDER BY p.created_at DESC LIMIT 10
        `, [searchTerm]);

        res.json({ users: users.rows, posts: posts.rows });
    } catch (err) { console.error(err); res.status(500).send("Erreur serveur recherche"); }
};

// 2. RÉCUPÉRER UN PROFIL
exports.getUserProfile = async (req, res) => {
    const userId = req.params.id;
    const currentUserId = req.user.id;
    try {
        const user = await pool.query('SELECT id, username, email, avatar_url, bio, created_at FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const posts = await pool.query(`
            SELECT p.*, u.username, u.avatar_url,
            (SELECT COUNT(*)::int FROM likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p JOIN users u ON p.user_id = u.id WHERE p.user_id = $1 ORDER BY p.created_at DESC
        `, [userId]);

        const isFollowing = await pool.query('SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2', [currentUserId, userId]);
        const followersCount = await pool.query('SELECT COUNT(*)::int FROM follows WHERE following_id = $1', [userId]);
        const followingCount = await pool.query('SELECT COUNT(*)::int FROM follows WHERE follower_id = $1', [userId]);

        res.json({
            user: user.rows[0], posts: posts.rows, isFollowing: isFollowing.rows.length > 0,
            stats: { followers: followersCount.rows[0].count, following: followingCount.rows[0].count, posts: posts.rows.length }
        });
    } catch (err) { console.error(err); res.status(500).send("Erreur serveur"); }
};

// 3. MODIFIER SON PROFIL (Compatible Cloudinary)
exports.updateUser = async (req, res) => {
    const userId = req.user.id; // L'utilisateur connecté
    const paramId = parseInt(req.params.id);
    const { username, bio } = req.body;

    // Sécurité : On ne modifie que son propre profil
    if (userId !== paramId) return res.status(403).json({ message: "Non autorisé" });

    try {
        let avatarUrl = req.body.existingAvatar; // Par défaut, on garde l'ancien

        // --- NOUVEAU SYSTÈME (CLOUDINARY) ---
        // Si une nouvelle image est envoyée, on prend le chemin complet (URL)
        if (req.file) {
            avatarUrl = req.file.path;
        }

        const updatedUser = await pool.query(
            'UPDATE users SET username = $1, bio = $2, avatar_url = $3 WHERE id = $4 RETURNING id, username, email, avatar_url, bio',
            [username, bio, avatarUrl, userId]
        );

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 4. SUPPRIMER SON COMPTE
exports.deleteUser = async (req, res) => {
    const userId = req.user.id;
    const paramId = parseInt(req.params.id);

    if (userId !== paramId) return res.status(403).json({ message: "Non autorisé" });

    try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ message: "Compte supprimé avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 5. FOLLOW/UNFOLLOW
exports.followUser = async (req, res) => {
    const followerId = req.user.id; 
    const followingId = req.params.id; 

    if (parseInt(followerId) === parseInt(followingId)) return res.status(400).json({ message: "Vous ne pouvez pas vous suivre vous-même" });

    try {
        const check = await pool.query('SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);

        if (check.rows.length > 0) {
            await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
            res.json({ message: "Désabonné", isFollowing: false });
        } else {
            await pool.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [followerId, followingId]);
            await pool.query('INSERT INTO notifications (user_id, actor_id, type, message) VALUES ($1, $2, $3, $4)', [followingId, followerId, 'follow', 'a commencé à vous suivre.']);
            res.json({ message: "Abonné", isFollowing: true });
        }
    } catch (err) { console.error(err); res.status(500).send("Erreur serveur"); }
};

// 6. NOTIFICATIONS
exports.getNotifications = async (req, res) => {
    try {
        const notifs = await pool.query(`
            SELECT n.*, u.username, u.avatar_url 
            FROM notifications n JOIN users u ON n.actor_id = u.id 
            WHERE n.user_id = $1 ORDER BY n.created_at DESC LIMIT 20
        `, [req.user.id]);
        res.json(notifs.rows);
    } catch (err) { console.error(err); res.status(500).send("Erreur"); }
};

exports.markNotificationsRead = async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).send("Erreur"); }
};