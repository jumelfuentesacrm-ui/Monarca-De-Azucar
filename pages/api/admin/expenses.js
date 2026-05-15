import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'GET') {
    const { client_id } = req.query
    if (!client_id) return res.status(400).json({ error: 'client_id required' })
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('client_id', client_id)
      .order('expense_date', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ expenses: data || [] })
  }

  if (req.method === 'POST') {
    const { client_id, amount, description, recurring, recurring_interval, expense_date } = req.body
    if (!client_id || !amount) return res.status(400).json({ error: 'client_id and amount required' })
    const { error } = await supabase.from('expenses').insert({
      client_id, amount: parseFloat(amount), description,
      recurring: recurring || false,
      recurring_interval: recurring ? recurring_interval : null,
      expense_date: expense_date || new Date().toISOString().split('T')[0]
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    await supabase.from('expenses').delete().eq('id', id)
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
