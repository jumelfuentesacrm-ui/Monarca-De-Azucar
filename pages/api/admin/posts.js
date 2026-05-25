import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ posts: data })
  }

  if (req.method === 'POST') {
    const { title, body, image_url, published } = req.body
    if (!title) return res.status(400).json({ error: 'title requerido' })
    const { data, error } = await supabase
      .from('posts')
      .insert({ title, body, image_url, published: published !== false })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ post: data })
  }

  if (req.method === 'PATCH') {
    const { id, title, body, image_url, published } = req.body
    if (!id) return res.status(400).json({ error: 'id requerido' })
    const updates = {}
    if (title !== undefined) updates.title = title
    if (body !== undefined) updates.body = body
    if (image_url !== undefined) updates.image_url = image_url
    if (published !== undefined) updates.published = published
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ post: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id requerido' })
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
