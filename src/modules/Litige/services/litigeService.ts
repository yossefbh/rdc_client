import { LitigeType, Litige } from "../types/Interface";

const API_URL = "https://localhost:7284/api/LitigeTypes";
const LITIGES_API_URL = "https://localhost:7284/api/Litiges/All";
const CREATE_LITIGE_API_URL = "https://localhost:7284/api/Litiges";

// Récupérer les types de litiges
export const getLitigeTypes = async (): Promise<LitigeType[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la récupération des types de litiges: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Erreur dans getLitigeTypes :", error);
    throw error;
  }
};

// Créer un type de litige
export const createLitigeType = async (litigeType: Omit<LitigeType, "litigeTypeID">): Promise<LitigeType> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(litigeType),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la création du type de litige: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur dans createLitigeType :", error);
    throw error;
  }
};

// Modifier un type de litige
export const updateLitigeType = async (litigeType: LitigeType): Promise<LitigeType> => {
  try {
    const response = await fetch(`${API_URL}/${litigeType.litigeTypeID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(litigeType),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la modification du type de litige: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur dans updateLitigeType :", error);
    throw error;
  }
};

// Récupérer tous les litiges
export const getLitiges = async (): Promise<Litige[]> => {
  try {
    const response = await fetch(LITIGES_API_URL);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la récupération des litiges: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Erreur dans getLitiges :", error);
    throw error;
  }
};

// Créer un litige et retourner l'ID du litige créé
export const createLitige = async (litigeData: { factureID: number; typeID: number; litigeDescription: string }): Promise<number> => {
  try {
    const response = await fetch(CREATE_LITIGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(litigeData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la création du litige: ${errorText}`);
    }

    const createdLitige = await response.json();
    
    if (typeof createdLitige === 'number') {
      return createdLitige;
    }
    if (createdLitige?.litigeID) {
      return createdLitige.litigeID;
    } else if (createdLitige?.id) {
      return createdLitige.id;
    } else if (createdLitige?.LitigeID) {
      return createdLitige.LitigeID;
    } else {
      throw new Error("L'ID du litige n'a pas été retourné par l'API dans un format attendu.");
    }
  } catch (error) {
    console.error("Erreur dans createLitige :", error);
    throw error;
  }
};

// Envoyer les pièces jointes pour un litige
export const uploadLitigeFiles = async (litigeID: number, files: File[]): Promise<void> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file); 
    });

    const response = await fetch(`https://localhost:7284/api/Litiges/${litigeID}/justificatifs`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de l'envoi des pièces jointes: ${errorText || 'Aucune information supplémentaire fournie par l\'API.'}`);
    }
  } catch (error) {
    console.error("Erreur dans uploadLitigeFiles :", error);
    throw error;
  }
};

// Rejeter un litige
export const rejectLitige = async (litigeID: number): Promise<void> => {
  try {
    const response = await fetch(`https://localhost:7284/api/Litiges/RejectLitige/${litigeID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors du rejet du litige: ${errorText}`);
    }
  } catch (error) {
    console.error("Erreur dans rejectLitige :", error);
    throw error;
  }
};

// Corriger le montant d'un litige
export const correctAmount = async (litigeID: number, correctedData: { correctedMontantTotal: number; correctedAmountDue: number }): Promise<void> => {
  try {
    const response = await fetch(`https://localhost:7284/api/Litiges/CorrectAmount/${litigeID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(correctedData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la correction du montant: ${errorText}`);
    }
  } catch (error) {
    console.error("Erreur dans correctAmount :", error);
    throw error;
  }
};

// Résoudre un litige de type DUPLIQUE
export const resolveDuplicated = async (litigeID: number): Promise<string> => {
  try {
    const response = await fetch(`https://localhost:7284/api/Litiges/ResolveDuplicated/${litigeID}`, {
      method: "PUT",
      headers: {
        "Accept": "*/*",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la résolution du litige DUPLIQUE: ${errorText}`);
    }

    return await response.text();
  } catch (error) {
    console.error("Erreur dans resolveDuplicated :", error);
    throw error;
  }
};
// Récupérer les liens des justificatifs pour un litige
export const getJustificatifLinks = async (litigeID: number): Promise<{ nomFichier: string; downloadUrl: string }[]> => {
  try {
    const response = await fetch(`https://localhost:7284/api/Litiges/${litigeID}/justificatifs/links`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Si l'API indique qu'il n'y a pas de justificatifs, retourner un tableau vide au lieu de lancer une erreur
      if (errorText.includes("No justificatifs found for this litige.")) {
        return [];
      }
      throw new Error(`Erreur lors de la récupération des liens des justificatifs: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur dans getJustificatifLinks :", error);
    throw error;
  }
};