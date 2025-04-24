import { useState } from "react";
import { usePaiements } from "@/modules/paiements/hooks/usePaiements";
import { PlanDePaiement, PaiementDate } from "../types/Interface";
import { payerEcheance, getEcheanceDetails, createPlanPaiement, createPaiementDates, lockPlanPaiement } from "../services/paiementService";
import { toast } from "react-toastify";
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

export const PaiementList = () => {
  const { plans, loading, error, refresh } = usePaiements();
  const [selectedPlan, setSelectedPlan] = useState<PlanDePaiement | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [selectedEcheance, setSelectedEcheance] = useState<PaiementDate | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEcheanceDetails, setSelectedEcheanceDetails] = useState<PaiementDate | null>(null);
  const [openHistoryMenuId, setOpenHistoryMenuId] = useState<number | null>(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [optionPaiement, setOptionPaiement] = useState("");
  const [valeur, setValeur] = useState(0);
  const [resultat, setResultat] = useState<{ nombreEcheances: number; montantEcheance: number } | null>(null);
  const [datesEcheances, setDatesEcheances] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFactures, setSelectedFactures] = useState<number[]>([]);
  const [showInitialPaymentPrompt, setShowInitialPaymentPrompt] = useState(false);
  const [showInitialPaymentInput, setShowInitialPaymentInput] = useState(false);
  const [initialPayment, setInitialPayment] = useState(0);
  const [showLibreModal, setShowLibreModal] = useState(false);
  const [libreEcheances, setLibreEcheances] = useState<{ date: string; montant: number }[]>([]);
  const [calculatedEcheances, setCalculatedEcheances] = useState<{ date: string; montant: number }[]>([]);

  if (loading) return <p>Chargement des plans...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const formatMontant = (montant: number | undefined | null) => {
    if (montant == null || isNaN(montant)) {
      return "0.000";
    }
    return montant.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const createAndSavePlan = async (
    montantTotal: number,
    nombreEcheances: number,
    factureIDs: number[],
    initialPayment: number,
    echeances: { date: string; montant: number }[]
  ) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const planData = {
        montantTotal,
        nombreDeEcheances: initialPayment > 0 ? nombreEcheances + 1 : nombreEcheances,
        factureIDs,
      };
      const planResult = await createPlanPaiement(planData);
  
      if (!planResult || !planResult.planID) {
        throw new Error("ID du plan non retourné par l'API");
      }
  
      const planID = planResult.planID;
      const paiementDates = [];
  
      if (initialPayment > 0) {
        paiementDates.push({
          planID,
          echeanceDate: today,
          montantDeEcheance: initialPayment,
          montantPayee: initialPayment,
          montantDue: 0,
          isPaid: true,
          isLocked: true,
        });
      }
  
      echeances.forEach(({ date, montant }) => {
        paiementDates.push({
          planID,
          echeanceDate: date,
          montantDeEcheance: montant,
          montantPayee: 0,
          montantDue: montant,
          isPaid: false,
          isLocked: false,
        });
      });
  
      const paiementDatesData = { paiementDates };
      await createPaiementDates(paiementDatesData);
  
      if (selectedPlan?.planStatus === "ANNULE") {
        await lockPlanPaiement(selectedPlan.planID);
      }
  
      toast.success("Plan de paiement validé avec succès ! Un email a été envoyé.", { autoClose: 3000 });
      setShowNewPlanModal(false);
      setOptionPaiement("");
      setValeur(0);
      setResultat(null);
      setDatesEcheances([]);
      setInitialPayment(0);
      setSelectedFactures([]);
      setSelectedPlan(null);
      setShowLibreModal(false);
      setLibreEcheances([]);
      setCalculatedEcheances([]);
      refresh();
    } catch (error) {
      console.error("Erreur dans createAndSavePlan :", error);
      throw error;
    }
  };
  
  const toggleMenu = (planId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === planId ? null : planId);
  };

  const preparePayment = (echeance: PaiementDate) => {
    if (selectedPlan?.planStatus === "TERMINE") {
      toast.error("Ce plan est déjà terminé et ne peut plus être payé.");
      return;
    }
    setSelectedEcheance(echeance);
    setPaymentAmount("");
    setShowAmountModal(true);
  };

  const confirmPaymentAmount = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    if (amount <= 0 || amount > (selectedEcheance?.montantDue || 0)) {
      toast.error("Montant invalide");
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
        dateDePaiement: new Date().toISOString(),
      });

      const isFullyPaid = amount >= selectedEcheance.montantDue;
      const updatedPlan = {
        ...selectedPlan,
        montantRestant: selectedPlan.montantRestant - amount,
        paiementDates: selectedPlan.paiementDates.map((echeance) =>
          echeance.dateID === selectedEcheance.dateID
            ? {
                ...echeance,
                montantPayee: echeance.montantPayee + amount,
                montantDue: echeance.montantDue - amount,
                isPaid: isFullyPaid,
                isLocked: isFullyPaid,
              }
            : echeance
        ),
        factures: selectedPlan.factures.map((facture) => ({
          ...facture,
          montantRestantDue: facture.montantRestantDue - amount / selectedPlan.factures.length,
          status:
            facture.montantRestantDue - amount / selectedPlan.factures.length <= 0
              ? "PAYEE"
              : "EN_COURS_DE_PAIEMENT",
        })),
        isLocked: isFullyPaid ? true : selectedPlan.isLocked,
      };

      setSelectedPlan(updatedPlan);
      toast.success("Paiement effectué avec succès !");
    } catch (err) {
      console.error("Erreur de paiement:", err);
      toast.error("Erreur lors du paiement");
    } finally {
      setIsProcessingPayment(false);
      setSelectedEcheance(null);
      setPaymentAmount("");
    }
  };

  const toggleHistoryMenu = (dateID: number) => {
    setOpenHistoryMenuId(openHistoryMenuId === dateID ? null : dateID);
  };

  const showPaymentHistory = async (dateID: number) => {
    try {
      const details = await getEcheanceDetails(dateID);
      setSelectedEcheanceDetails(details);
      setShowHistoryModal(true);
      setOpenHistoryMenuId(null);
    } catch (err) {
      console.error("Erreur lors de la récupération de l'historique:", err);
      toast.error("Impossible de charger l'historique des paiements");
    }
  };

  const handleAjouterNouveauPlan = (plan: PlanDePaiement) => {
    const allFacturesPaid = plan.factures.every((facture) => facture.status === "PAYEE");
    if (allFacturesPaid) {
      toast.error("Impossible de créer un nouveau plan : toutes les factures sont déjà payées.");
      setOpenMenuId(null);
      return;
    }
    if (plan.planStatus === "ANNULE" && plan.isLocked) {
      toast.error("Vous avez créé un plan pour les mêmes factures.");
      setOpenMenuId(null);
      return;
    }
    const factureIds = plan.factures
      .filter((f) => f.status !== "PAYEE")
      .map((f) => f.factureID);
    setSelectedFactures(factureIds);
    setSelectedPlan(plan);
    setOptionPaiement("");
    setValeur(0);
    setResultat(null);
    setDatesEcheances([]);
    setInitialPayment(0);
    setShowInitialPaymentPrompt(false);
    setShowInitialPaymentInput(false);
    setShowLibreModal(false);
    setLibreEcheances([]);
    setCalculatedEcheances([]);
    setShowNewPlanModal(true);
    setOpenMenuId(null);
  };

  const handleCalculer = () => {
    if (!selectedPlan) {
      toast.error("Aucun plan sélectionné.");
      return;
    }
    const montantTotal = selectedPlan.montantRestant - initialPayment;
    if (valeur <= 0) {
      toast.error("Veuillez entrer une valeur valide.");
      return;
    }
    let nombreEcheances = 0;
    let montantEcheance = 0;
    let echeances: { date: string; montant: number }[] = [];
  
    if (optionPaiement === "mois") {
      nombreEcheances = valeur;
      montantEcheance = Number((montantTotal / valeur).toFixed(3));
      echeances = Array(nombreEcheances).fill(0).map(() => ({
        date: "",
        montant: montantEcheance,
      }));
  
      const totalSansAjustement = montantEcheance * nombreEcheances;
      const difference = Number((montantTotal - totalSansAjustement).toFixed(3));
      if (difference !== 0) {
        echeances[nombreEcheances - 1].montant = Number((montantEcheance + difference).toFixed(3));
      }
    } else if (optionPaiement === "montant") {
      montantEcheance = valeur; 
      nombreEcheances = Math.floor(montantTotal / valeur);
      const montantRestant = montantTotal % valeur;
      if (montantRestant > 0) {
        nombreEcheances += 1;
      }
      echeances = Array(nombreEcheances).fill(0).map((_, index) => ({
        date: "",
        montant: index < nombreEcheances - 1 || montantRestant === 0 ? valeur : montantRestant,
      }));
    }
  
    setResultat({ nombreEcheances, montantEcheance });
  
    const dates: string[] = [];
    const now = new Date();
    now.setDate(now.getDate() + 30);
    for (let i = 0; i < nombreEcheances; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i * 30);
      echeances[i].date = date.toISOString().split("T")[0];
      dates.push(echeances[i].date);
    }
    setDatesEcheances(dates);
    setCalculatedEcheances(echeances);
  };
  
  const validateDates = (dates: string[], today: string) => {
    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      if (!dates[i] || currentDate <= new Date(today)) {
        toast.error("Veuillez sélectionner une date future valide.", { autoClose: 3000 });
        return false;
      }
      if (i > 0 && currentDate <= new Date(dates[i - 1])) {
        toast.error(
          "Chaque date d'échéance doit être postérieure à la date de l'échéance précédente.",
          { autoClose: 3000 }
        );
        return false;
      }
    }
    return true;
  };

  const handleValidation = async () => {
    if (!selectedPlan) {
      toast.error("Aucun plan sélectionné.", { autoClose: 3000 });
      return;
    }
    if (selectedFactures.length === 0) {
      toast.error("Aucune facture sélectionnée.", { autoClose: 3000 });
      return;
    }
    const planFactureIds = selectedPlan.factures.map((f) => f.factureID);
    if (!selectedFactures.every((id) => planFactureIds.includes(id))) {
      toast.error("Les factures sélectionnées ne correspondent pas au plan.", { autoClose: 3000 });
      return;
    }
    if (optionPaiement === "libre") {
      toast.error("Veuillez valider via le formulaire des échéances libres.", { autoClose: 3000 });
      return;
    }
    if (!resultat || calculatedEcheances.length === 0) {
      toast.error("Veuillez d'abord calculer le plan de paiement.", { autoClose: 3000 });
      return;
    }
    const hasInvalidEcheance = calculatedEcheances.some(echeance => echeance.montant < 20);
    if (hasInvalidEcheance) {
      toast.error("Le montant de chaque échéance doit être d'au moins 20 DT.", { autoClose: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const dates = calculatedEcheances.map(e => e.date);
      if (!validateDates(dates, today)) return;

      await createAndSavePlan(
        selectedPlan.montantRestant,
        resultat.nombreEcheances,
        selectedFactures,
        initialPayment,
        calculatedEcheances
      );
    } catch (error) {
      toast.error("Une erreur est survenue lors de la validation.", { autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitialPayment = (payNow: boolean) => {
    if (payNow) {
      setShowInitialPaymentInput(true);
    } else {
      setInitialPayment(0);
      setShowInitialPaymentPrompt(false);
      setShowLibreModal(optionPaiement === "libre");
    }
  };

  const handleInitialPaymentSubmit = () => {
    const remainingAmount = selectedPlan ? selectedPlan.montantRestant : 0;
    if (initialPayment < 30) {
      toast.error("Le montant initial doit être d'au moins 30 DT.", { autoClose: 3000 });
      return;
    }
    if (initialPayment > remainingAmount) {
      toast.error(`Le montant initial ne peut pas dépasser ${formatMontant(remainingAmount)} DT.`, { autoClose: 3000 });
      return;
    }
    setShowInitialPaymentPrompt(false);
    setShowInitialPaymentInput(false);
    if (optionPaiement === "libre") {
      setShowLibreModal(true);
    }
  };

  const addLibreEcheance = () => {
    const remainingAmount = selectedPlan ? selectedPlan.montantRestant - initialPayment : 0;
    let maxEcheances = 0;
    if (remainingAmount <= 500000) {
      maxEcheances = 12;
    } else if (remainingAmount <= 1000000) {
      maxEcheances = 24;
    } else {
      setLibreEcheances([...libreEcheances, { date: "", montant: 0 }]);
      return;
    }
    if (libreEcheances.length >= maxEcheances) {
      toast.error(`Nombre maximum d'échéances atteint : ${maxEcheances} pour ce montant.`, { autoClose: 3000 });
      return;
    }
    setLibreEcheances([...libreEcheances, { date: "", montant: 0 }]);
  };

  const updateLibreEcheance = (index: number, field: "date" | "montant", value: string | number) => {
    const updatedEcheances = [...libreEcheances];
    updatedEcheances[index] = { ...updatedEcheances[index], [field]: value };
    setLibreEcheances(updatedEcheances);
  };

  const removeLibreEcheance = (index: number) => {
    setLibreEcheances(libreEcheances.filter((_, i) => i !== index));
  };

  const calculateRemainingAmount = () => {
    const totalEcheances = libreEcheances.reduce((sum, e) => sum + e.montant, 0);
    return selectedPlan ? selectedPlan.montantRestant - initialPayment - totalEcheances : 0;
  };

  const validateLibrePlan = async () => {
    const remainingAmount = selectedPlan ? selectedPlan.montantRestant - initialPayment : 0;
    const totalEcheances = libreEcheances.reduce((sum, e) => sum + e.montant, 0);
    const today = new Date().toISOString().split("T")[0];

    let maxEcheances = 0;
    if (remainingAmount <= 500000) {
      maxEcheances = 12;
    } else if (remainingAmount <= 1000000) {
      maxEcheances = 24;
    } else {
      maxEcheances = Infinity;
    }
    if (libreEcheances.length > maxEcheances) {
      toast.error(`Nombre maximum d'échéances : ${maxEcheances}`, { autoClose: 3000 });
      return;
    }
    if (libreEcheances.length === 0) {
      toast.error("Veuillez ajouter au moins une échéance.", { autoClose: 3000 });
      return;
    }

    if (selectedFactures.length === 0) {
      toast.error("Aucune facture sélectionnée.", { autoClose: 3000 });
      return;
    }
    const planFactureIds = selectedPlan ? selectedPlan.factures.map((f) => f.factureID) : [];
    if (!selectedFactures.every((id) => planFactureIds.includes(id))) {
      toast.error("Les factures sélectionnées ne correspondent pas au plan.", { autoClose: 3000 });
      return;
    }
    if (totalEcheances !== remainingAmount) {
      toast.error("Le total des échéances doit correspondre au montant restant.", { autoClose: 3000 });
      return;
    }

    for (let i = 0; i < libreEcheances.length; i++) {
      const echeance = libreEcheances[i];

      if (echeance.montant < 20) {
        toast.error(`Le montant de l'échéance ${i + 1} doit être d'au moins 20 DT.`, { autoClose: 3000 });
        return;
      }
      if (!echeance.date || isNaN(new Date(echeance.date).getTime())) {
        toast.error(`La date de l'échéance ${i + 1} est invalide.`, { autoClose: 3000 });
        return;
      }

      const currentDate = new Date(echeance.date);
      currentDate.setHours(0, 0, 0, 0); 
      const todayDate = new Date(today);
      todayDate.setHours(0, 0, 0, 0);

      // Vérification que la date est future
      if (currentDate <= todayDate) {
        toast.error(`La date de l'échéance ${i + 1} doit être future.`, { autoClose: 3000 });
        return;
      }

      if (i > 0) {
        const previousDate = new Date(libreEcheances[i - 1].date);
        previousDate.setHours(0, 0, 0, 0);
        const diffTime = currentDate.getTime() - previousDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        if (diffDays > 40) {
          toast.error(`L'échéance ${i + 1} ne doit pas dépasser 40 jours par rapport à la précédente.`, { autoClose: 3000 });
          return;
        }

        if (currentDate <= previousDate) {
          toast.error(`La date de l'échéance ${i + 1} doit être postérieure à l'échéance précédente.`, { autoClose: 3000 });
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      await createAndSavePlan(
        selectedPlan ? selectedPlan.montantRestant : 0,
        libreEcheances.length,
        selectedFactures,
        initialPayment,
        libreEcheances
      );
    } catch (error) {
      toast.error("Une erreur est survenue lors de la validation.", { autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'creationDate',
      headerName: 'Date de création',
      width: 235,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      valueGetter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'totalFactures',
      headerName: 'Total des factures',
      width: 235,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      valueFormatter: (_, row) => `${formatMontant(row.factures.reduce((acc: number, facture: any) => acc + facture.montantTotal, 0))} DT`,
    },
    {
      field: 'montantRestant',
      headerName: 'Montant dû',
      width: 235,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      valueFormatter: (value) => `${formatMontant(value)} DT`,
    },
    {
      field: 'nombreDeEcheances',
      headerName: 'Échéances',
      width: 210,
      sortable: true,
      filterable: true,
      type: 'number',
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'planStatus',
      headerName: 'Statut',
      width: 215,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium mx-auto ${params.value.toLowerCase() === "termine"
              ? "bg-green-100 text-green-800"
              : params.value.toLowerCase() === "en_cours"
                ? "bg-yellow-100 text-yellow-800"
                : params.value.toLowerCase() === "annule"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-200 text-gray-800"
            }`}
        >
          {params.value}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => (
        <div className="relative flex justify-center items-center h-full">
          <button
            onClick={(event) => toggleMenu(params.row.planID, event)}
            className="text-gray-600 hover:text-gray-800 text-2xl p-0.5 rounded-full"
          >
            ...
          </button>
          {openMenuId === params.row.planID && (
            <div
              className="absolute top-[100%] left-1/2 -translate-x-1/2 w-45 bg-white border rounded-md shadow-lg z-[1000] -mt-2"
              style={{ minHeight: '40px' }}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    setSelectedPlan(params.row);
                    setOpenMenuId(null);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                >
                  <svg
                    className="inline mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Détails
                </button>
                <button
                  onClick={() => {
                    if (params.row.planStatus === "TERMINE") {
                      toast.error("Ce plan est déjà terminé et ne peut plus être payé.");
                      setOpenMenuId(null);
                      return;
                    }
                    if (params.row.planStatus === "ANNULE") {
                      toast.error("Ce plan est annulé et ne peut pas être payé.");
                      setOpenMenuId(null);
                      return;
                    }
                    setSelectedPlan(null);
                    setTimeout(() => {
                      setSelectedPlan(params.row);
                      setShowPaymentModal(true);
                    }, 0);
                    setOpenMenuId(null);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                >
                  <svg
                    className="inline mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Payer
                </button>
                {params.row.planStatus === "ANNULE" && (
                  <button
                    onClick={() => handleAjouterNouveauPlan(params.row)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                  >
                    <svg
                      className="inline mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Ajouter plan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Box sx={{ height: 'calc(100vh - 60px)', width: '100%' }} className="overflow-visible">
        <DataGrid
          rows={plans}
          columns={columns}
          getRowId={(row) => row.planID}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          filterMode="client"
          sortingMode="client"
          localeText={{
            noRowsLabel: "Aucun plan trouvé.",
          }}
          rowHeight={70}
          sx={{
            '& .MuiDataGrid-cell': {
              overflow: 'visible',
            },
            '& .MuiDataGrid-row': {
              overflow: 'visible',
            },
          }}
        />
      </Box>

      {selectedPlan && !showPaymentModal && !showNewPlanModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white w-3/4 p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold">Détails du Plan {selectedPlan.planID}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">Montant total des factures</h4>
                <p className="text-lg font-bold">
                  {formatMontant(selectedPlan.factures.reduce((sum, f) => sum + f.montantTotal, 0))} DT
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">Montant total à payer</h4>
                <p className="text-lg font-bold">
                  {formatMontant(selectedPlan.factures.reduce((sum, f) => sum + f.montantRestantDue, 0))} DT
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">Montant restant</h4>
                <p className="text-xl font-bold">{formatMontant(selectedPlan.montantRestant)} DT</p>
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
                      <th className="px-15 py-3 text-right w-[5%]">Total</th>
                      <th className="px-7 py-3 text-right w-[15%]">Restant</th>
                      <th className="px-4 py-3 text-center w-[30%]">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlan.factures.map((facture) => (
                      <tr key={facture.factureID} className="border-t hover:bg-gray-50">
                        <td className="pl-6 pr-3 py-3 whitespace-nowrap">{facture.numFacture}</td>
                        <td className="pl-6 pr-3 py-3 whitespace-nowrap">{facture.dateEcheance}</td>
                        <td className="px-5 py-3 text-right font-medium">{formatMontant(facture.montantTotal)} DT</td>
                        <td className="px-2 py-3 text-right font-medium">
                          {formatMontant(facture.montantRestantDue)} DT
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${facture.status === "PAYEE"
                                ? "bg-green-100 text-green-800"
                                : facture.status === "EN_COURS_DE_PAIEMENT"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
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
                      <th className="pl-6 pr-3 py-3 text-left w-[25%]">Date</th>
                      <th className="p-3 text-center w-[20%]">Montant </th>
                      <th className="p-3 text-center w-[20%]">Restant</th>
                      <th className="p-3 text-center w-[15%]">Statut</th>
                      <th className="p-3 text-center w-[20%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlan.paiementDates.map((paiement) => (
                      <tr key={paiement.dateID} className="border-t hover:bg-gray-50">
                        <td className="pl-6 pr-3 py-3 whitespace-nowrap">{paiement.echeanceDate}</td>
                        <td className="p-3 text-center">{formatMontant(paiement.montantDeEcheance)} DT</td>
                        <td className="p-3 text-center">{formatMontant(paiement.montantDue)} DT</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${paiement.isPaid
                                ? "bg-green-100 text-green-800"
                                : paiement.montantPayee > 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {paiement.isPaid
                              ? "Payé"
                              : paiement.montantPayee > 0
                                ? "Partiel"
                                : "Non Payé"}
                          </span>
                        </td>
                        <td className="p-3 text-center relative">
                          <div className="relative inline-block">
                            <button
                              onClick={() => toggleHistoryMenu(paiement.dateID)}
                              className="p-1 rounded-full hover:bg-gray-200"
                              aria-label="Menu historique"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 12h.01M12 12h.01M19 12h.01"
                                />
                              </svg>
                            </button>

                            {openHistoryMenuId === paiement.dateID && (
                              <div
                                className="absolute right-0 z-50 w-32 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 top-full mt-1"
                                style={{ visibility: "visible", overflow: "visible" }}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => showPaymentHistory(paiement.dateID)}
                                    className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-blue-50"
                                  >
                                    <svg
                                      className="mr-2 h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    Historique
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
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

      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white w-3/4 p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold border-b pb-2">
                Paiement - Plan {selectedPlan.planID}
              </h3>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
              <p className="font-semibold text-lg text-center text-blue-800">
                Montant restant à payer : <span>{formatMontant(selectedPlan.montantRestant)} DT</span>
              </p>
            </div>

            <table className="w-full bg-white shadow rounded">
              <thead>
                <tr className="bg-green-300">
                  <th className="p-2">Date</th>
                  <th className="p-2">Montant d'échéance</th>
                  <th className="p-2">Restant</th>
                  <th className="p-2">Statut</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedPlan.paiementDates.map((echeance) => (
                  <tr key={echeance.dateID} className="border-t text-center">
                    <td className="p-2">{echeance.echeanceDate}</td>
                    <td className="p-2">{formatMontant(echeance.montantDeEcheance)} DT</td>
                    <td className="p-2">{formatMontant(echeance.montantDue)} DT</td>
                    <td
                      className={`p-2 ${echeance.isPaid
                          ? "text-green-600"
                          : echeance.montantPayee > 0
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                    >
                      {echeance.isPaid
                        ? "Payé"
                        : echeance.montantPayee > 0
                          ? "Partiel"
                          : "À payer"}
                    </td>
                    <td className="p-2">
                      {!echeance.isPaid && (
                        <button
                          onClick={() => {
                            if (selectedPlan.planStatus === "TERMINE") {
                              toast.error(
                                "Ce plan est déjà terminé et ne peut plus être payé."
                              );
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
                  refresh();
                }}
                className="px-8 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showAmountModal && selectedEcheance && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Montant à payer</h3>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Montant restant: {formatMontant(selectedEcheance.montantDue)} DT
              </label>
              <input
                type="number"
                min="10.000"
                step="10.000"
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
                Max montant à saisir : {formatMontant(selectedEcheance.montantDue)} DT
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

      {showConfirmModal && selectedEcheance && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmation du paiement</h3>
            <p className="mb-2">Vous allez payer: {formatMontant(parseFloat(paymentAmount || "0"))} DT</p>
            <p className="mb-4">sur un montant dû de: {formatMontant(selectedEcheance.montantDue)} DT</p>

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
                className={`px-4 py-2 text-white rounded cursor-pointer ${isProcessingPayment ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
                  }`}
              >
                {isProcessingPayment ? "Traitement..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedEcheanceDetails && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 border-b border-gray-200 pb-3">
              <h3 className="text-xl font-bold text-gray-800">
                Échéance {selectedEcheanceDetails.echeanceDate}
              </h3>
            </div>
            <div className="mb-4 space-y-0.5">
              <p>
                <strong>Montant de l'échéance :</strong>{" "}
                {formatMontant(selectedEcheanceDetails.montantDeEcheance)} DT
              </p>
              <p>
                <strong>Montant payé :</strong> {formatMontant(selectedEcheanceDetails.montantPayee)} DT
              </p>
            </div>

            {selectedEcheanceDetails.paiementResponses &&
              selectedEcheanceDetails.paiementResponses.length > 0 ? (
              <table className="w-full bg-white shadow rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="p-3 text-lg ">Date de paiement</th>
                    <th className="p-3 text-lg ">Montant payé</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEcheanceDetails.paiementResponses.map((paiement) => (
                    <tr key={paiement.paiementID} className="border-t hover:bg-gray-50">
                      <td className="px-18 p-2">
                        {new Date(paiement.dateDePaiement).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-18">{formatMontant(paiement.montantPayee)} DT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500">
                Aucun paiement enregistré pour cette échéance.
              </p>
            )}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedEcheanceDetails(null);
                }}
                className="px-8 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewPlanModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Nouveau Plan de Paiement</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Montant total : {formatMontant(selectedPlan.montantRestant)} DT
              </label>
            </div>
            <div className="mb-4 flex items-center gap-2">
              <label className="whitespace-nowrap">Option :</label>
              <select
                value={optionPaiement}
                onChange={(e) => {
                  setOptionPaiement(e.target.value);
                  setResultat(null);
                  setDatesEcheances([]);
                  setValeur(0);
                  setShowInitialPaymentPrompt(e.target.value !== "");
                  setShowInitialPaymentInput(false);
                  setShowLibreModal(false);
                  setInitialPayment(0);
                  setLibreEcheances([]);
                  setCalculatedEcheances([]);
                }}
                className="border p-2 w-auto"
              >
                <option value="">Choisir une option</option>
                <option value="mois">Nombre de mois</option>
                <option value="montant">Montant par échéance</option>
                <option value="libre">Libre</option>
              </select>
            </div>
            {optionPaiement === "" && !showInitialPaymentPrompt && !showInitialPaymentInput && !showLibreModal && (
              <div className="mt-4">
                <p className="text-center text-gray-600">Veuillez choisir une option pour continuer.</p>
              </div>
            )}
            {showInitialPaymentPrompt && !showInitialPaymentInput && !showLibreModal && (
              <div className="mt-4">
                <p className="mb-4">Voulez-vous payer un montant comme avance ?</p>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleInitialPayment(true)}
                    className="p-2 bg-blue-500 text-white rounded flex-1"
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => handleInitialPayment(false)}
                    className="p-2 bg-gray-500 text-white rounded flex-1"
                  >
                    Non
                  </button>
                </div>
              </div>
            )}
            {showInitialPaymentInput && !showLibreModal && (
              <div className="mt-4">
                <input
                  type="number"
                  min="30"
                  max={selectedPlan.montantRestant}
                  step="10.000"
                  className="border p-2 mb-4 w-full"
                  value={initialPayment === 0 ? "" : initialPayment}
                  onChange={(e) => setInitialPayment(Number(e.target.value) || 0)}
                  placeholder="Montant initial"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleInitialPaymentSubmit}
                    className="p-2 bg-blue-500 text-white rounded flex-1"
                  >
                    Suivant
                  </button>
                  <button
                    onClick={() => {
                      setShowInitialPaymentPrompt(false);
                      setShowInitialPaymentInput(false);
                      setInitialPayment(0);
                    }}
                    className="p-2 bg-red-500 text-white rounded flex-1"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
            {optionPaiement !== "libre" && optionPaiement !== "" && !showInitialPaymentPrompt && !showInitialPaymentInput && (
              <>
                {initialPayment > 0 && (
                  <div className="mb-4">
                    <p>
                      Date : {new Date().toLocaleDateString("fr-FR")} | Montant : {formatMontant(initialPayment)} DT (Payé)
                    </p>
                  </div>
                )}
                <strong className="mb-8 block">
                  Montant restant à payer : {formatMontant(calculateRemainingAmount())} DT
                </strong>
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
                      <p><strong>Montant par échéance :</strong> {formatMontant(resultat.montantEcheance)} DT</p>
                    </div>
                    <div className="mb-4">
                      <p className="font-semibold mb-2">Dates des échéances :</p>
                      <div className="max-h-60 overflow-y-auto border p-2">
                        <ul className="list-disc list-inside">
                          {initialPayment > 0 && (
                            <li className="mb-1">
                              Échéance 1 : {new Date().toLocaleDateString("fr-FR")} ( {formatMontant(initialPayment)} DT ) ✅
                            </li>
                          )}
                          {calculatedEcheances.map((echeance, index) => {
                            const [year, month, day] = echeance.date.split("-");
                            const formattedDate = `${day}/${month}/${year}`;
                            return (
                              <li key={index} className="mb-1">
                                Échéance {initialPayment > 0 ? index + 2 : index + 1} : {formattedDate} ({formatMontant(echeance.montant)} DT)
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                    <button
                      onClick={handleValidation}
                      disabled={isSubmitting}
                      className={`p-2 rounded w-full ${isSubmitting ? 'bg-gray-400' : 'bg-green-600 text-white'}`}
                    >
                      {isSubmitting ? "Validation en cours..." : "Valider"}
                    </button>
                  </div>
                )}
              </>
            )}
            {optionPaiement === "libre" && showLibreModal && (
              <div className="mt-4">
                {initialPayment > 0 && (
                  <div className="mb-4">
                    <p>
                      Date : {new Date().toLocaleDateString("fr-FR")} | Montant : {formatMontant(initialPayment)} DT (Payé)
                    </p>
                  </div>
                )}
                <strong className="mb-4 block">
                  Montant restant à payer : {formatMontant(calculateRemainingAmount())} DT
                </strong>
                <button
                  onClick={addLibreEcheance}
                  className="p-2 bg-blue-500 text-white rounded w-full mb-4"
                >
                  Ajouter une échéance
                </button>
                <div className="max-h-60 overflow-y-auto border p-2 mb-4">
                  {libreEcheances.map((echeance, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="date"
                        value={echeance.date}
                        onChange={(e) => updateLibreEcheance(index, "date", e.target.value)}
                        className="border p-1 flex-1"
                        min={new Date().toISOString().split("T")[0]}
                      />
                      <input
                        type="number"
                        value={echeance.montant === 0 ? "" : echeance.montant}
                        onChange={(e) => updateLibreEcheance(index, "montant", Number(e.target.value) || 0)}
                        placeholder="Montant (min 20 DT)"
                        className="border p-1 flex-1"
                      />
                      <button
                        onClick={() => removeLibreEcheance(index)}
                        className="p-1 bg-red-500 text-white rounded"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={validateLibrePlan}
                  disabled={isSubmitting}
                  className={`p-2 rounded w-full ${isSubmitting ? 'bg-gray-400' : 'bg-green-600 text-white'}`}
                >
                  {isSubmitting ? "Validation en cours..." : "Valider"}
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setShowNewPlanModal(false);
                setOptionPaiement("");
                setValeur(0);
                setResultat(null);
                setDatesEcheances([]);
                setSelectedFactures([]);
                setSelectedPlan(null);
                setShowInitialPaymentPrompt(false);
                setShowInitialPaymentInput(false);
                setShowLibreModal(false);
                setInitialPayment(0);
                setLibreEcheances([]);
                setCalculatedEcheances([]);
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