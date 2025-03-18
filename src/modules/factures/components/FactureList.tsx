import { useEffect, useState } from "react";
import { getFactures } from "@/modules/factures/services/factureService";
import { Facture } from "@/modules/acheteurs/types/Interface";
import { getAcheteurs } from "@/modules/acheteurs/services/AcheteurService";
import { Acheteur } from "@/modules/acheteurs/types/Interface";

export const FactureList = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);
  const [selectedAcheteur, setSelectedAcheteur] = useState<number | null>(null);

  useEffect(() => {
    getFactures().then(setFactures).catch(console.error);
    getAcheteurs().then(setAcheteurs).catch(console.error);
  }, []);

  const filteredFactures = selectedAcheteur
    ? factures.filter((facture) => facture.acheteurID === selectedAcheteur)
    : factures;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Liste des Factures</h2>
      <select
        onChange={(e) => setSelectedAcheteur(e.target.value ? Number(e.target.value) : null)}
        className="border p-2 w-full mb-4"
      >
        <option value="">Tous les acheteurs</option>
        {acheteurs.map((acheteur) => (
          <option key={acheteur.acheteurID} value={acheteur.acheteurID}>
            {acheteur.nom} {acheteur.prenom}
          </option>
        ))}
      </select>
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-blue-200">
            <th className="p-2">Numéro</th>
            <th className="p-2">Échéance</th>
            <th className="p-2">Montant Total</th>
            <th className="p-2">Montant Restant</th>
            <th className="p-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {filteredFactures.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center">Aucune facture trouvée.</td>
            </tr>
          ) : (
            filteredFactures.map((facture) => {
              const statut =
                facture.montantRestantDue === 0
                  ? "Payée"
                  : facture.montantRestantDue === facture.montantTotal
                  ? "Impayée"
                  : "Partiellement payée";

              return (
                <tr key={facture.factureID} className="text-center border-t">
                  <td className="p-2">{facture.numFacture}</td>
                  <td className="p-2">{facture.dateEcheance}</td>
                  <td className="p-2">{facture.montantTotal} DT</td>
                  <td className="p-2">{facture.montantRestantDue} DT</td>
                  <td className="p-2">{statut}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};