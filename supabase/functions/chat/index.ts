import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCors, errorResponse } from "../_shared/cors.ts"
import { getAuthenticatedUser, isErrorResponse } from "../_shared/auth.ts"
import { adminDb } from "../_shared/db.ts"
import { getGmailToken } from "../_shared/token.ts"
import { getRecentEmails, searchEmails } from "../_shared/gmail.ts"
import {
  SYSTEM_PROMPT,
  streamChatCompletion,
  buildEmailContext,
  parseUserIntent,
  categorizeEmails,
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
    if (message.length > 5000) {
      return errorResponse("Message too long (max 5,000 chars)", 400)
    }

    // 0. Check subscription tier and set daily limit
    const FREE_LIMIT = 10
    const PRO_LIMIT = 50
    const { data: tierData } = await adminDb
      .from("user_settings")
      .select("subscription_tier")
      .eq("user_id", auth.userId)
      .single()

    const isPro = tierData?.subscription_tier === "pro"
    const DAILY_LIMIT = isPro ? PRO_LIMIT : FREE_LIMIT
    const today = new Date().toISOString().split("T")[0]

    const { data: countResult, error: usageErr } = await adminDb.rpc(
      "increment_daily_usage",
      { p_user_id: auth.userId, p_date: today, p_limit: DAILY_LIMIT, p_type: "chat" }
    )

    if (usageErr) {
      console.error("Rate limit check failed:", usageErr.message)
    } else if (countResult !== null && countResult > DAILY_LIMIT) {
      return errorResponse(
        isPro
          ? `Daily limit reached (${PRO_LIMIT} messages). Resets at midnight UTC.`
          : `Daily limit reached (${FREE_LIMIT} messages). Upgrade to Pro for ${PRO_LIMIT}/day!`,
        429
      )
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

    // 4. Parse intent — determines what emails to fetch
    const intent = await parseUserIntent(message, history)

    // 5. Always fetch emails — never skip. If intent is "none", fetch recent as context.
    let emailContext = ""
    try {
      const accessToken = await getGmailToken(auth.userId)
      let emails

      if (intent.action === "search" && intent.query) {
        emails = await searchEmails(
          accessToken,
          intent.query,
          intent.maxResults ?? 20
        )
        // If search returned few results, also fetch recent for broader context
        if (emails.length < 5) {
          const recent = await getRecentEmails(accessToken, 25)
          const existingIds = new Set(emails.map((e) => e.id))
          for (const r of recent) {
            if (!existingIds.has(r.id)) emails.push(r)
          }
        }
      } else {
        emails = await getRecentEmails(
          accessToken,
          intent.maxResults ?? 50
        )
      }

      // Categorize emails with AI (non-blocking — if it fails, emails display without categories)
      let categories: Record<string, string> = {}
      try {
        const emailsToProcess = emails.slice(0, 25)
        categories = await categorizeEmails(
          emailsToProcess.filter((e) => e.id).map((e) => ({
            id: e.id!,
            from: e.from,
            subject: e.subject,
            snippet: e.snippet,
          }))
        )
      } catch (catErr) {
        console.error("[Chat] Categorization failed:", catErr instanceof Error ? catErr.message : "unknown")
      }

      emailContext = buildEmailContext(emails.slice(0, 25), categories)
    } catch (err) {
      console.error("[Chat] Email fetch failed:", err instanceof Error ? err.message : "unknown")
      emailContext = "\n\n---\n**Note:** I was unable to access the user's Gmail inbox due to a technical error. Please let the user know you couldn't retrieve their emails and suggest they try again.\n---\n"
    }

    // 6. Load user's AI personality setting
    let personalityPrompt = ""
    try {
      const { data: settings } = await adminDb
        .from("user_settings")
        .select("ai_personality")
        .eq("user_id", auth.userId)
        .single()
      if (settings?.ai_personality) {
        personalityPrompt = `\n\n## Custom Personality Instructions\nThe user has configured the following personality/behavior for you. Follow these instructions for ALL responses:\n${settings.ai_personality}\n`
      }
    } catch {
      // No settings found, use default personality
    }

    // 7. Build messages for AI
    const aiMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT + personalityPrompt + emailContext },
      ...history.slice(-10),
    ]

    // 8. Stream response via SSE
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

          // 9. Store assistant response
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
        ...getCorsHeaders(req),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat error:", error instanceof Error ? error.message : "unknown")
    return errorResponse("Something went wrong. Please try again.")
  }
})
