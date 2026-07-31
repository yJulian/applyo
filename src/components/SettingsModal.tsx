import React, { useState } from 'react';
import { X, Key, Check, Cpu } from 'lucide-react';
import { AISettings, AIProviderId } from '../types/job';
import { aiService } from '../services/ai/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsSaved }) => {
  if (!isOpen) return null;

  const [settings, setSettings] = useState<AISettings>(aiService.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    aiService.saveSettings(settings);
    onSettingsSaved(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', color: 'var(--accent-secondary)' }}>
              <Cpu size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>KI Modell & API Einstellungen</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Wähle deinen präferierten KI-Anbieter (OpenAI, Google Gemini oder Claude)
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Active Provider Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
            Aktiver KI-Anbieter für Extraktion & Assistent:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { id: 'gemini', name: 'Google Gemini' },
              { id: 'openai', name: 'OpenAI' },
              { id: 'claude', name: 'Anthropic Claude' },
            ].map((p) => {
              const isActive = settings.activeProvider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSettings({ ...settings, activeProvider: p.id as AIProviderId })}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '10px 6px', textAlign: 'center' }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />

        {/* Provider Config Tabs / Accordions */}

        {/* Google Gemini Config */}
        <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={14} /> Google Gemini Konfiguration
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="password"
              className="input-field"
              placeholder="Gemini API Key (AIzaSy...)"
              value={settings.geminiKey}
              onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
            />
            <select
              className="input-field"
              value={settings.geminiModel}
              onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
            >
              <option value="gemini-2.0-flash">Modell: gemini-2.0-flash (Sehr schnell & präzise)</option>
              <option value="gemini-1.5-pro">Modell: gemini-1.5-pro (Maximale Intelligenz)</option>
            </select>
          </div>
        </div>

        {/* OpenAI Config */}
        <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={14} /> OpenAI Konfiguration
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="password"
              className="input-field"
              placeholder="OpenAI API Key (sk-...)"
              value={settings.openaiKey}
              onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
            />
            <select
              className="input-field"
              value={settings.openaiModel}
              onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
            >
              <option value="gpt-4o-mini">Modell: gpt-4o-mini (Kostengünstig & schnell)</option>
              <option value="gpt-4o">Modell: gpt-4o (Leistungsstark)</option>
            </select>
          </div>
        </div>

        {/* Anthropic Claude Config */}
        <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={14} /> Anthropic Claude Konfiguration
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="password"
              className="input-field"
              placeholder="Claude API Key (sk-ant-...)"
              value={settings.claudeKey}
              onChange={(e) => setSettings({ ...settings, claudeKey: e.target.value })}
            />
            <select
              className="input-field"
              value={settings.claudeModel}
              onChange={(e) => setSettings({ ...settings, claudeModel: e.target.value })}
            >
              <option value="claude-haiku-4-5-20251001">Modell: Claude Haiku 4.5 (Empfohlen - Schnell & Präzise)</option>
              <option value="claude-3-5-sonnet-20241022">Modell: Claude 3.5 Sonnet (Hervorragende Anschreiben)</option>
              <option value="claude-3-5-haiku-20241022">Modell: Claude 3.5 Haiku</option>
            </select>
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%', gap: '8px', padding: '12px' }}>
          {savedSuccess ? (
            <>
              <Check size={18} />
              <span>Einstellungen gespeichert!</span>
            </>
          ) : (
            <span>Speichern</span>
          )}
        </button>
      </div>
    </div>
  );
};
