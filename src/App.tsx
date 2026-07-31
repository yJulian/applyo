import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { JobDetailView } from './components/JobDetailView';
import { AddJobModal } from './components/AddJobModal';
import { SettingsModal } from './components/SettingsModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';

import { JobMetadata, ApplicationStatus, ExperienceLevel, AISettings } from './types/job';
import { fileSystemService } from './services/storage/fileSystem';
import { aiService } from './services/ai/aiService';

const DEMO_JOBS: JobMetadata[] = [
  {
    id: 'demo-1',
    company: 'Applyo Tech GmbH',
    title: 'Senior Frontend Engineer (React/PWA)',
    url: 'https://linkedin.com/jobs/view/123456789',
    status: 'interested',
    experienceLevel: 'required',
    requiresWorkExperience: true,
    experienceDetails: 'Mindestens 4 Jahre praktische Berufserfahrung im Frontend gefordert',
    summary: 'Verantwortlich für die Entwicklung moderner PWA-Webanwendungen mit React, TypeScript und direkter Dateisystem-Anbindung.',
    tasks: [
      'Entwicklung hochperformanter UI-Komponenten mit React und TypeScript',
      'Integration von AI-Abstraktionsschichten (OpenAI, Gemini, Claude)',
      'Optimierung von Offline-PWA Features und Web Access APIs',
    ],
    requirements: [
      'Mindestens 4 Jahre Berufserfahrung im Frontend-Bereich',
      'Sehr gute Kenntnisse in React, TypeScript und CSS Architecture',
      'Erfahrung mit PWA Service Workern und modernen Browser APIs',
    ],
    benefits: ['100% Remote Option', '500€ Weiterbildungsbudget p.a.', 'Modernes Equipment (MacBook Pro)'],
    salary: '75.000 € - 90.000 €',
    location: 'Berlin / Remote',
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    notes: 'Gespräch für nächste Woche Donnerstag geplant.',
    relativePath: 'Applyo Tech GmbH/Senior Frontend Engineer (React/PWA)',
  },
  {
    id: 'demo-2',
    company: 'CloudVentures',
    title: 'Junior AI Software Developer',
    url: 'https://linkedin.com/jobs/view/987654321',
    status: 'applied',
    experienceLevel: 'junior',
    requiresWorkExperience: false,
    experienceDetails: 'Direkter Einstieg als Junior / Berufseinsteiger ohne Vorerfahrung möglich',
    summary: 'Einstiegsposition für engagierte Entwickler zur Erstellung innovativer KI-Modulsysteme und Cloud-Backends.',
    tasks: [
      'Implementierung von REST/GraphQL Endpunkten für LLM Orchestrierung',
      'Unterstützung bei der Datenextraktion und Prompt-Engineering',
    ],
    requirements: [
      'Abgeschlossenes Studium der Informatik oder vergleichbare Ausbildung',
      'Erste Erfahrungen mit Python, TypeScript oder Node.js',
      'Begeisterung für Generative AI und LLM-Integration',
    ],
    benefits: ['Flexibles Gleitzeitmodell', 'Team-Events & Hackathons'],
    salary: '50.000 € - 58.000 €',
    location: 'München / Hybrid',
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    notes: 'Bewerbung am 28.07. verschickt.',
    relativePath: 'CloudVentures/Junior AI Software Developer',
  },
];

export function App() {
  const [jobs, setJobs] = useState<JobMetadata[]>(DEMO_JOBS);
  const [selectedJobId, setSelectedJobId] = useState<string | null>('demo-1');
  const [currentDirName, setCurrentDirName] = useState<string | null>(null);

  // Filters
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [selectedExpFilter, setSelectedExpFilter] = useState<ExperienceLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  const [aiSettings, setAiSettings] = useState<AISettings>(aiService.getSettings());

  // Load directory & scan jobs on mount
  useEffect(() => {
    async function loadDirectory() {
      const handle = await fileSystemService.getStoredRootHandle();
      if (handle) {
        setCurrentDirName(handle.name);
        const scannedJobs = await fileSystemService.scanDirectory(handle);
        if (scannedJobs.length > 0) {
          setJobs(scannedJobs);
          setSelectedJobId(scannedJobs[0].id);
        }
      }
    }
    loadDirectory();
  }, []);

  const handleSelectDirectory = async () => {
    const handle = await fileSystemService.selectRootDirectory();
    if (handle) {
      setCurrentDirName(handle.name);
      const scannedJobs = await fileSystemService.scanDirectory(handle);
      if (scannedJobs.length > 0) {
        setJobs(scannedJobs);
        setSelectedJobId(scannedJobs[0].id);
      } else {
        // If empty directory, reset jobs
        setJobs([]);
        setSelectedJobId(null);
      }
    }
  };

  const handleJobAdded = async (newJob: JobMetadata) => {
    await fileSystemService.saveJob(newJob);
    const handle = await fileSystemService.getStoredRootHandle();
    if (handle) {
      setCurrentDirName(handle.name);
      const scannedJobs = await fileSystemService.scanDirectory(handle);
      if (scannedJobs.length > 0) {
        setJobs(scannedJobs);
        setSelectedJobId(newJob.id);
        return;
      }
    }
    setJobs((prev) => [newJob, ...prev]);
    setSelectedJobId(newJob.id);
  };

  const handleUpdateJob = async (updatedJob: JobMetadata) => {
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    await fileSystemService.saveJob(updatedJob);
  };

  const handleDeleteJob = async (jobToDelete: JobMetadata) => {
    if (confirm(`Möchtest du die Bewerbung "${jobToDelete.title}" bei "${jobToDelete.company}" wirklich löschen?`)) {
      await fileSystemService.deleteJob(jobToDelete);
      const filtered = jobs.filter((j) => j.id !== jobToDelete.id);
      setJobs(filtered);
      setSelectedJobId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  return (
    <div className="app-container">
      {/* Header */}
      <Navbar
        currentDirName={currentDirName}
        onSelectDirectory={handleSelectDirectory}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        aiSettings={aiSettings}
      />

      {/* Main Grid Layout */}
      <div className="main-layout">
        <Sidebar
          jobs={jobs}
          selectedJobId={selectedJobId}
          onSelectJob={(j) => setSelectedJobId(j.id)}
          selectedStatusFilter={selectedStatusFilter}
          onSelectStatusFilter={setSelectedStatusFilter}
          selectedExpFilter={selectedExpFilter}
          onSelectExpFilter={setSelectedExpFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <JobDetailView
          job={selectedJob}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
          onOpenAIAssistant={() => setIsAIDrawerOpen(true)}
        />
      </div>

      {/* Modals & Drawers */}
      <AddJobModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onJobAdded={handleJobAdded}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsSaved={setAiSettings}
      />

      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        job={selectedJob}
      />
    </div>
  );
}

export default App;
