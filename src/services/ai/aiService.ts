import { AISettings, AIProviderId, JobMetadata } from '../../types/job';
import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { OpenAIProvider } from './openaiProvider';
import { GeminiProvider } from './geminiProvider';
import { ClaudeProvider } from './claudeProvider';

const SETTINGS_STORAGE_KEY = 'applyo_ai_settings';

export const DEFAULT_AI_SETTINGS: AISettings = {
  activeProvider: 'gemini',
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  geminiKey: '',
  geminiModel: 'gemini-2.0-flash',
  claudeKey: '',
  claudeModel: 'claude-haiku-4-5-20251001',
};

class AIService {
  private providers: Record<AIProviderId, IAIProvider> = {
    openai: new OpenAIProvider(),
    gemini: new GeminiProvider(),
    claude: new ClaudeProvider(),
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
    switch (providerId) {
      case 'openai':
        return { apiKey: settings.openaiKey, model: settings.openaiModel };
      case 'gemini':
        return { apiKey: settings.geminiKey, model: settings.geminiModel };
      case 'claude':
        return { apiKey: settings.claudeKey, model: settings.claudeModel };
    }
  }

  async extractJobData(input: string): Promise<ExtractedJobData> {
    const settings = this.getSettings();
    const activeProvider = this.providers[settings.activeProvider];
    const config = this.getConfigForProvider(settings.activeProvider, settings);

    if (!config.apiKey) {
      // Fallback: If no API key configured, extract mock/heuristic data so user experience is not broken
      return this.heuristicFallbackExtract(input);
    }

    try {
      return await activeProvider.extractJobData(input, config);
    } catch (err: any) {
      console.warn(`KI Extraktion mit ${activeProvider.name} fehlgeschlagen, versuche Heuristik:`, err);
      if (err.message.includes('Key fehlt')) {
        throw err;
      }
      // Return heuristic fallback if API fails
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

    if (!config.apiKey) {
      throw new Error(`API Key für ${activeProvider.name} fehlt. Bitte in den Einstellungen eintragen.`);
    }

    return await activeProvider.generateResponse(prompt, contextJob, config, attachmentFile);
  }

  private heuristicFallbackExtract(input: string): ExtractedJobData {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
    const titleCandidate = lines[0] || 'Unbenannte Stelle';
    const companyCandidate = lines[1] ? lines[1].replace(/^(Firma|Company|bei):\s*/i, '') : 'Unbekannte Firma';

    const textLower = input.toLowerCase();

    let experienceLevel: ExtractedJobData['experienceLevel'] = 'none';
    let requiresWorkExperience = false;
    let experienceDetails = 'Keine konkreten Angaben zur Berufserfahrung im Text gefunden';

    if (textLower.includes('junior') || textLower.includes('trainee') || textLower.includes('einsteiger') || textLower.includes('berufseinstieg')) {
      experienceLevel = 'junior';
      requiresWorkExperience = false;
      experienceDetails = 'Junior-Stelle: Direkte Bewerbung ohne Vorerfahrung möglich';
    } else if (textLower.includes('erfahrung erforderlich') || textLower.includes('jahre erfahrung') || textLower.includes('mindestens')) {
      experienceLevel = 'required';
      requiresWorkExperience = true;
      experienceDetails = 'Berufserfahrung erforderlich (Praxiserfahrung zwingend gefordert)';
    } else if (textLower.includes('erfahrung von vorteil') || textLower.includes('wünschenswert') || textLower.includes('bevorzugt')) {
      experienceLevel = 'desired';
      requiresWorkExperience = false;
      experienceDetails = 'Erfahrung gewünscht / vom Vorteil, aber auch für engagierte Einsteiger möglich';
    }

    // Extract bullet points as tasks & requirements
    const bullets = lines.filter(l => l.startsWith('-') || l.startsWith('*') || l.startsWith('•'));
    const tasks = bullets.slice(0, Math.ceil(bullets.length / 2)).map(b => b.replace(/^[-*•]\s*/, ''));
    const requirements = bullets.slice(Math.ceil(bullets.length / 2)).map(b => b.replace(/^[-*•]\s*/, ''));

    return {
      company: companyCandidate.length > 40 ? 'Neue Firma' : companyCandidate,
      title: titleCandidate.length > 60 ? 'Stellenbezeichnung' : titleCandidate,
      summary: lines.slice(0, 3).join(' ') || 'Keine nähere Beschreibung angegeben.',
      tasks: tasks.length ? tasks : ['Tägliche Aufgaben gemäß Stellenbeschreibung bearbeiten', 'Projektfortschritt dokumentieren'],
      requirements: requirements.length ? requirements : ['Einschlägige Kenntnisse im Fachbereich', 'Teamfähigkeit & Eigeninitiative'],
      benefits: ['Flexible Arbeitszeiten', 'Weiterbildungsmöglichkeiten'],
      experienceLevel,
      requiresWorkExperience,
      experienceDetails,
    };
  }
}

export const aiService = new AIService();
