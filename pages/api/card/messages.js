import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No token' })
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' })

  if (req.method === 'GET') {
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    return res.status(200).json({ messages: messages || [] })
  }

  if (req.method === 'POST') {
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'content required' })
    const { data: message, error } = await supabase
      .from('messages')
      .insert({ user_id: user.id, sender: 'client', content: content.trim() })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ message })
  }

  res.status(405).end()
}
