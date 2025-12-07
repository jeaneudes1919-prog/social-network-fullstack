const multer = require('multer');
const path = require('path');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Les fichiers iront dans le dossier 'uploads'
    },
    filename: (req, file, cb) => {
        // Nom unique : timestamp + extension (ex: 167888.mp3)
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Filtre pour n'accepter que Images et Audio
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/mp3'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format de fichier non supporté (Images ou Audio seulement)'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 } // Limite à 5MB
});

module.exports = upload;