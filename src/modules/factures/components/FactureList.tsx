import { useEffect, useState } from "react";
import { getFactures } from "@/modules/factures/services/factureService";
import { Facture } from "@/modules/acheteurs/types/Interface";
import { getAcheteurs } from "@/modules/acheteurs/services/AcheteurService";
import { Acheteur } from "@/modules/acheteurs/types/Interface";
import { createPlanPaiement } from "@/modules/paiements/services/paiementService";
import { toast } from "react-toastify";

export const FactureList = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);
  const [selectedAcheteur, setSelectedAcheteur] = useState<number | null>(null);
  const [selectedFactures, setSelectedFactures] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [optionPaiement, setOptionPaiement] = useState("mois");
  const [valeur, setValeur] = useState(0);
  const [resultat, setResultat] = useState<{ nombreEcheances: number; montantEcheance: number } | null>(null);
  const [datesEcheances, setDatesEcheances] = useState<string[]>([]);
  const [montantTotalSelection, setMontantTotalSelection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const refreshFactures = async () => {
    try {
      const response = await fetch("https://localhost:7284/api/Factures/Refresh");
      const text = await response.text();
      if (text === "Refreshed") {
        getFactures().then(setFactures).catch(console.error);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des factures", error);
    }
  };

  useEffect(() => {
    getFactures().then(setFactures).catch(console.error);
    getAcheteurs().then(setAcheteurs).catch(console.error);
  }, []);

  const filteredFactures = selectedAcheteur
    ? factures.filter((facture) => facture.acheteurID === selectedAcheteur)
    : factures;

  const filteredByStatus = selectedStatus === "all" 
    ? filteredFactures 
    : filteredFactures.filter(facture => facture.status === selectedStatus);

  const eligibleFactures = filteredByStatus.filter(
    facture => facture.status !== "EnCoursDePaiement" && 
               facture.status!="Payee"
  );

  useEffect(() => {
    const total = factures
      .filter((facture) => selectedFactures.includes(facture.factureID))
      .reduce((sum, facture) => sum + facture.montantRestantDue, 0);

    setMontantTotalSelection(total);
  }, [selectedFactures, factures]);

  const toggleSelection = (factureID: number) => {
    setSelectedFactures((prev) =>
      prev.includes(factureID) ? prev.filter((id) => id !== factureID) : [...prev, factureID]
    );
  };
  const PlanificationErrorToast = () => (
    <div className="text-sm">
      <strong className="block text-base mb-2">Planification impossible !</strong>
      <p className="mb-2">Raisons possibles :</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>La facture est déjà en cours de paiement</li>
        <li>La facture est déjà payée</li>
        <li>La facture est en litige</li>
      </ul>
    </div>
  );

  const handlePlanifierPaiement = () => {
    if (!selectedAcheteur) {
      toast.error("Veuillez choisir un acheteur.", {
        autoClose: 2500,
      });
      return;
    }

    if (selectedFactures.length === 0) {
      toast.error("Il faut au moins choisir une facture.", {
        autoClose: 2500,
      });
      return;
    }

    const facturesSelectionnees = factures.filter(facture => 
      selectedFactures.includes(facture.factureID)
    );

    if (facturesSelectionnees.some(facture => 
      facture.status === "EnCoursDePaiement" || 
      facture.status === "EnLitige" ||
      facture.montantRestantDue === 0 
    )) {
      toast.error(<PlanificationErrorToast />, {
        className: "custom-toast",
      });
      return;
    }

    setOptionPaiement("mois");
    setValeur(0);
    setResultat(null);
    setDatesEcheances([]);
    setShowModal(true);
  };

  const handleCalculer = () => {
    const montantTotal = factures
      .filter((facture) => selectedFactures.includes(facture.factureID))
      .reduce((sum, facture) => sum + facture.montantRestantDue, 0);

    if (valeur <= 0) return;

    let nombreEcheances = 0;
    let montantEcheance = 0;

    if (optionPaiement === "mois") {
      nombreEcheances = valeur;
      montantEcheance = montantTotal / valeur;
    } else if (optionPaiement === "montant") {
      nombreEcheances = Math.ceil(montantTotal / valeur);
      montantEcheance = valeur;
    }

    setResultat({ nombreEcheances, montantEcheance });

    const dates: string[] = [];
    const now = new Date();

    for (let i = 1; i <= nombreEcheances; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i * 30);
      dates.push(date.toLocaleDateString("fr-FR"));
    }

    setDatesEcheances(dates);
  };

  const handleValidation = async () => {
    if (!resultat || selectedFactures.length === 0) {
      toast.error("Veuillez d'abord calculer le plan de paiement", {
        autoClose: 3000,
      });
      return;
    }
  
    setIsSubmitting(true);
    try {
      const planData = {
        montantTotal: montantTotalSelection,
        nombreDeEcheances: resultat.nombreEcheances,
        montantDeChaqueEcheance: resultat.montantEcheance,
        factureIDs: selectedFactures
      };
  
      await createPlanPaiement(planData);
  
      toast.success("Plan de paiement validé avec succès ! Un email a été envoyé.", {
        autoClose: 3000,
      });
      setShowModal(false);
      getFactures().then(setFactures).catch(console.error);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue lors de la validation", {
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button 
            onClick={refreshFactures} 
            className="px-4 py-2 bg-green-700 text-amber-50 rounded hover:bg-green-400 cursor-pointer "
          >
            Refresh
          </button>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="all">Filtrer Tous</option>
            <option value="Impayee">Non payé</option>
            <option value="PartiellementPayee">Partiellement payé</option>
            <option value="Payee">Payé</option>
            <option value="EnCoursDePaiement">En cours de paiement</option>
            <option value="EnLitige">En litige</option>
          </select>
        </div>
        
        <button 
          onClick={handlePlanifierPaiement} 
          className="px-4 py-2 bg-blue-700 text-amber-50 rounded hover:bg-blue-400 cursor-pointer mb-4"
        >
          Planifier un paiement
        </button>
      </div>

      <div className="bg-blue-100 p-3 rounded-lg mb-4">
        <p className="text-lg font-semibold text-gray-800">
          Montant total à payer : <span className="text-blue-600">{montantTotalSelection} DT</span>
        </p>
      </div>

      <select
        onChange={(e) => {
          setSelectedAcheteur(e.target.value ? Number(e.target.value) : null);
          setSelectedFactures([]);
          setMontantTotalSelection(0);
        }}
        className="border p-2 w-full mb-4 rounded"
      >
        <option value="">Tous les acheteurs</option>
        {acheteurs.map((acheteur) => (
          <option key={acheteur.acheteurID} value={acheteur.acheteurID}>
            {acheteur.nom} {acheteur.prenom}
          </option>
        ))}
      </select>

      <div className="flex">
        {selectedAcheteur &&  (
          <div className="flex flex-col mr-3" style={{ marginTop: '2.75rem' }}>
            {filteredByStatus.map((facture) => {
              const isEligible = eligibleFactures.some(f => f.factureID === facture.factureID);
              return (
                <div 
                  key={facture.factureID} 
                  className="h-12 flex items-center justify-center"
                  style={{ height: '3rem' }}
                >
                  {isEligible && (
                    <input
                      type="checkbox"
                      className="h-5 w-5 mt-3"
                      onChange={() => toggleSelection(facture.factureID)}
                      checked={selectedFactures.includes(facture.factureID)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <table className="w-full bg-white shadow rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-3 text-lg">Numéro</th>
              <th className="p-3 text-lg">Échéance</th>
              <th className="p-3 text-lg">Montant Total</th>
              <th className="p-3 text-lg">Montant Due </th>
              <th className="p-3 text-lg">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredByStatus.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">Aucune facture trouvée.</td>
              </tr>
            ) : (
              filteredByStatus.map((facture) => {
                return (
                  <tr key={facture.factureID} className="text-center border-t">
                    <td className="p-2">{facture.numFacture}</td>
                    <td className="p-2">{facture.dateEcheance}</td>
                    <td className="p-2">{facture.montantTotal} DT</td>
                    <td className="p-2">{facture.montantRestantDue} DT</td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        facture.status === "Payee" ? "bg-green-100 text-green-800" :
                        facture.status === "Impayee" ? "bg-red-100 text-red-800" :
                        facture.status === "PartiellementPayee" ? "bg-yellow-100 text-yellow-800" :
                        facture.status === "EnCoursDePaiement" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-200 text-gray-800"
                      }`}>
                        {facture.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">Plan de Paiement</h2>

            <div className="mb-4 flex items-center gap-2">
              <label className="whitespace-nowrap">Option :</label>
              <select
                value={optionPaiement}
                onChange={(e) => {
                  setOptionPaiement(e.target.value);
                  setResultat(null);
                  setDatesEcheances([]);
                  setValeur(0);
                }}
                className="border p-2 w-auto"
              >
                <option value="mois">Nombre de mois</option>
                <option value="montant">Montant par échéance</option>
              </select>
            </div>

            <input
              type="number"
              className="border p-2 mb-4 w-full"
              value={valeur === 0 ? "" : valeur}
              onChange={(e) => setValeur(Number(e.target.value) || 0)}
              placeholder={optionPaiement === "mois" ? "Nombre de mois" : "Montant par échéance"}
            />

            <button 
              onClick={handleCalculer} 
              className="p-2 bg-blue-500 text-white rounded w-full mb-4"
            >
              Calculer
            </button>

            {resultat && (
              <div className="mt-4">
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <p><strong>Nombre d'échéances :</strong> {resultat.nombreEcheances}</p>
                  <p><strong>Montant par échéance : </strong>{resultat.montantEcheance.toFixed(3)}DT</p>
                </div>

                <div className="mb-4">
                  <p className="font-semibold mb-2">Dates des échéances :</p>
                  <div className="max-h-60 overflow-y-auto border p-2">
                    <ul className="list-disc list-inside">
                      {datesEcheances.map((date, index) => (
                        <li key={index} className="mb-1">Échéance {index + 1} : {date}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button 
                  onClick={handleValidation}
                  disabled={isSubmitting}
                  className={`p-2 rounded w-full ${
                    isSubmitting ? 'bg-gray-400' : 'bg-green-600 text-white'
                  }`}
                >
                  {isSubmitting ? "Validation en cours..." : "Valider"}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowModal(false);
                setOptionPaiement("mois");
                setValeur(0);
                setResultat(null);
                setDatesEcheances([]);
              }}
              className="mt-4 p-2 bg-red-500 text-white rounded w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};