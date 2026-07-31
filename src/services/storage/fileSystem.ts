import { openDB } from 'idb';
import { JobMetadata, JobFile } from '../../types/job';

const DB_NAME = 'applyo_filesystem_db';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'root_dir_handle';
const LOCAL_STORAGE_FALLBACK_KEY = 'applyo_jobs_fallback';

export function sanitizeFolderName(str: string, maxLength = 45): string {
  if (!str) return 'Unbenannt';
  
  // Replace German umlauts
  let clean = str
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue');

  // Keep ONLY safe alphanumeric characters, spaces, underscores, and hyphens
  clean = clean.replace(/[^a-zA-Z0-9_\-\s]/g, '');

  // Consolidate multiple spaces
  clean = clean.replace(/\s+/g, ' ').trim();

  // Truncate to maxLength (e.g. 45 characters)
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength).trim();
  }

  return clean || 'Unbenannt';
}

export class FileSystemService {
  private rootHandle: FileSystemDirectoryHandle | null = null;

  async initIndexedDB() {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  hasRootHandle(): boolean {
    return this.rootHandle !== null;
  }

  async getStoredRootHandle(): Promise<FileSystemDirectoryHandle | null> {
    if (this.rootHandle) return this.rootHandle;
    try {
      const db = await this.initIndexedDB();
      const handle = await db.get(STORE_NAME, HANDLE_KEY);
      if (handle) {
        this.rootHandle = handle;
        return handle;
      }
    } catch (e) {
      console.warn('Fehler beim Laden des gespeicherten Ordner-Handles:', e);
    }
    return null;
  }

  async storeRootHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      await db.put(STORE_NAME, handle, HANDLE_KEY);
      this.rootHandle = handle;
    } catch (e) {
      console.warn('Fehler beim Speichern des Ordner-Handles in DB:', e);
    }
  }

  async verifyPermission(handle: FileSystemDirectoryHandle, readWrite = true): Promise<boolean> {
    try {
      const options: { mode?: 'read' | 'readwrite' } = { mode: readWrite ? 'readwrite' : 'read' };
      const status = await (handle as any).queryPermission(options);
      if (status === 'granted') {
        return true;
      }
      if (status === 'prompt') {
        const req = await (handle as any).requestPermission(options);
        return req === 'granted';
      }
    } catch (e) {
      console.warn('Fehler bei Berechtigungsprüfung:', e);
    }
    return false;
  }

  async selectRootDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (!('showDirectoryPicker' in window)) {
      alert('Ihr Browser unterstützt die File System Access API nicht direkt. Daten werden im lokalen Browser-Speicher gesichert.');
      return null;
    }

    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await this.storeRootHandle(handle);
      return handle;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Ordnerauswahl abgebrochen oder fehlgeschlagen:', err);
      }
      return null;
    }
  }

  async scanDirectory(handle?: FileSystemDirectoryHandle | null): Promise<JobMetadata[]> {
    let dirHandle = handle || this.rootHandle;
    if (!dirHandle) {
      dirHandle = await this.getStoredRootHandle();
    }
    if (!dirHandle) {
      return this.loadFallbackJobs();
    }

    // Check query permission without prompting if called automatically on load
    try {
      const perm = await (dirHandle as any).queryPermission({ mode: 'read' });
      if (perm !== 'granted') {
        console.warn('Ordnerberechtigung muss vom Nutzer per Klick bestätigt werden.');
        return this.loadFallbackJobs();
      }
    } catch (e) {
      return this.loadFallbackJobs();
    }

    const jobs: JobMetadata[] = [];

    try {
      // Scan top-level folders (Companies)
      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'directory') {
          const companyHandle = entry as FileSystemDirectoryHandle;
          const companyName = companyHandle.name;

          // Scan sub-folders (Job Titles)
          for await (const subEntry of (companyHandle as any).values()) {
            if (subEntry.kind === 'directory') {
              const jobFolderHandle = subEntry as FileSystemDirectoryHandle;
              const jobTitle = jobFolderHandle.name;

              // Check for metadata.json inside {FIRMA}/{Titel}/
              try {
                const fileHandle = await jobFolderHandle.getFileHandle('metadata.json');
                const file = await fileHandle.getFile();
                const text = await file.text();
                const metadata = JSON.parse(text) as JobMetadata;
                metadata.relativePath = `${companyName}/${jobTitle}`;
                jobs.push(metadata);
              } catch (e) {
                // No metadata.json found in this directory, skip
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Fehler beim Scannen der Ordnerstruktur:', e);
    }

    return jobs;
  }

  async saveJob(job: JobMetadata, handle?: FileSystemDirectoryHandle | null): Promise<{ success: boolean; path?: string; message?: string }> {
    let dirHandle = handle || this.rootHandle;
    if (!dirHandle) {
      dirHandle = await this.getStoredRootHandle();
    }

    const companyFolderName = sanitizeFolderName(job.company || 'Unbekannte Firma', 40);
    const titleFolderName = sanitizeFolderName(job.title || 'Unbenannte Stelle', 45);
    const fullRelativePath = `${companyFolderName}/${titleFolderName}`;

    if (!dirHandle) {
      this.saveFallbackJob(job);
      return { success: false, message: 'Kein Ordner verknüpft (im Browser-Speicher gesichert)' };
    }

    const hasPerm = await this.verifyPermission(dirHandle, true);
    if (!hasPerm) {
      this.saveFallbackJob(job);
      return { success: false, message: 'Keine Schreibberechtigung für den lokalen Ordner.' };
    }

    try {
      // 1. Create or get Company folder {FIRMA}
      const companyHandle = await dirHandle.getDirectoryHandle(companyFolderName, { create: true });
      
      // 2. Create or get Job folder {FIRMA}/{Titel}
      const jobFolderHandle = await companyHandle.getDirectoryHandle(titleFolderName, { create: true });

      // 3. Write metadata.json
      const fileHandle = await jobFolderHandle.getFileHandle('metadata.json', { create: true });
      const writable = await (fileHandle as any).createWritable();
      
      const payload = {
        ...job,
        relativePath: fullRelativePath
      };
      
      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();

      return { success: true, path: fullRelativePath };
    } catch (err: any) {
      console.error('Fehler beim Speichern im Dateisystem:', err);
      this.saveFallbackJob(job);
      return { success: false, message: err.message };
    }
  }

  async deleteJob(job: JobMetadata, handle?: FileSystemDirectoryHandle | null): Promise<boolean> {
    let dirHandle = handle || this.rootHandle;
    if (!dirHandle) {
      dirHandle = await this.getStoredRootHandle();
    }
    if (!dirHandle) {
      this.deleteFallbackJob(job.id);
      return true;
    }

    const companyFolderName = sanitizeFolderName(job.company, 40);
    const titleFolderName = sanitizeFolderName(job.title, 45);

    try {
      const companyHandle = await dirHandle.getDirectoryHandle(companyFolderName);
      await companyHandle.removeEntry(titleFolderName, { recursive: true });
      return true;
    } catch (e) {
      console.error('Fehler beim Löschen des Ordners:', e);
      this.deleteFallbackJob(job.id);
      return false;
    }
  }

  // --- File Management inside {FIRMA}/{Titel}/ ---
  async getJobFolderHandle(
    job: JobMetadata,
    dirHandle?: FileSystemDirectoryHandle | null,
    createIfMissing = false
  ): Promise<FileSystemDirectoryHandle | null> {
    let root = dirHandle || this.rootHandle;
    if (!root) {
      root = await this.getStoredRootHandle();
    }
    if (!root) return null;

    const hasPerm = await this.verifyPermission(root, createIfMissing);
    if (!hasPerm) return null;

    const companyFolderName = sanitizeFolderName(job.company || 'Unbekannte Firma', 40);
    const titleFolderName = sanitizeFolderName(job.title || 'Unbenannte Stelle', 45);

    try {
      const companyHandle = await root.getDirectoryHandle(companyFolderName, { create: createIfMissing });
      return await companyHandle.getDirectoryHandle(titleFolderName, { create: createIfMissing });
    } catch (e) {
      console.warn('Ordner für Stelle konnte nicht geöffnet/erstellt werden:', e);
      return null;
    }
  }

  async listJobFiles(job: JobMetadata): Promise<JobFile[]> {
    const folderHandle = await this.getJobFolderHandle(job, null, false);
    if (!folderHandle) return [];

    const files: JobFile[] = [];
    try {
      for await (const entry of (folderHandle as any).values()) {
        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle;
          const fileObj = await fileHandle.getFile();
          files.push({
            name: fileHandle.name,
            size: fileObj.size,
            type: fileObj.type || this.getMimeTypeFromName(fileHandle.name),
            lastModified: fileObj.lastModified,
            handle: fileHandle,
          });
        }
      }
    } catch (e) {
      console.error('Fehler beim Auflisten der Job-Dateien:', e);
    }
    return files;
  }

  async addJobFile(job: JobMetadata, file: File): Promise<boolean> {
    let folderHandle = await this.getJobFolderHandle(job, null, true);

    if (!folderHandle) {
      const root = await this.selectRootDirectory();
      if (root) {
        folderHandle = await this.getJobFolderHandle(job, root, true);
      }
    }

    if (!folderHandle) {
      alert('Bitte wähle zuerst oben in der Leiste einen Arbeitsordner auf deiner Festplatte aus.');
      return false;
    }

    try {
      const fileHandle = await folderHandle.getFileHandle(file.name, { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(file);
      await writable.close();
      return true;
    } catch (e) {
      console.error('Fehler beim Speichern der Datei im Ordner:', e);
      alert(`Datei konnte nicht im Ordner gespeichert werden: ${(e as Error).message}`);
      return false;
    }
  }

  async deleteJobFile(job: JobMetadata, fileName: string): Promise<boolean> {
    const folderHandle = await this.getJobFolderHandle(job, null, false);
    if (!folderHandle) return false;

    try {
      await folderHandle.removeEntry(fileName);
      return true;
    } catch (e) {
      console.error('Fehler beim Löschen der Datei:', e);
      return false;
    }
  }

  async getJobFileUrl(job: JobMetadata, fileName: string): Promise<string | null> {
    const folderHandle = await this.getJobFolderHandle(job, null, false);
    if (!folderHandle) return null;

    try {
      const fileHandle = await folderHandle.getFileHandle(fileName);
      const fileObj = await fileHandle.getFile();
      return URL.createObjectURL(fileObj);
    } catch (e) {
      console.error('Fehler beim Erstellen der Datei-URL:', e);
      return null;
    }
  }

  private getMimeTypeFromName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc': return 'application/msword';
      case 'txt': return 'text/plain';
      case 'png': return 'image/png';
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'json': return 'application/json';
      default: return 'application/octet-stream';
    }
  }

  // --- Fallback LocalStorage Implementation ---
  private loadFallbackJobs(): JobMetadata[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Fallback Laden fehlgeschlagen:', e);
    }
    return [];
  }

  private saveFallbackJob(job: JobMetadata): void {
    const current = this.loadFallbackJobs();
    const idx = current.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      current[idx] = job;
    } else {
      current.push(job);
    }
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(current));
  }

  private deleteFallbackJob(jobId: string): void {
    const current = this.loadFallbackJobs();
    const filtered = current.filter(j => j.id !== jobId);
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(filtered));
  }
}

export const fileSystemService = new FileSystemService();
