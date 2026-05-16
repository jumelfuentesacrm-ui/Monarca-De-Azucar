import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'GET') {
    // If history param, return cost history for a supply
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
    const { name, category, cost, unit, provider, renewal_date, notes } = req.body
    if (!name || cost === undefined) return res.status(400).json({ error: 'name and cost required' })
    const { data, error } = await supabaseAdmin.from('supplies').insert({
      name, category: category||null, cost: parseFloat(cost), unit: unit||'month',
      provider: provider||null, renewal_date: renewal_date||null, notes: notes||null, active: true
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    // Save initial cost history
    await supabaseAdmin.from('supply_cost_history').insert({ supply_id: data.id, cost: parseFloat(cost) })
    return res.status(200).json({ supply: data })
  }

  if (req.method === 'PATCH') {
    const { id, cost, stock_qty, base_unit, active, ...fields } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    const updateData = { ...fields }
    if (cost !== undefined) updateData.cost = parseFloat(cost)
    if (stock_qty !== undefined) updateData.stock_qty = parseFloat(stock_qty)
    if (base_unit !== undefined) updateData.base_unit = base_unit
    if (active !== undefined) updateData.active = active

    // Get current cost to compare
    if (cost !== undefined) {
      const { data: current } = await supabaseAdmin.from('supplies').select('cost').eq('id', id).single()
      if (current && parseFloat(current.cost) !== parseFloat(cost)) {
        // Save to history only if cost changed
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
