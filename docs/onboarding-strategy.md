# PlaySputnik Onboarding Strategy

## First 30 Seconds

The user must see value before doing heavy setup. The first screen should offer three entry paths:

1. PSN/library import as the preferred future path.
2. Quick taste setup for a recommendation in under a minute.
3. Deep rating mode for users willing to rate a larger batch.

## Product Rule

Do not make the user build a perfect profile before showing the first useful decision.

The first value should be companion value, not price value: remember my games, understand my taste, and answer what to play next.

The first screen should show a compact decision receipt after setup:

1. What to play tonight.
2. What to use from owned/subscription access.
3. What to claim or ignore from the current subscription drop.
4. What taste signal the companion already learned.

## Entry Paths

### PSN / Library Import

Best long-term path. It should pull owned games, played games, trophies or playtime if available, wishlist, and subscription access. The immediate value is purchase guardrails: do not recommend buying what the user already owns or can play through subscription.

### Quick Taste

Low-friction fallback. Ask for swipe-style reactions to 30 widely known, taste-diagnostic games, then show a cautious first hypothesis immediately after three like/dislike signals. This path should be enough for visible first value even if confidence is lower, and it should capture both negative taste and "not played" skips without forcing the user to finish setup.

The first run should not pretend the user has already liked games. Demo buttons can still seed sample profiles, but the ordinary quick-taste path should begin blank and earn its first opinion from the user's first three like/dislike signals.

The 30-game set should behave like a taste matrix, not a chart of universally beloved games. It must include several games the user may reject, because negative signals are useful. The current prototype covers story, choice, challenge, horror, cozy, survival, co-op, multiplayer, shooter, sports, strategy, short-session, long-session, puzzle, racing, simulation, creative/social, and live-service signals.

The swipe order should be adaptive. After every answer, the next card should prioritize an uncovered diagnostic signal, so the user does not spend early swipes on several similar story/open-world games while co-op, sports, strategy, horror, or cozy preferences remain unknown.

If the early profile has mixed atom signals, the next card should temporarily prioritize conflict resolution over broad coverage. The user should feel this as a useful next question, not see the whole mechanism: visible copy can say `Good follow-up` with a short calibration hint, while dev/QA can still verify the underlying conflict atom.

The active swipe card should feel like one quick decision, not a dense list: show the game, the diagnostic focus, a few atom chips, and progress toward first hypothesis, sharper profile, and full profile.

The active swipe card should also support undo for the last answer. Early onboarding clicks are high-friction mistakes: one accidental tap should not make the user feel their profile is already polluted.

The companion should explain profile maturity clearly: three taste signals are enough for a cautious hypothesis, six make the starter profile safer, ten make it noticeably sharper, the full 30-game swipe is optional calibration, and PSN access or a pasted text rating can improve it later. If early signals conflict, the product should say so directly and ask for more targeted signal.

The payoff should feel like a small reward, not an analytics report. A compact `3 / 6 / 10` ladder can label the moments as first hypothesis, safer read, and sharper picks, while avoiding any claim that the product fully knows the player after a few taps.

### Deep Rating

Optional power-user mode. A 30-50 game rating flow can create a stronger taste vector, but it should never be required for first value.

## Demo Implication

The prototype should show all three paths, even while PSN import is represented by demo data.
