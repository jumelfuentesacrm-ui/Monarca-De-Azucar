import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).end()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return res.status(401).end()

  const { data: profile } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      role: 'client'
    })
    return res.status(200).json({ role: 'client' })
  }
  return res.status(200).json({ role: profile.role })
}
