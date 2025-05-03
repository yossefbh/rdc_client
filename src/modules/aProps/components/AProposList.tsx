import React from "react";
import { FaRocket, FaSyncAlt, FaUsers, FaShieldAlt, FaLinkedin, FaGlobe } from 'react-icons/fa';

export const AProposList: React.FC = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-500">
        À Propos de l'Application
      </h1>

      {/* Section Description */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-black">
          Qu'est-ce que cette application ?
        </h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-black">
            Cette application est une plateforme de gestion financière conçue pour aider les gestionnaires et les acheteurs à gérer efficacement leurs factures, paiements, et litiges. Elle permet de créer des plans de paiement, de suivre les factures en retard, et de résoudre les litiges de manière organisée.
          </p>
        </div>
      </section>

      {/* Section Fonctionnalités Clés */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-black">
          Fonctionnalités Clés
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow flex items-start">
            <FaRocket className="text-blue-500 mr-3 text-2xl" />
            <div>
              <h3 className="text-lg font-medium text-black">Gestion Rapide des Factures</h3>
              <p className="text-black">
                Suivez et gérez vos factures en retard en quelques clics.
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-start">
            <FaSyncAlt className="text-blue-500 mr-3 text-2xl" />
            <div>
              <h3 className="text-lg font-medium text-black">Plans de Paiement Flexibles</h3>
              <p className="text-black">
                Créez des plans de paiement adaptés à vos besoins.
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-start">
            <FaUsers className="text-blue-500 mr-3 text-2xl" />
            <div>
              <h3 className="text-lg font-medium text-black">Collaboration Simplifiée</h3>
              <p className="text-black">
                Facilitez la communication entre acheteurs et gestionnaires.
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-start">
            <FaShieldAlt className="text-blue-500 mr-3 text-2xl" />
            <div>
              <h3 className="text-lg font-medium text-black">Résolution de Litiges</h3>
              <p className="text-black">
                Traitez les litiges de manière organisée et efficace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Objectifs */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-black">
          Nos Objectifs
        </h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <ul className="list-disc list-inside text-black space-y-2">
            <li>Simplifier la gestion des factures pour les acheteurs.</li>
            <li>Permettre aux gestionnaires de suivre et résoudre les litiges rapidement.</li>
            <li>Offrir une interface intuitive pour créer et gérer des plans de paiement.</li>
            <li>Assurer une communication claire entre les parties grâce à des outils d’aide et de support.</li>
          </ul>
        </div>
      </section>

     

      {/* Section Équipe */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-black">
          Notre Équipe
        </h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-black">
            Nous sommes une équipe de développeurs et de gestionnaires passionnés, travaillant ensemble pour fournir une solution fiable et efficace. Pour toute question, contactez-nous via la section "Aide".
          </p>
        </div>
      </section>

      {/* Section LinkedIn et Site Web */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-black">
          Retrouvez-Nous
        </h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-center space-x-6">
            <a href="https://www.linkedin.com/company/shamash-it/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center">
              <FaLinkedin className="text-2xl" />
            </a>
            <a href="https://www.shamash-it.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center">
              <FaGlobe className="text-2xl" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};