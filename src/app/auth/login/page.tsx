'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.error('Veuillez remplir tous les champs.', { position: 'top-center' });
      return;
    }

    setIsLoading(true);
    const requestBody = { identifier, password };
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch('https://localhost:7284/api/Users/Login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Response data:', data);

     if (response.ok) {
     localStorage.setItem('user', JSON.stringify(data));
     router.push('/');
     } else {
        const error = data.error;
        if (error === 'Incorrect password.') {
          toast.error('Mot de passe incorrect.', { position: 'top-center' });
        } else if (error === 'Wrong Identifier.') {
          toast.error('Identifiant incorrect.', { position: 'top-center' });
        } else if (error === 'Registration not completed. Please check your email.') {
          toast.error('Inscription non complétée. Veuillez vérifier votre email.', { position: 'top-center' });
        } else if (error === 'Account is inactive. Contact administrator.') {
          toast.error('Votre compte semble inactif ! Contactez l\'administration.', { position: 'top-center' });
        } else {
          toast.error('Échec de la connexion.', { position: 'top-center' });
        }
      }
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Une erreur est survenue lors de la connexion.', { position: 'top-center' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-600 w-135 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-500">Connectez-vous à votre compte</h2>
          <p className="text-gray-600 mt-6 text-lg">
            POUR FAIRE PLUS SIMPLE ! MERCI DE REMPLIR LES CHAMPS CI-DESSOUS
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Username / Email *</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="Entrez votre username ou email"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-black mb-2">Mot de passe *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 text-lg"
              placeholder="Entrez votre mot de passe"
            />

          </div>
          <div className="text-right">
            <a href="#" className="text-sm text-blue-600 hover:underline">Mot de passe oublié ?</a>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg text-white text-lg font-semibold ${
              isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-400'
            }`}
          >
            {isLoading ? 'En cours...' : 'Se connecter'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Pas de compte ? <a href="#" className="text-blue-600 hover:underline">Créez-en un</a>
        </p>
      </div>
    </div>
  );
}
