import React, { useState } from 'react';
import { Search, Building2, Filter, Layers, ChevronRight, Briefcase } from 'lucide-react';
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
}) => {
  const [groupByCompany, setGroupByCompany] = useState<boolean>(true);

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
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
          {statusOptions.map((s) => {
            const isActive = selectedStatusFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectStatusFilter(s.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
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
        {filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <Briefcase size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ fontSize: '0.9rem' }}>Keine Bewerbungen gefunden.</p>
            <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
              Füge eine neue Stelle hinzu oder wähle einen Ordner.
            </span>
          </div>
        ) : groupByCompany ? (
          // Grouped by Company Hierarchy {FIRMA}/{Titel}
          Object.entries(groupedJobs).map(([company, companyJobs]) => (
            <div key={company} style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <Building2 size={14} color="var(--accent-secondary)" />
                <span>{company}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.7rem',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {companyJobs.length}
                </span>
              </div>

              {companyJobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                const statusMeta = STATUS_LABELS[job.status] || STATUS_LABELS.interested;
                const expMeta = EXPERIENCE_LABELS[job.experienceLevel] || EXPERIENCE_LABELS.none;

                return (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className={`glass-panel ${isSelected ? '' : 'glass-panel-hover'}`}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.18)' : undefined,
                      borderColor: isSelected ? 'var(--accent-primary)' : undefined,
                      boxShadow: isSelected ? 'var(--shadow-glow)' : undefined,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: '0.9rem',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {job.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            color: statusMeta.color,
                            background: statusMeta.bg,
                            fontWeight: 600,
                          }}
                        >
                          {statusMeta.label}
                        </span>
                        <span className={`badge ${expMeta.tagClass}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          {expMeta.label}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} color={isSelected ? 'var(--accent-primary)' : 'var(--text-dim)'} />
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          // Flat List View
          filteredJobs.map((job) => {
            const isSelected = job.id === selectedJobId;
            const statusMeta = STATUS_LABELS[job.status] || STATUS_LABELS.interested;
            const expMeta = EXPERIENCE_LABELS[job.experienceLevel] || EXPERIENCE_LABELS.none;

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className={`glass-panel ${isSelected ? '' : 'glass-panel-hover'}`}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99, 102, 241, 0.18)' : undefined,
                  borderColor: isSelected ? 'var(--accent-primary)' : undefined,
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{job.company}</span>
                <h4 style={{ fontSize: '0.9rem', margin: '2px 0 6px 0' }}>{job.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      color: statusMeta.color,
                      background: statusMeta.bg,
                      fontWeight: 600,
                    }}
                  >
                    {statusMeta.label}
                  </span>
                  <span className={`badge ${expMeta.tagClass}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {expMeta.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
