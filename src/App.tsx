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

export default function App() {
  const [jobs, setJobs] = useState<JobMetadata[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentDirName, setCurrentDirName] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);

  // Filters
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [selectedExpFilter, setSelectedExpFilter] = useState<ExperienceLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  const [aiSettings, setAiSettings] = useState<AISettings>(aiService.getSettings());

  // Load directory & check permission status on mount
  useEffect(() => {
    async function loadDirectory() {
      const handle = await fileSystemService.getStoredRootHandle();
      if (handle) {
        setCurrentDirName(handle.name);
        const permState = await fileSystemService.checkPermissionState(handle);
        if (permState === 'granted') {
          setNeedsPermission(false);
          const scannedJobs = await fileSystemService.scanDirectory(handle);
          setJobs(scannedJobs);
          if (scannedJobs.length > 0) {
            setSelectedJobId(scannedJobs[0].id);
          }
        } else {
          // Permission is 'prompt' (requires user gesture click after reload)
          setNeedsPermission(true);
        }
      }
    }
    loadDirectory();
  }, []);

  const handleGrantPermission = async () => {
    const handle = await fileSystemService.getStoredRootHandle();
    if (!handle) {
      await handleSelectDirectory();
      return;
    }

    const granted = await fileSystemService.requestRootPermission(handle);
    if (granted) {
      setNeedsPermission(false);
      const scannedJobs = await fileSystemService.scanDirectory(handle);
      setJobs(scannedJobs);
      if (scannedJobs.length > 0) {
        setSelectedJobId(scannedJobs[0].id);
      }
    } else {
      // If user cancelled or denied, open directory picker directly
      await handleSelectDirectory();
    }
  };

  const handleSelectDirectory = async () => {
    const handle = await fileSystemService.selectRootDirectory();
    if (handle) {
      setCurrentDirName(handle.name);
      setNeedsPermission(false);
      const scannedJobs = await fileSystemService.scanDirectory(handle);
      if (scannedJobs.length > 0) {
        setJobs(scannedJobs);
        setSelectedJobId(scannedJobs[0].id);
      } else {
        setJobs([]);
        setSelectedJobId(null);
      }
    }
  };

  const handleJobAdded = async (newJob: JobMetadata) => {
    const handle = await fileSystemService.getStoredRootHandle();
    if (handle) {
      setCurrentDirName(handle.name);
      setNeedsPermission(false);
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
      const handle = await fileSystemService.getStoredRootHandle();
      if (handle) {
        const scannedJobs = await fileSystemService.scanDirectory(handle);
        setJobs(scannedJobs);
        setSelectedJobId(scannedJobs.length > 0 ? scannedJobs[0].id : null);
      } else {
        const filtered = jobs.filter((j) => j.id !== jobToDelete.id);
        setJobs(filtered);
        setSelectedJobId(filtered.length > 0 ? filtered[0].id : null);
      }
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  return (
    <div className="app-container">
      {/* Header */}
      <Navbar
        currentDirName={currentDirName}
        needsPermission={needsPermission}
        onSelectDirectory={handleSelectDirectory}
        onGrantPermission={handleGrantPermission}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        aiSettings={aiSettings}
      />

      {/* Main Grid: Sidebar + Detail View */}
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
          currentDirName={currentDirName}
          needsPermission={needsPermission}
          onSelectDirectory={handleSelectDirectory}
          onGrantPermission={handleGrantPermission}
        />

        <JobDetailView
          job={selectedJob}
          currentDirName={currentDirName}
          needsPermission={needsPermission}
          onSelectDirectory={handleSelectDirectory}
          onGrantPermission={handleGrantPermission}
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
        onSettingsSaved={(newSettings: AISettings) => {
          setAiSettings(newSettings);
        }}
      />

      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        job={selectedJob}
      />
    </div>
  );
}
