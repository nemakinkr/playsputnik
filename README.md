# PlaySputnik MVP Prototype

Static first prototype for validating PlaySputnik as an AI game companion:

1. Fast taste/context setup.
2. Memory for library, backlog, completed games, subscriptions, and ratings.
3. Taste-aware guidance for tonight, PS Plus, backlog, buy-later, and future radar.
4. Grounded explanations from structured sample facts.

For token-light development, start with `PROJECT_STATE.md`, then `NEXT_TASKS.md`, then `docs/development-protocol.md`. Those files are the compact working memory; this README is the fuller reference.

Quality gate (data -> module logic -> browser smoke -> perf budget):

```sh
./scripts/check.sh          # full, ~40s
./scripts/check.sh --fast   # ~3s, skips browser stages
```

The service worker is disabled on localhost, so dev reloads always serve
fresh code. See `CLAUDE.md` for working notes (perf rules, caches, pipeline).

Run a local preview server from this folder:

```sh
python3 -m http.server 4190 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4190`.

The prototype stores liked games, region, context, library states, hidden/saved games, and feedback in `localStorage`.

Cards, memory rows, and recommendation surfaces support explicit user states: `saved`, `want_to_finish`, `paused`, `owned`, `owned_forever`, `subscription`, `playing`, `completed`, `dropped`, and `hidden`.

The advanced import is an experimental power-user/workbench tool. It can parse a structured personal note into weighted wishlist items, access state, price notes, completed games, ranked taste history, and upcoming radar, but it is not part of the assumed core onboarding.

The first screen has three entry paths: quick taste, PSN library demo import, and deep rating. Each path now states its immediate value: quick taste is fastest and account-free, PSN/library is library-first with duplicate-buy guardrails, and deep rating accepts pasted text as an optional stronger profile. Quick taste uses a 30-game swipe-style known-games check with `Liked`, `Not for me`, and `Not played` reactions so the assistant learns both pull and push signals before any account connection. The 30 games are selected as a diagnostic taste matrix, not just a popularity list: story, choice, challenge, horror, cozy, survival, co-op, multiplayer, shooter, sports, strategy, short-session, long-session, puzzle, racing, simulation, creative/social, and service-game signals are all represented. See `docs/onboarding-strategy.md`.

The known-games check has a soft three-signal gate: after three like/dislike signals the companion can make a cautious first hypothesis, not claim it understands the user. Six real taste signals make the starter profile safer, ten mark a sharper profile milestone, and the full 30-game swipe is optional calibration. The default first run starts with no pre-filled liked games, so the first opinion is earned from user input rather than seeded demo taste. If early signals conflict, the UI marks the profile as mixed and the adaptive selector prioritizes a targeted follow-up game that clarifies the conflict internally. The visible card keeps some magic: it says `Good follow-up` or `Fresh angle` with a short human hint, rather than exposing scoring and atom math. The swipe deck also shows atom chips, a compact value proof, inline undo for the last answer, and progress meters that separate first-hypothesis readiness, sharper-profile readiness, and full-profile progress.

The gate now has a compact payoff ladder for `3 / 6 / 10` taste signals: first hypothesis, safer read, and sharper picks. It gives the user a visible reward for a few more swipes without implying that the companion fully understands them too early.

The `First 30 seconds` panel turns the first-run loop into a visible decision rail: taste signal, tonight context, top pick, and a compact mini-answer with pick, backup, guardrail, and direct actions.

The first-run bridge now includes a taste proof block: what the companion thinks the user is pulled toward, what it is cautious about, and why the current pick follows from those signals. This makes the first hypothesis feel earned instead of random.

The PSN/library start path now runs in library-first mode: the first recommendation, hero, companion answer, and 30-second proof prioritize the best playable game already in the user's library before any store decision.

The `Companion answer` panel turns the current ranking into one short human answer: what to play tonight, two practical alternatives, why the choice fits, what may annoy the player, and when not to buy anything yet.

Personal evidence blocks explain why a pick fits this specific player: similar liked/rated games, shared taste atoms, library/access status, fit band, and personal risk.

Personal fit forecasts stay honest: without an imported personal ranking they show a fit tier, and only switch to rank ranges when the user has provided enough ranked-history baseline.

The answer agenda is actionable: each playable recommendation can be marked `Play`, `Save`, or `Not tonight` directly from the decision row.

