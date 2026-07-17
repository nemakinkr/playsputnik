/* PlaySputnik Import Resolution — resilient batch provider lookup for imported titles */
"use strict";
(function () {
  const TERMINAL_STATUSES = new Set(["resolved", "review", "failed"]);
  const RETRYABLE_STATUSES = new Set(["pending", "searching", "review", "failed"]);

  function createImportResolutionTools({
    getState,
    titleKey,
    titleMatches,
    fetchProvider,
    normalizeProviderResult,
    onResolved,
    onProgress = () => {},
    onComplete = () => {},
    now = () => new Date().toISOString(),
    concurrency = 2,
    maxBatchSize = 120,
    stateKeys = {},
    dailyRequestCap = Infinity,
    maxAttempts = 3,
    retryBaseMs = 60_000,
  }) {
    const keys = {
      queue: "importLookupQueue",
      resolved: "importLookupResolved",
      items: "importLookupItems",
      summary: "importLookupBatchSummary",
      budget: "",
      ...stateKeys,
    };
    let activeRun = null;
    let runGeneration = 0;

    function nowIso() {
      return String(now());
    }

    function requestBudget() {
      if (!keys.budget || !Number.isFinite(dailyRequestCap)) {
        return { date: nowIso().slice(0, 10), used: 0, cap: Infinity, remaining: Infinity };
      }
      const state = getState();
      const date = nowIso().slice(0, 10);
      const current = state[keys.budget] && typeof state[keys.budget] === "object" ? state[keys.budget] : {};
      const cap = Math.max(0, Number(current.cap) || Number(dailyRequestCap) || 0);
      const used = current.date === date ? Math.max(0, Number(current.used) || 0) : 0;
      state[keys.budget] = { date, used, cap };
      return { date, used, cap, remaining: Math.max(0, cap - used) };
    }

    function reserveRequest() {
      const budget = requestBudget();
      if (budget.remaining <= 0) return false;
      if (keys.budget && Number.isFinite(budget.cap)) {
        getState()[keys.budget] = { date: budget.date, used: budget.used + 1, cap: budget.cap };
      }
      return true;
    }

    function retryAt(attempts) {
      const timestamp = Date.parse(nowIso()) || Date.now();
      return new Date(timestamp + retryBaseMs * (2 ** Math.max(0, attempts - 1))).toISOString();
    }

    function normalizeEntry(entry) {
      const title = String(entry?.title || "").trim();
      if (!title) return null;
      return {
        title,
        kind: entry.kind || "lookup",
        rating: Number.isFinite(Number(entry.rating)) ? Number(entry.rating) : null,
        rank: Number.isFinite(Number(entry.rank)) ? Number(entry.rank) : null,
        total: Number.isFinite(Number(entry.total)) ? Number(entry.total) : null,
        userState: entry.userState || "",
        hoursPlayed: Number.isFinite(Number(entry.hoursPlayed)) ? Number(entry.hoursPlayed) : null,
        status: entry.status || "pending",
        attempts: Math.max(0, Number(entry.attempts) || 0),
        resolvedTitle: entry.resolvedTitle || "",
        sourceId: entry.sourceId || "",
        error: entry.error || "",
        nextRetryAt: entry.nextRetryAt || null,
        updatedAt: entry.updatedAt || nowIso(),
      };
    }

    function itemMap() {
      const state = getState();
      if (!state[keys.items] || typeof state[keys.items] !== "object" || Array.isArray(state[keys.items])) {
        state[keys.items] = {};
      }
      return state[keys.items];
    }

    function queueEntries(entries, { replace = true } = {}) {
      const state = getState();
      if (replace) {
        runGeneration += 1;
        activeRun = null;
      }
      const nextItems = replace ? {} : { ...itemMap() };
      const orderedKeys = [];
      (entries || []).forEach((rawEntry) => {
        if (orderedKeys.length >= maxBatchSize) return;
        const entry = normalizeEntry(rawEntry);
        if (!entry) return;
        const key = titleKey(entry.title);
        if (!key || orderedKeys.includes(key)) return;
        const previous = nextItems[key];
        nextItems[key] = normalizeEntry({
          ...previous,
          ...entry,
          status: previous?.status === "resolved" ? "resolved" : "pending",
          attempts: previous?.attempts || 0,
          error: "",
          nextRetryAt: previous?.nextRetryAt || null,
          updatedAt: nowIso(),
        });
        orderedKeys.push(key);
      });
      if (!replace) {
        Object.keys(nextItems).forEach((key) => {
          if (!orderedKeys.includes(key)) orderedKeys.push(key);
        });
      }
      state[keys.items] = nextItems;
      state[keys.queue] = orderedKeys.map((key) => nextItems[key]?.title).filter(Boolean);
      state[keys.resolved] = Object.fromEntries(orderedKeys.map((key) => [key, nextItems[key]?.status === "resolved"]));
      updateSummary("queued");
      onProgress(progress(), { phase: "queued" });
      return progress();
    }

    function progress() {
      const state = getState();
      const queue = (state[keys.queue] || []).filter(Boolean);
      const items = itemMap();
      const counts = { pending: 0, searching: 0, resolved: 0, review: 0, failed: 0 };
      queue.forEach((title) => {
        const status = items[titleKey(title)]?.status || (state[keys.resolved]?.[titleKey(title)] ? "resolved" : "pending");
        if (Object.hasOwn(counts, status)) counts[status] += 1;
      });
      const done = counts.resolved;
      const remaining = Math.max(0, queue.length - done);
      const budget = requestBudget();
      return { total: queue.length, done, remaining, ...counts, budgetUsed: budget.used, budgetRemaining: budget.remaining, dailyCap: budget.cap };
    }

    function updateSummary(status = "") {
      const state = getState();
      const snapshot = progress();
      const kinds = [...new Set((state[keys.queue] || [])
        .map((title) => itemMap()[titleKey(title)]?.kind)
        .filter(Boolean))];
      const settled = snapshot.resolved + snapshot.review + snapshot.failed;
      const finalStatus = status || (
        snapshot.searching ? "running"
          : snapshot.total && settled === snapshot.total
            ? snapshot.remaining ? "partial" : "complete"
            : "queued"
      );
      state[keys.summary] = {
        status: finalStatus,
        kind: kinds.length === 1 ? kinds[0] : kinds.length ? "mixed" : "",
        saved: snapshot.resolved,
        resolved: snapshot.resolved,
        review: snapshot.review,
        failed: snapshot.failed,
        total: snapshot.total,
        remaining: snapshot.remaining,
        budgetUsed: snapshot.budgetUsed,
        budgetRemaining: snapshot.budgetRemaining,
        updatedAt: nowIso(),
      };
      return state[keys.summary];
    }

    function activeTitle(query = getState().gameSearchQuery || "") {
      const state = getState();
      const queue = (state[keys.queue] || []).filter(Boolean);
      return queue.find((title) => titleMatches(title, query))
        || queue.find((title) => !state[keys.resolved]?.[titleKey(title)])
        || queue[0]
        || "";
    }

    function nextTitle(currentTitle = activeTitle()) {
      const state = getState();
      const queue = (state[keys.queue] || []).filter(Boolean);
      if (!queue.length) return "";
      const currentIndex = Math.max(0, queue.findIndex((title) => titleMatches(title, currentTitle)));
      const ordered = [...queue.slice(currentIndex + 1), ...queue.slice(0, currentIndex + 1)];
      return ordered.find((title) => !state[keys.resolved]?.[titleKey(title)]) || "";
    }

    function markResolved(title) {
      const state = getState();
      const matched = (state[keys.queue] || []).find((item) => titleMatches(item, title));
      if (!matched) return false;
      const key = titleKey(matched);
      const item = normalizeEntry(itemMap()[key] || { title: matched });
      itemMap()[key] = { ...item, status: "resolved", resolvedTitle: title, error: "", nextRetryAt: null, updatedAt: nowIso() };
      state[keys.resolved] = { ...(state[keys.resolved] || {}), [key]: true };
      updateSummary();
      return true;
    }

    function clearQueue() {
      runGeneration += 1;
      const state = getState();
      state[keys.queue] = [];
      state[keys.resolved] = {};
      state[keys.items] = {};
      state[keys.summary] = null;
      activeRun = null;
      onProgress(progress(), { phase: "cleared" });
    }

    function bestProviderResult(payload, title) {
      const candidates = (payload?.results || [])
        .map((record) => normalizeProviderResult(record, title))
        .filter(Boolean)
        .filter((result) => result.sourceId !== "manual_unverified")
        .filter((result) => ["high", "medium"].includes(result.matchConfidence))
        .filter((result) => titleMatches(result.title, title) || ["exact", "alias", "prefix"].includes(result.matchKind));
      return candidates[0] || null;
    }

    async function resolveItem(item, generation) {
      if (generation !== runGeneration) return;
      const state = getState();
      const key = titleKey(item.title);
      const current = normalizeEntry(itemMap()[key] || item);
      if (!reserveRequest()) {
        itemMap()[key] = { ...current, status: "pending", error: "daily_request_cap", updatedAt: nowIso() };
        updateSummary("rate_limited");
        return;
      }
      itemMap()[key] = { ...current, status: "searching", attempts: current.attempts + 1, error: "", nextRetryAt: null, updatedAt: nowIso() };
      updateSummary("running");
      try {
        const payload = await fetchProvider(current.title);
        if (generation !== runGeneration) return;
        const result = bestProviderResult(payload, current.title);
        if (!result) {
          itemMap()[key] = { ...itemMap()[key], status: "review", error: "no_confident_match", updatedAt: nowIso() };
        } else {
          await onResolved(current, result, payload);
          itemMap()[key] = {
            ...itemMap()[key],
            status: "resolved",
            resolvedTitle: result.title,
            sourceId: result.sourceId || payload?.provider || "",
            error: "",
            nextRetryAt: null,
            updatedAt: nowIso(),
          };
          state[keys.resolved] = { ...(state[keys.resolved] || {}), [key]: true };
        }
      } catch (error) {
        if (generation !== runGeneration) return;
        itemMap()[key] = {
          ...itemMap()[key],
          status: "failed",
          error: String(error?.message || error || "provider_failed").slice(0, 240),
          nextRetryAt: retryAt(itemMap()[key].attempts),
          updatedAt: nowIso(),
        };
      }
      updateSummary();
      onProgress(progress(), { phase: "settled", item: itemMap()[key] });
    }

    function runBatch({ retryUnresolved = false } = {}) {
      if (activeRun) return activeRun;
      const items = itemMap();
      const state = getState();
      const currentTime = Date.parse(nowIso()) || Date.now();
      const pending = (state[keys.queue] || [])
        .map((title) => items[titleKey(title)])
        .filter(Boolean)
        .filter((item) => item.attempts < maxAttempts)
        .filter((item) => {
          if (retryUnresolved) return RETRYABLE_STATUSES.has(item.status);
          if (["pending", "searching"].includes(item.status)) return true;
          return item.status === "failed" && (!item.nextRetryAt || Date.parse(item.nextRetryAt) <= currentTime);
        })
        .slice(0, requestBudget().remaining);
      if (!pending.length) {
        updateSummary(progress().budgetRemaining <= 0 && progress().remaining ? "rate_limited" : "");
        onComplete(progress());
        return Promise.resolve(progress());
      }
      pending.forEach((item) => {
        if (item.status === "searching") item.status = "pending";
        if (retryUnresolved && TERMINAL_STATUSES.has(item.status) && item.status !== "resolved") item.status = "pending";
      });
      const generation = ++runGeneration;
      updateSummary("running");
      onProgress(progress(), { phase: "started" });
      let cursor = 0;
      const worker = async () => {
        while (cursor < pending.length && generation === runGeneration) {
          const item = pending[cursor++];
          await resolveItem(item, generation);
        }
      };
      activeRun = Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), pending.length) }, worker))
        .then(() => {
          if (generation !== runGeneration) return progress();
          const snapshot = progress();
          updateSummary(snapshot.remaining ? "partial" : "complete");
          onComplete(snapshot);
          return snapshot;
        })
        .finally(() => {
          if (generation === runGeneration) activeRun = null;
        });
      return activeRun;
    }

    function resumeBatch() {
      const currentTime = Date.parse(nowIso()) || Date.now();
      const pending = Object.values(itemMap()).some((item) => item?.attempts < maxAttempts && (
        ["pending", "searching"].includes(item?.status)
        || (item?.status === "failed" && (!item.nextRetryAt || Date.parse(item.nextRetryAt) <= currentTime))
      ));
      return pending ? runBatch() : Promise.resolve(progress());
    }

    return {
      queueEntries,
      runBatch,
      resumeBatch,
      clearQueue,
      progress,
      activeTitle,
      nextTitle,
      markResolved,
      updateSummary,
      bestProviderResult,
      requestBudget,
    };
  }

  window.PlaySputnikImportResolution = { createImportResolutionTools };
})();
