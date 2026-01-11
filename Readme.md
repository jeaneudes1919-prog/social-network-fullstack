🚀 DevSocial - Réseau Social Fullstack

DevSocial est une plateforme sociale moderne dédiée aux développeurs. Elle permet de partager des snippets de code, des projets, des stories éphémères et d'interagir avec une communauté tech active.

🔗 Démo en ligne : social-network-fullstack-tan.vercel.app

✨ Fonctionnalités Clés

📱 Expérience Utilisateur

Fil d'Actualité Riche : Support du texte, des images et des blocs de code avec coloration syntaxique.

Stories Éphémères : Partage de photos ou de textes sur fonds colorés (expirent après 24h).

Profils Personnalisables : Avatar (Cloudinary), bio, statistiques d'abonnés/abonnements.

Responsive Design : Interface fluide adaptée aux mobiles, tablettes et desktops.

🛠️ Fonctionnalités Techniques

Authentification Sécurisée : Système complet Inscription/Connexion avec JWT (JSON Web Tokens).

Gestion des Médias : Upload et optimisation d'images via Cloudinary.

Interactions : Système de Likes, Commentaires et Follow/Unfollow.

Recherche : Recherche globale d'utilisateurs et de posts.

🏗️ Stack Technique

Ce projet repose sur une architecture moderne MERN (avec PostgreSQL au lieu de Mongo) :

Domaine

Technologies

Frontend

React (Vite), Tailwind CSS, Framer Motion, Axios, Lucide React

Backend

Node.js, Express.js, Multer

Base de Données

PostgreSQL (Hébergé sur Neon Tech)

Stockage

Cloudinary (Pour les images et avatars)

Déploiement

Vercel (Frontend) & Render (Backend)

🚀 Installation Locale

Envie de tester le projet sur votre machine ? Suivez le guide.

Prérequis

Node.js (v18+)

PostgreSQL installé localement (ou une URL de connexion Neon)

Un compte Cloudinary

1. Cloner le repository

git clone [https://github.com/jeaneudes1919-prog/social-network-fullstack.git](https://github.com/jeaneudes1919-prog/social-network-fullstack.git)
cd social-network-fullstack


2. Configuration du Backend

cd backend
npm install


Créez un fichier .env dans le dossier backend :

PORT=5000
DATABASE_URL=postgres://votre_user:votre_password@host/database
JWT_SECRET=votre_super_secret_key
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret


Lancez le serveur :

npm start


3. Configuration du Frontend

Ouvrez un nouveau terminal :

cd ../src  # (ou le dossier racine du frontend)
npm install


Créez un fichier .env à la racine du frontend :

VITE_API_URL=http://localhost:5000/api


Lancez l'application :

npm run dev


📂 Structure de la Base de Données

Le projet utilise un schéma relationnel robuste :

Users : Informations de compte, avatars sécurisés.

Posts : Contenu, type de média, snippets de code.

Stories : Contenu éphémère avec gestion de l'expiration.

Interactions : Tables de liaison pour les Likes, Comments et Follows.

🛡️ Licence

Ce projet est sous licence MIT. Vous êtes libre de l'utiliser et de le modifier.

Made with ❤️ by Jean-Eudes.