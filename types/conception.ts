// types/conception.ts — Types pour le module Conception

export type ProjectType =
  | 'residential'
  | 'commercial'
  | 'hospitality'
  | 'retail'
  | 'office'
  | 'renovation';

export type StyleDirection =
  | 'contemporary'
  | 'minimalist'
  | 'classic'
  | 'art_deco'
  | 'industrial'
  | 'scandinavian'
  | 'japandi'
  | 'mediterranean'
  | 'bohemian'
  | 'luxury_modern'
  | 'transitional'
  | 'neo_classic';

export type ProjectStatus =
  | 'brief'
  | 'concept'
  | 'design_development'
  | 'technical_drawings'
  | 'material_selection'
  | 'presentation'
  | 'revision'
  | 'approved'
  | 'in_progress'
  | 'completed';

export type RoomType =
  | 'living_room'
  | 'bedroom'
  | 'master_bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'master_bathroom'
  | 'dining_room'
  | 'office'
  | 'hallway'
  | 'terrace'
  | 'garden'
  | 'pool_area'
  | 'spa'
  | 'dressing'
  | 'library'
  | 'wine_cellar'
  | 'home_cinema'
  | 'lobby'
  | 'reception'
  | 'conference'
  | 'restaurant'
  | 'bar'
  | 'suite'
  | 'other';

export type MaterialCategory =
  | 'flooring'
  | 'wall_covering'
  | 'ceiling'
  | 'fabric'
  | 'stone'
  | 'wood'
  | 'metal'
  | 'glass'
  | 'ceramic'
  | 'paint'
  | 'wallpaper'
  | 'lighting'
  | 'hardware'
  | 'other';

export type FurnitureCategory =
  | 'seating'
  | 'table'
  | 'storage'
  | 'bed'
  | 'desk'
  | 'lighting'
  | 'rug'
  | 'curtain'
  | 'artwork'
  | 'mirror'
  | 'accessory'
  | 'plant'
  | 'appliance'
  | 'sanitary'
  | 'other';

export type MaterialStatus =
  | 'proposed'
  | 'sample_ordered'
  | 'sample_received'
  | 'approved'
  | 'ordered'
  | 'delivered'
  | 'installed'
  | 'rejected';

export type FurnitureStatus =
  | 'proposed'
  | 'approved'
  | 'ordered'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'installed'
  | 'rejected';

export type PhaseStatus = 'upcoming' | 'in_progress' | 'review' | 'completed';

export type PresentationTheme = 'luxury_dark' | 'luxury_light' | 'minimal' | 'classic';

export interface ColorSwatch {
  hex: string;
  name: string;
  role: 'primary' | 'secondary' | 'accent' | 'neutral' | 'background';
}

export interface ConceptionProject {
  id: string;
  user_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  client_address?: string;
  project_name: string;
  project_reference?: string;
  project_type: ProjectType;
  description?: string;
  style_direction?: StyleDirection;
  total_area_sqm?: number;
  number_of_rooms: number;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  status: ProjectStatus;
  current_phase: number;
  start_date?: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  presentation_date?: string;
  cover_image_url?: string;
  tags?: string[];
  notes?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  rooms?: ConceptionRoom[];
  moodboards?: ConceptionMoodboard[];
  phases?: ConceptionPhase[];
  materials?: ConceptionMaterial[];
  furniture?: ConceptionFurniture[];
}

export interface ConceptionRoom {
  id: string;
  project_id: string;
  name: string;
  room_type: RoomType;
  area_sqm?: number;
  ceiling_height_m: number;
  description?: string;
  design_notes?: string;
  before_image_url?: string;
  concept_image_url?: string;
  final_render_url?: string;
  floor_plan_url?: string;
  estimated_budget?: number;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
  materials?: ConceptionMaterial[];
  furniture?: ConceptionFurniture[];
}

export interface ConceptionMoodboard {
  id: string;
  project_id: string;
  room_id?: string;
  title: string;
  description?: string;
  theme?: string;
  color_palette: ColorSwatch[];
  sort_order: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  images?: MoodboardImage[];
}

export interface MoodboardImage {
  id: string;
  moodboard_id: string;
  image_url: string;
  thumbnail_url?: string;
  caption?: string;
  source?: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  sort_order: number;
  created_at: string;
}

