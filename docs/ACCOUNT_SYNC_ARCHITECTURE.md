# Account and sync architecture

Decision: use Supabase Auth plus Postgres Row Level Security for private
cross-device profile memory. Keep the existing Cloudflare Worker for RAWG,
AI, and public product APIs.

## Why this stack

- Supabase Auth supports social login and magic links without PlaySputnik
  handling passwords.
- Postgres RLS binds every profile row to `auth.uid()`, including direct
  browser API calls made with the public publishable/anon key.
- One JSON profile envelope preserves the local-first memory contract and
  avoids splitting hundreds of evolving state fields into premature tables.
- The free plan is sufficient for prototype validation. Treat free-plan pause,
  absent automatic backups, and future pricing as operational constraints.

## Security boundary

- Browser: public Supabase URL and publishable/anon key only. These are config,
  not secrets; they are safe only because RLS is mandatory.
- Never expose `service_role`, database credentials, OAuth provider secrets,
  or Cloudflare secrets in Pages, localStorage, or the repository.
- `backend/supabase-profile-schema.sql` enables and forces RLS, revokes anon
  table access, and allows authenticated users to access only their own row.
- Profile writes use `save_profile_envelope(expected_revision, envelope)`.
  The row is locked and updated only when the expected server revision still
  matches. A stale device receives the current envelope as a conflict instead
  of overwriting it.
- The profile payload is capped at 2 MiB and validates format/version.

## Client flow

1. The app remains fully local before sign-in.
2. A future auth UI obtains a Supabase session via the official SDK using PKCE.
3. On first sign-in, compare local and remote envelopes. Never upload or
   download before the user reviews a different-profile or divergent result.
4. Save with the last observed remote revision. On `conflict`, feed the remote
   envelope into the existing local conflict-review UI.
5. Sign-out removes the session but keeps local memory unless the user chooses
   otherwise. Delete cloud memory uses `delete_profile_memory()`.
6. Full account deletion must also remove the Supabase Auth user through a
   separately reviewed server-side endpoint; it is not implemented yet.

## Configuration still required

1. Create the Supabase project and run the SQL migration.
2. Configure exact production and localhost redirect URLs.
3. Enable the chosen login methods. Start with magic link; add Google after
   OAuth consent/redirect configuration.
4. Put only `supabaseUrl` and `supabaseAnonKey` in the generated public runtime
   config. Keep them empty until the database and RLS tests have passed.
5. Add the official Supabase JS client locally (not a runtime CDN dependency),
   implement PKCE session handling, account deletion, and two-browser testing.

Until those steps are complete, `PlaySputnikAccount.accountCapabilities()`
reports the account as unavailable and the current Cloudflare sync endpoint
continues rejecting all profile data.

## Primary references

- Supabase Auth: https://supabase.com/docs/guides/auth
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Redirect URL allow-list: https://supabase.com/docs/guides/auth/redirect-urls
- Current plan limits: https://supabase.com/pricing
