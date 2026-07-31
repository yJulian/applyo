import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { JobMetadata } from '../../types/job';

export class OpenAIProvider implements IAIProvider {
  id = 'openai' as const;
  name = 'OpenAI';

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

  async extractJobData(input: string, config: AIProviderConfig): Promise<ExtractedJobData> {
    if (!config.apiKey) {
      throw new Error('OpenAI API Key fehlt. Bitte in den Einstellungen eintragen.');
    }

    const model = config.model || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: `Hier ist der Stellentext:\n\n${input}` }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI Fehler (${response.status}): ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content || '{}';
    return JSON.parse(rawContent) as ExtractedJobData;
  }

  async generateResponse(
    prompt: string,
    contextJob: JobMetadata | null,
    config: AIProviderConfig,
    _attachmentFile?: File | null
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error('OpenAI API Key fehlt.');
    }

    const model = config.model || 'gpt-4o-mini';
    let systemContext = 'Du bist ein intelligenter Karriere- und Bewerbungsassistent.';
    if (contextJob) {
      systemContext += `\nAktueller Job im Kontext:\nFirma: ${contextJob.company}\nTitel: ${contextJob.title}\nVorherige Firmen-Anstellung gefordert: ${contextJob.requiresWorkExperience ? 'Ja (Berufserfahrung in einer Firma zwingend)' : 'Nein (Direkteinstieg für Juniors ohne Firmen-Vorerfahrung möglich)'}\nDetails: ${contextJob.experienceDetails}\nZusammenfassung: ${contextJob.summary}`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
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
      throw new Error(`OpenAI Fehler (${response.status}): ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}
