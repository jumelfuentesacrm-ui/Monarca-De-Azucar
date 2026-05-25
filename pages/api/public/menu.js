import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  let items = null

  // Full query — show all items (active or not); use badge_agotado to hide from ordering
  const { data: full, error: fullErr } = await supabase
    .from('catalog_items')
    .select('id, name, description, active, category, price, badge_hoy, badge_nuevo, badge_temporada, badge_agotado, image_url')
    .order('category')
    .order('badge_hoy', { ascending: false })
    .order('name')

  if (!fullErr) {
    items = full
  } else {
    // Fallback without image_url (column may not exist yet)
    const { data: partial, error: partialErr } = await supabase
      .from('catalog_items')
      .select('id, name, description, active, category, price, badge_hoy, badge_nuevo, badge_temporada, badge_agotado')
      .order('category')
      .order('badge_hoy', { ascending: false })
      .order('name')

    if (!partialErr) {
      items = (partial || []).map(i => ({ ...i, image_url: null }))
    } else {
      // Final fallback: minimal columns
      const { data: basic } = await supabase
        .from('catalog_items')
        .select('id, name, description, active, category, created_at')
        .order('category')
        .order('name')
      items = (basic || []).map(i => ({ ...i, image_url: null, price: 0 }))
    }
  }

  if (!items) return res.status(200).json({ items: [] })

  // Get prices and stock
  const { data: prices } = await supabase
    .from('catalog_prices')
    .select('product_id, amount')
    .eq('active', true)

  const { data: stockRows } = await supabase
    .from('product_stock')
    .select('catalog_item_id, qty')

  const priceMap = {}
  ;(prices || []).forEach(p => { priceMap[p.product_id] = p.amount })
  const stockMap = {}
  ;(stockRows || []).forEach(r => { stockMap[r.catalog_item_id] = r.qty })

  const enriched = items.map(item => ({
    ...item,
    price: item.price || priceMap[item.id] || 0,
    stock_qty: stockMap[item.id] != null ? stockMap[item.id] : null,
  }))

  return res.status(200).json({ items: enriched })
}

