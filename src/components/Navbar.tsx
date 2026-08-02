import React, { useState, useRef, useCallback } from 'react';
import { Folder, FolderCheck, Plus, Settings, Briefcase, Unlock, LayoutList, Kanban, CalendarDays } from 'lucide-react';
import { AISettings } from '../types/job';

type ViewMode = 'list' | 'board' | 'calendar';

interface NavbarProps {
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenCVEditor?: () => void;
  aiSettings: AISettings;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const TABS: { id: ViewMode; label: string; icon: React.ReactNode; title: string }[] = [
  { id: 'list',     label: 'Liste',    icon: <LayoutList size={15} />,   title: 'Listenansicht' },
  { id: 'board',    label: 'Board',    icon: <Kanban size={15} />,        title: 'Kanban Board Ansicht' },
  { id: 'calendar', label: 'Kalender', icon: <CalendarDays size={15} />, title: 'Kalenderansicht – Statusaenderungen & Rueckmeldungen' },
];

interface RippleItem { id: number; x: number; y: number; }

const ViewSwitcher: React.FC<{ viewMode: ViewMode; onViewModeChange: (m: ViewMode) => void }> = ({
  viewMode,
  onViewModeChange,
}) => {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const [lastActivated, setLastActivated] = useState<ViewMode>(viewMode);
  const rippleCounter = useRef(0);

  const handleClick = useCallback((mode: ViewMode, e: React.MouseEvent<HTMLButtonElement>) => {
    if (mode === viewMode) return;
    setLastActivated(mode);
    onViewModeChange(mode);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++rippleCounter.current;
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 650);
  }, [viewMode, onViewModeChange]);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        borderRadius: '22px',
        background: 'rgba(9, 13, 22, 0.9)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        gap: '2px',
      }}
    >
      {TABS.map(tab => {
        const isActive = viewMode === tab.id;
        const justActivated = isActive && lastActivated === tab.id;

        return (
          <button
            key={tab.id}
            onClick={e => handleClick(tab.id, e)}
            title={tab.title}
            className={isActive ? 'tab-btn-active' : ''}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '18px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: isActive ? 'default' : 'pointer',
              border: 'none',
              outline: 'none',
              overflow: 'hidden',
              letterSpacing: '0.01em',
              background: isActive
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)'
                : 'transparent',
              color: isActive ? '#ffffff' : 'rgba(148,163,184,0.85)',
              boxShadow: isActive
                ? '0 2px 14px rgba(99,102,241,0.55), 0 0 0 1px rgba(99,102,241,0.3)'
                : 'none',
              transition: [
                'background 0.35s cubic-bezier(0.22,1,0.36,1)',
                'color 0.25s ease',
                'box-shadow 0.35s ease',
                'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              ].join(', '),
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {/* Shimmer sweep on active */}
            {isActive && (
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '18px',
                background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)',
                backgroundSize: '200% 100%',
                animation: 'tabShimmer 2.4s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}

            {/* Icon – bounces when this tab becomes active */}
            <span
              key={justActivated ? `${tab.id}-bounce` : tab.id}
              className="tab-icon"
              style={{
                display: 'flex',
                flexShrink: 0,
                animation: justActivated ? 'tabIconBounce 0.45s cubic-bezier(0.22,1,0.36,1) both' : 'none',
              }}
            >
              {tab.icon}
            </span>

            <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>

            {/* Ripple effects */}
            {ripples.map(rp => (
              <span
                key={rp.id}
                className="tab-ripple"
                style={{ left: rp.x - 16, top: rp.y - 16 }}
              />
            ))}
          </button>
        );
      })}
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  currentDirName,
  needsPermission,
  onSelectDirectory,
  onGrantPermission,
  onOpenAddModal,
  onOpenSettingsModal,
  aiSettings,
  viewMode,
  onViewModeChange,
}) => {
  const [isFolderHovered, setIsFolderHovered] = useState(false);
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '12px 24px', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', position: 'relative' }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
          }}>
            <Briefcase size={20} color="#ffffff" />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.35rem', lineHeight: 1.1 }}>Applyo</h1>
          </div>
        </div>

        {/* Center: Animated View Switcher */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Directory Button */}
          <button
            onClick={needsPermission && currentDirName ? onGrantPermission : onSelectDirectory}
            onMouseEnter={() => setIsFolderHovered(true)}
            onMouseLeave={() => setIsFolderHovered(false)}
            style={{
              height: '38px', minWidth: '38px', borderRadius: '19px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              paddingLeft: isFolderHovered ? '14px' : '11px',
              paddingRight: isFolderHovered ? '14px' : '11px',
              background: needsPermission && currentDirName
                ? isFolderHovered ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(245, 158, 11, 0.15)'
                : currentDirName
                ? isFolderHovered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'
                : isFolderHovered ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
              border: needsPermission && currentDirName
                ? '1px solid rgba(245, 158, 11, 0.5)'
                : currentDirName ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: needsPermission && currentDirName ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
              cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title={
              needsPermission && currentDirName
                ? `Zugriff auf '${currentDirName}' freigeben`
                : currentDirName ? `Ordner: ${currentDirName}` : 'Lokalen Arbeitsordner waehlen'
            }
          >
            {needsPermission && currentDirName ? (
              <Unlock size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            ) : currentDirName ? (
              <FolderCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
            ) : (
              <Folder size={16} color="#6366f1" style={{ flexShrink: 0 }} />
            )}
            <span style={{
              fontSize: '0.8rem', fontWeight: 600,
              color: needsPermission && currentDirName ? '#f59e0b' : currentDirName ? '#34d399' : '#a5b4fc',
              whiteSpace: 'nowrap', maxWidth: isFolderHovered ? '260px' : '0px',
              opacity: isFolderHovered ? 1 : 0, marginLeft: isFolderHovered ? '8px' : '0px',
              overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-block', verticalAlign: 'middle',
            }}>
              {needsPermission && currentDirName
                ? `Zugriff auf '${currentDirName}' freigeben`
                : currentDirName ? `Ordner: ${currentDirName}` : 'Ordner waehlen'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            onMouseEnter={() => setIsSettingsHovered(true)}
            onMouseLeave={() => setIsSettingsHovered(false)}
            style={{
              height: '38px', minWidth: '38px', borderRadius: '19px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              paddingLeft: isSettingsHovered ? '14px' : '11px',
              paddingRight: isSettingsHovered ? '14px' : '11px',
              background: isSettingsHovered ? 'rgba(192, 132, 252, 0.2)' : 'rgba(192, 132, 252, 0.1)',
              border: '1px solid rgba(192, 132, 252, 0.4)',
              cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title={`Einstellungen & Profil (KI-Provider: ${aiSettings.activeProvider.toUpperCase()})`}
          >
            <Settings size={16} color="#c084fc" style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: '0.8rem', fontWeight: 600, color: '#c084fc', whiteSpace: 'nowrap',
              maxWidth: isSettingsHovered ? '100px' : '0px', opacity: isSettingsHovered ? 1 : 0,
              marginLeft: isSettingsHovered ? '8px' : '0px', overflow: 'hidden',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-block', verticalAlign: 'middle',
            }}>
              Settings
            </span>
          </button>

          {/* Add Job Button */}
          <button onClick={onOpenAddModal} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.825rem', gap: '6px' }}>
            <Plus size={16} />
            <span>Neue Stelle</span>
          </button>
        </div>
      </div>
    </header>
  );
};
