import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export function configureRuntimeSource(source, value, { supabaseUrl = "", supabaseAnonKey = "" } = {}) {
  const requestedOrigin = String(value || "").trim().replace(/\/+$/, "");
  if (requestedOrigin && !/^https:\/\//.test(requestedOrigin)) {
    throw new Error("PLAYSPUTNIK_API_ORIGIN must be an HTTPS origin");
  }
  const requestedSupabaseUrl = String(supabaseUrl || "").trim().replace(/\/+$/, "");
  const requestedSupabaseKey = String(supabaseAnonKey || "").trim();
  if (Boolean(requestedSupabaseUrl) !== Boolean(requestedSupabaseKey)) {
    throw new Error("Supabase URL and public anon key must be configured together");
  }
  if (requestedSupabaseUrl && !/^https:\/\/.+\.supabase\.co$/i.test(requestedSupabaseUrl)) {
    throw new Error("PLAYSPUTNIK_SUPABASE_URL must be an HTTPS Supabase project URL");
  }
  let next = source.replace(/^(\s*)apiOrigin:\s*"[^"]*"/m, `$1apiOrigin: "${requestedOrigin}"`);
  if (next === source && requestedOrigin) throw new Error("runtime-config.js apiOrigin field was not found");
  if (requestedSupabaseUrl) {
    next = next
      .replace(/^(\s*)supabaseUrl:\s*"[^"]*"/m, `$1supabaseUrl: "${requestedSupabaseUrl}"`)
      .replace(/^(\s*)supabaseAnonKey:\s*"[^"]*"/m, `$1supabaseAnonKey: "${requestedSupabaseKey}"`);
    if (!next.includes(`supabaseUrl: "${requestedSupabaseUrl}"`) || !next.includes(`supabaseAnonKey: "${requestedSupabaseKey}"`)) {
      throw new Error("runtime-config.js Supabase fields were not found");
    }
  }
  return { next, requestedOrigin, requestedSupabaseUrl };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = new URL("../runtime-config.js", import.meta.url);
  const current = await readFile(file, "utf8");
  const { next, requestedOrigin, requestedSupabaseUrl } = configureRuntimeSource(current, process.env.PLAYSPUTNIK_API_ORIGIN, {
    supabaseUrl: process.env.PLAYSPUTNIK_SUPABASE_URL,
    supabaseAnonKey: process.env.PLAYSPUTNIK_SUPABASE_ANON_KEY,
  });
  await writeFile(file, next);
  console.log(requestedOrigin ? "Runtime API origin configured for deployment." : "Runtime API origin left empty; local fallback remains active.");
  console.log(requestedSupabaseUrl ? "Public account project configured for deployment." : "Account project left empty; local-only profile remains active.");
}
