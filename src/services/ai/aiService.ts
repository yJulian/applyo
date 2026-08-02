import { AISettings, AIProviderId, JobMetadata, DEFAULT_CARD_SECTIONS, CardSectionConfig } from '../../types/job';
import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { OpenAIProvider } from './openaiProvider';
import { GeminiProvider } from './geminiProvider';
import { ClaudeProvider } from './claudeProvider';
import { CustomOpenAIProvider } from './customOpenAIProvider';
import { fileSystemService } from '../storage/fileSystem';
import { profileService, UserProfile } from '../storage/profileService';
import { CVData } from '../../types/cv';
import { buildFallbackCV } from './cvGenerator';

const AI_GLOBAL_STORAGE_KEY = 'applyo_global_ai_settings';

export interface GlobalAISettings {
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
  showSystemAlerts?: boolean;
}

export const DEFAULT_GLOBAL_AI_SETTINGS: GlobalAISettings = {
  activeProvider: 'gemini',
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  geminiKey: '',
  geminiModel: 'gemini-2.0-flash',
  claudeKey: '',
  claudeModel: 'claude-haiku-4-5-20251001',
  customOpenaiBaseUrl: 'http://localhost:11434/v1',
  customOpenaiKey: '',
  customOpenaiModel: 'llama-3.3-70b-instruct',
  corsProxyUrl: '',
  corsProxyToken: '',
  showSystemAlerts: true,
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  ...DEFAULT_GLOBAL_AI_SETTINGS,
  feedbackThresholdWeeks: 6,
  cardLayoutConfig: DEFAULT_CARD_SECTIONS,
  showSystemAlerts: true,
};

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

  private getConfigForProvider(providerId: AIProviderId, settings: AISettings): AIProviderConfig {
    const corsProxyUrl = settings.corsProxyUrl;
    const corsProxyToken = settings.corsProxyToken;

    switch (providerId) {
      case 'openai':
        return { apiKey: settings.openaiKey, model: settings.openaiModel, corsProxyUrl, corsProxyToken };
      case 'gemini':
        return { apiKey: settings.geminiKey, model: settings.geminiModel, corsProxyUrl, corsProxyToken };
      case 'claude':
        return { apiKey: settings.claudeKey, model: settings.claudeModel, corsProxyUrl, corsProxyToken };
      case 'custom_openai':
        return {
          apiKey: settings.customOpenaiKey,
          model: settings.customOpenaiModel,
          baseUrl: settings.customOpenaiBaseUrl,
          corsProxyUrl,
          corsProxyToken,
        };
    }
  }

  async extractJobData(input: string): Promise<ExtractedJobData> {
    const settings = this.getSettings();
    const activeProvider = this.providers[settings.activeProvider];
    const config = this.getConfigForProvider(settings.activeProvider, settings);

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
    attachmentFile?: File | null
  ): Promise<string> {
    const settings = this.getSettings();
    const activeProvider = this.providers[settings.activeProvider];
    const config = this.getConfigForProvider(settings.activeProvider, settings);

    if (!config.apiKey && settings.activeProvider !== 'custom_openai') {
      throw new Error(`API Key für ${activeProvider.name} fehlt. Bitte in den Einstellungen eintragen.`);
    }

    return await activeProvider.generateResponse(prompt, contextJob, config, attachmentFile);
  }

  async generateTailoredCV(userProfile: UserProfile, job: JobMetadata | null): Promise<CVData> {
    const fallback = buildFallbackCV(userProfile, job);
    const settings = this.getSettings();
    const config = this.getConfigForProvider(settings.activeProvider, settings);

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
    "website": null,
    "github": null,
    "linkedin": null
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
