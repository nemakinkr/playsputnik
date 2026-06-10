# Open-Source References

Reviewed on 2026-05-29.

This file records what PlaySputnik can safely learn from existing open-source game library, backlog, and price-tracking projects. It is not a plan to copy whole applications. The useful move is to adopt proven data-model patterns and product affordances while keeping PlaySputnik focused on the AI companion loop.

## Decision

Use three reference patterns:

1. **vglist-style personal game memory** for the core model.
2. **Playnite-style library import normalization** for future PSN/library import.
3. **Playnite-style source/freshness passports** so imported and searched games show which facts are trusted, inferred, or missing.
4. **Simple price-watch history** for narrow, user-intent-driven price tracking.

Do not use GPL or unlicensed code in the product codebase.

## Best References

### vglist

Repository: https://github.com/connorshea/vglist

License: MIT.

Most valuable pattern: separate the canonical game record from the user's relationship to that game.

Useful fields from the `GamePurchase` model:

- `completion_status`: unplayed, in progress, dropped, completed, fully completed, not applicable, paused.
- `rating`: 0-100.
- `hours_played`.
- `replay_count`.
- `start_date` and `completion_date`.
- many-to-many links to platforms and stores.
- event records when the user adds a game or changes completion status.

What we use:

- Split PlaySputnik's future model into `game` and `user_game`.
- Keep completion status separate from access status.
- Store user actions as events, not only as overwritten state.
- Use 0-100 internal ratings even if the UI shows hearts, thumbs, stars, or ranks.

### Playnite

Repository: https://github.com/JosefNemec/Playnite

License: MIT.

Most valuable pattern: imported library records are richer than a simple owned/not-owned flag.

Useful fields in the Playnite game model:

- source/library identifiers.
- installed state.
- playtime.
- last activity.
- added date.
- hidden/favorite flags.
- completion status.
- user score.
- genres, features, categories, and platforms.

What we use:

- Treat PSN import as a normalization problem, not a recommendation shortcut.
- Preserve imported facts with source and freshness.
- Keep source confidence visible in the product when a game comes from search, import, or manual entry.
- Support hidden, favorite/saved, installed/playing, playtime, and last activity as recommendation evidence.
- Keep platform/source identity attached to each imported library item.

### Steam-Game-Price-Alert

Repository: https://github.com/AliAlboushama/Steam-Game-Price-Alert

License: MIT.

Most valuable pattern: price tracking can be small and user-intent-driven.

Useful pattern:

- `games`: watched item plus optional target price.
- `price_history`: game id, platform app id, price, discount percent, timestamp.
- historical low derived from price history.

What we use:

- Add price history only for hot user intent: wishlist, saved games, likely recommendations, and near-budget games.
- Keep target price separate from current price.
- Use historical low as a confidence signal only when source freshness is acceptable.
- Avoid full-market price tracking in P0.

## Useful But Do Not Copy

### Backlog.rip

Repository: https://github.com/gsabater/backlog.rip

Use as UX/product inspiration only. Its README says the license is not decided and the code cannot be used without permission.

Useful ideas:

- local-first browser storage.
- simple statuses: completed, in progress, on hold.
- IGDB-backed game search.
- Steam import as an optional accelerator.

### GameTracker

Repository: https://github.com/Inderjit01/GameTracker

Use as a source-map reference only. No license file was present in the repository root during review.

Useful ideas:

- combine backlog, wishlist, completed games, completion time, and prices.
- source map: RAWG, HowLongToBeat, PlatPrices, IsThereAnyDeal.

### Augmented Steam

Repository: https://github.com/IsThereAnyDeal/AugmentedSteam

License: GPL-3.0. Do not copy code into PlaySputnik.

Useful ideas:

- historical low presentation.
- price comparison as supporting context, not a full recommendation.
- waitlist/collection style overlays.

## PlaySputnik Model Direction

The next model cleanup should move toward this shape:

```json
{
  "game": {
    "id": "game_control_ultimate_edition",
    "title": "Control Ultimate Edition",
    "aliases": ["Control"],
    "platforms": ["PS5", "PS4", "PC", "Xbox"],
    "atoms": ["story", "action", "systems", "strange"],
    "externalIds": {
      "rawg": "control",
      "igdb": "id",
      "steam": "870780",
      "psStore": "store-id"
    }
  },
  "userGame": {
    "gameId": "game_control_ultimate_edition",
    "access": "owned_forever",
    "completionStatus": "playing",
    "rating": 92,
    "hoursPlayed": 14,
    "startedAt": "2026-05-01",
    "completedAt": null,
    "lastActivityAt": "2026-05-29",
    "source": "psn_import"
  },
  "priceWatch": {
    "gameId": "game_control_ultimate_edition",
    "region": "TR",
    "targetPrice": 20,
    "watchReason": "wishlist"
  },
  "priceSnapshot": {
    "gameId": "game_control_ultimate_edition",
    "region": "TR",
    "price": 17.99,
    "discountPercent": 60,
    "checkedAt": "2026-05-29T00:00:00Z",
    "freshnessState": "fresh",
    "source": "manual_snapshot"
  },
  "userEvent": {
    "type": "completion_status_changed",
    "gameId": "game_control_ultimate_edition",
    "from": "paused",
    "to": "playing",
    "createdAt": "2026-05-29T00:00:00Z"
  }
}
```

## Practical Consequences

- The catalog stays neutral and source-backed.
- The user memory becomes the core product asset.
- AI enrichment can produce an immediate taste read, but source passports must keep inferred atoms separate from verified provider/store facts.
- Recommendations can explain themselves from durable personal facts.
- Prices remain useful without becoming the expensive center of the company.
- PSN import, text import, and manual onboarding all collapse into the same internal model.
