import { CoverLetterData, DEFAULT_COVER_LETTER_STYLE } from '../../types/coverLetter';
import { UserProfile } from '../storage/profileService';
import { JobMetadata } from '../../types/job';

export function buildFallbackCoverLetter(userProfile: UserProfile, job: JobMetadata | null): CoverLetterData {
  const dateStr = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  const location = userProfile.location || 'Deutschland';
  const company = job ? job.company : 'Ihr Unternehmen';
  const title = job ? job.title : 'die ausgeschriebene Position';

  return {
    sender: {
      fullName: userProfile.fullName || 'Bewerber',
      title: 'Softwareentwickler & IT-Spezialist',
      email: userProfile.email || 'bewerber@example.com',
      phone: userProfile.phone || '+49 170 1234567',
      location: userProfile.location || 'Deutschland',
    },
    recipient: {
      company: company,
      department: 'Personalabteilung / Recruiting',
      contactPerson: 'Sehr geehrte Damen und Herren',
      zipCity: job?.location || 'Deutschland',
    },
    meta: {
      placeAndDate: `${location}, den ${dateStr}`,
      subject: `Bewerbung als ${title}`,
    },
    content: {
      salutation: 'Sehr geehrte Damen und Herren,',
      intro: `mit großem Interesse bewerbe ich mich hiermit um die Position als ${title} bei ${company}. Als erfahrener Entwickler bringt mein Werdegang genau die geforderten Qualifikationen mit, um Ihre Projekte erfolgreich zu unterstützen.`,
      bodyParagraphs: [
        `In meiner bisherigen beruflichen Praxis habe ich fundierte Kenntnisse im Bereich der modernen Softwareentwicklung und IT-Architekturen aufgebaut. Die in Ihrer Stellenausschreibung genannten Aufgaben — insbesondere ${job?.tasks?.[0] || 'die Umsetzung anspruchsvoller Projekte'} — entsprechen genau meinen Stärken und Interessen.`,
        `Durch meine strukturierte Arbeitsweise, meine Leidenschaft für sauberen Code sowie meine Erfahrung in agilen Teams kann ich vom ersten Tag an einen nachhaltigen Mehrwert für ${company} schaffen.`,
      ],
      callToAction: `Über eine Gelegenheit, mich Ihnen in einem persönlichen Gespräch vorzustellen und meine Motivation näher zu erläutern, freue ich mich sehr.`,
      closing: 'Mit freundlichen Grüßen,',
      signatureName: userProfile.fullName || 'Bewerber',
    },
    styleOptions: DEFAULT_COVER_LETTER_STYLE,
  };
}
