import React, { useState, useEffect } from 'react';
import { X, Key, Check, Cpu, User, Server, Clock, LayoutGrid, GripVertical, Eye, EyeOff, RotateCcw, ArrowUp, ArrowDown, Bell } from 'lucide-react';
import { AISettings, AIProviderId, DEFAULT_CARD_SECTIONS } from '../types/job';
import { aiService } from '../services/ai/aiService';
import { profileService, UserProfile } from '../services/storage/profileService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsSaved }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'feedback' | 'layout' | 'ai'>('profile');
  const [settings, setSettings] = useState<AISettings>(() => aiService.getSettings());
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    markdownDescription: '',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    async function loadProfile() {
      const loaded = await profileService.getProfile();
      setProfile(loaded);
      setSettings(aiService.getSettings());
    }
    loadProfile();
  }, [isOpen]);

  if (!isOpen) return null;

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

  const cardLayout = settings.cardLayoutConfig || DEFAULT_CARD_SECTIONS;

  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCardIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedCardIndex !== null && draggedCardIndex !== targetIndex) {
      const updated = [...cardLayout];
      const [draggedItem] = updated.splice(draggedCardIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);

      setSettings({ ...settings, cardLayoutConfig: updated });
      setDraggedCardIndex(targetIndex);
    }
  };

  const handleCardDragEnd = () => {
    setDraggedCardIndex(null);
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cardLayout.length) return;

    const updated = [...cardLayout];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);

    setSettings({ ...settings, cardLayoutConfig: updated });
  };

  const toggleCardVisibility = (id: string) => {
    const updated = cardLayout.map((c) =>
      c.id === id ? { ...c, visible: !c.visible } : c
    );
    setSettings({ ...settings, cardLayoutConfig: updated });
  };

  const resetCardLayout = () => {
    setSettings({ ...settings, cardLayoutConfig: DEFAULT_CARD_SECTIONS });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)' }}>
              {activeTab === 'profile' ? <User size={20} /> : activeTab === 'feedback' ? <Clock size={20} /> : activeTab === 'layout' ? <LayoutGrid size={20} /> : <Cpu size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>Einstellungen & Profil</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Globaler Lebenslauf, Rückmeldungen, Karten-Layout & KI-Anbieter
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '120px', gap: '6px', fontSize: '0.8rem' }}
          >
            <User size={15} />
            <span>Lebenslauf</span>
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`btn ${activeTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '120px', gap: '6px', fontSize: '0.8rem' }}
          >
            <Clock size={15} />
            <span>Rückmeldung</span>
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`btn ${activeTab === 'layout' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '100px', gap: '6px', fontSize: '0.8rem' }}
          >
            <LayoutGrid size={15} />
            <span>Layout</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, minWidth: '120px', gap: '6px', fontSize: '0.8rem' }}
          >
            <Cpu size={15} />
            <span>KI Provider</span>
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

        {/* Tab 2: Feedback & Deadline Settings */}
        {activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> Frist für Rückmeldung-Erinnerungen
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                Wenn du bei einer Stelle einträgst, wann du das letzte Mal Rückmeldung bekommen hast, wird automatisch geprüft, wie viel Zeit seitdem vergangen ist. Verstreicht mehr Zeit als unten angegeben, wird der Status auf <strong>"Lange her"</strong> gesetzt.
              </p>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Frist für Status "Lange her" (in Wochen)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    className="input-field"
                    style={{ width: '120px' }}
                    value={settings.feedbackThresholdWeeks ?? 6}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        feedbackThresholdWeeks: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Wochen</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
                  Standardwert: 6 Wochen. Ist die letzte Rückmeldung älter, wird der Badge rot hervorgehoben und als "⚠️ Lange her" dargestellt.
                </span>
              </div>

              {/* System Alert Popups Toggle */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={16} color="var(--accent-cyan)" /> Pop-up Benachrichtigungen (Alerts)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                      Bestätigungs-Popups beim Anlegen, Bearbeiten oder Löschen von Dateien und Stellen.
                    </span>
                  </div>

                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.showSystemAlerts !== false}
                      onChange={(e) => setSettings({ ...settings, showSystemAlerts: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: settings.showSystemAlerts !== false ? '#34d399' : 'var(--text-muted)' }}>
                      {settings.showSystemAlerts !== false ? 'Aktiv' : 'Stumm'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Card Layout Customization */}
        {activeTab === 'layout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LayoutGrid size={16} /> Anordnung der Detail-Karten
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Ziehe eine Karte per Drag & Drop hoch/runter (reagiert sofort) oder nutze die Pfeile ⬆️ ⬇️.
                </span>
              </div>

              <button
                onClick={resetCardLayout}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', gap: '4px', padding: '5px 10px' }}
                title="Kartenanordnung auf Standard zurücksetzen"
              >
                <RotateCcw size={13} />
                <span>Zurücksetzen</span>
              </button>
            </div>

            {/* Drag and drop card list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cardLayout.map((card, idx) => {
                const isDraggingThis = draggedCardIndex === idx;
                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleCardDragStart(e, idx)}
                    onDragOver={(e) => handleCardDragOver(e, idx)}
                    onDragEnd={handleCardDragEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isDraggingThis
                        ? 'rgba(99, 102, 241, 0.25)'
                        : card.visible
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(255, 255, 255, 0.01)',
                      border: isDraggingThis
                        ? '2px solid var(--accent-primary)'
                        : card.visible
                        ? '1px solid var(--border-color)'
                        : '1px dashed rgba(248, 113, 113, 0.3)',
                      boxShadow: isDraggingThis ? '0 10px 30px rgba(99, 102, 241, 0.4)' : 'none',
                      opacity: card.visible ? 1 : 0.5,
                      transform: isDraggingThis ? 'scale(1.02)' : 'scale(1)',
                      cursor: 'grab',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <GripVertical size={20} color={isDraggingThis ? 'var(--accent-cyan)' : 'var(--accent-primary)'} style={{ cursor: 'grab' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', width: '22px' }}>
                          #{idx + 1}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: card.visible ? 'var(--text-main)' : 'var(--text-muted)', display: 'block' }}>
                          {card.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          ID: {card.id}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Move Up / Down Buttons */}
                      <button
                        onClick={() => moveCard(idx, 'up')}
                        disabled={idx === 0}
                        className="btn-icon"
                        style={{ width: '28px', height: '28px', opacity: idx === 0 ? 0.3 : 1 }}
                        title="Nach oben verschieben"
                      >
                        <ArrowUp size={14} />
                      </button>

                      <button
                        onClick={() => moveCard(idx, 'down')}
                        disabled={idx === cardLayout.length - 1}
                        className="btn-icon"
                        style={{ width: '28px', height: '28px', opacity: idx === cardLayout.length - 1 ? 0.3 : 1 }}
                        title="Nach unten verschieben"
                      >
                        <ArrowDown size={14} />
                      </button>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          background: card.visible ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.12)',
                          color: card.visible ? '#34d399' : '#f87171',
                          border: card.visible ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(248, 113, 113, 0.3)',
                          margin: '0 4px',
                        }}
                      >
                        {card.visible ? 'Aktiv' : 'Aus'}
                      </span>

                      <button
                        onClick={() => toggleCardVisibility(card.id)}
                        className="btn-icon"
                        style={{
                          width: '30px',
                          height: '30px',
                          color: card.visible ? '#f87171' : '#34d399',
                          borderColor: card.visible ? 'rgba(248, 113, 113, 0.3)' : 'rgba(52, 211, 153, 0.3)',
                        }}
                        title={card.visible ? 'Karte entfernen / ausblenden' : 'Karte wieder einblenden'}
                      >
                        {card.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: AI Settings */}
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

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    🌐 Optionaler CORS Proxy Server URL (z.B. http://localhost:8080)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="z.B. http://localhost:8080 oder https://applyo-proxy.example.com"
                    value={settings.corsProxyUrl || ''}
                    onChange={(e) => setSettings({ ...settings, corsProxyUrl: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Falls der KI-Server keine Browser-CORS-Header mitsendet, leitet dieser Proxy die Anfragen sicher weiter.
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    🔑 CORS Proxy Auth Token / Secret (Optional)
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Proxy Geheimcode / Token (PROXY_TOKEN Env Var)"
                    value={settings.corsProxyToken || ''}
                    onChange={(e) => setSettings({ ...settings, corsProxyToken: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Falls auf deinem Proxy-Server per PROXY_TOKEN ein Passwort / Token hinterlegt ist.
                  </span>
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
