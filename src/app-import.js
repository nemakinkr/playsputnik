/* PlaySputnik Import Module — smart library import from Backloggd, HLTB, PS plain list, PSN */
"use strict";
(function () {
  // ─── Backloggd status → PlaySputnik state ────────────────────────────────
  const BACKLOGGD_STATUS_MAP = {
    playing:  "playing",
    played:   "completed",
    backlog:  "owned",
    wishlist: "saved",
    dropped:  "dropped",
    shelved:  "paused",
    owned:    "owned",
  };

  // HLTB list flags → PlaySputnik state (priority order)
  function hltbStatus(row) {
    if (row.list_comp)    return "completed";
    if (row.list_playing) return "playing";
    if (row.list_retired) return "dropped";
    if (row.list_replay)  return "want_to_finish";
    if (row.list_backlog) return "owned";
    return "owned";
  }

  // ─── Format detection ────────────────────────────────────────────────────
  function detectFormat(text) {
    // PlaySputnik JSON
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        if (parsed.userGames || parsed.atomWeights || parsed.userStates) {
          return { type: "playsputnik-json", data: parsed };
        }
        // HLTB backup (object with eGamePlay array)
        if (Array.isArray(parsed.eGamePlay)) {
          return { type: "hltb-json", data: parsed.eGamePlay };
        }
        // HLTB newer export (object with UserGamesList or games)
        const arr = parsed.UserGamesList || parsed.games;
        if (Array.isArray(arr) && arr.length && (arr[0].game_name || arr[0].gameName)) {
          return { type: "hltb-json", data: arr };
        }
        // Bare array
        if (Array.isArray(parsed) && parsed.length && (parsed[0].game_name || parsed[0].gameName)) {
          return { type: "hltb-json", data: parsed };
        }
      }
    } catch (_) { /* not JSON */ }

    // Backloggd CSV — first line has "game" and "status" headers
    const firstLine = text.split("\n")[0]?.toLowerCase().replace(/"/g, "") || "";
    if (firstLine.includes("game") && firstLine.includes("status")) {
      return { type: "backloggd-csv", data: text };
    }

    // PlayStation / plain title list — multiple non-empty lines, each looks like a game title
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2 && lines.every((l) => l.length > 0 && l.length < 120)) {
      return { type: "plain-list", data: lines };
    }

    return { type: "unknown", data: text };
  }

  // ─── Backloggd CSV parser ────────────────────────────────────────────────
  // Expected columns: Game, Platform, Status, Rating, Review, Lists, Created, Updated
  function parseBackloggdCsv(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return { entries: [], format: "backloggd-csv", warnings: ["Empty CSV"] };

    const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase().trim());
    const gameIdx    = headers.findIndex((h) => h === "game");
    const statusIdx  = headers.findIndex((h) => h === "status");
    const platformIdx = headers.findIndex((h) => h === "platform");
    const ratingIdx  = headers.findIndex((h) => h === "rating");

    if (gameIdx === -1) return { entries: [], format: "backloggd-csv", warnings: ["No 'Game' column found"] };

    const entries = [];
    const warnings = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvRow(lines[i]);
      const title = cols[gameIdx]?.trim();
      if (!title) continue;

      const rawStatus = cols[statusIdx]?.trim().toLowerCase() || "";
      const status = BACKLOGGD_STATUS_MAP[rawStatus] || "owned";
      const platform = cols[platformIdx]?.trim() || "";
      const rating = cols[ratingIdx] ? parseFloat(cols[ratingIdx]) : null;

      // Skip if clearly not a PS game (when platform info is available)
      if (platform && !/playstation|ps[345]|ps\s*[345]|sony/i.test(platform)) {
        // Still include it — user can have multi-platform library
      }

      entries.push({ title, status, platform, rating: isNaN(rating) ? null : rating });
    }

    if (entries.length === 0) warnings.push("No games parsed from CSV");
    return { entries, format: "backloggd-csv", warnings };
  }

  // Minimal CSV row parser (handles quoted fields with commas)
  function parseCsvRow(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  // ─── HLTB JSON parser ────────────────────────────────────────────────────
  // Accepts array of HLTB game rows (eGamePlay entries)
  function parseHltbJson(rows) {
    if (!Array.isArray(rows)) return { entries: [], format: "hltb-json", warnings: ["Expected array"] };
    const entries = [];
    const warnings = [];

    rows.forEach((row) => {
      const title = row.game_name || row.gameName || row.name;
      if (!title) return;

      const status = hltbStatus(row);
      // comp_main is in minutes in HLTB backup
      const compMainMin = row.comp_main || row.compMain || 0;
      const hoursPlayed = compMainMin > 0 ? Math.round(compMainMin / 60 * 10) / 10 : null;
      const platform = row.play_storefront || row.platform || "";
      const rating = row.review_score > 0 ? row.review_score : null;

      entries.push({ title, status, hoursPlayed, platform, rating });
    });

    if (entries.length === 0) warnings.push("No games parsed from HLTB JSON");
    return { entries, format: "hltb-json", warnings };
  }

  // ─── Plain list parser ───────────────────────────────────────────────────
  // Each line is a game title. Strip common PS App copy-paste suffixes.
  function parsePlainList(lines) {
    const entries = lines
      .map((line) => {
        // Remove trailing " - X trophies", "★ X/X", emoji prefixes, numbering
        let title = line
          .replace(/^\d+[.)]\s*/, "")          // "1. Game" or "1) Game"
          .replace(/\s*[-–]\s*\d+ trophies?.*$/i, "")  // " - 15 trophies"
          .replace(/★.*$/, "")                  // "★ 45/50"
          .replace(/^[^\w\d('"«]+/, "")         // leading non-word chars / emoji
          .trim();
        return title.length >= 2 ? { title, status: "owned", platform: "", rating: null } : null;
      })
      .filter(Boolean);

    return {
      entries,
      format: "plain-list",
      warnings: entries.length === 0 ? ["No titles recognized"] : [],
    };
  }

  // ─── PSN trophy titles → library entries ────────────────────────────────
  // Accepts the response from /api/psn (array of {title, platform, trophyCount, lastUpdated})
  function parsePsnTrophyTitles(trophyTitles) {
    if (!Array.isArray(trophyTitles)) return { entries: [], format: "psn-trophy", warnings: ["Invalid trophy data"] };
    const entries = trophyTitles.map((t) => ({
      title: t.title,
      status: "owned",
      platform: t.platform || "PS5",
      rating: null,
      trophyCount: t.trophyCount || 0,
      lastUpdated: t.lastUpdated || null,
    }));
    return { entries, format: "psn-trophy", warnings: [] };
  }

  // ─── Summary label for import result ────────────────────────────────────
  function importSummaryLabel(result) {
    const { entries, format, warnings } = result;
    const formatLabel = {
      "backloggd-csv": "Backloggd CSV",
      "hltb-json":     "HowLongToBeat backup",
      "plain-list":    "Game title list",
      "psn-trophy":    "PSN library",
      "playsputnik-json": "PlaySputnik backup",
    }[format] || format;

    const parts = [`${entries.length} games from ${formatLabel}`];
    if (warnings.length) parts.push(`⚠ ${warnings[0]}`);
    return parts.join(" · ");
  }

  window.PlaySputnikImport = {
    detectFormat,
    parseBackloggdCsv,
    parseHltbJson,
    parsePlainList,
    parsePsnTrophyTitles,
    importSummaryLabel,
  };
})();
