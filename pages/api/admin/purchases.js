import { createClient } from '@supabase/supabase-js'
import { CONV } from '../../../lib/units'

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

    const { data: purchase, error } = await supabase
      .from('supply_purchases')
      .insert({ supply_id, qty: parseFloat(qty), unit, price_total: parseFloat(price_total), notes })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })

    const { data: supply } = await supabase
      .from('supplies')
      .select('stock_qty, qty_purchased, cost_total, cost_per_unit, base_unit')
      .eq('id', supply_id).single()

    const baseUnit = supply?.base_unit || unit
    // Convert purchased qty to supply's base unit using chart-consistent conversions
    const qtyInBase = parseFloat(qty) * ((CONV[unit] || 1) / (CONV[baseUnit] || 1))

    const newStock = parseFloat(supply?.stock_qty || 0) + qtyInBase
    const newQtyPurchased = parseFloat(supply?.qty_purchased || 0) + qtyInBase
    const newCostTotal = parseFloat(supply?.cost_total || 0) + parseFloat(price_total)
    const newCostPerUnit = newQtyPurchased > 0 ? newCostTotal / newQtyPurchased : 0

    await supabase.from('supplies').update({
      stock_qty: newStock,
      qty_purchased: newQtyPurchased,
      cost_total: newCostTotal,
      cost_per_unit: newCostPerUnit,
    }).eq('id', supply_id)

    await supabase.from('supply_stock_history').insert({
      supply_id,
      stock_qty: newStock,
      cost_per_unit: newCostPerUnit,
    }).catch(() => {})

    return res.status(200).json({ purchase, newStock, newCostPerUnit })
  }

  res.status(405).end()
}
