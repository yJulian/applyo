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
}

export interface JobFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  handle?: FileSystemFileHandle;
}

export type AIProviderId = 'openai' | 'gemini' | 'claude' | 'custom_openai';

export interface AISettings {
  activeProvider: AIProviderId;
  openaiKey: string;
  openaiModel: string;
  geminiKey: string;
  geminiModel: string;
  claudeKey: string;
  claudeModel: string;
  customOpenaiBaseUrl: string;
  customOpenaiKey: string;
  customOpenaiModel: string;
  corsProxyUrl?: string;
  corsProxyToken?: string;
  feedbackThresholdWeeks?: number; // Frist in Wochen für den Status "Lange her" (Standard: 6)
}

export const STATUS_LABELS: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  interested: { label: 'Interessiert', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  applied: { label: 'Beworben', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' },
  response_received: { label: 'Antwort erhalten', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  interviewing: { label: 'Vorstellungsgespräch', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)' },
  offer: { label: 'Zusage / Offer', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' },
  rejected: { label: 'Abgesagt', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' },
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, { label: string; tagClass: string; entryBadge: string }> = {
  junior: { label: 'Junior / Berufseinsteiger', tagClass: 'badge-emerald', entryBadge: '🟢 Junior Einstieg' },
  required: { label: 'Berufserfahrung erforderlich', tagClass: 'badge-rose', entryBadge: '🔴 Erfahrung erforderlich' },
  desired: { label: 'Berufserfahrung gewünscht', tagClass: 'badge-amber', entryBadge: '🟡 Erfahrung gewünscht' },
  none: { label: 'Keine Angabe zur Erfahrung', tagClass: 'badge-sky', entryBadge: '⚪ k.A.' },
};
