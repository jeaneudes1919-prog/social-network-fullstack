const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const storyController = require('../controllers/storyController'); // <--- Import
const upload = require('../middlewares/uploadMiddleware'); // Multer

// Routes protégées par authMiddleware

// --- NOUVELLE ROUTE AJOUTÉE ICI ---
// Récupérer les posts d'un utilisateur spécifique (pour le Profil)
router.get('/user/:id', authMiddleware, postController.getPostsByUser); 
// ----------------------------------

router.post('/stories', authMiddleware, upload.single('media'), storyController.createStory);
router.get('/stories', authMiddleware, storyController.getActiveStories);
router.post('/stories/:id/view', authMiddleware, storyController.viewStory); // Vue
router.post('/stories/:id/react', authMiddleware, storyController.reactToStory); // Réaction
router.get('/stories/:id/viewers', authMiddleware, storyController.getStoryViewers); // Liste (Owner)
// ...
router.delete('/stories/:id', authMiddleware, storyController.deleteStory); // <--- AJOUTE ÇA
// ...
// GET /api/posts -> Voir le fil d'actu global
router.get('/', authMiddleware, postController.getAllPosts);

// POST /api/posts -> Créer un post (avec fichier optionnel 'media')
router.post('/', authMiddleware, upload.single('media'), postController.createPost);

// POST /api/posts/:id/react -> Réagir à un post (Like, Love, etc.)
router.post('/:id/react', authMiddleware, postController.reactToPost);

// Gestion des Commentaires
router.post('/:id/comments', authMiddleware, postController.addComment); // Ajouter com
router.get('/:id/comments', authMiddleware, postController.getComments); // Lire coms

// Gestion des Vues et Suppression
router.put('/:id/views', postController.incrementViews); // Ajouter une vue
router.delete('/:id', authMiddleware, postController.deletePost); // Supprimer un post

module.exports = router;