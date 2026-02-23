const TWILIO_API_URL = "https://api.twilio.com/2010-04-01"

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER")

  if (!accountSid || !authToken || !fromNumber) {
    console.error("[Twilio] Missing credentials")
    return false
  }

  try {
    const response = await fetch(
      `${TWILIO_API_URL}/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + btoa(`${accountSid}:${authToken}`),
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: body,
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error("[Twilio] Send failed:", err)
      return false
    }

    return true
  } catch (err) {
    console.error("[Twilio] Error:", err instanceof Error ? err.message : "unknown")
    return false
  }
}
