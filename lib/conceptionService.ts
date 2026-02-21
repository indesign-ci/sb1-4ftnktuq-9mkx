// lib/conceptionService.ts — Service Supabase pour le module Conception

import { supabase } from '@/lib/supabase/client';
import type {
  ConceptionProject,
  ConceptionRoom,
  ConceptionMoodboard,
  MoodboardImage,
  ConceptionMaterial,
  ConceptionFurniture,
  ConceptionPhase,
  ConceptionAnnotation,
  ConceptionComment,
  ConceptionPresentation,
  ConceptionDocument,
  BudgetSummary,
} from '@/types/conception';

// ============================================
// PROJECTS
// ============================================

export const conceptionService = {
  // --- Projects ---
  async getProjects(filters?: {
    status?: string;
    search?: string;
    archived?: boolean;
  }): Promise<ConceptionProject[]> {
    let query = supabase
      .from('conception_projects')
      .select(
        `
        *,
        rooms:conception_rooms(count),
        moodboards:conception_moodboards(count),
        phases:conception_phases(*)
      `
      )
      .order('updated_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(
        `project_name.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%,project_reference.ilike.%${filters.search}%`
      );
    }
    if (filters?.archived !== undefined) {
      query = query.eq('is_archived', filters.archived);
    } else {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ConceptionProject[];
  },

  async getProject(id: string): Promise<ConceptionProject> {
    const { data, error } = await supabase
      .from('conception_projects')
      .select(
        `
        *,
        rooms:conception_rooms(*),
        moodboards:conception_moodboards(
          *,
          images:conception_moodboard_images(*)
        ),
        phases:conception_phases(*),
        materials:conception_materials(*),
        furniture:conception_furniture(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ConceptionProject;
  },

  async createProject(project: Partial<ConceptionProject>): Promise<ConceptionProject> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('conception_projects')
      .insert({ ...project, user_id: user.id })
      .select()
      .single();

    if (error) throw error;

    const defaultPhases: Omit<ConceptionPhase, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        project_id: data.id,
        phase_number: 1,
        name: 'Brief & Analyse',
        description:
          'Recueil des besoins, analyse du site, définition du cahier des charges',
        status: 'upcoming',
        completion_percentage: 0,
        deliverables: ['Cahier des charges', 'Analyse du site', 'Planning prévisionnel'],
        sort_order: 1,
      },
      {
        project_id: data.id,
        phase_number: 2,
        name: 'Concept & Moodboard',
        description: "Recherche créative, planches d'ambiance, premières esquisses",
        status: 'upcoming',
        completion_percentage: 0,
        deliverables: ['Moodboards', 'Palette couleurs', 'Esquisses préliminaires'],
        sort_order: 2,
      },
      {
        project_id: data.id,
        phase_number: 3,
        name: 'Développement Design',
        description: 'Plans détaillés, sélection matériaux, choix mobilier',
        status: 'upcoming',
        completion_percentage: 0,
        deliverables: ['Plans d\'aménagement', 'Sélection matériaux', 'Liste mobilier'],
        sort_order: 3,
      },
      {
        project_id: data.id,
        phase_number: 4,
        name: 'Plans Techniques',
        description: 'Plans d\'exécution, détails techniques, spécifications',
        status: 'upcoming',
        completion_percentage: 0,
        deliverables: ['Plans techniques', 'Détails constructifs', 'Cahier des charges techniques'],
        sort_order: 4,
      },
      {
        project_id: data.id,
        phase_number: 5,
        name: 'Présentation Client',
        description: 'Mise en forme de la présentation, rendus 3D, dossier complet',
        status: 'upcoming',
        completion_percentage: 0,
        deliverables: ['Rendus 3D', 'Dossier de présentation', 'Estimation budgétaire'],
        sort_order: 5,
      },
      {
        project_id: data.id,
        phase_number: 6,
        name: 'Suivi de Réalisation',
        description: 'Coordination des travaux, suivi de chantier, réception',
        status: 'upcoming',
        completion_percentage: 0,
        deliverables: ['Rapports de chantier', 'Photos de suivi', 'PV de réception'],
        sort_order: 6,
      },
    ];

    await supabase.from('conception_phases').insert(defaultPhases);

    return data as ConceptionProject;
  },

  async updateProject(id: string, updates: Partial<ConceptionProject>): Promise<ConceptionProject> {
    const { data, error } = await supabase
      .from('conception_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionProject;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from('conception_projects').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Rooms ---
  async getRooms(projectId: string): Promise<ConceptionRoom[]> {
    const { data, error } = await supabase
      .from('conception_rooms')
      .select(
        `
        *,
        materials:conception_materials(*),
        furniture:conception_furniture(*)
      `
      )
      .eq('project_id', projectId)
      .order('sort_order');

    if (error) throw error;
    return (data || []) as ConceptionRoom[];
  },

  async createRoom(room: Partial<ConceptionRoom>): Promise<ConceptionRoom> {
    const { data, error } = await supabase
      .from('conception_rooms')
      .insert(room)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionRoom;
  },

  async updateRoom(id: string, updates: Partial<ConceptionRoom>): Promise<ConceptionRoom> {
    const { data, error } = await supabase
      .from('conception_rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionRoom;
  },

  async deleteRoom(id: string): Promise<void> {
    const { error } = await supabase.from('conception_rooms').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Moodboards ---
  async getMoodboards(projectId: string): Promise<ConceptionMoodboard[]> {
    const { data, error } = await supabase
      .from('conception_moodboards')
      .select(
        `
        *,
        images:conception_moodboard_images(*)
      `
      )
      .eq('project_id', projectId)
      .order('sort_order');

    if (error) throw error;
    return (data || []) as ConceptionMoodboard[];
  },

  async createMoodboard(moodboard: Partial<ConceptionMoodboard>): Promise<ConceptionMoodboard> {
    const { data, error } = await supabase
      .from('conception_moodboards')
      .insert(moodboard)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionMoodboard;
  },

  async updateMoodboard(
    id: string,
    updates: Partial<ConceptionMoodboard>
  ): Promise<ConceptionMoodboard> {
    const { data, error } = await supabase
      .from('conception_moodboards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionMoodboard;
  },

  async deleteMoodboard(id: string): Promise<void> {
    const { error } = await supabase.from('conception_moodboards').delete().eq('id', id);
    if (error) throw error;
  },

  async addMoodboardImage(image: Partial<MoodboardImage>): Promise<MoodboardImage> {
    const { data, error } = await supabase
      .from('conception_moodboard_images')
      .insert(image)
      .select()
      .single();

    if (error) throw error;
    return data as MoodboardImage;
  },

  async updateMoodboardImage(
    id: string,
    updates: Partial<MoodboardImage>
  ): Promise<MoodboardImage> {
    const { data, error } = await supabase
      .from('conception_moodboard_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MoodboardImage;
  },

  async deleteMoodboardImage(id: string): Promise<void> {
    const { error } = await supabase
      .from('conception_moodboard_images')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- Materials ---
  async getMaterials(
    projectId: string,
    roomId?: string
  ): Promise<ConceptionMaterial[]> {
    let query = supabase
      .from('conception_materials')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');

    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ConceptionMaterial[];
  },

  async createMaterial(material: Partial<ConceptionMaterial>): Promise<ConceptionMaterial> {
    const { data, error } = await supabase
      .from('conception_materials')
      .insert(material)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionMaterial;
  },

  async updateMaterial(
    id: string,
    updates: Partial<ConceptionMaterial>
  ): Promise<ConceptionMaterial> {
    const { data, error } = await supabase
      .from('conception_materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionMaterial;
  },

  async deleteMaterial(id: string): Promise<void> {
    const { error } = await supabase.from('conception_materials').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Furniture ---
  async getFurniture(
    projectId: string,
    roomId?: string
  ): Promise<ConceptionFurniture[]> {
    let query = supabase
      .from('conception_furniture')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');

    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ConceptionFurniture[];
  },

  async createFurniture(
    furniture: Partial<ConceptionFurniture>
  ): Promise<ConceptionFurniture> {
    const { data, error } = await supabase
      .from('conception_furniture')
      .insert(furniture)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionFurniture;
  },

  async updateFurniture(
    id: string,
    updates: Partial<ConceptionFurniture>
  ): Promise<ConceptionFurniture> {
    const { data, error } = await supabase
      .from('conception_furniture')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionFurniture;
  },

  async deleteFurniture(id: string): Promise<void> {
    const { error } = await supabase.from('conception_furniture').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Phases ---
  async getPhases(projectId: string): Promise<ConceptionPhase[]> {
    const { data, error } = await supabase
      .from('conception_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('phase_number');

    if (error) throw error;
    return (data || []) as ConceptionPhase[];
  },

  async updatePhase(id: string, updates: Partial<ConceptionPhase>): Promise<ConceptionPhase> {
    const { data, error } = await supabase
      .from('conception_phases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionPhase;
  },

  // --- Annotations ---
  async getAnnotations(
    projectId: string,
    roomId?: string
  ): Promise<ConceptionAnnotation[]> {
    let query = supabase
      .from('conception_annotations')
      .select('*')
      .eq('project_id', projectId);

    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ConceptionAnnotation[];
  },

  async createAnnotation(
    annotation: Partial<ConceptionAnnotation>
  ): Promise<ConceptionAnnotation> {
    const { data, error } = await supabase
      .from('conception_annotations')
      .insert(annotation)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionAnnotation;
  },

  async deleteAnnotation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conception_annotations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- Comments ---
  async getComments(projectId: string): Promise<ConceptionComment[]> {
    const { data, error } = await supabase
      .from('conception_comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ConceptionComment[];
  },

  async createComment(comment: Partial<ConceptionComment>): Promise<ConceptionComment> {
    const { data, error } = await supabase
      .from('conception_comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionComment;
  },

  // --- Presentations ---
  async getPresentations(projectId: string): Promise<ConceptionPresentation[]> {
    const { data, error } = await supabase
      .from('conception_presentations')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false });

    if (error) throw error;
    return (data || []) as ConceptionPresentation[];
  },

  async createPresentation(
    presentation: Partial<ConceptionPresentation>
  ): Promise<ConceptionPresentation> {
    const shareToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    const { data, error } = await supabase
      .from('conception_presentations')
      .insert({
        ...presentation,
        share_token: shareToken,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionPresentation;
  },

  async updatePresentation(
    id: string,
    updates: Partial<ConceptionPresentation>
  ): Promise<ConceptionPresentation> {
    const { data, error } = await supabase
      .from('conception_presentations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionPresentation;
  },

  // --- Documents ---
  async getDocuments(projectId: string): Promise<ConceptionDocument[]> {
    const { data, error } = await supabase
      .from('conception_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ConceptionDocument[];
  },

  async uploadDocument(
    projectId: string,
    file: File,
    category: ConceptionDocument['category'],
    description?: string
  ): Promise<ConceptionDocument> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('conception-assets')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('conception-assets').getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('conception_documents')
      .insert({
        project_id: projectId,
        name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size_bytes: file.size,
        category,
        description,
        version: 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ConceptionDocument;
  },

  // --- Upload image générique ---
  async uploadImage(
    projectId: string,
    file: File,
    folder: string = 'images'
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('conception-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('conception-assets').getPublicUrl(fileName);

    return publicUrl;
  },

  // --- Budget Summary ---
  async getBudgetSummary(projectId: string): Promise<BudgetSummary | null> {
    const { data, error } = await supabase
      .from('conception_budget_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // no rows
      throw error;
    }
    return data as BudgetSummary;
  },
};
