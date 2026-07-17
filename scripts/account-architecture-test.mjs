import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-account.js", import.meta.url), "utf8");
const requests = [];
const fakeFetch = async (url, options = {}) => {
  requests.push({ url, options });
  if (url.includes("save_profile_envelope")) return Response.json({ status: "saved", revision: 2 });
  if (url.includes("delete_profile_memory")) return Response.json({ status: "deleted" });
  return Response.json([{ envelope: { profileId: "profile_test", revision: 1 }, revision: 1 }]);
};
const context = {
  window: { PlaySputnikRuntime: {}, fetch: fakeFetch },
  Response,
};
vm.runInNewContext(source, context, { filename: "src/app-account.js" });

const { accountCapabilities, createProfileStore } = context.window.PlaySputnikAccount;
assert.equal(accountCapabilities({}).configured, false, "account must stay disabled without explicit public config");

const config = {
  supabaseUrl: "https://playsputnik-test.supabase.co/",
  supabaseAnonKey: "public-test-key-with-safe-length",
};
const store = createProfileStore({ config, fetchImpl: fakeFetch });
assert.equal(store.capabilities.configured, true);
assert.equal((await store.load("user-jwt")).revision, 1);
await store.save({ format: "playsputnik-profile-envelope", revision: 2 }, { accessToken: "user-jwt", expectedRevision: 1 });
await store.remove("user-jwt");

assert.equal(requests.length, 3);
requests.forEach(({ options }) => {
  assert.equal(options.headers.apikey, config.supabaseAnonKey);
  assert.equal(options.headers.Authorization, "Bearer user-jwt");
  assert(!JSON.stringify(options).includes("service_role"), "browser transport must never use a service-role credential");
});
assert.deepEqual(JSON.parse(requests[1].options.body), {
  p_expected_revision: 1,
  p_envelope: { format: "playsputnik-profile-envelope", revision: 2 },
});

const sql = await readFile(new URL("../backend/supabase-profile-schema.sql", import.meta.url), "utf8");
[
  "enable row level security",
  "force row level security",
  "auth.uid()",
  "p_expected_revision",
  "for update",
  "security invoker",
  "revoke all on public.user_profiles from anon",
  "octet_length(p_envelope::text) > 2097152",
].forEach((contract) => assert(sql.includes(contract), `missing account security contract: ${contract}`));
assert(!/grant\s+.+\s+to\s+service_role/i.test(sql), "schema must not grant browser access through service_role");

console.log("✅ Supabase account transport stays disabled by default and profile storage enforces JWT, RLS, size, and revision contracts");
