'use client';

import { useState } from 'react';
import { conceptionService } from '@/lib/conceptionService';
import type { ConceptionProject, ProjectType, StyleDirection } from '@/types/conception';
import { PROJECT_TYPE_LABELS, STYLE_LABELS } from '@/types/conception';
import { X } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: (project: ConceptionProject) => void;
}

export default function CreateProjectModal({ onClose, onCreated }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_company: '',
    project_type: 'residential' as ProjectType,
    style_direction: '' as StyleDirection | '',
    description: '',
    total_area_sqm: '',
    budget_min: '',
    budget_max: '',
    start_date: '',
    estimated_end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const project = await conceptionService.createProject({
        project_name: formData.project_name,
        client_name: formData.client_name,
        client_email: formData.client_email || undefined,
        client_phone: formData.client_phone || undefined,
        client_company: formData.client_company || undefined,
        project_type: formData.project_type,
        style_direction: formData.style_direction || undefined,
        description: formData.description || undefined,
        total_area_sqm: formData.total_area_sqm ? parseFloat(formData.total_area_sqm) : undefined,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        start_date: formData.start_date || undefined,
        estimated_end_date: formData.estimated_end_date || undefined,
        number_of_rooms: 4,
        currency: 'EUR',
        status: 'brief',
        current_phase: 1,
        is_archived: false,
      });
      onCreated(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-[#1C1C28] px-4 py-3 text-[#F5F0EB] placeholder:text-[#6B6B80] focus:border-[#C4A265] focus:outline-none';
  const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-[#9B9BAE]';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111118] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-serif text-xl font-semibold text-[#F5F0EB]">Nouveau Projet de Conception</h2>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#16161F] text-[#9B9BAE] hover:text-[#C4A265]" onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#C4A265] mb-2">Client</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Nom *</label><input type="text" className={inputClass} value={formData.client_name} onChange={(e) => updateField('client_name', e.target.value)} placeholder="M. & Mme Dupont" required /></div>
                <div><label className={labelClass}>Société</label><input type="text" className={inputClass} value={formData.client_company} onChange={(e) => updateField('client_company', e.target.value)} /></div>
                <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={formData.client_email} onChange={(e) => updateField('client_email', e.target.value)} /></div>
                <div><label className={labelClass}>Téléphone</label><input type="tel" className={inputClass} value={formData.client_phone} onChange={(e) => updateField('client_phone', e.target.value)} /></div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#C4A265] mb-2">Projet</h3>
              <div className="mb-4"><label className={labelClass}>Nom du projet *</label><input type="text" className={inputClass} value={formData.project_name} onChange={(e) => updateField('project_name', e.target.value)} placeholder="Villa Méditerranée" required /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelClass}>Type</label><select className={inputClass} value={formData.project_type} onChange={(e) => updateField('project_type', e.target.value)}>{Object.entries(PROJECT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div><label className={labelClass}>Style</label><select className={inputClass} value={formData.style_direction} onChange={(e) => updateField('style_direction', e.target.value)}><option value="">—</option>{Object.entries(STYLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div><label className={labelClass}>Surface (m²)</label><input type="number" className={inputClass} value={formData.total_area_sqm} onChange={(e) => updateField('total_area_sqm', e.target.value)} placeholder="250" /></div>
              </div>
              <div className="mt-4"><label className={labelClass}>Description</label><textarea className={`${inputClass} min-h-[100px] resize-y`} value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={3} /></div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#C4A265] mb-2">Budget & dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Budget min (€)</label><input type="number" className={inputClass} value={formData.budget_min} onChange={(e) => updateField('budget_min', e.target.value)} /></div>
                <div><label className={labelClass}>Budget max (€)</label><input type="number" className={inputClass} value={formData.budget_max} onChange={(e) => updateField('budget_max', e.target.value)} /></div>
                <div><label className={labelClass}>Début</label><input type="date" className={inputClass} value={formData.start_date} onChange={(e) => updateField('start_date', e.target.value)} /></div>
                <div><label className={labelClass}>Fin estimée</label><input type="date" className={inputClass} value={formData.estimated_end_date} onChange={(e) => updateField('estimated_end_date', e.target.value)} /></div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
            <button type="button" className="rounded-xl border border-white/10 bg-[#16161F] px-5 py-3 font-medium text-[#F5F0EB] hover:bg-[#1C1C28]" onClick={onClose}>Annuler</button>
            <button type="submit" className="rounded-xl bg-gradient-to-br from-[#C4A265] to-[#A68B55] px-5 py-3 font-semibold text-[#0A0A0F] disabled:opacity-50" disabled={loading}>{loading ? 'Création...' : '✦ Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
