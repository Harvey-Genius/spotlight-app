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
      const { data, error } = await adminDb
        .from("conversations")
        .select("id, title, updated_at")
        .eq("user_id", auth.userId)
        .order("updated_at", { ascending: false })
        .limit(50)

      if (error) {
        return errorResponse("Failed to load conversations")
      }

      // Get last message preview for each conversation
      const summaries = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: msgs } = await adminDb
            .from("messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)

          return {
            ...conv,
            last_message_preview:
              msgs?.[0]?.content?.substring(0, 100) || "",
          }
        })
      )

      return jsonResponse(summaries)
    }

    if (req.method === "DELETE") {
      const conversationId = url.searchParams.get("id")
      if (!conversationId) {
        return errorResponse("Conversation ID required", 400)
      }

      // Verify ownership
      const { data: conv } = await adminDb
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", auth.userId)
        .single()

      if (!conv) {
        return errorResponse("Conversation not found", 404)
      }

      // Delete messages first (foreign key constraint)
      const { error: msgError } = await adminDb
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId)

      if (msgError) {
        return errorResponse("Failed to delete messages")
      }

      const { error } = await adminDb
        .from("conversations")
        .delete()
        .eq("id", conversationId)

      if (error) {
        return errorResponse("Failed to delete conversation")
      }

      return jsonResponse({ success: true })
    }

    return errorResponse("Method not allowed", 405)
  } catch (error) {
    console.error("conversations error:", error instanceof Error ? error.message : "unknown")
    return errorResponse("Something went wrong. Please try again.")
  }
})
