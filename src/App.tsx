import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { JobDetailView } from './components/JobDetailView';
import { BoardView } from './components/BoardView';
import { CalendarView } from './components/CalendarView';
import { JobDetailModal } from './components/JobDetailModal';
import { AddJobModal } from './components/AddJobModal';
import { SettingsModal } from './components/SettingsModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { CVEditorModal } from './components/CVEditorModal';

import { JobMetadata, ApplicationStatus, ExperienceLevel, AISettings, StatusHistoryEntry } from './types/job';
import { fileSystemService } from './services/storage/fileSystem';
import { aiService } from './services/ai/aiService';
import { profileService } from './services/storage/profileService';

export default function App() {
  const [jobs, setJobs] = useState<JobMetadata[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentDirName, setCurrentDirName] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);

  // View Mode: 'list' | 'board' | 'calendar'
  type ViewMode = 'list' | 'board' | 'calendar';
  const VIEW_ORDER: ViewMode[] = ['list', 'board', 'calendar'];
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const prevViewMode = useRef<ViewMode>('list');
  const [transitionClass, setTransitionClass] = useState('');

  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    const prevIdx = VIEW_ORDER.indexOf(prevViewMode.current);
    const nextIdx = VIEW_ORDER.indexOf(newMode);
    setTransitionClass(nextIdx > prevIdx ? 'view-enter-right' : 'view-enter-left');
    prevViewMode.current = newMode;
    setViewMode(newMode);
  }, []);

  // Filters
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [selectedExpFilter, setSelectedExpFilter] = useState<ExperienceLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCVEditorOpen, setIsCVEditorOpen] = useState(false);
  const [isFabHovered, setIsFabHovered] = useState(false);

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
          const rootMeta = await fileSystemService.loadRootMetadata(handle);
          aiService.setRootMeta(rootMeta.feedbackThresholdWeeks, rootMeta.cardLayoutConfig);
          profileService.setCachedProfile(rootMeta.profile);
          setAiSettings(aiService.getSettings());

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
      const rootMeta = await fileSystemService.loadRootMetadata(handle);
      aiService.setRootMeta(rootMeta.feedbackThresholdWeeks, rootMeta.cardLayoutConfig);
      profileService.setCachedProfile(rootMeta.profile);
      setAiSettings(aiService.getSettings());

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
      
      const rootMeta = await fileSystemService.loadRootMetadata(handle);
      aiService.setRootMeta(rootMeta.feedbackThresholdWeeks, rootMeta.cardLayoutConfig);
      profileService.setCachedProfile(rootMeta.profile);
      setAiSettings(aiService.getSettings());

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
    const previousJob = jobs.find((j) => j.id === updatedJob.id);
    let jobToSave = { ...updatedJob };

    if (previousJob && previousJob.status !== updatedJob.status) {
      const historyEntry: StatusHistoryEntry = {
        fromStatus: previousJob.status,
        toStatus: updatedJob.status,
        timestamp: new Date().toISOString(),
      };
      const existingHistory = previousJob.statusHistory || [];
      jobToSave.statusHistory = [...existingHistory, historyEntry];
    }

    setJobs((prev) => prev.map((j) => (j.id === jobToSave.id ? jobToSave : j)));
    await fileSystemService.saveJob(jobToSave);
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

  // Dynamic Browser Tab Title: Applyo: [Name des Jobs]
  useEffect(() => {
    if (selectedJob) {
      document.title = `Applyo: ${selectedJob.title}`;
    } else {
      document.title = 'Applyo';
    }
  }, [selectedJob]);

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
        onOpenCVEditor={() => setIsCVEditorOpen(true)}
        aiSettings={aiSettings}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Main Container – animated on view switch */}
      {viewMode === 'list' ? (
        <div key="list" className={`main-layout ${transitionClass}`}>
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
            feedbackThresholdWeeks={aiSettings.feedbackThresholdWeeks}
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
            onOpenCVEditor={() => setIsCVEditorOpen(true)}
            feedbackThresholdWeeks={aiSettings.feedbackThresholdWeeks}
            cardLayoutConfig={aiSettings.cardLayoutConfig}
          />
        </div>
      ) : viewMode === 'board' ? (
        <div key="board" className={transitionClass} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <BoardView
            jobs={jobs}
            selectedJobId={selectedJobId}
            onSelectJob={(j) => setSelectedJobId(j.id)}
            onUpdateJob={handleUpdateJob}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedExpFilter={selectedExpFilter}
            onSelectExpFilter={setSelectedExpFilter}
            currentDirName={currentDirName}
            needsPermission={needsPermission}
            onSelectDirectory={handleSelectDirectory}
            onGrantPermission={handleGrantPermission}
            onOpenDetailModal={(j) => {
              setSelectedJobId(j.id);
              setIsDetailModalOpen(true);
            }}
            feedbackThresholdWeeks={aiSettings.feedbackThresholdWeeks}
          />
        </div>
      ) : (
        <div key="calendar" className={transitionClass} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CalendarView
            jobs={jobs}
            currentDirName={currentDirName}
            needsPermission={needsPermission}
            onSelectDirectory={handleSelectDirectory}
            onGrantPermission={handleGrantPermission}
            onSelectJob={(j) => {
              setSelectedJobId(j.id);
              handleViewModeChange('list');
            }}
          />
        </div>
      )}

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

      <CVEditorModal
        isOpen={isCVEditorOpen}
        onClose={() => setIsCVEditorOpen(false)}
        jobs={jobs}
        selectedJob={selectedJob}
        onSelectJob={(j) => setSelectedJobId(j.id)}
      />

      <JobDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        job={selectedJob}
        currentDirName={currentDirName}
        needsPermission={needsPermission}
        onSelectDirectory={handleSelectDirectory}
        onGrantPermission={handleGrantPermission}
        onUpdateJob={handleUpdateJob}
        onDeleteJob={handleDeleteJob}
        onOpenAIAssistant={() => setIsAIDrawerOpen(true)}
        feedbackThresholdWeeks={aiSettings.feedbackThresholdWeeks}
        cardLayoutConfig={aiSettings.cardLayoutConfig}
      />

      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => {
          setIsAIDrawerOpen(false);
          setIsFabHovered(false);
        }}
        job={selectedJob}
      />

      {/* Floating AI Assistant Action Button (Versteckt wenn KI-Karrierelotse offen ist) */}
      {!isAIDrawerOpen && (
        <button
          onClick={() => {
            setIsFabHovered(false);
            setIsAIDrawerOpen(true);
          }}
          onMouseEnter={() => setIsFabHovered(true)}
          onMouseLeave={() => setIsFabHovered(false)}
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            height: '52px',
            minWidth: '52px',
            borderRadius: '26px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: isFabHovered ? '16px' : '15px',
            paddingRight: isFabHovered ? '16px' : '15px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            boxShadow: isFabHovered
              ? '0 10px 30px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)'
              : '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 15px rgba(99, 102, 241, 0.2)',
            cursor: 'pointer',
            opacity: isFabHovered ? 1 : 0.7,
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1050,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
          title={`KI-Karrierelotse öffnen (${aiSettings.activeProvider.toUpperCase()})`}
        >
          <Sparkles size={22} color="#a5b4fc" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              maxWidth: isFabHovered ? '110px' : '0px',
              opacity: isFabHovered ? 1 : 0,
              marginLeft: isFabHovered ? '8px' : '0px',
              overflow: 'hidden',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-block',
              verticalAlign: 'middle',
            }}
          >
            KI-Assistent
          </span>
        </button>
      )}
    </div>
  );
}
