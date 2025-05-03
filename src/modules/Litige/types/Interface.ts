  export interface LitigeType {
    litigeTypeID: number;
    litigeTypeName: string;
    litigeTypeDescription: string;
  }

  export interface Facture {
    factureID: number;
    numFacture: string;
    dateEcheance: string;
    montantTotal: number;
    montantRestantDue: number;
    acheteurID: number;
    status: string;
  }

  export interface Litige {
    litigeID: number;
    facture: Facture;
    type: LitigeType;
    litigeStatus: "EN_ATTENTE" | "EN_COURS" | "RESOLU" | "REJETE";
    litigeDescription: string;
    creationDate: string;
    resolutionDate?: string | null;
  }