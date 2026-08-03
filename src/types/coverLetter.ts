export interface CoverLetterSender {
  fullName: string;
  title?: string;
  email: string;
  phone: string;
  location: string;
  address?: string;
}

export interface CoverLetterRecipient {
  company: string;
  contactPerson?: string;
  department?: string;
  address?: string;
  zipCity?: string;
}

export interface CoverLetterMeta {
  placeAndDate: string;
  subject: string;
}

export interface CoverLetterContent {
  salutation: string;
  intro: string;
  bodyParagraphs: string[];
  callToAction: string;
  closing: string;
  signatureName: string;
}

export type CoverLetterTemplateId = 'modern_glass' | 'minimal_clean' | 'classic_din';
export type CoverLetterAccentColor = '#6366f1' | '#10b981' | '#06b6d4' | '#8b5cf6' | '#f43f5e' | '#f59e0b';

export interface CoverLetterStyleOptions {
  templateId: CoverLetterTemplateId;
  accentColor: CoverLetterAccentColor;
  fontSize: 'small' | 'medium' | 'large';
}

export interface CoverLetterData {
  sender: CoverLetterSender;
  recipient: CoverLetterRecipient;
  meta: CoverLetterMeta;
  content: CoverLetterContent;
  styleOptions?: CoverLetterStyleOptions;
}

export const DEFAULT_COVER_LETTER_STYLE: CoverLetterStyleOptions = {
  templateId: 'modern_glass',
  accentColor: '#6366f1',
  fontSize: 'medium',
};
