export interface CVHeader {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  github?: string;
  linkedin?: string;
}

export interface CVExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  summary?: string;
  highlights: string[];
}

export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface CVSkillCategory {
  id: string;
  category: string;
  skills: string[];
}

export interface CVProject {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  link?: string;
}

export interface CVData {
  header: CVHeader;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skillCategories: CVSkillCategory[];
  projects: CVProject[];
  languages?: string[];
}

export type CVTemplateId = 'modern_glass' | 'minimal_clean' | 'tech_slate' | 'classic_executive';

export type CVAccentColor = '#6366f1' | '#10b981' | '#06b6d4' | '#8b5cf6' | '#f43f5e' | '#f59e0b';

export interface CVStyleOptions {
  templateId: CVTemplateId;
  accentColor: CVAccentColor;
  fontSize: 'small' | 'medium' | 'large';
  showProjects: boolean;
}

export const DEFAULT_CV_STYLE: CVStyleOptions = {
  templateId: 'modern_glass',
  accentColor: '#6366f1',
  fontSize: 'medium',
  showProjects: true,
};
