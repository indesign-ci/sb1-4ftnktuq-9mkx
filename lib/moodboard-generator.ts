// lib/moodboard-generator.ts

const styleDescriptions: Record<string, string> = {
  contemporain: "Les lignes épurées et les volumes ouverts créent une atmosphère résolument contemporaine",
  minimaliste: "L'approche minimaliste privilégie l'essentiel, chaque élément est choisi avec intention",
  industriel: "L'esprit industriel se traduit par des matériaux bruts et des structures apparentes",
  scandinave: "L'influence scandinave apporte chaleur et luminosité grâce aux matériaux naturels",
  "art déco": "Les codes Art Déco insufflent une élégance géométrique et des touches de luxe",
  bohème: "L'univers bohème mêle textures, motifs et pièces chinées pour un intérieur vivant",
  classique: "Le style classique s'exprime à travers des proportions harmonieuses et des matériaux nobles",
  japandi: "La fusion japandi marie la sobriété japonaise à la chaleur scandinave",
  méditerranéen: "L'esprit méditerranéen évoque la douceur de vivre avec des teintes chaudes et des matières naturelles",
  rustique: "Le charme rustique repose sur le bois, la pierre et les finitions authentiques",
  tropical: "L'ambiance tropicale fait entrer la végétation luxuriante et les teintes vives",
  vintage: "L'esprit vintage convoque des pièces iconiques et une nostalgie assumée",
}

const pieceDescriptions: Record<string, string> = {
  salon: "Le salon devient un espace de vie central, pensé pour le confort et la convivialité",
  "salle à manger": "La salle à manger invite au partage avec une table comme pièce maîtresse",
  cuisine: "La cuisine allie fonctionnalité et esthétique pour un usage quotidien agréable",
  chambre: "La chambre est conçue comme un cocon propice au repos et à la sérénité",
  "salle de bain": "La salle de bain se transforme en espace bien-être aux finitions soignées",
  bureau: "Le bureau offre un cadre de travail inspirant et organisé",
  entrée: "L'entrée donne le ton de l'intérieur dès le premier regard",
  terrasse: "La terrasse prolonge l'espace de vie vers l'extérieur",
  dressing: "Le dressing optimise le rangement tout en restant visuellement agréable",
  buanderie: "La buanderie est pensée pour être pratique sans sacrifier l'esthétique",
}

const budgetPhrases = {
  low: "Le projet mise sur des choix malins et des pièces accessibles pour un résultat maximal avec un budget maîtrisé.",
  medium: "Le budget permet un bel équilibre entre pièces d'investissement et éléments décoratifs soigneusement sélectionnés.",
  high: "Le budget généreux autorise des matériaux haut de gamme, du mobilier de créateur et des finitions sur mesure.",
}

const colorMoods: Record<string, string> = {
  // Tons neutres / clairs
  blanc: "clarté et pureté",
  beige: "douceur et chaleur naturelle",
  gris: "sophistication et neutralité",
  crème: "élégance douce",
  taupe: "raffinement discret",
  // Tons chauds
  rouge: "énergie et passion",
  orange: "vitalité et dynamisme",
  jaune: "luminosité et optimisme",
  terracotta: "ancrage et chaleur terreuse",
  ocre: "authenticité et profondeur",
  rose: "délicatesse et modernité",
  // Tons froids
  bleu: "sérénité et profondeur",
  vert: "fraîcheur et connexion à la nature",
  violet: "créativité et mystère",
  // Tons sombres
  noir: "audace et élégance radicale",
  "bleu marine": "caractère et intemporalité",
  "vert forêt": "richesse et enveloppement",
}

function getColorMood(colors: string[]): string {
  const moods = colors
    .map((c) => {
      const key = c.toLowerCase().trim()
      return colorMoods[key]
    })
    .filter(Boolean)

  if (moods.length === 0) return ""
  if (moods.length === 1) return `La palette choisie évoque ${moods[0]}.`
  return `La palette mêle ${moods.slice(0, -1).join(", ")} et ${moods[moods.length - 1]}.`
}

function getBudgetPhrase(budget: number | undefined, devise: string = "€"): string {
  if (!budget) return ""
  if (budget < 10000) return budgetPhrases.low
  if (budget < 50000) return budgetPhrases.medium
  return budgetPhrases.high
}

function getSurfacePhrase(surface: number | undefined): string {
  if (!surface) return ""
  if (surface < 30) return `Sur ${surface} m², chaque centimètre est optimisé avec intelligence.`
  if (surface < 80) return `Les ${surface} m² sont exploités pour offrir fluidité et fonctionnalité.`
  return `Avec ${surface} m² disponibles, l'espace permet une mise en scène généreuse et aérée.`
}

// ─── Fonction principale ────────────────────────────────────

export interface MoodboardInput {
  name?: string
  styles?: string[]
  pieces?: string[]
  colors?: string[]       // noms de couleurs : ["Beige", "Bleu marine"]
  surface?: number
  budget?: number
  devise?: string
  typeBien?: string
  contraintes?: string
  clientName?: string
}

export function generateMoodboardDescription(input: MoodboardInput): string {
  const sections: string[] = []

  // --- Intro
  const type = input.typeBien || input.name || "cet intérieur"
  sections.push(
    `Ce moodboard définit la direction artistique pour ${type}.`
  )

  // --- Surface
  if (input.surface) {
    sections.push(getSurfacePhrase(input.surface))
  }

  // --- Styles
  if (input.styles && input.styles.length > 0) {
    const styleTexts = input.styles
      .map((s) => styleDescriptions[s.toLowerCase()])
      .filter(Boolean)
    if (styleTexts.length > 0) {
      sections.push(styleTexts.join(". ") + ".")
    }
  }

  // --- Pièces
  if (input.pieces && input.pieces.length > 0) {
    const pieceTexts = input.pieces
      .map((p) => pieceDescriptions[p.toLowerCase()])
      .filter(Boolean)
    if (pieceTexts.length > 0) {
      sections.push(pieceTexts.join(". ") + ".")
    }
  }

  // --- Couleurs
  if (input.colors && input.colors.length > 0) {
    const colorPhrase = getColorMood(input.colors)
    if (colorPhrase) sections.push(colorPhrase)
  }

  // --- Budget
  if (input.budget) {
    sections.push(getBudgetPhrase(input.budget, input.devise))
  }

  // --- Contraintes
  if (input.contraintes) {
    sections.push(
      `Points d'attention : ${input.contraintes}.`
    )
  }

  // --- Conclusion
  sections.push(
    "L'ensemble vise à créer un espace cohérent, fonctionnel et esthétiquement abouti, fidèle à la vision du projet."
  )

  return sections.filter(Boolean).join("\n\n")
}
