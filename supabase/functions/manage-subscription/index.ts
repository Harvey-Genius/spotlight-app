import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts"
import { getAuthenticatedUser, isErrorResponse } from "../_shared/auth.ts"
import { adminDb } from "../_shared/db.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!

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

    const { data: settings } = await adminDb
      .from("user_settings")
      .select("stripe_customer_id")
      .eq("user_id", auth.userId)
      .single()

    if (!settings?.stripe_customer_id) {
      return errorResponse("No billing account found", 400)
    }

    // Create Stripe billing portal session
    const session = await stripePost("/billing_portal/sessions", {
      customer: settings.stripe_customer_id,
      return_url: "https://spotlight-email-ai.com/",
    })

    return jsonResponse({ url: session.url })
  } catch (err) {
    console.error("manage-subscription error:", err instanceof Error ? err.message : "unknown")
    return errorResponse("Something went wrong. Please try again.")
  }
})
