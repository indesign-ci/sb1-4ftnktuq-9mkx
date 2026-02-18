import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT_MOODBOARD = `
Tu es un expert en architecture d'intérieur haut de gamme.
Tu génères des moodboards textuels très détaillés pour des projets réels.

Réponds en français, sous la forme :
- Vision globale
- Ambiance & storytelling
- Palette de couleurs
- Matériaux & textures
- Mobilier & pièces fortes
- Éclairage
- Détails décoratifs
- Recommandations par pièce (si pertinent)

Sois concret, exploitable, et adapté au budget indiqué.
`.trim()

type ProjectData = {
  typeBien?: string
  surface?: number
  ville?: string
  pays?: string
  styles?: string[]
  couleurs?: string
  budget?: number
  devise?: string
  pieces?: string[]
  clientName?: string
  contraintes?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const projectData: ProjectData = body?.projectData ?? body ?? {}

    const {
      typeBien = 'Non précisé',
      surface,
      ville = 'Non précisée',
      pays = '',
      styles = [],
      couleurs = 'Non précisées',
      budget,
      devise = '€',
      pieces = [],
      clientName = 'Client',
      contraintes = 'Aucune contrainte particulière',
    } = projectData

    const surfaceText = surface ? `${surface} m²` : 'Surface non précisée'
    const budgetText = budget ? `${budget} ${devise}` : 'Budget non précisé'
    const stylesText = styles.length ? styles.join(', ') : 'Style à définir'
    const piecesText = pieces.length ? pieces.join(', ') : 'Pièces non précisées'

    const prompt = `
${SYSTEM_PROMPT_MOODBOARD}

# DONNÉES DU PROJET
Type de bien : ${typeBien}
Surface : ${surfaceText}
Localisation : ${ville}${pays ? ', ' + pays : ''}
Style : ${stylesText}
Couleurs : ${couleurs}
Budget : ${budgetText}
Pièces : ${piecesText}
Client : ${clientName}
Contraintes : ${contraintes}
`.trim()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY manquant dans les variables d’environnement' },
        { status: 500 }
      )
    }

    const model =
      process.env.ANTHROPIC_MOODBOARD_MODEL || 'claude-3-5-sonnet-20241022'

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json(
        { error: 'Erreur API Anthropic', details: errorText },
        { status: 500 }
      )
    }

    const data = await res.json()
    const content = data?.content?.[0]
    const text =
      content && content.type === 'text'
        ? content.text
        : JSON.stringify(data?.content ?? data)

    return NextResponse.json({ moodboard: text })
  } catch (error) {
    console.error('Erreur génération moodboard:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération du moodboard' },
      { status: 500 }
    )
  }
}

