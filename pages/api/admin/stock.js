import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Unit conversion to base unit (g or ml)
const CONVERSIONS = {
  g: 1, kg: 1000,
  ml: 1, l: 1000,
  tsp: 4.929, tbsp: 14.787, cup: 236.588,
  'fl oz': 29.574, oz: 28.3495, lb: 453.592,
  unit: 1
}

function toBase(qty, unit) {
  return qty * (CONVERSIONS[unit] || 1)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    // Get all recipe_ingredients with supply info
    const { data: ri } = await supabase
      .from('recipe_ingredients')
      .select('*, supplies(id, name, base_unit, stock_qty, cost_per_unit)')

    const recipes = {}
    ;(ri || []).forEach(r => {
      if (!recipes[r.catalog_item_id]) recipes[r.catalog_item_id] = []
      recipes[r.catalog_item_id].push({
        supply_id: r.supply_id,
        supply_name: r.supplies?.name,
        quantity: r.quantity,
        unit: r.unit,
        base_unit: r.supplies?.base_unit,
        stock_qty: r.supplies?.stock_qty,
        cost_per_unit: r.supplies?.cost_per_unit,
      })
    })

    // Get current stock
    const { data: stock } = await supabase.from('product_stock').select('*')

    return res.status(200).json({ recipes, stock: stock || [] })
  }

  if (req.method === 'POST') {
    const { catalog_item_id, qty_added, note } = req.body
    if (!catalog_item_id || !qty_added) return res.status(400).json({ error: 'missing fields' })

    // 1. Add to stock entry log
    await supabase.from('stock_entries').insert({ catalog_item_id, qty_added, note })

    // 2. Upsert product_stock
    const { data: existing } = await supabase.from('product_stock').select('*').eq('catalog_item_id', catalog_item_id).single()
    if (existing) {
      await supabase.from('product_stock').update({ qty_available: existing.qty_available + qty_added, updated_at: new Date() }).eq('catalog_item_id', catalog_item_id)
    } else {
      await supabase.from('product_stock').insert({ catalog_item_id, qty_available: qty_added })
    }

    // 3. Deduct ingredients from supplies based on recipe
    const { data: ingredients } = await supabase.from('recipe_ingredients').select('*, supplies(base_unit, stock_qty)').eq('catalog_item_id', catalog_item_id)

    for (const ing of (ingredients || [])) {
      const deductBase = toBase(ing.quantity * qty_added, ing.unit)
      const supplyBase = ing.supplies?.base_unit || 'g'
      const currentStock = parseFloat(ing.supplies?.stock_qty || 0)
      const newStock = Math.max(0, currentStock - deductBase)
      await supabase.from('supplies').update({ stock_qty: newStock }).eq('id', ing.supply_id)
    }

    return res.status(200).json({ success: true })
  }

  if (req.method === 'PATCH') {
    // Update stock qty directly (sale deduction)
    const { catalog_item_id, qty_sold } = req.body
    const { data: existing } = await supabase.from('product_stock').select('*').eq('catalog_item_id', catalog_item_id).single()
    if (existing) {
      const newQty = Math.max(0, existing.qty_available - qty_sold)
      await supabase.from('product_stock').update({ qty_available: newQty, updated_at: new Date() }).eq('catalog_item_id', catalog_item_id)
    }
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
