import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  MapPin,
  CircleDollarSign,
  GripVertical,
  Folder,
  Unlock,
  X,
} from 'lucide-react';
import {
  JobMetadata,
  ApplicationStatus,
  ExperienceLevel,
  getStatusMeta,
  getExperienceMeta,
} from '../types/job';

interface BoardViewProps {
  jobs: JobMetadata[];
  selectedJobId: string | null;
  onSelectJob: (job: JobMetadata) => void;
  onUpdateJob: (job: JobMetadata) => void;
  onOpenAddModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedExpFilter: ExperienceLevel | 'all';
  onSelectExpFilter: (exp: ExperienceLevel | 'all') => void;
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
  onOpenDetailModal: (job: JobMetadata) => void;
  feedbackThresholdWeeks?: number;
}

const BOARD_COLUMNS: ApplicationStatus[] = [
  'interested',
  'applied',
  'response_received',
  'interviewing',
  'offer',
  'rejected',
];

export const BoardView: React.FC<BoardViewProps> = ({
  jobs,
  selectedJobId: _selectedJobId,
  onSelectJob,
  onUpdateJob,
  onOpenAddModal: _onOpenAddModal,
  searchQuery,
  onSearchChange: _onSearchChange,
  selectedExpFilter,
  onSelectExpFilter: _onSelectExpFilter,
  currentDirName,
  needsPermission,
  onSelectDirectory,
  onGrantPermission,
  onOpenDetailModal,
  feedbackThresholdWeeks = 6,
}) => {
  const { t, i18n } = useTranslation();
  // Drag & Drop State
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ApplicationStatus | null>(null);

  // Per-column search query & expand states
  const [columnSearches, setColumnSearches] = useState<Record<ApplicationStatus, string>>({
    interested: '',
    applied: '',
    response_received: '',
    interviewing: '',
    offer: '',
    rejected: '',
  });

  const [expandedColumnSearches, setExpandedColumnSearches] = useState<Record<ApplicationStatus, boolean>>({
    interested: false,
    applied: false,
    response_received: false,
    interviewing: false,
    offer: false,
    rejected: false,
  });

  const toggleColumnSearch = (status: ApplicationStatus, open: boolean) => {
    setExpandedColumnSearches((prev) => ({ ...prev, [status]: open }));
  };

  const updateColumnSearch = (status: ApplicationStatus, query: string) => {
    setColumnSearches((prev) => ({ ...prev, [status]: query }));
  };

  // Helper to render experience level dot indicator
  const renderExperienceDot = (expLevel: ExperienceLevel) => {
    const meta = getExperienceMeta(expLevel, t);
    let dotColor = '#94a3b8'; // grauer Punkt = keine Ahnung / k.A.

    if (expLevel === 'required') {
      dotColor = '#ef4444'; // roter Punkt = erforderlich
    } else if (expLevel === 'junior') {
      dotColor = '#10b981'; // grüner Punkt = junior
    } else if (expLevel === 'desired') {
      dotColor = '#f59e0b'; // gelber/amber Punkt = gewünscht
    }

    return (
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          boxShadow: `0 0 6px ${dotColor}`,
          flexShrink: 0,
        }}
        title={meta.label}
      />
    );
  };

  // Apply search & exp filter across jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tasks.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesExp = selectedExpFilter === 'all' || job.experienceLevel === selectedExpFilter;

    return matchesSearch && matchesExp;
  });

  // Group filtered jobs by status and apply column-specific search filtering
  const jobsByStatus = BOARD_COLUMNS.reduce<Record<ApplicationStatus, JobMetadata[]>>(
    (acc, status) => {
      const colQuery = columnSearches[status].toLowerCase().trim();
      acc[status] = filteredJobs.filter((j) => {
        if (j.status !== status) return false;
        if (!colQuery) return true;
        return (
          j.company.toLowerCase().includes(colQuery) ||
          j.title.toLowerCase().includes(colQuery) ||
          j.tasks.some((t) => t.toLowerCase().includes(colQuery))
        );
      });
      return acc;
    },
    {
      interested: [],
      applied: [],
      response_received: [],
      interviewing: [],
      offer: [],
      rejected: [],
    }
  );

  const handleDragStart = (e: React.DragEvent, job: JobMetadata) => {
    setDraggedJobId(job.id);
    e.dataTransfer.setData('text/plain', job.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    if (dragOverStatus === status) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    setDragOverStatus(null);

    const jobId = draggedJobId || e.dataTransfer.getData('text/plain');
    if (!jobId) return;

    const jobToUpdate = jobs.find((j) => j.id === jobId);
    if (jobToUpdate && jobToUpdate.status !== targetStatus) {
      onUpdateJob({
        ...jobToUpdate,
        status: targetStatus,
        updatedDate: new Date().toISOString(),
      });
    }

    setDraggedJobId(null);
  };

  // Directory permission warning / empty folder view
  if (needsPermission && currentDirName) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="glass-panel" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', textAlign: 'center', maxWidth: '460px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
          <Unlock size={56} color="#f59e0b" style={{ opacity: 0.8, marginBottom: '20px' }} />
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
            <Unlock size={18} />
            <span>{t('sidebar.grant_btn')}</span>
          </button>
        </div>
      </main>
    );
  }

  if (!currentDirName) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%' }}>


      {/* Kanban Board Columns Container */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          gap: '16px',
          padding: '20px 24px',
          overflowX: 'auto',
          overflowY: 'hidden',
          alignItems: 'stretch',
        }}
      >
        {BOARD_COLUMNS.map((statusKey) => {
          const statusMeta = getStatusMeta(statusKey, t);
          const columnJobs = jobsByStatus[statusKey] || [];
          const isDropTarget = dragOverStatus === statusKey;
          const isSearchExpanded = expandedColumnSearches[statusKey];
          const colSearchText = columnSearches[statusKey];

          return (
            <div
              key={statusKey}
              onDragOver={(e) => handleDragOver(e, statusKey)}
              onDragLeave={(e) => handleDragLeave(e, statusKey)}
              onDrop={(e) => handleDrop(e, statusKey)}
              style={{
                width: '320px',
                minWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                background: isDropTarget ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                border: isDropTarget ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                backdropFilter: 'blur(12px)',
                boxShadow: isDropTarget ? '0 0 25px rgba(99, 102, 241, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.02)',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: statusMeta.color,
                      boxShadow: `0 0 8px ${statusMeta.color}`,
                      flexShrink: 0,
                    }}
                  />
                  <h3
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {statusMeta.label}
                  </h3>
                </div>

                {/* Expanding Search Icon & Count Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSearchExpanded ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--accent-primary)',
                        borderRadius: '14px',
                        padding: '2px 8px',
                        boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
                      }}
                    >
                      <Search size={12} color="var(--accent-primary)" style={{ marginRight: '4px', flexShrink: 0 }} />
                      <input
                        type="text"
                        autoFocus
                        placeholder={t('board.search_in_phase')}
                        value={colSearchText}
                        onChange={(e) => updateColumnSearch(statusKey, e.target.value)}
                        style={{
                          width: '85px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          fontSize: '0.75rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => {
                          updateColumnSearch(statusKey, '');
                          toggleColumnSearch(statusKey, false);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                        }}
                        title={t('board.close')}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleColumnSearch(statusKey, true)}
                      className="btn-icon"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: colSearchText ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                        border: colSearchText ? '1px solid var(--accent-primary)' : '1px solid transparent',
                      }}
                      title={t('board.filter_phase')}
                    >
                      <Search size={13} color={colSearchText ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    </button>
                  )}

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: statusMeta.bg,
                      color: statusMeta.color,
                      border: `1px solid ${statusMeta.color}40`,
                      flexShrink: 0,
                    }}
                  >
                    {columnJobs.length}
                  </span>
                </div>
              </div>

              {/* Column Cards Scroll Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {columnJobs.length === 0 ? (
                  <div
                    style={{
                      padding: '32px 16px',
                      textAlign: 'center',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-dim)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{colSearchText ? t('board.no_hits') : t('board.drag_here')}</span>
                  </div>
                ) : (
                  columnJobs.map((job) => {
                    const isDraggingThis = draggedJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, job)}
                        onClick={() => {
                          onSelectJob(job);
                          onOpenDetailModal(job);
                        }}
                        className="glass-panel glass-panel-hover"
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'grab',
                          opacity: isDraggingThis ? 0.4 : 1,
                          border: '1px solid var(--border-color)',
                          background: 'rgba(255, 255, 255, 0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          position: 'relative',
                        }}
                      >
                        {/* Top: Drag handle & Company + Red/Green/Yellow/Gray Dot Indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                            <GripVertical size={14} color="var(--text-dim)" style={{ flexShrink: 0, cursor: 'grab' }} />
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--accent-cyan)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {job.company}
                            </span>
                          </div>

                          {/* Minimal Experience Level Dot with hover tooltip */}
                          {renderExperienceDot(job.experienceLevel)}
                        </div>

                        {/* Title */}
                        <h4
                          title={job.title}
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            lineHeight: 1.35,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {job.title}
                        </h4>

                        {/* Additional Metadata (Location / Salary) */}
                        {(job.location || job.salary) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {job.location && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '100%',
                                }}
                                title={job.location}
                              >
                                <MapPin size={12} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.location}</span>
                              </span>
                            )}
                            {job.salary && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-emerald)' }}>
                                <CircleDollarSign size={12} />
                                {job.salary}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
