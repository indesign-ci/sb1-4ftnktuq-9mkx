export const PROJECT_PHASES = [
  { value: 'brief', label: 'Brief' },
  { value: 'technical_visit', label: 'Visite technique' },
  { value: 'design', label: 'Conception' },
  { value: 'presentation', label: 'Présentation' },
  { value: 'execution_plans', label: "Plans d'exécution" },
  { value: 'contractor_consultation', label: 'Consultation entreprises' },
  { value: 'construction_monitoring', label: 'Suivi chantier' },
  { value: 'reception', label: 'Réception' },
  { value: 'photoshoot', label: 'Shooting' },
] as const

export const CLIENT_STATUSES = [
  { value: 'prospect', label: 'Prospect', color: 'bg-gray-500' },
  { value: 'first_contact', label: 'Premier contact', color: 'bg-blue-500' },
  { value: 'quote_sent', label: 'Devis envoyé', color: 'bg-yellow-500' },
  { value: 'project_signed', label: 'Projet signé', color: 'bg-green-500' },
  { value: 'active', label: 'Actif', color: 'bg-emerald-500' },
  { value: 'completed', label: 'Terminé', color: 'bg-purple-500' },
  { value: 'inactive', label: 'Inactif', color: 'bg-gray-400' },
] as const

export const BUDGET_CATEGORIES = [
  'Démolition',
  'Gros œuvre',
  'Plomberie',
  'Électricité',
  'Menuiserie',
  'Peinture',
  'Revêtements sol',
  'Revêtements mur',
  'Mobilier',
  'Luminaires',
  'Décoration',
  'Textiles',
  'Honoraires',
  'Divers',
] as const

export const STYLE_PREFERENCES = [
  'Contemporain',
  'Classique',
  'Scandinave',
  'Industriel',
  'Art Déco',
  'Bohème',
  'Japandi',
  'Minimaliste',
  'Luxe',
  'Autre',
] as const

export const MATERIAL_CATEGORIES = [
  'Sol',
  'Mur',
  'Tissu',
  'Luminaire',
  'Mobilier',
  'Quincaillerie',
  'Peinture',
  'Papier peint',
  'Pierre',
  'Bois',
  'Métal',
] as const

export const CURRENCIES = [
  { value: 'XAF', label: 'Franc CFA (FCFA)', symbol: 'FCFA' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'USD', label: 'Dollar US ($)', symbol: '$' },
] as const

export const DEFAULT_CURRENCY = 'XAF'
