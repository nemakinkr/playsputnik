# PlaySputnik Backlog

Last updated: 2026-06-11. Pick the next task here without rereading the
whole chat. Context: HANDOFF.md (what was done), PROJECT_STATE.md (state),
CLAUDE.md (dev workflow + perf rules). The user's decision: **polish before
showing the product to people** — retention/analytics tracks are
deliberately deferred until there are users.

Run `./scripts/check.sh` before claiming any task done.

## Track: Polish (current focus)

### 1. Wishlist price alerts UI

Status: todo. Backend exists: `watch.targetPrice` is already used by
wishlist decision copy ("target $X / historical low").

Goal: let the user set/change/clear a target price per wishlist game.

- UI: small "Alert below $X" control in the game drawer (wishlist games)
  and/or wishlist rows.
- Persist into the existing watch structure; show state in wishlist rows.
- No push delivery yet (no users) — visual "below target!" badge is enough.
- Files: app.js (drawer + wishlist render), src/app-wishlist.js, styles.css.

### 2. Backlog amnesty

Status: todo. Niche-defining feature ("decision fatigue relief").

Goal: a game the user has seen and skipped 5+ times gets a gentle prompt:
"Let it go — you're not going to play this, and that's fine" → archive
without guilt + honest stat on the Stats view.

- Track per-title impression/skip counts (state.userEvents already logs
  some; may need a light seen-counter in recommendation surfaces).
- Prompt as a card in Today view; archive = hidden with a dedicated source
  tag so Stats can count "amnestied" separately.
- Files: app.js, src/app-state.js, src/app-recommend.js, Stats renderer.

### 3. Onboarding dogfood pass

Status: follow-up. The first polish pass is done: the 3-signal payoff no
longer appears on an empty profile, the hero cards use the same quick-reaction
format as the main swipe deck, and the first-run bridge now says "use now,
improve later" with swipes / library / pasted-rating paths. Next work here
should be driven by real dogfooding notes, not more abstract copy tuning.

### 4. Chunk-label copy refinement

Status: todo, small. `gameChunkProfile` labels can mislabel edge cases
("one full run" for Stray via its platformer atom). Scoring is fine; refine
label selection (e.g. require roguelike/arcade for "run" wording).

## Track: Data

### 5. PS Plus Premium category id

Status: blocked/parked. 8 UUID candidates from the PS Store hub page all
returned 0 products. 3 manual Premium records remain in
subscription-availability.json. Revisit occasionally.

### 6. TLOU Part II SKU merge decision

Status: decision needed. "The Last of Us Part II" and "... Part II
Remastered" coexist (different SKUs/prices, same content). Either
alias-merge (one entry, prefer Remastered) or keep both deliberately.

### 7. Catalog expansion +100

Status: todo, low priority. scripts/expand-catalog.mjs +
apply-atom-corrections.mjs pipeline exists; mind RAWG rate limits.

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
