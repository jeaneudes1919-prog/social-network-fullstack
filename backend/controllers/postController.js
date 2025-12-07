const pool = require('../config/db');

// 1. CRÉER UN POST (MODIFIÉ AVEC TTL)
exports.createPost = async (req, res) => {
    const userId = req.user.id;
    // On récupère "duration" (en minutes) depuis le frontend
    const { content, code_snippet, code_language, duration } = req.body;
    
    let mediaType = 'text';
    let mediaUrl = null;

    if (req.file) {
        mediaUrl = req.file.filename;
        if (req.file.mimetype.startsWith('audio')) mediaType = 'audio';
        else if (req.file.mimetype.startsWith('image')) mediaType = 'image';
    } else if (code_snippet) {
        mediaType = 'code';
    }

    // CALCUL DE LA DATE D'EXPIRATION
    let expiresAt = null;
    if (duration && duration > 0) {
        const date = new Date();
        date.setMinutes(date.getMinutes() + parseInt(duration)); // Ajoute les minutes
        expiresAt = date;
    }

    try {
        const newPost = await pool.query(
            `INSERT INTO posts (user_id, content, media_type, media_url, code_snippet, code_language, expires_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [userId, content, mediaType, mediaUrl, code_snippet, code_language, expiresAt]
        );
        res.json(newPost.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};
// 2. RÉCUPÉRER LES POSTS (AVEC FILTRE CATÉGORIE)
exports.getAllPosts = async (req, res) => {
    const { category } = req.query; // On récupère le filtre depuis l'URL

    try {
        let query = `
            SELECT p.*, u.username, u.avatar_url,
            (SELECT COUNT(*)::int FROM likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) as comments_count 
            FROM posts p
            JOIN users u ON p.user_id = u.id
        `;
        
        const params = [];

        // Si une catégorie est demandée (et que ce n'est pas "Pour toi" ou "General")
        if (category && category !== 'Pour toi' && category !== 'General') {
            query += ` WHERE p.category = $1`;
            params.push(category);
        }

        query += ` ORDER BY p.created_at DESC`;

        const posts = await pool.query(query, params);
        res.json(posts.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// Remplace l'ancienne fonction toggleLike par celle-ci :

// 3. RÉAGIR À UN POST (+ NOTIFICATION)
exports.reactToPost = async (req, res) => {
    const userId = req.user.id; // MOI (celui qui like)
    const postId = req.params.id;
    const { type } = req.body; 

    try {
        // 1. D'abord, on doit savoir À QUI appartient le post pour le notifier
        const postResult = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
        if (postResult.rows.length === 0) return res.status(404).json({ message: "Post introuvable" });
        
        const receiverId = postResult.rows[0].user_id; // L'AUTEUR du post

        // 2. Gestion du Like (Code existant)
        const existingReaction = await pool.query(
            'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
            [userId, postId]
        );

        let action = '';

        if (existingReaction.rows.length > 0) {
            if (existingReaction.rows[0].reaction_type === type) {
                await pool.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
                action = 'removed';
            } else {
                await pool.query(
                    'UPDATE likes SET reaction_type = $1 WHERE user_id = $2 AND post_id = $3',
                    [type, userId, postId]
                );
                action = 'updated';
            }
        } else {
            await pool.query(
                'INSERT INTO likes (user_id, post_id, reaction_type) VALUES ($1, $2, $3)',
                [userId, postId, type]
            );
            action = 'added';

            // --- DEBUT DU SYSTEME DE NOTIFICATION ---
            // On ne se notifie pas soi-même !
            if (userId !== receiverId) {
                await pool.query(
                    `INSERT INTO notifications (user_id, actor_id, type, message) 
                     VALUES ($1, $2, 'like', 'a réagi à votre publication')`,
                    [receiverId, userId]
                );
            }
            // --- FIN ---
        }

        res.json({ message: "Action effectuée", action, type });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// ... (le code existant createPost, getAllPosts, toggleLike)

// 4. AJOUTER UN COMMENTAIRE
exports.addComment = async (req, res) => {
    const { content } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    try {
        const newComment = await pool.query(
            'INSERT INTO comments (content, user_id, post_id) VALUES ($1, $2, $3) RETURNING *',
            [content, userId, postId]
        );
        res.json(newComment.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 5. RÉCUPÉRER LES COMMENTAIRES D'UN POST
exports.getComments = async (req, res) => {
    const postId = req.params.id;
    try {
        const comments = await pool.query(`
            SELECT c.*, u.username, u.avatar_url 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC
        `, [postId]);
        res.json(comments.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 6. INCRÉMENTER LES VUES (À appeler quand on clique sur un post)
exports.incrementViews = async (req, res) => {
    const postId = req.params.id;
    try {
        await pool.query('UPDATE posts SET views = views + 1 WHERE id = $1', [postId]);
        res.json({ message: "Vue comptabilisée" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// AJOUTE CETTE FONCTION À LA FIN :
// 7. SUPPRIMER UN POST (MANUELLEMENT)
exports.deletePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;

    try {
        // On vérifie que c'est bien LUI l'auteur du post avant de supprimer
        const result = await pool.query(
            'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *',
            [postId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ message: "Action non autorisée ou post introuvable." });
        }

        res.json({ message: "Post supprimé avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};
// 8. RÉCUPÉRER LES POSTS D'UN UTILISATEUR SPÉCIFIQUE
exports.getPostsByUser = async (req, res) => {
    const userId = req.params.id;
    try {
        const posts = await pool.query(`
            SELECT p.*, u.username, u.avatar_url,
            (SELECT COUNT(*)::int FROM likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) as comments_count 
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [userId]);
        res.json(posts.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};