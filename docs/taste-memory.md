# Taste Memory

## Purpose

PlaySputnik should make the user feel understood before asking for more input.

Taste memory is the compact fingerprint shown near the top of the product. It summarizes what the companion currently believes about the player.

## Signals

- Liked starter games.
- Imported ratings.
- Library and backlog states, including paused, want-to-finish, permanent ownership, subscription access, and dropped games.
- Completed games from explicit state or advanced import.
- Button feedback such as playing, paused, want-to-finish, completed, dropped, hidden, and play-later decisions.
- Session and adult-time patterns.

## Output

- Likes: positive atoms and signals.
- Careful with: negative or weak signals.
- Session shape: likely play window.
- Adult fit: when the game fits real life.
- Confidence: early, medium, or high based on evidence count, including repeated product actions.
- Recently learned: the latest user actions and the atoms they nudged up or down.
- Personal evidence: similar liked/rated games, shared atoms, library/access reason, fit band, and personal risk for a specific recommendation.

## Product Rule

Taste memory should be visible and editable over time. A hidden recommendation model feels like a black box; a visible memory feels like a companion.

Button feedback should influence future recommendations, but it should stay lightweight. One "not for me" should nudge taste, not permanently poison an entire genre.
