import { useState, useEffect } from "react";
import { getPlansPaiement } from "../services/paiementService";
import { PlanDePaiement } from "../types/Interface";

export const usePaiements = () => {
  const [plans, setPlans] = useState<PlanDePaiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await getPlansPaiement();
      setPlans(data);
    } catch (err) {
      setError("Erreur lors du chargement des plans de paiement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return { plans, loading, error, refresh: fetchPlans };
};