# Companion Answer Pattern

## Purpose

PlaySputnik should answer like a taste-aware companion, not a generic catalog or price tracker.

The primary surface should start with one short human answer before detailed cards: what to play, why it fits, what may annoy the player, and what to do next.

## Monthly / Subscription Drop Format

When new free, subscription, or claimable games appear, the companion should separate three decisions:

1. Claim it for the library.
2. Download or install it.
3. Spend evening time on it now.

There are two planned subscription checkpoints per month in the product model:

1. Early-month claimable games.
2. Mid-month Extra/Premium catalog refresh.

The cadence can be treated as known product structure. Exact dates, lineups, regions, and leaving-soon claims still need source-backed ingestion before the app displays them as facts.

This should behave like an inbox, not a permanent home screen module. Once the user confirms or rejects the verdict, fitting games can move into "play later" memory and the drop should cool down until the next checkpoint.

If the user chooses "play later", the game should stop being treated as drop news and become ordinary memory in the user's game list.

## Required Verdict Fields

- Fit level.
- Claim decision.
- Install decision.
- Play-now decision.
- Predicted ranking range or relative priority.
- Trial window.
- Why it fits.
- Why it may fail.
- Next action.
- Source/freshness status for factual claims.

## Product Rule

It is acceptable to say "claim it, but do not play it now." That is often the most valuable answer for an adult player.

It is also acceptable to stop talking about the drop after the decision. The product should not make subscription news feel like homework.

Recommendations should include a small caution, not only a positive reason. A trusted companion says both "why this fits" and "what might annoy you tonight."

"Not tonight" is a session-level skip, not a taste dislike. It should immediately produce an alternative without teaching the model that the user hates that game's atoms.

## Trust Rule

Taste inference and factual availability are different layers. The AI can infer fit from atoms and user history, but store/subscription claims need source-backed data.
