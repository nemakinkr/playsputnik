/* Runtime deployment config. This file contains public URLs only, never keys. */
window.PlaySputnikRuntime = Object.freeze({
  // Example after Worker deploy:
  // apiOrigin: "https://playsputnik-api.<account>.workers.dev",
  apiOrigin: "",
  // Public Supabase project settings. Leave empty until RLS has been deployed and verified.
  supabaseUrl: "",
  supabaseAnonKey: "",
});
