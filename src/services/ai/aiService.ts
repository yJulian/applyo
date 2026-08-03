import { AISettings, AIProviderId, JobMetadata, DEFAULT_CARD_SECTIONS, CardSectionConfig } from '../../types/job';
import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { OpenAIProvider } from './openaiProvider';
import { GeminiProvider } from './geminiProvider';
import { ClaudeProvider } from './claudeProvider';
import { CustomOpenAIProvider } from './customOpenAIProvider';
import { fileSystemService } from '../storage/fileSystem';
import { profileService, UserProfile } from '../storage/profileService';
import { CVData } from '../../types/cv';
import { CoverLetterData } from '../../types/coverLetter';
import { buildFallbackCV } from './cvGenerator';
import { buildFallbackCoverLetter } from './coverLetterGenerator';

const AI_GLOBAL_STORAGE_KEY = 'applyo_global_ai_settings';

export interface GlobalAISettings {
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
  showSystemAlerts?: boolean;
}

export const DEFAULT_GLOBAL_AI_SETTINGS: GlobalAISettings = {
  activeProvider: 'gemini',
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  openaiModelFast: 'gpt-4o-mini',
  openaiModelGen: 'gpt-4o',

  geminiKey: '',
  geminiModel: 'gemini-2.0-flash',
  geminiModelFast: 'gemini-2.0-flash',
  geminiModelGen: 'gemini-2.0-flash',

  claudeKey: '',
  claudeModel: 'claude-haiku-4-5-20251001',
  claudeModelFast: 'claude-haiku-4-5-20251001',
  claudeModelGen: 'claude-sonnet-4-5-20251001',

  customOpenaiBaseUrl: 'http://localhost:11434/v1',
  customOpenaiKey: '',
  customOpenaiModel: 'llama-3.3-70b-instruct',
  customOpenaiModelFast: 'llama-3.3-70b-instruct',
  customOpenaiModelGen: 'llama-3.3-70b-instruct',

  corsProxyUrl: '',
  corsProxyToken: '',
  showSystemAlerts: true,
};

