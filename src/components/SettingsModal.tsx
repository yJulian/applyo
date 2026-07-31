import React, { useState, useEffect } from 'react';
import { X, Key, Check, Cpu, User, Server } from 'lucide-react';
import { AISettings, AIProviderId } from '../types/job';
import { aiService } from '../services/ai/aiService';
import { profileService, UserProfile } from '../services/storage/profileService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsSaved }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'ai'>('profile');
  const [settings, setSettings] = useState<AISettings>(aiService.getSettings());
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    markdownDescription: '',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const loaded = await profileService.getProfile();
      setProfile(loaded);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    aiService.saveSettings(settings);
    onSettingsSaved(settings);

    await profileService.saveProfile(profile);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)' }}>
              {activeTab === 'profile' ? <User size={20} /> : <Cpu size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>Einstellungen & Profil</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Globaler Lebenslauf & KI-Anbieter / Custom Endpunkte konfigurieren
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, gap: '6px', fontSize: '0.85rem' }}
          >
            <User size={16} />
            <span>👤 Globaler Lebenslauf</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, gap: '6px', fontSize: '0.85rem' }}
          >
            <Cpu size={16} />
            <span>⚙️ KI Provider & Custom API</span>
          </button>
        </div>

        {/* Tab 1: Global Profile & Resume in Markdown */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Contact Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Vollständiger Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="z.B. Max Mustermann"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  E-Mail Adresse
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="max@beispiel.de"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Telefonnummer
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="+49 170 1234567"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Wohnort / Standort
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Berlin, Deutschland"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>
            </div>

            {/* Global Personal Description & Resume (.md) */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Globaler Lebenslauf & Profil (Markdown)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Trage hier deinen Werdegang, deine bisherigen Stationen, Kenntnisse und Projekte als Markdown ein. Auf dieser Basis kann die KI für jede Stelle eine angepasste <strong>Lebenslauf.md</strong> im jeweiligen Ordner erzeugen.
              </span>
              <textarea
                className="input-field"
                rows={12}
                placeholder="# Mein Lebenslauf&#10;&#10;## Persönliche Zusammenfassung&#10;Erfahrener Entwickler...&#10;&#10;## Berufserfahrung&#10;### Senior Frontend Engineer bei Firma X (2021 - Heute)&#10;- Entwicklung von React/TypeScript PWAs...&#10;&#10;## Ausbildung & Kenntnisse&#10;- B.Sc. Informatik&#10;- Tech Stack: React, TypeScript, Node.js, Git"
                value={profile.markdownDescription}
                onChange={(e) => setProfile({ ...profile, markdownDescription: e.target.value })}
                style={{ fontFamily: 'monospace', fontSize: '0.825rem', lineHeight: 1.5, resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: AI Settings */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
            {/* Active Provider Selector */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                Aktiver KI-Anbieter für Extraktion, Assistent & Lebenslauf-Anpassung:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { id: 'gemini', name: 'Google Gemini' },
                  { id: 'openai', name: 'OpenAI' },
                  { id: 'claude', name: 'Anthropic Claude' },
                  { id: 'custom_openai', name: 'Custom OpenAI (Local/Ollama)' },
                ].map((p) => {
                  const isActive = settings.activeProvider === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSettings({ ...settings, activeProvider: p.id as AIProviderId })}
                      className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.8rem', padding: '10px 8px', textAlign: 'center' }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-color)', margin: '10px 0' }} />

            {/* Custom OpenAI Endpoint Config */}
            <div
              style={{
                background: settings.activeProvider === 'custom_openai' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255,255,255,0.02)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: settings.activeProvider === 'custom_openai' ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ fontSize: '0.9rem', color: '#34d399', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={15} /> Custom OpenAI-Kompatibler Endpunkt (Ollama, OpenRouter, LM Studio)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Base URL / API Endpunkt
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="z.B. https://ki-toolbox.scc.kit.edu/api/v1 oder http://localhost:11434/v1"
                    value={settings.customOpenaiBaseUrl}
                    onChange={(e) => setSettings({ ...settings, customOpenaiBaseUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Modell Name (Freitext-Eingabe)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="z.B. azure.gpt-4.1-mini, gpt-oss:120b, llama-3.3-70b-instruct"
                    value={settings.customOpenaiModel}
                    onChange={(e) => setSettings({ ...settings, customOpenaiModel: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    API Key (Optional bei lokalen Servern wie Ollama)
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="API Key falls erforderlich (z.B. sk-or-v1-...)"
                    value={settings.customOpenaiKey}
                    onChange={(e) => setSettings({ ...settings, customOpenaiKey: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Google Gemini Config */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
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
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
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
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
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
                  <option value="claude-haiku-4-5-20251001">Modell: Claude Haiku 4.5 (Empfohlen)</option>
                  <option value="claude-3-5-sonnet-20241022">Modell: Claude 3.5 Sonnet</option>
                  <option value="claude-3-5-haiku-20241022">Modell: Claude 3.5 Haiku</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Save Footer */}
        <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%', gap: '8px', padding: '12px', marginTop: '16px' }}>
          {savedSuccess ? (
            <>
              <Check size={18} />
              <span>Einstellungen & Profil gespeichert!</span>
            </>
          ) : (
            <span>Speichern</span>
          )}
        </button>
      </div>
    </div>
  );
};
