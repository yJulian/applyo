import React from 'react';
import { Folder, FolderCheck, Plus, Settings, Sparkles, Briefcase } from 'lucide-react';
import { AISettings } from '../types/job';

interface NavbarProps {
  currentDirName: string | null;
  onSelectDirectory: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  aiSettings: AISettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDirName,
  onSelectDirectory,
  onOpenAddModal,
  onOpenSettingsModal,
  aiSettings,
}) => {
  const providerNames: Record<string, string> = {
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    claude: 'Anthropic Claude',
  };

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '14px 24px', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
          }}>
            <Briefcase size={22} color="#ffffff" />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.4rem', lineHeight: 1.1 }}>Applyo</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              PWA Management & KI Assistant
            </span>
          </div>
        </div>

        {/* Center: Directory Picker Indicator */}
        <button
          onClick={onSelectDirectory}
          className="btn btn-secondary"
          style={{ gap: '10px', padding: '8px 16px', borderRadius: '20px' }}
          title="Lokalen Arbeitsordner auswählen oder wechseln"
        >
          {currentDirName ? (
            <>
              <FolderCheck size={18} color="#10b981" />
              <span>Ordner: <strong style={{ color: 'var(--text-main)' }}>{currentDirName}</strong></span>
            </>
          ) : (
            <>
              <Folder size={18} color="#6366f1" />
              <span style={{ color: '#a5b4fc' }}>Lokalen Ordner wählen</span>
            </>
          )}
        </button>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenSettingsModal}
            className="btn btn-secondary"
            style={{ gap: '8px', fontSize: '0.85rem' }}
            title="KI Provider & API Key Einstellungen"
          >
            <Sparkles size={16} color="#c084fc" />
            <span>KI: {providerNames[aiSettings.activeProvider]}</span>
            <Settings size={15} style={{ marginLeft: '4px', opacity: 0.7 }} />
          </button>

          <button onClick={onOpenAddModal} className="btn btn-primary">
            <Plus size={18} />
            <span>Stelle hinzufügen</span>
          </button>
        </div>
      </div>
    </header>
  );
};
