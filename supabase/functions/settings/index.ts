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
        .select("dark_mode, notifications_enabled, ai_model")
        .eq("user_id", auth.userId)
        .single()

      if (error) {
        return jsonResponse({
          dark_mode: false,
          notifications_enabled: true,
          ai_model: "gpt-4o-mini",
        })
      }

      return jsonResponse(data)
    }

    if (req.method === "POST") {
      const updates = await req.json()
      const allowed = ["dark_mode", "notifications_enabled", "ai_model"]
      const filtered: Record<string, unknown> = { updated_at: new Date().toISOString() }

      for (const key of allowed) {
        if (key in updates) {
          filtered[key] = updates[key]
        }
      }

      const { data, error } = await adminDb
        .from("user_settings")
        .upsert({ user_id: auth.userId, ...filtered })
        .select("dark_mode, notifications_enabled, ai_model")
        .single()

      if (error) {
        return errorResponse("Failed to update settings")
      }

      return jsonResponse(data)
    }

    return errorResponse("Method not allowed", 405)
  } catch (error) {
    console.error("settings error:", error)
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error"
    )
  }
})
