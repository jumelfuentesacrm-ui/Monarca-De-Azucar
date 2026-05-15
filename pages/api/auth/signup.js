import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, full_name, business_name, phone } = req.body
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name } } })
  if (error) return res.status(400).json({ error: error.message })
  await supabase.from('profiles').update({ full_name, business_name, phone }).eq('id', data.user.id)
  return res.status(200).json({ success: true })
}
