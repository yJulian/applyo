import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, Copy, Check } from 'lucide-react';
import { JobMetadata } from '../types/job';
import { aiService } from '../services/ai/aiService';

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
  if (!isOpen) return null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: job
        ? `Hallo! Ich bin dein KI-Bewerbungsassistent für die Stelle **${job.title}** bei **${job.company}**.\nWie kann ich dich heute unterstützen?`
        : 'Hallo! Bitte wähle eine Stelle aus, um maßgeschneiderte Unterstützung zu erhalten.',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        inset: 0,
        background: 'rgba(5, 8, 15, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          borderRadius: 0,
          borderRight: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1rem' }}>KI Karrierelotse</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Quick Action Chips */}
        {job && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
            <button
              onClick={() => handleSendPrompt(`Schreibe ein überzeugendes, professionelles Anschreiben für die Stelle "${job.title}" bei "${job.company}". Beziehe dich dabei genau auf die Anforderungen und Aufgaben.`)}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap' }}
            >
              📝 Anschreiben Entwurf
            </button>
            <button
              onClick={() => handleSendPrompt(`Welche 5 spezifischen Fragen könnte der Interviewer bei "${job.company}" für die Position "${job.title}" stellen? Bitte inklusive kurzer Antwort-Tipps.`)}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '14px', whiteSpace: 'nowrap' }}
            >
              🎯 Interview Fragen
            </button>
          </div>
        )}

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: isUser ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                  color: isUser ? '#ffffff' : 'var(--text-main)',
                  padding: '12px 14px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  position: 'relative',
                  border: isUser ? 'none' : '1px solid var(--border-color)',
                }}
              >
                {!isUser && (
                  <button
                    onClick={() => handleCopyText(m.id, m.text)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                    title="Kopieren"
                  >
                    {copiedId === m.id ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  </button>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              </div>
            );
          })}

          {isGenerating && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bot size={16} color="var(--accent-primary)" />
              <span>KI antwortet...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Frage stellen..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(inputText)}
          />
          <button onClick={() => handleSendPrompt(inputText)} disabled={isGenerating} className="btn btn-primary" style={{ padding: '0 14px' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
