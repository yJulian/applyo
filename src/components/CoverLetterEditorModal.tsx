import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Download,
  Save,
  Wand2,
  Plus,
  Trash2,
  Layout,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  Check,
  Send,
  Upload,
  Mail,
} from 'lucide-react';
import { JobMetadata } from '../types/job';
import {
  CoverLetterData,
  CoverLetterStyleOptions,
  DEFAULT_COVER_LETTER_STYLE,
  CoverLetterTemplateId,
  CoverLetterAccentColor,
} from '../types/coverLetter';
import { profileService } from '../services/storage/profileService';
import { aiService } from '../services/ai/aiService';
import { fileSystemService } from '../services/storage/fileSystem';
import { pdfExporter } from '../services/export/pdfExporter';
import { CoverLetterRenderer } from './cover-letter-templates/CoverLetterRenderer';

interface CoverLetterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobMetadata[];
  selectedJob: JobMetadata | null;
  onSelectJob?: (job: JobMetadata) => void;
}

export const CoverLetterEditorModal: React.FC<CoverLetterEditorModalProps> = ({
  isOpen,
  onClose,
  jobs,
  selectedJob,
  onSelectJob,
}) => {
  if (!isOpen) return null;

  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData | null>(null);
  const [styleOptions, setStyleOptions] = useState<CoverLetterStyleOptions>(DEFAULT_COVER_LETTER_STYLE);
  const [activeTab, setActiveTab] = useState<'sender_recipient' | 'meta_salutation' | 'content'>('sender_recipient');

  // Loading & Saving States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Refinement Prompt state
  const [refinePrompt, setRefinePrompt] = useState('');

  // Initial Load
  useEffect(() => {
    async function initCoverLetter() {
      setIsGenerating(true);
      const profile = await profileService.getProfile();

      let loaded: CoverLetterData | null = null;

      // Check if job already has a saved Anschreiben.json
      if (selectedJob) {
        const savedJson = await fileSystemService.readTextFile(selectedJob, 'Anschreiben.json');
        if (savedJson) {
          try {
            const parsed = JSON.parse(savedJson) as CoverLetterData;
            loaded = parsed;
            if (parsed.styleOptions) {
              setStyleOptions(parsed.styleOptions);
            }
          } catch (e) {
            console.warn('Anschreiben.json konnte nicht gelesen werden, erstelle neu:', e);
          }
        }
      }

      // Otherwise generate tailored Cover Letter with AI
      if (!loaded) {
        loaded = await aiService.generateTailoredCoverLetter(profile, selectedJob);
      }

      setCoverLetterData(loaded);
      setIsGenerating(false);
    }

    initCoverLetter();
  }, [selectedJob]);

  // Handle Style Change
  const handleStyleChange = (newStyle: CoverLetterStyleOptions) => {
    setStyleOptions(newStyle);
  };

  // Handle Regenerate with AI
  const handleRegenerate = async () => {
    setIsGenerating(true);
    const profile = await profileService.getProfile();
    const generated = await aiService.generateTailoredCoverLetter(profile, selectedJob);
    setCoverLetterData(generated);
    setIsGenerating(false);
  };

  // Handle AI Refinement Prompt
  const handleApplyRefine = async (customPrompt?: string) => {
    const promptToUse = customPrompt || refinePrompt;
    if (!promptToUse.trim() || !coverLetterData) return;

    setIsRefining(true);
    const updated = await aiService.refineCoverLetter(coverLetterData, promptToUse, selectedJob);
    setCoverLetterData(updated);
    setRefinePrompt('');
    setIsRefining(false);
  };

  // Save to Job Directory as Anschreiben.json & Anschreiben.md
  const handleSaveToDirectory = async () => {
    if (!coverLetterData) return;
    setIsSaving(true);

    let targetJob = selectedJob;
    if (!targetJob && jobs.length > 0) {
      targetJob = jobs[0];
    }

    if (targetJob) {
      // Persist current style inside the Cover Letter Data JSON
      const dataToSave: CoverLetterData = { ...coverLetterData, styleOptions };

      // 1. Save JSON representation
      await fileSystemService.writeTextFile(targetJob, 'Anschreiben.json', JSON.stringify(dataToSave, null, 2));

      // 2. Save Markdown representation for easy reading
      const markdownCoverLetter = `# Anschreiben - ${coverLetterData.sender.fullName}
**Stelle:** ${coverLetterData.meta.subject}
**Unternehmen:** ${coverLetterData.recipient.company}
**Datum & Ort:** ${coverLetterData.meta.placeAndDate}

---

### Empfänger:
${coverLetterData.recipient.company}
${coverLetterData.recipient.department || ''}
${coverLetterData.recipient.contactPerson || ''}
${coverLetterData.recipient.address || ''}
${coverLetterData.recipient.zipCity || ''}

---

**${coverLetterData.meta.subject}**

${coverLetterData.content.salutation}

${coverLetterData.content.intro}

${(coverLetterData.content.bodyParagraphs || []).join('\n\n')}

${coverLetterData.content.callToAction}

${coverLetterData.content.closing}
${coverLetterData.content.signatureName || coverLetterData.sender.fullName}
`;
      await fileSystemService.writeTextFile(targetJob, 'Anschreiben.md', markdownCoverLetter);
      aiService.notifyUser(`✅ Anschreiben.md und Anschreiben.json erfolgreich im Ordner "${targetJob.company}" gespeichert!`);
    } else {
      aiService.notifyUser('Wähle zuerst eine Stelle aus, um das Anschreiben im Zielordner zu speichern.');
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // PDF Export
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    const filename = selectedJob
      ? `Anschreiben_${selectedJob.company.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      : 'Anschreiben.pdf';

    const success = await pdfExporter.exportToPDF({
      elementId: 'cover-letter-pdf-render-target',
      filename,
      job: selectedJob,
    });

    setIsExportingPDF(false);
    if (success) {
      aiService.notifyUser('🎉 Anschreiben erfolgreich als PDF exportiert!');
    }
  };

  // Handle JSON Import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as CoverLetterData;
        setCoverLetterData(parsed);
        if (parsed.styleOptions) {
          handleStyleChange(parsed.styleOptions);
        }
        aiService.notifyUser('✅ Anschreiben.json erfolgreich geladen!');
      } catch (err) {
        aiService.notifyUser('Fehler beim Einlesen der JSON-Datei.');
      }
    };
    reader.readAsText(file);
  };

  const accentColors: CoverLetterAccentColor[] = ['#6366f1', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b'];

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
      <div
        className="modal-card glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1400px',
          width: '96vw',
          height: '92vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-color)',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          {/* Brand & Job Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
              }}
            >
              <Mail size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  AI Anschreiben Editor
                </h2>
                {jobs.length > 0 && (
                  <select
                    value={selectedJob?.id || ''}
                    onChange={(e) => {
                      const found = jobs.find((j) => j.id === e.target.value);
                      if (found && onSelectJob) {
                        onSelectJob(found);
                      }
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-main)',
                      fontSize: '0.775rem',
                      padding: '2px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} — {j.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Professionelles Bewerbungsschreiben aus Profil & Stelle generieren & als PDF exportieren
              </p>
            </div>
          </div>

          {/* Template & Color Selector Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Template Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255,255,255,0.04)',
                padding: '4px 8px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
              }}
            >
              <Layout size={14} color="var(--accent-cyan)" />
              <select
                value={styleOptions.templateId}
                onChange={(e) =>
                  handleStyleChange({ ...styleOptions, templateId: e.target.value as CoverLetterTemplateId })
                }
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.775rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="modern_glass">Vorlage: Modern Glass</option>
                <option value="minimal_clean">Vorlage: Minimal Clean</option>
                <option value="classic_din">Vorlage: Klassisch (DIN 5008)</option>
              </select>
            </div>

            {/* Accent Color Swatches */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {accentColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleStyleChange({ ...styleOptions, accentColor: color })}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: styleOptions.accentColor === color ? '2px solid #ffffff' : 'none',
                    cursor: 'pointer',
                    boxShadow: styleOptions.accentColor === color ? `0 0 10px ${color}` : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                  title={`Akzentfarbe ${color}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="btn btn-secondary"
              style={{ gap: '6px', fontSize: '0.8rem', padding: '7px 12px' }}
              title="Anschreiben auf Basis von Profil und Stelle per KI neu generieren"
            >
              {isGenerating ? (
                <Loader2 size={14} className="spin-icon" />
              ) : (
                <Sparkles size={14} color="var(--accent-primary)" />
              )}
              <span>KI Neu Generieren</span>
            </button>

            <label
              className="btn btn-secondary"
              style={{ gap: '6px', fontSize: '0.8rem', padding: '7px 12px', cursor: 'pointer' }}
              title="Bestehende Anschreiben.json Datei von der Festplatte öffnen"
            >
              <Upload size={14} color="var(--accent-cyan)" />
              <span>JSON Laden</span>
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>

            <button
              onClick={handleSaveToDirectory}
              disabled={isSaving}
              className="btn btn-secondary"
              style={{ gap: '6px', fontSize: '0.8rem', padding: '7px 12px' }}
              title="Anschreiben.json & Anschreiben.md im Ordner speichern"
            >
              {saveSuccess ? <Check size={14} color="#34d399" /> : <Save size={14} />}
              <span>{saveSuccess ? 'Gespeichert!' : 'Speichern'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF || !coverLetterData}
              className="btn btn-primary"
              style={{
                gap: '6px',
                fontSize: '0.8rem',
                padding: '7px 14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              }}
            >
              {isExportingPDF ? <Loader2 size={14} className="spin-icon" /> : <Download size={14} />}
              <span>PDF Exportieren</span>
            </button>

            <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Split Layout: Left Form Editor & AI Refinement, Right Live Preview */}
        {isGenerating || !coverLetterData ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              gap: '14px',
            }}
          >
            <Loader2 size={42} color="var(--accent-primary)" className="spin-icon" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
              AI Anschreiben wird maßgeschneidert generiert...
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              Bewerberprofil wird mit den konkreten Anforderungen von{' '}
              {selectedJob ? selectedJob.title : 'der Stelle'} verknüpft.
            </p>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '460px 1fr',
              gap: '18px',
              marginTop: '14px',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            {/* LEFT PANEL: Form Editor & KI Refinement Bar */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '14px',
              }}
            >
              {/* Accordion Tabs Header */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '12px',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => setActiveTab('sender_recipient')}
                  className={`btn ${activeTab === 'sender_recipient' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}
                >
                  <User size={12} /> Absender & Empfänger
                </button>
                <button
                  onClick={() => setActiveTab('meta_salutation')}
                  className={`btn ${activeTab === 'meta_salutation' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}
                >
                  <Calendar size={12} /> Datum & Betreff
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`btn ${activeTab === 'content' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}
                >
                  <MessageSquare size={12} /> Inhalt & Text
                </button>
              </div>

              {/* Tab Form Content */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  paddingRight: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* --- TAB 1: SENDER & RECIPIENT --- */}
                {activeTab === 'sender_recipient' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.775rem',
                          fontWeight: 700,
                          color: 'var(--accent-primary)',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        Absenderdaten (Bewerber)
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Vollständiger Name</label>
                          <input
                            type="text"
                            className="input-field"
                            value={coverLetterData.sender.fullName}
                            onChange={(e) =>
                              setCoverLetterData({
                                ...coverLetterData,
                                sender: { ...coverLetterData.sender, fullName: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Titel / Berufsbezeichnung</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="z.B. Senior Software Engineer"
                            value={coverLetterData.sender.title || ''}
                            onChange={(e) =>
                              setCoverLetterData({
                                ...coverLetterData,
                                sender: { ...coverLetterData.sender, title: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>E-Mail</label>
                            <input
                              type="text"
                              className="input-field"
                              value={coverLetterData.sender.email}
                              onChange={(e) =>
                                setCoverLetterData({
                                  ...coverLetterData,
                                  sender: { ...coverLetterData.sender, email: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Telefon</label>
                            <input
                              type="text"
                              className="input-field"
                              value={coverLetterData.sender.phone}
                              onChange={(e) =>
                                setCoverLetterData({
                                  ...coverLetterData,
                                  sender: { ...coverLetterData.sender, phone: e.target.value },
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Wohnort</label>
                          <input
                            type="text"
                            className="input-field"
                            value={coverLetterData.sender.location}
                            onChange={(e) =>
                              setCoverLetterData({
                                ...coverLetterData,
                                sender: { ...coverLetterData.sender, location: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.775rem',
                          fontWeight: 700,
                          color: 'var(--accent-cyan)',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        Empfängerdaten (Unternehmen)
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Firmenname</label>
                          <input
                            type="text"
                            className="input-field"
                            value={coverLetterData.recipient.company}
                            onChange={(e) =>
                              setCoverLetterData({
                                ...coverLetterData,
                                recipient: { ...coverLetterData.recipient, company: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Abteilung</label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="z.B. Human Resources"
                              value={coverLetterData.recipient.department || ''}
                              onChange={(e) =>
                                setCoverLetterData({
                                  ...coverLetterData,
                                  recipient: { ...coverLetterData.recipient, department: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Ansprechpartner</label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="z.B. Frau Dr. Schmidt"
                              value={coverLetterData.recipient.contactPerson || ''}
                              onChange={(e) =>
                                setCoverLetterData({
                                  ...coverLetterData,
                                  recipient: { ...coverLetterData.recipient, contactPerson: e.target.value },
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Straße / Hausnummer</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="z.B. Musterstraße 12"
                            value={coverLetterData.recipient.address || ''}
                            onChange={(e) =>
                              setCoverLetterData({
                                ...coverLetterData,
                                recipient: { ...coverLetterData.recipient, address: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>PLZ & Ort</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="z.B. 10115 Berlin"
                            value={coverLetterData.recipient.zipCity || ''}
                            onChange={(e) =>
                              setCoverLetterData({
                                ...coverLetterData,
                                recipient: { ...coverLetterData.recipient, zipCity: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB 2: META & SALUTATION --- */}
                {activeTab === 'meta_salutation' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Ort & Datum
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="z.B. Berlin, den 3. August 2026"
                        value={coverLetterData.meta.placeAndDate}
                        onChange={(e) =>
                          setCoverLetterData({
                            ...coverLetterData,
                            meta: { ...coverLetterData.meta, placeAndDate: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Betreffzeile
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        style={{ fontWeight: 700 }}
                        placeholder="z.B. Bewerbung als Senior Fullstack Developer (m/w/d)"
                        value={coverLetterData.meta.subject}
                        onChange={(e) =>
                          setCoverLetterData({
                            ...coverLetterData,
                            meta: { ...coverLetterData.meta, subject: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Anrede
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="z.B. Sehr geehrte Damen und Herren,"
                        value={coverLetterData.content.salutation}
                        onChange={(e) =>
                          setCoverLetterData({
                            ...coverLetterData,
                            content: { ...coverLetterData.content, salutation: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* --- TAB 3: CONTENT --- */}
                {activeTab === 'content' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Einleitung (Erster Absatz)
                      </label>
                      <textarea
                        rows={3}
                        className="input-field"
                        style={{ lineHeight: 1.5, resize: 'vertical' }}
                        value={coverLetterData.content.intro}
                        onChange={(e) =>
                          setCoverLetterData({
                            ...coverLetterData,
                            content: { ...coverLetterData.content, intro: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Hauptteil (Absätze)
                        </label>
                        <button
                          onClick={() => {
                            const paragraphs = [...(coverLetterData.content.bodyParagraphs || []), 'Neuer Absatz...'];
                            setCoverLetterData({
                              ...coverLetterData,
                              content: { ...coverLetterData.content, bodyParagraphs: paragraphs },
                            });
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.7rem', gap: '4px' }}
                        >
                          <Plus size={12} /> Absatz hinzufügen
                        </button>
                      </div>

                      {(coverLetterData.content.bodyParagraphs || []).map((p, idx) => (
                        <div key={idx} style={{ marginBottom: '8px', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                              Absatz #{idx + 1}
                            </span>
                            {coverLetterData.content.bodyParagraphs.length > 1 && (
                              <button
                                onClick={() => {
                                  const filtered = coverLetterData.content.bodyParagraphs.filter((_, i) => i !== idx);
                                  setCoverLetterData({
                                    ...coverLetterData,
                                    content: { ...coverLetterData.content, bodyParagraphs: filtered },
                                  });
                                }}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title="Absatz löschen"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={4}
                            className="input-field"
                            style={{ lineHeight: 1.5, resize: 'vertical' }}
                            value={p}
                            onChange={(e) => {
                              const updated = [...coverLetterData.content.bodyParagraphs];
                              updated[idx] = e.target.value;
                              setCoverLetterData({
                                ...coverLetterData,
                                content: { ...coverLetterData.content, bodyParagraphs: updated },
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Schlussabsatz & Gesprächswunsch (Call to Action)
                      </label>
                      <textarea
                        rows={2}
                        className="input-field"
                        style={{ lineHeight: 1.5, resize: 'vertical' }}
                        value={coverLetterData.content.callToAction}
                        onChange={(e) =>
                          setCoverLetterData({
                            ...coverLetterData,
                            content: { ...coverLetterData.content, callToAction: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Grußformel</label>
                        <input
                          type="text"
                          className="input-field"
                          value={coverLetterData.content.closing}
                          onChange={(e) =>
                            setCoverLetterData({
                              ...coverLetterData,
                              content: { ...coverLetterData.content, closing: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Unterschrift / Name</label>
                        <input
                          type="text"
                          className="input-field"
                          value={coverLetterData.content.signatureName}
                          onChange={(e) =>
                            setCoverLetterData({
                              ...coverLetterData,
                              content: { ...coverLetterData.content, signatureName: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTTOM: KI Refinement Panel */}
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Wand2 size={13} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    KI-Assistent: Anschreiben verfeinern
                  </span>
                </div>

                {/* Action Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  <button
                    onClick={() => handleApplyRefine('Formuliere das Anschreiben noch überzeugender, prägnanter und punktgenau auf die Anforderungen der Stelle.')}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    ✨ Prägnanter & überzeugender
                  </button>
                  <button
                    onClick={() => handleApplyRefine('Betone meine Führungsqualitäten, Eigenverantwortung und Mehrwert für das Team.')}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    ✨ Stärken betonen
                  </button>
                  <button
                    onClick={() => handleApplyRefine('Füge einen höflichen Hinweis auf frühestmögliches Eintrittsdatum und Gehaltsvorstellung hinzu.')}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    ✨ Eintrittsdatum & Gehalt
                  </button>
                </div>

                {/* Prompt Input */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: '0.775rem', padding: '6px 10px' }}
                    placeholder="Anweisung an KI z.B. 'Formuliere den Hauptteil lockerer'..."
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyRefine()}
                  />
                  <button
                    onClick={() => handleApplyRefine()}
                    disabled={isRefining || !refinePrompt.trim()}
                    className="btn btn-primary"
                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                  >
                    {isRefining ? <Loader2 size={13} className="spin-icon" /> : <Send size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Real-time Live Preview (Scrollable) */}
            <div
              style={{
                flex: 1,
                height: '100%',
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '24px 16px',
                background: '#334155',
                borderRadius: 'var(--radius-lg)',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <CoverLetterRenderer
                  data={coverLetterData}
                  options={styleOptions}
                  targetId="cover-letter-pdf-render-target"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
