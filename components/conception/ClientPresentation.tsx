'use client';

import type {
  ConceptionProject,
  ConceptionRoom,
  ConceptionMoodboard,
  ConceptionMaterial,
  ConceptionFurniture,
  ConceptionPhase,
  BudgetSummary,
} from '@/types/conception';

interface ClientPresentationProps {
  project: ConceptionProject | null;
  rooms?: ConceptionRoom[];
  moodboards?: ConceptionMoodboard[];
  materials?: ConceptionMaterial[];
  furniture?: ConceptionFurniture[];
  phases?: ConceptionPhase[];
  budget?: BudgetSummary | null;
  onStartPresentation?: () => void;
  onClose?: () => void;
  isFullscreen?: boolean;
  className?: string;
}

export default function ClientPresentation({
  project,
  rooms = [],
  moodboards = [],
  materials = [],
  furniture = [],
  phases = [],
  budget,
  onStartPresentation,
  onClose,
  isFullscreen = false,
  className = '',
}: ClientPresentationProps) {
  if (!project) return null;

  const content = (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-6 h-0.5 w-14 bg-[#C4A265]" />
      <h2 className="font-serif text-3xl font-bold text-gray-900">
        {project.project_name}
      </h2>
      <p className="mt-2 text-gray-600">
        Présentation client · {project.client_name}
      </p>
      <p className="mt-4 text-xs uppercase tracking-widest text-[#A68B55]">
        Mode présentation
      </p>
      {onStartPresentation && !isFullscreen && (
        <button
          type="button"
          onClick={onStartPresentation}
          className="mt-6 rounded-lg bg-[#C4A265] px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          ▶ Lancer la présentation
        </button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Fermer
        </button>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div
        className={className}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: '#f9fafb',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        {content}
      </div>
    );
  }

  return <section className={className}>{content}</section>;
}
