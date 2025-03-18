import { useEffect, useState } from "react";
import { getAcheteurs } from "@/modules/acheteurs/services/AcheteurService";
import { Acheteur } from "@/modules/acheteurs/types/Interface";

export const AcheteurList = () => {
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);

  useEffect(() => {
    getAcheteurs().then(setAcheteurs).catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Liste des Acheteurs</h2>
      <ul className="border p-4 bg-white rounded-md">
        {acheteurs.length === 0 ? (
          <p>Aucun acheteur trouvé.</p>
        ) : (
          acheteurs.map((acheteur) => (
            <li key={acheteur.acheteurID} className="border-b p-2">
              <strong>Nom:</strong> {acheteur.nom} {acheteur.prenom} <br />
              <strong>Adresse:</strong> {acheteur.adresse} <br />
              <strong>Email:</strong> {acheteur.email} <br />
              <strong>Téléphone:</strong> {acheteur.telephone}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};