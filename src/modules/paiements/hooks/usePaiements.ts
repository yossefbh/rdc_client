import { useState, useEffect } from "react";
import { getPlansPaiement } from "../services/paiementService";
import { PlanDePaiement } from "../types/Interface";

export const usePaiements = () => {
  const [plans, setPlans] = useState<PlanDePaiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getPlansPaiement();
        setPlans(data);
      } catch (err) {
        setError("Erreur lors du chargement des plans de paiement");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return { plans, loading, error };
};
