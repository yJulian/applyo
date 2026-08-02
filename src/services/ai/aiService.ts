import { AISettings, AIProviderId, JobMetadata } from '../../types/job';
import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { OpenAIProvider } from './openaiProvider';
import { GeminiProvider } from './geminiProvider';
import { ClaudeProvider } from './claudeProvider';
import { CustomOpenAIProvider } from './customOpenAIProvider';

const SETTINGS_STORAGE_KEY = 'applyo_ai_settings';

export const DEFAULT_AI_SETTINGS: AISettings = {
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
  feedbackThresholdWeeks: 6,
};

class AIService {
  private providers: Record<AIProviderId, IAIProvider> = {
    openai: new OpenAIProvider(),
    gemini: new GeminiProvider(),
    claude: new ClaudeProvider(),
    custom_openai: new CustomOpenAIProvider(),
  };

  getSettings(): AISettings {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Fehler beim Laden der AI Einstellungen:', e);
    }
    return DEFAULT_AI_SETTINGS;
  }

  saveSettings(settings: AISettings): void {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
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

    return {
      company,
      title,
      summary: `Manuell erstellte Zusammenfassung aus dem Text (${input.length} Zeichen).`,
      tasks: tasks.length > 0 ? tasks.slice(0, 5) : ['Mitarbeit im Team', 'Umsetzung von Projekten'],
      requirements: requirements.length > 0 ? requirements.slice(0, 5) : ['Motivation und Interesse am Fachgebiet'],
      benefits: ['Flexible Arbeitszeiten', 'Weiterbildungsmöglichkeiten'],
      salary: undefined,
      location: undefined,
      requiresWorkExperience,
      experienceLevel: expLevel,
      experienceDetails: expDetails,
    };
  }
}

export const aiService = new AIService();
