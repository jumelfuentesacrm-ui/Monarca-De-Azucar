import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET' && req.query.stockHistory) {
    const range = req.query.range || 'week'
    const days = range === 'month' ? 30 : range === 'day' ? 1 : 7
    const since = new Date(); since.setDate(since.getDate() - days)
    const { data: history } = await supabaseAdmin
      .from('supply_stock_history')
      .select('stock_qty, cost_per_unit, recorded_at')
      .gte('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: true })
    const byDate = {}
    ;(history || []).forEach(h => {
      const date = h.recorded_at.split('T')[0]
      if (!byDate[date]) byDate[date] = 0
      byDate[date] += parseFloat(h.stock_qty || 0) * parseFloat(h.cost_per_unit || 0)
    })
    return res.status(200).json({ history: Object.entries(byDate).map(([date, value]) => ({ date, value: parseFloat(value.toFixed(2)) })) })
  }

  if (req.method === 'GET') {
    if (req.query.history) {
      const { data, error } = await supabaseAdmin
        .from('supply_cost_history')
        .select('*')
        .eq('supply_id', req.query.history)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ history: data || [] })
    }
    const { data, error } = await supabaseAdmin
      .from('supplies')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ supplies: data || [] })
  }

  if (req.method === 'POST') {
    const { name, category, cost, base_unit, provider, renewal_date, notes } = req.body
    if (!name || cost === undefined) return res.status(400).json({ error: 'name and cost required' })
    const { data, error } = await supabaseAdmin.from('supplies').insert({
      name,
      category: category || null,
      cost: parseFloat(cost),
      base_unit: base_unit || 'g',
      provider: provider || null,
      renewal_date: renewal_date || null,
      notes: notes || null,
      active: true,
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await supabaseAdmin.from('supply_cost_history').insert({ supply_id: data.id, cost: parseFloat(cost) })
    return res.status(200).json({ supply: data })
  }

  if (req.method === 'PATCH') {
    const { id, cost, stock_qty, base_unit, active, cost_per_unit, cost_total, qty_purchased, skus, ...fields } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    const updateData = { ...fields }
    if (cost !== undefined) updateData.cost = parseFloat(cost)
    if (cost_total !== undefined) updateData.cost_total = parseFloat(cost_total)
    if (cost_per_unit !== undefined) updateData.cost_per_unit = parseFloat(cost_per_unit)
    if (qty_purchased !== undefined) updateData.qty_purchased = parseFloat(qty_purchased)
    if (stock_qty !== undefined) updateData.stock_qty = parseFloat(stock_qty)
    if (base_unit !== undefined) updateData.base_unit = base_unit
    if (active !== undefined) updateData.active = active
    if (skus !== undefined) updateData.skus = skus

    if (cost !== undefined) {
      const { data: current } = await supabaseAdmin.from('supplies').select('cost').eq('id', id).single()
      if (current && parseFloat(current.cost) !== parseFloat(cost)) {
        await supabaseAdmin.from('supply_cost_history').insert({ supply_id: id, cost: parseFloat(cost) })
      }
    }

    const { error } = await supabaseAdmin.from('supplies').update(updateData).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    await supabaseAdmin.from('supply_cost_history').delete().eq('supply_id', id)
    const { error } = await supabaseAdmin.from('supplies').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
