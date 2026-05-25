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
        id, name, description, category, active, created_at, updated_at,
        badge_hoy, badge_nuevo, badge_temporada, badge_agotado, price, image_url,
        catalog_prices ( id, amount, currency, interval, active ),
        catalog_costs ( id, cost, notes, suppliers, updated_at )
      `)
      .order('name')
    if (error) return res.status(500).json({ error: error.message })
    const { data: stockRows } = await supabase.from('product_stock').select('catalog_item_id, qty')
    const stockMap = {}
    ;(stockRows || []).forEach(r => { stockMap[r.catalog_item_id] = r.qty })
    const itemsWithStock = (items || []).map(i => ({ ...i, product_stock: stockMap[i.id] != null ? [{ qty: stockMap[i.id] }] : [] }))
    return res.status(200).json({ items: itemsWithStock })
  }

  if (req.method === 'POST') {
    const { name, description, category, price, active } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })
    const id = 'prod_' + Date.now()
    const { data: item, error } = await supabase.from('catalog_items').insert({
      id,
      name,
      description: description || '',
      category: category || 'Galleta',
      active: active !== false,
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    if (price && parseFloat(price) > 0) {
      await supabase.from('catalog_items').update({ price: parseFloat(price) }).eq('id', id)
      await supabase.from('catalog_prices').insert({
        id: 'price_' + Date.now(), product_id: id,
        amount: parseFloat(price), currency: 'usd', active: true,
      })
    }
    return res.status(200).json({ success: true, item })
  }

  if (req.method === 'PATCH') {
    const { product_id, cost, notes, suppliers, active, badge_hoy, badge_nuevo, badge_temporada, badge_agotado, price, name, description, category, stock } = req.body
    if (!product_id) return res.status(400).json({ error: 'product_id required' })

    // Update product stock
    if (stock !== undefined) {
      const qty = parseFloat(stock) || 0
      const { data: existingStock } = await supabase.from('product_stock').select('id').eq('catalog_item_id', product_id).single()
      if (existingStock) {
        await supabase.from('product_stock').update({ qty }).eq('catalog_item_id', product_id)
      } else {
        await supabase.from('product_stock').insert({ catalog_item_id: product_id, qty })
      }
    }

    // Update cost record
    if (cost !== undefined || notes !== undefined || suppliers !== undefined) {
      const { data: existing } = await supabase
        .from('catalog_costs')
        .select('id')
        .eq('product_id', product_id)
        .single()

      const costUpdate = { updated_at: new Date().toISOString() }
      if (cost !== undefined) costUpdate.cost = parseFloat(cost) || 0
      if (notes !== undefined) costUpdate.notes = notes
      if (suppliers !== undefined) costUpdate.suppliers = suppliers

      if (existing) {
        await supabase.from('catalog_costs').update(costUpdate).eq('product_id', product_id)
      } else {
        await supabase.from('catalog_costs').insert({ product_id, ...costUpdate })
      }

      if (cost !== undefined) {
        await supabase.from('catalog_cost_history').insert({
          product_id,
          cost: parseFloat(cost) || 0,
          notes: notes || null,
        })
      }
    }

    // Update catalog_items fields
    const itemUpdate = {}
    if (name !== undefined) itemUpdate.name = name
    if (description !== undefined) itemUpdate.description = description
    if (category !== undefined) itemUpdate.category = category
    if (active !== undefined) itemUpdate.active = active
    if (badge_hoy !== undefined) itemUpdate.badge_hoy = badge_hoy
    if (badge_nuevo !== undefined) itemUpdate.badge_nuevo = badge_nuevo
    if (badge_temporada !== undefined) itemUpdate.badge_temporada = badge_temporada
    if (badge_agotado !== undefined) itemUpdate.badge_agotado = badge_agotado
    if (price !== undefined) itemUpdate.price = parseFloat(price)

    if (Object.keys(itemUpdate).length > 0) {
      const { error: itemErr } = await supabase.from('catalog_items').update(itemUpdate).eq('id', product_id)
      if (itemErr) return res.status(500).json({ error: itemErr.message })
    }

    // Update price record if price changed
    if (price !== undefined && parseFloat(price) > 0) {
      const { data: existingPrice } = await supabase
        .from('catalog_prices')
        .select('id')
        .eq('product_id', product_id)
        .eq('active', true)
        .single()
      if (existingPrice) {
        await supabase.from('catalog_prices').update({ amount: parseFloat(price) }).eq('id', existingPrice.id)
      } else {
        await supabase.from('catalog_prices').insert({
          id: 'price_' + Date.now(), product_id,
          amount: parseFloat(price), currency: 'usd', active: true,
        })
      }
    }

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { product_id } = req.body
    if (!product_id) return res.status(400).json({ error: 'product_id required' })
    await supabase.from('catalog_cost_history').delete().eq('product_id', product_id)
    await supabase.from('catalog_costs').delete().eq('product_id', product_id)
    await supabase.from('catalog_prices').delete().eq('product_id', product_id)
    await supabase.from('recipe_ingredients').delete().eq('catalog_item_id', product_id)
    await supabase.from('product_stock').delete().eq('catalog_item_id', product_id)
    await supabase.from('stock_entries').delete().eq('catalog_item_id', product_id)
    const { error } = await supabase.from('catalog_items').delete().eq('id', product_id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
