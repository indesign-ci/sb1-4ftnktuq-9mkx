'use client';

import type { ConceptionRoom } from '@/types/conception';

interface BeforeAfterProps {
  rooms: ConceptionRoom[];
  className?: string;
}

export default function BeforeAfter({ rooms, className = '' }: BeforeAfterProps) {
  const withBeforeAfter = rooms.filter(
    (r) => r.before_image_url && r.concept_image_url
  );
  return (
    <section className={className}>
      <h2 className="mb-4 font-serif text-xl font-semibold text-[#F5F0EB]">
        Avant / Après
      </h2>
      {withBeforeAfter.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-[#111118] p-8 text-center text-[#6B6B80]">
          Aucune comparaison avant/après pour l’instant.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {withBeforeAfter.map((room) => (
            <div
              key={room.id}
              className="rounded-xl border border-white/10 bg-[#111118] overflow-hidden"
            >
              <p className="p-3 text-sm font-medium text-[#F5F0EB]">
                {room.name}
              </p>
              <div className="grid grid-cols-2 gap-2 p-3 pt-0">
                <div>
                  <p className="mb-1 text-xs text-[#6B6B80]">Avant</p>
                  <img
                    src={room.before_image_url!}
                    alt="Avant"
                    className="h-32 w-full rounded object-cover"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#6B6B80]">Après</p>
                  <img
                    src={room.concept_image_url!}
                    alt="Après"
                    className="h-32 w-full rounded object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
