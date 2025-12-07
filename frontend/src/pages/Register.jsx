import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Shield } from 'lucide-react';
import api from '../api/axios';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur d'inscription");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary text-textMain relative overflow-hidden p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-secondary p-8 rounded-2xl shadow-2xl w-full max-w-md border border-borderCol z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-accent/10 rounded-full text-accent">
            <Shield size={40} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2">Rejoins l'élite</h2>
        <p className="text-center text-textSub mb-8">Crée ton profil Admin/Dev</p>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-textSub" size={20} />
            <input 
              type="text" placeholder="Nom d'utilisateur"
              className="w-full pl-10 pr-4 py-3 bg-primary rounded-lg border border-borderCol focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-textSub" size={20} />
            <input 
              type="email" placeholder="Email"
              className="w-full pl-10 pr-4 py-3 bg-primary rounded-lg border border-borderCol focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-textSub" size={20} />
            <input 
              type="password" placeholder="Mot de passe"
              className="w-full pl-10 pr-4 py-3 bg-primary rounded-lg border border-borderCol focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-accent hover:bg-accentHover text-white font-bold py-3 rounded-lg transition-colors shadow-lg"
          >
            INITIALISER LE COMPTE
          </motion.button>
        </form>

        <p className="mt-6 text-center text-textSub">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-accent font-bold hover:underline">Connexion</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;