import { UserProfile } from '../storage/profileService';
import { JobMetadata } from '../../types/job';
import { CVData } from '../../types/cv';

export function buildFallbackCV(profile: UserProfile, job: JobMetadata | null): CVData {
  const name = profile.fullName || 'Dein Name';
  const jobTitle = job ? job.title : 'Softwareentwickler / Spezialist';
  const company = job ? job.company : 'Unternehmen';

  // Extract skills or highlights from profile description
  const desc = profile.markdownDescription || '';
  const skillsList: string[] = [];

  const skillMatches = desc.match(/- (.*)/g);
  if (skillMatches) {
    skillMatches.forEach((s) => {
      const clean = s.replace(/^- /, '').trim();
      if (clean.length < 40 && !clean.includes('##')) {
        skillsList.push(clean);
      }
    });
  }

  const defaultSkills = skillsList.length > 0 ? skillsList : [
    'React & TypeScript',
    'Moderne Webarchitektur & PWA',
    'KI & API Integration',
    'Git, CI/CD & Agile Entwicklung',
  ];

  return {
    header: {
      fullName: name,
      title: jobTitle,
      email: profile.email || 'kontakt@beispiel.de',
      phone: profile.phone || '+49 170 1234567',
      location: profile.location || 'Deutschland',
      address: profile.address || '',
      citizenship: profile.citizenship || '',
      showCitizenship: Boolean(profile.citizenship),
      linkedin: profile.linkedin || '',
      showLinkedin: Boolean(profile.linkedin),
      github: profile.github || '',
      showGithub: Boolean(profile.github),
      xing: profile.xing || '',
      showXing: Boolean(profile.xing),
      website: profile.website || '',
      showWebsite: Boolean(profile.website),
    },
    summary: job
      ? `Zielgerichteter und engagierter Fachspezifiker mit Schwerpunkt auf ${job.title}. Fundierte Kenntnisse in der Umsetzung moderner Projekte mit Fokus auf Qualität und Effizienz bei ${company}.`
      : 'Erfahrener Softwareentwickler mit Leidenschaft für moderne Webanwendungen, sauberen Code und innovative KI-Lösungen.',
    experiences: (profile.globalExperiences && profile.globalExperiences.length > 0)
      ? profile.globalExperiences.map((exp) => ({ ...exp, activeVersion: exp.activeVersion || 'global' }))
      : [
          {
            id: 'exp-1',
            company: 'Innovatives Tech-Unternehmen',
            position: 'Senior Software Engineer / Frontend Lead',
            location: 'Deutschland (Remote)',
            startDate: '2022',
            endDate: 'Heute',
            isCurrent: true,
            summary: 'Verantwortlich für die Architektur und Weiterentwicklung modernster Webanwendungen.',
            highlights: [
              'Konzeption und Umsetzung von performanten React/TypeScript PWAs mit Offline-First Architektur',
              'Integration von KI-Schnittstellen (OpenAI & Gemini API) zur Automatisierung von Arbeitsabläufen',
              'Optimierung der Render-Performance und Erhöhung der Testabdeckung um 35%',
            ],
            activeVersion: 'global',
          },
          {
            id: 'exp-2',
            company: 'Digitalagentur Solutions GmbH',
            position: 'Fullstack Web Developer',
            location: 'Berlin',
            startDate: '2019',
            endDate: '2022',
            isCurrent: false,
            summary: 'Entwicklung maßgeschneiderter Webseiten und Kundenportale.',
            highlights: [
              'Entwicklung von wiederverwendbaren UI-Komponentenbibliotheken für internationale Kunden',
              'Zusammenarbeit in agilen Scrum-Teams mit 2-Wochen-Sprints',
            ],
            activeVersion: 'global',
          },
        ],
    education: (profile.globalEducation && profile.globalEducation.length > 0)
      ? profile.globalEducation.map((edu) => ({ ...edu, activeVersion: edu.activeVersion || 'global' }))
      : [
          {
            id: 'edu-1',
            institution: 'Technische Universität / Hochschule',
            degree: 'Bachelor of Science (B.Sc.)',
            fieldOfStudy: 'Informatik / Angewandte Medieninformatik',
            startDate: '2015',
            endDate: '2019',
            description: 'Schwerpunkte: Software Engineering, Datenbanken & Web-Technologien.',
            activeVersion: 'global',
          },
        ],
    skillCategories: (profile.globalSkillCategories && profile.globalSkillCategories.length > 0)
      ? profile.globalSkillCategories.map((cat) => ({ ...cat, activeVersion: cat.activeVersion || 'global' }))
      : [
          {
            id: 'cat-1',
            category: 'Kernkompetenzen & Tech-Stack',
            skills: defaultSkills,
            activeVersion: 'global',
          },
          {
            id: 'cat-2',
            category: 'Methoden & Tools',
            skills: ['Agile / Scrum', 'Git & GitHub Workflows', 'Clean Architecture', 'REST APIs & GraphQL'],
            activeVersion: 'global',
          },
        ],
    projects: (profile.globalProjects && profile.globalProjects.length > 0)
      ? profile.globalProjects.map((proj) => ({ ...proj, activeVersion: proj.activeVersion || 'global' }))
      : [
          {
            id: 'proj-1',
            title: 'Applyo - Smart Application Workspace',
            description: 'Lokale Progressive Web Application zur Bewerbungsverwaltung mit Ordner-Sync und KI-Assistent.',
            techStack: ['React', 'TypeScript', 'Vite', 'FileSystem API'],
            activeVersion: 'global',
          },
        ],
    languages: ['Deutsch (Muttersprache)', 'Englisch (Fließend in Wort & Schrift)'],
  };
}
