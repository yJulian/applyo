import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Link as LinkIcon, FileText, CheckCircle2, AlertTriangle, Edit3 } from 'lucide-react';
import { JobMetadata, ExperienceLevel, getExperienceMeta } from '../types/job';
import { aiService } from '../services/ai/aiService';
import { fileSystemService } from '../services/storage/fileSystem';
import { ExtractedJobData } from '../services/ai/types';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobAdded: (job: JobMetadata) => void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose, onJobAdded }) => {
  const { t } = useTranslation();

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

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    const rawInput = inputMode === 'link' ? `${linkUrl}\n${jobText}` : jobText;
    if (!rawInput.trim()) {
      setErrorMessage(t('add_job.error_empty_input'));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await aiService.extractJobData(rawInput);
      
      // Detect if AI complained about link access (LinkedIn AuthWall)
      if (data.summary && data.summary.includes('nicht auf externe Links') && !jobText) {
        setErrorMessage(t('add_job.error_authwall'));
        setInputMode('text');
        return;
      }

      setExtracted(data);
      setEditableCompany(data.company || '');
      setEditableTitle(data.title || '');
    } catch (err: any) {
      console.error('Fehler bei der KI-Analyse:', err);
      setErrorMessage(err.message || t('add_job.error_ai_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manualCompany.trim() || !manualTitle.trim()) {
      setErrorMessage(t('add_job.error_missing_company_title'));
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
      statusHistory: [{ toStatus: 'interested', timestamp: new Date().toISOString() }],
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
      statusHistory: [{ toStatus: 'interested', timestamp: new Date().toISOString() }],
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
      <div className="modal-card glass-panel" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem' }}>{t('add_job.modal_title')}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('add_job.modal_subtitle')}
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
                <span>{t('add_job.tab_link')}</span>
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`btn ${inputMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, gap: '6px', padding: '8px 10px', fontSize: '0.8rem' }}
              >
                <FileText size={14} />
                <span>{t('add_job.tab_text')}</span>
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
                <span>{t('add_job.tab_manual')}</span>
              </button>
            </div>

            {inputMode === 'manual' ? (
              /* Manual Input Form (Zero AI Token Usage) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      {t('add_job.company_label')} *
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
                      {t('add_job.title_label')} *
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
                    {t('add_job.exp_required_label')}
                  </label>
                  <select
                    className="input-field"
                    value={manualRequiresExp ? 'required' : 'junior'}
                    onChange={(e) => setManualRequiresExp(e.target.value === 'required')}
                  >
                    <option value="junior">🟢 {t('add_job.exp_junior_opt')}</option>
                    <option value="required">🔴 {t('add_job.exp_req_opt')}</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t('add_job.exp_details_label')}
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
                    {t('add_job.summary_label')}
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
                      {t('add_job.tasks_label')}
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
                      {t('add_job.requirements_label')}
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
                  <span>{t('add_job.create_manual_btn')}</span>
                </button>
              </div>
            ) : (
              /* AI Extraction Mode */
              <div>
                {inputMode === 'link' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      {t('add_job.link_field_label')}
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
                    {t('add_job.text_field_label')}
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
                    <span>{t('add_job.analyzing')}</span>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>{t('add_job.analyze_btn')}</span>
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
                  {t('add_job.folder_preview')}
                </span>
                <span className={`badge ${getExperienceMeta(extracted.experienceLevel || 'none', t).tagClass}`}>
                  {getExperienceMeta(extracted.experienceLevel || 'none', t).label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('add_job.company_label')}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editableCompany}
                    onChange={(e) => setEditableCompany(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('add_job.title_label')}</label>
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
                {t('add_job.will_be_saved_in')}: <code>{editableCompany || 'Firma'}/{editableTitle || 'Titel'}/metadata.json</code>
              </p>
            </div>

            {/* Tasks & Requirements Preview */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '6px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#818cf8', marginBottom: '6px' }}>{t('job_detail.tasks_title')} ({extracted.tasks.length})</h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', marginBottom: '12px', color: 'var(--text-muted)' }}>
                {extracted.tasks.map((tItem, idx) => (
                  <li key={idx}>{tItem}</li>
                ))}
              </ul>

              <h4 style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: '6px' }}>{t('job_detail.requirements_title')} ({extracted.requirements.length})</h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {extracted.requirements.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => setExtracted(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                {t('add_job.back_btn')}
              </button>
              <button onClick={handleSaveExtracted} className="btn btn-primary" style={{ flex: 1, gap: '6px' }}>
                <CheckCircle2 size={16} />
                <span>{t('add_job.save_extracted_btn')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
