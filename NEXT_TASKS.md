# PlaySputnik Backlog

Last updated: 2026-06-12. Pick the next task here without rereading the
whole chat. Context: HANDOFF.md (what was done), PROJECT_STATE.md (state),
CLAUDE.md (dev workflow + perf rules). The user's decision: **polish before
showing the product to people** — retention/analytics tracks are
deliberately deferred until there are users.

Run `./scripts/check.sh` before claiming any task done.

## Track: Polish (current focus)

### 1. Wishlist price alerts UI

Status: done. Users can set/change/clear per-region target prices from
Wishlist rows and the game drawer. Targets persist in
`userGames[key].priceWatch.targets[region]`; wishlist decisions now compare
against the custom target instead of only the global budget and show a
"Below target" buy-zone when a watched price reaches the alert. Follow-up
polish done: the control now renders as a compact status + currency-input
widget in both Wishlist and drawer, with desktop/mobile layout smoke checks.

### 2. Backlog amnesty dogfood

Status: follow-up. P0 is done: explicit Skip/Snooze actions increment a
stable per-title `userGames[title].amnesty.skips` counter; after 5 skips the
Today view can show a "Let it go" card; archive sets hidden with
`source: "backlog_amnesty"` and Stats counts/list amnestied games. Follow-up
done: amnestied games can be restored to Wishlist from the detail drawer or
Stats, and "Keep it" now uses a small skip cooldown before prompting again.

Next work should come from dogfooding: tune the threshold, decide whether
owned/subscription games should ever be eligible, and consider a "restore"
flow if amnestied games feel too buried.

### 3. Onboarding dogfood pass

Status: follow-up. The first polish pass is done: the 3-signal payoff no
longer appears on an empty profile, the hero cards use the same quick-reaction
format as the main swipe deck, and the first-run bridge now says "use now,
improve later" with swipes / library / pasted-rating paths. Next work here
should be driven by real dogfooding notes, not more abstract copy tuning.

### 4. Chunk-label copy refinement

Status: done. `gameChunkProfile` now reserves "one full run" for true
run-based games (roguelike/deck-builder/card-battler), uses match wording for
sports/racing/fighting/arcade cases, and keeps puzzle/platformer story games
on chapter/area/session wording. QA harness has a Stray/Hades regression.

### 5. Game Detail 2.0

Status: done. The drawer now opens as a decision cockpit: next move, forecast,
taste proof, risk, value, taste-fit evidence, atom signal map, data trust rows,
source passport, actions, rating, price alert, similar games, and Get it links
live in one scan-friendly flow. `game-detail-smoke-test.mjs` now asserts the
cockpit/taste/source-trust contract instead of only checking that the drawer
opens.

Follow-up done: the cockpit now has a smart primary CTA. It changes by game
context: playable games move to Playing, Plus signals add subscription access,
buy-zone games open the PS Store when a source URL exists, watched games stay
price-watched, and unknown games go to Wishlist. The smoke test now clicks the
CTA and verifies stateful actions update memory.

## Track: Data

### 6. PS Plus Premium category id

Status: blocked/parked. 8 UUID candidates from the PS Store hub page all
returned 0 products. 3 manual Premium records remain in
subscription-availability.json. Revisit occasionally.

### 7. TLOU Part II SKU merge decision

Status: decision needed. "The Last of Us Part II" and "... Part II
Remastered" coexist (different SKUs/prices, same content). Either
alias-merge (one entry, prefer Remastered) or keep both deliberately.

### 8. Catalog expansion +100

Status: todo, low priority. scripts/expand-catalog.mjs +
apply-atom-corrections.mjs pipeline exists; mind RAWG rate limits.

## Track: Dev Loop

### 9. Library/Wishlist smoke seed hardening

Status: done. `scripts/library-wishlist-smoke-test.mjs` now waits for the
deferred render before mutating storage, writes localStorage + IndexedDB
together, clears stale preloaded IDB state, and restored the strict Access-row
assertion. This prevents old deferred saves from clobbering the seeded profile.

### 10. Production smoke after Pages deploy

Status: done. `.github/workflows/deploy-pages.yml` now runs
`scripts/production-smoke-test.mjs` after deploy against the published Pages
URL. The smoke checks HTML, `app.js`, `sw.js`, `data-health.json`, and
`search-sources.json`, including the search-memory panel and versioned service
worker contract.

## Track: Deferred (until there are users)

- Web Push "evening ritual" (HTTPS + SW already in place).
- Analytics (GoatCounter or similar) — deliberately not yet.
- "Wrapped" year summary, gift mode (taste/wishlist share links exist).
- Anti-hype buy guard (price-history + Plus-drop prediction).

## Done (this session series — see HANDOFF.md for detail)

- Onboarding polish: 3 real taste signals unlock the first-pick payoff; empty
  profiles see a start prompt instead of a premature recommendation; hero
  tiles write canonical quick reactions; first-run bridge now explains that
  the app is usable now and can be sharpened later with more swipes, library
  access, or pasted ratings.
- Global search memory flow: search/provider/manual results can be added
  directly to Wishlist, Library, or Plus from the result row, with an in-row
  confirmation state and a smoke test covering direct Wishlist plus detail
  Plus persistence.
- Backlog amnesty P0: repeated explicit skips are tracked per title; Today can
  suggest archiving a repeatedly skipped game without guilt; amnestied games
  are hidden with a dedicated source and counted/listed in Stats.
- Catalog 456, dedupe, 100% cover coverage, discount snapshots, regional
  price coverage with honest missing-price issues, HLTB, reference-data fixes.
- GitHub repo + Pages deploy + daily data workflows + source-health monitor + CI.
- Session planner (chunk model), sputnik ratings 1–5 feeding taste,
  "Get it" links, Stats view, dark mode, design system + logo + PWA icons,
  catalog UX (search/filters/sort/pagination/keyboard), share links,
  error states, a11y (focus trap, skip-link), swipe-to-close.
- Perf: 3657ms → 33ms render (memoization contract + view-gating +
  titleKey cache); perf budget test with populated profile.
- Dev loop: SW off on localhost, scripts/check.sh one-command gate.
