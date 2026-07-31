import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ExternalLink,
  CheckCircle2,
  ListTodo,
  FileText,
  Sparkles,
  Trash2,
  Save,
  MapPin,
  CircleDollarSign,
  Briefcase,
  FolderOpen,
  Upload,
  FileCode,
  File,
  Eye,
  Folder,
  Plus
} from 'lucide-react';
import { JobMetadata, JobFile, ApplicationStatus, STATUS_LABELS, EXPERIENCE_LABELS } from '../types/job';
import { fileSystemService } from '../services/storage/fileSystem';

interface JobDetailViewProps {
  job: JobMetadata | null;
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
  onUpdateJob: (updated: JobMetadata) => void;
  onDeleteJob: (job: JobMetadata) => void;
  onOpenAIAssistant: () => void;
}

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  currentDirName,
  needsPermission,
  onSelectDirectory,
  onGrantPermission,
  onUpdateJob,
  onDeleteJob,
  onOpenAIAssistant,
}) => {
  if (!job) {
    if (needsPermission && currentDirName) {
      return (
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
          <div className="glass-panel" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', textAlign: 'center', maxWidth: '460px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            <Folder size={56} color="#f59e0b" style={{ opacity: 0.8, marginBottom: '20px' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', color: '#f59e0b' }}>Zugriff auf Ordner freigeben</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Der Browser benötigt nach dem Neuladen der Seite deine einmalige Bestätigung per Klick, um auf den Ordner <strong>"{currentDirName}"</strong> auf deiner Festplatte zuzugreifen.
            </p>
            <button
              onClick={onGrantPermission}
              className="btn"
              style={{
                width: '100%',
                gap: '10px',
                padding: '12px',
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Folder size={18} />
              <span>Zugriff auf '{currentDirName}' freigeben</span>
            </button>
          </div>
        </main>
      );
    }

    if (!currentDirName) {
      return (
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
          <div className="glass-panel" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', textAlign: 'center', maxWidth: '460px' }}>
            <Folder size={56} color="var(--accent-primary)" style={{ opacity: 0.6, marginBottom: '20px' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>Bitte zuerst einen Ordner auswählen</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Wähle bitte deinen Arbeitsordner auf der Festplatte aus, um Bewerbungen zu laden oder neue Stellen-Ordner anzulegen.
            </p>
            <button onClick={onSelectDirectory} className="btn btn-primary" style={{ width: '100%', gap: '10px', padding: '12px', fontSize: '0.95rem' }}>
              <Folder size={18} />
              <span>Lokalen Arbeitsordner wählen</span>
            </button>
          </div>
        </main>
      );
    }

    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
        <div className="glass-panel" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', textAlign: 'center', maxWidth: '420px' }}>
          <Briefcase size={54} color="var(--accent-primary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Keine Bewerbung ausgewählt</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Klicke in der linken Liste auf eine Stelle oder erstelle oben rechts mit "+ Stelle hinzufügen" eine neue Bewerbung.
          </p>
        </div>
      </main>
    );
  }

  const [notes, setNotes] = useState(job.notes || '');
  const [isSavedNotes, setIsSavedNotes] = useState(false);
  const [files, setFiles] = useState<JobFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadJobFiles = async () => {
    setIsLoadingFiles(true);
    const loadedFiles = await fileSystemService.listJobFiles(job);
    // Filter out metadata.json so only real user documents are displayed
    setFiles(loadedFiles.filter((f) => f.name.toLowerCase() !== 'metadata.json'));
    setIsLoadingFiles(false);
  };

  useEffect(() => {
    setNotes(job.notes || '');
    setIsSavedNotes(false);
    loadJobFiles();
  }, [job.id]);

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    onUpdateJob({
      ...job,
      status: newStatus,
      updatedDate: new Date().toISOString(),
    });
  };

  const handleSaveNotes = () => {
    onUpdateJob({
      ...job,
      notes,
      updatedDate: new Date().toISOString(),
    });
    setIsSavedNotes(true);
    setTimeout(() => setIsSavedNotes(false), 2000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      await fileSystemService.addJobFile(job, file);
    }

    loadJobFiles();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      await fileSystemService.addJobFile(job, file);
    }
    loadJobFiles();
  };

  const handleOpenFile = async (fileName: string) => {
    const url = await fileSystemService.getJobFileUrl(job, fileName);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Datei konnte nicht geöffnet werden.');
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (confirm(`Datei "${fileName}" aus dem Ordner löschen?`)) {
      await fileSystemService.deleteJobFile(job, fileName);
      loadJobFiles();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText size={18} color="#f87171" />;
    if (ext === 'docx' || ext === 'doc') return <FileText size={18} color="#60a5fa" />;
    if (ext === 'json') return <FileCode size={18} color="#fbbf24" />;
    return <File size={18} color="var(--text-muted)" />;
  };

  const statusMeta = STATUS_LABELS[job.status] || STATUS_LABELS.interested;
  const expMeta = EXPERIENCE_LABELS[job.experienceLevel] || EXPERIENCE_LABELS.none;

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Card */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.95rem' }}>
                  <Building2 size={18} />
                  {job.company}
                </span>
                {job.relativePath && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '8px' }}>
                    📁 {job.relativePath}
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: '1.8rem', lineHeight: 1.2, marginBottom: '14px' }}>{job.title}</h1>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                {/* Status Selector */}
                <select
                  value={job.status}
                  onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: statusMeta.bg,
                    color: statusMeta.color,
                    border: `1px solid ${statusMeta.color}`,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {Object.entries(STATUS_LABELS).map(([key, meta]) => (
                    <option key={key} value={key} style={{ background: 'var(--bg-card-solid)', color: meta.color }}>
                      Status: {meta.label}
                    </option>
                  ))}
                </select>

                {/* Experience Tag */}
                <span className={`badge ${expMeta.tagClass}`} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                  {expMeta.label}
                </span>

                {job.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <MapPin size={14} /> {job.location}
                  </span>
                )}

                {job.salary && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                    <CircleDollarSign size={14} /> {job.salary}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ gap: '6px', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={15} />
                  <span>LinkedIn / Link</span>
                </a>
              )}

              <button onClick={onOpenAIAssistant} className="btn btn-primary" style={{ gap: '6px', fontSize: '0.85rem' }}>
                <Sparkles size={16} />
                <span>KI Assistent</span>
              </button>

              <button
                onClick={() => onDeleteJob(job)}
                className="btn-icon"
                style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                title="Bewerbung löschen"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Folder Documents & Files Drag & Drop Card */}
        <div
          className="glass-panel"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: isDraggingOver ? '2px dashed var(--accent-cyan)' : '1px solid var(--border-color)',
            background: isDraggingOver ? 'rgba(6, 182, 212, 0.12)' : undefined,
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={18} color="var(--accent-cyan)" />
                Dokumente & Ordner-Dateien ({job.company}/{job.title})
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Dateien (z.B. Lebenslauf, Anschreiben) einfach hierher hineinziehen (Drag & Drop)
              </span>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Plus size={15} color="var(--accent-cyan)" />
                <span>Dokument hinzufügen</span>
              </button>
            </div>
          </div>

          {isLoadingFiles ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lade Ordnerdateien...</p>
          ) : files.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                background: isDraggingOver ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255,255,255,0.01)',
              }}
            >
              <Upload size={28} style={{ marginBottom: '8px', opacity: 0.6, color: 'var(--accent-cyan)' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {isDraggingOver ? 'Datei jetzt loslassen zum Speichern!' : 'Dateien per Drag & Drop hierher ziehen'}
              </p>
              <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                Oder klicke oben auf "+ Dokument hinzufügen" (z.B. <strong>Lebenslauf.pdf</strong>, <strong>Anschreiben.docx</strong>).
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {files.map((file) => (
                <div
                  key={file.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getFileIcon(file.name)}
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                        {file.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {formatFileSize(file.size)} • Geändert: {new Date(file.lastModified).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenFile(file.name)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                      title="Auf Windows / Browser öffnen"
                    >
                      <Eye size={13} />
                      <span>Öffnen</span>
                    </button>

                    <button
                      onClick={() => handleDeleteFile(file.name)}
                      className="btn-icon"
                      style={{ width: '28px', height: '28px', color: '#f87171' }}
                      title="Löschen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Card */}
        {job.summary && (
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', color: '#a5b4fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-primary)" />
              Zusammenfassung
            </h3>
            <p style={{ color: 'var(--text-main)', lineHeight: 1.6, fontSize: '0.925rem' }}>{job.summary}</p>
          </div>
        )}

        {/* Primary Berufserfahrung & Einstieg Check Card */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            background: job.requiresWorkExperience
              ? 'rgba(244, 63, 94, 0.08)'
              : 'rgba(52, 211, 153, 0.08)',
            border: job.requiresWorkExperience
              ? '1px solid rgba(244, 63, 94, 0.3)'
              : '1px solid rgba(52, 211, 153, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: job.requiresWorkExperience ? 'rgba(244, 63, 94, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                {job.requiresWorkExperience ? '🔴' : '🟢'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: job.requiresWorkExperience ? '#fb7185' : '#34d399' }}>
                  {job.requiresWorkExperience
                    ? 'Vorherige Anstellung in einer Firma zwingend erforderlich'
                    : 'Direkter Einstieg als Junior / Absolvent ohne bisherige Firmen-Anstellung möglich'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {job.experienceDetails || expMeta.label}
                </p>
              </div>
            </div>

            <span
              className={`badge ${expMeta.tagClass}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              {expMeta.entryBadge}
            </span>
          </div>
        </div>

        {/* Two-Column Details: Tasks & Requirements */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Tasks Card */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', color: '#818cf8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListTodo size={18} color="#818cf8" />
              Aufgaben & Verantwortung
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {job.tasks && job.tasks.length > 0 ? (
                job.tasks.map((task, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    <span style={{ color: '#818cf8', marginTop: '2px' }}>•</span>
                    <span>{task}</span>
                  </li>
                ))
              ) : (
                <li style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Keine Aufgaben aufgeführt.</li>
              )}
            </ul>
          </div>

          {/* Requirements Card */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', color: '#34d399', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#34d399" />
              Was du mitbringen musst
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {job.requirements && job.requirements.length > 0 ? (
                job.requirements.map((req, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    <span style={{ color: '#34d399', marginTop: '2px' }}>✓</span>
                    <span>{req}</span>
                  </li>
                ))
              ) : (
                <li style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Keine Anforderungen aufgeführt.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Benefits Card */}
        {job.benefits && job.benefits.length > 0 && (
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '10px' }}>Benefits & Vorteile</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {job.benefits.map((b, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    color: '#fbbf24',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                  }}
                >
                  ✨ {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Editable Notes Section */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Notizen & Notizen zum Gespräch</h3>
            <button onClick={handleSaveNotes} className="btn btn-secondary" style={{ gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}>
              <Save size={14} color={isSavedNotes ? '#34d399' : undefined} />
              <span>{isSavedNotes ? 'Gespeichert!' : 'Notizen speichern'}</span>
            </button>
          </div>
          <textarea
            className="input-field"
            rows={5}
            placeholder="Ergänze hier persönliche Notizen, Kontakte, Interviewfragen oder Erinnerungen..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>
      </div>
    </main>
  );
};
