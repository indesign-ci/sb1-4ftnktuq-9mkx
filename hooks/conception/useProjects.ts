'use client';

import { useState, useEffect, useCallback } from 'react';
import { conceptionService } from '@/lib/conceptionService';
import type { ConceptionProject } from '@/types/conception';

interface UseProjectsFilters {
  status?: string;
  search?: string;
  archived?: boolean;
}

export function useConceptionProjects(filters: UseProjectsFilters = {}) {
  const [projects, setProjects] = useState<ConceptionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await conceptionService.getProjects(filters);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement projets');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.search, filters.archived]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { projects, loading, error, refetch };
}
