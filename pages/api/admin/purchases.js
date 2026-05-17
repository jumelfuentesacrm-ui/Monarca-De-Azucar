import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const { data: purchases } = await supabase
      .from('supply_purchases')
      .select('*, supplies(name, base_unit, category)')
      .order('purchased_at', { ascending: false })
      .limit(200)
    return res.status(200).json({ purchases: purchases || [] })
  }

  if (req.method === 'POST') {
    const { supply_id, qty, unit, price_total, notes } = req.body
    if (!supply_id || !qty || !price_total) 
      return res.status(400).json({ error: 'supply_id, qty, price_total required' })

    // 1. Record purchase
    const { data: purchase, error } = await supabase
      .from('supply_purchases')
      .insert({ supply_id, qty: parseFloat(qty), unit, price_total: parseFloat(price_total), notes })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })

    // 2. Update supply stock_qty and cost tracking
    const { data: supply } = await supabase
      .from('supplies')
      .select('stock_qty, qty_purchased, cost_total, cost_per_unit')
      .eq('id', supply_id).single()

    const CONV = {g:1,kg:1000,oz:28.35,lb:453.6,ml:1,l:1000,tsp:4.929,tbsp:14.787,cup:236.6,'fl oz':29.574,unit:1}
    const baseUnit = supply?.base_unit || unit
    // Convert purchased qty to base unit
    const qtyInBase = parseFloat(qty) * ((CONV[unit]||1) / (CONV[baseUnit]||1))
    
    const newStock = parseFloat(supply?.stock_qty || 0) + qtyInBase
    const newQtyPurchased = parseFloat(supply?.qty_purchased || 0) + qtyInBase
    const newCostTotal = parseFloat(supply?.cost_total || 0) + parseFloat(price_total)
    const newCostPerUnit = newQtyPurchased > 0 ? newCostTotal / newQtyPurchased : 0

    await supabase.from('supplies').update({
      stock_qty: newStock,
      qty_purchased: newQtyPurchased,
      cost_total: newCostTotal,
      cost_per_unit: newCostPerUnit
    }).eq('id', supply_id)

    // 3. Record stock history
    await supabase.from('supply_stock_history').insert({
      supply_id,
      stock_qty: newStock,
      cost_per_unit: newCostPerUnit
    }).catch(() => {})

    return res.status(200).json({ purchase, newStock, newCostPerUnit })
  }

  res.status(405).end()
}
