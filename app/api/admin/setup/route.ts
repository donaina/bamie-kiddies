// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()

    // ── Guard: lock if any admin already exists ────────────────
    const { count } = await supabase
      .from('admin_users')
      .select('id', { count: 'exact', head: true })

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Setup already complete. An admin account already exists.' },
        { status: 403 }
      )
    }

    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    // ── Create Supabase Auth user ──────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? 'Failed to create auth user.' },
        { status: 400 }
      )
    }

    // ── Insert into admin_users ────────────────────────────────
    const { error: insertError } = await supabase.from('admin_users').insert({
      id:        authData.user.id,
      email,
      full_name: name,
      role:      'super_admin',
      is_active: true,
    })

    if (insertError) {
      // Roll back the auth user if admin_users insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create admin record.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// Check if setup is needed (used by the setup page on load)
export async function GET() {
  try {
    const supabase = createServiceClient()
    const { count } = await supabase
      .from('admin_users')
      .select('id', { count: 'exact', head: true })

    return NextResponse.json({ setupNeeded: !count || count === 0 })
  } catch {
    return NextResponse.json({ setupNeeded: true })
  }
}
