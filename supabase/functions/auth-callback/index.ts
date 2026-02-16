import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts"
import { getAuthenticatedUser, isErrorResponse } from "../_shared/auth.ts"
import { storeGmailTokens } from "../_shared/token.ts"

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const auth = await getAuthenticatedUser(req)
    if (isErrorResponse(auth)) return auth

    const { provider_token, provider_refresh_token } = await req.json()

    if (!provider_token) {
      return errorResponse("provider_token is required", 400)
    }

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

    await storeGmailTokens(auth.userId, {
      access_token: provider_token,
      refresh_token: provider_refresh_token || null,
      expires_at: expiresAt,
    })

    return jsonResponse({ success: true })
  } catch (error) {
    console.error("auth-callback error:", error)
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error"
    )
  }
})
