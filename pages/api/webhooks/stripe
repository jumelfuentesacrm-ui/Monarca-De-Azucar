import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function generateCardNumber() {
  return 'AC-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

async function handlePayment(email, name, amount, currency, stripeCustomerId, description) {
  if (!email) return

  // 1. Find or create profile
  let userId = null
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    userId = existing.id
  } else {
    // Create auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name || email }
    })
    if (authErr) return
    userId = authUser.user.id

    // Create profile
    await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: name || email,
      role: 'client'
    })
  }

  if (!userId) return

  // 2. Find or create loyalty card
  let cardId = null
  const { data: existingCard } = await supabase
    .from('loyalty_cards')
    .select('id, stamps')
    .eq('user_id', userId)
    .single()

  if (existingCard) {
    cardId = existingCard.id
  } else {
    // Generate unique card number
    let cardNumber = generateCardNumber()
    let tries = 0
    while (tries < 5) {
      const { data: taken } = await supabase.from('loyalty_cards').select('id').eq('card_number', cardNumber).single()
      if (!taken) break
      cardNumber = generateCardNumber()
      tries++
    }

    const { data: newCard } = await supabase
      .from('loyalty_cards')
      .insert({ user_id: userId, card_number: cardNumber, stamps: 0, cycle: 1 })
      .select()
      .single()

    if (newCard) cardId = newCard.id
  }

  if (!cardId) return

  // 3. Punch card atomically via RPC
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('stamps')
    .eq('id', cardId)
    .single()

  const currentStamps = card?.stamps || 0
  const newStamps = currentStamps + 1
  const newCycle = Math.ceil(newStamps / 5) || 1

  const { error: updateErr } = await supabase
    .from('loyalty_cards')
    .update({ stamps: newStamps, cycle: newCycle })
    .eq('id', cardId)
    .eq('stamps', currentStamps) // optimistic lock

  if (updateErr) {
    // Retry once
    const { data: retryCard } = await supabase.from('loyalty_cards').select('stamps').eq('id', cardId).single()
    const retryStamps = (retryCard?.stamps || 0) + 1
    await supabase.from('loyalty_cards').update({ stamps: retryStamps, cycle: Math.ceil(retryStamps/5)||1 }).eq('id', cardId)
  }

  // 4. Record stamp history
  await supabase.from('stamp_history').insert({
    card_id: cardId,
    user_id: userId,
    payment_amount: '$' + (amount / 100).toFixed(2)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  const { type, data } = event
  const obj = data.object

  // PRODUCTS
  if (type === 'product.created' || type === 'product.updated') {
    await supabase.from('catalog_items').upsert({
      id: obj.id, name: obj.name,
      description: obj.description || null,
      active: obj.active,
      updated_at: new Date().toISOString()
    })
  }
  if (type === 'product.deleted') {
    await supabase.from('catalog_items').delete().eq('id', obj.id)
  }

  // PRICES
  if (type === 'price.created' || type === 'price.updated') {
    await supabase.from('catalog_prices').upsert({
      id: obj.id, product_id: obj.product,
      amount: obj.unit_amount ? obj.unit_amount / 100 : null,
      currency: obj.currency,
      interval: obj.recurring?.interval || null,
      active: obj.active
    })
  }
  if (type === 'price.deleted') {
    await supabase.from('catalog_prices').delete().eq('id', obj.id)
  }

  // PAYMENT INTENT — one-time payments
  if (type === 'payment_intent.succeeded') {
    // Get email — try receipt_email first, then fetch from customer
    let email = obj.receipt_email || null
    let name = null
    if (!email && obj.customer) {
      try {
        const customer = await stripe.customers.retrieve(obj.customer)
        email = customer.email || null
        name = customer.name || null
      } catch(e) {}
    }
    // Try billing details from latest charge
    if (!name && obj.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(obj.latest_charge)
        name = name || charge.billing_details?.name || null
        email = email || charge.billing_details?.email || null
      } catch(e) {}
    }

    const { data: existingSale } = await supabase.from('sales').select('id').eq('id', obj.id).single()
    if (!existingSale) {
      await supabase.from('sales').insert({
        id: obj.id,
        customer_id: obj.customer || null,
        customer_email: email,
        customer_name: name,
        amount: obj.amount / 100,
        currency: obj.currency,
        type: 'stripe',
        status: 'paid',
        sale_date: new Date(obj.created * 1000).toISOString()
      })
    }
    // Auto punch card
    await handlePayment(email, name, obj.amount, obj.currency, obj.customer, obj.description)
    // Push notification
    try {
      const { data: subs } = await supabase.from('push_subscriptions').select('*')
      if (subs?.length) {
        const webpush = require('web-push')
        webpush.setVapidDetails('mailto:jfuentes@accountingpluscrm.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
        const payload = JSON.stringify({ title: 'New Stripe Sale', body: `$${(obj.amount/100).toFixed(2)} — ${name||email||'Customer'}`, url: '/admin' })
        for (const sub of subs) {
          webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload).catch(()=>{})
        }
      }
    } catch(e) {}
  }

  // INVOICE — subscriptions
  if (type === 'invoice.paid') {
    const { data: existingSale } = await supabase.from('sales').select('id').eq('id', obj.id).single()
    if (!existingSale) {
      const lineItem = obj.lines?.data?.[0]
      await supabase.from('sales').insert({
        id: obj.id,
        customer_id: obj.customer || null,
        customer_name: obj.customer_name || null,
        customer_email: obj.customer_email || null,
        product_id: lineItem?.price?.product || null,
        product_name: lineItem?.description || null,
        price_id: lineItem?.price?.id || null,
        amount: obj.amount_paid / 100,
        currency: obj.currency,
        type: 'stripe',
        status: 'paid',
        sale_date: new Date(obj.created * 1000).toISOString()
      })
    }
    // Auto punch card
    await handlePayment(
      obj.customer_email,
      obj.customer_name,
      obj.amount_paid,
      obj.currency,
      obj.customer,
      obj.lines?.data?.[0]?.description
    )
  }

  if (type === 'invoice.payment_failed') {
    await supabase.from('sales').upsert({
      id: obj.id,
      customer_id: obj.customer || null,
      customer_email: obj.customer_email || null,
      amount: obj.amount_due / 100,
      currency: obj.currency,
      type: 'stripe',
      status: 'failed',
      sale_date: new Date(obj.created * 1000).toISOString()
    })
  }

  // REFUNDS
  if (type === 'charge.refunded') {
    await supabase.from('sales').upsert({
      id: 'refund_' + obj.id,
      customer_id: obj.customer || null,
      amount: -(obj.amount_refunded / 100),
      currency: obj.currency,
      type: 'stripe',
      status: 'refunded',
      sale_date: new Date().toISOString()
    })
  }

  // SUBSCRIPTIONS
  if (type === 'customer.subscription.deleted') {
    await supabase.from('sales').update({ status: 'cancelled' })
      .eq('customer_id', obj.customer)
      .eq('status', 'pending')
  }

  res.status(200).json({ received: true })
}
