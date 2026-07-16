# PlaySputnik production API

The production backend is a small Cloudflare Worker. GitHub Pages remains the
frontend host. The Worker exposes:

- `GET /api/health` — provider readiness, no secret values.
- `GET /api/search?q=...` — RAWG metadata candidates, cached at the edge for
  six hours. The shared `rawg-inference-v1` normalizer derives a conservative
  taste/session profile with per-field evidence and capped confidence. Prices,
  subscription state, and languages are intentionally not claimed.
- `POST /api/narrative` — locale-aware AI copy from structured game/taste
  facts. Cloudflare Workers AI is the free prototype default; Anthropic remains
  an optional provider. Personalized responses are never cached at the edge.
- `POST /api/taste-import` — turns an arbitrary pasted ranking or game note
  into a reviewable structured draft. Nothing enters taste or library memory
  until the user confirms individual rows; unknown titles then use the existing
  RAWG resolution queue.
- `POST /api/rerank` — may reorder at most eight already-scored Today
  candidates. Server and client both keep weak candidates outside a 12-point
  deterministic quality window; all other views remain deterministic.

The public Worker deliberately does **not** expose `/api/psn`. NPSSO is a
sensitive account token; PSN import stays local until PlaySputnik has accounts,
explicit consent, encrypted token handling, revocation, and a dedicated
security review.

## Live deployment

- Worker: `https://playsputnik-api.playsputnik.workers.dev`
- GitHub Pages variable: `PLAYSPUTNIK_API_ORIGIN`
- RAWG search: active through a Cloudflare encrypted secret
- AI narratives: active through the `AI` Workers AI binding; no browser key
  and no Anthropic key are required
- Automatic Worker deployment: active through the scoped
  `CLOUDFLARE_API_TOKEN` GitHub Actions secret
- Backend monitor: active every six hours with incident issue lifecycle

The live Pages app has been browser-verified in `production` API mode with
cached RAWG search results and cover candidates.

## First deployment

No custom domain is required. Cloudflare provides a `workers.dev` HTTPS URL.

1. Create a free Cloudflare account and enable the Workers subdomain.
2. Authenticate Wrangler:

   ```sh
   npx wrangler@4 login
   ```

3. Store the RAWG provider key as a Worker secret:

   ```sh
   npx wrangler@4 secret put RAWG_API_KEY --config backend/wrangler.toml
   ```

   The `[ai]` binding in `backend/wrangler.toml` makes Workers AI available
   without another secret. `AI_PROVIDER=workers_ai` and `WORKERS_AI_MODEL`
   select the model. The browser still keeps its deterministic localized
   narrative as an instant fallback if AI is unavailable.

   Anthropic is optional. To use it later, add `ANTHROPIC_API_KEY` as a Worker
   secret and set `AI_PROVIDER=anthropic` plus `ANTHROPIC_MODEL` in
   `backend/wrangler.toml`. The endpoint contract does not change.

4. Deploy:

   ```sh
   npx wrangler@4 deploy --config backend/wrangler.toml
   ```

5. Verify the returned URL:

   ```sh
   curl https://playsputnik-api.<account>.workers.dev/api/health
   ```

## Connect GitHub Pages

In the GitHub repository:

1. Add repository variable `PLAYSPUTNIK_API_ORIGIN` with the Worker origin,
   without a trailing slash.
2. Re-run **Deploy to GitHub Pages**.

`scripts/configure-runtime.mjs` writes that public URL into the deployment
artifact. API keys never enter `runtime-config.js`, the repository, or browser
storage. If the variable is absent, the static app keeps its local/offline
fallback behavior.

## Optional backend workflow

The **Deploy production backend** workflow runs automatically when
`backend/**`, its contract/live tests, or the workflow itself changes. It can
also be started manually. Every run:

1. Executes the Worker contract test.
2. Deploys only when Cloudflare credentials are configured.
3. Probes the live Worker after deployment.

It expects:

- secret `CLOUDFLARE_API_TOKEN`
- variable `CLOUDFLARE_ACCOUNT_ID`

The account variable and scoped **Edit Cloudflare Workers** token are configured
for the live project. Do not replace this with Wrangler's broad local OAuth
token. The workflow deploys code and the Workers AI binding only; RAWG and any
optional paid-provider secrets remain stored in Cloudflare.

## Monitoring

`.github/workflows/monitor-backend.yml` runs every six hours and can be
triggered manually. It verifies:

- health contract and configured RAWG secret;
- selected AI provider/model and one small Russian-locale narrative probe;
  a non-Russian first answer is retried once before the deterministic client
  fallback takes over;
- structured taste-import and guarded Today-rerank contracts;
- allowed GitHub Pages CORS origin;
- live RAWG search with a cover candidate, structured inference provenance,
  and no invented price or subscription state;
- edge-cache `HIT` on a repeated query;
- `403` for an untrusted origin.

On failure it creates or updates one `Backend health: failing` issue. On
recovery it comments on and closes that issue. The frontend remains usable via
its local catalog and deterministic narratives during an outage.

## Local verification

```sh
./scripts/check.sh --fast
```

The normal gate runs `scripts/backend-worker-test.mjs` and
`scripts/rawg-enrichment-test.mjs`, covering CORS, health, title matching,
provenance-aware RAWG normalization, confidence caps, cache hits, provider
selection and fallback, input validation, store-data honesty, and the absence
of a public PSN endpoint.
