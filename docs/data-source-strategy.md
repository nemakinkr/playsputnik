# PlaySputnik Data Source Strategy

## Core Problem

PlaySputnik needs continuously updated data for six different layers:

1. Game identity and metadata.
2. AI atomization and taste descriptors.
3. User memory: ratings, completed games, owned games, backlog, wishlist, and subscriptions.
4. Upcoming/radar signals matched to taste.
5. Region-scoped prices, discounts, editions, bundles, and PS Plus member prices.
6. Region-scoped subscription availability and catalog changes.

The recommendation layer must never treat generated text as a source of truth for price, availability, subscription, ownership, or region claims.

## Recommended Source Stack

### P0 / Closed Beta

Use a no-paid-provider controlled dataset:

- Seed catalog: 50-150 games, stored in `data/games.json`; current prototype has 48 games after the first promotion batch.
- Catalog backbone: 100+ queued candidates in `data/catalog-backbone.json`, used to plan promotion into the seed catalog without requiring full price/cover refresh for every title; promoted records stay marked as `promoted_to_seed`.
- Search sources: `data/search-sources.json` defines local, backbone, fixture, manual, and provider-endpoint search layers; `data/global-search-fixtures.json` is the 117-record offline stand-in for provider results; `scripts/search-provider-server.mjs` is the optional RAWG/fallback provider endpoint. Search uses aliases plus token-coverage matching so shorthand queries can work before paid API access. Batch growth for this no-key index lives in `scripts/import-global-search-fixtures.mjs`, which can preview or append reviewed text/CSV lists while skipping seed, backbone, and existing fixture duplicates.
- Metadata base: IGDB or RAWG for stable game metadata.
- AI atomization: generated from metadata, reviews, tags, and manual checks.
- AI enrichment passport: immediate taste fit, inferred atoms, risk notes, and missing-fact checklist for searched or manually added games. This is allowed before provider verification only when the UI labels it as inferred and does not claim current price, subscription status, language support, or exact platform availability.
- Taste radar: sample upcoming/relevant leads in `data/taste-radar.json`.
- Prices: small monitored region set in `data/price-snapshots.json`, manual/semi-automated snapshots, no paid pricing API.
- Price history: narrow hot-intent history in `data/price-history.json`, used for historical-low context without implying full-market coverage.
- PS Plus: separate `data/subscription-availability.json` records, because catalog membership changes independently from ordinary store prices.
- Drop cadence: `data/drop-calendar.json` models the two monthly subscription checkpoints while exact dates and lineups remain source-backed data.
- Regions: start with 3-5 target regions, not every PlayStation Store region.
- Source status: visible in product/admin through `data/source-status.json`.

Goal: prove recommendation value and price/subscription trust on a narrow catalog.

Open-source review supports this direction. PlaySputnik should borrow the proven shape of library/backlog tools, not their full scope: a neutral catalog record, a separate user-game memory record, and a narrow price-watch/history layer for high-intent games. See `docs/open-source-references.md`.

## Refresh Economics

P0 should not try to refresh the whole market. Refresh work is prioritized by intent:

- Hot intent: saved games, strong wishlist signals, top recommendations, and high discounts. Refresh every 6-12 hours while the game remains active.
- Warm intent: backlog, medium-fit recommendations, and games near the user's budget. Refresh every 24-48 hours.
- Cold catalog: long-tail records. Refresh only on demand or when a recommendation needs the data.

This keeps the expensive part of the product tied to user decisions instead of catalog size. The working policy lives in `data/refresh-policy.json`.

Historical lows should be derived only from stored price-history records for watched games. If history is missing, PlaySputnik should say that rather than pretending to know the market low.

### P1 / Public MVP

Add ingestion jobs and source health:

- Daily full catalog metadata sync.
- Price snapshots every 6-12 hours for active regions.
- Faster sale-period price refresh if source supports it.
- Daily PS Plus catalog diff.
- Current-month drop-date and lineup ingestion for both known monthly subscription checkpoints.
- Manual override/suppression for bad matches and stale data.
- Admin view for freshness, source, and recommendation audit.

### P2 / Scale

Move to a proper provider-first architecture:

- Paid B2B pricing/subscription source only if economics and usage data justify it.
- Internal normalized store entity model.
- Incremental change detection.
- Multi-provider reconciliation.
- Alert eligibility based on freshness and confidence.

## Source Options

### Stable Game Metadata

Use IGDB or RAWG as initial sources for non-price metadata: titles, platforms, genres, release dates, age ratings, screenshots, tags, descriptions, and related entities.

These sources do not replace PlayStation Store pricing or PS Plus availability.

### Prices And Discounts

Best long-term option: licensed or B2B provider with region-scoped PlayStation pricing.

P0 option: focused no-paid ingestion for a small number of regions and games, with strict freshness labels and suppressed claims when stale.

Avoid building the entire business on fragile scraping unless there is no other path. If scraping is used, keep it conservative, cache responsibly, respect robots/terms, and design for source failure.

### PS Plus Catalog

Treat PS Plus availability as separate from ordinary store availability:

- `game_id`
- `region`
- `tier`
- `available_from`
- `available_to`
- `source`
- `checked_at`
- `freshness_state`

If PS Plus data is stale, do not say "available in PS Plus". Show a non-subscription recommendation or mark confidence as limited.

## Freshness Contracts

| Data type | Target freshness | User-facing rule |
| --- | --- | --- |
| Game metadata | 7-30 days | Can still recommend if stable fields exist. |
| AI atoms | On metadata change or manual review | Can be used if source metadata is known. |
| Current price | 6-12 hours | Suppress price claims if stale. |
| Discount | 6-12 hours | Do not say "worth buying now" if stale. |
| PS Plus availability | 12-24 hours | Suppress subscription claims if stale. |
| Leaving soon | 12-24 hours | Only alert if source is fresh and dated. |

## Data Model Additions

```json
{
  "source": "provider_name",
  "sourceUrl": "https://example.com/item",
  "checkedAt": "2026-05-26T00:00:00Z",
  "freshnessState": "fresh",
  "confidence": "high"
}
```

Use this on price snapshots, subscription records, and generated atom sets.

## Product Rule

When in doubt, PlaySputnik should show less. A missing price is acceptable. A wrong price breaks trust.

For external/manual games, PlaySputnik may still show an AI-inferred taste read: why the title might fit, what could be risky, and which facts remain missing. The trust contract is that inferred companion reasoning and verified catalog/store facts are visually separate.
