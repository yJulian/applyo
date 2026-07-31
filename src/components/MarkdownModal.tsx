import React, { useState, useEffect } from 'react';
import { X, Eye, Edit3, Save, Check, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fileSystemService } from '../services/storage/fileSystem';
import { JobMetadata } from '../types/job';

interface MarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobMetadata | null;
  fileName: string | null;
  onFileSaved?: () => void;
}

export const MarkdownModal: React.FC<MarkdownModalProps> = ({
  isOpen,
  onClose,
  job,
  fileName,
  onFileSaved,
}) => {
  if (!isOpen || !job || !fileName) return null;

  const [activeTab, setActiveTab] = useState<'viewer' | 'editor'>('viewer');
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      const text = await fileSystemService.readTextFile(job!, fileName!);
      setContent(text);
      setIsLoading(false);
    }
    loadContent();
  }, [job, fileName]);

  const handleSave = async () => {
    if (!job || !fileName) return;
    setIsSaving(true);
    const success = await fileSystemService.writeTextFile(job, fileName, content);
    setIsSaving(false);

    if (success) {
      setSaveSuccess(true);
      if (onFileSaved) onFileSaved();
      setTimeout(() => setSaveSuccess(false), 2000);
    } else {
      alert('Fehler beim Speichern der Datei.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', width: '90vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
            <FileText size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }} title={fileName}>
              {fileName}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                background: 'rgba(255,255,255,0.05)',
                padding: '2px 10px',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '360px',
                display: 'inline-block'
              }}
              title={`${job.company} / ${job.title}`}
            >
              {job.company} / {job.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Tab Buttons */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px' }}>
              <button
                onClick={() => setActiveTab('viewer')}
                className={`btn ${activeTab === 'viewer' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '0.8rem', border: 'none', gap: '4px' }}
              >
                <Eye size={14} />
                <span>Vorschau</span>
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`btn ${activeTab === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '0.8rem', border: 'none', gap: '4px' }}
              >
                <Edit3 size={14} />
                <span>Bearbeiten</span>
              </button>
            </div>

            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 4px', minHeight: '360px' }}>
          {isLoading ? (
            <p style={{ color: 'var(--text-muted)' }}>Lade Dateiinhalt...</p>
          ) : activeTab === 'viewer' ? (
            <div
              className="markdown-preview-container"
              style={{
                padding: '20px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                lineHeight: 1.6,
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            >
              <ReactMarkdown>{content || '*Datei ist leer*'}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              className="input-field"
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '380px',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                resize: 'vertical',
              }}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Zeichensatz: UTF-8 • Direkt auf Festplatte speichern
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              Schließen
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
              style={{ gap: '6px', fontSize: '0.85rem' }}
            >
              {saveSuccess ? (
                <>
                  <Check size={16} color="#34d399" />
                  <span>Gespeichert!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isSaving ? 'Speichere...' : 'Änderungen speichern'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
