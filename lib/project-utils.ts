export const PROJECT_PHASES = [
  { id: 1, key: 'brief', name: 'Brief / Prise de contact' },
  { id: 2, key: 'technical_visit', name: 'Visite technique & Relevé de mesures' },
  { id: 3, key: 'design', name: 'Étude de conception (moodboard, plans)' },
  { id: 4, key: 'presentation', name: 'Présentation client & Validation' },
  { id: 5, key: 'execution_plans', name: 'Dossier technique / Plans d\'exécution' },
  { id: 6, key: 'contractor_consultation', name: 'Consultation entreprises & Devis artisans' },
  { id: 7, key: 'construction_monitoring', name: 'Suivi de chantier' },
  { id: 8, key: 'reception', name: 'Réception des travaux' },
  { id: 9, key: 'photoshoot', name: 'Shooting photo & Publication' },
]

export const DEFAULT_TASKS_BY_PHASE = {
  1: [
    'Premier contact téléphonique',
    'Envoi du questionnaire client',
    'Réception du questionnaire rempli',
    'Analyse des besoins et envies',
    'Estimation budgétaire préliminaire',
    'Envoi de la proposition de mission + honoraires',
  ],
  2: [
    'Planifier la visite sur site',
    'Relevé de mesures complet',
    'Photos de l\'existant (toutes les pièces)',
    'Repérage réseaux (électricité, plomberie)',
    'Vérification contraintes techniques',
    'Rédaction du compte-rendu de visite',
  ],
  3: [
    'Recherches d\'inspiration',
    'Création des moodboards / planches d\'ambiance',
    'Élaboration de la palette couleurs et matériaux',
    'Dessin des plans d\'aménagement (2-3 options)',
    'Sélection du mobilier et luminaires',
    'Vues 3D / perspectives',
  ],
  4: [
    'Préparation du dossier de présentation',
    'Rendez-vous de présentation client',
    'Recueil des retours et modifications',
    'Intégration des modifications',
    'Validation finale du client',
    'Signature du devis',
  ],
  5: [
    'Plans techniques détaillés',
    'Plans électriques',
    'Plans plomberie',
    'Calepinage carrelage / revêtements',
    'Détails menuiserie sur mesure',
    'Dossier technique complet',
  ],
  6: [
    'Rédaction du cahier des charges artisans',
    'Envoi des appels d\'offres',
    'Réception et comparaison des devis artisans',
    'Négociation des tarifs',
    'Sélection des entreprises',
    'Planning prévisionnel du chantier',
  ],
  7: [
    'Réunion de démarrage chantier',
    'Suivi hebdomadaire sur site',
    'Comptes-rendus de chantier',
    'Gestion des imprévus',
    'Coordination des corps de métier',
    'Suivi des livraisons mobilier',
    'Contrôle qualité en continu',
  ],
  8: [
    'Pré-réception (lever des réserves)',
    'Liste de réserves',
    'Suivi de la levée des réserves',
    'Réception définitive des travaux',
    'PV de réception signé',
    'Installation finale (décoration, accessoires)',
    'Remise des clés au client',
  ],
  9: [
    'Planifier le shooting photo',
    'Préparation du lieu (styling)',
    'Shooting photographique professionnel',
    'Sélection et retouche des photos',
    'Accord du client pour publication',
    'Publication portfolio / réseaux sociaux',
  ],
}

export const PROPERTY_TYPES = [
  'Appartement',
  'Maison',
  'Duplex',
  'Loft',
  'Penthouse',
  'Villa',
  'Bureau',
  'Commerce',
  'Restaurant',
  'Hôtel',
  'Autre',
]

export const DESIGN_STYLES = [
  'Contemporain',
  'Classique',
  'Art Déco',
  'Scandinave',
  'Industriel',
  'Bohème',
  'Japandi',
  'Minimaliste',
  'Méditerranéen',
  'Luxe',
  'Autre',
]

export const PROJECT_STATUSES = [
  { value: 'active', label: 'En cours', color: 'bg-green-100 text-green-800' },
  { value: 'paused', label: 'En pause', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Terminé', color: 'bg-blue-100 text-blue-800' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
]

export const BUDGET_CATEGORIES = [
  'Démolition & Préparation',
  'Gros œuvre',
  'Plomberie / Sanitaires',
  'Électricité',
  'Menuiserie',
  'Peinture',
  'Revêtements sol',
  'Revêtements mur',
  'Mobilier',
  'Luminaires',
  'Décoration & Accessoires',
  'Textiles (rideaux, coussins, tapis)',
  'Honoraires architecture d\'intérieur',
  'Divers / Imprévus',
]

export const DOCUMENT_CATEGORIES = [
  'Plans',
  'Photos avant',
  'Photos pendant',
  'Photos après',
  'Devis artisans',
  'Factures fournisseurs',
  'Contrats',
  'Comptes-rendus',
  'PV de réception',
  'Autres',
]

export function getPhaseLabel(phaseKey: string): string {
  const phase = PROJECT_PHASES.find((p) => p.key === phaseKey)
  return phase ? phase.name : phaseKey
}

export function getStatusBadgeColor(status: string): string {
  const statusObj = PROJECT_STATUSES.find((s) => s.value === status)
  return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800'
}

export function calculateMargin(budgetEstimated: number, budgetSpent: number): {
  amount: number
  percentage: number
} {
  const amount = budgetEstimated - budgetSpent
  const percentage = budgetEstimated > 0 ? (amount / budgetEstimated) * 100 : 0
  return { amount, percentage }
}

export function formatCurrency(amount: number, currency: string = 'XAF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}
