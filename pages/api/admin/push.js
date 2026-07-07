import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  // Save admin subscription (admin.js sends the full PushSubscription JSON as body)
  if (req.method === 'POST' && req.query.action === 'subscribe') {
    const { endpoint, keys } = req.body
    if (!endpoint || !keys) return res.status(400).json({ error: 'Invalid subscription' })
    const subscription = { endpoint, keys }

    const { data: existing } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id')
      .filter('subscription->>endpoint', 'eq', endpoint)

    if (existing?.length > 0) {
      await supabaseAdmin.from('push_subscriptions')
        .update({ subscription })
        .filter('subscription->>endpoint', 'eq', endpoint)
    } else {
      await supabaseAdmin.from('push_subscriptions').insert({ subscription })
    }
    return res.status(200).json({ success: true })
  }

  // Send notification to all admin subscribers (user_id IS NULL)
  if (req.method === 'POST' && req.query.action === 'send') {
    const { title, body, url } = req.body
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .is('user_id', null)
    if (!subs?.length) return res.status(200).json({ sent: 0 })

    let sent = 0
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.subscription.endpoint,
            keys: { p256dh: sub.subscription.keys.p256dh, auth: sub.subscription.keys.auth }
          },
          JSON.stringify({ title, body, url: url || '/admin' })
        )
        sent++
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabaseAdmin.from('push_subscriptions').delete().filter('subscription->>endpoint', 'eq', sub.subscription.endpoint)
        }
      }
    }
    return res.status(200).json({ sent })
  }

  // Unsubscribe admin device
  if (req.method === 'DELETE') {
    const { endpoint } = req.body
    await supabaseAdmin.from('push_subscriptions').delete().filter('subscription->>endpoint', 'eq', endpoint)
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
