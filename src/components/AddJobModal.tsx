import React, { useState } from 'react';
import { X, Sparkles, Link as LinkIcon, FileText, CheckCircle2, AlertTriangle, Edit3 } from 'lucide-react';
import { JobMetadata, ExperienceLevel, EXPERIENCE_LABELS } from '../types/job';
import { aiService } from '../services/ai/aiService';
import { fileSystemService } from '../services/storage/fileSystem';
import { ExtractedJobData } from '../services/ai/types';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobAdded: (job: JobMetadata) => void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose, onJobAdded }) => {
  if (!isOpen) return null;

  const [inputMode, setInputMode] = useState<'link' | 'text' | 'manual'>('link');
  const [linkUrl, setLinkUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual input fields
  const [manualCompany, setManualCompany] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualSummary, setManualSummary] = useState('');
  const [manualRequiresExp, setManualRequiresExp] = useState<boolean>(false);
  const [manualExpDetails, setManualExpDetails] = useState('');
  const [manualTasks, setManualTasks] = useState('');
  const [manualReqs, setManualReqs] = useState('');

  // Extracted preview state
  const [extracted, setExtracted] = useState<ExtractedJobData | null>(null);
  const [editableCompany, setEditableCompany] = useState('');
  const [editableTitle, setEditableTitle] = useState('');

  const handleAnalyze = async () => {
    const rawInput = inputMode === 'link' ? `${linkUrl}\n${jobText}` : jobText;
    if (!rawInput.trim()) {
      setErrorMessage('Bitte gib einen Link oder eine Stellenbeschreibung ein.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await aiService.extractJobData(rawInput);
      
      // Detect if AI complained about link access (LinkedIn AuthWall)
      if (data.summary && data.summary.includes('nicht auf externe Links') && !jobText) {
        setErrorMessage('LinkedIn blockiert direkte Link-Abfragen ohne Login (AuthWall). Bitte kopiere den Stellenanzeigentext einfach kurz in das Textfeld darunter ein!');
        setInputMode('text');
        return;
      }

      setExtracted(data);
      setEditableCompany(data.company || '');
      setEditableTitle(data.title || '');
    } catch (err: any) {
      console.error('Fehler bei der KI-Analyse:', err);
      setErrorMessage(err.message || 'Fehler beim Analysieren des Jobs mit KI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manualCompany.trim() || !manualTitle.trim()) {
      setErrorMessage('Bitte gib mindestens Firma und Jobtitel an.');
      return;
    }

    let handle = await fileSystemService.getStoredRootHandle();
    if (!handle) {
      handle = await fileSystemService.selectRootDirectory();
    }

    const tasksList = manualTasks.split('\n').map(t => t.trim()).filter(Boolean);
    const reqsList = manualReqs.split('\n').map(r => r.trim()).filter(Boolean);

    const expLevel: ExperienceLevel = manualRequiresExp ? 'required' : 'junior';

    const newJob: JobMetadata = {
      id: crypto.randomUUID(),
      company: manualCompany.trim(),
      title: manualTitle.trim(),
      url: linkUrl || undefined,
      status: 'interested',
      experienceLevel: expLevel,
      requiresWorkExperience: manualRequiresExp,
      experienceDetails: manualExpDetails || (manualRequiresExp ? 'Berufserfahrung erforderlich' : 'Junior / Einstieg ohne Vorerfahrung möglich'),
      summary: manualSummary || 'Manuell hinzugefügte Stellenbeschreibung.',
      tasks: tasksList.length ? tasksList : ['Aufgaben gemäß Stellenbeschreibung bearbeiten'],
      requirements: reqsList.length ? reqsList : ['Qualifikationen gemäß Anforderungsprofil'],
      benefits: ['Flexible Arbeitszeiten'],
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      notes: '',
      priorKnowledgeLevel: manualRequiresExp ? 8 : 2,
      personalRating: 3,
      customTags: [],
    };

    const res = await fileSystemService.saveJob(newJob, handle);
    if (res.success) {
      aiService.notifyUser(`✅ Ordner "${res.path}" wurde erfolgreich auf deiner Festplatte angelegt!`);
    }

    onJobAdded(newJob);
    resetForm();
    onClose();
  };

  const handleSaveExtracted = async () => {
    if (!extracted) return;

    let handle = await fileSystemService.getStoredRootHandle();
    if (!handle) {
      handle = await fileSystemService.selectRootDirectory();
    }

    const newJob: JobMetadata = {
      id: crypto.randomUUID(),
      company: editableCompany || extracted.company || 'Unbekannte Firma',
      title: editableTitle || extracted.title || 'Stellenbezeichnung',
      url: linkUrl || undefined,
      status: 'interested',
      experienceLevel: extracted.experienceLevel || 'none',
      requiresWorkExperience: extracted.requiresWorkExperience ?? false,
      experienceDetails: extracted.experienceDetails || 'Keine genauen Angaben',
      summary: extracted.summary || '',
      tasks: extracted.tasks || [],
      requirements: extracted.requirements || [],
      benefits: extracted.benefits || [],
      salary: extracted.salary || undefined,
      location: extracted.location || undefined,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      notes: '',
      priorKnowledgeLevel: extracted.priorKnowledgeLevel ?? (extracted.requiresWorkExperience ? 8 : 3),
      personalRating: 3,
      customTags: [],
    };

    const res = await fileSystemService.saveJob(newJob, handle);
    if (res.success) {
      aiService.notifyUser(`✅ Ordner "${res.path}" wurde erfolgreich auf deiner Festplatte angelegt!`);
    }

    onJobAdded(newJob);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setExtracted(null);
    setLinkUrl('');
    setJobText('');
    setManualCompany('');
    setManualTitle('');
    setManualSummary('');
    setManualTasks('');
    setManualReqs('');
    setManualExpDetails('');
    setErrorMessage(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>Bewerbung anlegen</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Verwende KI-Extraktion oder erstelle den Ordner direkt manuell ohne Token-Verbrauch
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(248,113,113,0.15)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {!extracted ? (
          <div>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <button
                onClick={() => setInputMode('link')}
                className={`btn ${inputMode === 'link' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, gap: '6px', padding: '8px 10px', fontSize: '0.8rem' }}
              >
                <LinkIcon size={14} />
                <span>LinkedIn / Link (KI)</span>
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`btn ${inputMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, gap: '6px', padding: '8px 10px', fontSize: '0.8rem' }}
              >
                <FileText size={14} />
                <span>Text KI-Analyse</span>
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`btn ${inputMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  flex: 1.1,
                  gap: '6px',
                  padding: '8px 10px',
                  fontSize: '0.8rem',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <Edit3 size={14} color="#34d399" />
                <span>Manuell (Ohne KI)</span>
              </button>
            </div>

            {inputMode === 'manual' ? (
              /* Manual Input Form (Zero AI Token Usage) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Firma (Ordner 1) *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="z.B. AcmeCorp"
                      value={manualCompany}
                      onChange={(e) => setManualCompany(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Jobtitel (Ordner 2) *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="z.B. Frontend Developer"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Vorerfahrung erforderlich?
                  </label>
                  <select
                    className="input-field"
                    value={manualRequiresExp ? 'required' : 'junior'}
                    onChange={(e) => setManualRequiresExp(e.target.value === 'required')}
                  >
                    <option value="junior">🟢 Junior / Ohne Vorerfahrung (Direkte Bewerbung möglich)</option>
                    <option value="required">🔴 Berufserfahrung zwingend erforderlich</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Erfahrungs-Details (optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="z.B. Mindestens 2 Jahre Erfahrung in React"
                    value={manualExpDetails}
                    onChange={(e) => setManualExpDetails(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Kurze Zusammenfassung
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Kurze Beschreibung des Jobs..."
                    value={manualSummary}
                    onChange={(e) => setManualSummary(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Aufgaben (zeilenweise)
                    </label>
                    <textarea
                      className="input-field"
                      rows={3}
                      placeholder="Aufgabe 1&#10;Aufgabe 2"
                      value={manualTasks}
                      onChange={(e) => setManualTasks(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Anforderungen (zeilenweise)
                    </label>
                    <textarea
                      className="input-field"
                      rows={3}
                      placeholder="Anforderung 1&#10;Anforderung 2"
                      value={manualReqs}
                      onChange={(e) => setManualReqs(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveManual}
                  className="btn btn-primary"
                  style={{ width: '100%', gap: '8px', padding: '12px', marginTop: '6px' }}
                >
                  <CheckCircle2 size={18} />
                  <span>Ordner anlegen & Speichern (Manuell)</span>
                </button>
              </div>
            ) : (
              /* AI Extraction Mode */
              <div>
                {inputMode === 'link' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      LinkedIn Link oder Job-URL
                    </label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Stellenbeschreibung / Text (optional bei Link)
                  </label>
                  <textarea
                    className="input-field"
                    rows={5}
                    placeholder="Kopiere den Stellenanzeigentext hier hinein..."
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', gap: '8px', padding: '12px' }}
                >
                  {isLoading ? (
                    <span>Analysiere mit KI...</span>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Stelle mit KI analysieren & extrahieren</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Extracted Preview Step */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(99,102,241,0.1)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                  Vorschau der Ordnerstruktur
                </span>
                <span className={`badge ${EXPERIENCE_LABELS[extracted.experienceLevel]?.tagClass}`}>
                  {EXPERIENCE_LABELS[extracted.experienceLevel]?.label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Firma (Ordner ebene 1)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editableCompany}
                    onChange={(e) => setEditableCompany(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jobtitel (Ordner ebene 2)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Wird gespeichert in: <code>{editableCompany || 'Firma'}/{editableTitle || 'Titel'}/metadata.json</code>
              </p>
            </div>

            {/* Tasks & Requirements Preview */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '6px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#818cf8', marginBottom: '6px' }}>Aufgaben ({extracted.tasks.length})</h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', marginBottom: '12px', color: 'var(--text-muted)' }}>
                {extracted.tasks.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>

              <h4 style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: '6px' }}>Anforderungen ({extracted.requirements.length})</h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {extracted.requirements.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => setExtracted(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Zurück / Erneut versuchen
              </button>
              <button onClick={handleSaveExtracted} className="btn btn-primary" style={{ flex: 1, gap: '6px' }}>
                <CheckCircle2 size={16} />
                <span>Ordner anlegen & Speichern</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
