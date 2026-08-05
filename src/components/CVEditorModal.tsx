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
  Upload,
  Eye,
  EyeOff,
  GripVertical,
  ArrowUp,
  ArrowDown,
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
  getEduDegree, getEduDesc,
  getSkillCat, getSkillList,
  getProjTitle, getProjDesc, getProjTech,
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
        await syncToGlobalProfile(loadedCV);
      }

      setCvData(loadedCV);
      setIsGenerating(false);
    }

    initCV();
    // Reload only on a real job switch (by id), not on incidental re-renders
    // where `selectedJob` is a new object reference for the same job — that
    // used to reload Lebenslauf.json from disk and discard unsaved edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('cv_editor.title')}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('cv_editor.subtitle')}</p>
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
                <option value="modern_glass">Modern Glass</option>
                <option value="minimal_clean">Minimal Clean</option>
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
              <span>{t('cv_editor.ai_regenerate')}</span>
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

                    {/* Links & Zusätzliche Kopfdaten-Toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        Kopfdaten & Online-Profile im Lebenslauf
                      </span>

                      {/* Staatsbürgerschaft */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>Staatsbürgerschaft</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showCitizenship: !(cvData.header.showCitizenship ?? Boolean(cvData.header.citizenship)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showCitizenship ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showCitizenship ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showCitizenship ? 'Sichtbar' : 'Ausgeblendet'}
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
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>LinkedIn</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showLinkedin: !(cvData.header.showLinkedin ?? Boolean(cvData.header.linkedin)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showLinkedin ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showLinkedin ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showLinkedin ? 'Sichtbar' : 'Ausgeblendet'}
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
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>GitHub</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showGithub: !(cvData.header.showGithub ?? Boolean(cvData.header.github)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showGithub ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showGithub ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showGithub ? 'Sichtbar' : 'Ausgeblendet'}
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
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>XING</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showXing: !(cvData.header.showXing ?? Boolean(cvData.header.xing)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showXing ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showXing ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showXing ? 'Sichtbar' : 'Ausgeblendet'}
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
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>Website / Portfolio</label>
                          <button
                            type="button"
                            onClick={() => setCvData({ ...cvData, header: { ...cvData.header, showWebsite: !(cvData.header.showWebsite ?? Boolean(cvData.header.website)) } })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: cvData.header.showWebsite ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                          >
                            {cvData.header.showWebsite ? <Eye size={13} /> : <EyeOff size={13} />}
                            {cvData.header.showWebsite ? 'Sichtbar' : 'Ausgeblendet'}
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
                      const isGlobalMode = exp.activeVersion === 'global';
                      const currentPosition = getExpPosition(exp);
                      const currentHighlights = getExpHighlights(exp) || [];
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
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: exp.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>Station #{idx + 1}</span>
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
                                  ✨ KI
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
                            <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder="Von (z.B. 2021)" value={exp.startDate || ''} onChange={(e) => {
                              const updated = [...cvData.experiences];
                              updated[idx].startDate = e.target.value;
                              setCvData({ ...cvData, experiences: updated });
                            }} />
                            <input type="text" className="input-field" style={{ fontSize: '0.75rem' }} placeholder="Bis (z.B. Heute)" value={exp.endDate || ''} onChange={(e) => {
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
                      const currentDegree = getEduDegree(edu);
                      const currentDescription = getEduDesc(edu) || '';
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
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: edu.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>Abschluss #{idx + 1}</span>
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
                                  ✨ KI
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
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '4px' }}>
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
                          <textarea
                            rows={2}
                            className="input-field"
                            style={{ fontSize: '0.75rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? 'Beschreibung / Fokus / Thesis (Global)...' : 'Beschreibung / Fokus / Thesis (KI-angepasst)...'}
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
                    {cvData.skillCategories.map((cat, idx) => {
                      const isGlobalMode = cat.activeVersion === 'global';
                      const currentCategory = getSkillCat(cat);
                      const currentSkills = getSkillList(cat) || [];
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
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: cat.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>Kategorie #{idx + 1}</span>
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
                                  title="Globale Vorlage bearbeiten"
                                >
                                  🌐 Global
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = [...cvData.skillCategories];
                                    updated[idx].activeVersion = 'tailored';
                                    setCvData({ ...cvData, skillCategories: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: !isGlobalMode ? 'var(--accent-primary)' : 'transparent', color: !isGlobalMode ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title="KI-angepassten Text für diese Stelle bearbeiten"
                                >
                                  ✨ KI
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
                            style={{ marginBottom: '6px', fontWeight: 700, fontSize: '0.8rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? 'Kategorie (Global)' : 'Kategorie (KI-angepasst für Stelle)'}
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
                            placeholder={isGlobalMode ? 'Kommagetrennte Skills (Global)...' : 'Kommagetrennte Skills (KI-angepasst)...'}
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
                    {(cvData.projects || []).map((proj, idx) => {
                      const isGlobalMode = proj.activeVersion === 'global';
                      const currentTitle = getProjTitle(proj);
                      const currentDescription = getProjDesc(proj) || '';
                      const currentTechStack = getProjTech(proj) || [];
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
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: proj.hidden ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>Projekt #{idx + 1}</span>
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
                                  title="Globale Vorlage bearbeiten"
                                >
                                  🌐 Global
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = [...(cvData.projects || [])];
                                    updated[idx].activeVersion = 'tailored';
                                    setCvData({ ...cvData, projects: updated });
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: 'none', background: !isGlobalMode ? 'var(--accent-primary)' : 'transparent', color: !isGlobalMode ? '#fff' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                                  title="KI-angepassten Text für diese Stelle bearbeiten"
                                >
                                  ✨ KI
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
                          <input
                            type="text"
                            className="input-field"
                            style={{ marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700, border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? 'Projektname (Global)' : 'Projektname (KI-angepasst für Stelle)'}
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
                          <textarea
                            rows={2}
                            className="input-field"
                            style={{ marginBottom: '4px', fontSize: '0.775rem', border: isGlobalMode ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)' }}
                            placeholder={isGlobalMode ? 'Kurze Beschreibung (Global)' : 'Kurze Beschreibung (KI-angepasst)'}
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
                            placeholder={isGlobalMode ? 'Tech-Stack (Global, z.B. React, TypeScript)' : 'Tech-Stack (KI-angepasst)'}
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
