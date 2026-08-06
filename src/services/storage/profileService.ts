import { openDB } from 'idb';
import { fileSystemService } from './fileSystem';
import { CVExperience, CVEducation, CVSkillCategory, CVProject, CVStyleOptions } from '../../types/cv';

const DB_NAME = 'applyo_profile_db';
const STORE_NAME = 'profile';
const CV_FILE_KEY = 'user_global_cv_file';

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  address?: string;
  citizenship?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  xing?: string;
  portfolio?: string;
  markdownDescription: string; // Personal description & background (.md)
  resumeFileName?: string;
  globalProjects?: CVProject[];
  globalExperiences?: CVExperience[];
  globalEducation?: CVEducation[];
  globalSkillCategories?: CVSkillCategory[];
  lastUsedCVStyle?: CVStyleOptions;
}

export const DEFAULT_PROFILE: UserProfile = {
  fullName: 'Julian Mustermann',
  email: 'julian@example.com',
  phone: '+49 170 1234567',
  location: 'Deutschland',
  address: 'Musterstraße 12, 10115 Berlin',
  citizenship: 'Deutsch',
  website: '',
  github: 'github.com/mustermann',
  linkedin: 'linkedin.com/in/mustermann',
  xing: '',
  portfolio: '',
  markdownDescription: `# Mein Profil & Werdegang

## Über mich
Erfahrener Softwareentwickler mit Leidenschaft für moderne Webanwendungen (React, TypeScript, Progressive Web Apps) und KI-Integrationen.

## Kernkompetenzen
- Frontend: React, TypeScript, Vite, PWA, HTML5, CSS3/Glassmorphic Design
- AI & Backend: LLM Orchestrierung (OpenAI, Gemini, Claude API), REST APIs, Node.js
- Tools & Methoden: Git, Clean Code, Agile Softwareentwicklung
`,
  resumeFileName: undefined,
  globalProjects: [
    {
      id: 'g-proj-1',
      title: 'Applyo - Smart Application Workspace',
      description: 'PWA-Anwendung zur Verwaltung von Bewerbungen mit lokaler Ordner-Synchronisation und KI-Assistent.',
      techStack: ['React', 'TypeScript', 'Vite', 'FileSystem API'],
    },
    {
      id: 'g-proj-2',
      title: 'AI Resume & Portfolio Generator',
      description: 'Automatische Erstellung maßgeschneiderter Bewerbungsunterlagen und PDFs.',
      techStack: ['React', 'TypeScript', 'html2pdf.js', 'LLM Prompt Engineering'],
    },
  ],
  globalExperiences: [
    {
      id: 'g-exp-1',
      company: 'Tech Solutions & Cloud AG',
      position: 'Senior Software Engineer / Frontend Lead',
      location: 'Deutschland (Remote)',
      startDate: '2022',
      endDate: 'Heute',
      isCurrent: true,
      summary: 'Leitung der Frontend-Entwicklung für kundenorientierte Webportale.',
      highlights: [
        'Konzeption und Umsetzung von performanten React/TypeScript PWAs',
        'Integration von KI-Schnittstellen (OpenAI & Gemini API) zur Automatisierung',
        'Führung eines agilen Teams von 5 Entwicklern',
      ],
    },
    {
      id: 'g-exp-2',
      company: 'Digital Innovation Hub GmbH',
      position: 'Fullstack Web Developer',
      location: 'Berlin',
      startDate: '2019',
      endDate: '2022',
      isCurrent: false,
      summary: 'Entwicklung maßgeschneiderter Webanwendungen.',
      highlights: [
        'Entwicklung von UI-Komponentenbibliotheken für internationale Kunden',
        'Agile Softwareentwicklung nach Scrum',
      ],
    },
  ],
  globalEducation: [
    {
      id: 'g-edu-1',
      institution: 'Technische Universität Berlin',
      degree: 'Master of Science (M.Sc.)',
      fieldOfStudy: 'Informatik & Software Engineering',
      startDate: '2017',
      endDate: '2019',
      description: 'Schwerpunkt: Verteilte Systeme & KI-Architekturen.',
    },
    {
      id: 'g-edu-2',
      institution: 'Hochschule für Angewandte Wissenschaften',
      degree: 'Bachelor of Science (B.Sc.)',
      fieldOfStudy: 'Medieninformatik',
      startDate: '2013',
      endDate: '2017',
      description: 'Abschlussarbeit über Progressive Web Apps.',
    },
  ],
  globalSkillCategories: [
    {
      id: 'g-cat-1',
      category: 'Frontend & Sprachen',
      skills: ['React', 'TypeScript', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'TailwindCSS'],
    },
    {
      id: 'g-cat-2',
      category: 'AI & Backend',
      skills: ['OpenAI API', 'Gemini API', 'Claude API', 'Node.js', 'REST APIs'],
    },
    {
      id: 'g-cat-3',
      category: 'Tools & Methoden',
      skills: ['Git & GitHub', 'Vite', 'Docker', 'Agile / Scrum', 'Clean Architecture'],
    },
  ],
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
