# PlaySputnik Product Strategy

Last reset: 2026-07-14.

## North Star

PlaySputnik is an independent gaming decision companion for adults with money
to buy games and little time to research or play them. It should remember a
person's gaming life and answer four practical questions:

- What should I play now?
- Should I buy this, use access I already have, or wait?
- What upcoming or subscription game is actually relevant to me?
- What should I stop carrying in my backlog?

"AI recommends games" is not sufficient positioning. Xbox, Steam, and newer
backlog products already cover generic recommendations. Our useful wedge is a
cross-source memory plus explicit play / buy / wait / let-go decisions that
combine taste, available time, ownership, subscriptions, and honest live data.

## Product Boundaries

- The onboarding swipe deck is one optional input path, not the product center.
  Do not tune it further without real-user evidence.
- A pasted rating, free-form note, library import, direct search/add, and a
  future account integration are equally valid ways to teach the companion.
- Prices, subscription status, platforms, languages, dates, and ownership are
  sourced facts. A language model may interpret them but must never invent or
  replace their provenance and freshness.
- Price tracking and subscription drops support the companion; they are not
  the primary product or the reason to create more top-level surfaces.

## Hybrid Intelligence Architecture

1. **Fact plane:** RAWG identity/metadata candidates, store-backed prices,
   PlayStation subscription data, release data, and explicit freshness.
2. **Memory plane:** ratings, ranking order, library state, progress, wishlist,
   access, upcoming interest, and feedback. Preserve exports and local fallback.
3. **Decision plane:** deterministic candidate generation, constraints,
   guardrails, and a useful offline fallback.
4. **AI reasoning plane:** parse arbitrary user input, build a semantic taste
   read, propose confidence-labeled semantic atoms, rerank a bounded candidate
   set, and explain decisions in the user's language. Prefer structured output
   and cached calls.
5. **Action plane:** play, save, buy, wait, use subscription access, or let go.

The AI provider is replaceable. Cloudflare Workers AI is the prototype default
because the backend is already deployed there and has a daily free allocation;
Anthropic or another paid provider may be added later without changing clients.
Deterministic EN/RU output remains the instant fallback whenever AI is absent,
rate-limited, slow, or invalid.

## Priority Order

1. Activate the hybrid AI core on the existing product surfaces.
2. Let AI parse free-form rankings, notes, and imports into reviewable memory.
3. Strengthen the recurring Today / My Games decision loop.
4. Simplify navigation around Today, My Games, Discover, and Wishlist; keep
   Taste/Stats secondary and Data diagnostic.
5. Validate with real users before more model tuning, new screens, or deep
   price-tracker work.
6. Add account sync and durable cross-device memory before a public beta.

## Stop List

Until real-user evidence changes the order, do not spend a work cycle on:

- more synthetic onboarding optimization or onboarding copy variants;
- manual catalog expansion in small batches when provider-backed lazy import
  can solve the same user path;
- a new top-level section;
- broad price-tracker parity;
- internal benchmark improvements that do not change a visible decision.

Synthetic and founder benchmarks remain regression gates, not the roadmap.