The last `Play`, `Save`, or `Not tonight` action can be undone from the first-run bridge or companion answer, so quick decisions feel reversible.

The answer supports `Not tonight`, a temporary skip that gives a new pick without poisoning long-term taste memory.

The `Library plan` panel turns PSN/manual states into action: finish games the user still cares about, resume active games, park paused games, use owned/subscription/permanent access before buying, keep hot wishlist items focused, and preserve completed/dropped games as taste evidence.

The seed catalog lives in `data/games.json` and now has 48 games, expanded from the original 24-game seed without changing recommendation logic.

The pre-MVP catalog and cover plan lives in `data/catalog-sources.json` and `docs/catalog-and-covers.md`. It separates broad game metadata, artwork, AI atomization, prices, and subscription availability so a large catalog does not force mass price refreshes.

The catalog growth queue lives in `data/catalog-backbone.json` and is visible in the `Catalog backbone` panel. It currently tracks 101 candidates across 10 lanes, including 24 records already promoted into `data/games.json`, plus remaining cover gaps, atom review needs, and price-watch priority.

The catalog promotion pipeline lives in `scripts/promote-catalog-candidates.mjs`. It promotes the next backbone batch into seed games, generated fallback cover records, and sample regional price snapshots while marking backbone records as `promoted_to_seed`.

The seed catalog refinement pass lives in `scripts/refine-seed-catalog.mjs`. It cleans promoted records so recommendation explanations use specific vibes, stronger tone/content signals, and safer wishlist defaults.

The game search panel searches the seed catalog, catalog backbone, a prototype external fixture index, an optional local RAWG provider endpoint, and a manual unverified fallback. Search source definitions live in `data/search-sources.json`; offline external fixtures live in `data/global-search-fixtures.json`; the provider endpoint lives in `scripts/search-provider-server.mjs`. The no-key discovery layer now has 117 external fixture records across cinematic/story, RPG/open-world, action/challenge, horror, co-op/service, cozy/short, strategy/sports/racing, and radar lanes. Provider/fallback results are reconciled against title aliases, the seed catalog, and the backbone before they can be saved, so aliases like `GTA 6`, `Civ 7`, `Wukong`, `Silksong`, and duplicate provider results do not create accidental wishlist duplicates.

Search matching now uses exact aliases, substring matches, and token-coverage matching. This lets short or partial queries find useful candidates before a paid API key exists. Manual unverified results also receive AI-inferred atoms in a separate `inferredAtoms` field, so the companion can reason about taste without pretending those atoms came from a provider.

Search and external wishlist items now show a source passport: catalog status, match confidence, cover readiness, price readiness, platform scope, and atom source. External items also get a lightweight AI enrichment block with preliminary taste fit, inferred atoms when provider tags are missing, personal-risk copy, and an explicit checklist of missing facts. This borrows the useful trust pattern from game-library tools: AI can help the companion reason immediately, but prices, PS Plus availability, language, covers, and platform facts stay marked as unverified until a source confirms them.

The catalog import pipeline lives in `scripts/import-catalog-backbone.mjs`. It turns text notes or CSV-style lists into a `catalog-import-preview` with inferred lane, atoms, priority, source, cover need, price need, duplicate skips, and manual-review flags. The fixture is `test/fixtures/catalog-import-note.txt`.

The catalog import sandbox lives in `data/catalog-workbench.json` and is visible in the `Catalog workbench` panel. It checks match confidence, cover readiness, atomization status, manual review needs, and whether a record deserves hot price refresh.

Title matching aliases live in `data/title-aliases.json`. The app now normalizes diacritics, curly punctuation, and localized aliases before matching user notes, ratings, catalog records, drops, and imported games.

Cover records live in `data/cover-snapshots.json`. The current 48-game seed catalog now has attributed RAWG cover candidates for every seed record, while generated posters remain the fallback for unresolved future imports.

The cover resolver lives in `scripts/resolve-cover-candidates.mjs`. It reads `RAWG_API_KEY` from the environment or `.env.local`, asks RAWG for remote image candidates, stores them as `candidate` records with source attribution, and leaves generated posters in place when no key or no safe match exists. It does not cache original third-party images.

Store data is split out into `data/price-snapshots.json`, `data/price-history.json`, and `data/subscription-availability.json`. The app merges these files at load time, which keeps changing prices, historical lows, and subscription status separate from stable game metadata.

