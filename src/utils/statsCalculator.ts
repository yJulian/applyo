import { JobMetadata } from '../types/job';

export interface StatMetrics {
  totalJobs: number;
  totalInterested: number;
  totalApplied: number;
  totalResponseReceived: number;
  totalInterviewing: number;
  totalOffer: number;
  totalRejected: number;

  // Rates in percentage (0-100)
  interestedToAppliedRate: number;
  responseRate: number;
  rejectionRate: number;
  interviewRate: number;
  offerRate: number;

  // Extra stats
  fiveStarCount: number;
  jobsWithNotesCount: number;
  jobsWithSalaryOrLocationCount: number;
  fullDossierCount: number;
  ghostedCount: number;
  nightOwlCount: number;
  avgRating: number;
}

export interface Badge {
  id: string;
  title: string;
  category: 'applications' | 'resilience' | 'success' | 'activity' | 'secret';
  group?: string;
  tier?: number;
  description: string;
  iconType: string;
  currentValue: number;
  targetValue: number;
  isUnlocked: boolean;
  color: string;
  isHidden?: boolean;
  tierLabel?: string;
}

export function calculateStats(jobs: JobMetadata[]): StatMetrics {
  const totalJobs = jobs.length;
  
  let totalInterested = 0;
  let totalApplied = 0;
  let totalResponseReceived = 0;
  let totalInterviewing = 0;
  let totalOffer = 0;
  let totalRejected = 0;
  let fiveStarCount = 0;
  let jobsWithNotesCount = 0;
  let jobsWithSalaryOrLocationCount = 0;
  let fullDossierCount = 0;
  let ghostedCount = 0;
  let nightOwlCount = 0;
  let ratingSum = 0;
  let ratedCount = 0;

  const now = new Date().getTime();
  const fourWeeksMs = 28 * 24 * 60 * 60 * 1000;

  jobs.forEach((job) => {
    // Status counts
    if (job.status === 'interested') totalInterested++;
    if (job.status === 'applied') totalApplied++;
    if (job.status === 'response_received') totalResponseReceived++;
    if (job.status === 'interviewing') totalInterviewing++;
    if (job.status === 'offer') totalOffer++;
    if (job.status === 'rejected') totalRejected++;

    // Rating
    if (job.personalRating) {
      ratingSum += job.personalRating;
      ratedCount++;
      if (job.personalRating === 5) fiveStarCount++;
    }

    // Notes
    if (job.notes && job.notes.trim().length > 0) {
      jobsWithNotesCount++;
    }

    // Salary / Location
    if ((job.salary && job.salary.trim().length > 0) || (job.location && job.location.trim().length > 0)) {
      jobsWithSalaryOrLocationCount++;
    }

    // Full dossier: Has notes, salary, location, rating, and requirements
    if (
      job.notes && job.notes.trim().length > 0 &&
      job.salary && job.salary.trim().length > 0 &&
      job.location && job.location.trim().length > 0 &&
      job.personalRating &&
      job.requirements && job.requirements.length > 0
    ) {
      fullDossierCount++;
    }

    // Ghosted check: applied > 4 weeks ago with no status updates since
    if (job.status === 'applied') {
      const createdTime = new Date(job.createdDate).getTime();
      if (!isNaN(createdTime) && (now - createdTime > fourWeeksMs)) {
        ghostedCount++;
      }
    }

    // Night owl check: updated or created between 23:00 and 05:00
    const updateDate = new Date(job.updatedDate || job.createdDate);
    if (!isNaN(updateDate.getTime())) {
      const hours = updateDate.getHours();
      if (hours >= 23 || hours < 5) {
        nightOwlCount++;
      }
    }
  });

  // Submitted total = jobs that reached applied or beyond
  const totalSubmissions = totalApplied + totalResponseReceived + totalInterviewing + totalOffer + totalRejected;
  const interestedTotalPlusSubmitted = totalInterested + totalSubmissions;

  // Interested -> Applied conversion
  const interestedToAppliedRate = interestedTotalPlusSubmitted > 0 
    ? Math.round((totalSubmissions / interestedTotalPlusSubmitted) * 100) 
    : 0;

  // Response rate = (Response + Interview + Offer + Rejected) / Submissions
  const totalResponses = totalResponseReceived + totalInterviewing + totalOffer + totalRejected;
  const responseRate = totalSubmissions > 0 
    ? Math.round((totalResponses / totalSubmissions) * 100) 
    : 0;

  // Rejection rate = Rejections / Submissions
  const rejectionRate = totalSubmissions > 0 
    ? Math.round((totalRejected / totalSubmissions) * 100) 
    : 0;

  const interviewRate = totalSubmissions > 0 
    ? Math.round(((totalInterviewing + totalOffer) / totalSubmissions) * 100) 
    : 0;

  const offerRate = totalSubmissions > 0 
    ? Math.round((totalOffer / totalSubmissions) * 100) 
    : 0;

  const avgRating = ratedCount > 0 ? parseFloat((ratingSum / ratedCount).toFixed(1)) : 0;

  return {
    totalJobs,
    totalInterested,
    totalApplied,
    totalResponseReceived,
    totalInterviewing,
    totalOffer,
    totalRejected,
    interestedToAppliedRate,
    responseRate,
    rejectionRate,
    interviewRate,
    offerRate,
    fiveStarCount,
    jobsWithNotesCount,
    jobsWithSalaryOrLocationCount,
    fullDossierCount,
    ghostedCount,
    nightOwlCount,
    avgRating,
  };
}

