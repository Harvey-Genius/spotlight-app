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

    const url = new URL(req.url)

    if (req.method === "GET") {
      const conversationId = url.searchParams.get("conversation_id")
      if (!conversationId) {
        return errorResponse("conversation_id required", 400)
      }

      // Verify conversation belongs to user
      const { data: conv } = await adminDb
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", auth.userId)
        .single()

      if (!conv) {
        return errorResponse("Conversation not found", 404)
      }

      const { data, error } = await adminDb
        .from("messages")
        .select("id, conversation_id, role, content, metadata, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) {
        return errorResponse("Failed to load messages")
      }

      return jsonResponse(data || [])
    }

    return errorResponse("Method not allowed", 405)
  } catch (error) {
    console.error("messages error:", error)
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error"
    )
  }
})
