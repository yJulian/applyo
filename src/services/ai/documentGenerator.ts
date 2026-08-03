import html2pdf from 'html2pdf.js';
import { JobMetadata } from '../../types/job';
import { UserProfile, profileService } from '../storage/profileService';
import { aiService } from './aiService';

export class DocumentGenerator {
  async generateCoverLetterPDF(job: JobMetadata, profile: UserProfile): Promise<File> {
    const globalCvFile = await profileService.getGlobalCVFile();

    const prompt = `Erstelle ein vollständiges, ausformuliertes Anschreiben als sauberes HTML-Dokument für folgende Bewerbung.

BEWERBER-PROFIL:
Name: ${profile.fullName || 'Bewerber'}
E-Mail: ${profile.email || ''}
Telefon: ${profile.phone || ''}
Wohnort: ${profile.location || ''}

MEIN WERDEGANG & PROFIL (Markdown):
${profile.markdownDescription || 'Kein Profil angegeben.'}

ZIEL-STELLENANZEIGE:
Firma: ${job.company}
Stellentitel: ${job.title}
Standort: ${job.location || 'Deutschland'}
Erfahrungsvoraussetzung: ${job.requiresWorkExperience ? 'Berufserfahrung in einer Firma gefordert' : 'Junior / Direkteinstieg ohne Vorerfahrung möglich'}
Details zur Erfahrung: ${job.experienceDetails}
Aufgaben: ${job.tasks.join(', ')}
Anforderungen: ${job.requirements.join(', ')}

ANWEISUNG:
Schreibe ein überzeugendes, ausformuliertes Anschreiben (3-4 Absätze) auf Deutsch.
Falls ein PDF-Lebenslauf angehängt ist, nutze dessen Stationen.
Gib AUSSCHLIESSLICH den HTML-Inhalt zurück (verwende <h2>, <p>, <ul>, <li>).`;

    let cleanedHtml = '';
    try {
      const htmlResponse = await aiService.generateAssistantResponse(prompt, job, globalCvFile, 'generation');
      cleanedHtml = htmlResponse.replace(/```html/g, '').replace(/```/g, '').trim();
    } catch (e: any) {
      console.warn('KI Aufruf für Anschreiben fehlgeschlagen, erstelle Standard-Vorlage:', e);
      cleanedHtml = `
        <h2>Bewerbung als ${job.title}</h2>
        <p>Sehr geehrte Damen und Herren,</p>
        <p>mit großem Interesse habe ich Ihre Stellenausschreibung für die Position als <strong>${job.title}</strong> bei <strong>${job.company}</strong> gelesen.</p>
        <p>Durch meine fundierten Erfahrungen und meine Begeisterung für den Fachbereich bin ich überzeugt, einen wertvollen Beitrag zu Ihrem Team leisten zu können.</p>
        <p>Über die Gelegenheit zu einem persönlichen Gespräch freue ich mich sehr.</p>
        <p>Mit freundlichen Grüßen,<br><strong>${profile.fullName || 'Bewerber'}</strong></p>
      `;
    }

    const fullDoc = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.6; font-size: 13px; background-color: #ffffff; width: 100%;">
        <div style="margin-bottom: 24px; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; display: flex; justify-content: space-between;">
          <div>
            <h1 style="margin: 0; font-size: 22px; color: #1e1b4b; font-weight: bold;">${profile.fullName || 'Bewerber'}</h1>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 12px;">${profile.email || ''} | ${profile.phone || ''} | ${profile.location || ''}</p>
          </div>
          <div style="text-align: right; color: #475569; font-size: 12px;">
            <p style="margin: 0; font-weight: bold; color: #4f46e5;">${job.company}</p>
            <p style="margin: 2px 0 0 0;">Stelle: ${job.title}</p>
            <p style="margin: 2px 0 0 0;">Datum: ${new Date().toLocaleDateString('de-DE')}</p>
          </div>
        </div>
        <div style="margin-top: 16px;">
          ${cleanedHtml}
        </div>
      </div>
    `;

    return this.convertHtmlToPdfFile(fullDoc, 'Anschreiben.pdf');
  }

  async generateResumePDF(job: JobMetadata, profile: UserProfile): Promise<File> {
    const globalCvFile = await profileService.getGlobalCVFile();

    const prompt = `Erstelle einen maßgeschneiderten Lebenslauf (CV) als formatierten HTML-Code für folgende Bewerbung.

BEWERBER-PROFIL:
Name: ${profile.fullName || 'Bewerber'}
E-Mail: ${profile.email || ''}
Telefon: ${profile.phone || ''}
Wohnort: ${profile.location || ''}

MEIN WERDEGANG & PROFIL:
${profile.markdownDescription || 'Keine Beschreibung angegeben.'}

ZIEL-STELLENANZEIGE:
Firma: ${job.company}
Stellentitel: ${job.title}
Anforderungen: ${job.requirements.join(', ')}

ANWEISUNG:
Erstelle einen übersichtlichen Lebenslauf als HTML. Hebe die für ${job.title} relevanten Fähigkeiten besonders hervor.
Gib AUSSCHLIESSLICH den HTML-Inhalt zurück (mit <h2>, <h3>, <p>, <ul>, <li>).`;

    let cleanedHtml = '';
    try {
      const htmlResponse = await aiService.generateAssistantResponse(prompt, job, globalCvFile, 'generation');
      cleanedHtml = htmlResponse.replace(/```html/g, '').replace(/```/g, '').trim();
    } catch (e: any) {
      console.warn('KI Aufruf für Lebenslauf fehlgeschlagen, erstelle Standard-Vorlage:', e);
      cleanedHtml = `
        <h2>Lebenslauf — ${profile.fullName || 'Bewerber'}</h2>
        <h3>Profil & Zielsetzung</h3>
        <p>Zielposition: ${job.title} bei ${job.company}</p>
        <h3>Kenntnisse & Qualifikationen</h3>
        <ul>
          ${job.requirements.map(r => `<li>${r}</li>`).join('')}
        </ul>
      `;
    }

    const fullDoc = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.5; font-size: 13px; background-color: #ffffff; width: 100%;">
        <div style="margin-bottom: 20px; border-bottom: 2px solid #06b6d4; padding-bottom: 10px;">
          <h1 style="margin: 0; font-size: 24px; color: #0f172a;">${profile.fullName || 'Lebenslauf'}</h1>
          <p style="margin: 4px 0 0 0; color: #475569; font-size: 12px;">${profile.email || ''} • ${profile.phone || ''} • ${profile.location || ''}</p>
        </div>
        <div style="margin-top: 16px;">
          ${cleanedHtml}
        </div>
      </div>
    `;

    return this.convertHtmlToPdfFile(fullDoc, 'CV.pdf');
  }

