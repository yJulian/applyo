import { ExperienceLevel, JobMetadata } from '../../types/job';

export interface ExtractedJobData {
  company: string;
  title: string;
  summary: string;
  tasks: string[];
  requirements: string[];
  benefits?: string[];
  salary?: string;
  location?: string;
  experienceLevel: ExperienceLevel;
  requiresWorkExperience: boolean; // true = Berufserfahrung erforderlich, false = Junior / Einstieg ohne Erfahrung möglich
  experienceDetails?: string;     // Konkrete Jahre & Details
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  corsProxyUrl?: string;
  corsProxyToken?: string;
}

export interface IAIProvider {
  id: 'openai' | 'gemini' | 'claude' | 'custom_openai';
  name: string;
  extractJobData(input: string, config: AIProviderConfig): Promise<ExtractedJobData>;
  generateResponse(
    prompt: string,
    contextJob: JobMetadata | null,
    config: AIProviderConfig,
    attachmentFile?: File | null
  ): Promise<string>;
}
