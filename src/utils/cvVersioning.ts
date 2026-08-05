import { CVExperience, CVEducation, CVSkillCategory, CVProject } from '../types/cv';

// Resolve KI-tailored version for CV preview, PDF rendering, and Markdown export.
// The live preview and exported CVs strictly render the KI version (falling back to global baseline if unassigned).
export const getExpPosition = (e: CVExperience) => e.tailoredPosition || e.position;
export const getExpSummary = (e: CVExperience) => e.tailoredSummary || e.summary || '';
export const getExpHighlights = (e: CVExperience) => (e.tailoredHighlights && e.tailoredHighlights.length > 0) ? e.tailoredHighlights : (e.highlights || []);

export const getEduDegree = (e: CVEducation) => e.tailoredDegree || e.degree;
export const getEduDesc = (e: CVEducation) => e.tailoredDescription || e.description || '';

export const getSkillCat = (s: CVSkillCategory) => s.tailoredCategory || s.category;
export const getSkillList = (s: CVSkillCategory) => (s.tailoredSkills && s.tailoredSkills.length > 0) ? s.tailoredSkills : (s.skills || []);

export const getProjTitle = (p: CVProject) => p.tailoredTitle || p.title;
export const getProjDesc = (p: CVProject) => p.tailoredDescription || p.description || '';
export const getProjTech = (p: CVProject) => (p.tailoredTechStack && p.tailoredTechStack.length > 0) ? p.tailoredTechStack : (p.techStack || []);



