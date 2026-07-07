import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { title, body, url, user_ids } = req.body
  if (!title || !body) return res.status(400).json({ error: 'title y body requeridos' })
  if (!user_ids?.length) return res.status(400).json({ error: 'Selecciona al menos un cliente' })

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .not('user_id', 'is', null)
    .in('user_id', user_ids)

  if (error) return res.status(500).json({ error: error.message })
  if (!subs?.length) return res.status(200).json({ sent: 0, failed: 0, total: 0 })

  const payload = JSON.stringify({ title, body, url: url || '/card' })
  const now = new Date().toISOString()

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        {
          endpoint: sub.subscription.endpoint,
          keys: { p256dh: sub.subscription.keys.p256dh, auth: sub.subscription.keys.auth }
        },
        payload
      ).then(() => {
        supabase.from('push_subscriptions').update({ last_notif_sent_at: now }).eq('id', sub.id)
      }).catch(async err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        throw err
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  return res.status(200).json({ sent, failed, total: subs.length })
}
