'use client';

import type { ConceptionPhase } from '@/types/conception';

interface DesignPhasesProps {
  phases: ConceptionPhase[];
  className?: string;
}

export default function DesignPhases({ phases, className = '' }: DesignPhasesProps) {
  return (
    <section className={className}>
      <h2 className="mb-4 font-serif text-xl font-semibold text-[#F5F0EB]">
        Phases du projet
      </h2>
      {phases.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-[#111118] p-8 text-center text-[#6B6B80]">
          Aucune phase configurée.
        </p>
      ) : (
        <ul className="space-y-4">
          {phases.map((phase) => (
            <li
              key={phase.id}
              className="rounded-xl border border-white/10 bg-[#111118] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#F5F0EB]">{phase.name}</span>
                <span className="text-sm text-[#6B6B80]">
                  {phase.completion_percentage}%
                </span>
              </div>
              {phase.description && (
                <p className="mt-1 text-sm text-[#9B9BAE]">{phase.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
