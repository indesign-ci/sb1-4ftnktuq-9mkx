import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Crée un utilisateur directement (sans email d'invitation).
 * Réservé aux admins ; le nouvel utilisateur est rattaché à la même entreprise.
 * Corps : { email, password, role?, first_name?, last_name? }
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
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    const companyId = profile?.company_id
    if (!companyId) {
      return NextResponse.json(
        { error: 'Votre compte n\'est pas associé à une entreprise.' },
        { status: 403 }
      )
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Seul un administrateur peut créer des utilisateurs.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const emailTrim = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const role = typeof body.role === 'string' ? body.role : 'user'
    const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : null
    const lastName = typeof body.last_name === 'string' ? body.last_name.trim() : null

    if (!emailTrim) {
      return NextResponse.json(
        { error: 'Email requis.' },
        { status: 400 }
      )
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      )
    }

    const serviceClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
      email: emailTrim,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: [firstName, lastName].filter(Boolean).join(' ') || emailTrim.split('@')[0],
        role,
      },
    })

    if (createError) {
      const msg = createError.message || ''
      if (msg.includes('already been registered') || msg.includes('already exists')) {
        return NextResponse.json(
          { error: 'Un compte existe déjà pour cet email. Utilisez "Inviter un membre" ou demandez à la personne de se connecter.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: msg || 'Échec de la création du compte' },
        { status: 400 }
      )
    }

    if (createData?.user?.id) {
      await serviceClient.from('profiles').upsert(
        {
          id: createData.user.id,
          company_id: companyId,
          role,
          email: emailTrim,
          first_name: firstName,
          last_name: lastName,
        },
        { onConflict: 'id' }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé. Il peut se connecter avec cet email et le mot de passe défini.',
    })
  } catch (e) {
    console.error('[create-member]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