export function buildSystemContext(userProfile: UserProfile, job: JobMetadata | null): string {
  let context = `Du bist ein hochqualifizierter, intelligenter Karriere- und Bewerbungsassistent (KI Karrierelotse).
Deine Antworten sind präzise, professionell, lösungsorientiert und strukturiert.
Nutze Markdown-Formatierung (Überschriften, Fett- und Kursivdruck, Aufzählungslisten, Tabellen oder Codeblöcke), um deine Antworten übersichtlich und ansprechend zu gestalten.

=== NUTZERPROFIL & GLOBALE INFORMATIONEN ÜBER DEN BEWERBER ===
Name: ${userProfile.fullName || 'Nicht angegeben'}
E-Mail: ${userProfile.email || 'Nicht angegeben'}
Telefon: ${userProfile.phone || 'Nicht angegeben'}
Wohnort: ${userProfile.location || 'Nicht angegeben'}
Staatsbürgerschaft: ${userProfile.citizenship || 'Nicht angegeben'}
Website / Portfolio: ${userProfile.website || userProfile.portfolio || 'Nicht angegeben'}
GitHub: ${userProfile.github || 'Nicht angegeben'}
LinkedIn: ${userProfile.linkedin || 'Nicht angegeben'}
Xing: ${userProfile.xing || 'Nicht angegeben'}

--- PROFILBESCHREIBUNG & WERDEGANG (MARKDOWN) ---
${userProfile.markdownDescription || 'Keine Beschreibung vorhanden.'}`;

  if (userProfile.globalExperiences && userProfile.globalExperiences.length > 0) {
    context += `\n\n--- BERUFSERFAHRUNG ---`;
    userProfile.globalExperiences.forEach((exp, idx) => {
      context += `\n${idx + 1}. ${exp.position} bei ${exp.company} (${exp.startDate} - ${exp.endDate || (exp.isCurrent ? 'Heute' : '')})`;
      if (exp.location) context += ` | Ort: ${exp.location}`;
      if (exp.summary) context += `\n   Zusammenfassung: ${exp.summary}`;
      if (exp.highlights && exp.highlights.length > 0) {
        context += `\n   Highlights:\n   - ` + exp.highlights.join('\n   - ');
      }
    });
  }

  if (userProfile.globalEducation && userProfile.globalEducation.length > 0) {
    context += `\n\n--- AUSBILDUNG & STUDIUM ---`;
    userProfile.globalEducation.forEach((edu, idx) => {
      context += `\n${idx + 1}. ${edu.degree} in ${edu.fieldOfStudy} an der ${edu.institution} (${edu.startDate} - ${edu.endDate})`;
      if (edu.description) context += `\n   Details: ${edu.description}`;
    });
  }

  if (userProfile.globalSkillCategories && userProfile.globalSkillCategories.length > 0) {
    context += `\n\n--- FÄHIGKEITEN & KENNTNISSE ---`;
    userProfile.globalSkillCategories.forEach((cat) => {
      context += `\n- ${cat.category}: ${cat.skills.join(', ')}`;
    });
  }

  if (userProfile.globalProjects && userProfile.globalProjects.length > 0) {
    context += `\n\n--- PROJEKTE ---`;
    userProfile.globalProjects.forEach((proj, idx) => {
      context += `\n${idx + 1}. ${proj.title}: ${proj.description}`;
      if (proj.techStack && proj.techStack.length > 0) {
        context += ` (Tech Stack: ${proj.techStack.join(', ')})`;
      }
    });
  }

  if (job) {
    context += `\n\n=== AKTUELLE GEÖFFNETE STELLE (KONTEXT) ===
Firmenname: ${job.company}
Stellentitel: ${job.title}
Status: ${job.status}
Standort: ${job.location || 'Nicht angegeben'}
Gehalt: ${job.salary || 'Nicht angegeben'}
Erstellt am: ${job.createdDate || 'Nicht angegeben'}
Zuletzt aktualisiert am: ${job.updatedDate || 'Nicht angegeben'}
Persönliche Bewertung: ${job.personalRating ? `${job.personalRating}/5 Sterne` : 'Keine'}

--- ERFORDERLICHE BERUFSERFAHRUNG ---
Erfahrungs-Level: ${job.experienceLevel}
Berufserfahrung an Firma gefordert: ${job.requiresWorkExperience ? 'Ja (Explizit mehrjährige Unternehmens-Berufserfahrung zwingend gefordert)' : 'Nein (Direkteinstieg/Junior ohne Firmen-Vorerfahrung möglich)'}
Details zur Erfahrung: ${job.experienceDetails || 'Keine spezifischen Angaben'}
Vorwissens-Skala (0-9): ${job.priorKnowledgeLevel ?? 'Nicht angegeben'}

--- ZUSAMMENFASSUNG DER STELLE ---
${job.summary || 'Keine Zusammenfassung vorhanden'}

--- HAUPTAUFGABEN ---
${job.tasks && job.tasks.length > 0 ? job.tasks.map((t) => `- ${t}`).join('\n') : 'Keine Aufgaben gelistet'}

--- ANFORDERUNGEN ---
${job.requirements && job.requirements.length > 0 ? job.requirements.map((r) => `- ${r}`).join('\n') : 'Keine Anforderungen gelistet'}

--- BENEFITS ---
${job.benefits && job.benefits.length > 0 ? job.benefits.map((b) => `- ${b}`).join('\n') : 'Keine Benefits gelistet'}`;

    if (job.customTags && job.customTags.length > 0) {
      context += `\n\n--- BENUTZERDEFINIERTE TAGS ---
- ${job.customTags.join(', ')}`;
    }

    if (job.notes) {
      context += `\n\n--- PERSÖNLICHE NOTIZEN DES BEWERBERS ZUR STELLE ---
${job.notes}`;
    }
  } else {
    context += `\n\n=== AKTUELLE STELLE ===
(Aktuell ist keine spezifische Stelle in der Anwendung geöffnet. Hilf dem Nutzer basierend auf seinem globalen Nutzerprofil allgemein bei Karrierefragen, Anschreiben, Lebensläufen oder Vorbereitung.)`;
  }

  return context;
}

