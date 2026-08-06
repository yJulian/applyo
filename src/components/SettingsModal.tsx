import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Key, Check, Cpu, User, Server, Clock, LayoutGrid, GripVertical, Eye, EyeOff, RotateCcw, ArrowUp, ArrowDown, Bell, Globe, Sliders } from 'lucide-react';
import { AISettings, AIProviderId, DEFAULT_CARD_SECTIONS } from '../types/job';
import { aiService } from '../services/ai/aiService';
import { profileService, UserProfile } from '../services/storage/profileService';
import { setApplicationLanguage, getLanguagePreference, getStoredDetectedCountry, LanguagePreference } from '../i18n/config';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (settings: AISettings) => void;
  onOpenLegal?: (tab?: 'impressum' | 'datenschutz') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsSaved, onOpenLegal }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'ui' | 'feedback' | 'ai'>('profile');
  const [settings, setSettings] = useState<AISettings>(() => aiService.getSettings());
  const [currentLangPref, setCurrentLangPref] = useState<LanguagePreference>(() => getLanguagePreference());
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
      setCurrentLangPref(getLanguagePreference());
    }
    loadProfile();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLanguageChange = (pref: LanguagePreference) => {
    setCurrentLangPref(pref);
    setApplicationLanguage(pref);
  };

  const handleSave = async () => {
    aiService.saveSettings(settings);
    await profileService.saveProfile(profile);
    onSettingsSaved(settings);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const cardLayout = settings.cardLayoutConfig && settings.cardLayoutConfig.length > 0
    ? settings.cardLayoutConfig
    : DEFAULT_CARD_SECTIONS;

  const handleCardDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedCardIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleCardDragOver = (e: React.DragEvent<HTMLDivElement>, overIndex: number) => {
    e.preventDefault();
    if (draggedCardIndex === null || draggedCardIndex === overIndex) return;

    const newLayout = [...cardLayout];
    const draggedItem = newLayout[draggedCardIndex];
    newLayout.splice(draggedCardIndex, 1);
    newLayout.splice(overIndex, 0, draggedItem);

    setDraggedCardIndex(overIndex);
    setSettings({ ...settings, cardLayoutConfig: newLayout });
  };

  const handleCardDragEnd = () => {
    setDraggedCardIndex(null);
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cardLayout.length) return;

    const newLayout = [...cardLayout];
    const item = newLayout[index];
    newLayout.splice(index, 1);
    newLayout.splice(targetIdx, 0, item);
    setSettings({ ...settings, cardLayoutConfig: newLayout });
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
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          (e.currentTarget as any)._mouseDownOnBackdrop = true;
        } else {
          (e.currentTarget as any)._mouseDownOnBackdrop = false;
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && (e.currentTarget as any)._mouseDownOnBackdrop) {
          onClose();
        }
        (e.currentTarget as any)._mouseDownOnBackdrop = false;
      }}
    >
      <div className="modal-card glass-panel" style={{ maxWidth: '1000px', width: '95vw', height: '780px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Fixed Header & Navigation Tabs */}
        <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeTab === 'profile' ? <User size={22} style={{ flexShrink: 0 }} /> : activeTab === 'ui' ? <Sliders size={22} style={{ flexShrink: 0 }} /> : activeTab === 'feedback' ? <Clock size={22} style={{ flexShrink: 0 }} /> : <Cpu size={22} style={{ flexShrink: 0 }} />}
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>{t('nav.settings')}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t('settings.profile_tab')} • {t('settings.ui_tab')} • {t('settings.feedback_tab')} • {t('settings.ai_tab')}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="btn-icon">
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '42px',
                width: '100%',
              }}
            >
              <User size={18} style={{ flexShrink: 0 }} />
              <span>{t('settings.profile_tab')}</span>
            </button>

            <button
              onClick={() => setActiveTab('ui')}
              className={`btn ${activeTab === 'ui' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '42px',
                width: '100%',
              }}
            >
              <Sliders size={18} style={{ flexShrink: 0 }} />
              <span>{t('settings.ui_tab')}</span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`btn ${activeTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '42px',
                width: '100%',
              }}
            >
              <Clock size={18} style={{ flexShrink: 0 }} />
              <span>{t('settings.feedback_tab')}</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '42px',
                width: '100%',
              }}
            >
              <Cpu size={18} style={{ flexShrink: 0 }} />
              <span>{t('settings.ai_tab')}</span>
            </button>
          </div>
        </div>

        {/* Inner Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Tab 1: Global Profile & Resume in Markdown */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Contact Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.full_name')}
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
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.email')}
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
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.phone')}
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
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.location')}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Berlin, Deutschland"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.address')}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Musterstraße 12, 10115 Berlin"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.citizenship')}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="z.B. Deutsch, Österreichisch"
                  value={profile.citizenship || ''}
                  onChange={(e) => setProfile({ ...profile, citizenship: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.linkedin')}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="linkedin.com/in/profil"
                  value={profile.linkedin || ''}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.github')}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="github.com/profil"
                  value={profile.github || ''}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.xing')}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="xing.com/profile/name"
                  value={profile.xing || ''}
                  onChange={(e) => setProfile({ ...profile, xing: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.website')}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://deine-website.de"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                />
              </div>
            </div>

            {/* Global Personal Description & Resume (.md) */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                {t('settings.profile_markdown')}
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                {t('settings.profile_markdown_desc')}
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

        {/* Tab 2: UI & Benutzeroberfläche (Language, Alerts, Card Layout) */}
        {activeTab === 'ui' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. Language Settings */}
            <div
              className="glass-panel"
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} style={{ flexShrink: 0 }} /> {t('settings.language')}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                {t('settings.lang_desc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: currentLangPref === 'auto' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${currentLangPref === 'auto' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="appLanguage"
                    value="auto"
                    checked={currentLangPref === 'auto'}
                    onChange={() => handleLanguageChange('auto')}
                    style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      🌐 {t('settings.lang_auto')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {t('settings.lang_auto_desc')}
                      {getStoredDetectedCountry() && (
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                          ({t('settings.detected_country')}: {getStoredDetectedCountry()})
                        </span>
                      )}
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: currentLangPref === 'de' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${currentLangPref === 'de' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="appLanguage"
                    value="de"
                    checked={currentLangPref === 'de'}
                    onChange={() => handleLanguageChange('de')}
                    style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      🇩🇪 Deutsch
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {t('settings.lang_de')}
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: currentLangPref === 'en' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${currentLangPref === 'en' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="appLanguage"
                    value="en"
                    checked={currentLangPref === 'en'}
                    onChange={() => handleLanguageChange('en')}
                    style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      🇬🇧 English
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {t('settings.lang_en')}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. System Alert Popups Toggle */}
            <div
              className="glass-panel"
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} /> {t('settings.alerts_title')}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {t('settings.alerts_desc')}
                </span>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.showSystemAlerts !== false}
                  onChange={(e) => setSettings({ ...settings, showSystemAlerts: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: settings.showSystemAlerts !== false ? '#34d399' : 'var(--text-muted)' }}>
                  {settings.showSystemAlerts !== false ? t('settings.alerts_active') : t('settings.alerts_muted')}
                </span>
              </label>
            </div>

            {/* 3. Card Layout Customization */}
            <div
              className="glass-panel"
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <LayoutGrid size={18} style={{ flexShrink: 0 }} /> {t('settings.card_layout_title')}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    {t('settings.card_layout_desc')}
                  </span>
                </div>

                <button
                  onClick={resetCardLayout}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', gap: '6px', padding: '6px 12px' }}
                  title={t('settings.reset_title')}
                >
                  <RotateCcw size={14} style={{ flexShrink: 0 }} />
                  <span>{t('settings.reset')}</span>
                </button>
              </div>

              {/* Drag and drop card list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cardLayout.map((card, idx) => {
                  const isDraggingThis = draggedCardIndex === idx;
                  const localizedTitle = t(`card_sections.${card.id}`, { defaultValue: card.title });
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <GripVertical size={20} color={isDraggingThis ? 'var(--accent-cyan)' : 'var(--accent-primary)'} style={{ cursor: 'grab', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', width: '24px' }}>
                            #{idx + 1}
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: card.visible ? 'var(--text-main)' : 'var(--text-muted)', display: 'block' }}>
                            {localizedTitle}
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
                          title={t('settings.move_up')}
                        >
                          <ArrowUp size={14} style={{ flexShrink: 0 }} />
                        </button>

                        <button
                          onClick={() => moveCard(idx, 'down')}
                          disabled={idx === cardLayout.length - 1}
                          className="btn-icon"
                          style={{ width: '28px', height: '28px', opacity: idx === cardLayout.length - 1 ? 0.3 : 1 }}
                          title={t('settings.move_down')}
                        >
                          <ArrowDown size={14} style={{ flexShrink: 0 }} />
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
                          {card.visible ? t('settings.active') : t('settings.off')}
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
                          title={card.visible ? t('settings.hide_card') : t('settings.show_card')}
                        >
                          {card.visible ? <EyeOff size={14} style={{ flexShrink: 0 }} /> : <Eye size={14} style={{ flexShrink: 0 }} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Feedback & Deadline Settings */}
        {activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ flexShrink: 0 }} /> {t('settings.feedback_deadline_title')}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                {t('settings.feedback_deadline_desc')}
              </p>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  {t('settings.feedback_threshold')}
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
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('settings.weeks')}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
                  {t('settings.feedback_threshold_desc')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: AI Settings */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Active Provider Selector */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                {t('settings.ai_provider')}
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
                <Server size={15} /> {t('settings.custom_openai_title')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t('settings.base_url')}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="z.B. https://ki-toolbox.scc.kit.edu/api/v1 oder http://localhost:11434/v1"
                    value={settings.customOpenaiBaseUrl}
                    onChange={(e) => setSettings({ ...settings, customOpenaiBaseUrl: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#a5b4fc', display: 'block', marginBottom: '3px' }}>
                      {t('settings.fast_model')}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="z.B. llama-3.3-70b-instruct"
                      value={settings.customOpenaiModelFast || settings.customOpenaiModel || ''}
                      onChange={(e) => setSettings({ ...settings, customOpenaiModelFast: e.target.value, customOpenaiModel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'block', marginBottom: '3px' }}>
                      {t('settings.gen_model')}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="z.B. qwen2.5-coder-32b-instruct"
                      value={settings.customOpenaiModelGen || settings.customOpenaiModel || ''}
                      onChange={(e) => setSettings({ ...settings, customOpenaiModelGen: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t('settings.optional_key')}
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
                    {t('settings.cors_proxy')}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="z.B. http://localhost:8080 oder https://applyo-proxy.example.com"
                    value={settings.corsProxyUrl || ''}
                    onChange={(e) => setSettings({ ...settings, corsProxyUrl: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    {t('settings.cors_proxy_desc')}
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    {t('settings.cors_token')}
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Proxy Geheimcode / Token (PROXY_TOKEN Env Var)"
                    value={settings.corsProxyToken || ''}
                    onChange={(e) => setSettings({ ...settings, corsProxyToken: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    {t('settings.cors_token_desc')}
                  </span>
                </div>
              </div>
            </div>

            {/* Google Gemini Config */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} /> {t('settings.gemini_title')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Gemini API Key (AIzaSy...)"
                  value={settings.geminiKey}
                  onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#a5b4fc', display: 'block', marginBottom: '3px' }}>
                      {t('settings.fast_model')}
                    </label>
                    <select
                      className="input-field"
                      value={settings.geminiModelFast || settings.geminiModel || 'gemini-2.0-flash'}
                      onChange={(e) => setSettings({ ...settings, geminiModelFast: e.target.value, geminiModel: e.target.value })}
                    >
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'block', marginBottom: '3px' }}>
                      {t('settings.gen_model')}
                    </label>
                    <select
                      className="input-field"
                      value={settings.geminiModelGen || settings.geminiModel || 'gemini-2.0-flash'}
                      onChange={(e) => setSettings({ ...settings, geminiModelGen: e.target.value })}
                    >
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* OpenAI Config */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} /> {t('settings.openai_title')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="OpenAI API Key (sk-...)"
                  value={settings.openaiKey}
                  onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#a5b4fc', display: 'block', marginBottom: '3px' }}>
                      {t('settings.fast_model')}
                    </label>
                    <select
                      className="input-field"
                      value={settings.openaiModelFast || settings.openaiModel || 'gpt-4o-mini'}
                      onChange={(e) => setSettings({ ...settings, openaiModelFast: e.target.value, openaiModel: e.target.value })}
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gpt-4o">gpt-4o</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'block', marginBottom: '3px' }}>
                      {t('settings.gen_model')}
                    </label>
                    <select
                      className="input-field"
                      value={settings.openaiModelGen || settings.openaiModel || 'gpt-4o'}
                      onChange={(e) => setSettings({ ...settings, openaiModelGen: e.target.value })}
                    >
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Anthropic Claude Config */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} /> {t('settings.claude_title')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Claude API Key (sk-ant-...)"
                  value={settings.claudeKey}
                  onChange={(e) => setSettings({ ...settings, claudeKey: e.target.value })}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#a5b4fc', display: 'block', marginBottom: '3px' }}>
                      {t('settings.fast_model')}
                    </label>
                    <select
                      className="input-field"
                      value={settings.claudeModelFast || settings.claudeModel || 'claude-haiku-4-5-20251001'}
                      onChange={(e) => setSettings({ ...settings, claudeModelFast: e.target.value, claudeModel: e.target.value })}
                    >
                      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                      <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'block', marginBottom: '3px' }}>
                      {t('settings.gen_model')}
                    </label>
                    <select
                      className="input-field"
                      value={settings.claudeModelGen || settings.claudeModel || 'claude-sonnet-4-5-20251001'}
                      onChange={(e) => setSettings({ ...settings, claudeModelGen: e.target.value })}
                    >
                      <option value="claude-sonnet-4-5-20251001">Claude Sonnet 4.5</option>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>

        {/* Fixed Footer */}
        <div style={{ padding: '14px 24px 18px 24px', borderTop: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.4)', flexShrink: 0 }}>
          {/* Save Footer */}
          <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%', gap: '8px', padding: '12px' }}>
            {savedSuccess ? (
              <>
                <Check size={18} />
                <span>{t('settings.saved')}</span>
              </>
            ) : (
              <span>{t('settings.save')}</span>
            )}
          </button>

          {/* Legal Links Footer */}
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <button
              onClick={() => onOpenLegal?.('impressum')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {t('sidebar.impressum')}
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal?.('datenschutz')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {t('sidebar.datenschutz')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
