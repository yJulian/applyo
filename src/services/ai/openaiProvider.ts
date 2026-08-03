import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { JobMetadata } from '../../types/job';

export class OpenAIProvider implements IAIProvider {
  id = 'openai' as const;
  name = 'OpenAI';

  private buildSystemPrompt(): string {
    return `Du bist ein präziser HR & Recruiter KI-Assistent. Deine Aufgabe ist es, aus einer Jobbeschreibung oder einem Stellen-Text die wichtigsten Daten auf Deutsch zu extrahieren.

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
  "experienceDetails": "Präzise Feststellung",
  "priorKnowledgeLevel": 3
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
    _attachmentFile?: File | null,
    systemContext?: string
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error('OpenAI API Key fehlt.');
    }

    const model = config.model || 'gpt-4o-mini';
    let finalSystemContext = systemContext;
    if (!finalSystemContext) {
      finalSystemContext = 'Du bist ein intelligenter Karriere- und Bewerbungsassistent.';
      if (contextJob) {
        finalSystemContext += `\nAktueller Job im Kontext:\nFirma: ${contextJob.company}\nTitel: ${contextJob.title}\nVorherige Firmen-Anstellung gefordert: ${contextJob.requiresWorkExperience ? 'Ja (Explizit mehrjährige Firmen-Berufserfahrung gefordert)' : 'Nein (Direkteinstieg/Junior ohne mehrjährige Vorerfahrung möglich)'}\nDetails: ${contextJob.experienceDetails}\nZusammenfassung: ${contextJob.summary}`;
      }
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
          { role: 'system', content: finalSystemContext },
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
