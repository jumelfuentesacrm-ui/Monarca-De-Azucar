import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data: items, error } = await supabase
      .from('catalog_items')
      .select(`
        id, name, description, active, created_at, updated_at,
        catalog_prices ( id, amount, currency, interval, active ),
        catalog_costs ( id, cost, notes, suppliers, updated_at )
      `)
      .order('name')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ items: items || [] })
  }

  if (req.method === 'POST') {
    const { name, description, category, price, active } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })
    const id = 'prod_' + Date.now()
    const { data: item, error } = await supabase.from('catalog_items').insert({
      id, name, description: description||'', active: active!==false
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    if (price && parseFloat(price) > 0) {
      await supabase.from('catalog_prices').insert({
        id: 'price_'+Date.now(), product_id: id,
        amount: parseFloat(price), currency: 'usd', active: true
      })
    }
    return res.status(200).json({ success: true, item })
  }

  if (req.method === 'PATCH') {
    const { product_id, cost, notes, suppliers } = req.body
    if (!product_id) return res.status(400).json({ error: 'product_id required' })

    const { data: existing } = await supabase
      .from('catalog_costs')
      .select('id, cost, notes, suppliers')
      .eq('product_id', product_id)
      .single()

    const updateData = { updated_at: new Date().toISOString() }
    if (cost !== undefined) updateData.cost = parseFloat(cost) || 0
    if (notes !== undefined) updateData.notes = notes
    if (suppliers !== undefined) updateData.suppliers = suppliers

    if (existing) {
      await supabase.from('catalog_costs').update(updateData).eq('product_id', product_id)
    } else {
      await supabase.from('catalog_costs').insert({ product_id, ...updateData })
    }

    // Save cost to history only when cost changes
    if (cost !== undefined) {
      await supabase.from('catalog_cost_history').insert({
        product_id,
        cost: parseFloat(cost) || 0,
        notes: notes || null
      })
    }

    const { data: updated } = await supabase
      .from('catalog_items')
      .select(`
        id, name, description, active,
        catalog_prices ( id, amount, currency, interval, active ),
        catalog_costs ( id, cost, notes, suppliers, updated_at )
      `)
      .eq('id', product_id)
      .single()

    return res.status(200).json({ success: true, item: updated })
  }

  res.status(405).end()
}
