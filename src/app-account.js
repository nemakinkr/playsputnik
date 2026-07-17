/* PlaySputnik Account — disabled-by-default Supabase profile transport */
"use strict";
(function () {
  const runtime = window.PlaySputnikRuntime || {};

  function normalizeConfig(config = runtime) {
    return {
      provider: "supabase",
      url: String(config.supabaseUrl || "").replace(/\/+$/, ""),
      anonKey: String(config.supabaseAnonKey || ""),
    };
  }

  function accountCapabilities(config = runtime) {
    const normalized = normalizeConfig(config);
    const configured = /^https:\/\/.+\.supabase\.co$/i.test(normalized.url) && normalized.anonKey.length >= 20;
    return {
      provider: normalized.provider,
      configured,
      authAvailable: configured,
      privateStorageAvailable: configured,
      conflictSafe: true,
    };
  }

  function createProfileStore({ config = runtime, fetchImpl = window.fetch?.bind(window) } = {}) {
    const normalized = normalizeConfig(config);
    const capabilities = accountCapabilities(config);

    function requireRequest(accessToken) {
      if (!capabilities.configured) throw new Error("Account storage is not configured");
      if (!accessToken) throw new Error("Authenticated access token is required");
      if (!fetchImpl) throw new Error("Fetch is unavailable");
      return {
        apikey: normalized.anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept-Profile": "public",
        "Content-Profile": "public",
      };
    }

    async function responseJson(response) {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || payload.error || `Account storage error ${response.status}`);
      return payload;
    }

    async function load(accessToken) {
      const response = await fetchImpl(`${normalized.url}/rest/v1/user_profiles?select=envelope,revision,updated_at&limit=1`, {
        headers: requireRequest(accessToken),
      });
      const rows = await responseJson(response);
      return Array.isArray(rows) && rows[0] ? rows[0] : null;
    }

    async function save(envelope, { accessToken, expectedRevision = 0 } = {}) {
      const response = await fetchImpl(`${normalized.url}/rest/v1/rpc/save_profile_envelope`, {
        method: "POST",
        headers: requireRequest(accessToken),
        body: JSON.stringify({ p_expected_revision: expectedRevision, p_envelope: envelope }),
      });
      return responseJson(response);
    }

    async function remove(accessToken) {
      const response = await fetchImpl(`${normalized.url}/rest/v1/rpc/delete_profile_memory`, {
        method: "POST",
        headers: requireRequest(accessToken),
        body: "{}",
      });
      return responseJson(response);
    }

    return { capabilities, load, save, remove };
  }

  window.PlaySputnikAccount = { normalizeConfig, accountCapabilities, createProfileStore };
})();
