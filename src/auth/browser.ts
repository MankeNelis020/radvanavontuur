import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicEnv } from "@/auth/config";

export function createSupabaseBrowserClient() {
  const env = supabasePublicEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.key);
}
