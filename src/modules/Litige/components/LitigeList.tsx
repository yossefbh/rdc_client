import { useState, useEffect } from "react";
import { useLitiges } from "../hooks/useLitiges";
import { LitigeType, Litige } from "../types/Interface";
import { toast } from "react-toastify";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { getJustificatifLinks } from "../services/litigeService";
import { getAcheteurs } from "@/modules/acheteurs/services/AcheteurService";

// Fonction utilitaire pour créer un délai asynchrone
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Acheteur {
  acheteurID: number;
  nom: string;
  prenom: string;
}

export const LitigeList = () => {
  const { litigeTypes, litiges, loading, error, addLitigeType, editLitigeType, reject, correct, resolveDuplicated, refresh } = useLitiges();
  const [showLitigeTypesModal, setShowLitigeTypesModal] = useState(false);
  const [showCreateLitigeTypeModal, setShowCreateLitigeTypeModal] = useState(false);
  const [editingLitigeType, setEditingLitigeType] = useState<LitigeType | null>(null);
  const [newLitigeType, setNewLitigeType] = useState<{
    litigeTypeName: string;
    litigeTypeDescription: string;
  }>({
    litigeTypeName: "",
    litigeTypeDescription: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLitige, setSelectedLitige] = useState<Litige | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [isJustified, setIsJustified] = useState<boolean | null>(null);
  const [correctedData, setCorrectedData] = useState<{
    correctedMontantTotal: string;
    correctedAmountDue: string;
  }>({
    correctedMontantTotal: "",
    correctedAmountDue: "",
  });
  const [justificatifs, setJustificatifs] = useState<{ nomFichier: string; downloadUrl: string }[]>([]);
  const [loadingJustificatifs, setLoadingJustificatifs] = useState(false);

  const [selectedAcheteurId, setSelectedAcheteurId] = useState<number | null>(null);
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);

  useEffect(() => {
    const fetchAcheteurs = async () => {
      try {
        const allAcheteurs = await getAcheteurs();
        const acheteursAvecLitiges = allAcheteurs.filter((acheteur: Acheteur) =>
          litiges.some((litige) => litige.facture?.acheteurID === acheteur.acheteurID)
        );
        setAcheteurs(acheteursAvecLitiges);
      } catch (err) {
        toast.error("Erreur lors de la récupération des acheteurs.", { autoClose: 3000 });
      }
    };
    fetchAcheteurs();
  }, [litiges]);

  const validLitiges = litiges
    .filter((litige): litige is Litige => {
      const isValid = 
        litige !== undefined && 
        litige !== null && 
        typeof litige === 'object' && 
        'litigeID' in litige;
      if (!isValid) {
        console.warn("Litige invalide détecté:", litige);
      }
      return isValid;
    })
    .filter((litige) => {
      if (selectedAcheteurId === null) return true;
      return litige.facture?.acheteurID === selectedAcheteurId;
    });

  const handleCreateLitigeType = async () => {
    if (!newLitigeType.litigeTypeName || !newLitigeType.litigeTypeDescription) {
      toast.error("Veuillez remplir tous les champs.", { autoClose: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      await addLitigeType(newLitigeType);
      toast.success("Type de litige créé avec succès !", { autoClose: 3000 });
      setShowCreateLitigeTypeModal(false);
      setNewLitigeType({ litigeTypeName: "", litigeTypeDescription: "" });
      await refresh();
    } catch (err) {
      toast.error("Erreur lors de la création du type de litige.", { autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLitigeType = async () => {
    if (!editingLitigeType) return;

    setIsSubmitting(true);
    try {
      await editLitigeType(editingLitigeType);
      toast.success("Type de litige modifié avec succès !", { autoClose: 3000 });
      setEditingLitigeType(null);
    } catch (err) {
      toast.error("Erreur lors de la modification du type de litige.", { autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectLitige = async (litigeID: number) => {
    setIsSubmitting(true);
    try {
      await reject(litigeID);
      toast.success("Litige rejeté avec succès !", { autoClose: 3000 });
      setShowResolutionModal(false);
      setSelectedLitige(null);
      setIsJustified(null);
    } catch (err) {
      toast.error("Erreur lors du rejet du litige.", { autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectAmount = async (litigeID: number) => {
    const montantTotal = parseFloat(correctedData.correctedMontantTotal);
    const amountDue = parseFloat(correctedData.correctedAmountDue);

    if (!correctedData.correctedMontantTotal || !correctedData.correctedAmountDue) {
      toast.error("Veuillez remplir tous les champs de montant.", { autoClose: 3000 });
      return;
    }

    if (isNaN(montantTotal) || isNaN(amountDue)) {
      toast.error("Les montants doivent être des nombres valides.", { autoClose: 3000 });
      return;
    }

    if (montantTotal < 0 || amountDue < 0) {
      toast.error("Les montants ne peuvent pas être négatifs.", { autoClose: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      await correct(litigeID, {
        correctedMontantTotal: montantTotal,
        correctedAmountDue: amountDue,
      });
      toast.success("Montants corrigés avec succès !", { autoClose: 3000 });
      setShowResolutionModal(false);
      setSelectedLitige(null);
      setIsJustified(null);
      setCorrectedData({ correctedMontantTotal: "", correctedAmountDue: "" });
    } catch (err) {
      toast.error("Erreur lors de la correction des montants.", { autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDropdown = (litigeID: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === litigeID ? null : litigeID);
  };

  const handleShowDetails = async (litige: Litige, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedLitige(litige);
    setShowDetailsModal(true);
    setOpenDropdownId(null);

    setLoadingJustificatifs(true);
    try {
      const justificatifLinks = await getJustificatifLinks(litige.litigeID);
      setJustificatifs(justificatifLinks);
    } catch (err) {
      toast.error("Erreur lors de la récupération des justificatifs.", { autoClose: 3000 });
      setJustificatifs([]);
    } finally {
      setLoadingJustificatifs(false);
    }
  };

  const handleDownloadJustificatif = async (downloadUrl: string, nomFichier: string) => {
    try {
      const response = await fetch(`https://localhost:7284${downloadUrl}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du fichier.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nomFichier;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Erreur lors du téléchargement du justificatif.", { autoClose: 3000 });
    }
  };

  const handleShowResolution = async (litige: Litige, event: React.MouseEvent) => {
    event.stopPropagation();
    if (litige.litigeStatus === "RESOLU" || litige.litigeStatus === "REJETE") {
      toast.error("Ce litige est déjà résolu ou rejeté et ne peut pas être modifié.", { autoClose: 3000 });
      return;
    }

    if (litige.type?.litigeTypeName === "DUPLIQUE") {
      setIsSubmitting(true);
      try {
        toast.info("Vérification...", { autoClose: false });
        const result = await resolveDuplicated(litige.litigeID);
        await delay(1000);
        toast.dismiss();

        if (result === "resolved") {
          toast.success("Litige résolu avec succès !", { autoClose: 3000 });
        } else if (result === "rejected") {
          toast.error("Pas de duplication sur cette facture .", { autoClose: 3000 });
        }

        await refresh();
      } catch (err) {
        await delay(1000);
        toast.dismiss();
        toast.error("Erreur lors de la résolution du litige DUPLIQUE.", { autoClose: 3000 });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setSelectedLitige(litige);
      setShowResolutionModal(true);
      setOpenDropdownId(null);
      setIsJustified(null);
      setCorrectedData({ correctedMontantTotal: "", correctedAmountDue: "" });
    }
  };

  const columns: GridColDef<Litige>[] = [
    {
      field: 'rowNumber',
      headerName: 'N°',
      width: 190,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => {
        const index = validLitiges.findIndex((litige) => litige.litigeID === params.row.litigeID);
        return <span className="text-black">{index + 1}</span>;
      },
    },
    {
      field: 'numFacture',
      headerName: 'Numéro Facture',
      width: 285,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => <span className="text-black">{params.row?.facture?.numFacture ?? "N/A"}</span>,
    },
    {
      field: 'litigeTypeName',
      headerName: 'Type de Litige',
      width: 315,
      sortable: true,
      renderCell: (params) => <span className="text-black">{params.row?.type?.litigeTypeName ?? "N/A"}</span>,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
    },
    {
      field: 'litigeStatus',
      headerName: 'Statut',
      width: 265,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium mx-auto ${
            params.value === "EN_COURS"
              ? "bg-yellow-100 text-yellow-800"
              : params.value === "RESOLU"
              ? "bg-green-100 text-green-800"
              : params.value === "REJETE"
              ? "bg-red-100 text-red-800"
              : "bg-gray-200 text-black"
          }`}
        >
          {params.value ?? "N/A"}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 270,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'text-lg font-bold',
      renderCell: (params) => (
        <div className="relative flex justify-center items-center h-full">
          <button
            onClick={(event) => toggleDropdown(params.row.litigeID, event)}
            className="text-black hover:text-gray-800 text-2xl p-0.5 rounded-full"
          >
            ...
          </button>
          {openDropdownId === params.row.litigeID && (
            <div
              className="absolute top-[100%] left-1/2 -translate-x-1/2 w-48 bg-white border rounded-md shadow-lg z-[1000] -mt-2"
              style={{ minHeight: '40px' }}
            >
              <div className="py-1">
                <button
                  onClick={(event) => handleShowDetails(params.row, event)}
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
                      d="M15 12h.01M12 12h.01M9 12h.01M12 15h.01M12 9h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Détails
                </button>
                <button
                  onClick={(event) => handleShowResolution(params.row, event)}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    params.row.litigeStatus === "EN_COURS"
                      ? "text-black hover:bg-blue-50"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={params.row.litigeStatus !== "EN_COURS"}
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Résoudre
                </button>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4 items-center">
        <button
          onClick={() => setShowLitigeTypesModal(true)}
          className="px-4 py-2 bg-blue-700 text-amber-50 rounded hover:bg-blue-400 cursor-pointer"
        >
          Types de litiges
        </button>
        <select
          value={selectedAcheteurId ?? ""}
          onChange={(e) => {
            setSelectedAcheteurId(e.target.value ? Number(e.target.value) : null);
          }}
          className="border p-2 rounded text-black"
        >
          <option value="" className="text-black">Tous les acheteurs</option>
          {acheteurs.map((acheteur) => (
            <option key={acheteur.acheteurID} value={acheteur.acheteurID} className="text-black">
              {acheteur.nom} {acheteur.prenom}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-center text-black">Chargement des litiges...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      <Box sx={{ height: "calc(100vh - 120px)", width: "100%" }} className="overflow-visible">
        <DataGrid
          rows={validLitiges}
          columns={columns}
          getRowId={(row: Litige) => {
            if (!row?.litigeID) {
              console.error("getRowId: litigeID manquant pour la ligne:", row);
              return `fallback-${Math.random()}`;
            }
            return row.litigeID;
          }}
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
            noRowsLabel: "Aucun litige trouvé.",
          }}
          rowHeight={70}
          sx={{
            "& .MuiDataGrid-cell": {
              overflow: "visible",
            },
            "& .MuiDataGrid-row": {
              overflow: "visible",
            },
          }}
        />
      </Box>

      {/* Modal pour afficher les détails du litige */}
      {showDetailsModal && selectedLitige && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-10 rounded shadow-lg max-w-4xl w-full text-black">
            <h2 className="text-3xl font-bold mb-8 text-center">Détails du Litige</h2>
            <div className="mb-10">
              <h4 className="font-semibold text-xl mb-4 border-b pb-3">Informations du Litige</h4>
              <div className="overflow-x-auto">
                <table className="w-full bg-white shadow rounded">
                  <thead>
                    <tr className="bg-green-300">
                      <th className="p-4 text-center w-[25%]">Date Création</th>
                      <th className="p-4 text-center w-[25%]">Problème</th>
                      <th className="p-4 text-center w-[25%]">Description</th>
                      <th className="p-4 text-center w-[25%]">Date Résolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="p-4 text-center">
                        {selectedLitige.creationDate
                          ? new Date(selectedLitige.creationDate).toLocaleDateString("fr-FR")
                          : "N/A"}
                      </td>
                      <td className="p-4 text-center">
                        {selectedLitige.type?.litigeTypeName ?? "N/A"}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setShowDescriptionModal(true)}
                          className="flex items-center justify-center mx-auto px-3 py-1 bg-gray-100 text-black rounded-full text-sm hover:bg-gray-200"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          Voir description
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        {selectedLitige.resolutionDate
                          ? new Date(selectedLitige.resolutionDate).toLocaleDateString("fr-FR")
                          : "N/A"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section pour les justificatifs */}
            <div className="mb-10">
              <h4 className="font-semibold text-xl mb-4 border-b pb-3">Justificatifs utilisés</h4>
              {loadingJustificatifs ? (
                <p className="text-center text-black">Chargement des justificatifs...</p>
              ) : justificatifs.length === 0 ? (
                <p className="text-center text-black">Aucun justificatif trouvé.</p>
              ) : (
                <ul className="space-y-2">
                  {justificatifs.map((justificatif, index) => (
                    <li key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-black">{justificatif.nomFichier}</span>
                      <button
                        onClick={() => handleDownloadJustificatif(justificatif.downloadUrl, justificatif.nomFichier)}
                        className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Télécharger
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLitige(null);
                  setJustificatifs([]);
                }}
                className="mt-6 p-3 bg-red-500 text-white rounded w-1/3 text-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour afficher la description */}
      {showDescriptionModal && selectedLitige && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60]">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative text-black">
            <button
              onClick={() => setShowDescriptionModal(false)}
              className="absolute top-4 right-4 text-black hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-2xl font-bold mb-4 text-center">Description du Litige</h3>
            <p className="mb-6 text-center">
              {selectedLitige.litigeDescription ?? "Aucune description disponible."}
            </p>
          </div>
        </div>
      )}

      {/* Modal pour la résolution du litige */}
      {showResolutionModal && selectedLitige && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60]">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative text-black">
            <button
              onClick={() => {
                setShowResolutionModal(false);
                setSelectedLitige(null);
                setIsJustified(null);
                setCorrectedData({ correctedMontantTotal: "", correctedAmountDue: "" });
              }}
              className="absolute top-4 right-4 text-black hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-2xl font-bold mb-4 text-center">Résolution du Litige</h3>
            {selectedLitige.type?.litigeTypeName === "ERREUR_MONTANT" ? (
              <>
                {isJustified === null ? (
                  <div>
                    <p className="text-lg mb-4 text-center font-serif drop-shadow-md">
                      Existe-t-il des preuves pour justifier ce litige ?
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setIsJustified(true)}
                        className="p-2 bg-green-600 text-white rounded w-1/3"
                        disabled={isSubmitting}
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => handleRejectLitige(selectedLitige.litigeID)}
                        className="p-2 bg-red-600 text-white rounded w-1/3"
                        disabled={isSubmitting}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-center mb-4">Entrez les montants corrigés :</p>
                    <table className="w-full mb-4">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-center">Nouveau Montant Total</th>
                          <th className="p-2 text-center">Nouveau Montant Dû </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={correctedData.correctedMontantTotal}
                              onChange={(e) =>
                                setCorrectedData({
                                  ...correctedData,
                                  correctedMontantTotal: e.target.value,
                                })
                              }
                              className="border p-1 w-full text-center rounded text-black"
                              min="0"
                              step="1"
                              placeholder="Entrez le montant"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={correctedData.correctedAmountDue}
                              onChange={(e) =>
                                setCorrectedData({
                                  ...correctedData,
                                  correctedAmountDue: e.target.value,
                                })
                              }
                              className="border p-1 w-full text-center rounded text-black"
                              min="0"
                              step="0.01"
                              placeholder="Entrez le montant"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => handleCorrectAmount(selectedLitige.litigeID)}
                        className="p-2 bg-blue-600 text-white rounded w-1/3"
                        disabled={isSubmitting}
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setIsJustified(null)}
                        className="p-2 bg-gray-600 text-white rounded w-1/3"
                        disabled={isSubmitting}
                      >
                        Retour
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center mb-4">
                Résolution non disponible pour ce type de litige.
              </p>
            )}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setShowResolutionModal(false);
                  setSelectedLitige(null);
                  setIsJustified(null);
                  setCorrectedData({ correctedMontantTotal: "", correctedAmountDue: "" });
                }}
                className="p-3 bg-red-500 text-white rounded w-1/3 text-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour afficher les types de litiges */}
      {showLitigeTypesModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto text-black">
            <h2 className="text-2xl font-bold mb-4 text-center">Liste des types de litiges</h2>
            {loading && <p className="text-center">Chargement des types de litiges...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && (
              <>
                {litigeTypes.length === 0 ? (
                  <p className="text-center">Aucun type de litige trouvé.</p>
                ) : (
                  <ul className="space-y-4">
                    {litigeTypes.map((litigeType, index) => (
                      <li
                        key={litigeType.litigeTypeID ?? `litige-type-${index}`}
                        className="border p-4 rounded-lg"
                      >
                        {editingLitigeType?.litigeTypeID === litigeType.litigeTypeID && editingLitigeType ? (
                          <div>
                            <input
                              type="text"
                              value={editingLitigeType.litigeTypeName || ""}
                              onChange={(e) =>
                                setEditingLitigeType({
                                  ...editingLitigeType,
                                  litigeTypeName: e.target.value,
                                })
                              }
                              placeholder="Nom du type de litige"
                              className="border p-2 mb-2 w-full rounded text-black"
                            />
                            <textarea
                              value={editingLitigeType.litigeTypeDescription || ""}
                              onChange={(e) =>
                                setEditingLitigeType({
                                  ...editingLitigeType,
                                  litigeTypeDescription: e.target.value,
                                })
                              }
                              placeholder="Description"
                              className="border p-2 mb-2 w-full rounded text-black"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleEditLitigeType}
                                disabled={isSubmitting}
                                className={`p-2 rounded flex-1 ${
                                  isSubmitting ? "bg-gray-400" : "bg-green-600 text-white"
                                }`}
                              >
                                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                              </button>
                              <button
                                onClick={() => setEditingLitigeType(null)}
                                className="p-2 bg-red-500 text-white rounded flex-1"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p>
                              <strong>N° :</strong> {index + 1}
                            </p>
                            <p>
                              <strong className="font-semibold text-lg">Nom :</strong>{" "}
                              <span className="text-lg mb-4 text-center drop-shadow-md font-bold">
                                {litigeType.litigeTypeName}
                              </span>
                            </p>
                            <p>
                              <strong>Description :</strong> {litigeType.litigeTypeDescription}
                            </p>
                            <button
                              onClick={() => setEditingLitigeType(litigeType)}
                              className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                            >
                              Modifier
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowCreateLitigeTypeModal(true)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-100"
                  >
                    Nouveau type
                  </button>
                </div>
              </>
            )}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowLitigeTypesModal(false)}
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 w-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour créer un nouveau type de litige */}
      {showCreateLitigeTypeModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full text-black">
            <h2 className="text-2xl font-bold mb-6 text-center">Créer un type de litige</h2>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Nom du type de litige</label>
              <input
                type="text"
                value={newLitigeType.litigeTypeName}
                onChange={(e) =>
                  setNewLitigeType({ ...newLitigeType, litigeTypeName: e.target.value })
                }
                className="border p-2 w-full rounded text-black"
                placeholder="Entrez le nom du type de litige"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Description</label>
              <textarea
                value={newLitigeType.litigeTypeDescription}
                onChange={(e) =>
                  setNewLitigeType({ ...newLitigeType, litigeTypeDescription: e.target.value })
                }
                className="border p-2 w-full rounded text-black"
                rows={4}
                placeholder="Entrez une description..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateLitigeType}
                disabled={isSubmitting}
                className={`p-2 rounded flex-1 ${
                  isSubmitting ? "bg-gray-400" : "bg-green-600 text-white"
                }`}
              >
                {isSubmitting ? "Soumission en cours..." : "Soumettre"}
              </button>
              <button
                onClick={() => {
                  setShowCreateLitigeTypeModal(false);
                  setNewLitigeType({ litigeTypeName: "", litigeTypeDescription: "" });
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