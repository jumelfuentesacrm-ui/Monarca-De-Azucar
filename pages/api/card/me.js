import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No token' })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid token' })
  const { data: card } = await supabase.from('loyalty_cards').select('*, profiles(full_name,phone), stamp_history(id,payment_amount,created_at), rewards(id,reward_type,status,redeemed_at,created_at)').eq('user_id', user.id).single()
  return res.status(200).json({ card: card || null })
}
