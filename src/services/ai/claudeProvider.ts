import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { JobMetadata } from '../../types/job';

export class ClaudeProvider implements IAIProvider {
  id = 'claude' as const;
  name = 'Anthropic Claude';

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

3. SKALA FÜR BENÖTIGTES VORWISSEN (priorKnowledgeLevel: 0 bis 9):
   Bestimme eine Ganzzahl von 0 bis 9, die beschreibt, wie viel Vorwissen/Qualifikation gefordert wird:
   - 0: Gar nichts gefordert (keine Vorkenntnisse, Quereinstieg ohne Erfahrung/Ausbildung möglich).
   - 1 bis 7: Abstufung an benötigtem Vorwissen/Skills (z.B. Programmiersprachen, Fachwissen, Studium, Zertifikate), ABER KEINE zwingend erforderliche reale Arbeitserfahrung an einer Firma.
   - 8 und 9 (also genau 8 und 9): Erfordern ZWINGEND bereits vorhandene reale Arbeitserfahrung AN EINER FIRMA in einem Unternehmen/Betrieb (z.B. mehrjährige Unternehmens-Praxiserfahrung).

Antworte AUSSCHLIESSLICH im validen JSON-Format (kein Markdown, keine Erklärungstexte) mit folgendem Schema:
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
  "experienceDetails": "Spezifische Angabe",
  "priorKnowledgeLevel": 3
}`;
  }

  async extractJobData(input: string, config: AIProviderConfig): Promise<ExtractedJobData> {
    if (!config.apiKey) {
      throw new Error('Anthropic Claude API Key fehlt. Bitte in den Einstellungen eintragen.');
    }

    const model = config.model || 'claude-haiku-4-5-20251001';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2048,
        system: this.buildSystemPrompt(),
        messages: [
          { role: 'user', content: `Extrahiere die Struktur aus folgender Stellenbeschreibung:\n\n${input}` }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Claude Fehler (${response.status}): ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '{}';
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as ExtractedJobData;
  }

  async generateResponse(
    prompt: string,
    contextJob: JobMetadata | null,
    config: AIProviderConfig,
    attachmentFile?: File | null
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error('Anthropic Claude API Key fehlt.');
    }

    const model = config.model || 'claude-haiku-4-5-20251001';
    let system = 'Du bist ein intelligenter Karriere- und Bewerbungsassistent.';
    if (contextJob) {
      system += `\nAktueller Job:\nFirma: ${contextJob.company}\nTitel: ${contextJob.title}\nVorherige Firmen-Anstellung gefordert: ${contextJob.requiresWorkExperience ? 'Ja (Explizit mehrjährige Firmen-Berufserfahrung gefordert)' : 'Nein (Direkteinstieg für Juniors ohne Firmen-Vorerfahrung möglich)'}\nDetails: ${contextJob.experienceDetails}`;
    }

    let userMessagesContent: any = prompt;

    if (attachmentFile && (attachmentFile.type === 'application/pdf' || attachmentFile.name.endsWith('.pdf'))) {
      const base64 = await this.fileToBase64(attachmentFile);
      userMessagesContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        system: system,
        messages: [
          { role: 'user', content: userMessagesContent }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Claude Fehler (${response.status}): ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
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
