import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:jumelifuentes@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { title, body, url } = req.body
  if (!title || !body) return res.status(400).json({ error: 'title and body required' })

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')

  if (error) return res.status(500).json({ error: error.message })
  if (!subs?.length) return res.status(200).json({ sent: 0, total: 0 })

  const payload = JSON.stringify({ title, body, url: url || '/card' })
  const stale = []

  const results = await Promise.allSettled(
    subs.map(({ id, endpoint, p256dh, auth }) => {
      const subscription = { endpoint, keys: { p256dh, auth } }
      return webpush.sendNotification(subscription, payload).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) stale.push(id)
        throw err
      })
    })
  )

  if (stale.length) {
    await supabase.from('push_subscriptions').delete().in('id', stale)
  }

  const sent = results.filter(r => r.status === 'fulfilled').length
  return res.status(200).json({ sent, total: subs.length, stale: stale.length })
}
