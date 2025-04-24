export interface Facture {
  factureID: number;
  numFacture: string;
  dateEcheance: string;
  montantTotal: number;
  montantRestantDue: number;
  acheteurID: number;
  status: string;
}

export interface PaiementResponse {
  paiementID: number;
  paiementDateID: number;
  montantPayee: number;
  dateDePaiement: string;
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
  paiementResponses?: PaiementResponse[] | null;
}

export interface PlanDePaiement {
  planID: number;
  montantTotal: number;
  nombreDeEcheances: number;
  montantRestant: number;
  creationDate: string;
  planStatus: string;
  isLocked: boolean;
  factures: Facture[];
  paiementDates: PaiementDate[];
}