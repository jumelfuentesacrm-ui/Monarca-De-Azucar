import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { subscription, user_id } = req.body
    if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription required' })

    // Upsert by endpoint stored inside the jsonb column
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .filter('subscription->>endpoint', 'eq', subscription.endpoint)

    let error
    if (existing?.length > 0) {
      ;({ error } = await supabase
        .from('push_subscriptions')
        .update({ subscription, user_id: user_id || null })
        .filter('subscription->>endpoint', 'eq', subscription.endpoint))
    } else {
      ;({ error } = await supabase
        .from('push_subscriptions')
        .insert({ subscription, user_id: user_id || null }))
    }

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' })
    await supabase.from('push_subscriptions').delete().filter('subscription->>endpoint', 'eq', endpoint)
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
