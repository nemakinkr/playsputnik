/* PlaySputnik Companion Events — durable user actions and notification-ready fact events */
"use strict";
(function () {
  const EVENT_SCHEMA_VERSION = 1;
  const EVENT_LOG_LIMIT = 100;

  function eventCategory(type = "") {
    if (type.startsWith("price") || type.startsWith("wishlist")) return "price";
    if (type.startsWith("release") || type.startsWith("radar")) return "release";
    if (type.startsWith("subscription") || type.startsWith("access")) return "access";
    if (type.includes("session") || type.includes("game_state") || type.includes("continuity")) return "play";
    if (type.startsWith("briefing")) return "briefing";
    if (type.includes("rating") || type.includes("taste")) return "taste";
    return "memory";
  }

  function safeToken(value) {
    return String(value || "")
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "item";
  }

  function createCompanionEvent({
    id = "",
    type = "memory.updated",
    category = "",
    title = "",
    occurredAt = "",
    source = null,
    payload = null,
    action = null,
    delivery = "internal",
  } = {}) {
    const at = occurredAt || new Date().toISOString();
    const normalizedSource = source && typeof source === "object"
      ? {
          kind: source.kind || "unknown",
          name: source.name || source.provider || "",
          url: source.url || source.sourceUrl || "",
          checkedAt: source.checkedAt || null,
        }
      : { kind: "user", name: "", url: "", checkedAt: null };
    const detail = payload && typeof payload === "object" ? payload : {};
    return {
      schemaVersion: EVENT_SCHEMA_VERSION,
      id: id || `${safeToken(type)}:${safeToken(title)}:${safeToken(normalizedSource.checkedAt || at)}`,
      type,
      category: category || eventCategory(type),
      title: String(title || ""),
      occurredAt: at,
      at,
      source: normalizedSource,
      payload: detail,
      detail,
      action: action && typeof action === "object" ? action : null,
      delivery,
    };
  }

  function normalizeCompanionEvent(event, index = 0) {
    if (!event || typeof event !== "object") return null;
    const occurredAt = event.occurredAt || event.at || new Date(0).toISOString();
    return createCompanionEvent({
      ...event,
      id: event.id || `legacy:${safeToken(event.type)}:${index}:${safeToken(occurredAt)}`,
      occurredAt,
      payload: event.payload || event.detail || {},
      source: event.source || { kind: "user" },
      delivery: event.delivery || "internal",
    });
  }

  function appendCompanionEvent(state, event) {
    const normalized = normalizeCompanionEvent(event);
    if (!normalized) return null;
    state.userEvents = [
      normalized,
      ...(state.userEvents || []).filter((item) => item?.id !== normalized.id),
    ].slice(0, EVENT_LOG_LIMIT);
    return normalized;
  }

  function factSource(snapshot = {}, fallbackKind = "provider") {
    return {
      kind: fallbackKind,
      name: snapshot.source || snapshot.provider || "",
      url: snapshot.storeUrl || snapshot.sourceUrl || "",
      checkedAt: snapshot.checkedAt || null,
    };
  }

  function priceNotificationEvent(record, region) {
    if (!record?.game || !record.hasPrice || !record.watch) return null;
    const snapshot = record.game.priceMeta?.[region] || {};
    const targetHit = Boolean(record.watch.isBelowTarget);
    const sourceReady = Boolean(snapshot.source && snapshot.checkedAt);
    const eligible = targetHit && Boolean(record.status?.canConfirm) && sourceReady;
    if (!targetHit && record.status?.canConfirm) return null;
    return createCompanionEvent({
      id: `price:${safeToken(record.game.title)}:${safeToken(region)}:${safeToken(snapshot.checkedAt || "missing")}`,
      type: targetHit ? "price.target_hit" : "price.verification_needed",
      title: record.game.title,
      occurredAt: snapshot.checkedAt || undefined,
      source: factSource(snapshot, "price_provider"),
      payload: {
        region,
        price: record.watch.currentPrice,
        currency: snapshot.currency || "",
        targetPrice: record.watch.targetPrice,
        freshness: record.status?.state || snapshot.freshnessState || "missing",
        confidence: snapshot.confidence || "unknown",
      },
      action: { kind: "open_wishlist", title: record.game.title },
      delivery: eligible ? "eligible" : "blocked",
    });
  }

  function releaseNotificationEvent(item, now = new Date()) {
    if (!item?.title || !item.releaseDate) return null;
    const releaseAt = Date.parse(`${item.releaseDate}T12:00:00Z`);
    const daysAway = Number.isFinite(releaseAt) ? Math.ceil((releaseAt - now.getTime()) / 86400000) : Infinity;
    if (daysAway < 0 || daysAway > 60) return null;
    const freshness = item.freshnessState || "missing";
    const identityReady = ["high", "medium"].includes(item.identityConfidence || "");
    const eligible = Boolean(item.sourceUrl) && freshness !== "stale" && identityReady;
    return createCompanionEvent({
      id: `release:${safeToken(item.title)}:${item.releaseDate}`,
      type: "release.upcoming",
      title: item.title,
      occurredAt: now.toISOString(),
      source: {
        kind: "release_provider",
        name: item.source || "",
        url: item.sourceUrl || "",
        checkedAt: item.checkedAt || null,
      },
      payload: {
        releaseDate: item.releaseDate,
        daysAway,
        freshness,
        confidence: item.identityConfidence || "unknown",
      },
      action: { kind: "open_discover", title: item.title },
      delivery: eligible ? "eligible" : "blocked",
    });
  }

  function accessNotificationEvent(game, region) {
    const snapshot = game?.subscriptionMeta?.[region];
    if (!game?.title || !snapshot) return null;
    const eligible = snapshot.freshnessState === "fresh"
      && ["high", "medium"].includes(snapshot.confidence)
      && Boolean(snapshot.checkedAt);
    return createCompanionEvent({
      id: `access:${safeToken(game.title)}:${safeToken(region)}:${safeToken(snapshot.checkedAt || "missing")}`,
      type: "subscription.available",
      title: game.title,
      occurredAt: snapshot.checkedAt || undefined,
      source: factSource(snapshot, "subscription_provider"),
      payload: {
        region,
        tier: snapshot.tier || "",
        freshness: snapshot.freshnessState || "missing",
        confidence: snapshot.confidence || "unknown",
      },
      action: { kind: "open_library", title: game.title },
      delivery: eligible ? "eligible" : "blocked",
    });
  }

  function buildNotificationEvents({ wishlistRecords = [], radarItems = [], accessGames = [], region = "US", now = new Date() } = {}) {
    const events = [
      ...wishlistRecords.map((record) => priceNotificationEvent(record, region)),
      ...radarItems.map((item) => releaseNotificationEvent(item, now)),
      ...accessGames.map((game) => accessNotificationEvent(game, region)),
    ].filter(Boolean);
    const byId = new Map();
    events.forEach((event) => byId.set(event.id, event));
    return [...byId.values()].sort((a, b) => Number(b.delivery === "eligible") - Number(a.delivery === "eligible"));
  }

  window.PlaySputnikEvents = {
    EVENT_SCHEMA_VERSION,
    EVENT_LOG_LIMIT,
    eventCategory,
    createCompanionEvent,
    normalizeCompanionEvent,
    appendCompanionEvent,
    priceNotificationEvent,
    releaseNotificationEvent,
    accessNotificationEvent,
    buildNotificationEvents,
  };
})();
