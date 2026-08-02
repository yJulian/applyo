import React from 'react';
import { Folder, FolderCheck, Plus, Settings, Briefcase, Unlock, LayoutList, Kanban } from 'lucide-react';
import { AISettings } from '../types/job';

interface NavbarProps {
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
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
  aiSettings,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '12px 24px', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              PWA Management & KI Assistant
            </span>
          </div>
        </div>

        {/* Center: View Switcher (List vs Board) & Directory Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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

          {/* Directory Status / Picker */}
          {needsPermission && currentDirName ? (
            <button
              onClick={onGrantPermission}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: '20px',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                fontSize: '0.8rem',
              }}
              title="Klicke hier, um dem Browser den Zugriff auf den Ordner wieder freizugeben"
            >
              <Unlock size={15} />
              <span>Zugriff auf '<strong>{currentDirName}</strong>' freigeben</span>
            </button>
          ) : (
            <button
              onClick={onSelectDirectory}
              className="btn btn-secondary"
              style={{ gap: '8px', padding: '7px 14px', borderRadius: '20px', fontSize: '0.8rem' }}
              title="Lokalen Arbeitsordner auswählen oder wechseln"
            >
              {currentDirName ? (
                <>
                  <FolderCheck size={16} color="#10b981" />
                  <span>Ordner: <strong style={{ color: 'var(--text-main)' }}>{currentDirName}</strong></span>
                </>
              ) : (
                <>
                  <Folder size={16} color="#6366f1" />
                  <span style={{ color: '#a5b4fc' }}>Ordner wählen</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: Settings & Add */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenSettingsModal}
            className="btn btn-secondary"
            style={{ gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
            title={`Einstellungen & Profil (KI-Provider: ${aiSettings.activeProvider.toUpperCase()})`}
          >
            <Settings size={15} color="#c084fc" />
            <span>Settings</span>
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
