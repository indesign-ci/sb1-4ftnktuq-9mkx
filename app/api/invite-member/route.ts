import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Invite un membre par email (envoi d’un lien d’invitation par Supabase).
 * Utilise SUPABASE_SERVICE_ROLE_KEY côté serveur.
 * Le corps doit contenir { email, role }. Le company_id est dérivé du token de l’appelant.
 */
export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuration manquante (SUPABASE_SERVICE_ROLE_KEY ou clés Supabase)' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return NextResponse.json(
        { error: 'Non autorisé. Connexion requise.' },
        { status: 401 }
      )
    }

    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Session invalide ou expirée.' },
        { status: 401 }
      )
    }

    const { data: profile } = await anonClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    const companyId = profile?.company_id
    if (!companyId) {
      return NextResponse.json(
        { error: 'Votre compte n\'est pas associé à une entreprise.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role } = body
    const emailTrim = typeof email === 'string' ? email.trim() : ''
    const roleValue = typeof role === 'string' ? role : 'user'

    if (!emailTrim) {
      return NextResponse.json(
        { error: 'Email requis.' },
        { status: 400 }
      )
    }

    const serviceClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(emailTrim, {
      data: {
        company_id: companyId,
        role: roleValue,
      },
      redirectTo: `${request.headers.get('origin') || url.replace('.supabase.co', '.vercel.app')}/login`,
    })

    if (inviteError) {
      const msg = inviteError.message || ''
      if (msg.includes('already been registered') || msg.includes('already exists')) {
        return NextResponse.json(
          { error: 'Un compte existe déjà pour cet email. L’utilisateur peut se connecter directement.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: msg || 'Échec de l’envoi de l’invitation' },
        { status: 400 }
      )
    }

    if (inviteData?.user?.id) {
      await serviceClient.from('profiles').upsert(
        {
          id: inviteData.user.id,
          company_id: companyId,
          role: roleValue,
          email: emailTrim,
          first_name: inviteData.user.user_metadata?.first_name ?? null,
          last_name: inviteData.user.user_metadata?.last_name ?? null,
        },
        { onConflict: 'id' }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation envoyée. L’invité recevra un email avec un lien pour rejoindre l’équipe.',
    })
  } catch (e) {
    console.error('[invite-member]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
