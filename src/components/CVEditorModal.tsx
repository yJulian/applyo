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
  Upload,
  Eye,
  EyeOff,
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
  onSelectJob?: (job: JobMetadata) => void;
}

export const CVEditorModal: React.FC<CVEditorModalProps> = ({
  isOpen,
  onClose,
  jobs,
  selectedJob,
}) => {
  if (!isOpen) return null;

  const [cvData, setCvData] = useState<CVData | null>(null);
  const [styleOptions, setStyleOptions] = useState<CVStyleOptions>(DEFAULT_CV_STYLE);
  const [activeTab, setActiveTab] = useState<'profile' | 'experiences' | 'skills' | 'education' | 'projects'>('profile');
  
  // Loading & Saving States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // AI Refinement Prompt state
  const [refinePrompt, setRefinePrompt] = useState('');

  // Merge CV data with master global libraries from UserProfile
  const mergeWithGlobalProfile = (cv: CVData, profile: any): CVData => {
    const merged = { ...cv };

    // Sync contact header
    merged.header.fullName = profile.fullName || merged.header.fullName;
    merged.header.email = profile.email || merged.header.email;
    merged.header.phone = profile.phone || merged.header.phone;
    merged.header.location = profile.location || merged.header.location;

    // Merge Experiences
    const currentExpKeys = new Set((merged.experiences || []).map((e) => `${e.company}-${e.position}`.toLowerCase()));
    const extraExperiences = (profile.globalExperiences || [])
      .filter((ge: any) => !currentExpKeys.has(`${ge.company}-${ge.position}`.toLowerCase()))
      .map((ge: any) => ({ ...ge, hidden: true }));
    merged.experiences = [...(merged.experiences || []), ...extraExperiences];

    // Merge Education
    const currentEduKeys = new Set((merged.education || []).map((e) => `${e.institution}-${e.degree}`.toLowerCase()));
    const extraEducation = (profile.globalEducation || [])
      .filter((ge: any) => !currentEduKeys.has(`${ge.institution}-${ge.degree}`.toLowerCase()))
      .map((ge: any) => ({ ...ge, hidden: true }));
    merged.education = [...(merged.education || []), ...extraEducation];

    // Merge Skill Categories
    const currentSkillKeys = new Set((merged.skillCategories || []).map((s) => s.category.toLowerCase()));
    const extraSkills = (profile.globalSkillCategories || [])
      .filter((gs: any) => !currentSkillKeys.has(gs.category.toLowerCase()))
      .map((gs: any) => ({ ...gs, hidden: true }));
    merged.skillCategories = [...(merged.skillCategories || []), ...extraSkills];

    // Merge Projects
    const currentProjKeys = new Set((merged.projects || []).map((p) => p.title.toLowerCase()));
    const extraProjects = (profile.globalProjects || [])
      .filter((gp: any) => !currentProjKeys.has(gp.title.toLowerCase()))
      .map((gp: any) => ({ ...gp, hidden: true }));
    merged.projects = [...(merged.projects || []), ...extraProjects];

    return merged;
  };

  // Sync current items back to master global libraries
  const syncToGlobalProfile = async (data: CVData) => {
    const profile = await profileService.getProfile();
    await profileService.saveProfile({
      ...profile,
      globalExperiences: data.experiences || [],
      globalEducation: data.education || [],
      globalSkillCategories: data.skillCategories || [],
      globalProjects: data.projects || [],
    });
  };

  // Initial Load
  useEffect(() => {
    async function initCV() {
      setIsGenerating(true);
      const profile = await profileService.getProfile();
      
      // Load last used global CV style if available
      if (profile.lastUsedCVStyle) {
        setStyleOptions(profile.lastUsedCVStyle);
      }

      let loadedCV: CVData | null = null;

      // Check if job already has a saved Lebenslauf.json or Lebenslauf.md
      if (selectedJob) {
        const savedJson = await fileSystemService.readTextFile(selectedJob, 'Lebenslauf.json');
        if (savedJson) {
          try {
            const parsed = JSON.parse(savedJson) as CVData;
            loadedCV = parsed;
            if (parsed.styleOptions) {
              setStyleOptions(parsed.styleOptions);
            }
          } catch (e) {
            console.warn('Lebenslauf.json konnte nicht gelesen werden, erstelle neu:', e);
          }
        }
      }

      // Otherwise generate tailored CV
      if (!loadedCV) {
        loadedCV = await aiService.generateTailoredCV(profile, selectedJob);
      }

      // Always merge with global master profile libraries so items from all resumes are available
      if (loadedCV && profile) {
        loadedCV = mergeWithGlobalProfile(loadedCV, profile);
        await syncToGlobalProfile(loadedCV);
      }

      setCvData(loadedCV);
      setIsGenerating(false);
    }

    initCV();
  }, [selectedJob]);

  // Update style options and persist globally
  const handleStyleChange = (newStyle: CVStyleOptions) => {
    setStyleOptions(newStyle);
    profileService.getProfile().then((p) => {
      profileService.saveProfile({ ...p, lastUsedCVStyle: newStyle });
    });
  };

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
      // Persist current style inside the CV Data JSON
      const dataToSave: CVData = { ...cvData, styleOptions };

      // Save style & master libraries globally
      const profile = await profileService.getProfile();
      await profileService.saveProfile({
        ...profile,
        lastUsedCVStyle: styleOptions,
        globalExperiences: cvData.experiences || [],
        globalEducation: cvData.education || [],
        globalSkillCategories: cvData.skillCategories || [],
        globalProjects: cvData.projects || [],
      });

      // 1. Save JSON representation
      await fileSystemService.writeTextFile(targetJob, 'Lebenslauf.json', JSON.stringify(dataToSave, null, 2));

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
      aiService.notifyUser(`✅ Lebenslauf.md und Lebenslauf.json (inkl. Vorlage & globale Bibliothek) erfolgreich im Ordner "${targetJob.company}" gespeichert!`);
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

  // Handle JSON Import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let parsed = JSON.parse(evt.target?.result as string) as CVData;
        const profile = await profileService.getProfile();
        parsed = mergeWithGlobalProfile(parsed, profile);
        await syncToGlobalProfile(parsed);

        setCvData(parsed);
        if (parsed.styleOptions) {
          handleStyleChange(parsed.styleOptions);
        }
        aiService.notifyUser('✅ Lebenslauf.json (inkl. Vorlage & globale Bibliothek) erfolgreich geladen!');
      } catch (err) {
        aiService.notifyUser('Fehler beim Einlesen der JSON-Datei.');
      }
    };
    reader.readAsText(file);
  };

  // Action Buttons
  const accentColors: CVAccentColor[] = ['#6366f1', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b'];

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
          </div>

          {/* Template & Color Selector Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Template Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <Layout size={14} color="var(--accent-cyan)" />
              <select
                value={styleOptions.templateId}
                onChange={(e) => handleStyleChange({ ...styleOptions, templateId: e.target.value as CVTemplateId })}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.775rem', cursor: 'pointer', outline: 'none' }}
              >
                <option value="modern_glass">Vorlage: Modern Glass</option>
                <option value="minimal_clean">Vorlage: Minimal Clean</option>
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
              title="Lebenslauf auf Basis von Profil und Stelle per KI neu generieren"
            >
              {isGenerating ? <Loader2 size={14} className="spin-icon" /> : <Sparkles size={14} color="var(--accent-primary)" />}
              <span>KI Neu Generieren</span>
            </button>

            <label
              className="btn btn-secondary"
              style={{ gap: '6px', fontSize: '0.8rem', padding: '7px 12px', cursor: 'pointer' }}
              title="Bestehende Lebenslauf.json Datei von der Festplatte öffnen"
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
                <button onClick={() => setActiveTab('profile')} className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <User size={12} /> Profil
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
                {activeTab === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ℹ Personendaten (<strong style={{ color: '#fff' }}>{cvData.header.fullName}</strong>, <strong style={{ color: '#fff' }}>{cvData.header.email}</strong>, <strong style={{ color: '#fff' }}>{cvData.header.phone}</strong>) werden aus deinem globalen Profil übernommen.
                    </div>

                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Angestrebter Stellentitel
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="z.B. Senior Fullstack Developer & Cloud Architect"
                        value={cvData.header.title}
                        onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, title: e.target.value } })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Professionelle Zusammenfassung
                      </label>
                      <textarea
                        rows={6}
                        className="input-field"
                        style={{ lineHeight: 1.5, resize: 'vertical' }}
                        placeholder="Kurze Zusammenfassung deines Werdegangs und deiner Schwerpunkte..."
                        value={cvData.summary}
                        onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'experiences' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {cvData.experiences.map((exp, idx) => {
                      const isGlobalMode = exp.activeVersion === 'global';
                      const currentPosition = isGlobalMode ? exp.position : (exp.tailoredPosition || exp.position);
                      const currentHighlights = isGlobalMode ? (exp.highlights || []) : (exp.tailoredHighlights || exp.highlights || []);

                      return (
                        <div key={exp.id} style={{ padding: '10px', borderRadius: '8px', background: exp.hidden ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: exp.hidden ? '1px dashed rgba(255,255,255,0.1)' : '1px solid var(--border-color)', opacity: exp.hidden ? 0.6 : 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: exp.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>Station #{idx + 1}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {/* 2-Tier Version Toggle */}
                              <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', padding: '2px', borderRadius: '6px' }}>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.experiences];
                                    updated[idx].activeVersion = 'global';
                                    setCvData({ ...cvData, experiences: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: isGlobalMode ? 'var(--accent-cyan)' : 'transparent', color: isGlobalMode ? '#000' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title="Globale Vorlage bearbeiten"
                                >
                                  🌐 Global
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.experiences];
                                    updated[idx].activeVersion = 'tailored';
                                    setCvData({ ...cvData, experiences: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: !isGlobalMode ? 'var(--accent-primary)' : 'transparent', color: !isGlobalMode ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title="KI-angepassten Text für diese Stelle bearbeiten"
                                >
                                  ✨ KI-Text
                                </button>
                              </div>

                              <button
                                onClick={() => {
                                  const updated = [...cvData.experiences];
                                  updated[idx].hidden = !updated[idx].hidden;
                                  setCvData({ ...cvData, experiences: updated });
                                }}
                                className={`btn ${exp.hidden ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ padding: '2px 7px', fontSize: '0.7rem', gap: '4px' }}
                                title={exp.hidden ? 'Für diesen Lebenslauf anzeigen' : 'Für diesen Lebenslauf ausblenden'}
                              >
                                {exp.hidden ? <EyeOff size={12} color="#94a3b8" /> : <Eye size={12} />}
                                <span>{exp.hidden ? 'Ausgeblendet' : 'Aktiv'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  const filtered = cvData.experiences.filter((_, i) => i !== idx);
                                  setCvData({ ...cvData, experiences: filtered });
                                }}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title="Löschen"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            className="input-field"
                            style={{ marginBottom: '6px', fontSize: '0.8rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? 'Position (Global)' : 'Position (KI-angepasst für Stelle)'}
                            value={currentPosition}
                            onChange={(e) => {
                              const updated = [...cvData.experiences];
                              if (isGlobalMode) {
                                updated[idx].position = e.target.value;
                              } else {
                                updated[idx].tailoredPosition = e.target.value;
                              }
                              setCvData({ ...cvData, experiences: updated });
                            }}
                          />
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
                            style={{ fontSize: '0.75rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? 'Stichpunkte (Global)...' : 'Stichpunkte (KI-angepasst)...'}
                            value={currentHighlights.join('\n')}
                            onChange={(e) => {
                              const updated = [...cvData.experiences];
                              const list = e.target.value.split('\n').filter(Boolean);
                              if (isGlobalMode) {
                                updated[idx].highlights = list;
                              } else {
                                updated[idx].tailoredHighlights = list;
                              }
                              setCvData({ ...cvData, experiences: updated });
                            }}
                          />
                        </div>
                      );
                    })}

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
                          hidden: false,
                        };
                        const updatedList = [...cvData.experiences, newExp];
                        setCvData({ ...cvData, experiences: updatedList });

                        // Sync globally to userProfile
                        profileService.getProfile().then(p => {
                          profileService.saveProfile({ ...p, globalExperiences: updatedList });
                        });
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> Erfahrung hinzufügen (auch global)
                    </button>
                  </div>
                )}

                {activeTab === 'education' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cvData.education.map((edu, idx) => {
                      const isGlobalMode = edu.activeVersion === 'global';
                      const currentDegree = isGlobalMode ? edu.degree : (edu.tailoredDegree || edu.degree);

                      return (
                        <div key={edu.id} style={{ padding: '10px', borderRadius: '8px', background: edu.hidden ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: edu.hidden ? '1px dashed rgba(255,255,255,0.1)' : '1px solid var(--border-color)', opacity: edu.hidden ? 0.6 : 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: edu.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>Abschluss #{idx + 1}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', padding: '2px', borderRadius: '6px' }}>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.education];
                                    updated[idx].activeVersion = 'global';
                                    setCvData({ ...cvData, education: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: isGlobalMode ? 'var(--accent-cyan)' : 'transparent', color: isGlobalMode ? '#000' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                >
                                  🌐 Global
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.education];
                                    updated[idx].activeVersion = 'tailored';
                                    setCvData({ ...cvData, education: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: !isGlobalMode ? 'var(--accent-primary)' : 'transparent', color: !isGlobalMode ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                >
                                  ✨ KI-Text
                                </button>
                              </div>

                              <button
                                onClick={() => {
                                  const updated = [...cvData.education];
                                  updated[idx].hidden = !updated[idx].hidden;
                                  setCvData({ ...cvData, education: updated });
                                }}
                                className={`btn ${edu.hidden ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ padding: '2px 7px', fontSize: '0.7rem', gap: '4px' }}
                              >
                                {edu.hidden ? <EyeOff size={12} color="#94a3b8" /> : <Eye size={12} />}
                                <span>{edu.hidden ? 'Ausgeblendet' : 'Aktiv'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  const filtered = cvData.education.filter((_, i) => i !== idx);
                                  setCvData({ ...cvData, education: filtered });
                                }}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <input type="text" className="input-field" style={{ marginBottom: '4px', fontSize: '0.8rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }} placeholder={isGlobalMode ? 'Abschluss (Global)' : 'Abschluss (KI-angepasst)'} value={currentDegree} onChange={(e) => {
                            const updated = [...cvData.education];
                            if (isGlobalMode) {
                              updated[idx].degree = e.target.value;
                            } else {
                              updated[idx].tailoredDegree = e.target.value;
                            }
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
                      );
                    })}

                    <button
                      onClick={() => {
                        const newEdu = {
                          id: `edu-${Date.now()}`,
                          institution: 'Hochschule / Schule',
                          degree: 'Bachelor / Master',
                          fieldOfStudy: 'Fachrichtung',
                          startDate: '2019',
                          endDate: '2022',
                          hidden: false,
                        };
                        const updatedList = [...cvData.education, newEdu];
                        setCvData({ ...cvData, education: updatedList });

                        profileService.getProfile().then(p => {
                          profileService.saveProfile({ ...p, globalEducation: updatedList });
                        });
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> Bildung hinzufügen (auch global)
                    </button>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cvData.skillCategories.map((cat, idx) => (
                      <div key={cat.id} style={{ padding: '10px', borderRadius: '8px', background: cat.hidden ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: cat.hidden ? '1px dashed rgba(255,255,255,0.1)' : '1px solid var(--border-color)', opacity: cat.hidden ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: cat.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>Kategorie #{idx + 1}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => {
                                const updated = [...cvData.skillCategories];
                                updated[idx].hidden = !updated[idx].hidden;
                                setCvData({ ...cvData, skillCategories: updated });
                              }}
                              className={`btn ${cat.hidden ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ padding: '2px 7px', fontSize: '0.7rem', gap: '4px' }}
                              title={cat.hidden ? 'Für diesen Lebenslauf anzeigen' : 'Für diesen Lebenslauf ausblenden'}
                            >
                              {cat.hidden ? <EyeOff size={12} color="#94a3b8" /> : <Eye size={12} />}
                              <span>{cat.hidden ? 'Ausgeblendet' : 'Aktiv'}</span>
                            </button>
                            <button
                              onClick={() => {
                                const filtered = cvData.skillCategories.filter((_, i) => i !== idx);
                                setCvData({ ...cvData, skillCategories: filtered });
                              }}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                              title="Löschen"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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
                          hidden: false,
                        };
                        const updatedList = [...cvData.skillCategories, newCat];
                        setCvData({ ...cvData, skillCategories: updatedList });

                        profileService.getProfile().then(p => {
                          profileService.saveProfile({ ...p, globalSkillCategories: updatedList });
                        });
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> Skill-Kategorie hinzufügen (auch global)
                    </button>
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(cvData.projects || []).map((proj, idx) => (
                      <div key={proj.id} style={{ padding: '10px', borderRadius: '8px', background: proj.hidden ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: proj.hidden ? '1px dashed rgba(255,255,255,0.1)' : '1px solid var(--border-color)', opacity: proj.hidden ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: proj.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>Projekt #{idx + 1}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => {
                                const updated = [...(cvData.projects || [])];
                                updated[idx].hidden = !updated[idx].hidden;
                                setCvData({ ...cvData, projects: updated });
                              }}
                              className={`btn ${proj.hidden ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ padding: '2px 7px', fontSize: '0.7rem', gap: '4px' }}
                              title={proj.hidden ? 'Für diesen Lebenslauf anzeigen' : 'Für diesen Lebenslauf ausblenden'}
                            >
                              {proj.hidden ? <EyeOff size={12} color="#94a3b8" /> : <Eye size={12} />}
                              <span>{proj.hidden ? 'Ausgeblendet' : 'Aktiv'}</span>
                            </button>
                            <button
                              onClick={() => {
                                const filtered = (cvData.projects || []).filter((_, i) => i !== idx);
                                setCvData({ ...cvData, projects: filtered });
                              }}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                              title="Löschen"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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
                          hidden: false,
                        };
                        const updatedList = [...(cvData.projects || []), newProj];
                        setCvData({ ...cvData, projects: updatedList });

                        profileService.getProfile().then(p => {
                          profileService.saveProfile({ ...p, globalProjects: updatedList });
                        });
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> Projekt hinzufügen (auch global)
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
