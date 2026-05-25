import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  
  const { data: items, error } = await supabase
    .from('catalog_items')
    .select('id, name, description, active, category, price, badge_hoy, badge_nuevo, badge_temporada, badge_agotado, image_url')
    .eq('active', true)
    .order('badge_hoy', { ascending: false })
    .order('name')

  if (error) {
    // Fallback without badge columns if they don't exist yet
    const { data: basic } = await supabase
      .from('catalog_items')
      .select('id, name, description, active, created_at')
      .eq('active', true)
      .order('name')
    return res.status(200).json({ items: basic || [] })
  }

  // Also get prices and stock
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

  const enriched = (items || []).map(item => ({
    ...item,
    price: item.price || priceMap[item.id] || 0,
    stock_qty: stockMap[item.id] != null ? stockMap[item.id] : null,
  }))

  return res.status(200).json({ items: enriched })
}
