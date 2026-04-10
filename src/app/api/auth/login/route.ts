import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { error: 'Email y contrasena son requeridos' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: users, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return Response.json(
        { error: 'Credenciales invalidas' },
        { status: 401 }
      )
    }

    const user = users[0]
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return Response.json(
        { error: 'Credenciales invalidas' },
        { status: 401 }
      )
    }

    // Simple token: base64-encoded JSON with expiry (24 hours)
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }
    const token = btoa(JSON.stringify(tokenPayload))

    return Response.json({
      token,
      user: { id: user.id, email: user.email },
    })
  } catch {
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
