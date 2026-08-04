import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Folder,
  Unlock,
  Bell,
  CalendarDays,
} from 'lucide-react';
import {
  JobMetadata,
  ApplicationStatus,
  getStatusMeta,
  STATUS_LABELS,
} from '../types/job';

interface CalendarViewProps {
  jobs: JobMetadata[];
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
  onSelectJob?: (job: JobMetadata) => void;
}

type CalendarEventType = 'status_change' | 'feedback';

interface CalendarEvent {
  jobId: string;
  jobTitle: string;
  company: string;
  type: CalendarEventType;
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
  timestamp: string;
}

function isoToDateKey(iso: string): string {
  return iso.slice(0, 10);
}

const EventPill: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  if (event.type === 'status_change' && event.toStatus) {
    const statusInfo = STATUS_LABELS[event.toStatus];
    return (
      <div style={{
        borderRadius: '4px', padding: '1px 5px',
        background: statusInfo.bg,
        border: `1px solid ${statusInfo.color}44`,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: statusInfo.color }}>
          {event.company}
        </span>
      </div>
    );
  }
  if (event.type === 'feedback') {
    return (
      <div style={{
        borderRadius: '4px', padding: '1px 5px',
        background: 'rgba(251,191,36,0.12)',
        border: '1px solid rgba(251,191,36,0.3)',
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#fbbf24' }}>
          📬 {event.company}
        </span>
      </div>
    );
  }
  return null;
};

const DetailCard: React.FC<{ event: CalendarEvent; onClick: () => void }> = ({ event, onClick }) => {
  const time = new Date(event.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  if (event.type === 'status_change' && event.toStatus) {
    const toInfo = STATUS_LABELS[event.toStatus];
    const fromInfo = event.fromStatus ? STATUS_LABELS[event.fromStatus] : null;
    return (
      <div
        onClick={onClick}
        style={{
          borderRadius: '10px', padding: '10px 12px',
          background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)',
          cursor: 'pointer', transition: 'background 0.15s ease',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '2px' }}>
              {event.jobTitle}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{event.company}</p>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>{time} Uhr</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {fromInfo && (
            <>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600, color: fromInfo.color,
                background: fromInfo.bg, borderRadius: '5px', padding: '2px 7px',
                border: `1px solid ${fromInfo.color}44`,
              }}>
                {fromInfo.label}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>→</span>
            </>
          )}
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, color: toInfo.color,
            background: toInfo.bg, borderRadius: '5px', padding: '2px 7px',
            border: `1px solid ${toInfo.color}55`,
          }}>
            {toInfo.label}
          </span>
        </div>
      </div>
    );
  }

  if (event.type === 'feedback') {
    return (
      <div
        onClick={onClick}
        style={{
          borderRadius: '10px', padding: '10px 12px',
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
          cursor: 'pointer', transition: 'background 0.15s ease',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '2px' }}>
              {event.jobTitle}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{event.company}</p>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>{time} Uhr</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={11} color="#fbbf24" />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fbbf24' }}>Rückmeldung erhalten</span>
        </div>
      </div>
    );
  }

  return null;
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  jobs,
  currentDirName,
  needsPermission,
  onSelectDirectory,
  onGrantPermission,
  onSelectJob,
}) => {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');
  const [filterJobId, setFilterJobId] = useState<string>('all');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const monthName = new Date(year, month, 1).toLocaleString(i18n.language, { month: 'long' });

  const formatDateKey = (key: string): string => {
    const [y, m, d] = key.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const goToPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const allEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];
    for (const job of jobs) {
      if (job.statusHistory) {
        for (const entry of job.statusHistory) {
          events.push({
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            type: 'status_change',
            fromStatus: entry.fromStatus,
            toStatus: entry.toStatus,
            timestamp: entry.timestamp,
          });
        }
      }
      if (job.feedbackHistory) {
        for (const ts of job.feedbackHistory) {
          events.push({
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            type: 'feedback',
            timestamp: ts,
          });
        }
      }
    }
    return events;
  }, [jobs]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      if (filterStatus !== 'all') {
        if (e.type !== 'status_change' || e.toStatus !== filterStatus) return false;
      }
      if (filterJobId !== 'all' && e.jobId !== filterJobId) return false;
      return true;
    });
  }, [allEvents, filterStatus, filterJobId]);

  const eventsByDay = useMemo<Record<string, CalendarEvent[]>>(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of filteredEvents) {
      const key = isoToDateKey(e.timestamp);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [filteredEvents]);

  // Count events in current month view for display
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const currentMonthCount = Object.entries(eventsByDay)
    .filter(([key]) => key.startsWith(currentMonthPrefix))
    .reduce((sum, [, evs]) => sum + evs.length, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const startDow = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startDow + totalDays) / 7) * 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1;
    cells.push(dayNum >= 1 && dayNum <= totalDays ? dayNum : null);
  }

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function getDayKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const selectedDayEvents = selectedDayKey ? (eventsByDay[selectedDayKey] || []) : [];

  const jobOptions = useMemo(() => {
    const seen = new Set<string>();
    return jobs.filter(j => { if (seen.has(j.id)) return false; seen.add(j.id); return true; });
  }, [jobs]);

  const hasActiveFilter = filterStatus !== 'all' || filterJobId !== 'all';

  if (!currentDirName) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', color: 'var(--text-muted)' }}>
        <CalendarDays size={56} style={{ opacity: 0.3 }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('board.no_folder_title')}</p>
          <p style={{ fontSize: '0.875rem' }}>{t('board.no_folder_desc')}</p>
        </div>
        <button onClick={onSelectDirectory} className="btn btn-primary" style={{ gap: '8px' }}>
          <Folder size={16} />{t('sidebar.select_folder_btn')}
        </button>
      </div>
    );
  }

  if (needsPermission) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', color: 'var(--text-muted)' }}>
        <Unlock size={56} style={{ opacity: 0.3 }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('sidebar.grant_title')}</p>
          <p style={{ fontSize: '0.875rem' }}>{t('sidebar.grant_desc', { name: currentDirName })}</p>
        </div>
        <button onClick={onGrantPermission} className="btn btn-primary" style={{ gap: '8px' }}>
          <Unlock size={16} />{t('sidebar.grant_btn')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 24px', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={goToPrevMonth}
            style={{
              width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
              color: 'var(--text-secondary)', transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ minWidth: '170px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {monthName} {year}
            </span>
          </div>
          <button
            onClick={goToNextMonth}
            style={{
              width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
              color: 'var(--text-secondary)', transition: 'all 0.2s ease',
            }}
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={goToToday}
            style={{
              height: '34px', padding: '0 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
              cursor: 'pointer', color: '#a5b4fc', transition: 'all 0.2s ease',
            }}
          >
            {t('calendar.today')}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t('calendar.events_count', { count: currentMonthCount })}
          </span>
          <button
            onClick={() => setShowFilter(f => !f)}
            style={{
              height: '34px', padding: '0 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px',
              background: showFilter ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)',
              border: `1px solid ${showFilter ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.2)'}`,
              cursor: 'pointer', color: '#a5b4fc', transition: 'all 0.2s ease',
            }}
          >
            <Filter size={13} />
            Filter
            {hasActiveFilter && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ApplicationStatus | 'all')}
              style={{
                background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: '8px',
                color: 'var(--text-primary)', fontSize: '0.8rem', padding: '5px 10px', cursor: 'pointer',
              }}
            >
              <option value="all">{t('sidebar.filter_all')}</option>
              {Object.entries(STATUS_LABELS).map(([key]) => (
                <option key={key} value={key}>{getStatusMeta(key as ApplicationStatus, t).label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('cover_letter_editor.select_job')}:</span>
            <select
              value={filterJobId}
              onChange={e => setFilterJobId(e.target.value)}
              style={{
                background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: '8px',
                color: 'var(--text-primary)', fontSize: '0.8rem', padding: '5px 10px', cursor: 'pointer',
                maxWidth: '220px',
              }}
            >
              <option value="all">{t('sidebar.exp_filter_all')}</option>
              {jobOptions.map(j => (
                <option key={j.id} value={j.id}>{j.company}: {j.title}</option>
              ))}
            </select>
          </div>
          {hasActiveFilter && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterJobId('all'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600,
                color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
              }}
            >
              <X size={12} />Reset
            </button>
          )}
        </div>
      )}

      {/* Calendar + Detail Panel */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', overflow: 'hidden', minHeight: 0 }}>
        {/* Grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d, i) => {
              const dayStr = new Date(2026, 7, 3 + i).toLocaleDateString(i18n.language, { weekday: 'short' });
              return (
                <div key={d} style={{
                  textAlign: 'center', fontSize: '0.72rem', fontWeight: 700,
                  color: 'var(--text-muted)', padding: '5px 0', letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  {dayStr}
                </div>
              );
            })}
          </div>

          {/* Cells */}
          <div style={{
            flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: `repeat(${totalCells / 7}, 1fr)`,
            gap: '4px', overflow: 'hidden',
          }}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} style={{ borderRadius: '10px', background: 'rgba(15,23,42,0.15)' }} />;
              }
              const dayKey = getDayKey(day);
              const dayEvents = eventsByDay[dayKey] || [];
              const isToday = dayKey === todayKey;
              const isSelected = dayKey === selectedDayKey;
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={dayKey}
                  onClick={() => hasEvents && setSelectedDayKey(isSelected ? null : dayKey)}
                  style={{
                    borderRadius: '10px',
                    background: isSelected
                      ? 'rgba(99,102,241,0.18)'
                      : isToday
                      ? 'rgba(99,102,241,0.08)'
                      : hasEvents
                      ? 'rgba(15,23,42,0.6)'
                      : 'rgba(15,23,42,0.3)',
                    border: isSelected
                      ? '1px solid rgba(99,102,241,0.6)'
                      : isToday
                      ? '1px solid rgba(99,102,241,0.35)'
                      : hasEvents
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid rgba(255,255,255,0.03)',
                    cursor: hasEvents ? 'pointer' : 'default',
                    display: 'flex', flexDirection: 'column',
                    padding: '6px 7px',
                    transition: 'all 0.18s ease',
                    overflow: 'hidden',
                    boxShadow: isSelected ? '0 0 0 2px rgba(99,102,241,0.25)' : 'none',
                  }}
                >
                  <div style={{
                    fontSize: '0.78rem', fontWeight: isToday ? 800 : 600,
                    color: isToday ? '#a5b4fc' : isSelected ? '#c7d2fe' : hasEvents ? 'var(--text-primary)' : 'var(--text-muted)',
                    lineHeight: 1, marginBottom: hasEvents ? '5px' : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{day}</span>
                    {isToday && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6366f1' }} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    {dayEvents.slice(0, 3).map((ev, i) => <EventPill key={i} event={ev} />)}
                    {dayEvents.length > 3 && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedDayKey && (
          <div className="glass-panel" style={{
            width: '296px', flexShrink: 0, borderRadius: '14px', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
                  {t('calendar.title')}
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatDateKey(selectedDayKey)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayKey(null)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                <X size={13} />
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
                {t('calendar.no_events')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                {selectedDayEvents.map((ev, i) => {
                  const job = jobs.find(j => j.id === ev.jobId);
                  return (
                    <DetailCard
                      key={i}
                      event={ev}
                      onClick={() => job && onSelectJob?.(job)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
