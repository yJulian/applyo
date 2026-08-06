export interface CVHeader {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  address?: string;
  citizenship?: string;
  showCitizenship?: boolean;
  website?: string;
  showWebsite?: boolean;
  github?: string;
  showGithub?: boolean;
  linkedin?: string;
  showLinkedin?: boolean;
  xing?: string;
  showXing?: boolean;
  portfolio?: string;
  showPortfolio?: boolean;
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
  hidden?: boolean;
  // Two-Tier Text Override
  tailoredPosition?: string;
  tailoredSummary?: string;
  tailoredHighlights?: string[];
  activeVersion?: 'global' | 'tailored';
}

export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description?: string;
  hidden?: boolean;
  // Two-Tier Text Override
  tailoredDegree?: string;
  tailoredDescription?: string;
  activeVersion?: 'global' | 'tailored';
}

export interface CVSkillCategory {
  id: string;
  category: string;
  skills: string[];
  hidden?: boolean;
  // Two-Tier Text Override
  tailoredCategory?: string;
  tailoredSkills?: string[];
  activeVersion?: 'global' | 'tailored';
}

export interface CVProject {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  link?: string;
  hidden?: boolean;
  // Two-Tier Text Override
  tailoredTitle?: string;
  tailoredDescription?: string;
  tailoredTechStack?: string[];
  activeVersion?: 'global' | 'tailored';
}

export interface CVData {
  header: CVHeader;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skillCategories: CVSkillCategory[];
  projects: CVProject[];
  languages?: string[];
  styleOptions?: CVStyleOptions;
}

export type CVTemplateId = 'modern_glass' | 'minimal_clean' | 'minimal_clean_briefkopf';

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
