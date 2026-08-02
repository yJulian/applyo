import { IAIProvider, ExtractedJobData, AIProviderConfig } from './types';
import { JobMetadata } from '../../types/job';

export class CustomOpenAIProvider implements IAIProvider {
  id = 'custom_openai' as const;
  name = 'Custom OpenAI (Ollama/OpenRouter/LM Studio)';

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
  "experienceDetails": "Spezifische Angabe",
  "priorKnowledgeLevel": 3
}`;
  }

  private cleanBaseUrl(url?: string, isCorsProxyActive: boolean = false): string {
    if (!url || !url.trim()) return 'http://localhost:11434/v1';
    let cleaned = url.trim().replace(/\/+$/, '');

    // Bypass browser CORS policy for KIT KI-Toolbox via Vite dev server proxy ONLY if no CORS proxy is configured
    if (!isCorsProxyActive && cleaned.includes('ki-toolbox.scc.kit.edu')) {
      return '/kit-api/api/v1';
    }

    if (isCorsProxyActive && cleaned.startsWith('/kit-api/')) {
      cleaned = 'https://ki-toolbox.scc.kit.edu' + cleaned.replace('/kit-api', '');
    }

    if (!cleaned.endsWith('/v1') && !cleaned.includes('/v1/')) {
      cleaned += '/v1';
    }
    return cleaned;
  }

  private getRequestUrlAndHeaders(config: AIProviderConfig): { fetchUrl: string; headers: Record<string, string> } {
    const isCorsProxyActive = Boolean(config.corsProxyUrl && config.corsProxyUrl.trim());
    const baseUrl = this.cleanBaseUrl(config.baseUrl, isCorsProxyActive);
    let targetEndpoint = `${baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey && config.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    }

    if (isCorsProxyActive) {
      headers['x-target-url'] = targetEndpoint;
      if (config.corsProxyToken && config.corsProxyToken.trim()) {
        headers['x-proxy-token'] = config.corsProxyToken.trim();
      }
      return {
        fetchUrl: config.corsProxyUrl!.trim().replace(/\/+$/, ''),
        headers,
      };
    }

    return { fetchUrl: targetEndpoint, headers };
  }

  async extractJobData(input: string, config: AIProviderConfig): Promise<ExtractedJobData> {
    const { fetchUrl, headers } = this.getRequestUrlAndHeaders(config);
    const model = config.model?.trim() || 'llama3';

    const response = await fetch(fetchUrl, {
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
    const { fetchUrl, headers } = this.getRequestUrlAndHeaders(config);
    const model = config.model?.trim() || 'llama3';

    let systemContext = 'Du bist ein intelligenter Karriere- und Bewerbungsassistent.';
    if (contextJob) {
      systemContext += `\nAktueller Job im Kontext:\nFirma: ${contextJob.company}\nTitel: ${contextJob.title}\nVorherige Firmen-Anstellung gefordert: ${contextJob.requiresWorkExperience ? 'Ja (Explizit mehrjährige Firmen-Berufserfahrung gefordert)' : 'Nein (Direkteinstieg für Juniors ohne Firmen-Vorerfahrung möglich)'}\nDetails: ${contextJob.experienceDetails}\nZusammenfassung: ${contextJob.summary}`;
    }

    const response = await fetch(fetchUrl, {
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
