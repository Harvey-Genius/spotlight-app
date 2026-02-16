import { adminDb } from "./db.ts"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

interface TokenData {
  access_token: string
  refresh_token: string | null
  expires_at: string | null
}

export async function getGmailToken(userId: string): Promise<string> {
  const { data, error } = await adminDb
    .from("users")
    .select("gmail_access_token, gmail_refresh_token, gmail_token_expires_at")
    .eq("id", userId)
    .single()

  if (error || !data?.gmail_access_token) {
    throw new Error("Gmail not connected. Please sign in with Google.")
  }

  // Check if token is expired (with 5 min buffer)
  if (data.gmail_token_expires_at) {
    const expiresAt = new Date(data.gmail_token_expires_at)
    const now = new Date()
    const bufferMs = 5 * 60 * 1000
    if (expiresAt.getTime() - bufferMs < now.getTime()) {
      return await refreshGmailToken(userId, data.gmail_refresh_token)
    }
  }

  return data.gmail_access_token
}

async function refreshGmailToken(
  userId: string,
  refreshToken: string | null
): Promise<string> {
  if (!refreshToken) {
    throw new Error("Gmail session expired. Please sign in again.")
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth not configured on server")
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to refresh Gmail token. Please sign in again.")
  }

  const tokenData = await response.json()
  const expiresAt = new Date(
    Date.now() + (tokenData.expires_in ?? 3600) * 1000
  ).toISOString()

  await storeGmailTokens(userId, {
    access_token: tokenData.access_token,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  })

  return tokenData.access_token
}

export async function storeGmailTokens(
  userId: string,
  tokens: TokenData
): Promise<void> {
  const { error } = await adminDb
    .from("users")
    .update({
      gmail_access_token: tokens.access_token,
      gmail_refresh_token: tokens.refresh_token,
      gmail_token_expires_at: tokens.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    throw new Error("Failed to store Gmail tokens")
  }
}
