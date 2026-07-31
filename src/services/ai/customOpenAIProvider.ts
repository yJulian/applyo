import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { JobMetadata } from '../../types/job';

export class CustomOpenAIProvider implements IAIProvider {
  id = 'custom_openai' as const;
  name = 'Custom OpenAI (Ollama/OpenRouter/LM Studio)';

  private buildSystemPrompt(): string {
    return `Du bist ein präziser HR & Recruiter KI-Assistent. Deine Aufgabe ist es, aus einer Jobbeschreibung oder einem Stellen-Text die wichtigsten Daten auf Deutsch zu extrahieren.

WICHTIGE REGEL FÜR BERUFSERFAHRUNG (requiresWorkExperience):
Analysiere strikt, ob für diese Stelle ZWINGEND VORHERIGE BERUFSERFAHRUNG IN EINER FIRMA / ANSTELLUNG erforderlich ist, oder ob sich Junioren / Berufseinsteiger ohne bisherige Firmen-Anstellung direkt bewerben können.

Antworte AUSSCHLIESSLICH im validen JSON-Format ohne Markdown-Codeblöcke mit folgendem Schema:
{
  "company": "Firmenname",
  "title": "Stellentitel",
  "summary": "Prägnante 2-3 Sätze Zusammenfassung der Position",
  "tasks": ["Hauptaufgabe 1", "Hauptaufgabe 2"],
  "requirements": ["Anforderung 1", "Anforderung 2"],
  "benefits": ["Benefit 1"],
  "salary": "Gehaltsangabe falls vorhanden oder null",
  "location": "Standort oder null",
  "requiresWorkExperience": false,
  "experienceLevel": "junior" | "required" | "desired" | "none",
  "experienceDetails": "Präzise Feststellung (z.B. 'Direkte Bewerbung für Berufseinsteiger ohne bisherige Firmen-Anstellung möglich')"
}`;
  }

  private cleanBaseUrl(url?: string): string {
    if (!url || !url.trim()) return 'http://localhost:11434/v1';
    let cleaned = url.trim().replace(/\/+$/, '');

    // Bypass browser CORS policy for KIT KI-Toolbox via Vite dev server proxy
    if (cleaned.includes('ki-toolbox.scc.kit.edu')) {
      return '/kit-api/api/v1';
    }

    if (!cleaned.endsWith('/v1') && !cleaned.includes('/v1/')) {
      cleaned += '/v1';
    }
    return cleaned;
  }

  async extractJobData(input: string, config: AIProviderConfig): Promise<ExtractedJobData> {
    const baseUrl = this.cleanBaseUrl(config.baseUrl);
    const endpoint = `${baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey && config.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    }

    const model = config.model?.trim() || 'llama3';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: `Hier ist der Stellentext:\n\n${input}` }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Custom OpenAI Fehler (${response.status}): ${err.error?.message || err.message || response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as ExtractedJobData;
  }

  async generateResponse(
    prompt: string,
    contextJob: JobMetadata | null,
    config: AIProviderConfig,
    _attachmentFile?: File | null
  ): Promise<string> {
    const baseUrl = this.cleanBaseUrl(config.baseUrl);
    const endpoint = `${baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey && config.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    }

    const model = config.model?.trim() || 'llama3';

    let systemContext = 'Du bist ein intelligenter Karriere- und Bewerbungsassistent.';
    if (contextJob) {
      systemContext += `\nAktueller Job im Kontext:\nFirma: ${contextJob.company}\nTitel: ${contextJob.title}\nVorherige Firmen-Anstellung gefordert: ${contextJob.requiresWorkExperience ? 'Ja (Berufserfahrung in einer Firma zwingend)' : 'Nein (Direkteinstieg für Juniors ohne Firmen-Vorerfahrung möglich)'}\nDetails: ${contextJob.experienceDetails}\nZusammenfassung: ${contextJob.summary}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Custom OpenAI Fehler (${response.status}): ${err.error?.message || err.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
