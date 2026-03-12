import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts"
import { getAuthenticatedUser, isErrorResponse } from "../_shared/auth.ts"
import { adminDb } from "../_shared/db.ts"

const FREE_LIMIT = 25

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await getAuthenticatedUser(req)
    if (isErrorResponse(auth)) return auth

    // Get subscription tier
    const { data: settings } = await adminDb
      .from("user_settings")
      .select("subscription_tier")
      .eq("user_id", auth.userId)
      .single()

    const isPro = settings?.subscription_tier === "pro"

    const today = new Date().toISOString().split("T")[0]

    const { data } = await adminDb
      .from("daily_usage")
      .select("message_count")
      .eq("user_id", auth.userId)
      .eq("usage_date", today)
      .eq("usage_type", "chat")
      .single()

    const used = data?.message_count ?? 0

    // Pro users get unlimited, free users get 25/day
    if (isPro) {
      return jsonResponse({
        used,
        limit: -1,
        remaining: -1,
        tier: "pro",
      })
    }

    return jsonResponse({
      used,
      limit: FREE_LIMIT,
      remaining: Math.max(0, FREE_LIMIT - used),
      tier: "free",
    })
  } catch (error) {
    console.error("usage-status error:", error instanceof Error ? error.message : "unknown")
    return errorResponse("Failed to check usage status.")
  }
})
