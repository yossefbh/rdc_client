import { useState, useEffect } from "react";
import { LitigeType, Litige } from "../types/Interface";
import { getLitigeTypes, createLitigeType, updateLitigeType, getLitiges, rejectLitige, correctAmount, resolveDuplicated } from "../services/litigeService";

export const useLitiges = () => {
  const [litigeTypes, setLitigeTypes] = useState<LitigeType[]>([]);
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLitigeTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLitigeTypes();
      setLitigeTypes(response);
    } catch (err) {
      setError("Erreur lors de la récupération des types de litiges.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLitiges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLitiges();
      setLitiges(response);
    } catch (err) {
      setError("Erreur lors de la récupération des litiges.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addLitigeType = async (litigeType: Omit<LitigeType, "litigeTypeID">) => {
    try {
      const newLitigeType = await createLitigeType(litigeType);
      setLitigeTypes([...litigeTypes, newLitigeType]);
    } catch (err) {
      setError("Erreur lors de la création du type de litige.");
      console.error(err);
    }
  };

  const editLitigeType = async (litigeType: LitigeType) => {
    try {
      const updatedLitigeType = await updateLitigeType(litigeType);
      setLitigeTypes(
        litigeTypes.map((lt) =>
          lt.litigeTypeID === updatedLitigeType.litigeTypeID ? updatedLitigeType : lt
        )
      );
    } catch (err) {
      setError("Erreur lors de la modification du type de litige.");
      console.error(err);
    }
  };

  const reject = async (litigeID: number, userID: number) => {
    try {
      await rejectLitige(litigeID, userID);
      setLitiges(
        litiges.map((litige) =>
          litige.litigeID === litigeID ? { ...litige, litigeStatus: "REJETE" } : litige
        )
      );
    } catch (err) {
      setError("Erreur lors du rejet du litige.");
      console.error(err);
    }
  };

  const correct = async (
    litigeID: number,
    correctedData: { correctedMontantTotal: number; correctedAmountDue: number },
    userID: number
  ) => {
    try {
      await correctAmount(litigeID, correctedData, userID);
      setLitiges(
        litiges.map((litige) =>
          litige.litigeID === litigeID
            ? {
                ...litige,
                litigeStatus: "RESOLU",
                facture: {
                  ...litige.facture,
                  montantTotal: correctedData.correctedMontantTotal,
                  montantRestantDue: correctedData.correctedAmountDue,
                },
              }
            : litige
        )
      );
    } catch (err) {
      setError("Erreur lors de la correction du montant.");
      console.error(err);
    }
  };

  const resolveDuplicatedLitige = async (litigeID: number, userID: number) => {
    try {
      const responseText = await resolveDuplicated(litigeID, userID);
      if (responseText.includes("is resolved")) {
        setLitiges(
          litiges.map((litige) =>
            litige.litigeID === litigeID ? { ...litige, litigeStatus: "RESOLU" } : litige
          )
        );
        return "resolved";
      } else if (responseText.includes("is rejected")) {
        setLitiges(
          litiges.map((litige) =>
            litige.litigeID === litigeID ? { ...litige, litigeStatus: "REJETE" } : litige
          )
        );
        return "rejected";
      } else {
        throw new Error("Réponse inattendue de l'API lors de la résolution du litige DUPLIQUE.");
      }
    } catch (err) {
      setError("Erreur lors de la résolution du litige DUPLIQUE.");
      console.error(err);
      throw err;
    }
  };

  const refresh = () => {
    fetchLitigeTypes();
    fetchLitiges();
  };

  useEffect(() => {
    fetchLitigeTypes();
    fetchLitiges();
  }, []);

  return {
    litigeTypes,
    litiges,
    loading,
    error,
    addLitigeType,
    editLitigeType,
    reject,
    correct,
    resolveDuplicated: resolveDuplicatedLitige,
    refresh,
  };
};