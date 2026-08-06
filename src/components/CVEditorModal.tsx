import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Eye,
  EyeOff,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from 'lucide-react';
import { JobMetadata } from '../types/job';
import { CVData, CVStyleOptions, DEFAULT_CV_STYLE, CVTemplateId, CVAccentColor } from '../types/cv';
import { profileService } from '../services/storage/profileService';
import { aiService } from '../services/ai/aiService';
import { fileSystemService } from '../services/storage/fileSystem';
import { pdfExporter } from '../services/export/pdfExporter';
import { CVRenderer } from './cv-templates/CVRenderer';
import {
  getExpPosition, getExpSummary, getExpHighlights,
  getEduDegree,
  getSkillCat, getSkillList,
} from '../utils/cvVersioning';
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
  const { t } = useTranslation();

  const [cvData, setCvData] = useState<CVData | null>(null);
  const [styleOptions, setStyleOptions] = useState<CVStyleOptions>(DEFAULT_CV_STYLE);
  const [activeTab, setActiveTab] = useState<'profile' | 'experiences' | 'skills' | 'education' | 'projects'>('profile');
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  
  // Loading & Saving States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // AI Refinement Prompt state
  const [refinePrompt, setRefinePrompt] = useState('');

  // Drag & Drop State for Category Item Reordering
  const [draggedItem, setDraggedItem] = useState<{
    category: 'experiences' | 'education' | 'skills' | 'projects';
    index: number;
  } | null>(null);

  const handleItemDragStart = (
    e: React.DragEvent,
    category: 'experiences' | 'education' | 'skills' | 'projects',
    index: number
  ) => {
    setDraggedItem({ category, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleItemDragOver = (
    e: React.DragEvent,
    category: 'experiences' | 'education' | 'skills' | 'projects',
    targetIndex: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedItem && draggedItem.category === category && draggedItem.index !== targetIndex) {
      if (!cvData) return;
      const listKey: 'experiences' | 'education' | 'skillCategories' | 'projects' =
        category === 'experiences'
          ? 'experiences'
          : category === 'education'
          ? 'education'
          : category === 'skills'
          ? 'skillCategories'
          : 'projects';

      const list = [...((cvData[listKey] as any[]) || [])];
      const [moved] = list.splice(draggedItem.index, 1);
      list.splice(targetIndex, 0, moved);

      setCvData({ ...cvData, [listKey]: list });
      setDraggedItem({ category, index: targetIndex });
    }
  };

  const handleItemDragEnd = () => {
    setDraggedItem(null);
  };

  const moveItem = (
    category: 'experiences' | 'education' | 'skills' | 'projects',
    index: number,
    direction: 'up' | 'down'
  ) => {
    if (!cvData) return;
    const listKey: 'experiences' | 'education' | 'skillCategories' | 'projects' =
      category === 'experiences'
        ? 'experiences'
        : category === 'education'
        ? 'education'
        : category === 'skills'
        ? 'skillCategories'
        : 'projects';

    const list = [...((cvData[listKey] as any[]) || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    setCvData({ ...cvData, [listKey]: list });
  };

  // Merge CV data with master global libraries from UserProfile
  const mergeWithGlobalProfile = (cv: CVData, profile: any): CVData => {
    const merged = { ...cv };

    // Sync contact header & global profile links/details
    merged.header.fullName = profile.fullName || merged.header.fullName;
    merged.header.email = profile.email || merged.header.email;
    merged.header.phone = profile.phone || merged.header.phone;
    merged.header.location = profile.location || merged.header.location;
    merged.header.address = profile.address ?? merged.header.address;
    merged.header.citizenship = profile.citizenship ?? merged.header.citizenship;
    merged.header.website = profile.website ?? merged.header.website;
    merged.header.github = profile.github ?? merged.header.github;
    merged.header.linkedin = profile.linkedin ?? merged.header.linkedin;
    merged.header.xing = profile.xing ?? merged.header.xing;
    merged.header.portfolio = profile.portfolio ?? merged.header.portfolio;

    // Ensure show flags default to true if link/field exists and flag is undefined
    if (merged.header.showCitizenship === undefined && merged.header.citizenship) merged.header.showCitizenship = true;
    if (merged.header.showLinkedin === undefined && merged.header.linkedin) merged.header.showLinkedin = true;
    if (merged.header.showGithub === undefined && merged.header.github) merged.header.showGithub = true;
    if (merged.header.showXing === undefined && merged.header.xing) merged.header.showXing = true;
    if (merged.header.showWebsite === undefined && merged.header.website) merged.header.showWebsite = true;
    if (merged.header.showPortfolio === undefined && merged.header.portfolio) merged.header.showPortfolio = true;

    // Merge current job's items with the master global library. Items are matched
    // by their stable `id` first. An item only just generated by the AI (which mints
    // its own fresh ids, see aiService.generateTailoredCV) is matched to its global
    // counterpart once, by a derived text key — and then "adopts" the global id, so
    // later edits to that text (company, category name, project title, ...) no longer
    // break the match and cause the global copy to be re-appended as a duplicate.
    const mergeCategory = <T extends { id: string; hidden?: boolean }>(
      current: T[],
      globalItems: T[],
      textKey: (item: T) => string
    ): T[] => {
      const currentIds = new Set(current.map((item) => item.id));
      const extra: T[] = [];
      for (const ge of globalItems) {
        if (currentIds.has(ge.id)) continue;
        const key = textKey(ge);
        const existingByText = current.find((item) => textKey(item) === key);
        if (existingByText) {
          existingByText.id = ge.id;
          continue;
        }
        extra.push({ ...ge, hidden: true });
      }
      return [...current, ...extra];
    };

    merged.experiences = mergeCategory(
      merged.experiences || [],
      profile.globalExperiences || [],
      (e) => `${e.company}-${e.position}`.toLowerCase()
    );
    merged.education = mergeCategory(
      merged.education || [],
      profile.globalEducation || [],
      (e) => `${e.institution}-${e.degree}`.toLowerCase()
    );
    merged.skillCategories = mergeCategory(
      merged.skillCategories || [],
      profile.globalSkillCategories || [],
      (s) => s.category.toLowerCase()
    );
    merged.projects = mergeCategory(
      merged.projects || [],
      profile.globalProjects || [],
      (p) => p.title.toLowerCase()
    );

    return merged;
  };

  // Initial Load
  useEffect(() => {
    if (!isOpen) return;

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
      }

      setCvData(loadedCV);
      setIsGenerating(false);
    }

    initCV();
  }, [isOpen, selectedJob?.id]);

  if (!isOpen) return null;

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

      // Save style preference
      const profile = await profileService.getProfile();
      await profileService.saveProfile({
        ...profile,
        lastUsedCVStyle: styleOptions,
      });

      // 1. Save JSON representation
      await fileSystemService.writeTextFile(targetJob, 'Lebenslauf.json', JSON.stringify(dataToSave, null, 2));

      // 2. Save Markdown representation for easy reading
      const markdownCV = `# ${cvData.header.fullName} - Lebenslauf
**${cvData.header.title}**
E-Mail: ${cvData.header.email} | Tel: ${cvData.header.phone} | Ort: ${cvData.header.location}

## Profil & Zusammenfassung
${cvData.summary}

## Berufserfahrung
${cvData.experiences.map(exp => `### ${getExpPosition(exp)} bei ${exp.company} (${exp.startDate} - ${exp.endDate})
${getExpSummary(exp) || ''}
${(getExpHighlights(exp) || []).map(h => `- ${h}`).join('\n')}`).join('\n\n')}

## Kenntnisse & Skills
${cvData.skillCategories.map(cat => `**${getSkillCat(cat)}:** ${(getSkillList(cat) || []).join(', ')}`).join('\n')}

## Ausbildung
${cvData.education.map(edu => `- **${getEduDegree(edu)}** (${edu.institution}, ${edu.startDate}-${edu.endDate})`).join('\n')}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('cv_editor.title')}</h2>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'rgba(6, 182, 212, 0.85)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                    lineHeight: 1,
                  }}
                >
                  BETA
                </span>
              </div>
            </div>
          </div>

          {/* Template & Color Selector Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Custom Styled Template Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                className="btn btn-secondary"
                style={{
                  gap: '8px',
                  fontSize: '0.8rem',
                  padding: '7px 12px',
                  cursor: 'pointer',
                  borderColor: isTemplateMenuOpen ? 'var(--accent-cyan)' : undefined,
                  boxShadow: isTemplateMenuOpen ? '0 0 12px rgba(6, 182, 212, 0.25)' : undefined,
                }}
              >
                <Layout size={14} color="var(--accent-cyan)" />
                <span>
                  {styleOptions.templateId === 'modern_glass' && 'Modern Glass'}
                  {styleOptions.templateId === 'minimal_clean' && 'Minimal Clean'}
                  {styleOptions.templateId === 'minimal_clean_briefkopf' && (t('cv_editor.template_minimal_briefkopf') || 'Minimal Clean (Briefkopf)')}
                </span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: isTemplateMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'var(--text-muted)',
                  }}
                />
              </button>

              {isTemplateMenuOpen && (
                <>
                  <div
                    onClick={() => setIsTemplateMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      zIndex: 100,
                      background: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(6, 182, 212, 0.15)',
                      padding: '6px',
                      minWidth: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {[
                      { id: 'modern_glass', name: 'Modern Glass', desc: 'Glaseffekt, Akzentfarben & modern' },
                      { id: 'minimal_clean', name: 'Minimal Clean', desc: 'Schlicht, hochlesbar & elegant' },
                      { id: 'minimal_clean_briefkopf', name: t('cv_editor.template_minimal_briefkopf') || 'Minimal Clean (Briefkopf)', desc: t('cv_editor.template_minimal_briefkopf_desc') || 'Schlicht mit Absender-Briefkopf & Adresse' },
                    ].map((tmpl) => {
                      const isSelected = styleOptions.templateId === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          onClick={() => {
                            handleStyleChange({ ...styleOptions, templateId: tmpl.id as CVTemplateId });
                            setIsTemplateMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                            color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500 }}>{tmpl.name}</div>
                            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{tmpl.desc}</div>
                          </div>
                          {isSelected && <Check size={14} color="var(--accent-cyan)" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
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
              <span>{t('cv_editor.ai_regenerate')}</span>
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
              <span>{t('cv_editor.export_pdf')}</span>
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
                  <User size={12} /> {t('cv_editor.tab_profile')}
                </button>
                <button onClick={() => setActiveTab('experiences')} className={`btn ${activeTab === 'experiences' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <Briefcase size={12} /> {t('cv_editor.tab_experiences')}
                </button>
                <button onClick={() => setActiveTab('education')} className={`btn ${activeTab === 'education' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <GraduationCap size={12} /> {t('cv_editor.tab_education')}
                </button>
                <button onClick={() => setActiveTab('skills')} className={`btn ${activeTab === 'skills' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <Code2 size={12} /> {t('cv_editor.tab_skills')}
                </button>
                <button onClick={() => setActiveTab('projects')} className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <FolderGit2 size={12} /> {t('cv_editor.tab_projects')}
                </button>
              </div>

              {/* Tab Form Content */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeTab === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Header Personendaten Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          Vollständiger Name
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          style={{ fontSize: '0.8rem' }}
                          value={cvData.header.fullName || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, fullName: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          E-Mail
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          style={{ fontSize: '0.8rem' }}
                          value={cvData.header.email || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, email: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          Telefon
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          style={{ fontSize: '0.8rem' }}
                          value={cvData.header.phone || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, phone: e.target.value } })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          Wohnort
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          style={{ fontSize: '0.8rem' }}
                          value={cvData.header.location || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, location: e.target.value } })}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          {t('cv_editor.address') || 'Adresse (Briefkopf)'}
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          style={{ fontSize: '0.8rem' }}
                          placeholder="z.B. Musterstraße 12, 10115 Berlin"
                          value={cvData.header.address || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, address: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        {t('cv_editor.target_title')}
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="z.B. Senior Fullstack Developer & Cloud Architect"
                        value={cvData.header.title || ''}
                        onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, title: e.target.value } })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        {t('cv_editor.prof_summary')}
                      </label>
                      <textarea
                        rows={5}
                        className="input-field"
                        style={{ lineHeight: 1.5, resize: 'vertical' }}
                        placeholder="Kurze Zusammenfassung deines Werdegangs und deiner Schwerpunkte..."
                        value={cvData.summary || ''}
                        onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                      />
                    </div>

                    {/* Links & Zusätzliche Kopfdaten-Toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {t('cv_editor.header_profiles')}
                      </span>

                      {/* Staatsbürgerschaft */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>{t('cv_editor.citizenship')}</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showCitizenship: !(cvData.header.showCitizenship ?? Boolean(cvData.header.citizenship)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showCitizenship ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showCitizenship ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showCitizenship ? t('cv_editor.visible') : t('cv_editor.hidden')}
                          </button>
                        </div>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="z.B. Deutsch"
                          value={cvData.header.citizenship || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, citizenship: e.target.value } })}
                        />
                      </div>

                      {/* LinkedIn */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>{t('cv_editor.linkedin')}</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showLinkedin: !(cvData.header.showLinkedin ?? Boolean(cvData.header.linkedin)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showLinkedin ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showLinkedin ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showLinkedin ? t('cv_editor.visible') : t('cv_editor.hidden')}
                          </button>
                        </div>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="linkedin.com/in/profil"
                          value={cvData.header.linkedin || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, linkedin: e.target.value } })}
                        />
                      </div>

                      {/* GitHub */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>{t('cv_editor.github')}</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showGithub: !(cvData.header.showGithub ?? Boolean(cvData.header.github)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showGithub ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showGithub ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showGithub ? t('cv_editor.visible') : t('cv_editor.hidden')}
                          </button>
                        </div>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="github.com/profil"
                          value={cvData.header.github || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, github: e.target.value } })}
                        />
                      </div>

                      {/* XING */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>{t('cv_editor.xing')}</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showXing: !(cvData.header.showXing ?? Boolean(cvData.header.xing)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showXing ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showXing ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showXing ? t('cv_editor.visible') : t('cv_editor.hidden')}
                          </button>
                        </div>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="xing.com/profile/name"
                          value={cvData.header.xing || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, xing: e.target.value } })}
                        />
                      </div>

                      {/* Website */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>{t('cv_editor.website')}</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showWebsite: !(cvData.header.showWebsite ?? Boolean(cvData.header.website)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showWebsite ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showWebsite ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showWebsite ? t('cv_editor.visible') : t('cv_editor.hidden')}
                          </button>
                        </div>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="https://deine-website.de"
                          value={cvData.header.website || ''}
                          onChange={(e) => setCvData({ ...cvData, header: { ...cvData.header, website: e.target.value } })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'experiences' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {cvData.experiences.map((exp, idx) => {
                      const isGlobalMode = exp.activeVersion === 'global' || !exp.activeVersion;
                      const currentPosition = isGlobalMode ? exp.position : (exp.tailoredPosition ?? exp.position);
                      const currentSummary = isGlobalMode ? (exp.summary || '') : (exp.tailoredSummary ?? exp.summary ?? '');
                      const currentHighlights = isGlobalMode ? (exp.highlights || []) : (exp.tailoredHighlights ?? exp.highlights ?? []);
                      const isDraggingThis = draggedItem?.category === 'experiences' && draggedItem?.index === idx;

                      return (
                        <div
                          key={exp.id}
                          onDragOver={(e) => handleItemDragOver(e, 'experiences', idx)}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: isDraggingThis ? 'rgba(99, 102, 241, 0.15)' : exp.hidden ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                            border: isDraggingThis ? '2px solid var(--accent-cyan)' : exp.hidden ? '1px dashed rgba(255,255,255,0.1)' : '1px solid var(--border-color)',
                            opacity: exp.hidden ? 0.6 : 1,
                            transition: 'all 0.15s ease',
                            transform: isDraggingThis ? 'scale(1.01)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div
                                draggable
                                onDragStart={(e) => handleItemDragStart(e, 'experiences', idx)}
                                onDragEnd={handleItemDragEnd}
                                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--accent-cyan)', padding: '2px' }}
                                title="Per Drag & Drop verschieben"
                              >
                                <GripVertical size={16} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: exp.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>{t('cv_editor.station')} #{idx + 1}</span>
                              <div style={{ display: 'flex', gap: '2px', marginLeft: '2px' }}>
                                <button
                                  onClick={() => moveItem('experiences', idx, 'up')}
                                  disabled={idx === 0}
                                  style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#94a3b8', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px' }}
                                  title="Nach oben verschieben"
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  onClick={() => moveItem('experiences', idx, 'down')}
                                  disabled={idx === cvData.experiences.length - 1}
                                  style={{ background: 'none', border: 'none', color: idx === cvData.experiences.length - 1 ? 'rgba(255,255,255,0.2)' : '#94a3b8', cursor: idx === cvData.experiences.length - 1 ? 'default' : 'pointer', padding: '2px' }}
                                  title="Nach unten verschieben"
                                >
                                  <ArrowDown size={13} />
                                </button>
                              </div>
                            </div>
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
                                  title={t('cv_editor.mode_global_tooltip')}
                                >
                                  {t('cv_editor.mode_global')}
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.experiences];
                                    updated[idx].activeVersion = 'tailored';
                                    setCvData({ ...cvData, experiences: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: !isGlobalMode ? 'var(--accent-primary)' : 'transparent', color: !isGlobalMode ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title={t('cv_editor.mode_tailored_tooltip')}
                                >
                                  {t('cv_editor.mode_tailored')}
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
                              >
                                {exp.hidden ? <EyeOff size={12} color="#94a3b8" /> : <Eye size={12} />}
                                <span>{exp.hidden ? t('cv_editor.hidden') : t('cv_editor.active')}</span>
                              </button>
                              <button
                                onClick={() => {
                                  const filtered = cvData.experiences.filter((_, i) => i !== idx);
                                  setCvData({ ...cvData, experiences: filtered });
                                }}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title={t('cv_editor.delete')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            className="input-field"
                            style={{ marginBottom: '6px', fontSize: '0.8rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? `${t('cv_editor.position')} (Global)` : `${t('cv_editor.position')} (KI-angepasst)`}
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

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                            <input
                              type="text"
                              className="input-field"
                              style={{ fontSize: '0.8rem' }}
                              placeholder={t('cv_editor.company')}
                              value={exp.company}
                              onChange={(e) => {
                                const updated = [...cvData.experiences];
                                updated[idx].company = e.target.value;
                                setCvData({ ...cvData, experiences: updated });
                              }}
                            />
                            <input
                              type="text"
                              className="input-field"
                              style={{ fontSize: '0.8rem' }}
                              placeholder={t('cv_editor.location')}
                              value={exp.location || ''}
                              onChange={(e) => {
                                const updated = [...cvData.experiences];
                                updated[idx].location = e.target.value;
                                setCvData({ ...cvData, experiences: updated });
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                            <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder={t('cv_editor.from')} value={exp.startDate || ''} onChange={(e) => {
                              const updated = [...cvData.experiences];
                              updated[idx].startDate = e.target.value;
                              setCvData({ ...cvData, experiences: updated });
                            }} />
                            <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder={t('cv_editor.to')} value={exp.endDate || ''} onChange={(e) => {
                              const updated = [...cvData.experiences];
                              const val = e.target.value;
                              updated[idx].endDate = val;
                              const lowerVal = val.trim().toLowerCase();
                              if (lowerVal === 'heute' || lowerVal === 'present' || lowerVal === 'aktuell') {
                                updated[idx].isCurrent = true;
                              } else if (val.trim().length > 0) {
                                updated[idx].isCurrent = false;
                              }
                              setCvData({ ...cvData, experiences: updated });
                            }} />
                          </div>

                          {/* Jobbeschreibung / Kurzbeschreibung (summary) */}
                          <textarea
                            rows={2}
                            className="input-field"
                            style={{ marginBottom: '6px', fontSize: '0.75rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? `${t('cv_editor.job_summary')} (Global)...` : `${t('cv_editor.job_summary')} (KI-angepasst)...`}
                            value={currentSummary}
                            onChange={(e) => {
                              const updated = [...cvData.experiences];
                              if (isGlobalMode) {
                                updated[idx].summary = e.target.value;
                              } else {
                                updated[idx].tailoredSummary = e.target.value;
                              }
                              setCvData({ ...cvData, experiences: updated });
                            }}
                          />

                          {/* Stichpunkte & Erfolge (highlights) */}
                          <textarea
                            rows={3}
                            className="input-field"
                            style={{ fontSize: '0.75rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? `${t('cv_editor.highlights')} (Global)...` : `${t('cv_editor.highlights')} (KI-angepasst)...`}
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
                          summary: 'Jobbeschreibung',
                          highlights: ['Aufgabe / Erfolg'],
                          hidden: false,
                          activeVersion: 'global' as const,
                        };
                        const updatedList = [...cvData.experiences, newExp];
                        const updatedCV = { ...cvData, experiences: updatedList };
                        setCvData(updatedCV);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> {t('cv_editor.add_experience')}
                    </button>
                  </div>
                )}

                {activeTab === 'education' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cvData.education.map((edu, idx) => {
                      const isGlobalMode = edu.activeVersion === 'global' || !edu.activeVersion;
                      const currentDegree = isGlobalMode ? edu.degree : (edu.tailoredDegree ?? edu.degree);
                      const currentDescription = isGlobalMode ? (edu.description || '') : (edu.tailoredDescription ?? edu.description ?? '');
                      const isDraggingThis = draggedItem?.category === 'education' && draggedItem?.index === idx;

                      return (
                        <div
                          key={edu.id}
                          onDragOver={(e) => handleItemDragOver(e, 'education', idx)}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: isDraggingThis ? 'rgba(99, 102, 241, 0.15)' : edu.hidden ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                            border: isDraggingThis ? '2px solid var(--accent-cyan)' : edu.hidden ? '1px dashed rgba(255,255,255,0.1)' : '1px solid var(--border-color)',
                            opacity: edu.hidden ? 0.6 : 1,
                            transition: 'all 0.15s ease',
                            transform: isDraggingThis ? 'scale(1.01)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div
                                draggable
                                onDragStart={(e) => handleItemDragStart(e, 'education', idx)}
                                onDragEnd={handleItemDragEnd}
                                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--accent-cyan)', padding: '2px' }}
                                title="Per Drag & Drop verschieben"
                              >
                                <GripVertical size={16} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: edu.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>{t('cv_editor.degree')} #{idx + 1}</span>
                              <div style={{ display: 'flex', gap: '2px', marginLeft: '2px' }}>
                                <button
                                  onClick={() => moveItem('education', idx, 'up')}
                                  disabled={idx === 0}
                                  style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#94a3b8', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px' }}
                                  title="Nach oben verschieben"
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  onClick={() => moveItem('education', idx, 'down')}
                                  disabled={idx === cvData.education.length - 1}
                                  style={{ background: 'none', border: 'none', color: idx === cvData.education.length - 1 ? 'rgba(255,255,255,0.2)' : '#94a3b8', cursor: idx === cvData.education.length - 1 ? 'default' : 'pointer', padding: '2px' }}
                                  title="Nach unten verschieben"
                                >
                                  <ArrowDown size={13} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', padding: '2px', borderRadius: '6px' }}>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.education];
                                    updated[idx].activeVersion = 'global';
                                    setCvData({ ...cvData, education: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: isGlobalMode ? 'var(--accent-cyan)' : 'transparent', color: isGlobalMode ? '#000' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title={t('cv_editor.mode_global_tooltip')}
                                >
                                  {t('cv_editor.mode_global')}
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.education];
                                    updated[idx].activeVersion = 'tailored';
                                    setCvData({ ...cvData, education: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: !isGlobalMode ? 'var(--accent-primary)' : 'transparent', color: !isGlobalMode ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title={t('cv_editor.mode_tailored_tooltip')}
                                >
                                  {t('cv_editor.mode_tailored')}
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
                                <span>{edu.hidden ? t('cv_editor.hidden') : t('cv_editor.active')}</span>
                              </button>
                              <button
                                onClick={() => {
                                  const filtered = cvData.education.filter((_, i) => i !== idx);
                                  setCvData({ ...cvData, education: filtered });
                                }}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title={t('cv_editor.delete')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <input type="text" className="input-field" style={{ marginBottom: '4px', fontSize: '0.8rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }} placeholder={isGlobalMode ? `${t('cv_editor.degree')} (Global)` : `${t('cv_editor.degree')} (KI-angepasst)`} value={currentDegree} onChange={(e) => {
                            const updated = [...cvData.education];
                            if (isGlobalMode) {
                              updated[idx].degree = e.target.value;
                            } else {
                              updated[idx].tailoredDegree = e.target.value;
                            }
                            setCvData({ ...cvData, education: updated });
                          }} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '4px' }}>
                            <input type="text" className="input-field" style={{ fontSize: '0.8rem' }} placeholder={t('cv_editor.institution')} value={edu.institution} onChange={(e) => {
                              const updated = [...cvData.education];
                              updated[idx].institution = e.target.value;
                              setCvData({ ...cvData, education: updated });
                            }} />
                            <input type="text" className="input-field" style={{ fontSize: '0.8rem' }} placeholder={t('cv_editor.field_of_study')} value={edu.fieldOfStudy || ''} onChange={(e) => {
                              const updated = [...cvData.education];
                              updated[idx].fieldOfStudy = e.target.value;
                              setCvData({ ...cvData, education: updated });
                            }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '4px' }}>
                            <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder={t('cv_editor.from')} value={edu.startDate} onChange={(e) => {
                              const updated = [...cvData.education];
                              updated[idx].startDate = e.target.value;
                              setCvData({ ...cvData, education: updated });
                            }} />
                            <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder={t('cv_editor.to')} value={edu.endDate} onChange={(e) => {
                              const updated = [...cvData.education];
                              updated[idx].endDate = e.target.value;
                              setCvData({ ...cvData, education: updated });
                            }} />
                          </div>
                          <textarea
                            rows={2}
                            className="input-field"
                            style={{ fontSize: '0.75rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? `${t('cv_editor.edu_description')} (Global)...` : `${t('cv_editor.edu_description')} (KI-angepasst)...`}
                            value={currentDescription}
                            onChange={(e) => {
                              const updated = [...cvData.education];
                              if (isGlobalMode) {
                                updated[idx].description = e.target.value;
                              } else {
                                updated[idx].tailoredDescription = e.target.value;
                              }
                              setCvData({ ...cvData, education: updated });
                            }}
                          />
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
                          description: 'Abschlussarbeiten & Schwerpunkte',
                          hidden: false,
                          activeVersion: 'global' as const,
                        };
                        const updatedList = [...cvData.education, newEdu];
                        const updatedCV = { ...cvData, education: updatedList };
                        setCvData(updatedCV);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> {t('cv_editor.add_education')}
                    </button>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cvData.skillCategories.map((cat, idx) => {
                      const isGlobalMode = cat.activeVersion === 'global' || !cat.activeVersion;
                      const currentCategory = isGlobalMode ? cat.category : (cat.tailoredCategory ?? cat.category);
                      const currentSkills = isGlobalMode ? (cat.skills || []) : (cat.tailoredSkills ?? cat.skills ?? []);
                      const isDraggingThis = draggedItem?.category === 'skills' && draggedItem?.index === idx;

                      return (
                        <div
                          key={cat.id}
                          onDragOver={(e) => handleItemDragOver(e, 'skills', idx)}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: isDraggingThis ? 'rgba(99, 102, 241, 0.15)' : cat.hidden ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                            border: isDraggingThis ? '2px solid var(--accent-cyan)' : cat.hidden ? '1px dashed rgba(255,255,255,0.1)' : '1px solid var(--border-color)',
                            opacity: cat.hidden ? 0.6 : 1,
                            transition: 'all 0.15s ease',
                            transform: isDraggingThis ? 'scale(1.01)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div
                                draggable
                                onDragStart={(e) => handleItemDragStart(e, 'skills', idx)}
                                onDragEnd={handleItemDragEnd}
                                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--accent-cyan)', padding: '2px' }}
                                title="Per Drag & Drop verschieben"
                              >
                                <GripVertical size={16} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: cat.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>{t('cv_editor.category')} #{idx + 1}</span>
                              <div style={{ display: 'flex', gap: '2px', marginLeft: '2px' }}>
                                <button
                                  onClick={() => moveItem('skills', idx, 'up')}
                                  disabled={idx === 0}
                                  style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#94a3b8', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px' }}
                                  title="Nach oben verschieben"
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  onClick={() => moveItem('skills', idx, 'down')}
                                  disabled={idx === cvData.skillCategories.length - 1}
                                  style={{ background: 'none', border: 'none', color: idx === cvData.skillCategories.length - 1 ? 'rgba(255,255,255,0.2)' : '#94a3b8', cursor: idx === cvData.skillCategories.length - 1 ? 'default' : 'pointer', padding: '2px' }}
                                  title="Nach unten verschieben"
                                >
                                  <ArrowDown size={13} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {/* 2-Tier Version Toggle */}
                              <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', padding: '2px', borderRadius: '6px' }}>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.skillCategories];
                                    updated[idx].activeVersion = 'global';
                                    setCvData({ ...cvData, skillCategories: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: isGlobalMode ? 'var(--accent-cyan)' : 'transparent', color: isGlobalMode ? '#000' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title={t('cv_editor.mode_global_tooltip')}
                                >
                                  {t('cv_editor.mode_global')}
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.skillCategories];
                                    updated[idx].activeVersion = 'tailored';
                                    setCvData({ ...cvData, skillCategories: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: !isGlobalMode ? 'var(--accent-primary)' : 'transparent', color: !isGlobalMode ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title={t('cv_editor.mode_tailored_tooltip')}
                                >
                                  {t('cv_editor.mode_tailored')}
                                </button>
                              </div>

                              <button
                                onClick={() => {
                                  const updated = [...cvData.skillCategories];
                                  updated[idx].hidden = !updated[idx].hidden;
                                  setCvData({ ...cvData, skillCategories: updated });
                                }}
                                className={`btn ${cat.hidden ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ padding: '2px 7px', fontSize: '0.7rem', gap: '4px' }}
                              >
                                {cat.hidden ? <EyeOff size={12} color="#94a3b8" /> : <Eye size={12} />}
                                <span>{cat.hidden ? t('cv_editor.hidden') : t('cv_editor.active')}</span>
                              </button>
                              <button
                                onClick={() => {
                                  const filtered = cvData.skillCategories.filter((_, i) => i !== idx);
                                  setCvData({ ...cvData, skillCategories: filtered });
                                }}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title={t('cv_editor.delete')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            className="input-field"
                            style={{ marginBottom: '6px', fontWeight: 700, fontSize: '0.8rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? `${t('cv_editor.category_name')} (Global)` : `${t('cv_editor.category_name')} (KI-angepasst)`}
                            value={currentCategory}
                            onChange={(e) => {
                              const updated = [...cvData.skillCategories];
                              if (isGlobalMode) {
                                updated[idx].category = e.target.value;
                              } else {
                                updated[idx].tailoredCategory = e.target.value;
                              }
                              setCvData({ ...cvData, skillCategories: updated });
                            }}
                          />
                          <textarea
                            rows={2}
                            className="input-field"
                            style={{ fontSize: '0.775rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? `${t('cv_editor.skills_comma')} (Global)...` : `${t('cv_editor.skills_comma')} (KI-angepasst)...`}
                            value={currentSkills.join(', ')}
                            onChange={(e) => {
                              const updated = [...cvData.skillCategories];
                              const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                              if (isGlobalMode) {
                                updated[idx].skills = list;
                              } else {
                                updated[idx].tailoredSkills = list;
                              }
                              setCvData({ ...cvData, skillCategories: updated });
                            }}
                          />
                        </div>
                      );
                    })}

                    <button
                      onClick={() => {
                        const newCat = {
                          id: `cat-${Date.now()}`,
                          category: 'Neue Skill-Kategorie',
                          skills: ['Skill A', 'Skill B'],
                          hidden: false,
                          activeVersion: 'global' as const,
                        };
                        const updatedList = [...cvData.skillCategories, newCat];
                        const updatedCV = { ...cvData, skillCategories: updatedList };
                        setCvData(updatedCV);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> {t('cv_editor.add_skill')}
                    </button>
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(cvData.projects || []).map((proj, idx) => {
                      const isGlobalMode = proj.activeVersion === 'global' || !proj.activeVersion;
                      const currentTitle = isGlobalMode ? proj.title : (proj.tailoredTitle ?? proj.title);
                      const currentDescription = isGlobalMode ? (proj.description || '') : (proj.tailoredDescription ?? proj.description ?? '');
                      const currentTechStack = isGlobalMode ? (proj.techStack || []) : (proj.tailoredTechStack ?? proj.techStack ?? []);
                      const isDraggingThis = draggedItem?.category === 'projects' && draggedItem?.index === idx;

                      return (
                        <div
                          key={proj.id}
                          onDragOver={(e) => handleItemDragOver(e, 'projects', idx)}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: isDraggingThis ? 'rgba(99, 102, 241, 0.15)' : proj.hidden ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                            border: isDraggingThis ? '2px solid var(--accent-cyan)' : proj.hidden ? '1px dashed rgba(255,255,255,0.1)' : '1px solid var(--border-color)',
                            opacity: proj.hidden ? 0.6 : 1,
                            transition: 'all 0.15s ease',
                            transform: isDraggingThis ? 'scale(1.01)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div
                                draggable
                                onDragStart={(e) => handleItemDragStart(e, 'projects', idx)}
                                onDragEnd={handleItemDragEnd}
                                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--accent-cyan)', padding: '2px' }}
                                title="Per Drag & Drop verschieben"
                              >
                                <GripVertical size={16} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: proj.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>{t('cv_editor.project')} #{idx + 1}</span>
                              <div style={{ display: 'flex', gap: '2px', marginLeft: '2px' }}>
                                <button
                                  onClick={() => moveItem('projects', idx, 'up')}
                                  disabled={idx === 0}
                                  style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#94a3b8', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px' }}
                                  title="Nach oben verschieben"
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  onClick={() => moveItem('projects', idx, 'down')}
                                  disabled={idx === (cvData.projects || []).length - 1}
                                  style={{ background: 'none', border: 'none', color: idx === (cvData.projects || []).length - 1 ? 'rgba(255,255,255,0.2)' : '#94a3b8', cursor: idx === (cvData.projects || []).length - 1 ? 'default' : 'pointer', padding: '2px' }}
                                  title="Nach unten verschieben"
                                >
                                  <ArrowDown size={13} />
                                </button>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {/* 2-Tier Version Toggle */}
                              <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', padding: '2px', borderRadius: '6px' }}>
                                <button
                                  onClick={() => {
                                    const updated = [...(cvData.projects || [])];
                                    updated[idx].activeVersion = 'global';
                                    setCvData({ ...cvData, projects: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: isGlobalMode ? 'var(--accent-cyan)' : 'transparent', color: isGlobalMode ? '#000' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title={t('cv_editor.mode_global_tooltip')}
                                >
                                  {t('cv_editor.mode_global')}
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = [...(cvData.projects || [])];
                                    updated[idx].activeVersion = 'tailored';
                                    setCvData({ ...cvData, projects: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: !isGlobalMode ? 'var(--accent-primary)' : 'transparent', color: !isGlobalMode ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title={t('cv_editor.mode_tailored_tooltip')}
                                >
                                  {t('cv_editor.mode_tailored')}
                                </button>
                              </div>

                              <button
                                onClick={() => {
                                  const updated = [...(cvData.projects || [])];
                                  updated[idx].hidden = !updated[idx].hidden;
                                  setCvData({ ...cvData, projects: updated });
                                }}
                                className={`btn ${proj.hidden ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ padding: '2px 7px', fontSize: '0.7rem', gap: '4px' }}
                              >
                                {proj.hidden ? <EyeOff size={12} color="#94a3b8" /> : <Eye size={12} />}
                                <span>{proj.hidden ? t('cv_editor.hidden') : t('cv_editor.active')}</span>
                              </button>
                              <button
                                onClick={() => {
                                  const filtered = (cvData.projects || []).filter((_, i) => i !== idx);
                                  setCvData({ ...cvData, projects: filtered });
                                }}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title={t('cv_editor.delete')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            className="input-field"
                            style={{ marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700, border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? `${t('cv_editor.project_name')} (Global)` : `${t('cv_editor.project_name')} (KI-angepasst)`}
                            value={currentTitle}
                            onChange={(e) => {
                              const updated = [...(cvData.projects || [])];
                              if (isGlobalMode) {
                                updated[idx].title = e.target.value;
                              } else {
                                updated[idx].tailoredTitle = e.target.value;
                              }
                              setCvData({ ...cvData, projects: updated });
                            }}
                          />
                          <input
                            type="text"
                            className="input-field"
                            style={{ marginBottom: '4px', fontSize: '0.75rem' }}
                            placeholder={t('cv_editor.project_link')}
                            value={proj.link || ''}
                            onChange={(e) => {
                              const updated = [...(cvData.projects || [])];
                              updated[idx].link = e.target.value;
                              setCvData({ ...cvData, projects: updated });
                            }}
                          />
                          <textarea
                            rows={2}
                            className="input-field"
                            style={{ marginBottom: '4px', fontSize: '0.775rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? `${t('cv_editor.project_desc')} (Global)` : `${t('cv_editor.project_desc')} (KI-angepasst)`}
                            value={currentDescription}
                            onChange={(e) => {
                              const updated = [...(cvData.projects || [])];
                              if (isGlobalMode) {
                                updated[idx].description = e.target.value;
                              } else {
                                updated[idx].tailoredDescription = e.target.value;
                              }
                              setCvData({ ...cvData, projects: updated });
                            }}
                          />
                          <input
                            type="text"
                            className="input-field"
                            style={{ fontSize: '0.75rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? `${t('cv_editor.tech_stack')} (Global)` : `${t('cv_editor.tech_stack')} (KI-angepasst)`}
                            value={currentTechStack.join(', ')}
                            onChange={(e) => {
                              const updated = [...(cvData.projects || [])];
                              const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              if (isGlobalMode) {
                                updated[idx].techStack = list;
                              } else {
                                updated[idx].tailoredTechStack = list;
                              }
                              setCvData({ ...cvData, projects: updated });
                            }}
                          />
                        </div>
                      );
                    })}

                    <button
                      onClick={() => {
                        const newProj = {
                          id: `proj-${Date.now()}`,
                          title: 'Neues Projekt',
                          description: 'Beschreibung des Projekts',
                          techStack: ['React', 'TypeScript'],
                          hidden: false,
                          activeVersion: 'global' as const,
                        };
                        const updatedList = [...(cvData.projects || []), newProj];
                        const updatedCV = { ...cvData, projects: updatedList };
                        setCvData(updatedCV);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <Plus size={13} /> {t('cv_editor.add_project')}
                    </button>
                  </div>
                )}
              </div>

              {/* BOTTOM: KI Refinement Panel */}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Wand2 size={13} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{t('cv_editor.ai_refine_title')}</span>
                </div>

                {/* Action Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  <button onClick={() => handleApplyRefine('Formuliere die Zusammenfassung und Erfolge prägnanter und professioneller')} className="badge" style={{ cursor: 'pointer', fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    {t('cv_editor.refine_chip_concise')}
                  </button>
                  <button onClick={() => handleApplyRefine('Hebe relevante technische Kenntnisse und Projekte stärker hervor')} className="badge" style={{ cursor: 'pointer', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    {t('cv_editor.refine_chip_tech')}
                  </button>
                </div>

                {/* Prompt Input */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: '0.775rem', padding: '6px 10px' }}
                    placeholder={t('cv_editor.refine_placeholder')}
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
