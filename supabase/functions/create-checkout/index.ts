import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts"
import { getAuthenticatedUser, isErrorResponse } from "../_shared/auth.ts"
import { adminDb } from "../_shared/db.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!
const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID")!

async function stripePost(endpoint: string, params: Record<string, string>) {
  const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  })
  return response.json()
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405)
  }

  try {
    const auth = await getAuthenticatedUser(req)
    if (isErrorResponse(auth)) return auth

    // Check if user already has an active subscription
    const { data: settings } = await adminDb
      .from("user_settings")
      .select("subscription_tier, stripe_customer_id")
      .eq("user_id", auth.userId)
      .maybeSingle()

    if (settings?.subscription_tier === "pro") {
      return errorResponse("You already have an active Pro subscription", 400)
    }

    // Get or create Stripe customer
    let customerId = settings?.stripe_customer_id
    if (!customerId) {
      const customer = await stripePost("/customers", {
        "metadata[user_id]": auth.userId,
      })
      customerId = customer.id

      // Save customer ID (upsert handles both new and existing rows)
      await adminDb
        .from("user_settings")
        .upsert({
          user_id: auth.userId,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
    }

    // Create checkout session
    const session = await stripePost("/checkout/sessions", {
      customer: customerId,
      "line_items[0][price]": STRIPE_PRICE_ID,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: "https://spotlight-fresh.vercel.app/success.html",
      cancel_url: "https://spotlight-fresh.vercel.app/",
      "metadata[user_id]": auth.userId,
      "subscription_data[metadata][user_id]": auth.userId,
    })

    return jsonResponse({ url: session.url })
  } catch (err) {
    console.error("create-checkout error:", err instanceof Error ? err.message : "unknown")
    return errorResponse("Something went wrong. Please try again.")
  }
})
