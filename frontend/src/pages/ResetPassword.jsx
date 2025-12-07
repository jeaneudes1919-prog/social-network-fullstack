import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams(); // On récupère le token dans l'URL
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Les mots de passe ne correspondent pas.");
    
    setLoading(true);
    setError(null);

    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000); // Redirection après 3s
    } catch (err) {
      setError(err.response?.data?.message || "Lien invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="bg-secondary p-8 rounded-2xl shadow-xl border border-borderCol w-full max-w-md">
        
        {success ? (
            <div className="text-center py-10">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-textMain">Succès !</h2>
                <p className="text-textSub mt-2">Votre mot de passe a été modifié.</p>
                <p className="text-sm text-textSub mt-4">Redirection vers la connexion...</p>
            </div>
        ) : (
            <>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-textMain">Réinitialisation</h1>
                    <p className="text-textSub mt-2">Choisissez un nouveau mot de passe sécurisé.</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-center text-sm font-bold">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-textSub text-sm font-bold mb-2">Nouveau mot de passe</label>
                    <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-primary border border-borderCol rounded-lg p-3 text-textMain outline-none focus:border-accent"
                    placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-textSub text-sm font-bold mb-2">Confirmer</label>
                    <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-primary border border-borderCol rounded-lg p-3 text-textMain outline-none focus:border-accent"
                    placeholder="••••••••"
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accentHover text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin"/> : "Valider"}
                </button>
                </form>
            </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;