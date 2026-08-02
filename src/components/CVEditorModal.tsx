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
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Code2,
  FolderGit2,
  Loader2,
  Check,
  Send,
} from 'lucide-react';
import { JobMetadata } from '../types/job';
import { CVData, CVStyleOptions, DEFAULT_CV_STYLE, CVTemplateId, CVAccentColor } from '../types/cv';
import { profileService } from '../services/storage/profileService';
import { aiService } from '../services/ai/aiService';
import { fileSystemService } from '../services/storage/fileSystem';
import { pdfExporter } from '../services/export/pdfExporter';
import { CVRenderer } from './cv-templates/CVRenderer';

interface CVEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobMetadata[];
  selectedJob: JobMetadata | null;
  onSelectJob: (job: JobMetadata) => void;
}

export const CVEditorModal: React.FC<CVEditorModalProps> = ({
  isOpen,
  onClose,
  jobs,
  selectedJob,
  onSelectJob,
}) => {
  if (!isOpen) return null;

  const [cvData, setCvData] = useState<CVData | null>(null);
  const [styleOptions, setStyleOptions] = useState<CVStyleOptions>(DEFAULT_CV_STYLE);
  const [activeTab, setActiveTab] = useState<'header' | 'summary' | 'experiences' | 'skills' | 'education' | 'projects'>('header');
  
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
    async function initCV() {
      setIsGenerating(true);
      const profile = await profileService.getProfile();
      
      // Check if job already has a saved Lebenslauf.json or Lebenslauf.md
      if (selectedJob) {
        const savedJson = await fileSystemService.readTextFile(selectedJob, 'Lebenslauf.json');
        if (savedJson) {
          try {
            setCvData(JSON.parse(savedJson));
            setIsGenerating(false);
            return;
          } catch (e) {
            console.warn('Lebenslauf.json konnte nicht gelesen werden, erstelle neu:', e);
          }
        }
      }

      // Otherwise generate tailored CV
      const generated = await aiService.generateTailoredCV(profile, selectedJob);
      setCvData(generated);
      setIsGenerating(false);
    }

    initCV();
  }, [selectedJob]);

  // Handle Regenerate with AI
  const handleRegenerate = async () => {
    setIsGenerating(true);
    const profile = await profileService.getProfile();
    const generated = await aiService.generateTailoredCV(profile, selectedJob);
    setCvData(generated);
    setIsGenerating(false);
  };

  // Handle AI Refinement Prompt
  const handleApplyRefine = async (customPrompt?: string) => {
    const promptToUse = customPrompt || refinePrompt;
    if (!promptToUse.trim() || !cvData) return;

    setIsRefining(true);
    const updated = await aiService.refineCV(cvData, promptToUse, selectedJob);
    setCvData(updated);
    setRefinePrompt('');
    setIsRefining(false);
  };

  // Save to Job Directory as Lebenslauf.json & Lebenslauf.md
  const handleSaveToDirectory = async () => {
    if (!cvData) return;
    setIsSaving(true);

    let targetJob = selectedJob;
    if (!targetJob && jobs.length > 0) {
      targetJob = jobs[0];
    }

    if (targetJob) {
      // 1. Save JSON representation
      await fileSystemService.writeTextFile(targetJob, 'Lebenslauf.json', JSON.stringify(cvData, null, 2));

      // 2. Save Markdown representation for easy reading
      const markdownCV = `# ${cvData.header.fullName} - Lebenslauf
**${cvData.header.title}**
E-Mail: ${cvData.header.email} | Tel: ${cvData.header.phone} | Ort: ${cvData.header.location}

## Profile & Zusammenfassung
${cvData.summary}

## Berufserfahrung
${cvData.experiences.map(exp => `### ${exp.position} bei ${exp.company} (${exp.startDate} - ${exp.endDate})
${exp.summary || ''}
${exp.highlights.map(h => `- ${h}`).join('\n')}`).join('\n\n')}

## Kenntnisse & Skills
${cvData.skillCategories.map(cat => `**${cat.category}:** ${cat.skills.join(', ')}`).join('\n')}

## Ausbildung
${cvData.education.map(edu => `- **${edu.degree}** (${edu.institution}, ${edu.startDate}-${edu.endDate})`).join('\n')}
`;
      await fileSystemService.writeTextFile(targetJob, 'Lebenslauf.md', markdownCV);
      aiService.notifyUser(`✅ Lebenslauf.md und Lebenslauf.json erfolgreich im Ordner "${targetJob.company}" gespeichert!`);
    } else {
      aiService.notifyUser('Wähle zuerst eine Stelle aus, um den Lebenslauf auf der Festplatte zu speichern.');
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // PDF Export
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    const filename = selectedJob
      ? `Lebenslauf_${selectedJob.company.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      : 'Lebenslauf.pdf';

    const success = await pdfExporter.exportToPDF({
      elementId: 'cv-pdf-render-target',
      filename,
      job: selectedJob,
    });

    setIsExportingPDF(false);
    if (success) {
      aiService.notifyUser('🎉 Lebenslauf erfolgreich als PDF exportiert!');
    }
  };

  const accentColors: CVAccentColor[] = ['#6366f1', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)', gap: '14px', flexWrap: 'wrap' }}>
          {/* Brand & Job Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', display: 'flex' }}>
              <FileText size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>AI Lebenslauf Editor</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Profil & Stelle verknüpfen, anpassen und als PDF exportieren</p>
            </div>

            {/* Job Selector */}
            <div style={{ marginLeft: '10px' }}>
              <select
                value={selectedJob?.id || ''}
                onChange={(e) => {
                  const found = jobs.find((j) => j.id === e.target.value);
                  if (found) onSelectJob(found);
                }}
                className="input-field"
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--accent-primary)', color: '#fff', width: '220px' }}
              >
                <option value="">Stelle wählen...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company} - {j.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Template & Color Selector Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Template Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <Layout size={14} color="var(--accent-cyan)" />
              <select
                value={styleOptions.templateId}
                onChange={(e) => setStyleOptions({ ...styleOptions, templateId: e.target.value as CVTemplateId })}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.775rem', cursor: 'pointer', outline: 'none' }}
              >
                <option value="modern_glass">Vorlage: Modern Glass</option>
                <option value="minimal_clean">Vorlage: Minimal Clean</option>
                <option value="tech_slate">Vorlage: Tech Slate</option>
                <option value="classic_executive">Vorlage: Executive Classic</option>
              </select>
            </div>

            {/* Accent Color Swatches */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {accentColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setStyleOptions({ ...styleOptions, accentColor: color })}
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
              title="Lebenslauf auf Basis von Profil und Stelle per KI neu generieren"
            >
              {isGenerating ? <Loader2 size={14} className="spin-icon" /> : <Sparkles size={14} color="var(--accent-primary)" />}
              <span>KI Neu Generieren</span>
            </button>

            <button
              onClick={handleSaveToDirectory}
              disabled={isSaving}
              className="btn btn-secondary"
              style={{ gap: '6px', fontSize: '0.8rem', padding: '7px 12px' }}
              title="Lebenslauf.json & Lebenslauf.md im Ordner speichern"
            >
              {saveSuccess ? <Check size={14} color="#34d399" /> : <Save size={14} />}
              <span>{saveSuccess ? 'Gespeichert!' : 'Speichern'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF || !cvData}
              className="btn btn-primary"
              style={{ gap: '6px', fontSize: '0.8rem', padding: '7px 14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
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
        {isGenerating || !cvData ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '14px' }}>
            <Loader2 size={42} color="var(--accent-emerald)" className="spin-icon" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>AI Lebenslauf wird maßgeschneidert generiert...</h3>
            <p style={{ fontSize: '0.85rem' }}>Profil-Informationen werden mit den Anforderungen von {selectedJob ? selectedJob.title : 'der Stelle'} verknüpft.</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '460px 1fr', gap: '18px', marginTop: '14px', overflow: 'hidden', minHeight: 0 }}>
            {/* LEFT PANEL: Form Editor & KI Refinement Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '14px' }}>
              {/* Accordion Tabs Header */}
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px', flexShrink: 0 }}>
                <button onClick={() => setActiveTab('header')} className={`btn ${activeTab === 'header' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <User size={12} /> Header
                </button>
                <button onClick={() => setActiveTab('summary')} className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <FileText size={12} /> Profil
                </button>
                <button onClick={() => setActiveTab('experiences')} className={`btn ${activeTab === 'experiences' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <Briefcase size={12} /> Erfahrung
                </button>
                <button onClick={() => setActiveTab('education')} className={`btn ${activeTab === 'education' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <GraduationCap size={12} /> Bildung
                </button>
                <button onClick={() => setActiveTab('skills')} className={`btn ${activeTab === 'skills' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <Code2 size={12} /> Skills
                </button>
                <button onClick={() => setActiveTab('projects')} className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <FolderGit2 size={12} /> Projekte
                </button>
              </div>

              {/* Tab Form Content */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeTab === 'header' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Vollständiger Name</label>
                    <input type="text" className="input-field" value={cvData.header.fullName} onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, fullName: e.target.value } })} />
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Angestrebter Stellentitel</label>
                    <input type="text" className="input-field" value={cvData.header.title} onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, title: e.target.value } })} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>E-Mail</label>
                        <input type="text" className="input-field" value={cvData.header.email} onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, email: e.target.value } })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Telefon</label>
                        <input type="text" className="input-field" value={cvData.header.phone} onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, phone: e.target.value } })} />
                      </div>
                    </div>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Wohnort</label>
                    <input type="text" className="input-field" value={cvData.header.location} onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, location: e.target.value } })} />
                  </div>
                )}

                {activeTab === 'summary' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Professionelle Zusammenfassung</label>
                    <textarea
                      rows={6}
                      className="input-field"
                      style={{ lineHeight: 1.5, resize: 'vertical' }}
                      value={cvData.summary}
                      onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                    />
                  </div>
                )}

                {activeTab === 'experiences' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {cvData.experiences.map((exp, idx) => (
                      <div key={exp.id} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Station #{idx + 1}</span>
                          <button
                            onClick={() => {
                              const filtered = cvData.experiences.filter((_, i) => i !== idx);
                              setCvData({ ...cvData, experiences: filtered });
                            }}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input type="text" className="input-field" style={{ marginBottom: '6px', fontSize: '0.8rem' }} placeholder="Position" value={exp.position} onChange={(e) => {
                          const updated = [...cvData.experiences];
                          updated[idx].position = e.target.value;
                          setCvData({ ...cvData, experiences: updated });
                        }} />
                        <input type="text" className="input-field" style={{ marginBottom: '6px', fontSize: '0.8rem' }} placeholder="Unternehmen" value={exp.company} onChange={(e) => {
                          const updated = [...cvData.experiences];
                          updated[idx].company = e.target.value;
                          setCvData({ ...cvData, experiences: updated });
                        }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                          <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder="Von (z.B. 2021)" value={exp.startDate} onChange={(e) => {
                            const updated = [...cvData.experiences];
                            updated[idx].startDate = e.target.value;
                            setCvData({ ...cvData, experiences: updated });
                          }} />
                          <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder="Bis (z.B. Heute)" value={exp.endDate} onChange={(e) => {
                            const updated = [...cvData.experiences];
                            updated[idx].endDate = e.target.value;
                            setCvData({ ...cvData, experiences: updated });
                          }} />
                        </div>
                        <textarea
                          rows={2}
                          className="input-field"
                          style={{ fontSize: '0.75rem' }}
                          placeholder="Stichpunkte / Highlights (ein Punkt pro Zeile)..."
                          value={exp.highlights ? exp.highlights.join('\n') : ''}
                          onChange={(e) => {
                            const updated = [...cvData.experiences];
                            updated[idx].highlights = e.target.value.split('\n').filter(Boolean);
                            setCvData({ ...cvData, experiences: updated });
                          }}
                        />
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const newExp = {
                          id: `exp-${Date.now()}`,
                          company: 'Neues Unternehmen',
                          position: 'Position',
                          startDate: '2023',
                          endDate: 'Heute',
                          isCurrent: true,
                          highlights: ['Aufgabe / Erfolg'],
                        };
                        setCvData({ ...cvData, experiences: [...cvData.experiences, newExp] });
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> Erfahrung hinzufügen
                    </button>
                  </div>
                )}

                {activeTab === 'education' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cvData.education.map((edu, idx) => (
                      <div key={edu.id} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Abschluss #{idx + 1}</span>
                          <button
                            onClick={() => {
                              const filtered = cvData.education.filter((_, i) => i !== idx);
                              setCvData({ ...cvData, education: filtered });
                            }}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input type="text" className="input-field" style={{ marginBottom: '4px', fontSize: '0.8rem' }} placeholder="Abschluss (Master, Bachelor...)" value={edu.degree} onChange={(e) => {
                          const updated = [...cvData.education];
                          updated[idx].degree = e.target.value;
                          setCvData({ ...cvData, education: updated });
                        }} />
                        <input type="text" className="input-field" style={{ marginBottom: '4px', fontSize: '0.8rem' }} placeholder="Institution / Hochschule" value={edu.institution} onChange={(e) => {
                          const updated = [...cvData.education];
                          updated[idx].institution = e.target.value;
                          setCvData({ ...cvData, education: updated });
                        }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder="Von (z.B. 2017)" value={edu.startDate} onChange={(e) => {
                            const updated = [...cvData.education];
                            updated[idx].startDate = e.target.value;
                            setCvData({ ...cvData, education: updated });
                          }} />
                          <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder="Bis (z.B. 2021)" value={edu.endDate} onChange={(e) => {
                            const updated = [...cvData.education];
                            updated[idx].endDate = e.target.value;
                            setCvData({ ...cvData, education: updated });
                          }} />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const newEdu = {
                          id: `edu-${Date.now()}`,
                          institution: 'Hochschule / Schule',
                          degree: 'Bachelor / Master',
                          fieldOfStudy: 'Fachrichtung',
                          startDate: '2019',
                          endDate: '2022',
                        };
                        setCvData({ ...cvData, education: [...cvData.education, newEdu] });
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> Bildung hinzufügen
                    </button>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cvData.skillCategories.map((cat, idx) => (
                      <div key={cat.id} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Kategorie #{idx + 1}</span>
                          <button
                            onClick={() => {
                              const filtered = cvData.skillCategories.filter((_, i) => i !== idx);
                              setCvData({ ...cvData, skillCategories: filtered });
                            }}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input
                          type="text"
                          className="input-field"
                          style={{ marginBottom: '6px', fontWeight: 700, fontSize: '0.8rem' }}
                          value={cat.category}
                          onChange={(e) => {
                            const updated = [...cvData.skillCategories];
                            updated[idx].category = e.target.value;
                            setCvData({ ...cvData, skillCategories: updated });
                          }}
                        />
                        <textarea
                          rows={2}
                          className="input-field"
                          style={{ fontSize: '0.775rem' }}
                          placeholder="Kommagetrennte Skills..."
                          value={cat.skills.join(', ')}
                          onChange={(e) => {
                            const updated = [...cvData.skillCategories];
                            updated[idx].skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            setCvData({ ...cvData, skillCategories: updated });
                          }}
                        />
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const newCat = {
                          id: `cat-${Date.now()}`,
                          category: 'Neue Skill-Kategorie',
                          skills: ['Skill A', 'Skill B'],
                        };
                        setCvData({ ...cvData, skillCategories: [...cvData.skillCategories, newCat] });
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> Skill-Kategorie hinzufügen
                    </button>
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(cvData.projects || []).map((proj, idx) => (
                      <div key={proj.id} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Projekt #{idx + 1}</span>
                          <button
                            onClick={() => {
                              const filtered = (cvData.projects || []).filter((_, i) => i !== idx);
                              setCvData({ ...cvData, projects: filtered });
                            }}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input type="text" className="input-field" style={{ marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700 }} placeholder="Projektname" value={proj.title} onChange={(e) => {
                          const updated = [...(cvData.projects || [])];
                          updated[idx].title = e.target.value;
                          setCvData({ ...cvData, projects: updated });
                        }} />
                        <textarea rows={2} className="input-field" style={{ marginBottom: '4px', fontSize: '0.775rem' }} placeholder="Kurze Beschreibung" value={proj.description} onChange={(e) => {
                          const updated = [...(cvData.projects || [])];
                          updated[idx].description = e.target.value;
                          setCvData({ ...cvData, projects: updated });
                        }} />
                        <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder="Tech-Stack (z.B. React, TypeScript)" value={proj.techStack ? proj.techStack.join(', ') : ''} onChange={(e) => {
                          const updated = [...(cvData.projects || [])];
                          updated[idx].techStack = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setCvData({ ...cvData, projects: updated });
                        }} />
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const newProj = {
                          id: `proj-${Date.now()}`,
                          title: 'Neues Projekt',
                          description: 'Beschreibung des Projekts',
                          techStack: ['React', 'TypeScript'],
                        };
                        setCvData({ ...cvData, projects: [...(cvData.projects || []), newProj] });
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> Projekt hinzufügen
                    </button>
                  </div>
                )}
              </div>

              {/* BOTTOM: KI Refinement Panel */}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Wand2 size={13} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>KI-Assistent: Lebenslauf verfeinern</span>
                </div>

                {/* Action Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  <button onClick={() => handleApplyRefine('Formuliere die Zusammenfassung und Erfolge prägnanter und professioneller')} className="badge" style={{ cursor: 'pointer', fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    ✨ Formulierungen schärfen
                  </button>
                  <button onClick={() => handleApplyRefine('Hebe relevante technische Kenntnisse und Projekte stärker hervor')} className="badge" style={{ cursor: 'pointer', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    ✨ Tech-Skills betonen
                  </button>
                </div>

                {/* Prompt Input */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: '0.775rem', padding: '6px 10px' }}
                    placeholder="Anweisung an KI z.B. 'Kürze den Text für 1-Seite'..."
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyRefine()}
                  />
                  <button onClick={() => handleApplyRefine()} disabled={isRefining || !refinePrompt.trim()} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                    {isRefining ? <Loader2 size={13} className="spin-icon" /> : <Send size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Real-time Live Preview (Scrollable) */}
            <div style={{ flex: 1, height: '100%', minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '24px 16px', background: '#334155', borderRadius: 'var(--radius-lg)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <CVRenderer data={cvData} options={styleOptions} targetId="cv-pdf-render-target" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
