import React, { useState, useEffect, useMemo } from 'react';
import { getAcheteurs } from '@/modules/acheteurs/services/AcheteurService';
import { getFactures } from '@/modules/factures/services/factureService';
import { getPlansPaiement } from '@/modules/paiements/services/paiementService';
import { getLitiges } from '@/modules/Litige/services/litigeService';
import { getEcheanceDetails } from '@/modules/paiements/services/paiementService';
import { AcheteurList } from '@/modules/acheteurs/components/AcheteurList';
import { FactureList } from '@/modules/factures/components/FactureList';
import { PaiementList } from '@/modules/paiements/components/PaiementList';
import { LitigeList } from '@/modules/Litige/components/LitigeList';
import { AideList } from '@/modules/aide/components/AideList';
import { AProposList } from '@/modules/aProps/components/AProposList';
import { Bar, Pie, Line } from 'react-chartjs-2';
import ChartJS from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { BarElement, CategoryScale, LinearScale, ChartData, PointElement, LineElement, PieController, ArcElement } from 'chart.js';
import Calendar from 'react-calendar';
import { Value } from 'react-calendar/dist/esm/shared/types.js';
import 'react-calendar/dist/Calendar.css';
import { Facture, Acheteur } from '@/modules/acheteurs/types/Interface';
import { PlanDePaiement, PaiementDate } from '@/modules/paiements/types/Interface';
import { Litige } from '@/modules/Litige/types/Interface';
import { FaMoneyBillWave, FaExclamationTriangle, FaGavel, FaClock, FaMoneyCheck, FaWallet, FaCalendarCheck, FaFileInvoice } from 'react-icons/fa';
import { RoleList } from '@/modules/auth/components/RoleList';
import { PermissionList } from '@/modules/auth/components/PermissionList';
import { UserList } from '@/modules/auth/components/UserList';

// Register Chart.js components and the datalabels plugin
ChartJS.register(BarElement, CategoryScale, LinearScale, PointElement, LineElement, PieController, ArcElement, ChartDataLabels);

interface Props {
  selected: string;
}

interface PaymentEvent {
  date: Date;
  montantDeEcheance: number;
  status: 'overdue' | 'upcoming' | 'paid';
  planID: number;
}

const formatMontant = (montant: number) => {
  return montant.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return dateString;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime()) ? date.toLocaleDateString('fr-FR') : 'N/A';
};