`Price watch` now shows narrow historical-low context for hot-intent games: target price, watch reason, and whether the current sample price matches or sits above the recorded low.

`Buy decision` converts sale data into a small purchase ladder: buy one, buy two when budget allows, use a second pick, or wait.

Refresh economics live in `data/refresh-policy.json`. The prototype uses this policy to separate hot intent, warm intent, and cold catalog checks so P0 can avoid mass-price-tracking costs.

Future/upcoming game signals live in `data/taste-radar.json`. They are sample signals for validating the companion/radar loop, not live release-date claims.

Monthly/subscription drop triage lives in `data/monthly-drop.json`. It models the companion answer pattern: claim, try, skip download, or put later.

The subscription cadence layer lives in `data/drop-calendar.json`. It keeps the two known monthly checkpoints separate from exact current-month dates, which must come from verified ingestion.

Drop decisions are intentionally short-lived as news. `Play later` moves a fitting drop game into the user's ordinary memory list, while claim-only and rejected items stop taking space in the main recommendation flow.

`data/taxonomy.json` defines the first atomization axes, including adult-player signals such as `reviewBurden`, `adultTimeFit`, and `commitment`.

See `docs/data-source-strategy.md` for the planned catalog, price, and PS Plus ingestion strategy.

See `docs/catalog-and-covers.md` for the pre-MVP large catalog and cover-art strategy.

See `docs/product-minimum.md` for the agreed MVP scope.

See `docs/companion-answer-pattern.md` for the verdict structure used on subscription drops.

See `docs/decision-agenda.md` for the compact companion plan shown near the top of the prototype.

See `docs/taste-memory.md` for the visible taste fingerprint that makes the companion feel understandable.

The `Recently learned` panel makes button feedback visible: recent actions show which atoms were boosted or reduced.

Use `docs/demo-script.md` for a short investor/demo walkthrough.

Validate the local data workbench:

```sh
node scripts/validate-data.mjs
```

This writes `data/data-health.json`, which the prototype uses for coverage and gap metrics.

Run the scenario QA harness:

```sh
node scripts/qa-harness.mjs
```

It checks DOM selector wiring, personal-evidence slots, PSN demo state import, expanded library states, `Library plan` rows, state-change behavior, buy guardrails, and non-loading generated statuses.

Check or repair the local preview server:

```sh
node scripts/preview-server.mjs --check
node scripts/preview-server.mjs --restart
```

Without flags, `node scripts/preview-server.mjs` runs in repair mode: it leaves a healthy `4190` server alone, but kills and restarts a listener that returns an empty or bad GET response. This is the first thing to run when the browser appears to hang.

Split embedded store fields from the seed catalog when adding older sample data:

```sh
node scripts/split-store-data.mjs
```

Run synthetic recommendation checks:

```sh
node scripts/recommendation-smoke-test.mjs
```

Run a browser smoke check against the local preview:

```sh
node scripts/browser-smoke-test.mjs
```

The browser smoke uses installed Chrome and a DOM click fallback. It checks that the first-run swipe starts at `0/30`, a `Liked` answer moves it to `1/30`, inline undo appears, and the `Dev health` panel loads its snapshot rows. If `curl http://127.0.0.1:4190/` returns `Empty reply from server`, run `node scripts/preview-server.mjs --restart` before debugging app code.

Run the app-view navigation smoke after changing product sections:

```sh
node scripts/app-view-smoke-test.mjs
```

It checks that `Today`, `Library`, `Discover`, `Wishlist`, and `Data` reveal the intended panels, switch the visual catalog shelf/cluster defaults, and persist the active view in `localStorage`.

Run the Library/Wishlist smoke after changing user-game memory or purchase triage:

```sh
node scripts/library-wishlist-smoke-test.mjs
```

It applies library-like demo memory, checks the Library dashboard and queue filters, opens Wishlist triage rows, checks Wishlist filters, and verifies `Bought` persistence as owned forever.

Run the game detail drawer smoke after changing card actions, detail layout, or state persistence:

```sh
node scripts/game-detail-smoke-test.mjs
```

It opens the detail drawer from the hero, checks status cards, facts, atoms, source attribution, persists `Play` as playing, and verifies the drawer closes cleanly.

