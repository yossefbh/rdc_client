// src/modules/paiements/services/paiementService.ts

import { PlanDePaiement, PaiementDate } from "../types/Interface";

export const createPlanPaiement = async (planData: {
  montantTotal: number;
  nombreDeEcheances: number;
  montantDeChaqueEcheance: number;
  factureIDs: number[];
}) => {
  const response = await fetch("https://localhost:7284/api/PlanDePaiement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(planData),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la création du plan");
  }

  return await response.json();
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
}): Promise<void> => {
  const response = await fetch("https://localhost:7284/api/Paiement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    throw new Error("Erreur lors du paiement");
  }
};

export const getEcheanceDetails = async (dateID: number): Promise<PaiementDate> => {
  const response = await fetch(`https://localhost:7284/api/PaiementDates/${dateID}`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des détails de l'échéance");
  }
  return await response.json();
};