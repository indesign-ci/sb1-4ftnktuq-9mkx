/**
 * Configuration centralisée du module Documents Professionnels
 * Phases, types de documents, statuts, routes, design PDF (couleurs, polices)
 */

export const DOCUMENT_COLORS = {
  text: '#1A1A1A',
  accent: '#C5A572',
  sectionBg: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#666666',
} as const

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'finalized', label: 'Finalisé' },
  { value: 'sent', label: 'Envoyé' },
  { value: 'signed', label: 'Signé' },
  { value: 'archived', label: 'Archivé' },
] as const

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600' },
  finalized: { label: 'Finalisé', className: 'bg-blue-50 text-blue-600' },
  sent: { label: 'Envoyé', className: 'bg-green-50 text-green-600' },
  signed: { label: 'Signé', className: 'bg-amber-50 text-amber-700' },
  archived: { label: 'Archivé', className: 'bg-gray-100 text-gray-500' },
}

export type DocumentPhaseId =
  | 'phase1'
  | 'phase2'
  | 'phase3'
  | 'phase4'
  | 'phase5'
  | 'phase6'
  | 'phase7'

export type DocumentTypeEntry = {
  value: string
  label: string
  description: string
  route: string
}

export const PHASE_COLORS: Record<string, string> = {
  phase1: '#3B82F6',
  phase2: '#22C55E',
  phase3: '#C5A572',
  phase4: '#8B5CF6',
  phase5: '#F59E0B',
  phase6: '#EF4444',
  phase7: '#059669',
}

/** Phase 1 — Prise de contact */
/** Phase 2 — Visite technique */
/** Phase 3 — Contractualisation */
/** Phase 4 — Conception */
/** Phase 5 — Consultation & Préparation chantier */
/** Phase 6 — Suivi de chantier */
/** Phase 7 — Réception & Livraison */

export const DOCUMENT_PHASES: {
  id: DocumentPhaseId
  label: string
  emoji: string
  documents: DocumentTypeEntry[]
}[] = [
  {
    id: 'phase1',
    label: 'Prise de contact',
    emoji: '📋',
    documents: [
      { value: 'brief_client', label: 'Fiche de Premier Contact / Brief Client', description: 'Brief complet : client, bien, projet, budget, planning', route: '/documents/new/brief-client' },
      { value: 'first_contact', label: 'Fiche de Premier Contact', description: 'Premier rendez-vous, besoins et envies du client', route: '/documents-pro/create/first-contact' },
      { value: 'needs_assessment', label: 'Évaluation des Besoins', description: 'Questionnaire détaillé du projet', route: '/documents-pro/create/needs-assessment' },
      { value: 'initial_contact', label: 'Fiche Premier Contact (alternatif)', description: 'Fiche de premier contact', route: '/documents-pro/create/initial-contact' },
    ],
  },
  {
    id: 'phase2',
    label: 'Visite technique',
    emoji: '📐',
    documents: [
      { value: 'technical_visit', label: 'Compte-Rendu de Visite Technique', description: 'État des lieux complet du bien', route: '/documents-pro/create/technical-visit' },
      { value: 'measurements', label: 'Relevé de Mesures', description: 'Dimensions détaillées de chaque pièce', route: '/documents-pro/create/measurements' },
      { value: 'measurement_report', label: 'Relevé de Mesures (rapport)', description: 'Rapport de relevé', route: '/documents-pro/create/measurement-report' },
      { value: 'site_report', label: 'Rapport de Site', description: 'Diagnostic technique et contraintes', route: '/documents-pro/create/site-report' },
    ],
  },
  {
    id: 'phase3',
    label: 'Contractualisation',
    emoji: '📝',
    documents: [
      { value: 'mission_proposal', label: 'Proposition de Mission', description: 'Prestations et honoraires proposés', route: '/documents-pro/create/mission-proposal' },
      { value: 'design_contract', label: 'Contrat de Maîtrise d\'Œuvre', description: 'Contrat officiel client-architecte', route: '/documents-pro/create/design-contract' },
      { value: 'contrat_maitrise_oeuvre', label: 'Contrat de Maîtrise d\'Œuvre (complet)', description: 'Contrat 12 articles, annexes et signatures', route: '/documents/new/contrat' },
      { value: 'detailed_quote', label: 'Devis Détaillé', description: 'Devis multi-postes avec chiffrage', route: '/documents-pro/create/detailed-quote' },
    ],
  },
  {
    id: 'phase4',
    label: 'Conception',
    emoji: '🎨',
    documents: [
      { value: 'design_dossier', label: 'Dossier de Conception', description: 'Moodboards, plans, sélection matériaux', route: '/documents-pro/create/design-dossier' },
      { value: 'client_presentation', label: 'Fiche de Présentation Client', description: 'Support de présentation du projet', route: '/documents-pro/create/client-presentation' },
    ],
  },
  {
    id: 'phase5',
    label: 'Consultation & Préparation chantier',
    emoji: '🏗️',
    documents: [
      { value: 'cahier_charges_artisans', label: 'Cahier des Charges Artisans', description: 'Descriptif travaux pour demande de devis', route: '/documents/new/cahier-charges' },
      { value: 'quote_comparison', label: 'Comparatif Devis Artisans', description: 'Tableau comparatif des offres reçues', route: '/documents/new/comparatif-devis' },
      { value: 'work_order', label: 'Ordre de Service / Démarrage chantier', description: 'Notification de démarrage des travaux', route: '/documents/new/ordre-service' },
    ],
  },
  {
    id: 'phase6',
    label: 'Suivi de chantier',
    emoji: '👷',
    documents: [
      { value: 'site_meeting_report', label: 'Compte-Rendu de Réunion Chantier', description: 'PV de réunion hebdomadaire chantier', route: '/documents/new/compte-rendu-chantier' },
      { value: 'financial_tracking', label: 'Suivi Financier Chantier', description: 'Budget, engagé, facturé par lot', route: '/documents/new/suivi-financier' },
      { value: 'change_order', label: 'Fiche d\'Incident / Avenant', description: 'Modification ou imprévu en cours de chantier', route: '/documents-pro/create/change-order' },
    ],
  },
  {
    id: 'phase7',
    label: 'Réception & Livraison',
    emoji: '✅',
    documents: [
      { value: 'acceptance_report', label: 'PV de Réception des Travaux', description: 'Procès-verbal avec ou sans réserves', route: '/documents/new/pv-reception' },
      { value: 'defects_clearance', label: 'Fiche de Levée des Réserves', description: 'Suivi des reprises après réception', route: '/documents/new/levee-reserves' },
      { value: 'completion_certificate', label: 'Attestation de Fin de Travaux', description: 'Certificat de fin de chantier', route: '/documents/new/attestation-fin-travaux' },
      { value: 'as_built_dossier', label: 'Dossier des Ouvrages Exécutés (DOE)', description: 'Dossier technique remis au client', route: '/documents/new/doe' },
      { value: 'delivery_checklist', label: 'Livraison & Checklist Finale', description: 'Vérification complète avant remise des clés', route: '/documents-pro/create/delivery-checklist' },
    ],
  },
]

