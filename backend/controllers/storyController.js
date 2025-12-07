const pool = require('../config/db');

// 1. CRÉER UNE STORY
exports.createStory = async (req, res) => {
    const userId = req.user.id;
    const { content, theme } = req.body;
    const filename = req.file ? req.file.filename : null;

    if (!filename && (!content || content.trim() === "")) return res.status(400).json({ message: "Contenu requis" });
    const mediaType = filename ? 'image' : 'text';

    try {
        const newStory = await pool.query(
            'INSERT INTO stories (user_id, media_url, content, media_type, theme) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, filename, content, mediaType, theme]
        );
        res.json(newStory.rows[0]);
    } catch (err) { console.error(err); res.status(500).send("Erreur"); }
};

// 2. RÉCUPÉRER LES STORIES ACTIVES
exports.getActiveStories = async (req, res) => {
    try {
        const stories = await pool.query(`
            SELECT s.*, u.username, u.avatar_url 
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.expires_at > NOW()
            ORDER BY s.created_at ASC
        `);
        res.json(stories.rows);
    } catch (err) { console.error(err); res.status(500).send("Erreur"); }
};

// 3. SUPPRIMER UNE STORY
exports.deleteStory = async (req, res) => {
    const userId = req.user.id;
    const storyId = req.params.id;
    try {
        const check = await pool.query('SELECT user_id FROM stories WHERE id = $1', [storyId]);
        if (check.rows.length === 0 || check.rows[0].user_id !== userId) return res.status(403).json({message: "Non autorisé"});
        await pool.query('DELETE FROM stories WHERE id = $1', [storyId]);
        res.json({ message: "Supprimé" });
    } catch (err) { console.error(err); res.status(500).send("Erreur"); }
};

// --- INTERACTIONS CORRIGÉES ---

// 4. MARQUER COMME VU
exports.viewStory = async (req, res) => {
    const userId = req.user.id;
    const storyId = req.params.id;
    try {
        // ON CONFLICT DO NOTHING évite les erreurs si on a déjà vu la story
        await pool.query(
            'INSERT INTO story_interactions (story_id, user_id) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT unique_interaction DO NOTHING',
            [storyId, userId]
        );
        res.json({ success: true });
    } catch (err) { 
        console.error("Erreur viewStory:", err); 
        res.status(500).send("Erreur"); 
    }
};

// 5. RÉAGIR (EMOJI)
exports.reactToStory = async (req, res) => {
    const userId = req.user.id;
    const storyId = req.params.id;
    const { reaction } = req.body; 
    try {
        // Met à jour la réaction si elle existe déjà, sinon crée la ligne
        await pool.query(
            `INSERT INTO story_interactions (story_id, user_id, reaction, viewed_at) 
             VALUES ($1, $2, $3, NOW()) 
             ON CONFLICT ON CONSTRAINT unique_interaction 
             DO UPDATE SET reaction = $3, viewed_at = NOW()`,
            [storyId, userId, reaction]
        );
        res.json({ success: true, reaction });
    } catch (err) { 
        console.error("Erreur reactStory:", err);
        res.status(500).send("Erreur"); 
    }
};

// 6. OBTENIR LA LISTE DES VUES (CORRIGÉ)
exports.getStoryViewers = async (req, res) => {
    const storyId = req.params.id;
    try {
        const viewers = await pool.query(`
            SELECT si.reaction, si.viewed_at, u.username, u.avatar_url
            FROM story_interactions si
            JOIN users u ON si.user_id = u.id
            WHERE si.story_id = $1
            ORDER BY si.viewed_at DESC
        `, [storyId]);
        
        // C'était ICI la faute : 'viewuers' n'existait pas !
        res.json(viewers.rows); 
    } catch (err) { 
        console.error("Erreur getViewers:", err);
        res.status(500).send("Erreur serveur");
    }
};