export type ApplicationStatus =
  | 'interested'        // Interessiert
  | 'applied'           // Beworben
  | 'response_received' // Antwort erhalten
  | 'interviewing'      // Vorstellungsgespräch
  | 'offer'             // Zusage / Angebot
  | 'rejected';         // Abgesagt

export type ExperienceLevel =
  | 'junior'    // Juniorstelle / Ohne Vorerfahrung möglich
  | 'required'  // Berufserfahrung zwingend erforderlich
  | 'desired'   // Berufserfahrung gewünscht / vom Vorteil
  | 'none';     // Keine Angabe / Unklar

export interface StatusHistoryEntry {
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  timestamp: string;
}

export interface JobMetadata {
  id: string;
  company: string;
  title: string;
  url?: string;
  status: ApplicationStatus;
  experienceLevel: ExperienceLevel;
  requiresWorkExperience: boolean; // TRUE = Erfahrung zwingend notwendig; FALSE = Junior / Berufseinsteiger direkt möglich
  experienceDetails?: string;     // z.B. "Junior-Stelle: Direkter Einstieg ohne Vorerfahrung" oder "Mind. 3-5 Jahre Praxiserfahrung gefordert"
  summary: string;
  tasks: string[];
  requirements: string[];
  benefits?: string[];
  salary?: string;
  location?: string;
  createdDate: string;
  updatedDate: string;
  notes?: string;
  relativePath?: string; // e.g. "AcmeCorp/Senior Fullstack Developer"
  feedbackHistory?: string[]; // Stack of ISO timestamp strings for last received feedback
  priorKnowledgeLevel?: number; // Skala 0-9 (0 = gar nichts gefordert, 1-7 = Skills/Vorwissen ohne Firmen-Erfahrung, 8-9 = zwingende echte Arbeitserfahrung an einer Firma)
  personalRating?: number; // 1-5 Sterne für persönliche Rangliste
  customTags?: string[]; // Eigene benutzerdefinierte Tags
  statusHistory?: StatusHistoryEntry[]; // Automatische Protokollierung von Statusänderungen
}

export interface JobFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  handle?: FileSystemFileHandle;
}

export type AIProviderId = 'openai' | 'gemini' | 'claude' | 'custom_openai';

export type CardSectionId =
  | 'feedback'
  | 'tailored_cv'
  | 'documents'
  | 'summary'
  | 'experience_check'
  | 'tasks_requirements'
  | 'benefits'
  | 'notes';

export interface CardSectionConfig {
  id: CardSectionId;
  title: string;
  visible: boolean;
}

export const DEFAULT_CARD_SECTIONS: CardSectionConfig[] = [
  { id: 'feedback', title: 'Letzte Rückmeldung verwalten', visible: true },
  { id: 'tailored_cv', title: 'Lebenslauf.md anpassen', visible: true },
  { id: 'documents', title: 'Dokumente & Ordner', visible: true },
  { id: 'summary', title: 'Zusammenfassung', visible: true },
  { id: 'experience_check', title: 'Berufserfahrung & Einstieg Check', visible: true },
  { id: 'tasks_requirements', title: 'Aufgaben & Anforderungen', visible: true },
  { id: 'benefits', title: 'Benefits & Vorteile', visible: true },
  { id: 'notes', title: 'Notizen & Notizen zum Gespräch', visible: true },
];

export interface AISettings {
  activeProvider: AIProviderId;
  openaiKey: string;
  openaiModel: string;
  openaiModelFast?: string;
  openaiModelGen?: string;
  geminiKey: string;
  geminiModel: string;
  geminiModelFast?: string;
  geminiModelGen?: string;
  claudeKey: string;
  claudeModel: string;
  claudeModelFast?: string;
  claudeModelGen?: string;
  customOpenaiBaseUrl: string;
  customOpenaiKey: string;
  customOpenaiModel: string;
  customOpenaiModelFast?: string;
  customOpenaiModelGen?: string;
  corsProxyUrl?: string;
  corsProxyToken?: string;
  feedbackThresholdWeeks?: number; // Frist in Wochen für den Status "Lange her" (Standard: 6)
  cardLayoutConfig?: CardSectionConfig[]; // Anpassbare Kartenanordnung im Job-Detail
  showSystemAlerts?: boolean; // Bestätigungs-Popups / Alerts aktivieren (Standard: true)
}

export const STATUS_LABELS: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  interested: { label: 'Interessiert', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  applied: { label: 'Beworben', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' },
  response_received: { label: 'Antwort erhalten', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  interviewing: { label: 'Vorstellungsgespräch', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)' },
  offer: { label: 'Zusage / Offer', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' },
  rejected: { label: 'Abgesagt', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' },
};

export function getStatusMeta(status: ApplicationStatus, t?: (key: string) => string) {
  const base = STATUS_LABELS[status] || STATUS_LABELS.interested;
  if (t) {
    return { ...base, label: t(`status.${status}`) };
  }
  return base;
}

export const EXPERIENCE_LABELS: Record<ExperienceLevel, { label: string; tagClass: string; entryBadge: string; color: string; bg: string; borderColor: string }> = {
  junior: { label: 'Junior / Berufseinsteiger', tagClass: 'badge-emerald', entryBadge: '🟢 Junior Einstieg', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.3)' },
  required: { label: 'Berufserfahrung erforderlich', tagClass: 'badge-rose', entryBadge: '🔴 Erfahrung erforderlich', color: '#fb7185', bg: 'rgba(244, 63, 94, 0.12)', borderColor: 'rgba(244, 63, 94, 0.3)' },
  desired: { label: 'Berufserfahrung gewünscht', tagClass: 'badge-amber', entryBadge: '🟡 Erfahrung gewünscht', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.3)' },
  none: { label: 'Keine Angabe zur Erfahrung', tagClass: 'badge-sky', entryBadge: '⚪ k.A.', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', borderColor: 'rgba(148, 163, 184, 0.3)' },
};

export function getExperienceMeta(level: ExperienceLevel, t?: (key: string) => string) {
  const base = EXPERIENCE_LABELS[level] || EXPERIENCE_LABELS.none;
  if (t) {
    return {
      ...base,
      label: t(`experience.${level}`),
      entryBadge: t(`experience.${level}_badge`),
    };
  }
  return base;
}