export const DashboardContent = ({ selected }: Props) => {
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [plansPaiement, setPlansPaiement] = useState<PlanDePaiement[]>([]);
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [selectedAcheteur, setSelectedAcheteur] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date | null>(new Date());
  const [inputValue, setInputValue] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [debtorSortOrder, setDebtorSortOrder] = useState<'highest' | 'lowest'>('highest');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let acheteursData: Acheteur[] = [];
      let facturesData: Facture[] = [];
      let plansData: PlanDePaiement[] = [];
      let litigesData: Litige[] = [];

      try {
        acheteursData = await getAcheteurs();
      } catch (err) {
        console.error("Erreur lors de la récupération des acheteurs:", err);
      }

      try {
        facturesData = await getFactures();
      } catch (err) {
        console.error("Erreur lors de la récupération des factures:", err);
      }

      try {
        plansData = await getPlansPaiement();
      } catch (err) {
        console.error("Erreur lors de la récupération des plans de paiement:", err);
      }

      try {
        litigesData = await getLitiges();
      } catch (err) {
        console.error("Erreur lors de la récupération des litiges:", err);
      }

      setAcheteurs(acheteursData || []);
      setFactures(facturesData || []);
      setPlansPaiement(plansData || []);
      setLitiges(litigesData || []);

      console.log("Plans Paiement Data:", plansData);

      if (
        acheteursData.length === 0 &&
        facturesData.length === 0 &&
        plansData.length === 0 &&
        litigesData.length === 0
      ) {
        setError("Impossible de charger les données. Veuillez vérifier la connexion au serveur.");
      }
    } catch (err) {
      console.error("Erreur inattendue lors du chargement des données:", err);
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected.startsWith('accueil')) {
      fetchData();
    }
  }, [selected]);

  const filteredFactures = selectedAcheteur
    ? factures.filter((f) => f.acheteurID === selectedAcheteur)
    : factures;

  const filteredLitiges = selectedAcheteur
    ? litiges.filter((l) => filteredFactures.some((f) => f.factureID === l.facture.factureID))
    : litiges;

  const filteredPlans = useMemo(() => {
    return selectedAcheteur
      ? plansPaiement.filter((p) =>
          p.factures.some((f) => f.acheteurID === selectedAcheteur)
        )
      : plansPaiement;
  }, [plansPaiement, selectedAcheteur]);

  const totalDue = filteredFactures
    .filter((f) => f.status !== "PAYEE")
    .reduce((sum: number, f: Facture) => sum + f.montantRestantDue, 0);

  const unpaidFacturesCount = filteredFactures.filter((f) => f.status !== "PAYEE").length;

  const overdueFactures = filteredFactures.filter((f) => {
    const today = new Date();
    const dueDate = new Date(f.dateEcheance);
    return dueDate < today && f.status !== "PAYEE" && f.status !== "EN_LITIGE" && f.status !== "EN_COURS_DE_PAIEMENT";
  }).length;

  const unresolvedLitiges = filteredLitiges.filter((l) => l.litigeStatus === "EN_COURS").length;

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const recentPayments = filteredPlans
    .flatMap((plan) =>
      plan.paiementDates?.filter((p: PaiementDate) => {
        const paymentDateStr = p.paiementResponses?.[0]?.dateDePaiement || p.echeanceDate;
        const paymentDate = new Date(paymentDateStr);
        const isRecentPayment = paymentDate >= last7Days && p.isPaid;

        console.log(`Payment Date String: ${paymentDateStr}`);
        console.log(`Parsed Payment Date: ${isNaN(paymentDate.getTime()) ? 'Invalid Date' : paymentDate.toISOString()}`);
        console.log(`Last 7 Days Threshold: ${last7Days.toISOString()}`);
        console.log(`Is Paid: ${p.isPaid}, Is Recent: ${isRecentPayment}`);
        console.log(`Montant Payee (paiementDates): ${p.montantPayee}`);
        console.log(`Paiement Responses:`, p.paiementResponses);

        return isRecentPayment;
      }) || []
    );

  const paymentsLast7Days = recentPayments.reduce(
    (sum: number, p: PaiementDate) => sum + (p.montantPayee || 0),
    0
  );

  const facturesEnCoursDePaiement = filteredFactures.filter((f) => f.status === "EN_COURS_DE_PAIEMENT").length;

  const totalFactures = filteredFactures.length;
  const facturesPayees = filteredFactures.filter((f) => f.status === "PAYEE").length;
  const pourcentageFacturesPayees = totalFactures > 0 ? (facturesPayees / totalFactures) * 100 : 0;

  const facturesEncaisseesMontant = filteredFactures
    .filter((f) => f.status === "PAYEE")
    .reduce((sum: number, f: Facture) => sum + (f.montantRestantDue || 0), 0);
  const facturesEncaisseesCount = facturesPayees;

  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);

  const paymentEvents: PaymentEvent[] = filteredPlans.flatMap((plan) =>
    plan.paiementDates?.map((p: PaiementDate) => {
      const dueDate = new Date(p.echeanceDate);
      let status: 'overdue' | 'upcoming' | 'paid';
      if (p.isPaid) {
        status = 'paid';
      } else if (dueDate < today) {
        status = 'overdue';
      } else {
        status = 'upcoming';
      }
      return {
        date: dueDate,
        montantDeEcheance: p.montantDeEcheance,
        status,
        planID: plan.planID,
      };
    }).filter((event): event is PaymentEvent => event !== null) || []
  );

  const upcomingPayments = filteredPlans
    .filter((plan) => plan.planStatus === 'EN_COURS')
    .flatMap((plan) =>
      plan.paiementDates?.filter((p: PaiementDate) => {
        const dueDate = new Date(p.echeanceDate);
        return dueDate >= today && dueDate <= next7Days && !p.isPaid;
      }) || []
    )
    .slice(0, 5);

  const upcomingPaymentsTotal = upcomingPayments.reduce(
    (sum: number, p: PaiementDate) => sum + (p.montantDue || 0),
    0
  );

  const selectedDateEvents = calendarDate
    ? paymentEvents.filter(
        (event) =>
          event.date.getDate() === calendarDate.getDate() &&
          event.date.getMonth() === calendarDate.getMonth() &&
          event.date.getFullYear() === calendarDate.getFullYear()
      )
    : [];

  const agingBuckets = [
    { label: '< 30 jours', days: 30 },
    { label: '31-60 jours', days: 60 },
    { label: '61-90 jours', days: 90 },
    { label: '> 90 jours', days: Infinity },
  ];
  const agingData = agingBuckets.map((bucket) => {
    const today = new Date();
    return filteredFactures
      .filter((f: Facture) => f.status !== "PAYEE")
      .filter((f: Facture) => {
        const dueDate = new Date(f.dateEcheance);
        const daysOverdue = (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysOverdue > (bucket.days === Infinity ? 90 : bucket.days - 30) && (bucket.days === Infinity || daysOverdue <= bucket.days);
      })
      .reduce((sum: number, f: Facture) => sum + f.montantRestantDue, 0);
  });

  const agingChartData: ChartData<"bar", number[], string> = {
    labels: agingBuckets.map((b) => b.label),
    datasets: [
      {
        label: 'Montant Dû (DT)',
        data: agingData,
        backgroundColor: '#6B7280',
      },
    ],
  };

  const debtors = filteredFactures
    .filter((f: Facture) => f.status !== "PAYEE")
    .reduce((acc: Record<number, { acheteur: Acheteur | undefined; amount: number }>, f: Facture) => {
      if (!acc[f.acheteurID]) {
        acc[f.acheteurID] = {
          acheteur: acheteurs.find((a: Acheteur) => a.acheteurID === f.acheteurID),
          amount: 0,
        };
      }
      acc[f.acheteurID].amount += f.montantRestantDue;
      return acc;
    }, {});
  const topDebtors = Object.values(debtors)
    .sort((a, b) => debtorSortOrder === 'highest' ? b.amount - a.amount : a.amount - b.amount)
    .slice(0, 5);

  const topDebtorsChartData: ChartData<"bar", number[], string> = {
    labels: topDebtors.map((d) => (d.acheteur ? `${d.acheteur.nom} ${d.acheteur.prenom}` : 'Inconnu')),
    datasets: [
      {
        label: 'Montant Dû (DT)',
        data: topDebtors.map((d) => d.amount),
        backgroundColor: '#F59E0B',
      },
    ],
  };

  const maxDebtorAmountRaw = topDebtors.length > 0 
    ? Math.max(...topDebtors.map((d) => d.amount)) * 1.1 
    : 500; 
  const maxDebtorAmount = Math.ceil(maxDebtorAmountRaw / 100) * 100; 

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekPlans = filteredPlans.filter((p: PlanDePaiement) => {
    const creationDate = new Date(p.creationDate);
    return creationDate >= lastWeek;
  });
  const lastWeekTotal = lastWeekPlans
    .filter((p: PlanDePaiement) => p.planStatus !== "ANNULE")
    .reduce((sum: number, p: PlanDePaiement) => sum + p.montantTotal, 0);
    
  const lastWeekStatusBreakdown = lastWeekPlans.reduce((acc: Record<string, number>, p: PlanDePaiement) => {
    acc[p.planStatus] = (acc[p.planStatus] || 0) + 1;
    return acc;
  }, {});

  interface PaymentHistoryEntry {
    acheteur: Acheteur | undefined;
    planID: number;
    echeanceDate: string;
    date: string;
    amount: number;
    status: string;
    isPartial: boolean;
  }

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      const history: PaymentHistoryEntry[] = [];
      for (const plan of filteredPlans) {
        const paymentDates = plan.paiementDates || [];
        for (const p of paymentDates) {
          if (p.montantPayee > 0) { 
            const acheteurForPlan = acheteurs.find((a: Acheteur) =>
              plan.factures.some((f: Facture) => f.acheteurID === a.acheteurID)
            );

            if (selectedAcheteur !== null && acheteurForPlan?.acheteurID !== selectedAcheteur) {
              continue;
            }

            try {
              const details = await getEcheanceDetails(p.dateID);
              const paymentResponses = details.paiementResponses || [];
              const mostRecentPayment = paymentResponses.length > 0
                ? paymentResponses.sort((a, b) => new Date(b.dateDePaiement).getTime() - new Date(a.dateDePaiement).getTime())[0]
                : null;

              const isPartial = p.montantPayee < (p.montantDeEcheance || p.montantDue || 0);
              const paymentStatus = isPartial ? 'Partiel ( Règlement incomplet )' : 'Payé';

              history.push({
                acheteur: acheteurForPlan,
                planID: plan.planID,
                echeanceDate: p.echeanceDate,
                date: mostRecentPayment ? mostRecentPayment.dateDePaiement : p.echeanceDate,
                amount: p.montantPayee || 0,
                status: paymentStatus,
                isPartial: isPartial,
              });
            } catch (err) {
              console.error(`Erreur lors de la récupération des détails de l'échéance ${p.dateID}:`, err);
              const isPartial = p.montantPayee < (p.montantDeEcheance || p.montantDue || 0);
              const paymentStatus = isPartial ? 'Partiel ( Règlement incomplet )' : 'Payé';

              history.push({
                acheteur: acheteurForPlan,
                planID: plan.planID,
                echeanceDate: p.echeanceDate,
                date: p.echeanceDate,
                amount: p.montantPayee || 0,
                status: paymentStatus,
                isPartial: isPartial,
              });
            }
          }
        }
      }

      const sortedHistory = history
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setPaymentHistory(sortedHistory);
    };

    if (plansPaiement.length > 0) {
      fetchPaymentHistory();
    }
  }, [plansPaiement, acheteurs, selectedAcheteur]); 

  const filteredAcheteurs = inputValue
    ? acheteurs.filter((acheteur) =>
        `${acheteur.nom} ${acheteur.prenom}`
          .toLowerCase()
          .includes(inputValue.toLowerCase())
      )
    : acheteurs;

  const handleSelectAcheteur = (acheteur: Acheteur | null) => {
    if (acheteur) {
      console.log("Selecting acheteur:", acheteur.acheteurID);
      setSelectedAcheteur(acheteur.acheteurID);
      setInputValue(`${acheteur.nom} ${acheteur.prenom}`);
    } else {
      console.log("Clearing selection");
      setSelectedAcheteur(null);
      setInputValue('');
    }
    setShowSuggestions(false);
  };

  const selectedAcheteurData = acheteurs.find(a => a.acheteurID === selectedAcheteur);
  const inputColorClass = selectedAcheteurData
    ? selectedAcheteurData.score < 50
      ? 'border-red-500 bg-red-100'
      : selectedAcheteurData.score <= 80
      ? 'border-orange-500 bg-orange-100'
      : 'border-green-500 bg-green-100'
    : 'border-gray-300 bg-white';

