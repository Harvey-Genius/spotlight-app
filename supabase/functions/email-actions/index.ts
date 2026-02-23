import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts"
import { getAuthenticatedUser, isErrorResponse } from "../_shared/auth.ts"
import { adminDb } from "../_shared/db.ts"
import { getGmailToken } from "../_shared/token.ts"
import { sendEmail, createDraft } from "../_shared/gmail.ts"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DAILY_SEND_LIMIT = 5

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await getAuthenticatedUser(req)
    if (isErrorResponse(auth)) return auth

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405)
    }

    const { action, to, subject, body, reply_to_message_id } = await req.json()

    if (!action || !to || !subject || !body) {
      return errorResponse("action, to, subject, and body are required", 400)
    }

    if (!["send", "draft"].includes(action)) {
      return errorResponse('action must be "send" or "draft"', 400)
    }

    // Validate email format
    if (!EMAIL_REGEX.test(to)) {
      return errorResponse("Invalid email address", 400)
    }

    // Validate field lengths
    if (typeof subject !== "string" || subject.length > 500) {
      return errorResponse("Subject too long (max 500 chars)", 400)
    }
    if (typeof body !== "string" || body.length > 50000) {
      return errorResponse("Email body too long", 400)
    }

    // Rate limit sends (5/day) — drafts are unlimited
    if (action === "send") {
      const today = new Date().toISOString().split("T")[0]

      const { data: countResult } = await adminDb.rpc(
        "increment_daily_usage",
        { p_user_id: auth.userId, p_date: today, p_limit: DAILY_SEND_LIMIT, p_type: "email_send" }
      )

      if (countResult !== null && countResult > DAILY_SEND_LIMIT) {
        return errorResponse(
          `Daily email send limit reached (${DAILY_SEND_LIMIT}/day).`,
          429
        )
      }
    }

    const accessToken = await getGmailToken(auth.userId)

    if (action === "send") {
      const result = await sendEmail(
        accessToken,
        to,
        subject,
        body,
        reply_to_message_id
      )
      return jsonResponse({ success: true, ...result })
    }

    if (action === "draft") {
      const result = await createDraft(
        accessToken,
        to,
        subject,
        body,
        reply_to_message_id
      )
      return jsonResponse({ success: true, draft_id: result.id })
    }

    return errorResponse("Unknown action", 400)
  } catch (error) {
    console.error("email-actions error:", error instanceof Error ? error.message : "unknown")
    return errorResponse("Failed to process email action. Please try again.")
  }
})
