import { useState, useEffect } from "react";
import { getPlansPaiement, getPlanById } from "../services/paiementService";
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

  const refreshPlan = async (planID: number) => {
    try {
      const updatedPlan = await getPlanById(planID);
      setPlans((prevPlans) =>
        prevPlans.map((plan) =>
          plan.planID === planID ? updatedPlan : plan
        )
      );
    } catch (err) {
      setError(`Erreur lors de la mise à jour du plan ${planID}`);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return { plans, loading, error, refresh: fetchPlans, refreshPlan };
};