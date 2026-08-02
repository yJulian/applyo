import { JobMetadata } from '../types/job';

/**
 * Returns the most recent feedback ISO date string from the stack.
 */
export function getLatestFeedbackDate(job: JobMetadata): string | null {
  if (!job.feedbackHistory || job.feedbackHistory.length === 0) {
    return null;
  }
  return job.feedbackHistory[job.feedbackHistory.length - 1];
}

/**
 * Pushes a new feedback timestamp onto the job's feedbackHistory stack.
 */
export function pushFeedbackTimestamp(job: JobMetadata, dateIsoString: string): JobMetadata {
  const currentStack = job.feedbackHistory || [];
  return {
    ...job,
    feedbackHistory: [...currentStack, dateIsoString],
    updatedDate: new Date().toISOString(),
  };
}

/**
 * Pops the top feedback timestamp from the job's feedbackHistory stack (undo).
 */
export function popFeedbackTimestamp(job: JobMetadata): JobMetadata {
  if (!job.feedbackHistory || job.feedbackHistory.length === 0) {
    return job;
  }
  const newStack = job.feedbackHistory.slice(0, -1);
  return {
    ...job,
    feedbackHistory: newStack,
    updatedDate: new Date().toISOString(),
  };
}

/**
 * Calculates weeks passed since the given ISO date string.
 */
export function getWeeksSince(dateIsoString: string): number {
  const diffMs = Date.now() - new Date(dateIsoString).getTime();
  if (diffMs <= 0) return 0;
  const msInWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diffMs / msInWeek);
}

/**
 * Checks if the feedback timestamp is older than the configured threshold (in weeks).
 */
export function isFeedbackOverdue(dateIsoString: string, thresholdWeeks: number = 6): boolean {
  const weeks = getWeeksSince(dateIsoString);
  return weeks >= thresholdWeeks;
}

/**
 * Formats ISO date string into German local format (e.g. "02.08.2026 16:30").
 */
export function formatFeedbackDate(dateIsoString: string): string {
  try {
    const d = new Date(dateIsoString);
    if (isNaN(d.getTime())) return dateIsoString;
    return d.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateIsoString;
  }
}

export interface FeedbackBadgeInfo {
  hasFeedback: boolean;
  isOverdue: boolean;
  weeksAgo: number;
  formattedDate: string;
  label: string; // Badge display label
  shortLabel: string; // Compact badge display label (for small UI cards)
  bg: string;
  color: string;
  border: string;
}

/**
 * Generates badge presentation properties for a job's latest feedback status.
 */
export function getFeedbackBadgeInfo(
  dateIsoString: string | null,
  thresholdWeeks: number = 6
): FeedbackBadgeInfo | null {
  if (!dateIsoString) return null;

  const overdue = isFeedbackOverdue(dateIsoString, thresholdWeeks);
  const weeksAgo = getWeeksSince(dateIsoString);
  const formattedDate = formatFeedbackDate(dateIsoString);

  if (overdue) {
    return {
      hasFeedback: true,
      isOverdue: true,
      weeksAgo,
      formattedDate,
      label: `⚠️ Lange her (vor ${weeksAgo} Wo. — ${formattedDate})`,
      shortLabel: `⚠️ Lange her (${weeksAgo} Wo.)`,
      bg: 'rgba(239, 68, 68, 0.15)',
      color: '#f87171',
      border: 'rgba(239, 68, 68, 0.4)',
    };
  }

  return {
    hasFeedback: true,
    isOverdue: false,
    weeksAgo,
    formattedDate,
    label: `💬 Rückmeldung: ${formattedDate}`,
    shortLabel: `💬 Rückmeldung: ${formattedDate.split(' ')[0]}`,
    bg: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.4)',
  };
}
