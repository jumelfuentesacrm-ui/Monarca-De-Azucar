import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, full_name, phone } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos.' })

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone }
  })

  if (error) return res.status(400).json({ error: error.message })

  await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    full_name,
    phone,
    role: 'client'
  })

  return res.status(200).json({ success: true, user: data.user })
}
