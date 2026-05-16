import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const { data: messages } = await supabase
      .from('messages')
      .select('*, profiles(full_name, business_name)')
      .order('created_at', { ascending: true })
    return res.status(200).json({ messages: messages || [] })
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

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
