const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

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
    throw new Error("Failed to fetch emails")
  }

  const data = await response.json()
  const messages: Array<{ id: string }> = data.messages || []
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
    throw new Error("Failed to search emails")
  }

  const data = await response.json()
  const messages: Array<{ id: string }> = data.messages || []

  if (messages.length === 0) return []

  return getEmails(accessToken, messages.map((m) => m.id))
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
  if (data.payload?.body?.data) {
    body = atob(data.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"))
  } else if (data.payload?.parts) {
    const textPart = data.payload.parts.find(
      (p: { mimeType: string }) => p.mimeType === "text/plain"
    )
    if (textPart?.body?.data) {
      body = atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"))
    }
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
