import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  ExternalLink,
  CheckCircle2,
  ListTodo,
  FileText,
  Mail,
  Sparkles,
  Trash2,
  Save,
  MapPin,
  CircleDollarSign,
  Briefcase,
  FolderOpen,
  Upload,
  FileCode,
  File,
  Eye,
  Folder,
  Plus,
  Wand2,
  Clock,
  Calendar,
  RotateCcw,
  CalendarPlus,
  Star,
  Tag,
  X,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import {
  JobMetadata,
  JobFile,
  ApplicationStatus,
  getStatusMeta,
  getExperienceMeta,
  STATUS_LABELS,
  CardSectionConfig,
  DEFAULT_CARD_SECTIONS,
} from '../types/job';
import { fileSystemService } from '../services/storage/fileSystem';
import { aiService } from '../services/ai/aiService';
import { MarkdownModal } from './MarkdownModal';
import {
  getLatestFeedbackDate,
  pushFeedbackTimestamp,
  popFeedbackTimestamp,
  getFeedbackBadgeInfo,
  getTimeAgo,
} from '../utils/feedback';

interface JobDetailViewProps {
  job: JobMetadata | null;
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
  onUpdateJob: (updated: JobMetadata) => void;
  onDeleteJob: (job: JobMetadata) => void;
  onArchiveJob?: (job: JobMetadata) => void;
  onOpenAIAssistant: () => void;
  onOpenCVEditor?: () => void;
  onOpenCoverLetterEditor?: () => void;
  feedbackThresholdWeeks?: number;
  cardLayoutConfig?: CardSectionConfig[];
}

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  currentDirName,
  needsPermission,
  onSelectDirectory,
  onGrantPermission,
  onUpdateJob,
  onDeleteJob,
  onArchiveJob,
  onOpenAIAssistant: _onOpenAIAssistant,
  onOpenCVEditor,
  onOpenCoverLetterEditor,
  feedbackThresholdWeeks = 6,
  cardLayoutConfig,
}) => {
  const { t, i18n } = useTranslation();
  const [notes, setNotes] = useState(job?.notes || '');
  const [isSavedNotes, setIsSavedNotes] = useState(false);
  const [files, setFiles] = useState<JobFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Markdown Viewer / Editor Modal State
  const [selectedMdFile, setSelectedMdFile] = useState<string | null>(null);
  const [isMdModalOpen, setIsMdModalOpen] = useState<boolean>(false);

  // Feedback tracking state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');

  // Custom Tag Input state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadJobFiles = useCallback(async () => {
    if (!job) return;
    setIsLoadingFiles(true);
    const loadedFiles = await fileSystemService.listJobFiles(job);
    setFiles(loadedFiles.filter((f) => f.name.toLowerCase() !== 'metadata.json'));
    setIsLoadingFiles(false);
  }, [job]);

  useEffect(() => {
    if (!job) return;
    setNotes(job.notes || '');
    setIsSavedNotes(false);
    loadJobFiles();
  }, [job, loadJobFiles]);

  if (!job) {
    if (needsPermission && currentDirName) {
      return (
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
          <div className="glass-panel" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', textAlign: 'center', maxWidth: '460px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            <Folder size={56} color="#f59e0b" style={{ opacity: 0.8, marginBottom: '20px' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', color: '#f59e0b' }}>{t('sidebar.grant_title')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
              {t('sidebar.grant_desc', { name: currentDirName })}
            </p>
            <button
              onClick={onGrantPermission}
              className="btn"
              style={{
                width: '100%',
                gap: '10px',
                padding: '12px',
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Folder size={18} />
              <span>{t('sidebar.grant_btn')}</span>
            </button>
          </div>
        </main>
      );
    }

    if (!currentDirName) {
      return (
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
          <div className="glass-panel" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', textAlign: 'center', maxWidth: '460px' }}>
            <Folder size={56} color="var(--accent-primary)" style={{ opacity: 0.6, marginBottom: '20px' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>{t('board.no_folder_title')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
              {t('board.no_folder_desc')}
            </p>
            <button onClick={onSelectDirectory} className="btn btn-primary" style={{ width: '100%', gap: '10px', padding: '12px', fontSize: '0.95rem' }}>
              <Folder size={18} />
              <span>{t('sidebar.select_folder_btn')}</span>
            </button>
          </div>
        </main>
      );
    }

    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
        <div className="glass-panel" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', textAlign: 'center', maxWidth: '420px' }}>
          <Briefcase size={54} color="var(--accent-primary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{t('job_detail.no_job_selected')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {t('job_detail.no_job_desc')}
          </p>
        </div>
      </main>
    );
  }

  const latestFeedback = getLatestFeedbackDate(job);
  const feedbackBadge = getFeedbackBadgeInfo(latestFeedback, feedbackThresholdWeeks, t, i18n.language);

  const handleSetFeedbackToday = () => {
    const updated = pushFeedbackTimestamp(job, new Date().toISOString());
    onUpdateJob(updated);
  };

  const handleSetCustomFeedback = () => {
    if (!customDateTime) return;
    const isoDate = new Date(customDateTime).toISOString();
    const updated = pushFeedbackTimestamp(job, isoDate);
    onUpdateJob(updated);
    setShowDatePicker(false);
    setCustomDateTime('');
  };

  const handleUndoFeedback = () => {
    const updated = popFeedbackTimestamp(job);
    onUpdateJob(updated);
  };


  const handleStatusChange = (newStatus: ApplicationStatus) => {
    onUpdateJob({
      ...job,
      status: newStatus,
      updatedDate: new Date().toISOString(),
    });
  };

  const handleSaveNotes = () => {
    onUpdateJob({
      ...job,
      notes,
      updatedDate: new Date().toISOString(),
    });
    setIsSavedNotes(true);
    setTimeout(() => setIsSavedNotes(false), 2000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      await fileSystemService.addJobFile(job, file);
    }

    loadJobFiles();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      await fileSystemService.addJobFile(job, file);
    }
    loadJobFiles();
  };

  const handleOpenFile = async (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    // If opening Anschreiben.json, open in CoverLetterEditorModal
    if (fileName === 'Anschreiben.json' || fileName.toLowerCase().includes('anschreiben') && ext === 'json') {
      if (onOpenCoverLetterEditor) {
        onOpenCoverLetterEditor();
        return;
      }
    }

    // If opening Lebenslauf.json or a CV json file, open in CVEditorModal
    if (fileName === 'Lebenslauf.json' || (ext === 'json' && !fileName.toLowerCase().includes('anschreiben'))) {
      if (onOpenCVEditor) {
        onOpenCVEditor();
        return;
      }
    }

    if (ext === 'md' || ext === 'txt') {
      setSelectedMdFile(fileName);
      setIsMdModalOpen(true);
      return;
    }

    const url = await fileSystemService.getJobFileUrl(job, fileName);
    if (url) {
      window.open(url, '_blank');
    } else {
      aiService.notifyUser('Datei konnte nicht geöffnet werden.');
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (confirm(`Datei "${fileName}" aus dem Ordner löschen?`)) {
      await fileSystemService.deleteJobFile(job, fileName);
      loadJobFiles();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    if (fileName === 'Lebenslauf.json') {
      return <FileText size={18} color="#34d399" />;
    }
    if (fileName === 'Anschreiben.json') {
      return <Mail size={18} color="#818cf8" />;
    }
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText size={18} color="#f87171" />;
    if (ext === 'docx' || ext === 'doc') return <FileText size={18} color="#60a5fa" />;
    if (ext === 'md') return <FileText size={18} color="#34d399" />;
    if (ext === 'json') return <FileCode size={18} color="#fbbf24" />;
    return <File size={18} color="var(--text-muted)" />;
  };

  const statusMeta = getStatusMeta(job.status, t);
  const expMeta = getExperienceMeta(job.experienceLevel, t);

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Card */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
          {/* Top-Right Action Buttons: Archive & Delete */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px' }}>
            {onArchiveJob && (
              <button
                onClick={() => onArchiveJob(job)}
                className="btn-icon"
                style={{
                  color: '#94a3b8',
                  borderColor: 'var(--border-color)',
                  background: 'rgba(255,255,255,0.03)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#fbbf24';
                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
                title={job.archived ? t('job_detail.unarchive_job') : t('job_detail.archive_job')}
              >
                {job.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
              </button>
            )}
            <button
              onClick={() => onDeleteJob(job)}
              className="btn-icon"
              style={{
                color: '#94a3b8',
                borderColor: 'var(--border-color)',
                background: 'rgba(255,255,255,0.03)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f87171';
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)';
                e.currentTarget.style.background = 'rgba(248, 113, 113, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              title="Bewerbung löschen"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ paddingRight: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.95rem' }}>
                  <Building2 size={18} />
                  {job.company}
                </span>
                {job.archived && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '2px 8px', borderRadius: '8px' }}>
                    <Archive size={11} />
                    {t('job_detail.archived_badge')}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '8px' }}>
                  <Clock size={12} />
                  {latestFeedback
                    ? t('job_detail.last_info_received', { time: getTimeAgo(latestFeedback, t).label })
                    : t('job_detail.last_info_none')}
                  <button
                    onClick={handleSetFeedbackToday}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: '5px', lineHeight: 1.6 }}
                    title={t('job_detail.mark_now')}
                  >
                    {t('job_detail.mark_now')}
                  </button>
                </span>
              </div>

              <h1 style={{ fontSize: '1.8rem', lineHeight: 1.2, marginBottom: '14px' }}>{job.title}</h1>

              {/* Unified Header Tags Bar (All tags share exact uniform 28px height, 1px border, 0 12px padding) */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {/* Status Selector Tag */}
                <select
                  value={job.status}
                  onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                  className="badge"
                  style={{
                    padding: '0 24px 0 12px',
                    backgroundColor: statusMeta.bg,
                    color: statusMeta.color,
                    border: `1px solid ${statusMeta.color}`,
                    outline: 'none',
                    cursor: 'pointer',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='${encodeURIComponent(statusMeta.color)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m1 1 4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                  }}
                >
                  {Object.entries(STATUS_LABELS).map(([key, meta]) => (
                    <option key={key} value={key}>
                      Status: {meta.label}
                    </option>
                  ))}
                </select>

                {/* Personal Rating Tag (Sterne 1-5) */}
                <span
                  className="badge"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                  }}
                  title="Persönliche Rangliste (Sterne anklicken)"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={13}
                      fill={(job.personalRating || 0) >= star ? '#fbbf24' : 'transparent'}
                      color="#fbbf24"
                      onClick={() => {
                        onUpdateJob({ ...job, personalRating: star });
                      }}
                      style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                    />
                  ))}
                  <span style={{ fontSize: '0.7rem', marginLeft: '2px', fontWeight: 700 }}>
                    {job.personalRating ? `${job.personalRating}/5` : 'Rang'}
                  </span>
                </span>

                {/* Prior Knowledge Level Tag (0-9 Scale) */}
                {(() => {
                  const level = job.priorKnowledgeLevel;
                  let bg = 'rgba(255, 255, 255, 0.04)';
                  let color = 'var(--text-muted)';
                  let border = 'var(--border-color)';

                  if (level === 0) {
                    bg = 'rgba(52, 211, 153, 0.12)';
                    color = '#34d399';
                    border = 'rgba(52, 211, 153, 0.3)';
                  } else if (level !== undefined && level !== null && level >= 8) {
                    bg = 'rgba(244, 63, 94, 0.15)';
                    color = '#fb7185';
                    border = 'rgba(244, 63, 94, 0.4)';
                  } else if (level !== undefined && level !== null) {
                    bg = 'rgba(6, 182, 212, 0.12)';
                    color = '#38bdf8';
                    border = 'rgba(6, 182, 212, 0.3)';
                  }

                  return (
                    <select
                      value={level ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== '') {
                          const newLvl = parseInt(val, 10);
                          onUpdateJob({
                            ...job,
                            priorKnowledgeLevel: newLvl,
                            requiresWorkExperience: newLvl >= 8,
                          });
                        }
                      }}
                      className="badge"
                      style={{
                        padding: '0 24px 0 12px',
                        backgroundColor: bg,
                        color: color,
                        border: `1px solid ${border}`,
                        outline: 'none',
                        cursor: 'pointer',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='${encodeURIComponent(color)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m1 1 4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                      }}
                      title="Vorwissen-Skala: 0 (Nichts), 1-7 (Skills/Vorkenntnisse), 8-9 (Zwingend Firmen-Arbeitserfahrung)"
                    >
                      <option value="">🧠 Vorwissen: k.A. / Einstufen...</option>
                      <option value={0}>🧠 Vorwissen: 0/9 (Keine Vorkenntnisse)</option>
                      {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          🧠 Vorwissen: {lvl}/9 (Skills & Vorkenntnisse)
                        </option>
                      ))}
                      <option value={8}>🧠 Vorwissen: 8/9 (Firmen-Erfahrung gefordert)</option>
                      <option value={9}>🧠 Vorwissen: 9/9 (Experte & Firmen-Erfahrung)</option>
                    </select>
                  );
                })()}

                {/* Experience Level Tag */}
                <span
                  className="badge"
                  style={{
                    background: expMeta.bg,
                    color: expMeta.color,
                    border: `1px solid ${expMeta.borderColor}`,
                  }}
                >
                  {expMeta.entryBadge}
                </span>

                {/* Location Tag */}
                {job.location && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.location} ${job.company}`.trim())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="badge"
                    style={{
                      color: 'var(--accent-cyan)',
                      textDecoration: 'none',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                    title={`In Google Maps öffnen: ${job.location} (${job.company})`}
                  >
                    <MapPin size={13} color="var(--accent-cyan)" />
                    <span>{job.location}</span>
                    <ExternalLink size={11} style={{ opacity: 0.7 }} />
                  </a>
                )}

                {/* Salary Tag */}
                {job.salary && (
                  <span
                    className="badge"
                    style={{
                      color: 'var(--accent-emerald)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <CircleDollarSign size={13} />
                    <span>{job.salary}</span>
                  </span>
                )}

                {/* Feedback Badge Tag */}
                {feedbackBadge && (
                  <span
                    className="badge"
                    style={{
                      background: feedbackBadge.bg,
                      color: feedbackBadge.color,
                      border: `1px solid ${feedbackBadge.border}`,
                    }}
                  >
                    <Clock size={13} />
                    {feedbackBadge.label}
                  </span>
                )}

                {/* Custom Tags */}
                {(job.customTags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="badge"
                    style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#c084fc',
                      border: '1px solid rgba(192, 132, 252, 0.3)',
                    }}
                  >
                    <Tag size={11} />
                    <span>{tag}</span>
                    <X
                      size={12}
                      style={{ cursor: 'pointer', marginLeft: '2px', opacity: 0.8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTags = (job.customTags || []).filter((_, i) => i !== idx);
                        onUpdateJob({ ...job, customTags: newTags });
                      }}
                    />
                  </span>
                ))}

                {/* Add Custom Tag Input / Button */}
                {isAddingTag ? (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Tag..."
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTagText.trim()) {
                        onUpdateJob({
                          ...job,
                          customTags: [...(job.customTags || []), newTagText.trim()],
                        });
                        setNewTagText('');
                        setIsAddingTag(false);
                      } else if (e.key === 'Escape') {
                        setIsAddingTag(false);
                        setNewTagText('');
                      }
                    }}
                    onBlur={() => {
                      if (newTagText.trim()) {
                        onUpdateJob({
                          ...job,
                          customTags: [...(job.customTags || []), newTagText.trim()],
                        });
                      }
                      setNewTagText('');
                      setIsAddingTag(false);
                    }}
                    className="badge"
                    style={{
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--accent-primary)',
                      outline: 'none',
                      width: '90px',
                      padding: '0 8px',
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="badge"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-muted)',
                      border: '1px dashed var(--border-color)',
                      cursor: 'pointer',
                    }}
                    title="Eigenen Tag hinzufügen"
                  >
                    <Plus size={12} />
                    <span>Tag</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions (e.g. LinkedIn / External URL) */}
            {job.url && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ gap: '6px', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={15} />
                  <span>LinkedIn / Link</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Card Sections based on cardLayoutConfig */}
        {(cardLayoutConfig || DEFAULT_CARD_SECTIONS)
          .filter((section) => section.visible)
          .map((section) => {
            switch (section.id) {
              case 'feedback':
                return (
                  <div
                    key="feedback"
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={18} color="var(--accent-cyan)" />
                          {t('card_sections.feedback')}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          {feedbackBadge ? (
                            <span
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: feedbackBadge.bg,
                                color: feedbackBadge.color,
                                border: `1px solid ${feedbackBadge.border}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              {feedbackBadge.label}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {t('job_detail.no_feedback_yet')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Today, Datetime Picker, Undo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={handleSetFeedbackToday}
                          className="btn btn-primary"
                          style={{ gap: '6px', fontSize: '0.825rem', padding: '8px 14px' }}
                          title={t('job_detail.feedback_today')}
                        >
                          <Calendar size={15} />
                          <span>{t('job_detail.feedback_today')}</span>
                        </button>

                        <button
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className="btn btn-secondary"
                          style={{ gap: '6px', fontSize: '0.825rem', padding: '8px 14px' }}
                          title={t('job_detail.pick_datetime')}
                        >
                          <CalendarPlus size={15} color="var(--accent-cyan)" />
                          <span>{t('job_detail.pick_datetime')}</span>
                        </button>

                        {job.feedbackHistory && job.feedbackHistory.length > 0 && (
                          <button
                            onClick={handleUndoFeedback}
                            className="btn btn-secondary"
                            style={{ gap: '4px', fontSize: '0.825rem', padding: '8px 12px', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }}
                            title={t('job_detail.undo_feedback')}
                          >
                            <RotateCcw size={14} />
                            <span>{t('job_detail.undo_feedback')}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Custom Date & Time Picker Popover/Inline Input */}
                    {showDatePicker && (
                      <div
                        style={{
                          marginTop: '14px',
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid var(--accent-cyan)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {t('job_detail.pick_datetime')}:
                        </label>
                        <input
                          type="datetime-local"
                          className="input-field"
                          style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                          value={customDateTime}
                          onChange={(e) => setCustomDateTime(e.target.value)}
                        />
                        <button
                          onClick={handleSetCustomFeedback}
                          disabled={!customDateTime}
                          className="btn btn-primary"
                          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                        >
                          {t('add_modal.save')}
                        </button>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          {t('add_modal.cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                );

              case 'tailored_cv':
                return (
                  <div
                    key="tailored_cv"
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Wand2 size={18} color="#34d399" />
                          {t('job_detail.ai_documents_title')}
                        </h3>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '620px' }}>
                          {t('job_detail.ai_documents_desc')}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={onOpenCVEditor}
                          className="btn btn-primary"
                          style={{
                            gap: '8px',
                            fontSize: '0.825rem',
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          }}
                        >
                          <Sparkles size={16} />
                          <span>📄 {t('job_detail.cv_editor')}</span>
                        </button>

                        <button
                          onClick={onOpenCoverLetterEditor}
                          className="btn btn-primary"
                          style={{
                            gap: '8px',
                            fontSize: '0.825rem',
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          }}
                        >
                          <Sparkles size={16} />
                          <span>✉️ {t('job_detail.cover_letter_editor')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );

              case 'documents':
                return (
                  <div
                    key="documents"
                    className="glass-panel"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      border: isDraggingOver ? '2px dashed var(--accent-cyan)' : '1px solid var(--border-color)',
                      background: isDraggingOver ? 'rgba(6, 182, 212, 0.12)' : undefined,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FolderOpen size={18} color="var(--accent-cyan)" />
                          {t('card_sections.documents')}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t('job_detail.drag_files_here')}
                        </span>
                      </div>

                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          multiple
                          style={{ display: 'none' }}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-secondary"
                          style={{ gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          <Plus size={15} color="var(--accent-cyan)" />
                          <span>{t('job_detail.add_document')}</span>
                        </button>
                      </div>
                    </div>

                    {isLoadingFiles ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('job_detail.loading_files')}</p>
                    ) : files.length === 0 ? (
                      <div
                        style={{
                          padding: '24px',
                          textAlign: 'center',
                          border: '2px dashed var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-muted)',
                          background: isDraggingOver ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255,255,255,0.01)',
                        }}
                      >
                        <Upload size={28} style={{ marginBottom: '8px', opacity: 0.6, color: 'var(--accent-cyan)' }} />
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {isDraggingOver ? t('job_detail.drop_file_now') : t('job_detail.drag_drop_hint')}
                        </p>
                        <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                          {t('job_detail.drag_drop_subhint')}
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[...files]
                          .sort((a, b) => {
                            const isCV_A = a.name === 'Lebenslauf.json';
                            const isCL_A = a.name === 'Anschreiben.json';
                            const isSpecialA = isCV_A || isCL_A;

                            const isCV_B = b.name === 'Lebenslauf.json';
                            const isCL_B = b.name === 'Anschreiben.json';
                            const isSpecialB = isCV_B || isCL_B;

                            if (isSpecialA && !isSpecialB) return -1;
                            if (!isSpecialA && isSpecialB) return 1;
                            if (isCV_A && isCL_B) return -1;
                            if (isCL_A && isCV_B) return 1;
                            return a.name.localeCompare(b.name);
                          })
                          .map((file) => {
                            const isCVFile = file.name === 'Lebenslauf.json';
                            const isCLFile = file.name === 'Anschreiben.json';
                            const isSpecialFile = isCVFile || isCLFile;

                            const highlightColor = isCVFile ? '#34d399' : isCLFile ? '#818cf8' : undefined;
                            const highlightBg = isCVFile
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
                              : isCLFile
                              ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.12) 0%, rgba(192, 132, 252, 0.08) 100%)'
                              : 'rgba(255,255,255,0.03)';
                            const highlightBorder = isCVFile
                              ? '1px solid rgba(16, 185, 129, 0.6)'
                              : isCLFile
                              ? '1px solid rgba(129, 140, 248, 0.6)'
                              : '1px solid var(--border-color)';
                            const highlightShadow = isCVFile
                              ? '0 0 16px rgba(16, 185, 129, 0.25)'
                              : isCLFile
                              ? '0 0 16px rgba(129, 140, 248, 0.25)'
                              : 'none';

                            const displayName = isCVFile
                              ? t('nav.cv_editor')
                              : isCLFile
                              ? t('nav.cover_letter_editor')
                              : file.name;

                            return (
                              <div
                                key={file.name}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 14px',
                                  background: highlightBg,
                                  borderRadius: 'var(--radius-md)',
                                  border: highlightBorder,
                                  boxShadow: highlightShadow,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {getFileIcon(file.name)}
                                  <div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: isSpecialFile ? 700 : 600, color: highlightColor || 'var(--text-main)', display: 'block' }}>
                                      {displayName}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                      {formatFileSize(file.size)} • {t('job_detail.updated')}: {new Date(file.lastModified).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => handleOpenFile(file.name)}
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '0.75rem',
                                      gap: '4px',
                                      borderColor: highlightColor ? `${highlightColor}80` : undefined,
                                      color: highlightColor || undefined,
                                    }}
                                    title="In Applyo ansehen oder bearbeiten"
                                  >
                                    <Eye size={13} color={highlightColor || undefined} />
                                    <span>{isSpecialFile ? t('job_detail.open_in_editor') : file.name.endsWith('.md') || file.name.endsWith('.txt') ? t('job_detail.view_edit') : t('job_detail.open_file')}</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteFile(file.name)}
                                    className="btn-icon"
                                    style={{ width: '28px', height: '28px', color: '#f87171' }}
                                    title={t('job_detail.delete_job')}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );

              case 'summary':
                if (!job.summary) return null;
                return (
                  <div key="summary" className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '1rem', color: '#a5b4fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} color="var(--accent-primary)" />
                      {t('card_sections.summary')}
                    </h3>
                    <p style={{ color: 'var(--text-main)', lineHeight: 1.6, fontSize: '0.925rem' }}>{job.summary}</p>
                  </div>
                );

              case 'experience_check':
                return (
                  <div
                    key="experience_check"
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      background: job.requiresWorkExperience
                        ? 'rgba(244, 63, 94, 0.08)'
                        : 'rgba(52, 211, 153, 0.08)',
                      border: job.requiresWorkExperience
                        ? '1px solid rgba(244, 63, 94, 0.3)'
                        : '1px solid rgba(52, 211, 153, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            minWidth: '42px',
                            minHeight: '42px',
                            flexShrink: 0,
                            borderRadius: '50%',
                            background: job.requiresWorkExperience ? 'rgba(244, 63, 94, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                            border: job.requiresWorkExperience ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(52, 211, 153, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {job.requiresWorkExperience ? (
                            <Building2 size={20} color="#fb7185" />
                          ) : (
                            <CheckCircle2 size={20} color="#34d399" />
                          )}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', color: job.requiresWorkExperience ? '#fb7185' : '#34d399' }}>
                            {job.requiresWorkExperience
                              ? t('job_detail.experience_req_title')
                              : t('job_detail.experience_junior_title')}
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {job.experienceDetails || expMeta.label}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`badge ${expMeta.tagClass}`}
                        style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                      >
                        {expMeta.entryBadge}
                      </span>
                    </div>
                  </div>
                );

              case 'tasks_requirements':
                return (
                  <div key="tasks_requirements" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                    {/* Tasks Card */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ fontSize: '1rem', color: '#818cf8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ListTodo size={18} color="#818cf8" />
                        {t('job_detail.tasks_header')}
                      </h3>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {job.tasks && job.tasks.length > 0 ? (
                          job.tasks.map((task, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                              <span style={{ color: '#818cf8', marginTop: '2px' }}>•</span>
                              <span>{task}</span>
                            </li>
                          ))
                        ) : (
                          <li style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{t('job_detail.no_tasks')}</li>
                        )}
                      </ul>
                    </div>

                    {/* Requirements Card */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ fontSize: '1rem', color: '#34d399', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} color="#34d399" />
                        {t('job_detail.req_header')}
                      </h3>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {job.requirements && job.requirements.length > 0 ? (
                          job.requirements.map((req, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                              <span style={{ color: '#34d399', marginTop: '2px' }}>✓</span>
                              <span>{req}</span>
                            </li>
                          ))
                        ) : (
                          <li style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{t('job_detail.no_reqs')}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                );

              case 'benefits':
                if (!job.benefits || job.benefits.length === 0) return null;
                return (
                  <div key="benefits" className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '10px' }}>{t('job_detail.benefits_header')}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {job.benefits.map((b, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(251, 191, 36, 0.1)',
                            color: '#fbbf24',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            border: '1px solid rgba(251, 191, 36, 0.2)',
                          }}
                        >
                          ✨ {b}
                        </span>
                      ))}
                    </div>
                  </div>
                );

              case 'notes':
                return (
                  <div key="notes" className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{t('job_detail.notes_header')}</h3>
                      <button onClick={handleSaveNotes} className="btn btn-secondary" style={{ gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Save size={14} color={isSavedNotes ? '#34d399' : undefined} />
                        <span>{isSavedNotes ? t('job_detail.notes_saved') : t('job_detail.save_notes')}</span>
                      </button>
                    </div>
                    <textarea
                      className="input-field"
                      rows={5}
                      placeholder={t('job_detail.notes_placeholder')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ resize: 'vertical', lineHeight: 1.5 }}
                    />
                  </div>
                );

              default:
                return null;
            }
          })}
      </div>

      {/* In-UI Markdown Viewer & Editor Modal */}
      <MarkdownModal
        isOpen={isMdModalOpen}
        onClose={() => setIsMdModalOpen(false)}
        job={job}
        fileName={selectedMdFile}
        onFileSaved={() => loadJobFiles()}
      />
    </main>
  );
};
