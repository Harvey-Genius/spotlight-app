const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

export async function getRecentEmails(accessToken, maxResults = 50) {
  const response = await fetch(
    `${GMAIL_API_BASE}/messages?maxResults=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch emails')
  }

  const data = await response.json()
  const messages = data.messages || []

  // Fetch full details for each message
  const emails = await getEmails(accessToken, messages.map(m => m.id))
  return emails
}

export async function searchEmails(accessToken, query, maxResults = 20) {
  const response = await fetch(
    `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to search emails')
  }

  const data = await response.json()
  const messages = data.messages || []

  if (messages.length === 0) {
    return []
  }

  // Fetch full details for each message
  const emails = await getEmails(accessToken, messages.map(m => m.id))
  return emails
}

export async function getEmail(accessToken, messageId, retries = 3) {
  const response = await fetch(
    `${GMAIL_API_BASE}/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (response.status === 429 && retries > 0) {
    const delay = (4 - retries) * 1000 // 1s, 2s, 3s backoff
    await new Promise(resolve => setTimeout(resolve, delay))
    return getEmail(accessToken, messageId, retries - 1)
  }

  if (!response.ok) {
    throw new Error('Failed to fetch email')
  }

  const data = await response.json()

  // Extract headers
  const headers = data.payload?.headers || []
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''

  // Extract body
  let body = ''
  if (data.payload?.body?.data) {
    body = atob(data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
  } else if (data.payload?.parts) {
    const textPart = data.payload.parts.find(p => p.mimeType === 'text/plain')
    if (textPart?.body?.data) {
      body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
    }
  }

  return {
    id: data.id,
    threadId: data.threadId,
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    date: getHeader('Date'),
    snippet: data.snippet,
    body: body,
  }
}

export async function getEmails(accessToken, messageIds) {
  const emails = []
  const batchSize = 25 // Fetch 25 at a time to avoid rate limits

  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(id => getEmail(accessToken, id).catch(err => {
        console.error(`Failed to fetch email ${id}:`, err)
        return null
      }))
    )
    emails.push(...batchResults.filter(Boolean))

    // Add a small delay between batches to avoid rate limits
    if (i + batchSize < messageIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return emails
}
