import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { JobMetadata } from '../../types/job';

export class GeminiProvider implements IAIProvider {
  id = 'gemini' as const;
  name = 'Google Gemini';

  private buildSystemPrompt(): string {
    return `Du bist ein präziser HR & Recruiter KI-Assistent. Deine Aufgabe ist es, aus einer Jobbeschreibung oder einem Stellentext die wichtigsten Daten auf Deutsch zu extrahieren.

STRIKTE REGELN FÜR ARBEITSERFAHRUNG (requiresWorkExperience & experienceLevel):
1. STRIKTES ERFORDERNIS (requiresWorkExperience = true):
   Setze requiresWorkExperience NUR DANN auf true, wenn EXPLIZIT und ZWINGEND mehrjährige Berufserfahrung in einer Firma / einem Unternehmen verlangt wird (z.B. "Mehrjährige Berufserfahrung", "Mindestens 3 Jahre relevante Praxiserfahrung in einem Unternehmen").
   - Vage oder allgemeine Erwähnungen von "Erfahrung" / "Erfahrungen im Studium" reichen NICHT aus! Setze in diesen Fällen requiresWorkExperience auf false.

2. JUNIOR / EINSTIEG VERVORHEBEN (experienceLevel = "junior"):
   Falls in der Stelle EXPLIZIT "Junior", "Trainee", "Berufseinsteiger" oder "Absolvent" im Titel oder Text steht:
   - Setze experienceLevel = "junior"
   - Setze requiresWorkExperience = false
   - Hebe in experienceDetails explizit hervor: "Junior-Stelle: Berufseinsteiger ohne bisherige Firmen-Anstellung ausdrücklich willkommen"

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
  "experienceDetails": "Spezifische Angabe"
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

  async generateResponse(
    prompt: string,
    contextJob: JobMetadata | null,
    config: AIProviderConfig,
    attachmentFile?: File | null
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error('Google Gemini API Key fehlt.');
    }

    const model = config.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

    let context = 'Du bist ein intelligenter Karriere- und Bewerbungsassistent.';
    if (contextJob) {
      context += `\nAktueller Job:\nFirma: ${contextJob.company}\nTitel: ${contextJob.title}\nVorherige Firmen-Anstellung gefordert: ${contextJob.requiresWorkExperience ? 'Ja (Explizit mehrjährige Firmen-Berufserfahrung gefordert)' : 'Nein (Direkteinstieg für Juniors ohne Firmen-Vorerfahrung möglich)'}\nDetails: ${contextJob.experienceDetails}`;
    }

    const parts: any[] = [];
    if (attachmentFile && (attachmentFile.type === 'application/pdf' || attachmentFile.name.endsWith('.pdf'))) {
      const base64 = await this.fileToBase64(attachmentFile);
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: base64,
        },
      });
    }

    parts.push({ text: `${context}\n\nFrage/Auftrag: ${prompt}` });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Gemini Fehler (${response.status}): ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
