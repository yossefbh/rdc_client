import { useEffect, useState } from "react";
import { getAcheteurs } from "@/modules/acheteurs/services/AcheteurService";
import { Acheteur } from "@/modules/acheteurs/types/Interface";

export const AcheteurList = () => {
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);

  const refreshAcheteurs = async () => {
    try {
      const response = await fetch("https://localhost:7284/api/Acheteurs/Refresh");
      const text = await response.text();
      if (text === "Refreshed") {
        getAcheteurs().then(setAcheteurs).catch(console.error);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des acheteurs", error);
    }
  };

  useEffect(() => {
    getAcheteurs().then(setAcheteurs).catch(console.error);
  }, []);

  return (
    <div>

      <button onClick={refreshAcheteurs} className="px-4 py-2 bg-green-700 text-amber-50 rounded hover:bg-green-400 cursor-pointer mb-4">Refresh</button>
      
      <table className="w-full bg-white shadow rounded-lg overflow-hidden ">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="p-3 text-lg">Nom</th>
            <th className="p-3 text-lg">Prénom</th>
            <th className="p-3 text-lg">Adresse</th>
            <th className="p-3 text-lg">Email</th>
            <th className="p-3 text-lg">Téléphone</th>
          </tr>
        </thead>
        <tbody>
          {acheteurs.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center">Aucun acheteur trouvé.</td>
            </tr>
          ) : (
            acheteurs.map((acheteur) => (
              <tr key={acheteur.acheteurID} className="text-center border-t hover:bg-gray-50">
                <td className="p-3">{acheteur.nom}</td>
                <td className="p-3">{acheteur.prenom}</td>
                <td className="p-3">{acheteur.adresse}</td>
                <td className="p-3">{acheteur.email}</td>
                <td className="p-3">{acheteur.telephone}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
