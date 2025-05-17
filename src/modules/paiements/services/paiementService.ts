import { PlanDePaiement, PaiementDate } from "../types/Interface";

export const createPlanPaiement = async (planData: {
  montantTotal: number;
  nombreDeEcheances: number;
  factureIDs: number[];
  hasAdvance: boolean;
  createdByUserID?: number; // Rendu optionnel
}) => {
  try {
    // Récupérer userID depuis localStorage
    let userData;
    try {
      const rawUserData = localStorage.getItem('user');
      userData = rawUserData ? JSON.parse(rawUserData) : {};
    } catch (e) {
      userData = {};
      console.error("Erreur lors du parsing de localStorage 'user':", e);
    }
    const userID = userData.userID || 0;

    // Ajouter createdByUserID au planData
    const updatedPlanData = {
      ...planData,
      createdByUserID: userID,
    };

    const response = await fetch("https://localhost:7284/api/PlanDePaiement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedPlanData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la création du plan: ${errorText}`);
    }

    const result = await response.json();
    console.log("Réponse brute de l'API (createPlanPaiement):", result); // Log pour débogage
    if (typeof result === "number") {
      return { planID: result };
    }
    return result;
  } catch (error) {
    console.error("Erreur dans createPlanPaiement :", error);
    throw error;
  }
};
export const createPaiementDates = async (paiementDates: {
  paiementDates: {
    planID: number;
    echeanceDate: string;
    montantDeEcheance: number;
    montantPayee: number;
    montantDue: number;
    isPaid: boolean;
    isLocked: boolean;
  }[];
}) => {
  try {
    const response = await fetch("https://localhost:7284/api/PaiementDates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paiementDates),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de l'ajout des dates de paiement: ${errorText}`);
    }

    const contentType = response.headers.get("Content-Type");
    if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
      return { success: true };
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur dans createPaiementDates :", error);
    throw error;
  }
};

export const getPlansPaiement = async (): Promise<PlanDePaiement[]> => {
  const response = await fetch("https://localhost:7284/api/PlanDePaiement");
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des plans");
  }
  return await response.json();
};

export const payerEcheance = async (paymentData: {
  planID: number;
  paiementDateID: number;
  montantPayee: number;
  dateDePaiement: string;
}): Promise<number | void> => {
  try {
    // Récupérer paidByUserID depuis localStorage
    let userData;
    try {
      const rawUserData = localStorage.getItem('user');
      userData = rawUserData ? JSON.parse(rawUserData) : {};
    } catch (e) {
      userData = {};
      console.error("Erreur lors du parsing de localStorage 'user':", e);
    }
    const paidByUserID = userData.userID || 0;

    // Préparer le body avec paidByUserID ajouté
    const requestBody = {
      paiementDateID: paymentData.paiementDateID,
      montantPayee: paymentData.montantPayee,
      paidByUserID: paidByUserID,
      dateDePaiement: paymentData.dateDePaiement,
    };

    const response = await fetch("https://localhost:7284/api/Paiement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error("Erreur lors du paiement");
    }

    const contentType = response.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
      const result = await response.json();
      if (typeof result === "number") {
        return result; 
      }
    }
  } catch (error) {
    console.error("Erreur dans payerEcheance :", error);
    throw error;
  }
};

export const getEcheanceDetails = async (dateID: number): Promise<PaiementDate> => {
  const response = await fetch(`https://localhost:7284/api/PaiementDates/${dateID}`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des détails de l'échéance");
  }
  return await response.json();
};

export const lockPlanPaiement = async (planID: number): Promise<void> => {
  try {
    const response = await fetch(`https://localhost:7284/api/PlanDePaiement/Lock/${planID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors du verrouillage du plan: ${errorText}`);
    }
  } catch (error) {
    console.error("Erreur dans lockPlanPaiement :", error);
    throw error;
  }
};

export const activatePlanPaiement = async (planID: number): Promise<void> => {
  try {
    // Récupérer activatedByUserID depuis localStorage
    let userData;
    try {
      const rawUserData = localStorage.getItem('user');
      userData = rawUserData ? JSON.parse(rawUserData) : {};
    } catch (e) {
      userData = {};
      console.error("Erreur lors du parsing de localStorage 'user':", e);
    }
    const userID = userData.userID || 0;

    // Créer le body de la requête
    const requestBody = {
      planID: planID,
      activatedByUserID: userID,
    };

    const response = await fetch(`https://localhost:7284/api/PlanDePaiement/Activate`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody), 
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de l'activation du plan: ${errorText}`);
    }
  } catch (error) {
    console.error("Erreur dans activatePlanPaiement :", error);
    throw error;
  }
};

export const verifySignature = async (file: File): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append("pdfFiles", file);

    const response = await fetch("https://localhost:7284/api/PlanDePaiement/VerifySignature", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la vérification de la signature: ${errorText}`);
    }

    const result = await response.json();
    return result; 
  } catch (error) {
    console.error("Erreur dans verifySignature :", error);
    throw error;
  }
};