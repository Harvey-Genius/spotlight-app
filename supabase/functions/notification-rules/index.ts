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

    // GET: list all rules for user
    if (req.method === "GET") {
      const { data, error } = await adminDb
        .from("notification_rules")
        .select("id, rule_type, value, enabled, created_at")
        .eq("user_id", auth.userId)
        .order("created_at", { ascending: false })

      if (error) return errorResponse("Failed to fetch rules")
      return jsonResponse(data || [])
    }

    // POST: create a new rule
    if (req.method === "POST") {
      const { rule_type, value } = await req.json()

      if (!rule_type || !value || typeof value !== "string") {
        return errorResponse("rule_type and value are required", 400)
      }
      if (value.length > 500) {
        return errorResponse("Rule value too long (max 500 chars)", 400)
      }
      if (!["from", "subject", "contains"].includes(rule_type)) {
        return errorResponse(
          'rule_type must be "from", "subject", or "contains"',
          400
        )
      }

      const { data, error } = await adminDb
        .from("notification_rules")
        .insert({
          user_id: auth.userId,
          rule_type,
          value: value.trim(),
        })
        .select("id, rule_type, value, enabled, created_at")
        .single()

      if (error) return errorResponse("Failed to create rule")
      return jsonResponse(data)
    }

    // DELETE: remove a rule by id
    if (req.method === "DELETE") {
      const url = new URL(req.url)
      const ruleId = url.searchParams.get("id")
      if (!ruleId) return errorResponse("Rule id is required", 400)

      const { error } = await adminDb
        .from("notification_rules")
        .delete()
        .eq("id", ruleId)
        .eq("user_id", auth.userId)

      if (error) return errorResponse("Failed to delete rule")
      return jsonResponse({ success: true })
    }

    return errorResponse("Method not allowed", 405)
  } catch (error) {
    console.error("notification-rules error:", error instanceof Error ? error.message : "unknown")
    return errorResponse("Something went wrong. Please try again.")
  }
})
