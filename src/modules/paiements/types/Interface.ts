export interface PlanDePaiement {
  planID: number;
  montantTotal: number;
  nombreDeEcheances: number;
  montantRestant: number;
  creationDate: string;
  planStatus: "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "ANNULE";
  isLocked: boolean;
  hasAdvance: boolean; 
  factures: Facture[];
  paiementDates: PaiementDate[];
}

export interface Facture {
  factureID: number;
  numFacture: string;
  dateEcheance: string;
  montantTotal: number;
  montantRestantDue: number;
  acheteurID: number;
  status: "PAYEE" | "IMPAYEE" | "EN_COURS_DE_PAIEMENT";
}

export interface PaiementDate {
  dateID: number;
  planID: number;
  echeanceDate: string;
  montantDeEcheance: number;
  montantPayee: number;
  montantDue: number;
  isPaid: boolean;
  isLocked: boolean;
  paiementResponses: PaiementResponse[];
}

export interface PaiementResponse {
  paiementID: number;
  paiementDateID: number;
  montantPayee: number;
  dateDePaiement: string;
}