class AIService {
  private globalAiSettings: GlobalAISettings = { ...DEFAULT_GLOBAL_AI_SETTINGS };
  private rootMeta: { feedbackThresholdWeeks: number; cardLayoutConfig: CardSectionConfig[] } = {
    feedbackThresholdWeeks: 6,
    cardLayoutConfig: DEFAULT_CARD_SECTIONS,
  };

  private providers: Record<AIProviderId, IAIProvider> = {
    openai: new OpenAIProvider(),
    gemini: new GeminiProvider(),
    claude: new ClaudeProvider(),
    custom_openai: new CustomOpenAIProvider(),
  };

  constructor() {
    this.loadGlobalAiSettings();
  }

  loadGlobalAiSettings(): GlobalAISettings {
    try {
      const saved = localStorage.getItem(AI_GLOBAL_STORAGE_KEY) || localStorage.getItem('applyo_ai_settings');
      if (saved) {
        this.globalAiSettings = { ...DEFAULT_GLOBAL_AI_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Fehler beim Laden der globalen AI Einstellungen:', e);
    }
    return this.globalAiSettings;
  }

  saveGlobalAiSettings(settings: Partial<GlobalAISettings>): void {
    this.globalAiSettings = { ...this.globalAiSettings, ...settings };
    try {
      localStorage.setItem(AI_GLOBAL_STORAGE_KEY, JSON.stringify(this.globalAiSettings));
    } catch (e) {
      console.error('Fehler beim Speichern der globalen AI Einstellungen in localStorage:', e);
    }
  }

  setRootMeta(feedbackThresholdWeeks: number, cardLayoutConfig: CardSectionConfig[]) {
    this.rootMeta = { feedbackThresholdWeeks, cardLayoutConfig };
  }

  notifyUser(message: string): void {
    if (this.getSettings().showSystemAlerts !== false) {
      alert(message);
    }
  }

  getSettings(): AISettings {
    return {
      ...this.globalAiSettings,
      feedbackThresholdWeeks: this.rootMeta.feedbackThresholdWeeks,
      cardLayoutConfig: this.rootMeta.cardLayoutConfig,
    };
  }

  async saveSettings(settings: AISettings): Promise<void> {
    // 1. Save device-global AI settings to localStorage
    this.saveGlobalAiSettings(settings);

    // 2. Save root metadata (feedbackThresholdWeeks & cardLayoutConfig) to root metadata.json
    this.rootMeta = {
      feedbackThresholdWeeks: settings.feedbackThresholdWeeks ?? 6,
      cardLayoutConfig: settings.cardLayoutConfig || DEFAULT_CARD_SECTIONS,
    };

    try {
      const profile = await profileService.getProfile();
      await fileSystemService.saveRootMetadata({
        profile,
        feedbackThresholdWeeks: this.rootMeta.feedbackThresholdWeeks,
        cardLayoutConfig: this.rootMeta.cardLayoutConfig,
      });
    } catch (e) {
      console.error('Fehler beim Speichern der root metadata.json:', e);
    }
  }

  getConfigForProvider(
    providerId: AIProviderId,
    settings: AISettings,
    taskType: 'fast' | 'generation' = 'fast'
  ): AIProviderConfig {
    const corsProxyUrl = settings.corsProxyUrl;
    const corsProxyToken = settings.corsProxyToken;

    switch (providerId) {
      case 'openai': {
        const fast = settings.openaiModelFast || settings.openaiModel || 'gpt-4o-mini';
        const gen = settings.openaiModelGen || settings.openaiModel || 'gpt-4o';
        return {
          apiKey: settings.openaiKey,
          model: taskType === 'fast' ? fast : gen,
          fastModel: fast,
          genModel: gen,
          corsProxyUrl,
          corsProxyToken,
        };
      }
      case 'gemini': {
        const fast = settings.geminiModelFast || settings.geminiModel || 'gemini-2.0-flash';
        const gen = settings.geminiModelGen || settings.geminiModel || 'gemini-2.0-flash';
        return {
          apiKey: settings.geminiKey,
          model: taskType === 'fast' ? fast : gen,
          fastModel: fast,
          genModel: gen,
          corsProxyUrl,
          corsProxyToken,
        };
      }
      case 'claude': {
        const fast = settings.claudeModelFast || settings.claudeModel || 'claude-haiku-4-5-20251001';
        const gen = settings.claudeModelGen || settings.claudeModel || 'claude-sonnet-4-5-20251001';
        return {
          apiKey: settings.claudeKey,
          model: taskType === 'fast' ? fast : gen,
          fastModel: fast,
          genModel: gen,
          corsProxyUrl,
          corsProxyToken,
        };
      }
      case 'custom_openai': {
        const fast = settings.customOpenaiModelFast || settings.customOpenaiModel || 'llama-3.3-70b-instruct';
        const gen = settings.customOpenaiModelGen || settings.customOpenaiModel || 'llama-3.3-70b-instruct';
        return {
          apiKey: settings.customOpenaiKey,
          model: taskType === 'fast' ? fast : gen,
          fastModel: fast,
          genModel: gen,
          baseUrl: settings.customOpenaiBaseUrl,
          corsProxyUrl,
          corsProxyToken,
        };
      }
    }
  }

  async extractJobData(input: string): Promise<ExtractedJobData> {
    const settings = this.getSettings();
    const activeProvider = this.providers[settings.activeProvider];
    const config = this.getConfigForProvider(settings.activeProvider, settings, 'fast');

    if (!config.apiKey && settings.activeProvider !== 'custom_openai') {
      return this.heuristicFallbackExtract(input);
    }

    try {
      return await activeProvider.extractJobData(input, config);
    } catch (err: any) {
      console.warn(`KI Extraktion mit ${activeProvider.name} fehlgeschlagen, versuche Heuristik:`, err);
      if (err.message && err.message.includes('Key fehlt')) {
        throw err;
      }
      const fallback = this.heuristicFallbackExtract(input);
      fallback.summary += ` (Hinweis: KI-Aufruf schlug fehl: ${err.message})`;
      return fallback;
    }
  }

  async generateAssistantResponse(
    prompt: string,
    contextJob: JobMetadata | null,
    attachmentFile?: File | null,
    modelMode: 'fast' | 'generation' = 'generation'
  ): Promise<string> {
    const settings = this.getSettings();
    const activeProvider = this.providers[settings.activeProvider];
    const config = this.getConfigForProvider(settings.activeProvider, settings, modelMode);

    if (!config.apiKey && settings.activeProvider !== 'custom_openai') {
      throw new Error(`API Key für ${activeProvider.name} fehlt. Bitte in den Einstellungen eintragen.`);
    }

    const userProfile = await profileService.getProfile();
    const systemContext = buildSystemContext(userProfile, contextJob);

    return await activeProvider.generateResponse(prompt, contextJob, config, attachmentFile, systemContext);
  }

  async generateTailoredCV(userProfile: UserProfile, job: JobMetadata | null): Promise<CVData> {
    const fallback = buildFallbackCV(userProfile, job);
    const settings = this.getSettings();
    const config = this.getConfigForProvider(settings.activeProvider, settings, 'generation');

    if (!config.apiKey && settings.activeProvider !== 'custom_openai') {
      return fallback;
    }

    const systemPrompt = `Du bist ein erfahrener HR- & Lebenslauf-Spezialist. Erstelle aus dem Profil des Bewerbers und der Stellenbeschreibung einen perfekt angepassten Lebenslauf im validen JSON-Format.
Antworte AUSSCHLIESSLICH als beliebiges valides JSON ohne Markdown-Codeblöcke mit folgendem exakten Schema:
{
  "header": {
    "fullName": "Name",
    "title": "Stellentitel",
    "email": "E-Mail",
    "phone": "Telefon",
    "location": "Ort",
    "citizenship": "Staatsbürgerschaft (falls angegeben)",
    "showCitizenship": true,
    "website": null,
    "showWebsite": false,
    "github": null,
    "showGithub": false,
    "linkedin": null,
    "showLinkedin": false,
    "xing": null,
    "showXing": false,
    "portfolio": null,
    "showPortfolio": false
  },
  "summary": "Zusammenfassung (2-3 Sätze)",
  "experiences": [
    {
      "id": "exp-1",
      "company": "Firma",
      "position": "Rolle",
      "location": "Ort",
      "startDate": "YYYY",
      "endDate": "Heute",
      "isCurrent": true,
      "summary": "Beschreibung",
      "highlights": ["Erfolg 1", "Erfolg 2"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "Hochschule",
      "degree": "Abschluss",
      "fieldOfStudy": "Fachrichtung",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "description": "Details"
    }
  ],
  "skillCategories": [
    {
      "id": "cat-1",
      "category": "Kategorie",
      "skills": ["Skill 1", "Skill 2"]
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "Projektname",
      "description": "Projektbeschreibung",
      "techStack": ["Tech 1"],
      "link": null
    }
  ],
  "languages": ["Deutsch", "Englisch"]
}`;

    const promptText = `PROFIL DES BEWERBERS:
Name: ${userProfile.fullName}
E-Mail: ${userProfile.email}
Telefon: ${userProfile.phone}
Wortlaut / Werdegang:
${userProfile.markdownDescription}

ZIEL-STELLENAUSSCHREIBUNG:
Stelle: ${job ? job.title : 'Unbekannt'} bei ${job ? job.company : 'Unbekannt'}
Zusammenfassung: ${job ? job.summary : ''}
Aufgaben: ${job ? job.tasks.join(', ') : ''}
Anforderungen: ${job ? job.requirements.join(', ') : ''}

Erstelle nun das angepasste JSON für den Lebenslauf:`;

    try {
      const responseText = await this.generateAssistantResponse(
        `${systemPrompt}\n\n${promptText}`,
        job
      );
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as CVData;
        return {
          ...fallback,
          ...parsed,
          header: { ...fallback.header, ...(parsed.header || {}) },
        };
      }
      return fallback;
    } catch (e) {
      console.warn('Fehler bei KI-Lebenslauf-Generierung, nutze Fallback:', e);
      return fallback;
    }
  }

  async refineCV(currentCV: CVData, userInstruction: string, job: JobMetadata | null): Promise<CVData> {
    const settings = this.getSettings();
    const config = this.getConfigForProvider(settings.activeProvider, settings);

    if (!config.apiKey && settings.activeProvider !== 'custom_openai') {
      return currentCV;
    }

    const systemPrompt = `Du bist ein Lebenslauf-Editor Assistent. Wende den folgenden Änderungswunsch des Nutzers auf das bestehende Lebenslauf-JSON an und gib das aktualisierte JSON im selben Format zurück.
Antworte AUSSCHLIESSLICH als valides JSON ohne Erklärungen oder Markdown-Codeblöcke.`;

    const promptText = `BEARBEITUNGSWUNSCH DES NUTZERS:
"${userInstruction}"

AKTUELLES LEBENSLAUF-JSON:
${JSON.stringify(currentCV, null, 2)}

ZIEL-STELLE: ${job ? `${job.title} bei ${job.company}` : 'Allgemein'}

Erstelle das aktualisierte Lebenslauf-JSON:`;

    try {
      const responseText = await this.generateAssistantResponse(
        `${systemPrompt}\n\n${promptText}`,
        job
      );
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as CVData;
        return {
          ...currentCV,
          ...parsed,
          header: { ...currentCV.header, ...(parsed.header || {}) },
        };
      }
      return currentCV;
    } catch (e) {
      console.warn('Fehler bei KI-Lebenslauf-Verfeinerung:', e);
      return currentCV;
    }
  }

