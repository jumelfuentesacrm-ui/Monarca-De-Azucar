import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (req.query.me === '1') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) return res.status(401).json({ role: 'client' })
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
      if (authErr || !user) return res.status(401).json({ role: 'client' })
      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
      return res.status(200).json({ role: profile?.role || 'client' })
    }
    const all = req.query.all === '1'

    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, business_name, phone, role, created_at')
      .order('created_at', { ascending: false })

    // If not fetching all, only return clients
    if (!all) query = query.eq('role', 'client')

    const { data: profiles, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    // Get emails + last_sign_in_at from auth.users
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const authMap = {}
    authList?.users?.forEach(u => {
      authMap[u.id] = { email: u.email, last_sign_in_at: u.last_sign_in_at }
    })

    const users = (profiles || []).map(p => ({
      ...p,
      email: authMap[p.id]?.email || null,
      last_sign_in_at: authMap[p.id]?.last_sign_in_at || null,
    }))

    return res.status(200).json({ users })
  }

  if (req.method === 'POST') {
    const { email, password, full_name, business_name, phone } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' })

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name }
    })
    if (authError) return res.status(400).json({ error: authError.message })

    await supabaseAdmin.from('profiles')
      .update({ full_name, business_name, phone, role: 'client' })
      .eq('id', authData.user.id)

    return res.status(200).json({ success: true, user: authData.user })
  }

  if (req.method === 'PATCH') {
    const { id, full_name, business_name, phone, email, password, role } = req.body

    // Build profile update object
    const profileUpdate = {}
    if (full_name !== undefined) profileUpdate.full_name = full_name
    if (business_name !== undefined) profileUpdate.business_name = business_name
    if (phone !== undefined) profileUpdate.phone = phone
    if (role !== undefined) profileUpdate.role = role

    if (Object.keys(profileUpdate).length > 0) {
      await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', id)
    }

    if (email) {
      await supabaseAdmin.auth.admin.updateUserById(id, { email })
    }

    if (password && password.length >= 6) {
      await supabaseAdmin.auth.admin.updateUserById(id, { password })
    }

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    await supabaseAdmin.auth.admin.deleteUser(id)
    await supabaseAdmin.from('profiles').delete().eq('id', id)
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
