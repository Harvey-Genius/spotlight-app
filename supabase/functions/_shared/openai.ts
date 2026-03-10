const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export const EMAIL_CATEGORIES = {
  important: { label: "Important", color: "red" },
  work: { label: "Work/School", color: "blue" },
  social: { label: "Social", color: "green" },
  promotions: { label: "Promotions", color: "yellow" },
  updates: { label: "Updates", color: "purple" },
  finance: { label: "Finance", color: "orange" },
  personal: { label: "Personal", color: "pink" },
} as const

export type EmailCategory = keyof typeof EMAIL_CATEGORIES

interface EmailForCategorization {
  id: string
  from: string
  subject: string
  snippet?: string
}

export async function categorizeEmails(
  emails: EmailForCategorization[]
): Promise<Record<string, EmailCategory>> {
  if (!OPENAI_API_KEY || emails.length === 0) return {}

  const emailSummaries = emails
    .map(
      (e, i) =>
        `${i + 1}. [ID:${e.id}] From: ${e.from} | Subject: ${e.subject} | Snippet: ${(e.snippet || "").substring(0, 100)}`
    )
    .join("\n")

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Categorize each email into exactly one category. Categories: important, work, social, promotions, updates, finance, personal.
Return JSON: { "categories": { "<email_id>": "<category>", ... } }
Rules:
- "important": urgent, time-sensitive, requires immediate action
- "work": work/school/academic/professional related
- "social": social media notifications, friend messages, group chats
- "promotions": marketing, sales, deals, newsletters, advertising
- "updates": automated notifications, shipping, account updates, confirmations
- "finance": bills, banking, payments, invoices, receipts
- "personal": personal correspondence not fitting other categories`,
          },
          { role: "user", content: emailSummaries },
        ],
        max_tokens: 500,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      console.error("[Categorize] OpenAI API error:", response.status)
      return {}
    }

    const data = await response.json()
    const parsed = JSON.parse(data.choices[0]?.message?.content || "{}")
    const categories = parsed.categories || {}

    // Validate categories
    const validCategories = Object.keys(EMAIL_CATEGORIES)
    const result: Record<string, EmailCategory> = {}
    for (const [id, cat] of Object.entries(categories)) {
      if (validCategories.includes(cat as string)) {
        result[id] = cat as EmailCategory
      }
    }
    return result
  } catch (err) {
    console.error("[Categorize] Failed:", err instanceof Error ? err.message : "unknown")
    return {}
  }
}

export const SYSTEM_PROMPT = `You are Spotlight, an intelligent email assistant. Your job is to help users quickly find information, understand their emails, stay on top of their inbox, and compose or reply to emails.

## Your Capabilities
- **Search & Find**: Locate specific emails, conversations, or information
- **Summarize**: Provide concise summaries of emails or threads
- **Extract**: Pull out action items, deadlines, dates, names, and key details
- **Analyze**: Identify patterns, urgent items, and important messages
- **Answer**: Respond to questions about email content accurately
- **Draft & Send**: Compose new emails or draft replies to existing emails

## Email Composition

When the user asks you to write, draft, reply to, or send an email, include a special JSON block in your response. The system will detect it and offer action buttons.

**Format:**
\`\`\`email-action
{
  "action": "draft" or "send",
  "to": "recipient@email.com",
  "subject": "Email subject line",
  "body": "The full email body text",
  "reply_to_message_id": "optional - gmail message id if replying"
}
\`\`\`

**Rules for composing emails:**
- Default to "draft" action unless the user explicitly says "send it" or "send now"
- Always confirm the content with the user before suggesting "send"
- If replying to an email from the provided emails, include the reply_to_message_id from the email data
- Write professional, clear emails unless the user's personality setting says otherwise
- When drafting a reply, prefix the subject with "Re: " if not already present
- After the JSON block, briefly tell the user what you drafted/sent

## Response Guidelines

1. **Be concise but complete** - Users want quick answers, not essays. Use bullet points and bold for key info.

2. **Structure your responses** - Use formatting to make answers scannable:
   - **Bold** for names, dates, amounts, and key terms
   - Bullet points for lists
   - Keep paragraphs short (2-3 sentences max)

3. **IMPORTANT - Separate multiple emails visually** - When listing multiple emails, ALWAYS add a horizontal rule (---) between each email entry.

4. **Always cite sources** - When referencing an email, mention who it's from and when.

5. **Be specific with dates/times** - Convert dates to relative terms when helpful:
   - "Tomorrow at 3pm" instead of just the raw date
   - "Last Tuesday" for recent dates

6. **Prioritize relevance** - If multiple emails match, focus on the most recent/relevant ones first.

7. **Handle uncertainty gracefully** - If you can't find something:
   - "I couldn't find any emails about [topic] in your recent messages."
   - "Based on the emails I can see, [answer], but there might be older emails I don't have access to."

8. **CRITICAL: Only reference emails provided below** - You MUST only discuss emails that are explicitly provided in the "User's Emails" section below. NEVER fabricate, invent, or hallucinate email content. If no emails are provided, tell the user you don't have access to their inbox right now.

9. **Quote real data** - When referencing emails, use actual sender names, subjects, dates, and content from the provided data. Never make up email details.

## Email Categories

Each email in your context may have a **Category** field (e.g., Important, Work/School, Social, Promotions, Updates, Finance, Personal). Use these when relevant:
- When listing emails, include the category as a bold tag before the email info: **[Work/School]**, **[Promotions]**, **[Finance]**, etc.
- When users ask about a specific category (e.g., "show my promotions", "any work emails?"), filter and show only emails matching that category.
- When summarizing the inbox, you can group emails by category for better organization.
- Always use the exact category names in the **[CategoryName]** format so they render as colored tags.

Remember: Users are busy. Help them get the info they need fast. Only reference real email data provided to you.`

export async function streamChatCompletion(
  messages: ChatMessage[],
  onChunk: (content: string) => void
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1500,
      temperature: 0.5,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("OpenAI API error:", errorText)
    throw new Error("Failed to get AI response")
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullContent = ""
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith("data: ")) continue
      const data = trimmed.slice(6)
      if (data === "[DONE]") break

      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) {
          fullContent += content
          onChunk(content)
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }

  return fullContent
}

