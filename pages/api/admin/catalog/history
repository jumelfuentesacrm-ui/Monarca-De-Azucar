import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { product_id } = req.query
    if (!product_id) return res.status(400).json({ error: 'product_id required' })
    const { data, error } = await supabase
      .from('catalog_cost_history')
      .select('*')
      .eq('product_id', product_id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ history: data || [] })
  }
  res.status(405).end()
}
