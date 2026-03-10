import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts"
import { getAuthenticatedUser, isErrorResponse } from "../_shared/auth.ts"
import { adminDb } from "../_shared/db.ts"
import { getGmailToken } from "../_shared/token.ts"
import { getRecentEmails } from "../_shared/gmail.ts"
import type { Email } from "../_shared/gmail.ts"
interface NotificationRule {
  id: string
  rule_type: "from" | "subject" | "contains"
  value: string
  enabled: boolean
}

interface MatchedEmail {
  gmail_message_id: string
  from: string
  subject: string
  snippet: string
  rule_type: string
  rule_value: string
}

function emailMatchesRule(email: Email, rule: NotificationRule): boolean {
  const val = rule.value.toLowerCase()

  switch (rule.rule_type) {
    case "from":
      return email.from.toLowerCase().includes(val)

    case "subject":
      return email.subject.toLowerCase().includes(val)

    case "contains": {
      // Support comma-separated terms — match any
      const terms = val
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      const searchText =
        `${email.from} ${email.subject} ${email.snippet}`.toLowerCase()
      return terms.some((term) => searchText.includes(term))
    }

    default:
      return false
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await getAuthenticatedUser(req)
    if (isErrorResponse(auth)) return auth

    // 1. Check if notifications are enabled
    const { data: settings } = await adminDb
      .from("user_settings")
      .select("notifications_enabled")
      .eq("user_id", auth.userId)
      .single()

    if (!settings?.notifications_enabled) {
      return jsonResponse({ matches: [] })
    }

    // 2. Get user's enabled rules
    const { data: rules } = await adminDb
      .from("notification_rules")
      .select("id, rule_type, value, enabled")
      .eq("user_id", auth.userId)
      .eq("enabled", true)

    if (!rules || rules.length === 0) {
      return jsonResponse({ matches: [] })
    }

    // 3. Fetch recent emails (10 — keep it lightweight)
    const accessToken = await getGmailToken(auth.userId)
    const emails = await getRecentEmails(accessToken, 10)

    // 4. Get already-notified message IDs
    const { data: notifiedRows } = await adminDb
      .from("notified_emails")
      .select("gmail_message_id")
      .eq("user_id", auth.userId)

    const alreadyNotified = new Set(
      (notifiedRows || []).map(
        (r: { gmail_message_id: string }) => r.gmail_message_id
      )
    )

    // 5. Match emails against rules, excluding already-notified
    const matches: MatchedEmail[] = []
    for (const email of emails) {
      if (alreadyNotified.has(email.id)) continue

      for (const rule of rules as NotificationRule[]) {
        if (emailMatchesRule(email, rule)) {
          matches.push({
            gmail_message_id: email.id,
            from: email.from,
            subject: email.subject,
            snippet: email.snippet,
            rule_type: rule.rule_type,
            rule_value: rule.value,
          })
          break // One notification per email
        }
      }
    }

    // 6. Record these as notified
    if (matches.length > 0) {
      const inserts = matches.map((m) => ({
        user_id: auth.userId,
        gmail_message_id: m.gmail_message_id,
      }))
      await adminDb
        .from("notified_emails")
        .upsert(inserts, { onConflict: "user_id,gmail_message_id" })
    }

    return jsonResponse({ matches })
  } catch (error) {
    console.error("check-notifications error:", error instanceof Error ? error.message : "unknown")
    // Don't return error to background worker — just return empty
    return jsonResponse({ matches: [] })
  }
})
