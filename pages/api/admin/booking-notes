import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { event_id } = req.query
    if (!event_id) return res.status(400).json({ error: 'event_id required' })
    const { data } = await supabaseAdmin
      .from('booking_notes')
      .select('notes')
      .eq('event_id', event_id)
      .single()
    return res.status(200).json({ notes: data?.notes || '' })
  }

  if (req.method === 'POST') {
    const { event_id, notes } = req.body
    if (!event_id) return res.status(400).json({ error: 'event_id required' })
    const { error } = await supabaseAdmin
      .from('booking_notes')
      .upsert({ event_id, notes, updated_at: new Date().toISOString() }, { onConflict: 'event_id' })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
