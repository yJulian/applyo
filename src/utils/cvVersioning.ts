import { CVExperience, CVEducation, CVSkillCategory, CVProject } from '../types/cv';

// Resolve 2-tier text (Global vs. KI-angepasst/Tailored) for CV items.
export const getExpPosition = (e: CVExperience) => e.activeVersion === 'global' ? e.position : (e.tailoredPosition || e.position);
export const getExpSummary = (e: CVExperience) => e.activeVersion === 'global' ? e.summary : (e.tailoredSummary || e.summary);
export const getExpHighlights = (e: CVExperience) => e.activeVersion === 'global' ? e.highlights : (e.tailoredHighlights || e.highlights);

export const getEduDegree = (e: CVEducation) => e.activeVersion === 'global' ? e.degree : (e.tailoredDegree || e.degree);
export const getEduDesc = (e: CVEducation) => e.activeVersion === 'global' ? e.description : (e.tailoredDescription || e.description);

export const getSkillCat = (s: CVSkillCategory) => s.activeVersion === 'global' ? s.category : (s.tailoredCategory || s.category);
export const getSkillList = (s: CVSkillCategory) => s.activeVersion === 'global' ? s.skills : (s.tailoredSkills || s.skills);

export const getProjTitle = (p: CVProject) => p.activeVersion === 'global' ? p.title : (p.tailoredTitle || p.title);
export const getProjDesc = (p: CVProject) => p.activeVersion === 'global' ? p.description : (p.tailoredDescription || p.description);
export const getProjTech = (p: CVProject) => p.activeVersion === 'global' ? p.techStack : (p.tailoredTechStack || p.techStack);
