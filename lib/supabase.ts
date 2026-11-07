import { createClient } from "@supabase/supabase-js";

// Server-side client using the service role key. Access control is enforced
// in the hybrid_search call (allowed_levels) and by RLS for any other client.
export const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
