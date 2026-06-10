# PlaySputnik Import Strategy

## Principle

Do not assume most users keep a detailed gaming note.

The core onboarding must stay lightweight:

1. Pick liked games.
2. Pick dislikes or negative signals.
3. Select mood, session length, difficulty, region, and subscription context.
4. Optionally paste ratings if the user already has them.

## Import Layers

### Core

Short manual onboarding and lightweight feedback.

### Optional

Ratings paste, because many users can export, remember, or write a short ranked list.

### Advanced / Workbench

Structured personal notes with wishlist, access, completed games, prices, rankings, and upcoming games.

This is useful for founder testing, power users, and future flexible LLM import experiments, but it must not shape the default product around a rare user behavior.

## Product Rule

Every import format should collapse into the same internal model:

- wishlist intent
- access state
- completed exclusions
- taste weights
- price watch hints
- upcoming interest

The UI should never require users to maintain a note in PlaySputnik's preferred format.
