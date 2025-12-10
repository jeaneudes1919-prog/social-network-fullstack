const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// 1. Connexion à ton compte
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configuration du stockage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devsocial', // Le nom du dossier dans ton Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'], // Formats acceptés
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // Optionnel : redimensionne les images géantes
  }
});

const parser = multer({ storage: storage });

module.exports = parser;