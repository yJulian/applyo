import { openDB } from 'idb';
import { fileSystemService } from './fileSystem';

const DB_NAME = 'applyo_profile_db';
const STORE_NAME = 'profile';
const CV_FILE_KEY = 'user_global_cv_file';

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  markdownDescription: string; // Personal description & background (.md)
  resumeFileName?: string;
}

export const DEFAULT_PROFILE: UserProfile = {
  fullName: 'Julian Mustermann',
  email: 'julian@example.com',
  phone: '+49 170 1234567',
  location: 'Deutschland',
  markdownDescription: `# Mein Profil & Werdegang

## Über mich
Erfahrener Softwareentwickler mit Leidenschaft für moderne Webanwendungen (React, TypeScript, Progressive Web Apps) und KI-Integrationen.

## Kernkompetenzen
- Frontend: React, TypeScript, Vite, PWA, HTML5, CSS3/Glassmorphism
- AI & Backend: LLM Orchestrierung (OpenAI, Gemini, Claude API), REST APIs, Node.js
- Tools & Methoden: Git, Clean Code, Agile Softwareentwicklung

## Erfahrungen
- Entwicklung von kundenorientierten PWA-Anwendungen mit Offline-Support und Web Access APIs
- Anbindung von KI-Abstraktionsschichten zur automatisierten Text- und Datenextraktion
`,
  resumeFileName: undefined,
};

class ProfileService {
  private cachedProfile: UserProfile | null = null;

  setCachedProfile(profile: UserProfile) {
    this.cachedProfile = profile;
  }

  async initDB() {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  async getProfile(): Promise<UserProfile> {
    if (this.cachedProfile) {
      return this.cachedProfile;
    }
    try {
      const { profile } = await fileSystemService.loadRootMetadata();
      this.cachedProfile = profile;
      return profile;
    } catch (e) {
      console.warn('Fehler beim Laden des Benutzerprofils aus metadata.json:', e);
      return DEFAULT_PROFILE;
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    this.cachedProfile = profile;
    try {
      const loaded = await fileSystemService.loadRootMetadata();
      await fileSystemService.saveRootMetadata({
        profile,
        feedbackThresholdWeeks: loaded.feedbackThresholdWeeks,
        cardLayoutConfig: loaded.cardLayoutConfig,
      });
    } catch (e) {
      console.error('Fehler beim Speichern des Benutzerprofils in root metadata.json:', e);
    }
  }

  async saveGlobalCVFile(file: File): Promise<void> {
    try {
      const db = await this.initDB();
      await db.put(STORE_NAME, file, CV_FILE_KEY);
    } catch (e) {
      console.error('Fehler beim Speichern der globalen CV PDF:', e);
    }
  }

  async getGlobalCVFile(): Promise<File | null> {
    try {
      const db = await this.initDB();
      const file = await db.get(STORE_NAME, CV_FILE_KEY);
      return file || null;
    } catch (e) {
      console.warn('Fehler beim Laden der globalen CV PDF:', e);
      return null;
    }
  }
}

export const profileService = new ProfileService();
