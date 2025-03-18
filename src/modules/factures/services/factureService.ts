export async function getFactures() {
    const res = await fetch('https://localhost:7284/api/Factures');
    if (!res.ok) throw new Error('Erreur lors du chargement des factures');
    return res.json();
  }
  