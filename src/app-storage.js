/* PlaySputnik Storage Module — IndexedDB with localStorage fallback and sync-compatible adapter */
"use strict";
(function () {
  const DB_NAME = "PlaySputnikDB";
  const DB_VERSION = 1;
  const STORE = "keyval";

  let _db = null;

  function openDB() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = (e) => {
        _db = e.target.result;
        resolve(_db);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function idbGet(key) {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        }),
    );
  }

  function idbSet(key, value) {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(value, key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        }),
    );
  }

  function idbRemove(key) {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        }),
    );
  }

  function idbClear() {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const req = db.transaction(STORE, "readwrite").objectStore(STORE).clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        }),
    );
  }

  /**
   * Preload: read STORAGE_KEY from IDB before app.js runs.
   * Sets window.__idbPreloadedState (raw JSON string) so loadState() can use it
   * synchronously — no changes needed to the existing state hydration logic.
   * If IDB is empty but localStorage has data, migration happens automatically on
   * the first saveState() call (write-through).
   */
  function preload(key) {
    return idbGet(key)
      .then((value) => {
        if (typeof value === "string") {
          window.__idbPreloadedState = value;
        }
        // IDB empty → fallback to localStorage on first load (auto-migration on save)
      })
      .catch(() => {
        // IDB unavailable (private browsing, quota exceeded) — silently fall through
      });
  }

  /**
   * Sync-compatible storage adapter.
   * getItem: returns preloaded IDB value if available, else localStorage.
   * setItem: writes to localStorage (sync) + IDB (async write-through).
   * removeItem: removes from both.
   */
  function createStorageAdapter() {
    return {
      getItem(key) {
        if (window.__idbPreloadedState !== undefined) {
          // Consume preload on first read so subsequent calls use localStorage
          // (IDB is kept in sync via setItem write-through)
          const val = window.__idbPreloadedState;
          window.__idbPreloadedState = undefined;
          return val;
        }
        return localStorage.getItem(key);
      },
      setItem(key, value) {
        // Always write to localStorage as sync fallback
        localStorage.setItem(key, value);
        // Write-through to IDB (fire-and-forget; errors are non-fatal)
        idbSet(key, value).catch((err) =>
          console.warn("[PlaySputnik] IDB write failed:", err),
        );
      },
      removeItem(key) {
        localStorage.removeItem(key);
        idbRemove(key).catch(() => {});
      },
    };
  }

  window.PlaySputnikStorage = {
    idbGet,
    idbSet,
    idbRemove,
    idbClear,
    preload,
    createStorageAdapter,
  };
})();
