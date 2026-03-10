import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts"
import { adminDb } from "../_shared/db.ts"
const OWNER_EMAIL = "liam.c.harvey72@gmail.com"

async function sendEmailNotification(name: string, email: string, message: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY")
  if (!resendKey) return

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Spotlight Feedback <onboarding@resend.dev>",
        to: OWNER_EMAIL,
        subject: `Spotlight Feedback from ${name}`,
        html: `
          <h2>New Spotlight Feedback</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email || "Not provided"}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br/>")}</p>
          <hr/>
          <p style="color:#888;font-size:12px;">Sent from spotlight-email-ai.com feedback form</p>
        `,
      }),
    })
  } catch {
    // Best-effort — don't fail the request
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405)
  }

  try {
    const { name, email, message } = await req.json()

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return errorResponse("Message is required", 400)
    }
    if (message.length > 2000) {
      return errorResponse("Message too long (max 2000 chars)", 400)
    }
    if (name && typeof name === "string" && name.length > 100) {
      return errorResponse("Name too long (max 100 chars)", 400)
    }
    if (email && typeof email === "string" && email.length > 200) {
      return errorResponse("Email too long", 400)
    }

    const safeName = (name || "Anonymous").substring(0, 100)
    const safeEmail = (email || "").substring(0, 200)
    const safeMessage = message.substring(0, 2000)

    // Store in database
    const { error } = await adminDb
      .from("feedback")
      .insert({
        name: safeName,
        email: safeEmail,
        message: safeMessage,
      })

    if (error) {
      console.error("feedback insert error:", error.message)
      return errorResponse("Failed to submit feedback")
    }

    // Send email notification (best-effort)
    await sendEmailNotification(safeName, safeEmail, safeMessage)

    return jsonResponse({ success: true, message: "Thanks for your feedback!" })
  } catch (err) {
    console.error("feedback error:", err instanceof Error ? err.message : "unknown")
    return errorResponse("Something went wrong. Please try again.")
  }
})
