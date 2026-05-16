import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const { catalog_item_id } = req.query
    const query = supabase.from('recipe_ingredients').select('*, supplies(id, name, base_unit, cost_per_unit)')
    if (catalog_item_id) query.eq('catalog_item_id', catalog_item_id)
    const { data } = await query
    return res.status(200).json({ ingredients: data || [] })
  }

  if (req.method === 'POST') {
    const { catalog_item_id, supply_id, quantity, unit } = req.body
    const { data, error } = await supabase.from('recipe_ingredients').insert({ catalog_item_id, supply_id, quantity, unit }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ingredient: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    await supabase.from('recipe_ingredients').delete().eq('id', id)
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
