import html2pdf from 'html2pdf.js';
import { fileSystemService } from '../storage/fileSystem';
import { JobMetadata } from '../../types/job';

export interface PDFExportOptions {
  elementId: string;
  filename?: string;
  job?: JobMetadata | null;
}

class PDFExporter {
  async exportToPDF({ elementId, filename = 'Lebenslauf.pdf', job }: PDFExportOptions): Promise<boolean> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`PDF Exporter Error: Element mit ID "${elementId}" nicht gefunden.`);
      return false;
    }

    try {
      // 1. Clone target DOM element
      const clone = element.cloneNode(true) as HTMLElement;

      // 2. Remove all .no-print elements from clone (e.g. "📄 A4 Seite 1" badges)
      const noPrintElems = clone.querySelectorAll('.no-print');
      noPrintElems.forEach((el) => el.remove());

      // 3. Clean page styles for A4 print layout
      clone.style.boxShadow = 'none';
      clone.style.margin = '0 auto';
      clone.style.width = '100%';
      clone.style.maxWidth = '800px';

      const pages = clone.querySelectorAll('.cv-a4-page');
      pages.forEach((p) => {
        (p as HTMLElement).style.boxShadow = 'none';
        (p as HTMLElement).style.border = 'none';
        (p as HTMLElement).style.borderRadius = '0';
        (p as HTMLElement).style.minHeight = 'auto';
        (p as HTMLElement).style.padding = '12mm 16mm';
      });

      // 4. Create isolated print iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Iframe Document konnte nicht erzeugt werden.');
      }

      // 5. Gather all head styles & webfonts
      const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${filename}</title>
            ${headStyles}
            <style>
              @page {
                size: A4 portrait;
                margin: 15mm 15mm 15mm 15mm;
              }
              body {
                background: #ffffff !important;
                color: #1e293b !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
              .cv-a4-page {
                padding: 0 !important;
                min-height: auto !important;
                box-shadow: none !important;
                border: none !important;
              }
              h1, h2, h3, h4, h5, h6 {
                break-after: avoid !important;
                page-break-after: avoid !important;
              }
              thead {
                display: table-header-group !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                break-after: avoid !important;
                page-break-after: avoid !important;
              }
              tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            </style>
          </head>
          <body>
            ${clone.outerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

      // 6. Trigger native print for 100% selectable vector PDF output
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 350);

      // 7. Save copy into job directory if job is selected
      if (job) {
        try {
          const opt = {
            margin: [6, 6, 6, 6] as [number, number, number, number],
            filename: filename,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
          };
          const pdfWorker = html2pdf().set(opt).from(clone).outputPdf('blob');
          const pdfBlob: Blob = await pdfWorker;
          const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
          await fileSystemService.addJobFile(job, pdfFile);
        } catch (saveErr) {
          console.warn('Hinweis: Ordner-Kopie konnte nicht aktualisiert werden:', saveErr);
        }
      }

      return true;
    } catch (err) {
      console.error('Fehler beim Vektor-PDF Export:', err);
      return false;
    }
  }
}

export const pdfExporter = new PDFExporter();