Run the visual catalog interaction smoke after library-grid changes:

```sh
node scripts/visual-catalog-smoke-test.mjs
```

It switches the visual catalog from `Smart` to `Catalog`, checks that the shelf renders enough cover cards, marks the first card as `Play`, and verifies the saved state in `localStorage`.

The prototype also has a `Dev health` panel backed by `data/dev-health.json`. It surfaces the last known preview-server, data-health, browser-smoke, app-view-smoke, library-wishlist-smoke, game-detail-smoke, visual-catalog-smoke, and provider-endpoint status in the UI, while keeping the actual repair commands explicit.

Synthetic fixtures live under `test/fixtures` and are intentionally separate from product seed data.

Set local provider secrets by copying `.env.example` to `.env.local` and filling only local values:

```sh
cp .env.example .env.local
```

`.env.local` is ignored by git. Both `scripts/search-provider-server.mjs` and `scripts/resolve-cover-candidates.mjs` read it automatically, while command-line environment variables still take priority.

Run the optional local provider-backed search endpoint:

```sh
node scripts/search-provider-server.mjs --port 4191
```

Set `RAWG_API_KEY` before launch to use RAWG. Without it, the endpoint returns fixture fallback results in the same normalized shape.

Check the provider endpoint once without starting a long-running server:

```sh
node scripts/search-provider-server.mjs --once "Grand Theft Auto"
```

Preview real cover candidates, or write them into `data/cover-snapshots.json` after checking the output:

```sh
node scripts/resolve-cover-candidates.mjs --limit 8
node scripts/resolve-cover-candidates.mjs --limit 8 --write
node scripts/resolve-cover-candidates.mjs --title "Stray"
```

Preview a batch of no-key external search records:

```sh
node scripts/import-global-search-fixtures.mjs test/fixtures/search-fixture-import.txt --json
node scripts/import-global-search-fixtures.mjs test/fixtures/search-fixture-expansion-80.txt --json
```

Append reviewed records into `data/global-search-fixtures.json`:

```sh
node scripts/import-global-search-fixtures.mjs your-list.txt --write
```

Preview catalog imports without mutating the backbone:

```sh
node scripts/import-catalog-backbone.mjs test/fixtures/catalog-import-note.txt --json
```

Promote the next catalog backbone batch into the seed catalog:

```sh
node scripts/promote-catalog-candidates.mjs --limit 24
```

Refine promoted seed records after a promotion batch:

```sh
node scripts/refine-seed-catalog.mjs
```

## Deploy & data automation (GitHub)

Pushed to `main` → deployed to GitHub Pages by
[`deploy-pages.yml`](.github/workflows/deploy-pages.yml). All asset and data
paths are relative, so the app works both at a domain root and under a
project subpath (`username.github.io/playsputnik/`).

`data/*.json` is refreshed daily by
[`update-data.yml`](.github/workflows/update-data.yml):

| Script | Source | Secret |
|---|---|---|
| `scripts/update-prices.mjs` | [IsThereAnyDeal](https://isthereanydeal.com) API | `ITAD_API_KEY` |
| `scripts/update-psplus.mjs` | PS Store category pages (undocumented) | — |
| `scripts/update-covers.mjs` | [RAWG](https://rawg.io) API | `RAWG_API_KEY` |
| `scripts/validate-data.mjs` | consistency gate before commit | — |

Failed sources open a `source-health` issue automatically; healthy sources
still update, and stale records keep their previous `checkedAt` timestamps.

Secrets live in repo **Settings → Secrets → Actions** (`RAWG_API_KEY`,
`ITAD_API_KEY`). For local runs put the same keys in `.env.local` (gitignored).

## Attribution & data notes

- Game cover images are **candidates from the RAWG API**; each record carries
  a `sourceUrl` back to RAWG. This product uses the RAWG API but is not
  endorsed or certified by RAWG.
- Price data comes from the IsThereAnyDeal API with per-record `checkedAt`
  freshness; the UI never claims a live price without source + freshness.
- PS Plus availability is read from public PS Store category pages and is
  marked with its own `checkedAt`/`freshnessState`.
- PSN import in the UI is demo logic, not a real PSN integration.
- PlayStation and PS Plus are trademarks of Sony Interactive Entertainment.
  This is an unofficial fan-made prototype, not affiliated with Sony.
