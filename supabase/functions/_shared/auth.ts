import { getUserClient } from "./db.ts"
import { errorResponse } from "./cors.ts"

export async function getAuthenticatedUser(
  req: Request
): Promise<{ userId: string; authHeader: string } | Response> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return errorResponse("Missing authorization header", 401)
  }

  const supabase = getUserClient(authHeader)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return errorResponse("Unauthorized", 401)
  }

  return { userId: user.id, authHeader }
}

export function isErrorResponse(
  result: { userId: string; authHeader: string } | Response
): result is Response {
  return result instanceof Response
}
