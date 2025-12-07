import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Mail, Lock, Loader2, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      
      // Sauvegarde des infos
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Redirection vers l'accueil
      // On utilise window.location pour forcer le rafraîchissement du state global (Navbar, etc.)
      window.location.href = '/'; 
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="bg-secondary p-8 rounded-2xl shadow-xl border border-borderCol w-full max-w-md">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                <LogIn size={32} />
            </div>
            <h1 className="text-3xl font-bold text-textMain">Bon retour !</h1>
            <p className="text-textSub mt-2">Connectez-vous pour continuer.</p>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm font-bold text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-textSub" size={20} />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full bg-primary border border-borderCol rounded-xl py-3 pl-10 pr-4 text-textMain outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-textSub" size={20} />
            <input 
              type="password" 
              placeholder="Mot de passe" 
              className="w-full bg-primary border border-borderCol rounded-xl py-3 pl-10 pr-4 text-textMain outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* LIEN MOT DE PASSE OUBLIÉ (Correctement placé) */}
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-accent hover:underline font-medium">
                Mot de passe oublié ?
            </Link>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent hover:bg-accentHover text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Se connecter"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-textSub">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-accent font-bold hover:underline">
                Créer un compte
            </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;