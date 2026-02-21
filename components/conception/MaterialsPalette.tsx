'use client';

import type {
  ConceptionMaterial,
  ConceptionFurniture,
  ConceptionRoom,
} from '@/types/conception';
import { MATERIAL_CATEGORY_LABELS, FURNITURE_CATEGORY_LABELS } from '@/types/conception';

interface MaterialsPaletteProps {
  materials: ConceptionMaterial[];
  rooms?: ConceptionRoom[];
  furniture?: ConceptionFurniture[];
  projectId?: string;
  onAddMaterial?: (material: Partial<ConceptionMaterial>) => Promise<unknown>;
  onUpdateMaterial?: (
    materialId: string,
    updates: Partial<ConceptionMaterial>
  ) => Promise<unknown>;
  onAddFurniture?: (item: Partial<ConceptionFurniture>) => Promise<unknown>;
  onUploadImage?: (file: File, folder?: string) => Promise<string>;
  onRefetch?: () => void;
  isFurnitureMode?: boolean;
  className?: string;
}

export default function MaterialsPalette({
  materials,
  rooms = [],
  furniture = [],
  projectId,
  onAddMaterial,
  onUpdateMaterial,
  onAddFurniture,
  onUploadImage,
  onRefetch,
  isFurnitureMode = false,
  className = '',
}: MaterialsPaletteProps) {
  const title = isFurnitureMode ? 'Mobilier' : 'Matériaux';
  const items = isFurnitureMode ? furniture : materials;

  if (isFurnitureMode) {
    return (
      <section className={className}>
        <h2 className="mb-4 font-serif text-xl font-semibold text-gray-900">
          {title}
        </h2>
        {furniture.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            Aucun mobilier pour l&apos;instant.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {furniture.map((f) => (
              <div
                key={f.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                {f.image_url ? (
                  <img
                    src={f.image_url}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-gray-100 text-gray-500">
                    —
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#A68B55]">
                    {FURNITURE_CATEGORY_LABELS[f.category] ?? f.category}
                  </p>
                  <p className="font-medium text-gray-900">{f.name}</p>
                  {f.unit_price != null && (
                    <p className="mt-1 text-sm text-gray-600">
                      {f.unit_price} € × {f.quantity}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={className}>
      <h2 className="mb-4 font-serif text-xl font-semibold text-gray-900">
        {title}
      </h2>
      {materials.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          Aucun matériau pour l&apos;instant.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <div
              key={m.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {m.image_url ? (
                <img
                  src={m.image_url}
                  alt=""
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gray-100 text-gray-500">
                  —
                </div>
              )}
              <div className="p-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#A68B55]">
                  {MATERIAL_CATEGORY_LABELS[m.category] ?? m.category}
                </p>
                <p className="font-medium text-gray-900">{m.name}</p>
                {m.unit_price != null && (
                  <p className="mt-1 text-sm text-gray-600">
                    {m.unit_price} € / {m.unit}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
