import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { subscription, user_id } = req.body
    if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription required' })
    const { endpoint, keys: { p256dh, auth } } = subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ endpoint, p256dh, auth, user_id: user_id || null }, { onConflict: 'endpoint' })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' })
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