export function buildEmailContext(
  emails: Array<{
    id?: string
    from: string
    to?: string
    subject: string
    date: string
    snippet?: string
    body?: string
  }>,
  categories?: Record<string, string>
): string {
  if (emails.length === 0) return ""

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  let context = `\n\n---\n**Today's Date:** ${today}\n**Number of emails provided:** ${emails.length}\n\n## User's Emails\n\n`

  emails.forEach((email, i) => {
    const fromClean =
      email.from?.replace(/<[^>]+>/g, "").trim() || "Unknown sender"
    let content = email.body || email.snippet || ""
    if (content.length > 1500) {
      content = content.substring(0, 1500) + "... [truncated]"
    }

    context += `### Email ${i + 1}\n`
    if (email.id) context += `- **Message ID:** ${email.id}\n`
    if (email.id && categories?.[email.id]) {
      const catKey = categories[email.id]
      const catLabel = EMAIL_CATEGORIES[catKey as EmailCategory]?.label || catKey
      context += `- **Category:** ${catLabel}\n`
    }
    context += `- **From:** ${fromClean}\n`
    if (email.to) context += `- **To:** ${email.to}\n`
    context += `- **Subject:** ${email.subject || "(no subject)"}\n`
    context += `- **Date:** ${email.date}\n`
    context += `- **Content:**\n${content}\n\n`
  })

  context += "---\n"
  return context
}

export async function parseUserIntent(
  message: string,
  conversationHistory: ChatMessage[]
): Promise<{
  action: "search" | "recent" | "none"
  query?: string
  maxResults?: number
}> {
  if (!OPENAI_API_KEY) {
    // Fallback to simple pattern matching if no API key
    return fallbackIntentParsing(message)
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You parse user messages about their email inbox into structured search intents.
Return JSON only. No other text.

Rules:
- If the user asks about emails from a person, about a topic, or wants to search: { "action": "search", "query": "<gmail search query>", "maxResults": 20 }
- If the user wants recent/latest emails or a general summary: { "action": "recent", "maxResults": 50 }
- If the user wants to reply to or compose an email about a specific person/thread: { "action": "search", "query": "<gmail query to find relevant emails>", "maxResults": 10 }
- If the user asks about a category of emails (promotions, social, work, school, finance, important, updates, personal): { "action": "recent", "maxResults": 50 }
  - Category keywords: "promotional", "promotions", "social", "work", "school", "financial", "finance", "important", "urgent", "updates", "personal", "newsletters"
- If the user is asking a follow-up, composing from scratch, or a general question: { "action": "none" }

Gmail search query syntax: "from:name", "subject:topic", "after:2024/01/01", free text, etc.`,
        },
        ...conversationHistory.slice(-4),
        { role: "user", content: message },
      ],
      max_tokens: 100,
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  })

  if (!response.ok) {
    return fallbackIntentParsing(message)
  }

  const data = await response.json()
  try {
    return JSON.parse(data.choices[0]?.message?.content || "{}")
  } catch {
    return fallbackIntentParsing(message)
  }
}

function fallbackIntentParsing(message: string): {
  action: "search" | "recent" | "none"
  query?: string
  maxResults?: number
} {
  const fromMatch = message.match(/from\s+([a-zA-Z0-9@._-]+)/i)
  const aboutMatch = message.match(/about\s+["']?([^"'?]+)["']?/i)

  if (fromMatch) {
    return { action: "search", query: `from:${fromMatch[1]}`, maxResults: 20 }
  }
  if (aboutMatch) {
    return { action: "search", query: aboutMatch[1].trim(), maxResults: 20 }
  }
  return { action: "recent", maxResults: 50 }
}
