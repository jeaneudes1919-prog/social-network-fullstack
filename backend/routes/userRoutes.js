const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const authMiddleware = require('../middlewares/authMiddleware');

// --- ANCIEN SYSTÈME (LOCAL) ---
// const upload = require('../middlewares/uploadMiddleware'); // Import Multer pour l'avatar

// --- NOUVEAU SYSTÈME (CLOUDINARY) ---
const parser = require('../config/cloudinary');

const userController = require('../controllers/userController'); // Import le nouveau contrôleur

// 1. Routes SPÉCIFIQUES (Mots-clés fixes) - DOIVENT ÊTRE EN HAUT

// GET /api/users/notifications
router.get('/notifications', authMiddleware, socialController.getNotifications);
router.put('/notifications/read', authMiddleware, socialController.markNotificationsAsRead); // <--- NOUVELLE ROUTE
// GET /api/users/following -> Récupère ma liste d'abonnements (Celle qui buggait)
router.get('/following', authMiddleware, socialController.getFollowing);

// ...
router.get('/search', authMiddleware, socialController.globalSearch); // On utilise la nouvelle fonction
// ...
// 2. Route RACINE (Générale) - Normalement juste après les spécifiques

// GET /api/users/ -> Récupère TOUS les utilisateurs (pour la liste de découverte)
// NOTE: Cette route peut être utilisée pour la "Liste de découverte" ou si l'on ne suit personne.
router.get('/', authMiddleware, socialController.getAllUsers); 

// 3. Routes DYNAMIQUES (avec :id) - DOIVENT ÊTRE EN BAS

// ANCIENNE ROUTE LOCALE :
// router.put('/:id', authMiddleware, upload.single('avatar'), userController.updateUser); // Modifier

// NOUVELLE ROUTE CLOUDINARY :
router.put('/:id', authMiddleware, parser.single('avatar'), userController.updateUser); // Modifier

router.delete('/:id', authMiddleware, userController.deleteUser); // Supprimer

// GET /api/users/:id -> Profil public + stats
// ATTENTION : Cette route doit être la DERNIÈRE pour les GET car elle attrape tout ce qui n'a pas été trouvé avant !
router.get('/:id', socialController.getUserProfile); 

// POST /api/users/:id/follow
router.post('/:id/follow', authMiddleware, socialController.followUser);

// DELETE /api/users/:id/unfollow
router.delete('/:id/unfollow', authMiddleware, socialController.unfollowUser);

module.exports = router;