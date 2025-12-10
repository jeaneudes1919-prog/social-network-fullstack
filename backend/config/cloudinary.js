const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devsocial',
    resource_type: 'auto', // Laisse Cloudinary décider (image/video)
    // On enlève 'allowed_formats' pour éviter les bugs de formats stricts
  }
});

const parser = multer({ storage: storage });

module.exports = parser;