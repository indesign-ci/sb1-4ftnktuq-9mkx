'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConceptionProjects } from '@/hooks/useConception';
import { STATUS_LABELS, STYLE_LABELS, PROJECT_TYPE_LABELS } from '@/types/conception';
import CreateProjectModal from '@/components/conception/CreateProjectModal';
import type { ConceptionProject } from '@/types/conception';

export default function ProjectsListView() {
  const router = useRouter();
  const { projects, loading, error, refetch } = useConceptionProjects({});
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? projects.filter(
        (p) =>
          p.project_name.toLowerCase().includes(search.toLowerCase()) ||
          p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
          p.project_reference?.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  const handleCreated = (project: ConceptionProject) => {
    setShowCreate(false);
    refetch();
    router.push(`/conception/${project.id}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              type="button"
              className="rounded-xl bg-[#C4A265] px-6 py-3 font-semibold text-white hover:opacity-90"
              onClick={() => refetch()}
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-6 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#C4A265] to-[#A68B55] text-xl text-white">
              ✦
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold text-gray-900">Conception</h1>
              <span className="text-xs uppercase tracking-widest text-gray-500">
                Projets de conception
              </span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-br from-[#C4A265] to-[#A68B55] px-6 py-3 font-semibold text-white hover:opacity-90"
            onClick={() => setShowCreate(true)}
          >
            ✦ Nouveau Projet
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <input
            type="search"
            placeholder="Rechercher (nom, client, référence…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#C4A265] focus:outline-none focus:ring-1 focus:ring-[#C4A265]"
          />
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[320px] animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mb-6 text-5xl opacity-40">📁</div>
            <h3 className="mb-2 font-serif text-xl text-gray-900">
              {search ? 'Aucun résultat' : 'Aucun projet'}
            </h3>
            <p className="mb-6 max-w-sm text-gray-500">
              {search
                ? 'Modifiez la recherche ou créez un nouveau projet.'
                : 'Créez votre premier projet de conception.'}
            </p>
            {!search && (
              <button
                type="button"
                className="rounded-xl bg-gradient-to-br from-[#C4A265] to-[#A68B55] px-6 py-3 font-semibold text-white hover:opacity-90"
                onClick={() => setShowCreate(true)}
              >
                ✦ Nouveau Projet
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-[#C4A265]/50 hover:shadow-md"
                onClick={() => router.push(`/conception/${project.id}`)}
              >
                {project.cover_image_url ? (
                  <img
                    src={project.cover_image_url}
                    alt=""
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-4xl text-gray-400">
                    ✦
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#A68B55]">
                    {project.project_reference || project.id.slice(0, 8)} —{' '}
                    {PROJECT_TYPE_LABELS[project.project_type]}
                  </div>
                  <h3 className="mb-1 font-serif text-lg font-semibold text-gray-900">
                    {project.project_name}
                  </h3>
                  <p className="mb-3 text-sm text-gray-600">{project.client_name}</p>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        project.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : project.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {STATUS_LABELS[project.status]}
                    </span>
                    {project.style_direction && (
                      <span className="text-xs text-gray-500">
                        {STYLE_LABELS[project.style_direction]}
                      </span>
                    )}
                    {project.total_area_sqm != null && (
                      <span className="text-xs text-gray-500">
                        {project.total_area_sqm} m²
                      </span>
                    )}
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#C4A265] to-[#D4B87A] transition-all"
                      style={{
                        width: `${(project.phases?.length
                          ? project.phases.reduce((s, p) => s + (p.completion_percentage ?? 0), 0) /
                            project.phases.length
                          : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