export function getBadges(_jobs: JobMetadata[], stats: StatMetrics, t?: (key: string) => string): Badge[] {
  const totalSubmissions = stats.totalApplied + stats.totalResponseReceived + stats.totalInterviewing + stats.totalOffer + stats.totalRejected;

  const rawBadges: Array<Omit<Badge, 'title' | 'description'> & { defaultTitle: string; defaultDesc: string }> = [
    // --- 1. APPLICATIONS PROGRESSION (Bewerbungen) ---
    {
      id: 'first_step',
      defaultTitle: 'Erster Schritt',
      defaultDesc: 'Lege deinen ersten Job in der Liste an.',
      category: 'applications',
      group: 'applications_tier',
      tier: 1,
      tierLabel: 'Tier I',
      iconType: 'footprints',
      currentValue: stats.totalJobs,
      targetValue: 1,
      isUnlocked: stats.totalJobs >= 1,
      color: '#3b82f6',
    },
    {
      id: 'applicant_bronze',
      defaultTitle: 'Bewerber Bronze',
      defaultDesc: 'Reiche mindestens 5 Bewerbungen ein.',
      category: 'applications',
      group: 'applications_tier',
      tier: 2,
      tierLabel: 'Tier II',
      iconType: 'send',
      currentValue: totalSubmissions,
      targetValue: 5,
      isUnlocked: totalSubmissions >= 5,
      color: '#6366f1',
    },
    {
      id: 'applicant_silver',
      defaultTitle: 'Bewerber Silber',
      defaultDesc: 'Reiche 15 Bewerbungen ein.',
      category: 'applications',
      group: 'applications_tier',
      tier: 3,
      tierLabel: 'Tier III',
      iconType: 'rocket',
      currentValue: totalSubmissions,
      targetValue: 15,
      isUnlocked: totalSubmissions >= 15,
      color: '#8b5cf6',
    },
    {
      id: 'applicant_gold',
      defaultTitle: 'Bewerber Gold',
      defaultDesc: 'Fleißig! 30 Bewerbungen verschickt.',
      category: 'applications',
      group: 'applications_tier',
      tier: 4,
      tierLabel: 'Tier IV',
      iconType: 'award',
      currentValue: totalSubmissions,
      targetValue: 30,
      isUnlocked: totalSubmissions >= 30,
      color: '#ec4899',
    },
    {
      id: 'applicant_machine',
      defaultTitle: 'Bewerbungs-Maschine',
      defaultDesc: 'Beeindruckend! 60 Bewerbungen auf den Weg gebracht.',
      category: 'applications',
      group: 'applications_tier',
      tier: 5,
      tierLabel: 'Tier V',
      iconType: 'zap',
      currentValue: totalSubmissions,
      targetValue: 60,
      isUnlocked: totalSubmissions >= 60,
      color: '#f43f5e',
    },
    {
      id: 'applicant_legend',
      defaultTitle: 'Job-Legende',
      defaultDesc: 'Unaufhaltsam! 100 Bewerbungen eingereicht.',
      category: 'applications',
      group: 'applications_tier',
      tier: 6,
      tierLabel: 'Tier VI',
      iconType: 'crown',
      currentValue: totalSubmissions,
      targetValue: 100,
      isUnlocked: totalSubmissions >= 100,
      color: '#a855f7',
    },

    // --- 2. RESILIENCE PROGRESSION (Absagen / Stehaufmännchen) ---
    {
      id: 'iron_shield_1',
      defaultTitle: 'Stehaufmännchen I',
      defaultDesc: '5 Absagen verkraftet. Kopf hoch!',
      category: 'resilience',
      group: 'resilience_tier',
      tier: 1,
      tierLabel: 'Tier I',
      iconType: 'shield',
      currentValue: stats.totalRejected,
      targetValue: 5,
      isUnlocked: stats.totalRejected >= 5,
      color: '#f59e0b',
    },
    {
      id: 'iron_shield_2',
      defaultTitle: 'Stehaufmännchen II',
      defaultDesc: '10 Absagen überstanden. Die richtige Stelle kommt noch!',
      category: 'resilience',
      group: 'resilience_tier',
      tier: 2,
      tierLabel: 'Tier II',
      iconType: 'shield-check',
      currentValue: stats.totalRejected,
      targetValue: 10,
      isUnlocked: stats.totalRejected >= 10,
      color: '#ef4444',
    },
    {
      id: 'iron_shield_3',
      defaultTitle: 'Stehaufmännchen III',
      defaultDesc: '15 Absagen wegsteckt. Du bleibst am Ball!',
      category: 'resilience',
      group: 'resilience_tier',
      tier: 3,
      tierLabel: 'Tier III',
      iconType: 'shield-alert',
      currentValue: stats.totalRejected,
      targetValue: 15,
      isUnlocked: stats.totalRejected >= 15,
      color: '#dc2626',
    },
    {
      id: 'armored_heart',
      defaultTitle: 'Panzerglas-Herz',
      defaultDesc: '30 Absagen verkraftet. Nichts bringt dich aus der Ruhe!',
      category: 'resilience',
      group: 'resilience_tier',
      tier: 4,
      tierLabel: 'Tier IV',
      iconType: 'shield-off',
      currentValue: stats.totalRejected,
      targetValue: 30,
      isUnlocked: stats.totalRejected >= 30,
      color: '#b91c1c',
    },
    {
      id: 'indestructible',
      defaultTitle: 'Unzerstörbar',
      defaultDesc: '60 Absagen überstanden. Ein wahres Vorbild an Ausdauer!',
      category: 'resilience',
      group: 'resilience_tier',
      tier: 5,
      tierLabel: 'Tier V',
      iconType: 'flame',
      currentValue: stats.totalRejected,
      targetValue: 60,
      isUnlocked: stats.totalRejected >= 60,
      color: '#991b1b',
    },
    {
      id: 'titan_shield',
      defaultTitle: 'Titan-Schild',
      defaultDesc: '100 Absagen! Deine Resilienz ist absolut legendär.',
      category: 'resilience',
      group: 'resilience_tier',
      tier: 6,
      tierLabel: 'Tier VI',
      iconType: 'sparkles',
      currentValue: stats.totalRejected,
      targetValue: 100,
      isUnlocked: stats.totalRejected >= 100,
      color: '#e11d48',
    },

    // --- 3. SUCCESS & CONVERSION (Erfolge) ---
    {
      id: 'conversion_master',
      defaultTitle: 'Taten statt Wünsche',
      defaultDesc: 'Mehr als 50% deiner gemerkten Jobs tatsächlich beworben.',
      category: 'success',
      iconType: 'target',
      currentValue: stats.interestedToAppliedRate,
      targetValue: 50,
      isUnlocked: stats.interestedToAppliedRate >= 50 && totalSubmissions >= 3,
      color: '#10b981',
    },
    {
      id: 'first_interview',
      defaultTitle: 'Einladung im Kasten',
      defaultDesc: 'Erreiche die Phase Vorstellungsgespräch.',
      category: 'success',
      iconType: 'user-check',
      currentValue: stats.totalInterviewing + stats.totalOffer,
      targetValue: 1,
      isUnlocked: (stats.totalInterviewing + stats.totalOffer) >= 1,
      color: '#06b6d4',
    },
    {
      id: 'triple_interview',
      defaultTitle: 'Heißbegehrt',
      defaultDesc: '3 Vorstellungsgespräche gleichzeitig am Laufen.',
      category: 'success',
      iconType: 'users',
      currentValue: stats.totalInterviewing,
      targetValue: 3,
      isUnlocked: stats.totalInterviewing >= 3,
      color: '#0284c7',
    },
    {
      id: 'job_offer',
      defaultTitle: 'Ziel erreicht!',
      defaultDesc: 'Ein Angebot oder eine Zusage erhalten!',
      category: 'success',
      iconType: 'trophy',
      currentValue: stats.totalOffer,
      targetValue: 1,
      isUnlocked: stats.totalOffer >= 1,
      color: '#eab308',
    },

    // --- 4. ACTIVITIES & DETAILS (Aktivität) ---
    {
      id: 'star_evaluator',
      defaultTitle: 'Sterne-Kritiker',
      defaultDesc: 'Bewerte 5 Jobs mit vollen 5 Sternen.',
      category: 'activity',
      iconType: 'star',
      currentValue: stats.fiveStarCount,
      targetValue: 5,
      isUnlocked: stats.fiveStarCount >= 5,
      color: '#f97316',
    },
    {
      id: 'note_taker',
      defaultTitle: 'Aktenkundig',
      defaultDesc: 'Füge bei mindestens 5 Bewerbungen Notizen hinzu.',
      category: 'activity',
      iconType: 'file-text',
      currentValue: stats.jobsWithNotesCount,
      targetValue: 5,
      isUnlocked: stats.jobsWithNotesCount >= 5,
      color: '#14b8a6',
    },
    {
      id: 'researcher',
      defaultTitle: 'Rechercheur',
      defaultDesc: 'Hinterlege Gehalt oder Standort bei 5 Stellen.',
      category: 'activity',
      iconType: 'map-pin',
      currentValue: stats.jobsWithSalaryOrLocationCount,
      targetValue: 5,
      isUnlocked: stats.jobsWithSalaryOrLocationCount >= 5,
      color: '#64748b',
    },

    // --- 5. SECRET / HIDDEN BADGES (Geheime Auszeichnungen) ---
    {
      id: 'ghosted_victim',
      defaultTitle: 'Ghosting-Gefahr',
      defaultDesc: 'Mindestens 1 Bewerbung seit über 4 Wochen ohne jede Antwort.',
      category: 'secret',
      iconType: 'ghost',
      currentValue: stats.ghostedCount,
      targetValue: 1,
      isUnlocked: stats.ghostedCount >= 1,
      color: '#a855f7',
      isHidden: true,
    },
    {
      id: 'full_dossier_master',
      defaultTitle: 'Perfektes Dossier',
      defaultDesc: 'Fülle eine Stelle komplett aus (Sterne, Notizen, Standort, Gehalt & Anforderungen).',
      category: 'secret',
      iconType: 'folder-check',
      currentValue: stats.fullDossierCount,
      targetValue: 1,
      isUnlocked: stats.fullDossierCount >= 1,
      color: '#059669',
      isHidden: true,
    },
    {
      id: 'night_owl',
      defaultTitle: 'Nachteule',
      defaultDesc: 'Aktualisiere oder erstelle eine Bewerbung zu später Stunde (23:00 - 05:00 Uhr).',
      category: 'secret',
      iconType: 'moon',
      currentValue: stats.nightOwlCount,
      targetValue: 1,
      isUnlocked: stats.nightOwlCount >= 1,
      color: '#6366f1',
      isHidden: true,
    },
  ];

  return rawBadges.map((b) => {
    const title = t ? t(`badges.${b.id}.title`) : b.defaultTitle;
    const description = t ? t(`badges.${b.id}.desc`) : b.defaultDesc;
    return {
      id: b.id,
      title,
      category: b.category,
      group: b.group,
      tier: b.tier,
      tierLabel: b.tierLabel,
      description,
      iconType: b.iconType,
      currentValue: b.currentValue,
      targetValue: b.targetValue,
      isUnlocked: b.isUnlocked,
      color: b.color,
      isHidden: b.isHidden,
    };
  });
}
