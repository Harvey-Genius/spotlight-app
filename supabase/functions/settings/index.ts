import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts"
import { getAuthenticatedUser, isErrorResponse } from "../_shared/auth.ts"
import { adminDb } from "../_shared/db.ts"

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await getAuthenticatedUser(req)
    if (isErrorResponse(auth)) return auth

    if (req.method === "GET") {
      const { data, error } = await adminDb
        .from("user_settings")
        .select("dark_mode, notifications_enabled, ai_model, ai_personality, sms_phone_number, subscription_tier")
        .eq("user_id", auth.userId)
        .single()

      if (error) {
        return jsonResponse({
          dark_mode: false,
          notifications_enabled: true,
          ai_model: "gpt-4o-mini",
          ai_personality: "",
          sms_phone_number: "",
          subscription_tier: "free",
        })
      }

      return jsonResponse(data)
    }

    if (req.method === "POST") {
      const updates = await req.json()
      const allowed = ["dark_mode", "notifications_enabled", "ai_model", "ai_personality", "sms_phone_number"]
      const filtered: Record<string, unknown> = { updated_at: new Date().toISOString() }

      // Validate ai_personality length
      if ("ai_personality" in updates) {
        if (typeof updates.ai_personality !== "string") {
          return errorResponse("ai_personality must be a string", 400)
        }
        if (updates.ai_personality.length > 500) {
          return errorResponse("AI personality too long (max 500 chars)", 400)
        }
      }

      // Validate sms_phone_number
      if ("sms_phone_number" in updates) {
        if (typeof updates.sms_phone_number !== "string") {
          return errorResponse("sms_phone_number must be a string", 400)
        }
        // Allow empty (to clear) or valid E.164 format
        if (updates.sms_phone_number && !/^\+[1-9]\d{1,14}$/.test(updates.sms_phone_number)) {
          return errorResponse("Invalid phone number format. Use +1XXXXXXXXXX", 400)
        }
      }

      // Validate ai_model is allowed
      if ("ai_model" in updates) {
        const allowedModels = ["gpt-4o-mini", "gpt-4o"]
        if (!allowedModels.includes(updates.ai_model)) {
          return errorResponse("Invalid AI model", 400)
        }
      }

      for (const key of allowed) {
        if (key in updates) {
          filtered[key] = updates[key]
        }
      }

      const { data, error } = await adminDb
        .from("user_settings")
        .upsert({ user_id: auth.userId, ...filtered })
        .select("dark_mode, notifications_enabled, ai_model, ai_personality, sms_phone_number, subscription_tier")
        .single()

      if (error) {
        return errorResponse("Failed to update settings")
      }

      return jsonResponse(data)
    }

    return errorResponse("Method not allowed", 405)
  } catch (error) {
    console.error("settings error:", error instanceof Error ? error.message : "unknown")
    return errorResponse("Something went wrong. Please try again.")
  }
})
