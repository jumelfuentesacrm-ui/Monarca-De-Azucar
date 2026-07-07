import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    // Enrich with profile data
    const userIds = [...new Set((messages||[]).map(m => m.user_id))]
    let profileMap = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, business_name')
        .in('id', userIds)
      ;(profiles||[]).forEach(p => { profileMap[p.id] = p })
    }

    const enriched = (messages||[]).map(m => ({
      ...m,
      profiles: profileMap[m.user_id] || null
    }))

    return res.status(200).json({ messages: enriched })
  }

  if (req.method === 'POST') {
    const { user_id, content } = req.body
    if (!user_id || !content?.trim()) return res.status(400).json({ error: 'user_id and content required' })
    const { data: message, error } = await supabase
      .from('messages')
      .insert({ user_id, sender: 'admin', content: content.trim() })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ message })
  }

  if (req.method === 'PATCH') {
    const { user_id } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id required' })
    await supabase.from('messages').update({ read: true }).eq('user_id', user_id).eq('sender', 'client').eq('read', false)
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
