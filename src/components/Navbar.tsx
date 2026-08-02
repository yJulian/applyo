import React, { useState } from 'react';
import { Folder, FolderCheck, Plus, Settings, Briefcase, Unlock, LayoutList, Kanban, FileText } from 'lucide-react';
import { AISettings } from '../types/job';

interface NavbarProps {
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenCVEditor: () => void;
  aiSettings: AISettings;
  viewMode: 'list' | 'board';
  onViewModeChange: (mode: 'list' | 'board') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDirName,
  needsPermission,
  onSelectDirectory,
  onGrantPermission,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenCVEditor,
  aiSettings,
  viewMode,
  onViewModeChange,
}) => {
  const [isFolderHovered, setIsFolderHovered] = useState(false);
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '12px 24px', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', position: 'relative' }}>
        {/* Left: Brand & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
          }}>
            <Briefcase size={20} color="#ffffff" />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.35rem', lineHeight: 1.1 }}>Applyo</h1>
          </div>
        </div>

        {/* Center: View Switcher (List vs Board) - Absolutely Centered */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
          {/* Segmented View Switcher */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => onViewModeChange('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'list' ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: viewMode === 'list' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s ease',
              }}
              title="Listenansicht"
            >
              <LayoutList size={15} />
              <span>Liste</span>
            </button>

            <button
              onClick={() => onViewModeChange('board')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === 'board' ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' : 'transparent',
                color: viewMode === 'board' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: viewMode === 'board' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s ease',
              }}
              title="Kanban Board Ansicht"
            >
              <Kanban size={15} />
              <span>Board</span>
            </button>
          </div>
        </div>

        {/* Right: Directory, Settings & Add Job */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Expandable Directory Button */}
          <button
            onClick={needsPermission && currentDirName ? onGrantPermission : onSelectDirectory}
            onMouseEnter={() => setIsFolderHovered(true)}
            onMouseLeave={() => setIsFolderHovered(false)}
            style={{
              height: '38px',
              minWidth: '38px',
              borderRadius: '19px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: isFolderHovered ? '14px' : '11px',
              paddingRight: isFolderHovered ? '14px' : '11px',
              background: needsPermission && currentDirName
                ? isFolderHovered
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'rgba(245, 158, 11, 0.15)'
                : currentDirName
                ? isFolderHovered
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(16, 185, 129, 0.1)'
                : isFolderHovered
                ? 'rgba(99, 102, 241, 0.2)'
                : 'rgba(99, 102, 241, 0.1)',
              border: needsPermission && currentDirName
                ? '1px solid rgba(245, 158, 11, 0.5)'
                : currentDirName
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: needsPermission && currentDirName
                ? '0 0 12px rgba(245, 158, 11, 0.3)'
                : 'none',
              cursor: 'pointer',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title={
              needsPermission && currentDirName
                ? `Zugriff auf '${currentDirName}' freigeben`
                : currentDirName
                ? `Ordner: ${currentDirName}`
                : 'Lokalen Arbeitsordner wählen'
            }
          >
            {needsPermission && currentDirName ? (
              <Unlock size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            ) : currentDirName ? (
              <FolderCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
            ) : (
              <Folder size={16} color="#6366f1" style={{ flexShrink: 0 }} />
            )}

            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: needsPermission && currentDirName
                  ? '#f59e0b'
                  : currentDirName
                  ? '#34d399'
                  : '#a5b4fc',
                whiteSpace: 'nowrap',
                maxWidth: isFolderHovered ? '260px' : '0px',
                opacity: isFolderHovered ? 1 : 0,
                marginLeft: isFolderHovered ? '8px' : '0px',
                overflow: 'hidden',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'inline-block',
                verticalAlign: 'middle',
              }}
            >
              {needsPermission && currentDirName
                ? `Zugriff auf '${currentDirName}' freigeben`
                : currentDirName
                ? `Ordner: ${currentDirName}`
                : 'Ordner wählen'}
            </span>
          </button>

          {/* Expandable Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            onMouseEnter={() => setIsSettingsHovered(true)}
            onMouseLeave={() => setIsSettingsHovered(false)}
            style={{
              height: '38px',
              minWidth: '38px',
              borderRadius: '19px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: isSettingsHovered ? '14px' : '11px',
              paddingRight: isSettingsHovered ? '14px' : '11px',
              background: isSettingsHovered ? 'rgba(192, 132, 252, 0.2)' : 'rgba(192, 132, 252, 0.1)',
              border: '1px solid rgba(192, 132, 252, 0.4)',
              cursor: 'pointer',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title={`Einstellungen & Profil (KI-Provider: ${aiSettings.activeProvider.toUpperCase()})`}
          >
            <Settings size={16} color="#c084fc" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#c084fc',
                whiteSpace: 'nowrap',
                maxWidth: isSettingsHovered ? '100px' : '0px',
                opacity: isSettingsHovered ? 1 : 0,
                marginLeft: isSettingsHovered ? '8px' : '0px',
                overflow: 'hidden',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'inline-block',
                verticalAlign: 'middle',
              }}
            >
              Settings
            </span>
          </button>

          {/* CV Editor Button */}
          <button
            onClick={onOpenCVEditor}
            className="btn btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.825rem',
              gap: '6px',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
            }}
            title="AI Lebenslauf Editor öffnen & PDF erstellen"
          >
            <FileText size={16} color="#34d399" />
            <span>Lebenslauf Editor</span>
          </button>

          <button onClick={onOpenAddModal} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.825rem' }}>
            <Plus size={16} />
            <span>Stelle hinzufügen</span>
          </button>
        </div>
      </div>
    </header>
  );
};
