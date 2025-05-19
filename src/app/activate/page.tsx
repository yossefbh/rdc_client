'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ActivateAccount() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      toast.error("Email manquant dans l'URL.", { position: 'top-center' });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error('Veuillez remplir tous les champs.', { position: 'top-center' });
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Veuillez vérifier le mot de passe et le confirmer correctement !', { position: 'top-center' });
      return;
    }

    if (!email) {
      toast.error("Email non valide. Veuillez vérifier le lien d'activation.", { position: 'top-center' });
      return;
    }
     if (username.length < 4 ) {
      toast.error('Le username doit contenir au moins 4 caractères.', { position: 'top-center' });
      return;
    }
    if(username.length > 10){
      toast.error('Le username ne doit pas dépasser 10 caractères.', { position: 'top-center' });
      return;
    }

    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.', { position: 'top-center' });
      return;
    }

    setIsLoading(true);

    const requestBody = {
      userEmail: email,
      username: username,
      password: password,
    };

    try {
      const response = await fetch('https://localhost:7284/api/Users/CompleteRegistration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes("Value cannot be null. (Parameter 'user')")) {
          toast.error(" Email n'existe pas ! Contacter l'administration pour plus d'informations.", { position: 'top-center' });
          return; 
        }
        throw new Error(errorText || "Erreur lors de l'activation du compte.");
      }

      const data = await response.json();

      if (data.success === true && data.data === true) {
        toast.success('Compte activé avec succès ! Vous pouvez maintenant vous connecter.', { position: 'top-center' });
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else if (data.success === false) {
        if (data.error === "Account already registred.") {
          toast.error('Activation déjà faite pour cet email.', { position: 'top-center' });
        } else if (data.error === "Username exist in the system.") {
          toast.error('Changer votre username.', { position: 'top-center' });
        } else {
          toast.error('Erreur lors de l\'activation du compte.', { position: 'top-center' });
        }
      } else {
        throw new Error("Réponse inattendue de l'API.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'activation du compte.", { position: 'top-center' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-lg w-110 max-w-400">
        <h2 className="text-3xl font-bold text-center text-blue-500 mb-6">Activation du compte</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full p-2 border border-black rounded-lg bg-gray-200 text-black"
              placeholder="Email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-black rounded-lg text-black"
              placeholder="Entrez votre username"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-black mb-1">Mot de passe</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-black rounded-lg text-black pr-10"
              placeholder="Entrez votre mot de passe"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 cursor-pointer text-xl text-gray-600"
              title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-black mb-1">Confirmer le mot de passe</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border border-black rounded-lg text-black pr-10"
              placeholder="Confirmez votre mot de passe"
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 cursor-pointer text-xl text-gray-600"
              title={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded-lg text-white ${isLoading ? 'bg-gray-400' : 'bg-blue-700 hover:bg-blue-600'}`}
          >
            {isLoading ? 'En cours...' : 'Valider'}
          </button>
        </form>
      </div>
    </div>
  );
}