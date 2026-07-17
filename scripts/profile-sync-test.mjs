import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-sync.js", import.meta.url), "utf8");
const context = { window: {}, Date, Math, Set };
vm.runInNewContext(source, context, { filename: "src/app-sync.js" });
const {
  PROFILE_ENVELOPE_FORMAT,
  ensureSyncMeta,
  getOrCreateDeviceId,
  createProfileEnvelope,
  unwrapProfileEnvelope,
  compareProfileEnvelopes,
  profileFingerprint,
} = context.window.PlaySputnikSync;

const state = {
  stateVersion: 11,
  activeView: "today",
  liked: new Set(["Control"]), hidden: new Set(), saved: new Set(), snoozed: new Set(),
  userGames: { control: { title: "Control", completionStatus: "playing", updatedAt: "2026-07-17T10:00:00.000Z" } },
  quickReactions: {}, importedRatings: [], notebook: {}, feedbackLog: [], userEvents: [],
};
const first = ensureSyncMeta(state, { now: "2026-07-17T10:00:00.000Z", profileIdFactory: () => "profile_test" });
assert.equal(first.profileId, "profile_test");
assert.equal(first.revision, 1);
const firstHash = first.lastPayloadHash;

state.activeView = "wishlist";
ensureSyncMeta(state, { now: "2026-07-17T10:01:00.000Z" });
assert.equal(state.syncMeta.revision, 1, "UI navigation must not create a sync revision");
assert.equal(state.syncMeta.lastPayloadHash, firstHash);

state.userGames.control.rating = 90;
ensureSyncMeta(state, { now: "2026-07-17T10:02:00.000Z" });
assert.equal(state.syncMeta.revision, 2, "durable game memory should create a new revision");
assert.notEqual(state.syncMeta.lastPayloadHash, firstHash);
assert.equal(profileFingerprint(state), state.syncMeta.lastPayloadHash);

const deviceStorage = new Map();
const storage = {
  getItem: (key) => deviceStorage.get(key) || null,
  setItem: (key, value) => deviceStorage.set(key, value),
};
const deviceId = getOrCreateDeviceId(storage, { deviceIdFactory: () => "device_test" });
assert.equal(deviceId, "device_test");
assert.equal(getOrCreateDeviceId(storage, { deviceIdFactory: () => "wrong" }), "device_test", "device identity must remain local and stable");

const envelope = createProfileEnvelope(state, { deviceId, now: "2026-07-17T10:03:00.000Z" });
assert.equal(envelope.format, PROFILE_ENVELOPE_FORMAT);
assert.equal(envelope.envelopeVersion, 1);
assert.equal(envelope.profileId, "profile_test");
assert.equal(envelope.sourceDeviceId, "device_test");
assert(Array.isArray(envelope.profile.liked), "portable state must serialize Sets as arrays");
assert.equal(unwrapProfileEnvelope(envelope).profile.userGames.control.rating, 90);
assert.equal(unwrapProfileEnvelope({ userGames: {} }).legacy, true, "old JSON backups must remain importable");

const remoteAhead = { ...envelope, revision: 3, baseRevision: 2, fingerprint: "fnv1a-remote" };
assert.deepEqual(JSON.parse(JSON.stringify(compareProfileEnvelopes(envelope, remoteAhead))), { status: "remote_ahead", safeAction: "download" });
const conflict = { ...envelope, revision: 2, baseRevision: 0, fingerprint: "fnv1a-conflict" };
assert.deepEqual(JSON.parse(JSON.stringify(compareProfileEnvelopes(envelope, conflict))), { status: "conflict", safeAction: "ask_user" });
assert.equal(compareProfileEnvelopes(envelope, { ...envelope, profileId: "profile_other" }).status, "different_profile");

console.log("✅ profile envelopes keep device identity local, revision durable memory, and detect unsafe sync conflicts");
