import { useEffect, useState } from "react";
import { getFactures } from "@/modules/factures/services/factureService";
import { Facture } from "@/modules/acheteurs/types/Interface";
import { getAcheteurs } from "@/modules/acheteurs/services/AcheteurService";
import { Acheteur } from "@/modules/acheteurs/types/Interface";
import { createPlanPaiement, createPaiementDates } from "@/modules/paiements/services/paiementService";
import { getLitigeTypes, createLitige, uploadLitigeFiles } from "@/modules/Litige/services/litigeService";
import { LitigeType } from "@/modules/Litige/types/Interface";
import { toast } from "react-toastify";
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

export const FactureList = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);
  const [selectedAcheteur, setSelectedAcheteur] = useState<number | null>(null);
  const [selectedFactures, setSelectedFactures] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [optionPaiement, setOptionPaiement] = useState("");
  const [valeur, setValeur] = useState(0);
  const [resultat, setResultat] = useState<{ nombreEcheances: number; montantEcheance: number } | null>(null);
  const [datesEcheances, setDatesEcheances] = useState<string[]>([]);
  const [montantTotalSelection, setMontantTotalSelection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showInitialPaymentPrompt, setShowInitialPaymentPrompt] = useState(false);
  const [showInitialPaymentInput, setShowInitialPaymentInput] = useState(false);
  const [initialPayment, setInitialPayment] = useState(0);
  const [showLibreModal, setShowLibreModal] = useState(false);
  const [libreEcheances, setLibreEcheances] = useState<{ date: string; montant: number }[]>([]);
  const [calculatedEcheances, setCalculatedEcheances] = useState<{ date: string; montant: number }[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [showLitigeModal, setShowLitigeModal] = useState(false);
  const [selectedFactureId, setSelectedFactureId] = useState<number | null>(null);
  const [litigeTypeId, setLitigeTypeId] = useState<number | null>(null);
  const [litigeDescription, setLitigeDescription] = useState<string>("");
  const [litigeFiles, setLitigeFiles] = useState<File[]>([]);
  const [litigeTypes, setLitigeTypes] = useState<LitigeType[]>([]);
  const [userPermissions, setUserPermissions] = useState<any>(null);

  const refreshFactures = async () => {
    try {
      const response = await fetch("https://localhost:7284/api/Factures/Refresh");
      if (await response.text() === "Refreshed") {
        getFactures().then(setFactures).catch(console.error);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des factures", error);
    }
  };

  useEffect(() => {
    getFactures().then(setFactures).catch(console.error);
    getAcheteurs().then(setAcheteurs).catch(console.error);
    getLitigeTypes().then(setLitigeTypes).catch(console.error);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserPermissions(JSON.parse(storedUser));
    }
  }, []);

  const hasCreanceManagementWritePermission = userPermissions?.role?.rolePermissionResponses?.some(
    (perm: any) =>
      perm.permissionDefinition.permissionName === "Gestion des données de créances (Acheteurs/Factures)" && perm.canWrite
  );

  const hasLitigeCreatePermission = userPermissions?.role?.rolePermissionResponses?.some(
    (perm: any) =>
      perm.permissionDefinition.permissionName === "Gestion des litiges" && perm.canCreate
  );

  const hasPlanPaiementWritePermission = userPermissions?.role?.rolePermissionResponses?.some(
    (perm: any) =>
      perm.permissionDefinition.permissionName === "Gestion des plan de paiements" && perm.canWrite
  );

  const formatMontant = (montant: number) => {
    return montant.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const filteredFactures = selectedAcheteur
    ? factures.filter((facture) => facture.acheteurID === selectedAcheteur)
    : factures;

  const filteredByStatus = selectedStatus === "all"
    ? filteredFactures
    : filteredFactures.filter(facture => facture.status === selectedStatus);

  useEffect(() => {
    const total = factures
      .filter((facture) => selectedFactures.includes(facture.factureID))
      .reduce((sum, facture) => sum + facture.montantRestantDue, 0);
    setMontantTotalSelection(total);
  }, [selectedFactures, factures]);

  const handlePlanifierPaiement = () => {
    if (!selectedAcheteur) {
      toast.error("Veuillez choisir un acheteur.", { autoClose: 2500 });
      return;
    }
    if (selectedFactures.length === 0) {
      toast.error("Il faut au moins choisir une facture.", { autoClose: 2500 });
      return;
    }
    if (selectedAcheteurScore <= 20) {
      toast.error("Votre score est trop faible !. Contactez nous dès que possible pour régler votre situation ", { autoClose: 2500 });
      return;
    }
    const facturesSelectionnees = factures.filter(facture => selectedFactures.includes(facture.factureID));
    if (facturesSelectionnees.some(facture => facture.status === "EN_COURS_DE_PAIEMENT" || facture.status === "EN_LITIGE" || facture.status === "PAYEE")) {
      toast.error(
        <div className="text-sm">
          <strong className="block text-base mb-2">Planification impossible !</strong>
          <p className="mb-2">Raisons possibles :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>La facture est déjà en cours de paiement</li>
            <li>La facture est déjà payée</li>
            <li>La facture est en litige</li>
          </ul>
        </div>,
        { className: "custom-toast" }
      );
      return;
    }
    setOptionPaiement("");
    setValeur(0);
    setResultat(null);
    setDatesEcheances([]);
    setShowModal(true);
  };

  const handleCalculer = () => {
    const montantTotal = montantTotalSelection - initialPayment;
    if (valeur <= 0) {
      toast.error("Veuillez saisir une valeur valide.", { autoClose: 3000 });
      return;
    }
    let nombreEcheances = 0;
    let montantEcheance = 0;
    let echeances: { date: string; montant: number }[] = [];

    if (optionPaiement === "mois") {
      nombreEcheances = valeur;
      montantEcheance = Number((montantTotal / valeur).toFixed(3));
      echeances = Array(nombreEcheances)
        .fill(0)
        .map(() => ({
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
      const montantRestant = Number((montantTotal % valeur).toFixed(3));
      if (montantRestant > 0) {
        nombreEcheances += 1;
      }
      echeances = Array(nombreEcheances)
        .fill(0)
        .map((_, index) => ({
          date: "",
          montant:
            index < nombreEcheances - 1 || montantRestant === 0
              ? valeur
              : montantRestant,
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
        toast.error("Chaque date d'échéance doit être postérieure à la précédente.", { autoClose: 3000 });
        return false;
      }
    }
    return true;
  };

  const createPaymentPlan = async (
    nombreEcheances: number,
    echeances: { date: string; montant: number }[],
    montantEcheance?: number
  ) => {
    if (selectedFactures.length === 0) {
      toast.error("Aucune facture sélectionnée.", { autoClose: 3000 });
      return;
    }
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const dates = echeances.map(e => e.date);
      if (!validateDates(dates, today)) return;

      const planData = {
        montantTotal: montantTotalSelection,
        nombreDeEcheances: initialPayment > 0 ? nombreEcheances + 1 : nombreEcheances,
        factureIDs: selectedFactures,
        hasAdvance: initialPayment > 0, 
      };
      const planResult = await createPlanPaiement(planData);
      if (!planResult?.planID) {
        throw new Error("ID du plan non retourné par l'API");
      }
      const planID = planResult.planID;

      const paiementDates = [];
      if (initialPayment > 0) {
        paiementDates.push({
          planID,
          echeanceDate: today,
          montantDeEcheance: initialPayment,
          montantPayee: 0,
          montantDue: initialPayment,
          isPaid: false,
          isLocked: false,
        });
      }
      echeances.forEach(({ date, montant }) => {
        paiementDates.push({
          planID,
          echeanceDate: date,
          montantDeEcheance: montantEcheance || montant,
          montantPayee: 0,
          montantDue: montantEcheance || montant,
          isPaid: false,
          isLocked: false,
        });
      });

      await createPaiementDates({ paiementDates });
      toast.success("Plan de paiement validé avec succès ! Un email a été envoyé.", { autoClose: 3000 });
      setShowModal(false);
      setShowLibreModal(false);
      setInitialPayment(0);
      setLibreEcheances([]);
      getFactures().then(setFactures).catch(console.error);
    } catch (error) {
      console.error("Erreur lors de la création du plan:", error);
      toast.error("Une erreur est survenue lors de la validation", { autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidation = async () => {
    if (!resultat || calculatedEcheances.length === 0) {
      toast.error("Veuillez d'abord calculer le plan de paiement", { autoClose: 3000 });
      return;
    }
    const hasInvalidEcheance = calculatedEcheances.some(echeance => echeance.montant < 20);
    if (hasInvalidEcheance) {
      toast.error("Le montant de chaque échéance doit être d'au moins 20 DT.", { autoClose: 3000 });
      return;
    }
    await createPaymentPlan(resultat.nombreEcheances, calculatedEcheances);
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
    if (initialPayment < 30) {
      toast.error("Le montant initial doit être d'au moins 30 DT.", { autoClose: 3000 });
      return;
    }
    if (initialPayment > montantTotalSelection) {
      toast.error(`Le montant initial ne peut pas dépasser ${formatMontant(montantTotalSelection)} DT.`, { autoClose: 3000 });
      return;
    }
    setShowInitialPaymentPrompt(false);
    setShowInitialPaymentInput(false);
    if (optionPaiement === "libre") {
      setShowLibreModal(true);
    }
  };

  const addLibreEcheance = () => {
    const remainingAmount = montantTotalSelection - initialPayment;
    const maxEcheances = remainingAmount <= 500000 ? 12 : remainingAmount <= 1000000 ? 24 : Infinity;
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
    return montantTotalSelection - initialPayment - totalEcheances;
  };

  const validateLibrePlan = async () => {
    const remainingAmount = montantTotalSelection - initialPayment;
    const totalEcheances = libreEcheances.reduce((sum, e) => sum + e.montant, 0);
    const maxEcheances = remainingAmount <= 500000 ? 12 : remainingAmount <= 1000000 ? 24 : Infinity;
    if (libreEcheances.length > maxEcheances) {
      toast.error(`Nombre d'échéances maximum: ${maxEcheances}`, { autoClose: 3000 });
      return;
    }
    if (libreEcheances.length === 0) {
      toast.error("Veuillez ajouter au moins une échéance.", { autoClose: 3000 });
      return;
    }
    if (totalEcheances !== remainingAmount) {
      toast.error("Il faut faire un plan valide", { autoClose: 3000 });
      return;
    }
    for (const echeance of libreEcheances) {
      if (echeance.montant < 20) {
        toast.error("Le montant de chaque échéance doit être d'au moins 20 DT.", { autoClose: 3000 });
        return;
      }
    }
    for (let i = 0; i < libreEcheances.length; i++) {
      const currentDate = new Date(libreEcheances[i].date);
      if (!libreEcheances[i].date || currentDate <= new Date()) {
        toast.error("Veuillez sélectionner une date future valide.", { autoClose: 3000 });
        return;
      }
      if (i > 0) {
        const previousDate = new Date(libreEcheances[i - 1].date);
        const diffTime = currentDate.getTime() - previousDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        if (diffDays > 40) {
          toast.error("Chaque échéance ne doit pas dépasser 40 jours par rapport à la précédente.", { autoClose: 3000 });
          return;
        }
        if (currentDate <= previousDate) {
          toast.error("Chaque date d'échéance doit être postérieure à la précédente.", { autoClose: 3000 });
          return;
        }
      }
    }
    await createPaymentPlan(libreEcheances.length, libreEcheances);
  };

  const toggleDropdown = (factureID: number, status: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const normalizedStatus = status.trim().toLowerCase();
    if (normalizedStatus === "impayee" || normalizedStatus === "partiellement_payee") {
      setOpenDropdownId(openDropdownId === factureID ? null : factureID);
    } else {
      toast.error("Impossible de choisir une action !", { autoClose: 3000 });
    }
  };

  const handleFaireLitige = (factureID: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedFactureId(factureID);
    setShowLitigeModal(true);
    setOpenDropdownId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (litigeFiles.length + newFiles.length > 5) {
        toast.error("Vous ne pouvez pas ajouter plus de 5 fichiers.", { autoClose: 3000 });
        return;
      }
      setLitigeFiles([...litigeFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setLitigeFiles(litigeFiles.filter((_, i) => i !== index));
  };

  const handleSubmitLitige = async () => {
    if (!selectedFactureId || litigeTypeId === null || !litigeDescription) {
      toast.error("Veuillez remplir tous les champs obligatoires.", { autoClose: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userID = userData.userID || 0;
      if (userID === 0) {
        toast.error("Utilisateur non identifié. Redirection vers la connexion...", { autoClose: 3000 });
        setTimeout(() => {
          window.location.href = '/auth/login'; 
        }, 3000);
        return;
      }
      const litigeData = {
        factureID: selectedFactureId,
        typeID: litigeTypeId,
        litigeDescription: litigeDescription,
        declaredByUserID: userID, 
      };

      const litigeID = await createLitige(litigeData, userID);

      if (litigeFiles.length > 0) {
        await uploadLitigeFiles(litigeID, litigeFiles);
        toast.success("Litige créé et pièces jointes envoyées avec succès !", { autoClose: 3000 });
      } else {
        toast.success("Litige créé avec succès !", { autoClose: 3000 });
      }

      setShowLitigeModal(false);
      setSelectedFactureId(null);
      setLitigeTypeId(null);
      setLitigeDescription("");
      setLitigeFiles([]);
      getFactures().then(setFactures).catch(console.error);
    } catch (error) {
      console.error("Erreur lors de la création du litige ou de l'envoi des pièces jointes:", error);
      toast.error("Une erreur est survenue lors de la soumission du litige.", { autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'numFacture',
      headerName: 'Numéro',
      width: 220,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'dateEcheance',
      headerName: 'Échéance',
      width: 210,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'montantTotal',
      headerName: 'Montant Total',
      width: 220,
      sortable: true,
      filterable: true,
      valueFormatter: (value: number) => `${formatMontant(value)} DT`,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'montantRestantDue',
      headerName: 'Montant Due',
      width: 230,
      sortable: true,
      filterable: true,
      valueFormatter: (value: number) => `${formatMontant(value)} DT`,
      editable: false,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 230,
      sortable: true,
      filterable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium mx-auto ${
            params.value.toLowerCase() === "payee" ? "bg-green-100 text-green-700" :
            params.value.toLowerCase() === "impayee" ? "bg-red-100 text-red-700" :
            params.value.toLowerCase() === "partiellement_payee" ? "bg-yellow-100 text-yellow-800" :
            params.value.toLowerCase() === "en_cours_de_paiement" ? "bg-teal-100 text-teal-600" :
            "bg-gray-200 text-black"
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
            onClick={(event) => toggleDropdown(params.row.factureID, params.row.status, event)}
            className="text-black hover:text-gray-800 text-2xl p-0.5 rounded-full"
          >
            ...
          </button>
          {openDropdownId === params.row.factureID && (
            <div
              className="absolute top-[100%] left-1/2 -translate-x-1/2 w-45 bg-white border rounded-md shadow-lg z-[1000] -mt-1"
              style={{ minHeight: '40px' }}
            >
              <div className="py-1">
                {hasLitigeCreatePermission && (
                  <button
                    onClick={(event) => handleFaireLitige(params.row.factureID, event)}
                    className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-blue-50"
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
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Déclarer un Litige
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  const selectedAcheteurScore = selectedAcheteur !== null
    ? acheteurs.find(a => a.acheteurID === selectedAcheteur)?.score ?? 0
    : 0;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          {hasCreanceManagementWritePermission && (
            <button
              onClick={refreshFactures}
              className="px-4 py-2 bg-green-700 text-amber-50 rounded hover:bg-green-400 cursor-pointer"
            >
              Importer
            </button>
          )}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border p-1 rounded text-black"
          >
            <option value="all" className="text-black">Filtrer Tous</option>
            <option value="IMPAYEE" className="text-black">Non payé</option>
            <option value="PARTIELLEMENT_PAYEE" className="text-black">Partiellement payé</option>
            <option value="PAYEE" className="text-black">Payé</option>
            <option value="EN_COURS_DE_PAIEMENT" className="text-black">En cours de paiement</option>
            <option value="EN_LITIGE" className="text-black">En litige</option>
          </select>
        </div>
        {hasPlanPaiementWritePermission && (
          <button
            onClick={handlePlanifierPaiement}
            className="px-4 py-2 bg-blue-700 text-amber-50 rounded hover:bg-blue-400 cursor-pointer mb-4"
          >
            Planifier un paiement
          </button>
        )}
      </div>

      <div className="bg-blue-100 p-3 rounded-lg mb-4">
        <p className="text-lg font-semibold text-black">
          Montant total à payer : <span className="text-blue-600">{formatMontant(montantTotalSelection)} DT</span>
        </p>
      </div>

      <select
        onChange={(e) => {
          setSelectedAcheteur(e.target.value ? Number(e.target.value) : null);
          setSelectedFactures([]);
          setMontantTotalSelection(0);
        }}
        className="border p-2 w-full mb-4 rounded text-black"
      >
        <option value="" className="text-black">Tous les acheteurs</option>
        {acheteurs.map((acheteur) => (
          <option key={acheteur.acheteurID} value={acheteur.acheteurID} className="text-black">
            {acheteur.nom} {acheteur.prenom}
          </option>
        ))}
      </select>

      <Box sx={{ height: '95vh', width: '100%' }} className="overflow-visible">
        <DataGrid
          rows={filteredByStatus}
          columns={columns}
          getRowId={(row) => row.factureID}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection={selectedAcheteur !== null}
          onRowSelectionModelChange={(newSelection) => {
            if (selectedAcheteur) {
              setSelectedFactures(newSelection as number[]);
            }
          }}
          rowSelectionModel={selectedFactures}
          disableRowSelectionOnClick
          filterMode="client"
          sortingMode="client"
          localeText={{
            noRowsLabel: "Aucune facture trouvée.",
          }}
          rowHeight={65}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full max-h-[95vh] overflow-y-auto text-black">
            <h2 className="text-2xl font-bold mb-6 text-center">Plan de Paiement</h2>
            <div className="mb-4 flex items-center gap-2">
              <label className="whitespace-nowrap">Option :</label>
              <select
                value={optionPaiement}
                onChange={(e) => {
                  const newOption = e.target.value;
                  if (newOption === "libre" && selectedAcheteur !== null && selectedAcheteurScore < 80) {
                    toast.error("Votre score est insuffisant ! Vous ne pouvez pas utiliser cette option.", { autoClose: 3000 });
                    return; 
                  }
                  setOptionPaiement(newOption);
                  setResultat(null);
                  setDatesEcheances([]);
                  setValeur(0);
                  setShowInitialPaymentPrompt(newOption !== "");
                  setShowInitialPaymentInput(false);
                  setShowLibreModal(false);
                  setInitialPayment(0);
                  setLibreEcheances([]);
                }}
                className="border p-2 w-auto text-black"
              >
                <option value="" className="text-black">Choisir une option</option>
                <option value="mois" className="text-black">Nombre de mois</option>
                <option value="montant" className="text-black">Montant par échéance</option>
                <option value="libre" className="text-black">Libre</option>
              </select>
            </div>
            {optionPaiement === "" && !showInitialPaymentPrompt && !showInitialPaymentInput && !showLibreModal && (
              <div className="mt-4">
                <p className="text-center">Veuillez choisir une option pour continuer.</p>
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
                  max={montantTotalSelection}
                  step="10.000"
                  className="border p-2 mb-4 w-full text-black"
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
                      Date : {new Date().toLocaleDateString("fr-FR")} | Montant : {formatMontant(initialPayment)} DT (En attente)
                    </p>
                  </div>
                )}
                <strong className="mb-8 block">
                  Montant restant à payer : {formatMontant(montantTotalSelection - initialPayment)} DT
                </strong>
                <input
                  type="number"
                  className="border p-2 mb-4 w-full text-black"
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
                              Échéance 1 : {new Date().toLocaleDateString("fr-FR")} ( {formatMontant(initialPayment)} DT )
                            </li>
                          )}
                          {datesEcheances.map((date, index) => {
                            const [year, month, day] = date.split("-");
                            const formattedDate = `${day}/${month}/${year}`;
                            return (
                              <li key={index} className="mb-1">
                                Échéance {initialPayment > 0 ? index + 2 : index + 1} : {formattedDate}
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
                      Date : {new Date().toLocaleDateString("fr-FR")} | Montant : {formatMontant(initialPayment)} DT (En attente)
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
                        className="border p-1 flex-1 text-black"
                        min={new Date().toISOString().split("T")[0]}
                      />
                      <input
                        type="number"
                        value={echeance.montant === 0 ? "" : echeance.montant}
                        onChange={(e) => updateLibreEcheance(index, "montant", Number(e.target.value) || 0)}
                        placeholder="Montant (min 20 DT)"
                        className="border p-1 flex-1 text-black"
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
                setShowModal(false);
                setOptionPaiement("");
                setValeur(0);
                setResultat(null);
                setDatesEcheances([]);
                setShowInitialPaymentPrompt(false);
                setShowInitialPaymentInput(false);
                setShowLibreModal(false);
                setInitialPayment(0);
                setLibreEcheances([]);
              }}
              className="mt-4 p-2 bg-red-500 text-white rounded w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {showLitigeModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full text-black">
            <h2 className="text-2xl font-bold mb-6 text-center">Soumettre un Litige</h2>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Raison du litige</label>
              <select
                value={litigeTypeId ?? ""}
                onChange={(e) => setLitigeTypeId(Number(e.target.value) || null)}
                className="border p-2 w-full rounded text-black"
              >
                <option value="" className="text-black">Sélectionner une raison</option>
                {litigeTypes.map((type) => (
                  <option key={type.litigeTypeID} value={type.litigeTypeID} className="text-black">
                    {type.litigeTypeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Description</label>
              <textarea
                value={litigeDescription}
                onChange={(e) => setLitigeDescription(e.target.value)}
                className="border p-2 w-full rounded text-black"
                rows={4}
                placeholder="Décrivez le problème..."
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Pièces jointes (Optionnel)</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="border p-2 w-full rounded text-black"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {litigeFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm">Fichiers sélectionnés :</p>
                  <ul className="list-disc list-inside">
                    {litigeFiles.map((file, index) => (
                      <li key={index} className="text-sm flex items-center justify-between">
                        <span>{file.name}</span>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmitLitige}
                disabled={isSubmitting}
                className={`p-2 rounded flex-1 ${isSubmitting ? 'bg-gray-400' : 'bg-green-600 text-white'}`}
              >
                {isSubmitting ? "Soumission en cours..." : "Soumettre"}
              </button>
              <button
                onClick={() => {
                  setShowLitigeModal(false);
                  setSelectedFactureId(null);
                  setLitigeTypeId(null);
                  setLitigeDescription("");
                  setLitigeFiles([]);
                }}
                className="p-2 bg-red-500 text-white rounded flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};