import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/** Extrait le "ref" du projet depuis l'URL Supabase (ex: ihkblyjtspanwkeacftp). */
function getProjectRefFromUrl(supabaseUrl: string): string | null {
  try {
    const u = new URL(supabaseUrl)
    return u.hostname.replace('.supabase.co', '') || null
  } catch {
    return null
  }
}

/** Extrait le "ref" du projet depuis le JWT (payload.ref). */
function getProjectRefFromServiceKey(serviceKey: string): string | null {
  try {
    const parts = serviceKey.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return (payload.ref as string) || null
  } catch {
    return null
  }
}

/**
 * Crée le premier compte Admin (quand aucun admin n'existe).
 * Utilise SUPABASE_SERVICE_ROLE_KEY pour bypass RLS.
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

    const urlRef = getProjectRefFromUrl(url)
    const keyRef = getProjectRefFromServiceKey(serviceKey)
    if (urlRef && keyRef && urlRef !== keyRef) {
      return NextResponse.json(
        {
          error: `La clé service_role ne correspond pas au projet. Votre URL pointe vers le projet "${urlRef}", mais la clé est pour le projet "${keyRef}". Dans Supabase Dashboard, ouvrez le projet ${urlRef} (${url}), allez dans Settings > API et copiez la clé "service_role" de ce projet dans .env (SUPABASE_SERVICE_ROLE_KEY).`,
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, password, first_name, last_name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    // Vérifier s'il existe déjà un admin
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (admins && admins.length > 0) {
      return NextResponse.json(
        { error: 'Un administrateur existe déjà. Utilisez la page de connexion.' },
        { status: 403 }
      )
    }

    // Créer l'utilisateur dans Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0],
        role: 'admin',
      },
    })

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé. Connectez-vous ou réinitialisez le mot de passe.' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Échec de création du compte' }, { status: 500 })
    }

    // Récupérer ou créer la première entreprise
    let { data: company } = await supabase.from('companies').select('id').limit(1).single()
    if (!company) {
      const { data: newCompany, error: companyErr } = await supabase
        .from('companies')
        .insert({
          name: 'INDESIGN PLUS PRO',
          email: email,
          primary_color: '#C5A572',
        })
        .select('id')
        .single()
      if (companyErr || !newCompany) {
        return NextResponse.json({ error: 'Impossible de créer l\'entreprise' }, { status: 500 })
      }
      company = newCompany
    }

    // Créer le profil admin
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: authData.user.id,
        company_id: company.id,
        first_name: first_name?.trim() || 'Admin',
        last_name: last_name?.trim() || '',
        email: email.trim(),
        role: 'admin',
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      return NextResponse.json(
        { error: 'Profil créé, mais erreur: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Compte admin créé. Vous pouvez maintenant vous connecter.',
    })
  } catch (e) {
    console.error('[setup-first-admin]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
