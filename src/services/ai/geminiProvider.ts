import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { JobMetadata } from '../../types/job';

export class GeminiProvider implements IAIProvider {
  id = 'gemini' as const;
  name = 'Google Gemini';

  private buildSystemPrompt(): string {
    return `Du bist ein präziser HR & Recruiter KI-Assistent. Deine Aufgabe ist es, aus einer Jobbeschreibung oder einem Stellentext die wichtigsten Daten auf Deutsch zu extrahieren.

WICHTIGE REGEL FÜR BERUFSERFAHRUNG (requiresWorkExperience):
Prüfe exakt, ob der Bewerber ZWINGEND VORHER SCHON IN EINER FIRMA / EINEM UNTERNEHMEN GEARBEITET HABEN MUSS oder ob man sich als Junior / Einsteiger ohne vorherige Firmen-Anstellung bewerben kann.
- Berührung im Studium, Kurse oder Hobbyprojekte zählen NICHT als geforderte Firmen-Berufserfahrung.
- requiresWorkExperience = true: Nur wenn ausdrücklich eine vorherige Festanstellung / Arbeitserfahrung in einer Firma gefordert ist.
- requiresWorkExperience = false: Wenn ein Einstieg als Junior / Absolvent ohne bisherige Firmen-Anstellung möglich ist.

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
  "requiresWorkExperience": false, // true = Zwingend Firmen-Vorerfahrung gefordert; false = Junior/Einstieg ohne Firmen-Anstellung möglich
  "experienceLevel": "junior" | "required" | "desired" | "none",
  "experienceDetails": "Spezifische Angabe (z.B. 'Junior-Stelle: Direkte Bewerbung ohne vorherige Firmen-Anstellung möglich' oder 'Zwingend vorherige Arbeitserfahrung in einem Unternehmen gefordert')"
}`;
  }

  async extractJobData(input: string, config: AIProviderConfig): Promise<ExtractedJobData> {
    if (!config.apiKey) {
      throw new Error('Google Gemini API Key fehlt. Bitte in den Einstellungen eintragen.');
    }

    const model = config.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

    const promptText = `${this.buildSystemPrompt()}\n\nHier ist die Stellenbeschreibung:\n${input}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Gemini Fehler (${response.status}): ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(rawText) as ExtractedJobData;
  }

  async generateResponse(prompt: string, contextJob: JobMetadata | null, config: AIProviderConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error('Google Gemini API Key fehlt.');
    }

    const model = config.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

    let context = 'Du bist ein intelligenter Karriere- und Bewerbungsassistent.';
    if (contextJob) {
      context += `\nAktueller Job:\nFirma: ${contextJob.company}\nTitel: ${contextJob.title}\nVorherige Firmen-Anstellung gefordert: ${contextJob.requiresWorkExperience ? 'Ja (Berufserfahrung in einer Firma zwingend)' : 'Nein (Direkteinstieg für Juniors ohne Firmen-Vorerfahrung möglich)'}\nDetails: ${contextJob.experienceDetails}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${context}\n\nFrage/Auftrag: ${prompt}` }]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Gemini Fehler (${response.status}): ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
