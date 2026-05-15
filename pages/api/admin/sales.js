import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'GET') {
    const { email } = req.query
    let query = supabase.from('sales').select('*').order('sale_date', { ascending: false })
    if (email) query = query.eq('customer_email', email)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ sales: data || [] })
  }

  if (req.method === 'POST') {
    const { customer_id, customer_name, customer_email, product_name, amount, type, status, notes, sale_date } = req.body
    const { error } = await supabase.from('sales').insert({
      id: (type==='manual'?'manual_':'cash_')+Date.now(),
      customer_id: customer_id || null,
      customer_name, customer_email,
      product_name: product_name || 'Manual Payment',
      amount: parseFloat(amount),
      currency: 'usd',
      type: type || 'cash',
      status: status || 'paid',
      notes,
      sale_date: sale_date || new Date().toISOString()
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body
    if (!id || !status) return res.status(400).json({ error: 'id and status required' })
    const { error } = await supabase.from('sales').update({ status }).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'HEAD') return res.status(200).end()
  res.status(405).end()
}
