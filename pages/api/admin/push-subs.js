import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function computeStatus(stamps, lastStampAt) {
  const days = lastStampAt ? (Date.now() - new Date(lastStampAt)) / (1000 * 60 * 60 * 24) : null
  if (days !== null) {
    if (days >= 60) return 'Perdido'
    if (days >= 30) return 'Inactivo'
  }
  if (stamps >= 15) return 'VIP'
  if (stamps >= 10) return 'Regular'
  if (stamps >= 5) return 'Activo'
  return 'Nuevo'
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') return res.status(405).end()

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, last_notif_sent_at, created_at')
    .not('user_id', 'is', null)

  if (error) return res.status(500).json({ error: error.message })
  if (!subs?.length) return res.status(200).json({ clients: [] })

  const userIds = [...new Set(subs.map(s => s.user_id))]

  const [{ data: profiles }, { data: cards }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, business_name').in('id', userIds),
    supabase.from('loyalty_cards').select('id, user_id, stamps, stamp_history(created_at)').in('user_id', userIds),
  ])

  const profileMap = {}
  ;(profiles || []).forEach(p => { profileMap[p.id] = p })

  const cardMap = {}
  ;(cards || []).forEach(c => { cardMap[c.user_id] = c })

  // One entry per user_id (most recent subscription wins)
  const byUser = {}
  for (const sub of subs) {
    if (!byUser[sub.user_id] || new Date(sub.created_at) > new Date(byUser[sub.user_id].created_at)) {
      byUser[sub.user_id] = sub
    }
  }

  const clients = Object.values(byUser).map(sub => {
    const profile = profileMap[sub.user_id] || {}
    const card = cardMap[sub.user_id]
    const stamps = card?.stamps || 0
    const history = card?.stamp_history || []
    const lastStamp = history.length > 0
      ? [...history].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at
      : null
    return {
      user_id: sub.user_id,
      name: profile.full_name || profile.business_name || 'Sin nombre',
      stamps,
      status: computeStatus(stamps, lastStamp),
      last_notif_sent_at: sub.last_notif_sent_at || null,
    }
  }).sort((a, b) => a.name.localeCompare(b.name))

  return res.status(200).json({ clients })
}
