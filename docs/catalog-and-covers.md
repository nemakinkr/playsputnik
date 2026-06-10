# Catalog And Covers Strategy

This is a pre-MVP strategy. The goal is not to ship a huge catalog now. The goal is to avoid building the wrong data model before PlaySputnik has proven the companion loop.

## Product Position

The catalog is a support system for the companion, not the product by itself.

PlaySputnik should know enough games to answer real user questions:

- What should I play tonight?
- What fits my taste in a subscription catalog?
- What upcoming games should I keep an eye on?
- What wishlist items are worth watching?
- What similar games should I consider?

It does not need to refresh every game, every price, and every cover all the time.

## Catalog Growth Path

### Stage 1: Core Seed

Target: 50-150 games.

Use this to validate:

- Taste check.
- AI atomization.
- Library states.
- Companion explanations.
- Buy or wait logic.
- Subscription drop triage.

The current `data/games.json` is this layer. It has 48 games after the first backbone promotion batch.

The growth queue for this stage lives in `data/catalog-backbone.json`. It is not a live catalog yet; it is the promotion backlog from the seed toward a 150-game demo catalog. Each record is assigned to a lane, carries priority, atom readiness, cover status, adult-time fit, and price need, so we can grow the catalog deliberately instead of dumping unverified titles into `data/games.json`.

The import pipeline lives in `scripts/import-catalog-backbone.mjs`. It accepts plain notes or CSV-style input, skips titles already present in the seed/backbone, infers lane and atoms from explicit fields plus title heuristics, and produces a `catalog-import-preview` JSON. This keeps founder notes, wishlist lists, subscription lineups, and future search/import output flowing into the same reviewable backbone shape.

The promotion pipeline lives in `scripts/promote-catalog-candidates.mjs`. It moves the next eligible backbone batch into `data/games.json`, creates sample regional price snapshots, creates generated fallback cover records, and marks source backbone records as `promoted_to_seed`. The first batch promoted 24 records, taking the seed catalog from 24 to 48 games.

### Stage 2: Taste Expansion

Target: about 2,000 games.

This catalog should include:

- Popular games across PS5, PS4, PC, and Xbox.
- Current and upcoming releases.
- Subscription catalog candidates.
- Games similar to the user's taste.
- Wishlist and backlog candidates.
- Critically important older games.

This is the first stage where real covers become important because the app starts feeling like a living library.

### Stage 3: Search Cache

Target: 10,000-15,000 games.

This should be lazy, not fully refreshed.

When a user searches for a game, imports a library item, or mentions a title, PlaySputnik imports that record, normalizes it, enriches it, and stores it. Long-tail records can be refreshed rarely unless they become hot user intent.

## Source Stack

Use multiple sources, but with clear roles:

- RAWG: broad metadata, screenshots, tags, and initial image candidates.
- IGDB: strong normalized game data, useful after commercial terms are clear.
- MobyGames: paid enrichment candidate for covers, screenshots, historical data, and scores.
- SteamGridDB: artwork repair layer, not canonical metadata.
- Official store pages: trust anchor for platform identity and edition context.

The structured source plan lives in `data/catalog-sources.json`.

The import sandbox lives in `data/catalog-workbench.json`. It is intentionally small: its job is to prove that imported records can be inspected for identity confidence, cover readiness, atomization quality, manual review, and price-refresh eligibility before we grow the catalog.

The title matching layer lives in `data/title-aliases.json`. It protects imports from common catalog problems: diacritics, curly punctuation, shortened editions, alternate English spellings, and localized user notes.

The seed cover layer lives in `data/cover-snapshots.json`. For now every seed game has a generated fallback poster record with source, source URL, license note, and checked time. Provider images should replace these records gradually; recommendation logic should not care whether the visual came from a fallback, RAWG, IGDB, SteamGridDB, or an official store.

## Normalized Record Shape

```json
{
  "gameId": "game_control_ultimate_edition",
  "title": "Control Ultimate Edition",
  "aliases": ["Control"],
  "platforms": ["PS5", "PS4", "PC", "Xbox"],
  "releaseDate": "2021-02-02",
  "genres": ["Action", "Adventure"],
  "atoms": ["story", "action", "systems", "strange"],
  "description": "Short neutral description.",
  "cover": {
    "url": "https://source.example/cover.jpg",
    "source": "rawg",
    "sourceUrl": "https://source.example/game/control",
    "licenseNote": "Use with attribution under source terms.",
    "checkedAt": "2026-05-28T00:00:00Z"
  },
  "externalIds": {
    "rawg": "control",
    "igdb": "id",
    "steam": "appid"
  },
  "sourceConfidence": "medium",
  "lastSyncedAt": "2026-05-28T00:00:00Z"
}
```

## Cover Rules

Covers should be treated as source-backed records, not decoration.

Rules:

- Store remote URLs first; do not cache original images until rights and cost are clear.
- Keep `source`, `sourceUrl`, `licenseNote`, and `checkedAt` with every cover.
- Prefer official store art when the recommendation is store/platform-specific.
- Use generated placeholder art when source confidence is unclear.
- Do not call an image official unless the source supports that claim.
- Cover freshness is separate from price freshness.

## Refresh Economics

Catalog metadata is cheap compared with prices.

Recommended cadence:

| Layer | Refresh |
| --- | --- |
| Core seed | Manual weekly during prototype |
| Taste expansion | Weekly metadata refresh |
| Search cache | On import, then rarely unless hot |
| Covers | On import, then repair only if broken/missing |
| Prices | Only hot/warm intent, never full catalog |
| Subscription availability | Scheduled catalog checks |

## AI Atomization

AI should enrich the catalog after source import:

- Generate atoms.
- Estimate commitment and review burden.
- Summarize why the game might fit adult players with limited time.
- Suggest watch-outs.
- Detect likely taste neighbors.

But AI must not invent:

- Current prices.
- Subscription availability.
- Release dates.
- Platform availability.
- Source-backed cover status.

## Immediate Next Step

Before MVP, build a catalog workbench that can take 20-50 imported records and show:

- Which records matched confidently.
- Which covers are usable.
- Which games need manual review.
- Which atomization fields are missing.
- Which records are hot enough to deserve price checks.

The first version is now represented by the `Catalog workbench` panel in the prototype.
