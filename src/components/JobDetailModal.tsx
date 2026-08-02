import React from 'react';
import { X } from 'lucide-react';
import { JobDetailView } from './JobDetailView';
import { JobMetadata, CardSectionConfig } from '../types/job';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobMetadata | null;
  currentDirName: string | null;
  needsPermission: boolean;
  onSelectDirectory: () => void;
  onGrantPermission: () => void;
  onUpdateJob: (updated: JobMetadata) => void;
  onDeleteJob: (job: JobMetadata) => void;
  onOpenAIAssistant: () => void;
  feedbackThresholdWeeks?: number;
  cardLayoutConfig?: CardSectionConfig[];
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  isOpen,
  onClose,
  job,
  currentDirName,
  needsPermission,
  onSelectDirectory,
  onGrantPermission,
  onUpdateJob,
  onDeleteJob,
  onOpenAIAssistant,
  feedbackThresholdWeeks = 6,
  cardLayoutConfig,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '1100px',
          height: '90vh',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          position: 'relative',
          animation: 'scaleUp 0.2s ease-out',
        }}
      >
        {/* Top Header Bar with Close Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Stelle-Details
          </span>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        {/* Modal Body: JobDetailView */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <JobDetailView
            job={job}
            currentDirName={currentDirName}
            needsPermission={needsPermission}
            onSelectDirectory={onSelectDirectory}
            onGrantPermission={onGrantPermission}
            onUpdateJob={onUpdateJob}
            onDeleteJob={(deletedJob) => {
              onDeleteJob(deletedJob);
              onClose();
            }}
            onOpenAIAssistant={onOpenAIAssistant}
            feedbackThresholdWeeks={feedbackThresholdWeeks}
            cardLayoutConfig={cardLayoutConfig}
          />
        </div>
      </div>
    </div>
  );
};