// Data for Rapports Section
const factureStatusBreakdown = filteredFactures.reduce((acc: Record<string, number>, f: Facture) => {
  acc[f.status] = (acc[f.status] || 0) + 1;
  return acc;
}, {});

const statusColorMap: Record<string, string> = {
  PARTIELLEMENT_PAYEE: '#6B7280',
  EN_COURS_DE_PAIEMENT: '#F59E0B',
  IMPAYEE: '#EF4444',
  PAYEE: '#10B981',
};

const labels = Object.keys(factureStatusBreakdown).filter(status => factureStatusBreakdown[status] > 0);
const data = labels.map(status => factureStatusBreakdown[status]);
const backgroundColors = labels.map(status => statusColorMap[status]);

const factureStatusChartData: ChartData<"pie", number[], string> = {
  labels: labels,
  datasets: [
    {
      label: 'Répartition des Statuts',
      data: data,
      backgroundColor: backgroundColors,
    },
  ],
};

  const debtorSummary = Object.values(debtors).sort((a, b) => b.amount - a.amount);

  const totalLitigesMontant = filteredLitiges
    .filter((l) => l.litigeStatus === "EN_COURS")
    .reduce((sum, l) => sum + (l.facture?.montantRestantDue || 0), 0);

  // Data for Stats Avancées Section
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return date;
  });

  const monthlyPlanTotals = last12Months.map((month) => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const total = filteredPlans
      .filter((plan) => {
        const creationDate = new Date(plan.creationDate);
        return creationDate >= start && creationDate <= end;
      })
      .reduce((sum: number, plan: PlanDePaiement) => sum + plan.montantTotal, 0);
    
    return total;
  });

  const planTotalsChartData: ChartData<"line", number[], string> = {
    labels: last12Months.map((m) => m.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })),
    datasets: [
      {
        label: 'Total des Plans (DT)',
        data: monthlyPlanTotals,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
      },
    ],
  };

  const monthlyEncaissements = last12Months.map((month) => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const total = filteredPlans
      .flatMap((plan) => plan.paiementDates || [])
      .filter((p: PaiementDate) => {
        if (!p.isPaid || p.montantPayee === 0) {
          return false;
        }
        
        const paymentDateStr = p.paiementResponses?.[0]?.dateDePaiement || p.echeanceDate;
        const paymentDate = new Date(paymentDateStr);
          
        const isValidDate = !isNaN(paymentDate.getTime());
        const isInRange = isValidDate && paymentDate >= start && paymentDate <= end;
        return isValidDate && isInRange;
      })
      .reduce((sum: number, p: PaiementDate) => {
        return sum + (p.montantPayee || 0);
      }, 0);
        return total;
  });

  const encaissementsChartData: ChartData<"bar", number[], string> = {
    labels: last12Months.map((m) => m.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })),
        datasets: [
      {
        label: 'Encaissements (DT)',
        data: monthlyEncaissements,
        backgroundColor: '#10B981',
      },
    ],
  };

  const totalLitiges = filteredLitiges.length;
  const resolvedLitiges = filteredLitiges.filter((l) => l.litigeStatus === "RESOLU").length;
  const litigeResolutionRate = totalLitiges > 0 ? (resolvedLitiges / totalLitiges) * 100 : 0;

  return (
    <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-200 p-8 h-screen overflow-auto">
      {selected.startsWith('accueil') && (
        <>
          <h1 className="text-4xl font-extrabold mb-6 text-center text-blue-500">
            {selected === 'accueil-calendrier'
              ? 'Calendrier des Échéances'
              : selected === 'accueil-tableau'
              ? 'Tableau De Bord'
              : selected === 'accueil-rapports'
              ? 'Rapports'
              : 'Statistiques Avancées'}
          </h1>

          <div className="mb-8 flex items-center gap-4 relative">
            <div className="relative w-64">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Chercher Acheteur"
                className={`w-full border p-3 rounded-lg text-black shadow-sm focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out ${inputColorClass}`}
              />
              {showSuggestions && (
                <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-auto shadow-lg">
                  <li
                    onMouseDown={() => handleSelectAcheteur(null)}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                  >
                    Tous les acheteurs
                  </li>
                  {filteredAcheteurs.length > 0 ? (
                    filteredAcheteurs.map((acheteur) => (
                      <li
                        key={acheteur.acheteurID}
                        onMouseDown={() => handleSelectAcheteur(acheteur)}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                      >
                        {acheteur.nom} {acheteur.prenom}
                      </li>
                    ))
                  ) : (
                    <li className="p-2 text-black">Aucun acheteur trouvé</li>
                  )}
                </ul>
              )}
            </div>
            {selectedAcheteur && (
              <button
                onClick={() => handleSelectAcheteur(null)}
                className="px-4 py-3 bg-black text-white rounded-lg shadow-sm hover:bg-gray-800 transition duration-150 ease-in-out"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {selectedAcheteur && filteredPlans.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <h2 className="text-lg font-semibold mb-4 text-black">
                Plans Associés à l'Acheteur Sélectionné
              </h2>
              <ul className="list-disc list-inside text-black">
                {filteredPlans.map((plan) => (
                  <li key={plan.planID}>Plan ID: {plan.planID}</li>
                ))}
              </ul>
            </div>
          )}
          {selectedAcheteur && filteredPlans.length === 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <p className="text-black">Aucun plan associé à cet acheteur.</p>
            </div>
          )}

          {error ? (
            <div className="text-center">
              <p className="text-red-600 text-lg">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out"
              >
                Réessayer
              </button>
            </div>
          ) : loading ? (
            <p className="text-center text-black text-lg">Chargement des données...</p>
          ) : (
            <div className="space-y-10">
              {selected === 'accueil-calendrier' && plansPaiement.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="flex justify-center">
                    <div className="calendar-container">
                      <Calendar
                        onChange={(value: Value) => {
                          if (value instanceof Date) {
                            setCalendarDate(value);
                          }
                        }}
                        value={calendarDate}
                        tileContent={({ date, view }) => {
                          if (view !== 'month') return null;
                          const eventsOnDate = paymentEvents.filter(
                            (event) =>
                              event.date.getDate() === date.getDate() &&
                              event.date.getMonth() === date.getMonth() &&
                              event.date.getFullYear() === date.getFullYear()
                          );
                          return (
                            <div className="flex justify-center space-x-1 mt-1">
                              {eventsOnDate.map((event, index) => (
                                <div
                                  key={index}
                                  className={`w-3 h-3 rounded-full ${
                                    event.status === 'overdue'
                                      ? 'bg-red-500'
                                      : event.status === 'upcoming'
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  title={`Plan ${event.planID}: ${formatMontant(event.montantDeEcheance)} DT (${
                                    event.status === 'overdue'
                                      ? 'En retard'
                                      : event.status === 'upcoming'
                                      ? 'À venir'
                                      : 'Payé'
                                  })`}
                                />
                              ))}
                            </div>
                          );
                        }}
                      />
                    </div>
                  </div>
                  <style jsx>{`
                    .calendar-container :global(.react-calendar) {
                      color: black !important;
                      border: none !important;
                    }
                    .calendar-container :global(.react-calendar__navigation) {
                      color: black !important;
                    }
                    .calendar-container :global(.react-calendar__navigation button) {
                      color: black !important;
                    }
                    .calendar-container :global(.react-calendar__month-view__days__day) {
                      color: black !important;
                    }
                    .calendar-container :global(.react-calendar__month-view__days__day--weekend) {
                      color: black !important;
                    }
                    .calendar-container :global(.react-calendar__month-view__days__day--neighboringMonth) {
                      color: #4a4a4a !important;
                    }
                    .calendar-container :global(.react-calendar__tile--active) {
                      background: #006edc !important;
                      color: white !important;
                    }
                    .calendar-container :global(.react-calendar__tile--active:enabled:hover),
                    .calendar-container :global(.react-calendar__tile--active:enabled:focus) {
                      background: #005bb5 !important;
                    }
                  `}</style>
                  <div className="mt-4 flex justify-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-black">En retard</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-black">À venir</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-black">Payé</span>
                    </div>
                  </div>
                  {calendarDate && (
                    <div className="mt-4">
                      <h3 className="text-md font-semibold text-black">
                        Échéances du {calendarDate.toLocaleDateString('fr-FR')} :
                      </h3>
                      {selectedDateEvents.length > 0 ? (
                        <ul className="list-disc list-inside text-black">
                          {selectedDateEvents.map((event, index) => (
                            <li key={index}>
                              Plan {event.planID}: {formatMontant(event.montantDeEcheance)} DT (
                              {event.status === 'overdue' ? 'En retard' : event.status === 'upcoming' ? 'À venir' : 'Payé'})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-black">Aucune échéance pour cette date.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selected === 'accueil-tableau' && (
                <>
                  {factures.length > 0 && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out flex items-center space-x-4">
                          <FaMoneyBillWave className="text-red-600 text-3xl" />
                          <div className="relative">
                            <h2 className="text-lg font-semibold text-black">Montant Total Dû</h2>
                            <p className="text-2xl font-bold text-red-600">{formatMontant(totalDue)} DT</p>
                            <p className="absolute -right-23 -bottom-6 text-sm text-red-600">{unpaidFacturesCount} factures</p>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out flex items-center space-x-4">
                          <FaWallet className="text-teal-600 text-3xl" />
                          <div className="relative">
                            <h2 className="text-lg font-semibold text-black">Factures Encaissées</h2>
                            <p className="text-2xl font-bold text-teal-600">{formatMontant(facturesEncaisseesMontant)} DT</p>
                            <p className="absolute -right-15 -bottom-6 text-sm text-teal-600">{facturesEncaisseesCount} factures</p>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out flex items-center space-x-4">
                          <FaClock className="text-green-600 text-3xl" />
                          <div>
                            <h2 className="text-lg font-semibold text-black">Paiements (7 Derniers Jours)</h2>
                            {paymentsLast7Days > 0 ? (
                              <p className="text-2xl font-bold text-green-600">{formatMontant(paymentsLast7Days)} DT</p>
                            ) : (
                              <p className="text-sm text-black">Aucun paiement récent</p>
                            )}
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out flex items-center space-x-4">
                          <FaCalendarCheck className="text-cyan-600 text-3xl" />
                          <div>
                            <h2 className="text-lg font-semibold text-black">Prochains Paiements (7 Jours)</h2>
                            <p className="text-2xl font-bold text-cyan-600">{formatMontant(upcomingPaymentsTotal)} DT</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out flex items-center space-x-4">
                          <FaFileInvoice className="text-purple-600 text-3xl" />
                          <div>
                            <h2 className="text-lg font-semibold text-black">Nombre Total de Factures</h2>
                            <p className="text-2xl font-bold text-purple-600">{totalFactures}</p>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out flex items-center space-x-4">
                          <FaMoneyCheck className="text-blue-600 text-3xl" />
                          <div>
                            <h2 className="text-lg font-semibold text-black">Factures en Cours de Paiement</h2>
                            <p className="text-2xl font-bold text-blue-600">{facturesEnCoursDePaiement}</p>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out flex items-center space-x-4">
                          <FaExclamationTriangle className="text-orange-600 text-3xl" />
                          <div>
                            <h2 className="text-lg font-semibold text-black">Factures en Retard</h2>
                            <p className="text-2xl font-bold text-orange-600">{overdueFactures}</p>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out flex items-center space-x-4">
                          <FaGavel className="text-yellow-600 text-3xl" />
                          <div>
                            <h2 className="text-lg font-semibold text-black">Litiges en Cours</h2>
                            <p className="text-2xl font-bold text-yellow-600">{unresolvedLitiges}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                        <div className="bg-white p-12 rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out flex flex-col items-center max-w-sm mx-auto">
                          <div className="relative w-34 h-33">
                            <svg className="w-full h-full" viewBox="0 0 44 44">
                              <circle
                                cx="22"
                                cy="22"
                                r="20"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="4"
                              />
                              <circle
                                cx="22"
                                cy="22"
                                r="20"
                                fill="none"
                                stroke="#9333ea"
                                strokeWidth="4"
                                strokeDasharray="125.6"
                                strokeDashoffset={125.6 - (pourcentageFacturesPayees * 125.6) / 100}
                                strokeLinecap="round"
                                transform="rotate(-90 22 22)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold text-purple-600">
                                {pourcentageFacturesPayees.toFixed(2).replace('.', ',')} %
                              </span>
                            </div>
                          </div>
                          <h2 className="font-semibold text-black mt-4">Taux de Recouvrement</h2>
                        </div>
                      </div>
                    </>
                  )}

                  {factures.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-lg font-semibold mb-4 text-black">Balance Âgée</h2>
                        <div style={{ height: '220px', overflow: 'hidden' }}>
                          <Bar
                            data={agingChartData}
                            options={{
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false,
                                },
                                datalabels: {
                                  anchor: 'end',
                                  align: 'top',
                                  color: '#000',
                                  font: {
                                    size: 12,
                                  },
                                  formatter: (value: number) => {
                                    return formatMontant(value) + ' DT';
                                  },
                                },
                              },
                              scales: {
                                x: {
                                  ticks: {
                                    font: {
                                      size: 10,
                                    },
                                  },
                                  grid: {
                                    display: false,
                                  },
                                },
                                y: {
                                  ticks: {
                                    font: {
                                      size: 12,
                                    },
                                    stepSize: 1000,
                                  },
                                  grid: {
                                    display: false,
                                  },
                                },
                              },
                              layout: {
                                padding: {
                                  top: 20,
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                },
                              },
                            }}
                            height={150}
                          />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-lg font-semibold mb-2 text-black">Flop 5 Des Créanciers</h2>
                        <div className="flex space-x-4 mb-4">
                          <label className="flex items-center text-black">
                            <input
                              type="radio"
                              name="debtorSort"
                              value="highest"
                              checked={debtorSortOrder === 'highest'}
                              onChange={() => setDebtorSortOrder('highest')}
                              className="mr-2"
                            />
                            Top 5 (Plus Haut)
                          </label>
                          <label className="flex items-center text-black">
                            <input
                              type="radio"
                              name="debtorSort"
                              value="lowest"
                              checked={debtorSortOrder === 'lowest'}
                              onChange={() => setDebtorSortOrder('lowest')}
                              className="mr-2"
                            />
                            Top 5 (Plus Bas)
                          </label>
                        </div>
                        <div style={{ height: '220px', overflow: 'hidden' }}>
                          <Bar
                            data={{
                              ...topDebtorsChartData,
                              datasets: [
                                {
                                  ...topDebtorsChartData.datasets[0],
                                  barThickness: 20,
                                },
                              ],
                            }}
                            options={{
                              maintainAspectRatio: false,
                              indexAxis: 'y',
                              plugins: {
                                legend: {
                                  display: false,
                                },
                                datalabels: {
                                  anchor: 'end',
                                  align: 'right',
                                  color: '#000',
                                  font: {
                                    size: 12,
                                  },
                                  formatter: (value: number) => {
                                    return formatMontant(value) + ' DT';
                                  },
                                  offset: 5,
                                },
                              },
                              scales: {
                                x: {
                                  min: 0,
                                  max: maxDebtorAmount,
                                  ticks: {
                                    font: {
                                      size: 8,
                                    },
                                    stepSize: 100,
                                    callback: (value: number | string) => {
                                      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
                                      if (isNaN(numericValue)) return null;
                                      return Math.round(numericValue);
                                    },
                                  },
                                  grid: {
                                    display: false,
                                  },
                                },
                                y: {
                                  ticks: {
                                    font: {
                                      size: 10,
                                    },
                                  },
                                  grid: {
                                    display: false,
                                  },
                                },
                              },
                              layout: {
                                padding: {
                                  top: 0,
                                  bottom: 0,
                                  left: 0,
                                  right: 60,
                                },
                              },
                            }}
                            height={150}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {plansPaiement.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h2 className="text-lg font-semibold mb-4 text-black">Plans de la Semaine Dernière</h2>
                      <p className="text-black">Nombre de Plans : {lastWeekPlans.length}</p>
                      <p className="text-black">Montant Total : {formatMontant(lastWeekTotal)} DT</p>
                      <p className="text-black Πολυγλωσσικό περιεχόμενο mt-2">Répartition des Statuts :</p>
                      <ul className="list-disc list-inside text-black">
                        {Object.entries(lastWeekStatusBreakdown).map(([status, count]: [string, number]) => (
                          <li key={status}>{status} : {count}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plansPaiement.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h2 className="text-lg font-semibold mb-4 text-black">Historique des Paiements (10 plus récents)</h2>
                      {paymentHistory.length > 0 ? (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b">
                              <th className="py-2 px-6 text-black">Acheteur</th>
                              <th className="py-2 px-7 text-black">Plan</th>
                              <th className="py-2 px-11 text-black">Échéance</th>
                              <th className="py-2 px-11 text-black">Date de Paiement</th>
                              <th className="py-2 px-6 text-black">Montant (DT)</th>
                              <th className="py-2 px-8 text-black">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paymentHistory.map((payment: PaymentHistoryEntry, index: number) => (
                              <tr key={index} className="border-b hover:bg-gray-50 transition duration-150 ease-in-out">
                                <td className="py-2 px-4 text-black">
                                  {payment.acheteur ? `${payment.acheteur.nom} ${payment.acheteur.prenom}` : 'N/A'}
                                </td>
                                <td className="py-2 px-8 text-black">{payment.planID}</td>
                                <td className="py-2 px-10 text-black">
                                  {formatDate(payment.echeanceDate)}
                                </td>
                                <td className="py-2 px-15 text-black">
                                  {new Date(payment.date).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="py-2 px-9 text-black">{formatMontant(payment.amount)}</td>
                                <td className="py-2 px-9 text-black">{payment.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-black">Aucun paiement récent.</p>
                      )}
                    </div>
                  )}

                  {plansPaiement.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h2 className="text-lg font-semibold mb-4 text-black">Paiements à Venir (Prochaines 7 Jours)</h2>
                      {upcomingPayments.length > 0 ? (
                        <ul className="space-y-2">
                          {upcomingPayments.map((payment: PaiementDate) => (
                            <li key={payment.dateID} className="flex justify-between text-black">
                              <span>
                                Échéance : {new Date(payment.echeanceDate).toLocaleDateString('fr-FR')} ( Plan : {payment.planID} )
                              </span>
                              <span className="font-semibold">{formatMontant(payment.montantDue)} DT</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-black">Aucun paiement prévu dans les 7 prochains jours.</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {selected === 'accueil-rapports' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h2 className="text-lg font-semibold mb-4 text-black">Répartition des Statuts des Factures</h2>
                      <div style={{ height: '220px', overflow: 'hidden' }}>
                        <Pie
                          data={factureStatusChartData}
                          options={{
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  font: {
                                    size: 12,
                                  },
                                  color: '#000',
                                },
                              },
                              datalabels: {
                                color: '#fff',
                                font: {
                                  size: 12,
                                  weight: 'bold',
                                },
                                formatter: (value: number, context: any) => {
                                  const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${percentage}%`;
                                },
                              },
                            },
                          }}
                          height={220}
                        />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h2 className="text-lg font-semibold mb-4 text-black">Résumé des Factures par Acheteur</h2>
                      {debtorSummary.length > 0 ? (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b">
                              <th className="py-2 px-6 text-black">Acheteur</th>
                              <th className="py-2 px-4 text-black">Montant Dû (DT)</th>
                              <th className="py-2 px-5 text-black">État</th>
                            </tr>
                          </thead>
                          <tbody>
                            {debtorSummary.map((debtor, index) => {
                              const score = debtor.acheteur?.score || 0;
                              const etat = score < 50 ? 'Risqué' : score <= 80 ? 'Moyen' : 'Fiable';
                              const etatColor = score < 50 ? 'text-red-600' : score <= 80 ? 'text-orange-600' : 'text-green-600';
                              return (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-4 text-black">
                                    {debtor.acheteur ? `${debtor.acheteur.nom} ${debtor.acheteur.prenom}` : 'Inconnu'}
                                  </td>
                                  <td className="py-2 px-8 text-black">{formatMontant(debtor.amount)}</td>
                                  <td className={`py-2 px-4 ${etatColor}`}>{etat}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-black">Aucune facture impayée à rapporter.</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 text-black">Montant Total des Litiges en Cours</h2>
                    <p className="text-2xl font-bold text-yellow-600">{formatMontant(totalLitigesMontant)} DT</p>
                    <p className="text-black">Nombre de litiges : {unresolvedLitiges}</p>
                  </div>
                </div>
              )}

              {selected === 'accueil-stats-avancees' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h2 className="text-lg font-semibold mb-4 text-black">Total des Plans par Mois (12 Derniers Mois)</h2>
                      <div style={{ height: '220px', overflow: 'hidden' }}>
                        <Line
                          data={planTotalsChartData}
                          options={{
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              datalabels: {
                                anchor: 'end',
                                align: 'top',
                                color: '#000',
                                offset:-3,
                                font: {
                                  size: 11,
                                },
                                formatter: (value: number) => formatMontant(value),
                              },
                            },
                            scales: {
                              x: {
                                ticks: {
                                  font: {
                                    size: 10,
                                  },
                                },
                                grid: {
                                  display: false,
                                },
                              },
                              y: {
                                ticks: {
                                  font: {
                                    size: 12,
                                  },
                                  stepSize: 500,
                                  callback: (value: number | string) => {
                                    const numValue = Number(value);
                                    return numValue === 0 ? '' : formatMontant(numValue); 
                                  },                               
                                 },
                                grid: {
                                  display: false,
                                },
                              },
                            },
                          }}
                          height={220}
                        />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 text-black">Encaissements Mensuels (12 Derniers Mois)</h2>
                    <div style={{ height: '220px', overflow: 'hidden' }}>
                      <Line
                        data={{
                          ...encaissementsChartData,
                          datasets: [
                            {
                              label: 'Encaissements (DT)',
                              data: monthlyEncaissements,
                              borderColor: '#10B981',
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              fill: true,
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            datalabels: {
                              anchor: 'end',
                              align: 'top',
                              color: '#000',
                              offset: -3,
                              font: {
                                size: 11,
                              },
                              formatter: (value: number) => formatMontant(value),
                            },
                          },
                          scales: {
                            x: {
                              ticks: {
                                font: {
                                  size: 10,
                                },
                              },
                              grid: {
                                display: false,
                              },
                            },
                            y: {
                              ticks: {
                                font: {
                                  size: 12,
                                },
                                stepSize: 500,
                                callback: (value: number | string) => {
                                  const numValue = Number(value);
                                  return numValue === 0 ? '' : formatMontant(numValue); 
                                },
                              },
                              grid: {
                                display: false,
                              },
                              suggestedMax: Math.ceil(Math.max(...monthlyEncaissements) / 500) * 500, 
                            },
                          },
                        }}
                        height={222}
                      />
                    </div>
                  </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 text-black">Taux de Résolution des Litiges</h2>
                    <div className="relative w-34 h-33 mx-auto">
                      <svg className="w-full h-full" viewBox="0 0 44 44">
                        <circle
                          cx="22"
                          cy="22"
                          r="20"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="4"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="20"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="4"
                          strokeDasharray="125.6"
                          strokeDashoffset={125.6 - (litigeResolutionRate * 125.6) / 100}
                          strokeLinecap="round"
                          transform="rotate(-90 22 22)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-green-600">
                          {litigeResolutionRate.toFixed(2).replace('.', ',')} %
                        </span>
                      </div>
                    </div>
                    <p className="text-center text-black mt-4">
                      {resolvedLitiges} litiges résolus sur {totalLitiges}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {selected === 'acheteurs' && <AcheteurList />}
      {selected === 'factures' && <FactureList />}
      {selected === 'paiements' && <PaiementList />}
      {selected === 'Litige' && <LitigeList />}
      {selected === 'aide' && <AideList />}
      {selected === 'aPropos' && <AProposList />}
      {selected === 'roles' && <RoleList />}
      {selected === 'permissions' && <PermissionList />}
      {selected === 'users' && <UserList />}
    </main>
  );
};