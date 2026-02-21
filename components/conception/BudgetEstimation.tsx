'use client';

import type {
  BudgetSummary,
  ConceptionProject,
  ConceptionMaterial,
  ConceptionFurniture,
  ConceptionRoom,
} from '@/types/conception';

interface BudgetEstimationProps {
  budget: BudgetSummary | null;
  project?: ConceptionProject | null;
  materials?: ConceptionMaterial[];
  furniture?: ConceptionFurniture[];
  rooms?: ConceptionRoom[];
  className?: string;
}

export default function BudgetEstimation({
  budget,
  project,
  materials = [],
  furniture = [],
  rooms = [],
  className = '',
}: BudgetEstimationProps) {
  return (
    <section className={className}>
      <h2 className="mb-4 font-serif text-xl font-semibold text-gray-900">
        Budget
      </h2>
      {!budget ? (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          Résumé budgétaire non disponible.
        </p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A68B55]">
            Total estimé
          </p>
          <p className="mt-2 font-serif text-3xl font-bold text-[#A68B55]">
            {budget.total_estimated_cost.toLocaleString('fr-FR')} €
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Matériaux</p>
              <p className="font-semibold text-gray-900">
                {budget.total_materials_cost.toLocaleString('fr-FR')} €
              </p>
            </div>
            <div>
              <p className="text-gray-500">Mobilier</p>
              <p className="font-semibold text-gray-900">
                {budget.total_furniture_cost.toLocaleString('fr-FR')} €
              </p>
            </div>
          </div>
          {budget.budget_max != null && budget.budget_max > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              Utilisation budget : {budget.budget_usage_percent.toFixed(0)}%
            </p>
          )}
        </div>
      )}
    </section>
  );
}
