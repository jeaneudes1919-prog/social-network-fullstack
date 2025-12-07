const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 1. MODIFIER SON PROFIL
exports.updateUser = async (req, res) => {
    const userId = req.user.id; // L'utilisateur connecté
    const paramId = parseInt(req.params.id);
    const { username, bio } = req.body;

    // Sécurité : On ne modifie que son propre profil
    if (userId !== paramId) return res.status(403).json({ message: "Non autorisé" });

    try {
        let avatarUrl = req.body.existingAvatar; // Par défaut, on garde l'ancien

        // Si une nouvelle image est envoyée
        if (req.file) {
            avatarUrl = req.file.filename;
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

// 2. SUPPRIMER SON COMPTE
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