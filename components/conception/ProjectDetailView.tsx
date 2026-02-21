'use client';

import { useState } from 'react';
import { useConceptionProject } from '@/hooks/useConception';
import { STATUS_LABELS } from '@/types/conception';
import DesignPhases from '@/components/conception/DesignPhases';
import BudgetEstimation from '@/components/conception/BudgetEstimation';
import RoomVisualizer from '@/components/conception/RoomVisualizer';
import MaterialsPalette from '@/components/conception/MaterialsPalette';
import ProjectTimeline from '@/components/conception/ProjectTimeline';
import ClientPresentation from '@/components/conception/ClientPresentation';
import BeforeAfter from '@/components/conception/BeforeAfter';

type TabId = 'overview' | 'moodboards' | 'rooms' | 'materials' | 'furniture' | 'budget' | 'timeline' | 'presentation';

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
}

export default function ProjectDetailView({ projectId, onBack }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const {
    project,
    rooms,
    moodboards,
    materials,
    furniture,
    phases,
    budget,
    loading,
    error,
    refetch,
    updateProject,
    addRoom,
    updateRoom,
    removeRoom,
    addMaterial,
    updateMaterial,
    addFurniture,
    uploadImage,
  } = useConceptionProject(projectId);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'moodboards', label: 'Moodboards' },
    { id: 'rooms', label: 'Espaces' },
    { id: 'materials', label: 'Matériaux' },
    { id: 'furniture', label: 'Mobilier' },
    { id: 'budget', label: 'Budget' },
    { id: 'timeline', label: 'Planning' },
    { id: 'presentation', label: 'Présentation' },
  ];

  if (loading && !project) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse rounded-xl bg-[#1C1C28] h-64 w-96" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-8">
        <p className="text-[#9B9BAE] mb-4">{error ?? 'Projet introuvable'}</p>
        <button
          type="button"
          className="rounded-xl bg-[#C4A265] px-6 py-3 font-semibold text-[#0A0A0F]"
          onClick={onBack}
        >
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F0EB]">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0A0A0F]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <button type="button" className="text-[#C4A265] hover:underline" onClick={onBack}>
            ← Conception
          </button>
          <div className="text-center">
            <h1 className="font-serif text-lg font-semibold">{project.project_name}</h1>
            <span className="text-xs text-[#6B6B80]">{project.client_name}</span>
          </div>
          <span className="rounded-full bg-[#16161F] px-3 py-1 text-xs font-semibold text-[#C4A265]">
            {STATUS_LABELS[project.status]}
          </span>
        </div>
      </header>

      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-[#16161F] text-[#C4A265]'
                  : 'text-[#9B9BAE] hover:bg-[#16161F] hover:text-[#F5F0EB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <section className="rounded-xl border border-white/10 bg-[#111118] p-6">
              <h2 className="mb-4 font-serif text-xl font-semibold text-[#F5F0EB]">Description</h2>
              <p className="text-[#9B9BAE] whitespace-pre-wrap">{project.description || 'Aucune description.'}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#6B6B80]">
                {project.total_area_sqm != null && <span>{project.total_area_sqm} m²</span>}
                {project.budget_min != null && <span>Budget : {project.budget_min.toLocaleString('fr-FR')} – {project.budget_max?.toLocaleString('fr-FR')} €</span>}
              </div>
            </section>
            <DesignPhases phases={phases} />
          </div>
        )}

        {activeTab === 'moodboards' && (
          <div className="rounded-xl border border-white/10 bg-[#111118] p-8 text-center">
            <p className="text-[#9B9BAE]">Planches d&apos;ambiance : {moodboards.length} moodboard{moodboards.length > 1 ? 's' : ''}.</p>
            <p className="mt-2 text-sm text-[#6B6B80]">Contenu à enrichir selon vos besoins.</p>
          </div>
        )}

        {activeTab === 'rooms' && (
          <RoomVisualizer
            projectId={projectId}
            rooms={rooms}
            onAddRoom={addRoom}
            onUpdateRoom={updateRoom}
            onRemoveRoom={removeRoom}
            onUploadImage={uploadImage}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsPalette
            projectId={projectId}
            materials={materials}
            rooms={rooms}
            onAddMaterial={addMaterial}
            onUpdateMaterial={updateMaterial}
            onUploadImage={uploadImage}
            onRefetch={refetch}
          />
        )}

        {activeTab === 'furniture' && (
          <MaterialsPalette
            projectId={projectId}
            materials={materials}
            rooms={rooms}
            furniture={furniture}
            onAddFurniture={addFurniture}
            onUploadImage={uploadImage}
            onRefetch={refetch}
            isFurnitureMode
          />
        )}

        {activeTab === 'budget' && (
          <BudgetEstimation budget={budget} project={project} materials={materials} furniture={furniture} rooms={rooms} />
        )}

        {activeTab === 'timeline' && (
          <ProjectTimeline project={project} phases={phases} />
        )}

        {activeTab === 'presentation' && (
          <div className="space-y-6">
            <ClientPresentation project={project} rooms={rooms} moodboards={moodboards} />
            <BeforeAfter rooms={rooms} />
          </div>
        )}
      </main>
    </div>
  );
}
