// Supabase browser client
// Use esm.sh to avoid nested CDN sub-imports that some hosts/blockers can break.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

// Publishable/anon key only (safe for client). Do not use service role keys here.
const SUPABASE_URL = "https://ugldbwwpjcjtfhlpxbip.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbGRid3dwamNqdGZobHB4YmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjQ0MDEsImV4cCI6MjA3OTI0MDQwMX0.T8FmQhyD4uXkKATpG13kzT8L6qA0pUfk_1G1Z0ES-Rs";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase URL or anon key.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
