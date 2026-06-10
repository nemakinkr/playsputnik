# PlaySputnik Demo Script

## Goal

Show PlaySputnik as an AI game companion, not a price tracker or game catalog.

Target length: 60-90 seconds.

## Demo Flow

1. Start with the user problem:
   "Adult players have money for games, but not time to choose. They need a companion that remembers their taste, library, backlog, subscriptions, and upcoming radar."

2. Show fast taste/context:
   Start with the entry paths: quick taste, PSN library demo import, and deep rating.
   Pick one path and show that recommendations change immediately.

3. Show the top recommendation:
   Explain that the recommendation is grounded in taste, time, subscription context, backlog memory, and library state.
   Then show `Companion plan`: the app turns all signals into a short agenda.
   Show `Taste memory`: the user can see what the companion believes about their taste.

4. Show why it is trusted:
   Open `Why this ranking` and point to score contributors: taste, imported taste, adult time fit, review burden, PS Plus, budget, access.

5. Show price/subscription intelligence:
   Open `Monthly drop triage`; show that PlaySputnik can say "claim it, but do not play it now."
   Open `Taste radar`; show upcoming/sample leads based on the user's atoms.
   Open `Buy-later watch`; mention that prices are only a supporting signal.
   Then show `Refresh policy`: PlaySputnik refreshes hot intent first instead of paying to monitor the whole market.

6. Show Library/Backlog:
   Mark a game as `Owned` or `Completed`.
   Show that PlaySputnik stops recommending it for purchase or removes it from active recommendations.

7. Close with the thesis:
   "The product is not trying to be the biggest price tracker. It is trying to become the player's gaming memory and recommendation companion."

## Key Proof Points

- Recommendation engine is inspectable.
- Companion memory has ratings, library, backlog, subscription, and radar surfaces.
- Taste memory is visible, not hidden in a black-box model.
- Companion plan compresses those surfaces into concrete next actions.
- Price/subscription claims have source/freshness discipline.
- User states change recommendations immediately.
- Adult-player signals are modeled directly: time fit, commitment, review burden.
- Data path works without expensive APIs in P0.
- Refresh policy turns price tracking into an intent-prioritized queue rather than a full-market crawl.

## Do Not Overclaim

- Do not claim live prices yet.
- Do not claim live upcoming release tracking yet.
- Do not claim full PS Store coverage yet.
- Do not present advanced notebook import as core UX.
- Do not describe this as a generic gaming chatbot.
