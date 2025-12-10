const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const storyController = require('../controllers/storyController'); 

// --- ANCIEN SYSTÈME (LOCAL) ---
// const upload = require('../middlewares/uploadMiddleware'); // Multer

// --- NOUVEAU SYSTÈME (CLOUDINARY) ---
const parser = require('../config/cloudinary');

// Routes protégées par authMiddleware

// Récupérer les posts d'un utilisateur spécifique (pour le Profil)
router.get('/user/:id', authMiddleware, postController.getPostsByUser); 

// --- STORIES ---

// ANCIENNE ROUTE LOCALE :
// router.post('/stories', authMiddleware, upload.single('media'), storyController.createStory);

// NOUVELLE ROUTE CLOUDINARY :
router.post('/stories', authMiddleware, parser.single('media'), storyController.createStory);

router.get('/stories', authMiddleware, storyController.getActiveStories);
router.post('/stories/:id/view', authMiddleware, storyController.viewStory); // Vue
router.post('/stories/:id/react', authMiddleware, storyController.reactToStory); // Réaction
router.get('/stories/:id/viewers', authMiddleware, storyController.getStoryViewers); // Liste (Owner)
router.delete('/stories/:id', authMiddleware, storyController.deleteStory); 

// --- POSTS ---

// GET /api/posts -> Voir le fil d'actu global
router.get('/', authMiddleware, postController.getAllPosts);

// POST /api/posts -> Créer un post (avec fichier optionnel 'media')

// ANCIENNE ROUTE LOCALE :
// router.post('/', authMiddleware, upload.single('media'), postController.createPost);

// NOUVELLE ROUTE CLOUDINARY :
router.post('/', authMiddleware, parser.single('media'), postController.createPost);

// POST /api/posts/:id/react -> Réagir à un post (Like, Love, etc.)
router.post('/:id/react', authMiddleware, postController.reactToPost);

// Gestion des Commentaires
router.post('/:id/comments', authMiddleware, postController.addComment); // Ajouter com
router.get('/:id/comments', authMiddleware, postController.getComments); // Lire coms

// Gestion des Vues et Suppression
router.put('/:id/views', postController.incrementViews); // Ajouter une vue
router.delete('/:id', authMiddleware, postController.deletePost); // Supprimer un post

module.exports = router;