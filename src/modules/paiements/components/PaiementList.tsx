import { useState } from "react";
import { usePaiements } from "@/modules/paiements/hooks/usePaiements";
import { PlanDePaiement, PaiementDate } from "../types/Interface";
import { payerEcheance } from "../services/paiementService";

export const PaiementList = () => {
  const { plans, loading, error } = usePaiements();
  const [selectedPlan, setSelectedPlan] = useState<PlanDePaiement | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [selectedEcheance, setSelectedEcheance] = useState<PaiementDate | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  if (loading) return <p>Chargement des plans...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const toggleMenu = (planId: number) => {
    setOpenMenuId(openMenuId === planId ? null  : planId);
  };

  const preparePayment = (echeance: PaiementDate) => {
    if (selectedPlan?.planStatus === "Termine") {
      alert("Ce plan est déjà terminé et ne peut plus être payé.");
      return;
    }
    setSelectedEcheance(echeance);
    setPaymentAmount("");
    setShowAmountModal(true);
  };

  const confirmPaymentAmount = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) {
      alert("Veuillez entrer un montant valide");
      return;
    }
    if (amount <= 0 || amount > (selectedEcheance?.montantDue || 0)) {
      alert("Montant invalide");
      return;
    }
    setShowAmountModal(false);
    setShowConfirmModal(true);
  };

  const handlePayEcheance = async () => {
    const amount = parseFloat(paymentAmount);
    if (!selectedPlan || !selectedEcheance || isNaN(amount)) return;
    
    setIsProcessingPayment(true);
    setShowConfirmModal(false);
    
    try {
      await payerEcheance({
        planID: selectedPlan.planID,
        paiementDateID: selectedEcheance.dateID,
        montantPayee: amount,
        dateDePaiement: new Date().toISOString()
      });


      const isFullyPaid = amount >= selectedEcheance.montantDue;
      const updatedPlan = {
        ...selectedPlan,
        montantRestant: selectedPlan.montantRestant - amount,
        paiementDates: selectedPlan.paiementDates.map(echeance => 
          echeance.dateID === selectedEcheance.dateID
            ? {
                ...echeance,
                montantPayee: echeance.montantPayee + amount,
                montantDue: echeance.montantDue - amount,
                isPaid: isFullyPaid,
                isLocked: isFullyPaid
              }
            : echeance
        ),
        factures: selectedPlan.factures.map(facture => ({
          ...facture,
          montantRestantDue: facture.montantRestantDue - (amount / selectedPlan.factures.length),
          status: facture.montantRestantDue - (amount / selectedPlan.factures.length) <= 0 
            ? "Payée" 
            : "EnCours"
        }))
      };

      setSelectedPlan(updatedPlan);
    } catch (err) {
      console.error("Erreur de paiement:", err);
      alert("Erreur lors du paiement");
    } finally {
      setIsProcessingPayment(false);
      setSelectedEcheance(null);
      setPaymentAmount("");
    }
  };

  return (
    <div className="overflow-visible"> 
      <table className="w-full bg-white shadow rounded-lg overflow-visible">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="p-3 text-lg">Date de création</th>
            <th className="p-3 text-lg">Total Des Factures</th>
            <th className="p-3 text-lg">Montant Restant</th>
            <th className="p-3 text-lg">Échéances</th>
            <th className="p-3 text-lg">Montant / Échéance</th>
            <th className="p-3 text-lg">Statut</th>
            <th className="p-3 text-lg">Actions</th>
          </tr>
        </thead>
        <tbody className="overflow-visible">
          {plans.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-4 text-center">Aucun plan trouvé.</td>
            </tr>
          ) : (
            plans.map((plan, index) => {
              const totalMontantRestant = plan.factures.reduce(
                (acc, facture) => acc + facture.montantRestantDue,
                0
              );
              
              const totalMontantFactures = plan.factures.reduce(
                (acc, facture) => acc + facture.montantTotal,
                0
              );

              return (
                <tr key={plan.planID} className="text-center border-t hover:bg-gray-50 relative overflow-visible">
                  <td className="p-2">{new Date(plan.creationDate).toLocaleDateString()}</td>
                  <td className="p-2">{totalMontantFactures} DT</td>
                  <td className="p-2">{totalMontantRestant} DT</td>
                  <td className="p-2">{plan.nombreDeEcheances}</td>
                  <td className="p-2">{plan.montantDeChaqueEcheance} DT</td>
                  <td className="p-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      plan.planStatus === "Termine" ? "bg-green-200 text-green-800" :
                      plan.planStatus === "EnCours" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {plan.planStatus}
                    </span>
                  </td>
                  <td className="p-2 relative overflow-visible">
                    <div className="relative inline-block">
                      <button
                        onClick={() => toggleMenu(plan.planID)}
                        className="p-1 rounded-full hover:bg-gray-200"
                        aria-label="Menu actions"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h.01M12 12h.01M19 12h.01" />
                        </svg>
                      </button>

                      {openMenuId === plan.planID && (
                        <div 
                          className={`
                            absolute right-0 z-50 w-42 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5
                            ${plans.length === 1 ? 'top-full mt-2' : ''}
                            ${plans.length > 1 && index >= plans.length - 2 ? 'top-full mb-3' : 'top-full mt-1'}
                          `}
                          style={{
                            visibility: 'visible',
                            overflow: 'visible'
                          }}
                        >
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setSelectedPlan(plan);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-blue-50"
                            >
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Détails
                            </button>
                            <button
                              onClick={() => {
                                if (plan.planStatus === "Termine") {
                                  alert("Ce plan est déjà terminé et ne peut plus être payé.");
                                  setOpenMenuId(null);
                                  return;
                                }
                                setSelectedPlan(plan);
                                setShowPaymentModal(true);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                            >
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Payer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
  {/* Modal Détails du Plan */}
{selectedPlan && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white w-3/4 p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold">Détails du Plan {selectedPlan.planID}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"> 
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-800 mb-2">Montant total des factures</h4>
          <p className="text-xl font-bold">
            {selectedPlan.factures.reduce((sum, f) => sum + f.montantTotal, 0)} DT
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-800 mb-2">Montant total à payer</h4>
          <p className="text-xl font-bold">
            {selectedPlan.factures.reduce((sum, f) => sum + f.montantRestantDue, 0)} DT
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-800 mb-2">Montant restant</h4>
          <p className="text-xl font-bold">
            {selectedPlan.montantRestant} DT
          </p>
        </div>
      </div>
            <div className="mb-8">
              <h4 className="font-semibold text-lg mb-3 border-b pb-2">Factures du plan</h4>
              <div className="overflow-x-auto">
                <table className="w-full bg-white shadow rounded">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="pl-6 pr-3 py-3 text-left w-[20%]">Numéro</th>
                      <th className="pl-6 pr-3 py-3 text-left w-[20%]">Échéance</th>
                      <th className="px-7 py-3 text-right w-[10%]">Total</th>
                      <th className="px-4 py-3 text-right w-[15%]">Restant</th>
                      <th className="px-4 py-3 text-center w-[30%]">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlan.factures.map((facture) => (
                      <tr key={facture.factureID} className="border-t hover:bg-gray-50">
                        <td className="pl-6 pr-3 py-3 whitespace-nowrap">{facture.numFacture}</td>
                        <td className="pl-6 pr-3 py-3 whitespace-nowrap">{facture.dateEcheance}</td>
                        <td className="px-4 py-3 text-right">{facture.montantTotal} DT</td>
                        <td className="px-4 py-3 text-right font-medium">{facture.montantRestantDue} DT</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            facture.status === "Payée" ? "bg-green-100 text-green-800" :
                            facture.status === "EnCours" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {facture.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-3 border-b pb-2">Échéances de Paiement</h4>
              <div className="overflow-x-auto">
                <table className="w-full bg-white shadow rounded">
                  <thead>
                    <tr className="bg-green-300">
                      <th className="pl-6 pr-3 py-3 text-left w-[30%]">Date</th>
                      <th className="p-3 text-center w-[25%]">Montant</th>
                      <th className="p-3 text-center w-[25%]">Restant</th>
                      <th className="p-3 text-center w-[20%]">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlan.paiementDates.map((paiement) => (
                      <tr key={paiement.dateID} className="border-t hover:bg-gray-50">
                        <td className="pl-6 pr-3 py-3 whitespace-nowrap">{paiement.echeanceDate}</td>
                        <td className="p-3 text-center">{paiement.montantDeEcheance} DT</td>
                        <td className="p-3 text-center">{paiement.montantDue} DT</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            paiement.isPaid ? "bg-green-100 text-green-800" : 
                            paiement.montantPayee > 0 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                          }`}>
                            {paiement.isPaid ? "Payé" : paiement.montantPayee > 0 ? "Partiel" : "Non Payé"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-8 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de paiement des échéances */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-3/4 p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold border-b pb-2">Paiement - Plan {selectedPlan.planID}</h3>
            </div>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
              <p className="font-semibold text-lg text-center text-blue-800">
                Montant restant à payer : <span>{selectedPlan.montantRestant.toFixed(3)} DT</span>
              </p>
            </div>

            <table className="w-full bg-white shadow rounded">
              <thead>
                <tr className="bg-green-300">
                  <th className="p-2">Date</th>
                  <th className="p-2">Montant d'échéance</th>
                  <th className="p-2">Restant</th>
                  <th className="p-2">Statut</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedPlan.paiementDates.map((echeance) => (
                  <tr key={echeance.dateID} className="border-t text-center">
                    <td className="p-2">{echeance.echeanceDate}</td>
                    <td className="p-2">{echeance.montantDeEcheance} DT</td>
                    <td className="p-2">{echeance.montantDue} DT</td>
                    <td className={`p-2 ${
                      echeance.isPaid ? "text-green-600" : 
                      echeance.montantPayee > 0 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {echeance.isPaid ? "Payé" : echeance.montantPayee > 0 ? "Partiel" : "À payer"}
                    </td>
                    <td className="p-2">
                      {!echeance.isPaid && (
                        <button
                          onClick={() => {
                            if (selectedPlan.planStatus === "Termine") {
                              alert("Ce plan est déjà terminé et ne peut plus être payé.");
                              return;
                            }
                            preparePayment(echeance);
                          }}
                          disabled={isProcessingPayment || echeance.isPaid}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
                        >
                          Payer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPlan(null);
                }}
                className="px-8 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de saisie du montant */}
      {showAmountModal && selectedEcheance && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h3 className="text-xl font-bold mb-4">Montant à payer</h3>
      <div className="mb-4">
     
        <label className="block text-gray-700 mb-2">
          Montant restant: {selectedEcheance.montantDue} DT
        </label>
        <input
          type="number"
          min="0.001"
          step="0.001"
          max={selectedEcheance.montantDue}
          value={paymentAmount}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setPaymentAmount("");
            } else {
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                const limitedValue = Math.min(numValue, selectedEcheance.montantDue);
                setPaymentAmount(limitedValue.toString());
              }
            }
          }}
          className="w-full p-2 border rounded mt-2"
          placeholder="Saisir le montant à payer"
        />
        <p className="text-sm text-gray-500 mt-1">
          Max montant à saisir : {selectedEcheance.montantDue} DT
        </p>
      </div>
      
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowAmountModal(false)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
        >
          Annuler
        </button>
        <button
          onClick={confirmPaymentAmount}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
        >
          Confirmer
        </button>
      </div>
    </div>
  </div>
)}

      {/* Modal de confirmation de paiement */}
      {showConfirmModal && selectedEcheance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmation du paiement</h3>
            <p className="mb-2">Vous allez payer: {parseFloat(paymentAmount || "0")} DT</p>
            <p className="mb-4">sur un montant dû de: {selectedEcheance.montantDue} DT</p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handlePayEcheance}
                disabled={isProcessingPayment}
                className={`px-4 py-2 text-white rounded cursor-pointer ${
                  isProcessingPayment ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isProcessingPayment ? "Traitement..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};