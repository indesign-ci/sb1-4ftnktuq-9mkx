'use client';

import type { ConceptionRoom } from '@/types/conception';
import { ROOM_TYPE_LABELS } from '@/types/conception';

interface RoomVisualizerProps {
  rooms: ConceptionRoom[];
  projectId?: string;
  onAddRoom?: (room: Partial<ConceptionRoom>) => Promise<unknown>;
  onUpdateRoom?: (roomId: string, updates: Partial<ConceptionRoom>) => Promise<unknown>;
  onRemoveRoom?: (roomId: string) => Promise<void>;
  onUploadImage?: (file: File, folder?: string) => Promise<string>;
  className?: string;
}

export default function RoomVisualizer({
  rooms,
  projectId,
  onAddRoom,
  onUpdateRoom,
  onRemoveRoom,
  onUploadImage,
  className = '',
}: RoomVisualizerProps) {
  return (
    <section className={className}>
      <h2 className="mb-4 font-serif text-xl font-semibold text-gray-900">
        Espaces
      </h2>
      {rooms.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          Aucun espace pour l&apos;instant.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {room.concept_image_url || room.before_image_url ? (
                <img
                  src={room.concept_image_url ?? room.before_image_url ?? ''}
                  alt=""
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center bg-gray-100 text-gray-500">
                  Pas d&apos;image
                </div>
              )}
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#A68B55]">
                  {ROOM_TYPE_LABELS[room.room_type] ?? room.room_type}
                </p>
                <h3 className="font-serif font-semibold text-gray-900">
                  {room.name}
                </h3>
                {room.area_sqm != null && (
                  <p className="mt-1 text-sm text-gray-600">
                    {room.area_sqm} m²
                    {room.ceiling_height_m != null &&
                      ` · ${room.ceiling_height_m} m hauteur`}
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
