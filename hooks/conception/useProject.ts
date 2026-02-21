'use client';

import { useState, useEffect, useCallback } from 'react';
import { conceptionService } from '@/lib/conceptionService';
import type {
  ConceptionProject,
  ConceptionRoom,
  ConceptionMoodboard,
  ConceptionMaterial,
  ConceptionFurniture,
  ConceptionPhase,
  BudgetSummary,
} from '@/types/conception';

export function useConceptionProject(projectId: string | undefined) {
  const [project, setProject] = useState<ConceptionProject | null>(null);
  const [rooms, setRooms] = useState<ConceptionRoom[]>([]);
  const [moodboards, setMoodboards] = useState<ConceptionMoodboard[]>([]);
  const [materials, setMaterials] = useState<ConceptionMaterial[]>([]);
  const [furniture, setFurniture] = useState<ConceptionFurniture[]>([]);
  const [phases, setPhases] = useState<ConceptionPhase[]>([]);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [proj, budgetSummary] = await Promise.all([
        conceptionService.getProject(projectId),
        conceptionService.getBudgetSummary(projectId),
      ]);
      setProject(proj);
      setRooms(proj.rooms ?? []);
      setMoodboards(proj.moodboards ?? []);
      setMaterials(proj.materials ?? []);
      setFurniture(proj.furniture ?? []);
      setPhases(proj.phases ?? []);
      setBudget(budgetSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement projet');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setRooms([]);
      setMoodboards([]);
      setMaterials([]);
      setFurniture([]);
      setPhases([]);
      setBudget(null);
      setLoading(false);
      setError(null);
      return;
    }
    refetch();
  }, [projectId, refetch]);

  const updateProject = useCallback(
    async (updates: Partial<ConceptionProject>) => {
      if (!projectId || !project) return project;
      const updated = await conceptionService.updateProject(projectId, updates);
      setProject(updated);
      return updated;
    },
    [projectId, project]
  );

  const addRoom = useCallback(
    async (data: Partial<ConceptionRoom>) => {
      if (!projectId) throw new Error('projectId requis');
      const room = await conceptionService.createRoom({ ...data, project_id: projectId });
      setRooms((prev) => [...prev, room]);
      return room;
    },
    [projectId]
  );

  const updateRoom = useCallback(async (id: string, updates: Partial<ConceptionRoom>) => {
    const updated = await conceptionService.updateRoom(id, updates);
    setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const removeRoom = useCallback(async (id: string) => {
    await conceptionService.deleteRoom(id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addMoodboard = useCallback(
    async (data: Partial<ConceptionMoodboard>) => {
      if (!projectId) throw new Error('projectId requis');
      const mb = await conceptionService.createMoodboard({
        ...data,
        project_id: projectId,
        color_palette: data.color_palette ?? [],
        sort_order: data.sort_order ?? 0,
        is_approved: false,
      });
      setMoodboards((prev) => [...prev, mb]);
      return mb;
    },
    [projectId]
  );

  const addMaterial = useCallback(
    async (data: Partial<ConceptionMaterial>) => {
      if (!projectId) throw new Error('projectId requis');
      const m = await conceptionService.createMaterial({ ...data, project_id: projectId });
      setMaterials((prev) => [...prev, m]);
      return m;
    },
    [projectId]
  );

  const updateMaterial = useCallback(async (id: string, updates: Partial<ConceptionMaterial>) => {
    const updated = await conceptionService.updateMaterial(id, updates);
    setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const addFurniture = useCallback(
    async (data: Partial<ConceptionFurniture>) => {
      if (!projectId) throw new Error('projectId requis');
      const f = await conceptionService.createFurniture({ ...data, project_id: projectId });
      setFurniture((prev) => [...prev, f]);
      return f;
    },
    [projectId]
  );

  const updatePhase = useCallback(async (id: string, updates: Partial<ConceptionPhase>) => {
    const updated = await conceptionService.updatePhase(id, updates);
    setPhases((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const uploadImage = useCallback(
    async (file: File, folder?: string) => {
      if (!projectId) throw new Error('projectId requis');
      return conceptionService.uploadImage(projectId, file, folder ?? 'images');
    },
    [projectId]
  );

  return {
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
    addMoodboard,
    addMaterial,
    updateMaterial,
    addFurniture,
    updatePhase,
    uploadImage,
  };
}
