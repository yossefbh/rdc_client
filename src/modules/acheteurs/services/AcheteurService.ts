export async function getAcheteurs() {
    const res = await fetch('https://localhost:7284/api/Acheteurs');
    if (!res.ok) throw new Error('Erreur lors du chargement des acheteurs');
    return res.json();
  }
  