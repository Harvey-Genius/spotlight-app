const ALLOWED_ORIGINS = [
  "https://spotlight-email-ai.com",
  "https://www.spotlight-email-ai.com",
  "https://spotlight-fresh.vercel.app",
]

function getOrigin(req: Request): string {
  const origin = req.headers.get("Origin") || ""
  // Allow our Vercel domain
  if (ALLOWED_ORIGINS.includes(origin)) return origin
  // Allow any chrome-extension:// origin (IDs change per user for unpacked)
  if (origin.startsWith("chrome-extension://")) return origin
  // Allow Supabase dashboard/functions calls (no origin)
  if (!origin) return "*"
  // Block everything else
  return ""
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = getOrigin(req)
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  }
}

// Legacy export for SSE streaming header spread
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: getCorsHeaders(req) })
  }
  return null
}

export function jsonResponse(
  data: unknown,
  status = 200,
  req?: Request
): Response {
  const headers = req ? getCorsHeaders(req) : corsHeaders
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  })
}

export function errorResponse(
  message: string,
  status = 500,
  req?: Request
): Response {
  return jsonResponse({ error: message }, status, req)
}
