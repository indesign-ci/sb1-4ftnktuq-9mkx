'use client';

import type { ConceptionPhase, ConceptionProject } from '@/types/conception';

interface ProjectTimelineProps {
  phases: ConceptionPhase[];
  project?: ConceptionProject | null;
  currentPhase?: number;
  onUpdatePhase?: (
    phaseId: string,
    updates: Partial<ConceptionPhase>
  ) => Promise<unknown>;
  className?: string;
}

export default function ProjectTimeline({
  phases,
  project,
  currentPhase = 1,
  onUpdatePhase,
  className = '',
}: ProjectTimelineProps) {
  const effectivePhase = project?.current_phase ?? currentPhase;
  return (
    <section className={className}>
      <h2 className="mb-4 font-serif text-xl font-semibold text-gray-900">
        Planning
      </h2>
      {phases.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          Aucune phase.
        </p>
      ) : (
        <div className="relative space-y-6 pl-10 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
          {phases.map((phase) => (
            <div key={phase.id} className="relative">
              <div
                className={`absolute left-0 top-1 flex h-10 w-10 -translate-x-[42px] items-center justify-center rounded-full border-2 text-sm font-bold ${
                  phase.phase_number === effectivePhase
                    ? 'border-[#C4A265] text-[#A68B55] bg-amber-50'
                    : phase.status === 'completed'
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                {phase.phase_number}
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="font-semibold text-gray-900">{phase.name}</p>
                {phase.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {phase.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  {phase.completion_percentage}% · {phase.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
