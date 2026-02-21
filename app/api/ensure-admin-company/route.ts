import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Attribue la première entreprise (company) au profil de l'utilisateur si :
 * - le profil est admin (ou a le rôle fourni) et company_id est null.
 * Utilise SUPABASE_SERVICE_ROLE_KEY pour mettre à jour le profil.
 * À appeler depuis le client avec l'id utilisateur courant pour que les listes (projets, etc.) s'affichent.
 */
export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuration manquante (SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const userId = body?.user_id ?? (body?.userId as string)

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'user_id requis' },
        { status: 400 }
      )
    }

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, company_id, role')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      )
    }

    if (profile.company_id) {
      return NextResponse.json({
        success: true,
        message: 'Profil déjà associé à une entreprise',
        company_id: profile.company_id,
      })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (!company) {
      return NextResponse.json(
        { error: 'Aucune entreprise en base. Créez-en une d\'abord.' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ company_id: company.id })
      .eq('id', userId)

    if (updateError) {
      console.error('[ensure-admin-company]', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Entreprise associée au profil.',
      company_id: company.id,
    })
  } catch (e) {
    console.error('[ensure-admin-company]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
