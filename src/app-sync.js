/* PlaySputnik Profile Sync — portable profile envelopes and conflict-safe revisions */
"use strict";
(function () {
  const PROFILE_ENVELOPE_FORMAT = "playsputnik-profile-envelope";
  const PROFILE_ENVELOPE_VERSION = 1;
  const DEVICE_STORAGE_KEY = "playsputnik.device.id.v1";
  const DURABLE_PROFILE_KEYS = [
    "stateVersion", "liked", "hidden", "saved", "snoozed", "userStates", "userGames",
    "quickReactions", "calibrationSkips", "ratingQueue", "entryPath", "activeRegion", "mood",
    "session", "sessionMinutes", "difficulty", "psPlus", "budget", "atomWeights", "importedRatings",
    "notebook", "feedbackLog", "userEvents", "dropDecisions", "sessionLog", "continuityFocusTitle",
    "dailyBriefing",
  ];

  function jsonValue(value) {
    if (value instanceof Set) return [...value].map(jsonValue);
    if (Array.isArray(value)) return value.map(jsonValue);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, jsonValue(value[key])]));
  }

  function serializableProfile(state) {
    return jsonValue(state || {});
  }

  function durableProfile(state) {
    return Object.fromEntries(DURABLE_PROFILE_KEYS.map((key) => [key, jsonValue(state?.[key])]).filter(([, value]) => value !== undefined));
  }

  function stableStringify(value) {
    return JSON.stringify(jsonValue(value));
  }

  function profileFingerprint(state) {
    const text = stableStringify(durableProfile(state));
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function defaultId(prefix = "id") {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return `${prefix}_${uuid}`;
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  }

  function normalizeSyncMeta(meta) {
    const source = meta && typeof meta === "object" ? meta : {};
    return {
      profileId: String(source.profileId || ""),
      revision: Math.max(0, Math.floor(Number(source.revision) || 0)),
      baseRevision: Math.max(0, Math.floor(Number(source.baseRevision) || 0)),
      updatedAt: source.updatedAt || null,
      lastPayloadHash: String(source.lastPayloadHash || ""),
      lastSyncedRevision: Math.max(0, Math.floor(Number(source.lastSyncedRevision) || 0)),
      lastSyncedAt: source.lastSyncedAt || null,
    };
  }

  function ensureSyncMeta(state, {
    now = new Date().toISOString(),
    profileIdFactory = () => defaultId("profile"),
  } = {}) {
    const current = normalizeSyncMeta(state.syncMeta);
    const fingerprint = profileFingerprint(state);
    const needsIdentity = !current.profileId;
    const changed = Boolean(current.lastPayloadHash && current.lastPayloadHash !== fingerprint);
    const revision = needsIdentity ? Math.max(1, current.revision) : changed ? current.revision + 1 : Math.max(1, current.revision);
    state.syncMeta = {
      ...current,
      profileId: current.profileId || profileIdFactory(),
      revision,
      baseRevision: current.baseRevision || current.lastSyncedRevision || 0,
      updatedAt: needsIdentity || changed || !current.updatedAt ? now : current.updatedAt,
      lastPayloadHash: fingerprint,
    };
    return state.syncMeta;
  }

  function getOrCreateDeviceId(storage, { deviceIdFactory = () => defaultId("device") } = {}) {
    const existing = String(storage?.getItem?.(DEVICE_STORAGE_KEY) || "");
    if (existing) return existing;
    const created = deviceIdFactory();
    storage?.setItem?.(DEVICE_STORAGE_KEY, created);
    return created;
  }

  function createProfileEnvelope(state, {
    deviceId = "",
    now = new Date().toISOString(),
    profileIdFactory,
  } = {}) {
    const meta = ensureSyncMeta(state, { now, profileIdFactory });
    return {
      format: PROFILE_ENVELOPE_FORMAT,
      envelopeVersion: PROFILE_ENVELOPE_VERSION,
      exportedAt: now,
      profileId: meta.profileId,
      revision: meta.revision,
      baseRevision: meta.baseRevision,
      fingerprint: meta.lastPayloadHash,
      sourceDeviceId: deviceId || "unknown",
      profile: serializableProfile(state),
    };
  }

  function unwrapProfileEnvelope(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid profile backup");
    if (value.format === PROFILE_ENVELOPE_FORMAT) {
      if (value.envelopeVersion !== PROFILE_ENVELOPE_VERSION || !value.profile || typeof value.profile !== "object") {
        throw new Error("Unsupported profile backup version");
      }
      return { profile: value.profile, envelope: value, legacy: false };
    }
    return {
      profile: value,
      envelope: {
        format: "playsputnik-legacy-backup",
        envelopeVersion: 0,
        profileId: value.syncMeta?.profileId || "",
        revision: Number(value.syncMeta?.revision) || 0,
        baseRevision: Number(value.syncMeta?.baseRevision) || 0,
        fingerprint: value.syncMeta?.lastPayloadHash || profileFingerprint(value),
      },
      legacy: true,
    };
  }

  function compareProfileEnvelopes(localEnvelope, remoteEnvelope) {
    if (!localEnvelope || !remoteEnvelope) return { status: "unavailable", safeAction: "none" };
    if (localEnvelope.profileId && remoteEnvelope.profileId && localEnvelope.profileId !== remoteEnvelope.profileId) {
      return { status: "different_profile", safeAction: "confirm_replace" };
    }
    if (localEnvelope.fingerprint && localEnvelope.fingerprint === remoteEnvelope.fingerprint) {
      return { status: "identical", safeAction: "none" };
    }
    const localRevision = Number(localEnvelope.revision) || 0;
    const remoteRevision = Number(remoteEnvelope.revision) || 0;
    if (remoteRevision > localRevision && Number(remoteEnvelope.baseRevision) === localRevision) {
      return { status: "remote_ahead", safeAction: "download" };
    }
    if (localRevision > remoteRevision && Number(localEnvelope.baseRevision) === remoteRevision) {
      return { status: "local_ahead", safeAction: "upload" };
    }
    return { status: "conflict", safeAction: "ask_user" };
  }

  function syncStatus(state, deviceId = "") {
    const meta = normalizeSyncMeta(state?.syncMeta);
    return {
      profileId: meta.profileId,
      profileShortId: meta.profileId ? meta.profileId.slice(-8).toUpperCase() : "--------",
      deviceId,
      deviceShortId: deviceId ? deviceId.slice(-8).toUpperCase() : "--------",
      revision: meta.revision,
      updatedAt: meta.updatedAt,
      cloudAvailable: false,
      authConfigured: false,
      storageConfigured: false,
    };
  }

  window.PlaySputnikSync = {
    PROFILE_ENVELOPE_FORMAT,
    PROFILE_ENVELOPE_VERSION,
    DEVICE_STORAGE_KEY,
    DURABLE_PROFILE_KEYS,
    serializableProfile,
    durableProfile,
    stableStringify,
    profileFingerprint,
    normalizeSyncMeta,
    ensureSyncMeta,
    getOrCreateDeviceId,
    createProfileEnvelope,
    unwrapProfileEnvelope,
    compareProfileEnvelopes,
    syncStatus,
  };
})();