  async generateTailoredCoverLetter(userProfile: UserProfile, job: JobMetadata | null): Promise<CoverLetterData> {
    const fallback = buildFallbackCoverLetter(userProfile, job);
    const settings = this.getSettings();
    const config = this.getConfigForProvider(settings.activeProvider, settings);

    if (!config.apiKey && settings.activeProvider !== 'custom_openai') {
      return fallback;
    }

    const systemPrompt = `Du bist ein professioneller Bewerbungscoach und HR-Texter. Erstelle aus dem Bewerberprofil und der Ziel-Stellenanzeige ein hochprofessionelles, maßgeschneidertes Anschreiben (Bewerbungsschreiben) im exakten JSON-Format.
Antworte AUSSCHLIESSLICH als beliebiges valides JSON ohne Markdown-Codeblöcke mit folgendem Schema:
{
  "sender": {
    "fullName": "Name des Bewerbers",
    "title": "Aktueller oder angestrebter Titel",
    "email": "E-Mail",
    "phone": "Telefonnummer",
    "location": "Wohnort"
  },
  "recipient": {
    "company": "Firmenname",
    "department": "Abteilung / Recruiting",
    "contactPerson": "Ansprechpartner (falls bekannt, sonst 'Personalabteilung')",
    "address": "Straße / Hausnummer (falls bekannt)",
    "zipCity": "PLZ Ort (falls bekannt)"
  },
  "meta": {
    "placeAndDate": "Ort, Datum (z.B. Berlin, den 3. August 2026)",
    "subject": "Bewerbung als [Stellentitel]"
  },
  "content": {
    "salutation": "Anrede (z.B. 'Sehr geehrte Damen und Herren,' oder 'Sehr geehrte Frau [Name],')",
    "intro": "Starker erster Absatz (2-3 Sätze): Warum bewerbe ich mich und was begeistert mich an der Stelle/Firma.",
    "bodyParagraphs": [
      "Hauptabsatz 1: Relevanteste bisherige Erfolge, Fachkenntnisse und Erfahrungen verknüpft mit den Anforderungen der Stelle.",
      "Hauptabsatz 2: Arbeitsweise, Teamfähigkeit, Motivation und konkreter Mehrwert für das Unternehmen."
    ],
    "callToAction": "Schlussabsatz mit Ausdruck der Freude auf ein persönliches Gespräch sowie evtl. Gehaltsvorstellung/Eintrittsdatum falls relevant.",
    "closing": "Mit freundlichen Grüßen,",
    "signatureName": "Vollständiger Name des Bewerbers"
  }
}`;

    const promptText = `PROFIL DES BEWERBERS:
Name: ${userProfile.fullName}
E-Mail: ${userProfile.email}
Telefon: ${userProfile.phone}
Wohnort: ${userProfile.location}
Werdegang & Hintergrund:
${userProfile.markdownDescription}

ZIEL-STELLENAUSSCHREIBUNG:
Firma: ${job ? job.company : 'Unbekannt'}
Titel: ${job ? job.title : 'Unbekannt'}
Standort: ${job ? (job.location || '') : ''}
Zusammenfassung: ${job ? job.summary : ''}
Aufgaben: ${job ? job.tasks.join(', ') : ''}
Anforderungen: ${job ? job.requirements.join(', ') : ''}
Benefits: ${job ? (job.benefits || []).join(', ') : ''}

Erstelle nun das überzeugende, maßgeschneiderte Anschreiben-JSON:`;

    try {
      const responseText = await this.generateAssistantResponse(
        `${systemPrompt}\n\n${promptText}`,
        job
      );
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as CoverLetterData;
        return {
          ...fallback,
          ...parsed,
          sender: { ...fallback.sender, ...(parsed.sender || {}) },
          recipient: { ...fallback.recipient, ...(parsed.recipient || {}) },
          meta: { ...fallback.meta, ...(parsed.meta || {}) },
          content: { ...fallback.content, ...(parsed.content || {}) },
        };
      }
      return fallback;
    } catch (e) {
      console.warn('Fehler bei KI-Anschreiben-Generierung, nutze Fallback:', e);
      return fallback;
    }
  }

  async refineCoverLetter(currentCoverLetter: CoverLetterData, userInstruction: string, job: JobMetadata | null): Promise<CoverLetterData> {
    const settings = this.getSettings();
    const config = this.getConfigForProvider(settings.activeProvider, settings);

    if (!config.apiKey && settings.activeProvider !== 'custom_openai') {
      return currentCoverLetter;
    }

    const systemPrompt = `Du bist ein Anschreiben-Editor Assistent. Wende den folgenden Änderungswunsch des Nutzers auf das bestehende Anschreiben-JSON an und gib das aktualisierte JSON im selben Format zurück.
Antworte AUSSCHLIESSLICH als valides JSON ohne Erklärungen oder Markdown-Codeblöcke.`;

    const promptText = `BEARBEITUNGSWUNSCH DES NUTZERS:
"${userInstruction}"

AKTUELLES ANSCHREIBEN-JSON:
${JSON.stringify(currentCoverLetter, null, 2)}

ZIEL-STELLE: ${job ? `${job.title} bei ${job.company}` : 'Allgemein'}

Erstelle das aktualisierte Anschreiben-JSON:`;

    try {
      const responseText = await this.generateAssistantResponse(
        `${systemPrompt}\n\n${promptText}`,
        job
      );
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as CoverLetterData;
        return {
          ...currentCoverLetter,
          ...parsed,
          sender: { ...currentCoverLetter.sender, ...(parsed.sender || {}) },
          recipient: { ...currentCoverLetter.recipient, ...(parsed.recipient || {}) },
          meta: { ...currentCoverLetter.meta, ...(parsed.meta || {}) },
          content: { ...currentCoverLetter.content, ...(parsed.content || {}) },
        };
      }
      return currentCoverLetter;
    } catch (e) {
      console.warn('Fehler bei KI-Anschreiben-Verfeinerung:', e);
      return currentCoverLetter;
    }
  }

  private heuristicFallbackExtract(input: string): ExtractedJobData {
    const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);

    let title = 'Unbenannte Stelle';
    let company = 'Unbekanntes Unternehmen';

    if (lines.length > 0) {
      title = lines[0].length < 60 ? lines[0] : lines[0].substring(0, 57) + '...';
    }
    if (lines.length > 1 && lines[1].length < 40) {
      company = lines[1];
    }

    const lowerText = input.toLowerCase();

    // Work Experience Evaluation
    let requiresWorkExperience = false;
    let expLevel: any = 'none';
    let expDetails = 'Direkte Bewerbung ohne vorherige Firmen-Anstellung möglich';

    const isJunior = lowerText.includes('junior') || lowerText.includes('trainee') || lowerText.includes('absolvent') || lowerText.includes('einsteiger');
    const isExplicitSenior = lowerText.includes('mehrjährige berufserfahrung') || lowerText.includes('jahre berufserfahrung') || lowerText.includes('senior') || lowerText.includes('lead');

    if (isJunior) {
      expLevel = 'junior';
      requiresWorkExperience = false;
      expDetails = 'Junior-Stelle: Berufseinsteiger ohne bisherige Firmen-Anstellung ausdrücklich willkommen';
    } else if (isExplicitSenior) {
      expLevel = 'required';
      requiresWorkExperience = true;
      expDetails = 'Explizit mehrjährige Firmen-Berufserfahrung gefordert';
    } else {
      expLevel = 'none';
      requiresWorkExperience = false;
      expDetails = 'Keine zwingende mehrjährige Firmen-Berufserfahrung explizit gefordert';
    }

    const tasks: string[] = [];
    const requirements: string[] = [];

    lines.forEach((line) => {
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        const clean = line.replace(/^[-•*]\s*/, '');
        if (clean.toLowerCase().includes('erfahrung') || clean.toLowerCase().includes('kenntnisse') || clean.toLowerCase().includes('studium')) {
          requirements.push(clean);
        } else {
          tasks.push(clean);
        }
      }
    });

    const priorKnowledgeLevel = isExplicitSenior ? 8 : (isJunior ? 1 : 3);

    return {
      company,
      title,
      summary: `Automatisch generierte Übersicht für ${title} bei ${company}.`,
      tasks: tasks.length > 0 ? tasks.slice(0, 5) : ['Mitarbeit im Team', 'Umsetzung von Projekten'],
      requirements: requirements.length > 0 ? requirements.slice(0, 5) : ['Motivation und Interesse am Fachgebiet'],
      benefits: ['Flexible Arbeitszeiten', 'Weiterbildungsmöglichkeiten'],
      salary: undefined,
      location: undefined,
      requiresWorkExperience,
      experienceLevel: expLevel,
      experienceDetails: expDetails,
      priorKnowledgeLevel,
    };
  }
}

export const aiService = new AIService();