/** Map document_type -> route pour édition */
export const ROUTES_BY_TYPE: Record<string, string> = {
  brief_client: '/documents/new/brief-client',
  initial_contact: '/documents-pro/create/first-contact',
  first_contact: '/documents-pro/create/first-contact',
  needs_questionnaire: '/documents-pro/create/needs-assessment',
  needs_assessment: '/documents-pro/create/needs-assessment',
  technical_visit: '/documents-pro/create/technical-visit',
  measurements: '/documents-pro/create/measurements',
  measurement_report: '/documents-pro/create/measurement-report',
  site_report: '/documents-pro/create/site-report',
  mission_proposal: '/documents-pro/create/mission-proposal',
  design_contract: '/documents-pro/create/design-contract',
  quotation: '/documents-pro/create/detailed-quote',
  detailed_quote: '/documents-pro/create/detailed-quote',
  delivery_checklist: '/documents-pro/create/delivery-checklist',
  design_dossier: '/documents-pro/create/design-dossier',
  client_presentation: '/documents-pro/create/client-presentation',
  contractor_specs: '/documents-pro/create/contractor-specs',
  quote_comparison: '/documents/new/comparatif-devis',
  work_order: '/documents/new/ordre-service',
  ordre_service: '/documents/new/ordre-service',
  site_meeting_report: '/documents/new/compte-rendu-chantier',
  compte_rendu_reunion_chantier: '/documents/new/compte-rendu-chantier',
  financial_tracking: '/documents/new/suivi-financier',
  suivi_financier_chantier: '/documents/new/suivi-financier',
  change_order: '/documents-pro/create/change-order',
  acceptance_report: '/documents/new/pv-reception',
  pv_reception_travaux: '/documents/new/pv-reception',
  defects_clearance: '/documents/new/levee-reserves',
  levee_reserves: '/documents/new/levee-reserves',
  completion_certificate: '/documents/new/attestation-fin-travaux',
  attestation_fin_travaux: '/documents/new/attestation-fin-travaux',
  as_built_dossier: '/documents/new/doe',
  doe: '/documents/new/doe',
  cahier_charges_artisans: '/documents/new/cahier-charges',
  contrat_maitrise_oeuvre: '/documents/new/contrat',
}

export function getDocumentLabel(type: string): string {
  for (const phase of DOCUMENT_PHASES) {
    const doc = phase.documents.find((d) => d.value === type)
    if (doc) return doc.label
  }
  return type.replace(/_/g, ' ')
}

export function getPhaseForType(type: string): DocumentPhaseId | '' {
  for (const phase of DOCUMENT_PHASES) {
    if (phase.documents.some((d) => d.value === type)) return phase.id
  }
  return ''
}

export function getAllDocumentTypes(): DocumentTypeEntry[] {
  return DOCUMENT_PHASES.flatMap((p) => p.documents)
}
