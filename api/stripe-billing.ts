import Stripe from 'stripe'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // ── GET: fetch subscription info by email ─────────────────────────────
    if (req.method === 'GET') {
      const { email } = req.query as { email: string }
      if (!email) return res.status(400).json({ error: 'email required' })

      const customers = await stripe.customers.list({ email, limit: 1 })
      if (!customers.data.length) return res.json({ subscription: null })

      const customer = customers.data[0]

      // Try active first
      const activeSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status:   'active',
        limit:    1,
        expand:   ['data.default_payment_method'],
      })

      // Fall back to past_due (failed payment, still has access)
      const subList = activeSubs.data.length
        ? activeSubs.data
        : (await stripe.subscriptions.list({
            customer: customer.id,
            status:   'past_due',
            limit:    1,
            expand:   ['data.default_payment_method'],
          })).data

      if (!subList.length) return res.json({ subscription: null })

      const sub = subList[0]
      const pm  = sub.default_payment_method as Stripe.PaymentMethod | null

      return res.json({
        subscription: {
          id:                   sub.id,
          status:               sub.status,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end:   sub.current_period_end,
          customer_id:          customer.id,
          card_last4:           pm?.card?.last4       ?? null,
          card_brand:           pm?.card?.brand       ?? null,
          card_exp_month:       pm?.card?.exp_month   ?? null,
          card_exp_year:        pm?.card?.exp_year    ?? null,
        },
      })
    }

    // ── POST actions ──────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { action } = req.body

      // Create a SetupIntent so the member can add a new card
      if (action === 'setup_intent') {
        const { customer_id } = req.body
        if (!customer_id) return res.status(400).json({ error: 'customer_id required' })

        const si = await stripe.setupIntents.create({
          customer:             customer_id,
          payment_method_types: ['card'],
          usage:                'off_session',
        })
        return res.json({ client_secret: si.client_secret })
      }

      // Attach the new payment method and set it as default on the subscription
      if (action === 'update_payment') {
        const { subscription_id, payment_method_id, customer_id } = req.body
        if (!subscription_id || !payment_method_id || !customer_id) {
          return res.status(400).json({ error: 'subscription_id, payment_method_id, customer_id required' })
        }

        await stripe.paymentMethods.attach(payment_method_id, { customer: customer_id })

        await stripe.customers.update(customer_id, {
          invoice_settings: { default_payment_method: payment_method_id },
        })

        await stripe.subscriptions.update(subscription_id, {
          default_payment_method: payment_method_id,
        })

        return res.json({ success: true })
      }

      // Cancel subscription at period end (member keeps access until then)
      if (action === 'cancel') {
        const { subscription_id } = req.body
        if (!subscription_id) return res.status(400).json({ error: 'subscription_id required' })

        const sub = await stripe.subscriptions.update(subscription_id, {
          cancel_at_period_end: true,
        })

        return res.json({
          success:              true,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end:   sub.current_period_end,
        })
      }

      // Reactivate — undo cancel_at_period_end
      if (action === 'reactivate') {
        const { subscription_id } = req.body
        if (!subscription_id) return res.status(400).json({ error: 'subscription_id required' })

        const sub = await stripe.subscriptions.update(subscription_id, {
          cancel_at_period_end: false,
        })

        return res.json({ success: true, cancel_at_period_end: sub.cancel_at_period_end })
      }

      return res.status(400).json({ error: 'unknown action' })
    }

    return res.status(405).json({ error: 'method not allowed' })
  } catch (err: any) {
    console.error('[stripe-billing]', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
