import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Folder, FolderCheck, Plus, Settings, Briefcase, Unlock, LayoutList, Kanban, CalendarDays, BarChart3, FileText, Mail } from 'lucide-react';
import { AISettings } from '../types/job';

type ViewMode = 'list' | 'board' | 'calendar' | 'stats';

interface NavbarProps {
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenCVEditor?: () => void;
  onOpenCoverLetterEditor?: () => void;
  aiSettings: AISettings;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const TABS: { id: ViewMode; label: string; icon: React.ReactNode; title: string }[] = [
  { id: 'list',     label: 'Liste',       icon: <LayoutList size={14} />,   title: 'Listenansicht' },
  { id: 'board',    label: 'Board',       icon: <Kanban size={14} />,       title: 'Kanban Board Ansicht' },
  { id: 'calendar', label: 'Kalender',    icon: <CalendarDays size={14} />, title: 'Kalenderansicht' },
  { id: 'stats',    label: 'Statistiken', icon: <BarChart3 size={14} />,    title: 'Statistiken & Badges' },
];

// ─── Option 3: Underline Minimalist Tabs ────────────────────────────────────
const ViewSwitcher: React.FC<{
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  compact?: boolean;
}> = ({ viewMode, onViewModeChange, compact = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [underline, setUnderline] = useState<{ left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const updateUnderline = useCallback(() => {
    const activeIdx = TABS.findIndex(t => t.id === viewMode);
    const btn = btnRefs.current[activeIdx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const btnRect = btn.getBoundingClientRect();
    const conRect = container.getBoundingClientRect();
    setUnderline({ left: btnRect.left - conRect.left, width: btnRect.width });
  }, [viewMode]);

  useEffect(() => {
    updateUnderline();
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (mounted) updateUnderline();
  }, [viewMode, mounted, updateUnderline]);

  const pillPad = compact ? '6px 12px' : '8px 18px';
  const fontSize = compact ? '0.78rem' : '0.825rem';

  return (
    <div
      ref={containerRef}
      className="view-switcher-container"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        gap: compact ? '4px' : '8px',
        paddingBottom: '2px',
      }}
    >
      {TABS.map((tab, idx) => {
        const isActive = viewMode === tab.id;
        return (
          <button
            key={tab.id}
            ref={el => { btnRefs.current[idx] = el; }}
            onClick={() => { if (!isActive) onViewModeChange(tab.id); }}
            title={tab.title}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: pillPad,
              borderRadius: '6px',
              fontSize,
              fontWeight: isActive ? 600 : 500,
              cursor: isActive ? 'default' : 'pointer',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: isActive ? '#ffffff' : 'rgba(148, 163, 184, 0.65)',
              transition: 'color 0.2s ease',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              WebkitAppRegion: 'no-drag',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: isActive ? '#6366f1' : 'inherit' }}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
      {/* Dynamic sliding gradient underline */}
      {underline && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: underline.left + 8,
            width: underline.width - 16,
            height: '2px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.6)',
            transition: mounted
              ? 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'none',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
};

// ─── Hook: Window Controls Overlay state ─────────────────────────────────────
function useWindowControlsOverlay() {
  const [isWCO, setIsWCO] = useState(false);
  const [titlebarArea, setTitlebarArea] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 40,
  });

  useEffect(() => {
    const wco = (navigator as Navigator & { windowControlsOverlay?: {
      visible: boolean;
      getTitlebarAreaRect(): DOMRect;
      addEventListener(type: string, cb: () => void): void;
      removeEventListener(type: string, cb: () => void): void;
    }}).windowControlsOverlay;

    if (!wco) return;

    const update = () => {
      const visible = wco.visible;
      setIsWCO(visible);
      if (visible) {
        const rect = wco.getTitlebarAreaRect();
        setTitlebarArea({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
    };

    update();
    wco.addEventListener('geometrychange', update);
    return () => wco.removeEventListener('geometrychange', update);
  }, []);

  return { isWCO, titlebarArea };
}

// ─── WCO: Underline Minimalist Tab Switcher ─────────────────────────────────
const WCOTabSwitcher: React.FC<{
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
}> = ({ viewMode, onViewModeChange }) => {
  return <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} compact />;
};

// ─── WCO Titlebar (nur wenn als PWA mit WCO installiert) ─────────────────────
const WCOTitlebar: React.FC<NavbarProps> = ({
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
  const [isAddHovered, setIsAddHovered] = useState(false);

  return (
    <>
      <div className="wco-titlebar">

        {/* Left: Folder only */}
        <div className="wco-left">
          <button
            onClick={needsPermission && currentDirName ? onGrantPermission : onSelectDirectory}
            onMouseEnter={() => setIsFolderHovered(true)}
            onMouseLeave={() => setIsFolderHovered(false)}
            className="wco-bare-btn"
            title={
              needsPermission && currentDirName
                ? `Zugriff auf '${currentDirName}' freigeben`
                : currentDirName ? `Ordner: ${currentDirName}` : 'Lokalen Arbeitsordner wählen'
            }
          >
            {needsPermission && currentDirName ? (
              <Unlock size={15} color="#f59e0b" />
            ) : currentDirName ? (
              <FolderCheck size={15} color="#10b981" />
            ) : (
              <Folder size={15} color="#6366f1" />
            )}
            <span style={{
              fontSize: '0.72rem', fontWeight: 600,
              color: needsPermission && currentDirName ? '#f59e0b' : currentDirName ? '#34d399' : '#a5b4fc',
              whiteSpace: 'nowrap',
              maxWidth: isFolderHovered ? '180px' : '0px',
              opacity: isFolderHovered ? 1 : 0,
              marginLeft: isFolderHovered ? '5px' : '0px',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              {needsPermission && currentDirName
                ? `'${currentDirName}' freigeben`
                : currentDirName ?? 'Ordner wählen'}
            </span>
          </button>
        </div>

        {/* Center: Minimal Tab Switcher */}
        <div className="wco-center">
          <WCOTabSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Right: Neue Stelle + Einstellungen */}
        <div className="wco-right">
          <button
            onClick={onOpenAddModal}
            onMouseEnter={() => setIsAddHovered(true)}
            onMouseLeave={() => setIsAddHovered(false)}
            className="wco-bare-btn"
            title="Neue Bewerbung hinzufügen"
          >
            <Plus size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: '0.72rem', fontWeight: 600,
              color: '#38bdf8',
              whiteSpace: 'nowrap',
              maxWidth: isAddHovered ? '110px' : '0px',
              opacity: isAddHovered ? 1 : 0,
              marginLeft: isAddHovered ? '5px' : '0px',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              Neue Stelle
            </span>
          </button>

          <button
            onClick={onOpenSettingsModal}
            onMouseEnter={() => setIsSettingsHovered(true)}
            onMouseLeave={() => setIsSettingsHovered(false)}
            className="wco-bare-btn"
            title={`Einstellungen (KI: ${aiSettings.activeProvider.toUpperCase()})`}
          >
            <Settings size={15} color="#c084fc" style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: '0.72rem', fontWeight: 600,
              color: '#c084fc',
              whiteSpace: 'nowrap',
              maxWidth: isSettingsHovered ? '110px' : '0px',
              opacity: isSettingsHovered ? 1 : 0,
              marginLeft: isSettingsHovered ? '5px' : '0px',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              Einstellungen
            </span>
          </button>
        </div>
      </div>

      {/* Spacer below WCO bar */}
      <div className="wco-spacer" />
    </>
  );
};

// ─── Standard Navbar (Browser / non-WCO PWA) ─────────────────────────────────
const StandardNavbar: React.FC<NavbarProps> = ({
  currentDirName,
  needsPermission,
  onSelectDirectory,
  onGrantPermission,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenCVEditor,
  onOpenCoverLetterEditor,
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
          <h1 className="gradient-text" style={{ fontSize: '1.35rem', lineHeight: 1.1 }}>Applyo</h1>
        </div>

        {/* Center: Sliding Pill Switcher */}
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
                : currentDirName ? `Ordner: ${currentDirName}` : 'Lokalen Arbeitsordner wählen'
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
                : currentDirName ? `Ordner: ${currentDirName}` : 'Ordner wählen'}
            </span>
          </button>

          {/* Lebenslauf Editor Button */}
          {onOpenCVEditor && (
            <button
              onClick={onOpenCVEditor}
              className="btn btn-secondary"
              style={{
                height: '38px',
                padding: '0 12px',
                fontSize: '0.8rem',
                gap: '6px',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                color: '#34d399',
              }}
              title="AI Lebenslauf-Editor öffnen"
            >
              <FileText size={15} color="#34d399" />
              <span>Lebenslauf</span>
            </button>
          )}

          {/* Anschreiben Editor Button */}
          {onOpenCoverLetterEditor && (
            <button
              onClick={onOpenCoverLetterEditor}
              className="btn btn-secondary"
              style={{
                height: '38px',
                padding: '0 12px',
                fontSize: '0.8rem',
                gap: '6px',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
              }}
              title="AI Anschreiben-Editor öffnen"
            >
              <Mail size={15} color="#a5b4fc" />
              <span>Anschreiben</span>
            </button>
          )}

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

// ─── Main Navbar export ───────────────────────────────────────────────────────
export const Navbar: React.FC<NavbarProps> = (props) => {
  const { isWCO } = useWindowControlsOverlay();
  return isWCO ? <WCOTitlebar {...props} /> : <StandardNavbar {...props} />;
};
