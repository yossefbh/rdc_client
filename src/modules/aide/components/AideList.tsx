import React, { useState } from "react";
import { toast } from "react-toastify";

export const AideList: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    role: "acheteur",
    probleme: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Votre problème a été soumis avec succès ! Nous vous contacterons bientôt.");
    setFormData({ nom: "", email: "", role: "acheteur", probleme: "" });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-500">
        Centre d'Aide
      </h1>

      {/* Section FAQ */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-black">
          Foire aux Questions (FAQ)
        </h2>
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-black">
              Que faire si je ne vois pas ma facture dans le tableau ?
            </h3>
            <p className="text-black">
              Assurez-vous que vos filtres sont correctement configurés. Si le problème persiste,
              contactez un gestionnaire via le formulaire ci-dessous.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-black">
              Comment puis-je payer une facture en retard ?
            </h3>
            <p className="text-black">
  Rendez-vous dans la section "Factures" pour sélectionner la ou les factures souhaitées, puis créez un plan de paiement. Ensuite, allez dans la section "Paiements" du sidebar, sélectionnez le plan créé, et effectuez le paiement.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-black">
              Comment déclarer un litige ?
            </h3>
            <p className="text-black">
              Allez dans la section "Litiges", sélectionnez la facture concernée, et créez un
              nouveau litige en précisant le type et la description du problème.
            </p>
          </div>
        </div>
      </section>

      {/* Formulaire de Contact */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-black">
          Signaler un Problème
        </h2>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label htmlFor="nom" className="block text-black font-medium mb-2">
              Nom
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              className="w-full p-2 border rounded text-black"
              placeholder="Votre nom"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-black font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded text-black"
              placeholder="Votre email"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block text-black font-medium mb-2">
              Vous êtes
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full p-2 border rounded text-black"
            >
              <option value="acheteur" className="text-black">Acheteur</option>
              <option value="gestionnaire" className="text-black">Gestionnaire</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="probleme" className="block text-black font-medium mb-2">
              Décrivez votre problème
            </label>
            <textarea
              id="probleme"
              name="probleme"
              value={formData.probleme}
              onChange={handleInputChange}
              className="w-full p-2 border rounded text-black"
              rows={4}
              placeholder="Expliquez votre problème ici..."
              required
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Envoyer
            </button>
          </div>
        </form>
      </section>

      {/* Ressources Utiles */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-black">
          Ressources Utiles
        </h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-black">
            - Contactez notre support :{" "}
            <a href="mailto:support@votreentreprise.com" className="text-blue-500 hover:underline">
              support@shamash-it.com
            </a>
            <br />
            - Téléphone : +216 12 345 678
            <br />
            - Horaires : Du lundi au vendredi, 9h-17h
          </p>
        </div>
      </section>
    </div>
  );
};