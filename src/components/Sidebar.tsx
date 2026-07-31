import React, { useState, useRef } from 'react';
import { Search, Building2, Filter, Layers, ChevronRight, Briefcase, Folder, Unlock } from 'lucide-react';
import { JobMetadata, ApplicationStatus, ExperienceLevel, STATUS_LABELS, EXPERIENCE_LABELS } from '../types/job';

interface SidebarProps {
  jobs: JobMetadata[];
  selectedJobId: string | null;
  onSelectJob: (job: JobMetadata) => void;
  selectedStatusFilter: ApplicationStatus | 'all';
  onSelectStatusFilter: (status: ApplicationStatus | 'all') => void;
  selectedExpFilter: ExperienceLevel | 'all';
  onSelectExpFilter: (exp: ExperienceLevel | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  selectedStatusFilter,
  onSelectStatusFilter,
  selectedExpFilter,
  onSelectExpFilter,
  searchQuery,
  onSearchChange,
  currentDirName,
  needsPermission,
  onSelectDirectory,
  onGrantPermission,
}) => {
  const [groupByCompany, setGroupByCompany] = useState<boolean>(true);

  // Drag to scroll for status filter bar
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!filterScrollRef.current) return;
    setIsMouseDown(true);
    setIsDragging(false);
    setStartX(e.pageX - filterScrollRef.current.offsetLeft);
    setScrollLeftState(filterScrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !filterScrollRef.current) return;
    const x = e.pageX - filterScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.8;
    if (Math.abs(walk) > 4) {
      setIsDragging(true);
    }
    filterScrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  // Apply filters
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tasks.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatusFilter === 'all' || job.status === selectedStatusFilter;
    const matchesExp = selectedExpFilter === 'all' || job.experienceLevel === selectedExpFilter;

    return matchesSearch && matchesStatus && matchesExp;
  });

  // Group by Company if enabled
  const groupedJobs = filteredJobs.reduce<Record<string, JobMetadata[]>>((acc, job) => {
    const companyKey = job.company || 'Unbekannte Firma';
    if (!acc[companyKey]) acc[companyKey] = [];
    acc[companyKey].push(job);
    return acc;
  }, {});

  const statusOptions: Array<{ id: ApplicationStatus | 'all'; label: string }> = [
    { id: 'all', label: 'Alle' },
    { id: 'interested', label: STATUS_LABELS.interested.label },
    { id: 'applied', label: STATUS_LABELS.applied.label },
    { id: 'response_received', label: STATUS_LABELS.response_received.label },
    { id: 'interviewing', label: STATUS_LABELS.interviewing.label },
    { id: 'offer', label: STATUS_LABELS.offer.label },
    { id: 'rejected', label: STATUS_LABELS.rejected.label },
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Search & Filter Header */}
      <div style={{ padding: '18px 18px 12px 18px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px' }}
            placeholder="Firma, Titel oder Skill suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status Filter Scrollable Pills */}
        <div
          ref={filterScrollRef}
          className="no-scrollbar"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            cursor: isMouseDown ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
        >
          {statusOptions.map((s) => {
            const isActive = selectedStatusFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (!isDragging) {
                    onSelectStatusFilter(s.id);
                  }
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: isMouseDown ? 'grabbing' : 'pointer',
                  border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Additional Filters & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="var(--text-muted)" />
            <select
              value={selectedExpFilter}
              onChange={(e) => onSelectExpFilter(e.target.value as ExperienceLevel | 'all')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ background: 'var(--bg-card-solid)' }}>Filter: Alle Stellen</option>
              <option value="junior" style={{ background: 'var(--bg-card-solid)' }}>🟢 Junior / Ohne Vorerfahrung</option>
              <option value="required" style={{ background: 'var(--bg-card-solid)' }}>🔴 Berufserfahrung erforderlich</option>
              <option value="desired" style={{ background: 'var(--bg-card-solid)' }}>🟡 Erfahrung gewünscht</option>
            </select>
          </div>

          <button
            onClick={() => setGroupByCompany(!groupByCompany)}
            className="btn-icon"
            style={{ width: '28px', height: '28px' }}
            title={groupByCompany ? 'Graphen/Listen-Ansicht umschalten' : 'Nach Firma gruppieren'}
          >
            <Layers size={14} color={groupByCompany ? 'var(--accent-primary)' : 'var(--text-muted)'} />
          </button>
        </div>
      </div>

      {/* Jobs List / Directory View */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {needsPermission && currentDirName ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: '#f59e0b' }}>
            <Unlock size={42} style={{ marginBottom: '14px', opacity: 0.8 }} />
            <h3 style={{ fontSize: '0.95rem', color: '#f59e0b', marginBottom: '6px' }}>Ordner-Zugriff freigeben</h3>
            <p style={{ fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '16px', color: 'var(--text-muted)' }}>
              Der Browser benötigt nach dem Neuladen deine Einmal-Bestätigung für den Ordner <strong>"{currentDirName}"</strong>.
            </p>
            <button
              onClick={onGrantPermission}
              className="btn"
              style={{
                width: '100%',
                gap: '8px',
                fontSize: '0.8rem',
                padding: '10px 12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
              }}
            >
              <Unlock size={15} />
              <span>Zugriff jetzt freigeben</span>
            </button>
          </div>
        ) : !currentDirName ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
            <Folder size={42} color="var(--accent-primary)" style={{ opacity: 0.6, marginBottom: '14px' }} />
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '6px' }}>Kein Ordner verknüpft</h3>
            <p style={{ fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '16px' }}>
              Bitte wähle zuerst einen Ordner auf deiner Festplatte aus, um deine Bewerbungen zu verwalten.
            </p>
            <button onClick={onSelectDirectory} className="btn btn-primary" style={{ width: '100%', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}>
              <Folder size={15} />
              <span>Ordner auswählen</span>
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <Briefcase size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ fontSize: '0.9rem' }}>Keine Bewerbungen in diesem Ordner.</p>
            <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
              Klicke oben auf "+ Stelle hinzufügen", um einen neuen Ordner zu erstellen.
            </span>
          </div>
        ) : groupByCompany ? (
          /* Grouped by Company View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(groupedJobs).map(([company, companyJobs]) => (
              <div key={company}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', marginBottom: '6px' }}>
                  <Building2 size={13} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {company} ({companyJobs.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {companyJobs.map((job) => {
                    const isSelected = job.id === selectedJobId;
                    const statusMeta = STATUS_LABELS[job.status] || STATUS_LABELS.interested;
                    const expMeta = EXPERIENCE_LABELS[job.experienceLevel] || EXPERIENCE_LABELS.none;

                    return (
                      <div
                        key={job.id}
                        onClick={() => onSelectJob(job)}
                        className={`glass-panel ${isSelected ? 'selected-item' : ''}`}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {job.title}
                          </h4>
                          <ChevronRight size={14} color="var(--text-dim)" />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 600,
                              background: statusMeta.bg,
                              color: statusMeta.color,
                            }}
                          >
                            {statusMeta.label}
                          </span>
                          <span className={`badge ${expMeta.tagClass}`} style={{ fontSize: '0.65rem' }}>
                            {expMeta.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Flat List View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredJobs.map((job) => {
              const isSelected = job.id === selectedJobId;
              const statusMeta = STATUS_LABELS[job.status] || STATUS_LABELS.interested;
              const expMeta = EXPERIENCE_LABELS[job.experienceLevel] || EXPERIENCE_LABELS.none;

              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className={`glass-panel ${isSelected ? 'selected-item' : ''}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '2px' }}>
                    {job.company}
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                    {job.title}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 600,
                        background: statusMeta.bg,
                        color: statusMeta.color,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                    <span className={`badge ${expMeta.tagClass}`} style={{ fontSize: '0.65rem' }}>
                      {expMeta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
