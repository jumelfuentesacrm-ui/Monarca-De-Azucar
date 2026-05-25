import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { subscription, user_id } = req.body
    if (!subscription) return res.status(400).json({ error: 'subscription required' })

    const endpoint = subscription.endpoint

    // Upsert by endpoint so re-subscribing updates keys
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ subscription, user_id: user_id || null, endpoint }, { onConflict: 'endpoint', ignoreDuplicates: false })

    if (error) {
      // If endpoint column doesn't exist yet, insert without upsert
      const { error: e2 } = await supabase
        .from('push_subscriptions')
        .insert({ subscription, user_id: user_id || null })
      if (e2) return res.status(500).json({ error: e2.message })
    }

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body
    if (endpoint) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('subscription->>endpoint', endpoint)
    }
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
