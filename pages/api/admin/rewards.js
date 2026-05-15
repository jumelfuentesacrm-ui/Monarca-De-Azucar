import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'GET') {
    const { data: rewards } = await supabaseAdmin.from('rewards')
      .select('*, profiles(full_name,business_name), loyalty_cards(card_number)')
      .order('redeemed_at', { ascending: false })
    return res.status(200).json({ rewards })
  }
  if (req.method === 'POST') {
    const { card_id, user_id, reward_type, reward_cost, notes } = req.body
    const { data: reward, error } = await supabaseAdmin.from('rewards')
      .insert({ card_id, user_id, reward_type, reward_cost, notes, status: 'Canjeado' }).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ reward })
  }
  if (req.method === 'DELETE') {
    const { id } = req.body
    await supabaseAdmin.from('rewards').delete().eq('id', id)
    return res.status(200).json({ success: true })
  }
  res.status(405).end()
}
