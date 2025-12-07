import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Mail, ArrowLeft, Loader2, KeyRound, Lock, CheckCircle, Timer } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // --- STATES ---
  // Étape du processus : 1 = Email, 2 = Code & Validation
  const [step, setStep] = useState(1);
  
  // Données du formulaire
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // UI Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // CHRONOMÈTRE (300 secondes = 5 minutes)
  const [timeLeft, setTimeLeft] = useState(300); 

  // --- EFFET DU CHRONOMÈTRE ---
  useEffect(() => {
    // Le chrono tourne seulement si on est à l'étape 2 et qu'il reste du temps
    if (step === 2 && timeLeft > 0) {
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timerId); // Nettoyage
    }
  }, [step, timeLeft]);

  // Fonction pour afficher mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- HANDLERS ---

  // 1. ENVOYER LE CODE (Passage de l'étape 1 à 2)
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2); // On passe à l'écran de validation
      setTimeLeft(300); // On lance le compte à rebours de 5 min
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  // 2. VALIDER LE CODE ET CHANGER LE MDP
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // On envoie tout au backend pour vérification
      await api.post('/auth/reset-password', { email, code, newPassword });
      setSuccess(true); // Afficher l'écran de succès
      setTimeout(() => navigate('/login'), 3000); // Redirection auto
    } catch (err) {
      setError(err.response?.data?.message || "Code invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4 transition-colors duration-300">
      <div className="bg-secondary p-8 rounded-2xl shadow-xl border border-borderCol w-full max-w-md">
        
        {/* EN-TÊTE DYNAMIQUE */}
        <div className="text-center mb-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                {success ? <CheckCircle size={32}/> : step === 1 ? <Mail size={32} /> : <KeyRound size={32} />}
            </div>
            <h1 className="text-2xl font-bold text-textMain">
                {success ? "Mot de passe modifié !" : step === 1 ? "Mot de passe oublié ?" : "Vérification"}
            </h1>
            {!success && (
                <p className="text-textSub mt-2 text-sm">
                    {step === 1 ? "Entrez votre email pour recevoir un code." : `Code envoyé à ${email}`}
                </p>
            )}
        </div>

        {/* MESSAGES D'ERREUR */}
        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-center text-sm font-bold animate-pulse">
                {error}
            </div>
        )}

        {/* --- ÉTAT : SUCCÈS --- */}
        {success ? (
            <div className="text-center">
                <p className="text-green-500 font-bold mb-2">Tout est bon !</p>
                <p className="text-textSub text-sm">Redirection vers la connexion...</p>
            </div>
        ) : (
            <>
                {/* --- ÉTAPE 1 : EMAIL --- */}
                {step === 1 && (
                    <form onSubmit={handleSendCode} className="space-y-4">
                        <div>
                            <label className="block text-textSub text-sm font-bold mb-2">Email</label>
                            <input 
                                type="email" required
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-primary border border-borderCol rounded-lg p-3 text-textMain outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                placeholder="exemple@email.com"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accentHover text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                            {loading ? <Loader2 className="animate-spin"/> : "Recevoir le code"}
                        </button>
                    </form>
                )}

                {/* --- ÉTAPE 2 : CODE + MDP --- */}
                {step === 2 && (
                    <form onSubmit={handleReset} className="space-y-4">
                        
                        {/* TIMER */}
                        <div className={`flex items-center justify-center gap-2 font-mono text-lg font-bold mb-4 p-2 rounded-lg bg-primary ${timeLeft < 60 ? 'text-red-500 animate-pulse border border-red-500/30' : 'text-accent border border-borderCol'}`}>
                            <Timer size={20}/> {formatTime(timeLeft)}
                        </div>

                        {/* Si le temps est écoulé, on bloque */}
                        {timeLeft === 0 ? (
                             <div className="text-center py-4">
                                <p className="text-red-500 font-bold mb-2">Temps écoulé ⏳</p>
                                <button type="button" onClick={() => setStep(1)} className="text-accent underline font-bold hover:text-accentHover">Renvoyer un nouveau code</button>
                             </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-textSub text-sm font-bold mb-2">Code à 8 chiffres</label>
                                    <input 
                                        type="text" required maxLength="8"
                                        value={code} onChange={(e) => setCode(e.target.value)}
                                        className="w-full bg-primary border border-borderCol rounded-lg p-3 text-textMain text-center text-2xl tracking-widest outline-none focus:border-accent font-mono transition-all"
                                        placeholder="12345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-textSub text-sm font-bold mb-2">Nouveau mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 text-textSub" size={18} />
                                        <input 
                                            type="password" required
                                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-primary border border-borderCol rounded-lg p-3 pl-10 text-textMain outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accentHover text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20">
                                    {loading ? <Loader2 className="animate-spin"/> : "Valider et changer"}
                                </button>
                            </>
                        )}
                    </form>
                )}

                {/* BOUTON RETOUR */}
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-textSub hover:text-textMain text-sm flex items-center justify-center gap-2 transition-colors font-medium">
                        <ArrowLeft size={16}/> {step === 1 ? "Retour à la connexion" : "Changer d'email"}
                    </Link>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;