  private async convertHtmlToPdfFile(htmlContent: string, fileName: string): Promise<File> {
    const container = document.createElement('div');
    container.className = 'pdf-export-host';
    container.innerHTML = `
      <style>
        .pdf-export-inner, .pdf-export-inner * {
          color: #0f172a !important;
          background-color: transparent !important;
          box-sizing: border-box !important;
        }
        .pdf-export-inner h1 {
          color: #1e1b4b !important;
          font-size: 20px !important;
          margin: 0 0 8px 0 !important;
        }
        .pdf-export-inner h2 {
          color: #4f46e5 !important;
          font-size: 15px !important;
          margin: 16px 0 8px 0 !important;
          border-bottom: 1px solid #cbd5e1 !important;
          padding-bottom: 4px !important;
        }
        .pdf-export-inner h3 {
          color: #0f172a !important;
          font-size: 13px !important;
          margin: 12px 0 4px 0 !important;
        }
        .pdf-export-inner p {
          margin: 0 0 8px 0 !important;
          line-height: 1.6 !important;
          font-size: 12px !important;
        }
        .pdf-export-inner ul, .pdf-export-inner ol {
          margin: 0 0 12px 0 !important;
          padding-left: 20px !important;
        }
        .pdf-export-inner li {
          margin-bottom: 4px !important;
          font-size: 12px !important;
        }
      </style>
      <div class="pdf-export-inner">
        ${htmlContent}
      </div>
    `;

    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '794px';
    container.style.minHeight = '1123px';
    container.style.zIndex = '999999';
    container.style.background = '#ffffff';
    container.style.color = '#0f172a';
    container.style.padding = '40px';
    container.style.boxSizing = 'border-box';

    document.body.appendChild(container);

    // Wait 250ms for layout & styling to resolve
    await new Promise((resolve) => setTimeout(resolve, 250));

    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      // Set configuration before specifying .from(container)
      const pdfBlob: Blob = await (html2pdf as any)()
        .set(opt)
        .from(container)
        .output('blob');

      console.log(`✅ Erstellte PDF-Dateigröße (${fileName}):`, pdfBlob.size, 'Bytes');

      return new File([pdfBlob], fileName, { type: 'application/pdf' });
    } finally {
      document.body.removeChild(container);
    }
  }
}

export const documentGenerator = new DocumentGenerator();