export interface ConceptionMaterial {
  id: string;
  project_id: string;
  room_id?: string;
  name: string;
  category: MaterialCategory;
  brand?: string;
  reference?: string;
  supplier?: string;
  supplier_contact?: string;
  description?: string;
  image_url?: string;
  swatch_color?: string;
  texture_url?: string;
  unit_price?: number;
  unit: string;
  quantity?: number;
  total_price?: number;
  status: MaterialStatus;
  lead_time_days?: number;
  notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ConceptionFurniture {
  id: string;
  project_id: string;
  room_id?: string;
  name: string;
  category: FurnitureCategory;
  brand?: string;
  collection?: string;
  reference?: string;
  designer?: string;
  description?: string;
  width_cm?: number;
  depth_cm?: number;
  height_cm?: number;
  image_url?: string;
  product_url?: string;
  unit_price?: number;
  quantity: number;
  total_price?: number;
  is_custom: boolean;
  status: FurnitureStatus;
  lead_time_days?: number;
  notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ConceptionPhase {
  id: string;
  project_id: string;
  phase_number: number;
  name: string;
  description?: string;
  status: PhaseStatus;
  start_date?: string;
  end_date?: string;
  deliverables?: string[];
  completion_percentage: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ConceptionAnnotation {
  id: string;
  project_id: string;
  room_id?: string;
  image_url: string;
  annotation_type:
    | 'note'
    | 'dimension'
    | 'material_ref'
    | 'furniture_ref'
    | 'electrical'
    | 'plumbing'
    | 'hvac'
    | 'custom';
  content?: string;
  x_percent: number;
  y_percent: number;
  color: string;
  icon?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ConceptionComment {
  id: string;
  project_id: string;
  room_id?: string;
  moodboard_id?: string;
  author_name: string;
  author_role: 'designer' | 'client' | 'collaborator';
  content: string;
  reference_image_url?: string;
  x_percent?: number;
  y_percent?: number;
  is_resolved: boolean;
  created_at: string;
}

export interface ConceptionPresentation {
  id: string;
  project_id: string;
  title: string;
  version: number;
  sections: PresentationSection[];
  theme: PresentationTheme;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  share_token?: string;
  share_url?: string;
  is_public: boolean;
  status: 'draft' | 'ready' | 'presented' | 'approved' | 'revision_requested';
  presented_at?: string;
  client_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface PresentationSection {
  type:
    | 'cover'
    | 'moodboard'
    | 'room'
    | 'materials'
    | 'furniture'
    | 'budget'
    | 'timeline'
    | 'custom';
  data: Record<string, unknown>;
}

export interface ConceptionDocument {
  id: string;
  project_id: string;
  name: string;
  file_url: string;
  file_type?: string;
  file_size_bytes?: number;
  category:
    | 'plan'
    | 'render'
    | 'photo'
    | 'technical'
    | 'contract'
    | 'invoice'
    | 'specification'
    | 'other';
  description?: string;
  version: number;
  uploaded_at: string;
}

export interface BudgetSummary {
  project_id: string;
  project_name: string;
  budget_min?: number;
  budget_max?: number;
  total_materials_cost: number;
  total_furniture_cost: number;
  total_estimated_cost: number;
  budget_usage_percent: number;
}

// Labels et traductions
export const STYLE_LABELS: Record<StyleDirection, string> = {
  contemporary: 'Contemporain',
  minimalist: 'Minimaliste',
  classic: 'Classique',
  art_deco: 'Art Déco',
  industrial: 'Industriel',
  scandinavian: 'Scandinave',
  japandi: 'Japandi',
  mediterranean: 'Méditerranéen',
  bohemian: 'Bohème',
  luxury_modern: 'Luxe Moderne',
  transitional: 'Transitionnel',
  neo_classic: 'Néo-Classique',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  residential: 'Résidentiel',
  commercial: 'Commercial',
  hospitality: 'Hôtellerie',
  retail: 'Retail',
  office: 'Bureau',
  renovation: 'Rénovation',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  brief: 'Brief',
  concept: 'Conception',
  design_development: 'Développement Design',
  technical_drawings: 'Plans Techniques',
  material_selection: 'Sélection Matériaux',
  presentation: 'Présentation',
  revision: 'Révision',
  approved: 'Approuvé',
  in_progress: 'En Cours',
  completed: 'Terminé',
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  living_room: 'Salon',
  bedroom: 'Chambre',
  master_bedroom: 'Suite Parentale',
  kitchen: 'Cuisine',
  bathroom: 'Salle de Bain',
  master_bathroom: 'Salle de Bain Principale',
  dining_room: 'Salle à Manger',
  office: 'Bureau',
  hallway: 'Couloir / Entrée',
  terrace: 'Terrasse',
  garden: 'Jardin',
  pool_area: 'Espace Piscine',
  spa: 'Spa',
  dressing: 'Dressing',
  library: 'Bibliothèque',
  wine_cellar: 'Cave à Vin',
  home_cinema: 'Home Cinéma',
  lobby: 'Lobby',
  reception: 'Réception',
  conference: 'Salle de Conférence',
  restaurant: 'Restaurant',
  bar: 'Bar',
  suite: 'Suite',
  other: 'Autre',
};

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  flooring: 'Revêtement de Sol',
  wall_covering: 'Revêtement Mural',
  ceiling: 'Plafond',
  fabric: 'Tissu',
  stone: 'Pierre',
  wood: 'Bois',
  metal: 'Métal',
  glass: 'Verre',
  ceramic: 'Céramique',
  paint: 'Peinture',
  wallpaper: 'Papier Peint',
  lighting: 'Éclairage',
  hardware: 'Quincaillerie',
  other: 'Autre',
};

export const FURNITURE_CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  seating: 'Assise',
  table: 'Table',
  storage: 'Rangement',
  bed: 'Lit',
  desk: 'Bureau',
  lighting: 'Luminaire',
  rug: 'Tapis',
  curtain: 'Rideau',
  artwork: "Œuvre d'Art",
  mirror: 'Miroir',
  accessory: 'Accessoire',
  plant: 'Plante',
  appliance: 'Électroménager',
  sanitary: 'Sanitaire',
  other: 'Autre',
};
