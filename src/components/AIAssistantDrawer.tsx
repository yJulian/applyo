import React, { useState, useEffect } from 'react';
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
        ? `Hallo! Ich bin dein KI-Bewerbungsassistent für die Stelle **${job.title}** bei **${job.company}**.\nIch habe vollen Zugriff auf deinen Werdegang sowie alle Daten dieser Stelle. Wie kann ich dich heute unterstützen?`
        : 'Hallo! Ich bin dein KI-Karrierelotse. Bitte wähle eine Stelle aus oder stelle mir eine allgemeine Karrierefrage.',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      const response = await aiService.generateAssistantResponse(promptText, job);
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
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center' }}>
              <Sparkles size={18} color="#a5b4fc" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>KI Karrierelotse</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assistent mit vollem Bewerber- & Stellenkontext</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} title="Schließen">
            <X size={16} />
          </button>
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
                onClick={() => handleSendPrompt(`Schreibe ein überzeugendes, professionelles Anschreiben für die Stelle "${job.title}" bei "${job.company}". Beziehe dich dabei genau auf meine Qualifikationen und die Anforderungen.`)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap', gap: '4px' }}
              >
                📝 Anschreiben Entwurf
              </button>
              <button
                onClick={() => handleSendPrompt(`Welche 5 spezifischen Fragen könnte der Interviewer bei "${job.company}" für die Position "${job.title}" stellen? Bitte mit Antwort-Tipps passend zu meinem Werdegang.`)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap', gap: '4px' }}
              >
                🎯 Interview Fragen
              </button>
              <button
                onClick={() => handleSendPrompt(`Analysiere den Match zwischen meinem Nutzerprofil und der Stelle "${job.title}" bei "${job.company}". Wo sind meine größten Stärken und wo gibt es Lücken?`)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap', gap: '4px' }}
              >
                📊 Stärken & Match
              </button>
            </>
          ) : (
            <button
              onClick={() => handleSendPrompt('Gib mir Feedback zu meinem Profil und praktische Tipps für meine Bewerbungsstrategie.')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap' }}
            >
              💡 Karriere-Tipps & Profilcheck
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
              <span>KI Karrierelotse generiert Antwort...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Frage an den KI Karrierelotsen..."
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
