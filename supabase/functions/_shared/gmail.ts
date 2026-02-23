const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

function decodeBase64Url(data: string): string {
  return atob(data.replace(/-/g, "+").replace(/_/g, "/"))
}

// deno-lint-ignore no-explicit-any
function extractBody(payload: any): string {
  // Direct body (simple messages)
  if (payload?.body?.data) {
    return decodeBase64Url(payload.body.data)
  }

  // Multipart — search recursively for text/plain, fallback to text/html
  if (payload?.parts) {
    // First try text/plain
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data)
      }
    }
    // Then try text/html
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        // Strip HTML tags for a rough plaintext version
        const html = decodeBase64Url(part.body.data)
        return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      }
    }
    // Recurse into nested multipart parts
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part)
        if (nested) return nested
      }
    }
  }
  return ""
}

export interface Email {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  date: string
  snippet: string
  body: string
}

export async function getRecentEmails(
  accessToken: string,
  maxResults = 50
): Promise<Email[]> {
  const response = await fetch(
    `${GMAIL_API_BASE}/messages?maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!response.ok) {
    const errText = await response.text()
    console.error("[Gmail] getRecentEmails failed:", response.status, errText)
    throw new Error(`Failed to fetch emails: ${response.status} ${errText}`)
  }

  const data = await response.json()
  const messages: Array<{ id: string }> = data.messages || []
  console.log("[Gmail] Listed", messages.length, "message IDs")
  return getEmails(accessToken, messages.map((m) => m.id))
}

export async function searchEmails(
  accessToken: string,
  query: string,
  maxResults = 20
): Promise<Email[]> {
  const response = await fetch(
    `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!response.ok) {
    const errText = await response.text()
    console.error("[Gmail] searchEmails failed:", response.status, errText)
    throw new Error(`Failed to search emails: ${response.status} ${errText}`)
  }

  const data = await response.json()
  const messages: Array<{ id: string }> = data.messages || []
  console.log("[Gmail] Search found", messages.length, "message IDs for query:", query)

  if (messages.length === 0) return []

  return getEmails(accessToken, messages.map((m) => m.id))
}

function encodeBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function buildRawMessage(
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string,
  references?: string,
  from?: string
): string {
  const lines: string[] = []
  if (from) lines.push(`From: ${from}`)
  lines.push(`To: ${to}`)
  lines.push(`Subject: ${subject}`)
  lines.push("Content-Type: text/plain; charset=UTF-8")
  if (inReplyTo) {
    lines.push(`In-Reply-To: ${inReplyTo}`)
    lines.push(`References: ${references || inReplyTo}`)
  }
  lines.push("")
  lines.push(body)
  return encodeBase64Url(lines.join("\r\n"))
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  replyToMessageId?: string
): Promise<{ id: string; threadId: string }> {
  let inReplyTo: string | undefined
  let references: string | undefined

  // If replying, fetch the Message-ID header of the original
  if (replyToMessageId) {
    const origResponse = await fetch(
      `${GMAIL_API_BASE}/messages/${replyToMessageId}?format=metadata&metadataHeaders=Message-ID`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (origResponse.ok) {
      const origData = await origResponse.json()
      const msgIdHeader = origData.payload?.headers?.find(
        (h: { name: string; value: string }) =>
          h.name.toLowerCase() === "message-id"
      )
      if (msgIdHeader) {
        inReplyTo = msgIdHeader.value
        references = msgIdHeader.value
      }
    }
  }

  const raw = buildRawMessage(to, subject, body, inReplyTo, references)

  const response = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error("[Gmail] sendEmail failed:", response.status, errText)
    throw new Error(`Failed to send email: ${response.status}`)
  }

  const data = await response.json()
  return { id: data.id, threadId: data.threadId }
}

export async function createDraft(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  replyToMessageId?: string
): Promise<{ id: string; message: { id: string; threadId: string } }> {
  let inReplyTo: string | undefined
  let references: string | undefined

  if (replyToMessageId) {
    const origResponse = await fetch(
      `${GMAIL_API_BASE}/messages/${replyToMessageId}?format=metadata&metadataHeaders=Message-ID`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (origResponse.ok) {
      const origData = await origResponse.json()
      const msgIdHeader = origData.payload?.headers?.find(
        (h: { name: string; value: string }) =>
          h.name.toLowerCase() === "message-id"
      )
      if (msgIdHeader) {
        inReplyTo = msgIdHeader.value
        references = msgIdHeader.value
      }
    }
  }

  const raw = buildRawMessage(to, subject, body, inReplyTo, references)

  const response = await fetch(`${GMAIL_API_BASE}/drafts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { raw } }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error("[Gmail] createDraft failed:", response.status, errText)
    throw new Error(`Failed to create draft: ${response.status}`)
  }

  return response.json()
}

async function getEmail(
  accessToken: string,
  messageId: string,
  retries = 3
): Promise<Email | null> {
  const response = await fetch(
    `${GMAIL_API_BASE}/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (response.status === 429 && retries > 0) {
    const delay = (4 - retries) * 1000
    await new Promise((resolve) => setTimeout(resolve, delay))
    return getEmail(accessToken, messageId, retries - 1)
  }

  if (!response.ok) return null

  const data = await response.json()
  const headers: Array<{ name: string; value: string }> =
    data.payload?.headers || []
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ||
    ""

  let body = ""
  try {
    body = extractBody(data.payload)
  } catch (e) {
    console.error("[Gmail] Body decode error for message", messageId, e)
  }

  return {
    id: data.id,
    threadId: data.threadId,
    from: getHeader("From"),
    to: getHeader("To"),
    subject: getHeader("Subject"),
    date: getHeader("Date"),
    snippet: data.snippet,
    body,
  }
}

async function getEmails(
  accessToken: string,
  messageIds: string[]
): Promise<Email[]> {
  const emails: Email[] = []
  const batchSize = 25

  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((id) => getEmail(accessToken, id))
    )
    emails.push(...batchResults.filter((e): e is Email => e !== null))

    if (i + batchSize < messageIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return emails
}
