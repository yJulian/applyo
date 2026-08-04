import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  Send, 
  Award, 
  Shield, 
  ShieldAlert, 
  ShieldOff,
  Rocket, 
  Target, 
  Users, 
  Trophy, 
  Star, 
  FileText, 
  Footprints,
  Lock,
  Sparkles,
  Zap,
  Crown,
  Flame,
  Ghost,
  FolderCheck,
  Moon,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { JobMetadata, getStatusMeta } from '../types/job';
import { calculateStats, getBadges } from '../utils/statsCalculator';

interface StatsViewProps {
  jobs: JobMetadata[];
}

type BadgeCategoryFilter = 'all' | 'unlocked' | 'locked' | 'secret' | 'applications' | 'resilience' | 'success';

export const StatsView: React.FC<StatsViewProps> = ({ jobs }) => {
  const { t } = useTranslation();
  const stats = calculateStats(jobs);
  const badges = getBadges(jobs, stats, t);
  const [activeCategory, setActiveCategory] = useState<BadgeCategoryFilter>('all');

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  // Filter grouped progressive badges:
  // For each group (e.g. applications_tier, resilience_tier):
  // - If any badges in the group are unlocked, show ONLY the HIGHEST unlocked tier badge.
  // - If NO badges in the group are unlocked, show ONLY the lowest tier (Tier I) badge.
  const processedBadges = React.useMemo(() => {
    const groups: { [key: string]: typeof badges } = {};
    const nonGrouped: typeof badges = [];

    badges.forEach((badge) => {
      if (badge.group) {
        if (!groups[badge.group]) groups[badge.group] = [];
        groups[badge.group].push(badge);
      } else {
        nonGrouped.push(badge);
      }
    });

    const selectedGroupedBadges: typeof badges = [];

    Object.values(groups).forEach((groupBadges) => {
      const unlockedInGroup = groupBadges
        .filter((b) => b.isUnlocked)
        .sort((a, b) => (b.tier || 0) - (a.tier || 0));

      if (unlockedInGroup.length > 0) {
        // Show ONLY the highest unlocked tier
        selectedGroupedBadges.push(unlockedInGroup[0]);
      } else {
        // Show lowest tier (Tier I) to work towards
        const sortedLowest = groupBadges.sort((a, b) => (a.tier || 0) - (b.tier || 0));
        if (sortedLowest.length > 0) {
          selectedGroupedBadges.push(sortedLowest[0]);
        }
      }
    });

    return [...selectedGroupedBadges, ...nonGrouped];
  }, [badges]);

  const filteredBadges = processedBadges
    .filter((b) => {
      if (activeCategory === 'unlocked') return b.isUnlocked;
      if (activeCategory === 'locked') return !b.isUnlocked;
      if (activeCategory === 'secret') return b.category === 'secret';
      if (activeCategory === 'applications') return b.category === 'applications';
      if (activeCategory === 'resilience') return b.category === 'resilience';
      if (activeCategory === 'success') return b.category === 'success';
      return true;
    })
    .sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      return 0;
    });

  const renderBadgeIcon = (iconType: string, color: string, isUnlocked: boolean) => {
    const iconProps = { size: 24, color: isUnlocked ? color : 'rgba(148, 163, 184, 0.4)' };
    switch (iconType) {
      case 'footprints': return <Footprints {...iconProps} />;
      case 'send': return <Send {...iconProps} />;
      case 'rocket': return <Rocket {...iconProps} />;
      case 'award': return <Award {...iconProps} />;
      case 'zap': return <Zap {...iconProps} />;
      case 'crown': return <Crown {...iconProps} />;
      case 'shield': return <Shield {...iconProps} />;
      case 'shield-check': return <ShieldAlert {...iconProps} />;
      case 'shield-alert': return <ShieldAlert {...iconProps} />;
      case 'shield-off': return <ShieldOff {...iconProps} />;
      case 'flame': return <Flame {...iconProps} />;
      case 'sparkles': return <Sparkles {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      case 'user-check': return <Users {...iconProps} />;
      case 'users': return <Users {...iconProps} />;
      case 'trophy': return <Trophy {...iconProps} />;
      case 'star': return <Star {...iconProps} />;
      case 'file-text': return <FileText {...iconProps} />;
      case 'map-pin': return <MapPin {...iconProps} />;
      case 'ghost': return <Ghost {...iconProps} />;
      case 'folder-check': return <FolderCheck {...iconProps} />;
      case 'moon': return <Moon {...iconProps} />;
      default: return <Award {...iconProps} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg-primary, #0f172a)',
      color: '#f8fafc',
    }}>
      {/* LEFT COLUMN: STATISTICS (2/5 = 40%) */}
      <div style={{
        width: '40%',
        height: '100%',
        overflowY: 'auto',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <BarChart3 size={24} style={{ color: '#38bdf8' }} />
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{t('stats.title')}</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            {t('stats.subtitle')}
          </p>
        </div>

        {/* Primary KPI Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>{t('stats.total_jobs')}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
              {stats.totalJobs}
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>{t('stats.total_applied')}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#60a5fa', marginTop: '4px' }}>
              {stats.totalApplied + stats.totalResponseReceived + stats.totalInterviewing + stats.totalOffer + stats.totalRejected}
            </div>
          </div>
        </div>

        {/* Conversion & Quota Metrics */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>
            {t('stats.tab_overview')}
          </h3>

          {/* Interested -> Applied */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>{getStatusMeta('interested', t).label} ➔ {getStatusMeta('applied', t).label}</span>
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>{stats.interestedToAppliedRate}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.interestedToAppliedRate}%`, height: '100%', backgroundColor: '#38bdf8', borderRadius: '4px', transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Response Rate */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>{t('stats.response_rate')}</span>
              <span style={{ fontWeight: 600, color: '#818cf8' }}>{stats.responseRate}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.responseRate}%`, height: '100%', backgroundColor: '#818cf8', borderRadius: '4px', transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Rejection Rate */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>{t('stats.rejection_rate')}</span>
              <span style={{ fontWeight: 600, color: '#f87171' }}>{stats.rejectionRate}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.rejectionRate}%`, height: '100%', backgroundColor: '#f87171', borderRadius: '4px', transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Offer Rate */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>{t('stats.offer_rate')}</span>
              <span style={{ fontWeight: 600, color: '#facc15' }}>{stats.offerRate}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.offerRate}%`, height: '100%', backgroundColor: '#facc15', borderRadius: '4px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

        {/* Status Breakdown List */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '20px',
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>
            {t('stats.status_distribution')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <StatusRow label={getStatusMeta('interested', t).label} count={stats.totalInterested} total={stats.totalJobs} color="#94a3b8" />
            <StatusRow label={getStatusMeta('applied', t).label} count={stats.totalApplied} total={stats.totalJobs} color="#3b82f6" />
            <StatusRow label={getStatusMeta('response_received', t).label} count={stats.totalResponseReceived} total={stats.totalJobs} color="#8b5cf6" />
            <StatusRow label={getStatusMeta('interviewing', t).label} count={stats.totalInterviewing} total={stats.totalJobs} color="#06b6d4" />
            <StatusRow label={getStatusMeta('offer', t).label} count={stats.totalOffer} total={stats.totalJobs} color="#10b981" />
            <StatusRow label={getStatusMeta('rejected', t).label} count={stats.totalRejected} total={stats.totalJobs} color="#ef4444" />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: BADGES & ACHIEVEMENTS (3/5 = 60%) */}
      <div style={{
        width: '60%',
        height: '100%',
        overflowY: 'auto',
        padding: '24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Badges Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Trophy size={26} style={{ color: '#facc15' }} />
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{t('stats.tab_badges')}</h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              {t('stats.badges_unlocked', { unlocked: unlockedCount, total: badges.length })}
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(250, 204, 21, 0.12)',
            border: '1px solid rgba(250, 204, 21, 0.3)',
            padding: '8px 16px',
            borderRadius: '30px',
          }}>
            <Sparkles size={16} style={{ color: '#facc15' }} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#facc15' }}>
              {unlockedCount} / {badges.length}
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <FilterPill label={t('sidebar.filter_all')} count={badges.length} active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
          <FilterPill label={t('stats.badges_unlocked', { unlocked: unlockedCount, total: badges.length }).split(':')[0]} count={unlockedCount} active={activeCategory === 'unlocked'} onClick={() => setActiveCategory('unlocked')} />
          <FilterPill label={t('stats.cat_applications')} active={activeCategory === 'applications'} onClick={() => setActiveCategory('applications')} />
          <FilterPill label={t('stats.cat_resilience')} active={activeCategory === 'resilience'} onClick={() => setActiveCategory('resilience')} />
          <FilterPill label={t('stats.cat_success')} active={activeCategory === 'success'} onClick={() => setActiveCategory('success')} />
          <FilterPill label={t('stats.cat_secret')} active={activeCategory === 'secret'} onClick={() => setActiveCategory('secret')} />
        </div>

        {/* Badges Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px',
        }}>
          {filteredBadges.map((badge) => {
            const isSecretLocked = badge.isHidden && !badge.isUnlocked;
            const pct = Math.min(100, Math.round((badge.currentValue / badge.targetValue) * 100));

            return (
              <div
                key={badge.id}
                style={{
                  background: isSecretLocked
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.3), rgba(15, 23, 42, 0.5))'
                    : badge.isUnlocked
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))'
                    : 'rgba(15, 23, 42, 0.4)',
                  border: isSecretLocked
                    ? '1px dashed rgba(168, 85, 247, 0.4)'
                    : badge.isUnlocked
                    ? `1.5px solid ${badge.color}66`
                    : '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: badge.isUnlocked ? `0 4px 20px ${badge.color}15` : 'none',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {badge.isUnlocked && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '-12px',
                    width: '40px',
                    height: '40px',
                    background: `${badge.color}22`,
                    borderRadius: '50%',
                    filter: 'blur(10px)',
                  }} />
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  {/* Badge Icon Wrapper */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: isSecretLocked
                      ? 'rgba(168, 85, 247, 0.1)'
                      : badge.isUnlocked
                      ? `${badge.color}20`
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isSecretLocked
                      ? '1px solid rgba(168, 85, 247, 0.3)'
                      : badge.isUnlocked
                      ? `1px solid ${badge.color}55`
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isSecretLocked ? (
                      <HelpCircle size={24} style={{ color: '#c084fc' }} />
                    ) : badge.isUnlocked ? (
                      renderBadgeIcon(badge.iconType, badge.color, true)
                    ) : (
                      <Lock size={20} style={{ color: 'rgba(148, 163, 184, 0.4)' }} />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: isSecretLocked ? '#c084fc' : badge.isUnlocked ? '#f8fafc' : '#94a3b8',
                      }}>
                        {isSecretLocked ? t('stats.secret_badge_title') : badge.title}
                      </h4>
                      {badge.tierLabel && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#cbd5e1',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}>
                          {badge.tierLabel}
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '0.78rem',
                      color: isSecretLocked ? '#a855f7' : badge.isUnlocked ? '#cbd5e1' : '#64748b',
                      lineHeight: 1.35,
                    }}>
                      {isSecretLocked ? t('stats.secret_badge_desc') : badge.description}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                    <span>{badge.isUnlocked ? t('stats.unlocked_status') : isSecretLocked ? t('stats.secret_status') : t('stats.progress')}</span>
                    <span>{isSecretLocked ? '?' : `${badge.currentValue} / ${badge.targetValue}`}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: isSecretLocked ? '0%' : `${pct}%`,
                      height: '100%',
                      backgroundColor: badge.isUnlocked ? badge.color : isSecretLocked ? '#c084fc' : '#64748b',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FilterPill: React.FC<{ label: string; count?: number; active: boolean; onClick: () => void }> = ({
  label,
  count,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '0.78rem',
      fontWeight: active ? 600 : 500,
      border: 'none',
      outline: 'none',
      cursor: 'pointer',
      background: active ? '#38bdf8' : 'rgba(30, 41, 59, 0.7)',
      color: active ? '#0f172a' : '#94a3b8',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}
  >
    {label}
    {count !== undefined && (
      <span style={{
        fontSize: '0.7rem',
        padding: '1px 6px',
        borderRadius: '10px',
        background: active ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      }}>
        {count}
      </span>
    )}
  </button>
);

const StatusRow: React.FC<{ label: string; count: number; total: number; color: string }> = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
          {label}
        </span>
        <span style={{ color: '#94a3b8' }}>{count} ({pct}%)</span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '3px' }} />
      </div>
    </div>
  );
};
