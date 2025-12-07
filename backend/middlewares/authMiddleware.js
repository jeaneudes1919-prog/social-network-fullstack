const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    // 1. Récupérer le token dans le header (Format: "Bearer LE_TOKEN")
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: "Accès refusé. Pas de token." });
    }

    try {
        // 2. Nettoyer le token (enlever le mot "Bearer " si présent)
        const tokenClean = token.replace('Bearer ', '');
        
        // 3. Vérifier la signature
        const decoded = jwt.verify(tokenClean, process.env.JWT_SECRET);
        
        // 4. Ajouter l'info utilisateur à la requête pour la suite
        req.user = decoded; 
        next();
    } catch (err) {
        res.status(401).json({ message: "Token invalide." });
    }
};