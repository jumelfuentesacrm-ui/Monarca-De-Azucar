import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { user_id } = req.query
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' })

  const { data: card, error } = await supabaseAdmin
    .from('loyalty_cards')
    .select('*, stamp_history(id,payment_amount,created_at), rewards(id,reward_type,reward_cost,status,redeemed_at,created_at)')
    .eq('user_id', user_id)
    .single()

  if (error) return res.status(404).json({ error: error.message })
  return res.status(200).json({ card })
}
