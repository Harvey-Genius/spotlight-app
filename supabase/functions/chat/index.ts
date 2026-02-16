import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors, errorResponse } from "../_shared/cors.ts"
import { getAuthenticatedUser, isErrorResponse } from "../_shared/auth.ts"
import { adminDb } from "../_shared/db.ts"
import { getGmailToken } from "../_shared/token.ts"
import { getRecentEmails, searchEmails } from "../_shared/gmail.ts"
import {
  SYSTEM_PROMPT,
  streamChatCompletion,
  buildEmailContext,
  parseUserIntent,
} from "../_shared/openai.ts"

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await getAuthenticatedUser(req)
    if (isErrorResponse(auth)) return auth

    const { conversation_id, message } = await req.json()

    if (!message || typeof message !== "string") {
      return errorResponse("Message is required", 400)
    }

    // 1. Load or create conversation
    let convId = conversation_id
    if (!convId) {
      const { data, error } = await adminDb
        .from("conversations")
        .insert({ user_id: auth.userId, title: message.substring(0, 80) })
        .select("id")
        .single()

      if (error) return errorResponse("Failed to create conversation")
      convId = data.id
    } else {
      // Verify ownership
      const { data } = await adminDb
        .from("conversations")
        .select("id")
        .eq("id", convId)
        .eq("user_id", auth.userId)
        .single()

      if (!data) return errorResponse("Conversation not found", 404)
    }

    // 2. Store user message
    await adminDb.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    })

    // 3. Load conversation history
    const { data: historyRows } = await adminDb
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20)

    const history = (historyRows || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    }))

    // 4. Parse intent — what emails to fetch?
    const intent = await parseUserIntent(message, history)

    // 5. Fetch emails if needed
    let emailContext = ""
    if (intent.action !== "none") {
      try {
        const accessToken = await getGmailToken(auth.userId)
        let emails

        if (intent.action === "search" && intent.query) {
          emails = await searchEmails(
            accessToken,
            intent.query,
            intent.maxResults ?? 20
          )
        } else {
          emails = await getRecentEmails(
            accessToken,
            intent.maxResults ?? 50
          )
        }

        emailContext = buildEmailContext(emails.slice(0, 25))
      } catch (err) {
        console.error("Email fetch error:", err)
        // Continue without emails — AI will mention it can't access inbox
      }
    }

    // 6. Build messages for AI
    const aiMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT + emailContext },
      ...history.slice(-10),
    ]

    // 7. Stream response via SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const fullContent = await streamChatCompletion(
            aiMessages,
            (chunk) => {
              const event = JSON.stringify({ type: "chunk", content: chunk })
              controller.enqueue(
                encoder.encode(`data: ${event}\n\n`)
              )
            }
          )

          // 8. Store assistant response
          const { data: savedMsg } = await adminDb
            .from("messages")
            .insert({
              conversation_id: convId,
              role: "assistant",
              content: fullContent,
            })
            .select("id")
            .single()

          // Update conversation timestamp
          await adminDb
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", convId)

          // Send done event
          const doneEvent = JSON.stringify({
            type: "done",
            conversation_id: convId,
            message_id: savedMsg?.id,
          })
          controller.enqueue(encoder.encode(`data: ${doneEvent}\n\n`))
          controller.close()
        } catch (err) {
          console.error("Stream error:", err)
          const errEvent = JSON.stringify({
            type: "error",
            content:
              err instanceof Error ? err.message : "Something went wrong",
          })
          controller.enqueue(encoder.encode(`data: ${errEvent}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat error:", error)
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error"
    )
  }
})
