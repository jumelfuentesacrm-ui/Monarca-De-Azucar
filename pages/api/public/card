import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { card_number } = req.query
  if (!card_number) return res.status(400).json({ error: 'card_number requerido' })

  const { data: card, error } = await supabaseAdmin
    .from('loyalty_cards')
    .select('*, profiles(full_name, business_name), stamp_history(id,payment_amount,created_at), rewards(id,reward_type,status)')
    .eq('card_number', card_number)
    .single()

  if (error) return res.status(404).json({ error: 'Tarjeta no encontrada' })
  return res.status(200).json({ card })
}
