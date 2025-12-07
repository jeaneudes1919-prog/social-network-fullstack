const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// --- CONFIGURATION DU TRANSPORTEUR EMAIL ---
// On crée le lien avec Gmail une seule fois
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Ton email (depuis .env)
    pass: process.env.EMAIL_PASS, // Ton mot de passe d'application (depuis .env)
  },
});

// 1. INSCRIPTION
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (userCheck.rows.length > 0) return res.status(400).json({ message: "Utilisateur déjà existant" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
};

// 2. CONNEXION
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(400).json({ message: "Utilisateur non trouvé" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(400).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // On retire le mot de passe avant d'envoyer au front
    const { password: pwd, reset_token, reset_expires, ...userInfo } = user.rows[0];
    
    res.json({ token, user: userInfo });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
};

// 3. DEMANDE DE CODE (Forgot Password)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            // Sécurité : on ne dit pas si l'email existe ou non, ou on renvoie une 404
            return res.status(404).json({ message: "Email introuvable." });
        }

        // 1. GÉNÉRER CODE À 8 CHIFFRES
        // Math.random() suffit pour un MVP, crypto.randomInt est mieux pour la prod
        const resetCode = Math.floor(10000000 + Math.random() * 90000000).toString();
        
        // 2. EXPIRATION : 5 MINUTES (5 * 60 * 1000 ms)
        const expireDate = new Date(Date.now() + 5 * 60 * 1000);

        // 3. SAUVEGARDER
        await pool.query(
            'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE email = $3',
            [resetCode, expireDate, email]
        );

        // 4. ENVOYER LE MAIL
        const mailOptions = {
            from: `"DevSocial Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Votre code de sécurité 🔑',
            html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2>Code de réinitialisation</h2>
                    <p>Voici votre code de sécurité à 8 chiffres :</p>
                    <div style="background: #f3f4f6; padding: 15px; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 10px; display: inline-block; margin: 20px 0;">
                        ${resetCode}
                    </div>
                    <p style="color: red;">Ce code expire dans 5 minutes.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Code envoyé !" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};

// 4. VALIDER LE CODE ET CHANGER LE MDP
exports.resetPassword = async (req, res) => {
    // Note : On n'utilise plus le token dans l'URL, on attend email + code dans le body
    const { email, code, newPassword } = req.body;

    try {
        // 1. Vérifier Code + Expiration + Email
        const user = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND reset_token = $2 AND reset_expires > NOW()',
            [email, code]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ message: "Code invalide ou expiré." });
        }

        // 2. Hasher et Mettre à jour
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
            [hashedPassword, user.rows[0].id]
        );

        res.json({ message: "Mot de passe modifié !" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
};