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

    const opt = {
      margin: [8, 8, 8, 8] as [number, number, number, number],
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    try {
      // 1. Generate & Trigger Browser Download
      await html2pdf().set(opt).from(element).save();

      // 2. If a job is selected, also save PDF into local job folder via FileSystem API if available
      if (job) {
        try {
          const pdfWorker = html2pdf().set(opt).from(element).outputPdf('blob');
          const pdfBlob: Blob = await pdfWorker;
          const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
          await fileSystemService.addJobFile(job, pdfFile);
        } catch (saveErr) {
          console.warn('Hinweis: PDF konnte nicht automatisch im Ordner gespeichert werden:', saveErr);
        }
      }

      return true;
    } catch (err) {
      console.error('Fehler beim PDF Export:', err);
      return false;
    }
  }
}

export const pdfExporter = new PDFExporter();
