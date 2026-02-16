import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

export const adminDb = createClient(supabaseUrl, supabaseServiceKey)

export function getUserClient(authHeader: string) {
  return createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  })
}
