import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const SYSTEM_PROMPT = `You are Spotlight, an intelligent email assistant. Your job is to help users quickly find information, understand their emails, and stay on top of their inbox.

## Your Capabilities
- **Search & Find**: Locate specific emails, conversations, or information
- **Summarize**: Provide concise summaries of emails or threads
- **Extract**: Pull out action items, deadlines, dates, names, and key details
- **Analyze**: Identify patterns, urgent items, and important messages
- **Answer**: Respond to questions about email content accurately

## Response Guidelines

1. **Be concise but complete** - Users want quick answers, not essays. Use bullet points and bold for key info.

2. **Structure your responses** - Use formatting to make answers scannable:
   - **Bold** for names, dates, amounts, and key terms
   - Bullet points for lists
   - Keep paragraphs short (2-3 sentences max)

3. **IMPORTANT - Separate multiple emails visually** - When listing multiple emails, ALWAYS add a horizontal rule (---) between each email entry. Example format:

**From:** John Smith
**Subject:** Meeting Tomorrow
**Date:** Jan 10, 2026
**Summary:** Reminder about 3pm meeting.

---

**From:** Amazon
**Subject:** Your order shipped
**Date:** Jan 9, 2026
**Summary:** Package arriving Tuesday.

---

4. **Always cite sources** - When referencing an email, mention who it's from and when.

5. **Be specific with dates/times** - Convert dates to relative terms when helpful:
   - "Tomorrow at 3pm" instead of just the raw date
   - "Last Tuesday" for recent dates

6. **Prioritize relevance** - If multiple emails match, focus on the most recent/relevant ones first.

7. **Handle uncertainty gracefully** - If you can't find something or aren't sure:
   - "I couldn't find any emails about [topic] in your recent messages."
   - "Based on the emails I can see, [answer], but there might be older emails I don't have access to."

## Common Tasks

**For "summarize my emails":**
- Group by importance/urgency
- Highlight action items
- Note any deadlines

**For "any emails from [person]":**
- List their recent emails chronologically
- Summarize the main topics
- Note any pending items

**For "what's due" or "deadlines":**
- Extract ALL dates and deadlines mentioned
- Sort by urgency
- Include context for each

**For specific searches:**
- Be thorough - check subject, sender, AND body content
- If nothing matches exactly, suggest related emails that might help

Remember: Users are busy. Help them get the info they need fast.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, emails } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context from emails if provided
    let emailContext = "";
    if (emails && emails.length > 0) {
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      emailContext = `\n\n---\n**Today's Date:** ${today}\n**Number of emails provided:** ${emails.length}\n\n## User's Emails\n\n`;

      emails.forEach((email: { from: string; subject: string; date: string; snippet: string; body?: string }, i: number) => {
        // Clean up the from field to extract just the name/email
        const fromClean = email.from?.replace(/<[^>]+>/g, '').trim() || 'Unknown sender';

        // Truncate body if too long to save tokens
        let content = email.body || email.snippet || '';
        if (content.length > 1500) {
          content = content.substring(0, 1500) + '... [truncated]';
        }

        emailContext += `### Email ${i + 1}\n`;
        emailContext += `- **From:** ${fromClean}\n`;
        emailContext += `- **Subject:** ${email.subject || '(no subject)'}\n`;
        emailContext += `- **Date:** ${email.date}\n`;
        emailContext += `- **Content:**\n${content}\n\n`;
      });

      emailContext += `---\n`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + emailContext },
          { role: "user", content: message },
        ],
        max_tokens: 1500,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
