import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminDb } from "../_shared/db.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")

// Simple HMAC-SHA256 for Stripe signature verification
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",").reduce(
      (acc, part) => {
        const [key, value] = part.split("=")
        if (key === "t") acc.timestamp = value
        if (key === "v1") acc.signatures.push(value)
        return acc
      },
      { timestamp: "", signatures: [] as string[] }
    )

    const signedPayload = `${parts.timestamp}.${payload}`
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedPayload)
    )
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    return parts.signatures.includes(expectedSig)
  } catch {
    return false
  }
}

async function stripeGet(endpoint: string) {
  const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  })
  return response.json()
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const body = await req.text()

    // Verify webhook signature if secret is set
    if (STRIPE_WEBHOOK_SECRET) {
      const signature = req.headers.get("stripe-signature") || ""
      const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET)
      if (!valid) {
        return new Response("Invalid signature", { status: 400 })
      }
    }

    const event = JSON.parse(body)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.metadata?.user_id
        const subscriptionId = session.subscription
        const customerId = session.customer

        if (userId && subscriptionId) {
          await adminDb
            .from("user_settings")
            .upsert({
              user_id: userId,
              subscription_tier: "pro",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object
        const status = subscription.status
        const tier = status === "active" ? "pro" : "free"

        await adminDb
          .from("user_settings")
          .update({
            subscription_tier: tier,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        await adminDb
          .from("user_settings")
          .update({
            subscription_tier: "free",
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription
        if (subscriptionId) {
          // Downgrade on payment failure
          await adminDb
            .from("user_settings")
            .update({
              subscription_tier: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("stripe-webhook error:", err instanceof Error ? err.message : "unknown")
    return new Response("Webhook error", { status: 500 })
  }
})
