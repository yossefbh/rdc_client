export interface Facture {
    factureID: number;
    numFacture: string;
    dateEcheance: string;
    montantTotal: number;
    montantRestantDue: number;
    acheteurID: number;
    status: string;
  }
  
  export interface Acheteur {
    acheteurID: number;
    nom: string;
    prenom: string;
    adresse: string;
    email: string;
    telephone: string;
    factures: Facture[];
  }
  