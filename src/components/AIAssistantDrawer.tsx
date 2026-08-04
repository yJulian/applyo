import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Send, Bot, Copy, Check, Briefcase, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { JobMetadata } from '../types/job';
import { aiService } from '../services/ai/aiService';
import { profileService, UserProfile } from '../services/storage/profileService';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobMetadata | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose, job }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      profileService.getProfile().then((p) => setProfile(p));
    }
  }, [isOpen]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: job
        ? t('ai_assistant.welcome_job', { title: job.title, company: job.company })
        : t('ai_assistant.welcome_general'),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modelMode, setModelMode] = useState<'fast' | 'generation'>('generation');

  if (!isOpen) return null;

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: promptText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    try {
      const response = await aiService.generateAssistantResponse(promptText, job, null, modelMode);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: `⚠️ Fehler: ${err.message || 'Die KI-Antwort konnte nicht generiert werden.'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentSettings = aiService.getSettings();
  const activeConfig = aiService.getConfigForProvider(currentSettings.activeProvider, currentSettings, modelMode);
  const activeModelName = activeConfig.model;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(titlebar-area-height, 0px))',
        left: 0,
        right: 0,
        bottom: 0,
        height: 'calc(100vh - env(titlebar-area-height, 0px))',
        background: 'rgba(5, 8, 15, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9900,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          borderRadius: 0,
          borderRight: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: '1px solid rgba(99, 102, 241, 0.3)',
          background: 'rgba(11, 16, 26, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.7)',
          animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Sparkles size={18} color="#a5b4fc" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>KI Karrierelotse</h3>
              <span style={{ fontSize: '0.7rem', color: '#a5b4fc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                Modell: <strong>{activeModelName}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Model Mode Segment Toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', padding: '2px', borderRadius: '8px', gap: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setModelMode('fast')}
                className={`btn ${modelMode === 'fast' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', fontSize: '0.72rem', border: 'none', borderRadius: '6px' }}
                title="Schnelles Extraktionsmodell"
              >
                ⚡ Schnell
              </button>
              <button
                onClick={() => setModelMode('generation')}
                className={`btn ${modelMode === 'generation' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', fontSize: '0.72rem', border: 'none', borderRadius: '6px' }}
                title="Starkes Generierungsmodell"
              >
                🧠 Stark
              </button>
            </div>

            <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} title="Schließen">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Active Context Banner */}
        <div style={{ padding: '8px 16px', background: 'rgba(99, 102, 241, 0.06)', borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <tbody>
              <tr>
                <td style={{ width: '115px', padding: '2px 0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a5b4fc', fontWeight: 600 }}>
                    <Briefcase size={13} style={{ flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>Stelle:</span>
                  </div>
                </td>
                <td style={{ padding: '2px 0', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: job ? '#ffffff' : 'var(--text-dim)', fontWeight: 500 }}>
                  {job ? `${job.title} (${job.company})` : 'Keine Stelle ausgewählt'}
                </td>
              </tr>
              <tr>
                <td style={{ width: '115px', padding: '2px 0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 600 }}>
                    <User size={13} style={{ flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>Nutzerprofil:</span>
                  </div>
                </td>
                <td style={{ padding: '2px 0', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: profile ? '#38bdf8' : 'var(--text-dim)', fontWeight: 500 }}>
                  {profile?.fullName || 'Profil geladen'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Quick Action Chips */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {job ? (
            <>
              <button
                onClick={() => handleSendPrompt(t('ai_assistant.prompt_cover_letter', { title: job.title, company: job.company }))}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap', gap: '4px' }}
              >
                {t('ai_assistant.chip_cover_letter')}
              </button>
              <button
                onClick={() => handleSendPrompt(t('ai_assistant.prompt_interview', { title: job.title, company: job.company }))}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap', gap: '4px' }}
              >
                {t('ai_assistant.chip_interview')}
              </button>
              <button
                onClick={() => handleSendPrompt(t('ai_assistant.prompt_strengths', { title: job.title, company: job.company }))}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap', gap: '4px' }}
              >
                {t('ai_assistant.chip_strengths')}
              </button>
            </>
          ) : (
            <button
              onClick={() => handleSendPrompt(t('ai_assistant.prompt_career_tips'))}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap' }}
            >
              {t('ai_assistant.chip_career_tips')}
            </button>
          )}
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  background: isUser ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255,255,255,0.05)',
                  color: isUser ? '#ffffff' : 'var(--text-main)',
                  padding: '12px 16px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  position: 'relative',
                  border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isUser ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {!isUser && (
                  <button
                    onClick={() => handleCopyText(m.id, m.text)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Kopieren"
                  >
                    {copiedId === m.id ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                  </button>
                )}
                {isUser ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                ) : (
                  <div className="markdown-preview-container ai-chat-markdown" style={{ paddingRight: '20px' }}>
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}

          {isGenerating && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '12px' }}>
              <Bot size={16} color="var(--accent-primary)" />
              <span>{t('ai_assistant.generating')}</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
          <input
            type="text"
            className="input-field"
            placeholder={t('ai_assistant.input_placeholder')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(inputText)}
            style={{ flex: 1 }}
          />
          <button onClick={() => handleSendPrompt(inputText)} disabled={isGenerating || !inputText.trim()} className="btn btn-primary" style={{ padding: '0 16px' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
